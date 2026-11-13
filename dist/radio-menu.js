// Rádio do menu — Natal 2026. Melodias tradicionais de domínio público, arranjadas e
// sintetizadas para o jogo (sinos, coral sintético, baixo e guizos). Arquivos em assets/radio/.
export const FAIXAS_RADIO = Object.freeze([
  { titulo: "Jingle Bells (tradicional)", arquivo: "assets/radio/natal-1.mp3" },
  { titulo: "Noite Feliz (tradicional)", arquivo: "assets/radio/natal-2.mp3" },
  { titulo: "We Wish You a Merry Christmas (tradicional)", arquivo: "assets/radio/natal-3.mp3" },
  { titulo: "Deck the Halls (tradicional)", arquivo: "assets/radio/natal-4.mp3" },
]);
export function indiceRadio(value) {
  return Number.isInteger(Number(value))
    ? Math.max(0, Math.min(FAIXAS_RADIO.length - 1, Number(value)))
    : 0;
}
