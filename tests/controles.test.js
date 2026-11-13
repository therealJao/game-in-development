import test from "node:test";
import assert from "node:assert/strict";
import {
  ControlesGamepad,
  eixoComZonaMorta,
} from "../dist/controles-gamepad.js";
import {
  criarEstadoAlisanave,
  avancarEtapaPorto,
  atualizarRegrasPorto,
} from "../dist/regras-alisanave.js";

const pad = (botoes = [], eixos = [0, 0, 0, 0]) => ({
  index: 0,
  connected: true,
  mapping: "standard",
  id: "Controle padrão",
  axes: eixos,
  buttons: Array.from({ length: 17 }, (_, i) => ({
    pressed: botoes.includes(i),
    value: botoes.includes(i) ? 1 : 0,
  })),
});
test("zona morta impede drift e preserva intensidade dos analógicos", () => {
  assert.equal(eixoComZonaMorta(0.1), 0);
  assert.equal(eixoComZonaMorta(-0.14), 0);
  assert.equal(eixoComZonaMorta(1), 1);
  assert.equal(eixoComZonaMorta(-1), -1);
  assert.ok(eixoComZonaMorta(0.5) > 0 && eixoComZonaMorta(0.5) < 0.5);
});
test("botões geram uma ação por pressão e reconexão não retém entradas", () => {
  const leitor = new ControlesGamepad();
  assert.deepEqual(leitor.ler([pad([0, 9])]).novos, [0, 9]);
  assert.deepEqual(leitor.ler([pad([0, 9])]).novos, []);
  leitor.ler([pad()]);
  assert.deepEqual(leitor.ler([pad([0])]).novos, [0]);
  const fora = leitor.ler([]);
  assert.equal(fora.desconectou, true);
  assert.equal(fora.x, 0);
  assert.deepEqual(leitor.ler([pad([10])]).novos, [10]);
});
test("stick move com intensidade proporcional após o tobogã", () => {
  const mover = (intensidade) => {
    const f = criarEstadoAlisanave();
    avancarEtapaPorto(f, "labirinto");
    const x = f.jogador.x;
    const t = new Set();
    t.controle = { x: 0, y: -intensidade };
    atualizarRegrasPorto(f, 0.1, t);
    return f.jogador.x - x;
  };
  const lento = mover(0.25),
    rapido = mover(1);
  assert.ok(lento > 0);
  assert.ok(Math.abs(rapido / lento - 4) < 0.001);
});
