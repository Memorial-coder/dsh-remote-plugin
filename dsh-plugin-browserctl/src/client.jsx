// ============================================================================
// DSH 浏览器控制插件 · client 组合根
// B1.5 纯搬移拆分(2026-11-26)后的入口:imports 聚合 + 侧栏启动器 BrowserCtlButton
// + inject/apply + __demoPanel 导出。
// 依赖分层(只能向下):const/fmt → legal/styles/icons → ui/hooks/actions →
//   cards → overlay → 本文件。smoke.cjs 的 hook #3=tab useState 定位不受影响
// (Overlay 函数体逐字搬移,零逻辑改动)。
// ============================================================================
import { defineStore } from '@deepseek-ai/dsh-client-store'
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import { NS, API_P, consumeOpenSessionHash } from './client/const.js'
import { installStyles } from './client/install-styles.js'
import { CtlIcon } from './client/icons.jsx'
import { Button } from './client/ui.jsx'
import { BrowserCtlOverlay } from './client/overlay.jsx'
// 面板文案统一走 locale/{zh,en}.json 的 panel 段（不再内联在本文件）：
// 这两份 JSON 由 esbuild 构建期内联进 lib/client.js，运行时无额外请求。
import LOCALE_ZH from '../locale/zh.json'
import LOCALE_EN from '../locale/en.json'

function BrowserCtlButton({ wide, useStore, actions, t }) {
  const open = useStore(state => state.open)
  return (
    <Tooltip label={t('tab')} delayMs={500} disabled={wide}>
      <Button
        variant="ghost"
        className="dshBrowserCtlLauncher"
        data-wide={wide ? 'true' : 'false'}
        aria-label={t('tab')}
        aria-haspopup="dialog"
        aria-expanded={open}
        icon={<CtlIcon size={wide ? 16 : 18} />}
        onClick={() => {
          // 点按钮时顺手拉起隧道(不阻塞打开弹窗)
          fetch(API_P + '/browserctl/api/ensure', { cache: 'no-store' }).catch(() => {})
          actions.open()
        }}
      >
        {wide ? t('tab') : null}
      </Button>
    </Tooltip>
  )
}


export const inject = ['slots', 'locale', 'uiWorkspace']

export function apply(ctx) {
  // C7 推送深链：面板（含手机远控页）加载后消费 #dshremote-open=<sessionId>，
  // 用官方 UI 导航服务切到对应会话（找不到/异常静默，不影响面板）。
  ctx.effect(() => consumeOpenSessionHash((sid) => ctx.uiWorkspace.openSession(sid)),
    'browserctl: push deep-link open session')
  const view = defineStore({
    init: () => ({ open: false }),
    actions: {
      open: draft => { draft.open = true },
      close: draft => { draft.open = false },
    },
  })
  ctx.effect(() => ctx.locale.register(NS, {
    zh: LOCALE_ZH.panel,
    en: LOCALE_EN.panel,
  }), 'browserctl: dictionaries')
  ctx.effect(() => installStyles(), 'browserctl: styles')
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'browserctl',
    order: 30,
    label: () => ctx.locale.bind(NS)('tab'),
    locale: NS,
    store: view,
  }, BrowserCtlButton))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'browserctl',
    order: 30,
    locale: NS,
    store: view,
  }, BrowserCtlOverlay))
}

// ---- 演示壳导出（只读复用，不影响 apply/inject 运行） ----
export const __demoPanel = { BrowserCtlOverlay, installStyles }
