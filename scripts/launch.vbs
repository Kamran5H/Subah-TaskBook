Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\Users\chkam\OneDrive\Desktop\Subah-TaskBook"
WshShell.Run "cmd.exe /c npx electron .", 0, False
