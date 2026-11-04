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
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_dsh_client_store = require("@deepseek-ai/dsh-client-store");
var import_jsx_runtime = require("react/jsx-runtime");
var NS = "browserctl";
var STYLE_ID = "browserctl/styles";
var VERSION = "0.2.0";
var ABOUT_LINKS = {
  website: "https://remote.ymzcc.com/dsh-remote/",
  github: "https://github.com/your-name/dshremote",
  // TODO: 发布后替换为真实仓库地址
  app: "https://github.com/your-name/dshremote/releases/latest"
  // TODO: 发布后替换为真实 Release 下载地址
};
var LEGAL_VERSION = "2026-11-01";
var LEGAL_EFFECTIVE = "2026\u5E7411\u67081\u65E5";
var LEGAL_AGE = "\u672C\u5DE5\u5177\u4EC5\u9762\u5411\u5E74\u6EE1 18 \u5468\u5C81\u7684\u7528\u6237";
var LEGAL_TERMS = {
  id: "terms",
  title: "\u7528\u6237\u534F\u8BAE",
  subtitle: `\u66F4\u65B0\u751F\u6548\u65E5\u671F\uFF1A${LEGAL_EFFECTIVE}\u3002\u51E1\u5B89\u88C5\u3001\u4F7F\u7528\u672C\u63D2\u4EF6/\u9762\u677F\uFF08DSH \u8FDC\u7A0B\u52A9\u624B\uFF09\uFF0C\u901A\u8FC7\u624B\u673A\u6216\u5916\u7F51\u6D4F\u89C8\u5668\u8FDC\u7A0B\u8BBF\u95EE\u672C\u673A DeepSeek \u52A9\u624B\u9762\u677F\uFF0C\u5373\u89C6\u4E3A\u60A8\u5DF2\u5B8C\u6574\u9605\u8BFB\u3001\u7406\u89E3\u5E76\u540C\u610F\u672C\u534F\u8BAE\u5168\u90E8\u6761\u6B3E\u3002`,
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
        "1.1 \u670D\u52A1\u5B9A\u4F4D\u3002\u672C\u5DE5\u5177\uFF08DSH \u8FDC\u7A0B\u52A9\u624B\uFF0C\u542B\u6D4F\u89C8\u5668\u63A7\u5236\u63D2\u4EF6\u3001\u672C\u673A\u95F8\u673A\u4E0E\u914D\u5957 App\uFF09\u4E3A\u4E2A\u4EBA\u72EC\u7ACB\u5F00\u53D1\u7684\u516C\u76CA\u514D\u8D39\u8FDC\u7A0B\u534F\u52A9\u5DE5\u5177\uFF0C\u7528\u4E8E\u628A\u672C\u673A DeepSeek \u52A9\u624B Web \u9762\u677F\u901A\u8FC7\u52A0\u5BC6\u96A7\u9053\u5B89\u5168\u7A7F\u900F\u5230\u624B\u673A\u6216\u5916\u7F51\u6D4F\u89C8\u5668\uFF0C\u5B9E\u73B0\u968F\u65F6\u968F\u5730\u8FDC\u7A0B\u63A7\u5236\uFF0C\u65E0\u4EFB\u4F55\u5546\u4E1A\u4E0A\u67B6\u8D44\u8D28\u4E0E\u5F3A\u5236\u6536\u8D39\u3002",
        "1.2 \u4F7F\u7528\u524D\u63D0\u3002\u8FDC\u7A0B\u8BBF\u95EE\u4F9D\u8D56\u7F51\u7EDC\u3001frp \u96A7\u9053\u4E0E\u672C\u673A\u95F8\u673A\u670D\u52A1\uFF0C\u5B58\u5728\u6CE2\u52A8\u4E0E\u4E2D\u65AD\u7684\u53EF\u80FD\uFF1B\u4E0D\u540C\u7EC8\u7AEF\u3001\u6D4F\u89C8\u5668\u53EF\u7528\u529F\u80FD\u53EF\u80FD\u5B58\u5728\u5DEE\u5F02\uFF0C\u4EE5\u60A8\u5B9E\u9645\u4F7F\u7528\u7684\u7248\u672C\u754C\u9762\u4E3A\u51C6\u3002",
        "1.3 \u534F\u8BAE\u7EC4\u6210\u3002\u672C\u300A\u7528\u6237\u534F\u8BAE\u300B\u4E0E\u300A\u9690\u79C1\u653F\u7B56\u300B\u5171\u540C\u6784\u6210\u5B8C\u6574\u7EA6\u5B9A\uFF1B\u5C31\u7279\u5B9A\u529F\u80FD\uFF08\u5982 2FA\u3001\u914D\u5BF9\u3001\u9ED1\u540D\u5355\u3001\u63A8\u9001\uFF09\u53E6\u6709\u9875\u9762\u63D0\u793A\u6216\u89C4\u5219\u7684\uFF0C\u6784\u6210\u8865\u5145\u7EA6\u5B9A\uFF0C\u8865\u5145\u7EA6\u5B9A\u4E0E\u672C\u534F\u8BAE\u51B2\u7A81\u65F6\uFF0C\u5C31\u8BE5\u529F\u80FD\u4EE5\u66F4\u5177\u4F53\u7684\u8865\u5145\u7EA6\u5B9A\u4E3A\u51C6\u3002",
        "1.4 \u6536\u8D39\u8BF4\u660E\u3002\u672C\u670D\u52A1\u76EE\u524D\u5B8C\u5168\u514D\u8D39\uFF0C\u4E0D\u6536\u53D6\u4EFB\u4F55\u8D39\u7528\uFF0C\u4E5F\u6CA1\u6709\u4ED8\u8D39\u89E3\u9501\u3001\u4F1A\u5458\u8BA2\u9605\u6216\u5185\u8D2D\u9879\u76EE\u3002\u82E5\u672A\u6765\u56E0\u8FD0\u8425\u6210\u672C\u8C03\u6574\u6536\u8D39\u65B9\u5F0F\uFF0C\u6211\u4EEC\u4F1A\u63D0\u524D\u5728\u9762\u677F\u5185\u663E\u8457\u516C\u544A\u5E76\u5F81\u5F97\u60A8\u7684\u540C\u610F\uFF0C\u60A8\u53EF\u4EE5\u5728\u6B64\u4E4B\u524D\u7EE7\u7EED\u514D\u8D39\u4F7F\u7528\u6216\u505C\u6B62\u4F7F\u7528\u3002"
      ]
    },
    {
      title: "\u7B2C\u4E8C\u7AE0 \u670D\u52A1\u4F7F\u7528\u89C4\u8303\u4E0E\u7528\u6237\u4E49\u52A1",
      paragraphs: [
        "2.1 \u6388\u6743\u8BBF\u95EE\u3002\u60A8\u4EC5\u53EF\u4E3A\u672C\u4EBA\u6216\u7ECF\u60A8\u660E\u786E\u6388\u6743\u7684\u8BBE\u5907\u3001\u4EBA\u5458\u63D0\u4F9B\u8FDC\u7A0B\u8BBF\u95EE\u3002\u4E25\u7981\u5C06\u914D\u5BF9\u4E8C\u7EF4\u7801\u3001\u5F15\u5BFC\u94FE\u63A5\u3001\u767B\u5F55 Cookie\u3001\u8BBF\u95EE\u53E3\u4EE4\u5206\u4EAB\u3001\u8F6C\u552E\u7ED9\u672A\u6388\u6743\u7B2C\u4E09\u65B9\u3002",
        "2.2 \u7981\u6B62\u884C\u4E3A\u3002\u4E25\u7981\u5BF9\u670D\u52A1\u5B9E\u65BD\u53CD\u5411\u4EE3\u7406\u3001\u6293\u5305\u5C01\u88C5\u3001\u7834\u89E3\u6216\u7ED5\u8FC7\u9274\u6743\u4E0E\u7B7E\u540D\u6821\u9A8C\u3001\u6076\u610F\u9AD8\u9891\u8BF7\u6C42\u3001\u6F0F\u6D1E\u626B\u63CF\u3001\u6D41\u91CF\u653B\u51FB\u3001\u6279\u91CF\u722C\u53D6\u7B49\u7834\u574F\u6027\u884C\u4E3A\uFF1B\u4E25\u7981\u5229\u7528\u672C\u5DE5\u5177\u4ECE\u4E8B\u4EFB\u4F55\u8FDD\u6CD5\u8FDD\u89C4\u6D3B\u52A8\u3002",
        "2.3 \u51ED\u636E\u4FDD\u7BA1\u3002\u914D\u5BF9\u94FE\u63A5\u3001\u5F15\u5BFC\u94FE\u63A5\u3001Cookie \u4E0E\u52A8\u6001\u9A8C\u8BC1\u7801\u5C5E\u4E8E\u654F\u611F\u51ED\u636E\uFF0C\u8BF7\u59A5\u5584\u4FDD\u7BA1\uFF0C\u52FF\u622A\u56FE\u957F\u671F\u7559\u6863\u3001\u52FF\u53D1\u516C\u5F00\u7FA4\u3002\u56E0\u60A8\u6CC4\u9732\u51ED\u636E\u5BFC\u81F4\u7684\u672A\u6388\u6743\u8BBF\u95EE\uFF0C\u7531\u60A8\u81EA\u884C\u627F\u62C5\u3002",
        "2.4 2FA \u4F7F\u7528\u3002\u5F00\u542F\u4E24\u6B65\u9A8C\u8BC1\u540E\uFF0C\u6240\u6709\u8BBE\u5907\u8BBF\u95EE\u524D\u9700\u8F93\u5165\u9A8C\u8BC1\u5668 6 \u4F4D\u52A8\u6001\u7801\uFF1B\u8BF7\u52FF\u5C06\u52A8\u6001\u7801\u544A\u77E5\u4ED6\u4EBA\u3002",
        "2.5 \u5185\u5BB9\u5408\u89C4\u3002\u672C\u5DE5\u5177\u7528\u4E8E\u8BBF\u95EE AI \u52A9\u624B\u9762\u677F\uFF0C\u8BF7\u52FF\u5229\u7528\u5176\u751F\u6210\u3001\u4F20\u64AD\u8FDD\u6CD5\u8FDD\u89C4\u3001\u66B4\u529B\u3001\u8272\u60C5\u3001\u4FB5\u6743\u6216\u635F\u5BB3\u4ED6\u4EBA\u6743\u76CA\u7684\u5185\u5BB9\u3002",
        "2.6 \u5F00\u6E90\u4E0E\u975E\u5546\u4E1A\u3002\u672C\u9879\u76EE\u9075\u5FAA\u5F00\u6E90\u8BB8\u53EF\u53D1\u5E03\uFF0C\u5141\u8BB8\u4E2A\u4EBA\u5B66\u4E60\u3001\u975E\u5546\u7528\u4F7F\u7528\u4E0E\u5408\u89C4\u4E8C\u521B\uFF1B\u7981\u6B62\u4E00\u5207\u672A\u7ECF\u6388\u6743\u7684\u5546\u4E1A\u7528\u9014\u3001\u62B9\u9664\u7F72\u540D\u7684\u4E8C\u6B21\u5206\u53D1\u4E0E\u8F6C\u552E\u3002"
      ]
    },
    {
      title: "\u7B2C\u4E09\u7AE0 \u5B89\u5168\u673A\u5236\u4E0E\u8BBE\u5907\u7BA1\u7406",
      paragraphs: [
        "3.1 \u8EAB\u4EFD\u9A8C\u8BC1\u3002\u8BBF\u95EE\u9762\u677F\u91C7\u7528\u300C\u8BBE\u5907\u4FE1\u4EFB + \u53EF\u9009 TOTP \u4E24\u6B65\u9A8C\u8BC1\uFF08RFC 6238\uFF09\u300D\u673A\u5236\uFF1B\u8FDE\u9519 5 \u6B21\u51BB\u7ED3 15 \u5206\u949F\uFF0C\u540C\u7801\u9632\u91CD\u653E\u3002",
        "3.2 \u4F1A\u8BDD\u4E0E Cookie\u3002\u9A8C\u8BC1\u901A\u8FC7\u540E\u7B7E\u53D1\u6709\u6548\u671F\u4E3A 30 \u5929\u7684 bc-gate \u8BB0\u5FC6 Cookie\uFF0C\u7528\u4E8E\u514D\u9A8C\u8BC1\u76F4\u8FDE\uFF1B\u60A8\u53EF\u968F\u65F6\u901A\u8FC7\u9762\u677F\u300C\u8E22\u4E0B\u7EBF\u300D\u6216\u300C\u5168\u90E8\u8E22\u4E0B\u7EBF\u300D\u4F7F\u6307\u5B9A\u8BBE\u5907\u6216\u5168\u90E8\u8BBE\u5907\u91CD\u65B0\u8BA4\u8BC1\u3002",
        "3.3 \u8BBE\u5907\u767B\u8BB0\u3002\u9A8C\u8BC1\u901A\u8FC7\u7684\u8BBE\u5907\u4F1A\u8BB0\u5F55\u533F\u540D\u8BBE\u5907\u6807\u8BC6\u3001IP\u3001User-Agent \u7B49\u5FC5\u8981\u4FE1\u606F\u7528\u4E8E\u4F1A\u8BDD\u4E0E\u98CE\u63A7\uFF1B\u60A8\u53EF\u5728\u9762\u677F\u67E5\u770B\u5728\u7EBF/\u5386\u53F2\u8BBE\u5907\uFF0C\u5E76\u62C9\u9ED1\u6307\u5B9A IP\u3002",
        "3.4 \u5F15\u5BFC\u94FE\u63A5\u3002\u4E3A\u65E0 App \u8BBE\u5907\u751F\u6210\u7684\u5F15\u5BFC\u94FE\u63A5\u4E3A\u660E\u6587\uFF0C\u8BF7\u5728\u6709\u6548\u671F\u5185\u4F7F\u7528\u5E76\u6309\u9700\u63A7\u5236\u6709\u6548\u671F\uFF1B\u4ECB\u610F\u98CE\u9669\u7684\u8BF7\u7528\u540E\u8F6E\u6362\u3002"
      ]
    },
    {
      title: "\u7B2C\u56DB\u7AE0 \u514D\u8D23\u58F0\u660E\u4E0E\u8D23\u4EFB\u9650\u5236",
      paragraphs: [
        "4.1 \u672C\u5DE5\u5177\u4EE5\u300C\u73B0\u72B6\u63D0\u4F9B\u300D\u4E3A\u539F\u5219\uFF0C\u4E3A\u4E2A\u4EBA\u72EC\u7ACB\u516C\u76CA\u5F00\u53D1\uFF0C\u4E0D\u4FDD\u8BC1\u670D\u52A1\u96F6\u4E2D\u65AD\u3001\u96F6\u6545\u969C\u3001\u5168\u7EC8\u7AEF\u517C\u5BB9\uFF1B\u56E0\u7F51\u7EDC\u6CE2\u52A8\u3001\u96A7\u9053\u4E2D\u65AD\u3001\u8BBE\u5907\u6545\u969C\u3001\u7CFB\u7EDF\u66F4\u65B0\u5BFC\u81F4\u7684\u8BBF\u95EE\u5F02\u5E38\uFF0C\u5F00\u53D1\u65B9\u5728\u80FD\u529B\u8303\u56F4\u5185\u5C3D\u529B\u6062\u590D\uFF0C\u4F46\u4E0D\u4F5C\u7EDD\u5BF9\u627F\u8BFA\u3002",
        "4.2 \u8FDC\u7A0B\u8BBF\u95EE\u672C\u8EAB\u5B58\u5728\u5B89\u5168\u98CE\u9669\uFF08\u5982\u8BBE\u5907\u88AB\u4ED6\u4EBA\u7269\u7406\u63A5\u89E6\u3001\u7CFB\u7EDF\u88AB\u5165\u4FB5\u3001\u7F51\u7EDC\u88AB\u76D1\u542C\uFF09\u3002\u8BF7\u60A8\u786E\u4FDD\u672C\u673A\u4E0E\u8BBE\u5907\u7684\u7CFB\u7EDF\u3001\u5BC6\u7801\u3001\u5BC6\u94A5\u5B89\u5168\uFF1B\u56E0\u672C\u673A\u6216\u8BBE\u5907\u5B89\u5168\u5931\u5B88\u5BFC\u81F4\u7684\u635F\u5931\u7531\u60A8\u81EA\u884C\u627F\u62C5\u3002",
        "4.3 \u672C\u670D\u52A1\u76EE\u524D\u5B8C\u5168\u514D\u8D39\uFF0C\u6211\u4EEC\u4E0D\u5411\u60A8\u6536\u53D6\u4EFB\u4F55\u8D39\u7528\u3002\u5728\u6CD5\u5F8B\u5141\u8BB8\u7684\u6700\u5927\u8303\u56F4\u5185\uFF0C\u5F00\u53D1\u65B9\u5BF9\u4EFB\u4F55\u95F4\u63A5\u3001\u9644\u5E26\u3001\u540E\u679C\u6027\u635F\u5BB3\u4E0D\u627F\u62C5\u8D23\u4EFB\uFF1B\u56E0\u672C\u670D\u52A1\u5F15\u8D77\u4E89\u8BAE\u9700\u627F\u62C5\u8D23\u4EFB\u7684\uFF0C\u8D23\u4EFB\u4E0A\u9650\u4EE5\u60A8\u5C31\u76F8\u5173\u4E8B\u9879\u5411\u5F00\u53D1\u65B9\u5B9E\u9645\u652F\u4ED8\u7684\u8D39\u7528\u4E3A\u9650\uFF08\u76EE\u524D\u4E3A 0\uFF09\uFF0C\u6CD5\u5F8B\u6CD5\u89C4\u53E6\u6709\u5F3A\u5236\u89C4\u5B9A\u7684\u9664\u5916\u3002",
        "4.4 \u7B2C\u4E09\u65B9\u8D44\u6E90\uFF08\u5982 frps \u670D\u52A1\u5668\u3001\u4E91\u57FA\u7840\u8BBE\u65BD\u3001\u96A7\u9053\u670D\u52A1\uFF09\u7531\u76F8\u5E94\u7B2C\u4E09\u65B9\u63D0\u4F9B\uFF0C\u5176\u6545\u969C\u4E0E\u653F\u7B56\u53D8\u5316\u4E0D\u6784\u6210\u672C\u65B9\u8FDD\u7EA6\u3002"
      ]
    },
    {
      title: "\u7B2C\u4E94\u7AE0 \u8FDD\u89C4\u5904\u7406\u4E0E\u4E89\u8BAE\u89E3\u51B3",
      paragraphs: [
        "5.1 \u5BF9\u8FDD\u53CD\u672C\u534F\u8BAE\u3001\u7834\u574F\u670D\u52A1\u5B89\u5168\u6216\u635F\u5BB3\u4ED6\u4EBA\u6743\u76CA\u7684\u7528\u6237\uFF0C\u5F00\u53D1\u65B9\u6709\u6743\u91C7\u53D6\u963B\u65AD\u8BBF\u95EE\u3001\u5C01\u7981 IP/\u8BBE\u5907\u3001\u9650\u5236\u529F\u80FD\u3001\u8E22\u51FA\u5168\u90E8\u4F1A\u8BDD\u7B49\u63AA\u65BD\u3002",
        "5.2 \u4E89\u8BAE\u534F\u5546\u4F18\u5148\uFF1B\u534F\u5546\u4E0D\u6210\uFF0C\u9002\u7528\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u73B0\u884C\u6709\u6548\u6CD5\u5F8B\uFF0C\u5E76\u5411\u5F00\u53D1\u65B9\u6240\u5728\u5730\u6709\u7BA1\u8F96\u6743\u7684\u4EBA\u6C11\u6CD5\u9662\u63D0\u8D77\u8BC9\u8BBC\u3002",
        "5.3 \u6761\u6B3E\u72EC\u7ACB\u6027\uFF1A\u672C\u534F\u8BAE\u4EFB\u610F\u6761\u6B3E\u88AB\u8BA4\u5B9A\u4E3A\u65E0\u6548\u3001\u4E0D\u53EF\u6267\u884C\u7684\uFF0C\u4E0D\u5F71\u54CD\u5176\u4F59\u6761\u6B3E\u7684\u6548\u529B\u3002"
      ]
    },
    {
      title: "\u7B2C\u516D\u7AE0 \u534F\u8BAE\u4FEE\u8BA2\u4E0E\u751F\u6548",
      paragraphs: [
        "6.1 \u672C\u534F\u8BAE\u5C06\u6839\u636E\u6CD5\u5F8B\u6CD5\u89C4\u3001\u4EA7\u54C1\u8FED\u4EE3\u4E0E\u5B89\u5168\u9700\u8981\u9002\u65F6\u4FEE\u8BA2\uFF0C\u4FEE\u8BA2\u540E\u7684\u7248\u672C\u5728\u9762\u677F\u300C\u5173\u4E8E\u300D\u5185\u516C\u5E03\uFF1B\u5BF9\u60A8\u6743\u76CA\u4EA7\u751F\u91CD\u5927\u5F71\u54CD\u7684\u53D8\u66F4\u5C06\u663E\u8457\u63D0\u793A\u3002",
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
        "DSH \u8FDC\u7A0B\u52A9\u624B\u5F00\u53D1\u65B9\uFF08\u4EE5\u4E0B\u7B80\u79F0\u300C\u6211\u4EEC\u300D\uFF09\u627F\u8BFA\u4FDD\u62A4\u4F7F\u7528\u672C\u5DE5\u5177\u4E4B\u7528\u6237\uFF08\u4EE5\u4E0B\u7EDF\u79F0\u300C\u60A8\u300D\uFF09\u7684\u4E2A\u4EBA\u4FE1\u606F\u548C\u9690\u79C1\u5B89\u5168\u3002\u672C\u5DE5\u5177\u4E3A\u4E2A\u4EBA\u72EC\u7ACB\u516C\u76CA\u5F00\u53D1\uFF0C\u575A\u6301\u6700\u5C0F\u5FC5\u8981\u3001\u81EA\u613F\u6388\u6743\u3001\u975E\u5F3A\u5236\u6536\u96C6\u3001\u7981\u6B62\u5C06\u6570\u636E\u7528\u4E8E\u5546\u4E1A\u53D8\u73B0\u7684\u539F\u5219\u3002",
        "\u672C\u670D\u52A1\u76EE\u524D\u5B8C\u5168\u514D\u8D39\uFF0C\u4E0D\u5411\u60A8\u6536\u53D6\u4EFB\u4F55\u8D39\u7528\uFF1B\u6B63\u56E0\u4E3A\u4E0D\u6536\u8D39\uFF0C\u6211\u4EEC\u66F4\u4E0D\u4F1A\u4EE5\u51FA\u552E\u3001\u51FA\u79DF\u6216\u5546\u4E1A\u53D8\u73B0\u60A8\u7684\u4E2A\u4EBA\u4FE1\u606F\u4F5C\u4E3A\u6536\u5165\u6765\u6E90\u3002",
        "\u9002\u7528\u6CD5\u89C4\u4F9D\u636E\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\u300A\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u4E2A\u4EBA\u4FE1\u606F\u4FDD\u62A4\u6CD5\u300B\u300A\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u7F51\u7EDC\u5B89\u5168\u6CD5\u300B\u53CA\u76F8\u5173\u76D1\u7BA1\u89C4\u8303\u3002",
        LEGAL_AGE + "\u3002"
      ]
    },
    {
      title: "\u7279\u522B\u63D0\u793A",
      paragraphs: [
        "1. \u672C\u653F\u7B56\u4E0E\u300A\u7528\u6237\u534F\u8BAE\u300B\u540C\u65F6\u5BF9\u60A8\u4EA7\u751F\u6548\u529B\uFF1B\u540C\u7C7B\u6761\u6B3E\u4E0D\u4E00\u81F4\u65F6\uFF0C\u5C31\u4E2A\u4EBA\u4FE1\u606F\u5904\u7406\u4E8B\u9879\u4EE5\u672C\u653F\u7B56\u4E3A\u51C6\uFF0C\u5176\u4F59\u4EE5\u300A\u7528\u6237\u534F\u8BAE\u300B\u4E3A\u51C6\u3002",
        "2. \u53EA\u6709\u5F53\u60A8\u5F00\u542F\u8FDC\u7A0B\u8BBF\u95EE\u3001\u914D\u5BF9\u3001\u63A8\u9001\u7B49\u529F\u80FD\u65F6\uFF0C\u4E3A\u5B9E\u73B0\u8BE5\u529F\u80FD\u6211\u4EEC\u624D\u4F1A\u5904\u7406\u5BF9\u5E94\u4FE1\u606F\uFF1B\u4E0D\u5F00\u542F\u76F8\u5173\u529F\u80FD\u5219\u4E0D\u5904\u7406\u5BF9\u5E94\u7684\u4E2A\u4EBA\u4FE1\u606F\u3002",
        "3. \u4F7F\u7528\u524D\u8BF7\u4ED4\u7EC6\u9605\u8BFB\u672C\u653F\u7B56\u3002\u82E5\u60A8\u4E0D\u540C\u610F\uFF0C\u8BF7\u7ACB\u5373\u505C\u6B62\u8BBF\u95EE/\u4F7F\u7528\u3002",
        "4. \u672C\u653F\u7B56\u76EE\u5F55\uFF1A\u4E00\u3001\u9002\u7528\u8303\u56F4\uFF1B\u4E8C\u3001\u6211\u4EEC\u5982\u4F55\u6536\u96C6\u548C\u4F7F\u7528\u4FE1\u606F\uFF1B\u4E09\u3001Cookie \u4E0E\u540C\u7C7B\u6280\u672F\uFF1B\u56DB\u3001\u5171\u4EAB\u3001\u8F6C\u79FB\u6216\u516C\u5F00\uFF1B\u4E94\u3001\u5B58\u50A8\u4E0E\u4FDD\u62A4\uFF1B\u516D\u3001\u60A8\u7684\u6743\u5229\uFF1B\u4E03\u3001\u672A\u6210\u5E74\u4EBA\u4FDD\u62A4\uFF1B\u516B\u3001\u4FEE\u8BA2\u548C\u901A\u77E5\uFF1B\u4E5D\u3001\u5982\u4F55\u8054\u7CFB\u6211\u4EEC\u3002"
      ]
    },
    {
      title: "\u4E00\u3001\u9002\u7528\u8303\u56F4",
      paragraphs: [
        "\u672C\u653F\u7B56\u9002\u7528\u4E8E\u672C\u673A\u95F8\u673A\u3001\u6D4F\u89C8\u5668\u63A7\u5236\u63D2\u4EF6\u3001\u914D\u5957 App\u3001\u7F51\u9875\u9762\u677F\u53CA\u968F\u6280\u672F\u53D1\u5C55\u51FA\u73B0\u7684\u65B0\u5F62\u6001\u3002",
        "\u672C\u653F\u7B56\u4E0D\u9002\u7528\u4E8E\u7B2C\u4E09\u65B9\u72EC\u7ACB\u8FD0\u8425\u7684\u670D\u52A1\uFF08\u5982 frps \u670D\u52A1\u5668\u5546\u3001\u4E91\u57FA\u7840\u8BBE\u65BD\u3001\u60A8\u81EA\u884C\u914D\u7F6E\u7684\u96A7\u9053\u670D\u52A1\u7B49\uFF09\uFF0C\u8BE5\u7B49\u670D\u52A1\u9002\u7528\u5176\u5404\u81EA\u89C4\u5219\u3002"
      ]
    },
    {
      title: "\u4E8C\u3001\u6211\u4EEC\u5982\u4F55\u6536\u96C6\u548C\u4F7F\u7528\u60A8\u7684\u4E2A\u4EBA\u4FE1\u606F",
      paragraphs: [
        "\uFF08\u4E00\uFF09\u8FDC\u7A0B\u8BBF\u95EE\u4E0E\u8BBE\u5907\u9A8C\u8BC1",
        "1. \u5F53\u60A8\u901A\u8FC7\u624B\u673A\u6216\u5916\u7F51\u6D4F\u89C8\u5668\u8BBF\u95EE\u9762\u677F\u65F6\uFF0C\u672C\u673A\u95F8\u673A\u4F1A\u5728\u672C\u5730\u8BB0\u5F55\u5FC5\u8981\u4FE1\u606F\uFF1A\u8BBF\u95EE IP \u5730\u5740\u3001\u8BBE\u5907\u6807\u8BC6\uFF08\u5BA2\u6237\u7AEF\u751F\u6210\u7684\u533F\u540D devid\uFF09\u3001User-Agent\u3001\u8BBF\u95EE\u65F6\u95F4\u4E0E\u9A8C\u8BC1\u4E8B\u4EF6\uFF0C\u7528\u4E8E\u8BBE\u5907\u4FE1\u4EFB\u3001\u4F1A\u8BDD\u7BA1\u7406\u3001\u5F02\u5E38\u8BC6\u522B\u4E0E\u5B89\u5168\u5BA1\u8BA1\u3002",
        "2. \u5F00\u542F 2FA \u540E\uFF0C\u9A8C\u8BC1\u8FC7\u7A0B\u4EC5\u5728\u672C\u673A\u5B8C\u6210\u52A8\u6001\u7801\u6BD4\u5BF9\uFF08TOTP\uFF09\uFF0C\u9A8C\u8BC1\u7801\u4E0D\u5BF9\u7B2C\u4E09\u65B9\u4F20\u8F93\u3002",
        "3. \u914D\u5BF9\u4E8C\u7EF4\u7801\u4E0E\u5F15\u5BFC\u94FE\u63A5\u7531\u672C\u673A\u751F\u6210\uFF0C\u7528\u4E8E\u4E00\u6B21\u6027/\u9650\u65F6\u6388\u6743\uFF0C\u4E0D\u5728\u670D\u52A1\u7AEF\u7559\u5B58\u660E\u6587\u51ED\u636E\u3002",
        "\uFF08\u4E8C\uFF09\u5B89\u5168\u4E0E\u98CE\u63A7",
        "1. \u4E3A\u8BC6\u522B\u5F02\u5E38\u767B\u5F55\u3001\u66B4\u529B\u7834\u89E3\u3001\u63A5\u53E3\u6EE5\u7528\u4E0E\u653B\u51FB\uFF0C\u53EF\u80FD\u8BB0\u5F55\u8BBF\u95EE\u65F6\u95F4\u5E8F\u5217\u3001\u8BF7\u6C42\u6765\u6E90\u3001\u5931\u8D25\u6B21\u6570\u3001IP \u9ED1\u540D\u5355\u7B49\uFF0C\u5E76\u91C7\u53D6\u9650\u6D41\u3001\u51BB\u7ED3\u3001\u5C01\u7981\u7B49\u63AA\u65BD\u3002",
        "2. \u9ED1\u540D\u5355\u4E0E\u8E22\u51FA\u8BB0\u5F55\u7528\u4E8E\u5B89\u5168\u5904\u7F6E\uFF0C\u4FDD\u5B58\u4E8E\u672C\u673A\uFF0C\u4E0D\u7528\u4E8E\u5546\u4E1A\u753B\u50CF\u3002",
        "\uFF08\u4E09\uFF09\u63A8\u9001\uFF08\u53EF\u9009\uFF09",
        "\u4EC5\u5F53\u60A8\u5F00\u542F\u63A8\u9001\u65F6\uFF0C\u5B89\u5168\u4E8B\u4EF6\uFF08\u8BBE\u5907\u8FDE\u5165\u3001\u88AB\u8E22\u3001\u9ED1\u540D\u5355\u30012FA\u3001\u914D\u5BF9\uFF09\u4E0E\u7CFB\u7EDF\u6D88\u606F\u624D\u4F1A\u7ECF\u672C\u673A\u95F8\u673A\u8F6C\u9001\u81F3\u60A8\u7684\u624B\u673A\uFF1B\u5173\u95ED\u540E\u4E0D\u518D\u5904\u7406\u3002",
        "\uFF08\u56DB\uFF09\u65E5\u5FD7\u4E0E\u8BCA\u65AD",
        "\u4E3A\u6392\u67E5\u6545\u969C\uFF0C\u672C\u673A\u4FDD\u5B58\u8FD0\u884C\u65E5\u5FD7\uFF08\u4E0D\u542B\u5BC6\u94A5\uFF09\uFF1B\u65E5\u5FD7\u4EC5\u7528\u4E8E\u6280\u672F\u7EF4\u62A4\u4E0E\u670D\u52A1\u4F18\u5316\u3002",
        "\uFF08\u4E94\uFF09\u539F\u5219\u58F0\u660E",
        "\u6211\u4EEC\u4E0D\u6536\u96C6\uFF1A\u771F\u5B9E\u59D3\u540D\u3001\u8EAB\u4EFD\u8BC1\u53F7\u3001\u901A\u8BAF\u5F55\u3001\u77ED\u4FE1\u3001\u901A\u8BDD\u8BB0\u5F55\u3001\u7CBE\u786E\u5730\u7406\u4F4D\u7F6E\u3001\u94F6\u884C\u5361\u4E0E\u652F\u4ED8\u6D41\u6C34\uFF1B\u4E0D\u4EE5\u5E7F\u544A\u8FFD\u8E2A\u6216\u5546\u4E1A\u53D8\u73B0\u4E3A\u76EE\u7684\u6536\u96C6\u4E2A\u4EBA\u4FE1\u606F\u3002"
      ]
    },
    {
      title: "\u4E09\u3001Cookie \u4E0E\u540C\u7C7B\u6280\u672F",
      paragraphs: [
        "\u6211\u4EEC\u53EF\u80FD\u901A\u8FC7 Cookie\u3001localStorage \u6216\u540C\u7C7B\u6280\u672F\u4FDD\u5B58\u5FC5\u8981\u72B6\u6001\uFF1A\u767B\u5F55/\u4F1A\u8BDD\u72B6\u6001\uFF08\u5982 30 \u5929 bc-gate \u8BB0\u5FC6 Cookie\uFF09\u3001\u8BBE\u7F6E\u9879\u3001\u534F\u8BAE\u540C\u610F\u8BB0\u5F55\u3001\u672C\u5730\u914D\u5BF9\u72B6\u6001\u3002",
        "\u6211\u4EEC\u4E0D\u4F1A\u5C06 Cookie \u7528\u4E8E\u672C\u653F\u7B56\u6240\u8FF0\u76EE\u7684\u4E4B\u5916\u7684\u7528\u9014\uFF0C\u4E0D\u7528\u4E8E\u8DE8\u7AD9\u5E7F\u544A\u8FFD\u8E2A\u6216\u4E0E\u771F\u5B9E\u8EAB\u4EFD\u4FE1\u606F\u4E0D\u5F53\u5173\u8054\u3002",
        "\u60A8\u53EF\u901A\u8FC7\u6D4F\u89C8\u5668\u6216\u7CFB\u7EDF\u8BBE\u7F6E\u62D2\u7EDD\u3001\u7BA1\u7406\u6216\u5220\u9664 Cookie \u4E0E\u672C\u5730\u5B58\u50A8\uFF1B\u505C\u7528\u540E\u53EF\u80FD\u9700\u8981\u91CD\u65B0\u9A8C\u8BC1\u6216\u91CD\u65B0\u540C\u610F\u534F\u8BAE\uFF0C\u90E8\u5206\u529F\u80FD\u53EF\u80FD\u65E0\u6CD5\u6B63\u5E38\u4F7F\u7528\u3002"
      ]
    },
    {
      title: "\u56DB\u3001\u5171\u4EAB\u3001\u8F6C\u79FB\u6216\u516C\u5F00",
      paragraphs: [
        "\u6211\u4EEC\u4EC5\u5728\u5408\u6CD5\u3001\u6B63\u5F53\u3001\u5FC5\u8981\u8303\u56F4\u5185\u5904\u7406\u4FE1\u606F\uFF0C\u4E0D\u4EE5\u5546\u4E1A\u5E7F\u544A\u6295\u653E\u6216\u4E2A\u6027\u5316\u63A8\u9001\u4E3A\u76EE\u7684\u5411\u7B2C\u4E09\u65B9\u5171\u4EAB\u60A8\u7684\u4E2A\u4EBA\u4FE1\u606F\u3002",
        "\u4E3A\u5B9E\u73B0\u670D\u52A1\u53EF\u80FD\u4F7F\u7528\u7B2C\u4E09\u65B9\u57FA\u7840\u8BBE\u65BD\uFF08\u4E91\u670D\u52A1\u5668\u3001\u96A7\u9053\u670D\u52A1\u3001\u90AE\u4EF6\u7B49\uFF09\uFF0C\u6211\u4EEC\u4F1A\u8BC4\u4F30\u5176\u5FC5\u8981\u6027\u5E76\u8981\u6C42\u5176\u91C7\u53D6\u4FDD\u62A4\u63AA\u65BD\u3002",
        "\u4EC5\u5728\u4E0B\u8FF0\u60C5\u5F62\u4E0B\u516C\u5F00\u4FE1\u606F\uFF1A\u4F9D\u60A8\u8981\u6C42\u5E76\u53D6\u5F97\u5355\u72EC\u540C\u610F\uFF1B\u4F9D\u6CD5\u6216\u5E94\u6267\u6CD5\u673A\u5173\u8981\u6C42\uFF1B\u4E3A\u4FDD\u62A4\u60A8\u6216\u4ED6\u4EBA\u751F\u547D\u8D22\u4EA7\u5B89\u5168\u6240\u5FC5\u9700\u3002",
        "\u5BF9\u5DF2\u533F\u540D\u5316\u4E14\u65E0\u6CD5\u590D\u539F\u8BC6\u522B\u7684\u4FE1\u606F\uFF0C\u5176\u5171\u4EAB/\u8F6C\u79FB/\u516C\u5F00\u4E0D\u89C6\u4E3A\u4E2A\u4EBA\u4FE1\u606F\u5BF9\u5916\u63D0\u4F9B\u3002"
      ]
    },
    {
      title: "\u4E94\u3001\u5B58\u50A8\u4E0E\u4FDD\u62A4",
      paragraphs: [
        "\uFF08\u4E00\uFF09\u5B58\u50A8",
        "\u672C\u5730\u8BB0\u5F55\uFF08\u4F1A\u8BDD\u3001\u8BBE\u5907\u3001\u4E8B\u4EF6\u3001\u9ED1\u540D\u5355\u3001\u65E5\u5FD7\uFF09\u4FDD\u5B58\u5728\u60A8\u672C\u673A\uFF0C\u968F\u672C\u673A\u6E05\u7406\u3001\u5378\u8F7D\u6216\u5220\u9664\u800C\u79FB\u9664\uFF1B\u5728\u7EBF\u8FD0\u884C\u6001\u6570\u636E\u4EC5\u5728\u670D\u52A1\u8FD0\u884C\u671F\u95F4\u5B58\u5728\uFF0C\u4E0D\u505A\u5546\u4E1A\u7528\u9014\u3002",
        "\uFF08\u4E8C\uFF09\u4FDD\u62A4",
        "1. \u4F20\u8F93\u91C7\u7528\u52A0\u5BC6\u96A7\u9053\uFF08HTTPS/frp\uFF09\uFF0C\u7B7E\u540D\u91C7\u7528 HMAC-SHA256 \u6821\u9A8C\uFF0C\u5BC6\u94A5\u4EE5\u53D7\u9650\u6587\u4EF6\u6743\u9650\u5B58\u50A8\uFF0C\u4E0D\u5199\u5165\u516C\u5F00\u4ED3\u5E93\u3002",
        "2. \u6700\u5C0F\u5316\u6388\u6743\u63A5\u89E6\u6570\u636E\u7684\u4EBA\u5458\u5E76\u8981\u6C42\u4FDD\u5BC6\uFF1B\u53D1\u751F\u5B89\u5168\u4E8B\u4EF6\u65F6\u7ACB\u5373\u5904\u7F6E\u5E76\u6309\u9700\u901A\u77E5\u3002",
        "3. \u4E92\u8054\u7F51\u5E76\u975E\u7EDD\u5BF9\u5B89\u5168\u3002\u8BF7\u59A5\u5584\u4FDD\u7BA1\u8BBE\u5907\u3001\u914D\u5BF9\u94FE\u63A5\u3001Cookie \u4E0E\u9A8C\u8BC1\u7801\uFF1B\u53D1\u73B0\u6CC4\u9732\u8BF7\u7ACB\u5373\u901A\u8FC7\u9762\u677F\u8E22\u51FA\u4F1A\u8BDD\u5E76\u8F6E\u6362\u5BC6\u94A5\u3002"
      ]
    },
    {
      title: "\u516D\u3001\u60A8\u7684\u6743\u5229",
      paragraphs: [
        "\uFF08\u4E00\uFF09\u67E5\u9605\u4E0E\u63A7\u5236\uFF1A\u60A8\u53EF\u5728\u9762\u677F\u67E5\u770B\u5728\u7EBF/\u5386\u53F2\u8BBE\u5907\uFF0C\u4E3B\u52A8\u8E22\u51FA\u8BBE\u5907\u3001\u62C9\u9ED1 IP\u3001\u5168\u90E8\u8E22\u4E0B\u7EBF\u3002",
        "\uFF08\u4E8C\uFF09\u64A4\u56DE\u540C\u610F\uFF1A\u60A8\u53EF\u901A\u8FC7\u5173\u95ED\u63A8\u9001\u3001\u5173\u95ED 2FA\u3001\u505C\u6B62\u670D\u52A1\u3001\u5378\u8F7D\u63D2\u4EF6/App\u3001\u6E05\u9664\u672C\u5730\u6570\u636E\u7B49\u65B9\u5F0F\u64A4\u56DE\u6388\u6743\u3002",
        "\uFF08\u4E09\uFF09\u5220\u9664\uFF1A\u672C\u5730\u4F1A\u8BDD\u3001\u4E8B\u4EF6\u4E0E\u8BBE\u5907\u8BB0\u5F55\u53EF\u968F\u8E22\u51FA\u4E0E\u6E05\u7406\u5220\u9664\uFF1B\u6E05\u9664\u7AD9\u70B9\u6570\u636E\u5373\u6E05\u9664\u672C\u5730 Cookie \u4E0E\u8BBE\u7F6E\u3002",
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
        "\u5982\u60A8\u5BF9\u672C\u653F\u7B56\u6216\u4E2A\u4EBA\u4FE1\u606F\u4FDD\u62A4\u6709\u4EFB\u4F55\u7591\u95EE\u3001\u6295\u8BC9\u6216\u5EFA\u8BAE\uFF0C\u8BF7\u901A\u8FC7\u9762\u677F\u300C\u5173\u4E8E\u300D\u4E2D\u7684\u8054\u7CFB\u65B9\u5F0F\u6216\u5B98\u65B9\u6E20\u9053\u4E0E\u6211\u4EEC\u8054\u7CFB\uFF0C\u6211\u4EEC\u5C06\u5728\u6838\u9A8C\u8EAB\u4EFD\u540E\u4E8E\u5341\u4E94\u4E2A\u5DE5\u4F5C\u65E5\u5185\u56DE\u590D\u3002",
        "\u5982\u5BF9\u6211\u4EEC\u7684\u56DE\u590D\u4E0D\u6EE1\u610F\uFF0C\u53EF\u5411\u6D88\u8D39\u8005\u6743\u76CA\u4FDD\u62A4\u90E8\u95E8\u6295\u8BC9\u6216\u5411\u6709\u7BA1\u8F96\u6743\u7684\u4EBA\u6C11\u6CD5\u9662\u63D0\u8D77\u8BC9\u8BBC\u3002",
        "\u672C\u9690\u79C1\u653F\u7B56\u6700\u7EC8\u89E3\u91CA\u6743\u5F52\u5F00\u53D1\u65B9\u6240\u6709\uFF08\u6CD5\u5F8B\u6CD5\u89C4\u53E6\u6709\u5F3A\u5236\u89C4\u5B9A\u7684\u9664\u5916\uFF09\u3002"
      ]
    }
  ]
};
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
  background: rgba(8, 10, 14, 0.45);
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
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 16px;
  background: var(--dsw-alias-bg-layer-2, #1b1d22);
  color: var(--dsw-alias-label-primary, inherit);
  box-shadow: 0 16px 48px rgba(0,0,0,0.4);
}
/* \u5BBD\u5C4F\u4E24\u680F(\u5DE6:\u4E8C\u7EF4\u7801/\u94FE\u63A5/\u64CD\u4F5C  \u53F3:2FA/\u5728\u7EBF\u8BBE\u5907);\u7A84\u5C4F\u81EA\u52A8\u5806\u53E0 */
.dshBrowserCtlGrid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}
.dshBrowserCtlCol {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
/* \u5DE6\u5217:\u5360\u6EE1\u7F51\u683C\u6574\u884C\u9AD8\u5EA6,\u5782\u76F4\u5C45\u4E2D(\u6269\u5C55\u5F00\u542F\u65F6\u4E0E\u53F3\u5217\u7B49\u9AD8,\u4E0D\u504F\u5DE6\u4E0A) */
.dshBrowserCtlColLeft {
  align-self: stretch;
  justify-content: center;
}
@media (max-width: 540px) {
  .dshBrowserCtlGrid { grid-template-columns: minmax(0, 1fr); gap: 8px; }
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
  color: var(--dsw-alias-label-tertiary, #8b8f98);
}
.dshBrowserCtlStatus {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
}
.dshBrowserCtlStatus::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dsw-alias-label-tertiary, #8b8f98);
  flex: none;
}
.dshBrowserCtlStatus[data-ok='true'] { color: var(--dsw-alias-state-success-primary, #34b371); }
.dshBrowserCtlStatus[data-ok='true']::before { background: var(--dsw-alias-state-success-primary, #34b371); }
.dshBrowserCtlStatus[data-ok='false'] { color: var(--dsw-alias-state-error-primary, #e5655c); }
.dshBrowserCtlStatus[data-ok='false']::before { background: var(--dsw-alias-state-error-primary, #e5655c); }
/* \u9876\u90E8\u529F\u80FD\u9875\u7B7E:\u8FDE\u63A5 / \u8BBE\u5907 / 2FA / \u9ED1\u540D\u5355 / \u65E5\u5FD7,\u4E00\u6B21\u53EA\u663E\u793A\u4E00\u4E2A\u529F\u80FD\u533A */
.dshBrowserCtlTabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.03));
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
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #a6aab2);
  font-size: 12.5px;
  line-height: 17px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s ease, color .15s ease;
}
.dshBrowserCtlTab:hover {
  background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.06));
  color: var(--dsw-alias-label-primary, inherit);
}
.dshBrowserCtlTab[data-active='true'] {
  background: var(--dsw-alias-bg-layer-3, #2b2e36);
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
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 12px;
  background: #fff;
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
  color: var(--dsw-alias-label-tertiary, #8b8f98);
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
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.04));
}
.dshBrowserCtlUrl {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary, #a6aab2);
}
.dshBrowserCtlActions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.dshBrowserCtlCard {
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 12px;
  overflow: hidden;
}
.dshBrowserCtlCardHead {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}
.dshBrowserCtlCardHead:hover { background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.04)); }
.dshBrowserCtlCardArrow {
  margin-left: auto;
  display: inline-flex;
  transition: transform 0.15s ease;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
}
.dshBrowserCtlCardHead[data-open='true'] .dshBrowserCtlCardArrow { transform: rotate(90deg); }
.dshBrowserCtlCardBody {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  padding: 0 12px;
  transition: max-height 0.28s ease, opacity 0.22s ease, padding 0.25s ease;
}
.dshBrowserCtlCardBody[data-open='true'] {
  max-height: 450px;
  opacity: 1;
  padding: 2px 12px 12px;
}
/* \u9AD8\u5185\u5BB9\u5361\u7247(\u4E8C\u7EF4\u7801 + \u8BBE\u5907/\u63A8\u9001\u5217\u8868):450px \u4F1A\u628A\u5E95\u90E8\u5217\u8868\u88C1\u6389\u4E14\u65E0\u6CD5\u6EDA\u52A8\u3002
   \u653E\u5BBD\u5230 2400px,\u5185\u5BB9\u8D85\u9AD8\u65F6\u7531\u5916\u5C42 TabBody \u8D1F\u8D23\u6EDA\u52A8,\u4E0D\u518D\u85CF\u5185\u5BB9\u3002 */
.dshBrowserCtlCardBodyTall[data-open='true'] {
  max-height: 2400px;
}
.dshBrowserCtlCardBodyRow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary, #a6aab2);
  padding: 4px 0;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.04));
}
.dshBrowserCtlCardBodyRow:last-child { border-bottom: none; }
.dshBrowserCtlCardBodyRowT { margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-tertiary, #8b8f98); white-space: nowrap; }
.dshBrowserCtlActions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.dshBrowserCtlSecretRow {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.04));
}
.dshBrowserCtlSecret {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
  font-family: ui-monospace, Consolas, Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshBrowserCtlTotpQr {
  display: flex;
  justify-content: center;
  padding: 8px;
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 10px;
  background: #fff;
  align-self: center;
}
.dshBrowserCtlTotpQr img,
.dshBrowserCtlTotpQr svg {
  width: 132px;
  height: 132px;
  display: block;
}
.dshBrowserCtlDevices {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dshBrowserCtlDevice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 8px;
  font-size: 12px;
  line-height: 17px;
}
.dshBrowserCtlDeviceInfo {
  flex: 1;
  min-width: 0;
}
.dshBrowserCtlDeviceIp {
  color: var(--dsw-alias-label-primary, inherit);
  font-weight: 500;
}
.dshBrowserCtlDeviceMeta {
  color: var(--dsw-alias-label-tertiary, #8b8f98);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* \u5728\u7EBF\u8BBE\u5907:\u72EC\u7ACB\u53EF\u6EDA\u52A8\u533A,\u59CB\u7EC8\u53EF\u89C1(\u5BF9\u9F50 Claude \u9065\u63A7\u7684\u8BBE\u5907\u8868) */
.dshBrowserCtlDevicesCard {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 12px;
}

/* App \u914D\u5BF9\u9875\u7B7E:\u5DF2\u914D\u5BF9\u624B\u673A\u5217\u8868 */
.dshBrowserCtlPairedList {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 12px;
}
.dshBrowserCtlPairedHead {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}
.dshBrowserCtlPairedCount {
  margin-left: auto;
  font-weight: 500;
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
}
.dshBrowserCtlPairedRow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
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
  color: var(--dsw-alias-label-tertiary, #8b8f98);
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
  color: #8ab4ff;
  border: 1px solid rgba(138, 180, 255, .4);
  background: rgba(138, 180, 255, .08);
}
.dshBrowserCtlKindTag[data-kind='web'] {
  color: var(--dsw-alias-label-tertiary, #9aa0a8);
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  background: transparent;
}
.dshBrowserCtlPairedEmpty {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
  padding: 4px 0;
}
.dshBrowserCtlPairedMsg {
  font-size: 12px;
  text-align: center;
  color: var(--dsw-alias-state-success-primary, #34b371);
  padding-top: 2px;
}
.dshBrowserCtlDevHead {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}
.dshBrowserCtlDevHead .dshBrowserCtlDevCount {
  margin-left: auto;
  font-weight: 500;
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
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
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 8px;
  font-size: 12px;
  line-height: 16px;
  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.03));
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
  font-weight: 500;
  color: var(--dsw-alias-label-primary, inherit);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshBrowserCtlDevIp {
  color: var(--dsw-alias-label-secondary, #a6aab2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshBrowserCtlDevSeen {
  margin-left: auto;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
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
/* \u5386\u53F2\u5728\u7EBF\u8BBE\u5907:\u73B0\u5728\u5728\u7EBF / \u5386\u53F2\u5728\u7EBF\u4E24\u7EC4 */
.dshBrowserCtlHistLabel {
  font-size: 11px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary, #a6aab2);
  margin: 6px 2px 3px;
}
.dshBrowserCtlHistGroup + .dshBrowserCtlHistGroup {
  margin-top: 2px;
}
.dshBrowserCtlHistDot {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
}
.dshBrowserCtlHistDot i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
  background: var(--dsw-alias-label-tertiary, #8b8f98);
}
.dshBrowserCtlHistDot[data-on="true"] {
  color: var(--dsw-alias-state-success-primary, #34b371);
}
.dshBrowserCtlHistDot[data-on="true"] i {
  background: var(--dsw-alias-state-success-primary, #34b371);
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
  border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.04));
  border-radius: 7px;
  font-size: 11.5px;
  line-height: 16px;
  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.03));
}
.dshBrowserCtlBanInfo {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshBrowserCtlBanReason {
  color: var(--dsw-alias-label-tertiary, #8b8f98);
  font-size: 10.5px;
}
.dshBrowserCtlDevEmpty {
  color: var(--dsw-alias-label-tertiary, #8b8f98);
  font-size: 12px;
  line-height: 17px;
  padding: 2px 0;
}
/* \u8FD0\u884C\u65E5\u5FD7:\u53EF\u6298\u53E0,\u6700\u591A\u663E\u793A\u4E00\u5C4F,\u5185\u90E8\u6EDA\u52A8 */
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
  color: var(--dsw-alias-label-secondary, #a6aab2);
  padding: 2px 0;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.04));
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
  color: var(--dsw-alias-label-tertiary, #8b8f98);
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
  color: var(--dsw-alias-label-tertiary, #8b8f98);
}
.dshBrowserCtlAboutDesc {
  margin: 0;
  font-size: 12.5px;
  line-height: 19px;
  color: var(--dsw-alias-label-secondary, #a6aab2);
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
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.03));
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 13px;
  text-decoration: none;
  transition: background .15s ease;
}
.dshBrowserCtlAboutLink:hover {
  background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.06));
}
.dshBrowserCtlAboutLink > span:first-child {
  color: var(--dsw-alias-label-tertiary, #8b8f98);
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
  color: var(--dsw-alias-label-secondary, #a6aab2);
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
  color: var(--dsw-alias-state-success-primary, #34b371);
}
.dshBrowserCtlAboutUpdateLatest {
  margin: 0;
  font-size: 12.5px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, #a6aab2);
}
.dshBrowserCtlAboutUpdateNotes {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-secondary, #a6aab2);
}
.dshBrowserCtlAboutUpdateErr {
  margin: 0;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-state-error-primary, #e5655c);
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
  color: var(--dsw-alias-label-secondary, #a6aab2);
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
  color: var(--dsw-alias-label-tertiary, #8b8f98);
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
  color: var(--dsw-alias-label-secondary, #a6aab2);
}
/* flex \u5217\u6EDA\u52A8\u5BB9\u5668\u5FC5\u987B\u7981\u5B50\u5143\u7D20\u6536\u7F29,\u5426\u5219\u5185\u5BB9\u4F1A\u88AB\u538B\u6241\u800C\u4E0D\u662F\u6EDA\u52A8 */
.dshBrowserCtlLegalBody > * { flex: 0 0 auto; }
.dshBrowserCtlLegalSubtitle {
  margin: 0;
  font-size: 12px;
  line-height: 19px;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
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
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.03));
  cursor: pointer;
  font-size: 12.5px;
}
.dshBrowserCtlCfgMode input {
  margin-top: 3px;
  flex: none;
  accent-color: var(--dsw-alias-state-success-primary, #34b371);
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
  color: var(--dsw-alias-label-tertiary, #8b8f98);
  margin-top: 2px;
}
.dshBrowserCtlCfgOfficialNote {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-secondary, #a6aab2);
  border: 1px dashed var(--dsw-alias-border-l2, #2a2c33);
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
  color: var(--dsw-alias-label-secondary, #a6aab2);
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
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.04));
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 13px;
  font-family: ui-monospace, Consolas, Menlo, monospace;
  box-sizing: border-box;
}
.dshBrowserCtlCfgField input:focus {
  outline: none;
  border-color: var(--dsw-alias-state-success-primary, #34b371);
}
.dshBrowserCtlCfgNote {
  margin: 0;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
}
.dshBrowserCtlCfgErr {
  margin: 0;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-state-error-primary, #e5655c);
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
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.03));
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
  color: var(--dsw-alias-label-tertiary, #8b8f98);
}
.dshBrowserCtlSwitch {
  position: relative;
  flex: none;
  width: 42px;
  height: 24px;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.06));
  cursor: pointer;
  padding: 0;
  transition: background .15s ease, border-color .15s ease;
}
.dshBrowserCtlSwitch[data-on='true'] {
  background: var(--dsw-alias-state-success-primary, #34b371);
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
  background: #fff;
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
  border: 2px solid rgba(128,128,128,.35);
  border-top-color: var(--dsw-alias-label-secondary, #a6aab2);
  border-radius: 50%;
  animation: dshBrowserCtlSpin .7s linear infinite;
}
.dshBrowserCtlSwitch[data-on='true'] .dshBrowserCtlSwitchBusy {
  border-color: rgba(255,255,255,.35);
  border-top-color: #fff;
}
@keyframes dshBrowserCtlSpin { to { transform: rotate(360deg); } }
/* \u6D4B\u8BD5\u63A8\u9001\u6309\u94AE:42px \u4E09\u6001 */
.dshBrowserCtlPushBtn {
  height: 42px !important;
  margin: 4px 0 !important;
  min-width: 128px;
}
/* \u6700\u8FD1\u63A8\u9001\u5217\u8868 */
.dshBrowserCtlPushList {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dshBrowserCtlPushRow {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.04));
  border-radius: 8px;
  font-size: 12px;
  line-height: 16px;
  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.02));
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
  color: var(--dsw-alias-label-secondary, #a6aab2);
}
.dshBrowserCtlPushTime {
  font-size: 10.5px;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
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
  color: var(--dsw-alias-label-secondary, #a6aab2);
  font-size: 11.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`;
function installStyles() {
  const existing = document.querySelector(`style[data-plugin="${STYLE_ID}"]`);
  if (existing !== null) return () => {
  };
  const style = document.createElement("style");
  style.dataset.plugin = STYLE_ID;
  style.textContent = css;
  document.head.append(style);
  return () => {
    style.remove();
  };
}
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
function useQr(open, reloadToken, uses) {
  const [data, setData] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(null);
  const [expiresAt, setExpiresAt] = (0, import_react.useState)(0);
  const [status, setStatus] = (0, import_react.useState)(null);
  const [refreshTick, setRefreshTick] = (0, import_react.useState)(0);
  const usesRef = (0, import_react.useRef)(uses);
  usesRef.current = uses || 1;
  (0, import_react.useEffect)(() => {
    if (!open) return;
    let alive = true;
    setError(null);
    async function load() {
      try {
        const r = await fetch("/browserctl/api/pair?uses=" + usesRef.current, { method: "POST", cache: "no-store" });
        const tx = await r.text();
        let j;
        try {
          j = JSON.parse(tx);
        } catch {
          throw new Error("\u8DEF\u7531\u672A\u52A0\u8F7D(HTTP " + r.status + ");\u8BF7\u91CD\u542F DSH \u540E\u91CD\u8BD5");
        }
        if (j.error) throw new Error(j.error);
        if (!alive) return;
        setError(null);
        setData(j);
        setStatus({ uses: j.uses || 1, remaining: j.remaining || 1 });
        setExpiresAt(Date.now() + (j.ttl || 60) * 1e3);
        return;
      } catch (e1) {
        try {
          const r2 = await fetch("/browserctl/api/qr", { cache: "no-store" });
          const tx2 = await r2.text();
          let j2;
          try {
            j2 = JSON.parse(tx2);
          } catch {
            throw new Error("\u8DEF\u7531\u672A\u52A0\u8F7D(HTTP " + r2.status + ");\u8BF7\u91CD\u542F DSH \u540E\u91CD\u8BD5");
          }
          if (!alive) return;
          if (j2.error) {
            setData(null);
            setError(j2.error);
          } else {
            setError(null);
            setData(j2);
            setExpiresAt(0);
          }
        } catch (e2) {
          if (alive) {
            setData(null);
            setError(String(e2 && e2.message || e2));
          }
        }
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [open, reloadToken, refreshTick, uses]);
  (0, import_react.useEffect)(() => {
    if (!open || !data || !data.grant) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/browserctl/api/pair-status?g=" + encodeURIComponent(data.grant), { cache: "no-store" });
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
  return { data, error, expiresAt, status, refresh: () => setRefreshTick((x) => x + 1) };
}
function useCountdown(expiresAt) {
  const [left, setLeft] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
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
  ] })
};
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
function DevicesSection({ t, reloadToken, onRefresh, disabled }) {
  const [data, setData] = (0, import_react.useState)(null);
  const [open, setOpen] = (0, import_react.useState)(true);
  const [histOpen, setHistOpen] = (0, import_react.useState)(true);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [kicking, setKicking] = (0, import_react.useState)(null);
  const [kickMsg, setKickMsg] = (0, import_react.useState)("");
  const [banning, setBanning] = (0, import_react.useState)(null);
  const [banMsg, setBanMsg] = (0, import_react.useState)("");
  const [banOk, setBanOk] = (0, import_react.useState)(true);
  const anyBusy = disabled || busy;
  (0, import_react.useEffect)(() => {
    let alive = true;
    fetch("/browserctl/api/totp", { cache: "no-store" }).then((r) => r.text().then((tx) => {
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
  (0, import_react.useEffect)(() => {
    if (!kickMsg) return;
    const id = setTimeout(() => setKickMsg(""), 2200);
    return () => clearTimeout(id);
  }, [kickMsg]);
  (0, import_react.useEffect)(() => {
    if (!banMsg) return;
    const id = setTimeout(() => setBanMsg(""), 2200);
    return () => clearTimeout(id);
  }, [banMsg]);
  const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
  const devices = Array.isArray(data?.devices) ? data.devices : [];
  const nowSec = Date.now() / 1e3;
  const isFresh = (ts) => !!ts && nowSec - ts < 600;
  const groupKey = (ip, name) => (ip || "") + "\0" + (name || "");
  const devByKey = new Map(devices.map((d) => [d.key, d]));
  const onlineSessions = sessions.filter((s) => isFresh(s.ts || s.since));
  const onlineGroups = new Set(onlineSessions.map((s) => groupKey(s.ip, s.name)));
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
  function fmtWhen(ts) {
    if (!ts) return "";
    const mins = Math.max(0, Math.round((Date.now() - ts * 1e3) / 6e4));
    if (mins < 1) return "\u521A\u521A";
    if (mins < 60) return mins + " \u5206\u949F\u524D";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + " \u5C0F\u65F6\u524D";
    return Math.round(hrs / 24) + " \u5929\u524D";
  }
  function fmtOnline(since) {
    if (!since) return "";
    const mins = Math.max(0, Math.round((Date.now() - since * 1e3) / 6e4));
    if (mins < 1) return "\u4E0D\u5230 1 \u5206\u949F";
    if (mins < 60) return mins + " \u5206\u949F";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + " \u5C0F\u65F6";
    const days = Math.round(hrs / 24);
    return days + " \u5929";
  }
  function fmtDuration(ms) {
    if (!ms || ms < 0) return "";
    const totalSec = Math.round(ms / 1e3);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins < 1) return secs + " \u79D2";
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hrs < 1) return mins + " \u5206\u949F";
    if (hrs < 24) return hrs + " \u5C0F\u65F6 " + remainMins + " \u5206\u949F";
    const days = Math.floor(hrs / 24);
    return days + " \u5929 " + hrs % 24 + " \u5C0F\u65F6";
  }
  async function kick(dev) {
    setBusy(true);
    setKicking(dev || "all");
    setKickMsg("");
    const body = JSON.stringify(dev ? { dev } : {});
    try {
      let r = await fetch(dev ? "/browserctl-gate/kick" : "/browserctl-gate/kick-all", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body
      }).catch(() => null);
      if (!r || !r.ok) {
        const q = dev ? "?dev=" + encodeURIComponent(dev) : "";
        r = await fetch("/browserctl/api/totp-kick" + q, { cache: "no-store" }).catch(() => null);
      }
      if (r && r.ok) {
        setKickMsg(dev ? "\u5DF2\u8E22\u51FA\u8BBE\u5907" : "\u5168\u90E8\u8E22\u4E0B\u7EBF\u6210\u529F");
        setData((d) => {
          if (!d) return d;
          const list = Array.isArray(d.sessions) ? d.sessions : [];
          return { ...d, sessions: dev ? list.filter((s) => s.dev !== dev) : [] };
        });
        setTimeout(() => onRefresh(), 1500);
      } else {
        setKickMsg("\u8E22\u51FA\u5931\u8D25");
      }
    } catch {
      setKickMsg("\u7F51\u7EDC\u9519\u8BEF");
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
      let r = await fetch("/browserctl-gate/blacklist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dev, ip, name: name || "\u672A\u77E5", reason: "\u7BA1\u7406\u5458\u5C01\u7981" })
      }).catch(() => null);
      if (!r || !r.ok) {
        const q = new URLSearchParams({ dev: dev || "", ip: ip || "", name: name || "\u672A\u77E5", reason: "\u7BA1\u7406\u5458\u5C01\u7981" }).toString();
        r = await fetch("/browserctl/api/blacklist-add?" + q, { cache: "no-store" }).catch(() => null);
      }
      const ok = !!(r && r.ok);
      setBanOk(ok);
      setBanMsg(ok ? "\u5DF2\u62C9\u9ED1 " + (name || ip || "") : "\u62C9\u9ED1\u5931\u8D25");
      onRefresh();
    } catch {
      setBanOk(false);
      setBanMsg("\u7F51\u7EDC\u9519\u8BEF");
    } finally {
      setBusy(false);
      setBanning(null);
    }
  }
  if (!data) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCard", "data-busy": anyBusy ? "true" : "false", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "dshBrowserCtlCardHead", "data-open": open ? "true" : "false", onClick: () => setOpen((o) => !o), children: [
      Svg.desk,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("devicesTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardStat", style: { color: onlineSessions.length ? "var(--dsw-alias-label-primary,inherit)" : "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("devicesOnline").replace("{n}", onlineSessions.length) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardArrow", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCardBody", "data-open": open, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCardDesc", children: t("noDevicesHint") }),
      onlineSessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlDevEmpty", children: t("noOnlineDevices") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlDevBody", children: onlineSessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlDevTable", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlDevInfo", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlDevTop", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlDevPlatform", title: s.ua || "", children: s.name || fmtPlatform(s.ua) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KindTag, { item: s }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlDevSeen", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlHistDot", "data-on": "true", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
              "\u5728\u7EBF ",
              fmtOnline(onlineSince(s))
            ] }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlDevIp", children: [
            s.ip || "unknown",
            s.loc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { marginLeft: 6, opacity: 0.6, fontSize: 10 }, children: s.loc }) : null
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlDevActions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", disabled: anyBusy, onClick: () => kick(s.dev), children: kicking === s.dev ? "\u8E22\u51FA\u4E2D\u2026" : t("deviceKick") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", disabled: anyBusy, onClick: () => ban(s.dev, s.ip, s.name), children: banning === s.dev ? "\u62C9\u9ED1\u4E2D\u2026" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            Svg.shield,
            " \u62C9\u9ED1"
          ] }) })
        ] })
      ] }, s.dev)) }),
      sessions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", justifyContent: "center", gap: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "secondary", size: "sm", disabled: anyBusy, onClick: () => kick(null), children: kicking === "all" ? "\u8E22\u51FA\u4E2D\u2026" : t("totpKick") }) }),
      kickMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { textAlign: "center", fontSize: 12, color: "var(--dsw-alias-state-success-primary,#34b371)", padding: "4px 0 0" }, children: kickMsg })
    ] }),
    devices.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCard", "data-busy": anyBusy ? "true" : "false", style: { marginTop: 2 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "dshBrowserCtlCardHead", "data-open": histOpen ? "true" : "false", onClick: () => setHistOpen((o) => !o), children: [
        Svg.desk,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5386\u53F2\u5728\u7EBF\u8BBE\u5907" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlCardStat", style: { color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: [
          "\u5171 ",
          historical.length,
          " \u53F0"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardArrow", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlCardBody", "data-open": histOpen, children: historical.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlDevEmpty", children: "\u6682\u65E0\u5386\u53F2\u8BBE\u5907" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlDevBody", children: historical.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlDevTable", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlDevInfo", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlDevTop", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlDevPlatform", title: d.ua || "", children: d.name || "\u672A\u77E5\u8BBE\u5907" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KindTag, { item: d }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlDevSeen", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlHistDot", "data-on": "false", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
              fmtAgoLong(d.last_seen) + "\u5728\u7EBF"
            ] }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlDevIp", children: [
            d.ip || "unknown",
            d.loc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { marginLeft: 6, opacity: 0.6, fontSize: 10 }, children: d.loc }) : null,
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: "var(--dsw-alias-label-tertiary,#8b8f98)", fontSize: 10 }, children: [
              " \xB7 \u5DF2\u8FDE " + (d.times || 1) + " \u6B21",
              (d.total_online || 0) > 0 ? " \xB7 \u7D2F\u8BA1 " + fmtDuration(d.total_online * 1e3) : ""
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlDevActions", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", disabled: anyBusy, onClick: () => ban(d.key, d.ip, d.name), children: banning === d.key ? "\u62C9\u9ED1\u4E2D\u2026" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          Svg.shield,
          " \u62C9\u9ED1"
        ] }) }) })
      ] }, d.key)) }) })
    ] }),
    banMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { textAlign: "center", fontSize: 12, color: banOk ? "var(--dsw-alias-state-success-primary,#34b371)" : "var(--dsw-alias-state-warning-primary,#d08030)", padding: "2px 0 0" }, children: banMsg })
  ] });
}
var LogIcon = ({ typ }) => {
  const props = { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", style: { flex: "none" } };
  const color = "currentColor";
  switch (typ) {
    case "verify":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "7", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5 8.5l2 2 4-4.5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round" })
      ] });
    case "kick":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "7", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5.5 5.5l5 5M10.5 5.5l-5 5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round" })
      ] });
    case "totp":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "4.5", y: "7", width: "7", height: "6", rx: "1.5", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5.5 7V4.5a2.5 2.5 0 015 0V7", stroke: color, strokeWidth: "1.2", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "9.5", r: "1", fill: color })
      ] });
    case "ban":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 5.5V8c0 2.8 2 5.2 5 6 3-.8 5-3.2 5-6V5.5L8 3l-5 2.5z", stroke: color, strokeWidth: "1.2", strokeLinejoin: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6 8.5l1.5 1.5 3-3", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round" })
      ] });
    default:
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: "\xB7" });
  }
};
function fmtClock(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1e3);
  const p = (n) => String(n).padStart(2, "0");
  return p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}
function LogCard({ t, reloadToken }) {
  const [open, setOpen] = (0, import_react.useState)(true);
  const [events, setEvents] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    let alive = true;
    fetch("/browserctl-gate/events", { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => {
      if (alive) setEvents(Array.isArray(j.events) ? j.events : []);
    }).catch(() => fetch("/browserctl/api/totp", { cache: "no-store" }).then((r) => r.json()).then((j) => {
      if (alive) setEvents(Array.isArray(j.events) ? j.events : []);
    }).catch(() => {
      if (alive) setEvents([]);
    }));
    return () => {
      alive = false;
    };
  }, [reloadToken]);
  const list = (events || []).slice().reverse();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: "dshBrowserCtlCardHead",
        "data-open": open ? "true" : "false",
        onClick: () => setOpen((o) => !o),
        children: [
          Svg.clip,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("logTitle") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 500, fontSize: 12, color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: list.length ? list.length + " \u6761" : "\u6682\u65E0" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardArrow", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlCardBody", "data-open": open, children: list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlDevEmpty", children: t("logEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlLogBody", children: list.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlLogRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlLogType", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIcon, { typ: e.typ }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlLogMsg", title: e.msg || "", children: e.msg || "" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlLogTime", children: fmtClock(e.t) })
    ] }, i)) }) })
  ] });
}
function BlacklistCard({ t, reloadToken, disabled }) {
  const [open, setOpen] = (0, import_react.useState)(true);
  const [data, setData] = (0, import_react.useState)(null);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const anyBusy = disabled || busy;
  (0, import_react.useEffect)(() => {
    let alive = true;
    fetch("/browserctl-gate/blacklist", { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => {
      if (alive) setData(Array.isArray(j.blacklist) ? j.blacklist : []);
    }).catch(() => {
      if (alive) setData([]);
    });
    return () => {
      alive = false;
    };
  }, [reloadToken]);
  const list = data || [];
  async function unban(ip) {
    setBusy(true);
    try {
      let r = await fetch("/browserctl-gate/blacklist/remove", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ip })
      }).catch(() => null);
      if (!r || !r.ok) {
        r = await fetch("/browserctl/api/blacklist-remove?ip=" + encodeURIComponent(ip), { cache: "no-store" }).catch(() => null);
      }
      if (r && r.ok) setData((d) => (d || []).filter((x) => x.ip !== ip));
    } catch {
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCard", "data-busy": anyBusy ? "true" : "false", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "dshBrowserCtlCardHead", "data-open": open ? "true" : "false", onClick: () => setOpen((o) => !o), children: [
      Svg.shield,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("banTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardStat", style: { color: list.length ? "var(--dsw-alias-label-primary,inherit)" : "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: list.length ? list.length + " \u4E2A" : "\u65E0" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardArrow", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlCardBody", "data-open": open, children: list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlDevEmpty", children: t("banEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlBanBody", children: list.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlBanRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlBanInfo", title: r.ip, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--dsw-alias-label-primary,inherit)", fontWeight: 500 }, children: r.name || "unknown" }),
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--dsw-alias-label-secondary,#a6aab2)" }, children: r.ip }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlBanReason", children: r.reason ? " \xB7 " + r.reason : "" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", disabled: anyBusy, onClick: () => unban(r.ip), children: "\u89E3\u7981" })
    ] }, i)) }) })
  ] });
}
function AppPairCard({ t, reloadToken }) {
  const [data, setData] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [copied, setCopied] = (0, import_react.useState)(false);
  const [open, setOpen] = (0, import_react.useState)(true);
  const [sessions, setSessions] = (0, import_react.useState)([]);
  const [webCount, setWebCount] = (0, import_react.useState)(0);
  const [kicking, setKicking] = (0, import_react.useState)(null);
  const [kickMsg, setKickMsg] = (0, import_react.useState)("");
  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/browserctl/api/pair-long", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setData({ error: j && j.error || "HTTP " + r.status });
        return;
      }
      if (!j.url || !j.svg) {
        setData({ error: j && j.error || "\u914D\u5BF9\u7801\u54CD\u5E94\u4E0D\u5B8C\u6574" });
        return;
      }
      setData(j);
    } catch (e) {
      setData({ error: String(e && e.message || e) });
    } finally {
      setLoading(false);
    }
  }
  async function loadDevices() {
    try {
      const r = await fetch("/browserctl/api/totp", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      const list = Array.isArray(j?.sessions) ? j.sessions : [];
      setSessions(list.filter((s) => kindOf(s) === "app"));
      setWebCount(list.filter((s) => kindOf(s) === "web").length);
    } catch {
    }
  }
  async function kick(dev) {
    setKicking(dev);
    setKickMsg("");
    const body = JSON.stringify({ dev });
    try {
      let r = await fetch("/browserctl-gate/kick", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body
      }).catch(() => null);
      if (!r || !r.ok) {
        r = await fetch("/browserctl/api/totp-kick?dev=" + encodeURIComponent(dev), { cache: "no-store" }).catch(() => null);
      }
      if (r && r.ok) {
        setKickMsg("\u5DF2\u89E3\u9664\u8BE5\u8BBE\u5907\u914D\u5BF9");
        setSessions((list) => list.filter((s) => s.dev !== dev));
        setTimeout(loadDevices, 1200);
      } else {
        setKickMsg("\u89E3\u9664\u5931\u8D25");
      }
    } catch {
      setKickMsg("\u7F51\u7EDC\u9519\u8BEF");
    } finally {
      setKicking(null);
    }
  }
  (0, import_react.useEffect)(() => {
    load();
    loadDevices();
  }, [reloadToken]);
  (0, import_react.useEffect)(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);
  (0, import_react.useEffect)(() => {
    if (!kickMsg) return;
    const id = setTimeout(() => setKickMsg(""), 2400);
    return () => clearTimeout(id);
  }, [kickMsg]);
  const ok = !!(data && data.url && !data.error);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: "dshBrowserCtlCardHead",
        "data-open": open ? "true" : "false",
        onClick: () => setOpen((o) => !o),
        children: [
          Svg.phone,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("tabApp") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
            fontWeight: 500,
            fontSize: 12,
            color: ok ? "var(--dsw-alias-state-success-primary,#34b371)" : "var(--dsw-alias-label-tertiary,#8b8f98)"
          }, children: ok ? t("appReady") : loading ? "\u2026" : t("appNoQr") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardArrow", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCardBody dshBrowserCtlCardBodyTall", "data-open": open, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCardDesc", children: t("appSubtitle") }),
      ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlQrBox", children: data.svg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { alt: t("appQrAlt"), src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data.svg) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "#666", fontSize: 12 }, children: t("appNoQr") }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCardDesc", style: { textAlign: "center" }, children: t("appOnceHint") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlUrlRow", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlUrl", title: data.url, children: data.url }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", onClick: () => {
            navigator.clipboard?.writeText(data.url).then(() => setCopied(true)).catch(() => {
            });
          }, children: copied ? t("copied") : t("appCopyLink") })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlQrBox", style: { height: 120 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "#666", fontSize: 12, padding: "0 14px", textAlign: "center" }, children: loading ? t("appLoading") : data && data.error || t("appNoQr") }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlActions", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "secondary", size: "sm", disabled: loading, onClick: load, children: loading ? "\u2026" : t("appRefresh") }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlPairedList", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlPairedHead", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5DF2\u914D\u5BF9\u7684\u624B\u673A" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlPairedCount", children: sessions.length })
        ] }),
        sessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlPairedEmpty", children: "\u8FD8\u6CA1\u6709\u624B\u673A\u901A\u8FC7\u626B\u7801\u914D\u5BF9" }) : sessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlPairedRow", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlPairedInfo", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlPairedNameRow", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlPairedName", children: s.name || "\u624B\u673A App" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KindTag, { item: s })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlPairedMeta", children: [
              s.ip || "unknown",
              s.ts ? " \xB7 " + fmtAgo(s.ts) : ""
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              variant: "ghost",
              size: "sm",
              disabled: kicking === s.dev,
              onClick: () => kick(s.dev),
              children: kicking === s.dev ? "\u89E3\u9664\u4E2D\u2026" : "\u89E3\u9664\u914D\u5BF9"
            }
          )
        ] }, s.dev)),
        webCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlPairedEmpty", style: { paddingTop: 2 }, children: [
          "\u53E6\u6709 ",
          webCount,
          " \u4E2A\u7F51\u9875\u767B\u5F55\u4F1A\u8BDD\uFF08\u6D4F\u89C8\u5668\u6253\u5F00\uFF0C\u672A\u957F\u671F\u7ED1\u5B9A\uFF09\uFF0C\u5728\u300C\u8BBE\u5907\u300D\u9875\u7B7E\u67E5\u770B/\u8E22\u51FA"
        ] }),
        kickMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlPairedMsg", children: kickMsg })
      ] })
    ] })
  ] });
}
function fmtAgo(ts) {
  if (!ts) return "";
  const mins = Math.max(0, Math.round((Date.now() - ts * 1e3) / 6e4));
  if (mins < 1) return "\u521A\u521A";
  if (mins < 60) return mins + " \u5206\u949F\u524D";
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + " \u5C0F\u65F6\u524D";
  return Math.round(hrs / 24) + " \u5929\u524D";
}
function kindOf(s) {
  if (s && s.kind) return s.kind;
  const n = s && s.name || "";
  return n.indexOf("DSH Remote") === 0 || n === "\u624B\u673A App" ? "app" : "web";
}
function KindTag({ item }) {
  const k = kindOf(item);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlKindTag", "data-kind": k, children: k === "app" ? "App" : "\u7F51\u9875" });
}
function fmtAgoLong(ts) {
  if (!ts) return "";
  const mins = Math.max(0, Math.round((Date.now() - ts * 1e3) / 6e4));
  if (mins < 1) return "\u521A\u521A";
  if (mins < 60) return mins + " \u5206\u949F\u524D";
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return hrs + " \u5C0F\u65F6" + (rem ? " " + rem + " \u5206\u949F" : "") + "\u524D";
  const days = Math.floor(hrs / 24);
  const remH = hrs % 24;
  return days + " \u5929" + (remH ? " " + remH + " \u5C0F\u65F6" : "") + "\u524D";
}
function fmtLinkExpiry(exp) {
  const d = new Date(Number(exp) * 1e3);
  if (!exp || Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function IosGuideCard({ t, reloadToken }) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const [ttl, setTtl] = (0, import_react.useState)(86400);
  const [uses, setUses] = (0, import_react.useState)(1);
  const [data, setData] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)("");
  const [copied, setCopied] = (0, import_react.useState)(false);
  const [bump, setBump] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetch("/browserctl/api/link?ttl=" + ttl + "&uses=" + uses, { cache: "no-store" }).then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!alive) return;
      if (!r.ok || !j.url) {
        setData(null);
        setError(j.error || "HTTP " + r.status);
        return;
      }
      setData(j);
    }).catch((e) => {
      if (!alive) return;
      setData(null);
      setError(String(e && e.message || e));
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [ttl, uses, bump, reloadToken]);
  (0, import_react.useEffect)(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);
  const ok = !!(data && data.url);
  const expText = ok ? fmtLinkExpiry(data.exp) : "";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCard", style: { marginTop: 10 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: "dshBrowserCtlCardHead",
        "data-open": open ? "true" : "false",
        onClick: () => setOpen((o) => !o),
        children: [
          Svg.iphone,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("linkTitle") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardStat", style: {
            color: ok ? "var(--dsw-alias-state-success-primary,#34b371)" : "var(--dsw-alias-label-tertiary,#8b8f98)"
          }, children: ok ? t("linkReady") : loading ? "\u2026" : "" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardArrow", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCardBody dshBrowserCtlCardBodyTall", "data-open": open, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCardDesc", children: t("linkSubtitle") }),
      ok && data.svg && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 10 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlQrBox", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "img",
          {
            alt: t("linkQrAlt"),
            style: { width: 200, height: 200 },
            src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data.svg)
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCardDesc", style: { margin: 0, textAlign: "center" }, children: t("linkScanHint") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlUrlRow", style: { marginTop: 8, gap: 8, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary,#8b8f98)", whiteSpace: "nowrap" }, children: t("linkTtlLabel") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            value: ttl,
            disabled: loading,
            onChange: (e) => setTtl(parseInt(e.target.value, 10) || 86400),
            style: {
              fontSize: 12,
              padding: "2px 4px",
              borderRadius: 6,
              border: "1px solid rgba(128,128,128,.35)",
              background: "transparent",
              color: "inherit",
              flex: "none"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 3600, children: t("linkTtl1h") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 86400, children: t("linkTtl24h") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 604800, children: t("linkTtl7d") })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary,#8b8f98)", whiteSpace: "nowrap" }, children: t("linkUsesLabel") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            value: uses,
            disabled: loading,
            onChange: (e) => setUses(parseInt(e.target.value, 10) || 0),
            style: {
              fontSize: 12,
              padding: "2px 4px",
              borderRadius: 6,
              border: "1px solid rgba(128,128,128,.35)",
              background: "transparent",
              color: "inherit",
              flex: "none"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 1, children: t("linkUses1") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 3, children: t("linkUses3") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 5, children: t("linkUses5") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 0, children: t("linkUsesUnlimited") })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "secondary", size: "sm", disabled: loading, onClick: () => setBump((x) => x + 1), children: loading ? t("linkGenerating") : ok ? t("linkRegenerate") : t("linkGenerate") })
      ] }),
      ok && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlUrlRow", style: { marginTop: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlUrl", title: data.url, children: data.url }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", onClick: () => {
            navigator.clipboard?.writeText(data.url).then(() => setCopied(true)).catch(() => {
            });
          }, children: copied ? t("linkCopied") : t("linkCopy") })
        ] }),
        expText && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "dshBrowserCtlCardDesc", style: { marginTop: 4 }, children: [
          t("linkExpires").replace("{t}", expText),
          " \xB7 ",
          data.uses ? t("linkUsesSuffix").replace("{n}", String(data.uses)) : t("linkUsesUnlimited")
        ] })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCardDesc", style: { marginTop: 4, color: "var(--dsw-alias-state-error-primary,#e5655c)" }, children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCardDesc", style: { marginTop: 10, fontWeight: 500, color: "var(--dsw-alias-label-secondary,#a6aab2)" }, children: t("linkStepsTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", { style: { margin: "4px 0 0", paddingLeft: 18, fontSize: 11.5, lineHeight: "18px", color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t("linkStep1") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t("linkStep2") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t("linkStep3") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t("linkStep4") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCardDesc", style: { marginTop: 8 }, children: t("linkNote") })
    ] })
  ] });
}
function TotpCard({ t, reloadToken, onRefresh, disabled }) {
  const [data, setData] = (0, import_react.useState)(null);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [open, setOpen] = (0, import_react.useState)(true);
  const anyBusy = disabled || busy;
  (0, import_react.useEffect)(() => {
    let alive = true;
    fetch("/browserctl/api/totp", { cache: "no-store" }).then((r) => r.text().then((tx) => {
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
      const r = await fetch("/browserctl/api/totp-toggle?" + q, { cache: "no-store" });
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
  async function kick(dev) {
    setBusy(true);
    try {
      const q = dev ? "?dev=" + encodeURIComponent(dev) : "";
      await fetch("/browserctl/api/totp-kick" + q, { cache: "no-store" });
      onRefresh();
    } finally {
      setBusy(false);
    }
  }
  function fmtWhen(ts) {
    if (!ts) return "";
    const mins = Math.max(0, Math.round((Date.now() - ts * 1e3) / 6e4));
    if (mins < 1) return "\u521A\u521A";
    if (mins < 60) return mins + " \u5206\u949F\u524D";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + " \u5C0F\u65F6\u524D";
    return Math.round(hrs / 24) + " \u5929\u524D";
  }
  const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
  const status = data ? data.enabled ? sessions.length > 0 ? t("totpOn") + " \xB7 " + t("devicesOnline").replace("{n}", sessions.length) : t("totpOn") : t("totpOff") : "\u2026";
  const [copiedSecret, setCopiedSecret] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    if (!copiedSecret) return;
    const id = setTimeout(() => setCopiedSecret(false), 1600);
    return () => clearTimeout(id);
  }, [copiedSecret]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: "dshBrowserCtlCardHead",
        "data-open": open ? "true" : "false",
        onClick: () => setOpen((o) => !o),
        children: [
          Svg.lock,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("totpTitle") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
            fontWeight: 500,
            fontSize: 12,
            color: data?.enabled ? "var(--dsw-alias-state-success-primary,#34b371)" : "var(--dsw-alias-label-tertiary,#8b8f98)"
          }, children: status }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardArrow", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCardBody", "data-open": open, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("totpHintShort") }),
      data?.enabled && data?.svg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlTotpQr", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { alt: t("totpBind"), src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data.svg) }) }),
      data?.secret && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlSecretRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlSecret", title: data.secret, children: [
          t("totpSecretLabel"),
          ": ",
          data.secret
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", onClick: () => {
          navigator.clipboard?.writeText(data.secret).then(() => setCopiedSecret(true)).catch(() => {
          });
        }, children: copiedSecret ? t("copied") : t("copySecret") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlActions", children: data?.enabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "secondary", size: "sm", disabled: anyBusy, onClick: () => toggle(false), children: t("totpDisable") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "secondary", size: "sm", disabled: anyBusy, onClick: () => toggle(true, true), children: t("totpReset") })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "primary", size: "sm", disabled: anyBusy || !data, onClick: () => toggle(true), children: t("totpEnable") }) })
    ] })
  ] });
}
var PUSH_KIND = { test: "Test", verify: "Verify", kick: "Kick", ban: "Ban", totp: "Totp", pair: "Pair", join: "Join", dev: "Dev" };
function pushKindLabel(t, kind) {
  const key = PUSH_KIND[kind];
  return key ? t("pushKind" + key) : kind || "";
}
function fmtPushTime(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1e3);
  const p = (n) => String(n).padStart(2, "0");
  return p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}
function PushCard({ t, reloadToken }) {
  const [cfg, setCfg] = (0, import_react.useState)(null);
  const [cfgErr, setCfgErr] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)("");
  const [testState, setTestState] = (0, import_react.useState)("idle");
  const [toast, setToast] = (0, import_react.useState)(null);
  const [items, setItems] = (0, import_react.useState)(null);
  const [polling, setPolling] = (0, import_react.useState)(false);
  const [open, setOpen] = (0, import_react.useState)(true);
  const enabled = !!(cfg && cfg.enabled);
  const system = !!(cfg && cfg.system);
  (0, import_react.useEffect)(() => {
    let alive = true;
    fetch("/browserctl-gate/push-config", { cache: "no-store" }).then((r) => r.text().then((tx) => {
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
  (0, import_react.useEffect)(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);
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
      const r = await fetch("/browserctl-gate/push-config?" + q, { method: "POST", cache: "no-store" });
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
      const r = await fetch("/browserctl-gate/notify?" + q, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      setToast({ text: r.ok && j.ok ? t("pushTestOk") : j && j.error || t("pushTestFail"), ok: !!(r.ok && j.ok) });
    } catch {
      setToast({ text: t("pushTestFail"), ok: false });
    } finally {
      setTestState("idle");
    }
  }
  async function loadPoll() {
    if (polling) return;
    setPolling(true);
    try {
      const r = await fetch("/browserctl-gate/push-poll?last=0", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        setItems(Array.isArray(j.items) ? j.items.slice(0, 10) : []);
        setCfg((c) => ({ ...c || {}, enabled: !!j.enabled, since: j.since || c && c.since || 0 }));
      }
    } catch {
    } finally {
      setPolling(false);
    }
  }
  (0, import_react.useEffect)(() => {
    loadPoll();
  }, [reloadToken]);
  const list = items || [];
  const switchDisabled = !!busy || !cfg;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "dshBrowserCtlCardHead", "data-open": open ? "true" : "false", onClick: () => setOpen((o) => !o), children: [
      Svg.bell,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("pushTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardStat", style: { color: enabled ? "var(--dsw-alias-state-success-primary,#34b371)" : "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: cfg ? enabled ? t("pushOn") : t("pushOff") : "\u2026" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCardArrow", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCardBody dshBrowserCtlCardBodyTall", "data-open": open, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCardDesc", children: t("pushDesc") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlSwitchRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlSwitchLabel", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlSwitchTitle", children: t("pushEnabledLabel") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlSwitchHint", children: t("pushEnabledHint") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlSwitchKnob", "aria-hidden": "true" }),
              busy === "enabled" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlSwitchBusy", "aria-hidden": "true" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlSwitchRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlSwitchLabel", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlSwitchTitle", children: t("pushSystemLabel") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlSwitchHint", children: t("pushSystemHint") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlSwitchKnob", "aria-hidden": "true" }),
              busy === "system" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlSwitchBusy", "aria-hidden": "true" })
            ]
          }
        )
      ] }),
      cfgErr && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCardDesc", style: { color: "var(--dsw-alias-state-error-primary,#e5655c)" }, children: cfgErr }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlActions", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_dsh_client_ui_primitives.Button,
        {
          variant: "secondary",
          size: "sm",
          className: "dshBrowserCtlPushBtn",
          disabled: testState === "loading" || !enabled || !!busy,
          onClick: sendTest,
          children: testState === "loading" ? t("pushTesting") : t("pushTest")
        }
      ) }),
      toast && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlPairedMsg", style: { color: toast.ok ? "var(--dsw-alias-state-success-primary,#34b371)" : "var(--dsw-alias-state-error-primary,#e5655c)" }, children: toast.text }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlPairedList", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlPairedHead", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("pushRecent") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", disabled: polling, onClick: loadPoll, children: polling ? t("pushRefreshing") : t("pushRefresh") })
        ] }),
        list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlPairedEmpty", children: t("pushEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlPushList", children: list.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlPushRow", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlPushAside", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlPushType", children: pushKindLabel(t, it.kind) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlPushTime", children: fmtPushTime(it.t) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlPushMain", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlPushTitle", title: it.title || "", children: it.title || "" }),
            it.body ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlPushBody", title: it.body, children: it.body }) : null
          ] })
        ] }, it.id || it.t + (it.title || ""))) })
      ] })
    ] })
  ] });
}
function AboutPanel({ t, onClose }) {
  const [checkState, setCheckState] = (0, import_react.useState)("idle");
  const [checkResult, setCheckResult] = (0, import_react.useState)(null);
  const [legalDoc, setLegalDoc] = (0, import_react.useState)(null);
  const links = [
    { key: "website", href: ABOUT_LINKS.website, icon: "globe", label: t("aboutWebsite") },
    { key: "github", href: ABOUT_LINKS.github, icon: "link", label: t("aboutGithub") },
    { key: "app", href: ABOUT_LINKS.app, icon: "phone", label: t("aboutApp") }
  ];
  async function checkUpdate() {
    if (checkState === "loading") return;
    setCheckState("loading");
    setCheckResult(null);
    try {
      const r = await fetch("/browserctl/api/update-check", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      setCheckResult(j);
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlOverlay", role: "dialog", "aria-modal": "true", "aria-label": t("about"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dshBrowserCtlOverlayMask", type: "button", "aria-label": t("close"), onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dshBrowserCtlPanel dshBrowserCtlPanelNested", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "dshBrowserCtlHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: t("about") }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tooltip, { label: t("close"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", "aria-label": t("close"), icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCloseOutlineRegular, {}), onClick: onClose }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlAboutApp", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlAboutAppName", children: t("tab") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlAboutAppVersion", children: [
          "v",
          VERSION
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlAboutDesc", children: t("aboutDesc") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlAboutLinks", children: links.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { className: "dshBrowserCtlAboutLink", href: l.href, target: "_blank", rel: "noopener noreferrer", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: Svg[l.icon] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: l.label })
      ] }, l.key)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlAboutLegal", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dshBrowserCtlAboutLegalLink", onClick: () => setLegalDoc(LEGAL_TERMS), children: t("legalTerms") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlAboutLegalSep", "aria-hidden": "true", children: "\xB7" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dshBrowserCtlAboutLegalLink", onClick: () => setLegalDoc(LEGAL_PRIVACY), children: t("legalPrivacy") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlAboutUpdate", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            variant: "secondary",
            size: "sm",
            className: "dshBrowserCtlAboutUpdateBtn",
            disabled: checkState === "loading",
            onClick: checkUpdate,
            children: checkState === "loading" ? t("updateChecking") : checkState === "done" ? t("updateRecheck") : t("updateCheck")
          }
        ),
        checkState === "done" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          (hasUpdate || upToDate) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlAboutUpdateRow", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("updateCur") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlAboutUpdateVal", children: [
                "v",
                checkResult.current
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlAboutUpdateRow", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("updateLst") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlAboutUpdateVal", children: [
                "v",
                checkResult.latest
              ] })
            ] })
          ] }),
          hasUpdate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlAboutUpdateFound", children: t("updateFound").replace("{v}", checkResult.latest) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlUrlRow", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlUrl", title: downloadUrl, children: downloadUrl }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "secondary", size: "sm", onClick: () => window.open(downloadUrl, "_blank"), children: t("updateDownload") })
            ] }),
            notes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCardDesc", children: t("updateNotesTitle") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "dshBrowserCtlAboutUpdateNotes", children: notes.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: n }, i)) })
            ] })
          ] }),
          upToDate && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlAboutUpdateLatest", children: t("updateUpToDate") }),
          err && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlAboutUpdateErr", children: err })
        ] })
      ] }),
      legalDoc && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegalDialog, { t, doc: legalDoc, onClose: () => setLegalDoc(null) })
    ] })
  ] });
}
function LegalDialog({ t, doc, onClose }) {
  if (!doc) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlOverlay", role: "dialog", "aria-modal": "true", "aria-label": doc.title, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dshBrowserCtlOverlayMask", type: "button", "aria-label": t("close"), onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dshBrowserCtlPanel dshBrowserCtlPanelNested dshBrowserCtlLegalPanel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "dshBrowserCtlHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: doc.title }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("legalMeta").replace("{d}", LEGAL_EFFECTIVE).replace("{v}", LEGAL_VERSION) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tooltip, { label: t("close"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", "aria-label": t("close"), icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCloseOutlineRegular, {}), onClick: onClose }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlLegalBody", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlLegalSubtitle", children: doc.subtitle }),
        doc.sections.map((sec) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dshBrowserCtlLegalSection", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: sec.title }),
          sec.paragraphs.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: p }, i))
        ] }, sec.title))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlLegalFooter", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "secondary", size: "sm", className: "dshBrowserCtlAboutUpdateBtn", onClick: onClose, children: t("legalAck") }) })
    ] })
  ] });
}
function ConfigPanel({ t, onClose, onSaved }) {
  const [cfg, setCfg] = (0, import_react.useState)(null);
  const [mode, setMode] = (0, import_react.useState)("official");
  const [host, setHost] = (0, import_react.useState)("");
  const [port, setPort] = (0, import_react.useState)("17000");
  const [remotePort, setRemotePort] = (0, import_react.useState)("17901");
  const [token, setToken] = (0, import_react.useState)("");
  const [saving, setSaving] = (0, import_react.useState)("");
  const [err, setErr] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    let alive = true;
    fetch("/browserctl/api/config", { cache: "no-store" }).then((r) => r.text().then((tx) => {
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
        setRemotePort(String(j.remotePort || 17901));
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
      if (remotePort.trim()) params.set("remotePort", String(parseInt(remotePort, 10) || 17901));
      if (token) params.set("token", token);
    } else {
      params.set("mode", "official");
    }
    setSaving("loading");
    try {
      const r = await fetch("/browserctl/api/config?" + params.toString(), { method: "POST", cache: "no-store" });
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlOverlay", role: "dialog", "aria-modal": "true", "aria-label": t("config"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dshBrowserCtlOverlayMask", type: "button", "aria-label": t("close"), onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dshBrowserCtlPanel dshBrowserCtlPanelNested dshBrowserCtlPanelCfg", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "dshBrowserCtlHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: t("config") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("configSubtitle") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tooltip, { label: t("close"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", "aria-label": t("close"), icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCloseOutlineRegular, {}), onClick: onClose }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCfgModes", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dshBrowserCtlCfgMode", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "radio", name: "browserctl-mode", checked: mode === "official", onChange: () => setMode("official") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCfgModeTitle", children: t("configOfficial") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCfgModeDesc", children: t("configOfficialHint") })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dshBrowserCtlCfgMode", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "radio", name: "browserctl-mode", checked: mode === "selfhost", onChange: () => setMode("selfhost") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCfgModeTitle", children: t("configSelfhost") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshBrowserCtlCfgModeDesc", children: t("configSelfhostHint") })
          ] })
        ] })
      ] }),
      mode === "official" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCfgOfficialNote", children: t("configOfficialNote") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficialAccountCard, { t, onSaved })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCfgFields", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("configHost") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: host, onChange: (e) => setHost(e.target.value), placeholder: t("configHostPh"), spellCheck: false })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCfgFieldRow", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("configPort") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: port, onChange: (e) => setPort(e.target.value), inputMode: "numeric" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("configRemotePort") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: remotePort, onChange: (e) => setRemotePort(e.target.value), inputMode: "numeric" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("configToken") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCfgNote", children: t("configTokenNote") })
      ] }),
      err && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCfgErr", children: err }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCfgActions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "secondary", size: "sm", className: "dshBrowserCtlCfgSave", disabled: saving === "loading", onClick: onClose, children: t("cancel") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "primary", size: "sm", className: "dshBrowserCtlCfgSave", disabled: saving === "loading", onClick: save, children: saving === "loading" ? t("saving") : saving === "done" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: Svg.check }),
          t("saved")
        ] }) : t("save") })
      ] })
    ] })
  ] });
}
function OfficialAccountCard({ t, onSaved }) {
  const [acct, setAcct] = (0, import_react.useState)(null);
  const [email, setEmail] = (0, import_react.useState)("");
  const [password, setPassword] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)("");
  const [err, setErr] = (0, import_react.useState)("");
  const [msg, setMsg] = (0, import_react.useState)("");
  const loadAcct = async () => {
    try {
      const r = await fetch("/browserctl/api/server/me", { cache: "no-store" });
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
  (0, import_react.useEffect)(() => {
    loadAcct();
  }, []);
  const restartTunnel = async () => {
    try {
      await fetch("/browserctl/api/stop", { method: "POST", cache: "no-store" });
      await new Promise((r) => setTimeout(r, 1500));
      await fetch("/browserctl/api/ensure", { method: "POST", cache: "no-store" });
      return true;
    } catch (e) {
      return false;
    }
  };
  const login = async () => {
    if (busy) return;
    setErr("");
    setMsg("");
    const em = email.trim();
    if (!em || !password) {
      setErr(t("configAcctNeedVerify") === "" ? "" : t("configAcctEmail") + " / " + t("configAcctPassword"));
      return;
    }
    setBusy("login");
    try {
      const params = new URLSearchParams({ email: em, password });
      const r = await fetch("/browserctl/api/server/login?" + params.toString(), { method: "POST", cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setErr(j.error || "HTTP " + r.status);
        setBusy("");
        return;
      }
      setAcct({ email: j.email, remotePort: j.remotePort });
      setMsg(t("configAcctLoginOk"));
      setPassword("");
      onSaved();
      const okRestart = await restartTunnel();
      if (!okRestart) {
        setErr(t("configAcctRestartFail"));
        setMsg("");
      }
      setBusy("");
    } catch (e) {
      setErr(t("configAcctLoadFail"));
      setBusy("");
    }
  };
  const register = async () => {
    if (busy) return;
    setErr("");
    setMsg("");
    const em = email.trim();
    if (!em || password.length < 8) {
      setErr(t("configAcctPassword"));
      return;
    }
    setBusy("register");
    try {
      const params = new URLSearchParams({ email: em, password });
      const r = await fetch("/browserctl/api/server/register?" + params.toString(), { method: "POST", cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setErr(j.error || "HTTP " + r.status);
      } else {
        setMsg(t("configAcctVerifySent"));
      }
      setBusy("");
    } catch (e) {
      setErr(t("configAcctLoadFail"));
      setBusy("");
    }
  };
  const logout = async () => {
    if (busy) return;
    setErr("");
    setMsg("");
    setBusy("logout");
    try {
      await fetch("/browserctl/api/server/logout", { method: "POST", cache: "no-store" });
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
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCfgFields", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlCfgFieldRow", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("configAcctTitle") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshBrowserCtlCfgAcctLine", children: [
          t("configAcctLoggedIn"),
          " \xB7 ",
          acct.email,
          Number(acct.remotePort) > 0 ? " \xB7 " + t("configAcctPort") + " " + acct.remotePort : ""
        ] })
      ] }) }),
      msg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCfgNote", children: msg }),
      err && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCfgErr", children: err }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "secondary", size: "sm", disabled: working, onClick: logout, children: busy === "logout" ? t("configAcctLoggingOut") : t("configAcctLogout") })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCfgFields", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("configAcctTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          placeholder: t("configAcctEmailPh"),
          autoComplete: "username",
          spellCheck: false
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dshBrowserCtlCfgField", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("configAcctPassword") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "password",
          value: password,
          onChange: (e) => setPassword(e.target.value),
          autoComplete: "new-password"
        }
      )
    ] }),
    msg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCfgNote", children: msg }),
    err && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dshBrowserCtlCfgErr", children: err }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlCfgFieldRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "secondary", size: "sm", disabled: working, onClick: register, children: busy === "register" ? t("configAcctWorking") : t("configAcctRegister") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "primary", size: "sm", disabled: working, onClick: login, children: busy === "login" ? t("configAcctWorking") : t("configAcctLogin") })
    ] })
  ] });
}
function BrowserCtlOverlay({ useStore, actions, t, initialTab }) {
  const open = useStore((state) => state.open);
  const [reloadToken, setReloadToken] = (0, import_react.useState)(0);
  const [copied, setCopied] = (0, import_react.useState)(false);
  const [busy, setBusy] = (0, import_react.useState)("");
  const [tab, setTab] = (0, import_react.useState)(initialTab || "connect");
  const [uses, setUses] = (0, import_react.useState)(1);
  const [aboutOpen, setAboutOpen] = (0, import_react.useState)(false);
  const [configOpen, setConfigOpen] = (0, import_react.useState)(false);
  const panel = (0, import_react.useRef)(null);
  const { data, error, expiresAt, status, refresh } = useQr(open, reloadToken, uses);
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
  const startChain = () => run("start", async () => {
    try {
      await fetch("/browserctl/api/ensure", { cache: "no-store" });
    } catch {
    }
    await new Promise((r) => setTimeout(r, 600));
    setReloadToken((x) => x + 1);
  });
  const stopChain = () => run("stop", async () => {
    try {
      await fetch("/browserctl/api/stop", { cache: "no-store" });
    } catch {
    }
    const deadline = Date.now() + 12e3;
    for (; ; ) {
      let fwd = true;
      try {
        const r = await fetch("/browserctl/api/status", { cache: "no-store" });
        const j = await r.json();
        fwd = !!j.forwarder;
      } catch {
        fwd = false;
      }
      if (!fwd) break;
      if (Date.now() >= deadline) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    await new Promise((r) => setTimeout(r, 200));
    setReloadToken((x) => x + 1);
  });
  (0, import_react.useEffect)(() => {
    if (!open) return;
    panel.current?.querySelector("button")?.focus();
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (aboutOpen) {
        setAboutOpen(false);
        return;
      }
      if (configOpen) {
        setConfigOpen(false);
        return;
      }
      if (document.querySelectorAll('[role="dialog"]').length > 1) return;
      actions.close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [actions, open, aboutOpen, configOpen]);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    let alive = true;
    const beat = () => fetch("/browserctl-gate/heartbeat", { cache: "no-store" }).catch(() => {
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
  (0, import_react.useEffect)(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);
  const gating = !!busy;
  const TABS = [
    { id: "connect", icon: "link", label: t("tabConnect") },
    { id: "devices", icon: "desk", label: t("tabDevices") },
    { id: "totp", icon: "lock", label: t("tab2fa") },
    { id: "app", icon: "phone", label: t("tabApp") },
    { id: "push", icon: "bell", label: t("tabPush") },
    { id: "ban", icon: "shield", label: t("tabBan") },
    { id: "log", icon: "clip", label: t("tabLog") }
  ];
  if (!open) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlOverlay", role: "dialog", "aria-modal": "true", "aria-label": t("tab"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dshBrowserCtlOverlayMask", type: "button", "aria-label": t("close"), onClick: () => actions.close() }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { ref: panel, className: "dshBrowserCtlPanel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "dshBrowserCtlHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: t("tab") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("subtitle") })
        ] }),
        busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11.5, color: "var(--dsw-alias-label-tertiary,#8b8f98)", whiteSpace: "nowrap" }, children: busy === "start" ? t("starting") : busy === "stop" ? t("stopping") : t("refresh") + "\u2026" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tooltip, { label: t("about"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", "aria-label": t("about"), icon: Svg.info, onClick: () => setAboutOpen(true) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tooltip, { label: t("config"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", "aria-label": t("config"), icon: Svg.gear, onClick: () => setConfigOpen(true) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tooltip, { label: t("close"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            variant: "ghost",
            size: "sm",
            "aria-label": t("close"),
            icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCloseOutlineRegular, {}),
            onClick: () => actions.close()
          }
        ) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          className: "dshBrowserCtlStatus",
          "data-ok": data ? data.forwarder === false ? "wait" : "true" : error ? "false" : "wait",
          children: [
            data ? data.forwarder === false ? t("statusTunnelStarting") : t("statusReady") : error ? t("statusNoSecret") : t("statusLoading"),
            error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: error, style: { opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: error }) : null
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlTabs", children: TABS.map((tb) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          type: "button",
          className: "dshBrowserCtlTab",
          "data-active": tab === tb.id ? "true" : "false",
          disabled: gating,
          onClick: () => setTab(tb.id),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: Svg[tb.icon] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tb.label })
          ]
        },
        tb.id
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlTabBody", children: [
        tab === "connect" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          data && data.svg ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlQrBox", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { alt: t("qrAlt"), src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data.svg) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: {
              margin: "4px 0 0",
              fontSize: 12,
              textAlign: "center",
              color: left > 0 ? "var(--dsw-alias-label-tertiary,#8b8f98)" : "var(--dsw-alias-state-error-primary,#e5655c)"
            }, children: left > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
              status && status.uses > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: "var(--dsw-alias-label-secondary,#666)" }, children: [
                t("pairUses"),
                " ",
                status.remaining,
                "/",
                status.uses,
                " \xB7 "
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                t("pairOnce"),
                " \xB7 "
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: left <= 10 ? "var(--dsw-alias-state-error-primary,#e5655c)" : "inherit" }, children: [
                t("pairLeft"),
                " ",
                left,
                "s"
              ] })
            ] }) : data.once ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("pairExpired") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("pairStatic") }) }),
            data.once ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "4px 0 0", fontSize: 11, textAlign: "center", color: "var(--dsw-alias-label-tertiary,#8b8f98)" }, children: t("pairAppTempNote") }) : null
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlQrBox", style: { height: 128 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "#666", fontSize: 12, padding: "0 14px", textAlign: "center" }, children: error ? t("statusNoSecret") : t("statusLoading") }) }),
          data && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlUrlRow", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshBrowserCtlUrl", title: data.url, children: data.url }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", onClick: () => {
              navigator.clipboard?.writeText(data.url).then(() => setCopied(true)).catch(() => {
              });
            }, children: copied ? t("copied") : t("copyLink") })
          ] }),
          data && data.grant && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlUrlRow", style: { marginTop: 6, gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary,#8b8f98)", whiteSpace: "nowrap" }, children: t("pairUsesLabel") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
                children: [1, 2, 3, 5, 10].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: n, children: n === 1 ? t("pairUsesOne") : n + " " + t("pairUsesTimes") }, n))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "ghost", size: "sm", disabled: gating, onClick: refresh, children: t("pairSwap") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IosGuideCard, { t, reloadToken }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshBrowserCtlActions", children: [
            !data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "primary", size: "sm", disabled: gating, onClick: startChain, children: busy === "start" ? t("starting") : t("startCtl") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "secondary", size: "sm", disabled: gating, onClick: refreshAll, children: busy === "refresh" ? t("refresh") + "\u2026" : t("refresh") }),
            data && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "primary", size: "sm", disabled: gating, onClick: () => window.open(data.panel || data.url, "_blank"), children: t("openPanel") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_dsh_client_ui_primitives.Button,
                {
                  variant: "secondary",
                  size: "sm",
                  disabled: gating,
                  onClick: stopChain,
                  style: { color: "var(--dsw-alias-state-error-primary,#e5655c)" },
                  children: busy === "stop" ? t("stopping") : t("stopCtl")
                }
              )
            ] })
          ] })
        ] }),
        tab === "devices" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DevicesSection, { t, reloadToken, onRefresh: () => setReloadToken((x) => x + 1), disabled: gating }),
        tab === "totp" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TotpCard, { t, reloadToken, onRefresh: () => setReloadToken((x) => x + 1), disabled: gating }),
        tab === "app" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppPairCard, { t, reloadToken }),
        tab === "push" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PushCard, { t, reloadToken }),
        tab === "ban" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlacklistCard, { t, reloadToken, disabled: gating }),
        tab === "log" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogCard, { t, reloadToken })
      ] })
    ] }),
    aboutOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AboutPanel, { t, onClose: () => setAboutOpen(false) }),
    configOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfigPanel, { t, onClose: () => setConfigOpen(false), onSaved: refreshAll })
  ] });
}
function BrowserCtlButton({ wide, useStore, actions, t }) {
  const open = useStore((state) => state.open);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tooltip, { label: t("tab"), delayMs: 500, disabled: wide, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_dsh_client_ui_primitives.Button,
    {
      variant: "ghost",
      className: "dshBrowserCtlLauncher",
      "data-wide": wide ? "true" : "false",
      "aria-label": t("tab"),
      "aria-haspopup": "dialog",
      "aria-expanded": open,
      icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CtlIcon, { size: wide ? 16 : 18 }),
      onClick: () => {
        fetch("/browserctl/api/ensure", { cache: "no-store" }).catch(() => {
        });
        actions.open();
      },
      children: wide ? t("tab") : null
    }
  ) });
}
var inject = ["slots", "locale"];
function apply(ctx) {
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
    zh: {
      tab: "DSH \u8FDC\u7A0B\u52A9\u624B",
      tabConnect: "\u8FDE\u63A5",
      tabDevices: "\u8BBE\u5907",
      tab2fa: "2FA",
      tabBan: "\u9ED1\u540D\u5355",
      tabLog: "\u65E5\u5FD7",
      tabApp: "App \u914D\u5BF9",
      tabPush: "\u63A8\u9001",
      appSubtitle: "\u624B\u673A App \u626B\u4E00\u6B21,\u4E4B\u540E\u6253\u5F00\u514D\u626B\u7801\u76F4\u8FDE",
      appQrAlt: "\u624B\u673A App \u957F\u671F\u914D\u5BF9\u4E8C\u7EF4\u7801",
      appLoading: "\u6B63\u5728\u751F\u6210\u957F\u671F\u914D\u5BF9\u7801\u2026",
      appReady: "\u957F\u671F\u914D\u5BF9\u7801\u5DF2\u751F\u6210",
      appFailed: "\u914D\u5BF9\u7801\u751F\u6210\u5931\u8D25",
      appOnceHint: "\u8FD9\u662F\u957F\u671F\u914D\u5BF9\u7801:\u624B\u673A App \u626B\u7801\u540E\u767B\u8BB0\u8BBE\u5907\u5E76\u4FDD\u5B58\u767B\u5F55\u72B6\u6001,\u4E4B\u540E\u6253\u5F00\u514D\u626B\u7801\u76F4\u8FDE\u3002\u82E5\u626B\u300C\u8FDE\u63A5\u300D\u9875\u7684\u4E00\u6B21\u6027\u4E8C\u7EF4\u7801,\u53EA\u4F1A\u83B7\u5F97 1 \u5C0F\u65F6\u4E34\u65F6\u4F1A\u8BDD,\u4E0D\u4F1A\u957F\u671F\u7ED1\u5B9A\u3002",
      appRefresh: "\u5237\u65B0\u914D\u5BF9\u7801",
      appCopyLink: "\u590D\u5236\u914D\u5BF9\u94FE\u63A5",
      appNoQr: "\u957F\u671F\u914D\u5BF9\u7801\u4E0D\u53EF\u7528",
      subtitle: "\u624B\u673A\u626B\u7801\u6216\u590D\u5236\u94FE\u63A5,\u76F4\u63A5\u6253\u5F00\u672C\u673A\u52A9\u624B\u9762\u677F",
      about: "\u5173\u4E8E",
      config: "\u914D\u7F6E",
      aboutDesc: "\u628A\u672C\u673A DeepSeek \u52A9\u624B Web \u9762\u677F\u5B89\u5168\u7A7F\u900F\u5230\u624B\u673A\u6216\u5916\u7F51\u6D4F\u89C8\u5668,\u968F\u65F6\u968F\u5730\u8FDC\u7A0B\u63A7\u5236\u3002",
      aboutWebsite: "\u5B98\u7F51",
      aboutGithub: "GitHub",
      aboutApp: "App \u4E0B\u8F7D",
      updateCheck: "\u68C0\u67E5\u66F4\u65B0",
      updateChecking: "\u68C0\u67E5\u4E2D\u2026",
      updateRecheck: "\u91CD\u65B0\u68C0\u67E5",
      updateCur: "\u5F53\u524D\u7248\u672C",
      updateLst: "\u6700\u65B0\u7248\u672C",
      updateFound: "\u53D1\u73B0\u65B0\u7248\u672C v{v}",
      updateDownload: "\u4E0B\u8F7D\u65B0\u7248\u672C",
      updateNotesTitle: "\u66F4\u65B0\u8BF4\u660E",
      updateUpToDate: "\u5DF2\u662F\u6700\u65B0\u7248\u672C",
      updateFailed: "\u66F4\u65B0\u68C0\u67E5\u5931\u8D25",
      legalTerms: "\u7528\u6237\u534F\u8BAE",
      legalPrivacy: "\u9690\u79C1\u653F\u7B56",
      legalMeta: "\u751F\u6548 {d} \xB7 \u7248\u672C {v}",
      legalAck: "\u6211\u77E5\u9053\u4E86",
      configSubtitle: "\u9009\u62E9\u8FDE\u63A5\u5B98\u65B9\u670D\u52A1\u5668\u6216\u4F60\u81EA\u5DF1\u7684 frps \u670D\u52A1\u5668",
      configOfficial: "\u5B98\u65B9\u670D\u52A1\u5668",
      configOfficialHint: "\u6CE8\u518C / \u767B\u5F55\u5B98\u65B9\u8D26\u53F7,\u5F00\u7BB1\u5373\u7528",
      configOfficialNote: "\u4F7F\u7528\u5B98\u65B9\u670D\u52A1\u5668:\u767B\u5F55(\u6216\u6CE8\u518C)\u8D26\u53F7\u540E\u81EA\u52A8\u5206\u914D\u4E13\u5C5E\u5165\u53E3,\u65E0\u9700\u624B\u5DE5\u586B\u5199\u4EFB\u4F55\u670D\u52A1\u5668\u4FE1\u606F\u3002",
      configAcctTitle: "\u5B98\u65B9\u8D26\u53F7",
      configAcctLoggedIn: "\u5DF2\u767B\u5F55",
      configAcctPort: "\u4E13\u5C5E\u7AEF\u53E3",
      configAcctLogout: "\u9000\u51FA\u767B\u5F55",
      configAcctLoggingOut: "\u9000\u51FA\u4E2D\u2026",
      configAcctLoggedOut: "\u5DF2\u9000\u51FA(\u96A7\u9053\u5C06\u65AD\u5F00,\u91CD\u65B0\u767B\u5F55\u53EF\u6062\u590D)",
      configAcctEmail: "\u90AE\u7BB1",
      configAcctEmailPh: "you@example.com",
      configAcctPassword: "\u5BC6\u7801(\u81F3\u5C11 8 \u4F4D)",
      configAcctRegister: "\u6CE8\u518C",
      configAcctLogin: "\u767B\u5F55",
      configAcctWorking: "\u5904\u7406\u4E2D\u2026",
      configAcctVerifySent: "\u9A8C\u8BC1\u90AE\u4EF6\u5DF2\u53D1\u9001,\u8BF7\u67E5\u6536\u90AE\u7BB1\u5E76\u70B9\u51FB\u9A8C\u8BC1\u94FE\u63A5;\u5B8C\u6210\u540E\u56DE\u5230\u8FD9\u91CC\u70B9\u300C\u767B\u5F55\u300D\u3002",
      configAcctLoginOk: "\u767B\u5F55\u6210\u529F,\u4E13\u5C5E\u7AEF\u53E3\u5DF2\u5E94\u7528,\u6B63\u5728\u91CD\u542F\u96A7\u9053\u2026",
      configAcctNeedVerify: "\u8BF7\u5148\u5B8C\u6210\u90AE\u7BB1\u9A8C\u8BC1(\u67E5\u6536\u9A8C\u8BC1\u90AE\u4EF6),\u518D\u767B\u5F55\u3002",
      configAcctRestartFail: "\u767B\u5F55\u6210\u529F,\u4F46\u96A7\u9053\u91CD\u542F\u5931\u8D25:\u8BF7\u70B9\u300C\u5F00\u59CB\u63A7\u5236\u300D\u624B\u52A8\u542F\u52A8\u3002",
      configAcctLoadFail: "\u5B98\u65B9\u670D\u52A1\u5668\u6682\u65F6\u4E0D\u53EF\u8FBE,\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
      configSelfhost: "\u81EA\u5EFA\u670D\u52A1\u5668",
      configSelfhostHint: "\u4F7F\u7528\u4F60\u81EA\u5DF1\u7684 frps \u670D\u52A1\u5668",
      configHost: "\u670D\u52A1\u5668\u5730\u5740 (host)",
      configHostPh: "\u4F8B\u5982 frps.example.com",
      configPort: "frps \u7AEF\u53E3",
      configRemotePort: "\u8FDC\u7A0B\u7AEF\u53E3 (\u53EF\u9009)",
      configToken: "FRP token",
      configTokenPh: "\u8F93\u5165 frps \u8BA4\u8BC1 token",
      configTokenKeep: "\u5DF2\u4FDD\u5B58(\u7559\u7A7A\u4FDD\u6301\u4E0D\u53D8)",
      configTokenNote: "Token \u4EC5\u4FDD\u5B58\u5728\u672C\u673A browserctl_secrets.json(\u5DF2\u88AB gitignore \u6392\u9664,\u4E0D\u4F1A\u63D0\u4EA4\u6216\u4E0A\u4F20)\u3002",
      configHostRequired: "\u8BF7\u586B\u5199\u670D\u52A1\u5668\u5730\u5740",
      save: "\u4FDD\u5B58",
      saving: "\u4FDD\u5B58\u4E2D\u2026",
      saved: "\u5DF2\u4FDD\u5B58",
      cancel: "\u53D6\u6D88",
      close: "\u5173\u95ED",
      startCtl: "\u5F00\u59CB\u63A7\u5236",
      starting: "\u6B63\u5728\u542F\u52A8\u96A7\u9053\u2026",
      stopCtl: "\u505C\u6B62\u63A7\u5236",
      stopping: "\u6B63\u5728\u505C\u6B62\u2026",
      copyLink: "\u590D\u5236\u94FE\u63A5",
      copied: "\u5DF2\u590D\u5236",
      refresh: "\u5237\u65B0\u4E8C\u7EF4\u7801",
      openPanel: "\u6253\u5F00\u9762\u677F",
      qrAlt: "\u914D\u5BF9\u4E8C\u7EF4\u7801",
      pairOnce: "\u4E00\u6B21\u6027\u914D\u5BF9\u94FE\u63A5",
      pairLeft: "\u5269\u4F59",
      pairExpired: '\u914D\u5BF9\u5DF2\u8FC7\u671F,\u70B9"\u5237\u65B0\u4E8C\u7EF4\u7801"\u91CD\u65B0\u751F\u6210',
      pairStatic: "\u5F15\u5BFC\u94FE\u63A5(24 \u5C0F\u65F6\u6709\u6548)",
      pairAppTempNote: "\u624B\u673A App \u626B\u6B64\u7801\u53EA\u83B7\u5F97 1 \u5C0F\u65F6\u4E34\u65F6\u4F1A\u8BDD,\u4E0D\u4F1A\u957F\u671F\u7ED1\u5B9A;\u8981\u957F\u671F\u514D\u626B\u7801\u8BF7\u7528\u300CApp \u914D\u5BF9\u300D\u9875\u7B7E\u3002",
      pairUses: "\u5DF2\u626B\u7801",
      pairUsesLabel: "\u626B\u7801\u6B21\u6570",
      pairUsesOne: "1 \u6B21(\u626B\u5B8C\u6362\u7801)",
      pairUsesTimes: "\u6B21",
      pairSwap: "\u6362\u4E00\u4E2A\u7801",
      linkTitle: "iOS / \u65E0 App \u8BBE\u5907",
      linkSubtitle: "\u7ED9\u6CA1\u6709 App \u7684\u8BBE\u5907(iPhone / iPad)\u751F\u6210\u4E00\u6761\u957F\u671F\u5F15\u5BFC\u94FE\u63A5:\u6253\u5F00\u4E00\u6B21\u5373\u514D\u9A8C\u8BC1 30 \u5929,\u518D\u300C\u6DFB\u52A0\u5230\u4E3B\u5C4F\u5E55\u300D\u5F53 App \u7528\u3002",
      linkTtlLabel: "\u94FE\u63A5\u6709\u6548\u671F",
      linkTtl1h: "1 \u5C0F\u65F6",
      linkTtl24h: "24 \u5C0F\u65F6",
      linkTtl7d: "7 \u5929",
      linkGenerate: "\u751F\u6210\u5F15\u5BFC\u94FE\u63A5",
      linkGenerating: "\u6B63\u5728\u751F\u6210\u2026",
      linkRegenerate: "\u91CD\u65B0\u751F\u6210",
      linkCopy: "\u590D\u5236\u94FE\u63A5",
      linkCopied: "\u5DF2\u590D\u5236",
      linkReady: "\u94FE\u63A5\u5DF2\u751F\u6210",
      linkQrAlt: "\u5F15\u5BFC\u94FE\u63A5\u4E8C\u7EF4\u7801",
      linkScanHint: "\u7528 iPhone \u76F8\u673A\u76F4\u63A5\u626B\u8FD9\u4E2A\u7801\u5373\u53EF\u6253\u5F00(\u4E5F\u53EF\u590D\u5236\u4E0B\u65B9\u94FE\u63A5)\u3002",
      linkExpires: "\u6709\u6548\u671F\u81F3 {t}",
      linkUsesLabel: "\u53EF\u7528\u6B21\u6570",
      linkUses1: "1 \u6B21(\u4E00\u6B21\u6027)",
      linkUses3: "3 \u6B21",
      linkUses5: "5 \u6B21",
      linkUsesUnlimited: "\u4E0D\u9650\u6B21\u6570",
      linkUsesSuffix: "\u53EF\u7528 {n} \u6B21",
      linkStepsTitle: "iPhone \u64CD\u4F5C\u6B65\u9AA4",
      linkStep1: "\u7528 Safari \u6253\u5F00\u8FD9\u6761\u94FE\u63A5\u5E76\u5B8C\u6210\u4E00\u6B21\u9A8C\u8BC1,\u8FDB\u5165\u9762\u677F(\u5730\u5740\u680F\u5E94\u4E3A /p/17901/\u2026;\u4E0D\u8981\u7528\u5FAE\u4FE1\u5185\u7F6E\u6D4F\u89C8\u5668,\u4E0D\u8981\u5F00\u65E0\u75D5\u6A21\u5F0F)",
      linkStep2: "\u5728\u9762\u677F\u9875\u9762\u4E0A\u70B9 Safari \u5E95\u90E8\u300C\u5206\u4EAB\u300D\u2192\u300C\u6DFB\u52A0\u5230\u4E3B\u5C4F\u5E55\u300D(\u4E0D\u8981\u5728\u5F15\u5BFC\u94FE\u63A5\u9875\u4E0A\u52A0:\u8FD9\u6761\u94FE\u63A5\u662F\u4E00\u6B21\u6027\u7684,\u7528\u5B8C\u5373\u5931\u6548)",
      linkStep3: "\u4ECE\u4E3B\u5C4F\u5E55\u56FE\u6807\u6253\u5F00:\u8FD9\u662F\u72EC\u7ACB\u7A97\u53E3,Cookie \u4E0E Safari \u4E92\u4E0D\u76F8\u901A,\u9700\u8981\u518D\u5B8C\u6210\u4E00\u6B21\u52A8\u6001\u7801\u9A8C\u8BC1",
      linkStep4: "\u4E4B\u540E\u70B9\u4E3B\u5C4F\u56FE\u6807 30 \u5929\u5185\u514D\u9A8C\u8BC1;Safari \u4E0E\u4E3B\u5C4F App \u5404\u81EA\u72EC\u7ACB,\u4E92\u4E0D\u5F71\u54CD",
      linkNote: "\u94FE\u63A5\u662F\u660E\u6587,\u522B\u53D1\u516C\u5F00\u7FA4;\u4ECB\u610F\u5C31\u628A\u6709\u6548\u671F\u8C03\u77ED,\u7528\u5B8C\u540E\u53EF\u300C\u91CD\u65B0\u751F\u6210\u300D\u3002",
      statusLoading: "\u6B63\u5728\u751F\u6210\u4E8C\u7EF4\u7801\u2026",
      statusReady: "\u96A7\u9053\u5C31\u7EEA,\u626B\u7801\u5373\u53EF\u6253\u5F00\u9762\u677F",
      statusTunnelStarting: "\u96A7\u9053\u6B63\u5728\u5EFA\u7ACB,\u8BF7\u7A0D\u5019\u51E0\u79D2\u540E\u5237\u65B0\u4E8C\u7EF4\u7801",
      statusNoSecret: '\u96A7\u9053\u672A\u5C31\u7EEA:\u70B9\u4E0B\u65B9"\u5F00\u59CB\u63A7\u5236"\u542F\u52A8\u672C\u673A\u7A7F\u900F,\u51E0\u79D2\u540E\u81EA\u52A8\u51FA\u4E8C\u7EF4\u7801',
      totpTitle: "\u4E24\u6B65\u9A8C\u8BC1 (2FA)",
      totpOn: "\u5DF2\u542F\u7528",
      totpOff: "\u672A\u542F\u7528",
      totpHint: "\u542F\u7528\u540E,\u6240\u6709\u8BBE\u5907\u6253\u5F00\u9762\u677F\u524D\u5FC5\u987B\u5148\u8F93\u5165\u9A8C\u8BC1\u5668 6 \u4F4D\u52A8\u6001\u7801(RFC 6238);\u8FDE\u9519 5 \u6B21\u51BB\u7ED3 15 \u5206\u949F,\u540C\u7801\u9632\u91CD\u653E\u3002\u7ED1\u5B9A\u65B9\u5F0F:\u7528\u624B\u673A\u9A8C\u8BC1\u5668\u626B\u63CF\u4E0B\u65B9\u4E8C\u7EF4\u7801\u6216\u624B\u52A8\u8F93\u5165\u5BC6\u94A5\u3002",
      totpHintShort: "\u5F00\u542F\u540E,\u624B\u673A\u6253\u5F00\u9762\u677F\u9700\u5148\u8F93\u5165\u9A8C\u8BC1\u5668 6 \u4F4D\u52A8\u6001\u7801;\u8FDE\u9519 5 \u6B21\u51BB\u7ED3 15 \u5206\u949F\u3002",
      totpBind: "2FA \u7ED1\u5B9A\u4E8C\u7EF4\u7801",
      totpSecretLabel: "\u5BC6\u94A5(\u624B\u52A8\u8F93\u5165\u7528)",
      totpEnable: "\u542F\u7528 2FA",
      totpDisable: "\u7981\u7528 2FA",
      totpReset: "\u91CD\u7F6E\u5BC6\u94A5",
      totpKick: "\u5168\u90E8\u8E22\u4E0B\u7EBF",
      devicesTitle: "\u5728\u7EBF\u8BBE\u5907",
      devicesOnline: "\u5728\u7EBF {n} \u53F0",
      noDevices: "\u6682\u65E0\u5DF2\u9A8C\u8BC1\u8BBE\u5907",
      noOnlineDevices: "\u5F53\u524D\u6CA1\u6709\u8BBE\u5907\u5728\u7EBF",
      noDevicesHint: "\u624B\u673A\u626B\u7801\u6253\u5F00\u9762\u677F\u5E76\u901A\u8FC7\u52A8\u6001\u7801\u9A8C\u8BC1\u540E,\u8BBE\u5907\u4F1A\u663E\u793A\u5728\u8FD9\u91CC;\u672C\u673A\u76F4\u5F00\u7684\u9762\u677F\u4E0D\u8BA1\u5165\u3002",
      deviceSeen: "\u6D3B\u8DC3:",
      deviceKick: "\u8E22\u4E0B\u7EBF",
      copySecret: "\u590D\u5236\u5BC6\u94A5",
      logTitle: "\u8FD0\u884C\u65E5\u5FD7",
      logEmpty: "\u6682\u65E0\u65E5\u5FD7\u3002\u8BBE\u5907\u9A8C\u8BC1\u3001\u8E22\u4E0B\u7EBF\u30012FA \u5F00\u5173\u90FD\u4F1A\u8BB0\u5F55\u5728\u8FD9\u91CC\u3002",
      banTitle: "IP \u9ED1\u540D\u5355",
      banEmpty: "\u6682\u65E0\u88AB\u5C01\u7981\u7684 IP \u5730\u5740\u3002\u5728\u8BBE\u5907\u5217\u8868\u70B9\u201C\u62C9\u9ED1\u201D\u53EF\u6DFB\u52A0\u3002",
      pushTitle: "\u6D88\u606F\u63A8\u9001",
      pushDesc: "\u628A\u8BBE\u5907\u8FDE\u5165\u3001\u88AB\u8E22\u3001\u9ED1\u540D\u5355\u30012FA\u3001\u914D\u5BF9\u7B49\u5B89\u5168\u4E8B\u4EF6,\u4EE5\u53CA\u7CFB\u7EDF\u6D88\u606F\u5B9E\u65F6\u63A8\u9001\u5230\u4F60\u7684\u624B\u673A\u3002",
      pushOn: "\u5DF2\u5F00\u542F",
      pushOff: "\u672A\u5F00\u542F",
      pushEnabledLabel: "\u63A5\u6536\u624B\u673A\u63A8\u9001",
      pushEnabledHint: "\u603B\u5F00\u5173:\u5F00\u542F\u540E\u624B\u673A\u53EF\u6536\u5230\u672C\u673A\u9762\u677F\u7684\u63A8\u9001\u6D88\u606F",
      pushSystemLabel: "\u7CFB\u7EDF\u5B89\u5168\u4E8B\u4EF6",
      pushSystemHint: "\u8BBE\u5907\u8FDE\u5165 / \u88AB\u8E22 / \u9ED1\u540D\u5355 / 2FA / \u914D\u5BF9",
      pushTest: "\u53D1\u9001\u6D4B\u8BD5\u63A8\u9001",
      pushTesting: "\u53D1\u9001\u4E2D\u2026",
      pushTestTitle: "\u6D4B\u8BD5\u63A8\u9001",
      pushTestBody: "\u8FD9\u662F\u4E00\u6761\u6765\u81EA DSH \u8FDC\u7A0B\u52A9\u624B\u7684\u6D4B\u8BD5\u63A8\u9001\u6D88\u606F",
      pushTestOk: "\u6D4B\u8BD5\u63A8\u9001\u5DF2\u53D1\u9001",
      pushTestFail: "\u6D4B\u8BD5\u63A8\u9001\u53D1\u9001\u5931\u8D25",
      pushSaveFailed: "\u8BBE\u7F6E\u4FDD\u5B58\u5931\u8D25",
      pushRecent: "\u6700\u8FD1\u63A8\u9001",
      pushRefresh: "\u5237\u65B0",
      pushRefreshing: "\u5237\u65B0\u4E2D\u2026",
      pushEmpty: "\u6682\u65E0\u63A8\u9001\u3002\u5F00\u542F\u63A8\u9001\u540E,\u5B89\u5168\u4E8B\u4EF6\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002",
      pushPollFailed: "\u8BFB\u53D6\u63A8\u9001\u914D\u7F6E\u5931\u8D25",
      pushKindTest: "\u6D4B\u8BD5",
      pushKindVerify: "\u9A8C\u8BC1",
      pushKindKick: "\u8E22\u4E0B\u7EBF",
      pushKindBan: "\u9ED1\u540D\u5355",
      pushKindTotp: "2FA",
      pushKindPair: "\u914D\u5BF9",
      pushKindJoin: "\u8BBE\u5907\u8FDE\u5165",
      pushKindDev: "\u8BBE\u5907"
    },
    en: {
      tab: "DshRemote",
      tabConnect: "Connect",
      tabDevices: "Devices",
      tab2fa: "2FA",
      tabBan: "Blacklist",
      tabLog: "Log",
      tabApp: "App Pairing",
      tabPush: "Push",
      appSubtitle: "Scan once to pair; the app reconnects without scanning",
      appQrAlt: "Long-term pairing QR code",
      appLoading: "Generating long-term pairing code\u2026",
      appReady: "Long-term pairing code ready",
      appFailed: "Failed to generate pairing code",
      appOnceHint: 'This is a long-term pairing code: the app registers the device and saves its login, then reconnects without scanning. Scanning the one-time QR on the "Connect" tab only grants a 1-hour temporary session, not a persistent binding.',
      appRefresh: "Refresh pairing code",
      appCopyLink: "Copy pairing link",
      appNoQr: "Long-term pairing code unavailable",
      subtitle: "Scan or copy the link to open this panel from any device",
      about: "About",
      config: "Settings",
      aboutDesc: "Securely tunnel this DeepSeek assistant web panel to your phone or any browser for remote control, anywhere.",
      aboutWebsite: "Website",
      aboutGithub: "GitHub",
      aboutApp: "App Download",
      updateCheck: "Check for updates",
      updateChecking: "Checking\u2026",
      updateRecheck: "Check again",
      updateCur: "Current version",
      updateLst: "Latest version",
      updateFound: "New version v{v} available",
      updateDownload: "Download",
      updateNotesTitle: "Release notes",
      updateUpToDate: "You are up to date",
      updateFailed: "Update check failed",
      legalTerms: "User Agreement",
      legalPrivacy: "Privacy Policy",
      legalMeta: "Effective {d} \xB7 Version {v}",
      legalAck: "Got it",
      configSubtitle: "Connect to the official server or your own frps server",
      configOfficial: "Official server",
      configOfficialHint: "Register / sign in to your official account \u2014 works out of the box",
      configOfficialNote: "Official server: sign in (or register) and a dedicated entry is assigned automatically \u2014 no server details to fill in.",
      configAcctTitle: "Official account",
      configAcctLoggedIn: "Signed in",
      configAcctPort: "Dedicated port",
      configAcctLogout: "Sign out",
      configAcctLoggingOut: "Signing out\u2026",
      configAcctLoggedOut: "Signed out (tunnel will disconnect; sign in again to restore)",
      configAcctEmail: "Email",
      configAcctEmailPh: "you@example.com",
      configAcctPassword: "Password (min 8 chars)",
      configAcctRegister: "Register",
      configAcctLogin: "Sign in",
      configAcctWorking: "Working\u2026",
      configAcctVerifySent: "Verification email sent. Open the link in your inbox, then come back and sign in.",
      configAcctLoginOk: "Signed in \u2014 dedicated port applied, restarting tunnel\u2026",
      configAcctNeedVerify: "Please verify your email first (check your inbox), then sign in.",
      configAcctRestartFail: 'Signed in, but tunnel restart failed: press "Start" to launch it manually.',
      configAcctLoadFail: "Official server unreachable, please try again later.",
      configSelfhost: "Self-hosted server",
      configSelfhostHint: "Use your own frps server",
      configHost: "Server address (host)",
      configHostPh: "e.g. frps.example.com",
      configPort: "frps port",
      configRemotePort: "Remote port (optional)",
      configToken: "FRP token",
      configTokenPh: "Enter the frps auth token",
      configTokenKeep: "Saved (leave blank to keep)",
      configTokenNote: "Token is stored only in local browserctl_secrets.json (gitignored, never committed or uploaded).",
      configHostRequired: "Server address is required",
      save: "Save",
      saving: "Saving\u2026",
      saved: "Saved",
      cancel: "Cancel",
      close: "Close",
      startCtl: "Start control",
      starting: "Starting tunnel\u2026",
      stopCtl: "Stop control",
      stopping: "Stopping\u2026",
      copyLink: "Copy link",
      copied: "Copied",
      refresh: "Refresh QR",
      openPanel: "Open panel",
      qrAlt: "Pairing QR code",
      pairOnce: "One-time pairing link",
      pairLeft: "expires in",
      pairExpired: "Pairing expired \u2014 refresh to generate a new one",
      pairStatic: "Bootstrap link (valid for 24 hours)",
      pairAppTempNote: 'Scanning this code with the app grants only a 1-hour temporary session; for long-term pairing use the "App pairing" tab.',
      pairUses: "used",
      pairUsesLabel: "Uses",
      pairUsesOne: "1 use (rotate after scan)",
      pairUsesTimes: "uses",
      pairSwap: "New code",
      linkTitle: "iOS / No-App devices",
      linkSubtitle: 'Generate a long-lived bootstrap link for devices without the app (iPhone / iPad): open it once to skip verification for 30 days, then "Add to Home Screen" to use it like an app.',
      linkTtlLabel: "Link validity",
      linkTtl1h: "1 hour",
      linkTtl24h: "24 hours",
      linkTtl7d: "7 days",
      linkGenerate: "Generate link",
      linkGenerating: "Generating\u2026",
      linkRegenerate: "Regenerate",
      linkCopy: "Copy link",
      linkCopied: "Copied",
      linkReady: "Link ready",
      linkQrAlt: "Bootstrap link QR code",
      linkScanHint: "Scan this code with the iPhone camera to open it (or copy the link below).",
      linkExpires: "Valid until {t}",
      linkUsesLabel: "Max uses",
      linkUses1: "1 (single use)",
      linkUses3: "3 times",
      linkUses5: "5 times",
      linkUsesUnlimited: "Unlimited",
      linkUsesSuffix: "{n} use(s)",
      linkStepsTitle: "iPhone steps",
      linkStep1: "Open the link in Safari and verify once to enter the panel (address bar should show /p/17901/\u2026; not WeChat in-app browser, not private mode)",
      linkStep2: 'On the panel page, tap Share \u2192 "Add to Home Screen" (never on the invite page itself: that link is one-time and dies after first use)',
      linkStep3: "Open the home-screen icon: it is a standalone window with storage separate from Safari, so verify once more there",
      linkStep4: "Launching from the icon stays verification-free for 30 days; Safari and the home-screen app are independent",
      linkNote: "The link is plain text \u2014 don't post it publicly; shorten the validity if concerned, and regenerate after use.",
      statusLoading: "Generating QR code\u2026",
      statusReady: "Tunnel ready \u2014 scan to open the panel",
      statusTunnelStarting: "Tunnel starting; refresh the QR in a few seconds",
      statusNoSecret: 'Tunnel not ready: click "Start control" below, QR appears in a few seconds',
      totpTitle: "Two-Factor Auth (2FA)",
      totpOn: "Enabled",
      totpOff: "Disabled",
      totpHint: "When enabled, every device must pass a 6-digit authenticator code (RFC 6238) before opening the panel; 5 wrong tries lock for 15 minutes; replayed codes are rejected.",
      totpHintShort: "Devices must enter a 6-digit code to open the panel; 5 wrong tries lock for 15 minutes.",
      totpBind: "2FA binding QR code",
      totpSecretLabel: "Secret (manual entry)",
      totpEnable: "Enable 2FA",
      totpDisable: "Disable 2FA",
      totpReset: "Reset secret",
      totpKick: "Kick all devices",
      devicesTitle: "Online devices",
      devicesOnline: "{n} online",
      noDevices: "No verified devices yet",
      noOnlineDevices: "No devices online right now",
      noDevicesHint: "Devices appear here after opening the panel via the QR link and passing the 2FA code; locally opened panels are not counted.",
      deviceSeen: "Active:",
      deviceKick: "Kick",
      copySecret: "Copy secret",
      logTitle: "Event log",
      logEmpty: "No events yet. Device verifications, kicks and 2FA toggles are recorded here.",
      banTitle: "IP Blacklist",
      banEmpty: 'No banned IPs. Click "Ban" on a device to add.',
      pushTitle: "Push Notifications",
      pushDesc: "Realtime push of security events \u2014 device connect / kick / blacklist / 2FA / pairing \u2014 plus system messages to your phone.",
      pushOn: "On",
      pushOff: "Off",
      pushEnabledLabel: "Receive phone push",
      pushEnabledHint: "Master switch: receive push from this panel on your phone",
      pushSystemLabel: "Security events",
      pushSystemHint: "Device connect / kick / blacklist / 2FA / pairing",
      pushTest: "Send test push",
      pushTesting: "Sending\u2026",
      pushTestTitle: "Test push",
      pushTestBody: "This is a test push from DSH Remote Assistant",
      pushTestOk: "Test push sent",
      pushTestFail: "Failed to send test push",
      pushSaveFailed: "Failed to save settings",
      pushRecent: "Recent pushes",
      pushRefresh: "Refresh",
      pushRefreshing: "Refreshing\u2026",
      pushEmpty: "No pushes yet. Security events will appear here once push is enabled.",
      pushPollFailed: "Failed to load push config",
      pushKindTest: "Test",
      pushKindVerify: "Verify",
      pushKindKick: "Kick",
      pushKindBan: "Ban",
      pushKindTotp: "2FA",
      pushKindPair: "Pair",
      pushKindJoin: "Connect",
      pushKindDev: "Device"
    }
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
