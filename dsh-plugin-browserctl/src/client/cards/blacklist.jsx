// ---------- IP 黑名单卡 ----------
// 纯搬移自 client.jsx,零逻辑改动。

import { useState, useEffect } from 'react'
import { API_P } from '../const.js'
import { Svg } from '../icons.jsx'
import { Button } from '../ui.jsx'

export function BlacklistCard({ t, reloadToken, disabled }) {
  const [open, setOpen] = useState(true) // 独立页签内默认展开
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const anyBusy = disabled || busy
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl-gate/blacklist', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => { if (alive) setData(Array.isArray(j.blacklist) ? j.blacklist : []) })
      .catch(() => { if (alive) setData([]) })
    return () => { alive = false }
  }, [reloadToken])
  const list = data || []
  async function unban(ip) {
    setBusy(true)
    try {
      // 本地面板无 bc-gate cookie + DSH 排空请求体:闸机端点失败时回退插件本地端点(查询串参数)
      let r = await fetch(API_P + '/browserctl-gate/blacklist/remove', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ip }),
      }).catch(() => null)
      if (!r || !r.ok) {
        r = await fetch(API_P + '/browserctl/api/blacklist-remove?ip=' + encodeURIComponent(ip), { cache: 'no-store' })
          .catch(() => null)
      }
      if (r && r.ok) setData(d => (d || []).filter(x => x.ip !== ip))
    } catch {} finally {
      setBusy(false)
    }
  }
  return (
    <div className="dshBrowserCtlCard" data-busy={anyBusy ? 'true' : 'false'}>
      <button type="button" className="dshBrowserCtlCardHead" data-open={open ? 'true' : 'false'} onClick={() => setOpen(o => !o)}>
        {Svg.shield}
        <span>{t('banTitle')}</span>
        <span className="dshBrowserCtlCardStat" style={{ color: list.length ? 'var(--dsw-alias-label-primary,inherit)' : 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {list.length ? list.length + ' 个' : '无'}
        </span>
        <span className="dshBrowserCtlCardArrow" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div className="dshBrowserCtlCardBody" data-open={open}>
        {list.length === 0 ? (
          <div className="dshBrowserCtlDevEmpty">{t('banEmpty')}</div>
        ) : (
          <div className="dshBrowserCtlBanBody">
            {list.map((r, i) => (
              <div key={i} className="dshBrowserCtlBanRow">
                <span className="dshBrowserCtlBanInfo" title={r.ip}>
                  <span style={{ color: 'var(--dsw-alias-label-primary,inherit)', fontWeight: 500 }}>{r.name || 'unknown'}</span>
                  {' '}
                  <span style={{ color: 'var(--dsw-alias-label-secondary,#a6aab2)' }}>{r.ip}</span>
                  <span className="dshBrowserCtlBanReason">{r.reason ? ' · ' + r.reason : ''}</span>
                </span>
                <Button variant="ghost" size="sm" disabled={anyBusy} onClick={() => unban(r.ip)}>解禁</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}