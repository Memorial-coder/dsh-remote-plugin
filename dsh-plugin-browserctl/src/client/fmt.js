// ---------- 格式化 / 分类 util ----------
// 全面板共用的时间格式化、设备/推送/消息分类纯函数(零 React 依赖),
// 逐字搬移自 client.jsx。分层:const → fmt(只向下引用)。
import { msgIsSeen } from './const.js'

// ---------- 时间格式化统一(B1,2026-11-26:7 套函数收敛为 2 个 util) ----------
// 原 fmtWhen×2 / fmtAgo / fmtAgoLong / fmtClock / fmtPushTime / fmtMsgTime / fmtMsgShort
// 收敛为:fmtRelative(相对时间) + fmtAbsolute(绝对时间,style 选格式)。
// 输出保持各处现状观感;相对时间统一「N 分钟前」口径(fmtAgoLong 的「2 小时 5 分钟前」
// 精确到分钟的形态一并归一,见面板重构计划 B1 批次表)。
// 入参秒/毫秒自动判别(<1e12 视为秒):原 7 套里闸机时间戳是秒、消息 createdAt 是毫秒。
export function fmtRelative(ts) {
  const t = Number(ts) || 0
  if (!t) return ''
  const ms = t < 1e12 ? t * 1000 : t
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60000))
  if (mins < 1) return '刚刚'
  if (mins < 60) return mins + ' 分钟前'
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return hrs + ' 小时前'
  return Math.round(hrs / 24) + ' 天前'
}
// style: 'clock'=MM-DD HH:MM:SS(日志行) / 'date'=MM-DD HH:MM(推送行) /
//        'short'=今天 HH:MM,今年 MM-DD,更早 YYYY-MM-DD(通知中心行) / 默认=YYYY-MM-DD HH:MM(详情)
export function fmtAbsolute(ts, style) {
  const t = Number(ts) || 0
  if (!t) return ''
  const ms = t < 1e12 ? t * 1000 : t
  const d = new Date(ms)
  const now = new Date()
  const p = n => (n < 10 ? '0' : '') + n
  if (style === 'short') {
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate())
      return p(d.getHours()) + ':' + p(d.getMinutes())
    if (d.getFullYear() === now.getFullYear()) return p(d.getMonth() + 1) + '-' + p(d.getDate())
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
  }
  if (style === 'clock') return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
  if (style === 'date') return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}
/* 设备来源:kind=app(扫码长期配对的 App)/web(浏览器登录)。旧会话/旧设备档案没有
   kind 字段,按名字兜底(App 的名字都以 DSH Remote 开头或叫 手机 App)。 */
export function kindOf(s) {
  if (s && s.kind) return s.kind
  const n = (s && s.name) || ''
  return n.indexOf('DSH Remote') === 0 || n === '手机 App' ? 'app' : 'web'
}
export const PUSH_KIND = { test: 'Test', verify: 'Verify', kick: 'Kick', ban: 'Ban', totp: 'Totp', pair: 'Pair', join: 'Join', dev: 'Dev', msg: 'Msg' }

export function pushKindLabel(t, kind) {
  const key = PUSH_KIND[kind]
  return key ? t('pushKind' + key) : (kind || '')
}

/* ---- 通知分类(2026-11-16):official=官方发的消息(公告/客服);security=自己的历史消息
   (本机安全动态:设备连入/配对/踢出/黑名单/2FA)。闸机 _push_notify 写 cat 字段,
   旧数据无 cat 时按 kind 兜底:announce→official,其余→security。---- */
export const PUSH_CAT_OF_KIND = { announce: 'official' }
export function pushCatOf(it) {
  const c = it && it.cat
  if (c === 'official' || c === 'security') return c
  return PUSH_CAT_OF_KIND[it && it.kind] || 'security'
}
/* ---- 通知中心数据整形:官方消息 + 电脑推送 合并(与手机 home.html msgMerge 同口径) ---- */
// 公告样式(kb/16.8 契约:info灰/update蓝/warning橙/event绿;label 走 locale 键)。
export const MSG_STYLE_MAP = {
  info: { label: '', style: '' },
  update: { label: 'msgStyleUpdate', style: 'update' },
  warning: { label: 'msgStyleWarning', style: 'warning' },
  event: { label: 'msgStyleEvent', style: 'event' },
}
export function msgStyleOf(s) { return MSG_STYLE_MAP[s] ? s : 'info' }

// links[] 归一化:只放行 http(s),label 截 24 字,上限 5 条;老数据回退单 link(手机 msgLinksOf 同款)。
export function msgLinksOf(m) {
  const out = []
  if (m && Array.isArray(m.links)) {
    for (const x of m.links) {
      if (out.length >= 5) break
      const url = String((x && x.url) || '')
      if (!/^https?:\/\//.test(url)) continue
      out.push({ label: String((x && x.label) || '').slice(0, 24), url })
    }
  }
  if (!out.length && m && /^https?:\/\//.test(String(m.link || ''))) out.push({ label: '', url: String(m.link) })
  return out
}

// 行右侧短时间(B1:统一走 fmtAbsolute(e.ts, 'short'),原 fmtMsgShort 已删)。

// 合并排序:官方消息按 kind 分流 official/mine,电脑推送(feed)来自闸机 push-poll 历史;
// 全部按时间倒序,最新在最上(手机同款)。feed 链接只放行 http(s)——dshsession: 深链是
// 「点通知直达会话」的语义,消息中心里不可点(与手机口径一致)。
export function buildMsgEntries(msgs, feedItems) {
  const list = []
  for (const m of (msgs || [])) {
    const mine = m && m.kind === 'personal'
    list.push({
      id: (m && m.id) || '',
      cat: mine ? 'mine' : 'official',
      ts: Number(m && m.createdAt) || 0,
      kindKey: mine ? 'msgPersonal' : 'msgOfficial',
      style: msgStyleOf(m && m.style),
      title: String((m && m.title) || ''),
      body: String((m && m.body) || ''),
      links: msgLinksOf(m),
      unread: !(m && m.read) && !msgIsSeen(m),
    })
  }
  for (const it of (feedItems || [])) {
    const link = /^https?:\/\//.test(String((it && it.link) || '')) ? String(it.link) : ''
    list.push({
      id: (it && it.id) || '',
      cat: 'feed',
      ts: (Number(it && it.t) || 0) * 1000,
      kindKey: 'msgTabFeed',
      style: 'info',
      title: String((it && it.title) || ''),
      body: String((it && it.body) || ''),
      links: link ? [{ label: '', url: link }] : [],
      unread: false,
    })
  }
  list.sort((a, b) => b.ts - a.ts)
  return list
}