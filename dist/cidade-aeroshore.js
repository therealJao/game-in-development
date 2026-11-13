// Recriação geométrica inspirada nas capturas públicas do Gm_AeroShore, adaptada ao fundo do mar.
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarMalha,
  criarTubo,
  obterMaterial,
  criarTexturaTexto,
} from "./modelos.js";
function painel(g, texto, pos, l = 2, h = 3) {
  return criarCaixa(
    g,
    [l, h, 0.12],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto(texto, "#076386", "#bdf9ff"),
      emissive: "#14728b",
      emissiveIntensity: 0.2,
    }),
    pos,
  );
}
export function criarCidadeAeroShore() {
  const g = new T.Group();
  g.name = "Recriacao_AeroShore_cidade_costeira";
  const branco = obterMaterial("#e5edf0", 0.62),
    concreto = obterMaterial("#a0b5b8", 0.86),
    lima = obterMaterial("#94be37", 0.48),
    azul = new T.MeshPhysicalMaterial({
      color: "#1c71d2",
      roughness: 0.08,
      metalness: 0.28,
      clearcoat: 1,
    }),
    verde = new T.MeshPhysicalMaterial({
      color: "#40bc9d",
      roughness: 0.1,
      metalness: 0.18,
      clearcoat: 1,
    });
  criarCaixa(g, [105, 1.5, 100], obterMaterial("#55996b", 0.92), [0, -1.3, 0]);
  criarCaixa(g, [100, 0.16, 11], obterMaterial("#8b999b", 0.9), [0, -0.1, 23]);
  criarCaixa(g, [13, 0.16, 85], concreto, [11, -0.04, -2]);
  for (const z of [15.6, 30.4])
    criarCaixa(g, [100, 0.22, 3.4], concreto, [0, 0.08, z]);
  // Dois blocos brancos de vidro verde, átrio arborizado e passarelas azuis.
  for (const x of [-19, 22]) {
    criarCaixa(g, [17, 12, 29], branco, [x, 6, -11]);
    for (const y of [2.6, 7.5])
      for (let z = -24; z <= 1; z += 2.4) {
        criarCaixa(g, [0.12, 3.7, 2.15], verde, [
          x + (x < 0 ? 8.56 : -8.56),
          y,
          z,
        ]);
        criarCaixa(g, [0.2, 4, 0.12], concreto, [
          x + (x < 0 ? 8.65 : -8.65),
          y,
          z + 1.15,
        ]);
      }
    for (const y of [2.6, 7.5])
      for (let dx = -7; dx <= 7; dx += 2.1) {
        criarCaixa(g, [1.8, 3.7, 0.12], verde, [x + dx, y, 3.6]);
        criarCaixa(g, [0.13, 4, 0.15], concreto, [x + dx + 1, y, 3.7]);
      }
    criarCaixa(g, [18, 0.5, 30], branco, [x, 12.2, -11]);
  }
  for (let z = -25; z <= 3; z += 5) {
    criarTubo(
      g,
      [
        [-11, 12.6, z],
        [0, 14.3, z],
        [13, 12.6, z],
      ],
      0.08,
      concreto,
    );
    criarCaixa(
      g,
      [25, 0.045, 4.8],
      new T.MeshPhysicalMaterial({
        color: "#96dfeb",
        transparent: true,
        opacity: 0.25,
        roughness: 0.1,
        side: T.DoubleSide,
      }),
      [1, 13.3, z],
    );
  }
  for (const z of [-28, -8]) criarCaixa(g, [24, 0.45, 3], azul, [1, 10, z]);
  for (const x of [-4, 5]) {
    criarCilindro(g, 1.1, 1.4, 0.5, lima, [x, 0.25, -13]);
    criarCilindro(g, 0.24, 0.37, 6, obterMaterial("#655e40", 0.92), [
      x,
      3,
      -13,
    ]);
    for (let i = 0; i < 9; i++)
      criarElipsoide(
        g,
        [2.1, 1.2, 2],
        obterMaterial(i % 2 ? "#44854f" : "#82ac53", 0.9),
        [x + Math.cos(i) * 1.7, 6 + (i % 3), -13 + Math.sin(i) * 1.5],
      );
  }
  // Torre azul curva, com faixas horizontais e montantes verticais.
  criarCilindro(g, 8, 8, 31, azul, [-34, 15.5, -31], undefined, undefined);
  for (let y = 1; y < 31; y += 3)
    criarCilindro(g, 8.06, 8.06, 0.13, branco, [-34, y, -31]);
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    criarCaixa(g, [0.1, 31, 0.1], branco, [
      -34 + Math.cos(a) * 8.05,
      15.5,
      -31 + Math.sin(a) * 8.05,
    ]);
  }
  criarCilindro(g, 8.7, 8.7, 0.5, branco, [-34, 31.2, -31]);
  // Edifício branco ao fundo, com janelas azuis e cobertura curva.
  criarCaixa(g, [21, 29, 12], branco, [4, 14.5, -42]);
  for (let y = 2; y < 28; y += 3)
    for (let x = -8; x < 10; x += 2.7)
      criarCaixa(g, [2.1, 1.6, 0.12], azul, [4 + x, y, -35.9]);
  criarElipsoide(g, [12, 0.45, 7], branco, [4, 29.2, -42]);
  // Ponto de ônibus, banco verde, painel e quiosque baseados nas vistas do Workshop.
  const abribus = new T.Group();
  g.add(abribus);
  abribus.position.set(0, 0, 16);
  for (const x of [-4, 4])
    for (const z of [-1.5, 1.5])
      criarCilindro(abribus, 0.06, 0.06, 3.7, concreto, [x, 1.85, z]);
  criarCaixa(abribus, [8.5, 0.12, 3.5], branco, [0, 3.8, 0]);
  criarCaixa(abribus, [8, 2.8, 0.08], verde, [0, 1.9, -1.5]);
  for (let y = 0.6; y < 1.4; y += 0.2)
    criarCaixa(abribus, [5, 0.12, 0.1], lima, [0, y, -0.8]);
  criarCaixa(abribus, [5, 0.12, 0.65], lima, [0, 0.6, -0.4]);
  for (const x of [-2, 2])
    criarCaixa(abribus, [0.12, 0.6, 0.7], branco, [x, 0.3, -0.4]);
  painel(abribus, "AERO SHORE • AQUA", [-3, 2, -1.4], 1.5, 2.6);
  const quiosque = new T.Group();
  g.add(quiosque);
  quiosque.position.set(2, 0, -1);
  criarCaixa(quiosque, [1.5, 1, 1.3], branco, [0, 0.5, 0]);
  criarCaixa(quiosque, [1.8, 2, 0.4], lima, [0, 2, 0]);
  painel(quiosque, "AERO • CITY", [0, 2, 0.25], 1.5, 1.7);
  // Vegetação de orla e calçada sinuosa aproximam a composição costeira das referências.
  for (let i = 0; i < 33; i++) {
    const x = -49 + i * 3,
      z = 38 + Math.sin(i * 0.22) * 5;
    criarCaixa(
      g,
      [3.1, 0.1, 2],
      concreto,
      [x, 0, z],
      [0, Math.cos(i * 0.22) * 0.15, 0],
    );
    if (i % 3 === 0) {
      criarCilindro(g, 0.14, 0.2, 3.7, obterMaterial("#65533a", 0.9), [
        x,
        1.85,
        z + 4,
      ]);
      for (let j = 0; j < 5; j++)
        criarElipsoide(g, [1.4, 1.5, 1.4], obterMaterial("#4f8d53", 0.9), [
          x + Math.cos(j) * 0.8,
          4 + (j % 2),
          z + 4 + Math.sin(j) * 0.8,
        ]);
    }
  }
  for (let i = 0; i < 14; i++) {
    const x = -45 + i * 7;
    criarCilindro(g, 0.055, 0.09, 5.5, branco, [x, 2.75, 29]);
    criarElipsoide(
      g,
      [0.24, 0.12, 0.24],
      obterMaterial("#d9fdff", 0.3, 0, {
        emissive: "#a7eeff",
        emissiveIntensity: 0.65,
      }),
      [x, 5.5, 29],
    );
  }
  return g;
}
