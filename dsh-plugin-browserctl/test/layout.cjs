/* 发布包布局测试(自包含打包改造的回归):
 *
 * 目标:验证插件 host 半在两种布局下都能解析出「核心目录」(放 browserctl.py 的目录):
 *   A 发布包(pkg/)  : <tmp>/pkg/lib/index.js + <tmp>/pkg/browserctl.py + <tmp>/pkg/package.json
 *                      → 解压即用,不需要 node_modules
 *   B 源码克隆(repo): <tmp>/repo/dsh-plugin-browserctl/lib/index.js + <tmp>/repo/browserctl.py
 *
 * 做法:把构建产物 lib/index.js(ESM)+ 最小 package.json 复制到临时目录,再用
 * import() 真跑一遍 —— 因为路径解析发生在模块加载期(ROOT = resolveCoreRoot())。
 * 同时断言 qrcode 已内联进 lib/index.js、package.json 不再把它列为运行时依赖。
 *
 * 运行:node test/layout.cjs   (不依赖 DSH,不需要联网)
 */
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const PLUGIN_DIR = path.join(__dirname, '..')
const BUNDLE = path.join(PLUGIN_DIR, 'lib', 'index.js')
const PKG_PATH = path.join(PLUGIN_DIR, 'package.json')

let failed = 0
function check(name, cond, detail) {
  if (cond) {
    console.log('  OK   ' + name + (detail ? '  (' + detail + ')' : ''))
  } else {
    failed++
    console.log('  FAIL ' + name + (detail ? '  (' + detail + ')' : ''))
  }
}

function norm(p) {
  // Windows 盘符/大小写不敏感:统一小写比较,避免 C:\Users / c:\users 误判
  const abs = path.resolve(String(p || ''))
  return process.platform === 'win32' ? abs.toLowerCase() : abs
}
function sameDir(a, b) {
  return !!a && !!b && norm(a) === norm(b)
}

// 最小 package.json:只要 "type":"module",让 lib/index.js 以 ESM 身份被 import。
const MINI_PKG = JSON.stringify({
  name: 'dsh-plugin-browserctl',
  version: '0.0.0-layout-test',
  private: true,
  type: 'module',
}, null, 2)

function writeStubCore(dir) {
  // 判据只看 browserctl.py 是否存在,内容无所谓(测试里绝不执行它)
  fs.writeFileSync(path.join(dir, 'browserctl.py'), '# layout test stub\n', 'utf8')
}

async function main() {
  if (!fs.existsSync(BUNDLE)) {
    console.error('缺少构建产物 lib/index.js,请先执行 node build.mjs')
    process.exit(1)
  }

  const bundleText = fs.readFileSync(BUNDLE, 'utf8')
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'))

  console.log('=== A. 发布包布局(pkg/lib/index.js + pkg/browserctl.py) ===')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-browserctl-layout-'))
  try {
    const pkgRoot = path.join(tmp, 'pkg')
    fs.mkdirSync(path.join(pkgRoot, 'lib'), { recursive: true })
    fs.copyFileSync(BUNDLE, path.join(pkgRoot, 'lib', 'index.js'))
    fs.writeFileSync(path.join(pkgRoot, 'package.json'), MINI_PKG, 'utf8')
    writeStubCore(pkgRoot)

    const modA = await import(pathToFileURL(path.join(pkgRoot, 'lib', 'index.js')).href)
    check('导出 apply 是函数', typeof modA.apply === 'function')
    check('导出 resolveCoreRoot 是函数', typeof modA.resolveCoreRoot === 'function')
    const rootA = modA.resolveCoreRoot()
    check('resolveCoreRoot() === <tmp>/pkg', sameDir(rootA, pkgRoot), String(rootA))

    console.log('=== B. 源码克隆布局(repo/dsh-plugin-browserctl/lib + repo/browserctl.py) ===')
    const repoRoot = path.join(tmp, 'repo')
    const pluginRoot = path.join(repoRoot, 'dsh-plugin-browserctl')
    fs.mkdirSync(path.join(pluginRoot, 'lib'), { recursive: true })
    fs.copyFileSync(BUNDLE, path.join(pluginRoot, 'lib', 'index.js'))
    fs.writeFileSync(path.join(pluginRoot, 'package.json'), MINI_PKG, 'utf8')
    writeStubCore(repoRoot) // 核心文件在仓库根

    const modB = await import(pathToFileURL(path.join(pluginRoot, 'lib', 'index.js')).href)
    check('导出 apply 是函数', typeof modB.apply === 'function')
    const rootB = modB.resolveCoreRoot()
    check('resolveCoreRoot() === <tmp>/repo', sameDir(rootB, repoRoot), String(rootB))
    check('两种布局解析结果不同', !sameDir(rootA, rootB))

    // BROWSERCTL_HOME 显式覆盖(排障通道)必须优先
    const override = path.join(tmp, 'custom-core')
    fs.mkdirSync(override, { recursive: true })
    writeStubCore(override)
    const oldEnv = process.env.BROWSERCTL_HOME
    process.env.BROWSERCTL_HOME = override
    try {
      check('BROWSERCTL_HOME 优先', sameDir(modA.resolveCoreRoot(), override), String(modA.resolveCoreRoot()))
    } finally {
      if (oldEnv === undefined) delete process.env.BROWSERCTL_HOME
      else process.env.BROWSERCTL_HOME = oldEnv
    }

    console.log('=== C. 零运行时依赖 / 版本号单一来源 ===')
    const dep = pkg.dependencies || {}
    check('package.json 没有 dependencies.qrcode', dep.qrcode === undefined, JSON.stringify(dep))
    check('qrcode 在 devDependencies', !!(pkg.devDependencies && pkg.devDependencies.qrcode))
    check('lib/index.js 不含 from "qrcode"', !bundleText.includes('from "qrcode"'))
    check('lib/index.js 不含 require("qrcode")', !bundleText.includes('require("qrcode")'))
    // qrcode 依赖 pngjs / dijkstrajs,内联后它们会作为字符串出现在产物里
    const pngjsHits = (bundleText.match(/pngjs/g) || []).length
    check('lib/index.js 已内联 qrcode(含 pngjs)', pngjsHits >= 5, 'pngjs 命中 ' + pngjsHits + ' 次')
    check('package.json 版本号是 1.0.31', pkg.version === '1.0.31', String(pkg.version))

    // 版本号由 build.mjs 从 package.json 注入:两个产物里都应出现同一版本字符串
    const clientBundle = path.join(PLUGIN_DIR, 'lib', 'client.js')
    const clientText = fs.existsSync(clientBundle) ? fs.readFileSync(clientBundle, 'utf8') : ''
    check('lib/index.js 含注入版本号 ' + pkg.version, bundleText.includes(pkg.version))
    check('lib/client.js 含注入版本号 ' + pkg.version, clientText.includes(pkg.version))

    console.log('=== D. 隧道就绪门禁tunnelReady(新/旧闸机 state 兼容) ===')
    // 用 BROWSERCTL_HOME 指向一个只有 browserctl.py 的假核心目录,再往里面写各种 state,
    // 直接验证「未就绪时二维码路由会 503」背后的判定函数(不启动闸机、不碰真实凭据)。
    const coreDir = path.join(tmp, 'fake-core')
    fs.mkdirSync(coreDir, { recursive: true })
    writeStubCore(coreDir)
    const probeRoot = path.join(tmp, 'probe', 'dsh-plugin-browserctl')
    fs.mkdirSync(path.join(probeRoot, 'lib'), { recursive: true })
    fs.copyFileSync(BUNDLE, path.join(probeRoot, 'lib', 'index.js'))
    fs.writeFileSync(path.join(probeRoot, 'package.json'), MINI_PKG, 'utf8')
    const statePath = path.join(coreDir, 'browserctl_state.json')
    const writeState = (obj) => fs.writeFileSync(statePath, JSON.stringify(obj), 'utf8')

    const envBackup = process.env.BROWSERCTL_HOME
    let modC = null
    process.env.BROWSERCTL_HOME = coreDir
    try {
      modC = await import(pathToFileURL(path.join(probeRoot, 'lib', 'index.js')).href)
      check('BROWSERCTL_HOME 布局解析到假核心目录', sameDir(modC.resolveCoreRoot(), coreDir))

      // 新闸机:明确未就绪 → 拒绝,并把闸机给的中文原因原文透出
      writeState({ tunnel_ok: false, tunnel_error: '隧道未连通: frpc 未注册远端端口', frpc_pid: 0, remote_port: 0 })
      const r1 = modC.tunnelReady()
      check('tunnel_ok=false → 未就绪', r1.ok === false)
      check('tunnel_error 原因透传', String(r1.error || '').includes('frpc 未注册远端端口'), String(r1.error))

      // 新闸机:就绪 → 通过(tunnel_ok 是权威判据,不要求 frpc_pid 活着)
      writeState({ tunnel_ok: true, tunnel_error: '', frpc_pid: 0, remote_port: 17901 })
      const r2 = modC.tunnelReady()
      check('tunnel_ok=true → 就绪(不依赖 frpc_pid)', r2.ok === true)

      // 旧闸机:没有 tunnel_ok 字段 → 退回 remote_port>0 && frpc_pid 存活
      writeState({ remote_port: 17901, frpc_pid: process.pid }) // 当前 node 进程必然存活
      check('旧 state + 活 pid → 就绪', modC.tunnelReady().ok === true)
      writeState({ remote_port: 17901, frpc_pid: 999999 })
      check('旧 state + 死 pid → 未就绪', modC.tunnelReady().ok === false)
      writeState({})
      check('两个字段都没有 → 允许(旧行为)', modC.tunnelReady().ok === true)
    } finally {
      if (envBackup === undefined) delete process.env.BROWSERCTL_HOME
      else process.env.BROWSERCTL_HOME = envBackup
    }

    console.log('=== E. 路由门禁:隧道未就绪时 4 个二维码接口必须 503,status 带 tunnel ===')
    // 只执行路由注册那个 effect(不跑 win_push/自动建隧道等有副作用的 effect),
    // 拿到 /browserctl/api 前缀 handler 直接调,验证「绝不发扫了会 502 的二维码」。
    const routes = {}
    const ctx = {
      effect(fn, effectName) {
        if (effectName === 'dshremote: routes') fn()
        return () => {}
      },
      webServer: {
        register(def) { routes[def.path] = def.handler; return () => {} },
      },
      logger: { info() {}, warn() {}, error() {} },
    }
    modC.apply(ctx)
    // 路由前缀随插件身份变化(正式版 /browserctl/api,带后缀的副本 /browserctl-xxx/api),
    // 这里按实际注册的那个取,避免身份不同的副本跑 layout 时误报「路由未注册」。
    const API = Object.keys(routes).find(p => /^\/browserctl(-[a-z0-9]+)?\/api$/.test(p))
    check('注册了 /browserctl/api 前缀路由', !!API && typeof routes[API] === 'function')

    writeState({ tunnel_ok: false, tunnel_error: '隧道未连通: frpc 未注册远端端口', frpc_pid: 0, remote_port: 0 })
    const call = (routePath) => new Promise((resolve) => {
      const req = {
        url: routePath, method: 'GET',
        headers: { host: '127.0.0.1:60056' },
        socket: { remoteAddress: '127.0.0.1' }, // 本机 loopback → apiAuthorized 放行
      }
      let status = 0
      const res = {
        writeHead(code) { status = code },
        setHeader() {},
        end(body) {
          let json = null
          try { json = JSON.parse(String(body || '')) } catch {}
          resolve({ status, json })
        },
      }
      Promise.resolve(routes[API](req, res))
        .catch(() => resolve({ status: 0, json: null }))
    })

    for (const p of [API + '/qr', API + '/link', API + '/pair', API + '/pair-long']) {
      const out = await call(p)
      check(p + ' → 503', out.status === 503, 'status=' + out.status)
      const err = String((out.json && out.json.error) || '')
      check(p + ' 返回可读原因', err.startsWith('隧道未建立：') && err.includes('frpc 未注册远端端口'), err)
    }

    const st1 = await call(API + '/status')
    check('status.tunnel.ok === false', !!(st1.json && st1.json.tunnel && st1.json.tunnel.ok === false))
    check('status.tunnel.error 透传原因', !!(st1.json && st1.json.tunnel && String(st1.json.tunnel.error).includes('frpc 未注册远端端口')))
    check('status.tunnel.port === 0', !!(st1.json && st1.json.tunnel && st1.json.tunnel.port === 0))

    writeState({ tunnel_ok: true, tunnel_error: '', frpc_pid: process.pid, remote_port: 17901 })
    const st2 = await call(API + '/status')
    check('隧道就绪后 status.tunnel.ok === true', !!(st2.json && st2.json.tunnel && st2.json.tunnel.ok === true))
    check('status.tunnel.port 回传远端端口', !!(st2.json && st2.json.tunnel && st2.json.tunnel.port === 17901))
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }) } catch {}
  }

  console.log('')
  if (failed === 0) {
    console.log('结论: 全部通过 (layout)')
    process.exit(0)
  }
  console.log('结论: ' + failed + ' 项失败 (layout)')
  process.exit(1)
}

main().catch((e) => {
  console.error('layout 测试异常: ' + (e && e.stack ? e.stack : e))
  process.exit(1)
})
