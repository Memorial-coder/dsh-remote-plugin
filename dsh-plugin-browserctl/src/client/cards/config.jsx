// ---------- 「配置」面板:服务器选择(官方 / 自建) ----------
// 纯搬移自 client.jsx,零逻辑改动。

import { useState, useEffect } from 'react'
import { API_P } from '../const.js'
import { Svg } from '../icons.jsx'
import { Button, BaseModal } from '../ui.jsx'

/* ---------- 「配置」面板:服务器选择(官方 / 自建) ---------- */
export function ConfigPanel({ t, onClose, onSaved }) {
  const [cfg, setCfg] = useState(null)
  const [mode, setMode] = useState('official')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('17000')
  const [remotePort, setRemotePort] = useState('')
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState('') // '' | 'loading' | 'done'
  const [err, setErr] = useState('')

  // 打开时读取当前配置(官方模式不返回 host/port/token,仅 selfhost 返回)
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl/api/config', { cache: 'no-store' })
      .then(r => r.text().then(tx => { try { return JSON.parse(tx) } catch { return { error: 'HTTP ' + r.status } } }))
      .then(j => {
        if (!alive) return
        if (j.error) { setErr(j.error); return }
        setCfg(j)
        setMode(j.mode === 'selfhost' ? 'selfhost' : 'official')
        if (j.mode === 'selfhost') {
          setHost(j.host || '')
          setPort(String(j.port || 17000))
          setRemotePort(j.remotePort ? String(j.remotePort) : '')
        }
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const save = async () => {
    if (saving === 'loading') return
    setErr('')
    const params = new URLSearchParams()
    if (mode === 'selfhost') {
      const h = host.trim()
      if (!h) { setErr(t('configHostRequired')); return }
      params.set('mode', 'selfhost')
      params.set('host', h)
      params.set('port', String(parseInt(port, 10) || 17000))
      if (remotePort.trim()) params.set('remotePort', String(parseInt(remotePort, 10) || ''))
    } else {
      params.set('mode', 'official')
    }
    setSaving('loading')
    try {
      // frp token 放 POST JSON body(字段名 frp_token,与 secrets 字段对齐),不再进 URL query:
      // query 里的 token 会进闸机 reqlog(完整路径被记录)并随日志自动上报官方。
      // 留空 = 保持现有 token,此时 body 为空对象。
      const r = await fetch(API_P + '/browserctl/api/config?' + params.toString(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(token ? { frp_token: token } : {}),
        cache: 'no-store',
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || j.error) {
        setErr(j.error || ('HTTP ' + r.status))
        setSaving('')
        return
      }
      setSaving('done')
      setToken('') // 保存成功后清空 token 输入框,避免下次误提交
      onSaved() // 保存后主动刷新主面板(二维码/面板链接)
      setTimeout(() => setSaving(''), 2200) // 成功 toast 2.2s 自动消失
    } catch (e) {
      setErr(String((e && e.message) || e))
      setSaving('')
    }
  }

  return (
    <BaseModal t={t} title={t('config')} subtitle={t('configSubtitle')} onClose={onClose} className="dshBrowserCtlPanelNested dshBrowserCtlPanelCfg">
        <div className="dshBrowserCtlCfgModes">
          <label className="dshBrowserCtlCfgMode">
            <input type="radio" name="browserctl-mode" checked={mode === 'official'} onChange={() => setMode('official')} />
            <span>
              <span className="dshBrowserCtlCfgModeTitle">{t('configOfficial')}</span>
              <span className="dshBrowserCtlCfgModeDesc">{t('configOfficialHint')}</span>
            </span>
          </label>
          <label className="dshBrowserCtlCfgMode">
            <input type="radio" name="browserctl-mode" checked={mode === 'selfhost'} onChange={() => setMode('selfhost')} />
            <span>
              <span className="dshBrowserCtlCfgModeTitle">{t('configSelfhost')}</span>
              <span className="dshBrowserCtlCfgModeDesc">{t('configSelfhostHint')}</span>
            </span>
          </label>
        </div>
        {mode === 'official' ? (
          <p className="dshBrowserCtlCfgOfficialNote">{t('configOfficialNote')}</p>
        ) : (
          <div className="dshBrowserCtlCfgFields">
            <label className="dshBrowserCtlCfgField">
              <span>{t('configHost')}</span>
              <input value={host} onChange={e => setHost(e.target.value)} placeholder={t('configHostPh')} spellCheck={false} />
            </label>
            <div className="dshBrowserCtlCfgFieldRow">
              <label className="dshBrowserCtlCfgField">
                <span>{t('configPort')}</span>
                <input value={port} onChange={e => setPort(e.target.value)} inputMode="numeric" />
              </label>
              <label className="dshBrowserCtlCfgField">
                <span>{t('configRemotePort')}</span>
                <input value={remotePort} onChange={e => setRemotePort(e.target.value)} inputMode="numeric" />
              </label>
            </div>
            <label className="dshBrowserCtlCfgField">
              <span>{t('configToken')}</span>
              <input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder={cfg && cfg.hasToken ? t('configTokenKeep') : t('configTokenPh')}
                autoComplete="new-password"
                spellCheck={false}
              />
            </label>
            <p className="dshBrowserCtlCfgNote">{t('configTokenNote')}</p>
          </div>
        )}
        {err && <p className="dshBrowserCtlCfgErr">{err}</p>}
        <div className="dshBrowserCtlCfgActions">
          <Button variant="secondary" size="sm" className="dshBrowserCtlCfgSave" disabled={saving === 'loading'} onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" size="sm" className="dshBrowserCtlCfgSave" disabled={saving === 'loading'} onClick={save}>
            {saving === 'loading' ? t('saving') : saving === 'done' ? (<><span aria-hidden="true">{Svg.check}</span>{t('saved')}</>) : t('save')}
          </Button>
        </div>
    </BaseModal>
  )
}