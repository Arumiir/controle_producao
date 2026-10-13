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

    "1º turno":
        8 * 60 + 48,

    "2º turno":
        8 * 60 + 36,

    "3º turno":
        6 * 60 + 36

};


/* =========================================================
   ELEMENTOS
========================================================= */

const dataInput =
    document.getElementById("data");

const turnoInput =
    document.getElementById("turno");

const setorInput =
    document.getElementById("setor");

const listaHoras =
    document.getElementById("listaHoras");

const listaDrive =
    document.getElementById("listaDrive");

const closingCard =
    document.getElementById("closingCard");

const reviewCard =
    document.getElementById("reviewCard");

const textoFechamento =
    document.getElementById("textoFechamento");


/* =========================================================
   UTILITÁRIOS
========================================================= */

let toastTimer = null;


function mostrarToast(mensagem){

    const toast =
        document.getElementById("toast");


    toast.textContent =
        mensagem;


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2300
        );

}


function showLoading(show){

    document
        .getElementById("loading")
        .classList.toggle(
            "hidden",
            !show
        );

}


function escapeHtml(value){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


function normalizarMaquina(valor){

    if(
        valor === null ||
        valor === undefined ||
        valor === ""
    ){

        return null;

    }


    let texto =
        String(valor)
            .trim()
            .toUpperCase();


    texto =
        texto.replace(
            /^M/,
            ""
        );


    const numero =
        Number(texto);


    if(
        !Number.isInteger(numero) ||
        numero <= 0
    ){

        return null;

    }


    return numero;

}


function formatMachine(valor){

    const numero =
        normalizarMaquina(valor);


    if(
        numero === null
    ){

        return "M--";

    }


    return `M${String(
        numero
    ).padStart(2,"0")}`;

}


function parseTime(value){

    if(
        value === null ||
        value === undefined ||
        value === ""
    ){

        return 0;

    }


    const texto =
        String(value)
            .trim();


    if(
        /^\d{1,3}:\d{2}$/.test(texto)
    ){

        const partes =
            texto.split(":");


        const horas =
            Number(partes[0]);


        const minutos =
            Number(partes[1]);


        if(
            minutos > 59
        ){

            return 0;

        }


        return (
            horas * 60 +
            minutos
        );

    }


    const numero =
        Number(texto);


    return Number.isFinite(numero)
        ? numero
        : 0;

}


function formatMinutes(minutes){

    minutes =
        Number(minutes) || 0;


    const negativo =
        minutes < 0;


    minutes =
        Math.abs(minutes);


    const horas =
        Math.floor(
            minutes / 60
        );


    const minutos =
        minutes % 60;


    const resultado =
        `${String(
            horas
        ).padStart(2,"0")}:${String(
            minutos
        ).padStart(2,"0")}`;


    return negativo
        ? `-${resultado}`
        : resultado;

}


function todayLocal(){

    const now =
        new Date();


    const ano =
        now.getFullYear();


    const mes =
        String(
            now.getMonth() + 1
        ).padStart(2,"0");


    const dia =
        String(
            now.getDate()
        ).padStart(2,"0");


    return `${ano}-${mes}-${dia}`;

}


/* =========================================================
   STATUS
========================================================= */

function getStatusClass(totalMinutes){

    const target =
        shiftTargets[
            turnoInput.value
        ];


    if(
        totalMinutes >= target
    ){

        return "status-green";

    }


    if(
        totalMinutes >= target - 48
    ){

        return "status-yellow";

    }


    return "status-red";

}


function getStatusDotClass(totalMinutes){

    const target =
        shiftTargets[
            turnoInput.value
        ];


    if(
        totalMinutes >= target
    ){

        return "status-dot-green";

    }


    if(
        totalMinutes >= target - 48
    ){

        return "status-dot-yellow";

    }


    return "status-dot-red";

}


/* =========================================================
   AUTENTICAÇÃO
========================================================= */

async function verificarAcesso(){

    const {
        data:{
            session
        }
    } =
        await supabaseClient
            .auth
            .getSession();


    if(
        !session
    ){

        window.location.href =
            "index.html";


        return false;

    }


    currentUser =
        session.user;


    const {
        data:usuario,
        error
    } =
        await supabaseClient
            .from("usuarios")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .eq(
                "ativo",
                true
            )
            .single();


    if(
        error ||
        !usuario
    ){

        alert(
            "Usuário sem cadastro no sistema."
        );


        await supabaseClient
            .auth
            .signOut();


        window.location.href =
            "index.html";


        return false;

    }


    if(
        usuario.perfil !==
        "supervisor"
    ){

        alert(
            "Acesso restrito ao supervisor."
        );


        window.location.href =
            "lider.html";


        return false;

    }


    currentProfile =
        usuario;


    document.getElementById(
        "supervisorName"
    ).textContent =
        usuario.nome ||
        "Supervisor";


    const initials =
        String(
            usuario.nome ||
            "U"
        )
        .split(" ")
        .filter(Boolean)
        .slice(0,2)
        .map(
            nome =>
                nome[0]
                    .toUpperCase()
        )
        .join("");


    document.getElementById(
        "userAvatar"
    ).textContent =
        initials ||
        "U";


    return true;

}


/* =========================================================
   CARREGAMENTO
========================================================= */

async function carregarDados(){

    const data =
        dataInput.value;


    const turno =
        turnoInput.value;


    const setor =
        setorInput.value;


    if(
        !data ||
        !turno ||
        !setor
    ){

        return;

    }


    showLoading(true);


    dados = [];

    maquinaAberta = null;


    resetarRevisao();


    listaHoras.innerHTML =
        "";


    listaDrive.innerHTML =
        "";


    document.getElementById(
        "tituloSetor"
    ).textContent =
        setor;


    try{


        /* =====================================================
           1. APONTAMENTOS
        ===================================================== */

        const {
            data:apontamentos,
            error
        } =
            await supabaseClient
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
                .eq(
                    "data",
                    data
                )
                .eq(
                    "turno",
                    turno
                )
                .eq(
                    "setor",
                    setor
                )
                .order(
                    "maquina",
                    {
                        ascending:true
                    }
                );


        if(error){

            throw error;

        }


        const mapa =
            new Map();


        for(
            const item of
            (apontamentos || [])
        ){

            const maquina =
                normalizarMaquina(
                    item.maquina
                );


            if(
                maquina === null
            ){

                continue;

            }


            mapa.set(
                maquina,
                {

                    ...item,

                    maquina:maquina,

                    ocorrencias:[],

                    lider_nome:"—"

                }
            );

        }


        dados =
            Array.from(
                mapa.values()
            )
            .sort(
                (a,b) =>
                    a.maquina -
                    b.maquina
            );


        /* =====================================================
           2. BUSCAR NOMES DOS LÍDERES
           
           Esta é a correção principal.

           Antes:
           
           lider_nome = item.lider_id

           Agora:

           apontamentos.lider_id
                    ↓
           usuarios.id
                    ↓
           usuarios.nome
        ===================================================== */

        const liderIds =
            [
                ...new Set(
                    dados
                        .map(
                            item =>
                                item.lider_id
                        )
                        .filter(Boolean)
                )
            ];


        if(
            liderIds.length
        ){

            const {
                data:lideres,
                error:erroLideres
            } =
                await supabaseClient
                    .from("usuarios")
                    .select(
                        "id, nome"
                    )
                    .in(
                        "id",
                        liderIds
                    );


            if(
                erroLideres
            ){

                console.error(
                    "Erro ao carregar líderes:",
                    erroLideres
                );

            }else{

                const mapaLideres =
                    new Map();


                (lideres || [])
                    .forEach(
                        lider => {

                            mapaLideres.set(
                                lider.id,
                                lider.nome ||
                                "—"
                            );

                        }
                    );


                dados.forEach(
                    item => {

                        item.lider_nome =
                            mapaLideres.get(
                                item.lider_id
                            ) ||
                            "—";

                    }
                );

            }

        }


        /* =====================================================
           3. OCORRÊNCIAS
        ===================================================== */

        const idsApontamentos =
            dados
                .map(
                    item =>
                        item.id
                )
                .filter(Boolean);


        if(
            idsApontamentos.length
        ){

            const {
                data:ocorrencias,
                error:erroOcorrencias
            } =
                await supabaseClient
                    .from("ocorrencias")
                    .select("*")
                    .in(
                        "apontamento_id",
                        idsApontamentos
                    )
                    .order(
                        "id",
                        {
                            ascending:true
                        }
                    );


            if(
                erroOcorrencias
            ){

                console.error(
                    "Erro ao carregar ocorrências:",
                    erroOcorrencias
                );

            }else{

                const mapaOcorrencias =
                    new Map();


                (ocorrencias || [])
                    .forEach(
                        ocorrencia => {

                            const id =
                                ocorrencia.apontamento_id;


                            if(
                                !mapaOcorrencias.has(
                                    id
                                )
                            ){

                                mapaOcorrencias.set(
                                    id,
                                    []
                                );

                            }


                            mapaOcorrencias
                                .get(id)
                                .push(
                                    ocorrencia
                                );

                        }
                    );


                dados.forEach(
                    item => {

                        item.ocorrencias =
                            mapaOcorrencias.get(
                                item.id
                            ) || [];

                    }
                );

            }

        }


        renderHoras();

        renderDrive();


    }catch(error){

        console.error(
            "Erro Supabase:",
            error
        );


        listaHoras.innerHTML = `

            <div class="empty">

                Não foi possível carregar
                os apontamentos de horas.

            </div>

        `;


        listaDrive.innerHTML = `

            <div class="empty">

                Não foi possível carregar
                os apontamentos de problemas.

            </div>

        `;


        reviewCard.classList.add(
            "hidden"
        );


        closingCard.classList.add(
            "hidden"
        );

    }finally{

        showLoading(false);

    }

}


/* =========================================================
   RENDER HORAS
========================================================= */

function renderHoras(){

    if(
        !dados.length
    ){

        listaHoras.innerHTML = `

            <div class="empty">

                Sem apontamentos de horas
                para este turno e setor.

                <br><br>

                <strong>
                    ${escapeHtml(
                        getContextoTexto()
                    )}
                </strong>

            </div>

        `;


        reviewCard.classList.add(
            "hidden"
        );


        closingCard.classList.add(
            "hidden"
        );


        return;

    }


    reviewCard.classList.remove(
        "hidden"
    );


    listaHoras.innerHTML =
        "";


    dados.forEach(
        item => {

            const card =
                criarCardMaquina(
                    item
                );


            listaHoras.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CARD DA MÁQUINA
========================================================= */

function criarCardMaquina(item){

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "machine-card";


    card.dataset.id =
        item.id;


    const total =
        Number(
            item.total_baixado ||
            0
        );


    const status =
        getStatusClass(
            total
        );


    const dotStatus =
        getStatusDotClass(
            total
        );


    const maquina =
        formatMachine(
            item.maquina
        );


    /*
     * IMPORTANTE:
     * O nome já foi resolvido em carregarDados().
     * Portanto aqui nunca usamos lider_id
     * para exibição.
     */

    const resumo =
        item.nota_supervisor
            ? "Nota do supervisor"
            : item.observacao
                ? "Com observação"
                : `Líder: ${
                    item.lider_nome ||
                    "—"
                }`;


    card.innerHTML = `

        <button
            class="machine-card-header"
            onclick="abrirCard(${item.id})"
        >

            <div class="machine-left">

                <div
                    class="machine-dot ${dotStatus}"
                ></div>


                <div>

                    <div class="machine-name">
                        ${maquina}
                    </div>


                    <div class="machine-summary">
                        ${escapeHtml(resumo)}
                    </div>

                </div>

            </div>


            <div class="machine-right">

                <div
                    class="machine-total ${status}"
                >
                    ${formatMinutes(total)}
                </div>


                <div class="chevron">
                    ›
                </div>

            </div>

        </button>


        <div
            class="machine-details hidden"
            id="details-${item.id}"
        >

            ${criarDetalhes(item)}

        </div>

    `;


    return card;

}


/* =========================================================
   DETALHES
========================================================= */

function criarDetalhes(item){

    const horaBoa =
        formatMinutes(
            item.hora_boa
        );


    const reposicao =
        formatMinutes(
            item.reposicao
        );


    const saldo =
        formatMinutes(
            item.saldo
        );


    return `

        <div class="details-grid">


            <div class="detail-box">

                <div class="detail-label">
                    Hora boa
                </div>

                <div class="detail-value">
                    ${horaBoa}
                </div>

            </div>


            <div class="detail-box">

                <div class="detail-label">
                    Reposição
                </div>

                <div class="detail-value">
                    ${reposicao}
                </div>

            </div>


            <div class="detail-box">

                <div class="detail-label">
                    Total baixado
                </div>

                <div class="detail-value">
                    ${formatMinutes(
                        item.total_baixado
                    )}
                </div>

            </div>


            <div class="detail-box">

                <div class="detail-label">
                    Saldo
                </div>

                <div class="detail-value">
                    ${saldo}
                </div>

            </div>

        </div>


        ${
            item.observacao
                ? `

                <div class="observation-box">

                    <div class="observation-title">
                        Observação do líder
                    </div>

                    <div class="observation-text">
                        ${escapeHtml(
                            item.observacao
                        )}
                    </div>

                </div>

                `
                : ""
        }


        ${
            item.nota_supervisor
                ? `

                <div class="supervisor-note">

                    <div class="supervisor-note-title">
                        Nota do supervisor
                    </div>

                    <div class="supervisor-note-text">
                        ${escapeHtml(
                            item.nota_supervisor
                        )}
                    </div>

                </div>

                `
                : ""
        }


        <div class="edit-actions">


            <button
                class="edit-button"
                onclick="abrirEditor(
                    ${item.id},
                    event
                )"
            >
                Editar horas
            </button>


            <button
                class="note-button"
                onclick="abrirEditorNota(
                    ${item.id},
                    event
                )"
            >

                ${
                    item.nota_supervisor
                        ? "Editar nota"
                        : "Fazer nota"
                }

            </button>

        </div>


        <div
            class="editor hidden"
            id="editor-${item.id}"
        >

            <div class="editor-title">
                Editar apontamento
            </div>


            <div class="editor-grid">


                <div class="editor-field">

                    <label>
                        Hora boa
                    </label>

                    <input
                        type="text"
                        data-editor="hora_boa"
                        value="${formatMinutes(
                            item.hora_boa
                        )}"
                        placeholder="00:00"
                    >

                </div>


                <div class="editor-field">

                    <label>
                        Reposição
                    </label>

                    <input
                        type="text"
                        data-editor="reposicao"
                        value="${formatMinutes(
                            item.reposicao
                        )}"
                        placeholder="00:00"
                    >

                </div>


                <div class="editor-field">

                    <label>
                        Saldo
                    </label>

                    <input
                        type="text"
                        data-editor="saldo"
                        value="${formatMinutes(
                            item.saldo
                        )}"
                        placeholder="00:00"
                    >

                </div>

            </div>


            <div class="editor-note">

                <div class="editor-field">

                    <label>
                        Nota do supervisor
                    </label>

                    <textarea
                        data-editor="nota"
                        placeholder="Digite uma nota, se necessário..."
                    >${escapeHtml(
                        item.nota_supervisor || ""
                    )}</textarea>

                </div>

            </div>


            <div class="editor-actions">


                <button
                    class="editor-cancel"
                    onclick="fecharEditor(
                        ${item.id},
                        event
                    )"
                >
                    Cancelar
                </button>


                <button
                    class="editor-save"
                    onclick="salvarEdicao(
                        ${item.id},
                        event
                    )"
                >
                    Salvar
                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   ABRIR CARD
========================================================= */

function abrirCard(id){

    const card =
        document.querySelector(
            `.machine-card[data-id="${id}"]`
        );


    if(!card){
        return;
    }


    const details =
        document.getElementById(
            `details-${id}`
        );


    if(!details){
        return;
    }


    const estavaAberto =
        !details.classList.contains(
            "hidden"
        );


    document
        .querySelectorAll(
            ".machine-card"
        )
        .forEach(
            outro => {

                if(
                    outro !== card
                ){

                    outro.classList.remove(
                        "open"
                    );


                    const outroDetails =
                        outro.querySelector(
                            ".machine-details"
                        );


                    if(outroDetails){

                        outroDetails.classList.add(
                            "hidden"
                        );

                    }

                }

            }
        );


    if(
        estavaAberto
    ){

        card.classList.remove(
            "open"
        );


        details.classList.add(
            "hidden"
        );


        maquinaAberta =
            null;

    }else{

        card.classList.add(
            "open"
        );


        details.classList.remove(
            "hidden"
        );


        maquinaAberta =
            id;

    }

}


/* =========================================================
   EDITOR
========================================================= */

function abrirEditor(id,event){

    if(event){
        event.stopPropagation();
    }


    const details =
        document.getElementById(
            `details-${id}`
        );


    if(!details){
        return;
    }


    details.classList.remove(
        "hidden"
    );


    const editor =
        document.getElementById(
            `editor-${id}`
        );


    if(editor){

        editor.classList.remove(
            "hidden"
        );


        const input =
            editor.querySelector(
                '[data-editor="hora_boa"]'
            );


        if(input){
            input.focus();
        }

    }

}


function abrirEditorNota(id,event){

    if(event){
        event.stopPropagation();
    }


    const details =
        document.getElementById(
            `details-${id}`
        );


    if(!details){
        return;
    }


    details.classList.remove(
        "hidden"
    );


    const editor =
        document.getElementById(
            `editor-${id}`
        );


    if(editor){

        editor.classList.remove(
            "hidden"
        );


        const textarea =
            editor.querySelector(
                '[data-editor="nota"]'
            );


        if(textarea){

            textarea.focus();

            textarea.selectionStart =
                textarea.value.length;

        }

    }

}


function fecharEditor(id,event){

    if(event){
        event.stopPropagation();
    }


    const editor =
        document.getElementById(
            `editor-${id}`
        );


    if(editor){

        editor.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   SALVAR EDIÇÃO
========================================================= */

async function salvarEdicao(id,event){

    if(event){
        event.stopPropagation();
    }


    const editor =
        document.getElementById(
            `editor-${id}`
        );


    if(!editor){
        return;
    }


    const horaBoa =
        parseTime(
            editor.querySelector(
                '[data-editor="hora_boa"]'
            ).value
        );


    const reposicao =
        parseTime(
            editor.querySelector(
                '[data-editor="reposicao"]'
            ).value
        );


    const saldo =
        parseTime(
            editor.querySelector(
                '[data-editor="saldo"]'
            ).value
        );


    const nota =
        editor.querySelector(
            '[data-editor="nota"]'
        ).value
            .trim();


    const total =
        horaBoa +
        reposicao;


    const botao =
        editor.querySelector(
            ".editor-save"
        );


    botao.disabled =
        true;


    botao.textContent =
        "Salvando...";


    try{

        const {
            error
        } =
            await supabaseClient
                .from("apontamentos")
                .update({

                    hora_boa:
                        horaBoa,

                    reposicao:
                        reposicao,

                    total_baixado:
                        total,

                    saldo:
                        saldo,

                    nota_supervisor:
                        nota ||
                        null

                })
                .eq(
                    "id",
                    id
                );


        if(error){

            throw error;

        }


        mostrarToast(
            "Apontamento atualizado ✓"
        );


        await carregarDados();


    }catch(error){

        console.error(
            "Erro ao salvar:",
            error
        );


        mostrarToast(
            "Não foi possível salvar."
        );


    }finally{

        botao.disabled =
            false;


        botao.textContent =
            "Salvar";

    }

}


/* =========================================================
   DRIVE
========================================================= */

function renderDrive(){

    if(
        !dados.length
    ){

        listaDrive.innerHTML = `

            <div class="empty">

                Sem apontamentos de problemas
                para este turno e setor.

                <br><br>

                <strong>
                    ${escapeHtml(
                        getContextoTexto()
                    )}
                </strong>

            </div>

        `;

        return;

    }


    const maquinasComProblemas =
        dados.filter(
            item =>
                Array.isArray(
                    item.ocorrencias
                ) &&
                item.ocorrencias.length > 0
        );


    if(
        !maquinasComProblemas.length
    ){

        listaDrive.innerHTML = `

            <div class="empty">

                Sem apontamentos de problemas
                para este turno e setor.

            </div>

        `;

        return;

    }


    listaDrive.innerHTML =
        "";


    maquinasComProblemas.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "drive-card";


            const maquina =
                formatMachine(
                    item.maquina
                );


            const ocorrencias =
                item.ocorrencias;


            const problemas =
                ocorrencias
                    .map(
                        oc => `

                            <div class="problem">

                                •

                                <span class="problem-category">

                                    ${escapeHtml(
                                        oc.categoria ||
                                        oc.tipo ||
                                        "Outro"
                                    )}

                                </span>:

                                ${escapeHtml(
                                    oc.descricao ||
                                    ""
                                )}

                            </div>

                        `
                    )
                    .join("");


            card.innerHTML = `

                <div class="drive-header">

                    <div class="drive-dot"></div>

                    <div class="drive-machine">
                        ${maquina}
                    </div>

                </div>


                <div class="problem-list">

                    ${problemas}

                </div>


                <button
                    class="copy-problems"
                    onclick="copiarProblemas(
                        ${item.maquina},
                        this
                    )"
                >
                    Copiar problemas
                </button>

            `;


            listaDrive.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   COPIAR PROBLEMAS
========================================================= */

async function copiarProblemas(
    maquinaNumero,
    button
){

    const numero =
        normalizarMaquina(
            maquinaNumero
        );


    const item =
        dados.find(
            x =>
                Number(
                    x.maquina
                ) ===
                Number(
                    numero
                )
        );


    if(!item){

        mostrarToast(
            "Máquina não encontrada."
        );

        return;

    }


    const ocorrencias =
        Array.isArray(
            item.ocorrencias
        )
            ? item.ocorrencias
            : [];


    if(
        !ocorrencias.length
    ){

        mostrarToast(
            "Não há problemas registrados."
        );

        return;

    }


    const texto =
        ocorrencias
            .map(
                oc =>
                    `• ${
                        oc.categoria ||
                        oc.tipo ||
                        "Outro"
                    }: ${
                        oc.descricao ||
                        ""
                    }`
            )
            .join("\n");


    try{

        await navigator.clipboard.writeText(
            texto
        );


        button.textContent =
            "Problemas copiados ✓";


        mostrarToast(
            "Problemas copiados ✓"
        );


        setTimeout(
            () => {

                button.textContent =
                    "Copiar problemas";

            },
            1800
        );


    }catch(error){

        console.error(
            error
        );


        mostrarToast(
            "Não foi possível copiar."
        );

    }

}


/* =========================================================
   REVISÃO
========================================================= */

function resetarRevisao(){

    closingCard.classList.add(
        "hidden"
    );


    const reviewButton =
        document.getElementById(
            "reviewButton"
        );


    reviewButton.classList.remove(
        "hidden"
    );


    reviewButton.textContent =
        "Revisado ✓";


    const reviewState =
        document.getElementById(
            "reviewedState"
        );


    if(reviewState){

        reviewState.remove();

    }

}


function marcarRevisado(){

    if(
        !dados.length
    ){

        mostrarToast(
            "Não há apontamentos para revisar."
        );

        return;

    }


    gerarFechamento();


    const reviewButton =
        document.getElementById(
            "reviewButton"
        );


    reviewButton.classList.add(
        "hidden"
    );


    const existing =
        document.getElementById(
            "reviewedState"
        );


    if(
        !existing
    ){

        const state =
            document.createElement(
                "div"
            );


        state.id =
            "reviewedState";


        state.className =
            "reviewed-state";


        state.innerHTML = `

            <span>
                Revisado ✓
            </span>


            <button
                class="reviewed-change"
                onclick="alterarRevisao()"
            >
                Revisar novamente
            </button>

        `;


        reviewCard
            .querySelector(
                ".review-subtitle"
            )
            .insertAdjacentElement(
                "afterend",
                state
            );

    }


    mostrarToast(
        "Turno revisado ✓"
    );

}


function alterarRevisao(){

    closingCard.classList.add(
        "hidden"
    );


    const state =
        document.getElementById(
            "reviewedState"
        );


    if(state){

        state.remove();

    }


    document
        .getElementById(
            "reviewButton"
        )
        .classList.remove(
            "hidden"
        );

}


/* =========================================================
   FECHAMENTO
========================================================= */

function gerarFechamento(){

    const setor =
        setorInput.value;


    const linhas = [];


    linhas.push(
        `Horas baixadas setor ${setor}`
    );


    linhas.push("");


    dados.forEach(
        item => {

            const maquina =
                formatMachine(
                    item.maquina
                );


            let linha =
                `- ${maquina} - ${
                    formatMinutes(
                        item.total_baixado
                    )
                }`;


            if(
                item.saldo !== null &&
                item.saldo !== undefined &&
                Number(item.saldo) !== 0
            ){

                linha +=
                    ` (Saldo - ${
                        formatMinutes(
                            item.saldo
                        )
                    })`;

            }


            if(
                item.nota_supervisor
            ){

                linha +=
                    ` — ${
                        item.nota_supervisor
                    }`;

            }


            linhas.push(
                linha
            );

        }
    );


    textoFechamento.value =
        linhas.join("\n");


    closingCard.classList.remove(
        "hidden"
    );

}


/* =========================================================
   COPIAR FECHAMENTO
========================================================= */

async function copiarFechamento(){

    const texto =
        textoFechamento.value;


    if(!texto){

        mostrarToast(
            "Nenhum fechamento disponível."
        );

        return;

    }


    try{

        await navigator.clipboard.writeText(
            texto
        );


        mostrarToast(
            "Fechamento copiado ✓"
        );


    }catch(error){

        console.error(
            error
        );


        mostrarToast(
            "Não foi possível copiar."
        );

    }

}


/* =========================================================
   WHATSAPP
========================================================= */

function enviarWhatsApp(){

    const texto =
        textoFechamento.value;


    if(!texto){

        mostrarToast(
            "Nenhum fechamento disponível."
        );

        return;

    }


    const url =
        "https://wa.me/?text=" +
        encodeURIComponent(
            texto
        );


    window.open(
        url,
        "_blank"
    );

}


/* =========================================================
   ABAS
========================================================= */

function mostrarAba(aba){

    const horas =
        document.getElementById(
            "abaHoras"
        );


    const drive =
        document.getElementById(
            "abaDrive"
        );


    const tabHoras =
        document.getElementById(
            "tabHoras"
        );


    const tabDrive =
        document.getElementById(
            "tabDrive"
        );


    if(
        aba === "horas"
    ){

        horas.classList.remove(
            "hidden"
        );


        drive.classList.add(
            "hidden"
        );


        tabHoras.classList.add(
            "active"
        );


        tabDrive.classList.remove(
            "active"
        );

    }else{

        horas.classList.add(
            "hidden"
        );


        drive.classList.remove(
            "hidden"
        );


        tabHoras.classList.remove(
            "active"
        );


        tabDrive.classList.add(
            "active"
        );

    }

}


/* =========================================================
   CONTEXTO
========================================================= */

function getContextoTexto(){

    const data =
        dataInput.value;


    const turno =
        turnoInput.value;


    const setor =
        setorInput.value;


    let dataFormatada =
        data;


    if(
        data &&
        data.includes("-")
    ){

        const partes =
            data.split("-");


        if(
            partes.length === 3
        ){

            dataFormatada =
                `${partes[2]}/${partes[1]}/${partes[0]}`;

        }

    }


    return `${dataFormatada} · ${turno} · Setor ${setor}`;

}


/* =========================================================
   EVENTOS
========================================================= */

dataInput.addEventListener(
    "change",
    carregarDados
);


turnoInput.addEventListener(
    "change",
    carregarDados
);


setorInput.addEventListener(
    "change",
    carregarDados
);


/* =========================================================
   LOGOUT
========================================================= */

async function sair(){

    const confirmar =
        confirm(
            "Deseja sair do sistema?"
        );


    if(!confirmar){

        return;

    }


    showLoading(true);


    try{

        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();


        if(error){

            throw error;

        }


        window.location.href =
            "index.html";


    }catch(error){

        console.error(
            "Erro ao sair:",
            error
        );


        mostrarToast(
            "Não foi possível sair."
        );


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

        const acesso =
            await verificarAcesso();


        if(!acesso){

            return;

        }


        dataInput.value =
            todayLocal();


        turnoInput.value =
            "1º turno";


        setorInput.value =
            "A";


        await carregarDados();


    }catch(error){

        console.error(
            "Erro na inicialização:",
            error
        );


        mostrarToast(
            "Não foi possível carregar o sistema."
        );


    }finally{

        showLoading(false);

    }

}


init();