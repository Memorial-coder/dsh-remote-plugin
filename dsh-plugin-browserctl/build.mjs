/** 构建 browserctl 插件: host 半 + client 半(client 包裹成 __ModuleLoader__ CJS)。
 *
 * 为什么不用 esbuild 的 JS API(build())?
 *   它的实现会用「管道 stdio」spawn 原生 esbuild 二进制,而 DSH 沙箱禁止命名管道
 *   → 报 `spawn EPERM`(见 AGENTS.md 沙箱边界)。这里改成 spawnSync 调 esbuild 的
 *   bin shim(shim 内部是 execFileSync + stdio:"inherit"),沙箱内外都能跑。
 * client 半先构建到临时文件,再在 Node 里用 banner/footer 包裹(避免 Windows 下
 * 把多行 banner 塞进 CLI 参数的引号问题)。
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const PACKAGE_NAME = 'dsh-plugin-browserctl'

// 版本号单一来源 = package.json 的 version:host 与 client 两半都靠 esbuild
// `--define:__DSHREMOTE_VERSION__="x.y.z"` 注入,源码里不再写死版本号
// (历史上 package.json / client.jsx / git tag 三处各说各话)。
const PKG = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
const VERSION = String(PKG.version || '').trim()
if (!/^\d+\.\d+\.\d+/.test(VERSION)) {
  throw new Error('package.json 的 version 不合法: ' + JSON.stringify(PKG.version))
}
const VERSION_DEFINE = '--define:__DSHREMOTE_VERSION__=' + JSON.stringify(VERSION)
console.log('version -> ' + VERSION + ' (from package.json)')

const EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-locale/client',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-layout/client',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-settings/client',
  '@deepseek-ai/dsh-client-ui-sidebar/client',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-store',
]

// esbuild 的 bin 入口。Windows 上 node_modules/esbuild/bin/esbuild 是 JS shim(用 node 执行);
// 非 Windows 上 esbuild 的 postinstall 会把该文件硬链成原生二进制(直接执行), 若仍用 node 去跑
// 会报 `SyntaxError: Invalid or unexpected token`(GitHub Actions Linux 踩过)。
// 这里按文件头 magic 判断: ELF/Mach-O/PE = 原生二进制直接执行, 否则 JS shim 走 node。
const ESBUILD_SHIM = join(process.cwd(), 'node_modules', 'esbuild', 'bin', 'esbuild')

function isNativeBinary(file) {
  try {
    const b = readFileSync(file)
    if (b.length < 4) return false
    // ELF(linux): 0x7F 'E' 'L' 'F'
    if (b[0] === 0x7f && b[1] === 0x45 && b[2] === 0x4c && b[3] === 0x46) return true
    // Mach-O(macos) 64bit LE/32bit LE / BE
    if (b[0] === 0xcf && b[1] === 0xfa && b[2] === 0xed && b[3] === 0xfe) return true
    if (b[0] === 0xce && b[1] === 0xfa && b[2] === 0xed && b[3] === 0xfe) return true
    if (b[0] === 0xfe && b[1] === 0xed && b[2] === 0xfa && b[3] === 0xcf) return true
    // PE(windows): 'MZ'
    if (b[0] === 0x4d && b[1] === 0x5a) return true
    return false
  } catch {
    return false
  }
}

const esbuildIsNative = isNativeBinary(ESBUILD_SHIM)

function run(args) {
  const cmd = esbuildIsNative ? ESBUILD_SHIM : process.execPath
  const execArgs = esbuildIsNative ? args : [ESBUILD_SHIM, ...args]
  const r = spawnSync(cmd, execArgs, { stdio: 'inherit' })
  if (r.error) throw r.error
  if (r.status !== 0) process.exit(r.status || 1)
}

// ---- host 半 (ESM, 官方模板/peer 插件(dsh-unlag 等)同款: package.json type:module + 具名导出) ----
// qrcode 不再 external:直接打进 lib/index.js,发布包解压即用、零 npm install。
// 但 qrcode 是 CJS 且 pngjs 在模块闭包里 `require("fs")`(静态但不在顶层),
// esbuild 在 ESM 产物里只能留下运行时 `__require("fs")` 兜底 —— 直接 import 会抛
// `Dynamic require of "fs" is not supported`。所以注入 createRequire banner,
// 让产物里的 require 在 Node ESM 下真实可用(Node 内建模块保持外部引用,不重复打包)。
const HOST_BANNER =
  "import { createRequire as __dshCreateRequire } from 'node:module';\n" +
  "const require = __dshCreateRequire(import.meta.url);"
run([
  'src/index.js',
  '--bundle',
  '--outfile=lib/index.js',
  '--platform=node',
  '--format=esm',
  '--target=node22',
  '--external:node:*',
  '--banner:js=' + HOST_BANNER,
  VERSION_DEFINE,
  ...EXTERNALS.map(e => '--external:' + e),
  '--log-level=info',
])

// ---- client 半 (CJS + __ModuleLoader__ 包裹) ----
const tmpOut = 'lib/.client.tmp.js'
run([
  'src/client.jsx',
  '--bundle',
  '--outfile=' + tmpOut,
  '--platform=browser',
  '--format=cjs',
  '--target=es2022',
  '--jsx=automatic',
  VERSION_DEFINE,
  ...EXTERNALS.map(e => '--external:' + e),
  '--log-level=info',
])

const banner =
  'var module = { exports: {} }; var exports = module.exports;\n' +
  `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_NAME)}, factory: (require) => {`
const footer = 'return module.exports; } });'
const body = readFileSync(tmpOut, 'utf8')
writeFileSync('lib/client.js', banner + '\n' + body + '\n' + footer + '\n')
rmSync(tmpOut)
console.log('client wrapped -> lib/client.js')
