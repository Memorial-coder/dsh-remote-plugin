// ---------- 内联 SVG 图标(替代 emoji,保持跨平台一致渲染) ----------
// 纯展示组件,CtlIcon=插件启动器图标;Svg 表供卡片/头部按名取图。

/* ---------- 内联 SVG 图标（替代 emoji，保持跨平台一致渲染） ---------- */
const svgProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
                   stroke: 'currentColor', strokeWidth: 1.8,
                   strokeLinecap: 'round', strokeLinejoin: 'round',
                   style: { verticalAlign: '-2px', marginRight: 3, flex: 'none' } }
export const Svg = {
  phone: (
    <svg {...svgProps}><rect x="5.5" y="2.5" width="13" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>
  ),
  iphone: (
    <svg {...svgProps}><rect x="6" y="2.5" width="12" height="19" rx="2.8" /><path d="M9.8 4.8h4.4" /><path d="M10.8 18.6h2.4" /></svg>
  ),
  desk: (
    <svg {...svgProps}><rect x="2.5" y="3.5" width="19" height="13" rx="2" /><path d="M8.5 20.5h7M12 16.5v4" /></svg>
  ),
  lap: (
    <svg {...svgProps}><rect x="4" y="4.5" width="16" height="11" rx="1.8" /><path d="M2 19.5h20" /></svg>
  ),
  robot: (
    <svg {...svgProps}><rect x="4" y="7" width="16" height="12" rx="3" /><path d="M12 3v4" /><circle cx="9" cy="12.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="12.5" r="1.2" fill="currentColor" stroke="none" /><path d="M9.5 16h5" /></svg>
  ),
  peng: (
    <svg {...svgProps}><ellipse cx="12" cy="13" rx="7" ry="8.5" /><path d="M12 4.5v3" /><circle cx="9.2" cy="10.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="14.8" cy="10.5" r="1.1" fill="currentColor" stroke="none" /><path d="M9.8 16.5q2.2 1.8 4.4 0" /></svg>
  ),
  wrench: (
    <svg {...svgProps}><path d="M14.5 6.5a4 4 0 1 0 4.9 4.9l-2.6-2.6 2-2z" /><path d="M11.8 9.2 3.5 17.5a2 2 0 0 0 2.8 2.8l8.3-8.3" /></svg>
  ),
  globe: (
    <svg {...svgProps}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 3.6 9A14 14 0 0 1 12 21a14 14 0 0 1-3.6-9A14 14 0 0 1 12 3z" /></svg>
  ),
  shield: (
    <svg {...svgProps}><path d="M12 2.5 19.5 6v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6z" /></svg>
  ),
  check: (
    <svg {...svgProps}><path d="m4.5 12.5 5 5 10-11" /></svg>
  ),
  ban: (
    <svg {...svgProps}><circle cx="12" cy="12" r="9" /><path d="m5.7 5.7 12.6 12.6" /></svg>
  ),
  lock: (
    <svg {...svgProps}><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /><circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none" /></svg>
  ),
  clip: (
    <svg {...svgProps}><rect x="8" y="2.5" width="8" height="4" rx="1.5" /><path d="M16 4.5h1.5A2.5 2.5 0 0 1 20 7v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 20V7a2.5 2.5 0 0 1 2.5-2.5H8" /></svg>
  ),
  link: (
    <svg {...svgProps}><path d="M10 13a5 5 0 0 0 7.5.5l2.5-2.5a5 5 0 0 0-7-7L11.5 5.5" /><path d="M14 11a5 5 0 0 0-7.5-.5L4 13a5 5 0 0 0 7 7l1.5-1.5" /></svg>
  ),
  bell: (
    <svg {...svgProps}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></svg>
  ),
  // 头部「通知中心」铃铛:去掉通用图标外边距,与 info/gear 等头部小图标对齐
  bellHead: (
    <svg {...svgProps} style={{ ...svgProps.style, marginRight: 0 }}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></svg>
  ),
  // 头部小图标按钮专用:去掉通用图标的外边距,保持按钮内居中对齐
  info: (
    <svg {...svgProps} style={{ ...svgProps.style, marginRight: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.5h.01" /></svg>
  ),
  gear: (
    <svg {...svgProps} style={{ ...svgProps.style, marginRight: 0 }}><circle cx="12" cy="12" r="3" /><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" /></svg>
  ),
  download: (
    <svg {...svgProps}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  person: (
    <svg {...svgProps} style={{ ...svgProps.style, marginRight: 0 }}><circle cx="12" cy="7.5" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
  ),
  ticket: (
    <svg {...svgProps} style={{ ...svgProps.style, marginRight: 0 }}><path d="M21 12a8 8 0 0 1-8 8H4.5l2.4-2.4A8 8 0 1 1 21 12z" /><path d="M8.5 10.5h7M8.5 13.5h4.5" /></svg>
  ),
  group: (
    <svg {...svgProps}><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" /><circle cx="16.5" cy="9.5" r="2.6" /><path d="M15.5 14.6a4.8 4.8 0 0 1 5 4.9" /></svg>
  ),
}
export function CtlIcon({ size = 16 }) {
  return (
    <svg
      data-icon="browserctl"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="1.5" y="2.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M5 14h6M8 11.5V14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M4.5 6.5 6.5 8.5 4.5 10.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 10.5h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}