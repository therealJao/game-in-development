import { duracaoCutscene } from "./cutscenes.js";
import { FAIXAS_RADIO, indiceRadio } from "./radio-menu.js";
import { retratoAxel } from "./retrato-axel.js";
const themes = ["cidade", "aero", "noite"];
export function validarPreferencias(p = {}) {
  return {
    tema: themes.includes(p.tema) ? p.tema : "cidade",
    sensibilidade: Math.max(0.3, Math.min(2, Number(p.sensibilidade) || 1)),
    tamanhoLegenda: Math.max(18, Math.min(32, Number(p.tamanhoLegenda) || 23)),
    legendas: p.legendas !== false,
    figurantes: p.figurantes !== false,
    maos: p.maos !== false,
    minimapa: p.minimapa !== false,
    radioFaixa: indiceRadio(p.radioFaixa),
    radioLigada: p.radioLigada !== false,
  };
}
export function montarInterface2026({
  estado,
  view,
  acao,
  pular,
  trocarMusica,
}) {
  let prefs = {};
  try {
    prefs = JSON.parse(localStorage.getItem("escape-code-interface") || "{}");
  } catch {}
  Object.assign(estado, validarPreferencias(prefs));
  const menu = document.getElementById("menu");
  menu.innerHTML = `<div class="menu-shell"><header class="front-header"><h1>ESCAPE CODE</h1><div class="front-profile"><b>AXEL</b><span>Modo história</span><strong>2.25</strong></div></header>
  <nav class="front-tabs" aria-label="Navegação principal"><button data-front-tab="historia" class="active">HISTÓRIA</button><button data-front-tab="fases">CAPÍTULOS</button><button data-action="options">OPÇÕES</button><button data-action="credits">CRÉDITOS</button></nav>
  <section class="front-body" id="front-historia"><div class="front-list"><button data-action="new" class="selected"><span>01</span>Jogar história <b>↵</b></button><button data-front-tab="fases"><span>02</span>Escolher capítulo <b>›</b></button><button data-action="options"><span>03</span>Opções <b>›</b></button><button data-action="music"><span>♫</span><span id="musicStatus">ATIVAR MÚSICA</span></button></div><aside class="front-feature"><div class="gta-tag"><span>WHO IS THIS GTA 6</span><img src="assets/gta.png" alt="Grand Theft Auto VI" /></div><p>Axel. Uma Biz emprestada.<br>Um caminho nada normal de volta.</p></aside></section>
  <section class="front-body" id="front-fases" hidden><div id="front-chapters" class="front-list"></div><aside class="front-feature"><h2>Qual vai ser a próxima?</h2><p>Escolha um capítulo para jogar.<br>A história completa começa no quarto do Axel.</p></aside></section>
  <footer class="front-footer"><label>TEMA <select id="temaMenu"><option value="cidade">Cidade</option><option value="aero">Frutiger Aero</option><option value="noite">Noite</option></select></label><span>↑ ↓ navegar &nbsp; ↵ escolher &nbsp; Esc voltar</span></footer></div>`;
  const settings = document.getElementById("settings");
  const profile = menu.querySelector(".front-profile");
  profile.innerHTML =
    '<div><b>AXEL</b><span>Modo história</span><strong>R$ 6767</strong></div><img alt="Retrato do Axel" />';
  profile.querySelector("img").src = retratoAxel(view().renderer);
  const radio = document.createElement("section");
  radio.className = "radio-menu";
  radio.innerHTML =
    '<small>RÁDIO ESCAPE</small><select id="faixaRadioMenu" aria-label="Música do menu"></select><div><button id="radioAnterior" aria-label="Música anterior">‹</button><button id="radioPlay">PAUSAR</button><button id="radioProxima" aria-label="Próxima música">›</button></div>';
  menu.querySelector(".front-feature").append(radio);
  const selectRadio = document.getElementById("faixaRadioMenu");
  for (const [i, track] of FAIXAS_RADIO.entries()) {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = i + 1 + ". " + track.titulo;
    selectRadio.append(o);
  }
  function changeTrack(index) {
    estado.radioFaixa = indiceRadio(index);
    trocarMusica(estado.radioFaixa);
    apply();
  }
  selectRadio.onchange = () => changeTrack(selectRadio.value);
  document.getElementById("radioAnterior").onclick = () =>
    changeTrack((estado.radioFaixa + 3) % 4);
  document.getElementById("radioProxima").onclick = () =>
    changeTrack((estado.radioFaixa + 1) % 4);
  document.getElementById("radioPlay").onclick = () => {
    estado.radioLigada = !estado.radioLigada;
    trocarMusica(estado.radioFaixa);
    apply();
  };
  const oldLabels = ["volume", "musicVolume", "quality", "shiftToggle"].map(
    (id) => document.getElementById(id).closest("label"),
  );
  const levels = settings.querySelector(".seletor-testes");
  const motion = settings.querySelector('[data-action="motion"]');
  settings.replaceChildren();
  settings.className = "settings-2026";
  settings.innerHTML = `<header class="front-header"><h2>ESCAPE CODE</h2><button data-close aria-label="Fechar opções">VOLTAR &nbsp; Esc</button></header><nav class="front-tabs"><button class="active">OPÇÕES</button></nav><div class="settings-columns"><nav id="settings-categories" aria-label="Categorias de opções"></nav><div id="settings-content"></div></div><footer>As alterações são salvas automaticamente.</footer>`;
  const category = document.getElementById("settings-categories"),
    content = document.getElementById("settings-content");
  function add(name, id, nodes) {
    const button = document.createElement("button");
    button.textContent = name;
    button.dataset.category = id;
    category.append(button);
    const pane = document.createElement("section");
    pane.id = "settings-" + id;
    pane.hidden = true;
    const h = document.createElement("h3");
    h.textContent = name;
    pane.append(h, ...nodes);
    content.append(pane);
    button.onclick = () => {
      for (const b of category.children)
        b.classList.toggle("active", b === button);
      for (const p of content.children) p.hidden = p !== pane;
    };
    return pane;
  }
  function control(label, id, type, value, extra = "") {
    const node = document.createElement("label");
    node.innerHTML = `<span>${label}</span><input id="${id}" type="${type}" ${extra}>`;
    const input = node.querySelector("input");
    if (type === "checkbox") input.checked = value;
    else input.value = value;
    input.oninput = () => {
      estado[id] = type === "checkbox" ? input.checked : Number(input.value);
      apply();
    };
    return node;
  }
  function paragraph(text) {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
  }
  add("Áudio", "audio", oldLabels.slice(0, 2));
  add("Teclado e controle", "controls", [
    oldLabels[3],
    paragraph(
      "WASD / analógico esquerdo: mover · Mouse / analógico direito: olhar · E / A: interagir · Shift / L3: correr · Ctrl / B: agachar · F: lanterna · Esc / Menu: pausar · Enter: pular cena",
    ),
  ]);
  add("Câmera", "camera", [
    control(
      "Sensibilidade",
      "sensibilidade",
      "range",
      estado.sensibilidade,
      'min="0.3" max="2" step="0.1"',
    ),
    control("Braços em primeira pessoa", "maos", "checkbox", estado.maos),
    motion,
  ]);
  const full = document.createElement("button");
  full.textContent = "Alternar tela cheia";
  full.className = "settings-button";
  full.onclick = () => {
    if (window.chrome?.webview)
      window.chrome.webview.postMessage({ type: "fullscreen" });
    else if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };
  add("Tela e legendas", "display", [
    full,
    control("Mostrar legendas", "legendas", "checkbox", estado.legendas),
    control(
      "Tamanho das legendas",
      "tamanhoLegenda",
      "range",
      estado.tamanhoLegenda,
      'min="18" max="32" step="1"',
    ),
    control("Mostrar minimapa", "minimapa", "checkbox", estado.minimapa),
  ]);
  add("Gráficos", "graphics", [
    oldLabels[2],
    control(
      "Pessoas nos cenários",
      "figurantes",
      "checkbox",
      estado.figurantes,
    ),
    paragraph(
      "A qualidade ajusta a resolução interna, as sombras e os efeitos de iluminação.",
    ),
  ]);
  const themeLabel = document.createElement("label");
  themeLabel.innerHTML =
    '<span>Tema do menu</span><select id="temaOpcoes"><option value="cidade">Cidade</option><option value="aero">Frutiger Aero</option><option value="noite">Noite</option></select>';
  add("Aparência", "theme", [themeLabel]);
  add("Capítulos", "chapters", [levels]);
  category.firstElementChild.click();
  const chapters = document.getElementById("front-chapters");
  const options = [
    ["quarto", "Prólogo · Axel em casa"],
    ["backrooms-0", "01 · Backrooms"],
    ["labirinto", "02 · Alisanave"],
    ["salao", "03 · O castelo"],
    ["aero-resgate", "04 · Frutiger Aero"],
    ["aero-volei", "05 · Vôlei na praia"],
    ["lua-brita", "06 · Viagem à Lua"],
    ["arc-compras", "07 · Komprão"],
    ["arc-shopping", "08 · Arcoplex"],
    ["arc-level94", "09 · Level 94"],
  ];
  const selector = document.getElementById("faseTeste");
  for (const [value, label] of options) {
    const matching = [...selector.options].find((o) => o.value === value);
    if (!matching) continue;
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = () => {
      selector.value = value;
      acao("testarFase");
    };
    chapters.append(b);
  }
  for (const b of menu.querySelectorAll("[data-front-tab]"))
    b.onclick = () => {
      const tab = b.dataset.frontTab;
      document.getElementById("front-historia").hidden = tab !== "historia";
      document.getElementById("front-fases").hidden = tab !== "fases";
      for (const x of menu.querySelectorAll(".front-tabs button"))
        x.classList.toggle("active", x.dataset.frontTab === tab);
    };
  for (const id of ["temaMenu", "temaOpcoes"])
    document.getElementById(id).onchange = (ev) => {
      estado.tema = ev.target.value;
      apply();
    };
  let lastPreferences = "";
  function apply() {
    document.body.dataset.tema = estado.tema;
    document.body.classList.toggle("sem-legendas", !estado.legendas);
    document.documentElement.style.setProperty(
      "--subtitle-size",
      estado.tamanhoLegenda + "px",
    );
    for (const id of ["temaMenu", "temaOpcoes"])
      document.getElementById(id).value = estado.tema;
    selectRadio.value = estado.radioFaixa;
    document.getElementById("radioPlay").textContent = estado.radioLigada
      ? "PAUSAR"
      : "OUVIR";
    lastPreferences = JSON.stringify(validarPreferencias(estado));
    try {
      localStorage.setItem("escape-code-interface", lastPreferences);
    } catch {}
  }
  const skip = document.createElement("button");
  skip.id = "pularCutscene";
  skip.hidden = true;
  skip.innerHTML = "Pular cena <kbd>Enter</kbd>";
  skip.onclick = pular;
  document.body.append(skip);
  document.addEventListener("keydown", (event) => {
    if (
      !["ArrowUp", "ArrowDown"].includes(event.key) ||
      event.target.matches("input,select,textarea")
    )
      return;
    const root =
      document.querySelector("dialog[open]") ||
      (estado.mode === "menu" ? menu : null);
    if (!root) return;
    const buttons = [...root.querySelectorAll("button:not([disabled])")].filter(
      (b) => b.getClientRects().length,
    );
    if (!buttons.length) return;
    event.preventDefault();
    const index = buttons.indexOf(document.activeElement),
      step = event.key === "ArrowDown" ? 1 : -1;
    buttons[(index + step + buttons.length) % buttons.length].focus();
  });
  let lastSubtitle = "";
  apply();
  trocarMusica(estado.radioFaixa);
  return {
    update() {
      if (JSON.stringify(validarPreferencias(estado)) !== lastPreferences)
        apply();
      skip.hidden =
        !duracaoCutscene(estado) || !!document.querySelector("dialog[open]");
      document.body.classList.toggle("sem-minimapa", !estado.minimapa);
      const sub = document.getElementById("subtitle"),
        text = sub.textContent;
      if (text !== lastSubtitle) {
        lastSubtitle = text;
        const match = text.match(/^([A-ZÁÉÍÓÚÃÕÇ0-9 ·_-]{2,40}):\s*([\s\S]+)$/);
        if (match) {
          const speaker = document.createElement("b"),
            words = document.createElement("span");
          speaker.textContent = match[1] + ": ";
          words.textContent = match[2];
          sub.replaceChildren(speaker, words);
        }
      }
    },
  };
}
