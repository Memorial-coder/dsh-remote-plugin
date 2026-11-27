// ---------- 工单反馈弹窗(导出日志 → 官网工单/存本地/复制) ----------
// 纯搬移自 client.jsx,零逻辑改动。诊断日志自带服务端脱敏(x-log-consent 双重把关)。

import { useState } from 'react'
import { API_P } from '../const.js'
import { Button, BaseModal } from '../ui.jsx'

/* ---------- 工单反馈弹窗(导出日志 → 选去向:官网工单 / 存本地文件夹 / 复制内容) ---------- */
// 插件端不再内嵌提交表单(表单在窄面板里体验差,且官方账号登录态与网页端是两套)。
// 2026-11-09 起:先「生成并导出诊断日志」(host 组装+脱敏,落到桌面/下载,可另存自选目录),
// 再从三个去向里选:
//   1) 打开网页版工单 —— 跳官网 /app.html#tickets;未登录会被登录页接住(?next=),登录后直达工单页
//   2) 存到其他文件夹 —— 浏览器支持目录选择器就直接选目录写入;不支持就退回手填路径(host 校验后写入)
//   3) 复制日志内容 —— 已脱敏全文进剪贴板,可粘到聊天/文本框
// 日志只在本机生成,不会自动上传;何时传、传不传完全由用户在网页端决定。
const TICKET_PAGE_URL = 'https://remote.ymzcc.com/dsh-remote/app.html#tickets'

async function ticketCopyText(s) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(s)
      return true
    }
  } catch (e) { /* 非安全上下文/权限拒绝 → 走 execCommand 兜底 */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = s
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch (e) { return false }
}

export function TicketModal({ t, onClose }) {
  const [busy, setBusy] = useState('')            // '' | export | save | reveal
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [exported, setExported] = useState(null)  // {name,path,bytes,content?}
  const [pickMode, setPickMode] = useState(false) // 无目录选择器时的路径输入
  const [pickPath, setPickPath] = useState('')

  const doExport = async (dir, tag) => {
    if (busy) return
    setBusy(tag || 'export'); setErr(''); setInfo('')
    try {
      const q = '?withText=1' + (dir ? '&dir=' + encodeURIComponent(dir) : '')
      const r = await fetch(API_P + '/browserctl/api/ticket/export-diag' + q, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) {
        // 404 = 宿主还是旧版本(新路由要 DSH 真正重启才会注册),给一句能照做的提示
        setErr(r.status === 404
          ? t('ticketExportHostOld')
          : ((j && j.error) || ('HTTP ' + r.status)))
        return
      }
      setExported(j)
      setPickMode(false)
      if (dir) setInfo(t('ticketSaveOk') + (j.path || ''))
    } catch (e) {
      setErr(String((e && e.message) || e))
    } finally { setBusy('') }
  }
  const openWeb = () => { try { window.open(TICKET_PAGE_URL, '_blank', 'noopener') } catch (e) {} }

  const revealFolder = async () => {
    if (!exported || busy) return
    setBusy('reveal'); setErr(''); setInfo('')
    try {
      const r = await fetch(API_P + '/browserctl/api/ticket/reveal?path=' + encodeURIComponent(exported.path || ''), { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) setErr((j && j.error) || ('HTTP ' + r.status))
    } catch (e) {
      setErr(String((e && e.message) || e))
    } finally { setBusy('') }
  }

  const copyContent = async () => {
    if (!exported) return
    if (!exported.content) { setErr(t('ticketNoContent')); return }
    const ok = await ticketCopyText(exported.content)
    setErr('')
    setInfo(ok ? t('ticketCopyOk') : t('ticketCopyFail'))
  }

  const copyPath = async () => {
    if (!exported) return
    const ok = await ticketCopyText(exported.path || '')
    if (ok) { setErr(''); setInfo(t('ticketCopyPathOk')) }
  }

  const saveToFolder = async () => {
    if (!exported || busy) return
    if (!exported.content) { setErr(t('ticketNoContent')); return }
    // 优先目录选择器(Chromium/Electron 较新才有;选完直接把文件写进去)
    if (typeof window.showDirectoryPicker === 'function') {
      try {
        const dir = await window.showDirectoryPicker()
        const fh = await dir.getFileHandle(exported.name, { create: true })
        const w = await fh.createWritable()
        await w.write(exported.content || '')
        await w.close()
        setErr(''); setInfo(t('ticketSaveOk') + exported.name)
        return
      } catch (e) {
        if (e && e.name === 'AbortError') return // 用户取消选择,不算错误
        /* 选择器不可用/权限拒绝 → 退回手填路径 */
      }
    }
    setPickMode(true)
  }

  return (
    <BaseModal t={t} title={t('tickets')} subtitle={t('ticketExportSubtitle')} onClose={onClose} className="dshBrowserCtlPanelNested dshBrowserCtlPanelTicket">
        <div className="dshBrowserCtlTicketBody">
          {err ? <p className="dshBrowserCtlCfgErr">{err}</p> : null}
          {info ? <p className="dshBrowserCtlCfgNote">{info}</p> : null}
          <div className="dshBrowserCtlActions dshBrowserCtlTicketActions">
            <Button variant="primary" size="sm" disabled={!!busy} onClick={() => doExport('', 'export')}>
              {busy === 'export'
                ? (<><span className="dshBrowserCtlSpinner" aria-hidden="true" /> {t('ticketExporting')}</>)
                : (exported ? t('ticketExportAgain') : t('ticketExportDo'))}
            </Button>
          </div>
          {exported ? (
            <div className="dshBrowserCtlTicketDone">
              <div className="dshBrowserCtlTicketDoneTitle">
                {t('ticketExportDone')}
              </div>
              <div className="dshBrowserCtlTicketDonePath">{exported.path}</div>
              <div className="dshBrowserCtlTicketDoneBtns">
                <Button variant="secondary" size="sm" disabled={!!busy} onClick={revealFolder}>
                  {busy === 'reveal'
                    ? (<><span className="dshBrowserCtlSpinner" aria-hidden="true" /> {t('ticketOpening')}</>)
                    : t('ticketOpenFolder')}
                </Button>
                <Button variant="secondary" size="sm" onClick={copyPath}>{t('ticketCopyPath')}</Button>
              </div>
            </div>
          ) : null}
          <p className="dshBrowserCtlTicketDestHead">{t('ticketDestTitle')}</p>
          <button type="button" className="dshBrowserCtlTicketDest" onClick={openWeb}>
            <span className="dshBrowserCtlTicketDestTitle">{t('ticketOpenWeb')}</span>
            <span className="dshBrowserCtlTicketDestDesc">{t('ticketOpenWebDesc')}</span>
          </button>
          <button type="button" className="dshBrowserCtlTicketDest" disabled={!exported} onClick={saveToFolder}>
            <span className="dshBrowserCtlTicketDestTitle">{t('ticketSaveOther')}</span>
            <span className="dshBrowserCtlTicketDestDesc">{t('ticketSaveOtherDesc')}</span>
          </button>
          <button type="button" className="dshBrowserCtlTicketDest" disabled={!exported} onClick={copyContent}>
            <span className="dshBrowserCtlTicketDestTitle">{t('ticketCopyContent')}</span>
            <span className="dshBrowserCtlTicketDestDesc">{t('ticketCopyContentDesc')}</span>
          </button>
          {pickMode ? (
            <div className="dshBrowserCtlTicketPickRow">
              <input
                className="dshBrowserCtlTicketInput dshBrowserCtlTicketPickInput"
                placeholder={t('ticketSavePathPh')}
                value={pickPath}
                onChange={e => setPickPath(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (pickPath.trim()) doExport(pickPath.trim(), 'save') } }}
              />
              <Button variant="secondary" size="sm" disabled={!!busy || !pickPath.trim()} onClick={() => doExport(pickPath.trim(), 'save')}>
                {busy === 'save'
                  ? (<><span className="dshBrowserCtlSpinner" aria-hidden="true" /> {t('ticketSaving')}</>)
                  : t('ticketSaveGo')}
              </Button>
            </div>
          ) : null}
          <p className="dshBrowserCtlCfgNote dshBrowserCtlTicketNoteEnd">{t('ticketExportNote')}</p>
        </div>
    </BaseModal>
  )
}