# dsh-plugin-browserctl · DSH 远程助手（DshRemote）

把本机 DeepSeek Harness（DSH）Web 面板安全穿透到手机与外网浏览器的 DSH 持久插件（bundle）：
侧边栏一键开关隧道、扫码 / 引导链接配对、2FA、设备管理、黑名单与消息推送。

## 形态（自包含插件包）

- 包根**同时**是 DSH 插件包与闸机核心目录：`package.json`、`cordis.patch.yml`、`lib/` 与
  `browserctl.py`、`frpc.exe` 及运行态文件同层。host 半按 `import.meta.url` 相对解析到包根，
  插件包解压到任意目录都能直接跑。
- Host 半：`lib/index.js`（ESM）。注册 `/browserctl/api/*` 与 `/browserctl-gate/*` 本机路由，
  仅监听回环；`export const inject = ['webServer']` + `apply(ctx)`，资源走 `ctx.effect` 注册。
- Client 半：`lib/client.js`。`window.__ModuleLoader__.load({ id, factory })` 包裹，
  注册 `sidebar.footer.action`、`shell.overlay` 槽位；文案走 `ctx.locale.register`（zh/en）。
- 注册：`package.json` 的 `dsh.bundle.patch` 指向 `cordis.patch.yml`，向 profile 插入 `browserctl` 插件行。

## 安装

DSH →「设置」→ 插件页 →「添加插件」→「选择本地目录」→ 选中包根（能看到 `package.json` 的那一层）。
安装器自动写入该 profile 的 `link:` 依赖与 `dsh.profile.bundles` 并默认启用，**重启 DSH** 后侧边栏出现「远程助手」。

完整步骤（含官方账号登录、`frpc.exe` 被 PUA 拦截的处理）见包内 `INSTALL.md`。

## 运行时依赖

- **零 npm 依赖**：`qrcode` 在构建期已内联进 `lib/index.js`，运行时不读 `node_modules`，不需要 `npm install`。
- **Python 由 DSH 自带运行时提供**：按序探测 `BROWSERCTL_PYTHON` → 包内 `python/` →
  `~/.dsh/dsh-runtimes/*/dependencies/python/` → PATH；`browserctl.py` 只用标准库。
- 隧道需要包根 `frpc.exe`（Windows）；macOS / Linux 需自备对应平台的 frpc。

## 构建 / 测试（可选）

发行包已含 `lib/`，普通安装不需要构建。改了 `src/` 才执行：

```powershell
npm install      # 仅构建期依赖（esbuild）
node build.mjs   # 重建 lib/index.js(ESM, qrcode 内联) + lib/client.js(__ModuleLoader__ 包裹)
npm test         # test/smoke.cjs + test/layout.cjs
```

- 构建需要 Node 22.19+ 或 24+；改 `src/` 后必须重建。
- client 半刷新页面即生效，host 半需重启 DSH。

## 运行态文件

`browserctl_state.json`、`browserctl_secrets.json`、`browserctl_devices.json`、
`browserctl_grants.json`、`browserctl_*.log` 等都写在 `browserctl.py` 同目录（包根）。
升级插件时**保留这些文件**（删掉等于重新配对、TOTP 重置）；`browserctl_secrets.json` 含凭据，不要外传或提交。
