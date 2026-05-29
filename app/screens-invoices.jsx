/* ============================================================
   TallyEngine — Today's Invoices (list) + Invoice Detail + PDF preview
   ============================================================ */

/* ---------------- Summary stat strip ---------------- */
function StatCard({ icon, k, v, cur, d, dGood }) {
  return (
    <div className="stat">
      <div className="chip-ico"><Icon name={icon} size={18} /></div>
      <div className="k">{k}</div>
      <div className="v">{cur && <span className="cur">₹</span>}{v}</div>
      {d && <div className="d">{dGood ? <b>{d}</b> : d}</div>}
    </div>
  );
}

function InvoicesList({ go }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("all");
  const S = window.DB.summary;
  const all = window.DB.TODAY_INV;

  let rows = all.filter((inv) => {
    if (mode === "credit" && inv.mode !== "Credit") return false;
    if (mode === "cash" && inv.mode === "Credit") return false;
    if (search) {
      const q = search.toLowerCase();
      return inv.party.name.toLowerCase().includes(q) || inv.no.toLowerCase().includes(q) || inv.party.place.toLowerCase().includes(q);
    }
    return true;
  });

  const bulkPDF = () => simulateDownload(toast, "Preparing Today's Invoices.zip…", "Bundling " + all.length + " PDFs · 29 May 2026");

  return (
    <>
      <Topbar
        crumbs={[{ label: "Sales Vouchers" }, { label: "Today" }]}
        title="Today's Invoices"
        search={search} setSearch={setSearch}
        onRefresh={() => toast.push({ title: "Synced with Tally", sub: "Day Book up to date", icon: "refresh" })}
        right={<button className="btn btn-pri" onClick={bulkPDF}><Icon name="files" size={16} />Download all ({all.length}) PDF</button>}
      />
      <div className="content">
        <div className="content-inner wide">
          <div className="stat-row">
            <StatCard icon="trend" k="Sales today" cur v={window.fmt.inr(S.todaySales, { noSymbol: true, decimals: 0 })} d={S.todayCount + " invoices · " + window.fmt.fmtDay(window.DB.TODAY)} />
            <StatCard icon="wallet" k="Cash / UPI collected" cur v={window.fmt.inr(S.todayCash, { noSymbol: true, decimals: 0 })} d="Settled at billing" />
            <StatCard icon="receipt" k="On credit" cur v={window.fmt.inr(S.todayCredit, { noSymbol: true, decimals: 0 })} d="Added to receivables" />
            <StatCard icon="rupee" k="Avg. invoice value" cur v={window.fmt.inr(S.todaySales / S.todayCount, { noSymbol: true, decimals: 0 })} d="Across today's bills" />
          </div>

          <div className="toolbar">
            <div className="seg">
              {[["all", "All"], ["credit", "Credit"], ["cash", "Cash / UPI"]].map(([k, l]) => (
                <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{l}</button>
              ))}
            </div>
            <span className="result-count">{rows.length} of {all.length} invoices</span>
            <div className="grow" />
            <button className="btn btn-ghost btn-sm" onClick={bulkPDF}><Icon name="download" size={15} />Bulk export</button>
          </div>

          <div className="card">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 38 }}>#</th>
                    <th>Voucher No.</th>
                    <th>Time</th>
                    <th>Customer</th>
                    <th className="c">Items</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th className="r">Amount</th>
                    <th style={{ width: 110 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv, i) => (
                    <tr key={inv.id} className="clickable" onClick={() => go("invoice", inv.id)}>
                      <td className="row-num">{i + 1}</td>
                      <td><span className="mono cell-strong">{inv.no}</span></td>
                      <td className="mono muted" style={{ fontSize: 12.5 }}>{inv.time}</td>
                      <td>
                        <div className="row gap10">
                          <div className="avatar">{window.fmt.initials(inv.party.name)}</div>
                          <div>
                            <div className="cell-strong">{inv.party.name}</div>
                            <div className="cell-sub">{inv.party.place} · {inv.party.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="c muted num">{inv.lines.length}</td>
                      <td><ModeBadge mode={inv.mode} /></td>
                      <td><StatusBadge inv={inv} /></td>
                      <td className="r amt cell-strong">{window.fmt.inr(inv.totals.grand)}</td>
                      <td className="r" onClick={(e) => e.stopPropagation()}>
                        <div className="row gap6" style={{ justifyContent: "flex-end" }}>
                          <button className="btn btn-quiet btn-sm" title="Download PDF"
                            onClick={() => simulateDownload(toast, "Preparing " + inv.no.replace(/\//g, "-") + ".pdf…", inv.party.name)}>
                            <Icon name="download" size={15} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => go("invoice", inv.id)}>Open<Icon name="chevR" size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={7} style={{ color: "var(--ink-2)", fontWeight: 600 }}>{rows.length} invoices · {window.fmt.fmtDate(window.DB.TODAY)}</td>
                    <td className="r amt" style={{ fontSize: 15 }}>{window.fmt.inr(rows.reduce((s, i) => s + i.totals.grand, 0))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              {rows.length === 0 && <Empty title="No invoices match" sub="Try a different search or filter." />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Invoice Detail ---------------- */
function InvoiceDetail({ invId, go }) {
  const toast = useToast();
  const [showPdf, setShowPdf] = useState(false);
  const inv = window.DB.ALL_INV.find((x) => x.id === invId);
  if (!inv) return <Empty title="Invoice not found" sub="It may have been removed." />;
  const C = window.DB.COMPANY;
  const t = inv.totals;
  const idx = window.DB.TODAY_INV.findIndex((x) => x.id === invId);
  const isToday = inv.date === window.DB.TODAY;

  return (
    <>
      <Topbar
        crumbs={[{ label: "Today's Invoices", onClick: () => go("invoices") }, { label: inv.no }]}
        title={inv.no}
        onRefresh={() => toast.push({ title: "Synced with Tally", icon: "refresh" })}
        right={
          <div className="row gap10">
            <button className="btn btn-ghost" onClick={() => setShowPdf(true)}><Icon name="file" size={16} />Preview</button>
            <button className="btn btn-ghost" onClick={() => simulateDownload(toast, "Sending " + inv.no.replace(/\//g, "-") + " to printer…", "")}><Icon name="print" size={16} />Print</button>
            <button className="btn btn-pri" onClick={() => simulateDownload(toast, "Preparing " + inv.no.replace(/\//g, "-") + ".pdf…", inv.party.name)}><Icon name="download" size={16} />Download PDF</button>
          </div>
        }
      />
      <div className="content">
        <div className="content-inner">
          <div className="row" style={{ marginBottom: 18, justifyContent: "space-between" }}>
            <button className="btn btn-quiet btn-sm" onClick={() => go("invoices")}><Icon name="arrowL" size={16} />Back to today's invoices</button>
            {isToday && idx >= 0 && (
              <div className="row gap6">
                <button className="btn btn-ghost btn-sm" disabled={idx === 0} onClick={() => go("invoice", window.DB.TODAY_INV[idx - 1].id)}><Icon name="chevL" size={15} />Prev</button>
                <span className="muted" style={{ fontSize: 12.5 }}>{idx + 1} / {window.DB.TODAY_INV.length}</span>
                <button className="btn btn-ghost btn-sm" disabled={idx === window.DB.TODAY_INV.length - 1} onClick={() => go("invoice", window.DB.TODAY_INV[idx + 1].id)}>Next<Icon name="chevR" size={15} /></button>
              </div>
            )}
          </div>

          {/* header card */}
          <div className="card card-pad" style={{ marginBottom: 22 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                <div className="party-block">
                  <div className="lbl">Billed to</div>
                  <div className="nm">{inv.party.name}</div>
                  <div className="ln">{inv.party.place}</div>
                  <div className="ln">{inv.party.state} · {inv.party.type}</div>
                  <div className="ln tag-gst" style={{ marginTop: 4 }}>GSTIN {inv.party.gstin}</div>
                </div>
                <div className="party-block">
                  <div className="lbl">Invoice details</div>
                  <div className="kv-grid">
                    <span className="k">Date</span><span className="v">{window.fmt.fmtDate(inv.date)}, {inv.time}</span>
                    <span className="k">Reference</span><span className="v mono">{inv.ref}</span>
                    <span className="k">Due date</span><span className="v">{window.fmt.fmtDate(inv.due)}</span>
                    {inv.eway && <><span className="k">E-Way bill</span><span className="v mono">{inv.eway}</span></>}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="row gap6" style={{ justifyContent: "flex-end", marginBottom: 8 }}>
                  <ModeBadge mode={inv.mode} /><StatusBadge inv={inv} />
                </div>
                <div className="muted" style={{ fontSize: 12 }}>Grand total</div>
                <div className="amt" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{window.fmt.inr(t.grand)}</div>
                {inv.outstanding > 0
                  ? <div style={{ fontSize: 12.5, color: "var(--danger-ink)", fontWeight: 600, marginTop: 2 }}>{window.fmt.inr(inv.outstanding)} outstanding</div>
                  : <div style={{ fontSize: 12.5, color: "var(--ok-ink)", fontWeight: 600, marginTop: 2 }}>Fully settled</div>}
              </div>
            </div>
          </div>

          {/* line items + totals */}
          <div className="detail-grid">
            <div className="card">
              <div className="card-head"><h3>Line items</h3><span className="sub">{inv.lines.length} products</span></div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 34 }}>#</th>
                      <th>Item</th>
                      <th>HSN</th>
                      <th className="r">Qty</th>
                      <th className="r">Rate</th>
                      <th className="r">Disc</th>
                      <th className="c">GST</th>
                      <th className="r">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.lines.map((ln, i) => (
                      <tr key={i}>
                        <td className="row-num">{i + 1}</td>
                        <td className="cell-strong">{ln.item.name}</td>
                        <td className="mono muted" style={{ fontSize: 12 }}>{ln.item.hsn}</td>
                        <td className="r num">{window.fmt.qty(ln.qty)} <span className="muted" style={{ fontSize: 11 }}>{ln.item.unit}</span></td>
                        <td className="r amt">{window.fmt.inr(ln.rate)}</td>
                        <td className="r num muted">{ln.disc ? ln.disc + "%" : "—"}</td>
                        <td className="c muted num">{ln.item.gst}%</td>
                        <td className="r amt cell-strong">{window.fmt.inr(ln.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {inv.narration && (
                <div style={{ padding: "13px 20px", borderTop: "1px solid var(--line)", fontSize: 12.5, color: "var(--ink-2)" }}>
                  <span className="muted" style={{ fontWeight: 600 }}>Narration: </span>{inv.narration}
                </div>
              )}
            </div>

            <div className="card card-pad">
              <div className="section-title">Tax summary</div>
              <div className="kv"><span className="k">Taxable value</span><span className="v amt">{window.fmt.inr(t.taxable)}</span></div>
              {t.interstate
                ? <div className="kv"><span className="k">IGST</span><span className="v amt">{window.fmt.inr(t.igst)}</span></div>
                : <>
                    <div className="kv"><span className="k">CGST</span><span className="v amt">{window.fmt.inr(t.cgst)}</span></div>
                    <div className="kv"><span className="k">SGST</span><span className="v amt">{window.fmt.inr(t.sgst)}</span></div>
                  </>}
              <div className="kv"><span className="k">Round off</span><span className="v amt">{window.fmt.inr(t.roundOff)}</span></div>
              <div className="kv total"><span className="k">Grand total</span><span className="v amt">{window.fmt.inr(t.grand)}</span></div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="btn btn-pri" style={{ width: "100%" }} onClick={() => simulateDownload(toast, "Preparing " + inv.no.replace(/\//g, "-") + ".pdf…", inv.party.name)}><Icon name="download" size={16} />Download this invoice</button>
                <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => setShowPdf(true)}><Icon name="file" size={16} />Preview PDF</button>
              </div>
              <div className="muted" style={{ fontSize: 11.5, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
                {t.interstate ? "Inter-state supply (IGST)" : "Intra-state supply (CGST + SGST)"}<br />Read-only · sourced from TallyPrime
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPdf && <PdfPreview inv={inv} onClose={() => setShowPdf(false)} toast={toast} />}
    </>
  );
}

/* ---------------- PDF preview modal (printable sheet) ---------------- */
function PdfPreview({ inv, onClose, toast }) {
  const C = window.DB.COMPANY;
  const t = inv.totals;
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" style={{ width: 740 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <Icon name="file" size={18} />
          <h3>Invoice preview — {inv.no}</h3>
          <div style={{ flex: 1 }} />
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body" style={{ background: "var(--surface-3)", padding: 24, display: "grid", placeItems: "center" }}>
          <div className="pdf-sheet" style={{ boxShadow: "var(--shadow-lg)" }}>
            <div className="ph">
              <div>
                <h1>{C.name}</h1>
                <div>{C.tagline}</div>
                <div>{C.addr[0]}, {C.addr[1]}</div>
                <div>GSTIN: {C.gstin} · Ph: {C.phone}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="pdf-watermark">TAX INVOICE</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>{inv.no}</div>
                <div>{window.fmt.fmtDate(inv.date)}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "14px 0 10px", fontSize: 11 }}>
              <div>
                <div style={{ color: "#8a8073", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Billed to</div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{inv.party.name}</div>
                <div>{inv.party.place}, {inv.party.state}</div>
                <div>GSTIN: {inv.party.gstin}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>Ref: {inv.ref}</div>
                <div>Due: {window.fmt.fmtDate(inv.due)}</div>
                <div>Mode: {inv.mode}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>#</th><th>Description</th><th>HSN</th><th className="r">Qty</th><th className="r">Rate</th><th className="r">Amount</th></tr>
              </thead>
              <tbody>
                {inv.lines.map((ln, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td><td>{ln.item.name}</td><td>{ln.item.hsn}</td>
                    <td className="r">{window.fmt.qty(ln.qty, ln.item.unit)}</td>
                    <td className="r">{window.fmt.inr(ln.rate)}</td>
                    <td className="r">{window.fmt.inr(ln.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <table style={{ width: 260 }}>
                <tbody>
                  <tr><td>Taxable value</td><td className="r">{window.fmt.inr(t.taxable)}</td></tr>
                  {t.interstate
                    ? <tr><td>IGST</td><td className="r">{window.fmt.inr(t.igst)}</td></tr>
                    : <><tr><td>CGST</td><td className="r">{window.fmt.inr(t.cgst)}</td></tr><tr><td>SGST</td><td className="r">{window.fmt.inr(t.sgst)}</td></tr></>}
                  <tr><td>Round off</td><td className="r">{window.fmt.inr(t.roundOff)}</td></tr>
                  <tr style={{ fontWeight: 700, background: "#f4f1ec" }}><td>Grand Total</td><td className="r">{window.fmt.inr(t.grand)}</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8a8073" }}>
              <div>This is a computer-generated invoice.</div>
              <div>For {C.name}</div>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <div className="pdf-watermark" style={{ flex: 1 }}>Rendered read-only from TallyPrime data</div>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-pri" onClick={() => { onClose(); simulateDownload(toast, "Preparing " + inv.no.replace(/\//g, "-") + ".pdf…", inv.party.name); }}><Icon name="download" size={16} />Download PDF</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { InvoicesList, InvoiceDetail, PdfPreview, StatCard });
