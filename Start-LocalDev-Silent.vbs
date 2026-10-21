' Starts Next.js local development server in the background with ZERO visible CMD window
Set WshShell = CreateObject("WScript.Shell")
strPath = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
WshShell.CurrentDirectory = strPath

' Window style 0 = completely hidden, False = do not wait for completion
WshShell.Run "cmd.exe /c npm run dev", 0, False

WScript.Echo "Dr. Orthos local server is running silently in the background (no CMD window)."
