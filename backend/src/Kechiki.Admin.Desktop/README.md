# Kechiki Admin Desktop App

This is the Windows WPF Admin Application for Kechiki.

## Prerequisites
- .NET 8.0 SDK
- Windows 10/11

## Configuration
The API Base URL is currently set in `App.xaml.cs`. 
In the future, this should be moved to `appsettings.json` or Environment Variables.

## Building Locally
Run the following command from the `backend` directory:
```powershell
dotnet build src/Kechiki.Admin.Desktop/Kechiki.Admin.Desktop.csproj
```

## Running
```powershell
dotnet run --project src/Kechiki.Admin.Desktop/Kechiki.Admin.Desktop.csproj
```

## Packaging (Installer)
To create a self-contained executable (and effectively a portable app):
```powershell
dotnet publish src/Kechiki.Admin.Desktop/Kechiki.Admin.Desktop.csproj -c Release -r win-x64 --self-contained -p:PublishSingleFile=true
```
The output will be in `src/Kechiki.Admin.Desktop/bin/Release/net8.0-windows/win-x64/publish/`.

## Features
- **Authentication**: Login with Email/Password. Tokens stored securely using DPAPI.
- **Navigation**: Sidebar navigation to Dashboard, Countries, etc.
- **Dashboard**: Overview of system status.
