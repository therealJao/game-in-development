import test from "node:test";
import assert from "node:assert/strict";
import {
  DESAFIOS_NOVAS_FASES,
  obterDesafioNovaFase,
  limitarPassoProgramacao,
  responderDesafioNovaFase,
} from "../dist/desafios-novas-fases.js";
import {
  criarEstadoAero,
  atualizarAero,
} from "../dist/regras-frutiger-aero.js";
test("checkpoints aparecem em sequência, incluindo os pedidos da cozinha", () => {
  const f = criarEstadoAero();
  const ids = [];
  for (const d of DESAFIOS_NOVAS_FASES) {
    f.etapa = d.etapa;
    f.tempo = d.tempo || 0;
    f.golsAxel = d.gols || 0;
    f.pedidoPendente = !!d.precisaPedido;
    if (d.precisaPaineis) f.final = { paineis: ["rosa", "verde"] };
    const p = obterDesafioNovaFase(f);
    assert.equal(p.id, d.id);
    assert.equal(responderDesafioNovaFase(f, d.id, d.correta).correto, true);
    ids.push(d.id);
  }
  assert.equal(new Set(ids).size, DESAFIOS_NOVAS_FASES.length);
  assert.equal(obterDesafioNovaFase(f), undefined);
});
test("erros não liberam passagem e clique duplicado não concede outro acerto", () => {
  const f = criarEstadoAero("entrada");
  f.tempo = 4;
  const d = obterDesafioNovaFase(f);
  assert.equal(
    responderDesafioNovaFase(f, d.id, (d.correta + 1) % 3).correto,
    false,
  );
  assert.deepEqual(f.desafiosResolvidos, []);
  assert.equal(responderDesafioNovaFase(f, d.id, d.correta).correto, true);
  assert.equal(responderDesafioNovaFase(f, d.id, d.correta).valido, false);
  assert.equal(f.desafiosResolvidos.length, 1);
  assert.equal(responderDesafioNovaFase(f, "outro", 0).valido, false);
});
test("passo longo para no terminal antes de avançar a cutscene", () => {
  const f = criarEstadoAero("lanchonete");
  atualizarAero(f, limitarPassoProgramacao(f, 50));
  assert.equal(f.etapa, "lanchonete");
  assert.equal(f.tempo, 9);
  const d = obterDesafioNovaFase(f);
  assert.equal(d.id, "ponto-kente-pedido");
  responderDesafioNovaFase(f, d.id, d.correta);
  atualizarAero(f, limitarPassoProgramacao(f, 34));
  assert.equal(f.etapa, "lanchoneteExplorar");
  assert.equal(obterDesafioNovaFase(f), undefined);
  f.pedidoPendente = true;
  assert.equal(obterDesafioNovaFase(f).id, "cozinha-fila");
});
test("reiniciar a fase limpa terminais e não herda o progresso anterior", () => {
  const a = criarEstadoAero("lanchoneteExplorar"),
    b = criarEstadoAero("lanchoneteExplorar");
  a.pedidoPendente = true;
  const d = obterDesafioNovaFase(a);
  responderDesafioNovaFase(a, d.id, d.correta);
  assert.deepEqual(b.desafiosResolvidos, []);
  b.pedidoPendente = true;
  assert.equal(obterDesafioNovaFase(b).id, d.id);
});
