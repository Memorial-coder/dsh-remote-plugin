# ============================================================================
#  修复杀软拦截 frpc.exe  —— 一键脚本(需要管理员权限)
#
#  症状: 手机打开链接显示 502,或终端报
#        PermissionError: [WinError 5] 拒绝访问 / 「无法运行: Access is denied」
#  原因:  Windows Defender 把 frpc.exe 判为 PUA:Win32/FRProxy(潜在不受欢迎程序)
#         并阻止它执行。联想电脑管家 / 火绒 / 360 等也会做同样的事。
#
#  用法:  右键本文件 →「使用 PowerShell 运行」
#         或在本目录执行:
#           powershell -ExecutionPolicy Bypass -File .\fix-antivirus.ps1
#
#  本脚本只做三件事:解除下载锁定、给本目录加杀软排除项、验证 frpc.exe 能跑。
#  不会上传任何东西,不会改系统其它设置。
# ============================================================================
param([switch]$NoPua, [switch]$NoPause)

$ErrorActionPreference = 'Continue'

function Say($msg, $color = 'Gray') { Write-Host $msg -ForegroundColor $color }
function Line() { Say ("-" * 68) 'DarkGray' }

# ---------- 自提权 ----------
$principal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Say "需要管理员权限,正在请求提权(会弹 UAC 窗口,请点「是」)..." 'Yellow'
    $argv = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"{0}"' -f $PSCommandPath))
    if ($NoPua) { $argv += '-NoPua' }
    if ($NoPause) { $argv += '-NoPause' }
    try {
        Start-Process -FilePath 'powershell.exe' -ArgumentList $argv -Verb RunAs -Wait
    } catch {
        Say "提权被取消,无法继续。" 'Red'
        Start-Sleep -Seconds 3
    }
    exit
}

$kit = Split-Path -Parent $PSCommandPath
Line
Say "  DSH 远程助手 · 杀软拦截修复" 'Cyan'
Line
Say ("部署包目录: " + $kit) 'White'
Say ""

# ---------- 1. 解除下载锁定 ----------
Say "[1/5] 解除文件下载锁定(MOTW)..." 'White'
$n = 0
Get-ChildItem -LiteralPath $kit -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    try { Unblock-File -LiteralPath $_.FullName -ErrorAction SilentlyContinue; $n++ } catch { }
}
Say ("      已处理 " + $n + " 个文件") 'Green'

# ---------- 2. 检查 frpc.exe ----------
Say ""
Say "[2/5] 检查 frpc.exe ..." 'White'
$frpc = Join-Path $kit 'frpc.exe'
$frpcOk = $false
if (Test-Path -LiteralPath $frpc) {
    $len = (Get-Item -LiteralPath $frpc).Length
    Say ("      存在,大小 " + $len.ToString('N0') + " 字节") 'Green'
    $frpcOk = $true
} else {
    Say "      未找到 frpc.exe —— 它很可能已被 Defender 隔离或删除。" 'Red'
    Say "      请重新解压 dsh-remote-kit.zip 覆盖本目录,然后重新运行本脚本。" 'Yellow'
}

# ---------- 3. Windows Defender 排除项 ----------
Say ""
Say "[3/5] 添加 Windows Defender 排除项 ..." 'White'
$hasDefender = $false
try { Get-MpComputerStatus -ErrorAction Stop | Out-Null; $hasDefender = $true } catch { }
$tamperBlocked = $false

if ($hasDefender) {
    try {
        Add-MpPreference -ExclusionPath $kit -ErrorAction Stop
        Say ("      已添加目录排除: " + $kit) 'Green'
    } catch {
        $tamperBlocked = $true
        Say ("      目录排除失败: " + $_.Exception.Message) 'Red'
    }
    foreach ($p in @('frpc.exe', 'browserctl.py', 'python.exe')) {
        try {
            Add-MpPreference -ExclusionProcess $p -ErrorAction Stop
            Say ("      已添加进程排除: " + $p) 'Green'
        } catch {
            $tamperBlocked = $true
            Say ("      进程排除 " + $p + " 失败") 'Yellow'
        }
    }
} else {
    Say "      未检测到 Windows Defender(可能已被第三方杀软接管),跳过。" 'Yellow'
}

if ($tamperBlocked) {
    Say ""
    Say "      !! Defender 拒绝了脚本修改(多半是「篡改防护 / Tamper Protection」开着)。" 'Yellow'
    Say "      !! 请手动加排除项(图形界面不受篡改防护限制):" 'Yellow'
    Say "         Windows 安全中心 → 病毒和威胁防护 → 「病毒和威胁防护」设置 → 管理设置" 'Gray'
    Say "         → 排除项 → 添加或删除排除项 → 添加排除项 → 文件夹 → 选本目录" 'Gray'
}

# ---------- 4. PUA 拦截(关键) ----------
Say ""
Say "[4/5] 检查「潜在不受欢迎的应用(PUA)」拦截 ..." 'White'
if ($hasDefender) {
    try {
        $pua = (Get-MpPreference).PUAProtection   # 0=关闭 1=开启 2=仅审核
        if ($pua -eq 1) {
            Say "      当前为「开启」—— frpc.exe 会被判成 PUA:Win32/FRProxy(ThreatID 335323)。" 'Yellow'
            Say "      (注:PUA 开启不一定就会拦;需要文件同时带 MOTW 下载标记才会触发。" 'Gray'
            Say "      第 1 步的 Unblock-File 消掉 MOTW 后往往就够。如果还不行再关 PUA。)" 'Gray'
            if (-not $NoPua) {
                Say "      关掉它能彻底解决,但会降低对流氓软件/广告软件的防护。" 'Yellow'
                $ans = Read-Host "      是否关闭 PUA 拦截? 输入 y 关闭,直接回车跳过"
                if ($ans -match '^(y|Y|yes|YES)$') {
                    try {
                        Set-MpPreference -PUAProtection Disabled -ErrorAction Stop
                        Say "      已关闭 PUA 拦截" 'Green'
                    } catch {
                        Say ("      关闭失败: " + $_.Exception.Message) 'Red'
                        Say "      请手动关:Windows 安全中心 → 应用和浏览器控制 → 基于信誉的保护设置" 'Gray'
                        Say "                → 「潜在不受欢迎的应用」→ 关闭" 'Gray'
                    }
                } else {
                    Say "      已跳过(若仍被拦,再手动关闭)" 'Gray'
                }
            } else {
                Say "      (已用 -NoPua 跳过)" 'Gray'
            }
        } elseif ($pua -eq 0) {
            Say "      已是「关闭」状态" 'Green'
        } else {
            Say ("      当前值: " + $pua + "(2=仅审核)") 'Gray'
        }
    } catch {
        Say ("      查询失败: " + $_.Exception.Message) 'Yellow'
    }
}

# ---------- 5. 验证 ----------
Say ""
Say "[5/5] 验证 frpc.exe 能否执行 ..." 'White'
if ($frpcOk) {
    $ok = $false
    try {
        $out = & $frpc -v 2>&1
        Say ("      执行成功: " + ($out -join ' ')) 'Green'
        $ok = $true
    } catch {
        Say ("      仍然无法执行: " + $_.Exception.Message) 'Red'
    }
    Say ""
    if ($ok) {
        Line
        Say "  修复完成!回到 DSH 面板点「开启」即可。" 'Green'
        Line
    } else {
        Say "  还没好。请依次检查:" 'Yellow'
        Say "    1) 联想电脑管家 / 火绒 / 360:打开它自己的界面 → 病毒查杀 → 信任区/排除项," 'Gray'
        Say "       把本目录加进去(这些软件的排除项和 Defender 是分开的,必须各自加)" 'Gray'
        Say "    2) Windows 安全中心 → 应用和浏览器控制 → 智能应用控制,若开启请关闭" 'Gray'
        Say "    3) 重启一次电脑,再运行本脚本" 'Gray'
    }
} else {
    Say "      frpc.exe 不存在,请先重新解压 zip 再运行本脚本。" 'Red'
}

Say ""
Line
Say "说明:本脚本只改了杀软排除项,随时可在杀软界面里删掉。" 'DarkGray'
Line
if (-not $NoPause) { Read-Host "按回车键关闭" | Out-Null }
