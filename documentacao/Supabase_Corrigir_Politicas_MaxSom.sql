-- ================================================================
-- MAX SOM — MIGRAÇÃO PONTUAL DE PRIVILÉGIOS E POLÍTICAS RLS
-- Baseado no backup fornecido MaxSom_Supabase_Tabelas_RLS_Backup.sql
-- Não apaga registros nem recria tabelas.
-- IMPORTANTE: revisar este arquivo e manter o backup original guardado.
-- ================================================================

BEGIN;

-- 1) Funções auxiliares seguras para consultar o perfil autenticado.
-- SECURITY DEFINER com owner postgres evita recursão da política de usuario.
CREATE OR REPLACE FUNCTION public.maxsom_current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT COALESCE((
    SELECT lower(u.tipo_usuario)
    FROM public.usuario AS u
    WHERE u.id = auth.uid()
    LIMIT 1
  ), '');
$function$;

ALTER FUNCTION public.maxsom_current_role() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.maxsom_current_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.maxsom_current_role() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.maxsom_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT public.maxsom_current_role() IN (
    'admin', 'dono', 'administrador',
    'funcionario', 'funcionário',
    'funcionario tecnico', 'funcionário técnico'
  );
$function$;

ALTER FUNCTION public.maxsom_is_staff() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.maxsom_is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.maxsom_is_staff() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.maxsom_is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT public.maxsom_current_role() IN ('admin', 'dono', 'administrador');
$function$;

ALTER FUNCTION public.maxsom_is_owner() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.maxsom_is_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.maxsom_is_owner() TO anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2) Retira os privilégios excessivos diretos que aparecem no backup e
-- concede só CRUD normal. As políticas RLS abaixo decidem quais linhas cabem.
-- service_role/postgres não são alterados por este bloco.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON
  public.categoria_produto,
  public.categoria_publicacao,
  public.configuracao_loja,
  public.marcas,
  public.produtos,
  public.projetos,
  public.publicacoes,
  public.servicos,
  public."Fotos_projeto"
TO anon;

-- 3) Assegura RLS nas tabelas da aplicação.
ALTER TABLE public."Fotos_projeto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categoria_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categoria_publicacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracao_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endereco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garantia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."solicitações_servico" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;

-- 4) PERFIS
DROP POLICY IF EXISTS usuario_ver_dados ON public.usuario;
DROP POLICY IF EXISTS maxsom_usuario_select ON public.usuario;
DROP POLICY IF EXISTS maxsom_usuario_insert_cliente ON public.usuario;
DROP POLICY IF EXISTS maxsom_usuario_update_self_owner ON public.usuario;
DROP POLICY IF EXISTS maxsom_usuario_delete_owner ON public.usuario;

CREATE POLICY maxsom_usuario_select ON public.usuario
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.maxsom_is_staff());

-- Clientes podem criar somente o próprio perfil com o papel cliente.
CREATE POLICY maxsom_usuario_insert_cliente ON public.usuario
FOR INSERT TO authenticated
WITH CHECK (
  (id = auth.uid() AND lower(COALESCE(tipo_usuario, '')) = 'cliente')
  OR public.maxsom_is_owner()
);

-- O usuário pode atualizar seus dados sem trocar o próprio papel.
-- Somente o dono pode promover/alterar papéis de usuários.
CREATE POLICY maxsom_usuario_update_self_owner ON public.usuario
FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.maxsom_is_owner())
WITH CHECK (
  (id = auth.uid() AND lower(COALESCE(tipo_usuario, '')) = public.maxsom_current_role())
  OR public.maxsom_is_owner()
);

CREATE POLICY maxsom_usuario_delete_owner ON public.usuario
FOR DELETE TO authenticated
USING (public.maxsom_is_owner());

-- 5) CONTEÚDO PÚBLICO: somente linhas ativas/publicadas para visitantes.
DROP POLICY IF EXISTS maxsom_categoria_produto_read ON public.categoria_produto;
DROP POLICY IF EXISTS maxsom_categoria_produto_manage ON public.categoria_produto;
CREATE POLICY maxsom_categoria_produto_read ON public.categoria_produto
FOR SELECT TO anon, authenticated
USING (ativo IS TRUE OR public.maxsom_is_staff());
CREATE POLICY maxsom_categoria_produto_manage ON public.categoria_produto
FOR ALL TO authenticated
USING (public.maxsom_is_owner())
WITH CHECK (public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_categoria_publicacao_read ON public.categoria_publicacao;
DROP POLICY IF EXISTS maxsom_categoria_publicacao_manage ON public.categoria_publicacao;
CREATE POLICY maxsom_categoria_publicacao_read ON public.categoria_publicacao
FOR SELECT TO anon, authenticated
USING (ativo IS TRUE OR public.maxsom_is_staff());
CREATE POLICY maxsom_categoria_publicacao_manage ON public.categoria_publicacao
FOR ALL TO authenticated
USING (public.maxsom_is_owner())
WITH CHECK (public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_marcas_read ON public.marcas;
DROP POLICY IF EXISTS maxsom_marcas_manage ON public.marcas;
CREATE POLICY maxsom_marcas_read ON public.marcas
FOR SELECT TO anon, authenticated
USING (ativo IS TRUE OR public.maxsom_is_staff());
CREATE POLICY maxsom_marcas_manage ON public.marcas
FOR ALL TO authenticated
USING (public.maxsom_is_owner())
WITH CHECK (public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_configuracao_read ON public.configuracao_loja;
DROP POLICY IF EXISTS maxsom_configuracao_manage ON public.configuracao_loja;
CREATE POLICY maxsom_configuracao_read ON public.configuracao_loja
FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY maxsom_configuracao_manage ON public.configuracao_loja
FOR ALL TO authenticated
USING (public.maxsom_is_owner())
WITH CHECK (public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_produtos_public_read ON public.produtos;
DROP POLICY IF EXISTS maxsom_produtos_owner_manage ON public.produtos;
CREATE POLICY maxsom_produtos_public_read ON public.produtos
FOR SELECT TO anon, authenticated
USING (disponivel IS TRUE OR public.maxsom_is_staff());
CREATE POLICY maxsom_produtos_owner_manage ON public.produtos
FOR ALL TO authenticated
USING (public.maxsom_is_owner())
WITH CHECK (public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_servicos_public_read ON public.servicos;
DROP POLICY IF EXISTS maxsom_servicos_owner_manage ON public.servicos;
CREATE POLICY maxsom_servicos_public_read ON public.servicos
FOR SELECT TO anon, authenticated
USING (ativo IS TRUE OR public.maxsom_is_staff());
CREATE POLICY maxsom_servicos_owner_manage ON public.servicos
FOR ALL TO authenticated
USING (public.maxsom_is_owner())
WITH CHECK (public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_projetos_public_read ON public.projetos;
DROP POLICY IF EXISTS maxsom_projetos_owner_manage ON public.projetos;
CREATE POLICY maxsom_projetos_public_read ON public.projetos
FOR SELECT TO anon, authenticated
USING (publicado IS TRUE OR public.maxsom_is_staff());
CREATE POLICY maxsom_projetos_owner_manage ON public.projetos
FOR ALL TO authenticated
USING (public.maxsom_is_owner())
WITH CHECK (public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_publicacoes_public_read ON public.publicacoes;
DROP POLICY IF EXISTS maxsom_publicacoes_staff_manage ON public.publicacoes;
CREATE POLICY maxsom_publicacoes_public_read ON public.publicacoes
FOR SELECT TO anon, authenticated
USING (publica IS TRUE OR public.maxsom_is_staff());
CREATE POLICY maxsom_publicacoes_staff_manage ON public.publicacoes
FOR ALL TO authenticated
USING (public.maxsom_is_staff())
WITH CHECK (public.maxsom_is_staff());

DROP POLICY IF EXISTS maxsom_fotos_projeto_read ON public."Fotos_projeto";
DROP POLICY IF EXISTS maxsom_fotos_projeto_owner_manage ON public."Fotos_projeto";
CREATE POLICY maxsom_fotos_projeto_read ON public."Fotos_projeto"
FOR SELECT TO anon, authenticated
USING (
  public.maxsom_is_staff()
  OR EXISTS (
    SELECT 1 FROM public.projetos AS p
    WHERE p.id = projeto_id AND p.publicado IS TRUE
  )
);
CREATE POLICY maxsom_fotos_projeto_owner_manage ON public."Fotos_projeto"
FOR ALL TO authenticated
USING (public.maxsom_is_owner())
WITH CHECK (public.maxsom_is_owner());

-- 6) ATENDIMENTO: solicitações e conversas vinculadas ao cliente/equipe.
DROP POLICY IF EXISTS maxsom_solicitacoes_select ON public."solicitações_servico";
DROP POLICY IF EXISTS maxsom_solicitacoes_insert ON public."solicitações_servico";
DROP POLICY IF EXISTS maxsom_solicitacoes_update ON public."solicitações_servico";
DROP POLICY IF EXISTS maxsom_solicitacoes_delete_owner ON public."solicitações_servico";
CREATE POLICY maxsom_solicitacoes_select ON public."solicitações_servico"
FOR SELECT TO authenticated
USING (cliente_id = auth.uid() OR public.maxsom_is_staff());
CREATE POLICY maxsom_solicitacoes_insert ON public."solicitações_servico"
FOR INSERT TO authenticated
WITH CHECK (
  public.maxsom_is_staff()
  OR (cliente_id = auth.uid() AND lower(COALESCE(status, 'solicitado')) = 'solicitado')
);
CREATE POLICY maxsom_solicitacoes_update ON public."solicitações_servico"
FOR UPDATE TO authenticated
USING (
  public.maxsom_is_staff()
  OR (
    cliente_id = auth.uid()
    AND lower(COALESCE(status, '')) IN (
      'aguardando_informacoes', 'aguardando_informação',
      'aguardando_cliente', 'aguardando informações', 'aguardando informação'
    )
  )
)
WITH CHECK (
  public.maxsom_is_staff()
  OR (cliente_id = auth.uid() AND lower(COALESCE(status, '')) = 'solicitado')
);
CREATE POLICY maxsom_solicitacoes_delete_owner ON public."solicitações_servico"
FOR DELETE TO authenticated USING (public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_conversas_select ON public.conversas;
DROP POLICY IF EXISTS maxsom_conversas_insert ON public.conversas;
DROP POLICY IF EXISTS maxsom_conversas_update_staff ON public.conversas;
DROP POLICY IF EXISTS maxsom_conversas_delete_owner ON public.conversas;
CREATE POLICY maxsom_conversas_select ON public.conversas
FOR SELECT TO authenticated
USING (
  public.maxsom_is_staff()
  OR cliente_id = auth.uid()
  OR funcionario_id = auth.uid()
);
CREATE POLICY maxsom_conversas_insert ON public.conversas
FOR INSERT TO authenticated
WITH CHECK (
  public.maxsom_is_staff()
  OR (
    cliente_id = auth.uid()
    AND funcionario_id IS NULL
    AND lower(COALESCE(status, 'aberta')) = 'aberta'
  )
);
CREATE POLICY maxsom_conversas_update_staff ON public.conversas
FOR UPDATE TO authenticated
USING (public.maxsom_is_staff())
WITH CHECK (public.maxsom_is_staff());
CREATE POLICY maxsom_conversas_delete_owner ON public.conversas
FOR DELETE TO authenticated USING (public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_mensagem_select_participants ON public.mensagem;
DROP POLICY IF EXISTS maxsom_mensagem_insert_participants ON public.mensagem;
DROP POLICY IF EXISTS maxsom_mensagem_update_staff ON public.mensagem;
CREATE POLICY maxsom_mensagem_select_participants ON public.mensagem
FOR SELECT TO authenticated
USING (
  public.maxsom_is_staff()
  OR EXISTS (
    SELECT 1 FROM public.conversas AS c
    WHERE c.id = conversa_id
      AND (c.cliente_id = auth.uid() OR c.funcionario_id = auth.uid())
  )
);
CREATE POLICY maxsom_mensagem_insert_participants ON public.mensagem
FOR INSERT TO authenticated
WITH CHECK (
  remetente_id = auth.uid()
  AND (
    public.maxsom_is_staff()
    OR EXISTS (
      SELECT 1 FROM public.conversas AS c
      WHERE c.id = conversa_id AND c.cliente_id = auth.uid()
    )
  )
);
CREATE POLICY maxsom_mensagem_update_staff ON public.mensagem
FOR UPDATE TO authenticated
USING (public.maxsom_is_staff())
WITH CHECK (public.maxsom_is_staff());

-- 7) NOTIFICAÇÕES: cada usuário lê/atualiza as suas; equipe pode notificar.
DROP POLICY IF EXISTS maxsom_notificacao_select ON public.notificacao;
DROP POLICY IF EXISTS maxsom_notificacao_insert_staff ON public.notificacao;
DROP POLICY IF EXISTS maxsom_notificacao_update ON public.notificacao;
DROP POLICY IF EXISTS maxsom_notificacao_delete_owner ON public.notificacao;
CREATE POLICY maxsom_notificacao_select ON public.notificacao
FOR SELECT TO authenticated
USING (usuario_id = auth.uid() OR public.maxsom_is_staff());
CREATE POLICY maxsom_notificacao_insert_staff ON public.notificacao
FOR INSERT TO authenticated
WITH CHECK (public.maxsom_is_staff());
CREATE POLICY maxsom_notificacao_update ON public.notificacao
FOR UPDATE TO authenticated
USING (usuario_id = auth.uid() OR public.maxsom_is_staff())
WITH CHECK (usuario_id = auth.uid() OR public.maxsom_is_staff());
CREATE POLICY maxsom_notificacao_delete_owner ON public.notificacao
FOR DELETE TO authenticated USING (public.maxsom_is_owner());

-- 8) DADOS DO CLIENTE, FUNCIONÁRIOS, GARANTIAS E ARQUIVOS.
DROP POLICY IF EXISTS maxsom_endereco_select ON public.endereco;
DROP POLICY IF EXISTS maxsom_endereco_insert ON public.endereco;
DROP POLICY IF EXISTS maxsom_endereco_update ON public.endereco;
DROP POLICY IF EXISTS maxsom_endereco_delete ON public.endereco;
CREATE POLICY maxsom_endereco_select ON public.endereco
FOR SELECT TO authenticated USING (usuario_id = auth.uid() OR public.maxsom_is_staff());
CREATE POLICY maxsom_endereco_insert ON public.endereco
FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid() OR public.maxsom_is_owner());
CREATE POLICY maxsom_endereco_update ON public.endereco
FOR UPDATE TO authenticated
USING (usuario_id = auth.uid() OR public.maxsom_is_owner())
WITH CHECK (usuario_id = auth.uid() OR public.maxsom_is_owner());
CREATE POLICY maxsom_endereco_delete ON public.endereco
FOR DELETE TO authenticated USING (usuario_id = auth.uid() OR public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_equipamentos_select ON public.equipamentos;
DROP POLICY IF EXISTS maxsom_equipamentos_insert ON public.equipamentos;
DROP POLICY IF EXISTS maxsom_equipamentos_update ON public.equipamentos;
DROP POLICY IF EXISTS maxsom_equipamentos_delete ON public.equipamentos;
CREATE POLICY maxsom_equipamentos_select ON public.equipamentos
FOR SELECT TO authenticated USING (usuario_id = auth.uid() OR public.maxsom_is_staff());
CREATE POLICY maxsom_equipamentos_insert ON public.equipamentos
FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid() OR public.maxsom_is_owner());
CREATE POLICY maxsom_equipamentos_update ON public.equipamentos
FOR UPDATE TO authenticated
USING (usuario_id = auth.uid() OR public.maxsom_is_owner())
WITH CHECK (usuario_id = auth.uid() OR public.maxsom_is_owner());
CREATE POLICY maxsom_equipamentos_delete ON public.equipamentos
FOR DELETE TO authenticated USING (usuario_id = auth.uid() OR public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_funcionario_select ON public.funcionario;
DROP POLICY IF EXISTS maxsom_funcionario_manage_owner ON public.funcionario;
CREATE POLICY maxsom_funcionario_select ON public.funcionario
FOR SELECT TO authenticated
USING (usuario_id = auth.uid() OR public.maxsom_is_staff());
CREATE POLICY maxsom_funcionario_manage_owner ON public.funcionario
FOR ALL TO authenticated
USING (public.maxsom_is_owner())
WITH CHECK (public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_garantia_select ON public.garantia;
DROP POLICY IF EXISTS maxsom_garantia_insert ON public.garantia;
DROP POLICY IF EXISTS maxsom_garantia_update_staff ON public.garantia;
DROP POLICY IF EXISTS maxsom_garantia_delete_owner ON public.garantia;
CREATE POLICY maxsom_garantia_select ON public.garantia
FOR SELECT TO authenticated
USING (cliente_id = auth.uid() OR public.maxsom_is_staff());
CREATE POLICY maxsom_garantia_insert ON public.garantia
FOR INSERT TO authenticated
WITH CHECK (
  public.maxsom_is_staff()
  OR (cliente_id = auth.uid() AND lower(COALESCE(status, 'solicitada')) = 'solicitada')
);
CREATE POLICY maxsom_garantia_update_staff ON public.garantia
FOR UPDATE TO authenticated
USING (public.maxsom_is_staff())
WITH CHECK (public.maxsom_is_staff());
CREATE POLICY maxsom_garantia_delete_owner ON public.garantia
FOR DELETE TO authenticated USING (public.maxsom_is_owner());

DROP POLICY IF EXISTS maxsom_arquivos_select ON public.arquivos;
DROP POLICY IF EXISTS maxsom_arquivos_insert ON public.arquivos;
DROP POLICY IF EXISTS maxsom_arquivos_delete ON public.arquivos;
CREATE POLICY maxsom_arquivos_select ON public.arquivos
FOR SELECT TO authenticated
USING (
  usuario_id = auth.uid()
  OR public.maxsom_is_staff()
  OR EXISTS (
    SELECT 1
    FROM public.mensagem AS m
    JOIN public.conversas AS c ON c.id = m.conversa_id
    WHERE m.id = mensagem_id
      AND c.cliente_id = auth.uid()
  )
);
CREATE POLICY maxsom_arquivos_insert ON public.arquivos
FOR INSERT TO authenticated
WITH CHECK (usuario_id = auth.uid() OR public.maxsom_is_staff());
CREATE POLICY maxsom_arquivos_delete ON public.arquivos
FOR DELETE TO authenticated
USING (usuario_id = auth.uid() OR public.maxsom_is_owner());

-- A agenda existente está ligada a serviços por solicitacao_id no backup.
-- Até esse relacionamento ser revisado, só a equipe autenticada a acessa.
DROP POLICY IF EXISTS maxsom_agenda_staff ON public.agenda;
CREATE POLICY maxsom_agenda_staff ON public.agenda
FOR ALL TO authenticated
USING (public.maxsom_is_staff())
WITH CHECK (public.maxsom_is_staff());

-- 9) Corrige política excessivamente aberta de upload de imagens.
-- Leitura pública de imagens continua como estava no projeto.
DROP POLICY IF EXISTS "Enviar imagens vmbdr4_0" ON storage.objects;
DROP POLICY IF EXISTS maxsom_upload_images_owner ON storage.objects;
CREATE POLICY maxsom_upload_images_owner ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'imagens'
  AND public.maxsom_is_owner()
  AND owner_id = (auth.uid())::text
);

COMMIT;

-- ================================================================
-- APÓS A EXECUÇÃO, use o arquivo separado de verificações SQL.
-- Não execute o backup integral para aplicar essas correções.
-- ================================================================
