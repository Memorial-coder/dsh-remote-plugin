// ---------- 官方账号卡(设备授权流登录/注册/退出)+ 账号登录弹窗 ----------
// 纯搬移自 client.jsx,零逻辑改动。账号密码不在插件内出现。

import { useState, useEffect, useRef } from 'react'
import { API_P } from '../const.js'
import { useToast } from '../hooks.js'
import { Button, BaseModal } from '../ui.jsx'

// 官方多用户账号卡:设备授权流(RFC 8628)登录/注册/退出。
// 点「登录」→ host 拿 device_code → 打开浏览器跳官网授权页 → 用户在网页登录/注册并
// 确认 → 这里轮询 /server/oauth/poll 换 token(host 落 per-user 密钥与端口),随后
// 重启隧道(stop+ensure)让 frpc 用新端口重新拨号。账号密码不在插件内出现。
export function OfficialAccountCard({ t, onSaved }) {
  const [acct, setAcct] = useState(null)        // /server/me 或 config.account 的合并视图
  const [busy, setBusy] = useState('')          // '' | 'begin' | 'logout'
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [pending, setPending] = useState(null)  // {deviceCode, userCode, verificationUri, interval}
  const pollTimer = useRef(null)
  const pendingRef = useRef(null)                 // 闭包安全:poll 读这个而非 pending(state 跨 render 会变)
  const [copiedOauth, setCopiedOauth] = useToast(1600) // B1 useToast
  // 账号密码登录(与「设备授权」并存)
  const [pwdEmail, setPwdEmail] = useState('')
  const [pwdPass, setPwdPass] = useState('')
  const [busyLogin, setBusyLogin] = useState(false)
  const pwdLogin = async () => {
    if (busyLogin || !pwdEmail.trim() || !pwdPass) return
    setBusyLogin(true); setErr(''); setMsg('')
    try {
      const r = await fetch(API_P + '/browserctl/api/server/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: pwdEmail.trim(), password: pwdPass }),
        cache: 'no-store',
      })
      const j = await r.json().catch(() => ({}))
      if (j && j.ok) {
        setMsg(t('configAcctOauthDone'))
        setPwdEmail(''); setPwdPass('')
        onSaved()
        const okRestart = await restartTunnel()
        if (!okRestart) { setErr(t('configAcctRestartFail')); setMsg('') }
      } else {
        setErr((j && j.error) || ('HTTP ' + r.status))
      }
    } catch (e) {
      setErr(String((e && e.message) || e))
    }
    setBusyLogin(false)
  }

  const loadAcct = async () => {
    try {
      const r = await fetch(API_P + '/browserctl/api/server/me', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (j && j.loggedIn) {
        setAcct({ email: j.email, remotePort: j.remotePort, status: j.status })
      } else if (j && j.ok === false && j.error) {
        setErr(t('configAcctLoadFail'))
      } else {
        setAcct(null)
      }
    } catch (e) {
      setErr(t('configAcctLoadFail'))
    }
  }
  useEffect(() => { loadAcct() }, [])

  const clearPoll = () => {
    if (pollTimer.current) { clearTimeout(pollTimer.current); pollTimer.current = null }
    pendingRef.current = null
  }
  useEffect(() => () => clearPoll(), [])

  const restartTunnel = async () => {
    try {
      await fetch(API_P + '/browserctl/api/stop', { method: 'POST', cache: 'no-store' })
      await new Promise(r => setTimeout(r, 1500))
      await fetch(API_P + '/browserctl/api/ensure', { method: 'POST', cache: 'no-store' })
      return true
    } catch (e) {
      return false
    }
  }

  const openAuthPage = async (url) => {
    if (!url) return false
    try {
      const r = await fetch(API_P + '/browserctl/api/server/oauth/open?url=' + encodeURIComponent(url), { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) {
        setErr((j && j.error) || t('configAcctOauthOpenFail'))
        return false
      }
      setErr('')
      return true
    } catch (e) {
      setErr(t('configAcctOauthOpenFail'))
      return false
    }
  }

  const copyOauthUrl = (url) => {
    if (!url) return
    navigator.clipboard?.writeText(url).then(() => setCopiedOauth(true)).catch(() => {})
  }

  const poll = async () => {
    const pd = pendingRef.current
    if (!pd) return
    try {
      const r = await fetch(API_P + '/browserctl/api/server/oauth/poll?device_code=' + encodeURIComponent(pd.deviceCode), { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (j && j.ok) {
        clearPoll()
        setPending(null)
        pendingRef.current = null
        setAcct({ email: j.email, remotePort: j.remotePort })
        setMsg(t('configAcctOauthDone'))
        onSaved()
        const okRestart = await restartTunnel()
        if (!okRestart) { setErr(t('configAcctRestartFail')); setMsg('') }
        setBusy('')
        return
      }
      if (j && j.pending) {
        const interval = Math.max(3, Number(j.interval) || 5) * 1000
        pollTimer.current = setTimeout(poll, interval)
        return
      }
      // 失败/过期/拒绝
      clearPoll()
      setPending(null); setBusy('')
      setErr(j && j.error ? (t('configAcctOauthFail') + ' ' + j.error) : t('configAcctOauthExpired'))
    } catch (e) {
      clearPoll()
      setPending(null); setBusy('')
      setErr(t('configAcctOauthNetwork'))
    }
  }

  const startOAuth = async () => {
    if (busy) return
    setErr(''); setMsg('')
    setBusy('begin')
    try {
      const r = await fetch(API_P + '/browserctl/api/server/oauth/begin', { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) {
        setErr(j.error || ('HTTP ' + r.status))
        setBusy('')
        return
      }
      setPending({
        deviceCode: j.deviceCode,
        userCode: j.userCode,
        verificationUri: j.verificationUri,
        interval: Math.max(3, Number(j.interval) || 5),
      })
      pendingRef.current = { deviceCode: j.deviceCode, userCode: j.userCode, verificationUri: j.verificationUri }
      setBusy('polling')
      await openAuthPage(j.verificationUri)
      pollTimer.current = setTimeout(poll, 1500)
    } catch (e) {
      setErr(t('configAcctOauthNetwork'))
      setBusy('')
    }
  }

  const cancelOAuth = () => {
    clearPoll()
    setPending(null)
    pendingRef.current = null
    setBusy('')
  }

  const logout = async () => {
    if (busy) return
    setErr(''); setMsg('')
    setBusy('logout')
    try {
      await fetch(API_P + '/browserctl/api/server/logout', { method: 'POST', cache: 'no-store' })
      setAcct(null)
      setMsg(t('configAcctLoggedOut'))
      onSaved()
    } catch (e) {
      setErr(String((e && e.message) || e))
    }
    setBusy('')
  }

  const working = busy !== ''

  if (acct) {
    return (
      <div className="dshBrowserCtlCfgFields">
        <div className="dshBrowserCtlCfgFieldRow">
          <label className="dshBrowserCtlCfgField">
            <span>{t('configAcctTitle')}</span>
            <span className="dshBrowserCtlCfgAcctLine">
              {t('configAcctLoggedIn')} · {acct.email}
              {Number(acct.remotePort) > 0 ? ' · ' + t('configAcctPort') + ' ' + acct.remotePort : ''}
            </span>
          </label>
        </div>
        {msg && <p className="dshBrowserCtlCfgNote">{msg}</p>}
        {err && <p className="dshBrowserCtlCfgErr">{err}</p>}
        <Button variant="secondary" size="sm" disabled={working} onClick={logout}>
          {busy === 'logout' ? t('configAcctLoggingOut') : t('configAcctLogout')}
        </Button>
      </div>
    )
  }

  if (pending) {
    return (
      <div className="dshBrowserCtlCfgFields">
        <label className="dshBrowserCtlCfgField">
          <span>{t('configAcctTitle')}</span>
          <span className="dshBrowserCtlCfgAcctLine">{t('configAcctOauthWait')}</span>
        </label>
        <p className="dshBrowserCtlCfgNote">{t('configAcctOauthOpenBrowser')}</p>
        <div className="dshBrowserCtlCfgOauthCode">{pending.userCode}</div>
        <p className="dshBrowserCtlCfgNote">
          <a href={pending.verificationUri} target="_blank" rel="noopener noreferrer" className="dshBrowserCtlAcctLink">
            {pending.verificationUri}
          </a>
        </p>
        <div className="dshBrowserCtlCfgFieldRow">
          <Button variant="secondary" size="sm" onClick={() => openAuthPage(pending.verificationUri)}>
            {t('configAcctOauthOpenAgain')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => copyOauthUrl(pending.verificationUri)}>
            {copiedOauth ? t('configAcctCopied') : t('configAcctCopy')}
          </Button>
          <Button variant="secondary" size="sm" onClick={cancelOAuth}>
            {t('configAcctOauthCancel')}
          </Button>
        </div>
        {msg && <p className="dshBrowserCtlCfgNote">{msg}</p>}
        {err && <p className="dshBrowserCtlCfgErr">{err}</p>}
      </div>
    )
  }

  const busyPwd = busyLogin || pwdEmail.trim() === '' || pwdPass === ''
  return (
    <div className="dshBrowserCtlCfgFields">
      <label className="dshBrowserCtlCfgField">
        <span>{t('configAcctTitle')}</span>
        <span className="dshBrowserCtlCfgAcctLine">{t('configAcctOauthHint')}</span>
      </label>
      {msg && <p className="dshBrowserCtlCfgNote">{msg}</p>}
      {err && <p className="dshBrowserCtlCfgErr">{err}</p>}
      <div className="dshBrowserCtlCfgFieldRow">
        <Button variant="primary" size="sm" disabled={working} onClick={startOAuth}>
          {busy === 'begin' ? t('configAcctOauthOpening') : t('configAcctOauthBtn')}
        </Button>
      </div>
      <div className="dshBrowserCtlAcctOr">
        <span className="dshBrowserCtlAcctOrLine" aria-hidden="true" />
        <span>{t('loginOr')}</span>
        <span className="dshBrowserCtlAcctOrLine" aria-hidden="true" />
      </div>
      <label className="dshBrowserCtlCfgField">
        <span>{t('loginPwdTitle')}</span>
        <input type="email" autoComplete="username" placeholder={t('loginEmail')} className="dshBrowserCtlAcctInput"
          value={pwdEmail} onChange={e => setPwdEmail(e.target.value)} disabled={!!busy || busyLogin} />
      </label>
      <label className="dshBrowserCtlCfgField">
        <span>{t('loginPassword')}</span>
        <input type="password" autoComplete="current-password" placeholder={t('loginPassword')} className="dshBrowserCtlAcctInput"
          value={pwdPass} onChange={e => setPwdPass(e.target.value)} disabled={!!busy || busyLogin} />
      </label>
      <div className="dshBrowserCtlCfgFieldRow">
        <Button variant="secondary" size="sm" disabled={!!busy || busyPwd} onClick={pwdLogin}>
          {busyLogin ? t('loginLoggingIn') : t('loginBtn')}
        </Button>
      </div>
    </div>
  )
}

/* ---------- 账号登录弹窗(顶栏「账号登录」按钮打开,复用 OfficialAccountCard) ---------- */
export function AccountLoginModal({ t, onClose, onSaved }) {
  return (
    <BaseModal t={t} title={t('configAcctTitle')} subtitle={t('configOfficialHint')} onClose={onClose} className="dshBrowserCtlPanelNested dshBrowserCtlPanelCfg">
      <OfficialAccountCard t={t} onSaved={onSaved} />
    </BaseModal>
  )
}