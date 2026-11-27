// ---------- 推送卡:双开关 + 测试推送 + 最近推送分组列表 ----------
// 纯搬移自 client.jsx,零逻辑改动。PUSH_KIND/pushKindLabel/pushCatOf 已下沉 fmt.js。

import { useState, useEffect } from 'react'
import { API_P } from '../const.js'
import { fmtAbsolute, pushKindLabel, pushCatOf } from '../fmt.js'
import { useToast } from '../hooks.js'
import { Svg } from '../icons.jsx'
import { Button } from '../ui.jsx'

/* ---------- 「推送」页签:接收手机推送 + 系统安全事件 + 测试推送 + 最近推送 ---------- */
function PushGroupedList({ t, items }) {
  // P5 展示层自动去重(2026-11-27 用户反馈③):相邻同 kind+title+body 的重复推送
  // (闸机侧同一事件多行入队是 kb/16.16 记录的遗留)归并为一行,徽标「重复 N 条」。
  // 只并相邻条目、纯渲染层,不改闸机数据;face 取数组首条(push-history 倒序=最新)。
  const merged = []
  for (const it of items) {
    const prev = merged[merged.length - 1]
    if (prev && prev.kind === it.kind && (prev.title || '') === (it.title || '') && (prev.body || '') === (it.body || '')) {
      prev._dupN = (prev._dupN || 1) + 1
      continue
    }
    merged.push({ ...it })
  }
  const groups = { official: [], security: [] }
  for (const it of merged) groups[pushCatOf(it)].push(it)
  const groupHead = key => (
    <div key={'g-' + key} className="dshBrowserCtlPushGroupHead">{t(key === 'official' ? 'pushGroupOfficial' : 'pushGroupSecurity')}</div>
  )
  const rows = []
  if (groups.official.length) {
    rows.push(groupHead('official'))
    rows.push(...groups.official.map(it => <PushRow key={'o' + (it.id || it.t)} t={t} it={it} />))
  }
  if (groups.security.length) {
    rows.push(groupHead('security'))
    rows.push(...groups.security.map(it => <PushRow key={'s' + (it.id || it.t)} t={t} it={it} />))
  }
  return <div className="dshBrowserCtlPushList">{rows}</div>
}

function PushRow({ t, it }) {
  return (
    <div className="dshBrowserCtlPushRow">
      <span className="dshBrowserCtlPushAside">
        <span className="dshBrowserCtlPushType">{pushKindLabel(t, it.kind)}</span>
        <span className="dshBrowserCtlPushTime">{fmtAbsolute(it.t, 'date')}</span>
      </span>
      <span className="dshBrowserCtlPushMain">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span className="dshBrowserCtlPushTitle" title={it.title || ''} style={{ minWidth: 0 }}>{it.title || ''}</span>
          {(it._dupN || 1) > 1 ? <span className="dshBrowserCtlDupBadge">{t('dupBadge').replace('{n}', String(it._dupN))}</span> : null}
        </span>
        {it.body ? <span className="dshBrowserCtlPushBody" title={it.body}>{it.body}</span> : null}
      </span>
    </div>
  )
}

export function PushCard({ t, reloadToken }) {
  const [cfg, setCfg] = useState(null)          // { enabled, system, since }
  const [cfgErr, setCfgErr] = useState('')
  const [busy, setBusy] = useState('')          // '' | 'enabled' | 'system' —— 开关 loading 态
  const [testState, setTestState] = useState('idle') // idle | loading
  const [msgTitle, setMsgTitle] = useState('')  // 手动推送:标题(可选)
  const [msgBody, setMsgBody] = useState('')    // 手动推送:内容
  const [msgState, setMsgState] = useState('idle') // idle | loading
  const [toast, setToast] = useToast()          // B1 useToast:{ text, ok } | null,2.2s 自动消失
  const [items, setItems] = useState(null)
  const [polling, setPolling] = useState(false)
  const [open, setOpen] = useState(true)
  // B2(P4):「手动发送 / 测试 ▼」折叠行——消息编辑器+测试推送收进折叠,双开关与
  // 最近推送列表保持常驻。逻辑零改动,只动渲染位置(注意:本文件属 B3 视觉批次,
  // B2 只做此一处结构性收纳,样式未动)。
  const [manualOpen, setManualOpen] = useState(false)

  const enabled = !!(cfg && cfg.enabled)
  const system = !!(cfg && cfg.system)

  // 读 push-config 初始化开关
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl-gate/push-config', { cache: 'no-store' })
      .then(r => r.text().then(tx => { try { return JSON.parse(tx) } catch { return { error: 'HTTP ' + r.status } } }))
      .then(j => {
        if (!alive) return
        if (j && j.ok) setCfg({ enabled: !!j.enabled, system: !!j.system, since: j.since || 0 })
        else setCfgErr((j && j.error) || t('pushPollFailed'))
      })
      .catch(() => { if (alive) setCfgErr(t('pushPollFailed')) })
    return () => { alive = false }
  }, [reloadToken])

  // 切换开关:参数走查询串(POST push-config?enabled=1|0&system=1|0)
  async function toggle(which) {
    if (busy || !cfg) return
    setBusy(which)
    setToast(null)
    const next = which === 'enabled' ? !enabled : !system
    try {
      const q = new URLSearchParams({
        enabled: which === 'enabled' ? (next ? '1' : '0') : (enabled ? '1' : '0'),
        system: which === 'system' ? (next ? '1' : '0') : (system ? '1' : '0'),
      }).toString()
      const r = await fetch(API_P + '/browserctl-gate/push-config?' + q, { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.ok) {
        setCfg(c => ({ ...(c || {}), enabled: !!j.enabled, system: !!j.system, since: j.since || (c && c.since) || 0 }))
      } else {
        setToast({ text: (j && j.error) || t('pushSaveFailed'), ok: false })
      }
    } catch {
      setToast({ text: t('pushSaveFailed'), ok: false })
    } finally {
      setBusy('')
    }
  }

  // 发送测试推送(loopback)
  async function sendTest() {
    if (testState === 'loading' || !enabled || busy) return
    setTestState('loading')
    setToast(null)
    try {
      const q = new URLSearchParams({ kind: 'test', title: t('pushTestTitle'), body: t('pushTestBody') }).toString()
      const r = await fetch(API_P + '/browserctl-gate/notify?' + q, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      const ok = !!(r.ok && j && j.ok)
      setToast({ text: ok ? t('pushTestOk') : ((j && j.error) || t('pushTestFail')), ok })
      if (ok) loadPoll()   // 主动刷新「最近推送」:否则按钮看起来没生效,用户会连点刷屏(kb/10)
    } catch {
      setToast({ text: t('pushTestFail'), ok: false })
    } finally {
      setTestState('idle')
    }
  }

  // 手动推送一条消息:入队后手机 App 与本机 Windows 通知中心(win_push)都会弹出(kind=msg)
  async function sendMessage() {
    if (msgState === 'loading') return
    const body = msgBody.trim()
    if (!body) return
    setMsgState('loading')
    setToast(null)
    try {
      if (!enabled) {
        // 总开关没开就不打闸机,直接给明确提示(反馈要可懂,不留死按钮)
        setToast({ text: t('pushSendOff'), ok: false })
        return
      }
      const q = new URLSearchParams({ kind: 'msg', title: msgTitle.trim().slice(0, 120), body: body.slice(0, 500) }).toString()
      const r = await fetch(API_P + '/browserctl-gate/notify?' + q, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      const ok = !!(r.ok && j && j.ok && j.pushed !== false)
      if (ok) {
        setMsgTitle('')
        setMsgBody('')
        loadPoll()   // 主动刷新「最近推送」:否则按钮看起来没生效,用户会连点刷屏(kb/10)
      }
      setToast({ text: ok ? t('pushSendOk') : (j && j.pushed === false ? t('pushSendOff') : ((j && j.error) || t('pushSendFail'))), ok })
    } catch {
      setToast({ text: t('pushSendFail'), ok: false })
    } finally {
      setMsgState('idle')
    }
  }

  // 拉最近推送(newest first,取 ~20 条;2026-11-16 起按 cat 分两组展示)
  async function loadPoll() {
    if (polling) return
    setPolling(true)
    try {
      const r = await fetch(API_P + '/browserctl-gate/push-poll?last=0', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.ok) {
        setItems(Array.isArray(j.items) ? j.items.slice(0, 20) : [])
        setCfg(c => ({ ...(c || {}), enabled: !!j.enabled, since: j.since || (c && c.since) || 0 }))
        setCfgErr('')   // 闸机已应答:清掉可能过期的红字(如短暂 401/离线后恢复)
      }
    } catch {
      // 闸机未运行等场景:保持列表不变
    } finally {
      setPolling(false)
    }
  }

  useEffect(() => { loadPoll() }, [reloadToken])

  const list = items || []
  const switchDisabled = !!busy || !cfg

  return (
    <div className="dshBrowserCtlCard">
      <button type="button" className="dshBrowserCtlCardHead" data-open={open ? 'true' : 'false'} onClick={() => setOpen(o => !o)}>
        {Svg.bell}
        <span>{t('pushTitle')}</span>
        <span className="dshBrowserCtlCardStat" data-tone={enabled ? 'ok' : 'muted'}>
          {cfg ? (enabled ? t('pushOn') : t('pushOff')) : '…'}
        </span>
        <span className="dshBrowserCtlCardArrow" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div className="dshBrowserCtlCardBody dshBrowserCtlCardBodyTall" data-open={open}>
        <p className="dshBrowserCtlCardDesc">{t('pushDesc')}</p>
        <div className="dshBrowserCtlSwitchRow">
          <span className="dshBrowserCtlSwitchLabel">
            <span className="dshBrowserCtlSwitchTitle">{t('pushEnabledLabel')}</span>
            <span className="dshBrowserCtlSwitchHint">{t('pushEnabledHint')}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={t('pushEnabledLabel')}
            className="dshBrowserCtlSwitch"
            data-on={enabled ? 'true' : 'false'}
            data-busy={busy === 'enabled' ? 'true' : 'false'}
            disabled={switchDisabled}
            onClick={() => toggle('enabled')}
          >
            <span className="dshBrowserCtlSwitchKnob" aria-hidden="true" />
            {busy === 'enabled' && <span className="dshBrowserCtlSwitchBusy" aria-hidden="true" />}
          </button>
        </div>
        <div className="dshBrowserCtlSwitchRow">
          <span className="dshBrowserCtlSwitchLabel">
            <span className="dshBrowserCtlSwitchTitle">{t('pushSystemLabel')}</span>
            <span className="dshBrowserCtlSwitchHint">{t('pushSystemHint')}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={system}
            aria-label={t('pushSystemLabel')}
            className="dshBrowserCtlSwitch"
            data-on={system ? 'true' : 'false'}
            data-busy={busy === 'system' ? 'true' : 'false'}
            disabled={switchDisabled}
            onClick={() => toggle('system')}
          >
            <span className="dshBrowserCtlSwitchKnob" aria-hidden="true" />
            {busy === 'system' && <span className="dshBrowserCtlSwitchBusy" aria-hidden="true" />}
          </button>
        </div>
        {cfgErr && <p className="dshBrowserCtlCardDescErr">{cfgErr}</p>}
        {/* 「手动发送 / 测试 ▼」折叠行(P4:编辑器+测试推送收进去,展开不加框) */}
        <button
          type="button"
          className="dshBrowserCtlCardHead dshBrowserCtlFoldBtn"
          data-open={manualOpen ? 'true' : 'false'}
          onClick={() => setManualOpen(o => !o)}
        >
          <span className="dshBrowserCtlFoldChev" data-open={manualOpen ? 'true' : 'false'} aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="dshBrowserCtlFoldLabel">{t('pushManualFold')}</span>
          <span className="dshBrowserCtlCardStat" data-tone="muted">{t('pushComposerHint')}</span>
        </button>
        {manualOpen && (
          <>
          {/* 手动发送消息:手机 App + 本机通知中心都会弹出 */}
          <div className="dshBrowserCtlMsgCard">
            <div className="dshBrowserCtlMsgHead">
              <span className="dshBrowserCtlMsgCardTitle">{t('pushComposerTitle')}</span>
              <span className="dshBrowserCtlMsgHint">{t('pushComposerHint')}</span>
            </div>
            <label className="dshBrowserCtlCfgField">
              <span>{t('pushMsgTitleLabel')}</span>
              <input
                value={msgTitle}
                onChange={e => setMsgTitle(e.target.value)}
                placeholder={t('pushMsgTitlePh')}
                maxLength={120}
                spellCheck={false}
                disabled={msgState === 'loading'}
              />
            </label>
            <label className="dshBrowserCtlCfgField">
              <span>{t('pushMsgBodyLabel')}</span>
              <textarea
                value={msgBody}
                onChange={e => setMsgBody(e.target.value)}
                placeholder={t('pushMsgBodyPh')}
                maxLength={500}
                rows={3}
                disabled={msgState === 'loading'}
              />
            </label>
            <div className="dshBrowserCtlMsgFoot">
              <span className="dshBrowserCtlMsgCount">{msgBody.length}/500</span>
              <Button
                variant="primary"
                size="sm"
                className="dshBrowserCtlMsgSendBtn"
                disabled={msgState === 'loading' || !msgBody.trim()}
                onClick={sendMessage}
              >
                {msgState === 'loading' ? t('pushSending') : t('pushSend')}
              </Button>
            </div>
          </div>
          <div className="dshBrowserCtlActions">
            <Button
              variant="secondary"
              size="sm"
              className="dshBrowserCtlPushBtn"
              disabled={testState === 'loading' || !enabled || !!busy}
              onClick={sendTest}
            >
              {testState === 'loading' ? t('pushTesting') : t('pushTest')}
            </Button>
          </div>
          </>
        )}
        {toast && (
          <div className="dshBrowserCtlPairedMsg" data-ok={toast.ok ? 'true' : 'false'}>
            {toast.text}
          </div>
        )}
        {/* 最近推送列表:官方消息(公告等)与安全动态(设备连入/配对/踢出/黑名单)分组展示 */}
        <div className="dshBrowserCtlPairedList">
          <div className="dshBrowserCtlPairedHead">
            <span>{t('pushRecent')}</span>
            <Button variant="ghost" size="sm" disabled={polling} onClick={loadPoll}>
              {polling ? t('pushRefreshing') : t('pushRefresh')}
            </Button>
          </div>
          {list.length === 0 ? (
            <div className="dshBrowserCtlPairedEmpty">{t('pushEmpty')}</div>
          ) : (
            <PushGroupedList t={t} items={list} />
          )}
        </div>
      </div>
    </div>
  )
}