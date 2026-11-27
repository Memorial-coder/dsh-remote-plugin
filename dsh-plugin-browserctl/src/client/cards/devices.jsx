// ---------- 设备卡(P2b 单卡分区版):一张卡 + 4 个内框分区 ----------
// 在线(卡头右侧「全部踢下线」)/ 历史·聚合 / 已封禁 IP(卡头「+ 添加」入口 + 行内解禁)
// / 已配对手机(解除配对)。逻辑迁移自原 DevicesSection + BlacklistCard + AppPairCard
// 已配对列表:kick/ban 双通道与轮询节奏零改动,只动渲染位置与挂载(接口契约不变)。
// B2 破坏性确认补齐:单台踢出 / 全部踢下线 = 两段式 armed 确认(与 SigEnforce 确认等级拉齐)。

import { useState, useEffect } from 'react'
import { API_P } from '../const.js'
import { fmtRelative, kindOf } from '../fmt.js'
import { kickViaGate, banViaGate } from '../actions.js'
import { useToast, fmtPlatform } from '../hooks.js'
import { Svg } from '../icons.jsx'
import { Button } from '../ui.jsx'

/* ---------- 内框分区骨架(mockup .inset:细描边+3% 底,间距/标题样式在 styles.js B3.6 收编) ---------- */
function Inset({ title, meta, action, children }) {
  return (
    <div className="dshBrowserCtlInsetBox">
      <div className="dshBrowserCtlInsetHead">
        <span>{title}</span>
        <span style={{ flex: 1 }} />
        {meta ? <span style={{ fontWeight: 400 }}>{meta}</span> : null}
        {action || null}
      </div>
      {children}
    </div>
  )
}

/* ---------- 分区内行(无框,细分隔线;首行无上边线) ---------- */
function InRow({ first, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
      borderTop: first ? 'none' : '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.05))',
    }}>{children}</div>
  )
}

export function DevicesSection({ t, reloadToken, onRefresh, disabled }) {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [kicking, setKicking] = useState(null)
  const [kickMsg, setKickMsg] = useToast()          // 2.2s 自动消失(B1 useToast)
  const [banning, setBanning] = useState(null)
  const [banMsg, setBanMsg] = useToast()            // {text, ok},2.2s(B1 useToast)
  const [banOk, setBanOk] = useState(true)
  // 两段式 armed 确认:'' 无 / 'all' 全部踢下线 / dev 单台踢出;2.6s 无二次点击自动复位
  const [kickConfirm, setKickConfirm] = useState('')
  // 已封禁 IP 分区(迁自 BlacklistCard:同一条 browserctl_blacklist.json,只换挂载点)
  const [blackData, setBlackData] = useState(null)
  const [banAddOpen, setBanAddOpen] = useState(false)
  const [banIp, setBanIp] = useState('')
  const anyBusy = disabled || busy
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl/api/totp', { cache: 'no-store' })
      .then(r => r.text().then(tx => { try { return JSON.parse(tx) } catch { return { error: 'HTTP ' + r.status } } }))
      .then(j => { if (alive) setData(j) })
      .catch(() => {})
    return () => { alive = false }
  }, [reloadToken])
  // 黑名单列表(闸机端点优先,失败回空列表——与原 BlacklistCard 一致)
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl-gate/blacklist', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => { if (alive) setBlackData(Array.isArray(j.blacklist) ? j.blacklist : []) })
      .catch(() => { if (alive) setBlackData([]) })
    return () => { alive = false }
  }, [reloadToken])
  // 心跳保活已上移到面板根(BrowserCtlOverlay):任意页签打开都算在线,
  // 否则切到别的页签 10 分钟后设备会被误判为"离线"。

  const sessions = Array.isArray(data?.sessions) ? data.sessions : []
  const devices = Array.isArray(data?.devices) ? data.devices : []
  const blacklist = blackData || []
  // 只显示通过「App 配对」绑定的手机(kind=app;旧会话没 kind,按名字兜底)
  const pairedPhones = sessions.filter(s => kindOf(s) === 'app')
  const webCount = sessions.filter(s => kindOf(s) === 'web').length

  // "在线"判定以会话最近活动时间(ts)为准,不看 registry 的 online 标记 ——
  // 2FA 开启时会话会保留 30 天,标记在线只代表"受信任",不代表"此刻连着"。
  // 面板每 2 分钟心跳一次,超过 10 分钟没有活动就算离线。
  const nowSec = Date.now() / 1000
  const isFresh = ts => !!ts && (nowSec - ts) < 600
  const groupKey = (ip, name) => (ip || '') + '\u0000' + (name || '')
  const devByKey = new Map(devices.map(d => [d.key, d]))
  const onlineSessions = sessions.filter(s => isFresh(s.ts || s.since))
  const onlineGroups = new Set(onlineSessions.map(s => groupKey(s.ip, s.name)))
  // P5 展示层自动去重(2026-11-27 用户反馈③):按 (ip,name) 身份键归并重复会话。
  // 同机被踢+重配对后,旧 dev 的 30 天信任会话未过期时在线/已配对列表会出现两行
  // (历史·聚合分区早就这样按 (ip,name) 聚合了,这里补齐同一口径)。合并行带
  // 「重复 N 条」徽标,踢出/解除配对对整组生效(_dupDevs);纯渲染层归并,
  // 不发新请求、不动闸机语义(重配对发新 dev id 是既有设计)。
  const dedupeRows = rows => {
    const counts = new Map()
    const devs = new Map()
    for (const s of rows) {
      const k = groupKey(s.ip, s.name)
      counts.set(k, (counts.get(k) || 0) + 1)
      const arr = devs.get(k) || []
      arr.push(s.dev)
      devs.set(k, arr)
    }
    const seen = new Set()
    return rows
      .filter(s => { const k = groupKey(s.ip, s.name); if (seen.has(k)) return false; seen.add(k); return true })
      .map(s => ({ ...s, _dupN: counts.get(groupKey(s.ip, s.name)), _dupDevs: devs.get(groupKey(s.ip, s.name)) }))
  }
  const onlineRows = dedupeRows(onlineSessions)
  const pairedRows = dedupeRows(pairedPhones)
  // "在线 X 分钟"要算的是"这一轮连续在线了多久":
  // 会话的 since 是首次验证时间(2FA 下能保留 30 天),重启闸机后复用的老会话会显示成
  // "在线 19 小时";设备档案的 online_since 才是本次真正上线的时间点,优先用它。
  const onlineSince = (s) => {
    const d = devByKey.get(s.devid || s.dev)
    const since = (d && d.online_since) || 0
    return since > 0 ? since : s.since
  }
  // 历史设备:按 (ip, name) 聚合成一台(退出重扫不算新设备),并排除当前在线的那几台,
  // 避免和上面的"在线设备"分区重复统计。
  const histMap = new Map()
  for (const d of devices) {
    const g = groupKey(d.ip, d.name)
    if (onlineGroups.has(g)) continue
    const prev = histMap.get(g)
    if (!prev || (d.last_seen || 0) > (prev.last_seen || 0)) histMap.set(g, d)
  }
  const historical = [...histMap.values()].sort((a, b) => (b.last_seen || 0) - (a.last_seen || 0))

  function fmtOnline(since) {
    if (!since) return ''
    const mins = Math.max(0, Math.round((Date.now() - since * 1000) / 60000))
    if (mins < 1) return t('durLess1Min')
    if (mins < 60) return t('durMin').replace('{n}', mins)
    const hrs = Math.round(mins / 60)
    if (hrs < 24) return t('durHour').replace('{n}', hrs)
    return t('durDay').replace('{n}', Math.round(hrs / 24))
  }

  function fmtDuration(ms) {
    if (!ms || ms < 0) return ''
    const totalSec = Math.round(ms / 1000)
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    if (mins < 1) return t('durSec').replace('{n}', secs)
    const hrs = Math.floor(mins / 60)
    const remainMins = mins % 60
    if (hrs < 1) return t('durMin').replace('{n}', mins)
    if (hrs < 24) return t('durHourMin').replace('{h}', hrs).replace('{m}', remainMins)
    const days = Math.floor(hrs / 24)
    return t('durDayHour').replace('{d}', days).replace('{h}', hrs % 24)
  }

  // armed 确认自动复位(2.6s 略长于一轮 toast,期间其它点击也会覆盖)
  useEffect(() => {
    if (!kickConfirm) return
    const id = setTimeout(() => setKickConfirm(''), 2600)
    return () => clearTimeout(id)
  }, [kickConfirm])

  // armed 确认目标键:单个 dev 或重复组 dev 数组 → 稳定字符串(两段式确认/忙碌态比对用)
  const kickTargetOf = dev => {
    const devs = Array.isArray(dev) ? dev : (dev ? [dev] : null)
    return devs ? devs.join('|') : 'all'
  }

  async function kick(dev) {
    // 两段式 armed 确认:第一次点击只进入确认态,二次点击才真正执行。
    // dev 支持数组(P5 展示层归并的重复组):同机多会话整组逐台踢,不留漏网会话。
    const devs = Array.isArray(dev) ? dev : (dev ? [dev] : null)
    const target = kickTargetOf(dev)
    if (kickConfirm !== target) { setKickConfirm(target); return }
    setKickConfirm('')
    setBusy(true)
    setKicking(target)
    setKickMsg('')
    // kick 双通道统一走 kickViaGate(闸机 /kick|/kick-all 优先 + host /api/totp-kick 兜底 + 1.2s/2.5s 补拉)
    try {
      let ok = true
      if (!devs) {
        const r = await kickViaGate({ onKicked: onRefresh })
        ok = !!(r && r.ok)
      } else {
        for (const d of devs) {
          // purge:1(2026-11-27):手动清理(踢下线/解除配对)连档案 husk 一起删——否则安全卡
          // 设备凭证列表只增不减(kb/06 #43),设备页清了、凭证页还留着。远程面板无管理令牌
          // 自动降级为普通 kick(P4 口径,与签名卡 revoke/一键去重同一通道);全部踢下线不删档。
          const r = await kickViaGate({ dev: d, purge: 1, onKicked: devs.length === 1 ? onRefresh : undefined })
          if (!(r && r.ok)) ok = false
        }
        if (devs.length > 1) onRefresh()   // 整组踢:最后统一补拉一次
      }
      if (ok) {
        const face = devs ? sessions.find(x => x.dev === devs[0]) : null
        const isApp = !!(devs && devs.length === 1 && kindOf(face || {}) === 'app')
        setKickMsg(devs ? (isApp ? t('pairedUnpaired') : t('kickedOne')) : t('kickedAll'))
        // 乐观更新:立即从列表移除(重复组整组移除);闸机落盘后的重拉由补拉节奏负责
        setData(d => {
          if (!d) return d
          const list = Array.isArray(d.sessions) ? d.sessions : []
          return { ...d, sessions: devs ? list.filter(x => !devs.includes(x.dev)) : [] }
        })
      } else {
        setKickMsg(t('kickFail'))
      }
    } catch {
      setKickMsg(t('netError'))
    } finally {
      setBusy(false)
      setKicking(null)
    }
  }

  async function ban(dev, ip, name) {
    if (!dev && !ip) return
    setBusy(true)
    setBanning(dev || ip || '')
    setBanMsg('')
    try {
      // 黑名单双通道统一走 banViaGate(闸机 /blacklist 优先 + host /api/blacklist-add 兜底)
      const r = await banViaGate({ dev, ip, name })
      const ok = !!(r && r.ok)
      setBanOk(ok)
      setBanMsg({ text: ok ? t('bannedOk').replace('{n}', name || ip || '') : t('banAddFail'), ok })
      onRefresh()
    } catch {
      setBanOk(false)
      setBanMsg({ text: t('netError'), ok: false })
    } finally {
      setBusy(false)
      setBanning(null)
    }
  }

  // 手动拉黑 IP(P2b 卡头「+ 添加」入口,补齐"全网只能拉黑设备不能新增 IP"的闭环):
  // 简单 IPv4 形校验 → banViaGate({ip,name:ip}) → 成功后刷新列表
  async function addBan() {
    const ip = banIp.trim()
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip)
    const valid = !!m && m.slice(1).every(x => Number(x) <= 255)
    if (!valid) {
      setBanOk(false)
      setBanMsg({ text: t('banAddInvalid'), ok: false })
      return
    }
    setBusy(true)
    setBanMsg('')
    try {
      const r = await banViaGate({ ip, name: ip, reason: t('banAddReason') })
      const ok = !!(r && r.ok)
      setBanOk(ok)
      setBanMsg({ text: ok ? t('banAddOk').replace('{ip}', ip) : t('banAddFail'), ok })
      if (ok) { setBanIp(''); setBanAddOpen(false) }
    } catch {
      setBanOk(false)
      setBanMsg({ text: t('netError'), ok: false })
    } finally {
      setBusy(false)
    }
  }

  // 解禁(迁自 BlacklistCard:闸机端点失败回退插件本地端点,查询串参数)
  async function unban(ip) {
    setBusy(true)
    try {
      let r = await fetch(API_P + '/browserctl-gate/blacklist/remove', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ip }),
      }).catch(() => null)
      if (!r || !r.ok) {
        r = await fetch(API_P + '/browserctl/api/blacklist-remove?ip=' + encodeURIComponent(ip), { cache: 'no-store' })
          .catch(() => null)
      }
      if (r && r.ok) {
        setBlackData(d => (d || []).filter(x => x.ip !== ip))
        setBanOk(true)
        setBanMsg({ text: t('banUnbanOk').replace('{ip}', ip), ok: true })
      } else {
        setBanOk(false)
        setBanMsg({ text: t('banUnbanFail'), ok: false })
      }
    } catch {
      setBanOk(false)
      setBanMsg({ text: t('banUnbanFail'), ok: false })
    } finally {
      setBusy(false)
    }
  }

  // 2FA 关闭时也要能看到在线设备(踢下线/拉黑照常可用)
  if (!data) return null

  const kickBtn = (dev) => {
    const target = kickTargetOf(dev)
    const armed = kickConfirm === target
    return (
      <Button variant="ghost" size="sm" className="dshBrowserCtlBtnDangerSoft" disabled={anyBusy} onClick={() => kick(dev)}>
        {kicking === target ? t('kickBusy') : (armed ? (dev ? t('kickOneConfirm') : t('kickAllConfirm')) : t('deviceKick'))}
      </Button>
    )
  }
  const banBtn = (dev, ip, name) => (
    <Button variant="ghost" size="sm" className="dshBrowserCtlBtnDangerSoft" disabled={anyBusy} onClick={() => ban(dev, ip, name)}>
      {banning === (dev || ip || '') ? t('banBusy') : <>{Svg.shield} {t('banAddConfirm')}</>}
    </Button>
  )

  return (
    <div className="dshBrowserCtlCard" data-busy={anyBusy ? 'true' : 'false'}>
      {/* 卡头:设备与访问(mockup P2b 静态卡头) */}
      <div className="dshBrowserCtlCardHead" style={{ cursor: 'default' }}>
        {Svg.desk}
        <span>{t('devCardTitle')}</span>
        <span className="dshBrowserCtlCardStat" style={{ color: 'var(--dsw-alias-label-tertiary,#8b8f98)', fontWeight: 400 }}>
          {t('devCardMeta')}
        </span>
      </div>
      <div className="dshBrowserCtlCardBody dshBrowserCtlCardBodyTall" data-open="true">
        {/* ---- 分区 1:在线(卡头右侧「全部踢下线」) ---- */}
        <Inset
          title={t('devSecOnlineN').replace('{n}', onlineRows.length)}
          action={sessions.length > 0 ? (
            <Button variant="ghost" size="sm" className="dshBrowserCtlBtnDangerSoft" disabled={anyBusy} onClick={() => kick(null)}>
              {kicking === 'all' ? t('kickBusy') : (kickConfirm === 'all' ? t('kickAllConfirm') : t('totpKick'))}
            </Button>
          ) : null}
        >
          <p className="dshBrowserCtlCardDesc">{t('noDevicesHint')}</p>
          {onlineRows.length === 0 ? (
            <div className="dshBrowserCtlDevEmpty">{t('noOnlineDevices')}</div>
          ) : (
            onlineRows.map((s, i) => (
              <InRow key={s.dev} first={i === 0}>
                <div className="dshBrowserCtlDevInfo">
                  <div className="dshBrowserCtlDevTop">
                    <span className="dshBrowserCtlDevPlatform" title={s.ua || ''}>{s.name || fmtPlatform(s.ua)}</span>
                    <KindTag item={s} t={t} />
                    {(s._dupN || 1) > 1 && <span className="dshBrowserCtlDupBadge">{t('dupBadge').replace('{n}', String(s._dupN))}</span>}
                    <span className="dshBrowserCtlDevSeen">
                      <span className="dshBrowserCtlHistDot" data-on="true"><i />{t('onlineFor').replace('{d}', fmtOnline(onlineSince(s)))}</span>
                    </span>
                  </div>
                  <div className="dshBrowserCtlDevIp">{s.ip || 'unknown'}{s.loc ? <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 10 }}>{s.loc}</span> : null}</div>
                </div>
                <div className="dshBrowserCtlDevActions">
                  {kickBtn(s._dupDevs)}
                  {banBtn(s.dev, s.ip, s.name)}
                </div>
              </InRow>
            ))
          )}
          {kickMsg && (
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--dsw-alias-state-success-primary,#34b371)', padding: '4px 0 0' }}>
              {kickMsg}
            </div>
          )}
        </Inset>

        {/* ---- 分区 2:历史 · 聚合(只列"当前不在线"的设备,按 (ip,name) 聚合成一台) ---- */}
        <Inset title={t('devSecHistory')} meta={t('histByDevice')}>
          {historical.length === 0 ? (
            <div className="dshBrowserCtlDevEmpty">{t('histEmpty')}</div>
          ) : (
            <div className="dshBrowserCtlDevBody" style={{ maxHeight: 180 }}>
              {historical.map((d, i) => (
                <InRow key={d.key} first={i === 0}>
                  <div className="dshBrowserCtlDevInfo">
                    <div className="dshBrowserCtlDevTop">
                      <span className="dshBrowserCtlDevPlatform" title={d.ua || ''}>
                        {d.name || t('devUnknown')}
                      </span>
                      <KindTag item={d} t={t} />
                      <span className="dshBrowserCtlDevSeen">
                        <span className="dshBrowserCtlHistDot" data-on="false">
                          <i />{t('lastSeenOnline').replace('{d}', fmtRelative(d.last_seen))}
                        </span>
                      </span>
                    </div>
                    <div className="dshBrowserCtlDevIp">
                      {d.ip || 'unknown'}
                      {d.loc ? <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 10 }}>{d.loc}</span> : null}
                      <span style={{ color: 'var(--dsw-alias-label-tertiary,#8b8f98)', fontSize: 10 }}>
                        {' · ' + t('devConnTimes').replace('{n}', d.times || 1)}
                        {(d.total_online || 0) > 0 ? ' · ' + t('devTotalOnline').replace('{d}', fmtDuration(d.total_online * 1000)) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="dshBrowserCtlDevActions">
                    {banBtn(d.key, d.ip, d.name)}
                  </div>
                </InRow>
              ))}
            </div>
          )}
        </Inset>

        {/* ---- 分区 3:已封禁 IP(卡头「+ 添加」入口补齐新增闭环;解禁按钮在行) ---- */}
        <Inset
          title={t('devSecBanned')}
          meta={t('histCount').replace('{n}', blacklist.length)}
          action={!banAddOpen ? (
            <Button variant="ghost" size="sm" disabled={anyBusy} onClick={() => { setBanAddOpen(true); setBanMsg('') }}>
              + {t('banAdd')}
            </Button>
          ) : null}
        >
          {banAddOpen && (
            <InRow first>
              <input
                value={banIp}
                onChange={e => setBanIp(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && banIp.trim()) addBan() }}
                placeholder={t('banAddPh')}
                spellCheck={false}
                disabled={anyBusy}
                style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', height: 30, padding: '0 10px', border: '1px solid var(--dsw-alias-border-l2,#2a2c33)', borderRadius: 8, background: 'var(--dsw-alias-bg-layer-1,rgba(255,255,255,0.04))', color: 'inherit', fontSize: 12, outline: 'none' }}
              />
              <Button variant="primary" size="sm" disabled={anyBusy || !banIp.trim()} onClick={addBan}>{t('banAddConfirm')}</Button>
              <Button variant="ghost" size="sm" disabled={anyBusy} onClick={() => { setBanAddOpen(false); setBanIp('') }}>{t('banCancel')}</Button>
            </InRow>
          )}
          {blacklist.length === 0 ? (
            <div className="dshBrowserCtlDevEmpty">{t('banEmpty')}</div>
          ) : (
            <div className="dshBrowserCtlBanBody" style={{ maxHeight: 180 }}>
              {blacklist.map((r, i) => (
                <InRow key={i} first={i === 0 && !banAddOpen}>
                  <span className="dshBrowserCtlBanInfo" title={r.ip}>
                    <span style={{ color: 'var(--dsw-alias-label-primary,inherit)', fontWeight: 500 }}>{r.name || 'unknown'}</span>
                    {' '}
                    <span style={{ color: 'var(--dsw-alias-label-secondary,#a6aab2)' }}>{r.ip}</span>
                    <span className="dshBrowserCtlBanReason">{r.reason ? ' · ' + r.reason : ''}</span>
                  </span>
                  <Button variant="ghost" size="sm" disabled={anyBusy} onClick={() => unban(r.ip)}>{t('banUnban')}</Button>
                </InRow>
              ))}
            </div>
          )}
          {banMsg && (
            <div style={{ textAlign: 'center', fontSize: 12, color: banMsg.ok ? 'var(--dsw-alias-state-success-primary,#34b371)' : 'var(--dsw-alias-state-error-primary,#e5655c)', padding: '2px 0 0' }}>
              {banMsg.text}
            </div>
          )}
        </Inset>

        {/* ---- 分区 4:已配对手机(迁自 App 配对卡:长期免扫码,解除配对在行) ---- */}
        <Inset title={t('devSecPaired')} meta={t('pairedLongTag')}>
          {pairedRows.length === 0 ? (
            <div className="dshBrowserCtlDevEmpty">{t('pairedEmpty')}</div>
          ) : (
            <div className="dshBrowserCtlDevBody" style={{ maxHeight: 180 }}>
              {pairedRows.map((s, i) => (
                <InRow key={s.dev} first={i === 0}>
                  <div className="dshBrowserCtlDevInfo">
                    <div className="dshBrowserCtlDevTop">
                      <span className="dshBrowserCtlDevPlatform">{s.name || t('pairedTitle')}</span>
                      <KindTag item={s} t={t} />
                      {(s._dupN || 1) > 1 && <span className="dshBrowserCtlDupBadge">{t('dupBadge').replace('{n}', String(s._dupN))}</span>}
                    </div>
                    <div className="dshBrowserCtlDevIp">
                      {s.ip || 'unknown'}{s.ts ? ' · ' + fmtRelative(s.ts) : ''}
                    </div>
                  </div>
                  <div className="dshBrowserCtlDevActions">
                    <Button variant="ghost" size="sm" className="dshBrowserCtlBtnDangerSoft" disabled={anyBusy} onClick={() => kick(s._dupDevs)}>
                      {kicking === kickTargetOf(s._dupDevs) ? t('pairedUnpairing') : (kickConfirm === kickTargetOf(s._dupDevs) ? t('kickOneConfirm') : t('pairedUnpair'))}
                    </Button>
                  </div>
                </InRow>
              ))}
            </div>
          )}
          {webCount > 0 && (
            <div className="dshBrowserCtlDevEmpty" style={{ paddingTop: 2 }}>
              {t('pairedWebNote').replace('{n}', webCount)}
            </div>
          )}
        </Inset>
      </div>
    </div>
  )
}
export function KindTag({ item, t }) {
  const k = kindOf(item)
  const label = t ? t(k === 'app' ? 'kindApp' : 'kindWeb') : (k === 'app' ? 'App' : '网页')
  return <span className="dshBrowserCtlKindTag" data-kind={k}>{label}</span>
}
