// 演示壳数据层：拦截 fetch，返回与真实闸机/插件一致的响应形状。
// 由 build.mjs 先生成 ./qr-data.js（内含不可扫的演示二维码 SVG，防首屏码被真扫）。
// 2026-11-23 全量对齐面板现接口（上次同步 11-09 后新增的都要补）：
//   设备签名卡（/api/sig、/api/sig-toggle、/browserctl-gate/sig-health、gate-restart、revoke-all）、
//   会话有效期（/api/session-days，值是数字）、系统信息（/api/sysinfo：cpu 百分比 + disks[{drive,size,free}]）、
//   提权（/api/elevate?action=）、官网账号（server/login|me|messages|messages/read，me 必须 loggedIn:true
//   否则配对码页整页退成登录引导——11-17 起官方托管未登录不出码）、新版 update-check 契约
//   （hasUpdate/notes/install，不再是 upToDate 字段）、推送条目带 kind 分组、gate 黑名单删除路由。
// 演示壳里所有链接都指向官网首页：复制链接 / 打开面板都真的能打开官网
import pkg from '../package.json'
import qrData from './qr-data.js'

const PANEL_BASE = 'https://remote.ymzcc.com/'
const VER = (pkg && pkg.version) || '1.0.32'
const NOW = () => Math.floor(Date.now() / 1000)
const NOWMS = () => Date.now()

const sessions = [
  { dev: 'dmo-mac', name: 'MacBook Pro 14', kind: 'app', online: true, ts: NOW() - 45, ip: '203.0.113.7', ua: 'DshRemote/1.0.82 (Android 14)', loc: '广东 · 深圳' },
  { dev: 'dmo-iphone', name: 'iPhone 15', kind: 'app', online: true, ts: NOW() - 90, ip: '103.236.91.8', ua: 'DshRemote/1.0.82 (iOS 17)', loc: '广东 · 深圳' },
  { dev: 'dmo-browser', name: 'Chrome 130 · Windows', kind: 'web', online: false, ts: NOW() - 7200, ip: '61.144.9.5', ua: 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0', loc: '广东 · 广州' },
]

const sigDevices = [
  { dev: 'dmo-mac', name: 'MacBook Pro 14', kind: 'app', ip: '203.0.113.7', online: true, last_seen: NOW() - 45, has_pubkey: true, has_key: true },
  { dev: 'dmo-iphone', name: 'iPhone 15', kind: 'app', ip: '103.236.91.8', online: true, last_seen: NOW() - 90, has_pubkey: true, has_key: true },
  { dev: 'dmo-browser', name: 'Chrome 130 · Windows', kind: 'web', ip: '61.144.9.5', online: false, last_seen: NOW() - 7200, has_pubkey: true, has_key: false },
]

const events = [
  { t: NOW() - 60, kind: 'pair', title: '设备已配对', detail: 'iPhone 15 扫码配对成功' },
  { t: NOW() - 300, kind: 'verify', title: '验证通过', detail: '来自 103.236.91.7 的访问验证成功' },
  { t: NOW() - 1800, kind: 'totp', title: '2FA 状态', detail: '已开启双因素验证' },
  { t: NOW() - 7200, kind: 'kick', title: '设备已下线', detail: 'Chrome 130 · Windows 被移出' },
]

const acct = { ok: true, loggedIn: true, email: 'demo@example.com', remotePort: 18000, status: 'active' }

const serverMessages = [
  { id: 'm3', kind: 'personal', read: false, title: '「发给我」演示消息', body: '电脑端定向发给你的消息在这一栏，与官方公告分开计数。', createdAt: NOWMS() - 7200e3 },
  { id: 'm2', kind: 'official', read: false, title: '面板更新：通知中心三分段', body: '本次更新：通知中心官方公告/发给我/电脑推送三 tab、公告样式徽标与多链接按钮组、设备签名卡、推送深链直达会话。', link: 'https://github.com/Memorial-coder/dsh-remote-plugin/releases/latest', createdAt: NOWMS() - 3600e3 },
  { id: 'm1', kind: 'official', read: true, title: '欢迎使用 DSH 远程助手', body: '扫码或粘贴链接即可远程访问本机面板；对话在本机处理，中转不存储内容。', createdAt: NOWMS() - 2 * 86400e3 },
]

const pushItems = [
  { id: 'n1', t: NOW() - 300, kind: 'official', read: false, title: '任务完成：整理下载文件夹', body: '已把 23 个文件按类型归档。' },
  { id: 'n2', t: NOW() - 1800, kind: 'security', read: true, title: '新设备验证', body: 'iPhone 15 通过两步验证并加入设备信任。' },
]

function res(obj, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => obj,
    text: async () => (typeof obj === 'string' ? obj : JSON.stringify(obj)),
  }
}

function makeGrant() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return 'DMO-' + s
}

let pairCount = 0

export function installMockFetch() {
  const urlOf = (input) => String(input).split('?')[0]
  globalThis.fetch = async (input, init = {}) => {
    const raw = String(input)
    let url = urlOf(raw)
    // 面板可能按「测试副本」身份构建（/browserctl-test/*、/browserctl-test-gate/*），而 mock 路由
    // 一律按官方前缀书写：先把测试前缀归一回官方前缀再匹配。无论用哪个身份的插件产物重建
    // 演示壳，mock 都能命中（2026-11-08 手机端回归发现；该修正必须留在源码里，重建才不回归）。
    if (url.includes('/browserctl-test/')) url = url.replace(/\/browserctl-test\//g, '/browserctl/')
    if (url.includes('/browserctl-test-gate/')) url = url.replace(/\/browserctl-test-gate\//g, '/browserctl-gate/')
    // ---- /browserctl/api/* ----
    if (url.endsWith('/browserctl/api/pair') || url.includes('/browserctl/api/pair?')) {
      pairCount++
      return res({
        grant: makeGrant(), url: PANEL_BASE,
        uses: 1, remaining: 1, ttl: 60, svg: qrData, panel: PANEL_BASE,
      })
    }
    if (url.endsWith('/browserctl/api/pair-long')) {
      return res({ grant: 'L-' + makeGrant().slice(4), url: PANEL_BASE, ttl: 604800, uses: 99, remaining: 99, svg: qrData, panel: PANEL_BASE })
    }
    if (url.includes('/browserctl/api/pair-status')) return res({ ok: true, exists: true, remaining: 1, uses: 1 })
    if (url.endsWith('/browserctl/api/status') || url.includes('/browserctl/api/status?')) {
      return res({ forwarder: true, ok: true, tunnel: { ok: true, port: 18000 } })
    }
    if (url.endsWith('/browserctl/api/ensure')) return res({ forwarder: true, ok: true })
    if (url.endsWith('/browserctl/api/stop')) return res({ ok: true })
    // urlOf 已剥掉 query，一律用 endsWith 判路由
    if (url.endsWith('/browserctl/api/link')) return res({ url: PANEL_BASE, ttl: 3600, uses: 1, remaining: 1 })
    if (url.endsWith('/browserctl/api/qr')) return res({ grant: makeGrant(), url: PANEL_BASE, ttl: 60, svg: qrData })
    if (url.includes('/browserctl/api/totp-kick')) return res({ ok: true })
    if (url.includes('/browserctl/api/totp-toggle')) return res({ ok: true, enabled: true })
    if (url.endsWith('/browserctl/api/totp')) return res({ enabled: true, secret: 'JBSWY3DPEHPK3PXP', sessions, devices: sessions.filter((s) => s.kind === 'app') })
    if (url.includes('/browserctl/api/blacklist-add') || url.includes('/browserctl/api/blacklist-remove')) return res({ ok: true })
    if (url.includes('/browserctl/api/config')) return res({ ok: true, enabled: true, system: true })
    if (url.endsWith('/browserctl/api/update-check')) {
      return res({ ok: true, current: VER, latest: VER, hasUpdate: false, notes: [], install: { kind: 'github', cmd: 'dsh plugin add github:Memorial-coder/dsh-remote-plugin' } })
    }
    if (url.endsWith('/browserctl/api/server/me')) return res(acct)
    if (url.endsWith('/browserctl/api/server/login')) return res(acct)
    if (url.endsWith('/browserctl/api/server/logout')) return res({ ok: true })
    if (url.endsWith('/browserctl/api/server/messages/read')) return res({ ok: true })
    if (url.endsWith('/browserctl/api/server/messages')) return res({ ok: true, loggedIn: true, messages: serverMessages })
    if (url.includes('/browserctl/api/server/oauth/begin')) return res({ ok: true, deviceCode: 'demo', userCode: 'DEMO-CODE', verificationUri: PANEL_BASE, interval: 3 })
    if (url.includes('/browserctl/api/server/oauth/open')) return res({ ok: true })
    if (url.includes('/browserctl/api/server/oauth/poll')) return res({ ok: true, email: 'demo@example.com', remotePort: 18000 })
    // 会话有效期：session_days 是数字（当前生效天数），POST ?days= 换挡
    if (url.endsWith('/browserctl/api/session-days')) {
      const m = /days=(\d{1,3})/.exec(raw)
      return res({ ok: true, session_days: m ? Math.min(365, parseInt(m[1], 10)) : 30 })
    }
    // 系统信息：cpu 是百分比数字；disks 元素 = {drive,size,free}（GB）
    if (url.endsWith('/browserctl/api/sysinfo')) {
      return res({ sysinfo: { ok: true, cpu: 12, memTotal: 32768, memFree: 18432, disks: [ { drive: 'C:', size: 953.9, free: 412.2 }, { drive: 'D:', size: 1863.0, free: 921.4 } ] } })
    }
    // 设备签名卡（App 配对页）：enforce 开关 + 设备密钥档案
    if (url.endsWith('/browserctl/api/sig-toggle')) {
      const m = /enforce=([01])/.exec(raw)
      return res({ ok: true, enforce: m ? m[1] === '1' : true })
    }
    if (url.endsWith('/browserctl/api/sig')) {
      return res({ ok: true, enforce: true, devices: sigDevices.length, devices_with_key: 2, devices_with_pubkey: 3, device_list: sigDevices })
    }
    if (url.includes('/browserctl/api/elevate')) return res({ ok: true })
    // 工单反馈:「导出诊断日志」(演示态返回假成功 + 假路径 + 假全文,「复制日志内容」用 content)
    if (url.endsWith('/browserctl/api/ticket/export-diag')) {
      return res({
        ok: true,
        name: 'DSH诊断日志-demo.txt',
        path: 'C:\\Users\\<你>\\Desktop\\DSH诊断日志-demo.txt',
        bytes: 20480,
        content: 'DSH 远程助手 · 诊断日志导出\n（演示数据：真实导出为已脱敏的闸机/隧道/运行日志全文）',
      })
    }
    if (url.endsWith('/browserctl/api/ticket/reveal')) return res({ ok: true })
    // ---- /browserctl-gate/* ----
    if (url.includes('/browserctl-gate/blacklist/remove')) return res({ ok: true })
    if (url.endsWith('/browserctl-gate/blacklist')) return res({ blacklist: [] })
    if (url.endsWith('/browserctl-gate/events')) return res({ events })
    if (url.endsWith('/browserctl-gate/heartbeat')) return res({ ok: true })
    if (url.includes('/browserctl-gate/kick')) return res({ ok: true, purged: true })
    if (url.includes('/browserctl-gate/notify')) return res({ ok: true, pushed: true })
    if (url.includes('/browserctl-gate/push-config')) return res({ ok: true, enabled: true, system: true })
    if (url.includes('/browserctl-gate/push-poll')) return res({ ok: true, enabled: true, since: 0, items: pushItems })
    // 设备签名状态灯 + 重启闸机 + 清除所有授权（App 配对页操作）
    if (url.endsWith('/browserctl-gate/sig-health')) return res({ ok: true, enforce: true, devices_with_pubkey: 3, sessions: 2 })
    if (url.endsWith('/browserctl-gate/gate-restart')) return res({ ok: true })
    if (url.endsWith('/browserctl-gate/revoke-all')) return res({ ok: true })
    return res({ ok: false, error: 'mock: unknown ' + url }, 404)
  }
}
