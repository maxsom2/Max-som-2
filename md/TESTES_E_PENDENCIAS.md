# Max Som — relatório de auditoria desta versão

## Correções feitas nesta rodada
- Corrigida a visibilidade dos links do menu para visitantes, usuários logados, funcionários e dono. O CSS global escondia links logados mesmo depois de o JavaScript limpar o estilo inline.
- Removidos os eventos duplicados do menu em `html/publicacoes.html`; a página agora deixa o menu lateral a cargo de `js/menu.js` e `js/main.js`.
- Removidas regras de menu duplicadas de `css/products.css`, `css/publicacoes.css` e `css/atendimento.css`. O menu e seu comportamento visual ficam centralizados em `css/style.css`.
- Evitado o risco de bloqueio de consultas dentro de `onAuthStateChange`: as operações assíncronas são executadas depois que o callback do SDK retorna.
- A ação de solicitar acesso administrativo não altera mais `tipo_usuario` do próprio cliente. Ela prepara uma mensagem para o WhatsApp da empresa; a autorização real continua reservada a uma conta autorizada.
- Acrescentadas mensagens claras de indisponibilidade quando o Supabase não está carregado e o catálogo público não consegue buscar conteúdo.
- Mantidas as tabelas e os nomes de campos já usados pelo projeto. Nenhum SQL foi executado e nenhuma tabela, política ou dado foi alterado.

## Verificações locais concluídas
- `node --check` passou nos quatro arquivos JavaScript: `main.js`, `menu.js`, `supabase.js` e `login.js`.
- Todos os 14 HTMLs têm estrutura `html/head/body`, sem IDs duplicados detectados.
- Todas as referências locais `href` e `src` nos HTMLs apontam para arquivos existentes.
- Nas 13 páginas que inicializam a aplicação, a ordem dos scripts está correta: SDK Supabase → cliente compartilhado → menu → lógica principal.
- Os 14 arquivos CSS foram analisados sintaticamente sem erros de parsing detectados.
- A folha `css/style.css` é a única folha que contém regras do menu compartilhado; as folhas específicas não duplicam mais seus seletores.
- `publicacoes.html` não mantém mais listeners próprios de abrir/fechar o menu.
- A integridade do ZIP final foi verificada com `unzip -t`.

## O que ainda depende de validação no Supabase real
Não é possível certificar estas operações apenas com arquivos locais:
1. Cadastro, confirmação de e-mail, login e recuperação de senha com as configurações reais de Auth.
2. Leitura/criação do perfil em `usuario` e as políticas RLS aplicadas.
3. Inserção, edição e exclusão de produtos, serviços, projetos e publicações.
4. Solicitações, transições de status e associação formal entre solicitação e conversa.
5. Envio de mensagens, notificações e atualização em tempo real.
6. Garantia de que clientes não leem dados de outros clientes e que funcionários não conseguem executar operações reservadas ao dono.
7. Uploads e permissões do Supabase Storage.

A associação formal entre uma solicitação e uma conversa precisa ser conferida com o esquema real. Não foi criada uma coluna ou tabela para isso porque a instrução é preservar o banco sem autorização.

## Segurança
A ocultação de controles no navegador é apenas uma camada de interface. As permissões reais precisam ser garantidas pelas políticas RLS do Supabase. Não há chave `service_role` no front-end. Não contorne erros de RLS desativando a segurança.

## Escopo preservado
- Site informativo e de atendimento; sem carrinho, checkout ou pagamento.
- Logo e fotos originais preservadas.
- HTML em `html/`, estilos em `css/`, scripts em `js/` e imagens em `assets/`.
