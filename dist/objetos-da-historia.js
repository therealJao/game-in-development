// Módulo do jogo. Consulte GUIA-DE-EDICAO.md antes de alterar estruturas.
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarTubo,
  obterMaterial,
  criarMalha,
  criarTexturaTexto,
} from "./modelos.js";
export function criarBolo() {
  const g = new T.Group(),
    foil = obterMaterial("#d5dbdf", 0.33, 0.48),
    chocolate = obterMaterial("#35170e", 0.28),
    crumb = obterMaterial("#6b3520", 0.92);
  criarCaixa(g, [0.46, 0.105, 0.32], foil, [0, 0.052, 0]);
  criarCaixa(g, [0.42, 0.085, 0.28], crumb, [0, 0.071, 0]);
  criarCaixa(g, [0.43, 0.025, 0.29], chocolate, [0, 0.12, 0]);
  for (const s of [-1, 1]) {
    criarCaixa(g, [0.49, 0.018, 0.018], foil, [0, 0.126, s * 0.159]);
    criarCaixa(g, [0.018, 0.018, 0.34], foil, [s * 0.235, 0.126, 0]);
  }
  for (let i = 0; i < 24; i++)
    for (const s of [-1, 1])
      criarCaixa(
        g,
        [0.009, 0.095, 0.012],
        foil,
        [(i - 11.5) * 0.019, 0.062, s * 0.164],
        [0, 0, s * 0.07],
      );
  for (let i = 0; i < 15; i++)
    for (const s of [-1, 1])
      criarCaixa(g, [0.012, 0.095, 0.009], foil, [s * 0.235, 0.062, (i - 7) * 0.021]);
  for (let x = 0; x < 8; x++)
    for (let z = 0; z < 6; z++) {
      const px = (x - 3.5) * 0.05,
        pz = (z - 2.5) * 0.043;
      criarElipsoide(g, [0.027, 0.023, 0.025], chocolate, [px, 0.14, pz]);
      for (let k = 0; k < 3; k++)
        criarCilindro(
          g,
          0.0025,
          0.0025,
          0.027,
          obterMaterial("#633b2a", 0.5),
          [
            px + Math.sin(x * 11 + z + k) * 0.014,
            0.16 + k * 0.002,
            pz + Math.cos(z * 8 + x + k) * 0.014,
          ],
          [0.7 + k * 0.5, x + z, 1.2],
        );
    }
  g.name = "Bolo_brigadeiro_marmita_aluminio";
  return g;
}
export function criarBiz() {
  const g = new T.Group(),
    black = obterMaterial("#101316", 0.23, 0.28),
    tire = obterMaterial("#151616", 0.94),
    chrome = obterMaterial("#b8bec0", 0.24, 0.88),
    seat = obterMaterial("#171719", 0.86),
    red = obterMaterial("#b92621", 0.25, 0, {
      emissive: "#7c0803",
      emissiveIntensity: 0.3,
    });
  // Front is +Z. Spoked rims, tires, fork, engine, exhaust and step-through fairings.
  const wheels = [];
  for (const z of [-0.73, 0.77]) {
    const w = new T.Group();
    w.position.set(0, 0.36, z);
    g.add(w);
    criarMalha(w, new T.TorusGeometry(0.286, 0.066, 12, 64), tire, [0, 0, 0], [0, Math.PI / 2, 0]);
    criarMalha(w, new T.TorusGeometry(0.244, 0.018, 8, 64), chrome, [0, 0, 0], [0, Math.PI / 2, 0]);
    criarCilindro(w, 0.07, 0.07, 0.16, chrome, [0, 0, 0], [0, 0, Math.PI / 2]);
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      criarTubo(
        w,
        [
          [0, 0, 0],
          [0, Math.cos(a) * 0.245, Math.sin(a) * 0.245],
        ],
        0.0028,
        chrome,
      );
    }
    wheels.push(w);
  }
  criarTubo(
    g,
    [
      [0, 0.4, -0.73],
      [0, 0.67, -0.22],
      [0, 0.45, 0.28],
      [0, 0.94, 0.62],
    ],
    0.035,
    chrome,
  );
  for (const s of [-1, 1]) {
    criarCilindro(g, 0.025, 0.025, 0.55, chrome, [s * 0.085, 0.6, 0.72], [-0.18, 0, 0]);
    criarTubo(
      g,
      [
        [s * 0.09, 0.38, -0.73],
        [s * 0.09, 0.7, -0.48],
      ],
      0.025,
      chrome,
    );
    for (let i = 0; i < 9; i++)
      criarMalha(
        g,
        new T.TorusGeometry(0.038, 0.008, 6, 12),
        chrome,
        [s * 0.1, 0.41 + i * 0.029, -0.71 + i * 0.019],
        [Math.PI / 2, 0, 0],
      );
  }
  criarElipsoide(g, [0.19, 0.12, 0.58], seat, [0, 0.87, -0.3]);
  criarElipsoide(g, [0.18, 0.18, 0.47], black, [0, 0.7, -0.41]);
  criarElipsoide(g, [0.16, 0.31, 0.19], black, [0, 0.75, 0.55], [0.3, 0, 0]);
  criarElipsoide(g, [0.17, 0.16, 0.26], black, [0, 1.03, 0.67]);
  criarElipsoide(
    g,
    [0.125, 0.075, 0.035],
    obterMaterial("#e3eadf", 0.2, 0.15, {
      emissive: "#b5bfa4",
      emissiveIntensity: 0.5,
    }),
    [0, 1.055, 0.9],
  );
  criarElipsoide(g, [0.17, 0.08, 0.36], black, [0, 0.69, 0.02]);
  criarElipsoide(g, [0.2, 0.055, 0.31], black, [0, 0.62, 0.73]);
  criarCilindro(g, 0.14, 0.14, 0.29, chrome, [0, 0.39, -0.12], [0, 0, Math.PI / 2]);
  for (let i = 0; i < 6; i++)
    criarCaixa(g, [0.25, 0.018, 0.19], chrome, [0, 0.42 + i * 0.025, 0.07]);
  criarCilindro(g, 0.055, 0.07, 0.69, black, [-0.2, 0.29, -0.49], [Math.PI / 2, 0, 0]);
  criarCilindro(g, 0.039, 0.039, 0.065, chrome, [-0.2, 0.29, -0.85], [Math.PI / 2, 0, 0]);
  criarTubo(
    g,
    [
      [-0.32, 1.13, 0.61],
      [-0.14, 1.17, 0.65],
      [0.14, 1.17, 0.65],
      [0.32, 1.13, 0.61],
    ],
    0.022,
    chrome,
  );
  for (const s of [-1, 1]) {
    criarCilindro(g, 0.028, 0.028, 0.15, tire, [s * 0.29, 1.13, 0.61], [0, 0, Math.PI / 2]);
    criarTubo(
      g,
      [
        [s * 0.23, 1.16, 0.65],
        [s * 0.3, 1.39, 0.68],
      ],
      0.009,
      chrome,
    );
    criarElipsoide(g, [0.065, 0.1, 0.022], black, [s * 0.3, 1.43, 0.68]);
    criarCaixa(g, [0.05, 0.035, 0.045], obterMaterial("#de8e22", 0.3), [s * 0.17, 0.8, -0.87]);
  }
  criarCaixa(g, [0.16, 0.055, 0.035], red, [0, 0.79, -0.91]);
  criarCaixa(g, [0.13, 0.09, 0.012], obterMaterial("#e7e6d7", 0.6), [0, 0.55, -0.94]);
  for (const s of [-1, 1])
    criarCaixa(
      g,
      [0.007, 0.06, 0.2],
      new T.MeshStandardMaterial({
        map: criarTexturaTexto("BIZ", "#101316", "#d9dfdf"),
        roughness: 0.5,
      }),
      [s * 0.177, 0.72, -0.42],
      [0, (s * Math.PI) / 2, 0],
    );
  g.name = "Biz_preta_modelo_3D";
  return {
    group: g,
    wheels,
  };
}
export function criarSacola() {
  const g = new T.Group(),
    white = obterMaterial("#dfdfd4", 0.8, 0, {
      side: T.DoubleSide,
    });
  const shape = new T.Shape();
  shape.moveTo(-0.43, 0);
  shape.quadraticCurveTo(-0.53, 0.3, -0.35, 0.49);
  shape.lineTo(0.35, 0.49);
  shape.quadraticCurveTo(0.53, 0.3, 0.43, 0);
  shape.closePath();
  criarMalha(
    g,
    new T.ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.015,
      bevelSegments: 3,
    }),
    white,
  );
  for (const x of [-0.24, 0.24])
    criarMalha(
      g,
      new T.TorusGeometry(0.12, 0.018, 8, 32),
      white,
      [x, 0.52, 0.02],
      [0, 0, 0],
      [0.65, 1, 1],
    );
  const logo = new T.TextureLoader().load("assets/bistek-reference.png");
  logo.colorSpace = T.SRGBColorSpace;
  criarCaixa(
    g,
    [0.63, 0.23, 0.008],
    new T.MeshStandardMaterial({
      map: logo,
      roughness: 0.85,
    }),
    [0, 0.25, 0.07],
  );
  return g;
}
