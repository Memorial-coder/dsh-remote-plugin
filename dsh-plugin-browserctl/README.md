# dsh-plugin-browserctl · DSH 远程助手（DshRemote）

把本机 DeepSeek 助手 Web 面板安全穿透到手机与外网浏览器的 DSH 持久插件（bundle）：
侧边栏一键开关隧道、扫码/引导链接配对、2FA、设备管理、黑名单与消息推送。

## 形态

- Host 半：`lib/index.js`（ESM）。注册 `/browserctl/api/*` 与 `/browserctl-gate/*` 本机路由，
  仅监听回环；`export const inject = ['webServer']` + `apply(ctx)`，全部资源走 `ctx.effect` 注册。
- Client 半：`lib/client.js`。`window.__ModuleLoader__.load({ id, factory })` 包裹，
  注册 `sidebar.footer.action` 与 `shell.overlay` 槽位；文案走 `ctx.locale.register`（zh/en）。
- 安装：作为 DSH profile bundle（`dsh.bundle.patch` → `cordis.patch.yml` 插入插件行）。

## 构建 / 测试

```powershell
npm install          # 或 pnpm install（esbuild + qrcode 均为 devDependency，构建期内联）
node build.mjs       # 重建 lib/index.js(ESM) + lib/client.js(__ModuleLoader__ 包裹)
node test/smoke.cjs  # 最小 React 渲染冒烟
```

改 `src/` 后必须重建；client 半刷新页面即生效，host 半需重启 DSH。

## 与仓库核心的耦合

闸机核心 `browserctl.py` 与运行态文件（state/sessions/secrets 等）位于**本包上一级的仓库根**，
host 半用 `import.meta.url` 相对解析（`../../`）。本包按 profile `link:` 方式安装，
与仓库同分布；单独发布 npm 包需先把核心与数据目录迁入包内。
