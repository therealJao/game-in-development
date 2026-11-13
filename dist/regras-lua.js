// Continuação da praia. As falas e os efeitos dependem do tempo da cena,
// que para junto com o jogo e com os terminais de programação.
export const TEMPOS_LUA = Object.freeze({
  britaChegada: 7,
  britaDiscussao: 47.03,
  viagemLua: 10,
  luaChegada: 8,
  preceiroJornais: 10,
  preceiroLeitura: 8,
  kompraoChegada: 8,
  preceiroExplosao: 5,
  kompraoJornais: 10,
  kompraoLeitura: 9,
});
export const ETAPAS_LUA = Object.freeze([...Object.keys(TEMPOS_LUA), "fimLua"]);
export const FALAS_LUA = Object.freeze([
  [
    "britaChegada",
    2.7,
    "brita-buscar",
    "BRITA",
    "Sai da frente! Eu vim buscar o Axel!",
  ],
  [
    "britaDiscussao",
    0,
    "axel-todos",
    "AXEL",
    "Se vai me levar, leva todo mundo nas costas.",
  ],
  [
    "britaDiscussao",
    4.07,
    "brita-todos",
    "BRITA",
    "Todo mundo? Eu vim buscar você, não a praia inteira!",
  ],
  [
    "britaDiscussao",
    9.02,
    "axel-turma",
    "AXEL",
    "Naverdachi, Bruno, Bob, Alya e Jonesy vão junto. Ninguém fica pra trás!",
  ],
  [
    "britaDiscussao",
    16.14,
    "brita-onibus",
    "BRITA",
    "Você acha que eu sou ônibus? Como vou carregar esse povo?",
  ],
  [
    "britaDiscussao",
    21.13,
    "nav-segura",
    "NAVERDACHI",
    "A gente se segura bem. Dá uma força, Brita!",
  ],
  [
    "britaDiscussao",
    25.71,
    "brita-costas",
    "BRITA",
    "Não cabe mais ninguém nas minhas costas!",
  ],
  [
    "britaDiscussao",
    29.09,
    "axel-ajuda",
    "AXEL",
    "Vai caber sim. Ajuda a gente, Brita. Todo mundo vai!",
  ],
  [
    "britaDiscussao",
    35.27,
    "brita-concorda",
    "BRITA",
    "Tá bom! Sobe todo mundo. Mas sem reclamar do voo!",
  ],
  [
    "britaDiscussao",
    40.73,
    "axel-onde",
    "AXEL",
    "Espera! Pra onde a gente vai?",
  ],
  ["britaDiscussao", 44.33, "brita-lua", "BRITA", "Para a lua!"],
  [
    "luaChegada",
    0.6,
    "nav-lua",
    "NAVERDACHI",
    "É a lua do Preceiro! Tem até supermercado aqui!",
  ],
  [
    "preceiroJornais",
    0.5,
    "vendedor-preceiro",
    "VENDEDOR",
    "Bem-vindos ao Preceiro! Um jornal de ofertas para cada um.",
  ],
  [
    "preceiroLeitura",
    0.3,
    "axel-caro",
    "AXEL",
    "Caramba! Olha esses preços! Assim não dá!",
  ],
  [
    "kompraoChegada",
    0.2,
    "nav-planeta",
    "NAVERDACHI",
    "Axel, olha pra cima! Tem um planeta vindo com tudo!",
  ],
  [
    "kompraoJornais",
    0.5,
    "vendedor-komprao",
    "VENDEDOR",
    "Bem-vindos ao Komprão! Aqui está o jornal de cada um.",
  ],
  [
    "kompraoLeitura",
    0.3,
    "axel-barato",
    "AXEL",
    "Agora sim! Esses preços estão bem melhores!",
  ],
]);
export function falaLua(f) {
  return FALAS_LUA.filter((l) => l[0] === f.etapa && l[1] <= f.tempo).at(-1);
}
export function atualizarSequenciaLua(f) {
  const duracao = TEMPOS_LUA[f.etapa];
  if (duracao && f.tempo >= duracao) {
    const proxima = ETAPAS_LUA[ETAPAS_LUA.indexOf(f.etapa) + 1];
    f.etapa = proxima === "fimLua" ? "mercadoEntrada" : proxima;
    f.tempo = 0;
  }
}
export function sonsLua(f) {
  const sons = [],
    fala = falaLua(f);
  if (fala)
    sons.push(["lua-" + fala[2], "assets/lua/falas/" + fala[2] + ".wav", 1]);
  if (f.etapa === "preceiroLeitura" && f.tempo >= 5.5 && f.tempo < 7.5)
    sons.push(["lua-reacao-caro", "assets/lua/precos-caros.mp3", 1]);
  if (f.etapa === "kompraoLeitura" && f.tempo >= 5 && f.tempo < 7.5)
    sons.push(["lua-reacao-bom", "assets/lua/precos-bons.mp3", 1]);
  if (f.etapa === "kompraoChegada" && f.tempo >= 5.2 && f.tempo < 7.3)
    sons.push(["lua-jingle", "assets/lua/komprao-jingle.m4a", 1]);
  return sons;
}
