@echo off
title Configurar e Publicar Relatorio Mensal
color 0A

echo ===============================================================
echo     ASSISTENTE DE CONFIGURACAO: RELATORIO MENSAL SUPABASE
echo ===============================================================
echo.
echo Passo 1: Autenticar no Supabase
echo O seu navegador sera aberto. Por favor, autorize o Login no Supabase.
echo.
call npx supabase login
echo.

echo Passo 2: Vincular ao seu Projeto (Precisa da Senha do Banco de Dados)
echo ID do Projeto: ctveuoeoyymzozzwqqln
call npx supabase link --project-ref ctveuoeoyymzozzwqqln
echo.

echo Passo 3: Configurar Chaves (Secrets)
echo.
set /p RESEND_API_KEY="Cole aqui a sua CHAVE DA API DO RESEND (ex: re_XyZ...): "
set /p SUPABASE_SERVICE_ROLE_KEY="Cole aqui a sua SUPABASE SERVICE ROLE KEY (disponivel nas configuracoes do seu projeto): "
echo.
echo Salvando chaves com seguranca na nuvem...
call npx supabase secrets set RESEND_API_KEY="%RESEND_API_KEY%" SUPABASE_URL="https://ctveuoeoyymzozzwqqln.supabase.co" SUPABASE_SERVICE_ROLE_KEY="%SUPABASE_SERVICE_ROLE_KEY%"
echo.

echo Passo 4: Enviando o codigo da Funcao para a Nuvem (Deploy)
echo Isso pode demorar alguns segundos, aguarde...
call npx supabase functions deploy monthly-report --project-ref ctveuoeoyymzozzwqqln
echo.

echo ===============================================================
echo SUCESSO! A funcao foi publicada e as chaves estao configuradas.
echo.
echo ULTIMO PASSO MANUAL:
echo Nao esqueca de rodar o conteudo do arquivo 'cron_setup.sql' 
echo no 'SQL Editor' do site do Supabase para programar o envio mensal!
echo ===============================================================
pause
