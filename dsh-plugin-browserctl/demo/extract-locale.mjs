// 从 locale/zh.json 的 panel 段生成 demo/locale.zh.js（演示壳 t() 的数据源）。
// 历史：曾从构建产物 lib/client.js 里抓 'zh: {' 内联对象；2026-11-24 起面板文案
// 抽到 locale/{zh,en}.json、esbuild 以 import 方式内联，bundle 里不再出现
// 'zh: {' 字面量（旧抓法会直接抛「未找到」）。改为直读源 JSON，与构建严格同源。
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const zh = JSON.parse(readFileSync(path.join(here, '..', 'locale', 'zh.json'), 'utf8'))
const obj = zh.panel
if (!obj || !obj.sigTitle) throw new Error('locale/zh.json 缺 panel 段或 sigTitle 键')
writeFileSync(path.join(here, 'locale.zh.js'), 'export default ' + JSON.stringify(obj, null, 2) + ';\n', 'utf8')
console.log('extracted zh keys:', Object.keys(obj).length)
