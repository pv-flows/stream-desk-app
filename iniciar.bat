@echo off
echo Limpando processos antigos travados no Windows...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM desktop.exe >nul 2>&1

echo Iniciando Servidor Desktop (Tauri)...
start cmd /k "cd desktop && npm run tauri dev"

echo Iniciando Aplicativo Mobile (Expo)...
start cmd /k "cd mobile && npx expo start"
