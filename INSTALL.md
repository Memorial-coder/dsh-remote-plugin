# DshRemote 安装指南

## 包内容

| 文件/目录 | 说明 |
|---|---|
| `browserctl.py` | 核心网关（单文件）：本机闸机 + frpc 隧道 + 2FA/配对/设备管理 + 服务器端自动部署 |
| `frpc.exe` | FRP 客户端（Windows） |
| `win_push.py` / `push_toast.ps1` | Windows 消息推送驻留 |
| `requirements.txt` | Python 依赖（paramiko，用于 SSH 操作） |
| `dsh-plugin-browserctl/` | DSH 插件（含预构建产物 `lib/`，免构建直接挂载） |
| `browserctl_pwa/` | PWA 图标与 Service Worker |

## 系统要求

- Windows / macOS / Linux
- Python 3.10+
- [DeepSeek Harness (DSH)](https://dsh.venice.ai) 已安装运行
- （自建模式）一台有公网 IP 的 Linux 服务器 + 已运行的 frps

---

## 方案一：官方托管（推荐，免配置）

使用官方服务器 `remote.ymzcc.com`，无需自己的 frps。

**1. 把插件装进 DSH**

```json
// 编辑 %USERPROFILE%\.dsh\profiles\<你的profile>\package.json
// 在 dependencies 中加一行：
"dsh-plugin-browserctl": "link:C:/path/to/dsh-remote-plugin/dsh-plugin-browserctl"
```

重启 DSH，侧边栏出现「远程助手」按钮。

**2. 登录官方账号**

点击插件 → 设置 → 服务器方案 →「官方」→ 注册/登录。登录成功后插件自动获取服务器配置。

**3. 开始使用**

点击「开始控制」，网关自动启动隧道。手机/外网浏览器访问 `https://remote.ymzcc.com/p/17901/` 即可远控 DSH 面板。

---

## 方案二：自建服务器（完全自主）

前提：一台有公网 IP 的 Linux 服务器，已运行 frps（建议端口 17000，allowPorts 包含你分配的端口范围），安装 OpenResty/Nginx。

**1. 安装 Python 依赖**

```bash
pip install -r requirements.txt
```

**2. 配置服务器信息**

```bash
python browserctl.py secrets init
```

交互式填写：SSH 主机/用户/密码或密钥、FRP 服务器地址与 Token、公网域名。

**3. 信任服务器主机密钥**

```bash
python browserctl.py ssh-trust
```

**4. 自动部署服务端反代**

```bash
python browserctl.py nginx
```

在服务器上安装 nginx 反代配置 + Cookie 签名门禁（失败自动回滚）。

**5. 启动**

```bash
python browserctl.py start
```

查看状态：

```bash
python browserctl.py status
```

---

## 构建插件（可选）

如需修改插件源码后重新构建：

```powershell
cd dsh-plugin-browserctl
npm install          # 或 pnpm install
node build.mjs       # 重建 lib/index.js + lib/client.js
node test/smoke.cjs  # 冒烟测试
```

---

## 目录结构

```
dsh-remote-plugin/
├── browserctl.py          网关核心（单文件）
├── frpc.exe               FRP 客户端
├── win_push.py            推送驻留
├── push_toast.ps1         推送脚本
├── requirements.txt       Python 依赖
├── browserctl_pwa/        PWA 资源
├── dsh-plugin-browserctl/ DSH 插件
│   ├── src/               插件源码
│   ├── lib/               构建产物（免构建直接挂载）
│   └── ...
├── INSTALL.md             本文件
└── README.md
```
