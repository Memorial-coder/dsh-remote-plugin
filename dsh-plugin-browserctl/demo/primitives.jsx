import React from 'react'

// @deepseek-ai/dsh-client-ui-primitives 的演示替身：只实现面板用到的最小面
export function Button({ variant = 'solid', size = 'md', icon, children, className = '', style, ...rest }) {
  const cls = ['dshDemoBtn', 'dshDemoBtn--' + variant, 'dshDemoBtn--' + size, className].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} style={style} {...rest}>
      {icon}
      {children}
    </button>
  )
}

export function Tooltip({ label, children, delayMs, disabled }) {
  return <span className="dshDemoTooltip" data-label={label}>{children}</span>
}

export function IconCloseOutlineRegular({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
