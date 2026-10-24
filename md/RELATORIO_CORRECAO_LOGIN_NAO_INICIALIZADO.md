# Max Som — correção da mensagem “O formulário de login não terminou de carregar”

## Diagnóstico
A mensagem era exibida pelo `onsubmit` inline em `html/login.html` sempre que `form.dataset.loginBound` não tinha o valor `true`. No código principal, esse atributo era configurado por `setupLogin()` dentro de `initializeMaxSom()`. Portanto, a mensagem indicava que o handler principal não havia sido conectado ao formulário; não indicava diretamente senha incorreta nem uma falha específica do Supabase.

Causas possíveis no site publicado: `js/main.js` ausente/404, arquivo diferente do ZIP atual, erro de execução antes da inicialização, implantação incompleta ou cache de uma versão anterior. O ambiente desta auditoria não conseguiu acessar o domínio publicado para distinguir qual destas causas está ocorrendo ao vivo.

## Alterações desta versão
1. Exportei `setupLogin` e `setupSignup` no objeto `window.MaxSom` para permitir uma inicialização explícita.
2. Adicionei `js/auth-forms-bootstrap.js` e incluí o script em `html/login.html` e `html/cadastro.html`.
3. O bootstrap reutiliza os handlers do `main.js` quando eles estão disponíveis. Caso o script principal não esteja disponível, conecta handlers de contingência aos formulários.
4. O formulário continua impedido de enviar um POST nativo para `login.html`/`cadastro.html`.
5. O caminho de contingência mostra erros úteis se o SDK do Supabase, a autenticação, a leitura do perfil ou a política INSERT da tabela `usuario` falharem.
6. Atualizei a mensagem de bloqueio para pedir a verificação dos arquivos JavaScript publicados, em vez de apenas “atualize e tente novamente”.
7. Adicionei testes de regressão para os dois cenários: handler principal disponível e ausência do `main.js`.

## Verificações realizadas
- `node --check` em todos os arquivos JS do projeto e nos testes: aprovado.
- Suíte existente `tests/teste-logica-maxsom.js`: 39/39 aprovados.
- Nova suíte `tests/teste-inicializacao-formularios.js`: 5/5 aprovados.
- Referências locais no HTML (incluindo `index.html` da raiz): 200 verificadas, 0 quebradas.
- URLs locais `url(...)` nas folhas CSS: 14 verificadas, 0 quebradas.
- Páginas HTML: 14 em `html/` mais `index.html` na raiz.
- Folhas CSS: 14.
- Arquivos JS: 5.
- Imagens e outros arquivos de assets: 42.

## Limitações
Estes são testes de código/ambiente local. Não foi possível testar uma sessão de login contra o Supabase real nem confirmar a resposta do domínio Vercel nesta execução. A contingência precisa que `js/auth-forms-bootstrap.js`, `js/supabase.js` e os recursos relacionados estejam publicados em suas pastas corretas. Se o domínio continuar a servir um diretório diferente do ZIP, o HTML e os scripts devem ser publicados juntos na raiz correta do projeto.

## Publicação
Descompacte o ZIP e envie o conteúdo para a raiz correta do repositório, preservando a estrutura `html/`, `js/`, `css/` e `assets/`. Confirme especialmente que estes arquivos estão publicados:
- `html/login.html`
- `html/cadastro.html`
- `js/main.js`
- `js/supabase.js`
- `js/auth-forms-bootstrap.js`

Depois faça uma implantação nova na Vercel e atualize a página sem cache. Não execute nenhum SQL por causa desta mensagem; ela é exibida antes de o envio de login chegar ao Supabase.
