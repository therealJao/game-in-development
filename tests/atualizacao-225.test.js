import test from "node:test";
import assert from "node:assert/strict";
import { duracaoCutscene, solicitarPulo } from "../dist/cutscenes.js";
import {
  criarEstadoAero,
  atualizarAero,
} from "../dist/regras-frutiger-aero.js";
import {
  criarEstadoAlisanave,
  atualizarRegrasPorto,
} from "../dist/regras-alisanave.js";
import {
  criarEstadoCastelo,
  atualizarCastelo,
} from "../dist/regras-castelo.js";
import { criarEstadoFinal } from "../dist/regras-final.js";
import { obterDesafioNovaFase } from "../dist/desafios-novas-fases.js";
import { validarPreferencias } from "../dist/interface-2026.js";
import { FAIXAS_RADIO, indiceRadio } from "../dist/radio-menu.js";
import { primeiraPessoaAtiva } from "../dist/maos-primeira-pessoa.js";

test("pular cutscenes mantém as transições e posições de entrada do porto e castelo", () => {
  const porto = criarEstadoAlisanave();
  porto.etapa = "toboga";
  assert.ok(solicitarPulo({ mode: "alisanave", porto }));
  atualizarRegrasPorto(porto, 0.02, new Set());
  assert.equal(porto.etapa, "labirinto");
  assert.equal(porto.jogador.x, porto.inicio.x);
  const castelo = criarEstadoCastelo();
  assert.ok(solicitarPulo({ mode: "castelo", castelo }));
  atualizarCastelo(castelo, 0.02, new Set());
  assert.equal(castelo.etapa, "salao");
});
test("pular a ligação termina a chamada e inicializa a viagem da Biz", () => {
  const aero = criarEstadoAero("ligacaoBrita");
  aero.final = criarEstadoFinal();
  assert.ok(solicitarPulo({ mode: "aero", aero }));
  atualizarAero(aero, 0.02);
  assert.equal(aero.etapa, "viagemBiz");
  assert.ok(aero.final.ligou);
});
test("botão não pula partidas, compras, terminais nem a interação do telefone", () => {
  for (const etapa of [
    "volei",
    "futebol",
    "ritmo",
    "compras",
    "lanchoneteExplorar",
    "telefoneBiz",
    "peppaExplorar",
  ]) {
    const aero = criarEstadoAero(etapa);
    aero.tempo = 2;
    assert.equal(duracaoCutscene({ mode: "aero", aero }), 0, etapa);
    assert.equal(solicitarPulo({ mode: "aero", aero }), false, etapa);
    assert.equal(aero.tempo, 2);
  }
  const aero = criarEstadoAero("viagem");
  solicitarPulo({ mode: "aero", aero });
  assert.ok(
    obterDesafioNovaFase(aero),
    "um desafio obrigatório continua pendente após avançar o relógio",
  );
});
test("opções e rádio validam os valores persistidos; a primeira faixa é Jingle Bells", () => {
  const p = validarPreferencias({
    tema: "invalid",
    sensibilidade: 999,
    tamanhoLegenda: 5,
    radioFaixa: 99,
    maos: false,
  });
  assert.equal(p.tema, "natal");
  assert.equal(p.sensibilidade, 2);
  assert.equal(p.tamanhoLegenda, 18);
  assert.equal(p.radioFaixa, 3);
  assert.equal(p.maos, false);
  assert.equal(indiceRadio(NaN), 0);
  assert.match(FAIXAS_RADIO[0].titulo, /Jingle Bells/);
  assert.equal(FAIXAS_RADIO.length, 4);
});
test("braços aparecem nas câmeras de primeira pessoa e não nas partidas vistas de fora", () => {
  assert.ok(primeiraPessoaAtiva({ mode: "playing" }));
  assert.ok(
    primeiraPessoaAtiva({
      mode: "paused",
      previousMode: "aero",
      aero: { etapa: "cinemaEscapar" },
    }),
  );
  for (const mode of ["menu", "home", "ride", "classroom"])
    assert.equal(primeiraPessoaAtiva({ mode }), false);
  for (const etapa of ["volei", "futebol", "praiaChegada"])
    assert.equal(primeiraPessoaAtiva({ mode: "aero", aero: { etapa } }), false);
});
