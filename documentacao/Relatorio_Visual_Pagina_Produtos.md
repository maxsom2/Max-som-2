# Max Som — Modernização visual da página Produtos

## Objetivo
Modernizar a página `html/produtos.html` para deixar de parecer um catálogo antigo, mantendo a identidade azul-marinho/azul da Max Som, sem alterar o modelo de dados do Supabase.

## Alterações
- Hero em azul-marinho com camadas de gradiente, textura de linhas técnicas e detalhes luminosos azuis.
- Fotografia real local (`assets/galeria-08.jpeg`) no hero, com etiqueta e legenda sobre a foto.
- Destaques visuais para som automotivo, som náutico e som em geral.
- Área de catálogo em painel claro com contorno, sombra discreta e espaçamento maior.
- Busca e filtro com estados de foco fortes, fundo claro e cantos arredondados.
- Cartões reformulados com fotografia maior, borda e sombra, brilho superior, categoria em formato de etiqueta, tipografia com maior contraste e botão de atendimento de largura consistente.
- Estado de carregamento e mensagem vazia mais legíveis.
- Chamada de atendimento no fim da página usando o mesmo padrão escuro/técnico do hero.
- Layout responsivo: duas colunas em celulares comuns e uma coluna em telas abaixo de 380 px.
- Respeito a `prefers-reduced-motion`.
- Se uma imagem de produto vinda do Supabase falhar, o script tenta uma foto local do acervo Max Som, sem inventar nem gravar dados de produtos.

## Arquivos modificados
- `css/products.css`
- `html/produtos.html`
- `js/main.js` (fallback visual para imagem com erro)
- `tests/teste-produtos-visual.js` (novo)

## Verificações
- Testes visuais/estáticos de produtos: 14/14 passaram.
- Testes de lógica existentes: 39/39 passaram.
- Testes de inicialização de formulários: 5/5 passaram.
- JavaScript: verificação de sintaxe passou para todos os arquivos JS e testes.
- CSS: 14 folhas; 0 erros de parsing.
- HTML: 14 páginas; 0 IDs duplicados encontrados por verificação; 0 referências locais quebradas.
- Arquivo de imagem usado no hero existe no pacote.

## O que não foi possível comprovar
A automação do navegador bloqueou a abertura dos arquivos locais com `ERR_BLOCKED_BY_ADMINISTRATOR`. Por isso, não foi possível fazer uma captura do site realmente renderizado nem concluir uma inspeção visual ao vivo. O CSS e o HTML foram alterados e testados estaticamente; o resultado final deve ser conferido depois de publicar na Vercel.

O catálogo permanece conectado ao Supabase. A disponibilidade dos cartões reais depende de produtos publicados e permissões de leitura válidas no banco.
