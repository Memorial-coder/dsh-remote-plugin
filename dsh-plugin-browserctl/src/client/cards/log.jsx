// ---------- 运行日志卡:LOG_ICON/LOG_CAT_OF/LOG_TABS 与闸机 EVENT_CATS 同表(不可改名) ----------
// 纯搬移自 client.jsx,零逻辑改动。

import { useState, useEffect } from 'react'
import { API_P } from '../const.js'
import { fmtAbsolute } from '../fmt.js'
import { Svg } from '../icons.jsx'

const LOG_ICON = { verify: 'check', kick: 'ban', totp: 'lock', ban: 'shield' }

/* ---- 日志行图标(SVG 代替 emoji) ---- */
const LogIcon = ({ typ }) => {
  const props = { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', style: { flex: 'none' } }
  const color = 'currentColor'
  switch (typ) {
    case 'verify':
      return <svg {...props}><circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.2"/><path d="M5 8.5l2 2 4-4.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'kick':
      return <svg {...props}><circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.2"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/></svg>
    case 'totp':
      return <svg {...props}><rect x="4.5" y="7" width="7" height="6" rx="1.5" stroke={color} strokeWidth="1.2"/><path d="M5.5 7V4.5a2.5 2.5 0 015 0V7" stroke={color} strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="9.5" r="1" fill={color}/></svg>
    case 'ban':
      return <svg {...props}><path d="M3 5.5V8c0 2.8 2 5.2 5 6 3-.8 5-3.2 5-6V5.5L8 3l-5 2.5z" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/><path d="M6 8.5l1.5 1.5 3-3" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    default:
      return <span style={{ width: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>·</span>
  }
}

/* ---- 日志分类页签(2026-11-16):行内 cat 字段闸机已随事件写入,旧事件无 cat 时
   由 typ 兜底归类(与闸机 EVENT_CATS 同表)。改这里必须同步闸机 browserctl.py。---- */
const LOG_CAT_OF = {
  verify: 'login', pair: 'pair', kick: 'kick', ban: 'ban', totp: 'totp',
  devbind: 'totp', settings: 'settings', devsig: 'devsig', devsig_sum: 'devsig',
  file_dl: 'sys', error: 'sys',
}
const LOG_TABS = [
  { id: 'all', labelKey: 'logTabAll' },
  { id: 'login', labelKey: 'logTabLogin' },
  { id: 'pair', labelKey: 'logTabPair' },
  { id: 'kick', labelKey: 'logTabKick' },
  { id: 'ban', labelKey: 'logTabBan' },
  { id: 'totp', labelKey: 'logTabTotp' },
  { id: 'devsig', labelKey: 'logTabUnsigned' },
  { id: 'settings', labelKey: 'logTabSettings' },
  { id: 'sys', labelKey: 'logTabSys' },
]

export function LogCard({ t, reloadToken }) {
  const [open, setOpen] = useState(true) // 独立页签内默认展开
  const [events, setEvents] = useState(null)
  const [cat, setCat] = useState('all')
  useEffect(() => {
    let alive = true
    // 优先闸机端点(公网面板同源可达,无需 DSH 重启);本机直开面板回退到插件 API。
    fetch(API_P + '/browserctl-gate/events', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(j => { if (alive) setEvents(Array.isArray(j.events) ? j.events : []) })
      .catch(() => fetch(API_P + '/browserctl/api/totp', { cache: 'no-store' })
        .then(r => r.json())
        .then(j => { if (alive) setEvents(Array.isArray(j.events) ? j.events : []) })
        .catch(() => { if (alive) setEvents([]) }))
    return () => { alive = false }
  }, [reloadToken])
  const catOf = e => (e && e.cat) || LOG_CAT_OF[e && e.typ] || 'other'
  const counts = {}
  for (const e of events || []) {
    const c = catOf(e)
    counts[c] = (counts[c] || 0) + 1
  }
  const list = (events || [])
    .filter(e => cat === 'all' || catOf(e) === cat)
    .slice()
    .reverse()

  return (
    <div className="dshBrowserCtlCard">
      <button
        type="button"
        className="dshBrowserCtlCardHead"
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen(o => !o)}
      >
        {Svg.clip}
        <span>{t('logTitle')}</span>
        <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {(events || []).length ? t('logCount').replace('{n}', String((events || []).length)) : t('logNone')}
        </span>
        <span className="dshBrowserCtlCardArrow" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div className="dshBrowserCtlCardBody" data-open={open}>
        {/* 分类页签:全部/登录/配对/踢出/黑名单/2FA/无签名/设置/系统 */}
        <div className="dshBrowserCtlLogTabs" role="tablist">
          {LOG_TABS.map(tab => {
            const n = tab.id === 'all' ? (events || []).length : (counts[tab.id] || 0)
            if (tab.id !== 'all' && !n) return null
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={cat === tab.id}
                className="dshBrowserCtlLogTab"
                data-on={cat === tab.id ? 'true' : 'false'}
                onClick={() => setCat(tab.id)}
              >
                {t(tab.labelKey)}
                {n ? <span className="dshBrowserCtlLogTabN">{n > 99 ? '99+' : n}</span> : null}
              </button>
            )
          })}
        </div>
        {list.length === 0 ? (
          <div className="dshBrowserCtlDevEmpty">{t('logEmpty')}</div>
        ) : (
          <div className="dshBrowserCtlLogBody" data-cat={cat}>
            {list.map((e, i) => (
              <div key={i} className="dshBrowserCtlLogRow">
                <span className="dshBrowserCtlLogType"><LogIcon typ={e.typ} /></span>
                <span className="dshBrowserCtlLogMsg" title={e.msg || ''}>{e.msg || ''}</span>
                <span className="dshBrowserCtlLogTime">{fmtAbsolute(e.t, 'clock')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}