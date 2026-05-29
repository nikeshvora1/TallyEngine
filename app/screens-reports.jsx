/* ============================================================
   TallyEngine — Reports hub + report screens
   ============================================================ */

const AGE_COLS = [
  { key: "notDue", label: "Not due", color: "var(--ink-3)" },
  { key: "b0", label: "0–30 days", color: "var(--age0)" },
  { key: "b1", label: "31–60 days", color: "var(--age1)" },
  { key: "b2", label: "61–90 days", color: "var(--age2)" },
  { key: "b3", label: "90+ days", color: "var(--age3)" },
];

/* ---------------- Reports hub ---------------- */
const REPORT_CARDS = [
  { id: "rep-aging-sum", icon: "scale", name: "Aging Summary", desc: "Receivables bucketed by overdue period, per customer.", tag: "Receivables" },
  { id: "rep-aging-det", icon: "list", name: "Aging Details", desc: "Every open bill with exact days overdue and bucket.", tag: "Receivables" },
  { id: "rep-receivables", icon: "rupee", name: "Outstanding Receivables", desc: "All unsettled bills, oldest first, with due dates.", tag: "Receivables" },
  { id: "rep-daybook", icon: "book", name: "Day Book", desc: "Chronological log of all vouchers for the day.", tag: "Daily" },
  { id: "rep-sales", icon: "receipt", name: "Sales Register", desc: "Period sales with taxable value and GST split.", tag: "Sales" },
  { id: "rep-stock", icon: "box", name: "Stock Summary", desc: "Closing quantities and value by item.", tag: "Inventory", soon: true },
  { id: "rep-ledger", icon: "users", name: "Ledger Statement", desc: "Account-wise debit/credit movement.", tag: "Accounts", soon: true },
  { id: "rep-gst", icon: "file", name: "GSTR-1 Summary", desc: "Outward supplies grouped by GST rate.", tag: "Compliance", soon: true },
  { id: "rep-pnl", icon: "trend", name: "Profit & Loss", desc: "Income and expense statement for the period.", tag: "Final", soon: true },
];

function ReportsHub({ go }) {
  const toast = useToast();
  const groups = {};
  REPORT_CARDS.forEach((r) => { (groups[r.tag] = groups[r.tag] || []).push(r); });
  return (
    <>
      <Topbar crumbs={[{ label: "Reports" }]} title="All Reports"
        onRefresh={() => toast.push({ title: "Synced with Tally", icon: "refresh" })} />
      <div className="content">
        <div className="content-inner wide">
          <p className="muted" style={{ marginTop: -4, marginBottom: 22, maxWidth: 620 }}>
            Read-only reports generated live from TallyPrime. Receivables &amp; aging are based on
            voucher due dates as on <b style={{ color: "var(--ink)" }}>{window.fmt.fmtDate(window.DB.TODAY)}</b>.
          </p>
          {Object.keys(groups).map((g) => (
            <div key={g} style={{ marginBottom: 26 }}>
              <div className="section-title">{g}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {groups[g].map((r) => (
                  <div key={r.id} className="card card-pad" style={{ cursor: r.soon ? "default" : "pointer", opacity: r.soon ? 0.66 : 1, display: "flex", gap: 14, alignItems: "flex-start" }}
                    onClick={() => !r.soon && go(r.id)}>
                    <div className="avatar sq" style={{ background: "var(--surface-3)", color: "var(--ink-2)" }}><Icon name={r.icon} size={18} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.name}</div>
                        {r.soon ? <span className="badge badge-neutral">Soon</span> : <Icon name="arrowUR" size={15} style={{ color: "var(--ink-4)" }} className="ico" />}
                      </div>
                      <div className="muted" style={{ fontSize: 12.5, marginTop: 3, lineHeight: 1.45 }}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* report scaffold: crumb + export */
function ReportShell({ title, sub, go, children, exportLabel }) {
  const toast = useToast();
  return (
    <>
      <Topbar
        crumbs={[{ label: "Reports", onClick: () => go("reports") }, { label: title }]}
        title={title}
        onRefresh={() => toast.push({ title: "Synced with Tally", icon: "refresh" })}
        right={<div className="row gap10">
          <button className="btn btn-ghost" onClick={() => simulateDownload(toast, "Exporting " + title + ".xlsx…", "")}><Icon name="grid" size={16} />Excel</button>
          <button className="btn btn-pri" onClick={() => simulateDownload(toast, "Preparing " + title.replace(/ /g, "-") + ".pdf…", exportLabel || ("As on " + window.fmt.fmtDate(window.DB.TODAY)))}><Icon name="download" size={16} />PDF</button>
        </div>}
      />
      <div className="content"><div className="content-inner wide">
        {sub && <p className="muted" style={{ marginTop: -4, marginBottom: 20 }}>{sub}</p>}
        {children}
      </div></div>
    </>
  );
}

/* ---------------- Aging Summary ---------------- */
function AgingSummary({ go }) {
  const T = window.DB.AGING_TOTALS;
  const rows = window.DB.AGING;
  const maxTotal = Math.max(...rows.map((r) => r.total));

  return (
    <ReportShell title="Aging Summary" go={go}
      sub={"Outstanding receivables grouped into overdue buckets, per customer. As on " + window.fmt.fmtDate(window.DB.TODAY) + "."}>
      {/* bucket headline cards */}
      <div className="stat-row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {AGE_COLS.map((col) => (
          <div className="stat" key={col.key}>
            <div className="k"><span style={{ width: 9, height: 9, borderRadius: 3, background: col.color, display: "inline-block" }} />{col.label}</div>
            <div className="v" style={{ fontSize: 21 }}>{window.fmt.inrShort(T[col.key])}</div>
            <div className="d">{Math.round(T[col.key] / T.total * 100)}% of total</div>
          </div>
        ))}
      </div>

      {/* distribution bar */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="section-title" style={{ margin: 0 }}>Portfolio distribution</div>
          <div className="amt" style={{ fontWeight: 700 }}>{window.fmt.inr(T.total, { decimals: 0 })} total</div>
        </div>
        <div className="split-bar">
          {AGE_COLS.map((col) => {
            const w = T[col.key] / T.total * 100;
            if (w < 0.5) return null;
            return <div key={col.key} style={{ width: w + "%", background: col.color }} title={col.label}>{w > 7 ? Math.round(w) + "%" : ""}</div>;
          })}
        </div>
        <div className="row" style={{ gap: 18, marginTop: 12, flexWrap: "wrap" }}>
          {AGE_COLS.map((col) => (
            <span key={col.key} className="row gap6" style={{ fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: col.color }} />
              <span className="muted">{col.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>By customer</h3><span className="sub">{rows.length} customers with dues · sorted by total</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Customer</th>
                {AGE_COLS.map((c) => <th key={c.key} className="r">{c.label}</th>)}
                <th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.customer.id} className="clickable" onClick={() => go("customer", r.customer.id)}>
                  <td>
                    <div className="row gap10">
                      <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{window.fmt.initials(r.customer.name)}</div>
                      <div><div className="cell-strong">{r.customer.name}</div><div className="cell-sub">{r.customer.place}</div></div>
                    </div>
                  </td>
                  {AGE_COLS.map((c) => (
                    <td key={c.key} className="r amt" style={{ color: r[c.key] > 0 ? (c.key === "b3" || c.key === "b2" ? "var(--danger-ink)" : "var(--ink)") : "var(--ink-4)" }}>
                      {r[c.key] > 0 ? window.fmt.inr(r[c.key], { decimals: 0 }) : "—"}
                    </td>
                  ))}
                  <td className="r amt cell-strong">{window.fmt.inr(r.total, { decimals: 0 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 700 }}>Grand total</td>
                {AGE_COLS.map((c) => <td key={c.key} className="r amt">{window.fmt.inr(T[c.key], { decimals: 0 })}</td>)}
                <td className="r amt" style={{ fontSize: 15 }}>{window.fmt.inr(T.total, { decimals: 0 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </ReportShell>
  );
}

/* ---------------- Aging Details (bill-by-bill) ---------------- */
function AgingDetails({ go }) {
  const [bucket, setBucket] = useState("all");
  // flatten all open bills
  const bills = window.DB.ALL_INV.filter((i) => i.outstanding > 0).map((inv) => {
    const od = window.fmt.ageFrom(inv.due);
    const b = window.fmt.agingBucket(od);
    return { inv, od, b };
  }).sort((a, b) => b.od - a.od);

  const filtered = bucket === "all" ? bills : bills.filter((x) => x.b.i === Number(bucket));
  const total = filtered.reduce((s, x) => s + x.inv.outstanding, 0);

  return (
    <ReportShell title="Aging Details" go={go}
      sub={"Every outstanding bill with its exact age and aging bucket. As on " + window.fmt.fmtDate(window.DB.TODAY) + "."}>
      <div className="toolbar">
        <div className="seg">
          <button className={bucket === "all" ? "on" : ""} onClick={() => setBucket("all")}>All buckets</button>
          {[-1, 0, 1, 2, 3].map((i) => {
            const labels = { "-1": "Not due", 0: "0–30", 1: "31–60", 2: "61–90", 3: "90+" };
            return <button key={i} className={bucket === String(i) ? "on" : ""} onClick={() => setBucket(String(i))}>{labels[i]}</button>;
          })}
        </div>
        <span className="result-count">{filtered.length} bills · {window.fmt.inr(total, { decimals: 0 })}</span>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Voucher</th><th>Customer</th><th>Bill date</th><th>Due date</th>
                <th className="r">Days overdue</th><th>Bucket</th>
                <th className="r">Bill amount</th><th className="r">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ inv, od, b }) => (
                <tr key={inv.id} className="clickable" onClick={() => go("invoice", inv.id)}>
                  <td className="mono cell-strong">{inv.no}</td>
                  <td><div className="cell-strong">{inv.party.name}</div><div className="cell-sub">{inv.party.place}</div></td>
                  <td className="muted">{window.fmt.fmtDateShort(inv.date)}</td>
                  <td className="muted">{window.fmt.fmtDateShort(inv.due)}</td>
                  <td className="r num" style={{ fontWeight: 600, color: od > 0 ? "var(--danger-ink)" : "var(--ink-4)" }}>{od > 0 ? od : "—"}</td>
                  <td><span className="badge" style={{ background: "color-mix(in oklch, " + b.color + " 14%, white)", color: b.color }}><span className="bd" />{b.label}</span></td>
                  <td className="r amt muted">{window.fmt.inr(inv.totals.grand, { decimals: 0 })}</td>
                  <td className="r amt cell-strong">{window.fmt.inr(inv.outstanding, { decimals: 0 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7} style={{ fontWeight: 700, color: "var(--ink-2)" }}>{filtered.length} bills</td>
                <td className="r amt" style={{ fontSize: 15 }}>{window.fmt.inr(total, { decimals: 0 })}</td>
              </tr>
            </tfoot>
          </table>
          {filtered.length === 0 && <Empty title="No bills in this bucket" sub="Pick a different aging range." />}
        </div>
      </div>
    </ReportShell>
  );
}

/* ---------------- Outstanding Receivables ---------------- */
function Receivables({ go }) {
  const bills = window.DB.ALL_INV.filter((i) => i.outstanding > 0).sort((a, b) => (a.due < b.due ? -1 : 1));
  const total = bills.reduce((s, i) => s + i.outstanding, 0);
  return (
    <ReportShell title="Outstanding Receivables" go={go}
      sub={"All unsettled bills, oldest due first. As on " + window.fmt.fmtDate(window.DB.TODAY) + "."}>
      <div className="card">
        <div className="card-head"><h3>Open bills</h3><span className="sub">{bills.length} bills · {window.fmt.inr(total, { decimals: 0 })}</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Voucher</th><th>Customer</th><th>Bill date</th><th>Due date</th><th>Status</th><th className="r">Bill amount</th><th className="r">Paid</th><th className="r">Outstanding</th></tr>
            </thead>
            <tbody>
              {bills.map((inv) => (
                <tr key={inv.id} className="clickable" onClick={() => go("invoice", inv.id)}>
                  <td className="mono cell-strong">{inv.no}</td>
                  <td className="cell-strong">{inv.party.name}</td>
                  <td className="muted">{window.fmt.fmtDateShort(inv.date)}</td>
                  <td className="muted">{window.fmt.fmtDateShort(inv.due)}</td>
                  <td><StatusBadge inv={inv} /></td>
                  <td className="r amt muted">{window.fmt.inr(inv.totals.grand, { decimals: 0 })}</td>
                  <td className="r amt muted">{inv.paid > 0 ? window.fmt.inr(inv.paid, { decimals: 0 }) : "—"}</td>
                  <td className="r amt cell-strong">{window.fmt.inr(inv.outstanding, { decimals: 0 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={7} style={{ fontWeight: 700, color: "var(--ink-2)" }}>Total outstanding</td><td className="r amt" style={{ fontSize: 15 }}>{window.fmt.inr(total, { decimals: 0 })}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </ReportShell>
  );
}

/* ---------------- Day Book ---------------- */
function DayBook({ go }) {
  const rows = window.DB.TODAY_INV.slice().sort((a, b) => (a.time < b.time ? -1 : 1));
  const total = rows.reduce((s, i) => s + i.totals.grand, 0);
  return (
    <ReportShell title="Day Book" go={go} sub={"Chronological log of all vouchers for " + window.fmt.fmtDate(window.DB.TODAY) + "."}>
      <div className="card">
        <div className="card-head"><h3>{"Vouchers — " + window.fmt.fmtDate(window.DB.TODAY)}</h3><span className="sub">{rows.length} entries</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Time</th><th>Voucher No.</th><th>Type</th><th>Particulars</th><th>Mode</th><th className="r">Amount</th></tr></thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id} className="clickable" onClick={() => go("invoice", inv.id)}>
                  <td className="mono muted" style={{ fontSize: 12.5 }}>{inv.time}</td>
                  <td className="mono cell-strong">{inv.no}</td>
                  <td><span className="badge badge-accent">Sales</span></td>
                  <td className="cell-strong">{inv.party.name} <span className="muted" style={{ fontWeight: 400 }}>· {inv.party.place}</span></td>
                  <td><ModeBadge mode={inv.mode} /></td>
                  <td className="r amt cell-strong">{window.fmt.inr(inv.totals.grand)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={5} style={{ fontWeight: 700, color: "var(--ink-2)" }}>Total sales for the day</td><td className="r amt" style={{ fontSize: 15 }}>{window.fmt.inr(total)}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </ReportShell>
  );
}

/* ---------------- Sales Register ---------------- */
function SalesRegister({ go }) {
  // group all invoices in FY by date — but keep it focused: show recent days with totals
  const byDate = {};
  window.DB.ALL_INV.forEach((inv) => {
    const k = inv.date;
    if (!byDate[k]) byDate[k] = { date: k, count: 0, taxable: 0, gst: 0, total: 0 };
    byDate[k].count++; byDate[k].taxable += inv.totals.taxable;
    byDate[k].gst += inv.totals.cgst + inv.totals.sgst + inv.totals.igst;
    byDate[k].total += inv.totals.grand;
  });
  const rows = Object.values(byDate).sort((a, b) => (a.date < b.date ? 1 : -1));
  const tot = rows.reduce((a, r) => ({ count: a.count + r.count, taxable: a.taxable + r.taxable, gst: a.gst + r.gst, total: a.total + r.total }), { count: 0, taxable: 0, gst: 0, total: 0 });
  return (
    <ReportShell title="Sales Register" go={go} sub={"Day-wise sales for FY " + window.DB.COMPANY.fy + " with taxable value and GST. Latest first."}>
      <div className="stat-row">
        <StatCard icon="trend" k="Total sales (FY)" cur v={window.fmt.inr(tot.total, { noSymbol: true, decimals: 0 })} d={tot.count + " invoices"} />
        <StatCard icon="scale" k="Taxable value" cur v={window.fmt.inr(tot.taxable, { noSymbol: true, decimals: 0 })} d="Net of discounts" />
        <StatCard icon="file" k="GST collected" cur v={window.fmt.inr(tot.gst, { noSymbol: true, decimals: 0 })} d="CGST + SGST + IGST" />
        <StatCard icon="calendar" k="Active days" v={rows.length} d="With at least 1 sale" />
      </div>
      <div className="card">
        <div className="card-head"><h3>Day-wise</h3><span className="sub">{rows.length} days</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Date</th><th className="c">Invoices</th><th className="r">Taxable value</th><th className="r">GST</th><th className="r">Total sales</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className={r.date === window.DB.TODAY ? "clickable" : ""} onClick={() => r.date === window.DB.TODAY && go("rep-daybook")}>
                  <td className="cell-strong">{window.fmt.fmtDate(r.date)}{r.date === window.DB.TODAY && <span className="badge badge-accent" style={{ marginLeft: 8 }}>Today</span>}</td>
                  <td className="c num">{r.count}</td>
                  <td className="r amt muted">{window.fmt.inr(r.taxable, { decimals: 0 })}</td>
                  <td className="r amt muted">{window.fmt.inr(r.gst, { decimals: 0 })}</td>
                  <td className="r amt cell-strong">{window.fmt.inr(r.total, { decimals: 0 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td style={{ fontWeight: 700 }}>Total</td><td className="c num" style={{ fontWeight: 700 }}>{tot.count}</td><td className="r amt">{window.fmt.inr(tot.taxable, { decimals: 0 })}</td><td className="r amt">{window.fmt.inr(tot.gst, { decimals: 0 })}</td><td className="r amt" style={{ fontSize: 15 }}>{window.fmt.inr(tot.total, { decimals: 0 })}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </ReportShell>
  );
}

Object.assign(window, { ReportsHub, AgingSummary, AgingDetails, Receivables, DayBook, SalesRegister });
