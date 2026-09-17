# ==============================================================================
# Subah-TaskBook - Create & Refresh Desktop Shortcut with Icon
# ==============================================================================

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Split-Path -Parent $scriptDir

# Icon path (ensure clean absolute path without relative dots)
$iconPath = Join-Path $projectRoot "assets\icon.ico"
if (-not (Test-Path $iconPath)) {
    Write-Warning "Icon not found at $iconPath"
}

# Determine target executable or launch script
$distExe = Join-Path $projectRoot "dist\Subah-win32-x64\Subah.exe"
$launchVbs = Join-Path $scriptDir "launch.vbs"

$targetPath = ""
$targetArgs = ""

if (Test-Path $distExe) {
    $targetPath = $distExe
    $targetArgs = ""
    Write-Host "Target: Packaged binary ($distExe)" -ForegroundColor Cyan
} elseif (Test-Path $launchVbs) {
    $targetPath = "wscript.exe"
    $targetArgs = "`"$launchVbs`""
    Write-Host "Target: Live launcher ($launchVbs)" -ForegroundColor Cyan
} else {
    $targetPath = "cmd.exe"
    $targetArgs = "/c npx electron . `"$projectRoot`""
    Write-Host "Target: Direct electron command" -ForegroundColor Cyan
}

# Detect desktop paths (OneDrive Desktop + local user profile Desktop)
$desktopPaths = @()

$primaryDesktop = [Environment]::GetFolderPath("Desktop")
if ($primaryDesktop -and (Test-Path $primaryDesktop)) {
    $desktopPaths += $primaryDesktop
}

$localDesktop = Join-Path $env:USERPROFILE "Desktop"
if ($localDesktop -and (Test-Path $localDesktop) -and ($desktopPaths -notcontains $localDesktop)) {
    $desktopPaths += $localDesktop
}

$wsh = New-Object -ComObject WScript.Shell
$createdShortcuts = @()

foreach ($desktop in $desktopPaths) {
    $shortcutPath = Join-Path $desktop "Subah.lnk"
    
    $shortcut = $wsh.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $targetPath
    if ($targetArgs) {
        $shortcut.Arguments = $targetArgs
    } else {
        $shortcut.Arguments = ""
    }
    $shortcut.WorkingDirectory = $projectRoot
    $shortcut.IconLocation = "$iconPath,0"
    $shortcut.Description = "Subah - Daily Focus & Reward Book by Kamran Ashraf"
    $shortcut.WindowStyle = 1
    $shortcut.Save()
    
    $createdShortcuts += $shortcutPath
    Write-Host "Created shortcut: $shortcutPath" -ForegroundColor Green
    Write-Host "  Icon: $iconPath,0" -ForegroundColor Gray
}

# Notify Windows Shell to refresh icons
try {
    $typeDef = '[DllImport("shell32.dll")] public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);'
    Add-Type -MemberDefinition $typeDef -Name "ShellNotifier" -Namespace "Win32" -ErrorAction SilentlyContinue
    [Win32.ShellNotifier]::SHChangeNotify(0x08000000, 0x0000, [IntPtr]::Zero, [IntPtr]::Zero)
    Write-Host "Windows Shell notified to refresh icon cache." -ForegroundColor Green
} catch {
    # Non-critical fallback
}

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host " Subah Desktop Shortcut & Icon successfully setup!" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
