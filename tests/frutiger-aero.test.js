import test from "node:test";
import assert from "node:assert/strict";
import {
  criarEstadoAero,
  atualizarAero,
  chutarBolaAero,
  TEMPOS_AERO,
  reiniciarBolaAero,
} from "../dist/regras-frutiger-aero.js";
test("a queda, o resgate e a viagem são automáticos e terminam no futebol", () => {
  const f = criarEstadoAero();
  for (const etapa of ["queda", "resgate", "viagem", "entrada"]) {
    assert.equal(f.etapa, etapa);
    const p = { ...f.jogador };
    atualizarAero(f, TEMPOS_AERO[etapa] + 0.001, new Set(["w"]));
    assert.deepEqual(f.jogador, p);
  }
  assert.equal(f.etapa, "futebol");
  atualizarAero(f, 0.1, new Set(["w"]));
  assert.ok(f.jogador.z < 18);
});
test("o chute exige proximidade, respeita recarga e só funciona no campo", () => {
  const f = criarEstadoAero();
  assert.equal(chutarBolaAero(f), false);
  f.etapa = "futebol";
  assert.equal(chutarBolaAero(f), false);
  f.jogador.z = 12;
  assert.equal(chutarBolaAero(f), true);
  assert.ok(f.bola.vz < 0);
  assert.equal(chutarBolaAero(f), false);
});
test("a bola tem gravidade, quica no piso e rebate nas laterais", () => {
  const f = criarEstadoAero("futebol");
  Object.assign(f.bola, { x: 23, y: 3, z: 0, vx: 15, vy: 0, vz: 0 });
  f.naverdachi.cooldown = 100;
  for (let i = 0; i < 100; i++) atualizarAero(f, 0.016);
  assert.ok(f.bola.y >= 0.43);
  assert.ok(f.bola.x < 23);
  assert.ok(f.bola.vx < 0);
});
test("cada gol conta apenas uma vez e a bola retorna ao centro", () => {
  const f = criarEstadoAero("futebol");
  Object.assign(f.bola, { x: 0, y: 0.5, z: -35.9, vz: -10 });
  atualizarAero(f, 0.04);
  assert.equal(f.golsAxel, 1);
  for (let i = 0; i < 20; i++) atualizarAero(f, 0.05);
  assert.equal(f.golsAxel, 1);
  atualizarAero(f, 2);
  assert.equal(f.bola.z, 0);
  assert.equal(f.pausaGol <= 0, true);
});
test("tiro acima do travessão não vira gol", () => {
  const f = criarEstadoAero("futebol");
  Object.assign(f.bola, { x: 0, y: 4, z: 35.5, vz: 12 });
  atualizarAero(f, 0.05);
  assert.equal(f.golsNaverdachi, 0);
  assert.ok(f.bola.vz < 0);
});
test("Naverdachi alcança a bola e chuta; o jogador fica dentro do campo", () => {
  const f = criarEstadoAero("futebol");
  Object.assign(f.naverdachi, { x: 0, z: 9, cooldown: 0 });
  atualizarAero(f, 0.04);
  assert.equal(f.ultimoChutador, "Naverdachi");
  assert.ok(f.bola.vz > 0);
  for (let i = 0; i < 500; i++) atualizarAero(f, 0.03, new Set(["d"]), true);
  assert.ok(Math.abs(f.jogador.x) <= 23.2);
  reiniciarBolaAero(f);
  assert.equal(f.bola.y, 0.45);
});
