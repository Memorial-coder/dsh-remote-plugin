// ---------- 「关于」面板 + 用户协议/隐私政策弹窗 ----------
// 纯搬移自 client.jsx,零逻辑改动。LEGAL_* 文档本体在 ../legal.js(零依赖数据层)。

import { useState } from 'react'
import { IS_TEST, VERSION, ABOUT_LINKS, PLUGIN_ADD_CMD, API_P } from '../const.js'
import { LEGAL_VERSION, LEGAL_EFFECTIVE, LEGAL_TERMS, LEGAL_PRIVACY } from '../legal.js'
import { Svg } from '../icons.jsx'
import { Button, BaseModal, MODAL_Z_NESTED } from '../ui.jsx'
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import { UpdateApplyButton } from './update.jsx'

/* ---------- 「关于」面板:应用名 + 版本 + 简介 + 外部链接 + 检查更新 ---------- */
export function AboutPanel({ t, onClose, initialResult, onDismissUpdate, onCheckResult }) {
  // 检查更新按钮三态: idle(检查更新) / loading(检查中…) / done(重新检查)
  // initialResult = 打开面板时已自动检查的结果,直接展示,无需再点「检查更新」
  const [checkState, setCheckState] = useState(initialResult ? 'done' : 'idle')
  const [checkResult, setCheckResult] = useState(initialResult || null)
  // 用户协议 / 隐私政策弹窗: null=不显示, 否则为要展示的文档对象
  const [legalDoc, setLegalDoc] = useState(null)
  const links = [
    { key: 'website', href: ABOUT_LINKS.website, icon: 'globe', label: t('aboutWebsite') },
    { key: 'github', href: ABOUT_LINKS.github, icon: 'link', label: t('aboutGithub') },
    { key: 'app', href: ABOUT_LINKS.app, icon: 'phone', label: t('aboutApp') },
    { key: 'qq', href: ABOUT_LINKS.qq, icon: 'group', label: t('aboutQq') },
  ]
  async function checkUpdate() {
    if (checkState === 'loading') return
    setCheckState('loading')
    setCheckResult(null)
    try {
      const r = await fetch(API_P + '/browserctl/api/update-check', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      setCheckResult(j)
      // 手动检查结果同步回父层(updateInfo):红点/忽略状态与卡片保持一致
      if (onCheckResult && j && j.ok) onCheckResult(j)
    } catch (e) {
      setCheckResult({ ok: false, error: String((e && e.message) || e) })
    } finally {
      setCheckState('done')
    }
  }
  const err = checkResult && !checkResult.ok ? (checkResult.error || t('updateFailed')) : ''
  const hasUpdate = !!(checkResult && checkResult.ok && checkResult.hasUpdate)
  const upToDate = !!(checkResult && checkResult.ok && !checkResult.hasUpdate)
  const notes = hasUpdate && Array.isArray(checkResult.notes) ? checkResult.notes : []
  const downloadUrl = hasUpdate ? (checkResult.downloadUrl || ABOUT_LINKS.app) : ABOUT_LINKS.app
  // 一键自更新可见性:本地目录形态且非。下载按钮的主次随它切换:
  // 有一键更新时下载是备用路径(描边 secondary);没有时(/包安装)下载就是主 CTA(白底 primary)
  const canApplyOneClick = !!(hasUpdate && checkResult.install && checkResult.install.form === 'local' && !IS_TEST)
  return (
    <BaseModal t={t} title={t('about')} onClose={onClose} className="dshBrowserCtlPanelNested">
      <div className="dshBrowserCtlAboutApp">
          <span className="dshBrowserCtlAboutAppName">{t('tab')}</span>
          <span className="dshBrowserCtlAboutAppVersion">v{VERSION}</span>
        </div>
        <p className="dshBrowserCtlAboutDesc">{t('aboutDesc')}</p>
        <div className="dshBrowserCtlAboutLinks">
          {links.map(l => (
            <a key={l.key} className="dshBrowserCtlAboutLink" href={l.href} target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">{Svg[l.icon]}</span>
              <span>{l.label}</span>
            </a>
          ))}
        </div>
        <div className="dshBrowserCtlAboutLegal">
          <button type="button" className="dshBrowserCtlAboutLegalLink" onClick={() => setLegalDoc(LEGAL_TERMS)}>
            {t('legalTerms')}
          </button>
          <span className="dshBrowserCtlAboutLegalSep" aria-hidden="true">·</span>
          <button type="button" className="dshBrowserCtlAboutLegalLink" onClick={() => setLegalDoc(LEGAL_PRIVACY)}>
            {t('legalPrivacy')}
          </button>
        </div>
        <div className="dshBrowserCtlAboutUpdate">
          <Tooltip label={t('updateRecheckTip')}>
            <Button
              variant="secondary"
              size="sm"
              className="dshBrowserCtlAboutUpdateBtn"
              disabled={checkState === 'loading'}
              onClick={checkUpdate}
            >
              {checkState === 'loading' ? t('updateChecking') : checkState === 'done' ? t('updateRecheck') : t('updateCheck')}
            </Button>
          </Tooltip>
          {checkState === 'done' && (
            <>
              {(hasUpdate || upToDate) && (
                <>
                  <div className="dshBrowserCtlAboutUpdateRow">
                    <span>{t('updateCur')}</span>
                    <span className="dshBrowserCtlAboutUpdateVal">v{checkResult.current}</span>
                  </div>
                  <div className="dshBrowserCtlAboutUpdateRow">
                    <span>{t('updateLst')}</span>
                    <span className="dshBrowserCtlAboutUpdateVal">v{checkResult.latest}</span>
                  </div>
                </>
              )}
              {hasUpdate && (
                <>
                  <p className="dshBrowserCtlAboutUpdateFound">{t('updateFound').replace('{v}', checkResult.latest)}</p>
                  {/* 一键自更新:仅本地目录(解压/link)形态,禁用(覆盖工作区会丢开发态) */}
                  {canApplyOneClick && (
                    <UpdateApplyButton t={t} latest={String(checkResult.latest)} />
                  )}
                  <div className="dshBrowserCtlUrlRow">
                    <div className="dshBrowserCtlUrl" title={downloadUrl}>{downloadUrl}</div>
                    <Tooltip label={t('updateDownloadTip')}>
                      <Button variant={canApplyOneClick ? 'secondary' : 'primary'} size="sm" onClick={() => window.open(downloadUrl, '_blank')}>
                        {t('updateDownload')}
                      </Button>
                    </Tooltip>
                  </div>
                  {/* 更新方法按安装形态分:本地目录(link/解压)=覆盖目录;包安装(npm/github)=重跑安装命令 */}
                  <div className="dshBrowserCtlAboutUpdateSep" aria-hidden="true" />
                  {checkResult.install && checkResult.install.form === 'local' && (
                    <p className="dshBrowserCtlAboutUpdateGuide">
                      {t('updateGuideLocal').replace('{dir}', (checkResult.install && checkResult.install.dir) || '')}
                      {IS_TEST ? t('updateGuideTestNote') : ''}
                    </p>
                  )}
                  {checkResult.install && checkResult.install.form === 'package' && (
                    <p className="dshBrowserCtlAboutUpdateGuide">
                      {t('updateGuidePackage').replace('{cmd}', PLUGIN_ADD_CMD)}
                    </p>
                  )}
                  {notes.length > 0 && (
                    <>
                      <p className="dshBrowserCtlAboutUpdateLabel">{t('updateNotesTitle')}</p>
                      <ul className="dshBrowserCtlAboutUpdateNotes">
                        {notes.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </>
                  )}
                  {onDismissUpdate && (
                    <div className="dshBrowserCtlAboutUpdateIgnoreRow">
                      <Tooltip label={t('updateIgnoreTip')}>
                        <Button variant="secondary" size="sm" onClick={onDismissUpdate}>
                          {t('updateIgnore')}
                        </Button>
                      </Tooltip>
                    </div>
                  )}
                </>
              )}
              {upToDate && <p className="dshBrowserCtlAboutUpdateLatest">{t('updateUpToDate')}</p>}
              {err && <p className="dshBrowserCtlAboutUpdateErr">{err}</p>}
            </>
          )}
        </div>
        {legalDoc && <LegalDialog t={t} doc={legalDoc} onClose={() => setLegalDoc(null)} />}
    </BaseModal>
  )
}
/* ---------- 用户协议 / 隐私政策弹窗(「关于」面板内点击展开) ---------- */
export function LegalDialog({ t, doc, onClose }) {
  if (!doc) return null
  return (
    <BaseModal t={t} title={doc.title} subtitle={t('legalMeta').replace('{d}', LEGAL_EFFECTIVE).replace('{v}', LEGAL_VERSION)} onClose={onClose} className="dshBrowserCtlPanelNested dshBrowserCtlLegalPanel" z={MODAL_Z_NESTED}>
        <div className="dshBrowserCtlLegalBody">
          <p className="dshBrowserCtlLegalSubtitle">{doc.subtitle}</p>
          {doc.sections.map(sec => (
            <section className="dshBrowserCtlLegalSection" key={sec.title}>
              <h3>{sec.title}</h3>
              {sec.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </section>
          ))}
        </div>
        <div className="dshBrowserCtlLegalFooter">
          <Button variant="secondary" size="sm" className="dshBrowserCtlAboutUpdateBtn" onClick={onClose}>
            {t('legalAck')}
          </Button>
        </div>
    </BaseModal>
  )
}