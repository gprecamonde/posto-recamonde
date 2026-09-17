
  let CONFIG = {};
  let APP_VERSION;

  async function carregarConfig() {
    try {

        // 🔥 config SEM versão (regra de ouro)
        const resp = await fetch(`config.json?v=${Date.now()}`);

        if (!resp.ok)
        throw new Error("Erro ao carregar config");

        CONFIG = await resp.json();

        // agora temos a versão
        APP_VERSION = CONFIG.app.versao;

    } catch (e) {

        console.error(e);

        document.body.innerHTML = `
        <div style="
            display:flex;
            height:100vh;
            align-items:center;
            justify-content:center;
            font-family:Montserrat;
            flex-direction:column;
            gap:12px;
            text-align:center;
        ">
            <h2>⚠️ Não foi possível carregar o site.</h2>
            <button onclick="location.reload()">
            🔄 Tentar novamente
            </button>
        </div>
        `;
    }
  }

  function iniciarSite() {
    aplicarBranding(); // cores primeiro
    aplicarLogo();
    aplicarConfig();
    aplicarSEO();
  }


  function aplicarLogo() {

    const logo = document.getElementById("logoSite");
    if (!logo) return;

    logo.src = CONFIG.branding.logo;
    logo.alt = CONFIG.branding.logo_alt || CONFIG.igreja.nome;

    logo.onerror = () => {
      logo.src = "img/logoA.png";
    };

  }


  function aplicarConfig() {

    document.querySelectorAll("[data-config]")
      .forEach(el => {

        const caminho = el.dataset.config.split(".");
        const format  = el.dataset.format;

        let valor = CONFIG;

        caminho.forEach(chave => {
          valor = valor?.[chave];
        });

        if (valor === undefined || valor === null) return;


        /* =========================
          FORMATADORES
        ========================= */

        // 🔥 WHATSAPP
        if (format === "whatsapp") {

          let numero = valor.replace(/\D/g,'');

          if (numero.length === 11) {
            numero = "55" + numero;
          }

          const msg = encodeURIComponent(
            CONFIG.contato?.mensagem || ""
          );

          el.href = `https://wa.me/${numero}?text=${msg}`;
          return;
        }


        // 🔥 PIX (remove +55 visualmente)
        if (format === "pix") {

          let chave = valor;

          if (chave.startsWith("+55")) {
            chave = chave.slice(3);
          }

          el.innerText = chave;
          return;
        }


        /* =========================
          ELEMENTOS ESPECIAIS
        ========================= */

        // IMG
        if (el.tagName === "IMG") {

          el.src = valor;

          // ALT dinâmico
          if (el.dataset.alt) {

            const altPath = el.dataset.alt.split(".");
            let altValor = CONFIG;

            altPath.forEach(chave => {
              altValor = altValor?.[chave];
            });

            if (altValor) {
              el.alt = altValor;
            }
          }

          return;
        }


        // LINK
        if (el.tagName === "A") {
          el.href = valor;
          return;
        }


        /* =========================
          PADRÃO → TEXTO
        ========================= */

        el.innerText = valor;

      });

  }


  function aplicarSEO() {

    const nome = CONFIG.app.nome_completo;
    const empresa = CONFIG.empresa?.nome || "";
    const subtitulo = CONFIG.empresa?.subtitulo || "";

    const descricao =
      `${empresa} - ${subtitulo}. Veja nossas unidades e localização.`;

    document.title = nome;

    document
      .querySelector("meta[name='description']")
      .setAttribute("content", descricao);

    document
      .querySelector("meta[property='og:title']")
      .setAttribute("content", nome);

    document
      .querySelector("meta[property='og:description']")
      .setAttribute("content", descricao);

    document
      .querySelector("meta[property='og:url']")
      .setAttribute("content", CONFIG.site.url);

    document
      .querySelector("meta[property='og:image']")
      .setAttribute("content",
        CONFIG.site.url + "/" + CONFIG.site.imagem);

    document
      .querySelector("meta[name='theme-color']")
      .setAttribute("content",
      CONFIG.tema?.cor_primaria || "#0b3c5d"
      );

  }

  function aplicarBranding() {

    const tema = CONFIG.tema;

    if (!tema) {
      console.error("Tema não encontrado!");
      return;
    }

    Object.entries(tema).forEach(([key, value]) => {

      document.documentElement.style
       .setProperty(`--${key.replaceAll('_','-')}`, value);

    });

    document.documentElement.style
     .setProperty('--cor-primaria', CONFIG.tema.cor_primaria);

    document
      .querySelector("link[rel='icon']")
      .setAttribute("href", CONFIG.branding.favicon);

    document
      .querySelector("link[rel='apple-touch-icon']")
      .setAttribute("href", CONFIG.branding.favicon);

    document
      .querySelector("meta[name='apple-mobile-web-app-title']")
      .setAttribute("content", CONFIG.app.nome_completo);

  }

  let VERSICULOS_BASE = [];
  let indiceVersiculo = 0;

  /* 🔹 carrega versiculos.json */
  async function carregarVersiculos() {
    try {
      const resp = await fetch(`versiculos.json?v=${APP_VERSION || Date.now()}`);
      const data = await resp.json();

      VERSICULOS_BASE = data.versiculos || [];

      // índice salvo (não repete até acabar)
      indiceVersiculo = parseInt(
        localStorage.getItem("idxVersiculo") || "0"
      );

      carregarVersiculo(); // carrega o primeiro

    } catch (e) {
      console.error("Erro ao carregar versículos:", e);
    }
  }

  function versiculoDoDia() {
    if (VERSICULOS_BASE.length === 0) return null;

    const hoje = new Date();
    return VERSICULOS_BASE[
      hoje.getDate() % VERSICULOS_BASE.length
    ];
  }

  let versiculoAtual = "";
  let referenciaAtual = "";

  async function carregarVersiculo(forcarNovo = false) {
    const ref = forcarNovo
    ? VERSICULOS_BASE[Math.floor(Math.random() * VERSICULOS_BASE.length)]
    : versiculoDoDia();

    const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=almeida`;

    try {
      const resp = await fetch(url);
      const data = await resp.json();

      versiculoAtual = data.text.trim();
      referenciaAtual = data.reference;

      document.querySelector(".versiculo-texto").innerText = versiculoAtual;
      document.querySelector(".versiculo-ref").innerText = referenciaAtual;

    } catch {
      document.querySelector(".versiculo-texto").innerText =
        "A Palavra do Senhor permanece para sempre.";
      document.querySelector(".versiculo-ref").innerText =
        "1 Pedro 1:25";
    }

  }

  function atualizarVersiculo() {
    if (VERSICULOS_BASE.length === 0) return;

    const ref =
      VERSICULOS_BASE[indiceVersiculo % VERSICULOS_BASE.length];

    indiceVersiculo++;
    localStorage.setItem("idxVersiculo", indiceVersiculo);

    carregarVersiculoPorReferencia(ref);
  }



  async function carregarVersiculoPorReferencia(ref) {
    const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=almeida`;

    try {
      const resp = await fetch(url);
      const data = await resp.json();

      versiculoAtual = data.text.trim();
      referenciaAtual = data.reference;

      document.querySelector(".versiculo-texto").innerText = versiculoAtual;
      document.querySelector(".versiculo-ref").innerText = referenciaAtual;

    } catch {
      document.querySelector(".versiculo-texto").innerText =
        "A Palavra do Senhor permanece para sempre.";
      document.querySelector(".versiculo-ref").innerText =
        "1 Pedro 1:25";
    }
  }


  function compartilharVersiculo() {
  if (!versiculoAtual) return;

  const texto = `📖 *Versículo do Dia*\n\n"${versiculoAtual}"\n\n📌 ${referenciaAtual}`;
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;

  window.open(url, "_blank");
  }


  let payloadPixGerado = '';
  
  
  function toggleLegenda() {
    const legenda = document.getElementById("agendaLegenda");
    const btn = document.querySelector(".btn-legenda-toggle");

    legenda.classList.toggle("show");

    if (legenda.classList.contains("show")) {
      btn.innerText = "ℹ️ Ocultar legenda";
    } else {
      btn.innerText = "ℹ️ Mostrar legenda";
    }
  }

  
  function formatarValor(campo) {
    let v = campo.value.replace(/\D/g, '');
    v = (v / 100).toFixed(2).replace('.', ',');
    campo.value = v;

    const valorNum = parseFloat(v.replace(',', '.'));
    const btnGerar = document.getElementById('btnPix');

    if (valorNum >= 1) {
      btnGerar.disabled = false;
      document.getElementById('valorResumo').innerText =
        'Valor informado: R$ ' + v;
    } else {
      btnGerar.disabled = true;
      document.getElementById('valorResumo').innerText = '';

      // 🔥 valor inválido → limpa tudo
      limparPix();
    }
  }

  function crc16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function montarCampo(id, valor) {
    return id + valor.length.toString().padStart(2, "0") + valor;
  }

  function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .toUpperCase();
  }

  function normalizarChavePix(chave) {

      chave = chave.trim();

      // se já tem +, mantém
      if (chave.startsWith("+")) {
          return chave;
      }

      // remove tudo que não for número
      let limpa = chave.replace(/\D/g, '');

      // telefone brasileiro
      if (limpa.length === 11) {
          return "+55" + limpa;
      }

      return limpa;
  }

  function chavePixParaExibicao(chave){

      if(!chave) return "";

      // remove +55 apenas se for telefone
      if(chave.startsWith("+55")){
          return chave.slice(3);
      }

      return chave;
  }

  /* =========================
    AGENDA DE reunioes
  ========================= */

  function iconeTipo(tipo) {
      switch (tipo) {
        case "POSTO PIONEIRO":   return "⛽";
        case "POSTO RECAMONDE":  return "🛡️";
        case "POSTO RECAMONDE 2": return "🏪";
        default:          return "📅";  
      }
  }

  function eventosDoDia(dataStr) {
      const ev = reunioes[dataStr];
      if (!ev) return [];
      return Array.isArray(ev) ? ev : [ev];
  }

  function atualizarLegendaAtiva() {

      const tiposDoMes = new Set();

      const ano = dataAtual.getFullYear();
      const mes = dataAtual.getMonth() + 1;

      Object.keys(reunioes).forEach(data => {
        const [a, m] = data.split('-').map(Number);

        if (a === ano && m === mes) {
          const eventos = eventosDoDia(data);
          eventos.forEach(ev => {
            if (ev.tipo) tiposDoMes.add(ev.tipo);
          });
        }

      });

      document.querySelectorAll('.agenda-legenda span').forEach(span => {
        const tipo = span.dataset.tipo;
        span.classList.toggle('ativo', tiposDoMes.has(tipo));
      });

  }

  function mesAnterior() {
    dataAtual.setMonth(dataAtual.getMonth() - 1);
    renderAgenda();
  }

  function mesSeguinte() {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    renderAgenda();
  }

  function renderAgendaSemanal() {
      const box = document.getElementById("agendaSemanal");
      if (!box) return;

      box.innerHTML = "";

      const hoje = new Date();
      hoje.setHours(0,0,0,0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(hoje);
        d.setDate(hoje.getDate() + i);

        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2,'0');
        const dia = String(d.getDate()).padStart(2,'0');
        const dataStr = `${ano}-${mes}-${dia}`;

        const nomeDia = d.toLocaleDateString("pt-BR", { weekday: "long" });
        const dataCurta = d.toLocaleDateString("pt-BR");

        const eventos = eventosDoDia(dataStr);

        const card = document.createElement("div");
        card.className = "semana-card";

        if (eventos.length > 0) {

          const listaEventos = eventos.map(ev => `
            <small>
              ${iconeTipo(ev.tipo)} ${ev.titulo} – ${ev.hora}
            </small>
          `).join('');

          card.innerHTML = `
            📅 ${nomeDia}
            <small>${dataCurta}</small>
            ${listaEventos}
            <span class="tag">Culto</span>
          `;

        } else {

          card.innerHTML = `
            📆 ${nomeDia}
            <small>${dataCurta}</small>
            <small>Sem evento</small>
            <span class="tag">Agenda livre</span>
          `;

          card.style.opacity = "0.85";
        }

        box.appendChild(card);
      }
  }


  function fecharModal() {
    document.getElementById("modalEvento").style.display = "none";
  }

  function clicouForaModal(e) {
    // fecha se clicar fora da caixa branca
    if (e.target.id === "modalEvento") {
        fecharModal();
    }
  }

  function abrirModal(data) {
    
        const eventos = eventosDoDia(data);
        if (!eventos || eventos.length === 0) {
        console.warn("Nenhum evento encontrado para:", data);
        return;
        }

      if (eventos.length === 0) return;

      const modal  = document.getElementById("modalEvento");
      const titulo = document.getElementById("modalTitulo");
      const dataEl = document.getElementById("modalData");
      const box    = document.getElementById("modalListaEventos");

      // 🔹 limpa estado anterior
      box.innerHTML = "";
      modal.classList.remove("modal-unico");

      // 🔹 data formatada
      dataEl.innerText = `📅 ${data.split('-').reverse().join('/')}`;

      // ==========================
      // 🔹 CASO 1: APENAS UM EVENTO
      // ==========================
       //${ev.observacao ? `<p class="modal-obs">📝 ${ev.observacao}</p>` : ``}

      if (eventos.length === 1) {

        const ev = eventos[0];

        modal.classList.add("modal-unico");
        titulo.innerText = `${iconeTipo(ev.tipo)} ${ev.titulo}`;

        box.innerHTML = `
          <p>⏰ <strong>Horário:</strong> ${ev.hora}</p>
            <p>🎤 <strong>Dirigente:</strong> ${ev.ministrante || ev.dirigente || "A definir"}</p>

          ${ev.tema ? `<p class="modal-tema">📖 <strong>Tema:</strong> ${ev.tema}</p>` : ``}
          ${ev.observacao ? `<div class="modal-obs">${ev.observacao.replace(/\n/g,'<br>')}</div>` : ``}
        `;

      }

      // ==========================
      // 🔹 CASO 2: MÚLTIPLOS EVENTOS
      // ==========================
      else {

        titulo.innerText = "📅 Eventos do Dia";

        eventos.forEach(ev => {
          const div = document.createElement("div");
          div.className = "modal-evento-item";

          div.innerHTML = `

            <h4>
              ${iconeTipo(ev.tipo)} 
              <span class="titulo-evento">${ev.titulo}</span>
            </h4>

            <p>⏰ ${ev.hora}</p>
            <p>🎤 ${ev.ministrante || ev.dirigente || "A definir"}</p>
            ${ev.tema ? `<p class="modal-tema">📖 ${ev.tema}</p>` : ``}
            ${ev.observacao ? `<div class="modal-obs">${ev.observacao}</div>` : ``}
          `;

          box.appendChild(div);
        });
      }

      modal.style.display = "flex";
  }


  function carregarMapa() {

      const container = document.getElementById("mapaContainer");

      if (!container) {
          console.error("❌ Elemento #mapaContainer não encontrado no HTML");
          return;
      }

      const locais = CONFIG.localizacao;

      if (!Array.isArray(locais) || locais.length === 0) {
          console.error("❌ Nenhuma localização encontrada no config.json");
          return;
      }

      const primeiro = locais[0];

      console.log("📍 Carregando mapa:", primeiro);

      container.innerHTML = `
          <div id="unidadeSelecionada" class="unidade-selecionada">
              📍 ${primeiro.nome}
          </div>

          <div class="mapa-box">
              <iframe
                  id="mapaFrame"
                  width="100%"
                  height="350"
                  style="border:0;border-radius:12px"
                  loading="lazy"
                  allowfullscreen
                  src="https://www.google.com/maps?q=${primeiro.lat},${primeiro.lng}&output=embed">
              </iframe>
          </div>
      `;
  }

  
  function selecionarUnidade(nome, lat, lng, link, el) {

      document.getElementById("unidadeSelecionada").innerText =
          "📍 Unidade: " + nome;

      document.querySelectorAll(".item-unidade")
          .forEach(x => x.classList.remove("ativo"));

      el.classList.add("ativo");

      document.getElementById("mapaFrame").src =
          `https://www.google.com/maps?q=${lat},${lng}&output=embed`;

  }

  function mapaErro() {
    const container = document.getElementById("mapaContainer");

    container.innerHTML = `
      <div style="padding:30px;text-align:center;">
        <p>⚠️ Não foi possível carregar o mapa.</p>
        <button onclick="carregarMapa()" style="
          padding:10px 16px;
          border:none;
          border-radius:6px;
          background:#0b3c5d;
          color:#fff;
          font-weight:600;
          cursor:pointer;">
          🔄 Atualizar mapa
        </button>
      </div>
    `;
  }

  function carregarUnidades() {

    const container = document.getElementById("listaUnidades");

    container.innerHTML = "";

    CONFIG.unidades.forEach((unidade, index) => {

      const bloco = document.createElement("div");

      bloco.className = "bloco-unidade";

      bloco.innerHTML = `
        <div class="titulo-unidade"
            onclick="toggleUnidade(${index})">
          ${unidade.nome}
        </div>

        <div class="itens-unidade"
            id="unidade-${index}">

          ${unidade.abastecimentos.map(item => `
            <div class="item-painel">

              <a href="javascript:void(0)"
                onclick="abrirPainel('${item.url}', this)"
                class="btn-unidade">

                ${item.nome}

              </a>

              <div class="painel-item"></div>

            </div>
          `).join("")}

        </div>
      `;

      container.appendChild(bloco);

    });

  } 

  function abrirPainel(url, el) {

    const container = el.parentElement.querySelector(".painel-item");

    if (!container) return;

    // 🔥 Se já estiver aberto → FECHA
    if (container.innerHTML.trim() !== "") {
      container.innerHTML = "";
      el.classList.remove("ativo");
      return;
    }

    // 🔥 Fecha todos os outros
    document.querySelectorAll(".painel-item")
      .forEach(p => p.innerHTML = "");

    document.querySelectorAll(".btn-unidade")
      .forEach(btn => btn.classList.remove("ativo"));

    // 🔥 Marca o atual
    el.classList.add("ativo");

    const altura = window.innerWidth < 768 ? "65vh" : "75vh";

    container.innerHTML = `
    <iframe
        class="painel-powerbi"
        src="${url}"
        frameborder="0"
        allowfullscreen>
    </iframe>`;
  }

  function toggleUnidade(index) {
  const el = document.getElementById(`unidade-${index}`);
  el.classList.toggle("show");
  }

  document.addEventListener("DOMContentLoaded", async () => {

      document.getElementById("ano").innerText =
          new Date().getFullYear();

      // 1. Configuração é necessária para montar o site
      await carregarConfig();

      // 2. Monta imediatamente o conteúdo principal
      iniciarSite();
      carregarUnidades();
      carregarMapa();

      // 3. Versículos são carregados depois
      carregarVersiculos();

  });

