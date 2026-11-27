// ---------- 面板全部 CSS(逐字搬移自 client.jsx 的 const css 模板串) ----------
// 零依赖纯字符串:不重排缩进、不改插值(本块无 ${} 插值)、不拆成真 .css 文件。

export const css = `
.dshBrowserCtlLauncher {
  flex: none;
  box-sizing: border-box;
  width: calc(100% + 4px);
  height: 42px;
  margin: 4px -2px;
  padding: 0 10px 0 8px;
  gap: 8px;
  justify-content: flex-start;
  overflow: hidden;
  border-radius: 12px;
  white-space: nowrap;
}
.dshBrowserCtlLauncher[data-wide='false'] {
  width: 36px;
  height: 36px;
  margin: 8px 0 10px;
  justify-content: center;
  gap: 0;
  padding: 0;
  border-radius: 50%;
}
.dshBrowserCtlOverlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  pointer-events: auto;
}
.dshBrowserCtlOverlayMask {
  position: absolute;
  inset: 0;
  border: none;
  padding: 0;
  background: var(--dshb-mask);
  cursor: default;
}
.dshBrowserCtlPanel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(880px, 94vw);
  max-height: min(680px, 90vh);
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior: contain;
  padding: 18px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dshb-border));
  border-radius: 16px;
  background: var(--dsw-alias-bg-layer-2, var(--dshb-bg));
  color: var(--dsw-alias-label-primary, inherit);
  box-shadow: 0 16px 48px rgba(0,0,0,0.4);
}
.dshBrowserCtlHeader {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dshBrowserCtlHeader > div {
  flex: 1;
  min-width: 0;
}
.dshBrowserCtlHeader h1 {
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  font-weight: 600;
}
.dshBrowserCtlHeader p {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlStatus {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlStatus::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  flex: none;
}
.dshBrowserCtlStatus[data-ok='true'] { color: var(--dsw-alias-state-success-primary, var(--dshb-ok)); }
.dshBrowserCtlStatus[data-ok='true']::before { background: var(--dsw-alias-state-success-primary, var(--dshb-ok)); }
.dshBrowserCtlStatus[data-ok='false'] { color: var(--dsw-alias-state-error-primary, var(--dshb-danger)); }
.dshBrowserCtlStatus[data-ok='false']::before { background: var(--dsw-alias-state-error-primary, var(--dshb-danger)); }
/* 异步操作(启动/停止隧道等)的转圈加载指示:跟随当前文字颜色,放进按钮/状态栏/占位框 */
.dshBrowserCtlSpinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid var(--dshb-toggle);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: dshBrowserCtlSpin .7s linear infinite;
  flex: none;
  vertical-align: -2px;
}
/* 二维码占位框里的加载态:spinner + 提示文字一行居中 */
.dshBrowserCtlQrLoading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  font-size: 13px;
  padding: 0 14px;
  text-align: center;
}
/* 顶部功能页签:连接 / 设备 / 2FA / 黑名单 / 日志,一次只显示一个功能区 */
.dshBrowserCtlTabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  border: none;
  border-radius: 10px;
  background: transparent;
  overflow-x: auto;
  flex: none;
}
.dshBrowserCtlTab {
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 6px;
  border: none;
  /* 选中/hover 高亮圆角口径(2026-11-27 用户反馈①):内层圆角 = 外层容器圆角 − padding。
     Tabs 容器 radius 10 + padding 3 → 内层 7px;8px 会在四角越出容器圆角。 */
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  font-size: 12.5px;
  line-height: 17px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s ease, color .15s ease;
}
.dshBrowserCtlTab:hover {
  background: var(--dsw-alias-bg-layer-2, var(--dshb-seg-on));
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlTab[data-active='true'] {
  background: var(--dsw-alias-bg-layer-3, var(--dshb-seg-on));
  color: var(--dsw-alias-label-primary, inherit);
  box-shadow: 0 1px 3px rgba(0,0,0,0.35);
}
.dshBrowserCtlTab:disabled { opacity: .55; cursor: not-allowed; }
.dshBrowserCtlTabBody {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  /* 内容区独立滚动：头部/页签钉住，内容超出面板高度时在此滚动（比整卡滚动更可靠） */
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
/* flex 列的子元素默认 flex-shrink:1，在有界高度里会被压扁/裁切而不是溢出滚动。
   必须禁止收缩，子元素保持自然高度，由内容区自身滚动（实测：不加则卡片 body 被裁）。 */
.dshBrowserCtlTabBody > * {
  flex: 0 0 auto;
}
.dshBrowserCtlQrBox {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: var(--dshb-qr-bg);
  align-self: center;
}
.dshBrowserCtlQrBox img,
.dshBrowserCtlQrBox svg {
  width: 180px;
  height: 180px;
  display: block;
}
/* 卡片头部描述文字(图二:卡片下方一小行灰色说明) */
.dshBrowserCtlCardDesc {
  margin: 0;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
/* 卡片头部右侧状态文字 */
.dshBrowserCtlCardStat {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
/* 进行中操作:整卡半透明,提示"正在处理" */
.dshBrowserCtlCard[data-busy='true'] {
  opacity: 0.65;
  pointer-events: none;
}
.dshBrowserCtlUrlRow {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 7px 10px;
  border: 1px solid var(--dshb-div);
  border-radius: 9px;
  background: transparent;
}
.dshBrowserCtlUrl {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
}
.dshBrowserCtlActions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
/* ---------- 文字按钮统一软底(2026-11-25) ----------
   primitives Button 无 secondary 变体,ghost/secondary 文字按钮此前=透明底,
   和说明文字混在一起分不清是按钮。统一补:灰底+细描边,悬停/按下加深;
   primary(白底)与图标按钮不受影响(包装器只给文字类按钮加 dshBrowserCtlBtnSoft)。 */
.dshBrowserCtlBtnSoft {
  background: var(--dsw-alias-fill-control-secondary, var(--dshb-soft)) !important;
  box-shadow: inset 0 0 0 var(--dsh-hairline-width, 0.5px) var(--dsw-alias-border-l3, var(--dshb-toggle));
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlBtnSoft:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, var(--dshb-seg-on)) !important;
}
.dshBrowserCtlBtnSoft:active:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-active, var(--dshb-toggle)) !important;
}
/* ---------- 危险语义按钮(B1,2026-11-26;mockup 口径) ----------
   危险动作 = 13% 低饱和红底 + 红字 + 无边框(BtnDangerSoft),不给描边、不给实色;
   实色红只保留给「停止控制」(BtnDanger)与「重启闸机」(MiniBtnDanger)两个动作。
   带 BtnDanger 类名的按钮由 Button 包装器跳过 BtnSoft,避免两套 !important 背景打架。 */
.dshBrowserCtlBtnDangerSoft {
  background: var(--dshb-danger-soft) !important;
  box-shadow: none !important;
  color: var(--dsw-alias-state-error-primary, var(--dshb-danger)) !important;
}
.dshBrowserCtlBtnDangerSoft:hover:not(:disabled) {
  background: var(--dshb-danger-soft-hover) !important;
}
.dshBrowserCtlBtnDangerSoft:active:not(:disabled) {
  background: var(--dshb-danger-soft-active) !important;
}
.dshBrowserCtlBtnDanger {
  background: var(--dsw-alias-state-error-primary, var(--dshb-danger)) !important;
  box-shadow: none !important;
  color: var(--dshb-contrast) !important;
}
.dshBrowserCtlBtnDanger:hover:not(:disabled) {
  background: var(--dsw-alias-state-error-primary, var(--dshb-danger)) !important;
  filter: brightness(0.93);
}
/* 卡片内小文字按钮(签名健康行的「刷新/重启闸机」等):同样给底,别混进正文 */
.dshBrowserCtlMiniBtn {
  appearance: none;
  border: none;
  background: var(--dsw-alias-fill-control-secondary, var(--dshb-soft));
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  padding: 2px 8px;
  border-radius: 7px;
  cursor: pointer;
  flex: 0 0 auto;
}
.dshBrowserCtlMiniBtn:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary, inherit);
  background: var(--dsw-alias-interactive-bg-hover, var(--dshb-seg-on));
}
.dshBrowserCtlMiniBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
/* MiniBtn 危险变体(「重启闸机」保留实色红,mockup 口径):置于 MiniBtn 规则之后,同特异性后者胜 */
.dshBrowserCtlMiniBtnDanger {
  background: var(--dsw-alias-state-error-primary, var(--dshb-danger));
  border-color: transparent;
  color: var(--dshb-contrast);
}
.dshBrowserCtlCard {
  background: transparent;
  border: 1px solid var(--dsw-alias-border-l2, var(--dshb-border));
  border-radius: 12px;
  overflow: hidden;
}
.dshBrowserCtlCardHead {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 13px 16px;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}
.dshBrowserCtlCardHead:hover { background: var(--dshb-soft); }
/* 卡体内部折叠行(签名卡「设备凭证」/推送卡「手动发送 ▼」):复用 CardHead 骨架 */
.dshBrowserCtlFoldBtn {
  width: 100%;
  padding: 6px 8px;
  gap: 6px;
  /* 高亮带自带圆角(2026-11-27 用户反馈 P6):手机 tap 后 :hover 常驻,方角带很扎眼。
     卡内行不再吃「被卡片 overflow:hidden 裁齐」豁免——行在卡片中部时四角是自己的方角。
     左右 -8px 出血被 padding 8px 抵消:高亮带内缩到距卡缘 8px,文字仍对齐 body 原 16px 边距。 */
  border-radius: 8px;
  margin: 0 -8px;
}
/* 独立在面板上的折叠行已不存在(iOS 引导 2026-11-27 升为标准卡片,FoldFree 删除) */
/* 展开态的折叠分区标题(设备凭据/手动发送/高级)与下方内容之间同样加一道
   浅细分割线(2026-11-27 用户反馈②,同 InsetHead 口径,复用 dsw-alias-border-l1);
   收起态下方无内容,不加线,避免孤线。 */
.dshBrowserCtlFoldBtn[data-open='true'] {
  border-bottom: 1px solid var(--dsw-alias-border-l1, var(--dshb-div));
}
.dshBrowserCtlCardArrow {
  margin-left: auto;
  display: inline-flex;
  transition: transform 0.15s ease;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlCardHead[data-open='true'] .dshBrowserCtlCardArrow { transform: rotate(90deg); }
.dshBrowserCtlCardBody {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  padding: 0 16px;
  transition: max-height 0.28s ease, opacity 0.22s ease, padding 0.25s ease;
}
.dshBrowserCtlCardBody[data-open='true'] {
  max-height: 450px;
  opacity: 1;
  padding: 2px 16px 16px;
}
/* 高内容卡片(二维码 + 设备/推送列表):450px 会把底部列表裁掉且无法滚动。
   放宽到 2400px,内容超高时由外层 TabBody 负责滚动,不再藏内容。 */
.dshBrowserCtlCardBodyTall[data-open='true'] {
  max-height: 2400px;
}
/* 「设备凭证」列表:内部独立滚动(同 DevBody 惯例,kb/10 #4 设备区独立滚动)。
   默认 body 展开态 max-height 450px + overflow hidden,35 台设备 ~2000px 内容
   会被裁死且外层无处可滚(2026-11-22 用户实测"无法正常下滑")。
   flex 列滚动容器必须禁子元素收缩,否则行被压扁/裁切。 */
.dshBrowserCtlSigDevs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* 2026-11-27 内框回归:与设备页 InsetBox 同语义(展开分区=细描边+3% 底),行盒细描边保持 */
  padding: 8px 10px;
  border: 1px solid var(--dshb-inset-border, var(--dshb-div));
  border-radius: 12px;
  background: var(--dshb-inset);
}
.dshBrowserCtlSigDevs > * { flex: 0 0 auto; }
/* B1:.dshBrowserCtlActions 的重复定义已去重(保留 L636 首个,两处规则完全相同) */
.dshBrowserCtlSecretRow {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid var(--dshb-div);
  border-radius: 9px;
  background: transparent;
}
.dshBrowserCtlSecret {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  font-family: ui-monospace, Consolas, Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshBrowserCtlTotpQr {
  display: flex;
  justify-content: center;
  padding: 8px;
  border: none;
  border-radius: 10px;
  background: var(--dshb-qr-bg);
  align-self: center;
}
.dshBrowserCtlTotpQr img,
.dshBrowserCtlTotpQr svg {
  width: 132px;
  height: 132px;
  display: block;
}

/* 推送卡「最近推送」分区(2026-11-27 内框回归:标题+行列表,与设备页分区同语义同框) */
.dshBrowserCtlPairedList {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--dshb-inset-border, var(--dshb-div));
  background: var(--dshb-inset);
  border-radius: 12px;
}
.dshBrowserCtlPairedHead {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  /* 标题与行列表之间的浅细分割线(2026-11-27 用户反馈②,同 InsetHead 口径) */
  padding-bottom: 6px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, var(--dshb-div));
}
.dshBrowserCtlPairedCount {
  margin-left: auto;
  font-weight: 500;
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlPairedRow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 12px;
  line-height: 17px;
}
.dshBrowserCtlPairedInfo {
  flex: 1;
  min-width: 0;
}
.dshBrowserCtlPairedName {
  color: var(--dsw-alias-label-primary, inherit);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshBrowserCtlPairedMeta {
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 来源徽标:App=蓝字浅蓝底,网页=灰字描边(设备行/配对行通用) */
.dshBrowserCtlPairedNameRow {
  display: flex;
  align-items: center;
  min-width: 0;
}
.dshBrowserCtlPairedNameRow .dshBrowserCtlPairedName {
  flex: 0 1 auto;
  min-width: 0;
}
.dshBrowserCtlKindTag {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  height: 16px;
  padding: 0 6px;
  margin-left: 6px;
  border-radius: 4px;
  font-size: 10px;
  line-height: 1;
  font-weight: 600;
}
.dshBrowserCtlKindTag[data-kind='app'] {
  color: var(--dshb-accent-text);
  border: none;
  background: var(--dshb-accent-soft);
}
.dshBrowserCtlKindTag[data-kind='web'] {
  color: var(--dsw-alias-label-tertiary, var(--dshb-muted));
  border: 1px solid var(--dsw-alias-border-l2, var(--dshb-border));
  background: transparent;
}
/* 「重复 N 条」徽标(P5 展示层去重,2026-11-27):合并行标出被归并的条数。
   灰描边 chip,与 KindTag web 档同族,中性不抢眼;零新色,全走既有 token。 */
.dshBrowserCtlDupBadge {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  height: 16px;
  padding: 0 6px;
  border-radius: 4px;
  font-size: 10px;
  line-height: 1;
  font-weight: 600;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  border: 1px solid var(--dshb-div);
  background: transparent;
}
.dshBrowserCtlPairedEmpty {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  padding: 2px 0;
}
.dshBrowserCtlPairedMsg {
  font-size: 12px;
  text-align: center;
  color: var(--dsw-alias-state-success-primary, var(--dshb-ok));
  padding-top: 2px;
}
.dshBrowserCtlDevBody {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 150px;
  overflow-y: auto;
}
.dshBrowserCtlDevTable {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  line-height: 16px;
  background: transparent;
}
.dshBrowserCtlDevInfo {
  flex: 1;
  min-width: 0;
}
.dshBrowserCtlDevTop {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.dshBrowserCtlDevPlatform {
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshBrowserCtlDevIp {
  font-size: 12px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshBrowserCtlDevSeen {
  margin-left: auto;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  font-size: 11px;
  white-space: nowrap;
  flex: none;
}
.dshBrowserCtlDevActions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}
.dshBrowserCtlHistDot {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlHistDot i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
  background: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlHistDot[data-on="true"] {
  color: var(--dsw-alias-state-success-primary, var(--dshb-ok));
}
.dshBrowserCtlHistDot[data-on="true"] i {
  background: var(--dsw-alias-state-success-primary, var(--dshb-ok));
}
/* 黑名单 */
.dshBrowserCtlBanBody {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 150px;
  overflow-y: auto;
}
.dshBrowserCtlBanRow {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border: none;
  border-radius: 7px;
  font-size: 11.5px;
  line-height: 16px;
  background: transparent;
}
.dshBrowserCtlBanInfo {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}
.dshBrowserCtlBanReason {
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  font-size: 10.5px;
}
.dshBrowserCtlDevEmpty {
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  font-size: 12px;
  line-height: 17px;
  padding: 2px 0;
}
/* 运行日志:可折叠,最多显示一屏,内部滚动 */
/* 分类页签(2026-11-16):横向可换行的小 chip,选中高亮;计数用弱化色 */
.dshBrowserCtlLogTabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-bottom: 6px;
}
.dshBrowserCtlLogTab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--dshb-div);
  background: transparent;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  border-radius: 999px;
  font-size: 11px;
  line-height: 1;
  padding: 5px 9px;
  cursor: pointer;
  flex: 0 0 auto;
}
.dshBrowserCtlLogTab:hover { color: var(--dsw-alias-label-primary, var(--dshb-text)); }
.dshBrowserCtlLogTab[data-on='true'] {
  background: var(--dshb-accent-soft);
  color: var(--dshb-accent-text);
}
.dshBrowserCtlLogTabN {
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlLogBody {
  max-height: 168px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dshBrowserCtlLogRow {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 11.5px;
  line-height: 17px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  padding: 2px 0;
  border-bottom: 1px solid var(--dsw-alias-border-l1, var(--dshb-div-soft));
}
.dshBrowserCtlLogRow:last-child { border-bottom: none; }
.dshBrowserCtlLogType {
  flex: none;
  font-size: 11px;
}
.dshBrowserCtlLogMsg {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshBrowserCtlLogTime {
  flex: none;
  font-size: 10.5px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  font-variant-numeric: tabular-nums;
}
/* footer 槽位锚点:renderSlot 默认给 display:contents(内联样式),
   多个 launchers 会变成横向 flex 兄弟互相叠压。强制纵向紧凑堆叠。 */
div[data-slot='sidebar.footer.action'] {
  display: flex !important;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}
/* 关键:禁止子元素纵向拉伸,否则 desktop 端 footer 有空余高度时
   "用量统计"等条目会被拉成一大块(带滚动条的高盒子) */
div[data-slot='sidebar.footer.action'] > * {
  flex: none !important;
  margin: 2px -2px !important;
  width: calc(100% + 4px);
  align-self: stretch;
}
/* 头部小浮层:关于 / 配置(复用主浮层遮罩与面板,仅收窄宽度) */
.dshBrowserCtlPanelNested { width: min(460px, 94vw); }
.dshBrowserCtlPanelCfg { width: min(520px, 94vw); }
/* 关于面板 */
.dshBrowserCtlAboutApp {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.dshBrowserCtlAboutAppName {
  font-size: 16px;
  font-weight: 700;
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlAboutAppVersion {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlAboutDesc {
  margin: 0;
  font-size: 12.5px;
  line-height: 19px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
}
.dshBrowserCtlAboutLinks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 2px;
}
.dshBrowserCtlAboutLink {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--dshb-div);
  border-radius: 10px;
  background: transparent;
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 13px;
  text-decoration: none;
  transition: background .15s ease;
}
.dshBrowserCtlAboutLink:hover {
  background: var(--dsw-alias-bg-layer-2, var(--dshb-seg-on));
}
.dshBrowserCtlAboutLink > span:first-child {
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
/* 顶栏「账号登录」按钮 */
.dshBrowserCtlHeaderAcct {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 150px;
}
.dshBrowserCtlHeaderAcctLabel {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 96px;
}
/* 未登录时启动远程的提示弹窗 */
.dshBrowserCtlLoginPrompt .dshBrowserCtlPanel {
  width: min(380px, 94vw);
}
.dshBrowserCtlLoginPromptBody {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 2px 2px;
}
.dshBrowserCtlLoginPromptText {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlLoginPromptActions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
/* 插件新版本提示弹窗里的更新说明列表 */
.dshBrowserCtlUpdNotes {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
}
/* 检查更新:42px 三态按钮 + 版本对比 + 下载 + 更新说明 */
.dshBrowserCtlAboutUpdate {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 2px;
}
.dshBrowserCtlAboutUpdateBtn {
  height: 42px !important;
  margin: 4px 0 !important;
}
.dshBrowserCtlAboutUpdateRow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
}
.dshBrowserCtlAboutUpdateVal {
  margin-left: auto;
  color: var(--dsw-alias-label-primary, inherit);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.dshBrowserCtlAboutUpdateFound {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-state-success-primary, var(--dshb-ok));
}
.dshBrowserCtlAboutUpdateLatest {
  margin: 0;
  font-size: 12.5px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
}
.dshBrowserCtlAboutUpdateGuide {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  word-break: break-all;
}
.dshBrowserCtlAboutUpdateNotes {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
}
/* 更新区分隔线:把「版本对比+按钮」和「更新方法/更新说明」两摊信息隔开(2026-11-25) */
.dshBrowserCtlAboutUpdateSep {
  height: 1px;
  margin: 2px 0;
  background: var(--dsw-alias-border-l2, var(--dshb-border));
}
/* 「更新说明」小节标题:比正文说明字重高一级,读得出这是标题不是介绍 */
.dshBrowserCtlAboutUpdateLabel {
  margin: 0;
  font-size: 12px;
  line-height: 17px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlAboutUpdateErr {
  margin: 0;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-state-error-primary, var(--dshb-danger));
}
/* 「关于」面板底部:用户协议 / 隐私政策(下划线文字,点击展开) */
.dshBrowserCtlAboutLegal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 2px;
  font-size: 12px;
  line-height: 17px;
}
.dshBrowserCtlAboutLegalLink {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font: inherit;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: var(--dsw-alias-border-l3, rgba(255,255,255,0.25));
  transition: color .15s ease, text-decoration-color .15s ease;
}
.dshBrowserCtlAboutLegalLink:hover,
.dshBrowserCtlAboutLegalLink:focus-visible {
  color: var(--dsw-alias-label-primary, inherit);
  text-decoration-color: currentColor;
  outline: none;
}
.dshBrowserCtlAboutLegalSep {
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  user-select: none;
}
/* 协议弹窗:正文独立滚动,不撑爆面板 */
.dshBrowserCtlLegalPanel { width: min(560px, 94vw); }
.dshBrowserCtlLegalBody {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-right: 4px;
  font-size: 12.5px;
  line-height: 20px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
}
/* flex 列滚动容器必须禁子元素收缩,否则内容会被压扁而不是滚动 */
.dshBrowserCtlLegalBody > * { flex: 0 0 auto; }
.dshBrowserCtlLegalSubtitle {
  margin: 0;
  font-size: 12px;
  line-height: 19px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlLegalSection {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dshBrowserCtlLegalSection h3 {
  margin: 0;
  font-size: 13px;
  line-height: 19px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlLegalSection p {
  margin: 0;
}
.dshBrowserCtlLegalFooter {
  display: flex;
  justify-content: center;
}
.dshBrowserCtlLegalFooter .dshBrowserCtlAboutUpdateBtn {
  min-width: 160px;
}
/* 配置面板 */
.dshBrowserCtlCfgModes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dshBrowserCtlCfgMode {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--dshb-div);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font-size: 12.5px;
}
.dshBrowserCtlCfgMode input {
  margin-top: 3px;
  flex: none;
  accent-color: var(--dshb-accent);
}
.dshBrowserCtlCfgModeTitle {
  display: block;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlCfgModeDesc {
  display: block;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  margin-top: 2px;
}
.dshBrowserCtlCfgOfficialNote {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  border: 1px dashed var(--dsw-alias-border-l2, var(--dshb-border));
  border-radius: 10px;
}
.dshBrowserCtlCfgFields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dshBrowserCtlCfgField {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
}
.dshBrowserCtlCfgFieldRow {
  display: flex;
  gap: 10px;
}
.dshBrowserCtlCfgFieldRow .dshBrowserCtlCfgField {
  flex: 1;
  min-width: 0;
}
.dshBrowserCtlCfgField input {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dshb-border));
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 13px;
  font-family: ui-monospace, Consolas, Menlo, monospace;
  box-sizing: border-box;
}
.dshBrowserCtlCfgField input:focus {
  outline: none;
  border-color: var(--dshb-accent);
}
/* 消息内容多行框:与 CfgField input 同族,但用正文字体、可换行 */
.dshBrowserCtlCfgField textarea {
  min-height: 64px;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dshb-border));
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 13px;
  line-height: 18px;
  font-family: inherit;
  resize: none;
  box-sizing: border-box;
}
.dshBrowserCtlCfgField textarea:focus {
  outline: none;
  border-color: var(--dshb-accent);
}
.dshBrowserCtlCfgNote {
  margin: 0;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlCfgErr {
  margin: 0;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-state-error-primary, var(--dshb-danger));
}
.dshBrowserCtlCfgOauthCode {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 2px;
  font-family: ui-monospace, Consolas, Menlo, monospace;
  text-align: center;
  padding: 12px 8px;
  border: 1px dashed var(--dsw-alias-border-l2, var(--dshb-border));
  border-radius: 10px;
  color: var(--dsw-alias-state-info-primary, var(--dshb-accent));
  background: transparent;
}
.dshBrowserCtlCfgActions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
/* 保存按钮三态(idle/loading/done),42px 高 + 上下 4px margin 与邻居对齐 */
.dshBrowserCtlCfgSave {
  height: 42px !important;
  margin: 4px 0 !important;
  min-width: 96px;
}
/* 推送页签:开关行 */
.dshBrowserCtlSwitchRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
}
.dshBrowserCtlSwitchLabel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dshBrowserCtlSwitchTitle {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlSwitchHint {
  font-size: 11px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlSwitch {
  position: relative;
  flex: none;
  width: 42px;
  height: 24px;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dshb-border));
  background: var(--dsw-alias-bg-layer-2, var(--dshb-seg-on));
  cursor: pointer;
  padding: 0;
  transition: background .15s ease, border-color .15s ease;
}
.dshBrowserCtlSwitch[data-on='true'] {
  background: var(--dshb-accent);
  border-color: transparent;
}
.dshBrowserCtlSwitch:disabled { opacity: .65; cursor: not-allowed; }
.dshBrowserCtlSwitchKnob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--dshb-contrast);
  box-shadow: 0 1px 3px rgba(0,0,0,.3);
  transition: transform .15s ease;
}
.dshBrowserCtlSwitch[data-on='true'] .dshBrowserCtlSwitchKnob { transform: translateX(18px); }
/* loading 态:隐藏旋钮,轨道内转圈 */
.dshBrowserCtlSwitch[data-busy='true'] .dshBrowserCtlSwitchKnob { opacity: 0; }
.dshBrowserCtlSwitchBusy {
  position: absolute;
  top: 4px;
  left: 13px;
  width: 14px;
  height: 14px;
  border: 2px solid var(--dshb-toggle);
  border-top-color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  border-radius: 50%;
  animation: dshBrowserCtlSpin .7s linear infinite;
}
.dshBrowserCtlSwitch[data-on='true'] .dshBrowserCtlSwitchBusy {
  border-color: var(--dshb-contrast);
  border-top-color: transparent;
}
@keyframes dshBrowserCtlSpin { to { transform: rotate(360deg); } }
/* 测试推送按钮:42px 三态 */
.dshBrowserCtlPushBtn {
  height: 42px !important;
  margin: 4px 0 !important;
  min-width: 128px;
}
/* 手动推送消息编辑器(2026-11-27 内框回归:折叠展开区与设备页分区同框) */
.dshBrowserCtlMsgCard {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--dshb-inset-border, var(--dshb-div));
  border-radius: 12px;
  background: var(--dshb-inset);
}
.dshBrowserCtlMsgHead {
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* 编辑器标题与输入区之间的浅细分割线(2026-11-27 用户反馈②,同 InsetHead 口径) */
  padding-bottom: 6px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, var(--dshb-div));
}
/* B1:原 .dshBrowserCtlMsgTitle 与通知中心行标题(L1869)同名双定义、规则互相覆盖——
   推送编辑器的标题改名 .dshBrowserCtlMsgCardTitle,通知行保留原名 */
.dshBrowserCtlMsgCardTitle {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlMsgHint {
  font-size: 11px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlMsgFoot {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dshBrowserCtlMsgCount {
  flex: 1;
  text-align: right;
  font-size: 10.5px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlMsgSendBtn {
  height: 42px !important;
  min-width: 96px;
}
/* 最近推送列表 */
.dshBrowserCtlPushList {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  max-height: 320px;
}
/* 通知分组标题(2026-11-16):官方消息 / 安全动态 */
.dshBrowserCtlPushGroupHead {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  padding: 4px 2px 0;
}
.dshBrowserCtlPushRow {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  line-height: 16px;
  background: transparent;
}
.dshBrowserCtlPushAside {
  flex: none;
  width: 78px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.dshBrowserCtlPushType {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
}
.dshBrowserCtlPushTime {
  font-size: 10.5px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.dshBrowserCtlPushMain {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dshBrowserCtlPushTitle {
  font-weight: 500;
  color: var(--dsw-alias-label-primary, inherit);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshBrowserCtlPushBody {
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  font-size: 11.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 关于按钮上的新版本小红点 */
.dshBrowserCtlAboutBtn { position: relative; display: inline-flex; }
.dshBrowserCtlBadgeDot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dshb-danger);
  border: 1.5px solid var(--dsw-panel-bg, var(--dshb-bg));
  pointer-events: none;
}
/* ---------- 顶栏「通知中心」下拉(铃铛) ----------
   2026-11-23 三分段改版:与手机消息中心(home.html msg-tabs)同构——
   官方公告 / 发给我 / 电脑推送 各自分段,行=徽标+短时间+标题(两行)+正文一行摘要,
   点整行进详情 pane(返回键回列表)。此前工作区副本漏带这组 CSS(正式版镜像有),
   的下拉一直裸奔,这次随改版一并补齐。 */
.dshBrowserCtlMsgMask {
  position: fixed;
  inset: 0;
  z-index: 40;
  border: none;
  background: transparent;
  padding: 0;
  cursor: default;
}
.dshBrowserCtlMsgPop {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 41;
  width: min(340px, 88vw);
  max-height: min(440px, 70vh);
  display: flex;
  flex-direction: column;
  background: var(--dsw-alias-bg-layer-1, var(--dshb-bg));
  border: 1px solid var(--dsw-alias-border-l2, var(--dshb-border));
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}
.dshBrowserCtlMsgPopHead {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 12px 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlMsgPopTitle { flex: 1 1 auto; min-width: 0; }
/* 返回列表按钮(详情 pane 左上角) */
.dshBrowserCtlMsgBack {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  width: 22px;
  height: 22px;
  padding: 0;
  margin-left: -4px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: 0 0 auto;
}
.dshBrowserCtlMsgBack:hover {
  color: var(--dsw-alias-label-primary, inherit);
  background: var(--dsw-alias-bg-layer-2, var(--dshb-seg-on));
}
/* 三分段 tab:官方公告 / 发给我 / 电脑推送(与手机 .msg-tabs 同款) */
.dshBrowserCtlMsgTabs {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
  margin: 2px 8px 6px;
  padding: 3px;
  background: var(--dsw-alias-bg-layer-2, var(--dshb-seg-on));
  border-radius: 10px;
}
.dshBrowserCtlMsgTab {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  font: inherit;
  font-size: 11.5px;
  line-height: 16px;
  padding: 4px 6px;
  /* 选中态圆角 = MsgTabs 容器 radius 10 − padding 3 = 7px(同 .dshBrowserCtlTab 口径) */
  border-radius: 7px;
  cursor: pointer;
  flex: 1 1 0;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.dshBrowserCtlMsgTab:hover { color: var(--dsw-alias-label-primary, inherit); }
.dshBrowserCtlMsgTab[data-on='true'] {
  background: var(--dsw-alias-fill-control-active, rgba(255, 255, 255, 0.12));
  color: var(--dsw-alias-label-primary, var(--dshb-text));
  font-weight: 600;
}
.dshBrowserCtlMsgTabN {
  font-size: 10px;
  color: var(--dsw-alias-accent-primary, var(--dshb-accent));
  font-variant-numeric: tabular-nums;
}
.dshBrowserCtlMsgTab[data-on='true'] .dshBrowserCtlMsgTabN { color: inherit; opacity: 0.75; }
.dshBrowserCtlMsgList {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  padding: 0 8px 8px;
}
/* flex 列滚动容器必须禁子元素收缩,否则内容被压扁而不是滚动(kb/10) */
.dshBrowserCtlMsgList > * { flex: 0 0 auto; }
.dshBrowserCtlMsgItem {
  appearance: none;
  border: none;
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 10px 8px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}
.dshBrowserCtlMsgItem:hover { background: var(--dsw-alias-bg-layer-2, var(--dshb-seg-on)); }
/* 行1:分类徽标 + 短时间 */
.dshBrowserCtlMsgRow1 {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.dshBrowserCtlMsgKind {
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  display: flex;
  align-items: center;
  gap: 6px;
}
.dshBrowserCtlMsgKindTag {
  flex: 0 0 auto;
  max-width: 72%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 6px;
  border-radius: 6px;
  font-size: 10.5px;
  line-height: 17px;
  color: var(--dsw-alias-state-success-primary, var(--dshb-ok));
  background: var(--dshb-ok-soft);
}
.dshBrowserCtlMsgKindTag[data-personal='true'],
.dshBrowserCtlMsgKindTag[data-cat='mine'] {
  color: var(--dsw-alias-accent-primary, var(--dshb-accent));
  background: var(--dshb-accent-soft);
}
/* 电脑推送徽标:中性灰(本机闸机历史,无官方/定向语义) */
.dshBrowserCtlMsgKindTag[data-cat='feed'] {
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  background: var(--dshb-chip);
}
/* 公告样式着色:与手机/官网个人中心同色系(kb/16.8 契约:info灰/update蓝/warning橙/event绿) */
.dshBrowserCtlMsgKindTag[data-style='update'] {
  color: var(--dsw-alias-accent-primary, var(--dshb-accent));
  background: var(--dshb-accent-soft);
}
.dshBrowserCtlMsgKindTag[data-style='warning'] {
  color: var(--dsw-alias-state-warning-primary, var(--dshb-warn));
  background: var(--dshb-warn-soft);
}
.dshBrowserCtlMsgKindTag[data-style='event'] {
  color: var(--dsw-alias-state-success-primary, var(--dshb-ok));
  background: var(--dshb-ok-soft);
}
.dshBrowserCtlMsgTime {
  margin-left: auto;
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
/* 标题:未读加粗,最多两行截断(与手机列表行同款) */
.dshBrowserCtlMsgTitle {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  line-height: 19px;
  font-weight: 400;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
}
.dshBrowserCtlMsgTitleText {
  flex: 1 1 auto;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.dshBrowserCtlMsgItem[data-unread='true'] .dshBrowserCtlMsgTitle {
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlMsgUnreadDot {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dshb-danger);
  transform: translateY(-1px);
}
/* 正文:列表里只留一行摘要 */
.dshBrowserCtlMsgBody {
  display: block;
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.dshBrowserCtlMsgEmpty {
  padding: 26px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
.dshBrowserCtlMsgErr {
  margin: 0;
  padding: 0 12px 10px;
  font-size: 11.5px;
  line-height: 17px;
  color: var(--dsw-alias-state-error-primary, var(--dshb-danger));
}
.dshBrowserCtlMsgFoot {
  flex: 0 0 auto;
  padding: 8px 12px 10px;
  border-top: 1px solid var(--dsw-alias-border-l2, var(--dshb-border));
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
/* 详情 pane:列表行点开后的全文视图(返回按钮在弹窗头部) */
.dshBrowserCtlMsgDetail {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  padding: 2px 12px 12px;
}
.dshBrowserCtlMsgDetail > * { flex: 0 0 auto; max-width: 100%; }
.dshBrowserCtlMsgDTitle {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
  word-break: break-word;
}
.dshBrowserCtlMsgDMeta {
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  font-variant-numeric: tabular-nums;
}
.dshBrowserCtlMsgDBody {
  margin: 0;
  font-size: 12.5px;
  line-height: 19px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  white-space: pre-wrap;
  word-break: break-word;
}
.dshBrowserCtlMsgDBtns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dshBrowserCtlMsgDBtn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dshb-border));
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-accent-primary, var(--dshb-accent));
  font-size: 12px;
  line-height: 17px;
  text-decoration: none;
  cursor: pointer;
  max-width: 100%;
  word-break: break-all;
}
.dshBrowserCtlMsgDBtn:hover {
  background: var(--dsw-alias-bg-layer-2, var(--dshb-seg-on));
  text-decoration: none;
}
/* ---------- 工单反馈弹窗 ---------- */
.dshBrowserCtlPanelTicket { width: min(600px, 94vw); overflow: hidden; }
.dshBrowserCtlTicketBody {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding-right: 2px;
}
.dshBrowserCtlTicketBody > * { flex: 0 0 auto; }
.dshBrowserCtlTicketInput {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  font: inherit;
  font-size: 13px;
  line-height: 19px;
  color: var(--dsw-alias-label-primary, inherit);
  background: transparent;
  border: 1px solid var(--dsw-alias-border-l2, var(--dshb-border));
  border-radius: 9px;
  outline: none;
}
.dshBrowserCtlTicketInput:focus { border-color: var(--dshb-accent); }
.dshBrowserCtlTicketDest {
  display: flex; flex-direction: column; gap: 3px; width: 100%;
  margin: 0 0 8px; padding: 10px 12px; text-align: left;
  border-radius: 9px; border: none;
  /* B1 收编:裸 button 原为透明底,归入 soft(灰底)家族,与 BtnSoft 同一变量来源 */
  background: var(--dsw-alias-fill-control-secondary, var(--dshb-soft));
  color: inherit; font: inherit; cursor: pointer;
}
.dshBrowserCtlTicketDest:hover { background: var(--dsw-alias-bg-layer-2, var(--dshb-seg-on)); }
.dshBrowserCtlTicketDest:disabled { opacity: .5; cursor: default; }
.dshBrowserCtlTicketDestTitle { font-size: 13px; font-weight: 600; line-height: 18px; }
.dshBrowserCtlTicketDestDesc { font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary, var(--dshb-faint)); }

/* ============================================================
   B3 视觉统一 · 追加区(panel-b3,2026-11-26,B2 并行期只允许本区追加)
   对照 docs/notes/panel-restructure-20261126/mockups P1-P7「简洁高级」口径。
   本区内的既有类零改动;放行后既有类改引 token、卡片 JSX 收编也以本区为锚。
   ============================================================ */

/* ---------- B3.1 色板 token(散落 hex 的唯一归宿) ----------
   前缀 --dshb- 避免与宿主 --dsw-alias-* 混名。深色=默认(mockup 实测值);
   浅色宿主整组翻转(prefers-color-scheme: light)——此前只有深色 fallback,
   浅色宿主下硬编码色失效(B3 补全)。hex 只允许出现在本区。 */
:root {
  /* 唯一实色底=面板底;卡片/分区一律透明底,层次=描边 + 白色 alpha 叠加层
     (2026-11-26 用户实测拍板:实色偏蓝卡底 #232630 观感发蓝,回归旧版透明卡+描边) */
  --dshb-bg: #1b1d22;
  --dshb-border: #2a2c33;
  --dshb-inset: rgba(255, 255, 255, 0.03);
  /* 内框分区描边(2026-11-27 用户反馈「分区内框回归」):深=7% 白 alpha(5.5-8% 带内);
     浅色档=#dcdfe4(--dshb-border 浅色同值,浅底上白 alpha 不可见) */
  --dshb-inset-border: rgba(255, 255, 255, 0.07);
  /* 分割线:强=卡外描边级,弱=行分隔 */
  --dshb-div: rgba(255, 255, 255, 0.055);
  --dshb-div-soft: rgba(255, 255, 255, 0.04);
  /* 文字三级:正文 / 次要 / 弱化 */
  --dshb-text: #e8eaed;
  --dshb-muted: #9aa0a8;
  --dshb-faint: #8b8f98;
  /* 语义色 + 低饱和底(徽标/dsoft 统一 13-16% 透明度,强调色克制) */
  --dshb-accent: #3d7eff;
  --dshb-accent-soft: rgba(61, 126, 255, 0.15);
  --dshb-accent-text: #9db9ff;
  --dshb-ok: #34b371;
  --dshb-ok-soft: rgba(52, 179, 113, 0.13);
  --dshb-danger: #e5655c;
  --dshb-danger-soft: rgba(229, 101, 92, 0.13);
  --dshb-danger-soft-hover: rgba(229, 101, 92, 0.2);
  --dshb-danger-soft-active: rgba(229, 101, 92, 0.26);
  --dshb-warn: #e69138;
  --dshb-warn-soft: rgba(230, 145, 56, 0.15);
  /* 控件面:按钮软底 / chip / 分段选中 / 开关轨(全部白色 alpha,浅色宿主由浅色组翻转) */
  --dshb-soft: rgba(255, 255, 255, 0.08);
  --dshb-chip: rgba(255, 255, 255, 0.06);
  --dshb-seg-on: rgba(255, 255, 255, 0.12);
  --dshb-toggle: rgba(255, 255, 255, 0.18);
  --dshb-mask: rgba(8, 10, 14, 0.45);
  --dshb-contrast: #ffffff;
  --dshb-qr-bg: #ffffff;
}
@media (prefers-color-scheme: light) {
  :root {
    --dshb-bg: #f6f7f9;
    --dshb-border: #dcdfe4;
    --dshb-inset: rgba(0, 0, 0, 0.03);
    --dshb-inset-border: #dcdfe4;
    --dshb-div: rgba(16, 20, 28, 0.09);
    --dshb-div-soft: rgba(16, 20, 28, 0.06);
    --dshb-text: #22262c;
    --dshb-muted: #5f6570;
    --dshb-faint: #8a909b;
    --dshb-accent: #2f66e0;
    --dshb-accent-soft: rgba(47, 102, 224, 0.1);
    --dshb-accent-text: #2f66e0;
    --dshb-ok: #22945c;
    --dshb-ok-soft: rgba(34, 148, 92, 0.12);
    --dshb-danger: #cc4a42;
    --dshb-danger-soft: rgba(204, 74, 66, 0.1);
    --dshb-danger-soft-hover: rgba(204, 74, 66, 0.17);
    --dshb-danger-soft-active: rgba(204, 74, 66, 0.24);
    --dshb-warn: #b97a1f;
    --dshb-warn-soft: rgba(185, 122, 31, 0.12);
    --dshb-soft: rgba(0, 0, 0, 0.06);
    --dshb-chip: rgba(0, 0, 0, 0.05);
    --dshb-seg-on: rgba(0, 0, 0, 0.1);
    --dshb-toggle: rgba(0, 0, 0, 0.16);
    --dshb-mask: rgba(16, 20, 28, 0.28);
    --dshb-contrast: #ffffff;
    --dshb-qr-bg: #ffffff;
  }
}

/* ---------- B3.2 状态色调钩子(卡片头部右侧状态字/错误红字/toast) ----------
   放行后 push 等卡的内联 style={{ color: ... }} 改挂 data-tone / 专类,不再写色值。 */
.dshBrowserCtlCardStat[data-tone='ok'] { color: var(--dshb-ok); }
.dshBrowserCtlCardStat[data-tone='muted'] { color: var(--dshb-faint); font-weight: 400; }
/* 折叠行(卡内「手动发送 / 测试 ▼」等):chevron+标题+右侧弱化提示 */
.dshBrowserCtlFoldChev {
  display: inline-flex;
  flex: none;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  transition: transform .15s ease;
}
.dshBrowserCtlFoldChev[data-open='true'] { transform: rotate(90deg); }
.dshBrowserCtlFoldLabel { font-size: 13px; line-height: 18px; font-weight: 500; }
/* 账号卡「已登录 · 邮箱 · 端口」行(JSX 已引用、此前漏定义,随 B3 补齐) */
.dshBrowserCtlCfgAcctLine {
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-primary, var(--dshb-text));
  word-break: break-all;
}
/* 「忽略此版本」行容器(JSX 已引用、此前漏定义) */
.dshBrowserCtlAboutUpdateIgnoreRow { display: flex; margin-top: 2px; }
.dshBrowserCtlCardDescErr {
  margin: 0;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dshb-danger);
}
/* 行内反馈:成功沿用 PairedMsg 的绿;失败翻红(不破坏既有默认色) */
.dshBrowserCtlPairedMsg[data-ok='false'] { color: var(--dshb-danger); }

/* ---------- B3.3 工单弹窗:内联样式收编目标类 ----------
   对应 ticket.jsx 现存 10 处内联 style(导出成功框/去向标题/路径补输行),放行后替换。 */
.dshBrowserCtlTicketActions { justify-content: flex-start; }
.dshBrowserCtlTicketDone {
  margin: 12px 0 2px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--dshb-ok-soft);
}
.dshBrowserCtlTicketDoneTitle {
  font-size: 12.5px;
  line-height: 18px;
  font-weight: 500;
  color: var(--dshb-ok);
  margin-bottom: 4px;
}
.dshBrowserCtlTicketDonePath {
  font-size: 11.5px;
  line-height: 1.5;
  word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--dshb-muted);
}
.dshBrowserCtlTicketDoneBtns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.dshBrowserCtlTicketDestHead {
  margin: 14px 0 6px;
  font-size: 12.5px;
  line-height: 18px;
  font-weight: 600;
  color: var(--dshb-text);
}
.dshBrowserCtlTicketPickRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
}
.dshBrowserCtlTicketPickInput { flex: 1 1 220px; min-width: 0; }
.dshBrowserCtlTicketNoteEnd { margin-top: 12px; }

/* ---------- B3.4 账号卡:内联样式收编目标类 ----------
   对应 account.jsx 现存 4 处内联 style(授权链接 / 「或」分隔行 / 密码登录输入框
   inputCss 对象),放行后替换;输入框对齐 CfgField input 家族(嵌入底+聚焦描边)。 */
.dshBrowserCtlAcctLink {
  color: var(--dshb-accent-text);
  word-break: break-all;
}
.dshBrowserCtlAcctOr {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 10px 0 4px;
  font-size: 11px;
  color: var(--dshb-faint);
}
.dshBrowserCtlAcctOrLine {
  flex: 1 1 auto;
  height: 1px;
  background: var(--dshb-chip);
}
.dshBrowserCtlAcctInput {
  width: 100%;
  box-sizing: border-box;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--dshb-div);
  border-radius: 8px;
  background: transparent;
  color: var(--dshb-text);
  font-size: 13px;
  font-family: inherit;
  outline: none;
}
.dshBrowserCtlAcctInput:focus { border-color: var(--dshb-accent); }

/* ---------- B3.5 一键自更新:错误态包裹(内联 style 收编) ---------- */
.dshBrowserCtlUpdateErrWrap {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

/* ---------- B3.6 内框分区骨架(devices.jsx Inset 引用) ----------
   口径沿革:①实色深底 #1e2128 被毙(第三种深底色);②实色卡底 #232630 被毙(发蓝),
   HEAD=卡「透明底+描边」+分区无框;③2026-11-27 用户反馈「分区内框回归」——
   结合前两轮口径,框不许实色深底:细描边(1px --dshb-inset-border,深=7% 白 alpha/
   浅=#dcdfe4)+ 极低透明度底(--dshb-inset,深 3% 白 alpha/浅 3% 黑 alpha)。
   严禁实色偏蓝灰(#1e2128/#232630)回潮。分区标题(12px/600)进框内首行(InsetHead)。
   同语义分区(安全卡凭证展开区 SigDevs/推送卡编辑器 MsgCard/最近推送 PairedList)同框。 */
.dshBrowserCtlInsetBox {
  margin: 0 0 8px;
  padding: 2px 12px 4px;
  border: 1px solid var(--dshb-inset-border, var(--dshb-div));
  border-radius: 12px;
  background: var(--dshb-inset);
}
/* 分区标题行:框内首行(devices.jsx Inset 原内联收编;上 8px+框 2px=10px 与旧版一致)。
   2026-11-27 用户反馈②:标题与内容之间加一道浅细分割线,口径复用设备页 InRow 的
   行分隔线(dsw-alias-border-l1),不发明第二种线。 */
.dshBrowserCtlInsetHead {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 6px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, var(--dshb-div));
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
}
`