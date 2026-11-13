import * as regrasFinal from "../dist/regras-final.js";
import * as regrasArc from "../dist/regras-arcoplex.js";
import * as falasArc from "../dist/falas-arcoplex.js";
import { ETAPAS_LUA, FALAS_LUA, falaLua, sonsLua } from "../dist/regras-lua.js";
import { acaoVolei, criarVolei } from "../dist/regras-volei.js";
import {
  acaoPix,
  formatarReais,
  NOME_NAV,
  reconhecerQrPix,
  QR_PONTO_KENTE,
} from "../dist/regras-alisabank.js";
import { pertoBalcaoPontoKente } from "../dist/regras-ponto-kente.js";
import {
  obterDesafioNovaFase,
  limitarPassoProgramacao,
  responderDesafioNovaFase,
  DESAFIOS_NOVAS_FASES,
} from "../dist/desafios-novas-fases.js";
import {
  criarBatalhaRitmo,
  acertarTrilha,
  desenharPistaRitmo,
  DURACAO_LOOP_FUNK,
} from "../dist/batalha-ritmo.js";
import {
  criarEstadoAero,
  atualizarAero,
  chutarBolaAero,
} from "../dist/regras-frutiger-aero.js";
import {
  dadosMinimapa,
  desenharMinimapa,
  desenharMapaSala,
} from "../dist/minimapa.js";
import {
  criarEstadoAlisanave,
  avancarEtapaPorto,
  atualizarRegrasPorto,
  interagirPorto,
  DESAFIOS_PORTO,
} from "../dist/regras-alisanave.js";
import { CONFIGURACAO, NOMES } from "../dist/configuracao.js";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import * as world from "../dist/mapas.js";
import * as challenges from "../dist/desafios.js";
import { criarColetaveis } from "../dist/coletaveis.js";
import {
  DURACAO_CENA_BRITA,
  momentoDaCenaBrita,
} from "../dist/sala-de-aula.js";
import { criarCorpoFisico } from "../dist/fisica-do-corpo.js";
import { Som } from "../dist/som.js";
import { ControlesGamepad } from "../dist/controles-gamepad.js";
import {
  criarEstadoCastelo,
  atualizarCastelo,
  interagirCastelo,
  DESAFIOS_CASTELO,
  ROTA_ESCADARIA,
  TEMPOS_TERRACO,
} from "../dist/regras-castelo.js";

test("áudio mantém o contrato da API do navegador ao iniciar", () => {
  const janelaAnterior = globalThis.window;
  let retomadas = 0;
  class ContextoAudioSimulado {
    createGain() {
      return { gain: { value: 0 }, connect() {} };
    }
    createOscillator() {
      return { frequency: { value: 0 }, connect() {}, start() {} };
    }
    resume() {
      retomadas++;
      return Promise.resolve();
    }
  }
  globalThis.window = { AudioContext: ContextoAudioSimulado };
  try {
    new Som().iniciar();
    assert.equal(retomadas, 1);
  } finally {
    globalThis.window = janelaAnterior;
  }
});

test("botão Iniciar História continua ligado ao atributo data-action do HTML", () => {
  const h = harness();
  h.run("definirModo('menu')");
  h.run(
    "document.click({target:{closest(seletor){return seletor==='[data-action]'?{dataset:{action:'new'}}:null;}}})",
  );
  assert.equal(h.run("estado.mode"), "menu");
  assert.equal(h.run("estado.chuteMenuAtivo"), true);
  h.run("atualizarJogo(3.81)");
  assert.equal(h.run("estado.mode"), "home");
});

test("chute do menu termina antes da história e cliques repetidos não o reiniciam", () => {
  const h = harness();
  h.run(
    "definirModo('menu');executarAcao('new');atualizarJogo(.7);executarAcao('new')",
  );
  assert.equal(h.run("estado.tempoChuteMenu"), 0.7);
  assert.equal(h.run("estado.mode"), "menu");
  h.run("atualizarJogo(.4)");
  assert.equal(h.run("estado.somChuteMenu"), true);
  h.run("atualizarJogo(2.8)");
  assert.equal(h.run("estado.mode"), "home");
  assert.equal(h.run("estado.chuteMenuAtivo"), false);
  assert.equal(h.el("black").style.opacity, 0);
});

test("logos GTA VI ficam distribuídos em corredores alcançáveis e são coletados uma vez", () => {
  for (let i = 0; i < 3; i++) {
    const level = world.criarFase(i),
      logos = criarColetaveis(level, i),
      field = world.calcularDistancias(level.map, level.spawn);
    assert.equal(logos.length, 12 + i * 4);
    for (const p of logos) {
      assert.ok(world.podeCaminhar(level.map, p.x, p.z));
      assert.ok(
        field[Math.floor(p.z / world.TAMANHO_CELULA)][
          Math.floor(p.x / world.TAMANHO_CELULA)
        ] >= 0,
      );
      for (const q of logos)
        if (q !== p) assert.ok(world.calcularDistancia(p, q) >= 7);
    }
  }
  const h = harness();
  h.run(
    "prepararFase(0);estado.stamina=20;estado.collectPlays=0;audio.tocarSomColeta=()=>estado.collectPlays++;estado.player.x=estado.level.collectibles[0].x;estado.player.z=estado.level.collectibles[0].z;atualizarJogo(.01)",
  );
  assert.ok(h.run("estado.stamina") > 29.9);
  assert.equal(h.run("estado.collectPlays"), 1);
  h.run("atualizarJogo(.01)");
  assert.equal(h.run("estado.collectPlays"), 1);
  assert.equal(h.run("estado.level.collectibles[0].used"), true);
});

test("efeito musical dura dois segundos e termina com fade-out", () => {
  const wav = fs.readFileSync(
    new URL("../dist/assets/gta-collect.wav", import.meta.url),
  );
  let offset = 12,
    pcm,
    rate,
    channels;
  while (offset + 8 <= wav.length) {
    const id = wav.toString("ascii", offset, offset + 4),
      size = wav.readUInt32LE(offset + 4);
    if (id === "fmt ") {
      channels = wav.readUInt16LE(offset + 10);
      rate = wav.readUInt32LE(offset + 12);
    }
    if (id === "data") pcm = wav.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + (size % 2);
  }
  assert.equal(pcm.length / (rate * channels * 2), 2);
  const rms = (start, end) => {
    let sum = 0,
      count = 0;
    for (
      let i = Math.floor(start * rate * channels) * 2;
      i < Math.floor(end * rate * channels) * 2;
      i += 2
    ) {
      sum += pcm.readInt16LE(i) ** 2;
      count++;
    }
    return Math.sqrt(sum / count);
  };
  assert.ok(rms(1.9, 2) < rms(0.3, 0.8) * 0.4);
});

test("Shift alterna corrida e pausa desliga a trava", () => {
  const h = harness();
  h.run(
    "prepararFase(0);alternarCorrida();teclasPressionadas.add('w');moverJogador(.1)",
  );
  assert.equal(h.run("estado.sprinting"), true);
  h.run(
    "teclasPressionadas.clear();teclasPressionadas.add('w');moverJogador(.1)",
  );
  assert.equal(h.run("estado.sprinting"), true);
  h.run("alternarCorrida();moverJogador(.1)");
  assert.equal(h.run("estado.sprinting"), false);
  h.run("alternarCorrida();pausarJogo()");
  assert.equal(h.run("estado.runLocked"), false);
});

test("cada fase tem no máximo três atividades e a recuperação não repete terminais", () => {
  for (let variant = 0; variant < 2; variant++)
    for (let chapter = 0; chapter < 3; chapter++) {
      const tasks = [
        challenges.obterDesafioTerminal(chapter, 0, variant),
        challenges.obterDesafioTerminal(chapter, 1, variant),
        challenges.obterDesafioRecuperacao(chapter),
      ];
      assert.equal(new Set(tasks.map((t) => t.title)).size, 3);
      for (const t of tasks) {
        assert.ok(["HTML", "CSS"].includes(t.language));
        assert.ok(challenges.validarResposta(t, t.solution).ok);
      }
    }
  const h = harness();
  h.run("prepararFase(0);estado.stamina=15;abrirDesafio()");
  h.el("codeInput").value = challenges.DESAFIOS_RECUPERACAO[0].solution;
  h.run(
    "enviarResposta({preventDefault(){}});fecharDesafio();estado.stamina=15;abrirDesafio()",
  );
  assert.equal(h.run("estado.mode"), "playing");
  assert.equal(h.run("estado.recoveryCount"), 1);
  h.run("atualizarJogo(.1)");
  assert.ok(h.run("estado.stamina") > 15);
});

test("captura por Maicon exibe a foto e limpa a sobreposição no resultado e reinício", () => {
  const h = harness();
  h.run(
    "prepararFase(0);estado.level.maicon={x:estado.player.x,z:estado.player.z,active:true,stun:0,whipCooldown:2};atualizarJogo(.01)",
  );
  assert.equal(h.run("estado.reason"), "maicon");
  assert.equal(h.el("maiconScare").hidden, false);
  h.run("atualizarJogo(1.6)");
  assert.equal(h.el("maiconScare").hidden, true);
  assert.match(h.el("resultTitle").textContent, /Maicon/);
  h.run("iniciarHistoria()");
  assert.equal(h.el("maiconScare").hidden, true);
});

test("SENAI e cansaço não mostram a foto exclusiva de Maicon", () => {
  const h = harness();
  for (const reason of ["senai", "stamina"]) {
    h.run(`prepararFase(0);capturarJogador('${reason}')`);
    assert.equal(h.el("maiconScare").hidden, true);
  }
  assert.ok(
    fs.existsSync(
      new URL("../dist/assets/maicon-jumpscare.png", import.meta.url),
    ),
  );
});

test("ragdoll recebe impulso, mantém articulações e colide com o chão", () => {
  const body = criarCorpoFisico();
  body.reset([0, 1, 0], [2, 4, 0.2]);
  const lengths = body.links.map(([a, b]) =>
    Math.hypot(...body.nodes[a].p.map((v, k) => v - body.nodes[b].p[k])),
  );
  for (let i = 0; i < 600; i++) body.step(1 / 120);
  assert.ok(body.nodes[0].p[0] > 1);
  for (const n of body.nodes) {
    assert.ok(n.p.every(Number.isFinite));
    assert.ok(n.p[1] >= 0.089);
  }
  body.links.forEach(([a, b], i) => {
    const length = Math.hypot(
      ...body.nodes[a].p.map((v, k) => v - body.nodes[b].p[k]),
    );
    assert.ok(Math.abs(length - lengths[i]) < 0.025);
  });
});

test("resgate exige falar com Brita, escapar dos três setores, libertá-lo e buscar a Biz", () => {
  const h = harness();
  h.run("entrarNoCalabouco(false);estado.player={x:0,z:7,yaw:0};interagir()");
  assert.equal(h.run("estado.mode"), "dungeon");
  h.run("estado.player.z=-.7;interagir();estado.player.z=7;interagir()");
  assert.equal(h.run("estado.mode"), "playing");
  h.run("entrarNoCalabouco(true);estado.player={x:-4,z:-5,yaw:0};interagir()");
  assert.equal(h.run("estado.mode"), "dungeon");
  h.run(
    "estado.player={x:0,z:-.7,yaw:0};interagir();estado.player={x:-4,z:-5,yaw:0};interagir()",
  );
  assert.equal(h.run("estado.mode"), "ride");
  h.run("pausarJogo();atualizarJogo(15)");
  assert.equal(h.run("estado.dungeonTime"), 0);
  h.run("continuarJogo();atualizarJogo(12.1)");
  assert.equal(h.run("estado.mode"), "result");
  assert.match(h.el("resultText").textContent, /garupa/);
});
function harness() {
  const elements = new Map();
  function el(id) {
    if (!elements.has(id))
      elements.set(id, {
        id,
        textContent: "",
        value: "",
        innerHTML: "",
        style: {},
        dataset: {},
        hidden: false,
        open: false,
        disabled: false,
        children: [],
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener(name, fn) {
          this[name] = fn;
        },
        setAttribute() {},
        focus() {},
        close() {
          this.open = false;
        },
        showModal() {
          this.open = true;
        },
        querySelectorAll() {
          return [];
        },
        querySelector() {
          return el(id + "child");
        },
        replaceChildren() {
          this.children = [];
        },
        append(c) {
          this.children.push(c);
        },
        getContext() {
          return new Proxy({}, { get: () => () => {} });
        },
      });
    return elements.get(id);
  }
  const dialogs = [
      "pause",
      "help",
      "credits",
      "map",
      "editor",
      "result",
      "painelProgramacao",
      "celularPix",
    ].map(el),
    document = {
      getElementById: el,
      querySelectorAll: (s) =>
        s === "dialog"
          ? dialogs
          : s === "dialog[open]"
            ? dialogs.filter((d) => d.open)
            : [],
      createElement: () => el("button" + Math.random()),
      addEventListener(nome, funcao) {
        this[nome] = funcao;
      },
      exitPointerLock() {},
    };
  const context = vm.createContext({
    ...regrasFinal,
    atualizarMidiaFinal() {},
    ...regrasArc,
    ...falasArc,
    ETAPAS_LUA,
    FALAS_LUA,
    falaLua,
    sonsLua,
    acaoVolei,
    criarVolei,
    reconhecerQrPix,
    QR_PONTO_KENTE,
    acaoPix,
    formatarReais,
    NOME_NAV,
    obterDesafioNovaFase,
    limitarPassoProgramacao,
    responderDesafioNovaFase,
    pertoBalcaoPontoKente,
    ...world,
    ...challenges,
    criarBatalhaRitmo,
    acertarTrilha,
    desenharPistaRitmo,
    DURACAO_LOOP_FUNK,
    criarEstadoAero,
    atualizarAero,
    chutarBolaAero,
    criarEstadoAlisanave,
    avancarEtapaPorto,
    criarEstadoCastelo,
    atualizarCastelo,
    interagirCastelo,
    DESAFIOS_CASTELO,
    ROTA_ESCADARIA,
    TEMPOS_TERRACO,
    ControlesGamepad,
    atualizarRegrasPorto,
    interagirPorto,
    DESAFIOS_PORTO,
    dadosMinimapa,
    desenharMinimapa,
    desenharMapaSala,
    CONFIGURACAO,
    NOMES,
    criarColetaveis,
    DURACAO_CENA_BRITA,
    momentoDaCenaBrita,
    document: Object.assign(document, {
      body: { classList: { toggle() {}, remove() {}, add() {} } },
    }),
    window: { addEventListener() {} },
    matchMedia: () => ({ matches: false }),
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    setTimeout() {},
    console,
    localStorage: { getItem() {}, setItem() {} },
    Som: class {
      iniciar() {}
      tocarTom() {}
      tocarRuido() {}
      tocarAcerto() {}
      tocarImpacto() {}
      tocarAmeaca() {}
      tocarLatido() {}
      tocarArquivo(nome, arquivo, volume = 1) {
        if (
          !arquivo?.startsWith("assets/") ||
          typeof volume !== "number" ||
          !Number.isFinite(volume)
        )
          throw new Error("Argumentos de áudio inválidos: " + nome);
      }
      tocarPasso() {}
      tocarBatimento() {}
    },
    CenaDoJogo: class {
      constructor() {
        this.cachorro = { group: { rotation: { set() {} } } };
      }
      montarFase() {}
      reiniciarSala() {}
    },
  });
  const source = fs
    .readFileSync(new URL("../dist/jogo.js", import.meta.url), "utf8")
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*/gm, "")
    .replace(/\ninicializarJogo\(\);\s*$/, "");
  const ui = fs
    .readFileSync(new URL("../dist/alisabank-ui.js", import.meta.url), "utf8")
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*/gm, "")
    .replace(/^export /gm, "");
  vm.runInContext(ui, context);
  vm.runInContext(source, context);
  vm.runInContext("cenaDoJogo=new CenaDoJogo()", context);
  return { run: (s) => vm.runInContext(s, context), el };
}

test("seis desafios fáceis usam apenas HTML/CSS e oferecem a solução entre as escolhas", () => {
  for (const row of challenges.DESAFIOS_TERMINAIS)
    for (const c of row) {
      assert.ok(["HTML", "CSS"].includes(c.language));
      assert.equal(c.choices.length, 3);
      assert.ok(c.choices.includes(c.solution));
      assert.equal(challenges.validarResposta(c, c.solution).ok, true);
      assert.equal(challenges.validarResposta(c, "errado").ok, false);
    }
});
test("cores equivalentes são aceitas e tags incompletas são rejeitadas", () => {
  assert.equal(
    challenges.validarResposta(challenges.DESAFIOS_TERMINAIS[1][0], " #F00 ")
      .ok,
    true,
  );
  assert.equal(
    challenges.validarResposta(challenges.DESAFIOS_TERMINAIS[0][0], "<H1>").ok,
    true,
  );
  assert.equal(
    challenges.validarResposta(challenges.DESAFIOS_TERMINAIS[0][0], "<h1").ok,
    false,
  );
  assert.equal(
    challenges.validarResposta(challenges.DESAFIOS_TERMINAIS[0][0], "").ok,
    false,
  );
});
test("recuperação também usa atividades fáceis, sem expressões JavaScript", () => {
  for (let c = 0; c < 3; c++)
    for (let n = 0; n < 8; n++) {
      const q = challenges.obterDesafioRecuperacao(c, n);
      assert.equal(challenges.validarResposta(q, q.solution).ok, true);
      assert.ok(q.choices.length === 3);
    }
});
test("os três mapas são amplos, fechados e todos os objetivos são alcançáveis", () => {
  for (let c = 0; c < 3; c++) {
    const l = world.criarFase(c),
      f = world.calcularDistancias(l.map, l.spawn);
    assert.ok(l.width >= 33 && l.height >= 31);
    assert.ok(l.cells.length > 500);
    for (const p of [...l.terminals, l.exit, l.maiconSpawn, l.enemy]) {
      assert.ok(world.podeCaminhar(l.map, p.x, p.z));
      assert.ok(
        f[Math.floor(p.z / world.TAMANHO_CELULA)][
          Math.floor(p.x / world.TAMANHO_CELULA)
        ] >= 0,
      );
    }
    assert.ok(l.map[0].every((v) => v === 1));
    assert.ok(l.map.at(-1).every((v) => v === 1));
    assert.equal(world.podeCaminhar(l.map, -1, 0), false);
  }
});
test("as três primeiras fases dão vantagem de velocidade e tempo ao jogador", () => {
  for (const c of world.FASES) {
    assert.ok(c.enemySpeed < world.REGRAS.walk);
    assert.ok(c.chargeSpeed < world.REGRAS.sprint);
    assert.ok(c.spawnDelay >= 25);
  }
});
test("a perseguição chega ao jogador sem cruzar as paredes", () => {
  for (let c = 0; c < 3; c++) {
    const l = world.criarFase(c),
      f = world.calcularDistancias(l.map, l.spawn),
      enemy = l.enemy;
    let steps = 0;
    while (world.calcularDistancia(enemy, l.spawn) > 0.5 && steps++ < 6000) {
      world.perseguirJogador(
        enemy,
        l.spawn,
        l.map,
        f,
        1 / 60,
        world.FASES[c].enemySpeed,
      );
      assert.ok(world.podeCaminhar(l.map, enemy.x, enemy.z, 0.2));
    }
    assert.ok(steps < 6000);
  }
});
test("os Arduinos aumentam em faixas de dez metros", () => {
  for (const [d, w] of [
    [50, 0],
    [49, 1],
    [39, 2],
    [29, 3],
    [19, 4],
    [9, 5],
    [0, 5],
  ])
    assert.equal(world.calcularArduinos(d), w);
});
test("prólogo exige PS5 e sofá, seguido das duas cenas 3D e chegada ao jogo", () => {
  const h = harness();
  h.run("iniciarHistoria()");
  assert.equal(h.run("estado.mode"), "home");
  h.run("interagir();atualizarJogo(5.5);interagir()");
  assert.equal(h.run("estado.homeQuest"), "sofa");
  h.run("estado.player.z=1.4;interagir()");
  assert.equal(h.run("estado.mode"), "fall");
  h.run("atualizarJogo(8)");
  assert.equal(h.run("estado.mode"), "classroom");
  h.run("atualizarJogo(15.1)");
  assert.equal(h.run("estado.mode"), "dungeon");
  h.run(
    "estado.player={x:0,z:-.7,yaw:0};interagir();estado.player.z=7;interagir()",
  );
  assert.equal(h.run("estado.mode"), "playing");
  assert.equal(h.run("estado.chapter"), 0);
});
test("Brita tem os momentos de bolo, entrada do professor, surpresa, golpe e portal", () => {
  assert.deepEqual([1, 4, 6, 7.1, 10, 14].map(momentoDaCenaBrita), [
    "cake",
    "teacher",
    "surprise",
    "punch",
    "portal",
    "dimension",
  ]);
});
test("Maicon é arremessado e passa a perseguir após pousar", () => {
  const h = harness();
  h.run("prepararFase(0);arremessarMaicon()");
  assert.equal(h.run("estado.throwing"), true);
  for (let i = 0; i < 42; i++) h.run("atualizarJogo(.04)");
  assert.equal(h.run("estado.throwing"), false);
  assert.equal(h.run("estado.level.maicon.active"), true);
  assert.ok(
    h.run(
      "podeCaminhar(estado.level.map,estado.level.maicon.x,estado.level.maicon.z)",
    ),
  );
});
test("atividade pode ser resolvida clicando em uma opção; restaura fôlego e ativa um único criarTerminal", () => {
  const h = harness();
  h.run("prepararFase(0);estado.stamina=20;abrirDesafio(0)");
  assert.equal(h.el("choices").children.length, 3);
  h.el("choices").children[0].click();
  assert.equal(h.el("codeInput").value, "<h1>");
  h.run("enviarResposta({preventDefault(){}})");
  assert.equal(h.run("estado.stamina"), 45);
  assert.equal(h.run("estado.totalTerminals"), 1);
  assert.equal(h.run("estado.score"), 100);
  h.run("enviarResposta({preventDefault(){}})");
  assert.equal(h.run("estado.score"), 100);
});
test("erros explicam a resposta e recuperação não libera terminais", () => {
  const h = harness();
  h.run("prepararFase(0);estado.stamina=10;abrirDesafio()");
  h.el("codeInput").value = "errado";
  for (let i = 0; i < 3; i++) h.run("enviarResposta({preventDefault(){}})");
  assert.match(h.el("hintText").textContent, /Exemplo/);
  h.el("codeInput").value = challenges.DESAFIOS_RECUPERACAO[0].solution;
  h.run("enviarResposta({preventDefault(){}})");
  assert.equal(h.run("estado.stamina"), 45);
  assert.equal(h.run("estado.totalTerminals"), 0);
});
test("mapa e pausa congelam a simulação", () => {
  const h = harness();
  h.run("prepararFase(0);abrirMapa();atualizarJogo(20)");
  assert.equal(h.run("estado.elapsed"), 0);
  h.run("fecharMapa();pausarJogo();atualizarJogo(20)");
  assert.equal(h.run("estado.stamina"), 45);
  h.run("continuarJogo()");
  assert.equal(h.run("estado.mode"), "playing");
});

test("gamepad integrado move, gira, alterna corrida e pausa ao desconectar", () => {
  const h = harness();
  h.run(`document.querySelector=()=>null;
    prepararFase(0);estado.inicioPad={...estado.player};
    estado.pad={connected:true,index:0,mapping:'standard',id:'DualSense simulado',axes:[0,-1,.6,.3],buttons:Array.from({length:17},(_,i)=>({pressed:i===10,value:i===10?1:0}))};
    globalThis.navigator={getGamepads:()=>estado.pad?[estado.pad]:[]};
    atualizarEntradaControle(.05);moverJogador(.05);`);
  assert.equal(h.run("estado.runLocked"), true);
  assert.equal(h.run("estado.sprinting"), true);
  assert.notEqual(h.run("estado.player.yaw"), h.run("estado.inicioPad.yaw"));
  assert.notEqual(h.run("estado.player.z"), h.run("estado.inicioPad.z"));
  h.run("estado.pad=null;atualizarEntradaControle(.02)");
  assert.equal(h.run("estado.mode"), "paused");
  assert.equal(h.run("estado.runLocked"), false);
});

test("botão de interação do gamepad abre um terminal uma vez", () => {
  const h = harness();
  h.run(`document.querySelector=()=>null;prepararFase(0);estado.player={...estado.level.terminals[0],yaw:0,pitch:0};
    globalThis.navigator={getGamepads:()=>[{connected:true,index:0,mapping:'standard',id:'DualShock simulado',axes:[0,0,0,0],buttons:Array.from({length:17},(_,i)=>({pressed:i===0,value:i===0?1:0}))}]};
    atualizarEntradaControle(.02);`);
  assert.equal(h.run("estado.mode"), "editor");
  assert.equal(h.el("editor").open, true);
});
test("SENAI captura, fôlego pode acabar e reinício apaga a pontuação", () => {
  const h = harness();
  h.run(
    "prepararFase(0);estado.elapsed=40;estado.level.enemy.x=estado.player.x;estado.level.enemy.z=estado.player.z;atualizarJogo(.01)",
  );
  assert.equal(h.run("estado.mode"), "caught");
  h.run("atualizarJogo(2)");
  assert.equal(h.run("estado.mode"), "result");
  h.run(
    "prepararFase(0);estado.autoUsed=true;estado.stamina=.001;estado.shiftToggle=false;teclasPressionadas.add('w');teclasPressionadas.add('Shift');atualizarJogo(.1)",
  );
  assert.equal(h.run("estado.reason"), "stamina");
  h.run("estado.score=800;iniciarHistoria()");
  assert.equal(h.run("estado.score"), 0);
  assert.equal(h.run("estado.mode"), "home");
});
test("Alisanave pausa nos três exercícios e o castelo termina na prévia Frutiger Aero", () => {
  const h = harness();
  h.run(
    "iniciarAlisanave();estado.porto.etapa='labirinto';estado.porto.contagem=9",
  );
  for (let indice = 0; indice < 3; indice++) {
    h.run(
      `estado.porto.jogador={...estado.porto.terminais[${indice}],yaw:0};interagirAlisanave()`,
    );
    assert.equal(h.run("estado.mode"), "painelPorto");
    h.run("atualizarJogo(20)");
    assert.equal(h.run("estado.porto.contagem"), 9);
    const resposta = DESAFIOS_PORTO[indice].resposta;
    h.el("opcoesPainelPorto")
      .children.find((b) => b.textContent === resposta)
      .click();
    assert.equal(h.run("estado.mode"), "alisanave");
    assert.equal(h.run(`estado.porto.terminais[${indice}].feito`), true);
  }
  h.run(
    "estado.porto.jogador={...estado.porto.saida,yaw:0};interagirAlisanave()",
  );
  assert.equal(h.run("estado.porto.etapa"), "barco");
  h.run("atualizarJogo(20.1)");
  assert.equal(h.run("estado.mode"), "castelo");
  h.run(
    "atualizarJogo(10.1);estado.castelo.jogador={x:-9,y:0,z:-9,yaw:0};interagir()",
  );
  assert.equal(h.run("estado.mode"), "painelCastelo");
  h.el("opcoesCastelo")
    .children.find((b) => b.textContent === DESAFIOS_CASTELO[0].resposta)
    .click();
  h.run(
    "elemento('opcoesCastelo').children[0].click();interagir();estado.castelo.jogador={...ROTA_ESCADARIA.at(-1),yaw:0};interagir();interagir()",
  );
  assert.equal(h.run("estado.castelo.cjFalou"), true);
  h.el("opcoesCastelo")
    .children.find((b) => b.textContent === DESAFIOS_CASTELO[1].resposta)
    .click();
  h.run(
    "elemento('opcoesCastelo').children[0].click();interagir();atualizarJogo(3.1)",
  );
  assert.equal(h.run("estado.castelo.etapa"), "terraco");
  h.run("atualizarJogo(58)");
  assert.equal(h.run("estado.aero.etapa"), "queda");
  assert.equal(h.run("estado.mode"), "aero");
  assert.equal(h.run("estado.score"), 500);
});

test("seis terminais e as três saídas levam à Alisanave e o novo portal não retorna ao resgate", () => {
  const h = harness();
  h.run("estado.score=0;estado.totalTerminals=0");
  for (let chapter = 0; chapter < 3; chapter++) {
    h.run(`prepararFase(${chapter})`);
    for (let index = 0; index < 2; index++) {
      h.run(`abrirDesafio(${index})`);
      h.el("codeInput").value =
        challenges.DESAFIOS_TERMINAIS[chapter][index].solution;
      h.run("enviarResposta({preventDefault(){}});fecharDesafio()");
    }
    h.run("concluirFase()");
  }
  assert.equal(h.run("estado.mode"), "alisanave");
  h.run(
    'estado.porto.concluido=true;atualizarJogo(.01);estado.castelo.etapa="portal";estado.castelo.tempo=0;atualizarJogo(3.1)',
  );
  assert.equal(h.run("estado.castelo.etapa"), "terraco");
  assert.equal(h.run("estado.mode"), "castelo");
  assert.equal(h.run("estado.totalTerminals"), 6);
});

test("castelo pausa o relógio da cutscene e retoma sem disparar explosão na pausa", () => {
  const h = harness();
  h.run(
    'iniciarCastelo();estado.castelo.etapa="terraco";estado.castelo.tempo=45;atualizarJogo(.1);pausarJogo()',
  );
  const tempo = h.run("estado.castelo.tempo"),
    animacao = h.run("estado.castelo.animacao");
  h.run("atualizarJogo(20)");
  assert.equal(h.run("estado.castelo.tempo"), tempo);
  assert.equal(h.run("estado.castelo.animacao"), animacao);
  assert.equal(h.run("Boolean(estado.castelo.explosaoTocada)"), false);
  h.run("continuarJogo();atualizarJogo(1)");
  assert.equal(h.run("estado.castelo.explosaoTocada"), true);
});
test("resposta do castelo pontua uma vez mesmo com clique duplo enfileirado", () => {
  const h = harness();
  h.run(
    "iniciarCastelo(true);estado.score=0;estado.castelo.jogador={...ROTA_ESCADARIA[0],yaw:0};interagir()",
  );
  const resposta = h
    .el("opcoesCastelo")
    .children.find((b) => b.textContent === DESAFIOS_CASTELO[0].resposta);
  resposta.click();
  resposta.click();
  assert.equal(h.run("estado.score"), 100);
  assert.equal(h.el("opcoesCastelo").children.length, 1);
  assert.match(h.el("feedbackCastelo").textContent, /Correto!/);
});
test("a fala de Davy não volta a sobrepor a fala do CJ no patamar final", () => {
  const h = harness();
  h.run(
    'iniciarCastelo(true);globalThis.clipes=[];audio.tocarArquivo=(nome)=>clipes.push(nome);estado.castelo.etapa="escada";estado.castelo.davyOuvido=true;estado.castelo.cjFalou=true;atualizarJogo(.04)',
  );
  assert.equal(h.run('clipes.includes("davy-escada")'), false);
  assert.equal(h.run('clipes.includes("cj")'), true);
});

test("seletor inicia os três setores das Backrooms com estado limpo", () => {
  const h = harness();
  for (let i = 0; i < 3; i++) {
    h.run(
      `estado.score=999;estado.runLocked=true;iniciarFaseTeste('backrooms-${i}')`,
    );
    assert.equal(h.run("estado.mode"), "playing");
    assert.equal(h.run("estado.chapter"), i);
    assert.equal(h.run("estado.score"), 0);
    assert.equal(h.run("estado.totalTerminals"), 0);
    assert.equal(h.run("estado.runLocked"), false);
  }
});
test("seletor abre cada etapa de Alisanave e prepara o barco sem desafios pendentes", () => {
  const h = harness();
  for (const id of ["limbo", "sala", "toboga", "labirinto", "barco"]) {
    h.run(`iniciarFaseTeste('${id}')`);
    assert.equal(h.run("estado.mode"), "alisanave");
    assert.equal(h.run("estado.porto.etapa"), id);
    assert.equal(h.run("estado.porto.tempo"), 0);
  }
  assert.equal(h.run("estado.porto.terminais.every(t=>t.feito)"), true);
  h.run("iniciarFaseTeste('labirinto')");
  assert.equal(h.run("estado.porto.terminais.some(t=>t.feito)"), false);
  assert.ok(h.run("estado.porto.contagem") > 0);
});
test("seletor abre castelo, escadaria, terraço e prévia sem herdar progresso", () => {
  const h = harness();
  for (const id of ["chegada", "salao", "escada", "terraco"]) {
    h.run(`iniciarFaseTeste('${id}')`);
    assert.equal(h.run("estado.mode"), "castelo");
    assert.equal(h.run("estado.castelo.etapa"), id);
    assert.equal(h.run("estado.castelo.tempo"), 0);
  }
  h.run("iniciarFaseTeste('escada')");
  assert.equal(h.run("estado.castelo.painelEscada"), true);
  assert.equal(h.run("estado.castelo.painelPortal"), false);
  h.run("iniciarFaseTeste('quarto')");
  assert.equal(h.run("estado.mode"), "home");
  assert.equal(h.run("iniciarFaseTeste('invalido')"), false);
  assert.equal(h.run("estado.mode"), "home");
});

test("atalho do terraço preserva o destino depois do carregamento assíncrono", async () => {
  const h = harness();
  h.run(
    "cenaDoJogo.castelo=null;cenaDoJogo.carregarCastelo=()=>{cenaDoJogo.castelo={};return Promise.resolve()};iniciarFaseTeste('terraco')",
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.run("estado.mode"), "castelo");
  assert.equal(h.run("estado.castelo.etapa"), "terraco");
});

test("atalhos Aero iniciam resgate e futebol, e a pausa congela a bola", () => {
  const h = harness();
  for (const [id, etapa] of [
    ["aero", "queda"],
    ["aero-resgate", "resgate"],
    ["aero-arena", "futebol"],
  ]) {
    h.run(`iniciarFaseTeste('${id}')`);
    assert.equal(h.run("estado.mode"), "aero");
    assert.equal(h.run("estado.aero.etapa"), etapa);
  }
  h.run("estado.aero.bola.vx=5;pausarJogo()");
  const x = h.run("estado.aero.bola.x");
  h.run("atualizarJogo(8)");
  assert.equal(h.run("estado.aero.bola.x"), x);
  h.run("continuarJogo();atualizarJogo(.1)");
  assert.notEqual(h.run("estado.aero.bola.x"), x);
});

test("seletor abre transformação, batalha e lanchonete diretamente", () => {
  const h = harness();
  for (const [id, etapa] of [
    ["aero-transformacao", "transformacao"],
    ["aero-batalha", "ritmo"],
    ["aero-lanchonete", "lanchonete"],
    ["aero-cozinha", "lanchoneteExplorar"],
    ["aero-refeicao", "lanchoneteFinal"],
  ]) {
    h.run(`iniciarFaseTeste('${id}')`);
    assert.equal(h.run("estado.mode"), "aero");
    assert.equal(h.run("estado.aero.etapa"), etapa);
  }
});
test("a pausa congela a batalha e o reinício não repete o futebol", () => {
  const h = harness();
  h.run(
    "iniciarFaseTeste('aero-batalha');estado.aero.golsAxel=5;estado.aero.ritmo.tempo=1;pausarJogo();atualizarJogo(10)",
  );
  assert.equal(h.run("estado.aero.ritmo.tempo"), 1);
  h.run(
    "continuarJogo();estado.aero.etapa='derrotaRitmo';executarAcao('repetirRitmo')",
  );
  assert.equal(h.run("estado.aero.etapa"), "ritmo");
  assert.equal(h.run("estado.aero.ritmo.tempo"), -3);
  assert.equal(h.run("estado.aero.golsAxel"), 5);
});

test("o controle acerta a trilha L1 uma vez e permite repetir após a derrota", () => {
  const h = harness();
  h.run(`document.querySelector=()=>null;iniciarFaseTeste('aero-batalha');estado.aero.ritmo.tempo=estado.aero.ritmo.notas[0].tempo;
 globalThis.padRitmo={connected:true,index:0,mapping:'standard',id:'Controle simulado',axes:[0,0,0,0],buttons:Array.from({length:17},(_,i)=>({pressed:i===4,value:i===4?1:0}))};
 globalThis.navigator={getGamepads:()=>[padRitmo]};atualizarEntradaControle(.016);atualizarEntradaControle(.016);`);
  assert.equal(h.run("estado.aero.ritmo.acertos"), 1);
  h.run(
    "estado.aero.etapa='derrotaRitmo';padRitmo.buttons[4]={pressed:false,value:0};padRitmo.buttons[0]={pressed:true,value:1};atualizarEntradaControle(.016)",
  );
  assert.equal(h.run("estado.aero.etapa"), "ritmo");
  assert.equal(h.run("estado.aero.ritmo.tempo"), -3);
});

test("exploração da lanchonete pausa sem avançar para uma viagem", () => {
  const h = harness();
  h.run(
    "iniciarFaseTeste('aero-cozinha');atualizarJogo(13);pausarJogo();atualizarJogo(30)",
  );
  assert.equal(h.run("estado.aero.tempo"), 13);
  h.run("continuarJogo();atualizarJogo(50)");
  assert.equal(h.run("estado.aero.etapa"), "lanchoneteExplorar");
  assert.equal(h.run("estado.mode"), "aero");
  assert.equal(h.run("iniciarFaseTeste('aero-viagem')"), false);
  assert.equal(h.run("iniciarFaseTeste('aero-pizzaria')"), false);
});

test("terminal pausa a cena, explica o acerto e só retoma ao confirmar", () => {
  const h = harness();
  h.run("iniciarFaseTeste('aero-lanchonete');atualizarJogo(20)");
  assert.equal(h.run("estado.mode"), "painelProgramacao");
  assert.equal(h.run("estado.aero.tempo"), 9);
  const anim = h.run("estado.aero.animacao");
  h.run("atualizarJogo(20)");
  assert.equal(h.run("estado.aero.animacao"), anim);
  assert.match(h.el("codigoProgramacao").textContent, /<form>/);
  const antes = h.run("estado.score");
  const errado = h.el("opcoesProgramacao").children[1];
  errado.click();
  assert.equal(h.run("estado.score"), antes);
  assert.match(h.el("feedbackProgramacao").textContent, /Ainda não/);
  const correto = h.el("opcoesProgramacao").children[0];
  correto.click();
  correto.click();
  assert.equal(h.run("estado.score"), antes + 100);
  assert.equal(h.run("estado.mode"), "painelProgramacao");
  assert.match(h.el("feedbackProgramacao").textContent, /submit/);
  h.el("continuarProgramacao").onclick();
  assert.equal(h.run("estado.mode"), "aero");
  h.run("atualizarJogo(34)");
  assert.equal(h.run("estado.aero.etapa"), "lanchoneteExplorar");
});
test("sair do terminal para o menu invalida botões antigos", () => {
  const h = harness();
  h.run("iniciarFaseTeste('aero-lanchonete');atualizarJogo(9)");
  const antigo = h.el("opcoesProgramacao").children[1];
  h.run("mostrarMenu()");
  const score = h.run("estado.score");
  antigo.click();
  assert.equal(h.run("estado.mode"), "menu");
  assert.equal(h.run("estado.score"), score);
});

test("atalho de programação abre imediatamente o terminal da arena", () => {
  const h = harness();
  assert.equal(h.run("iniciarFaseTeste('aero-programacao')"), true);
  assert.equal(h.run("estado.mode"), "painelProgramacao");
  assert.equal(h.run("estado.aero.etapa"), "entrada");
  assert.match(h.el("tituloProgramacao").textContent, /placar/);
});

test("painel da cozinha exige chegar ao balcão e só serve os lanches após a resposta", () => {
  const h = harness();
  h.run("iniciarFaseTeste('aero-cozinha');interagir()");
  assert.equal(h.run("estado.mode"), "aero");
  h.run("estado.aero.jogador.x=.35;estado.aero.jogador.z=-3.1;interagir()");
  assert.equal(h.run("estado.mode"), "painelProgramacao");
  assert.match(h.el("tituloProgramacao").textContent, /fila/);
  h.el("opcoesProgramacao").children[1].click();
  h.el("continuarProgramacao").onclick();
  h.run("atualizarJogo(.1)");
  assert.equal(h.run("estado.aero.etapa"), "lanchoneteFinal");
});

test("captura de ponteiro tolera liberação do mouse e não é ativada na refeição", () => {
  const h = harness();
  assert.equal(
    h.run(
      "capturarPonteiroSeguro({setPointerCapture(){const e=new Error();e.name='InvalidStateError';throw e;}},{pointerId:1})",
    ),
    false,
  );
  h.run(
    "iniciarFaseTeste('aero-refeicao');globalThis.capturas=0;canvas.setPointerCapture=()=>capturas++;canvas.pointerdown({pointerId:1,pointerType:'touch',clientX:0,clientY:0})",
  );
  assert.equal(h.run("capturas"), 0);
});

test("o minimapa da lanchonete usa a planta do restaurante", () => {
  const h = harness();
  h.run("iniciarFaseTeste('aero-cozinha');atualizarMinimapaFixo(1000)");
  assert.match(h.el("tituloMinimapa").textContent, /PONTO KENTE/);
  assert.doesNotMatch(h.el("tituloMinimapa").textContent, /ARENA/);
});

test("o jogador opera o celular inteiro e mostra o comprovante antes de sair", () => {
  const h = harness();
  h.run("iniciarFaseTeste('aero-pix')");
  assert.equal(h.el("celularPix").open, true);
  const todos = () => {
    const a = [];
    const v = (e) => {
      a.push(e);
      for (const f of e.children || []) v(f);
    };
    v(h.el("telaAlisaBank"));
    return a;
  };
  const clicar = (texto) => {
    const b = todos().find(
      (e) => typeof e.click === "function" && e.textContent.includes(texto),
    );
    assert.ok(b, texto);
    b.click();
    return b;
  };
  clicar("AlisaBank");
  assert.match(
    todos()
      .map((e) => e.textContent)
      .join(" "),
    /Naverdachi da Silva Pereira/,
  );
  clicar("Pix");
  clicar("Escanear QR code");
  assert.equal(h.run("estado.aero.pix.tela"), "camera");
  h.run(
    "reconhecerQrPix(estado.aero.pix,QR_PONTO_KENTE,.3);reconhecerQrPix(estado.aero.pix,QR_PONTO_KENTE,.3);atualizarJogo(.01)",
  );
  const pagar = clicar("Confirmar pagamento");
  pagar.click();
  assert.equal(h.run("estado.aero.pix.saldo"), 128998);
  assert.equal(h.run("estado.aero.etapa"), "pagamento");
  clicar("Mostrar comprovante");
  h.run("atualizarJogo(.01)");
  assert.equal(h.el("celularPix").open, false);
  assert.equal(h.run("estado.aero.etapa"), "agradecimento");
});
test("o celular pausa com o jogo e os botões antigos deixam de agir após voltar ao menu", () => {
  const h = harness();
  h.run("iniciarFaseTeste('aero-pix')");
  const antigo = h
    .el("telaAlisaBank")
    .children.find((e) => typeof e.click === "function");
  h.run("pausarJogo();atualizarJogo(30)");
  assert.equal(h.run("estado.aero.pix.tela"), "inicio");
  h.run("continuarJogo();mostrarMenu()");
  antigo.click();
  assert.equal(h.el("celularPix").open, false);
  assert.equal(h.run("estado.aero.pix.tela"), "inicio");
});

test("a lua começa na praia, mostra o jornal e pausa sem avançar as falas", () => {
  const h = harness();
  assert.equal(h.run("iniciarFaseTeste('fnaf-doom')"), false);
  assert.equal(h.run("iniciarFaseTeste('lua-yuri')"), false);
  assert.equal(h.run("iniciarFaseTeste('lua-brita')"), true);
  assert.equal(h.run("estado.aero.etapa"), "britaChegada");
  h.run("atualizarJogo(1);pausarJogo();atualizarJogo(30)");
  assert.equal(h.run("estado.aero.tempo"), 1);
  h.run(
    "continuarJogo();iniciarFaseTeste('lua-jornal-preceiro');atualizarJogo(.1)",
  );
  assert.equal(h.run("estado.aero.etapa"), "preceiroLeitura");
  assert.equal(h.run("estado.mode"), "aero");
});
test("fala curta de Bruno continua usando arquivo e volume válidos", () => {
  const h = harness();
  h.run("iniciarFaseTeste('aero-peugeot');atualizarJogo(.1)");
  assert.equal(h.run("estado.aero.etapa"), "viagemPraia");
});

test("final abre pelo seletor; pausar congela Clayface, a ligação e a viagem", () => {
  const h = harness();
  for (const [id, etapa] of [
    ["arc-escapar", "cinemaEscapar"],
    ["arc-corrida94", "level94Fuga"],
    ["arc-biz", "retornoBiz"],
    ["arc-telefone", "telefoneBiz"],
    ["arc-viagem-biz", "viagemBiz"],
    ["arc-final", "fimJogo"],
  ]) {
    assert.equal(h.run(`iniciarFaseTeste('${id}')`), true);
    assert.equal(h.run("estado.aero.etapa"), etapa);
    h.run("pausarJogo()");
    const tempo = h.run("estado.aero.tempo"),
      z = h.run("estado.aero.jogador.z");
    h.run("atualizarJogo(20)");
    assert.equal(h.run("estado.aero.tempo"), tempo);
    assert.equal(h.run("estado.aero.jogador.z"), z);
    h.run("continuarJogo()");
  }
  h.run("iniciarFaseTeste('arc-telefone');atualizarJogo(.01)");
  assert.equal(h.run("estado.mode"), "painelProgramacao");
});
