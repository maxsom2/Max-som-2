# Max Som — status dos testes e pendências

A auditoria técnica foi atualizada em 23/10/2026. Consulte `AUDITORIA_TECNICA_AVANCADA.md` para os resultados por categoria e `auditoria_avancada.json` para os dados detalhados.

## Aprovado localmente
- Sintaxe dos quatro arquivos JavaScript.
- Parsing das 14 folhas CSS; sem variáveis CSS indefinidas.
- 194 referências locais verificadas sem caminhos quebrados.
- Sem IDs HTML duplicados, âncoras sem destino, imagens estáticas sem `alt`, ou botões sem `type` explícito.
- Todos os formulários definem `method="post"`.
- O CSS do menu compartilhado está centralizado em `css/style.css` e as páginas funcionais importam `js/menu.js`.
- 10/10 testes de lógica pura aprovados via `node tests/teste-logica-maxsom.js`.

## Correções feitas
- Destino padrão do login por perfil e bloqueio de redirecionamentos externos.
- Ações para aceitar, solicitar informações e recusar solicitações com histórico preservado.
- Resposta do cliente para pedidos de informações.
- Indicadores administrativos distinguem `0` de erro de consulta.
- Envio de mensagem e marcação de notificação recuperam os botões em caso de falha.
- Links de notificação filtrados contra esquemas perigosos.
- Mensagens de indisponibilidade em páginas com dados dinâmicos quando Supabase ou sessão falham.

## Ainda precisa de teste real
1. Confirmar os nomes exatos das tabelas/colunas no Supabase: o código usa `usuario`, `solicitações_servico`, `mensagem` e `notificacao`.
2. Login, cadastro, confirmação de e-mail e redirecionamento com clientes, funcionários e dono.
3. Policies RLS para leitura/edição de produtos, solicitações, conversas, mensagens e notificações por perfil.
4. CRUD de produtos, serviços, projetos e publicações.
5. Aceitar/recusar/pedir informações nas solicitações, criação da conversa, envio de mensagens e atualização em tempo real.
6. Upload de anexos: ainda não implementado, pois exige configuração confirmada do Supabase Storage e de suas policies.
7. Notificações automáticas por e-mail/WhatsApp, preferências de canal e log completo de atividade: ainda não completos.
8. Teste visual em navegador comum, desktop e celular. O Chromium/Playwright do ambiente de auditoria bloqueou a abertura da página local.

**Conclusão:** o pacote passou nos testes locais disponíveis, mas não deve ser tratado como validado ponta a ponta até os itens acima serem testados com o Supabase real.
