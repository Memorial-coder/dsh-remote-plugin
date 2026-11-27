// ---------- 长期配对码分段(连接页「扫码连接」卡的「长期码」段) ----------
// B2 迁移:原 AppPairCard 的长期码 QR 逻辑(生成/1.5s pair-status 轮询/用尽自动换码)
// 整体迁入连接页分段切换,接口契约(/api/pair-long + /api/pair-status)零改动。
// 已配对手机列表已迁往设备 tab「已配对手机」分区(见 cards/devices.jsx)。
// 轮询纪律:本组件只在「长期码」段激活时挂载,因此 pair-long 的 pair-status
// 只轮询当前激活段;临时码段由 useQr 自己的 1.5s 轮询负责(跨 tab 常跑红线)。
// 两个 grant 的轮询保持各自独立请求——host 无聚合端点,不许合并成一次。

import { useState, useEffect } from 'react'
import { API_P } from '../const.js'
import { useToast } from '../hooks.js'
import { Button } from '../ui.jsx'

export function PairLongSegment({ t, reloadToken }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useToast(1600)   // B1 useToast

  async function load() {
    setLoading(true)
    try {
      const r = await fetch(API_P + '/browserctl/api/pair-long', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setData({ error: (j && j.error) || ('HTTP ' + r.status) })
        return
      }
      if (!j.url || !j.svg) {
        setData({ error: (j && j.error) || t('pairLongIncomplete') })
        return
      }
      setData(j)
    } catch (e) {
      setData({ error: String((e && e.message) || e) })
    } finally {
      setLoading(false)
    }
  }

  // 轮询长期配对码状态:检测到有人扫码(剩余次数用尽) → 自动换新码(1.5s 节奏原样)
  useEffect(() => {
    if (!data || !data.grant) return
    let alive = true
    const tick = async () => {
      try {
        const r = await fetch(API_P + '/browserctl/api/pair-status?g=' + encodeURIComponent(data.grant), { cache: 'no-store' })
        const j = await r.json()
        if (!alive || !j || !j.ok) return
        const remaining = j.exists ? (j.remaining | 0) : 0
        if (remaining <= 0) load()
      } catch {}
    }
    tick()
    const id = setInterval(tick, 1500)
    return () => { alive = false; clearInterval(id) }
  }, [data])

  useEffect(() => { load() }, [reloadToken])

  const ok = !!(data && data.url && !data.error)

  return (
    <>
      {ok ? (
        <>
          <div className="dshBrowserCtlQrBox">
            {data.svg
              ? <img alt={t('appQrAlt')} src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data.svg)} />
              : <span style={{ color: '#666', fontSize: 12 }}>{t('appNoQr')}</span>}
          </div>
          <p className="dshBrowserCtlCardDesc" style={{ textAlign: 'center' }}>{t('appOnceHint')}</p>
          <div className="dshBrowserCtlUrlRow">
            <div className="dshBrowserCtlUrl" title={data.url}>{data.url}</div>
            <Button variant="ghost" size="sm" onClick={() => {
              navigator.clipboard?.writeText(data.url).then(() => setCopied(true)).catch(() => {})
            }}>{copied ? t('copied') : t('appCopyLink')}</Button>
          </div>
        </>
      ) : (
        <div className="dshBrowserCtlQrBox" style={{ height: 120 }}>
          <span style={{ color: '#666', fontSize: 12, padding: '0 14px', textAlign: 'center' }}>
            {loading ? t('appLoading') : (data && data.error) || t('appNoQr')}
          </span>
        </div>
      )}
      <div className="dshBrowserCtlActions">
        <Button variant="secondary" size="sm" disabled={loading} onClick={load}>
          {loading ? '…' : t('appRefresh')}
        </Button>
      </div>
    </>
  )
}
