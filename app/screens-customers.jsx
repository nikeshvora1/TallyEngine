/* ============================================================
   TallyEngine — Customers & Outstanding
   ============================================================ */

function utilBar(u) {
  const pct = Math.min(100, Math.round(u * 100));
  const color = u >= 0.9 ? "var(--danger)" : u >= 0.7 ? "var(--warn)" : "var(--ok)";
  return (
    <div style={{ minWidth: 110 }}>
      <div className="row" style={{ justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
        <span className="muted num">{pct}%</span>
      </div>
      <div className="bar-track"><div className="bar-seg" style={{ width: pct + "%", background: color }} /></div>
    </div>
  );
}

function Customers({ go }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("outstanding");
  const [filter, setFilter] = useState("all");

  const customers = window.DB.CUSTOMERS;
  const totalRec = window.DB.summary.totalReceivables;
  const totalOverdue = window.DB.summary.totalOverdue;

  let rows = customers.filter((c) => {
    if (filter === "outstanding" && c.outstanding <= 0) return false;
    if (filter === "overdue" && c.overdue <= 0) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.place.toLowerCase().includes(q);
    }
    return true;
  });
  rows = [...rows].sort((a, b) => {
    if (sort === "outstanding") return b.outstanding - a.outstanding;
    if (sort === "overdue") return b.overdue - a.overdue;
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "oldest") return (a.oldest || "9999") < (b.oldest || "9999") ? -1 : 1;
    return 0;
  });

  const withOutstanding = customers.filter((c) => c.outstanding > 0).length;

  return (
    <>
      <Topbar
        crumbs={[{ label: "Receivables" }, { label: "Customers" }]}
        title="Customers & Outstanding"
        search={search} setSearch={setSearch}
        onRefresh={() => toast.push({ title: "Synced with Tally", sub: "Bills outstanding refreshed", icon: "refresh" })}
        right={<button className="btn btn-ghost" onClick={() => go("rep-receivables")}><Icon name="list" size={16} />Bill-wise view</button>}
      />
      <div className="content">
        <div className="content-inner wide">
          <div className="stat-row">
            <StatCard icon="rupee" k="Total receivable" cur v={window.fmt.inr(totalRec, { noSymbol: true, decimals: 0 })} d={withOutstanding + " customers with dues"} />
            <StatCard icon="alert" k="Overdue" cur v={window.fmt.inr(totalOverdue, { noSymbol: true, decimals: 0 })} d={Math.round(totalOverdue / totalRec * 100) + "% of receivables past due"} />
            <StatCard icon="receipt" k="Open bills" v={window.DB.summary.openBillsCount} d="Across all customers" />
            <StatCard icon="clock" k="Avg. collection" v="38" d="days outstanding (DSO)" />
          </div>

          <div className="toolbar">
            <div className="seg">
              {[["all", "All"], ["outstanding", "With dues"], ["overdue", "Overdue"]].map(([k, l]) => (
                <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
            <span className="result-count">{rows.length} customers</span>
            <div className="grow" />
            <span className="muted" style={{ fontSize: 12.5 }}>Sort by</span>
            <div className="seg">
              {[["outstanding", "Outstanding"], ["overdue", "Overdue"], ["oldest", "Oldest"], ["name", "Name"]].map(([k, l]) => (
                <button key={k} className={sort === k ? "on" : ""} onClick={() => setSort(k)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Type</th>
                    <th className="c">Open bills</th>
                    <th>Oldest bill</th>
                    <th className="r">Credit limit</th>
                    <th style={{ width: 130 }}>Limit used</th>
                    <th className="r">Overdue</th>
                    <th className="r">Outstanding</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="clickable" onClick={() => go("customer", c.id)}>
                      <td>
                        <div className="row gap10">
                          <div className="avatar">{window.fmt.initials(c.name)}</div>
                          <div>
                            <div className="cell-strong">{c.name}</div>
                            <div className="cell-sub">{c.place}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-neutral">{c.type}</span></td>
                      <td className="c num">{c.openBills || "—"}</td>
                      <td className="muted">{c.oldest ? window.fmt.fmtDateShort(c.oldest) : "—"}</td>
                      <td className="r amt muted">{window.fmt.inr(c.creditLimit, { decimals: 0 })}</td>
                      <td>{c.outstanding > 0 ? utilBar(c.utilization) : <span className="muted">—</span>}</td>
                      <td className="r amt" style={{ color: c.overdue > 0 ? "var(--danger-ink)" : "var(--ink-4)", fontWeight: c.overdue > 0 ? 600 : 400 }}>
                        {c.overdue > 0 ? window.fmt.inr(c.overdue, { decimals: 0 }) : "—"}
                      </td>
                      <td className="r amt cell-strong">{c.outstanding > 0 ? window.fmt.inr(c.outstanding, { decimals: 0 }) : <span className="muted" style={{ fontWeight: 400 }}>Nil</span>}</td>
                      <td className="r"><Icon name="chevR" size={16} style={{ color: "var(--ink-4)" }} className="ico" /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ fontWeight: 600, color: "var(--ink-2)" }}>{rows.length} customers</td>
                    <td className="r amt" style={{ color: "var(--danger-ink)" }}>{window.fmt.inr(rows.reduce((s, c) => s + c.overdue, 0), { decimals: 0 })}</td>
                    <td className="r amt" style={{ fontSize: 15 }}>{window.fmt.inr(rows.reduce((s, c) => s + c.outstanding, 0), { decimals: 0 })}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              {rows.length === 0 && <Empty title="No customers match" sub="Adjust your search or filter." />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Customer detail (ledger of open bills) ---------------- */
function CustomerDetail({ custId, go }) {
  const toast = useToast();
  const c = window.DB.CUSTOMERS.find((x) => x.id === custId);
  if (!c) return <Empty title="Customer not found" />;
  const allBills = window.DB.ALL_INV.filter((i) => i.partyId === custId).sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      <Topbar
        crumbs={[{ label: "Customers", onClick: () => go("customers") }, { label: c.name }]}
        title={c.name}
        onRefresh={() => toast.push({ title: "Synced with Tally", icon: "refresh" })}
        right={<button className="btn btn-pri" onClick={() => simulateDownload(toast, "Preparing " + c.name.replace(/[^a-z0-9]/gi, "-") + "-Ledger.pdf…", "Outstanding statement")}><Icon name="download" size={16} />Statement PDF</button>}
      />
      <div className="content">
        <div className="content-inner">
          <button className="btn btn-quiet btn-sm" style={{ marginBottom: 16 }} onClick={() => go("customers")}><Icon name="arrowL" size={16} />Back to customers</button>

          <div className="card card-pad" style={{ marginBottom: 22 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 18 }}>
              <div className="row gap16">
                <div className="avatar" style={{ width: 52, height: 52, fontSize: 19, borderRadius: 13 }}>{window.fmt.initials(c.name)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>{c.name}</div>
                  <div className="muted" style={{ display: "flex", gap: 14, marginTop: 4, flexWrap: "wrap", fontSize: 12.5 }}>
                    <span className="row gap6"><Icon name="pin" size={14} />{c.place}, {c.state}</span>
                    <span className="row gap6"><Icon name="phone" size={14} />{c.phone}</span>
                    <span className="tag-gst">GSTIN {c.gstin}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 28, textAlign: "right" }}>
                <div>
                  <div className="muted" style={{ fontSize: 11.5 }}>Outstanding</div>
                  <div className="amt" style={{ fontSize: 24, fontWeight: 700 }}>{window.fmt.inr(c.outstanding, { decimals: 0 })}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11.5 }}>Overdue</div>
                  <div className="amt" style={{ fontSize: 24, fontWeight: 700, color: c.overdue > 0 ? "var(--danger-ink)" : "var(--ok-ink)" }}>{window.fmt.inr(c.overdue, { decimals: 0 })}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11.5 }}>Credit terms</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{c.creditDays} days</div>
                  <div className="muted" style={{ fontSize: 11 }}>Limit {window.fmt.inrShort(c.creditLimit)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Bills</h3><span className="sub">{allBills.length} vouchers · {c.openBills} open</span></div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Voucher</th><th>Date</th><th>Due</th><th>Age</th><th>Status</th>
                    <th className="r">Bill amount</th><th className="r">Outstanding</th><th style={{ width: 44 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {allBills.map((inv) => {
                    const od = window.fmt.ageFrom(inv.due);
                    return (
                      <tr key={inv.id} className="clickable" onClick={() => go("invoice", inv.id)}>
                        <td className="mono cell-strong">{inv.no}</td>
                        <td className="muted">{window.fmt.fmtDateShort(inv.date)}</td>
                        <td className="muted">{window.fmt.fmtDateShort(inv.due)}</td>
                        <td>{inv.outstanding > 0 ? (od > 0 ? <span style={{ color: "var(--danger-ink)", fontWeight: 600 }}>{od}d overdue</span> : <span className="muted">{-od}d left</span>) : <span className="muted">—</span>}</td>
                        <td><StatusBadge inv={inv} /></td>
                        <td className="r amt">{window.fmt.inr(inv.totals.grand)}</td>
                        <td className="r amt cell-strong" style={{ color: inv.outstanding > 0 ? "var(--ink)" : "var(--ink-4)" }}>{inv.outstanding > 0 ? window.fmt.inr(inv.outstanding) : "Nil"}</td>
                        <td className="r"><Icon name="chevR" size={15} style={{ color: "var(--ink-4)" }} className="ico" /></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ fontWeight: 600, color: "var(--ink-2)" }}>Total outstanding</td>
                    <td className="r amt muted">{window.fmt.inr(allBills.reduce((s, i) => s + i.totals.grand, 0), { decimals: 0 })}</td>
                    <td className="r amt" style={{ fontSize: 15 }}>{window.fmt.inr(c.outstanding, { decimals: 0 })}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { Customers, CustomerDetail });
