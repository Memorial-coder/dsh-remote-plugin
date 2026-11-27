// ---------- iOS / 无 App 设备网页绑定引导(2026-11-27 用户反馈:升为标准卡片) ----------
// 沿革:曾是「面板上的裸折叠行」(chevron 分隔行,不加框)——hover 高亮带通到面板
// 边缘、四角自己露方,用户拍板「和上面似的套一个框」→ 升为标准卡片(Card 折叠头 +
// CardBody),与连接页其它卡片同构,裸行专用的 FoldFree 修饰类随之删除。
// 逻辑零改动:2026-11-17 起不再生成 PWA 引导链接,无 App 设备走「官网 + 长期码」绑定。

import { useState } from 'react'
import { ABOUT_LINKS } from '../const.js'
import { useToast } from '../hooks.js'
import { Button } from '../ui.jsx'

export function IosGuideCard({ t }) {
  const [open, setOpen] = useState(false) // 默认收起
  const [copied, setCopied] = useToast(1600) // B1 useToast
  const site = ABOUT_LINKS.website
  return (
    <div className="dshBrowserCtlCard">
      <button
        type="button"
        className="dshBrowserCtlCardHead"
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen(o => !o)}
      >
        <span aria-hidden="true" style={{ display: 'inline-flex', flex: 'none', color: 'var(--dsw-alias-label-tertiary,#8b8f98)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s ease' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>{t('linkTitle')}</span>
        <span className="dshBrowserCtlCardStat" style={{ fontWeight: 400, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>{t('linkWebTag')}</span>
      </button>
      {open && (
        <div className="dshBrowserCtlCardBody" data-open="true">
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
    </div>
  )
}
