/* ============================================================
   TallyEngine — shared UI: icons, sidebar, topbar, badges, toasts
   ============================================================ */
const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

/* ---------------- Icons (simple line set) ---------------- */
function Icon({ name, size = 18, stroke = 1.8, ...rest }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", className: "ico", ...rest };
  const paths = {
    receipt: <><path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2Z"/><path d="M9 7h6M9 11h6M9 15h3"/></>,
    users: <><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6"/></>,
    chart: <><path d="M4 4v16h16"/><rect x="7.5" y="11" width="3" height="6" rx="0.6"/><rect x="13" y="7" width="3" height="10" rx="0.6"/><rect x="18.5" y="13" width="0.5" height="4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></>,
    calendar: <><rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9h17M8 3v3M16 3v3"/></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></>,
    print: <><path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="1.5"/><path d="M7 17h10v4H7z"/><circle cx="17" cy="12.5" r="0.6" fill="currentColor"/></>,
    chevR: <path d="m9 6 6 6-6 6"/>,
    chevL: <path d="m15 6-6 6 6 6"/>,
    chevD: <path d="m6 9 6 6 6-6"/>,
    arrowL: <><path d="M19 12H5"/><path d="m11 6-6 6 6 6"/></>,
    arrowUR: <path d="M7 17 17 7M9 7h8v8"/>,
    file: <><path d="M14 3v5h5"/><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/></>,
    files: <><rect x="8" y="3.5" width="12" height="15" rx="1.5"/><path d="M4 7v12.5a1.5 1.5 0 0 0 1.5 1.5H15"/></>,
    check: <path d="m5 12 4.5 4.5L19 7"/>,
    clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
    alert: <><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4M12 17h.01"/></>,
    rupee: <><path d="M7 5h10M7 9h10M16 5c0 4-3 5-6 5h-3l7 9"/></>,
    wallet: <><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9h18"/><circle cx="16.5" cy="13" r="1.2" fill="currentColor"/></>,
    trend: <><path d="M3 17 9 11l4 4 8-8"/><path d="M16 7h5v5"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></>,
    book: <><path d="M5 4.5A2 2 0 0 1 7 3h12v15H7a2 2 0 0 0-2 2Z"/><path d="M5 19.5A1.5 1.5 0 0 1 6.5 21H19"/></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/></>,
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.2"/></>,
    x: <path d="M6 6 18 18M18 6 6 18"/>,
    refresh: <><path d="M21 12a9 9 0 1 1-2.6-6.3"/><path d="M21 4v4h-4"/></>,
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/>,
    phone: <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/>,
    pin: <><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></>,
    bolt: <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z"/>,
    scale: <><path d="M12 4v16M7 20h10"/><path d="m12 6-5 6h10l-5-6Z"/></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* ---------------- Toast system ---------------- */
const ToastCtx = createContext(null);
function useToast() { return useContext(ToastCtx); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x)));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 220);
  }, []);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((cur) => [...cur, { ...t, id }]);
    if (t.duration !== 0) setTimeout(() => remove(id), t.duration || 3200);
    return id;
  }, [remove]);
  const update = useCallback((id, patch) => {
    setToasts((cur) => cur.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);
  return (
    <ToastCtx.Provider value={{ push, remove, update }}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={"toast" + (t.out ? " out" : "")}>
            <div className={"ti " + (t.kind === "busy" ? "busy" : "ok")}>
              {t.kind === "busy" ? <div className="sp" /> : <Icon name={t.icon || "check"} size={17} stroke={2.4} />}
            </div>
            <div className="tt"><b>{t.title}</b>{t.sub && <span>{t.sub}</span>}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* simulate a PDF download: busy toast -> success */
function simulateDownload(toast, label, sub) {
  const id = toast.push({ kind: "busy", title: label, sub: sub || "Rendering from Tally data…", duration: 0 });
  setTimeout(() => {
    toast.update(id, { kind: "ok", icon: "download", title: "Downloaded", sub: label.replace("Preparing ", "").replace("…", "") });
    setTimeout(() => toast.remove(id), 2600);
  }, 1150);
}

/* ---------------- Badges ---------------- */
function StatusBadge({ inv }) {
  if (inv.settled) return <span className="badge badge-ok"><span className="bd" />Paid</span>;
  if (inv.paid > 0) return <span className="badge badge-warn"><span className="bd" />Part-paid</span>;
  const overdue = window.fmt.ageFrom(inv.due) > 0;
  if (overdue) return <span className="badge badge-danger"><span className="bd" />Overdue</span>;
  return <span className="badge badge-neutral"><span className="bd" />Pending</span>;
}
function ModeBadge({ mode }) {
  const cls = mode === "Credit" ? "badge-line" : "badge-accent";
  return <span className={"badge " + cls}>{mode}</span>;
}

/* ---------------- Sidebar ---------------- */
const NAV = [
  { id: "invoices", label: "Today's Invoices", icon: "receipt", count: () => window.DB.summary.todayCount },
  { id: "customers", label: "Customers", icon: "users" },
];
const REPORTS = [
  { id: "rep-aging-sum", label: "Aging Summary" },
  { id: "rep-aging-det", label: "Aging Details" },
  { id: "rep-receivables", label: "Outstanding Receivables" },
  { id: "rep-daybook", label: "Day Book" },
  { id: "rep-sales", label: "Sales Register" },
];

function Sidebar({ route, go, connStatus, onChangeHost }) {
  const C    = window.DB.COMPANY;
  const host = window.Tally.getHost().replace(/^https?:\/\//, "");
  const conn = {
    connecting: { dot: <span className="pulse" />,                                               label: "Connecting…",             port: host },
    asking:     { dot: <span className="pulse" style={{ background: "var(--warn)" }} />,         label: "Not connected",           port: host },
    live:       { dot: <span className="pulse" />,                                               label: "Connected · Live data",   port: host + " · " + C.fy },
    mock:       { dot: <span className="pulse" style={{ background: "var(--warn)" }} />,         label: "Tally offline — demo data", port: host + " · not found" },
    cors:       { dot: <span className="pulse" style={{ background: "var(--warn)" }} />,         label: "CORS blocked — use .bat", port: "Run Launch-TallyEngine.bat" },
  }[connStatus] || { dot: <span className="pulse" />, label: "Connecting…", port: host };

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo"><span>TE</span></div>
        <div>
          <div className="sb-brand-name">TallyEngine</div>
          <div className="sb-brand-sub">Read-only viewer</div>
        </div>
      </div>
      <nav className="sb-nav">
        {NAV.map((n) => (
          <div key={n.id} className={"sb-item" + (route === n.id || (n.id === "invoices" && route === "invoice") ? " active" : "")}
            onClick={() => go(n.id)}>
            <Icon name={n.icon} size={18} />
            <span>{n.label}</span>
            {n.count && <span className="count">{n.count()}</span>}
          </div>
        ))}
        <div className="sb-section-label">Reports</div>
        <div className={"sb-item" + (route === "reports" ? " active" : "")} onClick={() => go("reports")}>
          <Icon name="chart" size={18} />
          <span>All Reports</span>
        </div>
        <div className="sb-sub">
          {REPORTS.map((r) => (
            <div key={r.id} className={"sb-subitem" + (route === r.id ? " active" : "")} onClick={() => go(r.id)}>
              <span className="dot" /><span>{r.label}</span>
            </div>
          ))}
        </div>
      </nav>
      <div className="sb-foot">
        <div className="sb-conn">
          {conn.dot}
          <span>{conn.label}</span>
        </div>
        <div className="sb-conn-port" style={{ marginTop: 3, marginLeft: 16 }}>{conn.port}</div>
        {(connStatus === "mock" || connStatus === "live") && onChangeHost && (
          <div style={{ marginTop: 6, marginLeft: 16 }}>
            <span className="link" style={{ fontSize: 11.5 }} onClick={onChangeHost}>Change host</span>
          </div>
        )}
        <div className="sb-company">
          <b>{C.name}</b>
          <span>GSTIN {C.gstin}</span>
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Topbar ---------------- */
function Topbar({ crumbs, title, search, setSearch, onRefresh, right }) {
  return (
    <header className="topbar">
      <div className="tb-title">
        {crumbs && (
          <div className="tb-crumb">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon name="chevR" size={12} className="ico sep" />}
                <span style={c.onClick ? { cursor: "pointer", color: "var(--accent-ink)" } : null} onClick={c.onClick}>{c.label}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="tb-h">{title}</div>
      </div>
      <div className="tb-spacer" />
      {right}
      {setSearch && (
        <label className="tb-search">
          <Icon name="search" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={search === "" ? "Search…" : ""} />
        </label>
      )}
      <div className="tb-date">
        <Icon name="calendar" size={16} />
        <span><span className="lbl">As on</span> {window.fmt.fmtDate(window.DB.TODAY)}</span>
      </div>
      <button className="icon-btn" title="Refresh from Tally" onClick={onRefresh}><Icon name="refresh" size={17} /></button>
    </header>
  );
}

/* generic empty state */
function Empty({ icon = "search", title, sub }) {
  return (
    <div className="empty">
      <div className="ei"><Icon name={icon} size={24} /></div>
      <h4>{title}</h4>
      <div>{sub}</div>
    </div>
  );
}

Object.assign(window, { Icon, ToastProvider, useToast, simulateDownload, StatusBadge, ModeBadge, Sidebar, Topbar, Empty,
  useState, useEffect, useRef, useCallback });
