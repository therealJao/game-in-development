import { CONFIGURACAO } from "./configuracao.js";
// Módulo do jogo. Consulte GUIA-DE-EDICAO.md antes de alterar estruturas.
import { calcularDistancia, temVisaoDireta } from "./mapas.js";
export /* Distribui logos em caminhos acessíveis, mantendo distância entre eles. */
function criarColetaveis(level, chapter = 0) {
  const pool = level.cells.filter(
    (p) =>
      calcularDistancia(p, level.spawn) > 4 &&
      calcularDistancia(p, level.exit) > 3 &&
      level.terminals.every((t) => calcularDistancia(p, t) > 3),
  );
  const selected = [];
  const early = pool
    .filter(
      (p) => calcularDistancia(p, level.spawn) < 12 && temVisaoDireta(level.map, level.spawn, p),
    )
    .sort((a, b) => calcularDistancia(a, level.spawn) - calcularDistancia(b, level.spawn))[0];
  if (early) selected.push(early);
  while (selected.length < CONFIGURACAO.logosPorFase[chapter]) {
    let melhorPontuacao = null,
      score = 0;
    for (const p of pool) {
      const separation = selected.length
        ? Math.min(...selected.map((s) => calcularDistancia(p, s)))
        : calcularDistancia(p, level.spawn);
      if (separation > score && separation >= 7) {
        score = separation;
        melhorPontuacao = p;
      }
    }
    if (!melhorPontuacao) break;
    selected.push(melhorPontuacao);
  }
  return selected.map((p, id) => ({
    x: p.x,
    z: p.z,
    id,
    used: false,
  }));
}
