@echo off
mkdir js_protegido 2>nul

for %%f in (js\*.js) do (
    echo Protegiendo %%~nxf...
    uglifyjs "%%f" -c -m -o "js_protegido\temp.min.js"
    javascript-obfuscator "js_protegido\temp.min.js" -o "js_protegido\%%~nxf" --self-defending true --compact true
)

del js_protegido\temp.min.js
echo.
echo ¡TODOS LOS ARCHIVOS PROTEGIDOS!
pause