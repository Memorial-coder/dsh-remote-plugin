/**
 * dsh-plugin-browserctl — host half.
 * 提供 /browserctl/api/* 本机路由:
 *   /api/ensure   拉起穿透隧道(browserctl.py start)
 *   /api/status   转发器状态 + 面板/扫码链接
 *   /api/qr       扫码链接 + QR SVG
 *   /api/stop     停止隧道
 * 仅监听 127.0.0.1;链接密钥来自 browserctl_state.json。
 */
import { spawn, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import net from 'node:net'
import { existsSync, readdirSync, readFileSync, writeFileSync, renameSync, rmSync, openSync, closeSync, readSync, truncateSync, statSync, chmodSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

export const name = 'browserctl'
export const inject = ['webServer']

// ---- 核心目录解析(发布包自包含 / 源码克隆两种布局都能跑) -------------------
// ESM 下没有 __dirname:bundle 是单文件 lib/index.js,import.meta.url 即它自身位置。
// 两种布局的核心区别是 browserctl.py 在哪:
//   A 发布包(pkg/)  : <pkg>/lib/index.js + <pkg>/browserctl.py + <pkg>/package.json
//                      → 解压即用,核心文件与 package.json 同级,不需要 node_modules
//   B 源码克隆(repo): <repo>/dsh-plugin-browserctl/lib/index.js + <repo>/browserctl.py
//                      → 开发布局,核心文件在上两级的仓库根
// 判据统一是「该目录下存在 browserctl.py」,不再写死往上两级。
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = path.resolve(__dirname, '..')        // 发布包根 = package.json 所在目录
const DEV_ROOT = path.resolve(__dirname, '..', '..')  // 源码克隆:插件目录的上一级(仓库根)

/** 按优先级列出候选核心目录:① BROWSERCTL_HOME ② 发布包根 ③ 仓库根。 */
function _coreCandidates() {
  const list = []
  const envHome = String(process.env.BROWSERCTL_HOME || '').trim()
  if (envHome) list.push(path.resolve(envHome))
  for (const dir of [PKG_ROOT, DEV_ROOT]) {
    if (!list.includes(dir)) list.push(dir)
  }
  return list
}

/** 解析核心目录(存放 browserctl.py/state/secrets 的目录);找不到返回 null。导出供测试。 */
export function resolveCoreRoot() {
  for (const dir of _coreCandidates()) {
    try {
      if (existsSync(path.join(dir, 'browserctl.py'))) return dir
    } catch { /* 目录不可访问:继续探测下一个 */ }
  }
  return null
}

/** 核心目录缺失时的明确中文错误(带已探测的绝对路径与两种布局的处置办法)。 */
export function coreNotFoundError() {
  const lines = ['找不到浏览器控制核心文件 browserctl.py。已探测的目录:']
  const envHome = String(process.env.BROWSERCTL_HOME || '').trim()
  if (envHome) lines.push('  - ' + path.resolve(envHome) + '  (环境变量 BROWSERCTL_HOME)')
  lines.push('  - ' + PKG_ROOT + '  (发布包布局:browserctl.py 应与 package.json 同级)')
  lines.push('  - ' + DEV_ROOT + '  (源码克隆布局:仓库根)')
  lines.push('发布包应包含 browserctl.py(与 package.json 同级);源码克隆请从仓库根运行,或在插件目录 npm install/link。')
  return lines.join('\n')
}

const ROOT = resolveCoreRoot()
// ROOT 为 null 时仍要保证模块能加载(否则 path.join(null, ...) 在 import 阶段就抛异常),
// 这里退到 DEV_ROOT 只为拼出可读的绝对路径(文件必然不存在);真正缺什么由 coreNotFoundError() 说明。
const CORE_DIR = ROOT || DEV_ROOT
const STATE_PATH = path.join(CORE_DIR, 'browserctl_state.json')
const BLACKLIST_PATH = path.join(CORE_DIR, 'browserctl_blacklist.json')
const SESSIONS_PATH = path.join(CORE_DIR, 'browserctl_sessions.json')
const EVENTS_PATH = path.join(CORE_DIR, 'browserctl_events.json')
const DEVICES_PATH = path.join(CORE_DIR, 'browserctl_devices.json')
const SCRIPT_PATH = path.join(CORE_DIR, 'browserctl.py')
const SECRETS_PATH = path.join(CORE_DIR, 'browserctl_secrets.json')
// frpc 日志:隧道就绪的**唯一权威依据**是日志里出现 `start proxy success`(端口注册成功)。
// tunnelReady() 用它自愈 state 里滞后的 tunnel_ok(详见下面的自愈注释)。
const FRPC_LOG = path.join(CORE_DIR, 'browserctl_frpc.log')
// 工单「导出诊断日志」还要读闸机日志(fwd/主进程/watch)与 frpc 日志(常量见上)。
const FWD_LOG = path.join(CORE_DIR, 'browserctl_fwd.log')
const WATCH_LOG = path.join(CORE_DIR, 'browserctl_watch.log')
// 本地管理令牌:闸机把特权端点(生成链接/配对码/改推送开关)从「loopback 即管理员」
// 改成「loopback + 持有令牌」。每次调用都重新读,这样闸机重启后新建的令牌能立刻生效。
const ADMIN_TOKEN_PATH = path.join(CORE_DIR, 'browserctl_admin_token')

function adminHeaders() {
  try {
    const tok = readFileSync(ADMIN_TOKEN_PATH, 'utf8').trim()
    if (tok) return { 'x-bc-admin': tok }
  } catch {}
  return {}
}

// 插件/面板版本号(「关于」面板、/api/config、检查更新共用)。
// 单一来源 = package.json 的 version:build.mjs 构建时注入 __DSHREMOTE_VERSION__,
// 源码直接跑(没有构建)时退回 'dev',绝不在这里写死版本号(历史上三处版本号互相打架)。
const VERSION = typeof __DSHREMOTE_VERSION__ === 'string' ? __DSHREMOTE_VERSION__ : 'dev'

// 本 DSH 会话是否已建过隧道。首次 ensure(DSH 刚启动)必须重建:claim 全新随机端口,
// 并清掉上次会话残留的分离 frpc/fwd(崩溃退出时 dispose 钩子不会跑)。会话内再次
// ensure 只要隧道在跑就幂等返回 —— 开关插件面板绝不拆正在运行的隧道。
let sessionTunnel = false
// ensure 并发互斥:快速连点「开始控制」时只让一个真正执行,其余返回 pending
let ensureRunning = null
// 上一次 ensure 的失败原因。ensure 是后台跑的(前端拿到的是 pending),
// 前端随后轮询 /browserctl/api/status;失败时若不在 status 里透出来,
// 面板就会永远停在"隧道正在建立",用户完全看不到原因(同学实测反馈)。
let lastEnsureError = ''

// 语义化版本比较:相等 0、a>b 正、a<b 负(容忍 'v' 前缀,按数字段逐段比)
function cmpVersion(a, b) {
  const pa = String(a || '').replace(/^v/i, '').split('.').map(x => Number(x) || 0)
  const pb = String(b || '').replace(/^v/i, '').split('.').map(x => Number(x) || 0)
  const n = Math.max(pa.length, pb.length)
  for (let i = 0; i < n; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d !== 0) return d
  }
  return 0
}

// 官方多用户服务(注册/登录/端口分配):登录后 secrets 记 server_uid/server_token/
// server_link_secret/frp_remote_port,闸机 state.link_secret 换成服务器签发的 per-user 密钥。
const OFFICIAL_API_BASE = 'https://remote.ymzcc.com/dsh-remote'

// 设备授权流(RFC 8628)客户端标识:插件「官方账号」登录/注册不再内嵌账号密码表单,
// 改由浏览器打开官网授权页,用户在网页登录/注册并确认后,插件轮询换 token(见 /server/oauth/*)。
const OAUTH_CLIENT_ID = 'dsh-plugin-desktop'

// 面板链接不再设默认地址:自建模式自适应为 https://<host>/p/<remotePort>/,
// 官方模式为 /dsh-remote/p/<uid>/;两者都不可用时返回 null,绝不回退写死端口。
// 历史:17901 是作者开发机的 frp 端口,硬编码曾导致未登录用户拿到别人的面板链接(502)。

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
  // 写后 ACL 收紧（kb/24 P1-3）：rename 出来的新文件继承父目录 ACL，与闸机
  // harden_file_perms 同语义（Windows: icacls 断继承+仅当前用户；POSIX: 0600）。
  // atomicWrite 只用于 state/secrets/blacklist 三个凭据/运行态文件，在这里收一次全覆盖。
  hardenFileAcl(file)
}

// ACL 收紧：异步 fire-and-forget（不阻塞写路径）；失败每文件只告警一次，绝不静默成永无记录。
const _aclWarned = new Set()
function hardenFileAcl(file) {
  try {
    if (process.platform === 'win32') {
      const user = process.env.USERNAME || ''
      if (!user) return
      const child = spawn('icacls', [file, '/inheritance:r', '/grant:r', user + ':F'],
        { stdio: 'ignore', windowsHide: true })
      child.on('error', () => {
        if (!_aclWarned.has(file)) {
          _aclWarned.add(file)
          console.warn('[browserctl] [安全告警] 无法收紧 ' + file + ' 的 ACL（权限不足时跳过，其余写入方会再收紧）')
        }
      })
    } else {
      try { chmodSync(file, 0o600) } catch (e) {
        if (!_aclWarned.has(file)) {
          _aclWarned.add(file)
          console.warn('[browserctl] [安全告警] 无法收紧 ' + file + ' 的权限: ' + (e && e.message))
        }
      }
    }
  } catch {}
}

function readState() {
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8'))
  } catch {
    return {}
  }
}

// ---- 隧道就绪门禁 ----------------------------------------------------------
// 二维码只有在内网转发 + frp 隧道真正连通后才有意义:否则用户扫到的链接打开就是 502
// (公网入口在,但背后 frpc 没连上)。闸机(新版 browserctl.py)在 state 里落
// tunnel_ok / tunnel_error / tunnel_ts / frpc_pid,这里据此在**生成二维码之前**拦截。
// tunnel_ok 的判定依据是 frpc 日志出现 `start proxy success`(远端端口已注册到 frps),
// 不是「进程活着」—— 所以有 tunnel_ok 时以它为准,frpc_pid 只做辅助展示。
// 兼容旧闸机(state 无 tunnel_ok):按 remote_port > 0 && frpc_pid 存活判定;
// 两个字段都没有 → 允许(保持旧行为,绝不因为升级插件把老环境一刀切拒掉)。
function pidAlive(pid) {
  const n = Number(pid) || 0
  if (n <= 0) return false
  try {
    // signal 0 = 只探测存在性,不发信号。Windows 上同样可用。
    process.kill(n, 0)
    return true
  } catch (e) {
    // EPERM = 进程存在但当前进程无权探测(Windows 上可能遇到),同样视为存活
    return !!e && e.code === 'EPERM'
  }
}

// 日志文件编码自愈(2026-11-09 用户实测导出仍有方块):
// 中文 Windows 上 Python 子进程默认按 ANSI/GBK 写日志(browserctl_fwd/start/watch.log 实测全是 GBK),
// 而 frpc.exe(Go)写 UTF-8 —— 同一份诊断导出里两种编码混着。Buffer.toString('utf8') 遇 GBK 字节
// 会把失效序列替换成 U+FFFD,任何查看器都渲染成 □(记事本也救不了)。对策:按行解码,先 utf8 严格
// (fatal),失败退 GBK,再失败才让 utf8 宽松兜底出 U+FFFD。GBK 多字节对的尾字节 ≥0x40,不可能是
// \n(0x0A),所以按 \n 切行不会劈开一个 GBK/UTF-8 编码单元。TextDecoder('gbk') 依赖 ICU,
// Node/Electron 默认全量 ICU;个别精简构建拿不到时跳过 GBK 档(退回旧行为)。
const DIAG_UTF8_STRICT = new TextDecoder('utf-8', { fatal: true })
let DIAG_GBK_DECODER = null
try { DIAG_GBK_DECODER = new TextDecoder('gbk') } catch { DIAG_GBK_DECODER = null }

/** 单行字节 → 文本:utf8 严格 → GBK → utf8 宽松(兜底 U+FFFD)。 */
export function decodeLogLine(lineBuf) {
  try { return DIAG_UTF8_STRICT.decode(lineBuf) } catch { /* 试下一档 */ }
  if (DIAG_GBK_DECODER) {
    try { return DIAG_GBK_DECODER.decode(lineBuf) } catch { /* 试兜底档 */ }
  }
  return lineBuf.toString('utf8')
}

/** 日志字节流按 \n 切行逐行转码(换行原样保留)。 */
export function decodeLogBuffer(buf) {
  let out = ''
  let i = 0
  const n = buf.length
  while (i < n) {
    let j = buf.indexOf(0x0a, i)
    if (j < 0) j = n
    out += decodeLogLine(buf.subarray(i, j < n ? j + 1 : n))
    i = j < n ? j + 1 : n
  }
  return out
}

/** 读文本文件尾部(最多 maxBytes)。读不到返回 ''。 */
function readTextTail(file, maxBytes = 65536) {
  try {
    const info = statSync(file)
    if (!info.isFile() || info.size <= 0) return ''
    const start = Math.max(0, info.size - maxBytes)
    const len = info.size - start
    const fd = openSync(file, 'r')
    try {
      const buf = Buffer.alloc(len)
      readSync(fd, buf, 0, len, start)
      return decodeLogBuffer(buf)
    } finally {
      closeSync(fd)
    }
  } catch {
    return ''
  }
}

/** 日志里最后一条 `start proxy success` 对应的远端端口;取不到返回 0。 */
function lastSuccessPort(text) {
  let port = 0
  for (const line of String(text || '').split('\n')) {
    if (!line.includes('start proxy success')) continue
    const m = line.match(/dsh_web_(\d+)/)
    if (m) port = parseInt(m[1], 10) || 0
  }
  return port
}

/** 这些措辞都是「闸机正在自愈」的瞬时态:面板应当自动重试,而不是直接报错让人再点一次。 */
const TRANSIENT_TUNNEL_RE = /正在启动|正在重拉|等待端口注册|正在按新端口重启|正在重建/

/** 隧道是否就绪。返回 {ok:true,tunnel:{...}} 或 {ok:false, error:'可读原因', tunnel:{pending}}。导出供测试。 */
export function tunnelReady() {
  const st = readState()
  const pid = Number(st.frpc_pid) || 0
  const want = Number(st.remote_port) || 0
  const tunnel = {
    ok: false,
    error: '',
    port: want,
    pid,
    ts: Number(st.tunnel_ts) || 0,
    pending: false,
  }
  const hasFlag = Object.prototype.hasOwnProperty.call(st, 'tunnel_ok')
  // 自愈:state 说隧道没就绪,但 frpc 进程活着、且日志里最后一条 start proxy success
  // 正是当前端口 → 隧道其实在服务。典型来源:claim 换端口后的竞态、看门狗刚重拉完、
  // 上次判定被重复 frpc 的 "already exists" 带偏(state 指向失败的那份进程)。
  // 闸机看门狗要 5 秒一拍才会纠正,这 5 秒里面板已经白屏报错、用户只能"再点一次";
  // 所以插件这边先按日志自查一次,顺手把 state 修正回来。
  if ((!hasFlag || st.tunnel_ok !== true) && pid > 0 && pidAlive(pid)) {
    if (want > 0 && lastSuccessPort(readTextTail(FRPC_LOG)) === want) {
      try {
        writeState({ ...st, tunnel_ok: true, tunnel_error: '', tunnel_ts: Date.now() / 1000 })
      } catch {}
      return { ok: true, tunnel: { ...tunnel, ok: true } }
    }
  }
  if (hasFlag) {
    if (st.tunnel_ok === true) return { ok: true, tunnel: { ...tunnel, ok: true } }
    const reason = String(st.tunnel_error || '').trim()
    const error = reason || '隧道尚未建立(frpc 未连接),请稍候或重新点「开始控制」'
    // pending = 闸机正在自愈(启动中/重拉中/端口切换中),前端据此自动重试而不是让人再点
    const pending = (pid > 0 && pidAlive(pid)) || TRANSIENT_TUNNEL_RE.test(error)
    return { ok: false, error, tunnel: { ...tunnel, error, pending } }
  }
  // 旧闸机兼容分支:没有 tunnel_ok 字段
  if (want > 0 || pid > 0) {
    if (want > 0 && pidAlive(pid)) return { ok: true, tunnel: { ...tunnel, ok: true } }
    const error = '隧道尚未建立(frpc 进程未运行),请先点「开始控制」'
    return { ok: false, error, tunnel: { ...tunnel, error } }
  }
  return { ok: true, tunnel: { ...tunnel, ok: true } }
}

/** 二维码类路由的统一门禁:未就绪直接 503 + 可读原因,绝不把扫了会 502 的码发出去。 */
function tunnelGuard(res) {
  const ready = tunnelReady()
  if (ready.ok) return true
  sendJson(res, 503, { ok: false, error: '隧道未建立：' + (ready.error || '请先点「开始控制」'),
                       tunnel: ready.tunnel })
  return false
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

// 官方登录/设备授权成功 → 落 per-user 密钥与分配端口(secrets/state)。
// 闸机每次请求都现读 state,热切换立即生效;frp_remote_port 由 client 触发
// stop+start 重建隧道后生效。绝不把 token 明文返回给前端。
function applyOfficialSession(j) {
  const sec = readSecrets()
  sec.server_mode = 'official'
  sec.server_uid = j.uid
  sec.server_email = j.email || ''
  sec.server_token = j.access_token || j.token
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
    // state 写失败(ACL/占用)不算失败,下次重启闸机后 secrets 仍会生效
  }
}

// 面板链接自适应:自建模式 = https://<host>/p/<remotePort>/;
// 官方多用户(已登录)= uid 稳定链接 /dsh-remote/p/<uid>/(端口变化也不失效,
// 服务端按 uid 解析当前端口;App 长期配对存这个,重启换端口后仍能连回自己机器);
// 都没有 = null(绝不回退写死端口,防止未登录用户指向别人的机器)。
function uidPanelBase() {
  try {
    const sec = readSecrets()
    if (sec && sec.server_mode === 'official' && sec.server_uid) {
      return 'https://remote.ymzcc.com/dsh-remote/p/' + sec.server_uid + '/'
    }
  } catch {}
  return null
}

function effectivePanelUrl() {
  try {
    const sec = readSecrets()
    if (sec && sec.server_mode === 'selfhost' && sec.ssh_host) {
      const host = String(sec.ssh_host).replace(/^https?:\/\//, '').replace(/\/+$/, '')
      const rp = Number(sec.frp_remote_port)
      if (host && rp > 0) return 'https://' + host + '/p/' + rp + '/'
    }
    if (sec && sec.server_mode === 'official' && sec.server_uid) {
      const uidBase = uidPanelBase()
      if (uidBase) return uidBase
      if (sec.server_panel_url) return String(sec.server_panel_url)
      const rp = Number(sec.frp_remote_port)
      if (rp > 0) return 'https://remote.ymzcc.com/p/' + rp + '/'
    }
  } catch {}
  return null
}

// 把闸机生成的端口形态链接重写成 uid 稳定形态。App 扫码/配对拿到的一律是
// uid 链接 —— 端口每次重启都变,uid 永不变。
function toUidUrl(url) {
  const base = uidPanelBase()
  if (!base || !url) return url
  const s = String(url)
  // 形态一:配对 claim / 面板链接 https://host/p/<port>/<rest> → /dsh-remote/p/<uid>/<rest>
  if (/^https:\/\/remote\.ymzcc\.com\/p\/\d{4,5}\//.test(s)) {
    return s.replace(/^https:\/\/remote\.ymzcc\.com\/p\/\d{4,5}\//, base)
  }
  // 形态二:引导链接 https://host/dsh-auth.html?p=<port>&k=<token>
  // p= 只给边缘 nginx Lua 路由用;uid 代理取代它 → 直连闸机 bootstrap,只要 k=
  try {
    const u = new URL(s)
    if (u.hostname === 'remote.ymzcc.com' && u.pathname === '/dsh-auth.html') {
      const k = u.searchParams.get('k')
      if (k) return base + 'browserctl-gate/bootstrap?k=' + encodeURIComponent(k)
    }
  } catch {}
  return s
}

function secretLink() {
  // 安全:不再把永久 link_secret 下发给前端。引导链接统一走闸机 /browserctl-gate/link
  // (HMAC + 24h 过期),一次性配对走 /browserctl-gate/pair。
  return null
}

// ---- Python 解释器定位 ------------------------------------------------------
// 很多用户机器上**没有装 Python**。但 DSH 自己就带了一个运行时:
//   ~/.dsh/dsh-runtimes/<runtime>/dependencies/python/python.exe
// 而 browserctl.py 只依赖标准库(无第三方包),所以直接复用 DSH 自带解释器即可,
// 用户不需要额外安装任何东西。找不到时才回退到 PATH,并给出可操作的提示。
// 结果缓存:只探测一次,避免每次 start/stop 都去试错(探测要起进程,有开销)。
let _pyResolved = null

function _pythonCandidates() {
  const exe = process.platform === 'win32' ? 'python.exe' : 'python3'
  const list = []
  // 1) 显式覆盖:排障时让用户/我们指定
  const envPy = process.env.BROWSERCTL_PYTHON || process.env.DSHREMOTE_PYTHON
  if (envPy) list.push({ cmd: envPy, pre: [] })
  // 2) 随包内嵌(发行版若带了便携 Python)
  const root = path.dirname(SCRIPT_PATH)
  list.push({ cmd: path.join(root, 'python', exe), pre: [] })
  list.push({ cmd: path.join(root, 'python', 'bin', 'python3'), pre: [] })
  // 3) DSH 自带运行时 —— 没装 Python 的机器主要靠这条
  const home = process.env.USERPROFILE || process.env.HOME || ''
  if (home) {
    const rtDir = path.join(home, '.dsh', 'dsh-runtimes')
    try {
      for (const d of readdirSync(rtDir)) {
        const base = path.join(rtDir, d, 'dependencies', 'python')
        list.push({ cmd: path.join(base, 'python.exe'), pre: [] })
        list.push({ cmd: path.join(base, exe), pre: [] })
        list.push({ cmd: path.join(base, 'bin', 'python3'), pre: [] })
      }
    } catch { /* 目录不存在:忽略 */ }
  }
  // 4) PATH 上的解释器(用户自己装过 Python 的机器)
  list.push({ cmd: 'python', pre: [] })
  list.push({ cmd: 'python3', pre: [] })
  if (process.platform === 'win32') list.push({ cmd: 'py', pre: ['-3'] }) // py 启动器要带 -3
  return list
}

function _pythonUsable(cand) {
  try {
    // 顺便验版本:Windows 商店的 python.exe 占位程序会「成功」启动却打开商店,
    // 因此必须真的跑一段代码确认它能解释 Python。
    const r = spawnSync(cand.cmd, [...cand.pre, '-c',
      'import sys; raise SystemExit(0 if sys.version_info >= (3, 8) else 1)'], {
      stdio: 'ignore', timeout: 8000, windowsHide: true,
    })
    return r && r.status === 0
  } catch { return false }
}

export const PY_NOT_FOUND =
  '找不到可用的 Python 解释器。本插件需要 Python 3.8+,但通常**无需手动安装**——DSH 自带运行时。\n' +
  '已尝试:环境变量 BROWSERCTL_PYTHON、包内 python/、DSH 运行时 ' +
  '(~/.dsh/dsh-runtimes/*/dependencies/python)、PATH 上的 python/python3/py。\n' +
  '解决办法(任选其一):\n' +
  '  1. 安装 Python 3.10+ 并勾选 "Add python.exe to PATH"(https://www.python.org/downloads/);\n' +
  '  2. 设置环境变量 BROWSERCTL_PYTHON 指向 python.exe 的完整路径;\n' +
  '  3. 确认 DSH 安装完整(自带运行时目录未被清理),然后重启 DSH。'

export function resolvePython() {
  if (_pyResolved) return _pyResolved
  for (const c of _pythonCandidates()) {
    // 绝对路径候选先看文件在不在,省一次进程启动
    if (path.isAbsolute(c.cmd) && !existsSync(c.cmd)) continue
    if (_pythonUsable(c)) { _pyResolved = c; return c }
  }
  _pyResolved = { cmd: 'python', pre: [], missing: true }
  return _pyResolved
}

// browserctl.py CLI 的 stdout/stderr 落盘文件。以前 `stdio: 'ignore'` 把
// browserctl 里精心写的 _spawn_error_help()(WinError 5 / 未找到 frpc.exe /
// 端口被占用 等中文指引)全部丢掉了,面板点「开启」失败时用户什么都看不到。
// 现在写到 kit 目录下的 browserctl_start.log,失败时把尾部摘要透给面板。
const START_LOG = path.join(path.dirname(SCRIPT_PATH), 'browserctl_start.log')
const START_LOG_MAX = 256 * 1024

function startLogFd() {
  try {
    // 超过上限先清空,别让日志无限涨
    if (existsSync(START_LOG) && statSync(START_LOG).size > START_LOG_MAX) {
      truncateSync(START_LOG, 0)
    }
    return openSync(START_LOG, 'a')
  } catch { return null }
}

/** 读启动日志尾部,给面板显示失败原因用。最多取最后 n 行。 */
function startLogTail(n = 25) {
  try {
    const txt = decodeLogBuffer(readFileSync(START_LOG))
    const lines = txt.split(/\r?\n/).filter(l => l.trim())
    return lines.slice(-n).join('\n')
  } catch { return '' }
}

// ---- 工单诊断日志:本机日志尾部 + 脱敏 -------------------------------------
// 与服务端 src/ticketdiag.js 同一套思路(顺序很重要:JWT/Bearer 必须在通用 KV 规则之前,
// 否则 Authorization 整行会被吞掉)。这里的结果会原样展示给用户预览,再随工单上传。
const TICKET_DIAG_LOG_SPECS = [
  { name: 'browserctl_fwd.log', file: FWD_LOG, max: 64 * 1024 },
  { name: 'browserctl_frpc.log', file: FRPC_LOG, max: 48 * 1024 },
  { name: 'browserctl_start.log', file: START_LOG, max: 48 * 1024 },
  { name: 'browserctl_watch.log', file: WATCH_LOG, max: 48 * 1024 },
]

/** 读文件尾部 maxBytes 字节(从行首切,避免半行);返回 {text, truncated}。 */
export function tailLogText(file, maxBytes) {
  try {
    const st = statSync(file)
    if (!Number(st.size)) return { text: '', truncated: false }
    const start = Math.max(0, Number(st.size) - maxBytes)
    const fd = openSync(file, 'r')
    try {
      const buf = Buffer.alloc(Number(st.size) - start)
      readSync(fd, buf, 0, buf.length, start)
      let text = decodeLogBuffer(buf)
      if (start > 0) {
        const nl = text.indexOf('\n')
        if (nl >= 0 && nl < text.length - 1) text = text.slice(nl + 1)
        return { text: '…（日志过长，仅保留最后 ' + Math.round(maxBytes / 1024) + ' KB）\n' + text, truncated: true }
      }
      return { text, truncated: false }
    } finally { closeSync(fd) }
  } catch { return { text: '', truncated: false } }
}

/** 日志脱敏:令牌/凭据/签名/IP 末两段/账号目录/他人邮箱。 */
export function diagRedact(input) {
  let s = String(input == null ? '' : input)
  // ANSI 颜色控制符
  s = s.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
  // JWT
  s = s.replace(/\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/g, '***')
  // Bearer xxx(必须早于通用 KV,否则会把整行吞掉)
  s = s.replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi, '$1***')
  // 敏感键值:token=xxx / password: xxx / sig=xxx ...
  s = s.replace(/\b(token|secret|password|passwd|pwd|sig|signature|apikey|api_key|access_key|auth_key|privkey)\s*([=:])\s*("[^"]*"|'[^']*'|[^\s,;&"'}]+)/gi, '$1$2***')
  // Cookie / Authorization 头(日志行常带时间戳/模块前缀,所以不能按行首锚定)
  s = s.replace(/(^|[\s\[])(cookie|set-cookie|authorization)[ \t]*:[ \t]*[^\r\n]+/gim, '$1$2: ***')
  // 长十六进制串 / 长 base64url 串(会话令牌、签名片段)
  s = s.replace(/\b[0-9a-f]{32,}\b/gi, '***')
  s = s.replace(/\b[A-Za-z0-9_-]{40,}\b/g, '***')
  // 账号目录
  s = s.replace(/[A-Z]:\\Users\\[^\\\s"']+/gi, m => m.split('\\').slice(0, 2).join('\\') + '\\***')
  s = s.replace(/\/home\/[^/\s"']+/g, '/home/***')
  // 邮箱:保留域名,本地部分打码
  s = s.replace(/\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g, '***@$1')
  // IPv4:保留前两段(回环/未指定不做处理);前后向断言避免把版本号当 IP
  s = s.replace(/(?<![\w./-])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?![\w.])/g, (m, a, b, c, d) => {
    const n = [a, b, c, d].map(Number)
    if (n.some(x => x > 255)) return m
    if (m === '127.0.0.1' || m === '0.0.0.0' || m === '255.255.255.255') return m
    return a + '.' + b + '.x.x'
  })
  return s
}

// 诊断日志导出的落盘目录:优先桌面(用户最容易找到),其次下载,再退用户主目录。
function exportDir() {
  let base = String(process.env.USERPROFILE || process.env.HOME || '.')
  try { base = os.homedir() } catch { /* 用环境变量兜底 */ }
  const candidates = [
    path.join(base, 'Desktop'),
    path.join(base, 'Downloads'),
    base,
  ]
  for (const dir of candidates) {
    try { if (existsSync(dir) && statSync(dir).isDirectory()) return dir } catch { /* 忽略 */ }
  }
  return base
}

function runBrowserctl(args) {
  const script = SCRIPT_PATH
  if (!existsSync(script)) {
    return { started: false, error: ROOT ? ('browserctl.py 不存在: ' + script) : coreNotFoundError() }
  }
  const py = resolvePython()
  if (py.missing) return { started: false, error: PY_NOT_FOUND }
  const creationflags = process.platform === 'win32'
    ? (0x00000008 | 0x00000200 | 0x01000000 | 0x08000000) // DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_BREAKAWAY_FROM_JOB | CREATE_NO_WINDOW
    : 0
  const fd = startLogFd()
  const child = spawn(py.cmd, [...py.pre, script, ...args], {
    cwd: path.dirname(script),
    // PYTHONUTF8:强制 Python 子进程按 UTF-8 写 stdout/stderr 与默认 open() —— 否则中文 Windows
    // 上日志按 GBK 落盘,导出/面板里中文变 □(2026-11-09 实测根因;闸机/看门狗子进程会继承)。
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
    // 有 fd 就把子进程输出落盘(失败原因可回读);拿不到 fd 才退回忽略
    stdio: fd === null ? 'ignore' : ['ignore', fd, fd],
    detached: true,
    creationflags,
  })
  if (fd !== null) { try { closeSync(fd) } catch {} }
  // 必须有 error 监听:ChildProcess 的 'error' 事件无人监听会抛成未捕获异常,
  // 可能连带把 DSH 主进程搞崩(旧代码在这里是裸 spawn)。
  child.on('error', () => {})
  child.unref()
  return { started: true }
}

// 异步版 runBrowserctl:等待子进程退出(或超时),不阻塞事件循环。
// 用于 ensure 里需要「等 stop 真正结束」的步骤——这样 stop 期间事件循环还能
// 继续发 claim-port / release-port 的网络请求,三段并行压成一段,启动更快。
function runBrowserctlAsync(args, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const script = SCRIPT_PATH
    if (!existsSync(script)) {
      resolve({ started: false, error: ROOT ? ('browserctl.py 不存在: ' + script) : coreNotFoundError() })
      return
    }
    const py = resolvePython()
    if (py.missing) { resolve({ started: false, error: PY_NOT_FOUND }); return }
    const creationflags = process.platform === 'win32'
      ? (0x00000008 | 0x00000200 | 0x01000000 | 0x08000000)
      : 0
    let done = false
    const child = spawn(py.cmd, [...py.pre, script, ...args], {
      cwd: path.dirname(script),
      // 与 runBrowserctl 同理:统一让 Python 子进程按 UTF-8 输出(见 runBrowserctl 注释)
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
      stdio: 'ignore',
      detached: true,
      creationflags,
    })
    const timer = setTimeout(() => {
      if (done) return
      done = true
      try { child.kill() } catch {}
      resolve({ started: false, timedOut: true })
    }, timeoutMs)
    child.on('exit', () => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve({ started: true })
    })
    child.on('error', (e) => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve({ started: false, error: String((e && e.message) || e) })
    })
  })
}

// ---- 提权启动/停止(Windows UAC) -------------------------------------------
// 什么时候真的需要提权(其它情况别用,提权解决不了目录混用/端口不一致):
//   1) Defender / 安全软件把 frpc.exe 按 PUA 拦掉 → WinError 5「拒绝访问」;
//   2) 残留的 fwd/frpc/watch 是上一次以管理员身份起来的,普通权限杀不掉 → 一直重复;
//   3) 核心目录在需要管理员写权限的路径下(状态文件 replace 失败 WinError 5)。
// 做法:让 Windows 自己弹 UAC,用户点「是」后以管理员身份跑 `browserctl.py <action>`。
// 用户点「否」/ 没弹出来时按取消返回,绝不静默当成成功。
const PS_EXE = 'powershell.exe'

function _psQuote(s) {
  return "'" + String(s).replace(/'/g, "''") + "'"
}

/** 以管理员身份运行 browserctl.py <action>;返回 {ok,pid} / {ok:false,error} / {ok:true,pending}。 */
function runElevated(action = 'start') {
  if (process.platform !== 'win32') {
    return Promise.resolve({ ok: false, error: '提权启动只支持 Windows(当前平台 ' + process.platform + ')' })
  }
  if (!ROOT) return Promise.resolve({ ok: false, error: coreNotFoundError() })
  if (!existsSync(SCRIPT_PATH)) {
    return Promise.resolve({ ok: false, error: 'browserctl.py 不存在: ' + SCRIPT_PATH })
  }
  const py = resolvePython()
  if (py.missing) return Promise.resolve({ ok: false, error: PY_NOT_FOUND })
  // 用 Start-Process -Verb RunAs 走 Windows 自己的 UAC 流程;参数逐个单引号引用,
  // 路径里有空格/中文都不会被拆。(这里不能用 spawn 的 shell:false 直接提权,
  // CreateProcess 没有「顺便帮我弹 UAC」的开关。)
  const argList = [...py.pre, SCRIPT_PATH, action].map(_psQuote).join(',')
  const cmd = "$ErrorActionPreference='Stop'; try { "
    + '$p = Start-Process -FilePath ' + _psQuote(py.cmd)
    + ' -ArgumentList @(' + argList + ')'
    + ' -WorkingDirectory ' + _psQuote(path.dirname(SCRIPT_PATH))
    + ' -Verb RunAs -WindowStyle Hidden -PassThru; '
    + "Write-Output ('ELEVATED_PID=' + $p.Id) } "
    + "catch { Write-Output ('ELEVATE_ERROR=' + $_.Exception.Message); exit 3 }"
  return new Promise((resolve) => {
    let out = ''
    let err = ''
    let done = false
    let timer = null
    const finish = (v) => {
      if (done) return
      done = true
      if (timer) clearTimeout(timer)
      resolve(v)
    }
    let child = null
    try {
      child = spawn(PS_EXE, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', cmd], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (e) {
      finish({ ok: false, error: '无法调用 PowerShell: ' + String((e && e.message) || e) })
      return
    }
    child.stdout.on('data', (d) => { out += String(d) })
    child.stderr.on('data', (d) => { err += String(d) })
    child.on('error', (e) => finish({ ok: false, error: '无法调用 PowerShell: ' + String((e && e.message) || e) }))
    // UAC 对话框没人点的时候不能把面板永远卡在 loading:90s 后按「未确认」返回。
    timer = setTimeout(() => {
      try { child.kill() } catch {}
      finish({ ok: true, pending: true })
    }, 90000)
    child.on('exit', (code) => {
      const m = /ELEVATED_PID=(\d+)/.exec(out)
      if (code === 0 && m) {
        finish({ ok: true, elevated: true, pid: Number(m[1]) })
        return
      }
      const reason = (/ELEVATE_ERROR=(.+)/.exec(out) || [])[1] || err.trim() || out.trim()
      finish({
        ok: false,
        canceled: code === 3,
        error: reason
          ? ('提权被拒绝或执行失败:' + reason)
          : '提权被取消(UAC 对话框没有确认)。',
      })
    })
  })
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
    '&issuer=DshRemote&algorithm=SHA1&digits=6&period=30'}

function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: '127.0.0.1', timeout: 1500 })
    s.on('connect', () => { s.destroy(); resolve(true) })
    s.on('error', () => resolve(false))
    s.on('timeout', () => { s.destroy(); resolve(false) })
  })
}

// 等隧道就绪:轮询 state 直到 tunnel_ok === true,或到 deadline。
// 兼容旧闸机(state 没有 tunnel_ok 字段)时给 4s 宽限(让新闸机把字段落盘,避免
// 在 start 还没写 state 的窗口里误判成旧闸机),之后按旧行为放行,绝不拦死老用户。
function waitTunnelReady(deadline) {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const tick = () => {
      const st = readState()
      const hasFlag = Object.prototype.hasOwnProperty.call(st, 'tunnel_ok')
      if (hasFlag) {
        if (st.tunnel_ok === true) { resolve(tunnelReady()); return }
      } else if (Date.now() - startedAt >= 4000) {
        // 旧闸机(升级前写入的 state):按旧行为判定
        resolve(tunnelReady())
        return
      }
      if (Date.now() >= deadline) { resolve(tunnelReady()); return }
      setTimeout(tick, 400)
    }
    tick()
  })
}

// 幂等建隧道(/browserctl/api/ensure 路由与「DSH 启动自动建隧道」共用)。
// 本会话已建过隧道且闸机在跑(3080 通)→ 直接返回,绝不拆正在运行的隧道、绝不换端口。
// 否则重建:官方模式先停旧 → 释放旧端口 → claim 全新随机端口 → 持久化 → 启动。
// claim 失败会 throw,由调用方(路由发 503 / 自动建隧道打日志)处理。
async function buildTunnel() {
  // 核心目录没找到时立刻给明确原因(发布包漏带 browserctl.py / 从仓库根之外启动),
  // 不要走到后面 spawn 才失败。
  if (!ROOT) return { ok: false, started: false, forwarder: false, error: coreNotFoundError() }
  const startedAt = Date.now()
  if (sessionTunnel) {
    const fwd = await portOpen(3080)
    if (fwd) {
      const ready = tunnelReady()
      // 闸机在跑但隧道掉了(例如 frpc 被安全软件杀掉):不在这里回 ok,继续走重建流程自愈
      if (ready.ok) return { ok: true, alreadyRunning: true, forwarder: true, tunnel: ready.tunnel }
    }
  }
  const sec = readSecrets()
  if (sec.server_mode === 'official' && sec.server_token) {
    // 官方模式:停旧隧道 + 申请新端口 并行执行,总耗时 ≈ 最长一段(通常是 claim 的公网往返)。
    // 注意:绝不能在这里再并发发一个 /api/release-port —— claim-port 服务端内部已先释放
    // 旧端口再分配全新端口(原子完成,见 dsh-remote-server/src/app.js)。若 release 请求晚于
    // claim 到达服务端,会把刚 claim 到的新端口又从用户记录里删掉 → registry.json 缺该端口
    // → nginx 边缘验签失败,公网打不开;且该端口被放回端口池可能被他人占走。
    // 这正是 73e53d4 并行化后「有时能启动、有时开启隧道不成功、要重启 DSH 才好」的根因。
    const claimTask = fetch(OFFICIAL_API_BASE + '/api/claim-port', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + sec.server_token },
      signal: AbortSignal.timeout(8000),
    }).then(async r => ({ ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) }))
      .catch(e => ({ ok: false, status: 0, j: { error: String((e && e.message) || e) } }))
    const [stopRes, claimRes] = await Promise.all([
      runBrowserctlAsync(['stop'], 8000),
      claimTask,
    ])
    if (stopRes.error) console.error('[browserctl] stop 失败:', stopRes.error)
    const j = claimRes.j || {}
    if (!claimRes.ok || !j.ok || !(Number(j.remotePort) > 0)) {
      throw new Error('无法获取端口:' + (j.error || ('HTTP ' + claimRes.status)))
    }
    // 持久化新端口与 linkSecret(此时 stop 已结束,旧 frpc 死透,新隧道才能绑新端口)
    const sec2 = readSecrets()
    sec2.frp_remote_port = Number(j.remotePort)
    if (j.linkSecret) sec2.server_link_secret = j.linkSecret
    writeSecrets(sec2)
    try {
      const st = readState()
      st.remote_port = Number(j.remotePort)
      if (j.linkSecret) st.link_secret = j.linkSecret
      writeState(st)
    } catch (e) { /* state 写失败不影响启动 */ }
  }
  const result = runBrowserctl(['start'])
  // 解释器/脚本压根没起来(如找不到 Python)时立刻返回,不空等 15s;
  // 并且把 ok 置 false,让前端能弹出具体原因,而不是"点了没反应"。
  if (result.started === false) {
    return { ok: false, ...result, forwarder: false }
  }
  // 轮询等待闸机 3080 就绪(最多 ~15s),避免固定等待在冷启动/端口释放/锁等待时误报失败
  let fwd = false
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    fwd = await portOpen(3080)
    if (fwd) break
    await new Promise(r => setTimeout(r, 400))
  }
  if (!fwd) {
    // 15 秒还没起来 = 真的失败了(最常见:Defender 拦 frpc.exe → WinError 5),
    // 以前这里照样回 ok:true,面板就永远停在"隧道正在建立",用户完全无从排查。
    const tail = startLogTail(25)
    return {
      ok: false,
      started: true,
      forwarder: false,
      error: '本机闸机(127.0.0.1:3080)启动失败。\n'
        + '最常见原因:Windows Defender / 安全软件把 frpc.exe 判为 PUA 拒绝执行(WinError 5 拒绝访问)。\n'
        + '处理:在 kit 目录双击 fix-antivirus.bat(推荐;或右键 fix-antivirus.ps1 →「使用 PowerShell 运行」),详见 INSTALL.md「常见问题」第 1 条。\n'
        + '详见 browserctl_start.log 与 browserctl_fwd.log。'
        + (tail ? '\n\n— 启动日志尾部 —\n' + tail : ''),
      logTail: tail,
    }
  }
  // 3080 通了只说明闸机(fwd)在跑,不代表 frp 隧道已连通:
  // browserctl.py start 现在会自己等最多 15s 到 frpc 日志出现 `start proxy success`,
  // 但插件是 detached 启动拿不到 stdout,所以必须回读 state 再判一次 tunnel_ok。
  // 冷启动时 start 内部可能已消耗 ~15s,这里给到总共约 26s(15s fwd + 余量)。
  const tunnel = await waitTunnelReady(startedAt + 26000)
  if (!tunnel.ok) {
    const tail = startLogTail(20)
    return {
      ok: false,
      started: true,
      forwarder: true,
      tunnel: tunnel.tunnel,
      error: 'frp 隧道未连通(公网入口暂时打不开,二维码已隐藏)。\n'
        + (tunnel.error || '隧道尚未建立(frpc 未连接)') + '\n'
        + '处理:确认本机能访问 frps(端口/UDP 未被安全软件拦截),然后重新点「开始控制」;'
        + '仍失败请查看 kit 目录下 browserctl_frpc.log 与 browserctl_start.log。'
        + (tail ? '\n\n— 启动日志尾部 —\n' + tail : ''),
      logTail: tail,
    }
  }
  sessionTunnel = true
  return { ok: true, ...result, forwarder: true, tunnel: tunnel.tunnel }
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

// ---- CSRF 防御(状态变更路由) -----------------------------------------------
// 背景:apiAuthorized 的「本机直连」通道对「对端 loopback 且无转发头」的请求放行,
// 公网页面向 http://127.0.0.1:<DSH端口>/browserctl/api/* 发的跨站请求同样满足它。
// 状态变更路由必须再加一道跨站识别。信号与取舍:
//   ① Sec-Fetch-Site: cross-site —— 现代浏览器对导航/fetch 一律携带(curl/PowerShell 不带);
//   ② Origin 头存在但与请求 Host 不同源 —— 跨站 fetch/表单必带 Origin,无法伪造;
//   ③ 经 nginx/闸机转发的请求(X-Real-IP/X-Forwarded-For)已过边缘门禁+Cookie 鉴权,不在此列;
//   ④ 无任何信号的本机工具/老内核 → 放行(兼容,防误伤);
//   ⑤ host 自己的反代 upstream fetch 不带 Origin/Sec-Fetch,天然放行,不会被误伤。
// 残余面:既不带 Origin 也不带 Sec-Fetch 的极老浏览器导航型 GET 不在此防御内(可接受)。
const CSRF_LOOPBACK_HOST = /^(?:127\.0\.0\.1|localhost|\[::1\]|::1)(?::\d+)?$/i

function csrfBlocked(req) {
  if (req.headers['x-real-ip'] || req.headers['x-forwarded-for']) return false
  const site = String(req.headers['sec-fetch-site'] || '').trim().toLowerCase()
  if (site === 'cross-site') return true
  const origin = String(req.headers.origin || '').trim()
  if (!origin) return false
  let oh = null
  try { oh = new URL(origin) } catch { return true } // Origin 解析不了 = 伪造,拒
  if (oh.host === String(req.headers.host || '')) return false // 同源(含端口)
  // 本机双通道:Origin 与 Host 都是回环(端口可不同)→ 同一台机器,放行
  if (CSRF_LOOPBACK_HOST.test(oh.host) && CSRF_LOOPBACK_HOST.test(String(req.headers.host || ''))) return false
  return true
}

// 状态变更路由清单(POST/DELETE + GET 型写操作)。只读路由(status/qr/totp/pair-status/
// server/me/update-check)不在列:误伤面板刷新代价更大。
const CSRF_PROTECTED = new Set([
  '/browserctl/api/ensure',
  '/browserctl/api/stop',
  '/browserctl/api/elevate',
  '/browserctl/api/link',
  '/browserctl/api/pair',
  '/browserctl/api/pair-long',
  '/browserctl/api/totp-toggle',
  '/browserctl/api/totp-kick',
  '/browserctl/api/blacklist-add',
  '/browserctl/api/blacklist-remove',
  '/browserctl/api/server/logout',
  '/browserctl/api/server/oauth/begin',
  '/browserctl/api/server/oauth/open',
  '/browserctl/api/server/oauth/poll',
  '/browserctl/api/config',
])

// 闸机反代里的「写端点」后缀(POST/DELETE 全拦 + GET 型写操作;events/push-poll/
// heartbeat/totp 等读端点放行)。前缀按 GATE_PFX 截掉后再匹配。
const GATE_PFX = '/browserctl-gate'
const GATE_WRITE_PATHS = ['/kick', '/kick-all', '/blacklist', '/blacklist/remove', '/push-config',
  '/notify', '/pair', '/link', '/verify', '/totp-toggle', '/totp-reset', '/bootstrap']

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
        // CSRF:状态变更路由拒绝跨站来源(无 Origin/Sec-Fetch 的本机工具/老内核放行)
        if (CSRF_PROTECTED.has(route) && csrfBlocked(req)) {
          sendJson(res, 403, { ok: false, error: '跨站请求被拒绝:状态变更仅接受同源调用' })
          return
        }
        if (route === '/browserctl/api/ensure') {
          // 幂等启动(逻辑见 buildTunnel):本会话隧道在跑 → 直接返回,不拆隧道不换端口;
          // 只有隧道没在跑 / DSH 刚启动首次 ensure 才重建。关插件面板绝不会重启隧道。
          if (ensureRunning) {
            sendJson(res, 200, { ok: true, pending: true, forwarder: await portOpen(3080),
                                 link: secretLink(), tunnel: tunnelReady().tunnel })
            return
          }
          const inFlight = (async () => {
            try {
              const r = await buildTunnel()
              // 起不来(找不到 Python / 脚本缺失 / 闸机 15s 没就绪 / frp 隧道未连通)时用 503,
              // 前端才会走错误分支把原因显示出来。tunnel 一并回给前端(未就绪时含 tunnel_error 原文)。
              const code = r && r.ok === false ? 503 : 200
              lastEnsureError = r && r.ok === false ? String(r.error || '') : ''
              sendJson(res, code, { ...r, link: secretLink(), tunnel: (r && r.tunnel) || tunnelReady().tunnel })
            } catch (e) {
              console.error('[browserctl] ensure 异常:', e)
              lastEnsureError = '启动失败:' + String((e && e.message) || e)
              sendJson(res, 503, { ok: false, error: lastEnsureError, tunnel: tunnelReady().tunnel })
            } finally {
              ensureRunning = null
            }
          })()
          ensureRunning = inFlight
          return
        }
        if (route === '/browserctl/api/status') {
          const fwd = await portOpen(3080)
          // 闸机没起来时把上次 ensure 的失败原因一并给出,前端才能显示真正的原因
          // tunnel:二维码可用性(frpc 是否连通),前端据此决定是否显示"隧道未建立"而不是空二维码
          const ready = tunnelReady()
          sendJson(res, 200, { forwarder: fwd, link: secretLink(),
                               startError: fwd ? '' : lastEnsureError,
                               tunnel: {
                                 ok: ready.ok,
                                 error: ready.ok ? '' : String(ready.error || ''),
                                 port: Number(readState().remote_port) || 0,
                                 // pending = 闸机正在自愈(启动中/重拉中):前端据此自动重试
                                 // 二维码,用户不必再点一次「开始控制」(2026-11-07 用户反馈)
                                 pending: !ready.ok && !!ready.tunnel.pending,
                               } })
          return
        }
        if (route === '/browserctl/api/stop') {
          // 官方多用户:停止前先向服务端释放端口(lease),best-effort 不影响本地停止。
          try {
            const sec = readSecrets()
            if (sec.server_mode === 'official' && sec.server_token) {
              await fetch(OFFICIAL_API_BASE + '/api/release-port', {
                method: 'POST',
                headers: { authorization: 'Bearer ' + sec.server_token },
                signal: AbortSignal.timeout(5000),
              })
            }
          } catch (e) {
            console.error('[browserctl] release-port 异常:', e)
          }
          sendJson(res, 200, runBrowserctl(['stop']))
          return
        }
        if (route === '/browserctl/api/elevate') {
          // 提权启动/停止:只有「点按钮」才会走到这里(前端在启动失败后给出按钮),
          // 不会自动弹 UAC。start 时按普通启动同一套门禁(官方模式要先登录),
          // 否则用户绕过登录直接提权起隧道,公网入口拿不到端口。
          const action = (url.searchParams.get('action') || 'start').toLowerCase()
          if (action !== 'start' && action !== 'stop') {
            sendJson(res, 400, { ok: false, error: 'action 只能是 start 或 stop' })
            return
          }
          const r = await runElevated(action)
          // 提权进程是分离的:这里只回「UAC 结果」,是否真的起来由前端轮询 /status 判断。
          sendJson(res, r.ok ? 200 : (r.canceled ? 409 : 500), {
            ...r,
            action,
            forwarder: await portOpen(3080),
            tunnel: tunnelReady().tunnel,
          })
          return
        }
        if (route === '/browserctl/api/qr') {
          // 引导链接(默认 24h 过期,gate 侧 HMAC 校验);不再下发永久静态密钥。
          // 门禁:frp 隧道未连通时直接 503,绝不把扫了会 502 的二维码发给用户。
          if (!tunnelGuard(res)) return
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
            const uidUrl = toUidUrl(j.url)
            const svg = await qrSvg(uidUrl)
            sendJson(res, 200, { url: uidUrl, svg, ttl: j.ttl, exp: j.exp, panel: effectivePanelUrl() })
          } catch (e) {
            sendJson(res, 503, { error: '闸机未运行:先点"开始控制"启动隧道(或运行 browserctl.py start)' })
          }
          return
        }
        if (route === '/browserctl/api/link') {
          // iOS / 无 App 设备引导链接:按需 ttl(闸机侧 clamp 到 [60s, 7d])。
          // 同一闸机端点,额外附带二维码 SVG,让手机相机直接扫(比复制链接方便)。
          if (!tunnelGuard(res)) return
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
            const uidUrl = toUidUrl(j.url)
            try { svg = await qrSvg(uidUrl) } catch (e) { svg = '' }
            sendJson(res, 200, { url: uidUrl, svg, ttl: j.ttl, exp: j.exp, uses: j.uses, panel: effectivePanelUrl() })
          } catch (e) {
            sendJson(res, 503, { error: '闸机未运行:先点"开始控制"启动隧道(或运行 browserctl.py start)' })
          }
          return
        }
        if (route === '/browserctl/api/pair') {
          // 配对码(默认 60s 一次性;?uses=N 可设该码可被扫码次数)。
          // 向闸机 loopback 端点申请 grant;闸机不可用或为老版本时返回明确错误,
          // client 半自动回退到长期链接密钥(/api/qr)。
          // 门禁:隧道未连通时不发配对码(闸机自身也会 503,这里先拦一层给出统一文案)。
          if (!tunnelGuard(res)) return
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
            const uidUrl = toUidUrl(j.url)
            const svg = await qrSvg(uidUrl)
            sendJson(res, 200, {
              url: uidUrl, svg, ttl: j.ttl || 60, panel: effectivePanelUrl(), once: true,
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
          if (!tunnelGuard(res)) return
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
            // 与 /api/pair、/api/qr、/api/link 一致:转成 uid 稳定形态(/dsh-remote/p/<uid>/...)。
            // official 模式下端口每次重启都变,App 长期配对必须存 uid 形态才能换端口后仍连回。
            const uidUrl = toUidUrl(j.url)
            let svg = ''
            try { svg = await qrSvg(uidUrl) } catch (e) { svg = '' }
            sendJson(res, 200, { ok: true, url: uidUrl, svg, long: true, ttl: j.ttl || 0, panel: effectivePanelUrl(), kind: j.kind || 'long_pair', grant: j.grant || '', uses: j.uses || 1, remaining: j.remaining || 1 })
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
          // 优先同步直调本机闸机:kick 端点会立即弹会话 + 写 sessions.json +
          // 记已踢名单,响应返回时文件已更新,面板刷新就不会看到"踢完又跳回来"。
          // (旧路径只写 state 队列,要等闸机 ≤2s 巡检消费,1.2s 后的列表刷新
          // 会读到旧文件 → 设备"跳回来"。只给真正本机的请求带管理令牌,
          // 判据与 /browserctl-gate 反代一致。)
          const isLocalCall = !req.headers['x-real-ip'] && !req.headers['x-forwarded-for']
          if (isLocalCall) {
            try {
              const target = dev
                ? 'http://127.0.0.1:3080/browserctl-gate/kick?dev=' + encodeURIComponent(dev)
                : 'http://127.0.0.1:3080/browserctl-gate/kick-all'
              const r = await fetch(target, {
                method: 'POST',
                headers: adminHeaders(),
                signal: AbortSignal.timeout(6000),
              })
              const j = await r.json().catch(() => ({}))
              if (r.ok && j && j.ok) {
                sendJson(res, 200, { ok: true })
                return
              }
              // 闸机明确拒绝(401/400 等)时不要落回队列重试,直接透传
              if (r.status === 400 || r.status === 401 || r.status === 403) {
                sendJson(res, r.status, { ok: false, error: (j && j.error) || ('闸机拒绝 ' + r.status) })
                return
              }
            } catch {}
          }
          // 闸机未运行/不可达(非本机调用):退回老路径——写进 state 由闸机巡检消费
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
        // ---- 官方多用户账号(设备授权流:登录/注册走浏览器官网授权页,轮询换 token)----
        // 流程:client → /server/oauth/begin 拿 device_code → /server/oauth/open 打开
        // 浏览器授权页 → 用户在网页登录/注册并确认 → client 轮询 /server/oauth/poll
        // 拿 access token → applyOfficialSession 落 per-user 密钥与分配端口。
        if (route === '/browserctl/api/server/oauth/begin') {
          if (req.method !== 'POST') { sendJson(res, 405, { ok: false, error: 'POST only' }); return }
          try {
            const r = await fetch(OFFICIAL_API_BASE + '/api/oauth/device', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ client_id: OAUTH_CLIENT_ID }),
              signal: AbortSignal.timeout(10000),
            })
            const j = await r.json().catch(() => ({}))
            if (!r.ok || !j.ok) {
              sendJson(res, r.ok ? 400 : r.status, { ok: false, error: j.error || ('官方服务器 HTTP ' + r.status) })
              return
            }
            sendJson(res, 200, {
              ok: true,
              deviceCode: j.device_code,
              userCode: j.user_code,
              verificationUri: j.verification_uri_complete || j.verification_uri,
              expiresIn: Number(j.expires_in) || 900,
              interval: Math.max(3, Number(j.interval) || 5),
            })
          } catch (e) {
            sendJson(res, 502, { ok: false, error: '无法连接官方服务器:' + String((e && e.message) || e) })
          }
          return
        }
        if (route === '/browserctl/api/server/oauth/open') {
          // 打开用户默认浏览器到官网授权页。只放行官方域名,防止被当任意 URL 打开器。
          if (req.method !== 'POST') { sendJson(res, 405, { ok: false, error: 'POST only' }); return }
          const raw = (url.searchParams.get('url') || '').trim()
          let target
          try { target = new URL(raw) } catch { sendJson(res, 400, { ok: false, error: 'url 参数无效' }); return }
          const host = target.hostname.toLowerCase()
          if (!(host === 'remote.ymzcc.com' || host.endsWith('.ymzcc.com'))) {
            sendJson(res, 400, { ok: false, error: '不允许打开该地址' }); return
          }
          const href = target.toString()
          // 多方法打开默认浏览器:rundll32 → explorer,任一 spawn 成功即可。
          // 即便全部失败,client 的授权页链接也能让用户手动打开,这里只上报。
          // （cmd start 候选已移除——解析面更大,rundll32/explorer 已覆盖所有场景,kb/24 P3）
          const candidates = [
            ['rundll32', ['url.dll,FileProtocolHandler', href]],
            ['explorer', [href]],
          ]
          let launched = false
          for (const [bin, args] of candidates) {
            try {
              const child = spawn(bin, args, {
                cwd: path.dirname(SCRIPT_PATH),
                stdio: 'ignore',
                detached: true,
                windowsHide: true,
              })
              child.on('error', () => {}) // 失败静默,由 client 链接兜底
              child.unref()
              launched = true
            } catch { /* 尝试下一个方法 */ }
          }
          if (!launched) { sendJson(res, 500, { ok: false, error: '无法打开浏览器,请用下方链接手动打开' }); return }
          sendJson(res, 200, { ok: true })
          return
        }
        if (route === '/browserctl/api/server/oauth/poll') {
          if (req.method !== 'POST') { sendJson(res, 405, { ok: false, error: 'POST only' }); return }
          const deviceCode = (url.searchParams.get('device_code') || '').trim()
          if (!deviceCode) { sendJson(res, 400, { ok: false, error: '缺少 device_code 参数' }); return }
          try {
            const r = await fetch(OFFICIAL_API_BASE + '/api/oauth/token', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                device_code: deviceCode,
                client_id: OAUTH_CLIENT_ID,
              }),
              signal: AbortSignal.timeout(10000),
            })
            const j = await r.json().catch(() => ({}))
            if (!r.ok || !j.ok) {
              const code = j.code || ''
              if (code === 'authorization_pending' || code === 'slow_down') {
                sendJson(res, 200, { ok: false, pending: true, interval: Math.max(3, Number(j.interval) || 5), error: j.error || '等待授权' })
                return
              }
              sendJson(res, 200, { ok: false, pending: false, error: j.error || ('官方服务器 HTTP ' + r.status), code })
              return
            }
            // 成功:落身份与端口(与旧 /server/login 相同),由 client 触发 stop+start 重建隧道
            applyOfficialSession(j)
            sendJson(res, 200, {
              ok: true,
              email: j.email || '',
              uid: j.uid,
              remotePort: Number(j.remotePort) || null,
              panelUrl: j.panelUrl || null,
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
          // 派生凭据一并清（kb/24 P3）：官方下发的 frp token 与模式切换备份,
          // 重新登录会拿到新 token;不清会让 /config 的 hasToken 误报「已配置」。
          delete sec.frp_token
          delete sec.frp_token_official
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
            // 写入连接配置。mode/host/port/remotePort 走 query；frp_token 走 POST body
            // （kb/23 宿主契约：当前 DSH 把原始 req 交 handler、body 未排空可读；kb/05 旧注释已过时）。
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
                // frp token 优先从 POST body 读(字段 frp_token;client 已不再把 token 放 URL ——
                // URL 会进闸机 reqlog 并被自动上报官方);兼容旧版 client 仍从 query 读。
                let tokenBody = {}
                try { tokenBody = JSON.parse((await readRawBody(req)).toString('utf-8') || '{}') } catch { tokenBody = {} }
                const token = String(tokenBody.frp_token || url.searchParams.get('token') || '').trim()
                if (!host) { sendJson(res, 400, { ok: false, error: '缺少 host 参数' }); return }
                // token 留空本意=保持现有 token;但若现有的其实是官方下发的 frp token
                // (frp_token_official 备份还在且两者相等),留空会把官方 token 误用到
                // 自建 frps → 必然认证失败,这里直接拒绝并说明,不再静默写错值
                if (!token && sec.frp_token_official && sec.frp_token === sec.frp_token_official) {
                  sendJson(res, 400, { ok: false, error: '请填写自建 frps token:当前保存的是官方服务器分配的 token,留空会导致自建隧道认证失败' })
                  return
                }
                sec.server_mode = 'selfhost'
                sec.ssh_host = host
                sec.frp_server_port = Number.isFinite(port) && port > 0 ? port : 17000
                sec.frp_remote_port = Number.isFinite(remotePort) && remotePort > 0 ? remotePort : undefined
                if (!sec.frp_remote_port) delete sec.frp_remote_port
                // token 留空 = 保持现有 token(不清空);填了才覆盖
                if (token) sec.frp_token = token
              } else {
                // 官方模式:清掉自建覆盖。注意:不清 server_* 账号与分配端口——
                // 「切到官方模式」≠「退出账号」,账号走 /server/logout。
                sec.server_mode = 'official'
                // 切回官方:还原官方下发的 frp token(若曾备份),避免自建 token 残留
                // 导致官方 frps 认证失败(备份只在此前的切换时写入)
                if (sec.frp_token_official) sec.frp_token = sec.frp_token_official
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
              remotePort: Number(sec.frp_remote_port) || 0,
              hasToken: !!sec.frp_token,
              version: VERSION,
              // 前端据此决定要不要给「以管理员身份启动」按钮(只有 Windows 才有 UAC)
              canElevate: process.platform === 'win32',
            })
          } else {
            sendJson(res, 200, {
              mode: 'official',
              account: sec.server_uid ? { email: sec.server_email || '', uid: sec.server_uid, remotePort: Number(sec.frp_remote_port) || null } : null,
              version: VERSION,
              canElevate: process.platform === 'win32',
            })
          }
          return
        }
        if (route === '/browserctl/api/update-check') {
          // 「检查更新」:拉官网部署的插件版本清单 version.json(UPDATE_MANIFEST_URL)。
          // (2026-11-04 修复)此前误接 App 发布接口 /api/app/version,App 未配置发布时
          // latest 为空串,面板会渲染出「最新版本 v」;现在改回插件自己的清单,
          // 缺 version 字段时回退到当前版本,绝不会再显示光秃秃的 "v"。
          let j = null
          try {
            const ctrl = new AbortController()
            const timer = setTimeout(() => ctrl.abort(), 5000)
            let r
            try {
              r = await fetch(UPDATE_MANIFEST_URL, { signal: ctrl.signal, cache: 'no-store' })
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
          const latest = String((j && j.version) || '').trim() || VERSION
          sendJson(res, 200, {
            ok: true,
            current: VERSION,
            latest,
            hasUpdate: cmpVersion(latest, VERSION) > 0,
            downloadUrl: (j && j.downloadUrl) || '',
            notes: Array.isArray(j && j.notes) ? j.notes : [],
          })
          return
        }
        // ---- 工单反馈:提交/附件走网页版,本机只保留「导出诊断日志」----
        if (route === '/browserctl/api/ticket/export-diag') {
          // 「自己导出日志」:把本机诊断日志(已脱敏)拼成一份 txt 写到桌面/下载目录,
          // 前端拿到完整路径后引导用户去网页版工单页上传提交。纯本地操作,不需要官方登录。
          // 2026-11-09:支持 ?dir=<绝对路径>(另存到用户选的文件夹,必须已存在且是目录)
          // 与 ?withText=1(响应里带 content 全文,给「复制日志内容」用,已同样脱敏)。
          if ((req.method || 'GET') !== 'GET') { sendJson(res, 405, { ok: false, error: 'GET only' }); return }
          if (!apiAuthorized(req)) { sendJson(res, 401, { ok: false, error: '未授权:请通过面板访问' }); return }
          const dirParam = String(url.searchParams.get('dir') || '').trim()
          const withText = url.searchParams.get('withText') === '1'
          let targetDir = exportDir()
          if (dirParam) {
            let resolved = ''
            try { resolved = path.resolve(dirParam) } catch (e) { resolved = '' }
            let okDir = false
            try { okDir = !!resolved && existsSync(resolved) && statSync(resolved).isDirectory() } catch { okDir = false }
            if (!okDir) {
              sendJson(res, 400, { ok: false, error: '目录不存在或不是文件夹: ' + (resolved || dirParam) })
              return
            }
            targetDir = resolved
          }
          const st = readState()
          const sec = readSecrets()
          const pad = (n) => String(n).padStart(2, '0')
          const now = new Date()
          const y = now.getFullYear()
          const mo = pad(now.getMonth() + 1)
          const dd = pad(now.getDate())
          const hh = pad(now.getHours())
          const mi = pad(now.getMinutes())
          const ss = pad(now.getSeconds())
          const parts = []
          parts.push('DSH 远程助手 · 诊断日志导出')
          parts.push('导出时间: ' + y + '-' + mo + '-' + dd + ' ' + hh + ':' + mi + ':' + ss)
          parts.push('插件版本: ' + VERSION)
          parts.push('连接模式: ' + String(sec.server_mode || 'unknown'))
          parts.push('闸机: running=' + (!!st.fwd_pid)
            + ' port=' + (Number(st.fwd_port) || 3080)
            + ' remotePort=' + (Number(st.remote_port) || 0)
            + ' tunnelOk=' + (st.tunnel_ok === true)
            + ' dshPort=' + (Number(st.dsh_port) || 0))
          if (st.last_error) parts.push('最近错误: ' + diagRedact(String(st.last_error)))
          parts.push('')
          let logCount = 0
          for (const spec of TICKET_DIAG_LOG_SPECS) {
            const r = tailLogText(spec.file, spec.max)
            if (!r.text || !r.text.trim()) continue
            logCount++
            parts.push('==================== ' + spec.name + (r.truncated ? '（截尾）' : '') + ' ====================')
            parts.push(diagRedact(r.text))
            parts.push('')
          }
          if (!logCount) parts.push('（本机暂无可读取的运行日志:闸机可能还没启动过）')
          const content = parts.join('\n')
          const baseName = 'DSH诊断日志-' + y + mo + dd + '-' + hh + mi + ss + '.txt'
          // 同秒重名兜底:同名存在就顺延 -2..-9,避免把上一次的导出悄悄覆盖掉
          let name = baseName
          for (let i = 2; i <= 9; i++) {
            if (!existsSync(path.join(targetDir, name))) break
            name = baseName.replace(/\.txt$/, '-' + i + '.txt')
          }
          const full = path.join(targetDir, name)
          // Windows 记事本/部分编辑器对「无 BOM 的 UTF-8」按 ANSI(GBK) 猜编码,
          // 中文全部变方块(2026-11-09 用户实测截图)。落盘文件带 UTF-8 BOM,
          // 编辑器就能正确识别;剪贴板/JSON 回传的 content 保持不带 BOM。
          const fileContent = '\ufeff' + content
          try {
            writeFileSync(full, fileContent, 'utf8')
          } catch (e) {
            sendJson(res, 500, { ok: false, error: '写入失败: ' + String((e && e.message) || e) })
            return
          }
          const fileBytes = Buffer.byteLength(fileContent)
          sendJson(res, 200, withText
            ? { ok: true, name, path: full, bytes: fileBytes, content }
            : { ok: true, name, path: full, bytes: fileBytes })
          return
        }
        if (route === '/browserctl/api/ticket/reveal') {
          // 「打开所在文件夹」:在资源管理器里定位刚导出的 txt。GET 带副作用,
          // 所以除 apiAuthorized 外再过一道 csrfBlocked(只接受同源/面板转发调用)。
          if ((req.method || 'GET') !== 'GET') { sendJson(res, 405, { ok: false, error: 'GET only' }); return }
          if (!apiAuthorized(req) || csrfBlocked(req)) {
            sendJson(res, 403, { ok: false, error: '未授权:请通过面板访问' })
            return
          }
          if (process.platform !== 'win32') {
            sendJson(res, 400, { ok: false, error: '仅支持 Windows' })
            return
          }
          const p = String(url.searchParams.get('path') || '').trim()
          let resolved = ''
          try { resolved = p ? path.resolve(p) : '' } catch { resolved = '' }
          if (!resolved || !existsSync(resolved)) {
            sendJson(res, 400, { ok: false, error: '文件不存在: ' + (resolved || p) })
            return
          }
          try {
            const child = spawn('explorer', ['/select,' + resolved], { detached: true, stdio: 'ignore' })
            child.on('error', () => {})
            child.unref()
          } catch (e) {
            sendJson(res, 500, { ok: false, error: '打开失败: ' + String((e && e.message) || e) })
            return
          }
          sendJson(res, 200, { ok: true })
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
      // CSRF:反代里的写端点拒绝跨站来源(POST/DELETE 全拦 + GET 型写操作;读端点放行)。
      // 本机 GUI 同源请求 Origin==Host 放行;远程面板带转发头在 csrfBlocked 里放行;
      // host 内部 upstream fetch 无 Origin/Sec-Fetch,不受影响。
      const gPath = url.pathname.slice(GATE_PFX.length)
      const gMethod = String(req.method || 'GET').toUpperCase()
      const gWrite = (gMethod !== 'GET' && gMethod !== 'HEAD') ||
        GATE_WRITE_PATHS.some(w => gPath === w || gPath.startsWith(w + '/'))
      if (gWrite && csrfBlocked(req)) {
        sendJson(res, 403, { ok: false, error: '跨站请求被拒绝:状态变更仅接受同源调用' })
        return
      }
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
      const script = path.join(CORE_DIR, 'win_push.py')
      if (!existsSync(script)) return undefined
      const py = resolvePython()
      if (py.missing) {
        ctx.logger.warn('dshremote: 未找到 Python,跳过 Windows 推送驻留(隧道功能不受影响)')
        return undefined
      }
      try {
        const child = spawn(py.cmd, [...py.pre, script], {
          cwd: CORE_DIR,
          stdio: 'ignore',
          windowsHide: true, // 防 CMD 窗口弹出(win_push 是控制台程序,不隐藏会闪黑框)
        })
        child.on('error', () => {}) // python 不存在等,静默(推送驻留属尽力而为)
        return () => { try { child.kill() } catch {} }
      } catch {
        return undefined
      }
    }, 'dshremote: win push')
  }
  // DSH 启动自动建隧道:启动 DeepSeek 后约 4s 在后台拉起隧道,不用每次手动点「开始控制」。
  // 触发条件:官方模式已登录,或本机之前有端口历史(自建服务器/曾建过隧道)。
  // 不阻塞 DSH 启动;失败静默(用户仍可手动点「开始控制」重试)。走 buildTunnel 幂等逻辑,
  // 每个 DSH 会话首次建隧道必然 claim 全新随机端口;与「关闭整个 DSH 才释放」闭环。
  // DSH Web 可能还没就绪(detect_port 会 SystemExit)→ 最多重试 10 次、间隔 5s(约 50s),
  // 覆盖 DSH 冷启动窗口;每次失败都打日志,便于排查为什么重启后不自启。
  ctx.effect(() => {
    let timer = null
    try {
      const sec = readSecrets()
      const st = readState()
      const ready = (sec.server_mode === 'official' && sec.server_token) ||
        Number(sec.frp_remote_port) > 0 || Number(st.remote_port) > 0
      if (!ready) return undefined
      timer = setTimeout(() => {
        if (ensureRunning) return
        ensureRunning = (async () => {
          try {
            for (let attempt = 1; attempt <= 10; attempt++) {
              try {
                const r = await buildTunnel()
                if (r && r.forwarder) {
                  ctx.logger.info('dshremote: 自动建隧道成功(第 %d 次尝试,forwarder=%s)', attempt, r.forwarder)
                  return r
                }
                ctx.logger.warn('dshremote: 自动建隧道 forwarder 未就绪(第 %d 次尝试)', attempt)
              } catch (e) {
                ctx.logger.warn('dshremote: 自动建隧道失败(第 %d 次尝试):%s', attempt, String((e && e.message) || e))
              }
              if (attempt < 10) await new Promise(res => setTimeout(res, 5000))
            }
          } catch (e) {
            ctx.logger.error('dshremote: 启动自动建隧道异常:', e)
          } finally {
            ensureRunning = null
          }
        })()
      }, 4000)
    } catch (e) { /* ignore */ }
    return () => { if (timer) clearTimeout(timer) }
  }, 'dshremote: auto-start tunnel on DSH launch')
  // DSH 退出释放钩子:只有「关闭整个 DeepSeek」(优雅退出)才停隧道 + 释放端口。
  // 关闭/重开插件面板不经过这里,不会动隧道。崩溃退出(kill /F、断电)时本钩子不跑,
  // 由服务端空闲回收(端口离线 >3 分钟)兜底释放;下次 DSH 启动的首个 ensure 也会
  // 清掉上次残留的分离进程并 claim 全新端口。release/stop 都是 best-effort,不阻塞退出。
  ctx.effect(() => {
    return () => {
      try {
        const sec = readSecrets()
        if (sec.server_mode === 'official' && sec.server_token) {
          fetch(OFFICIAL_API_BASE + '/api/release-port', {
            method: 'POST',
            headers: { authorization: 'Bearer ' + sec.server_token },
            signal: AbortSignal.timeout(2000),
          }).catch(() => {}) // 退出窗口内发不出去就算了,交给空闲回收
        }
        // 停隧道(fire-and-forget 分离进程,DSH 退出后仍能跑完;frpc 死 → 端口下线)
        try {
          const py = resolvePython()
          if (py.missing) throw new Error('no python')
          const stopper = spawn(py.cmd, [...py.pre, SCRIPT_PATH, 'stop'], {
            cwd: path.dirname(SCRIPT_PATH),
            stdio: 'ignore',
            detached: true,
            windowsHide: true,
            // CREATE_BREAKAWAY_FROM_JOB | CREATE_NO_WINDOW:跳出作业对象不被连坐杀,
            // 且不弹 CMD 窗口
            creationflags: process.platform === 'win32'
              ? (0x01000000 | 0x08000000)
              : 0,
          })
          stopper.on('error', () => {})
          stopper.unref()
        } catch (e) { /* ignore */ }
      } catch (e) { /* ignore */ }
    }
  }, 'dshremote: release tunnel on DSH exit')
  ctx.logger.info('dshremote: host half ready')
}