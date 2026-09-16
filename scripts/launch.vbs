Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
If fso.FileExists(fso.BuildPath(scriptDir, "package.json")) Then
    rootDir = scriptDir
ElseIf fso.FileExists(fso.BuildPath(fso.GetParentFolderName(scriptDir), "package.json")) Then
    rootDir = fso.GetParentFolderName(scriptDir)
Else
    rootDir = scriptDir
End If
WshShell.CurrentDirectory = rootDir
WshShell.Run "cmd.exe /c npx electron .", 0, False
