# dsh-remote-plugin · DSH 远程助手（DshRemote）

把本机 DeepSeek 助手 Web 面板安全穿透到手机与外网浏览器的 DSH 持久插件（bundle）：
侧边栏一键开关隧道、扫码/引导链接配对、2FA、设备管理、黑名单与消息推送。

> 本仓库发布的是 DSH 插件组件。要实际启动隧道、控制面板，需要配套的闸机核心
> （`browserctl.py` 网关 + frpc 隧道）配合，核心不在本仓库内。

## 特性

- 侧边栏一键开启/停止远程控制（开始控制 / 停止控制）
- 手机扫码 / 引导链接配对（一次性配对、iOS 无 App 引导链接、App 长期配对）
- 两步验证 2FA（TOTP，RFC 6238）
- 在线设备管理、踢下线、IP 黑名单、运行日志
- 消息推送（安全事件实时推送）
- 连接方式：默认官方服务器（注册/登录即用），也可自建 frps 服务器，两者并存

## 形态

- Host 半：`lib/index.js`（ESM）。注册 `/browserctl/api/*` 与 `/browserctl-gate/*` 本机路由，
  仅监听回环；`export const inject = ['webServer']` + `apply(ctx)`，资源走 `ctx.effect` 注册。
- Client 半：`lib/client.js`。`window.__ModuleLoader__.load({ id, factory })` 包裹，
  注册 `sidebar.footer.action` 与 `shell.overlay` 槽位；文案走 `ctx.locale.register`（zh/en）。

## 构建 / 测试

```powershell
npm install          # 或 pnpm install（esbuild + qrcode）
node build.mjs       # 重建 lib/index.js(ESM) + lib/client.js(__ModuleLoader__ 包裹)
node test/smoke.cjs  # 最小 React 渲染冒烟
```

改 `src/` 后必须重建；client 半刷新页面即生效，host 半需重启 DSH。

## 安装

作为 DSH profile bundle 安装（`dsh.bundle.patch` → `cordis.patch.yml` 插入插件行）。

## 配置

- 官方服务器：默认。注册/登录官方账号后自动分配专属入口，开箱即用。
- 自建服务器：填写自己的 frps 服务器地址、端口与 token；token 仅保存在本机，
  不会被提交或上传。

## 依赖

Host 半通过相对路径（`import.meta.url`）在插件目录上一级查找配套核心
（`browserctl.py` 与运行态文件），单独使用本插件前请先部署配套核心。
