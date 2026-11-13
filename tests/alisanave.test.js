import test from "node:test";
import assert from "node:assert/strict";
import {
  criarEstadoAlisanave,
  atualizarRegrasPorto,
  avancarEtapaPorto,
  interagirPorto,
  DESAFIOS_PORTO,
} from "../dist/regras-alisanave.js";
import { calcularDistancias, podeCaminhar } from "../dist/mapas.js";

test("labirinto Alisanave conecta início, três terminais e barco", () => {
  const fase = criarEstadoAlisanave(),
    campo = calcularDistancias(fase.mapa, {
      x: fase.inicio.x / 2,
      z: fase.inicio.z / 2,
    });
  assert.ok(fase.caminho.length > 40);
  for (const p of [...fase.terminais, fase.saida])
    assert.ok(campo[Math.floor(p.z / 6)][Math.floor(p.x / 6)] >= 0);
  assert.equal(new Set(fase.terminais.map((t) => `${t.x},${t.z}`)).size, 3);
});
test("voo, sala e tobogã são automáticos e bloqueiam movimento até o labirinto", () => {
  const fase = criarEstadoAlisanave();
  const teclas = new Set(["w", "d", "ArrowLeft"]);
  teclas.controle = { x: 1, y: -1 };
  const posicao = JSON.stringify(fase.jogador);
  atualizarRegrasPorto(fase, 21, teclas);
  assert.equal(fase.etapa, "limbo");
  assert.equal(JSON.stringify(fase.jogador), posicao);
  atualizarRegrasPorto(fase, 1.1, teclas);
  assert.equal(fase.etapa, "sala");
  assert.equal(interagirPorto(fase), null);
  atualizarRegrasPorto(fase, 6.1, teclas);
  assert.equal(fase.conversa, true);
  assert.equal(JSON.stringify(fase.jogador), posicao);
  atualizarRegrasPorto(fase, 12, teclas);
  assert.equal(fase.etapa, "toboga");
  atualizarRegrasPorto(fase, 7.1, teclas);
  assert.equal(fase.etapa, "labirinto");
  assert.equal(fase.contagem, 10);
  const x = fase.jogador.x;
  atualizarRegrasPorto(fase, 0.1, new Set(["w"]));
  assert.ok(fase.jogador.x > x);
});
test("Yang Ming espera dez segundos e persegue sem atravessar contêineres", () => {
  const fase = criarEstadoAlisanave();
  avancarEtapaPorto(fase, "labirinto");
  fase.jogador = { x: 27, z: 9, yaw: 0 };
  const inicial = { ...fase.yang };
  atualizarRegrasPorto(fase, 9, new Set());
  assert.equal(fase.yang.x, inicial.x);
  assert.equal(fase.contagem, 1);
  for (let i = 0; i < 120; i++) atualizarRegrasPorto(fase, 1 / 60, new Set());
  assert.equal(fase.contagem, 0);
  assert.ok(fase.yang.x > inicial.x);
  assert.ok(podeCaminhar(fase.mapa, fase.yang.x / 2, fase.yang.z / 2, 0.2));
});
test("barco exige três painéis simples e chega ao castelo", () => {
  const fase = criarEstadoAlisanave();
  avancarEtapaPorto(fase, "labirinto");
  fase.jogador = { ...fase.saida, yaw: 0 };
  assert.equal(interagirPorto(fase).tipo, "fala");
  assert.equal(fase.etapa, "labirinto");
  fase.terminais.forEach((t) => (t.feito = true));
  assert.equal(interagirPorto(fase).tipo, "barco");
  atualizarRegrasPorto(fase, 20.1, new Set());
  assert.equal(fase.concluido, true);
  assert.equal(DESAFIOS_PORTO.length, 3);
  for (const d of DESAFIOS_PORTO) assert.ok(d.opcoes.includes(d.resposta));
});
