import { NATAL_ATIVO, criarToucaNatal } from "./natal.js";
// Módulo do jogo. Consulte GUIA-DE-EDICAO.md antes de alterar estruturas.
import { NOMES } from "./configuracao.js";
import * as T from "./vendor/three.module.js";
import { materialPele } from "./pele.js";
import { criarCabecaRealista } from "./cabeca-realista.js";
import {
  criarMalha,
  criarCaixa,
  criarElipsoide,
  criarCilindro,
  criarTubo,
  obterMaterial,
} from "./modelos.js";

// Costura volumétrica: perfis de cintura, ombros e barra, com abertura frontal.
function criarRoupa(parent, levels, material, gap = 0.0) {
  const vertices = [],
    uv = [],
    indices = [],
    segments = 40;
  for (let j = 0; j < levels.length; j++) {
    const [y, w, d] = levels[j];
    for (let i = 0; i <= segments; i++) {
      const a = gap + (i / segments) * (Math.PI * 2 - gap * 2);
      vertices.push(Math.sin(a) * w, y, Math.cos(a) * d);
      uv.push(i / segments, j / (levels.length - 1));
    }
  }
  for (let j = 0; j < levels.length - 1; j++)
    for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i,
        b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return criarMalha(parent, g, material);
}
function criarLapela(parent, side, material) {
  const s = new T.Shape();
  s.moveTo(side * 0.085, 1.65);
  s.lineTo(side * 0.265, 1.57);
  s.lineTo(side * 0.2, 1.39);
  s.lineTo(side * 0.09, 1.19);
  s.lineTo(side * 0.045, 1.4);
  s.closePath();
  return criarMalha(
    parent,
    new T.ExtrudeGeometry(s, {
      depth: 0.018,
      bevelEnabled: true,
      bevelSize: 0.009,
      bevelThickness: 0.009,
      bevelSegments: 2,
    }),
    material,
    [0, 0, 0.17],
  );
}
function criarPerna(parent, side, pants, boot) {
  const leg = new T.Group();
  leg.position.set(side * 0.115, 0.98, 0);
  parent.add(leg);
  criarRoupa(
    leg,
    [
      [-0.02, 0.105, 0.105],
      [-0.21, 0.106, 0.1],
      [-0.4, 0.083, 0.09],
      [-0.48, 0.078, 0.085],
      [-0.7, 0.075, 0.08],
      [-0.83, 0.075, 0.08],
    ],
    pants,
  );
  criarElipsoide(leg, [0.093, 0.075, 0.17], boot, [0, -0.89, 0.055]);
  criarCaixa(leg, [0.17, 0.035, 0.3], boot, [0, -0.95, 0.065]);
  return leg;
}
function criarBraco(parent, side, cloth, skin) {
  const shoulder = new T.Group();
  shoulder.position.set(side * 0.265, 1.54, 0);
  parent.add(shoulder);
  criarElipsoide(shoulder, [0.105, 0.12, 0.105], cloth, [0, -0.03, 0]);
  criarRoupa(
    shoulder,
    [
      [0, 0.085, 0.09],
      [-0.18, 0.085, 0.085],
      [-0.32, 0.07, 0.072],
      [-0.48, 0.06, 0.06],
      [-0.57, 0.055, 0.055],
    ],
    cloth,
  );
  criarElipsoide(shoulder, [0.055, 0.085, 0.048], skin, [0, -0.615, 0.018]);
  for (let i = 0; i < 4; i++)
    criarElipsoide(shoulder, [0.012, 0.039, 0.014], skin, [
      (i - 1.5) * 0.022,
      -0.65,
      0.04,
    ]);
  return shoulder;
}
export function criarMaicon() {
  const g = new T.Group();
  g.name = "Maicon_Referencia_Sobretudo_USB";
  const leather = obterMaterial("#17191d", 0.56, 0.05, {
      side: T.DoubleSide,
    }),
    lapels = obterMaterial("#25282d", 0.53, 0.05, {
      side: T.DoubleSide,
    }),
    shirt = obterMaterial("#111215", 0.96),
    pants = obterMaterial("#24272d", 0.88),
    skin = materialPele("#bd805c"),
    hair = obterMaterial("#583826", 0.95),
    highlights = obterMaterial("#8e6043", 0.94),
    silver = obterMaterial("#a1a6aa", 0.3, 0.8),
    boots = obterMaterial("#111317", 0.7);
  criarRoupa(
    g,
    [
      [1.02, 0.19, 0.115],
      [1.2, 0.2, 0.13],
      [1.42, 0.25, 0.13],
      [1.58, 0.28, 0.12],
      [1.65, 0.15, 0.1],
    ],
    shirt,
  );
  const coat = criarRoupa(
    g,
    [
      [0.31, 0.31, 0.19],
      [0.53, 0.29, 0.18],
      [0.82, 0.245, 0.16],
      [1.04, 0.22, 0.14],
      [1.23, 0.22, 0.145],
      [1.48, 0.275, 0.15],
      [1.6, 0.29, 0.13],
      [1.65, 0.12, 0.1],
    ],
    leather,
    0.25,
  );
  coat.name = "Sobretudo_com_abertura_e_barra_longa";
  for (const side of [-1, 1]) {
    criarLapela(g, side, lapels);
    criarTubo(
      g,
      [
        [side * 0.3, 0.33, 0.16],
        [side * 0.26, 0.75, 0.155],
        [side * 0.21, 1.1, 0.145],
      ],
      0.004,
      lapels,
    );
    criarCaixa(
      g,
      [0.105, 0.1, 0.028],
      lapels,
      [side * 0.25, 0.83, 0.18],
      [0, side * 0.18, 0],
    );
    for (let i = 0; i < 3; i++)
      criarElipsoide(g, [0.009, 0.009, 0.006], silver, [
        side * 0.125,
        1.18 - i * 0.12,
        0.157,
      ]);
  }
  criarCaixa(g, [0.42, 0.055, 0.026], boots, [0, 1.04, 0.137]);
  criarCaixa(g, [0.067, 0.063, 0.018], silver, [0.025, 1.04, 0.16]);
  criarCaixa(g, [0.048, 0.041, 0.02], boots, [0.025, 1.04, 0.172]);
  const legs = [
    criarPerna(g, -1, pants, boots),
    criarPerna(g, 1, pants, boots),
  ];
  for (let i = 0; i < 2; i++)
    criarCaixa(legs[i], [0.09, 0.15, 0.027], lapels, [
      (i ? 1 : -1) * 0.06,
      -0.29,
      0.095,
    ]);
  const arms = [
    criarBraco(g, 1, leather, skin),
    criarBraco(g, -1, leather, skin),
  ];
  arms[0].rotation.z = 0.1;
  arms[1].rotation.z = -0.12;
  const head = new T.Group();
  head.position.set(0, 1.83, 0);
  g.add(head);
  // Cabeça esculpida (cabeca-realista.js): rosto 3D com poros, olhos verdes, cavanhaque e cabelo
  // castanho ondulado até os ombros, como na ficha do Maicon. Substitui a foto pixelada.
  const cabecaReal = criarCabecaRealista({
    pele: "#c48a66",
    olhos: "#3f7a3a",
    cabelo: { cor: "#5a3a24", reflexo: "#a87a52", estilo: "longo" },
    barba: "#4a3424",
    sobrancelha: "#3b2617",
    altura: 0.33,
    nariz: 1.1,
    semente: 3,
  });
  cabecaReal.grupo.position.set(0, 0.02, 0.01);
  head.add(cabecaReal.grupo);
  head.userData.piscar = cabecaReal.piscar;
  // Óculos escuros de armação fina (lentes espelhadas).
  const glasses = new T.MeshPhysicalMaterial({ color: "#05070a", roughness: 0.05, metalness: 0.6, clearcoat: 1 });
  const ez = cabecaReal.escala.z * 0.98 + 0.012,
    ey = 0.02 + cabecaReal.escala.y * 0.12;
  for (const side of [-1, 1]) {
    const ex = cabecaReal.escala.x;
    const lente = new T.Mesh(new T.BoxGeometry(ex * 0.5, ex * 0.27, 0.005), glasses);
    lente.position.set(side * ex * 0.36, ey, ez);
    lente.rotation.set(0, side * 0.12, side * 0.05);
    head.add(lente);
    criarCaixa(head, [0.006, 0.006, cabecaReal.escala.z * 0.95], silver, [side * ex * 0.66, ey + 0.01, ez - cabecaReal.escala.z * 0.47]);
  }
  criarCaixa(head, [cabecaReal.escala.x * 0.2, 0.005, 0.006], silver, [0, ey + 0.012, ez + 0.002]);
  const chain = [];
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * Math.PI;
    chain.push([Math.cos(a) * 0.1, 1.59 - Math.sin(a) * 0.16, 0.145]);
  }
  criarTubo(g, chain, 0.0035, silver);
  criarCaixa(g, [0.026, 0.042, 0.011], silver, [0, 1.4, 0.16]);
  const potentiometer = new T.Group();
  potentiometer.position.set(0, -0.59, 0.06);
  arms[0].add(potentiometer);
  const pcb = obterMaterial("#164c8b", 0.45, 0.25),
    knob = obterMaterial("#121c27", 0.4),
    led = obterMaterial("#4f9aff", 0.25, 0.25, {
      emissive: "#1363db",
      emissiveIntensity: 1.2,
    });
  criarCaixa(potentiometer, [0.14, 0.025, 0.14], pcb);
  criarCilindro(potentiometer, 0.058, 0.058, 0.1, knob, [0, 0.065, 0]);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * 6.283;
    criarCaixa(
      potentiometer,
      [0.007, 0.085, 0.006],
      lapels,
      [Math.cos(a) * 0.06, 0.065, Math.sin(a) * 0.06],
      [0, a, 0],
    );
  }
  criarCaixa(potentiometer, [0.007, 0.009, 0.04], led, [0, 0.12, 0.01]);
  for (let i = 0; i < 3; i++)
    criarCilindro(potentiometer, 0.004, 0.004, 0.05, silver, [
      (i - 1) * 0.025,
      -0.035,
      0,
    ]);
  const cable = new T.Group();
  g.add(cable);
  const cableMaterial = obterMaterial("#166dec", 0.34, 0.25, {
    emissive: "#10418d",
    emissiveIntensity: 0.7,
  });
  const usb = new T.Group();
  cable.add(usb);
  criarCaixa(usb, [0.075, 0.027, 0.12], pcb);
  criarCaixa(usb, [0.058, 0.023, 0.075], silver, [0, 0, 0.075]);
  for (const side of [-1, 1])
    criarCaixa(usb, [0.014, 0.006, 0.016], glasses, [
      side * 0.014,
      0.015,
      0.075,
    ]);
  if (NATAL_ATIVO()) {
    const e = cabecaReal.escala;
    const touca = criarToucaNatal(e.x * 1.12);
    touca.position.set(0, 0.02 + e.y * 0.7, -e.z * 0.1);
    touca.rotation.set(-0.25, 0, 0.05);
    head.add(touca);
  }
  let rope;
  return {
    group: g,
    head,
    arms,
    legs,
    coat,
    animate(t, speed, whipping = false) {
      legs.forEach(
        (l, i) =>
          (l.rotation.x =
            Math.sin(t * 10 + i * Math.PI) * Math.min(speed * 0.12, 0.62)),
      );
      coat.rotation.z = Math.sin(t * 10) * Math.min(speed * 0.002, 0.015);
      arms[1].rotation.x = Math.sin(t * 10) * Math.min(speed * 0.07, 0.35);
      arms[0].rotation.x = whipping ? -1.3 + Math.sin(t * 18) * 0.5 : -0.25;
      head.rotation.y = Math.sin(t * 0.8) * 0.025;
      head.userData.piscar?.(t);
      head.rotation.x = Math.sin(t * 1.8) * 0.016;
      head.position.y = 1.83 + Math.sin(t * 2.2) * 0.003;
      if (rope) {
        rope.geometry.dispose();
        cable.remove(rope);
      }
      const points = [];
      for (let i = 0; i < 20; i++) {
        const s = i / 19,
          a = s * 6.283 + (whipping ? t * 13 : t * 0.8);
        points.push([
          0.32 + Math.sin(a) * (0.13 + s * 0.52),
          1.0 + Math.cos(a) * (0.12 + s * 0.53) + (whipping ? 0.4 : 0),
          0.1 + s * (whipping ? 2.6 : 1.4),
        ]);
      }
      rope = criarTubo(cable, points, 0.017, cableMaterial);
      usb.position.set(...points.at(-1));
      usb.rotation.set(t * 2, 0, t);
    },
  };
}
export /* Cria Brita ou o professor com braços e pernas articulados. */
function criarPessoa({ teacher = false } = {}) {
  const g = new T.Group();
  g.name = teacher ? "Professor" : `${NOMES.amigo}`;
  const cloth = obterMaterial(teacher ? "#3e4a50" : "#141619", 0.9, 0, {
      side: T.DoubleSide,
    }),
    skin = materialPele(teacher ? "#bd8e6b" : "#c99a78"),
    hair = obterMaterial(teacher ? "#4b4037" : "#211c1c", 0.95),
    pants = obterMaterial("#202936", 0.95),
    shoes = obterMaterial("#11161a", 0.6);
  criarRoupa(
    g,
    [
      [0.98, 0.17, 0.11],
      [1.2, 0.19, 0.13],
      [1.45, 0.25, 0.13],
      [1.56, 0.23, 0.11],
    ],
    cloth,
  );
  if (!teacher) criarElipsoide(g, [0.16, 0.1, 0.115], cloth, [0, 1.52, -0.03]);
  const head = new T.Group();
  head.position.set(0, 1.78, 0);
  g.add(head);
  // Cabeça esculpida com pele de poros (cabeca-realista.js).
  const cabecaReal = criarCabecaRealista({
    pele: teacher ? "#bd8e6b" : "#c99a78",
    olhos: teacher ? "#4a3a2a" : "#2e1f16",
    cabelo: teacher
      ? { cor: "#4b4037", reflexo: "#8a7a6a", estilo: "curto" }
      : { cor: "#1d1818", reflexo: "#463a36", estilo: "medio" },
    barba: teacher ? "#5a4c40" : null,
    altura: 0.31,
    semente: teacher ? 11 : 21,
  });
  cabecaReal.grupo.position.set(0, 0.0, 0.0);
  head.add(cabecaReal.grupo);
  head.userData.piscar = cabecaReal.piscar;
  head.userData.escala = cabecaReal.escala;
  const arms = [criarBraco(g, 1, cloth, skin), criarBraco(g, -1, cloth, skin)],
    legs = [criarPerna(g, -1, pants, shoes), criarPerna(g, 1, pants, shoes)];
  if (teacher) {
    criarCaixa(
      g,
      [0.055, 0.35, 0.018],
      obterMaterial("#20303d", 0.75),
      [0, 1.35, 0.143],
    );
    // Óculos de grau: aro fino e lente transparente.
    const e = cabecaReal.escala,
      aro = obterMaterial("#252d30", 0.35, 0.6),
      vidro = new T.MeshPhysicalMaterial({ color: "#dfe8ee", roughness: 0, transparent: true, opacity: 0.18, clearcoat: 1 });
    for (const s of [-1, 1]) {
      const anel = new T.Mesh(new T.TorusGeometry(e.x * 0.2, 0.0025, 6, 28), aro);
      anel.scale.set(1.2, 0.85, 1);
      anel.position.set(s * e.x * 0.36, e.y * 0.12, e.z * 1.0);
      head.add(anel);
      const lente = new T.Mesh(new T.CircleGeometry(e.x * 0.2, 28), vidro);
      lente.scale.copy(anel.scale);
      lente.position.copy(anel.position);
      head.add(lente);
      criarCaixa(head, [0.003, 0.003, e.z * 0.95], aro, [s * e.x * 0.6, e.y * 0.14, e.z * 0.52]);
    }
  } else {
    criarTubo(
      g,
      [
        [-0.045, 1.51, 0.14],
        [-0.05, 1.24, 0.16],
      ],
      0.005,
      obterMaterial("#92948e", 0.8),
    );
    criarTubo(
      g,
      [
        [0.045, 1.51, 0.14],
        [0.05, 1.24, 0.16],
      ],
      0.005,
      obterMaterial("#92948e", 0.8),
    );
    criarCaixa(g, [0.24, 0.09, 0.025], cloth, [0, 1.08, 0.14]);
  }
  const hood = new T.Group();
  g.add(hood);
  hood.position.set(0, 1.78, 0);
  hood.visible = !teacher;
  // Open front: cloth wraps the back and sides of the head, leaving the face visible.
  criarMalha(
    hood,
    new T.SphereGeometry(
      0.185,
      32,
      24,
      Math.PI / 2 + 0.52,
      Math.PI * 2 - 1.04,
      0,
      Math.PI * 0.87,
    ),
    cloth,
    [0, 0.025, -0.025],
    [0, 0, 0],
    [1, 1.17, 0.91],
  );
  for (const s of [-1, 1])
    criarTubo(
      hood,
      [
        [s * 0.1, 0.17, 0.08],
        [s * 0.155, 0.08, 0.1],
        [s * 0.14, -0.12, 0.07],
        [s * 0.07, -0.2, 0.06],
      ],
      0.015,
      cloth,
    );
  if (NATAL_ATIVO()) {
    // Brita usa capuz: a touca vai por cima dele.
    const touca = criarToucaNatal(cabecaReal.escala.x * (teacher ? 1.12 : 1.45));
    touca.position.set(0, cabecaReal.escala.y * (teacher ? 0.7 : 1.02), -cabecaReal.escala.z * 0.12);
    touca.rotation.set(-0.18, 0, -0.06);
    head.add(touca);
  }
  if (!teacher) g.scale.setScalar(0.87);
  return {
    group: g,
    head,
    arms,
    legs,
    hood,
  };
}
