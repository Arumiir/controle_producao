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

let machineAtual = null;

let apontamentoAtual = null;

let ocorrenciasAtuais = [];

let occurrenceEditIndex = null;

let nativeTimeTarget = null;


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

const dateInput =
    document.getElementById(
        "date"
    );

const shiftInput =
    document.getElementById(
        "shift"
    );

const sectorInput =
    document.getElementById(
        "sector"
    );

const leaderName =
    document.getElementById(
        "leaderName"
    );

const userAvatar =
    document.getElementById(
        "userAvatar"
    );

const machineGrid =
    document.getElementById(
        "machineGrid"
    );

const machineListSection =
    document.getElementById(
        "machineListSection"
    );

const machineScreen =
    document.getElementById(
        "machineScreen"
    );

const mainHeader =
    document.getElementById(
        "mainHeader"
    );

const contextSection =
    document.getElementById(
        "contextSection"
    );

const machineTitle =
    document.getElementById(
        "machineTitle"
    );

const machineSubtitle =
    document.getElementById(
        "machineSubtitle"
    );

const goodHoursInput =
    document.getElementById(
        "goodHours"
    );

const replacementHoursInput =
    document.getElementById(
        "replacementHours"
    );

const totalHours =
    document.getElementById(
        "totalHours"
    );

const performanceBar =
    document.getElementById(
        "performanceBar"
    );

const balanceInput =
    document.getElementById(
        "balance"
    );

const occurrenceList =
    document.getElementById(
        "occurrenceList"
    );

const occurrenceEditor =
    document.getElementById(
        "occurrenceEditor"
    );

const occurrenceType =
    document.getElementById(
        "occurrenceType"
    );

const occurrenceDescription =
    document.getElementById(
        "occurrenceDescription"
    );

const deleteMachineButton =
    document.getElementById(
        "deleteMachineButton"
    );

const nativeTimePicker =
    document.getElementById(
        "nativeTimePicker"
    );


/* =========================================================
   LOADING
========================================================= */

function showLoading(show){

    document
        .getElementById("loading")
        .classList.toggle(
            "hidden",
            !show
        );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(message){

    const toast =
        document.getElementById(
            "toast"
        );

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2400
        );

}


/* =========================================================
   MÁQUINAS
========================================================= */

function formatMachine(value){

    const number =
        Number(value);

    if(
        !Number.isFinite(number)
    ){

        return String(value);

    }

    return (
        "M" +
        String(number)
            .padStart(2,"0")
    );

}


function machineNumber(value){

    const match =
        String(value || "")
            .trim()
            .toUpperCase()
            .match(
                /^M(\d+)$/
            );

    if(!match){

        return null;

    }

    const number =
        Number(
            match[1]
        );

    if(
        !Number.isInteger(number) ||
        number <= 0
    ){

        return null;

    }

    return number;

}


function normalizeMachine(value){

    if(
        typeof value === "number"
    ){

        return formatMachine(
            value
        );

    }

    const text =
        String(value || "")
            .trim()
            .toUpperCase();

    if(
        /^M\d+$/.test(text)
    ){

        return formatMachine(
            Number(
                text.substring(1)
            )
        );

    }

    if(
        /^\d+$/.test(text)
    ){

        return formatMachine(
            Number(text)
        );

    }

    return text;

}


function getSectorMachines(
    sector
){

    if(
        sector === "A"
    ){

        return Array.from(
            {
                length:29
            },
            (_,index) =>
                index + 1
        );

    }

    if(
        sector === "B"
    ){

        return Array.from(
            {
                length:22
            },
            (_,index) =>
                index + 30
        );

    }

    if(
        sector === "C"
    ){

        return Array.from(
            {
                length:34
            },
            (_,index) =>
                index + 52
        );

    }

    return [];

}


/* =========================================================
   HORAS
========================================================= */

function parseMinutes(value){

    if(
        value === null ||
        value === undefined
    ){

        return 0;

    }


    const text =
        String(value)
            .trim();


    if(!text){

        return 0;

    }


    /*
        Formatos aceitos:

        08:30
        8:30
        0830
        830
        08
        8
    */

    if(
        /^\d{1,3}:\d{2}$/.test(
            text
        )
    ){

        const parts =
            text.split(":");


        const hours =
            Number(
                parts[0]
            );


        const minutes =
            Number(
                parts[1]
            );


        if(
            !Number.isInteger(
                hours
            ) ||
            !Number.isInteger(
                minutes
            ) ||
            hours < 0 ||
            minutes < 0 ||
            minutes > 59
        ){

            return 0;

        }


        return (
            hours * 60 +
            minutes
        );

    }


    if(
        /^\d{3,4}$/.test(
            text
        )
    ){

        let digits =
            text;


        if(
            digits.length === 3
        ){

            digits =
                "0" + digits;

        }


        const hours =
            Number(
                digits.substring(
                    0,
                    2
                )
            );


        const minutes =
            Number(
                digits.substring(
                    2,
                    4
                )
            );


        if(
            minutes > 59
        ){

            return 0;

        }


        return (
            hours * 60 +
            minutes
        );

    }


    if(
        /^\d{1,2}$/.test(
            text
        )
    ){

        const hours =
            Number(text);


        return hours * 60;

    }


    return 0;

}


function minutesToHHMM(
    minutes
){

    const total =
        Math.max(
            0,
            Math.round(
                Number(minutes) || 0
            )
        );


    const hours =
        Math.floor(
            total / 60
        );


    const mins =
        total % 60;


    return (
        String(hours)
            .padStart(2,"0") +
        ":" +
        String(mins)
            .padStart(2,"0")
    );

}


/* =========================================================
   NORMALIZAÇÃO DOS CAMPOS DE HORA
========================================================= */

function normalizarCampoHora(
    input
){

    const value =
        input.value.trim();


    if(!value){

        return;

    }


    const minutes =
        parseMinutes(
            value
        );


    input.value =
        minutesToHHMM(
            minutes
        );

}


goodHoursInput.addEventListener(
    "blur",
    () => {

        normalizarCampoHora(
            goodHoursInput
        );

    }
);


replacementHoursInput.addEventListener(
    "blur",
    () => {

        normalizarCampoHora(
            replacementHoursInput
        );

    }
);


balanceInput.addEventListener(
    "blur",
    () => {

        normalizarCampoHora(
            balanceInput
        );

    }
);


/* =========================================================
   SELETOR NATIVO DE HORÁRIO
========================================================= */

function abrirSeletorHora(
    targetId
){

    const target =
        document.getElementById(
            targetId
        );


    if(!target){

        return;

    }


    nativeTimeTarget =
        target;


    const minutes =
        parseMinutes(
            target.value
        );


    if(
        target.value &&
        minutes >= 0
    ){

        const hours =
            Math.floor(
                minutes / 60
            );


        const mins =
            minutes % 60;


        if(
            hours <= 23
        ){

            nativeTimePicker.value =
                String(hours)
                    .padStart(2,"0") +
                ":" +
                String(mins)
                    .padStart(2,"0");

        }else{

            nativeTimePicker.value =
                "00:00";

        }

    }else{

        nativeTimePicker.value =
            "00:00";

    }


    try{

        if(
            typeof nativeTimePicker.showPicker ===
            "function"
        ){

            nativeTimePicker.showPicker();

        }else{

            nativeTimePicker.click();

        }

    }catch(error){

        nativeTimePicker.focus();

        nativeTimePicker.click();

    }

}


nativeTimePicker.addEventListener(
    "change",
    () => {

        if(
            !nativeTimeTarget
        ){

            return;

        }


        if(
            !nativeTimePicker.value
        ){

            return;

        }


        nativeTimeTarget.value =
            nativeTimePicker.value;


        nativeTimeTarget.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles:true
                }
            )
        );


        nativeTimeTarget =
            null;

    }
);


document
    .querySelectorAll(
        ".time-picker-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    abrirSeletorHora(
                        button.dataset.timeTarget
                    );

                }
            );

        }
    );


/* =========================================================
   METAS / DESEMPENHO
========================================================= */

function getStatusClass(
    totalMinutes
){

    const target =
        shiftTargets[
            shiftInput.value
        ];


    if(
        totalMinutes >= target
    ){

        return "status-green";

    }


    if(
        totalMinutes >=
        target - 48
    ){

        return "status-yellow";

    }


    return "status-red";

}


/* =========================================================
   DATA
========================================================= */

function todayLocal(){

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        )
        .padStart(2,"0");


    const day =
        String(
            now.getDate()
        )
        .padStart(2,"0");


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


/* =========================================================
   PERFIL
========================================================= */

async function carregarPerfil(){

    const {
        data,
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


    if(error){

        console.error(
            error
        );

        throw new Error(
            "Não foi possível carregar seu perfil."
        );

    }


    currentProfile =
        data;


    leaderName.textContent =
        data.nome ||
        "Líder";


    const initials =
        String(
            data.nome || "U"
        )
        .split(" ")
        .filter(Boolean)
        .slice(0,2)
        .map(
            name =>
                name[0]
                    .toUpperCase()
        )
        .join("");


    userAvatar.textContent =
        initials ||
        "U";

}


/* =========================================================
   CARREGAR DADOS
========================================================= */

async function carregarDados(){

    showLoading(true);


    try{

        await renderMachineGrid();

    }catch(error){

        console.error(
            error
        );

        showToast(
            error.message ||
            "Erro ao carregar dados."
        );

    }finally{

        showLoading(false);

    }

}


/* =========================================================
   GRID
========================================================= */

async function renderMachineGrid(){

    machineGrid.innerHTML =
        "";


    const machines =
        getSectorMachines(
            sectorInput.value
        );


    const savedMachines =
        new Set();


    const {
        data,
        error
    } =
        await supabaseClient
            .from("apontamentos")
            .select("maquina")
            .eq(
                "data",
                dateInput.value
            )
            .eq(
                "turno",
                shiftInput.value
            )
            .eq(
                "setor",
                sectorInput.value
            )
            .eq(
                "lider_id",
                currentUser.id
            );


    if(error){

        console.error(
            error
        );

    }else{

        (
            data || []
        ).forEach(
            item => {

                savedMachines.add(
                    normalizeMachine(
                        item.maquina
                    )
                );

            }
        );

    }


    machines.forEach(
        number => {

            const machine =
                formatMachine(
                    number
                );


            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "machine-button";


            if(
                savedMachines.has(
                    machine
                )
            ){

                button.classList.add(
                    "saved"
                );

            }


            button.textContent =
                machine;


            button.onclick =
                () =>
                    abrirMaquina(
                        machine
                    );


            machineGrid.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   ABRIR MÁQUINA
========================================================= */

async function abrirMaquina(
    machine
){

    machineAtual =
        normalizeMachine(
            machine
        );


    machineTitle.textContent =
        machineAtual;


    const parts =
        dateInput.value
            .split("-")
            .reverse()
            .join("/");


    machineSubtitle.textContent =
        `${parts} • ${shiftInput.value} • Setor ${sectorInput.value}`;


    mainHeader.classList.add(
        "hidden"
    );


    contextSection.classList.add(
        "hidden"
    );


    machineListSection.classList.add(
        "hidden"
    );


    machineScreen.classList.remove(
        "hidden"
    );


    await carregarFormulario();

}


/* =========================================================
   FECHAR MÁQUINA
========================================================= */

async function fecharTelaMaquina(){

    machineScreen.classList.add(
        "hidden"
    );


    mainHeader.classList.remove(
        "hidden"
    );


    contextSection.classList.remove(
        "hidden"
    );


    machineListSection.classList.remove(
        "hidden"
    );


    machineAtual =
        null;


    apontamentoAtual =
        null;


    ocorrenciasAtuais =
        [];


    occurrenceEditIndex =
        null;


    occurrenceEditor.classList.add(
        "hidden"
    );


    await renderMachineGrid();

}


/* =========================================================
   CARREGAR FORMULÁRIO
========================================================= */

async function carregarFormulario(){

    apontamentoAtual =
        null;


    ocorrenciasAtuais =
        [];


    occurrenceEditIndex =
        null;


    goodHoursInput.value =
        "";


    replacementHoursInput.value =
        "";


    balanceInput.value =
        "";


    occurrenceEditor.classList.add(
        "hidden"
    );


    deleteMachineButton.classList.add(
        "hidden"
    );


    totalHours.textContent =
        "00:00";


    performanceBar.style.width =
        "0%";


    performanceBar.className =
        "performance-bar";


    const maquinaNumero =
        machineNumber(
            machineAtual
        );


    if(!maquinaNumero){

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("apontamentos")
            .select("*")
            .eq(
                "data",
                dateInput.value
            )
            .eq(
                "turno",
                shiftInput.value
            )
            .eq(
                "setor",
                sectorInput.value
            )
            .eq(
                "lider_id",
                currentUser.id
            )
            .eq(
                "maquina",
                maquinaNumero
            )
            .maybeSingle();


    if(error){

        console.error(
            error
        );

        showToast(
            "Erro ao carregar máquina."
        );

        return;

    }


    if(!data){

        renderOccurrences();

        atualizarTotal();

        return;

    }


    apontamentoAtual =
        data;


    goodHoursInput.value =
        data.hora_boa != null
            ? minutesToHHMM(
                data.hora_boa
            )
            : "";


    replacementHoursInput.value =
        data.reposicao != null
            ? minutesToHHMM(
                data.reposicao
            )
            : "";


    balanceInput.value =
        data.saldo != null
            ? minutesToHHMM(
                data.saldo
            )
            : "";


    deleteMachineButton.classList.remove(
        "hidden"
    );


    /*
     * As ocorrências ficam na tabela
     * public.ocorrencias.
     */

    const {
        data:ocorrencias,
        error:ocorrenciasError
    } =
        await supabaseClient
            .from("ocorrencias")
            .select(
                "id, apontamento_id, categoria, descricao, criado_em"
            )
            .eq(
                "apontamento_id",
                data.id
            )
            .order(
                "id",
                {
                    ascending:true
                }
            );


    if(
        ocorrenciasError
    ){

        console.error(
            "Erro ao carregar ocorrências:",
            ocorrenciasError
        );

        ocorrenciasAtuais =
            [];

    }else{

        ocorrenciasAtuais =
            (
                ocorrencias || []
            ).map(
                item => ({

                    tipo:
                        item.categoria ||
                        item.tipo ||
                        "Outro",

                    descricao:
                        item.descricao ||
                        ""

                })
            );

    }


    atualizarTotal();

    renderOccurrences();

}


/* =========================================================
   OCORRÊNCIAS
========================================================= */

function renderOccurrences(){

    occurrenceList.innerHTML =
        "";


    ocorrenciasAtuais.forEach(
        (
            item,
            index
        ) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "occurrence-item";


            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "occurrence-content";


            const type =
                document.createElement(
                    "div"
                );


            type.className =
                "occurrence-type";


            type.textContent =
                item.tipo ||
                "Outro";


            const description =
                document.createElement(
                    "div"
                );


            description.className =
                "occurrence-description";


            description.textContent =
                item.descricao ||
                "";


            content.appendChild(
                type
            );


            content.appendChild(
                description
            );


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "occurrence-actions";


            const edit =
                document.createElement(
                    "button"
                );


            edit.className =
                "mini-button";


            edit.type =
                "button";


            edit.textContent =
                "✎";


            edit.onclick =
                () =>
                    editarOcorrencia(
                        index
                    );


            const del =
                document.createElement(
                    "button"
                );


            del.className =
                "mini-button delete";


            del.type =
                "button";


            del.textContent =
                "×";


            del.onclick =
                () =>
                    removerOcorrencia(
                        index
                    );


            actions.appendChild(
                edit
            );


            actions.appendChild(
                del
            );


            row.appendChild(
                content
            );


            row.appendChild(
                actions
            );


            occurrenceList.appendChild(
                row
            );

        }
    );

}


function abrirEditorOcorrencia(){

    occurrenceEditIndex =
        null;


    occurrenceType.value =
        "Mecânico";


    occurrenceDescription.value =
        "";


    occurrenceEditor.classList.remove(
        "hidden"
    );


    occurrenceDescription.focus();

}


function cancelarEditorOcorrencia(){

    occurrenceEditIndex =
        null;


    occurrenceDescription.value =
        "";


    occurrenceEditor.classList.add(
        "hidden"
    );

}


function editarOcorrencia(
    index
){

    const item =
        ocorrenciasAtuais[
            index
        ];


    if(!item){

        return;

    }


    occurrenceEditIndex =
        index;


    occurrenceType.value =
        item.tipo ||
        "Outro";


    occurrenceDescription.value =
        item.descricao ||
        "";


    occurrenceEditor.classList.remove(
        "hidden"
    );


    occurrenceDescription.focus();

}


function salvarOcorrenciaLocal(){

    const tipo =
        occurrenceType.value;


    const descricao =
        occurrenceDescription.value
            .trim();


    if(!descricao){

        showToast(
            "Descreva a ocorrência."
        );

        return;

    }


    const item = {

        tipo:
            tipo,

        descricao:
            descricao

    };


    if(
        occurrenceEditIndex ===
        null
    ){

        ocorrenciasAtuais.push(
            item
        );

    }else{

        ocorrenciasAtuais[
            occurrenceEditIndex
        ] =
            item;

    }


    occurrenceEditIndex =
        null;


    occurrenceDescription.value =
        "";


    occurrenceEditor.classList.add(
        "hidden"
    );


    renderOccurrences();

}


function removerOcorrencia(
    index
){

    if(
        !confirm(
            "Excluir esta ocorrência?"
        )
    ){

        return;

    }


    ocorrenciasAtuais.splice(
        index,
        1
    );


    renderOccurrences();

}


/* =========================================================
   TOTAL
========================================================= */

function atualizarTotal(){

    const good =
        parseMinutes(
            goodHoursInput.value
        );


    const replacement =
        parseMinutes(
            replacementHoursInput.value
        );


    const total =
        good +
        replacement;


    totalHours.textContent =
        minutesToHHMM(
            total
        );


    const target =
        shiftTargets[
            shiftInput.value
        ] || 0;


    let percent =
        target > 0
            ? (
                total /
                target
            ) * 100
            : 0;


    percent =
        Math.min(
            100,
            Math.max(
                0,
                percent
            )
        );


    performanceBar.style.width =
        `${percent}%`;


    performanceBar.className =
        "performance-bar " +
        getStatusClass(
            total
        );

}


/* =========================================================
   SALVAR
========================================================= */

async function salvarMaquina(){

    if(!machineAtual){

        showToast(
            "Nenhuma máquina selecionada."
        );

        return;

    }


    showLoading(true);


    try{

        const maquinaNumero =
            Number(
                machineAtual.replace(
                    "M",
                    ""
                )
            );


        if(
            !Number.isInteger(
                maquinaNumero
            ) ||
            maquinaNumero <= 0
        ){

            showToast(
                "Máquina inválida."
            );

            return;

        }


        const horaBoa =
            parseMinutes(
                goodHoursInput.value
            );


        const reposicao =
            parseMinutes(
                replacementHoursInput.value
            );


        const totalBaixado =
            horaBoa +
            reposicao;


        const saldo =
            parseMinutes(
                balanceInput.value
            );


        /*
         * IMPORTANTE:
         *
         * A RPC espera:
         *
         * categoria
         * descricao
         */

        const ocorrencias =
            ocorrenciasAtuais
                .map(
                    item => ({

                        categoria:
                            item.tipo ||
                            "Outro",

                        descricao:
                            item.descricao ||
                            ""

                    })
                )
                .filter(
                    item =>
                        item.descricao
                            .trim()
                            .length > 0
                );


        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "salvar_apontamento_lider",
                    {

                        p_data:
                            dateInput.value,

                        p_turno:
                            shiftInput.value,

                        p_setor:
                            sectorInput.value,

                        p_maquina:
                            maquinaNumero,

                        p_hora_boa:
                            horaBoa,

                        p_reposicao:
                            reposicao,

                        p_total_baixado:
                            totalBaixado,

                        p_saldo:
                            saldo,

                        /*
                         * Não existe mais
                         * observação geral.
                         *
                         * A RPC atual ainda possui
                         * esse parâmetro, então ele
                         * recebe null.
                         */

                        p_observacao:
                            null,

                        p_ocorrencias:
                            ocorrencias

                    }
                );


        if(error){

            console.error(
                "Erro RPC:",
                error
            );

            throw error;

        }


        if(
            data !== null &&
            data !== undefined
        ){

            apontamentoAtual = {

                id:
                    data

            };

        }


        showToast(
            `${machineAtual} salvo ✓`
        );


        await renderMachineGrid();


        await fecharTelaMaquina();


    }catch(error){

        console.error(
            "Erro ao salvar:",
            error
        );


        showToast(
            "Não foi possível salvar. " +
            (
                error.message ||
                "Erro desconhecido."
            )
        );


    }finally{

        showLoading(false);

    }

}


/* =========================================================
   EXCLUIR
========================================================= */

async function excluirMaquina(){

    if(
        !apontamentoAtual ||
        !apontamentoAtual.id
    ){

        showToast(
            "Não há apontamento para excluir."
        );

        return;

    }


    if(
        !confirm(
            `Excluir o apontamento da ${machineAtual}?`
        )
    ){

        return;

    }


    showLoading(true);


    try{

        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "excluir_apontamento_lider",
                    {

                        p_apontamento_id:
                            apontamentoAtual.id

                    }
                );


        if(error){

            console.error(
                "Erro RPC de exclusão:",
                error
            );

            throw error;

        }


        if(
            data === null ||
            data === undefined
        ){

            throw new Error(
                "O apontamento não foi excluído."
            );

        }


        showToast(
            `${machineAtual} excluído ✓`
        );


        await fecharTelaMaquina();


    }catch(error){

        console.error(
            "Erro ao excluir:",
            error
        );


        showToast(
            "Não foi possível excluir. " +
            (
                error.message ||
                "Erro desconhecido."
            )
        );


    }finally{

        showLoading(false);

    }

}


/* =========================================================
   SAIR
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


        showToast(
            "Não foi possível sair."
        );


    }finally{

        showLoading(false);

    }

}


/* =========================================================
   EVENTOS
========================================================= */

goodHoursInput.addEventListener(
    "input",
    atualizarTotal
);


replacementHoursInput.addEventListener(
    "input",
    atualizarTotal
);


balanceInput.addEventListener(
    "input",
    atualizarTotal
);


shiftInput.addEventListener(
    "change",
    async () => {

        if(
            machineScreen.classList.contains(
                "hidden"
            )
        ){

            await carregarDados();

        }

    }
);


sectorInput.addEventListener(
    "change",
    async () => {

        if(
            machineScreen.classList.contains(
                "hidden"
            )
        ){

            await carregarDados();

        }

    }
);


dateInput.addEventListener(
    "change",
    async () => {

        if(
            machineScreen.classList.contains(
                "hidden"
            )
        ){

            await carregarDados();

        }

    }
);


/* =========================================================
   AUTH
========================================================= */

supabaseClient.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        if(
            !session ||
            !session.user
        ){

            window.location.href =
                "index.html";

            return;

        }


        currentUser =
            session.user;

    }
);


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function init(){

    showLoading(true);


    try{

        const {
            data:{
                session
            }
        } =
            await supabaseClient
                .auth
                .getSession();


        if(
            !session ||
            !session.user
        ){

            window.location.href =
                "index.html";

            return;

        }


        currentUser =
            session.user;


        await carregarPerfil();


        if(
            !dateInput.value
        ){

            dateInput.value =
                todayLocal();

        }


        shiftInput.value =
            "1º turno";


        sectorInput.value =
            "A";


        await carregarDados();


    }catch(error){

        console.error(
            "Erro na inicialização:",
            error
        );


        showToast(
            error.message ||
            "Não foi possível carregar o sistema."
        );


    }finally{

        showLoading(false);

    }

}


init();
