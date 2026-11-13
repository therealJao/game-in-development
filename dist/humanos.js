import { NATAL_ATIVO, criarToucaNatal } from "./natal.js";
// Corpos humanos articulados: ombro, cotovelo, quadril e joelho.
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarElipsoide,
  criarCilindro,
  criarTubo,
  obterMaterial,
  criarMalha,
} from "./modelos.js";

export function criarHumano({
  camisa = "#15191f",
  pele = "#c39577",
  cabelo = "#34251f",
  oculos = false,
} = {}) {
  const group = new T.Group();
  const roupa = obterMaterial(camisa, 0.9),
    tomPele = obterMaterial(pele, 0.85),
    calca = obterMaterial("#232b35", 0.95);
  const body = new T.Group();
  group.add(body);
  criarElipsoide(body, [0.235, 0.31, 0.13], roupa, [0, 1.29, 0]);
  criarElipsoide(body, [0.18, 0.18, 0.12], roupa, [0, 1.04, 0]);
  criarElipsoide(body, [0.18, 0.1, 0.13], calca, [0, 0.92, 0]);
  const head = new T.Group();
  head.position.set(0, 1.73, 0);
  body.add(head);
  criarCilindro(head, 0.055, 0.065, 0.14, tomPele, [0, -0.15, 0]);
  criarElipsoide(head, [0.112, 0.153, 0.105], tomPele, [0, 0, 0]);
  criarElipsoide(head, [0.085, 0.055, 0.085], tomPele, [0, -0.1, 0.018]);
  criarElipsoide(
    head,
    [0.116, 0.066, 0.11],
    obterMaterial(cabelo, 0.96),
    [0, 0.118, -0.008],
  );
  for (const lado of [-1, 1]) {
    criarElipsoide(head, [0.018, 0.037, 0.02], tomPele, [
      lado * 0.113,
      -0.015,
      0,
    ]);
    criarElipsoide(head, [0.024, 0.012, 0.008], obterMaterial("#e3e0d1", 0.6), [
      lado * 0.045,
      0.015,
      0.096,
    ]);
    criarElipsoide(head, [0.009, 0.01, 0.005], obterMaterial("#263a2d", 0.6), [
      lado * 0.045,
      0.015,
      0.103,
    ]);
    if (oculos)
      criarCaixa(head, [0.09, 0.047, 0.02], obterMaterial("#121719", 0.25), [
        lado * 0.051,
        0.024,
        0.115,
      ]);
  }
  criarElipsoide(head, [0.018, 0.031, 0.028], tomPele, [0, -0.025, 0.105]);
  criarTubo(
    head,
    [
      [-0.029, -0.075, 0.092],
      [0, -0.079, 0.105],
      [0.029, -0.075, 0.092],
    ],
    0.003,
    obterMaterial("#805848", 0.95),
  );
  if (oculos)
    criarCaixa(
      head,
      [0.025, 0.009, 0.018],
      obterMaterial("#15191c", 0.4),
      [0, 0.025, 0.119],
    );
  const arms = [],
    legs = [],
    cotovelos = [],
    joelhos = [];
  for (const lado of [-1, 1]) {
    const ombro = new T.Group();
    ombro.position.set(lado * 0.245, 1.48, 0);
    body.add(ombro);
    arms.push(ombro);
    criarElipsoide(ombro, [0.092, 0.12, 0.095], roupa, [0, -0.04, 0]);
    criarCilindro(ombro, 0.067, 0.059, 0.26, roupa, [0, -0.17, 0]);
    const cotovelo = new T.Group();
    cotovelo.position.y = -0.3;
    ombro.add(cotovelo);
    cotovelos.push(cotovelo);
    criarElipsoide(cotovelo, [0.059, 0.06, 0.061], roupa, [0, 0, 0]);
    criarCilindro(cotovelo, 0.056, 0.041, 0.24, roupa, [0, -0.12, 0]);
    criarElipsoide(cotovelo, [0.042, 0.069, 0.033], tomPele, [0, -0.28, 0.01]);
    for (let i = 0; i < 4; i++)
      criarElipsoide(cotovelo, [0.008, 0.025, 0.01], tomPele, [
        (i - 1.5) * 0.018,
        -0.329,
        0.018,
      ]);
    const quadril = new T.Group();
    quadril.position.set(lado * 0.11, 0.93, 0);
    group.add(quadril);
    legs.push(quadril);
    criarElipsoide(quadril, [0.094, 0.23, 0.1], calca, [0, -0.18, 0]);
    const joelho = new T.Group();
    joelho.position.y = -0.4;
    quadril.add(joelho);
    joelhos.push(joelho);
    criarElipsoide(joelho, [0.076, 0.07, 0.079], calca, [0, 0, 0]);
    criarCilindro(joelho, 0.072, 0.051, 0.36, calca, [0, -0.18, 0]);
    criarElipsoide(
      joelho,
      [0.074, 0.064, 0.142],
      obterMaterial("#14191e", 0.8),
      [0, -0.43, 0.048],
    );
  }
  const hood = new T.Group();
  hood.position.set(0, 1.73, 0);
  group.add(hood);
  criarMalha(
    hood,
    new T.SphereGeometry(
      0.155,
      24,
      18,
      Math.PI / 2 + 0.52,
      Math.PI * 2 - 1.04,
      0,
      Math.PI * 0.87,
    ),
    roupa,
    [0, 0.015, -0.025],
    [0, 0, 0],
    [1, 1.18, 1],
  );
  if (NATAL_ATIVO()) {
    const touca = criarToucaNatal(0.12);
    touca.position.set(0, 0.11, -0.01);
    touca.rotation.set(-0.18, 0, 0.05);
    head.add(touca);
  }
  hood.visible = false;
  return {
    group,
    body,
    head,
    arms,
    legs,
    hood,
    cotovelos,
    joelhos,
    limbs: [legs[0], arms[0], legs[1], arms[1]],
    animate(tempo, velocidade = 0) {
      body.position.y = Math.sin(tempo * 1.9) * 0.005;
      head.rotation.y = Math.sin(tempo * 0.6) * 0.025;
      head.rotation.x = Math.sin(tempo * 1.2) * 0.008;
      legs.forEach((perna, i) => {
        perna.rotation.x =
          Math.sin(tempo * 9 + i * Math.PI) * Math.min(0.6, velocidade * 0.15);
        joelhos[i].rotation.x =
          Math.max(0, -Math.sin(tempo * 9 + i * Math.PI)) *
          0.35 *
          (velocidade > 0 ? 1 : 0);
      });
      arms.forEach(
        (braco, i) =>
          (braco.rotation.x =
            -Math.sin(tempo * 9 + i * Math.PI) *
            Math.min(0.4, velocidade * 0.1)),
      );
    },
  };
}
