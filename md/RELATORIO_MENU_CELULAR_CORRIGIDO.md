# Max Som — Correção do menu lateral no celular

## Diagnóstico
Na versão anterior, o botão de abrir o menu móvel (`#mobileMenu`) tinha seu evento de clique ligado por `js/main.js`, durante a inicialização geral da aplicação. O componente compartilhado `js/menu.js` criava a barra lateral e o fundo, mas não controlava diretamente o botão hambúrguer. Assim, se `main.js` não carregasse ou encontrasse uma exceção antes de executar `setupLayoutMenu()`, o botão ficava sem evento. O CSS global também continha várias versões das regras de menu, incluindo estados `mobile-sidebar-open` e `sidebar-open`, aumentando a chance de conflito na cascata.

## Correções aplicadas
- O botão hambúrguer recebe agora seu evento diretamente em `js/menu.js`, independente do Supabase.
- Um único helper sincroniza `mobile-sidebar-open`, `sidebar-open` e `menu-open`, as classes da barra lateral e do fundo.
- O menu fecha pelo botão X, pelo fundo, por Escape, ao escolher um link e ao girar para uma largura desktop.
- O `data-layout-menu-bound` evita que `main.js` registre um segundo evento no mesmo botão.
- Foi acrescentada uma regra CSS final para assegurar a largura, a transformação e a hierarquia visual da gaveta e do fundo em telas de até 768 px.

## Verificações
- `node --check js/menu.js` — aprovado.
- `node --check js/main.js` — aprovado.
- `node tests/teste-logica-maxsom.js` — veja o total no fim da saída de testes.

## Limitação
Não foi possível testar o domínio da Vercel nem simular cliques reais no navegador deste ambiente, porque a política de navegação bloqueia o acesso às páginas locais. Portanto, estas alterações corrigem o vínculo do evento e a cascata do CSS pelo código, mas a confirmação final deve ser feita no celular após a nova implantação. Não foi feita nenhuma alteração no Supabase.
