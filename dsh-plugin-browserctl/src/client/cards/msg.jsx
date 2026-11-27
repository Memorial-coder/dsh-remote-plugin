// ---------- 顶栏「通知中心」下拉(铃铛):官方消息 + 电脑推送 三分段 ----------
// 纯搬移自 client.jsx,零逻辑改动。dsh_msg_seen_<NS> 本地水位键不可改名。

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { lsSet, MSG_SEEN_KEY, API_P } from '../const.js'
import { fmtAbsolute, MSG_STYLE_MAP, msgLinksOf, buildMsgEntries } from '../fmt.js'
import { Button } from '../ui.jsx'
import { IconCloseOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'

/* ---------- 顶栏「通知中心」下拉(铃铛) ---------- */
// 数据源:官方服务器「消息中心」(管理后台发放,定向到账号或全员)。
// 已登录 → host /server/messages 带 Bearer 拉定向+全员,未读数用服务端(与官网/App 跨端同步);
// 未登录 → 同一接口自动退回公开公告(全员公告免登录可见),未读用本地水位(localStorage)判断。
// 打开列表即全部已读:登录态调 /server/messages/read(服务端已读),未登录只推进本地水位。
export function MsgCenter({ t, loggedInHint, onClose, anchorRef }) {
  const [msgs, setMsgs] = useState(null) // null=加载中
  const [feed, setFeed] = useState(null) // 电脑推送历史;null=加载中,[]=闸机没跑/无历史
  const [err, setErr] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  // 三分段:official=官方公告 | mine=发给我 | feed=电脑推送(与手机消息中心一致,每次打开重置)
  const [tab, setTab] = useState('official')
  const [detail, setDetail] = useState(null) // 点开的条目;null=列表
  // 弹层改 fixed 定位(2026-11-25):此前 position:absolute 挂在面板头部里,面板
  // overflow-y:auto 会把下拉裁到只剩一条(用户截图「通知中心因为限高看不见」)。
  // 挂载时按铃铛锚点实测坐标换算 viewport 定位;下方放不下翻到上方;随窗口缩放重算。
  // html 有 CSS zoom 时 gBCR 是视觉像素、style 是本地像素,按 kb/10 #16 口诀除以 zoom 归一。
  const popRef = useRef(null)
  const [popStyle, setPopStyle] = useState(null)
  useLayoutEffect(() => {
    const anchor = anchorRef && anchorRef.current
    if (!anchor) return
    const place = () => {
      const r = anchor.getBoundingClientRect()
      const vw = window.innerWidth, vh = window.innerHeight
      if (!r || (!r.width && !r.height) || !vw || !vh) return
      let z = 1
      try { z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1 } catch (e) {}
      const w = Math.min(340, vw - 16) / z
      const right = Math.max(8, vw - r.right) / z
      const below = (vh - r.bottom - 12) / z // 锚点下方可用高度(本地 px)
      const above = (r.top - 12) / z
      const up = below < 220 && above > below
      const maxH = Math.max(180, Math.min(480, up ? above : below))
      setPopStyle(up
        ? { position: 'fixed', right, bottom: (vh - r.top + 6) / z, maxHeight: maxH, width: w }
        : { position: 'fixed', right, top: (r.bottom + 6) / z, maxHeight: maxH, width: w })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [anchorRef])
  // 面板/窗口任何滚动都收起下拉(fixed 弹层不跟内容走,留在原地反而错位);弹窗内部滚动除外
  useEffect(() => {
    const onScroll = e => {
      const node = popRef.current
      if (node && e.target && e.target.nodeType === 1 && node.contains(e.target)) return
      onClose()
    }
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [onClose])
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl/api/server/messages', { cache: 'no-store' })
      .then(r => r.json().catch(() => ({ ok: false, error: 'HTTP ' + r.status })))
      .then(j => {
        if (!alive) return
        if (!j || j.ok === false) { setErr((j && j.error) || t('msgLoadFail')); setMsgs([]); return }
        setErr('')
        setLoggedIn(!!j.loggedIn)
        setMsgs(Array.isArray(j.messages) ? j.messages : [])
      })
      .catch(e => { if (alive) { setErr(String((e && e.message) || e)); setMsgs([]) } })
    // 电脑推送:与「推送」页签同一闸机端点(last=0 回放最近 ~20 条);闸机没跑就空态,不报错
    fetch(API_P + '/browserctl-gate/push-poll?last=0', { cache: 'no-store' })
      .then(r => r.json().catch(() => ({})))
      .then(j => { if (alive) setFeed(j && j.ok && Array.isArray(j.items) ? j.items : []) })
      .catch(() => { if (alive) setFeed([]) })
    return () => { alive = false }
    // 仅挂载时拉一次(下拉每次打开重新挂载);依赖里放 t 会在父组件重渲染时反复请求
  }, [])
  // 打开即全部已读(与官网个人中心一致):登录态走服务端,未登录只推进本地水位。
  // 推进动作放在渲染后的 effect:首次渲染仍按旧水位显示未读点,关掉重开才消失。
  useEffect(() => {
    if (!msgs || !msgs.length) return
    const maxTs = msgs.reduce((m, x) => Math.max(m, Number(x.createdAt) || 0), 0)
    lsSet(MSG_SEEN_KEY, String(maxTs))
    if (loggedIn) fetch(API_P + '/browserctl/api/server/messages/read', { method: 'POST', cache: 'no-store' }).catch(() => {})
  }, [msgs, loggedIn])
  const entries = buildMsgEntries(msgs || [], feed || [])
  const counts = { official: 0, mine: 0, feed: 0 }
  for (const e of entries) counts[e.cat]++
  const visible = entries.filter(e => e.cat === tab)
  const emptyText = tab === 'official' ? t('msgEmptyOfficial')
    : tab === 'feed' ? (feed === null ? t('ticketLoading') : t('msgEmptyFeed'))
      : t('msgEmptyMine')
  const switchTab = next => { if (tab !== next) { setTab(next); setDetail(null) } }
  return (
    <>
      <button className="dshBrowserCtlMsgMask" type="button" aria-label={t('close')} onClick={onClose} />
      <div ref={popRef} className="dshBrowserCtlMsgPop" style={popStyle || undefined} role="dialog" aria-label={t('msgCenter')}>
        <div className="dshBrowserCtlMsgPopHead">
          {detail ? (
            <button type="button" className="dshBrowserCtlMsgBack" aria-label={t('msgBack')} onClick={() => setDetail(null)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M9 2.5 4.5 7 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
          <span className="dshBrowserCtlMsgPopTitle">{t('msgCenter')}</span>
          <Button variant="ghost" size="sm" aria-label={t('close')} icon={<IconCloseOutlineRegular />} onClick={onClose} />
        </div>
        {detail ? (
          <MsgDetail t={t} e={detail} />
        ) : (
          <>
            <div className="dshBrowserCtlMsgTabs" role="tablist" aria-label={t('msgCenter')}>
              <button type="button" role="tab" aria-selected={tab === 'official'} className="dshBrowserCtlMsgTab"
                data-on={tab === 'official' ? 'true' : 'false'} onClick={() => switchTab('official')}>
                {t('msgOfficial')}
                {counts.official ? <span className="dshBrowserCtlMsgTabN">{counts.official}</span> : null}
              </button>
              <button type="button" role="tab" aria-selected={tab === 'mine'} className="dshBrowserCtlMsgTab"
                data-on={tab === 'mine' ? 'true' : 'false'} onClick={() => switchTab('mine')}>
                {t('msgPersonal')}
                {counts.mine ? <span className="dshBrowserCtlMsgTabN">{counts.mine}</span> : null}
              </button>
              <button type="button" role="tab" aria-selected={tab === 'feed'} className="dshBrowserCtlMsgTab"
                data-on={tab === 'feed' ? 'true' : 'false'} onClick={() => switchTab('feed')}>
                {t('msgTabFeed')}
                {counts.feed ? <span className="dshBrowserCtlMsgTabN">{counts.feed}</span> : null}
              </button>
            </div>
            <div className="dshBrowserCtlMsgList">
              {msgs === null || (tab === 'feed' && feed === null) ? (
                <div className="dshBrowserCtlMsgEmpty">{t('ticketLoading')}</div>
              ) : !visible.length ? (
                <div className="dshBrowserCtlMsgEmpty">{emptyText}</div>
              ) : visible.map(e => (
                <MsgRow key={e.id || (e.cat + '-' + e.ts + '-' + (e.title || ''))} t={t} e={e} onOpen={() => setDetail(e)} />
              ))}
            </div>
            {err ? <p className="dshBrowserCtlMsgErr">{t('msgLoadFail')}: {err}</p> : null}
            {!loggedIn && !err ? <div className="dshBrowserCtlMsgFoot">{loggedInHint}</div> : null}
          </>
        )}
      </div>
    </>
  )
}

/* 列表行:徽标+短时间 / 标题(未读加粗,两行截断) / 正文一行摘要;点整行进详情(手机同款) */
function MsgRow({ t, e, onOpen }) {
  return (
    <button type="button" className="dshBrowserCtlMsgItem" data-unread={e.unread ? 'true' : 'false'} onClick={onOpen}>
      <span className="dshBrowserCtlMsgRow1">
        <span className="dshBrowserCtlMsgKindTag" data-cat={e.cat} data-style={e.style}>{t(e.kindKey)}</span>
        <span className="dshBrowserCtlMsgTime">{fmtAbsolute(e.ts, 'short')}</span>
      </span>
      <span className="dshBrowserCtlMsgTitle">
        {e.unread ? <span className="dshBrowserCtlMsgUnreadDot" aria-hidden="true" /> : null}
        <span className="dshBrowserCtlMsgTitleText">{e.title || t('msgNoTitle')}</span>
      </span>
      {e.body ? <span className="dshBrowserCtlMsgBody">{e.body}</span> : null}
    </button>
  )
}

/* 详情 pane:分类徽标(带样式名) + 全文 + 完整时间 + 链接按钮组
   (多链接公告 kb/16.8 契约;老数据 links 空 → msgLinksOf 已回退单 link) */
function MsgDetail({ t, e }) {
  const st = MSG_STYLE_MAP[e.style] || MSG_STYLE_MAP.info
  const head = t(e.kindKey) + (st.label ? ' · ' + t(st.label) : '')
  return (
    <div className="dshBrowserCtlMsgDetail">
      <span className="dshBrowserCtlMsgKindTag" data-cat={e.cat} data-style={e.style}>{head}</span>
      <div className="dshBrowserCtlMsgDTitle">{e.title || t('msgNoTitle')}</div>
      <div className="dshBrowserCtlMsgDMeta">{fmtAbsolute(e.ts)}</div>
      {e.body ? <p className="dshBrowserCtlMsgDBody">{e.body}</p> : null}
      {e.links.length ? (
        <div className="dshBrowserCtlMsgDBtns">
          {e.links.map((l, i) => (
            <a key={i} className="dshBrowserCtlMsgDBtn" href={l.url} target="_blank" rel="noopener noreferrer">
              {l.label || t('msgOpenLink')}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}