// ---------- 会话有效期卡(闸机 /session-days) ----------
// 纯搬移自 client.jsx,零逻辑改动。

import { useState, useEffect } from 'react'
import { API_P } from '../const.js'
import { Svg } from '../icons.jsx'
import { Button } from '../ui.jsx'

/* ---------- 批次1-C2:会话有效期(1-365 天,默认 30;闸机 /session-days) ---------- */
export function SessionDaysCard({ t, disabled }) {
  const [days, setDays] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl/api/session-days', { cache: 'no-store' })
      .then(r => r.json().catch(() => ({})))
      .then(j => {
        if (!alive) return
        if (j && j.ok) setDays(j.session_days)
        else setErr((j && j.error) || t('sdLoadFail'))
      })
      .catch(() => { if (alive) setErr(t('sdLoadFail')) })
    return () => { alive = false }
  }, [])
  async function pick(n) {
    if (disabled || busy || n === days) return
    setBusy(true); setErr('')
    try {
      const r = await fetch(API_P + '/browserctl/api/session-days?days=' + n, { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (j && j.ok) setDays(j.session_days)
      else setErr((j && j.error) || t('sdSaveFail'))
    } catch (e) {
      setErr(t('sdSaveFail'))
    } finally {
      setBusy(false)
    }
  }
  const opts = [1, 7, 30]
  return (
    <div className="dshBrowserCtlCard">
      <div className="dshBrowserCtlCardHead" data-open="true" style={{ cursor: 'default' }}>
        {Svg.lock}
        <span>{t('sdTitle')}</span>
        <span style={{
          fontWeight: 500, fontSize: 12,
          color: 'var(--dsw-alias-label-tertiary,#8b8f98)',
        }}>{days ? t('sdCurrent').replace('{n}', days) : t('sdLoading')}</span>
      </div>
      <div className="dshBrowserCtlCardBody" data-open="true">
        <div className="dshBrowserCtlActions">
          {opts.map(n => (
            <Button key={n} variant={days === n ? 'primary' : 'secondary'} size="sm"
              disabled={disabled || busy} onClick={() => pick(n)}>
              {n === 1 ? t('sdDay1') : n === 7 ? t('sdDay7') : t('sdDay30')}
            </Button>
          ))}
        </div>
        {err && (
          <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-state-error-primary,#e5655c)' }}>{err}</p>
        )}
        <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {t('sdHint')}
        </p>
      </div>
    </div>
  )
}