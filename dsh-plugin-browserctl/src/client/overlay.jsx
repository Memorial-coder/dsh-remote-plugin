// ---------- 面板主浮层 BrowserCtlOverlay(7 页签 + 头部 + 弹窗编排) ----------
// 逐字搬移自 client.jsx,零逻辑改动;hook 调用顺序原样保留(smoke.cjs 以
// HOOK_OVERRIDE={3:tabId} 逐页签渲染,顺序即契约,绝不可重排)。

import { useState, useEffect, useRef } from 'react'
import { IS_TEST, lsGet, lsSet, msgIsSeen, API_P, VERSION } from './const.js'
import { useQr, useCountdown } from './hooks.js'
import { Svg } from './icons.jsx'
import { Button, BaseModal, MODAL_Z_PROMPT, MODAL_STACK } from './ui.jsx'
import { Tooltip, IconCloseOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import { DevicesSection } from './cards/devices.jsx'
import { LogCard } from './cards/log.jsx'
// BlacklistCard 已并入设备单卡分区(设备页「已封禁 IP」分区),不再挂载
import { PairLongSegment } from './cards/app-pair.jsx'
import { IosGuideCard } from './cards/ios-guide.jsx'
import { TotpCard } from './cards/totp.jsx'
import { SessionDaysCard } from './cards/session.jsx'
import { SigEnforceCard } from './cards/sig-enforce.jsx'
import { SysinfoCard } from './cards/sysinfo.jsx'
import { PushCard } from './cards/push.jsx'
import { UpdateApplyButton } from './cards/update.jsx'
import { AboutPanel, LegalDialog } from './cards/about.jsx'
import { ConfigPanel } from './cards/config.jsx'
import { LEGAL_TERMS, LEGAL_PRIVACY } from './legal.js'
import { AccountLoginModal } from './cards/account.jsx'
import { MsgCenter } from './cards/msg.jsx'
import { TicketModal } from './cards/ticket.jsx'

export function BrowserCtlOverlay({ useStore, actions, t, initialTab }) {
  const open = useStore(state => state.open)
  const [reloadToken, setReloadToken] = useState(0)
  const [copied, setCopied] = useState(false)
  // 全局忙碌标记:任一操作进行中,禁用面板内所有按钮,杜绝连点/排队/误触
  const [busy, setBusy] = useState('')
  // 顶部功能页签:connect / devices / totp / ban / log
  const [tab, setTab] = useState(initialTab || 'connect')
  // 配对码可用次数:1=一次性(扫完自动换码);>1 可多台设备共用同一个码
  const [uses, setUses] = useState(1)
  // 头部小浮层:关于 / 配置(点击头部图标按钮打开)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  // 顶栏「账号登录」弹窗 + 未登录启动远程时的提示
  const [accountOpen, setAccountOpen] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)
  // 工单反馈弹窗(独立浮层;内部复用 AccountLoginModal 处理未登录)
  const [ticketOpen, setTicketOpen] = useState(false)
  // 启动失败的具体原因(如「找不到 Python」)。以前只 console.error,界面什么都不显示,
  // 用户只看到「点了没反应」,所以这里必须把原因原样呈现出来。
  const [startErr, setStartErr] = useState('')
  // 提权(UAC)通道是否可用(只有 Windows 有);以及「该用提权补偿哪个动作」:
  // '' 不需要 / 'start' 启动失败后重试 / 'stop' 普通权限停不掉。
  // 提权按钮只在失败之后出现,点击才弹 UAC,绝不在启动时自动弹。
  const [canElevate, setCanElevate] = useState(false)
  const [elevNeed, setElevNeed] = useState('')
  // 顶栏账号按钮的登录态(登录后显示邮箱)
  const [acctMe, setAcctMe] = useState(null)
  // 顶栏「通知中心」:消息列表 + 登录态 + 服务端未读数(未登录未读走本地水位)
  const [msgData, setMsgData] = useState({ messages: [], loggedIn: false, unread: 0 })
  const [msgPopOpen, setMsgPopOpen] = useState(false)
  // 当前连接模式(official/selfhost),用于判断未登录时是否显示二维码
  const [cfgMode, setCfgMode] = useState('official')
  // 新版本提醒:打开面板时自动检查一次(只看插件自身版本,不再提示 App)
  const [updateInfo, setUpdateInfo] = useState(null)
  const [updTick, setUpdTick] = useState(0)   // 忽略后强制重渲染,收起弹窗/红点
  // 插件自身有新版本且该版本未被「忽略此版本」→ 关于按钮显示红点
  const pluginUpdatePending = !!(updateInfo && updateInfo.hasUpdate
    && updateInfo.latest && lsGet('dsh_plugin_upd_dismiss_' + updateInfo.latest) !== '1')
  // 本次打开面板已经提示过的版本:点 X / 点遮罩 = 稍后再说(下次打开面板还会提醒)
  const [updPromptClosed, setUpdPromptClosed] = useState('')
  // B2 新增 hooks(追加链尾,hook#3=tab 契约不动):
  // 连接页「扫码连接」卡的分段切换:'temp'=临时码(useQr 60s 一次性) / 'long'=长期码(pair-long 7 天)
  const [pairSeg, setPairSeg] = useState('temp')
  // 「配对设置(次数/换码)」折叠行
  const [pairSetOpen, setPairSetOpen] = useState(false)
  // 停止控制两段式 armed 确认(B2 破坏性动作确认补齐):false → 点一次进确认态 → 再点执行
  const [stopConfirm, setStopConfirm] = useState(false)
  // B2 头部收敛:「设置」弹层三分区(通用配置/关于与更新/协议与隐私)的开关 + 协议文档态
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [legalDoc, setLegalDoc] = useState(null)
  // 插件有新版本 → 弹提示弹窗(与「未登录提示」同款居中面板,不是横幅)
  // 不弹:清单版本永远 ≥ 正式版,对测试版弹「更新到正式版」是误导
  const pluginUpdPrompt = !!(pluginUpdatePending && open && !IS_TEST
    && (!updateInfo || updPromptClosed !== String(updateInfo.latest)))
  const pluginUpdNotes = (updateInfo && Array.isArray(updateInfo.notes) ? updateInfo.notes : []).slice(0, 3)
  const pluginUpdUrl = (updateInfo && updateInfo.downloadUrl) || ''
  const dismissPluginUpdate = () => {
    if (updateInfo && updateInfo.latest) {
      lsSet('dsh_plugin_upd_dismiss_' + updateInfo.latest, '1')
      setUpdTick(x => x + 1)
    }
  }
  const panel = useRef(null)
  const bellRef = useRef(null) // 通知中心铃铛锚点:下拉弹层按它实测坐标做 fixed 定位
  const { data, error, expiresAt, status, retrying, refresh } = useQr(open, reloadToken, uses)
  const left = useCountdown(expiresAt)
  const run = async (label, fn) => {
    if (busy) return
    setBusy(label)
    try { await fn() } finally { setBusy('') }
  }
  const refreshAll = () => run('refresh', async () => {
    await new Promise(r => setTimeout(r, 60))
    setReloadToken(x => x + 1)
  })
  const loadAcctMe = async () => {
    try {
      const r = await fetch(API_P + '/browserctl/api/server/me', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      setAcctMe(j && j.loggedIn ? j : null)
    } catch { setAcctMe(null) }
  }
  useEffect(() => { if (open) loadAcctMe() }, [open, reloadToken])
  // 通知中心:面板打开即拉一次,之后每 60s 轮询红点(与闸机 2 分钟心跳错开也够用);
  // 关闭下拉时再拉一次——刚在列表里标了已读,徽标要立即归零,不等下一轮询。
  const loadMsgs = async () => {
    try {
      const r = await fetch(API_P + '/browserctl/api/server/messages', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (j && j.ok) setMsgData({ messages: Array.isArray(j.messages) ? j.messages : [], loggedIn: !!j.loggedIn, unread: Number(j.unread) || 0 })
    } catch {}
  }
  useEffect(() => { if (open) loadMsgs() }, [open, reloadToken])
  useEffect(() => {
    if (!open) return
    const h = setInterval(loadMsgs, 60000)
    return () => clearInterval(h)
  }, [open])
  const closeMsgPop = () => { setMsgPopOpen(false); loadMsgs() }
  // 徽标:登录态用服务端未读数(与官网/App 跨端同步);未登录用本地水位数「新于水位的全员公告」。
  // 下拉开着时不显示红点(列表已在眼前)。
  const msgUnreadCount = msgData.loggedIn
    ? (msgData.unread || 0)
    : (msgData.messages || []).filter(m => !msgIsSeen(m)).length
  const msgShowDot = !msgPopOpen && msgUnreadCount > 0
  // 页面加载即查一次新版本(不等开面板):让「关于」按钮红点开箱可亮。
  // 同样检查(红点有意义);自动「弹窗」仍仅正式版(见 pluginUpdPrompt 的 !IS_TEST)。
  useEffect(() => {
    let cancelled = false
    fetch(API_P + '/browserctl/api/update-check', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (!cancelled && j) setUpdateInfo(j) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])
  // 打开面板时再查一次(复用「关于」里的 update-check 接口,含 App 发布信息),保证数据新鲜
  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch(API_P + '/browserctl/api/update-check', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (!cancelled && j) setUpdateInfo(j) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])
  // 加载连接模式(用于判断未登录时是否隐藏二维码)
  useEffect(() => {
    if (!open) return
    fetch(API_P + '/browserctl/api/config', { cache: 'no-store' })
      .then(r => r.json().then(j => {
        if (j && j.mode) setCfgMode(j.mode)
        if (j && typeof j.canElevate === 'boolean') setCanElevate(j.canElevate)
      }).catch(() => {}))
      .catch(() => {})
  }, [open])
  const startChain = async () => {
    // 官方模式且未登录 → 弹提示先去登录,不直接启动
    try {
      const c = await fetch(API_P + '/browserctl/api/config', { cache: 'no-store' }).then(r => r.json()).catch(() => ({}))
      if (c && c.mode === 'official') {
        const m = await fetch(API_P + '/browserctl/api/server/me', { cache: 'no-store' }).then(r => r.json()).catch(() => ({}))
        if (!(m && m.loggedIn)) { setLoginPrompt(true); return }
      }
    } catch {}
    setStartErr('') // 重新启动前清掉上一次的失败原因
    run('start', async () => {
      // Phase 1: 触发 ensure（偶发网络抖动/端口竞争时最多重试 3 次）
      let lastErr = ''
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const r = await fetch(API_P + '/browserctl/api/ensure', { cache: 'no-store' })
          const j = await r.json().catch(() => ({}))
          if (j && (j.ok || j.pending)) { lastErr = ''; break }
          lastErr = (j && j.error) || ('HTTP ' + r.status)
        } catch (e) {
          lastErr = String((e && e.message) || e)
        }
        if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 1000))
      }
      // Phase 2: ensure 已接受（ok 或 pending），轮询直到「闸机 3080 + frp 隧道」都真正就绪。
      // 只判断 forwarder 不够:browserctl.py start 现在会自己等最多 15s 到 frpc 日志出现
      // `start proxy success`,ensure 最长约 26s 才返回;并发点击时拿到 pending 的这一侧
      // 也可能要等到隧道就绪,所以这里给 30s 并把 status.tunnel.ok 一起当就绪条件。
      if (!lastErr) {
        const deadline = Date.now() + 30000
        let fwd = false
        let tunnelErr = ''
        while (Date.now() < deadline) {
          try {
            const r = await fetch(API_P + '/browserctl/api/status', { cache: 'no-store' })
            const j = await r.json().catch(() => ({}))
            fwd = !!j.forwarder
            const tun = j.tunnel
            // 旧闸机没有 tunnel 字段 → 视为就绪(保持旧行为,不拦老环境)
            const tunnelOk = !tun || tun.ok !== false
            if (!tunnelOk && tun && tun.error) tunnelErr = String(tun.error)
            if (fwd && tunnelOk) break
            // 后台 ensure 已经失败:立刻取回原因,不用空等到超时
            if (j.startError) { lastErr = String(j.startError); break }
          } catch { fwd = false }
          await new Promise(r => setTimeout(r, 300))
        }
        // 等满 30 秒还没起来:再探一次把原因取回来(以前这里直接放弃,
        // 面板就永远停在"隧道正在建立",用户看不到任何失败原因)
        if (!lastErr && !fwd) {
          try {
            const r = await fetch(API_P + '/browserctl/api/status', { cache: 'no-store' })
            const j = await r.json().catch(() => ({}))
            lastErr = String(j.startError || '')
              || (j.tunnel && j.tunnel.error ? String(j.tunnel.error) : '')
              || t('startTimeout')
          } catch {
            lastErr = t('startTimeoutShort')
          }
        }
        // 闸机在跑但 frp 隧道没连上:把 tunnel_error(多行中文,可能含 frpc 日志尾部)作为原因
        if (!lastErr && tunnelErr) lastErr = tunnelErr
      }
      if (lastErr) console.error('[browserctl] ensure 全部重试失败:', lastErr)
      setStartErr(lastErr)
      // 启动失败后把「以管理员身份启动」的入口放出来(典型原因:Defender/杀软按 PUA 拦
      // frpc.exe 导致 WinError 5 拒绝访问、状态文件被管理员进程占用)。只有用户点按钮
      // 才弹 UAC,不是启动时自动弹。
      setElevNeed(lastErr ? 'start' : '')
      await new Promise(r => setTimeout(r, 600))
      setReloadToken(x => x + 1)
    })
  }
  const stopChain = () => run('stop', async () => {
    // 停止浏览器控制:关闭整个穿透隧道(fwd/frpc/watchdog 全部结束),
    // 公网面板 URL 立即不可访问。
    try { await fetch(API_P + '/browserctl/api/stop', { cache: 'no-store' }) } catch {}
    // stop 是分离进程,命令返回时闸机可能还没关完(端口未释放)。
    // 必须轮询等到 3080 真正关闭再刷新二维码,否则旧二维码不消失、开始按钮不出现。
    const deadline = Date.now() + 12000
    let still = false
    for (;;) {
      let fwd = true
      try {
        const r = await fetch(API_P + '/browserctl/api/status', { cache: 'no-store' })
        const j = await r.json()
        fwd = !!j.forwarder
      } catch { fwd = false }
      if (!fwd) break
      if (Date.now() >= deadline) { still = true; break }
      await new Promise(r => setTimeout(r, 300))
    }
    // 12 秒了闸机还在跑:最常见原因是这套 fwd/frpc 是「以管理员身份」起的,
    // 普通权限的 DSH 杀不掉它(OpenProcess 拒绝访问 → taskkill 失败但没人报错)。
    // 这种情况下只能再走一次 UAC 提权停止。
    setElevNeed(still ? 'stop' : '')
    if (still) setStartErr(t('elevateStopHint'))
    await new Promise(r => setTimeout(r, 200))
    setReloadToken(x => x + 1)
  })
  // 「打开面板」:不能直接 window.open(data.panel)。裸面板 URL 在闸机侧是
  // 「裸 URL 一律拒绝」(2026-11-07 安全策略:2FA 关时也必须已配对)——浏览器拿到的是
  // <title>403</title> 的纯黑页,而桌面浏览器没有任何获取会话的入口(手机走扫码、
  // iOS 走引导链接)。这里改为:点击 → 开一个新标签 → 现取一条一次性引导链接
  // (/link → 闸机 bootstrap?k=)写进该标签:闸机种下 30 天会话 Cookie 后 302 回面板根
  // (2FA 开启时先显示动态码验证页,验证一次同样 30 天免登)。
  // 必须先同步 window.open 再异步 fetch:否则经过 await 后再开窗会被弹窗拦截器吞掉。
  const openPanelChain = () => run('open', async () => {
    const w = window.open('', '_blank')
    const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
    const fail = (msg) => {
      try {
        if (w && !w.closed) {
          w.document.title = t('openFailed')
          w.document.body.style.cssText = 'margin:0;background:#141519;color:#d8dade;' +
            "font-family:system-ui,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh"
          w.document.body.innerHTML =
            '<div style="max-width:460px;padding:0 24px;text-align:center">' +
            '<div style="font-size:15px;margin-bottom:10px">' + esc(t('openFailed')) + '</div>' +
            '<div style="font-size:12px;line-height:1.7;opacity:.75;white-space:pre-wrap;text-align:left">' + esc(msg) + '</div>' +
            '</div>'
        }
      } catch {}
    }
    try {
      const r = await fetch(API_P + '/browserctl/api/link?ttl=600&uses=1', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.url) { fail((j && j.error) || ('HTTP ' + r.status)); return }
      if (w && !w.closed) w.location.href = j.url
      else window.open(j.url, '_blank')
    } catch (e) {
      fail(String((e && e.message) || e))
    }
  })
  // 提权启动/停止:只在用户点按钮后触发,requested 是 'start' 或 'stop'。
  // 提权进程是分离的,接口只回 UAC 的结果;真正是否起来由这里轮询 /status 判断。
  const elevateChain = (requested) => run('elevate', async () => {
    const act = requested === 'stop' ? 'stop' : 'start'
    let lastErr = ''
    try {
      const r = await fetch(API_P + '/browserctl/api/elevate?action=' + act, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!j || !j.ok) lastErr = (j && j.error) || ('HTTP ' + r.status)
    } catch (e) {
      lastErr = String((e && e.message) || e)
    }
    if (!lastErr) {
      // 管理员进程起来后要重新读 state:start 等 3080 + tunnel 都就绪,stop 等 3080 关闭。
      const wantUp = act === 'start'
      const deadline = Date.now() + 45000
      let fwd = !wantUp
      while (Date.now() < deadline) {
        try {
          const j = await fetch(API_P + '/browserctl/api/status', { cache: 'no-store' }).then(x => x.json())
          fwd = !!j.forwarder
          const tun = j.tunnel
          const tunnelOk = !tun || tun.ok !== false
          if (wantUp ? (fwd && tunnelOk) : !fwd) break
          if (wantUp && j.startError) { lastErr = String(j.startError); break }
        } catch { fwd = false }
        await new Promise(r => setTimeout(r, 400))
      }
      if (!lastErr && wantUp && !fwd) {
        lastErr = t('elevateStartTimeout')
      }
      if (!lastErr && !wantUp && fwd) {
        lastErr = t('elevateStopTimeout')
      }
    }
    setStartErr(lastErr)
    setElevNeed(lastErr ? act : '')
    await new Promise(r => setTimeout(r, 400))
    setReloadToken(x => x + 1)
  })

  useEffect(() => {
    if (!open) return
    panel.current?.querySelector('button')?.focus()
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      // Esc 清单驱动(B1):BaseModal 挂载即入 MODAL_STACK,栈顶 = 最后打开的弹窗,
      // 关掉它即可;不再逐个硬编码弹窗布尔值(新增弹窗忘加分支的老坑消除)。
      if (MODAL_STACK.length) { MODAL_STACK[MODAL_STACK.length - 1].close(); return }
      if (msgPopOpen) { closeMsgPop(); return }
      if (document.querySelectorAll('[role="dialog"]').length > 1) return
      actions.close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [actions, open, aboutOpen, configOpen, accountOpen, loginPrompt, ticketOpen, msgPopOpen, settingsOpen, legalDoc])

  // 心跳保活:面板一打开(任意页签)就每 2 分钟向闸机报一次活动,
  // "在线设备"卡片据此判断谁还在线;关闭面板即停止上报,10 分钟后自动转为历史设备。
  useEffect(() => {
    if (!open) return
    let alive = true
    const beat = () => fetch(API_P + '/browserctl-gate/heartbeat', { cache: 'no-store' }).catch(() => {})
    beat().then(() => { if (alive) setTimeout(() => setReloadToken(x => x + 1), 400) })
    const hb = setInterval(beat, 120000)
    return () => { alive = false; clearInterval(hb) }
  }, [open])

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(id)
  }, [copied])

  // 停止控制 armed 确认自动复位(与设备卡 kickConfirm 同口径 2.6s)
  useEffect(() => {
    if (!stopConfirm) return
    const id = setTimeout(() => setStopConfirm(false), 2600)
    return () => clearTimeout(id)
  }, [stopConfirm])

  const gating = !!busy
  // B2 信息架构:7 tab→5 tab(连接/设备/安全/通知/排障)。
  // 原 2FA(App 配对页签)→安全;App 配对→长期码并入连接页 + 已配对手机并入设备页
  // (迁移在后续 commit 逐块完成,此处先保证功能可达);黑名单→设备页;主机遥测→排障页。
  const TABS = [
    { id: 'connect', icon: 'link', label: t('tabConnect') },
    { id: 'devices', icon: 'desk', label: t('tabDevices') },
    { id: 'security', icon: 'lock', label: t('tabSecurity') },
    { id: 'push', icon: 'bell', label: t('tabPush') },
    { id: 'log', icon: 'clip', label: t('tabLog') },
  ]
  if (!open) return null
  return (
    <div className="dshBrowserCtlOverlay" role="dialog" aria-modal="true" aria-label={t('tab')}>
      <button className="dshBrowserCtlOverlayMask" type="button" aria-label={t('close')} onClick={() => actions.close()} />
      <section ref={panel} className="dshBrowserCtlPanel">
        <header className="dshBrowserCtlHeader">
          <div>
            <h1>{t('tab')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          {busy && (
            <span style={{ fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary,#8b8f98)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="dshBrowserCtlSpinner" aria-hidden="true" />
              {busy === 'start' ? t('starting') : busy === 'stop' ? t('stopping') : t('refresh') + '…'}
            </span>
          )}
          <Tooltip label={acctMe ? (acctMe.email || t('configAcctTitle')) : t('aboutAccount')}>
            <Button
              variant="ghost"
              size="sm"
              className="dshBrowserCtlHeaderAcct"
              aria-label={t('configAcctTitle')}
              data-logged-in={acctMe ? 'true' : 'false'}
              onClick={() => setAccountOpen(true)}
            >
              <span aria-hidden="true">{Svg.person}</span>
              <span className="dshBrowserCtlHeaderAcctLabel">
                {acctMe ? (acctMe.email || t('aboutAccountLogged')) : t('aboutAccount')}
              </span>
            </Button>
          </Tooltip>
          <Tooltip label={t('tickets')}>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('tickets')}
              icon={Svg.ticket}
              onClick={() => setTicketOpen(true)}
            />
          </Tooltip>
          <Tooltip label={t('msgCenter')}>
            <span ref={bellRef} className="dshBrowserCtlAboutBtn">
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('msgCenter')}
                aria-haspopup="dialog"
                aria-expanded={msgPopOpen}
                icon={Svg.bellHead}
                onClick={() => (msgPopOpen ? closeMsgPop() : setMsgPopOpen(true))}
              />
              {msgShowDot && <span className="dshBrowserCtlBadgeDot" />}
              {msgPopOpen && (
                <MsgCenter t={t} loggedInHint={t('msgGuestHint')} onClose={closeMsgPop} anchorRef={bellRef} />
              )}
            </span>
          </Tooltip>
          <Tooltip label={t('settingsTitle')}>
            <span className="dshBrowserCtlAboutBtn">
              <Button variant="ghost" size="sm" aria-label={t('settingsTitle')} icon={Svg.gear} onClick={() => setSettingsOpen(true)} />
              {pluginUpdatePending && <span className="dshBrowserCtlBadgeDot" />}
            </span>
          </Tooltip>
          <Tooltip label={t('close')}>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('close')}
              icon={<IconCloseOutlineRegular />}
              onClick={() => actions.close()}
            />
          </Tooltip>
        </header>
        <div
          className="dshBrowserCtlStatus"
          data-ok={data ? (data.forwarder === false ? 'wait' : 'true') : (busy === 'start' || retrying ? 'wait' : (error ? 'false' : 'wait'))}
        >
          {data
            ? (data.forwarder === false ? t('statusTunnelStarting') : t('statusReady'))
            : (busy === 'start' ? t('starting') : (retrying ? t('statusTunnelBuilding') : (error ? t('statusNoSecret') : t('statusLoading'))))}
          {error && busy !== 'start' && !retrying ? <span title={error} style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{error}</span> : null}
        </div>
        <div className="dshBrowserCtlTabs">
          {TABS.map(tb => (
            <button
              key={tb.id}
              type="button"
              className="dshBrowserCtlTab"
              data-active={tab === tb.id ? 'true' : 'false'}
              disabled={gating}
              onClick={() => setTab(tb.id)}
            >
              <span aria-hidden="true">{Svg[tb.icon]}</span>
              <span>{tb.label}</span>
            </button>
          ))}
        </div>
        <div className="dshBrowserCtlTabBody">
          {tab === 'connect' && (
            <>
              {/* ---- 卡 1:扫码连接(P1;分段切换 临时码/长期码) ---- */}
              <div className="dshBrowserCtlCard">
                <div className="dshBrowserCtlCardHead" style={{ cursor: 'default' }}>
                  {Svg.link}
                  <span>{t('connScanTitle')}</span>
                  <span className="dshBrowserCtlCardStat" style={{ color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
                    {pairSeg === 'temp'
                      ? (left > 0 ? t('pairLeft') + ' ' + left + 's' : (data && data.once ? t('pairExpired') : ''))
                      : t('appReady')}
                  </span>
                </div>
                <div className="dshBrowserCtlCardBody dshBrowserCtlCardBodyTall" data-open="true">
                  {/* 分段切换:临时码(useQr pair,60s 一次性)/ 长期码(pair-long,7 天)。
                      两个 grant 的 pair-status 轮询不能合并成一次请求(host 无聚合端点):
                      临时码由 useQr 的 1.5s 轮询负责(跨 tab 常跑红线),长期码只在
                      本段激活时挂载轮询(PairLongSegment 卸载即停),节奏各自 1.5s 原样。 */}
                  <div style={{ display: 'flex', background: 'var(--dsw-alias-bg-layer-1,rgba(255,255,255,0.05))', borderRadius: 9, padding: 3, gap: 3 }}>
                    {[['temp', t('pairSegTemp')], ['long', t('pairSegLong')]].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPairSeg(id)}
                        style={{
                          flex: 1, border: 'none',
                          /* 选中态圆角 = 容器 radius 9 − padding 3 = 6px(styles.js .dshBrowserCtlTab 同口径) */
                          borderRadius: 6, padding: '6px 0', fontSize: 12,
                          fontWeight: pairSeg === id ? 600 : 500, cursor: 'pointer',
                          background: pairSeg === id ? 'var(--dsw-alias-bg-layer-3,#333947)' : 'transparent',
                          color: pairSeg === id ? 'var(--dsw-alias-label-primary,inherit)' : 'var(--dsw-alias-label-tertiary,#8b8f98)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {pairSeg === 'temp' ? (
                    data && data.svg ? (
                      cfgMode === 'official' && !acctMe ? (
                        <div className="dshBrowserCtlQrBox" style={{ height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#666', fontSize: 12, padding: '0 14px', textAlign: 'center' }}>
                            {t('loginRequiredDesc')}
                          </span>
                        </div>
                      ) : (
                      <div>
                        <div className="dshBrowserCtlQrBox">
                          <img alt={t('qrAlt')} src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data.svg)} />
                        </div>
                        <p style={{
                          margin: '4px 0 0', fontSize: 12, textAlign: 'center',
                          color: left > 0 ? 'var(--dsw-alias-label-tertiary,#8b8f98)' : 'var(--dsw-alias-state-error-primary,#e5655c)',
                        }}>
                          {left > 0
                            ? <span>
                                {status && status.uses > 1
                                  ? <span style={{ color: 'var(--dsw-alias-label-secondary,#666)' }}>{t('pairUses')} {status.remaining}/{status.uses} · </span>
                                  : <span>{t('pairOnce')} · </span>}
                                <span style={{ color: left <= 10 ? 'var(--dsw-alias-state-error-primary,#e5655c)' : 'inherit' }}>{t('pairLeft')} {left}s</span>
                              </span>
                            : (data.once ? <span>{t('pairExpired')}</span> : <span style={{ color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>{t('pairStatic')}</span>)}
                        </p>
                        {data.once ? (
                          <p style={{ margin: '4px 0 0', fontSize: 11, textAlign: 'center', color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
                            {t('pairAppTempNote')}
                          </p>
                        ) : null}
                      </div>
                      )
                    ) : (
                      <div className="dshBrowserCtlQrBox" style={{ height: 128 }}>
                        {busy === 'start' ? (
                          <span className="dshBrowserCtlQrLoading">
                            <span className="dshBrowserCtlSpinner" aria-hidden="true" />
                            {t('starting')}
                          </span>
                        ) : retrying ? (
                          // 隧道正在自愈:自动轮询中,二维码一就绪就会出现,不需要用户再点一次
                          <span className="dshBrowserCtlQrLoading">
                            <span className="dshBrowserCtlSpinner" aria-hidden="true" />
                            {t('statusTunnelBuilding')}
                          </span>
                        ) : startErr ? (
                          <span style={{
                            color: 'var(--dsw-alias-state-error-primary,#e5655c)', fontSize: 11,
                            padding: '0 12px', textAlign: 'left', whiteSpace: 'pre-wrap',
                            overflowY: 'auto', maxHeight: 120, lineHeight: 1.5, display: 'block',
                          }}>
                            {t('startFailed')}{'\n'}{startErr}
                          </span>
                        ) : error ? (
                          // 二维码/配对接口失败(最常见:frp 隧道未连通,host 半直接回 503)时
                          // 把原因原文显示在二维码位置,而不是只显示一句"没有可用链接"让用户猜。
                          <span style={{
                            color: 'var(--dsw-alias-state-error-primary,#e5655c)', fontSize: 11,
                            padding: '0 12px', textAlign: 'left', whiteSpace: 'pre-wrap',
                            overflowY: 'auto', maxHeight: 120, lineHeight: 1.5, display: 'block',
                          }}>
                            {error}
                          </span>
                        ) : (
                          <span style={{ color: '#666', fontSize: 12, padding: '0 14px', textAlign: 'center' }}>
                            {t('statusLoading')}
                          </span>
                        )}
                      </div>
                    )
                  ) : (
                    <PairLongSegment t={t} reloadToken={reloadToken} />
                  )}
                  {pairSeg === 'temp' && data && !(cfgMode === 'official' && !acctMe) && (
                    <div className="dshBrowserCtlUrlRow">
                      <div className="dshBrowserCtlUrl" title={data.url}>{data.url}</div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        navigator.clipboard?.writeText(data.url).then(() => setCopied(true)).catch(() => {})
                      }}>{copied ? t('copied') : t('copyLink')}</Button>
                    </div>
                  )}
                </div>
              </div>
              {/* ---- 卡 2:动作条(P1 btn-grid:开始控制/刷新/打开面板/停止控制) ---- */}
              <div className="dshBrowserCtlCard" style={{ padding: 12 }}>
                <div className="dshBrowserCtlActions">
                  {!data && (
                    <Button variant="primary" size="sm" disabled={gating} onClick={startChain}>
                      {busy === 'start'
                        ? (<><span className="dshBrowserCtlSpinner" aria-hidden="true" /> {t('starting')}</>)
                        : t('startCtl')}
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" disabled={gating} onClick={refreshAll}>
                    {busy === 'refresh' ? t('refresh') + '…' : t('refresh')}
                  </Button>
                  {data && data.panel && !(cfgMode === 'official' && !acctMe) && (
                    <Button variant="primary" size="sm" disabled={gating} onClick={openPanelChain}>
                      {busy === 'open'
                        ? (<><span className="dshBrowserCtlSpinner" aria-hidden="true" /> {t('opening')}</>)
                        : t('openPanel')}
                    </Button>
                  )}
                  {data && !data.panel && !(cfgMode === 'official' && !acctMe) && (
                    <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)', display: 'inline-flex', alignItems: 'center' }}>{t('loginRequired')}</span>
                  )}
                  {data && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="dshBrowserCtlBtnDanger"
                      disabled={gating}
                      onClick={() => {
                        // B2 破坏性动作确认补齐:停止控制两段式 armed(第一次点击进确认态,再点执行)
                        if (!stopConfirm) { setStopConfirm(true); return }
                        setStopConfirm(false)
                        stopChain()
                      }}
                    >
                      {busy === 'stop'
                        ? (<><span className="dshBrowserCtlSpinner" aria-hidden="true" /> {t('stopping')}</>)
                        : (stopConfirm ? t('stopCtlConfirm') : t('stopCtl'))}
                    </Button>
                  )}
                </div>
              </div>
              {/* ---- 折叠行:配对设置(次数 / 换码)——chevron 分隔行,展开不加框 ---- */}
              {data && data.grant && !(cfgMode === 'official' && !acctMe) && (
                <>
                  <button
                    type="button"
                    className="dshBrowserCtlCardHead dshBrowserCtlFoldBtn"
                    data-open={pairSetOpen ? 'true' : 'false'}
                    onClick={() => setPairSetOpen(o => !o)}
                  >
                    <span aria-hidden="true" style={{ display: 'inline-flex', flex: 'none', color: 'var(--dsw-alias-label-tertiary,#8b8f98)', transform: pairSetOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s ease' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{t('pairSettingsTitle')}</span>
                    <span className="dshBrowserCtlCardStat" style={{ fontWeight: 400 }}>
                      {uses === 1 ? t('pairUsesOne') : uses + ' ' + t('pairUsesTimes')}
                    </span>
                  </button>
                  {pairSetOpen && (
                    <div className="dshBrowserCtlUrlRow" style={{ gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)', whiteSpace: 'nowrap' }}>{t('pairUsesLabel')}</span>
                      <select
                        value={uses}
                        disabled={gating}
                        onChange={e => setUses(parseInt(e.target.value, 10) || 1)}
                        style={{
                          fontSize: 12, padding: '2px 4px', borderRadius: 6,
                          border: '1px solid rgba(128,128,128,.35)', background: 'transparent',
                          color: 'inherit', flex: 'none',
                        }}
                      >
                        {[1, 2, 3, 5, 10].map(n => (
                          <option key={n} value={n}>{n === 1 ? t('pairUsesOne') : n + ' ' + t('pairUsesTimes')}</option>
                        ))}
                      </select>
                      <Button variant="ghost" size="sm" disabled={gating} onClick={refresh}>{t('pairSwap')}</Button>
                    </div>
                  )}
                </>
              )}
              <IosGuideCard t={t} />
              {elevNeed && canElevate && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  margin: '8px 0 0', flex: '0 0 auto',
                }}>
                  <span style={{
                    fontSize: 11, lineHeight: 1.5, textAlign: 'center',
                    color: 'var(--dsw-alias-state-error-primary,#e5655c)',
                  }}>
                    {elevNeed === 'stop' ? t('elevateStopHint') : t('elevateHint')}
                  </span>
                  <Button variant="secondary" size="sm" disabled={gating} onClick={() => elevateChain(elevNeed)}>
                    {busy === 'elevate'
                      ? (<><span className="dshBrowserCtlSpinner" aria-hidden="true" /> {t('elevating')}</>)
                      : (elevNeed === 'stop' ? t('elevateStop') : t('elevateStart'))}
                  </Button>
                </div>
              )}
            </>
          )}
          {tab === 'devices' && (
            // B2 单卡分区版:在线/历史/已封禁 IP(+添加)/已配对手机 全并入 DevicesSection
            <DevicesSection t={t} reloadToken={reloadToken} onRefresh={() => setReloadToken(x => x + 1)} disabled={gating} />
          )}
          {tab === 'security' && (
            <>
              <TotpCard t={t} reloadToken={reloadToken} onRefresh={() => setReloadToken(x => x + 1)} disabled={gating} />
              <SessionDaysCard t={t} disabled={gating} />
              <SigEnforceCard t={t} reloadToken={reloadToken} />
            </>
          )}
          {tab === 'push' && (
            <PushCard t={t} reloadToken={reloadToken} />
          )}
          {tab === 'log' && (
            <>
              <SysinfoCard t={t} />
              <LogCard t={t} reloadToken={reloadToken} />
            </>
          )}
        </div>
      </section>
      {/* ---- B2 头部收敛:「设置」三分区(P6)----
          通用配置=ConfigPanel / 关于与更新=AboutPanel+UpdateApplyButton / 协议与隐私=LegalDialog。
          ConfigPanel/AboutPanel 属 B3 写域,本批次不内联其内容,先以分区行入口打开既有弹层
          (嵌套 BaseModal 自动入 MODAL_STACK,Esc 关最上层);协议与隐私行直接接 LegalDialog。 */}
      {settingsOpen && (
        <BaseModal t={t} title={t('settingsTitle')} onClose={() => setSettingsOpen(false)} className="dshBrowserCtlPanelNested">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '6px 0 2px', fontSize: 12, fontWeight: 600, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>{t('settingsGeneral')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderTop: '1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.05))' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t('settingsCfgRow')}</div>
                <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)', marginTop: 3 }}>
                  {cfgMode === 'official' ? t('configOfficial') : t('configSelfhost')}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setConfigOpen(true)}>{t('config')}</Button>
            </div>
            <div style={{ padding: '8px 0 2px', fontSize: 12, fontWeight: 600, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>{t('settingsAboutSec')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderTop: '1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.05))' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t('updateCur')}</div>
                <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)', marginTop: 3 }}>v{typeof VERSION === 'string' ? VERSION : ''}</div>
              </div>
              <span className="dshBrowserCtlAboutBtn">
                <Button variant="secondary" size="sm" onClick={() => setAboutOpen(true)}>{t('about')}</Button>
                {pluginUpdatePending && <span className="dshBrowserCtlBadgeDot" />}
              </span>
            </div>
            <div style={{ padding: '8px 0 2px', fontSize: 12, fontWeight: 600, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>{t('settingsLegalSec')}</div>
            {[LEGAL_TERMS, LEGAL_PRIVACY].map(doc => (
              <button
                key={doc.title}
                type="button"
                onClick={() => setLegalDoc(doc)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box', padding: '10px 0', border: 'none', borderTop: '1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.05))', background: 'transparent', color: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ flex: 1 }}>{doc.title}</span>
                <span aria-hidden="true" style={{ color: 'var(--dsw-alias-label-tertiary,#8b8f98)', display: 'inline-flex' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 2.5 8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
          {legalDoc && <LegalDialog t={t} doc={legalDoc} onClose={() => setLegalDoc(null)} />}
        </BaseModal>
      )}
      {aboutOpen && <AboutPanel t={t} onClose={() => setAboutOpen(false)} initialResult={updateInfo} onDismissUpdate={dismissPluginUpdate} onCheckResult={setUpdateInfo} />}
      {configOpen && <ConfigPanel t={t} onClose={() => setConfigOpen(false)} onSaved={refreshAll} />}
      {accountOpen && (
        <AccountLoginModal t={t} onClose={() => setAccountOpen(false)} onSaved={refreshAll} />
      )}
      {ticketOpen && (
        <TicketModal t={t} onClose={() => setTicketOpen(false)} />
      )}
      {loginPrompt && (
        <BaseModal t={t} title={t('loginRequired')} onClose={() => setLoginPrompt(false)} overlayClassName="dshBrowserCtlLoginPrompt" z={MODAL_Z_PROMPT}>
            <div className="dshBrowserCtlLoginPromptBody">
              <p className="dshBrowserCtlLoginPromptText">{t('loginRequiredDesc')}</p>
              <div className="dshBrowserCtlLoginPromptActions">
                <Button variant="secondary" size="sm" onClick={() => setLoginPrompt(false)}>
                  {t('cancel')}
                </Button>
                <Button variant="primary" size="sm" onClick={() => { setLoginPrompt(false); setAccountOpen(true) }}>
                  {t('aboutAccount')}
                </Button>
              </div>
            </div>
        </BaseModal>
      )}
      {pluginUpdPrompt && updateInfo && (
        <BaseModal
          t={t}
          title={t('pluginUpdTitle').replace('{v}', String(updateInfo.latest))}
          onClose={() => setUpdPromptClosed(String(updateInfo.latest))}
          overlayClassName="dshBrowserCtlLoginPrompt"
          z={MODAL_Z_PROMPT}
        >
            <div className="dshBrowserCtlLoginPromptBody">
              <p className="dshBrowserCtlLoginPromptText">
                {t('pluginUpdDesc').replace('{cur}', String(updateInfo.current || '')).replace('{v}', String(updateInfo.latest))}
              </p>
              {pluginUpdNotes.length > 0 && (
                <ul className="dshBrowserCtlUpdNotes">
                  {pluginUpdNotes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              )}
              <div className="dshBrowserCtlLoginPromptActions">
                <Tooltip label={t('updateIgnoreTip')}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { dismissPluginUpdate(); setUpdPromptClosed(String(updateInfo.latest)) }}
                  >
                    {t('updateIgnore')}
                  </Button>
                </Tooltip>
                {updateInfo.install && updateInfo.install.form === 'local' && !IS_TEST && (
                  <UpdateApplyButton t={t} latest={String(updateInfo.latest)} variant="primary" onApplied={dismissPluginUpdate} />
                )}
                <Tooltip label={t('updateDownloadTip')}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setUpdPromptClosed(String(updateInfo.latest))
                      if (pluginUpdUrl) window.open(pluginUpdUrl, '_blank')
                    }}
                  >
                    {t('updateDownload')}
                  </Button>
                </Tooltip>
              </div>
            </div>
        </BaseModal>
      )}
    </div>
  )
}