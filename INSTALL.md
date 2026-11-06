# DSH 远程助手（DshRemote）安装指南

把本机 DeepSeek Harness（DSH）的 Web 面板通过加密隧道穿透到手机或外网浏览器：
插件装进 DSH，闸机与 frpc 随插件包分发，装完重启 DSH 即可用。

- **官方托管（推荐）**：注册官方账号，服务器分配专属端口，不需要自建服务器
- **自建服务器**：用自己的 frps + 域名 + Nginx，完全自主

## 包内容

解压后的目录就是一个完整的 DSH 插件包：**不需要 `npm install`，也不需要另外安装 Python**。

| 文件 / 目录 | 说明 |
|---|---|
| `package.json` | DSH 插件清单：`main` 指向 `lib/index.js`，`dsh.bundle.patch` 指向 `cordis.patch.yml` |
| `cordis.patch.yml` | 插件注册补丁（向 profile 插入 `browserctl` 插件行） |
| `lib/` | 预构建产物：`index.js`（host 半）+ `client.js`（client 半），`qrcode` 已内联 |
| `src/` | 插件源码（只有改代码才用得到） |
| `locale/` | 中英文案（`zh.json` / `en.json`） |
| `icon.svg` | 侧边栏图标 |
| `browserctl.py` | 本机闸机（单文件）：HTTP 网关 + frpc 隧道 + 2FA/配对/设备管理 + 服务器反代部署 |
| `frpc.exe` | FRP 客户端（Windows；macOS/Linux 需自备同版本 frpc） |
| `win_push.py` / `push_toast.ps1` | Windows 消息推送驻留与 Toast 脚本 |
| `fix-antivirus.ps1` | 一键解除下载锁定、加 Defender 排除项，修复 `frpc.exe` 被拦 |
| `browserctl_pwa/` | PWA 图标与 Service Worker |
| `INSTALL.md` / `LICENSE` | 本文件与 MIT 许可证 |

包根必须**同时**有 `package.json` 和 `browserctl.py`：DSH 按 `package.json` 加载插件，插件按相对路径从同一层调用闸机。

## 系统要求

- Windows 10 / 11（官方托管、一键修复脚本均按 Windows 编写；macOS/Linux 需自备对应平台 `frpc`）
- DSH NEXT 已安装并可正常启动（插件要求 DSH `>= 0.2.1-rc.3`）
- 官方托管：一个官方账号，<https://remote.ymzcc.com> 免费注册
- 自建服务器：有公网 IP 的 Linux 服务器 + 已运行的 frps + 已解析的域名 + OpenResty/Nginx
- 不需要单独安装 Python、Node、npm

### Python 从哪来

插件按下面的顺序探测解释器，用第一个能跑通的：

1. 环境变量 `BROWSERCTL_PYTHON`
2. 包内 `python/` 目录
3. DSH 自带运行时 `~/.dsh/dsh-runtimes/*/dependencies/python/` ← **绝大多数机器走这条**
4. PATH 上的 `python` / `python3` / `py -3`

`browserctl.py` 只用 Python 标准库，所以 DSH 自带的解释器直接可用。四条都不通时，面板会把原因和解决办法显示出来，不会静默失败。

## 快速开始（三步装好）

### 1. 解压并解除拦截

- 解压到固定目录（例如 `D:\DshRemote`），不要放在 `Temp` 或下载目录，解压后不要再移动。
- Windows 先运行一次一键脚本：右键 `fix-antivirus.ps1` →「使用 PowerShell 运行」→ UAC 点「是」。
  脚本会解除下载锁定（MOTW）、加 Defender 排除项，并实跑 `frpc.exe -v` 验证。
- 不做这一步，`frpc.exe` 很可能被 Windows Defender 判为 `PUA:Win32/FRProxy` 拒绝执行 → 隧道起不来 → 手机打开是 502。详见「常见问题」第 2 条。

### 2. 在 DSH 里添加插件

DSH →「设置」→ 插件页 →「添加插件」→「选择本地目录」→ 选中插件包根目录（能看到 `package.json` 的那一层）。

安装器会自动写入该 profile 的 `link:` 依赖和 `dsh.profile.bundles`，并默认启用插件。
**不需要手改** `%USERPROFILE%\.dsh\profiles\...\package.json`，手动改是 502 与「看不到按钮」的主要来源。

### 3. 重启 DSH

重启后侧边栏出现「远程助手」按钮即安装成功。按钮不出现见「常见问题」第 3 条。

## 官方托管（推荐）

官方服务器 `remote.ymzcc.com` 是多用户托管：登录后按账号分配专属端口，不需要配置任何服务器地址。

1. **注册账号**：浏览器打开 <https://remote.ymzcc.com> 注册（用户名 + 密码 + 邮箱验证码，验证码 10 分钟内有效，先翻垃圾邮件）；也可以在下一步的授权页里点「去官网注册」。
2. **面板登录**：侧边栏「远程助手」→「设置」→「服务器方案」→「官方服务器」（默认选中，不需要填地址/端口/token）→ 保存 →「官方账号」卡片 →「登录 / 注册官方账号」。浏览器打开设备授权页，登录（或注册）后点「确认授权」，面板应显示账号邮箱与「专属端口」。
3. **启动隧道**：点「开始控制」，几秒后面板显示隧道运行中，并给出二维码与链接。
4. **访问入口**：面板和二维码给的是 uid 稳定入口：

   ```text
   https://remote.ymzcc.com/dsh-remote/p/<uid>/
   ```

   - uid 与端口解耦：换网络、重启 DSH 后端口可能变，uid 不变，收藏这一个地址即可。
   - **不要访问 `https://remote.ymzcc.com/p/17901/`**：那是作者开发机的端口，不是任何用户的入口。
5. **消息推送（可选）**：隧道起来后插件自动拉起 `win_push.py`，无需手动启动；Windows 通知权限需允许该程序。

## 手机端连接

- **Android App**：面板「App 配对」页签 → 刷新配对码 → 手机扫码 → 长期配对，之后打开免扫码。
- **iOS / 无 App 设备**：面板「连接」页签 →「iOS / 无 App 设备」→ 生成引导链接（24 小时有效）→ Safari 打开并验证一次 →「分享 → 添加到主屏幕」，之后 30 天免验证。
- **临时访问**：扫「扫码连接」页签的二维码，得到临时会话；要长期免扫码用「App 配对」。

## 常见问题

排查前先记住三条：

- **看面板状态**：是否显示隧道运行中、有没有远端端口。隧道未就绪时面板**不会再生成二维码**，而是直接在二维码位置显示原因（二维码接口返回 503 + 原因）。
- **看包根日志**：`browserctl_frpc.log`（frpc 隧道）、`browserctl_fwd.log`（闸机：配对/验证/请求异常）、`browserctl_start.log`（点「开始控制」时的完整输出）。
- **手动复现**：在包根打开普通终端执行 `python browserctl.py start`，错误会直接打印在终端。不要在受限沙箱里跑 `start/stop`，会拉起重复进程导致端口冲突。

### 1. 手机打开是 502（最常见）

502 的准确含义是：**官方服务器用 uid 反向代理去连「本机 frpc 注册的远端端口」时连不上**。服务端原文：

```text
无法连接到目标设备: connect ECONNREFUSED 127.0.0.1:<port>
```

也就是本机隧道没起来或没注册成功，**不是手机的问题，也不是账号没登录**（账号没登录时面板会直接提示先去登录，不生成二维码）。

按顺序排查：

1. **面板状态**：是否显示隧道运行中、有没有远端端口数字。
2. **frpc 日志**：包根 `browserctl_frpc.log` 应同时出现 `login to server success` 和 `start proxy success`。
   只有前者 = 已登录 frps 但端口没绑上，常见原因是端口被上一次残留的 frpc 进程占用：先 `python browserctl.py stop`，再点一次「开始控制」。
3. **是否被杀软拦**：`frpc.exe` 被 Defender 判为 PUA 时直接拒绝执行，见第 2 条。
4. **UDP 17000 出站**：官方隧道走 KCP（UDP），不是 TCP。防火墙或公司网络只放行 TCP 时，frpc 一直登录不上。
5. **重启 DSH 后点一次「开始控制」**：新会话需要重建隧道。

### 2. `PermissionError: [WinError 5] 拒绝访问` / 「Access is denied」

启动 `frpc.exe` 时报这个错，说明闸机已起来、但隧道程序被安全软件拒绝执行，所以手机端 502。

**根因**：Windows Defender 把 `frpc.exe` 判为 `PUA:Win32/FRProxy`（ThreatID 335323，潜在不受欢迎程序）。从 zip 解压出来的文件带「来自 Internet」的 MOTW 标记，PUA 拦截 + MOTW 同时满足就会拦。**改名、换目录、换副本都没用**（按文件内容判定，所有副本一起拦）。装了联想电脑管家（火绒引擎）、火绒、360 的机器还会各自再拦一次，排除项与 Defender 相互独立。

**一键修复（推荐）**：右键 `fix-antivirus.ps1` →「使用 PowerShell 运行」→ UAC 点「是」。
它会解除下载锁定 → 加 Defender 排除项（目录 + 进程）→ 检查并询问是否关闭 PUA 拦截 → 实跑 `frpc.exe -v` 验证并报告结果。

> 由 AI 助手排障时：**不要替用户改系统安全设置**（需要管理员权限与 UAC），把这一步转达给用户本人执行。

**脚本打不开时，逐步处理：**

1. 管理员 PowerShell 在包根执行 `Get-ChildItem -Recurse | Unblock-File`，再 `.\frpc.exe -v`。能输出版本号即修好（去掉 MOTW 通常就够了）。
2. 还不行 → 加排除项：Windows 安全中心 → 病毒和威胁防护 → 管理设置 → 排除项 → 添加**文件夹**（选包根）。被「篡改防护」阻止时，用同样的图形界面手动加。
3. 还不行 → 关 PUA：Windows 安全中心 → 应用和浏览器控制 → 基于信誉的保护设置 →「潜在不受欢迎的应用」→ 关闭。
4. 联想电脑管家 / 火绒 / 360：在各自软件的信任区 / 排除项里再加一次包根目录。
5. Windows 11 若开了「智能应用控制」，同样关闭。
6. `frpc.exe` 已被隔离或删除时，重新解压插件包再做以上步骤。

### 3. 看不到「远程助手」侧边栏按钮

- 确认走的是「添加插件 → 选择本地目录」，且选中的是**含 `package.json` 的包根**。
- 安装后必须**重启 DSH**：host 半在 DSH 启动时加载，client 半刷新页面才生效。
- 检查 profile 里 `dsh.profile.bundles` 是否包含 `dsh-plugin-browserctl`；安装器写入了但按钮仍不出现，重启 DSH 再看一次。
- DSH 版本需满足 `>= 0.2.1-rc.3`。

### 4. 面板提示找不到 Python 解释器

正常安装的 DSH 不会出现这一条（DSH 自带 Python 运行时）。真出现说明四条探测路径都不通：

- 打开 `%USERPROFILE%\.dsh\dsh-runtimes\`，确认运行时目录里有 `dependencies\python\python.exe`；没有就修复/重装 DSH 后重启。
- 或安装 Python 3.10+（安装时勾选 **Add python.exe to PATH**），然后重启 DSH。
- 或设置环境变量 `BROWSERCTL_PYTHON` 指向 `python.exe` 的完整路径，然后重启 DSH。

不需要 `pip install` 任何东西：`browserctl.py` 只用标准库。

### 5. 面板一直停在「隧道正在建立」

基本是 frpc 没起来或端口没绑上，按第 1、2 条排查。若怀疑残留进程，执行：

```powershell
python browserctl.py stop
```

然后在面板点「开始控制」重新建隧道。

### 6. App 提示「配对已失效或未授权」

1. **刷新配对码重扫**最快：面板「App 配对」→ 刷新配对码 → 手机重扫。
2. 长期配对码有效期 7 天，并落盘到 `browserctl_grants.json`，闸机重启不再失效。
3. 官方模式**不要**跑 `ssh-trust`：它只用于自建模式固定服务器主机指纹。
4. 查 `browserctl_fwd.log` 里的 `[gate] 请求处理异常`，堆栈里通常有直接原因。

### 7. 升级插件时要注意什么

运行态文件与 `browserctl.py` 同目录生成：`browserctl_state.json`、`browserctl_secrets.json`、`browserctl_devices.json`、`browserctl_grants.json`、`browserctl_*.log` 等。

升级（替换插件包）时**保留这些文件**：删掉等于重新配对，TOTP/会话全部重置。
`browserctl_secrets.json` 含凭据，**不要外传、不要提交到仓库**。

## 自建服务器（可选）

前提：有公网 IP 的 Linux 服务器、已解析的域名、已运行的 frps（例如监听 17000，`allowPorts` **必须覆盖分配到的端口段**）、OpenResty/Nginx。

在包根依次执行（普通终端，不要用受限沙箱）：

```bash
pip install -r requirements.txt      # 仅 paramiko，供 `browserctl.py nginx` 自动部署反代用；等价 pip install paramiko
python browserctl.py secrets init    # 交互填写：SSH 主机/用户/密码或密钥、FRP 服务器地址与端口、frp token、公网域名
python browserctl.py ssh-trust       # 固定服务器主机密钥指纹
python browserctl.py nginx           # 部署服务器端反代 + Cookie 签名门禁（失败自动回滚）
python browserctl.py start           # 启动本地闸机 + frpc 隧道 + 看门狗
python browserctl.py status          # 查看隧道与闸机状态
```

- 自建模式的 frp 服务器地址填 `ssh_host` 或 `frp_server_host`。
- 官方托管不需要 `secrets init`、`ssh-trust`、`nginx`、`paramiko`，四条都只属于自建模式。

## 构建插件（可选）

发行包已含 `lib/`，普通安装**不需要**构建。改了插件源码才需要：

```bash
cd dsh-plugin-browserctl
npm install      # 仅构建期依赖（esbuild）
node build.mjs   # 重建 lib/index.js（ESM，qrcode 内联）+ lib/client.js（__ModuleLoader__ 包裹）
npm test         # test/smoke.cjs + test/layout.cjs
```

- 构建需要 Node 22.19+ 或 24+；运行时零 npm 依赖。
- 改 `src/` 后必须重建：client 半刷新页面生效，host 半需重启 DSH。
- 源码仓库里插件在 `dsh-plugin-browserctl/`、闸机核心在仓库根；发给最终用户的自包含插件包把两者合并到同一层（即「目录结构」的样子）。

## 目录结构

```text
插件包根/                     ← DSH 里「添加插件 → 选择本地目录」选中的就是它
├── package.json              DSH 插件清单
├── cordis.patch.yml          插件注册补丁
├── lib/                      index.js(host) + client.js(client)，预构建
├── src/                      插件源码
├── locale/                   zh.json / en.json
├── icon.svg
├── browserctl.py             本机闸机（单文件，只用标准库）
├── frpc.exe                  FRP 客户端
├── win_push.py / push_toast.ps1
├── fix-antivirus.ps1
├── browserctl_pwa/
└── INSTALL.md / LICENSE
```

运行后会在包根生成 `browserctl_state.json`、`browserctl_secrets.json`、`browserctl_devices.json`、`browserctl_grants.json`、`browserctl_*.log` 等文件，升级时按「常见问题」第 7 条保留。
