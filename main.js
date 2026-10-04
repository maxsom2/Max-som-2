/* MAX SOM - aplicação */
const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmtDate = value => value ? new Date(value).toLocaleString("pt-BR") : "-";
const msg = (el, text, type="info") => { if(!el)return; el.textContent=text; el.className=`message message-${type}`; el.classList.remove("hidden"); };
const clearMsg = el => { if(el){el.textContent="";el.className="message hidden";} };
const loading = (btn,on,label) => { if(btn){btn.disabled=on;btn.textContent=on?"Aguarde...":label;} };


function enhanceInterface(){
  const current=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('nav a[href]').forEach(a=>{
    const href=a.getAttribute('href');
    if(href===current || (current==='' && href==='index.html')) a.classList.add('nav-current');
  });
  document.querySelectorAll('.product-card,.service-card,.project-card,.post-card,.benefit-card').forEach((card,i)=>{
    card.style.animationDelay=`${Math.min(i*45,180)}ms`;
  });
}

function dbError(error, fallback){
  console.error(error);
  return error?.message || error?.details || error?.hint || fallback;
}

async function authUser(){
  if(!window.supabaseClient)return null;
  const {data,error}=await window.supabaseClient.auth.getUser();
  if(error){console.error(error);return null;}
  return data?.user||null;
}

async function ensureProfile(user, values={}){
  if(!user || !window.supabaseClient)return null;
  const {data:existing,error:readError}=await window.supabaseClient.from("usuarios").select("*").eq("id",user.id).maybeSingle();
  if(readError){console.error(readError);return null;}
  if(existing)return existing;
  const metadata=user.user_metadata||{};
  const row={
    id:user.id,
    nome:String(values.nome||metadata.nome||user.email?.split("@")[0]||"Cliente").trim(),
    telefone:String(values.telefone||metadata.telefone||"").trim()||null,
    whatsapp:String(values.whatsapp||metadata.whatsapp||"").trim()||null,
    tipo_usuario:"cliente",
    ativo:true
  };
  const {data,error}=await window.supabaseClient.from("usuarios").insert(row).select("*").single();
  if(error){console.error(error);return null;}
  return data;
}

async function profile(){
  const u=await authUser();
  if(!u)return null;
  const profileRow=await ensureProfile(u);
  return {auth:u,profile:profileRow};
}

function setupAuth(){
  if(!window.supabaseClient){
    document.querySelectorAll("form").forEach(form=>form.addEventListener("submit",e=>e.preventDefault()));
    return false;
  }
  document.querySelectorAll("[data-logout]").forEach(b=>b.addEventListener("click",async()=>{
    b.disabled=true;const {error}=await window.supabaseClient.auth.signOut();
    if(error){console.error(error);b.disabled=false;alert("Não foi possível sair da conta.");return;} location.href="index.html";
  }));
  updateNav();
  window.supabaseClient.auth.onAuthStateChange(()=>setTimeout(updateNav,0));
  return true;
}
async function updateNav(){
  if(!window.supabaseClient)return;
  const p=await profile();
  const u=p?.auth;
  document.querySelectorAll("[data-logged-only]").forEach(e=>e.style.display=u?"":"none");
  document.querySelectorAll("[data-guest-only]").forEach(e=>e.style.display=u?"none":"");
  const type=String(p?.profile?.tipo_usuario||"").toLowerCase();
  const isAdmin=["admin","funcionario","funcionário","dono","administrador"].includes(type);
  document.querySelectorAll("[data-admin-only]").forEach(e=>e.style.display=isAdmin?"":"none");
}

/* public data */
async function loadProducts(){
  const grid=$("productsGrid"); if(!grid)return;
  const {data,error}=await window.supabaseClient.from("produtos").select("id,nome,modelo,descricao,especificacoes,imagem_capa,disponivel,destaque,categorias_produto(nome),marcas(nome)").eq("disponivel",true).order("destaque",{ascending:false}).order("criado_em",{ascending:false});
  if(error){grid.innerHTML=`<div class="empty">Não foi possível carregar os produtos.<small>${esc(dbError(error,"Erro no banco de dados."))}</small></div>`;return;}
  grid.innerHTML=data?.length?data.map(p=>`<article class="product-card">${p.imagem_capa?`<img src="${esc(p.imagem_capa)}" alt="${esc(p.nome)}">`:'<div class="product-image">Sem imagem</div>'}<div class="product-info"><span>${esc(p.categorias_produto?.nome||"Produto")}${p.marcas?.nome?" • "+esc(p.marcas.nome):""}</span><h3>${esc(p.nome)}</h3>${p.modelo?`<p><strong>Modelo:</strong> ${esc(p.modelo)}</p>`:""}<p>${esc(p.descricao||"Sem descrição disponível.")}</p>${p.especificacoes?`<details><summary>Especificações</summary><p>${esc(p.especificacoes)}</p></details>`:""}</div></article>`).join(""):'<div class="empty">Nenhum produto disponível no momento.</div>';
}
async function loadServices(){
  const grid=$("servicesGrid"); if(!grid)return;
  const {data,error}=await window.supabaseClient.from("servicos").select("id,nome,descricao,imagem_capa,ativo").eq("ativo",true).order("criado_em",{ascending:false});
  if(error){grid.innerHTML=`<div class="empty">Não foi possível carregar os serviços.<small>${esc(dbError(error,"Erro no banco de dados."))}</small></div>`;return;}
  grid.innerHTML=data?.length?data.map(s=>`<article class="service-card">${s.imagem_capa?`<img src="${esc(s.imagem_capa)}" alt="${esc(s.nome)}">`:''}<h3>${esc(s.nome)}</h3><p>${esc(s.descricao||"Sem descrição disponível.")}</p><p style="margin-top:10px;color:#68b8ff;font-weight:800">Sob orçamento</p><a href="atendimento.html">Solicitar orçamento →</a></article>`).join(""):'<div class="empty">Nenhum serviço disponível no momento.</div>';
}
async function loadProjects(){
  const grid=$("projectsGrid"); if(!grid)return;
  const {data,error}=await window.supabaseClient.from("projetos").select("id,titulo,descricao,categoria,imagem_capa,publicado").eq("publicado",true).order("criado_em",{ascending:false});
  if(error){grid.innerHTML=`<div class="empty">Não foi possível carregar os projetos.<small>${esc(dbError(error,"Erro no banco de dados."))}</small></div>`;return;}
  grid.innerHTML=data?.length?data.map((p,i)=>`<article class="project-card">${p.imagem_capa?`<img src="${esc(p.imagem_capa)}" alt="${esc(p.titulo)}">`:`<img src="projeto-${String((i%4)+1).padStart(2,"0")}.png" alt="${esc(p.titulo)}">`}<div class="project-info">${p.categoria?`<span>${esc(p.categoria)}</span>`:""}<h3>${esc(p.titulo)}</h3><p>${esc(p.descricao||"Sem descrição disponível.")}</p><a href="atendimento.html">Conhecer soluções →</a></div></article>`).join(""):'<div class="empty">Nenhum projeto publicado no momento.</div>';
}
async function loadPosts(){
  const grid=$("postsGrid"); if(!grid)return;
  const {data,error}=await window.supabaseClient.from("publicacoes").select("id,titulo,resumo,conteudo,imagem_capa,publicado,data_publicacao,categorias_publicacao(nome)").eq("publicado",true).order("data_publicacao",{ascending:false});
  if(error){grid.innerHTML=`<div class="empty">Não foi possível carregar as publicações.<small>${esc(dbError(error,"Erro no banco de dados."))}</small></div>`;return;}
  grid.innerHTML=data?.length?data.map(p=>`<article class="post-card">${p.imagem_capa?`<img src="${esc(p.imagem_capa)}" alt="${esc(p.titulo)}">`:'<div class="post-image">Imagem da publicação</div>'}<div class="post-info"><span>${esc(p.categorias_publicacao?.nome||"Publicação")}</span><h3>${esc(p.titulo)}</h3><p>${esc(p.resumo||"")}</p>${p.conteudo?`<details><summary>Ler publicação</summary><p>${esc(p.conteudo)}</p></details>`:""}<small class="muted">${fmtDate(p.data_publicacao)}</small></div></article>`).join(""):'<div class="empty">Nenhuma publicação disponível no momento.</div>';
}

/* login */
async function setupLogin(){
  const form=$("formLogin"); if(!form)return;
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const m=$("mensagemLogin"),b=form.querySelector("button");clearMsg(m);loading(b,true,"Entrar");
    try{
      const email=$("email").value.trim().toLowerCase(),password=$("senha").value;
      const {data,error}=await window.supabaseClient.auth.signInWithPassword({email,password});
      if(error)throw error;
      if(!data?.user)throw new Error("A sessão não foi criada.");
      await ensureProfile(data.user);
      msg(m,"Login realizado com sucesso. Entrando...","success");
      setTimeout(async()=>{const pr=await profile();const t=String(pr?.profile?.tipo_usuario||"").toLowerCase();location.href=adminTypes.includes(t)?"admin.html":"conta.html";},250);
    }catch(err){msg(m,dbError(err,"Não foi possível fazer o login."),"error");loading(b,false,"Entrar");}
  });
}

/* cadastro */
async function setupSignup(){
  const form=$("formCadastro"); if(!form)return;
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const m=$("mensagemCadastro"),b=form.querySelector("button");clearMsg(m);loading(b,true,"Criar conta");
    const values={nome:$("nome").value.trim(),telefone:$("telefone").value.trim(),whatsapp:$("whatsapp").value.trim()};
    try{
      const {data,error}=await window.supabaseClient.auth.signUp({email:$("email").value.trim().toLowerCase(),password:$("senha").value,options:{data:values}});
      if(error)throw error;
      if(!data?.user)throw new Error("O usuário não foi criado.");
      if(data.session){
        await ensureProfile(data.user,values);
        msg(m,"Conta criada com sucesso. Entrando...","success");
        setTimeout(()=>location.href="conta.html",350);
      }else{
        msg(m,"Conta criada. Confirme seu e-mail e depois faça login para acessar sua conta.","success");
        form.reset();
      }
    }catch(err){msg(m,dbError(err,"Não foi possível criar a conta."),"error");}
    finally{loading(b,false,"Criar conta");}
  });
}

/* attendance: public and WhatsApp-first */
async function prepareAttendance(){
  const form=$("formAtendimento");if(!form)return;
  const select=$("servico");
  if(select){
    const {data,error}=await window.supabaseClient.from("servicos").select("id,nome").eq("ativo",true).order("nome");
    if(!error)select.innerHTML='<option value="">Selecione um serviço</option>'+(data||[]).map(s=>`<option value="${esc(s.nome)}">${esc(s.nome)}</option>`).join("");
    else select.innerHTML='<option value="">Sob consulta</option>';
  }
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const nome=$("nomeContato").value.trim(),telefone=$("telefoneContato").value.trim(),servico=$("servico").value.trim(),equip=$("equipamento").value.trim(),descricao=$("descricao").value.trim();
    if(!nome||!descricao){msg($("mensagemAtendimento"),"Preencha seu nome e a mensagem.","error");return;}
    const text=`Olá, Max Som!%0A%0A*Nome:* ${encodeURIComponent(nome)}%0A*WhatsApp:* ${encodeURIComponent(telefone||"Não informado")}%0A*Serviço:* ${encodeURIComponent(servico||"Não informado")}%0A*Produto/equipamento:* ${encodeURIComponent(equip||"Não informado")}%0A*Mensagem:* ${encodeURIComponent(descricao)}`;
    window.open(`https://wa.me/5565996262514?text=${text}`,"_blank","noopener");
    msg($("mensagemAtendimento"),"Pronto! O WhatsApp foi aberto com sua mensagem.","success");
  });
}

/* admin */
const adminTypes=["admin","funcionario","funcionário","dono","administrador"];
async function requireAdmin(){
  const p=await profile();if(!p){location.href="login.html";return null;}
  const type=String(p.profile?.tipo_usuario||"").toLowerCase();
  if(!adminTypes.includes(type)){msg($("adminMensagem"),"Esta área é exclusiva do administrador.","error");setTimeout(()=>location.href="index.html",900);return null;}
  return p;
}
function setupAdminMenu(){
  document.querySelectorAll("[data-panel]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-panel]").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".admin-panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.panel)?.classList.add("active");}));
}
async function admin(){
  if(!$("adminPage")&&!$("adminStats"))return;
  const p=await requireAdmin();if(!p)return;
  setupAdminMenu();
  await Promise.allSettled([adminStats(),adminProducts(),adminServices(),adminProjects(),adminPosts(),adminUsers(),adminRequests(),setupAdminForms()]);
}
async function adminStats(){
  const stats=$("adminStats");if(!stats)return;const tables=["usuarios","produtos","servicos","solicitacoes_servico"];
  const labels=["Usuários","Produtos","Serviços","Solicitações"];
  const counts=await Promise.all(tables.map(async t=>{const {count}=await window.supabaseClient.from(t).select("*",{count:"exact",head:true});return count??0;}));
  stats.innerHTML=labels.map((l,i)=>`<div class="admin-card"><span class="muted">${l}</span><strong>${counts[i]}</strong><span>registros</span></div>`).join("");
}
function adminTable(items,kind){
  if(!items?.length)return '<p class="muted">Nenhum registro.</p>';
  return `<table class="admin-table"><thead><tr><th>Nome</th><th>Informação</th><th>Ações</th></tr></thead><tbody>${items.map(x=>{let name=kind==='produto'?x.nome:kind==='servico'?x.nome:kind==='projeto'?x.titulo:x.titulo;let info=kind==='produto'?(x.modelo||x.descricao||''):kind==='servico'?('Sob orçamento'):kind==='projeto'?(x.categoria||'Projeto'):x.resumo||'';return `<tr><td>${esc(name)}</td><td>${esc(info)}</td><td><div class="admin-actions"><button class="btn btn-outline" data-edit="${kind}" data-id="${esc(x.id)}">Editar</button><button class="btn btn-danger" data-delete="${kind}" data-id="${esc(x.id)}">Excluir</button></div></td></tr>`}).join('')}</tbody></table>`;
}
async function adminProducts(){const el=$("produtosAdminLista");if(!el)return;const {data,error}=await window.supabaseClient.from("produtos").select("id,nome,modelo,descricao,imagem_capa,disponivel,destaque").order("criado_em",{ascending:false});el.innerHTML=error?`<p class="muted">${esc(dbError(error,"Não foi possível carregar."))}</p>`:adminTable(data,"produto");bindAdminActions();}
async function adminServices(){const el=$("servicosAdminLista");if(!el)return;const {data,error}=await window.supabaseClient.from("servicos").select("id,nome,descricao,imagem_capa,ativo").order("criado_em",{ascending:false});el.innerHTML=error?`<p class="muted">${esc(dbError(error,"Não foi possível carregar."))}</p>`:adminTable(data,"servico");bindAdminActions();}
async function adminProjects(){const el=$("projetosAdminLista");if(!el)return;const {data,error}=await window.supabaseClient.from("projetos").select("id,titulo,descricao,categoria,imagem_capa,publicado").order("criado_em",{ascending:false});el.innerHTML=error?`<p class="muted">${esc(dbError(error,"Não foi possível carregar."))}</p>`:adminTable(data,"projeto");bindAdminActions();}
async function adminPosts(){const el=$("publicacoesAdminLista");if(!el)return;const {data,error}=await window.supabaseClient.from("publicacoes").select("id,titulo,resumo,conteudo,imagem_capa,publicado,data_publicacao").order("data_publicacao",{ascending:false});el.innerHTML=error?`<p class="muted">${esc(dbError(error,"Não foi possível carregar."))}</p>`:adminTable(data,"publicacao");bindAdminActions();}
async function adminUsers(){const el=$("adminUsuariosLista");if(!el)return;const {data,error}=await window.supabaseClient.from("usuarios").select("id,nome,telefone,whatsapp,tipo_usuario,ativo").order("nome");if(error){el.innerHTML=`<p class="muted">${esc(dbError(error,"Não foi possível carregar usuários."))}</p>`;return;}el.innerHTML=(data||[]).map(u=>`<div class="admin-request"><div><strong>${esc(u.nome||"Sem nome")}</strong><div class="muted">${esc(u.telefone||u.whatsapp||"Sem telefone")} • ${esc(u.tipo_usuario||"cliente")}</div></div><div class="admin-actions">${String(u.tipo_usuario).toLowerCase()==='solicitante_admin'?`<button class="btn btn-green" data-approve-admin="${esc(u.id)}">Aprovar administrador</button><button class="btn btn-danger" data-reject-admin="${esc(u.id)}">Recusar</button>`:''}</div></div>`).join('')||'<p class="muted">Nenhum usuário.</p>';bindUserActions();}
async function adminRequests(){
  const s=$("adminSolicitacoes"),c=$("adminConversas");if(!s&&!c)return;
  if(s){const {data,error}=await window.supabaseClient.from("solicitacoes_servico").select("id,status,descricao_problema,criado_em,servicos(nome)").order("criado_em",{ascending:false}).limit(20);s.innerHTML=error?`<p class="muted">${esc(dbError(error,"Erro."))}</p>`:data?.length?data.map(x=>`<div class="account-item"><strong>${esc(x.servicos?.nome||"Serviço")}</strong><span>${esc(x.status)} • ${fmtDate(x.criado_em)}</span><p>${esc(x.descricao_problema||"")}</p></div>`).join(''):'<p class="muted">Nenhuma solicitação.</p>';}
  if(c){const {data,error}=await window.supabaseClient.from("conversas").select("id,assunto,status,criado_em,atualizado_em").order("atualizado_em",{ascending:false}).limit(20);c.innerHTML=error?`<p class="muted">${esc(dbError(error,"Erro."))}</p>`:data?.length?data.map(x=>`<div class="account-item"><strong>${esc(x.assunto||"Atendimento")}</strong><span>${esc(x.status)} • ${fmtDate(x.atualizado_em||x.criado_em)}</span></div>`).join(''):'<p class="muted">Nenhuma conversa.</p>';}
}
async function setupAdminForms(){
  const pf=$("produtoForm");if(pf)pf.addEventListener("submit",async e=>{e.preventDefault();const id=$("produtoId").value;const row={nome:$("produtoNome").value.trim(),modelo:$("produtoModelo").value.trim()||null,descricao:$("produtoDescricao").value.trim()||null,imagem_capa:$("produtoImagem").value.trim()||null,disponivel:$("produtoDisponivel").checked,destaque:$("produtoDestaque").checked};await saveAdmin("produtos",id,row,pf,"produto");});
  const sf=$("servicoForm");if(sf)sf.addEventListener("submit",async e=>{e.preventDefault();const id=$("servicoId").value;const row={nome:$("servicoNome").value.trim(),descricao:$("servicoDescricao").value.trim()||null,imagem_capa:$("servicoImagem").value.trim()||null,ativo:$("servicoAtivo").checked};await saveAdmin("servicos",id,row,sf,"servico");});
  const pr=$("projetoForm");if(pr)pr.addEventListener("submit",async e=>{e.preventDefault();const id=$("projetoId").value;const row={titulo:$("projetoTitulo").value.trim(),categoria:$("projetoCategoria").value.trim()||null,descricao:$("projetoDescricao").value.trim()||null,imagem_capa:$("projetoImagem").value.trim()||null,publicado:$("projetoPublicado").checked};await saveAdmin("projetos",id,row,pr,"projeto");});
  const po=$("publicacaoForm");if(po)po.addEventListener("submit",async e=>{e.preventDefault();const id=$("publicacaoId").value;const row={titulo:$("publicacaoTitulo").value.trim(),resumo:$("publicacaoResumo").value.trim()||null,conteudo:$("publicacaoConteudo").value.trim()||null,imagem_capa:$("publicacaoImagem").value.trim()||null,publicado:$("publicacaoPublicado").checked,data_publicacao:new Date().toISOString()};await saveAdmin("publicacoes",id,row,po,"publicacao");});
  document.querySelectorAll("[id$='Cancelar']").forEach(b=>b.addEventListener("click",()=>b.closest("form")?.reset()));
}
async function saveAdmin(table,id,row,form,kind){const q=id?window.supabaseClient.from(table).update(row).eq("id",id):window.supabaseClient.from(table).insert(row);const {error}=await q;if(error){alert(dbError(error,"Não foi possível salvar."));return;}form.reset();document.querySelectorAll(`[data-panel]`).forEach(x=>{});await Promise.all([adminStats(),adminProducts(),adminServices(),adminProjects(),adminPosts()]);alert("Salvo com sucesso.");}
function bindAdminActions(){
  document.querySelectorAll("[data-delete]").forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',async()=>{if(!confirm('Tem certeza que deseja excluir?'))return;const table={produto:'produtos',servico:'servicos',projeto:'projetos',publicacao:'publicacoes'}[b.dataset.delete];const {error}=await window.supabaseClient.from(table).delete().eq('id',b.dataset.id);if(error)alert(dbError(error,'Não foi possível excluir.'));else{await Promise.all([adminStats(),adminProducts(),adminServices(),adminProjects(),adminPosts()]);}})});
  document.querySelectorAll("[data-edit]").forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',async()=>{const map={produto:['produtos','produtoId'],servico:['servicos','servicoId'],projeto:['projetos','projetoId'],publicacao:['publicacoes','publicacaoId']};const [table]=map[b.dataset.edit];const {data,error}=await window.supabaseClient.from(table).select('*').eq('id',b.dataset.id).single();if(error||!data){alert(dbError(error,'Não foi possível carregar.'));return;}if(b.dataset.edit==='produto'){$("produtoId").value=data.id;$("produtoNome").value=data.nome||'';$("produtoModelo").value=data.modelo||'';$("produtoDescricao").value=data.descricao||'';$("produtoImagem").value=data.imagem_capa||'';$("produtoDisponivel").checked=!!data.disponivel;$("produtoDestaque").checked=!!data.destaque;}if(b.dataset.edit==='servico'){$("servicoId").value=data.id;$("servicoNome").value=data.nome||'';$("servicoDescricao").value=data.descricao||'';$("servicoImagem").value=data.imagem_capa||'';$("servicoAtivo").checked=!!data.ativo;}if(b.dataset.edit==='projeto'){$("projetoId").value=data.id;$("projetoTitulo").value=data.titulo||'';$("projetoCategoria").value=data.categoria||'';$("projetoDescricao").value=data.descricao||'';$("projetoImagem").value=data.imagem_capa||'';$("projetoPublicado").checked=!!data.publicado;}if(b.dataset.edit==='publicacao'){$("publicacaoId").value=data.id;$("publicacaoTitulo").value=data.titulo||'';$("publicacaoResumo").value=data.resumo||'';$("publicacaoConteudo").value=data.conteudo||'';$("publicacaoImagem").value=data.imagem_capa||'';$("publicacaoPublicado").checked=!!data.publicado;}})});
}
function bindUserActions(){
  document.querySelectorAll('[data-approve-admin]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.onclick=async()=>{const {error}=await window.supabaseClient.from('usuarios').update({tipo_usuario:'admin'}).eq('id',b.dataset.approveAdmin);if(error)alert(dbError(error,'Não foi possível aprovar.'));else await adminUsers();};});
  document.querySelectorAll('[data-reject-admin]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.onclick=async()=>{const {error}=await window.supabaseClient.from('usuarios').update({tipo_usuario:'cliente'}).eq('id',b.dataset.rejectAdmin);if(error)alert(dbError(error,'Não foi possível recusar.'));else await adminUsers();};});
}
async function account(){
  if(!$("contaNome")&&!$("contaNomeTitulo"))return;
  const p=await profile();
  if(!p){
    location.href="login.html";
    return;
  }
  const u=p.auth, r=p.profile||{};
  if($("contaNomeTitulo"))$("contaNomeTitulo").textContent=r.nome||u.email?.split("@")[0]||"Usuário";
  if($("contaNome"))$("contaNome").textContent=r.nome||"-";
  if($("contaEmail"))$("contaEmail").textContent=u.email||"-";
  if($("contaTelefone"))$("contaTelefone").textContent=r.telefone||r.whatsapp||"-";
  if($("contaTipo"))$("contaTipo").textContent=adminTypes.includes(String(r.tipo_usuario||"").toLowerCase())?"Administrador":(String(r.tipo_usuario||"cliente")==="solicitante_admin"?"Solicitação de administrador":"Visualizador");

  const s=$("solicitacoesConta");
  if(s){
    const {data,error}=await window.supabaseClient.from("solicitacoes_servico").select("id,status,descricao_problema,criado_em,servicos(nome)").eq("cliente_id",u.id).order("criado_em",{ascending:false}).limit(10);
    s.innerHTML=error?`<p class="muted">${esc(dbError(error,"Não foi possível carregar suas solicitações."))}</p>`:data?.length?data.map(x=>`<div class="account-item"><strong>${esc(x.servicos?.nome||"Solicitação")}</strong><span>${esc(x.status||"Em análise")} • ${fmtDate(x.criado_em)}</span><p>${esc(x.descricao_problema||"")}</p></div>`).join(""):'<p class="muted">Nenhuma solicitação encontrada.</p>';
  }

  const c=$("conversasConta");
  if(c){
    const {data,error}=await window.supabaseClient.from("conversas").select("id,assunto,status,criado_em,atualizado_em").eq("cliente_id",u.id).order("atualizado_em",{ascending:false}).limit(10);
    c.innerHTML=error?`<p class="muted">${esc(dbError(error,"Não foi possível carregar suas conversas."))}</p>`:data?.length?data.map(x=>`<div class="account-item"><strong>${esc(x.assunto||"Atendimento")}</strong><span>${esc(x.status||"Em atendimento")} • ${fmtDate(x.atualizado_em||x.criado_em)}</span></div>`).join(""):'<p class="muted">Nenhuma conversa encontrada.</p>';
  }
}

async function requestAdminAccess(){const b=$("btnAdminRequest");if(!b)return;const p=await profile();if(!p)return;const type=String(p.profile?.tipo_usuario||"").toLowerCase();if(adminTypes.includes(type)){b.textContent='Você já é administrador';b.disabled=true;return;}if(type==='solicitante_admin'){b.textContent='Solicitação enviada';b.disabled=true;return;}b.addEventListener('click',async()=>{const {error}=await window.supabaseClient.from('usuarios').update({tipo_usuario:'solicitante_admin'}).eq('id',p.auth.id);if(error){msg($("contaMensagem"),dbError(error,'Não foi possível enviar a solicitação.'),'error');return;}b.textContent='Solicitação enviada';b.disabled=true;msg($("contaMensagem"),'Pedido enviado. Um administrador precisa aprovar seu acesso.','success');});}

(async()=>{
  if(!setupAuth())return;
  enhanceInterface();
  await Promise.allSettled([
    loadProducts(),
    loadServices(),
    loadProjects(),
    loadPosts(),
    setupLogin(),
    setupSignup(),
    prepareAttendance(),
    account(),
    admin(),
    requestAdminAccess()
  ]);
})();
