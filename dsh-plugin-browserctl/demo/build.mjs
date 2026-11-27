// 演示壳构建：把「真实插件面板组件」打包成独立 IIFE，产物进官网 public/。
// 用 esbuild CLI（spawnSync，AGENTS.md §5.6：沙箱里不能用 JS API）。
import { spawnSync } from 'node:child_process'
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const esbuildBin = path.join(here, '..', 'node_modules', 'esbuild', 'bin', 'esbuild')
const reactRoot = path.join(root, 'dsh-remote-server', 'node_modules')
const outDir = path.join(root, 'dsh-remote-server', 'web-src', 'public', 'demo-desktop', 'plugin')
mkdirSync(outDir, { recursive: true })

// 1) 生成演示二维码：不可扫的占位 QR（避免首屏演示码被陌生人扫到触发真实配对）
function fakeQrSvg() {
  const size = 25, cell = 5, pad = 4
  const total = size * cell + pad * 2
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}"><rect width="${total}" height="${total}" fill="#ffffff"/>`
  const finder = (x, y) => {
    s += `<rect x="${x * cell + pad}" y="${y * cell + pad}" width="${7 * cell}" height="${7 * cell}" fill="#000"/>`
    s += `<rect x="${(x + 1) * cell + pad}" y="${(y + 1) * cell + pad}" width="${5 * cell}" height="${5 * cell}" fill="#fff"/>`
    s += `<rect x="${(x + 2) * cell + pad}" y="${(y + 2) * cell + pad}" width="${3 * cell}" height="${3 * cell}" fill="#000"/>`
  }
  finder(0, 0); finder(size - 7, 0); finder(0, size - 7)
  let seed = 42
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inFinder = (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8)
      if (inFinder) continue
      if (rnd() < 0.42) s += `<rect x="${x * cell + pad}" y="${y * cell + pad}" width="${cell}" height="${cell}" fill="#000"/>`
    }
  }
  s += '</svg>'
  return s
}
writeFileSync(path.join(here, 'qr-data.js'), 'export default ' + JSON.stringify(fakeQrSvg()) + ';\n', 'utf8')

// 2) 打包 root.jsx -> plugin/panel.bundle.js（React、两个 @deepseek-ai/* 都替换成本地演示实现）
const args = [
  esbuildBin,
  path.join(here, 'root.jsx'),
  '--bundle', '--format=iife', '--platform=browser', '--target=chrome120', '--jsx=automatic',
  '--log-level=warning',
  '--outfile=' + path.join(outDir, 'panel.bundle.js'),
  '--alias:react=' + path.join(reactRoot, 'react', 'index.js'),
  '--alias:react/jsx-runtime=' + path.join(reactRoot, 'react', 'jsx-runtime.js'),
  '--alias:react-dom/client=' + path.join(reactRoot, 'react-dom', 'client.js'),
  '--alias:@deepseek-ai/dsh-client-ui-primitives=' + path.join(here, 'primitives.jsx'),
  '--alias:@deepseek-ai/dsh-client-store=' + path.join(here, 'store.js'),
]
const r = spawnSync(process.execPath, args, { stdio: 'inherit' })
if (r.status !== 0) { console.error('esbuild failed:', r.status); process.exit(r.status) }

// 3) 宿主页
// 真实面板的配色来自 DSH 主题变量；独立页里没有这些变量时，
// --dsw-alias-label-primary 的兜底是 inherit → 继承成默认黑字，在深色底上就"太黑看不清"。
const themeVars = `  :root {
    --dsw-alias-bg-layer-1: #232324;
    --dsw-alias-bg-layer-2: #2c2c2e;
    --dsw-alias-bg-layer-3: #353638;
    --dsw-alias-border-l1: #ffffff0f;
    --dsw-alias-border-l2: #ffffff1f;
    --dsw-alias-border-l3: #ffffff29;
    --dsw-alias-label-primary: #f9fafb;
    --dsw-alias-label-secondary: #cfd3d6;
    --dsw-alias-label-tertiary: #adb2b8;
    --dsw-alias-state-error-primary: #f25a5a;
    --dsw-alias-state-success-primary: #22c55e;
    --dsw-alias-state-warning-primary: #f7ad31;
    color-scheme: dark;
  }`
const btnStyles = `  .dshDemoBtn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; font: inherit; cursor: pointer; border: 1px solid transparent; font-size: 13px; line-height: 1.4; transition: filter .15s ease, opacity .15s ease; }
  .dshDemoBtn:disabled { opacity: .5; cursor: not-allowed; }
  .dshDemoBtn--primary { background: var(--dsw-alias-accent-primary, #5a67d8); color: #fff; }
  .dshDemoBtn--secondary { background: transparent; color: inherit; border-color: rgba(128,128,128,.35); }
  .dshDemoBtn--ghost { background: transparent; color: inherit; }
  .dshDemoBtn--solid { background: rgba(128,128,128,.18); color: inherit; }
  .dshDemoBtn--sm { padding: 4px 10px; font-size: 12px; }
  .dshDemoBtn--md { padding: 6px 14px; }
  .dshDemoTooltip { display: inline-flex; }`

const panelHtml = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DSH 远程助手 · 真实面板演示</title>
<style>
${themeVars}
  html, body { margin: 0; padding: 0; background: #151517; color: var(--dsw-alias-label-primary); }
  #root { min-height: 100vh; }
${btnStyles}
</style>
</head>
<body><div id="root"></div><script src="panel.bundle.js"></script></body>
</html>
`

// 合成页：底图 = DSH 桌面端真实截图（已抹掉原弹窗与阴影），浮层 = 真面板。
// 设计视口 1477x977（截图裁掉标题栏后按 1:1.5 折算），面板位置对齐截图里原来的弹窗。
const desktopHtml = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DSH 远程助手 · 真实窗口演示</title>
<style>
${themeVars}
  html, body {
    margin: 0; padding: 0; height: 100%; overflow: hidden;
    background: #101013 url(../bg/dsh-window.webp) 0 0 / 100% 100% no-repeat;
    color: var(--dsw-alias-label-primary);
  }
  #root { height: 100%; }
  /* 底图里已经压过 45% 遮罩，再叠一层会二次变暗 */
  .dshBrowserCtlOverlayMask { display: none !important; }
  /* 面板对齐到底图里弹窗的位置：左上角 (415,163)，宽 880，高由内容决定 */
  .dshBrowserCtlOverlay {
    justify-content: flex-start !important;
    align-items: flex-start !important;
    padding: 163px 0 0 415px !important;
  }
${btnStyles}
</style>
</head>
<body><div id="root"></div><script src="panel.bundle.js"></script></body>
</html>
`
writeFileSync(path.join(outDir, 'panel.html'), panelHtml, 'utf8')
writeFileSync(path.join(outDir, 'desktop.html'), desktopHtml, 'utf8')
console.log('demo panel built ->', path.join(outDir, 'panel.bundle.js'))
