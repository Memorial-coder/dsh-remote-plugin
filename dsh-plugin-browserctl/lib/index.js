// src/index.js
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import net from "node:net";
import { existsSync, readFileSync, writeFileSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
var name = "browserctl";
var inject = ["webServer"];
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var ROOT = path.resolve(__dirname, "..", "..");
var STATE_PATH = path.join(ROOT, "browserctl_state.json");
var BLACKLIST_PATH = path.join(ROOT, "browserctl_blacklist.json");
var SESSIONS_PATH = path.join(ROOT, "browserctl_sessions.json");
var EVENTS_PATH = path.join(ROOT, "browserctl_events.json");
var DEVICES_PATH = path.join(ROOT, "browserctl_devices.json");
var SCRIPT_PATH = path.join(ROOT, "browserctl.py");
var SECRETS_PATH = path.join(ROOT, "browserctl_secrets.json");
var ADMIN_TOKEN_PATH = path.join(ROOT, "browserctl_admin_token");
function adminHeaders() {
  try {
    const tok = readFileSync(ADMIN_TOKEN_PATH, "utf8").trim();
    if (tok) return { "x-bc-admin": tok };
  } catch {
  }
  return {};
}
var VERSION = "1.0.0";
var sessionTunnel = false;
var ensureRunning = null;
function cmpVersion(a, b) {
  const pa = String(a || "").replace(/^v/i, "").split(".").map((x) => Number(x) || 0);
  const pb = String(b || "").replace(/^v/i, "").split(".").map((x) => Number(x) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}
var OFFICIAL_API_BASE = "https://remote.ymzcc.com/dsh-remote";
var OAUTH_CLIENT_ID = "dsh-plugin-desktop";
var PANEL_URL = "https://remote.ymzcc.com/p/17901/";
var UPDATE_MANIFEST_URL = "https://remote.ymzcc.com/dsh-remote/version.json";
function atomicWrite(file, data) {
  const tmp = file + ".tmp";
  writeFileSync(tmp, data, "utf8");
  try {
    renameSync(tmp, file);
  } catch (e) {
    try {
      rmSync(tmp, { force: true });
    } catch {
    }
    throw e;
  }
}
function readState() {
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}
function readBlacklist() {
  try {
    const rows = JSON.parse(readFileSync(BLACKLIST_PATH, "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
function writeBlacklist(rows) {
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const r of rows || []) {
    const ip = String(r && r.ip || "").trim();
    if (!ip || seen.has(ip)) continue;
    seen.add(ip);
    deduped.push({ ...r, ip });
  }
  atomicWrite(BLACKLIST_PATH, JSON.stringify(deduped, null, 2));
  return deduped;
}
function writeState(st) {
  atomicWrite(STATE_PATH, JSON.stringify(st, null, 2));
}
function readSecrets() {
  try {
    return JSON.parse(readFileSync(SECRETS_PATH, "utf8"));
  } catch {
    return {};
  }
}
function writeSecrets(sec) {
  atomicWrite(SECRETS_PATH, JSON.stringify(sec, null, 2));
}
function applyOfficialSession(j) {
  const sec = readSecrets();
  sec.server_mode = "official";
  sec.server_uid = j.uid;
  sec.server_email = j.email || "";
  sec.server_token = j.access_token || j.token;
  sec.server_link_secret = j.linkSecret || "";
  sec.server_panel_url = j.panelUrl || "";
  if (Number(j.remotePort) > 0) sec.frp_remote_port = Number(j.remotePort);
  if (j.frpToken) sec.frp_token = j.frpToken;
  writeSecrets(sec);
  try {
    const st = readState();
    if (j.linkSecret) st.link_secret = j.linkSecret;
    if (Number(j.remotePort) > 0) st.remote_port = Number(j.remotePort);
    writeState(st);
  } catch (e) {
  }
}
function uidPanelBase() {
  try {
    const sec = readSecrets();
    if (sec && sec.server_mode === "official" && sec.server_uid) {
      return "https://remote.ymzcc.com/dsh-remote/p/" + sec.server_uid + "/";
    }
  } catch {
  }
  return null;
}
function effectivePanelUrl() {
  try {
    const sec = readSecrets();
    if (sec && sec.server_mode === "selfhost" && sec.ssh_host) {
      const host = String(sec.ssh_host).replace(/^https?:\/\//, "").replace(/\/+$/, "");
      const rp = Number(sec.frp_remote_port) || 17901;
      if (host) return "https://" + host + "/p/" + rp + "/";
    }
    if (sec && sec.server_mode === "official" && sec.server_uid) {
      const uidBase = uidPanelBase();
      if (uidBase) return uidBase;
      if (sec.server_panel_url) return String(sec.server_panel_url);
      const rp = Number(sec.frp_remote_port) || 0;
      if (rp > 0) return "https://remote.ymzcc.com/p/" + rp + "/";
    }
  } catch {
  }
  return PANEL_URL;
}
function toUidUrl(url) {
  const base = uidPanelBase();
  if (!base || !url) return url;
  const s = String(url);
  if (/^https:\/\/remote\.ymzcc\.com\/p\/\d{4,5}\//.test(s)) {
    return s.replace(/^https:\/\/remote\.ymzcc\.com\/p\/\d{4,5}\//, base);
  }
  try {
    const u = new URL(s);
    if (u.hostname === "remote.ymzcc.com" && u.pathname === "/dsh-auth.html") {
      const k = u.searchParams.get("k");
      if (k) return base + "browserctl-gate/bootstrap?k=" + encodeURIComponent(k);
    }
  } catch {
  }
  return s;
}
function secretLink() {
  return null;
}
function runBrowserctl(args) {
  const script = SCRIPT_PATH;
  if (!existsSync(script)) return { started: false, error: "browserctl.py \u4E0D\u5B58\u5728: " + script };
  const creationflags = process.platform === "win32" ? 8 | 512 | 16777216 : 0;
  const child = spawn("python", [script, ...args], {
    cwd: path.dirname(script),
    stdio: "ignore",
    detached: true,
    creationflags
  });
  child.unref();
  return { started: true };
}
function runBrowserctlAsync(args, timeoutMs = 8e3) {
  return new Promise((resolve) => {
    const script = SCRIPT_PATH;
    if (!existsSync(script)) {
      resolve({ started: false, error: "browserctl.py \u4E0D\u5B58\u5728: " + script });
      return;
    }
    const creationflags = process.platform === "win32" ? 8 | 512 | 16777216 : 0;
    let done = false;
    const child = spawn("python", [script, ...args], {
      cwd: path.dirname(script),
      stdio: "ignore",
      detached: true,
      creationflags
    });
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      try {
        child.kill();
      } catch {
      }
      resolve({ started: false, timedOut: true });
    }, timeoutMs);
    child.on("exit", () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ started: true });
    });
    child.on("error", (e) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ started: false, error: String(e && e.message || e) });
    });
  });
}
function totpWrite(enabled, reset) {
  const st = readState();
  if (enabled && (reset || !st.totp_secret)) {
    st.totp_secret = base32Encode(crypto.randomBytes(20));
  }
  if (!enabled && reset) delete st.totp_secret;
  st.totp_enabled = !!enabled;
  st.gate_kick_seq = (st.gate_kick_seq || 0) + 1;
  if (enabled) delete st.gate_kicked_devs;
  try {
    writeState(st);
  } catch (e) {
    return { ok: false, error: String(e) };
  }
  return { ok: true, enabled: !!enabled, secret: st.totp_secret || null };
}
var B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(buf) {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = value << 8 | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[value >>> bits - 5 & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[value << 5 - bits & 31];
  return out;
}
function readSessions() {
  try {
    let rows = JSON.parse(readFileSync(SESSIONS_PATH, "utf8"));
    if (!Array.isArray(rows)) return [];
    const now = Date.now() / 1e3;
    const seen = /* @__PURE__ */ new Map();
    for (const r of rows) {
      if (!r || !r.dev) continue;
      const age = now - (r.ts || r.since || now);
      if (age > 30 * 86400) continue;
      const key = (r.ip || "") + "::" + (r.name || "");
      const prev = seen.get(key);
      if (!prev || (r.ts || 0) > (prev.ts || 0)) {
        seen.set(key, r);
      }
    }
    return [...seen.values()];
  } catch {
    return [];
  }
}
function readEvents() {
  try {
    const rows = JSON.parse(readFileSync(EVENTS_PATH, "utf8"));
    return Array.isArray(rows) ? rows.slice(-60) : [];
  } catch {
    return [];
  }
}
function readDevices() {
  try {
    const rows = JSON.parse(readFileSync(DEVICES_PATH, "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
function totpUri(secret) {
  return "otpauth://totp/DshRemote:DeepSeekPanel?secret=" + secret + "&issuer=DshRemote&algorithm=SHA1&digits=6&period=30";
}
function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: "127.0.0.1", timeout: 1500 });
    s.on("connect", () => {
      s.destroy();
      resolve(true);
    });
    s.on("error", () => resolve(false));
    s.on("timeout", () => {
      s.destroy();
      resolve(false);
    });
  });
}
async function buildTunnel() {
  if (sessionTunnel) {
    const fwd2 = await portOpen(3080);
    if (fwd2) return { ok: true, alreadyRunning: true, forwarder: true };
  }
  const sec = readSecrets();
  if (sec.server_mode === "official" && sec.server_token) {
    const claimTask = fetch(OFFICIAL_API_BASE + "/api/claim-port", {
      method: "POST",
      headers: { authorization: "Bearer " + sec.server_token },
      signal: AbortSignal.timeout(8e3)
    }).then(async (r) => ({ ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) })).catch((e) => ({ ok: false, status: 0, j: { error: String(e && e.message || e) } }));
    const [stopRes, claimRes] = await Promise.all([
      runBrowserctlAsync(["stop"], 8e3),
      claimTask
    ]);
    if (stopRes.error) console.error("[browserctl] stop \u5931\u8D25:", stopRes.error);
    const j = claimRes.j || {};
    if (!claimRes.ok || !j.ok || !(Number(j.remotePort) > 0)) {
      throw new Error("\u65E0\u6CD5\u83B7\u53D6\u7AEF\u53E3:" + (j.error || "HTTP " + claimRes.status));
    }
    const sec2 = readSecrets();
    sec2.frp_remote_port = Number(j.remotePort);
    if (j.linkSecret) sec2.server_link_secret = j.linkSecret;
    writeSecrets(sec2);
    try {
      const st = readState();
      st.remote_port = Number(j.remotePort);
      if (j.linkSecret) st.link_secret = j.linkSecret;
      writeState(st);
    } catch (e) {
    }
  }
  const result = runBrowserctl(["start"]);
  let fwd = false;
  const deadline = Date.now() + 15e3;
  while (Date.now() < deadline) {
    fwd = await portOpen(3080);
    if (fwd) break;
    await new Promise((r) => setTimeout(r, 400));
  }
  sessionTunnel = true;
  return { ok: true, ...result, forwarder: fwd };
}
async function qrSvg(text) {
  return QRCode.toString(text, {
    type: "svg",
    margin: 1,
    width: 220,
    color: { dark: "#101014", light: "#ffffff" }
  });
}
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(body);
}
var LOOPBACK_HOSTS = /* @__PURE__ */ new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
function isLoopbackHost(value) {
  let host = String(value || "").trim().toLowerCase();
  if (!host) return false;
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    if (end > 0) host = host.slice(0, end + 1);
  } else {
    const colon = host.lastIndexOf(":");
    if (colon > 0 && host.indexOf(":") === colon) host = host.slice(0, colon);
  }
  return LOOPBACK_HOSTS.has(host);
}
function parseCookies(header) {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    if (!k || Object.prototype.hasOwnProperty.call(out, k)) continue;
    out[k] = part.slice(idx + 1).trim();
  }
  return out;
}
function b64u(buf) {
  return Buffer.from(buf).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function verifyGateCookie(raw, linkSecret) {
  const parts = String(raw || "").split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const body = parts[1];
  const sig = parts[2];
  const expect = b64u(crypto.createHmac("sha256", String(linkSecret)).update(body).digest());
  if (sig.length !== expect.length) return false;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return false;
  } catch {
    return false;
  }
  try {
    const pad = "=".repeat((4 - body.length % 4) % 4);
    const payload = JSON.parse(Buffer.from(
      body.replace(/-/g, "+").replace(/_/g, "/") + pad,
      "base64"
    ).toString("utf8"));
    if (payload.v !== 1) return false;
    if (!payload.exp || Number(payload.exp) <= Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
function apiAuthorized(req) {
  const host = req.headers.host;
  if (host && !isLoopbackHost(host)) return false;
  const st = readState();
  const cookies = parseCookies(req.headers.cookie);
  if (cookies["bc-gate"] && st.link_secret && verifyGateCookie(cookies["bc-gate"], st.link_secret)) {
    return true;
  }
  if (st.cookie_name && Object.prototype.hasOwnProperty.call(cookies, st.cookie_name)) {
    return true;
  }
  const peer = String(req.socket && req.socket.remoteAddress || "");
  const loopback = peer === "127.0.0.1" || peer === "::1" || peer === "::ffff:127.0.0.1";
  if (loopback && !req.headers["x-real-ip"] && !req.headers["x-forwarded-for"]) {
    return true;
  }
  return false;
}
function apply(ctx, config = {}) {
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: "/browserctl/api",
    // 内核 prefix 匹配自动补 '/',带尾斜杠会变成双斜杠永不匹配
    handler: async (req, res) => {
      const url = new URL(req.url || "/", "http://dsh.invalid");
      if (!apiAuthorized(req)) {
        sendJson(res, 401, { ok: false, error: "\u672A\u6388\u6743:\u8BF7\u901A\u8FC7\u9762\u677F\u8BBF\u95EE(\u7F3A\u5C11\u6709\u6548\u4F1A\u8BDD)" });
        return;
      }
      const route = url.pathname.replace(/\/+$/, "") || url.pathname;
      if (route === "/browserctl/api/ensure") {
        if (ensureRunning) {
          sendJson(res, 200, { ok: true, pending: true, forwarder: await portOpen(3080), link: secretLink() });
          return;
        }
        const inFlight = (async () => {
          try {
            const r = await buildTunnel();
            sendJson(res, 200, { ...r, link: secretLink() });
          } catch (e) {
            console.error("[browserctl] ensure \u5F02\u5E38:", e);
            sendJson(res, 503, { ok: false, error: "\u542F\u52A8\u5931\u8D25:" + String(e && e.message || e) });
          } finally {
            ensureRunning = null;
          }
        })();
        ensureRunning = inFlight;
        return;
      }
      if (route === "/browserctl/api/status") {
        const fwd = await portOpen(3080);
        sendJson(res, 200, { forwarder: fwd, link: secretLink() });
        return;
      }
      if (route === "/browserctl/api/stop") {
        try {
          const sec = readSecrets();
          if (sec.server_mode === "official" && sec.server_token) {
            await fetch(OFFICIAL_API_BASE + "/api/release-port", {
              method: "POST",
              headers: { authorization: "Bearer " + sec.server_token },
              signal: AbortSignal.timeout(5e3)
            });
          }
        } catch (e) {
          console.error("[browserctl] release-port \u5F02\u5E38:", e);
        }
        sendJson(res, 200, runBrowserctl(["stop"]));
        return;
      }
      if (route === "/browserctl/api/qr") {
        try {
          const r = await fetch("http://127.0.0.1:3080/browserctl-gate/link?ttl=86400", {
            method: "GET",
            headers: adminHeaders(),
            signal: AbortSignal.timeout(4e3)
          });
          const j = await r.json();
          if (!j.ok) {
            sendJson(res, 503, { error: j.error || "\u95F8\u673A\u672A\u5C31\u7EEA" });
            return;
          }
          const uidUrl = toUidUrl(j.url);
          const svg = await qrSvg(uidUrl);
          sendJson(res, 200, { url: uidUrl, svg, ttl: j.ttl, exp: j.exp, panel: effectivePanelUrl() });
        } catch (e) {
          sendJson(res, 503, { error: '\u95F8\u673A\u672A\u8FD0\u884C:\u5148\u70B9"\u5F00\u59CB\u63A7\u5236"\u542F\u52A8\u96A7\u9053(\u6216\u8FD0\u884C browserctl.py start)' });
        }
        return;
      }
      if (route === "/browserctl/api/link") {
        let ttl = 86400;
        const rawTtl = parseInt(url.searchParams.get("ttl") || "", 10);
        if (!Number.isNaN(rawTtl)) ttl = Math.max(60, Math.min(604800, rawTtl));
        let uses = 1;
        const rawUses = parseInt(url.searchParams.get("uses") || "", 10);
        if (!Number.isNaN(rawUses)) uses = Math.max(0, Math.min(99, rawUses));
        try {
          const r = await fetch("http://127.0.0.1:3080/browserctl-gate/link?ttl=" + ttl + "&uses=" + uses, {
            method: "GET",
            headers: adminHeaders(),
            signal: AbortSignal.timeout(4e3)
          });
          const j = await r.json();
          if (!j.ok) {
            sendJson(res, 503, { error: j.error || "\u95F8\u673A\u672A\u5C31\u7EEA" });
            return;
          }
          let svg = "";
          const uidUrl = toUidUrl(j.url);
          try {
            svg = await qrSvg(uidUrl);
          } catch (e) {
            svg = "";
          }
          sendJson(res, 200, { url: uidUrl, svg, ttl: j.ttl, exp: j.exp, uses: j.uses, panel: effectivePanelUrl() });
        } catch (e) {
          sendJson(res, 503, { error: '\u95F8\u673A\u672A\u8FD0\u884C:\u5148\u70B9"\u5F00\u59CB\u63A7\u5236"\u542F\u52A8\u96A7\u9053(\u6216\u8FD0\u884C browserctl.py start)' });
        }
        return;
      }
      if (route === "/browserctl/api/pair") {
        try {
          const uses = Math.max(1, Math.min(50, parseInt(url.searchParams.get("uses") || "1", 10) || 1));
          const r = await fetch("http://127.0.0.1:3080/browserctl-gate/pair?uses=" + uses, {
            method: "POST",
            headers: adminHeaders(),
            signal: AbortSignal.timeout(4e3)
          });
          const j = await r.json();
          if (!j.ok) {
            sendJson(res, 502, { error: j.error || "\u95F8\u673A\u62D2\u7EDD\u521B\u5EFA\u914D\u5BF9" });
            return;
          }
          const uidUrl = toUidUrl(j.url);
          const svg = await qrSvg(uidUrl);
          sendJson(res, 200, {
            url: uidUrl,
            svg,
            ttl: j.ttl || 60,
            panel: effectivePanelUrl(),
            once: true,
            grant: j.grant || "",
            uses: j.uses || uses,
            remaining: j.remaining || uses,
            kind: j.kind || "pair"
          });
        } catch (e) {
          sendJson(res, 503, { error: '\u95F8\u673A\u672A\u8FD0\u884C\u6216\u7248\u672C\u8F83\u65E7:\u5148\u70B9"\u5F00\u59CB\u63A7\u5236"\u542F\u52A8\u96A7\u9053(\u6216\u8FD0\u884C browserctl.py start)' });
        }
        return;
      }
      if (route === "/browserctl/api/pair-status") {
        const grant = (url.searchParams.get("g") || "").trim();
        if (!grant) {
          sendJson(res, 400, { ok: false, error: "\u7F3A\u5C11 g \u53C2\u6570" });
          return;
        }
        try {
          const r = await fetch("http://127.0.0.1:3080/browserctl-gate/pair/status?g=" + encodeURIComponent(grant), {
            headers: adminHeaders(),
            signal: AbortSignal.timeout(4e3)
          });
          const j = await r.json();
          sendJson(res, 200, j);
        } catch (e) {
          sendJson(res, 503, { ok: false, error: "\u95F8\u673A\u672A\u8FD0\u884C" });
        }
        return;
      }
      if (route === "/browserctl/api/pair-long") {
        try {
          const r = await fetch("http://127.0.0.1:3080/browserctl-gate/pair?ttl=long", {
            method: "POST",
            headers: adminHeaders(),
            signal: AbortSignal.timeout(6e3)
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.ok) {
            sendJson(res, r.ok ? 502 : 503, { error: j && j.error || "\u95F8\u673A HTTP " + r.status });
            return;
          }
          const uidUrl = toUidUrl(j.url);
          let svg = "";
          try {
            svg = await qrSvg(uidUrl);
          } catch (e) {
            svg = "";
          }
          sendJson(res, 200, { ok: true, url: uidUrl, svg, long: true, ttl: j.ttl || 0, panel: effectivePanelUrl(), kind: j.kind || "long_pair" });
        } catch (e) {
          sendJson(res, 503, { error: "\u65E0\u6CD5\u8FDE\u63A5\u6D4F\u89C8\u5668\u63A7\u5236\u95F8\u673A:" + String(e && e.message || e) + ' (\u5148\u70B9"\u5F00\u59CB\u63A7\u5236"\u542F\u52A8\u96A7\u9053)' });
        }
        return;
      }
      if (route === "/browserctl/api/totp") {
        const st = readState();
        const enabled = !!st.totp_enabled;
        const secret = st.totp_secret || null;
        const base = { enabled, secret, sessions: readSessions(), devices: readDevices(), events: readEvents() };
        if (enabled && secret) {
          base.uri = totpUri(secret);
          try {
            base.svg = await qrSvg(base.uri);
          } catch {
          }
        } else if (secret) {
          base.uri = totpUri(secret);
        }
        sendJson(res, 200, base);
        return;
      }
      if (route === "/browserctl/api/totp-toggle") {
        const enabled = (url.searchParams.get("enabled") || "").trim();
        const reset = (url.searchParams.get("reset") || "").trim();
        const result = totpWrite(enabled === "1", reset === "1");
        if (result.ok && result.enabled && result.secret) {
          result.uri = totpUri(result.secret);
          try {
            result.svg = await qrSvg(result.uri);
          } catch {
          }
        }
        sendJson(res, 200, result);
        return;
      }
      if (route === "/browserctl/api/totp-kick") {
        const dev = (url.searchParams.get("dev") || "").trim();
        const st = readState();
        if (dev) {
          st.gate_kick_devs = [...st.gate_kick_devs || [], dev];
        } else {
          st.gate_kick_seq = (st.gate_kick_seq || 0) + 1;
        }
        try {
          writeState(st);
        } catch (e) {
          sendJson(res, 500, { ok: false, error: String(e) });
          return;
        }
        sendJson(res, 200, { ok: true });
        return;
      }
      if (route === "/browserctl/api/blacklist-remove") {
        const ip = (url.searchParams.get("ip") || "").trim();
        if (!ip) {
          sendJson(res, 400, { ok: false, error: "\u7F3A\u5C11 ip \u53C2\u6570" });
          return;
        }
        const rows = readBlacklist();
        const next = rows.filter((r) => r.ip !== ip);
        try {
          writeBlacklist(next);
        } catch (e) {
          sendJson(res, 500, { ok: false, error: String(e) });
          return;
        }
        sendJson(res, 200, { ok: true, blacklist: next });
        return;
      }
      if (route === "/browserctl/api/blacklist-add") {
        const ip = (url.searchParams.get("ip") || "").trim();
        const dev = (url.searchParams.get("dev") || "").trim();
        if (!ip && !dev) {
          sendJson(res, 400, { ok: false, error: "\u7F3A\u5C11 ip \u6216 dev \u53C2\u6570" });
          return;
        }
        const rows = readBlacklist();
        const existing = rows.find((r) => r.ip === ip);
        if (existing) {
          const n = (url.searchParams.get("name") || "").trim();
          const rs = (url.searchParams.get("reason") || "").trim();
          if (n) existing.name = n;
          if (rs) existing.reason = rs;
        } else {
          rows.push({
            ip,
            dev,
            name: (url.searchParams.get("name") || "\u672A\u77E5").trim(),
            reason: (url.searchParams.get("reason") || "\u7BA1\u7406\u5458\u5C01\u7981").trim(),
            since: Date.now() / 1e3
          });
        }
        try {
          writeBlacklist(rows);
        } catch (e) {
          sendJson(res, 500, { ok: false, error: String(e) });
          return;
        }
        sendJson(res, 200, { ok: true, blacklist: readBlacklist() });
        return;
      }
      if (route === "/browserctl/api/server/oauth/begin") {
        if (req.method !== "POST") {
          sendJson(res, 405, { ok: false, error: "POST only" });
          return;
        }
        try {
          const r = await fetch(OFFICIAL_API_BASE + "/api/oauth/device", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ client_id: OAUTH_CLIENT_ID }),
            signal: AbortSignal.timeout(1e4)
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.ok) {
            sendJson(res, r.ok ? 400 : r.status, { ok: false, error: j.error || "\u5B98\u65B9\u670D\u52A1\u5668 HTTP " + r.status });
            return;
          }
          sendJson(res, 200, {
            ok: true,
            deviceCode: j.device_code,
            userCode: j.user_code,
            verificationUri: j.verification_uri_complete || j.verification_uri,
            expiresIn: Number(j.expires_in) || 900,
            interval: Math.max(3, Number(j.interval) || 5)
          });
        } catch (e) {
          sendJson(res, 502, { ok: false, error: "\u65E0\u6CD5\u8FDE\u63A5\u5B98\u65B9\u670D\u52A1\u5668:" + String(e && e.message || e) });
        }
        return;
      }
      if (route === "/browserctl/api/server/oauth/open") {
        if (req.method !== "POST") {
          sendJson(res, 405, { ok: false, error: "POST only" });
          return;
        }
        const raw = (url.searchParams.get("url") || "").trim();
        let target;
        try {
          target = new URL(raw);
        } catch {
          sendJson(res, 400, { ok: false, error: "url \u53C2\u6570\u65E0\u6548" });
          return;
        }
        const host = target.hostname.toLowerCase();
        if (!(host === "remote.ymzcc.com" || host.endsWith(".ymzcc.com"))) {
          sendJson(res, 400, { ok: false, error: "\u4E0D\u5141\u8BB8\u6253\u5F00\u8BE5\u5730\u5740" });
          return;
        }
        const href = target.toString();
        const candidates = [
          ["cmd", ["/c", "start", "", href]],
          ["rundll32", ["url.dll,FileProtocolHandler", href]],
          ["explorer", [href]]
        ];
        let launched = false;
        for (const [bin, args] of candidates) {
          try {
            const child = spawn(bin, args, {
              cwd: path.dirname(SCRIPT_PATH),
              stdio: "ignore",
              detached: true,
              windowsHide: true
            });
            child.on("error", () => {
            });
            child.unref();
            launched = true;
          } catch {
          }
        }
        if (!launched) {
          sendJson(res, 500, { ok: false, error: "\u65E0\u6CD5\u6253\u5F00\u6D4F\u89C8\u5668,\u8BF7\u7528\u4E0B\u65B9\u94FE\u63A5\u624B\u52A8\u6253\u5F00" });
          return;
        }
        sendJson(res, 200, { ok: true });
        return;
      }
      if (route === "/browserctl/api/server/oauth/poll") {
        if (req.method !== "POST") {
          sendJson(res, 405, { ok: false, error: "POST only" });
          return;
        }
        const deviceCode = (url.searchParams.get("device_code") || "").trim();
        if (!deviceCode) {
          sendJson(res, 400, { ok: false, error: "\u7F3A\u5C11 device_code \u53C2\u6570" });
          return;
        }
        try {
          const r = await fetch(OFFICIAL_API_BASE + "/api/oauth/token", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              grant_type: "urn:ietf:params:oauth:grant-type:device_code",
              device_code: deviceCode,
              client_id: OAUTH_CLIENT_ID
            }),
            signal: AbortSignal.timeout(1e4)
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.ok) {
            const code = j.code || "";
            if (code === "authorization_pending" || code === "slow_down") {
              sendJson(res, 200, { ok: false, pending: true, interval: Math.max(3, Number(j.interval) || 5), error: j.error || "\u7B49\u5F85\u6388\u6743" });
              return;
            }
            sendJson(res, 200, { ok: false, pending: false, error: j.error || "\u5B98\u65B9\u670D\u52A1\u5668 HTTP " + r.status, code });
            return;
          }
          applyOfficialSession(j);
          sendJson(res, 200, {
            ok: true,
            email: j.email || "",
            uid: j.uid,
            remotePort: Number(j.remotePort) || null,
            panelUrl: j.panelUrl || null
          });
        } catch (e) {
          sendJson(res, 502, { ok: false, error: "\u65E0\u6CD5\u8FDE\u63A5\u5B98\u65B9\u670D\u52A1\u5668:" + String(e && e.message || e) });
        }
        return;
      }
      if (route === "/browserctl/api/server/logout") {
        if (req.method !== "POST") {
          sendJson(res, 405, { ok: false, error: "POST only" });
          return;
        }
        const sec = readSecrets();
        delete sec.server_uid;
        delete sec.server_email;
        delete sec.server_token;
        delete sec.server_link_secret;
        delete sec.server_panel_url;
        delete sec.frp_remote_port;
        writeSecrets(sec);
        try {
          const st = readState();
          st.link_secret = crypto.randomBytes(16).toString("hex");
          st.gate_kick_seq = (st.gate_kick_seq || 0) + 1;
          writeState(st);
        } catch (e) {
        }
        sendJson(res, 200, { ok: true });
        return;
      }
      if (route === "/browserctl/api/server/me") {
        const sec = readSecrets();
        if (!sec.server_token) {
          sendJson(res, 200, { ok: false, loggedIn: false });
          return;
        }
        try {
          const r = await fetch(OFFICIAL_API_BASE + "/api/me", {
            headers: { authorization: "Bearer " + sec.server_token },
            signal: AbortSignal.timeout(8e3)
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.ok) {
            sendJson(res, 200, { ok: true, loggedIn: false, stale: true });
            return;
          }
          sendJson(res, 200, { ok: true, loggedIn: true, email: j.email, uid: j.uid, remotePort: j.remotePort, panelUrl: j.panelUrl, status: j.status });
        } catch (e) {
          sendJson(res, 502, { ok: false, error: "\u65E0\u6CD5\u8FDE\u63A5\u5B98\u65B9\u670D\u52A1\u5668:" + String(e && e.message || e) });
        }
        return;
      }
      if (route === "/browserctl/api/config") {
        if (req.method === "POST" || req.method === "PUT") {
          const mode = (url.searchParams.get("mode") || "official").trim();
          try {
            const sec2 = readSecrets();
            if (sec2.frp_token && !sec2.frp_token_official) {
              sec2.frp_token_official = sec2.frp_token;
            }
            if (mode === "selfhost") {
              const host = (url.searchParams.get("host") || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
              const port = parseInt(url.searchParams.get("port") || "17000", 10);
              const remotePort = parseInt(url.searchParams.get("remotePort") || "", 10);
              const token = (url.searchParams.get("token") || "").trim();
              if (!host) {
                sendJson(res, 400, { ok: false, error: "\u7F3A\u5C11 host \u53C2\u6570" });
                return;
              }
              sec2.server_mode = "selfhost";
              sec2.ssh_host = host;
              sec2.frp_server_port = Number.isFinite(port) && port > 0 ? port : 17e3;
              sec2.frp_remote_port = Number.isFinite(remotePort) && remotePort > 0 ? remotePort : 17901;
              if (token) sec2.frp_token = token;
            } else {
              sec2.server_mode = "official";
              if (!sec2.server_uid) delete sec2.frp_remote_port;
              delete sec2.ssh_host;
              delete sec2.frp_server_port;
            }
            writeSecrets(sec2);
            sendJson(res, 200, {
              ok: true,
              mode: sec2.server_mode,
              account: sec2.server_uid ? { email: sec2.server_email, uid: sec2.server_uid, remotePort: Number(sec2.frp_remote_port) || null } : null
            });
          } catch (e) {
            sendJson(res, 500, { ok: false, error: String(e) });
          }
          return;
        }
        const sec = readSecrets();
        if (sec.server_mode === "selfhost") {
          sendJson(res, 200, {
            mode: "selfhost",
            host: sec.ssh_host || "",
            port: Number(sec.frp_server_port) || 17e3,
            remotePort: Number(sec.frp_remote_port) || 17901,
            hasToken: !!sec.frp_token,
            version: VERSION
          });
        } else {
          sendJson(res, 200, {
            mode: "official",
            account: sec.server_uid ? { email: sec.server_email || "", uid: sec.server_uid, remotePort: Number(sec.frp_remote_port) || null } : null,
            version: VERSION
          });
        }
        return;
      }
      if (route === "/browserctl/api/update-check") {
        let j = null;
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 5e3);
          let r;
          try {
            r = await fetch(UPDATE_MANIFEST_URL, { signal: ctrl.signal, cache: "no-store" });
          } finally {
            clearTimeout(timer);
          }
          if (!r.ok) {
            sendJson(res, 200, { ok: false, error: "\u66F4\u65B0\u670D\u52A1\u5668\u8FD4\u56DE HTTP " + r.status });
            return;
          }
          j = await r.json();
        } catch (e) {
          sendJson(res, 200, { ok: false, error: "\u65E0\u6CD5\u8FDE\u63A5\u66F4\u65B0\u670D\u52A1\u5668:" + String(e && e.message || e) });
          return;
        }
        const latest = String(j && j.version || "").trim() || VERSION;
        sendJson(res, 200, {
          ok: true,
          current: VERSION,
          latest,
          hasUpdate: cmpVersion(latest, VERSION) > 0,
          downloadUrl: j && j.downloadUrl || "",
          notes: Array.isArray(j && j.notes) ? j.notes : []
        });
        return;
      }
      sendJson(res, 404, { error: "unknown route" });
    }
  }), "dshremote: routes");
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: "/browserctl-gate",
    handler: async (req, res) => {
      const url = new URL(req.url || "/", "http://dsh.invalid");
      if (!apiAuthorized(req)) {
        sendJson(res, 401, { ok: false, error: "\u672A\u6388\u6743:\u8BF7\u901A\u8FC7\u9762\u677F\u8BBF\u95EE(\u7F3A\u5C11\u6709\u6548\u4F1A\u8BDD)" });
        return;
      }
      const chunks = [];
      try {
        for await (const c of req) chunks.push(c);
      } catch {
      }
      const body = Buffer.concat(chunks);
      const isLocalCall = !req.headers["x-real-ip"] && !req.headers["x-forwarded-for"];
      let upstream;
      try {
        upstream = await fetch("http://127.0.0.1:3080" + url.pathname + url.search, {
          method: req.method || "GET",
          headers: {
            "content-type": req.headers["content-type"] || "application/json",
            cookie: req.headers["cookie"] || "",
            ...isLocalCall ? adminHeaders() : {}
          },
          body: body.length ? body : void 0,
          signal: AbortSignal.timeout(1e4)
        });
      } catch (e) {
        sendJson(res, 502, { ok: false, error: "\u95F8\u673A\u4E0D\u53EF\u8FBE(\u672A\u542F\u52A8?)" });
        return;
      }
      const text = await upstream.text();
      const headers = { "cache-control": "no-store" };
      const ct = upstream.headers.get("content-type");
      if (ct) headers["content-type"] = ct;
      const setCookies = upstream.headers.getSetCookie ? upstream.headers.getSetCookie() : [];
      res.writeHead(upstream.status, headers);
      for (const sc of setCookies) res.setHeader("Set-Cookie", sc);
      res.end(text);
    }
  }), "dshremote: gate proxy");
  if (process.platform === "win32") {
    ctx.effect(() => {
      const script = path.join(ROOT, "win_push.py");
      if (!existsSync(script)) return void 0;
      try {
        const child = spawn("python", [script], { cwd: ROOT, stdio: "ignore" });
        child.on("error", () => {
        });
        return () => {
          try {
            child.kill();
          } catch {
          }
        };
      } catch {
        return void 0;
      }
    }, "dshremote: win push");
  }
  ctx.effect(() => {
    let timer = null;
    try {
      const sec = readSecrets();
      const st = readState();
      const ready = sec.server_mode === "official" && sec.server_token || Number(sec.frp_remote_port) > 0 || Number(st.remote_port) > 0;
      if (!ready) return void 0;
      timer = setTimeout(() => {
        if (ensureRunning) return;
        ensureRunning = (async () => {
          try {
            for (let attempt = 1; attempt <= 4; attempt++) {
              try {
                const r = await buildTunnel();
                if (r && r.forwarder) return r;
              } catch (e) {
              }
              if (attempt < 4) await new Promise((res) => setTimeout(res, 5e3));
            }
          } catch (e) {
            console.error("[browserctl] \u542F\u52A8\u81EA\u52A8\u5EFA\u96A7\u9053\u5931\u8D25:", e);
          } finally {
            ensureRunning = null;
          }
        })();
      }, 4e3);
    } catch (e) {
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, "dshremote: auto-start tunnel on DSH launch");
  ctx.effect(() => {
    return () => {
      try {
        const sec = readSecrets();
        if (sec.server_mode === "official" && sec.server_token) {
          fetch(OFFICIAL_API_BASE + "/api/release-port", {
            method: "POST",
            headers: { authorization: "Bearer " + sec.server_token },
            signal: AbortSignal.timeout(2e3)
          }).catch(() => {
          });
        }
        try {
          spawn("python", [SCRIPT_PATH, "stop"], {
            cwd: path.dirname(SCRIPT_PATH),
            stdio: "ignore",
            detached: true,
            windowsHide: true
          }).unref();
        } catch (e) {
        }
      } catch (e) {
      }
    };
  }, "dshremote: release tunnel on DSH exit");
  ctx.logger.info("dshremote: host half ready (panel %s)", PANEL_URL);
}
export {
  apply,
  inject,
  name
};
