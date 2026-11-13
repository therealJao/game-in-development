import test from "node:test";
import assert from "node:assert/strict";
import { criarVolei, acaoVolei, atualizarVolei } from "../dist/regras-volei.js";
import {
  criarEstadoAero,
  atualizarAero,
} from "../dist/regras-frutiger-aero.js";
function simular(v, segundos, apertar = false) {
  for (let i = 0; i < segundos * 120 && !v.terminado; i++) {
    if (apertar && i % 30 === 0) acaoVolei(v);
    atualizarVolei(v, 1 / 120);
  }
}
test("saque espera ação, comando tem tolerância e Nav levanta a bola", () => {
  const v = criarVolei();
  simular(v, 2);
  assert.equal(v.fase, "saque");
  assert.equal(v.bola.vx, 0);
  assert.equal(acaoVolei(v), true);
  assert.equal(v.fase, "rally");
  assert(v.bola.vx > 0);
  Object.assign(v.bola, { x: -5, y: 1.65, vy: -1, vx: -1 });
  v.cooldown = 0;
  atualizarVolei(v, 0.03);
  assert.equal(v.toques, 1);
  assert(v.bola.vy > 0);
});
test("rede rebate bola baixa e ponto só é marcado quando ela cai", () => {
  const v = criarVolei();
  v.fase = "rally";
  Object.assign(v.bola, { x: -0.23, y: 1.7, vx: 8, vy: 0 });
  atualizarVolei(v, 0.05);
  assert(v.bola.vx < 0);
  assert.deepEqual(v.pontos, [0, 0]);
  v.cooldown = 2;
  Object.assign(v.bola, { x: 8, y: 0.23, vx: 0, vy: -2 });
  atualizarVolei(v, 0.03);
  assert.deepEqual(v.pontos, [1, 0]);
  simular(v, 1);
  assert.deepEqual(v.pontos, [1, 0]);
});
test("primeiro a cinco vence sem deixar a bola ou o placar continuar", () => {
  const v = criarVolei();
  v.pontos = [4, 2];
  v.fase = "rally";
  v.cooldown = 2;
  Object.assign(v.bola, { x: 8, y: 0.23, vx: 0, vy: -2 });
  atualizarVolei(v, 0.03);
  assert.equal(v.terminado, true);
  assert.equal(v.venceu, true);
  assert.deepEqual(v.pontos, [5, 2]);
  simular(v, 20, true);
  assert.deepEqual(v.pontos, [5, 2]);
});
test("partida fácil é vencível usando somente o botão principal", () => {
  const v = criarVolei();
  simular(v, 240, true);
  assert.equal(v.terminado, true);
  assert.equal(v.venceu, true);
});
test("carona curta leva à chegada e vitória do vôlei leva à comemoração", () => {
  const f = criarEstadoAero("viagemPraia");
  atualizarAero(f, 12.1);
  assert.equal(f.etapa, "praiaChegada");
  atualizarAero(f, 8.1);
  assert.equal(f.etapa, "volei");
  f.volei.terminado = true;
  f.volei.venceu = true;
  atualizarAero(f, 0.1);
  assert.equal(f.etapa, "voleiVitoria");
  atualizarAero(f, 7.1);
  assert.equal(f.etapa, "britaChegada");
});
