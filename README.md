# DshRemote · 让 DeepSeek 助手 Web 面板随时随地远程访问

> DSH 远程助手（DshRemote）：一款 [DeepSeek Harness (DSH)](https://dsh.venice.ai) Web 配套工具，
> 一键把本机 DSH 面板安全穿透到手机与外网浏览器，随时随地远程控制自己的电脑，全程 AI 辅助。

## 特性

- **一键穿透**：把 DSH 面板经内网穿透（frp）暴露到公网，手机/外网浏览器随时访问
- **两步验证**：TOTP 2FA（RFC 6238）+ 30 天 Cookie 设备信任，验证一次长期免登录
- **设备管理**：在线设备列表、踢下线、IP 黑名单
- **消息推送**：Windows 原生推送，安全事件实时提醒
- **引导链接**：iOS / 无 App 设备 Safari 验证一次，30 天免验证
- **PWA 支持**：添加到主屏幕全屏使用，无需安装 App
- **自建/托管**：默认官方服务器即开即用，也支持自建 frps 服务器

## 快速开始

完整安装步骤见 [INSTALL.md](INSTALL.md)。

**官方托管**：注册/登录官方账号即用，服务器自动分配专属入口，开箱即用

**自建服务器**：配置自己的 frps 服务器；密钥仅保存在本机，不会被提交或上传

## 架构

```
手机/外网浏览器
  → https://remote.ymzcc.com/p/17901/          (HTTPS 443)
  → OpenResty/Nginx (Lua Cookie 签名门禁)
  → frps (KCP/UDP)
  → frpc 隧道
  → 本机闸机 browserctl.py（2FA + 会话 + 看门狗）
  → DSH Web 面板
```

除了 DSH 插件侧边栏的远程控制 UI，本仓库还包含配套的闸机核心 browserctl.py，负责实际的隧道与安全控制。

## 目录结构

- browserctl.py：核心闸机（单文件，4800+ 行）：本地 HTTP 网关 + frpc 隧道 + 2FA/配对/设备管理 + 看门狗
- dsh-plugin-browserctl/：DSH 插件 bundle：host 半路由注册 + client 半面板 UI
- frpc.exe：FRP 客户端（Windows）
- win_push.py：Windows 消息推送驻留

## 开源许可

MIT License · 2026 DshRemote Project

---

**注意**：需要 Python 3.10+ 与 DSH 运行环境；官方服务器 remote.ymzcc.com 开箱即用，也支持自建 frps。