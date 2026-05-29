/* ============================================================
   TallyEngine — formatting utilities (Indian conventions)
   ============================================================ */
(function () {
  // Indian grouping: ₹1,23,45,678.90
  function groupIndian(intStr) {
    if (intStr.length <= 3) return intStr;
    const last3 = intStr.slice(-3);
    let rest = intStr.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return rest + "," + last3;
  }

  // Full INR with symbol, 2 decimals by default
  function inr(n, opts) {
    opts = opts || {};
    const decimals = opts.decimals != null ? opts.decimals : 2;
    const neg = n < 0;
    const abs = Math.abs(n);
    const fixed = abs.toFixed(decimals);
    let [intPart, dec] = fixed.split(".");
    const grouped = groupIndian(intPart);
    const sym = opts.noSymbol ? "" : "₹";
    const out = sym + grouped + (decimals > 0 ? "." + dec : "");
    return (neg ? "−" : "") + out;
  }

  // Compact lakh/crore form: ₹12.4 L, ₹1.23 Cr
  function inrShort(n) {
    const neg = n < 0;
    const abs = Math.abs(n);
    let out;
    if (abs >= 1e7) out = "₹" + (abs / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
    else if (abs >= 1e5) out = "₹" + (abs / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
    else if (abs >= 1e3) out = "₹" + (abs / 1e3).toFixed(1).replace(/\.?0+$/, "") + "K";
    else out = "₹" + Math.round(abs);
    return (neg ? "−" : "") + out;
  }

  function qty(n, unit) {
    const s = Number.isInteger(n) ? String(n) : n.toFixed(2);
    return groupIndian(s.split(".")[0]) + (s.includes(".") ? "." + s.split(".")[1] : "") + (unit ? " " + unit : "");
  }

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // d = "YYYY-MM-DD"
  function parseD(d) { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd); }
  function fmtDate(d) { const x = parseD(d); return x.getDate() + " " + MONTHS[x.getMonth()] + " " + x.getFullYear(); }
  function fmtDateShort(d) { const x = parseD(d); return String(x.getDate()).padStart(2, "0") + " " + MONTHS[x.getMonth()]; }
  function fmtDay(d) { const x = parseD(d); return DAYS[x.getDay()] + ", " + fmtDate(d); }

  const TODAY = "2026-05-29";
  function daysBetween(a, b) {
    return Math.round((parseD(b) - parseD(a)) / 86400000);
  }
  function ageFrom(dueDate, ref) {
    return daysBetween(dueDate, ref || TODAY);
  }

  function agingBucket(daysOverdue) {
    if (daysOverdue <= 0) return { i: -1, label: "Not due", color: "var(--ink-3)" };
    if (daysOverdue <= 30) return { i: 0, label: "0–30 days", color: "var(--age0)" };
    if (daysOverdue <= 60) return { i: 1, label: "31–60 days", color: "var(--age1)" };
    if (daysOverdue <= 90) return { i: 2, label: "61–90 days", color: "var(--age2)" };
    return { i: 3, label: "90+ days", color: "var(--age3)" };
  }

  function initials(name) {
    const parts = name.replace(/[^A-Za-z ]/g, "").trim().split(/\s+/);
    return ((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "");
  }

  window.fmt = { inr, inrShort, qty, fmtDate, fmtDateShort, fmtDay, daysBetween, ageFrom, agingBucket, initials, parseD, groupIndian, TODAY };
})();
