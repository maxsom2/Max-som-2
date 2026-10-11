# Max Som — versão conectada ao Supabase

Este pacote já está configurado com a URL e a chave PUBLICÁVEL fornecidas no chat.

## Estrutura
- Páginas públicas: início, produtos, serviços, projetos e publicações.
- Autenticação: login e cadastro.
- Área do cliente: dados, solicitações, agenda, garantias, notificações e conversas.
- Atendimento: criação de equipamento e solicitação de serviço.
- Área administrativa: leitura de indicadores e registros para perfis autorizados pelo campo `tipo_usuario`.

## Importante
A chave usada no navegador é a chave publicável. Não existe `sb_secret` neste projeto.

O RLS do Supabase continua sendo a autoridade de segurança. Se alguma leitura/escrita aparecer como negada, isso significa que a policy correspondente do banco precisa permitir aquela operação; o código não tenta contornar o RLS.

## Como usar no vscode.dev
1. Extraia o ZIP.
2. Abra a pasta `MaxSom_Final` no vscode.dev.
3. Mantenha todos os arquivos e pastas.
4. Abra `index.html` por uma hospedagem/servidor estático. O vscode.dev sozinho não executa HTML como um servidor local.
5. Teste primeiro `login.html` com o usuário de teste que você já criou.

## Observação
As tabelas usadas pelo código são as 20 tabelas definidas no projeto: usuarios, funcionarios, enderecos, categorias_publicacao, publicacoes, categorias_produto, marcas, produtos, servicos, equipamentos, solicitacoes_servico, agenda, projetos, fotos_projeto, conversas, mensagens, arquivos, notificacoes, garantias e configuracoes_loja.

## Atualização visual — versão 02
- Reformulação focada em aparência de empresa de som, com fotografia e galerias em destaque.
- Logo da Max Som extraída da imagem fornecida e convertida para branco com fundo transparente, mantendo o desenho original.
- Home com hero fotográfico, mosaico de projetos, seção institucional, equipamentos, serviços, projetos, publicações e CTA de atendimento.
- Páginas internas com cabeçalhos fotográficos e cards mais visuais.
- Fotos reais de projetos incluídas no pacote.
- Banco de dados, autenticação, RLS e lógica do Supabase não foram alterados nesta reformulação.
