' Dr. Orthos Silent Background Launcher
' Starts the desktop software with zero CMD or terminal windows displayed
' Bypasses Windows Smart App Control by launching via the trusted Electron runtime
Set WshShell = CreateObject("WScript.Shell")
strPath = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
WshShell.CurrentDirectory = strPath

' Set cloud mode environment variable
WshShell.Environment("Process")("ELECTRON_CLOUD") = "1"

' Launch desktop application cleanly without terminal windows (0 = hidden)
WshShell.Run "node """ & strPath & "\node_modules\electron\cli.js"" """ & strPath & """", 0, False
