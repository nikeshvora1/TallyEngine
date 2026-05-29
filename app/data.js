/* ============================================================
   TallyEngine — mock data (deterministic)
   Mirrors the shape of TallyPrime read-only exports.
   ============================================================ */
(function () {
  // seeded RNG so data is stable across reloads
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(73219);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));

  const TODAY = "2026-05-29";
  function dStr(y, m, d) { return y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0"); }
  function addDays(dateStr, n) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d + n);
    return dStr(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  }

  const COMPANY = {
    name: "Anand Electricals & Hardware",
    tagline: "Wholesale Distributors — Electrical & Building Hardware",
    addr: ["No. 142, Sultanpet Main Road", "Bengaluru, Karnataka — 560053"],
    gstin: "29AABCA1234F1Z5",
    state: "Karnataka",
    stateCode: "29",
    phone: "+91 80 2287 4410",
    email: "accounts@anandelectricals.in",
    fy: "2026–27",
  };

  // ---- stock items ----
  const ITEMS = [
    { name: "Finolex 1.5 sq mm FR Wire (90m)", hsn: "8544", unit: "Coil", rate: 1245, gst: 18 },
    { name: "Finolex 2.5 sq mm FR Wire (90m)", hsn: "8544", unit: "Coil", rate: 2090, gst: 18 },
    { name: "Finolex 4.0 sq mm FR Wire (90m)", hsn: "8544", unit: "Coil", rate: 3280, gst: 18 },
    { name: "Polycab 6.0 sq mm Cable (90m)", hsn: "8544", unit: "Coil", rate: 4860, gst: 18 },
    { name: "Havells Crabtree 6A Switch", hsn: "8536", unit: "Pcs", rate: 78, gst: 18 },
    { name: "Havells 16A Switch", hsn: "8536", unit: "Pcs", rate: 124, gst: 18 },
    { name: "Anchor Roma 2-Module Plate", hsn: "8538", unit: "Pcs", rate: 96, gst: 18 },
    { name: "Anchor Roma 8-Module Plate", hsn: "8538", unit: "Pcs", rate: 268, gst: 18 },
    { name: "Legrand 6A MCB Single Pole", hsn: "8536", unit: "Pcs", rate: 210, gst: 18 },
    { name: "Legrand 32A MCB Double Pole", hsn: "8536", unit: "Pcs", rate: 540, gst: 18 },
    { name: "Hager 4-Way Distribution Box", hsn: "8537", unit: "Pcs", rate: 1180, gst: 18 },
    { name: "Hager 8-Way Distribution Box", hsn: "8537", unit: "Pcs", rate: 2240, gst: 18 },
    { name: "Crompton 1200mm Ceiling Fan", hsn: "8414", unit: "Pcs", rate: 1690, gst: 18 },
    { name: "Crompton 400mm Wall Fan", hsn: "8414", unit: "Pcs", rate: 1850, gst: 18 },
    { name: "Philips 9W LED Bulb (B22)", hsn: "9405", unit: "Pcs", rate: 92, gst: 12 },
    { name: "Philips 20W LED Batten", hsn: "9405", unit: "Pcs", rate: 320, gst: 12 },
    { name: "Wipro 18W Surface Panel", hsn: "9405", unit: "Pcs", rate: 410, gst: 12 },
    { name: "Astral 1\" UPVC Pipe (3m)", hsn: "3917", unit: "Pcs", rate: 168, gst: 18 },
    { name: "Astral 1\" Elbow Bend", hsn: "3917", unit: "Pcs", rate: 24, gst: 18 },
    { name: "PVC Insulation Tape (Box of 10)", hsn: "3919", unit: "Box", rate: 220, gst: 18 },
    { name: "GI Saddle Clamp 25mm (Pack 100)", hsn: "7326", unit: "Pack", rate: 145, gst: 18 },
    { name: "Fevicol SH 1kg", hsn: "3506", unit: "Pcs", rate: 178, gst: 18 },
    { name: "Anchor Penta 4-Pin Socket", hsn: "8536", unit: "Pcs", rate: 86, gst: 18 },
    { name: "V-Guard 4kVA Stabilizer", hsn: "8504", unit: "Pcs", rate: 2980, gst: 18 },
  ];

  // ---- parties (customers) ----
  const KA = "Karnataka", TN = "Tamil Nadu", AP = "Andhra Pradesh", MH = "Maharashtra", TG = "Telangana";
  const SC = { "Karnataka": "29", "Tamil Nadu": "33", "Andhra Pradesh": "37", "Maharashtra": "27", "Telangana": "36" };
  const partyDefs = [
    ["Sri Lakshmi Electricals", "Retailer", "Chickpet, Bengaluru", KA, 30, 500000],
    ["Bharath Hardware Stores", "Retailer", "Yeshwanthpur, Bengaluru", KA, 30, 400000],
    ["Modern Electric Co.", "Dealer", "Avenue Road, Bengaluru", KA, 45, 800000],
    ["Sunrise Contractors", "Contractor", "Whitefield, Bengaluru", KA, 45, 1200000],
    ["KSR Builders Pvt Ltd", "Contractor", "Electronic City, Bengaluru", KA, 60, 2000000],
    ["Venkateshwara Traders", "Dealer", "KR Market, Bengaluru", KA, 30, 600000],
    ["Crystal Electricals", "Retailer", "Jayanagar, Bengaluru", KA, 30, 350000],
    ["Apex Infra Solutions", "Contractor", "Hosur Road, Bengaluru", KA, 60, 1500000],
    ["New Madras Electricals", "Dealer", "T. Nagar, Chennai", TN, 45, 900000],
    ["Coromandel Hardware", "Retailer", "Coimbatore", TN, 30, 300000],
    ["Sri Balaji Agencies", "Dealer", "Vijayawada", AP, 45, 700000],
    ["Godavari Electricals", "Retailer", "Rajahmundry", AP, 30, 250000],
    ["Deccan Build Mart", "Dealer", "Hyderabad", TG, 45, 850000],
    ["Charminar Traders", "Retailer", "Secunderabad", TG, 30, 320000],
    ["Pune Power Systems", "Contractor", "Pune", MH, 60, 1100000],
    ["Sai Electricals & Hardware", "Retailer", "Mangaluru", KA, 30, 280000],
    ["Tumkur Trading Co.", "Dealer", "Tumakuru", KA, 30, 420000],
    ["Mysore Electric House", "Retailer", "Mysuru", KA, 30, 360000],
    ["Hubli Hardware Mart", "Dealer", "Hubballi", KA, 45, 540000],
    ["Greenfield Projects", "Contractor", "Sarjapur, Bengaluru", KA, 60, 1800000],
    ["Vidyut Electricals", "Retailer", "Rajajinagar, Bengaluru", KA, 30, 300000],
    ["Metro Build Solutions", "Contractor", "Marathahalli, Bengaluru", KA, 45, 1300000],
    ["Annapurna Hardware", "Retailer", "Malleshwaram, Bengaluru", KA, 30, 260000],
    ["Skyline Constructions", "Contractor", "Bellandur, Bengaluru", KA, 60, 1600000],
    ["Sri Ganesh Electricals", "Retailer", "BTM Layout, Bengaluru", KA, 30, 330000],
    ["Raj Electricals", "Dealer", "Shivajinagar, Bengaluru", KA, 45, 620000],
  ];

  function gstinFor(stateCode, i) {
    const pan = ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXY"][i % 5] + (1000 + i);
    return stateCode + pan + "M1Z" + (i % 9);
  }

  const PARTIES = partyDefs.map((p, i) => ({
    id: "P" + (i + 1),
    name: p[0], type: p[1], place: p[2], state: p[3],
    stateCode: SC[p[3]],
    gstin: gstinFor(SC[p[3]], i),
    creditDays: p[4], creditLimit: p[5],
    phone: "+91 " + between(70, 99) + between(10, 99) + " " + between(100, 999) + between(100, 999),
  }));

  // ---- compute invoice totals ----
  function computeTotals(party, lines) {
    let taxable = 0, cgst = 0, sgst = 0, igst = 0;
    const interstate = party.stateCode !== COMPANY.stateCode;
    lines.forEach((ln) => {
      const item = ITEMS[ln.itemIdx];
      const gross = ln.qty * ln.rate;
      const afterDisc = gross * (1 - (ln.disc || 0) / 100);
      ln.amount = afterDisc;
      ln.item = item;
      taxable += afterDisc;
      const tax = afterDisc * item.gst / 100;
      if (interstate) igst += tax;
      else { cgst += tax / 2; sgst += tax / 2; }
    });
    const preRound = taxable + cgst + sgst + igst;
    const grand = Math.round(preRound);
    const roundOff = grand - preRound;
    return { taxable, cgst, sgst, igst, interstate, roundOff, grand };
  }

  function makeLines(n) {
    const used = new Set();
    const lines = [];
    for (let i = 0; i < n; i++) {
      let idx; let g = 0;
      do { idx = Math.floor(rnd() * ITEMS.length); g++; } while (used.has(idx) && g < 20);
      used.add(idx);
      const it = ITEMS[idx];
      const q = it.unit === "Coil" || it.unit === "Box" || it.unit === "Pack"
        ? between(2, 30)
        : between(5, 120);
      const disc = rnd() < 0.4 ? [2, 2.5, 5, 5][between(0, 3)] : 0;
      lines.push({ itemIdx: idx, qty: q, rate: it.rate, disc });
    }
    return lines;
  }

  let voucherSeq = 0;
  function makeInvoice(date, partyId, opts) {
    opts = opts || {};
    voucherSeq++;
    const party = PARTIES.find((p) => p.id === partyId);
    const lines = makeLines(between(2, 7));
    const totals = computeTotals(party, lines);
    const no = "AE/26-27/" + String(voucherSeq).padStart(4, "0");
    const hh = String(between(9, 19)).padStart(2, "0");
    const mm = String(between(0, 59)).padStart(2, "0");
    const due = addDays(date, party.creditDays);
    return {
      id: "INV" + voucherSeq,
      no,
      ref: "REF-" + between(1000, 9999),
      date,
      time: hh + ":" + mm,
      partyId,
      party,
      lines,
      totals,
      due,
      mode: opts.mode || pick(["Credit", "Credit", "Credit", "Cash", "UPI"]),
      eway: totals.grand > 50000 ? String(between(100, 999)) + between(100000000, 999999999) : null,
      narration: pick([
        "Goods delivered to site as per order.",
        "Supplied against PO. Transport extra.",
        "Counter sale — delivered at shop.",
        "Site delivery — Anand transport.",
        "Order via phone. Balance to be cleared.",
        "",
      ]),
    };
  }

  // ---- generate the books ----
  // 1) historical sales across ~6 months for outstanding/aging (Dec 2025 – May 28)
  const HIST = [];
  const histDays = [];
  for (let i = 0; i < 180; i++) histDays.push(addDays("2025-12-01", i)); // Dec 1 .. ~May 28
  PARTIES.forEach((p) => {
    const nBills = between(4, 9);
    for (let b = 0; b < nBills; b++) {
      const date = pick(histDays);
      HIST.push(makeInvoice(date, p.id));
    }
  });

  // 2) today's sales (29 May 2026)
  const todayParties = [];
  // ensure a good spread incl. some interstate
  const order = [0, 3, 6, 8, 1, 12, 19, 4, 20, 2, 14, 9, 7, 21, 24, 17];
  order.forEach((i) => todayParties.push(PARTIES[i].id));
  const TODAY_INV = todayParties.map((pid) => makeInvoice(TODAY, pid));
  // mark today's as today's mode mix
  TODAY_INV.sort((a, b) => (a.time < b.time ? 1 : -1)); // latest first

  const ALL = HIST.concat(TODAY_INV);

  // ---- payment status & outstanding ----
  // Today's bills: open (cash/upi settled at billing). Historical: age-dependent —
  // older dues are mostly cleared, leaving a realistic tail across every bucket.
  ALL.forEach((inv) => {
    const isToday = inv.date === TODAY;
    if (isToday) {
      inv.paid = inv.mode === "Cash" || inv.mode === "UPI" ? inv.totals.grand : 0;
      inv.settled = inv.paid >= inv.totals.grand;
    } else {
      const overdue = window.fmt.ageFrom(inv.due);
      let pSettled;
      if (overdue > 90) pSettled = 0.84;
      else if (overdue > 60) pSettled = 0.76;
      else if (overdue > 30) pSettled = 0.67;
      else if (overdue > 0) pSettled = 0.56;
      else pSettled = 0.5;
      const r = rnd();
      if (r < pSettled) { inv.paid = inv.totals.grand; inv.settled = true; }
      else if (r < pSettled + 0.14) { inv.paid = Math.round(inv.totals.grand * (0.3 + rnd() * 0.4)); inv.settled = false; }
      else { inv.paid = 0; inv.settled = false; }
    }
    inv.outstanding = Math.max(0, inv.totals.grand - inv.paid);
  });

  // ---- per-party outstanding rollup ----
  const partyOutstanding = {};
  PARTIES.forEach((p) => (partyOutstanding[p.id] = { bills: [], total: 0, overdue: 0, oldest: null }));
  ALL.forEach((inv) => {
    if (inv.outstanding > 0) {
      const po = partyOutstanding[inv.partyId];
      po.bills.push(inv);
      po.total += inv.outstanding;
      if (window.fmt.ageFrom(inv.due) > 0) po.overdue += inv.outstanding;
      if (!po.oldest || inv.date < po.oldest) po.oldest = inv.date;
    }
  });

  const CUSTOMERS = PARTIES.map((p) => {
    const po = partyOutstanding[p.id];
    po.bills.sort((a, b) => (a.due < b.due ? -1 : 1));
    return {
      ...p,
      outstanding: po.total,
      overdue: po.overdue,
      openBills: po.bills.length,
      oldest: po.oldest,
      bills: po.bills,
      utilization: po.total / p.creditLimit,
    };
  });

  // ---- aging (receivables) ----
  function bucketOf(dueDate) {
    const od = window.fmt.ageFrom(dueDate); // days overdue (>0 = overdue)
    if (od <= 0) return -1;
    if (od <= 30) return 0;
    if (od <= 60) return 1;
    if (od <= 90) return 2;
    return 3;
  }
  const AGING = CUSTOMERS.filter((c) => c.outstanding > 0).map((c) => {
    const b = [0, 0, 0, 0, 0]; // notdue, 0-30, 31-60, 61-90, 90+
    c.bills.forEach((inv) => {
      const k = bucketOf(inv.due);
      b[k + 1] += inv.outstanding;
    });
    return { customer: c, notDue: b[0], b0: b[1], b1: b[2], b2: b[3], b3: b[4], total: c.outstanding };
  }).sort((a, b) => b.total - a.total);

  const AGING_TOTALS = AGING.reduce((acc, r) => {
    acc.notDue += r.notDue; acc.b0 += r.b0; acc.b1 += r.b1; acc.b2 += r.b2; acc.b3 += r.b3; acc.total += r.total;
    return acc;
  }, { notDue: 0, b0: 0, b1: 0, b2: 0, b3: 0, total: 0 });

  // ---- today's summary ----
  const todaySales = TODAY_INV.reduce((s, i) => s + i.totals.grand, 0);
  const todayCount = TODAY_INV.length;
  const todayCash = TODAY_INV.filter((i) => i.mode !== "Credit").reduce((s, i) => s + i.totals.grand, 0);
  const todayCredit = todaySales - todayCash;
  const totalReceivables = AGING_TOTALS.total;
  const totalOverdue = AGING_TOTALS.b0 + AGING_TOTALS.b1 + AGING_TOTALS.b2 + AGING_TOTALS.b3;

  window.DB = {
    COMPANY, ITEMS, PARTIES, CUSTOMERS,
    TODAY, TODAY_INV, ALL_INV: ALL,
    AGING, AGING_TOTALS,
    summary: { todaySales, todayCount, todayCash, todayCredit, totalReceivables, totalOverdue,
      openBillsCount: ALL.filter((i) => i.outstanding > 0).length },
  };
})();
