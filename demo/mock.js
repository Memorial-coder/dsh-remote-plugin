// 演示壳数据层：拦截 fetch，返回与真实闸机/插件一致的响应形状。
// 由 build.mjs 先生成 ./qr-data.js（内含官网真实二维码 SVG）。
import qrData from './qr-data.js'

// 演示壳里所有链接都指向官网首页：复制链接 / 打开面板都真的能打开官网
const PANEL_BASE = 'https://remote.ymzcc.com/'
const NOW = () => Math.floor(Date.now() / 1000)

const sessions = [
  { dev: 'dmo-mac', name: 'MacBook Pro 14', kind: 'app', online: true, ts: NOW() - 45, ip: '103.236.91.7', ua: 'DshRemote/1.0.11 (Android 14)', loc: '广东 · 深圳' },
  { dev: 'dmo-iphone', name: 'iPhone 15', kind: 'app', online: true, ts: NOW() - 90, ip: '103.236.91.8', ua: 'DshRemote/1.0.11 (iOS 17)', loc: '广东 · 深圳' },
  { dev: 'dmo-browser', name: 'Chrome 130 · Windows', kind: 'web', online: false, ts: NOW() - 7200, ip: '61.144.9.5', ua: 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0', loc: '广东 · 广州' },
]

const events = [
  { t: NOW() - 60, kind: 'pair', title: '设备已配对', detail: 'iPhone 15 扫码配对成功' },
  { t: NOW() - 300, kind: 'verify', title: '验证通过', detail: '来自 103.236.91.7 的访问验证成功' },
  { t: NOW() - 1800, kind: 'totp', title: '2FA 状态', detail: '已开启双因素验证' },
  { t: NOW() - 7200, kind: 'kick', title: '设备已下线', detail: 'Chrome 130 · Windows 被移出' },
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
    const url = urlOf(input)
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
    if (url.endsWith('/browserctl/api/status') || url.includes('/browserctl/api/status?')) return res({ forwarder: true, ok: true })
    if (url.endsWith('/browserctl/api/ensure')) return res({ forwarder: true, ok: true })
    if (url.endsWith('/browserctl/api/stop')) return res({ ok: true })
    if (url.includes('/browserctl/api/link?')) return res({ url: PANEL_BASE, ttl: 3600, uses: 1, remaining: 1 })
    if (url.endsWith('/browserctl/api/qr')) return res({ grant: makeGrant(), url: PANEL_BASE, ttl: 60, svg: qrData })
    if (url.includes('/browserctl/api/totp-kick')) return res({ ok: true })
    if (url.includes('/browserctl/api/totp-toggle')) return res({ ok: true, enabled: true })
    if (url.endsWith('/browserctl/api/totp')) return res({ enabled: true, secret: 'JBSWY3DPEHPK3PXP', sessions, devices: sessions.filter((s) => s.kind === 'app') })
    if (url.includes('/browserctl/api/blacklist-add') || url.includes('/browserctl/api/blacklist-remove')) return res({ ok: true })
    if (url.endsWith('/browserctl/api/config')) return res({ ok: true, enabled: true, system: true })
    if (url.includes('/browserctl/api/update-check')) return res({ ok: true, current: '1.0.11', latest: '1.0.11', upToDate: true })
    if (url.includes('/browserctl/api/server/me')) return res({ ok: false, error: '未登录' })
    if (url.includes('/browserctl/api/server/login') || url.includes('/browserctl/api/server/register')) return res({ ok: true })
    if (url.includes('/browserctl/api/server/logout')) return res({ ok: true })
    // ---- /browserctl-gate/* ----
    if (url.endsWith('/browserctl-gate/blacklist')) return res({ blacklist: [] })
    if (url.endsWith('/browserctl-gate/events')) return res({ events })
    if (url.endsWith('/browserctl-gate/heartbeat')) return res({ ok: true })
    if (url.includes('/browserctl-gate/kick')) return res({ ok: true })
    if (url.includes('/browserctl-gate/notify')) return res({ ok: true, pushed: true })
    if (url.includes('/browserctl-gate/push-config')) return res({ ok: true, enabled: true, system: true })
    if (url.includes('/browserctl-gate/push-poll')) return res({ ok: true, enabled: true, since: 0, items: [] })
    return res({ ok: false, error: 'mock: unknown ' + url }, 404)
  }
}
