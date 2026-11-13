import * as T from "./vendor/three.module.js";
import { FBXLoader } from "./vendor/FBXLoader.js";
import { criarHumano } from "./humanos.js";
import { rostoReferencia } from "./modelos-alisanave.js";
import {
  criarCaixa,
  criarElipsoide,
  criarCilindro,
  criarTubo,
  criarMalha,
  obterMaterial,
  criarTexturaTexto,
} from "./modelos.js";

export function criarVisitante({
  arquivo,
  recorte,
  pele = "#c1977c",
  cabelo = "#27221f",
  camisa = "#20252d",
  barba = false,
}) {
  const h = criarHumano({ pele, cabelo, camisa });
  h.head.clear();
  const material = obterMaterial(pele, 0.82),
    capilar = obterMaterial(cabelo, 0.95);
  criarCilindro(h.head, 0.055, 0.061, 0.15, material, [0, -0.15, 0]);
  criarElipsoide(h.head, [0.115, 0.151, 0.103], material, [0, 0, -0.01]);
  criarElipsoide(h.head, [0.091, 0.058, 0.087], material, [0, -0.105, 0.005]);
  rostoReferencia(h.head, arquivo, recorte, 0.11, 0.145);
  criarElipsoide(h.head, [0.115, 0.063, 0.108], capilar, [0, 0.125, -0.02]);
  for (const lado of [-1, 1])
    criarElipsoide(h.head, [0.021, 0.038, 0.021], material, [
      lado * 0.115,
      -0.013,
      0,
    ]);
  for (let i = 0; i < 14; i++)
    criarTubo(
      h.head,
      [
        [(i - 7) * 0.015, 0.13, 0.065],
        [(i - 7) * 0.015 + 0.025, 0.175, 0],
        [(i - 7) * 0.014 + 0.03, 0.13, -0.085],
      ],
      0.006,
      capilar,
    );
  if (barba)
    for (let i = 0; i < 17; i++) {
      const a = (i / 16) * Math.PI;
      criarElipsoide(
        h.head,
        [0.017, 0.024, 0.014],
        obterMaterial(i % 3 ? "#c5c0b4" : "#e2dfd4", 0.95),
        [
          Math.cos(a) * 0.09,
          -0.075 - Math.sin(a) * 0.07,
          0.072 + Math.sin(a) * 0.02,
        ],
      );
    }
  h.head.scale.setScalar(1.12);
  return h;
}
export function criarDavyJones() {
  const h = criarVisitante({
    arquivo: "assets/davy-jones.png",
    recorte: [90, 91, 252, 322, 447, 447],
    camisa: "#171a20",
    pele: "#bc9479",
    cabelo: "#181918",
  });
  h.group.name = "Davy_Jones_referencia";
  criarCaixa(
    h.body,
    [0.2, 0.1, 0.015],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto("GAMES", "#12171d", "#d0d8df"),
    }),
    [0, 1.31, 0.134],
  );
  return h;
}
export function criarPolitico(tipo) {
  const lula = tipo === "lula";
  const h = criarVisitante(
    lula
      ? {
          arquivo: "assets/lula.png",
          recorte: [570, 335, 710, 885, 1875, 2400],
          camisa: "#172e46",
          cabelo: "#c6c1b4",
          pele: "#c99c83",
          barba: true,
        }
      : {
          arquivo: "assets/bolsonaro.png",
          recorte: [345, 142, 340, 450, 984, 1475],
          camisa: "#20262d",
          cabelo: "#4b433b",
          pele: "#c59c87",
        },
  );
  const branco = obterMaterial("#e1e4df", 0.85),
    tecido = obterMaterial(lula ? "#243c54" : "#2b3036", 0.88);
  criarCaixa(h.body, [0.15, 0.22, 0.023], branco, [0, 1.48, 0.125]);
  criarCaixa(
    h.body,
    [0.036, 0.24, 0.026],
    obterMaterial(lula ? "#9c4353" : "#273d53", 0.75),
    [0, 1.4, 0.146],
    [0, 0, 0.03],
  );
  for (const lado of [-1, 1])
    criarCaixa(
      h.body,
      [0.085, 0.28, 0.018],
      tecido,
      [lado * 0.105, 1.41, 0.148],
      [0, 0, lado * 0.34],
    );
  criarCaixa(
    h.body,
    [0.115, 0.66, 0.024],
    obterMaterial("#177843", 0.7),
    [0.012, 1.27, 0.163],
    [0, 0, -0.39],
  );
  criarCaixa(
    h.body,
    [0.045, 0.66, 0.025],
    obterMaterial("#d0b848", 0.65),
    [0.012, 1.27, 0.178],
    [0, 0, -0.39],
  );
  h.group.name = lula ? "Lula_parodia_ficticia" : "Bolsonaro_parodia_ficticia";
  return h;
}
export function criarLittleTail() {
  const h = criarVisitante({
    arquivo: "assets/little-tail.png",
    recorte: [79, 20, 37, 53, 200, 200],
    camisa: "#ad1721",
    pele: "#c4a28b",
    cabelo: "#262522",
  });
  const vermelho = obterMaterial("#bc1e2c", 0.86),
    pele = obterMaterial("#c4a28b", 0.85),
    branco = obterMaterial("#e4e0d7", 0.8);
  // Mangas removidas e braços de pele: regata e bermuda, como o uniforme fornecido.
  h.arms.forEach((a) =>
    a.traverse((o) => {
      if (o.isMesh) o.material = pele;
    }),
  );
  h.legs.forEach((p, i) => {
    p.traverse((o) => {
      if (o.isMesh) o.material = pele;
    });
    criarCaixa(p, [0.18, 0.3, 0.22], vermelho, [0, -0.12, 0]);
    criarCaixa(p, [0.035, 0.3, 0.228], branco, [
      (i ? 1 : -1) * 0.075,
      -0.12,
      0,
    ]);
    criarElipsoide(
      h.joelhos[i],
      [0.085, 0.065, 0.17],
      branco,
      [0, -0.43, 0.065],
    );
  });
  for (const s of [-1, 1])
    criarTubo(
      h.body,
      [
        [s * 0.1, 1.59, 0.09],
        [s * 0.2, 1.5, 0.09],
        [s * 0.2, 1.3, 0.1],
      ],
      0.014,
      branco,
    );
  criarCaixa(
    h.body,
    [0.36, 0.3, 0.015],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto("BULLS 23", "#b31b27", "#f0e8dc"),
      roughness: 0.9,
    }),
    [0, 1.32, 0.137],
  );
  h.group.name = "Little_Tail_American_Chicago_Bulls_23";
  return h;
}
export function criarBolaBasquete() {
  const bola = new T.Group();
  criarMalha(
    bola,
    new T.SphereGeometry(0.19, 36, 24),
    obterMaterial("#bd581e", 0.86),
  );
  for (const eixo of [
    [0, 0, 0],
    [Math.PI / 2, 0, 0],
    [0, Math.PI / 2, 0],
  ])
    criarMalha(
      bola,
      new T.TorusGeometry(0.191, 0.0035, 6, 64),
      obterMaterial("#231a13", 0.9),
      [0, 0, 0],
      eixo,
    );
  return bola;
}
/** Modelo FBX fornecido pelo usuário, com as quatro texturas locais originais. */
export async function carregarCJ() {
  const gerenciador = new T.LoadingManager();
  gerenciador.setURLModifier((url) => {
    const nome = decodeURIComponent(url).split(/[\\/]/).pop().toLowerCase();
    return ["face.png", "torso.png", "pants.png", "sneakers.png"].includes(nome)
      ? "assets/cj/textures/" + nome
      : url;
  });
  const objeto = await new FBXLoader(gerenciador).loadAsync("assets/cj/cj.fbx");
  objeto.updateMatrixWorld(true);
  const limites = new T.Box3().setFromObject(objeto),
    tamanho = limites.getSize(new T.Vector3());
  const escala = 1.9 / tamanho.y;
  objeto.scale.multiplyScalar(escala);
  objeto.position.set(
    -(limites.min.x + limites.max.x) * 0.5 * escala,
    -limites.min.y * escala,
    -(limites.min.z + limites.max.z) * 0.5 * escala,
  );
  const grupo = new T.Group();
  grupo.add(objeto);
  grupo.name = "CJ_modelo_FBX_do_usuario";
  objeto.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = true;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        m.side = T.DoubleSide;
        if (m.map) m.map.colorSpace = T.SRGBColorSpace;
      }
    }
  });
  const bones = [];
  objeto.traverse((o) => {
    if (o.isBone) bones.push({ bone: o, rest: o.rotation.clone() });
  });
  return {
    group: grupo,
    modelo: objeto,
    animate(t) {
      for (const { bone, rest } of bones) {
        bone.rotation.copy(rest);
        if (/head|neck/i.test(bone.name))
          bone.rotation.y += Math.sin(t * 0.8) * 0.055;
        if (/upperarm|clavicle/i.test(bone.name))
          bone.rotation.x += Math.sin(t * 1.5) * 0.025;
      }
    },
  };
}
export function criarGabrielBreier() {
  const h = criarVisitante({
    arquivo: "assets/gabriel-breier.png",
    recorte: [350, 77, 96, 113, 713, 706],
    pele: "#c69a78",
    cabelo: "#493329",
    camisa: "#c69a78",
  });
  h.group.name = "Gabriel_Breier_referencia";
  const gesto = new T.Group();
  h.cotovelos[0].add(gesto);
  gesto.position.set(0, -0.29, 0.025);
  h.gestoEstalo = gesto;
  criarTubo(
    gesto,
    [
      [0, 0, 0],
      [0.035, -0.025, 0.02],
      [0.01, -0.06, 0.03],
    ],
    0.012,
    obterMaterial("#c69a78", 0.8),
  );
  criarTubo(
    gesto,
    [
      [-0.025, 0, 0],
      [-0.025, -0.045, 0.025],
      [0.01, -0.06, 0.03],
    ],
    0.011,
    obterMaterial("#c69a78", 0.8),
  );
  const pele = obterMaterial("#c69a78", 0.8),
    preto = obterMaterial("#181b20", 0.88);
  h.legs.forEach((l) =>
    l.traverse((o) => {
      if (o.isMesh) o.material = pele;
    }),
  );
  for (const lado of [-1, 1]) {
    criarElipsoide(h.body, [0.119, 0.075, 0.025], pele, [
      lado * 0.112,
      1.38,
      0.105,
    ]);
    criarElipsoide(h.body, [0.065, 0.17, 0.065], pele, [lado * 0.18, 1.19, 0]);
    for (let i = 0; i < 3; i++)
      criarElipsoide(h.body, [0.06, 0.037, 0.01], pele, [
        lado * 0.056,
        1.21 - i * 0.09,
        0.124,
      ]);
    criarCaixa(
      h.legs[lado === -1 ? 0 : 1],
      [0.19, 0.31, 0.23],
      preto,
      [0, -0.13, 0],
    );
    criarTubo(
      h.body,
      [
        [lado * 0.08, 1.66, 0.09],
        [lado * 0.1, 1.36, 0.15],
        [0, 1.01, 0.16],
      ],
      0.004,
      obterMaterial("#d9d8ce", 0.6),
    );
  }
  return h;
}
export function criarBolaFutebol() {
  const grupo = new T.Group();
  const mapa = new T.TextureLoader().load("assets/bola-brazuca.png");
  mapa.colorSpace = T.SRGBColorSpace;
  // Projeção da foto sobre uma esfera: a silhueta e o volume continuam tridimensionais.
  const geometria = new T.SphereGeometry(0.274, 48, 32),
    pos = geometria.attributes.position,
    uv = geometria.attributes.uv;
  for (let i = 0; i < pos.count; i++)
    uv.setXY(
      i,
      0.5 + (pos.getX(i) / 0.274) * 0.48,
      0.526 + (pos.getY(i) / 0.274) * 0.44,
    );
  criarMalha(
    grupo,
    geometria,
    new T.MeshStandardMaterial({ map: mapa, roughness: 0.4 }),
    [0, 0, 0],
  );
  for (let i = 0; i < 6; i++) {
    const g = new T.Group();
    grupo.add(g);
    g.rotation.set(i * 0.7, i * 1.05, 0);
    criarTubo(
      g,
      [
        [0, 0.25, 0],
        [0.19, 0.1, 0.16],
        [0.12, -0.16, 0.18],
        [0, -0.25, 0],
      ],
      0.013,
      obterMaterial(["#11496c", "#d65a26", "#2b9d55"][i % 3], 0.45),
    );
  }
  return grupo;
}
