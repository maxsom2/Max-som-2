# Max Som — auditoria de integração com o Supabase

**Data da revisão:** 23/10/2026  
**Base:** `MaxSom_Projeto_Revisado_Final.zip`, `MaxSom_Supabase_Tabelas_RLS_Backup.sql` e captura `.mhtml` do SQL Editor enviados nesta conversa.

## Diagnóstico principal

O backup SQL mostra 20 tabelas de aplicação no schema `public`. A Row Level Security (RLS) está habilitada nessas tabelas, mas há apenas uma política de aplicação em `public`: `usuario_ver_dados`, que permite a um usuário autenticado consultar seu próprio perfil. Não há políticas de aplicação para as operações usadas em serviços, produtos, projetos, publicações, solicitações, conversas, mensagens e notificações. Com RLS habilitada, essas leituras/gravações são bloqueadas mesmo quando a autenticação do Supabase funciona.

Foram confirmadas incompatibilidades entre os nomes usados no JavaScript e o esquema real:

| Área | Nome no código anterior | Nome no backup SQL |
|---|---|---|
| Conversas | `atendente_id` | `funcionario_id` |
| Publicações | `publicado` | `publica` |
| Produtos | `modelo` (minúsculo) | `"Modelo"` (maiúsculo e entre aspas no PostgreSQL) |

A captura `.mhtml` enviada é uma página do SQL Editor com apenas 100 linhas do resultado de uma consulta a `information_schema.columns`; ela confirma parte do esquema, mas não contém o inventário completo das políticas. Para essa análise, foi utilizado o backup SQL integral.

## Correções no código

- Consultas de conversas agora utilizam `funcionario_id`.
- Listagem, edição e publicação de publicações usam a coluna `publica`.
- Leitura e gravação de produtos usam exatamente a coluna `"Modelo"`.
- A folha `css/publicacoes.css` foi alinhada às classes reais de `html/publicacoes.html` e dos cartões montados pelo JavaScript.
- O fluxo de iniciar conversa verifica se o cliente Supabase está disponível antes de tentar consultá-lo e dá uma mensagem compreensível quando a conexão não carregou.
- Foram preservadas as pastas da aplicação e os caminhos relativos de HTML, CSS, JavaScript e imagens.

## Migração preparada

O arquivo `Supabase_Corrigir_Politicas_MaxSom.sql` contém uma migração pontual que:

- cria funções auxiliares para consultar, com segurança, o perfil e os papéis de usuário;
- concede privilégios de tabela compatíveis com o aplicativo, mantendo a decisão de acesso nas políticas RLS;
- cria políticas de leitura para conteúdo público ativo/publicado e políticas de gestão para dono/equipe conforme a área;
- permite que usuários autenticados consultem/criem seu próprio perfil como cliente;
- cria políticas para solicitações, conversas, mensagens, notificações, dados do cliente, arquivos e agenda;
- remove a política antiga que permitia inserir imagens sem autenticação/restrição e a substitui por uma política de upload restrita ao dono autenticado.

**A migração ainda não foi executada no projeto real do Supabase.** Ela muda privilégios e políticas, mas não cria, renomeia ou apaga tabelas e não altera as linhas de dados existentes. Por se tratar de uma mudança de segurança, faça um backup atual pelo painel antes de executá-la. O dump integral enviado contém objetos internos do Supabase e dados do projeto; não o importe para tentar aplicar as correções.

## Observação de integridade de conta

No backup fornecido, um registro de `public.usuario` tem um identificador que não corresponde a nenhum usuário de `auth.users` presente no mesmo backup. Não foi feita associação ou exclusão automática: a tabela `usuario` não contém e-mail para permitir identificar com segurança a conta correspondente. Esse registro deve ser conferido manualmente no painel de Authentication e Table Editor antes de qualquer correção de dados.

## Resultados dos testes locais

- `node --check` passou nos quatro arquivos JavaScript.
- Testes automatizados de lógica/regressão: **27/27 passaram**.
- Foram examinados 14 HTML, 14 CSS e 4 JavaScript.
- Parsing de CSS: zero erros.
- Referências locais verificadas em HTML/CSS: **210**, com zero caminhos quebrados.
- IDs duplicados: zero.
- Âncoras locais sem destino: zero.
- Imagens estáticas sem `alt`: zero.

Os testes são estáticos e testes de funções puras; eles não equivalem a testar a aplicação conectada no navegador. Não foi possível executar nesta sessão um cadastro, login, gravação ou consulta contra o Supabase real. Portanto, o funcionamento ponta a ponta permanece pendente até aplicar a migração revisada e testar com contas cliente, funcionário e dono.

## Ordem recomendada

1. Baixe e preserve um backup atual pelo Supabase.
2. No SQL Editor, execute apenas `Supabase_Corrigir_Politicas_MaxSom.sql` — nunca o dump integral.
3. Se houver qualquer erro, pare e guarde a mensagem completa para diagnóstico; não tente corrigir por tentativa e erro.
4. Execute `Supabase_Verificar_Politicas_MaxSom.sql`, somente leitura, e confira os resultados.
5. Teste cadastro/login, início de conversa, envio de solicitação, resposta de mensagem e leitura pública do catálogo em navegador real.
6. Teste separadamente os papéis cliente, funcionário e dono para confirmar que a RLS não permite acesso indevido.

O pacote não contém chaves `service_role` no JavaScript de front-end e nenhuma alteração foi aplicada ao banco real durante esta revisão.
