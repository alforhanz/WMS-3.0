@echo off
echo.
echo ========================================
echo    MINIFICANDO Y REEMPLAZANDO CSS
echo ========================================
echo.

:: Verificar si cleancss está instalado
where cleancss >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] cleancss no está instalado.
    echo         Ejecuta: npm install -g clean-css-cli
    pause
    exit /b
)

:: Procesar cada archivo CSS
set contador=0
for %%f in (css\*.css) do (
    echo [OK] Procesando: %%~nxf
    cleancss -o "%%f" "%%f" --format break
    if %errorlevel% equ 0 (
        echo     -> Minificado y reemplazado
        set /a contador+=1
    ) else (
        echo     -> ERROR al minificar
    )
    echo.
)

echo ========================================
echo  ¡%contador% archivos CSS protegidos!
echo ========================================
echo.
pause