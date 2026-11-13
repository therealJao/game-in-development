import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  criarEstadoAero,
  atualizarAero,
} from "../dist/regras-frutiger-aero.js";
import {
  criarEstadoFinal,
  iniciarPosicaoFinal,
  interagirFinal,
  acaoTelefoneFinal,
  podeAndarFinal,
  TEMPOS_FINAL,
  OBJETOS_FINAL,
  altura94,
} from "../dist/regras-final.js";
import { criarEstadoArcoplex } from "../dist/regras-arcoplex.js";
import { FALAS_FINAL, sonsFinal } from "../dist/falas-final.js";
import {
  obterDesafioNovaFase,
  responderDesafioNovaFase,
} from "../dist/desafios-novas-fases.js";
function estado(e) {
  const f = criarEstadoAero(e);
  f.arcoplex = criarEstadoArcoplex();
  iniciarPosicaoFinal(f, e);
  return f;
}
function ir(f, p) {
  Object.assign(f.jogador, p);
  return interagirFinal(f);
}
function tempo(f) {
  atualizarAero(f, TEMPOS_FINAL[f.etapa] + 0.01);
}
function resolver(f) {
  const d = obterDesafioNovaFase(f);
  assert(d);
  assert(responderDesafioNovaFase(f, d.id, d.correta).correto);
}
function rota(e, start, goal) {
  const q = [start],
    key = (x, z) => x + "," + z,
    prev = new Map([[key(...start), null]]);
  let fim;
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i],
      k = key(x, z);
    if (Math.hypot(x - goal.x, z - goal.z) < 1.5) {
      fim = k;
      break;
    }
    for (const [dx, dz] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        k2 = key(nx, nz);
      if (!prev.has(k2) && podeAndarFinal(e, nx, nz)) {
        prev.set(k2, k);
        q.push([nx, nz]);
      }
    }
  }
  assert(fim, "No route " + e + JSON.stringify(goal));
  const r = [];
  for (let k = fim; k; k = prev.get(k)) r.push(k.split(",").map(Number));
  return r.reverse();
}
test("cada objetivo final tem acesso a pé sem atravessar obstáculos", () => {
  for (const [e, start, goals] of [
    ["cinemaEscapar", [0, 9], [{ x: -11, z: 13 }]],
    [
      "peppaExplorar",
      [0, 6],
      [
        OBJETOS_FINAL.painelRosa,
        OBJETOS_FINAL.painelVerde,
        OBJETOS_FINAL.portaPeppa,
      ],
    ],
    [
      "level94Explorar",
      [0, 5],
      [OBJETOS_FINAL.bilhete, OBJETOS_FINAL.chaveCasa, OBJETOS_FINAL.casa],
    ],
    ["casaExplorar", [0, 4], [{ x: 0, z: -2.5 }]],
    ["retornoBiz", [0, 7], [OBJETOS_FINAL.chaveBiz, OBJETOS_FINAL.biz]],
    ["portalExplorar", [0, -105], [OBJETOS_FINAL.portal]],
    ["viagemBiz", [0, 3], [OBJETOS_FINAL.brita]],
  ])
    for (const goal of goals) rota(e, start, goal);
});
test("percurso termina somente após exploração, chamada, rota e entrega da Biz", () => {
  const f = estado("clayRevela");
  tempo(f);
  assert.equal(f.etapa, "cinemaEscapar");
  assert.equal(ir(f, { x: -11, z: 13 }), true);
  tempo(f);
  assert.equal(f.etapa, "peppaExplorar");
  assert.equal(ir(f, OBJETOS_FINAL.portaPeppa), false);
  ir(f, OBJETOS_FINAL.painelRosa);
  ir(f, OBJETOS_FINAL.painelVerde);
  assert.equal(ir(f, OBJETOS_FINAL.portaPeppa), false);
  resolver(f);
  ir(f, OBJETOS_FINAL.portaPeppa);
  tempo(f);
  assert.equal(f.etapa, "level94Explorar");
  ir(f, OBJETOS_FINAL.bilhete);
  ir(f, OBJETOS_FINAL.chaveCasa);
  assert.equal(f.etapa, "level94Olhar");
  tempo(f);
  assert.equal(f.etapa, "level94Fuga");
  ir(f, OBJETOS_FINAL.casa);
  tempo(f);
  assert.equal(f.etapa, "casaExplorar");
  ir(f, { x: 0, z: -2.5 });
  for (const e of ["casaTrailer", "casaPlantao", "casaNoticia", "casaLuto"]) {
    assert.equal(f.etapa, e);
    tempo(f);
  }
  assert.equal(f.etapa, "casaSaida");
  ir(f, OBJETOS_FINAL.saidaCasa);
  tempo(f);
  ir(f, OBJETOS_FINAL.portal);
  assert.equal(f.etapa, "retornoBiz");
  assert.equal(ir(f, OBJETOS_FINAL.biz), false);
  ir(f, OBJETOS_FINAL.chaveBiz);
  ir(f, OBJETOS_FINAL.biz);
  assert.equal(f.etapa, "telefoneBiz");
  resolver(f);
  assert(!acaoTelefoneFinal(f, "ligar"));
  assert(acaoTelefoneFinal(f, "app"));
  assert(acaoTelefoneFinal(f, "brita"));
  assert(acaoTelefoneFinal(f, "ligar"));
  tempo(f);
  assert.equal(f.etapa, "viagemBiz");
  assert.equal(ir(f, OBJETOS_FINAL.brita), false);
  for (const z of [-31, -66, -101]) {
    Object.assign(f.jogador, { x: 0, z });
    atualizarAero(f, 0.01);
  }
  assert.equal(f.final.rota, 3);
  ir(f, OBJETOS_FINAL.brita);
  assert.equal(f.etapa, "entregaBiz");
  tempo(f);
  assert.equal(f.etapa, "fimJogo");
  atualizarAero(f, 100);
  assert.equal(f.etapa, "fimJogo");
});
test("a fuga entre as poltronas é vencível; capturas voltam ao checkpoint com fôlego", () => {
  const f = estado("cinemaEscapar"),
    r = rota(f.etapa, [0, 9], { x: -11, z: 13 });
  for (const [x, z] of r.slice(1)) {
    const p = f.jogador;
    const dx = x - p.x,
      dz = z - p.z;
    p.yaw = Math.atan2(-dx, -dz);
    atualizarAero(f, Math.hypot(dx, dz) / 6.7, new Set(["w"]), true);
    assert.equal(f.etapa, "cinemaEscapar");
  }
  assert(interagirFinal(f));
  const q = estado("cinemaEscapar");
  q.tempo = 6;
  q.final.perseguidor = { ...q.jogador };
  atualizarAero(q, 0.01);
  assert.equal(q.etapa, "clayCaptura");
  tempo(q);
  tempo(q);
  assert.equal(q.etapa, "cinemaEscapar");
  assert.equal(q.final.folego, 100);
});
test("a perseguição do Level 94 pode ser vencida correndo até a casa sem teleporte", () => {
  const f = estado("level94Fuga");
  let i = 0;
  while (f.jogador.z > -104 && i++ < 300) {
    atualizarAero(f, 0.05, new Set(["w"]), true);
    assert.equal(f.etapa, "level94Fuga");
    assert(
      podeAndarFinal(f.etapa, f.final.perseguidor.x, f.final.perseguidor.z),
    );
  }
  assert(interagirFinal(f));
  assert.equal(f.etapa, "casaEntrada");
  assert(Number.isFinite(altura94(1, -90)));
});
test("telefonar não aciona aplicativos externos, não repete ligação e exige a Biz", () => {
  const f = estado("telefoneBiz");
  f.final.biz = false;
  acaoTelefoneFinal(f, "app");
  acaoTelefoneFinal(f, "brita");
  assert(!acaoTelefoneFinal(f, "ligar"));
  f.final.biz = true;
  assert(acaoTelefoneFinal(f, "ligar"));
  assert(!acaoTelefoneFinal(f, "ligar"));
  assert.equal(f.etapa, "ligacaoBrita");
});
function duracao(file) {
  const b = fs.readFileSync(file);
  let rate, bytes;
  for (let o = 12; o + 8 <= b.length;) {
    const id = b.toString("ascii", o, o + 4),
      n = b.readUInt32LE(o + 4);
    if (id === "fmt ") rate = b.readUInt32LE(o + 16);
    if (id === "data") bytes = n;
    o += 8 + n + (n % 2);
  }
  return bytes / rate;
}
test("narração final cabe nas cenas e áudios dos links existem no pacote", () => {
  for (const l of FALAS_FINAL) {
    const next = FALAS_FINAL.find((v) => v[0] === l[0] && v[1] > l[1]),
      file = new URL(
        "../dist/assets/final/falas/" + l[2] + ".wav",
        import.meta.url,
      );
    assert(
      l[1] + duracao(file) <= (next?.[1] ?? TEMPOS_FINAL[l[0]] ?? Infinity),
      l[2],
    );
    for (const [, p] of sonsFinal({ etapa: l[0], tempo: l[1] }))
      assert(fs.existsSync(new URL("../dist/" + p, import.meta.url)));
  }
  for (const n of [
    "tv-trailer.mp4",
    "tv-plantao.mp4",
    "level94.mp3",
    "menu-arkham.mp3",
  ])
    assert(
      fs.statSync(new URL("../dist/assets/final/" + n, import.meta.url)).size >
        10000,
    );
});
