-- ============================================================
-- Configuração do Agendamento (Cron Job) para Relatório Mensal
-- Execute isso no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Certifique-se de que as extensões necessárias estão ativadas (geralmente já vêm ativadas no Supabase)
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 2. Agendar a chamada à Edge Function "monthly-report"
-- A expressão '0 0 1 * *' significa: "Todo dia 1º de cada mês, às 00:00"
select
  cron.schedule(
    'monthly-financial-report', -- Nome único para o agendamento
    '0 0 1 * *',                -- Ocorre mensalmente
    $$
    select
      net.http_post(
          url:='https://ctveuoeoyymzozzwqqln.supabase.co/functions/v1/monthly-report',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_0eXOKvszzLOxPlP6cf7MbQ_DgHpF9gd"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );

-- NOTA: Como a função requer permissões elevadas para ler 'auth.users', 
-- no código TypeScript da função usamos o SUPABASE_SERVICE_ROLE_KEY.
-- A requisição REST acima não precisa passar o Service Role Key no Authorization Header,
-- pois o SUPABASE_SERVICE_ROLE_KEY é lido diretamente das variáveis de ambiente na Edge Function.

-- Para testar imediatamente sem esperar o dia 1º, você pode rodar esse comando no SQL Editor:
-- select net.http_post(url:='https://ctveuoeoyymzozzwqqln.supabase.co/functions/v1/monthly-report');
