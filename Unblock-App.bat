@echo off
echo Unblocking Dr. Orthos application executables...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0dist-electron' -Recurse -Filter '*.exe' -ErrorAction SilentlyContinue | ForEach-Object { Unblock-File -Path $_.FullName; Write-Host ('Unblocked: ' + $_.Name) }"
echo.
echo All executables unblocked successfully! You can now launch the software.
pause
