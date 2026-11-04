// 从构建产物 lib/client.js 提取 zh 文案对象（字符串感知的大括号匹配），
// 写成 demo/locale.zh.js，供演示壳的 t() 使用。跑在 node 上，不依赖 React。
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const src = readFileSync(path.join(here, '..', 'lib', 'client.js'), 'utf8')
const start = src.indexOf('zh: {')
if (start < 0) throw new Error('zh: { 未在 lib/client.js 中找到')

let i = start + 4 // 指向 '{'
let depth = 0
let inStr = null
let out = ''
while (i < src.length) {
  const c = src[i]
  if (inStr) {
    out += c
    if (c === '\\') { out += src[i + 1] || ''; i += 2; continue }
    if (c === inStr) inStr = null
    i++; continue
  }
  if (c === '"' || c === "'") { inStr = c; out += c; i++; continue }
  if (c === '{') { depth++; out += c; i++; continue }
  if (c === '}') {
    depth--
    out += c
    if (depth === 0) break
    i++; continue
  }
  out += c; i++
}

const obj = new Function('return (' + out + ')')()
writeFileSync(path.join(here, 'locale.zh.js'), 'export default ' + JSON.stringify(obj, null, 2) + ';\n', 'utf8')
console.log('extracted zh keys:', Object.keys(obj).length)
