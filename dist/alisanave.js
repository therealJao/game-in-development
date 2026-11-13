import { criarFortalezaColina, criarCeuDourado } from "./paisagem-castelo.js";
// FASE ALISANAVE — modelos e cenas em tempo real, sem sequência de imagens.
import * as T from "./vendor/three.module.js";
import { criarBalsa } from "./balsa.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarTubo,
  criarMalha,
  obterMaterial,
  criarTexturaTexto,
  criarAxel,
} from "./modelos.js";
import {
  criarCharlieDetalhado,
  criarSQLmanDetalhado,
  criarCabecaYang,
} from "./modelos-alisanave.js";
import { criarAgua, criarCeu } from "./efeitos-visuais.js";
import { CELULA_PORTO, DURACAO_BARCO } from "./regras-alisanave.js";

function texturaArquivo(caminho) {
  const textura = new T.TextureLoader().load(caminho);
  textura.colorSpace = T.SRGBColorSpace;
  return textura;
}
function placa(grupo, texto, posicao, largura = 3, cor = "#07345d") {
  return criarCaixa(
    grupo,
    [largura, 0.6, 0.06],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto(texto, cor, "#f2f4e6"),
      roughness: 0.7,
    }),
    posicao,
  );
}

/** Contêiner com ondulações, cantoneiras, portas e barras de travamento reais em 3D. */
export function criarContainer(cor = "#bb4933", comprimento = 6) {
  const g = new T.Group(),
    tinta = obterMaterial(cor, 0.72, 0.3),
    aco = obterMaterial("#656f70", 0.5, 0.7);
  criarCaixa(g, [comprimento, 2.5, 2.43], tinta, [0, 1.25, 0]);
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 25; i++)
      criarCaixa(g, [0.045, 2.26, 0.055], tinta, [
        ((i - 12) * comprimento) / 26,
        1.25,
        lado * 1.24,
      ]);
    for (const y of [0.1, 2.4])
      criarCaixa(g, [comprimento, 0.1, 0.075], aco, [0, y, lado * 1.25]);
    for (const x of [-comprimento / 2 + 0.05, comprimento / 2 - 0.05])
      criarCaixa(g, [0.13, 2.5, 0.13], aco, [x, 1.25, lado * 1.19]);
  }
  for (const z of [-0.6, 0.6]) {
    criarCaixa(g, [0.035, 2.24, 1.12], tinta, [
      comprimento / 2 + 0.025,
      1.25,
      z,
    ]);
    criarCilindro(g, 0.022, 0.022, 2.1, aco, [comprimento / 2 + 0.08, 1.25, z]);
    criarCaixa(g, [0.06, 0.07, 0.3], aco, [comprimento / 2 + 0.1, 1.02, z]);
  }
  g.name = "Container_corrugado_3D";
  return g;
}

const criarCharlie = criarCharlieDetalhado,
  criarSQLman = criarSQLmanDetalhado;

function criarYang() {
  const g = new T.Group(),
    segmentos = [],
    pernas = [];
  for (let i = 0; i < 7; i++) {
    const segmento = new T.Group();
    g.add(segmento);
    const c = criarContainer("#b4b5aa", 3.8);
    c.scale.setScalar(0.5);
    c.position.y = 0.6;
    segmento.add(c);
    for (const s of [-1, 1]) {
      const logo = placa(
        segmento,
        "YANG MING",
        [0, 1.36, s * 0.64],
        1.8,
        "#deded1",
      );
      logo.material.map = criarTexturaTexto("YANG MING", "#d7d6ca", "#b32925");
      if (s < 0) logo.rotation.y = Math.PI;
      for (let j = 0; j < 3; j++) {
        const perna = new T.Group();
        perna.position.set((j - 1) * 0.62, 0.7, s * 0.5);
        segmento.add(perna);
        criarTubo(
          perna,
          [
            [0, 0, 0],
            [0.12, 0.15, s * 0.45],
            [0.3, -0.25, s * 0.85],
            [0.35, -0.67, s * 0.95],
          ],
          0.065,
          obterMaterial("#7a4230", 0.55),
        );
        criarTubo(
          perna,
          [
            [0.35, -0.67, s * 0.95],
            [0.38, -0.74, s * 1.03],
          ],
          0.035,
          obterMaterial("#30231b", 0.4),
        );
        for (const [x, y, z, r] of [
          [0, 0, 0, 0.11],
          [0.12, 0.15, s * 0.45, 0.1],
          [0.3, -0.25, s * 0.85, 0.08],
        ])
          criarElipsoide(perna, [r, r, r], obterMaterial("#a87859", 0.38), [
            x,
            y,
            z,
          ]);
        criarMalha(
          perna,
          new T.ConeGeometry(0.045, 0.23, 10),
          obterMaterial("#32231e", 0.3),
          [0.38, -0.7, s * 1.03],
          [0, 0, 0.25],
        );
        pernas.push({ objeto: perna, indice: i * 3 + j, lado: s });
      }
    }
    criarElipsoide(
      segmento,
      [0.8, 0.4, 0.51],
      obterMaterial("#713f32", 0.6),
      [0, 0.69, 0],
    );
    for (const x of [-0.9, 0.9]) {
      criarElipsoide(
        segmento,
        [0.24, 0.33, 0.48],
        obterMaterial("#683c30", 0.47),
        [x, 0.88, 0],
      );
      for (let anel = 0; anel < 5; anel++)
        criarMalha(
          segmento,
          new T.TorusGeometry(0.32, 0.028, 8, 20),
          obterMaterial("#a57657", 0.55),
          [x + anel * 0.035, 0.86, 0],
          [0, Math.PI / 2, 0],
          [1, 1.25, 1],
        );
    }
    for (const lado of [-1, 1])
      for (let veia = 0; veia < 5; veia++)
        criarTubo(
          segmento,
          [
            [-0.91, 0.75, lado * 0.4],
            [-0.7 + veia * 0.3, 1.02, lado * 0.65],
            [0.88, 1.08, lado * 0.45],
          ],
          0.022,
          obterMaterial("#a17155", 0.5),
        );
    // Placas orgânicas, tendões e costelas entre os módulos metálicos.
    for (const lado of [-1, 1]) {
      for (let j = 0; j < 6; j++) {
        const x = (j - 2.5) * 0.28;
        criarElipsoide(
          segmento,
          [0.16, 0.17, 0.08],
          obterMaterial(j % 2 ? "#67342e" : "#885343", 0.44),
          [x, 0.72, lado * 0.58],
        );
        criarTubo(
          segmento,
          [
            [x - 0.1, 0.52, lado * 0.54],
            [x, 0.76, lado * 0.69],
            [x + 0.07, 1.06, lado * 0.58],
          ],
          0.024,
          obterMaterial("#c2a48a", 0.63),
        );
        criarTubo(
          segmento,
          [
            [x - 0.18, 0.6, lado * 0.58],
            [x + 0.06, 0.8, lado * 0.7],
            [x + 0.2, 1.02, lado * 0.57],
          ],
          0.014,
          obterMaterial("#79332e", 0.4),
        );
      }
    }
    segmentos.push(segmento);
  }
  // Cabeça humana modelada na extremidade, conforme a referência do monstro.
  const cabeca = criarCabecaYang();
  cabeca.scale.setScalar(3.6);
  segmentos[0].add(cabeca);
  cabeca.position.set(1.18, 1.6, 0);
  cabeca.rotation.y = Math.PI / 2;
  g.name = "Yang_Ming_centopeia_de_containers";
  return { group: g, segmentos, pernas, cabeca };
}

function criarBarco() {
  const g = new T.Group(),
    casco = obterMaterial("#a24e26", 0.65, 0.2);
  const perfil = new T.Shape();
  perfil.moveTo(-1.2, -2.4);
  perfil.lineTo(1.2, -2.4);
  perfil.lineTo(1.2, 1.4);
  perfil.quadraticCurveTo(0.8, 2.7, 0, 3);
  perfil.quadraticCurveTo(-0.8, 2.7, -1.2, 1.4);
  perfil.closePath();
  criarMalha(
    g,
    new T.ExtrudeGeometry(perfil, {
      depth: 0.6,
      bevelEnabled: true,
      bevelSize: 0.18,
      bevelThickness: 0.2,
      bevelSegments: 3,
    }),
    casco,
    [0, 0.35, 0],
    [-Math.PI / 2, 0, 0],
  );
  criarCaixa(g, [1.9, 0.2, 3.7], obterMaterial("#a8875d", 0.85), [0, 0.95, 0]);
  for (const z of [-1.6, 0, 1.3])
    criarCaixa(g, [1.9, 0.15, 0.3], obterMaterial("#594c38", 0.85), [
      0,
      1.12,
      z,
    ]);
  criarCaixa(
    g,
    [1.2, 1.3, 1.3],
    obterMaterial("#e0ded2", 0.6),
    [0, 1.55, -0.9],
  );
  criarCaixa(
    g,
    [1, 0.45, 0.03],
    obterMaterial("#244857", 0.2),
    [0, 1.85, -0.22],
  );
  criarCilindro(
    g,
    0.04,
    0.04,
    3,
    obterMaterial("#474b49", 0.4, 0.7),
    [0, 2.5, -1.3],
  );
  for (const lado of [-1, 1]) {
    criarTubo(
      g,
      [
        [lado * 1.1, 1.2, -2],
        [lado * 1.1, 1.5, 0],
        [lado * 0.9, 1.35, 1.8],
      ],
      0.025,
      obterMaterial("#ced3cf", 0.4, 0.7),
    );
    for (const z of [-1.8, -0.2, 1.4])
      criarCilindro(g, 0.02, 0.02, 0.5, obterMaterial("#c6ccca", 0.5, 0.6), [
        lado * 1.1,
        1.2,
        z,
      ]);
  }
  return g;
}

export function criarCenasAlisanave() {
  const limbo = new T.Scene();
  limbo.background = new T.Color("#010204");
  limbo.fog = new T.Fog("#010204", 7, 40);
  limbo.add(new T.HemisphereLight("#6c89c9", "#010103", 2));
  const sqlman = criarSQLman(),
    axelQueda = criarAxel();
  limbo.add(sqlman.group, axelQueda.group);
  const anel = new T.Group();
  limbo.add(anel);
  for (let i = 0; i < 30; i++)
    criarCaixa(
      anel,
      [0.05, 0.05, 1],
      obterMaterial("#4d82c1", 0.5, 0, {
        emissive: "#284c85",
        emissiveIntensity: 1,
      }),
      [Math.cos(i) * 7, (i - 15) * 3, Math.sin(i) * 7],
      [i * 0.3, 0, i],
    );
  // Voo panorâmico: SQLman leva Axel no colo sobre o mar até a empresa.
  const voo = new T.Scene();
  voo.background = new T.Color("#a3cde9");
  voo.fog = new T.Fog("#bad9e9", 100, 550);
  const ceuVoo = criarCeu(voo);
  voo.add(new T.HemisphereLight("#e9f6ff", "#6d7f77", 2.5));
  const solVoo = new T.DirectionalLight("#fff0d2", 3.3);
  solVoo.position.set(-20, 55, 30);
  voo.add(solVoo);
  const marVoo = criarAgua(650, 650, "#237c9c");
  marVoo.position.set(0, -2, -80);
  voo.add(marVoo);
  criarCaixa(voo, [110, 3, 140], obterMaterial("#a6af9b", 0.95), [0, -1, -95]);
  const empresa = new T.Group();
  voo.add(empresa);
  empresa.position.set(0, 0, -90);
  criarCaixa(
    empresa,
    [32, 13, 22],
    obterMaterial("#e0e5de", 0.65),
    [0, 6.5, 0],
  );
  criarCaixa(
    empresa,
    [33, 0.5, 23],
    obterMaterial("#1a5480", 0.4, 0.4),
    [0, 13, 0],
  );
  for (let x = -12; x <= 12; x += 4)
    for (let y = 4; y < 12; y += 3)
      criarCaixa(
        empresa,
        [2.5, 1.5, 0.03],
        obterMaterial("#4e9cbe", 0.14, 0.5),
        [x, y, 11.04],
      );
  criarCaixa(
    empresa,
    [17, 3, 0.05],
    // Natal 2026: a primeira marca (prédio visto no voo) agora é o Preceiro, com o logotipo original.
    new T.MeshStandardMaterial({
      map: texturaArquivo("assets/lua/preceiro-faixa.png"),
      emissive: "#ffffff",
      emissiveMap: texturaArquivo("assets/lua/preceiro-faixa.png"),
      emissiveIntensity: 0.35,
    }),
    [0, 10, 11.12],
  );
  for (let i = 0; i < 18; i++) {
    const co = criarContainer(["#aa4935", "#cfa943", "#247990"][i % 3]);
    co.position.set(((i % 6) - 2.5) * 7, 0, -115 - Math.floor(i / 6) * 4);
    voo.add(co);
  }
  for (const x of [-36, 36]) {
    criarCaixa(voo, [1, 40, 1], obterMaterial("#1765a1", 0.5, 0.6), [
      x,
      20,
      -100,
    ]);
    criarCaixa(voo, [1, 1, 65], obterMaterial("#1765a1", 0.5, 0.6), [
      x,
      40,
      -89,
    ]);
  }
  const sala = new T.Scene();
  sala.background = new T.Color("#dce5e8");
  sala.add(new T.HemisphereLight("#ffffff", "#81919e", 2.3));
  const solSala = new T.DirectionalLight("#fff3e0", 2);
  solSala.position.set(1, 6, 4);
  sala.add(solSala);
  // Passarelas em torno da piscina, azulejos individuais e pilares como na referência.
  const piso = obterMaterial("#e1e5d6", 0.33, 0.12);
  criarCaixa(sala, [14, 0.25, 7], piso, [0, -0.125, -3.5]);
  criarCaixa(sala, [14, 0.25, 1], piso, [0, -0.125, 6.5]);
  criarCaixa(sala, [2, 0.25, 6], piso, [-6, -0.125, 3]);
  criarCaixa(sala, [2, 0.25, 6], piso, [6, -0.125, 3]);
  criarCaixa(sala, [10, 0.15, 6], obterMaterial("#38766d", 0.4), [0, -0.65, 3]);
  const piscina = criarAgua(10, 6, "#28665a");
  piscina.position.set(0, -0.18, 3);
  sala.add(piscina);
  for (let x = -7; x <= 7; x += 0.5)
    criarCaixa(sala, [0.012, 0.003, 7], obterMaterial("#9fac9b", 0.7), [
      x,
      0.003,
      -3.5,
    ]);
  for (let z = -7; z <= 0; z += 0.5)
    criarCaixa(sala, [14, 0.003, 0.012], obterMaterial("#9fac9b", 0.7), [
      0,
      0.004,
      z,
    ]);
  for (const x of [-4.5, 1.5])
    for (const z of [-0.8, 4.6]) {
      criarCilindro(sala, 0.34, 0.4, 6, obterMaterial("#e0e6d9", 0.45), [
        x,
        2.8,
        z,
      ]);
      criarCilindro(sala, 0.48, 0.48, 0.15, piso, [x, 0.07, z]);
    }
  criarCaixa(
    sala,
    [14, 0.15, 14],
    obterMaterial("#e5eadf", 0.85),
    [0, 5.75, 0],
  );
  for (const x of [-4, 1, 5]) {
    criarMalha(
      sala,
      new T.CircleGeometry(1.2, 64),
      obterMaterial("#fffce3", 0.3, 0, {
        emissive: "#fffbdc",
        emissiveIntensity: 2.2,
      }),
      [x, 2.8, -6.88],
    );
    criarMalha(sala, new T.TorusGeometry(1.23, 0.09, 12, 64), piso, [
      x,
      2.8,
      -6.84,
    ]);
  }
  const axelSala = criarAxel();
  sala.add(axelSala.group);
  for (const x of [-7, 7])
    criarCaixa(sala, [0.15, 6, 14], obterMaterial("#eef0e9", 0.9), [x, 3, 0]);
  for (const z of [-7, 7])
    criarCaixa(sala, [14, 6, 0.15], obterMaterial("#edf0eb", 0.9), [0, 3, z]);
  // A segunda marca (placas da sala branca) agora é o Komprão Koch, com o logotipo original.
  const logo = texturaArquivo("assets/lua/komprao-faixa.png"),
    logoMaterial = new T.MeshStandardMaterial({ map: logo, roughness: 0.6 });
  criarCaixa(sala, [4, 0.7, 0.025], logoMaterial, [0, 2.7, -6.87]);
  criarCaixa(
    sala,
    [2.5, 0.12, 1.2],
    obterMaterial("#b1b4b1", 0.65),
    [-3, 0.86, -3.6],
  );
  for (const x of [-4, -2])
    criarCaixa(sala, [0.08, 0.85, 0.08], obterMaterial("#555e66", 0.6, 0.5), [
      x,
      0.4,
      -3.6,
    ]);
  criarCaixa(
    sala,
    [1, 0.7, 0.09],
    obterMaterial("#161e25", 0.45),
    [-3, 1.37, -3.85],
  );
  criarCaixa(
    sala,
    [0.88, 0.55, 0.02],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto("> ALISANAVE", "#041923", "#5ecec9"),
      emissive: "#217387",
      emissiveIntensity: 0.4,
    }),
    [-3, 1.37, -3.79],
  );
  criarCaixa(
    sala,
    [0.8, 0.04, 0.25],
    obterMaterial("#27343c", 0.7),
    [-3, 0.95, -3.3],
  );
  const charlie = criarCharlie();
  charlie.group.position.set(-3, -0.35, -2.3);
  charlie.group.rotation.y = Math.PI;
  charlie.legs.forEach((p) => (p.rotation.x = -1.3));
  charlie.joelhos.forEach((j) => (j.rotation.x = 1.25));
  sala.add(charlie.group);
  criarCaixa(
    sala,
    [0.6, 0.08, 0.6],
    obterMaterial("#272d32", 0.8),
    [-3, 0.48, -2.3],
  );
  criarCaixa(
    sala,
    [0.6, 0.7, 0.08],
    obterMaterial("#272d32", 0.8),
    [-3, 0.9, -1.96],
  );
  const curva = new T.CatmullRomCurve3(
    [
      [4, 2.4, -3],
      [5, 2.1, -1],
      [4.8, 1.8, 2],
      [2.7, 1.0, 4],
      [0, 0.4, 4.5],
      [-1.5, -0.3, 4],
    ].map((p) => new T.Vector3(...p)),
  );
  criarMalha(
    sala,
    new T.TubeGeometry(curva, 70, 0.65, 24, false),
    obterMaterial("#086b70", 0.22, 0.3, { side: T.DoubleSide }),
  );
  for (let i = 0; i < 7; i++)
    criarCaixa(sala, [1, 0.13, 0.3], obterMaterial("#455a68", 0.6, 0.5), [
      3,
      0.17 + i * 0.29,
      -1.0 - i * 0.3,
    ]);
  for (const x of [2.45, 3.55]) {
    criarTubo(
      sala,
      [
        [x, 0.4, -0.9],
        [x, 2.5, -2.9],
        [x + 0.4, 2.8, -3.15],
      ],
      0.035,
      obterMaterial("#778d8c", 0.35, 0.7),
    );
    for (let i = 0; i < 7; i++)
      criarCilindro(
        sala,
        0.025,
        0.025,
        0.8,
        obterMaterial("#778d8c", 0.35, 0.7),
        [x, 0.6 + i * 0.29, -1 - i * 0.3],
      );
  }
  criarCaixa(sala, [1.7, 0.34, 0.025], logoMaterial, [4, 2.7, -2.45]);
  const estampa = criarCaixa(
    sala,
    [1.45, 0.32, 0.025],
    logoMaterial,
    [5.55, 1.8, -0.9],
    [0, Math.PI / 2, 0],
  );
  placa(sala, "TOBOGÃ", [4, 3.3, -3], 2);
  const porto = new T.Scene();
  const ceuPorto = criarCeu(porto);
  porto.background = new T.Color("#050a13");
  ceuPorto.material.uniforms.noite.value = 1;
  porto.fog = new T.Fog("#091422", 16, 100);
  porto.add(new T.HemisphereLight("#789bc5", "#08070b", 0.48));
  const sol = new T.DirectionalLight("#90add5", 1.05);
  sol.position.set(-30, 80, 25);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, {
    left: -100,
    right: 100,
    top: 100,
    bottom: -100,
    near: 1,
    far: 220,
  });
  sol.shadow.bias = -0.0005;
  sol.target.position.set(65, 0, 55);
  porto.add(sol, sol.target);
  criarCaixa(
    porto,
    [270, 0.2, 190],
    obterMaterial("#757f7f", 0.95),
    [70, -0.1, 40],
  );
  const yang = criarYang();
  porto.add(yang.group);
  const lanternaPorto = new T.SpotLight(
    "#e5dcbd",
    55,
    30,
    Math.PI / 4,
    0.65,
    2,
  );
  lanternaPorto.castShadow = true;
  lanternaPorto.shadow.camera.near = 0.15;
  lanternaPorto.shadow.camera.far = 35;
  porto.add(lanternaPorto, lanternaPorto.target);
  const impactos = Array.from({ length: 12 }, () => {
    const objeto = new T.Mesh(
      new T.RingGeometry(0.08, 0.24, 24),
      new T.MeshBasicMaterial({
        color: "#b8afa2",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: T.DoubleSide,
      }),
    );
    objeto.rotation.x = -Math.PI / 2;
    porto.add(objeto);
    return { objeto, inicio: -99 };
  });
  const guia = criarCharlie().head;
  porto.add(guia);
  guia.name = "Cabeca_voadora_Charlie";
  const buraco = new T.Group();
  porto.add(buraco);
  buraco.position.set(15, 0.01, 9);
  criarMalha(
    buraco,
    new T.CircleGeometry(2.2, 48),
    new T.MeshBasicMaterial({ color: "#000103" }),
    [0, 0, 0],
    [-Math.PI / 2, 0, 0],
  );
  criarMalha(
    buraco,
    new T.TorusGeometry(2.3, 0.18, 8, 48),
    obterMaterial("#333b3f", 0.8, 0.4),
    [0, 0.05, 0],
    [Math.PI / 2, 0, 0],
  );
  const painelContagem = placa(buraco, "10", [0, 2, 0], 2, "#1a252a");
  const mar = criarAgua(900, 800, "#23879f");
  mar.position.set(70, -0.45, 450);
  mar.material.uniforms.noite.value = 1;
  porto.add(mar);
  // Natal 2026: o barquinho virou a balsa (ferry boat) da travessia Itajaí ⇄ Navegantes.
  const barco = criarBalsa();
  const referenciasCeu = new T.Group();
  porto.add(referenciasCeu);
  referenciasCeu.visible = false;
  for (const [arquivo, x, y, largura, altura] of [
    ["assets/corinthians-ceu.png", -70, 48, 105, 26],
    ["assets/vasco-lua.png", 45, 45, 100, 30],
  ]) {
    const mapa = texturaArquivo(arquivo);
    const material = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      fog: false,
      toneMapped: false,
      uniforms: {
        imagem: { value: mapa },
        limparBranco: { value: arquivo.includes("corinthians") ? 1 : 0 },
      },
      vertexShader:
        "varying vec2 ponto;void main(){ponto=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "uniform sampler2D imagem;uniform float limparBranco;varying vec2 ponto;void main(){vec4 cor=texture2D(imagem,ponto);if(limparBranco>.5&&min(min(cor.r,cor.g),cor.b)>.91)discard;gl_FragColor=cor;}",
    });
    const referencia = new T.Mesh(
      new T.PlaneGeometry(largura, altura),
      material,
    );
    referencia.position.set(x, y, 0);
    referenciasCeu.add(referencia);
  }
  porto.add(barco);
  barco.position.set(141, 0.1, 126);
  const paisagemCastelo = criarFortalezaColina();
  const castelo = paisagemCastelo.grupo;
  castelo.position.set(141, 0, 430);
  porto.add(castelo);
  const ceuCastelo = criarCeuDourado(porto);
  ceuCastelo.visible = false;
  const solCastelo = new T.DirectionalLight("#ffca72", 3);
  solCastelo.position.set(-60, 90, 230);
  solCastelo.visible = false;
  solCastelo.target.position.set(141, 40, 430);
  porto.add(solCastelo, solCastelo.target);
  const ambienteBarco = new T.AmbientLight("#ffe2ac", 1.2);
  ambienteBarco.visible = false;
  porto.add(ambienteBarco);
  // Guindastes, navio e pilhas compõem o terminal portuário ao ar livre.
  for (let i = 0; i < 4; i++) {
    const x = -15 + i * 52;
    for (const z of [-20, 90])
      criarCaixa(porto, [1.4, 28, 1.4], obterMaterial("#0759a0", 0.5, 0.6), [
        x,
        14,
        z,
      ]);
    criarCaixa(porto, [2, 2, 125], obterMaterial("#0a69a9", 0.5, 0.6), [
      x,
      29,
      35,
    ]);
    criarCaixa(porto, [35, 1.2, 1.2], obterMaterial("#0c62a1", 0.5, 0.6), [
      x + 14,
      30,
      -15,
    ]);
    for (const dz of [-15, 0, 15, 30, 45, 60, 75])
      criarTubo(
        porto,
        [
          [x, 29, -20],
          [x, 35, 0],
          [x, 29, dz],
        ],
        0.08,
        obterMaterial("#508caa", 0.5, 0.6),
      );
  }
  const navio = new T.Group();
  porto.add(navio);
  navio.position.set(-42, 0, 60);
  criarElipsoide(
    navio,
    [9, 7, 55],
    obterMaterial("#18313f", 0.6, 0.4),
    [0, -3, 0],
  );
  for (let i = 0; i < 7; i++)
    for (let j = 0; j < 3; j++) {
      const c = criarContainer(["#b3482d", "#c6a32f", "#387c87"][j], 6);
      c.position.set((j - 1) * 5, 4 + (i % 2) * 2.5, (i - 3) * 9);
      navio.add(c);
    }
  criarCaixa(navio, [13, 16, 12], obterMaterial("#d3d9cf", 0.7), [0, 12, -37]);
  const passageiro = criarAxel();
  porto.add(passageiro.group);
  passageiro.group.visible = false;
  return {
    voo,
    ceuVoo,
    marVoo,
    ceuPorto,
    piscina,
    axelSala,
    lanternaPorto,
    impactos,
    indiceImpacto: 0,
    limbo,
    sqlman,
    axelQueda,
    anel,
    sala,
    charlie,
    curva,
    porto,
    yang,
    guia,
    buraco,
    painelContagem,
    mar,
    barco,
    referenciasCeu,
    castelo,
    ceuCastelo,
    solCastelo,
    ambienteBarco,
    passageiro,
    terminais: [],
    paredes: null,
    tempoContagem: -1,
  };
}

/** Instâncias compartilham geometria: centenas de contêineres sem centenas de materiais. */
export function montarLabirintoAlisanave(cenas, fase) {
  cenas.charlie.body.add(cenas.charlie.head);
  cenas.charlie.head.position.set(0, 1.73, 0);
  cenas.charlie.head.rotation.set(0, 0, 0);
  cenas.tempoContagem = -1;

  if (cenas.paredes) {
    cenas.porto.remove(cenas.paredes);
    cenas.paredes.traverse((o) => {
      if (o.isInstancedMesh) {
        o.geometry.dispose();
        o.dispose();
      }
    });
  }
  for (const terminal of cenas.terminais) cenas.porto.remove(terminal);
  cenas.terminais = [];
  const paredes = new T.Group();
  cenas.porto.add(paredes);
  cenas.paredes = paredes;
  const celulas = [];
  fase.mapa.forEach((linha, z) =>
    linha.forEach((valor, x) => {
      if (valor) celulas.push({ x: (x + 0.5) * 6, z: (z + 0.5) * 6 });
    }),
  );
  const matriz = new T.Object3D(),
    cores = ["#be4d36", "#d2ab32", "#227397", "#47917c", "#b8b9a8", "#1c4d6a"];
  const caixas = new T.InstancedMesh(
    new T.BoxGeometry(5.86, 3, 2.86),
    obterMaterial("#ffffff", 0.8, 0.22),
    celulas.length * 2,
  );
  caixas.castShadow = true;
  caixas.receiveShadow = true;
  paredes.add(caixas);
  const nervuras = new T.InstancedMesh(
    new T.BoxGeometry(0.055, 2.7, 0.09),
    obterMaterial("#758187", 0.65, 0.35),
    celulas.length * 48,
  );
  paredes.add(nervuras);
  let n = 0,
    k = 0;
  for (let i = 0; i < celulas.length; i++) {
    const p = celulas[i];
    for (const dz of [-1.5, 1.5]) {
      matriz.position.set(p.x, 1.5, p.z + dz);
      matriz.scale.set(1, 1, 1);
      matriz.updateMatrix();
      caixas.setMatrixAt(n, matriz.matrix);
      caixas.setColorAt(n++, new T.Color(cores[i % cores.length]));
      for (const lado of [-1, 1])
        for (let j = 0; j < 12; j++) {
          matriz.position.set(
            p.x + (j - 5.5) * 0.48,
            1.5,
            p.z + dz + lado * 1.48,
          );
          matriz.updateMatrix();
          nervuras.setMatrixAt(k++, matriz.matrix);
        }
    }
  }
  caixas.instanceMatrix.needsUpdate = true;
  nervuras.instanceMatrix.needsUpdate = true;
  for (const t of fase.terminais) {
    const g = new T.Group();
    g.position.set(t.x, 0, t.z);
    cenas.porto.add(g);
    criarCaixa(
      g,
      [0.75, 1.4, 0.6],
      obterMaterial("#1c3942", 0.65, 0.3),
      [0, 0.7, 0],
    );
    const luz = placa(g, "HTML / CSS", [0, 1.6, 0.33], 1.7);
    const sinal = new T.PointLight("#54d0dc", 12, 13, 2);
    sinal.position.set(0, 2.3, 0);
    g.add(sinal);
    cenas.terminais.push(g);
  }
  placa(paredes, "BARCO →", [fase.saida.x, 2.2, fase.saida.z], 3, "#15543b");
}

export function desenharAlisanave(view, estado, tempo) {
  const c = view.alisanave,
    f = estado.porto,
    p = f.jogador,
    t = f.tempo,
    cam = view.camera;
  cam.rotation.order = "YXZ";
  cam.fov = 70;
  cam.far = 900;
  const suave = (a, b, v) => {
    const n = T.MathUtils.clamp((v - a) / (b - a), 0, 1);
    return n * n * (3 - 2 * n);
  };
  c.mar.material.uniforms.tempo.value = tempo;
  c.piscina.material.uniforms.tempo.value = tempo;
  c.ceuPorto.material.uniforms.tempo.value = tempo;
  if (f.etapa === "limbo") {
    const carregando = t >= 4;
    if (t < 5) {
      if (c.sqlman.group.parent !== c.limbo) c.limbo.add(c.sqlman.group);
      c.sqlman.group.position.set(
        5 * (1 - suave(1, 4, t)),
        -Math.min(t, 4) * 2 + 0.1,
        0,
      );
      c.sqlman.group.rotation.set(0, 0, -0.12 * (1 - suave(2, 4, t)));
    } else {
      if (c.sqlman.group.parent !== c.voo) c.voo.add(c.sqlman.group);
      const v = suave(5, 22, t);
      c.sqlman.group.position.set(
        Math.sin(v * Math.PI) * 5,
        14 + Math.sin(v * Math.PI) * 12 - v * 11,
        20 - v * 94,
      );
      c.sqlman.group.rotation.set(
        0.15 * Math.sin(v * Math.PI),
        Math.PI + 0.18 * Math.sin(v * Math.PI),
        Math.sin(v * Math.PI * 2) * 0.09,
      );
    }
    if (carregando) {
      if (c.axelQueda.group.parent !== c.sqlman.body)
        c.sqlman.body.add(c.axelQueda.group);
      c.axelQueda.group.position.set(0.38, 1.02, 0.38);
      c.axelQueda.group.rotation.set(0, 0, Math.PI / 2);
      c.axelQueda.group.scale.setScalar(0.7);
      c.sqlman.arms.forEach((braco, i) => {
        braco.position.y = 1.35;
        braco.rotation.set(-0.9, 0, i ? -0.12 : 0.12);
        c.sqlman.cotovelos[i].rotation.x = 0.95;
      });
    } else {
      c.sqlman.arms.forEach((braco, i) => {
        braco.position.y = 1.48;
        braco.rotation.set(-0.3, 0, 0);
        c.sqlman.cotovelos[i].rotation.x = 0;
      });
      if (c.axelQueda.group.parent !== c.limbo) c.limbo.add(c.axelQueda.group);
      c.axelQueda.group.scale.setScalar(1);
      c.axelQueda.group.position.set(0, -t * 2, 0);
      c.axelQueda.group.rotation.set(t * 0.4, t * 0.3, t * 0.13);
    }
    c.sqlman.animarCapa(tempo);
    c.sqlman.head.rotation.set(
      Math.sin(tempo * 1.4) * 0.025,
      Math.sin(tempo * 0.7) * 0.06,
      0,
    );
    c.sqlman.body.scale.y = 1 + Math.sin(tempo * 2.2) * 0.006;
    if (t < 5) {
      cam.position.set(2, 2 - t * 2, 7);
      cam.lookAt(0, -t * 2 + 1, 0);
    } else {
      const v = suave(5, 22, t),
        pos = c.sqlman.group.position;
      cam.position.set(
        pos.x + (t < 14 ? 3.3 : 6),
        pos.y + 1.8,
        pos.z + (t < 14 ? -4.8 : 8),
      );
      cam.lookAt(pos.x, pos.y + 1, pos.z - 1);
      c.marVoo.material.uniforms.tempo.value = tempo;
      c.ceuVoo.material.uniforms.tempo.value = tempo;
    }
    cam.fov = 57;
    cam.updateProjectionMatrix();
    view.renderer.toneMappingExposure = 1.05;
    view.renderer.render(t < 5 ? c.limbo : c.voo, cam);
    return;
  }
  if (f.etapa === "sala" || f.etapa === "toboga") {
    const andar = suave(10, 17, t);
    c.axelSala.group.visible = f.etapa === "sala";
    c.axelSala.group.position.set(
      -0.7 + 4.7 * andar,
      1.9 * suave(15, 18, t),
      -1.2 - 1.8 * andar,
    );
    c.axelSala.group.rotation.y = -Math.PI / 2;
    c.axelSala.animate(tempo, t > 10 ? 2 : 0);
    c.charlie.body.scale.y = 1 + Math.sin(tempo * 2.2) * 0.006;
    c.charlie.head.rotation.set(
      Math.sin(tempo * 1.6) * 0.025,
      Math.sin(tempo * 0.8) * 0.045,
      Math.sin(tempo * 0.9) * 0.012,
    );
    c.charlie.arms.forEach((a, i) => {
      a.rotation.x = -0.8 + Math.sin(tempo * 3 + i) * 0.025;
      c.charlie.cotovelos[i].rotation.x = -0.45;
    });
    if (f.conversa) {
      if (c.charlie.head.parent !== c.sala) c.sala.attach(c.charlie.head);
      const subir = suave(6, 9, t);
      c.charlie.head.position.set(
        -3 + 5 * subir,
        1.05 + 1.05 * subir + Math.sin(tempo * 2) * 0.045,
        -2.3 + subir,
      );
      c.charlie.head.rotation.y = Math.PI * 0.35;
    }
    if (f.etapa === "toboga") {
      const v = Math.min(0.997, t / 7),
        pos = c.curva.getPointAt(v),
        alvo = c.curva.getPointAt(Math.min(1, v + 0.04));
      cam.position.copy(pos);
      cam.lookAt(alvo);
      cam.rotation.z = Math.sin(t * 2) * 0.07;
    } else if (t < 5) {
      cam.position.set(3.4 - t * 0.45, 2.4, 1.9 - t * 0.56);
      cam.lookAt(-3, 1.16, -2.3);
    } else if (t < 11) {
      cam.position.set(-1.4, 1.65, -4.5);
      cam.lookAt(c.charlie.head.position);
    } else {
      cam.position.set(-2 + suave(11, 18, t) * 4, 3, 4);
      cam.lookAt(
        c.axelSala.group.position.clone().add(new T.Vector3(0, 0.8, 0)),
      );
    }
    if (f.conversa) {
      c.charlie.head.lookAt(cam.position);
      c.charlie.head.rotation.x += Math.sin(tempo * 1.6) * 0.018;
    }
    cam.fov = f.etapa === "toboga" ? 78 : 58;
    view.renderer.toneMappingExposure = 1.0;
    cam.updateProjectionMatrix();
    view.renderer.render(c.sala, cam);
    return;
  }
  c.yang.group.visible = f.etapa === "labirinto" && f.contagem <= 0;
  c.guia.visible = f.etapa === "labirinto";
  c.buraco.visible = f.etapa === "labirinto";
  c.ceuCastelo.visible = f.etapa === "barco";
  c.solCastelo.visible = f.etapa === "barco";
  c.ambienteBarco.visible = f.etapa === "barco";
  c.porto.fog.near = f.etapa === "barco" ? 250 : 16;
  c.porto.fog.far = f.etapa === "barco" ? 900 : 100;
  c.porto.fog.color.set(f.etapa === "barco" ? "#b5a078" : "#091422");
  c.ceuPorto.visible = f.etapa !== "barco";
  c.ceuCastelo.material.uniforms.tempo.value = tempo;
  c.mar.material.uniforms.noite.value = f.etapa === "barco" ? 0.25 : 1;
  if (f.etapa === "barco") {
    const progresso = Math.min(1, t / DURACAO_BARCO),
      z = 126 + progresso * 190;
    const balanco = 0.12 + Math.sin(t * 1.3) * 0.06;
    c.barco.position.set(141, balanco, z);
    c.barco.rotation.z = Math.sin(t * 1.1) * 0.012;
    c.barco.rotation.x = Math.sin(t * 0.8) * 0.006;
    c.barco.userData.animar?.(t);
    c.passageiro.group.visible = true;
    c.passageiro.group.position.set(141.3, balanco + 1.02, z + 1);
    c.passageiro.group.rotation.y = 0;
    cam.position.set(150, 13.5, z - 42);
    cam.lookAt(141, 17 + progresso * 6, z + 80);
    c.referenciasCeu.visible = true;
    c.referenciasCeu.position.set(141, 0, z + 185);
    c.referenciasCeu.children.forEach((o) => o.lookAt(cam.position));
  } else {
    c.referenciasCeu.visible = false;
    c.passageiro.group.visible = false;
    cam.position.set(
      p.x,
      (f.agachado ? 1.0 : 1.72) +
        (f.correndo ? Math.sin(tempo * 13) * 0.035 : 0),
      p.z,
    );
    cam.rotation.set(p.pitch, p.yaw, 0, "YXZ");
    cam.fov = f.correndo ? 79 : 70;
    c.guia.position.set(
      p.x - Math.cos(p.yaw) * 1.15 - Math.sin(p.yaw) * 1.5,
      2.3 + Math.sin(tempo * 3) * 0.1,
      p.z + Math.sin(p.yaw) * 1.15 - Math.cos(p.yaw) * 1.5,
    );
    c.guia.rotation.y = Math.atan2(
      p.x - c.guia.position.x,
      p.z - c.guia.position.z,
    );
    const numero = Math.ceil(f.contagem);
    if (numero !== c.tempoContagem) {
      c.tempoContagem = numero;
      c.painelContagem.material.map.dispose();
      c.painelContagem.material.map = criarTexturaTexto(
        numero > 0 ? String(numero) : "YANG MING",
        "#19232b",
        "#efba70",
      );
      c.painelContagem.material.needsUpdate = true;
    }
    c.yang.segmentos.forEach((segmento, i) => {
      const ponto = f.trilha[Math.min(f.trilha.length - 1, i * 25)] || f.yang;
      segmento.position.set(ponto.x, Math.sin(tempo * 5 - i) * 0.08, ponto.z);
      const anterior =
        i === 0
          ? p
          : f.trilha[Math.max(0, Math.min(f.trilha.length - 1, i * 25 - 6))] ||
            p;
      segmento.rotation.y =
        Math.atan2(anterior.x - ponto.x, anterior.z - ponto.z) - Math.PI / 2;
    });
    c.yang.pernas.forEach((perna) => {
      const fase =
          tempo * 12 + perna.indice * 1.1 + (perna.lado < 0 ? Math.PI : 0),
        onda = Math.sin(fase);
      perna.objeto.position.y = 0.7 + Math.max(0, onda) * 0.16;
      perna.objeto.rotation.x = Math.cos(fase) * 0.2;
      perna.objeto.rotation.z = perna.lado * onda * 0.1;
      if (
        onda < 0 &&
        (perna.ondaAnterior ?? -1) >= 0 &&
        perna.indice % 3 === 0 &&
        c.yang.group.visible
      ) {
        c.yang.group.updateMatrixWorld(true);
        const pe = perna.objeto.localToWorld(
          new T.Vector3(0.38, -0.72, perna.lado * 1.02),
        );
        const impacto = c.impactos[c.indiceImpacto++ % c.impactos.length];
        impacto.inicio = tempo;
        impacto.objeto.position.set(pe.x, 0.018, pe.z);
      }
      perna.ondaAnterior = onda;
    });
    c.yang.cabeca.rotation.x = Math.sin(tempo * 2) * 0.025;
    c.impactos.forEach((i) => {
      const idade = tempo - i.inicio;
      i.objeto.visible = idade < 0.55;
      i.objeto.scale.setScalar(1 + Math.max(0, idade) * 3);
      i.objeto.material.opacity = Math.max(0, 0.24 * (1 - idade / 0.55));
    });
    c.terminais.forEach((g, i) => (g.visible = !f.terminais[i].feito));
  }
  c.lanternaPorto.position.copy(cam.position);
  c.lanternaPorto.target.position
    .copy(cam.position)
    .add(
      new T.Vector3(0, -0.08, -1)
        .applyQuaternion(cam.quaternion)
        .multiplyScalar(15),
    );
  c.lanternaPorto.visible = f.etapa === "labirinto";
  if (f.etapa === "labirinto" && !estado.reduced) {
    const abalo = (f.abaloYang || 0) * 0.022;
    cam.position.y += Math.sin(tempo * 26) * abalo;
    cam.rotation.z += Math.sin(tempo * 19) * abalo * 0.45;
  }
  c.mar.position.y = -0.45 + Math.sin(tempo * 0.6) * 0.025;
  cam.updateProjectionMatrix();
  view.renderer.toneMappingExposure = 1.1;
  view.renderer.render(c.porto, cam);
}
