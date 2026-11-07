/* 面板插件冒烟测试：用最小 React 实现真实渲染每个页签，
   任何把 object 当组件类型（React #130）或其它渲染期异常都会立即抛出。 */
const fs = require('fs')

const BUNDLE = require('node:path').join(__dirname, '..', 'lib', 'client.js')
const code = fs.readFileSync(BUNDLE, 'utf8')

// ---------- 最小 React ----------
const FRAGMENT = Symbol('Fragment')
class Element {
  constructor(type, props) { this.type = type; this.props = props || {} }
}

// hook 状态：支持按索引覆盖，用于驱动 tab 切换
let HOOK_OVERRIDE = {}
let hookIdx = 0

function makeElement(type, props) {
  if (typeof type !== 'string' && typeof type !== 'function' && type !== FRAGMENT) {
    const kind = type === null ? 'null' : Array.isArray(type) ? 'array' : typeof type
    throw new Error('React #130: invalid element type, got ' + kind +
                    ' (value=' + String(type).slice(0, 60) + ')')
  }
  return new Element(type, props)
}

const jsxRuntime = { jsx: makeElement, jsxs: makeElement, jsxDEV: makeElement, Fragment: FRAGMENT }

const React = {
  createElement: makeElement,
  Fragment: FRAGMENT,
  useState: (init) => {
    const i = hookIdx++
    const val = Object.prototype.hasOwnProperty.call(HOOK_OVERRIDE, i)
      ? HOOK_OVERRIDE[i]
      : (typeof init === 'function' ? init() : init)
    return [val, () => {}]
  },
  useEffect: () => {},
  useLayoutEffect: () => {},
  useRef: (v) => ({ current: v }),
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn(),
  useReducer: (r, init) => [init, () => {}],
  Children: { map: (c, f) => (Array.isArray(c) ? c.map(f) : [f(c)]), toArray: (c) => (Array.isArray(c) ? c : [c]) },
}

const stub = (name) => { const C = (p) => makeElement('div', { 'data-stub': name, ...p }); C.displayName = name; return C }
const primitives = {
  Button: stub('Button'), Tooltip: stub('Tooltip'),
  IconCloseOutlineRegular: stub('IconClose'), IconCloseOutline: stub('IconClose'),
}

// ---------- 遍历渲染 ----------
function walk(node, out, depth) {
  if (depth > 200) throw new Error('渲染深度超限（疑似死循环）')
  if (node === null || node === undefined || node === false || node === true) return
  if (typeof node === 'string' || typeof node === 'number') { out.text += String(node); return }
  if (Array.isArray(node)) { node.forEach((n) => walk(n, out, depth + 1)); return }
  if (node instanceof Element) {
    const t = node.type
    if (typeof t === 'function') { walk(t(node.props), out, depth + 1); return }
    if (t === FRAGMENT) { walk(node.props.children, out, depth + 1); return }
    out.tags[t] = (out.tags[t] || 0) + 1
    walk(node.props && node.props.children, out, depth + 1)
    return
  }
  throw new Error('无法渲染的节点: ' + Object.prototype.toString.call(node))
}

// ---------- 环境桩 ----------
const fakeEl = () => ({
  dataset: {}, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  setAttribute() {}, removeAttribute() {}, getAttribute: () => null,
  appendChild() {}, append() {}, remove() {}, insertBefore() {}, set textContent(v) {},
  querySelector: () => null, querySelectorAll: () => [],
  getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
})

let exported = null
const fakeRequire = (name) => {
  switch (name) {
    case 'react': return React
    case 'react/jsx-runtime': return jsxRuntime
    case 'react-dom': return {}
    case '@deepseek-ai/dsh-client-ui-primitives': return primitives
    case '@deepseek-ai/dsh-client-locale': return {}
    case '@deepseek-ai/dsh-client-store': return { defineStore: () => () => ({ open: false }) }
    case '@deepseek-ai/dsh-client-ui-slots': return { defineSlot: () => ({}) }
    default: throw new Error('未预期的 require: ' + name)
  }
}

global.window = {
  __ModuleLoader__: { load({ factory }) { exported = factory(fakeRequire) } },
  document: {
    head: fakeEl(), body: fakeEl(), documentElement: fakeEl(),
    createElement: fakeEl, createTextNode: () => ({}),
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {},
  },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  navigator: { clipboard: { writeText: async () => {} } },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {}, removeEventListener() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
}

new Function('window', 'document', 'localStorage', 'navigator', 'fetch', code)(
  global.window, global.window.document, global.window.localStorage, global.window.navigator,
  async () => ({ ok: false, json: async () => ({}), text: async () => '' }),
)
if (!exported) throw new Error('bundle 未导出')
console.log('✅ bundle 加载成功，导出:', Object.keys(exported).join(', '))

// ---------- apply + 捕获组件 ----------
const registered = {}
const captured = {}
const ctx = {
  effect(fn, name) {
    try { fn() } catch (e) { throw new Error('ctx.effect(' + name + ') 抛错: ' + e.message) }
  },
  locale: { register(ns, dict) { registered[ns] = dict; return () => {} }, bind: () => (k) => k },
  slots: {
    inject(slotName, fn) { fn() },
    register(def, Component) { captured[def.name] = Component; return () => {} },
  },
  store: { define: () => () => ({}) },
}

exported.apply(ctx)
console.log('✅ apply(ctx) 执行成功')
console.log('   捕获组件:', Object.keys(captured).join(', '))

// 词典注册 key 随插件身份变化(browserctl / 带后缀的变体),这里取唯一注册的那个,
// 避免身份不同的副本跑 smoke 时误报「未注册词典」。
const dictKey = Object.keys(registered).find(k => k === 'browserctl' || k.indexOf('browserctl-') === 0) || Object.keys(registered)[0]
const dict = dictKey ? registered[dictKey] : null
if (!dict) throw new Error('未注册浏览器控制词典(registered=' + Object.keys(registered).join(',') + ')')
const zh = dict.zh
const t = (k) => (zh[k] !== undefined ? zh[k] : k)

const Overlay = captured['shell.overlay']
if (!Overlay) throw new Error('未捕获 shell.overlay 组件')

// ---------- 逐页签渲染 ----------
const TABS = ['connect', 'devices', 'totp', 'app', 'push', 'ban', 'log']
const props = {
  useStore: (sel) => sel({ open: true }),
  actions: { open() {}, close() {}, toggle() {} },
  t,
}

let failures = 0
console.log('\n逐页签渲染测试：')
for (const tabId of TABS) {
  // hook #3 是 tab 的 useState
  HOOK_OVERRIDE = { 3: tabId }
  hookIdx = 0
  const out = { tags: {}, text: '' }
  try {
    walk(makeElement(Overlay, props), out, 0)
    const tags = Object.keys(out.tags).length
    const txt = out.text.replace(/\s+/g, ' ').trim()
    console.log(`  ✅ ${tabId.padEnd(8)} 渲染成功  (${tags} 种标签, 文本 ${txt.length} 字)`)
    console.log(`      文本片段: ${txt.slice(0, 130)}`)
  } catch (e) {
    failures++
    console.log(`  ❌ ${tabId.padEnd(8)} 渲染失败: ${e.message}`)
  }
}

HOOK_OVERRIDE = {}
console.log('\n结论:', failures === 0 ? '✅ 全部页签渲染通过' : '❌ ' + failures + ' 个页签失败')
process.exit(failures === 0 ? 0 : 1)
