' Subah TaskBook — Resilient Native Launcher
Option Explicit
Dim WshShell, fso, scriptDir, rootDir, candidates, cand, q, distExe, electronExe
q = Chr(34)
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
If fso.FileExists(fso.BuildPath(scriptDir, "package.json")) Then
    rootDir = scriptDir
ElseIf fso.FileExists(fso.BuildPath(fso.GetParentFolderName(scriptDir), "package.json")) Then
    rootDir = fso.GetParentFolderName(scriptDir)
Else
    candidates = Array( _
        "C:\Users\chkam\OneDrive\Desktop\02_Projects & Development\Subah-TaskBook", _
        "C:\Users\chkam\OneDrive\Desktop\Subah-TaskBook", _
        "C:\Users\chkam\Desktop\02_Projects & Development\Subah-TaskBook", _
        "C:\Users\chkam\Desktop\Subah-TaskBook" _
    )
    rootDir = scriptDir
    For Each cand In candidates
        If fso.FileExists(cand & "\package.json") Then
            rootDir = cand
            Exit For
        End If
    Next
End If

WshShell.CurrentDirectory = rootDir

distExe = rootDir & "\dist\Subah-win32-x64\Subah.exe"
electronExe = rootDir & "\node_modules\electron\dist\electron.exe"

If fso.FileExists(distExe) Then
    ' Launch detached native binary
    WshShell.Run "cmd /c start """" """ & distExe & """", 0, False
ElseIf fso.FileExists(electronExe) Then
    ' Launch detached native Electron binary directly with project folder
    WshShell.Run "cmd /c start """" """ & electronExe & """ """ & rootDir & """", 0, False
Else
    WshShell.Run "cmd /c start """" npx electron """ & rootDir & """", 0, False
End If

