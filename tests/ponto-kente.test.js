import test from "node:test";
import assert from "node:assert/strict";
import {
  podeAndarPontoKente,
  pertoBalcaoPontoKente,
  atualizarExploracaoPontoKente,
} from "../dist/regras-ponto-kente.js";
import {
  criarEstadoAero,
  atualizarAero,
} from "../dist/regras-frutiger-aero.js";
test("há caminho caminhável entre a mesa da dupla e o painel do balcão", () => {
  const passo = 0.2,
    inicio = [1, 3.4],
    queue = [inicio],
    visitados = new Set();
  let achou = false;
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    if (Math.hypot(x - 0.35, z + 3.65) < 1) {
      achou = true;
      break;
    }
    for (const [dx, dz] of [
      [passo, 0],
      [-passo, 0],
      [0, passo],
      [0, -passo],
    ]) {
      const nx = Math.round((x + dx) * 10) / 10,
        nz = Math.round((z + dz) * 10) / 10,
        k = nx + "," + nz;
      if (!visitados.has(k) && podeAndarPontoKente(nx, nz)) {
        visitados.add(k);
        queue.push([nx, nz]);
      }
    }
  }
  assert.equal(achou, true);
  assert.equal(podeAndarPontoKente(2.6, 3.7), false);
  assert.equal(podeAndarPontoKente(-3.5, 1), false);
});
test("correr por um passo longo não atravessa as paredes nem o balcão", () => {
  const f = criarEstadoAero("lanchoneteExplorar");
  Object.assign(f.jogador, { x: 0, z: 3.4, yaw: 0 });
  atualizarExploracaoPontoKente(f, 20, new Set(["w"]), true);
  assert.ok(f.jogador.z >= -3.9);
  assert.ok(f.jogador.z < -2.5);
  assert.equal(pertoBalcaoPontoKente(f), true);
});
test("a nova sequência mantém o grupo na lanchonete e espera o pedido ser corrigido", () => {
  const f = criarEstadoAero("lanchonete");
  atualizarAero(f, 42.1);
  assert.equal(f.etapa, "lanchoneteExplorar");
  atualizarAero(f, 500);
  assert.equal(f.etapa, "lanchoneteExplorar");
  f.desafiosResolvidos.push("cozinha-fila");
  atualizarAero(f, 0.1);
  assert.equal(f.etapa, "lanchoneteFinal");
  atualizarAero(f, 18.1);
  assert.equal(f.etapa, "lanchonetePagar");
  atualizarAero(f,9.1);assert.equal(f.etapa,"pagamento");
  atualizarAero(f,100);assert.equal(f.etapa,"pagamento");
});
