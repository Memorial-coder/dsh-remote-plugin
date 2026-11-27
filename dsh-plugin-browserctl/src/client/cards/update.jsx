// ---------- 一键自更新按钮(本地目录解压/link 安装形态专用) ----------
// 纯搬移自 client.jsx,零逻辑改动。(IS_TEST)不渲染本按钮(调用点判断)。

import { useState } from 'react'
import { IS_TEST, API_P } from '../const.js'
import { Button } from '../ui.jsx'
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'

/* ---------- 一键自更新按钮(本地目录解压/link 安装形态专用) ----------
   host /update-apply:停隧道 → 下载官网 zip → 校验大小 → Python 安全解包 →
   覆盖插件目录(运行态文件绝不覆盖) → 回 restartRequired(重启 DSH 生效)。
   (IS_TEST)与包安装形态不渲染本按钮(见调用点)。 */
export function UpdateApplyButton({ t, latest, variant, onApplied }) {
  const [state, setState] = useState('idle') // idle|loading|done|error
  const [errMsg, setErrMsg] = useState('')
  async function apply() {
    if (state === 'loading') return
    setState('loading')
    setErrMsg('')
    try {
      const r = await fetch(API_P + '/browserctl/api/update-apply', { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (j && j.ok) {
        setState('done')
        if (onApplied) onApplied(j)
      } else {
        setState('error')
        setErrMsg((j && j.error) || ('HTTP ' + r.status))
      }
    } catch (e) {
      setState('error')
      setErrMsg(String((e && e.message) || e))
    }
  }
  const btn = (
    <Tooltip label={state === 'done' ? t('updateApplyDone').replace('{v}', latest) : t('updateApplyTip')}>
      <Button
        variant={variant || 'primary'}
        size="sm"
        disabled={state === 'loading' || state === 'done'}
        onClick={apply}
      >
        {state === 'loading'
          ? (<><span className="dshBrowserCtlSpinner" aria-hidden="true" /> {t('updateApplying')}</>)
          : state === 'done'
            ? t('updateApplyDone').replace('{v}', latest)
            : t('updateApplyBtn').replace('{v}', latest)}
      </Button>
    </Tooltip>
  )
  if (state === 'error' && errMsg) {
    return (
      <span className="dshBrowserCtlUpdateErrWrap">
        {btn}
        <span className="dshBrowserCtlAboutUpdateErr">{errMsg}</span>
      </span>
    )
  }
  return btn
}