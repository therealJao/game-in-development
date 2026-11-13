// Personagens desta fase: malhas, articulações e detalhes editáveis em metros.
import * as T from "./vendor/three.module.js";
import { materialPele } from "./pele.js";
import { criarHumano } from "./humanos.js";
import {
  criarCaixa,
  criarElipsoide,
  criarCilindro,
  criarTubo,
  criarMalha,
  obterMaterial,
} from "./modelos.js";

/** Rosto curvo com UV recortado da ficha fornecida, mantendo nariz e perfil em 3D. */
export function rostoReferencia(grupo, arquivo, recorte, largura, altura) {
  const textura = new T.TextureLoader().load(arquivo);
  textura.colorSpace = T.SRGBColorSpace;
  const [x, y, w, h, totalW, totalH] = recorte;
  textura.repeat.set(w / totalW, h / totalH);
  textura.offset.set(x / totalW, 1 - (y + h) / totalH);
  const vertices = [],
    uv = [],
    indices = [],
    n = 32;
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) {
      const u = i / n,
        v = j / n,
        nx = u * 2 - 1,
        ny = v * 2 - 1;
      const nariz = Math.exp(-nx * nx * 65 - (ny + 0.08) ** 2 * 24) * 0.025;
      vertices.push(
        nx * largura * Math.sqrt(1 - ny * ny * 0.4),
        ny * altura,
        0.07 + Math.sqrt(Math.max(0, 1 - nx * nx)) * 0.048 + nariz,
      );
      uv.push(u, v);
    }
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i,
        b = a + n + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return criarMalha(
    grupo,
    geo,
    new T.MeshStandardMaterial({ map: textura, roughness: 0.78 }),
  );
}

export function criarCharlieDetalhado() {
  const h = criarHumano({
    camisa: "#191b20",
    pele: "#c99d7f",
    cabelo: "#b5afa1",
  });
  h.head.clear(); // Substitui a cabeça básica inteira; os óculos deixam de ser blocos opacos.
  h.head.scale.setScalar(1.17);
  const pele = materialPele("#c69a7d"),
    cabelo = obterMaterial("#b5afa1", 0.86),
    luzCabelo = obterMaterial("#ded5c4", 0.88);
  criarCilindro(h.head, 0.053, 0.064, 0.14, pele, [0, -0.15, 0]);
  criarElipsoide(h.head, [0.112, 0.149, 0.102], pele, [0, 0, -0.012]);
  criarElipsoide(h.head, [0.09, 0.054, 0.085], pele, [0, -0.103, 0.012]);
  rostoReferencia(
    h.head,
    "assets/charlie-referencia.png",
    [839, 44, 100, 126, 1116, 733],
    0.105,
    0.133,
  );
  for (const lado of [-1, 1]) {
    criarElipsoide(h.head, [0.019, 0.035, 0.022], pele, [
      lado * 0.112,
      -0.015,
      0,
    ]);
    criarElipsoide(
      h.head,
      [0.009, 0.023, 0.013],
      obterMaterial("#aa795e", 0.9),
      [lado * 0.12, -0.014, 0.012],
    );
    // Armação fina e lentes transparentes, deixando os olhos da referência visíveis.
    criarTubo(
      h.head,
      [
        [lado * 0.008, 0.031, 0.128],
        [lado * 0.017, 0.054, 0.128],
        [lado * 0.096, 0.053, 0.119],
        [lado * 0.098, 0.009, 0.124],
        [lado * 0.022, 0.006, 0.131],
        [lado * 0.008, 0.031, 0.128],
      ],
      0.0035,
      obterMaterial("#161a1c", 0.36),
    );
    criarCaixa(
      h.head,
      [0.079, 0.036, 0.003],
      new T.MeshPhysicalMaterial({
        color: "#bfdfde",
        transparent: true,
        opacity: 0.1,
        roughness: 0.1,
      }),
      [lado * 0.052, 0.03, 0.129],
    );
    criarTubo(
      h.head,
      [
        [lado * 0.098, 0.043, 0.12],
        [lado * 0.119, 0.045, 0.04],
        [lado * 0.113, 0.018, -0.03],
      ],
      0.0035,
      obterMaterial("#161a1c", 0.36),
    );
  }
  criarTubo(
    h.head,
    [
      [-0.009, 0.035, 0.13],
      [0, 0.041, 0.135],
      [0.009, 0.035, 0.13],
    ],
    0.0035,
    obterMaterial("#161a1c", 0.36),
  );
  criarElipsoide(h.head, [0.111, 0.062, 0.108], cabelo, [0, 0.116, -0.018]);
  for (let i = 0; i < 25; i++) {
    const x = (i - 12) * 0.008;
    criarTubo(
      h.head,
      [
        [x - 0.025, 0.105, 0.075],
        [x - 0.012, 0.161, 0.045],
        [x + 0.029, 0.157, -0.014],
        [x + 0.047, 0.103, -0.077],
      ],
      0.006,
      i % 3 ? cabelo : luzCabelo,
    );
  }
  const tecido = obterMaterial("#24262b", 0.94),
    costura = obterMaterial("#37383c", 0.96);
  for (const lado of [-1, 1]) {
    criarCaixa(
      h.body,
      [0.105, 0.075, 0.018],
      tecido,
      [lado * 0.065, 1.53, 0.115],
      [0, 0, lado * 0.4],
    );
    criarTubo(
      h.body,
      [
        [lado * 0.11, 1.02, 0.108],
        [lado * 0.15, 1.2, 0.135],
        [lado * 0.19, 1.38, 0.108],
      ],
      0.005,
      costura,
    );
    // Antebraços de pele e mangas curtas da polo preta da ficha.
    const cot = h.cotovelos[lado === -1 ? 0 : 1];
    cot.children.slice(0, 2).forEach((o) => (o.material = pele));
    criarCaixa(
      h.legs[lado === -1 ? 0 : 1],
      [0.015, 0.27, 0.005],
      costura,
      [0, -0.15, 0.098],
    );
  }
  for (let i = 0; i < 3; i++)
    criarElipsoide(
      h.body,
      [0.007, 0.007, 0.004],
      obterMaterial("#b7b2a8", 0.5),
      [0, 1.49 - i * 0.035, 0.132],
    );
  criarCaixa(
    h.body,
    [0.017, 0.13, 0.012],
    obterMaterial("#7f3833", 0.8),
    [0, 1.46, 0.128],
  );
  criarCilindro(
    h.cotovelos[0],
    0.061,
    0.061,
    0.033,
    obterMaterial("#161b21", 0.4, 0.5),
    [0, -0.23, 0],
  );
  h.group.name = "Charlie_polo_preta_cabelo_prateado_oculos";
  return h;
}

export function criarSQLmanDetalhado() {
  const h = criarHumano({
    camisa: "#17191d",
    pele: "#202126",
    cabelo: "#0b0c0f",
  });
  const armadura = obterMaterial("#282a30", 0.43, 0.25),
    preto = obterMaterial("#090b0e", 0.7);
  for (const lado of [-1, 1]) {
    criarElipsoide(h.body, [0.15, 0.16, 0.13], armadura, [
      lado * 0.128,
      1.36,
      0.035,
    ]);
    criarElipsoide(
      h.arms[lado === -1 ? 0 : 1],
      [0.105, 0.14, 0.11],
      preto,
      [0, -0.06, 0],
    );
    criarElipsoide(h.body, [0.07, 0.17, 0.06], preto, [
      lado * 0.17,
      1.14,
      0.07,
    ]);
  }
  const emblema = new T.Group();
  h.body.add(emblema);
  emblema.position.set(0, 1.38, 0.163);
  criarElipsoide(
    emblema,
    [0.145, 0.081, 0.018],
    obterMaterial("#b7bdc0", 0.28, 0.7),
  );
  criarMalha(
    emblema,
    new T.TorusGeometry(0.049, 0.012, 12, 40),
    obterMaterial("#f16a29", 0.28, 0.3, {
      emissive: "#a4360a",
      emissiveIntensity: 0.35,
    }),
    [0, 0, 0.02],
    [0, 0, 0],
    [1.23, 0.92, 1],
  );
  const capa = new T.PlaneGeometry(0.95, 1.45, 10, 18),
    base = Float32Array.from(capa.attributes.position.array);
  const malha = criarMalha(
    h.group,
    capa,
    obterMaterial("#111319", 0.85, 0, { side: T.DoubleSide }),
    [0, 0.91, -0.2],
  );
  // Capa deformada por vértices, sem imagem plana da referência.
  h.animarCapa = (tempo) => {
    const a = capa.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const y = base[i * 3 + 1],
        peso = (0.725 - y) / 1.45;
      a.setZ(
        i,
        Math.sin(tempo * 5 + base[i * 3] * 6 - peso * 4) * 0.12 * peso -
          peso * 0.35,
      );
    }
    a.needsUpdate = true;
    capa.computeVertexNormals();
  };
  criarElipsoide(h.head, [0.11, 0.066, 0.09], preto, [0, 0.139, -0.014]);
  h.group.name = "SQLman_traje_preto_emblema_O_laranja";
  return h;
}

export function criarCabecaYang() {
  const g = new T.Group(),
    pele = materialPele("#b18d73");
  criarElipsoide(g, [0.145, 0.19, 0.125], pele, [0, 0, 0]);
  rostoReferencia(
    g,
    "assets/yang-ming-referencia.png",
    [47, 141, 181, 217, 1353, 749],
    0.147,
    0.183,
  );
  criarElipsoide(
    g,
    [0.15, 0.069, 0.13],
    obterMaterial("#151719", 0.93),
    [0, 0.153, -0.014],
  );
  for (const s of [-1, 1])
    criarElipsoide(g, [0.025, 0.05, 0.025], pele, [s * 0.145, -0.01, 0]);
  for (let i = 0; i < 24; i++)
    criarTubo(
      g,
      [
        [(i - 12) * 0.011, 0.146, 0.065],
        [(i - 12) * 0.011, 0.203, 0.006],
        [(i - 12) * 0.01, 0.16, -0.09],
      ],
      0.006,
      obterMaterial(i % 3 ? "#17191b" : "#343331", 0.95),
    );
  return g;
}

