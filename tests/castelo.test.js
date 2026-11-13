import test from "node:test";
import assert from "node:assert/strict";
import {
  criarEstadoCastelo,
  atualizarCastelo,
  interagirCastelo,
  ROTA_ESCADARIA,
  DESAFIOS_CASTELO,
  pontoMaisProximoEscada,
  TEMPOS_TERRACO,
  momentoTerraco,
  poseBriga,
  alturaDegrau,
} from "../dist/regras-castelo.js";
import {
  perfilGrafico,
  escalaRenderizacao,
} from "../dist/qualidade-grafica.js";
import {
  criarEstadoAlisanave,
  avancarEtapaPorto,
  atualizarRegrasPorto,
  DURACAO_BARCO,
} from "../dist/regras-alisanave.js";

function andarAte(f, alvo, agachado = true) {
  const teclas = new Set(agachado ? ["w", "Control"] : ["w"]);
  for (let i = 0; i < 1600; i++) {
    if (Math.hypot(f.jogador.x - alvo.x, f.jogador.z - alvo.z) < 0.13) return;
    f.jogador.yaw = Math.atan2(
      -(alvo.x - f.jogador.x),
      -(alvo.z - f.jogador.z),
    );
    atualizarCastelo(f, 0.04, teclas);
    if (f.alerta) return;
  }
  throw Error("Não alcançou o ponto da escadaria");
}
test("desembarque é automático; agachar permite contornar o salão sem ser ouvido", () => {
  const f = criarEstadoCastelo();
  atualizarCastelo(f, 5, new Set(["w"]));
  assert.equal(f.jogador.z, 10);
  assert.equal(f.etapa, "chegada");
  atualizarCastelo(f, 5.1, new Set());
  assert.equal(f.etapa, "salao");
  for (const alvo of [
    { x: -10, z: 10 },
    { x: -10, z: -9 },
    { x: -9, z: -9 },
  ])
    andarAte(f, alvo);
  assert.equal(f.alerta, false);
  assert.ok(f.suspeita < 0.1);
  assert.equal(interagirCastelo(f).id, 0);
});
test("passos ruidosos e invasão da briga geram alerta; câmera baixa reduz ruído", () => {
  const f = criarEstadoCastelo();
  f.etapa = "salao";
  f.jogador = { x: 0, y: 0, z: 0, yaw: 0 };
  // A short noisy crossing is forgiven; lingering inside the fight still alerts.
  for (let i = 0; i < 500 && !f.alerta; i++)
    atualizarCastelo(f, 0.04, new Set(), false);
  assert.equal(f.alerta, true);
  const silencioso = criarEstadoCastelo();
  silencioso.etapa = "salao";
  atualizarCastelo(silencioso, 0.1, new Set(["w", "Control"]), true);
  assert.equal(silencioso.agachado, true);
  assert.equal(silencioso.correndo, false);
  assert.ok(silencioso.ruido < 0.1);
});
test("escadaria tem caminho contínuo, ativa Davy e arremesso de bola antes do portal", () => {
  const f = criarEstadoCastelo();
  f.etapa = "salao";
  f.painelEscada = true;
  f.jogador = { ...ROTA_ESCADARIA[0], yaw: 0 };
  assert.equal(interagirCastelo(f).tipo, "escada");
  for (const alvo of ROTA_ESCADARIA.slice(1)) andarAte(f, alvo);
  assert.equal(f.davyOuvido, true);
  assert.equal(f.littleVisto, true);
  assert.ok(f.jogador.y > 11.8);
  assert.equal(interagirCastelo(f).tipo, "cj");
  assert.equal(interagirCastelo(f).id, 1);
  f.painelPortal = true;
  assert.equal(interagirCastelo(f).tipo, "portal");
  atualizarCastelo(f, 3.1, new Set());
  assert.equal(f.etapa, "terraco");
  atualizarCastelo(f, 58, new Set());
  assert.equal(f.etapa, "previa");
  assert.equal(f.concluido, false);
  assert.equal(DESAFIOS_CASTELO.length, 2);
  for (const d of DESAFIOS_CASTELO) assert.ok(d.opcoes.includes(d.resposta));
  assert.ok(pontoMaisProximoEscada(-9, -15, 0).distancia < 0.01);
});
test("bola de basquete recebe gravidade, quica e permanece recolhível no patamar", () => {
  const f = criarEstadoCastelo();
  f.etapa = "escada";
  f.trecho = 3;
  f.jogador = { x: 10, y: 7.2, z: -26, yaw: 0 };
  atualizarCastelo(f, 0.04, new Set());
  assert.equal(f.bola.ativa, true);
  assert.ok(f.bola.vy > 0);
  for (let i = 0; i < 160; i++) atualizarCastelo(f, 0.04, new Set());
  f.jogador = { x: 12, y: 7.2, z: -26, yaw: 0 };
  atualizarCastelo(f, 0.04, new Set());
  assert.equal(f.bola.pega, true);
});
test("barco dura dez segundos; Ultra ativa HDR e mantém opções menos exigentes", () => {
  const f = criarEstadoAlisanave();
  avancarEtapaPorto(f, "barco");
  atualizarRegrasPorto(f, 9.9, new Set());
  assert.equal(f.concluido, false);
  atualizarRegrasPorto(f, 0.11, new Set());
  assert.equal(f.concluido, true);
  assert.equal(DURACAO_BARCO, 10);
  assert.equal(perfilGrafico("ultra").hdr, true);
  assert.ok(perfilGrafico("ultra").oclusao > perfilGrafico("medium").oclusao);
  assert.equal(perfilGrafico("low").sombras, false);
  assert.ok(escalaRenderizacao("ultra", 1) > 1);
  assert.ok(escalaRenderizacao("ultra", 4) <= 2);
});

test("a briga alterna arremessos balísticos e mantém ambos dentro do salão", () => {
  for (let i = 0; i < 2; i++) {
    let altura = 0,
      afastamento = 0;
    for (let t = 0; t < 12; t += 0.03) {
      const p = poseBriga(t, i);
      assert.ok(p.y >= 0);
      assert.ok(Math.abs(p.x) < 8);
      altura = Math.max(altura, p.y);
      afastamento = Math.max(afastamento, Math.abs(p.x));
    }
    assert.ok(altura > 1.5);
    assert.ok(afastamento > 7);
  }
});
test("patamares planos separam os encontros e alturas dos degraus são monotônicas", () => {
  for (let i = 0; i < ROTA_ESCADARIA.length - 1; i++) {
    const a = ROTA_ESCADARIA[i],
      b = ROTA_ESCADARIA[i + 1];
    let anterior = a.y;
    for (let j = 0; j <= 100; j++) {
      const y = alturaDegrau(a, b, j / 100);
      assert.ok(y >= anterior - 1e-8);
      assert.ok(y <= b.y + 1e-8);
      anterior = y;
    }
    assert.equal(alturaDegrau(a, b, 1), b.y);
  }
  assert.equal(ROTA_ESCADARIA[1].y, ROTA_ESCADARIA[2].y);
  assert.equal(ROTA_ESCADARIA[3].y, ROTA_ESCADARIA[4].y);
});
test("cutscene bloqueia entradas e termina somente na prévia subaquática", () => {
  const f = criarEstadoCastelo();
  f.etapa = "terraco";
  const p = { ...f.jogador };
  for (let i = 0; i < 560; i++)
    atualizarCastelo(f, 0.1, new Set(["w", "Shift"]));
  assert.deepEqual(f.jogador, p);
  assert.equal(f.etapa, "terraco");
  atualizarCastelo(f, 1.1, new Set());
  assert.equal(f.etapa, "previa");
  atualizarCastelo(f, 10, new Set(["w"]));
  assert.deepEqual(f.jogador, p);
  assert.equal(momentoTerraco(3), "amanhecer");
  assert.equal(momentoTerraco(TEMPOS_TERRACO.explosao + 0.1), "explosao");
  assert.equal(momentoTerraco(60), "previa");
});
