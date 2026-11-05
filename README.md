# DshRemote · 让 DeepSeek 助手随时随地远程访问

> DSH 远程助手（DshRemote）：一款 [DeepSeek Harness (DSH)](https://dsh.venice.ai) Web 面板配套工具，
> 一键把本机 DSH 面板安全穿透到手机与外网浏览器，随时随地远程控制自己的电脑，全程 AI 辅助。

<p align="center">
  <img src="screenshots/01-landing.png" alt="DshRemote 官网首页" width="80%">
</p>

## 功能一览

| 功能 | 说明 |
|------|------|
| 扫码即连 | 手机扫描二维码，30 秒内完成配对，无需配置路由器端口映射 |
| 一次性 / 长期配对 | 临时会话用一次性码，常用设备用长期配对码自动保存 |
| 场景配对 | 支持 iOS / 无 App 设备通过 Safari 验证，30 天免登录 |
| 两步验证 2FA | TOTP (RFC 6238) 动态验证码 + 30 天 Cookie 设备信任，兼顾安全与便捷 |
| 设备管理 | 在线设备列表、设备详情、一键踢下线 |
| IP 黑名单 | 暴力破解自动封禁，自定义黑名单规则 |
| 消息推送 | Windows 原生 Toast 推送，安全事件实时提醒 |
| 操作日志 | 配对、踢人、验证等关键操作全记录 |
| PWA 支持 | 添加到手机主屏幕全屏使用，无需安装 App |
| 自建 / 托管 | 默认官方服务器即开即用，也支持自建 frps 服务器 |
| 多用户隔离 | 每位用户专属入口，设备互不干扰 |
| 引导链接 | 生成一次性引导链接分享给朋友，免注册直接访问 |

## 截图

### 插件面板：扫码连接

<p align="center">
  <img src="screenshots/02-plugin-panel.png" alt="DSH 远程助手插件面板" width="80%">
</p>

DSH 侧边栏的远程控制面板，集成了二维码配对、设备管理、两步验证、App 配对、消息推送、黑名单和日志查看等功能，一站式管理所有远程连接。

### 手机 App：三步连接

<p align="center">
  <img src="screenshots/03-app-guide.png" alt="手机 App 三步连接指南" width="80%">
</p>

三步完成连接：
1. 电脑端插件一键生成配对码
2. 手机扫描二维码，30 秒验证
3. 验证成功后 30 天内免登录，随时远程接管

### 手机 App 首页

<p align="center">
  <img src="screenshots/04-app-home.jpg" alt="手机 App 首页" width="60%">
</p>

已连接的设备一目了然，支持多设备管理。点击「扫码连接」随时添加新设备。

### 远程控制：AI 对话

<p align="center">
  <img src="screenshots/05-remote-chat.jpg" alt="远程控制后的 AI 对话界面" width="80%">
</p>

连接成功后直接在手机上操控 DeepSeek 助手，写代码、处理文件、整理文档，和本地使用完全一样。

### 桌面客户端

<p align="center">
  <img src="screenshots/06-desktop-client.png" alt="DeepSeek Harness 桌面客户端" width="80%">
</p>

完整的 DeepSeek Harness 桌面体验：工作区管理、插件扩展、自动化任务、远程控制入口。

## 快速开始

完整安装步骤见 [INSTALL.md](INSTALL.md)。

**官方托管**（推荐）：注册/登录官方账号即用，服务器自动分配专属入口，开箱即用

```
1. 在 DSH 中安装本插件
2. 侧边栏打开「DSH 远程助手」→ 点击「开始控制」
3. 手机扫码二维码，即可远程访问
```

**自建服务器**：配置自己的 frps 服务器；密钥仅保存在本机，不会被提交或上传

## 架构

```
手机/外网浏览器
  → https://remote.ymzcc.com/dsh-remote/p/<uid>/    (官方托管: 每位用户专属入口, HTTPS 443)
  → OpenResty/Nginx (Lua Cookie 签名门禁)
  → frps (KCP/UDP)
  → frpc 隧道
  → 本机闸机 browserctl.py（2FA + 会话 + 看门狗）
  → DSH Web 面板
```

> 说明：官方托管模式下每位用户登录后都有自己的专属入口 `/dsh-remote/p/<uid>/`（uid 稳定，换端口不断连）。

## 安全性

- **数据本地**：所有 AI 对话和文件处理都在本机 DSH 中运行，数据不上传第三方服务器
- **端到端加密**：frp 隧道全程加密传输
- **双重验证**：TOTP 2FA + Cookie 设备信任，暴力破解自动封禁
- **设备隔离**：多设备同时在线互不干扰，支持定向踢出

## 目录结构

```
├── browserctl.py           核心闸机（单文件，4800+ 行）
│                           ├── 本地 HTTP 网关
│                           ├── frpc 隧道管理
│                           ├── TOTP 2FA 验证
│                           ├── 设备配对与会话管理
│                           ├── IP 黑名单与暴力破解防护
│                           ├── 看门狗进程（自动恢复）
│                           └── CLI 命令行工具
├── dsh-plugin-browserctl/  DSH 插件
│   ├── src/index.js        host 半：API 路由注册
│   ├── src/client.jsx      client 半：侧边栏面板 UI
│   └── lib/                构建产物（esbuild）
├── frpc.exe                FRP 客户端（Windows）
├── win_push.py             Windows 消息推送驻留
├── push_toast.ps1          PowerShell 推送脚本
├── screenshots/            功能截图
└── INSTALL.md              安装指南
```

## 开源许可

MIT License · 2026 DshRemote Project

---

**注意**：需要 Python 3.10+ 与 DSH 运行环境；官方服务器 remote.ymzcc.com 开箱即用，也支持自建 frps。
