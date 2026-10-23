# Max Som — Auditoria técnica avançada

**Data:** 23/10/2026  
**Artefato revisado:** cópia revisada anterior, preservada em uma pasta de trabalho separada. O ZIP enviado pelo usuário não foi sobrescrito.

## Resultado geral

A análise estática passou nos testes de estrutura, caminhos locais, parsing CSS, sintaxe JavaScript e validações auxiliares de lógica. Isso demonstra consistência dos arquivos, mas **não comprova o funcionamento ponta a ponta**. O ambiente bloqueou a navegação local do navegador automatizado (`ERR_BLOCKED_BY_ADMINISTRATOR`), e não foi realizado login em uma conta real do Supabase.

## Estatísticas do pacote

| Métrica | Resultado |
|---|---:|
| Documentos HTML, incluindo o redirecionamento na raiz | 15 |
| Páginas HTML na pasta `html/` | 14 |
| Folhas CSS | 14 |
| Arquivos JavaScript do aplicativo | 4 |
| Linhas JavaScript analisadas | 3.284 |
| Linhas CSS analisadas | 7.520 |
| Referências locais `href`/`src` verificadas | 194 |
| Formulários HTML | 8 |
| Botões HTML | 45 |
| Tags `<img>` estáticas nas páginas | 6 |
| Arquivos de imagem em `assets/` | 25 |
| Tamanho total das imagens | 5,07 MB |
| Variáveis CSS declaradas | 82 |
| Referências a variáveis CSS | 362 |
| Testes automatizados de lógica pura | 10/10 aprovados |

## Testes estáticos

| Verificação | Resultado |
|---|---|
| Sintaxe dos 4 arquivos JavaScript (`node --check`) | Aprovada |
| IDs HTML duplicados | 0 encontrados |
| Links/recursos locais quebrados | 0 encontrados |
| Links de âncora sem destino | 0 encontrados |
| Erros de parsing nas 14 folhas CSS | 0 encontrados |
| Variáveis CSS referenciadas sem definição | 0 encontradas |
| Caminhos locais `url(...)` do CSS quebrados | 0 encontrados |
| Ordem do SDK Supabase → cliente → menu → lógica | Correta nas páginas que carregam o aplicativo |
| Formulários sem `method="post"` | 0 |
| Botões sem `type` explícito | 0 |
| Imagens estáticas sem `alt` | 0 |
| Links `target="_blank"` sem `rel="noopener"` | 0 |
| Folhas CSS com seletores do menu compartilhado | Apenas `css/style.css` |
| Páginas de aplicativo com importação de `js/menu.js` | Todas as páginas funcionais; a página legada `minha-conta.html` apenas redireciona |
| Alvos de `data-panel`, `aria-controls` e `label for` | Todos encontrados ou fornecidos pelo menu compartilhado |

Os resultados completos por arquivo estão em `auditoria_avancada.json`.

## Correções aplicadas nesta rodada

1. Todos os oito formulários receberam `method="post"`, evitando que os dados caiam na query string caso o JavaScript falhe. Os botões HTML passaram a declarar `type` explicitamente.
2. O destino padrão após login agora considera o perfil: cliente → `conta.html`; funcionário/administrador → `admin.html`. Destinos externos ou desconhecidos no parâmetro `redirect` são recusados.
3. O painel de atendimento ganhou ações para aceitar, pedir informações e recusar com motivo. A recusa e as respostas são acrescentadas em `observacoes`, preservando o histórico existente.
4. Quando a equipe pede informações, a conta do cliente mostra um formulário para responder à mesma solicitação. O cliente pode criar uma nova solicitação após uma recusa, sem apagar o registro antigo.
5. Ao aceitar uma solicitação, o código tenta abrir uma conversa para o cliente e inclui a referência da solicitação no assunto. O vínculo é por identificação no assunto, não por uma relação garantida no banco.
6. As estatísticas administrativas não confundem falha de consulta com contagem zero: indicadores sem leitura passam a mostrar `— / Indisponível`.
7. O envio de mensagens restaura o botão mesmo se ocorrer exceção de rede; o botão de notificação também volta a funcionar se a atualização falhar.
8. Links de notificações são filtrados para recusar esquemas perigosos como `javascript:`.
9. Quando o SDK não carrega ou a sessão não pode ser confirmada, os indicadores de carregamento são substituídos por mensagens de indisponibilidade. Nas páginas privadas, o conteúdo é substituído por uma mensagem que explica que a sessão não foi validada.
10. Foram adicionados estilos para as ações administrativas de solicitações e para a resposta do cliente.

## Testes de lógica executados

O arquivo `tests/teste-logica-maxsom.js` pode ser executado com Node.js 18 ou superior:

```bash
node tests/teste-logica-maxsom.js
```

Foram aprovados 10 testes: destino por perfil; retorno do funcionário ao painel; retorno do dono ao painel; redirecionamento interno permitido; bloqueio de redirecionamento externo; bloqueio de `javascript:`; preservação de link relativo; preservação de HTTPS válido; escape de HTML; e preservação do histórico anterior.

Esses testes isolam funções puras. Não simulam o navegador inteiro, o login do Supabase ou operações no banco.

## Pontos ainda pendentes / riscos que dependem do ambiente real

### Alta prioridade — confirmar nomes de tabelas e colunas

O código atualmente usa os identificadores `usuario`, `solicitações_servico`, `mensagem` e `notificacao`, além de colunas como `cliente_id`, `remetente_id`, `usuario_id`, `observacoes` e `criado_em`. A análise local não pode provar que esses nomes correspondem ao esquema ativo no Supabase. O nome com acento e os nomes singulares merecem conferência no Table Editor antes de concluir testes de login, solicitações, mensagens ou notificações. Não alterei tabelas nem executei SQL.

### Alta prioridade — autorização e segurança

A interface esconde controles por perfil, mas isso não substitui as políticas RLS. É necessário testar, usando contas separadas de cliente, funcionário e dono, se o banco realmente impede leituras/alterações indevidas. As ações novas de solicitações podem falhar caso a RLS não permita que funcionários atualizem a linha ou criem conversas/notificações; a interface agora apresenta erro, mas a política real não foi auditada.

### Upload de anexos

Mensagens continuam sendo texto. O envio de fotos/PDFs/documentos ainda **não está implementado**. Para fazê-lo com segurança é necessário confirmar/criar um bucket privado do Supabase Storage, definir limite de tamanho e tipos aceitos, configurar políticas Storage para participantes da conversa e estabelecer como os metadados do arquivo serão relacionados à conversa/mensagem. Não adivinhei nome de bucket nem criei políticas sem autorização.

### Notificações externas e atividade

As notificações internas dependem da tabela e de permissões confirmadas. Alertas por e-mail/WhatsApp, preferências do usuário para esses canais e um registro completo de atividades administrativas ainda não estão implementados por completo. O link de WhatsApp existente abre o aplicativo para o próprio usuário; ele não é um serviço automático de envio de notificações.

### Imagens e conteúdo dinâmico

Há 25 arquivos de imagem no pacote, mas só seis tags `<img>` aparecem diretamente nos HTMLs. Produtos, serviços, projetos e publicações renderizam imagens a partir do campo `imagem_capa` do banco; por isso, a quantidade de fotos visível depende das linhas e dos URLs configurados no Supabase. Ter um arquivo em `assets/` não o publica automaticamente no catálogo.

### Testes visuais / ponta a ponta

A execução automatizada do Chromium/Playwright foi bloqueada pelo ambiente antes de carregar a primeira página local. Portanto, ainda é necessário abrir o site num navegador comum e testar menu recolhido/expandido no desktop, menu gaveta no celular, login real, cadastro real, formulários CRUD, solicitações, mensagens, imagens e cada perfil.

## Veredito

**Aprovado na auditoria estática e nos 10 testes de lógica pura. Ainda não aprovado para troca definitiva em produção.** O próximo marco é validar os nomes do esquema e as políticas no Supabase, depois realizar os testes de navegação e autenticação reais. As funcionalidades de anexos e notificações externas continuam pendentes e estão registradas explicitamente para não serem confundidas com recursos prontos.
