# -*- coding: utf-8 -*-
"""
browserctl.py — DeepSeek 助手 Web 面板穿透工具(DSH 远程助手)

链路: DSH Web(127.0.0.1:随机端口)
      ← 本地闸机(127.0.0.1:3080, TOTP 2FA + 会话 Cookie, 自动探测 DSH 端口)
      → frpc 隧道(服务器 17901)
      → Nginx 反代(https://remote.ymzcc.com/p/17901/)
      → DSH 自带签名 Cookie 鉴权(密钥持久化于 ~/.dsh/.credentials.yaml)

闸机鉴权(仿 Claude 遥控 2FA 体系):
  - RFC 6238 TOTP(30s/6位,±1 窗口),密钥 base32 存 state 的 totp_secret
  - 防重放:同码 90s 内只认一次;防爆破:同 IP 连错 5 次冻结 15 分钟
  - 验证通过种 bc-gate 会话 Cookie(30 天),设备会话可整体踢下线

用法:
  python browserctl.py detect    # 探测当前 DSH Web 端口
  python browserctl.py mint      # 铸造 30 天有效的远程访问 Cookie(打印控制台导入片段)
  python browserctl.py fwd       # 前台运行本地闸机(一般由 start 后台拉起)
  python browserctl.py start     # 一键: 探测+后台闸机+frpc 隧道+打印访问信息
  python browserctl.py pair      # 生成一次性配对链接(60s/仅一次,扫码即配对)
  python browserctl.py status    # 查看各组件状态
  python browserctl.py stop      # 停止闸机与 frpc
  python browserctl.py totp enable|disable|reset|uri   # 2FA 管理(命令行)
  python browserctl.py nginx     # 服务器端安装/更新 密钥链接 + 引导页(幂等)
  python browserctl.py upload    # 仅上传 dsh-auth.html 引导页
"""
import argparse
import base64
import hashlib
import hmac
import http.client
import json
import os
import re
import secrets as _secrets
import socket
import struct
import subprocess
import select
import sys
import threading
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
import zlib
from collections import OrderedDict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import socketserver  # noqa: F401  (保留给历史兼容)

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
FRPC = HERE / "frpc.exe"
CRED = Path.home() / ".dsh" / ".credentials.yaml"
STATE = HERE / "browserctl_state.json"

# 无窗口运行外部命令(否则无控制台的父进程每次拉起 tasklist/netstat 都会闪 CMD 窗口)
CREATE_NO_WINDOW = 0x08000000 if os.name == "nt" else 0


def _run_hidden(cmd, **kw):
    return subprocess.run(cmd, creationflags=CREATE_NO_WINDOW, **kw)
FWD_LOG = HERE / "browserctl_fwd.log"
FRPC_LOG = HERE / "browserctl_frpc.log"
WATCH_LOG = HERE / "browserctl_watch.log"
# win_push.py(Windows 通知驻留)的推送水位文件:含设备/会话指纹,一并纳入 ACL 硬化
PUSHWIN_STATE = HERE / "pushwin_state.json"

PUBLIC_HOST = "remote.ymzcc.com"


def _pick_free_port(preferred=3080):
    """在 preferred..preferred+9 里挑第一个能 bind 的本地端口(被别的程序/另一份副本占了就顺延)。"""
    for port in range(int(preferred), int(preferred) + 10):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            # Windows 上不能带 SO_REUSEADDR:那会让 bind 成功"抢"走别人已监听的端口
            s.bind(("127.0.0.1", port))
            return port
        except OSError:
            continue
        finally:
            s.close()
    raise SystemExit("本地端口 %d-%d 全部被占用,闸机无法启动" % (int(preferred), int(preferred) + 9))


def _select_fwd_port():
    """确定本次闸机端口:① 已有闸机在跑 → 用 state 里那个;② 否则从 state/默认值往后挑空闲端口。
    结果写回 state.fwd_port 并注入 BC_FWD_PORT,子进程(fwd/watch)读同一个值。"""
    global FWD_PORT
    st = read_state()
    cur = int(st.get("fwd_port") or 0)
    pid = st.get("fwd_pid")
    # 端口还开着就复用(pid 存活 或 压根没记录都算):不要因为找不到 pid 就顺延开第二份,
    # 否则上一份(可能提权)没杀掉时,两份闸机同时写同一个 state 互相覆盖 → 隧道一会好一会坏
    # (2026-11-07 实测「frpc 进程未运行」间歇失败就是这原因)。
    # 例外:pid 记录过但已死、端口还被占 → 可能是别的程序占了我们旧端口,这时才顺延新端口。
    # ⚠️ (2026-11-08 双副本并存)pid 压根没记录时,「端口开着」不再直接复用:必须验明
    # 监听者是本副本(_gate_is_ours 管理令牌探测)。否则绑定竞态输给另一份插件的闸机后,
    # state 会一直指着别人的闸机——隧道照常,配对/踢人却全打到别人那里,插件 QR 恒报
    # 「配对创建仅限本机管理员调用」(2026-11-08 实测,点多少次「开始控制」都好不了)。
    if (cur and _port_open(cur) and (not pid or _pid_alive(pid))
            and (pid or _gate_is_ours(cur))):
        FWD_PORT = cur
        os.environ["BC_FWD_PORT"] = str(cur)
        return cur
    base = int(os.environ.get("BC_FWD_PORT") or cur or 3080)
    port = _pick_free_port(base)
    FWD_PORT = port
    os.environ["BC_FWD_PORT"] = str(port)
    if cur != port:
        # 字段级写:只落 fwd_port(kb/06 第 24 条);cmd_start 持 _ctl_lock 时
        # 别的进程(旧看门狗)仍可能并发写 state,不能整份快照回写。
        update_state(lambda s: {**s, "fwd_port": port})
    return port


def _elevated_taskkill(pids):
    """用 Windows UAC 以管理员身份一次性 taskkill 指定 pid 列表。
    弹窗用户点「是」→ 成功;点「否」/超时/失败 → 返回 False(绝不静默当成功)。"""
    if not pids:
        return True
    pids = [int(p) for p in pids if p]
    if not pids:
        return True
    pid_args = " ".join("/PID %d" % p for p in pids)
    # 单个 UAC 弹窗一次杀全部;ArgumentList 用单个字符串(全是数字/开关,无空格问题)
    script = ("Start-Process -FilePath 'taskkill.exe' -ArgumentList "
              "'%s /T /F' -Verb RunAs -WindowStyle Hidden -Wait; "
              "Write-Output ('EXIT=' + $LASTEXITCODE)" % pid_args)
    try:
        subprocess.run(["powershell", "-NoProfile", "-Command", script],
                       capture_output=True, text=True, timeout=120,
                       creationflags=CREATE_NO_WINDOW)
    except Exception:
        return False
    return not any(_pid_alive(p) for p in pids)


def _clean_elevated_leftovers():
    """cmd_start 持锁时调用:上次以管理员身份启动的提权进程普通权限杀不掉,
    这里自动请求管理员权限(UAC)一次清掉,避免残留闸机/看门狗/frpc 占端口、
    两份闸机互相覆盖 state → 插件间歇报「frpc 进程未运行」(2026-11-07 实测)。"""
    st = read_state()
    pids = [int(p) for p in (st.get("elevated_leftovers") or [])
            if p and _pid_alive(int(p))]
    if not pids:
        # 字段级写:只清 elevated_leftovers(kb/06 第 24 条)
        update_state(lambda s: {k: v for k, v in s.items() if k != "elevated_leftovers"})
        return
    print("检测到上次以管理员身份启动的残留进程(pid=%s),正在请求管理员权限清理..."
          % pids, flush=True)
    print("如果弹出 UAC 窗口,请点「是」;点「否」则残留进程会继续占着端口。", flush=True)
    if _elevated_taskkill(pids):
        print("已通过管理员权限清理: %s" % pids, flush=True)
        dead_keys = set()
        for p in pids:
            for key in ("frpc_pid", "fwd_pid", "watchdog_pid"):
                if st.get(key) == p:
                    dead_keys.add(key)
        dead_keys.add("elevated_leftovers")
        # 字段级写:只 pop 清掉进程对应的 pid 键 + elevated_leftovers
        update_state(lambda s: {k: v for k, v in s.items() if k not in dead_keys})
    else:
        print("[警告] 管理员清理未完成(可能被取消);残留进程仍会占着端口,"
              "可再点一次「开始控制」重试,或手动用任务管理器结束。", flush=True)


AUTHORITY = "127.0.0.1"  # nginx 侧统一改写 Host/Origin 为 loopback,栅栏无条件放行
FWD_PORT = 3080
REMOTE_PORT = 17901
COOKIE_LIFETIME_DAYS = 30

# ---- FRP 入口 ----
# 官方托管模式所有用户的隧道都连官方 frps。这里必须用**域名**而不是硬编码服务器 IP:
#   1) 开源仓库里生产服务器 IP 按约定脱敏,若默认值留空,frpc 会把 serverAddr 写成空串,
#      表现为日志里反复 "connection write timeout",隧道永远连不上 → 手机打开面板 502;
#   2) remote.ymzcc.com 本身就是公开信息(插件/官网都在用),解析到官方 frps。
# 自建模式用 frp_server_host / ssh_host 覆盖;也可用环境变量 BROWSERCTL_FRP_HOST 临时指定。
OFFICIAL_FRP_HOST = os.environ.get("BROWSERCTL_FRP_HOST") or "remote.ymzcc.com"
OFFICIAL_FRP_PORT = 17000
# 启动后等 frpc 真正把远端端口注册到 frps 的最长时间(秒)。只有等到
# "start proxy success" 才算隧道通了 —— 进程起来 ≠ 隧道可用(见 ensure_tunnel)。
FRPC_READY_TIMEOUT = 15

SERVER_CONF = os.environ.get("BC_SERVER_CONF") or "/www/conf.d/remote.conf"
SERVER_INDEX = os.environ.get("BC_SERVER_INDEX") or "/www/sites/default/index"
SERVER_HTPASSWD = os.environ.get("BC_SERVER_HTPASSWD") or "/www/ssl/dsh.htpasswd"
HTPASSWD_USER = os.environ.get("BC_HTPASSWD_USER") or "dsh"
OPENRESTY = os.environ.get("BC_OPENRESTY") or "openresty"

# ---- 凭据外置(源码中不再出现任何明文密钥) ----
# 优先级:环境变量 > browserctl_secrets.json(0600, 已 gitignore) > 内置默认(仅非敏感项)
SECRETS_FILE = HERE / "browserctl_secrets.json"
KNOWN_HOSTS = HERE / ".ssh_known_hosts"
SECRETS_TEMPLATE = {
    "ssh_host": "",
    "ssh_user": "root",
    "ssh_password": "",
    "ssh_key": "",
    "frp_token": "",
    "frp_server_port": 17000,
    # 隧道入口(不属于 SSH):留空时 official 模式用 OFFICIAL_FRP_HOST,
    # selfhost 模式用 ssh_host。自建用户可只填这一项,不必暴露 SSH 主机。
    "frp_server_host": "",
}


def load_secrets():
    data = dict(SECRETS_TEMPLATE)
    try:
        if SECRETS_FILE.exists():
            data.update(json.loads(SECRETS_FILE.read_text(encoding="utf-8")))
    except Exception:
        pass
    data["ssh_host"] = os.environ.get("BROWSERCTL_SSH_HOST") or data.get("ssh_host") or ""
    data["frp_server_host"] = os.environ.get("BROWSERCTL_FRP_HOST") or data.get("frp_server_host") or ""
    data["ssh_user"] = os.environ.get("BROWSERCTL_SSH_USER") or data.get("ssh_user") or "root"
    data["ssh_password"] = os.environ.get("BROWSERCTL_SSH_PASSWORD") or data.get("ssh_password") or ""
    data["ssh_key"] = os.environ.get("BROWSERCTL_SSH_KEY") or data.get("ssh_key") or ""
    data["frp_token"] = os.environ.get("BROWSERCTL_FRP_TOKEN") or data.get("frp_token") or ""
    try:
        data["frp_server_port"] = int(data.get("frp_server_port") or 17000)
    except Exception:
        data["frp_server_port"] = 17000
    return data


# secrets show 明文白名单(2026-11-08 审计 P2):这些键不是机密(主机/用户名/端口),
# 明文显示便于核对配置;白名单之外的键一律掩码——secrets 文件里历史上可能被塞进
# server_link_secret / totp_secret / cookie 等任何键,不能靠逐个点名来排漏。
SECRETS_PLAINTEXT_KEYS = frozenset((
    "ssh_host", "ssh_user", "ssh_port", "server_addr", "server_port",
    "frp_server_port", "frp_server_host",
))


def _mask_secret(value):
    """secrets show 掩码:前四后二 + 长度,够核对是哪张卡,不足以还原原文。
    空值返回空串;≤6 字符的值没有可安全展示的前缀,整串打星。"""
    s = "" if value is None else str(value)
    if not s:
        return ""
    if len(s) <= 6:
        return "*" * len(s)
    return "%s…%s(len=%d)" % (s[:4], s[-2:], len(s))


_perm_warned = set()


def harden_file_perms(path):
    """权限收紧为仅当前用户可读写:Windows 断继承 + 仅当前用户 F;POSIX 0600。
    失败时明确告警(不静默),因为静默失败等于没有保护。"""
    ok = False
    try:
        if os.name == "nt":
            user = os.environ.get("USERNAME") or ""
            if user:
                r = _run_hidden(["icacls", str(path), "/inheritance:r", "/grant:r", "%s:F" % user],
                                capture_output=True, text=True, timeout=20)
                ok = r.returncode == 0
        else:
            os.chmod(path, 0o600)
            ok = True
    except Exception:
        ok = False
    if not ok and str(path) not in _perm_warned:
        _perm_warned.add(str(path))
        print("[安全告警] 无法收紧 %s 的访问权限(需管理员/非沙箱终端)。请手动执行:\n"
              "  icacls \"%s\" /inheritance:r /grant:r \"%%USERNAME%%:F\"" % (path, path),
              file=sys.stderr, flush=True)
    return ok


def harden_credential_files():
    """H-05:把凭据与运行态文件的 ACL 收紧为仅当前用户(幂等,失败只告警一次)。

    这些文件里有 SSH 口令、FRP token、TOTP 密钥、30 天 DSH Cookie、设备 IP/UA。
    历史上它们的 ACL 继承了 CodexSandboxUsers:(I)(M) 之类的条目,同机其它账户可读。

    2026-11-08 审计(P1 本地 ACL 回宽复发)补充:三个进程日志、frpc 配置(含
    token 明文)与 pushwin 水位文件同样含敏感内容,一并纳入;文件不存在时跳过
    (新机器首次启动前日志/toml 尚未生成,不报错)。
    """
    for p in (SECRETS_FILE, STATE, SESSIONS_FILE, EVENTS_FILE, BLACKLIST_FILE,
              DEVICES_FILE, NOTIFS_FILE, BOOTSTRAP_FILE, ADMIN_TOKEN_FILE, KNOWN_HOSTS,
              GRANTS_FILE,
              # 日志/frpc 配置/pushwin 水位(2026-11-08 补齐,均 HERE 相对路径)
              FWD_LOG, FRPC_LOG, WATCH_LOG, HERE / "browserctl_frpc.toml",
              PUSHWIN_STATE):
        try:
            if p.exists():
                harden_file_perms(p)
        except Exception:
            pass


# 状态文件写锁(跨进程互斥;插件侧 Node 用原子 rename 配合)
def _state_lock_file():
    return STATE.with_suffix(".json.lock")


class _StateLock:
    def __enter__(self):
        self.fh = open(_state_lock_file(), "a+")
        self.locked = False
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(self.fh.fileno(), msvcrt.LK_LOCK, 1)
            else:
                import fcntl
                fcntl.flock(self.fh.fileno(), fcntl.LOCK_EX)
            self.locked = True
        except Exception as e:
            # 锁失败(等锁超时/文件系统异常)不能静默:此刻的读-改-写已退化成
            # 无锁窗口,并发覆盖正是 kb/06 第 24 条症状的来源。打点日志便于归因。
            print("[警告] state 文件锁加锁失败(%r),本次写入退化为无锁窗口" % (e,), flush=True)
        return self

    def __exit__(self, *exc):
        try:
            if self.locked:
                if os.name == "nt":
                    import msvcrt
                    self.fh.seek(0)
                    msvcrt.locking(self.fh.fileno(), msvcrt.LK_UNLCK, 1)
                else:
                    import fcntl
                    fcntl.flock(self.fh.fileno(), fcntl.LOCK_UN)
        except Exception:
            pass
        try:
            self.fh.close()
        except Exception:
            pass
        return False


def state_lock():
    return _StateLock()

DSH_WEB_URL = os.environ.get("DSH_WEB_URL", "")

# DSH 主进程名:预览/开发版叫 DSH NEXT.exe,正式安装版叫 DeepSeek Harness.exe,
# 两个名字都要认——只认一个会让另一版的用户永远探测不到端口,
# 表现为「未探测到 DSH Web 端口」(2026-11-08 实测)。
DSH_PROCESS_NAMES = ("dsh next.exe", "deepseek harness.exe")


# ---------------- DSH 端口探测 ----------------

def dsh_candidates():
    """候选端口: state 缓存 → DSH_WEB_URL 环境变量 → netstat(按 DSH 进程名,兼容 DSH NEXT.exe / DeepSeek Harness.exe)。"""
    ports = []
    try:
        st = read_state()
        if st.get("dsh_port"):
            ports.append(int(st["dsh_port"]))
    except Exception:
        pass
    m = re.search(r":(\d+)", DSH_WEB_URL)
    if m:
        ports.append(int(m.group(1)))
    try:
        # 不用 /FI 按名过滤:一次全列,本地按名字集合筛——两个进程名一次拿全,
        # 也避开 /FI 参数里带空格的名字在不同系统上的引号差异。
        # errors="replace":个别机器 locale 编码对不上时只损显示,不炸整个探测。
        out = _run_hidden(
            ["tasklist", "/FO", "CSV", "/NH"],
            capture_output=True, text=True, errors="replace", timeout=15,
        ).stdout
        pids = set()
        for x in out.splitlines():
            f = x.split('","')
            if len(f) >= 2 and f[0].strip('"').lower() in DSH_PROCESS_NAMES:
                try:
                    pids.add(int(f[1]))
                except ValueError:
                    pass
        if pids:
            ns = _run_hidden(
                ["netstat", "-ano", "-p", "tcp"], capture_output=True, text=True, timeout=15,
            ).stdout
            for line in ns.splitlines():
                f = line.split()
                if len(f) >= 5 and f[3] == "LISTENING" and f[1].startswith("127.0.0.1:"):
                    pid = int(f[4])
                    if pid in pids:
                        ports.append(int(f[1].rsplit(":", 1)[1]))
    except Exception:
        pass
    seen, uniq = set(), []
    for p in ports:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    return uniq


def probe_dsh(port, timeout=2.0):
    """确认该端口是 DSH Web(未带 Cookie 访问 / 应返回 401 + 特征文案)。"""
    try:
        req = urllib.request.Request("http://127.0.0.1:%d/" % port)
        urllib.request.urlopen(req, timeout=timeout)
        return False  # 200 反而不像未鉴权 DSH
    except urllib.error.HTTPError as e:
        return e.code == 401 and b"dsh web authentication" in e.read(400)
    except Exception:
        return False


def detect_port():
    for p in dsh_candidates():
        if probe_dsh(p):
            # 字段级写:只更新 dsh_port(kb/06 第 24 条)。这里是热路径
            # (反代每个请求都可能调 resolve_dsh→detect_port),旧整份快照回写
            # 会把 DSH 重启瞬间其它线程/进程写的 frpc_pid/tunnel_ok 覆盖回旧值;
            # 端口没变时完全不写,热路径零 state IO。
            if read_state().get("dsh_port") != p:
                update_state(lambda s: {**s, "dsh_port": p})
            return p
    raise SystemExit("未探测到 DSH Web 端口;请确认 DeepSeek 助手已启动")


# ---------------- Cookie 铸造 ----------------

def b64url_encode(b):
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def b64url_decode(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def load_secret():
    text = CRED.read_text(encoding="utf-8")
    m = re.search(r"client-connection/browser-session:\s*\n\s*kind: grant[\s\S]*?secret:\s*(\S+)", text)
    if not m:
        raise SystemExit("未在 %s 找到 browser-session 密钥" % CRED)
    key = b64url_decode(m.group(1))
    if len(key) != 32:
        raise SystemExit("browser-session 密钥长度异常(%d 字节)" % len(key))
    return key


def mint_cookie(days=COOKIE_LIFETIME_DAYS):
    """铸出合法的 dsh-auth Cookie(authority 绑定 remote.ymzcc.com)。"""
    key = load_secret()
    now = int(time.time() * 1000)
    payload = {"version": 1, "authority": AUTHORITY, "issuedAt": now,
               "expiresAt": now + days * 86400_000}
    body = b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    sig = b64url_encode(hmac.new(key, body.encode(), hashlib.sha256).digest())
    value = "v%d.%s.%s" % (payload["version"], body, sig)
    name = "dsh-auth-" + b64url_encode(hashlib.sha256(AUTHORITY.encode()).digest())
    return name, value, payload


# ---------------- 本地闸机(TOTP 2FA + 反代) ----------------

GATE_COOKIE = "bc-gate"
GATE_PREFIX = "/browserctl-gate/"
# 同一台机器上可以并存「正式版」和「测试副本」两份插件,它们各自拉起一个闸机进程
# (端口由 _select_fwd_port 自动避让,互不干扰)。测试副本的插件 host 用的是
# /browserctl-test-gate/ 前缀,而闸机这边的端点实现是同一套,所以路由入口同时认两个前缀。
# 只影响「路由匹配」这一层:_serve_gate() 内部按后缀分发,鉴权(X-BC-Admin / 2FA 会话)
# 与业务逻辑完全共用,不会因为换了前缀而放宽任何检查。
GATE_PREFIXES = (GATE_PREFIX, "/browserctl-test-gate/")

# ---- PWA:面板「添加到主屏幕」静态资源与注入标签(见 _serve_pwa/_inject_pwa_tags) ----
PWA_DIR = HERE / "browserctl_pwa"
PWA_MANIFEST = """{
  "name": "DSH 远程助手",
  "short_name": "DSH 助手",
  "description": "DeepSeek 助手远程控制面板",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#121316",
  "theme_color": "#121316",
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"}
  ]
}"""

# ---- 移动端工具条：注入面板根 HTML 的悬浮条(返回 / 全屏 / 视口宽度) ----
# 背景：手机浏览器(尤其"添加到主屏幕"的 standalone 模式)里打开面板后,
# ①没有浏览器后退键可用(无法返回官网/上一页) ②没有全屏入口 ③没有 App 那样的
# 视口宽度调节。电脑版有浏览器工具栏,三个问题都不存在,所以本工具条只在触屏
# 设备(any-pointer: coarse)显示,桌面版零改动。
# 视口宽度用「− / 数值 / +」加减步进器在 400–3200px 间调节(每按一次 ±20px,
# App 同款交互;点中间数字可直接手输任意值,长按数值恢复自适应——不放"自适应"
# 按钮,那个位置挨着加减号,最容易误触)。
# 横竖屏各记一套宽度(dsh_mb_vp_p / dsh_mb_vp_l,旧版单值 dsh_mb_vp 首次运行
# 自动迁移到两套),旋转屏幕时自动切到该方向记住的宽度;方向判定必须用
# screen.orientation,不能比较 innerWidth/innerHeight——固定视口宽度会把布局
# 视口撑宽,竖屏也会被误判成横屏。选了固定宽度后用 MutationObserver 纠正页面
# 自身对 viewport meta 的改写;该方向没设固定宽度就完全不碰页面 meta。
# App(UA 含 DshRemote/)不注入本工具条,自有原生导航。
# 长按 FAB 0.6s 可隐藏整个工具条;但「添加到主屏幕」的 standalone 窗口没有刷新按钮,
# iOS 重新点开图标又常是冻结恢复旧页面而非重新加载,隐藏状态会被一直带走。
# 所以隐藏不是永久的:切回前台(visibilitychange)或 pageshow(persisted) 自动恢复显示。
# 返回逻辑 = history.back();若 900ms 后仍停留在本页(无历史可退)则兜底跳官网 /app。
_MOBILE_TOOLBAR_JS = """(function(){
try{
if (window.__dshMbBar) return;
window.__dshMbBar = 1;
if (!matchMedia('(any-pointer: coarse)').matches) return;

var LS_OLD='dsh_mb_vp', LS_P='dsh_mb_vp_p', LS_L='dsh_mb_vp_l';
var VP_FIT='width=device-width, initial-scale=1, viewport-fit=cover';
var VP_MIN=400, VP_MAX=3200;
function isLandscape(){
  try{
    var so=window.screen&&screen.orientation;
    if (so&&so.type) return so.type.indexOf('landscape')===0;
  }catch(e){}
  try{
    if (typeof window.orientation==='number') return Math.abs(window.orientation)===90||Math.abs(window.orientation)===270;
  }catch(e){}
  try{ if (screen.width&&screen.height) return screen.width>screen.height }catch(e){}
  return (window.innerWidth||0)>(window.innerHeight||0);
}
function keyFor(land){ return land?LS_L:LS_P }
function getPreset(){ try{return localStorage.getItem(keyFor(isLandscape()))||''}catch(e){return ''} }
// 旧版单值(dsh_mb_vp)迁移:两个方向各存一份,迁移完删旧键,之后各方向独立。
(function migrate(){
  try{
    var old=localStorage.getItem(LS_OLD);
    if (old===null) return;
    if (localStorage.getItem(LS_P)===null) localStorage.setItem(LS_P,old);
    if (localStorage.getItem(LS_L)===null) localStorage.setItem(LS_L,old);
    localStorage.removeItem(LS_OLD);
  }catch(e){}
})();

var applying=false, vpObs=null, vpMeta=null;
function findMeta(){
  if (vpMeta && vpMeta.isConnected) return vpMeta;
  var m=document.querySelector('meta[name="viewport"]');
  if(!m){ m=document.createElement('meta'); m.setAttribute('name','viewport');
    (document.head||document.documentElement).appendChild(m); }
  vpMeta=m; return m;
}
function applyVp(c){
  var m=findMeta(); applying=true;
  try{ m.setAttribute('content',c) }catch(e){}
  setTimeout(function(){ applying=false }, 80);
}
function enforceVp(on){
  if (vpObs){ vpObs.disconnect(); vpObs=null }
  if (on){
    var m=findMeta();
    vpObs=new MutationObserver(function(){
      if (applying) return;
      var want=getPreset();
      if (want && m.getAttribute('content')!==want) applyVp(want);
    });
    vpObs.observe(m,{attributes:true,attributeFilter:['content']});
  }
}
(function(){ var s=getPreset(); if(s){ applyVp(s); enforceVp(true) } })();

var css='#dsh-mb-bar{position:fixed;right:calc(12px + env(safe-area-inset-right,0px));'
 +'bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:2147483000;'
 +'font-family:system-ui,-apple-system,"Segoe UI","PingFang SC",sans-serif;'
 +'-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}'
 +'#dsh-mb-bar .fab{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
 +'margin-left:auto;border:1px solid rgba(255,255,255,.22);background:rgba(24,26,30,.88);color:#fff;cursor:pointer;'
 +'-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 4px 18px rgba(0,0,0,.35)}'
 +'#dsh-mb-bar .fab svg{width:20px;height:20px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
 +'#dsh-mb-bar .card{display:none;flex-direction:column;gap:4px;margin-bottom:8px;padding:8px;min-width:200px;'
 +'max-height:calc(100vh - 156px);overflow-y:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box;'
 +'border-radius:16px;border:1px solid rgba(255,255,255,.16);background:rgba(24,26,30,.92);'
 +'-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 10px 34px rgba(0,0,0,.45)}'
 +'#dsh-mb-bar .card > *{flex:0 0 auto}'
 +'#dsh-mb-bar.open .card{display:flex}'
 +'#dsh-mb-bar .row{display:flex;align-items:center;gap:10px;height:42px;padding:0 12px;border:0;border-radius:10px;'
 +'background:transparent;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer;text-align:left;font-family:inherit}'
 +'#dsh-mb-bar .row:active{background:rgba(255,255,255,.12)}'
 +'#dsh-mb-bar .row svg{width:18px;height:18px;flex:0 0 18px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
 +'#dsh-mb-bar .vp{display:none;flex-direction:column;gap:6px;padding:2px 4px 6px}'
 +'#dsh-mb-bar .vp.open{display:flex}'
 +'#dsh-mb-bar .vp .lbl{font-size:11px;color:rgba(255,255,255,.55);padding:2px 8px}'
 +'#dsh-mb-bar .stat{display:flex;align-items:center;gap:8px;height:30px;padding:0 8px;'
 +'color:rgba(255,255,255,.55);font-size:11.5px;font-weight:600}'
 +'#dsh-mb-bar .stat svg{width:15px;height:15px;flex:0 0 15px;stroke:rgba(255,255,255,.7);fill:none;'
 +'stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
 +'#dsh-mb-bar .hint{padding:0 8px;color:rgba(255,255,255,.36);font-size:11px;line-height:1.4}'
 +'#dsh-mb-bar .vp .stepper{display:flex;align-items:center;gap:8px}'
 +'#dsh-mb-bar .vp .stp{width:46px;height:46px;flex:0 0 46px;border-radius:12px;border:1px solid rgba(255,255,255,.22);'
 +'background:transparent;color:#fff;font-size:22px;font-weight:600;line-height:1;cursor:pointer;font-family:inherit;padding:0}'
 +'#dsh-mb-bar .vp .stp:active{background:rgba(255,255,255,.12)}'
 +'#dsh-mb-bar .vp .stp[disabled]{opacity:.3;pointer-events:none}'
 +'#dsh-mb-bar .vp .val{flex:1;min-width:0;text-align:center;font-size:14px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;cursor:pointer}'
 +'#dsh-mb-bar .vp .vpin{width:100%;height:32px;padding:0 6px;text-align:center;border-radius:8px;'
 +'border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.25);color:#fff;'
 +'font-size:14px;font-weight:600;font-family:inherit;outline:none;-webkit-appearance:none;appearance:none}'
 +'#dsh-mb-bar .vp .vpin::-webkit-outer-spin-button,#dsh-mb-bar .vp .vpin::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}'
 +'#dsh-mb-bar .vp .vpin{-moz-appearance:textfield}'
 +'#dsh-mb-bar .vp .fit{margin-top:4px}'
 +'#dsh-mb-bar .toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(146px + env(safe-area-inset-bottom,0px));'
 +'max-width:78vw;background:rgba(24,26,30,.94);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:10px;'
 +'padding:9px 14px;font-size:12.5px;line-height:1.5;box-shadow:0 6px 22px rgba(0,0,0,.4);opacity:0;'
 +'transition:opacity .18s;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 +'#dsh-mb-bar .toast.show{opacity:1}';
var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

var I_FAB='<svg viewBox="0 0 24 24"><path d="M4 8h9"/><path d="M17 8h3"/><circle cx="15" cy="8" r="2.2"/>'
 +'<path d="M4 16h3"/><path d="M11 16h9"/><circle cx="9" cy="16" r="2.2"/></svg>';
var I_BACK='<svg viewBox="0 0 24 24"><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>';
var I_FS='<svg viewBox="0 0 24 24"><path d="M4 9V5h4"/><path d="M15 4h5v5"/><path d="M20 15v5h-5"/><path d="M9 20H4v-5"/></svg>';
var I_VP='<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M9 21h6"/></svg>';
var I_ROT='<svg viewBox="0 0 24 24"><path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 3.5v4.5H16"/></svg>';

var root=document.createElement('div'); root.id='dsh-mb-bar';
var card=document.createElement('div'); card.className='card';
var fab=document.createElement('button'); fab.className='fab'; fab.setAttribute('aria-label','工具'); fab.innerHTML=I_FAB;
var toastEl=document.createElement('div'); toastEl.className='toast';
var tTimer=0;
function toast(msg){
  toastEl.textContent=msg; toastEl.classList.add('show');
  clearTimeout(tTimer); tTimer=setTimeout(function(){ toastEl.classList.remove('show') },2200);
}
function row(icon,label,fn){
  var b=document.createElement('button'); b.className='row';
  b.innerHTML=icon+'<span>'+label+'</span>';
  b.addEventListener('click',function(ev){ ev.stopPropagation(); fn() });
  return b;
}
function goBack(){
  var here=location.href;
  // 兜底跳 App 下载页:本页在 /p/<port>/ 下,下载页是 /p/<port>/app。
  // 注意域名根路径的 /app 是 nginx 自己的 gateway 页,不是下载页。
  // 用 split 而非正则:本脚本是 Python 非 raw 字符串,正则转义斜杠会触发 SyntaxWarning。
  var seg=location.pathname.split('/');
  var appUrl='/app';
  if (seg[1]==='p' && seg[2]) appUrl='/p/'+seg[2]+'/app';
  if (history.length>1){
    history.back();
    setTimeout(function(){
      if (!document.hidden && location.href===here){ try{ location.href=appUrl }catch(e){} }
    },900);
  }else{ try{ location.href=appUrl }catch(e){} }
}
var fsRow=row(I_FS,'全屏',function(){
  var d=document.documentElement;
  var cur=document.fullscreenElement||document.webkitFullscreenElement;
  if (cur){
    (document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document);
    return;
  }
  var fn=d.requestFullscreen||d.webkitRequestFullscreen;
  if (!fn){ toast('此浏览器不支持网页全屏（iOS Safari 可用「添加到主屏幕」全屏打开）'); return }
  try{
    var r=fn.call(d);
    if (r && r.catch) r.catch(function(){ toast('浏览器拒绝了全屏请求') });
  }catch(e){ toast('浏览器拒绝了全屏请求') }
});
function syncFs(){
  var on=!!(document.fullscreenElement||document.webkitFullscreenElement);
  var sp=fsRow.querySelector('span'); if (sp) sp.textContent=on?'退出全屏':'全屏';
}
document.addEventListener('fullscreenchange',syncFs);
document.addEventListener('webkitfullscreenchange',syncFs);

var vpWrap=document.createElement('div'); vpWrap.className='vp';
var lbl=document.createElement('div'); lbl.className='lbl'; lbl.textContent='视口宽度（模拟屏幕宽度）';
var stepRow=document.createElement('div'); stepRow.className='stepper';
var minus=document.createElement('button'); minus.className='stp'; minus.textContent='−'; minus.setAttribute('aria-label','减小视口宽度');
var val=document.createElement('div'); val.className='val';
var plus=document.createElement('button'); plus.className='stp'; plus.textContent='+'; plus.setAttribute('aria-label','增大视口宽度');
var orientRow=document.createElement('div'); orientRow.className='stat';
orientRow.innerHTML=I_ROT+'<span>屏幕方向 · 竖屏</span>';
var hint=document.createElement('div'); hint.className='hint'; hint.textContent='长按中间数值恢复自适应';
stepRow.appendChild(minus); stepRow.appendChild(val); stepRow.appendChild(plus);
vpWrap.appendChild(lbl); vpWrap.appendChild(stepRow); vpWrap.appendChild(orientRow); vpWrap.appendChild(hint);
var VP_STEP=20;
function clampW(n){ if (!n || n<VP_MIN) return VP_MIN; if (n>VP_MAX) return VP_MAX; return n }
function curW(){
  var s=getPreset();
  if (!s) return clampW(parseInt(window.innerWidth||'0',10)||768);
  var m=s.match(/[0-9]+/);
  return clampW(m?parseInt(m[0],10):768);
}
function setW(n){
  n=clampW(n);
  var c='width='+n;
  try{ localStorage.setItem(keyFor(isLandscape()),c) }catch(e){}
  applyVp(c); enforceVp(true); syncVp();
  toast('视口已设为 '+n+'px 宽');
}
// 长按中间数值 = 恢复自适应。只清当前方向那一份,另一个方向记住的宽度不受影响。
function resetVp(){
  try{ localStorage.removeItem(keyFor(isLandscape())) }catch(e){}
  applyVp(VP_FIT); enforceVp(false); syncVp();
  toast('已恢复自适应视口');
}
function syncVp(){
  var s=getPreset();
  var n=curW();
  if (s){
    lbl.textContent='视口宽度（固定）';
    val.textContent=n+' px';
  }else{
    lbl.textContent='视口宽度 · 自适应';
    val.textContent='自适应';
  }
  hint.style.display=s?'':'none';   // 自适应时没有可恢复的东西,不摆提示占位
  minus.disabled=(n<=VP_MIN);
  plus.disabled=(n>=VP_MAX);
}
function syncOrient(){
  var land=isLandscape();
  var sp=orientRow.querySelector('span');
  if (sp) sp.textContent='屏幕方向 · '+(land?'横屏':'竖屏');
  return land;
}
var lastLand=syncOrient();
// 旋转:切到该方向记住的宽度;该方向没设过就回到自适应(不碰页面自己的 meta)。
function onOrient(){
  var land=syncOrient();
  if (land===lastLand){ syncVp(); return }
  lastLand=land;
  var s=getPreset();
  if (s){ applyVp(s); enforceVp(true) } else { applyVp(VP_FIT); enforceVp(false) }
  syncVp();
  toast(land?'已切到横屏 · 视口跟随横屏设置':'已切到竖屏 · 视口跟随竖屏设置');
}
try{ if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change',onOrient) }catch(e){}
try{ window.addEventListener('orientationchange',onOrient) }catch(e){}
var rzTimer=0;
try{
  window.addEventListener('resize',function(){
    clearTimeout(rzTimer); rzTimer=setTimeout(onOrient,180);
  });
}catch(e){}
minus.addEventListener('click',function(ev){ ev.stopPropagation(); setW(curW()-VP_STEP) });
plus.addEventListener('click',function(ev){ ev.stopPropagation(); setW(curW()+VP_STEP) });
// 点中间数值：就地换成数字输入框(回车/失焦确认)；长按：恢复自适应
var lpT=0, resetAt=0;
function lpStart(){
  clearTimeout(lpT);
  lpT=setTimeout(function(){ resetAt=Date.now(); resetVp() },600);
}
function lpEnd(){ clearTimeout(lpT) }
val.addEventListener('touchstart',lpStart,{passive:true});
['touchend','touchcancel','touchmove'].forEach(function(t){ val.addEventListener(t,lpEnd,{passive:true}) });
val.addEventListener('mousedown',lpStart);
['mouseup','mouseleave'].forEach(function(t){ val.addEventListener(t,lpEnd) });
val.addEventListener('click',function(ev){
  ev.stopPropagation();
  if (Date.now()-resetAt<800) return;   // 长按刚触发过,别把输入框也弹出来
  if (val.querySelector('input')) return;
  var inp=document.createElement('input');
  inp.type='number'; inp.className='vpin';
  inp.min=String(VP_MIN); inp.max=String(VP_MAX);
  inp.value=String(curW());
  val.textContent=''; val.appendChild(inp);
  inp.focus(); inp.select();
  function commit(){
    var n=parseInt(inp.value,10);
    if (n) setW(n); else syncVp();
  }
  inp.addEventListener('keydown',function(e){
    e.stopPropagation();
    if (e.key==='Enter') inp.blur();
    if (e.key==='Escape') inp.value='';
  });
  inp.addEventListener('blur',commit);
});
syncVp();

card.appendChild(row(I_BACK,'返回',goBack));
card.appendChild(fsRow);
card.appendChild(row(I_VP,'视口大小',function(){ vpWrap.classList.toggle('open') }));
card.appendChild(vpWrap);
root.appendChild(card); root.appendChild(fab); root.appendChild(toastEl);

fab.addEventListener('click',function(ev){ ev.stopPropagation(); root.classList.toggle('open') });
root.addEventListener('pointerdown',function(e){ e.stopPropagation() });
root.addEventListener('touchstart',function(e){ e.stopPropagation() },{passive:true});
var lp=0;
fab.addEventListener('touchstart',function(){
  lp=setTimeout(function(){ root.style.display='none'; toast('工具条已隐藏，切到后台再回来或刷新可恢复') },600);
},{passive:true});
['touchend','touchcancel','touchmove'].forEach(function(t){
  fab.addEventListener(t,function(){ clearTimeout(lp) },{passive:true});
});
// 隐藏的自动恢复保险:standalone 没有刷新按钮,iOS 冻结恢复会把隐藏状态一直带走,
// 所以隐藏只在「本次前台会话」内有效,切回前台立即放回来,不会再永久藏丢。
document.addEventListener('visibilitychange',function(){
  if (!document.hidden) root.style.display='';
});
window.addEventListener('pageshow',function(e){ if (e.persisted) root.style.display='' });

document.documentElement.appendChild(root);
new MutationObserver(function(){
  if (!root.isConnected){ root.style.display=''; document.documentElement.appendChild(root); }
}).observe(document.documentElement,{childList:true});
}catch(e){}
})();"""
_MOBILE_TOOLBAR_TAG = b'<script>' + _MOBILE_TOOLBAR_JS.encode('utf-8') + b'</script>'

# 面板根 HTML 加载动效:在 DSH Web 完全渲染前显示一个深色全屏 spinner,
# 告诉用户"正在连接,首次加载稍慢",避免看到空白页以为卡住。
# JS 自动消除:window load(资源加载完成) + #root 出现内容(SPA 渲染完成) + 20s 兜底。
# App(UA 含 DshRemote/)不注入——App 有自己的原生 loadingPanel。
_LOADING_SPLASH_HTML = """<div id="dsh-loading-splash" style="position:fixed;inset:0;z-index:99999;background:#121316;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity .4s;color:#fff">
<div style="width:36px;height:36px;border:3px solid rgba(255,255,255,.12);border-top-color:#4a9eff;border-radius:50%;animation:dshLdSpin .7s linear infinite"></div>
<div style="margin-top:18px;font-size:15px;font-weight:500;letter-spacing:.01em">正在连接你的电脑\u2026</div>
<div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,.4)">首次加载稍慢，请稍候</div>
<style>@keyframes dshLdSpin{to{transform:rotate(360deg)}}.dshLdFade{opacity:0!important;pointer-events:none}</style>
</div>
<script>
(function(){var s=document.getElementById('dsh-loading-splash');if(!s)return;
function h(){s.classList.add('dshLdFade');setTimeout(function(){try{s.remove()}catch(e){}},500)}
window.addEventListener('load',h);
var r=document.getElementById('root');if(r){var o=new MutationObserver(function(){if(r.children.length>0||(r.textContent||'').trim().length>0){h();o.disconnect()}});o.observe(r,{childList:true,subtree:true,characterData:true})}
setTimeout(h,20000)})()
</script>"""
_LOADING_SPLASH_TAG = _LOADING_SPLASH_HTML.encode('utf-8')

# ---- 文件卡片「下载」按钮：注入面板 HTML 的装饰脚本 ----
# 背景：DSH 网页端文件卡片(交付文件/聊天附件)在浏览器里没有任何下载通道 ——
# 卡片上的按钮是 POST /api/present.open「在电脑上打开」，聊天附件只有图片能拿字节。
# 远控场景(手机/平板)需要一个「下载」按钮把文件存到手机上，靠两个部件配合：
# ① 本脚本：在触屏设备上扫描卡片上带文件名的 aria-label/title(如「在侧边栏打开
#    xxx.apk」)，在动作按钮旁插一个指向 /browserctl-gate/file?name= 的「下载」链接；
# ② 闸机新端点 _gate_file_download：按文件名在本机白名单目录里找最新同名文件，
#   带 bc-gate 会话鉴权后流式返回(Content-Disposition: attachment)。
# App(WebView)侧配 1.0.45 起的 setDownloadListener，点链接即走系统下载管理器。
# 只对触屏设备生效(any-pointer: coarse / maxTouchPoints)，电脑浏览器零改动；
# 注入进 App(UA 含 DshRemote/) 与浏览器两种会话 —— 与工具条不同，App 也需要它。
_FILE_DL_JS = r"""(function(){
try{
if (window.__dshFileDl) return;
window.__dshFileDl = 1;
if (!(matchMedia('(any-pointer: coarse)').matches || navigator.maxTouchPoints > 0)) return;
var BASE = location.origin + '/browserctl-gate/file?name=';
var STYLE = 'display:inline-flex;align-items:center;align-self:center;padding:3px 10px;margin:0 2px 0 6px;'
  + 'font-size:11px;line-height:1.5;border-radius:8px;border:1px solid rgba(140,140,150,.5);'
  + 'color:inherit;opacity:.9;text-decoration:none;flex:0 0 auto;white-space:nowrap;'
  + '-webkit-tap-highlight-color:transparent;position:static;z-index:auto;';
/* 只认交付文件卡片的宿主:DSH 侧 aria-label 是「在侧边栏预览 <路径>」/「在侧边栏打开 <路径>」。
   绝不能按"任意 aria-label 里有文件名"来匹配——diff 头「查看 xxx.md 的改动」、图片查看器
   「xxx.jpg，点击查看原图」都会误中,把下载按钮挂满聊天流(2026-11-08 真机教训)。
   位置也必须挂在动作行([data-slot=deliverables.file.actions])里,而不是插进
   卡片预览按钮和图标之间——卡片是 position:relative+overflow:hidden,插中间会把
   Pill 挤到卡片内容下面并被裁掉一半(用户原话:「层级在整个卡片的下面」)。 */
var HOST_RE = /^在侧边栏(预览|打开)\s*(.+)$/;
function baseName(p){
  var seg = String(p || '').split(/[\\/]/);
  return (seg[seg.length - 1] || '').trim();
}
function pill(name){
  var a = document.createElement('a');
  a.setAttribute('data-dsh-dl', '1');
  a.href = BASE + encodeURIComponent(name);
  a.textContent = '下载';
  a.title = '下载 ' + name;
  a.setAttribute('style', STYLE);
  return a;
}
function decorate(card){
  var done = card.getAttribute('data-dsh-dl-card');
  var existing = card.querySelector('[data-dsh-dl]');
  if (done && existing) return;
  if (existing && existing.parentNode) { try { existing.parentNode.removeChild(existing); } catch (e) {} }
  var name = '';
  var els = card.querySelectorAll('[aria-label],[title]');
  for (var i = 0; i < els.length; i++){
    var s = els[i].getAttribute('aria-label') || els[i].getAttribute('title') || '';
    var m = HOST_RE.exec(s);
    if (m) { name = baseName(m[2]); break; }
  }
  if (!name || name.length < 4) return;
  var slot = card.querySelector('[data-slot="deliverables.file.actions"]');
  (slot || card).appendChild(pill(name));
  card.setAttribute('data-dsh-dl-card', '1');
}
function scan(){
  var cards = document.querySelectorAll('[data-presented-file]');
  for (var i = 0; i < cards.length; i++){ try { decorate(cards[i]); } catch (e) {} }
  var hosts = document.querySelectorAll('[aria-label],[title]');
  for (var j = 0; j < hosts.length; j++){
    var el = hosts[j];
    if (el.closest('[data-presented-file]')) continue;
    if (el.getAttribute('data-dsh-dl-host')) continue;
    var s = el.getAttribute('aria-label') || el.getAttribute('title') || '';
    var m = HOST_RE.exec(s);
    if (!m) continue;
    el.setAttribute('data-dsh-dl-host', '1');
    var name = baseName(m[2]);
    if (!name || name.length < 4) continue;
    var box = el.parentElement;
    if (!box || box.querySelector('[data-dsh-dl]')) continue;
    try { box.appendChild(pill(name)); } catch (e) {}
  }
}
var pending = null;
function queue(){
  if (pending) return;
  pending = setTimeout(function(){ pending = null; try { scan(); } catch (e) {} }, 300);
}
function start(){
  try {
    new MutationObserver(queue).observe(document.documentElement, {childList:true, subtree:true});
  } catch (e) {}
  queue(); setTimeout(queue, 900); setTimeout(queue, 2500);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
}catch(e){}
})();"""
_FILE_DL_TAG = b'<script>' + _FILE_DL_JS.encode('utf-8') + b'</script>'

GATE_MAX_AGE = COOKIE_LIFETIME_DAYS * 86400
TOTP_STEP = 30
REPLAY_WINDOW = 90          # 同码 90 秒内只认一次(防重放)
FAIL_LIMIT = 5              # 连错 N 次
LOCK_SECONDS = 15 * 60      # 冻结 15 分钟

# 闸机压缩(闸机在最靠近 DSH 的位置压,frpc 隧道只跑压缩后的字节,家里上行带宽立省)
GZIP_MIN_BYTES = 1024        # <1KB 不压(压了也省不了多少,还搭一个头)
GZIP_LEVEL = 6
COMPRESSIBLE_TYPES = ("text/", "application/json", "application/javascript",
                      "application/xml", "image/svg+xml", "application/manifest+json")

# SSE 空闲保活:静默 25s 注入一帧 ': keepalive' 注释行(SSE 规范要求客户端忽略,
# 零侵入),防 frps/中间链路把空闲流当死连接掐断。三条护栏缺一不可:
# 仅 event-stream、无 content-length(流式即无)、上游未压缩(往 gzip 流插明文会损坏字节流)。
SSE_KEEPALIVE_SECONDS = 25

# 一次性配对 grant(仿 remote-bridge one-time landing grant):
# 256 位熵、60s TTL、消费语义"先删后验"(重放无结果)、存活上限 FIFO 淘汰。
# 创建端点只允许本机 loopback 且不带隧道转发头(X-Real-IP/X-Forwarded-For)——
# 经 Nginx 隧道进来的请求即使源是 127.0.0.1 也带着转发头,双门禁天然挡公网。
PAIR_GRANT_TTL = 60
PAIR_MAX_LIVE = 8
# 手机 App 长期配对 grant:7 天有效,同样"先删后验"一次性消费,签发 bc-gate cookie(30天)。
LONG_PAIR_GRANT_TTL = 7 * 86400
LONG_PAIR_MAX_LIVE = 32
# 临时配对(一次性二维码)被手机 App 扫到时签发的 DSH cookie 有效期(小时):
# App 可以打开控制台用一会儿,但 cookie 很快过期 → 关掉再开必须重新扫码,
# 防止"临时链接被 App 长期占用"(与 7 天长期配对严格区分)。
TEMP_APP_COOKIE_HOURS = 1

# 资源上限:防慢速连接/大响应把闸机内存和线程池拖垮
MAX_RESPONSE_BYTES = 64 * 1024 * 1024   # 非流式响应超过此值自动改流式透传
MAX_SSE_CONCURRENT = 32
MAX_WS_CONCURRENT = 16
MAX_HEADER_BYTES = 64 * 1024
MAX_JSON_BODY_BYTES = 1024 * 1024          # JSON 端点请求体上限(verify/kick/blacklist 都是小对象,1MB 足够)
MAX_PROXY_BODY_BYTES = 256 * 1024 * 1024  # 反代透传上限(APK 上传走专用端点独立限 200MB,不占这里)

# 防爆破表本身有界:攻击者可伪造海量 IP,把 key 表撑到内存耗尽(仿 dsh-mobile
# BoundedRateLimiter)。表满且全是活跃冻结时,未知 IP 直接拒绝(fail-closed)。
FAIL_TABLE_MAX = 512
FAIL_TABLE_IDLE = 10 * 60   # 无新失败 10 分钟的条目可回收

# 闸机进程内存态
_gate_lock = threading.Lock()
_gate_cache = {"port": None, "ts": 0.0}
_used_codes = OrderedDict() # code -> 首次使用时间戳(有序,便于按插入序清理)
_fail_counts = OrderedDict() # ip -> [fail_count, lock_until_ts] (有界,见 FAIL_TABLE_MAX)
_grants = OrderedDict()     # grant -> {"exp": ts, "uses": N, "remaining": M}(可配置使用次数,默认一次性)
_sessions = {}              # dev_id -> {"ip":..., "ua":..., "ts":...}
_kick_seq_seen = 0
_ws_active = 0              # 当前 WS 中继数(并发上限,防线程池耗尽)
_sse_active = 0             # 当前 SSE 流数(并发上限)
_claim_hits = OrderedDict() # ip -> [count, window_start] (claim 端点限速,有界)
CLAIM_LIMIT = 30            # 每 IP 每 60s 最多 30 次 claim 尝试
CLAIM_WINDOW = 60


def gate_state():
    st = read_state()
    if not st.get("link_secret"):
        secret = _secrets.token_hex(16)
        # 字段级写:只落 link_secret(kb/06 第 24 条)。这里在请求热路径上,
        # 整份快照回写会覆盖并发写者的 frpc_pid/tunnel_ok 等字段。
        update_state(lambda s: {} if s.get("link_secret") else {**s, "link_secret": secret})
        st["link_secret"] = secret
    return st


def _tunnel_ready_or_reason():
    """隧道此刻能否对外服务。返回 (ok, 不可用原因)。

    供「生成二维码 / 配对链接 / 引导链接」的端点统一把关:frpc 没真正连上 frps 时,
    端口在服务器上没有监听,手机扫码配对会"成功"(配对走的是服务器 API),但打开面板
    立刻 502(官方 uid 反代报 ECONNREFUSED)。宁可拒绝出码并说明原因,也不给用户一张
    扫了必然打不开的二维码。

    兼容旧 state:tunnel_ok 是本次更新新增字段,升级前写下的 state 没有它,
    此时按「frpc 进程是否存活」兜底(保持原有行为,不把老用户拦死)。
    """
    st = read_state()
    port = int(st.get("remote_port") or 0)
    if port <= 0:
        return False, ("尚未建立隧道(远端端口未分配),无法生成二维码/配对链接;\n"
                       "请先在插件里登录官方账号并点「开始控制」")
    if "tunnel_ok" in st:
        if not st.get("tunnel_ok"):
            detail = str(st.get("tunnel_error") or "frpc 尚未把端口注册到 frps").strip()
            return False, "隧道未连通:" + detail[:900]
        pid = st.get("frpc_pid")
        if pid and not _pid_alive(pid):
            return False, "隧道进程已退出(frpc pid=%s),请点一次「开始控制」重建" % pid
        # 端口必须对得上:claim-port 换端口后,旧 frpc 注册的还是旧端口,state.tunnel_ok
        # 却可能还是 True —— 这种"假就绪"出码后必然 502(2026-11-06 实测)。
        running = _last_success_port(_frpc_log_tail(max(0, _frpc_log_size() - 65536)))
        if running and int(running) != int(port):
            return False, ("隧道端口不一致(本机 frpc 注册的是 %d,服务器分配的应是 %d),\n"
                           "请在面板重新点一次「开始控制」重建隧道" % (running, port))
        return True, ""
    pid = st.get("frpc_pid")
    if pid and not _pid_alive(pid):
        return False, "隧道进程已退出(frpc pid=%s),请点一次「开始控制」重建" % pid
    return True, ""


# ---- 上游连接池(DSH keep-alive) ----
# 每请求新建连接实测 1-16ms(本机含 TCP 握手),复用 0-1ms;公网整链(含 TLS+frp 隧道流)
# 新建中位 ~400ms vs 复用 ~85ms —— 这是"二次打开面板 1.9s"的主要构成。
# 池按端口分桶;DSH 重启/换端口时 resolve_dsh 整池作废,不会有跨代连接。
_UPSTREAM_POOL = {}          # port -> list[http.client.HTTPConnection]
_UPSTREAM_POOL_LOCK = threading.Lock()
_UPSTREAM_POOL_MAX = 8       # 每端口常驻上限(超出即关)


def _conn_alive(conn):
    """池内连接活性判据:对端在空闲期主动关闭(TCP FIN)会让 socket 变为可读。
    select 0 超时可读 = FIN 或残留字节,一律视为不可信;不可读才敢复用。"""
    s = conn.sock
    if s is None:
        return False
    try:
        r, _, _ = select.select([s], [], [], 0)
        return not r
    except (OSError, ValueError):
        return False


def _upstream_acquire(port):
    with _UPSTREAM_POOL_LOCK:
        pool = _UPSTREAM_POOL.get(port)
        while pool:
            conn = pool.pop()
            if _conn_alive(conn):
                return conn
            # 半死连接:丢弃,继续找
            try:
                conn.close()
            except Exception:
                pass
    return http.client.HTTPConnection("127.0.0.1", port, timeout=600)


def _upstream_release(port, conn, reusable):
    """可复用(响应已完整消费)才回池,否则关闭。"""
    if reusable:
        try:
            if conn.sock is not None:
                with _UPSTREAM_POOL_LOCK:
                    pool = _UPSTREAM_POOL.setdefault(port, [])
                    if len(pool) < _UPSTREAM_POOL_MAX:
                        pool.append(conn)
                        return
        except Exception:
            pass
    try:
        conn.close()
    except Exception:
        pass


def _upstream_drop_all():
    with _UPSTREAM_POOL_LOCK:
        pools = list(_UPSTREAM_POOL.values())
        _UPSTREAM_POOL.clear()
    for pool in pools:
        for c in pool:
            try:
                c.close()
            except Exception:
                pass


def resolve_dsh():
    with _gate_lock:
        cached = _gate_cache["port"]
    # 每请求只对缓存端口做一次本地 TCP 探测(约 0.2 ms):DSH 换端口能立刻发现,
    # 同时避免每 5 秒重跑一次 netstat/进程枚举(高并发时那才是偶发 2 s 卡顿的来源)。
    if cached and _port_open(cached, timeout=0.25):
        return cached
    port = None
    try:
        port = detect_port()
    except SystemExit:
        pass
    with _gate_lock:
        changed = _gate_cache["port"] != port
        _gate_cache["port"], _gate_cache["ts"] = port, time.time()
    if changed:
        # DSH 重启/换端口:旧 keep-alive 连接全部作废,防止跨代复用
        _upstream_drop_all()
    return port


# ---- TOTP (RFC 6238, SHA1/30s/6位, ±1 窗口) ----

def totp_code(secret_b32, offset=0):
    try:
        key = base64.b32decode(secret_b32 + "=" * (-len(secret_b32) % 8))
    except Exception:
        raise ValueError("TOTP 密钥格式非法")
    if len(key) < 10:
        raise ValueError("TOTP 密钥过短")
    counter = int(time.time()) // TOTP_STEP + offset
    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    o = digest[19] & 0x0F
    value = struct.unpack(">I", digest[o:o + 4])[0] & 0x7FFFFFFF
    return "%06d" % (value % 1000000)


def totp_verify(secret_b32, code):
    """返回 True/False;兼容 ±1 时间窗。"""
    if not secret_b32 or not code or not code.isdigit() or len(code) != 6:
        return False
    with _gate_lock:
        now = time.time()
        stale = [c for c, t in _used_codes.items() if now - t > REPLAY_WINDOW]
        for c in stale:
            _used_codes.pop(c, None)
        if code in _used_codes:
            return False  # 防重放
    for off in (0, -1, 1):
        try:
            candidate = totp_code(secret_b32, off)
        except ValueError:
            return False  # 密钥损坏/非法:失败关闭,不抛异常泄漏信息
        if hmac.compare_digest(candidate, code):
            with _gate_lock:
                _used_codes[code] = time.time()
            return True
    return False


def totp_uri(secret_b32, account="DeepSeekPanel"):
    safe_issuer = "DshRemote"
    return ("otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30"
            % (safe_issuer, account, secret_b32, safe_issuer))


# ---- 闸机会话 Cookie(HMAC 签名,形如 DSH 的 v1.body.sig) ----

def _b64u(b):
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def gate_mint_cookie(link_secret, dev_id, ip, ua):
    now_ms = int(time.time() * 1000)
    payload = {"v": 1, "dev": dev_id, "iat": now_ms, "exp": now_ms + GATE_MAX_AGE * 1000}
    body = _b64u(json.dumps(payload, separators=(",", ":")).encode())
    sig = _b64u(hmac.new(link_secret.encode(), body.encode(), hashlib.sha256).digest())
    return "v1.%s.%s" % (body, sig)


def gate_check_cookie(raw, link_secret):
    """校验 bc-gate Cookie;签名 + 有效期 + 会话仍在册(踢下线即失效)。"""
    if not raw:
        return None
    parts = raw.split(".")
    if len(parts) != 3 or parts[0] != "v1":
        return None
    body, sig = parts[1], parts[2]
    expect = _b64u(hmac.new(link_secret.encode(), body.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expect):
        return None
    try:
        pad = "=" * (-len(body) % 4)
        payload = json.loads(base64.urlsafe_b64decode(body + pad))
    except Exception:
        return None
    now_ms = int(time.time() * 1000)
    if payload.get("v") != 1 or payload.get("exp", 0) <= now_ms:
        return None
    dev = payload.get("dev")
    with _gate_lock:
        info = _sessions.get(dev)
        if info is None:
            return None
        info["ts"] = time.time()
    return dev


def gate_cookie_dev_only(raw, link_secret):
    """只校验签名与有效期,返回 dev;不要求会话仍在册。
    (用于 2FA 关闭时的设备身份识别:踢掉后仍能认出"这个设备被踢过"。)"""
    if not raw:
        return None
    parts = raw.split(".")
    if len(parts) != 3 or parts[0] != "v1":
        return None
    body, sig = parts[1], parts[2]
    expect = _b64u(hmac.new(link_secret.encode(), body.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expect):
        return None
    try:
        pad = "=" * (-len(body) % 4)
        payload = json.loads(base64.urlsafe_b64decode(body + pad))
    except Exception:
        return None
    now_ms = int(time.time() * 1000)
    if payload.get("v") != 1 or payload.get("exp", 0) <= now_ms:
        return None
    return payload.get("dev")


def _cap_kicked(items, cap=200):
    """已踢设备列表去重保序并限制长度,防无限膨胀。"""
    seen = set()
    out = []
    for it in items:
        if not it or it in seen:
            continue
        seen.add(it)
        out.append(it)
    return out[-cap:]


def _gate_kicked_set():
    """读取"已被踢下线"的设备集合(2FA 关闭时也生效)。"""
    try:
        return set(gate_state().get("gate_kicked_devs") or [])
    except Exception:
        return set()


# ---- 防爆破(表本身有界,防内存耗尽) ----

def _prune_tables_locked(now):
    """在持锁状态下回收过期条目:_used_codes 超重放窗口、_fail_counts 空闲超时。"""
    for code in [c for c, t in _used_codes.items() if now - t > REPLAY_WINDOW]:
        _used_codes.pop(code, None)
    for ip in [i for i, r in _fail_counts.items()
               if r[1] <= now and now - max(r[1], 0) > FAIL_TABLE_IDLE and r[0] == 0]:
        _fail_counts.pop(ip, None)


def brute_check(ip):
    with _gate_lock:
        now = time.time()
        _prune_tables_locked(now)
        rec = _fail_counts.get(ip)
        if rec and rec[1] > now:
            return False  # 冻结中
        if rec is None and len(_fail_counts) >= FAIL_TABLE_MAX:
            return False  # 表满且不可回收:未知 IP fail-closed(内存耗尽防护)
    return True


def brute_fail(ip):
    with _gate_lock:
        rec = _fail_counts.get(ip)
        if rec is None:
            if len(_fail_counts) >= FAIL_TABLE_MAX:
                _prune_tables_locked(time.time())
                if len(_fail_counts) >= FAIL_TABLE_MAX:
                    return  # 表满:丢弃(冻结中的真实攻击者仍在表里)
            rec = [0, 0.0]
            _fail_counts[ip] = rec
        _fail_counts.move_to_end(ip)
        rec[0] += 1
        if rec[0] >= FAIL_LIMIT:
            rec[1] = time.time() + LOCK_SECONDS
            rec[0] = 0


def brute_clear(ip):
    with _gate_lock:
        _fail_counts.pop(ip, None)


# ---- 全局防爆破熔断(2026-11-08 审计 P1-2③,配合防火墙把 16000-16999 收口) ----
# 单 IP 限速(FAIL_LIMIT 5 次/15min)挡不住"伪造海量源 IP"的分布式爆破:攻击者每次
# 换一个假 X-Real-IP 就是一张新桶。这里跨 IP 汇总:15 分钟滚动窗口内 /verify 的
# TOTP 失败总数超过阈值 → 熔断,所有 /verify 直接 429(与 IP 无关)。
# 内存计数即可,进程重启清零;结构自 bounding:窗口一过整体清零,不会无限增长。
VERIFY_GLOBAL_WINDOW = 15 * 60   # 统计窗口(秒),与单 IP 冻结时长一致
VERIFY_GLOBAL_FAIL_LIMIT = 200   # 窗口内全局失败上限,超过即熔断
_verify_global = {"count": 0, "ts": 0.0}   # count:窗口内失败数;ts:窗口起点


def _verify_global_window_check_locked(now):
    """持锁判定当前窗口:过期则重置(惰性),返回 (count, tripped)。"""
    if now - _verify_global["ts"] > VERIFY_GLOBAL_WINDOW:
        _verify_global["count"] = 0
        _verify_global["ts"] = now
    return _verify_global["count"], _verify_global["count"] > VERIFY_GLOBAL_FAIL_LIMIT


def verify_global_tripped():
    """/verify 入口先问一次:熔断中所有请求直接 429。"""
    with _gate_lock:
        _, tripped = _verify_global_window_check_locked(time.time())
        return tripped


def verify_global_fail_bump():
    """每次 TOTP/verify 失败调用:计入全局窗口。"""
    with _gate_lock:
        _verify_global_window_check_locked(time.time())
        _verify_global["count"] += 1


def claim_allowed(ip):
    """配对 claim 端点按 IP 限速(有界表):grant 本身 256 位不可爆破,
    限速只为挡住脚本刷屏与无意义的链接探测。"""
    now = time.time()
    with _gate_lock:
        for k in [k for k, r in _claim_hits.items() if now - r[1] > CLAIM_WINDOW]:
            _claim_hits.pop(k, None)
        rec = _claim_hits.get(ip)
        if rec is None:
            if len(_claim_hits) >= FAIL_TABLE_MAX:
                return False
            _claim_hits[ip] = [1, now]
            return True
        if now - rec[1] > CLAIM_WINDOW:
            rec[0], rec[1] = 1, now
            return True
        rec[0] += 1
        _claim_hits.move_to_end(ip)
        return rec[0] <= CLAIM_LIMIT


# ---- 一次性配对 grant(先删后验;创建仅限 loopback + 无隧道转发头) ----

def pair_create(ttl=PAIR_GRANT_TTL, max_live=PAIR_MAX_LIVE, prefix="", uses=1, kind="pair"):
    """生成配对 grant(默认 60s;uses 指定可被扫码/消费的次数,默认 1 次)。
    仅本机直连可调用(双门禁)。
    kind 区分 'pair'(临时配对) / 'long_pair'(App 长期配对)。
    判断种类必须用 kind 字段,不能靠前缀字符——普通随机码首位 1/64 概率恰好是 'L',
    靠前缀判断会把临时码误判成长期配对,绕过 2FA(安全债 C-01)。
    max_live 按 kind 分别计数:临时配对 8 个上限,长期配对 32 个上限,互不影响。"""
    grant = prefix + _secrets.token_urlsafe(32)
    now = time.time()
    try:
        uses = max(1, min(50, int(uses)))
    except (TypeError, ValueError):
        uses = 1
    with _gate_lock:
        for g in [g for g, rec in _grants.items() if rec.get("exp", 0) <= now]:
            _grants.pop(g, None)
        _grants[grant] = {"exp": now + ttl, "uses": uses, "remaining": uses, "kind": kind}
        # 只淘汰同种 kind 的最老 grant,不同种互不影响
        same_kind = [g for g, rec in _grants.items() if rec.get("kind") == kind]
        while len(same_kind) > max_live:
            oldest = same_kind.pop(0)
            _grants.pop(oldest, None)
    _dump_grants()
    return grant


def pair_create_long():
    """生成手机 App 长期配对 grant(7 天有效,一次性消费)。
    kind='long_pair' 标记:claim 时识别为长期配对,直接登记设备会话+签发 bc-gate cookie(免 2FA)。"""
    return pair_create(ttl=LONG_PAIR_GRANT_TTL, max_live=LONG_PAIR_MAX_LIVE, prefix="L", kind="long_pair")


def pair_claim(grant):
    """消费 grant:有效则剩余次数 -1,用尽或过期即删除。返回 True 表示有效。
    注意 _dump_grants 内部会取 _gate_lock,必须在锁外调用(否则死锁)。"""
    now = time.time()
    ok = False
    touched = False
    with _gate_lock:
        rec = _grants.get(grant)
        if rec is not None:
            touched = True
            if rec.get("exp", 0) <= now:
                _grants.pop(grant, None)          # 过期:删掉
            else:
                rec["remaining"] = int(rec.get("remaining", 1)) - 1
                ok = True
                if rec["remaining"] <= 0:
                    _grants.pop(grant, None)      # 次数用尽:删掉
    if touched:
        _dump_grants()
    return ok


def pair_status(grant):
    """查询 grant 当前状态(供本地面板轮询:检测到有人扫码后自动换码)。"""
    now = time.time()
    dropped = False
    with _gate_lock:
        rec = _grants.get(grant)
        if rec is not None and rec.get("exp", 0) <= now:
            _grants.pop(grant, None)
            dropped = True
            rec = None
        row = {"ok": True, "exists": rec is not None,
               "uses": int(rec.get("uses", 1)) if rec else 0,
               "remaining": int(rec.get("remaining", 1)) if rec else 0,
               "exp": rec.get("exp", 0) if rec else 0,
               "kind": rec.get("kind", "pair") if rec else ""}
    # 轮询很频繁,只有真的清掉了过期项才落盘(锁外调用,防死锁)
    if dropped:
        _dump_grants()
    return row


# ---- 引导链接:HMAC 签名 + 过期时间(gate 侧校验,替代 nginx 静态密钥比较) ----

def _b64u(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _b64u_dec(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def make_bootstrap_token(link_secret, ttl_seconds=86400, uses=1):
    """生成带过期时间与使用次数的引导 token:payload.exp + payload.u + HMAC-SHA256(link_secret)。
    比静态 link_secret 强的地方:URL 泄漏后只在 TTL 内可用,过期即自动失效;
    uses 限定可兑换次数(0=不限,缺省 1 次即"一次性"),由闸机侧记账强制执行。"""
    payload = {"v": 1, "exp": int(time.time()) + int(ttl_seconds),
               "n": _secrets.token_urlsafe(8), "u": int(uses)}
    body = _b64u(json.dumps(payload, separators=(",", ":")).encode())
    sig = _b64u(hmac.new(link_secret.encode(), body.encode(), hashlib.sha256).digest())
    return body + "." + sig


def verify_bootstrap_token(link_secret, token, now=None):
    """校验引导 token:先验签名(定长比较)再验过期。返回 payload 或 None。"""
    if not token or "." not in token:
        return None
    body, _, sig = token.partition(".")
    if not body or not sig:
        return None
    expect = _b64u(hmac.new(link_secret.encode(), body.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(expect, sig):
        return None
    try:
        payload = json.loads(_b64u_dec(body))
    except Exception:
        return None
    if not isinstance(payload, dict) or payload.get("v") != 1:
        return None
    if int(payload.get("exp", 0)) <= int(now if now is not None else time.time()):
        return None
    return payload


# ---- 引导链接使用次数记账(单次/限次)----
# 记账键 = token 里的随机 nonce(n),与链接一一对应;记录在有效期内保留,
# 用完也不立即删,这样重复扫码能提示"已用完"而不是笼统的"无效"。

BOOTSTRAP_FILE = HERE / "browserctl_bootstrap.json"
_bootstrap_lock = threading.Lock()
_bootstrap = {}          # nonce -> {"used": int, "exp": int, "u": int}

# 本地管理令牌:把「loopback 即管理员」降级为「loopback + 持有令牌」。
# 同用户的恶意程序仍然能读这个文件(Windows 单用户下无法根治),但能挡住:
# 其它用户的进程、沙箱里跑的其他智能体会话、被误开放到 0.0.0.0 的转发。
ADMIN_TOKEN_FILE = HERE / "browserctl_admin_token"


def admin_token(create=True):
    """读取(必要时创建)本地管理令牌,0600,不入库。"""
    try:
        tok = ADMIN_TOKEN_FILE.read_text(encoding="utf-8").strip()
        if len(tok) >= 32:
            return tok
    except Exception:
        pass
    if not create:
        return ""
    tok = os.urandom(24).hex()
    tmp = ADMIN_TOKEN_FILE.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(tok)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, ADMIN_TOKEN_FILE)
    harden_file_perms(ADMIN_TOKEN_FILE)
    return tok


def _load_bootstrap():
    """启动时恢复使用计数;已过期的记录直接丢弃(链接本身也已失效)。"""
    try:
        rows = json.loads(BOOTSTRAP_FILE.read_text(encoding="utf-8"))
    except Exception:
        return 0
    if not isinstance(rows, dict):
        return 0
    now = time.time()
    with _bootstrap_lock:
        for nonce, rec in rows.items():
            if not isinstance(rec, dict):
                continue
            if float(rec.get("exp") or 0) <= now:
                continue
            _bootstrap[str(nonce)] = {"used": int(rec.get("used") or 0),
                                      "exp": int(rec.get("exp") or 0),
                                      "u": int(rec.get("u") or 1)}
    return len(_bootstrap)


def _dump_bootstrap():
    """原子写(tmp + os.replace);只落未过期记录,避免文件无限增长。"""
    try:
        now = time.time()
        with _bootstrap_lock:
            rows = {k: dict(v) for k, v in _bootstrap.items()
                    if float(v.get("exp") or 0) > now}
        tmp = BOOTSTRAP_FILE.with_suffix(".json.tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False)
            f.flush()
            try:
                os.fsync(f.fileno())
            except OSError:
                pass
        os.replace(tmp, BOOTSTRAP_FILE)
    except Exception:
        pass


def _prune_bootstrap():
    """丢弃已过期记录(housekeeping 周期调用)。"""
    now = time.time()
    with _bootstrap_lock:
        dead = [k for k, v in _bootstrap.items() if float(v.get("exp") or 0) <= now]
        for k in dead:
            _bootstrap.pop(k, None)
    return len(dead)


def bootstrap_consume(nonce, exp, uses):
    """原子地消耗一次配额,返回 (ok, used, limit)。

    uses<=0 表示不限次数(不记账)。限次链接用完后记录仍保留,
    以便重复扫码时给出"已用完(used/limit)"的准确提示。
    """
    if uses <= 0:
        return True, 0, 0
    with _bootstrap_lock:
        rec = _bootstrap.get(nonce)
        if rec is None:
            rec = {"used": 0, "exp": int(exp), "u": int(uses)}
            _bootstrap[nonce] = rec
        limit = int(rec.get("u") or uses)
        if int(rec.get("used") or 0) >= limit:
            return False, int(rec.get("used") or 0), limit
        rec["used"] = int(rec.get("used") or 0) + 1
        used = rec["used"]
    _dump_bootstrap()
    return True, used, limit


# ---- 在线设备会话:落盘给插件读取 + 定向/全部踢下线 ----

SESSIONS_FILE = HERE / "browserctl_sessions.json"
EVENTS_FILE = HERE / "browserctl_events.json"
BLACKLIST_FILE = HERE / "browserctl_blacklist.json"
DEVICES_FILE = HERE / "browserctl_devices.json"
GRANTS_FILE = HERE / "browserctl_grants.json"
_EVENTS_MAX = 60

# ---- App 发布管理（APK 上传/版本配置/更新公告）----
APP_DIR = HERE / "browserctl_app"
APP_CONFIG_FILE = APP_DIR / "release_config.json"

APP_DEFAULT_CONFIG = {
    "enabled": False,
    "latest_version_name": "",
    "latest_version_code": 0,
    "min_supported_version_code": 0,
    "download_url": "",
    "release_notes": "",
    "force_update_message": "",
    "created_at": 0,
    "updated_at": 0,
}


def _app_config_read():
    """读取 App 发布配置。"""
    try:
        return json.loads(APP_CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception:
        return dict(APP_DEFAULT_CONFIG)


def _app_config_write(config):
    """原子写 App 发布配置。"""
    APP_DIR.mkdir(parents=True, exist_ok=True)
    config["updated_at"] = int(time.time() * 1000)
    tmp = APP_CONFIG_FILE.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, APP_CONFIG_FILE)


def _app_apks_list():
    """列出已上传的 APK 文件列表。"""
    APP_DIR.mkdir(parents=True, exist_ok=True)
    apks = []
    for f in sorted(APP_DIR.glob("*.apk"), key=lambda x: x.stat().st_mtime, reverse=True):
        st = f.stat()
        apks.append({
            "filename": f.name,
            "size": st.st_size,
            "mtime_ms": int(st.st_mtime * 1000),
            "url": "/browserctl-gate/app/download/" + f.name,
        })
    return apks


def _app_apk_delete(filename):
    """删除已上传的 APK 文件。"""
    safe_name = Path(filename).name
    if ".." in safe_name or "/" in safe_name:
        return False
    target = APP_DIR / safe_name
    if target.exists() and target.suffix.lower() == ".apk":
        target.unlink()
        return True
    return False


def _app_parse_version_from_filename(filename):
    """从文件名中解析版本号，例如 taoyuan-5.1.1.apk -> ("5.1.1", 50101)。"""
    m = re.search(r"(\d+)\.(\d+)\.(\d+)", filename)
    if m:
        version_name = m.group(0)
        version_code = int(m.group(1)) * 10000 + int(m.group(2)) * 100 + int(m.group(3))
        return version_name, version_code
    return "", 0


# ---- 文件卡片「下载」端点的名字解析 ----
# 客户端(手机卡片上的下载按钮)只带文件名,不带路径 —— 由闸机在几个白名单根里
# 找「最新同名文件」,天然没有目录穿越。找不到就 404,绝不猜路径。
# 工作区里跳过构建产物/临时目录(未签名中间产物 app-release.apk 也藏在 build/ 下,
# 绝不能让"同名优先"把它发出去);DSH 附件库 v1/files/<前缀>/<摘要>/<名字> 是
# 聊天里附带文件的硬链接引用路径,名字就落在路径里,直接按名字命中。
_DL_PRUNE_DIRS = {
    ".git", ".gradle", ".claude", ".dsh-vision-router", ".playwright-cli",
    ".vscode", ".idea", "node_modules", "__pycache__", "gradle", "build",
    "venv", ".venv", "_dsh_tmp", "_shots", "_shots_new", "chrome-profile",
    "acl-recovery", "extracted", "npm-cache", "mobile_verify", "e2e-ui-data",
    "data", "codeslots", "browserctl_app",
}
_DL_MIME = {
    ".apk": "application/vnd.android.package-archive",
    ".aab": "application/vnd.android.package-archive",
    ".jar": "application/java-archive",
    ".zip": "application/zip", ".7z": "application/x-7z-compressed",
    ".rar": "application/x-rar-compressed", ".gz": "application/gzip",
    ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
    ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
    ".log": "text/plain; charset=utf-8", ".json": "application/json",
    ".csv": "text/csv", ".mp4": "video/mp4", ".mp3": "audio/mpeg",
}
# 凭据拒绝名单（2026-11-08 收紧）：白名单根是整个工作区，而根下躺着一族
# 等同访问凭据的运行态/密钥文件（state 里有 totp_secret/link_secret、admin_token、
# secrets 里有 SSH/frp 口令、grants 是有效配对令牌、frpc.toml 里有 frp token）。
# 已配对设备虽属半信任，但绝不能由这个端点按名字点名拉走 —— 一律 404。
_DL_DENY_BASENAMES = {
    "keystore.properties", ".secret", ".git-credentials", ".htpasswd", ".npmrc",
}
_DL_DENY_EXTS = {".jks", ".keystore", ".p12", ".pfx", ".pem", ".key", ".env"}
_DL_DENY_STEMS = {"id_rsa", "id_ed25519", "id_ecdsa"}


def _download_denied(path):
    """该文件是否属于凭据/密钥族（命中则下载端点 404，连存在性都不暴露）。"""
    b = path.name.lower()
    if (b.startswith("browserctl_") or b in _DL_DENY_BASENAMES
            or path.suffix.lower() in _DL_DENY_EXTS
            or (b.rsplit(".", 1)[0] if "." in b else b) in _DL_DENY_STEMS):
        return True
    return False


def _walk_named_files(root, name):
    """在一个根目录树里按文件名找候选文件。带条数与时间预算,防止超大目录
    把闸机线程拖死(3 秒 / 3 万个条目,超了就用手上已有的结果)。"""
    hits = []
    if not root.is_dir():
        return hits
    budget = 30000
    deadline = time.time() + 3.0
    target = name.lower()
    try:
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames
                           if d not in _DL_PRUNE_DIRS and not d.startswith(".")]
            if target in (f.lower() for f in filenames):
                p = Path(dirpath) / name
                try:
                    if p.is_file() and not _download_denied(p):
                        hits.append(p)
                except OSError:
                    pass
            budget -= len(filenames) + len(dirnames)
            if budget <= 0 or time.time() > deadline:
                break
    except OSError:
        pass
    return hits


def _newest(paths):
    """mtime 最新的一个文件;stat 失败的条目忽略。"""
    best = None
    best_key = -1.0
    for p in paths:
        try:
            k = p.stat().st_mtime
        except OSError:
            continue
        if k > best_key:
            best, best_key = p, k
    return best


def _resolve_download_candidate(name):
    """按文件名找要发给手机的文件。优先级:App 发布目录(规范 APK 存放处) >
    工作区 > DSH 附件库;同优先级内取 mtime 最新。找不到返回 None。"""
    tiers = []
    app_dir = APP_DIR / name
    if app_dir.is_file() and not _download_denied(app_dir):
        tiers.append(app_dir)
    else:
        hits = _walk_named_files(HERE, name)
        if hits:
            tiers.append(_newest(hits))
        if not tiers:
            att_root = Path.home() / ".dsh" / "attachments" / "v1" / "files"
            if att_root.is_dir():
                hits = []
                try:
                    for p in att_root.iterdir():
                        if not p.is_dir():
                            continue
                        for d in p.iterdir():
                            if not d.is_dir():
                                continue
                            f = d / name
                            try:
                                if f.is_file() and not _download_denied(f):
                                    hits.append(f)
                            except OSError:
                                pass
                except OSError:
                    pass
                hit = _newest(hits)
                if hit:
                    tiers.append(hit)
    return tiers[0] if tiers else None


def _content_disposition(name):
    """RFC 6266 双写法:ASCII 兜底 + RFC 5987 UTF-8,中文名手机也能正确落盘。"""
    ascii_name = name.encode("ascii", "replace").decode("ascii").replace('"', "'")
    return 'attachment; filename="%s"; filename*=UTF-8\'\'%s' % (
        ascii_name, urllib.parse.quote(name, safe=""))


# ---- 消息推送(手机 App 长轮询) ----
NOTIFS_FILE = HERE / "browserctl_notifications.json"
PUSH_NOTIFS_MAX = 200      # 内存环形上限
PUSH_PERSIST_MAX = 100     # 持久化条数(闸机重启后 App 可补拉)
PUSH_POLL_BACKLOG = 20     # last=0 时回放的条数
PUSH_POLL_MAX_ITEMS = 50   # 单次响应最多条数
# 系统安全事件 → 推送标题映射(_append_event 挂钩)
SYSTEM_EVENT_TITLES = {
    "verify": "设备验证通过",
    "kick": "设备被踢下线",
    "ban": "黑名单拦截",
    "totp": "2FA 设置变更",
    "pair": "手机配对成功",
}
# 通知内存态(环形 + 单调递增 id),_notifs_lock 独立于 _gate_lock
_notifs = []
_notifs_seq = 0
_notifs_lock = threading.Lock()
# 事件日志锁:_append_event 是"读文件→追加→写文件"的非原子序列,
# 请求线程与 housekeeping 线程并发调用会互相吞事件,用独立锁串行化
# (与 _notifs_lock/_gate_lock 均无嵌套关系)。
_events_lock = threading.Lock()


def _atomic_write_file(path, text):
    """通用文本原子写(tmp + os.replace),读方永远见不到半截文件。
    供 notifs/events/sessions 等运行态小文件复用;state 走 update_state。"""
    tmp = None
    try:
        tmp = Path(str(path) + ".tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(text)
            f.flush()
            try:
                os.fsync(f.fileno())
            except OSError:
                pass
        os.replace(str(tmp), str(path))
        return True
    except Exception:
        try:
            if tmp is not None:
                tmp.unlink(missing_ok=True)
        except Exception:
            pass
        return False


def _atomic_json_write(path, obj):
    return _atomic_write_file(path, json.dumps(obj, ensure_ascii=False))

# 设备历史注册表(内存态,持久化到 DEVICES_FILE)
# 用独立锁保护,避免与 _gate_lock 产生可重入死锁
# (_device_ensure/_device_close 既在持 _gate_lock 的调用点被调,也在非持锁点被调)。
_devices = {}  # 稳定设备 key -> {key, name,kind,ip,ua,first_seen,last_seen,online,online_since,total_online,times}
_devices_lock = threading.Lock()

# "在线" = 最近 DEVICE_IDLE_SECONDS 内有请求/心跳。2FA 开启时会话会保留 30 天,
# 那只是"免验信任",不代表设备还连着;设备是否在线必须按活跃时间单独判定。
DEVICE_IDLE_SECONDS = 600

def _device_key(info):
    """稳定设备标识:App 用客户端持久 devid,浏览器用 dev(cookie 复用后稳定)."""
    return info.get("devid") or info.get("dev") or ""

def _device_ensure(key, info, online=True, last_seen=None):
    """登记/更新设备档案。info: session dict(ip/ua/name/kind/devid/dev).

    online=False 用于「启动时恢复历史会话」:只补档案元数据,不把设备标成在线
    (闸机刚起来时没有任何设备真的连着),在线状态交给后续心跳/请求建立。
    """
    if not key:
        return
    now = time.time()
    seen = float(last_seen) if last_seen else now
    with _devices_lock:
        d = _devices.get(key)
        if d is None:
            d = _devices[key] = {
                "key": key, "name": info.get("name", ""),
                "kind": info.get("kind", ""),
                "ip": info.get("ip", ""), "ua": info.get("ua", ""),
                "first_seen": seen, "last_seen": seen,
                "online": bool(online), "online_since": now if online else 0,
                "total_online": 0, "times": 1,
            }
        else:
            d["name"] = info.get("name") or d.get("name", "")
            d["ip"] = info.get("ip") or d.get("ip", "")
            d["ua"] = info.get("ua") or d.get("ua", "")
            if online:
                if not d.get("online"):
                    d["online"] = True
                    d["online_since"] = now
                    d["times"] = (d.get("times") or 0) + 1
                d["last_seen"] = now
            elif seen > (d.get("last_seen") or 0):
                d["last_seen"] = seen

def _device_close(key, at=None):
    """设备下线:累计在线时长并标记离线。

    at 为真实最后活跃时间(默认 now);空闲下线时传 last_seen,
    避免把"最后活跃"改写成"现在"(否则历史设备会一直显示"刚刚前在线")。
    """
    if not key:
        return
    now = time.time()
    when = float(at) if at else now
    with _devices_lock:
        d = _devices.get(key)
        if d and d.get("online"):
            start = d.get("online_since") or when
            if when > start:
                d["total_online"] = (d.get("total_online") or 0) + (when - start)
            d["online"] = False
            d["online_since"] = 0
            d["last_seen"] = when

def _load_devices():
    """启动时恢复设备档案:一律先置为离线,并结算上次运行残留的在线时长。

    是否在线以本次运行的实际请求/心跳为准(housekeeping 空闲 DEVICE_IDLE_SECONDS 后下线)。
    """
    try:
        rows = json.loads(DEVICES_FILE.read_text(encoding="utf-8"))
    except Exception:
        return 0
    if not isinstance(rows, list):
        return 0
    # 与磁盘会话对账:会话的 ts 才是真实最后活跃时间(心跳/验证都会更新它),
    # 用它把历史上被"启动即刷新 last_seen"污染的值修回来(取较小值,只会更准不会更假)。
    ts_by_key = {}
    try:
        sess_rows = json.loads(SESSIONS_FILE.read_text(encoding="utf-8"))
    except Exception:
        sess_rows = []
    for s in (sess_rows if isinstance(sess_rows, list) else []):
        if not isinstance(s, dict):
            continue
        k = s.get("devid") or s.get("dev") or ""
        if k:
            ts_by_key[k] = max(ts_by_key.get(k, 0.0),
                               float(s.get("ts") or s.get("since") or 0))
    with _devices_lock:
        for r in rows:
            if not isinstance(r, dict) or not r.get("key"):
                continue
            real = ts_by_key.get(r["key"])
            if real and (not r.get("last_seen") or real < r["last_seen"]):
                r["last_seen"] = real
            if r.get("online"):
                start = r.get("online_since") or 0
                end = r.get("last_seen") or start
                if end > start:
                    r["total_online"] = (r.get("total_online") or 0) + (end - start)
            r["online"] = False
            r["online_since"] = 0
            _devices[r["key"]] = r
    return len(_devices)

_last_sessions_payload = None
_last_devices_payload = None


def _dump_devices():
    global _last_devices_payload
    try:
        with _devices_lock:
            rows = [dict(d) for d in _devices.values()]
        # 锁外补 IP 归属地(ip_location 内部会取 _gate_lock,持 _devices_lock 调会锁序反转死锁)。
        # 归属地只写文件不写内存:ip_location 自带 12h 缓存,重复调用是内存命中。
        for r in rows:
            if not r.get("loc"):
                r["loc"] = ip_location(r.get("ip", ""))
        # 条件写盘:housekeeping 每 2s 调一次,内容没变就跳过(空闲时从每 2s 一写变零写)
        payload = json.dumps(rows, ensure_ascii=False, indent=1)
        if payload != _last_devices_payload:
            _last_devices_payload = payload
            DEVICES_FILE.write_text(payload, encoding="utf-8")
    except Exception:
        pass


def _notifs_load():
    """启动时从 NOTIFS_FILE 恢复内存环形缓冲与递增 id。"""
    global _notifs, _notifs_seq
    try:
        rows = json.loads(NOTIFS_FILE.read_text(encoding="utf-8")) or []
        if not isinstance(rows, list):
            rows = []
        _notifs = [r for r in rows if isinstance(r, dict) and r.get("id")]
        _notifs_seq = max([int(r.get("id", 0)) for r in _notifs] or [0])
    except Exception:
        _notifs = []
        _notifs_seq = 0


def _notifs_persist():
    """把最近 N 条通知落盘(重启后可补拉)。失败静默。"""
    try:
        with _notifs_lock:
            rows = _notifs[-PUSH_PERSIST_MAX:]
        _atomic_json_write(NOTIFS_FILE, rows)
    except Exception:
        pass


def _push_notify(kind, title, body):
    """入队一条推送通知,返回新 id;推送总开关(push_enabled)关闭时丢弃并返回 None。
    kind: system / task_done / need_input / test / error 等。"""
    global _notifs_seq
    try:
        st = gate_state()
        if not st.get("push_enabled"):
            return None
        title = (title or "").strip()[:120]
        body = (body or "").strip()[:500]
        if not title and not body:
            return None
        with _notifs_lock:
            _notifs_seq += 1
            row = {"id": _notifs_seq, "t": int(time.time()),
                   "kind": str(kind or "system")[:20],
                   "title": title, "body": body}
            _notifs.append(row)
            del _notifs[:-PUSH_NOTIFS_MAX]
        _notifs_persist()
        return _notifs_seq
    except Exception:
        return None


def _append_event(typ, msg):
    """事件日志(环形,最多 _EVENTS_MAX 条):验证/踢出/开关等,插件读走展示。
    开启 push_system 时,同步把可读系统事件推送到已配对的手机 App。
    读文件→追加→写文件用 _events_lock 串行化:并发调用(请求线程+housekeeping)
    会互相吞事件;写盘用原子替换,读方(_read_events/插件)见不到半截文件。"""
    try:
        with _events_lock:
            rows = []
            try:
                rows = json.loads(EVENTS_FILE.read_text(encoding="utf-8")) or []
            except Exception:
                rows = []
            if not isinstance(rows, list):
                rows = []
            rows.append({"t": int(time.time()), "typ": typ, "msg": msg[:200]})
            del rows[:-_EVENTS_MAX]
            _atomic_json_write(EVENTS_FILE, rows)
    except Exception:
        pass
    # 系统安全事件 → 手机推送(push_enabled + push_system 双重控制;_push_notify 再查一次总开关)
    try:
        st = gate_state()
        if st.get("push_system"):
            title = SYSTEM_EVENT_TITLES.get(typ)
            if title:
                _push_notify("system", title, msg)
    except Exception:
        pass


def _read_events():
    try:
        rows = json.loads(EVENTS_FILE.read_text(encoding="utf-8")) or []
        return rows if isinstance(rows, list) else []
    except Exception:
        return []


# ---- IP 归属地(设备列表显示) ----
_IP_LOC_CACHE = {}  # ip -> {"loc": str, "ts": float}
IP_LOC_TTL = 12 * 3600.0
IP_LOC_FAIL_TTL = 600.0


def _is_private_ip(ip):
    if not ip:
        return True
    if ip.startswith("10.") or ip.startswith("192.168.") or ip.startswith("127."):
        return True
    if ip.startswith("172."):
        try:
            b = int(ip.split(".")[1])
            if 16 <= b <= 31:
                return True
        except (ValueError, IndexError):
            return True
    if ip == "::1" or ip.lower().startswith("fe80"):
        return True
    return False


def ip_location(ip):
    """查询 IP 归属地(省+市),带内存缓存(12h)。只对外网 IP 做查询。"""
    if not ip or _is_private_ip(ip):
        return "内网"
    with _gate_lock:
        hit = _IP_LOC_CACHE.get(ip)
        now = time.time()
        if hit and now - hit["ts"] < IP_LOC_TTL:
            return hit["loc"]
    loc = ""
    try:
        url = "https://whois.pconline.com.cn/ipJson.jsp?ip=%s&json=true" % urllib.parse.quote(ip)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://whois.pconline.com.cn/"})
        with urllib.request.urlopen(req, timeout=3.0) as r:
            raw = r.read()
        try:
            j = json.loads(raw.decode("utf-8"))
        except Exception:
            j = json.loads(raw.decode("gb18030"))
        pro = (j.get("pro") or "").strip()
        city = (j.get("city") or "").strip()
        if pro and city:
            loc = pro + city
        elif pro:
            loc = pro
        elif city:
            loc = city
    except Exception:
        loc = ""
    ttl = IP_LOC_TTL if loc else IP_LOC_FAIL_TTL
    with _gate_lock:
        _IP_LOC_CACHE[ip] = {"loc": loc, "ts": time.time()}
    return loc or ""


def _dump_sessions():
    global _last_sessions_payload
    with _gate_lock:
        now = time.time()
        rows = [
            {"dev": dev, "ip": info.get("ip", ""), "ua": info.get("ua", ""),
             "name": info.get("name", ""), "kind": info.get("kind", ""),
             "devid": info.get("devid", ""),
             "since": info.get("since", info.get("ts", now)),
             "ts": info.get("ts", now)}
            for dev, info in _sessions.items()
        ]
    # 锁外查 IP 归属地:避免网络请求卡住其他闸机操作
    for row in rows:
        row["loc"] = ip_location(row.get("ip", ""))
    # 条件写盘:housekeeping 每 2s 调一次,内容没变就跳过。锁内只剩序列化,
    # 空闲时(设备无新请求)不再每 2s 两次写盘,锁竞争窗口也随之消失。
    payload = json.dumps(rows, ensure_ascii=False, indent=1)
    if payload != _last_sessions_payload:
        _last_sessions_payload = payload
        # 原子替换写:插件/fwd 随时在读这个文件,不能让它读到半截 JSON
        _atomic_write_file(SESSIONS_FILE, payload)
    # 同步写入设备历史注册表
    _dump_devices()


def _load_sessions():
    """闸机启动时从磁盘恢复已认证设备:设备认过 2FA 后,
    30 天内(或直到被踢下线)不再要求输入动态码。"""
    try:
        rows = json.loads(SESSIONS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return 0
    now = time.time()
    restored = 0
    with _gate_lock:
        for r in rows if isinstance(rows, list) else []:
            dev = r.get("dev") if isinstance(r, dict) else None
            if not dev:
                continue
            since = float(r.get("since") or r.get("ts") or now)
            if now - since > GATE_MAX_AGE:  # Cookie 同样过期,不必保留
                continue
            _sessions[dev] = {
                "ip": r.get("ip", ""),
                "ua": r.get("ua", ""),
                "name": r.get("name", ""),
                "kind": r.get("kind", ""),
                "devid": r.get("devid", ""),
                "since": since,
                "ts": float(r.get("ts") or since),
            }
            # 只恢复"受信任会话",不把设备标成在线:闸机刚起来时没有任何设备真的连着,
            # 在线状态由后续心跳/请求重新建立(否则 2FA 30 天保留会让设备永远"在线")。
            _device_ensure(_device_key({"dev": dev, **r}), _sessions[dev],
                           online=False, last_seen=_sessions[dev]["ts"])
            restored += 1
    # 为已恢复的会话补 IP 归属地 + 设备注册,写入文件(锁已释放)
    if restored:
        _dump_sessions()
    return restored


# ---- 配对 grant 落盘:长期配对的有效期是 7 天,不能只活在进程内存里 ----
# 症状:在面板上点「App 配对」生成二维码,过一会儿(闸机被看门狗拉起 / stop+start /
# 插件 ensure / 用户重启电脑)再扫,闸机回 403「配对链接已失效」,手机 App 显示
# 「配对已失效或未授权」。临时配对 60s 内就被消费掉了,所以从来看不出问题 ——
# 这正是"一次性链接能进、长期链接进不去"。落盘后重启不再丢已经发出去的码。

def _dump_grants():
    """把未过期的 grant 写入 GRANTS_FILE(原子写;失败不抛,不影响配对主流程)。"""
    now = time.time()
    with _gate_lock:
        items = [(g, dict(rec)) for g, rec in _grants.items()
                 if float(rec.get("exp", 0)) > now]
    if not items:
        try:
            GRANTS_FILE.unlink()
        except OSError:
            pass
        return
    payload = json.dumps({"ts": now,
                          "grants": {g: rec for g, rec in items}},
                         ensure_ascii=False, indent=1)
    tmp = GRANTS_FILE.with_suffix(".json.tmp")
    try:
        tmp.write_text(payload, encoding="utf-8")
        os.replace(tmp, GRANTS_FILE)
    except Exception:
        try:
            tmp.unlink()
        except OSError:
            pass


def _load_grants():
    """闸机启动时恢复未过期的 grant,让已经发出去的二维码仍然可用。"""
    try:
        raw = json.loads(GRANTS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return 0
    rows = raw.get("grants") if isinstance(raw, dict) else None
    if not isinstance(rows, dict):
        return 0
    now = time.time()
    restored = 0
    with _gate_lock:
        for g, rec in rows.items():
            if not isinstance(rec, dict):
                continue
            try:
                exp = float(rec.get("exp", 0))
                uses = max(1, min(50, int(rec.get("uses", 1))))
                remaining = max(0, min(uses, int(rec.get("remaining", 1))))
            except (TypeError, ValueError):
                continue
            if exp <= now or remaining <= 0:
                continue
            _grants[g] = {"exp": exp, "uses": uses, "remaining": remaining,
                          "kind": rec.get("kind", "pair")}
            restored += 1
    # 清掉文件里已过期的残留,避免文件只涨不缩
    if restored:
        _dump_grants()
    return restored


def _browser_tag(ua):
    """从 UA 提取浏览器名+大版本(Edge > Firefox > Chrome/Chromium/CriOS > Safari)。
    无匹配返回空串。手机浏览器开"电脑版"模式时 UA 是 X11; Linux,只能靠浏览器名辨认。"""
    import re
    u = ua or ""
    m = re.search(r'Edg(?:e|A|iOS)?/(\d+)', u)
    if m:
        return "Edge " + m.group(1)
    m = re.search(r'Firefox/(\d+)', u)
    if m:
        return "Firefox " + m.group(1)
    m = re.search(r'(?:Chrome|Chromium|CriOS)/(\d+)', u)
    if m:
        return "Chrome " + m.group(1)
    m = re.search(r'Version/(\d+)', u)
    if m and "Safari" in u:
        return "Safari " + m.group(1)
    return ""


def _friendly_device_name(ua):
    """从 User-Agent 解析友好设备名,非 App/脚本的普通浏览器追加「· 浏览器 大版本」。
    例:Linux · Chrome 141(手机浏览器电脑版模式)、Windows 10/11 · Edge 141。"""
    os_name = _device_os_name(ua)
    b = _browser_tag(ua)
    if b and not os_name.startswith("DSH Remote") \
            and "脚本" not in os_name and "命令行" not in os_name \
            and os_name not in ("未知设备",):
        return os_name + " · " + b
    return os_name


def _device_os_name(ua):
    """从 User-Agent 解析设备/OS 名称(不含浏览器后缀)。"""
    u = (ua or "").strip()
    if not u:
        return "未知设备"
    # DSH Remote 手机 App（WebView 里带了专属标识）
    if "DshRemote/" in u:
        import re
        m = re.search(r'Android\s+([\d.]+)', u)
        mm = re.search(r';\s*([^/\s;]+)\s*Build/', u)
        model = (" " + mm.group(1)) if mm else ""
        ver = (" " + m.group(1)) if m else ""
        return "DSH Remote · Android%s%s" % (ver, model)
    # 脚本/爬虫
    if "Python-urllib" in u:
        return "脚本/API"
    if "curl/" in u or "wget/" in u:
        return "命令行工具"
    # 移动端设备名
    import re
    # iPhone 型号
    m = re.search(r'iPhone\s*OS\s*(\d+[\d_]*)', u)
    if m:
        ver = m.group(1).replace("_", ".")
        return "iPhone iOS %s" % ver
    # Android 设备型号(通常是 "Linux; Android X; Model" 格式)
    m = re.search(r'Android\s+([\d.]+)', u)
    model = ""
    mm = re.search(r';[\s]*([^/\s;]+)\s*Build/', u)
    if mm:
        model = " " + mm.group(1)
    if m:
        return "Android%s%s" % (m.group(1), model)
    # macOS
    m = re.search(r'Mac\s*OS\s*X\s*([\d_]+)', u)
    if m:
        return "macOS %s" % m.group(1).replace("_", ".")
    # Windows
    m = re.search(r'Windows\s*NT\s*([\d.]+)', u)
    wn = {"10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7", "6.0": "Vista", "5.2": "XP x64", "5.1": "XP"}
    if m:
        ver = wn.get(m.group(1), m.group(1))
        return "Windows " + ver
    # Linux
    if "Linux" in u:
        return "Linux"
    if "CrOS" in u:
        return "ChromeOS"
    # 兜底:取第一个有意义的字段
    if u.startswith("Mozilla/"):
        parts = u.split("(")
        if len(parts) > 1:
            inside = parts[1].split(")")[0]
            return inside.split(";")[0].strip()[:30]
    return u[:30]


# ---- 黑名单 ----

def _read_blacklist():
    try:
        rows = json.loads(BLACKLIST_FILE.read_text(encoding="utf-8"))
        return rows if isinstance(rows, list) else []
    except Exception:
        return []


def _write_blacklist(rows):
    if not isinstance(rows, list):
        rows = []
    # 去重:一个 IP 只能有一条
    seen_ip = set()
    deduped = []
    for r in rows:
        ip = r.get("ip", "").strip()
        if not ip or ip in seen_ip:
            continue
        seen_ip.add(ip)
        deduped.append(r)
    try:
        BLACKLIST_FILE.write_text(json.dumps(deduped, ensure_ascii=False), encoding="utf-8")
    except Exception:
        pass
    return deduped


def _blacklist_check(ip, dev):
    """返回被阻止的摘要,如果不在黑名单则返回 None。"""
    rows = _read_blacklist()
    for r in rows:
        if r.get("ip") == ip:
            return r.get("reason") or "被管理员拉黑"
        if r.get("dev") == dev:
            return r.get("reason") or "被管理员拉黑"
    return None


def _process_kicks():
    """消费 state.gate_kick_devs(定向踢)与 gate_kick_seq(全部踢)。
    定向踢一律记入"已踢"名单(与 _gate_kick 对齐,2FA 开启/关闭都生效),
    防设备带旧 Cookie 重新登记;全部踢(seq 路径)仅 2FA 关闭时记——该路径
    不识别管理员,2FA 开启时若也记会把管理员自己锁在验证页之外。"""
    global _kick_seq_seen
    try:
        st = read_state()
    except Exception:
        return
    devs = st.get("gate_kick_devs") or []
    seq = st.get("gate_kick_seq", 0)
    changed = False
    kicked_any = False
    twofa_off = not st.get("totp_enabled")
    kicked_extra = []
    ssh_pending = []   # SSH 反注册收集在锁内、执行在锁外(单次 SSH 最多 ~15s)
    if devs:
        with _gate_lock:
            for d in devs:
                info = _sessions.pop(d, None)
                if info is not None:
                    _device_close(_device_key({"dev": d, **info}))
                    changed = True
                    kicked_any = True
                    _append_event("kick", "踢出设备 %s" % d)
                    ssh_pending.append(d)
                kicked_extra.append(d)
        st["gate_kick_devs"] = []
        changed = True
    if seq != _kick_seq_seen:
        _kick_seq_seen = seq
        with _gate_lock:
            if twofa_off:
                kicked_extra.extend(list(_sessions.keys()))
            # 通知服务器清除全部设备 + 关闭设备历史条目(SSH 挪锁外)
            for d in list(_sessions.keys()):
                info = _sessions[d]
                _device_close(_device_key({"dev": d, **info}))
                ssh_pending.append(d)
            _sessions.clear()
        changed = True
        kicked_any = True
        _append_event("kick", "全部踢下线")
    if kicked_extra:
        st["gate_kicked_devs"] = _cap_kicked([*(st.get("gate_kicked_devs") or []), *kicked_extra])
        changed = True
    # SSH 反注册全部放到 _gate_lock 外执行:失败只继续,不影响本地踢出
    for d in ssh_pending:
        try:
            _server_unregister_device(d)
        except BaseException:
            pass
    if changed:
        # 字段级写:只动 kick 相关键(kb/06 第 24 条)。st 的 gate_kick_devs/gate_kicked_devs
        # 是本函数真正要写的;frpc_pid/tunnel_ok 等一律保留磁盘当前值。
        try:
            update_state(lambda s: {**s,
                                    "gate_kick_devs": st.get("gate_kick_devs") if devs else s.get("gate_kick_devs"),
                                    "gate_kicked_devs": st.get("gate_kicked_devs", s.get("gate_kicked_devs"))})
        except Exception:
            pass
    if kicked_any:
        # 关键:踢完必须同步设备列表文件。否则面板仍显示"在线",而且闸机重启
        # 会把文件里的被踢设备原样恢复回来(踢下线形同虚设)。
        _dump_sessions()


# ---- 登录页 ----

# 裸面板 URL 未通过验证时展示的页面:什么都不显示(纯黑空页)。
# 2FA 页只在带 token 的配对/引导链接之后才出现,避免裸 URL 成为可进入的入口。
DENIED_HTML = (
    "<!doctype html><html lang='zh-CN'><head><meta charset='utf-8'><title>403</title>"
    "<style>html,body{background:#000;height:100%;margin:0}</style></head>"
    "<body></body></html>"
)

# ---- App 下载页 HTML 模板(JS 动态加载版本信息) ----
_APP_DOWNLOAD_PAGE_TEMPLATE = r"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>DSH Remote - 下载 App</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0d1117;color:#e8e4d9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center}
.app-backdrop{position:fixed;inset:0;z-index:-1;background:radial-gradient(ellipse at 20% 50%,rgba(200,164,92,0.06) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(200,164,92,0.04) 0%,transparent 50%)}
.app-wrap{width:100%;max-width:560px;padding:32px 20px 48px}
.app-header{text-align:center;margin-bottom:28px}
.app-logo{width:72px;height:72px;border-radius:16px;margin:0 auto 12px;background:#1a1d2e;display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:0 4px 24px rgba(0,0,0,0.3)}
.app-title{font-size:1.5rem;font-weight:700;color:#c8a45c;letter-spacing:0.04em}
.app-subtitle{font-size:.8125rem;color:rgba(200,164,92,0.5);margin-top:4px}
.app-card{background:rgba(20,24,34,0.85);border:1px solid rgba(200,164,92,0.2);border-radius:12px;padding:24px;margin-bottom:16px;transition:border-color .15s}
.app-card:hover{border-color:rgba(200,164,92,0.4)}
.app-card-header{display:flex;align-items:center;gap:8px;font-size:.875rem;font-weight:600;color:#c8a45c;padding-bottom:14px;border-bottom:1px solid rgba(200,164,92,0.12);margin-bottom:16px}
.app-card-header svg{width:18px;height:18px;flex-shrink:0}
.app-loading{text-align:center;padding:60px 0;font-size:.8125rem;color:rgba(200,164,92,0.5)}
.app-error{text-align:center;padding:40px 20px;color:#ff9da0}
.app-error button{margin-top:12px;padding:8px 20px;background:rgba(200,164,92,0.15);color:#c8a45c;border:1px solid rgba(200,164,92,0.3);border-radius:6px;cursor:pointer;font-size:.8125rem}
.app-error button:hover{background:rgba(200,164,92,0.25)}
.app-version-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.app-version-box{background:rgba(14,18,28,0.6);border:1px solid rgba(200,164,92,0.12);border-radius:8px;padding:14px}
.app-version-label{font-size:.6875rem;color:rgba(200,164,92,0.5);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.app-version-value{font-size:1.25rem;font-weight:700;color:#c8a45c}
.app-version-code{font-size:.6875rem;color:rgba(200,164,92,0.4);font-family:monospace;margin-top:2px}
.app-dl-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 20px;font-size:.9375rem;font-weight:600;border-radius:8px;cursor:pointer;text-decoration:none;transition:all .15s;background:rgba(200,164,92,0.92);color:#0d1117;border:none;margin-bottom:16px}
.app-dl-btn:hover{background:rgba(200,164,92,1);box-shadow:0 0 20px rgba(200,164,92,0.3)}
.app-dl-btn:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}
.app-dl-btn svg{width:18px;height:18px}
.app-release-notes{background:rgba(14,18,28,0.5);border:1px solid rgba(200,164,92,0.1);border-radius:8px;padding:14px}
.app-release-label{display:flex;align-items:center;gap:6px;font-size:.75rem;font-weight:600;color:#c8a45c;margin-bottom:8px}
.app-release-label svg{width:14px;height:14px}
.app-release-body{font-size:.75rem;line-height:1.7;color:rgba(200,164,92,0.75);white-space:pre-wrap;word-break:break-word}
.app-empty{text-align:center;padding:40px 0;font-size:.8125rem;color:rgba(200,164,92,0.5)}
.app-footer{margin-top:24px;text-align:center;padding-top:16px;border-top:1px solid rgba(200,164,92,0.08)}
.app-footer p{font-size:.6875rem;color:rgba(200,164,92,0.35);margin:4px 0}
.app-footer a{color:rgba(200,164,92,0.5);text-decoration:none}
.app-footer a:hover{color:#c8a45c}
.app-downloaded{display:none;text-align:center;padding:12px;background:rgba(76,175,80,0.15);border:1px solid rgba(76,175,80,0.3);border-radius:8px;margin-bottom:16px;font-size:.8125rem;color:#81c784}
.app-downloaded.show{display:block}
</style>
</head>
<body>
<div class="app-backdrop"></div>
<div class="app-wrap">
  <div class="app-header">
    <div class="app-logo">🛡</div>
    <h1 class="app-title">DSH Remote</h1>
    <p class="app-subtitle">远程助手 · 安卓客户端</p>
  </div>
  <div id="app-loading" class="app-loading">加载中...</div>
  <div id="app-content" style="display:none">
    <div class="app-card" id="app-download-card">
      <div class="app-card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>安卓 APK 下载</span>
      </div>
      <div id="app-enabled-section">
        <div class="app-version-grid">
          <div class="app-version-box">
            <div class="app-version-label">最新版本</div>
            <div class="app-version-value" id="app-version-name">--</div>
            <div class="app-version-code" id="app-version-code">版本号 --</div>
          </div>
          <div class="app-version-box">
            <div class="app-version-label">最低支持</div>
            <div class="app-version-value" id="app-min-version" style="font-size:1rem;color:rgba(200,164,92,0.6)">--</div>
          </div>
        </div>
        <a class="app-dl-btn" id="app-dl-btn" href="#" download rel="noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span id="app-dl-text">下载 APK</span>
        </a>
        <div id="app-downloaded-toast" class="app-downloaded">下载已开始</div>
        <div id="app-release-section" style="display:none">
          <div class="app-release-notes">
            <div class="app-release-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span>更新说明</span>
            </div>
            <div class="app-release-body" id="app-release-body"></div>
          </div>
        </div>
      </div>
      <div id="app-disabled-section" class="app-empty" style="display:none">
        <p>暂无可用下载</p>
        <p style="font-size:.6875rem;margin-top:6px;color:rgba(200,164,92,0.35)">管理员发布后即可在此下载</p>
      </div>
    </div>
  </div>
  <div class="app-footer">
    <p>已安装 App 的用户可在应用内自动检查更新</p>
    <p>如遇问题请访问 <a href="https://remote.ymzcc.com">remote.ymzcc.com</a></p>
  </div>
</div>
<script>
(function(){var L=document.getElementById("app-loading"),C=document.getElementById("app-content"),E=document.getElementById("app-enabled-section"),D=document.getElementById("app-disabled-section"),VN=document.getElementById("app-version-name"),VC=document.getElementById("app-version-code"),MV=document.getElementById("app-min-version"),DL=document.getElementById("app-dl-btn"),DT=document.getElementById("app-dl-text"),RB=document.getElementById("app-release-body"),RS=document.getElementById("app-release-section"),TO=document.getElementById("app-downloaded-toast");function load(){fetch("browserctl-gate/app/version").then(function(r){return r.json()}).then(function(d){L.style.display="none";C.style.display="block";if(!d.ok||!d.enabled){E.style.display="none";D.style.display="block";return}VN.textContent=d.latest_version_name||"未知";VC.textContent="版本号 "+(d.latest_version_code||"?")+" · 最低 "+(d.min_supported_version_code||"无");MV.textContent=d.min_supported_version_code?String(d.min_supported_version_code):"无限制";var url=d.download_url;if(url){DL.href=url;DL.addEventListener("click",function(){TO.classList.add("show");setTimeout(function(){TO.classList.remove("show")},3000)});DT.textContent="下载 APK"+(d.latest_version_name?" ("+d.latest_version_name+")":"")}else{DL.style.display="none"}if(d.release_notes){RB.textContent=d.release_notes;RS.style.display="block"}}).catch(function(e){L.style.display="none";C.innerHTML='<div class="app-error"><p>加载失败</p><button onclick="load()">重试</button></div>'})}load()})()
</script>
</body>
</html>"""

GATE_HTML = r"""<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#121212">
<title>DSH 远程助手 · 两步验证</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;
background:radial-gradient(1200px 600px at 50% -10%,#1e2430 0%,#121316 55%,#0d0e11 100%);
color:#e7e9ee;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;
-webkit-font-smoothing:antialiased}

/* ===== 2FA 卡片 ===== */
.card{width:min(380px,94vw);padding:30px 26px 26px;border:1px solid #2a2c33;border-radius:18px;
background:linear-gradient(180deg,#1c1e24 0%,#181a1f 100%);
box-shadow:0 24px 60px rgba(0,0,0,.55),0 1px 0 rgba(255,255,255,.04) inset;text-align:center}
.badge{width:56px;height:56px;margin:0 auto 14px;border-radius:50%;display:flex;align-items:center;justify-content:center;
color:#38bdf8;background:rgba(59,130,246,.14);border:1px solid rgba(59,130,246,.32)}
.badge svg{display:block}
h1{font-size:17px;font-weight:700;margin:0 0 6px;letter-spacing:.2px}
.sub{color:#8b8f98;font-size:12.5px;line-height:19px;margin:0 0 20px}
#otpGroup{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;cursor:text}
.ocell{width:40px;height:52px;border-radius:10px;border:1.5px solid #2f333c;background:#101115;color:#e7e9ee;font-size:24px;font-weight:700;font-family:ui-monospace,Consolas,monospace;text-align:center;outline:none;caret-color:#3d7eff;transition:border-color .15s,box-shadow .15s,transform .08s;-webkit-appearance:none;appearance:none;box-sizing:border-box;padding:0}.ocell:focus{border-color:#5b93ff;box-shadow:0 0 0 3px rgba(61,126,255,.14)}.ocell.filled{border-color:#3d7eff;box-shadow:0 0 0 3px rgba(61,126,255,.14)}
.otp-cell{width:40px;height:52px;border-radius:10px;border:1.5px solid #2f333c;background:#101115;color:#e7e9ee;
font-size:24px;font-weight:700;font-family:ui-monospace,Consolas,monospace;display:flex;align-items:center;justify-content:center;
transition:border-color .15s,box-shadow .15s,transform .08s}
.otp-cell.filled{border-color:#3d7eff;box-shadow:0 0 0 3px rgba(61,126,255,.14)}
.otp-cell.cur{border-color:#5b93ff}
.otp-div{width:12px;height:2px;background:#3a3e48;border-radius:2px;opacity:.7;margin:0 2px;flex:none}
button#go{width:100%;padding:13px;font-size:14px;font-weight:600;border:none;border-radius:12px;
background:linear-gradient(180deg,#4c8bff,#3d7eff);color:#fff;cursor:pointer;margin-top:6px;
transition:filter .15s,transform .06s;box-shadow:0 8px 20px rgba(61,126,255,.28)}
button#go:hover{filter:brightness(1.07)} button#go:active{transform:translateY(1px)} button#go:disabled{opacity:.55;cursor:default;box-shadow:none}
.msg{margin-top:12px;font-size:12.5px;min-height:17px;color:#e5655c}
.hint{margin-top:16px;padding-top:14px;border-top:1px solid #24272e;color:#6f747e;font-size:11.5px;line-height:17px}

/* ===== 开场动画 ===== */
#introStageViewport{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;z-index:99999;background:#121212;overflow:hidden;user-select:none;-webkit-user-select:none;display:none}
#introStageViewport.on{display:block}
.pixel-swap{position:relative;width:100%;height:100%;overflow:hidden;isolation:isolate}
.pixel-layer{position:absolute;inset:0;width:100%;height:100%}
.pixel-layer[data-visible="false"]{visibility:hidden}
.pixel-grid{position:absolute;inset:0;z-index:30;pointer-events:none}
.pixel{position:absolute;overflow:hidden;contain:paint}
.pixel-content{position:absolute;will-change:transform}

.stage-start{display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding:20px;position:relative;overflow:hidden;background:#121212;color:#f4f4f4}
.focus{position:relative;display:inline-flex;align-items:center;justify-content:center;flex-wrap:nowrap;outline:none;user-select:none;padding:30px 36px;max-width:96vw;z-index:15overflow:visible;position:relative;}
.word{position:relative;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:clamp(20px,4.2vw,38px);font-weight:700;letter-spacing:-.3px;color:#f4f4f4;display:inline-block;white-space:nowrap;margin:0}
.cursor{display:inline-block;font-weight:300;margin-left:2px;color:#f4f4f4;opacity:1;transform:translateY(-2px)}
.word.shiny{background-image:linear-gradient(120deg,#f4f4f4 0%,#f4f4f4 30%,#ffffff 50%,#f4f4f4 70%,#f4f4f4 100%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shine 1s ease forwards}
@keyframes shine{from{background-position:150% center}to{background-position:0% center}}
.pop{display:inline-flex;align-items:center;width:0;opacity:0;pointer-events:none;will-change:width,opacity}
.pop.on{width:auto;opacity:1;transition:width .4s cubic-bezier(.22,1,.36,1),opacity .3s ease}
.pop .pword{margin-left:.45em;display:inline-block;will-change:transform,opacity}
.corner{position:absolute;width:18px;height:18px;border:4.5px solid #f5b14c;filter:drop-shadow(0 0 8px rgba(245,177,76,.45));border-radius:3px;pointer-events:none;z-index:18;opacity:0}
.corner.on{opacity:1}
.corner.tl{top:-10px;left:-10px;border-right:none;border-bottom:none}
.corner.tr{top:-10px;right:-10px;border-left:none;border-bottom:none}
.corner.bl{bottom:-10px;left:-10px;border-right:none;border-top:none}
.corner.br{bottom:-10px;right:-10px;border-left:none;border-top:none}

.stage-mid{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;padding:32px 24px;position:relative;overflow:hidden;text-align:center;gap:14px;background:#f4f4f5;color:#1a1a1a}
.white-copy{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:clamp(24px,5vw,44px);font-weight:700;letter-spacing:-.4px;line-height:1.25;max-width:90vw;color:#1a1a1a}
.intro-ready{margin-top:2px;font-family:ui-monospace,Consolas,monospace;font-size:13px;color:#8a8a8a;opacity:0;transition:opacity .4s ease}
.intro-ready.show{opacity:1}

.skip-btn{position:absolute;top:max(16px,env(safe-area-inset-top));right:max(16px,env(safe-area-inset-right));z-index:100;
display:inline-flex;align-items:center;justify-content:center;padding:6px 14px;border-radius:999px;font-size:11px;font-weight:500;
font-family:ui-monospace,Consolas,monospace;letter-spacing:.8px;cursor:pointer;background:transparent;border:1px solid rgba(244,244,244,.35);color:#f4f4f4;opacity:.45;transition:opacity .2s,transform .15s}
.skip-btn:hover{opacity:.9;transform:scale(1.02)} .skip-btn:active{transform:scale(.96)}
</style></head><body>
<div class="card" id="card">
  <div id="form">
    <div class="badge"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 19.5 6v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6z"/><path d="m8.6 12.1 2.4 2.4 4.4-4.6"/></svg></div>
    <h1>双因素安全验证 (2FA)</h1>
    <p class="sub">输入验证器 App 上的 6 位动态验证码</p>
    <div id="otpGroup">
      <input class="ocell" id="oc0" type="tel" maxlength="1" inputmode="numeric" autocomplete="one-time-code" value="" data-i="0">
      <input class="ocell" id="oc1" type="tel" maxlength="1" inputmode="numeric" value="" data-i="1">
      <input class="ocell" id="oc2" type="tel" maxlength="1" inputmode="numeric" value="" data-i="2">
      <div class="otp-div"></div>
      <input class="ocell" id="oc3" type="tel" maxlength="1" inputmode="numeric" value="" data-i="3">
      <input class="ocell" id="oc4" type="tel" maxlength="1" inputmode="numeric" value="" data-i="4">
      <input class="ocell" id="oc5" type="tel" maxlength="1" inputmode="numeric" value="" data-i="5">
    </div>
    <div class="msg" id="msg"></div>
    <button id="go">验证并进入</button>
    <div class="hint">验证通过后,本设备 30 天内免重复验证;可在面板里随时踢下线。</div>
    <div class="hint" id="iosHint" style="display:none;color:#e2b96a"></div>
  </div>
</div>

<div id="introStageViewport">
  <div class="stage-mid">
    <div class="white-copy">Welcome DeepSeek</div>
    <div class="intro-ready" id="readyLine">正在启动…</div>
  </div>
</div>

<script>
/* ---------- 远程访问路径前缀 ---------- */
/* 本页可能被服务在 /p/<端口>/、/dsh-remote/p/<uid>/(uid 稳定配对)或本机根路径下。
   之前这里写死 /p/17901/,多用户端口每次重启随机分配后,验证成功会被送进死端口 502。
   纯 [0-9] 字符类不用 \d:模板虽然:r-string,但保持与 kb 约定一致。 */
var __BC_P=(function(){
  var p=location.pathname||'/',m;
  m=p.match(/^\/p\/(1[6-9][0-9][0-9][0-9])(?=\/|$)/);if(m)return '/p/'+m[1];
  m=p.match(/^\/dsh-remote\/p\/([a-z0-9]{8,32})(?=\/|$)/);if(m)return '/dsh-remote/p/'+m[1];
  return '';
})();
</script>
<script>
/* ---------- 2FA 六格输入 ---------- */
(function(){
  const cells=[0,1,2,3,4,5].map(i=>document.getElementById('oc'+i)),msg=document.getElementById('msg'),go=document.getElementById('go');
  function getVal(){return cells.map(c=>c.value.replace(/\D/g,'')).join('').slice(0,6);}
  cells.forEach((c,i)=>{
    c.addEventListener('input',function(){
      const v=this.value.replace(/\D/g,'').slice(0,1);this.value=v;
      const full=getVal();
      if(full.length===6)submit(full);
      else if(v&&i<5)cells[i+1].focus();
    });
    c.addEventListener('keydown',function(e){
      if(e.key==='Backspace'&&!this.value&&i>0){cells[i-1].focus();cells[i-1].value='';e.preventDefault()}
      if(e.key==='Enter')submit(getVal());
      if(e.key==='ArrowLeft'&&i>0)cells[i-1].focus();
      if(e.key==='ArrowRight'&&i<5)cells[i+1].focus();
    });
    c.addEventListener('focus',function(){this.select()});
  });
  document.addEventListener('paste',function(e){
    e.preventDefault();
    const t=(e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,'').slice(0,6);
    if(!t)return;
    cells.forEach((c,i)=>{c.value=t[i]||''});
    const next=cells[Math.min(t.length,5)];if(next)next.focus();
    if(t.length===6)submit(t);
  });
  go.addEventListener('click',()=>submit(getVal()));
  function submit(raw){
    const v=(raw||'').replace(/\\D/g,'');
    if(v.length!==6){msg.textContent='请输入完整的 6 位验证码';return}
    msg.textContent='';go.disabled=true;go.textContent='正在校验…';
    verify(v);
  }
  window.__verifyHook=null;
  function verify(code){
    // 开发演示:?demo 直接成功(不走真实闸机)
    if(location.search.indexOf('demo')>=0){setTimeout(()=>onOk(),400);return}
    fetch(__BC_P+'/browserctl-gate/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code})})
      .then(r=>r.json())
      .then(j=>{if(j.ok){onOk();return}msg.textContent=j.error||'验证失败';cells.forEach(c=>{c.value='';c.classList.remove('filled')});go.disabled=false;go.textContent='验证并进入';})
      .catch(()=>{msg.textContent='网络错误,请重试';go.disabled=false;go.textContent='验证并进入';});
  }
  function onOk(){
    // 隐藏表单
    document.getElementById('form').style.display='none';
    // 后台预加载 DeepSeek(隐藏 iframe,预热 DSH web boot 的 JS 缓存)
    const frame=document.createElement('iframe');
    frame.setAttribute('aria-hidden','true');
    frame.style.cssText='position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
    frame.src=__BC_P+'/';
    document.body.appendChild(frame);
    window.__preloadFrame=frame;
    // 开场动画
    window.runIntro();
  }
})();

/* ---------- 进入动画：只保留 Welcome DeepSeek ---------- */
(function(){
  var $=function(id){return document.getElementById(id)},started=false;
  window.runIntro=function(){
    if(started)return;started=true;
    var v=$('introStageViewport');
    v.style.transition='opacity .45s ease';
    v.style.opacity='0';
    v.classList.add('on');
    requestAnimationFrame(function(){requestAnimationFrame(function(){v.style.opacity='1'})});
    var rl=$('readyLine');
    rl.textContent='正在启动…';
    rl.classList.add('show');
    var t0=Date.now();
    (function poll(){
      var f=window.__preloadFrame,dc=null,ready=false;
      try{dc=f&&f.contentDocument}catch(e){dc=null}
      try{
        ready=!!(dc&&dc.body&&((dc.body.innerText||'').trim()||dc.querySelector('#root>*')));
      }catch(e){ready=false}
      if(ready||Date.now()-t0>=20000){
        rl.textContent=ready?'正在进入…':'正在进入 DeepSeek…';
        setTimeout(function(){location.href=__BC_P+'/'},ready?420:700);
        return;
      }
      setTimeout(poll,300);
    })();
  };
})();

/* ---------- iOS 主屏容器提示:主屏 App 与 Safari 的 Cookie 存储相互独立 ---------- */
(function(){
  var isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent);
  if(!isIOS)return;
  var h=document.getElementById('iosHint');
  if(!h)return;
  h.style.display='block';
  h.textContent=(navigator.standalone===true)
    ? '检测到从主屏幕图标打开:此窗口的 Cookie 与 Safari 相互独立。请在此完成一次验证,之后 30 天内点主屏图标都免验证。'
    : '正在用 Safari 打开:主屏幕 App 与 Safari 的验证相互独立。请先验证进入面板,在面板页上「添加到主屏幕」,再从主屏图标打开并重新验证一次,之后 30 天免验。';
})();

</script>
</body></html>"""


# ---- 闸机 HTTP Handler ----

class GateHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    # keep-alive 空闲回收:浏览器/nginx 断开前不再占用线程死等(线程随连接存活)。
    # nginx 默认 60s keepalive_timeout,75s 比它长,正常回收都由客户端先发起。
    timeout = 75

    def log_message(self, fmt, *args):  # 静默,写文件由外层负责
        pass

    # ---- 工具 ----

    def _client_ip(self):
        """读取真实客户端 IP(H-01 修复:不再信任 X-Forwarded-For 首段)。

        信任边界:
        - 只有 TCP 对端是本机(loopback,即 nginx/frpc 在本机转发)时才读转发头;
          对端不是 loopback 时一律用对端 IP,防止有人直连 17901/3080 伪造头。
        - X-Real-IP 由 nginx 用 $remote_addr 覆盖写入,客户端无法伪造 → 优先取它。
        - X-Forwarded-For 取"最后一跳"(nginx 的 $proxy_add_x_forwarded_for 把真实
          $remote_addr 追加在末尾);前面的值都是客户端/中间层可伪造的,一律丢弃。
        - 一致性校验(2026-11-08 审计):X-Real-IP 与 XFF 最后一跳同时存在时两者
          必须相等(nginx 正常配置下都是真实 $remote_addr);不一致说明链路上有
          中间层改写或直连伪造,视为不可信,回退 socket 对端地址。配合防火墙把
          16000-16999 收口成 loopback-only 后,回环+转发头的来源只剩边缘 nginx。
        """
        peer = self.client_address[0] if self.client_address else ""
        if peer not in ("127.0.0.1", "::1", "::ffff:127.0.0.1"):
            return peer or "local"
        real = self.headers.get("X-Real-IP", "").strip()
        fwd = self.headers.get("X-Forwarded-For", "").strip()
        fwd_last = ""
        if fwd:
            ips = [x.strip() for x in fwd.split(",") if x.strip()]
            if ips:
                fwd_last = ips[-1]  # nginx 追加的最后一跳才是真实客户端
        if real:
            real = real.split(",")[0].strip()
            if not fwd_last or fwd_last == real:
                return real or peer
            # 头之间自相矛盾:不可信,退回 socket 对端(回环),交给单 IP 限速/
            # 黑名单按 127.0.0.1 处理,并叠加全局防爆破熔断兜底
            return peer or "local"
        if fwd_last:
            return fwd_last
        return peer or "local"

    def send_response(self, code, message=None):
        """去掉默认 Server 指纹头(只发状态行 + Date)。"""
        self._resp_status = int(code)  # 逐请求日志记录状态码
        self.log_request(code)
        self.send_response_only(code, message)
        self.send_header("Date", self.date_time_string())

    def _send(self, code, body, content_type="text/html; charset=utf-8", headers=None):
        data = body.encode() if isinstance(body, str) else body
        self._responded = True  # 供 _handle 兜底判断"是否已经回过响应"
        self._resp_bytes = len(data)  # 逐请求日志记录字节数
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        # PWA 静态资源等需要自定义缓存时,headers 显式传 Cache-Control 覆盖默认 no-store
        if not any((k or "").lower() == "cache-control" for k, _ in (headers or [])):
            self.send_header("Cache-Control", "no-store")
        for k, v in (headers or []):
            self.send_header(k, v)
        self.end_headers()
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _send_json(self, code, obj, headers=None):
        self._send(code, json.dumps(obj, ensure_ascii=False),
                   "application/json; charset=utf-8", headers)

    def _is_app_ua(self):
        """请求是否来自 DSH Remote 手机 App（WebView UA 里带 DshRemote/）。
        App 需要靠 HTTP 状态码判断"未授权"，否则只能看到纯黑页无从处理；
        普通浏览器仍按原策略返回 200 纯黑页，裸 URL 不暴露任何信息。"""
        ua = self.headers.get("User-Agent") or ""
        return "DshRemote/" in ua

    def _deny_unauthorized(self):
        """未通过验证时的统一拒绝响应。"""
        app_ua = self._is_app_ua()
        headers = None if app_ua else [("Set-Cookie",
                             "%s=deleted; Max-Age=0; Path=/" % GATE_COOKIE)]
        self._send(403 if app_ua else 200, DENIED_HTML, headers=headers)

    def _gate_cookie_values(self):
        """Cookie 头里全部 bc-gate 值(按出现顺序;同名多值是 WebView 竞态残留)。"""
        raw = self.headers.get("Cookie", "")
        vals = []
        for seg in raw.split(";"):
            k, _, v = seg.partition("=")
            if k.strip() == GATE_COOKIE:
                vals.append(v.strip())
        return vals

    def _gate_cookie_raw(self):
        """取 bc-gate 用于鉴权。同名多值时按「新值优先」逐个校验,取第一个通过
        签名+有效期的;全都不通过时返回最后一个,让上层校验给出正确的拒绝。
        背景(2026-11-07 手机端「未授权」根因):App WebView 里旧 cookie 未必被
        新配对覆盖,同一请求会带两个 bc-gate(旧值在前新值在后),旧值若属于
        已踢设备会把新值一起拖死。Chromium 同路径 cookie 按创建时间升序发送,
        最靠后的值最新,故从后往前找。"""
        vals = self._gate_cookie_values()
        if not vals:
            return None
        st = gate_state()
        secret = st.get("link_secret")
        if len(vals) == 1 or not secret:
            return vals[-1]
        for v in reversed(vals):
            try:
                if gate_cookie_dev_only(v, secret):
                    return v
            except Exception:
                continue
        return vals[-1]

    def _gate_cookie_dev(self):
        """仅取 Cookie 中的设备 id(不要求会话在册;用于 2FA 关闭时识别已踢设备)。
        踢人语义从严:只看最新的那个值(请求里最后一个),不做旧值回退——
        否则用户踢掉当前会话后,App 里残留的旧 cookie 会让踢下线形同虚设。"""
        st = gate_state()
        secret = st.get("link_secret")
        if not secret:
            return None
        vals = self._gate_cookie_values()
        if not vals:
            return None
        return gate_cookie_dev_only(vals[-1], secret)

    def _has_dsh_cookie(self):
        """请求是否带"已配对"的 DSH 授权 Cookie(仅由配对 claim / 引导 bootstrap 发放)。
        2FA 关闭时用它充当进入凭证:裸 URL 无此 Cookie → 不展示任何内容。"""
        try:
            st = gate_state()
            cn, cv = st.get("cookie_name"), st.get("cookie_value")
            if not cn or not cv:
                return False
            want = "%s=%s" % (cn, cv)
            for seg in self.headers.get("Cookie", "").split(";"):
                if seg.strip() == want:
                    return True
        except Exception:
            pass
        return False

    def _gate_ensure_device(self):
        """2FA 关闭时的免验证放行:首次访问自动登记一个设备会话(供在线列表/踢下线)。
        已被踢过的设备返回 (None, None) 表示拒绝;否则返回 (dev, set_cookie 或 None)。
        设备 dev 稳定复用:退出后重新扫码仍是同一台设备,不重复计数。"""
        st = gate_state()
        secret = st.get("link_secret")
        if not secret:
            return _secrets.token_hex(8), None
        raw = self._gate_cookie_raw()
        dev = gate_cookie_dev_only(raw, secret)
        if dev and dev in _gate_kicked_set():
            return None, None  # 已被踢下线,拒绝放行
        ip = self._client_ip()
        ua = self.headers.get("User-Agent", "")[:120]
        now = time.time()
        name = _friendly_device_name(ua)
        # 来源标记:App(WebView UA 带 DshRemote/) vs 网页(浏览器登录,含官网扫码)。
        # 面板用它区分「App 配对」和「网页登录」,渲染不同的来源徽标。
        kind = "app" if self._is_app_ua() else "web"
        with _gate_lock:
            if dev and dev in _sessions:
                # 有效会话在册,复用(更新 IP/timestamp);旧会话缺 kind 时补上
                _sessions[dev]["ts"] = now
                _sessions[dev]["ip"] = ip
                if not _sessions[dev].get("kind"):
                    _sessions[dev]["kind"] = kind
                return dev, None
            # 锁内再查一次已踢名单:请求可能在锁外通过检查后,与「解除配对」并发——
            # 踢出持锁期间已把设备写进已踢名单,这里必须拦下,否则踢完一两秒又跳回来
            if dev and dev in _gate_kicked_set():
                return None, None  # 已被踢下线,拒绝放行
            if dev is None:
                dev = _secrets.token_hex(8)
            # 复用 dev:设备重新扫码后仍是同一台设备(不在册时重新登记)
            _sessions[dev] = {"ip": ip, "ua": ua,
                              "name": name, "kind": kind,
                              "since": now, "ts": now}
        _device_ensure(dev, _sessions[dev])
        _dump_sessions()
        cookie = gate_mint_cookie(secret, dev, ip, ua)
        header = "%s=%s; Max-Age=%d; Path=/; HttpOnly; SameSite=Lax; Secure" % (
            GATE_COOKIE, cookie, GATE_MAX_AGE)
        return dev, header

    def _read_json_body(self, max_bytes=MAX_JSON_BODY_BYTES):
        """读 JSON 请求体;超限发 413、解析失败发 400,均返回 None(调用方直接 return)。
        H-02:此前四个 POST 端点都无上限地 rfile.read(Content-Length)。"""
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except (TypeError, ValueError):
            n = 0
        if n > max_bytes:
            self.close_connection = True
            self._send_json(413, {"ok": False, "error": "请求体过大"})
            return None
        try:
            return json.loads(self.rfile.read(max(n, 0)) or b"{}")
        except Exception:
            self._send_json(400, {"ok": False, "error": "请求格式错误"})
            return None

    def _gate_verify_device(self):
        """验证 nginx 传递的 X-Device-Id 与 bc-gate cookie 中的 dev 一致。
        这是三端验证的最后一层防线:即使请求绕过了 nginx 直接打到闸机端口,
        X-Device-Id 不存在时也放行(本地开发/直连场景)。"""
        xdev = self.headers.get("X-Device-Id")
        if xdev is None:
            return True  # 无此 header = 非 nginx 代理路径(本地直连),放行
        cookie_dev = self._gate_cookie_dev()
        if cookie_dev is None or cookie_dev != xdev:
            print("[gate] 设备 ID 不匹配:X-Device-Id=%s cookie_dev=%s" % (xdev, cookie_dev), flush=True)
            return False
        return True

    def _gate_ok(self):
        st = gate_state()
        # 先消费未处理的踢出请求,确保定向踢实时生效(不用等 2 秒巡检;2FA 关闭时同样生效)
        _process_kicks()
        if not st.get("totp_enabled"):
            # 2FA 关闭:免动态码放行,但仍执行"已踢设备"与黑名单拦截。
            # 且必须"已配对"——带 bc-gate cookie 或带配对/引导发放的 DSH 授权 cookie,
            # 裸 URL(无任何凭证)一律不放行,避免 2FA 关闭时把整个面板公开给陌生人。
            ip = self._client_ip()
            dev = self._gate_cookie_dev()
            if dev and dev in _gate_kicked_set():
                return False
            ban = _blacklist_check(ip, dev)
            if ban:
                _append_event("ban", "黑名单阻止 IP=%s dev=%s reason=%s" % (ip, dev, ban))
                return False
            if not dev and not self._has_dsh_cookie():
                return False
            return True
        global _kick_seq_seen
        seq = st.get("gate_kick_seq", 0)
        with _gate_lock:
            if seq != _kick_seq_seen:
                _kick_seq_seen = seq
                _sessions.clear()
        dev = gate_check_cookie(self._gate_cookie_raw(), st["link_secret"])
        if dev is None:
            return False
        # 已踢名单兜底:会话在册才有效(gate_check_cookie),但闸机重启会从
        # sessions.json 恢复会话;被解除配对的设备即使恢复了也直接拒绝,
        # 与 2FA 关闭路径的检查对齐,踢下线才真正"持久"。
        if dev and dev in _gate_kicked_set():
            return False
        # 黑名单检查:IP 或设备在黑名单则拒绝
        ip = self._client_ip()
        ban = _blacklist_check(ip, dev)
        if ban:
            _append_event("ban", "黑名单阻止 IP=%s dev=%s reason=%s" % (ip, dev, ban))
            return False
        return True

    # ---- WebSocket 原始中继 ----

    def _relay_ws(self):
        global _ws_active
        # WebSocket 升级后这条连接承载的是 WS 帧,中继结束必须物理断开,
        # 不能回到 keep-alive 请求循环(否则下一轮会把 WS 帧当 HTTP 请求行解析)。
        self.close_connection = True
        self._resp_status = 0
        self._resp_bytes = 0
        _t0 = time.time()
        with _gate_lock:
            if _ws_active >= MAX_WS_CONCURRENT:
                # 可行动文案:占用是临时的(断线连接的泵线程最长 75s 超时回收),
                # 稍后重试即可;不是配置错误,也无需改任何设置。
                self._send(503, "WS 连接暂时占满,几十秒内自动释放,请稍后重试", "text/plain")
                return
            _ws_active += 1
        try:
            self._relay_ws_inner()
        finally:
            with _gate_lock:
                _ws_active -= 1
            try:
                _reqlog_record(self, _t0, is_ws=True)
            except Exception:
                pass

    def _relay_ws_inner(self):
        port = resolve_dsh()
        if not port:
            self._send(502, "DSH 未启动", "text/plain")
            return
        head = self.raw_requestline
        _seg = []
        try:
            _st = gate_state()
            _cn, _cv = _st.get("cookie_name"), _st.get("cookie_value")
        except Exception:
            _cn = _cv = None
        # 2026-11-07:与 HTTP 反代对齐——① 边缘 Lua 会留两份大小写不同的 Cookie 头,
        # 必须合并成一份;② 请求自带的同名 DSH cookie 必须整体替换而非"有就不注"
        # (App 恢复的旧 dsh cookie 直达 DSH → WS 握手 401 → 面板永远「重新连接中」)。
        for k, v in self.headers.items():
            if k.lower() == "cookie":
                for s in (v or "").split(";"):
                    if s.strip():
                        _seg.append(s.strip())
                continue
            if k.lower() == "host":
                # Host 无条件改写 authority(与 HTTP 反代同一修复对齐,2026-11-08):
                # WS 握手同样校验 dsh-auth Cookie 的 authority,Host 带端口
                # (本机直连 127.0.0.1:3080)时 DSH 401,面板永远「重新连接中」。
                head += ("Host: %s\r\n" % AUTHORITY).encode("latin-1")
                continue
            if k.lower() == "origin":
                head += ("Origin: http://%s\r\n" % AUTHORITY).encode("latin-1")
                continue
            head += ("%s: %s\r\n" % (k, v)).encode("latin-1", "replace")
        if _cn and _cv:
            _seg = [s for s in _seg if not s.startswith(_cn + "=")]
            _seg.append("%s=%s" % (_cn, _cv))
        if _seg:
            head += ("Cookie: %s\r\n" % "; ".join(_seg)).encode("latin-1", "replace")
        head += b"\r\n"
        remote = socket.create_connection(("127.0.0.1", port), timeout=10)
        remote.sendall(head)
        _ws_write_lock = threading.Lock()

        def _close_sockets():
            # 任一泵结束后把两端 socket 都物理关闭(不只 SHUT_WR):对端泵阻塞中的
            # recv/sendall 会立刻以 OSError 退出。半开连接(手机网络突断,无 FIN)
            # 不再把 WS 槽位占满到 75s 超时 —— PONG 代答之后 DSH 侧不再主动杀连接,
            # 这里是唯一的确定性回收路径(2026-11-07 审计 G1)。
            for sock in (remote, self.connection):
                try:
                    sock.shutdown(socket.SHUT_RDWR)
                except OSError:
                    pass
                try:
                    sock.close()
                except OSError:
                    pass

        def _send_remote(data):
            # 两个泵线程都可能写 remote,必须串行,否则大块转发和代答帧可能交错
            with _ws_write_lock:
                remote.sendall(data)

        def _ws_pong_for_dsh(payload):
            # 闸机在 DSH 面板前是"客户端":RFC 6455 要求客户端帧必须掩码
            key = os.urandom(4)
            n = min(len(payload), 65535)  # 126 长度上限;>65535 会 OverflowError,截断防御
            payload = payload[:n]
            if n <= 125:
                headb = bytes([0x8A, 0x80 | n])
            else:
                headb = bytes([0x8A, 0x80 | 126]) + n.to_bytes(2, "big")
            masked = bytes(payload[i] ^ key[i % 4] for i in range(n))
            return headb + key + masked

        def _pump_upstream_to_client(src, dst):
            # DSH→客户端方向。DSH 的 mux 心跳很苛刻:2s 一次 ping,漏 2 次直接 terminate
            # (MAX_MISSED_HEARTBEATS=2)。大流量同步(实测首连 ~5MB)把 KCP 上行灌满时,
            # 真实客户端的 pong 会被排队延迟数秒 → 服务端误杀 → 面板「重新连接中」死循环。
            # 这里逐帧解析,看到 PING 就立刻代答一个 PONG 给 DSH(回环微秒级),让连接扛过
            # 拥塞;其余字节原样转发。
            buf = bytearray()
            try:
                # 2026-11-07 修复:DSH 返回的第一段是 HTTP/1.1 101 响应头,不是 WS 帧!
                # 必须先原样透传完头,确认状态码是 101 之后才开始逐帧解析;
                # 否则把握手头当帧数据切,隧道路径直接 502(本地直连乱流侥幸像活着)。
                buf = bytearray()  # 重置:先攒头
                hdr_done = False
                while True:
                    data = src.recv(65536)
                    if not data:
                        break
                    if not hdr_done:
                        buf.extend(data)
                        i = buf.find(b"\r\n\r\n")
                        if i < 0:
                            continue
                        head = bytes(buf[:i + 4])
                        del buf[:i + 4]
                        dst.sendall(head)
                        hdr_done = head.split(b"\r\n", 1)[0].endswith(b"101 Switching Protocols")
                        data = bytes(buf)
                        del buf[:]
                        if not hdr_done:
                            # 非 101(403 拒绝页/502 等):剩余字节纯透传
                            dst.sendall(data)
                            while True:
                                d2 = src.recv(65536)
                                if not d2:
                                    break
                                dst.sendall(d2)
                            break
                    buf.extend(data)
                    while len(buf) >= 2:
                        opcode = buf[0] & 0x0F
                        fin = buf[0] & 0x80
                        ln = buf[1] & 0x7F
                        off = 2
                        if ln == 126:
                            if len(buf) < 4:
                                break
                            ln = int.from_bytes(buf[2:4], "big")
                            off = 4
                        elif ln == 127:
                            if len(buf) < 10:
                                break
                            ln = int.from_bytes(buf[2:10], "big")
                            off = 10
                        if len(buf) < off + ln:
                            break
                        frame = bytes(buf[:off + ln])
                        del buf[:off + ln]
                        if opcode == 0x9 and fin:  # PING → 立即代答 PONG
                            _send_remote(_ws_pong_for_dsh(frame[off:off + ln]))
                        dst.sendall(frame)
            except OSError:
                pass
            finally:
                try:
                    dst.shutdown(socket.SHUT_WR)
                except OSError:
                    pass
                _close_sockets()

        def pump(src, dst):
            try:
                while True:
                    data = src.recv(65536)
                    if not data:
                        break
                    _send_remote(data)
            except OSError:
                pass
            finally:
                try:
                    remote.shutdown(socket.SHUT_WR)
                except OSError:
                    pass
                _close_sockets()

        threads = [threading.Thread(target=_pump_upstream_to_client, args=(remote, self.connection), daemon=True),
                   threading.Thread(target=pump, args=(self.connection, None), daemon=True)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

    # ---- HTTP 反代 ----

    HOP_HEADERS = {"connection", "transfer-encoding", "content-length", "date", "server",
                   "keep-alive", "x-powered-by", "x-aspnet-version", "x-aspnetmvc-version"}

    @staticmethod
    def _gzip_compress(data):
        co = zlib.compressobj(GZIP_LEVEL, zlib.DEFLATED, 16 + zlib.MAX_WBITS)
        return co.compress(data) + co.flush()

    def _maybe_gzip(self, data, resp_headers):
        """非流式响应压缩:客户端接受 gzip、类型可压、上游未压、≥1KB、且压完更小才发。
        闸机是链路里最靠近 DSH 的一环,在这里压一次,frpc 隧道(家里上行)只跑压缩字节。"""
        headers = dict((k.lower(), v) for k, v in resp_headers)
        if "gzip" not in self.headers.get("Accept-Encoding", "").lower():
            return data
        if headers.get("content-encoding"):
            return data  # 上游已压缩
        ctype = headers.get("content-type", "").lower()
        if not any(ctype.startswith(p) or p in ctype for p in COMPRESSIBLE_TYPES):
            return data
        if len(data) < GZIP_MIN_BYTES:
            return data
        gz = self._gzip_compress(data)
        if len(gz) >= len(data):
            return data  # 压了没变小,白费 CPU
        resp_headers.append(("Content-Encoding", "gzip"))
        resp_headers.append(("Vary", "Accept-Encoding"))
        return gz

    # ---- 静态资源缓存(内容寻址的 URL 才允许长缓存) ----
    # 远程面板"每次打开都要转圈很久"的主因:DSH 对 /plugins/??... 返回 no-store、
    # 对 /assets/* 干脆不给任何缓存头,浏览器每次刷新都要重新穿过 frpc 隧道拉 13 MB+。
    # 这里按 URL 判定"文件名里带内容哈希"的资源,改写成可缓存并附 ETag:
    # 首次之后浏览器直接命中本地缓存,强制刷新也只是一次 304(零字节正文)。
    CACHE_IMMUTABLE_MAX_AGE = 31536000   # 1 年:/assets/<name>-<hash>.js|css(文件名即内容指纹)
    CACHE_PLUGIN_MAX_AGE = 7 * 86400     # 7 天:/plugins/??a,b,c&rev=<hash>(rev 变则 URL 变)
    MAX_CACHEABLE_BYTES = 8 * 1024 * 1024  # 可缓存静态资源读全量的上限(超了仍走流式)
    CACHE_HASHED_NAME = re.compile(
        r"-[A-Za-z0-9_-]{6,}\.(?:js|mjs|css|map|json|woff2?|ttf|otf|svg|png|webp|jpe?g|gif|avif)$")

    # ---- 静态资源压缩缓存 ----
    # 冷加载 10MB 每次都要:闸机从 DSH 拉全量 + gzip level 6 现场重压。而这些 URL 是
    # 内容寻址的(/assets/<name>-<hash> 与 /plugins/?rev=<hash>):内容变 = URL 变,
    # 按 URL 缓存压缩字节绝对安全(旧条目只会随 LRU 淘汰,不会读到过期内容)。
    # 只存 gzip 版:客户端不带 Accept-Encoding: gzip 时按 miss 走上游(正确性优先)。
    # 面板根 HTML 不进这个缓存(内容带 UA/端口注入,交给 ETag/304 revalidate)。
    ASSET_CACHE_MAX_TOTAL = 64 * 1024 * 1024
    _asset_cache = OrderedDict()   # self.path -> {"status","headers","data","etag"}
    _asset_lock = threading.Lock()

    @classmethod
    def _asset_cache_get(cls, key):
        with cls._asset_lock:
            ent = cls._asset_cache.get(key)
            if ent is not None:
                cls._asset_cache.move_to_end(key)
            return ent

    def _asset_cache_put(self, key, headers, data, etag):
        if not data or len(data) > self.MAX_CACHEABLE_BYTES:
            return
        with GateHandler._asset_lock:
            cache = GateHandler._asset_cache
            cache[key] = {"headers": list(headers), "data": data, "etag": etag}
            cache.move_to_end(key)
            total = sum(len(e["data"]) for e in cache.values())
            while total > self.ASSET_CACHE_MAX_TOTAL and cache:
                _, old = cache.popitem(last=False)
                total -= len(old["data"])

    def _cache_policy(self, path):
        """返回 Cache-Control 值;不是内容寻址资源(HTML/API/SSE)返回 None。
        只认 GET:HEAD 走 _proxy 时正文是空的,加缓存头会把空资源写进浏览器缓存。"""
        if self.command != "GET":
            return None
        p = path.split("?", 1)[0]
        # 面板根 HTML:内容实测字节级稳定(同 UA 两次 sha1 一致),可以 ETag/304。
        # 用 no-cache 强制每次 revalidate:命中 304 省下 147KB 隧道传输,不命中也就一次 200。
        # Vary: User-Agent 由调用方补(App 注入的 HTML 与浏览器不同,不能共缓存条目)。
        if p == "/" or p == "":
            return "no-cache"
        if p.startswith("/assets/") and self.CACHE_HASHED_NAME.search(p):
            return "public, max-age=%d, immutable" % self.CACHE_IMMUTABLE_MAX_AGE
        # 插件组合包:plugins/??a,b,c&rev=<hash>;rev 是内容指纹,变了 URL 就变
        if p == "/plugins/" and "rev=" in path:
            return "public, max-age=%d" % self.CACHE_PLUGIN_MAX_AGE
        return None

    def _proxy(self, extra_set_cookie=None):
        """反代 DSH：计时并记录逐请求日志（New API 风格使用详情）。"""
        self._resp_status = 0
        self._resp_bytes = 0
        _t0 = time.time()
        try:
            self._proxy_inner(extra_set_cookie)
        finally:
            try:
                _reqlog_record(self, _t0)
            except Exception:
                pass

    def _proxy_inner(self, extra_set_cookie=None):
        port = resolve_dsh()
        if not port:
            self._send(502, "<h1>502</h1><p>DeepSeek 助手未在本机运行。</p>")
            return
        body = None
        length = self.headers.get("Content-Length")
        if length:
            # H-02:请求体上限。超过上限不读、直接 413 并断连,
            # 防止攻击者用超大 Content-Length 把闸机内存灌满。
            # (1GB→256MB:只有面板大文件上传会走这里,而 APK 上传走专用端点
            # 独立限 200MB(_gate_app_apk_upload);256MB 已覆盖一切合法反代请求,
            # 把单请求内存峰值压回可控范围。)
            try:
                n = int(length)
            except ValueError:
                n = 0
            if n < 0:
                # 非法负值:rfile.read(n) 对负数是"读到 EOF",线程会一直挂到 75s 超时
                self.close_connection = True
                self._send(400, "<h1>400 Bad Request</h1>")
                return
            if n > MAX_PROXY_BODY_BYTES:
                self.close_connection = True
                self._send(413, "<h1>413 Payload Too Large</h1>")
                return
            body = self.rfile.read(n)
        # 静态资源压缩缓存命中:内容寻址 URL + 客户端收 gzip + 本次不带 Set-Cookie。
        # 命中即回,不再碰 DSH 上游(省一次上游往返 + gzip 重压)。
        if self.command == "GET" and not extra_set_cookie \
                and "gzip" in (self.headers.get("Accept-Encoding") or "").lower():
            hit = GateHandler._asset_cache_get(self.path)
            if hit:
                etag = hit["etag"]
                inm = (self.headers.get("If-None-Match") or "").replace(" ", "")
                if inm and (inm == "*" or etag in inm.split(",")):
                    self.send_response(304)
                    self.send_header("Cache-Control",
                                     dict((k.lower(), v) for k, v in hit["headers"]).get("cache-control", "public"))
                    self.send_header("ETag", etag)
                    self.send_header("Vary", "Accept-Encoding")
                    self.end_headers()
                    return
                self.send_response(200)
                self.send_header("Content-Length", str(len(hit["data"])))
                for k, v in hit["headers"]:
                    self.send_header(k, v)
                self.end_headers()
                self._resp_bytes = len(hit["data"])  # 逐请求日志字节数
                try:
                    self.wfile.write(hit["data"])
                except (BrokenPipeError, ConnectionResetError, OSError):
                    pass
                return
        conn = _upstream_acquire(port)
        fwd_headers = {}
        for k, v in self.headers.items():
            if k.lower() in self.HOP_HEADERS or k.lower() == "host":
                continue
            fwd_headers[k] = v
        # Host 无条件改写为 authority(kb/08 H-06 对齐 nginx 侧):DSH 的 dsh-auth
        # Cookie 绑定 authority=127.0.0.1,Host 带端口(如本机直开 127.0.0.1:3080)
        # 时 authority 对不上 → 恒 401「reopen the URL」(2026-11-08 本机实测)。
        # nginx 路径本来就改写成不带端口,此处收紧只影响直连本机闸机的访问。
        fwd_headers["Host"] = AUTHORITY
        fwd_headers["Origin"] = "http://%s" % AUTHORITY
        fwd_headers["Referer"] = "http://%s/" % AUTHORITY
        # 上游 keep-alive:池按端口分桶,DSH 换端口时 resolve_dsh 整池作废
        fwd_headers["Connection"] = "keep-alive"
        # 2026-11-07:边缘 Lua 改写 Cookie 时会同时保留原 Cookie 头和重写后的
        # Cookie 头(大小写不同,如 Cookie/cookie),两条都会原样转发到 DSH,
        # DSH 取其中一条 → 过期值复活 → 401。这里先把所有 Cookie 头合并成一份。
        try:
            _ck_merge = "; ".join(seg for k, v in self.headers.items()
                                  if k.lower() == "cookie"
                                  for seg in (v or "").split(";") if seg.strip())
            for _ck_key in [k for k in fwd_headers.keys() if k.lower() == "cookie"]:
                del fwd_headers[_ck_key]
            if _ck_merge:
                fwd_headers["Cookie"] = _ck_merge
        except Exception:
            pass
        # 闸机已通过 2FA:自动注入 DSH 授权 Cookie。
        # 这样用户只需输入动态码,无需先走 dsh-auth.html 写入 Cookie。
        # 2026-11-07:请求自带的同名 DSH cookie 必须整体替换而非跳过——
        # App 端 restoreCookies 会把几天前的旧 dsh cookie 一并恢复,旧值对着
        # 已重启的 DSH web 恒 401,曾经"缺了才补"的策略让 App 端永远打不开面板。
        try:
            _st = gate_state()
            _cn, _cv = _st.get("cookie_name"), _st.get("cookie_value")
            if _cn and _cv:
                _ck = fwd_headers.get("Cookie") or ""
                if _ck:
                    _keep = [p for p in _ck.split(";")
                             if p.strip() and not p.strip().startswith(_cn + "=")]
                    _ck = "; ".join(_keep)
                fwd_headers["Cookie"] = (_ck + "; " if _ck else "") + "%s=%s" % (_cn, _cv)
        except Exception:
            pass
        if body is not None:
            fwd_headers["Content-Length"] = str(len(body))
        try:
            conn.request(self.command, self.path, body=body, headers=fwd_headers)
            resp = conn.getresponse()
        except (OSError, http.client.HTTPException):
            # 池里拿到的连接可能刚好被上游关掉(FIN 在 select 探测后到达):
            # 服务器先关再收 → 请求未被处理,重试安全;只对无副作用方法自动重试,
            # 带副作用的方法(POST 等)直接 502,绝不重复执行。
            try:
                conn.close()
            except Exception:
                pass
            if self.command not in ("GET", "HEAD"):
                self._send(502, "<h1>502</h1><p>上游连接已失效,请重试。</p>")
                return
            conn = http.client.HTTPConnection("127.0.0.1", port, timeout=600)
            try:
                conn.request(self.command, self.path, body=body, headers=fwd_headers)
                resp = conn.getresponse()
            except (OSError, http.client.HTTPException) as e2:
                _upstream_release(port, conn, reusable=False)
                self._send(502, "<h1>502</h1><p>上游错误: %s</p>" % e2)
                return
        streaming = False
        resp_headers = []
        upstream_len = 0
        for k, v in resp.getheaders():
            lk = k.lower()
            if lk in self.HOP_HEADERS:
                if lk == "transfer-encoding" and "chunked" in v.lower():
                    streaming = True
                if lk == "content-length":
                    try:
                        upstream_len = int(v)
                    except ValueError:
                        upstream_len = 0
                continue
            if lk == "content-type" and "event-stream" in v.lower():
                streaming = True
            resp_headers.append((k, v))
        if upstream_len > MAX_RESPONSE_BYTES:
            streaming = True  # 超大响应改流式透传,防一次性读入内存
        # DSH 对 /assets/*.js 是用 chunked 返回的,不这么处理就会被判成流式,
        # 于是既不走 _maybe_gzip(隧道里白跑 1.2 MB 未压缩字节),也算不出 ETag。
        # 这些是构建产物(≤1 MB 级),读全量安全;超过 MAX_CACHEABLE_BYTES 仍流式。
        if streaming and resp.status == 200 and self._cache_policy(self.path) \
                and (not upstream_len or upstream_len <= self.MAX_CACHEABLE_BYTES):
            streaming = False
        # PWA:面板根 HTML 要注入 manifest/apple-touch 标签,强制非流式读全量
        # (HTML 是 ≤1 MB 级;超上限仍走流式,那次就不注入,功能不受影响)。
        panel_root_html = (resp.status == 200 and self._is_panel_root()
                           and "text/html" in dict((k.lower(), v) for k, v in resp_headers).get("content-type", ""))
        if streaming and panel_root_html \
                and (not upstream_len or upstream_len <= self.MAX_CACHEABLE_BYTES):
            streaming = False
        # 移动端工具条(返回/视口调整)也注入到非根 HTML 页面,不只是面板首页
        is_html_doc = (resp.status == 200
                       and "text/html" in dict((k.lower(), v) for k, v in resp_headers).get("content-type", "")
                       and not panel_root_html)
        if streaming and is_html_doc \
                and (not upstream_len or upstream_len <= self.MAX_CACHEABLE_BYTES):
            streaming = False
        # SSE 并发上限:必须在发头之前判定,超限直接 503
        rh = dict((k.lower(), v) for k, v in resp_headers)
        sse_mode = ("event-stream" in rh.get("content-type", "") and not rh.get("content-encoding"))
        global _sse_active
        if sse_mode:
            with _gate_lock:
                if _sse_active >= MAX_SSE_CONCURRENT:
                    _upstream_release(port, conn, reusable=False)  # 响应未消费,不可回池
                    self._send(503, "SSE 连接暂时占满,几十秒内自动释放,请稍后重试", "text/plain")
                    return
                _sse_active += 1
        # 非流式:先读全量,再按准确 Content-Length 发头(顺序不能反,否则帧错位)
        data = None
        cache_ctl = None
        etag = None
        if not streaming:
            # 有界读(2026-11-08 审计 P2):上游 Content-Length 未知(chunked)时,
            # 上面缓存面板/HTML 分支的 (not upstream_len or ...) 恒真 → 会无条件
            # resp.read() 把整个响应读进内存。改为分块累计,超过 MAX_RESPONSE_BYTES
            # (64MB,与非流式/流式分界同一条线,注释见常量定义处)立即中止:
            # 上游连接关闭不回池、客户端回 502(与既有错误页同风格)、记一条事件。
            # 已知长度超限的响应在前面的 upstream_len > MAX_RESPONSE_BYTES 分支
            # 已改判流式透传,不会走到这里。
            parts = []
            total = 0
            over_limit = False
            while True:
                chunk = resp.read(262144)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_RESPONSE_BYTES:
                    over_limit = True
                    break
                parts.append(chunk)
            if over_limit:
                _upstream_release(port, conn, reusable=False)
                # 日志只记路径,不带 ?k=/at= 等 query(与本文件异常兜底同一脱敏口径)
                _p = urllib.parse.urlsplit(self.path).path
                _append_event("error", "上游响应超过 %dMB 上限,中止转发 %s %s"
                              % (MAX_RESPONSE_BYTES // (1024 * 1024), self.command, _p))
                self._send(502, "<h1>502</h1><p>上游响应超过 %dMB 上限,已中止转发。</p>"
                           % (MAX_RESPONSE_BYTES // (1024 * 1024),))
                return
            data = b"".join(parts)
            if panel_root_html:
                data = self._inject_pwa_tags(data)  # 在压缩前注入,ETag 才覆盖注入后的字节
            elif is_html_doc:
                data = self._inject_pwa_tags(data, toolbar_only=True)  # 非根页面只注工具条
            if resp.status == 200:
                cache_ctl = self._cache_policy(self.path)
                # 本次响应要种设备 Cookie(2FA-off 首次登记):内容与常规请求不同,不缓存不 304
                if cache_ctl and extra_set_cookie:
                    cache_ctl = None
            data = self._maybe_gzip(data, resp_headers)  # 先压缩:ETag 必须对应真实发出的字节
            if cache_ctl:
                etag = '"%s"' % hashlib.sha1(data).hexdigest()[:20]
                inm = (self.headers.get("If-None-Match") or "").replace(" ", "")
                if inm and (inm == "*" or etag in inm.split(",")):
                    # 命中:304 零字节正文,强制刷新也只花一个 RTT(keep-alive 保持)
                    self.send_response(304)
                    self.send_header("Cache-Control", cache_ctl)
                    self.send_header("ETag", etag)
                    self.send_header("Vary", "Accept-Encoding")
                    if panel_root_html or is_html_doc:
                        # App(无工具条)与浏览器(有工具条)注入的 HTML 不同,缓存条目按 UA 分开
                        self.send_header("Vary", "Accept-Encoding, User-Agent")
                    self.end_headers()
                    _upstream_release(port, conn, reusable=True)
                    return
                # 上游的 no-store / 过期头一律覆盖掉,否则浏览器还是不敢缓存
                resp_headers = [(k, v) for k, v in resp_headers
                                if k.lower() not in ("cache-control", "expires", "pragma")]
                resp_headers.append(("Cache-Control", cache_ctl))
                resp_headers.append(("ETag", etag))
                if panel_root_html or is_html_doc:
                    resp_headers.append(("Vary", "Accept-Encoding, User-Agent"))
                elif not any(k.lower() == "vary" for k, _ in resp_headers):
                    resp_headers.append(("Vary", "Accept-Encoding"))
                # 内容寻址静态资源(非面板根、非注入过工具条的 HTML)存进压缩缓存
                if not panel_root_html and not is_html_doc and self.command == "GET" and not extra_set_cookie:
                    self._asset_cache_put(self.path, resp_headers, data, etag)
        elif resp.status == 200:
            # 流式(chunked)响应拿不到完整正文,算不了 ETag,但缓存头照样能给:
            # DSH 的 /assets/* 就是 chunked 返回的,不给头的话只能靠 nginx 兜。
            cache_ctl = self._cache_policy(self.path)
            if cache_ctl:
                resp_headers = [(k, v) for k, v in resp_headers
                                if k.lower() not in ("cache-control", "expires", "pragma")]
                resp_headers.append(("Cache-Control", cache_ctl))
                if not any(k.lower() == "vary" for k, _ in resp_headers):
                    resp_headers.append(("Vary", "Accept-Encoding"))
        # 下游 keep-alive:HTTP/1.1 下不强制断开,由 BaseHTTPRequestHandler 按请求的
        # Connection 头决定(客户端发 close 才断)。非流式有准确 Content-Length、
        # 流式有 chunked 终止符,两种帧格式都支持复用,不会再出现"响应帧错位"。
        stream_drained = False
        self.send_response(resp.status)
        if streaming:
            self.send_header("Transfer-Encoding", "chunked")
        else:
            self.send_header("Content-Length", str(len(data)))
        for k, v in resp_headers:
            if k.lower() == "content-length":
                continue
            self.send_header(k, v)
        if extra_set_cookie:
            self.send_header("Set-Cookie", extra_set_cookie)
        self.end_headers()
        try:
            if streaming:
                # SSE 空闲保活:静默 25s 注入 ': keepalive' 注释帧,防中间链路掐死流。
                # 三条护栏:仅 event-stream、流式(无 content-length)、上游未压缩。
                write_lock = threading.Lock()
                stream_done = threading.Event()

                def _sse_keepalive():
                    while not stream_done.wait(SSE_KEEPALIVE_SECONDS):
                        frame = b": keepalive\n\n"
                        try:
                            with write_lock:
                                if stream_done.is_set():
                                    break
                                self.wfile.write(("%x\r\n" % len(frame)).encode() + frame + b"\r\n")
                                self.wfile.flush()
                        except (BrokenPipeError, ConnectionResetError, OSError):
                            break

                if sse_mode:
                    threading.Thread(target=_sse_keepalive, daemon=True).start()
                try:
                    while True:
                        chunk = resp.read(65536)
                        if not chunk:
                            stream_drained = True
                            break
                        self._resp_bytes += len(chunk)  # 逐请求日志字节数
                        with write_lock:
                            self.wfile.write(("%x\r\n" % len(chunk)).encode() + chunk + b"\r\n")
                            self.wfile.flush()
                    stream_done.set()  # 先停保活再发终止符,防止终止符后出现游离帧
                    with write_lock:
                        self.wfile.write(b"0\r\n\r\n")
                except (BrokenPipeError, ConnectionResetError, OSError):
                    pass
                finally:
                    stream_done.set()
            else:
                stream_drained = True
                self._resp_bytes = len(data)  # 逐请求日志字节数
                self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass
        finally:
            if sse_mode:
                with _gate_lock:
                    _sse_active = max(0, _sse_active - 1)
            # 上游连接:响应体已完整消费才能回池;客户端中途断开(未排干)一律关闭
            _upstream_release(port, conn, reusable=not streaming or stream_drained)

    # ---- 闸机端点 ----

    PAIR_PAGE = """<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DSH 远程助手 · 配对</title><style>
body{margin:0;font-family:-apple-system,'Segoe UI','Microsoft YaHei',sans-serif;
background:#151517;color:#e7e9ee;display:flex;align-items:center;justify-content:center;min-height:100vh}
.box{width:min(340px,92vw);padding:28px;border:1px solid #2a2c33;border-radius:14px;background:#1b1d22;text-align:center}
h1{font-size:16px;margin:0 0 6px}p{color:#8b8f98;font-size:12px;margin:0 0 12px}
a{display:inline-block;margin-top:8px;padding:10px 22px;border-radius:10px;background:#3d7eff;
color:#fff;text-decoration:none;font-size:14px}
</style></head><body><div class="box"><h1>%s</h1><p>%s</p>%s</div></body></html>"""

    def _is_loopback_call(self):
        """双门禁:本机直连(loopback)且未经 Nginx 隧道转发。
        经隧道进来的请求即使源被终结成 127.0.0.1,Nginx 也必然带上
        X-Real-IP/X-Forwarded-For 头——见头即拒,公网永远创建不了 grant。"""
        ip = self._client_ip()
        if ip not in ("127.0.0.1", "::1", "::ffff:127.0.0.1"):
            return False
        if self.headers.get("X-Real-IP") or self.headers.get("X-Forwarded-For"):
            return False
        return True

    def _is_admin_call(self):
        """本机直连 **且** 持有本地管理令牌 = 管理员。

        以前「loopback 即管理员」:本机任何进程(其它用户的程序、沙箱里跑的其他
        智能体会话)都能生成不限次数的引导链接、改推送开关、读 TOTP 明文密钥。
        现在这些特权端点额外要求 X-BC-Admin 头(或 ?at= 查询参数),令牌在
        browserctl_admin_token(0600),由闸机启动时创建、插件/CLI 读取后带上。
        令牌文件缺失时**拒绝**(fail-closed),不退回旧行为。"""
        if not self._is_loopback_call():
            return False
        want = admin_token(create=False)
        if not want:
            return False
        got = (self.headers.get("X-BC-Admin") or "").strip()
        if not got:
            try:
                from urllib.parse import urlsplit, parse_qs
                got = (parse_qs(urlsplit(self.path).query).get("at") or [""])[0].strip()
            except Exception:
                got = ""
        return bool(got) and hmac.compare_digest(got, want)

    # 有副作用的端点:集中在这里做 CSRF 判定(路由入口一处,避免每个端点各写一遍)
    _CSRF_GUARDED = ("/notify", "/push-config", "/blacklist", "/blacklist/remove",
                     "/kick", "/kick-all", "/verify",
                     "/app/release-config", "/app/apk/upload", "/app/apk/delete")

    def _csrf_ok(self):
        """H-03:写操作的 CSRF 防护。

        bc-gate 是 SameSite=Lax:跨站子资源(<img>/fetch)本来就带不上 Cookie,
        剩下的唯一入口是**顶层导航**——受害者点一个链接就会带上 Cookie 发 GET。
        这里用浏览器自己发的 Sec-Fetch-* 判定,Referer 兜底:

        - Sec-Fetch-Site: cross-site            → 拒绝(典型 CSRF)
        - Sec-Fetch-Site: same-origin/same-site → 放行
        - 没有 Sec-Fetch 头(老浏览器)时看 Referer 主机是否白名单
        - 两者都没有(本机 curl/CLI/智能体) → 放行:那条路径已要求管理令牌
        """
        sfs = (self.headers.get("Sec-Fetch-Site") or "").strip().lower()
        if sfs:
            return sfs in ("same-origin", "same-site", "none")
        ref = self.headers.get("Referer") or ""
        if not ref:
            return True
        try:
            from urllib.parse import urlsplit
            host = (urlsplit(ref).hostname or "").lower()
        except Exception:
            return False
        # Referer 主机白名单:官方域名 + 本机;自建部署用 BC_SERVER_ORIGIN 追加
        # 自己的公网域名(逗号分隔),否则老浏览器(无 Sec-Fetch 头)的写操作会被误拒。
        allowed = {"remote.ymzcc.com", "127.0.0.1", "localhost", "::1"}
        extra = (os.environ.get("BC_SERVER_ORIGIN") or "").strip()
        if extra:
            allowed.update(h.strip().lower() for h in extra.split(",") if h.strip())
        return host in allowed

    def _pair_url(self, grant, kind="pair"):
        st = read_state()
        # 绝不回退写死端口:端口没分配说明隧道没起来,此时生成 /p/17901/ 的码会指向
        # 别人(作者)的机器,扫码必然 502。宁可报错,也不给一条假链接。
        port = int(st.get("remote_port") or 0)
        if port <= 0:
            raise SystemExit("尚未建立隧道(远端端口未分配),无法生成配对链接;\n"
                             "请先在插件里登录官方账号并启动隧道")
        # 端口有值 != 隧道通了:frpc 可能在无限重试(服务器地址错/端口被旧会话占用/token 失效)。
        # 这种状态下出码,手机配对成功但打开面板 502 —— 必须先把真实原因告诉用户。
        ok, why = _tunnel_ready_or_reason()
        if not ok:
            raise SystemExit(why)
        # kind 参数让 App 扫码时能识别这张码是「临时配对」还是「长期配对」:
        # pair      → 一次性会话(App 不保存 Cookie,关掉需重扫)
        # long_pair → 登记设备,App 保存 Cookie,下次免扫码直连
        return ("https://%s/p/%d/browserctl-gate/pair/claim?g=%s&kind=%s"
                % (public_host(), port, grant, kind))

    def _gate_pair_create(self):
        if not self._is_admin_call():
            self._send_json(403, {"ok": False, "error": "配对创建仅限本机管理员调用"})
            return
        # 支持 ?ttl=long → 手机 App 长期配对(7 天有效,签发 30 天 bc-gate cookie)
        # 支持 ?uses=N   → 该码可被扫码次数(默认 1;本地面板扫码后自动换码)
        long_pair = False
        uses = 1
        try:
            from urllib.parse import urlsplit, parse_qs
            q = parse_qs(urlsplit(self.path).query)
            long_pair = (q.get("ttl") or [""])[0].lower() in ("long", "7d")
            uses = int((q.get("uses") or ["1"])[0])
        except Exception:
            long_pair = False
        if long_pair:
            grant = pair_create_long()
            try:
                url = self._pair_url(grant, kind="long_pair")
            except SystemExit as e:
                self._send_json(409, {"ok": False, "error": str(e)})
                return
            self._send_json(200, {"ok": True, "url": url,
                                  "ttl": LONG_PAIR_GRANT_TTL, "long": True,
                                  "uses": 1, "remaining": 1, "grant": grant, "kind": "long_pair"})
            return
        grant = pair_create(uses=uses)
        try:
            url = self._pair_url(grant, kind="pair")
        except SystemExit as e:
            self._send_json(409, {"ok": False, "error": str(e)})
            return
        self._send_json(200, {"ok": True, "url": url,
                              "ttl": PAIR_GRANT_TTL, "uses": uses,
                              "remaining": uses, "grant": grant, "kind": "pair"})

    def _gate_pair_status(self):
        """查询配对码剩余次数(本地面板轮询:检测到有人扫码 → 自动换码)。"""
        if not self._is_admin_call():
            self._send_json(403, {"ok": False, "error": "仅限本机管理员调用"})
            return
        from urllib.parse import urlsplit, parse_qs
        try:
            q = parse_qs(urlsplit(self.path).query)
            grant = (q.get("g") or [""])[0]
        except Exception:
            grant = ""
        if not grant:
            self._send_json(400, {"ok": False, "error": "缺少 g 参数"})
            return
        self._send_json(200, pair_status(grant))

    def _issue_cookie_and_redirect(self, session_only=False):
        """铸 DSH 签名 Cookie(配对 claim / 引导 bootstrap 共用)。
        2FA 开启:直接展示 2FA 登录页(与 Claude Remote 一致,裸 URL 未验证时什么都不显示);
        2FA 关闭:免动态码,302 跳到面板根 —— 裸 URL 仍要求携带此 Cookie 才放行,不公开泄漏。
        session_only=True:临时配对被手机 App 扫到,只签发短时(1 小时)DSH cookie——
        App 即使把 Cookie 存下来,payload 的 expiresAt 很快过期,下次打开仍需重扫,
        杜绝"临时链接被 App 长期占用"。"""
        if session_only:
            name, value, _ = mint_cookie(days=TEMP_APP_COOKIE_HOURS / 24.0)
            cookie = "%s=%s; path=/; Secure; SameSite=Lax; max-age=%d" % (
                name, value, TEMP_APP_COOKIE_HOURS * 3600)
        else:
            name, value, _ = mint_cookie()
            cookie = "%s=%s; path=/; Secure; SameSite=Lax; max-age=%d" % (
                name, value, COOKIE_LIFETIME_DAYS * 86400)
        # 整体持锁读改写:裸 read_state+write_state 会覆盖看门狗同时写入的
        # gate_kick_seq(踢人丢失);update_state 在 state_lock 内完成整个事务。
        st = update_state(lambda s: s.update({"cookie_name": name, "cookie_value": value}))
        headers = [("Set-Cookie", cookie),
                   ("Referrer-Policy", "no-referrer")]
        if not st.get("totp_enabled"):
            # 2FA 关闭:免动态码直接进面板;相对 ../.. 回到面板根(保留 /p/17901 前缀)
            self._send(302, "redirecting…", "text/html; charset=utf-8",
                       headers=headers + [("Location", "../..")])
            return
        self._send(200, GATE_HTML, "text/html; charset=utf-8",
                   headers=headers)

    def _gate_pair_claim(self):
        if not claim_allowed(self._client_ip()):
            self._send_json(429, {"ok": False, "error": "尝试过于频繁,请稍后再试"})
            return
        # 解析 ?g=
        from urllib.parse import urlsplit, parse_qs
        try:
            query = parse_qs(urlsplit(self.path).query)
            grant = (query.get("g") or [""])[0]
        except Exception:
            grant = ""
        # 先读 grant 的种类(kind),再消费删除——pair_claim 是"先删后验",
        # 消费后 grant 已被删除,种类必须在删除前读出。
        kind = "pair"
        with _gate_lock:
            _rec = _grants.get(grant)
            if _rec is not None:
                kind = _rec.get("kind", "pair")
        # 先删后验:pair_claim 内部无论结果都把 grant 从表里删掉,重放无结果
        if not grant or not pair_claim(grant):
            self._send(403, self.PAIR_PAGE % ("配对链接已失效",
                                              "链接是一次性的,有效期内只能使用一次。请在电脑端重新生成配对二维码。", ""),
                       )
            return
        if kind == "long_pair":
            # 手机 App 长期配对:用户在本机 DSH 面板上主动授权 → 直接登记设备会话
            # 并签发 30 天 bc-gate cookie(免 2FA),302 跳到面板根(保留 /p/<port> 前缀)。
            self._gate_long_pair_claim()
            return
        # 临时配对(浏览器):30 天 remember-me Cookie 进面板。
        # 临时配对被手机 App 扫到:只发 1 小时短时 Cookie,防止被 App 长期占用。
        self._issue_cookie_and_redirect(session_only=self._is_app_ua())

    def _gate_long_pair_claim(self):
        """长期配对 claim:登记设备会话 + 种 30 天 bc-gate cookie + 302 进面板。
        服务端设备注册表形成三端验证(手机 devid → 公网 nginx → 本地闸机)。
        同一 devid 的手机重复扫码时复用已有 dev,不重复计数。
        注意:无论服务端注册成功与否,必须给手机发 302+Cookie。
        _server_register_device 已加固(捕获 BaseException),此处再把登记会话/落盘/
        记事件整体兜一层,防止任何异常静默杀死处理线程→公网 502。"""
        # 先消费挂起的"踢全部"(gate_kick_seq 变更):claim 端点不经过 _gate_ok,
        # 若不先处理,新会话会在下一个面板请求被 _process_kicks 清掉,
        # 表现为"重新配对也没用、一直 403"。
        _process_kicks()
        ip = self._client_ip()
        ua = self.headers.get("User-Agent", "")[:120]
        # 读取手机传过来的持久设备标识(客户端侧生成的 device_id)
        from urllib.parse import urlsplit, parse_qs
        try:
            devid_q = (parse_qs(urlsplit(self.path).query).get("devid") or [""])[0][:40]
        except Exception:
            devid_q = ""
        name = _friendly_device_name(ua) or "手机 App"
        now = time.time()
        # 如果同一 devid 已有会话,复用该 dev
        if devid_q:
            with _gate_lock:
                existing = next((d for d, i in _sessions.items() if i.get("devid") == devid_q), None)
            dev = existing if existing else hashlib.md5(devid_q.encode()).hexdigest()[:16]
        else:
            dev = _secrets.token_hex(8)
        with _gate_lock:
            _sessions[dev] = {"ip": ip, "ua": ua,
                              "name": name, "kind": "app",
                              "devid": devid_q,
                              "since": now, "ts": now}
        # 先铸 Cookie:这是手机能不能进面板的唯一凭据,必须最先算出来
        st = gate_state()
        secret = st.get("link_secret")
        if not secret:
            # gate_state() 已保证非空;这里只防极端竞态(文件刚被清空),同样字段级写
            secret = _secrets.token_hex(16)
            update_state(lambda s: {**s, "link_secret": secret})
            st["link_secret"] = secret
        cookie = gate_mint_cookie(secret, dev, ip, ua)
        headers = [("Set-Cookie", "%s=%s; Max-Age=%d; Path=/; HttpOnly; SameSite=Lax; Secure"
                    % (GATE_COOKIE, cookie, GATE_MAX_AGE)),
                   ("Referrer-Policy", "no-referrer"),
                   ("Location", "../..")]
        # 登记会话 / 落盘 / 服务端注册 / 记事件:全部属于"锦上添花",
        # 任何一步失败都不允许影响下发的 302+Cookie(否则手机端就是
        # "配对已失效或未授权",而本地日志一片空白,极难排查)。
        try:
            _device_ensure(_device_key({"dev": dev, "devid": devid_q}), _sessions[dev])
            _dump_sessions()
            _server_register_device(
                dev, name + (" devid=" + devid_q if devid_q else ""), ip, ua)
            _append_event("pair", "手机 App 长期配对成功 IP=%s UA=%s" % (ip, ua[:40]))
        except BaseException as e:
            print("[gate] 长期配对登记步骤异常(不影响下发 Cookie): %r" % (e,), flush=True)
            traceback.print_exc()
        self._send(302, "redirecting…", "text/html; charset=utf-8", headers=headers)

    def _gate_bootstrap(self):
        """引导链接入口(/dsh-auth.html?k=):HMAC+过期校验通过才种 Cookie。
        取代旧方案(nginx 里明文比较静态密钥)——过期即失效,且比较在 Python 侧用
        hmac.compare_digest 完成,不泄漏时序。"""
        from urllib.parse import urlsplit, parse_qs
        st = gate_state()
        link_secret = st.get("link_secret")
        if not link_secret:
            self._send(403, self.PAIR_PAGE % ("未初始化", "缺少链接密钥;请在电脑端运行 browserctl.py nginx", ""))
            return
        try:
            query = parse_qs(urlsplit(self.path).query)
            token = (query.get("k") or [""])[0]
        except Exception:
            token = ""
        # 旧「静态密钥直比」路径已删除:link_secret 嵌在服务器 nginx 配置里,
        # 留着这条路径等于给知道配置的人一把永不过期、不限次数的万能引导链(C-05 残留)。
        # 现在所有链接都是 HMAC token(带过期+次数),密钥也轮换过,旧路径没有存在价值。
        payload = verify_bootstrap_token(link_secret, token)
        if payload is None:
            self._send(403, self.PAIR_PAGE % ("链接无效或已过期",
                                              "引导链接有有效期(默认 24 小时);请在电脑端重新生成二维码。", ""))
            return
        # 使用次数限制:旧 token 没有 u 字段时按"单次"处理(宁可收紧,不可放松)。
        try:
            uses = int(payload.get("u", 1))
        except Exception:
            uses = 1
        nonce = str(payload.get("n") or "") or hashlib.sha256(token.encode()).hexdigest()[:24]
        ok, used, limit = bootstrap_consume(nonce, int(payload.get("exp") or 0), uses)
        if not ok:
            self._send(403, self.PAIR_PAGE % (
                "链接已用完",
                "该引导链接最多可用 %d 次(已用 %d 次);请在电脑端重新生成。" % (limit, used), ""))
            return
        self._issue_cookie_and_redirect()

    def _gate_link_create(self):
        """生成带过期时间的引导链接;仅本机管理员(loopback + 令牌)可调用。"""
        if not self._is_admin_call():
            self._send_json(403, {"ok": False, "error": "引导链接生成仅限本机管理员调用"})
            return
        st = gate_state()
        secret = st.get("link_secret")
        if not secret:
            self._send_json(503, {"ok": False, "error": "缺少链接密钥;先运行 browserctl.py nginx"})
            return
        from urllib.parse import urlsplit, parse_qs
        try:
            q = parse_qs(urlsplit(self.path).query)
            ttl = int((q.get("ttl") or ["86400"])[0])
            uses = int((q.get("uses") or ["1"])[0])
        except Exception:
            ttl, uses = 86400, 1
        ttl = max(60, min(ttl, 7 * 86400))   # 夹在 [60s, 7d] 防配置漂移
        uses = max(0, min(uses, 99))         # 0 = 不限次数;缺省 1 次(一次性)
        token = make_bootstrap_token(secret, ttl, uses)
        url = bootstrap_link_url(token)
        # p=0 表示端口未分配(隧道没起来):给假链接会让用户扫码必然 502,宁可报错
        if "?p=0&" in url or url.endswith("?p=0"):
            self._send_json(409, {"ok": False, "error": "尚未建立隧道(远端端口未分配),无法生成引导链接;\n"
                                                         "请先在插件里登录官方账号并启动隧道"})
            return
        # 端口有值但 frpc 没真正注册成功(在重试)时同样拒绝:否则扫码进 502
        ok, why = _tunnel_ready_or_reason()
        if not ok:
            self._send_json(503, {"ok": False, "error": why})
            return
        self._send_json(200, {
            "ok": True,
            "url": url,
            "ttl": ttl,
            "exp": int(time.time()) + ttl,
            "uses": uses,
        })

    def _serve_gate(self):
        from urllib.parse import urlsplit
        path = urlsplit(self.path).path.rstrip("/")  # 剥掉查询串再匹配
        # H-03:有副作用的端点先过 CSRF 判定(跨站顶层导航带 Cookie 的 GET 也会被拒)
        if path.endswith(self._CSRF_GUARDED) and not self._csrf_ok():
            self._send_json(403, {"ok": False, "error": "跨站请求被拒绝(CSRF 防护)"})
            return
        if path.endswith("/pair/status"):
            self._gate_pair_status()
            return
        if path.endswith("/pair/claim"):
            self._gate_pair_claim()
            return
        if path.endswith("/pair"):
            self._gate_pair_create()
            return
        if path.endswith("/bootstrap"):
            self._gate_bootstrap()
            return
        if path.endswith("/link"):
            self._gate_link_create()
            return
        if path.endswith("/heartbeat"):
            # 设备心跳:刷新当前会话的最后活跃时间。
            # 浏览器关闭后心跳停止 -> stale 会话由 housekeeping 自动清理。
            dev = self._gate_cookie_dev()
            if dev and dev in _sessions:
                with _gate_lock:
                    if dev in _sessions:
                        _sessions[dev]["ts"] = time.time()
                        _sessions[dev]["ip"] = self._client_ip()
                # 用 _device_key 取稳定 key(App 走 devid,浏览器走 dev),
                # 否则 App 心跳会按 dev 另建一条档案,同一台手机变成两台设备。
                _device_ensure(_device_key({"dev": dev, **_sessions.get(dev, {})}),
                               {"dev": dev, **_sessions.get(dev, {})})
                self._send_json(200, {"ok": True})
            else:
                self._send_json(200, {"ok": False, "reason": "no_session"})
            return
        if path.endswith("/events"):
            # 事件日志:必须已通过 2FA(否则会公开泄漏设备 IP)
            if not self._gate_ok():
                self._send_json(401, {"ok": False, "error": "未通过验证"})
                return
            self._send_json(200, {"ok": True, "events": _read_events()})
            return
        # ---- 消息推送 ----
        if path.endswith("/push-config"):
            # 读:需通过会话验证;写:仅本机 loopback(开关属于安全敏感设置)
            if self.command == "POST":
                self._gate_push_config_write()
            else:
                self._gate_push_config_read()
            return
        if path.endswith("/push-poll"):
            self._gate_push_poll()
            return
        if path.endswith("/notify"):
            self._gate_push_notify()
            return
        # 黑名单:列表需通过会话验证(2026-11-07 审计 G6:原"无需验证"会把封禁的
        # IP 列表公开给任意未过闸请求 —— 虽然这些 IP 已在公网暴露过,但没必要再给
        # 攻击者一份"你被封了"的确认通道);增删需验证。
        if path.endswith("/blacklist") and self.command == "GET":
            if not self._gate_ok():
                self._send_json(401, {"ok": False, "error": "未通过验证"})
                return
            self._send_json(200, {"ok": True, "blacklist": _read_blacklist()})
            return
        if self.command == "POST":
            if path.endswith("/blacklist/remove"):
                self._gate_blacklist_remove()
                return
            if path.endswith("/blacklist"):
                self._gate_blacklist_add()
                return
            if path.endswith("/kick"):
                self._gate_kick()
                return
            if path.endswith("/kick-all"):
                self._gate_kick_all()
                return
            if path.endswith("/verify"):
                self._gate_verify()
                return
        # ---- App 发布管理 ----
        if path.endswith("/app/version"):
            self._gate_app_version()
            return
        if path.endswith("/app/release-config"):
            if self.command == "POST":
                self._gate_app_release_config_write()
            else:
                self._gate_app_release_config_read()
            return
        if path.endswith("/app/apks"):
            self._gate_app_apks_list()
            return
        if self.command == "POST":
            if path.endswith("/app/apk/upload"):
                self._gate_app_apk_upload()
                return
            m = re.search(r"/app/apk/delete/(.+)$", path)
            if m:
                self._gate_app_apk_delete(m.group(1))
                return
        # ---- App APK 下载(公网,无鉴权) ----
        m = re.search(r"/app/download/(.+)$", path)
        if m:
            self._gate_app_apk_download(m.group(1))
            return
        # ---- 文件卡片「下载」按钮:按文件名发本机文件(已验证会话) ----
        if self.command in ("GET", "HEAD") and path in (
                GATE_PREFIX.rstrip("/") + "/file", "/browserctl-test-gate/file"):
            self._gate_file_download()
            return
        if path.rstrip("/") in (GATE_PREFIX.rstrip("/"), "/browserctl-test-gate"):
            self._send(200, GATE_HTML)
            return
        self._send(404, "not found", "text/plain")

    # ---- 消息推送 ----

    def _gate_push_config_read(self):
        """读推送配置。已验证会话或本机管理令牌。

        只认会话会把桌面面板锁死:本机 GUI 经插件反代调闸机,不带 bc-gate Cookie,
        只有管理令牌(X-BC-Admin,且 _is_admin_call 要求回环)——原实现一律 401,
        面板红字「未通过验证」永不消失(开关却显示开启,因为 push-poll 认 admin)。
        改为与 push-poll/notify/写开关同一放行口径;公网陌生人既无回环也无令牌,
        开关状态不外泄。"""
        if not (self._is_admin_call() or self._gate_ok()):
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        st = gate_state()
        self._send_json(200, {"ok": True,
                              "enabled": bool(st.get("push_enabled")),
                              "system": bool(st.get("push_system")),
                              "since": _notifs_seq})

    def _gate_push_config_write(self):
        """写推送配置。本机 loopback 或已通过 bc-gate 验证的设备(远程面板开关)可写。
        开关属安全敏感设置,未验证的陌生请求一律 403。"""
        if not (self._is_admin_call() or self._gate_ok()):
            self._send_json(403, {"ok": False, "error": "仅限本机或已验证设备"})
            return
        from urllib.parse import urlsplit, parse_qs
        try:
            q = parse_qs(urlsplit(self.path).query)
        except Exception:
            q = {}

        def _flag(key, default):
            v = (q.get(key) or [""])[0].strip().lower()
            if v in ("1", "true", "yes", "on"):
                return True
            if v in ("0", "false", "no", "off"):
                return False
            return default

        cur = gate_state()
        enabled = _flag("enabled", bool(cur.get("push_enabled")))
        system = _flag("system", bool(cur.get("push_system")))
        update_state(lambda st: st.update({"push_enabled": enabled, "push_system": system}))
        self._send_json(200, {"ok": True, "enabled": enabled, "system": system})

    def _gate_push_poll(self):
        """App/本机长轮询拉取推送。需 bc-gate Cookie 或本机管理令牌。"""
        if not (self._is_admin_call() or self._gate_ok()):
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        from urllib.parse import urlsplit, parse_qs
        try:
            q = parse_qs(urlsplit(self.path).query)
            last = int((q.get("last") or ["0"])[0])
        except Exception:
            last = 0
        if last < 0:
            last = 0
        st = gate_state()
        enabled = bool(st.get("push_enabled"))
        with _notifs_lock:
            if last == 0:
                items = _notifs[-PUSH_POLL_BACKLOG:]
            else:
                items = [r for r in _notifs if r.get("id", 0) > last][-PUSH_POLL_MAX_ITEMS:]
            since = _notifs_seq
        self._send_json(200, {"ok": True, "enabled": enabled,
                              "since": since, "items": items})

    def _gate_push_notify(self):
        """入队一条推送。本机 loopback(智能体/CLI)或已通过 bc-gate 验证的设备
        (远程面板「发送测试推送」)可调用;push_enabled 关闭时静默丢弃(返回
        pushed:false),不报错。"""
        if not (self._is_admin_call() or self._gate_ok()):
            self._send_json(403, {"ok": False, "error": "仅限本机或已验证设备"})
            return
        from urllib.parse import urlsplit, parse_qs
        try:
            q = parse_qs(urlsplit(self.path).query)
            title = (q.get("title") or [""])[0]
            body = (q.get("body") or [""])[0]
            kind = (q.get("kind") or [""])[0] or "system"
        except Exception:
            title = body = ""
            kind = "system"
        nid = _push_notify(kind, title, body)
        self._send_json(200, {"ok": True, "id": nid, "pushed": nid is not None})

    # ---- App 发布管理 ----

    def _gate_app_version(self):
        """公共版本信息接口(无鉴权)。手机 App 检查更新时调用。"""
        config = _app_config_read()
        apks = _app_apks_list()
        self._send_json(200, {
            "ok": True,
            "enabled": config.get("enabled", False),
            "latest_version_name": config.get("latest_version_name", ""),
            "latest_version_code": config.get("latest_version_code", 0),
            "min_supported_version_code": config.get("min_supported_version_code", 0),
            "download_url": config.get("download_url", ""),
            "release_notes": config.get("release_notes", ""),
            "force_update_message": config.get("force_update_message", ""),
            "apks": apks,
        })

    def _gate_app_release_config_read(self):
        """读发布配置(管理员)。"""
        if not self._gate_ok():
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        config = _app_config_read()
        apks = _app_apks_list()
        self._send_json(200, {"ok": True, "config": config, "apks": apks})

    def _gate_app_release_config_write(self):
        """写发布配置(管理员)。"""
        # 必须是本机管理员(127.0.0.1 回环 + X-BC-Admin/?at= 令牌),不能只 _gate_ok():
        # 任意已配对设备(30 天 cookie)改 download_url/最低版本 = App 更新投毒链
        # (2026-11-07 审计 S2;插件面板不直连本端点,走官方 /api/admin/app/*,无调用方受影响)。
        if not (self._is_admin_call() and self._gate_ok()):
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        data = self._read_json_body()
        if data is None:
            return
        config = _app_config_read()
        for key in ("enabled", "latest_version_name", "latest_version_code",
                     "min_supported_version_code", "download_url",
                     "release_notes", "force_update_message"):
            if key in data:
                config[key] = data[key]
        _app_config_write(config)
        self._send_json(200, {"ok": True, "config": config})

    def _gate_app_apks_list(self):
        """列出已上传 APK(管理员)。"""
        if not self._gate_ok():
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        apks = _app_apks_list()
        self._send_json(200, {"ok": True, "apks": apks})

    def _gate_app_apk_upload(self):
        """上传 APK 文件(管理员)。原始字节流 + X-Appk-Filename 头,
        不用 cgi 模块(Python 3.13 已移除;multipart 解析也省了)。上限 200MB。"""
        # 同 release-config:已配对会话可上传任意 APK 供无鉴权的 /app/download 分发 = 投毒面,
        # 收紧为本机管理员(2026-11-07 审计 S2)。
        if not (self._is_admin_call() and self._gate_ok()):
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        from urllib.parse import urlsplit, parse_qs
        filename = (self.headers.get("X-Appk-Filename") or "").strip()
        if not filename:
            try:
                q = parse_qs(urlsplit(self.path).query)
                filename = (q.get("filename") or [""])[0]
            except Exception:
                filename = ""
        safe_name = Path(filename or "").name
        if not safe_name or ".." in safe_name or "/" in safe_name or "\\" in safe_name:
            self._send_json(400, {"ok": False, "error": "缺少或非法的文件名(X-Appk-Filename 头)"})
            return
        if not safe_name.lower().endswith(".apk"):
            self._send_json(400, {"ok": False, "error": "仅支持 .apk 文件"})
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > 200 * 1024 * 1024:
            self._send_json(413, {"ok": False, "error": "文件为空或超过 200MB 上限"})
            return
        APP_DIR.mkdir(parents=True, exist_ok=True)
        target = APP_DIR / safe_name
        remaining = length
        with open(target, "wb") as out:
            while remaining > 0:
                chunk = self.rfile.read(min(65536, remaining))
                if not chunk:
                    break
                out.write(chunk)
                remaining -= len(chunk)
        harden_file_perms(target)
        version_name, version_code = _app_parse_version_from_filename(safe_name)
        self._send_json(200, {
            "ok": True,
            "filename": safe_name,
            "size": target.stat().st_size,
            "version_name": version_name,
            "version_code": version_code,
            "url": "/browserctl-gate/app/download/" + safe_name,
        })

    def _gate_app_apk_delete(self, filename):
        """删除已上传的 APK(管理员)。"""
        if not (self._is_admin_call() and self._gate_ok()):
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        ok = _app_apk_delete(filename)
        self._send_json(200, {"ok": ok})

    def _gate_app_apk_download(self, filename):
        """公共 APK 下载(无鉴权)。分块流式发送,不整包读进内存(上限 200MB)。"""
        safe_name = Path(filename).name
        if ".." in safe_name or "/" in safe_name or "\\" in safe_name:
            self._send(403, "forbidden", "text/plain")
            return
        target = APP_DIR / safe_name
        if not target.exists() or target.suffix.lower() != ".apk":
            self._send(404, "not found", "text/plain")
            return
        try:
            size = target.stat().st_size
            self.send_response(200)
            self.send_header("Content-Type", "application/vnd.android.package-archive")
            self.send_header("Content-Length", str(size))
            self.send_header("Content-Disposition",
                             'attachment; filename="%s"' % safe_name)
            self.send_header("Cache-Control", "public, max-age=3600")
            self.end_headers()
            with open(target, "rb") as f:
                while True:
                    chunk = f.read(262144)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass  # 客户端中途取消下载属正常
        except OSError:
            pass

    def _gate_file_download(self):
        """按文件名把本机文件发给远控端(面板文件卡片上的「下载」按钮用)。

        鉴权:必须已通过 2FA/会话(_gate_ok) —— 这个端点等于把电脑上的文件
        发到对面手机,和面板同一把锁,公网陌生人拿不到任何东西。
        客户端只允许带文件名(query ?name=),路径由闸机在白名单根里自己找
        (App 发布目录 > 工作区 > DSH 附件库,同名取最新),天然无目录穿越。
        流式分块发送,不整包进内存;中文文件名走 RFC 5987 双写法。"""
        if not self._gate_ok():
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        from urllib.parse import urlsplit, parse_qs
        q = parse_qs(urlsplit(self.path).query)
        name = (q.get("name") or [""])[0].strip()
        safe_name = Path(name).name if name else ""
        if (not safe_name or safe_name in (".", "..")
                or "/" in name or "\\" in name or len(safe_name) > 200
                or any(ord(c) < 32 for c in safe_name)):
            self._send_json(400, {"ok": False, "error": "缺少或非法的文件名"})
            return
        target = _resolve_download_candidate(safe_name)
        if target is None or _download_denied(target):
            # 拒绝名单二次复核(纵深防御):解析层已过滤,这里再拦一次,
            # 且拒绝与"没找到"同口径回复,不暴露文件是否存在
            self._send_json(404, {"ok": False,
                                  "error": "电脑上没找到这个文件（可能已被移动或删除）"})
            return
        try:
            size = target.stat().st_size
        except OSError:
            self._send_json(404, {"ok": False, "error": "文件读取失败"})
            return
        if size > 512 * 1024 * 1024:
            self._send_json(413, {"ok": False,
                                  "error": "文件超过 512MB，暂不支持手机下载"})
            return
        ctype = _DL_MIME.get(target.suffix.lower(), "application/octet-stream")
        try:
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(size))
            self.send_header("Content-Disposition", _content_disposition(safe_name))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self._responded = True  # 手工发头路径也要标记,异常兜底不再重复回包
            with open(target, "rb") as f:
                while True:
                    chunk = f.read(262144)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass  # 客户端中途取消下载属正常
        except OSError:
            pass

    def _gate_verify(self):
        ip = self._client_ip()
        # 全局熔断优先于单 IP 限速:跨 IP 汇总失败数超阈值(200 次/15min)说明
        # 正在被分布式爆破,所有 /verify 一律 429,不给任何 IP 继续试码的机会。
        if verify_global_tripped():
            _append_event("verify", "全局熔断中,拒绝 /verify IP=%s" % ip)
            self._send_json(429, {"ok": False,
                                  "error": "验证尝试过多,已临时关闭,请约 15 分钟后再试"})
            return
        if not brute_check(ip):
            self._send_json(429, {"ok": False, "error": "错误次数过多,已冻结 15 分钟"})
            return
        data = self._read_json_body()
        if data is None:
            return
        st = gate_state()
        secret = st.get("totp_secret")
        if not st.get("totp_enabled") or not secret:
            self._send_json(400, {"ok": False, "error": "2FA 未启用"})
            return
        code = str(data.get("code", "")).strip()
        if not totp_verify(secret, code):
            brute_fail(ip)
            verify_global_fail_bump()  # 全局熔断计数:跨 IP 汇总(见防爆破区常量)
            self._send_json(401, {"ok": False, "error": "动态码错误"})
            return
        brute_clear(ip)
        # 时长余额拦截(阶段4):余额用尽时阻止新设备验证。
        # 仅拦「新建会话」;30 天设备信任 Cookie 的签发不动(fail-open:异常放行)。
        if not _gate_balance_allowed():
            self._send_json(403, {"ok": False,
                                  "error": "时长用尽，请前往 remote.ymzcc.com 个人中心签到获取更多时长"})
            return
        # 复用已有设备标识(退出后重新扫码仍是同一台设备)
        dev = self._gate_cookie_dev()
        if dev and dev in _gate_kicked_set():
            dev = None
        if not dev:
            dev = _secrets.token_hex(8)
        ua = self.headers.get("User-Agent", "")[:120]
        name = _friendly_device_name(ua)
        kind = "app" if self._is_app_ua() else "web"
        with _gate_lock:
            _sessions[dev] = {"ip": ip, "ua": ua,
                              "name": name, "kind": kind,
                              "since": time.time(), "ts": time.time()}
        _device_ensure(dev, _sessions[dev])
        _dump_sessions()
        _append_event("verify", "设备验证通过 IP=%s UA=%s" % (ip, ua[:40]))
        # 向服务端注册表登记设备(使 nginx 三端验证可通过;SSH 失败不阻塞)
        try:
            _server_register_device(dev, name, ip, ua)
        except Exception:
            pass
        cookie = gate_mint_cookie(st["link_secret"], dev, ip, ua)
        self._send_json(200, {"ok": True}, headers=[
            ("Set-Cookie", "%s=%s; Max-Age=%d; Path=/; HttpOnly; SameSite=Lax; Secure"
             % (GATE_COOKIE, cookie, GATE_MAX_AGE))])

    def _gate_kick(self):
        """定向踢出:立即从 sessions 中删除设备,不需要等 housekeeping 2 秒巡检。
        无论 2FA 是否开启都把设备记入"已踢"名单(与 pop 同一把锁),彻底杜绝
        「释放锁到写盘之间,设备并发请求重新登记 → 踢完一两秒又跳回来」的竞态:
        - 2FA 关闭:Cookie 有效性不依赖会话在册,靠已踢名单拦住重登记;
        - 2FA 开启:踢出即弹会话,旧 Cookie 随之失效,已踢名单再做一层保险。
        插件/CLI 可用 X-BC-Admin(本机 loopback)直调本端点做同步踢出。
        DSH webServer/插件反代会排空请求体,body 可能读不到 → 兼容 ?dev= 查询串。"""
        if not (self._is_admin_call() or self._gate_ok()):
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        data = self._read_json_body()
        if data is None:
            return
        dev = str(data.get("dev", "")).strip()
        if not dev:
            try:
                from urllib.parse import urlsplit, parse_qs
                dev = (parse_qs(urlsplit(self.path).query).get("dev") or [""])[0].strip()
            except Exception:
                dev = ""
        if not dev:
            self._send_json(400, {"ok": False, "error": "缺少 dev 参数"})
            return
        with _gate_lock:
            dev_info = _sessions.pop(dev, None)
            # 已踢名单与 pop 同锁写入:此刻起任何重新登记(含在锁外通过检查、
            # 正等锁的并发请求,见 _gate_ensure_device 锁内复查)都会被拦下
            st = gate_state()
            st["gate_kicked_devs"] = _cap_kicked([*(st.get("gate_kicked_devs") or []), dev])
        if dev_info:
            _device_close(_device_key({"dev": dev, **dev_info}))
            _append_event("kick", "踢出设备 %s (IP=%s)" % (dev, dev_info.get("ip", "?")))
        _dump_sessions()
        # 兜底:pop 与写盘之间若仍有已过闸的并发请求把设备挤回 _sessions,再清一次
        with _gate_lock:
            if dev in _sessions:
                _sessions.pop(dev, None)
        _dump_sessions()
        # 字段级写:只动 gate_kicked_devs(kb/06 第 24 条),不回写整份旧快照
        try:
            update_state(lambda s: {**s, "gate_kicked_devs": st.get("gate_kicked_devs")})
        except Exception:
            pass
        self._send_json(200, {"ok": True})

    def _gate_kick_all(self):
        """全部踢下线:立即清空所有会话,但保留当前管理员(自己)。
        2FA 关闭时把其余设备记入"已踢"名单,防止它们重新登记。
        ⚠️ SSH(服务器注册表反注册)必须在 _gate_lock 外做:单次 SSH 最多 ~15s,
        锁内做会把 TOTP 验证/会话校验等全部闸机请求冻结 ~15s×N(2026-11-07 审计 G3)。"""
        if not self._gate_ok():
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        st = gate_state()
        st["gate_kick_seq"] = (st.get("gate_kick_seq") or 0) + 1
        global _kick_seq_seen
        admin_dev = self._gate_cookie_dev()
        ssh_pending = []
        with _gate_lock:
            admin_info = _sessions.pop(admin_dev, None) if admin_dev else None
            kicked_devs = list(_sessions.keys())
            # 关闭所有被踢设备的在线记录(本地关闭在锁内;SSH 挪到锁外)
            for d in kicked_devs:
                info = _sessions.get(d)
                if info:
                    _device_close(_device_key({"dev": d, **info}))
                    ssh_pending.append(d)
            _sessions.clear()
            if admin_info:
                _sessions[admin_dev] = admin_info
            _kick_seq_seen = st["gate_kick_seq"]  # 标记已消费,管理员本人不被 seq 清除
        if not st.get("totp_enabled"):
            st["gate_kicked_devs"] = _cap_kicked([*(st.get("gate_kicked_devs") or []), *kicked_devs])
        # 服务器注册表反注册(SSH)挪到锁外:失败只记日志,不影响本地踢出
        for d in ssh_pending:
            try:
                _server_unregister_device(d)
            except BaseException:
                pass
        # 字段级写:只动 gate_kick_seq / gate_kicked_devs(kb/06 第 24 条),
        # 不把 frpc_pid/tunnel_ok 等并发字段覆盖回旧快照
        try:
            update_state(lambda s: {**s,
                                    "gate_kick_seq": st["gate_kick_seq"],
                                    "gate_kicked_devs": st.get("gate_kicked_devs",
                                                               s.get("gate_kicked_devs"))})
        except Exception:
            pass
        _dump_sessions()
        _append_event("kick", "全部踢下线(保留本管理员)")
        self._send_json(200, {"ok": True})

    def _gate_blacklist_add(self):
        """添加 IP 到黑名单。需要验证。"""
        if not self._gate_ok():
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        data = self._read_json_body()
        if data is None:
            return
        ip = str(data.get("ip") or "").strip()
        dev = str(data.get("dev") or "").strip()
        name = str(data.get("name") or "").strip()[:40]
        reason = str(data.get("reason") or "").strip()[:80]
        if not ip and not dev:
            self._send_json(400, {"ok": False, "error": "缺少 ip 或 dev 参数"})
            return
        rows = _read_blacklist()
        # 找现成的 IP 条目
        existing = next((r for r in rows if r.get("ip") == ip), None)
        if existing:
            # 更新
            existing["reason"] = reason or existing.get("reason", "")
            if name:
                existing["name"] = name
        else:
            rows.append({"ip": ip, "dev": dev, "name": name or "未知", "reason": reason or "管理员封禁",
                         "since": time.time()})
        _write_blacklist(rows)
        _append_event("ban", "添加黑名单 IP=%s name=%s reason=%s" % (ip, name, reason))
        self._send_json(200, {"ok": True, "blacklist": _read_blacklist()})

    def _gate_blacklist_remove(self):
        """从黑名单移除 IP。需要验证。"""
        if not self._gate_ok():
            self._send_json(401, {"ok": False, "error": "未通过验证"})
            return
        data = self._read_json_body()
        if data is None:
            return
        ip = str(data.get("ip") or "").strip()
        if not ip:
            self._send_json(400, {"ok": False, "error": "缺少 ip 参数"})
            return
        rows = _read_blacklist()
        new_rows = [r for r in rows if r.get("ip") != ip]
        if len(new_rows) == len(rows):
            self._send_json(404, {"ok": False, "error": "未找到该 IP"})
            return
        _write_blacklist(new_rows)
        _append_event("ban", "移出黑名单 IP=%s" % ip)
        self._send_json(200, {"ok": True, "blacklist": _read_blacklist()})

    # ---- PWA(面板「添加到主屏幕」) ----

    def _is_panel_root(self):
        """面板根页判断。公网 /p/<port>/ 经 nginx 剥掉前缀后,闸机收到的就是 /。"""
        from urllib.parse import urlsplit
        return (urlsplit(self.path).path.rstrip("/") or "/") == "/"

    def _serve_pwa(self):
        """面板 PWA 静态资源:manifest(端口动态,程序内生成)/ 图标 / sw.js。
        公网路径已由 nginx 做过 bc-gate Cookie 门禁,这里直接返回静态内容即可。"""
        from urllib.parse import urlsplit
        p = urlsplit(self.path).path.rstrip("/") or "/"
        port = int(gate_state().get("remote_port") or 0)
        if p == "/manifest.webmanifest":
            if port <= 0:
                return self._send(503, b"tunnel not ready", "text/plain")
            # 用 replace 而非 format:manifest 本身是 JSON,花括号会被 format 当占位符
            self._send(200, PWA_MANIFEST.replace("{port}", str(port)),
                       "application/manifest+json; charset=utf-8",
                       headers=[("Cache-Control", "public, max-age=3600")])
            return True
        m = re.match(r"^/icon-(180|192|512)\.png$", p)
        if m:
            try:
                data = (PWA_DIR / ("icon-%s.png" % m.group(1))).read_bytes()
            except OSError:
                self._send(404, "icon not found", "text/plain")
                return True
            self._send(200, data, "image/png",
                       headers=[("Cache-Control", "public, max-age=86400")])
            return True
        if p == "/sw.js":
            try:
                data = (PWA_DIR / "sw.js").read_bytes()
            except OSError:
                self._send(404, "service worker not found", "text/plain")
                return True
            self._send(200, data, "application/javascript; charset=utf-8",
                       headers=[("Cache-Control", "no-store")])
            return True
        return False

    def _serve_app_page(self):
        """公共 App 下载页面: /app 和 /app/。
        返回包含版本信息的静态 HTML 下载页(JS 动态加载版本数据)。"""
        from urllib.parse import urlsplit
        p = urlsplit(self.path).path.rstrip("/") or "/"
        port = int(gate_state().get("remote_port") or 0)
        if p not in ("/app", "/app/index.html"):
            return False
        if port <= 0:
            return self._send(503, b"tunnel not ready", "text/plain")
        html = _APP_DOWNLOAD_PAGE_TEMPLATE.replace("{port}", str(port))
        self._send(200, html.encode("utf-8"), "text/html; charset=utf-8",
                   headers=[("Cache-Control", "no-cache")])
        return True

    def _inject_pwa_tags(self, html, toolbar_only=False):
        """往面板根 HTML 的 <head> 里塞 PWA 标签(manifest/apple-touch-icon/meta/SW 注册)
        和移动端工具条(返回/全屏/视口,见 _MOBILE_TOOLBAR_JS,仅触屏设备自行显示)。
        toolbar_only=True 时只注入工具条,跳过 PWA 标签(用于非根 HTML 页面)。
        App(UA 含 DshRemote/)不注入工具条——App 有自己的原生导航,不需要悬浮按钮;
        但文件卡片「下载」按钮(_FILE_DL_TAG,触屏自生效)对 App 一样注入。
        全部用相对路径:面板无论从 /p/<port>/ 还是 /dsh-remote/p/<uid>/(uid 稳定配对)
        打开,都解析到当前前缀下的本闸机静态资源 —— 端口变化后 PWA 图标/SW 照常工作。
        必须在校验 / 压缩之前调用,让 ETag 覆盖注入后的真实字节。"""
        # App 不注入移动端工具条(返回/全屏/视口),App 自有原生导航
        ua = (self.headers.get("User-Agent") or "").lower()
        is_app = "dshremote/" in ua
        if toolbar_only:
            if is_app:
                tags = _FILE_DL_TAG
            else:
                tags = _MOBILE_TOOLBAR_TAG + _FILE_DL_TAG
        else:
            tags = (
                b'<meta name="apple-mobile-web-app-capable" content="yes">'
                b'<meta name="mobile-web-app-capable" content="yes">'
                b'<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'
                b'<meta name="theme-color" content="#121316">'
                b'<link rel="manifest" href="manifest.webmanifest">'
                b'<link rel="apple-touch-icon" href="icon-180.png">'
                b'<script>try{navigator.serviceWorker&&navigator.serviceWorker.register("sw.js")}catch(e){}</script>'
                + (b"" if is_app else _MOBILE_TOOLBAR_TAG)
                + _FILE_DL_TAG
            )
        idx = html.lower().find(b"<head")
        if idx < 0:
            return html
        end = html.find(b">", idx)
        if end < 0:
            return html
        html = html[:end + 1] + tags + html[end + 1:]
        # 加载动效:在 </body> 前插入全屏 spinner(仅根页 + 非 App 注入;
        # 非根页是站内跳转,再盖一层开屏会闪一下,工具条本身已够用)
        if not is_app and not toolbar_only:
            body_end = html.lower().find(b"</body>")
            if body_end >= 0:
                html = html[:body_end] + _LOADING_SPLASH_TAG + html[body_end:]
        return html

    # ---- 请求入口 ----

    def _handle(self):
        """请求总入口:任何未预期异常都必须变成 5xx + 本地日志,不能静默断连。

        socketserver 的 process_request_thread 只兜 Exception 且不打印 traceback,
        所以一旦 handler 里冒出 Exception 之外的异常(BaseException 子类,例如
        _ssh() 在主机密钥未固定时抛的 SystemExit),线程会静默死亡:不返回响应、
        不打印堆栈 → 公网侧只看到 TCP 被断开,表现为 502 socket hang up,
        手机端则显示"配对已失效或未授权"(2026-11-06 同学实测)。
        这里统一兜住并记录,以后同类问题一眼能从日志看到。"""
        self._responded = False
        try:
            self._dispatch()
        except (BrokenPipeError, ConnectionResetError):
            pass  # 客户端提前断开,正常现象
        except BaseException as e:
            try:
                # 2026-11-08 审计 P2:self.path 含 query,而配对/引导链路用 ?k=/&kind=、
                # 管理端点支持 ?at=<管理令牌>——把完整 self.path 写进 fwd.log/events
                # 等于把凭据落盘。这里与所有日志口径统一只记路径部分。
                _p = urllib.parse.urlsplit(self.path).path
                print("[gate] 请求处理异常 %s %s: %r" % (self.command, _p, e), flush=True)
                traceback.print_exc()
                _append_event("error", "请求异常 %s %s: %s"
                              % (self.command, _p, str(e)[:120]))
            except BaseException:
                pass
            if not self._responded:
                try:
                    self._send(500, "<h1>500</h1><p>闸机内部错误,详见本地 browserctl_fwd.log。</p>")
                except BaseException:
                    pass

    def _dispatch(self):
        # 面板 PWA 静态资源:公网路径已由 nginx 做过 Cookie 门禁,直接返回
        if self.command in ("GET", "HEAD") and self._serve_pwa():
            return
        # 公共 App 下载页:无鉴权
        if self.command == "GET" and self._serve_app_page():
            return
        # 闸机自己的端点永不需要会话(官方前缀和测试副本前缀都认)
        if self.path.startswith(GATE_PREFIXES):
            self._serve_gate()
            return
        st = gate_state()
        if not st.get("totp_enabled"):
            # 2FA 关闭:免验证放行,但先做拦截检查(已踢/黑名单),再自动登记设备会话
            if not self._gate_ok():
                self._deny_unauthorized()
                return
            # 三端验证:nginx 传递的 X-Device-Id 必须与 cookie 的 dev 一致
            if not self._gate_verify_device():
                self._deny_unauthorized()
                return
            _dev, extra_cookie = self._gate_ensure_device()
            if _dev is None:
                # 已被踢下线：App 拿到 403 会提示重新配对，浏览器仍只看到纯黑页
                self._deny_unauthorized()
                return
            if "upgrade" in self.headers.get("Connection", "").lower():
                self._relay_ws()
            else:
                self._proxy(extra_set_cookie=extra_cookie)
            return
        if self._gate_ok():
            if not self._gate_verify_device():
                self._deny_unauthorized()
                return
            if "upgrade" in self.headers.get("Connection", "").lower():
                self._relay_ws()
            else:
                self._proxy()
            return
        # 未通过验证:裸 URL 不展示任何内容(连 2FA 页都不给)。
        # 2FA 页只在带 token 的配对/引导链接之后出现。
        self._deny_unauthorized()

    do_GET = _handle
    do_POST = _handle
    do_PUT = _handle
    do_DELETE = _handle
    do_PATCH = _handle
    do_HEAD = _handle
    do_OPTIONS = _handle


def _bc_apply_fwd_port():
    """子进程(fwd/watch)从环境变量继承闸机端口,父进程 start 时选好再 spawn。"""
    p = os.environ.get("BC_FWD_PORT")
    if p:
        try:
            globals()["FWD_PORT"] = int(p)
        except ValueError:
            pass


def gate_serve():
    _bc_apply_fwd_port()
    """127.0.0.1:FWD_PORT 闸机:TOTP 2FA → 反代 DSH(支持 WS/SSE 长连接)。
    外层自杀重启循环:任何致命异常打崩 HTTP 服务后 1 秒重建,链路自愈。"""
    global _kick_seq_seen
    _kick_seq_seen = read_state().get("gate_kick_seq", 0)
    # 单实例守卫:3080 已有转发器在服务时,本进程(重复拉起/竞态产物)直接退出,
    # 不再无限重试抢占 —— 双进程会互相覆盖 browserctl_sessions.json 导致设备列表丢失。
    try:
        if _port_open(FWD_PORT):
            print("闸机已在 127.0.0.1:%d 运行,本副本退出" % FWD_PORT, flush=True)
            return
    except Exception:
        pass
    # 先加载设备档案(全部置离线),再恢复会话(只补元数据/最后活跃时间,不置在线),
    # 顺序不能反:否则 _load_devices 会用文件里的旧 online 状态覆盖会话恢复结果。
    dev_count = _load_devices()
    if dev_count:
        print("已恢复 %d 台设备历史记录" % dev_count, flush=True)
    bs_count = _load_bootstrap()
    if bs_count:
        print("已恢复 %d 条引导链接使用计数" % bs_count, flush=True)
    # 本地管理令牌:启动即确保存在,插件/CLI 读它来调特权端点。
    # 不创建的话 _is_admin_call 会一律拒绝(fail-closed),面板就点不动了。
    admin_token()
    harden_credential_files()
    restored = _load_sessions()
    if restored:
        print("已恢复 %d 台已认证设备(免重复 2FA)" % restored, flush=True)
    _notifs_load()
    if _notifs:
        print("已恢复 %d 条推送通知记录" % len(_notifs), flush=True)
    _grants_restored = _load_grants()
    if _grants_restored:
        print("已恢复 %d 条配对 grant(长期二维码继续有效)" % _grants_restored, flush=True)
    print("browserctl 闸机: 127.0.0.1:%d (TOTP 2FA) → DSH(自动探测)" % FWD_PORT, flush=True)

    def housekeeping():
        while True:
            time.sleep(2)
            try:
                # 心跳(按真实流逝时间累计) + 逐请求日志批量上报：必须在本进程跑，
                # _sessions 在这里才是活的（看门狗是独立进程、恒空）。
                _gate_heartbeat_tick()
                _reqlog_flush_tick()
                _process_kicks()
                _prune_bootstrap()   # 丢弃已过期的引导链接使用计数
                # 清理老旧会话:超过 10 分钟未收到心跳的设备自动移除
                now = time.time()
                stale = []
                with _gate_lock:
                    for dev, info in list(_sessions.items()):
                        # 2FA 启用时保留 30 天(与 Cookie Max-Age 一致),
                        # 2FA 关闭时只保留 10 分钟(浏览器关后自动消失)
                        max_age = 30 * 86400 if gate_state().get("totp_enabled") else 600
                        if now - info.get("ts", info.get("since", now)) > max_age:
                            stale.append(dev)
                    for d in stale:
                        info = _sessions.pop(d, None)
                        if info:
                            _device_close(_device_key({"dev": d, **info}))
                # 设备空闲下线:2FA 开启时会话会保留 30 天(免验信任),但那不代表设备还连着。
                # 超过 DEVICE_IDLE_SECONDS 没有任何请求/心跳 -> 标记离线,累计在线时长,
                # 并保留真实 last_seen(空闲下线不把"最后活跃"改写成"现在")。
                # 会话本身不动,所以重新打开面板仍免 2FA。
                idle = []
                with _devices_lock:
                    for k, d in _devices.items():
                        if not d.get("online"):
                            continue
                        seen = d.get("last_seen") or 0
                        if now - seen > DEVICE_IDLE_SECONDS:
                            idle.append((k, seen))
                for k, seen in idle:
                    _device_close(k, at=seen)
                _dump_sessions()
            except Exception:
                pass

    threading.Thread(target=housekeeping, daemon=True).start()
    # Windows 上 SO_REUSEADDR 允许多个进程绑同一端口(连接随机落到死进程,公网时好时坏)。
    # 改用 SO_EXCLUSIVEADDRUSE:独占绑定,第二个闸机绑不上就明确报错等待,而不是暗中劫持。
    if os.name == "nt":
        ThreadingHTTPServer.allow_reuse_address = False
    ThreadingHTTPServer.request_queue_size = 128  # 默认 backlog 只有 5,页面并发一冲就拒绝连接
    while True:
        try:
            server = ThreadingHTTPServer(("127.0.0.1", FWD_PORT), GateHandler)
            if os.name == "nt":
                server.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        except OSError as e:
            # 端口已被他人独占:若是仍在服务的转发器,本副本退出(单实例);
            # 否则可能只是瞬时占用,稍后重试。
            if _port_open(FWD_PORT):
                print("闸机端口已被在运行实例占用,本副本退出", flush=True)
                return
            print("闸机端口被占(%r),5 秒后重试" % e, flush=True)
            time.sleep(5)
            continue
        try:
            server.serve_forever(poll_interval=0.5)
        except Exception as e:
            print("闸机异常重启: %r" % e, flush=True)
            try:
                server.server_close()
            except Exception:
                pass
            time.sleep(1)


def _ctl_lock(acquire=True, timeout=30):
    """跨进程互斥锁:串行化 start/stop,防并发调用竞态产生重复 fwd/frpc/watchdog。
    用法:with _ctl_lock(): ...  超时后抛 SystemExit(清晰报错而非静默失败)。"""
    lock_path = HERE / "browserctl_ctl.lock"
    try:
        f = open(str(lock_path), "w+")
    except OSError as e:
        raise SystemExit("无法创建控制锁: %s" % e)
    if os.name == "nt":
        import msvcrt
        deadline = time.time() + timeout
        while True:
            try:
                msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1)
                return f
            except OSError:
                if time.time() > deadline:
                    f.close()
                    raise SystemExit("另一个 browserctl 操作正在进行中(锁等待超时),请稍后再试")
                time.sleep(0.2)
    else:
        import fcntl
        fcntl.flock(f, fcntl.LOCK_EX)
        return f


class _ctl_release:
    """释放 msvcrt/文件锁(Windows LK_UNLCK;Unix flock 在 close 时自动释放)。"""
    def __init__(self, f):
        self.f = f
    def __enter__(self):
        return self
    def __exit__(self, *exc):
        try:
            if os.name == "nt":
                import msvcrt
                try:
                    msvcrt.locking(self.f.fileno(), msvcrt.LK_UNLCK, 1)
                except OSError:
                    pass
        finally:
            try:
                self.f.close()
            except OSError:
                pass
        return False


def _port_open(port, timeout=1.0):
    try:
        s = socket.create_connection(("127.0.0.1", port), timeout=timeout)
        s.close()
        return True
    except OSError:
        return False


def _gate_is_ours(port, timeout=1.5):
    """端口上监听的闸机是否「本副本」。

    双副本并存(工作区测试版 + 镜像正式版)时,两份 browserctl.py 各自读**自己目录**的
    browserctl_admin_token。带本副本令牌 GET /browserctl-gate/pair/status:
      200 + JSON 有 ok 键 = 本副本(令牌同一目录,闸机才会放行);
      403               = 另一份副本的闸机(它校验的是它目录的令牌,必拒);
      连接失败/非 JSON   = 非闸机程序或端口已空。
    再加一道反证:换一个**错误令牌**再探一次,必须被拒(403)。双 200 说明监听者
    不是直连闸机——例如 DSH 里另一份 browserctl 插件把 /browserctl-gate 反代给了
    真闸机(反代会替请求补上它自己的管理令牌),绝不能认成自己的。
    这是端口被占时唯一可靠的身份判据——端口开着只说明「有东西在听」,
    不说明是自己的闸机(2026-11-08 绑定竞态实测:state 指着镜像副本的闸机,
    插件 QR 恒报「配对创建仅限本机管理员调用」且点开始控制也自愈不了)。"""
    def _probe(tok):
        try:
            req = urllib.request.Request(
                "http://127.0.0.1:%d/browserctl-gate/pair/status?g=__identity_probe__" % int(port),
                headers={"X-BC-Admin": tok} if tok else {})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                if r.status != 200:
                    return False
                body = json.loads(r.read().decode("utf-8", "replace"))
                return isinstance(body, dict) and ("ok" in body or "exists" in body)
        except Exception:
            return False
    if not _probe(admin_token(create=False)):
        return False
    # 反证:错误令牌必须被拒。双 200 = 监听者是反代/宽松服务,不是本副本直连闸机。
    return not _probe("__wrong_token__")


# ---- 闸机心跳（阶段4：时长计量，契约 docs/notes/签到与时长后台增强计划.md §2.5）----
# 由看门狗每 5s 调一次：有活跃会话就累计秒数，每 60s 向服务器 POST 一次，
# 服务器据此扣减该用户余额并记录设备明细。完全静默失败，绝不拖垮闸机主流程。
# ⚠️ 2026-11-07 修复：心跳只能在 fwd 进程(gate_serve)里跑——_sessions 只有 fwd 是活的，
# 看门狗是独立进程、_sessions 恒为空，以前放 watch 里永远算不出 active → 心跳从未发出，
# 服务器既不扣时长、使用统计也恒为 0。现在改由 fwd 的 housekeeping 每 2s 调一次。
_heartbeat_acc = 0.0
_heartbeat_next = 0.0
_heartbeat_last = 0.0  # 上次 tick 的墙钟，用于按真实流逝时间累计

# 逐请求日志（New API 风格）：fwd 进程缓冲，周期批量上报 /api/gate/requests。
_reqlog_lock = threading.Lock()
_reqlog_buf = deque(maxlen=2000)  # 待上报行（新→旧）
_reqlog_last_flush = 0.0
REQLOG_FLUSH_EVERY = 20.0     # 每 20s 上报一批
REQLOG_MAX_BATCH = 300


def _gate_heartbeat_tick():
    global _heartbeat_acc, _heartbeat_next, _heartbeat_last
    try:
        st = read_state()
        port = int(st.get("remote_port") or 0)
        secret = st.get("link_secret")
        # 未配对 / 自建(selfhost)模式没有服务器签发的端口+密钥 → 跳过
        if port <= 0 or not secret:
            _heartbeat_acc = 0.0
            _heartbeat_next = 0.0
            _heartbeat_last = 0.0
            return
        now = time.time()
        # 按真实流逝时间累计：housekeeping 每 2s 调一次 → dt≈2s；挂起/休眠后钳制 30s
        dt = 0.0
        if _heartbeat_last > 0:
            dt = min(max(now - _heartbeat_last, 0.0), 30.0)
        _heartbeat_last = now
        # 10 秒内有过请求的设备算「在用」
        active = False
        devices = []
        with _gate_lock:
            for dev, info in list(_sessions.items()):
                ts = float(info.get("ts") or 0)
                if now - ts <= 10:
                    active = True
                    devices.append({
                        "name": str(info.get("name") or "")[:80],
                        "ip": str(info.get("ip") or "")[:64],
                        "ua": str(info.get("ua") or "")[:200],
                    })
        if active:
            _heartbeat_acc += dt
        if now < _heartbeat_next:
            return
        _heartbeat_next = now + 60
        acc = int(_heartbeat_acc)
        _heartbeat_acc = 0.0
        # 即使 acc==0 也上报：既是保活，也让服务器 verifyGateSecret 自愈端口租约
        payload = json.dumps({
            "port": port,
            "secret": secret,
            "activeSeconds": acc,
            "devices": devices[:20],
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://%s/dsh-remote/api/gate/heartbeat" % public_host(),
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "browserctl-heartbeat/1"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=8) as r:
            r.read()
    except Exception:
        pass


def _reqlog_record(self, t0, is_ws=False):
    """记录一个反代/WS 请求条目到缓冲（fwd 进程内，失败静默）。"""
    try:
        st = gate_state()
        port = int(st.get("remote_port") or 0)
        if port <= 0:
            return
        dev = self._gate_cookie_dev() or ""
        info = None
        if dev:
            with _gate_lock:
                info = _sessions.get(dev)
        ms = int((time.time() - t0) * 1000)
        _kind = str((info or {}).get("kind") or "")
        row = {
            "ts": int(time.time() * 1000),
            "dev": dev[:64],
            "devName": str((info or {}).get("name") or "")[:120],
            "kind": ("ws" if is_ws else (_kind or ""))[:16],
            "ip": (self._client_ip() or "")[:64],
            "method": "WS" if is_ws else (self.command or "").upper()[:12],
            "path": (self.path or "")[:512],
            "status": getattr(self, "_resp_status", 0) or 0,
            "ms": ms,
            "bytes": getattr(self, "_resp_bytes", 0) or 0,
        }
        with _reqlog_lock:
            _reqlog_buf.append(row)
    except Exception:
        pass


def _reqlog_flush_tick():
    """周期触发：每 REQLOG_FLUSH_EVERY 秒把缓冲批量上报。失败回填(有界)，不丢但不无限涨。"""
    global _reqlog_last_flush
    now = time.time()
    if now - _reqlog_last_flush < REQLOG_FLUSH_EVERY:
        return
    _reqlog_last_flush = now
    batch = []   # 先定义:异常发生在取批之前时,except 里的回填不再引用未定义名字
    try:
        st = read_state()
        port = int(st.get("remote_port") or 0)
        secret = st.get("link_secret")
        if port <= 0 or not secret:
            return
        with _reqlog_lock:
            if not _reqlog_buf:
                return
            batch = list(_reqlog_buf)
            _reqlog_buf.clear()
        if not batch:
            return
        payload = json.dumps({
            "port": port,
            "secret": secret,
            "requests": batch[:REQLOG_MAX_BATCH],
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://%s/dsh-remote/api/gate/requests" % public_host(),
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "browserctl-reqlog/1"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=8) as r:
            r.read()
    except Exception:
        # 上报失败：回填（deque 有界，不会无限增长），下个周期重试
        try:
            with _reqlog_lock:
                for r_ in reversed(batch):
                    _reqlog_buf.appendleft(r_)
        except Exception:
            pass


def _gate_balance_allowed():
    """查询服务器余额是否可用(fail-open:任何异常都放行,绝不拖垮闸机)。
    仅在官方模式(有 remote_port+link_secret)下才真正查询;自建模式恒放行。"""
    try:
        st = read_state()
        port = int(st.get("remote_port") or 0)
        secret = st.get("link_secret")
        if port <= 0 or not secret:
            return True
        q = urllib.parse.urlencode({"port": port, "secret": secret})
        req = urllib.request.Request(
            "https://%s/dsh-remote/api/gate/allow?%s" % (public_host(), q),
            headers={"User-Agent": "browserctl-heartbeat/1"},
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=6) as r:
            j = json.loads(r.read().decode("utf-8") or "{}")
        return bool(j.get("allowed", True))
    except Exception:
        return True


def cmd_watch():
    _bc_apply_fwd_port()
    """看门狗:巡检闸机与 frpc,死了就拉起。由 start 以分离进程常驻。
    指数退避:连续拉起失败时 12s→30s→60s→5min→15min,防止崩溃风暴;
    巡检一轮发现一切正常即复位。
    ⚠️ 心跳计量不在本进程跑——_sessions 只有 fwd(gate_serve)是活的,
    心跳/逐请求日志都在 fwd 的 housekeeping 里(见 _gate_heartbeat_tick/_reqlog_flush_tick)。"""
    backoff = [12, 30, 60, 300, 900]
    failures = 0
    # 启动即自报 pid 到 state,避免 ensure_watchdog 因读到旧(已死)pid 反复拉起副本
    # 字段级写:只动 watchdog_pid(kb/06 第 24 条)
    try:
        update_state(lambda s: {**s, "watchdog_pid": os.getpid()})
    except Exception:
        pass
    while True:
        time.sleep(5)
        try:
            st = read_state()
            need = []
            if not _port_open(FWD_PORT):
                need.append("fwd")
            pid = st.get("frpc_pid")
            if not (pid and _pid_alive(pid)):
                need.append("frpc")
            elif not st.get("tunnel_ok"):
                # frpc 活着但状态是「未就绪」(旧版 state 没字段 / 上次判定失败):
                # 回读日志,如果其实已经注册成功(frpc 自己重试成功的情况),立即修正状态,
                # 否则插件会一直显示"隧道未连通"却又不重建。
                txt = _frpc_log_tail(max(0, _frpc_log_size() - 65536))
                want = int(st.get("remote_port") or 0)
                have = _last_success_port(txt)
                if have and want and have != want:
                    # 注册的是旧端口:不算就绪,交给下面的重建(ensure_tunnel 会先杀旧 frpc)
                    need.append("frpc")
                elif _tunnel_log_ready(txt):
                    _mark_tunnel(True, "", want)
                    st = read_state()
            else:
                # tunnel_ok=True 也要校验端口:claim-port 换端口后,残留的旧 frpc 仍注册
                # 旧端口,服务器注册表却是新端口 → 公网 502(state 却显示就绪)。
                want = int(st.get("remote_port") or 0)
                have = _last_success_port(_frpc_log_tail(max(0, _frpc_log_size() - 65536)))
                if have and want and have != want:
                    need.append("frpc")
            if not need:
                failures = 0  # 一切正常,复位退避
                continue
            now = time.time()
            wait = backoff[min(failures, len(backoff) - 1)]
            if now - last_respawn_ok(st) < wait:
                continue
            failures += 1
            if "fwd" in need:
                p = spawn_detached([sys.executable, str(Path(__file__).resolve()), "fwd"], FWD_LOG)
                # 只改 fwd_pid:上面读到的 st 可能已是几秒前的快照,直接 write_state(st)
                # 会把别的进程刚写好的 frpc_pid / tunnel_ok / tunnel_error 覆盖回旧值
                # → 插件又报「frpc 进程未运行」(这是 state 抖动的另一个来源)。
                try:
                    update_state(lambda s: {**s, "fwd_pid": p.pid})
                except Exception as e:
                    # 兜底:update_state 失败(锁异常)时改为"重读最新 state + 字段级写",
                    # 绝不回写旧快照 st(会把 frpc_pid/tunnel_ok 覆盖回过期值);再失败只记日志
                    try:
                        write_state({**read_state(), "fwd_pid": p.pid})
                    except Exception:
                        print("看门狗: fwd_pid 写入失败: %r" % (e,), flush=True)
                print("[%s] 看门狗: 重拉闸机(pid=%d)" % (time.strftime("%H:%M:%S"), p.pid), flush=True)
            if "frpc" in need:
                # 与 cmd_start 串行化:start 刚拉起 frpc 的头一两秒里,state 里可能还是
                # 旧(已死)pid;看门狗若同时再拉一份,两份 frpc 抢同一个 proxy,后一份
                # 永久 "proxy ... already exists" 重试,而 state 指向失败那份 →
                # 隧道其实在服务,插件却间歇报「隧道未建立」。
                # (2026-11-07 实测:10:07:15.576 frpc 注册成功 / 10:07:16.376 看门狗又拉一份)
                lock = None
                try:
                    lock = _ctl_lock(timeout=20)
                except SystemExit:
                    lock = None  # 另一个 start/stop 正在跑,让它自己拉,下一轮再巡检
                if lock:
                    with _ctl_release(lock):
                        st_l = read_state()  # 锁内重读:可能已被别的进程拉好
                        if not (st_l.get("frpc_pid") and _pid_alive(st_l.get("frpc_pid"))):
                            _mark_tunnel(False, "frpc 进程不存在,看门狗正在重拉",
                                         int(st_l.get("remote_port") or 0))
                            try:
                                ensure_tunnel(st_l.get("remote_port", REMOTE_PORT))
                            except SystemExit as e:
                                # 失败原因已经写进 state.tunnel_error,这里只打首行,避免日志刷屏
                                first = (str(e) or "隧道重拉失败").splitlines()[0][:240]
                                print("[%s] 看门狗: 隧道重拉失败: %s" % (time.strftime("%H:%M:%S"), first), flush=True)
                            else:
                                print("[%s] 看门狗: 重拉 frpc" % time.strftime("%H:%M:%S"), flush=True)
            try:
                update_state(lambda s: {**s, "watchdog_pid": os.getpid(),
                                        "watchdog_last_respawn": time.time()})
            except Exception:
                pass
        except Exception as e:
            print("看门狗异常: %r" % e, flush=True)


def last_respawn_ok(st):
    return st.get("watchdog_last_respawn", 0.0)


def ensure_watchdog():
    st = read_state()
    pid = st.get("watchdog_pid")
    if pid and _pid_alive(pid):
        return
    p = spawn_detached([sys.executable, str(Path(__file__).resolve()), "watch"], HERE / "browserctl_watch.log")
    # 关键:把新看门狗 pid 立即写回 state。否则 state 里是旧(已死)pid,
    # 下次 ensure_watchdog 又以为没有看门狗 → 反复拉副本。
    # 只改 watchdog_pid,不要整份 write_state(st):上面读到的 st 是旧快照,
    # 整份写回会把 frpc_pid / tunnel_ok / tunnel_error 一起覆盖成过期值。
    try:
        update_state(lambda s: {**s, "watchdog_pid": p.pid})
    except Exception as e:
        # 兜底同上:重读最新 state 后字段级写,不回写旧快照 st
        try:
            write_state({**read_state(), "watchdog_pid": p.pid})
        except Exception:
            print("看门狗 pid 写入失败: %r" % (e,), flush=True)


def totp_set(enabled, reset=False):
    # 字段级写(kb/06 第 24 条):只动 totp_secret/totp_enabled/gate_kick_seq/
    # gate_kicked_devs 四个键;旧的整份快照回写会覆盖并发写者的其它字段。
    # 密钥生成放进 mutator:若并发已生成过 totp_secret 就不重复造。
    def _mut(s):
        s = dict(s)
        if enabled and (not s.get("totp_secret") or reset):
            s["totp_secret"] = base64.b32encode(os.urandom(20)).decode().rstrip("=")
        if not enabled and reset:
            s.pop("totp_secret", None)
        s["totp_enabled"] = bool(enabled)
        s["gate_kick_seq"] = s.get("gate_kick_seq", 0) + 1  # 踢全部既有会话
        if enabled:
            # 2FA 启用后由动态码把关,清空"2FA 关闭时"的已踢名单,重新开始
            s.pop("gate_kicked_devs", None)
        return s
    st = update_state(_mut)
    _append_event("totp", "2FA %s%s" % ("启用" if enabled else "禁用",
                                        "(重置密钥)" if reset else ""))
    return st


def _unblock_downloaded(path):
    """去掉 Windows 下载锁定(MOTW / Zone.Identifier 数据流)。
    从 zip 或浏览器下载得到的 exe 会带这个数据流,部分机器策略下直接拒绝执行
    (表现为 PermissionError [WinError 5]),启动前静默清掉,失败不报错。"""
    if os.name != "nt":
        return
    try:
        os.remove(str(path) + ":Zone.Identifier")
    except OSError:
        pass


def _spawn_error_help(exe, err):
    """把子进程启动失败翻译成可照做的中文提示(不要把 traceback 甩给用户)。"""
    name = os.path.basename(str(exe)).lower()
    winerr = getattr(err, "winerror", None)
    denied = (winerr == 5) or isinstance(err, PermissionError)
    lines = ["无法启动程序: %s" % exe]
    if denied and "frpc" in name:
        lines += [
            "系统拒绝了执行请求(PermissionError / WinError 5 拒绝访问)。",
            "最常见原因:Windows Defender 把 frpc.exe 判为 PUA:Win32/FRProxy(潜在不受欢迎程序)",
            "并阻止它执行;联想电脑管家 / 火绒 / 360 等杀软也会做同样的事。",
            "此时本地闸机已经起来了,但隧道建不起来,所以手机打开链接会是 502。",
            "",
            "最快办法:双击本目录的 fix-antivirus.bat(推荐),",
            "它会自动解除下载锁定、请求管理员权限、加排除项、并验证 frpc.exe 能否执行;",
            "跑完窗口会停住,任何报错都看得见、可截图反馈。",
            "(右键 fix-antivirus.ps1 →「使用 PowerShell 运行」也行,但个别系统会因执行策略直接闪退)",
            "",
            "手动处理(按顺序):",
            "  1) 管理员 PowerShell 在本目录执行: Get-ChildItem -Recurse | Unblock-File",
            "  2) Windows 安全中心 → 病毒和威胁防护 → 管理设置 → 排除项 → 添加文件夹 → 选本目录",
            "     (若提示被「篡改防护」阻止,就用同样的图形界面路径手动加,或临时关掉篡改防护)",
            "  3) 关键一步:Windows 安全中心 → 应用和浏览器控制 → 基于信誉的保护设置",
            "     →「潜在不受欢迎的应用」→ 关闭(注意:PUA 开着 + MOTW 下载标记才会触发拦截;",
             "     Unblock-File 去掉标记后通常就够,还不行才关 PUA)。",
            "  4) 联想电脑管家 / 火绒 / 360 的排除项与 Defender 相互独立,要各自在它的界面里加本目录",
            "  5) Windows 11 若开启「智能应用控制」,它拦未签名程序,需要关闭",
            "  6) 验证: 在本目录运行  .\\frpc.exe -v   应输出 frpc 版本号",
            "  7) 重新运行: python browserctl.py start",
        ]
    elif denied:
        lines += [
            "系统拒绝了执行请求(PermissionError / WinError 5 拒绝访问),",
            "通常是安全软件拦截或权限不足:把本目录加入杀软排除项后重试。",
        ]
    else:
        lines.append("错误详情: %s" % err)
    lines.append("排查时请在 kit 目录手动运行 python browserctl.py start,错误会直接打印在终端。")
    return "\n".join(lines)


def spawn_detached(args, log_path):
    # 日志 0600:含隧道/错误栈信息,仅当前用户可读
    try:
        if not Path(log_path).exists():
            fd = os.open(str(log_path), os.O_CREAT | os.O_WRONLY | os.O_APPEND, 0o600)
            os.close(fd)
    except OSError:
        pass
    log = open(log_path, "a", encoding="utf-8", buffering=1)
    if os.name == "nt":
        _unblock_downloaded(args[0])
        # DETACHED_PROCESS 无窗口;CREATE_BREAKAWAY_FROM_JOB 跳出宿主作业对象,
        # 否则宿主命令/会话结束时子进程会被连坐杀死(frpc/闸机无故消失的根因)。
        # CREATE_NO_WINDOW 彻底隐藏控制台窗口(仅 Windows)。
        base = (subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
                | subprocess.CREATE_NO_WINDOW)
        # 逐级降级:某些机器(作业对象策略/安全软件/智能应用控制)会拒绝带特定 flag
        # 的 CreateProcess,报 WinError 5。依次退回「不带 breakaway」→「不带任何 flag」,
        # 尽量把进程拉起来,而不是直接抛栈。2026-11-06 同学机器实测踩到过。
        attempts = [base | subprocess.CREATE_BREAKAWAY_FROM_JOB, base, 0]
    else:
        attempts = [0]
    last_err = None
    for idx, creationflags in enumerate(attempts):
        try:
            p = subprocess.Popen(args, stdout=log, stderr=log, creationflags=creationflags,
                                 close_fds=True, cwd=str(HERE))
            if idx > 0:
                print("提示: 已用兼容模式启动(降级 creationflags=%d)" % creationflags)
            return p
        except OSError as e:
            last_err = e
            continue
    msg = _spawn_error_help(args[0], last_err)
    try:
        log.write(msg + "\n")
    except Exception:
        pass
    raise SystemExit(msg)


# ---------------- frpc 隧道 ----------------

def frpc_toml_path():
    return HERE / "browserctl_frpc.toml"


def _frpc_log_tail(offset=0, limit=131072):
    """读 frpc 日志(从 offset 起,最多 limit 字节)。

    只取「本次 frpc 启动之后」写入的内容,用于判断隧道是否真的注册成功。"""
    try:
        with open(FRPC_LOG, "rb") as f:
            f.seek(0, os.SEEK_END)
            end = f.tell()
            start = int(offset or 0)
            if start > end:
                start = end
            if end - start > limit:
                start = end - limit
            f.seek(start)
            return f.read().decode("utf-8", "replace")
    except OSError:
        return ""


def _frpc_log_size():
    try:
        return FRPC_LOG.stat().st_size
    except OSError:
        return 0


def _tunnel_log_ready(text):
    """frpc 日志出现 start proxy success = 远端端口已在 frps 上监听成功。"""
    return "start proxy success" in (text or "")


def _last_success_port(text):
    """取日志里最后一条 start proxy success 对应的远端端口;取不到返回 0。

    为什么必须比对端口:claim-port 会换一个新端口并更新服务器注册表,但本机可能还有
    一条用旧端口注册的 frpc 在跑。此时「日志里有 start proxy success」为真、「进程活着」
    也为真,唯独端口对不上 —— 服务器按新端口转发到 frps 上并不存在的 proxy,手机打开
    仍然 502,而 state 却显示隧道就绪(2026-11-06 实际踩到)。"""
    port = 0
    for line in (text or "").splitlines():
        if "start proxy success" not in line:
            continue
        m = re.search(r"dsh_web_(\d+)", line)
        if m:
            port = int(m.group(1))
    return port


def _mark_tunnel(ok, error="", remote_port=0):
    """把隧道就绪状态写进 state,插件据此决定「能不能出二维码」。

    写 state 失败(ACL/占用)不能连累隧道本身:这里只告警,不抛。"""
    def _mut(st):
        st["tunnel_ok"] = bool(ok)
        st["tunnel_error"] = "" if ok else str(error or "")[:1500]
        st["tunnel_ts"] = time.time()
        if remote_port:
            st["remote_port"] = int(remote_port)
        return st
    try:
        update_state(_mut)
    except Exception as e:  # noqa: BLE001
        print("[警告] 隧道状态写入失败(不影响隧道本身): %r" % e, flush=True)


def _wait_tunnel_ready(offset, timeout=FRPC_READY_TIMEOUT):
    """等 frpc 真正把端口注册到 frps。返回 (ok, 本次新增日志)。

    为什么必须等:frpc 进程起来 ≠ 隧道可用。serverAddr 为空/端口被旧会话占用/token
    失效时 frpc 会一直重试,但 state 里 remote_port 已经有值,插件就会拿这个端口生成
    二维码 —— 手机扫码配对成功、打开面板却 502。这里等不到 "start proxy success"
    就判定失败,把真实原因写进 state.tunnel_error。"""
    deadline = time.time() + max(3, int(timeout))
    seen = ""
    while time.time() < deadline:
        txt = _frpc_log_tail(offset)
        if txt:
            seen = (seen + txt)[-65536:]
        if _tunnel_log_ready(txt):
            return True, seen
        # frpc 已经明确报错:它自己会退避重试,再给 3 秒;仍无成功就判失败
        if ("login to server failed" in txt or "start error" in txt
                or "already exists" in txt):
            time.sleep(3.0)
            txt2 = _frpc_log_tail(offset)
            if txt2:
                seen = (seen + txt2)[-65536:]
            if _tunnel_log_ready(txt2):
                return True, seen
            return False, seen
        time.sleep(0.5)
    return False, seen


def _tunnel_failure_text(log_text, server_host, server_port, remote_port):
    """把 frpc 日志里的失败翻译成用户能照做的中文步骤(面板会原样显示)。"""
    t = log_text or ""
    lines = []
    if "already exists" in t:
        lines += [
            "frps 上端口 %d 已经被一条旧会话占用(frpc 日志: proxy ... already exists)。" % remote_port,
            "常见原因:上一次的 frpc 没被真正杀掉,或同一账号在另一台机器/另一个插件副本上开着隧道。",
            "处理:关掉其它机器/副本的「开始控制」,然后在本机重新点一次「开始控制」;",
            "      仍不行就重启 DSH(插件会重新向服务器申请端口)。",
        ]
    elif "connection write timeout" in t or "connect to server error" in t:
        lines += [
            "frpc 连不上 frps 服务器 %s:%d(走 KCP = UDP,不是 TCP)。" % (server_host, int(server_port)),
            "处理:① 确认本机能访问 %s:%d 的 UDP 出站(公司网/防火墙常拦 UDP);" % (server_host, int(server_port)),
            "      ② 官方模式服务器地址应为 remote.ymzcc.com:17000,自建模式核对 frp_server_host;",
            "      ③ 换手机热点试一次,排除本机网络限制。",
        ]
    elif "login to server failed" in t or "token" in t.lower():
        lines += [
            "frpc 登录 frps 被拒绝(token 不正确或服务端不接受)。",
            "官方模式:在面板退出账号后重新登录,刷新连接凭据;",
            "自建模式:检查 browserctl_secrets.json 里的 FRP token 与 frps.toml 是否一致。",
        ]
    elif "start error" in t:
        lines += [
            "frpc 已连上 frps,但端口 %d 注册失败(日志: start error)。" % remote_port,
            "最常见是端口被同账号的旧会话占用;关掉其它副本后重试,或重启 DSH 重新申请端口。",
        ]
    else:
        lines += [
            "frpc 在 %d 秒内没有把端口 %d 注册到 frps(日志里没有 start proxy success)。"
            % (FRPC_READY_TIMEOUT, remote_port),
        ]
    tail = "\n".join((t or "").strip().splitlines()[-8:])
    if tail:
        lines += ["", "frpc 日志尾部:", tail]
    lines += ["", "完整日志: %s" % FRPC_LOG]
    return "\n".join(lines)


def ensure_tunnel(remote_port=REMOTE_PORT):
    sec = load_secrets()
    if not sec.get("frp_token"):
        if sec.get("server_mode") == "official":
            raise SystemExit("尚未开通官方服务:请在插件「配置」面板注册/登录官方账号,\n"
                             "登录后会自动下发连接凭据与专属端口。")
        raise SystemExit("缺少 FRP 认证 Token:先运行 python browserctl.py secrets init\n"
                         "或设置环境变量 BROWSERCTL_FRP_TOKEN")
    # 远端端口:官方模式必须用服务器登录时分配的专属端口(frp_remote_port),
    # 绝不能回退到种子端口 17901 —— 那会让所有用户挤在作者机器同一端口。
    # 自建模式保持原行为:配置面板填写的 frp_remote_port 优先,否则沿用传入/默认值。
    if sec.get("server_mode") == "official":
        remote_port = int(sec.get("frp_remote_port") or 0)
        if remote_port <= 0:
            raise SystemExit("尚未分配专属端口:请先在插件「配置」面板登录官方账号,\n"
                             "登录后服务器会自动分配专属端口并重建隧道。")
    else:
        remote_port = int(sec.get("frp_remote_port") or remote_port or REMOTE_PORT)
    # 服务器地址/端口/token 由 load_secrets 按 server_mode 决定:
    #   selfhost → frp_server_host(或 ssh_host);其它(官方/未设置)→ frp_server_host
    #   → ssh_host → 官方域名。
    # 关键:绝不能因为「SSH 主机为空」就把 serverAddr 写成空串 —— 开源镜像里 ssh_host
    # 按脱敏约定为空,空 serverAddr 会让 frpc 永远 "connection write timeout",隧道起不来,
    # 手机扫码后打开面板就是 502(这条是 2026-11-06 实际踩到的坑)。
    if sec.get("server_mode") == "selfhost":
        server_host = (sec.get("frp_server_host") or sec.get("ssh_host") or "").strip()
        if not server_host:
            raise SystemExit("自建模式缺少 FRP 服务器地址:先运行 python browserctl.py secrets init\n"
                             "或设置环境变量 BROWSERCTL_FRP_HOST,或在 browserctl_secrets.json 里填 frp_server_host")
    else:
        server_host = (sec.get("frp_server_host") or sec.get("ssh_host") or OFFICIAL_FRP_HOST).strip()
        if not server_host:
            server_host = OFFICIAL_FRP_HOST
    server_port = int(sec.get("frp_server_port") or OFFICIAL_FRP_PORT)
    # 防呆(2026-11-07 实测):服务端端口池曾把 frps 自己的监听端口(17000)当普通端口分配给用户,
    # 于是这里的 remotePort 和 serverPort 相等 → frpc 连上 frps 后必然报 `port unavailable`,
    # 日志里只有一句 start error,插件表现是"一直启动失败/隧道未就绪",极难排查。
    # 与其生成一份注定起不来的配置,不如直接报清楚原因(服务端已修:allocatePort 跳过服务保留段)。
    if remote_port == server_port:
        raise SystemExit(
            "端口配置异常:申请到的远程端口(%d)与 frps 服务端口相同,frpc 无法注册。\n"
            "请到插件「配置」面板重新登录官方账号以重新申请端口;\n"
            "若反复出现,说明服务端端口池把「服务保留段」也发出去了,需要更新服务端。" % remote_port)
    server_token = sec.get("frp_token")
    # TOML 基本字符串只要求转义 反斜杠 和 引号;官方 token 是安全字符集,
    # 自建用户自填 token 若含 " 或 \,不转义会生成非法 toml(frpc 直接解析失败)。
    _toml_token = str(server_token).replace("\\", "\\\\").replace('"', '\\"')
    toml = frpc_toml_path()
    toml.write_text(
        'serverAddr = "%s"\n'
        'serverPort = %d\n'
        'auth.method = "token"\n'
        'auth.token = "%s"\n'
        'user = "browserctl"\n'
        # 默认 true:登录失败一次就直接退出,只能等看门狗隔十几秒重拉(日志里
        # "no additional retries will be attempted")。改成 false 让 frpc 自己退避重试,
        # 服务器偶发拒连时隧道能自愈,不会整条消失。
        'loginFailExit = false\n'
        # 走 KCP(UDP)而不是默认的 TCP:本机到服务器这条链路实测丢包 6.7%、RTT 42-55 ms
        # 且偶发 1 s 尖峰,TCP 上 yamux 单条复用连接的吞吐被压到 37-59 KB/s。
        # 同一 2 MB 文件经隧道实测:TCP 203-237 KB/s,KCP 576-601 KB/s(约 2.5 倍)。
        # frps 侧 kcpBindPort 已监听 17000(UDP),无需改服务器。
        'transport.protocol = "kcp"\n'
        'transport.tls.enable = true\n'
        # 默认 tcpMux=true:所有请求(含 SSE 长连接)挤在一条 TCP 上,一个丢包/一次
        # 卡顿会同时掐住整页的请求。实测该复用连接只有 ~56 KB/s,而同机 SSH 单流能到
        # ~205 KB/s。但 frp 要求两端 tcpMux 一致,服务端是默认 true,客户端改成 false
        # 会直接登录失败(EOF);所以改用 poolCount:预先建多条复用连接,把流分散到
        # 不同 TCP 上,效果接近"隔离队头阻塞"而无需动服务器。4→8:冷加载 6+ 并发资源
        # + SSE 长连接 + WS 中继挤 4 条仍有残余排队;KCP 连接很便宜(UDP 无握手),翻倍无副作用。
        'transport.poolCount = 8\n'
        'transport.heartbeatInterval = 10\n'
        'transport.heartbeatTimeout = 30\n'
        'log.to = "console"\n'
        'log.level = "info"\n'
        'log.disablePrintColor = true\n'
        '\n'
        '[[proxies]]\n'
        'name = "browserctl.dsh_web_%d"\n'
        'type = "tcp"\n'
        'localIP = "127.0.0.1"\n'
        'localPort = %d\n'
        'remotePort = %d\n' % (server_host, server_port, _toml_token,
                               remote_port, FWD_PORT, remote_port),
        encoding="utf-8",
    )
    harden_file_perms(toml)  # 含认证 token,仅当前用户可读
    state = read_state()
    pid = state.get("frpc_pid")
    if pid and _pid_alive(pid):
        # 已在运行:回读日志确认它真的注册成功过(进程活着不代表隧道可用)
        recent = _frpc_log_tail(max(0, _frpc_log_size() - 65536))
        running_port = _last_success_port(recent)
        if running_port and int(remote_port) > 0 and running_port != int(remote_port):
            # 端口对不上比"没起来"更隐蔽:claim-port 换了端口(服务器注册表已更新),而这条
            # frpc 注册的还是旧端口 → 公网按新端口转发到 frps 上不存在的 proxy → 502。
            # 唯一正确做法是杀掉旧 frpc,按新配置重新拉起。
            print("[提示] 正在运行的 frpc 隧道端口是 %d,与期望端口 %d 不一致,重启 frpc"
                  % (running_port, int(remote_port)), flush=True)
            try:
                _run_hidden(["taskkill", "/PID", str(pid), "/T", "/F"],
                            capture_output=True, text=True, timeout=15)
            except Exception as e:  # noqa: BLE001
                print("[警告] 结束旧 frpc(pid=%d)失败: %r" % (pid, e), flush=True)
            for _ in range(40):
                if not _pid_alive(pid):
                    break
                time.sleep(0.15)
            _mark_tunnel(False, "隧道端口已变更(%d → %d),正在按新端口重启 frpc"
                         % (running_port, int(remote_port)), int(remote_port))
            pid = 0
        elif _tunnel_log_ready(recent):
            _mark_tunnel(True, "", remote_port)
            print("frpc 已在运行(pid=%d) → 远端端口 %d" % (pid, remote_port))
            return remote_port
        else:
            err = ("frpc 进程在运行(pid=%d),但日志里没有 start proxy success,隧道可能没连上;\n"
                   "先执行 python browserctl.py stop 再 start,或查看 %s") % (pid, FRPC_LOG)
            _mark_tunnel(False, err, remote_port)
            raise SystemExit(err)
    if not FRPC.exists():
        raise SystemExit("未找到 frpc.exe: %s" % FRPC)
    offset = _frpc_log_size()
    _mark_tunnel(False, "frpc 正在启动,等待端口注册到 frps…", remote_port)
    p = spawn_detached([str(FRPC), "-c", str(toml)], FRPC_LOG)
    # 关键:新 frpc 的 pid 必须**立刻**落盘,不能等下面 sleep(1s) 之后再写。
    # 否则这 1 秒里 state 里还是旧(已死)pid,看门狗巡检读到就以为 frpc 死了、又拉一份
    # → 两份 frpc 抢同一个 proxy,后拉的那份永久 "proxy ... already exists" 重试,
    # 而 state 指向失败那份 → 隧道其实在服务,插件却间歇报「隧道未建立」。
    # (2026-11-07 实测时间线:10:07:15.576 frpc 注册成功 / 10:07:16.376 看门狗又拉一份)
    # 用 update_state 而不是 write_state(state):避免把几秒前的旧快照整体写回,覆盖掉
    # 闸机/看门狗/插件刚写进去的字段。
    try:
        update_state(lambda s: {**s, "frpc_pid": p.pid, "remote_port": int(remote_port)})
    except Exception as e:
        print("[警告] state 写入失败(隧道本身不受影响): %r" % e, flush=True)
    time.sleep(1.0)
    if p.poll() is not None:
        raise SystemExit("frpc 启动失败,详见 %s" % FRPC_LOG)
    ok, log_text = _wait_tunnel_ready(offset)
    if not ok:
        # 自愈:刚拉起的这份 frpc 报 "already exists",且日志里最后的 start proxy success
        # 正是目标端口 → 端口已经被**另一份活着的 frpc** 抢注成功,我们这份是重复进程。
        # 杀掉重复的、把 state 指向真正在服务的那份、判隧道就绪 ——
        # 用户不必再点一次「开始控制」,隧道也不会因为一次竞态就"假死"。
        want = int(remote_port or 0)
        tail_all = _frpc_log_tail(max(0, _frpc_log_size() - 65536))
        if "already exists" in (log_text or "") and want > 0 and _last_success_port(tail_all) == want:
            keep = 0
            try:
                st_now = read_state()
                cand = int(st_now.get("frpc_pid") or 0)
                if cand and cand != p.pid and _pid_alive(cand):
                    keep = cand
            except Exception:
                keep = 0
            if not keep:
                for cand in _live_frpc_pids():
                    if cand != p.pid:
                        keep = cand
                        break
            if keep:
                # 定位到真正在服务的那一份:杀掉重复的,把 state 的 pid 还给它
                try:
                    _run_hidden(["taskkill", "/PID", str(p.pid), "/T", "/F"],
                                capture_output=True, timeout=15)
                except Exception:
                    pass
                try:
                    update_state(lambda s: {**s, "frpc_pid": keep, "remote_port": want})
                except Exception:
                    pass
                print("frpc 已在运行(pid=%d) → 远端端口 %d(已清理重复进程 pid=%d)"
                      % (keep, want, p.pid), flush=True)
            else:
                # 定位不到另一份:绝不能动 p。它还活着、state 也指向它,杀掉反而会触发
                # 「看门狗重拉 → 又抢不到 → 再杀」的循环;而目标端口已被注册成功,隧道可用。
                print("frpc 端口 %d 已由另一份进程注册成功(未能定位其 pid),按就绪处理" % want, flush=True)
            _mark_tunnel(True, "", remote_port)
            return remote_port
        err = _tunnel_failure_text(log_text, server_host, server_port, remote_port)
        _mark_tunnel(False, err, remote_port)
        # 不 kill frpc:它会自己退避重试,看门狗也会继续检查,端口恢复后隧道能自愈。
        # 这里只把「未就绪 + 原因」如实抛给调用方(插件据此不出二维码 / 显示原因)。
        raise SystemExit("隧道没有连通:\n" + err)
    _mark_tunnel(True, "", remote_port)
    print("frpc 已启动(pid=%d) → 远端端口 %d 已注册到 frps" % (p.pid, remote_port))
    return remote_port


def _pid_alive(pid):
    try:
        out = _run_hidden(["tasklist", "/FI", "PID eq %d" % pid, "/FO", "CSV", "/NH"],
                          capture_output=True, text=True, timeout=10).stdout
        # 中文 Windows 输出 "信息: 没有运行的任务...";直接看 PID 是否出现在 CSV 行里
        return ('"%d"' % pid) in out
    except Exception:
        return False


def _live_frpc_pids():
    """列出所有存活的 frpc.exe 进程 pid。

    只在「竞态里起了重复 frpc」的自愈路径用:需要找出真正在服务的那一份。
    只按进程名筛(不看命令行)—— 提权进程的 CommandLine 常读不到,但 Name 能看到。
    取不到就返回空列表,调用方必须有兜底(绝不因为这里失败而阻断隧道)。
    """
    if os.name != "nt":
        return []
    try:
        ps = ("Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'frpc.exe' } "
              "| ForEach-Object { $_.ProcessId }")
        out = _run_hidden(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
                          capture_output=True, text=True, timeout=20).stdout
        return [int(x) for x in (out or "").split() if x.strip().isdigit()]
    except Exception:
        return []


def _fwd_move_port(reason):
    """本副本闸机换下一个空闲端口,并把 state.fwd_port 字段级写回。

    双副本并存时 3080 可能被正式版闸机(硬编码 3080)占着:本副本必须挪走,
    绝不跟它抢、更不能把它的闸机当成自己的。插件 gatePort()/win_push.py 都读
    state.fwd_port,这里落盘后整条链路自动跟随。"""
    global FWD_PORT
    new_port = _pick_free_port(FWD_PORT)
    print("[提示] %s,本副本闸机改用端口 %d" % (reason, new_port), flush=True)
    FWD_PORT = new_port
    os.environ["BC_FWD_PORT"] = str(new_port)
    # 字段级写:只落 fwd_port(kb/06 第 24 条),不回写旧快照
    try:
        update_state(lambda s: {**s, "fwd_port": new_port})
    except Exception as e:
        print("[警告] fwd_port 写回失败: %r" % e, flush=True)
    return new_port


def ensure_forwarder():
    global FWD_PORT
    # 已有转发器(pid 存活)则复用;避免仅凭端口误判(旧进程被杀后端口短暂未释放)
    state = read_state()
    pid = state.get("fwd_pid")
    if pid and _pid_alive(pid):
        print("本地转发器已在运行(pid=%d)" % pid)
        return
    # (2026-11-08 双副本并存)pid 没了但端口开着:先验明监听者身份——只有「本副本
    # 的闸机」(管理令牌同一目录)才直接接管(pid 记账丢了但闸机还活着);别人的
    # 监听者走下面的换端口。以前这里只看端口,曾把镜像副本的闸机当成自己的
    # 转发器:pid 50568 早死了、3080 上跑的是别人,配对/踢人全打到别人闸机。
    if _port_open(FWD_PORT) and _gate_is_ours(FWD_PORT):
        print("本地闸机已在运行(端口 %d,pid 记录丢失,复用)" % FWD_PORT)
        return
    # 端口被占但 fwd_pid 已死:旧进程刚被杀,等端口释放(最多 ~3s)再接管
    for _ in range(10):
        if not _port_open(FWD_PORT):
            break
        time.sleep(0.3)
    if _port_open(FWD_PORT):
        # 等满 3s 还开着 = 不是我们刚杀的旧进程(另一份插件的闸机/随机程序在听)。
        # 换下一个空闲端口继续,而不是报「稍后重试」——别人不腾端口,重试永远失败。
        _fwd_move_port("端口 %d 被其它程序/另一份插件的闸机占用" % FWD_PORT)
    p = spawn_detached([sys.executable, str(Path(__file__).resolve()), "fwd"], FWD_LOG)
    # 探活:冷启动(首次 import / 杀软扫描)可能偏慢,重试最多 ~10s,不依赖单次窗口。
    # (2026-11-08)「端口通了」不再直接算成功:绑定竞态下可能是别人抢走了刚挑好的
    # 端口(2026-11-08 实测:本副本 fwd 与镜像 fwd 同秒启动,镜像抢到 3080,本副本
    # 子进程「闸机端口已被在运行实例占用,本副本退出」,而这里只看端口照样报
    # 「本地转发器已启动」)——必须带本副本令牌验明监听者,失败就换端口重来。
    ok = False
    for _ in range(16):
        time.sleep(0.6)
        if not _port_open(FWD_PORT):
            continue
        if _gate_is_ours(FWD_PORT):
            ok = True
            break
        # 端口通了但监听者不是本副本:绑定竞态输了,换下一个空闲端口再拉一份
        _fwd_move_port("端口 %d 被其它进程抢先绑定(绑定竞态)" % FWD_PORT)
        p = spawn_detached([sys.executable, str(Path(__file__).resolve()), "fwd"], FWD_LOG)
    if not ok:
        raise SystemExit("转发器启动失败,详见 %s" % FWD_LOG)
    print("本地转发器已启动(pid=%d)" % p.pid)
    # 字段级写:只落 fwd_pid(kb/06 第 24 条),不回写旧快照
    update_state(lambda s: {**s, "fwd_pid": p.pid})


# ---------------- 服务器端 ----------------

def _ssh(auto_trust=False):
    """SSH 连接:默认拒绝未知主机密钥(防 MITM),首次用 ssh-trust 固定指纹;
    优先密钥认证(secrets.ssh_key),否则密码(secrets.ssh_password / 环境变量)。"""
    import paramiko
    sec = load_secrets()
    if not sec["ssh_host"] or not sec["ssh_user"]:
        raise SystemExit("缺少 SSH 配置;先运行 python browserctl.py secrets init")
    s = paramiko.SSHClient()
    s.load_system_host_keys()
    if KNOWN_HOSTS.exists():
        s.load_host_keys(str(KNOWN_HOSTS))
    if auto_trust:
        s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    else:
        s.set_missing_host_key_policy(paramiko.RejectPolicy())
    kwargs = dict(timeout=15, allow_agent=True, look_for_keys=True)
    if sec["ssh_key"]:
        kwargs["key_filename"] = os.path.expanduser(sec["ssh_key"])
        kwargs["look_for_keys"] = False
        kwargs["allow_agent"] = False
    elif sec["ssh_password"]:
        kwargs["password"] = sec["ssh_password"]
    else:
        kwargs["look_for_keys"] = True
    try:
        s.connect(sec["ssh_host"], 22, sec["ssh_user"], **kwargs)
    except paramiko.BadHostKeyException as e:
        raise SystemExit("SSH 主机密钥不匹配(疑似 MITM 或服务器重装):%s\n"
                         "确认服务器身份后删除 %s 并重新执行 ssh-trust" % (e, KNOWN_HOSTS))
    except paramiko.SSHException as e:
        if "not found in known_hosts" in str(e):
            raise SystemExit("服务器主机密钥未固定(防 MITM)。先运行:\n"
                             "  python browserctl.py ssh-trust")
        raise
    if auto_trust:
        try:
            key = s.get_transport().get_remote_server_key()
            KNOWN_HOSTS.write_text("%s %s %s\n" % (sec["ssh_host"], key.get_name(), key.get_base64()),
                                   encoding="utf-8")
            harden_file_perms(KNOWN_HOSTS)
        except Exception:
            pass
    return s


def cmd_ssh_trust():
    """首次信任服务器主机密钥:连接并打印指纹供人工核对,然后写入 .ssh_known_hosts。"""
    import paramiko
    sec = load_secrets()
    t = paramiko.Transport((sec["ssh_host"], 22))
    t.start_client(timeout=15)
    key = t.get_remote_server_key()
    fp = hashlib.sha256(key.asbytes()).hexdigest()
    print("服务器: %s" % sec["ssh_host"])
    print("密钥类型: %s" % key.get_name())
    print("SHA256 指纹: %s" % fp)
    print("→ 请与服务器 `ssh-keygen -lf /etc/ssh/ssh_host_*_key.pub` 输出核对后再继续。")
    if input("指纹一致请输入 yes 继续: ").strip().lower() != "yes":
        raise SystemExit("已取消")
    KNOWN_HOSTS.write_text("%s %s %s\n" % (sec["ssh_host"], key.get_name(), key.get_base64()),
                           encoding="utf-8")
    harden_file_perms(KNOWN_HOSTS)
    print("已固定到 %s" % KNOWN_HOSTS)
    t.close()


def cmd_secrets_init():
    """交互式生成 browserctl_secrets.json(0600, 已 gitignore)。"""
    cur = load_secrets()
    print("配置 SSH 与 FRP 凭据(回车保留当前值;输入 - 清空)。")
    def ask(label, key, secret=False):
        val = input("%s: " % label)
        if not val:
            return cur.get(key, "")
        return "" if val == "-" else val
    ssh_host = ask("SSH 主机 [%s]" % cur["ssh_host"], "ssh_host")
    ssh_user = ask("SSH 用户 [%s]" % cur["ssh_user"], "ssh_user")
    ssh_key = ask("SSH 私钥路径(推荐,留空则用密码)[%s]" % (cur["ssh_key"] or "无"), "ssh_key")
    ssh_password = "" if ssh_key else ask("SSH 密码(建议改用密钥)", "ssh_password", True)
    frp_token = ask("FRP 认证 Token", "frp_token", True)
    data = {
        "ssh_host": ssh_host or "",
        "ssh_user": ssh_user or "root",
        "ssh_password": ssh_password,
        "ssh_key": ssh_key,
        "frp_token": frp_token,
        "frp_server_port": cur.get("frp_server_port", 17000),
    }
    SECRETS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    harden_file_perms(SECRETS_FILE)
    print("已写入 %s(权限已收紧为仅当前用户)" % SECRETS_FILE)


def _run(s, cmd):
    _, o, e = s.exec_command(cmd)
    out, err = o.read().decode("utf-8", "replace"), e.read().decode("utf-8", "replace")
    code = o.channel.recv_exit_status()
    return code, out, err


# 必须落在容器可见的挂载点里(宿主机挂载目录 => 容器路径)。
# 之前放 /opt/frp,容器内根本看不到 -> Lua 的注册表校验被静默跳过。
DEVICE_REGISTRY_PATH = os.environ.get("BC_DEVICE_REGISTRY_PATH") or "/www/dsh/device_registry.json"
DEVICE_REGISTRY_DIR = os.environ.get("BC_DEVICE_REGISTRY_DIR") or "/www/dsh"
LEGACY_REGISTRY_PATH = "/opt/frp/device_registry.json"


def _server_read_registry():
    """SSH 读取服务端设备注册表。
    官方模式/SSH 不可用时返回空字典,不抛异常(防止配对请求静默死亡→502)。"""
    try:
        s = _ssh()
    except BaseException:
        return {}
    try:
        code, out, _ = _run(s, "cat %s 2>/dev/null || echo '{}'" % DEVICE_REGISTRY_PATH)
        return json.loads(out) if code == 0 else {}
    except BaseException as e:
        print("[gate] 服务端注册表读取失败: %s" % e, flush=True)
        return {}
    finally:
        try:
            s.close()
        except BaseException:
            pass


def _server_write_registry(registry):
    """SSH 写入服务端设备注册表。返回 True=确实写成功,False=静默失败。

    目录先 mkdir -p;权限 644(容器内 worker 需要能读,文件不在站点根目录下)。
    """
    try:
        s = _ssh()
    except BaseException:
        return False
    okay = False
    try:
        data = json.dumps(registry, ensure_ascii=False, indent=2)
        _run(s, "mkdir -p %s" % DEVICE_REGISTRY_DIR)
        sftp = s.open_sftp()
        with sftp.open(DEVICE_REGISTRY_PATH, "w") as f:
            f.write(data)
        _run(s, "chmod 644 %s" % DEVICE_REGISTRY_PATH)
        okay = True
    except BaseException as e:
        print("[gate] 服务端注册表写入失败: %s" % e, flush=True)
    finally:
        try:
            s.close()
        except BaseException:
            pass
    return okay


def _server_migrate_registry():
    """把旧路径(/opt/frp,容器不可见)的注册表搬到挂载点;幂等。"""
    s = _ssh()
    try:
        _run(s, "mkdir -p %s" % DEVICE_REGISTRY_DIR)
        code, _, _ = _run(s, "test -s %s" % DEVICE_REGISTRY_PATH)
        if code == 0:
            return False
        code, _, _ = _run(s, "test -s %s" % LEGACY_REGISTRY_PATH)
        if code != 0:
            _run(s, "printf '{}' > %s" % DEVICE_REGISTRY_PATH)
            _run(s, "chmod 644 %s" % DEVICE_REGISTRY_PATH)
            return False
        _run(s, "cp %s %s" % (LEGACY_REGISTRY_PATH, DEVICE_REGISTRY_PATH))
        _run(s, "chmod 644 %s" % DEVICE_REGISTRY_PATH)
        return True
    finally:
        s.close()


def _srv_registry_enabled():
    """服务端设备注册表只在自建模式有意义(它靠 SSH 直接改服务器上的 registry.json)。

    官方托管模式下用户没有服务器 SSH 凭据,这一步必然失败,而且 _ssh() 在主机密钥
    未固定时会抛 SystemExit(BaseException),曾经穿透 except Exception 把处理线程
    静默杀死 → 公网 502 socket hang up,手机端表现为"配对已失效或未授权"。
    直接跳过既避免这个坑,也省掉每次配对白等 0.5–15 秒的 SSH 超时。"""
    try:
        return load_secrets().get("server_mode") == "selfhost"
    except BaseException:
        return False


def _server_register_device(dev, name, ip, ua):
    """向服务端注册表添加/更新设备。失败静默,不抛异常。
    只有真正写成功才打印成功行——以前无论成败都打"服务端注册设备",
    日志会显示配对成功,而实际上服务器注册表里什么都没有。"""
    if not _srv_registry_enabled():
        return False
    try:
        reg = _server_read_registry()
        reg[dev] = {"name": name, "ip": str(ip)[:39],
                     "ua": (ua or "")[:60], "paired_at": time.time(),
                     "revoked": False}
        if _server_write_registry(reg):
            print("[gate] 服务端注册设备 %s (%s)" % (dev, name), flush=True)
            return True
        return False
    except BaseException as e:
        print("[gate] 服务端注册失败(可能 SSH 未连通): %s" % e, flush=True)
        return False


def _server_unregister_device(dev):
    """从服务端注册表删除设备。失败静默,不抛异常。"""
    if not _srv_registry_enabled():
        return
    try:
        reg = _server_read_registry()
        if dev in reg:
            del reg[dev]
            _server_write_registry(reg)
            print("[gate] 服务端删除设备 %s" % dev, flush=True)
    except BaseException as e:
        print("[gate] 服务端删除失败: %s" % e, flush=True)


def nginx_install(remote_port=REMOTE_PORT):
    s = _ssh()
    try:
        code, conf, _ = _run(s, "cat %s" % SERVER_CONF)
        if code != 0:
            raise SystemExit("读取服务器 Nginx 配置失败")
        marker_begin = "# === [DSH 浏览器控制]"
        marker_end = "# === [/DSH 浏览器控制] ==="
        # 链接密钥嵌进 nginx 块用于验签(服务端必须持有对称密钥;这是 C-05 的暴露面之一,
        # 轮换 link_secret 后要重跑本命令)
        state = read_state()
        secret = state.get("link_secret")
        if not secret:
            secret = os.urandom(16).hex()
            # 字段级写:只落 link_secret,避免整份快照回写覆盖其它字段(kb/06 第 24 条)
            update_state(lambda s: {**s, "link_secret": secret})
        block = build_nginx_block(remote_port, secret)
        # 优先"就地替换":定位旧块的起止标记,在它原来的位置放回新块。
        # 不要依赖通用 /p/ 正则的字面量(服务器上端口范围已被扩写成
        # 17[6-9]xxx|18[0-9]xxx,写死锚点会静默失配)。
        insert_at = None
        pos = conf.find(marker_begin)
        if pos >= 0:
            line_start = conf.rfind("\n", 0, pos) + 1
            epos = conf.find(marker_end, pos)
            if epos < 0:
                raise SystemExit("DSH 块标记不配对(缺结束标记),请人工检查服务器配置")
            eol = conf.find("\n", epos)
            eol = len(conf) if eol < 0 else eol + 1
            insert_at = line_start
            conf = conf[:line_start] + conf[eol:]      # 先删旧块(插入点之前的偏移不变)
        if insert_at is None:
            # 首次安装:插到通用 /p/ 正则之前(排除 ^/p/17901( 这类写死端口的 location)
            m = re.search(r"(?m)^([ \t]*)location ~ \^/p/\((?![0-9]{5}\))[^)]*\)\(/\.\*\)\?[ \t]*\{",
                          conf)
            if not m:
                raise SystemExit("未找到通用 /p/ 正则锚点,服务器配置可能已变化")
            insert_at = m.start()
        conf = conf[:insert_at] + block + conf[insert_at:]
        # 注册表搬到容器可见路径,新 Lua 才能读到吊销名单(失败不阻断部署)
        try:
            if _server_migrate_registry():
                print("已迁移设备注册表到容器可见路径")
        except Exception as e:
            print("设备注册表迁移失败(不影响门禁,签名校验仍生效): %s" % e)
        _run(s, "cp %s %s.bak.browserctl" % (SERVER_CONF, SERVER_CONF))
        sftp = s.open_sftp()
        with sftp.open(SERVER_CONF, "w") as f:
            f.write(conf)
        code, out, err = _run(s, "docker exec %s nginx -t" % OPENRESTY)
        if code != 0:
            _run(s, "cp %s.bak.browserctl %s" % (SERVER_CONF, SERVER_CONF))
            raise SystemExit("nginx -t 失败,已回滚:\n%s%s" % (out, err))
        _run(s, "docker exec %s nginx -s reload" % OPENRESTY)
        print("Nginx 已更新并重载(端口 %d,密钥链接鉴权)" % remote_port)
    finally:
        s.close()


def build_nginx_block(remote_port, secret):
    secret_esc = secret.replace("\\", "\\\\").replace("\"", "\\\"")
    return (
        "    # === [DSH 浏览器控制] 密钥链接块 (browserctl.py 自动生成) ===\n"
        "    # /p/{port}/ 服务端门禁:bc-gate Cookie 的 HMAC-SHA256 签名 + 有效期 + 吊销名单\n"
        "    # 容器内没有 resty.openssl,所以用 resty.sha256 手写 HMAC;缺依赖一律 fail-closed。\n"
        "    location ~ ^/p/%d(/.*)?$ {\n"
        "        set $bc_secret \"%s\";\n"
        "        set $p_port %d;\n"
        "        set $p_path $1;\n"
        "        if ($p_path = \"\") {\n"
        "            set $p_path \"/\";\n"
        "        }\n"
        "        access_by_lua_block {\n"
        "            local uri = ngx.var.uri or \"\"\n"
        "            -- 闸机端点(配对/claim/bootstrap)有自身鉴权,交给它们自己判\n"
        "            if uri:find(\"/browserctl-gate/\", 1, true) then return end\n"
        "            local function deny(why)\n"
        "                ngx.log(ngx.WARN, \"browserctl deny: \", why, \" uri=\", uri)\n"
        "                ngx.exit(403)\n"
        "            end\n"
        "            -- 1) 取 bc-gate Cookie\n"
        "            --    ⚠️ 边界很重要:边缘只拦「签名伪造 / 已被吊销」。\n"
        "            --    无 Cookie、格式不认识、已过期 一律放行给闸机 —— 闸机自己会出\n"
        "            --    2FA 登录页,这是 Cookie 过期后唯一的自助恢复路径;边缘一旦\n"
        "            --    403 掉,用户就只能回电脑前重新生成引导链接才能进门。\n"
        "            local ck = ngx.var.http_cookie or \"\"\n"
        "            -- 同名多值时取「最后一段」:Chromium 同路径 cookie 按创建时间升序发送,\n"
        "            -- 最后出现的值最新;与闸机 _gate_cookie_raw 的 newest-valid-wins 对齐。\n"
        "            -- (kb/06 第 25 条:取首段会在 App WebView 双 bc-gate 场景拿旧值)\n"
        "            local bc = nil\n"
        "            for seg in ck:gmatch(\"bc%%-gate=([^;]+)\") do bc = seg end\n"
        "            if not bc then return end\n"
        "            -- 2) 拆分 v1.{body_b64url}.{sig_b64url}\n"
        "            local dot1 = bc:find(\".\", 1, true)\n"
        "            local dot2 = dot1 and bc:find(\".\", dot1 + 1, true)\n"
        "            if not dot1 or not dot2 then return end\n"
        "            local ver = bc:sub(1, dot1 - 1)\n"
        "            local body_b64 = bc:sub(dot1 + 1, dot2 - 1)\n"
        "            local sig_b64 = bc:sub(dot2 + 1)\n"
        "            if ver ~= \"v1\" or body_b64 == \"\" or sig_b64 == \"\" then return end\n"
        "            -- 3) HMAC-SHA256(secret, body_b64) -> base64url,与 Python 侧 gate_mint_cookie 一致\n"
        "            local ok_sha, sha256 = pcall(require, \"resty.sha256\")\n"
        "            local bit = _G.bit\n"
        "            if not ok_sha or not bit then\n"
        "                ngx.log(ngx.ERR, \"browserctl: resty.sha256/bit 缺失,拒绝请求(fail-closed)\")\n"
        "                ngx.exit(403) return\n"
        "            end\n"
        "            local function sha256_raw(s)\n"
        "                local h = sha256:new()\n"
        "                h:update(s)\n"
        "                return h:final()\n"
        "            end\n"
        "            local function b64url(raw)\n"
        "                local s = ngx.encode_base64(raw)\n"
        "                s = s:gsub(\"+\", \"-\"):gsub(\"/\", \"_\"):gsub(\"=\", \"\")\n"
        "                return s\n"
        "            end\n"
        "            local function hmac_sha256(key, msg)\n"
        "                local bs = 64\n"
        "                if #key > bs then key = sha256_raw(key) end\n"
        "                if #key < bs then key = key .. string.rep(\"\\0\", bs - #key) end\n"
        "                local ipad, opad = {}, {}\n"
        "                for i = 1, bs do\n"
        "                    local b = key:byte(i)\n"
        "                    ipad[i] = string.char(bit.bxor(b, 0x36))\n"
        "                    opad[i] = string.char(bit.bxor(b, 0x5c))\n"
        "                end\n"
        "                local inner = sha256_raw(table.concat(ipad) .. msg)\n"
        "                return sha256_raw(table.concat(opad) .. inner)\n"
        "            end\n"
        "            local secret = ngx.var.bc_secret or \"\"\n"
        "            if secret == \"\" then deny(\"nosecret\") return end\n"
        "            local expect = b64url(hmac_sha256(secret, body_b64))\n"
        "            if #expect ~= #sig_b64 then deny(\"siglen\") return end\n"
        "            local diff = 0\n"
        "            for i = 1, #expect do\n"
        "                if expect:byte(i) ~= sig_b64:byte(i) then diff = diff + 1 end\n"
        "            end\n"
        "            if diff ~= 0 then deny(\"sig\") return end\n"
        "            -- 4) 解码 payload(Python 侧是 urlsafe base64,需先转标准表再补 padding)\n"
        "            local std = body_b64:gsub(\"-\", \"+\"):gsub(\"_\", \"/\")\n"
        "            local pad = (4 - (#std %% 4)) %% 4\n"
        "            std = std .. string.rep(\"=\", pad)\n"
        "            local raw = ngx.decode_base64(std)\n"
        "            if not raw then deny(\"b64\") return end\n"
        "            local cjson = require(\"cjson.safe\")\n"
        "            local ok2, payload = pcall(cjson.decode, raw)\n"
        "            if not ok2 or type(payload) ~= \"table\" or not payload.dev then deny(\"payload\") return end\n"
        "            if tonumber(payload.v) ~= 1 then deny(\"pv\") return end\n"
        "            local exp = tonumber(payload.exp)\n"
        "            if not exp then deny(\"exp\") return end\n"
        "            -- 签名已证明真实,只是过期了 -> 放行,让闸机重新要求验证(不锁死)\n"
        "            if exp <= (ngx.now() * 1000) then return end\n"
        "            -- 5) 吊销名单(deny-list):只有明确 revoked 才拒。文件缺失不阻断,\n"
        "            --    否则注册表丢失会把所有人(含自己手机)锁死;签名已证明真实性。\n"
        "            local reg_f = io.open(\"/www/dsh/device_registry.json\", \"r\")\n"
        "            if reg_f then\n"
        "                local text = reg_f:read(\"*a\")\n"
        "                reg_f:close()\n"
        "                local ok3, reg = pcall(cjson.decode, text or \"\")\n"
        "                if ok3 and type(reg) == \"table\" then\n"
        "                    local rec = reg[payload.dev]\n"
        "                    if type(rec) == \"table\" and rec.revoked then deny(\"revoked\") return end\n"
        "                end\n"
        "            end\n"
        "            ngx.req.set_header(\"X-Device-Id\", payload.dev)\n"
        "        }\n"
        "        proxy_pass http://127.0.0.1:$p_port$p_path$is_args$args;\n"
        "        proxy_http_version 1.1;\n"
        "        proxy_set_header Host \"127.0.0.1\";\n"
        "        proxy_set_header Origin \"https://127.0.0.1\";\n"
        "        proxy_set_header X-Real-IP $remote_addr;\n"
        "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
        "        proxy_set_header X-Forwarded-Proto https;\n"
        "        proxy_set_header Upgrade $http_upgrade;\n"
        "        proxy_set_header Connection $http_connection;\n"
        "        proxy_read_timeout 600s;\n"
        "        proxy_buffering off;\n"
        "        proxy_request_buffering off;\n"
        "    }\n"
        "    location = /dsh-auth.html {\n"
        "        proxy_pass http://127.0.0.1:%d/browserctl-gate/bootstrap$is_args$args;\n"
        "        proxy_http_version 1.1;\n"
        "        proxy_set_header Host \"127.0.0.1\";\n"
        "        proxy_set_header X-Real-IP $remote_addr;\n"
        "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
        "        proxy_set_header X-Forwarded-Proto https;\n"
        "        proxy_read_timeout 30s;\n"
        "    }\n"
        "    # === [/DSH 浏览器控制] ===\n"
    ) % (remote_port, secret_esc, remote_port, remote_port)


def public_host():
    """对外主机名:自建模式跟随配置面板的 host(引导链接/二维码落在用户自己的域名);
    官方模式保持 remote.ymzcc.com。"""
    try:
        sec = load_secrets()
        if sec.get("server_mode") == "selfhost" and sec.get("ssh_host"):
            return str(sec["ssh_host"]).replace("https://", "").replace("http://", "").strip("/")
    except Exception:
        pass
    return PUBLIC_HOST


def bootstrap_link_url(token):
    """引导链接:带 p=<远端端口>。不再回退写死端口——p=0 表示未就绪,边缘不会路由到 17901。"""
    port = 0
    try:
        st = read_state()
        port = int(st.get("remote_port") or 0)
    except Exception:
        pass
    if not port:
        try:
            port = int(load_secrets().get("frp_remote_port") or 0)
        except Exception:
            port = 0
    return "https://%s/dsh-auth.html?p=%d&k=%s" % (public_host(), port, token)


def bootstrap_url(ttl=86400, uses=1):
    state = read_state()
    secret = state.get("link_secret")
    if not secret:
        raise SystemExit("缺少链接密钥;先执行 python browserctl.py nginx")
    url = bootstrap_link_url(make_bootstrap_token(secret, ttl, uses))
    if "?p=0&" in url or url.endswith("?p=0"):
        raise SystemExit("尚未建立隧道(远端端口未分配),无法生成引导链接;\n"
                         "请先登录官方账号并启动隧道(python browserctl.py start)")
    return url


def upload_bootstrap(remote_port=REMOTE_PORT):
    """更新引导占位页(不含任何凭据)。

    安全约束(C-04):这个文件落在服务器站点根目录下,同源/其它 vhost/备份/目录
    遍历都可能读到它,所以**绝不能**把 Cookie、密钥、token 写进去。真正的鉴权在
    闸机侧 `/browserctl-gate/bootstrap?k=` 完成(nginx 的 `location = /dsh-auth.html`
    会代理过去),这个静态页只是万一 nginx 块缺失时的友好兜底。
    旧实现把 30 天 DSH Cookie 明文写进这个文件,等于在服务器上留了一把长期钥匙。
    """
    html = (
        "<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
        "<title>DSH 远程助手</title><style>"
        "body{font-family:-apple-system,\"Segoe UI\",\"Microsoft YaHei\",sans-serif;"
        "background:#0f172a;color:#e2e8f0;display:flex;align-items:center;"
        "justify-content:center;min-height:100vh;margin:0;padding:24px}"
        ".box{max-width:460px;padding:28px;border:1px solid #334155;border-radius:16px;"
        "background:#1e293b;text-align:center}h1{color:#38bdf8;margin:0 0 12px;font-size:19px}"
        "p{color:#94a3b8;line-height:1.75;margin:8px 0;font-size:14px}"
        "</style></head><body><div class=\"box\">"
        "<h1>请使用引导链接进入</h1>"
        "<p>本页不含任何凭据。</p>"
        "<p>请在电脑端面板的「连接」页生成引导链接或二维码,再用它打开。</p>"
        "</div></body></html>"
    )
    s = _ssh()
    try:
        sftp = s.open_sftp()
        path = SERVER_INDEX + "/dsh-auth.html"
        with sftp.open(path, "w") as f:
            f.write(html)
        # 覆盖即完成对旧版本泄漏 Cookie 的清理(同路径同文件名)
        print("引导占位页已更新(不含任何 Cookie): https://%s/dsh-auth.html" % PUBLIC_HOST)
    finally:
        s.close()


# ---------------- 状态与入口 ----------------

def read_state():
    # 解析失败多为外部非原子写(如脚本 Set-Content)的瞬时半截文件:
    # 稍等重试,避免看门狗/ensure 读到 {} 后把 state 覆盖成残缺 dict。
    if STATE.exists():
        for _ in range(5):
            try:
                return json.loads(STATE.read_text(encoding="utf-8"))
            except Exception:
                time.sleep(0.15)
    return {}


def _write_json_file_atomic(path, payload):
    """原子写(tmp + os.replace),失败时退化为直接覆盖写。

    2026-11-06 实测:Windows 上 os.replace 偶发 PermissionError [WinError 5]
    (杀软/索引器短暂持有目标文件句柄、或 ACL 收紧后瞬间不生效),原来直接抛栈会把
    `browserctl.py start` 从中间打断(frpc 已经起来、state 却没写,后续步骤全废)。
    这里短重试几次,仍失败就退化直写并告警:少一次原子性,远好过启动半途崩。
    """
    tmp = path.with_suffix(".json.tmp")
    last = None
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(payload)
            f.flush()
            try:
                os.fsync(f.fileno())
            except OSError:
                pass
        for attempt in range(6):
            try:
                os.replace(tmp, path)
                return True
            except PermissionError as e:
                last = e
                time.sleep(0.15 * (attempt + 1))
    except OSError as e:
        last = e
    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(payload)
            f.flush()
            try:
                os.fsync(f.fileno())
            except OSError:
                pass
        try:
            os.remove(tmp)
        except OSError:
            pass
        print("[警告] state 原子替换失败(%r),已改为直接写入" % (last,), flush=True)
        return True
    except OSError:
        try:
            os.remove(tmp)
        except OSError:
            pass
        raise last if last else OSError("write_state failed")


def write_state(st):
    """原子写(tmp + os.replace),每次写盘完成后把 state 文件 ACL 再收紧一次。

    2026-11-08 审计(P1 本地 ACL 回宽复发):非本进程写方(插件 Node 的原子
    rename / win_push / PowerShell)重建 state 文件时会继承根目录宽 ACL
    (CodexSandboxUsers:(I)(M) + 沙箱 SID),原「每进程只收紧一次」的
    _perms_hardened 挡不住——别人重建一次,ACL 就回宽一次。改为 os.replace
    之后每次都调 harden_file_perms(STATE):icacls 幂等且不落盘内容,
    不会回头触发 write_state,无递归/死锁风险;失败经 _perm_warned 只告警一次。
    """
    payload = json.dumps(st, ensure_ascii=False, indent=2)
    with state_lock():
        _write_json_file_atomic(STATE, payload)
    harden_file_perms(STATE)


def update_state(mutator):
    """读-改-写整体持锁,防并发覆盖(看门狗/闸机/CLI 同时写)。
    写盘完成后同样收紧一次 ACL(理由见 write_state)。"""
    with state_lock():
        st = read_state()
        out = mutator(st) or st
        _write_json_file_atomic(STATE, json.dumps(out, ensure_ascii=False, indent=2))
        harden_file_perms(STATE)
    return out


def cmd_pair():
    """生成一次性配对链接(60 秒/仅一次)。grant 存于闸机进程内存,
    通过 loopback 端点向闸机申请——闸机不在就提示先启动。"""
    try:
        req = urllib.request.Request(
            "http://127.0.0.1:%d/browserctl-gate/pair" % FWD_PORT,
            method="POST", data=b"")
        r = urllib.request.urlopen(req, timeout=5)
        info = json.loads(r.read())
    except Exception as e:
        raise SystemExit("配对失败:闸机未运行或未更新(先 python browserctl.py start): %r" % e)
    print("一次性配对链接(%d 秒内有效,仅可用一次):" % info.get("ttl", PAIR_GRANT_TTL))
    print("  %s" % info["url"])
    print("手机扫码或打开 → 自动种 Cookie 并跳转面板;过期/已用请重新生成。")


def cmd_status():
    st = read_state()
    print("DSH 端口:", end=" ")
    try:
        print(detect_port())
    except SystemExit as e:
        print("未探测到(%s)" % e)
    fwd_alive = False
    try:
        s = socket.create_connection(("127.0.0.1", FWD_PORT), timeout=1)
        s.close()
        fwd_alive = True
    except OSError:
        pass
    print("本地转发器 3080:", "运行中" if fwd_alive else "未运行",
          "(pid=%s)" % st.get("fwd_pid"))
    frpc_alive = bool(st.get("frpc_pid") and _pid_alive(st["frpc_pid"]))
    assigned = st.get("remote_port")
    print("frpc 隧道:", "运行中(pid=%s)" % st["frpc_pid"] if frpc_alive else "未运行",
          "→ 远端端口", assigned if assigned else "未分配(隧道未建立)")
    if "tunnel_ok" in st:
        if st.get("tunnel_ok"):
            print("隧道就绪: 是(端口已在 frps 监听,公网可打开)")
        else:
            first = str(st.get("tunnel_error") or "frpc 尚未把端口注册到 frps").strip().splitlines()
            print("隧道就绪: 否 →", first[0][:200] if first else "原因未记录")
            print("           (插件面板不会生成二维码;处理完后再点一次「开始控制」)")
    if assigned:
        try:
            req = urllib.request.Request("https://%s/p/%d/" % (PUBLIC_HOST, int(assigned)))
            r = urllib.request.urlopen(req, timeout=10)
            print("公网入口:", r.status)
        except urllib.error.HTTPError as e:
            print("公网入口: HTTP %d(%s)" % (
                e.code, {401: "Basic Auth / Cookie 未配置"}.get(e.code, e.reason)))
        except Exception as e:
            print("公网入口: 不可达(%s)" % e)
    else:
        print("公网入口: 未检测(端口未分配)")


def cmd_start():
    # 跨进程互斥:多个并发 start(按钮连点/侧边栏自动 ensure)串行化,防重复进程
    with _ctl_release(_ctl_lock()):
        _clean_elevated_leftovers()   # 提权残留先自动用管理员权限清掉,再挑端口/起闸机
        _select_fwd_port()   # 3080 被占就顺延,并把结果传给 fwd/watch
        port = detect_port()
        print("DSH Web 端口: %d" % port)
        ensure_forwarder()
        tunnel_err = None
        try:
            ensure_tunnel()
        except SystemExit as e:
            tunnel_err = e
        # 隧道失败也要把看门狗拉起来:它会按退避继续重连,不必等用户再点一次按钮。
        try:
            ensure_watchdog()
        except SystemExit:
            raise
        except Exception as e:  # noqa: BLE001
            print("[警告] 看门狗启动失败: %r" % e, flush=True)
        if tunnel_err is not None:
            raise tunnel_err
        name, value, payload = mint_cookie()
        # 字段级写:只更新 dsh_port 与 DSH cookie 四个键(kb/06 第 24 条)。
        # 原整份快照回写会把 start 期间看门狗/插件并发写的 frpc_pid/tunnel_ok
        # 覆盖回旧值,是「隧道间歇未建立」的竞态来源之一。
        st = update_state(lambda s: {**s, "dsh_port": port,
                                     "cookie_name": name, "cookie_value": value,
                                     "cookie_expires": payload["expiresAt"]})
    print()
    print("=" * 62)
    if st.get("link_secret"):
        print("手机/外网浏览器访问(扫码或直接打开,无需密码):")
        print("  %s" % bootstrap_url())
        print("    → 自动种 Cookie 并跳转到面板")
    else:
        print("(链接密钥未生成;执行 python browserctl.py nginx 后输出扫码链接)")
    print("面板直链(已有 Cookie):")
    _rp = st.get("remote_port")
    if _rp:
        print("  https://%s/p/%d/" % (PUBLIC_HOST, int(_rp)))
    else:
        print("  (端口未分配,隧道未建立)")
    print("=" * 62)


def cmd_stop():
    with _ctl_release(_ctl_lock()):
        st = read_state()
        leftovers = []
        pop_keys = []   # 只 pop 真正清掉的 pid 键;提权残留的键必须留在 state 里
        for key in ("frpc_pid", "fwd_pid", "watchdog_pid"):
            pid = st.get(key)
            if pid and _pid_alive(pid):
                _run_hidden(["taskkill", "/PID", str(pid), "/T", "/F"],
                            capture_output=True, timeout=15)
                if _pid_alive(pid):
                    # 提权(UAC)/受保护进程:普通权限的 taskkill 杀不掉(2026-11-07 实测)。
                    # 保留 pid 记录并记入 elevated_leftovers 标记,让 cmd_start 下次启动时
                    # 自动用管理员权限(UAC)清掉 —— 否则残留闸机/看门狗/frpc 一直占端口,
                    # 两份闸机同时写同一个 state 互相覆盖,插件就间歇报「frpc 进程未运行」。
                    print("[警告] %s(pid=%d) 为提权/受保护进程,普通权限杀不掉,已记录待管理员清理。"
                          % (key, pid))
                    leftovers.append(int(pid))
                    continue
                print("已停止 %s(pid=%d)" % (key, pid))
            pop_keys.append(key)
        if leftovers:
            # 字段级写:只动 elevated_leftovers 一个键。整份快照回写会把 stop 期间
            # 其它进程(插件 ensure/看门狗)刚写的 frpc_pid/tunnel_ok 等覆盖回旧值
            # (kb/06 第 24 条的 state 覆盖竞态)。
            update_state(lambda s: {**s, "elevated_leftovers": sorted(set(leftovers))})
            print("下次点「开始控制」会自动请求管理员权限(UAC)清理残留,弹窗请点「是」。")
        else:
            pop_keys.append("elevated_leftovers")
        # 兜底:清掉任何残留副本(watchdog / frpc / 竞态重复 fwd)。
        # 排除当前进程(自己杀自己会中断清理循环)。
        # wmic 在新版 Windows 已弃用且 where 子句常失效,改用 PowerShell CIM。
        if os.name == "nt":
            _own_pid = os.getpid()
            # 关键:必须按「本副本自己的目录」限定范围。
            # 以前只匹配 '*browserctl*',会把同一台机器上另一份插件的进程一起杀掉 ——
            # 同一台机器可以并存「正式版(mirror 目录)」和「测试副本(工作区目录)」,
            # 两者各有 browserctl.py / browserctl_frpc.toml / win_push.py,命令行里都含
            # 'browserctl'。结果就是「停测试版 → 正式版隧道也被打断」或反之(2026-11-07 实测:
            # 面板一直报隧道未就绪,而被杀的那份日志里连异常都没有)。
            try:
                _here_pat = str(HERE).replace("'", "''").replace("[", "[[]")
                ps = (
                    "$pids = Get-CimInstance Win32_Process | Where-Object { "
                    "($_.Name -eq 'python.exe' -and $_.CommandLine -like '*browserctl*' "
                    "-and $_.CommandLine -like '*%s*') -or "
                    "($_.Name -eq 'frpc.exe' -and $_.CommandLine -like '*browserctl*' "
                    "-and $_.CommandLine -like '*%s*') } "
                    "| ForEach-Object { $_.ProcessId }; "
                    "$pids | Where-Object { $_ -ne %d }" % (_here_pat, _here_pat, _own_pid))
                out = subprocess.run(["powershell", "-NoProfile", "-Command", ps],
                                     capture_output=True, text=True, timeout=30,
                                     creationflags=CREATE_NO_WINDOW)
                for line in out.stdout.splitlines():
                    tok = line.strip()
                    if tok.isdigit():
                        _run_hidden(["taskkill", "/PID", tok, "/T", "/F"],
                                    capture_output=True, timeout=10)
            except Exception:
                pass
        # 收尾写盘同样字段级:只 pop 本次真正清掉的 pid 键(提权残留键保留),
        # 其它字段(remote_port/cookie/tunnel 状态)一律以磁盘当前值为准,不回写旧快照。
        if pop_keys:
            update_state(lambda s: {k: v for k, v in s.items() if k not in pop_keys})


def cmd_link(ttl=86400, uses=1):
    """打印带过期时间与使用次数的引导链接(默认 24h / 1 次)。"""
    uses = max(0, min(int(uses), 99))
    try:
        req = urllib.request.Request(
            "http://127.0.0.1:%d/browserctl-gate/link?ttl=%d&uses=%d" % (FWD_PORT, int(ttl), uses))
        r = urllib.request.urlopen(req, timeout=5)
        info = json.loads(r.read())
    except Exception:
        # 闸机未运行:本地直接签名(效果相同,过期时间以本机时钟为准)。
        # ⚠️ 与闸机在线时不同,这条路径拿不到隧道状态,只校验"端口有没有分配",
        # 不校验 frpc 是否真的把端口注册到了 frps —— 隧道未连通时这里给出的链接
        # 打开就是 502。所以本地签发必须把这一点讲清楚,别让用户以为闸机已经把关。
        state = read_state()
        secret = state.get("link_secret")
        if not secret:
            raise SystemExit("缺少链接密钥;先运行 python browserctl.py nginx")
        token = make_bootstrap_token(secret, ttl, uses)
        url = bootstrap_link_url(token)
        if "?p=0&" in url or url.endswith("?p=0"):
            raise SystemExit("尚未建立隧道(远端端口未分配),无法生成引导链接;\n"
                             "请先登录官方账号并启动隧道(python browserctl.py start)")
        print("⚠️ 闸机未运行,链接由 CLI 本地签发,未校验隧道是否真正连通;")
        print("   打开若 502,请先 python browserctl.py start 再重新生成。", file=sys.stderr)
        info = {"url": url,
                "ttl": int(ttl), "exp": int(time.time()) + int(ttl), "uses": uses}
    print("引导链接(有效期至 %s,可用 %s):" % (
        time.strftime("%Y-%m-%d %H:%M", time.localtime(info["exp"])),
        "不限次数" if not info.get("uses") else ("%d 次" % info["uses"])))
    print("  %s" % info["url"])
    print("过期后重新执行本命令即可;想立即作废旧链接:python browserctl.py rotate")


def cmd_rotate():
    """轮换 link_secret:作废所有旧引导链接与闸机会话(踢下线),并把新密钥同步到
    服务器 nginx。

    同步这步是**必须的**:服务端 nginx 块里嵌着旧密钥,不同步的话新签发的 Cookie
    会被服务端门禁一律 403 —— 等于把自己锁在门外。以前这步要人工记得跑,现在自动做。
    """
    # 官方多用户模式:link_secret 由服务器签发且登记在注册表(按端口查),
    # 本地轮换会与注册表失配 → 边缘 403 所有新 Cookie(自锁)。先退出登录再轮换。
    if load_secrets().get("server_link_secret"):
        raise SystemExit(
            "当前为官方多用户模式:link_secret 由服务器签发,本地轮换会与注册表失配导致自锁。\n"
            "如需重置:在配置面板「退出登录」后重新登录(服务器会重新下发),或联系管理员。")
    def _mut(st):
        st["link_secret"] = os.urandom(16).hex()
        st["gate_kick_seq"] = (st.get("gate_kick_seq") or 0) + 1
        return st
    update_state(_mut)
    # 旧 token 的签名已失效,使用计数一并清掉(避免残留记录堆积)
    with _bootstrap_lock:
        _bootstrap.clear()
    _dump_bootstrap()
    print("已轮换链接密钥:旧引导链接全部失效,闸机会话全部踢下线。")
    print("正在把新密钥同步到服务器 nginx …")
    try:
        nginx_install()
    except SystemExit as e:
        print("⚠️ 同步服务器 nginx 失败:%s" % e)
        print("   现在新旧密钥不一致,面板会进不去。请在正常终端重跑:python browserctl.py nginx")
    except Exception as e:
        print("⚠️ 同步服务器 nginx 出错:%s" % e)
        print("   请重跑:python browserctl.py nginx")
    print("新的引导链接(用它重新配对手机):")
    try:
        print("  %s" % bootstrap_url())
    except SystemExit as e:
        print("  (%s)" % e)


def cmd_push(action=None, system=None):
    """手机推送开关与测试。
    用法:
      python browserctl.py push                 # 查看状态
      python browserctl.py push on|off          # 推送总开关
      python browserctl.py push --system on|off # 系统安全事件推送开关
      python browserctl.py push test            # 发一条测试推送(需先 on)
    """
    st = read_state()
    changed = []

    def _mut(s):
        if action in ("on", "1", "true"):
            s["push_enabled"] = True
            changed.append("推送总开关=开")
        elif action in ("off", "0", "false"):
            s["push_enabled"] = False
            changed.append("推送总开关=关")
        if system in ("on", "1", "true"):
            s["push_system"] = True
            changed.append("系统事件推送=开")
        elif system in ("off", "0", "false"):
            s["push_system"] = False
            changed.append("系统事件推送=关")

    if changed:
        st = update_state(_mut)
        for c in changed:
            print("已设置:" + c)

    if action == "test":
        if not st.get("push_enabled"):
            print("推送未开启,先执行:python browserctl.py push on")
            return
        nid = _push_notify("test", "测试推送", "这是一条来自 browserctl 的测试推送")
        print("已发送测试推送 id=%s(手机 App 轮询到后会弹通知)" % nid if nid else "推送发送失败")

    print("推送状态:%s  |  系统事件推送:%s  |  已排队通知:%d 条"
          % ("开启" if st.get("push_enabled") else "关闭",
             "开启" if st.get("push_system") else "关闭",
             len(_notifs)))


def main():
    ap = argparse.ArgumentParser(description="DSH 远程助手 - DeepSeek 助手 Web 穿透")
    ap.add_argument("command", choices=["detect", "mint", "fwd", "start", "status",
                                        "stop", "nginx", "upload", "totp", "watch", "pair",
                                        "link", "rotate", "secrets", "ssh-trust", "push"])
    ap.add_argument("--remote-port", type=int, default=REMOTE_PORT)
    ap.add_argument("--ttl", type=int, default=86400, help="引导链接有效期(秒),默认 86400")
    ap.add_argument("--uses", type=int, default=1,
                    help="引导链接可用次数,默认 1(一次性);0 = 不限次数")
    ap.add_argument("--system", default=None,
                    help="push: 系统事件推送 on|off")
    ap.add_argument("action", nargs="?", default=None,
                    help="totp: enable|disable|reset|uri ; secrets: init|show ; push: on|off|status|test")
    args = ap.parse_args()
    args.totp_action = args.action
    # H-05:每条 CLI 命令都顺手收紧一次凭据文件 ACL(幂等,失败只告警一次)
    try:
        harden_credential_files()
    except Exception:
        pass
    if args.command == "detect":
        print(detect_port())
    elif args.command == "mint":
        name, value, payload = mint_cookie()
        print("Cookie 名:", name)
        print("Cookie 值:", value)
        print("有效期至:", time.strftime("%Y-%m-%d %H:%M", time.localtime(payload["expiresAt"] / 1000)))
        print()
        print("浏览器控制台导入片段(在面板页 F12 粘贴):")
        print("document.cookie=%r;location.reload()" % ("%s=%s; path=/; Secure; SameSite=Lax; max-age=%d"
                                                       % (name, value, COOKIE_LIFETIME_DAYS * 86400)))
    elif args.command == "fwd":
        gate_serve()
    elif args.command == "watch":
        cmd_watch()
    elif args.command == "start":
        cmd_start()
    elif args.command == "status":
        cmd_status()
    elif args.command == "stop":
        cmd_stop()
    elif args.command == "pair":
        cmd_pair()
    elif args.command == "link":
        cmd_link(args.ttl, args.uses)
    elif args.command == "rotate":
        cmd_rotate()
    elif args.command == "ssh-trust":
        cmd_ssh_trust()
    elif args.command == "secrets":
        if args.action == "show":
            sec = load_secrets()
            # 2026-11-08 审计 P2 修复:原来只掩 ssh_password/frp_token,文件里其它键
            # (如历史遗留的 server_link_secret/totp_secret/cookie)会整串明文打出。
            # 改为默认全掩码,只有 SECRETS_PLAINTEXT_KEYS 白名单里的非机密键明文。
            shown = {k: (v if k in SECRETS_PLAINTEXT_KEYS else _mask_secret(v))
                     for k, v in sec.items()}
            print(json.dumps(shown, ensure_ascii=False, indent=2))
        else:
            cmd_secrets_init()
    elif args.command == "nginx":
        nginx_install(args.remote_port)
        upload_bootstrap(args.remote_port)
    elif args.command == "upload":
        upload_bootstrap(args.remote_port)
    elif args.command == "push":
        cmd_push(args.action, args.system)
    elif args.command == "totp":
        st = read_state()
        if args.totp_action == "enable":
            st = totp_set(True)
            print("2FA 已启用")
        elif args.totp_action == "disable":
            st = totp_set(False)
            print("2FA 已禁用(所有会话已踢下线)")
        elif args.totp_action == "reset":
            st = totp_set(True, reset=True)
            print("2FA 密钥已重置(旧密钥与全部会话失效)")
        elif args.totp_action == "uri":
            if not st.get("totp_secret"):
                raise SystemExit("尚无 2FA 密钥;先 enable")
            print(totp_uri(st["totp_secret"]))
            print("base32 密钥: %s" % st["totp_secret"])
        else:
            print("2FA 状态:", "已启用" if st.get("totp_enabled") else "未启用")
            if st.get("totp_secret"):
                print(totp_uri(st["totp_secret"]))


if __name__ == "__main__":
    main()
