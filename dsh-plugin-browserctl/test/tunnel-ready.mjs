/* tunnel-ready 回归测试:host 半 tunnelReady() 的「按日志自愈」与 pending 语义。

   背景(2026-11-07 用户反馈):正式版插件偶发显示「隧道未建立:frpc 正在启动,
   等待端口注册到 frps…」,必须再点一次「开始控制」才恢复。根因是闸机侧一次
   frpc 重复拉起让 state 里的 tunnel_ok 变成 false,而插件端只读 state 不复核
   日志、前端也不重试。修法:
     1) 闸机:frpc pid 立刻落盘 + 看门狗重拉串行化 + already-exists 自愈;
     2) 插件 host:frpc 活着且日志最后一条 start proxy success 的端口等于
        remote_port 时,自己判定就绪并回写 state;
     3) 插件 client:隧道类瞬时失败自动轮询重试。

   本测试用临时目录伪造 browserctl_state.json / browserctl_frpc.log,不碰真实
   运行态,直接跑打包产物 lib/index.js。

   用法:node test/tunnel-ready.mjs [bundlePath]   (默认 ../lib/index.js)
*/
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const bundlePath = process.argv[2] || path.join(here, '..', 'lib', 'index.js')

const dir = mkdtempSync(path.join(tmpdir(), 'bc-tunnel-'))
writeFileSync(path.join(dir, 'browserctl.py'), '# stub\n')
process.env.BROWSERCTL_HOME = dir

const { tunnelReady } = await import(pathToFileURL(path.resolve(bundlePath)).href)
if (typeof tunnelReady !== 'function') throw new Error('lib/index.js 未导出 tunnelReady')

function setup(state, logText) {
  writeFileSync(path.join(dir, 'browserctl_state.json'), JSON.stringify(state, null, 2))
  writeFileSync(path.join(dir, 'browserctl_frpc.log'), logText || '')
}

const LIVE = process.pid // 当前进程一定活着,可当"存活 pid"用
const DEAD = 999999      // 足够大,一定不存在
let bad = 0
function check(label, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) bad++
  console.log((ok ? 'PASS ' : 'FAIL ') + label + '  got=' + JSON.stringify(got) +
              (ok ? '' : '  want=' + JSON.stringify(want)))
}

const successLine = '2026/11/07 10:07:15 [dsh_web_17090] start proxy success\n'

// 1) state 说没就绪,但 frpc 活着 + 日志最后成功端口 == remote_port → 应判就绪(自愈核心)
setup({ remote_port: 17090, frpc_pid: LIVE, tunnel_ok: false,
        tunnel_error: 'frpc 正在启动,等待端口注册到 frps…' }, successLine)
check('self-heal -> ok', tunnelReady().ok, true)

// 2) 自愈要顺手把 state 修正回来,否则下一条路由还是读到旧值
const after = JSON.parse(readFileSync(path.join(dir, 'browserctl_state.json'), 'utf8'))
check('self-heal wrote tunnel_ok', after.tunnel_ok, true)
check('self-heal cleared tunnel_error', after.tunnel_error, '')

// 3) 日志里的成功端口与 remote_port 不一致 → 绝不能自愈(那是旧端口的残留 frpc)
setup({ remote_port: 17090, frpc_pid: LIVE, tunnel_ok: false,
        tunnel_error: 'frpc 正在启动,等待端口注册到 frps…' },
      '2026/11/07 10:00:00 [dsh_web_18000] start proxy success\n')
let r = tunnelReady()
check('port mismatch -> not ok', r.ok, false)
check('port mismatch -> pending(进程活着)', r.tunnel.pending, true)

// 4) frpc 死了 + 瞬时态文案 → ok=false 且 pending=true(等看门狗重拉,前端该重试)
setup({ remote_port: 17090, frpc_pid: DEAD, tunnel_ok: false,
        tunnel_error: 'frpc 进程不存在,看门狗正在重拉' }, '')
r = tunnelReady()
check('dead frpc -> not ok', r.ok, false)
check('dead frpc -> pending(自愈文案)', r.tunnel.pending, true)

// 5) 硬失败文案 + frpc 死 → pending=false(前端立即报错,不要空转 45 秒)
setup({ remote_port: 17090, frpc_pid: DEAD, tunnel_ok: false,
        tunnel_error: 'frps 拒绝连接:token 无效' }, '')
r = tunnelReady()
check('hard fail -> not ok', r.ok, false)
check('hard fail -> not pending', r.tunnel.pending, false)

// 6) tunnel_ok=true 就是就绪(不必再读日志)
setup({ remote_port: 17090, frpc_pid: DEAD, tunnel_ok: true, tunnel_error: '' }, '')
check('flag true -> ok', tunnelReady().ok, true)

// 7) 旧闸机(没有 tunnel_ok 字段)+ pid 活着 → 兼容判就绪
setup({ remote_port: 17090, frpc_pid: LIVE }, successLine)
check('legacy alive -> ok', tunnelReady().ok, true)

console.log(bad === 0 ? '\n结论: 全部通过' : '\n结论: ' + bad + ' 项失败')
process.exit(bad === 0 ? 0 : 1)
