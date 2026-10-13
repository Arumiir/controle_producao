/* Cada tela roda só o próprio bloco.
   Líder e supervisor não podem dividir as mesmas const no mesmo arquivo. */
(function(){
    if(!document.getElementById("machineGrid")) return;

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
let telaMaquinaAberta = false;

/* =========================================================
   NOTIFICAÇÕES — EXCLUSIVAS DO ALMIR
========================================================= */

const NOTIFICATION_ADMIN_ID = "3b7cc3c8-3e75-412c-94d1-cbbbad41faf1";

let notificationOverlay = null;
let notificationList = null;
let notificationBadge = null;
let notificationCount = 0;
let notificationRefreshTimer = null;
let notificationRequestId = 0;


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
    const inside =
        (userMenuButton && userMenuButton.contains(event.target)) ||
        (userMenuDropdown && userMenuDropdown.contains(event.target));

    if(!inside && userMenuDropdown && !userMenuDropdown.classList.contains("hidden")){
        fecharUserMenu();
    }
});

document.addEventListener("keydown", event => {
    if(event.key === "Escape" && userMenuDropdown && !userMenuDropdown.classList.contains("hidden")){
        fecharUserMenu();
    }
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

        showToast("Link de recuperação enviado!");
    }catch(error){
        console.error(error);
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
customConfirm.addEventListener("click", e => {
    if(e.target === customConfirm) fecharConfirm(false);
});

document.addEventListener("keydown", e => {
    if(e.key === "Escape" && !customConfirm.classList.contains("hidden")){
        fecharConfirm(false);
    }
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
    if(!t) return;

    const texto = String(msg || "").replace(/\s*✓\s*$/, "").trim();
    const baixo = texto.toLowerCase();

    let tipo = "ok";

    if(baixo.includes("copiad")) tipo = "info";
    else if(
        baixo.includes("não há") || baixo.includes("nao ha") ||
        baixo.includes("nenhum") || baixo.includes("nenhuma") ||
        baixo.includes("descreva")
    ) tipo = "warn";
    else if(
        baixo.includes("não") ||
        baixo.includes("nao") ||
        baixo.includes("erro")
    ) tipo = "err";

    pintarToast(t, tipo, texto);
}

function pintarToast(t, tipo, texto){
    const icones = {
        ok:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        info:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        warn:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
        err:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
    };

    const seguro = texto
        .replace(/&/g, "&" + "amp;")
        .replace(/</g, "&" + "lt;")
        .replace(/>/g, "&" + "gt;");

    t.className = "toast " + tipo;

    t.innerHTML =
        '<div class="toast-ico">' + icones[tipo] + '</div>' +
        '<div class="toast-copy">' +
            '<div class="toast-kicker">Controle de Produção</div>' +
            '<b>' + seguro + '</b>' +
        '</div>' +
        '<button class="toast-x" type="button" aria-label="Fechar">×</button>' +
        '<div class="toast-bar"><i></i></div>';

    void t.offsetWidth;
    t.classList.add("show");

    clearTimeout(toastTimer);

    const fechar = () => t.classList.remove("show");

    toastTimer = setTimeout(fechar, 2600);

    t.querySelector(".toast-x").onclick = () => {
        clearTimeout(toastTimer);
        fechar();
    };
}


/* =========================================================
   UTILITÁRIOS
========================================================= */

function formatMachine(v){
    const n = Number(v);
    if(!Number.isFinite(n)) return String(v);
    return "M" + String(n).padStart(2, "0");
}

function machineNumber(v){
    const m = String(v || "").trim().toUpperCase().match(/^M(\d+)$/);
    if(!m) return null;

    const n = Number(m[1]);

    return (Number.isInteger(n) && n > 0) ? n : null;
}

function normalizeMachine(v){
    if(typeof v === "number") return formatMachine(v);

    const t = String(v || "").trim().toUpperCase();

    if(/^M\d+$/.test(t)) return formatMachine(Number(t.substring(1)));
    if(/^\d+$/.test(t)) return formatMachine(Number(t));

    return t;
}

function getSectorMachines(s){
    if(s === "A") return Array.from({length:29}, (_, i) => i + 1);
    if(s === "B") return Array.from({length:22}, (_, i) => i + 30);
    if(s === "C") return Array.from({length:34}, (_, i) => i + 52);
    return [];
}

function parseMinutes(v){
    if(v === null || v === undefined) return 0;

    const t = String(v).trim();
    if(!t) return 0;

    if(/^\d{1,3}:\d{2}$/.test(t)){
        const p = t.split(":");
        const h = Number(p[0]);
        const m = Number(p[1]);

        if(m > 59) return 0;

        return h * 60 + m;
    }

    if(/^\d{3,4}$/.test(t)){
        const d = t.length === 3 ? "0" + t : t;
        const h = Number(d.substring(0, 2));
        const m = Number(d.substring(2, 4));

        if(m > 59) return 0;

        return h * 60 + m;
    }

    if(/^\d{1,2}$/.test(t)) return Number(t) * 60;

    return 0;
}

function minutesToHHMM(m){
    const t = Math.max(0, Math.round(Number(m) || 0));

    return String(Math.floor(t / 60)).padStart(2, "0") +
        ":" +
        String(t % 60).padStart(2, "0");
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
        nativeTimePicker.value =
            String(Math.floor(mins / 60)).padStart(2, "0") +
            ":" +
            String(mins % 60).padStart(2, "0");
    }else{
        nativeTimePicker.value = "00:00";
    }

    try{
        if(typeof nativeTimePicker.showPicker === "function"){
            nativeTimePicker.showPicker();
        }else{
            nativeTimePicker.click();
        }
    }catch(e){
        nativeTimePicker.click();
    }
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

    return n.getFullYear() +
        "-" + String(n.getMonth() + 1).padStart(2, "0") +
        "-" + String(n.getDate()).padStart(2, "0");
}

function atualizarHeaderShift(){
    if(headerShiftLabel) headerShiftLabel.textContent = shiftInput.value;
}


/* =========================================================
   PERFIL
========================================================= */

async function carregarPerfil(){
    const { data, error } = await supabaseClient
        .from("usuarios")
        .select("*")
        .eq("id", currentUser.id)
        .eq("ativo", true)
        .single();

    if(error) throw new Error("Não foi possível carregar seu perfil.");

    currentProfile = data;

    leaderName.textContent = data.nome || "Líder";

    const initials = String(data.nome || "U")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(n => n[0].toUpperCase())
        .join("");

    userAvatar.textContent = initials || "U";
    userMenuAvatar.textContent = initials || "U";
    userMenuName.textContent = data.nome || "Líder";
    userMenuEmail.textContent = currentUser?.email || "—";
}


/* =========================================================
   NOTIFICAÇÕES — ESTILO
========================================================= */

function configurarEstilosNotificacoes(){
    if(document.getElementById("notificationStyles")) return;

    const style = document.createElement("style");
    style.id = "notificationStyles";

    style.textContent = `
        .notification-bell-button {
            position: relative;
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            width: 42px;
            height: 42px;
            padding: 0;
            border: 1px solid #dce3ea;
            border-radius: 13px;
            background: #ffffff;
            color: #344256;
            cursor: pointer;
            transition: background .18s ease, border-color .18s ease, transform .18s ease;
            -webkit-tap-highlight-color: transparent;
        }

        .notification-bell-button:hover {
            background: #f3f6f9;
            border-color: #c6d1dc;
        }

        .notification-bell-button:active {
            transform: scale(.96);
        }

        .notification-bell-button svg {
            width: 21px;
            height: 21px;
        }

        .notification-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            min-width: 19px;
            height: 19px;
            padding: 0 5px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            border-radius: 999px;
            background: #d92d20;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            line-height: 1;
            box-sizing: border-box;
        }

        .notification-badge[hidden] {
            display: none !important;
        }

        .notification-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(15, 23, 42, .42);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            opacity: 1;
            visibility: visible;
            transition: opacity .18s ease, visibility .18s ease;
        }

        .notification-overlay.hidden {
            display: none !important;
        }

        .notification-panel {
            display: flex;
            flex-direction: column;
            width: min(100%, 540px);
            max-height: min(760px, 88vh);
            overflow: hidden;
            border: 1px solid #e0e6ed;
            border-radius: 20px;
            background: #ffffff;
            color: #172033;
            box-shadow: 0 24px 80px rgba(15, 23, 42, .22);
        }

        .notification-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 20px 20px 16px;
            border-bottom: 1px solid #e9edf2;
            background: #ffffff;
        }

        .notification-panel-heading {
            min-width: 0;
        }

        .notification-panel-title {
            margin: 0;
            font-size: 19px;
            line-height: 1.3;
            font-weight: 800;
            letter-spacing: -.35px;
            color: #172033;
        }

        .notification-panel-subtitle {
            margin-top: 4px;
            font-size: 12px;
            color: #64748b;
        }

        .notification-panel-actions {
            display: flex;
            align-items: center;
            gap: 7px;
            flex: 0 0 auto;
        }

        .notification-icon-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            padding: 0;
            border: 1px solid #e1e7ee;
            border-radius: 10px;
            background: #ffffff;
            color: #475569;
            cursor: pointer;
        }

        .notification-icon-button:hover {
            background: #f4f7fa;
        }

        .notification-icon-button svg {
            width: 17px;
            height: 17px;
        }

        .notification-panel-content {
            overflow-y: auto;
            overscroll-behavior: contain;
            padding: 12px;
            background: #f7f9fb;
        }

        .notification-item {
            display: flex;
            align-items: flex-start;
            gap: 11px;
            padding: 15px 13px;
            margin-bottom: 9px;
            border: 1px solid #e3e9f0;
            border-radius: 13px;
            background: #ffffff;
        }

        .notification-item:last-child {
            margin-bottom: 0;
        }

        .notification-item.unread {
            border-color: #c8d9ed;
            background: #fafdff;
        }

        .notification-item-indicator {
            flex: 0 0 auto;
            width: 9px;
            height: 9px;
            margin-top: 6px;
            border-radius: 50%;
            background: #cbd5e1;
        }

        .notification-item.unread .notification-item-indicator {
            background: #2874c8;
            box-shadow: 0 0 0 3px #e7f1fd;
        }

        .notification-item-body {
            flex: 1 1 auto;
            min-width: 0;
        }

        .notification-item-title {
            margin: 0;
            color: #1e293b;
            font-size: 13px;
            line-height: 1.45;
            font-weight: 800;
            overflow-wrap: anywhere;
        }

        .notification-item-message {
            margin-top: 6px;
            color: #475569;
            font-size: 12px;
            line-height: 1.6;
            white-space: pre-line;
            overflow-wrap: anywhere;
        }

        .notification-item-date {
            margin-top: 9px;
            color: #8491a3;
            font-size: 10px;
            line-height: 1.4;
        }

        .notification-read-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: 11px;
            min-height: 31px;
            padding: 0 10px;
            border: 1px solid #c9dbee;
            border-radius: 9px;
            background: #f0f7ff;
            color: #215d9b;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
        }

        .notification-read-button:hover {
            background: #e2efff;
        }

        .notification-read-button:disabled {
            opacity: .6;
            cursor: wait;
        }

        .notification-state {
            padding: 42px 18px;
            text-align: center;
            color: #64748b;
            font-size: 13px;
            line-height: 1.6;
        }

        .notification-state strong {
            display: block;
            margin-bottom: 5px;
            color: #334155;
            font-size: 14px;
        }

        .notification-panel-footer {
            padding: 11px 18px;
            border-top: 1px solid #e9edf2;
            background: #ffffff;
            color: #94a3b8;
            text-align: center;
            font-size: 10px;
        }

        @media (max-width: 560px) {
            .notification-overlay {
                align-items: flex-end;
                padding: 0;
            }

            .notification-panel {
                width: 100%;
                max-height: 88vh;
                border-radius: 20px 20px 0 0;
                border-bottom: 0;
            }

            .notification-panel-header {
                padding: 18px 16px 14px;
            }

            .notification-panel-content {
                padding: 10px;
            }

            .notification-item {
                padding: 13px 11px;
            }

            .notification-bell-button {
                width: 40px;
                height: 40px;
            }
        }
    `;

    document.head.appendChild(style);
}


/* =========================================================
   NOTIFICAÇÕES — CRIAR INTERFACE
========================================================= */

function configurarNotificacoes(){
    if(!currentProfile || currentProfile.id !== NOTIFICATION_ADMIN_ID){
        return;
    }

    configurarEstilosNotificacoes();

    if(!userMenuButton || !userMenuButton.parentElement){
        console.warn("Notificações: não foi possível localizar o botão do menu do usuário.");
        return;
    }

    if(!document.getElementById("notificationBellButton")){
        const button = document.createElement("button");

        button.type = "button";
        button.id = "notificationBellButton";
        button.className = "notification-bell-button";
        button.setAttribute("aria-label", "Abrir notificações");
        button.setAttribute("aria-haspopup", "dialog");
        button.setAttribute("aria-expanded", "false");
        button.title = "Notificações";

        button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
                <path d="M10 21h4"></path>
            </svg>
            <span class="notification-badge" id="notificationBadge" hidden>0</span>
        `;

        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();

            fecharUserMenu();
            abrirNotificacoes();
        });

        userMenuButton.parentElement.insertBefore(button, userMenuButton);
    }

    notificationBadge = document.getElementById("notificationBadge");

    if(!document.getElementById("notificationOverlay")){
        notificationOverlay = document.createElement("div");

        notificationOverlay.id = "notificationOverlay";
        notificationOverlay.className = "notification-overlay hidden";
        notificationOverlay.setAttribute("aria-hidden", "true");

        notificationOverlay.innerHTML = `
            <section
                class="notification-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="notificationPanelTitle"
            >
                <header class="notification-panel-header">
                    <div class="notification-panel-heading">
                        <h2 class="notification-panel-title" id="notificationPanelTitle">
                            Notificações
                        </h2>
                        <div class="notification-panel-subtitle" id="notificationPanelSubtitle">
                            Atualizações dos apontamentos de produção
                        </div>
                    </div>

                    <div class="notification-panel-actions">
                        <button
                            type="button"
                            class="notification-icon-button"
                            id="notificationRefreshButton"
                            aria-label="Atualizar notificações"
                            title="Atualizar"
                        >
                            <svg viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="1.8"
                                 stroke-linecap="round" stroke-linejoin="round"
                                 aria-hidden="true">
                                <path d="M20 7v5h-5"></path>
                                <path d="M4 17v-5h5"></path>
                                <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12"></path>
                                <path d="M4 12l2.8 5a7 7 0 0 0 11.6-2"></path>
                            </svg>
                        </button>

                        <button
                            type="button"
                            class="notification-icon-button"
                            id="notificationCloseButton"
                            aria-label="Fechar notificações"
                            title="Fechar"
                        >
                            <svg viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="1.8"
                                 stroke-linecap="round" stroke-linejoin="round"
                                 aria-hidden="true">
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                            </svg>
                        </button>
                    </div>
                </header>

                <div class="notification-panel-content" id="notificationList">
                    <div class="notification-state">
                        Carregando notificações...
                    </div>
                </div>

                <footer class="notification-panel-footer">
                    Atualização automática a cada 60 segundos
                </footer>
            </section>
        `;

        document.body.appendChild(notificationOverlay);

        notificationOverlay.addEventListener("click", event => {
            if(event.target === notificationOverlay){
                fecharNotificacoes();
            }
        });

        document.getElementById("notificationCloseButton")
            .addEventListener("click", fecharNotificacoes);

        document.getElementById("notificationRefreshButton")
            .addEventListener("click", () => carregarNotificacoes());

        document.addEventListener("keydown", event => {
            if(
                event.key === "Escape" &&
                notificationOverlay &&
                !notificationOverlay.classList.contains("hidden")
            ){
                fecharNotificacoes();
            }
        });
    }else{
        notificationOverlay = document.getElementById("notificationOverlay");
    }

    notificationList = document.getElementById("notificationList");

    atualizarContadorNotificacoes();

    if(notificationRefreshTimer === null){
        notificationRefreshTimer = setInterval(() => {
            if(document.visibilityState === "visible"){
                atualizarContadorNotificacoes();

                if(
                    notificationOverlay &&
                    !notificationOverlay.classList.contains("hidden")
                ){
                    carregarNotificacoes();
                }
            }
        }, 60000);
    }

    window.addEventListener("focus", () => {
        atualizarContadorNotificacoes();

        if(
            notificationOverlay &&
            !notificationOverlay.classList.contains("hidden")
        ){
            carregarNotificacoes();
        }
    });

    document.addEventListener("visibilitychange", () => {
        if(document.visibilityState === "visible"){
            atualizarContadorNotificacoes();
        }
    });
}


/* =========================================================
   NOTIFICAÇÕES — CONTADOR
========================================================= */

async function atualizarContadorNotificacoes(){
    if(
        !currentUser ||
        !currentProfile ||
        currentProfile.id !== NOTIFICATION_ADMIN_ID
    ){
        return;
    }

    try{
        const { data, error } = await supabaseClient.rpc(
            "contar_minhas_notificacoes_nao_lidas"
        );

        if(error) throw error;

        let total = 0;

        if(typeof data === "number"){
            total = data;
        }else if(typeof data === "string"){
            total = Number(data);
        }else if(Array.isArray(data) && data.length){
            const primeira = data[0];

            if(typeof primeira === "number" || typeof primeira === "string"){
                total = Number(primeira);
            }else if(primeira && typeof primeira === "object"){
                const valor = Object.values(primeira)[0];
                total = Number(valor);
            }
        }else if(data && typeof data === "object"){
            const valor = Object.values(data)[0];
            total = Number(valor);
        }

        notificationCount = Number.isFinite(total) ? Math.max(0, total) : 0;

        if(notificationBadge){
            notificationBadge.textContent = notificationCount > 99
                ? "99+"
                : String(notificationCount);

            notificationBadge.hidden = notificationCount === 0;
        }

        const bell = document.getElementById("notificationBellButton");

        if(bell){
            bell.setAttribute(
                "aria-label",
                notificationCount > 0
                    ? `Abrir notificações. ${notificationCount} não lidas.`
                    : "Abrir notificações"
            );
        }

        const subtitle = document.getElementById("notificationPanelSubtitle");

        if(subtitle){
            subtitle.textContent = notificationCount > 0
                ? `${notificationCount} notificação(ões) não lida(s)`
                : "Atualizações dos apontamentos de produção";
        }
    }catch(error){
        console.error("Erro ao consultar contador de notificações:", error);
    }
}


/* =========================================================
   NOTIFICAÇÕES — DATA E HORA
========================================================= */

function formatarDataNotificacao(valor){
    if(!valor) return "Data não disponível";

    const data = new Date(valor);

    if(Number.isNaN(data.getTime())){
        return "Data não disponível";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(data);
}


/* =========================================================
   NOTIFICAÇÕES — ESTADOS DA LISTA
========================================================= */

function mostrarEstadoNotificacoes(titulo, mensagem){
    if(!notificationList) return;

    notificationList.replaceChildren();

    const state = document.createElement("div");
    state.className = "notification-state";

    const strong = document.createElement("strong");
    strong.textContent = titulo;

    const description = document.createElement("div");
    description.textContent = mensagem || "";

    state.appendChild(strong);
    state.appendChild(description);
    notificationList.appendChild(state);
}


/* =========================================================
   NOTIFICAÇÕES — RENDERIZAR LISTA
========================================================= */

function renderizarNotificacoes(lista){
    if(!notificationList) return;

    notificationList.replaceChildren();

    if(!Array.isArray(lista) || lista.length === 0){
        mostrarEstadoNotificacoes(
            "Tudo em dia",
            "Nenhuma notificação encontrada."
        );
        return;
    }

    lista.forEach(notificacao => {
        const item = document.createElement("article");

        const naoLida = !notificacao.lida_em;

        item.className = "notification-item" + (naoLida ? " unread" : "");

        const indicator = document.createElement("span");
        indicator.className = "notification-item-indicator";
        indicator.setAttribute("aria-hidden", "true");

        const body = document.createElement("div");
        body.className = "notification-item-body";

        const title = document.createElement("h3");
        title.className = "notification-item-title";
        title.textContent = notificacao.titulo || "Notificação";

        const message = document.createElement("div");
        message.className = "notification-item-message";
        message.textContent = notificacao.mensagem || "";

        const date = document.createElement("div");
        date.className = "notification-item-date";
        date.textContent = formatarDataNotificacao(notificacao.criado_em);

        body.appendChild(title);
        body.appendChild(message);
        body.appendChild(date);

        if(naoLida){
            const button = document.createElement("button");

            button.type = "button";
            button.className = "notification-read-button";
            button.textContent = "Marcar como lida";

            button.addEventListener("click", async () => {
                await marcarNotificacaoLida(notificacao.id, button);
            });

            body.appendChild(button);
        }else{
            const readLabel = document.createElement("div");

            readLabel.className = "notification-item-date";
            readLabel.textContent = "Lida";

            body.appendChild(readLabel);
        }

        item.appendChild(indicator);
        item.appendChild(body);

        notificationList.appendChild(item);
    });
}


/* =========================================================
   NOTIFICAÇÕES — BUSCAR
========================================================= */

async function carregarNotificacoes(){
    if(
        !currentUser ||
        !currentProfile ||
        currentProfile.id !== NOTIFICATION_ADMIN_ID
    ){
        return;
    }

    if(!notificationList) return;

    const requestId = ++notificationRequestId;

    mostrarEstadoNotificacoes(
        "Carregando notificações...",
        "Aguarde um instante."
    );

    try{
        const { data, error } = await supabaseClient.rpc(
            "listar_minhas_notificacoes",
            { p_limite: 50 }
        );

        if(error) throw error;

        if(requestId !== notificationRequestId) return;

        renderizarNotificacoes(data || []);

        await atualizarContadorNotificacoes();
    }catch(error){
        console.error("Erro ao carregar notificações:", error);

        if(requestId !== notificationRequestId) return;

        mostrarEstadoNotificacoes(
            "Não foi possível carregar",
            "Verifique sua conexão e tente atualizar novamente."
        );
    }
}


/* =========================================================
   NOTIFICAÇÕES — MARCAR COMO LIDA
========================================================= */

async function marcarNotificacaoLida(id, button){
    if(
        !currentUser ||
        !currentProfile ||
        currentProfile.id !== NOTIFICATION_ADMIN_ID
    ){
        return;
    }

    if(id === null || id === undefined){
        showToast("Notificação inválida.");
        return;
    }

    if(button){
        button.disabled = true;
        button.textContent = "Atualizando...";
    }

    try{
        const { data, error } = await supabaseClient.rpc(
            "marcar_notificacao_lida",
            { p_notificacao_id: id }
        );

        if(error) throw error;

        if(data === false){
            showToast("Não foi possível marcar a notificação como lida.");
            return;
        }

        await carregarNotificacoes();
        await atualizarContadorNotificacoes();
    }catch(error){
        console.error("Erro ao marcar notificação como lida:", error);
        showToast("Não foi possível marcar como lida.");

        if(button){
            button.disabled = false;
            button.textContent = "Marcar como lida";
        }
    }
}


/* =========================================================
   NOTIFICAÇÕES — ABRIR / FECHAR
========================================================= */

function abrirNotificacoes(){
    if(
        !currentProfile ||
        currentProfile.id !== NOTIFICATION_ADMIN_ID ||
        !notificationOverlay
    ){
        return;
    }

    notificationOverlay.classList.remove("hidden");
    notificationOverlay.setAttribute("aria-hidden", "false");

    const bell = document.getElementById("notificationBellButton");

    if(bell){
        bell.setAttribute("aria-expanded", "true");
    }

    carregarNotificacoes();
}

function fecharNotificacoes(){
    if(!notificationOverlay) return;

    notificationOverlay.classList.add("hidden");
    notificationOverlay.setAttribute("aria-hidden", "true");

    const bell = document.getElementById("notificationBellButton");

    if(bell){
        bell.setAttribute("aria-expanded", "false");
    }
}


/* =========================================================
   GRID DE MÁQUINAS
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
            .from("apontamentos")
            .select("maquina")
            .eq("data", dateInput.value)
            .eq("turno", shiftInput.value)
            .eq("setor", sectorInput.value)
            .eq("lider_id", currentUser.id);

        if(!error){
            (data || []).forEach(i => saved.add(normalizeMachine(i.maquina)));
        }
    }catch(e){
        console.error(e);
    }

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

    try{
        await renderMachineGrid();
    }catch(e){
        showToast("Erro ao carregar dados.");
    }finally{
        showLoading(false);
    }
}


/* =========================================================
   ABRIR / FECHAR MÁQUINA
========================================================= */

async function abrirMaquina(machine){
    machineAtual = normalizeMachine(machine);
    machineTitle.textContent = machineAtual;

    const parts = dateInput.value.split("-").reverse().join("/");

    machineSubtitle.textContent =
        `${parts} • ${shiftInput.value} • Setor ${sectorInput.value}`;

    telaMaquinaAberta = true;

    history.pushState({ tela: "maquina" }, document.title);

    mainHeader.classList.add("hidden");
    contextSection.classList.add("hidden");
    machineListSection.classList.add("hidden");
    machineScreen.classList.remove("hidden");

    fecharUserMenu();
    fecharNotificacoes();

    await carregarFormulario();
}

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

    renderMachineGrid().catch(e => console.error("Erro ao renderizar grade:", e));
}

function fecharTelaMaquina(){
    history.back();
}

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

    if(!maqNum){
        renderOccurrences();
        atualizarTotal();
        return;
    }

    const { data, error } = await supabaseClient
        .from("apontamentos")
        .select("*")
        .eq("data", dateInput.value)
        .eq("turno", shiftInput.value)
        .eq("setor", sectorInput.value)
        .eq("lider_id", currentUser.id)
        .eq("maquina", maqNum)
        .maybeSingle();

    if(error || !data){
        renderOccurrences();
        atualizarTotal();
        return;
    }

    apontamentoAtual = data;

    goodHoursInput.value = data.hora_boa != null
        ? minutesToHHMM(data.hora_boa)
        : "";

    replacementHoursInput.value = data.reposicao != null
        ? minutesToHHMM(data.reposicao)
        : "";

    balanceInput.value = data.saldo != null
        ? minutesToHHMM(data.saldo)
        : "";

    deleteMachineButton.classList.remove("hidden");

    try{
        const { data: occ } = await supabaseClient
            .from("ocorrencias")
            .select("categoria, descricao")
            .eq("apontamento_id", data.id)
            .order("id", {ascending:true});

        ocorrenciasAtuais = (occ || []).map(o => ({
            tipo: o.categoria || "Outro",
            descricao: o.descricao || ""
        }));
    }catch(e){
        ocorrenciasAtuais = [];
    }

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

        o.value = cat;
        o.textContent = cat;

        occurrenceType.appendChild(o);
    });
}

function prepararCategoriaParaEdicao(cat){
    restaurarCategoriasOcorrencia();

    const v = cat || "Outro";

    if(!occurrenceCategories.includes(v)){
        const o = document.createElement("option");

        o.value = v;
        o.textContent = v + " (histórica)";

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
                <div class="occurrence-type"></div>
                <div class="occurrence-description"></div>
            </div>
            <div class="occurrence-actions">
                <button class="mini-button" type="button" data-edit="${idx}" aria-label="Editar ocorrência">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="mini-button delete" type="button" data-del="${idx}" aria-label="Excluir ocorrência">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>`;

        row.querySelector(".occurrence-type").textContent = item.tipo || "Outro";
        row.querySelector(".occurrence-description").textContent = item.descricao || "";

        occurrenceList.appendChild(row);
    });

    document.querySelectorAll("[data-edit]").forEach(b =>
        b.addEventListener("click", () => editarOcorrencia(parseInt(b.dataset.edit)))
    );

    document.querySelectorAll("[data-del]").forEach(b =>
        b.addEventListener("click", () => removerOcorrencia(parseInt(b.dataset.del)))
    );
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

    if(!desc){
        showToast("Descreva a ocorrência.");
        return;
    }

    const item = { tipo, descricao: desc };

    if(occurrenceEditIndex === null){
        ocorrenciasAtuais.push(item);
    }else{
        ocorrenciasAtuais[occurrenceEditIndex] = item;
    }

    occurrenceEditIndex = null;
    occurrenceDescription.value = "";

    occurrenceEditor.classList.add("hidden");

    restaurarCategoriasOcorrencia();
    renderOccurrences();
}

async function removerOcorrencia(idx){
    const ok = await showCustomConfirm(
        "Excluir ocorrência",
        "Deseja realmente excluir esta ocorrência?",
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

    const pct = target > 0
        ? Math.min(100, Math.max(0, (total / target) * 100))
        : 0;

    performanceBar.style.width = pct + "%";
    performanceBar.className = "performance-bar " + getStatusClass(total);
}


/* =========================================================
   SALVAR
========================================================= */

async function salvarMaquina(){
    if(!machineAtual){
        showToast("Nenhuma máquina selecionada.");
        return;
    }

    const horaBoa = parseMinutes(goodHoursInput.value);
    const reposicao = parseMinutes(replacementHoursInput.value);
    const saldo = parseMinutes(balanceInput.value);

    const temOcorrencia = ocorrenciasAtuais.some(
        o => o.descricao.trim().length > 0
    );

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
        const maqNum = Number(machineAtual.replace("M", ""));
        const totalBaixado = horaBoa + reposicao;

        const ocorrencias = ocorrenciasAtuais
            .map(o => ({
                categoria: o.tipo || "Outro",
                descricao: o.descricao.trim()
            }))
            .filter(o => o.descricao.length > 0);

        const { data, error } = await supabaseClient.rpc(
            "salvar_apontamento_lider",
            {
                p_data: dateInput.value,
                p_turno: shiftInput.value,
                p_setor: sectorInput.value,
                p_maquina: maqNum,
                p_hora_boa: horaBoa,
                p_reposicao: reposicao,
                p_total_baixado: totalBaixado,
                p_saldo: saldo,
                p_observacao: null,
                p_ocorrencias: ocorrencias
            }
        );

        if(error) throw error;

        showToast(machineAtual + " salvo ✓");

        fecharTelaMaquina();
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
        const { error } = await supabaseClient.rpc(
            "excluir_apontamento_lider",
            { p_apontamento_id: apontamentoAtual.id }
        );

        if(error) throw error;

        showToast(machineAtual + " excluído ✓");

        fecharTelaMaquina();
    }catch(error){
        console.error("Erro ao excluir:", error);
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
    fecharNotificacoes();

    const ok = await showCustomConfirm(
        "Sair do sistema",
        "Deseja realmente sair?",
        { confirmText:"Sair" }
    );

    if(!ok) return;

    showLoading(true);

    try{
        await supabaseClient.auth.signOut();
        window.location.href = "index.html";
    }catch(e){
        console.error(e);
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

    if(!telaMaquinaAberta){
        await carregarDados();
    }
});

sectorInput.addEventListener("change", async () => {
    if(!telaMaquinaAberta){
        await carregarDados();
    }
});

dateInput.addEventListener("change", async () => {
    if(!telaMaquinaAberta){
        await carregarDados();
    }
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

        /* O sino só é criado para a conta autorizada. */
        configurarNotificacoes();

        if(!dateInput.value){
            dateInput.value = todayLocal();
        }

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


window.toggleUserMenu = toggleUserMenu;
window.recuperarSenha = recuperarSenha;
window.sair = sair;
window.fecharTelaMaquina = fecharTelaMaquina;
window.abrirEditorOcorrencia = abrirEditorOcorrencia;
window.cancelarEditorOcorrencia = cancelarEditorOcorrencia;
window.salvarOcorrenciaLocal = salvarOcorrenciaLocal;
window.salvarMaquina = salvarMaquina;
window.excluirMaquina = excluirMaquina;

window.abrirNotificacoes = abrirNotificacoes;
window.fecharNotificacoes = fecharNotificacoes;
window.atualizarNotificacoes = carregarNotificacoes;

})();


(function(){
    if(!document.getElementById("listaHoras")) return;

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://icajmncojvidhrqlbevq.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_vQFsGutuZDHBruMghZkQYQ_BSwEBXFp";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   ESTADO
========================================================= */

let currentUser = null;
let currentProfile = null;

let dados = [];

let maquinaAberta = null;


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

const dataInput = document.getElementById("data");
const turnoInput = document.getElementById("turno");
const setorInput = document.getElementById("setor");
const listaHoras = document.getElementById("listaHoras");
const listaDrive = document.getElementById("listaDrive");
const closingCard = document.getElementById("closingCard");
const reviewCard = document.getElementById("reviewCard");
const textoFechamento = document.getElementById("textoFechamento");


/* =========================================================
   UTILITÁRIOS
========================================================= */

let toastTimer = null;

function mostrarToast(mensagem){
    const toast = document.getElementById("toast");
    if(!toast) return;

    const texto = String(mensagem || "").replace(/\s*✓\s*$/, "").trim();
    const baixo = texto.toLowerCase();

    let tipo = "ok";

    if(baixo.includes("copiad")) tipo = "info";
    else if(
        baixo.includes("não há") || baixo.includes("nao ha") ||
        baixo.includes("nenhum") || baixo.includes("nenhuma") ||
        baixo.includes("descreva")
    ) tipo = "warn";
    else if(
        baixo.includes("não") ||
        baixo.includes("nao") ||
        baixo.includes("erro")
    ) tipo = "err";

    const icones = {
        ok:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        info:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        warn:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
        err:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
    };

    const seguro = texto
        .replace(/&/g, "&" + "amp;")
        .replace(/</g, "&" + "lt;")
        .replace(/>/g, "&" + "gt;");

    toast.className = "toast " + tipo;

    toast.innerHTML =
        '<div class="toast-ico">' + icones[tipo] + '</div>' +
        '<div class="toast-copy">' +
            '<div class="toast-kicker">Controle de Produção</div>' +
            '<b>' + seguro + '</b>' +
        '</div>' +
        '<button class="toast-x" type="button" aria-label="Fechar">×</button>' +
        '<div class="toast-bar"><i></i></div>';

    void toast.offsetWidth;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    const fechar = () => toast.classList.remove("show");

    toastTimer = setTimeout(fechar, 2600);

    toast.querySelector(".toast-x").onclick = () => {
        clearTimeout(toastTimer);
        fechar();
    };
}

function showLoading(show){
    document.getElementById("loading").classList.toggle("hidden", !show);
}

function escapeHtml(value){
    if(value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&" + "amp;")
        .replace(/</g, "&" + "lt;")
        .replace(/>/g, "&" + "gt;")
        .replace(/"/g, "&" + "quot;")
        .replace(/'/g, "&" + "#039;");
}

function normalizarMaquina(valor){
    if(valor === null || valor === undefined || valor === ""){
        return null;
    }

    let texto = String(valor).trim().toUpperCase();
    texto = texto.replace(/^M/, "");

    const numero = Number(texto);

    if(!Number.isInteger(numero) || numero <= 0){
        return null;
    }

    return numero;
}

function formatMachine(valor){
    const numero = normalizarMaquina(valor);

    if(numero === null) return "M--";

    return "M" + String(numero).padStart(2, "0");
}

function parseTime(value){
    if(value === null || value === undefined || value === ""){
        return 0;
    }

    const texto = String(value).trim();

    if(/^\d{1,3}:\d{2}$/.test(texto)){
        const partes = texto.split(":");
        const horas = Number(partes[0]);
        const minutos = Number(partes[1]);

        if(minutos > 59) return 0;

        return horas * 60 + minutos;
    }

    const numero = Number(texto);

    return Number.isFinite(numero) ? numero : 0;
}

function formatMinutes(minutes){
    minutes = Number(minutes) || 0;

    const negativo = minutes < 0;
    minutes = Math.abs(minutes);

    const horas = Math.floor(minutes / 60);
    const minutos = minutes % 60;

    const resultado =
        String(horas).padStart(2, "0") +
        ":" +
        String(minutos).padStart(2, "0");

    return negativo ? "-" + resultado : resultado;
}

function todayLocal(){
    const now = new Date();

    const ano = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, "0");
    const dia = String(now.getDate()).padStart(2, "0");

    return ano + "-" + mes + "-" + dia;
}


/* =========================================================
   STATUS
========================================================= */

function getStatusClass(totalMinutes){
    const target = shiftTargets[turnoInput.value];

    if(totalMinutes >= target) return "status-green";
    if(totalMinutes >= target - 48) return "status-yellow";

    return "status-red";
}

function getStatusDotClass(totalMinutes){
    const target = shiftTargets[turnoInput.value];

    if(totalMinutes >= target) return "status-dot-green";
    if(totalMinutes >= target - 48) return "status-dot-yellow";

    return "status-dot-red";
}


/* =========================================================
   AUTENTICAÇÃO
========================================================= */

async function verificarAcesso(){
    const { data: { session } } = await supabaseClient.auth.getSession();

    if(!session){
        window.location.href = "index.html";
        return false;
    }

    currentUser = session.user;

    const { data: usuario, error } = await supabaseClient
        .from("usuarios")
        .select("*")
        .eq("id", currentUser.id)
        .eq("ativo", true)
        .single();

    if(error || !usuario){
        alert("Usuário sem cadastro no sistema.");

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";

        return false;
    }

    if(usuario.perfil !== "supervisor"){
        alert("Acesso restrito ao supervisor.");
        window.location.href = "lider.html";

        return false;
    }

    currentProfile = usuario;

    document.getElementById("supervisorName").textContent =
        usuario.nome || "Supervisor";

    const initials = String(usuario.nome || "U")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(nome => nome[0].toUpperCase())
        .join("");

    document.getElementById("userAvatar").textContent = initials || "U";

    atualizarHeaderVisual();

    return true;
}


/* =========================================================
   CARREGAMENTO
========================================================= */

async function carregarDados(){
    const data = dataInput.value;
    const turno = turnoInput.value;
    const setor = setorInput.value;

    if(!data || !turno || !setor) return;

    showLoading(true);

    dados = [];
    maquinaAberta = null;

    resetarRevisao();

    listaHoras.innerHTML = "";
    listaDrive.innerHTML = "";

    document.getElementById("tituloSetor").textContent = setor;

    try{
        const { data: apontamentos, error } = await supabaseClient
            .from("apontamentos")
            .select(`
                id,
                data,
                turno,
                setor,
                maquina,
                lider_id,
                hora_boa,
                reposicao,
                total_baixado,
                saldo,
                observacao,
                nota_supervisor
            `)
            .eq("data", data)
            .eq("turno", turno)
            .eq("setor", setor)
            .order("maquina", { ascending:true });

        if(error) throw error;

        const mapa = new Map();

        for(const item of (apontamentos || [])){
            const maquina = normalizarMaquina(item.maquina);

            if(maquina === null) continue;

            mapa.set(maquina, {
                ...item,
                maquina: maquina,
                ocorrencias: [],
                lider_nome: "—"
            });
        }

        dados = Array.from(mapa.values()).sort(
            (a, b) => a.maquina - b.maquina
        );

        const liderIds = [
            ...new Set(
                dados
                    .map(item => item.lider_id)
                    .filter(Boolean)
            )
        ];

        if(liderIds.length){
            const { data: lideres, error: erroLideres } = await supabaseClient
                .from("usuarios")
                .select("id, nome")
                .in("id", liderIds);

            if(erroLideres){
                console.error("Erro ao carregar líderes:", erroLideres);
            }else{
                const mapaLideres = new Map();

                (lideres || []).forEach(lider => {
                    mapaLideres.set(lider.id, lider.nome || "—");
                });

                dados.forEach(item => {
                    item.lider_nome = mapaLideres.get(item.lider_id) || "—";
                });
            }
        }

        const idsApontamentos = dados
            .map(item => item.id)
            .filter(Boolean);

        if(idsApontamentos.length){
            const { data: ocorrencias, error: erroOcorrencias } =
                await supabaseClient
                    .from("ocorrencias")
                    .select("*")
                    .in("apontamento_id", idsApontamentos)
                    .order("id", { ascending:true });

            if(erroOcorrencias){
                console.error("Erro ao carregar ocorrências:", erroOcorrencias);
            }else{
                const mapaOcorrencias = new Map();

                (ocorrencias || []).forEach(ocorrencia => {
                    const id = ocorrencia.apontamento_id;

                    if(!mapaOcorrencias.has(id)){
                        mapaOcorrencias.set(id, []);
                    }

                    mapaOcorrencias.get(id).push(ocorrencia);
                });

                dados.forEach(item => {
                    item.ocorrencias = mapaOcorrencias.get(item.id) || [];
                });
            }
        }

        renderHoras();
        renderDrive();
    }catch(error){
        console.error("Erro Supabase:", error);

        listaHoras.innerHTML =
            '<div class="empty">Não foi possível carregar os apontamentos de horas.</div>';

        listaDrive.innerHTML =
            '<div class="empty">Não foi possível carregar os apontamentos de problemas.</div>';

        reviewCard.classList.add("hidden");
        closingCard.classList.add("hidden");
    }finally{
        showLoading(false);
    }
}


/* =========================================================
   RENDER HORAS
========================================================= */

function renderHoras(){
    if(!dados.length){
        listaHoras.innerHTML =
            '<div class="empty">Sem apontamentos de horas para este turno e setor.<br><br><strong>' +
            escapeHtml(getContextoTexto()) +
            '</strong></div>';

        reviewCard.classList.add("hidden");
        closingCard.classList.add("hidden");

        return;
    }

    reviewCard.classList.remove("hidden");
    listaHoras.innerHTML = "";

    dados.forEach(item => {
        listaHoras.appendChild(criarCardMaquina(item));
    });
}


/* =========================================================
   CARD DA MÁQUINA
========================================================= */

function criarCardMaquina(item){
    const card = document.createElement("div");

    card.className = "machine-card";
    card.dataset.id = item.id;

    const total = Number(item.total_baixado || 0);
    const status = getStatusClass(total);
    const dotStatus = getStatusDotClass(total);
    const maquina = formatMachine(item.maquina);

    const resumo = item.nota_supervisor
        ? "Nota do supervisor"
        : item.observacao
            ? "Com observação"
            : "Líder: " + (item.lider_nome || "—");

    card.innerHTML =
        '<button class="machine-card-header" onclick="abrirCard(' + item.id + ')">' +
            '<div class="machine-left">' +
                '<div class="machine-dot ' + dotStatus + '"></div>' +
                '<div>' +
                    '<div class="machine-name">' + maquina + '</div>' +
                    '<div class="machine-summary">' + escapeHtml(resumo) + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="machine-right">' +
                '<div class="machine-total ' + status + '">' + formatMinutes(total) + '</div>' +
                '<div class="chevron">›</div>' +
            '</div>' +
        '</button>' +
        '<div class="machine-details hidden" id="details-' + item.id + '">' +
            criarDetalhes(item) +
        '</div>';

    return card;
}


/* =========================================================
   DETALHES
========================================================= */

function criarDetalhes(item){
    const horaBoa = formatMinutes(item.hora_boa);
    const reposicao = formatMinutes(item.reposicao);
    const saldo = formatMinutes(item.saldo);

    let html =
        '<div class="details-grid">' +
            '<div class="detail-box"><div class="detail-label">Hora boa</div><div class="detail-value">' + horaBoa + '</div></div>' +
            '<div class="detail-box"><div class="detail-label">Reposição</div><div class="detail-value">' + reposicao + '</div></div>' +
            '<div class="detail-box"><div class="detail-label">Total baixado</div><div class="detail-value">' + formatMinutes(item.total_baixado) + '</div></div>' +
            '<div class="detail-box"><div class="detail-label">Saldo</div><div class="detail-value">' + saldo + '</div></div>' +
        '</div>';

    if(item.observacao){
        html +=
            '<div class="observation-box">' +
                '<div class="observation-title">Observação do líder</div>' +
                '<div class="observation-text">' + escapeHtml(item.observacao) + '</div>' +
            '</div>';
    }

    if(item.nota_supervisor){
        html +=
            '<div class="supervisor-note">' +
                '<div class="supervisor-note-title">Nota do supervisor</div>' +
                '<div class="supervisor-note-text">' + escapeHtml(item.nota_supervisor) + '</div>' +
            '</div>';
    }

    html +=
        '<div class="edit-actions">' +
            '<button class="edit-button" onclick="abrirEditor(' + item.id + ', event)">Editar horas</button>' +
            '<button class="note-button" onclick="abrirEditorNota(' + item.id + ', event)">' +
                (item.nota_supervisor ? "Editar nota" : "Fazer nota") +
            '</button>' +
        '</div>' +
        '<div class="editor hidden" id="editor-' + item.id + '">' +
            '<div class="editor-title">Editar apontamento</div>' +
            '<div class="editor-grid">' +
                '<div class="editor-field"><label>Hora boa</label><input type="text" data-editor="hora_boa" value="' + formatMinutes(item.hora_boa) + '" placeholder="00:00"></div>' +
                '<div class="editor-field"><label>Reposição</label><input type="text" data-editor="reposicao" value="' + formatMinutes(item.reposicao) + '" placeholder="00:00"></div>' +
                '<div class="editor-field"><label>Saldo</label><input type="text" data-editor="saldo" value="' + formatMinutes(item.saldo) + '" placeholder="00:00"></div>' +
            '</div>' +
            '<div class="editor-note"><div class="editor-field"><label>Nota do supervisor</label>' +
                '<textarea data-editor="nota" placeholder="Digite uma nota, se necessário...">' + escapeHtml(item.nota_supervisor || "") + '</textarea>' +
            '</div></div>' +
            '<div class="editor-actions">' +
                '<button class="editor-cancel" onclick="fecharEditor(' + item.id + ', event)">Cancelar</button>' +
                '<button class="editor-save" onclick="salvarEdicao(' + item.id + ', event)">Salvar</button>' +
            '</div>' +
        '</div>';

    return html;
}


/* =========================================================
   ABRIR CARD
========================================================= */

function abrirCard(id){
    const card = document.querySelector(
        '.machine-card[data-id="' + id + '"]'
    );

    if(!card) return;

    const details = document.getElementById("details-" + id);

    if(!details) return;

    const estavaAberto = !details.classList.contains("hidden");

    document.querySelectorAll(".machine-card").forEach(outro => {
        if(outro !== card){
            outro.classList.remove("open");

            const outroDetails = outro.querySelector(".machine-details");

            if(outroDetails){
                outroDetails.classList.add("hidden");
            }
        }
    });

    if(estavaAberto){
        card.classList.remove("open");
        details.classList.add("hidden");
        maquinaAberta = null;
    }else{
        card.classList.add("open");
        details.classList.remove("hidden");
        maquinaAberta = id;
    }
}


/* =========================================================
   EDITOR
========================================================= */

function abrirEditor(id, event){
    if(event) event.stopPropagation();

    const details = document.getElementById("details-" + id);

    if(!details) return;

    details.classList.remove("hidden");

    const editor = document.getElementById("editor-" + id);

    if(editor){
        editor.classList.remove("hidden");

        const input = editor.querySelector('[data-editor="hora_boa"]');

        if(input) input.focus();
    }
}

function abrirEditorNota(id, event){
    if(event) event.stopPropagation();

    const details = document.getElementById("details-" + id);

    if(!details) return;

    details.classList.remove("hidden");

    const editor = document.getElementById("editor-" + id);

    if(editor){
        editor.classList.remove("hidden");

        const textarea = editor.querySelector('[data-editor="nota"]');

        if(textarea){
            textarea.focus();
            textarea.selectionStart = textarea.value.length;
        }
    }
}

function fecharEditor(id, event){
    if(event) event.stopPropagation();

    const editor = document.getElementById("editor-" + id);

    if(editor){
        editor.classList.add("hidden");
    }
}


/* =========================================================
   SALVAR EDIÇÃO
========================================================= */

async function salvarEdicao(id, event){
    if(event) event.stopPropagation();

    const editor = document.getElementById("editor-" + id);

    if(!editor) return;

    const horaBoa = parseTime(
        editor.querySelector('[data-editor="hora_boa"]').value
    );

    const reposicao = parseTime(
        editor.querySelector('[data-editor="reposicao"]').value
    );

    const saldo = parseTime(
        editor.querySelector('[data-editor="saldo"]').value
    );

    const nota = editor.querySelector('[data-editor="nota"]').value.trim();

    const total = horaBoa + reposicao;

    const botao = editor.querySelector(".editor-save");

    botao.disabled = true;
    botao.textContent = "Salvando...";

    try{
        const { error } = await supabaseClient
            .from("apontamentos")
            .update({
                hora_boa: horaBoa,
                reposicao: reposicao,
                total_baixado: total,
                saldo: saldo,
                nota_supervisor: nota || null
            })
            .eq("id", id);

        if(error) throw error;

        mostrarToast("Apontamento atualizado ✓");

        await carregarDados();
    }catch(error){
        console.error("Erro ao salvar:", error);
        mostrarToast("Não foi possível salvar.");
    }finally{
        botao.disabled = false;
        botao.textContent = "Salvar";
    }
}


/* =========================================================
   DRIVE
========================================================= */

function renderDrive(){
    if(!dados.length){
        listaDrive.innerHTML =
            '<div class="empty">Sem apontamentos de problemas para este turno e setor.<br><br><strong>' +
            escapeHtml(getContextoTexto()) +
            '</strong></div>';

        return;
    }

    const maquinasComProblemas = dados.filter(
        item => Array.isArray(item.ocorrencias) && item.ocorrencias.length > 0
    );

    if(!maquinasComProblemas.length){
        listaDrive.innerHTML =
            '<div class="empty">Sem apontamentos de problemas para este turno e setor.</div>';

        return;
    }

    listaDrive.innerHTML = "";

    maquinasComProblemas.forEach(item => {
        const card = document.createElement("div");

        card.className = "drive-card";

        const maquina = formatMachine(item.maquina);

        const problemas = item.ocorrencias.map(oc =>
            '<div class="problem">• <span class="problem-category">' +
            escapeHtml(oc.categoria || oc.tipo || "Outro") +
            '</span>: ' +
            escapeHtml(oc.descricao || "") +
            '</div>'
        ).join("");

        card.innerHTML =
            '<div class="drive-header">' +
                '<div class="drive-dot"></div>' +
                '<div class="drive-machine">' + maquina + '</div>' +
            '</div>' +
            '<div class="problem-list">' + problemas + '</div>' +
            '<button class="copy-problems" onclick="copiarProblemas(' + item.maquina + ', this)">Copiar problemas</button>';

        listaDrive.appendChild(card);
    });
}


/* =========================================================
   COPIAR PROBLEMAS
========================================================= */

async function copiarProblemas(maquinaNumero, button){
    const numero = normalizarMaquina(maquinaNumero);

    const item = dados.find(
        x => Number(x.maquina) === Number(numero)
    );

    if(!item){
        mostrarToast("Máquina não encontrada.");
        return;
    }

    const ocorrencias = Array.isArray(item.ocorrencias)
        ? item.ocorrencias
        : [];

    if(!ocorrencias.length){
        mostrarToast("Não há problemas registrados.");
        return;
    }

    const texto = ocorrencias.map(oc =>
        "• " + (oc.categoria || oc.tipo || "Outro") + ": " + (oc.descricao || "")
    ).join("\n");

    try{
        await navigator.clipboard.writeText(texto);

        button.textContent = "Problemas copiados ✓";
        mostrarToast("Problemas copiados ✓");

        setTimeout(() => {
            button.textContent = "Copiar problemas";
        }, 1800);
    }catch(error){
        console.error(error);
        mostrarToast("Não foi possível copiar.");
    }
}


/* =========================================================
   REVISÃO
========================================================= */

function resetarRevisao(){
    closingCard.classList.add("hidden");

    const reviewButton = document.getElementById("reviewButton");

    reviewButton.classList.remove("hidden");
    reviewButton.textContent = "Revisado";

    const reviewState = document.getElementById("reviewedState");

    if(reviewState) reviewState.remove();
}

function marcarRevisado(){
    if(!dados.length){
        mostrarToast("Não há apontamentos para revisar.");
        return;
    }

    gerarFechamento();

    const reviewButton = document.getElementById("reviewButton");

    reviewButton.classList.add("hidden");

    if(!document.getElementById("reviewedState")){
        const state = document.createElement("div");

        state.id = "reviewedState";
        state.className = "reviewed-state";

        state.innerHTML =
            '<span>Revisado ✓</span>' +
            '<button class="reviewed-change" onclick="alterarRevisao()">Revisar novamente</button>';

        reviewCard
            .querySelector(".review-subtitle")
            .insertAdjacentElement("afterend", state);
    }

    mostrarToast("Turno revisado ✓");
}

function alterarRevisao(){
    closingCard.classList.add("hidden");

    const state = document.getElementById("reviewedState");

    if(state) state.remove();

    document.getElementById("reviewButton").classList.remove("hidden");
}


/* =========================================================
   FECHAMENTO
========================================================= */

function gerarFechamento(){
    const setor = setorInput.value;
    const linhas = [];

    linhas.push("Horas baixadas setor " + setor);
    linhas.push("");

    dados.forEach(item => {
        const maquina = formatMachine(item.maquina);

        let linha = "- " + maquina + " - " + formatMinutes(item.total_baixado);

        if(
            item.saldo !== null &&
            item.saldo !== undefined &&
            Number(item.saldo) !== 0
        ){
            linha += " (Saldo - " + formatMinutes(item.saldo) + ")";
        }

        if(item.nota_supervisor){
            linha += " — " + item.nota_supervisor;
        }

        linhas.push(linha);
    });

    textoFechamento.value = linhas.join("\n");

    closingCard.classList.remove("hidden");
}


/* =========================================================
   COPIAR FECHAMENTO
========================================================= */

async function copiarFechamento(){
    const texto = textoFechamento.value;

    if(!texto){
        mostrarToast("Nenhum fechamento disponível.");
        return;
    }

    try{
        await navigator.clipboard.writeText(texto);
        mostrarToast("Fechamento copiado ✓");
    }catch(error){
        console.error(error);
        mostrarToast("Não foi possível copiar.");
    }
}


/* =========================================================
   WHATSAPP
========================================================= */

function enviarWhatsApp(){
    const texto = textoFechamento.value;

    if(!texto){
        mostrarToast("Nenhum fechamento disponível.");
        return;
    }

    const url = "https://wa.me/?text=" + encodeURIComponent(texto);

    window.open(url, "_blank");
}


/* =========================================================
   ABAS
========================================================= */

function mostrarAba(aba){
    const horas = document.getElementById("abaHoras");
    const drive = document.getElementById("abaDrive");
    const tabHoras = document.getElementById("tabHoras");
    const tabDrive = document.getElementById("tabDrive");

    if(aba === "horas"){
        horas.classList.remove("hidden");
        drive.classList.add("hidden");

        tabHoras.classList.add("active");
        tabDrive.classList.remove("active");
    }else{
        horas.classList.add("hidden");
        drive.classList.remove("hidden");

        tabHoras.classList.remove("active");
        tabDrive.classList.add("active");
    }
}


/* =========================================================
   CONTEXTO
========================================================= */

function getContextoTexto(){
    const data = dataInput.value;
    const turno = turnoInput.value;
    const setor = setorInput.value;

    let dataFormatada = data;

    if(data && data.indexOf("-") !== -1){
        const partes = data.split("-");

        if(partes.length === 3){
            dataFormatada =
                partes[2] + "/" +
                partes[1] + "/" +
                partes[0];
        }
    }

    return dataFormatada + " · " + turno + " · Setor " + setor;
}


/* =========================================================
   HEADER VISUAL
========================================================= */

function atualizarHeaderVisual(){
    const shiftLabel = document.getElementById("headerShiftLabel");

    if(shiftLabel && turnoInput){
        shiftLabel.textContent = turnoInput.value;
    }

    const menuName = document.getElementById("userMenuName");
    const menuAvatar = document.getElementById("userMenuAvatar");
    const nameEl = document.getElementById("supervisorName");
    const avatarEl = document.getElementById("userAvatar");

    if(menuName && nameEl){
        menuName.textContent = nameEl.textContent;
    }

    if(menuAvatar && avatarEl){
        const initials = avatarEl.textContent.trim();

        if(initials && initials !== "--"){
            menuAvatar.textContent = initials;
        }
    }
}


/* =========================================================
   EVENTOS
========================================================= */

dataInput.addEventListener("change", carregarDados);

turnoInput.addEventListener("change", () => {
    atualizarHeaderVisual();
    carregarDados();
});

setorInput.addEventListener("change", carregarDados);


/* =========================================================
   LOGOUT
========================================================= */

async function sair(){
    const confirmar = confirm("Deseja sair do sistema.");

    if(!confirmar) return;

    showLoading(true);

    try{
        const { error } = await supabaseClient.auth.signOut();

        if(error) throw error;

        window.location.href = "index.html";
    }catch(error){
        console.error("Erro ao sair:", error);
        mostrarToast("Não foi possível sair.");
    }finally{
        showLoading(false);
    }
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function init(){
    showLoading(true);

    try{
        const acesso = await verificarAcesso();

        if(!acesso) return;

        dataInput.value = todayLocal();
        turnoInput.value = "1º turno";
        setorInput.value = "A";

        atualizarHeaderVisual();

        await carregarDados();
    }catch(error){
        console.error("Erro na inicialização:", error);
        mostrarToast("Não foi possível carregar o sistema.");
    }finally{
        showLoading(false);
    }
}

init();


window.sair = sair;
window.mostrarAba = mostrarAba;
window.marcarRevisado = marcarRevisado;
window.alterarRevisao = alterarRevisao;
window.enviarWhatsApp = enviarWhatsApp;
window.copiarFechamento = copiarFechamento;
window.abrirCard = abrirCard;
window.abrirEditor = abrirEditor;
window.abrirEditorNota = abrirEditorNota;
window.fecharEditor = fecharEditor;
window.salvarEdicao = salvarEdicao;
window.copiarProblemas = copiarProblemas;

})();