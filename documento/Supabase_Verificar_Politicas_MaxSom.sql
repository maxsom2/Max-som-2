-- MAX SOM — VERIFICAÇÃO APÓS A MIGRAÇÃO (somente leitura)

-- 1) Resumo das políticas públicas da aplicação
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2) RLS habilitado nas 20 tabelas da aplicação
SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

-- 3) Confirma as colunas usadas pelo site e corrige-as no JavaScript se divergir.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'conversas' AND column_name IN ('cliente_id','funcionario_id','atendente_id','assunto','status'))
    OR (table_name = 'publicacoes' AND column_name IN ('publica','publicado','data_publicacao'))
    OR (table_name = 'produtos' AND column_name IN ('Modelo','modelo'))
    OR (table_name = 'usuario' AND column_name IN ('id','nome','tipo_usuario','email'))
  )
ORDER BY table_name, ordinal_position;
