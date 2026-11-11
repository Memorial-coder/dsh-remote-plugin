// 通知路由冒烟:import 构建产物 lib/index.js,注册到假 webServer,
// 依次请求 /server/messages(登录/未登录/服务器异常)与 /server/messages/read,断言降级语义。
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

let failed = 0
function check(name, cond, detail) {
  if (cond) console.log('  OK   ' + name + (detail ? '  (' + detail + ')' : ''))
  else { failed++; console.log('  FAIL ' + name + (detail ? '  (' + detail + ')' : '')) }
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-msg-smoke-'))
  // 摆发布布局: <tmp>/lib/index.js + <tmp>/browserctl.py + <tmp>/package.json → ROOT=tmp
  fs.mkdirSync(path.join(tmp, 'lib'))
  const pluginDir = path.join(__dirname, '..')
  fs.copyFileSync(path.join(pluginDir, 'lib', 'index.js'), path.join(tmp, 'lib', 'index.js'))
  fs.copyFileSync(path.join(pluginDir, 'package.json'), path.join(tmp, 'package.json'))
  fs.writeFileSync(path.join(tmp, 'browserctl.py'), '# stub\n')
  // state/secrets 放 cwd(模块按 ROOT 上溯找 cwd 同名文件? 不——它们落 CORE_DIR=ROOT)
  const STATE_PATH = path.join(tmp, 'browserctl_state.json')
  const SECRETS_PATH = path.join(tmp, 'browserctl_secrets.json')
  fs.writeFileSync(STATE_PATH, JSON.stringify({ fwd_port: 3080 }))
  fs.writeFileSync(SECRETS_PATH, JSON.stringify({}))

  // 官方服务器 mock:替换全局 fetch
  const CALLS = []
  let MODE = 'ok' // ok | logged | err401 | err500 | neterr
  const realFetch = global.fetch
  global.fetch = async (url, opts = {}) => {
    try { return await doFetch(url, opts) }
    finally { /* CALLS 已在 doFetch 里记录 */ }
  }
  async function doFetch(url, opts = {}) {
    CALLS.push({ url: String(url), method: opts.method || 'GET', auth: !!(opts.headers && opts.headers.authorization) })
    if (MODE === 'neterr') throw new Error('ECONNREFUSED')
    if (String(url).endsWith('/api/messages/read')) {
      return { ok: true, status: 200, json: async () => ({ ok: true, unread: 0 }) }
    }
    if (String(url).endsWith('/api/messages')) {
      if (MODE === 'err401') return { ok: false, status: 401, json: async () => ({ error: '未登录或登录已过期' }) }
      if (MODE === 'err500') return { ok: false, status: 500, json: async () => ({ error: 'boom' }) }
      return { ok: true, status: 200, json: async () => ({ ok: true, messages: [{ id: 'm2', kind: 'personal', title: '定向', body: 'hi', link: null, createdAt: 2, read: false }], unread: 1 }) }
    }
    if (String(url).endsWith('/api/messages/public')) {
      if (MODE === 'err500' || MODE === 'neterr') throw new Error('ECONNREFUSED')
      return { ok: true, status: 200, json: async () => ({ ok: true, messages: [{ id: 'm1', kind: 'official', title: '公告', body: 'all', link: null, createdAt: 1, read: false }] }) }
    }
    return { ok: false, status: 404, json: async () => ({ error: 'no route' }) }
  }

  const mod = await import(pathToFileURL(path.join(tmp, 'lib', 'index.js')).href)
  const routes = {}
  const fakeCtx = {
    effect(fn, effectName) {
      if (effectName === 'dshremote: routes') fn()
      return () => {}
    },
    webServer: { register: (r) => { routes[r.path] = r.handler; return () => {} } },
    logger: { info() {}, warn() {}, error() {} },
  }
  mod.apply(fakeCtx, {})
  const handler = routes['/browserctl/api']
  check('host 路由已注册 /browserctl/api', typeof handler === 'function')

  // 鉴权:apiAuthorized 要求回环 socket 且无转发头(layout 同款桩)
  const mkReq = (p, extra = {}) => ({ url: p, headers: { host: '127.0.0.1:61497', ...extra }, socket: { remoteAddress: '127.0.0.1' } })
  const mkRes = () => {
    const res = { statusCode: 0, headers: null, body: '' }
    res.writeHead = (c, h) => { res.statusCode = c; res.headers = h }
    res.end = (b) => { res.body = b || '' }
    return res
  }

  // 1) 未登录 → 公开公告
  MODE = 'ok'
  let res = mkRes()
  await handler(mkReq('/browserctl/api/server/messages'), res)
  let j = {}
  try { j = JSON.parse(res.body) } catch {}
  if (!j.ok) console.log('  (debug) status=' + res.statusCode + ' body=' + res.body.slice(0, 200))
  check('未登录 → 200 + loggedIn:false', res.statusCode === 200 && j.ok === true && j.loggedIn === false)
  check('未登录 → 返回公开公告 m1', j.messages && j.messages[0] && j.messages[0].id === 'm1')
  check('未登录 → 只打了 public 接口', CALLS.every(c => !c.url.endsWith('/api/messages')) === false || CALLS.filter(c => c.url.endsWith('/api/messages')).length === 0)

  // 2) 登录 → Bearer 拉定向+全员
  MODE = 'logged'
  fs.writeFileSync(SECRETS_PATH, JSON.stringify({ server_token: 'tok-abc', server_mode: 'official' }))
  CALLS.length = 0
  res = mkRes()
  await handler(mkReq('/browserctl/api/server/messages'), res)
  j = JSON.parse(res.body)
  check('已登录 → 200 + loggedIn:true + unread:1', res.statusCode === 200 && j.loggedIn === true && j.unread === 1)
  check('已登录 → 带 Bearer 调 /api/messages', CALLS.some(c => c.url.endsWith('/api/messages') && c.auth))
  check('已登录 → 返回定向消息 m2', j.messages && j.messages[0] && j.messages[0].id === 'm2')

  // 3) token 过期(401) → 退回公开公告
  MODE = 'err401'
  CALLS.length = 0
  res = mkRes()
  await handler(mkReq('/browserctl/api/server/messages'), res)
  j = JSON.parse(res.body)
  check('401 → 降级公开公告 loggedIn:false', res.statusCode === 200 && j.ok === true && j.loggedIn === false && j.messages[0].id === 'm1')

  // 4) 服务器 500 → ok:false + error
  MODE = 'err500'
  res = mkRes()
  await handler(mkReq('/browserctl/api/server/messages'), res)
  j = JSON.parse(res.body)
  check('500 → ok:false 带 error(有 token 时不降级)', res.statusCode === 200 && j.ok === false && !!j.error)

  // 5) 未登录 + 服务器不可达 → 502
  MODE = 'neterr'
  fs.writeFileSync(SECRETS_PATH, JSON.stringify({}))
  res = mkRes()
  await handler(mkReq('/browserctl/api/server/messages'), res)
  check('网络异常 → 502', res.statusCode === 502)

  // 6) read:未登录 → 直接 ok(不请求)
  MODE = 'ok'
  CALLS.length = 0
  res = mkRes()
  await handler(mkReq('/browserctl/api/server/messages/read', { 'sec-fetch-site': 'same-origin', origin: 'http://127.0.0.1:61497' }), res)
  j = JSON.parse(res.body)
  check('read 未登录 → ok:true unread:0 且未出网', j.ok === true && j.unread === 0 && CALLS.length === 0)

  // 7) read:登录 → 代理 POST
  fs.writeFileSync(SECRETS_PATH, JSON.stringify({ server_token: 'tok-abc' }))
  CALLS.length = 0
  res = mkRes()
  await handler(mkReq('/browserctl/api/server/messages/read', { 'sec-fetch-site': 'same-origin', origin: 'http://127.0.0.1:61497' }), res)
  j = JSON.parse(res.body)
  check('read 已登录 → 代理 POST /api/messages/read 带 Bearer', j.ok === true && CALLS.some(c => c.url.endsWith('/api/messages/read') && c.method === 'POST' && c.auth))

  // 8) read:CSRF 跨站拒绝
  res = mkRes()
  await handler(mkReq('/browserctl/api/server/messages/read', { 'sec-fetch-site': 'cross-site', origin: 'https://evil.example' }), res)
  check('read 跨站 → 403', res.statusCode === 403)

  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(failed ? ('结论: ' + failed + ' 项失败 (msg-routes)') : '结论: 全部通过 (msg-routes)')
  process.exit(failed ? 1 : 0)
}

main().catch((e) => { console.error('msg-routes 测试异常: ' + (e && e.stack ? e.stack : e)); process.exit(1) })
