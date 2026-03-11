@echo off
echo Iniciando servidor local no porto 3000...
echo Pressione Ctrl+C para parar o servidor.
npx -y http-server . -p 3000 -o index.html
