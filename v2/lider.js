/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL = "https://icajmncojvidhrqlbevq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vQFsGutuZDHBruMghZkQYQ_BSwEBXFp";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/* =========================================================
   ESTADO
========================================================= */

let currentUser = null;
let currentProfile = null;
let machineAtual = null;
let apontamentoAtual = null;
let ocorrenciasAtuais = [];
let occurrenceEditIndex = null;
let nativeTimeTarget = null;
let telaMaquinaAberta = false; // ✅ Flag de controle


/* =========================================================
   CATEGORIAS DE OCORRÊNCIA
========================================================= */

const occurrenceCategories = [
    "Mecânico", "Elétrico", "Eletromecânico", "Matriz",
    "Processo / Regulagem", "Material", "CTP", "Setup / Troca", "Outro"
];


/* =========================================================
   METAS
========================================================= */

const shiftTargets = {
    "1º turno": 8 * 60 + 48,
    "2º turno": 8 * 60 + 36,
    "3º turno": 6 * 60 + 36
};


/* =========================================================
   ELEMENTOS
========================================================= */

const dateInput = document.getElementById("date");
const shiftInput = document.getElementById("shift");
const sectorInput = document.getElementById("sector");
const leaderName = document.getElementById("leaderName");
const userAvatar = document.getElementById("userAvatar");
const machineGrid = document.getElementById("machineGrid");
const machineListSection = document.getElementById("machineListSection");
const machineScreen = document.getElementById("machineScreen");
const mainHeader = document.getElementById("mainHeader");
const contextSection = document.getElementById("contextSection");
const machineTitle = document.getElementById("machineTitle");
const machineSubtitle = document.getElementById("machineSubtitle");
const goodHoursInput = document.getElementById("goodHours");
const replacementHoursInput = document.getElementById("replacementHours");
const totalHours = document.getElementById("totalHours");
const performanceBar = document.getElementById("performanceBar");
const balanceInput = document.getElementById("balance");
const occurrenceList = document.getElementById("occurrenceList");
const occurrenceEditor = document.getElementById("occurrenceEditor");
const occurrenceType = document.getElementById("occurrenceType");
const occurrenceDescription = document.getElementById("occurrenceDescription");
const deleteMachineButton = document.getElementById("deleteMachineButton");
const nativeTimePicker = document.getElementById("nativeTimePicker");
const headerShiftLabel = document.getElementById("headerShiftLabel");

const userMenuButton = document.getElementById("userMenuButton");
const userMenuDropdown = document.getElementById("userMenuDropdown");
const userMenuAvatar = document.getElementById("userMenuAvatar");
const userMenuName = document.getElementById("userMenuName");
const userMenuEmail = document.getElementById("userMenuEmail");

const customConfirm = document.getElementById("customConfirm");
const customConfirmIcon = document.getElementById("customConfirmIcon");
const customConfirmTitle = document.getElementById("customConfirmTitle");
const customConfirmMessage = document.getElementById("customConfirmMessage");
const customConfirmCancel = document.getElementById("customConfirmCancel");
const customConfirmAccept = document.getElementById("customConfirmAccept");


/* =========================================================
   MENU DO USUÁRIO
========================================================= */

function toggleUserMenu(){
    if(!userMenuDropdown.classList.contains("hidden")){
        fecharUserMenu();
    }else{
        abrirUserMenu();
    }
}

function abrirUserMenu(){
    userMenuDropdown.classList.remove("hidden");
    userMenuButton.classList.add("open");
    userMenuButton.setAttribute("aria-expanded", "true");
}

function fecharUserMenu(){
    userMenuDropdown.classList.add("hidden");
    userMenuButton.classList.remove("open");
    userMenuButton.setAttribute("aria-expanded", "false");
}

document.addEventListener("click", event => {
    const inside = userMenuButton.contains(event.target) || userMenuDropdown.contains(event.target);
    if(!inside && !userMenuDropdown.classList.contains("hidden")) fecharUserMenu();
});

document.addEventListener("keydown", event => {
    if(event.key === "Escape" && !userMenuDropdown.classList.contains("hidden")) fecharUserMenu();
});


/* =========================================================
   RECUPERAR SENHA
========================================================= */

async function recuperarSenha(){
    fecharUserMenu();
    if(!currentUser || !currentUser.email){
        showToast("Email não disponível.");
        return;
    }
    const confirmou = await showCustomConfirm(
        "Recuperar senha",
        `Enviaremos um link de recuperação para o email ${currentUser.email}. Deseja continuar?`,
        { confirmText: "Enviar link" }
    );
    if(!confirmou) return;
    showLoading(true);
    try{
        const { error } = await supabaseClient.auth.resetPasswordForEmail(
            currentUser.email,
            { redirectTo: window.location.origin + "/index.html" }
        );
        if(error) throw error;
        showToast("Link de recuperação enviado! ✓");
    }catch(error){
        showToast("Não foi possível enviar o link.");
    }finally{
        showLoading(false);
    }
}


/* =========================================================
   CONFIRMAÇÃO INLINE
========================================================= */

let confirmResolver = null;

function showCustomConfirm(title, message, options = {}){
    return new Promise(resolve => {
        confirmResolver = resolve;
        const danger = options.danger === true;
        customConfirmTitle.textContent = title || "Confirmar ação";
        customConfirmMessage.textContent = message || "Deseja continuar?";
        customConfirmIcon.classList.toggle("danger", danger);
        customConfirmAccept.classList.toggle("danger", danger);
        customConfirmAccept.textContent = options.confirmText || "Confirmar";
        customConfirmCancel.textContent = options.cancelText || "Cancelar";
        if(options.cancelText === null){
            customConfirmCancel.style.display = "none";
        }else{
            customConfirmCancel.style.display = "";
        }
        customConfirm.classList.remove("hidden");
    });
}

function fecharConfirm(resultado){
    customConfirm.classList.add("hidden");
    customConfirmCancel.style.display = "";
    if(typeof confirmResolver === "function"){
        confirmResolver(resultado);
        confirmResolver = null;
    }
}

customConfirmCancel.addEventListener("click", () => fecharConfirm(false));
customConfirmAccept.addEventListener("click", () => fecharConfirm(true));
customConfirm.addEventListener("click", e => { if(e.target === customConfirm) fecharConfirm(false); });
document.addEventListener("keydown", e => {
    if(e.key === "Escape" && !customConfirm.classList.contains("hidden")) fecharConfirm(false);
});


/* =========================================================
   LOADING E TOAST
========================================================= */

function showLoading(show){
    document.getElementById("loading").classList.toggle("hidden", !show);
}

let toastTimer = null;
function showToast(msg){
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}


/* =========================================================
   UTILITÁRIOS
========================================================= */

function formatMachine(v){
    const n = Number(v);
    if(!Number.isFinite(n)) return String(v);
    return "M" + String(n).padStart(2,"0");
}

function machineNumber(v){
    const m = String(v||"").trim().toUpperCase().match(/^M(\d+)$/);
    if(!m) return null;
    const n = Number(m[1]);
    return (Number.isInteger(n) && n > 0) ? n : null;
}

function normalizeMachine(v){
    if(typeof v === "number") return formatMachine(v);
    const t = String(v||"").trim().toUpperCase();
    if(/^M\d+$/.test(t)) return formatMachine(Number(t.substring(1)));
    if(/^\d+$/.test(t)) return formatMachine(Number(t));
    return t;
}

function getSectorMachines(s){
    if(s === "A") return Array.from({length:29}, (_,i) => i+1);
    if(s === "B") return Array.from({length:22}, (_,i) => i+30);
    if(s === "C") return Array.from({length:34}, (_,i) => i+52);
    return [];
}

function parseMinutes(v){
    if(v === null || v === undefined) return 0;
    const t = String(v).trim();
    if(!t) return 0;
    if(/^\d{1,3}:\d{2}$/.test(t)){
        const p = t.split(":");
        const h = Number(p[0]), m = Number(p[1]);
        if(m > 59) return 0;
        return h*60 + m;
    }
    if(/^\d{3,4}$/.test(t)){
        const d = t.length === 3 ? "0"+t : t;
        const h = Number(d.substring(0,2)), m = Number(d.substring(2,4));
        if(m > 59) return 0;
        return h*60 + m;
    }
    if(/^\d{1,2}$/.test(t)) return Number(t)*60;
    return 0;
}

function minutesToHHMM(m){
    const t = Math.max(0, Math.round(Number(m)||0));
    return String(Math.floor(t/60)).padStart(2,"0") + ":" + String(t%60).padStart(2,"0");
}

function normalizarCampoHora(input){
    if(!input.value.trim()) return;
    input.value = minutesToHHMM(parseMinutes(input.value));
}

goodHoursInput.addEventListener("blur", () => normalizarCampoHora(goodHoursInput));
replacementHoursInput.addEventListener("blur", () => normalizarCampoHora(replacementHoursInput));
balanceInput.addEventListener("blur", () => normalizarCampoHora(balanceInput));

function abrirSeletorHora(targetId){
    const target = document.getElementById(targetId);
    if(!target) return;
    nativeTimeTarget = target;
    const mins = parseMinutes(target.value);
    if(target.value && mins >= 0){
        nativeTimePicker.value = String(Math.floor(mins/60)).padStart(2,"0") + ":" + String(mins%60).padStart(2,"0");
    }else{
        nativeTimePicker.value = "00:00";
    }
    try{
        if(typeof nativeTimePicker.showPicker === "function") nativeTimePicker.showPicker();
        else nativeTimePicker.click();
    }catch(e){ nativeTimePicker.click(); }
}

nativeTimePicker.addEventListener("change", () => {
    if(!nativeTimeTarget || !nativeTimePicker.value) return;
    nativeTimeTarget.value = nativeTimePicker.value;
    nativeTimeTarget.dispatchEvent(new Event("input", {bubbles:true}));
    nativeTimeTarget = null;
});

document.querySelectorAll(".time-picker-button").forEach(btn => {
    btn.addEventListener("click", () => abrirSeletorHora(btn.dataset.timeTarget));
});

function getStatusClass(total){
    const target = shiftTargets[shiftInput.value];
    if(total >= target) return "status-green";
    if(total >= target - 48) return "status-yellow";
    return "status-red";
}

function todayLocal(){
    const n = new Date();
    return n.getFullYear() + "-" + String(n.getMonth()+1).padStart(2,"0") + "-" + String(n.getDate()).padStart(2,"0");
}

function atualizarHeaderShift(){
    if(headerShiftLabel) headerShiftLabel.textContent = shiftInput.value;
}


/* =========================================================
   PERFIL
========================================================= */

async function carregarPerfil(){
    const { data, error } = await supabaseClient
        .from("usuarios").select("*")
        .eq("id", currentUser.id).eq("ativo", true).single();
    if(error) throw new Error("Não foi possível carregar seu perfil.");
    currentProfile = data;
    leaderName.textContent = data.nome || "Líder";
    const initials = String(data.nome||"U").split(" ").filter(Boolean).slice(0,2)
        .map(n => n[0].toUpperCase()).join("");
    userAvatar.textContent = initials || "U";
    userMenuAvatar.textContent = initials || "U";
    userMenuName.textContent = data.nome || "Líder";
    userMenuEmail.textContent = currentUser?.email || "—";
}


/* =========================================================
   GRID DE MÁQUINAS — SEMPRE RECARREGA ✅
========================================================= */

async function renderMachineGrid(){
    if(!dateInput.value || !shiftInput.value || !sectorInput.value || !currentUser){
        console.warn("Contexto incompleto — grade não carregada");
        return;
    }
    machineGrid.innerHTML = "";
    const machines = getSectorMachines(sectorInput.value);
    const saved = new Set();

    try{
        const { data, error } = await supabaseClient
            .from("apontamentos").select("maquina")
            .eq("data", dateInput.value)
            .eq("turno", shiftInput.value)
            .eq("setor", sectorInput.value)
            .eq("lider_id", currentUser.id);
        if(!error){
            (data||[]).forEach(i => saved.add(normalizeMachine(i.maquina)));
        }
    }catch(e){ console.error(e); }

    machines.forEach(num => {
        const m = formatMachine(num);
        const btn = document.createElement("button");
        btn.className = "machine-button" + (saved.has(m) ? " saved" : "");
        btn.textContent = m;
        btn.onclick = () => abrirMaquina(m);
        machineGrid.appendChild(btn);
    });
}

async function carregarDados(){
    showLoading(true);
    try{ await renderMachineGrid(); }
    catch(e){ showToast("Erro ao carregar dados."); }
    finally{ showLoading(false); }
}


/* =========================================================
   ABRIR MÁQUINA — PADRÃO CORRETO DE HISTÓRICO ✅
========================================================= */

async function abrirMaquina(machine){
    machineAtual = normalizeMachine(machine);
    machineTitle.textContent = machineAtual;
    const parts = dateInput.value.split("-").reverse().join("/");
    machineSubtitle.textContent = `${parts} • ${shiftInput.value} • Setor ${sectorInput.value}`;

    telaMaquinaAberta = true; // ✅ Marca flag
    history.pushState({ tela: 'maquina' }, document.title); // ✅ Entrada no histórico

    mainHeader.classList.add("hidden");
    contextSection.classList.add("hidden");
    machineListSection.classList.add("hidden");
    machineScreen.classList.remove("hidden");

    fecharUserMenu();
    await carregarFormulario();
}


/* =========================================================
   FECHAR TELA — CHAMADO SOMENTE PELO POPSTATE ✅
========================================================= */

function fecharTelaMaquinaInterno(){
    telaMaquinaAberta = false;

    machineScreen.classList.add("hidden");
    mainHeader.classList.remove("hidden");
    contextSection.classList.remove("hidden");
    machineListSection.classList.remove("hidden");

    machineAtual = null;
    apontamentoAtual = null;
    ocorrenciasAtuais = [];
    occurrenceEditIndex = null;
    occurrenceEditor.classList.add("hidden");
    restaurarCategoriasOcorrencia();

    // ✅ Recarrega a grade SEMPRE (sem guard que possa falhar)
    renderMachineGrid().catch(e => console.error("Erro ao renderizar grade:", e));
}

// Botão "Voltar" da tela → dispara history.back() → popstate fecha
function fecharTelaMaquina(){
    history.back();
}


/* =========================================================
   POPSTATE — INTERCEPTA VOLTAR DO CELULAR ✅
========================================================= */

window.addEventListener("popstate", () => {
    if(telaMaquinaAberta){
        fecharTelaMaquinaInterno();
    }
});


/* =========================================================
   CARREGAR FORMULÁRIO
========================================================= */

async function carregarFormulario(){
    apontamentoAtual = null;
    ocorrenciasAtuais = [];
    occurrenceEditIndex = null;
    goodHoursInput.value = "";
    replacementHoursInput.value = "";
    balanceInput.value = "";
    occurrenceEditor.classList.add("hidden");
    restaurarCategoriasOcorrencia();
    deleteMachineButton.classList.add("hidden");
    totalHours.textContent = "00:00";
    performanceBar.style.width = "0%";
    performanceBar.className = "performance-bar";

    const maqNum = machineNumber(machineAtual);
    if(!maqNum){ renderOccurrences(); atualizarTotal(); return; }

    const { data, error } = await supabaseClient
        .from("apontamentos").select("*")
        .eq("data", dateInput.value).eq("turno", shiftInput.value)
        .eq("setor", sectorInput.value).eq("lider_id", currentUser.id)
        .eq("maquina", maqNum).maybeSingle();

    if(error || !data){ renderOccurrences(); atualizarTotal(); return; }

    apontamentoAtual = data;
    goodHoursInput.value = data.hora_boa != null ? minutesToHHMM(data.hora_boa) : "";
    replacementHoursInput.value = data.reposicao != null ? minutesToHHMM(data.reposicao) : "";
    balanceInput.value = data.saldo != null ? minutesToHHMM(data.saldo) : "";
    deleteMachineButton.classList.remove("hidden");

    try{
        const { data: occ } = await supabaseClient
            .from("ocorrencias").select("categoria, descricao")
            .eq("apontamento_id", data.id).order("id", {ascending:true});
        ocorrenciasAtuais = (occ||[]).map(o => ({
            tipo: o.categoria || "Outro", descricao: o.descricao || ""
        }));
    }catch(e){ ocorrenciasAtuais = []; }

    atualizarTotal();
    renderOccurrences();
}


/* =========================================================
   OCORRÊNCIAS
========================================================= */

function restaurarCategoriasOcorrencia(){
    occurrenceType.innerHTML = "";
    occurrenceCategories.forEach(cat => {
        const o = document.createElement("option");
        o.value = cat; o.textContent = cat;
        occurrenceType.appendChild(o);
    });
}

function prepararCategoriaParaEdicao(cat){
    restaurarCategoriasOcorrencia();
    const v = cat || "Outro";
    if(!occurrenceCategories.includes(v)){
        const o = document.createElement("option");
        o.value = v; o.textContent = v + " (histórica)";
        occurrenceType.appendChild(o);
    }
    occurrenceType.value = v;
}

function renderOccurrences(){
    occurrenceList.innerHTML = "";
    ocorrenciasAtuais.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = "occurrence-item";
        row.innerHTML = `
            <div class="occurrence-content">
                <div class="occurrence-type">${item.tipo||"Outro"}</div>
                <div class="occurrence-description">${item.descricao||""}</div>
            </div>
            <div class="occurrence-actions">
                <button class="mini-button" type="button" data-edit="${idx}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="mini-button delete" type="button" data-del="${idx}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>`;
        occurrenceList.appendChild(row);
    });
    document.querySelectorAll("[data-edit]").forEach(b =>
        b.addEventListener("click", () => editarOcorrencia(parseInt(b.dataset.edit))));
    document.querySelectorAll("[data-del]").forEach(b =>
        b.addEventListener("click", () => removerOcorrencia(parseInt(b.dataset.del))));
}

function abrirEditorOcorrencia(){
    occurrenceEditIndex = null;
    restaurarCategoriasOcorrencia();
    occurrenceType.value = "Mecânico";
    occurrenceDescription.value = "";
    occurrenceEditor.classList.remove("hidden");
    occurrenceDescription.focus();
}

function cancelarEditorOcorrencia(){
    occurrenceEditIndex = null;
    occurrenceDescription.value = "";
    occurrenceEditor.classList.add("hidden");
    restaurarCategoriasOcorrencia();
}

function editarOcorrencia(idx){
    const item = ocorrenciasAtuais[idx];
    if(!item) return;
    occurrenceEditIndex = idx;
    prepararCategoriaParaEdicao(item.tipo);
    occurrenceDescription.value = item.descricao || "";
    occurrenceEditor.classList.remove("hidden");
    occurrenceDescription.focus();
}

function salvarOcorrenciaLocal(){
    const tipo = occurrenceType.value;
    const desc = occurrenceDescription.value.trim();
    if(!desc){ showToast("Descreva a ocorrência."); return; }
    const item = { tipo, descricao: desc };
    if(occurrenceEditIndex === null) ocorrenciasAtuais.push(item);
    else ocorrenciasAtuais[occurrenceEditIndex] = item;
    occurrenceEditIndex = null;
    occurrenceDescription.value = "";
    occurrenceEditor.classList.add("hidden");
    restaurarCategoriasOcorrencia();
    renderOccurrences();
}

async function removerOcorrencia(idx){
    const ok = await showCustomConfirm(
        "Excluir ocorrência", "Deseja realmente excluir esta ocorrência?",
        { danger:true, confirmText:"Excluir" }
    );
    if(!ok) return;
    ocorrenciasAtuais.splice(idx, 1);
    renderOccurrences();
    showToast("Ocorrência excluída.");
}


/* =========================================================
   TOTAL
========================================================= */

function atualizarTotal(){
    const good = parseMinutes(goodHoursInput.value);
    const rep = parseMinutes(replacementHoursInput.value);
    const total = good + rep;
    totalHours.textContent = minutesToHHMM(total);
    const target = shiftTargets[shiftInput.value] || 0;
    let pct = target > 0 ? Math.min(100, Math.max(0, (total/target)*100)) : 0;
    performanceBar.style.width = pct + "%";
    performanceBar.className = "performance-bar " + getStatusClass(total);
}


/* =========================================================
   SALVAR — COM VALIDAÇÃO POPUP ✅
========================================================= */

async function salvarMaquina(){
    if(!machineAtual){ showToast("Nenhuma máquina selecionada."); return; }

    const horaBoa = parseMinutes(goodHoursInput.value);
    const reposicao = parseMinutes(replacementHoursInput.value);
    const saldo = parseMinutes(balanceInput.value);
    const temOcorrencia = ocorrenciasAtuais.some(o => o.descricao.trim().length > 0);

    if(horaBoa === 0 && reposicao === 0 && saldo === 0 && !temOcorrencia){
        await showCustomConfirm(
            "Dados insuficientes",
            "Esta máquina não tem horas, saldo nem ocorrências registradas.\n\nInforme pelo menos um dos seguintes:\n• Horas boas\n• Horas de reposição\n• Saldo\n• Uma ocorrência",
            { confirmText: "Entendi", cancelText: null, danger: true }
        );
        return;
    }

    showLoading(true);
    try{
        const maqNum = Number(machineAtual.replace("M",""));
        const totalBaixado = horaBoa + reposicao;
        const ocorrencias = ocorrenciasAtuais
            .map(o => ({ categoria: o.tipo||"Outro", descricao: o.descricao.trim() }))
            .filter(o => o.descricao.length > 0);

        const { data, error } = await supabaseClient.rpc("salvar_apontamento_lider", {
            p_data: dateInput.value, p_turno: shiftInput.value, p_setor: sectorInput.value,
            p_maquina: maqNum, p_hora_boa: horaBoa, p_reposicao: reposicao,
            p_total_baixado: totalBaixado, p_saldo: saldo,
            p_observacao: null, p_ocorrencias: ocorrencias
        });
        if(error) throw error;

        showToast(machineAtual + " salvo ✓");
        fecharTelaMaquina(); // ✅ Volta via histórico (popstate fecha + renderiza grade)

    }catch(error){
        console.error("Erro ao salvar:", error);
        showToast("Não foi possível salvar.");
    }finally{
        showLoading(false);
    }
}


/* =========================================================
   EXCLUIR
========================================================= */

async function excluirMaquina(){
    if(!apontamentoAtual || !apontamentoAtual.id){
        showToast("Não há apontamento para excluir.");
        return;
    }
    const ok = await showCustomConfirm(
        "Excluir apontamento",
        `Deseja realmente excluir o apontamento da ${machineAtual}?`,
        { danger:true, confirmText:"Excluir" }
    );
    if(!ok) return;
    showLoading(true);
    try{
        const { error } = await supabaseClient.rpc("excluir_apontamento_lider", {
            p_apontamento_id: apontamentoAtual.id
        });
        if(error) throw error;
        showToast(machineAtual + " excluído ✓");
        fecharTelaMaquina(); // ✅ Volta via histórico
    }catch(error){
        showToast("Não foi possível excluir.");
    }finally{
        showLoading(false);
    }
}


/* =========================================================
   SAIR
========================================================= */

async function sair(){
    fecharUserMenu();
    const ok = await showCustomConfirm("Sair do sistema", "Deseja realmente sair?", { confirmText:"Sair" });
    if(!ok) return;
    showLoading(true);
    try{
        await supabaseClient.auth.signOut();
        window.location.href = "index.html";
    }catch(e){
        showToast("Não foi possível sair.");
    }finally{
        showLoading(false);
    }
}


/* =========================================================
   EVENTOS
========================================================= */

goodHoursInput.addEventListener("input", atualizarTotal);
replacementHoursInput.addEventListener("input", atualizarTotal);
balanceInput.addEventListener("input", atualizarTotal);

shiftInput.addEventListener("change", async () => {
    atualizarHeaderShift();
    if(!telaMaquinaAberta) await carregarDados();
});
sectorInput.addEventListener("change", async () => {
    if(!telaMaquinaAberta) await carregarDados();
});
dateInput.addEventListener("change", async () => {
    if(!telaMaquinaAberta) await carregarDados();
});


/* =========================================================
   AUTH
========================================================= */

supabaseClient.auth.onAuthStateChange((event, session) => {
    if(!session || !session.user){
        window.location.href = "index.html";
        return;
    }
    currentUser = session.user;
});


/* =========================================================
   INIT
========================================================= */

async function init(){
    showLoading(true);
    try{
        const { data: { session } } = await supabaseClient.auth.getSession();
        if(!session || !session.user){
            window.location.href = "index.html";
            return;
        }
        currentUser = session.user;
        await carregarPerfil();
        if(!dateInput.value) dateInput.value = todayLocal();
        shiftInput.value = "1º turno";
        sectorInput.value = "A";
        atualizarHeaderShift();
        await carregarDados();
    }catch(e){
        console.error(e);
        showToast("Não foi possível carregar o sistema.");
    }finally{
        showLoading(false);
    }
}

init();
