' Cleanly terminates background Next.js development processes
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c taskkill /f /im node.exe", 0, True
WScript.Echo "Dr. Orthos local server stopped."
