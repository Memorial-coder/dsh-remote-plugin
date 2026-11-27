// ---------- 共享 hooks + 平台名格式化 ----------
// useToast(2.2s 行内反馈)/useQr(配对码+隧道自愈轮询)/useCountdown(秒倒数),
// fmtPlatform(UA→平台名,纯函数)。分层:const → hooks(只向下引用)。
import { useState, useEffect, useRef } from 'react'
import { API_P } from './const.js'

// ---------- 行内反馈统一(B1:5 套手写收敛为一个 toast hook) ----------
// 默认 2.2s 自动消失(kb/10 #2 口径),可传时长(copied 类 1.6s、App 配对卡 2.4s);
// 值可以是字符串或 {text, ok} 对象,null = 不显示。各卡就地替换原 useState+定时
// useEffect,渲染位不动。主面板 BrowserCtlOverlay 的 copied 保持原样(hook 索引 3 是
// smoke.cjs 的 tab 定位点,不可动,见测试注释)。
export function useToast(ms) {
  const [toast, setToast] = useState(null)
  const ttl = ms || 2200
  useEffect(() => {
    if (toast === null || toast === false || toast === '') return
    const id = setTimeout(() => setToast(null), ttl)
    return () => clearTimeout(id)
  }, [toast, ttl])
  return [toast, setToast]
}

export function useQr(open, reloadToken, uses) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [expiresAt, setExpiresAt] = useState(0) // >0 表示一次性配对,按秒倒数
  const [status, setStatus] = useState(null)    // { uses, remaining } 配对码剩余次数
  const [retrying, setRetrying] = useState(false) // 隧道自愈中,正在自动重试(不需要用户再点一次)
  const [refreshTick, setRefreshTick] = useState(0)
  const usesRef = useRef(uses)
  usesRef.current = uses || 1
  // 生成配对码(闸机不可达时回退长期链接)
  // ★ 自动重试(2026-11-07):闸机在「frpc 正在启动 / 看门狗重拉 / claim 换端口」的头几秒里
  //   会回 503 + tunnel.pending=true。旧代码只请求一次,失败就把红字钉死在二维码位置,
  //   必须再点一次「开始控制」才能恢复 —— 这就是用户说的"还要再点一次"。
  //   现在遇到隧道类瞬时失败会自动轮询(1.5s × 30 ≈ 45s),隧道一就绪立刻出二维码;
  //   只有真正的硬失败(闸机没启动 / 路由没加载)才立刻放弃,把「开始控制」留给用户。
  useEffect(() => {
    if (!open) return
    let alive = true
    let timer = null
    let tries = 0
    const MAX_TRIES = 30
    setError(null)
    setRetrying(false)
    // 返回 { ok, retryable, error }:retryable = 隧道还没就绪但在自愈中,值得再等一会儿
    async function load() {
      try {
        const r = await fetch(API_P + '/browserctl/api/pair?uses=' + usesRef.current, { method: 'POST', cache: 'no-store' })
        const tx = await r.text()
        let j
        try { j = JSON.parse(tx) } catch { return { ok: false, retryable: false, error: '路由未加载(HTTP ' + r.status + ');请重启 DSH 后重试' } }
        if (!alive) return { ok: false, retryable: false }
        if (j.error) {
          // 带 tunnel 字段 = 被隧道门禁拦下的(隧道还没就绪 / 正在自愈):属于瞬时态
          return { ok: false, retryable: !!(j.tunnel && j.tunnel.ok === false), error: j.error }
        }
        setError(null)
        setData(j)
        setStatus({ uses: j.uses || 1, remaining: j.remaining || 1 })
        setExpiresAt(Date.now() + (j.ttl || 60) * 1000)
        return { ok: true }
      } catch (e1) {
        // 配对码端点不可用(老闸机/请求被拒)→ 回退长期链接
        try {
          const r2 = await fetch(API_P + '/browserctl/api/qr', { cache: 'no-store' })
          const tx2 = await r2.text()
          let j2
          try { j2 = JSON.parse(tx2) } catch { return { ok: false, retryable: false, error: '路由未加载(HTTP ' + r2.status + ');请重启 DSH 后重试' } }
          if (!alive) return { ok: false, retryable: false }
          if (j2.error) {
            return { ok: false, retryable: !!(j2.tunnel && j2.tunnel.ok === false), error: j2.error }
          }
          setError(null)
          setData(j2)
          setExpiresAt(0)
          return { ok: true }
        } catch (e2) {
          if (!alive) return { ok: false, retryable: false }
          return { ok: false, retryable: false, error: String((e2 && e2.message) || e2) }
        }
      }
    }
    async function loop() {
      const res = await load()
      if (!alive) return
      if (res.ok) { setRetrying(false); return }
      // 清掉旧二维码,让"开始控制"按钮出现,避免停止后只剩"停止控制"卡死
      setData(null)
      setError(res.error || null)
      if (!res.retryable || tries >= MAX_TRIES) {
        if (res.retryable) {
          setError((res.error || '') + '\n隧道仍在自愈中,等待超时;可再点一次「开始控制」重试。')
        }
        setRetrying(false)
        return
      }
      tries += 1
      setRetrying(true)
      timer = setTimeout(loop, 1500)
    }
    loop()
    return () => { alive = false; if (timer) clearTimeout(timer) }
  }, [open, reloadToken, refreshTick, uses])
  // 轮询配对码状态:检测到有人扫码(剩余次数减少)→ 用尽自动换码
  useEffect(() => {
    if (!open || !data || !data.grant) return
    let alive = true
    const tick = async () => {
      try {
        const r = await fetch(API_P + '/browserctl/api/pair-status?g=' + encodeURIComponent(data.grant), { cache: 'no-store' })
        const j = await r.json()
        if (!alive || !j || !j.ok) return
        const remaining = j.exists ? (j.remaining | 0) : 0
        setStatus({ uses: j.uses || data.uses || 1, remaining })
        if (remaining <= 0) setRefreshTick(x => x + 1) // 用尽(或一次性码被扫)→ 自动换新码
      } catch {}
    }
    tick()
    const id = setInterval(tick, 1500)
    return () => { alive = false; clearInterval(id) }
  }, [open, data])
  return { data, error, expiresAt, status, retrying, refresh: () => setRefreshTick(x => x + 1) }
}

export function useCountdown(expiresAt) {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (!expiresAt) { setLeft(0); return }
    const tick = () => setLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  return left
}

export function fmtPlatform(ua) {
  const u = (ua || '').toLowerCase()
  if (!u) return 'unknown'
  if (/iphone|ipad|ios/.test(u)) return 'iOS'
  if (/android/.test(u)) return 'Android'
  if (/windows|win64|win32/.test(u)) return 'Windows'
  if (/macintosh|mac os/.test(u)) return 'macOS'
  if (/linux/.test(u)) return 'Linux'
  if (/curl|wget|python|httpclient|okhttp/.test(u)) return '脚本/API'
  return '浏览器'
}