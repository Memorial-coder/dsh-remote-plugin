// ---------- 设备动作 util(B1 双通道统一) ----------
// kickViaGate/banViaGate:闸机端点优先 + host 兜底 + 8s 超时 + 1.2s/2.5s 补拉。
// 独立于 fmt.js:语义是「动作」不是「格式化」,避免两类 util 混居。
import { API_P } from './const.js'

/* ---------- kick 双通道统一(B1,2026-11-26) ----------
   此前「闸机 /kick 优先 + host /api/totp-kick 兜底」在 4 处各写一份(设备踢/拉黑、
   App 解除配对、签名撤销/去重),还有一处 TotpCard.kick() 死代码。统一为一个 action util:
   - 本地面板 DSH 排空请求体 + 无 bc-gate cookie:闸机端点失败回退插件本地端点(查询串参数);
   - 8s 超时防挂起(闸机偶尔持锁做 SSH 清理,第一个 fetch 长时间不回,App 配对卡实测踩过);
   - 成功后按 1.2s/2.5s 节奏补拉 onKicked(闸机直调返回时已落盘,1.2s 重拉确认;走 state
     队列兜底时巡检 ≤2s 才消费,2.5s 再确认一次)。
   黑名单「闸机优先 + host 兜底」同理抽成 banViaGate,成对保留。 */
export async function kickViaGate({ dev, purge, onKicked, timeoutMs = 8000 }) {
  const payload = {}
  if (dev) payload.dev = dev
  if (purge) payload.purge = 1
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  let r = null
  try {
    r = await fetch(API_P + '/browserctl-gate/kick' + (dev ? '' : '-all'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ac.signal,
    })
  } catch (e) { r = null }
  clearTimeout(timer)
  if (!(r && r.ok)) {
    const q = dev ? '?dev=' + encodeURIComponent(dev) : ''
    r = await fetch(API_P + '/browserctl/api/totp-kick' + q, { cache: 'no-store' }).catch(() => null)
  }
  if (r && r.ok && onKicked) { setTimeout(onKicked, 1200); setTimeout(onKicked, 2500) }
  return r
}

export async function banViaGate({ dev, ip, name, reason }) {
  let r = await fetch(API_P + '/browserctl-gate/blacklist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ dev, ip, name: name || '未知', reason: reason || '管理员封禁' }),
  }).catch(() => null)
  if (r && r.ok) return r
  const q = new URLSearchParams({ dev: dev || '', ip: ip || '', name: name || '未知', reason: reason || '管理员封禁' }).toString()
  return await fetch(API_P + '/browserctl/api/blacklist-add?' + q, { cache: 'no-store' }).catch(() => null)
}