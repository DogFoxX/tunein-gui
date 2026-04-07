!macro NSIS_HOOK_POSTINSTALL

  CopyFiles "$INSTDIR\resources\dotnet-runtime-8.0.25-win-x64.exe" "$TEMP\dotnet-runtime-8.0.25-win-x64.exe"

  DetailPrint "Installing .NET 8.0 Runtime (v8.0.25)..."
  ExecWait '"$TEMP\dotnet-runtime-8.0.25-win-x64.exe" /install /quiet /norestart' $0

  Delete "$TEMP\dotnet-runtime-8.0.25-win-x64.exe"
  Delete "$INSTDIR\resources\dotnet-runtime-8.0.25-win-x64.exe"
!macroend