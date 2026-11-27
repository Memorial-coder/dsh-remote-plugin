// ---------- 样式安装 ----------
// 「每次强制对齐 textContent」语义原样保留:client 半是热更新的,GUI 刷新时
// DOM 里的 <style> 不会重建,必须每次对齐,详见函数内注释。
import { css } from './styles.js'
import { STYLE_ID } from './const.js'

export function installStyles() {
  // 注意:client 半是热更新的 —— GUI 刷新时 JS 模块会重新执行,但 DOM 里的 <style> 不会重建。
  // 以前「已存在就直接 return」会让旧样式永远生效:新版本加的 CSS(工单表单、更新弹窗等)
  // 全都不生效,表现为「弹窗里的元素没样式、挤在一起」,只有彻底重启 DSH 才恢复。
  // 所以这里必须每次把 textContent 对齐到当前 css,而不是跳过。
  let style = document.querySelector(`style[data-plugin="${STYLE_ID}"]`)
  if (style === null) {
    style = document.createElement('style')
    style.dataset.plugin = STYLE_ID
    document.head.append(style)
  }
  if (style.textContent !== css) style.textContent = css
  return () => {}
}