// ---------- 主机遥测卡(CPU/内存/磁盘;闸机 10s 缓存) ----------
// 纯搬移自 client.jsx,零逻辑改动。

import { useState, useEffect } from 'react'
import { API_P } from '../const.js'
import { Svg } from '../icons.jsx'
import { Button } from '../ui.jsx'

/* ---------- 批次1-A5:主机遥测(CPU/内存/磁盘;闸机 10s 缓存) ---------- */
export function SysinfoCard({ t }) {
  const [d, setD] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl/api/sysinfo', { cache: 'no-store' })
      .then(r => r.json().catch(() => ({})))
      .then(j => {
        if (!alive) return
        setD(j && j.sysinfo ? j.sysinfo : { ok: false, error: j && j.error })
      })
      .catch(() => { if (alive) setD({ ok: false }) })
    return () => { alive = false }
  }, [])
  function load() {
    setBusy(true)
    fetch(API_P + '/browserctl/api/sysinfo', { cache: 'no-store' })
      .then(r => r.json().catch(() => ({})))
      .then(j => { setD(j && j.sysinfo ? j.sysinfo : { ok: false, error: j && j.error }); setBusy(false) })
      .catch(() => { setD({ ok: false }); setBusy(false) })
  }
  function fmtGB(bytes) {
    const g = (Number(bytes) || 0) / 1073741824
    return g >= 10 ? g.toFixed(0) + ' GB' : g.toFixed(1) + ' GB'
  }
  function bar(label, pct, txt) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: '0 0 40px', fontSize: 12, fontWeight: 600, color: 'var(--dsw-alias-label-secondary,#6b7078)' }}>{label}</span>
        <span style={{ flex: '1 1 auto', minWidth: 40, height: 6, borderRadius: 3, background: 'var(--dsw-alias-fill-tertiary,rgba(127,127,127,.2))', overflow: 'hidden', display: 'block' }}>
          <span style={{ display: 'block', height: '100%', width: pct + '%', borderRadius: 3, background: 'var(--dsw-alias-brand-primary,#5b8cff)' }} />
        </span>
        <span style={{ flex: '0 0 auto', fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary,#8b8f98)', whiteSpace: 'nowrap' }}>{txt}</span>
      </div>
    )
  }
  const ok = !!(d && d.ok)
  const memPct = ok && Number(d.memTotal) > 0
    ? Math.max(0, Math.min(100, Math.round((1 - Number(d.memFree) / Number(d.memTotal)) * 100)))
    : 0
  const disks = ok && Array.isArray(d.disks) ? d.disks : []
  return (
    <div className="dshBrowserCtlCard">
      <div className="dshBrowserCtlCardHead" data-open="true" style={{ cursor: 'default' }}>
        {Svg.desk}
        <span>{t('sysTitle')}</span>
        <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {ok ? (Number(d.cpu) || 0) + '% CPU' : t('sysFail')}
        </span>
      </div>
      <div className="dshBrowserCtlCardBody" data-open="true">
        {!ok ? (
          <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-state-error-primary,#e5655c)' }}>
            {(d && d.error) || t('sysFail')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {bar('CPU', Math.max(0, Math.min(100, Number(d.cpu) || 0)), (Number(d.cpu) || 0) + '%')}
            {bar(t('sysMem'), memPct, memPct + '% · ' + t('sysFree') + ' ' + fmtGB(Number(d.memFree) * 1024))}
            {disks.slice(0, 4).map(dk => {
              const total = Number(dk && dk.size) || 0
              const free = Number(dk && dk.free) || 0
              if (total <= 0) return null
              const p = Math.max(0, Math.min(100, Math.round((1 - free / total) * 100)))
              return <div key={dk.drive}>{bar(String(dk.drive || '?'), p, t('sysFree') + ' ' + fmtGB(free))}</div>
            })}
          </div>
        )}
        <div className="dshBrowserCtlActions">
          <Button variant="secondary" size="sm" disabled={busy} onClick={load}>
            {busy ? t('pushRefreshing') : t('pushRefresh')}
          </Button>
        </div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {t('sysHint')}
        </p>
      </div>
    </div>
  )
}