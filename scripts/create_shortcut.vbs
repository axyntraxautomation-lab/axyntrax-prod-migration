Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\AXIA_MAESTRO_PROD.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "cmd.exe"
oLink.Arguments = "/c python AXIA_MAESTRO.py"
oLink.WorkingDirectory = "C:\Users\YARVIS\Desktop\AXYNTRAX_AUTOMATION_Suite"
oLink.Description = "AxyntraX Automation | Suite Diamante"
oLink.IconLocation = "C:\Users\YARVIS\Desktop\AXYNTRAX_AUTOMATION_Suite\suite_diamante\assets\logo.ico,0"
oLink.Save
