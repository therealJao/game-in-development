export const TEMPOS_PONTO_KENTE = Object.freeze({
  perguntaAxel: 12,
  perguntaNav: 17,
  cozinha: 22,
  fimAudio: 31.15,
  explorar: 42,
  refeicao: 18,
});
export const BALCAO_PONTO_KENTE = Object.freeze({ x: 0.35, z: -3.65 });
export const MESAS_PONTO_KENTE = Object.freeze([
  { x: -3.25, z: -3.05, raio: 0.8 },
  { x: -3.25, z: -1.25, raio: 0.8 },
  { x: 2.6, z: 0.35, raio: 0.95 },
  { x: 2.6, z: 3.7, raio: 0.95 },
]);
export function podeAndarPontoKente(x, z) {
  if (x < -4.05 || x > 4.05 || z < -3.9 || z > 5.9) return false;
  if (x < -2.7 && z > -0.1 && z < 2.4) return false;
  if (x > 0.9 && x < 2.0 && z < -2.7) return false;
  return MESAS_PONTO_KENTE.every((m) => Math.hypot(x - m.x, z - m.z) > m.raio);
}
export function pertoBalcaoPontoKente(f) {
  return (
    f.etapa === "lanchoneteExplorar" &&
    Math.hypot(
      f.jogador.x - BALCAO_PONTO_KENTE.x,
      f.jogador.z - BALCAO_PONTO_KENTE.z,
    ) < 1.4
  );
}
export function atualizarExploracaoPontoKente(f, dt, teclas, corrida) {
  const p = f.jogador;
  if (teclas.has("ArrowLeft")) p.yaw += dt * 1.8;
  if (teclas.has("ArrowRight")) p.yaw -= dt * 1.8;
  const frente =
      (teclas.has("w") ? 1 : 0) -
      (teclas.has("s") ? 1 : 0) -
      (teclas.controle?.y || 0),
    lado =
      (teclas.has("d") ? 1 : 0) -
      (teclas.has("a") ? 1 : 0) +
      (teclas.controle?.x || 0),
    n = Math.hypot(frente, lado);
  f.movendo = n > 0.05;
  f.correndo = corrida || teclas.has("Shift");
  if (!f.movendo) return;
  const passos = Math.max(1, Math.ceil(dt / 0.025)),
    v = ((f.correndo ? 3.8 : 2.5) * dt) / (Math.max(1, n) * passos),
    dx = (-Math.sin(p.yaw) * frente + Math.cos(p.yaw) * lado) * v,
    dz = (-Math.cos(p.yaw) * frente - Math.sin(p.yaw) * lado) * v;
  for (let i = 0; i < passos; i++) {
    if (podeAndarPontoKente(p.x + dx, p.z)) p.x += dx;
    if (podeAndarPontoKente(p.x, p.z + dz)) p.z += dz;
  }
}
