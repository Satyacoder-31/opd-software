$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$ShortcutNames = @("Dr. Orthos Clinic OPD.lnk", "Dr Orthos OPD.lnk")
$TargetDir = Split-Path -Parent $PSScriptRoot

$NativeExe = Join-Path $TargetDir "dist-electron\win-unpacked\Dr Orthos OPD.exe"
$VbsScript = Join-Path $TargetDir "Launch-DrOrthos.vbs"
$IconPath = Join-Path $TargetDir "public\app-icon.ico"

foreach ($name in $ShortcutNames) {
    $ShortcutPath = Join-Path $DesktopPath $name
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    
    if (Test-Path $NativeExe) {
        # Native GUI executable: NEVER opens a CMD or terminal window!
        $Shortcut.TargetPath = $NativeExe
        $Shortcut.WorkingDirectory = Split-Path $NativeExe -Parent
    } else {
        # Silent background launcher (runs completely hidden)
        $Shortcut.TargetPath = $VbsScript
        $Shortcut.WorkingDirectory = $TargetDir
    }
    
    $Shortcut.Description = "Dr. Orthos - Clinic OPD Management Software"
    if (Test-Path $IconPath) {
        $Shortcut.IconLocation = "$IconPath, 0"
    }
    $Shortcut.Save()
    Write-Host "✅ Silent desktop shortcut updated at: $ShortcutPath" -ForegroundColor Green
}
