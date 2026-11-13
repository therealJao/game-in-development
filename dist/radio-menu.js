export const FAIXAS_RADIO = Object.freeze([
  {
    titulo: "Modjo - Lady (Hear Me Tonight)",
    arquivo: "assets/radio/faixa-1.m4a",
  },
  {
    titulo: "Fergie feat. Ludacris - Glamorous",
    arquivo: "assets/radio/faixa-2.m4a",
  },
  { titulo: "Rihanna - Diamonds", arquivo: "assets/radio/faixa-3.m4a" },
  { titulo: "Amerie - 1 Thing", arquivo: "assets/radio/faixa-4.m4a" },
]);
export function indiceRadio(value) {
  return Number.isInteger(Number(value))
    ? Math.max(0, Math.min(FAIXAS_RADIO.length - 1, Number(value)))
    : 0;
}
