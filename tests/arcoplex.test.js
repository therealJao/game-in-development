import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  criarEstadoAero,
  atualizarAero,
} from "../dist/regras-frutiger-aero.js";
import {
  criarEstadoArcoplex,
  iniciarPosicaoArcoplex,
  interagirArcoplex,
  podeAndarArcoplex,
  PRODUTOS_MERCADO,
  LISTAS_COMPRAS,
  alturaCinema,
} from "../dist/regras-arcoplex.js";
import { FALAS_ARCOPLEX, sonsArcoplex } from "../dist/falas-arcoplex.js";
import {
  obterDesafioNovaFase,
  responderDesafioNovaFase,
  limitarPassoProgramacao,
} from "../dist/desafios-novas-fases.js";
function estado(etapa = "compras") {
  const f = criarEstadoAero(etapa);
  iniciarPosicaoArcoplex(f, etapa);
  return f;
}
test("compras exigem os dois pedidos completos, quantidades exatas e entrega no caixa", () => {
  const f = estado();
  assert.equal(interagirArcoplex(f), false);
  for (let rodada = 0; rodada < 2; rodada++) {
    const lista = LISTAS_COMPRAS[rodada];
    for (const [id, n] of Object.entries(lista.itens)) {
      Object.assign(
        f.jogador,
        PRODUTOS_MERCADO.find((p) => p.id === id),
      );
      for (let i = 0; i < n; i++) assert.equal(interagirArcoplex(f), true);
      assert.equal(interagirArcoplex(f), false);
      assert.equal(f.arcoplex.cesta[id], n);
    }
    Object.assign(f.jogador, { x: 0, z: 11 });
    assert.equal(interagirArcoplex(f), true);
  }
  assert.equal(f.etapa, "portaEstranha");
  assert.equal(f.arcoplex.rodada, 2);
});
test("produto fora da lista não entra no carrinho; a porta exige aproximação", () => {
  const f = estado();
  Object.assign(
    f.jogador,
    PRODUTOS_MERCADO.find((p) => p.id === "chocolate"),
  );
  assert.equal(interagirArcoplex(f), false);
  assert.deepEqual(f.arcoplex.cesta, {});
  f.etapa = "portaEstranha";
  assert.equal(interagirArcoplex(f), false);
  Object.assign(f.jogador, { x: 0, z: -22 });
  assert.equal(interagirArcoplex(f), true);
  assert.equal(f.etapa, "olhoMagico");
  atualizarAero(f, 6);
  assert.equal(f.etapa, "travessiaCinema");
  atualizarAero(f, 3);
  assert.equal(f.etapa, "shoppingExplorar");
  assert.equal(f.jogador.z, 14);
});
function alcance(etapa, start) {
  const key = (x, z) => x + "," + z,
    q = [start],
    seen = new Set([key(...start)]);
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const a = x + dx,
        b = z + dz,
        k = key(a, b);
      if (!seen.has(k) && podeAndarArcoplex(etapa, a, b)) {
        seen.add(k);
        q.push([a, b]);
      }
    }
  }
  return q;
}
test("todos os produtos, caixa e porta são alcançáveis sem atravessar as estantes", () => {
  const q = alcance("compras", [0, 18]);
  for (const p of [...PRODUTOS_MERCADO, { x: 0, z: 11 }, { x: 0, z: -23 }])
    assert(
      q.some(([x, z]) => Math.hypot(x - p.x, z - p.z) < 1.6),
      p.id || "porta/caixa",
    );
  const f = estado();
  f.jogador.x = -3;
  f.jogador.z = -12;
  atualizarAero(f, 4, new Set(["a"]), true);
  assert(f.jogador.x > -5);
});
test("sala 3 tem rota de fuga alcançável e perseguidor respeita as paredes", () => {
  const q = alcance("cinemaFuga", [0, 14]);
  assert(q.some(([x, z]) => Math.hypot(x - 15.7, z + 25) < 2));
  const f = estado("cinemaFuga");
  Object.assign(f.jogador, { x: 15, z: -25 });
  for (let i = 0; i < 100; i++) {
    atualizarAero(f, 0.05);
    assert(
      podeAndarArcoplex(
        "cinemaFuga",
        f.arcoplex.perseguidor.x,
        f.arcoplex.perseguidor.z,
      ),
    );
  }
  assert.equal(interagirArcoplex(f), true);
  assert.equal(f.etapa, "cinemaSala");
  assert.equal(f.jogador.x, 0);
});
test("ser alcançado reinicia o hall; a apuração continua na revelação do Clayface", () => {
  const f = estado("cinemaFuga");
  f.tempo = 5;
  f.arcoplex.perseguidor = { ...f.jogador };
  atualizarAero(f, 0.01);
  assert.equal(f.etapa, "cinemaSusto");
  atualizarAero(f, 2.5);
  assert.equal(f.etapa, "shoppingExplorar");
  assert.equal(f.arcoplex.tentativas, 1);
  f.etapa = "cinemaSala";
  f.tempo = 0;
  atualizarAero(f, 59.9);
  assert.equal(f.etapa, "cinemaSala");
  atualizarAero(f, 0.2);
  assert.equal(f.etapa, "cinemaResultado");
  atualizarAero(f, 12);
  assert.equal(f.etapa, "clayRevela");
  assert(alturaCinema(12) > alturaCinema(-8));
});
test("os terminais do mercado param o tempo e validam a resposta antes de liberar", () => {
  for (const [etapa, tempo] of [
    ["mercadoEntrada", 12],
    ["portaEstranha", 0],
  ]) {
    const f = estado(etapa);
    f.tempo = tempo - 0.1;
    assert(Math.abs(limitarPassoProgramacao(f, 1) - 0.1) < 0.001);
    f.tempo = tempo;
    const d = obterDesafioNovaFase(f);
    assert(d);
    assert.equal(
      responderDesafioNovaFase(f, d.id, (d.correta + 1) % 3).correto,
      false,
    );
    assert.equal(responderDesafioNovaFase(f, d.id, d.correta).correto, true);
    assert.equal(obterDesafioNovaFase(f), undefined);
  }
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
test("falas terminam antes da próxima fala e referências de áudio existem", () => {
  const fim = {
    mercadoEntrada: 14,
    carrinhoAtaque: 3.5,
    olhoMagico: 6,
    cinemaSala: 60,
  };
  for (const l of FALAS_ARCOPLEX) {
    const next = FALAS_ARCOPLEX.find((v) => v[0] === l[0] && v[1] > l[1]);
    if (
      ![
        "mercadoEntrada",
        "carrinhoAtaque",
        "portaEstranha",
        "olhoMagico",
        "shoppingExplorar",
        "cinemaFuga",
        "cinemaSala",
      ].includes(l[0])
    )
      continue;
    const wav = new URL(
      "../dist/assets/arcoplex/falas/" + l[2] + ".wav",
      import.meta.url,
    );
    assert(l[1] + duracao(wav) <= (next?.[1] ?? fim[l[0]] ?? Infinity), l[2]);
    for (const [, file] of sonsArcoplex({
      etapa: l[0],
      tempo: l[1],
      arcoplex: criarEstadoArcoplex(),
    }))
      assert(fs.existsSync(new URL("../dist/" + file, import.meta.url)));
  }
});
