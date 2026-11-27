// ---------- iOS / 无 App 设备网页绑定引导(B2 折叠行版,对照 P1) ----------
// 从「独立卡片」降级为「chevron 分隔行」:展开后直接是行,不加框(mockup P7 口径)。
// 逻辑零改动:2026-11-17 起不再生成 PWA 引导链接,无 App 设备走「官网 + 长期码」绑定。

import { useState } from 'react'
import { ABOUT_LINKS } from '../const.js'
import { useToast } from '../hooks.js'
import { Button } from '../ui.jsx'

export function IosGuideCard({ t }) {
  const [open, setOpen] = useState(false) // 默认收起(P1 折叠行口径)
  const [copied, setCopied] = useToast(1600) // B1 useToast
  const site = ABOUT_LINKS.website
  return (
    <>
      <button
        type="button"
        className="dshBrowserCtlCardHead dshBrowserCtlFoldBtn"
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen(o => !o)}
      >
        <span aria-hidden="true" style={{ display: 'inline-flex', flex: 'none', color: 'var(--dsw-alias-label-tertiary,#8b8f98)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s ease' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{t('linkTitle')}</span>
        <span className="dshBrowserCtlCardStat" style={{ fontWeight: 400, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>{t('linkWebTag')}</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 2px 4px' }}>
          <p className="dshBrowserCtlCardDesc">{t('linkSubtitle')}</p>
          <div className="dshBrowserCtlUrlRow" style={{ gap: 8 }}>
            <div className="dshBrowserCtlUrl" title={site}>{site}</div>
            <Button variant="ghost" size="sm" onClick={() => {
              navigator.clipboard?.writeText(site).then(() => setCopied(true)).catch(() => {})
            }}>{copied ? t('linkCopied') : t('linkCopy')}</Button>
            <Button variant="secondary" size="sm" onClick={() => window.open(site, '_blank', 'noopener')}>
              {t('linkOpenSite')}
            </Button>
          </div>
          <p className="dshBrowserCtlCardDesc" style={{ fontWeight: 500, color: 'var(--dsw-alias-label-secondary,#a6aab2)' }}>{t('linkStepsTitle')}</p>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
            <li>{t('linkStep1')}</li>
            <li>{t('linkStep2')}</li>
            <li>{t('linkStep3')}</li>
            <li>{t('linkStep4')}</li>
          </ol>
          <p className="dshBrowserCtlCardDesc">{t('linkNote')}</p>
        </div>
      )}
    </>
  )
}
