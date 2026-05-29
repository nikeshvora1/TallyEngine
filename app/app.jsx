/* ============================================================
   TallyEngine — app shell, routing, mount
   ============================================================ */

function TallyHostModal({ onConnected, onDismiss }) {
  const rawHost = window.Tally.getHost().replace(/^https?:\/\//, "");
  const [host, setHostVal] = useState(rawHost === "localhost:9000" ? "" : rawHost);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  async function attempt() {
    const h = host.trim() || "localhost:9000";
    setTesting(true);
    setError("");
    window.Tally.setHost(h);
    const ok = await window.Tally.checkConnection();
    setTesting(false);
    if (ok === true) {
      onConnected();
    } else if (ok === "cors") {
      setError("CORS blocked — open TallyEngine via Launch-TallyEngine.bat, not directly as a file.");
    } else {
      setError("Cannot reach TallyPrime at " + window.Tally.getHost().replace(/^https?:\/\//, "") + ". Check the IP and that Tally's gateway is enabled (Help → Settings → Connectivity).");
    }
  }

  return (
    <div className="modal-scrim">
      <div className="modal" style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <Icon name="bolt" size={18} />
          <h3>Connect to TallyPrime</h3>
        </div>
        <div className="modal-body" style={{ padding: "22px 24px 4px" }}>
          <p style={{ margin: "0 0 18px", color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.65 }}>
            Could not reach TallyPrime at <span className="mono" style={{ color: "var(--ink)" }}>localhost:9000</span>.
            If Tally is running on another machine in your network, enter its IP address below.
          </p>
          <div style={{ marginBottom: 6, fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)" }}>Tally host</div>
          <div className="tb-search" style={{ width: "100%", height: 42, borderRadius: 9, marginBottom: 4 }}>
            <Icon name="bolt" size={15} />
            <input
              value={host}
              onChange={(e) => { setHostVal(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && !testing && attempt()}
              placeholder="e.g. 192.168.1.100  or  192.168.1.5:9001"
              autoFocus
              style={{ fontFamily: "var(--mono)", fontSize: 13 }}
            />
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-4)", marginBottom: 18 }}>
            Leave blank to retry localhost:9000. Port 9000 is added automatically if omitted.
          </div>
          {error && (
            <div style={{ background: "var(--danger-soft)", color: "var(--danger-ink)", borderRadius: 8, padding: "10px 14px", fontSize: 13, lineHeight: 1.55, marginBottom: 16 }}>
              {error}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-quiet" onClick={onDismiss}>Use demo data</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-pri" onClick={attempt} disabled={testing}>
            {testing ? <><div className="sp" style={{ width: 14, height: 14, borderWidth: 2 }} />Testing…</> : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  // route state persists in localStorage (survives reload)
  const [nav, setNav] = useState(() => {
    try { return JSON.parse(localStorage.getItem("te.nav")) || { route: "invoices", param: null }; }
    catch (e) { return { route: "invoices", param: null }; }
  });
  useEffect(() => { localStorage.setItem("te.nav", JSON.stringify(nav)); }, [nav]);

  const go = useCallback((route, param) => {
    setNav({ route, param: param != null ? param : null });
    const c = document.querySelector(".content");
    if (c) c.scrollTop = 0;
  }, []);

  // 'connecting' | 'asking' | 'live' | 'mock' | 'cors'
  const [connStatus, setConnStatus] = useState("connecting");

  const loadLive = useCallback(async () => {
    setConnStatus("connecting");
    const status = await window.Tally.checkConnection();
    if (status === "cors") { setConnStatus("cors"); return; }
    if (!status)           { setConnStatus("asking"); return; }
    try {
      const now   = new Date();
      const today = now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0");
      const liveDB = await window.Tally.loadLiveData(today);
      Object.assign(window.DB, liveDB);
      setNav({ route: "invoices", param: null });
      setConnStatus("live");
    } catch (e) {
      console.warn("TallyEngine: live data load failed —", e);
      setConnStatus("mock");
    }
  }, []);

  useEffect(() => { loadLive(); }, []);

  const { route, param } = nav;

  let screen;
  switch (route) {
    case "invoices": screen = <InvoicesList go={go} />; break;
    case "invoice": screen = <InvoiceDetail invId={param} go={go} />; break;
    case "customers": screen = <Customers go={go} />; break;
    case "customer": screen = <CustomerDetail custId={param} go={go} />; break;
    case "reports": screen = <ReportsHub go={go} />; break;
    case "rep-aging-sum": screen = <AgingSummary go={go} />; break;
    case "rep-aging-det": screen = <AgingDetails go={go} />; break;
    case "rep-receivables": screen = <Receivables go={go} />; break;
    case "rep-daybook": screen = <DayBook go={go} />; break;
    case "rep-sales": screen = <SalesRegister go={go} />; break;
    default: screen = <InvoicesList go={go} />;
  }

  // sidebar highlights: map detail routes to their section
  const sbRoute = route === "customer" ? "customers" : route === "invoice" ? "invoices" : route;

  return (
    <ToastProvider>
      <div className="app">
        <Sidebar route={sbRoute} go={go} connStatus={connStatus} onChangeHost={() => setConnStatus("asking")} />
        <main className="main">{screen}</main>
      </div>
      {connStatus === "asking" && (
        <TallyHostModal
          onConnected={loadLive}
          onDismiss={() => setConnStatus("mock")}
        />
      )}
    </ToastProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
