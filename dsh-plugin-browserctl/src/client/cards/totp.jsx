// ---------- 2FA(TOTP)卡 ----------
// 纯搬移自 client.jsx,零逻辑改动。MS_AUTHENTICATOR_URL 指验证器官方下载页。

import { useState, useEffect } from 'react'
import { MS_AUTHENTICATOR_URL, API_P } from '../const.js'
import { kickViaGate } from '../actions.js'
import { useToast } from '../hooks.js'
import { Svg } from '../icons.jsx'
import { Button } from '../ui.jsx'

export function TotpCard({ t, reloadToken, onRefresh, disabled }) {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(true) // 独立页签内默认展开
  const anyBusy = disabled || busy
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl/api/totp', { cache: 'no-store' })
      .then(r => r.text().then(tx => { try { return JSON.parse(tx) } catch { return { error: 'HTTP ' + r.status } } }))
      .then(j => { if (alive) setData(j) })
      .catch(() => {})
    return () => { alive = false }
  }, [reloadToken])

  async function toggle(enable, reset) {
    setBusy(true)
    try {
      // DSH webServer 排空请求体:参数走查询串
      const q = new URLSearchParams({ enabled: enable ? '1' : '0', reset: reset ? '1' : '0' }).toString()
      const r = await fetch(API_P + '/browserctl/api/totp-toggle?' + q, { cache: 'no-store' })
      let j = {}
      try { j = await r.json() } catch { j = { ok: false, error: 'HTTP ' + r.status } }
      if (j.ok) onRefresh()
      else if (j.error) setData(d => ({ ...d, error: j.error }))
    } finally {
      setBusy(false)
    }
  }

  // B1:原 TotpCard.kick() 死代码已删(0 引用,kick 双通道统一走 kickViaGate,见 DevicesSection)

  const sessions = Array.isArray(data?.sessions) ? data.sessions : []
  const status = data
    ? (data.enabled
        ? (sessions.length > 0 ? t('totpOn') + ' · ' + t('devicesOnline').replace('{n}', sessions.length) : t('totpOn'))
        : t('totpOff'))
    : '…'
  const [copiedSecret, setCopiedSecret] = useToast(1600) // B1 useToast

  return (
    <div className="dshBrowserCtlCard">
      <button
        type="button"
        className="dshBrowserCtlCardHead"
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen(o => !o)}
      >
        {Svg.lock}
        <span>{t('totpTitle')}</span>
        <span style={{
          fontWeight: 500,
          fontSize: 12,
          color: data?.enabled ? 'var(--dsw-alias-state-success-primary,#34b371)' : 'var(--dsw-alias-label-tertiary,#8b8f98)',
        }}>{status}</span>
        <span className="dshBrowserCtlCardArrow" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div className="dshBrowserCtlCardBody" data-open={open}>
        <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {t('totpHintShort')}
        </p>
        <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {t('totpAppHint')}{' '}
          <a href={MS_AUTHENTICATOR_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dsw-alias-accent-strong,#4da3ff)' }}>{t('totpAppLink')}</a>
        </p>
        {data?.enabled && data?.svg && (
          <div className="dshBrowserCtlTotpQr">
            <img alt={t('totpBind')} src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data.svg)} />
          </div>
        )}
        {data?.secret && (
          <div className="dshBrowserCtlSecretRow">
            <div className="dshBrowserCtlSecret" title={data.secret}>{t('totpSecretLabel')}: {data.secret}</div>
            <Button variant="ghost" size="sm" onClick={() => {
              navigator.clipboard?.writeText(data.secret).then(() => setCopiedSecret(true)).catch(() => {})
            }}>{copiedSecret ? t('copied') : t('copySecret')}</Button>
          </div>
        )}
        <div className="dshBrowserCtlActions">
          {data?.enabled ? (
            <>
              <Button variant="secondary" size="sm" disabled={anyBusy} onClick={() => toggle(false)}>{t('totpDisable')}</Button>
              <Button variant="secondary" size="sm" disabled={anyBusy} onClick={() => toggle(true, true)}>{t('totpReset')}</Button>
            </>
          ) : (
            <Button variant="primary" size="sm" disabled={anyBusy || !data} onClick={() => toggle(true)}>{t('totpEnable')}</Button>
          )}
        </div>
      </div>
    </div>
  )
}