@echo off
cd /d "%~dp0"

if exist "%~dp0dist-electron\win-unpacked\Dr Orthos OPD.exe" (
    start "" "%~dp0dist-electron\win-unpacked\Dr Orthos OPD.exe"
    exit
)

wscript.exe "%~dp0Launch-DrOrthos.vbs"
exit
