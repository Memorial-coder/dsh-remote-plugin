// ---------- L1 设备签名强制卡(sigTitle;健康行+重启闸机随卡走) ----------
// 纯搬移自 client.jsx,零逻辑改动。sig/sig-health/kick 三接口联动整体搬。

import { useState, useEffect } from 'react'
import { API_P } from '../const.js'
import { kickViaGate } from '../actions.js'
import { useToast } from '../hooks.js'
import { Svg } from '../icons.jsx'
import { Button } from '../ui.jsx'

/* ---------- 批次4-②:L1 设备签名强制开关(闸机 sig-toggle;GET 读/POST 仅本机管理员) ---------- */
export function SigEnforceCard({ t, reloadToken }) {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [err, setErr] = useState('')
  const [devsOpen, setDevsOpen] = useState(false)
  const [acting, setActing] = useState('')
  const [msg, setMsg] = useToast()       // B1 useToast(2.2s,此前无自动消失)
  const [dedupeConfirm, setDedupeConfirm] = useState(false)
  const [health, setHealth] = useState(null)
  const [allConfirm, setAllConfirm] = useState(false)
  const [allMsg, setAllMsg] = useToast() // B1 useToast(2.2s,此前无自动消失)
  // B2(P3/P7):「高级」折叠行收纳 健康行/重启闸机/清除所有授权/运维提示。
  // 折叠只影响渲染,不影响轮询——sig/sig-health 5s + visibilitychange 轮询在本组件
  // 层,折叠状态下照跑(「别处开关后本面板旧值」的血泪修复,不能停)。
  const [advOpen, setAdvOpen] = useState(false)
  // 2026-11-25:闸机就绪度护栏 409 后的「仍要开启」通道(带 ?force=1 的显式决策)。
  // 只有 409 响应带 readiness.ready=false 时才亮,其它错误(403/503)不给强制入口。
  const [forceOpen, setForceOpen] = useState(false)
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl/api/sig', { cache: 'no-store' })
      .then(r => r.json().catch(() => ({})))
      .then(j => { if (alive && j && j.ok) setData(j) })
      .catch(() => {})
    return () => { alive = false }
  }, [reloadToken])
  async function toggle(next, force) {
    if (busy) return
    if (next && !force && !confirming) { setConfirming(true); return }
    setBusy(true); setErr(''); setConfirming(false); setForceOpen(false)
    try {
      // force=1 透传闸机就绪度护栏的显式出口(?force=1,409 后的「我知道还没全员绑定」)
      const r = await fetch(API_P + '/browserctl/api/sig-toggle?enforce=' + (next ? '1' : '0') + (force ? '&force=1' : ''), { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (j && j.ok) setData(d => ({ ...(d || {}), enforce: !!next }))
      else {
        setErr((j && j.error) || t('sigFail'))
        setForceOpen(!!(j && j.readiness && j.readiness.ready === false && next))
      }
    } catch (e) {
      setErr(t('sigFail'))
    } finally {
      setBusy(false)
    }
  }
  async function refetch() {
    try {
      const r = await fetch(API_P + '/browserctl/api/sig', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (j && j.ok) setData(j)
    } catch (e) {}
  }
  async function loadHealth() {
    try {
      // 状态灯必须走插件 /api/sig-health(host 代持管理令牌转闸机 /healthz)。
      // 历史 bug(2026-11-24 修):曾写错成 gate 反代路径 /browserctl-gate/sig-health,
      // 闸机端根本没有该路由 → 404 → health 恒 {ok:false},面板永远红字「闸机未响应」,
      // 与闸机死活无关(踢人/清除/重启走反代能通,只是因为它们恰好真是闸机路由)。
      const r = await fetch(API_P + '/browserctl/api/sig-health', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      setHealth(j && j.ok ? j : { ok: false })
    } catch (e) { setHealth({ ok: false }) }
  }
  const [restarting, setRestarting] = useState(false)
  useEffect(() => { loadHealth() }, [reloadToken])
  // 状态轮询(2026-11-18 用户实测:别处开/关后本面板一直显示旧值):
  // 5s 一刷 + 标签页切回前台立刻刷,开关状态/授权台数不再需要手动刷新页面。
  useEffect(() => {
    const timer = setInterval(() => { refetch(); loadHealth() }, 5000)
    const onVis = () => { if (!document.hidden) { refetch(); loadHealth() } }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVis) }
  }, [])
  async function restartGate() {
    if (restarting) return
    setRestarting(true)
    try {
      await fetch(API_P + '/browserctl-gate/gate-restart', { method: 'POST', cache: 'no-store' })
    } catch (e) {}
    // 8 秒内每 2 秒探一次,恢复后自动收尾
    let n = 0
    const timer = setInterval(async () => {
      n += 1
      await loadHealth()
      if (n >= 5) { clearInterval(timer); setRestarting(false) }
    }, 2000)
  }
  async function revokeAll() {
    if (acting) return
    setActing('all'); setAllMsg('')
    try {
      const r = await fetch(API_P + '/browserctl-gate/revoke-all', { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (j && j.ok) {
        setAllMsg(t('sigCleared').replace('{s}', String(j.sessions || 0)).replace('{d}', String(j.devices || 0)).replace('{g}', String(j.grants || 0))
          + (j.records ? t('sigClearedRecords').replace('{n}', String(j.records)) : ''))
        await refetch(); await loadHealth()
      } else setAllMsg((j && j.error) || t('sigFail2'))
    } catch (e) { setAllMsg(t('sigFail2')) } finally { setActing(''); setAllConfirm(false) }
  }
  async function revoke(dev) {
    if (acting) return
    setActing(dev); setMsg('')
    try {
      // P4(2026-11-27):停止授权必须带 purge:1,否则闸机 _gate_kick 只撤密钥,
      // 设备档案 husk(name/ip/last_seen)留在注册表 → device_list 照旧列出,
      // 用户看到「已停止授权」但行不消失,分不清真/假解除。
      // 管理语义不放宽:桌面面板经 host gate 反代(/browserctl-gate/*)调用,
      // isLocalCall(本机回环且无转发头)时 host 自动附 X-BC-Admin,闸机 purge 分支
      // 才放行;远程面板无管理令牌自动降级为普通 kick(与「一键去重」同一通道)。
      // kb/06 #43 教训:异步操作必须核对响应,purged=false 绝不假报「已删除」。
      const r = await kickViaGate({ dev, purge: 1, onKicked: refetch })
      const j = (r && r.ok) ? await r.json().catch(() => ({})) : null
      if (r && r.ok) {
        if (j && j.purged) {
          // 本地先移除该行(kb/10 #6:状态变更后主动 refetch,不依赖重开页面)
          setData(d => d ? { ...d, device_list: (d.device_list || []).filter(x => x.dev !== dev) } : d)
          setMsg(t('sigRevokedPurged'))
        } else {
          // 旧版闸机(响应无 purged)/档案本就不存在:只停止授权,如实告知记录保留
          setMsg(t('sigRevokedKeep'))
        }
        await refetch()
      } else setMsg(t('sigFail2'))
    } catch (e) { setMsg(t('sigFail2')) } finally { setActing('') }
  }
  const dups = (() => {
    const list = (data && data.device_list) || []
    const groups = {}
    list.forEach(d => { const k = (d.name || '') + '|' + (d.ip || ''); (groups[k] = groups[k] || []).push(d) })
    const out = []
    Object.keys(groups).forEach(k => {
      const g = groups[k]
      if (g.length < 2) return
      const keep = g.slice().sort((a, b) => ((b.has_pubkey ? 1 : 0) - (a.has_pubkey ? 1 : 0)) || ((b.last_seen || 0) - (a.last_seen || 0)))[0]
      g.forEach(d => { if (d.dev !== keep.dev) out.push(d.dev) })
    })
    return out
  })()
  // P5 展示层自动去重(2026-11-27 用户反馈③):按 名称+IP 身份键归并同机重复档案
  // (kb/06 #43:踢出+重配对每次发新 dev id,husk 只增不减),列表只渲染每组保留行
  // (优先有公钥/最新一条),合并行带「重复 N 条」徽标;真删档仍走「一键去重」
  // (kick purge 契约,P4,逐台核对 purged 响应)。纯渲染层归并,不改闸机语义。
  const mergedDevs = (() => {
    const list = (data && data.device_list) || []
    const groups = new Map()
    for (const d of list) {
      const k = (d.name || '') + '|' + (d.ip || '')
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(d)
    }
    const out = []
    for (const g of groups.values()) {
      const face = g.slice().sort((a, b) => ((b.has_pubkey ? 1 : 0) - (a.has_pubkey ? 1 : 0)) || ((b.last_seen || 0) - (a.last_seen || 0)))[0]
      out.push({ ...face, _dupN: g.length })
    }
    return out
  })()
  async function dedupe() {
    if (acting || !dups.length) return
    setActing('dedupe'); setMsg(''); setDedupeConfirm(false)
    // 2026-11-24 去重修正:闸机 kick 只踢会话+作废密钥,档案 husk 留在注册表,
    // 去重后列表不变(「去重无用」)。改为带 purge:1 请求删档,并逐台核对响应:
    // 只有 purged=true 才算删掉;闸机未升级/非本机面板只 stop 授权时如实报差值。
    let delN = 0
    try {
      for (const dev of dups) {
        // kick 双通道统一走 kickViaGate,带 purge:1 删档(闸机 kick 只踢会话+作废密钥,
        // 档案 husk 留在注册表;purge 需新版闸机才真删,响应 purged=false 如实报差值)
        const r = await kickViaGate({ dev, purge: 1 })
        const j = (r && r.ok) ? await r.json().catch(() => ({})) : null
        if (j && j.ok && j.purged) delN += 1
      }
      setMsg(delN === dups.length
        ? t('sigDedupeDone').replace('{n}', String(delN))
        : t('sigDedupePart').replace('{ok}', String(delN)).replace('{n}', String(dups.length)))
      await refetch()
    } catch (e) { setMsg(t('sigFail2')) } finally { setActing('') }
  }
  const enforce = !!(data && data.enforce)
  // 就绪度快照:healthz 每 5s 轮询带回 sig_readiness(与闸机 _sig_readiness 同一口径)。
  const rd = (health && health.sig_readiness) || null
  return (
    <div className="dshBrowserCtlCard">
      <div className="dshBrowserCtlCardHead" data-open="true" style={{ cursor: 'default' }}>
        {Svg.shield}
        <span>{t('sigTitle')}</span>
        <span style={{
          fontWeight: 500, fontSize: 12,
          color: data ? (enforce ? 'var(--dsw-alias-state-success-primary,#34b371)' : 'var(--dsw-alias-label-tertiary,#8b8f98)') : 'inherit',
        }}>{data ? (enforce ? t('sigOn') : t('sigOff')) : t('sigLoading')}</span>
      </div>
      <div className="dshBrowserCtlCardBody dshBrowserCtlCardBodyTall" data-open="true">
        {data && (
          <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
            {t('sigCounts').replace('{d}', String(data.devices ?? 0)).replace('{k}', String(data.devices_with_key ?? 0)).replace('{p}', String(data.devices_with_pubkey ?? 0))}
          </p>
        )}
        <div className="dshBrowserCtlSwitchRow">
          <span className="dshBrowserCtlSwitchLabel">
            <span className="dshBrowserCtlSwitchTitle">{t('sigSwitchLabel')}</span>
            <span className="dshBrowserCtlSwitchHint">{t('sigSwitchHint')}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enforce}
            aria-label={t('sigSwitchLabel')}
            className="dshBrowserCtlSwitch"
            data-on={enforce ? 'true' : 'false'}
            data-busy={busy ? 'true' : 'false'}
            disabled={busy || !data}
            onClick={() => toggle(!enforce)}
          >
            <span className="dshBrowserCtlSwitchKnob" aria-hidden="true" />
            {busy && <span className="dshBrowserCtlSwitchBusy" aria-hidden="true" />}
          </button>
        </div>
        {rd && !rd.ready && (
          <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-state-warning-primary,#c78d33)' }}>
            {t('sigRdLock').replace('{w}', String(rd.recent_with_key)).replace('{t}', String(rd.recent_total)).replace('{n}', String(rd.remaining))}
          </p>
        )}
        {/* 就绪度行(P3):chip 可开启/未就绪随 rd 与 enforce */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="dshBrowserCtlDevInfo" style={{ flex: 1, minWidth: 0 }}>
            <div className="dshBrowserCtlDevTop">
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--dsw-alias-label-primary,inherit)' }}>{t('sigRdTitle')}</span>
            </div>
            <div className="dshBrowserCtlDevIp">{rd && rd.ready ? t('sigRdReady') : t('sigRdNotReady')}</div>
          </div>
          <span className="dshBrowserCtlKindTag" data-kind={data && (enforce || (rd && rd.ready)) ? 'app' : 'web'} style={{ margin: 0 }}>
            {data ? (enforce ? t('sigOn') : (rd && rd.ready ? t('sigRdCanOn') : t('sigOff'))) : t('sigLoading')}
          </span>
        </div>
        {confirming && (
          <div className="dshBrowserCtlActions" role="alertdialog" aria-label={t('sigYes')}>
            <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-state-warning-primary,#c78d33)' }}>{t('sigConfirm')}</p>
            <Button variant="primary" size="sm" disabled={busy} onClick={() => toggle(true)}>{t('sigYes')}</Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => setConfirming(false)}>{t('sigCancel')}</Button>
          </div>
        )}
        {/* 「设备凭证 (N) ▼」折叠行(P3;展开为独立滚动列表,不加框) */}
        {data && Array.isArray(data.device_list) && data.device_list.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <button type="button" className="dshBrowserCtlCardHead dshBrowserCtlFoldBtn" data-open={devsOpen ? 'true' : 'false'} onClick={() => setDevsOpen(o => !o)}>
              <span aria-hidden="true" style={{ display: 'inline-flex', flex: 'none', color: 'var(--dsw-alias-label-tertiary,#8b8f98)', transform: devsOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s ease' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{t('sigDevs')} ({data.device_list.length})</span>
              <span className="dshBrowserCtlCardStat" style={{ fontWeight: 400, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>{t('sigDevsHint')}</span>
            </button>
            {devsOpen && (
              <div className="dshBrowserCtlSigDevs">
                {mergedDevs.map(d => (
                  <div key={d.dev} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', border: '1px solid var(--dsw-alias-separator,#2a2c33)', borderRadius: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-primary,#e7e9ee)', flex: '0 1 auto', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {d.name || d.dev || t('sigUnnamed')}{d.online ? ' ' + t('sigOnlineTag') : ''}
                        </span>
                        {(d._dupN || 1) > 1 && (
                          <span className="dshBrowserCtlDupBadge">{t('dupBadge').replace('{n}', String(d._dupN))}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
                        {d.kind || '?'} · {d.ip || '?'} · {d.last_seen ? new Date(d.last_seen * 1000).toLocaleString() : '—'}
                      </div>
                    </div>
                    {/* 真/假解除可读性(P4):无密钥 husk 行明确标「已解除授权」,
                        不再只靠一个「无密钥」徽标让人猜;有密钥=已授权。 */}
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, flexShrink: 0, background: d.has_pubkey ? 'rgba(52,179,113,.16)' : (d.has_key ? 'rgba(61,126,255,.14)' : 'rgba(229,101,92,.14)'), color: d.has_pubkey ? '#34b371' : (d.has_key ? '#3d7eff' : '#e5655c') }}>
                      {d.has_pubkey ? t('sigHasPub') : (d.has_key ? t('sigHasKeyB') : t('sigRevokedBadge'))}
                    </span>
                    <Button variant="ghost" size="sm" className="dshBrowserCtlBtnDangerSoft" disabled={!!acting} onClick={() => revoke(d.dev)}>{acting === d.dev ? t('sigRevoking') : t('sigRevoke')}</Button>
                  </div>
                ))}
                {dups.length > 0 && (
                  dedupeConfirm ? (
                    <div className="dshBrowserCtlActions" role="alertdialog" aria-label={t('sigDedupeYes')}>
                      <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-state-warning-primary,#c78d33)' }}>{t('sigDedupeHint').replace('{n}', String(dups.length))}</p>
                      <Button variant="primary" size="sm" disabled={!!acting} onClick={dedupe}>{t('sigDedupeYes')}</Button>
                      <Button variant="secondary" size="sm" disabled={!!acting} onClick={() => setDedupeConfirm(false)}>{t('sigCancel')}</Button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
                      <Button variant="secondary" size="sm" disabled={!!acting} onClick={() => setDedupeConfirm(true)}>
                        {t('sigDedupe').replace('{n}', String(dups.length))}
                      </Button>
                    </div>
                  )
                )}
                {msg && (
                  <p style={{ margin: 0, fontSize: 12, textAlign: 'center', color: 'var(--dsw-alias-state-success-primary,#34b371)' }}>{msg}</p>
                )}
              </div>
            )}
          </div>
        )}
        {err && (
          <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-state-error-primary,#e5655c)' }}>{err}</p>
        )}
        {err && forceOpen && (
          <div className="dshBrowserCtlActions" role="alertdialog" aria-label={t('sigForceYes')}>
            <Button variant="primary" size="sm" disabled={busy} onClick={() => toggle(true, true)}>{t('sigForceYes')}</Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => { setErr(''); setForceOpen(false) }}>{t('sigCancel')}</Button>
          </div>
        )}
        {/* 「高级 ▼」折叠行(P7:健康行/重启闸机/清除所有授权/运维提示收纳,展开不加框)。
            5s 状态轮询在组件层,折叠状态下照跑。 */}
        <button
          type="button"
          className="dshBrowserCtlCardHead dshBrowserCtlFoldBtn"
          data-open={advOpen ? 'true' : 'false'}
          onClick={() => setAdvOpen(o => !o)}
          style={{ marginTop: 4 }}
        >
          <span aria-hidden="true" style={{ display: 'inline-flex', flex: 'none', color: 'var(--dsw-alias-label-tertiary,#8b8f98)', transform: advOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s ease' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{t('sigAdvanced')}</span>
          <span className="dshBrowserCtlCardStat" style={{ fontWeight: 400, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>{t('sigAdvancedHint')}</span>
        </button>
        {advOpen && (
          <>
            {health && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
                <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 999, flexShrink: 0, background: health.ok ? '#34b371' : '#e5655c' }} />
                {health.ok
                  ? <span>{t('sigHealthOk').replace('{e}', health.enforce ? t('sigHealthOn') : t('sigHealthOff')).replace('{n}', String(health.devices_with_pubkey)).replace('{s}', String(health.sessions))}</span>
                  : <span style={{ color: '#e5655c' }}>{t('sigHealthBad')}</span>}
                <span style={{ flex: 1 }} />
                <button type="button" className="dshBrowserCtlMiniBtn" onClick={loadHealth}>{t('pushRefresh')}</button>
                <button type="button" className="dshBrowserCtlMiniBtn dshBrowserCtlMiniBtnDanger" onClick={restartGate}>{restarting ? t('sigRestarting') : t('sigRestart')}</button>
              </div>
            )}
            {allConfirm ? (
              <div className="dshBrowserCtlActions" role="alertdialog" aria-label={t('sigRevokeAll')}>
                <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-state-error-primary,#e5655c)' }}>
                  {t('sigRevokeAllText')}
                </p>
                <Button variant="primary" size="sm" disabled={!!acting} onClick={revokeAll}>{acting === 'all' ? t('sigClearing') : t('sigRevokeAllDo')}</Button>
                <Button variant="secondary" size="sm" disabled={!!acting} onClick={() => setAllConfirm(false)}>{t('sigCancel')}</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="ghost" size="sm" className="dshBrowserCtlBtnDangerSoft" disabled={!!acting} onClick={() => { setAllConfirm(true); setAllMsg('') }}>{t('sigRevokeAll')}</Button>
              </div>
            )}
            {allMsg && (
              <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-label-secondary,#c9ccd4)' }}>{allMsg}</p>
            )}
            <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
              {t('sigHint')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}