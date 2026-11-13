import * as T from "./vendor/three.module.js";
import { materialPele } from "./pele.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarMalha,
  criarTubo,
  obterMaterial,
  criarTexturaTexto,
} from "./modelos.js";
import { criarVisitante } from "./personagens-castelo.js";
export function criarNaverdachi() {
  const h = criarVisitante({
    arquivo: "assets/naverdachi.png",
    recorte: [232, 86, 511, 525, 1005, 829],
    pele: "#aa704e",
    cabelo: "#29201a",
    camisa: "#f1f5f5",
    corCalca: "#151e27",
    mangaLonga: false,
    bermuda: true,
  });
  const pele = materialPele("#aa704e"),
    preto = obterMaterial("#151e27", 0.8),
    branco = obterMaterial("#f3f8fb", 0.65);
  h.cotovelos.forEach((c) =>
    c.traverse((o) => {
      if (o.isMesh) o.material = pele;
    }),
  );
  h.legs.forEach((l, i) => {
    l.traverse((o) => {
      if (o.isMesh) o.material = pele;
    });
    criarCilindro(l, 0.1, 0.115, 0.3, preto, [0, -0.11, 0]);
    criarCilindro(h.joelhos[i], 0.073, 0.07, 0.24, branco, [0, -0.2, 0]);
    criarElipsoide(h.joelhos[i], [0.08, 0.07, 0.15], branco, [0, -0.43, 0.07]);
  });
  const cracha = criarCaixa(
    h.body,
    [0.18, 0.12, 0.018],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto("NAVERDACHI", "#f0f4f7", "#121a23"),
    }),
    [0, 1.34, 0.14],
  );
  for (const lado of [-1, 1])
    criarTubo(
      h.body,
      [
        [lado * 0.13, 1.57, 0.08],
        [lado * 0.18, 1.5, 0.11],
        [lado * 0.21, 1.44, 0.1],
      ],
      0.012,
      preto,
    );
  const logo = new T.TextureLoader().load("assets/corinthians-ceu.png");
  logo.colorSpace = T.SRGBColorSpace;
  const escudo = criarCaixa(
    h.body,
    [0.08, 0.1, 0.012],
    new T.MeshStandardMaterial({ map: logo, roughness: 0.7 }),
    [-0.11, 1.45, 0.137],
  );
  // Crachá e escudo continuam no peito do corpo anatômico.
  for (const o of [cracha, escudo]) {
    o.userData.manterVisivel = true;
    o.position.z -= 0.015;
  }
  h.group.name = "Neymar_Naverdachi_referencia";
  h.group.scale.setScalar(1.05);
  return h;
}
export function criarBolaBluezao() {
  const g = new T.Group(),
    tex = new T.TextureLoader().load("assets/bluezao.png");
  tex.colorSpace = T.SRGBColorSpace;
  const geo = new T.SphereGeometry(0.43, 48, 32),
    p = geo.attributes.position,
    uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++)
    uv.setXY(
      i,
      0.5 + (p.getX(i) / 0.43) * 0.4,
      0.52 + (p.getY(i) / 0.43) * 0.42,
    );
  criarMalha(
    g,
    geo,
    new T.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0.05 }),
    [0, 0, 0],
  );
  const cabelo = obterMaterial("#b35c7d", 0.85);
  for (let i = 0; i < 17; i++) {
    const a = i * 2.39996,
      r = 0.1 + (i % 4) * 0.07;
    criarTubo(
      g,
      [
        [Math.cos(a) * r, 0.36, Math.sin(a) * r],
        [Math.cos(a + 0.6) * r * 1.3, 0.5, Math.sin(a + 0.6) * r * 1.3],
        [Math.cos(a + 1) * r * 1.5, 0.43, Math.sin(a + 1) * r * 1.5],
      ],
      0.011,
      cabelo,
    );
  }
  g.name = "Bola_Bluezao_3D";
  return g;
}
export function criarArenaAquatica() {
  const g = new T.Group();
  g.name = "Neo_Quimica_Arena_Aquatica_modelada";
  const branco = obterMaterial("#e6f8fb", 0.35, 0.12),
    estrutura = obterMaterial("#a1c6d3", 0.4, 0.5),
    azul = obterMaterial("#1b86bb", 0.25, 0.25),
    vidro = new T.MeshPhysicalMaterial({
      color: "#90e4fa",
      transparent: true,
      opacity: 0.3,
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1,
      side: T.DoubleSide,
    });
  const piso = obterMaterial("#278852", 0.86);
  criarCaixa(g, [57, 1, 83], branco, [0, -0.65, 0]);
  criarCaixa(g, [48, 0.18, 72], piso, [0, -0.12, 0]);
  for (let z = -36; z < 36; z += 6)
    criarCaixa(
      g,
      [48, 0.012, 6],
      obterMaterial(z % 12 ? "#2d9b66" : "#23895d", 0.88),
      [0, -0.017, z + 3],
    );
  // Linhas de campo num único conjunto de segmentos.
  const pontos = [];
  function linha(a, b) {
    pontos.push(...a, ...b);
  }
  const y = 0.024;
  for (const x of [-24, 24]) linha([x, y, -36], [x, y, 36]);
  for (const z of [-36, 0, 36]) linha([-24, y, z], [24, y, z]);
  for (let i = 0; i < 72; i++) {
    const a = (i * Math.PI) / 36,
      b = ((i + 1) * Math.PI) / 36;
    linha(
      [Math.cos(a) * 6.2, y, Math.sin(a) * 6.2],
      [Math.cos(b) * 6.2, y, Math.sin(b) * 6.2],
    );
  }
  for (const lado of [-1, 1]) {
    const z = lado * 36;
    for (const w of [10, 5]) {
      const d = w === 10 ? 11 : 5;
      linha([-w, y, z], [-w, y, z - lado * d]);
      linha([w, y, z], [w, y, z - lado * d]);
      linha([-w, y, z - lado * d], [w, y, z - lado * d]);
    }
  }
  const linhas = new T.BufferGeometry();
  linhas.setAttribute("position", new T.Float32BufferAttribute(pontos, 3));
  g.add(
    new T.LineSegments(linhas, new T.LineBasicMaterial({ color: "#f2ffff" })),
  );
  // Arquibancadas retangulares em dois níveis, assentos instanciados e corredores.
  const assentos = [];
  for (let lado = 0; lado < 4; lado++)
    for (let fila = 0; fila < 22; fila++) {
      const aoLongo = lado < 2,
        largura = aoLongo ? 92 : 64,
        altura = 0.6 + fila * 0.48 + (fila > 11 ? 1.5 : 0),
        afastamento = (aoLongo ? 27 : 39) + fila * 0.63;
      const pos = aoLongo
        ? [Math.sign(lado - 0.5) * afastamento, altura / 2, 0]
        : [0, altura / 2, Math.sign(lado - 2.5) * afastamento];
      criarCaixa(
        g,
        aoLongo ? [0.65, altura, largura] : [largura, altura, 0.65],
        branco,
        pos,
      );
      const n = Math.floor(largura / 0.8);
      for (let i = 0; i < n; i++) {
        if (i % 22 < 2) continue;
        const coord = -largura / 2 + i * 0.8;
        assentos.push({
          x: aoLongo ? pos[0] : coord,
          y: altura + 0.18,
          z: aoLongo ? coord : pos[2],
          rot: aoLongo
            ? lado === 0
              ? Math.PI / 2
              : -Math.PI / 2
            : lado === 2
              ? 0
              : Math.PI,
        });
      }
    }
  const matriz = new T.Object3D(),
    bancos = new T.InstancedMesh(
      new T.BoxGeometry(0.61, 0.14, 0.48),
      branco,
      assentos.length,
    ),
    encostos = new T.InstancedMesh(
      new T.BoxGeometry(0.61, 0.53, 0.1),
      branco,
      assentos.length,
    );
  g.add(bancos, encostos);
  for (const [i, a] of assentos.entries()) {
    matriz.position.set(a.x, a.y, a.z);
    matriz.rotation.y = a.rot;
    matriz.updateMatrix();
    bancos.setMatrixAt(i, matriz.matrix);
    matriz.translateZ(-0.21);
    matriz.position.y += 0.27;
    matriz.updateMatrix();
    encostos.setMatrixAt(i, matriz.matrix);
    const cor = new T.Color(i % 13 < 2 ? "#4ba9c4" : "#e4f4f9");
    bancos.setColorAt(i, cor);
    encostos.setColorAt(i, cor);
  }
  for (const x of [-35, 35]) {
    criarCaixa(g, [19, 0.7, 100], branco, [x, 16, 0]);
    criarCaixa(g, [5, 0.08, 100], vidro, [x > 0 ? 27 : -27, 16.4, 0]);
    for (let z = -48; z <= 48; z += 8) {
      criarCilindro(g, 0.13, 0.16, 15, estrutura, [x, 8, z]);
      criarTubo(
        g,
        [
          [x, 15.5, z],
          [x > 0 ? 24 : -24, 16.6, z],
          [x > 0 ? 45 : -45, 16.1, z],
        ],
        0.09,
        estrutura,
      );
    }
  }
  for (const z of [-48, 48]) {
    criarCaixa(g, [72, 0.7, 15], branco, [0, 16, z]);
    criarCaixa(g, [65, 0.1, 4], vidro, [0, 16.4, z > 0 ? 41 : -41]);
    for (let x = -30; x <= 30; x += 8)
      criarCilindro(g, 0.13, 0.16, 15, estrutura, [x, 8, z]);
  }
  const tela = new T.MeshStandardMaterial({
    map: criarTexturaTexto("NEO QUÍMICA ARENA | AQUA", "#063b54", "#d0ffff"),
    emissive: "#146d96",
    emissiveIntensity: 0.18,
    roughness: 0.45,
  });
  criarCaixa(g, [21, 3.5, 0.4], tela, [0, 13, -49]);
  for (const lado of [-1, 1]) {
    const z = lado * 36.4;
    for (const x of [-4.2, 4.2])
      criarCilindro(g, 0.06, 0.06, 2.7, branco, [x, 1.35, z]);
    criarCaixa(g, [8.5, 0.12, 0.12], branco, [0, 2.7, z]);
    const rede = new T.Group();
    g.add(rede);
    for (let x = -4.2; x <= 4.2; x += 0.35)
      criarTubo(
        rede,
        [
          [x, 0, z + lado * 2],
          [x, 2.7, z + lado * 2],
          [x, 2.7, z],
        ],
        0.008,
        branco,
      );
    for (let yy = 0; yy <= 2.7; yy += 0.3)
      criarTubo(
        rede,
        [
          [-4.2, yy, z + lado * 2],
          [4.2, yy, z + lado * 2],
        ],
        0.008,
        branco,
      );
  }
  // Aquários laterais e arcos de vidro mantêm o tema aquático dentro da arena.
  for (const x of [-48, 48]) {
    criarCaixa(g, [3, 9, 80], vidro, [x, 5, 0]);
    criarCaixa(g, [3.2, 0.3, 80], azul, [x, 9.5, 0]);
  }
  for (const z of [-52, 52])
    criarMalha(g, new T.TorusGeometry(38, 0.18, 10, 72, Math.PI), estrutura, [
      0,
      0,
      z,
    ]);
  return g;
}
