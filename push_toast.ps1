param(
    [string]$Title = "",
    [string]$Body = ""
)

Add-Type -AssemblyName System.Windows.Forms

$ni = New-Object System.Windows.Forms.NotifyIcon
$ni.Icon = [System.Drawing.SystemIcons]::Information
$ni.BalloonTipTitle = $Title
$ni.BalloonTipText = $Body
$ni.Visible = $true
$ni.ShowBalloonTip(8000)

# Stay alive long enough for the balloon to display
for ($i = 0; $i -lt 30; $i++) {
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 100
}

$ni.Dispose()
