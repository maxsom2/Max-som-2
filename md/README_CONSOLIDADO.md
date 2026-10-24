# Max Som — projeto consolidado

Esta é a versão consolidada do projeto Max Som, unindo as correções de integração com o menu aprimorado e as imagens adicionais do ZIP do professor.

## Estrutura para o GitHub/Vercel
- `index.html` na raiz redireciona para `html/index.html`.
- Páginas HTML ficam em `html/`.
- CSS fica em `css/`; JavaScript em `js/`; imagens em `assets/`.
- Testes em `tests/`; relatórios e SQLs em `documentacao/`.

## Testes
Execute `node tests/teste-logica-maxsom.js` com Node.js. Os testes verificam lógica e regressões estáticas, incluindo o evento móvel agora associado diretamente em `js/menu.js`. A aprovação desses testes não substitui a confirmação visual em dispositivo nem cadastro/login reais no Supabase.

## Menu móvel
O botão hambúrguer, o botão de fechar, o fundo escurecido, a tecla Escape e o fechamento após selecionar uma página são controlados diretamente por `js/menu.js`; o funcionamento do menu não depende da inicialização do Supabase em `js/main.js`.

## HTTP 405
Os formulários POST estáticos bloqueiam a navegação nativa se o manipulador JavaScript não estiver disponível; eles mostram uma mensagem ao invés de enviar o formulário para a URL da página HTML.

## Atenção
Não foi executada a migração SQL nem alterado o banco Supabase. Cadastro, login e operações protegidas devem ser testados no site publicado depois de verificar as políticas RLS. Consulte `documentacao/Consolidacao_Final_Menu_HTTP405.md`.
