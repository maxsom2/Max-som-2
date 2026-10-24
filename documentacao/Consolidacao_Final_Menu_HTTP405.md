# Max Som — consolidação do projeto, menu e HTTP 405

## Resultado

Esta versão combina a base funcional de integração e as correções de formulário com o menu aprimorado enviado pelo professor. O projeto não foi conectado nem alterado diretamente no Supabase.

## Estrutura preservada

- `index.html`: página de entrada na raiz, que encaminha para `html/index.html`.
- `html/`: 14 páginas HTML da aplicação.
- `css/`: 14 folhas de estilo, com `style.css` como folha global do layout e do menu.
- `js/`: 4 arquivos JavaScript da aplicação.
- `assets/`: 42 imagens, incluindo a logo original e as fotografias dos dois ZIPs.
- `tests/`: testes de regressão locais.
- `documentacao/`: relatórios, estatísticas e SQLs de verificação/migração.

Os arquivos HTML principais estão em `html/`; os arquivos CSS e JavaScript continuam separados por pasta. Não foi incluída a pasta `.git` do ZIP do professor.

## Menu compartilhado

- A barra lateral é gerada por `js/menu.js`; as páginas não mantêm cópias independentes da barra lateral.
- A logo aparece somente como a imagem `assets/logo-maxsom-white.png` (sem o texto “MAX SOM” adicionado ao lado).
- O menu de computador recolhe de 250 px para 76 px e persiste a preferência local.
- O menu móvel usa uma gaveta lateral, o botão do cabeçalho, o botão X, o overlay e a tecla Escape.
- `css/style.css` contém os estilos compartilhados e regras de compatibilidade para o menu.
- O overlay é marcado para evitar que `menu.js` e `main.js` registrem dois manipuladores equivalentes.

## Correção do HTTP 405

Os oito formulários estáticos que usam `method="post"` agora chamam `event.preventDefault()` diretamente no evento inline antes de delegar o processamento aos manipuladores JavaScript. Se o manipulador da aplicação ainda não estiver conectado, o formulário exibe uma mensagem para atualizar a página em vez de enviar dados para a própria página HTML estática. Se o manipulador já estiver conectado, o evento continua a se propagar e a lógica do `main.js` processa o cadastro/login/atendimento normalmente.

Isso evita o POST nativo para `/html/cadastro.html`, que pode gerar HTTP 405 em uma hospedagem estática. A correção não garante que o Supabase aceite a criação da conta: disponibilidade da API, confirmação de e-mail, esquema das tabelas e políticas RLS ainda precisam ser validados no ambiente publicado.

## Verificações realizadas

- `node --check` em todos os JavaScript e no arquivo de testes.
- 34/34 testes de lógica e regressão passaram.
- 7/7 testes de interação em DOM de navegador simulado passaram: guarda nativa de cadastro com e sem `main.js`, menu compartilhado, logo somente imagem, recolhimento no desktop, abertura/fechamento móvel e presença do menu/CSS da página Publicações.
- 14 páginas HTML, 14 folhas CSS, 4 arquivos JavaScript e 42 imagens no pacote.
- 196 referências locais conferidas nas páginas HTML; nenhuma quebrada.
- Nenhum ID duplicado; nenhum erro de parsing CSS; nenhum arquivo de imagem inválido.
- Os oito formulários POST têm proteção explícita contra envio nativo.

### Limitação dos testes

O ambiente bloqueou navegação de navegador para `localhost` e `file://`. Por isso, os testes de interação usaram o HTML e os arquivos JS/CSS carregados em memória no Chromium, não o site publicado. Não houve autenticação real, inserção no banco nem teste das políticas RLS. O SQL incluído em `documentacao/` é material para revisão e não foi executado.

## Publicação

Descompacte o ZIP na pasta do repositório e envie o **conteúdo da pasta extraída** para a raiz do GitHub. A raiz do repositório deve conter `index.html` e as pastas `html/`, `css/`, `js/`, `assets/`, `tests/` e `documentacao/`. Não envie apenas o arquivo ZIP nem coloque tudo dentro de uma segunda pasta `MaxSom/` no repositório.

Depois da implantação da Vercel, teste cadastro e login no domínio publicado. Se o HTTP 405 não ocorrer, mas aparecer uma mensagem do Supabase, copie o erro do Console para investigar a integração real.
