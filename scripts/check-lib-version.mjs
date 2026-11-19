// 防「bump 后漏 rebuild」(已实锤三次: 1.0.62 / 1.0.64 / 1.0.78→1.0.80):
// 提交进仓库的 lib/client.js 内嵌版本必须与 package.json 一致。
// 放在 CI 的 build 步骤之前 —— 查的是「已提交的产物」,不是刚构建的。
// 零依赖:只读两个文件做字符串比对,不需要 npm ci。
import { readFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
// strip BOM:Windows 上某些编辑器写 UTF8 会带 BOM,JSON.parse 会直接炸
const stripBom = s => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s)
const pkg = JSON.parse(stripBom(readFileSync(new URL('dsh-plugin-browserctl/package.json', root), 'utf8')))
const lib = stripBom(readFileSync(new URL('dsh-plugin-browserctl/lib/client.js', root), 'utf8'))

const m = /var VERSION = true \? "([^"]+)" : "dev";/.exec(lib)
if (!m) {
  console.error('[check-lib-version] lib/client.js 里找不到 VERSION 定义(打包形态变了?)')
  process.exit(1)
}
if (m[1] !== pkg.version) {
  console.error(
    `[check-lib-version] lib 落后: package.json=${pkg.version} lib/client.js=${m[1]}\n` +
    '  先在 dsh-plugin-browserctl/ 跑 node build.mjs,把 lib/ 一起提交再发版。'
  )
  process.exit(1)
}
console.log(`[check-lib-version] lib 与 package.json 版本一致: ${m[1]}`)
