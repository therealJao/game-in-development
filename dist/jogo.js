import { montarInterface2026 } from "./interface-2026.js";
import { FAIXAS_RADIO, indiceRadio } from "./radio-menu.js";
import { solicitarPulo } from "./cutscenes.js";
let interface2026;
import {
  ETAPAS_FINAL,
  criarEstadoFinal,
  acaoTelefoneFinal,
  objetivoFinal,
} from "./regras-final.js";
import { atualizarMidiaFinal } from "./capitulo-final.js";
import {
  ETAPAS_ARCOPLEX,
  ETAPAS_ARCOPLEX_JOGAVEIS,
  PRODUTOS_MERCADO,
  LISTAS_COMPRAS,
  criarEstadoArcoplex,
  iniciarPosicaoArcoplex,
  interagirArcoplex,
  interacaoArcoplex,
} from "./regras-arcoplex.js";
import {
  FALAS_ARCOPLEX,
  falaArcoplex,
  sonsArcoplex,
} from "./falas-arcoplex.js";
import { ETAPAS_LUA, FALAS_LUA, falaLua, sonsLua } from "./regras-lua.js";
import { acaoVolei, criarVolei } from "./regras-volei.js";
import { atualizarCelularPix } from "./alisabank-ui.js";
import { acaoPix } from "./regras-alisabank.js";
import {
  TEMPOS_PONTO_KENTE,
  pertoBalcaoPontoKente,
} from "./regras-ponto-kente.js";
import {
  obterDesafioNovaFase,
  limitarPassoProgramacao,
  responderDesafioNovaFase,
} from "./desafios-novas-fases.js";
import {
  criarBatalhaRitmo,
  acertarTrilha,
  desenharPistaRitmo,
  DURACAO_LOOP_FUNK,
} from "./batalha-ritmo.js";
import {
  criarEstadoAero,
  atualizarAero,
  chutarBolaAero,
} from "./regras-frutiger-aero.js";
import {
  criarEstadoCastelo,
  atualizarCastelo,
  interagirCastelo,
  DESAFIOS_CASTELO,
  TEMPOS_TERRACO,
  ROTA_ESCADARIA,
} from "./regras-castelo.js";
import { ControlesGamepad } from "./controles-gamepad.js";
import {
  dadosMinimapa,
  desenharMinimapa,
  desenharMapaSala,
} from "./minimapa.js";
import {
  criarEstadoAlisanave,
  avancarEtapaPorto,
  atualizarRegrasPorto,
  interagirPorto,
  DESAFIOS_PORTO,
} from "./regras-alisanave.js";
import { CONFIGURACAO } from "./configuracao.js";
// REGRAS E PROGRESSÃO — nomes e ajustes básicos estão em configuracao.js.
import { NOMES } from "./configuracao.js";
import { criarColetaveis } from "./coletaveis.js";
import { CenaDoJogo } from "./cena-do-jogo.js";
import { Som } from "./som.js";
import {
  TAMANHO_CELULA,
  FASES,
  REGRAS,
  criarFase,
  calcularDistancias,
  podeCaminhar,
  calcularDistancia,
  perseguirJogador,
  temVisaoDireta,
  calcularArduinos,
} from "./mapas.js";
import {
  DESAFIOS_TERMINAIS,
  obterDesafioTerminal,
  obterDesafioRecuperacao,
  validarResposta,
} from "./desafios.js";
import { DURACAO_CENA_BRITA, momentoDaCenaBrita } from "./sala-de-aula.js";
const elemento = (id) => document.getElementById(id),
  teclasPressionadas = new Set(),
  audio = new Som();
let cenaDoJogo,
  tempoQuadroAnterior = 0,
  avisoAte = 0,
  legendaAte = 0,
  tempoPassos = 0,
  tempoBatimento = 0,
  tempoCachorro = 0,
  tempoRecalculoRota = 0,
  distanciasCorredores = null,
  arrastoMouse = null,
  modoAntesDoMapa = null;
let melhorPontuacao = 0;
try {
  melhorPontuacao = Number(localStorage.getItem("escape-code-3d-record")) || 0;
} catch {}
const estado = {
  mode: "loading", // Estado atual: menu, casa, cena, desafio ou perseguição.
  previousMode: "playing",
  chapter: 0,
  level: criarFase(0),
  player: {
    x: 4.5,
    z: 4.5,
    yaw: 0,
    pitch: 0,
  }, // Posição e direção de Axel; x/z são coordenadas do mapa.
  stamina: CONFIGURACAO.folegoMaximo, // Fôlego em segundos. O máximo fica em configuracao.js.
  score: 0, // Pontuação acumulada nesta partida.
  totalTerminals: 0, // Total de terminais resolvidos nas três fases.
  moving: false,
  sprinting: false,
  flash: 0,
  whip: 0,
  blackout: false,
  terror: 0,
  cooldown: 0,
  elapsed: 0,
  enemyDormant: true,
  throwing: false,
  throwProgress: 0,
  throwFrom: null,
  throwTo: null,
  throwDone: false,
  fallTime: 0,
  fallY: 0,
  homeQuest: "play",
  tvTime: 0,
  tvX: 0,
  autoUsed: false,
  recoveryCount: 0,
  challenge: null,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches, // Desativa movimentos fortes de câmera e zoom do jumpscare.
  walkablePug: (x, z) => podeCaminhar(estado.level.map, x, z, 0.2), // Impede o cachorro de atravessar as paredes.
};
let tempoJogo = 0,
  musicaMenu = null;
estado.shiftToggle = true;
estado.runLocked = false;
estado.volume = 0.6;
estado.musicVolume = 0.35;
estado.quality = "ultra";
estado.storyVariant = 0;
function sincronizarMusica() {
  if (!musicaMenu) return;
  musicaMenu.volume = estado.volume * estado.musicVolume;
  musicaMenu.muted = !audio.enabled;
  if (
    estado.mode === "menu" &&
    estado.radioLigada !== false &&
    audio.enabled &&
    estado.volume > 0 &&
    estado.musicVolume > 0
  ) {
    musicaMenu
      .play()
      .then(() => {
        elemento("musicStatus").textContent = "MÚSICA LIGADA";
      })
      .catch(() => {
        elemento("musicStatus").textContent = "ATIVAR MÚSICA";
      });
  } else {
    musicaMenu.pause();
    elemento("musicStatus").textContent = "MÚSICA PAUSADA";
  }
}
function selecionarMusicaMenu(index) {
  if (!musicaMenu) return;
  const faixa = indiceRadio(index);
  if (musicaMenu.faixa !== faixa) {
    musicaMenu.pause();
    musicaMenu.src = FAIXAS_RADIO[faixa].arquivo;
    musicaMenu.faixa = faixa;
    musicaMenu.load();
  }
  sincronizarMusica();
}
function salvarOpcoes() {
  try {
    localStorage.setItem(
      "escape-code-settings",
      JSON.stringify({
        volume: estado.volume,
        musicVolume: estado.musicVolume,
        quality: estado.quality,
        versaoGraficos: "realismo-1",
        shiftToggle: estado.shiftToggle,
        reduced: estado.reduced,
      }),
    );
  } catch {}
}
function carregarOpcoes() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("escape-code-settings") || "{}",
    );
    for (const key of ["volume", "musicVolume"])
      if (Number.isFinite(saved[key]))
        estado[key] = Math.max(0, Math.min(1, saved[key]));
    if (
      saved.versaoGraficos === "realismo-1" &&
      ["low", "medium", "high", "ultra"].includes(saved.quality)
    )
      estado.quality = saved.quality;
    for (const key of ["shiftToggle", "reduced"])
      if (typeof saved[key] === "boolean") estado[key] = saved[key];
  } catch {}
  audio.volume = estado.volume;
  musicaMenu = new Audio(FAIXAS_RADIO[0].arquivo);
  musicaMenu.loop = true;
  musicaMenu.preload = "auto";
  elemento("volume").value = estado.volume * 100;
  elemento("musicVolume").value = estado.musicVolume * 100;
  elemento("quality").value = estado.quality;
  elemento("shiftToggle").checked = estado.shiftToggle;
  cenaDoJogo.definirQualidade(estado.quality);
  elemento("motionStatus").textContent = estado.reduced ? "ON" : "OFF";
  elemento("settingsMotion").textContent = estado.reduced ? "ON" : "OFF";
}
function alternarCorrida() {
  estado.runLocked = !estado.runLocked;
  mostrarAviso(
    estado.runLocked
      ? "TRAVA SHIFT LIGADA — pressione Shift para caminhar."
      : "TRAVA SHIFT DESLIGADA.",
    1.7,
  );
}
function limparTeclas() {
  teclasPressionadas.clear();
  arrastoMouse = null;
  document.querySelectorAll(".held").forEach((b) => b.classList.remove("held"));
}
function fecharJanelas() {
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
}
function definirModo(mode) {
  estado.mode = mode;
  if (mode !== "aero") {
    if (cenaDoJogo?.aero?.arcoplex?.final)
      cenaDoJogo.aero.arcoplex.final.maos.visible = false;
    cenaDoJogo?.aero?.pontoKente?.video?.pause();
    cenaDoJogo?.aero?.arcoplex?.final?.casa.video.pause();
  }
  elemento("telefoneFinal").hidden = true;
  elemento("finalJogo").hidden = true;
  if (mode !== "playing") audio.pararSomColeta?.();
  if (!["playing", "alisanave", "castelo", "aero"].includes(mode))
    estado.runLocked = false;
  if (mode !== "alisanave") audio.pararYang?.();
  if (mode !== "castelo")
    for (const nome of ["briga-castelo", "davy-escada", "cj", "breier"])
      audio.pararArquivo?.(nome);
  if (mode !== "aero")
    for (const nome of [
      "aero-musica",
      "naverdachi",
      "bluezao-funk",
      "ponto-kente",
      "cozinha-briga",
      "lula-obrigado",
      "bruno-henrique",
      "pou-volei",

      "axel-pergunta",
      "nav-pergunta",
    ])
      audio.pararArquivo?.(nome);
  elemento("placarAero").hidden = true;
  elemento("batalhaRitmo").hidden = true;
  elemento("fimAero").hidden = true;
  elemento("hudVolei").hidden = true;
  elemento("voleiSprites").hidden = true;
  elemento("fimLua").hidden = true;
  elemento("hudArcoplex").hidden = true;
  elemento("olhoMagicoArc").hidden = true;
  elemento("transicaoArc").hidden = true;
  document.body.classList.remove("arcoplex-ativo");
  if (mode !== "menu") audio.pararArquivo?.("davy-menu");
  if (mode !== "aero")
    for (const nome of NOMES_AUDIO_LUA) audio.pararArquivo?.(nome);
  if (mode !== "aero")
    for (const nome of NOMES_AUDIO_ARC) audio.pararArquivo?.(nome);
  sincronizarMusica();
  elemento("maiconScare").hidden =
    mode !== "caught" || estado.reason !== "maicon";
  elemento("maiconScare").classList.toggle("reduced", estado.reduced);
  limparTeclas();
  if (mode !== "playing" && mode !== "home") document.exitPointerLock?.();
  elemento("menu").hidden = mode !== "menu";
  elemento("previaAero").hidden = true;
  elemento("hud").classList.toggle("aquatico", mode === "aero");
  elemento("hud").hidden = ["menu", "loading"].includes(mode);
}
function mostrarAviso(message, seconds = 4) {
  elemento("announcement").textContent = message;
  elemento("announcement").classList.add("show");
  avisoAte = performance.now() + seconds * 1000;
}
function pularCenaAtual() {
  if (!solicitarPulo(estado)) return;
  for (const a of Object.values(audio.arquivos || {})) if (!a.loop) a.pause();
  elemento("subtitle").classList.remove("show");
  elemento("black").style.opacity = 0;
  limparTeclas();
}
function mostrarLegenda(message, seconds = 4) {
  elemento("subtitle").textContent = message;
  elemento("subtitle").classList.add("show");
  legendaAte = performance.now() + seconds * 1000;
}
function salvarRecorde() {
  if (estado.score > melhorPontuacao) {
    melhorPontuacao = estado.score;
    try {
      localStorage.setItem("escape-code-3d-record", String(melhorPontuacao));
    } catch {}
  }
}
/* Prepara mapa, inimigos e coletáveis. Os exercícios vêm de desafios.js. */
function prepararFase(index, menu = false) {
  estado.chapter = index;
  estado.recoverySolved = false;
  estado.level = criarFase(index);
  estado.player = {
    ...estado.level.spawn,
    yaw: -Math.PI / 2,
    pitch: 0,
  };
  estado.stamina = CONFIGURACAO.folegoMaximo;
  estado.cooldown = 0;
  estado.flash = 0;
  estado.whip = 0;
  estado.terror = 0;
  estado.elapsed = 0;
  estado.enemyDormant = true;
  estado.throwing = false;
  estado.throwDone = false;
  estado.autoUsed = false;
  estado.level.collectibles = criarColetaveis(estado.level, index);
  tempoRecalculoRota = 0;
  distanciasCorredores = calcularDistancias(estado.level.map, estado.player);
  cenaDoJogo?.montarFase(estado.level, index);
  cenaDoJogo?.cachorro.group.rotation.set(0, 0, 0);
  revelarCorredores();
  definirModo(menu ? "menu" : "playing");
  atualizarInterface();
  if (!menu) {
    mostrarAviso(`CAPÍTULO 0${index + 1} / ${FASES[index].name}`, 5);
    mostrarLegenda(
      index === 0
        ? `${NOMES.protagonista.toUpperCase()}: O sofá… cadê o sofá?`
        : index === 1
          ? "MAICON: O controle está sempre nas minhas mãos."
          : `${NOMES.protagonista.toUpperCase()}: Pug, fica perto. É a última porta.`,
      5,
    );
  }
}
/* Reinicia a história e coloca Axel na sala de casa. */
function iniciarHistoria() {
  estado.agacharTeclado = estado.agacharControle = false;
  estado.chuteMenuAtivo = false;
  elemento("menu").classList.remove("saindo-para-historia");
  elemento("black").style.opacity = 0;
  audio.pararYang?.();
  estado.porto = null;
  fecharJanelas();
  audio.iniciar();
  estado.score = 0;
  estado.storyVariant = (estado.storyVariant + 1) % 2;
  estado.totalTerminals = 0;
  estado.recoveryCount = 0;
  estado.homeQuest = "play";
  estado.falouComBrita = false;
  estado.rescue = false;
  estado.britaLivre = false;
  estado.tvTime = 0;
  estado.tvX = 0;
  estado.fallTime = 0;
  estado.fallY = 0;
  estado.blackout = false;
  estado.player = {
    x: 0,
    z: -0.7,
    yaw: 0,
    pitch: 0,
  };
  estado.stamina = CONFIGURACAO.folegoMaximo;
  elemento("announcement").classList.remove("show");
  elemento("damage").style.opacity = 0;
  cenaDoJogo.reiniciarSala();
  definirModo("home");
  atualizarInterface();
  mostrarLegenda(
    `${NOMES.protagonista.toUpperCase()}: Mais uma partida. Só mais uma.`,
    4,
  );
}
function mostrarMenu() {
  estado.chuteMenuAtivo = false;
  elemento("menu").classList.remove("saindo-para-historia");
  fecharJanelas();
  elemento("black").style.opacity = 0;
  estado.blackout = false;
  prepararFase(0, true);
}
function pausarJogo() {
  if (
    ![
      "playing",
      "home",
      "tv",
      "classroom",
      "dungeon",
      "ride",
      "alisanave",
      "castelo",
      "aero",
    ].includes(estado.mode)
  )
    return;
  estado.previousMode = estado.mode;
  definirModo("paused");
  elemento("pause").showModal();
}
function continuarJogo() {
  if (estado.mode !== "paused") return;
  elemento("pause").close();
  definirModo(estado.previousMode);
}
function interagir() {
  if (estado.mode === "aero") {
    if (ETAPAS_ARCOPLEX.includes(estado.aero.etapa)) {
      if (interagirArcoplex(estado.aero))
        audio.tocarTom(950, 0.05, 0.05, "sine");
      atualizarInterfaceArcoplex(estado.aero);
      return;
    }
    if (estado.aero.etapa === "volei") {
      if (estado.aero.volei.terminado) {
        estado.aero.volei = criarVolei();
        return;
      }
      if (acaoVolei(estado.aero.volei)) audio.tocarTom(260, 0.05, 0.08, "sine");
      return;
    }
    if (estado.aero.etapa === "lanchoneteExplorar") {
      if (pertoBalcaoPontoKente(estado.aero)) {
        estado.aero.pedidoPendente = true;
        const d = obterDesafioNovaFase(estado.aero);
        if (d) abrirDesafioNovaFase(d);
      } else
        mostrarLegenda(
          "NAVERDACHI: O painel de pedidos está no balcão, ao fundo.",
          4,
        );
      return;
    }
    if (chutarBolaAero(estado.aero))
      audio.tocarTom(110, 0.08, 0.12, "sine", 45);
    return;
  }
  if (estado.mode === "castelo") {
    interagirNoCastelo();
    return;
  }
  if (estado.mode === "alisanave") {
    interagirAlisanave();
    return;
  }
  if (estado.mode === "dungeon") {
    interagirNoCalabouco();
    return;
  }
  if (estado.mode === "home") {
    if (
      estado.homeQuest === "play" &&
      Math.hypot(estado.player.x, estado.player.z + 3.7) < 4.8
    ) {
      definirModo("tv");
      estado.tvTime = 0;
      mostrarLegenda(
        `${NOMES.protagonista.toUpperCase()}: Em pé mesmo. Quem precisa de sofá?`,
        4,
      );
      atualizarInterface();
    } else if (
      estado.homeQuest === "sofa" &&
      Math.hypot(estado.player.x, estado.player.z - 2.3) < 1.8
    ) {
      definirModo("fall");
      estado.fallTime = 0;
      estado.fallY = 0;
      estado.player.x = 0;
      estado.player.z = 2.2;
      atualizarInterface();
      mostrarLegenda(
        `${NOMES.protagonista.toUpperCase()}: Tá. Agora eu vou sentar.`,
        2.5,
      );
      audio.tocarTom(90, 1, 0.08, "sine", 30);
    } else
      mostrarAviso(
        estado.homeQuest === "play"
          ? "Aproxime-se da TV para jogar com E."
          : `Vá até o sofá atrás de ${NOMES.protagonista} e pressione E.`,
      );
    return;
  }
  if (estado.mode === "tv") {
    if (estado.tvTime >= 5) {
      estado.homeQuest = "sofa";
      definirModo("home");
      estado.player.yaw = Math.PI;
      mostrarLegenda(
        `${NOMES.protagonista.toUpperCase()}: Pronto. Agora um descanso. Vem, Pug.`,
        4,
      );
      atualizarInterface();
    } else
      mostrarAviso("Jogue mais um pouco. Use ← e → para guiar o cavalo na TV.");
    return;
  }
  if (estado.mode !== "playing") return;
  const near = buscarInteracaoProxima();
  if (near?.type === "terminal") {
    if (near.criarTerminal.done)
      mostrarAviso("Circuito já ativo. O outro terminal ainda está esperando.");
    else abrirDesafio(near.index);
  } else if (near?.type === "exit") {
    if (estado.level.terminals.every((t) => t.done)) concluirFase();
    else
      mostrarAviso(
        "SAÍDA SEM ENERGIA — os dois terminais precisam estar ativos.",
      );
  } else
    mostrarAviso(
      "Procure os terminais de luz azul. Aproxime-se e pressione E.",
    );
}
function buscarInteracaoProxima() {
  let result = null,
    minimum = 3;
  estado.level.terminals.forEach((t, index) => {
    const d = calcularDistancia(estado.player, t);
    if (d < minimum) {
      minimum = d;
      result = {
        type: "terminal",
        criarTerminal: t,
        index,
      };
    }
  });
  if (calcularDistancia(estado.player, estado.level.exit) < minimum)
    result = {
      type: "exit",
    };
  return result;
}
/* Abre o terminal e pausa a perseguição enquanto o aluno responde. */
function abrirDesafio(index = null) {
  if (estado.mode !== "playing") return;
  if (index === null && estado.recoverySolved) {
    mostrarAviso(
      "Recuperação já aprendida. Pare de se mover para recuperar fôlego, sem repetir desafios.",
      4,
    );
    return;
  }
  if (index === null && estado.stamina > 32) {
    mostrarAviso(
      "Ainda há fôlego. A recuperação fica disponível a partir de 32 s.",
    );
    return;
  }
  const data =
    index === null
      ? obterDesafioRecuperacao(estado.chapter, estado.recoveryCount)
      : obterDesafioTerminal(estado.chapter, index, estado.storyVariant);
  estado.challenge = {
    data,
    index,
    attempts: 0,
    hinted: false,
    solved: false,
  };
  definirModo("editor");
  elemento("challengeTag").textContent =
    index === null
      ? "PROTOCOLO DE RESPIRAÇÃO"
      : `CAPÍTULO 0${estado.chapter + 1} / TERMINAL 0${index + 1}`;
  elemento("challengeTitle").textContent = data.title;
  elemento("challengeDescription").textContent = data.description;
  elemento("codeBefore").textContent = data.before;
  elemento("codeAfter").textContent = data.after;
  elemento("codeInput").value = "";
  elemento("codeInput").disabled = false;
  elemento("hintButton").disabled = false;
  elemento("hintText").textContent = "";
  elemento("feedback").className = "";
  elemento("feedback").textContent =
    "// Complete a expressão. O código será testado com valores diferentes.";
  elemento("runCode").innerHTML = "EXECUTAR <span>↵</span>";
  elemento("editor").showModal();
  elemento("codeInput").focus();
  elemento("codeFilename").textContent =
    data.language === "HTML" ? "pagina.html" : "estilo.css";
  elemento("codeLanguage").textContent = data.language;
  elemento("feedback").textContent =
    "// Toque em uma opção ou digite a resposta.";
  elemento("choices").replaceChildren();
  for (const choice of data.choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-choice";
    button.textContent = choice;
    button.addEventListener("click", () => {
      if (!estado.challenge?.solved) {
        elemento("codeInput").value = choice;
        elemento("codeInput").focus();
      }
    });
    elemento("choices").append(button);
  }
}
function fecharDesafio() {
  if (estado.mode !== "editor") return;
  if (estado.stamina <= 10) estado.autoUsed = true;
  elemento("editor").close();
  estado.challenge = null;
  definirModo("playing");
  atualizarInterface();
}
function mostrarDica(automatic = false) {
  const c = estado.challenge;
  if (!c || c.solved) return;
  c.hinted = true;
  elemento("hintText").textContent =
    c.data.mostrarDica +
    (automatic ? ` Exemplo: ${c.data.solution}. ${c.data.explanation}` : "");
  elemento("hintButton").disabled = true;
}
/* Valida a resposta e concede fôlego; não executa código arbitrário. */
function enviarResposta(event) {
  event.preventDefault();
  const c = estado.challenge;
  if (!c) return;
  if (c.solved) {
    fecharDesafio();
    return;
  }
  let result;
  try {
    result = validarResposta(c.data, elemento("codeInput").value);
  } catch (error) {
    result = {
      ok: false,
      message: error.message,
    };
  }
  if (!result.ok) {
    c.attempts++;
    elemento("feedback").className = "error";
    elemento("feedback").textContent = `Ainda não. ${result.message}`;
    if (c.attempts >= 3) mostrarDica(true);
    audio.tocarTom(135, 0.12, 0.06, "triangle");
    return;
  }
  c.solved = true;
  const points = Math.round(
    Math.max(0, [100, 70, 40][Math.min(c.attempts, 2)] - (c.hinted ? 20 : 0)) *
      (c.index === null ? 0.6 : 1),
  );
  estado.score += points;
  estado.stamina = CONFIGURACAO.folegoMaximo;
  estado.autoUsed = false;
  estado.level.enemy.stun = 2.5;
  if (estado.level.maicon.active) estado.level.maicon.stun = 2.5;
  if (c.index === null) {
    estado.recoveryCount++;
    estado.recoverySolved = true;
  } else {
    estado.level.terminals[c.index].done = true;
    estado.totalTerminals++;
  }
  audio.tocarAcerto();
  elemento("feedback").className = "success";
  elemento("feedback").textContent =
    `✓ ${result.message}\n+${points} pontos. Fôlego restaurado: ${CONFIGURACAO.folegoMaximo} s.`;
  elemento("codeInput").disabled = true;
  elemento("hintButton").disabled = true;
  elemento("runCode").innerHTML = "VOLTAR À FUGA <span>→</span>";
  atualizarInterface();
}
function usarControle() {
  if (estado.mode !== "playing") return;
  if (estado.cooldown > 0) {
    mostrarAviso(
      `Controle recarregando: ${estado.cooldown.toFixed(1)} s.`,
      1.6,
    );
    return;
  }
  estado.cooldown = 3;
  estado.flash = 0.35;
  audio.tocarRuido(0.3, 0.28, 2600);
  audio.tocarTom(540, 0.3, 0.09, "sawtooth", 80);
  let hit = false;
  for (const enemy of [
    estado.level.enemy,
    ...(estado.level.maicon.active ? [estado.level.maicon] : []),
  ])
    if (
      calcularDistancia(enemy, estado.player) < 6 &&
      temVisaoDireta(estado.level.map, enemy, estado.player)
    ) {
      enemy.stun = 5;
      hit = true;
    }
  mostrarAviso(
    hit
      ? "DESCARGA — corra enquanto eles estão atordoados."
      : "Nenhuma ameaça no alcance. O controle precisa recarregar.",
    2.2,
  );
}
function abrirMapa() {
  if (estado.mode !== "playing") return;
  modoAntesDoMapa = estado.mode;
  definirModo("map");
  desenharMapa();
  elemento("map").showModal();
}
function fecharMapa() {
  if (estado.mode !== "map") return;
  elemento("map").close();
  definirModo(modoAntesDoMapa || "playing");
}
function revelarCorredores() {
  const map = estado.level.map,
    x = Math.floor(estado.player.x / TAMANHO_CELULA),
    z = Math.floor(estado.player.z / TAMANHO_CELULA);
  for (let dz = -3; dz <= 3; dz++)
    for (let dx = -3; dx <= 3; dx++) {
      const nx = x + dx,
        nz = z + dz;
      if (
        map[nz]?.[nx] !== undefined &&
        Math.hypot(dx, dz) <= 3.2 &&
        temVisaoDireta(map, estado.player, {
          x: (nx + 0.5) * TAMANHO_CELULA,
          z: (nz + 0.5) * TAMANHO_CELULA,
        })
      )
        estado.level.visited.add(`${nx},${nz}`);
    }
}
function desenharMapa() {
  const dados = dadosMinimapa(estado);
  if (dados) desenharMinimapa(elemento("mapCanvas"), dados);
}
let ultimoQuadroMapa = 0;
function atualizarMinimapaFixo(agora) {
  const modo = estado.mode === "paused" ? estado.previousMode : estado.mode;
  const dados = dadosMinimapa(estado);
  if (
    modo === "aero" &&
    [
      "praiaChegada",
      "volei",
      "voleiVitoria",
      "fimAero",
      ...ETAPAS_LUA,
      ...ETAPAS_ARCOPLEX,
    ].includes(estado.aero?.etapa)
  ) {
    elemento("minimapaFixo").hidden = true;
    return;
  }
  const sala =
    ["home", "tv", "dungeon", "castelo", "aero"].includes(modo) ||
    (modo === "alisanave" && estado.porto?.etapa === "sala");
  elemento("minimapaFixo").hidden = !dados && !sala;
  if ((!dados && !sala) || agora - ultimoQuadroMapa < 120) return;
  ultimoQuadroMapa = agora;
  if (dados) {
    desenharMinimapa(elemento("minimapaCanvas"), dados, agora);
    const feitos = dados.terminais.filter((t) => t.feito).length;
    elemento("tituloMinimapa").textContent =
      feitos +
      "/" +
      dados.terminais.length +
      " TERMINAIS · " +
      (feitos === dados.terminais.length
        ? "SAÍDA LIBERADA"
        : "SIGA A ROTA ROXA");
  } else {
    desenharMapaSala(elemento("minimapaCanvas"), estado);
    elemento("tituloMinimapa").textContent =
      modo === "aero"
        ? [
            "lanchonete",
            "lanchoneteExplorar",
            "lanchoneteFinal",
            "fimAero",
          ].includes(estado.aero?.etapa)
          ? "PONTO KENTE · SALÃO E PEDIDOS"
          : "ARENA AQUÁTICA · CAMPO"
        : modo === "castelo"
          ? "CASTELO · ESCADARIA E PORTAL"
          : modo === "dungeon"
            ? "CALABOUÇO"
            : modo === "alisanave"
              ? "SALA ALISANAVE"
              : "QUARTO DE AXEL";
  }
}
function arremessarMaicon() {
  estado.throwDone = true;
  estado.throwing = true;
  estado.throwProgress = 0;
  estado.throwFrom = {
    x: estado.level.enemy.x,
    z: estado.level.enemy.z,
  };
  const candidates = estado.level.cells.filter(
    (p) =>
      calcularDistancia(p, estado.player) > 5 &&
      calcularDistancia(p, estado.player) < 9 &&
      temVisaoDireta(estado.level.map, estado.player, p),
  );
  const ahead = {
    x: estado.player.x - Math.sin(estado.player.yaw) * 6,
    z: estado.player.z - Math.cos(estado.player.yaw) * 6,
  };
  candidates.sort(
    (a, b) => calcularDistancia(a, ahead) - calcularDistancia(b, ahead),
  );
  estado.throwTo = candidates[0] || {
    x: estado.player.x,
    z: estado.player.z,
  };
  mostrarAviso("O SENAI ARREMESSOU MAICON.", 4);
  mostrarLegenda("MAICON: O controle está nas minhas mãos!", 3.5);
  audio.tocarAmeaca();
}
function capturarJogador(reason) {
  if (estado.mode !== "playing") return;
  estado.reason = reason;
  estado.catchTime = 0;
  salvarRecorde();
  definirModo("caught");
  audio.tocarImpacto();
  elemento("damage").style.opacity = 1;
}
function concluirFase() {
  estado.score += 200;
  if (estado.chapter === 2) {
    estado.score += 300;
    salvarRecorde();
    iniciarAlisanave();
    return;
  }
  salvarRecorde();
  definirModo("transition");
  elemento("resultTag").textContent =
    `CAPÍTULO 0${estado.chapter + 1} CONCLUÍDO`;
  elemento("resultTitle").textContent =
    estado.chapter === 0 ? "Ele também atravessou." : "O último circuito.";
  elemento("resultText").textContent =
    estado.chapter === 0
      ? "O primeiro bloqueio caiu. O SENAI e Maicon não ficaram para trás. O setor seguinte é maior e a perseguição será mais rápida."
      : "Só resta um setor. O Pug farejou uma passagem, mas os circuitos estão presos em um laço.";
  elemento("resultScore").textContent = String(estado.score).padStart(5, "0");
  elemento("resultButton").dataset.action = "next";
  elemento("resultButton").innerHTML = "CONTINUAR <span>→</span>";
  elemento("result").showModal();
  audio.tocarAcerto();
}
function mostrarResultado(kind) {
  definirModo("result");
  elemento("damage").style.opacity = 0;
  elemento("resultTag").textContent =
    kind === "victory" ? "VOCÊS VOLTARAM" : "SINAL PERDIDO";
  elemento("resultTitle").textContent =
    kind === "victory"
      ? "Duas rodas. Uma saída."
      : estado.reason === "stamina"
        ? "O fôlego acabou."
        : estado.reason === "maicon"
          ? "Maicon te encontrou."
          : "Ele te alcançou.";
  elemento("resultText").textContent =
    kind === "victory"
      ? `${NOMES.amigo} recuperou a Biz e fugiu com ${NOMES.protagonista} na garupa e ${NOMES.cachorro} junto. Os seis terminais de HTML/CSS abriram as Backrooms e permitiram o resgate.`
      : "A próxima tentativa começa em casa, com zero pontos. Economize corrida, resolva HTML/CSS para recuperar fôlego e use o controle antes do contato.";
  elemento("resultScore").textContent = String(estado.score).padStart(5, "0");
  elemento("resultButton").dataset.action = "new";
  elemento("resultButton").innerHTML = "REINICIAR HISTÓRIA <span>↗</span>";
  elemento("result").showModal();
}
function iniciarCenaBrita() {
  estado.tempoCenaBrita = 0;
  estado.ultimoMomentoBrita = "";
  elemento("black").style.opacity = 0;
  elemento("announcement").classList.remove("show");
  definirModo("classroom");
  elemento("chapterName").textContent =
    `CENA PARALELA / ${NOMES.amigo.toUpperCase()}`;
  elemento("objectiveType").textContent = "SALA 204 · ENQUANTO ISSO";
  elemento("objective").textContent = "Um intervalo que não terminou.";
  elemento("objectiveDetail").textContent = "CENA EM 3D · E PARA PULAR";
  elemento("prompt").hidden = true;
  elemento("wanted").hidden = true;
  elemento("stamina").hidden = true;
  elemento("mapButton").hidden = true;
  elemento("crosshair").hidden = true;
  mostrarLegenda(`${NOMES.amigo.toUpperCase()}: Só mais um pedaço de bolo…`, 3);
}
function atualizarCenaBrita(dt) {
  estado.tempoCenaBrita += dt;
  const beat = momentoDaCenaBrita(estado.tempoCenaBrita);
  if (beat !== estado.ultimoMomentoBrita) {
    estado.ultimoMomentoBrita = beat;
    if (beat === "teacher")
      mostrarLegenda(`Maicon se aproxima por trás de ${NOMES.amigo}.`, 2.5);
    if (beat === "surprise")
      mostrarLegenda(
        `MAICON: Vamos tirar esse capuz… PROFESSOR: ${NOMES.amigo}?!`,
        2,
      );
    if (beat === "punch") {
      audio.tocarImpacto();
      mostrarLegenda(`${NOMES.amigo.toUpperCase()}: AAAAAH!`, 2);
    }
    if (beat === "portal") {
      audio.tocarAmeaca();
      mostrarLegenda("A parede se abriu. Do outro lado… as Backrooms.", 4);
    }
    if (beat === "dimension")
      mostrarLegenda(
        `${NOMES.amigo} foi parar no calabouço. ${NOMES.protagonista} está caindo lá também.`,
        2.5,
      );
  }
  if (estado.tempoCenaBrita > 13.7)
    elemento("black").style.opacity = Math.min(
      1,
      (estado.tempoCenaBrita - 13.7) / 1.1,
    );
  if (estado.tempoCenaBrita >= DURACAO_CENA_BRITA) {
    elemento("black").style.opacity = 0;
    entrarNoCalabouco(false);
    audio.tocarAmeaca();
  }
}
/* Controla a primeira visita e o retorno para resgatar Brita. */
function entrarNoCalabouco(rescue = false) {
  fecharJanelas();
  estado.rescue = rescue;
  estado.britaLivre = false;
  estado.dungeonTime = 0;
  estado.player = {
    x: 0,
    z: 2,
    yaw: 0,
    pitch: 0,
  };
  definirModo("dungeon");
  elemento("black").style.opacity = 0;
  elemento("damage").style.opacity = 0;
  for (const id of ["wanted", "stamina", "mapButton", "crosshair"])
    elemento(id).hidden = true;
  elemento("characterCaption").textContent =
    `${NOMES.cachorro.toUpperCase()} ESTÁ COM VOCÊ. ${NOMES.amigo.toUpperCase()} PRECISA DE AJUDA.`;
  elemento("score").textContent = String(estado.score).padStart(5, "0");
  elemento("chapterName").textContent = rescue
    ? "O RESGATE / CALABOUÇO"
    : "A QUEDA / CALABOUÇO";
  elemento("objectiveType").textContent = rescue
    ? "AS BACKROOMS FICARAM PARA TRÁS"
    : `${NOMES.amigo.toUpperCase()} ESTÁ PRESO`;
  elemento("objective").textContent = rescue
    ? `Liberte ${NOMES.amigo} da cadeira.`
    : `Encontre ${NOMES.amigo} no Arduino.`;
  elemento("objectiveDetail").textContent = "WASD move · ← → gira · E interage";
  elemento("prompt").hidden = false;
  elemento("prompt").querySelector("span").textContent =
    `APROXIME-SE DE ${NOMES.amigo.toUpperCase()}`;
  mostrarLegenda(
    rescue
      ? `${NOMES.protagonista.toUpperCase()}: Voltei. Vamos recuperar sua Biz.`
      : `${NOMES.amigo.toUpperCase()}: Me ajuda a recuperar a minha Biz!`,
    7,
  );
}
function interagirNoCalabouco() {
  const p = estado.player;
  if (Math.hypot(p.x, p.z + 3) < 2.4) {
    if (estado.rescue) {
      estado.britaLivre = true;
      elemento("objective").textContent = "Recupere a Biz preta.";
      mostrarLegenda(
        `${NOMES.amigo.toUpperCase()}: Livre! A Biz está ali, à esquerda. Você vai na garupa.`,
        5,
      );
    } else {
      estado.falouComBrita = true;
      elemento("objective").textContent = "Atravesse a porta das Backrooms.";
      mostrarLegenda(
        `${NOMES.amigo.toUpperCase()}: Me ajuda a recuperar a minha Biz! Primeiro escape das Backrooms para destravar minha prisão.`,
        7,
      );
    }
    return;
  }
  if (
    !estado.rescue &&
    estado.falouComBrita &&
    Math.hypot(p.x, p.z - 8) < 2.5
  ) {
    prepararFase(0);
    mostrarLegenda(
      `${NOMES.protagonista.toUpperCase()}: Aguenta aí, ${NOMES.amigo}. Eu volto com a saída aberta.`,
      5,
    );
    return;
  }
  if (
    estado.rescue &&
    estado.britaLivre &&
    Math.hypot(p.x + 4, p.z + 6) < 2.5
  ) {
    estado.dungeonTime = 0;
    definirModo("ride");
    elemento("prompt").hidden = true;
    elemento("objective").textContent =
      `${NOMES.amigo} pilota. ${NOMES.protagonista} vai na garupa.`;
    mostrarLegenda(
      `${NOMES.amigo.toUpperCase()}: Segura firme! ${NOMES.protagonista.toUpperCase()}: E leva o ${NOMES.cachorro}!`,
      6,
    );
    return;
  }
  mostrarAviso("Aproxime-se do objetivo e pressione E.");
}
function atualizarCalabouco(dt) {
  estado.dungeonTime += dt;
  const p = estado.player;
  if (teclasPressionadas.has("ArrowLeft") || teclasPressionadas.has("q"))
    p.yaw += dt * 1.85;
  if (teclasPressionadas.has("ArrowRight")) p.yaw -= dt * 1.85;
  const f =
      (teclasPressionadas.has("w") ? 1 : 0) -
      (teclasPressionadas.has("s") ? 1 : 0) -
      (teclasPressionadas.controle?.y || 0),
    s =
      (teclasPressionadas.has("d") ? 1 : 0) -
      (teclasPressionadas.has("a") ? 1 : 0) +
      (teclasPressionadas.controle?.x || 0),
    n = Math.hypot(f, s);
  estado.moving = n > 0;
  if (n) {
    const dx =
        ((-Math.sin(p.yaw) * f + Math.cos(p.yaw) * s) * dt * 2.8) /
        Math.max(1, n),
      dz =
        ((-Math.cos(p.yaw) * f - Math.sin(p.yaw) * s) * dt * 2.8) /
        Math.max(1, n),
      nx = p.x + dx,
      nz = p.z + dz;
    if (
      Math.abs(nx) < 7.8 &&
      nz > -10.5 &&
      nz < 10.5 &&
      !(Math.abs(nx) < 1.75 && nz > -4.3 && nz < -1.75)
    ) {
      p.x = nx;
      p.z = nz;
    }
  }
  elemento("prompt").querySelector("span").textContent = estado.rescue
    ? estado.britaLivre
      ? "RECUPERAR BIZ"
      : `LIBERTAR ${NOMES.amigo.toUpperCase()}`
    : estado.falouComBrita
      ? "ENTRAR NAS BACKROOMS"
      : `FALAR COM ${NOMES.amigo.toUpperCase()}`;
}
function moverJogador(dt, home = false) {
  const p = estado.player;
  if (teclasPressionadas.has("ArrowLeft") || teclasPressionadas.has("q"))
    p.yaw += dt * 1.85;
  if (teclasPressionadas.has("ArrowRight")) p.yaw -= dt * 1.85;
  let f =
      (teclasPressionadas.has("w") || teclasPressionadas.has("ArrowUp")
        ? 1
        : 0) -
      (teclasPressionadas.has("s") || teclasPressionadas.has("ArrowDown")
        ? 1
        : 0) -
      (teclasPressionadas.controle?.y || 0),
    s =
      (teclasPressionadas.has("d") ? 1 : 0) -
      (teclasPressionadas.has("a") ? 1 : 0) +
      (teclasPressionadas.controle?.x || 0),
    n = Math.hypot(f, s);
  estado.moving = false;
  estado.sprinting =
    !estado.agachado &&
    ((estado.shiftToggle
      ? estado.runLocked
      : teclasPressionadas.has("Shift")) ||
      (Boolean(teclasPressionadas.controle?.conectado) && estado.runLocked)) &&
    n > 0 &&
    !home;
  if (n) {
    f /= Math.max(1, n);
    s /= Math.max(1, n);
    const speed =
        (home ? 2.15 : estado.sprinting ? REGRAS.sprint : REGRAS.walk) *
        (estado.agachado ? 0.46 : 1) *
        dt,
      dx = (-Math.sin(p.yaw) * f + Math.cos(p.yaw) * s) * speed,
      dz = (-Math.cos(p.yaw) * f - Math.sin(p.yaw) * s) * speed;
    if (home) {
      const nx = p.x + dx,
        nz = p.z + dz;
      if (
        Math.abs(nx) < 4.45 &&
        Math.abs(nz) < 3.8 &&
        !(nz > 1.65 && nz < 3.15 && Math.abs(nx) < 1.8)
      ) {
        p.x = nx;
        p.z = nz;
        estado.moving = true;
      }
    } else {
      if (podeCaminhar(estado.level.map, p.x + dx, p.z)) {
        p.x += dx;
        estado.moving = true;
      }
      if (podeCaminhar(estado.level.map, p.x, p.z + dz)) {
        p.z += dz;
        estado.moving = true;
      }
    }
  }
  if (estado.moving) {
    tempoPassos -= dt;
    if (tempoPassos <= 0) {
      tempoPassos = estado.sprinting ? 0.27 : 0.44;
      audio.tocarPasso(estado.sprinting);
    }
  }
}
/* Atualiza a simulação a cada quadro. Pausa e terminais interrompem a perseguição. */
function atualizarJogo(dt) {
  estado.agachado =
    teclasPressionadas.has("Control") ||
    Boolean(teclasPressionadas.controle?.agachado);
  elemento("furtividade").hidden =
    estado.mode !== "castelo" || estado.castelo?.etapa !== "salao";
  audio.pararArquivo?.("davy-menu");
  audio.atualizarArquivos?.();
  if (estado.mode === "aero") {
    atualizarJogoAero(dt);
    return;
  }
  if (estado.mode === "castelo") {
    atualizarJogoCastelo(dt);
    return;
  }
  if (estado.mode === "menu" && estado.chuteMenuAtivo) {
    estado.tempoChuteMenu += dt;
    if (estado.tempoChuteMenu >= 0.95 && !estado.somChuteMenu) {
      estado.somChuteMenu = true;
      audio.tocarImpacto();
      audio.tocarTom(160, 0.16, 0.12, "triangle", 55);
      audio.tocarTom(700, 0.6, 0.07, "sine", 110); // Assobio de desenho animado durante o voo.
    }
    elemento("black").style.opacity = Math.max(
      0,
      (estado.tempoChuteMenu - 3.2) / 0.6,
    );
    if (estado.tempoChuteMenu >= 3.8) iniciarHistoria();
    return;
  }
  if (estado.mode === "alisanave") {
    atualizarAlisanave(dt);
    return;
  }
  if (estado.mode === "home") {
    moverJogador(dt, true);
    atualizarInterface();
    return;
  }
  if (estado.mode === "tv") {
    estado.tvTime += dt;
    estado.tvX = Math.max(
      -2.5,
      Math.min(
        2.5,
        estado.tvX +
          ((teclasPressionadas.has("ArrowRight") || teclasPressionadas.has("d")
            ? 1
            : 0) -
            (teclasPressionadas.has("ArrowLeft") || teclasPressionadas.has("a")
              ? 1
              : 0)) *
            dt *
            2.3,
      ),
    );
    atualizarInterface();
    if (estado.tvTime > 7) {
      estado.homeQuest = "sofa";
      definirModo("home");
      estado.player.yaw = Math.PI;
      mostrarLegenda(
        `${NOMES.protagonista.toUpperCase()}: Agora sim. Vou sentar um pouco.`,
        4,
      );
      audio.tocarLatido();
    }
    return;
  }
  if (estado.mode === "fall") {
    estado.fallTime += dt;
    const t = estado.fallTime;
    estado.fallY =
      t < 1.8
        ? 0.45 * Math.min(t / 0.9, 1)
        : Math.max(-19, 0.45 - (t - 1.8) ** 2 * 0.9);
    if (t > 1.6 && t < 1.6 + dt) {
      audio.tocarImpacto();
      mostrarLegenda(
        `${NOMES.protagonista.toUpperCase()}: ${NOMES.cachorro.toUpperCase()}?!`,
        2,
      );
    }
    if (t > 6.4) elemento("black").style.opacity = Math.min(1, (t - 6.4) / 0.8);
    if (t > 7.8) iniciarCenaBrita();
    return;
  }
  if (estado.mode === "classroom") {
    atualizarCenaBrita(dt);
    return;
  }
  if (estado.mode === "dungeon") {
    atualizarCalabouco(dt);
    return;
  }
  if (estado.mode === "ride") {
    estado.dungeonTime += dt;
    if (estado.dungeonTime > 12) mostrarResultado("victory");
    return;
  }
  if (estado.mode === "caught") {
    estado.catchTime += dt;
    if (estado.catchTime > 1.5) mostrarResultado("death");
    return;
  }
  if (estado.mode !== "playing") return;
  estado.elapsed += dt;
  tempoJogo += dt;
  moverJogador(dt);
  estado.flash = Math.max(0, estado.flash - dt);
  estado.whip = Math.max(0, estado.whip - dt);
  estado.cooldown = Math.max(0, estado.cooldown - dt);
  if (estado.recoverySolved && !estado.moving)
    estado.stamina = Math.min(
      CONFIGURACAO.folegoMaximo,
      estado.stamina + dt * 4,
    );
  estado.stamina = Math.max(
    0,
    estado.stamina +
      dt * (estado.moving ? (estado.sprinting ? -0.22 : 0.7) : 2.5),
  );
  const chapter = FASES[estado.chapter];
  estado.enemyDormant = estado.elapsed < chapter.spawnDelay;
  tempoRecalculoRota -= dt;
  if (tempoRecalculoRota <= 0) {
    tempoRecalculoRota = 0.25;
    distanciasCorredores = calcularDistancias(estado.level.map, estado.player);
    revelarCorredores();
  }
  const d = calcularDistancia(estado.player, estado.level.enemy),
    sight = temVisaoDireta(estado.level.map, estado.level.enemy, estado.player),
    charge = sight && d < 20 && Math.sin(estado.elapsed * 0.5) > 0;
  if (!estado.enemyDormant)
    perseguirJogador(
      estado.level.enemy,
      estado.player,
      estado.level.map,
      distanciasCorredores,
      dt,
      charge ? chapter.chargeSpeed : chapter.enemySpeed,
    );
  if (!estado.throwDone && estado.elapsed > chapter.spawnDelay + 3)
    arremessarMaicon();
  if (estado.throwing) {
    estado.throwProgress += dt / 1.6;
    if (estado.throwProgress >= 1) {
      estado.throwing = false;
      estado.level.maicon = {
        x: estado.throwTo.x,
        z: estado.throwTo.z,
        active: true,
        stun: 1,
        target: null,
        whipCooldown: 2,
      };
      audio.tocarImpacto();
      if (calcularDistancia(estado.level.maicon, estado.player) < 2)
        estado.stamina = Math.max(0, estado.stamina - 8);
    }
  }
  const m = estado.level.maicon;
  if (m.active) {
    m.whipCooldown = Math.max(0, m.whipCooldown - dt);
    perseguirJogador(
      m,
      estado.player,
      estado.level.map,
      distanciasCorredores,
      dt,
      1.8 + estado.chapter * 0.15,
    );
    if (
      m.stun <= 0 &&
      m.whipCooldown <= 0 &&
      calcularDistancia(m, estado.player) < 3.4 &&
      temVisaoDireta(estado.level.map, m, estado.player)
    ) {
      estado.stamina = Math.max(0, estado.stamina - 8);
      m.whipCooldown = 4;
      estado.whip = 0.7;
      audio.tocarRuido(0.3, 0.26, 1800);
      mostrarAviso("USB DE MAICON — −8 s de fôlego!", 2.5);
    }
  }
  if (d < 0.85 && estado.level.enemy.stun <= 0 && !estado.enemyDormant) {
    capturarJogador("senai");
    return;
  }
  if (
    m.active &&
    m.stun <= 0 &&
    calcularDistancia(m, estado.player) < 0.85 &&
    temVisaoDireta(estado.level.map, m, estado.player)
  ) {
    capturarJogador("maicon");
    return;
  }
  if (estado.stamina <= 0) {
    capturarJogador(estado.whip > 0 ? "maicon" : "stamina");
    return;
  }
  if (estado.stamina <= 10 && !estado.autoUsed && !estado.recoverySolved) {
    estado.autoUsed = true;
    abrirDesafio();
    return;
  }
  estado.terror = estado.enemyDormant
    ? 0
    : Math.max(0, Math.min(1, 1 - d / 35));
  estado.blackout =
    !estado.reduced &&
    estado.elapsed > 25 &&
    Math.floor(estado.elapsed / 19) % 3 === 1 &&
    estado.elapsed % 19 < 2;
  tempoBatimento -= dt;
  if (tempoBatimento <= 0 && estado.terror > 0.4) {
    audio.tocarBatimento();
    tempoBatimento = 1.5 - estado.terror * 0.8;
  }
  tempoCachorro -= dt;
  if (tempoCachorro <= 0 && d < 18) {
    audio.tocarLatido();
    tempoCachorro = 9;
  }
  elemento("damage").style.opacity = estado.reduced
    ? 0
    : Math.max(estado.whip * 0.7, estado.stamina < 12 ? 0.25 : 0);
  for (const logo of estado.level.collectibles || []) {
    if (
      !logo.used &&
      calcularDistancia(estado.player, logo) < 1.35 &&
      temVisaoDireta(estado.level.map, estado.player, logo)
    ) {
      logo.used = true;
      const gain = Math.min(10, CONFIGURACAO.folegoMaximo - estado.stamina);
      estado.stamina = Math.min(
        CONFIGURACAO.folegoMaximo,
        estado.stamina + CONFIGURACAO.ganhoPorLogo,
      );
      mostrarAviso(`GTA VI — +${gain.toFixed(1)} s de fôlego!`, 2);
      audio.tocarSomColeta?.();
      break;
    }
  }
  atualizarInterface();
}
/* Atualiza os textos da tela; não altera as regras do jogo. */
function atualizarInterface() {
  const home = ["home", "tv", "fall"].includes(estado.mode);
  elemento("wanted").hidden = home;
  elemento("stamina").hidden = home;
  elemento("mapButton").hidden = home;
  elemento("crosshair").hidden = home;
  elemento("chapterName").textContent = home
    ? "PRÓLOGO / UMA NOITE NORMAL"
    : `0${estado.chapter + 1} / ${FASES[estado.chapter].name}`;
  elemento("characterCaption").textContent = home
    ? "FANTA. COWBOY. AINDA EM CASA."
    : "O PUG ESTÁ COM VOCÊ.";
  if (home) {
    elemento("objectiveType").textContent =
      estado.mode === "fall" ? "FALHA NA REALIDADE" : "ANTES DA QUEDA";
    elemento("objective").textContent =
      estado.mode === "fall"
        ? "O chão deixou de existir."
        : estado.mode === "tv"
          ? "Jogue em pé."
          : estado.homeQuest === "play"
            ? "Jogue Red Dead Redemption 2 em pé."
            : "Sente-se no sofá.";
    elemento("objectiveDetail").textContent =
      estado.mode === "fall"
        ? `${NOMES.protagonista.toUpperCase()} E PUG / ATRAVESSANDO`
        : estado.mode === "tv"
          ? `← e → guiam o cavalo na TV. ${estado.tvTime >= 5 ? "E encerra a partida." : "Mais uma partida…"}`
          : estado.homeQuest === "play"
            ? `E para começar. WASD move ${NOMES.protagonista}.`
            : "Vá até o sofá. E para sentar.";
    elemento("prompt").hidden = estado.mode === "fall";
    elemento("prompt").querySelector("span").textContent =
      estado.mode === "tv"
        ? "ENCERRAR PARTIDA"
        : estado.homeQuest === "play"
          ? "JOGAR PS5 EM PÉ"
          : "SENTAR NO SOFÁ";
  } else {
    const done = estado.level.terminals.filter((t) => t.done).length;
    elemento("objectiveType").textContent =
      FASES[estado.chapter].mostrarLegenda;
    elemento("objective").textContent =
      done === 2
        ? "A saída tem energia. Encontre-a."
        : "Restaure os dois terminais.";
    elemento("objectiveDetail").textContent =
      `${done}/2 CIRCUITOS ATIVOS · SIGA A ROTA DO MINIMAPA`;
    const d = calcularDistancia(estado.player, estado.level.enemy),
      w = estado.enemyDormant ? 0 : calcularArduinos(d);
    elemento("enemyDistance").textContent = estado.enemyDormant
      ? "…"
      : `${Math.round(d)} m`;
    document
      .querySelectorAll(".board")
      .forEach((b, i) => b.classList.toggle("active", i < w));
    elemento("boards").setAttribute("aria-label", `${w} de 5 Arduinos`);
    elemento("wanted").classList.toggle("danger", w >= 4);
    const near = buscarInteracaoProxima();
    elemento("prompt").hidden = !near;
    elemento("prompt").querySelector("span").textContent =
      near?.type === "exit"
        ? done === 2
          ? "SAIR DO SETOR"
          : "SAÍDA BLOQUEADA"
        : near?.criarTerminal?.done
          ? "TERMINAL ATIVO"
          : "ACESSAR TERMINAL";
  }
  elemento("staminaNumber").innerHTML =
    `${estado.stamina.toFixed(1)} <small>/ ${CONFIGURACAO.folegoMaximo} s</small>`;
  elemento("staminaFill").style.width =
    `${(estado.stamina / CONFIGURACAO.folegoMaximo) * 100}%`;
  elemento("staminaFill").style.background =
    estado.stamina < 13 ? "#cf7d64" : "#dbc181";
  elemento("score").textContent = String(estado.score).padStart(5, "0");
}
function executarAcao(name) {
  if (estado.chuteMenuAtivo) return; // Cliques repetidos não reiniciam a animação.
  switch (name) {
    case "new":
      if (estado.mode === "menu") {
        audio.iniciar();
        estado.chuteMenuAtivo = true;
        estado.tempoChuteMenu = 0;
        estado.somChuteMenu = false;
        fecharJanelas();
        elemento("menu").classList.add("saindo-para-historia");
      } else iniciarHistoria();
      break;
    case "repetirLua":
      iniciarAero("britaChegada");
      break;
    case "menu":
      mostrarMenu();
      break;
    case "pause":
      pausarJogo();
      break;
    case "resume":
      continuarJogo();
      break;
    case "repetirRitmo":
      if (estado.aero) {
        estado.aero.etapa = "ritmo";
        estado.aero.tempo = 0;
        estado.aero.ritmo = criarBatalhaRitmo();
        audio.reiniciarArquivo?.("bluezao-funk");
        definirModo("aero");
      }
      break;
    case "testarFase":
      iniciarFaseTeste(elemento("faseTeste").value);
      break;
    case "castelo":
      iniciarCastelo();
      break;
    case "reiniciarCastelo":
      iniciarCastelo(true);
      break;
    case "alisanave":
      fecharJanelas();
      audio.iniciar();
      iniciarAlisanave();
      break;
    case "options":
      elemento("settings").showModal();
      break;
    case "music":
      audio.iniciar();
      estado.radioLigada = true;
      sincronizarMusica();
      break;
    case "help":
      elemento("help").showModal();
      break;
    case "credits":
      elemento("credits").showModal();
      break;
    case "reiniciarPorto":
      fecharJanelas();
      iniciarAlisanave(true);
      break;
    case "resgate":
      fecharJanelas();
      entrarNoCalabouco(true);
      break;
    case "next":
      elemento("result").close();
      prepararFase(estado.chapter + 1);
      break;
    case "interact":
      interagir();
      break;
    case "recovery":
      abrirDesafio();
      break;
    case "attack":
      usarControle();
      break;
    case "closeEditor":
      fecharDesafio();
      break;
    case "map":
      abrirMapa();
      break;
    case "closeCastelo":
      elemento("painelCastelo").close();
      definirModo("castelo");
      break;
    case "closeMap":
      fecharMapa();
      break;
    case "sound":
      audio.iniciar();
      audio.alternarSom();
      sincronizarMusica();
      document
        .querySelectorAll(".soundStatus")
        .forEach((e) => (e.textContent = audio.enabled ? "ON" : "OFF"));
      break;
    case "motion":
      estado.reduced = !estado.reduced;
      elemento("motionStatus").textContent = estado.reduced ? "ON" : "OFF";
      elemento("settingsMotion").textContent = estado.reduced ? "ON" : "OFF";
      salvarOpcoes();
      break;
  }
}
document.addEventListener("click", (event) => {
  const trilha = event.target.closest("[data-trilha]");
  if (trilha) tocarTrilhaBluezao(Number(trilha.dataset.trilha));
  const b = event.target.closest("[data-action]");
  if (b) executarAcao(b.dataset.action);
  const close = event.target.closest("[data-close]");
  if (close) close.closest("dialog").close();
});
elemento("codeForm").addEventListener("submit", enviarResposta);
elemento("hintButton").addEventListener("click", () => mostrarDica());
elemento("codeInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    elemento("codeForm").requestSubmit();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "F11" && window.chrome?.webview) {
    event.preventDefault();
    window.chrome.webview.postMessage({
      type: "fullscreen",
    });
    return;
  }
  if (estado.mode === "painelProgramacao") {
    if (["1", "2", "3"].includes(event.key)) {
      event.preventDefault();
      if (!event.repeat)
        elemento("opcoesProgramacao").children[Number(event.key) - 1]?.click();
    }
    if (event.key === "Escape") event.preventDefault();
    return;
  }
  if (event.target.matches("textarea,input,select")) return;
  if (
    event.key === "Enter" &&
    !event.repeat &&
    !document.querySelector("dialog[open]") &&
    !event.target.closest("button")
  ) {
    if (solicitarPulo(estado)) {
      event.preventDefault();
      pularCenaAtual();
      return;
    }
  }
  if (estado.mode === "map" && event.key.toLowerCase() === "m") {
    event.preventDefault();
    fecharMapa();
    return;
  }
  if (event.key === "Escape") {
    const topDialog = [...document.querySelectorAll("dialog[open]")].at(-1);
    if (topDialog && topDialog.id !== "pause" && topDialog.id !== "map") {
      if (
        topDialog.id === "settings" ||
        topDialog.id === "help" ||
        topDialog.id === "credits"
      ) {
        event.preventDefault();
        topDialog.close();
        return;
      }
    }
    if (
      [
        "playing",
        "home",
        "tv",
        "classroom",
        "dungeon",
        "ride",
        "alisanave",
        "castelo",
        "aero",
      ].includes(estado.mode)
    ) {
      event.preventDefault();
      pausarJogo();
    } else if (estado.mode === "paused") {
      event.preventDefault();
      continuarJogo();
    } else if (estado.mode === "map") {
      event.preventDefault();
      fecharMapa();
    }
    return;
  }
  if (estado.mode === "classroom" && event.key.toLowerCase() === "e") {
    event.preventDefault();
    elemento("black").style.opacity = 0;
    entrarNoCalabouco(false);
    return;
  }
  if (
    ![
      "playing",
      "home",
      "tv",
      "dungeon",
      "alisanave",
      "castelo",
      "aero",
    ].includes(estado.mode)
  )
    return;
  if (estado.mode === "aero" && estado.aero?.etapa === "ritmo") {
    const key = event.key.toLowerCase(),
      trilha = "asdfg".indexOf(key),
      numero = "12345".indexOf(key);
    if (!event.repeat && (trilha >= 0 || numero >= 0)) {
      event.preventDefault();
      tocarTrilhaBluezao(trilha >= 0 ? trilha : numero);
    }
    return;
  }
  if (
    estado.mode === "aero" &&
    ETAPAS_ARCOPLEX.includes(estado.aero?.etapa) &&
    event.key.toLowerCase() === "f"
  ) {
    event.preventDefault();
    if (!event.repeat && estado.aero.arcoplex)
      estado.aero.arcoplex.lanterna = !estado.aero.arcoplex.lanterna;
    return;
  }
  if (event.key === "Control" && !event.repeat) {
    event.preventDefault();
    estado.agacharTeclado = !estado.agacharTeclado;
    return;
  }
  const k = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (
    [
      " ",
      "e",
      "c",
      "m",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ].includes(k)
  )
    event.preventDefault();
  if (k === "Shift" && estado.shiftToggle) {
    event.preventDefault();
    if (
      !event.repeat &&
      ["playing", "alisanave", "castelo", "aero"].includes(estado.mode)
    )
      alternarCorrida();
    return;
  }
  teclasPressionadas.add(k);
  if (event.repeat) return;
  if (k === "e") interagir();
  if (k === "c" && !["alisanave", "castelo", "aero"].includes(estado.mode))
    abrirDesafio();
  if (k === "m" && !["alisanave", "castelo", "aero"].includes(estado.mode))
    abrirMapa();
  if (k === " " && estado.mode === "aero") interagir();
  else if (k === " ") usarControle();
});
document.addEventListener("keyup", (e) =>
  teclasPressionadas.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key),
);
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("cancel", (e) => {
    e.preventDefault();
    if (d.id === "celularPix") {
      pausarJogo();
    } else if (d.id === "painelProgramacao") {
      elemento("feedbackProgramacao").textContent = estado.desafioNovaFase
        ?.concluido
        ? "Leia a explicação e pressione ENTENDI · CONTINUAR."
        : "Este terminal libera a próxima parte. Escolha uma resposta ou use a dica. Você também pode voltar ao menu.";
    } else if (d.id === "pause") continuarJogo();
    else if (d.id === "editor") fecharDesafio();
    else if (d.id === "map") fecharMapa();
    else if (d.id === "painelCastelo") {
      d.close();
      definirModo("castelo");
    } else if (d.id === "painelPorto") {
      d.close();
      definirModo("alisanave");
    } else if (["help", "credits", "settings"].includes(d.id)) d.close();
  }),
);
window.addEventListener("blur", () => {
  limparTeclas();
  pausarJogo();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pausarJogo();
});
window.addEventListener("resize", () => cenaDoJogo?.redimensionar());
const canvas = elemento("world");
function capturarPonteiroSeguro(alvo, event) {
  if (
    typeof alvo.setPointerCapture !== "function" ||
    !Number.isFinite(event.pointerId)
  )
    return false;
  try {
    alvo.setPointerCapture(event.pointerId);
    return true;
  } catch (erro) {
    if (!["InvalidStateError", "NotFoundError"].includes(erro.name)) throw erro;
    return false;
  }
}
canvas.addEventListener("pointerdown", (e) => {
  if (
    estado.mode === "aero" &&
    ![
      "futebol",
      "lanchoneteExplorar",
      "volei",
      ...ETAPAS_ARCOPLEX_JOGAVEIS,
    ].includes(estado.aero?.etapa)
  )
    return;
  if (
    !["playing", "home", "alisanave", "castelo", "aero"].includes(estado.mode)
  )
    return;
  arrastoMouse = {
    x: e.clientX,
    y: e.clientY,
  };
  capturarPonteiroSeguro(canvas, e);
  if (e.pointerType === "mouse")
    canvas.requestPointerLock?.()?.catch?.(() => {});
});
canvas.addEventListener("pointermove", (e) => {
  if (
    !["playing", "home", "alisanave", "castelo", "aero"].includes(estado.mode)
  )
    return;
  let dx = 0,
    dy = 0;
  if (document.pointerLockElement === canvas) {
    dx = e.movementX;
    dy = e.movementY;
  } else if (arrastoMouse) {
    dx = e.clientX - arrastoMouse.x;
    dy = e.clientY - arrastoMouse.y;
    arrastoMouse = {
      x: e.clientX,
      y: e.clientY,
    };
  }
  if (
    (estado.mode === "aero" &&
      ![
        "futebol",
        "lanchoneteExplorar",
        "volei",
        ...ETAPAS_ARCOPLEX_JOGAVEIS,
      ].includes(estado.aero?.etapa)) ||
    (estado.mode === "alisanave" && estado.porto?.etapa !== "labirinto")
  )
    return;
  const jogadorCamera =
    estado.mode === "aero"
      ? estado.aero.jogador
      : estado.mode === "castelo"
        ? estado.castelo.jogador
        : estado.mode === "alisanave"
          ? estado.porto.jogador
          : estado.player;
  jogadorCamera.yaw -= dx * 0.0025 * (estado.sensibilidade || 1);
  jogadorCamera.pitch = Math.max(
    -1.1,
    Math.min(
      1.1,
      jogadorCamera.pitch - dy * 0.0023 * (estado.sensibilidade || 1),
    ),
  );
});
["pointerup", "pointercancel"].forEach((n) =>
  canvas.addEventListener(n, () => (arrastoMouse = null)),
);
elemento("volume").addEventListener("input", () => {
  estado.volume = Number(elemento("volume").value) / 100;
  audio.volume = estado.volume;
  audio.iniciar();
  if (audio.master)
    audio.master.gain.setTargetAtTime(
      audio.enabled ? estado.volume * 0.35 : 0,
      audio.ctx.currentTime,
      0.08,
    );
  sincronizarMusica();
  salvarOpcoes();
});
elemento("musicVolume").addEventListener("input", () => {
  estado.musicVolume = Number(elemento("musicVolume").value) / 100;
  sincronizarMusica();
  salvarOpcoes();
});
elemento("quality").addEventListener("change", () => {
  estado.quality = elemento("quality").value;
  cenaDoJogo.definirQualidade(estado.quality);
  salvarOpcoes();
});
elemento("shiftToggle").addEventListener("change", () => {
  estado.shiftToggle = elemento("shiftToggle").checked;
  estado.runLocked = false;
  salvarOpcoes();
});
document.addEventListener(
  "pointerdown",
  () => {
    if (estado.mode === "menu") sincronizarMusica();
  },
  {
    once: true,
  },
);
document.querySelectorAll("[data-key]").forEach((button) => {
  const release = () => {
    teclasPressionadas.delete(button.dataset.key);
    button.classList.remove("held");
  };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    capturarPonteiroSeguro(button, event);
    if (button.dataset.key === "Shift" && estado.shiftToggle) {
      alternarCorrida();
      return;
    }
    teclasPressionadas.add(button.dataset.key);
    button.classList.add("held");
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((n) =>
    button.addEventListener(n, release),
  );
});
elemento("boards").innerHTML = Array.from(
  {
    length: 5,
  },
  () =>
    '<svg class="board" viewBox="0 0 40 28" aria-hidden="true"><path d="M4 3h29l4 5v17H4z" fill="#73c1a2"/><path d="M0 7h8v10H0z" fill="#bbbca7"/><path d="M12 10h13v10H12z" fill="#193a2d"/><path d="M9 0v5m4-5v5m4-5v5m4-5v5m4-5v5m4-5v5M9 23v5m4-5v5m4-5v5m4-5v5m4-5v5m4-5v5" stroke="#d8d5a8" stroke-width="2"/><circle cx="31" cy="20" r="2" fill="#ecdc7a"/></svg>',
).join("");
/* Laço principal: atualiza regras e desenha a cena atual. */
const controleFisico = new ControlesGamepad();
let controlePresente = false,
  entradaAnteriorControle = null;
function atualizarEntradaControle(dt) {
  const entrada = controleFisico.ler(
    typeof navigator !== "undefined" ? navigator.getGamepads?.() || [] : [],
  );
  entrada.agachado = Boolean(estado.agacharTeclado || estado.agacharControle);
  teclasPressionadas.controle = entrada;
  if (entrada.desconectou) {
    estado.runLocked = false;
    pausarJogo();
  }
  if (entrada.conectado !== controlePresente) {
    controlePresente = entrada.conectado;
    const teclas = document.querySelector(".keys");
    if (teclas) {
      if (!teclas.dataset.teclado) teclas.dataset.teclado = teclas.innerHTML;
      teclas.innerHTML = controlePresente
        ? "<span>ANALÓGICO ESQ. MOVER</span><span>DIR. OLHAR</span><span>✕ / A INTERAGIR</span><span>L3 CORRER</span><span>○ / B AGACHAR</span><span>□ / X DEFESA</span><span>△ / Y MAPA</span><span>L1 RECUPERAR</span><span>OPTIONS PAUSAR</span>"
        : teclas.dataset.teclado;
    }
  }
  if (!entrada.conectado) return;
  if (
    estado.mode === "aero" &&
    ["derrotaRitmo", "fimAero"].includes(estado.aero?.etapa)
  ) {
    if (entrada.novos.includes(0))
      executarAcao(
        estado.aero.etapa === "derrotaRitmo" ? "repetirRitmo" : "menu",
      );
    if (entrada.novos.includes(9)) pausarJogo();
    return;
  }
  if (estado.mode === "aero" && estado.aero?.etapa === "volei") {
    teclasPressionadas.controle = { x: entrada.x, y: entrada.y };
    if (entrada.novos.includes(0) || entrada.novos.includes(2)) interagir();
    if (entrada.novos.includes(1)) teclasPressionadas.add("w");
    else teclasPressionadas.delete("w");
    if (entrada.novos.includes(9)) pausarJogo();
    return;
  }
  if (estado.mode === "aero" && estado.aero?.etapa === "ritmo") {
    const botoes = [4, 6, 0, 7, 5];
    for (const b of entrada.novos)
      if (botoes.includes(b)) tocarTrilhaBluezao(botoes.indexOf(b));
    if (entrada.novos.includes(9)) pausarJogo();
    return;
  }

  if (
    estado.mode === "aero" &&
    estado.aero?.etapa === "pagamento" &&
    entrada.novos.includes(1)
  ) {
    if (acaoPix(estado.aero.pix, "voltar")) executarAcaoAlisaBank("voltar");
    return;
  }
  if (estado.chuteMenuAtivo) return;
  if (estado.mode === "tv")
    estado.tvX = Math.max(
      -1,
      Math.min(1, (estado.tvX || 0) + entrada.x * dt * 2.3),
    );
  const filme =
    (estado.mode === "aero" &&
      ![
        "futebol",
        "lanchoneteExplorar",
        "volei",
        ...ETAPAS_ARCOPLEX_JOGAVEIS,
      ].includes(estado.aero?.etapa)) ||
    (estado.mode === "alisanave" && estado.porto?.etapa !== "labirinto") ||
    (estado.mode === "castelo" &&
      ["chegada", "portal", "terraco", "previa"].includes(
        estado.castelo?.etapa,
      ));
  const jogavel =
    ["playing", "home", "dungeon", "alisanave", "castelo", "aero"].includes(
      estado.mode,
    ) && !filme;
  if (jogavel) {
    const p =
      estado.mode === "aero"
        ? estado.aero.jogador
        : estado.mode === "castelo"
          ? estado.castelo.jogador
          : estado.mode === "alisanave"
            ? estado.porto.jogador
            : estado.player;
    p.yaw -= entrada.olharX * dt * 2.4;
    p.pitch = Math.max(
      -1.1,
      Math.min(1.1, p.pitch - entrada.olharY * dt * 1.65),
    );
  }
  const modal = document.querySelector("dialog[open]");
  if (modal || estado.mode === "menu") {
    const raiz = modal || document.getElementById("menu");
    const itens = [...raiz.querySelectorAll("button,input,select")].filter(
      (el) => !el.disabled && el.getClientRects().length,
    );
    let indice = itens.indexOf(document.activeElement);
    const vertical = Math.abs(entrada.y) > 0.65 ? Math.sign(entrada.y) : 0;
    if (
      entrada.novos.includes(12) ||
      entrada.novos.includes(13) ||
      (vertical && vertical !== entradaAnteriorControle)
    ) {
      const passo = entrada.novos.includes(12)
        ? -1
        : entrada.novos.includes(13)
          ? 1
          : vertical;
      if (indice < 0) indice = passo > 0 ? -1 : 0;
      indice = (indice + passo + itens.length) % itens.length;
      itens[indice]?.focus();
    }
    entradaAnteriorControle = vertical;
    if (entrada.novos.includes(0)) {
      if (indice < 0) itens[0]?.focus();
      const escolhido = indice < 0 ? itens[0] : itens[indice];
      escolhido?.click();
      // A opção de resposta pode focar o editor de texto; mantém a navegação no controle.
      if (escolhido?.isConnected && escolhido.getClientRects().length)
        escolhido.focus();
    }
    if (entrada.novos.includes(1)) {
      if (estado.mode === "paused") continuarJogo();
      else if (estado.mode === "map") fecharMapa();
      else if (modal) {
        modal.querySelector("button[data-close],button.close")?.click();
      }
    }
    const ativo = document.activeElement;
    const lado = entrada.novos.includes(14)
      ? -1
      : entrada.novos.includes(15)
        ? 1
        : 0;
    if (lado && ativo?.tagName === "SELECT") {
      ativo.selectedIndex = Math.max(
        0,
        Math.min(ativo.options.length - 1, ativo.selectedIndex + lado),
      );
      ativo.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (lado && ativo?.type === "range") {
      ativo.value = Math.max(
        Number(ativo.min),
        Math.min(Number(ativo.max), Number(ativo.value) + lado * 5),
      );
      ativo.dispatchEvent(new Event("input", { bubbles: true }));
    }
  } else {
    entradaAnteriorControle = null;
    if (
      entrada.novos.includes(2) &&
      estado.mode === "aero" &&
      ETAPAS_ARCOPLEX_JOGAVEIS.includes(estado.aero?.etapa) &&
      estado.aero.arcoplex
    )
      estado.aero.arcoplex.lanterna = !estado.aero.arcoplex.lanterna;
    if (entrada.novos.includes(0) && !filme) interagir();
    if (entrada.novos.includes(10) && jogavel) alternarCorrida();
    if (entrada.novos.includes(1) && jogavel)
      estado.agacharControle = !estado.agacharControle;
    if (
      (entrada.novos.includes(2) || entrada.novos.includes(7)) &&
      estado.mode === "playing"
    )
      usarControle();
    if (entrada.novos.includes(3) && estado.mode === "playing") abrirMapa();
    if (entrada.novos.includes(4) && estado.mode === "playing") abrirDesafio();
  }
  if (entrada.novos.includes(9)) {
    if (estado.mode === "paused") continuarJogo();
    else pausarJogo();
  }
}
function executarQuadro(timestamp) {
  const dt = Math.min(0.04, (timestamp - tempoQuadroAnterior) / 1000 || 0.016);
  tempoQuadroAnterior = timestamp;
  atualizarEntradaControle(dt);
  atualizarJogo(dt);
  interface2026?.update();
  elemento("hud").classList.toggle(
    "cinematica",
    (estado.mode === "aero" &&
      ![
        "futebol",
        "lanchoneteExplorar",
        "volei",
        ...ETAPAS_ARCOPLEX_JOGAVEIS,
      ].includes(estado.aero?.etapa)) ||
      (estado.mode === "alisanave" && estado.porto?.etapa !== "labirinto") ||
      (estado.mode === "castelo" &&
        ["chegada", "portal", "terraco", "previa"].includes(
          estado.castelo?.etapa,
        )),
  );
  const naPraia =
    (estado.mode === "aero" ||
      estado.mode === "paused" ||
      estado.mode === "painelProgramacao") &&
    ["praiaChegada", "volei", "voleiVitoria", "fimAero"].includes(
      estado.aero?.etapa,
    );
  elemento("shade").style.opacity = naPraia ? 0.08 : 1;
  atualizarMinimapaFixo(timestamp);
  if (cenaDoJogo) cenaDoJogo.armaPendente = false;
  cenaDoJogo?.efeitos?.iniciar();
  if (cenaDoJogo)
    cenaDoJogo.desenhar(
      estado,
      estado.reduced && estado.mode === "menu" ? 0 : timestamp / 1000,
    );
  cenaDoJogo?.efeitos?.concluir(cenaDoJogo.camera);
  cenaDoJogo?.desenharArma?.(estado, timestamp / 1000);
  if (timestamp > avisoAte) elemento("announcement").classList.remove("show");
  if (
    timestamp > legendaAte &&
    !(estado.mode === "paused" && estado.previousMode === "aero")
  )
    elemento("subtitle").classList.remove("show");
  requestAnimationFrame(executarQuadro);
}
/* Carrega os recursos e só então libera o menu. */
// Atualiza também os nomes escritos no HTML, usando o mesmo arquivo de configuração.
// FASE 2 — integração de entrada, dicas e três exercícios de programação.
function iniciarAlisanave(reiniciar = false) {
  fecharJanelas();
  estado.porto = criarEstadoAlisanave();
  if (reiniciar) {
    estado.porto.etapa = "sala";
    estado.porto.conversa = false;
  }
  cenaDoJogo?.montarPorto?.(estado.porto);
  audio.iniciar();
  estado.ultimaEtapaPorto = "";
  estado.tempoDicaPorto = 0;
  estado.tempoSomTenso = 0;
  estado.runLocked = false;
  definirModo("alisanave");
  elemento("black").style.opacity = 0;
  elemento("damage").style.opacity = 0;
  for (const id of ["wanted", "mapButton", "crosshair"])
    elemento(id).hidden = true;
  mostrarLegenda(
    "AXEL: A saída sumiu! SQLMAN: Segura firme. Próxima parada: Alisanave!",
    7,
  );
}
function atualizarAlisanave(dt) {
  const f = estado.porto;
  atualizarRegrasPorto(
    f,
    dt,
    teclasPressionadas,
    (estado.shiftToggle || teclasPressionadas.controle?.conectado) &&
      estado.runLocked,
  );
  if (f.etapa === "sala" && f.tempo >= 6 && !f.avisoCabeca) {
    f.avisoCabeca = true;
    mostrarLegenda(
      "CHARLIE: Minha cabeça vai com você. Entre no tobogã; eu mostro a saída do porto.",
      8,
    );
  }
  if (f.etapa !== estado.ultimaEtapaPorto) {
    estado.ultimaEtapaPorto = f.etapa;
    if (f.etapa === "sala")
      mostrarLegenda(
        "CHARLIE: Bem-vindo à Alisanave. Para sair, você vai precisar descer pelo tobogã.",
        6,
      );
    if (f.etapa === "toboga") mostrarLegenda("AXEL: Lá vamos nós!", 3);
    if (f.etapa === "labirinto") {
      audio.tocarImpacto();
      mostrarLegenda(
        "CHARLIE: Dez segundos! O buraco à direita está abrindo. Yang Ming vem atrás de você!",
        7,
      );
    }
    if (f.etapa === "barco") {
      audio.pararYang?.();
      mostrarLegenda(
        "CHARLIE: Conseguimos! Aquele castelo é a próxima parada.",
        7,
      );
    }
  }
  elemento("chapterName").textContent = "FASE 02 / ALISANAVE";
  elemento("wanted").hidden = f.etapa !== "labirinto";
  if (f.etapa === "labirinto") {
    const distancia = Math.hypot(
        f.yang.x - f.jogador.x,
        f.yang.z - f.jogador.z,
      ),
      nivel = f.contagem > 0 ? 0 : calcularArduinos(distancia);
    document
      .querySelectorAll(".board")
      .forEach((b, i) => b.classList.toggle("active", i < nivel));
    elemento("boards").setAttribute("aria-label", nivel + " de 5 Arduinos");
    elemento("wanted").classList.toggle("danger", nivel >= 4);
  }
  elemento("stamina").hidden = f.etapa !== "labirinto";
  elemento("prompt").hidden = f.etapa !== "labirinto";
  elemento("objectiveType").textContent =
    f.etapa === "limbo"
      ? "ENTRE DIMENSÕES"
      : f.etapa === "sala"
        ? "SALA BRANCA"
        : f.etapa === "toboga"
          ? "TOBOGÃ ALISANAVE"
          : f.etapa === "barco"
            ? "RUMO AO CASTELO"
            : f.contagem > 0
              ? "YANG MING EM " + Math.ceil(f.contagem) + " s"
              : "YANG MING ESTÁ SOLTO";
  elemento("objective").textContent =
    f.etapa === "limbo"
      ? "SQLman interceptou a queda."
      : f.etapa === "sala"
        ? f.conversa
          ? "Entre no tobogã azul à direita."
          : "Fale com Charlie no computador."
        : f.etapa === "toboga"
          ? "O porto está lá embaixo."
          : f.etapa === "barco"
            ? "Atravesse o mar até o castelo."
            : "Ative os três painéis e encontre o barco.";
  elemento("objectiveDetail").textContent =
    f.etapa === "labirinto"
      ? f.terminais.filter((t) => t.feito).length +
        "/3 PAINÉIS HTML/CSS · CHARLIE MOSTRA A DIREÇÃO"
      : "WASD move · ← → olha · E interage";
  elemento("prompt").querySelector("span").textContent =
    f.etapa === "sala"
      ? f.conversa
        ? "ENTRAR NO TOBOGÃ"
        : "FALAR COM CHARLIE"
      : "PAINEL / EMBARCAR";
  elemento("staminaNumber").innerHTML =
    f.folego.toFixed(1) + " <small>/ 45 s</small>";
  elemento("staminaFill").style.width = (f.folego / 45) * 100 + "%";
  elemento("characterCaption").textContent = "CHARLIE ESTÁ GUIANDO VOCÊ.";
  if (f.etapa === "labirinto") {
    const perto = Math.hypot(f.yang.x - f.jogador.x, f.yang.z - f.jogador.z);
    f.abaloYang = f.contagem <= 0 ? Math.max(0, 1 - perto / 25) : 0;
    f.tempoPatada = (f.tempoPatada || 0) - dt;
    if (f.contagem <= 0 && perto < 32 && f.tempoPatada <= 0) {
      audio.tocarPatadaYang?.(Math.max(0.1, 1 - perto / 35));
      f.tempoPatada = 0.31;
    }
    estado.tempoSomTenso -= dt;
    if (estado.tempoSomTenso <= 0) {
      audio.tocarTom(f.contagem > 0 ? 90 : 65, 0.25, 0.08, "triangle", 48);
      audio.tocarTom(130, 0.18, 0.04, "sawtooth", 98);
      estado.tempoSomTenso = 0.42;
    }
    const distancia = Math.hypot(
      f.yang.x - f.jogador.x,
      f.yang.z - f.jogador.z,
    );
    audio.atualizarYang?.(f.contagem === 0 ? distancia : 999);
    estado.tempoDicaPorto -= dt;
    if (estado.tempoDicaPorto <= 0) {
      const objetivo = f.terminais.find((t) => !t.feito) || f.saida;
      const campoDica = calcularDistancias(f.mapa, {
        x: objetivo.x / 2,
        z: objetivo.z / 2,
      });
      let cx = Math.floor(f.jogador.x / 6),
        cz = Math.floor(f.jogador.z / 6),
        melhor = campoDica[cz]?.[cx] ?? -1,
        alvo = objetivo;
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const valor = campoDica[cz + dz]?.[cx + dx];
        if (valor >= 0 && (melhor < 0 || valor < melhor)) {
          melhor = valor;
          alvo = { x: (cx + dx + 0.5) * 6, z: (cz + dz + 0.5) * 6 };
        }
      }
      const direcao = Math.atan2(
        -(alvo.x - f.jogador.x),
        -(alvo.z - f.jogador.z),
      );
      let angulo =
        ((direcao - f.jogador.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      mostrarLegenda(
        "CHARLIE: " +
          (Math.abs(angulo) < 0.55
            ? "Siga em frente."
            : angulo > 0
              ? "O próximo objetivo fica à esquerda."
              : "O próximo objetivo fica à direita.") +
          " Procure as passagens entre os contêineres.",
        5,
      );
      estado.tempoDicaPorto = 9;
    }
  }
  if (f.derrotado) {
    audio.pararYang?.();
    audio.tocarImpacto();
    definirModo("result");
    elemento("resultTag").textContent = "ALISANAVE / CAPTURADO";
    elemento("resultTitle").textContent = "Yang Ming te alcançou.";
    elemento("resultText").textContent =
      "Tente de novo a partir da sala branca. Use os dez segundos para ganhar distância; solte a corrida para recuperar fôlego.";
    elemento("resultScore").textContent = String(estado.score);
    elemento("resultButton").dataset.action = "reiniciarPorto";
    elemento("resultButton").textContent = "TENTAR ALISANAVE NOVAMENTE";
    elemento("result").showModal();
  }
  if (f.concluido) iniciarCastelo();
}
function interagirAlisanave() {
  const resultado = interagirPorto(estado.porto);
  if (!resultado) return;
  if (resultado.tipo === "fala") {
    mostrarLegenda(resultado.texto, 7);
    return;
  }
  if (resultado.tipo === "desafio") {
    estado.painelPorto = resultado.id;
    const d = DESAFIOS_PORTO[resultado.id];
    elemento("tituloPainelPorto").textContent = d.titulo;
    elemento("codigoPainelPorto").textContent = d.antes + " ___ " + d.depois;
    elemento("respostaPainelPorto").textContent =
      "Escolha a resposta correta. O mundo está pausado.";
    elemento("opcoesPainelPorto").replaceChildren();
    for (const opcao of d.opcoes) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "button secondary";
      b.textContent = opcao;
      b.addEventListener("click", () => {
        if (opcao === d.resposta) {
          estado.porto.terminais[resultado.id].feito = true;
          estado.porto.folego = 45;
          estado.score += 100;
          elemento("painelPorto").close();
          definirModo("alisanave");
          mostrarLegenda("CHARLIE: " + d.explicacao, 6);
          audio.tocarAcerto();
        } else
          elemento("respostaPainelPorto").textContent =
            "Tente de novo. " + d.explicacao;
      });
      elemento("opcoesPainelPorto").append(b);
    }
    estado.previousMode = "alisanave";
    definirModo("painelPorto");
    elemento("painelPorto").showModal();
  }
}

// FASE 4 — cidade subaquática, resgate e futebol na arena.
function iniciarAero(etapa = "queda") {
  if (cenaDoJogo?.carregarAero && !cenaDoJogo.aero) {
    if (estado.carregandoAero) return;
    estado.carregandoAero = true;
    fecharJanelas();
    definirModo("loading");
    elemento("loading").hidden = false;
    cenaDoJogo
      .carregarAero()
      .then(() => {
        estado.carregandoAero = false;
        elemento("loading").hidden = true;
        if (estado.mode === "loading") iniciarAero(etapa);
      })
      .catch((e) => {
        estado.carregandoAero = false;
        elemento("loading").textContent =
          "Falha ao carregar a cidade aquática: " + e.message;
      });
    return;
  }
  if (
    [
      "transformacao",
      "ritmo",
      "vitoria",
      "lanchonete",
      "lanchoneteExplorar",
      "lanchoneteFinal",
      "lanchonetePagar",
      "pagamento",
      "agradecimento",
      "saidaPonto",
      "viagemPraia",
    ].includes(etapa) &&
    cenaDoJogo?.carregarComplementosAero &&
    !cenaDoJogo.aero?.hulk
  ) {
    definirModo("loading");
    elemento("loading").hidden = false;
    cenaDoJogo
      .carregarComplementosAero()
      .then(() => {
        elemento("loading").hidden = true;
        if (estado.mode === "loading") iniciarAero(etapa);
      })
      .catch(
        (e) =>
          (elemento("loading").textContent =
            "Falha ao carregar o Hulkbuster: " + e.message),
      );
    return;
  }
  if (
    ETAPAS_ARCOPLEX.includes(etapa) &&
    cenaDoJogo?.carregarArcoplex &&
    !cenaDoJogo.aero?.arcoplex
  ) {
    definirModo("loading");
    elemento("loading").hidden = false;
    cenaDoJogo
      .carregarArcoplex()
      .then(() => {
        elemento("loading").hidden = true;
        if (estado.mode === "loading") iniciarAero(etapa);
      })
      .catch(
        (e) =>
          (elemento("loading").textContent =
            "Falha ao carregar o mercado e o cinema: " + e.message),
      );
    return;
  }
  if (
    ETAPAS_LUA.includes(etapa) &&
    cenaDoJogo?.carregarLua &&
    !cenaDoJogo.aero?.lua
  ) {
    definirModo("loading");
    elemento("loading").hidden = false;
    cenaDoJogo
      .carregarLua()
      .then(() => {
        elemento("loading").hidden = true;
        if (estado.mode === "loading") iniciarAero(etapa);
      })
      .catch(
        (e) =>
          (elemento("loading").textContent =
            "Falha ao carregar a lua: " + e.message),
      );
    return;
  }
  if (
    ["praiaChegada", "volei", "voleiVitoria", "fimAero"].includes(etapa) &&
    cenaDoJogo?.carregarPraia &&
    !cenaDoJogo.aero?.praia
  ) {
    definirModo("loading");
    elemento("loading").hidden = false;
    cenaDoJogo
      .carregarPraia()
      .then(() => {
        elemento("loading").hidden = true;
        if (estado.mode === "loading") iniciarAero(etapa);
      })
      .catch(
        (e) =>
          (elemento("loading").textContent =
            "Falha ao carregar a praia: " + e.message),
      );
    return;
  }
  fecharJanelas();
  audio.iniciar();
  estado.aero = criarEstadoAero(etapa === "programacao" ? "entrada" : etapa);
  estado.desafioNovaFase = null;
  if (ETAPAS_ARCOPLEX.includes(etapa))
    iniciarPosicaoArcoplex(estado.aero, etapa);
  if (etapa === "lanchoneteExplorar")
    Object.assign(estado.aero.jogador, {
      x: 1.1,
      y: 0,
      z: 3.4,
      yaw: 0,
      pitch: 0,
    });
  estado.runLocked = false;
  estado.agacharTeclado = estado.agacharControle = false;
  for (const nome of [
    "aero-musica",
    "naverdachi",
    "bluezao-funk",
    "ponto-kente",
    "cozinha-briga",
    "lula-obrigado",
    "bruno-henrique",
    "pou-volei",

    "axel-pergunta",
    "nav-pergunta",
  ])
    audio.reiniciarArquivo?.(nome);
  for (const nome of [...NOMES_AUDIO_LUA, ...NOMES_AUDIO_ARC])
    audio.reiniciarArquivo?.(nome);
  if (etapa === "telefoneBiz") {
    estado.aero.final.biz = true;
    estado.aero.final.chaveBiz = true;
  }
  definirModo("aero");
  elemento("black").style.opacity = 0;
  elemento("damage").style.opacity = 0;
  for (const id of ["wanted", "stamina", "mapButton", "crosshair", "prompt"])
    elemento(id).hidden = true;
  elemento("previaAero").hidden = true;
  mostrarLegenda(
    ETAPAS_ARCOPLEX.includes(etapa)
      ? [
          "mercadoEntrada",
          "carrinhoAtaque",
          "compras",
          "portaEstranha",
        ].includes(etapa)
        ? "KOMPRÃO · Confira a lista e procure os produtos."
        : ""
      : ETAPAS_LUA.includes(etapa)
        ? "BRITA EXPRESS · Da praia para a lua dos mercados!"
        : etapa === "volei" || etapa === "praiaChegada"
          ? "PRAIA DO PONTAL · E / ESPAÇO / A para jogar. A/D para mover; W para saltar."
          : etapa === "pagamento"
            ? "VOCÊ É NAVERDACHI · AlisaBank · Pague os R$ 67,00 do lanche."
            : etapa === "viagemPraia"
              ? "BRUNO HENRIQUE · Rumo à praia para jogar bola."
              : etapa.startsWith("lanchonete")
                ? "PONTO KENTE · Axel e Naverdachi aguardam seus lanches."
                : etapa === "futebol"
                  ? "NAVERDACHI: Vem jogar! Mire no gol e chute com E ou ✕/A."
                  : "AXEL: Tem uma cidade inteira aqui embaixo…",
    5,
  );
  if (etapa === "pagamento")
    atualizarCelularPix(estado.aero, executarAcaoAlisaBank);
  if (etapa === "programacao") {
    estado.aero.tempo = 4;
    abrirDesafioNovaFase(obterDesafioNovaFase(estado.aero));
  }
}
function tocarTrilhaBluezao(trilha) {
  if (estado.mode !== "aero" || estado.aero?.etapa !== "ritmo") return;
  if (acertarTrilha(estado.aero.ritmo, trilha))
    audio.tocarTom(330 + trilha * 95, 0.05, 0.035, "triangle");
}
function abrirDesafioNovaFase(d) {
  const f = estado.aero;
  const sessao = { f, id: d.id, concluido: false };
  estado.desafioNovaFase = sessao;
  estado.previousMode = "aero";
  definirModo("painelProgramacao");
  elemento("temaProgramacao").textContent = d.tema;
  elemento("tituloProgramacao").textContent = d.titulo;
  elemento("objetivoProgramacao").textContent = d.objetivo;
  elemento("codigoProgramacao").textContent = d.codigo;
  elemento("feedbackProgramacao").textContent =
    "Escolha a solução para continuar. A cena e os áudios estão pausados; errar não tira pontos.";
  elemento("opcoesProgramacao").replaceChildren();
  elemento("continuarProgramacao").hidden = true;
  elemento("dicaProgramacao").onclick = () => {
    elemento("feedbackProgramacao").textContent = "Dica: " + d.dica;
  };
  d.opcoes.forEach((opcao, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "button secondary";
    b.textContent = i + 1 + " · " + opcao;
    b.addEventListener("click", () => {
      if (
        estado.mode !== "painelProgramacao" ||
        estado.desafioNovaFase !== sessao ||
        estado.aero !== f ||
        sessao.concluido
      )
        return;
      const r = responderDesafioNovaFase(f, d.id, i);
      if (!r.valido) return;
      elemento("feedbackProgramacao").textContent =
        (r.correto ? "Correto! " : "") + r.mensagem;
      if (r.correto) {
        sessao.concluido = true;
        estado.score += 100;
        audio.tocarAcerto();
        elemento("opcoesProgramacao").replaceChildren();
        elemento("dicaProgramacao").hidden = true;
        const continuar = elemento("continuarProgramacao");
        continuar.hidden = false;
        continuar.focus();
      }
    });
    elemento("opcoesProgramacao").append(b);
  });
  elemento("dicaProgramacao").hidden = false;
  elemento("continuarProgramacao").onclick = () => {
    if (
      estado.mode !== "painelProgramacao" ||
      estado.desafioNovaFase !== sessao ||
      estado.aero !== f ||
      !sessao.concluido
    )
      return;
    elemento("painelProgramacao").close();
    estado.desafioNovaFase = null;
    definirModo("aero");
  };
  elemento("painelProgramacao").showModal();
  elemento("opcoesProgramacao").children[0]?.focus();
}
function executarAcaoAlisaBank(acao) {
  if (estado.mode !== "aero" || estado.aero?.etapa !== "pagamento") return;
  if (acao === "pagar") audio.tocarAcerto();
  atualizarCelularPix(estado.aero, executarAcaoAlisaBank);
}
const NOMES_AUDIO_LUA = [
  ...FALAS_LUA.map((l) => "lua-" + l[2]),
  "lua-reacao-caro",
  "lua-reacao-bom",
  "lua-jingle",
];
function atualizarInterfaceLua(f, tocar = true) {
  const ativo = estado.mode === "aero" && ETAPAS_LUA.includes(f?.etapa);
  elemento("fimLua").hidden = !ativo || f.etapa !== "fimLua";
  if (!ativo) return;
  if (f.luaUltimaEtapa !== f.etapa) {
    f.luaUltimaEtapa = f.etapa;
    for (const nome of NOMES_AUDIO_LUA) audio.reiniciarArquivo?.(nome);
    if (f.etapa === "preceiroExplosao" && tocar) audio.tocarImpacto();
  }
  const fala = falaLua(f);
  if (fala && f.luaUltimaFala !== fala[2]) {
    f.luaUltimaFala = fala[2];
    mostrarLegenda(fala[3] + ": " + fala[4], 8);
  }
  const sons = tocar ? sonsLua(f) : [];
  for (const nome of NOMES_AUDIO_LUA)
    if (!sons.some((s) => s[0] === nome)) audio.pararArquivo?.(nome);
  for (const [nome, arquivo, volume] of sons)
    audio.tocarArquivo?.(nome, arquivo, volume);
}
const NOMES_AUDIO_ARC = [
  ...FALAS_ARCOPLEX.map(
    (l) => (ETAPAS_FINAL.includes(l[0]) ? "final-" : "arc-") + l[2],
  ),
  "arc-pedido-joker",
  "arc-ambiente",
  "final-level94",
];
function atualizarInterfaceArcoplex(f, tocar = true) {
  const ativo = estado.mode === "aero" && ETAPAS_ARCOPLEX.includes(f?.etapa);
  elemento("hudArcoplex").hidden = !ativo;
  document.body.classList.toggle("arcoplex-ativo", ativo);
  elemento("olhoMagicoArc").hidden = !ativo || f.etapa !== "olhoMagico";
  elemento("transicaoArc").hidden =
    !ativo || !["travessiaCinema", "cinemaSusto"].includes(f.etapa);
  atualizarInterfaceFinal(f, tocar);
  if (!ativo) {
    for (const n of NOMES_AUDIO_ARC) audio.pararArquivo?.(n);
    return;
  }
  const a = (f.arcoplex ??= criarEstadoArcoplex()),
    horror = ![
      "mercadoEntrada",
      "carrinhoAtaque",
      "compras",
      "portaEstranha",
    ].includes(f.etapa);
  elemento("hudArcoplex").classList.toggle("horror", horror);
  elemento("localArc").textContent = horror
    ? "ITAJAÍ SHOPPING · ARCOPLEX · L3"
    : "KOMPRÃO · DESAFIO DAS COMPRAS";
  elemento("objetivoArc").textContent =
    f.etapa === "compras"
      ? LISTAS_COMPRAS[a.rodada]?.nome +
        " · " +
        Object.entries(LISTAS_COMPRAS[a.rodada].itens)
          .map(
            ([id, n]) =>
              PRODUTOS_MERCADO.find((p) => p.id === id).nome +
              " " +
              (a.cesta[id] || 0) +
              "/" +
              n,
          )
          .join(" · ")
      : f.etapa === "portaEstranha"
        ? "Uma porta apareceu sozinha no fundo do mercado."
        : f.etapa === "shoppingExplorar"
          ? "O shopping está vazio. Explore o andar do cinema."
          : f.etapa === "cinemaFuga"
            ? "Alguém está vindo. Entre na SALA 3."
            : f.etapa === "cinemaResultado"
              ? "A transmissão terminou. Há um ruído entre as poltronas."
              : ["cinemaSala"].includes(f.etapa)
                ? "Observe o que está passando na tela."
                : "";
  if (ETAPAS_FINAL.includes(f.etapa)) {
    elemento("objetivoArc").textContent = objetivoFinal(f);
    elemento("localArc").textContent = f.etapa.startsWith("level94")
      ? "LEVEL 94 · MOTION"
      : f.etapa.startsWith("peppa")
        ? "CORREDORES · HORA DE BRINCAR"
        : f.etapa.startsWith("casa")
          ? "CASA 09 · UMA TRANSMISSÃO ERRADA"
          : f.etapa.includes("Biz") || f.etapa.includes("Brita")
            ? "O CAMINHO DE VOLTA"
            : "A ÚLTIMA SAÍDA";
  }
  elemento("promptArc").textContent =
    interacaoArcoplex(f) || f.final?.avisos || a.avisos || "";
  elemento("controlesArc").textContent = ETAPAS_ARCOPLEX_JOGAVEIS.includes(
    f.etapa,
  )
    ? "WASD mover · Mouse olhar · E interagir · Shift correr · F lanterna · Esc pausar · Fôlego " +
      Math.ceil(a.folego) +
      "%"
    : "";
  if (f.arcAudioEtapa !== f.etapa) {
    f.arcAudioEtapa = f.etapa;
    f.arcUltimaFala = null;
    for (const l of FALAS_ARCOPLEX.filter((l) => l[0] === f.etapa))
      audio.reiniciarArquivo?.(
        (ETAPAS_FINAL.includes(l[0]) ? "final-" : "arc-") + l[2],
      );
  }
  const fala = falaArcoplex(f);
  if (fala && f.arcUltimaFala !== fala[2]) {
    f.arcUltimaFala = fala[2];
    mostrarLegenda(
      fala[3] + ": " + fala[4],
      ETAPAS_FINAL.includes(f.etapa) ? 16 : 9,
    );
  }
  const sons = tocar ? sonsArcoplex(f) : [];
  for (const n of NOMES_AUDIO_ARC)
    if (!sons.some((s) => s[0] === n)) audio.pararArquivo?.(n);
  for (const [n, arquivo, volume, loop] of sons)
    audio.tocarArquivo?.(
      n,
      arquivo,
      n === "arc-ambiente" || n === "final-level94"
        ? volume * estado.musicVolume
        : volume,
      loop,
    );
  if (tocar) {
    const andando = f.movendo && ETAPAS_ARCOPLEX_JOGAVEIS.includes(f.etapa);
    if (andando && f.animacao > (a.proximoPassoAxel || 0)) {
      audio.tocarPasso?.();
      a.proximoPassoAxel = f.animacao + (f.correndo ? 0.29 : 0.5);
    }
    if (
      (f.etapa === "shoppingExplorar" && f.tempo > 10) ||
      f.etapa === "cinemaFuga"
    ) {
      if (f.animacao > (a.proximoPassoSombra || 0)) {
        const q = a.perseguidor,
          p = f.jogador,
          d = Math.hypot(q.x - p.x, q.z - p.z),
          lado = Math.cos(p.yaw) * (q.x - p.x) - Math.sin(p.yaw) * (q.z - p.z);
        audio.tocarPassoPerseguidor?.(lado / Math.max(d, 1), d);
        audio.tocarRuido?.(0.07, 0.03, 160);
        a.proximoPassoSombra =
          f.animacao + (f.etapa === "cinemaFuga" ? 0.43 : 0.9);
      }
    }
  }
}
function atualizarInterfaceFinal(f, tocar = true) {
  const ativo = estado.mode === "aero" && ETAPAS_FINAL.includes(f?.etapa),
    c = cenaDoJogo?.aero?.arcoplex?.final;
  if (c)
    atualizarMidiaFinal(
      c,
      f,
      ativo,
      tocar && audio.enabled ? estado.volume * estado.musicVolume * 0.7 : 0,
    );
  elemento("telefoneFinal").hidden =
    !ativo || !["telefoneBiz", "ligacaoBrita"].includes(f?.etapa);
  elemento("finalJogo").hidden = !ativo || f?.etapa !== "fimJogo";
  if (!ativo) return;
  const a = (f.final ??= criarEstadoFinal());
  const tela = elemento("telaTelefoneFinal"),
    key = f.etapa + ":" + a.telefone;
  if (tela.dataset.tela !== key) {
    tela.dataset.tela = key;
    if (f.etapa === "ligacaoBrita")
      tela.innerHTML =
        '<div class="fone-cabecalho">BRITA</div><p>Chamada em andamento</p><div class="avatar-brita">B</div><p id="duracaoLigacaoFinal">Conectando…</p><div class="chamada-icon">☎</div>';
    else if (a.telefone === "inicio")
      tela.innerHTML =
        '<div class="fone-cabecalho">Biblioteca de Apps</div><p>Axel · O caminho de volta</p><button data-final-fone="app" class="app-fone"><b>☎</b>Telefone</button><p class="fone-ajuda">Abra o Telefone para encontrar Brita.</p>';
    else if (a.telefone === "contatos")
      tela.innerHTML =
        '<div class="fone-cabecalho">Contatos</div><button data-final-fone="brita" class="contato-brita"><b>B</b><span>Brita<br><small>amigo · celular</small></span></button><button data-final-fone="voltar">Voltar</button>';
    else
      tela.innerHTML =
        '<div class="avatar-brita">B</div><h2>Brita</h2><p>Celular · contato salvo</p><button data-final-fone="ligar" class="ligar-brita">☎ Ligar</button><button data-final-fone="voltar">Voltar</button>';
    for (const b of tela.querySelectorAll("[data-final-fone]"))
      b.onclick = () => {
        if (estado.mode !== "aero" || estado.aero !== f) return;
        acaoTelefoneFinal(f, b.dataset.finalFone);
        atualizarInterfaceFinal(f);
      };
    if (f.etapa === "telefoneBiz") document.exitPointerLock?.();
  }
  if (f.etapa === "ligacaoBrita")
    elemento("duracaoLigacaoFinal").textContent =
      "00:" + String(Math.floor(f.tempo)).padStart(2, "0");
  if (
    tocar &&
    ["cinemaEscapar", "level94Fuga"].includes(f.etapa) &&
    f.animacao > (a.somPasso || 0)
  ) {
    const p = f.jogador,
      q = a.perseguidor,
      d = Math.hypot(p.x - q.x, p.z - q.z),
      lado =
        (Math.cos(p.yaw) * (q.x - p.x) - Math.sin(p.yaw) * (q.z - p.z)) /
        Math.max(1, d);
    audio.tocarPassoPerseguidor?.(lado, d);
    audio.tocarBatimento?.();
    a.somPasso = f.animacao + 0.36;
  }
  if (tocar && f.etapa === "ligacaoBrita" && f.tempo < 1 && !a.tocouChamada) {
    a.tocouChamada = true;
    audio.tocarTom(440, 0.55, 0.08);
  }
  if (
    tocar &&
    f.etapa === "viagemBiz" &&
    f.movendo &&
    f.animacao > (a.motorAte || 0)
  ) {
    audio.tocarTom(62, 0.22, 0.045, "sawtooth", 77);
    a.motorAte = f.animacao + 0.2;
  }
  if (
    tocar &&
    ["casaLuto", "casaSaida", "portalAbertura", "portalExplorar"].includes(
      f.etapa,
    ) &&
    f.animacao > (a.chuvaAte || 0)
  ) {
    audio.tocarRuido?.(0.6, 0.035, 1200);
    a.chuvaAte = f.animacao + 0.5;
  }
}
function atualizarInterfaceVolei(f) {
  const ativo = estado.mode === "aero" && f?.etapa === "volei";
  elemento("hudVolei").hidden = !ativo;
  if (!ativo) return;
  elemento("pontosVolei").textContent =
    f.volei.pontos[0] + " : " + f.volei.pontos[1];
  elemento("acaoVolei").textContent = f.volei.terminado
    ? "TENTAR NOVAMENTE"
    : f.volei.acao;
  elemento("mensagemVolei").textContent = f.volei.mensagem;
}
function atualizarJogoAero(dt) {
  if (estado.capturaTeste) {
    atualizarInterfaceVolei(estado.aero);
    atualizarInterfaceLua(estado.aero, false);
    atualizarInterfaceArcoplex(estado.aero, false);
    if (estado.aero?.etapa === "pagamento")
      atualizarCelularPix(estado.aero, executarAcaoAlisaBank);
    return;
  }
  const f = estado.aero,
    etapa = f.etapa,
    gols = f.golsAxel + f.golsNaverdachi;
  const pendente = obterDesafioNovaFase(f);
  if (pendente) {
    abrirDesafioNovaFase(pendente);
    return;
  }
  atualizarAero(
    f,
    limitarPassoProgramacao(f, dt),
    teclasPressionadas,
    estado.runLocked,
    estado.agacharTeclado || estado.agacharControle,
  );
  const novoDesafio = obterDesafioNovaFase(f);
  if (novoDesafio) {
    abrirDesafioNovaFase(novoDesafio);
    return;
  }
  if (
    [
      "transformacao",
      "ritmo",
      "vitoria",
      "lanchonete",
      "lanchoneteExplorar",
      "lanchoneteFinal",
      "lanchonetePagar",
      "pagamento",
      "agradecimento",
      "saidaPonto",
      "viagemPraia",
      "fimAero",
    ].includes(f.etapa) &&
    cenaDoJogo?.carregarComplementosAero &&
    !cenaDoJogo.aero?.hulk
  ) {
    definirModo("loading");
    elemento("loading").hidden = false;
    cenaDoJogo
      .carregarComplementosAero()
      .then(() => {
        elemento("loading").hidden = true;
        if (estado.mode === "loading") definirModo("aero");
      })
      .catch(
        (e) =>
          (elemento("loading").textContent =
            "Falha ao carregar o Hulkbuster: " + e.message),
      );
    return;
  }
  if (
    [
      "viagemPraia",
      "praiaChegada",
      "volei",
      "voleiVitoria",
      "fimAero",
    ].includes(f.etapa) &&
    cenaDoJogo?.carregarPraia &&
    !cenaDoJogo.aero?.praia
  ) {
    definirModo("loading");
    elemento("loading").hidden = false;
    cenaDoJogo
      .carregarPraia()
      .then(() => {
        elemento("loading").hidden = true;
        if (estado.mode === "loading") definirModo("aero");
      })
      .catch(
        (e) =>
          (elemento("loading").textContent =
            "Falha ao carregar a praia: " + e.message),
      );
    return;
  }
  if (
    ETAPAS_LUA.includes(f.etapa) &&
    cenaDoJogo?.carregarLua &&
    !cenaDoJogo.aero?.lua
  ) {
    definirModo("loading");
    elemento("loading").hidden = false;
    cenaDoJogo
      .carregarLua()
      .then(() => {
        elemento("loading").hidden = true;
        if (estado.mode === "loading") definirModo("aero");
      })
      .catch(
        (e) =>
          (elemento("loading").textContent =
            "Falha ao carregar a lua: " + e.message),
      );
    return;
  }
  if (
    ETAPAS_ARCOPLEX.includes(f.etapa) &&
    cenaDoJogo?.carregarArcoplex &&
    !cenaDoJogo.aero?.arcoplex
  ) {
    definirModo("loading");
    elemento("loading").hidden = false;
    cenaDoJogo
      .carregarArcoplex()
      .then(() => {
        elemento("loading").hidden = true;
        if (estado.mode === "loading") definirModo("aero");
      })
      .catch(
        (e) =>
          (elemento("loading").textContent =
            "Falha ao carregar o cinema: " + e.message),
      );
    return;
  }
  atualizarInterfaceLua(f);
  atualizarInterfaceArcoplex(f);
  atualizarInterfaceVolei(f);
  const ritmo = ["ritmo", "derrotaRitmo"].includes(f.etapa),
    festa = [
      "lanchonete",
      "lanchoneteExplorar",
      "lanchoneteFinal",
      "lanchonetePagar",
      "pagamento",
      "agradecimento",
      "saidaPonto",
    ].includes(f.etapa);
  atualizarCelularPix(f, executarAcaoAlisaBank);
  if (f.etapa === "lanchoneteFinal" && f.tempo >= 7 && !f.buzinou) {
    f.buzinou = true;
    audio.tocarTom(349, 0.65, 0.16, "sawtooth");
    audio.tocarTom(440, 0.65, 0.12, "sawtooth");
    mostrarLegenda(
      "Uma buzina lá fora! NAVERDACHI: Antes de sair, precisamos pagar. Deu R$ 67,00.",
      6,
    );
  }
  for (const [nome, arquivo, ativa] of [
    [
      "lula-obrigado",
      "assets/alisabank/lula-obrigado.m4a",
      f.etapa === "agradecimento",
    ],
    [
      "bruno-henrique",
      "assets/peugeot/bruno-henrique.m4a",
      f.etapa === "viagemPraia",
    ],
  ]) {
    if (ativa) audio.tocarArquivo?.(nome, arquivo, 1);
    else audio.pararArquivo?.(nome);
  }
  elemento("batalhaRitmo").hidden = !ritmo;
  elemento("derrotaRitmo").hidden = f.etapa !== "derrotaRitmo";
  elemento("fimAero").hidden = f.etapa !== "fimAero";
  if (["praiaChegada", "volei", "voleiVitoria", "fimAero"].includes(f.etapa))
    audio.tocarArquivo?.(
      "pou-volei",
      "assets/praia/pou-volei.m4a",
      estado.musicVolume * 0.75,
      true,
    );
  else audio.pararArquivo?.("pou-volei");
  const narracao = f.etapa === "resgate";
  if (
    !ritmo &&
    !festa &&
    ![
      "lanchoneteExplorar",
      "lanchoneteFinal",
      "lanchonetePagar",
      "pagamento",
      "agradecimento",
      "saidaPonto",
      "viagemPraia",
      "praiaChegada",
      "volei",
      "voleiVitoria",
      "fimAero",
      ...ETAPAS_LUA,
      ...ETAPAS_ARCOPLEX,
      "transformacao",
      "vitoria",
    ].includes(f.etapa)
  )
    audio.tocarArquivo?.(
      "aero-musica",
      "assets/aero-ambience.m4a",
      estado.musicVolume * (narracao ? 0.28 : 0.7),
      true,
    );
  else audio.pararArquivo?.("aero-musica");
  if (narracao)
    audio.tocarArquivo?.("naverdachi", "assets/naverdachi-fala.m4a", 1);
  else audio.pararArquivo?.("naverdachi");
  if (f.etapa === "ritmo" && f.ritmo.tempo >= 0) {
    audio.tocarArquivo?.(
      "bluezao-funk",
      "assets/bluezao-funk.m4a",
      estado.musicVolume,
      true,
    );
    const faixa = audio.arquivos?.["bluezao-funk"],
      tempoAlvo = f.ritmo.tempo % DURACAO_LOOP_FUNK;
    if (
      faixa &&
      Number.isFinite(faixa.duration) &&
      Math.abs(faixa.currentTime - tempoAlvo) > 0.2
    )
      faixa.currentTime = tempoAlvo;
  } else audio.pararArquivo?.("bluezao-funk");
  if (festa)
    audio.tocarArquivo?.(
      "ponto-kente",
      "assets/ponto-kente-musica.m4a",
      estado.musicVolume *
        (["pagamento", "agradecimento"].includes(f.etapa) ||
        (f.etapa === "lanchonete" && f.tempo >= 12)
          ? 0.08
          : 0.4),
      true,
    );
  else audio.pararArquivo?.("ponto-kente");
  const lanchonete = f.etapa === "lanchonete",
    t = f.tempo;
  for (const [nome, arquivo, inicio, fim] of [
    ["axel-pergunta", "axel-pergunta.m4a", 12, 17],
    ["nav-pergunta", "nav-pergunta.m4a", 17, 22],
    ["cozinha-briga", "briga-cozinha.m4a", 22, 31.15],
  ]) {
    if (lanchonete && t >= inicio && t < fim) {
      audio.tocarArquivo?.(nome, "assets/ponto-kente/" + arquivo, 1);
      const a = audio.arquivos?.[nome];
      if (
        a &&
        Number.isFinite(a.duration) &&
        Math.abs(a.currentTime - (t - inicio)) > 0.25
      )
        a.currentTime = Math.min(a.duration, t - inicio);
    } else audio.pararArquivo?.(nome);
  }
  const falaPonto = !lanchonete
    ? -1
    : t < 12
      ? 0
      : t < 17
        ? 1
        : t < 22
          ? 2
          : t < 31.15
            ? 3
            : 4;
  if (falaPonto !== f.falaPonto) {
    f.falaPonto = falaPonto;
    const textos = [
      "PONTO KENTE · Uma mesa para dois.",
      "AXEL: Naverdachi, por que a comida está demorando tanto?",
      "NAVERDACHI: Já faz um tempão. Será que esqueceram o nosso pedido?",
      "NA COZINHA · O motivo da demora…",
      "NAVERDACHI: A cozinha virou uma confusão! Vamos conferir o pedido no balcão.",
    ];
    if (falaPonto >= 0)
      mostrarLegenda(textos[falaPonto], falaPonto === 3 ? 9 : 5);
  }
  if (f.etapa === "lanchoneteExplorar") {
    elemento("prompt").hidden = false;
    elemento("prompt").textContent = pertoBalcaoPontoKente(f)
      ? "E / ✕ A · ORGANIZAR OS PEDIDOS"
      : "VÁ AO BALCÃO · PAINEL DE PEDIDOS </>";
  } else elemento("prompt").hidden = true;
  if (ritmo) {
    desenharPistaRitmo(elemento("pistaRitmo"), f.ritmo);
    elemento("vidaBluezao").value = f.ritmo.vidaVilao;
    elemento("energiaRitmo").value = f.ritmo.energia;
    elemento("statusRitmo").textContent =
      f.ritmo.acertos + " ACERTOS · COMBO " + f.ritmo.combo;
  }
  if (f.etapa !== etapa) {
    limparTeclas();
    estado.runLocked = false;
    if (f.etapa === "resgate")
      mostrarLegenda("Neymar Naverdachi encontrou Axel na cidade aquática.", 5);
    if (f.etapa === "viagem")
      mostrarLegenda("Naverdachi leva Axel à Neo Química Arena aquática.", 5);
    if (f.etapa === "futebol")
      mostrarLegenda("Primeiro a marcar 5 gols vence! E / ✕ A para chutar.", 7);
    if (f.etapa === "transformacao") {
      audio.tocarImpacto();
      mostrarLegenda(
        f.vencedor + " venceu a partida! BLUEZÃO: Chega de me chutar!",
        5,
      );
    }
    if (f.etapa === "ritmo") {
      audio.reiniciarArquivo?.("bluezao-funk");
      mostrarLegenda(
        "Derrote Bluezão acertando as notas: A S D F G ou 1 2 3 4 5.",
        6,
      );
    }
    if (f.etapa === "vitoria") {
      audio.tocarAcerto();
      mostrarLegenda(
        "AXEL E NAVERDACHI: Conseguimos! Bora para o Ponto Kente!",
        5,
      );
    }
    if (f.etapa === "lanchoneteExplorar")
      mostrarLegenda(
        "NAVERDACHI: Vá ao balcão conferir o pedido. WASD / analógico para andar; E / ✕ A para usar o painel.",
        8,
      );
    if (f.etapa === "lanchonetePagar")
      mostrarLegenda(
        "NAVERDACHI: A conta dos dois deu R$ 67,00. Vamos ao caixa.",
        5,
      );
    if (f.etapa === "pagamento")
      mostrarLegenda(
        "VOCÊ É NAVERDACHI · Abra o AlisaBank e faça o Pix pelo QR code do cartão.",
        8,
      );
    if (f.etapa === "agradecimento") {
      audio.reiniciarArquivo?.("lula-obrigado");
      mostrarLegenda("LULA: Humildemente, eu quero agradecer a você.", 3);
    }
    if (f.etapa === "saidaPonto")
      mostrarLegenda(
        "Lanches pagos! Axel e Naverdachi saem do Ponto Kente.",
        5,
      );
    if (f.etapa === "viagemPraia") {
      audio.reiniciarArquivo?.("bruno-henrique");
      mostrarLegenda(
        "BRUNO HENRIQUE · Próxima parada: praia. Bora jogar bola!",
        6,
      );
    }
    if (f.etapa === "praiaChegada")
      mostrarLegenda(
        "PRAIA DO PONTAL · Bob Esponja, Alya e Jonesy: Bora jogar vôlei!",
        7,
      );
    if (f.etapa === "volei")
      mostrarLegenda(
        "VÔLEI FÁCIL · E / ESPAÇO / A para sacar e rebater. Nav ajuda; primeiro a 5!",
        7,
      );
    if (f.etapa === "voleiVitoria") {
      audio.tocarAcerto();
      mostrarLegenda("VITÓRIA! Bob, Alya e Jonesy comemoram com a dupla!", 7);
    }
    if (f.etapa === "lanchoneteFinal")
      mostrarLegenda("AXEL: Até que enfim! Agora sim, bora comer.", 5);
    if (f.etapa === "lanchonete") {
      audio.reiniciarArquivo?.("ponto-kente");
      mostrarLegenda(
        "PONTO KENTE · Axel e Naverdachi aguardam seus lanches.",
        5,
      );
    }
  }
  elemento("placarAero").hidden = f.etapa !== "futebol";
  elemento("placarAeroTexto").textContent =
    "Nav " + f.golsNaverdachi + " · Axe " + f.golsAxel;
  elemento("golsNavAero").textContent = f.golsNaverdachi;
  elemento("golsAxelAero").textContent = f.golsAxel;
  elemento("tempoPartidaAero").textContent =
    String(Math.floor(f.tempo / 60)).padStart(2, "0") +
    ":" +
    String(Math.floor(f.tempo % 60)).padStart(2, "0");
  if (f.golsAxel + f.golsNaverdachi > gols && f.etapa === "futebol") {
    audio.tocarAcerto();
    mostrarLegenda("GOOOL! Primeiro a 5 vence.", 3);
  }
}

/** Atalhos de teste: cada entrada começa com estado limpo e mantém as regras da fase. */
function iniciarFaseTeste(id) {
  const permitidos = [
    "arc-clayface",
    "arc-escapar",
    "arc-peppa",
    "arc-level94",
    "arc-colinas",
    "arc-corrida94",
    "arc-simpsons",
    "arc-tv",
    "arc-plantao",
    "arc-portal",
    "arc-biz",
    "arc-telefone",
    "arc-viagem-biz",
    "arc-final",
    "arc-mercado",
    "arc-compras",
    "arc-porta",
    "arc-olho",
    "arc-shopping",
    "arc-fuga",
    "arc-sala",
    "arc-resultado",
    "lua-brita",
    "lua-viagem",
    "lua-preceiro",
    "lua-jornal-preceiro",
    "lua-komprao",
    "lua-explosao",
    "lua-jornal-komprao",

    "quarto",
    "backrooms-0",
    "backrooms-1",
    "backrooms-2",
    "limbo",
    "sala",
    "toboga",
    "labirinto",
    "barco",
    "chegada",
    "salao",
    "escada",
    "terraco",
    "previa",
    "aero",
    "aero-resgate",
    "aero-programacao",
    "aero-arena",
    "aero-transformacao",
    "aero-batalha",
    "aero-lanchonete",
    "aero-cozinha",
    "aero-refeicao",
    "aero-pix",
    "aero-pix-conta",
    "aero-agradecimento",
    "aero-pix-camera",
    "aero-peugeot",
    "aero-praia",
    "aero-volei",
  ];
  if (!permitidos.includes(id)) return false;
  iniciarHistoria();
  const testesArc = {
    "arc-clayface": "clayRevela",
    "arc-escapar": "cinemaEscapar",
    "arc-peppa": "peppaEntrada",
    "arc-level94": "level94Chegada",
    "arc-colinas": "level94Explorar",
    "arc-corrida94": "level94Fuga",
    "arc-simpsons": "casaEntrada",
    "arc-tv": "casaTrailer",
    "arc-plantao": "casaNoticia",
    "arc-portal": "portalAbertura",
    "arc-biz": "retornoBiz",
    "arc-telefone": "telefoneBiz",
    "arc-viagem-biz": "viagemBiz",
    "arc-final": "fimJogo",
    "arc-mercado": "mercadoEntrada",
    "arc-compras": "compras",
    "arc-porta": "portaEstranha",
    "arc-olho": "olhoMagico",
    "arc-shopping": "shoppingExplorar",
    "arc-fuga": "cinemaFuga",
    "arc-sala": "cinemaSala",
    "arc-resultado": "cinemaResultado",
  };
  if (testesArc[id]) {
    iniciarAero(testesArc[id]);
    return true;
  }
  const testesLua = {
    "lua-brita": "britaChegada",
    "lua-viagem": "viagemLua",
    "lua-preceiro": "luaChegada",
    "lua-jornal-preceiro": "preceiroLeitura",
    "lua-komprao": "kompraoChegada",
    "lua-explosao": "preceiroExplosao",
    "lua-jornal-komprao": "kompraoLeitura",
  };
  if (testesLua[id]) {
    iniciarAero(testesLua[id]);
    return true;
  }
  if (id === "quarto") return true;
  if (
    [
      "aero",
      "previa",
      "aero-resgate",
      "aero-programacao",
      "aero-arena",
      "aero-transformacao",
      "aero-batalha",
      "aero-lanchonete",
      "aero-cozinha",
      "aero-refeicao",
      "aero-pix",
      "aero-pix-conta",
      "aero-agradecimento",
      "aero-pix-camera",
      "aero-peugeot",
      "aero-praia",
      "aero-volei",
    ].includes(id)
  ) {
    iniciarAero(
      id === "aero-praia"
        ? "praiaChegada"
        : id === "aero-volei"
          ? "volei"
          : id === "aero-agradecimento"
            ? "agradecimento"
            : id === "aero-pix" ||
                id === "aero-pix-camera" ||
                id === "aero-pix-conta"
              ? "pagamento"
              : id === "aero-peugeot"
                ? "viagemPraia"
                : id === "aero-programacao"
                  ? "programacao"
                  : id === "aero-cozinha"
                    ? "lanchoneteExplorar"
                    : id === "aero-refeicao"
                      ? "lanchoneteFinal"
                      : id === "aero-batalha"
                        ? "ritmo"
                        : id === "aero-transformacao"
                          ? "transformacao"
                          : id === "aero-lanchonete"
                            ? "lanchonete"
                            : id === "aero-arena"
                              ? "futebol"
                              : id === "aero-resgate"
                                ? "resgate"
                                : "queda",
    );
    if (id === "aero-pix-conta" && estado.aero?.etapa === "pagamento") {
      estado.aero.pix.tela = "conta";
      atualizarCelularPix(estado.aero, executarAcaoAlisaBank);
    }
    if (id === "aero-pix-camera" && estado.aero?.etapa === "pagamento") {
      estado.aero.pix.tela = "camera";
      atualizarCelularPix(estado.aero, executarAcaoAlisaBank);
    }
    return true;
  }
  if (id.startsWith("backrooms-")) {
    prepararFase(Number(id.at(-1)));
  } else if (["limbo", "sala", "toboga", "labirinto", "barco"].includes(id)) {
    iniciarAlisanave();
    avancarEtapaPorto(estado.porto, id);
    if (id === "barco") estado.porto.terminais.forEach((t) => (t.feito = true));
  } else iniciarCastelo(false, id);
  mostrarAviso(
    "TESTE · " +
      (elemento("faseTeste").selectedOptions?.[0]?.textContent || id),
    3,
  );
  return true;
}

// FASE 3 — o salão escuta os passos; as escadas conduzem ao portal.
function iniciarCastelo(reiniciar = false, etapaTeste = null) {
  if (cenaDoJogo?.carregarCastelo && !cenaDoJogo.castelo) {
    if (estado.carregandoCastelo) return;
    estado.carregandoCastelo = true;
    fecharJanelas();
    definirModo("loading");
    elemento("loading").hidden = false;
    cenaDoJogo
      .carregarCastelo()
      .then(() => {
        estado.carregandoCastelo = false;
        elemento("loading").hidden = true;
        if (estado.mode !== "loading") return;
        iniciarCastelo(reiniciar, etapaTeste);
      })
      .catch((erro) => {
        estado.carregandoCastelo = false;
        elemento("loading").textContent =
          "Falha ao carregar o castelo: " + erro.message;
      });
    return;
  }
  fecharJanelas();
  audio.pararYang?.();
  estado.castelo = criarEstadoCastelo();
  if (reiniciar) estado.castelo.etapa = "salao";
  if (etapaTeste) {
    estado.castelo.etapa = etapaTeste;
    if (etapaTeste === "escada") {
      estado.castelo.painelEscada = true;
      estado.castelo.jogador = { ...ROTA_ESCADARIA[0], yaw: 0, pitch: 0 };
    }
    if (["terraco", "previa"].includes(etapaTeste)) {
      estado.castelo.painelEscada =
        estado.castelo.painelPortal =
        estado.castelo.cjFalou =
          true;
    }
  }
  estado.agacharTeclado = estado.agacharControle = false;
  estado.runLocked = false;
  for (const nome of ["briga-castelo", "davy-escada", "cj", "breier"])
    audio.reiniciarArquivo?.(nome);
  definirModo("castelo");
  elemento("black").style.opacity = 0;
  elemento("damage").style.opacity = 0;
  for (const id of ["wanted", "mapButton", "crosshair"])
    elemento(id).hidden = true;
  mostrarLegenda(
    "AXEL: Um castelo… e gente discutindo lá dentro. Melhor passar sem fazer barulho.",
    6,
  );
}
function atualizarJogoCastelo(dt) {
  const f = estado.castelo;
  atualizarCastelo(f, dt, teclasPressionadas, estado.runLocked);
  elemento("hud").classList.toggle(
    "cinematica",
    ["chegada", "portal", "terraco", "previa"].includes(f.etapa),
  );
  elemento("previaAero").hidden = f.etapa !== "previa";
  if (
    f.etapa === "previa" ||
    (f.etapa === "terraco" && f.tempo >= TEMPOS_TERRACO.mergulho)
  ) {
    iniciarAero();
    return;
  }
  if (["terraco", "previa"].includes(f.etapa)) {
    elemento("prompt").hidden = true;
    for (const nome of ["briga-castelo", "davy-escada", "cj"])
      audio.pararArquivo?.(nome);
    if (f.etapa === "terraco") {
      if (f.tempo >= TEMPOS_TERRACO.estalo && !f.estaloTocado) {
        f.estaloTocado = true;
        audio.tocarTom(1500, 0.04, 0.2, "triangle", 450);
        audio.tocarRuido(0.035, 0.16, 2800);
      }
      if (f.tempo >= TEMPOS_TERRACO.fala && f.tempo < TEMPOS_TERRACO.explosao)
        audio.tocarArquivo?.("breier", "assets/breier-fala.m4a", 1);
      if (f.tempo >= TEMPOS_TERRACO.explosao && !f.explosaoTocada) {
        f.explosaoTocada = true;
        audio.pararArquivo?.("breier");
        audio.tocarImpacto();
        audio.tocarTom(42, 2.5, 0.35, "sine", 18);
        mostrarLegenda("AXEL: AS BOLAS ESTÃO EXPLODINDO!", 3);
      }
      if (f.tempo >= TEMPOS_TERRACO.mergulho && !f.mergulhoTocado) {
        f.mergulhoTocado = true;
        audio.tocarRuido(1.2, 0.25, 600);
        mostrarLegenda("Um outro mundo debaixo da água…", 4);
      }
    } else audio.pararArquivo?.("breier");
    return;
  }
  if (f.etapa === "salao") {
    const golpe = Math.floor((f.tempo - 1.2) / 6);
    if (golpe >= 0 && golpe !== f.ultimoGolpe) {
      f.ultimoGolpe = golpe;
      audio.tocarTom(70, 0.16, 0.12, "triangle", 30);
      audio.tocarRuido(0.1, 0.1, 650);
    }
  }
  elemento("furtividadeTexto").textContent = f.agachado
    ? "AGACHADO · PASSOS SILENCIOSOS"
    : "CTRL / ○ B PARA AGACHAR · NÃO FAÇA BARULHO";
  elemento("furtividadeNivel").style.width = f.suspeita * 100 + "%";
  elemento("furtividade").classList.toggle("perigo", f.suspeita > 0.6);
  elemento("prompt").hidden = [
    "chegada",
    "portal",
    "terraco",
    "previa",
  ].includes(f.etapa);
  elemento("prompt").querySelector("span").textContent =
    f.etapa === "salao" ? "PASSAGEM DA ESCADARIA" : "FALAR / ACESSAR PORTAL";
  if (f.etapa === "salao")
    audio.tocarArquivo?.(
      "briga-castelo",
      "assets/castelo-briga.m4a",
      0.65,
      true,
    );
  else audio.pararArquivo?.("briga-castelo");
  if (f.davyOuvido && !f.cjFalou) {
    audio.tocarArquivo?.("davy-escada", "assets/davy-jones-fala.m4a", 0.9);
    if (!f.avisoDavy) {
      f.avisoDavy = true;
      mostrarLegenda(
        "DAVY JONES: " + "Continue subindo. O portal fica no topo.",
        5,
      );
    }
  }
  if (f.littleVisto && !f.avisoLittle) {
    f.avisoLittle = true;
    mostrarLegenda(
      "LITTLE TAIL AMERICAN: Recebe essa! A bola é sua. O portal está logo acima.",
      5,
    );
  }
  if (f.cjFalou) audio.tocarArquivo?.("cj", "assets/cj-fala.m4a", 0.95);
  if (f.movendo) {
    f.tempoPasso -= dt;
    if (f.tempoPasso <= 0) {
      if (!f.agachado) audio.tocarPasso(f.correndo);
      f.tempoPasso = f.agachado ? 0.6 : f.correndo ? 0.28 : 0.46;
    }
  }
  if (f.alerta) {
    definirModo("result");
    elemento("resultTag").textContent = "CASTELO · VOCÊ FOI OUVIDO";
    elemento("resultTitle").textContent = "O salão inteiro ouviu seus passos.";
    elemento("resultText").textContent =
      "Pressione Ctrl ou ○/B para agachar. Contorne a discussão pelas laterais e não corra.";
    elemento("resultButton").dataset.action = "reiniciarCastelo";
    elemento("resultButton").textContent = "TENTAR O CASTELO NOVAMENTE";
    elemento("result").showModal();
  }
}
function interagirNoCastelo() {
  const f = estado.castelo;
  if (["chegada", "portal", "terraco", "previa"].includes(f.etapa)) return;
  const r = interagirCastelo(f);
  if (r.tipo === "desafio") {
    const d = DESAFIOS_CASTELO[r.id];
    estado.desafioCastelo = r.id;
    elemento("tituloPainelCastelo").textContent = d.titulo;
    elemento("codigoPainelCastelo").textContent = d.antes + " ___ " + d.depois;
    elemento("objetivoCastelo").textContent = d.objetivo;
    elemento("feedbackCastelo").textContent =
      "Leia o objetivo, compare as três soluções e escolha a que produz o resultado pedido. A simulação está pausada.";
    elemento("opcoesCastelo").replaceChildren();
    for (const opcao of d.opcoes) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "button secondary";
      b.textContent = opcao;
      b.addEventListener("click", () => {
        // Um segundo clique já enfileirado não pode pontuar novamente.
        if (r.id === 0 ? f.painelEscada : f.painelPortal) return;
        if (opcao === d.resposta) {
          if (r.id === 0) f.painelEscada = true;
          else f.painelPortal = true;
          estado.score += 100;
          elemento("feedbackCastelo").textContent = "Correto! " + d.explicacao;
          elemento("opcoesCastelo").replaceChildren();
          const continuar = document.createElement("button");
          continuar.type = "button";
          continuar.className = "button primary";
          continuar.textContent = "ENTENDI · CONTINUAR";
          continuar.addEventListener("click", () => {
            elemento("painelCastelo").close();
            definirModo("castelo");
          });
          elemento("opcoesCastelo").append(continuar);
          audio.tocarAcerto();
        } else
          elemento("feedbackCastelo").textContent =
            "Tente novamente. " + d.explicacao;
      });
      elemento("opcoesCastelo").append(b);
    }
    estado.previousMode = "castelo";
    definirModo("painelCastelo");
    elemento("painelCastelo").showModal();
  } else if (r.tipo === "escada")
    mostrarLegenda(
      "AXEL: Passei sem ser ouvido. Agora, subir até o portal.",
      5,
    );
  else if (r.tipo === "cj") {
    audio.pararArquivo?.("davy-escada");
    audio.tocarArquivo?.("cj", "assets/cj-fala.m4a", 0.95);
    mostrarLegenda(
      "CJ: O portal está atrás de mim. Ative a placa CSS para atravessar.",
      6,
    );
  } else if (r.tipo === "dica") mostrarLegenda(r.texto, 5);
}

function aplicarNomesNaInterface() {
  const textos = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let trecho;
  while ((trecho = textos.nextNode())) {
    if (trecho.parentElement?.closest("script, style")) continue;
    trecho.textContent = trecho.textContent
      .replace(/Sorvetete/g, NOMES.cachorro)
      .replace(/Brita/g, NOMES.amigo);
  }
}

window.addEventListener("error", (event) => {
  if (window.chrome?.webview)
    window.chrome.webview.postMessage({
      type: "render-error",
      message: event.message,
    });
});
async function inicializarJogo() {
  aplicarNomesNaInterface();
  try {
    cenaDoJogo = new CenaDoJogo(canvas);
    cenaDoJogo.renderer.debug.onShaderError = (
      gl,
      program,
      vertex,
      fragment,
    ) => {
      throw new Error(
        "Shader 3D: " +
          JSON.stringify({
            link: gl.getProgramParameter(program, gl.LINK_STATUS),
            vs: gl.getShaderParameter(vertex, gl.COMPILE_STATUS),
            fs: gl.getShaderParameter(fragment, gl.COMPILE_STATUS),
            nome: gl.getShaderSource(fragment)?.match(/SHADER_NAME[^\n]+/)?.[0],
          }) +
          " contexto=" +
          gl.isContextLost() +
          " erro=" +
          gl.getError() +
          " " +
          gl.getProgramInfoLog(program) +
          " " +
          gl.getShaderInfoLog(vertex) +
          " " +
          gl.getShaderInfoLog(fragment),
      );
    };
    await cenaDoJogo.carregar();
    await audio.carregarSomColeta?.();
    carregarOpcoes();
    interface2026 = montarInterface2026({
      estado,
      view: () => cenaDoJogo,
      acao: executarAcao,
      pular: pularCenaAtual,
      trocarMusica: selecionarMusicaMenu,
    });
    elemento("loading").hidden = true;
    prepararFase(0, true);
    const testeDireto = new URLSearchParams(window.location?.search || "").get(
      "teste",
    );
    if (testeDireto && !testeDireto.startsWith("menu-")) {
      if (
        [
          "aero",
          "aero-arena",
          "aero-resgate",
          "aero-programacao",
          "previa",
          "aero-transformacao",
          "aero-batalha",
          "aero-lanchonete",
          "aero-cozinha",
          "aero-refeicao",
          "aero-pix",
          "aero-pix-conta",
          "aero-agradecimento",
          "aero-pix-camera",
          "aero-peugeot",
          "aero-praia",
          "aero-volei",
        ].includes(testeDireto)
      )
        await cenaDoJogo.carregarAero();
      if (
        [
          "aero-transformacao",
          "aero-batalha",
          "aero-lanchonete",
          "aero-cozinha",
          "aero-refeicao",
          "aero-pix",
          "aero-pix-conta",
          "aero-agradecimento",
          "aero-pix-camera",
          "aero-peugeot",
        ].includes(testeDireto)
      )
        await cenaDoJogo.carregarComplementosAero();
      if (["aero-praia", "aero-volei"].includes(testeDireto))
        await cenaDoJogo.carregarPraia();
      if (["aero-praia", "aero-volei"].includes(testeDireto))
        window.exportarSpritesVolei = async () => {
          const { exportarSpritesVolei } =
            await import("./exportar-sprites-volei.js");
          await new Promise((resolve) => setTimeout(resolve, 700));
          await exportarSpritesVolei(cenaDoJogo.aero.praia);
        };
      if (testeDireto.startsWith("arc-")) await cenaDoJogo.carregarArcoplex();
      if (testeDireto.startsWith("lua-")) await cenaDoJogo.carregarLua();
      iniciarFaseTeste(testeDireto);
      const instante = Number(
        new URLSearchParams(location.search).get("instante"),
      );
      if (
        estado.aero &&
        Number.isFinite(instante) &&
        instante >= 0 &&
        instante < 300
      ) {
        estado.aero.tempo = instante;
        estado.aero.animacao = instante;
      }
      if (new URLSearchParams(location.search).get("captura") === "1")
        estado.capturaTeste = true;
    }
    if (testeDireto === "menu-opcoes") {
      executarAcao("options");
      document.querySelector('[data-category="graphics"]').click();
    }
    if (["menu-aero", "menu-noite"].includes(testeDireto)) {
      const select = elemento("temaMenu");
      select.value = testeDireto === "menu-aero" ? "aero" : "noite";
      select.dispatchEvent(new Event("change"));
    }
    requestAnimationFrame(executarQuadro);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (window.chrome?.webview)
          window.chrome.webview.postMessage({
            type: "ready",
            version: "2.25",
            webgl: true,
            mode: estado.mode,
            etapa: estado.aero?.etapa,
            triangles: cenaDoJogo.renderer.info.render.triangles,
          });
      }),
    );
  } catch (error) {
    console.error(error);
    elemento("loadText").textContent =
      "Não foi possível iniciar o 3D. " +
      error.message +
      " Abra pelo executável ou pelo endereço local com WebGL 2 habilitado.";
  }
}
inicializarJogo();
