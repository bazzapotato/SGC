@echo off
REM start.bat - Windows Electron starter

setlocal

echo Resolving dependencies...
call npm install

echo Checking for electron-store...
node -e "try { require('electron-store'); console.log('electron-store found'); } catch(e) { console.error('electron-store missing'); process.exit(1); }" || (
  echo Installing electron-store...
  call npm install electron-store@8.1.0 --save-exact
)

echo Starting Electron...
if exist "node_modules\.bin\electron.cmd" (
  call node_modules\.bin\electron.cmd .
) else (
  echo Electron binary not found. Trying npx...
  call npx electron .
)

endlocal