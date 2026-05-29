#!/usr/bin/env python3
"""
TallyEngine connectivity test.
Sends a real XML request to TallyPrime's HTTP gateway and prints
today's sales invoices if it gets a response.

Usage:  py TP.py  (or  python TP.py)
"""

import socket
import http.client
import xml.etree.ElementTree as ET
from datetime import date

TALLY_PORT = 9000
TODAY = date.today().strftime("%Y%m%d")

# Simple ping — just ask for the company list.
PING_XML = """<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Companies</ID>
  </HEADER>
  <BODY><DESC><STATICVARIABLES>
    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
  </STATICVARIABLES></DESC></BODY>
</ENVELOPE>"""

INVOICES_XML = f"""<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>TodaySales</ID>
  </HEADER>
  <BODY><DESC>
    <STATICVARIABLES>
      <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      <SVFROMDATE>{TODAY}</SVFROMDATE>
      <SVTODATE>{TODAY}</SVTODATE>
    </STATICVARIABLES>
    <TDL><TDLMESSAGE>
      <COLLECTION NAME="TodaySales" ISMODIFY="No">
        <TYPE>Vouchers</TYPE>
        <BELONGSTO>Yes</BELONGSTO>
        <FETCH>Date,VoucherNumber,VoucherTypeName,PartyLedgerName,Amount</FETCH>
      </COLLECTION>
    </TDLMESSAGE></TDL>
  </DESC></BODY>
</ENVELOPE>"""
# NOTE: no FILTER/SYSTEM block — TallyPrime hangs or resets the connection
# when custom TDL formulae are used in some configurations. We fetch all
# vouchers for the date range and filter by VoucherTypeName in Python.


# ── transport layer ──────────────────────────────────────────────────────────

def via_http(host, xml_body, timeout=15):
    """Standard HTTP/1.1 POST via http.client — the preferred path."""
    body = xml_body.encode("utf-8")
    conn = http.client.HTTPConnection(host, TALLY_PORT, timeout=timeout)
    try:
        conn.request("POST", "/", body=body,
                     headers={"Content-Type": "text/xml; charset=utf-8",
                              "Content-Length": str(len(body))})
        resp = conn.getresponse()
        data = resp.read()
        print(f"    HTTP {resp.status} — {len(data)} bytes")
        return data.decode("utf-8", errors="replace")
    finally:
        conn.close()


def via_raw_tcp(host, xml_body, timeout=15):
    """
    Raw TCP fallback — no HTTP headers, just the XML body.
    Some TallyPrime configurations (older gateway mode) respond to this
    instead of standard HTTP.
    """
    body = xml_body.encode("utf-8")
    af = socket.AF_INET6 if ":" in host else socket.AF_INET
    with socket.socket(af, socket.SOCK_STREAM) as s:
        s.settimeout(timeout)
        s.connect((host, TALLY_PORT))
        s.sendall(body)
        # Do NOT call shutdown() — let Tally decide when to reply and close.
        chunks = []
        s.settimeout(timeout)
        while True:
            try:
                chunk = s.recv(65536)
                if not chunk:
                    break
                chunks.append(chunk)
                s.settimeout(5)   # tighten once data is flowing
            except socket.timeout:
                break
    raw = b"".join(chunks)
    print(f"    RAW TCP — {len(raw)} bytes — {raw[:60]!r}")
    return raw.decode("utf-8", errors="replace")


def try_post(host, xml_body, timeout=15):
    """Try HTTP then raw TCP. Returns response text or None."""
    print(f"  [{host}] trying HTTP …")
    try:
        r = via_http(host, xml_body, timeout=timeout)
        if r.strip():
            return r
        print("    → empty body")
    except Exception as e:
        print(f"    → {e}")

    print(f"  [{host}] trying raw TCP …")
    try:
        r = via_raw_tcp(host, xml_body, timeout=timeout)
        if r.strip():
            return r
        print("    → empty body")
    except Exception as e:
        print(f"    → {e}")

    return None


# ── XML helpers ──────────────────────────────────────────────────────────────

def strip_http_headers(text):
    """Remove HTTP response headers if Tally prepended them."""
    if "\r\n\r\n" in text:
        return text.split("\r\n\r\n", 1)[1]
    if "\n\n" in text:
        return text.split("\n\n", 1)[1]
    return text


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    # IPv4 first — more reliable on Windows than ::1
    hosts = ["127.0.0.1", "::1"]

    # ── Step 1: ping ────────────────────────────────────────────────────────
    print("Step 1 — ping TallyPrime gateway")
    connected_host = None
    for host in hosts:
        result = try_post(host, PING_XML)
        if result:
            connected_host = host
            print(f"\n  ✓ Response received from {host}:{TALLY_PORT}\n")
            break

    if not connected_host:
        print("\n✗ No response from Tally on any address.")
        print("  Checklist:")
        print("  1. TallyPrime is open and a company is loaded.")
        print("  2. Gateway is enabled: Help → Settings → Connectivity")
        print("     → Enable ODBC/HTTP Server, port 9000, click Save.")
        print("  3. Restart TallyPrime after changing gateway settings.")
        return

    # ── Step 2: today's invoices ────────────────────────────────────────────
    print("Step 2 — fetching today's sales invoices")
    result = try_post(connected_host, INVOICES_XML, timeout=30)
    if not result:
        print("No data returned.")
        return

    result = strip_http_headers(result)

    try:
        root = ET.fromstring(result)
    except ET.ParseError as e:
        print(f"\nXML parse error: {e}")
        print("Response preview:")
        print(result[:500])
        return

    all_vouchers = root.findall(".//VOUCHER")
    # Filter to Sales vouchers only (done client-side — see NOTE above)
    vouchers = [v for v in all_vouchers
                if (v.findtext("VOUCHERTYPENAME") or "").strip() == "Sales"]
    today_fmt = date.today().strftime("%d-%m-%Y")

    print(f"  {len(all_vouchers)} total vouchers today, {len(vouchers)} are Sales.\n")

    if not vouchers:
        print(f"\n  No SALES vouchers found for today ({today_fmt}).")
        print("  This is fine if there are no sales today, or check that your")
        print("  voucher type is named exactly 'Sales' in TallyPrime.")
        return

    print(f"\n  {'Invoice No':<20} {'Party':<35} {'Amount':>14}")
    print("  " + "-" * 72)
    total = 0.0
    for v in vouchers:
        no    = (v.findtext("VOUCHERNUMBER") or "").strip()
        party = (v.findtext("PARTYLEDGERNAME") or "").strip()
        amt   = abs(float(v.findtext("AMOUNT") or 0))
        total += amt
        print(f"  {no:<20} {party:<35} {amt:>14,.2f}")
    print("  " + "-" * 72)
    print(f"  {'TOTAL':<56} {total:>14,.2f}")
    print(f"\n  {len(vouchers)} invoice(s) on {today_fmt}")


if __name__ == "__main__":
    main()
