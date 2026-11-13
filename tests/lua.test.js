import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  criarEstadoAero,
  atualizarAero,
  TEMPOS_AERO,
} from "../dist/regras-frutiger-aero.js";
import {
  ETAPAS_LUA,
  TEMPOS_LUA,
  FALAS_LUA,
  sonsLua,
} from "../dist/regras-lua.js";
import {
  limitarPassoProgramacao,
  obterDesafioNovaFase,
  responderDesafioNovaFase,
} from "../dist/desafios-novas-fases.js";

function duracaoWav(id) {
  const b = fs.readFileSync(
    new URL("../dist/assets/lua/falas/" + id + ".wav", import.meta.url),
  );
  let taxa, bytes;
  for (let o = 12; o + 8 <= b.length;) {
    const nome = b.toString("ascii", o, o + 4),
      n = b.readUInt32LE(o + 4);
    if (nome === "fmt ") taxa = b.readUInt32LE(o + 16);
    if (nome === "data") bytes = n;
    o += 8 + n + (n % 2);
  }
  assert(taxa && bytes);
  return bytes / taxa;
}
test("vitória no vôlei leva a Brita e à lua; os dois jornais cercam a chegada e a explosão", () => {
  const f = criarEstadoAero("voleiVitoria");
  atualizarAero(f, TEMPOS_AERO.voleiVitoria);
  for (const etapa of ETAPAS_LUA) {
    if (etapa === "fimLua") {
      assert.equal(f.etapa, "mercadoEntrada");
      break;
    }
    assert.equal(f.etapa, etapa);
    atualizarAero(f, TEMPOS_LUA[etapa] - 0.01);
    assert.equal(f.etapa, etapa);
    atualizarAero(f, 0.02);
  }
  assert.equal(f.etapa, "mercadoEntrada");
  assert(
    ETAPAS_LUA.indexOf("preceiroLeitura") <
      ETAPAS_LUA.indexOf("kompraoChegada"),
  );
  assert(
    ETAPAS_LUA.indexOf("preceiroExplosao") <
      ETAPAS_LUA.indexOf("kompraoJornais"),
  );
});
test("nenhuma fala é cortada pela próxima ou pela troca de cena", () => {
  for (const fala of FALAS_LUA) {
    const proxima = FALAS_LUA.find((l) => l[0] === fala[0] && l[1] > fala[1]);
    const fim = fala[1] + duracaoWav(fala[2]);
    assert(
      fim <= (proxima?.[1] ?? TEMPOS_LUA[fala[0]]),
      fala[2] + " seria cortada",
    );
  }
});
test("reações e jingle respeitam as falas e ficam restritos à cena correta", () => {
  const id = (s) => s.map((v) => v[0]);
  assert(
    !id(sonsLua({ etapa: "preceiroLeitura", tempo: 2 })).includes(
      "lua-reacao-caro",
    ),
  );
  assert(
    id(sonsLua({ etapa: "preceiroLeitura", tempo: 5.6 })).includes(
      "lua-reacao-caro",
    ),
  );
  assert(
    id(sonsLua({ etapa: "kompraoLeitura", tempo: 5.1 })).includes(
      "lua-reacao-bom",
    ),
  );
  assert(
    id(sonsLua({ etapa: "kompraoChegada", tempo: 5.3 })).includes("lua-jingle"),
  );
  assert(
    !id(sonsLua({ etapa: "preceiroExplosao", tempo: 1 })).includes(
      "lua-jingle",
    ),
  );
  for (const etapa of ETAPAS_LUA)
    for (const [, file, volume] of sonsLua({ etapa, tempo: 6 })) {
      assert(fs.existsSync(new URL("../dist/" + file, import.meta.url)));
      assert(Number.isFinite(volume));
    }
});
test("terminais da placa e dos preços pausam a sequência até a resposta correta", () => {
  for (const etapa of ["luaChegada", "kompraoLeitura"]) {
    const f = criarEstadoAero(etapa);
    atualizarAero(f, limitarPassoProgramacao(f, 100));
    assert.equal(f.etapa, etapa);
    const desafio = obterDesafioNovaFase(f);
    assert(desafio);
    responderDesafioNovaFase(f, desafio.id, (desafio.correta + 1) % 3);
    assert(obterDesafioNovaFase(f));
    responderDesafioNovaFase(f, desafio.id, desafio.correta);
    assert.equal(obterDesafioNovaFase(f), undefined);
    atualizarAero(f, TEMPOS_LUA[etapa]);
    assert.notEqual(f.etapa, etapa);
  }
});
