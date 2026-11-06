import { useEffect, useRef, useState } from 'react'
import { Button, IconCloseOutlineRegular, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import { defineStore } from '@deepseek-ai/dsh-client-store'

const NS = 'browserctl'
const STYLE_ID = 'browserctl/styles'

// 插件版本号(「关于」面板展示)
const VERSION = '0.2.0'
// 「关于」面板三个外部链接,集中一处管理,日后发布一次改齐
const ABOUT_LINKS = {
  website: 'https://remote.ymzcc.com/dsh-remote/',
  github: 'https://github.com/Memorial-coder/dsh-remote-plugin',
  app: 'https://github.com/Memorial-coder/dsh-remote-plugin/releases/latest',
}

// ---------- API 路径前缀(远程访问适配) ----------
// 面板不只跑在本机(127.0.0.1:<dsh端口>),还会被手机/外网浏览器经隧道访问,页面带路径前缀:
//   /p/<port>/...            → nginx 多用户块(按端口查 registry 验签后转发闸机)
//   /dsh-remote/p/<uid>/...  → 官网服务端 uid 稳定代理(按 uid 解析当前端口转发)
// 本插件所有 fetch 都是绝对路径('/browserctl/api/*'、'/browserctl-gate/*'),不加前缀会
// 落到域名根路径的静态反代 location(proxy_pass 指向生成时的固定端口)→ 端口一变就 502,
// 表现为「桌面正常、扫码进远控端后面板全部接口 502」。所以请求统一带上页面自身的前缀。
function apiPrefix() {
  try {
    const p = String((typeof location !== 'undefined' && location.pathname) || '')
    let m = /^\/p\/(1[6-9]\d{4})(?=\/|$)/.exec(p)
    if (m) return '/p/' + m[1]
    m = /^\/dsh-remote\/p\/([a-z0-9]{8,32})(?=\/|$)/.exec(p)
    if (m) return '/dsh-remote/p/' + m[1]
  } catch {}
  return '' // 本机直连(桌面)无前缀
}
const API_P = apiPrefix()

// ---------- 用户协议 / 隐私政策(「关于」面板内点击展开,参照桃源乡 legalDocuments 结构) ----------
const LEGAL_VERSION = '2026-11-01'
const LEGAL_EFFECTIVE = '2026年11月1日'
const LEGAL_AGE = '本工具仅面向年满 18 周岁的用户'

const LEGAL_TERMS = {
  id: 'terms',
  title: '用户协议',
  subtitle: `更新生效日期：${LEGAL_EFFECTIVE}。凡安装、使用本插件/面板（DSH 远程助手），通过手机或外网浏览器远程访问本机 DeepSeek 助手面板，即视为您已完整阅读、理解并同意本协议全部条款。`,
  sections: [
    {
      title: '适用对象与效力声明',
      paragraphs: [
        '本协议适用于所有安装、启动、使用本插件/面板、通过手机或外网浏览器远程访问本机面板、参与测试与反馈的全部用户。',
        '凡下载、安装、使用本工具、开启隧道、扫码或通过链接远程访问本机面板，即视为您已完整阅读、逐条理解、自愿同意并接受本协议全部条款，并自行承担全部使用风险。',
        '若您不同意本协议任意条款，请立即停止安装与使用，并卸载相关插件、清除本地配置。',
        LEGAL_AGE + '。您确认使用本服务时已年满 18 周岁；若未满 18 周岁，请立即停止使用。',
      ],
    },
    {
      title: '第一章 总则',
      paragraphs: [
        '1.1 服务定位。本工具（DSH 远程助手，含浏览器控制插件、本机闸机与配套 App）为个人独立开发的公益免费远程协助工具，用于把本机 DeepSeek 助手 Web 面板通过加密隧道安全穿透到手机或外网浏览器，实现随时随地远程控制，无任何商业上架资质与强制收费。',
        '1.2 使用前提。远程访问依赖网络、frp 隧道与本机闸机服务，存在波动与中断的可能；不同终端、浏览器可用功能可能存在差异，以您实际使用的版本界面为准。',
        '1.3 协议组成。本《用户协议》与《隐私政策》共同构成完整约定；就特定功能（如 2FA、配对、黑名单、推送）另有页面提示或规则的，构成补充约定，补充约定与本协议冲突时，就该功能以更具体的补充约定为准。',
        '1.4 收费说明。本服务目前完全免费，不收取任何费用，也没有付费解锁、会员订阅或内购项目。若未来因运营成本调整收费方式，我们会提前在面板内显著公告并征得您的同意，您可以在此之前继续免费使用或停止使用。',
      ],
    },
    {
      title: '第二章 服务使用规范与用户义务',
      paragraphs: [
        '2.1 授权访问。您仅可为本人或经您明确授权的设备、人员提供远程访问。严禁将配对二维码、引导链接、登录 Cookie、访问口令分享、转售给未授权第三方。',
        '2.2 禁止行为。严禁对服务实施反向代理、抓包封装、破解或绕过鉴权与签名校验、恶意高频请求、漏洞扫描、流量攻击、批量爬取等破坏性行为；严禁利用本工具从事任何违法违规活动。',
        '2.3 凭据保管。配对链接、引导链接、Cookie 与动态验证码属于敏感凭据，请妥善保管，勿截图长期留档、勿发公开群。因您泄露凭据导致的未授权访问，由您自行承担。',
        '2.4 2FA 使用。开启两步验证后，所有设备访问前需输入验证器 6 位动态码；请勿将动态码告知他人。',
        '2.5 内容合规。本工具用于访问 AI 助手面板，请勿利用其生成、传播违法违规、暴力、色情、侵权或损害他人权益的内容。',
        '2.6 开源与非商业。本项目遵循开源许可发布，允许个人学习、非商用使用与合规二创；禁止一切未经授权的商业用途、抹除署名的二次分发与转售。',
      ],
    },
    {
      title: '第三章 安全机制与设备管理',
      paragraphs: [
        '3.1 身份验证。访问面板采用「设备信任 + 可选 TOTP 两步验证（RFC 6238）」机制；连错 5 次冻结 15 分钟，同码防重放。',
        '3.2 会话与 Cookie。验证通过后签发有效期为 30 天的 bc-gate 记忆 Cookie，用于免验证直连；您可随时通过面板「踢下线」或「全部踢下线」使指定设备或全部设备重新认证。',
        '3.3 设备登记。验证通过的设备会记录匿名设备标识、IP、User-Agent 等必要信息用于会话与风控；您可在面板查看在线/历史设备，并拉黑指定 IP。',
        '3.4 引导链接。为无 App 设备生成的引导链接为明文，请在有效期内使用并按需控制有效期；介意风险的请用后轮换。',
      ],
    },
    {
      title: '第四章 免责声明与责任限制',
      paragraphs: [
        '4.1 本工具以「现状提供」为原则，为个人独立公益开发，不保证服务零中断、零故障、全终端兼容；因网络波动、隧道中断、设备故障、系统更新导致的访问异常，开发方在能力范围内尽力恢复，但不作绝对承诺。',
        '4.2 远程访问本身存在安全风险（如设备被他人物理接触、系统被入侵、网络被监听）。请您确保本机与设备的系统、密码、密钥安全；因本机或设备安全失守导致的损失由您自行承担。',
        '4.3 本服务目前完全免费，我们不向您收取任何费用。在法律允许的最大范围内，开发方对任何间接、附带、后果性损害不承担责任；因本服务引起争议需承担责任的，责任上限以您就相关事项向开发方实际支付的费用为限（目前为 0），法律法规另有强制规定的除外。',
        '4.4 第三方资源（如 frps 服务器、云基础设施、隧道服务）由相应第三方提供，其故障与政策变化不构成本方违约。',
      ],
    },
    {
      title: '第五章 违规处理与争议解决',
      paragraphs: [
        '5.1 对违反本协议、破坏服务安全或损害他人权益的用户，开发方有权采取阻断访问、封禁 IP/设备、限制功能、踢出全部会话等措施。',
        '5.2 争议协商优先；协商不成，适用中华人民共和国现行有效法律，并向开发方所在地有管辖权的人民法院提起诉讼。',
        '5.3 条款独立性：本协议任意条款被认定为无效、不可执行的，不影响其余条款的效力。',
      ],
    },
    {
      title: '第六章 协议修订与生效',
      paragraphs: [
        '6.1 本协议将根据法律法规、产品迭代与安全需要适时修订，修订后的版本在面板「关于」内公布；对您权益产生重大影响的变更将显著提示。',
        '6.2 继续使用即视为接受修订后的协议；不同意者可停止使用并清除本地数据。',
        '6.3 本协议最终解释权归开发方所有（法律法规另有强制规定的除外）。',
      ],
    },
  ],
}

const LEGAL_PRIVACY = {
  id: 'privacy',
  title: '隐私政策',
  subtitle: `更新生效日期：${LEGAL_EFFECTIVE}。适用产品：DSH 远程助手（浏览器控制插件、本机闸机、配套 App 及网页面板）。本政策与《用户协议》一并适用，请重点阅读与信息收集、Cookie、共享、权利行使相关的条款。`,
  sections: [
    {
      title: '前言',
      paragraphs: [
        'DSH 远程助手开发方（以下简称「我们」）承诺保护使用本工具之用户（以下统称「您」）的个人信息和隐私安全。本工具为个人独立公益开发，坚持最小必要、自愿授权、非强制收集、禁止将数据用于商业变现的原则。',
        '本服务目前完全免费，不向您收取任何费用；正因为不收费，我们更不会以出售、出租或商业变现您的个人信息作为收入来源。',
        '适用法规依据包括但不限于《中华人民共和国个人信息保护法》《中华人民共和国网络安全法》及相关监管规范。',
        LEGAL_AGE + '。',
      ],
    },
    {
      title: '特别提示',
      paragraphs: [
        '1. 本政策与《用户协议》同时对您产生效力；同类条款不一致时，就个人信息处理事项以本政策为准，其余以《用户协议》为准。',
        '2. 只有当您开启远程访问、配对、推送等功能时，为实现该功能我们才会处理对应信息；不开启相关功能则不处理对应的个人信息。',
        '3. 使用前请仔细阅读本政策。若您不同意，请立即停止访问/使用。',
        '4. 本政策目录：一、适用范围；二、我们如何收集和使用信息；三、Cookie 与同类技术；四、共享、转移或公开；五、存储与保护；六、您的权利；七、未成年人保护；八、修订和通知；九、如何联系我们。',
      ],
    },
    {
      title: '一、适用范围',
      paragraphs: [
        '本政策适用于本机闸机、浏览器控制插件、配套 App、网页面板及随技术发展出现的新形态。',
        '本政策不适用于第三方独立运营的服务（如 frps 服务器商、云基础设施、您自行配置的隧道服务等），该等服务适用其各自规则。',
      ],
    },
    {
      title: '二、我们如何收集和使用您的个人信息',
      paragraphs: [
        '（一）远程访问与设备验证',
        '1. 当您通过手机或外网浏览器访问面板时，本机闸机会在本地记录必要信息：访问 IP 地址、设备标识（客户端生成的匿名 devid）、User-Agent、访问时间与验证事件，用于设备信任、会话管理、异常识别与安全审计。',
        '2. 开启 2FA 后，验证过程仅在本机完成动态码比对（TOTP），验证码不对第三方传输。',
        '3. 配对二维码与引导链接由本机生成，用于一次性/限时授权，不在服务端留存明文凭据。',
        '（二）安全与风控',
        '1. 为识别异常登录、暴力破解、接口滥用与攻击，可能记录访问时间序列、请求来源、失败次数、IP 黑名单等，并采取限流、冻结、封禁等措施。',
        '2. 黑名单与踢出记录用于安全处置，保存于本机，不用于商业画像。',
        '（三）推送（可选）',
        '仅当您开启推送时，安全事件（设备连入、被踢、黑名单、2FA、配对）与系统消息才会经本机闸机转送至您的手机；关闭后不再处理。',
        '（四）日志与诊断',
        '为排查故障，本机保存运行日志（不含密钥）；日志仅用于技术维护与服务优化。',
        '（五）原则声明',
        '我们不收集：真实姓名、身份证号、通讯录、短信、通话记录、精确地理位置、银行卡与支付流水；不以广告追踪或商业变现为目的收集个人信息。',
      ],
    },
    {
      title: '三、Cookie 与同类技术',
      paragraphs: [
        '我们可能通过 Cookie、localStorage 或同类技术保存必要状态：登录/会话状态（如 30 天 bc-gate 记忆 Cookie）、设置项、协议同意记录、本地配对状态。',
        '我们不会将 Cookie 用于本政策所述目的之外的用途，不用于跨站广告追踪或与真实身份信息不当关联。',
        '您可通过浏览器或系统设置拒绝、管理或删除 Cookie 与本地存储；停用后可能需要重新验证或重新同意协议，部分功能可能无法正常使用。',
      ],
    },
    {
      title: '四、共享、转移或公开',
      paragraphs: [
        '我们仅在合法、正当、必要范围内处理信息，不以商业广告投放或个性化推送为目的向第三方共享您的个人信息。',
        '为实现服务可能使用第三方基础设施（云服务器、隧道服务、邮件等），我们会评估其必要性并要求其采取保护措施。',
        '仅在下述情形下公开信息：依您要求并取得单独同意；依法或应执法机关要求；为保护您或他人生命财产安全所必需。',
        '对已匿名化且无法复原识别的信息，其共享/转移/公开不视为个人信息对外提供。',
      ],
    },
    {
      title: '五、存储与保护',
      paragraphs: [
        '（一）存储',
        '本地记录（会话、设备、事件、黑名单、日志）保存在您本机，随本机清理、卸载或删除而移除；在线运行态数据仅在服务运行期间存在，不做商业用途。',
        '（二）保护',
        '1. 传输采用加密隧道（HTTPS/frp），签名采用 HMAC-SHA256 校验，密钥以受限文件权限存储，不写入公开仓库。',
        '2. 最小化授权接触数据的人员并要求保密；发生安全事件时立即处置并按需通知。',
        '3. 互联网并非绝对安全。请妥善保管设备、配对链接、Cookie 与验证码；发现泄露请立即通过面板踢出会话并轮换密钥。',
      ],
    },
    {
      title: '六、您的权利',
      paragraphs: [
        '（一）查阅与控制：您可在面板查看在线/历史设备，主动踢出设备、拉黑 IP、全部踢下线。',
        '（二）撤回同意：您可通过关闭推送、关闭 2FA、停止服务、卸载插件/App、清除本地数据等方式撤回授权。',
        '（三）删除：本地会话、事件与设备记录可随踢出与清理删除；清除站点数据即清除本地 Cookie 与设置。',
        '（四）响应与例外：对重复、超范围或滥用权利的不合理请求，可依法拒绝或收取成本费用；法律另有规定的从其规定。',
      ],
    },
    {
      title: '七、未成年人保护',
      paragraphs: [
        LEGAL_AGE + '，不面向未成年人提供服务，我们不以面向未成年人的方式收集其信息。',
        '若您是未成年人，请立即停止使用；监护人发现未成年人使用的，可通过下方渠道联系我们，我们将在核实后删除相关数据或采取限制措施。',
      ],
    },
    {
      title: '八、修订和通知',
      paragraphs: [
        '我们可能根据产品更新及法律法规适时修改本政策，并在面板「关于」内公布；重大变更将显著提示。',
        '若您不同意变更，请停止使用；继续使用即视为知悉并接受更新后的政策。',
        '如需将信息用于本政策未载明的其他用途，或额外收集未提及的信息，将另行征得同意。',
      ],
    },
    {
      title: '九、如何联系我们',
      paragraphs: [
        '如您对本政策或个人信息保护有任何疑问、投诉或建议，请通过面板「关于」中的联系方式或官方渠道与我们联系，我们将在核验身份后于十五个工作日内回复。',
        '如对我们的回复不满意，可向消费者权益保护部门投诉或向有管辖权的人民法院提起诉讼。',
        '本隐私政策最终解释权归开发方所有（法律法规另有强制规定的除外）。',
      ],
    },
  ],
}

const css = `
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
/* 宽屏两栏(左:二维码/链接/操作  右:2FA/在线设备);窄屏自动堆叠 */
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
/* 左列:占满网格整行高度,垂直居中(扩展开启时与右列等高,不偏左上) */
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
/* 异步操作(启动/停止隧道等)的转圈加载指示:跟随当前文字颜色,放进按钮/状态栏/占位框 */
.dshBrowserCtlSpinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid rgba(128,128,128,.35);
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
  color: var(--dsw-alias-label-secondary, #a6aab2);
  font-size: 13px;
  padding: 0 14px;
  text-align: center;
}
/* 顶部功能页签:连接 / 设备 / 2FA / 黑名单 / 日志,一次只显示一个功能区 */
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
/* 卡片头部描述文字(图二:卡片下方一小行灰色说明) */
.dshBrowserCtlCardDesc {
  margin: 0;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, #8b8f98);
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
/* 高内容卡片(二维码 + 设备/推送列表):450px 会把底部列表裁掉且无法滚动。
   放宽到 2400px,内容超高时由外层 TabBody 负责滚动,不再藏内容。 */
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
/* 在线设备:独立可滚动区,始终可见(对齐 Claude 遥控的设备表) */
.dshBrowserCtlDevicesCard {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 12px;
}

/* App 配对页签:已配对手机列表 */
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
/* 历史在线设备:现在在线 / 历史在线两组 */
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
/* 运行日志:可折叠,最多显示一屏,内部滚动 */
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
  color: var(--dsw-alias-label-secondary, #a6aab2);
}
/* flex 列滚动容器必须禁子元素收缩,否则内容会被压扁而不是滚动 */
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
.dshBrowserCtlCfgOauthCode {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 2px;
  font-family: ui-monospace, Consolas, Menlo, monospace;
  text-align: center;
  padding: 12px 8px;
  border: 1px dashed var(--dsw-alias-border-l2, #2a2c33);
  border-radius: 10px;
  color: var(--dsw-alias-state-info-primary, #4da3ff);
  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.03));
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
/* loading 态:隐藏旋钮,轨道内转圈 */
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
/* 测试推送按钮:42px 三态 */
.dshBrowserCtlPushBtn {
  height: 42px !important;
  margin: 4px 0 !important;
  min-width: 128px;
}
/* 最近推送列表 */
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
`

function installStyles() {
  const existing = document.querySelector(`style[data-plugin="${STYLE_ID}"]`)
  if (existing !== null) return () => {}
  const style = document.createElement('style')
  style.dataset.plugin = STYLE_ID
  style.textContent = css
  document.head.append(style)
  return () => { style.remove() }
}

function CtlIcon({ size = 16 }) {
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

function useQr(open, reloadToken, uses) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [expiresAt, setExpiresAt] = useState(0) // >0 表示一次性配对,按秒倒数
  const [status, setStatus] = useState(null)    // { uses, remaining } 配对码剩余次数
  const [refreshTick, setRefreshTick] = useState(0)
  const usesRef = useRef(uses)
  usesRef.current = uses || 1
  // 生成配对码(闸机不可达时回退长期链接)
  useEffect(() => {
    if (!open) return
    let alive = true
    setError(null)
    async function load() {
      try {
        const r = await fetch(API_P + '/browserctl/api/pair?uses=' + usesRef.current, { method: 'POST', cache: 'no-store' })
        const tx = await r.text()
        let j
        try { j = JSON.parse(tx) } catch { throw new Error('路由未加载(HTTP ' + r.status + ');请重启 DSH 后重试') }
        if (j.error) throw new Error(j.error)
        if (!alive) return
        setError(null)
        setData(j)
        setStatus({ uses: j.uses || 1, remaining: j.remaining || 1 })
        setExpiresAt(Date.now() + (j.ttl || 60) * 1000)
        return
      } catch (e1) {
        try {
          const r2 = await fetch(API_P + '/browserctl/api/qr', { cache: 'no-store' })
          const tx2 = await r2.text()
          let j2
          try { j2 = JSON.parse(tx2) } catch { throw new Error('路由未加载(HTTP ' + r2.status + ');请重启 DSH 后重试') }
          if (!alive) return
          if (j2.error) {
            // 闸机不可达:清掉旧二维码,让"开始控制"按钮出现,避免停止后只剩"停止控制"卡死
            setData(null)
            setError(j2.error)
          } else {
            setError(null)
            setData(j2)
            setExpiresAt(0)
          }
        } catch (e2) {
          if (alive) {
            setData(null)
            setError(String((e2 && e2.message) || e2))
          }
        }
      }
    }
    load()
    return () => { alive = false }
  }, [open, reloadToken, refreshTick, uses])
  // 轮询配对码状态:检测到有人扫码(剩余次数减少)→ 用尽自动换码
  useEffect(() => {
    if (!open || !data || !data.grant) return
    let alive = true
    const tick = async () => {
      try {
        const r = await fetch(API_P + '/browserctl/api/pair-status?g=' + encodeURIComponent(data.grant), { cache: 'no-store' })
        const j = await r.json()
        if (!alive || !j || !j.ok) return
        const remaining = j.exists ? (j.remaining | 0) : 0
        setStatus({ uses: j.uses || data.uses || 1, remaining })
        if (remaining <= 0) setRefreshTick(x => x + 1) // 用尽(或一次性码被扫)→ 自动换新码
      } catch {}
    }
    tick()
    const id = setInterval(tick, 1500)
    return () => { alive = false; clearInterval(id) }
  }, [open, data])
  return { data, error, expiresAt, status, refresh: () => setRefreshTick(x => x + 1) }
}

function useCountdown(expiresAt) {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (!expiresAt) { setLeft(0); return }
    const tick = () => setLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  return left
}

/* ---------- 内联 SVG 图标（替代 emoji，保持跨平台一致渲染） ---------- */
const svgProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
                   stroke: 'currentColor', strokeWidth: 1.8,
                   strokeLinecap: 'round', strokeLinejoin: 'round',
                   style: { verticalAlign: '-2px', marginRight: 3, flex: 'none' } }
const Svg = {
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
}

function fmtPlatform(ua) {
  const u = (ua || '').toLowerCase()
  if (!u) return 'unknown'
  if (/iphone|ipad|ios/.test(u)) return 'iOS'
  if (/android/.test(u)) return 'Android'
  if (/windows|win64|win32/.test(u)) return 'Windows'
  if (/macintosh|mac os/.test(u)) return 'macOS'
  if (/linux/.test(u)) return 'Linux'
  if (/curl|wget|python|httpclient|okhttp/.test(u)) return '脚本/API'
  return '浏览器'
}

function DevicesSection({ t, reloadToken, onRefresh, disabled }) {
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(true) // 在线设备默认展开,方便直接看到/踢设备
  const [histOpen, setHistOpen] = useState(true) // 历史在线设备默认展开
  const [busy, setBusy] = useState(false)
  const [kicking, setKicking] = useState(null)
  const [kickMsg, setKickMsg] = useState('')
  const [banning, setBanning] = useState(null)
  const [banMsg, setBanMsg] = useState('')
  const [banOk, setBanOk] = useState(true)
  const anyBusy = disabled || busy
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl/api/totp', { cache: 'no-store' })
      .then(r => r.text().then(tx => { try { return JSON.parse(tx) } catch { return { error: 'HTTP ' + r.status } } }))
      .then(j => { if (alive) setData(j) })
      .catch(() => {})
    return () => { alive = false }
  }, [reloadToken])
  // 心跳保活已上移到面板根(BrowserCtlOverlay):任意页签打开都算在线,
  // 否则切到别的页签 10 分钟后设备会被误判为"离线"。
  useEffect(() => { if (!kickMsg) return; const id = setTimeout(() => setKickMsg(''), 2200); return () => clearTimeout(id) }, [kickMsg])
  useEffect(() => { if (!banMsg) return; const id = setTimeout(() => setBanMsg(''), 2200); return () => clearTimeout(id) }, [banMsg])

  const sessions = Array.isArray(data?.sessions) ? data.sessions : []
  const devices = Array.isArray(data?.devices) ? data.devices : []

  // "在线"判定以会话最近活动时间(ts)为准,不看 registry 的 online 标记 ——
  // 2FA 开启时会话会保留 30 天,标记在线只代表"受信任",不代表"此刻连着"。
  // 面板每 2 分钟心跳一次,超过 10 分钟没有活动就算离线。
  const nowSec = Date.now() / 1000
  const isFresh = ts => !!ts && (nowSec - ts) < 600
  const groupKey = (ip, name) => (ip || '') + '\u0000' + (name || '')
  const devByKey = new Map(devices.map(d => [d.key, d]))
  const onlineSessions = sessions.filter(s => isFresh(s.ts || s.since))
  const onlineGroups = new Set(onlineSessions.map(s => groupKey(s.ip, s.name)))
  // "在线 X 分钟"要算的是"这一轮连续在线了多久":
  // 会话的 since 是首次验证时间(2FA 下能保留 30 天),重启闸机后复用的老会话会显示成
  // "在线 19 小时";设备档案的 online_since 才是本次真正上线的时间点,优先用它。
  const onlineSince = (s) => {
    const d = devByKey.get(s.devid || s.dev)
    const since = (d && d.online_since) || 0
    return since > 0 ? since : s.since
  }
  // 历史设备:按 (ip, name) 聚合成一台(退出重扫不算新设备),并排除当前在线的那几台,
  // 避免和上面的"在线设备"卡片重复统计。
  const histMap = new Map()
  for (const d of devices) {
    const g = groupKey(d.ip, d.name)
    if (onlineGroups.has(g)) continue
    const prev = histMap.get(g)
    if (!prev || (d.last_seen || 0) > (prev.last_seen || 0)) histMap.set(g, d)
  }
  const historical = [...histMap.values()].sort((a, b) => (b.last_seen || 0) - (a.last_seen || 0))

  function fmtWhen(ts) {
    if (!ts) return ''
    const mins = Math.max(0, Math.round((Date.now() - ts * 1000) / 60000))
    if (mins < 1) return '刚刚'
    if (mins < 60) return mins + ' 分钟前'
    const hrs = Math.round(mins / 60)
    if (hrs < 24) return hrs + ' 小时前'
    return Math.round(hrs / 24) + ' 天前'
  }

  function fmtOnline(since) {
    if (!since) return ''
    const mins = Math.max(0, Math.round((Date.now() - since * 1000) / 60000))
    if (mins < 1) return '不到 1 分钟'
    if (mins < 60) return mins + ' 分钟'
    const hrs = Math.round(mins / 60)
    if (hrs < 24) return hrs + ' 小时'
    const days = Math.round(hrs / 24)
    return days + ' 天'
  }

  function fmtDuration(ms) {
    if (!ms || ms < 0) return ''
    const totalSec = Math.round(ms / 1000)
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    if (mins < 1) return secs + ' 秒'
    const hrs = Math.floor(mins / 60)
    const remainMins = mins % 60
    if (hrs < 1) return mins + ' 分钟'
    if (hrs < 24) return hrs + ' 小时 ' + remainMins + ' 分钟'
    const days = Math.floor(hrs / 24)
    return days + ' 天 ' + (hrs % 24) + ' 小时'
  }

  async function kick(dev) {
    setBusy(true)
    setKicking(dev || 'all')
    setKickMsg('')
    // 本地面板 DSH 会排空请求体 + 无 bc-gate cookie:优先闸机端点(公网面板可用),
    // 失败回退插件本地端点(参数走查询串,绕开 body 被排空的问题)。
    const body = JSON.stringify(dev ? { dev } : {})
    try {
      let r = await fetch(dev ? API_P + '/browserctl-gate/kick' : API_P + '/browserctl-gate/kick-all', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      }).catch(() => null)
      if (!r || !r.ok) {
        const q = dev ? '?dev=' + encodeURIComponent(dev) : ''
        r = await fetch(API_P + '/browserctl/api/totp-kick' + q, { cache: 'no-store' }).catch(() => null)
      }
      if (r && r.ok) {
        setKickMsg(dev ? '已踢出设备' : '全部踢下线成功')
        // 乐观更新:立即从列表移除;等闸机落盘(约 1.5s)后再拉取同步,
        // 避免立即刷新把尚未处理完的设备又读回来(闪动)。
        setData(d => {
          if (!d) return d
          const list = Array.isArray(d.sessions) ? d.sessions : []
          return { ...d, sessions: dev ? list.filter(s => s.dev !== dev) : [] }
        })
        setTimeout(() => onRefresh(), 1500)
      } else {
        setKickMsg('踢出失败')
      }
    } catch {
      setKickMsg('网络错误')
    } finally {
      setBusy(false)
      setKicking(null)
    }
  }

  async function ban(dev, ip, name) {
    if (!dev && !ip) return
    setBusy(true)
    setBanning(dev || ip || '')
    setBanMsg('')
    try {
      // 与解禁同思路:闸机端点失败时回退插件本地端点(查询串参数)
      let r = await fetch(API_P + '/browserctl-gate/blacklist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dev, ip, name: name || '未知', reason: '管理员封禁' }),
      }).catch(() => null)
      if (!r || !r.ok) {
        const q = new URLSearchParams({ dev: dev || '', ip: ip || '', name: name || '未知', reason: '管理员封禁' }).toString()
        r = await fetch(API_P + '/browserctl/api/blacklist-add?' + q, { cache: 'no-store' }).catch(() => null)
      }
      const ok = !!(r && r.ok)
      setBanOk(ok)
      setBanMsg(ok ? ('已拉黑 ' + (name || ip || '')) : '拉黑失败')
      onRefresh()
    } catch {
      setBanOk(false)
      setBanMsg('网络错误')
    } finally {
      setBusy(false)
      setBanning(null)
    }
  }

  // 2FA 关闭时也要能看到在线设备(踢下线/拉黑照常可用)
  if (!data) return null

  return (
    <div className="dshBrowserCtlCard" data-busy={anyBusy ? 'true' : 'false'}>
      <button type="button" className="dshBrowserCtlCardHead" data-open={open ? 'true' : 'false'} onClick={() => setOpen(o => !o)}>
        {Svg.desk}
        <span>{t('devicesTitle')}</span>
        <span className="dshBrowserCtlCardStat" style={{ color: onlineSessions.length ? 'var(--dsw-alias-label-primary,inherit)' : 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {t('devicesOnline').replace('{n}', onlineSessions.length)}
        </span>
        <span className="dshBrowserCtlCardArrow" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div className="dshBrowserCtlCardBody" data-open={open}>
        <p className="dshBrowserCtlCardDesc">{t('noDevicesHint')}</p>
        {onlineSessions.length === 0 ? (
          <div className="dshBrowserCtlDevEmpty">{t('noOnlineDevices')}</div>
        ) : (
          <div className="dshBrowserCtlDevBody">
            {onlineSessions.map(s => (
              <div key={s.dev} className="dshBrowserCtlDevTable">
                <div className="dshBrowserCtlDevInfo">
                  <div className="dshBrowserCtlDevTop">
                    <span className="dshBrowserCtlDevPlatform" title={s.ua || ''}>{s.name || fmtPlatform(s.ua)}</span>
                    <KindTag item={s} />
                    <span className="dshBrowserCtlDevSeen">
                      <span className="dshBrowserCtlHistDot" data-on="true"><i />在线 {fmtOnline(onlineSince(s))}</span>
                    </span>
                  </div>
                  <div className="dshBrowserCtlDevIp">{s.ip || 'unknown'}{s.loc ? <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 10 }}>{s.loc}</span> : null}</div>
                </div>
                <div className="dshBrowserCtlDevActions">
                  <Button variant="ghost" size="sm" disabled={anyBusy} onClick={() => kick(s.dev)}>
                    {kicking === s.dev ? '踢出中…' : t('deviceKick')}
                  </Button>
                  <Button variant="ghost" size="sm" disabled={anyBusy} onClick={() => ban(s.dev, s.ip, s.name)}>
                    {banning === s.dev ? '拉黑中…' : <>{Svg.shield} 拉黑</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {sessions.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <Button variant="secondary" size="sm" disabled={anyBusy} onClick={() => kick(null)}>
              {kicking === 'all' ? '踢出中…' : t('totpKick')}
            </Button>
          </div>
        )}
        {kickMsg && (
          <div style={{ textAlign:'center', fontSize:12, color:'var(--dsw-alias-state-success-primary,#34b371)', padding:'4px 0 0' }}>
            {kickMsg}
          </div>
        )}
      </div>
      {/* ---- 历史在线设备:只列"当前不在线"的设备,按 (ip,name) 聚合成一台 ---- */}
      {devices.length > 0 && (
        <div className="dshBrowserCtlCard" data-busy={anyBusy ? 'true' : 'false'} style={{ marginTop: 2 }}>
          <button type="button" className="dshBrowserCtlCardHead" data-open={histOpen ? 'true' : 'false'} onClick={() => setHistOpen(o => !o)}>
            {Svg.desk}
            <span>{'历史在线设备'}</span>
            <span className="dshBrowserCtlCardStat" style={{ color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
              共 {historical.length} 台
            </span>
            <span className="dshBrowserCtlCardArrow" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          <div className="dshBrowserCtlCardBody" data-open={histOpen}>
            {historical.length === 0 ? (
              <div className="dshBrowserCtlDevEmpty">{'暂无历史设备'}</div>
            ) : (
              <div className="dshBrowserCtlDevBody">
                {historical.map(d => (
                  <div key={d.key} className="dshBrowserCtlDevTable">
                    <div className="dshBrowserCtlDevInfo">
                      <div className="dshBrowserCtlDevTop">
                        <span className="dshBrowserCtlDevPlatform" title={d.ua || ''}>
                          {d.name || '未知设备'}
                        </span>
                        <KindTag item={d} />
                        <span className="dshBrowserCtlDevSeen">
                          <span className="dshBrowserCtlHistDot" data-on="false">
                            <i />{fmtAgoLong(d.last_seen) + '在线'}
                          </span>
                        </span>
                      </div>
                      <div className="dshBrowserCtlDevIp">
                        {d.ip || 'unknown'}
                        {d.loc ? <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 10 }}>{d.loc}</span> : null}
                        <span style={{ color: 'var(--dsw-alias-label-tertiary,#8b8f98)', fontSize: 10 }}>
                          {' · 已连 ' + (d.times || 1) + ' 次'}
                          {(d.total_online || 0) > 0 ? ' · 累计 ' + fmtDuration(d.total_online * 1000) : ''}
                        </span>
                      </div>
                    </div>
                    <div className="dshBrowserCtlDevActions">
                      <Button variant="ghost" size="sm" disabled={anyBusy} onClick={() => ban(d.key, d.ip, d.name)}>
                        {banning === d.key ? '拉黑中…' : <>{Svg.shield} 拉黑</>}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {banMsg && (
        <div style={{ textAlign:'center', fontSize:12, color: banOk ? 'var(--dsw-alias-state-success-primary,#34b371)' : 'var(--dsw-alias-state-warning-primary,#d08030)', padding:'2px 0 0' }}>
          {banMsg}
        </div>
      )}
    </div>
  )
}

const LOG_ICON = { verify: 'check', kick: 'ban', totp: 'lock', ban: 'shield' }

/* ---- 日志行图标(SVG 代替 emoji) ---- */
const LogIcon = ({ typ }) => {
  const props = { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', style: { flex: 'none' } }
  const color = 'currentColor'
  switch (typ) {
    case 'verify':
      return <svg {...props}><circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.2"/><path d="M5 8.5l2 2 4-4.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'kick':
      return <svg {...props}><circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.2"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/></svg>
    case 'totp':
      return <svg {...props}><rect x="4.5" y="7" width="7" height="6" rx="1.5" stroke={color} strokeWidth="1.2"/><path d="M5.5 7V4.5a2.5 2.5 0 015 0V7" stroke={color} strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="9.5" r="1" fill={color}/></svg>
    case 'ban':
      return <svg {...props}><path d="M3 5.5V8c0 2.8 2 5.2 5 6 3-.8 5-3.2 5-6V5.5L8 3l-5 2.5z" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/><path d="M6 8.5l1.5 1.5 3-3" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    default:
      return <span style={{ width: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>·</span>
  }
}

function fmtClock(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const p = n => String(n).padStart(2, '0')
  return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
}

function LogCard({ t, reloadToken }) {
  const [open, setOpen] = useState(true) // 独立页签内默认展开
  const [events, setEvents] = useState(null)
  useEffect(() => {
    let alive = true
    // 优先闸机端点(公网面板同源可达,无需 DSH 重启);本机直开面板回退到插件 API。
    fetch(API_P + '/browserctl-gate/events', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(j => { if (alive) setEvents(Array.isArray(j.events) ? j.events : []) })
      .catch(() => fetch(API_P + '/browserctl/api/totp', { cache: 'no-store' })
        .then(r => r.json())
        .then(j => { if (alive) setEvents(Array.isArray(j.events) ? j.events : []) })
        .catch(() => { if (alive) setEvents([]) }))
    return () => { alive = false }
  }, [reloadToken])
  const list = (events || []).slice().reverse()

  return (
    <div className="dshBrowserCtlCard">
      <button
        type="button"
        className="dshBrowserCtlCardHead"
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen(o => !o)}
      >
        {Svg.clip}
        <span>{t('logTitle')}</span>
        <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {list.length ? list.length + ' 条' : '暂无'}
        </span>
        <span className="dshBrowserCtlCardArrow" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div className="dshBrowserCtlCardBody" data-open={open}>
        {list.length === 0 ? (
          <div className="dshBrowserCtlDevEmpty">{t('logEmpty')}</div>
        ) : (
          <div className="dshBrowserCtlLogBody">
            {list.map((e, i) => (
              <div key={i} className="dshBrowserCtlLogRow">
                <span className="dshBrowserCtlLogType"><LogIcon typ={e.typ} /></span>
                <span className="dshBrowserCtlLogMsg" title={e.msg || ''}>{e.msg || ''}</span>
                <span className="dshBrowserCtlLogTime">{fmtClock(e.t)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BlacklistCard({ t, reloadToken, disabled }) {
  const [open, setOpen] = useState(true) // 独立页签内默认展开
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const anyBusy = disabled || busy
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl-gate/blacklist', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => { if (alive) setData(Array.isArray(j.blacklist) ? j.blacklist : []) })
      .catch(() => { if (alive) setData([]) })
    return () => { alive = false }
  }, [reloadToken])
  const list = data || []
  async function unban(ip) {
    setBusy(true)
    try {
      // 本地面板无 bc-gate cookie + DSH 排空请求体:闸机端点失败时回退插件本地端点(查询串参数)
      let r = await fetch(API_P + '/browserctl-gate/blacklist/remove', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ip }),
      }).catch(() => null)
      if (!r || !r.ok) {
        r = await fetch(API_P + '/browserctl/api/blacklist-remove?ip=' + encodeURIComponent(ip), { cache: 'no-store' })
          .catch(() => null)
      }
      if (r && r.ok) setData(d => (d || []).filter(x => x.ip !== ip))
    } catch {} finally {
      setBusy(false)
    }
  }
  return (
    <div className="dshBrowserCtlCard" data-busy={anyBusy ? 'true' : 'false'}>
      <button type="button" className="dshBrowserCtlCardHead" data-open={open ? 'true' : 'false'} onClick={() => setOpen(o => !o)}>
        {Svg.shield}
        <span>{t('banTitle')}</span>
        <span className="dshBrowserCtlCardStat" style={{ color: list.length ? 'var(--dsw-alias-label-primary,inherit)' : 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {list.length ? list.length + ' 个' : '无'}
        </span>
        <span className="dshBrowserCtlCardArrow" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div className="dshBrowserCtlCardBody" data-open={open}>
        {list.length === 0 ? (
          <div className="dshBrowserCtlDevEmpty">{t('banEmpty')}</div>
        ) : (
          <div className="dshBrowserCtlBanBody">
            {list.map((r, i) => (
              <div key={i} className="dshBrowserCtlBanRow">
                <span className="dshBrowserCtlBanInfo" title={r.ip}>
                  <span style={{ color: 'var(--dsw-alias-label-primary,inherit)', fontWeight: 500 }}>{r.name || 'unknown'}</span>
                  {' '}
                  <span style={{ color: 'var(--dsw-alias-label-secondary,#a6aab2)' }}>{r.ip}</span>
                  <span className="dshBrowserCtlBanReason">{r.reason ? ' · ' + r.reason : ''}</span>
                </span>
                <Button variant="ghost" size="sm" disabled={anyBusy} onClick={() => unban(r.ip)}>解禁</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AppPairCard({ t, reloadToken }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(true)
  const [sessions, setSessions] = useState([])
  const [webCount, setWebCount] = useState(0)
  const [kicking, setKicking] = useState(null)
  const [kickMsg, setKickMsg] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await fetch(API_P + '/browserctl/api/pair-long', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setData({ error: (j && j.error) || ('HTTP ' + r.status) })
        return
      }
      if (!j.url || !j.svg) {
        setData({ error: (j && j.error) || '配对码响应不完整' })
        return
      }
      setData(j)
    } catch (e) {
      setData({ error: String((e && e.message) || e) })
    } finally {
      setLoading(false)
    }
  }

  // 轮询长期配对码状态:检测到有人扫码(剩余次数用尽) → 自动换新码
  useEffect(() => {
    if (!data || !data.grant) return
    let alive = true
    const tick = async () => {
      try {
        const r = await fetch(API_P + '/browserctl/api/pair-status?g=' + encodeURIComponent(data.grant), { cache: 'no-store' })
        const j = await r.json()
        if (!alive || !j || !j.ok) return
        const remaining = j.exists ? (j.remaining | 0) : 0
        if (remaining <= 0) load()
      } catch {}
    }
    tick()
    const id = setInterval(tick, 1500)
    return () => { alive = false; clearInterval(id) }
  }, [data])

  async function loadDevices() {
    try {
      const r = await fetch(API_P + '/browserctl/api/totp', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      const list = Array.isArray(j?.sessions) ? j.sessions : []
      // 只显示通过「App 配对」绑定的手机（kind=app;旧会话没 kind,按名字兜底）
      setSessions(list.filter(s => kindOf(s) === 'app'))
      setWebCount(list.filter(s => kindOf(s) === 'web').length)
    } catch {}
  }

  async function kick(dev) {
    setKicking(dev)
    setKickMsg('')
    const body = JSON.stringify({ dev })
    try {
      // 两个请求都必须带超时:否则闸机偶尔持锁做 SSH 清理时第一个 fetch 会
      // 长时间挂起,按钮永远停在「解除中…」(实测踩过,没有 finally 重置的机会)。
      // 用 AbortController 而非 AbortSignal.timeout(后者 Chrome 103+ 才有,兼容旧 WebView)
      const ac1 = new AbortController()
      const t1 = setTimeout(() => ac1.abort(), 8000)
      let r = await fetch(API_P + '/browserctl-gate/kick', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: ac1.signal,
      }).catch(() => null).finally(() => clearTimeout(t1))
      if (!r || !r.ok) {
        const ac2 = new AbortController()
        const t2 = setTimeout(() => ac2.abort(), 8000)
        r = await fetch(API_P + '/browserctl/api/totp-kick?dev=' + encodeURIComponent(dev), { cache: 'no-store', signal: ac2.signal }).catch(() => null).finally(() => clearTimeout(t2))
      }
      if (r && r.ok) {
        setKickMsg('已解除该设备配对')
        setSessions(list => list.filter(s => s.dev !== dev))
        // 同步踢出(闸机直调)返回时 sessions.json 已更新,1.2s 后重拉只是确认;
        // 若闸机此刻不可达走了 state 队列兜底,巡检 ≤2s 才消费,2.5s 再补拉一次
        setTimeout(loadDevices, 1200)
        setTimeout(loadDevices, 2500)
      } else {
        setKickMsg('解除失败')
      }
    } catch {
      setKickMsg('网络错误')
    } finally {
      setKicking(null)
    }
  }

  useEffect(() => { load(); loadDevices() }, [reloadToken])
  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(id)
  }, [copied])
  useEffect(() => {
    if (!kickMsg) return
    const id = setTimeout(() => setKickMsg(''), 2400)
    return () => clearTimeout(id)
  }, [kickMsg])

  const ok = !!(data && data.url && !data.error)

  return (
    <div className="dshBrowserCtlCard">
      <button
        type="button"
        className="dshBrowserCtlCardHead"
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen(o => !o)}
      >
        {Svg.phone}
        <span>{t('tabApp')}</span>
        <span style={{
          fontWeight: 500,
          fontSize: 12,
          color: ok ? 'var(--dsw-alias-state-success-primary,#34b371)' : 'var(--dsw-alias-label-tertiary,#8b8f98)',
        }}>{ok ? t('appReady') : (loading ? '…' : t('appNoQr'))}</span>
        <span className="dshBrowserCtlCardArrow" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div className="dshBrowserCtlCardBody dshBrowserCtlCardBodyTall" data-open={open}>
        <p className="dshBrowserCtlCardDesc">{t('appSubtitle')}</p>
        {ok ? (
          <>
            <div className="dshBrowserCtlQrBox">
              {data.svg
                ? <img alt={t('appQrAlt')} src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data.svg)} />
                : <span style={{ color: '#666', fontSize: 12 }}>{t('appNoQr')}</span>}
            </div>
            <p className="dshBrowserCtlCardDesc" style={{ textAlign: 'center' }}>{t('appOnceHint')}</p>
            <div className="dshBrowserCtlUrlRow">
              <div className="dshBrowserCtlUrl" title={data.url}>{data.url}</div>
              <Button variant="ghost" size="sm" onClick={() => {
                navigator.clipboard?.writeText(data.url).then(() => setCopied(true)).catch(() => {})
              }}>{copied ? t('copied') : t('appCopyLink')}</Button>
            </div>
          </>
        ) : (
          <div className="dshBrowserCtlQrBox" style={{ height: 120 }}>
            <span style={{ color: '#666', fontSize: 12, padding: '0 14px', textAlign: 'center' }}>
              {loading ? t('appLoading') : (data && data.error) || t('appNoQr')}
            </span>
          </div>
        )}
        <div className="dshBrowserCtlActions">
          <Button variant="secondary" size="sm" disabled={loading} onClick={load}>
            {loading ? '…' : t('appRefresh')}
          </Button>
        </div>

        {/* 已配对手机列表 */}
        <div className="dshBrowserCtlPairedList">
          <div className="dshBrowserCtlPairedHead">
            <span>已配对的手机</span>
            <span className="dshBrowserCtlPairedCount">{sessions.length}</span>
          </div>
          {sessions.length === 0 ? (
            <div className="dshBrowserCtlPairedEmpty">还没有手机通过扫码配对</div>
          ) : (
            sessions.map(s => (
              <div key={s.dev} className="dshBrowserCtlPairedRow">
                <div className="dshBrowserCtlPairedInfo">
                  <div className="dshBrowserCtlPairedNameRow">
                    <div className="dshBrowserCtlPairedName">{s.name || '手机 App'}</div>
                    <KindTag item={s} />
                  </div>
                  <div className="dshBrowserCtlPairedMeta">
                    {s.ip || 'unknown'}{s.ts ? ' · ' + fmtAgo(s.ts) : ''}
                  </div>
                </div>
                <Button variant="ghost" size="sm" disabled={kicking === s.dev}
                  onClick={() => kick(s.dev)}>
                  {kicking === s.dev ? '解除中…' : '解除配对'}
                </Button>
              </div>
            ))
          )}
          {webCount > 0 && (
            <div className="dshBrowserCtlPairedEmpty" style={{ paddingTop: 2 }}>
              另有 {webCount} 个网页登录会话（浏览器打开，未长期绑定），在「设备」页签查看/踢出
            </div>
          )}
          {kickMsg && (
            <div className="dshBrowserCtlPairedMsg">{kickMsg}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function fmtAgo(ts) {
  if (!ts) return ''
  const mins = Math.max(0, Math.round((Date.now() - ts * 1000) / 60000))
  if (mins < 1) return '刚刚'
  if (mins < 60) return mins + ' 分钟前'
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return hrs + ' 小时前'
  return Math.round(hrs / 24) + ' 天前'
}

/* 设备来源:kind=app(扫码长期配对的 App)/web(浏览器登录)。旧会话/旧设备档案没有
   kind 字段,按名字兜底(App 的名字都以 DSH Remote 开头或叫 手机 App)。 */
function kindOf(s) {
  if (s && s.kind) return s.kind
  const n = (s && s.name) || ''
  return n.indexOf('DSH Remote') === 0 || n === '手机 App' ? 'app' : 'web'
}

function KindTag({ item }) {
  const k = kindOf(item)
  return <span className="dshBrowserCtlKindTag" data-kind={k}>{k === 'app' ? 'App' : '网页'}</span>
}

// 更细的"多久以前":小时带分钟("2 小时 5 分钟前"),给历史设备行用,
// 拼上"在线"就是"2 小时 5 分钟前在线"。
function fmtAgoLong(ts) {
  if (!ts) return ''
  const mins = Math.max(0, Math.round((Date.now() - ts * 1000) / 60000))
  if (mins < 1) return '刚刚'
  if (mins < 60) return mins + ' 分钟前'
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  if (hrs < 24) return hrs + ' 小时' + (rem ? ' ' + rem + ' 分钟' : '') + '前'
  const days = Math.floor(hrs / 24)
  const remH = hrs % 24
  return days + ' 天' + (remH ? ' ' + remH + ' 小时' : '') + '前'
}

/* ---------- 「iOS / 无 App 设备」引导链接卡片 ---------- */
function fmtLinkExpiry(exp) {
  const d = new Date(Number(exp) * 1000)
  if (!exp || Number.isNaN(d.getTime())) return ''
  const p = n => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function IosGuideCard({ t, reloadToken }) {
  const [open, setOpen] = useState(false) // 默认收起，让「连接」页签初始不溢出；头部常驻并显示生成状态
  const [ttl, setTtl] = useState(86400)
  const [uses, setUses] = useState(1) // 1=一次性(默认)；0=不限次数
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [bump, setBump] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    fetch(API_P + '/browserctl/api/link?ttl=' + ttl + '&uses=' + uses, { cache: 'no-store' })
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!alive) return
        if (!r.ok || !j.url) {
          setData(null)
          setError(j.error || ('HTTP ' + r.status))
          return
        }
        setData(j)
      })
      .catch(e => {
        if (!alive) return
        setData(null)
        setError(String((e && e.message) || e))
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [ttl, uses, bump, reloadToken])

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(id)
  }, [copied])

  const ok = !!(data && data.url)
  const expText = ok ? fmtLinkExpiry(data.exp) : ''
  return (
    <div className="dshBrowserCtlCard" style={{ marginTop: 10 }}>
      <button
        type="button"
        className="dshBrowserCtlCardHead"
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen(o => !o)}
      >
        {Svg.iphone}
        <span>{t('linkTitle')}</span>
        <span className="dshBrowserCtlCardStat" style={{
          color: ok ? 'var(--dsw-alias-state-success-primary,#34b371)' : 'var(--dsw-alias-label-tertiary,#8b8f98)',
        }}>{ok ? t('linkReady') : (loading ? '…' : '')}</span>
        <span className="dshBrowserCtlCardArrow" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div className="dshBrowserCtlCardBody dshBrowserCtlCardBodyTall" data-open={open}>
        <p className="dshBrowserCtlCardDesc">{t('linkSubtitle')}</p>
        {ok && data.svg && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <div className="dshBrowserCtlQrBox">
              <img
                alt={t('linkQrAlt')}
                style={{ width: 200, height: 200 }}
                src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data.svg)}
              />
            </div>
            <p className="dshBrowserCtlCardDesc" style={{ margin: 0, textAlign: 'center' }}>{t('linkScanHint')}</p>
          </div>
        )}
        <div className="dshBrowserCtlUrlRow" style={{ marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)', whiteSpace: 'nowrap' }}>{t('linkTtlLabel')}</span>
          <select
            value={ttl}
            disabled={loading}
            onChange={e => setTtl(parseInt(e.target.value, 10) || 86400)}
            style={{
              fontSize: 12, padding: '2px 4px', borderRadius: 6,
              border: '1px solid rgba(128,128,128,.35)', background: 'transparent',
              color: 'inherit', flex: 'none',
            }}
          >
            <option value={3600}>{t('linkTtl1h')}</option>
            <option value={86400}>{t('linkTtl24h')}</option>
            <option value={604800}>{t('linkTtl7d')}</option>
          </select>
          <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)', whiteSpace: 'nowrap' }}>{t('linkUsesLabel')}</span>
          <select
            value={uses}
            disabled={loading}
            onChange={e => setUses(parseInt(e.target.value, 10) || 0)}
            style={{
              fontSize: 12, padding: '2px 4px', borderRadius: 6,
              border: '1px solid rgba(128,128,128,.35)', background: 'transparent',
              color: 'inherit', flex: 'none',
            }}
          >
            <option value={1}>{t('linkUses1')}</option>
            <option value={3}>{t('linkUses3')}</option>
            <option value={5}>{t('linkUses5')}</option>
            <option value={0}>{t('linkUsesUnlimited')}</option>
          </select>
          <Button variant="secondary" size="sm" disabled={loading} onClick={() => setBump(x => x + 1)}>
            {loading ? t('linkGenerating') : (ok ? t('linkRegenerate') : t('linkGenerate'))}
          </Button>
        </div>
        {ok && (
          <>
            <div className="dshBrowserCtlUrlRow" style={{ marginTop: 6 }}>
              <div className="dshBrowserCtlUrl" title={data.url}>{data.url}</div>
              <Button variant="ghost" size="sm" onClick={() => {
                navigator.clipboard?.writeText(data.url).then(() => setCopied(true)).catch(() => {})
              }}>{copied ? t('linkCopied') : t('linkCopy')}</Button>
            </div>
            {expText && (
              <p className="dshBrowserCtlCardDesc" style={{ marginTop: 4 }}>
                {t('linkExpires').replace('{t}', expText)}
                {' · '}
                {data.uses ? t('linkUsesSuffix').replace('{n}', String(data.uses)) : t('linkUsesUnlimited')}
              </p>
            )}
          </>
        )}
        {error && (
          <p className="dshBrowserCtlCardDesc" style={{ marginTop: 4, color: 'var(--dsw-alias-state-error-primary,#e5655c)' }}>
            {error}
          </p>
        )}
        <p className="dshBrowserCtlCardDesc" style={{ marginTop: 10, fontWeight: 500, color: 'var(--dsw-alias-label-secondary,#a6aab2)' }}>{t('linkStepsTitle')}</p>
        <ol style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 11.5, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          <li>{t('linkStep1')}</li>
          <li>{t('linkStep2')}</li>
          <li>{t('linkStep3')}</li>
          <li>{t('linkStep4')}</li>
        </ol>
        <p className="dshBrowserCtlCardDesc" style={{ marginTop: 8 }}>{t('linkNote')}</p>
      </div>
    </div>
  )
}

function TotpCard({ t, reloadToken, onRefresh, disabled }) {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(true) // 独立页签内默认展开
  const anyBusy = disabled || busy
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl/api/totp', { cache: 'no-store' })
      .then(r => r.text().then(tx => { try { return JSON.parse(tx) } catch { return { error: 'HTTP ' + r.status } } }))
      .then(j => { if (alive) setData(j) })
      .catch(() => {})
    return () => { alive = false }
  }, [reloadToken])

  async function toggle(enable, reset) {
    setBusy(true)
    try {
      // DSH webServer 排空请求体:参数走查询串
      const q = new URLSearchParams({ enabled: enable ? '1' : '0', reset: reset ? '1' : '0' }).toString()
      const r = await fetch(API_P + '/browserctl/api/totp-toggle?' + q, { cache: 'no-store' })
      let j = {}
      try { j = await r.json() } catch { j = { ok: false, error: 'HTTP ' + r.status } }
      if (j.ok) onRefresh()
      else if (j.error) setData(d => ({ ...d, error: j.error }))
    } finally {
      setBusy(false)
    }
  }

  async function kick(dev) {
    setBusy(true)
    try {
      const q = dev ? '?dev=' + encodeURIComponent(dev) : ''
      await fetch(API_P + '/browserctl/api/totp-kick' + q, { cache: 'no-store' })
      onRefresh()
    } finally {
      setBusy(false)
    }
  }

  function fmtWhen(ts) {
    if (!ts) return ''
    const mins = Math.max(0, Math.round((Date.now() - ts * 1000) / 60000))
    if (mins < 1) return '刚刚'
    if (mins < 60) return mins + ' 分钟前'
    const hrs = Math.round(mins / 60)
    if (hrs < 24) return hrs + ' 小时前'
    return Math.round(hrs / 24) + ' 天前'
  }

  const sessions = Array.isArray(data?.sessions) ? data.sessions : []
  const status = data
    ? (data.enabled
        ? (sessions.length > 0 ? t('totpOn') + ' · ' + t('devicesOnline').replace('{n}', sessions.length) : t('totpOn'))
        : t('totpOff'))
    : '…'
  const [copiedSecret, setCopiedSecret] = useState(false)
  useEffect(() => {
    if (!copiedSecret) return
    const id = setTimeout(() => setCopiedSecret(false), 1600)
    return () => clearTimeout(id)
  }, [copiedSecret])

  return (
    <div className="dshBrowserCtlCard">
      <button
        type="button"
        className="dshBrowserCtlCardHead"
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen(o => !o)}
      >
        {Svg.lock}
        <span>{t('totpTitle')}</span>
        <span style={{
          fontWeight: 500,
          fontSize: 12,
          color: data?.enabled ? 'var(--dsw-alias-state-success-primary,#34b371)' : 'var(--dsw-alias-label-tertiary,#8b8f98)',
        }}>{status}</span>
        <span className="dshBrowserCtlCardArrow" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div className="dshBrowserCtlCardBody" data-open={open}>
        <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {t('totpHintShort')}
        </p>
        {data?.enabled && data?.svg && (
          <div className="dshBrowserCtlTotpQr">
            <img alt={t('totpBind')} src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data.svg)} />
          </div>
        )}
        {data?.secret && (
          <div className="dshBrowserCtlSecretRow">
            <div className="dshBrowserCtlSecret" title={data.secret}>{t('totpSecretLabel')}: {data.secret}</div>
            <Button variant="ghost" size="sm" onClick={() => {
              navigator.clipboard?.writeText(data.secret).then(() => setCopiedSecret(true)).catch(() => {})
            }}>{copiedSecret ? t('copied') : t('copySecret')}</Button>
          </div>
        )}
        <div className="dshBrowserCtlActions">
          {data?.enabled ? (
            <>
              <Button variant="secondary" size="sm" disabled={anyBusy} onClick={() => toggle(false)}>{t('totpDisable')}</Button>
              <Button variant="secondary" size="sm" disabled={anyBusy} onClick={() => toggle(true, true)}>{t('totpReset')}</Button>
            </>
          ) : (
            <Button variant="primary" size="sm" disabled={anyBusy || !data} onClick={() => toggle(true)}>{t('totpEnable')}</Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- 「推送」页签:接收手机推送 + 系统安全事件 + 测试推送 + 最近推送 ---------- */
const PUSH_KIND = { test: 'Test', verify: 'Verify', kick: 'Kick', ban: 'Ban', totp: 'Totp', pair: 'Pair', join: 'Join', dev: 'Dev' }

function pushKindLabel(t, kind) {
  const key = PUSH_KIND[kind]
  return key ? t('pushKind' + key) : (kind || '')
}

function fmtPushTime(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const p = n => String(n).padStart(2, '0')
  return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}

function PushCard({ t, reloadToken }) {
  const [cfg, setCfg] = useState(null)          // { enabled, system, since }
  const [cfgErr, setCfgErr] = useState('')
  const [busy, setBusy] = useState('')          // '' | 'enabled' | 'system' —— 开关 loading 态
  const [testState, setTestState] = useState('idle') // idle | loading
  const [toast, setToast] = useState(null)      // { text, ok } | null,2.2s 自动消失
  const [items, setItems] = useState(null)
  const [polling, setPolling] = useState(false)
  const [open, setOpen] = useState(true)

  const enabled = !!(cfg && cfg.enabled)
  const system = !!(cfg && cfg.system)

  // 读 push-config 初始化开关
  useEffect(() => {
    let alive = true
    fetch(API_P + '/browserctl-gate/push-config', { cache: 'no-store' })
      .then(r => r.text().then(tx => { try { return JSON.parse(tx) } catch { return { error: 'HTTP ' + r.status } } }))
      .then(j => {
        if (!alive) return
        if (j && j.ok) setCfg({ enabled: !!j.enabled, system: !!j.system, since: j.since || 0 })
        else setCfgErr((j && j.error) || t('pushPollFailed'))
      })
      .catch(() => { if (alive) setCfgErr(t('pushPollFailed')) })
    return () => { alive = false }
  }, [reloadToken])

  // 成功/失败 toast 2.2s 自动消失
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(id)
  }, [toast])

  // 切换开关:参数走查询串(POST push-config?enabled=1|0&system=1|0)
  async function toggle(which) {
    if (busy || !cfg) return
    setBusy(which)
    setToast(null)
    const next = which === 'enabled' ? !enabled : !system
    try {
      const q = new URLSearchParams({
        enabled: which === 'enabled' ? (next ? '1' : '0') : (enabled ? '1' : '0'),
        system: which === 'system' ? (next ? '1' : '0') : (system ? '1' : '0'),
      }).toString()
      const r = await fetch(API_P + '/browserctl-gate/push-config?' + q, { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.ok) {
        setCfg(c => ({ ...(c || {}), enabled: !!j.enabled, system: !!j.system, since: j.since || (c && c.since) || 0 }))
      } else {
        setToast({ text: (j && j.error) || t('pushSaveFailed'), ok: false })
      }
    } catch {
      setToast({ text: t('pushSaveFailed'), ok: false })
    } finally {
      setBusy('')
    }
  }

  // 发送测试推送(loopback)
  async function sendTest() {
    if (testState === 'loading' || !enabled || busy) return
    setTestState('loading')
    setToast(null)
    try {
      const q = new URLSearchParams({ kind: 'test', title: t('pushTestTitle'), body: t('pushTestBody') }).toString()
      const r = await fetch(API_P + '/browserctl-gate/notify?' + q, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      setToast({ text: (r.ok && j.ok) ? t('pushTestOk') : ((j && j.error) || t('pushTestFail')), ok: !!(r.ok && j.ok) })
    } catch {
      setToast({ text: t('pushTestFail'), ok: false })
    } finally {
      setTestState('idle')
    }
  }

  // 拉最近推送(newest first,取 ~10 条)
  async function loadPoll() {
    if (polling) return
    setPolling(true)
    try {
      const r = await fetch(API_P + '/browserctl-gate/push-poll?last=0', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.ok) {
        setItems(Array.isArray(j.items) ? j.items.slice(0, 10) : [])
        setCfg(c => ({ ...(c || {}), enabled: !!j.enabled, since: j.since || (c && c.since) || 0 }))
      }
    } catch {
      // 闸机未运行等场景:保持列表不变
    } finally {
      setPolling(false)
    }
  }

  useEffect(() => { loadPoll() }, [reloadToken])

  const list = items || []
  const switchDisabled = !!busy || !cfg

  return (
    <div className="dshBrowserCtlCard">
      <button type="button" className="dshBrowserCtlCardHead" data-open={open ? 'true' : 'false'} onClick={() => setOpen(o => !o)}>
        {Svg.bell}
        <span>{t('pushTitle')}</span>
        <span className="dshBrowserCtlCardStat" style={{ color: enabled ? 'var(--dsw-alias-state-success-primary,#34b371)' : 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
          {cfg ? (enabled ? t('pushOn') : t('pushOff')) : '…'}
        </span>
        <span className="dshBrowserCtlCardArrow" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div className="dshBrowserCtlCardBody dshBrowserCtlCardBodyTall" data-open={open}>
        <p className="dshBrowserCtlCardDesc">{t('pushDesc')}</p>
        <div className="dshBrowserCtlSwitchRow">
          <span className="dshBrowserCtlSwitchLabel">
            <span className="dshBrowserCtlSwitchTitle">{t('pushEnabledLabel')}</span>
            <span className="dshBrowserCtlSwitchHint">{t('pushEnabledHint')}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={t('pushEnabledLabel')}
            className="dshBrowserCtlSwitch"
            data-on={enabled ? 'true' : 'false'}
            data-busy={busy === 'enabled' ? 'true' : 'false'}
            disabled={switchDisabled}
            onClick={() => toggle('enabled')}
          >
            <span className="dshBrowserCtlSwitchKnob" aria-hidden="true" />
            {busy === 'enabled' && <span className="dshBrowserCtlSwitchBusy" aria-hidden="true" />}
          </button>
        </div>
        <div className="dshBrowserCtlSwitchRow">
          <span className="dshBrowserCtlSwitchLabel">
            <span className="dshBrowserCtlSwitchTitle">{t('pushSystemLabel')}</span>
            <span className="dshBrowserCtlSwitchHint">{t('pushSystemHint')}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={system}
            aria-label={t('pushSystemLabel')}
            className="dshBrowserCtlSwitch"
            data-on={system ? 'true' : 'false'}
            data-busy={busy === 'system' ? 'true' : 'false'}
            disabled={switchDisabled}
            onClick={() => toggle('system')}
          >
            <span className="dshBrowserCtlSwitchKnob" aria-hidden="true" />
            {busy === 'system' && <span className="dshBrowserCtlSwitchBusy" aria-hidden="true" />}
          </button>
        </div>
        {cfgErr && <p className="dshBrowserCtlCardDesc" style={{ color: 'var(--dsw-alias-state-error-primary,#e5655c)' }}>{cfgErr}</p>}
        <div className="dshBrowserCtlActions">
          <Button
            variant="secondary"
            size="sm"
            className="dshBrowserCtlPushBtn"
            disabled={testState === 'loading' || !enabled || !!busy}
            onClick={sendTest}
          >
            {testState === 'loading' ? t('pushTesting') : t('pushTest')}
          </Button>
        </div>
        {toast && (
          <div className="dshBrowserCtlPairedMsg" style={{ color: toast.ok ? 'var(--dsw-alias-state-success-primary,#34b371)' : 'var(--dsw-alias-state-error-primary,#e5655c)' }}>
            {toast.text}
          </div>
        )}
        {/* 最近推送列表 */}
        <div className="dshBrowserCtlPairedList">
          <div className="dshBrowserCtlPairedHead">
            <span>{t('pushRecent')}</span>
            <Button variant="ghost" size="sm" disabled={polling} onClick={loadPoll}>
              {polling ? t('pushRefreshing') : t('pushRefresh')}
            </Button>
          </div>
          {list.length === 0 ? (
            <div className="dshBrowserCtlPairedEmpty">{t('pushEmpty')}</div>
          ) : (
            <div className="dshBrowserCtlPushList">
              {list.map(it => (
                <div key={it.id || (it.t + (it.title || ''))} className="dshBrowserCtlPushRow">
                  <span className="dshBrowserCtlPushAside">
                    <span className="dshBrowserCtlPushType">{pushKindLabel(t, it.kind)}</span>
                    <span className="dshBrowserCtlPushTime">{fmtPushTime(it.t)}</span>
                  </span>
                  <span className="dshBrowserCtlPushMain">
                    <span className="dshBrowserCtlPushTitle" title={it.title || ''}>{it.title || ''}</span>
                    {it.body ? <span className="dshBrowserCtlPushBody" title={it.body}>{it.body}</span> : null}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- 「关于」面板:应用名 + 版本 + 简介 + 外部链接 + 检查更新 ---------- */
function AboutPanel({ t, onClose }) {
  // 检查更新按钮三态: idle(检查更新) / loading(检查中…) / done(重新检查)
  const [checkState, setCheckState] = useState('idle')
  const [checkResult, setCheckResult] = useState(null)
  // 用户协议 / 隐私政策弹窗: null=不显示, 否则为要展示的文档对象
  const [legalDoc, setLegalDoc] = useState(null)
  const links = [
    { key: 'website', href: ABOUT_LINKS.website, icon: 'globe', label: t('aboutWebsite') },
    { key: 'github', href: ABOUT_LINKS.github, icon: 'link', label: t('aboutGithub') },
    { key: 'app', href: ABOUT_LINKS.app, icon: 'phone', label: t('aboutApp') },
  ]
  async function checkUpdate() {
    if (checkState === 'loading') return
    setCheckState('loading')
    setCheckResult(null)
    try {
      const r = await fetch(API_P + '/browserctl/api/update-check', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      setCheckResult(j)
    } catch (e) {
      setCheckResult({ ok: false, error: String((e && e.message) || e) })
    } finally {
      setCheckState('done')
    }
  }
  const err = checkResult && !checkResult.ok ? (checkResult.error || t('updateFailed')) : ''
  const hasUpdate = !!(checkResult && checkResult.ok && checkResult.hasUpdate)
  const upToDate = !!(checkResult && checkResult.ok && !checkResult.hasUpdate)
  const notes = hasUpdate && Array.isArray(checkResult.notes) ? checkResult.notes : []
  const downloadUrl = hasUpdate ? (checkResult.downloadUrl || ABOUT_LINKS.app) : ABOUT_LINKS.app
  return (
    <div className="dshBrowserCtlOverlay" role="dialog" aria-modal="true" aria-label={t('about')}>
      <button className="dshBrowserCtlOverlayMask" type="button" aria-label={t('close')} onClick={onClose} />
      <section className="dshBrowserCtlPanel dshBrowserCtlPanelNested">
        <header className="dshBrowserCtlHeader">
          <div>
            <h1>{t('about')}</h1>
          </div>
          <Tooltip label={t('close')}>
            <Button variant="ghost" size="sm" aria-label={t('close')} icon={<IconCloseOutlineRegular />} onClick={onClose} />
          </Tooltip>
        </header>
        <div className="dshBrowserCtlAboutApp">
          <span className="dshBrowserCtlAboutAppName">{t('tab')}</span>
          <span className="dshBrowserCtlAboutAppVersion">v{VERSION}</span>
        </div>
        <p className="dshBrowserCtlAboutDesc">{t('aboutDesc')}</p>
        <div className="dshBrowserCtlAboutLinks">
          {links.map(l => (
            <a key={l.key} className="dshBrowserCtlAboutLink" href={l.href} target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">{Svg[l.icon]}</span>
              <span>{l.label}</span>
            </a>
          ))}
        </div>
        <div className="dshBrowserCtlAboutLegal">
          <button type="button" className="dshBrowserCtlAboutLegalLink" onClick={() => setLegalDoc(LEGAL_TERMS)}>
            {t('legalTerms')}
          </button>
          <span className="dshBrowserCtlAboutLegalSep" aria-hidden="true">·</span>
          <button type="button" className="dshBrowserCtlAboutLegalLink" onClick={() => setLegalDoc(LEGAL_PRIVACY)}>
            {t('legalPrivacy')}
          </button>
        </div>
        <div className="dshBrowserCtlAboutUpdate">
          <Button
            variant="secondary"
            size="sm"
            className="dshBrowserCtlAboutUpdateBtn"
            disabled={checkState === 'loading'}
            onClick={checkUpdate}
          >
            {checkState === 'loading' ? t('updateChecking') : checkState === 'done' ? t('updateRecheck') : t('updateCheck')}
          </Button>
          {checkState === 'done' && (
            <>
              {(hasUpdate || upToDate) && (
                <>
                  <div className="dshBrowserCtlAboutUpdateRow">
                    <span>{t('updateCur')}</span>
                    <span className="dshBrowserCtlAboutUpdateVal">v{checkResult.current}</span>
                  </div>
                  <div className="dshBrowserCtlAboutUpdateRow">
                    <span>{t('updateLst')}</span>
                    <span className="dshBrowserCtlAboutUpdateVal">v{checkResult.latest}</span>
                  </div>
                </>
              )}
              {hasUpdate && (
                <>
                  <p className="dshBrowserCtlAboutUpdateFound">{t('updateFound').replace('{v}', checkResult.latest)}</p>
                  <div className="dshBrowserCtlUrlRow">
                    <div className="dshBrowserCtlUrl" title={downloadUrl}>{downloadUrl}</div>
                    <Button variant="secondary" size="sm" onClick={() => window.open(downloadUrl, '_blank')}>
                      {t('updateDownload')}
                    </Button>
                  </div>
                  {notes.length > 0 && (
                    <>
                      <p className="dshBrowserCtlCardDesc">{t('updateNotesTitle')}</p>
                      <ul className="dshBrowserCtlAboutUpdateNotes">
                        {notes.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </>
                  )}
                </>
              )}
              {upToDate && <p className="dshBrowserCtlAboutUpdateLatest">{t('updateUpToDate')}</p>}
              {err && <p className="dshBrowserCtlAboutUpdateErr">{err}</p>}
            </>
          )}
        </div>
        {legalDoc && <LegalDialog t={t} doc={legalDoc} onClose={() => setLegalDoc(null)} />}
      </section>
    </div>
  )
}

/* ---------- 用户协议 / 隐私政策弹窗(「关于」面板内点击展开) ---------- */
function LegalDialog({ t, doc, onClose }) {
  if (!doc) return null
  return (
    <div className="dshBrowserCtlOverlay" role="dialog" aria-modal="true" aria-label={doc.title}>
      <button className="dshBrowserCtlOverlayMask" type="button" aria-label={t('close')} onClick={onClose} />
      <section className="dshBrowserCtlPanel dshBrowserCtlPanelNested dshBrowserCtlLegalPanel">
        <header className="dshBrowserCtlHeader">
          <div>
            <h1>{doc.title}</h1>
            <p>{t('legalMeta').replace('{d}', LEGAL_EFFECTIVE).replace('{v}', LEGAL_VERSION)}</p>
          </div>
          <Tooltip label={t('close')}>
            <Button variant="ghost" size="sm" aria-label={t('close')} icon={<IconCloseOutlineRegular />} onClick={onClose} />
          </Tooltip>
        </header>
        <div className="dshBrowserCtlLegalBody">
          <p className="dshBrowserCtlLegalSubtitle">{doc.subtitle}</p>
          {doc.sections.map(sec => (
            <section className="dshBrowserCtlLegalSection" key={sec.title}>
              <h3>{sec.title}</h3>
              {sec.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </section>
          ))}
        </div>
        <div className="dshBrowserCtlLegalFooter">
          <Button variant="secondary" size="sm" className="dshBrowserCtlAboutUpdateBtn" onClick={onClose}>
            {t('legalAck')}
          </Button>
        </div>
      </section>
    </div>
  )
}

/* ---------- 「配置」面板:服务器选择(官方 / 自建) ---------- */
function ConfigPanel({ t, onClose, onSaved }) {
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
      if (token) params.set('token', token)
    } else {
      params.set('mode', 'official')
    }
    setSaving('loading')
    try {
      const r = await fetch(API_P + '/browserctl/api/config?' + params.toString(), { method: 'POST', cache: 'no-store' })
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
    <div className="dshBrowserCtlOverlay" role="dialog" aria-modal="true" aria-label={t('config')}>
      <button className="dshBrowserCtlOverlayMask" type="button" aria-label={t('close')} onClick={onClose} />
      <section className="dshBrowserCtlPanel dshBrowserCtlPanelNested dshBrowserCtlPanelCfg">
        <header className="dshBrowserCtlHeader">
          <div>
            <h1>{t('config')}</h1>
            <p>{t('configSubtitle')}</p>
          </div>
          <Tooltip label={t('close')}>
            <Button variant="ghost" size="sm" aria-label={t('close')} icon={<IconCloseOutlineRegular />} onClick={onClose} />
          </Tooltip>
        </header>
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
      </section>
    </div>
  )
}

// 官方多用户账号卡:设备授权流(RFC 8628)登录/注册/退出。
// 点「登录」→ host 拿 device_code → 打开浏览器跳官网授权页 → 用户在网页登录/注册并
// 确认 → 这里轮询 /server/oauth/poll 换 token(host 落 per-user 密钥与端口),随后
// 重启隧道(stop+ensure)让 frpc 用新端口重新拨号。账号密码不在插件内出现。
function OfficialAccountCard({ t, onSaved }) {
  const [acct, setAcct] = useState(null)        // /server/me 或 config.account 的合并视图
  const [busy, setBusy] = useState('')          // '' | 'begin' | 'logout'
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [pending, setPending] = useState(null)  // {deviceCode, userCode, verificationUri, interval}
  const pollTimer = useRef(null)
  const pendingRef = useRef(null)                 // 闭包安全:poll 读这个而非 pending(state 跨 render 会变)
  const [copiedOauth, setCopiedOauth] = useState(false)

  const loadAcct = async () => {
    try {
      const r = await fetch(API_P + '/browserctl/api/server/me', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (j && j.loggedIn) {
        setAcct({ email: j.email, remotePort: j.remotePort, status: j.status })
      } else if (j && j.ok === false && j.error) {
        setErr(t('configAcctLoadFail'))
      } else {
        setAcct(null)
      }
    } catch (e) {
      setErr(t('configAcctLoadFail'))
    }
  }
  useEffect(() => { loadAcct() }, [])

  const clearPoll = () => {
    if (pollTimer.current) { clearTimeout(pollTimer.current); pollTimer.current = null }
    pendingRef.current = null
  }
  useEffect(() => () => clearPoll(), [])

  const restartTunnel = async () => {
    try {
      await fetch(API_P + '/browserctl/api/stop', { method: 'POST', cache: 'no-store' })
      await new Promise(r => setTimeout(r, 1500))
      await fetch(API_P + '/browserctl/api/ensure', { method: 'POST', cache: 'no-store' })
      return true
    } catch (e) {
      return false
    }
  }

  const openAuthPage = async (url) => {
    if (!url) return false
    try {
      const r = await fetch(API_P + '/browserctl/api/server/oauth/open?url=' + encodeURIComponent(url), { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) {
        setErr((j && j.error) || t('configAcctOauthOpenFail'))
        return false
      }
      setErr('')
      return true
    } catch (e) {
      setErr(t('configAcctOauthOpenFail'))
      return false
    }
  }

  const copyOauthUrl = (url) => {
    if (!url) return
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedOauth(true)
      setTimeout(() => setCopiedOauth(false), 1600)
    }).catch(() => {})
  }

  const poll = async () => {
    const pd = pendingRef.current
    if (!pd) return
    try {
      const r = await fetch(API_P + '/browserctl/api/server/oauth/poll?device_code=' + encodeURIComponent(pd.deviceCode), { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (j && j.ok) {
        clearPoll()
        setPending(null)
        pendingRef.current = null
        setAcct({ email: j.email, remotePort: j.remotePort })
        setMsg(t('configAcctOauthDone'))
        onSaved()
        const okRestart = await restartTunnel()
        if (!okRestart) { setErr(t('configAcctRestartFail')); setMsg('') }
        setBusy('')
        return
      }
      if (j && j.pending) {
        const interval = Math.max(3, Number(j.interval) || 5) * 1000
        pollTimer.current = setTimeout(poll, interval)
        return
      }
      // 失败/过期/拒绝
      clearPoll()
      setPending(null); setBusy('')
      setErr(j && j.error ? (t('configAcctOauthFail') + ' ' + j.error) : t('configAcctOauthExpired'))
    } catch (e) {
      clearPoll()
      setPending(null); setBusy('')
      setErr(t('configAcctOauthNetwork'))
    }
  }

  const startOAuth = async () => {
    if (busy) return
    setErr(''); setMsg('')
    setBusy('begin')
    try {
      const r = await fetch(API_P + '/browserctl/api/server/oauth/begin', { method: 'POST', cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) {
        setErr(j.error || ('HTTP ' + r.status))
        setBusy('')
        return
      }
      setPending({
        deviceCode: j.deviceCode,
        userCode: j.userCode,
        verificationUri: j.verificationUri,
        interval: Math.max(3, Number(j.interval) || 5),
      })
      pendingRef.current = { deviceCode: j.deviceCode, userCode: j.userCode, verificationUri: j.verificationUri }
      setBusy('polling')
      await openAuthPage(j.verificationUri)
      pollTimer.current = setTimeout(poll, 1500)
    } catch (e) {
      setErr(t('configAcctOauthNetwork'))
      setBusy('')
    }
  }

  const cancelOAuth = () => {
    clearPoll()
    setPending(null)
    pendingRef.current = null
    setBusy('')
  }

  const logout = async () => {
    if (busy) return
    setErr(''); setMsg('')
    setBusy('logout')
    try {
      await fetch(API_P + '/browserctl/api/server/logout', { method: 'POST', cache: 'no-store' })
      setAcct(null)
      setMsg(t('configAcctLoggedOut'))
      onSaved()
    } catch (e) {
      setErr(String((e && e.message) || e))
    }
    setBusy('')
  }

  const working = busy !== ''

  if (acct) {
    return (
      <div className="dshBrowserCtlCfgFields">
        <div className="dshBrowserCtlCfgFieldRow">
          <label className="dshBrowserCtlCfgField">
            <span>{t('configAcctTitle')}</span>
            <span className="dshBrowserCtlCfgAcctLine">
              {t('configAcctLoggedIn')} · {acct.email}
              {Number(acct.remotePort) > 0 ? ' · ' + t('configAcctPort') + ' ' + acct.remotePort : ''}
            </span>
          </label>
        </div>
        {msg && <p className="dshBrowserCtlCfgNote">{msg}</p>}
        {err && <p className="dshBrowserCtlCfgErr">{err}</p>}
        <Button variant="secondary" size="sm" disabled={working} onClick={logout}>
          {busy === 'logout' ? t('configAcctLoggingOut') : t('configAcctLogout')}
        </Button>
      </div>
    )
  }

  if (pending) {
    return (
      <div className="dshBrowserCtlCfgFields">
        <label className="dshBrowserCtlCfgField">
          <span>{t('configAcctTitle')}</span>
          <span className="dshBrowserCtlCfgAcctLine">{t('configAcctOauthWait')}</span>
        </label>
        <p className="dshBrowserCtlCfgNote">{t('configAcctOauthOpenBrowser')}</p>
        <div className="dshBrowserCtlCfgOauthCode">{pending.userCode}</div>
        <p className="dshBrowserCtlCfgNote">
          <a href={pending.verificationUri} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dsw-alias-accent-strong,#4da3ff)', wordBreak: 'break-all' }}>
            {pending.verificationUri}
          </a>
        </p>
        <div className="dshBrowserCtlCfgFieldRow">
          <Button variant="secondary" size="sm" onClick={() => openAuthPage(pending.verificationUri)}>
            {t('configAcctOauthOpenAgain')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => copyOauthUrl(pending.verificationUri)}>
            {copiedOauth ? t('configAcctCopied') : t('configAcctCopy')}
          </Button>
          <Button variant="secondary" size="sm" onClick={cancelOAuth}>
            {t('configAcctOauthCancel')}
          </Button>
        </div>
        {msg && <p className="dshBrowserCtlCfgNote">{msg}</p>}
        {err && <p className="dshBrowserCtlCfgErr">{err}</p>}
      </div>
    )
  }

  return (
    <div className="dshBrowserCtlCfgFields">
      <label className="dshBrowserCtlCfgField">
        <span>{t('configAcctTitle')}</span>
        <span className="dshBrowserCtlCfgAcctLine">{t('configAcctOauthHint')}</span>
      </label>
      {msg && <p className="dshBrowserCtlCfgNote">{msg}</p>}
      {err && <p className="dshBrowserCtlCfgErr">{err}</p>}
      <Button variant="primary" size="sm" disabled={working} onClick={startOAuth}>
        {busy === 'begin' ? t('configAcctOauthOpening') : t('configAcctOauthBtn')}
      </Button>
    </div>
  )
}

/* ---------- 账号登录弹窗(顶栏「账号登录」按钮打开,复用 OfficialAccountCard) ---------- */
function AccountLoginModal({ t, onClose, onSaved }) {
  return (
    <div className="dshBrowserCtlOverlay" role="dialog" aria-modal="true" aria-label={t('configAcctTitle')}>
      <button className="dshBrowserCtlOverlayMask" type="button" aria-label={t('close')} onClick={onClose} />
      <section className="dshBrowserCtlPanel dshBrowserCtlPanelNested dshBrowserCtlPanelCfg">
        <header className="dshBrowserCtlHeader">
          <div>
            <h1>{t('configAcctTitle')}</h1>
            <p>{t('configOfficialHint')}</p>
          </div>
          <Tooltip label={t('close')}>
            <Button variant="ghost" size="sm" aria-label={t('close')} icon={<IconCloseOutlineRegular />} onClick={onClose} />
          </Tooltip>
        </header>
        <OfficialAccountCard t={t} onSaved={onSaved} />
      </section>
    </div>
  )
}

function BrowserCtlOverlay({ useStore, actions, t, initialTab }) {
  const open = useStore(state => state.open)
  const [reloadToken, setReloadToken] = useState(0)
  const [copied, setCopied] = useState(false)
  // 全局忙碌标记:任一操作进行中,禁用面板内所有按钮,杜绝连点/排队/误触
  const [busy, setBusy] = useState('')
  // 顶部功能页签:connect / devices / totp / ban / log
  const [tab, setTab] = useState(initialTab || 'connect')
  // 配对码可用次数:1=一次性(扫完自动换码);>1 可多台设备共用同一个码
  const [uses, setUses] = useState(1)
  // 头部小浮层:关于 / 配置(点击头部图标按钮打开)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  // 顶栏「账号登录」弹窗 + 未登录启动远程时的提示
  const [accountOpen, setAccountOpen] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)
  // 启动失败的具体原因(如「找不到 Python」)。以前只 console.error,界面什么都不显示,
  // 用户只看到「点了没反应」,所以这里必须把原因原样呈现出来。
  const [startErr, setStartErr] = useState('')
  // 顶栏账号按钮的登录态(登录后显示邮箱)
  const [acctMe, setAcctMe] = useState(null)
  // 当前连接模式(official/selfhost),用于判断未登录时是否显示二维码
  const [cfgMode, setCfgMode] = useState('official')
  const panel = useRef(null)
  const { data, error, expiresAt, status, refresh } = useQr(open, reloadToken, uses)
  const left = useCountdown(expiresAt)
  const run = async (label, fn) => {
    if (busy) return
    setBusy(label)
    try { await fn() } finally { setBusy('') }
  }
  const refreshAll = () => run('refresh', async () => {
    await new Promise(r => setTimeout(r, 60))
    setReloadToken(x => x + 1)
  })
  const loadAcctMe = async () => {
    try {
      const r = await fetch(API_P + '/browserctl/api/server/me', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      setAcctMe(j && j.loggedIn ? j : null)
    } catch { setAcctMe(null) }
  }
  useEffect(() => { if (open) loadAcctMe() }, [open, reloadToken])
  // 加载连接模式(用于判断未登录时是否隐藏二维码)
  useEffect(() => {
    if (!open) return
    fetch(API_P + '/browserctl/api/config', { cache: 'no-store' })
      .then(r => r.json().then(j => { if (j && j.mode) setCfgMode(j.mode) }).catch(() => {}))
      .catch(() => {})
  }, [open])
  const startChain = async () => {
    // 官方模式且未登录 → 弹提示先去登录,不直接启动
    try {
      const c = await fetch(API_P + '/browserctl/api/config', { cache: 'no-store' }).then(r => r.json()).catch(() => ({}))
      if (c && c.mode === 'official') {
        const m = await fetch(API_P + '/browserctl/api/server/me', { cache: 'no-store' }).then(r => r.json()).catch(() => ({}))
        if (!(m && m.loggedIn)) { setLoginPrompt(true); return }
      }
    } catch {}
    setStartErr('') // 重新启动前清掉上一次的失败原因
    run('start', async () => {
      // Phase 1: 触发 ensure（偶发网络抖动/端口竞争时最多重试 3 次）
      let lastErr = ''
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const r = await fetch(API_P + '/browserctl/api/ensure', { cache: 'no-store' })
          const j = await r.json().catch(() => ({}))
          if (j && (j.ok || j.pending)) { lastErr = ''; break }
          lastErr = (j && j.error) || ('HTTP ' + r.status)
        } catch (e) {
          lastErr = String((e && e.message) || e)
        }
        if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 1000))
      }
      // Phase 2: ensure 已接受（ok 或 pending），轮询直到 3080 真正就绪
      // 避免 ensure 返回 pending 但隧道还在后台构建中(claim-port/start/探活),
      // 立即刷新导致 QR 获取失败显示"闸机未运行"、用户以为要再点一次。
      if (!lastErr) {
        const deadline = Date.now() + 12000
        let fwd = false
        while (Date.now() < deadline) {
          try {
            const r = await fetch(API_P + '/browserctl/api/status', { cache: 'no-store' })
            const j = await r.json().catch(() => ({}))
            fwd = !!j.forwarder
            if (fwd) break
            // 后台 ensure 已经失败:立刻取回原因,不用空等到超时
            if (j.startError) { lastErr = String(j.startError); break }
          } catch { fwd = false }
          await new Promise(r => setTimeout(r, 300))
        }
        // 等满 12 秒还没起来:再探一次把原因取回来(以前这里直接放弃,
        // 面板就永远停在"隧道正在建立",用户看不到任何失败原因)
        if (!lastErr && !fwd) {
          try {
            const r = await fetch(API_P + '/browserctl/api/status', { cache: 'no-store' })
            const j = await r.json().catch(() => ({}))
            lastErr = String(j.startError || '')
              || '本机闸机(127.0.0.1:3080)在 12 秒内没有就绪。\n'
               + '请查看 kit 目录下的 browserctl_start.log 与 browserctl_fwd.log;\n'
               + '最常见原因是安全软件拦截 frpc.exe(详见 INSTALL.md 常见问题第 1 条)。'
          } catch {
            lastErr = '本机闸机(127.0.0.1:3080)在 12 秒内没有就绪,请查看 kit 目录下的日志文件。'
          }
        }
      }
      if (lastErr) console.error('[browserctl] ensure 全部重试失败:', lastErr)
      setStartErr(lastErr)
      await new Promise(r => setTimeout(r, 600))
      setReloadToken(x => x + 1)
    })
  }
  const stopChain = () => run('stop', async () => {
    // 停止浏览器控制:关闭整个穿透隧道(fwd/frpc/watchdog 全部结束),
    // 公网面板 URL 立即不可访问。
    try { await fetch(API_P + '/browserctl/api/stop', { cache: 'no-store' }) } catch {}
    // stop 是分离进程,命令返回时闸机可能还没关完(端口未释放)。
    // 必须轮询等到 3080 真正关闭再刷新二维码,否则旧二维码不消失、开始按钮不出现。
    const deadline = Date.now() + 12000
    for (;;) {
      let fwd = true
      try {
        const r = await fetch(API_P + '/browserctl/api/status', { cache: 'no-store' })
        const j = await r.json()
        fwd = !!j.forwarder
      } catch { fwd = false }
      if (!fwd) break
      if (Date.now() >= deadline) break
      await new Promise(r => setTimeout(r, 300))
    }
    await new Promise(r => setTimeout(r, 200))
    setReloadToken(x => x + 1)
  })

  useEffect(() => {
    if (!open) return
    panel.current?.querySelector('button')?.focus()
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (loginPrompt) { setLoginPrompt(false); return }
      if (accountOpen) { setAccountOpen(false); return }
      if (aboutOpen) { setAboutOpen(false); return }
      if (configOpen) { setConfigOpen(false); return }
      if (document.querySelectorAll('[role="dialog"]').length > 1) return
      actions.close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [actions, open, aboutOpen, configOpen, accountOpen, loginPrompt])

  // 心跳保活:面板一打开(任意页签)就每 2 分钟向闸机报一次活动,
  // "在线设备"卡片据此判断谁还在线;关闭面板即停止上报,10 分钟后自动转为历史设备。
  useEffect(() => {
    if (!open) return
    let alive = true
    const beat = () => fetch(API_P + '/browserctl-gate/heartbeat', { cache: 'no-store' }).catch(() => {})
    beat().then(() => { if (alive) setTimeout(() => setReloadToken(x => x + 1), 400) })
    const hb = setInterval(beat, 120000)
    return () => { alive = false; clearInterval(hb) }
  }, [open])

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(id)
  }, [copied])

  const gating = !!busy
  const TABS = [
    { id: 'connect', icon: 'link', label: t('tabConnect') },
    { id: 'devices', icon: 'desk', label: t('tabDevices') },
    { id: 'totp', icon: 'lock', label: t('tab2fa') },
    { id: 'app', icon: 'phone', label: t('tabApp') },
    { id: 'push', icon: 'bell', label: t('tabPush') },
    { id: 'ban', icon: 'shield', label: t('tabBan') },
    { id: 'log', icon: 'clip', label: t('tabLog') },
  ]
  if (!open) return null
  return (
    <div className="dshBrowserCtlOverlay" role="dialog" aria-modal="true" aria-label={t('tab')}>
      <button className="dshBrowserCtlOverlayMask" type="button" aria-label={t('close')} onClick={() => actions.close()} />
      <section ref={panel} className="dshBrowserCtlPanel">
        <header className="dshBrowserCtlHeader">
          <div>
            <h1>{t('tab')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          {busy && (
            <span style={{ fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary,#8b8f98)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="dshBrowserCtlSpinner" aria-hidden="true" />
              {busy === 'start' ? t('starting') : busy === 'stop' ? t('stopping') : t('refresh') + '…'}
            </span>
          )}
          <Tooltip label={acctMe ? (acctMe.email || t('configAcctTitle')) : t('aboutAccount')}>
            <Button
              variant="ghost"
              size="sm"
              className="dshBrowserCtlHeaderAcct"
              aria-label={t('configAcctTitle')}
              data-logged-in={acctMe ? 'true' : 'false'}
              onClick={() => setAccountOpen(true)}
            >
              <span aria-hidden="true">{Svg.person}</span>
              <span className="dshBrowserCtlHeaderAcctLabel">
                {acctMe ? (acctMe.email || t('aboutAccountLogged')) : t('aboutAccount')}
              </span>
            </Button>
          </Tooltip>
          <Tooltip label={t('about')}>
            <Button variant="ghost" size="sm" aria-label={t('about')} icon={Svg.info} onClick={() => setAboutOpen(true)} />
          </Tooltip>
          <Tooltip label={t('config')}>
            <Button variant="ghost" size="sm" aria-label={t('config')} icon={Svg.gear} onClick={() => setConfigOpen(true)} />
          </Tooltip>
          <Tooltip label={t('close')}>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('close')}
              icon={<IconCloseOutlineRegular />}
              onClick={() => actions.close()}
            />
          </Tooltip>
        </header>
        <div
          className="dshBrowserCtlStatus"
          data-ok={data ? (data.forwarder === false ? 'wait' : 'true') : (busy === 'start' ? 'wait' : (error ? 'false' : 'wait'))}
        >
          {data
            ? (data.forwarder === false ? t('statusTunnelStarting') : t('statusReady'))
            : (busy === 'start' ? t('starting') : (error ? t('statusNoSecret') : t('statusLoading')))}
          {error && busy !== 'start' ? <span title={error} style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{error}</span> : null}
        </div>
        <div className="dshBrowserCtlTabs">
          {TABS.map(tb => (
            <button
              key={tb.id}
              type="button"
              className="dshBrowserCtlTab"
              data-active={tab === tb.id ? 'true' : 'false'}
              disabled={gating}
              onClick={() => setTab(tb.id)}
            >
              <span aria-hidden="true">{Svg[tb.icon]}</span>
              <span>{tb.label}</span>
            </button>
          ))}
        </div>
        <div className="dshBrowserCtlTabBody">
          {tab === 'connect' && (
            <>
              {data && data.svg ? (
                cfgMode === 'official' && !acctMe ? (
                  <div className="dshBrowserCtlQrBox" style={{ height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#666', fontSize: 12, padding: '0 14px', textAlign: 'center' }}>
                      {t('loginRequiredDesc')}
                    </span>
                  </div>
                ) : (
                <div>
                  <div className="dshBrowserCtlQrBox">
                    <img alt={t('qrAlt')} src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data.svg)} />
                  </div>
                  <p style={{
                    margin: '4px 0 0', fontSize: 12, textAlign: 'center',
                    color: left > 0 ? 'var(--dsw-alias-label-tertiary,#8b8f98)' : 'var(--dsw-alias-state-error-primary,#e5655c)',
                  }}>
                    {left > 0
                      ? <span>
                          {status && status.uses > 1
                            ? <span style={{ color: 'var(--dsw-alias-label-secondary,#666)' }}>{t('pairUses')} {status.remaining}/{status.uses} · </span>
                            : <span>{t('pairOnce')} · </span>}
                          <span style={{ color: left <= 10 ? 'var(--dsw-alias-state-error-primary,#e5655c)' : 'inherit' }}>{t('pairLeft')} {left}s</span>
                        </span>
                      : (data.once ? <span>{t('pairExpired')}</span> : <span style={{ color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>{t('pairStatic')}</span>)}
                  </p>
                  {data.once ? (
                    <p style={{ margin: '4px 0 0', fontSize: 11, textAlign: 'center', color: 'var(--dsw-alias-label-tertiary,#8b8f98)' }}>
                      {t('pairAppTempNote')}
                    </p>
                  ) : null}
                </div>
                )
              ) : (
                <div className="dshBrowserCtlQrBox" style={{ height: 128 }}>
                  {busy === 'start' ? (
                    <span className="dshBrowserCtlQrLoading">
                      <span className="dshBrowserCtlSpinner" aria-hidden="true" />
                      {t('starting')}
                    </span>
                  ) : startErr ? (
                    <span style={{
                      color: 'var(--dsw-alias-state-error-primary,#e5655c)', fontSize: 11,
                      padding: '0 12px', textAlign: 'left', whiteSpace: 'pre-wrap',
                      overflowY: 'auto', maxHeight: 120, lineHeight: 1.5, display: 'block',
                    }}>
                      {t('startFailed')}{'\n'}{startErr}
                    </span>
                  ) : (
                    <span style={{ color: '#666', fontSize: 12, padding: '0 14px', textAlign: 'center' }}>
                      {error ? t('statusNoSecret') : t('statusLoading')}
                    </span>
                  )}
                </div>
              )}
              {data && !(cfgMode === 'official' && !acctMe) && (
                <div className="dshBrowserCtlUrlRow">
                  <div className="dshBrowserCtlUrl" title={data.url}>{data.url}</div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    navigator.clipboard?.writeText(data.url).then(() => setCopied(true)).catch(() => {})
                  }}>{copied ? t('copied') : t('copyLink')}</Button>
                </div>
              )}
              {data && data.grant && !(cfgMode === 'official' && !acctMe) && (
                <div className="dshBrowserCtlUrlRow" style={{ marginTop: 6, gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)', whiteSpace: 'nowrap' }}>{t('pairUsesLabel')}</span>
                  <select
                    value={uses}
                    disabled={gating}
                    onChange={e => setUses(parseInt(e.target.value, 10) || 1)}
                    style={{
                      fontSize: 12, padding: '2px 4px', borderRadius: 6,
                      border: '1px solid rgba(128,128,128,.35)', background: 'transparent',
                      color: 'inherit', flex: 'none',
                    }}
                  >
                    {[1, 2, 3, 5, 10].map(n => (
                      <option key={n} value={n}>{n === 1 ? t('pairUsesOne') : n + ' ' + t('pairUsesTimes')}</option>
                    ))}
                  </select>
                  <Button variant="ghost" size="sm" disabled={gating} onClick={refresh}>{t('pairSwap')}</Button>
                </div>
              )}
              <IosGuideCard t={t} reloadToken={reloadToken} />
              <div className="dshBrowserCtlActions">
                {!data && (
                  <Button variant="primary" size="sm" disabled={gating} onClick={startChain}>
                    {busy === 'start'
                      ? (<><span className="dshBrowserCtlSpinner" aria-hidden="true" /> {t('starting')}</>)
                      : t('startCtl')}
                  </Button>
                )}
                <Button variant="secondary" size="sm" disabled={gating} onClick={refreshAll}>
                  {busy === 'refresh' ? t('refresh') + '…' : t('refresh')}
                </Button>
                {data && data.panel && !(cfgMode === 'official' && !acctMe) && (
                  <Button variant="primary" size="sm" disabled={gating} onClick={() => window.open(data.panel, '_blank')}>{t('openPanel')}</Button>
                )}
                {data && !data.panel && !(cfgMode === 'official' && !acctMe) && (
                  <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8b8f98)', display: 'inline-flex', alignItems: 'center' }}>{t('loginRequired')}</span>
                )}
                {data && (
                  <Button variant="secondary" size="sm" disabled={gating} onClick={stopChain}
                      style={{ color: 'var(--dsw-alias-state-error-primary,#e5655c)' }}>
                      {busy === 'stop'
                        ? (<><span className="dshBrowserCtlSpinner" aria-hidden="true" /> {t('stopping')}</>)
                        : t('stopCtl')}
                    </Button>
                )}
              </div>
            </>
          )}
          {tab === 'devices' && (
            <DevicesSection t={t} reloadToken={reloadToken} onRefresh={() => setReloadToken(x => x + 1)} disabled={gating} />
          )}
          {tab === 'totp' && (
            <TotpCard t={t} reloadToken={reloadToken} onRefresh={() => setReloadToken(x => x + 1)} disabled={gating} />
          )}
          {tab === 'app' && (
            <AppPairCard t={t} reloadToken={reloadToken} />
          )}
          {tab === 'push' && (
            <PushCard t={t} reloadToken={reloadToken} />
          )}
          {tab === 'ban' && (
            <BlacklistCard t={t} reloadToken={reloadToken} disabled={gating} />
          )}
          {tab === 'log' && (
            <LogCard t={t} reloadToken={reloadToken} />
          )}
        </div>
      </section>
      {aboutOpen && <AboutPanel t={t} onClose={() => setAboutOpen(false)} />}
      {configOpen && <ConfigPanel t={t} onClose={() => setConfigOpen(false)} onSaved={refreshAll} />}
      {accountOpen && (
        <AccountLoginModal t={t} onClose={() => setAccountOpen(false)} onSaved={refreshAll} />
      )}
      {loginPrompt && (
        <div className="dshBrowserCtlOverlay dshBrowserCtlLoginPrompt" role="dialog" aria-modal="true" aria-label={t('loginRequired')}>
          <button className="dshBrowserCtlOverlayMask" type="button" aria-label={t('close')} onClick={() => setLoginPrompt(false)} />
          <section className="dshBrowserCtlPanel">
            <header className="dshBrowserCtlHeader">
              <div>
                <h1>{t('loginRequired')}</h1>
              </div>
              <Tooltip label={t('close')}>
                <Button variant="ghost" size="sm" aria-label={t('close')} icon={<IconCloseOutlineRegular />} onClick={() => setLoginPrompt(false)} />
              </Tooltip>
            </header>
            <div className="dshBrowserCtlLoginPromptBody">
              <p className="dshBrowserCtlLoginPromptText">{t('loginRequiredDesc')}</p>
              <div className="dshBrowserCtlLoginPromptActions">
                <Button variant="secondary" size="sm" onClick={() => setLoginPrompt(false)}>
                  {t('cancel')}
                </Button>
                <Button variant="primary" size="sm" onClick={() => { setLoginPrompt(false); setAccountOpen(true) }}>
                  {t('aboutAccount')}
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

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


export const inject = ['slots', 'locale']

export function apply(ctx) {
  const view = defineStore({
    init: () => ({ open: false }),
    actions: {
      open: draft => { draft.open = true },
      close: draft => { draft.open = false },
    },
  })
  ctx.effect(() => ctx.locale.register(NS, {
    zh: {
      tab: 'DSH 远程助手',
      tabConnect: '连接',
      tabDevices: '设备',
      tab2fa: '2FA',
      tabBan: '黑名单',
      tabLog: '日志',
      tabApp: 'App 配对',
      tabPush: '推送',
      appSubtitle: '手机 App 扫一次,之后打开免扫码直连',
      appQrAlt: '手机 App 长期配对二维码',
      appLoading: '正在生成长期配对码…',
      appReady: '长期配对码已生成',
      appFailed: '配对码生成失败',
      appOnceHint: '这是长期配对码:手机 App 扫码后登记设备并保存登录状态,之后打开免扫码直连。若扫「连接」页的一次性二维码,只会获得 1 小时临时会话,不会长期绑定。',
      appRefresh: '刷新配对码',
      appCopyLink: '复制配对链接',
      appNoQr: '长期配对码不可用',
      subtitle: '手机扫码或复制链接,直接打开本机助手面板',
      about: '关于',
      config: '配置',
      aboutAccount: '账号登录',
      aboutAccountLogged: '已登录',
      loginRequired: '需要先登录',
      loginRequiredDesc: '使用官方服务器需要先登录账号,登录后才会分配专属入口。点击下方按钮前往登录。',
      startFailed: '启动失败:',
      aboutDesc: '把本机 DeepSeek 助手 Web 面板安全穿透到手机或外网浏览器,随时随地远程控制。',
      aboutWebsite: '官网',
      aboutGithub: 'GitHub',
      aboutApp: 'App 下载',
      updateCheck: '检查更新',
      updateChecking: '检查中…',
      updateRecheck: '重新检查',
      updateCur: '当前版本',
      updateLst: '最新版本',
      updateFound: '发现新版本 v{v}',
      updateDownload: '下载新版本',
      updateNotesTitle: '更新说明',
      updateUpToDate: '已是最新版本',
      updateFailed: '更新检查失败',
      legalTerms: '用户协议',
      legalPrivacy: '隐私政策',
      legalMeta: '生效 {d} · 版本 {v}',
      legalAck: '我知道了',
      configSubtitle: '选择连接官方服务器或你自己的 frps 服务器',
      configOfficial: '官方服务器',
      configOfficialHint: '注册 / 登录官方账号,开箱即用',
      configOfficialNote: '使用官方服务器:登录(或注册)账号后自动分配专属入口,无需手工填写任何服务器信息。',
      configAcctTitle: '官方账号',
      configAcctLoggedIn: '已登录',
      configAcctPort: '专属端口',
      configAcctLogout: '退出登录',
      configAcctLoggingOut: '退出中…',
      configAcctLoggedOut: '已退出(隧道将断开,重新登录可恢复)',
      configAcctOauthBtn: '登录 / 注册官方账号',
      configAcctOauthHint: '将打开浏览器跳转官网,在网页完成登录/注册后自动回调',
      configAcctOauthOpening: '正在打开浏览器…',
      configAcctOauthWait: '等待授权…',
      configAcctOauthOpenBrowser: '已打开浏览器:请在官网页面登录账号并点「确认授权」。若未自动打开,请点下方按钮重试。',
      configAcctOauthOpenAgain: '重新打开授权页',
      configAcctOauthOpenFail: '自动打开浏览器失败:请点下方链接手动打开授权页。',
      configAcctCopy: '复制链接',
      configAcctCopied: '已复制',
      configAcctOauthCancel: '取消',
      configAcctOauthExpired: '授权已过期,请重新发起。',
      configAcctOauthFail: '授权失败:',
      configAcctOauthNetwork: '官方服务器暂时不可达,请稍后再试。',
      configAcctOauthDone: '授权成功,正在应用账号与专属端口…',
      configAcctRestartFail: '登录成功,但隧道重启失败:请点「开始控制」手动启动。',
      configAcctLoadFail: '官方服务器暂时不可达,请稍后再试。',
      configSelfhost: '自建服务器',
      configSelfhostHint: '使用你自己的 frps 服务器',
      configHost: '服务器地址 (host)',
      configHostPh: '例如 frps.example.com',
      configPort: 'frps 端口',
      configRemotePort: '远程端口 (可选)',
      configToken: 'FRP token',
      configTokenPh: '输入 frps 认证 token',
      configTokenKeep: '已保存(留空保持不变)',
      configTokenNote: 'Token 仅保存在本机 browserctl_secrets.json(已被 gitignore 排除,不会提交或上传)。',
      configHostRequired: '请填写服务器地址',
      save: '保存',
      saving: '保存中…',
      saved: '已保存',
      cancel: '取消',
      close: '关闭',
      startCtl: '开始控制',
      starting: '正在启动隧道…',
      stopCtl: '停止控制',
      stopping: '正在停止…',
      copyLink: '复制链接',
      copied: '已复制',
      refresh: '刷新二维码',
      openPanel: '打开面板',
      qrAlt: '配对二维码',
      pairOnce: '一次性配对链接',
      pairLeft: '剩余',
      pairExpired: '配对已过期,点"刷新二维码"重新生成',
      pairStatic: '引导链接(24 小时有效)',
      pairAppTempNote: '手机 App 扫此码只获得 1 小时临时会话,不会长期绑定;要长期免扫码请用「App 配对」页签。',
      pairUses: '已扫码',
      pairUsesLabel: '扫码次数',
      pairUsesOne: '1 次(扫完换码)',
      pairUsesTimes: '次',
      pairSwap: '换一个码',
      linkTitle: 'iOS / 无 App 设备',
      linkSubtitle: '给没有 App 的设备(iPhone / iPad)生成一条长期引导链接:打开一次即免验证 30 天,再「添加到主屏幕」当 App 用。',
      linkTtlLabel: '链接有效期',
      linkTtl1h: '1 小时',
      linkTtl24h: '24 小时',
      linkTtl7d: '7 天',
      linkGenerate: '生成引导链接',
      linkGenerating: '正在生成…',
      linkRegenerate: '重新生成',
      linkCopy: '复制链接',
      linkCopied: '已复制',
      linkReady: '链接已生成',
      linkQrAlt: '引导链接二维码',
      linkScanHint: '用 iPhone 相机直接扫这个码即可打开(也可复制下方链接)。',
      linkExpires: '有效期至 {t}',
      linkUsesLabel: '可用次数',
      linkUses1: '1 次(一次性)',
      linkUses3: '3 次',
      linkUses5: '5 次',
      linkUsesUnlimited: '不限次数',
      linkUsesSuffix: '可用 {n} 次',
      linkStepsTitle: 'iPhone 操作步骤',
      linkStep1: '用 Safari 打开这条链接并完成一次验证,进入面板(地址栏应以 /p/<端口>/ 或 /dsh-remote/p/… 开头;不要用微信内置浏览器,不要开无痕模式)',
      linkStep2: '在面板页面上点 Safari 底部「分享」→「添加到主屏幕」(不要在引导链接页上加:这条链接是一次性的,用完即失效)',
      linkStep3: '从主屏幕图标打开:这是独立窗口,Cookie 与 Safari 互不相通,需要再完成一次动态码验证',
      linkStep4: '之后点主屏图标 30 天内免验证;Safari 与主屏 App 各自独立,互不影响',
      linkNote: '链接是明文,别发公开群;介意就把有效期调短,用完后可「重新生成」。',
      statusLoading: '正在生成二维码…',
      statusReady: '隧道就绪,扫码即可打开面板',
      statusTunnelStarting: '隧道正在建立,请稍候几秒后刷新二维码',
      statusNoSecret: '隧道未就绪:点下方"开始控制"启动本机穿透,几秒后自动出二维码',
      totpTitle: '两步验证 (2FA)',
      totpOn: '已启用',
      totpOff: '未启用',
      totpHint: '启用后,所有设备打开面板前必须先输入验证器 6 位动态码(RFC 6238);连错 5 次冻结 15 分钟,同码防重放。绑定方式:用手机验证器扫描下方二维码或手动输入密钥。',
      totpHintShort: '开启后,手机打开面板需先输入验证器 6 位动态码;连错 5 次冻结 15 分钟。',
      totpBind: '2FA 绑定二维码',
      totpSecretLabel: '密钥(手动输入用)',
      totpEnable: '启用 2FA',
      totpDisable: '禁用 2FA',
      totpReset: '重置密钥',
      totpKick: '全部踢下线',
      devicesTitle: '在线设备',
      devicesOnline: '在线 {n} 台',
      noDevices: '暂无已验证设备',
      noOnlineDevices: '当前没有设备在线',
      noDevicesHint: '手机扫码打开面板并通过动态码验证后,设备会显示在这里;本机直开的面板不计入。',
      deviceSeen: '活跃:',
      deviceKick: '踢下线',
      copySecret: '复制密钥',
      logTitle: '运行日志',
      logEmpty: '暂无日志。设备验证、踢下线、2FA 开关都会记录在这里。',
      banTitle: 'IP 黑名单',
      banEmpty: '暂无被封禁的 IP 地址。在设备列表点“拉黑”可添加。',
      pushTitle: '消息推送',
      pushDesc: '把设备连入、被踢、黑名单、2FA、配对等安全事件,以及系统消息实时推送到你的手机。',
      pushOn: '已开启',
      pushOff: '未开启',
      pushEnabledLabel: '接收手机推送',
      pushEnabledHint: '总开关:开启后手机可收到本机面板的推送消息',
      pushSystemLabel: '系统安全事件',
      pushSystemHint: '设备连入 / 被踢 / 黑名单 / 2FA / 配对',
      pushTest: '发送测试推送',
      pushTesting: '发送中…',
      pushTestTitle: '测试推送',
      pushTestBody: '这是一条来自 DSH 远程助手的测试推送消息',
      pushTestOk: '测试推送已发送',
      pushTestFail: '测试推送发送失败',
      pushSaveFailed: '设置保存失败',
      pushRecent: '最近推送',
      pushRefresh: '刷新',
      pushRefreshing: '刷新中…',
      pushEmpty: '暂无推送。开启推送后,安全事件会显示在这里。',
      pushPollFailed: '读取推送配置失败',
      pushKindTest: '测试',
      pushKindVerify: '验证',
      pushKindKick: '踢下线',
      pushKindBan: '黑名单',
      pushKindTotp: '2FA',
      pushKindPair: '配对',
      pushKindJoin: '设备连入',
      pushKindDev: '设备',
    },
    en: {
      tab: 'DshRemote',
      tabConnect: 'Connect',
      tabDevices: 'Devices',
      tab2fa: '2FA',
      tabBan: 'Blacklist',
      tabLog: 'Log',
      tabApp: 'App Pairing',
      tabPush: 'Push',
      appSubtitle: 'Scan once to pair; the app reconnects without scanning',
      appQrAlt: 'Long-term pairing QR code',
      appLoading: 'Generating long-term pairing code…',
      appReady: 'Long-term pairing code ready',
      appFailed: 'Failed to generate pairing code',
      appOnceHint: 'This is a long-term pairing code: the app registers the device and saves its login, then reconnects without scanning. Scanning the one-time QR on the "Connect" tab only grants a 1-hour temporary session, not a persistent binding.',
      appRefresh: 'Refresh pairing code',
      appCopyLink: 'Copy pairing link',
      appNoQr: 'Long-term pairing code unavailable',
      subtitle: 'Scan or copy the link to open this panel from any device',
      about: 'About',
      config: 'Settings',
      aboutAccount: 'Sign in',
      aboutAccountLogged: 'Signed in',
      loginRequired: 'Sign in required',
      loginRequiredDesc: 'Using the official server requires signing in first; a dedicated entry is assigned after login. Tap below to sign in.',
      startFailed: 'Start failed:',
      aboutDesc: 'Securely tunnel this DeepSeek assistant web panel to your phone or any browser for remote control, anywhere.',
      aboutWebsite: 'Website',
      aboutGithub: 'GitHub',
      aboutApp: 'App Download',
      updateCheck: 'Check for updates',
      updateChecking: 'Checking…',
      updateRecheck: 'Check again',
      updateCur: 'Current version',
      updateLst: 'Latest version',
      updateFound: 'New version v{v} available',
      updateDownload: 'Download',
      updateNotesTitle: 'Release notes',
      updateUpToDate: 'You are up to date',
      updateFailed: 'Update check failed',
      legalTerms: 'User Agreement',
      legalPrivacy: 'Privacy Policy',
      legalMeta: 'Effective {d} · Version {v}',
      legalAck: 'Got it',
      configSubtitle: 'Connect to the official server or your own frps server',
      configOfficial: 'Official server',
      configOfficialHint: 'Register / sign in to your official account — works out of the box',
      configOfficialNote: 'Official server: sign in (or register) and a dedicated entry is assigned automatically — no server details to fill in.',
      configAcctTitle: 'Official account',
      configAcctLoggedIn: 'Signed in',
      configAcctPort: 'Dedicated port',
      configAcctLogout: 'Sign out',
      configAcctLoggingOut: 'Signing out…',
      configAcctLoggedOut: 'Signed out (tunnel will disconnect; sign in again to restore)',
      configAcctOauthBtn: 'Sign in / Register',
      configAcctOauthHint: 'Your browser will open the official site to sign in / register, then come back automatically',
      configAcctOauthOpening: 'Opening browser…',
      configAcctOauthWait: 'Waiting for approval…',
      configAcctOauthOpenBrowser: 'Browser opened: sign in to your account on the site and click "Approve". If it did not open, use the button below.',
      configAcctOauthOpenAgain: 'Reopen approval page',
      configAcctOauthOpenFail: 'Could not open your browser automatically — open the approval page via the link below.',
      configAcctCopy: 'Copy link',
      configAcctCopied: 'Copied',
      configAcctOauthCancel: 'Cancel',
      configAcctOauthExpired: 'Authorization expired, please start again.',
      configAcctOauthFail: 'Authorization failed:',
      configAcctOauthNetwork: 'Official server unreachable, please try again later.',
      configAcctOauthDone: 'Authorized — applying your account and dedicated port…',
      configAcctRestartFail: 'Signed in, but tunnel restart failed: press "Start" to launch it manually.',
      configAcctLoadFail: 'Official server unreachable, please try again later.',
      configSelfhost: 'Self-hosted server',
      configSelfhostHint: 'Use your own frps server',
      configHost: 'Server address (host)',
      configHostPh: 'e.g. frps.example.com',
      configPort: 'frps port',
      configRemotePort: 'Remote port (optional)',
      configToken: 'FRP token',
      configTokenPh: 'Enter the frps auth token',
      configTokenKeep: 'Saved (leave blank to keep)',
      configTokenNote: 'Token is stored only in local browserctl_secrets.json (gitignored, never committed or uploaded).',
      configHostRequired: 'Server address is required',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved',
      cancel: 'Cancel',
      close: 'Close',
      startCtl: 'Start control',
      starting: 'Starting tunnel…',
      stopCtl: 'Stop control',
      stopping: 'Stopping…',
      copyLink: 'Copy link',
      copied: 'Copied',
      refresh: 'Refresh QR',
      openPanel: 'Open panel',
      qrAlt: 'Pairing QR code',
      pairOnce: 'One-time pairing link',
      pairLeft: 'expires in',
      pairExpired: 'Pairing expired — refresh to generate a new one',
      pairStatic: 'Bootstrap link (valid for 24 hours)',
      pairAppTempNote: 'Scanning this code with the app grants only a 1-hour temporary session; for long-term pairing use the "App pairing" tab.',
      pairUses: 'used',
      pairUsesLabel: 'Uses',
      pairUsesOne: '1 use (rotate after scan)',
      pairUsesTimes: 'uses',
      pairSwap: 'New code',
      linkTitle: 'iOS / No-App devices',
      linkSubtitle: 'Generate a long-lived bootstrap link for devices without the app (iPhone / iPad): open it once to skip verification for 30 days, then "Add to Home Screen" to use it like an app.',
      linkTtlLabel: 'Link validity',
      linkTtl1h: '1 hour',
      linkTtl24h: '24 hours',
      linkTtl7d: '7 days',
      linkGenerate: 'Generate link',
      linkGenerating: 'Generating…',
      linkRegenerate: 'Regenerate',
      linkCopy: 'Copy link',
      linkCopied: 'Copied',
      linkReady: 'Link ready',
      linkQrAlt: 'Bootstrap link QR code',
      linkScanHint: 'Scan this code with the iPhone camera to open it (or copy the link below).',
      linkExpires: 'Valid until {t}',
      linkUsesLabel: 'Max uses',
      linkUses1: '1 (single use)',
      linkUses3: '3 times',
      linkUses5: '5 times',
      linkUsesUnlimited: 'Unlimited',
      linkUsesSuffix: '{n} use(s)',
      linkStepsTitle: 'iPhone steps',
      linkStep1: 'Open the link in Safari and verify once to enter the panel (the address bar should start with /p/<port>/ or /dsh-remote/p/…; not WeChat in-app browser, not private mode)',
      linkStep2: 'On the panel page, tap Share → "Add to Home Screen" (never on the invite page itself: that link is one-time and dies after first use)',
      linkStep3: 'Open the home-screen icon: it is a standalone window with storage separate from Safari, so verify once more there',
      linkStep4: 'Launching from the icon stays verification-free for 30 days; Safari and the home-screen app are independent',
      linkNote: 'The link is plain text — don\'t post it publicly; shorten the validity if concerned, and regenerate after use.',
      statusLoading: 'Generating QR code…',
      statusReady: 'Tunnel ready — scan to open the panel',
      statusTunnelStarting: 'Tunnel starting; refresh the QR in a few seconds',
      statusNoSecret: 'Tunnel not ready: click "Start control" below, QR appears in a few seconds',
      totpTitle: 'Two-Factor Auth (2FA)',
      totpOn: 'Enabled',
      totpOff: 'Disabled',
      totpHint: 'When enabled, every device must pass a 6-digit authenticator code (RFC 6238) before opening the panel; 5 wrong tries lock for 15 minutes; replayed codes are rejected.',
      totpHintShort: 'Devices must enter a 6-digit code to open the panel; 5 wrong tries lock for 15 minutes.',
      totpBind: '2FA binding QR code',
      totpSecretLabel: 'Secret (manual entry)',
      totpEnable: 'Enable 2FA',
      totpDisable: 'Disable 2FA',
      totpReset: 'Reset secret',
      totpKick: 'Kick all devices',
      devicesTitle: 'Online devices',
      devicesOnline: '{n} online',
      noDevices: 'No verified devices yet',
      noOnlineDevices: 'No devices online right now',
      noDevicesHint: 'Devices appear here after opening the panel via the QR link and passing the 2FA code; locally opened panels are not counted.',
      deviceSeen: 'Active:',
      deviceKick: 'Kick',
      copySecret: 'Copy secret',
      logTitle: 'Event log',
      logEmpty: 'No events yet. Device verifications, kicks and 2FA toggles are recorded here.',
      banTitle: 'IP Blacklist',
      banEmpty: 'No banned IPs. Click "Ban" on a device to add.',
      pushTitle: 'Push Notifications',
      pushDesc: 'Realtime push of security events — device connect / kick / blacklist / 2FA / pairing — plus system messages to your phone.',
      pushOn: 'On',
      pushOff: 'Off',
      pushEnabledLabel: 'Receive phone push',
      pushEnabledHint: 'Master switch: receive push from this panel on your phone',
      pushSystemLabel: 'Security events',
      pushSystemHint: 'Device connect / kick / blacklist / 2FA / pairing',
      pushTest: 'Send test push',
      pushTesting: 'Sending…',
      pushTestTitle: 'Test push',
      pushTestBody: 'This is a test push from DSH Remote Assistant',
      pushTestOk: 'Test push sent',
      pushTestFail: 'Failed to send test push',
      pushSaveFailed: 'Failed to save settings',
      pushRecent: 'Recent pushes',
      pushRefresh: 'Refresh',
      pushRefreshing: 'Refreshing…',
      pushEmpty: 'No pushes yet. Security events will appear here once push is enabled.',
      pushPollFailed: 'Failed to load push config',
      pushKindTest: 'Test',
      pushKindVerify: 'Verify',
      pushKindKick: 'Kick',
      pushKindBan: 'Ban',
      pushKindTotp: '2FA',
      pushKindPair: 'Pair',
      pushKindJoin: 'Connect',
      pushKindDev: 'Device',
    },
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
