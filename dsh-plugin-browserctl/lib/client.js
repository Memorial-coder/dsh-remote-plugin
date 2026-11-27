var module = { exports: {} }; var exports = module.exports;
window.__ModuleLoader__.load({ id: "dsh-plugin-browserctl", factory: (require) => {
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.jsx
var client_exports = {};
__export(client_exports, {
  __demoPanel: () => __demoPanel,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_dsh_client_store = require("@deepseek-ai/dsh-client-store");
var import_dsh_client_ui_primitives6 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/const.js
var NS = "browserctl";
var IS_TEST = /-test$/.test(NS);
var STYLE_ID = NS + "/styles";
var VERSION = true ? "1.0.32" : "dev";
var ABOUT_LINKS = {
  website: "https://remote.ymzcc.com/dsh-remote/",
  github: "https://github.com/Memorial-coder/dsh-remote-plugin",
  app: "https://github.com/Memorial-coder/dsh-remote-plugin/releases/latest",
  qq: "https://qm.qq.com/q/K6RXqOKLAu"
};
var PLUGIN_ADD_CMD = "dsh plugin add github:Memorial-coder/dsh-remote-plugin";
var MS_AUTHENTICATOR_URL = "https://www.microsoft.com/zh-cn/security/authenticator/mobile-app";
function lsGet(k) {
  try {
    return window.localStorage.getItem(k) || "";
  } catch (e) {
    return "";
  }
}
function lsSet(k, v) {
  try {
    window.localStorage.setItem(k, v);
  } catch (e) {
  }
}
var MSG_SEEN_KEY = "dsh_msg_seen_" + NS;
function msgSeenTs() {
  const v = parseInt(lsGet(MSG_SEEN_KEY), 10);
  return Number.isFinite(v) ? v : 0;
}
function msgIsSeen(msg) {
  return (Number(msg && msg.createdAt) || 0) <= msgSeenTs();
}
var DEEPLINK_HASH_KEY = "dshremote-open";
var DEEPLINK_SID_RE = /^[A-Za-z0-9_-]{1,120}$/;
function consumeOpenSessionHash(openSession) {
  try {
    const h = String(typeof location !== "undefined" && location.hash || "");
    if (!h || h.length < DEEPLINK_HASH_KEY.length + 2) return;
    const m = new RegExp("[#&]" + DEEPLINK_HASH_KEY + "=([^&]+)").exec(h);
    if (!m) return;
    const raw = decodeURIComponent(m[1] || "");
    const sid = raw.startsWith("dshsession:") ? raw.slice(11) : raw;
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {
    }
    if (!sid || !DEEPLINK_SID_RE.test(sid)) return;
    const tryOpen = (delay) => setTimeout(() => {
      try {
        openSession(sid);
      } catch (e) {
      }
    }, delay);
    tryOpen(0);
    tryOpen(1500);
  } catch (e) {
  }
}
function apiPrefix() {
  try {
    const p = String(typeof location !== "undefined" && location.pathname || "");
    let m = /^\/p\/(1[6-9]\d{4})(?=\/|$)/.exec(p);
    if (m) return "/p/" + m[1];
    m = /^\/dsh-remote\/p\/([a-z0-9]{8,32})(?=\/|$)/.exec(p);
    if (m) return "/dsh-remote/p/" + m[1];
  } catch {
  }
  return "";
}
var API_P = apiPrefix();

// src/client/styles.js
var css = `
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
/* \u5F02\u6B65\u64CD\u4F5C(\u542F\u52A8/\u505C\u6B62\u96A7\u9053\u7B49)\u7684\u8F6C\u5708\u52A0\u8F7D\u6307\u793A:\u8DDF\u968F\u5F53\u524D\u6587\u5B57\u989C\u8272,\u653E\u8FDB\u6309\u94AE/\u72B6\u6001\u680F/\u5360\u4F4D\u6846 */
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
/* \u4E8C\u7EF4\u7801\u5360\u4F4D\u6846\u91CC\u7684\u52A0\u8F7D\u6001:spinner + \u63D0\u793A\u6587\u5B57\u4E00\u884C\u5C45\u4E2D */
.dshBrowserCtlQrLoading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  font-size: 13px;
  padding: 0 14px;
  text-align: center;
}
/* \u9876\u90E8\u529F\u80FD\u9875\u7B7E:\u8FDE\u63A5 / \u8BBE\u5907 / 2FA / \u9ED1\u540D\u5355 / \u65E5\u5FD7,\u4E00\u6B21\u53EA\u663E\u793A\u4E00\u4E2A\u529F\u80FD\u533A */
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
  /* \u9009\u4E2D/hover \u9AD8\u4EAE\u5706\u89D2\u53E3\u5F84(2026-11-27 \u7528\u6237\u53CD\u9988\u2460):\u5185\u5C42\u5706\u89D2 = \u5916\u5C42\u5BB9\u5668\u5706\u89D2 \u2212 padding\u3002
     Tabs \u5BB9\u5668 radius 10 + padding 3 \u2192 \u5185\u5C42 7px;8px \u4F1A\u5728\u56DB\u89D2\u8D8A\u51FA\u5BB9\u5668\u5706\u89D2\u3002 */
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
  /* \u5185\u5BB9\u533A\u72EC\u7ACB\u6EDA\u52A8\uFF1A\u5934\u90E8/\u9875\u7B7E\u9489\u4F4F\uFF0C\u5185\u5BB9\u8D85\u51FA\u9762\u677F\u9AD8\u5EA6\u65F6\u5728\u6B64\u6EDA\u52A8\uFF08\u6BD4\u6574\u5361\u6EDA\u52A8\u66F4\u53EF\u9760\uFF09 */
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
/* flex \u5217\u7684\u5B50\u5143\u7D20\u9ED8\u8BA4 flex-shrink:1\uFF0C\u5728\u6709\u754C\u9AD8\u5EA6\u91CC\u4F1A\u88AB\u538B\u6241/\u88C1\u5207\u800C\u4E0D\u662F\u6EA2\u51FA\u6EDA\u52A8\u3002
   \u5FC5\u987B\u7981\u6B62\u6536\u7F29\uFF0C\u5B50\u5143\u7D20\u4FDD\u6301\u81EA\u7136\u9AD8\u5EA6\uFF0C\u7531\u5185\u5BB9\u533A\u81EA\u8EAB\u6EDA\u52A8\uFF08\u5B9E\u6D4B\uFF1A\u4E0D\u52A0\u5219\u5361\u7247 body \u88AB\u88C1\uFF09\u3002 */
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
/* \u5361\u7247\u5934\u90E8\u63CF\u8FF0\u6587\u5B57(\u56FE\u4E8C:\u5361\u7247\u4E0B\u65B9\u4E00\u5C0F\u884C\u7070\u8272\u8BF4\u660E) */
.dshBrowserCtlCardDesc {
  margin: 0;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
}
/* \u5361\u7247\u5934\u90E8\u53F3\u4FA7\u72B6\u6001\u6587\u5B57 */
.dshBrowserCtlCardStat {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
/* \u8FDB\u884C\u4E2D\u64CD\u4F5C:\u6574\u5361\u534A\u900F\u660E,\u63D0\u793A"\u6B63\u5728\u5904\u7406" */
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
/* ---------- \u6587\u5B57\u6309\u94AE\u7EDF\u4E00\u8F6F\u5E95(2026-11-25) ----------
   primitives Button \u65E0 secondary \u53D8\u4F53,ghost/secondary \u6587\u5B57\u6309\u94AE\u6B64\u524D=\u900F\u660E\u5E95,
   \u548C\u8BF4\u660E\u6587\u5B57\u6DF7\u5728\u4E00\u8D77\u5206\u4E0D\u6E05\u662F\u6309\u94AE\u3002\u7EDF\u4E00\u8865:\u7070\u5E95+\u7EC6\u63CF\u8FB9,\u60AC\u505C/\u6309\u4E0B\u52A0\u6DF1;
   primary(\u767D\u5E95)\u4E0E\u56FE\u6807\u6309\u94AE\u4E0D\u53D7\u5F71\u54CD(\u5305\u88C5\u5668\u53EA\u7ED9\u6587\u5B57\u7C7B\u6309\u94AE\u52A0 dshBrowserCtlBtnSoft)\u3002 */
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
/* ---------- \u5371\u9669\u8BED\u4E49\u6309\u94AE(B1,2026-11-26;mockup \u53E3\u5F84) ----------
   \u5371\u9669\u52A8\u4F5C = 13% \u4F4E\u9971\u548C\u7EA2\u5E95 + \u7EA2\u5B57 + \u65E0\u8FB9\u6846(BtnDangerSoft),\u4E0D\u7ED9\u63CF\u8FB9\u3001\u4E0D\u7ED9\u5B9E\u8272;
   \u5B9E\u8272\u7EA2\u53EA\u4FDD\u7559\u7ED9\u300C\u505C\u6B62\u63A7\u5236\u300D(BtnDanger)\u4E0E\u300C\u91CD\u542F\u95F8\u673A\u300D(MiniBtnDanger)\u4E24\u4E2A\u52A8\u4F5C\u3002
   \u5E26 BtnDanger \u7C7B\u540D\u7684\u6309\u94AE\u7531 Button \u5305\u88C5\u5668\u8DF3\u8FC7 BtnSoft,\u907F\u514D\u4E24\u5957 !important \u80CC\u666F\u6253\u67B6\u3002 */
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
/* \u5361\u7247\u5185\u5C0F\u6587\u5B57\u6309\u94AE(\u7B7E\u540D\u5065\u5EB7\u884C\u7684\u300C\u5237\u65B0/\u91CD\u542F\u95F8\u673A\u300D\u7B49):\u540C\u6837\u7ED9\u5E95,\u522B\u6DF7\u8FDB\u6B63\u6587 */
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
/* MiniBtn \u5371\u9669\u53D8\u4F53(\u300C\u91CD\u542F\u95F8\u673A\u300D\u4FDD\u7559\u5B9E\u8272\u7EA2,mockup \u53E3\u5F84):\u7F6E\u4E8E MiniBtn \u89C4\u5219\u4E4B\u540E,\u540C\u7279\u5F02\u6027\u540E\u8005\u80DC */
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
/* \u5361\u4F53\u5185\u90E8\u6298\u53E0\u884C(\u7B7E\u540D\u5361\u300C\u8BBE\u5907\u51ED\u8BC1\u300D/\u63A8\u9001\u5361\u300C\u624B\u52A8\u53D1\u9001 \u25BC\u300D):\u590D\u7528 CardHead \u9AA8\u67B6 */
.dshBrowserCtlFoldBtn {
  width: 100%;
  padding: 6px 0;
  gap: 6px;
}
/* \u5C55\u5F00\u6001\u7684\u6298\u53E0\u5206\u533A\u6807\u9898(\u8BBE\u5907\u51ED\u636E/\u914D\u5BF9\u8BBE\u7F6E/\u624B\u52A8\u53D1\u9001/\u9AD8\u7EA7)\u4E0E\u4E0B\u65B9\u5185\u5BB9\u4E4B\u95F4\u540C\u6837\u52A0\u4E00\u9053
   \u6D45\u7EC6\u5206\u5272\u7EBF(2026-11-27 \u7528\u6237\u53CD\u9988\u2461,\u540C InsetHead \u53E3\u5F84,\u590D\u7528 dsw-alias-border-l1);
   \u6536\u8D77\u6001\u4E0B\u65B9\u65E0\u5185\u5BB9,\u4E0D\u52A0\u7EBF,\u907F\u514D\u5B64\u7EBF\u3002 */
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
/* \u9AD8\u5185\u5BB9\u5361\u7247(\u4E8C\u7EF4\u7801 + \u8BBE\u5907/\u63A8\u9001\u5217\u8868):450px \u4F1A\u628A\u5E95\u90E8\u5217\u8868\u88C1\u6389\u4E14\u65E0\u6CD5\u6EDA\u52A8\u3002
   \u653E\u5BBD\u5230 2400px,\u5185\u5BB9\u8D85\u9AD8\u65F6\u7531\u5916\u5C42 TabBody \u8D1F\u8D23\u6EDA\u52A8,\u4E0D\u518D\u85CF\u5185\u5BB9\u3002 */
.dshBrowserCtlCardBodyTall[data-open='true'] {
  max-height: 2400px;
}
/* \u300C\u8BBE\u5907\u51ED\u8BC1\u300D\u5217\u8868:\u5185\u90E8\u72EC\u7ACB\u6EDA\u52A8(\u540C DevBody \u60EF\u4F8B,kb/10 #4 \u8BBE\u5907\u533A\u72EC\u7ACB\u6EDA\u52A8)\u3002
   \u9ED8\u8BA4 body \u5C55\u5F00\u6001 max-height 450px + overflow hidden,35 \u53F0\u8BBE\u5907 ~2000px \u5185\u5BB9
   \u4F1A\u88AB\u88C1\u6B7B\u4E14\u5916\u5C42\u65E0\u5904\u53EF\u6EDA(2026-11-22 \u7528\u6237\u5B9E\u6D4B"\u65E0\u6CD5\u6B63\u5E38\u4E0B\u6ED1")\u3002
   flex \u5217\u6EDA\u52A8\u5BB9\u5668\u5FC5\u987B\u7981\u5B50\u5143\u7D20\u6536\u7F29,\u5426\u5219\u884C\u88AB\u538B\u6241/\u88C1\u5207\u3002 */
.dshBrowserCtlSigDevs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* 2026-11-27 \u5185\u6846\u56DE\u5F52:\u4E0E\u8BBE\u5907\u9875 InsetBox \u540C\u8BED\u4E49(\u5C55\u5F00\u5206\u533A=\u7EC6\u63CF\u8FB9+3% \u5E95),\u884C\u76D2\u7EC6\u63CF\u8FB9\u4FDD\u6301 */
  padding: 8px 10px;
  border: 1px solid var(--dshb-inset-border, var(--dshb-div));
  border-radius: 12px;
  background: var(--dshb-inset);
}
.dshBrowserCtlSigDevs > * { flex: 0 0 auto; }
/* B1:.dshBrowserCtlActions \u7684\u91CD\u590D\u5B9A\u4E49\u5DF2\u53BB\u91CD(\u4FDD\u7559 L636 \u9996\u4E2A,\u4E24\u5904\u89C4\u5219\u5B8C\u5168\u76F8\u540C) */
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

/* \u63A8\u9001\u5361\u300C\u6700\u8FD1\u63A8\u9001\u300D\u5206\u533A(2026-11-27 \u5185\u6846\u56DE\u5F52:\u6807\u9898+\u884C\u5217\u8868,\u4E0E\u8BBE\u5907\u9875\u5206\u533A\u540C\u8BED\u4E49\u540C\u6846) */
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
  /* \u6807\u9898\u4E0E\u884C\u5217\u8868\u4E4B\u95F4\u7684\u6D45\u7EC6\u5206\u5272\u7EBF(2026-11-27 \u7528\u6237\u53CD\u9988\u2461,\u540C InsetHead \u53E3\u5F84) */
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
/* \u6765\u6E90\u5FBD\u6807:App=\u84DD\u5B57\u6D45\u84DD\u5E95,\u7F51\u9875=\u7070\u5B57\u63CF\u8FB9(\u8BBE\u5907\u884C/\u914D\u5BF9\u884C\u901A\u7528) */
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
/* \u300C\u91CD\u590D N \u6761\u300D\u5FBD\u6807(P5 \u5C55\u793A\u5C42\u53BB\u91CD,2026-11-27):\u5408\u5E76\u884C\u6807\u51FA\u88AB\u5F52\u5E76\u7684\u6761\u6570\u3002
   \u7070\u63CF\u8FB9 chip,\u4E0E KindTag web \u6863\u540C\u65CF,\u4E2D\u6027\u4E0D\u62A2\u773C;\u96F6\u65B0\u8272,\u5168\u8D70\u65E2\u6709 token\u3002 */
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
/* \u9ED1\u540D\u5355 */
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
/* \u8FD0\u884C\u65E5\u5FD7:\u53EF\u6298\u53E0,\u6700\u591A\u663E\u793A\u4E00\u5C4F,\u5185\u90E8\u6EDA\u52A8 */
/* \u5206\u7C7B\u9875\u7B7E(2026-11-16):\u6A2A\u5411\u53EF\u6362\u884C\u7684\u5C0F chip,\u9009\u4E2D\u9AD8\u4EAE;\u8BA1\u6570\u7528\u5F31\u5316\u8272 */
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
/* footer \u69FD\u4F4D\u951A\u70B9:renderSlot \u9ED8\u8BA4\u7ED9 display:contents(\u5185\u8054\u6837\u5F0F),
   \u591A\u4E2A launchers \u4F1A\u53D8\u6210\u6A2A\u5411 flex \u5144\u5F1F\u4E92\u76F8\u53E0\u538B\u3002\u5F3A\u5236\u7EB5\u5411\u7D27\u51D1\u5806\u53E0\u3002 */
div[data-slot='sidebar.footer.action'] {
  display: flex !important;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}
/* \u5173\u952E:\u7981\u6B62\u5B50\u5143\u7D20\u7EB5\u5411\u62C9\u4F38,\u5426\u5219 desktop \u7AEF footer \u6709\u7A7A\u4F59\u9AD8\u5EA6\u65F6
   "\u7528\u91CF\u7EDF\u8BA1"\u7B49\u6761\u76EE\u4F1A\u88AB\u62C9\u6210\u4E00\u5927\u5757(\u5E26\u6EDA\u52A8\u6761\u7684\u9AD8\u76D2\u5B50) */
div[data-slot='sidebar.footer.action'] > * {
  flex: none !important;
  margin: 2px -2px !important;
  width: calc(100% + 4px);
  align-self: stretch;
}
/* \u5934\u90E8\u5C0F\u6D6E\u5C42:\u5173\u4E8E / \u914D\u7F6E(\u590D\u7528\u4E3B\u6D6E\u5C42\u906E\u7F69\u4E0E\u9762\u677F,\u4EC5\u6536\u7A84\u5BBD\u5EA6) */
.dshBrowserCtlPanelNested { width: min(460px, 94vw); }
.dshBrowserCtlPanelCfg { width: min(520px, 94vw); }
/* \u5173\u4E8E\u9762\u677F */
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
/* \u9876\u680F\u300C\u8D26\u53F7\u767B\u5F55\u300D\u6309\u94AE */
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
/* \u672A\u767B\u5F55\u65F6\u542F\u52A8\u8FDC\u7A0B\u7684\u63D0\u793A\u5F39\u7A97 */
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
/* \u63D2\u4EF6\u65B0\u7248\u672C\u63D0\u793A\u5F39\u7A97\u91CC\u7684\u66F4\u65B0\u8BF4\u660E\u5217\u8868 */
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
/* \u68C0\u67E5\u66F4\u65B0:42px \u4E09\u6001\u6309\u94AE + \u7248\u672C\u5BF9\u6BD4 + \u4E0B\u8F7D + \u66F4\u65B0\u8BF4\u660E */
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
/* \u66F4\u65B0\u533A\u5206\u9694\u7EBF:\u628A\u300C\u7248\u672C\u5BF9\u6BD4+\u6309\u94AE\u300D\u548C\u300C\u66F4\u65B0\u65B9\u6CD5/\u66F4\u65B0\u8BF4\u660E\u300D\u4E24\u644A\u4FE1\u606F\u9694\u5F00(2026-11-25) */
.dshBrowserCtlAboutUpdateSep {
  height: 1px;
  margin: 2px 0;
  background: var(--dsw-alias-border-l2, var(--dshb-border));
}
/* \u300C\u66F4\u65B0\u8BF4\u660E\u300D\u5C0F\u8282\u6807\u9898:\u6BD4\u6B63\u6587\u8BF4\u660E\u5B57\u91CD\u9AD8\u4E00\u7EA7,\u8BFB\u5F97\u51FA\u8FD9\u662F\u6807\u9898\u4E0D\u662F\u4ECB\u7ECD */
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
/* \u300C\u5173\u4E8E\u300D\u9762\u677F\u5E95\u90E8:\u7528\u6237\u534F\u8BAE / \u9690\u79C1\u653F\u7B56(\u4E0B\u5212\u7EBF\u6587\u5B57,\u70B9\u51FB\u5C55\u5F00) */
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
/* \u534F\u8BAE\u5F39\u7A97:\u6B63\u6587\u72EC\u7ACB\u6EDA\u52A8,\u4E0D\u6491\u7206\u9762\u677F */
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
/* flex \u5217\u6EDA\u52A8\u5BB9\u5668\u5FC5\u987B\u7981\u5B50\u5143\u7D20\u6536\u7F29,\u5426\u5219\u5185\u5BB9\u4F1A\u88AB\u538B\u6241\u800C\u4E0D\u662F\u6EDA\u52A8 */
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
/* \u914D\u7F6E\u9762\u677F */
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
/* \u6D88\u606F\u5185\u5BB9\u591A\u884C\u6846:\u4E0E CfgField input \u540C\u65CF,\u4F46\u7528\u6B63\u6587\u5B57\u4F53\u3001\u53EF\u6362\u884C */
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
/* \u4FDD\u5B58\u6309\u94AE\u4E09\u6001(idle/loading/done),42px \u9AD8 + \u4E0A\u4E0B 4px margin \u4E0E\u90BB\u5C45\u5BF9\u9F50 */
.dshBrowserCtlCfgSave {
  height: 42px !important;
  margin: 4px 0 !important;
  min-width: 96px;
}
/* \u63A8\u9001\u9875\u7B7E:\u5F00\u5173\u884C */
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
/* loading \u6001:\u9690\u85CF\u65CB\u94AE,\u8F68\u9053\u5185\u8F6C\u5708 */
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
/* \u6D4B\u8BD5\u63A8\u9001\u6309\u94AE:42px \u4E09\u6001 */
.dshBrowserCtlPushBtn {
  height: 42px !important;
  margin: 4px 0 !important;
  min-width: 128px;
}
/* \u624B\u52A8\u63A8\u9001\u6D88\u606F\u7F16\u8F91\u5668(2026-11-27 \u5185\u6846\u56DE\u5F52:\u6298\u53E0\u5C55\u5F00\u533A\u4E0E\u8BBE\u5907\u9875\u5206\u533A\u540C\u6846) */
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
  /* \u7F16\u8F91\u5668\u6807\u9898\u4E0E\u8F93\u5165\u533A\u4E4B\u95F4\u7684\u6D45\u7EC6\u5206\u5272\u7EBF(2026-11-27 \u7528\u6237\u53CD\u9988\u2461,\u540C InsetHead \u53E3\u5F84) */
  padding-bottom: 6px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, var(--dshb-div));
}
/* B1:\u539F .dshBrowserCtlMsgTitle \u4E0E\u901A\u77E5\u4E2D\u5FC3\u884C\u6807\u9898(L1869)\u540C\u540D\u53CC\u5B9A\u4E49\u3001\u89C4\u5219\u4E92\u76F8\u8986\u76D6\u2014\u2014
   \u63A8\u9001\u7F16\u8F91\u5668\u7684\u6807\u9898\u6539\u540D .dshBrowserCtlMsgCardTitle,\u901A\u77E5\u884C\u4FDD\u7559\u539F\u540D */
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
/* \u6700\u8FD1\u63A8\u9001\u5217\u8868 */
.dshBrowserCtlPushList {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  max-height: 320px;
}
/* \u901A\u77E5\u5206\u7EC4\u6807\u9898(2026-11-16):\u5B98\u65B9\u6D88\u606F / \u5B89\u5168\u52A8\u6001 */
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
/* \u5173\u4E8E\u6309\u94AE\u4E0A\u7684\u65B0\u7248\u672C\u5C0F\u7EA2\u70B9 */
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
/* ---------- \u9876\u680F\u300C\u901A\u77E5\u4E2D\u5FC3\u300D\u4E0B\u62C9(\u94C3\u94DB) ----------
   2026-11-23 \u4E09\u5206\u6BB5\u6539\u7248:\u4E0E\u624B\u673A\u6D88\u606F\u4E2D\u5FC3(home.html msg-tabs)\u540C\u6784\u2014\u2014
   \u5B98\u65B9\u516C\u544A / \u53D1\u7ED9\u6211 / \u7535\u8111\u63A8\u9001 \u5404\u81EA\u5206\u6BB5,\u884C=\u5FBD\u6807+\u77ED\u65F6\u95F4+\u6807\u9898(\u4E24\u884C)+\u6B63\u6587\u4E00\u884C\u6458\u8981,
   \u70B9\u6574\u884C\u8FDB\u8BE6\u60C5 pane(\u8FD4\u56DE\u952E\u56DE\u5217\u8868)\u3002\u6B64\u524D\u5DE5\u4F5C\u533A\u526F\u672C\u6F0F\u5E26\u8FD9\u7EC4 CSS(\u6B63\u5F0F\u7248\u955C\u50CF\u6709),
   \u7684\u4E0B\u62C9\u4E00\u76F4\u88F8\u5954,\u8FD9\u6B21\u968F\u6539\u7248\u4E00\u5E76\u8865\u9F50\u3002 */
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
/* \u8FD4\u56DE\u5217\u8868\u6309\u94AE(\u8BE6\u60C5 pane \u5DE6\u4E0A\u89D2) */
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
/* \u4E09\u5206\u6BB5 tab:\u5B98\u65B9\u516C\u544A / \u53D1\u7ED9\u6211 / \u7535\u8111\u63A8\u9001(\u4E0E\u624B\u673A .msg-tabs \u540C\u6B3E) */
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
  /* \u9009\u4E2D\u6001\u5706\u89D2 = MsgTabs \u5BB9\u5668 radius 10 \u2212 padding 3 = 7px(\u540C .dshBrowserCtlTab \u53E3\u5F84) */
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
/* flex \u5217\u6EDA\u52A8\u5BB9\u5668\u5FC5\u987B\u7981\u5B50\u5143\u7D20\u6536\u7F29,\u5426\u5219\u5185\u5BB9\u88AB\u538B\u6241\u800C\u4E0D\u662F\u6EDA\u52A8(kb/10) */
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
/* \u884C1:\u5206\u7C7B\u5FBD\u6807 + \u77ED\u65F6\u95F4 */
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
/* \u7535\u8111\u63A8\u9001\u5FBD\u6807:\u4E2D\u6027\u7070(\u672C\u673A\u95F8\u673A\u5386\u53F2,\u65E0\u5B98\u65B9/\u5B9A\u5411\u8BED\u4E49) */
.dshBrowserCtlMsgKindTag[data-cat='feed'] {
  color: var(--dsw-alias-label-secondary, var(--dshb-muted));
  background: var(--dshb-chip);
}
/* \u516C\u544A\u6837\u5F0F\u7740\u8272:\u4E0E\u624B\u673A/\u5B98\u7F51\u4E2A\u4EBA\u4E2D\u5FC3\u540C\u8272\u7CFB(kb/16.8 \u5951\u7EA6:info\u7070/update\u84DD/warning\u6A59/event\u7EFF) */
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
/* \u6807\u9898:\u672A\u8BFB\u52A0\u7C97,\u6700\u591A\u4E24\u884C\u622A\u65AD(\u4E0E\u624B\u673A\u5217\u8868\u884C\u540C\u6B3E) */
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
/* \u6B63\u6587:\u5217\u8868\u91CC\u53EA\u7559\u4E00\u884C\u6458\u8981 */
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
/* \u8BE6\u60C5 pane:\u5217\u8868\u884C\u70B9\u5F00\u540E\u7684\u5168\u6587\u89C6\u56FE(\u8FD4\u56DE\u6309\u94AE\u5728\u5F39\u7A97\u5934\u90E8) */
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
/* ---------- \u5DE5\u5355\u53CD\u9988\u5F39\u7A97 ---------- */
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
  /* B1 \u6536\u7F16:\u88F8 button \u539F\u4E3A\u900F\u660E\u5E95,\u5F52\u5165 soft(\u7070\u5E95)\u5BB6\u65CF,\u4E0E BtnSoft \u540C\u4E00\u53D8\u91CF\u6765\u6E90 */
  background: var(--dsw-alias-fill-control-secondary, var(--dshb-soft));
  color: inherit; font: inherit; cursor: pointer;
}
.dshBrowserCtlTicketDest:hover { background: var(--dsw-alias-bg-layer-2, var(--dshb-seg-on)); }
.dshBrowserCtlTicketDest:disabled { opacity: .5; cursor: default; }
.dshBrowserCtlTicketDestTitle { font-size: 13px; font-weight: 600; line-height: 18px; }
.dshBrowserCtlTicketDestDesc { font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary, var(--dshb-faint)); }

/* ============================================================
   B3 \u89C6\u89C9\u7EDF\u4E00 \xB7 \u8FFD\u52A0\u533A(panel-b3,2026-11-26,B2 \u5E76\u884C\u671F\u53EA\u5141\u8BB8\u672C\u533A\u8FFD\u52A0)
   \u5BF9\u7167 docs/notes/panel-restructure-20261126/mockups P1-P7\u300C\u7B80\u6D01\u9AD8\u7EA7\u300D\u53E3\u5F84\u3002
   \u672C\u533A\u5185\u7684\u65E2\u6709\u7C7B\u96F6\u6539\u52A8;\u653E\u884C\u540E\u65E2\u6709\u7C7B\u6539\u5F15 token\u3001\u5361\u7247 JSX \u6536\u7F16\u4E5F\u4EE5\u672C\u533A\u4E3A\u951A\u3002
   ============================================================ */

/* ---------- B3.1 \u8272\u677F token(\u6563\u843D hex \u7684\u552F\u4E00\u5F52\u5BBF) ----------
   \u524D\u7F00 --dshb- \u907F\u514D\u4E0E\u5BBF\u4E3B --dsw-alias-* \u6DF7\u540D\u3002\u6DF1\u8272=\u9ED8\u8BA4(mockup \u5B9E\u6D4B\u503C);
   \u6D45\u8272\u5BBF\u4E3B\u6574\u7EC4\u7FFB\u8F6C(prefers-color-scheme: light)\u2014\u2014\u6B64\u524D\u53EA\u6709\u6DF1\u8272 fallback,
   \u6D45\u8272\u5BBF\u4E3B\u4E0B\u786C\u7F16\u7801\u8272\u5931\u6548(B3 \u8865\u5168)\u3002hex \u53EA\u5141\u8BB8\u51FA\u73B0\u5728\u672C\u533A\u3002 */
:root {
  /* \u552F\u4E00\u5B9E\u8272\u5E95=\u9762\u677F\u5E95;\u5361\u7247/\u5206\u533A\u4E00\u5F8B\u900F\u660E\u5E95,\u5C42\u6B21=\u63CF\u8FB9 + \u767D\u8272 alpha \u53E0\u52A0\u5C42
     (2026-11-26 \u7528\u6237\u5B9E\u6D4B\u62CD\u677F:\u5B9E\u8272\u504F\u84DD\u5361\u5E95 #232630 \u89C2\u611F\u53D1\u84DD,\u56DE\u5F52\u65E7\u7248\u900F\u660E\u5361+\u63CF\u8FB9) */
  --dshb-bg: #1b1d22;
  --dshb-border: #2a2c33;
  --dshb-inset: rgba(255, 255, 255, 0.03);
  /* \u5185\u6846\u5206\u533A\u63CF\u8FB9(2026-11-27 \u7528\u6237\u53CD\u9988\u300C\u5206\u533A\u5185\u6846\u56DE\u5F52\u300D):\u6DF1=7% \u767D alpha(5.5-8% \u5E26\u5185);
     \u6D45\u8272\u6863=#dcdfe4(--dshb-border \u6D45\u8272\u540C\u503C,\u6D45\u5E95\u4E0A\u767D alpha \u4E0D\u53EF\u89C1) */
  --dshb-inset-border: rgba(255, 255, 255, 0.07);
  /* \u5206\u5272\u7EBF:\u5F3A=\u5361\u5916\u63CF\u8FB9\u7EA7,\u5F31=\u884C\u5206\u9694 */
  --dshb-div: rgba(255, 255, 255, 0.055);
  --dshb-div-soft: rgba(255, 255, 255, 0.04);
  /* \u6587\u5B57\u4E09\u7EA7:\u6B63\u6587 / \u6B21\u8981 / \u5F31\u5316 */
  --dshb-text: #e8eaed;
  --dshb-muted: #9aa0a8;
  --dshb-faint: #8b8f98;
  /* \u8BED\u4E49\u8272 + \u4F4E\u9971\u548C\u5E95(\u5FBD\u6807/dsoft \u7EDF\u4E00 13-16% \u900F\u660E\u5EA6,\u5F3A\u8C03\u8272\u514B\u5236) */
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
  /* \u63A7\u4EF6\u9762:\u6309\u94AE\u8F6F\u5E95 / chip / \u5206\u6BB5\u9009\u4E2D / \u5F00\u5173\u8F68(\u5168\u90E8\u767D\u8272 alpha,\u6D45\u8272\u5BBF\u4E3B\u7531\u6D45\u8272\u7EC4\u7FFB\u8F6C) */
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

/* ---------- B3.2 \u72B6\u6001\u8272\u8C03\u94A9\u5B50(\u5361\u7247\u5934\u90E8\u53F3\u4FA7\u72B6\u6001\u5B57/\u9519\u8BEF\u7EA2\u5B57/toast) ----------
   \u653E\u884C\u540E push \u7B49\u5361\u7684\u5185\u8054 style={{ color: ... }} \u6539\u6302 data-tone / \u4E13\u7C7B,\u4E0D\u518D\u5199\u8272\u503C\u3002 */
.dshBrowserCtlCardStat[data-tone='ok'] { color: var(--dshb-ok); }
.dshBrowserCtlCardStat[data-tone='muted'] { color: var(--dshb-faint); font-weight: 400; }
/* \u6298\u53E0\u884C(\u5361\u5185\u300C\u624B\u52A8\u53D1\u9001 / \u6D4B\u8BD5 \u25BC\u300D\u7B49):chevron+\u6807\u9898+\u53F3\u4FA7\u5F31\u5316\u63D0\u793A */
.dshBrowserCtlFoldChev {
  display: inline-flex;
  flex: none;
  color: var(--dsw-alias-label-tertiary, var(--dshb-faint));
  transition: transform .15s ease;
}
.dshBrowserCtlFoldChev[data-open='true'] { transform: rotate(90deg); }
.dshBrowserCtlFoldLabel { font-size: 13px; line-height: 18px; font-weight: 500; }
/* \u8D26\u53F7\u5361\u300C\u5DF2\u767B\u5F55 \xB7 \u90AE\u7BB1 \xB7 \u7AEF\u53E3\u300D\u884C(JSX \u5DF2\u5F15\u7528\u3001\u6B64\u524D\u6F0F\u5B9A\u4E49,\u968F B3 \u8865\u9F50) */
.dshBrowserCtlCfgAcctLine {
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-primary, var(--dshb-text));
  word-break: break-all;
}
/* \u300C\u5FFD\u7565\u6B64\u7248\u672C\u300D\u884C\u5BB9\u5668(JSX \u5DF2\u5F15\u7528\u3001\u6B64\u524D\u6F0F\u5B9A\u4E49) */
.dshBrowserCtlAboutUpdateIgnoreRow { display: flex; margin-top: 2px; }
.dshBrowserCtlCardDescErr {
  margin: 0;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dshb-danger);
}
/* \u884C\u5185\u53CD\u9988:\u6210\u529F\u6CBF\u7528 PairedMsg \u7684\u7EFF;\u5931\u8D25\u7FFB\u7EA2(\u4E0D\u7834\u574F\u65E2\u6709\u9ED8\u8BA4\u8272) */
.dshBrowserCtlPairedMsg[data-ok='false'] { color: var(--dshb-danger); }

/* ---------- B3.3 \u5DE5\u5355\u5F39\u7A97:\u5185\u8054\u6837\u5F0F\u6536\u7F16\u76EE\u6807\u7C7B ----------
   \u5BF9\u5E94 ticket.jsx \u73B0\u5B58 10 \u5904\u5185\u8054 style(\u5BFC\u51FA\u6210\u529F\u6846/\u53BB\u5411\u6807\u9898/\u8DEF\u5F84\u8865\u8F93\u884C),\u653E\u884C\u540E\u66FF\u6362\u3002 */
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

/* ---------- B3.4 \u8D26\u53F7\u5361:\u5185\u8054\u6837\u5F0F\u6536\u7F16\u76EE\u6807\u7C7B ----------
   \u5BF9\u5E94 account.jsx \u73B0\u5B58 4 \u5904\u5185\u8054 style(\u6388\u6743\u94FE\u63A5 / \u300C\u6216\u300D\u5206\u9694\u884C / \u5BC6\u7801\u767B\u5F55\u8F93\u5165\u6846
   inputCss \u5BF9\u8C61),\u653E\u884C\u540E\u66FF\u6362;\u8F93\u5165\u6846\u5BF9\u9F50 CfgField input \u5BB6\u65CF(\u5D4C\u5165\u5E95+\u805A\u7126\u63CF\u8FB9)\u3002 */
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

/* ---------- B3.5 \u4E00\u952E\u81EA\u66F4\u65B0:\u9519\u8BEF\u6001\u5305\u88F9(\u5185\u8054 style \u6536\u7F16) ---------- */
.dshBrowserCtlUpdateErrWrap {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

/* ---------- B3.6 \u5185\u6846\u5206\u533A\u9AA8\u67B6(devices.jsx Inset \u5F15\u7528) ----------
   \u53E3\u5F84\u6CBF\u9769:\u2460\u5B9E\u8272\u6DF1\u5E95 #1e2128 \u88AB\u6BD9(\u7B2C\u4E09\u79CD\u6DF1\u5E95\u8272);\u2461\u5B9E\u8272\u5361\u5E95 #232630 \u88AB\u6BD9(\u53D1\u84DD),
   HEAD=\u5361\u300C\u900F\u660E\u5E95+\u63CF\u8FB9\u300D+\u5206\u533A\u65E0\u6846;\u24622026-11-27 \u7528\u6237\u53CD\u9988\u300C\u5206\u533A\u5185\u6846\u56DE\u5F52\u300D\u2014\u2014
   \u7ED3\u5408\u524D\u4E24\u8F6E\u53E3\u5F84,\u6846\u4E0D\u8BB8\u5B9E\u8272\u6DF1\u5E95:\u7EC6\u63CF\u8FB9(1px --dshb-inset-border,\u6DF1=7% \u767D alpha/
   \u6D45=#dcdfe4)+ \u6781\u4F4E\u900F\u660E\u5EA6\u5E95(--dshb-inset,\u6DF1 3% \u767D alpha/\u6D45 3% \u9ED1 alpha)\u3002
   \u4E25\u7981\u5B9E\u8272\u504F\u84DD\u7070(#1e2128/#232630)\u56DE\u6F6E\u3002\u5206\u533A\u6807\u9898(12px/600)\u8FDB\u6846\u5185\u9996\u884C(InsetHead)\u3002
   \u540C\u8BED\u4E49\u5206\u533A(\u5B89\u5168\u5361\u51ED\u8BC1\u5C55\u5F00\u533A SigDevs/\u63A8\u9001\u5361\u7F16\u8F91\u5668 MsgCard/\u6700\u8FD1\u63A8\u9001 PairedList)\u540C\u6846\u3002 */
.dshBrowserCtlInsetBox {
  margin: 0 0 8px;
  padding: 2px 12px 4px;
  border: 1px solid var(--dshb-inset-border, var(--dshb-div));
  border-radius: 12px;
  background: var(--dshb-inset);
}
/* \u5206\u533A\u6807\u9898\u884C:\u6846\u5185\u9996\u884C(devices.jsx Inset \u539F\u5185\u8054\u6536\u7F16;\u4E0A 8px+\u6846 2px=10px \u4E0E\u65E7\u7248\u4E00\u81F4)\u3002
   2026-11-27 \u7528\u6237\u53CD\u9988\u2461:\u6807\u9898\u4E0E\u5185\u5BB9\u4E4B\u95F4\u52A0\u4E00\u9053\u6D45\u7EC6\u5206\u5272\u7EBF,\u53E3\u5F84\u590D\u7528\u8BBE\u5907\u9875 InRow \u7684
   \u884C\u5206\u9694\u7EBF(dsw-alias-border-l1),\u4E0D\u53D1\u660E\u7B2C\u4E8C\u79CD\u7EBF\u3002 */
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
`;

// src/client/install-styles.js
function installStyles() {
  let style = document.querySelector(`style[data-plugin="${STYLE_ID}"]`);
  if (style === null) {
    style = document.createElement("style");
    style.dataset.plugin = STYLE_ID;
    document.head.append(style);
  }
  if (style.textContent !== css) style.textContent = css;
  return () => {
  };
}

// src/client/icons.jsx
var import_jsx_runtime = require("react/jsx-runtime");
var svgProps = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: { verticalAlign: "-2px", marginRight: 3, flex: "none" }
};
var Svg = {
  phone: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "5.5", y: "2.5", width: "13", height: "19", rx: "2.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10.5 18.5h3" })
  ] }),
  iphone: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "6", y: "2.5", width: "12", height: "19", rx: "2.8" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9.8 4.8h4.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10.8 18.6h2.4" })
  ] }),
  desk: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "2.5", y: "3.5", width: "19", height: "13", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8.5 20.5h7M12 16.5v4" })
  ] }),
  lap: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "4", y: "4.5", width: "16", height: "11", rx: "1.8" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2 19.5h20" })
  ] }),
  robot: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "4", y: "7", width: "16", height: "12", rx: "3" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3v4" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "9", cy: "12.5", r: "1.2", fill: "currentColor", stroke: "none" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "15", cy: "12.5", r: "1.2", fill: "currentColor", stroke: "none" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9.5 16h5" })
  ] }),
  peng: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", { cx: "12", cy: "13", rx: "7", ry: "8.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 4.5v3" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "9.2", cy: "10.5", r: "1.1", fill: "currentColor", stroke: "none" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "14.8", cy: "10.5", r: "1.1", fill: "currentColor", stroke: "none" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9.8 16.5q2.2 1.8 4.4 0" })
  ] }),
  wrench: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14.5 6.5a4 4 0 1 0 4.9 4.9l-2.6-2.6 2-2z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M11.8 9.2 3.5 17.5a2 2 0 0 0 2.8 2.8l8.3-8.3" })
  ] }),
  globe: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 12h18" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3a14 14 0 0 1 3.6 9A14 14 0 0 1 12 21a14 14 0 0 1-3.6-9A14 14 0 0 1 12 3z" })
  ] }),
  shield: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { ...svgProps, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2.5 19.5 6v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6z" }) }),
  check: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { ...svgProps, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m4.5 12.5 5 5 10-11" }) }),
  ban: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m5.7 5.7 12.6 12.6" })
  ] }),
  lock: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "4.5", y: "10.5", width: "15", height: "10.5", rx: "2.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 10.5V7a4 4 0 0 1 8 0v3.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "15.5", r: "1.3", fill: "currentColor", stroke: "none" })
  ] }),
  clip: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "8", y: "2.5", width: "8", height: "4", rx: "1.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M16 4.5h1.5A2.5 2.5 0 0 1 20 7v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 20V7a2.5 2.5 0 0 1 2.5-2.5H8" })
  ] }),
  link: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10 13a5 5 0 0 0 7.5.5l2.5-2.5a5 5 0 0 0-7-7L11.5 5.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14 11a5 5 0 0 0-7.5-.5L4 13a5 5 0 0 0 7 7l1.5-1.5" })
  ] }),
  bell: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10 20a2.2 2.2 0 0 0 4 0" })
  ] }),
  // 头部「通知中心」铃铛:去掉通用图标外边距,与 info/gear 等头部小图标对齐
  bellHead: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, style: { ...svgProps.style, marginRight: 0 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10 20a2.2 2.2 0 0 0 4 0" })
  ] }),
  // 头部小图标按钮专用:去掉通用图标的外边距,保持按钮内居中对齐
  info: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, style: { ...svgProps.style, marginRight: 0 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 11v5.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 7.5h.01" })
  ] }),
  gear: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, style: { ...svgProps.style, marginRight: 0 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "3" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" })
  ] }),
  download: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points: "7 10 12 15 17 10" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
  ] }),
  person: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, style: { ...svgProps.style, marginRight: 0 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "7.5", r: "3.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4.5 20a7.5 7.5 0 0 1 15 0" })
  ] }),
  ticket: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, style: { ...svgProps.style, marginRight: 0 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21 12a8 8 0 0 1-8 8H4.5l2.4-2.4A8 8 0 1 1 21 12z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8.5 10.5h7M8.5 13.5h4.5" })
  ] }),
  group: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...svgProps, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "9", cy: "8.5", r: "3.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3.5 19.5a5.5 5.5 0 0 1 11 0" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "16.5", cy: "9.5", r: "2.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M15.5 14.6a4.8 4.8 0 0 1 5 4.9" })
  ] })
};
function CtlIcon({ size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      "data-icon": "browserctl",
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "1.5", y: "2.5", width: "13", height: "9", rx: "1.5", stroke: "currentColor", strokeWidth: "1.25" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5 14h6M8 11.5V14", stroke: "currentColor", strokeWidth: "1.25", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4.5 6.5 6.5 8.5 4.5 10.5", stroke: "currentColor", strokeWidth: "1.25", strokeLinecap: "round", strokeLinejoin: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8.5 10.5h3", stroke: "currentColor", strokeWidth: "1.25", strokeLinecap: "round" })
      ]
    }
  );
}

// src/client/ui.jsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime2 = require("react/jsx-runtime");
var BTN_SOFT_SKIP = /^dshBrowserCtl(Header|Launcher)/;
var BTN_DANGER_RE = /dshBrowserCtlBtnDanger/;
var Button = (0, import_react.forwardRef)(function Button2({ variant = "ghost", className, children, ...rest }, ref) {
  const soft = children != null && (variant === "ghost" || variant === "secondary") && !(typeof className === "string" && (BTN_SOFT_SKIP.test(className) || BTN_DANGER_RE.test(className)));
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    import_dsh_client_ui_primitives.Button,
    {
      ref,
      ...rest,
      variant: variant === "secondary" ? "ghost" : variant,
      className: soft ? "dshBrowserCtlBtnSoft" + (className ? " " + className : "") : className,
      children
    }
  );
});
var MODAL_Z_BASE = 1e3;
var MODAL_Z_NESTED = 1010;
var MODAL_Z_PROMPT = 1020;
var MODAL_STACK = [];
function BaseModal({ t, title, subtitle, onClose, className, overlayClassName, z, children }) {
  const closeRef = (0, import_react.useRef)(onClose);
  closeRef.current = onClose;
  (0, import_react.useEffect)(() => {
    const entry = { close: () => closeRef.current() };
    MODAL_STACK.push(entry);
    return () => {
      const i = MODAL_STACK.indexOf(entry);
      if (i >= 0) MODAL_STACK.splice(i, 1);
    };
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      className: "dshBrowserCtlOverlay" + (overlayClassName ? " " + overlayClassName : ""),
      style: z && z !== MODAL_Z_BASE ? { zIndex: z } : void 0,
      role: "dialog",
      "aria-modal": "true",
      "aria-label": title,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dshBrowserCtlOverlayMask", type: "button", "aria-label": t("close"), onClick: onClose }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dshBrowserCtlPanel" + (className ? " " + className : ""), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "dshBrowserCtlHeader", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { children: title }),
              subtitle ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: subtitle }) : null
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.Tooltip, { label: t("close"), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Button, { variant: "ghost", size: "sm", "aria-label": t("close"), icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.IconCloseOutlineRegular, {}), onClick: onClose }) })
          ] }),
          children
        ] })
      ]
    }
  );
}

// src/client/overlay.jsx
var import_react18 = require("react");

// src/client/hooks.js
var import_react2 = require("react");
function useToast(ms) {
  const [toast, setToast] = (0, import_react2.useState)(null);
  const ttl = ms || 2200;
  (0, import_react2.useEffect)(() => {
    if (toast === null || toast === false || toast === "") return;
    const id = setTimeout(() => setToast(null), ttl);
    return () => clearTimeout(id);
  }, [toast, ttl]);
  return [toast, setToast];
}
function useQr(open, reloadToken, uses) {
  const [data, setData] = (0, import_react2.useState)(null);
  const [error, setError] = (0, import_react2.useState)(null);
  const [expiresAt, setExpiresAt] = (0, import_react2.useState)(0);
  const [status, setStatus] = (0, import_react2.useState)(null);
  const [retrying, setRetrying] = (0, import_react2.useState)(false);
  const [refreshTick, setRefreshTick] = (0, import_react2.useState)(0);
  const usesRef = (0, import_react2.useRef)(uses);
  usesRef.current = uses || 1;
  (0, import_react2.useEffect)(() => {
    if (!open) return;
    let alive = true;
    let timer = null;
    let tries = 0;
    const MAX_TRIES = 30;
    setError(null);
    setRetrying(false);
    async function load() {
      try {
        const r = await fetch(API_P + "/browserctl/api/pair?uses=" + usesRef.current, { method: "POST", cache: "no-store" });
        const tx = await r.text();
        let j;
        try {
          j = JSON.parse(tx);
        } catch {
          return { ok: false, retryable: false, error: "\u8DEF\u7531\u672A\u52A0\u8F7D(HTTP " + r.status + ");\u8BF7\u91CD\u542F DSH \u540E\u91CD\u8BD5" };
        }
        if (!alive) return { ok: false, retryable: false };
        if (j.error) {
          return { ok: false, retryable: !!(j.tunnel && j.tunnel.ok === false), error: j.error };
        }
        setError(null);
        setData(j);
        setStatus({ uses: j.uses || 1, remaining: j.remaining || 1 });
        setExpiresAt(Date.now() + (j.ttl || 60) * 1e3);
        return { ok: true };
      } catch (e1) {
        try {
          const r2 = await fetch(API_P + "/browserctl/api/qr", { cache: "no-store" });
          const tx2 = await r2.text();
          let j2;
          try {
            j2 = JSON.parse(tx2);
          } catch {
            return { ok: false, retryable: false, error: "\u8DEF\u7531\u672A\u52A0\u8F7D(HTTP " + r2.status + ");\u8BF7\u91CD\u542F DSH \u540E\u91CD\u8BD5" };
          }
          if (!alive) return { ok: false, retryable: false };
          if (j2.error) {
            return { ok: false, retryable: !!(j2.tunnel && j2.tunnel.ok === false), error: j2.error };
          }
          setError(null);
          setData(j2);
          setExpiresAt(0);
          return { ok: true };
        } catch (e2) {
          if (!alive) return { ok: false, retryable: false };
          return { ok: false, retryable: false, error: String(e2 && e2.message || e2) };
        }
      }
    }
    async function loop() {
      const res = await load();
      if (!alive) return;
      if (res.ok) {
        setRetrying(false);
        return;
      }
      setData(null);
      setError(res.error || null);
      if (!res.retryable || tries >= MAX_TRIES) {
        if (res.retryable) {
          setError((res.error || "") + "\n\u96A7\u9053\u4ECD\u5728\u81EA\u6108\u4E2D,\u7B49\u5F85\u8D85\u65F6;\u53EF\u518D\u70B9\u4E00\u6B21\u300C\u5F00\u59CB\u63A7\u5236\u300D\u91CD\u8BD5\u3002");
        }
        setRetrying(false);
        return;
      }
      tries += 1;
      setRetrying(true);
      timer = setTimeout(loop, 1500);
    }
    loop();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [open, reloadToken, refreshTick, uses]);
  (0, import_react2.useEffect)(() => {
    if (!open || !data || !data.grant) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(API_P + "/browserctl/api/pair-status?g=" + encodeURIComponent(data.grant), { cache: "no-store" });
        const j = await r.json();
        if (!alive || !j || !j.ok) return;
        const remaining = j.exists ? j.remaining | 0 : 0;
        setStatus({ uses: j.uses || data.uses || 1, remaining });
        if (remaining <= 0) setRefreshTick((x) => x + 1);
      } catch {
      }
    };
    tick();
    const id = setInterval(tick, 1500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [open, data]);
  return { data, error, expiresAt, status, retrying, refresh: () => setRefreshTick((x) => x + 1) };
}
function useCountdown(expiresAt) {
  const [left, setLeft] = (0, import_react2.useState)(0);
  (0, import_react2.useEffect)(() => {
    if (!expiresAt) {
      setLeft(0);
      return;
    }
    const tick = () => setLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1e3)));
    tick();
    const id = setInterval(tick, 1e3);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}
function fmtPlatform(ua) {
  const u = (ua || "").toLowerCase();
  if (!u) return "unknown";
  if (/iphone|ipad|ios/.test(u)) return "iOS";
  if (/android/.test(u)) return "Android";
  if (/windows|win64|win32/.test(u)) return "Windows";
  if (/macintosh|mac os/.test(u)) return "macOS";
  if (/linux/.test(u)) return "Linux";
  if (/curl|wget|python|httpclient|okhttp/.test(u)) return "\u811A\u672C/API";
  return "\u6D4F\u89C8\u5668";
}

// src/client/overlay.jsx
var import_dsh_client_ui_primitives5 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/cards/devices.jsx
var import_react3 = require("react");

// src/client/fmt.js
function fmtRelative(ts) {
  const t = Number(ts) || 0;
  if (!t) return "";
  const ms = t < 1e12 ? t * 1e3 : t;
  const mins = Math.max(0, Math.round((Date.now() - ms) / 6e4));
  if (mins < 1) return "\u521A\u521A";
  if (mins < 60) return mins + " \u5206\u949F\u524D";
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + " \u5C0F\u65F6\u524D";
  return Math.round(hrs / 24) + " \u5929\u524D";
}
function fmtAbsolute(ts, style) {
  const t = Number(ts) || 0;
  if (!t) return "";
  const ms = t < 1e12 ? t * 1e3 : t;
  const d = new Date(ms);
  const now = /* @__PURE__ */ new Date();
  const p = (n) => (n < 10 ? "0" : "") + n;
  if (style === "short") {
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate())
      return p(d.getHours()) + ":" + p(d.getMinutes());
    if (d.getFullYear() === now.getFullYear()) return p(d.getMonth() + 1) + "-" + p(d.getDate());
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  if (style === "clock") return p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  if (style === "date") return p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}
function kindOf(s) {
  if (s && s.kind) return s.kind;
  const n = s && s.name || "";
  return n.indexOf("DSH Remote") === 0 || n === "\u624B\u673A App" ? "app" : "web";
}
var PUSH_KIND = { test: "Test", verify: "Verify", kick: "Kick", ban: "Ban", totp: "Totp", pair: "Pair", join: "Join", dev: "Dev", msg: "Msg" };
function pushKindLabel(t, kind) {
  const key = PUSH_KIND[kind];
  return key ? t("pushKind" + key) : kind || "";
}
var PUSH_CAT_OF_KIND = { announce: "official" };
function pushCatOf(it) {
  const c = it && it.cat;
  if (c === "official" || c === "security") return c;
  return PUSH_CAT_OF_KIND[it && it.kind] || "security";
}
var MSG_STYLE_MAP = {
  info: { label: "", style: "" },
  update: { label: "msgStyleUpdate", style: "update" },
  warning: { label: "msgStyleWarning", style: "warning" },
  event: { label: "msgStyleEvent", style: "event" }
};
function msgStyleOf(s) {
  return MSG_STYLE_MAP[s] ? s : "info";
}
function msgLinksOf(m) {
  const out = [];
  if (m && Array.isArray(m.links)) {
    for (const x of m.links) {
      if (out.length >= 5) break;
      const url = String(x && x.url || "");
      if (!/^https?:\/\//.test(url)) continue;
      out.push({ label: String(x && x.label || "").slice(0, 24), url });
    }
  }
  if (!out.length && m && /^https?:\/\//.test(String(m.link || ""))) out.push({ label: "", url: String(m.link) });
  return out;
}
function buildMsgEntries(msgs, feedItems) {
  const list = [];
  for (const m of msgs || []) {
    const mine = m && m.kind === "personal";
    list.push({
      id: m && m.id || "",
      cat: mine ? "mine" : "official",
      ts: Number(m && m.createdAt) || 0,
      kindKey: mine ? "msgPersonal" : "msgOfficial",
      style: msgStyleOf(m && m.style),
      title: String(m && m.title || ""),
      body: String(m && m.body || ""),
      links: msgLinksOf(m),
      unread: !(m && m.read) && !msgIsSeen(m)
    });
  }
  for (const it of feedItems || []) {
    const link = /^https?:\/\//.test(String(it && it.link || "")) ? String(it.link) : "";
    list.push({
      id: it && it.id || "",
      cat: "feed",
      ts: (Number(it && it.t) || 0) * 1e3,
      kindKey: "msgTabFeed",
      style: "info",
      title: String(it && it.title || ""),
      body: String(it && it.body || ""),
      links: link ? [{ label: "", url: link }] : [],
      unread: false
    });
  }
  list.sort((a, b) => b.ts - a.ts);
  return list;
}

// src/client/actions.js
async function kickViaGate({ dev, purge, onKicked, timeoutMs = 8e3 }) {
  const payload = {};
  if (dev) payload.dev = dev;
  if (purge) payload.purge = 1;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  let r = null;
  try {
    r = await fetch(API_P + "/browserctl-gate/kick" + (dev ? "" : "-all"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: ac.signal
    });
  } catch (e) {
    r = null;
  }
  clearTimeout(timer);
  if (!(r && r.ok)) {
    const q = dev ? "?dev=" + encodeURIComponent(dev) : "";
    r = await fetch(API_P + "/browserctl/api/totp-kick" + q, { cache: "no-store" }).catch(() => null);
  }
  if (r && r.ok && onKicked) {
    setTimeout(onKicked, 1200);
    setTimeout(onKicked, 2500);
  }
  return r;
}
async function banViaGate({ dev, ip, name, reason }) {
  let r = await fetch(API_P + "/browserctl-gate/blacklist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dev, ip, name: name || "\u672A\u77E5", reason: reason || "\u7BA1\u7406\u5458\u5C01\u7981" })
  }).catch(() => null);
  if (r && r.ok) return r;
  const q = new URLSearchParams({ dev: dev || "", ip: ip || "", name: name || "\u672A\u77E5", reason: reason || "\u7BA1\u7406\u5458\u5C01\u7981" }).toString();
  return await fetch(API_P + "/browserctl/api/blacklist-add?" + q, { cache: "no-store" }).catch(() => null);
}

// src/client/cards/devices.jsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function Inset({ title, meta, action, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlInsetBox", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlInsetHead", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { flex: 1 } }),
      meta ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontWeight: 400 }, children: meta }) : null,
      action || null
    ] }),
    children
  ] });
}
function InRow({ first, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 0",
    borderTop: first ? "none" : "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.05))"
  }, children });
}
function DevicesSection({ t, reloadToken, onRefresh, disabled }) {
  const [data, setData] = (0, import_react3.useState)(null);
  const [busy, setBusy] = (0, import_react3.useState)(false);
  const [kicking, setKicking] = (0, import_react3.useState)(null);
  const [kickMsg, setKickMsg] = useToast();
  const [banning, setBanning] = (0, import_react3.useState)(null);
  const [banMsg, setBanMsg] = useToast();
  const [banOk, setBanOk] = (0, import_react3.useState)(true);
  const [kickConfirm, setKickConfirm] = (0, import_react3.useState)("");
  const [blackData, setBlackData] = (0, import_react3.useState)(null);
  const [banAddOpen, setBanAddOpen] = (0, import_react3.useState)(false);
  const [banIp, setBanIp] = (0, import_react3.useState)("");
  const anyBusy = disabled || busy;
  (0, import_react3.useEffect)(() => {
    let alive = true;
    fetch(API_P + "/browserctl/api/totp", { cache: "no-store" }).then((r) => r.text().then((tx) => {
      try {
        return JSON.parse(tx);
      } catch {
        return { error: "HTTP " + r.status };
      }
    })).then((j) => {
      if (alive) setData(j);
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, [reloadToken]);
  (0, import_react3.useEffect)(() => {
    let alive = true;
    fetch(API_P + "/browserctl-gate/blacklist", { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => {
      if (alive) setBlackData(Array.isArray(j.blacklist) ? j.blacklist : []);
    }).catch(() => {
      if (alive) setBlackData([]);
    });
    return () => {
      alive = false;
    };
  }, [reloadToken]);
  const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
  const devices = Array.isArray(data?.devices) ? data.devices : [];
  const blacklist = blackData || [];
  const pairedPhones = sessions.filter((s) => kindOf(s) === "app");
  const webCount = sessions.filter((s) => kindOf(s) === "web").length;
  const nowSec = Date.now() / 1e3;
  const isFresh = (ts) => !!ts && nowSec - ts < 600;
  const groupKey = (ip, name) => (ip || "") + "\0" + (name || "");
  const devByKey = new Map(devices.map((d) => [d.key, d]));
  const onlineSessions = sessions.filter((s) => isFresh(s.ts || s.since));
  const onlineGroups = new Set(onlineSessions.map((s) => groupKey(s.ip, s.name)));
  const dedupeRows = (rows) => {
    const counts = /* @__PURE__ */ new Map();
    const devs = /* @__PURE__ */ new Map();
    for (const s of rows) {
      const k = groupKey(s.ip, s.name);
      counts.set(k, (counts.get(k) || 0) + 1);
      const arr = devs.get(k) || [];
      arr.push(s.dev);
      devs.set(k, arr);
    }
    const seen = /* @__PURE__ */ new Set();
    return rows.filter((s) => {
      const k = groupKey(s.ip, s.name);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).map((s) => ({ ...s, _dupN: counts.get(groupKey(s.ip, s.name)), _dupDevs: devs.get(groupKey(s.ip, s.name)) }));
  };
  const onlineRows = dedupeRows(onlineSessions);
  const pairedRows = dedupeRows(pairedPhones);
  const onlineSince = (s) => {
    const d = devByKey.get(s.devid || s.dev);
    const since = d && d.online_since || 0;
    return since > 0 ? since : s.since;
  };
  const histMap = /* @__PURE__ */ new Map();
  for (const d of devices) {
    const g = groupKey(d.ip, d.name);
    if (onlineGroups.has(g)) continue;
    const prev = histMap.get(g);
    if (!prev || (d.last_seen || 0) > (prev.last_seen || 0)) histMap.set(g, d);
  }
  const historical = [...histMap.values()].sort((a, b) => (b.last_seen || 0) - (a.last_seen || 0));
  function fmtOnline(since) {
    if (!since) return "";
    const mins = Math.max(0, Math.round((Date.now() - since * 1e3) / 6e4));
    if (mins < 1) return t("durLess1Min");
    if (mins < 60) return t("durMin").replace("{n}", mins);
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return t("durHour").replace("{n}", hrs);
    return t("durDay").replace("{n}", Math.round(hrs / 24));
  }
  function fmtDuration(ms) {
    if (!ms || ms < 0) return "";
    const totalSec = Math.round(ms / 1e3);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins < 1) return t("durSec").replace("{n}", secs);
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hrs < 1) return t("durMin").replace("{n}", mins);
    if (hrs < 24) return t("durHourMin").replace("{h}", hrs).replace("{m}", remainMins);
    const days = Math.floor(hrs / 24);
    return t("durDayHour").replace("{d}", days).replace("{h}", hrs % 24);
  }
  (0, import_react3.useEffect)(() => {
    if (!kickConfirm) return;
    const id = setTimeout(() => setKickConfirm(""), 2600);
    return () => clearTimeout(id);
  }, [kickConfirm]);
  const kickTargetOf = (dev) => {
    const devs = Array.isArray(dev) ? dev : dev ? [dev] : null;
    return devs ? devs.join("|") : "all";
  };
  async function kick(dev) {
    const devs = Array.isArray(dev) ? dev : dev ? [dev] : null;
    const target = kickTargetOf(dev);
    if (kickConfirm !== target) {
      setKickConfirm(target);
      return;
    }
    setKickConfirm("");
    setBusy(true);
    setKicking(target);
    setKickMsg("");
    try {
      let ok = true;
      if (!devs) {
        const r = await kickViaGate({ onKicked: onRefresh });
        ok = !!(r && r.ok);
      } else {
        for (const d of devs) {
          const r = await kickViaGate({ dev: d, onKicked: devs.length === 1 ? onRefresh : void 0 });
          if (!(r && r.ok)) ok = false;
        }
        if (devs.length > 1) onRefresh();
      }
      if (ok) {
        const face = devs ? sessions.find((x) => x.dev === devs[0]) : null;
        const isApp = !!(devs && devs.length === 1 && kindOf(face || {}) === "app");
        setKickMsg(devs ? isApp ? t("pairedUnpaired") : t("kickedOne") : t("kickedAll"));
        setData((d) => {
          if (!d) return d;
          const list = Array.isArray(d.sessions) ? d.sessions : [];
          return { ...d, sessions: devs ? list.filter((x) => !devs.includes(x.dev)) : [] };
        });
      } else {
        setKickMsg(t("kickFail"));
      }
    } catch {
      setKickMsg(t("netError"));
    } finally {
      setBusy(false);
      setKicking(null);
    }
  }
  async function ban(dev, ip, name) {
    if (!dev && !ip) return;
    setBusy(true);
    setBanning(dev || ip || "");
    setBanMsg("");
    try {
      const r = await banViaGate({ dev, ip, name });
      const ok = !!(r && r.ok);
      setBanOk(ok);
      setBanMsg({ text: ok ? t("bannedOk").replace("{n}", name || ip || "") : t("banAddFail"), ok });
      onRefresh();
    } catch {
      setBanOk(false);
      setBanMsg({ text: t("netError"), ok: false });
    } finally {
      setBusy(false);
      setBanning(null);
    }
  }
  async function addBan() {
    const ip = banIp.trim();
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
    const valid = !!m && m.slice(1).every((x) => Number(x) <= 255);
    if (!valid) {
      setBanOk(false);
      setBanMsg({ text: t("banAddInvalid"), ok: false });
      return;
    }
    setBusy(true);
    setBanMsg("");
    try {
      const r = await banViaGate({ ip, name: ip, reason: t("banAddReason") });
      const ok = !!(r && r.ok);
      setBanOk(ok);
      setBanMsg({ text: ok ? t("banAddOk").replace("{ip}", ip) : t("banAddFail"), ok });
      if (ok) {
        setBanIp("");
        setBanAddOpen(false);
      }
    } catch {
      setBanOk(false);
      setBanMsg({ text: t("netError"), ok: false });
    } finally {
      setBusy(false);
    }
  }
  async function unban(ip) {
    setBusy(true);
    try {
      let r = await fetch(API_P + "/browserctl-gate/blacklist/remove", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ip })
      }).catch(() => null);
      if (!r || !r.ok) {
        r = await fetch(API_P + "/browserctl/api/blacklist-remove?ip=" + encodeURIComponent(ip), { cache: "no-store" }).catch(() => null);
      }
      if (r && r.ok) {
        setBlackData((d) => (d || []).filter((x) => x.ip !== ip));
        setBanOk(true);
        setBanMsg({ text: t("banUnbanOk").replace("{ip}", ip), ok: true });
      } else {
        setBanOk(false);
        setBanMsg({ text: t("banUnbanFail"), ok: false });
      }
    } catch {
      setBanOk(false);
      setBanMsg({ text: t("banUnbanFail"), ok: false });
    } finally {
      setBusy(false);
    }
  }
  if (!data) return null;
  const kickBtn = (dev) => {
    const target = kickTargetOf(dev);
    const armed = kickConfirm === target;
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Button, { variant: "ghost", size: "sm", className: "dshBrowserCtlBtnDangerSoft", disabled: anyBusy, onClick: () => kick(dev), children: kicking === target ? t("kickBusy") : armed ? dev ? t("kickOneConfirm") : t("kickAllConfirm") : t("deviceKick") });
  };
  const banBtn = (dev, ip, name) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Button, { variant: "ghost", size: "sm", className: "dshBrowserCtlBtnDangerSoft", disabled: anyBusy, onClick: () => ban(dev, ip, name), children: banning === (dev || ip || "") ? t("banBusy") : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    Svg.shield,
    " ",
    t("banAddConfirm")
  ] }) });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlCard", "data-busy": anyBusy ? "true" : "false", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlCardHead", style: { cursor: "default" }, children: [
      Svg.desk,
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t("devCardTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshBrowserCtlCardStat", style: { color: "var(--dsw-alias-label-tertiary,#8b8f98)", fontWeight: 400 }, children: t("devCardMeta") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlCardBody dshBrowserCtlCardBodyTall", "data-open": "true", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        Inset,
        {
          title: t("devSecOnlineN").replace("{n}", onlineRows.length),
          action: sessions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Button, { variant: "ghost", size: "sm", className: "dshBrowserCtlBtnDangerSoft", disabled: anyBusy, onClick: () => kick(null), children: kicking === "all" ? t("kickBusy") : kickConfirm === "all" ? t("kickAllConfirm") : t("totpKick") }) : null,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dshBrowserCtlCardDesc", children: t("noDevicesHint") }),
            onlineRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshBrowserCtlDevEmpty", children: t("noOnlineDevices") }) : onlineRows.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(InRow, { first: i === 0, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlDevInfo", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlDevTop", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshBrowserCtlDevPlatform", title: s.ua || "", children: s.name || fmtPlatform(s.ua) }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(KindTag, { item: s, t }),
                  (s._dupN || 1) > 1 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshBrowserCtlDupBadge", children: t("dupBadge").replace("{n}", String(s._dupN)) }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshBrowserCtlDevSeen", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dshBrowserCtlHistDot", "data-on": "true", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", {}),
                    t("onlineFor").replace("{d}", fmtOnline(onlineSince(s)))
                  ] }) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlDevIp", children: [
                  s.ip || "unknown",
                  s.loc ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { marginLeft: 6, opacity: 0.6, fontSize: 10 }, children: s.loc }) : null
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlDevActions", children: [
                kickBtn(s._dupDevs),
                banBtn(s.dev, s.ip, s.name)
              ] })
            ] }, s.dev)),
            kickMsg && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { textAlign: "center", fontSize: 12, color: "var(--dsw-alias-state-success-primary,#34b371)", padding: "4px 0 0" }, children: kickMsg })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Inset, { title: t("devSecHistory"), meta: t("histByDevice"), children: historical.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshBrowserCtlDevEmpty", children: t("histEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshBrowserCtlDevBody", style: { maxHeight: 180 }, children: historical.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(InRow, { first: i === 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlDevInfo", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlDevTop", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshBrowserCtlDevPlatform", title: d.ua || "", children: d.name || t("devUnknown") }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(KindTag, { item: d, t }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshBrowserCtlDevSeen", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dshBrowserCtlHistDot", "data-on": "false", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", {}),
              t("lastSeenOnline").replace("{d}", fmtRelative(d.last_seen))
            ] }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlDevIp", children: [
            d.ip || "unknown",
            d.loc ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { marginLeft: 6, opacity: 0.6, fontSize: 10 }, children: d.loc }) : null,
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { style: { color: "var(--dsw-alias-label-tertiary,#8b8f98)", fontSize: 10 }, children: [
              " \xB7 " + t("devConnTimes").replace("{n}", d.times || 1),
              (d.total_online || 0) > 0 ? " \xB7 " + t("devTotalOnline").replace("{d}", fmtDuration(d.total_online * 1e3)) : ""
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshBrowserCtlDevActions", children: banBtn(d.key, d.ip, d.name) })
      ] }, d.key)) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        Inset,
        {
          title: t("devSecBanned"),
          meta: t("histCount").replace("{n}", blacklist.length),
          action: !banAddOpen ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Button, { variant: "ghost", size: "sm", disabled: anyBusy, onClick: () => {
            setBanAddOpen(true);
            setBanMsg("");
          }, children: [
            "+ ",
            t("banAdd")
          ] }) : null,
          children: [
            banAddOpen && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(InRow, { first: true, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "input",
                {
                  value: banIp,
                  onChange: (e) => setBanIp(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === "Enter" && banIp.trim()) addBan();
                  },
                  placeholder: t("banAddPh"),
                  spellCheck: false,
                  disabled: anyBusy,
                  style: { flex: 1, minWidth: 0, boxSizing: "border-box", height: 30, padding: "0 10px", border: "1px solid var(--dsw-alias-border-l2,#2a2c33)", borderRadius: 8, background: "var(--dsw-alias-bg-layer-1,rgba(255,255,255,0.04))", color: "inherit", fontSize: 12, outline: "none" }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Button, { variant: "primary", size: "sm", disabled: anyBusy || !banIp.trim(), onClick: addBan, children: t("banAddConfirm") }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Button, { variant: "ghost", size: "sm", disabled: anyBusy, onClick: () => {
                setBanAddOpen(false);
                setBanIp("");
              }, children: t("banCancel") })
            ] }),
            blacklist.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshBrowserCtlDevEmpty", children: t("banEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshBrowserCtlBanBody", style: { maxHeight: 180 }, children: blacklist.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(InRow, { first: i === 0 && !banAddOpen, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dshBrowserCtlBanInfo", title: r.ip, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { color: "var(--dsw-alias-label-primary,inherit)", fontWeight: 500 }, children: r.name || "unknown" }),
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { color: "var(--dsw-alias-label-secondary,#a6aab2)" }, children: r.ip }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshBrowserCtlBanReason", children: r.reason ? " \xB7 " + r.reason : "" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Button, { variant: "ghost", size: "sm", disabled: anyBusy, onClick: () => unban(r.ip), children: t("banUnban") })
            ] }, i)) }),
            banMsg && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { textAlign: "center", fontSize: 12, color: banMsg.ok ? "var(--dsw-alias-state-success-primary,#34b371)" : "var(--dsw-alias-state-error-primary,#e5655c)", padding: "2px 0 0" }, children: banMsg.text })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Inset, { title: t("devSecPaired"), meta: t("pairedLongTag"), children: [
        pairedRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshBrowserCtlDevEmpty", children: t("pairedEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshBrowserCtlDevBody", style: { maxHeight: 180 }, children: pairedRows.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(InRow, { first: i === 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlDevInfo", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlDevTop", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshBrowserCtlDevPlatform", children: s.name || t("pairedTitle") }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(KindTag, { item: s, t }),
              (s._dupN || 1) > 1 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshBrowserCtlDupBadge", children: t("dupBadge").replace("{n}", String(s._dupN)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshBrowserCtlDevIp", children: [
              s.ip || "unknown",
              s.ts ? " \xB7 " + fmtRelative(s.ts) : ""
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshBrowserCtlDevActions", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Button, { variant: "ghost", size: "sm", className: "dshBrowserCtlBtnDangerSoft", disabled: anyBusy, onClick: () => kick(s._dupDevs), children: kicking === kickTargetOf(s._dupDevs) ? t("pairedUnpairing") : kickConfirm === kickTargetOf(s._dupDevs) ? t("kickOneConfirm") : t("pairedUnpair") }) })
        ] }, s.dev)) }),
        webCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshBrowserCtlDevEmpty", style: { paddingTop: 2 }, children: t("pairedWebNote").replace("{n}", webCount) })
      ] })
    ] })
  ] });
}
function KindTag({ item, t }) {
  const k = kindOf(item);
  const label = t ? t(k === "app" ? "kindApp" : "kindWeb") : k === "app" ? "App" : "\u7F51\u9875";
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshBrowserCtlKindTag", "data-kind": k, children: label });
}

// src/client/cards/log.jsx
var import_react4 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var LogIcon = ({ typ }) => {
  const props = { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", style: { flex: "none" } };
  const color = "currentColor";
  switch (typ) {
    case "verify":
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "8", cy: "8", r: "7", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M5 8.5l2 2 4-4.5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round" })
      ] });
    case "kick":
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "8", cy: "8", r: "7", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M5.5 5.5l5 5M10.5 5.5l-5 5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round" })
      ] });
    case "totp":
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "4.5", y: "7", width: "7", height: "6", rx: "1.5", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M5.5 7V4.5a2.5 2.5 0 015 0V7", stroke: color, strokeWidth: "1.2", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "8", cy: "9.5", r: "1", fill: color })
      ] });
    case "ban":
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M3 5.5V8c0 2.8 2 5.2 5 6 3-.8 5-3.2 5-6V5.5L8 3l-5 2.5z", stroke: color, strokeWidth: "1.2", strokeLinejoin: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M6 8.5l1.5 1.5 3-3", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round" })
      ] });
    default:
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { width: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: "\xB7" });
  }
};
var LOG_CAT_OF = {
  verify: "login",
  pair: "pair",
  kick: "kick",
  ban: "ban",
  totp: "totp",
  devbind: "totp",
  settings: "settings",
  devsig: "devsig",
  devsig_sum: "devsig",
  file_dl: "sys",
  error: "sys"
};
var LOG_TABS = [
  { id: "all", labelKey: "logTabAll" },
  { id: "login", labelKey: "logTabLogin" },
  { id: "pair", labelKey: "logTabPair" },
  { id: "kick", labelKey: "logTabKick" },
  { id: "ban", labelKey: "logTabBan" },
  { id: "totp", labelKey: "logTabTotp" },
  { id: "devsig", labelKey: "logTabUnsigned" },
  { id: "settings", labelKey: "logTabSettings" },
  { id: "sys", labelKey: "logTabSys" }
];
function LogCard({ t, reloadToken }) {
  const [open, setOpen] = (0, import_react4.useState)(true);
  const [events, setEvents] = (0, import_react4.useState)(null);
  const [cat, setCat] = (0, import_react4.useState)("all");
  (0, import_react4.useEffect)(() => {
    let alive = true;
    fetch(API_P + "/browserctl-gate/events", { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => {
      if (alive) setEvents(Array.isArray(j.events) ? j.events : []);
    }).catch(() => fetch(API_P + "/browserctl/api/totp", { cache: "no-store" }).then((r) => r.json()).then((j) => {
      if (alive) setEvents(Array.isArray(j.events) ? j.events : []);
    }).catch(() => {
      if (alive) setEvents([]);
    }));
    return () => {
      alive = false;
    };
  }, [reloadToken]);
  const catOf = (e) => e && e.cat || LOG_CAT_OF[e && e.typ] || "other";
  const counts = {};
  for (const e of events || []) {
    const c = catOf(e);
    counts[c] = (counts[c] || 0) + 1;
  }
  const list = (events || []).filter((e) => cat === "all" || catOf(e) === cat).slice().reverse();
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshBrowserCtlCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "button",
      {
        type: "button",
        className: "dshBrowserCtlCardHead",
        "data-open": open ? "true" : "false",
        onClick: () => setOpen((o) => !o),
        children: [
          Svg.clip,
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t("logTitle") }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontWeight: 500, fontSize: 12, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: (events || []).length ? t("logCount").replace("{n}", String((events || []).length)) : t("logNone") }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshBrowserCtlCardArrow", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshBrowserCtlCardBody", "data-open": open, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshBrowserCtlLogTabs", role: "tablist", children: LOG_TABS.map((tab) => {
        const n = tab.id === "all" ? (events || []).length : counts[tab.id] || 0;
        if (tab.id !== "all" && !n) return null;
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "button",
          {
            type: "button",
            role: "tab",
            "aria-selected": cat === tab.id,
            className: "dshBrowserCtlLogTab",
            "data-on": cat === tab.id ? "true" : "false",
            onClick: () => setCat(tab.id),
            children: [
              t(tab.labelKey),
              n ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshBrowserCtlLogTabN", children: n > 99 ? "99+" : n }) : null
            ]
          },
          tab.id
        );
      }) }),
      list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshBrowserCtlDevEmpty", children: t("logEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshBrowserCtlLogBody", "data-cat": cat, children: list.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshBrowserCtlLogRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshBrowserCtlLogType", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(LogIcon, { typ: e.typ }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshBrowserCtlLogMsg", title: e.msg || "", children: e.msg || "" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshBrowserCtlLogTime", children: fmtAbsolute(e.t, "clock") })
      ] }, i)) })
    ] })
  ] });
}

// src/client/cards/app-pair.jsx
var import_react5 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
function PairLongSegment({ t, reloadToken }) {
  const [data, setData] = (0, import_react5.useState)(null);
  const [loading, setLoading] = (0, import_react5.useState)(false);
  const [copied, setCopied] = useToast(1600);
  async function load() {
    setLoading(true);
    try {
      const r = await fetch(API_P + "/browserctl/api/pair-long", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setData({ error: j && j.error || "HTTP " + r.status });
        return;
      }
      if (!j.url || !j.svg) {
        setData({ error: j && j.error || t("pairLongIncomplete") });
        return;
      }
      setData(j);
    } catch (e) {
      setData({ error: String(e && e.message || e) });
    } finally {
      setLoading(false);
    }
  }
  (0, import_react5.useEffect)(() => {
    if (!data || !data.grant) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(API_P + "/browserctl/api/pair-status?g=" + encodeURIComponent(data.grant), { cache: "no-store" });
        const j = await r.json();
        if (!alive || !j || !j.ok) return;
        const remaining = j.exists ? j.remaining | 0 : 0;
        if (remaining <= 0) load();
      } catch {
      }
    };
    tick();
    const id = setInterval(tick, 1500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [data]);
  (0, import_react5.useEffect)(() => {
    load();
  }, [reloadToken]);
  const ok = !!(data && data.url && !data.error);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    ok ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshBrowserCtlQrBox", children: data.svg ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("img", { alt: t("appQrAlt"), src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data.svg) }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { color: "#666", fontSize: 12 }, children: t("appNoQr") }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "dshBrowserCtlCardDesc", style: { textAlign: "center" }, children: t("appOnceHint") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshBrowserCtlUrlRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshBrowserCtlUrl", title: data.url, children: data.url }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Button, { variant: "ghost", size: "sm", onClick: () => {
          navigator.clipboard?.writeText(data.url).then(() => setCopied(true)).catch(() => {
          });
        }, children: copied ? t("copied") : t("appCopyLink") })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshBrowserCtlQrBox", style: { height: 120 }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { color: "#666", fontSize: 12, padding: "0 14px", textAlign: "center" }, children: loading ? t("appLoading") : data && data.error || t("appNoQr") }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshBrowserCtlActions", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Button, { variant: "secondary", size: "sm", disabled: loading, onClick: load, children: loading ? "\u2026" : t("appRefresh") }) })
  ] });
}

// src/client/cards/ios-guide.jsx
var import_react6 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
function IosGuideCard({ t }) {
  const [open, setOpen] = (0, import_react6.useState)(false);
  const [copied, setCopied] = useToast(1600);
  const site = ABOUT_LINKS.website;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
      "button",
      {
        type: "button",
        className: "dshBrowserCtlCardHead dshBrowserCtlFoldBtn",
        "data-open": open ? "true" : "false",
        onClick: () => setOpen((o) => !o),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { "aria-hidden": "true", style: { display: "inline-flex", flex: "none", color: "var(--dsw-alias-label-tertiary,#8b8f98)", transform: open ? "rotate(90deg)" : "none", transition: "transform .15s ease" }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: 13, fontWeight: 500 }, children: t("linkTitle") }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "dshBrowserCtlCardStat", style: { fontWeight: 400, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("linkWebTag") })
        ]
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 8, padding: "0 2px 4px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "dshBrowserCtlCardDesc", children: t("linkSubtitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshBrowserCtlUrlRow", style: { gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "dshBrowserCtlUrl", title: site, children: site }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Button, { variant: "ghost", size: "sm", onClick: () => {
          navigator.clipboard?.writeText(site).then(() => setCopied(true)).catch(() => {
          });
        }, children: copied ? t("linkCopied") : t("linkCopy") }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Button, { variant: "secondary", size: "sm", onClick: () => window.open(site, "_blank", "noopener"), children: t("linkOpenSite") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "dshBrowserCtlCardDesc", style: { fontWeight: 500, color: "var(--dsw-alias-label-secondary,#a6aab2)" }, children: t("linkStepsTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("ol", { style: { margin: 0, paddingLeft: 18, fontSize: 11.5, lineHeight: "18px", color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("li", { children: t("linkStep1") }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("li", { children: t("linkStep2") }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("li", { children: t("linkStep3") }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("li", { children: t("linkStep4") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "dshBrowserCtlCardDesc", children: t("linkNote") })
    ] })
  ] });
}

// src/client/cards/totp.jsx
var import_react7 = require("react");
var import_jsx_runtime7 = require("react/jsx-runtime");
function TotpCard({ t, reloadToken, onRefresh, disabled }) {
  const [data, setData] = (0, import_react7.useState)(null);
  const [busy, setBusy] = (0, import_react7.useState)(false);
  const [open, setOpen] = (0, import_react7.useState)(true);
  const anyBusy = disabled || busy;
  (0, import_react7.useEffect)(() => {
    let alive = true;
    fetch(API_P + "/browserctl/api/totp", { cache: "no-store" }).then((r) => r.text().then((tx) => {
      try {
        return JSON.parse(tx);
      } catch {
        return { error: "HTTP " + r.status };
      }
    })).then((j) => {
      if (alive) setData(j);
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, [reloadToken]);
  async function toggle(enable, reset) {
    setBusy(true);
    try {
      const q = new URLSearchParams({ enabled: enable ? "1" : "0", reset: reset ? "1" : "0" }).toString();
      const r = await fetch(API_P + "/browserctl/api/totp-toggle?" + q, { cache: "no-store" });
      let j = {};
      try {
        j = await r.json();
      } catch {
        j = { ok: false, error: "HTTP " + r.status };
      }
      if (j.ok) onRefresh();
      else if (j.error) setData((d) => ({ ...d, error: j.error }));
    } finally {
      setBusy(false);
    }
  }
  const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
  const status = data ? data.enabled ? sessions.length > 0 ? t("totpOn") + " \xB7 " + t("devicesOnline").replace("{n}", sessions.length) : t("totpOn") : t("totpOff") : "\u2026";
  const [copiedSecret, setCopiedSecret] = useToast(1600);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshBrowserCtlCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "button",
      {
        type: "button",
        className: "dshBrowserCtlCardHead",
        "data-open": open ? "true" : "false",
        onClick: () => setOpen((o) => !o),
        children: [
          Svg.lock,
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t("totpTitle") }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: {
            fontWeight: 500,
            fontSize: 12,
            color: data?.enabled ? "var(--dsw-alias-state-success-primary,#34b371)" : "var(--dsw-alias-label-tertiary,#8b8f98)"
          }, children: status }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dshBrowserCtlCardArrow", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshBrowserCtlCardBody", "data-open": open, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("totpHintShort") }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: [
        t("totpAppHint"),
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("a", { href: MS_AUTHENTICATOR_URL, target: "_blank", rel: "noopener noreferrer", style: { color: "var(--dsw-alias-accent-strong,#4da3ff)" }, children: t("totpAppLink") })
      ] }),
      data?.enabled && data?.svg && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshBrowserCtlTotpQr", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("img", { alt: t("totpBind"), src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data.svg) }) }),
      data?.secret && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshBrowserCtlSecretRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshBrowserCtlSecret", title: data.secret, children: [
          t("totpSecretLabel"),
          ": ",
          data.secret
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { variant: "ghost", size: "sm", onClick: () => {
          navigator.clipboard?.writeText(data.secret).then(() => setCopiedSecret(true)).catch(() => {
          });
        }, children: copiedSecret ? t("copied") : t("copySecret") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshBrowserCtlActions", children: data?.enabled ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { variant: "secondary", size: "sm", disabled: anyBusy, onClick: () => toggle(false), children: t("totpDisable") }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { variant: "secondary", size: "sm", disabled: anyBusy, onClick: () => toggle(true, true), children: t("totpReset") })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { variant: "primary", size: "sm", disabled: anyBusy || !data, onClick: () => toggle(true), children: t("totpEnable") }) })
    ] })
  ] });
}

// src/client/cards/session.jsx
var import_react8 = require("react");
var import_jsx_runtime8 = require("react/jsx-runtime");
function SessionDaysCard({ t, disabled }) {
  const [days, setDays] = (0, import_react8.useState)(null);
  const [busy, setBusy] = (0, import_react8.useState)(false);
  const [err, setErr] = (0, import_react8.useState)("");
  (0, import_react8.useEffect)(() => {
    let alive = true;
    fetch(API_P + "/browserctl/api/session-days", { cache: "no-store" }).then((r) => r.json().catch(() => ({}))).then((j) => {
      if (!alive) return;
      if (j && j.ok) setDays(j.session_days);
      else setErr(j && j.error || t("sdLoadFail"));
    }).catch(() => {
      if (alive) setErr(t("sdLoadFail"));
    });
    return () => {
      alive = false;
    };
  }, []);
  async function pick(n) {
    if (disabled || busy || n === days) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(API_P + "/browserctl/api/session-days?days=" + n, { method: "POST", cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (j && j.ok) setDays(j.session_days);
      else setErr(j && j.error || t("sdSaveFail"));
    } catch (e) {
      setErr(t("sdSaveFail"));
    } finally {
      setBusy(false);
    }
  }
  const opts = [1, 7, 30];
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshBrowserCtlCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshBrowserCtlCardHead", "data-open": "true", style: { cursor: "default" }, children: [
      Svg.lock,
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t("sdTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: {
        fontWeight: 500,
        fontSize: 12,
        color: "var(--dsw-alias-label-tertiary,#8b8f98)"
      }, children: days ? t("sdCurrent").replace("{n}", days) : t("sdLoading") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshBrowserCtlCardBody", "data-open": "true", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dshBrowserCtlActions", children: opts.map((n) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        Button,
        {
          variant: days === n ? "primary" : "secondary",
          size: "sm",
          disabled: disabled || busy,
          onClick: () => pick(n),
          children: n === 1 ? t("sdDay1") : n === 7 ? t("sdDay7") : t("sdDay30")
        },
        n
      )) }),
      err && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-state-error-primary,#e5655c)" }, children: err }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("sdHint") })
    ] })
  ] });
}

// src/client/cards/sig-enforce.jsx
var import_react9 = require("react");
var import_jsx_runtime9 = require("react/jsx-runtime");
function SigEnforceCard({ t, reloadToken }) {
  const [data, setData] = (0, import_react9.useState)(null);
  const [busy, setBusy] = (0, import_react9.useState)(false);
  const [confirming, setConfirming] = (0, import_react9.useState)(false);
  const [err, setErr] = (0, import_react9.useState)("");
  const [devsOpen, setDevsOpen] = (0, import_react9.useState)(false);
  const [acting, setActing] = (0, import_react9.useState)("");
  const [msg, setMsg] = useToast();
  const [dedupeConfirm, setDedupeConfirm] = (0, import_react9.useState)(false);
  const [health, setHealth] = (0, import_react9.useState)(null);
  const [allConfirm, setAllConfirm] = (0, import_react9.useState)(false);
  const [allMsg, setAllMsg] = useToast();
  const [advOpen, setAdvOpen] = (0, import_react9.useState)(false);
  const [forceOpen, setForceOpen] = (0, import_react9.useState)(false);
  (0, import_react9.useEffect)(() => {
    let alive = true;
    fetch(API_P + "/browserctl/api/sig", { cache: "no-store" }).then((r) => r.json().catch(() => ({}))).then((j) => {
      if (alive && j && j.ok) setData(j);
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, [reloadToken]);
  async function toggle(next, force) {
    if (busy) return;
    if (next && !force && !confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setErr("");
    setConfirming(false);
    setForceOpen(false);
    try {
      const r = await fetch(API_P + "/browserctl/api/sig-toggle?enforce=" + (next ? "1" : "0") + (force ? "&force=1" : ""), { method: "POST", cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (j && j.ok) setData((d) => ({ ...d || {}, enforce: !!next }));
      else {
        setErr(j && j.error || t("sigFail"));
        setForceOpen(!!(j && j.readiness && j.readiness.ready === false && next));
      }
    } catch (e) {
      setErr(t("sigFail"));
    } finally {
      setBusy(false);
    }
  }
  async function refetch() {
    try {
      const r = await fetch(API_P + "/browserctl/api/sig", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (j && j.ok) setData(j);
    } catch (e) {
    }
  }
  async function loadHealth() {
    try {
      const r = await fetch(API_P + "/browserctl/api/sig-health", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      setHealth(j && j.ok ? j : { ok: false });
    } catch (e) {
      setHealth({ ok: false });
    }
  }
  const [restarting, setRestarting] = (0, import_react9.useState)(false);
  (0, import_react9.useEffect)(() => {
    loadHealth();
  }, [reloadToken]);
  (0, import_react9.useEffect)(() => {
    const timer = setInterval(() => {
      refetch();
      loadHealth();
    }, 5e3);
    const onVis = () => {
      if (!document.hidden) {
        refetch();
        loadHealth();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  async function restartGate() {
    if (restarting) return;
    setRestarting(true);
    try {
      await fetch(API_P + "/browserctl-gate/gate-restart", { method: "POST", cache: "no-store" });
    } catch (e) {
    }
    let n = 0;
    const timer = setInterval(async () => {
      n += 1;
      await loadHealth();
      if (n >= 5) {
        clearInterval(timer);
        setRestarting(false);
      }
    }, 2e3);
  }
  async function revokeAll() {
    if (acting) return;
    setActing("all");
    setAllMsg("");
    try {
      const r = await fetch(API_P + "/browserctl-gate/revoke-all", { method: "POST", cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (j && j.ok) {
        setAllMsg(t("sigCleared").replace("{s}", String(j.sessions || 0)).replace("{d}", String(j.devices || 0)).replace("{g}", String(j.grants || 0)) + (j.records ? t("sigClearedRecords").replace("{n}", String(j.records)) : ""));
        await refetch();
        await loadHealth();
      } else setAllMsg(j && j.error || t("sigFail2"));
    } catch (e) {
      setAllMsg(t("sigFail2"));
    } finally {
      setActing("");
      setAllConfirm(false);
    }
  }
  async function revoke(dev) {
    if (acting) return;
    setActing(dev);
    setMsg("");
    try {
      const r = await kickViaGate({ dev, purge: 1, onKicked: refetch });
      const j = r && r.ok ? await r.json().catch(() => ({})) : null;
      if (r && r.ok) {
        if (j && j.purged) {
          setData((d) => d ? { ...d, device_list: (d.device_list || []).filter((x) => x.dev !== dev) } : d);
          setMsg(t("sigRevokedPurged"));
        } else {
          setMsg(t("sigRevokedKeep"));
        }
        await refetch();
      } else setMsg(t("sigFail2"));
    } catch (e) {
      setMsg(t("sigFail2"));
    } finally {
      setActing("");
    }
  }
  const dups = (() => {
    const list = data && data.device_list || [];
    const groups = {};
    list.forEach((d) => {
      const k = (d.name || "") + "|" + (d.ip || "");
      (groups[k] = groups[k] || []).push(d);
    });
    const out = [];
    Object.keys(groups).forEach((k) => {
      const g = groups[k];
      if (g.length < 2) return;
      const keep = g.slice().sort((a, b) => (b.has_pubkey ? 1 : 0) - (a.has_pubkey ? 1 : 0) || (b.last_seen || 0) - (a.last_seen || 0))[0];
      g.forEach((d) => {
        if (d.dev !== keep.dev) out.push(d.dev);
      });
    });
    return out;
  })();
  const mergedDevs = (() => {
    const list = data && data.device_list || [];
    const groups = /* @__PURE__ */ new Map();
    for (const d of list) {
      const k = (d.name || "") + "|" + (d.ip || "");
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(d);
    }
    const out = [];
    for (const g of groups.values()) {
      const face = g.slice().sort((a, b) => (b.has_pubkey ? 1 : 0) - (a.has_pubkey ? 1 : 0) || (b.last_seen || 0) - (a.last_seen || 0))[0];
      out.push({ ...face, _dupN: g.length });
    }
    return out;
  })();
  async function dedupe() {
    if (acting || !dups.length) return;
    setActing("dedupe");
    setMsg("");
    setDedupeConfirm(false);
    let delN = 0;
    try {
      for (const dev of dups) {
        const r = await kickViaGate({ dev, purge: 1 });
        const j = r && r.ok ? await r.json().catch(() => ({})) : null;
        if (j && j.ok && j.purged) delN += 1;
      }
      setMsg(delN === dups.length ? t("sigDedupeDone").replace("{n}", String(delN)) : t("sigDedupePart").replace("{ok}", String(delN)).replace("{n}", String(dups.length)));
      await refetch();
    } catch (e) {
      setMsg(t("sigFail2"));
    } finally {
      setActing("");
    }
  }
  const enforce = !!(data && data.enforce);
  const rd = health && health.sig_readiness || null;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshBrowserCtlCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshBrowserCtlCardHead", "data-open": "true", style: { cursor: "default" }, children: [
      Svg.shield,
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: t("sigTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: {
        fontWeight: 500,
        fontSize: 12,
        color: data ? enforce ? "var(--dsw-alias-state-success-primary,#34b371)" : "var(--dsw-alias-label-tertiary,#8b8f98)" : "inherit"
      }, children: data ? enforce ? t("sigOn") : t("sigOff") : t("sigLoading") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshBrowserCtlCardBody dshBrowserCtlCardBodyTall", "data-open": "true", children: [
      data && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("sigCounts").replace("{d}", String(data.devices ?? 0)).replace("{k}", String(data.devices_with_key ?? 0)).replace("{p}", String(data.devices_with_pubkey ?? 0)) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshBrowserCtlSwitchRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "dshBrowserCtlSwitchLabel", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "dshBrowserCtlSwitchTitle", children: t("sigSwitchLabel") }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "dshBrowserCtlSwitchHint", children: t("sigSwitchHint") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
          "button",
          {
            type: "button",
            role: "switch",
            "aria-checked": enforce,
            "aria-label": t("sigSwitchLabel"),
            className: "dshBrowserCtlSwitch",
            "data-on": enforce ? "true" : "false",
            "data-busy": busy ? "true" : "false",
            disabled: busy || !data,
            onClick: () => toggle(!enforce),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "dshBrowserCtlSwitchKnob", "aria-hidden": "true" }),
              busy && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "dshBrowserCtlSwitchBusy", "aria-hidden": "true" })
            ]
          }
        )
      ] }),
      rd && !rd.ready && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-state-warning-primary,#c78d33)" }, children: t("sigRdLock").replace("{w}", String(rd.recent_with_key)).replace("{t}", String(rd.recent_total)).replace("{n}", String(rd.remaining)) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshBrowserCtlDevInfo", style: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "dshBrowserCtlDevTop", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: { fontSize: 12, fontWeight: 500, color: "var(--dsw-alias-label-primary,inherit)" }, children: t("sigRdTitle") }) }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "dshBrowserCtlDevIp", children: rd && rd.ready ? t("sigRdReady") : t("sigRdNotReady") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "dshBrowserCtlKindTag", "data-kind": data && (enforce || rd && rd.ready) ? "app" : "web", style: { margin: 0 }, children: data ? enforce ? t("sigOn") : rd && rd.ready ? t("sigRdCanOn") : t("sigOff") : t("sigLoading") })
      ] }),
      confirming && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshBrowserCtlActions", role: "alertdialog", "aria-label": t("sigYes"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-state-warning-primary,#c78d33)" }, children: t("sigConfirm") }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { variant: "primary", size: "sm", disabled: busy, onClick: () => toggle(true), children: t("sigYes") }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { variant: "secondary", size: "sm", disabled: busy, onClick: () => setConfirming(false), children: t("sigCancel") })
      ] }),
      data && Array.isArray(data.device_list) && data.device_list.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { marginTop: 4 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("button", { type: "button", className: "dshBrowserCtlCardHead dshBrowserCtlFoldBtn", "data-open": devsOpen ? "true" : "false", onClick: () => setDevsOpen((o) => !o), children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "aria-hidden": "true", style: { display: "inline-flex", flex: "none", color: "var(--dsw-alias-label-tertiary,#8b8f98)", transform: devsOpen ? "rotate(90deg)" : "none", transition: "transform .15s ease" }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { style: { fontSize: 13, fontWeight: 500 }, children: [
            t("sigDevs"),
            " (",
            data.device_list.length,
            ")"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "dshBrowserCtlCardStat", style: { fontWeight: 400, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("sigDevsHint") })
        ] }),
        devsOpen && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshBrowserCtlSigDevs", children: [
          mergedDevs.map((d) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", border: "1px solid var(--dsw-alias-separator,#2a2c33)", borderRadius: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, minWidth: 0 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { style: { fontSize: 12, color: "var(--dsw-alias-label-primary,#e7e9ee)", flex: "0 1 auto", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: [
                  d.name || d.dev || t("sigUnnamed"),
                  d.online ? " " + t("sigOnlineTag") : ""
                ] }),
                (d._dupN || 1) > 1 && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "dshBrowserCtlDupBadge", children: t("dupBadge").replace("{n}", String(d._dupN)) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { fontSize: 11, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: [
                d.kind || "?",
                " \xB7 ",
                d.ip || "?",
                " \xB7 ",
                d.last_seen ? new Date(d.last_seen * 1e3).toLocaleString() : "\u2014"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: { fontSize: 10, padding: "1px 6px", borderRadius: 999, flexShrink: 0, background: d.has_pubkey ? "rgba(52,179,113,.16)" : d.has_key ? "rgba(61,126,255,.14)" : "rgba(229,101,92,.14)", color: d.has_pubkey ? "#34b371" : d.has_key ? "#3d7eff" : "#e5655c" }, children: d.has_pubkey ? t("sigHasPub") : d.has_key ? t("sigHasKeyB") : t("sigRevokedBadge") }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { variant: "ghost", size: "sm", className: "dshBrowserCtlBtnDangerSoft", disabled: !!acting, onClick: () => revoke(d.dev), children: acting === d.dev ? t("sigRevoking") : t("sigRevoke") })
          ] }, d.dev)),
          dups.length > 0 && (dedupeConfirm ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshBrowserCtlActions", role: "alertdialog", "aria-label": t("sigDedupeYes"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-state-warning-primary,#c78d33)" }, children: t("sigDedupeHint").replace("{n}", String(dups.length)) }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { variant: "primary", size: "sm", disabled: !!acting, onClick: dedupe, children: t("sigDedupeYes") }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { variant: "secondary", size: "sm", disabled: !!acting, onClick: () => setDedupeConfirm(false), children: t("sigCancel") })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { display: "flex", justifyContent: "center", paddingTop: 2 }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { variant: "secondary", size: "sm", disabled: !!acting, onClick: () => setDedupeConfirm(true), children: t("sigDedupe").replace("{n}", String(dups.length)) }) })),
          msg && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: { margin: 0, fontSize: 12, textAlign: "center", color: "var(--dsw-alias-state-success-primary,#34b371)" }, children: msg })
        ] })
      ] }),
      err && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-state-error-primary,#e5655c)" }, children: err }),
      err && forceOpen && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshBrowserCtlActions", role: "alertdialog", "aria-label": t("sigForceYes"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { variant: "primary", size: "sm", disabled: busy, onClick: () => toggle(true, true), children: t("sigForceYes") }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { variant: "secondary", size: "sm", disabled: busy, onClick: () => {
          setErr("");
          setForceOpen(false);
        }, children: t("sigCancel") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
        "button",
        {
          type: "button",
          className: "dshBrowserCtlCardHead dshBrowserCtlFoldBtn",
          "data-open": advOpen ? "true" : "false",
          onClick: () => setAdvOpen((o) => !o),
          style: { marginTop: 4 },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "aria-hidden": "true", style: { display: "inline-flex", flex: "none", color: "var(--dsw-alias-label-tertiary,#8b8f98)", transform: advOpen ? "rotate(90deg)" : "none", transition: "transform .15s ease" }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: { fontSize: 13, fontWeight: 500 }, children: t("sigAdvanced") }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "dshBrowserCtlCardStat", style: { fontWeight: 400, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("sigAdvancedHint") })
          ]
        }
      ),
      advOpen && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
        health && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "aria-hidden": "true", style: { width: 7, height: 7, borderRadius: 999, flexShrink: 0, background: health.ok ? "#34b371" : "#e5655c" } }),
          health.ok ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: t("sigHealthOk").replace("{e}", health.enforce ? t("sigHealthOn") : t("sigHealthOff")).replace("{n}", String(health.devices_with_pubkey)).replace("{s}", String(health.sessions)) }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: { color: "#e5655c" }, children: t("sigHealthBad") }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: { flex: 1 } }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "dshBrowserCtlMiniBtn", onClick: loadHealth, children: t("pushRefresh") }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "dshBrowserCtlMiniBtn dshBrowserCtlMiniBtnDanger", onClick: restartGate, children: restarting ? t("sigRestarting") : t("sigRestart") })
        ] }),
        allConfirm ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshBrowserCtlActions", role: "alertdialog", "aria-label": t("sigRevokeAll"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-state-error-primary,#e5655c)" }, children: t("sigRevokeAllText") }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { variant: "primary", size: "sm", disabled: !!acting, onClick: revokeAll, children: acting === "all" ? t("sigClearing") : t("sigRevokeAllDo") }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { variant: "secondary", size: "sm", disabled: !!acting, onClick: () => setAllConfirm(false), children: t("sigCancel") })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { display: "flex", justifyContent: "flex-end" }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { variant: "ghost", size: "sm", className: "dshBrowserCtlBtnDangerSoft", disabled: !!acting, onClick: () => {
          setAllConfirm(true);
          setAllMsg("");
        }, children: t("sigRevokeAll") }) }),
        allMsg && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-label-secondary,#c9ccd4)" }, children: allMsg }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("sigHint") })
      ] })
    ] })
  ] });
}

// src/client/cards/sysinfo.jsx
var import_react10 = require("react");
var import_jsx_runtime10 = require("react/jsx-runtime");
function SysinfoCard({ t }) {
  const [d, setD] = (0, import_react10.useState)(null);
  const [busy, setBusy] = (0, import_react10.useState)(false);
  (0, import_react10.useEffect)(() => {
    let alive = true;
    fetch(API_P + "/browserctl/api/sysinfo", { cache: "no-store" }).then((r) => r.json().catch(() => ({}))).then((j) => {
      if (!alive) return;
      setD(j && j.sysinfo ? j.sysinfo : { ok: false, error: j && j.error });
    }).catch(() => {
      if (alive) setD({ ok: false });
    });
    return () => {
      alive = false;
    };
  }, []);
  function load() {
    setBusy(true);
    fetch(API_P + "/browserctl/api/sysinfo", { cache: "no-store" }).then((r) => r.json().catch(() => ({}))).then((j) => {
      setD(j && j.sysinfo ? j.sysinfo : { ok: false, error: j && j.error });
      setBusy(false);
    }).catch(() => {
      setD({ ok: false });
      setBusy(false);
    });
  }
  function fmtGB(bytes) {
    const g = (Number(bytes) || 0) / 1073741824;
    return g >= 10 ? g.toFixed(0) + " GB" : g.toFixed(1) + " GB";
  }
  function bar(label, pct, txt) {
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { style: { flex: "0 0 40px", fontSize: 12, fontWeight: 600, color: "var(--dsw-alias-label-secondary,#6b7078)" }, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { style: { flex: "1 1 auto", minWidth: 40, height: 6, borderRadius: 3, background: "var(--dsw-alias-fill-tertiary,rgba(127,127,127,.2))", overflow: "hidden", display: "block" }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { style: { display: "block", height: "100%", width: pct + "%", borderRadius: 3, background: "var(--dsw-alias-brand-primary,#5b8cff)" } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { style: { flex: "0 0 auto", fontSize: 11.5, color: "var(--dsw-alias-label-tertiary,#8b8f98)", whiteSpace: "nowrap" }, children: txt })
    ] });
  }
  const ok = !!(d && d.ok);
  const memPct = ok && Number(d.memTotal) > 0 ? Math.max(0, Math.min(100, Math.round((1 - Number(d.memFree) / Number(d.memTotal)) * 100))) : 0;
  const disks = ok && Array.isArray(d.disks) ? d.disks : [];
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshBrowserCtlCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshBrowserCtlCardHead", "data-open": "true", style: { cursor: "default" }, children: [
      Svg.desk,
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: t("sysTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { style: { fontWeight: 500, fontSize: 12, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: ok ? (Number(d.cpu) || 0) + "% CPU" : t("sysFail") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshBrowserCtlCardBody", "data-open": "true", children: [
      !ok ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-state-error-primary,#e5655c)" }, children: d && d.error || t("sysFail") }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 7 }, children: [
        bar("CPU", Math.max(0, Math.min(100, Number(d.cpu) || 0)), (Number(d.cpu) || 0) + "%"),
        bar(t("sysMem"), memPct, memPct + "% \xB7 " + t("sysFree") + " " + fmtGB(Number(d.memFree) * 1024)),
        disks.slice(0, 4).map((dk) => {
          const total = Number(dk && dk.size) || 0;
          const free = Number(dk && dk.free) || 0;
          if (total <= 0) return null;
          const p = Math.max(0, Math.min(100, Math.round((1 - free / total) * 100)));
          return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { children: bar(String(dk.drive || "?"), p, t("sysFree") + " " + fmtGB(free)) }, dk.drive);
        })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "dshBrowserCtlActions", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Button, { variant: "secondary", size: "sm", disabled: busy, onClick: load, children: busy ? t("pushRefreshing") : t("pushRefresh") }) }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("sysHint") })
    ] })
  ] });
}

// src/client/cards/push.jsx
var import_react11 = require("react");
var import_jsx_runtime11 = require("react/jsx-runtime");
function PushGroupedList({ t, items }) {
  const merged = [];
  for (const it of items) {
    const prev = merged[merged.length - 1];
    if (prev && prev.kind === it.kind && (prev.title || "") === (it.title || "") && (prev.body || "") === (it.body || "")) {
      prev._dupN = (prev._dupN || 1) + 1;
      continue;
    }
    merged.push({ ...it });
  }
  const groups = { official: [], security: [] };
  for (const it of merged) groups[pushCatOf(it)].push(it);
  const groupHead = (key) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "dshBrowserCtlPushGroupHead", children: t(key === "official" ? "pushGroupOfficial" : "pushGroupSecurity") }, "g-" + key);
  const rows = [];
  if (groups.official.length) {
    rows.push(groupHead("official"));
    rows.push(...groups.official.map((it) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PushRow, { t, it }, "o" + (it.id || it.t))));
  }
  if (groups.security.length) {
    rows.push(groupHead("security"));
    rows.push(...groups.security.map((it) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PushRow, { t, it }, "s" + (it.id || it.t))));
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "dshBrowserCtlPushList", children: rows });
}
function PushRow({ t, it }) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "dshBrowserCtlPushRow", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "dshBrowserCtlPushAside", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlPushType", children: pushKindLabel(t, it.kind) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlPushTime", children: fmtAbsolute(it.t, "date") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "dshBrowserCtlPushMain", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: 6, minWidth: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlPushTitle", title: it.title || "", style: { minWidth: 0 }, children: it.title || "" }),
        (it._dupN || 1) > 1 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlDupBadge", children: t("dupBadge").replace("{n}", String(it._dupN)) }) : null
      ] }),
      it.body ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlPushBody", title: it.body, children: it.body }) : null
    ] })
  ] });
}
function PushCard({ t, reloadToken }) {
  const [cfg, setCfg] = (0, import_react11.useState)(null);
  const [cfgErr, setCfgErr] = (0, import_react11.useState)("");
  const [busy, setBusy] = (0, import_react11.useState)("");
  const [testState, setTestState] = (0, import_react11.useState)("idle");
  const [msgTitle, setMsgTitle] = (0, import_react11.useState)("");
  const [msgBody, setMsgBody] = (0, import_react11.useState)("");
  const [msgState, setMsgState] = (0, import_react11.useState)("idle");
  const [toast, setToast] = useToast();
  const [items, setItems] = (0, import_react11.useState)(null);
  const [polling, setPolling] = (0, import_react11.useState)(false);
  const [open, setOpen] = (0, import_react11.useState)(true);
  const [manualOpen, setManualOpen] = (0, import_react11.useState)(false);
  const enabled = !!(cfg && cfg.enabled);
  const system = !!(cfg && cfg.system);
  (0, import_react11.useEffect)(() => {
    let alive = true;
    fetch(API_P + "/browserctl-gate/push-config", { cache: "no-store" }).then((r) => r.text().then((tx) => {
      try {
        return JSON.parse(tx);
      } catch {
        return { error: "HTTP " + r.status };
      }
    })).then((j) => {
      if (!alive) return;
      if (j && j.ok) setCfg({ enabled: !!j.enabled, system: !!j.system, since: j.since || 0 });
      else setCfgErr(j && j.error || t("pushPollFailed"));
    }).catch(() => {
      if (alive) setCfgErr(t("pushPollFailed"));
    });
    return () => {
      alive = false;
    };
  }, [reloadToken]);
  async function toggle(which) {
    if (busy || !cfg) return;
    setBusy(which);
    setToast(null);
    const next = which === "enabled" ? !enabled : !system;
    try {
      const q = new URLSearchParams({
        enabled: which === "enabled" ? next ? "1" : "0" : enabled ? "1" : "0",
        system: which === "system" ? next ? "1" : "0" : system ? "1" : "0"
      }).toString();
      const r = await fetch(API_P + "/browserctl-gate/push-config?" + q, { method: "POST", cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        setCfg((c) => ({ ...c || {}, enabled: !!j.enabled, system: !!j.system, since: j.since || c && c.since || 0 }));
      } else {
        setToast({ text: j && j.error || t("pushSaveFailed"), ok: false });
      }
    } catch {
      setToast({ text: t("pushSaveFailed"), ok: false });
    } finally {
      setBusy("");
    }
  }
  async function sendTest() {
    if (testState === "loading" || !enabled || busy) return;
    setTestState("loading");
    setToast(null);
    try {
      const q = new URLSearchParams({ kind: "test", title: t("pushTestTitle"), body: t("pushTestBody") }).toString();
      const r = await fetch(API_P + "/browserctl-gate/notify?" + q, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      const ok = !!(r.ok && j && j.ok);
      setToast({ text: ok ? t("pushTestOk") : j && j.error || t("pushTestFail"), ok });
      if (ok) loadPoll();
    } catch {
      setToast({ text: t("pushTestFail"), ok: false });
    } finally {
      setTestState("idle");
    }
  }
  async function sendMessage() {
    if (msgState === "loading") return;
    const body = msgBody.trim();
    if (!body) return;
    setMsgState("loading");
    setToast(null);
    try {
      if (!enabled) {
        setToast({ text: t("pushSendOff"), ok: false });
        return;
      }
      const q = new URLSearchParams({ kind: "msg", title: msgTitle.trim().slice(0, 120), body: body.slice(0, 500) }).toString();
      const r = await fetch(API_P + "/browserctl-gate/notify?" + q, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      const ok = !!(r.ok && j && j.ok && j.pushed !== false);
      if (ok) {
        setMsgTitle("");
        setMsgBody("");
        loadPoll();
      }
      setToast({ text: ok ? t("pushSendOk") : j && j.pushed === false ? t("pushSendOff") : j && j.error || t("pushSendFail"), ok });
    } catch {
      setToast({ text: t("pushSendFail"), ok: false });
    } finally {
      setMsgState("idle");
    }
  }
  async function loadPoll() {
    if (polling) return;
    setPolling(true);
    try {
      const r = await fetch(API_P + "/browserctl-gate/push-poll?last=0", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        setItems(Array.isArray(j.items) ? j.items.slice(0, 20) : []);
        setCfg((c) => ({ ...c || {}, enabled: !!j.enabled, since: j.since || c && c.since || 0 }));
        setCfgErr("");
      }
    } catch {
    } finally {
      setPolling(false);
    }
  }
  (0, import_react11.useEffect)(() => {
    loadPoll();
  }, [reloadToken]);
  const list = items || [];
  const switchDisabled = !!busy || !cfg;
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "dshBrowserCtlCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { type: "button", className: "dshBrowserCtlCardHead", "data-open": open ? "true" : "false", onClick: () => setOpen((o) => !o), children: [
      Svg.bell,
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: t("pushTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlCardStat", "data-tone": enabled ? "ok" : "muted", children: cfg ? enabled ? t("pushOn") : t("pushOff") : "\u2026" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlCardArrow", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "dshBrowserCtlCardBody dshBrowserCtlCardBodyTall", "data-open": open, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "dshBrowserCtlCardDesc", children: t("pushDesc") }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "dshBrowserCtlSwitchRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "dshBrowserCtlSwitchLabel", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlSwitchTitle", children: t("pushEnabledLabel") }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlSwitchHint", children: t("pushEnabledHint") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
          "button",
          {
            type: "button",
            role: "switch",
            "aria-checked": enabled,
            "aria-label": t("pushEnabledLabel"),
            className: "dshBrowserCtlSwitch",
            "data-on": enabled ? "true" : "false",
            "data-busy": busy === "enabled" ? "true" : "false",
            disabled: switchDisabled,
            onClick: () => toggle("enabled"),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlSwitchKnob", "aria-hidden": "true" }),
              busy === "enabled" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlSwitchBusy", "aria-hidden": "true" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "dshBrowserCtlSwitchRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "dshBrowserCtlSwitchLabel", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlSwitchTitle", children: t("pushSystemLabel") }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlSwitchHint", children: t("pushSystemHint") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
          "button",
          {
            type: "button",
            role: "switch",
            "aria-checked": system,
            "aria-label": t("pushSystemLabel"),
            className: "dshBrowserCtlSwitch",
            "data-on": system ? "true" : "false",
            "data-busy": busy === "system" ? "true" : "false",
            disabled: switchDisabled,
            onClick: () => toggle("system"),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlSwitchKnob", "aria-hidden": "true" }),
              busy === "system" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlSwitchBusy", "aria-hidden": "true" })
            ]
          }
        )
      ] }),
      cfgErr && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "dshBrowserCtlCardDescErr", children: cfgErr }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
        "button",
        {
          type: "button",
          className: "dshBrowserCtlCardHead dshBrowserCtlFoldBtn",
          "data-open": manualOpen ? "true" : "false",
          onClick: () => setManualOpen((o) => !o),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlFoldChev", "data-open": manualOpen ? "true" : "false", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlFoldLabel", children: t("pushManualFold") }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlCardStat", "data-tone": "muted", children: t("pushComposerHint") })
          ]
        }
      ),
      manualOpen && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "dshBrowserCtlMsgCard", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "dshBrowserCtlMsgHead", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlMsgCardTitle", children: t("pushComposerTitle") }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "dshBrowserCtlMsgHint", children: t("pushComposerHint") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: t("pushMsgTitleLabel") }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              "input",
              {
                value: msgTitle,
                onChange: (e) => setMsgTitle(e.target.value),
                placeholder: t("pushMsgTitlePh"),
                maxLength: 120,
                spellCheck: false,
                disabled: msgState === "loading"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: t("pushMsgBodyLabel") }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              "textarea",
              {
                value: msgBody,
                onChange: (e) => setMsgBody(e.target.value),
                placeholder: t("pushMsgBodyPh"),
                maxLength: 500,
                rows: 3,
                disabled: msgState === "loading"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "dshBrowserCtlMsgFoot", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "dshBrowserCtlMsgCount", children: [
              msgBody.length,
              "/500"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              Button,
              {
                variant: "primary",
                size: "sm",
                className: "dshBrowserCtlMsgSendBtn",
                disabled: msgState === "loading" || !msgBody.trim(),
                onClick: sendMessage,
                children: msgState === "loading" ? t("pushSending") : t("pushSend")
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "dshBrowserCtlActions", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          Button,
          {
            variant: "secondary",
            size: "sm",
            className: "dshBrowserCtlPushBtn",
            disabled: testState === "loading" || !enabled || !!busy,
            onClick: sendTest,
            children: testState === "loading" ? t("pushTesting") : t("pushTest")
          }
        ) })
      ] }),
      toast && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "dshBrowserCtlPairedMsg", "data-ok": toast.ok ? "true" : "false", children: toast.text }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "dshBrowserCtlPairedList", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "dshBrowserCtlPairedHead", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: t("pushRecent") }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Button, { variant: "ghost", size: "sm", disabled: polling, onClick: loadPoll, children: polling ? t("pushRefreshing") : t("pushRefresh") })
        ] }),
        list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "dshBrowserCtlPairedEmpty", children: t("pushEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PushGroupedList, { t, items: list })
      ] })
    ] })
  ] });
}

// src/client/cards/update.jsx
var import_react12 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime12 = require("react/jsx-runtime");
function UpdateApplyButton({ t, latest, variant, onApplied }) {
  const [state, setState] = (0, import_react12.useState)("idle");
  const [errMsg, setErrMsg] = (0, import_react12.useState)("");
  async function apply2() {
    if (state === "loading") return;
    setState("loading");
    setErrMsg("");
    try {
      const r = await fetch(API_P + "/browserctl/api/update-apply", { method: "POST", cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (j && j.ok) {
        setState("done");
        if (onApplied) onApplied(j);
      } else {
        setState("error");
        setErrMsg(j && j.error || "HTTP " + r.status);
      }
    } catch (e) {
      setState("error");
      setErrMsg(String(e && e.message || e));
    }
  }
  const btn = /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_dsh_client_ui_primitives2.Tooltip, { label: state === "done" ? t("updateApplyDone").replace("{v}", latest) : t("updateApplyTip"), children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
    Button,
    {
      variant: variant || "primary",
      size: "sm",
      disabled: state === "loading" || state === "done",
      onClick: apply2,
      children: state === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "dshBrowserCtlSpinner", "aria-hidden": "true" }),
        " ",
        t("updateApplying")
      ] }) : state === "done" ? t("updateApplyDone").replace("{v}", latest) : t("updateApplyBtn").replace("{v}", latest)
    }
  ) });
  if (state === "error" && errMsg) {
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: "dshBrowserCtlUpdateErrWrap", children: [
      btn,
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "dshBrowserCtlAboutUpdateErr", children: errMsg })
    ] });
  }
  return btn;
}

// src/client/cards/about.jsx
var import_react13 = require("react");

// src/client/legal.js
var LEGAL_VERSION = "2026-11-15";
var LEGAL_EFFECTIVE = "2026\u5E7411\u670815\u65E5";
var LEGAL_AGE = "\u672C\u5DE5\u5177\u4EC5\u9762\u5411\u5E74\u6EE1 18 \u5468\u5C81\u7684\u7528\u6237";
var LEGAL_TERMS = {
  id: "terms",
  title: "\u7528\u6237\u534F\u8BAE",
  subtitle: `\u66F4\u65B0\u751F\u6548\u65E5\u671F\uFF1A${LEGAL_EFFECTIVE}\u3002\u672C\u6B21\u4FEE\u8BA2\u96C6\u4E2D\u5F3A\u5316\u300C\u514D\u8D23\u58F0\u660E\u4E0E\u8D23\u4EFB\u9650\u5236\u300D\u5E76\u65B0\u589E\u300C\u8BBE\u5907\u5BC6\u94A5\u4E0E\u8BF7\u6C42\u7B7E\u540D\u300D\u673A\u5236\u8BF4\u660E\u3002\u51E1\u5B89\u88C5\u3001\u4F7F\u7528\u672C\u63D2\u4EF6/\u9762\u677F\uFF08DSH \u8FDC\u7A0B\u52A9\u624B\uFF09\uFF0C\u901A\u8FC7\u624B\u673A\u6216\u5916\u7F51\u6D4F\u89C8\u5668\u8FDC\u7A0B\u8BBF\u95EE\u672C\u673A DeepSeek \u52A9\u624B\u9762\u677F\uFF0C\u5373\u89C6\u4E3A\u60A8\u5DF2\u5B8C\u6574\u9605\u8BFB\u3001\u7406\u89E3\u5E76\u540C\u610F\u672C\u534F\u8BAE\u5168\u90E8\u6761\u6B3E\u3002`,
  sections: [
    {
      title: "\u9002\u7528\u5BF9\u8C61\u4E0E\u6548\u529B\u58F0\u660E",
      paragraphs: [
        "\u672C\u534F\u8BAE\u9002\u7528\u4E8E\u6240\u6709\u5B89\u88C5\u3001\u542F\u52A8\u3001\u4F7F\u7528\u672C\u63D2\u4EF6/\u9762\u677F\u3001\u901A\u8FC7\u624B\u673A\u6216\u5916\u7F51\u6D4F\u89C8\u5668\u8FDC\u7A0B\u8BBF\u95EE\u672C\u673A\u9762\u677F\u3001\u53C2\u4E0E\u6D4B\u8BD5\u4E0E\u53CD\u9988\u7684\u5168\u90E8\u7528\u6237\u3002",
        "\u51E1\u4E0B\u8F7D\u3001\u5B89\u88C5\u3001\u4F7F\u7528\u672C\u5DE5\u5177\u3001\u5F00\u542F\u96A7\u9053\u3001\u626B\u7801\u6216\u901A\u8FC7\u94FE\u63A5\u8FDC\u7A0B\u8BBF\u95EE\u672C\u673A\u9762\u677F\uFF0C\u5373\u89C6\u4E3A\u60A8\u5DF2\u5B8C\u6574\u9605\u8BFB\u3001\u9010\u6761\u7406\u89E3\u3001\u81EA\u613F\u540C\u610F\u5E76\u63A5\u53D7\u672C\u534F\u8BAE\u5168\u90E8\u6761\u6B3E\uFF0C\u5E76\u81EA\u884C\u627F\u62C5\u5168\u90E8\u4F7F\u7528\u98CE\u9669\u3002",
        "\u82E5\u60A8\u4E0D\u540C\u610F\u672C\u534F\u8BAE\u4EFB\u610F\u6761\u6B3E\uFF0C\u8BF7\u7ACB\u5373\u505C\u6B62\u5B89\u88C5\u4E0E\u4F7F\u7528\uFF0C\u5E76\u5378\u8F7D\u76F8\u5173\u63D2\u4EF6\u3001\u6E05\u9664\u672C\u5730\u914D\u7F6E\u3002",
        LEGAL_AGE + "\u3002\u60A8\u786E\u8BA4\u4F7F\u7528\u672C\u670D\u52A1\u65F6\u5DF2\u5E74\u6EE1 18 \u5468\u5C81\uFF1B\u82E5\u672A\u6EE1 18 \u5468\u5C81\uFF0C\u8BF7\u7ACB\u5373\u505C\u6B62\u4F7F\u7528\u3002"
      ]
    },
    {
      title: "\u7B2C\u4E00\u7AE0 \u603B\u5219",
      paragraphs: [
        "1.1 \u670D\u52A1\u5B9A\u4F4D\u3002\u672C\u5DE5\u5177\uFF08DSH \u8FDC\u7A0B\u52A9\u624B\uFF0C\u542B\u6D4F\u89C8\u5668\u63A7\u5236\u63D2\u4EF6\u3001\u672C\u673A\u95F8\u673A\u4E0E\u914D\u5957 App\uFF09\u4E3A\u4E2A\u4EBA\u72EC\u7ACB\u5F00\u53D1\u7684\u516C\u76CA\u514D\u8D39\u8FDC\u7A0B\u534F\u52A9\u5DE5\u5177\uFF0C\u7528\u4E8E\u628A\u672C\u673A DeepSeek \u52A9\u624B Web \u9762\u677F\u901A\u8FC7\u52A0\u5BC6\u96A7\u9053\u7A7F\u900F\u5230\u624B\u673A\u6216\u5916\u7F51\u6D4F\u89C8\u5668\uFF0C\u5B9E\u73B0\u968F\u65F6\u968F\u5730\u8FDC\u7A0B\u63A7\u5236\uFF0C\u65E0\u4EFB\u4F55\u5546\u4E1A\u4E0A\u67B6\u8D44\u8D28\u4E0E\u5F3A\u5236\u6536\u8D39\u3002\u5F00\u53D1\u65B9\u5DF2\u5C3D\u5F53\u524D\u6280\u672F\u6761\u4EF6\u4E0B\u6700\u5927\u9650\u5EA6\u7684\u52AA\u529B\u4FDD\u62A4\u7528\u6237\u6570\u636E\u4E0E\u672C\u670D\u52A1\u7CFB\u7EDF\u5B89\u5168\uFF1B\u5B98\u65B9\u670D\u52A1\u5668\u4EC5\u5145\u5F53\u8F6C\u53D1\u901A\u9053\uFF0C\u4E0D\u5B58\u50A8\u3001\u4E0D\u67E5\u770B\u3001\u4E0D\u5206\u6790\u60A8\u7684\u5BF9\u8BDD\u5185\u5BB9\u4E0E\u9762\u677F\u5185\u4E1A\u52A1\u6570\u636E\u3002",
        "1.2 \u4F7F\u7528\u524D\u63D0\u3002\u8FDC\u7A0B\u8BBF\u95EE\u4F9D\u8D56\u7F51\u7EDC\u3001frp \u96A7\u9053\u4E0E\u672C\u673A\u95F8\u673A\u670D\u52A1\uFF0C\u5B58\u5728\u6CE2\u52A8\u4E0E\u4E2D\u65AD\u7684\u53EF\u80FD\uFF1B\u4E0D\u540C\u7EC8\u7AEF\u3001\u6D4F\u89C8\u5668\u53EF\u7528\u529F\u80FD\u53EF\u80FD\u5B58\u5728\u5DEE\u5F02\uFF0C\u4EE5\u60A8\u5B9E\u9645\u4F7F\u7528\u7684\u7248\u672C\u754C\u9762\u4E3A\u51C6\u3002",
        "1.3 \u534F\u8BAE\u7EC4\u6210\u3002\u672C\u300A\u7528\u6237\u534F\u8BAE\u300B\u4E0E\u300A\u9690\u79C1\u653F\u7B56\u300B\u5171\u540C\u6784\u6210\u5B8C\u6574\u7EA6\u5B9A\uFF1B\u5C31\u7279\u5B9A\u529F\u80FD\uFF08\u5982 2FA\u3001\u914D\u5BF9\u3001\u9ED1\u540D\u5355\u3001\u63A8\u9001\u3001\u5DE5\u5355\u8BCA\u65AD\u65E5\u5FD7\u3001\u5B98\u7F51\u8D26\u53F7\u4E0E\u7B7E\u5230\u65F6\u957F\u3001\u8BBE\u5907\u6388\u6743\uFF09\u53E6\u6709\u9875\u9762\u63D0\u793A\u6216\u89C4\u5219\u7684\uFF0C\u6784\u6210\u8865\u5145\u7EA6\u5B9A\uFF0C\u8865\u5145\u7EA6\u5B9A\u4E0E\u672C\u534F\u8BAE\u51B2\u7A81\u65F6\uFF0C\u5C31\u8BE5\u529F\u80FD\u4EE5\u66F4\u5177\u4F53\u7684\u8865\u5145\u7EA6\u5B9A\u4E3A\u51C6\u3002",
        "1.4 \u6536\u8D39\u8BF4\u660E\u3002\u672C\u670D\u52A1\u76EE\u524D\u5B8C\u5168\u514D\u8D39\uFF0C\u4E0D\u6536\u53D6\u4EFB\u4F55\u8D39\u7528\uFF0C\u4E5F\u6CA1\u6709\u4ED8\u8D39\u89E3\u9501\u3001\u4F1A\u5458\u8BA2\u9605\u6216\u5185\u8D2D\u9879\u76EE\u3002\u82E5\u672A\u6765\u56E0\u8FD0\u8425\u6210\u672C\u8C03\u6574\u6536\u8D39\u65B9\u5F0F\uFF0C\u6211\u4EEC\u4F1A\u63D0\u524D\u5728\u9762\u677F\u5185\u663E\u8457\u516C\u544A\u5E76\u5F81\u5F97\u60A8\u7684\u540C\u610F\uFF0C\u60A8\u53EF\u4EE5\u5728\u6B64\u4E4B\u524D\u7EE7\u7EED\u514D\u8D39\u4F7F\u7528\u6216\u505C\u6B62\u4F7F\u7528\u3002",
        "1.5 \u670D\u52A1\u53D8\u66F4\u3001\u6682\u505C\u4E0E\u7EC8\u6B62\u3002\u672C\u5DE5\u5177\u4E3A\u4E2A\u4EBA\u72EC\u7ACB\u5F00\u53D1\uFF0C\u5F00\u53D1\u65B9\u6709\u6743\u5728\u4EFB\u4F55\u65F6\u95F4\u3001\u4EE5\u4EFB\u4F55\u7406\u7531\u8C03\u6574\u3001\u6682\u505C\u3001\u9650\u5236\u6216\u7EC8\u6B62\u5168\u90E8\u6216\u90E8\u5206\u529F\u80FD\u4E43\u81F3\u6574\u4F53\u670D\u52A1\uFF0C\u65E0\u9700\u4E8B\u5148\u5F81\u6C42\u60A8\u7684\u540C\u610F\uFF1B\u9664\u6D89\u53CA\u6574\u4F53\u505C\u6B62\u65F6\u5C3D\u53EF\u80FD\u63D0\u524D\u5728\u5B98\u7F51\u4E0E\u9762\u677F\u516C\u544A\u5916\uFF0C\u4E0D\u4F5C\u5176\u4ED6\u901A\u77E5\u627F\u8BFA\u3002\u4E0A\u8FF0\u53D8\u66F4\u3001\u6682\u505C\u6216\u7EC8\u6B62\u4E0D\u6784\u6210\u8FDD\u7EA6\uFF0C\u5F00\u53D1\u65B9\u5728\u9002\u7528\u6CD5\u5F8B\u5141\u8BB8\u7684\u6700\u5927\u8303\u56F4\u5185\u4E0D\u56E0\u6B64\u627F\u62C5\u4EFB\u4F55\u8D23\u4EFB\uFF08\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\u65F6\u957F\u4F59\u989D\u65E0\u6CD5\u7EE7\u7EED\u4F7F\u7528\uFF09\u3002\u81EA\u5EFA\u90E8\u7F72\u4E0D\u53D7\u5B98\u65B9\u6258\u7BA1\u670D\u52A1\u8C03\u6574\u7684\u5F71\u54CD\uFF1B\u672C\u670D\u52A1\u514D\u8D39\uFF0C\u4E0D\u627F\u8BFA\u4EFB\u4F55\u670D\u52A1\u5E74\u9650\u3002"
      ]
    },
    {
      title: "\u7B2C\u4E8C\u7AE0 \u670D\u52A1\u4F7F\u7528\u89C4\u8303\u4E0E\u7528\u6237\u4E49\u52A1",
      paragraphs: [
        "2.1 \u6388\u6743\u8BBF\u95EE\u3002\u60A8\u4EC5\u53EF\u4E3A\u672C\u4EBA\u6216\u7ECF\u60A8\u660E\u786E\u6388\u6743\u7684\u8BBE\u5907\u3001\u4EBA\u5458\u63D0\u4F9B\u8FDC\u7A0B\u8BBF\u95EE\u3002\u4E25\u7981\u5C06\u914D\u5BF9\u4E8C\u7EF4\u7801\u3001\u5F15\u5BFC\u94FE\u63A5\u3001\u767B\u5F55 Cookie\u3001\u8BBF\u95EE\u53E3\u4EE4\u5206\u4EAB\u3001\u8F6C\u552E\u7ED9\u672A\u6388\u6743\u7B2C\u4E09\u65B9\u3002",
        "2.2 \u7981\u6B62\u884C\u4E3A\u3002\u4E25\u7981\u5BF9\u670D\u52A1\u5B9E\u65BD\u53CD\u5411\u4EE3\u7406\u3001\u6293\u5305\u5C01\u88C5\u3001\u7834\u89E3\u6216\u7ED5\u8FC7\u9274\u6743\u4E0E\u7B7E\u540D\u6821\u9A8C\u3001\u6076\u610F\u9AD8\u9891\u8BF7\u6C42\u3001\u6F0F\u6D1E\u626B\u63CF\u3001\u6D41\u91CF\u653B\u51FB\u3001\u6279\u91CF\u722C\u53D6\u7B49\u7834\u574F\u6027\u884C\u4E3A\uFF1B\u4E25\u7981\u5229\u7528\u672C\u5DE5\u5177\u4ECE\u4E8B\u4EFB\u4F55\u8FDD\u6CD5\u8FDD\u89C4\u6D3B\u52A8\u3002",
        "2.3 \u51ED\u636E\u4FDD\u7BA1\u3002\u914D\u5BF9\u94FE\u63A5\u3001\u5F15\u5BFC\u94FE\u63A5\u3001Cookie \u4E0E\u52A8\u6001\u9A8C\u8BC1\u7801\u5C5E\u4E8E\u654F\u611F\u51ED\u636E\uFF0C\u8BF7\u59A5\u5584\u4FDD\u7BA1\uFF0C\u52FF\u622A\u56FE\u957F\u671F\u7559\u6863\u3001\u52FF\u53D1\u516C\u5F00\u7FA4\u3002\u56E0\u60A8\u6CC4\u9732\u51ED\u636E\u5BFC\u81F4\u7684\u672A\u6388\u6743\u8BBF\u95EE\uFF0C\u7531\u60A8\u81EA\u884C\u627F\u62C5\u3002",
        "2.4 2FA \u4F7F\u7528\u3002\u672C\u670D\u52A1\u5B58\u5728\u4E24\u7C7B\u4E24\u6B65\u9A8C\u8BC1\uFF1A\u9762\u677F/\u95F8\u673A\u4E24\u6B65\u9A8C\u8BC1\u2014\u2014\u5F00\u542F\u540E\u65B0\u8BBE\u5907\u9996\u6B21\u8FDE\u63A5\u9700\u8F93\u5165\u9A8C\u8BC1\u5668 6 \u4F4D\u52A8\u6001\u7801\uFF0C\u9A8C\u8BC1\u901A\u8FC7\u7684\u8BBE\u5907 30 \u5929\u5185\u514D\u91CD\u590D\u9A8C\u8BC1\uFF1B\u5B98\u7F51\u8D26\u53F7\u4E24\u6B65\u9A8C\u8BC1\u2014\u2014\u5728\u4E2A\u4EBA\u4E2D\u5FC3\u5F00\u542F\u540E\uFF0C\u6BCF\u6B21\u767B\u5F55\u5B98\u7F51\u8D26\u53F7\u5747\u9700\u8F93\u5165\u52A8\u6001\u7801\u6216\u5907\u7528\u7801\u3002\u8BF7\u52FF\u5C06\u52A8\u6001\u7801\u4E0E\u5907\u7528\u7801\u544A\u77E5\u4ED6\u4EBA\uFF1B\u5F00\u542F/\u5173\u95ED\u4E24\u6B65\u9A8C\u8BC1\u4F1A\u4F7F\u539F\u6709\u767B\u5F55\u4EE4\u724C\u7ACB\u5373\u5931\u6548\uFF0C\u9700\u91CD\u65B0\u767B\u5F55\u3002",
        "2.5 \u5185\u5BB9\u5408\u89C4\u3002\u672C\u5DE5\u5177\u7528\u4E8E\u8BBF\u95EE AI \u52A9\u624B\u9762\u677F\uFF0C\u8BF7\u52FF\u5229\u7528\u5176\u751F\u6210\u3001\u4F20\u64AD\u8FDD\u6CD5\u8FDD\u89C4\u3001\u66B4\u529B\u3001\u8272\u60C5\u3001\u4FB5\u6743\u6216\u635F\u5BB3\u4ED6\u4EBA\u6743\u76CA\u7684\u5185\u5BB9\u3002",
        "2.6 \u5F00\u6E90\u4E0E\u975E\u5546\u4E1A\u3002\u672C\u9879\u76EE\u9075\u5FAA\u5F00\u6E90\u8BB8\u53EF\u53D1\u5E03\uFF0C\u5141\u8BB8\u4E2A\u4EBA\u5B66\u4E60\u3001\u975E\u5546\u7528\u4F7F\u7528\u4E0E\u5408\u89C4\u4E8C\u521B\uFF1B\u7981\u6B62\u4E00\u5207\u672A\u7ECF\u6388\u6743\u7684\u5546\u4E1A\u7528\u9014\u3001\u62B9\u9664\u7F72\u540D\u7684\u4E8C\u6B21\u5206\u53D1\u4E0E\u8F6C\u552E\u3002",
        "2.7 \u5B98\u7F51\u8D26\u53F7\u6CE8\u518C\u4E0E\u4F7F\u7528\u3002\u6CE8\u518C\u9700\u63D0\u4F9B\u53EF\u7528\u90AE\u7BB1\u5E76\u5B8C\u6210\u9A8C\u8BC1\u7801\u9A8C\u8BC1\uFF1B\u4E3A\u4FDD\u8BC1\u8D26\u53F7\u8D28\u91CF\uFF0C\u4EC5\u63A5\u53D7\u5E38\u89C1\u4E3B\u6D41\u90AE\u7BB1\u57DF\u540D\uFF0C\u6682\u4E0D\u652F\u6301\u4E34\u65F6/\u4E00\u6B21\u6027\u90AE\u7BB1\u3002\u8BF7\u52FF\u6279\u91CF\u6CE8\u518C\u3001\u8F6C\u8BA9\u6216\u51FA\u501F\u8D26\u53F7\uFF0C\u8BF7\u52FF\u4F7F\u7528\u4ED6\u4EBA\u90AE\u7BB1\u6CE8\u518C\u3002\u60A8\u5E94\u59A5\u5584\u4FDD\u7BA1\u8D26\u53F7\u5BC6\u7801\uFF1B\u9057\u5FD8\u5BC6\u7801\u53EF\u901A\u8FC7\u90AE\u7BB1\u9A8C\u8BC1\u7801\u767B\u5F55\u6216\u8054\u7CFB\u7BA1\u7406\u5458\u5904\u7406\u3002\u8FDD\u89C4\u6CE8\u518C\u3001\u5237\u63A5\u53E3\u6216\u6EE5\u7528\u8D26\u53F7\u7684\uFF0C\u6211\u4EEC\u6709\u6743\u62D2\u7EDD\u6CE8\u518C\u3001\u505C\u7528\u6216\u5220\u9664\u8D26\u53F7\u3002",
        "2.8 \u65F6\u957F\u4F59\u989D\u4E0E\u7B7E\u5230\u3002\u5B98\u65B9\u6258\u7BA1\u6A21\u5F0F\u4E0B\uFF0C\u8FDC\u7A0B\u4F7F\u7528\u65F6\u957F\u6D88\u8017\u8D26\u53F7\u7684\u65F6\u957F\u4F59\u989D\uFF1B\u60A8\u53EF\u901A\u8FC7\u6BCF\u65E5\u7B7E\u5230\u7B49\u65B9\u5F0F\u83B7\u5F97\u65F6\u957F\uFF0C\u4F59\u989D\u7528\u5C3D\u65F6\u5C06\u65E0\u6CD5\u5EFA\u7ACB\u65B0\u7684\u8FDC\u7A0B\u8FDE\u63A5\u3002\u65F6\u957F\u4F59\u989D\u4E0D\u5177\u6709\u4EFB\u4F55\u8D27\u5E01\u4EF7\u503C\uFF0C\u4E0D\u53EF\u8F6C\u8BA9\u3001\u4E0D\u53EF\u63D0\u73B0\u3001\u4E0D\u53EF\u7EE7\u627F\u3002\u5F00\u53D1\u65B9\u6709\u6743\u6839\u636E\u516C\u5E73\u4F7F\u7528\u9700\u8981\u8C03\u6574\u65F6\u957F\u7684\u83B7\u53D6\u4E0E\u6D88\u8017\u89C4\u5219\uFF0C\u5E76\u5BF9\u5F02\u5E38\u83B7\u53D6\u7684\u65F6\u957F\u8FDB\u884C\u6263\u51CF\u3001\u6E05\u96F6\u6216\u56DE\u6536\uFF1B\u4E0A\u8FF0\u8C03\u6574\u4E0D\u6784\u6210\u8FDD\u7EA6\uFF0C\u5F00\u53D1\u65B9\u4E0D\u56E0\u6B64\u627F\u62C5\u4EFB\u4F55\u8D23\u4EFB\u3002\u8BF7\u52FF\u4EE5\u811A\u672C\u3001\u591A\u8D26\u53F7\u7B49\u65B9\u5F0F\u5237\u53D6\u6216\u56E4\u79EF\u65F6\u957F\uFF1B\u7BA1\u7406\u5458\u6709\u6743\u5BF9\u6EE5\u7528\u8D26\u53F7\u91C7\u53D6\u9650\u5236\u63AA\u65BD\u3002",
        "2.9 App \u5B89\u88C5\u4E0E\u66F4\u65B0\u3002\u914D\u5957 App \u4EE5 APK \u5F62\u5F0F\u901A\u8FC7\u5B98\u7F51\u76F4\u94FE\u6216\u5B98\u65B9 GitHub \u4ED3\u5E93\u5206\u53D1\uFF0C\u672A\u7ECF\u4EFB\u4F55\u5E94\u7528\u5546\u5E97\u4E0A\u67B6\u3002\u8BF7\u4EC5\u4ECE\u4E0A\u8FF0\u5B98\u65B9\u6E20\u9053\u4E0B\u8F7D\u5B89\u88C5\uFF0C\u5E76\u5728\u5B89\u88C5\u524D\u81EA\u884C\u6838\u9A8C\u6765\u6E90\uFF1BApp \u5185\u66F4\u65B0\u68C0\u67E5\u4EC5\u67E5\u8BE2\u7248\u672C\u4FE1\u606F\uFF0C\u66F4\u65B0\u4E0E\u5426\u7531\u60A8\u81EA\u884C\u51B3\u5B9A\u3002",
        "2.10 \u5DE5\u5355\u4E0E\u8BCA\u65AD\u65E5\u5FD7\u63D0\u4EA4\u3002\u5728\u5DE5\u5355\u4E2D\u9644\u5E26\u8BCA\u65AD\u65E5\u5FD7\u6216\u81EA\u884C\u4E0A\u4F20\u65E5\u5FD7\u6587\u4EF6\uFF0C\u5C5E\u4E8E\u5B8C\u5168\u81EA\u613F\u7684\u884C\u4E3A\uFF0C\u4E14\u5FC5\u987B\u5148\u7531\u60A8\u5728\u9884\u89C8\u754C\u9762\u67E5\u770B\u5B8C\u6574\u5185\u5BB9\u3001\u52FE\u9009\u786E\u8BA4\u300C\u4E0D\u542B\u654F\u611F\u4FE1\u606F\u300D\u540E\u624D\u4F1A\u63D0\u4EA4\u4E0A\u4F20\uFF1B\u4E0D\u9644\u5E26\u4E0D\u5F71\u54CD\u5DE5\u5355\u7684\u6B63\u5E38\u5904\u7406\u3002\u8BF7\u60A8\u5728\u786E\u8BA4\u524D\u81EA\u884C\u6838\u5BF9\u5185\u5BB9\u4E2D\u4E0D\u542B\u4ED6\u4EBA\u4E2A\u4EBA\u4FE1\u606F\u3001\u5546\u4E1A\u673A\u5BC6\u3001\u8D26\u53F7\u5BC6\u7801\u3001API \u5BC6\u94A5\u7B49\u654F\u611F\u4FE1\u606F\uFF1A\u8BCA\u65AD\u65E5\u5FD7\u4E2D\u7684\u5E38\u89C1\u654F\u611F\u5B57\u6BB5\uFF08\u8BBF\u95EE\u4EE4\u724C\u3001Cookie\u3001\u7B7E\u540D\u3001\u5BC6\u7801\u5B57\u6BB5\u3001IP \u672B\u4E24\u6BB5\u3001\u8D26\u53F7\u76EE\u5F55\u8DEF\u5F84\u7B49\uFF09\u7531\u7CFB\u7EDF\u81EA\u52A8\u6253\u7801\uFF0C\u4F46\u81EA\u52A8\u6253\u7801\u65E0\u6CD5\u4FDD\u8BC1\u8986\u76D6\u6240\u6709\u60C5\u5F62\uFF0C\u60A8\u81EA\u884C\u6311\u9009\u4E0A\u4F20\u7684\u65E5\u5FD7\u6587\u4EF6\u66F4\u662F\u539F\u6837\u4E0A\u4F20\u3001\u4E0D\u505A\u6253\u7801\u3002\u56E0\u60A8\u4E0A\u4F20\u5185\u5BB9\u5F15\u53D1\u7684\u4FE1\u606F\u6CC4\u9732\u3001\u4FB5\u6743\u6216\u5408\u89C4\u98CE\u9669\u7531\u60A8\u81EA\u884C\u627F\u62C5\uFF1B\u60A8\u4E0A\u4F20\u5373\u89C6\u4E3A\u6388\u6743\u6211\u4EEC\u5728\u8BE5\u5DE5\u5355\u6545\u969C\u6392\u67E5\u7684\u5FC5\u8981\u8303\u56F4\u5185\u67E5\u770B\u3001\u5B58\u50A8\u4E0E\u5904\u7406\u8BE5\u5185\u5BB9\uFF0C\u5E76\u5728\u5DE5\u5355\u5220\u9664\u65F6\u4E00\u5E76\u5220\u9664\u3002",
        "2.11 \u64CD\u4F5C\u540E\u679C\u81EA\u8D1F\u3002\u901A\u8FC7\u60A8\u7684\u8FDC\u7A0B\u4F1A\u8BDD\u3001\u914D\u5BF9\u6388\u6743\u6216\u88AB\u63A7\u8BBE\u5907\u5728\u672C\u673A\u4E0A\u6267\u884C\u7684\u4E00\u5207\u64CD\u4F5C\uFF08\u65E0\u8BBA\u7531\u60A8\u672C\u4EBA\u8FD8\u662F\u7ECF\u60A8\u6388\u6743\u7684\u4EBA\u5458\u53D1\u8D77\uFF09\uFF0C\u53CA\u5176\u5BF9\u60A8\u7684\u8BBE\u5907\u3001\u6570\u636E\u3001\u7B2C\u4E09\u65B9\u6216 DSH \u670D\u52A1\u4EA7\u751F\u7684\u4E00\u5207\u540E\u679C\uFF0C\u5747\u7531\u60A8\u81EA\u884C\u627F\u62C5\uFF1B\u5F00\u53D1\u65B9\u4E0D\u53C2\u4E0E\u3001\u4E0D\u4ECB\u5165\uFF0C\u4E5F\u65E0\u6CD5\u63A7\u5236\u8BE5\u7B49\u64CD\u4F5C\u3002",
        "2.12 \u8FDD\u7EA6\u8D54\u507F\u4E0E\u4F7F\u514D\u8D23\u3002\u56E0\u60A8\u8FDD\u53CD\u672C\u534F\u8BAE\u3001\u6EE5\u7528\u670D\u52A1\u3001\u6CC4\u9732\u51ED\u636E\u6216\u4ECE\u4E8B\u8FDD\u6CD5\u6D3B\u52A8\uFF0C\u5BFC\u81F4\u5F00\u53D1\u65B9\u88AB\u7B2C\u4E09\u65B9\u7D22\u8D54\u3001\u6295\u8BC9\u3001\u884C\u653F\u8C03\u67E5\u6216\u5904\u7F5A\uFF0C\u6216\u5BFC\u81F4\u5F00\u53D1\u65B9\u4EA7\u751F\u4EFB\u4F55\u635F\u5931\u3001\u652F\u51FA\u4E0E\u8D39\u7528\u7684\uFF0C\u7531\u60A8\u8D1F\u8D23\u89E3\u51B3\u5E76\u5168\u989D\u8D54\u507F\uFF0C\u4F7F\u5F00\u53D1\u65B9\u514D\u53D7\u635F\u5BB3\u3002"
      ]
    },
    {
      title: "\u7B2C\u4E09\u7AE0 \u5B89\u5168\u673A\u5236\u4E0E\u8BBE\u5907\u7BA1\u7406",
      paragraphs: [
        "3.1 \u8EAB\u4EFD\u9A8C\u8BC1\u3002\u9762\u677F\u8BBF\u95EE\u91C7\u7528\u300C\u8BBE\u5907\u4FE1\u4EFB + \u53EF\u9009 TOTP \u4E24\u6B65\u9A8C\u8BC1\uFF08RFC 6238\uFF09\u300D\u673A\u5236\uFF0C\u8FDE\u9519 5 \u6B21\u51BB\u7ED3 15 \u5206\u949F\uFF0C\u540C\u7801\u9632\u91CD\u653E\uFF1B\u5B98\u7F51\u8D26\u53F7\u767B\u5F55\u652F\u6301\u5BC6\u7801\u3001\u90AE\u7BB1\u9A8C\u8BC1\u7801\u4E0E\uFF08\u5F00\u542F\u540E\u7684\uFF09\u4E24\u6B65\u9A8C\u8BC1\uFF0C\u591A\u6B21\u5931\u8D25\u5C06\u89E6\u53D1\u4E34\u65F6\u9501\u5B9A\u6216 IP \u7EA7\u9650\u901F\u3002",
        "3.2 \u4F1A\u8BDD\u4E0E\u51ED\u636E\u3002\u9762\u677F\u9A8C\u8BC1\u901A\u8FC7\u540E\u7B7E\u53D1\u6709\u6548\u671F\u4E3A 30 \u5929\u7684\u8BB0\u5FC6 Cookie\uFF0C\u7528\u4E8E\u514D\u9A8C\u8BC1\u76F4\u8FDE\uFF1B\u5B98\u7F51\u767B\u5F55\u4EE4\u724C\u6709\u6548\u671F\u540C\u4E3A 30 \u5929\uFF0C\u5F00\u542F/\u5173\u95ED\u4E24\u6B65\u9A8C\u8BC1\u6216\u7BA1\u7406\u5458\u64A4\u9500\u540E\u7ACB\u5373\u5931\u6548\u3002\u60A8\u53EF\u968F\u65F6\u901A\u8FC7\u9762\u677F\u300C\u8E22\u4E0B\u7EBF\u300D\u6216\u300C\u5168\u90E8\u8E22\u4E0B\u7EBF\u300D\u4F7F\u6307\u5B9A\u8BBE\u5907\u6216\u5168\u90E8\u8BBE\u5907\u91CD\u65B0\u8BA4\u8BC1\u3002",
        "3.3 \u8BBE\u5907\u767B\u8BB0\u3002\u9A8C\u8BC1\u901A\u8FC7\u7684\u8BBE\u5907\u4F1A\u8BB0\u5F55\u533F\u540D\u8BBE\u5907\u6807\u8BC6\u3001IP\u3001User-Agent \u7B49\u5FC5\u8981\u4FE1\u606F\u7528\u4E8E\u4F1A\u8BDD\u4E0E\u98CE\u63A7\uFF1B\u60A8\u53EF\u5728\u9762\u677F\u4E0E\u4E2A\u4EBA\u4E2D\u5FC3\u67E5\u770B\u5728\u7EBF/\u5386\u53F2\u8BBE\u5907\uFF0C\u5E76\u62C9\u9ED1\u6307\u5B9A IP\u3002",
        "3.4 \u5F15\u5BFC\u94FE\u63A5\u3002\u4E3A\u65E0 App \u8BBE\u5907\u751F\u6210\u7684\u5F15\u5BFC\u94FE\u63A5\u4E3A\u660E\u6587\uFF0C\u8BF7\u5728\u6709\u6548\u671F\u5185\u4F7F\u7528\u5E76\u6309\u9700\u63A7\u5236\u6709\u6548\u671F\uFF1B\u4ECB\u610F\u98CE\u9669\u7684\u8BF7\u7528\u540E\u8F6E\u6362\u3002",
        "3.5 \u8BBE\u5907\u6388\u6743\u3002\u63D2\u4EF6\u767B\u5F55\u652F\u6301\u8BBE\u5907\u6388\u6743\u6D41\u7A0B\uFF08RFC 8628\uFF09\uFF1A\u63D2\u4EF6\u5411\u60A8\u5C55\u793A\u4E00\u6B21\u6027\u6388\u6743\u7801\uFF0C\u60A8\u9700\u5728\u6D4F\u89C8\u5668\u4E2D\u767B\u5F55\u5B98\u7F51\u8D26\u53F7\u5E76\u4EB2\u81EA\u70B9\u51FB\u300C\u786E\u8BA4\u6388\u6743\u300D\u540E\u65B9\u53EF\u751F\u6548\uFF1B\u6388\u6743\u7801 15 \u5206\u949F\u6709\u6548\u3001\u5355\u6B21\u4F7F\u7528\uFF0C\u672A\u786E\u8BA4\u4E0D\u4F1A\u4EA7\u751F\u4EFB\u4F55\u767B\u5F55\u3002\u8BF7\u52FF\u5728\u975E\u672C\u4EBA\u64CD\u4F5C\u7684\u6388\u6743\u9875\u9762\u4E0A\u70B9\u51FB\u786E\u8BA4\u3002",
        "3.6 \u8BBE\u5907\u5BC6\u94A5\u4E0E\u8BF7\u6C42\u7B7E\u540D\u3002\u6BCF\u53F0\u53D7\u4FE1\u8BBE\u5907\uFF08\u6D4F\u89C8\u5668/App\uFF09\u5728\u914D\u5BF9\u6216\u9A8C\u8BC1\u901A\u8FC7\u65F6\uFF0C\u7531\u60A8\u7684\u672C\u673A\u95F8\u673A\u751F\u6210\u72EC\u6709\u7684\u8BBE\u5907\u5BC6\u94A5\u3002\u8BE5\u5BC6\u94A5\u4EC5\u4FDD\u5B58\u5728\u60A8\u7684\u8BBE\u5907\uFF08\u6D4F\u89C8\u5668\u672C\u5730\u5B58\u50A8\u6216 App \u79C1\u6709\u5B58\u50A8\uFF09\u4E0E\u60A8\u672C\u673A\uFF0C\u5B98\u65B9\u670D\u52A1\u5668\u4E0D\u5B58\u50A8\u8BE5\u5BC6\u94A5\uFF1B\u53D7\u4FE1\u8BBE\u5907\u7684\u9762\u677F\u8BF7\u6C42\u91C7\u7528\u57FA\u4E8E\u8BE5\u5BC6\u94A5\u7684 HMAC-SHA256 \u7B7E\u540D\u6821\u9A8C\uFF0C\u5E76\u9644\u5E26\u65F6\u95F4\u7A97\u4E0E\u9632\u91CD\u653E\u673A\u5236\uFF0C\u7531\u60A8\u7684\u672C\u673A\u95F8\u673A\u5B8C\u6210\u6821\u9A8C\u3002\u56E0\u6B64\uFF0C\u5373\u4FBF\u5B98\u65B9\u670D\u52A1\u5668\u53D1\u751F\u6570\u636E\u6CC4\u9732\u6216\u88AB\u653B\u9677\uFF0C\u653B\u51FB\u8005\u4E5F\u65E0\u6CD5\u636E\u5176\u4F2A\u9020\u60A8\u7684\u8BBE\u5907\u8BF7\u6C42\u3001\u5192\u5145\u60A8\u7684\u8BBE\u5907\u6216\u91CD\u653E\u60A8\u7684\u4F1A\u8BDD\u3002"
      ]
    },
    {
      title: "\u7B2C\u56DB\u7AE0 \u514D\u8D23\u58F0\u660E\u4E0E\u8D23\u4EFB\u9650\u5236",
      paragraphs: [
        "4.1 \u6309\u73B0\u72B6\u63D0\u4F9B\u3001\u4E0D\u4F5C\u62C5\u4FDD\u3002\u672C\u5DE5\u5177\u4EE5\u300C\u73B0\u72B6\u300D\u4E0E\u300C\u73B0\u6709\u53EF\u7528\u6027\u300D\u4E3A\u539F\u5219\u63D0\u4F9B\u3002\u5728\u9002\u7528\u6CD5\u5F8B\u5141\u8BB8\u7684\u6700\u5927\u8303\u56F4\u5185\uFF0C\u5F00\u53D1\u65B9\u4E0D\u5BF9\u672C\u5DE5\u5177\u4F5C\u4EFB\u4F55\u5F62\u5F0F\u7684\u660E\u793A\u6216\u9ED8\u793A\u62C5\u4FDD\uFF0C\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\uFF1A\u4E0D\u4E2D\u65AD\u3001\u65E0\u9519\u8BEF\u3001\u7EDD\u5BF9\u5B89\u5168\u3001\u6570\u636E\u4E0D\u4E22\u5931\u3001\u5168\u7EC8\u7AEF\u517C\u5BB9\u3001\u529F\u80FD\u6301\u7EED\u4E0D\u53D8\u6216\u9002\u5408\u7279\u5B9A\u7528\u9014\u3002\u60A8\u4F7F\u7528\u672C\u5DE5\u5177\u7684\u4E00\u5207\u98CE\u9669\u7531\u60A8\u81EA\u884C\u627F\u62C5\u3002",
        "4.2 \u4F7F\u7528\u98CE\u9669\u81EA\u62C5\u3002\u8FDC\u7A0B\u8BBF\u95EE\u5929\u7136\u5B58\u5728\u5B89\u5168\u98CE\u9669\uFF08\u5982\u8BBE\u5907\u88AB\u4ED6\u4EBA\u7269\u7406\u63A5\u89E6\u3001\u672C\u673A\u7CFB\u7EDF\u88AB\u5165\u4FB5\u3001\u7F51\u7EDC\u88AB\u76D1\u542C\u3001\u51ED\u636E\u6CC4\u9732\u3001\u8BEF\u64CD\u4F5C\u3001DSH \u6216\u7B2C\u4E09\u65B9\u8F6F\u4EF6\u81EA\u8EAB\u6F0F\u6D1E\u7B49\uFF09\u3002\u8BF7\u60A8\u81EA\u884C\u786E\u4FDD\u672C\u673A\u4E0E\u8BBE\u5907\u7684\u7CFB\u7EDF\u3001\u5BC6\u7801\u3001\u5BC6\u94A5\u5B89\u5168\uFF1B\u51E1\u56E0\u672C\u673A\u3001\u8BBE\u5907\u3001\u8D26\u53F7\u3001\u51ED\u636E\u6216 DSH \u670D\u52A1\u5931\u5B88\u5BFC\u81F4\u7684\u4EFB\u4F55\u635F\u5931\uFF0C\u5747\u7531\u60A8\u81EA\u884C\u627F\u62C5\uFF0C\u4E0E\u5F00\u53D1\u65B9\u65E0\u5173\u3002",
        "4.3 \u5B89\u5168\u4E8B\u4EF6\u514D\u8D23\u3002\u5F00\u53D1\u65B9\u5DF2\u5C3D\u5F53\u524D\u6280\u672F\u6761\u4EF6\u4E0B\u6700\u5927\u9650\u5EA6\u7684\u52AA\u529B\u4FDD\u62A4\u7528\u6237\u6570\u636E\u4E0E\u670D\u52A1\u5668\u5B89\u5168\uFF08\u5305\u62EC\u4F20\u8F93\u52A0\u5BC6\u3001\u8BBF\u95EE\u9274\u6743\u3001\u6700\u5C0F\u5316\u6536\u96C6\u3001\u65E5\u5FD7\u8131\u654F\u3001\u6743\u9650\u6536\u655B\u4E0E\u6301\u7EED\u7684\u5B89\u5168\u52A0\u56FA\uFF09\uFF0C\u4F46\u4E92\u8054\u7F51\u73AF\u5883\u4E0D\u5B58\u5728\u7EDD\u5BF9\u5B89\u5168\uFF0C\u4EFB\u4F55\u9632\u62A4\u63AA\u65BD\u90FD\u53EF\u80FD\u88AB\u7ED5\u8FC7\u3002\u56E0\u9ED1\u5BA2\u653B\u51FB\u3001\u7F51\u7EDC\u5165\u4FB5\u3001\u670D\u52A1\u5668\u88AB\u653B\u9677\u3001\u75C5\u6BD2\u6216\u6076\u610F\u7A0B\u5E8F\u3001\u7CFB\u7EDF\u6216\u786C\u4EF6\u6545\u969C\u3001\u7B2C\u4E09\u65B9\u670D\u52A1\u6545\u969C\u3001\u7535\u4FE1\u6216\u7535\u529B\u4E2D\u65AD\u3001\u653F\u5E9C\u884C\u4E3A\u3001\u6CD5\u5F8B\u6CD5\u89C4\u4E0E\u653F\u7B56\u53D8\u5316\u3001\u4E0D\u53EF\u6297\u529B\u6216\u5176\u4ED6\u610F\u5916\u539F\u56E0\uFF0C\u5BFC\u81F4\u6570\u636E\u6CC4\u9732\u3001\u6570\u636E\u4E22\u5931\u3001\u51ED\u636E\u6CC4\u9732\u3001\u670D\u52A1\u4E2D\u65AD\u6216\u4EFB\u4F55\u5176\u4ED6\u635F\u5BB3\u7684\uFF0C\u5728\u9002\u7528\u6CD5\u5F8B\u5141\u8BB8\u7684\u6700\u5927\u8303\u56F4\u5185\uFF0C\u5F00\u53D1\u65B9\u4E0D\u627F\u62C5\u4EFB\u4F55\u8D54\u507F\u8D23\u4EFB\uFF1B\u5F00\u53D1\u65B9\u5C06\u5C3D\u529B\u5904\u7F6E\uFF0C\u5E76\u6309\u6CD5\u5F8B\u6CD5\u89C4\u8981\u6C42\u53CA\u65F6\u901A\u77E5\u53D7\u5F71\u54CD\u7528\u6237\u3002",
        "4.4 \u6570\u636E\u5907\u4EFD\u4E0E\u4E22\u5931\u514D\u8D23\u3002\u60A8\u7684\u6570\u636E\uFF08\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\u4F1A\u8BDD\u3001\u8BBE\u5907\u8BB0\u5F55\u3001\u65F6\u957F\u4F59\u989D\u3001\u5DE5\u5355\u3001\u6D88\u606F\uFF09\u7531\u60A8\u81EA\u884C\u8D1F\u8D23\u5907\u4EFD\u4E0E\u4FDD\u5168\u3002\u56E0\u670D\u52A1\u4E2D\u65AD\u3001\u6545\u969C\u3001\u505C\u6B62\u3001\u8D26\u53F7\u5904\u7F6E\u3001\u6E05\u7406\u6216\u4EFB\u4F55\u5B89\u5168\u4E8B\u4EF6\u5BFC\u81F4\u6570\u636E\u65E0\u6CD5\u8BBF\u95EE\u3001\u4E22\u5931\u3001\u635F\u574F\u6216\u88AB\u6E05\u9664\u7684\uFF0C\u5F00\u53D1\u65B9\u4E0D\u627F\u62C5\u8D54\u507F\u3001\u6062\u590D\u6216\u8FC1\u79FB\u4E49\u52A1\uFF1B\u5F00\u53D1\u65B9\u5B9E\u65BD\u7684\u4EFB\u4F55\u6062\u590D\u5C1D\u8BD5\u5747\u5C5E\u5C3D\u529B\u800C\u4E3A\u7684\u534F\u52A9\uFF0C\u4E0D\u6784\u6210\u4E49\u52A1\u6216\u627F\u8BFA\u3002",
        "4.5 \u95F4\u63A5\u635F\u5931\u6392\u9664\u3002\u5728\u9002\u7528\u6CD5\u5F8B\u5141\u8BB8\u7684\u6700\u5927\u8303\u56F4\u5185\uFF0C\u5F00\u53D1\u65B9\u4E0D\u5BF9\u4EFB\u4F55\u95F4\u63A5\u6027\u3001\u9644\u5E26\u6027\u3001\u540E\u679C\u6027\u6216\u60E9\u7F5A\u6027\u635F\u5BB3\u627F\u62C5\u8D23\u4EFB\uFF0C\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\u5229\u6DA6\u635F\u5931\u3001\u5546\u8A89\u635F\u5931\u3001\u6570\u636E\u4EF7\u503C\u635F\u5931\u3001\u4E1A\u52A1\u4E2D\u65AD\u3001\u673A\u4F1A\u4E27\u5931\u6216\u7B2C\u4E09\u65B9\u7D22\u8D54\u5F15\u53D1\u7684\u635F\u5931\u3002",
        "4.6 \u8D23\u4EFB\u4E0A\u9650\u3002\u672C\u670D\u52A1\u76EE\u524D\u5B8C\u5168\u514D\u8D39\uFF0C\u6211\u4EEC\u4E0D\u5411\u60A8\u6536\u53D6\u4EFB\u4F55\u8D39\u7528\u3002\u5373\u4F7F\u7ECF\u751F\u6548\u6CD5\u5F8B\u6587\u4E66\u8BA4\u5B9A\u5F00\u53D1\u65B9\u987B\u5C31\u672C\u670D\u52A1\u627F\u62C5\u8D54\u507F\u8D23\u4EFB\uFF0C\u5F00\u53D1\u65B9\u5C31\u540C\u4E00\u4E8B\u9879\u627F\u62C5\u7684\u5168\u90E8\u8D54\u507F\u8D23\u4EFB\u7D2F\u8BA1\u4E0D\u8D85\u8FC7\u60A8\u5C31\u672C\u670D\u52A1\u5B9E\u9645\u652F\u4ED8\u7684\u8D39\u7528\u603B\u989D\uFF08\u76EE\u524D\u4E3A 0 \u5143\uFF09\u3002\u60A8\u786E\u8BA4\u5E76\u63A5\u53D7\uFF1A\u670D\u52A1\u514D\u8D39\u4E14\u8D23\u4EFB\u4EE5\u4E0A\u8FF0\u91D1\u989D\u4E3A\u4E0A\u9650\uFF0C\u662F\u60A8\u4F7F\u7528\u672C\u670D\u52A1\u7684\u5408\u7406\u5BF9\u4EF7\u5B89\u6392\u3002",
        "4.7 \u7B2C\u4E09\u65B9\u4F9D\u8D56\u514D\u8D23\u3002frps \u96A7\u9053\u670D\u52A1\u3001\u4E91\u670D\u52A1\u5668\u3001\u57DF\u540D\u4E0E DNS\u3001\u90AE\u4EF6\u670D\u52A1\u5546\u3001IP \u5F52\u5C5E\u5730\u67E5\u8BE2\u670D\u52A1\u3001DSH \u53CA\u5176\u670D\u52A1\u65B9\u7B49\u7B2C\u4E09\u65B9\u8D44\u6E90\u7531\u76F8\u5E94\u7B2C\u4E09\u65B9\u63D0\u4F9B\uFF0C\u5176\u53EF\u7528\u6027\u3001\u6545\u969C\u3001\u53D8\u66F4\u3001\u653F\u7B56\u8C03\u6574\u6216\u7EC8\u6B62\u4E0D\u6784\u6210\u672C\u65B9\u8FDD\u7EA6\uFF1B\u56E0\u7B2C\u4E09\u65B9\u539F\u56E0\u9020\u6210\u7684\u4EFB\u4F55\u635F\u5BB3\uFF0C\u5F00\u53D1\u65B9\u4E0D\u627F\u62C5\u8D23\u4EFB\u3002",
        "4.8 \u975E\u5B98\u65B9\u6E20\u9053\u4E0E\u81EA\u5EFA\u90E8\u7F72\u514D\u8D23\u3002\u60A8\u901A\u8FC7\u5B98\u65B9\u6E20\u9053\u4EE5\u5916\u83B7\u53D6\u7684\u4EFB\u4F55\u526F\u672C\u3001\u5B89\u88C5\u5305\u6216\u955C\u50CF\uFF0C\u60A8\u6216\u7B2C\u4E09\u65B9\u81EA\u5EFA\u90E8\u7F72\u7684\u5B9E\u4F8B\uFF0C\u4EE5\u53CA\u4EFB\u4F55\u7ECF\u4FEE\u6539\u3001\u4E8C\u6B21\u5206\u53D1\u7684\u7248\u672C\uFF0C\u5747\u7531\u5176\u90E8\u7F72\u8005\u3001\u63D0\u4F9B\u8005\u6216\u4FEE\u6539\u8005\u81EA\u884C\u8FD0\u8425\u5E76\u627F\u62C5\u5168\u90E8\u8D23\u4EFB\uFF1B\u5F00\u53D1\u65B9\u4E0D\u5BF9\u8BE5\u7B49\u5B9E\u4F8B\u6216\u7248\u672C\u7684\u53EF\u7528\u6027\u3001\u5B89\u5168\u6027\u4E0E\u4EFB\u4F55\u540E\u679C\u627F\u62C5\u8D23\u4EFB\u3002\u5411\u7B2C\u4E09\u65B9\u63D0\u4F9B\u672C\u5DE5\u5177\u526F\u672C\u6216\u534F\u52A9\u5176\u90E8\u7F72\u7684\uFF0C\u89C6\u4E3A\u60A8\u5DF2\u786E\u8BA4\u5176\u77E5\u6089\u5E76\u540C\u610F\u672C\u534F\u8BAE\u3002",
        "4.9 \u5E95\u7EBF\u4FDD\u7559\u6761\u6B3E\u3002\u672C\u7AE0\u53CA\u672C\u534F\u8BAE\u5176\u4ED6\u4EFB\u4F55\u514D\u8D23\u3001\u9650\u8D23\u6761\u6B3E\uFF0C\u5747\u5728\u9002\u7528\u6CD5\u5F8B\u5141\u8BB8\u7684\u6700\u5927\u8303\u56F4\u5185\u9002\u7528\uFF1B\u6CD5\u5F8B\u5F3A\u5236\u6027\u89C4\u5B9A\u53E6\u6709\u8981\u6C42\uFF08\u4F8B\u5982\u56E0\u6545\u610F\u6216\u91CD\u5927\u8FC7\u5931\u9020\u6210\u5BF9\u65B9\u8D22\u4EA7\u635F\u5931\u3001\u9020\u6210\u5BF9\u65B9\u4EBA\u8EAB\u635F\u5BB3\u7B49\u6CD5\u5B9A\u4E0D\u5F97\u514D\u9664\u7684\u60C5\u5F62\uFF09\u7684\uFF0C\u4EC5\u5728\u8BE5\u7B49\u5F3A\u5236\u6027\u8303\u56F4\u5185\u5931\u6548\uFF0C\u4E0D\u5F71\u54CD\u672C\u534F\u8BAE\u5176\u4F59\u6761\u6B3E\u7684\u6548\u529B\u3002"
      ]
    },
    {
      title: "\u7B2C\u4E94\u7AE0 \u8FDD\u89C4\u5904\u7406\u4E0E\u4E89\u8BAE\u89E3\u51B3",
      paragraphs: [
        "5.1 \u8FDD\u89C4\u5904\u7F6E\u3002\u5BF9\u8FDD\u53CD\u672C\u534F\u8BAE\u3001\u7834\u574F\u670D\u52A1\u5B89\u5168\u3001\u6EE5\u7528\u8D44\u6E90\u6216\u635F\u5BB3\u4ED6\u4EBA\u6743\u76CA\u7684\u7528\u6237\uFF0C\u5F00\u53D1\u65B9\u6709\u6743\u5728\u65E0\u9700\u4E8B\u5148\u901A\u77E5\u4E14\u65E0\u9700\u8BF4\u660E\u7406\u7531\u7684\u60C5\u51B5\u4E0B\uFF0C\u91C7\u53D6\u963B\u65AD\u8BBF\u95EE\u3001\u5C01\u7981 IP/\u8BBE\u5907/\u8D26\u53F7\u3001\u9650\u901F\u3001\u9650\u5236\u529F\u80FD\u3001\u6E05\u7A7A\u5F02\u5E38\u65F6\u957F\u3001\u8E22\u51FA\u5168\u90E8\u4F1A\u8BDD\u3001\u505C\u7528\u6216\u5220\u9664\u8D26\u53F7\u7B49\u63AA\u65BD\uFF0C\u5E76\u5728\u9002\u7528\u6CD5\u5F8B\u5141\u8BB8\u7684\u6700\u5927\u8303\u56F4\u5185\u4E0D\u56E0\u6B64\u627F\u62C5\u4EFB\u4F55\u8D23\u4EFB\u3002\u88AB\u5904\u7F6E\u7528\u6237\u53EF\u901A\u8FC7\u5B98\u65B9\u6E20\u9053\u63D0\u51FA\u7533\u8BC9\uFF0C\u6211\u4EEC\u6838\u5B9E\u540E\u636E\u5B9E\u5904\u7406\u3002",
        "5.2 \u4E89\u8BAE\u534F\u5546\u4F18\u5148\uFF1B\u534F\u5546\u4E0D\u6210\uFF0C\u9002\u7528\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u73B0\u884C\u6709\u6548\u6CD5\u5F8B\uFF0C\u5E76\u5411\u5F00\u53D1\u65B9\u6240\u5728\u5730\u6709\u7BA1\u8F96\u6743\u7684\u4EBA\u6C11\u6CD5\u9662\u63D0\u8D77\u8BC9\u8BBC\u3002",
        "5.3 \u6761\u6B3E\u72EC\u7ACB\u6027\uFF1A\u672C\u534F\u8BAE\u4EFB\u610F\u6761\u6B3E\u88AB\u8BA4\u5B9A\u4E3A\u65E0\u6548\u3001\u4E0D\u53EF\u6267\u884C\u7684\uFF0C\u4E0D\u5F71\u54CD\u5176\u4F59\u6761\u6B3E\u7684\u6548\u529B\u3002"
      ]
    },
    {
      title: "\u7B2C\u516D\u7AE0 \u534F\u8BAE\u4FEE\u8BA2\u4E0E\u751F\u6548",
      paragraphs: [
        "6.1 \u672C\u534F\u8BAE\u5C06\u6839\u636E\u6CD5\u5F8B\u6CD5\u89C4\u3001\u4EA7\u54C1\u8FED\u4EE3\u4E0E\u5B89\u5168\u9700\u8981\u9002\u65F6\u4FEE\u8BA2\uFF0C\u4FEE\u8BA2\u540E\u7684\u7248\u672C\u5728\u9762\u677F\u300C\u5173\u4E8E\u300D\u5185\u516C\u5E03\uFF0C\u81EA\u516C\u5E03\u4E4B\u65F6\u8D77\u751F\u6548\uFF0C\u4E0D\u53E6\u884C\u5355\u72EC\u901A\u77E5\uFF1B\u5BF9\u60A8\u6743\u76CA\u4EA7\u751F\u91CD\u5927\u5F71\u54CD\u7684\u53D8\u66F4\u5C06\u663E\u8457\u63D0\u793A\u3002",
        "6.2 \u7EE7\u7EED\u4F7F\u7528\u5373\u89C6\u4E3A\u63A5\u53D7\u4FEE\u8BA2\u540E\u7684\u534F\u8BAE\uFF1B\u4E0D\u540C\u610F\u8005\u53EF\u505C\u6B62\u4F7F\u7528\u5E76\u6E05\u9664\u672C\u5730\u6570\u636E\u3002",
        "6.3 \u672C\u534F\u8BAE\u6700\u7EC8\u89E3\u91CA\u6743\u5F52\u5F00\u53D1\u65B9\u6240\u6709\uFF08\u6CD5\u5F8B\u6CD5\u89C4\u53E6\u6709\u5F3A\u5236\u89C4\u5B9A\u7684\u9664\u5916\uFF09\u3002"
      ]
    }
  ]
};
var LEGAL_PRIVACY = {
  id: "privacy",
  title: "\u9690\u79C1\u653F\u7B56",
  subtitle: `\u66F4\u65B0\u751F\u6548\u65E5\u671F\uFF1A${LEGAL_EFFECTIVE}\u3002\u9002\u7528\u4EA7\u54C1\uFF1ADSH \u8FDC\u7A0B\u52A9\u624B\uFF08\u6D4F\u89C8\u5668\u63A7\u5236\u63D2\u4EF6\u3001\u672C\u673A\u95F8\u673A\u3001\u914D\u5957 App \u53CA\u7F51\u9875\u9762\u677F\uFF09\u3002\u672C\u653F\u7B56\u4E0E\u300A\u7528\u6237\u534F\u8BAE\u300B\u4E00\u5E76\u9002\u7528\uFF0C\u8BF7\u91CD\u70B9\u9605\u8BFB\u4E0E\u4FE1\u606F\u6536\u96C6\u3001Cookie\u3001\u5171\u4EAB\u3001\u6743\u5229\u884C\u4F7F\u76F8\u5173\u7684\u6761\u6B3E\u3002`,
  sections: [
    {
      title: "\u524D\u8A00",
      paragraphs: [
        "DSH \u8FDC\u7A0B\u52A9\u624B\u5F00\u53D1\u65B9\uFF08\u4EE5\u4E0B\u7B80\u79F0\u300C\u6211\u4EEC\u300D\uFF09\u627F\u8BFA\u4FDD\u62A4\u4F7F\u7528\u672C\u5DE5\u5177\u4E4B\u7528\u6237\uFF08\u4EE5\u4E0B\u7EDF\u79F0\u300C\u60A8\u300D\uFF09\u7684\u4E2A\u4EBA\u4FE1\u606F\u548C\u9690\u79C1\u5B89\u5168\u3002\u672C\u5DE5\u5177\u4E3A\u4E2A\u4EBA\u72EC\u7ACB\u516C\u76CA\u5F00\u53D1\uFF0C\u575A\u6301\u6700\u5C0F\u5FC5\u8981\u3001\u81EA\u613F\u6388\u6743\u3001\u975E\u5F3A\u5236\u6536\u96C6\u3001\u7981\u6B62\u5C06\u6570\u636E\u7528\u4E8E\u5546\u4E1A\u53D8\u73B0\u7684\u539F\u5219\u3002\u5F00\u53D1\u65B9\u5DF2\u5C3D\u5F53\u524D\u6280\u672F\u6761\u4EF6\u4E0B\u6700\u5927\u9650\u5EA6\u7684\u52AA\u529B\u4FDD\u62A4\u60A8\u7684\u4E2A\u4EBA\u4FE1\u606F\u4E0E\u672C\u670D\u52A1\u7CFB\u7EDF\u5B89\u5168\uFF1B\u4F46\u4E92\u8054\u7F51\u73AF\u5883\u4E0D\u5B58\u5728\u7EDD\u5BF9\u5B89\u5168\uFF0C\u76F8\u5173\u98CE\u9669\u63D0\u793A\u4E0E\u8D23\u4EFB\u9650\u5236\u89C1\u300A\u7528\u6237\u534F\u8BAE\u300B\u7B2C\u56DB\u7AE0\u53CA\u672C\u653F\u7B56\u300C\u4E94\u3001\u5B58\u50A8\u4E0E\u4FDD\u62A4\u300D\u3002",
        "\u672C\u670D\u52A1\u76EE\u524D\u5B8C\u5168\u514D\u8D39\uFF0C\u4E0D\u5411\u60A8\u6536\u53D6\u4EFB\u4F55\u8D39\u7528\uFF1B\u6B63\u56E0\u4E3A\u4E0D\u6536\u8D39\uFF0C\u6211\u4EEC\u66F4\u4E0D\u4F1A\u4EE5\u51FA\u552E\u3001\u51FA\u79DF\u6216\u5546\u4E1A\u53D8\u73B0\u60A8\u7684\u4E2A\u4EBA\u4FE1\u606F\u4F5C\u4E3A\u6536\u5165\u6765\u6E90\u3002",
        "\u9002\u7528\u6CD5\u89C4\u4F9D\u636E\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\u300A\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u4E2A\u4EBA\u4FE1\u606F\u4FDD\u62A4\u6CD5\u300B\u300A\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u7F51\u7EDC\u5B89\u5168\u6CD5\u300B\u53CA\u76F8\u5173\u76D1\u7BA1\u89C4\u8303\u3002",
        LEGAL_AGE + "\u3002"
      ]
    },
    {
      title: "\u7279\u522B\u63D0\u793A",
      paragraphs: [
        "1. \u672C\u653F\u7B56\u4E0E\u300A\u7528\u6237\u534F\u8BAE\u300B\u540C\u65F6\u5BF9\u60A8\u4EA7\u751F\u6548\u529B\uFF1B\u540C\u7C7B\u6761\u6B3E\u4E0D\u4E00\u81F4\u65F6\uFF0C\u5C31\u4E2A\u4EBA\u4FE1\u606F\u5904\u7406\u4E8B\u9879\u4EE5\u672C\u653F\u7B56\u4E3A\u51C6\uFF0C\u5176\u4F59\u4EE5\u300A\u7528\u6237\u534F\u8BAE\u300B\u4E3A\u51C6\u3002",
        "2. \u53EA\u6709\u5F53\u60A8\u5F00\u542F\u8FDC\u7A0B\u8BBF\u95EE\u3001\u6CE8\u518C\u8D26\u53F7\u3001\u914D\u5BF9\u3001\u63A8\u9001\u7B49\u529F\u80FD\u65F6\uFF0C\u4E3A\u5B9E\u73B0\u8BE5\u529F\u80FD\u6211\u4EEC\u624D\u4F1A\u5904\u7406\u5BF9\u5E94\u4FE1\u606F\uFF1B\u4E0D\u5F00\u542F\u76F8\u5173\u529F\u80FD\u5219\u4E0D\u5904\u7406\u5BF9\u5E94\u7684\u4E2A\u4EBA\u4FE1\u606F\u3002",
        "3. \u4F7F\u7528\u524D\u8BF7\u4ED4\u7EC6\u9605\u8BFB\u672C\u653F\u7B56\u3002\u82E5\u60A8\u4E0D\u540C\u610F\uFF0C\u8BF7\u7ACB\u5373\u505C\u6B62\u8BBF\u95EE/\u4F7F\u7528\u3002",
        "4. \u672C\u653F\u7B56\u4E2D\u5173\u4E8E\u5B89\u5168\u63AA\u65BD\u7684\u63CF\u8FF0\u4E3A\u73B0\u72B6\u6027\u8BF4\u660E\uFF0C\u4E0D\u6784\u6210\u5BF9\u7EDD\u5BF9\u5B89\u5168\u3001\u96F6\u6CC4\u9732\u6216\u96F6\u4E2D\u65AD\u7684\u4EFB\u4F55\u62C5\u4FDD\u3002",
        "5. \u672C\u653F\u7B56\u76EE\u5F55\uFF1A\u4E00\u3001\u9002\u7528\u8303\u56F4\uFF1B\u4E8C\u3001\u6211\u4EEC\u5982\u4F55\u6536\u96C6\u548C\u4F7F\u7528\u4FE1\u606F\uFF1B\u4E09\u3001Cookie \u4E0E\u540C\u7C7B\u6280\u672F\uFF1B\u56DB\u3001\u5171\u4EAB\u3001\u8F6C\u79FB\u6216\u516C\u5F00\uFF1B\u4E94\u3001\u5B58\u50A8\u4E0E\u4FDD\u62A4\uFF1B\u516D\u3001\u60A8\u7684\u6743\u5229\uFF1B\u4E03\u3001\u672A\u6210\u5E74\u4EBA\u4FDD\u62A4\uFF1B\u516B\u3001\u4FEE\u8BA2\u548C\u901A\u77E5\uFF1B\u4E5D\u3001\u5982\u4F55\u8054\u7CFB\u6211\u4EEC\u3002"
      ]
    },
    {
      title: "\u4E00\u3001\u9002\u7528\u8303\u56F4",
      paragraphs: [
        "\u672C\u653F\u7B56\u9002\u7528\u4E8E\u672C\u673A\u95F8\u673A\u3001\u6D4F\u89C8\u5668\u63A7\u5236\u63D2\u4EF6\u3001\u914D\u5957 App\u3001\u5B98\u7F51\uFF08\u542B\u767B\u5F55\u9875\u3001\u4E2A\u4EBA\u4E2D\u5FC3\u3001\u6D88\u606F\u4E2D\u5FC3\u3001\u5DE5\u5355\u7CFB\u7EDF\uFF09\u3001\u5B98\u7F51\u8D26\u53F7\u540E\u7AEF\u53CA\u968F\u6280\u672F\u53D1\u5C55\u51FA\u73B0\u7684\u65B0\u5F62\u6001\u3002",
        "\u672C\u653F\u7B56\u4E0D\u9002\u7528\u4E8E\u7B2C\u4E09\u65B9\u72EC\u7ACB\u8FD0\u8425\u7684\u670D\u52A1\uFF08\u5982 frps \u670D\u52A1\u5668\u5546\u3001\u4E91\u57FA\u7840\u8BBE\u65BD\u3001\u90AE\u4EF6\u670D\u52A1\u5546\u3001IP \u5F52\u5C5E\u5730\u67E5\u8BE2\u670D\u52A1\u3001\u60A8\u81EA\u884C\u914D\u7F6E\u7684\u96A7\u9053\u670D\u52A1\u7B49\uFF09\uFF0C\u8BE5\u7B49\u670D\u52A1\u9002\u7528\u5176\u5404\u81EA\u89C4\u5219\uFF1B\u6D89\u53CA\u5411\u5176\u63D0\u4F9B\u4FE1\u606F\u7684\u60C5\u51B5\u89C1\u300C\u56DB\u3001\u5171\u4EAB\u3001\u8F6C\u79FB\u6216\u516C\u5F00\u300D\u3002",
        "\u7279\u522B\u5730\uFF1A\u8FDC\u7A0B\u8BBF\u95EE\u7684\u5BF9\u8C61\u662F\u60A8\u672C\u673A\u7684 DeepSeek \u52A9\u624B\uFF08DSH\uFF09\u9762\u677F\u3002\u672C\u5DE5\u5177\u4E0D\u5B58\u50A8\u3001\u4E0D\u67E5\u770B\u3001\u4E0D\u5206\u6790\u60A8\u7684\u5BF9\u8BDD\u5185\u5BB9\u4E0E\u9762\u677F\u5185\u4E1A\u52A1\u6570\u636E\uFF0C\u8BE5\u7B49\u5185\u5BB9\u7531 DSH \u53CA\u5176\u670D\u52A1\u65B9\u6309\u5176\u81EA\u8EAB\u653F\u7B56\u5904\u7406\u3002"
      ]
    },
    {
      title: "\u4E8C\u3001\u6211\u4EEC\u5982\u4F55\u6536\u96C6\u548C\u4F7F\u7528\u60A8\u7684\u4E2A\u4EBA\u4FE1\u606F",
      paragraphs: [
        "\uFF08\u4E00\uFF09\u8FDC\u7A0B\u8BBF\u95EE\u4E0E\u8BBE\u5907\u9A8C\u8BC1",
        "1. \u5F53\u60A8\u901A\u8FC7\u624B\u673A\u6216\u5916\u7F51\u6D4F\u89C8\u5668\u8BBF\u95EE\u9762\u677F\u65F6\uFF0C\u672C\u673A\u95F8\u673A\u4F1A\u5728\u672C\u5730\u8BB0\u5F55\u5FC5\u8981\u4FE1\u606F\uFF1A\u8BBF\u95EE IP \u5730\u5740\u3001\u8BBE\u5907\u6807\u8BC6\uFF08\u5BA2\u6237\u7AEF\u751F\u6210\u7684\u533F\u540D devid\uFF09\u3001User-Agent\u3001\u8BBF\u95EE\u65F6\u95F4\u4E0E\u9A8C\u8BC1\u4E8B\u4EF6\uFF0C\u7528\u4E8E\u8BBE\u5907\u4FE1\u4EFB\u3001\u4F1A\u8BDD\u7BA1\u7406\u3001\u5F02\u5E38\u8BC6\u522B\u4E0E\u5B89\u5168\u5BA1\u8BA1\u3002",
        "2. \u5F00\u542F\u9762\u677F\u4E24\u6B65\u9A8C\u8BC1\u540E\uFF0C\u9A8C\u8BC1\u8FC7\u7A0B\u4EC5\u5728\u672C\u673A\u5B8C\u6210\u52A8\u6001\u7801\u6BD4\u5BF9\uFF08TOTP\uFF09\uFF0C\u9A8C\u8BC1\u7801\u4E0D\u5BF9\u7B2C\u4E09\u65B9\u4F20\u8F93\uFF1B\u9A8C\u8BC1\u901A\u8FC7\u7684\u8BBE\u5907 30 \u5929\u5185\u514D\u91CD\u590D\u9A8C\u8BC1\u3002",
        "3. \u914D\u5BF9\u4E8C\u7EF4\u7801\u4E0E\u5F15\u5BFC\u94FE\u63A5\u7531\u672C\u673A\u751F\u6210\uFF0C\u7528\u4E8E\u4E00\u6B21\u6027/\u9650\u65F6\u6388\u6743\uFF0C\u4E0D\u5728\u670D\u52A1\u7AEF\u7559\u5B58\u660E\u6587\u51ED\u636E\u3002",
        "4. \u5B98\u65B9\u6258\u7BA1\u6A21\u5F0F\u4E0B\u7684\u5FC3\u8DF3\u4E0E\u7528\u91CF\u4E0A\u62A5\uFF1A\u672C\u673A\u95F8\u673A\u4F1A\u6309\u4F7F\u7528\u5468\u671F\u5411\u5B98\u65B9\u670D\u52A1\u5668\u4E0A\u62A5\u5728\u7EBF\u72B6\u6001\u5FC3\u8DF3\uFF0C\u5185\u5BB9\u5305\u62EC\u5728\u7EBF\u79D2\u6570\u3001\u5728\u7EBF\u8BBE\u5907\u660E\u7EC6\uFF08\u8BBE\u5907\u540D/\u8BBE\u5907\u6807\u8BC6\u3001IP\u3001User-Agent\uFF09\u4E0E\u6700\u8FD1\u8BF7\u6C42\u5143\u6570\u636E\uFF08\u89C1\u672C\u8282\u300C\u65E5\u5FD7\u4E0E\u8BCA\u65AD\u300D\uFF09\uFF0C\u7528\u4E8E\u5728\u7EBF\u72B6\u6001\u5C55\u793A\u3001\u65F6\u957F\u4F59\u989D\u6263\u51CF\u3001\u7528\u91CF\u7EDF\u8BA1\u4E0E\u8BBE\u5907\u7BA1\u7406\uFF1B\u8BBE\u5907\u660E\u7EC6\u6309\u73AF\u5F62\u65B9\u5F0F\u4EC5\u4FDD\u7559\u6700\u8FD1 200 \u6761\u3002\u4E0A\u8FF0\u4E0A\u62A5\u4E0D\u5305\u542B\u5BF9\u8BDD\u5185\u5BB9\u4E0E\u8BF7\u6C42\u6B63\u6587\u3002\u81EA\u5EFA\u6A21\u5F0F\u4E0B\u8FD9\u4E9B\u4FE1\u606F\u53EA\u7559\u5B58\u5728\u60A8\u81EA\u5DF1\u7684\u670D\u52A1\u5668\u3002",
        "\uFF08\u4E8C\uFF09\u5B98\u7F51\u8D26\u53F7\u4E0E\u4E2A\u4EBA\u4E2D\u5FC3",
        "\u5F53\u60A8\u6CE8\u518C\u6216\u767B\u5F55\u5B98\u7F51\u8D26\u53F7\uFF08\u7528\u4E8E\u63D2\u4EF6/App \u914D\u5BF9\u3001\u4E2A\u4EBA\u4E2D\u5FC3\u3001\u6D88\u606F\u4E2D\u5FC3\u4E0E\u5DE5\u5355\uFF09\u65F6\uFF0C\u6211\u4EEC\u4F1A\u5904\u7406\uFF1A",
        "1. \u6CE8\u518C\u4FE1\u606F\uFF1A\u90AE\u7BB1\u5730\u5740\u3001\u7528\u6237\u540D\uFF1B\u5BC6\u7801\u4EC5\u4EE5 argon2id\uFF08\u6216\u56DE\u9000 scrypt\uFF09\u6162\u54C8\u5E0C\u4FDD\u5B58\uFF0C\u660E\u6587\u4E0D\u843D\u76D8\u3001\u4E0D\u53EF\u8FD8\u539F\u3002\u90AE\u7BB1\u4EC5\u7528\u4E8E\u8D26\u53F7\u6807\u8BC6\u3001\u767B\u5F55\u4E0E\u9A8C\u8BC1\u90AE\u4EF6\u6295\u9012\u3002\u4E3A\u9632\u6B62\u4E34\u65F6\u90AE\u7BB1\u6279\u91CF\u6CE8\u518C\uFF0C\u4EC5\u63A5\u53D7\u5E38\u89C1\u4E3B\u6D41\u90AE\u7BB1\u57DF\u540D\u6CE8\u518C\u3002",
        "2. \u9A8C\u8BC1\u7801\u90AE\u4EF6\uFF1A\u6CE8\u518C\u3001\u9A8C\u8BC1\u7801\u767B\u5F55\u3001\u4FEE\u6539\u90AE\u7BB1\u65F6\u53D1\u9001 6 \u4F4D\u6570\u5B57\u9A8C\u8BC1\u7801\uFF0810 \u5206\u949F\u5185\u6709\u6548\uFF0C\u9A8C\u8BC1\u901A\u8FC7\u6216\u8FC7\u671F\u5373\u4ECE\u5185\u5B58\u5220\u9664\uFF09\u3002\u90AE\u4EF6\u7ECF\u7531\u7B2C\u4E09\u65B9\u90AE\u4EF6\u670D\u52A1\u5546\u6295\u9012\uFF0C\u5373\u4EC5\u5C31\u8BE5\u76EE\u7684\u5411\u5176\u63D0\u4F9B\u6536\u4EF6\u90AE\u7BB1\u5730\u5740\u4E0E\u90AE\u4EF6\u5185\u5BB9\u3002\u4E3A\u4FBF\u4E8E\u6392\u969C\uFF0C\u670D\u52A1\u5668\u4FDD\u7559\u53D1\u9001\u7EDF\u8BA1\uFF08\u6536\u4EF6\u5730\u5740\u3001\u4E3B\u9898\u4E0E\u6B63\u6587\u5FEB\u7167\uFF0C\u73AF\u5F62\u4FDD\u7559\u6700\u8FD1 200 \u6761\uFF09\uFF0C\u4EC5\u7BA1\u7406\u5458\u53EF\u67E5\u770B\u3002",
        "3. \u767B\u5F55\u4E0E\u4EE4\u724C\uFF1A\u767B\u5F55\u6210\u529F\u540E\u7B7E\u53D1\u6709\u6548\u671F 30 \u5929\u7684\u767B\u5F55\u4EE4\u724C\uFF1B\u540C\u65F6\u4E0B\u53D1\u672C\u673A\u95F8\u673A\u4E0E\u5B98\u65B9\u670D\u52A1\u5668\u4E4B\u95F4\u7684\u95E8\u7981\u51ED\u636E\uFF08linkSecret\uFF09\uFF0C\u8BE5\u51ED\u636E\u4EC5\u7528\u4E8E\u60A8\u81EA\u5DF1\u7684\u95F8\u673A\u4E0E\u670D\u52A1\u5668\u63E1\u624B\uFF0C\u4E0D\u5411\u4ED6\u4EBA\u5C55\u793A\u3002\u6211\u4EEC\u8BB0\u5F55\u6700\u540E\u767B\u5F55\u65F6\u95F4\u7528\u4E8E\u8D26\u53F7\u7BA1\u7406\u3002",
        "4. \u8D26\u53F7\u4E24\u6B65\u9A8C\u8BC1\uFF08\u53EF\u9009\uFF09\uFF1A\u5F00\u542F\u540E\u6BCF\u6B21\u767B\u5F55\u5B98\u7F51\u8D26\u53F7\u9700\u8F93\u5165\u9A8C\u8BC1\u5668\u52A8\u6001\u7801\u6216\u5907\u7528\u7801\u3002TOTP \u5BC6\u94A5\u4EE5 AES-256-GCM \u52A0\u5BC6\u5B58\u50A8\u4E8E\u5B98\u65B9\u670D\u52A1\u5668\uFF1B\u5907\u7528\u7801\u4EC5\u5B58\u54C8\u5E0C\u503C\uFF0C\u660E\u6587\u53EA\u5728\u751F\u6210\u65F6\u5411\u60A8\u5C55\u793A\u4E00\u6B21\uFF1B\u9A8C\u8BC1\u5931\u8D25\u6B21\u6570\u4E0E\u4E34\u65F6\u9501\u5B9A\u65F6\u95F4\u4E00\u5E76\u8BB0\u5F55\u3002",
        "5. \u7B7E\u5230\u4E0E\u65F6\u957F\u4F59\u989D\uFF1A\u6BCF\u65E5\u7B7E\u5230\u8BB0\u5F55\uFF08\u6309\u6708\u660E\u7EC6\u4E0E\u7D2F\u8BA1\u805A\u5408\uFF09\u548C\u65F6\u957F\u4F59\u989D\uFF08\u5206\u949F\uFF09\u4FDD\u5B58\u5728\u60A8\u7684\u8D26\u53F7\u4E0B\uFF0C\u7528\u4E8E\u514D\u8D39\u7528\u91CF\u7684\u516C\u5E73\u5206\u914D\u3002",
        "6. \u6D88\u606F\u4E2D\u5FC3\uFF1A\u5B98\u65B9\u516C\u544A\u3001\u9762\u5411\u60A8\u7684\u5B9A\u5411\u6D88\u606F\u53CA\u5176\u5DF2\u8BFB\u72B6\u6001\u4FDD\u5B58\u5728\u670D\u52A1\u5668\uFF0C\u7528\u4E8E\u8DE8\u8BBE\u5907\u540C\u6B65\u3002",
        "7. \u4E2A\u4EBA\u4E2D\u5FC3\u5C55\u793A\uFF1A\u767B\u5F55\u8BBE\u5907\u5217\u8868\u3001\u7528\u91CF\u66F2\u7EBF\u4E0E\u9010\u8BF7\u6C42\u660E\u7EC6\u7531\u60A8\u7684\u8D26\u53F7\u6570\u636E\u805A\u5408\u800C\u6765\uFF0C\u60A8\u53EF\u968F\u65F6\u67E5\u770B\u81EA\u5DF1\u7684\u8BB0\u5F55\u3002",
        "\uFF08\u4E09\uFF09\u5B89\u5168\u4E0E\u98CE\u63A7",
        "1. \u4E3A\u8BC6\u522B\u5F02\u5E38\u767B\u5F55\u3001\u66B4\u529B\u7834\u89E3\u3001\u63A5\u53E3\u6EE5\u7528\u4E0E\u653B\u51FB\uFF0C\u53EF\u80FD\u8BB0\u5F55\u8BBF\u95EE\u65F6\u95F4\u5E8F\u5217\u3001\u8BF7\u6C42\u6765\u6E90\u3001\u5931\u8D25\u6B21\u6570\u3001IP \u9ED1\u540D\u5355\u7B49\uFF0C\u5E76\u91C7\u53D6\u9650\u6D41\u3001\u51BB\u7ED3\u3001\u5C01\u7981\u7B49\u63AA\u65BD\uFF1B\u9650\u901F\u8BA1\u6570\u4FDD\u5B58\u5728\u5185\u5B58\u5E76\u5B9A\u671F\u6E05\u7406\u3002",
        "2. IP \u5C01\u7981\u5217\u8868\uFF08IP\u3001\u7406\u7531\u3001\u671F\u9650\u3001\u64CD\u4F5C\u8005\uFF09\u4E0E\u5BA1\u8BA1\u65E5\u5FD7\uFF08\u73AF\u5F62\u4FDD\u7559\u6700\u8FD1 2000 \u6761\uFF1A\u7BA1\u7406\u5458\u64CD\u4F5C\u3001\u5C01\u7981\u3001\u7B7E\u5230\u7B49\u7BA1\u7406\u4E8B\u4EF6\uFF09\u4EC5\u7528\u4E8E\u5B89\u5168\u5904\u7F6E\uFF0C\u4E0D\u7528\u4E8E\u5546\u4E1A\u753B\u50CF\u3002\u5BF9\u5C01\u7981\u6216\u5904\u7F6E\u6709\u5F02\u8BAE\u7684\uFF0C\u53EF\u901A\u8FC7\u5B98\u65B9\u6E20\u9053\u7533\u8BC9\uFF0C\u6211\u4EEC\u6838\u5B9E\u540E\u5904\u7406\u3002",
        "\uFF08\u56DB\uFF09\u63A8\u9001\uFF08\u53EF\u9009\uFF09",
        "\u4EC5\u5F53\u60A8\u5F00\u542F\u63A8\u9001\u65F6\uFF0C\u5B89\u5168\u4E8B\u4EF6\uFF08\u8BBE\u5907\u8FDE\u5165\u3001\u88AB\u8E22\u3001\u9ED1\u540D\u5355\u30012FA\u3001\u914D\u5BF9\uFF09\u4E0E\u7CFB\u7EDF\u6D88\u606F\u624D\u4F1A\u7ECF\u672C\u673A\u95F8\u673A\u8F6C\u9001\u81F3\u60A8\u7684\u624B\u673A\uFF1B\u5173\u95ED\u540E\u4E0D\u518D\u5904\u7406\u3002\u5B98\u7F51\u516C\u544A\u7684\u5F39\u7A97\u63D0\u9192\u540C\u6837\u7ECF\u7531\u95F8\u673A\u5FC3\u8DF3\u642D\u8F66\u4E0B\u53D1\uFF0C\u5C0A\u91CD\u60A8\u7684\u63A8\u9001\u603B\u5F00\u5173\u3002",
        "\uFF08\u4E94\uFF09\u65E5\u5FD7\u4E0E\u8BCA\u65AD",
        "\u4E3A\u6392\u67E5\u6545\u969C\uFF0C\u672C\u673A\u4FDD\u5B58\u8FD0\u884C\u65E5\u5FD7\uFF08\u4E0D\u542B\u5BC6\u94A5\uFF09\uFF1B\u65E5\u5FD7\u4EC5\u7528\u4E8E\u6280\u672F\u7EF4\u62A4\u4E0E\u670D\u52A1\u4F18\u5316\u3002",
        "\u8FD0\u884C\u65E5\u5FD7\u9ED8\u8BA4\u53EA\u7559\u5728\u672C\u673A\u3002\u4EC5\u5728\u60A8\u4E3B\u52A8\u63D0\u4EA4\u5DE5\u5355\u5E76\u786E\u8BA4\u9644\u5E26\u65F6\uFF0C\u65E5\u5FD7\u624D\u4F1A\u6309\u4E0B\u4E00\u5C0F\u8282\u6240\u8FF0\u7684\u65B9\u5F0F\u4E0A\u4F20\u3002\u6B64\u5916\uFF0C\u5B98\u65B9\u6258\u7BA1\u6A21\u5F0F\u4E0B\u9762\u677F\u4F1A\u6309\u5468\u671F\u5411\u5B98\u65B9\u670D\u52A1\u5668\u6279\u91CF\u4E0A\u62A5\u9010\u8BF7\u6C42\u5143\u6570\u636E\uFF08\u65F6\u95F4\u3001\u65B9\u6CD5\u3001\u8DEF\u5F84\u3001\u72B6\u6001\u7801\u3001\u8017\u65F6\u3001\u6765\u6E90 IP \u4E0E\u8BBE\u5907\u540D\uFF0C\u4E0D\u542B\u8BF7\u6C42\u5185\u5BB9\u4E0E\u5BF9\u8BDD\u6B63\u6587\uFF09\uFF0C\u7528\u4E8E\u7528\u91CF\u7EDF\u8BA1\u4E0E\u6545\u969C\u6392\u67E5\uFF1B\u9010\u8BF7\u6C42\u8BB0\u5F55\u6309\u73AF\u5F62\u65B9\u5F0F\u4EC5\u4FDD\u7559\u6700\u8FD1 5 \u4E07\u6761\uFF0C\u4E2A\u4EBA\u4E2D\u5FC3\u53EF\u67E5\u770B\u60A8\u81EA\u5DF1\u7684\u8BB0\u5F55\uFF0C\u7BA1\u7406\u5458\u540E\u53F0\u53EF\u89C1\u3002",
        "\uFF08\u516D\uFF09\u5DE5\u5355\u8BCA\u65AD\u65E5\u5FD7\uFF08\u53EF\u9009\uFF0C\u9700\u60A8\u660E\u786E\u786E\u8BA4\uFF09",
        "\u63D0\u4EA4\u5DE5\u5355\u65F6\uFF0C\u60A8\u53EF\u4EE5\u81EA\u884C\u9009\u62E9\u662F\u5426\u968F\u5DE5\u5355\u9644\u5E26\u300C\u8BCA\u65AD\u65E5\u5FD7\u300D\uFF0C\u7528\u4E8E\u52A0\u5FEB\u6545\u969C\u5B9A\u4F4D\u3002\u8BE5\u529F\u80FD\u5B8C\u5168\u81EA\u613F\uFF1A\u4E0D\u9644\u5E26\u540C\u6837\u53EF\u4EE5\u63D0\u4EA4\u5DE5\u5355\uFF0C\u6211\u4EEC\u4E5F\u4F1A\u7167\u5E38\u5904\u7406\u60A8\u7684\u5DE5\u5355\u3002",
        "\u8BCA\u65AD\u65E5\u5FD7\u53EF\u80FD\u5305\u542B\uFF1A\u8FD0\u884C\u73AF\u5883\uFF08\u64CD\u4F5C\u7CFB\u7EDF\u3001\u6D4F\u89C8\u5668/\u5185\u6838\u7248\u672C\u3001\u5C4F\u5E55\u5206\u8FA8\u7387\u3001\u65F6\u533A\u4E0E\u8BED\u8A00\u3001User-Agent\uFF09\uFF1B\u5BA2\u6237\u7AEF\u8BBE\u5907\u4FE1\u606F\uFF08\u4EC5 App\uFF1A\u673A\u578B\u3001\u7CFB\u7EDF\u7248\u672C\u3001WebView \u7248\u672C\u3001\u7F51\u7EDC\u7C7B\u578B\u3001\u7535\u91CF\uFF09\uFF1B\u95F8\u673A\u4E0E\u96A7\u9053\u72B6\u6001\uFF08\u662F\u5426\u8FD0\u884C\u3001\u672C\u5730\u4E0E\u516C\u7F51\u7AEF\u53E3\u3001\u96A7\u9053\u662F\u5426\u5C31\u7EEA\u3001\u6700\u8FD1\u4E00\u6B21\u9519\u8BEF\u3001\u5EF6\u8FDF\uFF09\uFF1B\u6700\u8FD1\u8BF7\u6C42\u6D41\u6C34\uFF08\u65F6\u95F4\u3001\u65B9\u6CD5\u3001\u8DEF\u5F84\u3001\u72B6\u6001\u7801\u4E0E\u8017\u65F6\uFF09\uFF1B\u524D\u7AEF\u9519\u8BEF\u4E0E\u5931\u8D25\u8BF7\u6C42\uFF08\u4EC5\u9519\u8BEF\u4E0E\u8B66\u544A\u7EA7\u522B\uFF0C\u4E0D\u542B\u60A8\u7684\u8F93\u5165\u5185\u5BB9\uFF09\u3002",
        "\u4E0A\u4F20\u524D\u60A8\u4F1A\u5148\u770B\u5230\u5B8C\u6574\u5185\u5BB9\uFF1A\u53EA\u6709\u5F53\u60A8\u52FE\u9009\u300C\u6211\u5DF2\u9884\u89C8\uFF0C\u786E\u8BA4\u4E0D\u542B\u654F\u611F\u4FE1\u606F\u300D\u5E76\u786E\u8BA4\u540E\uFF0C\u65E5\u5FD7\u624D\u4F1A\u968F\u5DE5\u5355\u4E0A\u4F20\u3002\u751F\u6210\u8BCA\u65AD\u65E5\u5FD7\u65F6\u6211\u4EEC\u4F1A\u81EA\u52A8\u5BF9\u5E38\u89C1\u654F\u611F\u5B57\u6BB5\u6253\u7801\uFF0C\u5305\u62EC\u8BBF\u95EE\u4EE4\u724C\uFF08token / Bearer / JWT\uFF09\u3001Cookie\u3001\u7B7E\u540D\uFF08sig\uFF09\u3001\u5BC6\u7801\u5B57\u6BB5\u3001IP \u5730\u5740\u672B\u4E24\u6BB5\u3001\u8D26\u53F7\u76EE\u5F55\u8DEF\u5F84\uFF0C\u4EE5\u53CA\u9664\u60A8\u672C\u4EBA\u90AE\u7BB1\u4E4B\u5916\u7684\u5176\u4ED6\u90AE\u7BB1\u5730\u5740\uFF1B\u60A8\u81EA\u884C\u6311\u9009\u4E0A\u4F20\u7684\u672C\u5730\u65E5\u5FD7\u6587\u4EF6\u5219\u539F\u6837\u4E0A\u4F20\u3001\u4E0D\u505A\u81EA\u52A8\u6253\u7801\uFF0C\u8BF7\u5728\u786E\u8BA4\u524D\u81EA\u884C\u68C0\u67E5\u3002",
        "\u60A8\u4E5F\u53EF\u4EE5\u9009\u62E9\u4E0D\u968F\u5DE5\u5355\u4E0A\u4F20\uFF0C\u800C\u5C06\u8BCA\u65AD\u5305\u5BFC\u51FA\u4E3A\u672C\u5730\u6587\u4EF6\u81EA\u884C\u4FDD\u7BA1\uFF1B\u5BFC\u51FA\u7684\u6587\u4EF6\u4FDD\u5B58\u5728\u60A8\u9009\u62E9\u7684\u4F4D\u7F6E\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u4E0A\u4F20\u3002",
        "\u5DE5\u5355\u6807\u9898\u3001\u6B63\u6587\u3001\u56DE\u590D\u4E0E\u9644\u4EF6\uFF08\u56FE\u7247/\u65E5\u5FD7\uFF09\u4FDD\u5B58\u5728\u5B98\u65B9\u670D\u52A1\u5668\uFF0C\u4EC5\u7528\u4E8E\u5DE5\u5355\u6392\u969C\uFF0C\u4EC5\u5DE5\u5355\u5904\u7406\u4EBA\u5458\uFF08\u7BA1\u7406\u5458\uFF09\u53EF\u67E5\u770B\uFF0C\u4E0D\u7528\u4E8E\u5E7F\u544A\u753B\u50CF\u6216\u5546\u4E1A\u7528\u9014\uFF1B\u5DE5\u5355\u88AB\u5220\u9664\u65F6\u9644\u4EF6\u4E00\u5E76\u5220\u9664\u3002\u60A8\u4E5F\u53EF\u4EE5\u968F\u65F6\u8981\u6C42\u5220\u9664\u76F8\u5173\u65E5\u5FD7\uFF0C\u6216\u6309\u672C\u653F\u7B56\u300C\u516D\u3001\u60A8\u7684\u6743\u5229\u300D\u884C\u4F7F\u6743\u5229\u3002",
        "\uFF08\u4E03\uFF09\u6570\u636E\u5927\u5C4F\u4E0E IP \u5F52\u5C5E\u5730",
        "\u4E3A\u5728\u7BA1\u7406\u540E\u53F0\u5C55\u793A\u8BBF\u95EE\u6765\u6E90\u7684\u5B8F\u89C2\u5206\u5E03\uFF08\u56FD\u5BB6/\u7701\u5E02\uFF09\uFF0C\u5B98\u65B9\u670D\u52A1\u5668\u4F1A\u5C06\u8BB0\u5F55\u5230\u7684\u8BBF\u95EE\u6765\u6E90 IP \u901A\u8FC7\u7B2C\u4E09\u65B9 ip-api.com \u67E5\u8BE2\u5927\u81F4\u5F52\u5C5E\u5730\u5E76\u505A\u5185\u5B58\u7F13\u5B58\u3002\u67E5\u8BE2\u65F6\u8BE5\u7B2C\u4E09\u65B9\u4F1A\u6536\u5230 IP \u5730\u5740\u672C\u8EAB\uFF1B\u7ED3\u679C\u4EC5\u7528\u4E8E\u7EDF\u8BA1\u5C55\u793A\uFF0C\u4E0D\u4E0E\u5BF9\u8BDD\u5185\u5BB9\u5173\u8054\uFF0C\u4E0D\u7528\u4E8E\u5E7F\u544A\u6216\u5546\u4E1A\u753B\u50CF\u3002\u4ECB\u610F\u6B64\u5904\u7406\u7684\uFF0C\u53EF\u8054\u7CFB\u7BA1\u7406\u5458\u8981\u6C42\u6392\u9664\u3002",
        "\uFF08\u516B\uFF09App \u7248\u672C\u66F4\u65B0\u68C0\u67E5",
        "App \u68C0\u67E5\u66F4\u65B0\u65F6\u4F1A\u5411\u5B98\u7F51\u67E5\u8BE2\u6700\u65B0\u7248\u672C\u53F7\u3001\u4E0B\u8F7D\u5730\u5740\u4E0E\u66F4\u65B0\u8BF4\u660E\uFF1B\u8BE5\u63A5\u53E3\u516C\u5F00\u4E14\u4E0D\u643A\u5E26\u8D26\u53F7\u4FE1\u606F\u3002\u4E0B\u8F7D APK \u7684\u5B89\u88C5\u884C\u4E3A\u672C\u8EAB\u4E0D\u56DE\u4F20\u6570\u636E\u3002",
        "\uFF08\u4E5D\uFF09App \u6743\u9650\u7533\u8BF7",
        "\u914D\u5957 App \u4EC5\u5728\u5BF9\u5E94\u529F\u80FD\u573A\u666F\u7533\u8BF7\u4EE5\u4E0B\u7CFB\u7EDF\u6743\u9650\uFF0C\u7528\u4E8E\u5B9E\u73B0\u76F8\u5E94\u529F\u80FD\uFF0C\u4E0D\u7528\u4E8E\u5176\u4ED6\u76EE\u7684\uFF1A\u901A\u77E5\u6743\u9650\uFF08\u53EF\u9009\uFF0C\u63A5\u6536\u63A8\u9001\u63D0\u9192\uFF0C\u62D2\u7EDD\u540E\u6536\u4E0D\u5230\u63A8\u9001\u4F46\u4E0D\u5F71\u54CD\u5176\u4F59\u529F\u80FD\uFF09\uFF1B\u76F8\u673A\uFF08\u626B\u63CF\u914D\u5BF9\u4E8C\u7EF4\u7801\uFF09\uFF1B\u6587\u4EF6\u8BBF\u95EE\uFF08\u7CFB\u7EDF\u9009\u62E9\u5668\uFF0C\u7531\u60A8\u4E3B\u52A8\u6311\u9009\u672C\u5730\u65E5\u5FD7\u6587\u4EF6\u968F\u5DE5\u5355\u4E0A\u4F20\uFF0C\u81EA\u613F\uFF09\uFF1B\u524D\u53F0\u670D\u52A1\u4E0E\u5F00\u673A\u81EA\u542F\uFF08\u4FDD\u6301\u63A8\u9001\u8F6E\u8BE2\u4E0E\u8FDE\u63A5\u72B6\u6001\u68C0\u67E5\uFF0C\u53EF\u5728\u7CFB\u7EDF\u8BBE\u7F6E\u5173\u95ED\uFF0C\u63A8\u9001\u968F\u4E4B\u5931\u6548\uFF09\uFF1B\u7535\u6C60\u4F18\u5316\u8C41\u514D\uFF08\u53EF\u9009\uFF0C\u907F\u514D\u540E\u53F0\u8F6E\u8BE2\u88AB\u4F11\u7720\u4E2D\u65AD\uFF09\uFF1B\u7F51\u7EDC\uFF08\u4E0E\u60A8\u7684\u7535\u8111\u53CA\u5B98\u7F51\u901A\u4FE1\u7684\u57FA\u7840\u6743\u9650\uFF09\u3002",
        "\uFF08\u5341\uFF09\u539F\u5219\u58F0\u660E",
        "\u6211\u4EEC\u4E0D\u6536\u96C6\uFF1A\u771F\u5B9E\u59D3\u540D\u3001\u8EAB\u4EFD\u8BC1\u53F7\u3001\u901A\u8BAF\u5F55\u3001\u77ED\u4FE1\u3001\u901A\u8BDD\u8BB0\u5F55\u3001\u7CBE\u786E\u5730\u7406\u4F4D\u7F6E\u3001\u94F6\u884C\u5361\u4E0E\u652F\u4ED8\u6D41\u6C34\uFF1B\u4E0D\u4EE5\u5E7F\u544A\u8FFD\u8E2A\u6216\u5546\u4E1A\u53D8\u73B0\u4E3A\u76EE\u7684\u6536\u96C6\u4E2A\u4EBA\u4FE1\u606F\u3002"
      ]
    },
    {
      title: "\u4E09\u3001Cookie \u4E0E\u540C\u7C7B\u6280\u672F",
      paragraphs: [
        "\u6211\u4EEC\u53EF\u80FD\u901A\u8FC7 Cookie\u3001localStorage \u6216\u540C\u7C7B\u6280\u672F\u4FDD\u5B58\u5FC5\u8981\u72B6\u6001\uFF1A\u767B\u5F55/\u4F1A\u8BDD\u72B6\u6001\uFF08\u5982 30 \u5929\u8BB0\u5FC6 Cookie\u3001\u5B98\u7F51\u767B\u5F55\u4EE4\u724C\uFF09\u3001\u8BBE\u7F6E\u9879\u3001\u534F\u8BAE\u540C\u610F\u8BB0\u5F55\u3001\u672C\u5730\u914D\u5BF9\u72B6\u6001\u3002App \u7AEF\u7684\u767B\u5F55\u51ED\u636E\u4EE5\u52A0\u5BC6\u5F62\u5F0F\u4FDD\u5B58\u5728\u7CFB\u7EDF\u5E94\u7528\u79C1\u6709\u5B58\u50A8\u4E2D\uFF0C\u4E0D\u4E0E\u5176\u4ED6\u5E94\u7528\u5171\u4EAB\u3002",
        "\u6211\u4EEC\u4E0D\u4F1A\u5C06 Cookie \u7528\u4E8E\u672C\u653F\u7B56\u6240\u8FF0\u76EE\u7684\u4E4B\u5916\u7684\u7528\u9014\uFF0C\u4E0D\u7528\u4E8E\u8DE8\u7AD9\u5E7F\u544A\u8FFD\u8E2A\u6216\u4E0E\u771F\u5B9E\u8EAB\u4EFD\u4FE1\u606F\u4E0D\u5F53\u5173\u8054\u3002",
        "\u60A8\u53EF\u901A\u8FC7\u6D4F\u89C8\u5668\u6216\u7CFB\u7EDF\u8BBE\u7F6E\u62D2\u7EDD\u3001\u7BA1\u7406\u6216\u5220\u9664 Cookie \u4E0E\u672C\u5730\u5B58\u50A8\uFF1B\u505C\u7528\u540E\u53EF\u80FD\u9700\u8981\u91CD\u65B0\u9A8C\u8BC1\u6216\u91CD\u65B0\u540C\u610F\u534F\u8BAE\uFF0C\u90E8\u5206\u529F\u80FD\u53EF\u80FD\u65E0\u6CD5\u6B63\u5E38\u4F7F\u7528\u3002"
      ]
    },
    {
      title: "\u56DB\u3001\u5171\u4EAB\u3001\u8F6C\u79FB\u6216\u516C\u5F00",
      paragraphs: [
        "\u6211\u4EEC\u4EC5\u5728\u5408\u6CD5\u3001\u6B63\u5F53\u3001\u5FC5\u8981\u8303\u56F4\u5185\u5904\u7406\u4FE1\u606F\uFF0C\u4E0D\u4EE5\u5546\u4E1A\u5E7F\u544A\u6295\u653E\u6216\u4E2A\u6027\u5316\u63A8\u9001\u4E3A\u76EE\u7684\u5411\u7B2C\u4E09\u65B9\u5171\u4EAB\u60A8\u7684\u4E2A\u4EBA\u4FE1\u606F\u3002",
        "\u4E3A\u5B9E\u73B0\u670D\u52A1\uFF0C\u53EF\u80FD\u5411\u4EE5\u4E0B\u7B2C\u4E09\u65B9\u63D0\u4F9B\u6709\u9650\u4FE1\u606F\uFF1A\u90AE\u4EF6\u670D\u52A1\u5546\uFF08\u53D1\u9001\u6CE8\u518C/\u767B\u5F55/\u6539\u90AE\u7BB1\u9A8C\u8BC1\u7801\u65F6\uFF0C\u63D0\u4F9B\u6536\u4EF6\u90AE\u7BB1\u5730\u5740\u4E0E\u90AE\u4EF6\u5185\u5BB9\uFF09\uFF1Bip-api.com\uFF08\u67E5\u8BE2\u8BBF\u95EE\u6765\u6E90 IP \u7684\u5927\u81F4\u5F52\u5C5E\u5730\u7528\u4E8E\u7EDF\u8BA1\uFF0C\u4EC5\u63D0\u4F9B IP \u5730\u5740\u672C\u8EAB\uFF09\uFF1B\u4E91\u670D\u52A1\u5668\u3001frps \u96A7\u9053\u670D\u52A1\u7B49\u57FA\u7840\u8BBE\u65BD\uFF0C\u6211\u4EEC\u4F1A\u8BC4\u4F30\u5176\u5FC5\u8981\u6027\u5E76\u8981\u6C42\u5176\u91C7\u53D6\u4FDD\u62A4\u63AA\u65BD\u3002",
        "\u4EC5\u5728\u4E0B\u8FF0\u60C5\u5F62\u4E0B\u516C\u5F00\u4FE1\u606F\uFF1A\u4F9D\u60A8\u8981\u6C42\u5E76\u53D6\u5F97\u5355\u72EC\u540C\u610F\uFF1B\u4F9D\u6CD5\u6216\u5E94\u6267\u6CD5\u673A\u5173\u8981\u6C42\uFF1B\u4E3A\u4FDD\u62A4\u60A8\u6216\u4ED6\u4EBA\u751F\u547D\u8D22\u4EA7\u5B89\u5168\u6240\u5FC5\u9700\u3002",
        "\u5BF9\u5DF2\u533F\u540D\u5316\u4E14\u65E0\u6CD5\u590D\u539F\u8BC6\u522B\u7684\u4FE1\u606F\uFF0C\u5176\u5171\u4EAB/\u8F6C\u79FB/\u516C\u5F00\u4E0D\u89C6\u4E3A\u4E2A\u4EBA\u4FE1\u606F\u5BF9\u5916\u63D0\u4F9B\u3002"
      ]
    },
    {
      title: "\u4E94\u3001\u5B58\u50A8\u4E0E\u4FDD\u62A4",
      paragraphs: [
        "\uFF08\u4E00\uFF09\u5B58\u50A8",
        "\u672C\u5730\u8BB0\u5F55\uFF08\u4F1A\u8BDD\u3001\u8BBE\u5907\u3001\u4E8B\u4EF6\u3001\u9ED1\u540D\u5355\u3001\u65E5\u5FD7\uFF09\u4FDD\u5B58\u5728\u60A8\u672C\u673A\uFF0C\u968F\u672C\u673A\u6E05\u7406\u3001\u5378\u8F7D\u6216\u5220\u9664\u800C\u79FB\u9664\uFF1B\u5B98\u65B9\u6258\u7BA1\u6A21\u5F0F\u4E0B\u6309\u524D\u6587\u6240\u8FF0\u4E0A\u62A5\u7684\u6570\u636E\u4FDD\u5B58\u5728\u5B98\u65B9\u670D\u52A1\u5668\uFF08\u5BB9\u5668\u6570\u636E\u76EE\u5F55\uFF0C\u53EF\u9009\u6570\u636E\u5E93\uFF09\uFF0C\u5305\u62EC\u8D26\u53F7\u6570\u636E\u3001\u6D88\u606F\u4E2D\u5FC3\u3001\u5DE5\u5355\u4E0E\u9644\u4EF6\u3001\u90AE\u4EF6\u53D1\u9001\u7EDF\u8BA1\u3001\u5BA1\u8BA1\u4E0E\u5C01\u7981\u8BB0\u5F55\u3001\u9010\u8BF7\u6C42\u65E5\u5FD7\uFF08\u73AF\u5F62\u6700\u8FD1 5 \u4E07\u6761\uFF09\u3001\u8BBE\u5907\u660E\u7EC6\uFF08\u73AF\u5F62\u6700\u8FD1 200 \u6761\uFF09\u3001\u4F7F\u7528\u4F1A\u8BDD\u8BB0\u5F55\uFF08\u73AF\u5F62\u6700\u8FD1 2000 \u6761\uFF09\uFF0C\u5176\u4E2D\u8D26\u53F7\u6570\u636E\u4FDD\u7559\u81F3\u8D26\u53F7\u6CE8\u9500\u6216\u5220\u9664\uFF0C\u5DE5\u5355\u4E0E\u6D88\u606F\u4FDD\u7559\u81F3\u76F8\u5E94\u5185\u5BB9\u5220\u9664\u6216\u7BA1\u7406\u5458\u6E05\u7406\uFF0C\u5C01\u7981\u8BB0\u5F55\u6309\u5C01\u7981\u671F\u9650\u4FDD\u5B58\uFF08\u6700\u957F 10 \u5E74\uFF09\uFF1B\u81EA\u5EFA\u6A21\u5F0F\u4E0B\u8FD9\u4E9B\u6570\u636E\u53EA\u7559\u5B58\u5728\u60A8\u81EA\u5DF1\u7684\u670D\u52A1\u5668\u3002\u5728\u7EBF\u8FD0\u884C\u6001\u6570\u636E\u4EC5\u5728\u670D\u52A1\u8FD0\u884C\u671F\u95F4\u5B58\u5728\uFF0C\u4E0D\u505A\u5546\u4E1A\u7528\u9014\u3002",
        "\uFF08\u4E8C\uFF09\u4FDD\u62A4",
        "1. \u5F00\u53D1\u65B9\u5DF2\u5C3D\u5F53\u524D\u6280\u672F\u6761\u4EF6\u4E0B\u6700\u5927\u9650\u5EA6\u7684\u52AA\u529B\u4FDD\u62A4\u7528\u6237\u6570\u636E\u4E0E\u672C\u670D\u52A1\u7CFB\u7EDF\u5B89\u5168\uFF0C\u5177\u4F53\u5305\u62EC\uFF1A\u4F20\u8F93\u91C7\u7528\u52A0\u5BC6\u96A7\u9053\uFF08HTTPS/frp\uFF09\uFF0C\u7B7E\u540D\u91C7\u7528 HMAC-SHA256 \u6821\u9A8C\uFF1B\u5BC6\u7801\u4EE5\u6162\u54C8\u5E0C\uFF08argon2id/scrypt\uFF09\u4FDD\u5B58\uFF1B\u8D26\u53F7\u4E24\u6B65\u9A8C\u8BC1\u5BC6\u94A5\u4EE5 AES-256-GCM \u52A0\u5BC6\uFF1B\u767B\u5F55\u4EE4\u724C\u5E26\u7248\u672C\u53F7\uFF0C\u5F00\u542F/\u5173\u95ED\u4E24\u6B65\u9A8C\u8BC1\u6216\u7BA1\u7406\u5458\u64A4\u9500\u540E\u65E7\u4EE4\u724C\u7ACB\u5373\u5931\u6548\u3002",
        "2. \u5BC6\u94A5\u4E0E\u51ED\u636E\u4EE5\u53D7\u9650\u6587\u4EF6\u6743\u9650\u5B58\u50A8\uFF0C\u4E0D\u5199\u5165\u516C\u5F00\u4ED3\u5E93\uFF1B\u6700\u5C0F\u5316\u6388\u6743\u63A5\u89E6\u6570\u636E\u7684\u4EBA\u5458\u5E76\u8981\u6C42\u4FDD\u5BC6\uFF1B\u53D1\u751F\u5B89\u5168\u4E8B\u4EF6\u65F6\u7ACB\u5373\u5904\u7F6E\uFF0C\u5E76\u6309\u6CD5\u5F8B\u6CD5\u89C4\u8981\u6C42\u53CA\u65F6\u901A\u77E5\u53D7\u5F71\u54CD\u7528\u6237\u3002",
        "3. \u4E92\u8054\u7F51\u5E76\u975E\u7EDD\u5BF9\u5B89\u5168\u3002\u8BF7\u59A5\u5584\u4FDD\u7BA1\u8BBE\u5907\u3001\u914D\u5BF9\u94FE\u63A5\u3001Cookie\u3001\u767B\u5F55\u51ED\u636E\u4E0E\u9A8C\u8BC1\u7801/\u5907\u7528\u7801\uFF1B\u53D1\u73B0\u6CC4\u9732\u8BF7\u7ACB\u5373\u901A\u8FC7\u9762\u677F\u8E22\u51FA\u4F1A\u8BDD\u3001\u91CD\u7F6E\u4E24\u6B65\u9A8C\u8BC1\u5E76\u8F6E\u6362\u5BC6\u94A5\uFF0C\u5FC5\u8981\u65F6\u8054\u7CFB\u7BA1\u7406\u5458\u64A4\u9500\u5168\u90E8\u767B\u5F55\u3002",
        "4. \u5B89\u5168\u4E8B\u4EF6\u4E0E\u8D23\u4EFB\u9650\u5236\uFF1A\u5C3D\u7BA1\u91C7\u53D6\u4E86\u4E0A\u8FF0\u63AA\u65BD\uFF0C\u4EFB\u4F55\u7EC4\u7EC7\u6216\u4E2A\u4EBA\u5747\u65E0\u6CD5\u4FDD\u8BC1\u4FE1\u606F\u5B89\u5168\u7EDD\u5BF9\u65E0\u98CE\u9669\u3002\u56E0\u9ED1\u5BA2\u653B\u51FB\u3001\u7F51\u7EDC\u5165\u4FB5\u3001\u670D\u52A1\u5668\u88AB\u653B\u9677\u3001\u7CFB\u7EDF\u6216\u7B2C\u4E09\u65B9\u6545\u969C\u3001\u4E0D\u53EF\u6297\u529B\u7B49\u610F\u5916\u539F\u56E0\u5BFC\u81F4\u60A8\u7684\u4E2A\u4EBA\u4FE1\u606F\u6CC4\u9732\u3001\u4E22\u5931\u3001\u88AB\u7BE1\u6539\u6216\u88AB\u975E\u6CD5\u5229\u7528\u7684\uFF0C\u5728\u9002\u7528\u6CD5\u5F8B\u5141\u8BB8\u7684\u6700\u5927\u8303\u56F4\u5185\uFF0C\u5F00\u53D1\u65B9\u4E0D\u627F\u62C5\u8D54\u507F\u8D23\u4EFB\uFF08\u6CD5\u5F8B\u5F3A\u5236\u6027\u89C4\u5B9A\u53E6\u6709\u8981\u6C42\u7684\u9664\u5916\uFF09\uFF1B\u5F00\u53D1\u65B9\u5C06\u7ACB\u5373\u91C7\u53D6\u5904\u7F6E\u63AA\u65BD\uFF0C\u5E76\u6309\u6CD5\u5F8B\u6CD5\u89C4\u8981\u6C42\u53CA\u65F6\u901A\u77E5\u53D7\u5F71\u54CD\u7528\u6237\u3002",
        "5. \u8BBE\u5907\u5BC6\u94A5\uFF1A\u53D7\u4FE1\u8BBE\u5907\u7684\u8BBE\u5907\u5BC6\u94A5\u7531\u60A8\u7684\u672C\u673A\u751F\u6210\uFF0C\u4EC5\u4FDD\u5B58\u5728\u60A8\u7684\u8BBE\u5907\u4E0E\u60A8\u672C\u673A\uFF08\u6D4F\u89C8\u5668 IndexedDB\u3001App \u79C1\u6709\u5B58\u50A8\u3001\u672C\u673A\u8BBE\u5907\u6863\u6848\uFF09\uFF0C\u4E0D\u5B58\u50A8\u4E8E\u5B98\u65B9\u670D\u52A1\u5668\uFF1B\u8BF7\u6C42\u7B7E\u540D\u4E0E\u9632\u91CD\u653E\u6821\u9A8C\u4EC5\u5728\u672C\u673A\u5B8C\u6210\u3002"
      ]
    },
    {
      title: "\u516D\u3001\u60A8\u7684\u6743\u5229",
      paragraphs: [
        "\uFF08\u4E00\uFF09\u67E5\u9605\u4E0E\u63A7\u5236\uFF1A\u60A8\u53EF\u5728\u9762\u677F\u67E5\u770B\u5728\u7EBF/\u5386\u53F2\u8BBE\u5907\uFF0C\u4E3B\u52A8\u8E22\u51FA\u8BBE\u5907\u3001\u62C9\u9ED1 IP\u3001\u5168\u90E8\u8E22\u4E0B\u7EBF\uFF1B\u5728\u4E2A\u4EBA\u4E2D\u5FC3\u67E5\u770B\u767B\u5F55\u8BBE\u5907\u3001\u7528\u91CF\u4E0E\u9010\u8BF7\u6C42\u660E\u7EC6\uFF0C\u4FEE\u6539\u90AE\u7BB1\u3001\u5BC6\u7801\uFF0C\u5F00\u542F/\u5173\u95ED\u4E24\u6B65\u9A8C\u8BC1\uFF0C\u67E5\u770B\u4E0E\u6E05\u7A7A\u6D88\u606F\u3002\u4E0A\u8FF0\u8BB0\u5F55\u60A8\u53EF\u5728\u754C\u9762\u5185\u67E5\u770B\u5E76\u81EA\u884C\u590D\u5236\u4FDD\u5B58\uFF1B\u9700\u8981\u5176\u4ED6\u6570\u636E\u5BFC\u51FA\u534F\u52A9\u7684\uFF0C\u53EF\u901A\u8FC7\u5B98\u65B9\u6E20\u9053\u8054\u7CFB\u6211\u4EEC\u3002",
        "\uFF08\u4E8C\uFF09\u64A4\u56DE\u540C\u610F\uFF1A\u60A8\u53EF\u901A\u8FC7\u5173\u95ED\u63A8\u9001\u3001\u5173\u95ED\u4E24\u6B65\u9A8C\u8BC1\u3001\u505C\u6B62\u670D\u52A1\u3001\u5378\u8F7D\u63D2\u4EF6/App\u3001\u6E05\u9664\u672C\u5730\u6570\u636E\u7B49\u65B9\u5F0F\u64A4\u56DE\u6388\u6743\uFF1B\u5DE5\u5355\u8BCA\u65AD\u65E5\u5FD7\u4E0E\u65E5\u5FD7\u9644\u4EF6\u59CB\u7EC8\u662F\u300C\u9010\u6B21\u52FE\u9009\u786E\u8BA4\u300D\u540E\u624D\u4F1A\u4E0A\u4F20\uFF0C\u4E0D\u52FE\u9009\u5373\u4E0D\u9644\u5E26\uFF0C\u4E5F\u53EF\u5728\u5DE5\u5355\u4E2D\u8981\u6C42\u5220\u9664\u5DF2\u4E0A\u4F20\u7684\u65E5\u5FD7\u3002",
        "\uFF08\u4E09\uFF09\u5220\u9664\u4E0E\u6CE8\u9500\uFF1A\u672C\u5730\u4F1A\u8BDD\u3001\u4E8B\u4EF6\u4E0E\u8BBE\u5907\u8BB0\u5F55\u53EF\u968F\u8E22\u51FA\u4E0E\u6E05\u7406\u5220\u9664\uFF1B\u6E05\u9664\u7AD9\u70B9\u6570\u636E\u5373\u6E05\u9664\u672C\u5730 Cookie \u4E0E\u8BBE\u7F6E\u3002\u5982\u9700\u6CE8\u9500\u5B98\u7F51\u8D26\u53F7\u5E76\u5220\u9664\u670D\u52A1\u5668\u4E0A\u7684\u8D26\u53F7\u53CA\u5173\u8054\u6570\u636E\uFF0C\u8BF7\u901A\u8FC7\u5B98\u7F51\u6216\u9762\u677F\u300C\u5173\u4E8E\u300D\u4E2D\u7684\u8054\u7CFB\u65B9\u5F0F\u8054\u7CFB\u7BA1\u7406\u5458\uFF0C\u6838\u5B9E\u8EAB\u4EFD\u540E\u529E\u7406\uFF08\u5DE5\u5355\u9644\u4EF6\u968F\u5DE5\u5355\u5220\u9664\uFF09\u3002",
        "\uFF08\u56DB\uFF09\u54CD\u5E94\u4E0E\u4F8B\u5916\uFF1A\u5BF9\u91CD\u590D\u3001\u8D85\u8303\u56F4\u6216\u6EE5\u7528\u6743\u5229\u7684\u4E0D\u5408\u7406\u8BF7\u6C42\uFF0C\u53EF\u4F9D\u6CD5\u62D2\u7EDD\u6216\u6536\u53D6\u6210\u672C\u8D39\u7528\uFF1B\u6CD5\u5F8B\u53E6\u6709\u89C4\u5B9A\u7684\u4ECE\u5176\u89C4\u5B9A\u3002"
      ]
    },
    {
      title: "\u4E03\u3001\u672A\u6210\u5E74\u4EBA\u4FDD\u62A4",
      paragraphs: [
        LEGAL_AGE + "\uFF0C\u4E0D\u9762\u5411\u672A\u6210\u5E74\u4EBA\u63D0\u4F9B\u670D\u52A1\uFF0C\u6211\u4EEC\u4E0D\u4EE5\u9762\u5411\u672A\u6210\u5E74\u4EBA\u7684\u65B9\u5F0F\u6536\u96C6\u5176\u4FE1\u606F\u3002",
        "\u82E5\u60A8\u662F\u672A\u6210\u5E74\u4EBA\uFF0C\u8BF7\u7ACB\u5373\u505C\u6B62\u4F7F\u7528\uFF1B\u76D1\u62A4\u4EBA\u53D1\u73B0\u672A\u6210\u5E74\u4EBA\u4F7F\u7528\u7684\uFF0C\u53EF\u901A\u8FC7\u4E0B\u65B9\u6E20\u9053\u8054\u7CFB\u6211\u4EEC\uFF0C\u6211\u4EEC\u5C06\u5728\u6838\u5B9E\u540E\u5220\u9664\u76F8\u5173\u6570\u636E\u6216\u91C7\u53D6\u9650\u5236\u63AA\u65BD\u3002"
      ]
    },
    {
      title: "\u516B\u3001\u4FEE\u8BA2\u548C\u901A\u77E5",
      paragraphs: [
        "\u6211\u4EEC\u53EF\u80FD\u6839\u636E\u4EA7\u54C1\u66F4\u65B0\u53CA\u6CD5\u5F8B\u6CD5\u89C4\u9002\u65F6\u4FEE\u6539\u672C\u653F\u7B56\uFF0C\u5E76\u5728\u9762\u677F\u300C\u5173\u4E8E\u300D\u5185\u516C\u5E03\uFF1B\u91CD\u5927\u53D8\u66F4\u5C06\u663E\u8457\u63D0\u793A\u3002",
        "\u82E5\u60A8\u4E0D\u540C\u610F\u53D8\u66F4\uFF0C\u8BF7\u505C\u6B62\u4F7F\u7528\uFF1B\u7EE7\u7EED\u4F7F\u7528\u5373\u89C6\u4E3A\u77E5\u6089\u5E76\u63A5\u53D7\u66F4\u65B0\u540E\u7684\u653F\u7B56\u3002",
        "\u5982\u9700\u5C06\u4FE1\u606F\u7528\u4E8E\u672C\u653F\u7B56\u672A\u8F7D\u660E\u7684\u5176\u4ED6\u7528\u9014\uFF0C\u6216\u989D\u5916\u6536\u96C6\u672A\u63D0\u53CA\u7684\u4FE1\u606F\uFF0C\u5C06\u53E6\u884C\u5F81\u5F97\u540C\u610F\u3002"
      ]
    },
    {
      title: "\u4E5D\u3001\u5982\u4F55\u8054\u7CFB\u6211\u4EEC",
      paragraphs: [
        "\u5982\u60A8\u5BF9\u672C\u653F\u7B56\u6216\u4E2A\u4EBA\u4FE1\u606F\u4FDD\u62A4\u6709\u4EFB\u4F55\u7591\u95EE\u3001\u6295\u8BC9\u6216\u5EFA\u8BAE\uFF0C\u53EF\u901A\u8FC7\u4EE5\u4E0B\u5B98\u65B9\u6E20\u9053\u4E0E\u6211\u4EEC\u8054\u7CFB\uFF1A\u5B98\u7F51 https://remote.ymzcc.com\u3001\u5B98\u65B9 GitHub \u4ED3\u5E93 github.com/Memorial-coder/dsh-remote-plugin\u3001\u5B98\u65B9 QQ \u7FA4\uFF08\u901A\u8FC7\u5B98\u7F51\u6216 App\u300C\u5173\u4E8E\u300D\u4E2D\u7684\u52A0\u7FA4\u5165\u53E3\u52A0\u5165\uFF09\u3002\u6211\u4EEC\u5C06\u5728\u6838\u9A8C\u8EAB\u4EFD\u540E\u4E8E\u5341\u4E94\u4E2A\u5DE5\u4F5C\u65E5\u5185\u56DE\u590D\u3002",
        "\u5982\u5BF9\u6211\u4EEC\u7684\u56DE\u590D\u4E0D\u6EE1\u610F\uFF0C\u53EF\u5411\u6D88\u8D39\u8005\u6743\u76CA\u4FDD\u62A4\u90E8\u95E8\u6295\u8BC9\u6216\u5411\u6709\u7BA1\u8F96\u6743\u7684\u4EBA\u6C11\u6CD5\u9662\u63D0\u8D77\u8BC9\u8BBC\u3002",
        "\u672C\u9690\u79C1\u653F\u7B56\u6700\u7EC8\u89E3\u91CA\u6743\u5F52\u5F00\u53D1\u65B9\u6240\u6709\uFF08\u6CD5\u5F8B\u6CD5\u89C4\u53E6\u6709\u5F3A\u5236\u89C4\u5B9A\u7684\u9664\u5916\uFF09\u3002"
      ]
    }
  ]
};

// src/client/cards/about.jsx
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime13 = require("react/jsx-runtime");
function AboutPanel({ t, onClose, initialResult, onDismissUpdate, onCheckResult }) {
  const [checkState, setCheckState] = (0, import_react13.useState)(initialResult ? "done" : "idle");
  const [checkResult, setCheckResult] = (0, import_react13.useState)(initialResult || null);
  const [legalDoc, setLegalDoc] = (0, import_react13.useState)(null);
  const links = [
    { key: "website", href: ABOUT_LINKS.website, icon: "globe", label: t("aboutWebsite") },
    { key: "github", href: ABOUT_LINKS.github, icon: "link", label: t("aboutGithub") },
    { key: "app", href: ABOUT_LINKS.app, icon: "phone", label: t("aboutApp") },
    { key: "qq", href: ABOUT_LINKS.qq, icon: "group", label: t("aboutQq") }
  ];
  async function checkUpdate() {
    if (checkState === "loading") return;
    setCheckState("loading");
    setCheckResult(null);
    try {
      const r = await fetch(API_P + "/browserctl/api/update-check", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      setCheckResult(j);
      if (onCheckResult && j && j.ok) onCheckResult(j);
    } catch (e) {
      setCheckResult({ ok: false, error: String(e && e.message || e) });
    } finally {
      setCheckState("done");
    }
  }
  const err = checkResult && !checkResult.ok ? checkResult.error || t("updateFailed") : "";
  const hasUpdate = !!(checkResult && checkResult.ok && checkResult.hasUpdate);
  const upToDate = !!(checkResult && checkResult.ok && !checkResult.hasUpdate);
  const notes = hasUpdate && Array.isArray(checkResult.notes) ? checkResult.notes : [];
  const downloadUrl = hasUpdate ? checkResult.downloadUrl || ABOUT_LINKS.app : ABOUT_LINKS.app;
  const canApplyOneClick = !!(hasUpdate && checkResult.install && checkResult.install.form === "local" && !IS_TEST);
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(BaseModal, { t, title: t("about"), onClose, className: "dshBrowserCtlPanelNested", children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "dshBrowserCtlAboutApp", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "dshBrowserCtlAboutAppName", children: t("tab") }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("span", { className: "dshBrowserCtlAboutAppVersion", children: [
        "v",
        VERSION
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "dshBrowserCtlAboutDesc", children: t("aboutDesc") }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "dshBrowserCtlAboutLinks", children: links.map((l) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("a", { className: "dshBrowserCtlAboutLink", href: l.href, target: "_blank", rel: "noopener noreferrer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { "aria-hidden": "true", children: Svg[l.icon] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { children: l.label })
    ] }, l.key)) }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "dshBrowserCtlAboutLegal", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { type: "button", className: "dshBrowserCtlAboutLegalLink", onClick: () => setLegalDoc(LEGAL_TERMS), children: t("legalTerms") }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "dshBrowserCtlAboutLegalSep", "aria-hidden": "true", children: "\xB7" }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { type: "button", className: "dshBrowserCtlAboutLegalLink", onClick: () => setLegalDoc(LEGAL_PRIVACY), children: t("legalPrivacy") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "dshBrowserCtlAboutUpdate", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_dsh_client_ui_primitives3.Tooltip, { label: t("updateRecheckTip"), children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        Button,
        {
          variant: "secondary",
          size: "sm",
          className: "dshBrowserCtlAboutUpdateBtn",
          disabled: checkState === "loading",
          onClick: checkUpdate,
          children: checkState === "loading" ? t("updateChecking") : checkState === "done" ? t("updateRecheck") : t("updateCheck")
        }
      ) }),
      checkState === "done" && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, { children: [
        (hasUpdate || upToDate) && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "dshBrowserCtlAboutUpdateRow", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { children: t("updateCur") }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("span", { className: "dshBrowserCtlAboutUpdateVal", children: [
              "v",
              checkResult.current
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "dshBrowserCtlAboutUpdateRow", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { children: t("updateLst") }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("span", { className: "dshBrowserCtlAboutUpdateVal", children: [
              "v",
              checkResult.latest
            ] })
          ] })
        ] }),
        hasUpdate && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "dshBrowserCtlAboutUpdateFound", children: t("updateFound").replace("{v}", checkResult.latest) }),
          canApplyOneClick && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(UpdateApplyButton, { t, latest: String(checkResult.latest) }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "dshBrowserCtlUrlRow", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "dshBrowserCtlUrl", title: downloadUrl, children: downloadUrl }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_dsh_client_ui_primitives3.Tooltip, { label: t("updateDownloadTip"), children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Button, { variant: canApplyOneClick ? "secondary" : "primary", size: "sm", onClick: () => window.open(downloadUrl, "_blank"), children: t("updateDownload") }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "dshBrowserCtlAboutUpdateSep", "aria-hidden": "true" }),
          checkResult.install && checkResult.install.form === "local" && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { className: "dshBrowserCtlAboutUpdateGuide", children: [
            t("updateGuideLocal").replace("{dir}", checkResult.install && checkResult.install.dir || ""),
            IS_TEST ? t("updateGuideTestNote") : ""
          ] }),
          checkResult.install && checkResult.install.form === "package" && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "dshBrowserCtlAboutUpdateGuide", children: t("updateGuidePackage").replace("{cmd}", PLUGIN_ADD_CMD) }),
          notes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "dshBrowserCtlAboutUpdateLabel", children: t("updateNotesTitle") }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("ul", { className: "dshBrowserCtlAboutUpdateNotes", children: notes.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("li", { children: n }, i)) })
          ] }),
          onDismissUpdate && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "dshBrowserCtlAboutUpdateIgnoreRow", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_dsh_client_ui_primitives3.Tooltip, { label: t("updateIgnoreTip"), children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Button, { variant: "secondary", size: "sm", onClick: onDismissUpdate, children: t("updateIgnore") }) }) })
        ] }),
        upToDate && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "dshBrowserCtlAboutUpdateLatest", children: t("updateUpToDate") }),
        err && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "dshBrowserCtlAboutUpdateErr", children: err })
      ] })
    ] }),
    legalDoc && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(LegalDialog, { t, doc: legalDoc, onClose: () => setLegalDoc(null) })
  ] });
}
function LegalDialog({ t, doc, onClose }) {
  if (!doc) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(BaseModal, { t, title: doc.title, subtitle: t("legalMeta").replace("{d}", LEGAL_EFFECTIVE).replace("{v}", LEGAL_VERSION), onClose, className: "dshBrowserCtlPanelNested dshBrowserCtlLegalPanel", z: MODAL_Z_NESTED, children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "dshBrowserCtlLegalBody", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "dshBrowserCtlLegalSubtitle", children: doc.subtitle }),
      doc.sections.map((sec) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("section", { className: "dshBrowserCtlLegalSection", children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h3", { children: sec.title }),
        sec.paragraphs.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: p }, i))
      ] }, sec.title))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "dshBrowserCtlLegalFooter", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Button, { variant: "secondary", size: "sm", className: "dshBrowserCtlAboutUpdateBtn", onClick: onClose, children: t("legalAck") }) })
  ] });
}

// src/client/cards/config.jsx
var import_react14 = require("react");
var import_jsx_runtime14 = require("react/jsx-runtime");
function ConfigPanel({ t, onClose, onSaved }) {
  const [cfg, setCfg] = (0, import_react14.useState)(null);
  const [mode, setMode] = (0, import_react14.useState)("official");
  const [host, setHost] = (0, import_react14.useState)("");
  const [port, setPort] = (0, import_react14.useState)("17000");
  const [remotePort, setRemotePort] = (0, import_react14.useState)("");
  const [token, setToken] = (0, import_react14.useState)("");
  const [saving, setSaving] = (0, import_react14.useState)("");
  const [err, setErr] = (0, import_react14.useState)("");
  (0, import_react14.useEffect)(() => {
    let alive = true;
    fetch(API_P + "/browserctl/api/config", { cache: "no-store" }).then((r) => r.text().then((tx) => {
      try {
        return JSON.parse(tx);
      } catch {
        return { error: "HTTP " + r.status };
      }
    })).then((j) => {
      if (!alive) return;
      if (j.error) {
        setErr(j.error);
        return;
      }
      setCfg(j);
      setMode(j.mode === "selfhost" ? "selfhost" : "official");
      if (j.mode === "selfhost") {
        setHost(j.host || "");
        setPort(String(j.port || 17e3));
        setRemotePort(j.remotePort ? String(j.remotePort) : "");
      }
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, []);
  const save = async () => {
    if (saving === "loading") return;
    setErr("");
    const params = new URLSearchParams();
    if (mode === "selfhost") {
      const h = host.trim();
      if (!h) {
        setErr(t("configHostRequired"));
        return;
      }
      params.set("mode", "selfhost");
      params.set("host", h);
      params.set("port", String(parseInt(port, 10) || 17e3));
      if (remotePort.trim()) params.set("remotePort", String(parseInt(remotePort, 10) || ""));
    } else {
      params.set("mode", "official");
    }
    setSaving("loading");
    try {
      const r = await fetch(API_P + "/browserctl/api/config?" + params.toString(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(token ? { frp_token: token } : {}),
        cache: "no-store"
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) {
        setErr(j.error || "HTTP " + r.status);
        setSaving("");
        return;
      }
      setSaving("done");
      setToken("");
      onSaved();
      setTimeout(() => setSaving(""), 2200);
    } catch (e) {
      setErr(String(e && e.message || e));
      setSaving("");
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(BaseModal, { t, title: t("config"), subtitle: t("configSubtitle"), onClose, className: "dshBrowserCtlPanelNested dshBrowserCtlPanelCfg", children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "dshBrowserCtlCfgModes", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("label", { className: "dshBrowserCtlCfgMode", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("input", { type: "radio", name: "browserctl-mode", checked: mode === "official", onChange: () => setMode("official") }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "dshBrowserCtlCfgModeTitle", children: t("configOfficial") }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "dshBrowserCtlCfgModeDesc", children: t("configOfficialHint") })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("label", { className: "dshBrowserCtlCfgMode", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("input", { type: "radio", name: "browserctl-mode", checked: mode === "selfhost", onChange: () => setMode("selfhost") }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "dshBrowserCtlCfgModeTitle", children: t("configSelfhost") }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "dshBrowserCtlCfgModeDesc", children: t("configSelfhostHint") })
        ] })
      ] })
    ] }),
    mode === "official" ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: "dshBrowserCtlCfgOfficialNote", children: t("configOfficialNote") }) : /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "dshBrowserCtlCfgFields", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: t("configHost") }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("input", { value: host, onChange: (e) => setHost(e.target.value), placeholder: t("configHostPh"), spellCheck: false })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "dshBrowserCtlCfgFieldRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: t("configPort") }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("input", { value: port, onChange: (e) => setPort(e.target.value), inputMode: "numeric" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: t("configRemotePort") }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("input", { value: remotePort, onChange: (e) => setRemotePort(e.target.value), inputMode: "numeric" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: t("configToken") }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
          "input",
          {
            type: "password",
            value: token,
            onChange: (e) => setToken(e.target.value),
            placeholder: cfg && cfg.hasToken ? t("configTokenKeep") : t("configTokenPh"),
            autoComplete: "new-password",
            spellCheck: false
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: "dshBrowserCtlCfgNote", children: t("configTokenNote") })
    ] }),
    err && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: "dshBrowserCtlCfgErr", children: err }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "dshBrowserCtlCfgActions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Button, { variant: "secondary", size: "sm", className: "dshBrowserCtlCfgSave", disabled: saving === "loading", onClick: onClose, children: t("cancel") }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Button, { variant: "primary", size: "sm", className: "dshBrowserCtlCfgSave", disabled: saving === "loading", onClick: save, children: saving === "loading" ? t("saving") : saving === "done" ? /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_jsx_runtime14.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { "aria-hidden": "true", children: Svg.check }),
        t("saved")
      ] }) : t("save") })
    ] })
  ] });
}

// src/client/cards/account.jsx
var import_react15 = require("react");
var import_jsx_runtime15 = require("react/jsx-runtime");
function OfficialAccountCard({ t, onSaved }) {
  const [acct, setAcct] = (0, import_react15.useState)(null);
  const [busy, setBusy] = (0, import_react15.useState)("");
  const [err, setErr] = (0, import_react15.useState)("");
  const [msg, setMsg] = (0, import_react15.useState)("");
  const [pending, setPending] = (0, import_react15.useState)(null);
  const pollTimer = (0, import_react15.useRef)(null);
  const pendingRef = (0, import_react15.useRef)(null);
  const [copiedOauth, setCopiedOauth] = useToast(1600);
  const [pwdEmail, setPwdEmail] = (0, import_react15.useState)("");
  const [pwdPass, setPwdPass] = (0, import_react15.useState)("");
  const [busyLogin, setBusyLogin] = (0, import_react15.useState)(false);
  const pwdLogin = async () => {
    if (busyLogin || !pwdEmail.trim() || !pwdPass) return;
    setBusyLogin(true);
    setErr("");
    setMsg("");
    try {
      const r = await fetch(API_P + "/browserctl/api/server/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: pwdEmail.trim(), password: pwdPass }),
        cache: "no-store"
      });
      const j = await r.json().catch(() => ({}));
      if (j && j.ok) {
        setMsg(t("configAcctOauthDone"));
        setPwdEmail("");
        setPwdPass("");
        onSaved();
        const okRestart = await restartTunnel();
        if (!okRestart) {
          setErr(t("configAcctRestartFail"));
          setMsg("");
        }
      } else {
        setErr(j && j.error || "HTTP " + r.status);
      }
    } catch (e) {
      setErr(String(e && e.message || e));
    }
    setBusyLogin(false);
  };
  const loadAcct = async () => {
    try {
      const r = await fetch(API_P + "/browserctl/api/server/me", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (j && j.loggedIn) {
        setAcct({ email: j.email, remotePort: j.remotePort, status: j.status });
      } else if (j && j.ok === false && j.error) {
        setErr(t("configAcctLoadFail"));
      } else {
        setAcct(null);
      }
    } catch (e) {
      setErr(t("configAcctLoadFail"));
    }
  };
  (0, import_react15.useEffect)(() => {
    loadAcct();
  }, []);
  const clearPoll = () => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
    pendingRef.current = null;
  };
  (0, import_react15.useEffect)(() => () => clearPoll(), []);
  const restartTunnel = async () => {
    try {
      await fetch(API_P + "/browserctl/api/stop", { method: "POST", cache: "no-store" });
      await new Promise((r) => setTimeout(r, 1500));
      await fetch(API_P + "/browserctl/api/ensure", { method: "POST", cache: "no-store" });
      return true;
    } catch (e) {
      return false;
    }
  };
  const openAuthPage = async (url) => {
    if (!url) return false;
    try {
      const r = await fetch(API_P + "/browserctl/api/server/oauth/open?url=" + encodeURIComponent(url), { method: "POST", cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setErr(j && j.error || t("configAcctOauthOpenFail"));
        return false;
      }
      setErr("");
      return true;
    } catch (e) {
      setErr(t("configAcctOauthOpenFail"));
      return false;
    }
  };
  const copyOauthUrl = (url) => {
    if (!url) return;
    navigator.clipboard?.writeText(url).then(() => setCopiedOauth(true)).catch(() => {
    });
  };
  const poll = async () => {
    const pd = pendingRef.current;
    if (!pd) return;
    try {
      const r = await fetch(API_P + "/browserctl/api/server/oauth/poll?device_code=" + encodeURIComponent(pd.deviceCode), { method: "POST", cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (j && j.ok) {
        clearPoll();
        setPending(null);
        pendingRef.current = null;
        setAcct({ email: j.email, remotePort: j.remotePort });
        setMsg(t("configAcctOauthDone"));
        onSaved();
        const okRestart = await restartTunnel();
        if (!okRestart) {
          setErr(t("configAcctRestartFail"));
          setMsg("");
        }
        setBusy("");
        return;
      }
      if (j && j.pending) {
        const interval = Math.max(3, Number(j.interval) || 5) * 1e3;
        pollTimer.current = setTimeout(poll, interval);
        return;
      }
      clearPoll();
      setPending(null);
      setBusy("");
      setErr(j && j.error ? t("configAcctOauthFail") + " " + j.error : t("configAcctOauthExpired"));
    } catch (e) {
      clearPoll();
      setPending(null);
      setBusy("");
      setErr(t("configAcctOauthNetwork"));
    }
  };
  const startOAuth = async () => {
    if (busy) return;
    setErr("");
    setMsg("");
    setBusy("begin");
    try {
      const r = await fetch(API_P + "/browserctl/api/server/oauth/begin", { method: "POST", cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setErr(j.error || "HTTP " + r.status);
        setBusy("");
        return;
      }
      setPending({
        deviceCode: j.deviceCode,
        userCode: j.userCode,
        verificationUri: j.verificationUri,
        interval: Math.max(3, Number(j.interval) || 5)
      });
      pendingRef.current = { deviceCode: j.deviceCode, userCode: j.userCode, verificationUri: j.verificationUri };
      setBusy("polling");
      await openAuthPage(j.verificationUri);
      pollTimer.current = setTimeout(poll, 1500);
    } catch (e) {
      setErr(t("configAcctOauthNetwork"));
      setBusy("");
    }
  };
  const cancelOAuth = () => {
    clearPoll();
    setPending(null);
    pendingRef.current = null;
    setBusy("");
  };
  const logout = async () => {
    if (busy) return;
    setErr("");
    setMsg("");
    setBusy("logout");
    try {
      await fetch(API_P + "/browserctl/api/server/logout", { method: "POST", cache: "no-store" });
      setAcct(null);
      setMsg(t("configAcctLoggedOut"));
      onSaved();
    } catch (e) {
      setErr(String(e && e.message || e));
    }
    setBusy("");
  };
  const working = busy !== "";
  if (acct) {
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "dshBrowserCtlCfgFields", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "dshBrowserCtlCfgFieldRow", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: t("configAcctTitle") }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { className: "dshBrowserCtlCfgAcctLine", children: [
          t("configAcctLoggedIn"),
          " \xB7 ",
          acct.email,
          Number(acct.remotePort) > 0 ? " \xB7 " + t("configAcctPort") + " " + acct.remotePort : ""
        ] })
      ] }) }),
      msg && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "dshBrowserCtlCfgNote", children: msg }),
      err && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "dshBrowserCtlCfgErr", children: err }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Button, { variant: "secondary", size: "sm", disabled: working, onClick: logout, children: busy === "logout" ? t("configAcctLoggingOut") : t("configAcctLogout") })
    ] });
  }
  if (pending) {
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "dshBrowserCtlCfgFields", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: t("configAcctTitle") }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "dshBrowserCtlCfgAcctLine", children: t("configAcctOauthWait") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "dshBrowserCtlCfgNote", children: t("configAcctOauthOpenBrowser") }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "dshBrowserCtlCfgOauthCode", children: pending.userCode }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "dshBrowserCtlCfgNote", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("a", { href: pending.verificationUri, target: "_blank", rel: "noopener noreferrer", className: "dshBrowserCtlAcctLink", children: pending.verificationUri }) }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "dshBrowserCtlCfgFieldRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Button, { variant: "secondary", size: "sm", onClick: () => openAuthPage(pending.verificationUri), children: t("configAcctOauthOpenAgain") }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Button, { variant: "secondary", size: "sm", onClick: () => copyOauthUrl(pending.verificationUri), children: copiedOauth ? t("configAcctCopied") : t("configAcctCopy") }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Button, { variant: "secondary", size: "sm", onClick: cancelOAuth, children: t("configAcctOauthCancel") })
      ] }),
      msg && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "dshBrowserCtlCfgNote", children: msg }),
      err && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "dshBrowserCtlCfgErr", children: err })
    ] });
  }
  const busyPwd = busyLogin || pwdEmail.trim() === "" || pwdPass === "";
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "dshBrowserCtlCfgFields", children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: t("configAcctTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "dshBrowserCtlCfgAcctLine", children: t("configAcctOauthHint") })
    ] }),
    msg && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "dshBrowserCtlCfgNote", children: msg }),
    err && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "dshBrowserCtlCfgErr", children: err }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "dshBrowserCtlCfgFieldRow", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Button, { variant: "primary", size: "sm", disabled: working, onClick: startOAuth, children: busy === "begin" ? t("configAcctOauthOpening") : t("configAcctOauthBtn") }) }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "dshBrowserCtlAcctOr", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "dshBrowserCtlAcctOrLine", "aria-hidden": "true" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: t("loginOr") }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "dshBrowserCtlAcctOrLine", "aria-hidden": "true" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: t("loginPwdTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        "input",
        {
          type: "email",
          autoComplete: "username",
          placeholder: t("loginEmail"),
          className: "dshBrowserCtlAcctInput",
          value: pwdEmail,
          onChange: (e) => setPwdEmail(e.target.value),
          disabled: !!busy || busyLogin
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: t("loginPassword") }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        "input",
        {
          type: "password",
          autoComplete: "current-password",
          placeholder: t("loginPassword"),
          className: "dshBrowserCtlAcctInput",
          value: pwdPass,
          onChange: (e) => setPwdPass(e.target.value),
          disabled: !!busy || busyLogin
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "dshBrowserCtlCfgFieldRow", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Button, { variant: "secondary", size: "sm", disabled: !!busy || busyPwd, onClick: pwdLogin, children: busyLogin ? t("loginLoggingIn") : t("loginBtn") }) })
  ] });
}
function AccountLoginModal({ t, onClose, onSaved }) {
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(BaseModal, { t, title: t("configAcctTitle"), subtitle: t("configOfficialHint"), onClose, className: "dshBrowserCtlPanelNested dshBrowserCtlPanelCfg", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(OfficialAccountCard, { t, onSaved }) });
}

// src/client/cards/msg.jsx
var import_react16 = require("react");
var import_dsh_client_ui_primitives4 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime16 = require("react/jsx-runtime");
function MsgCenter({ t, loggedInHint, onClose, anchorRef }) {
  const [msgs, setMsgs] = (0, import_react16.useState)(null);
  const [feed, setFeed] = (0, import_react16.useState)(null);
  const [err, setErr] = (0, import_react16.useState)("");
  const [loggedIn, setLoggedIn] = (0, import_react16.useState)(false);
  const [tab, setTab] = (0, import_react16.useState)("official");
  const [detail, setDetail] = (0, import_react16.useState)(null);
  const popRef = (0, import_react16.useRef)(null);
  const [popStyle, setPopStyle] = (0, import_react16.useState)(null);
  (0, import_react16.useLayoutEffect)(() => {
    const anchor = anchorRef && anchorRef.current;
    if (!anchor) return;
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      if (!r || !r.width && !r.height || !vw || !vh) return;
      let z = 1;
      try {
        z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      } catch (e) {
      }
      const w = Math.min(340, vw - 16) / z;
      const right = Math.max(8, vw - r.right) / z;
      const below = (vh - r.bottom - 12) / z;
      const above = (r.top - 12) / z;
      const up = below < 220 && above > below;
      const maxH = Math.max(180, Math.min(480, up ? above : below));
      setPopStyle(up ? { position: "fixed", right, bottom: (vh - r.top + 6) / z, maxHeight: maxH, width: w } : { position: "fixed", right, top: (r.bottom + 6) / z, maxHeight: maxH, width: w });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [anchorRef]);
  (0, import_react16.useEffect)(() => {
    const onScroll = (e) => {
      const node = popRef.current;
      if (node && e.target && e.target.nodeType === 1 && node.contains(e.target)) return;
      onClose();
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [onClose]);
  (0, import_react16.useEffect)(() => {
    let alive = true;
    fetch(API_P + "/browserctl/api/server/messages", { cache: "no-store" }).then((r) => r.json().catch(() => ({ ok: false, error: "HTTP " + r.status }))).then((j) => {
      if (!alive) return;
      if (!j || j.ok === false) {
        setErr(j && j.error || t("msgLoadFail"));
        setMsgs([]);
        return;
      }
      setErr("");
      setLoggedIn(!!j.loggedIn);
      setMsgs(Array.isArray(j.messages) ? j.messages : []);
    }).catch((e) => {
      if (alive) {
        setErr(String(e && e.message || e));
        setMsgs([]);
      }
    });
    fetch(API_P + "/browserctl-gate/push-poll?last=0", { cache: "no-store" }).then((r) => r.json().catch(() => ({}))).then((j) => {
      if (alive) setFeed(j && j.ok && Array.isArray(j.items) ? j.items : []);
    }).catch(() => {
      if (alive) setFeed([]);
    });
    return () => {
      alive = false;
    };
  }, []);
  (0, import_react16.useEffect)(() => {
    if (!msgs || !msgs.length) return;
    const maxTs = msgs.reduce((m, x) => Math.max(m, Number(x.createdAt) || 0), 0);
    lsSet(MSG_SEEN_KEY, String(maxTs));
    if (loggedIn) fetch(API_P + "/browserctl/api/server/messages/read", { method: "POST", cache: "no-store" }).catch(() => {
    });
  }, [msgs, loggedIn]);
  const entries = buildMsgEntries(msgs || [], feed || []);
  const counts = { official: 0, mine: 0, feed: 0 };
  for (const e of entries) counts[e.cat]++;
  const visible = entries.filter((e) => e.cat === tab);
  const emptyText = tab === "official" ? t("msgEmptyOfficial") : tab === "feed" ? feed === null ? t("ticketLoading") : t("msgEmptyFeed") : t("msgEmptyMine");
  const switchTab = (next) => {
    if (tab !== next) {
      setTab(next);
      setDetail(null);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { className: "dshBrowserCtlMsgMask", type: "button", "aria-label": t("close"), onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { ref: popRef, className: "dshBrowserCtlMsgPop", style: popStyle || void 0, role: "dialog", "aria-label": t("msgCenter"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "dshBrowserCtlMsgPopHead", children: [
        detail ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { type: "button", className: "dshBrowserCtlMsgBack", "aria-label": t("msgBack"), onClick: () => setDetail(null), children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M9 2.5 4.5 7 9 11.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "dshBrowserCtlMsgPopTitle", children: t("msgCenter") }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Button, { variant: "ghost", size: "sm", "aria-label": t("close"), icon: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_dsh_client_ui_primitives4.IconCloseOutlineRegular, {}), onClick: onClose })
      ] }),
      detail ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(MsgDetail, { t, e: detail }) : /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "dshBrowserCtlMsgTabs", role: "tablist", "aria-label": t("msgCenter"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": tab === "official",
              className: "dshBrowserCtlMsgTab",
              "data-on": tab === "official" ? "true" : "false",
              onClick: () => switchTab("official"),
              children: [
                t("msgOfficial"),
                counts.official ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "dshBrowserCtlMsgTabN", children: counts.official }) : null
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": tab === "mine",
              className: "dshBrowserCtlMsgTab",
              "data-on": tab === "mine" ? "true" : "false",
              onClick: () => switchTab("mine"),
              children: [
                t("msgPersonal"),
                counts.mine ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "dshBrowserCtlMsgTabN", children: counts.mine }) : null
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": tab === "feed",
              className: "dshBrowserCtlMsgTab",
              "data-on": tab === "feed" ? "true" : "false",
              onClick: () => switchTab("feed"),
              children: [
                t("msgTabFeed"),
                counts.feed ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "dshBrowserCtlMsgTabN", children: counts.feed }) : null
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "dshBrowserCtlMsgList", children: msgs === null || tab === "feed" && feed === null ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "dshBrowserCtlMsgEmpty", children: t("ticketLoading") }) : !visible.length ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "dshBrowserCtlMsgEmpty", children: emptyText }) : visible.map((e) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(MsgRow, { t, e, onOpen: () => setDetail(e) }, e.id || e.cat + "-" + e.ts + "-" + (e.title || ""))) }),
        err ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("p", { className: "dshBrowserCtlMsgErr", children: [
          t("msgLoadFail"),
          ": ",
          err
        ] }) : null,
        !loggedIn && !err ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "dshBrowserCtlMsgFoot", children: loggedInHint }) : null
      ] })
    ] })
  ] });
}
function MsgRow({ t, e, onOpen }) {
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("button", { type: "button", className: "dshBrowserCtlMsgItem", "data-unread": e.unread ? "true" : "false", onClick: onOpen, children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("span", { className: "dshBrowserCtlMsgRow1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "dshBrowserCtlMsgKindTag", "data-cat": e.cat, "data-style": e.style, children: t(e.kindKey) }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "dshBrowserCtlMsgTime", children: fmtAbsolute(e.ts, "short") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("span", { className: "dshBrowserCtlMsgTitle", children: [
      e.unread ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "dshBrowserCtlMsgUnreadDot", "aria-hidden": "true" }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "dshBrowserCtlMsgTitleText", children: e.title || t("msgNoTitle") })
    ] }),
    e.body ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "dshBrowserCtlMsgBody", children: e.body }) : null
  ] });
}
function MsgDetail({ t, e }) {
  const st = MSG_STYLE_MAP[e.style] || MSG_STYLE_MAP.info;
  const head = t(e.kindKey) + (st.label ? " \xB7 " + t(st.label) : "");
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "dshBrowserCtlMsgDetail", children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "dshBrowserCtlMsgKindTag", "data-cat": e.cat, "data-style": e.style, children: head }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "dshBrowserCtlMsgDTitle", children: e.title || t("msgNoTitle") }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "dshBrowserCtlMsgDMeta", children: fmtAbsolute(e.ts) }),
    e.body ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "dshBrowserCtlMsgDBody", children: e.body }) : null,
    e.links.length ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "dshBrowserCtlMsgDBtns", children: e.links.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("a", { className: "dshBrowserCtlMsgDBtn", href: l.url, target: "_blank", rel: "noopener noreferrer", children: l.label || t("msgOpenLink") }, i)) }) : null
  ] });
}

// src/client/cards/ticket.jsx
var import_react17 = require("react");
var import_jsx_runtime17 = require("react/jsx-runtime");
var TICKET_PAGE_URL = "https://remote.ymzcc.com/dsh-remote/app.html#tickets";
async function ticketCopyText(s) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(s);
      return true;
    }
  } catch (e) {
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = s;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}
function TicketModal({ t, onClose }) {
  const [busy, setBusy] = (0, import_react17.useState)("");
  const [err, setErr] = (0, import_react17.useState)("");
  const [info, setInfo] = (0, import_react17.useState)("");
  const [exported, setExported] = (0, import_react17.useState)(null);
  const [pickMode, setPickMode] = (0, import_react17.useState)(false);
  const [pickPath, setPickPath] = (0, import_react17.useState)("");
  const doExport = async (dir, tag) => {
    if (busy) return;
    setBusy(tag || "export");
    setErr("");
    setInfo("");
    try {
      const q = "?withText=1" + (dir ? "&dir=" + encodeURIComponent(dir) : "");
      const r = await fetch(API_P + "/browserctl/api/ticket/export-diag" + q, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setErr(r.status === 404 ? t("ticketExportHostOld") : j && j.error || "HTTP " + r.status);
        return;
      }
      setExported(j);
      setPickMode(false);
      if (dir) setInfo(t("ticketSaveOk") + (j.path || ""));
    } catch (e) {
      setErr(String(e && e.message || e));
    } finally {
      setBusy("");
    }
  };
  const openWeb = () => {
    try {
      window.open(TICKET_PAGE_URL, "_blank", "noopener");
    } catch (e) {
    }
  };
  const revealFolder = async () => {
    if (!exported || busy) return;
    setBusy("reveal");
    setErr("");
    setInfo("");
    try {
      const r = await fetch(API_P + "/browserctl/api/ticket/reveal?path=" + encodeURIComponent(exported.path || ""), { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j && j.error || "HTTP " + r.status);
    } catch (e) {
      setErr(String(e && e.message || e));
    } finally {
      setBusy("");
    }
  };
  const copyContent = async () => {
    if (!exported) return;
    if (!exported.content) {
      setErr(t("ticketNoContent"));
      return;
    }
    const ok = await ticketCopyText(exported.content);
    setErr("");
    setInfo(ok ? t("ticketCopyOk") : t("ticketCopyFail"));
  };
  const copyPath = async () => {
    if (!exported) return;
    const ok = await ticketCopyText(exported.path || "");
    if (ok) {
      setErr("");
      setInfo(t("ticketCopyPathOk"));
    }
  };
  const saveToFolder = async () => {
    if (!exported || busy) return;
    if (!exported.content) {
      setErr(t("ticketNoContent"));
      return;
    }
    if (typeof window.showDirectoryPicker === "function") {
      try {
        const dir = await window.showDirectoryPicker();
        const fh = await dir.getFileHandle(exported.name, { create: true });
        const w = await fh.createWritable();
        await w.write(exported.content || "");
        await w.close();
        setErr("");
        setInfo(t("ticketSaveOk") + exported.name);
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    setPickMode(true);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(BaseModal, { t, title: t("tickets"), subtitle: t("ticketExportSubtitle"), onClose, className: "dshBrowserCtlPanelNested dshBrowserCtlPanelTicket", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "dshBrowserCtlTicketBody", children: [
    err ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "dshBrowserCtlCfgErr", children: err }) : null,
    info ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "dshBrowserCtlCfgNote", children: info }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "dshBrowserCtlActions dshBrowserCtlTicketActions", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Button, { variant: "primary", size: "sm", disabled: !!busy, onClick: () => doExport("", "export"), children: busy === "export" ? /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "dshBrowserCtlSpinner", "aria-hidden": "true" }),
      " ",
      t("ticketExporting")
    ] }) : exported ? t("ticketExportAgain") : t("ticketExportDo") }) }),
    exported ? /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "dshBrowserCtlTicketDone", children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "dshBrowserCtlTicketDoneTitle", children: t("ticketExportDone") }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "dshBrowserCtlTicketDonePath", children: exported.path }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "dshBrowserCtlTicketDoneBtns", children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Button, { variant: "secondary", size: "sm", disabled: !!busy, onClick: revealFolder, children: busy === "reveal" ? /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "dshBrowserCtlSpinner", "aria-hidden": "true" }),
          " ",
          t("ticketOpening")
        ] }) : t("ticketOpenFolder") }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Button, { variant: "secondary", size: "sm", onClick: copyPath, children: t("ticketCopyPath") })
      ] })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "dshBrowserCtlTicketDestHead", children: t("ticketDestTitle") }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("button", { type: "button", className: "dshBrowserCtlTicketDest", onClick: openWeb, children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "dshBrowserCtlTicketDestTitle", children: t("ticketOpenWeb") }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "dshBrowserCtlTicketDestDesc", children: t("ticketOpenWebDesc") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("button", { type: "button", className: "dshBrowserCtlTicketDest", disabled: !exported, onClick: saveToFolder, children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "dshBrowserCtlTicketDestTitle", children: t("ticketSaveOther") }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "dshBrowserCtlTicketDestDesc", children: t("ticketSaveOtherDesc") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("button", { type: "button", className: "dshBrowserCtlTicketDest", disabled: !exported, onClick: copyContent, children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "dshBrowserCtlTicketDestTitle", children: t("ticketCopyContent") }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "dshBrowserCtlTicketDestDesc", children: t("ticketCopyContentDesc") })
    ] }),
    pickMode ? /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "dshBrowserCtlTicketPickRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
        "input",
        {
          className: "dshBrowserCtlTicketInput dshBrowserCtlTicketPickInput",
          placeholder: t("ticketSavePathPh"),
          value: pickPath,
          onChange: (e) => setPickPath(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (pickPath.trim()) doExport(pickPath.trim(), "save");
            }
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Button, { variant: "secondary", size: "sm", disabled: !!busy || !pickPath.trim(), onClick: () => doExport(pickPath.trim(), "save"), children: busy === "save" ? /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "dshBrowserCtlSpinner", "aria-hidden": "true" }),
        " ",
        t("ticketSaving")
      ] }) : t("ticketSaveGo") })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "dshBrowserCtlCfgNote dshBrowserCtlTicketNoteEnd", children: t("ticketExportNote") })
  ] }) });
}

// src/client/overlay.jsx
var import_jsx_runtime18 = require("react/jsx-runtime");
function BrowserCtlOverlay({ useStore, actions, t, initialTab }) {
  const open = useStore((state) => state.open);
  const [reloadToken, setReloadToken] = (0, import_react18.useState)(0);
  const [copied, setCopied] = (0, import_react18.useState)(false);
  const [busy, setBusy] = (0, import_react18.useState)("");
  const [tab, setTab] = (0, import_react18.useState)(initialTab || "connect");
  const [uses, setUses] = (0, import_react18.useState)(1);
  const [aboutOpen, setAboutOpen] = (0, import_react18.useState)(false);
  const [configOpen, setConfigOpen] = (0, import_react18.useState)(false);
  const [accountOpen, setAccountOpen] = (0, import_react18.useState)(false);
  const [loginPrompt, setLoginPrompt] = (0, import_react18.useState)(false);
  const [ticketOpen, setTicketOpen] = (0, import_react18.useState)(false);
  const [startErr, setStartErr] = (0, import_react18.useState)("");
  const [canElevate, setCanElevate] = (0, import_react18.useState)(false);
  const [elevNeed, setElevNeed] = (0, import_react18.useState)("");
  const [acctMe, setAcctMe] = (0, import_react18.useState)(null);
  const [msgData, setMsgData] = (0, import_react18.useState)({ messages: [], loggedIn: false, unread: 0 });
  const [msgPopOpen, setMsgPopOpen] = (0, import_react18.useState)(false);
  const [cfgMode, setCfgMode] = (0, import_react18.useState)("official");
  const [updateInfo, setUpdateInfo] = (0, import_react18.useState)(null);
  const [updTick, setUpdTick] = (0, import_react18.useState)(0);
  const pluginUpdatePending = !!(updateInfo && updateInfo.hasUpdate && updateInfo.latest && lsGet("dsh_plugin_upd_dismiss_" + updateInfo.latest) !== "1");
  const [updPromptClosed, setUpdPromptClosed] = (0, import_react18.useState)("");
  const [pairSeg, setPairSeg] = (0, import_react18.useState)("temp");
  const [pairSetOpen, setPairSetOpen] = (0, import_react18.useState)(false);
  const [stopConfirm, setStopConfirm] = (0, import_react18.useState)(false);
  const [settingsOpen, setSettingsOpen] = (0, import_react18.useState)(false);
  const [legalDoc, setLegalDoc] = (0, import_react18.useState)(null);
  const pluginUpdPrompt = !!(pluginUpdatePending && open && !IS_TEST && (!updateInfo || updPromptClosed !== String(updateInfo.latest)));
  const pluginUpdNotes = (updateInfo && Array.isArray(updateInfo.notes) ? updateInfo.notes : []).slice(0, 3);
  const pluginUpdUrl = updateInfo && updateInfo.downloadUrl || "";
  const dismissPluginUpdate = () => {
    if (updateInfo && updateInfo.latest) {
      lsSet("dsh_plugin_upd_dismiss_" + updateInfo.latest, "1");
      setUpdTick((x) => x + 1);
    }
  };
  const panel = (0, import_react18.useRef)(null);
  const bellRef = (0, import_react18.useRef)(null);
  const { data, error, expiresAt, status, retrying, refresh } = useQr(open, reloadToken, uses);
  const left = useCountdown(expiresAt);
  const run = async (label, fn) => {
    if (busy) return;
    setBusy(label);
    try {
      await fn();
    } finally {
      setBusy("");
    }
  };
  const refreshAll = () => run("refresh", async () => {
    await new Promise((r) => setTimeout(r, 60));
    setReloadToken((x) => x + 1);
  });
  const loadAcctMe = async () => {
    try {
      const r = await fetch(API_P + "/browserctl/api/server/me", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      setAcctMe(j && j.loggedIn ? j : null);
    } catch {
      setAcctMe(null);
    }
  };
  (0, import_react18.useEffect)(() => {
    if (open) loadAcctMe();
  }, [open, reloadToken]);
  const loadMsgs = async () => {
    try {
      const r = await fetch(API_P + "/browserctl/api/server/messages", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (j && j.ok) setMsgData({ messages: Array.isArray(j.messages) ? j.messages : [], loggedIn: !!j.loggedIn, unread: Number(j.unread) || 0 });
    } catch {
    }
  };
  (0, import_react18.useEffect)(() => {
    if (open) loadMsgs();
  }, [open, reloadToken]);
  (0, import_react18.useEffect)(() => {
    if (!open) return;
    const h = setInterval(loadMsgs, 6e4);
    return () => clearInterval(h);
  }, [open]);
  const closeMsgPop = () => {
    setMsgPopOpen(false);
    loadMsgs();
  };
  const msgUnreadCount = msgData.loggedIn ? msgData.unread || 0 : (msgData.messages || []).filter((m) => !msgIsSeen(m)).length;
  const msgShowDot = !msgPopOpen && msgUnreadCount > 0;
  (0, import_react18.useEffect)(() => {
    let cancelled = false;
    fetch(API_P + "/browserctl/api/update-check", { cache: "no-store" }).then((r) => r.json()).then((j) => {
      if (!cancelled && j) setUpdateInfo(j);
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, []);
  (0, import_react18.useEffect)(() => {
    if (!open) return;
    let cancelled = false;
    fetch(API_P + "/browserctl/api/update-check", { cache: "no-store" }).then((r) => r.json()).then((j) => {
      if (!cancelled && j) setUpdateInfo(j);
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, [open]);
  (0, import_react18.useEffect)(() => {
    if (!open) return;
    fetch(API_P + "/browserctl/api/config", { cache: "no-store" }).then((r) => r.json().then((j) => {
      if (j && j.mode) setCfgMode(j.mode);
      if (j && typeof j.canElevate === "boolean") setCanElevate(j.canElevate);
    }).catch(() => {
    })).catch(() => {
    });
  }, [open]);
  const startChain = async () => {
    try {
      const c = await fetch(API_P + "/browserctl/api/config", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
      if (c && c.mode === "official") {
        const m = await fetch(API_P + "/browserctl/api/server/me", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
        if (!(m && m.loggedIn)) {
          setLoginPrompt(true);
          return;
        }
      }
    } catch {
    }
    setStartErr("");
    run("start", async () => {
      let lastErr = "";
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const r = await fetch(API_P + "/browserctl/api/ensure", { cache: "no-store" });
          const j = await r.json().catch(() => ({}));
          if (j && (j.ok || j.pending)) {
            lastErr = "";
            break;
          }
          lastErr = j && j.error || "HTTP " + r.status;
        } catch (e) {
          lastErr = String(e && e.message || e);
        }
        if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1e3));
      }
      if (!lastErr) {
        const deadline = Date.now() + 3e4;
        let fwd = false;
        let tunnelErr = "";
        while (Date.now() < deadline) {
          try {
            const r = await fetch(API_P + "/browserctl/api/status", { cache: "no-store" });
            const j = await r.json().catch(() => ({}));
            fwd = !!j.forwarder;
            const tun = j.tunnel;
            const tunnelOk = !tun || tun.ok !== false;
            if (!tunnelOk && tun && tun.error) tunnelErr = String(tun.error);
            if (fwd && tunnelOk) break;
            if (j.startError) {
              lastErr = String(j.startError);
              break;
            }
          } catch {
            fwd = false;
          }
          await new Promise((r) => setTimeout(r, 300));
        }
        if (!lastErr && !fwd) {
          try {
            const r = await fetch(API_P + "/browserctl/api/status", { cache: "no-store" });
            const j = await r.json().catch(() => ({}));
            lastErr = String(j.startError || "") || (j.tunnel && j.tunnel.error ? String(j.tunnel.error) : "") || t("startTimeout");
          } catch {
            lastErr = t("startTimeoutShort");
          }
        }
        if (!lastErr && tunnelErr) lastErr = tunnelErr;
      }
      if (lastErr) console.error("[browserctl] ensure \u5168\u90E8\u91CD\u8BD5\u5931\u8D25:", lastErr);
      setStartErr(lastErr);
      setElevNeed(lastErr ? "start" : "");
      await new Promise((r) => setTimeout(r, 600));
      setReloadToken((x) => x + 1);
    });
  };
  const stopChain = () => run("stop", async () => {
    try {
      await fetch(API_P + "/browserctl/api/stop", { cache: "no-store" });
    } catch {
    }
    const deadline = Date.now() + 12e3;
    let still = false;
    for (; ; ) {
      let fwd = true;
      try {
        const r = await fetch(API_P + "/browserctl/api/status", { cache: "no-store" });
        const j = await r.json();
        fwd = !!j.forwarder;
      } catch {
        fwd = false;
      }
      if (!fwd) break;
      if (Date.now() >= deadline) {
        still = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    setElevNeed(still ? "stop" : "");
    if (still) setStartErr(t("elevateStopHint"));
    await new Promise((r) => setTimeout(r, 200));
    setReloadToken((x) => x + 1);
  });
  const openPanelChain = () => run("open", async () => {
    const w = window.open("", "_blank");
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const fail = (msg) => {
      try {
        if (w && !w.closed) {
          w.document.title = t("openFailed");
          w.document.body.style.cssText = "margin:0;background:#141519;color:#d8dade;font-family:system-ui,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh";
          w.document.body.innerHTML = '<div style="max-width:460px;padding:0 24px;text-align:center"><div style="font-size:15px;margin-bottom:10px">' + esc(t("openFailed")) + '</div><div style="font-size:12px;line-height:1.7;opacity:.75;white-space:pre-wrap;text-align:left">' + esc(msg) + "</div></div>";
        }
      } catch {
      }
    };
    try {
      const r = await fetch(API_P + "/browserctl/api/link?ttl=600&uses=1", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) {
        fail(j && j.error || "HTTP " + r.status);
        return;
      }
      if (w && !w.closed) w.location.href = j.url;
      else window.open(j.url, "_blank");
    } catch (e) {
      fail(String(e && e.message || e));
    }
  });
  const elevateChain = (requested) => run("elevate", async () => {
    const act = requested === "stop" ? "stop" : "start";
    let lastErr = "";
    try {
      const r = await fetch(API_P + "/browserctl/api/elevate?action=" + act, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!j || !j.ok) lastErr = j && j.error || "HTTP " + r.status;
    } catch (e) {
      lastErr = String(e && e.message || e);
    }
    if (!lastErr) {
      const wantUp = act === "start";
      const deadline = Date.now() + 45e3;
      let fwd = !wantUp;
      while (Date.now() < deadline) {
        try {
          const j = await fetch(API_P + "/browserctl/api/status", { cache: "no-store" }).then((x) => x.json());
          fwd = !!j.forwarder;
          const tun = j.tunnel;
          const tunnelOk = !tun || tun.ok !== false;
          if (wantUp ? fwd && tunnelOk : !fwd) break;
          if (wantUp && j.startError) {
            lastErr = String(j.startError);
            break;
          }
        } catch {
          fwd = false;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      if (!lastErr && wantUp && !fwd) {
        lastErr = t("elevateStartTimeout");
      }
      if (!lastErr && !wantUp && fwd) {
        lastErr = t("elevateStopTimeout");
      }
    }
    setStartErr(lastErr);
    setElevNeed(lastErr ? act : "");
    await new Promise((r) => setTimeout(r, 400));
    setReloadToken((x) => x + 1);
  });
  (0, import_react18.useEffect)(() => {
    if (!open) return;
    panel.current?.querySelector("button")?.focus();
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (MODAL_STACK.length) {
        MODAL_STACK[MODAL_STACK.length - 1].close();
        return;
      }
      if (msgPopOpen) {
        closeMsgPop();
        return;
      }
      if (document.querySelectorAll('[role="dialog"]').length > 1) return;
      actions.close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [actions, open, aboutOpen, configOpen, accountOpen, loginPrompt, ticketOpen, msgPopOpen, settingsOpen, legalDoc]);
  (0, import_react18.useEffect)(() => {
    if (!open) return;
    let alive = true;
    const beat = () => fetch(API_P + "/browserctl-gate/heartbeat", { cache: "no-store" }).catch(() => {
    });
    beat().then(() => {
      if (alive) setTimeout(() => setReloadToken((x) => x + 1), 400);
    });
    const hb = setInterval(beat, 12e4);
    return () => {
      alive = false;
      clearInterval(hb);
    };
  }, [open]);
  (0, import_react18.useEffect)(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);
  (0, import_react18.useEffect)(() => {
    if (!stopConfirm) return;
    const id = setTimeout(() => setStopConfirm(false), 2600);
    return () => clearTimeout(id);
  }, [stopConfirm]);
  const gating = !!busy;
  const TABS = [
    { id: "connect", icon: "link", label: t("tabConnect") },
    { id: "devices", icon: "desk", label: t("tabDevices") },
    { id: "security", icon: "lock", label: t("tabSecurity") },
    { id: "push", icon: "bell", label: t("tabPush") },
    { id: "log", icon: "clip", label: t("tabLog") }
  ];
  if (!open) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlOverlay", role: "dialog", "aria-modal": "true", "aria-label": t("tab"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("button", { className: "dshBrowserCtlOverlayMask", type: "button", "aria-label": t("close"), onClick: () => actions.close() }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("section", { ref: panel, className: "dshBrowserCtlPanel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("header", { className: "dshBrowserCtlHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("h1", { children: t("tab") }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { children: t("subtitle") })
        ] }),
        busy && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { style: { fontSize: 11.5, color: "var(--dsw-alias-label-tertiary,#8b8f98)", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlSpinner", "aria-hidden": "true" }),
          busy === "start" ? t("starting") : busy === "stop" ? t("stopping") : t("refresh") + "\u2026"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_dsh_client_ui_primitives5.Tooltip, { label: acctMe ? acctMe.email || t("configAcctTitle") : t("aboutAccount"), children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "dshBrowserCtlHeaderAcct",
            "aria-label": t("configAcctTitle"),
            "data-logged-in": acctMe ? "true" : "false",
            onClick: () => setAccountOpen(true),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { "aria-hidden": "true", children: Svg.person }),
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlHeaderAcctLabel", children: acctMe ? acctMe.email || t("aboutAccountLogged") : t("aboutAccount") })
            ]
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_dsh_client_ui_primitives5.Tooltip, { label: t("tickets"), children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
          Button,
          {
            variant: "ghost",
            size: "sm",
            "aria-label": t("tickets"),
            icon: Svg.ticket,
            onClick: () => setTicketOpen(true)
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_dsh_client_ui_primitives5.Tooltip, { label: t("msgCenter"), children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { ref: bellRef, className: "dshBrowserCtlAboutBtn", children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
            Button,
            {
              variant: "ghost",
              size: "sm",
              "aria-label": t("msgCenter"),
              "aria-haspopup": "dialog",
              "aria-expanded": msgPopOpen,
              icon: Svg.bellHead,
              onClick: () => msgPopOpen ? closeMsgPop() : setMsgPopOpen(true)
            }
          ),
          msgShowDot && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlBadgeDot" }),
          msgPopOpen && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(MsgCenter, { t, loggedInHint: t("msgGuestHint"), onClose: closeMsgPop, anchorRef: bellRef })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_dsh_client_ui_primitives5.Tooltip, { label: t("settingsTitle"), children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { className: "dshBrowserCtlAboutBtn", children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "ghost", size: "sm", "aria-label": t("settingsTitle"), icon: Svg.gear, onClick: () => setSettingsOpen(true) }),
          pluginUpdatePending && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlBadgeDot" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_dsh_client_ui_primitives5.Tooltip, { label: t("close"), children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
          Button,
          {
            variant: "ghost",
            size: "sm",
            "aria-label": t("close"),
            icon: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_dsh_client_ui_primitives5.IconCloseOutlineRegular, {}),
            onClick: () => actions.close()
          }
        ) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
        "div",
        {
          className: "dshBrowserCtlStatus",
          "data-ok": data ? data.forwarder === false ? "wait" : "true" : busy === "start" || retrying ? "wait" : error ? "false" : "wait",
          children: [
            data ? data.forwarder === false ? t("statusTunnelStarting") : t("statusReady") : busy === "start" ? t("starting") : retrying ? t("statusTunnelBuilding") : error ? t("statusNoSecret") : t("statusLoading"),
            error && busy !== "start" && !retrying ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { title: error, style: { opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: error }) : null
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "dshBrowserCtlTabs", children: TABS.map((tb) => /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
        "button",
        {
          type: "button",
          className: "dshBrowserCtlTab",
          "data-active": tab === tb.id ? "true" : "false",
          disabled: gating,
          onClick: () => setTab(tb.id),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { "aria-hidden": "true", children: Svg[tb.icon] }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { children: tb.label })
          ]
        },
        tb.id
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlTabBody", children: [
        tab === "connect" && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlCard", children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlCardHead", style: { cursor: "default" }, children: [
              Svg.link,
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { children: t("connScanTitle") }),
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlCardStat", style: { color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: pairSeg === "temp" ? left > 0 ? t("pairLeft") + " " + left + "s" : data && data.once ? t("pairExpired") : "" : t("appReady") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlCardBody dshBrowserCtlCardBodyTall", "data-open": "true", children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { display: "flex", background: "var(--dsw-alias-bg-layer-1,rgba(255,255,255,0.05))", borderRadius: 9, padding: 3, gap: 3 }, children: [["temp", t("pairSegTemp")], ["long", t("pairSegLong")]].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => setPairSeg(id),
                  style: {
                    flex: 1,
                    border: "none",
                    /* 选中态圆角 = 容器 radius 9 − padding 3 = 6px(styles.js .dshBrowserCtlTab 同口径) */
                    borderRadius: 6,
                    padding: "6px 0",
                    fontSize: 12,
                    fontWeight: pairSeg === id ? 600 : 500,
                    cursor: "pointer",
                    background: pairSeg === id ? "var(--dsw-alias-bg-layer-3,#333947)" : "transparent",
                    color: pairSeg === id ? "var(--dsw-alias-label-primary,inherit)" : "var(--dsw-alias-label-tertiary,#8b8f98)"
                  },
                  children: label
                },
                id
              )) }),
              pairSeg === "temp" ? data && data.svg ? cfgMode === "official" && !acctMe ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "dshBrowserCtlQrBox", style: { height: 128, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { color: "#666", fontSize: 12, padding: "0 14px", textAlign: "center" }, children: t("loginRequiredDesc") }) }) : /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "dshBrowserCtlQrBox", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("img", { alt: t("qrAlt"), src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data.svg) }) }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { style: {
                  margin: "4px 0 0",
                  fontSize: 12,
                  textAlign: "center",
                  color: left > 0 ? "var(--dsw-alias-label-tertiary,#8b8f98)" : "var(--dsw-alias-state-error-primary,#e5655c)"
                }, children: left > 0 ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { children: [
                  status && status.uses > 1 ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { style: { color: "var(--dsw-alias-label-secondary,#666)" }, children: [
                    t("pairUses"),
                    " ",
                    status.remaining,
                    "/",
                    status.uses,
                    " \xB7 "
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { children: [
                    t("pairOnce"),
                    " \xB7 "
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { style: { color: left <= 10 ? "var(--dsw-alias-state-error-primary,#e5655c)" : "inherit" }, children: [
                    t("pairLeft"),
                    " ",
                    left,
                    "s"
                  ] })
                ] }) : data.once ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { children: t("pairExpired") }) : /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("pairStatic") }) }),
                data.once ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { style: { margin: "4px 0 0", fontSize: 11, textAlign: "center", color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("pairAppTempNote") }) : null
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "dshBrowserCtlQrBox", style: { height: 128 }, children: busy === "start" ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { className: "dshBrowserCtlQrLoading", children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlSpinner", "aria-hidden": "true" }),
                t("starting")
              ] }) : retrying ? (
                // 隧道正在自愈:自动轮询中,二维码一就绪就会出现,不需要用户再点一次
                /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { className: "dshBrowserCtlQrLoading", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlSpinner", "aria-hidden": "true" }),
                  t("statusTunnelBuilding")
                ] })
              ) : startErr ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { style: {
                color: "var(--dsw-alias-state-error-primary,#e5655c)",
                fontSize: 11,
                padding: "0 12px",
                textAlign: "left",
                whiteSpace: "pre-wrap",
                overflowY: "auto",
                maxHeight: 120,
                lineHeight: 1.5,
                display: "block"
              }, children: [
                t("startFailed"),
                "\n",
                startErr
              ] }) : error ? (
                // 二维码/配对接口失败(最常见:frp 隧道未连通,host 半直接回 503)时
                // 把原因原文显示在二维码位置,而不是只显示一句"没有可用链接"让用户猜。
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: {
                  color: "var(--dsw-alias-state-error-primary,#e5655c)",
                  fontSize: 11,
                  padding: "0 12px",
                  textAlign: "left",
                  whiteSpace: "pre-wrap",
                  overflowY: "auto",
                  maxHeight: 120,
                  lineHeight: 1.5,
                  display: "block"
                }, children: error })
              ) : /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { color: "#666", fontSize: 12, padding: "0 14px", textAlign: "center" }, children: t("statusLoading") }) }) : /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(PairLongSegment, { t, reloadToken }),
              pairSeg === "temp" && data && !(cfgMode === "official" && !acctMe) && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlUrlRow", children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "dshBrowserCtlUrl", title: data.url, children: data.url }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "ghost", size: "sm", onClick: () => {
                  navigator.clipboard?.writeText(data.url).then(() => setCopied(true)).catch(() => {
                  });
                }, children: copied ? t("copied") : t("copyLink") })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "dshBrowserCtlCard", style: { padding: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlActions", children: [
            !data && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "primary", size: "sm", disabled: gating, onClick: startChain, children: busy === "start" ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlSpinner", "aria-hidden": "true" }),
              " ",
              t("starting")
            ] }) : t("startCtl") }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "secondary", size: "sm", disabled: gating, onClick: refreshAll, children: busy === "refresh" ? t("refresh") + "\u2026" : t("refresh") }),
            data && data.panel && !(cfgMode === "official" && !acctMe) && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "primary", size: "sm", disabled: gating, onClick: openPanelChain, children: busy === "open" ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlSpinner", "aria-hidden": "true" }),
              " ",
              t("opening")
            ] }) : t("openPanel") }),
            data && !data.panel && !(cfgMode === "official" && !acctMe) && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary,#8b8f98)", display: "inline-flex", alignItems: "center" }, children: t("loginRequired") }),
            data && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
              Button,
              {
                variant: "secondary",
                size: "sm",
                className: "dshBrowserCtlBtnDanger",
                disabled: gating,
                onClick: () => {
                  if (!stopConfirm) {
                    setStopConfirm(true);
                    return;
                  }
                  setStopConfirm(false);
                  stopChain();
                },
                children: busy === "stop" ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlSpinner", "aria-hidden": "true" }),
                  " ",
                  t("stopping")
                ] }) : stopConfirm ? t("stopCtlConfirm") : t("stopCtl")
              }
            )
          ] }) }),
          data && data.grant && !(cfgMode === "official" && !acctMe) && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
              "button",
              {
                type: "button",
                className: "dshBrowserCtlCardHead dshBrowserCtlFoldBtn",
                "data-open": pairSetOpen ? "true" : "false",
                onClick: () => setPairSetOpen((o) => !o),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { "aria-hidden": "true", style: { display: "inline-flex", flex: "none", color: "var(--dsw-alias-label-tertiary,#8b8f98)", transform: pairSetOpen ? "rotate(90deg)" : "none", transition: "transform .15s ease" }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { fontSize: 13, fontWeight: 500 }, children: t("pairSettingsTitle") }),
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlCardStat", style: { fontWeight: 400 }, children: uses === 1 ? t("pairUsesOne") : uses + " " + t("pairUsesTimes") })
                ]
              }
            ),
            pairSetOpen && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlUrlRow", style: { gap: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary,#8b8f98)", whiteSpace: "nowrap" }, children: t("pairUsesLabel") }),
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                "select",
                {
                  value: uses,
                  disabled: gating,
                  onChange: (e) => setUses(parseInt(e.target.value, 10) || 1),
                  style: {
                    fontSize: 12,
                    padding: "2px 4px",
                    borderRadius: 6,
                    border: "1px solid rgba(128,128,128,.35)",
                    background: "transparent",
                    color: "inherit",
                    flex: "none"
                  },
                  children: [1, 2, 3, 5, 10].map((n) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("option", { value: n, children: n === 1 ? t("pairUsesOne") : n + " " + t("pairUsesTimes") }, n))
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "ghost", size: "sm", disabled: gating, onClick: refresh, children: t("pairSwap") })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(IosGuideCard, { t }),
          elevNeed && canElevate && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            margin: "8px 0 0",
            flex: "0 0 auto"
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: {
              fontSize: 11,
              lineHeight: 1.5,
              textAlign: "center",
              color: "var(--dsw-alias-state-error-primary,#e5655c)"
            }, children: elevNeed === "stop" ? t("elevateStopHint") : t("elevateHint") }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "secondary", size: "sm", disabled: gating, onClick: () => elevateChain(elevNeed), children: busy === "elevate" ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlSpinner", "aria-hidden": "true" }),
              " ",
              t("elevating")
            ] }) : elevNeed === "stop" ? t("elevateStop") : t("elevateStart") })
          ] })
        ] }),
        tab === "devices" && // B2 单卡分区版:在线/历史/已封禁 IP(+添加)/已配对手机 全并入 DevicesSection
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(DevicesSection, { t, reloadToken, onRefresh: () => setReloadToken((x) => x + 1), disabled: gating }),
        tab === "security" && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(TotpCard, { t, reloadToken, onRefresh: () => setReloadToken((x) => x + 1), disabled: gating }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SessionDaysCard, { t, disabled: gating }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SigEnforceCard, { t, reloadToken })
        ] }),
        tab === "push" && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(PushCard, { t, reloadToken }),
        tab === "log" && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SysinfoCard, { t }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(LogCard, { t, reloadToken })
        ] })
      ] })
    ] }),
    settingsOpen && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(BaseModal, { t, title: t("settingsTitle"), onClose: () => setSettingsOpen(false), className: "dshBrowserCtlPanelNested", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { display: "flex", flexDirection: "column" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { padding: "6px 0 2px", fontSize: 12, fontWeight: 600, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("settingsGeneral") }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderTop: "1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.05))" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: 13, fontWeight: 500 }, children: t("settingsCfgRow") }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary,#8b8f98)", marginTop: 3 }, children: cfgMode === "official" ? t("configOfficial") : t("configSelfhost") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "secondary", size: "sm", onClick: () => setConfigOpen(true), children: t("config") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { padding: "8px 0 2px", fontSize: 12, fontWeight: 600, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("settingsAboutSec") }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderTop: "1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.05))" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: 13, fontWeight: 500 }, children: t("updateCur") }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary,#8b8f98)", marginTop: 3 }, children: [
              "v",
              typeof VERSION === "string" ? VERSION : ""
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { className: "dshBrowserCtlAboutBtn", children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "secondary", size: "sm", onClick: () => setAboutOpen(true), children: t("about") }),
            pluginUpdatePending && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "dshBrowserCtlBadgeDot" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { padding: "8px 0 2px", fontSize: 12, fontWeight: 600, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("settingsLegalSec") }),
        [LEGAL_TERMS, LEGAL_PRIVACY].map((doc) => /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
          "button",
          {
            type: "button",
            onClick: () => setLegalDoc(doc),
            style: { display: "flex", alignItems: "center", gap: 8, width: "100%", boxSizing: "border-box", padding: "10px 0", border: "none", borderTop: "1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.05))", background: "transparent", color: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left" },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { flex: 1 }, children: doc.title }),
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { "aria-hidden": "true", style: { color: "var(--dsw-alias-label-tertiary,#8b8f98)", display: "inline-flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("path", { d: "M4.5 2.5 8 6l-3.5 3.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
            ]
          },
          doc.title
        ))
      ] }),
      legalDoc && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(LegalDialog, { t, doc: legalDoc, onClose: () => setLegalDoc(null) })
    ] }),
    aboutOpen && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(AboutPanel, { t, onClose: () => setAboutOpen(false), initialResult: updateInfo, onDismissUpdate: dismissPluginUpdate, onCheckResult: setUpdateInfo }),
    configOpen && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(ConfigPanel, { t, onClose: () => setConfigOpen(false), onSaved: refreshAll }),
    accountOpen && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(AccountLoginModal, { t, onClose: () => setAccountOpen(false), onSaved: refreshAll }),
    ticketOpen && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(TicketModal, { t, onClose: () => setTicketOpen(false) }),
    loginPrompt && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(BaseModal, { t, title: t("loginRequired"), onClose: () => setLoginPrompt(false), overlayClassName: "dshBrowserCtlLoginPrompt", z: MODAL_Z_PROMPT, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlLoginPromptBody", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { className: "dshBrowserCtlLoginPromptText", children: t("loginRequiredDesc") }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlLoginPromptActions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "secondary", size: "sm", onClick: () => setLoginPrompt(false), children: t("cancel") }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "primary", size: "sm", onClick: () => {
          setLoginPrompt(false);
          setAccountOpen(true);
        }, children: t("aboutAccount") })
      ] })
    ] }) }),
    pluginUpdPrompt && updateInfo && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
      BaseModal,
      {
        t,
        title: t("pluginUpdTitle").replace("{v}", String(updateInfo.latest)),
        onClose: () => setUpdPromptClosed(String(updateInfo.latest)),
        overlayClassName: "dshBrowserCtlLoginPrompt",
        z: MODAL_Z_PROMPT,
        children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlLoginPromptBody", children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { className: "dshBrowserCtlLoginPromptText", children: t("pluginUpdDesc").replace("{cur}", String(updateInfo.current || "")).replace("{v}", String(updateInfo.latest)) }),
          pluginUpdNotes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("ul", { className: "dshBrowserCtlUpdNotes", children: pluginUpdNotes.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("li", { children: n }, i)) }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "dshBrowserCtlLoginPromptActions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_dsh_client_ui_primitives5.Tooltip, { label: t("updateIgnoreTip"), children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
              Button,
              {
                variant: "secondary",
                size: "sm",
                onClick: () => {
                  dismissPluginUpdate();
                  setUpdPromptClosed(String(updateInfo.latest));
                },
                children: t("updateIgnore")
              }
            ) }),
            updateInfo.install && updateInfo.install.form === "local" && !IS_TEST && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(UpdateApplyButton, { t, latest: String(updateInfo.latest), variant: "primary", onApplied: dismissPluginUpdate }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_dsh_client_ui_primitives5.Tooltip, { label: t("updateDownloadTip"), children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
              Button,
              {
                variant: "secondary",
                size: "sm",
                onClick: () => {
                  setUpdPromptClosed(String(updateInfo.latest));
                  if (pluginUpdUrl) window.open(pluginUpdUrl, "_blank");
                },
                children: t("updateDownload")
              }
            ) })
          ] })
        ] })
      }
    )
  ] });
}

// locale/zh.json
var zh_default = {
  meta: {
    description: "\u628A\u672C\u673A DeepSeek \u52A9\u624B Web \u9762\u677F\u5B89\u5168\u7A7F\u900F\u5230\u624B\u673A\u4E0E\u5916\u7F51, \u4FA7\u8FB9\u680F\u4E00\u952E\u5F00\u542F",
    title: "DSH \u8FDC\u7A0B\u52A9\u624B"
  },
  panel: {
    about: "\u5173\u4E8E",
    aboutAccount: "\u8D26\u53F7\u767B\u5F55",
    aboutAccountLogged: "\u5DF2\u767B\u5F55",
    aboutApp: "App \u4E0B\u8F7D",
    aboutDesc: "\u628A\u672C\u673A DeepSeek \u52A9\u624B Web \u9762\u677F\u5B89\u5168\u7A7F\u900F\u5230\u624B\u673A\u6216\u5916\u7F51\u6D4F\u89C8\u5668,\u968F\u65F6\u968F\u5730\u8FDC\u7A0B\u63A7\u5236\u3002",
    aboutGithub: "GitHub",
    aboutQq: "\u52A0\u5165QQ\u7FA4",
    aboutWebsite: "\u5B98\u7F51",
    appCopyLink: "\u590D\u5236\u914D\u5BF9\u94FE\u63A5",
    appLoading: "\u6B63\u5728\u751F\u6210\u957F\u671F\u914D\u5BF9\u7801\u2026",
    appNoQr: "\u957F\u671F\u914D\u5BF9\u7801\u4E0D\u53EF\u7528",
    appOnceHint: "\u8FD9\u662F\u957F\u671F\u914D\u5BF9\u7801:\u624B\u673A App \u626B\u7801\u540E\u767B\u8BB0\u8BBE\u5907\u5E76\u4FDD\u5B58\u767B\u5F55\u72B6\u6001,\u4E4B\u540E\u6253\u5F00\u514D\u626B\u7801\u76F4\u8FDE\u3002\u82E5\u626B\u300C\u8FDE\u63A5\u300D\u9875\u7684\u4E00\u6B21\u6027\u4E8C\u7EF4\u7801,\u53EA\u4F1A\u83B7\u5F97 1 \u5C0F\u65F6\u4E34\u65F6\u4F1A\u8BDD,\u4E0D\u4F1A\u957F\u671F\u7ED1\u5B9A\u3002",
    appQrAlt: "\u624B\u673A App \u957F\u671F\u914D\u5BF9\u4E8C\u7EF4\u7801",
    appReady: "\u957F\u671F\u914D\u5BF9\u7801\u5DF2\u751F\u6210",
    appRefresh: "\u5237\u65B0\u914D\u5BF9\u7801",
    appSubtitle: "\u624B\u673A App \u626B\u4E00\u6B21,\u4E4B\u540E\u6253\u5F00\u514D\u626B\u7801\u76F4\u8FDE",
    banAdd: "\u6DFB\u52A0",
    banAddConfirm: "\u62C9\u9ED1",
    banAddFail: "\u6DFB\u52A0\u5931\u8D25",
    banAddInvalid: "IP \u683C\u5F0F\u4E0D\u6B63\u786E",
    banAddOk: "\u5DF2\u62C9\u9ED1 {ip}",
    banAddPh: "\u8F93\u5165\u8981\u62C9\u9ED1\u7684 IP",
    banAddReason: "\u624B\u52A8\u6DFB\u52A0",
    banCancel: "\u53D6\u6D88",
    banEmpty: "\u6682\u65E0\u88AB\u5C01\u7981\u7684 IP \u5730\u5740\u3002\u5728\u8BBE\u5907\u5217\u8868\u70B9\u201C\u62C9\u9ED1\u201D\u53EF\u6DFB\u52A0\u3002",
    banTitle: "IP \u9ED1\u540D\u5355",
    bannedOk: "\u5DF2\u62C9\u9ED1 {n}",
    banBusy: "\u62C9\u9ED1\u4E2D\u2026",
    banUnban: "\u89E3\u7981",
    banUnbanFail: "\u89E3\u7981\u5931\u8D25",
    banUnbanOk: "\u5DF2\u89E3\u7981 {ip}",
    cancel: "\u53D6\u6D88",
    close: "\u5173\u95ED",
    config: "\u914D\u7F6E",
    configAcctCopied: "\u5DF2\u590D\u5236",
    configAcctCopy: "\u590D\u5236\u94FE\u63A5",
    configAcctLoadFail: "\u5B98\u65B9\u670D\u52A1\u5668\u6682\u65F6\u4E0D\u53EF\u8FBE,\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
    configAcctLoggedIn: "\u5DF2\u767B\u5F55",
    configAcctLoggedOut: "\u5DF2\u9000\u51FA(\u96A7\u9053\u5C06\u65AD\u5F00,\u91CD\u65B0\u767B\u5F55\u53EF\u6062\u590D)",
    configAcctLoggingOut: "\u9000\u51FA\u4E2D\u2026",
    configAcctLogout: "\u9000\u51FA\u767B\u5F55",
    configAcctOauthBtn: "\u767B\u5F55 / \u6CE8\u518C\u5B98\u65B9\u8D26\u53F7",
    configAcctOauthCancel: "\u53D6\u6D88",
    configAcctOauthDone: "\u6388\u6743\u6210\u529F,\u6B63\u5728\u5E94\u7528\u8D26\u53F7\u4E0E\u4E13\u5C5E\u7AEF\u53E3\u2026",
    configAcctOauthExpired: "\u6388\u6743\u5DF2\u8FC7\u671F,\u8BF7\u91CD\u65B0\u53D1\u8D77\u3002",
    configAcctOauthFail: "\u6388\u6743\u5931\u8D25:",
    configAcctOauthHint: "\u5C06\u6253\u5F00\u6D4F\u89C8\u5668\u8DF3\u8F6C\u5B98\u7F51,\u5728\u7F51\u9875\u5B8C\u6210\u767B\u5F55/\u6CE8\u518C\u540E\u81EA\u52A8\u56DE\u8C03",
    configAcctOauthNetwork: "\u5B98\u65B9\u670D\u52A1\u5668\u6682\u65F6\u4E0D\u53EF\u8FBE,\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
    configAcctOauthOpenAgain: "\u91CD\u65B0\u6253\u5F00\u6388\u6743\u9875",
    configAcctOauthOpenBrowser: "\u5DF2\u6253\u5F00\u6D4F\u89C8\u5668:\u8BF7\u5728\u5B98\u7F51\u9875\u9762\u767B\u5F55\u8D26\u53F7\u5E76\u70B9\u300C\u786E\u8BA4\u6388\u6743\u300D\u3002\u82E5\u672A\u81EA\u52A8\u6253\u5F00,\u8BF7\u70B9\u4E0B\u65B9\u6309\u94AE\u91CD\u8BD5\u3002",
    configAcctOauthOpenFail: "\u81EA\u52A8\u6253\u5F00\u6D4F\u89C8\u5668\u5931\u8D25:\u8BF7\u70B9\u4E0B\u65B9\u94FE\u63A5\u624B\u52A8\u6253\u5F00\u6388\u6743\u9875\u3002",
    configAcctOauthOpening: "\u6B63\u5728\u6253\u5F00\u6D4F\u89C8\u5668\u2026",
    configAcctOauthWait: "\u7B49\u5F85\u6388\u6743\u2026",
    configAcctPort: "\u4E13\u5C5E\u7AEF\u53E3",
    configAcctRestartFail: "\u767B\u5F55\u6210\u529F,\u4F46\u96A7\u9053\u91CD\u542F\u5931\u8D25:\u8BF7\u70B9\u300C\u5F00\u59CB\u63A7\u5236\u300D\u624B\u52A8\u542F\u52A8\u3002",
    configAcctTitle: "\u5B98\u65B9\u8D26\u53F7",
    configHost: "\u670D\u52A1\u5668\u5730\u5740 (host)",
    configHostPh: "\u4F8B\u5982 frps.example.com",
    configHostRequired: "\u8BF7\u586B\u5199\u670D\u52A1\u5668\u5730\u5740",
    configOfficial: "\u5B98\u65B9\u670D\u52A1\u5668",
    configOfficialHint: "\u6CE8\u518C / \u767B\u5F55\u5B98\u65B9\u8D26\u53F7,\u5F00\u7BB1\u5373\u7528",
    configOfficialNote: "\u4F7F\u7528\u5B98\u65B9\u670D\u52A1\u5668:\u767B\u5F55(\u6216\u6CE8\u518C)\u8D26\u53F7\u540E\u81EA\u52A8\u5206\u914D\u4E13\u5C5E\u5165\u53E3,\u65E0\u9700\u624B\u5DE5\u586B\u5199\u4EFB\u4F55\u670D\u52A1\u5668\u4FE1\u606F\u3002",
    configPort: "frps \u7AEF\u53E3",
    configRemotePort: "\u8FDC\u7A0B\u7AEF\u53E3 (\u53EF\u9009)",
    configSelfhost: "\u81EA\u5EFA\u670D\u52A1\u5668",
    configSelfhostHint: "\u4F7F\u7528\u4F60\u81EA\u5DF1\u7684 frps \u670D\u52A1\u5668",
    configSubtitle: "\u9009\u62E9\u8FDE\u63A5\u5B98\u65B9\u670D\u52A1\u5668\u6216\u4F60\u81EA\u5DF1\u7684 frps \u670D\u52A1\u5668",
    configToken: "FRP token",
    configTokenKeep: "\u5DF2\u4FDD\u5B58(\u7559\u7A7A\u4FDD\u6301\u4E0D\u53D8)",
    configTokenNote: "Token \u4EC5\u4FDD\u5B58\u5728\u672C\u673A browserctl_secrets.json(\u5DF2\u88AB gitignore \u6392\u9664,\u4E0D\u4F1A\u63D0\u4EA4\u6216\u4E0A\u4F20)\u3002",
    configTokenPh: "\u8F93\u5165 frps \u8BA4\u8BC1 token",
    connScanTitle: "\u626B\u7801\u8FDE\u63A5",
    copied: "\u5DF2\u590D\u5236",
    copyLink: "\u590D\u5236\u94FE\u63A5",
    copySecret: "\u590D\u5236\u5BC6\u94A5",
    devCardMeta: "\u8C01\u5728\u8FDE / \u8FDE\u8FC7 / \u5C01\u4E86 / \u7ED1\u4E86",
    devCardTitle: "\u8BBE\u5907\u4E0E\u8BBF\u95EE",
    devConnTimes: "\u5DF2\u8FDE {n} \u6B21",
    devSecBanned: "\u5DF2\u5C01\u7981 IP",
    devSecHistory: "\u5386\u53F2 \xB7 \u805A\u5408",
    devSecOnlineN: "\u5728\u7EBF \xB7 {n} \u53F0",
    devSecPaired: "\u5DF2\u914D\u5BF9\u624B\u673A",
    devTotalOnline: "\u7D2F\u8BA1 {d}",
    devUnknown: "\u672A\u77E5\u8BBE\u5907",
    deviceKick: "\u8E22\u4E0B\u7EBF",
    devicesOnline: "\u5728\u7EBF {n} \u53F0",
    devicesTitle: "\u5728\u7EBF\u8BBE\u5907",
    dupBadge: "\u91CD\u590D {n} \u6761",
    durDay: "{n} \u5929",
    durDayHour: "{d} \u5929 {h} \u5C0F\u65F6",
    durHour: "{n} \u5C0F\u65F6",
    durHourMin: "{h} \u5C0F\u65F6 {m} \u5206\u949F",
    durLess1Min: "\u4E0D\u5230 1 \u5206\u949F",
    durMin: "{n} \u5206\u949F",
    durSec: "{n} \u79D2",
    histByDevice: "\u6309\u8BBE\u5907",
    histCount: "\u5171 {n} \u53F0",
    histEmpty: "\u6682\u65E0\u5386\u53F2\u8BBE\u5907",
    histTitle: "\u5386\u53F2\u5728\u7EBF\u8BBE\u5907",
    kickAllConfirm: "\u786E\u8BA4\u5168\u90E8\u8E22\u4E0B\u7EBF\uFF1F",
    kickBusy: "\u8E22\u51FA\u4E2D\u2026",
    kickFail: "\u8E22\u51FA\u5931\u8D25",
    kickOneConfirm: "\u786E\u8BA4\u8E22\u51FA\uFF1F",
    kickedAll: "\u5168\u90E8\u8E22\u4E0B\u7EBF\u6210\u529F",
    kickedOne: "\u5DF2\u8E22\u51FA\u8BBE\u5907",
    kindApp: "App",
    kindWeb: "\u7F51\u9875",
    lastSeenOnline: "{d}\u5728\u7EBF",
    netError: "\u7F51\u7EDC\u9519\u8BEF",
    onlineFor: "\u5728\u7EBF {d}",
    elevateHint: "\u82E5\u5931\u8D25\u539F\u56E0\u662F\u6740\u8F6F\u62E6\u4E86 frpc.exe \u6216\u88AB\u6743\u9650\u6321\u4F4F,\u70B9\u4E0B\u9762\u6309\u94AE\u7528\u7BA1\u7406\u5458\u6743\u9650\u91CD\u8BD5(Windows \u4F1A\u5F39 UAC \u786E\u8BA4\u6846)\u3002",
    elevateStart: "\u4EE5\u7BA1\u7406\u5458\u8EAB\u4EFD\u542F\u52A8",
    elevateStop: "\u4EE5\u7BA1\u7406\u5458\u8EAB\u4EFD\u505C\u6B62",
    elevateStopHint: "\u505C\u6B62\u6CA1\u751F\u6548:\u8FD9\u5957\u8FDB\u7A0B\u53EF\u80FD\u4EE5\u7BA1\u7406\u5458\u8EAB\u4EFD\u5728\u8DD1,\u666E\u901A\u6743\u9650\u6740\u4E0D\u6389\u3002",
    elevateStartTimeout: "\u63D0\u6743\u542F\u52A8\u540E 45 \u79D2\u5185\u95F8\u673A(3080)\u4ECD\u672A\u5C31\u7EEA,\u8BF7\u67E5\u770B browserctl_start.log \u4E0E browserctl_fwd.log\u3002",
    elevateStopTimeout: "\u63D0\u6743\u505C\u6B62\u540E\u95F8\u673A(3080)\u4ECD\u5728\u8FD0\u884C,\u8BF7\u67E5\u770B browserctl_fwd.log\u3002",
    elevating: "\u7B49\u5F85\u63D0\u6743\u786E\u8BA4\u2026",
    settingsTitle: "\u8BBE\u7F6E",
    settingsGeneral: "\u901A\u7528\u914D\u7F6E",
    settingsAboutSec: "\u5173\u4E8E\u4E0E\u66F4\u65B0",
    settingsLegalSec: "\u534F\u8BAE\u4E0E\u9690\u79C1",
    settingsCfgRow: "\u670D\u52A1\u5668\u4E0E\u8FDE\u63A5\u6A21\u5F0F",
    legalAck: "\u6211\u77E5\u9053\u4E86",
    legalMeta: "\u751F\u6548 {d} \xB7 \u7248\u672C {v}",
    legalPrivacy: "\u9690\u79C1\u653F\u7B56",
    legalTerms: "\u7528\u6237\u534F\u8BAE",
    linkCopied: "\u5DF2\u590D\u5236",
    linkCopy: "\u590D\u5236\u94FE\u63A5",
    linkNote: "\u626B\u7801\u7ED1\u5B9A\u7684\u8BBE\u5907\u4F1A\u51FA\u73B0\u5728\u300C\u8BBE\u5907\u300D\u9875\u7B7E\u300C\u5DF2\u914D\u5BF9\u624B\u673A\u300D\u5206\u533A,\u53EF\u968F\u65F6\u89E3\u9664;\u914D\u5BF9\u7801\u522B\u622A\u56FE\u53D1\u7ED9\u522B\u4EBA\u3002",
    linkOpenSite: "\u6253\u5F00\u5B98\u7F51",
    linkStep1: "\u624B\u673A\u6D4F\u89C8\u5668\u6253\u5F00\u4E0A\u9762\u7684\u5B98\u7F51\u5730\u5740(\u53EF\u767B\u5F55\u8D26\u53F7\u770B\u8BBE\u5907\u4E0E\u65F6\u957F;\u8FD9\u4E2A\u5165\u53E3\u957F\u671F\u4E0D\u53D8,\u7AEF\u53E3\u600E\u4E48\u53D8\u90FD\u4E0D\u53D7\u5F71\u54CD)",
    linkStep2: "\u7535\u8111\u7AEF\u5207\u5230\u672C\u9762\u677F\u7684\u300C\u8FDE\u63A5\u300D\u9875\u7B7E,\u5206\u6BB5\u5207\u5230\u300C\u957F\u671F\u7801\u300D\u51FA\u793A\u914D\u5BF9\u7801(\u626B\u5B8C\u4F1A\u81EA\u52A8\u6362\u65B0\u7801)",
    linkStep3: "\u7528 iPhone \u76F8\u673A\u626B\u8FD9\u4E2A\u7801(\u522B\u7528\u5FAE\u4FE1\u626B):\u6D4F\u89C8\u5668\u6253\u5F00\u5373\u81EA\u52A8\u767B\u8BB0\u8BBE\u5907\u5E76\u7ED1\u5B9A,30 \u5929\u514D\u9A8C\u8BC1\u76F4\u8FBE\u9762\u677F",
    linkStep4: "\u5728\u9762\u677F\u9875\u9762\u70B9\u6D4F\u89C8\u5668\u300C\u5206\u4EAB \u2192 \u6DFB\u52A0\u5230\u4E3B\u5C4F\u5E55\u300D,\u628A\u5165\u53E3\u6C38\u4E45\u4FDD\u5B58;\u514D\u9A8C\u8BC1\u671F\u8FC7\u540E\u518D\u626B\u4E00\u6B21\u7801\u5373\u53EF\u6062\u590D",
    linkStepsTitle: "\u7ED1\u5B9A\u6B65\u9AA4",
    linkSubtitle: "\u6CA1\u6709 App \u7684\u8BBE\u5907(iPhone / iPad)\u7528\u300C\u957F\u671F\u914D\u5BF9\u7801\u300D\u7ED1\u5B9A\u7F51\u9875\u7248:\u626B\u4E00\u6B21\u7801\u767B\u8BB0\u8BBE\u5907,30 \u5929\u514D\u9A8C\u8BC1,\u518D\u300C\u6DFB\u52A0\u5230\u4E3B\u5C4F\u5E55\u300D\u5F53 App \u7528,\u4E0D\u518D\u9700\u8981 PWA \u5F15\u5BFC\u94FE\u63A5\u3002",
    linkTitle: "iOS / \u65E0 App \u8BBE\u5907",
    linkWebTag: "\u7F51\u9875\u7ED1\u5B9A",
    logEmpty: "\u6682\u65E0\u65E5\u5FD7\u3002\u8BBE\u5907\u9A8C\u8BC1\u3001\u8E22\u4E0B\u7EBF\u30012FA \u5F00\u5173\u90FD\u4F1A\u8BB0\u5F55\u5728\u8FD9\u91CC\u3002",
    logCount: "{n} \u6761",
    logNone: "\u6682\u65E0",
    logTabAll: "\u5168\u90E8",
    logTabBan: "\u9ED1\u540D\u5355",
    logTabKick: "\u8E22\u51FA",
    logTabLogin: "\u767B\u5F55",
    logTabPair: "\u914D\u5BF9",
    logTabSettings: "\u8BBE\u7F6E",
    logTabSys: "\u7CFB\u7EDF",
    logTabTotp: "2FA",
    logTabUnsigned: "\u65E0\u7B7E\u540D",
    logTitle: "\u8FD0\u884C\u65E5\u5FD7",
    loginBtn: "\u767B\u5F55",
    loginEmail: "\u90AE\u7BB1",
    loginLoggingIn: "\u767B\u5F55\u4E2D\u2026",
    loginOr: "\u6216",
    loginPassword: "\u5BC6\u7801",
    loginPwdTitle: "\u8D26\u53F7\u5BC6\u7801\u767B\u5F55",
    loginRequired: "\u9700\u8981\u5148\u767B\u5F55",
    loginRequiredDesc: "\u4F7F\u7528\u5B98\u65B9\u670D\u52A1\u5668\u9700\u8981\u5148\u767B\u5F55\u8D26\u53F7,\u767B\u5F55\u540E\u624D\u4F1A\u5206\u914D\u4E13\u5C5E\u5165\u53E3\u3002\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u524D\u5F80\u767B\u5F55\u3002",
    msgBack: "\u8FD4\u56DE\u5217\u8868",
    msgCenter: "\u901A\u77E5\u4E2D\u5FC3",
    msgEmptyFeed: "\u6682\u65E0\u7535\u8111\u63A8\u9001;\u7535\u8111\u7AEF\u5F00\u542F\u63A8\u9001\u540E,\u5386\u53F2\u901A\u77E5\u4F1A\u6C47\u603B\u5728\u8FD9\u91CC\u3002",
    msgEmptyMine: "\u6682\u65E0\u6D88\u606F",
    msgEmptyOfficial: "\u6682\u65E0\u516C\u544A",
    msgGuestHint: "\u5F53\u524D\u663E\u793A\u5168\u5458\u516C\u544A;\u767B\u5F55\u5B98\u65B9\u8D26\u53F7\u540E\u53EF\u63A5\u6536\u53D1\u7ED9\u4F60\u7684\u5B9A\u5411\u6D88\u606F\u3002",
    msgLoadFail: "\u901A\u77E5\u52A0\u8F7D\u5931\u8D25",
    msgNoTitle: "(\u65E0\u6807\u9898)",
    msgOfficial: "\u5B98\u65B9\u516C\u544A",
    msgOpenLink: "\u67E5\u770B\u94FE\u63A5",
    msgPersonal: "\u53D1\u7ED9\u6211\u7684",
    msgStyleEvent: "\u6D3B\u52A8",
    msgStyleUpdate: "\u7248\u672C\u66F4\u65B0",
    msgStyleWarning: "\u5B89\u5168\u63D0\u9192",
    msgTabFeed: "\u7535\u8111\u63A8\u9001",
    noDevicesHint: "\u624B\u673A\u626B\u7801\u6253\u5F00\u9762\u677F\u5E76\u901A\u8FC7\u52A8\u6001\u7801\u9A8C\u8BC1\u540E,\u8BBE\u5907\u4F1A\u663E\u793A\u5728\u8FD9\u91CC;\u672C\u673A\u76F4\u5F00\u7684\u9762\u677F\u4E0D\u8BA1\u5165\u3002",
    noOnlineDevices: "\u5F53\u524D\u6CA1\u6709\u8BBE\u5907\u5728\u7EBF",
    openFailed: "\u6253\u5F00\u9762\u677F\u5931\u8D25",
    openPanel: "\u6253\u5F00\u9762\u677F",
    opening: "\u6B63\u5728\u6253\u5F00\u2026",
    pairedEmpty: "\u8FD8\u6CA1\u6709\u624B\u673A\u901A\u8FC7\u626B\u7801\u914D\u5BF9",
    pairedLongTag: "\u957F\u671F\u514D\u626B\u7801",
    pairedTitle: "\u5DF2\u914D\u5BF9\u7684\u624B\u673A",
    pairedUnpair: "\u89E3\u9664\u914D\u5BF9",
    pairedUnpairFail: "\u89E3\u9664\u5931\u8D25",
    pairedUnpaired: "\u5DF2\u89E3\u9664\u8BE5\u8BBE\u5907\u914D\u5BF9",
    pairedUnpairing: "\u89E3\u9664\u4E2D\u2026",
    pairedWebNote: "\u53E6\u6709 {n} \u4E2A\u7F51\u9875\u767B\u5F55\u4F1A\u8BDD\uFF08\u6D4F\u89C8\u5668\u6253\u5F00\uFF0C\u672A\u957F\u671F\u7ED1\u5B9A\uFF09\uFF0C\u5728\u4E0A\u65B9\u300C\u5728\u7EBF / \u5386\u53F2\u300D\u5206\u533A\u67E5\u770B\u6216\u8E22\u51FA",
    pairAppTempNote: "\u624B\u673A App \u626B\u6B64\u7801\u53EA\u83B7\u5F97 1 \u5C0F\u65F6\u4E34\u65F6\u4F1A\u8BDD,\u4E0D\u4F1A\u957F\u671F\u7ED1\u5B9A;\u8981\u957F\u671F\u514D\u626B\u7801\u8BF7\u5207\u5230\u4E0A\u9762\u7684\u300C\u957F\u671F\u7801\u300D\u3002",
    pairLongIncomplete: "\u914D\u5BF9\u7801\u54CD\u5E94\u4E0D\u5B8C\u6574",
    pairSegLong: "\u957F\u671F\u7801",
    pairSegTemp: "\u4E34\u65F6\u7801",
    pairSettingsTitle: "\u914D\u5BF9\u8BBE\u7F6E\uFF08\u6B21\u6570 / \u6362\u7801\uFF09",
    pairExpired: '\u914D\u5BF9\u5DF2\u8FC7\u671F,\u70B9"\u5237\u65B0\u4E8C\u7EF4\u7801"\u91CD\u65B0\u751F\u6210',
    pairLeft: "\u5269\u4F59",
    pairOnce: "\u4E00\u6B21\u6027\u914D\u5BF9\u94FE\u63A5",
    pairStatic: "\u5F15\u5BFC\u94FE\u63A5(24 \u5C0F\u65F6\u6709\u6548)",
    pairSwap: "\u6362\u4E00\u4E2A\u7801",
    pairUses: "\u5DF2\u626B\u7801",
    pairUsesLabel: "\u626B\u7801\u6B21\u6570",
    pairUsesOne: "1 \u6B21(\u626B\u5B8C\u6362\u7801)",
    pairUsesTimes: "\u6B21",
    pluginUpdDesc: "\u5F53\u524D\u7248\u672C v{cur},\u5B98\u7F51\u5DF2\u53D1\u5E03 v{v}\u3002\u66F4\u65B0\u540E\u53EF\u83B7\u5F97\u6700\u65B0\u4FEE\u590D\u4E0E\u65B0\u529F\u80FD\u3002",
    pluginUpdTitle: "\u53D1\u73B0\u63D2\u4EF6\u65B0\u7248\u672C v{v}",
    pushComposerHint: "\u53D1\u9001\u540E,\u624B\u673A App \u4E0E\u672C\u673A\u901A\u77E5\u4E2D\u5FC3\u90FD\u4F1A\u5F39\u51FA\u8FD9\u6761\u6D88\u606F",
    pushComposerTitle: "\u53D1\u9001\u6D88\u606F",
    pushDesc: "\u628A\u8BBE\u5907\u8FDE\u5165\u3001\u88AB\u8E22\u3001\u9ED1\u540D\u5355\u30012FA\u3001\u914D\u5BF9\u7B49\u5B89\u5168\u4E8B\u4EF6,\u4EE5\u53CA\u7CFB\u7EDF\u6D88\u606F\u5B9E\u65F6\u63A8\u9001\u5230\u4F60\u7684\u624B\u673A\u3002",
    pushEmpty: "\u6682\u65E0\u63A8\u9001\u3002\u5F00\u542F\u63A8\u9001\u540E,\u5B89\u5168\u4E8B\u4EF6\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002",
    pushEnabledHint: "\u603B\u5F00\u5173:\u5F00\u542F\u540E\u624B\u673A\u53EF\u6536\u5230\u672C\u673A\u9762\u677F\u7684\u63A8\u9001\u6D88\u606F",
    pushEnabledLabel: "\u63A5\u6536\u624B\u673A\u63A8\u9001",
    pushGroupOfficial: "\u5B98\u65B9\u6D88\u606F",
    pushGroupSecurity: "\u5B89\u5168\u52A8\u6001",
    pushKindBan: "\u9ED1\u540D\u5355",
    pushKindDev: "\u8BBE\u5907",
    pushKindJoin: "\u8BBE\u5907\u8FDE\u5165",
    pushKindKick: "\u8E22\u4E0B\u7EBF",
    pushKindMsg: "\u6D88\u606F",
    pushKindPair: "\u914D\u5BF9",
    pushKindTest: "\u6D4B\u8BD5",
    pushKindTotp: "2FA",
    pushKindVerify: "\u9A8C\u8BC1",
    pushMsgBodyLabel: "\u5185\u5BB9",
    pushManualFold: "\u624B\u52A8\u53D1\u9001 / \u6D4B\u8BD5",
    pushMsgBodyPh: "\u8F93\u5165\u8981\u63A8\u9001\u7684\u6D88\u606F\u2026",
    pushMsgTitleLabel: "\u6807\u9898(\u53EF\u9009)",
    pushMsgTitlePh: "\u4E0D\u586B\u5219\u53EA\u663E\u793A\u6D88\u606F\u5185\u5BB9",
    pushOff: "\u672A\u5F00\u542F",
    pushOn: "\u5DF2\u5F00\u542F",
    pushPollFailed: "\u8BFB\u53D6\u63A8\u9001\u914D\u7F6E\u5931\u8D25",
    pushRecent: "\u6700\u8FD1\u63A8\u9001",
    pushRefresh: "\u5237\u65B0",
    pushRefreshing: "\u5237\u65B0\u4E2D\u2026",
    pushSaveFailed: "\u8BBE\u7F6E\u4FDD\u5B58\u5931\u8D25",
    pushSend: "\u53D1\u9001",
    pushSendFail: "\u6D88\u606F\u53D1\u9001\u5931\u8D25",
    pushSendOff: "\u63A8\u9001\u5F00\u5173\u672A\u5F00\u542F,\u6D88\u606F\u672A\u53D1\u51FA",
    pushSendOk: "\u6D88\u606F\u5DF2\u63A8\u9001",
    pushSending: "\u53D1\u9001\u4E2D\u2026",
    pushSystemHint: "\u8BBE\u5907\u8FDE\u5165 / \u88AB\u8E22 / \u9ED1\u540D\u5355 / 2FA / \u914D\u5BF9",
    pushSystemLabel: "\u7CFB\u7EDF\u5B89\u5168\u4E8B\u4EF6",
    pushTest: "\u53D1\u9001\u6D4B\u8BD5\u63A8\u9001",
    pushTestBody: "\u8FD9\u662F\u4E00\u6761\u6765\u81EA DSH \u8FDC\u7A0B\u52A9\u624B\u7684\u6D4B\u8BD5\u63A8\u9001\u6D88\u606F",
    pushTestFail: "\u6D4B\u8BD5\u63A8\u9001\u53D1\u9001\u5931\u8D25",
    pushTestOk: "\u6D4B\u8BD5\u63A8\u9001\u5DF2\u53D1\u9001",
    pushTestTitle: "\u6D4B\u8BD5\u63A8\u9001",
    pushTesting: "\u53D1\u9001\u4E2D\u2026",
    pushTitle: "\u6D88\u606F\u63A8\u9001",
    qrAlt: "\u914D\u5BF9\u4E8C\u7EF4\u7801",
    refresh: "\u5237\u65B0\u4E8C\u7EF4\u7801",
    save: "\u4FDD\u5B58",
    saved: "\u5DF2\u4FDD\u5B58",
    saving: "\u4FDD\u5B58\u4E2D\u2026",
    sdCurrent: "\u5F53\u524D {n} \u5929",
    sdDay1: "1 \u5929",
    sdDay30: "30 \u5929",
    sdDay7: "7 \u5929",
    sdHint: "\u65B0\u8BBE\u5907\u9A8C\u8BC1\u901A\u8FC7\u540E,\u514D\u91CD\u590D\u9A8C\u8BC1\u7684\u6709\u6548\u671F\u3002\u53EA\u5F71\u54CD\u4E4B\u540E\u65B0\u7B7E\u53D1\u7684\u4F1A\u8BDD;\u8981\u7ACB\u5373\u8BA9\u5168\u90E8\u8BBE\u5907\u91CD\u65B0\u9A8C\u8BC1,\u7528 2FA \u9875\u7684\u300C\u5168\u90E8\u8E22\u4E0B\u7EBF\u300D\u3002",
    sdLoadFail: "\u8BFB\u53D6\u5931\u8D25(\u95F8\u673A\u672A\u8FD0\u884C?)",
    sdLoading: "\u2026",
    sdSaveFail: "\u4FDD\u5B58\u5931\u8D25",
    sdTitle: "\u4F1A\u8BDD\u6709\u6548\u671F",
    sigAdvanced: "\u9AD8\u7EA7",
    sigAdvancedHint: "\u91CD\u542F\u95F8\u673A\u7B49\u8FD0\u7EF4\u64CD\u4F5C",
    sigCleared: "\u5DF2\u6E05\u9664:{s} \u53F0\u5728\u7EBF\u4F1A\u8BDD\u3001{d} \u53F0\u8BBE\u5907\u5BC6\u94A5\u3001{g} \u4E2A\u672A\u7528\u914D\u5BF9\u7801",
    sigClearedRecords: "\u3001{n} \u6761\u8BBE\u5907\u8BB0\u5F55",
    sigClearing: "\u6B63\u5728\u6E05\u9664\u2026",
    sigDevsHint: "\u67E5\u770B / \u505C\u6B62\u6388\u6743",
    sigHealthBad: "\u95F8\u673A\u672A\u54CD\u5E94(\u96A7\u9053/\u8FDB\u7A0B\u53EF\u80FD\u5DF2\u505C)",
    sigHealthOk: "\u95F8\u673A\u8FD0\u884C\u4E2D \xB7 \u5F3A\u5236\u7B7E\u540D{e} \xB7 \u5DF2\u6388\u6743 {n} \u53F0 \xB7 \u5728\u7EBF {s} \u53F0",
    sigHealthOff: "\u672A\u5F00\u542F",
    sigHealthOn: "\u5DF2\u751F\u6548",
    sigOnlineTag: "\xB7 \u5728\u7EBF",
    sigRestart: "\u91CD\u542F\u95F8\u673A",
    sigRestarting: "\u91CD\u542F\u4E2D\u2026",
    sigRevokeAll: "\u6E05\u9664\u6240\u6709\u6388\u6743",
    sigRevokeAllDo: "\u786E\u8BA4\u6E05\u9664",
    sigRevokeAllText: "\u5C06\u64A4\u9500\u3010\u6240\u6709\u8BBE\u5907\u3011\u7684\u767B\u5F55\u4F1A\u8BDD\u4E0E\u7B7E\u540D\u5BC6\u94A5,\u4F5C\u5E9F\u672A\u4F7F\u7528\u7684\u914D\u5BF9\u7801,\u5E76\u6E05\u7A7A\u5168\u90E8\u8BBE\u5907\u8BB0\u5F55\u3002\u4E4B\u540E\u6BCF\u53F0\u624B\u673A/\u6D4F\u89C8\u5668\u90FD\u5FC5\u987B\u91CD\u65B0\u626B\u7801,\u786E\u5B9A\u7EE7\u7EED?",
    sigUnnamed: "(\u672A\u547D\u540D)",
    sigCancel: "\u53D6\u6D88",
    sigConfirm: "\u518D\u786E\u8BA4\u4E00\u6B21:\u6240\u6709\u5E38\u7528\u8BBE\u5907\u90FD\u5DF2\u5347\u7EA7\u5230 v1.0.55+ \u5E76\u5B8C\u6210\u5BC6\u94A5\u7ED1\u5B9A?\u5F00\u542F\u8BEF\u4F24\u81EA\u5DF1\u65F6,\u56DE\u6765\u8FD9\u91CC\u5173\u6389\u5373\u53EF(\u7ACB\u5373\u751F\u6548)\u3002",
    sigCounts: "\u8BBE\u5907 {d} \xB7 \u6301\u5BC6\u94A5 {k} \xB7 \u6301\u516C\u94A5 {p}",
    sigDedupe: "\u4E00\u952E\u53BB\u91CD({n})",
    sigDedupeDone: "\u5DF2\u5220\u9664 {n} \u53F0\u91CD\u590D\u6863\u6848",
    sigDedupeHint: "\u540C\u673A\u91CD\u590D\u6863\u6848 {n} \u53F0:\u5220\u9664\u591A\u4F59\u6863\u6848(\u5E76\u505C\u6B62\u5176\u6388\u6743),\u53EA\u4FDD\u7559\u6700\u65B0\u4E00\u53F0",
    sigDedupePart: "\u5DF2\u5220\u9664 {ok}/{n} \u53F0,\u5176\u4F59\u53EA\u505C\u6B62\u6388\u6743(\u5220\u6863\u9700\u65B0\u7248\u95F8\u673A+\u672C\u673A\u9762\u677F)",
    sigDedupeYes: "\u786E\u8BA4\u53BB\u91CD",
    sigDevs: "\u8BBE\u5907\u51ED\u8BC1",
    sigFail: "\u5207\u6362\u5931\u8D25(\u9700 DSH \u91CD\u542F\u540E\u751F\u6548\u7684 host \u8DEF\u7531\u672A\u5C31\u7EEA?)",
    sigFail2: "\u64CD\u4F5C\u5931\u8D25",
    sigForceYes: "\u4ECD\u8981\u5F00\u542F\uFF08\u6211\u5DF2\u786E\u8BA4\u98CE\u9669\uFF09",
    sigHasKeyB: "\u5BC6\u94A5",
    sigHasPub: "\u516C\u94A5",
    sigHint: "\u5224\u636E:\u8FD0\u884C\u65E5\u5FD7\u91CC\u300C\u5BBD\u5BB9\u671F:\u65E0\u7B7E\u540D\u8BF7\u6C42\u300D\u4E0D\u518D\u51FA\u73B0(\u4E8B\u4EF6 60s \u8282\u6D41,\u5173\u6389\u624B\u673A\u6D4F\u89C8\u5668\u540E\u53F0\u5237\u65B0\u518D\u7B49\u51E0\u5206\u949F\u518D\u770B)\u3002",
    sigLoading: "\u2026",
    sigNoKey: "\u65E0\u5BC6\u94A5",
    sigOff: "\u5BBD\u5BB9\u671F",
    sigOn: "\u5F3A\u5236",
    sigRdCanOn: "\u53EF\u5F00\u542F",
    sigRdLock: "\u6D3B\u8DC3\u8BBE\u5907 {w}/{t} \u5DF2\u7ED1\u516C\u94A5\uFF0C\u8FD8\u5DEE {n} \u53F0\uFF1B\u6B64\u65F6\u5F00\u542F\u4F1A\u628A\u672A\u7ED1\u8BBE\u5907\u5168\u90E8\u62E6\u5728\u5F15\u5BFC\u9875\u3002",
    sigRdNotReady: "\u672A\u5C31\u7EEA(\u6709\u8BBE\u5907\u672A\u7ED1\u5BC6\u94A5)",
    sigRdReady: "\u5C31\u7EEA",
    sigRdTitle: "\u5C31\u7EEA\u5EA6",
    sigRevoke: "\u505C\u6B62\u6388\u6743",
    sigRevoked: "\u5DF2\u505C\u6B62\u6388\u6743,\u8BE5\u8BBE\u5907\u9700\u91CD\u65B0\u914D\u5BF9\u6216\u8F93\u52A8\u6001\u7801",
    sigRevokedBadge: "\u5DF2\u89E3\u9664\u6388\u6743",
    sigRevokedKeep: "\u5DF2\u505C\u6B62\u6388\u6743,\u8BE5\u8BBE\u5907\u9700\u91CD\u65B0\u914D\u5BF9\u6216\u8F93\u52A8\u6001\u7801(\u8BB0\u5F55\u4FDD\u7559:\u5220\u9664\u6863\u6848\u9700\u672C\u673A\u7BA1\u7406\u5458\u9762\u677F)",
    sigRevokedPurged: "\u5DF2\u89E3\u9664\u6388\u6743,\u8BBE\u5907\u8BB0\u5F55\u5DF2\u5220\u9664",
    sigRevoking: "\u505C\u6B62\u4E2D\u2026",
    sigSwitchHint: "\u5F00\u542F\u540E,\u65E0\u6709\u6548\u8BBE\u5907\u7B7E\u540D\u7684\u8BF7\u6C42\u4E00\u5F8B 401+\u5F15\u5BFC\u9875;\u6301 30 \u5929\u4F1A\u8BDD\u4F46\u672A\u7ED1\u5BC6\u94A5\u7684\u8BBE\u5907\u4F1A\u88AB\u62D2\u3002",
    sigSwitchLabel: "\u5F00\u542F\u5F3A\u5236\u6821\u9A8C",
    sigTitle: "\u5F3A\u5236\u8BBE\u5907\u7B7E\u540D",
    sigYes: "\u786E\u8BA4\u5F00\u542F",
    startCtl: "\u5F00\u59CB\u63A7\u5236",
    startFailed: "\u542F\u52A8\u5931\u8D25:",
    startTimeout: "\u672C\u673A\u95F8\u673A(127.0.0.1:3080)\u5728 30 \u79D2\u5185\u6CA1\u6709\u5C31\u7EEA\u3002\n\u8BF7\u67E5\u770B kit \u76EE\u5F55\u4E0B\u7684 browserctl_start.log \u4E0E browserctl_fwd.log;\n\u6700\u5E38\u89C1\u539F\u56E0\u662F\u5B89\u5168\u8F6F\u4EF6\u62E6\u622A frpc.exe(\u8BE6\u89C1 INSTALL.md \u5E38\u89C1\u95EE\u9898\u7B2C 1 \u6761)\u3002",
    startTimeoutShort: "\u672C\u673A\u95F8\u673A(127.0.0.1:3080)\u5728 30 \u79D2\u5185\u6CA1\u6709\u5C31\u7EEA,\u8BF7\u67E5\u770B kit \u76EE\u5F55\u4E0B\u7684\u65E5\u5FD7\u6587\u4EF6\u3002",
    starting: "\u6B63\u5728\u542F\u52A8\u96A7\u9053\u2026",
    statusLoading: "\u6B63\u5728\u751F\u6210\u4E8C\u7EF4\u7801\u2026",
    statusNoSecret: '\u96A7\u9053\u672A\u5C31\u7EEA:\u70B9\u4E0B\u65B9"\u5F00\u59CB\u63A7\u5236"\u542F\u52A8\u672C\u673A\u7A7F\u900F,\u51E0\u79D2\u540E\u81EA\u52A8\u51FA\u4E8C\u7EF4\u7801',
    statusReady: "\u96A7\u9053\u5C31\u7EEA,\u626B\u7801\u5373\u53EF\u6253\u5F00\u9762\u677F",
    statusTunnelBuilding: "\u96A7\u9053\u6B63\u5728\u5EFA\u7ACB,\u51E0\u79D2\u540E\u81EA\u52A8\u51FA\u4E8C\u7EF4\u7801(\u65E0\u9700\u518D\u70B9\u300C\u5F00\u59CB\u63A7\u5236\u300D)",
    statusTunnelStarting: "\u96A7\u9053\u6B63\u5728\u5EFA\u7ACB,\u8BF7\u7A0D\u5019\u51E0\u79D2\u540E\u5237\u65B0\u4E8C\u7EF4\u7801",
    stopCtl: "\u505C\u6B62\u63A7\u5236",
    stopCtlConfirm: "\u786E\u8BA4\u505C\u6B62\uFF1F",
    stopping: "\u6B63\u5728\u505C\u6B62\u2026",
    subtitle: "\u624B\u673A\u626B\u7801\u6216\u590D\u5236\u94FE\u63A5,\u76F4\u63A5\u6253\u5F00\u672C\u673A\u52A9\u624B\u9762\u677F",
    sysFail: "\u8BFB\u53D6\u5931\u8D25(\u95F8\u673A\u672A\u8FD0\u884C?)",
    sysFree: "\u4F59",
    sysHint: "\u6570\u636E\u6765\u81EA\u672C\u673A\u95F8\u673A,\u7EA6 10 \u79D2\u7F13\u5B58\u3002",
    sysMem: "\u5185\u5B58",
    sysTitle: "\u4E3B\u673A\u72B6\u6001",
    tab: "DSH \u8FDC\u7A0B\u52A9\u624B",
    tab2fa: "2FA",
    tabApp: "App \u914D\u5BF9",
    tabBan: "\u9ED1\u540D\u5355",
    tabConnect: "\u8FDE\u63A5",
    tabDevices: "\u8BBE\u5907",
    tabLog: "\u6392\u969C",
    tabPush: "\u63A8\u9001",
    tabSecurity: "\u5B89\u5168",
    ticketCopyContent: "\u590D\u5236\u65E5\u5FD7\u5185\u5BB9",
    ticketCopyContentDesc: "\u628A\u5DF2\u6253\u7801\u7684\u5168\u6587\u590D\u5236\u5230\u526A\u8D34\u677F\uFF0C\u53EF\u76F4\u63A5\u7C98\u8D34\u7ED9\u522B\u4EBA\u3002",
    ticketCopyFail: "\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u6253\u5F00\u5BFC\u51FA\u7684 txt \u624B\u52A8\u590D\u5236\u3002",
    ticketCopyOk: "\u65E5\u5FD7\u5185\u5BB9\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F",
    ticketCopyPath: "\u590D\u5236\u8DEF\u5F84",
    ticketCopyPathOk: "\u8DEF\u5F84\u5DF2\u590D\u5236",
    ticketDestTitle: "\u5BFC\u51FA\u53BB\u5411",
    ticketExportAgain: "\u91CD\u65B0\u5BFC\u51FA",
    ticketExportDo: "\u751F\u6210\u5E76\u5BFC\u51FA\u8BCA\u65AD\u65E5\u5FD7",
    ticketExportDone: "\u5DF2\u5BFC\u51FA\u5230\uFF1A",
    ticketExportHostOld: "\u63D2\u4EF6\u5BBF\u4E3B\u8FD8\u662F\u65E7\u7248\u672C\uFF08\u65B0\u529F\u80FD\u8981\u5B8C\u5168\u91CD\u542F DSH \u624D\u751F\u6548\uFF09\u3002\u8BF7\u5F7B\u5E95\u9000\u51FA DSH \u518D\u91CD\u65B0\u6253\u5F00\uFF0C\u7136\u540E\u91CD\u8BD5\u3002",
    ticketExportNote: "\u65E5\u5FD7\u53EA\u5728\u672C\u673A\u751F\u6210\u3001\u4E0D\u4F1A\u81EA\u52A8\u4E0A\u4F20\uFF1B\u4F55\u65F6\u4E0A\u4F20\u3001\u4E0A\u4F20\u54EA\u4E00\u7248\u5B8C\u5168\u7531\u4F60\u5728\u7F51\u9875\u7AEF\u51B3\u5B9A\u3002",
    ticketExportSubtitle: "\u5BFC\u51FA\u672C\u673A\u8BCA\u65AD\u65E5\u5FD7\uFF08\u81EA\u52A8\u6253\u7801\uFF09\uFF0C\u7136\u540E\u9009\u62E9\u65E5\u5FD7\u53BB\u5411\u3002",
    ticketExporting: "\u6B63\u5728\u5BFC\u51FA\u2026",
    ticketLoading: "\u52A0\u8F7D\u4E2D\u2026",
    ticketNoContent: "\u65E5\u5FD7\u8FD8\u6CA1\u751F\u6210\uFF0C\u8BF7\u5148\u300C\u751F\u6210\u5E76\u5BFC\u51FA\u8BCA\u65AD\u65E5\u5FD7\u300D\u3002",
    ticketOpenFolder: "\u6253\u5F00\u6240\u5728\u6587\u4EF6\u5939",
    ticketOpenWeb: "\u6253\u5F00\u7F51\u9875\u7248\u5DE5\u5355",
    ticketOpenWebDesc: "\u63A8\u8350\uFF1A\u767B\u5F55\u540E\u5728\u7F51\u9875\u7AEF\u63D0\u4EA4\u5DE5\u5355\uFF0C\u5E76\u628A\u8FD9\u4EFD txt \u4F5C\u4E3A\u300C\u8FD0\u884C\u65E5\u5FD7\u300D\u4E0A\u4F20\u3002",
    ticketOpening: "\u6B63\u5728\u6253\u5F00\u2026",
    ticketSaveGo: "\u4FDD\u5B58\u5230\u8FD9\u91CC",
    ticketSaveOk: "\u5DF2\u53E6\u5B58\u5230\uFF1A",
    ticketSaveOther: "\u5B58\u5230\u5176\u4ED6\u6587\u4EF6\u5939",
    ticketSaveOtherDesc: "\u628A\u8FD9\u4EFD\u65E5\u5FD7\u518D\u5B58\u4E00\u4EFD\u5230\u4F60\u9009\u7684\u6587\u4EF6\u5939\u3002",
    ticketSavePathPh: "\u7C98\u8D34\u6587\u4EF6\u5939\u5B8C\u6574\u8DEF\u5F84\uFF0C\u5982 C:\\Users\\\u4F60\\Documents",
    ticketSaving: "\u6B63\u5728\u4FDD\u5B58\u2026",
    tickets: "\u5DE5\u5355\u53CD\u9988",
    totpAppHint: "\u624B\u673A\u7AEF\u9700\u8981\u5B89\u88C5\u9A8C\u8BC1\u5668 App \u751F\u6210\u52A8\u6001\u7801,\u63A8\u8350\u5FAE\u8F6F\u5B98\u65B9 Microsoft Authenticator:",
    totpAppLink: "\u5FAE\u8F6F\u5B98\u7F51\u4E0B\u8F7D",
    totpBind: "2FA \u7ED1\u5B9A\u4E8C\u7EF4\u7801",
    totpDisable: "\u7981\u7528 2FA",
    totpEnable: "\u542F\u7528 2FA",
    totpHintShort: "\u5F00\u542F\u540E,\u624B\u673A\u6253\u5F00\u9762\u677F\u9700\u5148\u8F93\u5165\u9A8C\u8BC1\u5668 6 \u4F4D\u52A8\u6001\u7801;\u8FDE\u9519 5 \u6B21\u51BB\u7ED3 15 \u5206\u949F\u3002",
    totpKick: "\u5168\u90E8\u8E22\u4E0B\u7EBF",
    totpOff: "\u672A\u542F\u7528",
    totpOn: "\u5DF2\u542F\u7528",
    totpReset: "\u91CD\u7F6E\u5BC6\u94A5",
    totpSecretLabel: "\u5BC6\u94A5(\u624B\u52A8\u8F93\u5165\u7528)",
    totpTitle: "\u4E24\u6B65\u9A8C\u8BC1 (2FA)",
    updateApplyBtn: "\u4E00\u952E\u66F4\u65B0\u5230 v{v}",
    updateApplyDone: "\u5DF2\u66F4\u65B0\u5230 v{v}\uFF0C\u91CD\u542F DSH \u540E\u751F\u6548",
    updateApplyTip: "\u81EA\u52A8\u4E0B\u8F7D\u5B98\u65B9 zip \u8986\u76D6\u5F53\u524D\u63D2\u4EF6\u76EE\u5F55\uFF08\u4F1A\u5148\u505C\u6B62\u96A7\u9053\uFF09\uFF0C\u91CD\u542F DSH \u5373\u5B8C\u6210\u66F4\u65B0\uFF1B\u4EC5\u9002\u7528\u4E8E\u89E3\u538B\u76EE\u5F55\u5B89\u88C5",
    updateApplying: "\u6B63\u5728\u66F4\u65B0\uFF08\u4E0B\u8F7D\u5E76\u8986\u76D6\uFF0C\u52FF\u5173\u95ED\u9762\u677F\uFF09\u2026",
    updateCheck: "\u68C0\u67E5\u66F4\u65B0",
    updateChecking: "\u68C0\u67E5\u4E2D\u2026",
    updateCur: "\u5F53\u524D\u7248\u672C",
    updateDownload: "\u4E0B\u8F7D\u65B0\u7248\u672C",
    updateDownloadTip: "\u5728\u6D4F\u89C8\u5668\u6253\u5F00\u5B98\u65B9 zip \u76F4\u94FE\u624B\u52A8\u4E0B\u8F7D\uFF08\u7EA6 6.4 MB\uFF0C\u8D70\u5B98\u7F51\u670D\u52A1\u5668\uFF09\uFF1B\u4E00\u952E\u66F4\u65B0\u5931\u8D25\u65F6\u7684\u5907\u7528\u65B9\u5F0F",
    updateFailed: "\u66F4\u65B0\u68C0\u67E5\u5931\u8D25",
    updateFound: "\u53D1\u73B0\u65B0\u7248\u672C v{v}",
    updateGuideLocal: "\u66F4\u65B0\u65B9\u6CD5\uFF1A\u4E0B\u8F7D\u65B0 zip \u89E3\u538B\u540E\u8986\u76D6\u63D2\u4EF6\u76EE\u5F55\uFF08{dir}\uFF09\uFF0C\u91CD\u542F DSH \u751F\u6548\uFF1B\u82E5\u8986\u76D6\u540E\u96A7\u9053\u8D77\u4E0D\u6765\uFF0C\u5148\u53CC\u51FB\u76EE\u5F55\u91CC\u7684 fix-antivirus.bat \u89E3\u9664\u6740\u8F6F\u62E6\u622A",
    updateGuidePackage: "\u66F4\u65B0\u65B9\u6CD5\uFF1A\u547D\u4EE4\u884C\u6267\u884C {cmd}\uFF0C\u91CD\u542F DSH \u751F\u6548",
    updateGuideTestNote: "\uFF08\u66F4\u65B0\u4F1A\u8986\u76D6\u5F53\u524D\u5B89\u88C5\u76EE\u5F55\uFF0C\u91CD\u542F DSH \u751F\u6548\uFF09",
    updateIgnore: "\u5FFD\u7565\u6B64\u7248\u672C",
    updateIgnoreTip: "\u672C\u7248\u672C\u4E0D\u518D\u63D0\u9192\uFF1B\u5B98\u7F51\u53D1\u5E03\u66F4\u65B0\u7248\u672C\u540E\u4F1A\u91CD\u65B0\u63D0\u793A",
    updateLst: "\u6700\u65B0\u7248\u672C",
    updateNotesTitle: "\u66F4\u65B0\u8BF4\u660E",
    updateRecheck: "\u91CD\u65B0\u68C0\u67E5",
    updateRecheckTip: "\u91CD\u65B0\u5411\u5B98\u65B9\u66F4\u65B0\u6E90\u67E5\u8BE2\u6700\u65B0\u7248\u672C\uFF08\u6570\u636E\u6E90\uFF1AGitHub Release\uFF0C\u5B98\u7F51\u670D\u52A1\u5668\u6BCF\u5C0F\u65F6\u540C\u6B65\uFF0C\u56FD\u5185\u76F4\u8FDE\uFF09",
    updateUpToDate: "\u5DF2\u662F\u6700\u65B0\u7248\u672C"
  }
};

// locale/en.json
var en_default = {
  meta: {
    description: "Securely tunnel this DeepSeek assistant web panel to your phone or any browser for remote control, anywhere.",
    title: "DshRemote"
  },
  panel: {
    about: "About",
    aboutAccount: "Sign in",
    aboutAccountLogged: "Signed in",
    aboutApp: "App Download",
    aboutDesc: "Securely tunnel this DeepSeek assistant web panel to your phone or any browser for remote control, anywhere.",
    aboutGithub: "GitHub",
    aboutQq: "QQ Group",
    aboutWebsite: "Website",
    appCopyLink: "Copy pairing link",
    appLoading: "Generating long-term pairing code\u2026",
    appNoQr: "Long-term pairing code unavailable",
    appOnceHint: 'This is a long-term pairing code: the app registers the device and saves its login, then reconnects without scanning. Scanning the one-time QR on the "Connect" tab only grants a 1-hour temporary session, not a persistent binding.',
    appQrAlt: "Long-term pairing QR code",
    appReady: "Long-term pairing code ready",
    appRefresh: "Refresh pairing code",
    appSubtitle: "Scan once to pair; the app reconnects without scanning",
    banAdd: "Add",
    banAddConfirm: "Ban",
    banAddFail: "Failed to add",
    banAddInvalid: "Invalid IP address",
    banAddOk: "Banned {ip}",
    banAddPh: "IP address to ban",
    banAddReason: "Manual ban",
    banCancel: "Cancel",
    banEmpty: 'No banned IPs. Click "Ban" on a device to add.',
    banTitle: "IP Blacklist",
    bannedOk: "Banned {n}",
    banBusy: "Banning\u2026",
    banUnban: "Unban",
    banUnbanFail: "Unban failed",
    banUnbanOk: "Unbanned {ip}",
    cancel: "Cancel",
    close: "Close",
    config: "Settings",
    configAcctCopied: "Copied",
    configAcctCopy: "Copy link",
    configAcctLoadFail: "Official server unreachable, please try again later.",
    configAcctLoggedIn: "Signed in",
    configAcctLoggedOut: "Signed out (tunnel will disconnect; sign in again to restore)",
    configAcctLoggingOut: "Signing out\u2026",
    configAcctLogout: "Sign out",
    configAcctOauthBtn: "Sign in / Register",
    configAcctOauthCancel: "Cancel",
    configAcctOauthDone: "Authorized \u2014 applying your account and dedicated port\u2026",
    configAcctOauthExpired: "Authorization expired, please start again.",
    configAcctOauthFail: "Authorization failed:",
    configAcctOauthHint: "Your browser will open the official site to sign in / register, then come back automatically",
    configAcctOauthNetwork: "Official server unreachable, please try again later.",
    configAcctOauthOpenAgain: "Reopen approval page",
    configAcctOauthOpenBrowser: 'Browser opened: sign in to your account on the site and click "Approve". If it did not open, use the button below.',
    configAcctOauthOpenFail: "Could not open your browser automatically \u2014 open the approval page via the link below.",
    configAcctOauthOpening: "Opening browser\u2026",
    configAcctOauthWait: "Waiting for approval\u2026",
    configAcctPort: "Dedicated port",
    configAcctRestartFail: 'Signed in, but tunnel restart failed: press "Start" to launch it manually.',
    configAcctTitle: "Official account",
    configHost: "Server address (host)",
    configHostPh: "e.g. frps.example.com",
    configHostRequired: "Server address is required",
    configOfficial: "Official server",
    configOfficialHint: "Register / sign in to your official account \u2014 works out of the box",
    configOfficialNote: "Official server: sign in (or register) and a dedicated entry is assigned automatically \u2014 no server details to fill in.",
    configPort: "frps port",
    configRemotePort: "Remote port (optional)",
    configSelfhost: "Self-hosted server",
    configSelfhostHint: "Use your own frps server",
    configSubtitle: "Connect to the official server or your own frps server",
    configToken: "FRP token",
    configTokenKeep: "Saved (leave blank to keep)",
    configTokenNote: "Token is stored only in local browserctl_secrets.json (gitignored, never committed or uploaded).",
    configTokenPh: "Enter the frps auth token",
    connScanTitle: "Scan to connect",
    copied: "Copied",
    copyLink: "Copy link",
    copySecret: "Copy secret",
    devCardMeta: "live / history / banned / paired",
    devCardTitle: "Devices & access",
    devConnTimes: "{n} connections",
    devSecBanned: "Banned IPs",
    devSecHistory: "History \xB7 aggregated",
    devSecOnlineN: "Online \xB7 {n}",
    devSecPaired: "Paired phones",
    devTotalOnline: "total {d}",
    devUnknown: "Unknown device",
    deviceKick: "Kick",
    devicesOnline: "{n} online",
    devicesTitle: "Online devices",
    dupBadge: "{n} duplicates",
    durDay: "{n} d",
    durDayHour: "{d} d {h} h",
    durHour: "{n} h",
    durHourMin: "{h} h {m} min",
    durLess1Min: "under 1 min",
    durMin: "{n} min",
    durSec: "{n} s",
    histByDevice: "by device",
    histCount: "{n} total",
    histEmpty: "No device history yet",
    histTitle: "Device history",
    kickAllConfirm: "Confirm kick all?",
    kickBusy: "Kicking\u2026",
    kickFail: "Kick failed",
    kickOneConfirm: "Confirm kick?",
    kickedAll: "All devices kicked",
    kickedOne: "Device kicked",
    kindApp: "App",
    kindWeb: "Web",
    lastSeenOnline: "last active {d}",
    netError: "Network error",
    onlineFor: "online {d}",
    elevateHint: "If antivirus blocked frpc.exe or permissions got in the way, retry with administrator rights below (Windows will show a UAC prompt).",
    elevateStart: "Start as administrator",
    elevateStop: "Stop as administrator",
    elevateStopHint: "Stop did not take effect: these processes may be running as administrator.",
    elevateStartTimeout: "The gate (3080) was still not ready 45 seconds after elevated start; check browserctl_start.log and browserctl_fwd.log.",
    elevateStopTimeout: "The gate (3080) is still running after elevated stop; check browserctl_fwd.log.",
    elevating: "Waiting for elevation\u2026",
    settingsTitle: "Settings",
    settingsGeneral: "General",
    settingsAboutSec: "About & updates",
    settingsLegalSec: "Legal & privacy",
    settingsCfgRow: "Server & connection mode",
    legalAck: "Got it",
    legalMeta: "Effective {d} \xB7 Version {v}",
    legalPrivacy: "Privacy Policy",
    legalTerms: "User Agreement",
    linkCopied: "Copied",
    linkCopy: "Copy link",
    linkNote: 'Paired devices appear in the "Paired phones" section on the Devices tab and can be unpaired anytime; never share the pairing code with others.',
    linkOpenSite: "Open site",
    linkStep1: "Open the official site above in the phone browser (sign-in optional; this entry never changes, no matter how ports rotate)",
    linkStep2: 'On the computer, open the Connect tab and switch to the "Long-term" segment to show the pairing code (it rotates automatically after each scan)',
    linkStep3: "Scan it with the iPhone camera (not WeChat): the browser registers and binds the device, then opens the panel verification-free for 30 days",
    linkStep4: 'On the panel page, tap Share \u2192 "Add to Home Screen" to keep the entry permanently; after the 30-day window, scan a fresh code to renew',
    linkStepsTitle: "Binding steps",
    linkSubtitle: 'For devices without the app (iPhone / iPad): open the official site, then scan the long-term pairing code from the "App pairing" tab \u2014 one scan registers the device for 30 days of verification-free access; then "Add to Home Screen" to use it like an app. No PWA invite link needed.',
    linkTitle: "iOS / No-App devices",
    linkWebTag: "Web pairing",
    logEmpty: "No events yet. Device verifications, kicks and 2FA toggles are recorded here.",
    logCount: "{n} events",
    logNone: "None",
    logTabAll: "All",
    logTabBan: "Blacklist",
    logTabKick: "Kick",
    logTabLogin: "Login",
    logTabPair: "Pairing",
    logTabSettings: "Settings",
    logTabSys: "System",
    logTabTotp: "2FA",
    logTabUnsigned: "Unsigned",
    logTitle: "Event log",
    loginBtn: "Sign in",
    loginEmail: "Email",
    loginLoggingIn: "Signing in\u2026",
    loginOr: "or",
    loginPassword: "Password",
    loginPwdTitle: "Sign in with password",
    loginRequired: "Sign in required",
    loginRequiredDesc: "Using the official server requires signing in first; a dedicated entry is assigned after login. Tap below to sign in.",
    msgBack: "Back to list",
    msgCenter: "Notifications",
    msgEmptyFeed: "No pushes yet. Once push is enabled on this PC, its notifications will be collected here.",
    msgEmptyMine: "No messages",
    msgEmptyOfficial: "No announcements",
    msgGuestHint: "Showing public announcements; sign in to the official account to receive direct messages.",
    msgLoadFail: "Failed to load notifications",
    msgNoTitle: "(no title)",
    msgOfficial: "Announcement",
    msgOpenLink: "Open link",
    msgPersonal: "For you",
    msgStyleEvent: "Event",
    msgStyleUpdate: "Update",
    msgStyleWarning: "Security notice",
    msgTabFeed: "From this PC",
    noDevicesHint: "Devices appear here after opening the panel via the QR link and passing the 2FA code; locally opened panels are not counted.",
    noOnlineDevices: "No devices online right now",
    openFailed: "Failed to open panel",
    openPanel: "Open panel",
    opening: "Opening\u2026",
    pairedEmpty: "No phones paired yet",
    pairedLongTag: "No-scan pairing",
    pairedTitle: "Paired phones",
    pairedUnpair: "Unpair",
    pairedUnpairFail: "Unpair failed",
    pairedUnpaired: "Device unpaired",
    pairedUnpairing: "Unpairing\u2026",
    pairedWebNote: "{n} more web sessions (browser, not persistently bound) \u2014 see the Online / History sections above to kick them",
    pairAppTempNote: 'Scanning this code with the app grants only a 1-hour temporary session; for long-term pairing switch to the "Long-term" segment above.',
    pairLongIncomplete: "Incomplete pairing response",
    pairSegLong: "Long-term",
    pairSegTemp: "Temporary",
    pairSettingsTitle: "Pairing options (uses / rotate)",
    pairExpired: "Pairing expired \u2014 refresh to generate a new one",
    pairLeft: "expires in",
    pairOnce: "One-time pairing link",
    pairStatic: "Bootstrap link (valid for 24 hours)",
    pairSwap: "New code",
    pairUses: "used",
    pairUsesLabel: "Uses",
    pairUsesOne: "1 use (rotate after scan)",
    pairUsesTimes: "uses",
    pluginUpdDesc: "You are on v{cur}; v{v} has been released with the latest fixes and features.",
    pluginUpdTitle: "New plugin version v{v}",
    pushComposerHint: "The message pops up on the phone App and in this PC's notification centre",
    pushComposerTitle: "Send a message",
    pushDesc: "Realtime push of security events \u2014 device connect / kick / blacklist / 2FA / pairing \u2014 plus system messages to your phone.",
    pushEmpty: "No pushes yet. Security events will appear here once push is enabled.",
    pushEnabledHint: "Master switch: receive push from this panel on your phone",
    pushEnabledLabel: "Receive phone push",
    pushGroupOfficial: "Official",
    pushGroupSecurity: "Security activity",
    pushKindBan: "Ban",
    pushKindDev: "Device",
    pushKindJoin: "Connect",
    pushKindKick: "Kick",
    pushKindMsg: "Message",
    pushKindPair: "Pair",
    pushKindTest: "Test",
    pushKindTotp: "2FA",
    pushKindVerify: "Verify",
    pushMsgBodyLabel: "Content",
    pushManualFold: "Manual send & test",
    pushMsgBodyPh: "Type the message to push\u2026",
    pushMsgTitleLabel: "Title (optional)",
    pushMsgTitlePh: "Leave empty to show the message only",
    pushOff: "Off",
    pushOn: "On",
    pushPollFailed: "Failed to load push config",
    pushRecent: "Recent pushes",
    pushRefresh: "Refresh",
    pushRefreshing: "Refreshing\u2026",
    pushSaveFailed: "Failed to save settings",
    pushSend: "Send",
    pushSendFail: "Failed to send message",
    pushSendOff: "Push is off \u2014 message not sent",
    pushSendOk: "Message pushed",
    pushSending: "Sending\u2026",
    pushSystemHint: "Device connect / kick / blacklist / 2FA / pairing",
    pushSystemLabel: "Security events",
    pushTest: "Send test push",
    pushTestBody: "This is a test push from DSH Remote Assistant",
    pushTestFail: "Failed to send test push",
    pushTestOk: "Test push sent",
    pushTestTitle: "Test push",
    pushTesting: "Sending\u2026",
    pushTitle: "Push Notifications",
    qrAlt: "Pairing QR code",
    refresh: "Refresh QR",
    save: "Save",
    saved: "Saved",
    saving: "Saving\u2026",
    sdCurrent: "Currently {n} days",
    sdDay1: "1 day",
    sdDay30: "30 days",
    sdDay7: "7 days",
    sdHint: 'How long a verified device stays trusted. Only affects sessions issued afterwards; to force all devices to re-verify now, use "Kick all devices" on the 2FA tab.',
    sdLoadFail: "Load failed (gate not running?)",
    sdLoading: "\u2026",
    sdSaveFail: "Save failed",
    sdTitle: "Session lifetime",
    sigAdvanced: "Advanced",
    sigAdvancedHint: "Ops: restart gate, clear all",
    sigCleared: "Cleared {s} online sessions, {d} device keys, {g} unused pairing codes",
    sigClearedRecords: ", {n} device records",
    sigClearing: "Clearing\u2026",
    sigDevsHint: "View & revoke",
    sigHealthBad: "Gate not responding (tunnel or process may be stopped)",
    sigHealthOk: "Gate running \xB7 signatures {e} \xB7 {n} authorized \xB7 {s} online",
    sigHealthOff: "off",
    sigHealthOn: "enforced",
    sigOnlineTag: "\xB7 online",
    sigRestart: "Restart gate",
    sigRestarting: "Restarting\u2026",
    sigRevokeAll: "Clear all authorizations",
    sigRevokeAllDo: "Confirm clear",
    sigRevokeAllText: "This revokes every device's login sessions and signature keys, voids unused pairing codes and clears all device records. Every phone/browser must re-scan afterwards. Continue?",
    sigUnnamed: "(unnamed)",
    sigCancel: "Cancel",
    sigConfirm: "Confirm once more: all regular devices are on v1.0.55+ with keys bound? If this locks you out, come back here to switch it off (effective immediately).",
    sigCounts: "Devices {d} \xB7 With key {k} \xB7 With pubkey {p}",
    sigDedupe: "Dedupe ({n})",
    sigDedupeDone: "Removed {n} duplicate records",
    sigDedupeHint: "{n} duplicate records of the same device: delete the extras (and revoke them), keep the latest",
    sigDedupePart: "Removed {ok}/{n}; the rest were only revoked (deletion needs the new gate + local panel)",
    sigDedupeYes: "Confirm dedupe",
    sigDevs: "Device credentials",
    sigFail: "Switch failed (host route not ready? needs DSH restart)",
    sigFail2: "Operation failed",
    sigForceYes: "Enable anyway (I accept the risk)",
    sigHasKeyB: "Key",
    sigHasPub: "PubKey",
    sigHint: 'Criterion: "grace: unsigned request" stops appearing in the run log (events are throttled to 60s; close background phone browser tabs and wait a few minutes before judging).',
    sigLoading: "\u2026",
    sigNoKey: "No key",
    sigOff: "Grace period",
    sigOn: "Enforced",
    sigRdCanOn: "Ready to enable",
    sigRdLock: "{w}/{t} active devices have a bound key, {n} still missing; enabling now would lock them out on the boot page.",
    sigRdNotReady: "Not ready (some devices have no bound key)",
    sigRdReady: "Ready",
    sigRdTitle: "Readiness",
    sigRevoke: "Revoke",
    sigRevoked: "Revoked; the device must re-pair or verify with a code",
    sigRevokedBadge: "Revoked",
    sigRevokedKeep: "Revoked; the device must re-pair or verify with a code (record kept; deleting it needs the local admin panel)",
    sigRevokedPurged: "Revoked; device record deleted",
    sigRevoking: "Revoking\u2026",
    sigSwitchHint: "When enabled, requests without a valid device signature are rejected with 401 + onboarding page; devices holding a 30-day session but no bound key are refused.",
    sigSwitchLabel: "Enable enforcement",
    sigTitle: "Enforce device signatures",
    sigYes: "Confirm",
    startCtl: "Start control",
    startFailed: "Start failed:",
    startTimeout: "The local gate (127.0.0.1:3080) was not ready within 30 seconds.\nCheck browserctl_start.log and browserctl_fwd.log in the kit folder;\nthe most common cause is antivirus software blocking frpc.exe (see INSTALL.md FAQ #1).",
    startTimeoutShort: "The local gate (127.0.0.1:3080) was not ready within 30 seconds; check the log files in the kit folder.",
    starting: "Starting tunnel\u2026",
    statusLoading: "Generating QR code\u2026",
    statusNoSecret: 'Tunnel not ready: click "Start control" below, QR appears in a few seconds',
    statusReady: "Tunnel ready \u2014 scan to open the panel",
    statusTunnelBuilding: "Tunnel is starting \u2014 the QR appears automatically in a few seconds (no need to click Start again)",
    statusTunnelStarting: "Tunnel starting; refresh the QR in a few seconds",
    stopCtl: "Stop control",
    stopCtlConfirm: "Confirm stop?",
    stopping: "Stopping\u2026",
    subtitle: "Scan or copy the link to open this panel from any device",
    sysFail: "Load failed (gate not running?)",
    sysFree: "free",
    sysHint: "Sampled by the local gate, ~10s cache.",
    sysMem: "Memory",
    sysTitle: "Host status",
    tab: "DshRemote",
    tab2fa: "2FA",
    tabApp: "App Pairing",
    tabBan: "Blacklist",
    tabConnect: "Connect",
    tabDevices: "Devices",
    tabLog: "Troubleshoot",
    tabPush: "Push",
    tabSecurity: "Security",
    ticketCopyContent: "Copy log content",
    ticketCopyContentDesc: "Copy the redacted full text to the clipboard for pasting into a chat.",
    ticketCopyFail: "Copy failed \u2014 open the exported txt and copy manually.",
    ticketCopyOk: "Log content copied to clipboard",
    ticketCopyPath: "Copy path",
    ticketCopyPathOk: "Path copied",
    ticketDestTitle: "Where the log goes",
    ticketExportAgain: "Export again",
    ticketExportDo: "Export diagnostic logs",
    ticketExportDone: "Exported to:",
    ticketExportHostOld: "The plugin host is still the old version (this feature needs a full DSH restart). Quit DSH completely, reopen it, then try again.",
    ticketExportNote: "Logs are generated locally and never uploaded automatically; you decide what to upload on the web.",
    ticketExportSubtitle: "Export the local diagnostic log (auto-redacted), then choose where it goes.",
    ticketExporting: "Exporting\u2026",
    ticketLoading: "Loading\u2026",
    ticketNoContent: 'Log not generated yet \u2014 click "Export diagnostic logs" first.',
    ticketOpenFolder: "Open folder",
    ticketOpenWeb: "Open web ticket page",
    ticketOpenWebDesc: "Recommended: sign in, submit the ticket on the web and upload this txt as a log file.",
    ticketOpening: "Opening\u2026",
    ticketSaveGo: "Save here",
    ticketSaveOk: "Saved to: ",
    ticketSaveOther: "Save to another folder",
    ticketSaveOtherDesc: "Keep another copy of this log in a folder you choose.",
    ticketSavePathPh: "Paste a full folder path, e.g. C:\\Users\\you\\Documents",
    ticketSaving: "Saving\u2026",
    tickets: "Ticket Feedback",
    totpAppHint: "An authenticator app on the phone generates the codes; Microsoft Authenticator is recommended:",
    totpAppLink: "Get it from Microsoft",
    totpBind: "2FA binding QR code",
    totpDisable: "Disable 2FA",
    totpEnable: "Enable 2FA",
    totpHintShort: "Devices must enter a 6-digit code to open the panel; 5 wrong tries lock for 15 minutes.",
    totpKick: "Kick all devices",
    totpOff: "Disabled",
    totpOn: "Enabled",
    totpReset: "Reset secret",
    totpSecretLabel: "Secret (manual entry)",
    totpTitle: "Two-Factor Auth (2FA)",
    updateApplyBtn: "Update to v{v}",
    updateApplyDone: "Updated to v{v}; restart DSH to apply",
    updateApplyTip: "Downloads the official zip and overwrites this plugin folder (the tunnel stops first). Restart DSH to finish; works for extracted-folder installs only",
    updateApplying: "Updating (downloading & overwriting)\u2026",
    updateCheck: "Check for updates",
    updateChecking: "Checking\u2026",
    updateCur: "Current version",
    updateDownload: "Download",
    updateDownloadTip: "Open the official zip direct link in your browser (about 6.4 MB) as a manual fallback",
    updateFailed: "Update check failed",
    updateFound: "New version v{v} available",
    updateGuideLocal: "To update: download the new zip, extract it over the plugin folder ({dir}), then restart DSH. If the tunnel fails afterwards, run fix-antivirus.bat in the folder first",
    updateGuidePackage: 'To update: run "{cmd}" in a terminal, then restart DSH',
    updateGuideTestNote: " (test copy: one-click update is disabled here \u2014 use the release tool to sync)",
    updateIgnore: "Ignore this version",
    updateIgnoreTip: "Skip reminders for this version; newer releases will notify again",
    updateLst: "Latest version",
    updateNotesTitle: "Release notes",
    updateRecheck: "Check again",
    updateRecheckTip: "Query the official update source again (GitHub Release, mirrored hourly by the website server)",
    updateUpToDate: "You are up to date"
  }
};

// src/client.jsx
var import_jsx_runtime19 = require("react/jsx-runtime");
function BrowserCtlButton({ wide, useStore, actions, t }) {
  const open = useStore((state) => state.open);
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_dsh_client_ui_primitives6.Tooltip, { label: t("tab"), delayMs: 500, disabled: wide, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
    Button,
    {
      variant: "ghost",
      className: "dshBrowserCtlLauncher",
      "data-wide": wide ? "true" : "false",
      "aria-label": t("tab"),
      "aria-haspopup": "dialog",
      "aria-expanded": open,
      icon: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(CtlIcon, { size: wide ? 16 : 18 }),
      onClick: () => {
        fetch(API_P + "/browserctl/api/ensure", { cache: "no-store" }).catch(() => {
        });
        actions.open();
      },
      children: wide ? t("tab") : null
    }
  ) });
}
var inject = ["slots", "locale", "uiWorkspace"];
function apply(ctx) {
  ctx.effect(
    () => consumeOpenSessionHash((sid) => ctx.uiWorkspace.openSession(sid)),
    "browserctl: push deep-link open session"
  );
  const view = (0, import_dsh_client_store.defineStore)({
    init: () => ({ open: false }),
    actions: {
      open: (draft) => {
        draft.open = true;
      },
      close: (draft) => {
        draft.open = false;
      }
    }
  });
  ctx.effect(() => ctx.locale.register(NS, {
    zh: zh_default.panel,
    en: en_default.panel
  }), "browserctl: dictionaries");
  ctx.effect(() => installStyles(), "browserctl: styles");
  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
    name: "sidebar.footer.action",
    id: "browserctl",
    order: 30,
    label: () => ctx.locale.bind(NS)("tab"),
    locale: NS,
    store: view
  }, BrowserCtlButton));
  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay",
    id: "browserctl",
    order: 30,
    locale: NS,
    store: view
  }, BrowserCtlOverlay));
}
var __demoPanel = { BrowserCtlOverlay, installStyles };

return module.exports; } });
