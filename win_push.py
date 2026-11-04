#!/usr/bin/env python3
"""
Windows 推送驻留 —— 长轮询闸机 push-poll 端点, 以 Windows 通知中心弹窗展示推送。

生命周期: 由插件 index.js 通过 spawn 启动, 随 DSH 进程终止而结束。
鉴权: 使用本机管理令牌 (X-BC-Admin), 无需 bc-gate Cookie (因闸机在本机 127.0.0.1)。

依赖: Python 标准库 + pywin32 (已安装于本机)。
"""

import json
import os
import signal
import subprocess
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

HERE = Path(__file__).resolve().parent

STATE_FILE = HERE / "browserctl_pushwin_state.json"
ADMIN_TOKEN_FILE = HERE / "browserctl_admin_token"
TOAST_PS1 = HERE / "push_toast.ps1"

PUSH_POLL_URL = "http://127.0.0.1:3080/browserctl-gate/push-poll"

# 轮询节奏 —— 与 Android PushService 对齐
POLL_OK_SEC = 15.0       # 正常间隔 (15s)
POLL_SLOW_SEC = 60.0     # push_enabled=false 时慢轮询
BACKOFF_SECS = [30, 60, 120, 300]  # 指数退避

# ---- 状态管理 ----

def read_admin_token():
    """读取本机管理令牌。文件缺失时返回 None (闸机未运行/未初始化)。"""
    try:
        return ADMIN_TOKEN_FILE.read_text(encoding="utf-8").strip()
    except Exception:
        return None


def load_state():
    """加载上次已消费的 push id。"""
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(state):
    """原子写入状态。"""
    tmp = STATE_FILE.with_name(STATE_FILE.name + ".tmp")
    try:
        tmp.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")
        tmp.replace(STATE_FILE)
    except Exception:
        try:
            tmp.unlink(missing_ok=True)
        except Exception:
            pass


# ---- 推送轮询 ----

def poll(last_id):
    """长轮询 push-poll 端点, 返回 (items_list, enabled_bool, since_int) 或 None。"""
    token = read_admin_token()
    if not token:
        return None
    url = f"{PUSH_POLL_URL}?last={last_id}"
    req = urllib.request.Request(url)
    req.add_header("X-BC-Admin", token)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            if resp.status != 200:
                return None
            body = resp.read().decode("utf-8")
            j = json.loads(body)
            if not j.get("ok"):
                return None
            return j.get("items", []), j.get("enabled", False), j.get("since", 0)
    except (urllib.error.URLError, urllib.error.HTTPError,
            ConnectionError, TimeoutError, OSError):
        return None
    except json.JSONDecodeError:
        return None


# ---- Windows 原生弹窗 ----

def show_toast(title, body):
    """通过 PowerShell Forms.NotifyIcon 弹窗显示 Windows 原生通知。"""
    if not TOAST_PS1.exists():
        return
    try:
        subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-NoProfile", "-STA",
             "-File", str(TOAST_PS1),
             "-Title", str(title or "")[:64],
             "-Body", str(body or "")[:256]],
            timeout=10,
            capture_output=True,
        )
    except Exception:
        pass


# ---- 主循环 ----

LOCK_FILE = HERE / "browserctl_pushwin.lock"


def acquire_lock():
    """单实例守卫:锁文件被占用说明已有驻留在跑,直接退出。返回锁文件句柄或 None。"""
    import msvcrt
    try:
        fh = open(LOCK_FILE, "a+")
        try:
            msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            fh.close()
            return None
        fh.seek(0)
        fh.truncate()
        fh.write(str(os.getpid()))
        fh.flush()
        return fh
    except Exception:
        return None


def main():
    running = True

    def shutdown(_sig, _frame):
        nonlocal running
        running = False

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    lock_fh = acquire_lock()
    if lock_fh is None:
        # 已有实例在跑(同机重复 spawn 无害但浪费),静默退出
        return

    state = load_state()
    first_run = "last_id" not in state
    last_id = state.get("last_id", 0)
    backoff_idx = 0

    while running:
        result = poll(last_id)

        if result is None:
            # 网络错误 / 鉴权失败 → 指数退避
            wait = BACKOFF_SECS[min(backoff_idx, len(BACKOFF_SECS) - 1)]
            backoff_idx += 1
            _sleep(wait, running_ref=lambda: running)
            continue

        items, enabled, since = result
        backoff_idx = 0  # 成功 → 重置退避

        if first_run:
            # 首次运行不回放历史推送(否则一启动弹几十条旧通知),只记住当前水位。
            first_run = False
            last_id = since
            save_state({"last_id": since})
            _sleep(POLL_OK_SEC, running_ref=lambda: running)
            continue

        if not enabled:
            # 推送总开关关闭: 慢轮询, 记录最新 seq 但不弹通知
            if since > 0:
                last_id = since
                save_state({"last_id": since})
            _sleep(POLL_SLOW_SEC, running_ref=lambda: running)
            continue

        # 处理新推送项
        for item in items:
            if not running:
                break
            title = item.get("title", "") or ""
            body = item.get("body", "") or ""
            if title or body:
                show_toast(title, body)
            nid = item.get("id", 0)
            if nid > last_id:
                last_id = nid

        if last_id > 0:
            save_state({"last_id": last_id})

        _sleep(POLL_OK_SEC, running_ref=lambda: running)


def _sleep(sec, running_ref=None):
    """可中断的睡眠 (每 100ms 检查一次 running 标志)。"""
    steps = int(sec * 10)
    for _ in range(steps):
        if running_ref is not None and not running_ref():
            return
        time.sleep(0.1)


if __name__ == "__main__":
    main()
