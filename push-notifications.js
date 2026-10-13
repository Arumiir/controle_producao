
(function () {
  "use strict";

  const SUPABASE_URL =
    "https://icajmncojvidhrqlbevq.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_vQFsGutuZDHBruMghZkQYQ_BSwEBXFp";

  const VAPID_PUBLIC_KEY =
    "BGexVSG29qkxLgjV8KBgzSUkdH9s_DoCAoOQJbn6QHE6hHT98H9AZ-LdqFSPGGHIrMT_1iJ1gQABJrBn0V8KzQQ";

  let pushClient = null;
  let pushButton = null;
  let pushBusy = false;

  function avisar(mensagem) {
    const toast = document.getElementById("toast");

    if (toast) {
      toast.textContent = mensagem;
      toast.classList.add("show");

      window.setTimeout(() => {
        toast.classList.remove("show");
      }, 4000);

      return;
    }

    window.alert(mensagem);
  }

  function obterCliente() {
    if (pushClient) return pushClient;

    if (!window.supabase?.createClient) {
      throw new Error("Biblioteca do Supabase não carregada.");
    }

    pushClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    return pushClient;
  }

  function decodificarChaveBase64Url(valor) {
    const base64 = valor
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const preenchido = base64.padEnd(
      Math.ceil(base64.length / 4) * 4,
      "="
    );

    const binario = window.atob(preenchido);
    const bytes = new Uint8Array(binario.length);

    for (let i = 0; i < binario.length; i++) {
      bytes[i] = binario.charCodeAt(i);
    }

    return bytes;
  }

  function codificarBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binario = "";

    for (const byte of bytes) {
      binario += String.fromCharCode(byte);
    }

    return window.btoa(binario)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  function chavesIguais(a, b) {
    if (!a || !b) return false;

    const chaveA = new Uint8Array(a);
    const chaveB = new Uint8Array(b);

    if (chaveA.length !== chaveB.length) return false;

    return chaveA.every((byte, indice) => byte === chaveB[indice]);
  }

  async function obterUsuarioAutenticado() {
    const client = obterCliente();

    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    const usuario = data?.session?.user;

    if (!usuario?.id) {
      throw new Error(
        "Sua sessão não foi encontrada. Entre novamente no aplicativo."
      );
    }

    return usuario;
  }

  async function obterInscricaoAtual(registration) {
    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) return null;

    const chaveAtual =
      subscription.options?.applicationServerKey;

    const chaveEsperada =
      decodificarChaveBase64Url(VAPID_PUBLIC_KEY);

    if (
      chaveAtual &&
      !chavesIguais(chaveAtual, chaveEsperada.buffer)
    ) {
      await subscription.unsubscribe();
      subscription = null;
    }

    return subscription;
  }

  async function salvarInscricao(usuario, subscription) {
    const client = obterCliente();

    const p256dh = subscription.getKey("p256dh");
    const auth = subscription.getKey("auth");

    if (!p256dh || !auth) {
      throw new Error(
        "O navegador não forneceu as chaves da inscrição."
      );
    }

    const registro = {
      user_id: usuario.id,
      endpoint: subscription.endpoint,
      p256dh: codificarBase64Url(p256dh),
      auth_key: codificarBase64Url(auth),
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString()
    };

    // Atualiza a inscrição se ela já pertence ao usuário.
    const { data: existente, error: erroBusca } = await client
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", usuario.id)
      .eq("endpoint", subscription.endpoint)
      .maybeSingle();

    if (erroBusca) throw erroBusca;

    if (existente?.id) {
      const { error } = await client
        .from("push_subscriptions")
        .update({
          p256dh: registro.p256dh,
          auth_key: registro.auth_key,
          user_agent: registro.user_agent,
          updated_at: registro.updated_at
        })
        .eq("id", existente.id);

      if (error) throw error;

      return;
    }

    // Não transfere automaticamente uma inscrição de outra conta.
    const { error: erroInsert } = await client
      .from("push_subscriptions")
      .insert(registro);

    if (erroInsert) {
      if (erroInsert.code === "23505") {
        throw new Error(
          "Este navegador já está vinculado a outra conta. " +
          "Saia dessa conta no aplicativo antes de registrar outra."
        );
      }

      throw erroInsert;
    }
  }

  function atualizarTextoBotao(texto, desabilitado) {
    if (!pushButton) return;

    const span = pushButton.querySelector("span");

    if (span) span.textContent = texto;

    pushButton.disabled = Boolean(desabilitado);
  }

  async function atualizarEstadoBotao() {
    if (!pushButton) return;

    if (!("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)) {
      atualizarTextoBotao(
        "Notificações indisponíveis neste navegador",
        true
      );
      return;
    }

    if (Notification.permission === "denied") {
      atualizarTextoBotao(
        "Notificações bloqueadas no navegador",
        true
      );
      return;
    }

    try {
      const registration =
        await navigator.serviceWorker.getRegistration("./");

      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null;

      if (
        subscription &&
        Notification.permission === "granted"
      ) {
        const usuario = await obterUsuarioAutenticado();
        const client = obterCliente();

        const { data, error } = await client
          .from("push_subscriptions")
          .select("id")
          .eq("user_id", usuario.id)
          .eq("endpoint", subscription.endpoint)
          .maybeSingle();

        if (!error && data?.id) {
          atualizarTextoBotao(
            "Notificações ativadas neste dispositivo",
            false
          );
          return;
        }
      }
    } catch (error) {
      console.warn(
        "Não foi possível consultar o estado do Push.",
        error
      );
    }

    atualizarTextoBotao("Ativar notificações", false);
  }

  async function ativarNotificacoesPush() {
    if (pushBusy) return;

    pushBusy = true;
    atualizarTextoBotao("Ativando notificações...", true);

    try {
      if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        throw new Error(
          "Este navegador não oferece suporte a notificações Push. " +
          "Em iPhones, use um aplicativo instalado na tela inicial " +
          "e uma versão compatível do iOS."
        );
      }

      if (!window.isSecureContext) {
        throw new Error(
          "As notificações exigem uma conexão HTTPS segura."
        );
      }

      const usuario = await obterUsuarioAutenticado();

      // O pedido de permissão acontece em resposta ao clique do usuário.
      let permissao = Notification.permission;

      if (permissao === "default") {
        permissao = await Notification.requestPermission();
      }

      if (permissao !== "granted") {
        throw new Error(
          "Permissão não concedida. Verifique as configurações " +
          "de notificações do navegador."
        );
      }

      const registration =
        await navigator.serviceWorker.register(
          "./service-worker.js"
        );

      await navigator.serviceWorker.ready;

      let subscription =
        await obterInscricaoAtual(registration);

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            decodificarChaveBase64Url(VAPID_PUBLIC_KEY)
        });
      }

      await salvarInscricao(usuario, subscription);

      atualizarTextoBotao(
        "Notificações ativadas neste dispositivo",
        false
      );

      avisar(
        "Notificações ativadas neste dispositivo."
      );
    } catch (error) {
      console.error("Erro ao ativar Web Push:", error);

      const mensagem =
        error?.message ||
        "Não foi possível ativar as notificações.";

      avisar(mensagem);

      atualizarTextoBotao("Tentar ativar novamente", false);
    } finally {
      pushBusy = false;

      if (pushButton) {
        pushButton.disabled = false;
      }
    }
  }

  function criarBotaoNotificacoes() {
    const dropdown =
      document.getElementById("userMenuDropdown");

    if (!dropdown || dropdown.dataset.pushButtonCreated === "true") {
      return;
    }

    const botaoSair = dropdown.querySelector(
      'button[onclick="sair()"]'
    );

    if (!botaoSair) return;

    pushButton = document.createElement("button");
    pushButton.type = "button";
    pushButton.className = "user-menu-item";
    pushButton.setAttribute(
      "aria-label",
      "Ativar notificações neste dispositivo"
    );

    pushButton.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round"
           aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
        <path d="M10 21h4"></path>
      </svg>
      <span>Ativar notificações</span>
    `;

    pushButton.addEventListener(
      "click",
      ativarNotificacoesPush
    );

    dropdown.insertBefore(botaoSair.parentNode === dropdown
      ? pushButton
      : pushButton, botaoSair);

    dropdown.dataset.pushButtonCreated = "true";

    atualizarEstadoBotao();
  }

  window.ativarNotificacoesPush = ativarNotificacoesPush;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      criarBotaoNotificacoes
    );
  } else {
    criarBotaoNotificacoes();
  }
})();
