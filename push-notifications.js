
(function(){
    "use strict";

    const VAPID_PUBLIC_KEY =
        "BGexVSG29qkxLgjV8KBgzSUkdH9s_DoCAoOQJbn6QHE6hHT98H9AZ-LdqFSPGGHIrMT_1iJ1gQABJrBn0V8KzQQ";

    let config = null;
    let botao = null;
    let inicializacaoEmAndamento = false;

    function avisar(mensagem){
        if(config && typeof config.toast === "function"){
            config.toast(mensagem);
        }else{
            console.info("[Push]", mensagem);
        }
    }

    function base64UrlParaUint8Array(valor){
        const padding = "=".repeat((4 - valor.length % 4) % 4);
        const base64 = (valor + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const binario = atob(base64);
        const resultado = new Uint8Array(binario.length);

        for(let i = 0; i < binario.length; i++){
            resultado[i] = binario.charCodeAt(i);
        }

        return resultado;
    }

    function criarBotao(){
        const dropdown = document.getElementById("userMenuDropdown");

        if(!dropdown) return false;

        if(document.getElementById("ativarPushButton")){
            botao = document.getElementById("ativarPushButton");
            return true;
        }

        const botaoSair = dropdown.querySelector(
            'button[onclick="sair()"]'
        );

        if(!botaoSair) return false;

        botao = document.createElement("button");
        botao.id = "ativarPushButton";
        botao.type = "button";
        botao.className = botaoSair.className;
        botao.textContent = "Ativar notificações";
        botao.setAttribute(
            "aria-label",
            "Ativar notificações Push neste dispositivo"
        );

        botao.addEventListener("click", ativarNotificacoesPush);

        dropdown.insertBefore(botao, botaoSair);

        return true;
    }

    async function salvarInscricao(inscricao){
        if(!config || !config.client || !config.user){
            throw new Error("Sessão autenticada indisponível.");
        }

        const endpoint = inscricao.endpoint;
        const chavePublica = inscricao.getKey("p256dh");
        const chaveAutenticacao = inscricao.getKey("auth");

        if(!endpoint || !chavePublica || !chaveAutenticacao){
            throw new Error("A inscrição Push está incompleta.");
        }

        const dados = {
            user_id: config.user.id,
            endpoint: endpoint,
            p256dh: btoa(
                String.fromCharCode(...new Uint8Array(chavePublica))
            ),
            auth_key: btoa(
                String.fromCharCode(...new Uint8Array(chaveAutenticacao))
            ),
            user_agent: navigator.userAgent,
            updated_at: new Date().toISOString()
        };

        const { error } = await config.client
            .from("push_subscriptions")
            .upsert(dados, { onConflict: "endpoint" });

        if(error) throw error;
    }

    async function atualizarEstadoBotao(){
        if(!botao) return;

        if(!("serviceWorker" in navigator) ||
           !("PushManager" in window) ||
           !("Notification" in window)){
            botao.disabled = true;
            botao.textContent = "Push não disponível";
            return;
        }

        if(Notification.permission === "denied"){
            botao.disabled = true;
            botao.textContent = "Notificações bloqueadas";
            return;
        }

        try{
            const registro = await navigator.serviceWorker.ready;
            const inscricao = await registro.pushManager.getSubscription();

            if(inscricao && Notification.permission === "granted"){
                botao.textContent = "Notificações ativadas";
            }else{
                botao.textContent = "Ativar notificações";
            }
        }catch(error){
            console.error("Erro ao verificar Push:", error);
            botao.textContent = "Ativar notificações";
        }
    }

    async function ativarNotificacoesPush(){
        if(!config || !config.client || !config.user){
            avisar("Aguarde a autenticação do sistema.");
            return;
        }

        if(!botao || botao.disabled) return;

        botao.disabled = true;
        botao.textContent = "Ativando...";

        try{
            if(!("serviceWorker" in navigator) ||
               !("PushManager" in window) ||
               !("Notification" in window)){
                throw new Error(
                    "Este navegador não oferece suporte às notificações Push."
                );
            }

            if(!window.isSecureContext){
                throw new Error(
                    "As notificações exigem uma conexão segura HTTPS."
                );
            }

            const permissao = await Notification.requestPermission();

            if(permissao !== "granted"){
                throw new Error(
                    permissao === "denied"
                        ? "Permissão bloqueada. Verifique as configurações do navegador."
                        : "Permissão para notificações não concedida."
                );
            }

            const registro = await navigator.serviceWorker.register(
                "./service-worker.js"
            );

            await navigator.serviceWorker.ready;

            let inscricao = await registro.pushManager.getSubscription();

            if(inscricao){
                const chaveAtual = inscricao.options.applicationServerKey;
                const chaveEsperada = base64UrlParaUint8Array(
                    VAPID_PUBLIC_KEY
                );

                const chaveIgual =
                    chaveAtual &&
                    chaveAtual.byteLength === chaveEsperada.byteLength &&
                    chaveEsperada.every(
                        (byte, indice) => byte === new Uint8Array(chaveAtual)[indice]
                    );

                if(!chaveIgual){
                    await inscricao.unsubscribe();
                    inscricao = null;
                }
            }

            if(!inscricao){
                inscricao = await registro.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey:
                        base64UrlParaUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            await salvarInscricao(inscricao);

            botao.textContent = "Notificações ativadas";
            avisar("Notificações Push ativadas neste dispositivo.");
        }catch(error){
            console.error("Erro ao ativar notificações Push:", error);

            avisar(
                error && error.message
                    ? error.message
                    : "Não foi possível ativar as notificações."
            );
        }finally{
            if(botao){
                botao.disabled = false;
                await atualizarEstadoBotao();
            }
        }
    }

    window.inicializarPushNotificacoes = function(novaConfig){
        if(!novaConfig || !novaConfig.client || !novaConfig.user){
            return;
        }

        config = novaConfig;

        if(!criarBotao()){
            console.warn(
                "Menu do usuário indisponível para o botão Push."
            );
            return;
        }

        atualizarEstadoBotao();
    };

    /* Funciona mesmo se a autenticação terminar antes deste arquivo carregar. */
    if(window.__controlePushConfig){
        window.inicializarPushNotificacoes(
            window.__controlePushConfig
        );
    }
})();
