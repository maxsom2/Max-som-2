# Max Som — projeto consolidado

Esta é a versão consolidada do projeto Max Som, unindo as correções de integração com o menu aprimorado e as imagens adicionais do ZIP do professor.

## Estrutura para o GitHub/Vercel
- `index.html` na raiz redireciona para `html/index.html`.
- Páginas HTML ficam em `html/`.
- CSS fica em `css/`; JavaScript em `js/`; imagens em `assets/`.
- Testes em `tests/`; relatórios e SQLs em `documentacao/`.

## Testes
Execute `node tests/teste-logica-maxsom.js` com Node.js. A auditoria desta versão registra 34/34 testes de lógica e 7/7 testes de interação simulada. Isso não substitui cadastro/login reais no Supabase.

## HTTP 405
Os formulários POST estáticos bloqueiam a navegação nativa se o manipulador JavaScript não estiver disponível; eles mostram uma mensagem ao invés de enviar o formulário para a URL da página HTML.

## Atenção
Não foi executada a migração SQL nem alterado o banco Supabase. Cadastro, login e operações protegidas devem ser testados no site publicado depois de verificar as políticas RLS. Consulte `documentacao/Consolidacao_Final_Menu_HTTP405.md`.
