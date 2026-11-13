import test from "node:test";
import assert from "node:assert/strict";
import { calcularRotaMapa, dadosMinimapa } from "../dist/minimapa.js";
import { criarFase } from "../dist/mapas.js";
import { criarEstadoAlisanave } from "../dist/regras-alisanave.js";

test("rota azul até cada terminal e saída usa células vizinhas caminháveis", () => {
  for (let capitulo = 0; capitulo < 3; capitulo++) {
    const fase = criarFase(capitulo);
    for (const destino of [...fase.terminals, fase.exit]) {
      const rota = calcularRotaMapa(fase.map, fase.spawn, destino, 3);
      assert.ok(rota.length > 1);
      assert.equal(rota.at(-1).x, destino.x);
      assert.equal(rota.at(-1).z, destino.z);
      rota.forEach((p, i) => {
        assert.equal(fase.map[Math.floor(p.z / 3)][Math.floor(p.x / 3)], 0);
        if (i)
          assert.equal(
            Math.abs(p.x - rota[i - 1].x) + Math.abs(p.z - rota[i - 1].z),
            3,
          );
      });
    }
  }
});

test("minimapa revela objetivos desde o início e muda a rota quando os terminais estão resolvidos", () => {
  const level = criarFase(0),
    estado = {
      mode: "playing",
      level,
      player: { ...level.spawn, yaw: 0 },
      enemyDormant: true,
    };
  const dados = dadosMinimapa(estado);
  assert.equal(dados.terminais.length, 2);
  assert.ok(dados.destino);
  assert.deepEqual(dados.inimigos, []);
  level.terminals.forEach((t) => (t.done = true));
  assert.equal(dadosMinimapa(estado).destino, level.exit);
});

test("minimapa de Alisanave usa a escala dos contêineres e três painéis", () => {
  const porto = criarEstadoAlisanave();
  porto.etapa = "labirinto";
  const dados = dadosMinimapa({ mode: "alisanave", porto });
  assert.equal(dados.tamanho, 6);
  assert.equal(dados.terminais.length, 3);
  const rota = calcularRotaMapa(
    dados.mapa,
    (dados.jogador = { ...porto.inicio }),
    dados.terminais[0],
    6,
  );
  assert.ok(rota.length > 1);
  for (const p of rota)
    assert.equal(porto.mapa[Math.floor(p.z / 6)][Math.floor(p.x / 6)], 0);
});
