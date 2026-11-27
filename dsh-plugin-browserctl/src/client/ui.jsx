// ---------- UI 基建:按钮包装器 + 弹窗共享壳 ----------
// Button=primitives 二次包装(soft/danger 语义);BaseModal=z 分档 + MODAL_STACK
// Esc 栈(B1)。分层:icons/ui 同层,cards 向下引用本文件。
import { useEffect, useRef, forwardRef } from 'react'
import { Button as DshButton, IconCloseOutlineRegular, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'

// ---------- 统一文字按钮(2026-11-25 用户投诉「不带白底的看不出来是按钮」) ----------
// DSH primitives 的 Button 只有 primary/ghost/outline/toolbar 四个变体,没有 secondary——
// clsx 取 css['secondary'] 得 undefined,面板里所有 variant="secondary" 的文字按钮
// 实际都渲染成透明 ghost,和说明文字混在一起分不清是按钮。这里包一层统一修:
//  - primary、纯图标 ghost(头部工具条/侧栏启动器,类名 Header*/Launcher* 跳过):原样透传;
//  - 文字类 ghost/secondary:补 dshBrowserCtlBtnSoft(灰底+细描边,悬停加深),一眼是按钮。
export const BTN_SOFT_SKIP = /^dshBrowserCtl(Header|Launcher)/
export const BTN_DANGER_RE = /dshBrowserCtlBtnDanger/
export const Button = forwardRef(function Button({ variant = 'ghost', className, children, ...rest }, ref) {
  const soft = children != null
    && (variant === 'ghost' || variant === 'secondary')
    && !(typeof className === 'string' && (BTN_SOFT_SKIP.test(className) || BTN_DANGER_RE.test(className)))
  return (
    <DshButton
      ref={ref}
      {...rest}
      variant={variant === 'secondary' ? 'ghost' : variant}
      className={soft ? ('dshBrowserCtlBtnSoft' + (className ? ' ' + className : '')) : className}
    >
      {children}
    </DshButton>
  )
})
/* ---------- BaseModal:面板弹窗共享壳(B1,2026-11-26) ----------
   此前 7 个弹窗(About/Legal/Config/Account/Ticket/未登录提示/新版本提示)各自手写
   Overlay+Mask+Panel+Header 四层重复结构,Esc 关闭硬编码在主面板的 keydown 链里。
   统一为 BaseModal:
   - props: t / title / subtitle / onClose / className(Panel 额外类) /
     overlayClassName(Overlay 额外类) / z(层级分档,见下);
   - 挂载即入 MODAL_STACK,卸载出栈;Esc 由主面板的 keydown 查栈关最上层
     (清单驱动,消除 kb/22.15「谁盖谁看 DOM 顺序」的同型风险);
   - z-index 分档:普通弹窗 1000 / 弹窗内再开的弹窗 1010 / 打断式提示 1020。
   本批次只换壳,弹窗内容与行为完全不变。 */
export const MODAL_Z_BASE = 1000
export const MODAL_Z_NESTED = 1010
export const MODAL_Z_PROMPT = 1020
export const MODAL_STACK = []
export function BaseModal({ t, title, subtitle, onClose, className, overlayClassName, z, children }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const entry = { close: () => closeRef.current() }
    MODAL_STACK.push(entry)
    return () => {
      const i = MODAL_STACK.indexOf(entry)
      if (i >= 0) MODAL_STACK.splice(i, 1)
    }
  }, [])
  return (
    <div
      className={'dshBrowserCtlOverlay' + (overlayClassName ? ' ' + overlayClassName : '')}
      style={z && z !== MODAL_Z_BASE ? { zIndex: z } : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button className="dshBrowserCtlOverlayMask" type="button" aria-label={t('close')} onClick={onClose} />
      <section className={'dshBrowserCtlPanel' + (className ? ' ' + className : '')}>
        <header className="dshBrowserCtlHeader">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <Tooltip label={t('close')}>
            <Button variant="ghost" size="sm" aria-label={t('close')} icon={<IconCloseOutlineRegular />} onClick={onClose} />
          </Tooltip>
        </header>
        {children}
      </section>
    </div>
  )
}