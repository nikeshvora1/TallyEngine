/* ============================================================
   TallyEngine — TallyPrime HTTP-XML gateway connector
   POSTs XML to localhost:9000; normalises responses into
   the same window.DB shape used by the mock (see data.js).

   Public API (window.Tally):
     checkConnection()         → Promise<true | false | 'cors'>
     loadLiveData(todayISO)    → Promise<DB>   (throws on failure)
   ============================================================ */
(function () {
  'use strict';

  const DEFAULT_BASE = 'http://localhost:9000';
  const STORAGE_KEY  = 'te.tallyHost';
  const TIMEOUT_MS   = 10000;

  let BASE = (() => {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE; } catch(e) { return DEFAULT_BASE; }
  })();

  function setHost(input) {
    let h = input.trim();
    if (h && !h.startsWith('http')) {
      const hasPort = /:\d+$/.test(h);
      h = 'http://' + h + (hasPort ? '' : ':9000');
    }
    BASE = h || DEFAULT_BASE;
    try { localStorage.setItem(STORAGE_KEY, BASE); } catch(e) {}
    return BASE;
  }

  function getHost() { return BASE; }

  /* ── low-level post ──────────────────────────────────────── */

  async function tallyPost(body) {
    if (/\bImport\b/i.test(body.match(/<TALLYREQUEST[^>]*>(.*?)<\/TALLYREQUEST>/i)?.[1] || '')) {
      throw new Error('TallyEngine is read-only — Import requests are blocked');
    }
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res  = await fetch(BASE, {
        method:  'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        body,
        signal: ctrl.signal,
      });
      const text = await res.text();
      return new DOMParser().parseFromString(text, 'application/xml');
    } finally {
      clearTimeout(timer);
    }
  }

  /* ── XML helpers ─────────────────────────────────────────── */

  const qs  = (el, sel) => el.querySelector(sel);
  const qsa = (el, sel) => Array.from(el.querySelectorAll(sel));
  const txt = (el, tag) => { const n = qs(el, tag); return n ? n.textContent.trim() : ''; };
  const num = (el, tag) => { const v = txt(el, tag); return v ? parseFloat(v) : 0; };

  /* ── date helpers ────────────────────────────────────────── */

  function tallyToISO(d) {            // "20260529" → "2026-05-29"
    if (!d || d.length < 8) return null;
    return d.slice(0,4) + '-' + d.slice(4,6) + '-' + d.slice(6,8);
  }
  function isoToTally(d) {            // "2026-05-29" → "20260529"
    return d.replace(/-/g, '');
  }
  function fyStart(dateStr) {         // Indian FY: starts April 1
    const y = parseInt(dateStr.slice(0,4));
    const m = parseInt(dateStr.slice(5,7));
    return (m >= 4 ? y : y - 1) + '-04-01';
  }
  function addDays(dateStr, n) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    return dt.getFullYear() + '-' +
      String(dt.getMonth() + 1).padStart(2,'0') + '-' +
      String(dt.getDate()).padStart(2,'0');
  }

  /* ── request builder ─────────────────────────────────────── */

  function collectionReq(id, tdlBody, vars) {
    const varXml = vars
      ? Object.entries(vars).map(([k, v]) => `<${k}>${v}</${k}>`).join('\n            ')
      : '';
    return `<ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>${id}</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            ${varXml}
          </STATICVARIABLES>
          <TDL><TDLMESSAGE>
            ${tdlBody}
          </TDLMESSAGE></TDL>
        </DESC>
      </BODY>
    </ENVELOPE>`;
  }

  /* ── 1. CONNECTION CHECK ─────────────────────────────────── */

  async function checkConnection() {
    try {
      const doc = await tallyPost(
        `<ENVELOPE><HEADER><VERSION>1</VERSION>
           <TALLYREQUEST>Export</TALLYREQUEST>
           <TYPE>Collection</TYPE>
           <ID>List of Companies</ID>
         </HEADER>
         <BODY><DESC><STATICVARIABLES>
           <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
         </STATICVARIABLES></DESC></BODY>
        </ENVELOPE>`
      );
      if (qs(doc, 'parsererror')) return false;
      // Any valid XML back from Tally = gateway is up
      return true;
    } catch (e) {
      // TypeError with "Failed to fetch" or "NetworkError" is a CORS/network block
      if (e instanceof TypeError) return 'cors';
      return false;
    }
  }

  /* ── 2. COMPANY ──────────────────────────────────────────── */

  async function fetchCompany() {
    const doc = await tallyPost(collectionReq('TECompany', `
      <COLLECTION NAME="TECompany" ISMODIFY="No">
        <TYPE>Company</TYPE>
        <FETCH>Name,Address,GSTIN,GSTREGISTRATIONNUMBER,StateName,PinCode,PhoneNumber,Email</FETCH>
      </COLLECTION>`
    ));
    const co = qs(doc, 'COMPANY');
    if (!co) return null;

    const name   = txt(co, 'NAME') || '';
    const gstin  = txt(co, 'GSTIN') || txt(co, 'GSTREGISTRATIONNUMBER') || '';
    const state  = txt(co, 'STATENAME') || '';
    const addrs  = qsa(co, 'ADDRESS').map(a => a.textContent.trim()).filter(Boolean);
    const phone  = txt(co, 'PHONENUMBER') || txt(co, 'PHONE') || '';
    const email  = txt(co, 'EMAIL') || '';

    // Derive FY label from current date
    const now = new Date();
    const fyY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fy  = fyY + '–' + String(fyY + 1).slice(2);

    return { name, tagline: '', addr: addrs.length ? addrs : [''], gstin,
             state, stateCode: gstin.slice(0,2) || '', phone, email, fy };
  }

  /* ── 3. SALES VOUCHERS ───────────────────────────────────── */
  /*
   * Fetches all Sales vouchers in [from, to] with full inventory
   * and ledger entries. Parses into the inv shape used by the UI.
   */

  async function fetchSalesVouchers(from, to) {
    const doc = await tallyPost(collectionReq('TESalesVch', `
      <COLLECTION NAME="TESalesVch" ISMODIFY="No" ISFIXED="No" ISINITIALIZE="No" ISOPTION="No" ISINTERNAL="No">
        <TYPE>Vouchers</TYPE>
        <BELONGSTO>Yes</BELONGSTO>
        <FILTER>IsSalesVch</FILTER>
        <FETCH>Date,VoucherNumber,VoucherTypeName,PartyLedgerName,Narration,Amount,Reference,
               BILLALLOCATIONS.Name,BILLALLOCATIONS.Amount,BILLALLOCATIONS.DueDate,
               ALLLEDGERENTRIES.LedgerName,ALLLEDGERENTRIES.Amount,ALLLEDGERENTRIES.IsDeemedPositive,
               INVENTORYENTRIES.StockItemName,INVENTORYENTRIES.Rate,INVENTORYENTRIES.ActualQty,
               INVENTORYENTRIES.BilledQty,INVENTORYENTRIES.Amount,INVENTORYENTRIES.Discount,
               INVENTORYENTRIES.HSNCode</FETCH>
      </COLLECTION>
      <SYSTEM TYPE="Formulae" NAME="IsSalesVch">$$IsEqual:$VoucherTypeName:"Sales"</SYSTEM>`,
      { SVFROMDATE: isoToTally(from), SVTODATE: isoToTally(to) }
    ));
    return qsa(doc, 'VOUCHER').map(parseVoucher);
  }

  function parseVoucher(v) {
    const date  = tallyToISO(txt(v, 'DATE'));
    const no    = txt(v, 'VOUCHERNUMBER') || '';
    const party = txt(v, 'PARTYLEDGERNAME') || txt(v, 'BASICBUYERNAME') || '';
    const ref   = txt(v, 'REFERENCE') || '';
    const narr  = txt(v, 'NARRATION') || '';

    // Ledger entries — identify tax lines and payment mode
    const ledgers = qsa(v, 'ALLLEDGERENTRIES\\.LIST').map(le => ({
      name:   txt(le, 'LEDGERNAME').toLowerCase(),
      amount: num(le, 'AMOUNT'),
      debit:  txt(le, 'ISDEEMEDPOSITIVE') === 'Yes',
    }));

    // Inventory lines
    const lines = qsa(v, 'INVENTORYENTRIES\\.LIST').map(ie => {
      const rateRaw = txt(ie, 'RATE');               // "1245/Coil" or "1245.00"
      const rate    = parseFloat(rateRaw) || 0;
      const qtyRaw  = txt(ie, 'BILLEDQTY') || txt(ie, 'ACTUALQTY'); // "10.00 Coil"
      const qty     = parseFloat(qtyRaw) || 0;
      const unit    = qtyRaw.replace(/[\d.\s-]/g, '').trim();
      const amount  = Math.abs(num(ie, 'AMOUNT'));
      const disc    = parseFloat(txt(ie, 'DISCOUNT')) || 0;
      const hsn     = txt(ie, 'HSNCODE') || txt(ie, 'HSN') || '';
      return {
        item: { name: txt(ie, 'STOCKITEMNAME'), hsn, unit, rate, gst: 18 },
        qty, rate, disc, amount,
      };
    });

    // Derive tax split from ledger entries
    let cgst = 0, sgst = 0, igst = 0;
    ledgers.forEach(({ name: n, amount: a }) => {
      const abs = Math.abs(a);
      if      (n.includes('cgst')) cgst += abs;
      else if (n.includes('sgst')) sgst += abs;
      else if (n.includes('igst')) igst += abs;
    });

    const taxable    = lines.reduce((s, l) => s + l.amount, 0)
                     || Math.abs(num(v, 'AMOUNT')) - cgst - sgst - igst; // fallback
    const preTax     = taxable + cgst + sgst + igst;
    const grand      = Math.round(preTax);
    const roundOff   = grand - preTax;
    const interstate = igst > 0;

    // Bill allocations — first one gives the due date
    const bills = qsa(v, 'BILLALLOCATIONS\\.LIST').map(b => ({
      name:    txt(b, 'NAME'),
      amount:  Math.abs(num(b, 'AMOUNT')),
      dueDate: tallyToISO(txt(b, 'DUEDATE')),
    }));
    const due = bills[0]?.dueDate || (date ? addDays(date, 30) : null);

    // Payment mode: look for Cash/UPI ledger on credit side
    let mode = 'Credit';
    ledgers.forEach(({ name: n, debit }) => {
      if (debit) return;  // debtor side — skip
      if      (n === 'cash') mode = 'Cash';
      else if (n.includes('upi') || n.includes('gpay') || n.includes('paytm') ||
               n.includes('phonepe') || n.includes('neft') || n.includes('rtgs')) mode = 'UPI';
    });

    // E-way bill: not available from standard XML export — omit
    const eway = null;

    return {
      id:        'INV_' + (no || Math.random().toString(36).slice(2)).replace(/\W/g, '_'),
      no, ref, date, time: '00:00',
      partyName: party,
      lines, narration: narr,
      totals: { taxable, cgst, sgst, igst, interstate, roundOff: roundOff || 0, grand },
      due, mode, eway,
      bills,
    };
  }

  /* ── 4. SUNDRY DEBTORS ───────────────────────────────────── */
  /*
   * Fetches all ledgers under the "Sundry Debtors" group.
   * Each ledger's BILLALLOCATIONS represent its open (outstanding) bills.
   * TallyPrime only returns non-zero bill allocations in this context.
   */

  async function fetchDebtors() {
    const doc = await tallyPost(collectionReq('TEDebtors', `
      <COLLECTION NAME="TEDebtors" ISMODIFY="No">
        <TYPE>Ledger</TYPE>
        <CHILDOF>Sundry Debtors</CHILDOF>
        <FETCH>Name,GUID,Address,GSTIN,GSTREGISTRATIONNUMBER,StateName,PinCode,
               PhoneNumber,Email,CreditLimit,CreditPeriod,ClosingBalance,
               BILLALLOCATIONS.Name,BILLALLOCATIONS.Amount,BILLALLOCATIONS.DueDate,
               BILLALLOCATIONS.BillDate</FETCH>
      </COLLECTION>`
    ));

    return qsa(doc, 'LEDGER').map((l, i) => {
      const name      = txt(l, 'NAME') || '';
      const gstin     = txt(l, 'GSTIN') || txt(l, 'GSTREGISTRATIONNUMBER') || '';
      const state     = txt(l, 'STATENAME') || '';
      const addr      = qsa(l, 'ADDRESS').map(a => a.textContent.trim()).filter(Boolean).join(', ');
      const creditDays= parseInt(txt(l, 'CREDITPERIOD')) || 30;  // "30 Days" → 30
      const creditLim = Math.abs(num(l, 'CREDITLIMIT')) || 500000;

      // Bill allocations on a Ledger = outstanding bills (TallyPrime only returns non-zero)
      const openBillEls = qsa(l, 'BILLALLOCATIONS\\.LIST');

      return {
        id:          'P_' + (i + 1),
        name, type:  'Customer',
        place:       addr || state,
        state,       stateCode: gstin.slice(0,2) || '',
        gstin, creditDays, creditLimit: creditLim,
        phone: txt(l, 'PHONENUMBER') || txt(l, 'PHONE') || '',
        _openBillEls,  // raw XML nodes, used in assembleDB
      };
    });
  }

  /* ── 5. ASSEMBLE window.DB ───────────────────────────────── */

  async function loadLiveData(today) {
    // Update the fmt module's reference date so aging is computed correctly
    window.fmt.TODAY = today;

    const fy = fyStart(today);

    const [company, debtors, fyVouchers] = await Promise.all([
      fetchCompany(),
      fetchDebtors(),
      fetchSalesVouchers(fy, today),
    ]);

    const COMPANY = company || window.DB.COMPANY;

    // Build party lookup by lower-cased name
    const partyByName = {};
    debtors.forEach(d => { partyByName[d.name.trim().toLowerCase()] = d; });

    // Attach party objects to each voucher
    const allVouchers = fyVouchers.map(inv => {
      const key   = (inv.partyName || '').trim().toLowerCase();
      const party = partyByName[key] || {
        id: 'P_unk_' + key.slice(0,8).replace(/\W/g,''),
        name: inv.partyName, type: 'Customer', place: '', state: '',
        stateCode: '', gstin: '', creditDays: 30, creditLimit: 0, _openBillEls: [],
      };
      return { ...inv, partyId: party.id, party };
    });

    // Today's invoices, most-recent first
    const TODAY_INV = allVouchers
      .filter(inv => inv.date === today)
      .sort((a, b) => (a.time < b.time ? 1 : -1));

    // Mark all FY vouchers as settled by default; outstanding will be set
    // below when we match them against the open bill allocations from the ledger
    allVouchers.forEach(inv => {
      inv.outstanding = inv.outstanding ?? 0;
      inv.paid        = inv.paid        ?? inv.totals.grand;
      inv.settled     = inv.settled     ?? true;
    });

    // Build indexed voucher lookup by voucher number (for bill matching)
    const vchByNo = {};
    allVouchers.forEach(inv => { if (inv.no) vchByNo[inv.no] = inv; });

    // Build CUSTOMERS with outstanding data from ledger bill allocations
    const CUSTOMERS = debtors.map(d => {
      const bills = d._openBillEls.map(b => {
        const billName = txt(b, 'NAME');
        const amt      = Math.abs(num(b, 'AMOUNT'));
        const dueDate  = tallyToISO(txt(b, 'DUEDATE'));
        const billDate = tallyToISO(txt(b, 'BILLDATE')) || tallyToISO(txt(b, 'DATE'));

        // Try to link to a known voucher
        const linked = vchByNo[billName];
        if (linked) {
          linked.outstanding = amt;
          linked.paid        = Math.max(0, linked.totals.grand - amt);
          linked.settled     = amt <= 0;
          if (dueDate) linked.due = dueDate;
          return linked;
        }

        // Create a minimal stub for bills not in the FY window
        const inferredDate = billDate || (dueDate ? addDays(dueDate, -d.creditDays) : today);
        return {
          id:        'STUB_' + billName.replace(/\W/g, '_'),
          no:        billName, ref: '', date: inferredDate, time: '00:00',
          partyId:   d.id, party: d,
          lines:     [], narration: '', eway: null, mode: 'Credit',
          totals:    { grand: amt, taxable: amt, cgst: 0, sgst: 0, igst: 0, roundOff: 0, interstate: false },
          due:       dueDate || (inferredDate ? addDays(inferredDate, d.creditDays) : today),
          outstanding: amt, paid: 0, settled: false,
        };
      });

      const total    = bills.reduce((s, b) => s + (b.outstanding || 0), 0);
      const overdue  = bills
        .filter(b => b.due && window.fmt.ageFrom(b.due) > 0)
        .reduce((s, b) => s + (b.outstanding || 0), 0);
      const oldest   = bills.reduce((m, b) => (!m || (b.date && b.date < m) ? b.date : m), null);

      return {
        ...d,
        outstanding: total, overdue,
        openBills:   bills.length,
        oldest, bills,
        utilization: d.creditLimit > 0 ? total / d.creditLimit : 0,
      };
    });

    // ALL_INV = FY vouchers + any stubs not already in the list
    const ALL_INV = [...allVouchers];
    CUSTOMERS.forEach(c => {
      c.bills.forEach(b => {
        if (!ALL_INV.find(i => i.id === b.id)) ALL_INV.push(b);
      });
    });

    // Aging
    function bucketOf(dueDate) {
      if (!dueDate) return -1;
      const od = window.fmt.ageFrom(dueDate);
      if (od <= 0) return -1;
      if (od <= 30) return 0;
      if (od <= 60) return 1;
      if (od <= 90) return 2;
      return 3;
    }

    const AGING = CUSTOMERS.filter(c => c.outstanding > 0).map(c => {
      const b = [0, 0, 0, 0, 0];
      c.bills.forEach(inv => { b[bucketOf(inv.due) + 1] += (inv.outstanding || 0); });
      return { customer: c, notDue: b[0], b0: b[1], b1: b[2], b2: b[3], b3: b[4], total: c.outstanding };
    }).sort((a, b) => b.total - a.total);

    const AGING_TOTALS = AGING.reduce((acc, r) => ({
      notDue: acc.notDue + r.notDue,
      b0: acc.b0 + r.b0, b1: acc.b1 + r.b1,
      b2: acc.b2 + r.b2, b3: acc.b3 + r.b3,
      total: acc.total + r.total,
    }), { notDue: 0, b0: 0, b1: 0, b2: 0, b3: 0, total: 0 });

    const todaySales = TODAY_INV.reduce((s, i) => s + i.totals.grand, 0);
    const todayCash  = TODAY_INV.filter(i => i.mode !== 'Credit').reduce((s, i) => s + i.totals.grand, 0);

    return {
      COMPANY,
      ITEMS:   [],
      PARTIES: debtors,
      CUSTOMERS,
      TODAY:   today,
      TODAY_INV,
      ALL_INV,
      AGING,
      AGING_TOTALS,
      summary: {
        todaySales,
        todayCount:       TODAY_INV.length,
        todayCash,
        todayCredit:      todaySales - todayCash,
        totalReceivables: AGING_TOTALS.total,
        totalOverdue:     AGING_TOTALS.b0 + AGING_TOTALS.b1 + AGING_TOTALS.b2 + AGING_TOTALS.b3,
        openBillsCount:   ALL_INV.filter(i => (i.outstanding || 0) > 0).length,
      },
      isLive: true,
    };
  }

  /* ── public API ──────────────────────────────────────────── */
  window.Tally = { checkConnection, loadLiveData, setHost, getHost };
})();
