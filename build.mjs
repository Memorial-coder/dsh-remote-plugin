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

// esbuild 的 bin shim(可移植;内部 execFileSync + stdio:"inherit")
const ESBUILD_SHIM = join(process.cwd(), 'node_modules', 'esbuild', 'bin', 'esbuild')

function run(args) {
  const r = spawnSync(process.execPath, [ESBUILD_SHIM, ...args], { stdio: 'inherit' })
  if (r.error) throw r.error
  if (r.status !== 0) process.exit(r.status || 1)
}

// ---- host 半 (ESM, 官方模板/peer 插件(dsh-unlag 等)同款: package.json type:module + 具名导出) ----
run([
  'src/index.js',
  '--bundle',
  '--outfile=lib/index.js',
  '--platform=node',
  '--format=esm',
  '--target=node22',
  '--external:node:*',
  // qrcode 保持外部依赖(它是 CJS,打进 ESM 会留下运行时 __require("util") 炸点),
  // Node ESM 对 CJS 包的默认互操作可直接 import QRCode from 'qrcode'
  '--external:qrcode',
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
