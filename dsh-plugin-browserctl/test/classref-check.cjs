#!/usr/bin/env node
/* B3 完整性门禁(2026-11-26,lead 加急要求):JSX className 引用 ↔ CSS 定义 零缺失校验。
 * 背景:B2 期 JSX 曾引用仅存在于 B3 未提交追加区的类(dshBrowserCtlInsetBox),
 * HEAD 构建产物里「JSX 引用了不存在的 CSS 类」静默裸奔。本检查防止同类漏网:
 *   1) 扫 src/client/{cards,overlay,ui}.jsx 的 className 字面量(含模板串内静态段);
 *   2) 比对 styles.js + install-styles.js 的 .类名 定义;
 *   3) 白名单:primitives 透传/宿主 slot/测试桩等非本插件 CSS 体系类。
 * 用法:node test/classref-check.cjs  (退出码非 0 = 有缺失)
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'src', 'client')
const FILES = [
  ...fs.readdirSync(path.join(SRC, 'cards')).map(f => path.join(SRC, 'cards', f)),
  path.join(SRC, 'overlay.jsx'),
  path.join(SRC, 'ui.jsx'),
]
// 非本插件 CSS 体系的类:DSH primitives 钩子/宿主 slot/仅 JS 消费的标记类。
// 命中白名单前缀即跳过(前缀匹配,新增豁免要写明原因)。
const WHITELIST = [
  'dshBrowserCtlHeader',   // 前缀自身有定义,但其变体 Button 包装器跳过逻辑(BTN_SOFT_SKIP)复用该前缀
  'dsh-unlag',             // 宿主侧
]

const cssFiles = [path.join(SRC, 'styles.js'), path.join(SRC, 'install-styles.js')]
const css = cssFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n')

const referenced = new Map() // class -> [file:line]
for (const file of FILES) {
  const tx = fs.readFileSync(file, 'utf8')
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  const lines = tx.split('\n')
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/className="([^"]+)"/g)) collect(rel, i + 1, m[1])
    for (const m of line.matchAll(/className=\{`([^`]+)`\}/g)) collect(rel, i + 1, m[1])
  })
}
function collect(rel, lineNo, raw) {
  for (let c of raw.split(/\s+/)) {
    c = c.trim()
    if (!c || c.includes('${')) continue // 动态拼接段交给 data-* 属性钩子,不在此校验
    if (!referenced.has(c)) referenced.set(c, [])
    referenced.get(c).push(rel + ':' + lineNo)
  }
}

const missing = []
for (const [c, locs] of [...referenced].sort()) {
  if (WHITELIST.some(w => c.startsWith(w))) continue
  if (!css.includes('.' + c)) missing.push({ c, locs })
}

if (missing.length) {
  console.error('classref-check FAIL: %d 个 JSX 引用类在 styles.js/install-styles.js 无定义:', missing.length)
  for (const m of missing) console.error('  - ' + m.c + '  @ ' + m.locs.join(', '))
  process.exit(1)
}
console.log('classref-check OK: ' + referenced.size + ' 个引用类全部有定义(白名单豁免 '
  + [...referenced.keys()].filter(c => WHITELIST.some(w => c.startsWith(w))).length + ' 个)')
