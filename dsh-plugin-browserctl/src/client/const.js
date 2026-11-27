// ---------- 插件身份与全局常量 ----------
// client 侧依赖分层最底层:唯一允许顶层求值副作用的地方(API_P 的页面路径
// 探测等),其它模块按依赖方向向下引用。纯搬移自 client.jsx,零逻辑改动。

export const NS = 'browserctl'
// 标记:更新「自动弹窗」与「一键自更新」对测试版禁用(工作区被覆盖就丢开发态),
// 但版本检查/「关于」按钮红点保留——同样能看到「有新版」提示,手动检查不受影响
export const IS_TEST = /-test$/.test(NS)
// 样式节点 id 按 NS 派生:双装时两份插件各用各的 <style>,不再互相覆盖
export const STYLE_ID = NS + '/styles'
// 插件版本号(「关于」面板展示)。单一来源 = package.json 的 version:
// build.mjs 用 esbuild --define:__DSHREMOTE_VERSION__ 注入,浏览器端只认这个注入值
// (不能 import fs/package.json,浏览器 bundle 里没有 Node 能力);源码未构建时显示 dev。
export const VERSION = typeof __DSHREMOTE_VERSION__ === 'string' ? __DSHREMOTE_VERSION__ : 'dev'
// 「关于」面板外部链接,集中一处管理,日后发布一次改齐
export const ABOUT_LINKS = {
  website: 'https://remote.ymzcc.com/dsh-remote/',
  github: 'https://github.com/Memorial-coder/dsh-remote-plugin',
  app: 'https://github.com/Memorial-coder/dsh-remote-plugin/releases/latest',
  qq: 'https://qm.qq.com/q/K6RXqOKLAu',
}
// 包安装形态(npm/github)用户的更新命令;版本源已定 GitHub Release,更新引导统一指 github: 通道
export const PLUGIN_ADD_CMD = 'dsh plugin add github:Memorial-coder/dsh-remote-plugin'
// 手机端 2FA 需要验证器 App 生成 TOTP 动态码;2FA 卡片提示指向的官方下载页(微软官网)
export const MS_AUTHENTICATOR_URL = 'https://www.microsoft.com/zh-cn/security/authenticator/mobile-app'
// 新版本提醒的「忽略此版本」状态:按版本号记 localStorage,发布新版本后再提醒
export function lsGet(k) { try { return window.localStorage.getItem(k) || '' } catch (e) { return '' } }
export function lsSet(k, v) { try { window.localStorage.setItem(k, v) } catch (e) {} }

// ---------- 顶栏「通知中心」本地水位(未登录已读判断) ----------
// 键带 NS:双装(正式版+测试版)两份面板各记各的水位,互不干扰。
// 值 = 最后一次打开通知列表时见过的最大 createdAt(毫秒);新于水位即视为未读。
export const MSG_SEEN_KEY = 'dsh_msg_seen_' + NS
export function msgSeenTs() { const v = parseInt(lsGet(MSG_SEEN_KEY), 10); return Number.isFinite(v) ? v : 0 }
export function msgIsSeen(msg) { return (Number(msg && msg.createdAt) || 0) <= msgSeenTs() }
// ---------- C7 推送深链：点手机通知直达对应会话（2026-11-20） ----------
// 链路：智能体 /notify?...&link=dshsession:<id> → 闸机通知行 → App push-poll →
// 点通知 → WebConsoleActivity 打开面板页并追加 #dshremote-open=<link>。
// 本函数在插件 apply 里调用：读 location.hash 里的 dshremote-open 参数，
// 通过官方 UI 导航服务（ctx.uiWorkspace.openSession）切换到对应会话，然后清掉
// hash（防刷新重复触发）。
//
// 安全边界：
//  - 只认 #hash（不进服务器日志、不吃 query）；值域只放会话 id 字符（宽松：
//    DSH 会话 id 是 UUID/短 id 形态，这里只放字母数字-_，≤120）；
//  - openSession 找不到会话时官方层静默/抛错，均吞掉，绝不影响面板正常启动；
//  - 不接受任意 URL/JS——插件只是把 id 交给宿主自己的导航 API，没有 eval 通道。
export const DEEPLINK_HASH_KEY = 'dshremote-open'
export const DEEPLINK_SID_RE = /^[A-Za-z0-9_-]{1,120}$/

export function consumeOpenSessionHash(openSession) {
  try {
    const h = String((typeof location !== 'undefined' && location.hash) || '')
    if (!h || h.length < DEEPLINK_HASH_KEY.length + 2) return
    const m = new RegExp('[#&]' + DEEPLINK_HASH_KEY + '=([^&]+)').exec(h)
    if (!m) return
    const raw = decodeURIComponent(m[1] || '')
    // 支持两种形态：dshsession:<sessionId> / 裸 sessionId
    const sid = raw.startsWith('dshsession:') ? raw.slice(11) : raw
    try { history.replaceState(null, '', location.pathname + location.search) } catch (e) {}
    if (!sid || !DEEPLINK_SID_RE.test(sid)) return
    // 会话列表可能尚未就绪（面板刚启动）：延迟到下一拍再试；失败静默
    const tryOpen = (delay) => setTimeout(() => {
      try { openSession(sid) } catch (e) { /* 会话不存在/已归档：忽略 */ }
    }, delay)
    tryOpen(0)
    tryOpen(1500)
  } catch (e) { /* 深链是尽力而为功能，任何异常都不许影响面板 */ }
}

// ---------- API 路径前缀(远程访问适配) ----------
// 面板不只跑在本机(127.0.0.1:<dsh端口>),还会被手机/外网浏览器经隧道访问,页面带路径前缀:
//   /p/<port>/...            → nginx 多用户块(按端口查 registry 验签后转发闸机)
//   /dsh-remote/p/<uid>/...  → 官网服务端 uid 稳定代理(按 uid 解析当前端口转发)
// 本插件所有 fetch 都是绝对路径('/browserctl/api/*'、'/browserctl-gate/*'),不加前缀会
// 落到域名根路径的静态反代 location(proxy_pass 指向生成时的固定端口)→ 端口一变就 502,
// 表现为「桌面正常、扫码进远控端后面板全部接口 502」。所以请求统一带上页面自身的前缀。
export function apiPrefix() {
  try {
    const p = String((typeof location !== 'undefined' && location.pathname) || '')
    let m = /^\/p\/(1[6-9]\d{4})(?=\/|$)/.exec(p)
    if (m) return '/p/' + m[1]
    m = /^\/dsh-remote\/p\/([a-z0-9]{8,32})(?=\/|$)/.exec(p)
    if (m) return '/dsh-remote/p/' + m[1]
  } catch {}
  return '' // 本机直连(桌面)无前缀
}
export const API_P = apiPrefix()