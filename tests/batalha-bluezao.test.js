import test from "node:test";
import assert from "node:assert/strict";
import {
  criarBatalhaRitmo,
  acertarTrilha,
  atualizarBatalhaRitmo,
} from "../dist/batalha-ritmo.js";
import {
  criarEstadoAero,
  atualizarAero,
} from "../dist/regras-frutiger-aero.js";
test("a partida termina exatamente no quinto gol de qualquer jogador", () => {
  for (const lado of [-1, 1]) {
    const f = criarEstadoAero("futebol");
    if (lado < 0) f.golsAxel = 4;
    else f.golsNaverdachi = 4;
    Object.assign(f.bola, { x: 0, y: 0.5, z: lado * 35.9, vz: lado * 12 });
    atualizarAero(f, 0.04);
    assert.equal(f.etapa, "transformacao");
    assert.equal(f.vencedor, lado < 0 ? "Axel" : "Naverdachi");
    atualizarAero(f, 3);
    assert.equal(f.golsAxel + f.golsNaverdachi, 5);
    atualizarAero(f, 4.1);
    assert.equal(f.etapa, "ritmo");
  }
});
test("as cinco trilhas aceitam uma nota por pressão dentro da janela", () => {
  const r = criarBatalhaRitmo();
  const n = r.notas[0];
  r.tempo = n.tempo;
  assert.equal(acertarTrilha(r, n.trilha), true);
  assert.equal(acertarTrilha(r, n.trilha), false);
  assert.equal(r.acertos, 1);
  assert.equal(n.estado, "acerto");
  assert.equal(acertarTrilha(r, -1), false);
});
test("a contagem não permite acertar antes da música; erros zeram o combo", () => {
  const r = criarBatalhaRitmo();
  assert.equal(acertarTrilha(r, 0), false);
  r.tempo = r.notas[0].tempo;
  acertarTrilha(r, r.notas[0].trilha);
  assert.equal(r.combo, 1);
  acertarTrilha(r, (r.notas[0].trilha + 1) % 5);
  assert.equal(r.combo, 0);
  assert.equal(r.energia, 100);
});
test("errar notas reduz energia e perder encerra somente a batalha", () => {
  const f = criarEstadoAero("ritmo");
  for (let i = 0; i < 400 && f.etapa === "ritmo"; i++) atualizarAero(f, 0.1);
  assert.equal(f.etapa, "derrotaRitmo");
  assert.equal(f.golsAxel, 0);
  assert.equal(f.ritmo.venceu, false);
});
test("executar a partitura derrota o vilão e conduz à comemoração", () => {
  const f = criarEstadoAero("ritmo"),
    r = f.ritmo;
  for (const n of r.notas) {
    atualizarAero(f, n.tempo - r.tempo);
    assert.equal(acertarTrilha(r, n.trilha), true);
  }
  atualizarAero(f, 2);
  assert.equal(f.etapa, "vitoria");
  assert.equal(r.venceu, true);
  assert.equal(r.acertos, 16);
  atualizarAero(f, 8.1);
  assert.equal(f.etapa, "lanchonete");
  atualizarAero(f, 42.1);
  assert.equal(f.etapa, "lanchoneteExplorar");
  atualizarAero(f, 200);
  assert.equal(f.etapa, "lanchoneteExplorar");
  f.desafiosResolvidos.push("cozinha-fila");
  atualizarAero(f, 0.1);
  assert.equal(f.etapa, "lanchoneteFinal");
  atualizarAero(f, 18.1);
  assert.equal(f.etapa, "lanchonetePagar");
  atualizarAero(f,9.1);assert.equal(f.etapa,"pagamento");
  atualizarAero(f,100);assert.equal(f.etapa,"pagamento");
});

test("modo fácil aceita atraso de 400ms e quatro acertos bastam", () => {
  const r = criarBatalhaRitmo();
  for (const n of r.notas.slice(0, 4)) {
    r.tempo = n.tempo + 0.4;
    assert.equal(acertarTrilha(r, n.trilha), true);
  }
  atualizarBatalhaRitmo(r, r.duracao + 1);
  assert.equal(r.venceu, true);
  assert.ok(r.energia >= 88);
});
