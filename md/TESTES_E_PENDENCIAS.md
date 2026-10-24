# Max Som — status dos testes e pendências

A auditoria técnica foi atualizada em 23/10/2026. Consulte `AUDITORIA_TECNICA_AVANCADA.md` para os resultados por categoria e `auditoria_avancada.json` para os dados detalhados.

## Aprovado localmente nesta rodada
- Sintaxe dos quatro arquivos JavaScript.
- Parsing das 14 folhas CSS, sem erros de parsing.
- Referências locais CSS/JS/imagens/páginas sem caminhos quebrados.
- Sem IDs HTML duplicados, âncoras locais sem destino ou imagens estáticas sem `alt`.
- Os quatro pontos de incompatibilidade de nomes foram corrigidos no JavaScript: `atendente_id` → `funcionario_id`, `publicado` → `publica` apenas em publicações, e `modelo` → `Modelo` para a coluna de produto.
- Classes da página Publicações agora correspondem ao HTML e os cards dinâmicos usam as classes do seu CSS.
- 27/27 testes de lógica e regressão aprovados via `node tests/teste-logica-maxsom.js`.

## Correções feitas
- Destino padrão do login por perfil e bloqueio de redirecionamentos externos.
- Ações para aceitar, solicitar informações e recusar solicitações com histórico preservado.
- Resposta do cliente para pedidos de informações.
- Indicadores administrativos distinguem `0` de erro de consulta.
- Envio de mensagem e marcação de notificação recuperam os botões em caso de falha.
- Links de notificação filtrados contra esquemas perigosos.
- Mensagens de indisponibilidade em páginas com dados dinâmicos quando Supabase ou sessão falham.

## Ainda precisa de teste real
1. Aplicar com cuidado `documentacao/Supabase_Corrigir_Politicas_MaxSom.sql` no SQL Editor, depois de guardar o backup, e rodar `documentacao/Supabase_Verificar_Politicas_MaxSom.sql`. A migração foi criada, mas não executada.
2. Login, cadastro, confirmação de e-mail e redirecionamento com clientes, funcionários e dono.
3. CRUD de produtos, serviços, projetos e publicações com RLS real.
4. Aceitar/recusar/pedir informações nas solicitações, criação da conversa, envio de mensagens e atualização em tempo real.
5. Um registro de `public.usuario` no dump tem `id` que não corresponde a nenhum `auth.users` do mesmo backup. Não foi apagado nem associado automaticamente; a tabela não tem e-mail para permitir uma associação segura.
6. Upload de anexos: ainda não implementado; exige integração com Storage e teste das políticas correspondentes.
7. Notificações automáticas por e-mail/WhatsApp, preferências de canal e log completo de atividade ainda não estão completos.
8. Teste visual no navegador comum em desktop e celular. O ambiente de auditoria não permitiu concluir interação visual ponta a ponta.

## Problemas do esquema que não foram renomeados
O backup contém nomes inconsistentes como `Fotos_projeto.arquigo_url`, `arquivos.friado_em`, `endereco.cidadd` e `garantia."atualizado em"`. Não renomeei essas colunas porque o site atual não depende delas e alterar o banco poderia quebrar relações existentes.

**Conclusão:** o pacote passou nos testes locais disponíveis, mas não deve ser tratado como validado ponta a ponta até os itens acima serem testados com o Supabase real.
