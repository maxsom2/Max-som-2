# Max Som — projeto organizado

## Pastas
- `html/`: todas as páginas do site.
- `css/`: estilo global compartilhado e estilo específico de cada página. `css/style.css` é a fonte única do menu e da identidade visual.
- `js/`: `supabase.js` cria o cliente compartilhado, `menu.js` desenha o menu único e `main.js` contém os fluxos da aplicação.
- `assets/`: fotos e logo originais.
- `index.html`: entrada da raiz, redirecionando para `html/index.html`.

## Abrir
Publique/abra usando um servidor estático (por exemplo, Live Server ou hospedagem da aplicação), começando por `index.html`. As páginas internas estão em `html/`.

## Integração Supabase
A URL e a chave publicável existentes foram mantidas. A chave publicável pode estar no navegador, desde que as políticas RLS do Supabase controlem as operações. Não existe chave secreta/service-role no front-end.

## O que foi alterado
- Uma única definição do menu compartilhado gerado por `js/menu.js`, com itens públicos, atalhos de conta/conversas e item administrativo condicionado ao perfil.
- O comportamento do menu permanece coordenado com `js/main.js`, incluindo menu móvel, botão recolher/expandir e preferência de recolhimento no navegador.
- O CSS global foi substituído pelo stylesheet compartilhado fornecido, com regras de compatibilidade para as páginas existentes.
- O CSS incompleto da autenticação foi reconstruído.
- O cliente Supabase fica centralizado em `js/supabase.js`; `main.js` reutiliza essa instância única e as páginas carregam SDK → cliente → menu → lógica da aplicação.
- HTMLs movidos para `html/` e os caminhos de CSS, JavaScript e imagens ajustados.
- A gestão de usuários, produtos, serviços e projetos foi restringida na interface ao dono/administrador principal; funcionários ficam com as seções operacionais e publicações. Isso complementa, mas não substitui, RLS no banco.
- Corrigida a visibilidade dos links logados no menu e removidos eventos duplicados da página Publicações.
- Regras de menu centralizadas em `css/style.css`; folhas específicas não duplicam mais o menu.
- A ação de pedir acesso administrativo não altera o perfil do próprio usuário; encaminha o pedido para contato com a equipe.
- Login/cadastro agora informam claramente quando não conseguem ler ou criar o perfil em `usuario`.
- A página inicial tem alvos reais para carregar produtos, serviços, projetos e publicações em destaque.
- Busca/filtro de produtos usa os registros carregados e tenta preencher as categorias e marcas a partir das tabelas já existentes.
- Consultas de conversas usam `funcionario_id`, conforme o esquema real; publicações usam `publica`; produtos usam a coluna exata `"Modelo"`. A folha de estilos de Publicações foi alinhada às classes do HTML, e os cards dinâmicos usam as classes que o CSS define.

## Testes locais feitos nesta versão
- Sintaxe de todos os arquivos JavaScript (`node --check`).
- Existência das referências locais a CSS, JS, imagens e páginas.
- Parsing de todas as 14 folhas CSS.
- Nenhum ID duplicado, âncora ou referência local quebrada.
- 27/27 testes automatizados de lógica e regressão aprovados.
- Comparação das colunas usadas pelo JavaScript com o backup SQL enviado.
- Veja `TESTES_E_PENDENCIAS.md` para correções e limitações que dependem de uma sessão real do Supabase.

## Integração com o banco enviado
- O esquema do backup tinha RLS ativado em 20 tabelas públicas, mas apenas uma política para `public.usuario`; isso bloqueava boa parte das leituras e gravações autenticadas.
- Foi incluída a migração `documentacao/Supabase_Corrigir_Politicas_MaxSom.sql` para revisão. Ela não foi executada no projeto Supabase.
- Depois de fazer/confirmar o backup, revise a migração e execute-a no SQL Editor do projeto. Em seguida, execute `documentacao/Supabase_Verificar_Politicas_MaxSom.sql` para verificar as políticas.
- Não importe `MaxSom_Supabase_Tabelas_RLS_Backup.sql` para aplicar correções; é um dump amplo, não uma migração pontual.

## Limites importantes
Não foi possível executar autenticação, gravações ou consultas com uma sessão real do Supabase neste ambiente. Nenhuma tabela, política ou dado do banco real foi modificado. O funcionamento ponta a ponta ainda depende de aplicar e verificar a migração, testar login/cadastro e fazer testes reais com os perfis cliente, funcionário e dono. Anexos de conversa continuam sem upload implementado; exigem integração com Storage e teste das políticas correspondentes.

O site continua informativo e de atendimento, sem carrinho, checkout ou pagamento.
- Removidas regras antigas de menu que estavam duplicadas no CSS de Produtos; o menu compartilhado agora usa o mesmo `css/style.css` global.
- Corrigidos marcadores de bloco de código que tinham sido colados no HTML da página de Atendimento.
- Ajustado o fluxo de solicitação para abrir o WhatsApp diretamente durante a ação do usuário, evitando que a nova aba seja bloqueada após uma chamada assíncrona; a interface informa quando não foi possível confirmar o registro no banco.


## Auditoria final desta versão
- Relatório completo: `documentacao/AUDITORIA_FINAL_COMPLETA.md`.
- Resultados estruturados: `documentacao/auditoria_final.json`.
- Mapa de todas as telas: `documentacao/Mapa_Visual_MaxSom_Todas_as_Paginas.png`.
- Testes de regressão: execute `node tests/teste-logica-maxsom.js` na pasta do projeto.
- A auditoria é estática; login, consultas, gravações, RLS e comportamento visual precisam de testes reais no navegador e no Supabase.
