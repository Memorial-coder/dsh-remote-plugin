# DshRemote 安装指南

## 包内容

| 文件/目录 | 说明 |
|---|---|
| `browserctl.py` | 核心网关（单文件）：本机闸机 + frpc 隧道 + 2FA/配对/设备管理 + 服务器端自动部署 |
| `frpc.exe` | FRP 客户端（Windows） |
| `win_push.py` / `push_toast.ps1` | Windows 消息推送驻留 |
| `requirements.txt` | Python 依赖（paramiko，**仅自建模式的 `nginx` 自动部署需要**，官方托管用不到） |
| `dsh-plugin-browserctl/` | DSH 插件（含预构建产物 `lib/`，免构建直接挂载） |
| `fix-antivirus.ps1` | **一键修复杀软拦截**（Windows Defender 把 frpc.exe 判为 PUA 拦掉时用） |
| `browserctl_pwa/` | PWA 图标与 Service Worker |

## 系统要求

- Windows / macOS / Linux
- **Python 3.8+，但通常不需要你手动安装**：插件会按下面的顺序自动查找解释器，用第一个能跑的——

  1. 环境变量 `BROWSERCTL_PYTHON`
  2. 包内 `python/` 目录
  3. **DSH 自带运行时** `~/.dsh/dsh-runtimes/*/dependencies/python/` ← 从 DSH 里用就靠这条
  4. PATH 上的 `python` / `python3` / `py -3`

  `browserctl.py` **只依赖 Python 标准库**，不需要 `pip install` 任何东西。
  四条都找不到时，面板会直接显示原因和解决办法，不会静默失败。
- [DeepSeek Harness (DSH)](https://dsh.venice.ai) 已安装运行
- （自建模式）一台有公网 IP 的 Linux 服务器 + 已运行的 frps

---

## 方案一：官方托管（推荐，免配置）

使用官方服务器 `remote.ymzcc.com`，无需自己的 frps。**先决条件：一个官方账号**（到 <https://remote.ymzcc.com> 注册，注册后获得专属入口）。

**1. 把插件装进 DSH**

```bash
# 先安装插件运行时依赖（qrcode）。仓库不提交 node_modules，克隆后必须装一次：
cd dsh-plugin-browserctl
npm install        # 或 pnpm install
```

```json
// 编辑 %USERPROFILE%\.dsh\profiles\<你的profile>\package.json
// 在 dependencies 中加一行（把路径换成你 clone 下来的实际位置）：
"dsh-plugin-browserctl": "link:C:/实际路径/dsh-remote-plugin/dsh-plugin-browserctl"
```

重启 DSH，侧边栏出现「远程助手」按钮。

> 提示：
> - 插件与闸机核心 `browserctl.py` 同仓库分发、按 `link:` 方式安装，二者必须保持在同一目录树下；不要单独拷贝插件目录而漏掉闸机核心。
> - 必须先在插件目录执行 `npm install`，否则启用插件会报 `ERR_MODULE_NOT_FOUND: Cannot find package 'qrcode'`。

**2. 登录官方账号**

点击插件 → 设置 → 服务器方案 →「官方」→ 注册/登录。登录成功后插件自动获取服务器配置（专属端口、连接凭据）。

**3. 开始使用**

点击「开始控制」，网关自动启动隧道。**然后看插件面板显示的「专属入口」**——每位用户登录后都有一个自己的专属地址，形如：

```
https://remote.ymzcc.com/dsh-remote/p/<uid>/
```

- 把这个地址存到手机浏览器 / 添加到主屏幕，即可远程访问自己的 DSH 面板
- **不要使用 `https://remote.ymzcc.com/p/17901/`** —— 那是作者机器的种子端口，官方托管模式下每位用户都有独立端口，访问 17901 会连到作者机器而不是你自己

**4.（可选）消息推送**

登录并开启隧道后，插件的推送功能会自动拉起 `win_push.py`（长轮询通知中心弹窗），无需手动启动。

---

## 方案二：自建服务器（完全自主）

前提：一台有公网 IP 的 Linux 服务器，已运行 frps（建议端口 17000，allowPorts 包含你分配的端口范围），安装 OpenResty/Nginx。

**1. 安装 Python 依赖（仅自建模式需要；官方托管跳过）**

```bash
pip install -r requirements.txt
```

> 这一步只为 `browserctl.py nginx`（自动部署服务器端反代）装 `paramiko`。
> 闸机本身只用标准库，官方托管方案完全不需要装任何 Python 包。

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

## 常见问题与排障

### 官方托管连不上 / 打不开？

1. **确认已登录**：面板「设置 → 服务器方案 → 官方」显示已登录、有「专属端口」数字才算成功；显示"尚未登录"则先登录。
2. **访问的是专属入口**：用面板显示的专属地址 `https://remote.ymzcc.com/dsh-remote/p/<uid>/`，**不要用 `/p/17901/`**（那是作者机器端口）。
3. **隧道是否启动**：面板点「开始控制」，看状态是否为"运行中"；重启 DSH 后插件会自动后台重建隧道，稍等 10~20 秒。
4. **502 / 设备不在线**：说明你机器当前没在官方服务器登记（隧道未建或已释放）。回到插件面板确认隧道状态，必要时点一次「开始控制」。
5. **换网络 / 重启后连不上**：uid 专属入口与端口解耦，重启换端口也能通过 uid 找回自己机器，等待隧道重建即可。

### 自建模式跑不通？

1. `python browserctl.py status` 看各进程与端口；frpc 日志在 `browserctl_frpc.log`。
2. `python browserctl.py secrets init` 重填，确认 FRP 服务器地址/端口/Token 与 frps 实际一致。
3. `python browserctl.py ssh-trust` 信任主机密钥后重试 `nginx` 部署。
4. 服务端 allowPorts 必须包含你分配的端口范围；只放行了 17901 会导致专属端口连不上。

### 报 `PermissionError: [WinError 5] 拒绝访问` / 「无法运行: Access is denied」（Windows）

**根因**：Windows Defender 把 `frpc.exe` 判为 `PUA:Win32/FRProxy`（ThreatID 335323，潜在不受欢迎程序）
并阻止执行。**改名、换目录、换副本都没用**——它按文件判定，所有副本一起拦。
Windows 11 默认开启 PUA 拦截，所以这个坑相当常见。装了联想电脑管家（火绒引擎）/ 火绒 / 360 的机器，
它们还会各自再拦一次。

**一键修复**：仓库根目录的 `fix-antivirus.ps1` —— 右键 →「使用 PowerShell 运行」（会弹 UAC）：

```powershell
powershell -ExecutionPolicy Bypass -File .\fix-antivirus.ps1
```

它会：解除下载锁定 → 给本目录加 Defender 排除项 → 检查并询问是否关闭 PUA 拦截 →
实际跑一次 `frpc.exe -v` 验证并报告结果。

**手动修复**：

1. 管理员 PowerShell 在仓库根目录执行：`Get-ChildItem -Recurse | Unblock-File`
2. Windows 安全中心 → 病毒和威胁防护 →「病毒和威胁防护」设置 → 管理设置 → 排除项 →
   添加或删除排除项 → 添加排除项 → **文件夹** → 选本目录
   （若提示被「篡改防护」阻止，就用同样的图形界面手动加）
3. **关键一步**：Windows 安全中心 → 应用和浏览器控制 → 基于信誉的保护设置 →
   「潜在不受欢迎的应用」→ **关闭**。PUA 拦截开着时 frpc.exe 一定会被拦。
4. 联想电脑管家 / 火绒 / 360 的排除项与 Defender 相互独立，要各自在它的界面里加本目录
5. 验证 `.\frpc.exe -v` 能输出版本号；若 frpc.exe 已被隔离/删除，先重新 clone/解压再做上面步骤

### 看不到「远程助手」侧边栏按钮？

- 确认插件已按 `link:` 挂进 DSH profile 的 `dependencies`，且路径是 clone 下来的实际绝对路径。
- 改完 `package.json` 必须**重启 DSH**；client 半改动刷新页面即生效。
- 检查 DSH 版本是否满足插件要求。

### 推送收不到？

- 推送由插件随隧道自动拉起 `win_push.py`，需保持 DSH 运行；Windows 通知中心权限需允许本程序。
- 若用自建模式且未开推送，忽略即可，不影响核心远控。

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
