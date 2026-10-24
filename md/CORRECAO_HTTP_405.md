# Correção do HTTP 405 no cadastro — Max Som

## O que significa o erro
A captura mostra que o navegador envia o formulário por HTTP POST diretamente para `/html/cadastro.html`. Em hospedagem estática, essa URL serve um documento HTML; não é um endpoint que cria contas. Isso acontece quando o JavaScript não intercepta o envio — por exemplo, se os eventos ainda não foram ligados ou se `js/main.js` não foi carregado/publicado.

## Correções aplicadas
- `js/main.js`: login, cadastro, atendimento e botões de conversa são inicializados antes da primeira espera assíncrona da sessão, reduzindo a janela em que um clique poderia disparar o envio nativo.
- Formulários HTML de cadastro/login/atendimento/conversa e formulários administrativos: incluído um bloqueio de segurança quando o respetivo handler ainda não está ligado. No cadastro e login, a página exibe uma mensagem em vez de enviar a senha/dados para a URL ou receber HTTP 405.
- `js/main.js`: erros de cadastro também são registrados no Console do navegador para facilitar o diagnóstico.
- `tests/teste-logica-maxsom.js`: adicionados testes de regressão para os formulários.

## Como publicar a correção
1. Descompacte `MaxSom_Arquivos_Correcao_HTTP_405.zip`.
2. Envie os arquivos extraídos para o repositório substituindo os arquivos dos mesmos caminhos (`html/`, `js/` e `tests/`). Não envie o ZIP fechado esperando que o GitHub o extraia.
3. Aguarde a implantação do Vercel terminar e abra `/html/cadastro.html`.
4. Use `Ctrl+Shift+R` para forçar uma atualização e tente novamente.

## Como interpretar o próximo resultado
- Se o cadastro mostrar uma mensagem de sucesso ou de confirmação de e-mail, o JavaScript interceptou o formulário.
- Se mostrar que o formulário não terminou de carregar, confira na implantação se `js/main.js` existe na raiz publicada e responde com status 200; se não carregar, verifique os caminhos e a Root Directory do Vercel.
- Se a página mostrar um erro do Supabase, isso já é uma falha diferente de HTTP 405. Copie a mensagem visível e, se necessário, a mensagem do Console. A operação de criação de perfil também depende das políticas RLS reais.

## Limite desta correção
Os testes locais confirmam a sintaxe, a presença dos bloqueios e a lógica estática, não a criação real de usuários no Supabase. O ambiente desta auditoria não conseguiu acessar o site implantado nem executar um cadastro real. Esta correção não altera o banco nem executa migrações SQL.
