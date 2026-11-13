import { NATAL_ATIVO, criarToucaNatal } from "./natal.js";
import { criarLiquidoFanta } from "./liquido-fanta.js";
// MODELOS 3D — altere nomes em configuracao.js; preserve a estrutura das malhas.
import { NOMES } from "./configuracao.js";
import * as T from "./vendor/three.module.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
const materials = new Map();
export /* Reutiliza materiais iguais para reduzir o uso de memória. */
function obterMaterial(color, roughness = 0.65, metalness = 0, extra = {}) {
  const key = JSON.stringify([color, roughness, metalness, extra]);
  if (!materials.has(key))
    materials.set(
      key,
      new T.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        ...extra,
      }),
    );
  return materials.get(key);
}
export function criarMalha(
  parent,
  geometry,
  material,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  name = "",
) {
  const m = new T.Mesh(geometry, material);
  m.position.set(...position);
  m.rotation.set(...rotation);
  m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  m.name = name;
  parent.add(m);
  return m;
}
export function criarCaixa(
  parent,
  size,
  material,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  name = "",
) {
  return criarMalha(
    parent,
    new T.BoxGeometry(...size),
    material,
    position,
    rotation,
    [1, 1, 1],
    name,
  );
}
export function criarElipsoide(parent, size, material, position, rotation = [0, 0, 0], name = "") {
  return criarMalha(
    parent,
    new T.SphereGeometry(1, 32, 24),
    material,
    position,
    rotation,
    size,
    name,
  );
}
export function criarCilindro(
  parent,
  r1,
  r2,
  length,
  material,
  position,
  rotation = [0, 0, 0],
  name = "",
) {
  return criarMalha(
    parent,
    new T.CylinderGeometry(r1, r2, length, 32),
    material,
    position,
    rotation,
    [1, 1, 1],
    name,
  );
}
export function criarTubo(parent, points, radius, material, name = "") {
  const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)));
  return criarMalha(
    parent,
    new T.TubeGeometry(curve, Math.max(20, points.length * 10), radius, 8, false),
    material,
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    name,
  );
}
export function criarTexturaTexto(
  text,
  bg = "#09130d",
  color = "#ccdfb1",
  width = 512,
  height = 128,
) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d");
  g.fillStyle = bg;
  g.fillRect(0, 0, width, height);
  g.fillStyle = color;
  g.font = `bold ${Math.floor(height * 0.5)}px Consolas,monospace`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, width / 2, height / 2, width * 0.94);
  const tex = new T.TextureLoader().load(c.toDataURL("image/png"));
  tex.colorSpace = T.SRGBColorSpace;
  return tex;
}
export function criarAxel() {
  const g = new T.Group();
  g.name = "Axel_Asmantico";
  const orange = obterMaterial("#f4830c", 0.24, 0.05),
    dark = obterMaterial("#25271e", 0.7),
    white = obterMaterial("#d9d9c7", 0.9),
    brown = obterMaterial("#49321e", 0.85);
  const body = new T.Group();
  g.add(body);
  const profile = [
    [0, 0.25],
    [0.18, 0.31],
    [0.43, 0.3],
    [0.66, 0.28],
    [0.85, 0.28],
    [1.06, 0.27],
    [1.19, 0.22],
    [1.29, 0.13],
    [1.48, 0.11],
    [1.52, 0.12],
  ].map(([y, r]) => new T.Vector2(r, y));
  // Garrafa PET transparente com o refrigerante dentro (o líquido balança: liquido-fanta.js).
  const pet = new T.MeshPhysicalMaterial({
    color: "#fff6ec",
    roughness: 0.05,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: T.DoubleSide,
    envMapIntensity: 1.6,
  });
  pet.clone = () => pet;
  const casca = criarMalha(
    body,
    new T.LatheGeometry(profile, 64),
    pet,
    [0, 0.22, 0],
    [0, 0, 0],
    [1, 1, 1],
    "Garrafa_Fanta_malha",
  );
  casca.renderOrder = 3;
  casca.castShadow = true;
  const liquido = criarLiquidoFanta(profile, body, { base: 0.22, nivel: 1.16 });
  for (let i = 0; i < 7; i++)
    criarMalha(
      body,
      new T.TorusGeometry(0.285, 0.013, 8, 64),
      pet,
      [0, 0.39 + i * 0.12, 0],
      [Math.PI / 2, 0, 0],
    ).renderOrder = 3;
  criarCilindro(body, 0.118, 0.118, 0.12, obterMaterial("#d66d05", 0.4), [0, 1.79, 0]);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    criarCaixa(
      body,
      [0.015, 0.1, 0.012],
      orange,
      [Math.sin(a) * 0.119, 1.79, Math.cos(a) * 0.119],
      [0, a, 0],
    );
  }
  const label = criarTexturaTexto("FANTA", "#1748a7", "#f9faf3", 512, 256);
  criarMalha(
    body,
    new T.CylinderGeometry(0.294, 0.294, 0.39, 64, 1, true),
    new T.MeshStandardMaterial({
      map: label,
      roughness: 0.45,
    }),
    [0, 0.94, 0],
  );
  const hat = new T.Group();
  hat.position.set(0, 1.88, 0);
  body.add(hat);
  const brim = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    brim.push(
      new T.Vector3(Math.cos(a) * 0.46, Math.pow(Math.cos(a), 4) * 0.1, Math.sin(a) * 0.35),
    );
  }
  const shape = new T.Shape();
  shape.absellipse(0, 0, 0.46, 0.35, 0, Math.PI * 2, false, 0);
  criarMalha(
    hat,
    new T.ExtrudeGeometry(shape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.018,
      bevelThickness: 0.018,
      curveSegments: 32,
    }),
    brown,
    [0, 0, 0],
    [Math.PI / 2, 0, 0],
  );
  criarMalha(hat, new T.CylinderGeometry(0.19, 0.23, 0.22, 32), brown, [0, 0.12, 0], [0, 0, -0.06]);
  criarCilindro(hat, 0.234, 0.234, 0.045, dark, [0, 0.025, 0]);
  if (NATAL_ATIVO()) {
    // Natal: a touca do Papai Noel substitui o chapéu de cowboy.
    hat.visible = false;
    const touca = criarToucaNatal(0.135);
    touca.position.set(0, 1.83, 0);
    touca.rotation.set(-0.12, 0, 0.08);
    body.add(touca);
  }
  const limbs = [];
  for (const side of [-1, 1]) {
    const leg = new T.Group();
    leg.position.set(side * 0.15, 0.3, 0);
    g.add(leg);
    criarCilindro(leg, 0.055, 0.065, 0.31, dark, [0, -0.12, 0]);
    criarElipsoide(leg, [0.105, 0.065, 0.17], brown, [0, -0.25, 0.07]);
    limbs.push(leg);
    const criarBraco = new T.Group();
    criarBraco.position.set(side * 0.28, 1.15, 0);
    body.add(criarBraco);
    criarCilindro(
      criarBraco,
      0.055,
      0.05,
      0.34,
      orange,
      [side * 0.06, -0.12, 0.05],
      [0, 0, side * 0.35],
    );
    criarElipsoide(criarBraco, [0.075, 0.07, 0.09], white, [side * 0.12, -0.25, 0.12]);
    limbs.push(criarBraco);
  }
  return {
    group: g,
    body,
    limbs,
    animate(t, speed = 0) {
      body.position.y = Math.sin(t * 9) * Math.min(speed * 0.008, 0.025);
      limbs[0].rotation.x = Math.sin(t * 10) * Math.min(speed * 0.13, 0.65);
      limbs[2].rotation.x = -Math.sin(t * 10) * Math.min(speed * 0.13, 0.65);
    },
  };
}

// Pug articulado: focinho braquicefálico, máscara escura, pregas, patas e cauda enrolada.
// As superfícies são construídas em malhas editáveis; nenhuma imagem de cachorro é projetada no mundo.
export /* Modela o Pug. O nome acima dele vem de NOMES.cachorro, em configuracao.js. */
function criarCachorro() {
  const g = new T.Group();
  g.name = "Pug_escultura_articulada";
  const furTexture = new T.TextureLoader().load("assets/shake-reference.png");
  furTexture.colorSpace = T.SRGBColorSpace;
  furTexture.repeat.set(250 / 1034, 180 / 824);
  furTexture.offset.set(440 / 1034, 1 - 490 / 824);
  const fur = new T.MeshStandardMaterial({
      map: furTexture,
      color: "#d5cbb8",
      roughness: 0.97,
      bumpMap: furTexture,
      bumpScale: 0.003,
    }),
    furLight = new T.MeshStandardMaterial({
      map: furTexture,
      color: "#ebe0cd",
      roughness: 0.98,
    }),
    mask = obterMaterial("#302923", 0.91),
    fold = obterMaterial("#8b765c", 1),
    nose = obterMaterial("#141314", 0.3),
    eye = obterMaterial("#140e08", 0.1),
    iris = obterMaterial("#51311c", 0.32),
    wet = obterMaterial("#7b645b", 0.27);
  const torso = criarElipsoide(g, [0.22, 0.245, 0.4], fur, [0, 0.43, -0.09]);
  criarElipsoide(g, [0.205, 0.245, 0.23], furLight, [0, 0.43, 0.19]);
  // O pescoço engrossa até a cabeça quadrada e o peito.
  criarElipsoide(g, [0.21, 0.22, 0.19], fur, [0, 0.56, 0.23]);
  const head = new T.Group();
  head.position.set(0, 0.69, 0.33);
  g.add(head);
  const skull = new T.SphereGeometry(1, 48, 32);
  const p = skull.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    p.setXYZ(i, Math.sign(x) * Math.pow(Math.abs(x), 0.78) * 0.235, y * 0.215, z * 0.18);
  }
  skull.computeVertexNormals();
  criarMalha(head, skull, fur);
  criarElipsoide(head, [0.198, 0.145, 0.06], mask, [0, -0.042, 0.151]);
  for (const s of [-1, 1]) {
    criarElipsoide(head, [0.067, 0.055, 0.03], fold, [s * 0.126, 0.036, 0.155]);
    criarElipsoide(head, [0.043, 0.045, 0.033], eye, [s * 0.122, 0.026, 0.186]);
    criarElipsoide(head, [0.027, 0.03, 0.01], iris, [s * 0.122, 0.024, 0.215]);
    criarElipsoide(head, [0.019, 0.023, 0.006], nose, [s * 0.122, 0.027, 0.224]);
    criarElipsoide(head, [0.006, 0.008, 0.004], obterMaterial("#dadbc9", 0.06), [
      s * 0.117,
      0.041,
      0.229,
    ]);
    criarElipsoide(head, [0.073, 0.062, 0.055], mask, [s * 0.064, -0.091, 0.195]);
    // Orelhas dobradas com contorno fechado, em vez de triângulos planos.
    const shape = new T.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.06, 0.03, 0.1, -0.04, 0.075, -0.12);
    shape.bezierCurveTo(0.035, -0.19, -0.04, -0.13, -0.05, -0.05);
    shape.closePath();
    const ear = criarMalha(
      head,
      new T.ExtrudeGeometry(shape, {
        depth: 0.025,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.02,
        bevelSegments: 3,
        curveSegments: 12,
      }),
      mask,
      [s * 0.19, 0.12, -0.01],
      [0.2, 0, s * 0.35],
      [s, 1, 1],
    );
    criarTubo(
      head,
      [
        [s * 0.04, 0.14, 0.133],
        [s * 0.09, 0.12, 0.17],
        [s * 0.17, 0.115, 0.13],
      ],
      0.012,
      fold,
    );
    criarTubo(
      head,
      [
        [s * 0.02, 0.105, 0.18],
        [s * 0.08, 0.08, 0.193],
        [s * 0.17, 0.075, 0.15],
      ],
      0.011,
      furLight,
    );
    criarTubo(
      head,
      [
        [s * 0.15, -0.03, 0.19],
        [s * 0.19, -0.07, 0.15],
        [s * 0.185, -0.14, 0.08],
      ],
      0.013,
      fold,
    );
  }
  criarElipsoide(head, [0.061, 0.035, 0.042], nose, [0, -0.056, 0.225]);
  for (const s of [-1, 1])
    criarElipsoide(head, [0.015, 0.008, 0.009], obterMaterial("#040505", 0.3), [
      s * 0.024,
      -0.06,
      0.262,
    ]);
  criarTubo(
    head,
    [
      [-0.08, -0.133, 0.218],
      [0, -0.15, 0.23],
      [0.08, -0.133, 0.218],
    ],
    0.006,
    nose,
  );
  criarElipsoide(head, [0.039, 0.018, 0.018], wet, [0, -0.15, 0.225]);
  criarTubo(
    head,
    [
      [-0.14, 0.165, 0.09],
      [0, 0.185, 0.13],
      [0.14, 0.165, 0.09],
    ],
    0.009,
    fold,
  );
  const legs = [];
  for (const side of [-1, 1])
    for (const z of [-0.33, 0.23]) {
      const leg = new T.Group();
      leg.position.set(side * 0.145, 0.39, z);
      g.add(leg);
      criarElipsoide(leg, [0.082, 0.15, 0.09], fur, [0, -0.075, 0]);
      criarCilindro(leg, 0.05, 0.055, 0.15, furLight, [0, -0.22, 0], [0, 0, side * 0.05]);
      criarElipsoide(leg, [0.071, 0.047, 0.105], fur, [0, -0.335, 0.034]);
      for (let toe = -1; toe <= 1; toe++) {
        criarElipsoide(leg, [0.021, 0.022, 0.04], furLight, [toe * 0.035, -0.346, 0.1]);
        criarElipsoide(leg, [0.007, 0.008, 0.013], nose, [toe * 0.035, -0.349, 0.131]);
      }
      legs.push(leg);
    }
  const tail = [];
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI * 2.1;
    tail.push([Math.sin(a) * 0.075, 0.64 + Math.cos(a) * 0.073, -0.49 - i * 0.0005]);
  }
  criarTubo(g, tail, 0.037, furLight, "Cauda_enrolada");
  criarCilindro(
    g,
    0.202,
    0.205,
    0.03,
    obterMaterial("#713d30", 0.65),
    [0, 0.61, 0.26],
    [Math.PI / 2 - 0.2, 0, 0],
  );
  criarCilindro(
    g,
    0.026,
    0.026,
    0.012,
    obterMaterial("#d4b66d", 0.28, 0.8),
    [0, 0.51, 0.435],
    [Math.PI / 2, 0, 0],
  );
  const nameCanvas = document.createElement("canvas");
  nameCanvas.width = 256;
  nameCanvas.height = 72;
  const nameContext = nameCanvas.getContext("2d");
  nameContext.font = "bold 42px Segoe UI,Arial";
  nameContext.textAlign = "center";
  nameContext.lineWidth = 7;
  nameContext.strokeStyle = "#071008";
  nameContext.strokeText(`${NOMES.cachorro}`, 128, 51);
  nameContext.fillStyle = "#eff1de";
  nameContext.fillText(`${NOMES.cachorro}`, 128, 51);
  const nameTexture = new T.CanvasTexture(nameCanvas);
  const nickname = new T.Sprite(
    new T.SpriteMaterial({
      map: nameTexture,
      transparent: true,
      depthWrite: false,
    }),
  );
  nickname.name = "Nickname_Shake";
  nickname.position.set(0, 1.18, 0.1);
  if (NATAL_ATIVO()) {
    const touca = criarToucaNatal(0.15);
    touca.position.set(0.03, 0.17, -0.02);
    touca.rotation.set(-0.35, 0, -0.25);
    head.add(touca);
  }
  nickname.scale.set(0.8, 0.225, 1);
  g.add(nickname);
  return {
    group: g,
    legs,
    head,
    animate(t, speed) {
      const a = Math.min(speed * 0.065, 0.55);
      legs.forEach(
        (l, i) => (l.rotation.x = Math.sin(t * 13 + (i === 0 || i === 3 ? 0 : Math.PI)) * a),
      );
      head.rotation.z = Math.sin(t * 1.7) * 0.025;
      torso.scale.y = 0.245 * (1 + Math.sin(t * 3) * 0.012);
    },
  };
}
export function criarSenai(criarTexturaCenario) {
  const g = new T.Group();
  g.name = "SENAI_entidade";
  const m = obterMaterial("#f9ffff", 0.3, 0.2, {
    map: criarTexturaCenario,
    emissive: "#2287c5",
    emissiveMap: criarTexturaCenario,
    emissiveIntensity: 0.65,
  });
  criarCaixa(g, [2.5, 0.66, 0.08], m, [0, 1.72, 0]);
  const black = obterMaterial("#060a0a", 0.8);
  for (const s of [-1, 1]) {
    const leg = new T.Group();
    leg.position.set(s * 0.82, 1.5, 0);
    g.add(leg);
    criarCilindro(leg, 0.045, 0.02, 1.5, black, [0, -0.72, 0], [0, 0, s * 0.07]);
    criarCaixa(leg, [0.09, 0.07, 0.4], black, [0, -1.45, 0.13]);
  }
  return g;
}
export async function carregarControle() {
  const gltf = await new GLTFLoader().loadAsync("models/dualsense.glb");
  const g = gltf.scene;
  g.name = "DualSense_Taohid_Animation";
  const b = new T.Box3().setFromObject(g),
    size = b.getSize(new T.Vector3()),
    center = b.getCenter(new T.Vector3());
  g.position.sub(center);
  const root = new T.Group();
  root.add(g);
  root.scale.setScalar(0.32 / Math.max(size.x, size.y, size.z));
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.material) {
        o.material.roughness = Math.max(0.32, o.material.roughness ?? 0.5);
      }
    }
  });
  return root;
}
