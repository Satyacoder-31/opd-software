' Dr. Orthos Silent Background Launcher
' Starts the application with zero CMD or terminal windows displayed
Set WshShell = CreateObject("WScript.Shell")
strPath = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
WshShell.CurrentDirectory = strPath

' Check if native standalone .exe exists in dist-electron
Dim fso, exePath
Set fso = CreateObject("Scripting.FileSystemObject")
exePath = strPath & "\dist-electron\win-unpacked\Dr Orthos OPD.exe"

If fso.FileExists(exePath) Then
    ' Run native GUI application directly (no console window)
    WshShell.Run """" & exePath & """", 1, False
Else
    ' Run desktop dev silently in hidden background process (0 = hidden)
    WshShell.Run "cmd /c npm run desktop:dev", 0, False
End If
