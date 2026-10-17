# Max Som — revisão e organização do projeto

## O que foi corrigido nesta entrega

- Padronizados os caminhos locais para `js/main.js` e para a biblioteca do Supabase.
- Removidos carregamentos duplicados do SDK e do `main.js` na página de login.
- Removidas referências a `js/supabase-config.js` e `js/atendimento.js`, que não existiam no pacote; as funções de atendimento já estão centralizadas em `js/main.js`.
- Corrigido o caminho de CSS da página Produtos para `css/products.css`.
- Corrigidos os caminhos da logo para `assets/logo-maxsom-white.png`, sem substituir a imagem.
- Corrigidos os campos de publicação para respeitar `publicacoes.publica` no backup do banco.
- Corrigido o campo de modelo do produto para respeitar a coluna com maiúscula e aspas `produtos."Modelo"`.
- Corrigida a referência da mensagem de login na página legada Minha Conta.
- Tornado seguro o arquivo legado `js/menu.js`; o menu ativo continua centralizado em `js/main.js`.
- Adicionada uma base de CSS compartilhada para o menu lateral, logo, navegação, cabeçalho, área principal, rodapé e telas menores, mantendo azul-marinho, azul e branco.
- Ajustados os seletores de `css/services.css` para a marcação atual de `servicos.html`.

## Organização das partes da interface

1. **Menu lateral (`.sidebar`)** — navegação entre Início, Produtos, Serviços, Projetos, Publicações e Atendimento.
2. **Logo (`.brand` / `.brand-logo`)** — leva à página inicial e usa a imagem existente em `assets`.
3. **Navegação (`.side-nav`, `.nav-link`, `.nav-icon`)** — lista as páginas e indica a página atual.
4. **Opções inferiores (`.sidebar-bottom`)** — Ajuda e Minha conta.
5. **Sobreposição móvel (`.sidebar-overlay`)** — fecha o menu quando se toca fora dele no celular.
6. **Cabeçalho (`.topbar`)** — caminho da página, ajuda e acesso à conta.
7. **Conteúdo (`main`)** — conteúdo específico de cada página.
8. **Rodapé (`.site-footer`)** — informações finais da empresa.
9. **CSS global (`css/style.css`)** — identidade e estrutura compartilhada. Cada página mantém seu CSS próprio, por exemplo `css/services.css`, `css/products.css` e `css/projects.css`.
10. **JavaScript principal (`js/main.js`)** — navegação, autenticação, carregamento de dados, solicitações, conversas, notificações e painel administrativo.
11. **Cliente Supabase** — o SDK é carregado antes de `js/main.js`; a inicialização do cliente fica centralizada no arquivo principal.

## Testes feitos localmente

- Conferência dos caminhos locais `src` e `href` encontrados nas páginas HTML: nenhum arquivo local ausente foi detectado.
- `node --check` executado em todos os arquivos JavaScript do pacote: sem erros de sintaxe após as correções.
- Comparação dos nomes de tabelas e colunas usados pelo código com o backup SQL fornecido.

## Limitações que exigem autorização antes de mexer no Supabase

**Nenhuma alteração foi executada no banco.** O backup SQL mostra RLS ativado nas tabelas públicas, mas só uma política explícita para uma tabela do schema `public` (`usuario_ver_dados`, SELECT em `usuario`). Isso indica que operações de leitura/gravação nas outras tabelas podem ser bloqueadas por RLS até que políticas apropriadas sejam configuradas. Não criei nem alterei políticas, permissões, tabelas ou dados.

Antes de afirmar que todos os fluxos estão operacionais em produção, é necessário testar com uma sessão real e revisar as políticas existentes diretamente no projeto Supabase. Se o banco bloquear a operação, o código mostrará erro em vez de contornar a segurança.

O backup também contém colunas com nomes incomuns/typos (por exemplo, `arquigo_url`, `friado_em`, `cidadd`) e colunas obrigatórias com defaults. Esses nomes foram preservados; não foram renomeados no banco.

## Importante

- Este site é de **divulgação e atendimento**, não uma loja virtual. Não foram adicionados carrinho, checkout, pagamento ou compra direta.
- As imagens existentes e a logo foram mantidas.
- Nenhum SQL foi executado e nenhum dado do Supabase foi alterado.
