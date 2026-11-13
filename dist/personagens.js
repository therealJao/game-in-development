// Módulo do jogo. Consulte GUIA-DE-EDICAO.md antes de alterar estruturas.
import { NOMES } from "./configuracao.js";
import * as T from "./vendor/three.module.js";
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
    skin = obterMaterial("#bd805c", 0.88),
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
  criarCilindro(head, 0.062, 0.069, 0.12, skin, [0, -0.12, 0]);
  criarElipsoide(head, [0.126, 0.18, 0.115], skin, [0, 0.035, 0]);
  criarElipsoide(head, [0.098, 0.066, 0.09], skin, [0, -0.087, 0.025]);
  // A textura do rosto vem da ficha fornecida e acompanha uma malha curva 3D.
  const faceTexture = new T.TextureLoader().load("assets/maicon-reference.png");
  faceTexture.colorSpace = T.SRGBColorSpace;
  faceTexture.repeat.set(140 / 1536, 160 / 1024);
  faceTexture.offset.set(1144 / 1536, 1 - 220 / 1024);
  faceTexture.magFilter = T.NearestFilter;
  const vertices = [],
    uv = [],
    ids = [],
    cols = 24,
    rows = 24;
  for (let y = 0; y <= rows; y++)
    for (let x = 0; x <= cols; x++) {
      const nx = (x / cols) * 2 - 1,
        ny = (y / rows) * 2 - 1;
      vertices.push(
        nx * 0.116 * Math.sqrt(1 - ny * ny * 0.72),
        ny * 0.144 + 0.018,
        0.079 + Math.sqrt(Math.max(0, 1 - nx * nx)) * 0.051,
      );
      uv.push(x / cols, y / rows);
    }
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const a = y * (cols + 1) + x,
        b = a + cols + 1;
      ids.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const faceGeometry = new T.BufferGeometry();
  faceGeometry.setAttribute(
    "position",
    new T.Float32BufferAttribute(vertices, 3),
  );
  faceGeometry.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  faceGeometry.setIndex(ids);
  faceGeometry.computeVertexNormals();
  criarMalha(
    head,
    faceGeometry,
    new T.MeshStandardMaterial({
      map: faceTexture,
      roughness: 0.94,
    }),
  );
  const glasses = obterMaterial("#080b0e", 0.12, 0.15);
  for (const side of [-1, 1]) {
    criarCaixa(
      head,
      [0.106, 0.053, 0.024],
      glasses,
      [side * 0.062, 0.054, 0.15],
      [0, side * 0.1, -side * 0.025],
    );
    criarCaixa(head, [0.015, 0.015, 0.12], glasses, [
      side * 0.119,
      0.062,
      0.078,
    ]);
    criarElipsoide(head, [0.024, 0.045, 0.021], skin, [
      side * 0.127,
      0.015,
      -0.005,
    ]);
  }
  criarCaixa(head, [0.028, 0.01, 0.016], silver, [0, 0.057, 0.164]);
  // Cabelo em camadas sobrepostas, com volume na lateral e nas costas.
  criarElipsoide(head, [0.145, 0.14, 0.13], hair, [0, 0.133, -0.018]);
  for (let layer = 0; layer < 3; layer++)
    for (let i = 0; i < 11; i++) {
      const a = (i / 10) * Math.PI * 1.6 + 0.55,
        side = Math.sin(a),
        back = Math.cos(a),
        x = side * (0.09 + layer * 0.014),
        z = back * 0.09;
      const points = [
        [x * 0.5, 0.2 + layer * 0.018, z],
        [x * 1.1, 0.19, z - 0.025],
        [x * 1.5, 0.08, z - 0.075],
        [x * 1.42, -0.03 - layer * 0.017, z - 0.11],
        [x * 1.1, -0.14 - layer * 0.017, z - 0.1],
      ];
      criarTubo(
        head,
        points,
        0.017 + (layer === 0 ? 0.009 : 0),
        i % 3 === 0 ? highlights : hair,
      );
    }
  for (let i = 0; i < 7; i++)
    criarTubo(
      head,
      [
        [-0.13 + i * 0.025, 0.17, 0.07],
        [-0.1 + i * 0.024, 0.22, 0.13],
        [-0.02 + i * 0.018, 0.19, 0.145],
        [0.06 + i * 0.012, 0.13, 0.12],
      ],
      0.017,
      i % 2 ? hair : highlights,
    );
  // Barba curta com fios claros e bigode, além da textura da referência.
  for (let i = 0; i < 24; i++) {
    const a = (i / 23) * Math.PI;
    criarElipsoide(
      head,
      [0.006, 0.009, 0.005],
      i % 3 === 0 ? obterMaterial("#b4a18e", 1) : hair,
      [Math.cos(a) * 0.085, -0.07 - Math.sin(a) * 0.035, 0.114],
    );
  }
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
    skin = obterMaterial(teacher ? "#bd8e6b" : "#c99a78", 0.9),
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
  criarCilindro(head, 0.06, 0.065, 0.12, skin, [0, -0.13, 0]);
  criarElipsoide(head, [0.13, 0.17, 0.115], skin, [0, 0, 0]);
  criarElipsoide(head, [0.134, 0.075, 0.12], hair, [0, 0.125, -0.005]);
  for (let i = 0; i < 7; i++)
    criarElipsoide(
      head,
      [0.025, 0.06, 0.025],
      hair,
      [(i - 3) * 0.034, 0.09, 0.1],
      [0, 0, i * 0.08],
    );
  for (const s of [-1, 1]) {
    criarElipsoide(head, [0.026, 0.012, 0.009], obterMaterial("#211b19", 0.9), [
      s * 0.055,
      0.025,
      0.109,
    ]);
    criarElipsoide(head, [0.02, 0.04, 0.022], skin, [s * 0.13, -0.01, 0]);
    criarTubo(
      head,
      [
        [s * 0.032, 0.055, 0.112],
        [s * 0.075, 0.063, 0.105],
      ],
      0.006,
      hair,
    );
  }
  criarElipsoide(head, [0.022, 0.037, 0.033], skin, [0, -0.015, 0.122]);
  criarTubo(
    head,
    [
      [-0.038, -0.073, 0.103],
      [0, -0.078, 0.119],
      [0.038, -0.073, 0.103],
    ],
    0.004,
    obterMaterial("#724d40", 0.9),
  );
  const arms = [criarBraco(g, 1, cloth, skin), criarBraco(g, -1, cloth, skin)],
    legs = [criarPerna(g, -1, pants, shoes), criarPerna(g, 1, pants, shoes)];
  if (teacher) {
    criarCaixa(
      g,
      [0.055, 0.35, 0.018],
      obterMaterial("#20303d", 0.75),
      [0, 1.35, 0.143],
    );
    for (const s of [-1, 1])
      criarCaixa(head, [0.09, 0.05, 0.015], obterMaterial("#252d30", 0.4), [
        s * 0.053,
        0.03,
        0.128,
      ]);
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
  if (!teacher) g.scale.setScalar(0.87);
  return {
    group: g,
    head,
    arms,
    legs,
    hood,
  };
}
