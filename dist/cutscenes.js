import { TEMPOS_AERO } from "./regras-frutiger-aero.js";
import { TEMPOS_LUA } from "./regras-lua.js";
import { TEMPOS_FINAL } from "./regras-final.js";
import { TEMPOS_TERRACO } from "./regras-castelo.js";
const arc = {
  mercadoEntrada: 14,
  carrinhoAtaque: 3.5,
  olhoMagico: 6,
  travessiaCinema: 3,
  cinemaSusto: 2.5,
  cinemaSala: 60,
  cinemaResultado: 12,
};
export function duracaoCutscene(e) {
  if (e.mode === "menu" && e.chuteMenuAtivo) return 3.8;
  if (e.mode === "fall") return 7.81;
  if (e.mode === "classroom") return 15.1;
  if (e.mode === "ride") return 12.1;
  if (e.mode === "tv") return 7.1;
  if (e.mode === "alisanave")
    return { limbo: 22, sala: 18, toboga: 7, barco: 10 }[e.porto?.etapa] || 0;
  if (e.mode === "castelo")
    return (
      { chegada: 10, portal: 3, terraco: TEMPOS_TERRACO.previa }[
        e.castelo?.etapa
      ] || 0
    );
  if (e.mode === "aero") {
    const s = e.aero?.etapa;
    if (
      [
        "lanchoneteExplorar",
        "futebol",
        "ritmo",
        "pagamento",
        "compras",
        "telefoneBiz",
        "fimAero",
        "fimJogo",
      ].includes(s)
    )
      return 0;
    return TEMPOS_FINAL[s] || TEMPOS_LUA[s] || arc[s] || TEMPOS_AERO[s] || 0;
  }
  return 0;
}
// Advance the scene clock; the existing transition still performs its checkpoints,
// positioning and mandatory programming challenges on the next simulation step.
export function solicitarPulo(e) {
  const duration = duracaoCutscene(e);
  if (!duration) return false;
  if (e.mode === "menu") e.tempoChuteMenu = duration;
  else if (e.mode === "fall") e.fallTime = duration;
  else if (e.mode === "classroom") e.tempoCenaBrita = duration;
  else if (e.mode === "ride") e.dungeonTime = duration;
  else if (e.mode === "tv") e.tvTime = duration;
  else {
    const f =
      e.mode === "aero" ? e.aero : e.mode === "castelo" ? e.castelo : e.porto;
    f.tempo = duration;
  }
  return true;
}
