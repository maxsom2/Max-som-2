/*
 * Testes locais de lógica pura do Max Som.
 * Requer Node.js 18+ e não acessa nem altera o Supabase.
 * Execute na pasta raiz do projeto: node tests/teste-logica-maxsom.js
 */
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');

function extractFunction(name) {
  const start = source.search(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
  if (start < 0) throw new Error(`Função não encontrada: ${name}`);
  const tail = source.slice(start);
  const match = tail.match(/^(?:async\s+)?function\s+[\s\S]*?(?=\n(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(|\n\/\* ={5,}|$)/);
  if (!match) throw new Error(`Não foi possível extrair: ${name}`);
  return match[0];
}

const helpers = [
  'esc', 'safeHref', 'normalizeType', 'isOwner', 'isAdmin',
  'getPostLoginTarget', 'appendRequestHistory'
].map(extractFunction);
const fakeWindow = { location: { search: '' } };
const api = new Function('window', 'URLSearchParams', `
  const OWNER_TYPES = ["admin", "dono", "administrador"];
  const STAFF_TYPES = [...OWNER_TYPES, "funcionario", "funcionário", "funcionario tecnico", "funcionário técnico"];
  let currentProfile = null;
  ${helpers.join('\n')}
  return { esc, safeHref, getPostLoginTarget, appendRequestHistory };
`)(fakeWindow, URLSearchParams);

const checks = [];
function test(name, assertion) {
  const pass = Boolean(assertion);
  checks.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}`);
}

test('Cliente sem destino explícito vai para Minha conta', api.getPostLoginTarget({ tipo_usuario: 'cliente' }) === 'conta.html');
test('Funcionário sem destino explícito vai para o painel', api.getPostLoginTarget({ tipo_usuario: 'funcionario' }) === 'admin.html');
test('Dono sem destino explícito vai para o painel', api.getPostLoginTarget({ tipo_usuario: 'dono' }) === 'admin.html');
fakeWindow.location.search = '?redirect=produtos.html';
test('Destino interno permitido é preservado', api.getPostLoginTarget({ tipo_usuario: 'cliente' }) === 'produtos.html');
fakeWindow.location.search = '?redirect=https%3A%2F%2Fevil.example';
test('Redirecionamento externo é recusado', api.getPostLoginTarget({ tipo_usuario: 'cliente' }) === 'conta.html');
test('Link javascript: é bloqueado', api.safeHref('javascript:alert(1)') === '#');
test('Link relativo de conversa é preservado', api.safeHref('conversa.html?id=abc') === 'conversa.html?id=abc');
test('Link HTTPS válido é preservado', api.safeHref('https://wa.me/5565') === 'https://wa.me/5565');
test('Texto HTML é escapado antes de entrar no HTML dinâmico', api.esc('<script>') === '&lt;script&gt;');
const history = api.appendRequestHistory('Histórico anterior', 'Resposta do cliente', 'Informação adicional');
test('Histórico de solicitações é acrescentado sem apagar o anterior', history.includes('Histórico anterior') && history.includes('Resposta do cliente: Informação adicional'));

// Verificações de regressão estática das correções visuais feitas nesta auditoria.
const projectRoot = path.join(__dirname, '..');
const menuSource = fs.readFileSync(path.join(projectRoot, 'js', 'menu.js'), 'utf8');
const globalCss = fs.readFileSync(path.join(projectRoot, 'css', 'style.css'), 'utf8');
const servicesHtml = fs.readFileSync(path.join(projectRoot, 'html', 'servicos.html'), 'utf8');
const projectsHtml = fs.readFileSync(path.join(projectRoot, 'html', 'projetos.html'), 'utf8');
const photoList = source.match(/const LOCAL_AUDIO_PHOTOS = \[([\s\S]*?)\];/);
const photoPaths = photoList ? Array.from(photoList[1].matchAll(/\"([^\"]+)\"/g), (m) => path.resolve(projectRoot, 'html', m[1])) : [];
test('Menu usa a imagem original da logo sem substituir por texto "MS"', menuSource.includes('class=\"brand-logo\"') && !menuSource.includes('brand-collapsed-mark') && !globalCss.includes('brand-collapsed-mark'));
test('Página Serviços mantém fotos locais como fallback', servicesHtml.includes('data-static-fallback=\"true\"') && servicesHtml.includes('service-photo') && servicesHtml.includes('../assets/automotivo.jpeg'));
test('Página Projetos mantém sua galeria local como fallback', projectsHtml.includes('data-static-fallback=\"true\"') && projectsHtml.includes('../assets/barco.jpeg'));
test('Cards dinâmicos de projetos usam o contêiner correto para suas imagens', source.includes('<div class=\"project-photo ${photoClass}\"><img class=\"project-image\"'));
test('Todos os caminhos das fotos alternativas existem no pacote', photoPaths.length === 8 && photoPaths.every((file) => fs.existsSync(file)));
test('Botões dinâmicos de aprovação/recusa têm type=button', source.includes('<button type=\"button\" class=\"btn-aprovar-admin\"') && source.includes('<button type=\"button\" class=\"btn-recusar-admin\"'));


// Auditoria cruzada com o esquema Supabase real enviado pelo usuário.
const publicacoesCss = fs.readFileSync(path.join(projectRoot, 'css', 'publicacoes.css'), 'utf8');
const publicacoesHtml = fs.readFileSync(path.join(projectRoot, 'html', 'publicacoes.html'), 'utf8');
const schemaMigration = fs.readFileSync(path.join(projectRoot, 'documentacao', 'Supabase_Corrigir_Politicas_MaxSom.sql'), 'utf8');
test('Conversas usa funcionario_id como existe no Supabase', !source.includes('atendente_id') && source.includes('id,cliente_id,funcionario_id,assunto,status'));
test('Publicações consulta a coluna publica do Supabase', source.includes('imagem_capa,publica,data_publicacao,criado_em') && source.includes('.eq("publica", true)') && !source.includes('imagem_capa,publicado,data_publicacao'));
test('Administração grava e lê publicacoes.publica', source.includes('publica: !!qs("#publicacaoPublicado")') && source.includes('!!data.publica') && source.includes('item.publica ? "Publicada" : "Rascunho"'));
test('Produtos utiliza a coluna sensível a maiúsculas Modelo', source.includes('.select("id,nome,Modelo,descricao,imagem_capa,disponivel,destaque,categoria_id,marca_id")') && source.includes('"Modelo": qs("#produtoModelo")'));
test('Página Publicações declara a folha de estilos específica', publicacoesHtml.includes('href="../css/publicacoes.css"'));
test('CSS de Publicações contém regras para as classes atuais do HTML', ['.publicacoes-hero-content', '.publicacoes-hero-card', '.publicacoes-eyebrow', '.publicacoes-button', '.publicacoes-cta-content', '.publication-card', '.publication-visual > .publication-image'].every((selector) => publicacoesCss.includes(selector)));
test('Cards de publicações usam as classes que a folha específica estiliza', source.includes('class="publication-card post-card"') && source.includes('class="publication-visual ${visualClass}"') && source.includes('class="publication-body post-info"'));
test('Iniciar conversa valida a conexão Supabase antes de usar o cliente', source.includes('async function createConversation(assunto = "Atendimento Max Som") {\n  if (!isSupabaseReady())'));
test('Migração cria a política de inclusão do perfil cliente', schemaMigration.includes('maxsom_usuario_insert_cliente') && schemaMigration.includes("lower(COALESCE(tipo_usuario, '')) = 'cliente'"));
test('Migração cria políticas para solicitações, conversas e mensagens', ['maxsom_solicitacoes_insert', 'maxsom_conversas_insert', 'maxsom_mensagem_insert_participants'].every((policy) => schemaMigration.includes(policy)));
test('Migração restringe upload de imagens a dono autenticado', schemaMigration.includes('DROP POLICY IF EXISTS "Enviar imagens vmbdr4_0"') && schemaMigration.includes('DROP POLICY IF EXISTS maxsom_upload_images_owner') && schemaMigration.includes('CREATE POLICY maxsom_upload_images_owner'));

const passed = checks.filter((item) => item.pass).length;
console.log(`\nResultado: ${passed}/${checks.length} testes passaram.`);
if (passed !== checks.length) process.exit(1);
