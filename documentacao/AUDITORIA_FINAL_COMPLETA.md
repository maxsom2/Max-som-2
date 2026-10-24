# Auditoria final — Max Som

**Data:** 23/10/2026  
**Escopo:** ZIP local, referências HTML/CSS, estrutura do menu, arquivos de imagem, sintaxe JS, teste de regressão e organização.

## Resultado geral

As verificações estáticas descritas abaixo passaram. Isso é evidência de integridade dos arquivos, não prova de que todos os fluxos estejam funcionando ao vivo. A navegação do browser de teste foi bloqueada pela política do ambiente (`net::ERR_BLOCKED_BY_ADMINISTRATOR`), por isso não foi possível observar cliques e layout na página real. Também não foi usado login conectado ao Supabase real.

## Estrutura de pastas

- `html/`: 14 páginas HTML funcionais/de redirecionamento.
- `css/`: 14 folhas de estilo.
- `js/`: 4 arquivos JavaScript.
- `assets/`: 25 arquivos de imagem.
- `tests/`: testes locais de lógica.
- `documentacao/`: este relatório, dados estatísticos e mapa visual consolidado.
- `index.html` na raiz: pequeno ponto de entrada/redirect para `html/index.html`, usado para facilitar hospedagem estática. Todas as páginas reais continuam organizadas dentro de `html/`.

## Estatísticas verificadas

| Verificação | Resultado |
|---|---:|
| Referências locais em HTML verificadas | 196 |
| Caminhos locais quebrados em HTML | 0 |
| Referências locais a imagens em CSS verificadas | 14 |
| Caminhos de imagens em CSS quebrados | 0 |
| Páginas HTML | 14 |
| Folhas CSS | 14 |
| Arquivos JS verificados com `node --check` | 4/4 |
| Testes de lógica | 16/16 |
| Imagens que abriram/validaram com Pillow | 25/25 |
| IDs duplicados | 0 |
| Alvos internos de âncora ausentes | 0 |
| Imagens sem `alt` | 0 |
| Botões sem `type` explícito | 0 |
| Formulários sem `method` | 0 |
| Caminhos dinâmicos para fotos locais ausentes | 0 |

## Correções desta rodada

1. O menu usa somente a imagem `assets/logo-maxsom-white.png`; não mostra mais a sigla “MS” como substituta quando recolhido.
2. Corrigido o invólucro HTML da imagem de projeto carregada dinamicamente, alinhado ao CSS `.project-photo`.
3. A galeria estática de `html/servicos.html` tem fotos locais de demonstração.
4. A galeria de `html/projetos.html` preserva cards com nomes de arquivos de imagem como fallback se não houver resultados publicados ou a consulta falhar.
5. Serviços, produtos, projetos e publicações podem usar fotos locais como fallback quando os dados publicados não incluem imagem — isso não substitui o conteúdo real cadastrado no Supabase.
6. Os controles dinâmicos de aprovação/recusa têm `type="button"`.
7. Foi acrescentada cobertura de regressão para logo, fallbacks de imagens e estrutura das imagens de projetos.

## Visibilidade e fotos

A pasta `assets/` contém 25 arquivos e todas as imagens foram abertas/validadas sem erro. As páginas de Serviços e Projetos incluem fotos locais de demonstração; os cards dinâmicos ainda dependem de consulta ao Supabase. A imagem `documentacao/Mapa_Visual_MaxSom_Todas_as_Paginas.png` reúne uma prévia de todas as telas numa única imagem. Nos espaços reservados às fotos, a prévia mostra o nome do arquivo, conforme solicitado. Essa imagem é um esquema de layout feito a partir do código, não uma captura real do browser.

## Páginas conferidas

| Página | Carrega menu compartilhado | CSS | Imagens diretas no HTML | Botões | Formulários |
|---|---|---|---:|---:|---:|
| `admin.html` | Sim | css2?family=Inter:wght@400;500;600;700;800&display=swap, all.min.css, style.css, admin.css | 0 | 21 | 4 |
| `ajuda.html` | Sim | css2?family=Inter:wght@400;500;600;700;800&display=swap, all.min.css, style.css, ajuda.css | 0 | 2 | 0 |
| `atendimento.html` | Sim | css2?family=Inter:wght@400;500;600;700;800&display=swap, all.min.css, style.css, atendimento.css | 0 | 2 | 1 |
| `cadastro.html` | Sim | css2?family=Inter:wght@400;500;600;700;800&display=swap, all.min.css, style.css, cadastro.css | 0 | 3 | 1 |
| `conta.html` | Sim | css2?family=Inter:wght@400;500;600;700;800&display=swap, all.min.css, style.css, conta.css | 0 | 3 | 0 |
| `conversa.html` | Sim | css2?family=Inter:wght@400;500;600;700;800&display=swap, all.min.css, style.css, conversa.css | 0 | 3 | 1 |
| `conversas.html` | Sim | css2?family=Inter:wght@400;500;600;700;800&display=swap, all.min.css, style.css, conversas.css | 0 | 3 | 0 |
| `index.html` | Sim | all.min.css, style.css | 1 | 1 | 0 |
| `login.html` | Sim | css2?family=Inter:wght@400;500;600;700;800&display=swap, all.min.css, style.css, login.css | 0 | 3 | 1 |
| `minha-conta.html` | Não (redirecionamento/sem menu) | — | 0 | 0 | 0 |
| `produtos.html` | Sim | all.min.css, style.css, products.css | 0 | 1 | 0 |
| `projetos.html` | Sim | all.min.css, style.css, projects.css | 4 | 1 | 0 |
| `publicacoes.html` | Sim | css2?family=Inter:wght@400;500;600;700;800;900&display=swap, all.min.css, style.css, publicacoes.css | 1 | 1 | 0 |
| `servicos.html` | Sim | all.min.css, style.css, services.css | 4 | 1 | 0 |

`html/minha-conta.html` é um redirecionamento para a página de conta; `index.html` na raiz redireciona para `html/index.html`.

## Funcionalidades ainda não comprovadas

- **Login/cadastro:** a lógica e sintaxe existem, mas não foi executado login real com usuário de teste no Supabase.
- **Banco e permissões:** operações CRUD, RLS e papéis de cliente/funcionário/administrador precisam ser testados contra as tabelas e políticas do seu projeto.
- **Solicitações e conversas:** ações dependem dos campos reais existentes no Supabase, além de testes de ponta a ponta.
- **Anexos:** o fluxo de upload de documentos e fotos ainda precisa ser implementado/conferido com armazenamento privado e políticas adequadas.
- **Notificações externas:** e-mail/WhatsApp automáticos não foram validados nesta auditoria.
- **Menu visual em desktop e celular:** a implementação foi revisada no código e os testes de lógica passaram, mas o teste de clique/animação no navegador não pôde ser concluído neste ambiente.

## Conclusão

**Resultado estático: aprovado no escopo conferido, com 16/16 testes locais de lógica aprovados.** Não há evidência suficiente para afirmar que 100% do sistema funciona em produção. O próximo passo é abrir o ZIP em um servidor local/hospedagem, realizar o teste visual de cada página e testar os fluxos com credenciais de homologação do Supabase.
