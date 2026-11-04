/**
 * dsh-plugin-browserctl — host half.
 * 提供 /browserctl/api/* 本机路由:
 *   /api/ensure   拉起穿透隧道(browserctl.py start)
 *   /api/status   转发器状态 + 面板/扫码链接
 *   /api/qr       扫码链接 + QR SVG
 *   /api/stop     停止隧道
 * 仅监听 127.0.0.1;链接密钥来自 browserctl_state.json。
 */
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import net from 'node:net'
import { existsSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

export const name = 'browserctl'
export const inject = ['webServer']

// 路径全部相对插件目录解析:插件位于 <root>/dsh-plugin-browserctl/,核心文件在 <root>/。
// 这样仓库克隆到任意位置、任意机器都能直接跑,不再依赖作者本机绝对路径。
// ESM 下没有 __dirname:bundle 是单文件 lib/index.js,import.meta.url 即它自身位置。
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const STATE_PATH = path.join(ROOT, 'browserctl_state.json')
const BLACKLIST_PATH = path.join(ROOT, 'browserctl_blacklist.json')
const SESSIONS_PATH = path.join(ROOT, 'browserctl_sessions.json')
const EVENTS_PATH = path.join(ROOT, 'browserctl_events.json')
const DEVICES_PATH = path.join(ROOT, 'browserctl_devices.json')
const SCRIPT_PATH = path.join(ROOT, 'browserctl.py')
const SECRETS_PATH = path.join(ROOT, 'browserctl_secrets.json')
// 本地管理令牌:闸机把特权端点(生成链接/配对码/改推送开关)从「loopback 即管理员」
// 改成「loopback + 持有令牌」。每次调用都重新读,这样闸机重启后新建的令牌能立刻生效。
const ADMIN_TOKEN_PATH = path.join(ROOT, 'browserctl_admin_token')

function adminHeaders() {
  try {
    const tok = readFileSync(ADMIN_TOKEN_PATH, 'utf8').trim()
    if (tok) return { 'x-bc-admin': tok }
  } catch {}
  return {}
}

// 插件/面板版本号(「关于」面板与 /api/config 共用)
const VERSION = '0.2.0'

// 官方多用户服务(注册/登录/端口分配):登录后 secrets 记 server_uid/server_token/
// server_link_secret/frp_remote_port,闸机 state.link_secret 换成服务器签发的 per-user 密钥。
const OFFICIAL_API_BASE = 'https://remote.ymzcc.com/dsh-remote'

// 官方服务器默认地址(自建服务器模式下「面板链接」自适应为 https://<host>/p/<remotePort>/)
const PANEL_URL = 'https://remote.ymzcc.com/p/17901/'

// 手机 App 长期配对服务端(OpenResty 反代 /pair/api/,X-Pair-Auth 由反代注入)
const PAIR_ISSUE_URL = 'https://remote.ymzcc.com/pair/api/issue'
const CONFIRM_BASE = 'https://remote.ymzcc.com/pair/confirm'

// 更新清单:随官网 web/ 一起部署到 /dsh-remote/,「检查更新」从这里拉取最新版本/下载地址/更新说明
const UPDATE_MANIFEST_URL = 'https://remote.ymzcc.com/dsh-remote/version.json'

// 原子写(tmp + rename):避免外部脚本/看门狗读到半截文件后把 state 覆盖成残缺 dict
function atomicWrite(file, data) {
  const tmp = file + '.tmp'
  writeFileSync(tmp, data, 'utf8')
  try { renameSync(tmp, file) } catch (e) {
    try { rmSync(tmp, { force: true }) } catch {}
    throw e
  }
}

function readState() {
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function readBlacklist() {
  try {
    const rows = JSON.parse(readFileSync(BLACKLIST_PATH, 'utf8'))
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

function writeBlacklist(rows) {
  const seen = new Set()
  const deduped = []
  for (const r of (rows || [])) {
    const ip = String((r && r.ip) || '').trim()
    if (!ip || seen.has(ip)) continue
    seen.add(ip)
    deduped.push({ ...r, ip })
  }
  atomicWrite(BLACKLIST_PATH, JSON.stringify(deduped, null, 2))
  return deduped
}

function writeState(st) {
  atomicWrite(STATE_PATH, JSON.stringify(st, null, 2))
}

// ---- 配置(凭据)文件读写:读改写保留其它键,原子写,绝不向外返回 token 明文 ----
function readSecrets() {
  try {
    return JSON.parse(readFileSync(SECRETS_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function writeSecrets(sec) {
  atomicWrite(SECRETS_PATH, JSON.stringify(sec, null, 2))
}

// 面板链接自适应:自建模式 = https://<host>/p/<remotePort>/;
// 官方多用户(已登录)= 服务器下发的 panelUrl(按分配端口);
// 都没有 = 官方默认(作者机器 17901,行为与历史完全一致)。
function effectivePanelUrl() {
  try {
    const sec = readSecrets()
    if (sec && sec.server_mode === 'selfhost' && sec.ssh_host) {
      const host = String(sec.ssh_host).replace(/^https?:\/\//, '').replace(/\/+$/, '')
      const rp = Number(sec.frp_remote_port) || 17901
      if (host) return 'https://' + host + '/p/' + rp + '/'
    }
    if (sec && sec.server_mode === 'official' && sec.server_uid) {
      if (sec.server_panel_url) return String(sec.server_panel_url)
      const rp = Number(sec.frp_remote_port) || 0
      if (rp > 0) return 'https://remote.ymzcc.com/p/' + rp + '/'
    }
  } catch {}
  return PANEL_URL
}

function secretLink() {
  // 安全:不再把永久 link_secret 下发给前端。引导链接统一走闸机 /browserctl-gate/link
  // (HMAC + 24h 过期),一次性配对走 /browserctl-gate/pair。
  return null
}

function runBrowserctl(args) {
  const script = SCRIPT_PATH
  if (!existsSync(script)) return { started: false, error: 'browserctl.py 不存在: ' + script }
  const creationflags = process.platform === 'win32'
    ? (0x00000008 | 0x00000200 | 0x01000000) // DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_BREAKAWAY_FROM_JOB
    : 0
  const child = spawn('python', [script, ...args], {
    cwd: path.dirname(script),
    stdio: 'ignore',
    detached: true,
    creationflags,
  })
  child.unref()
  return { started: true }
}

function totpWrite(enabled, reset) {
  const st = readState()
  if (enabled && (reset || !st.totp_secret)) {
    st.totp_secret = base32Encode(crypto.randomBytes(20))
  }
  if (!enabled && reset) delete st.totp_secret
  st.totp_enabled = !!enabled
  st.gate_kick_seq = (st.gate_kick_seq || 0) + 1
  if (enabled) delete st.gate_kicked_devs // 2FA 启用后由动态码把关,清空"2FA 关闭时"的已踢名单
  try {
    writeState(st)
  } catch (e) {
    return { ok: false, error: String(e) }
  }
  return { ok: true, enabled: !!enabled, secret: st.totp_secret || null }
}

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function base32Encode(buf) {
  let bits = 0, value = 0, out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

function readSessions() {
  try {
    let rows = JSON.parse(readFileSync(SESSIONS_PATH, 'utf8'))
    if (!Array.isArray(rows)) return []
    const now = Date.now() / 1000
    // 去重:同一 (ip, name) 只保留最近一条,同时清理超过 30 天的旧会话
    const seen = new Map()
    for (const r of rows) {
      if (!r || !r.dev) continue
      const age = now - (r.ts || r.since || now)
      if (age > 30 * 86400) continue // 超过 30 天不显示了
      const key = (r.ip || '') + '::' + (r.name || '')
      const prev = seen.get(key)
      if (!prev || (r.ts || 0) > (prev.ts || 0)) {
        seen.set(key, r)
      }
    }
    return [...seen.values()]
  } catch {
    return []
  }
}

function readEvents() {
  try {
    const rows = JSON.parse(readFileSync(EVENTS_PATH, 'utf8'))
    return Array.isArray(rows) ? rows.slice(-60) : []
  } catch {
    return []
  }
}

function readDevices() {
  // 设备历史注册表:在册设备(含当前在线和历史上线),由闸机 housekeeping 维护。
  try {
    const rows = JSON.parse(readFileSync(DEVICES_PATH, 'utf8'))
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

function totpUri(secret) {
  return 'otpauth://totp/DshRemote:DeepSeekPanel?secret=' + secret +
    '&issuer=DshRemote&algorithm=SHA1&digits=6&period=30'
}

function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: '127.0.0.1', timeout: 1500 })
    s.on('connect', () => { s.destroy(); resolve(true) })
    s.on('error', () => resolve(false))
    s.on('timeout', () => { s.destroy(); resolve(false) })
  })
}

async function qrSvg(text) {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 1,
    width: 220,
    color: { dark: '#101014', light: '#ffffff' },
  })
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(body)
}

// 版本比较:按点号分段数字比较(支持 0.1.0 vs 0.2.1、1.0 vs 1.0.1)。
// 返回 1 = a 新, -1 = b 新, 0 = 相同。
function compareVersions(a, b) {
  const pa = String(a || '').split('.').map(n => parseInt(n, 10) || 0)
  const pb = String(b || '').split('.').map(n => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0
    const y = pb[i] || 0
    if (x !== y) return x > y ? 1 : -1
  }
  return 0
}

/** 读取请求原始 body (Buffer),用于 multipart 转发 */
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// ---- 插件 API 鉴权(C-02/C-03) ----
// 之前 /browserctl/api/* 完全绕过 DSH 鉴权:本机/同网段直连即可读 TOTP 明文密钥、
// 踢设备、建配对码。现在按"谁在调用"分级放行:
//   1) Host 必须是回环(隧道进来时 nginx/闸机已把 Host 改写成 127.0.0.1;防 DNS rebinding);
//   2) 带有效 bc-gate Cookie(HMAC-SHA256 + 有效期)→ 已配对设备/远程面板;
//   3) 带 DSH 授权 Cookie(与 state 的 cookie_name 同名)→ 面板已授权;
//   4) 本机直连(对端 loopback)且没有任何转发头 → 本地 DSH 面板/CLI。
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

function isLoopbackHost(value) {
  let host = String(value || '').trim().toLowerCase()
  if (!host) return false
  if (host.startsWith('[')) {
    const end = host.indexOf(']')
    if (end > 0) host = host.slice(0, end + 1)
  } else {
    const colon = host.lastIndexOf(':')
    if (colon > 0 && host.indexOf(':') === colon) host = host.slice(0, colon)
  }
  return LOOPBACK_HOSTS.has(host)
}

function parseCookies(header) {
  const out = {}
  for (const part of String(header || '').split(';')) {
    const idx = part.indexOf('=')
    if (idx <= 0) continue
    const k = part.slice(0, idx).trim()
    if (!k || Object.prototype.hasOwnProperty.call(out, k)) continue
    out[k] = part.slice(idx + 1).trim()
  }
  return out
}

function b64u(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

// 复刻闸机 gate_check_cookie:bc-gate = v1.<b64u(payload)>.<b64u(HMAC-SHA256(link_secret, body))>
function verifyGateCookie(raw, linkSecret) {
  const parts = String(raw || '').split('.')
  if (parts.length !== 3 || parts[0] !== 'v1') return false
  const body = parts[1]
  const sig = parts[2]
  const expect = b64u(crypto.createHmac('sha256', String(linkSecret)).update(body).digest())
  if (sig.length !== expect.length) return false
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return false
  } catch {
    return false
  }
  try {
    const pad = '='.repeat((4 - (body.length % 4)) % 4)
    const payload = JSON.parse(Buffer.from(
      body.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8'))
    if (payload.v !== 1) return false
    if (!payload.exp || Number(payload.exp) <= Date.now()) return false
    return true
  } catch {
    return false
  }
}

function apiAuthorized(req) {
  const host = req.headers.host
  if (host && !isLoopbackHost(host)) return false   // 防 DNS rebinding
  const st = readState()
  const cookies = parseCookies(req.headers.cookie)
  if (cookies['bc-gate'] && st.link_secret &&
      verifyGateCookie(cookies['bc-gate'], st.link_secret)) {
    return true
  }
  if (st.cookie_name && Object.prototype.hasOwnProperty.call(cookies, st.cookie_name)) {
    return true
  }
  const peer = String((req.socket && req.socket.remoteAddress) || '')
  const loopback = peer === '127.0.0.1' || peer === '::1' || peer === '::ffff:127.0.0.1'
  if (loopback && !req.headers['x-real-ip'] && !req.headers['x-forwarded-for']) {
    return true
  }
  return false
}

export function apply(ctx, config = {}) {
  // 照抄官方 open-in-app 插件的注册方式:直接 ctx.webServer.register(ctx.effect 包裹)。
  // 之前用 ctx.inject(['webServer'], ...) 的回调从未被调用,路由一直没注册上。
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/browserctl/api',  // 内核 prefix 匹配自动补 '/',带尾斜杠会变成双斜杠永不匹配
    handler: async (req, res) => {
        const url = new URL(req.url || '/', 'http://dsh.invalid')
        // C-02/C-03:未授权请求一律 401,不返回 TOTP 密钥/设备/黑名单等敏感数据。
        if (!apiAuthorized(req)) {
          sendJson(res, 401, { ok: false, error: '未授权:请通过面板访问(缺少有效会话)' })
          return
        }
        const route = url.pathname.replace(/\/+$/, '') || url.pathname  // 归一化尾斜杠
        if (route === '/browserctl/api/ensure') {
          const result = runBrowserctl(['start'])
          // 轮询等待闸机 3080 就绪(最多 ~15s),避免固定等待在冷启动/端口释放/锁等待时误报失败
          let fwd = false
          const deadline = Date.now() + 15000
          while (Date.now() < deadline) {
            fwd = await portOpen(3080)
            if (fwd) break
            await new Promise(r => setTimeout(r, 400))
          }
          sendJson(res, 200, { ...result, forwarder: fwd, link: secretLink() })
          return
        }
        if (route === '/browserctl/api/status') {
          const fwd = await portOpen(3080)
          sendJson(res, 200, { forwarder: fwd, link: secretLink() })
          return
        }
        if (route === '/browserctl/api/stop') {
          sendJson(res, 200, runBrowserctl(['stop']))
          return
        }
        if (route === '/browserctl/api/qr') {
          // 引导链接(默认 24h 过期,gate 侧 HMAC 校验);不再下发永久静态密钥。
          try {
            const r = await fetch('http://127.0.0.1:3080/browserctl-gate/link?ttl=86400', {
              method: 'GET',
              headers: adminHeaders(),
              signal: AbortSignal.timeout(4000),
            })
            const j = await r.json()
            if (!j.ok) {
              sendJson(res, 503, { error: j.error || '闸机未就绪' })
              return
            }
            const svg = await qrSvg(j.url)
            sendJson(res, 200, { url: j.url, svg, ttl: j.ttl, exp: j.exp, panel: effectivePanelUrl() })
          } catch (e) {
            sendJson(res, 503, { error: '闸机未运行:先点"开始控制"启动隧道(或运行 browserctl.py start)' })
          }
          return
        }
        if (route === '/browserctl/api/link') {
          // iOS / 无 App 设备引导链接:按需 ttl(闸机侧 clamp 到 [60s, 7d])。
          // 同一闸机端点,额外附带二维码 SVG,让手机相机直接扫(比复制链接方便)。
          let ttl = 86400
          const rawTtl = parseInt(url.searchParams.get('ttl') || '', 10)
          if (!Number.isNaN(rawTtl)) ttl = Math.max(60, Math.min(604800, rawTtl))
          let uses = 1
          const rawUses = parseInt(url.searchParams.get('uses') || '', 10)
          if (!Number.isNaN(rawUses)) uses = Math.max(0, Math.min(99, rawUses))
          try {
            const r = await fetch('http://127.0.0.1:3080/browserctl-gate/link?ttl=' + ttl + '&uses=' + uses, {
              method: 'GET',
              headers: adminHeaders(),
              signal: AbortSignal.timeout(4000),
            })
            const j = await r.json()
            if (!j.ok) {
              sendJson(res, 503, { error: j.error || '闸机未就绪' })
              return
            }
            let svg = ''
            try { svg = await qrSvg(j.url) } catch (e) { svg = '' }
            sendJson(res, 200, { url: j.url, svg, ttl: j.ttl, exp: j.exp, uses: j.uses, panel: effectivePanelUrl() })
          } catch (e) {
            sendJson(res, 503, { error: '闸机未运行:先点"开始控制"启动隧道(或运行 browserctl.py start)' })
          }
          return
        }
        if (route === '/browserctl/api/pair') {
          // 配对码(默认 60s 一次性;?uses=N 可设该码可被扫码次数)。
          // 向闸机 loopback 端点申请 grant;闸机不可用或为老版本时返回明确错误,
          // client 半自动回退到长期链接密钥(/api/qr)。
          try {
            const uses = Math.max(1, Math.min(50, parseInt(url.searchParams.get('uses') || '1', 10) || 1))
            const r = await fetch('http://127.0.0.1:3080/browserctl-gate/pair?uses=' + uses, {
              method: 'POST',
              headers: adminHeaders(),
              signal: AbortSignal.timeout(4000),
            })
            const j = await r.json()
            if (!j.ok) {
              sendJson(res, 502, { error: j.error || '闸机拒绝创建配对' })
              return
            }
            const svg = await qrSvg(j.url)
            sendJson(res, 200, {
              url: j.url, svg, ttl: j.ttl || 60, panel: effectivePanelUrl(), once: true,
              grant: j.grant || '', uses: j.uses || uses, remaining: j.remaining || uses,
              kind: j.kind || 'pair',
            })
          } catch (e) {
            sendJson(res, 503, { error: '闸机未运行或版本较旧:先点"开始控制"启动隧道(或运行 browserctl.py start)' })
          }
          return
        }
        if (route === '/browserctl/api/pair-status') {
          // 轮询配对码状态:本地面板据此检测"有人扫码"并自动换码。
          const grant = (url.searchParams.get('g') || '').trim()
          if (!grant) { sendJson(res, 400, { ok: false, error: '缺少 g 参数' }); return }
          try {
            const r = await fetch('http://127.0.0.1:3080/browserctl-gate/pair/status?g=' + encodeURIComponent(grant), {
              headers: adminHeaders(),
              signal: AbortSignal.timeout(4000),
            })
            const j = await r.json()
            sendJson(res, 200, j)
          } catch (e) {
            sendJson(res, 503, { ok: false, error: '闸机未运行' })
          }
          return
        }
        if (route === '/browserctl/api/pair-long') {
          // 手机 App 长期配对:向本机闸机申请 7 天有效的长期 grant(ttl=long),
          // 二维码指向 /browserctl-gate/pair/claim?g=<grant>。
          // 手机 App 扫码后 WebView 打开该链接 → 闸机签发 30 天 bc-gate cookie → 302 进面板,
          // 之后打开 App 免扫码直连。与 60s 一次性配对互补,同样复用闸机认证/踢下线机制。
          try {
            const r = await fetch('http://127.0.0.1:3080/browserctl-gate/pair?ttl=long', {
              method: 'POST',
              headers: adminHeaders(),
              signal: AbortSignal.timeout(6000),
            })
            const j = await r.json().catch(() => ({}))
            if (!r.ok || !j.ok) {
              sendJson(res, r.ok ? 502 : 503, { error: (j && j.error) || ('闸机 HTTP ' + r.status) })
              return
            }
            let svg = ''
            try { svg = await qrSvg(j.url) } catch (e) { svg = '' }
            sendJson(res, 200, { ok: true, url: j.url, svg, long: true, ttl: j.ttl || 0, panel: effectivePanelUrl(), kind: j.kind || 'long_pair' })
          } catch (e) {
            sendJson(res, 503, { error: '无法连接浏览器控制闸机:' + String((e && e.message) || e) + ' (先点"开始控制"启动隧道)' })
          }
          return
        }
        if (route === '/browserctl/api/totp') {
          const st = readState()
          const enabled = !!st.totp_enabled
          const secret = st.totp_secret || null
          const base = { enabled, secret, sessions: readSessions(), devices: readDevices(), events: readEvents() }
          if (enabled && secret) {
            base.uri = totpUri(secret)
            try {
              base.svg = await qrSvg(base.uri)
            } catch {}
          } else if (secret) {
            base.uri = totpUri(secret)
          }
          sendJson(res, 200, base)
          return
        }
        if (route === '/browserctl/api/totp-toggle') {
          // DSH webServer 排空请求体:参数走查询串
          const enabled = (url.searchParams.get('enabled') || '').trim()
          const reset = (url.searchParams.get('reset') || '').trim()
          const result = totpWrite(enabled === '1', reset === '1')
          if (result.ok && result.enabled && result.secret) {
            result.uri = totpUri(result.secret)
            try { result.svg = await qrSvg(result.uri) } catch {}
          }
          sendJson(res, 200, result)
          return
        }
        if (route === '/browserctl/api/totp-kick') {
          // 注意:DSH webServer 会在分发前排空请求体,body 读不到。
          // 因此参数一律走查询串(?dev=...),无 dev 即全部踢下线。
          const dev = (url.searchParams.get('dev') || '').trim()
          const st = readState()
          if (dev) {
            st.gate_kick_devs = [...(st.gate_kick_devs || []), dev]
          } else {
            st.gate_kick_seq = (st.gate_kick_seq || 0) + 1
          }
          try {
            writeState(st)
          } catch (e) {
            sendJson(res, 500, { ok: false, error: String(e) })
            return
          }
          sendJson(res, 200, { ok: true })
          return
        }
        if (route === '/browserctl/api/blacklist-remove') {
          const ip = (url.searchParams.get('ip') || '').trim()
          if (!ip) { sendJson(res, 400, { ok: false, error: '缺少 ip 参数' }); return }
          const rows = readBlacklist()
          const next = rows.filter(r => r.ip !== ip)
          try { writeBlacklist(next) } catch (e) { sendJson(res, 500, { ok: false, error: String(e) }); return }
          sendJson(res, 200, { ok: true, blacklist: next })
          return
        }
        if (route === '/browserctl/api/blacklist-add') {
          const ip = (url.searchParams.get('ip') || '').trim()
          const dev = (url.searchParams.get('dev') || '').trim()
          if (!ip && !dev) { sendJson(res, 400, { ok: false, error: '缺少 ip 或 dev 参数' }); return }
          const rows = readBlacklist()
          const existing = rows.find(r => r.ip === ip)
          if (existing) {
            const n = (url.searchParams.get('name') || '').trim()
            const rs = (url.searchParams.get('reason') || '').trim()
            if (n) existing.name = n
            if (rs) existing.reason = rs
          } else {
            rows.push({
              ip,
              dev,
              name: (url.searchParams.get('name') || '未知').trim(),
              reason: (url.searchParams.get('reason') || '管理员封禁').trim(),
              since: Date.now() / 1000,
            })
          }
          try { writeBlacklist(rows) } catch (e) { sendJson(res, 500, { ok: false, error: String(e) }); return }
          sendJson(res, 200, { ok: true, blacklist: readBlacklist() })
          return
        }
        // ---- 官方多用户账号(注册/验证/登录/退出)----
        // 密码只走本机回环 URL → 插件内 fetch 以 JSON body 转发到官方服务(HTTPS)。
        if (route === '/browserctl/api/server/register') {
          if (req.method !== 'POST') { sendJson(res, 405, { ok: false, error: 'POST only' }); return }
          const email = (url.searchParams.get('email') || '').trim()
          const password = url.searchParams.get('password') || ''
          if (!email || !password) { sendJson(res, 400, { ok: false, error: '缺少 email/password 参数' }); return }
          try {
            const r = await fetch(OFFICIAL_API_BASE + '/api/register', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ email, password }),
              signal: AbortSignal.timeout(10000),
            })
            const j = await r.json().catch(() => ({}))
            sendJson(res, r.status, { ok: !!j.ok, needVerify: !!j.needVerify, devLink: j.devLink || null, error: j.error || null })
          } catch (e) {
            sendJson(res, 502, { ok: false, error: '无法连接官方服务器:' + String((e && e.message) || e) })
          }
          return
        }
        if (route === '/browserctl/api/server/login') {
          if (req.method !== 'POST') { sendJson(res, 405, { ok: false, error: 'POST only' }); return }
          const email = (url.searchParams.get('email') || '').trim()
          const password = url.searchParams.get('password') || ''
          if (!email || !password) { sendJson(res, 400, { ok: false, error: '缺少 email/password 参数' }); return }
          try {
            const r = await fetch(OFFICIAL_API_BASE + '/api/login', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ email, password }),
              signal: AbortSignal.timeout(10000),
            })
            const j = await r.json().catch(() => ({}))
            if (!r.ok || !j.ok) {
              sendJson(res, r.ok ? 401 : r.status, { ok: false, error: j.error || ('官方服务器 HTTP ' + r.status) })
              return
            }
            // 应用身份:secrets 存服务器侧凭据;state.link_secret 换成服务器签发的
            // per-user 密钥(闸机每次请求都现读 state,热切换立即生效,无需重启);
            // frp_remote_port 写入分配端口,随后由 client 触发 stop+start 重建隧道。
            const sec = readSecrets()
            sec.server_mode = 'official'
            sec.server_uid = j.uid
            sec.server_email = j.email || email
            sec.server_token = j.token
            sec.server_link_secret = j.linkSecret || ''
            sec.server_panel_url = j.panelUrl || ''
            if (Number(j.remotePort) > 0) sec.frp_remote_port = Number(j.remotePort)
            // 官方 frps token 由服务器下发(不进插件源码);服务器没配则保留现值
            if (j.frpToken) sec.frp_token = j.frpToken
            writeSecrets(sec)
            try {
              const st = readState()
              if (j.linkSecret) st.link_secret = j.linkSecret
              if (Number(j.remotePort) > 0) st.remote_port = Number(j.remotePort)
              writeState(st)
            } catch (e) {
              // state 写失败(ACL/占用)不算登录失败,下次重启闸机后 secrets 仍会生效
            }
            sendJson(res, 200, {
              ok: true, email: sec.server_email, uid: j.uid,
              remotePort: Number(j.remotePort) || null, panelUrl: j.panelUrl || null,
            })
          } catch (e) {
            sendJson(res, 502, { ok: false, error: '无法连接官方服务器:' + String((e && e.message) || e) })
          }
          return
        }
        if (route === '/browserctl/api/server/logout') {
          if (req.method !== 'POST') { sendJson(res, 405, { ok: false, error: 'POST only' }); return }
          const sec = readSecrets()
          delete sec.server_uid
          delete sec.server_email
          delete sec.server_token
          delete sec.server_link_secret
          delete sec.server_panel_url
          delete sec.frp_remote_port
          writeSecrets(sec)
          // link_secret 换回本机随机值:闸机此后签发的 Cookie 不再匹配注册表,
          // 等于把自己从公网入口断开(账号还在服务器,重新登录即恢复)。
          try {
            const st = readState()
            st.link_secret = crypto.randomBytes(16).toString('hex')
            st.gate_kick_seq = (st.gate_kick_seq || 0) + 1
            writeState(st)
          } catch (e) {}
          sendJson(res, 200, { ok: true })
          return
        }
        if (route === '/browserctl/api/server/me') {
          // 用存下的 token 问服务器「我是谁/还在不在」,面板用来显示登录态
          const sec = readSecrets()
          if (!sec.server_token) { sendJson(res, 200, { ok: false, loggedIn: false }); return }
          try {
            const r = await fetch(OFFICIAL_API_BASE + '/api/me', {
              headers: { authorization: 'Bearer ' + sec.server_token },
              signal: AbortSignal.timeout(8000),
            })
            const j = await r.json().catch(() => ({}))
            if (!r.ok || !j.ok) {
              sendJson(res, 200, { ok: true, loggedIn: false, stale: true })
              return
            }
            sendJson(res, 200, { ok: true, loggedIn: true, email: j.email, uid: j.uid, remotePort: j.remotePort, panelUrl: j.panelUrl, status: j.status })
          } catch (e) {
            sendJson(res, 502, { ok: false, error: '无法连接官方服务器:' + String((e && e.message) || e) })
          }
          return
        }
        if (route === '/browserctl/api/config') {
          if (req.method === 'POST' || req.method === 'PUT') {
            // 写入连接配置。注意:DSH webServer 会排空请求体,参数一律从 query 读(历史大坑)。
            const mode = (url.searchParams.get('mode') || 'official').trim()
            try {
              const sec = readSecrets()
              // 切换模式前,先把当前官方 token 备份到 frp_token_official(保官方 token 不丢)
              if (sec.frp_token && !sec.frp_token_official) {
                sec.frp_token_official = sec.frp_token
              }
              if (mode === 'selfhost') {
                const host = (url.searchParams.get('host') || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
                const port = parseInt(url.searchParams.get('port') || '17000', 10)
                const remotePort = parseInt(url.searchParams.get('remotePort') || '', 10)
                const token = (url.searchParams.get('token') || '').trim()
                if (!host) { sendJson(res, 400, { ok: false, error: '缺少 host 参数' }); return }
                sec.server_mode = 'selfhost'
                sec.ssh_host = host
                sec.frp_server_port = Number.isFinite(port) && port > 0 ? port : 17000
                sec.frp_remote_port = Number.isFinite(remotePort) && remotePort > 0 ? remotePort : 17901
                // token 留空 = 保持现有 token(不清空);填了才覆盖
                if (token) sec.frp_token = token
              } else {
                // 官方模式:清掉自建覆盖。注意:不清 server_* 账号与分配端口——
                // 「切到官方模式」≠「退出账号」,账号走 /server/logout。
                sec.server_mode = 'official'
                if (!sec.server_uid) delete sec.frp_remote_port
                delete sec.ssh_host
                delete sec.frp_server_port
              }
              writeSecrets(sec)
              // 任何响应都不返回 token 明文
              sendJson(res, 200, {
                ok: true, mode: sec.server_mode,
                account: sec.server_uid ? { email: sec.server_email, uid: sec.server_uid, remotePort: Number(sec.frp_remote_port) || null } : null,
              })
            } catch (e) {
              sendJson(res, 500, { ok: false, error: String(e) })
            }
            return
          }
          // 读取当前连接配置。官方模式绝不返回 host/port/token 任何值;自建模式 token 只给 hasToken。
          const sec = readSecrets()
          if (sec.server_mode === 'selfhost') {
            sendJson(res, 200, {
              mode: 'selfhost',
              host: sec.ssh_host || '',
              port: Number(sec.frp_server_port) || 17000,
              remotePort: Number(sec.frp_remote_port) || 17901,
              hasToken: !!sec.frp_token,
              version: VERSION,
            })
          } else {
            sendJson(res, 200, {
              mode: 'official',
              account: sec.server_uid ? { email: sec.server_email || '', uid: sec.server_uid, remotePort: Number(sec.frp_remote_port) || null } : null,
              version: VERSION,
            })
          }
          return
        }
        if (route === '/browserctl/api/update-check') {
          // 「检查更新」:App 版本信息已迁到管理后台(dsh-remote-server),
          // 公开接口 /dsh-remote/api/app/version 返回手机 App 检查更新用的同款 JSON。
          let j = null
          try {
            const ctrl = new AbortController()
            const timer = setTimeout(() => ctrl.abort(), 5000)
            let r
            try {
              r = await fetch('https://remote.ymzcc.com/dsh-remote/api/app/version', {
                signal: ctrl.signal,
              })
            } finally {
              clearTimeout(timer)
            }
            if (!r.ok) {
              sendJson(res, 200, { ok: false, error: '更新服务器返回 HTTP ' + r.status })
              return
            }
            j = await r.json()
          } catch (e) {
            sendJson(res, 200, { ok: false, error: '无法连接更新服务器:' + String((e && e.message) || e) })
            return
          }
          if (!j || !j.ok) {
            sendJson(res, 200, { ok: false, error: '更新服务器返回数据异常' })
            return
          }
          const latestCode = Math.max(0, Number(j.latest_version_code) || 0)
          const latestName = String(j.latest_version_name || '').trim()
          if (latestCode > 0) {
            let downloadUrl = String(j.download_url || '')
            if (downloadUrl && downloadUrl.startsWith('/')) {
              downloadUrl = 'https://remote.ymzcc.com' + downloadUrl
            }
            sendJson(res, 200, {
              ok: true,
              current: VERSION,
              latest: latestName,
              hasUpdate: true,
              downloadUrl,
              notes: j.release_notes ? [j.release_notes] : [],
              versionCode: latestCode,
              versionName: latestName,
            })
          } else {
            sendJson(res, 200, { ok: true, current: VERSION, latest: latestName, hasUpdate: false })
          }
          return
        }
        sendJson(res, 404, { error: 'unknown route' })
      },
  }), 'dshremote: routes')
  // 本地 GUI(127.0.0.1 DSH)也把 /browserctl-gate/* 代理到本机闸机 3080,
  // 这样"踢下线/全部踢下线/黑名单/verify"等闸机端点在本机同样可用,无需走公网。
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/browserctl-gate',
    handler: async (req, res) => {
      const url = new URL(req.url || '/', 'http://dsh.invalid')
      // H-04:插件反代会把请求伪装成 loopback 打到闸机。未授权请求先在这里拦掉,
      // 否则公网无 Cookie 的陌生请求也能借反代创建配对码/引导链接。
      if (!apiAuthorized(req)) {
        sendJson(res, 401, { ok: false, error: '未授权:请通过面板访问(缺少有效会话)' })
        return
      }
      const chunks = []
      try {
        for await (const c of req) chunks.push(c)
      } catch {}
      const body = Buffer.concat(chunks)
      // 只给「真正本机」的请求带管理令牌:经 nginx / 闸机转发进来的请求必然带
      // X-Real-IP 或 X-Forwarded-For。否则远程设备即使持有有效 bc-gate Cookie,
      // 也能借这个反代拿到管理员特权(生成不限次数的引导链接)。
      const isLocalCall = !req.headers['x-real-ip'] && !req.headers['x-forwarded-for']
      let upstream
      try {
        upstream = await fetch('http://127.0.0.1:3080' + url.pathname + url.search, {
          method: req.method || 'GET',
          headers: {
            'content-type': req.headers['content-type'] || 'application/json',
            cookie: req.headers['cookie'] || '',
            ...(isLocalCall ? adminHeaders() : {}),
          },
          body: body.length ? body : undefined,
          signal: AbortSignal.timeout(10000),
        })
      } catch (e) {
        sendJson(res, 502, { ok: false, error: '闸机不可达(未启动?)' })
        return
      }
      const text = await upstream.text()
      const headers = { 'cache-control': 'no-store' }
      const ct = upstream.headers.get('content-type')
      if (ct) headers['content-type'] = ct
      const setCookies = upstream.headers.getSetCookie ? upstream.headers.getSetCookie() : []
      res.writeHead(upstream.status, headers)
      for (const sc of setCookies) res.setHeader('Set-Cookie', sc)
      res.end(text)
    },
  }), 'dshremote: gate proxy')
  // Windows 推送驻留:插件加载时拉起 win_push.py(长轮询本机闸机 push-poll,
  // 把安全事件/测试推送弹成 Windows 通知中心通知)。闸机没跑时它自己退避轮询,
  // 无需额外管理;随 DSH 进程退出而结束(detached:false,不脱离作业对象)。
  // 单实例由 win_push.py 内部锁文件守卫,重复 spawn 无害。
  if (process.platform === 'win32') {
    ctx.effect(() => {
      const script = path.join(ROOT, 'win_push.py')
      if (!existsSync(script)) return undefined
      try {
        const child = spawn('python', [script], { cwd: ROOT, stdio: 'ignore' })
        child.on('error', () => {}) // python 不存在等,静默(推送驻留属尽力而为)
        return () => { try { child.kill() } catch {} }
      } catch {
        return undefined
      }
    }, 'dshremote: win push')
  }
  ctx.logger.info('dshremote: host half ready (panel %s)', PANEL_URL)
}
