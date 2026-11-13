import * as T from "./vendor/three.module.js";
import { CONFIGURACAO } from "./configuracao.js";

/**
 * TEMA DE NATAL — tudo modelado em malhas 3D (nenhuma imagem baixada).
 * Liga/desliga em configuracao.js → CONFIGURACAO.natal.
 * Peças: touca do Papai Noel, árvore com bolas espelhadas e pisca-pisca, presentes,
 * boneco de neve, bengala doce, guirlanda, varal de luzes, neve caindo e chão nevado.
 */
export const NATAL_ATIVO = () => CONFIGURACAO.natal !== false;

let semente = 9137;
const aleatorio = () => {
  semente = (semente * 1664525 + 1013904223) >>> 0;
  return semente / 4294967296;
};

// ---------- Texturas procedurais ----------
function texturaPelucia() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#f4f1ea";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const x = aleatorio() * 256,
      y = aleatorio() * 256,
      v = 200 + aleatorio() * 55;
    g.strokeStyle = `rgba(${v},${v},${v - 8},0.55)`;
    g.lineWidth = 1 + aleatorio() * 1.5;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (aleatorio() - 0.5) * 6, y + (aleatorio() - 0.5) * 6);
    g.stroke();
  }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
function texturaVeludo() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#b3121b";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const v = aleatorio();
    g.fillStyle = v > 0.5 ? "rgba(255,80,80,0.08)" : "rgba(60,0,0,0.12)";
    g.fillRect(aleatorio() * 128, aleatorio() * 128, 2, 2);
  }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
let cache = null;
function materiais() {
  if (cache) return cache;
  const pel = texturaPelucia(),
    vel = texturaVeludo();
  cache = {
    veludo: new T.MeshPhysicalMaterial({
      map: vel,
      color: "#ffffff",
      roughness: 0.82,
      sheen: 1,
      sheenColor: new T.Color("#ff6a6a"),
      sheenRoughness: 0.45,
    }),
    pelucia: new T.MeshStandardMaterial({
      map: pel,
      roughness: 1,
      bumpMap: pel,
      bumpScale: 0.02,
    }),
    folha: new T.MeshStandardMaterial({ color: "#123f20", roughness: 0.8, flatShading: true }),
    folhaClara: new T.MeshStandardMaterial({ color: "#1c5a2a", roughness: 0.75, flatShading: true }),
    tronco: new T.MeshStandardMaterial({ color: "#4a2f1d", roughness: 0.95 }),
    ouro: new T.MeshStandardMaterial({ color: "#ffcc4d", metalness: 1, roughness: 0.22, emissive: "#6b4600", emissiveIntensity: 0.6 }),
    neve: new T.MeshStandardMaterial({ color: "#f3f7ff", roughness: 0.62 }),
    carvao: new T.MeshStandardMaterial({ color: "#151515", roughness: 0.9 }),
    cenoura: new T.MeshStandardMaterial({ color: "#ff7a1a", roughness: 0.6 }),
  };
  return cache;
}

// ---------- Touca do Papai Noel ----------
/** Touca com cone curvado (tubo afinando), barra de pelúcia e pompom. raio = raio da cabeça. */
export function criarToucaNatal(raio = 0.14) {
  const m = materiais();
  const g = new T.Group();
  g.name = "Touca_de_Natal";
  // Cone curvado: anéis decrescentes ao longo de uma curva que tomba para trás.
  const curva = new T.CatmullRomCurve3([
    new T.Vector3(0, 0, 0),
    new T.Vector3(0, raio * 1.1, -raio * 0.1),
    new T.Vector3(0, raio * 1.9, -raio * 0.55),
    new T.Vector3(0, raio * 1.8, -raio * 1.35),
    new T.Vector3(0, raio * 1.25, -raio * 1.85),
  ]);
  const anel = 24,
    secoes = 28,
    pos = [],
    uv = [],
    idx = [];
  const frames = curva.computeFrenetFrames(secoes, false);
  for (let i = 0; i <= secoes; i++) {
    const u = i / secoes,
      c = curva.getPointAt(u),
      r = raio * 1.05 * Math.pow(1 - u, 0.85) + raio * 0.04;
    const N = frames.normals[i],
      B = frames.binormals[i];
    for (let j = 0; j <= anel; j++) {
      const a = (j / anel) * Math.PI * 2,
        dobra = 1 + Math.sin(a * 3 + u * 9) * 0.04 * u; // dobras do tecido
      pos.push(
        c.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * r * dobra,
        c.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * r * dobra,
        c.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * r * dobra,
      );
      uv.push(j / anel * 2, u * 3);
    }
  }
  for (let i = 0; i < secoes; i++)
    for (let j = 0; j < anel; j++) {
      const a = i * (anel + 1) + j,
        b = a + anel + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const cone = new T.Mesh(geo, m.veludo);
  cone.castShadow = true;
  g.add(cone);
  // Barra de pelúcia com volume irregular.
  const barraGeo = new T.TorusGeometry(raio * 1.05, raio * 0.26, 14, 48);
  const p = barraGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      n = 1 + (Math.sin(x * 90) * Math.cos(y * 80) + Math.sin(z * 70)) * 0.06;
    p.setXYZ(i, x * n, y * n, z * n);
  }
  barraGeo.computeVertexNormals();
  const barra = new T.Mesh(barraGeo, m.pelucia);
  barra.rotation.x = Math.PI / 2;
  barra.castShadow = true;
  g.add(barra);
  const pompom = new T.Mesh(new T.IcosahedronGeometry(raio * 0.32, 3), m.pelucia);
  pompom.position.copy(curva.getPointAt(1));
  pompom.castShadow = true;
  g.add(pompom);
  g.userData.pompom = pompom;
  g.userData.ponta = curva.getPointAt(1);
  return g;
}

// ---------- Árvore de Natal ----------
/** Árvore em camadas de galhos com bolas espelhadas, festão dourado, pisca-pisca e estrela. */
export function criarArvoreNatal(altura = 4, { luzes = true } = {}) {
  const m = materiais();
  const g = new T.Group();
  g.name = "Arvore_de_Natal";
  const tronco = new T.Mesh(new T.CylinderGeometry(altura * 0.04, altura * 0.055, altura * 0.18, 12), m.tronco);
  tronco.position.y = altura * 0.09;
  g.add(tronco);
  const camadas = 7,
    galhos = [];
  for (let i = 0; i < camadas; i++) {
    const f = i / camadas,
      raio = altura * 0.36 * (1 - f * 0.85),
      h = altura * 0.22,
      y = altura * 0.16 + f * altura * 0.7;
    const geo = new T.ConeGeometry(raio, h, 18, 3, true);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k),
        z = pos.getZ(k),
        yy = pos.getY(k),
        a = Math.atan2(z, x),
        borda = yy < -h * 0.3 ? 1 : 0;
      const ond = 1 + borda * (Math.sin(a * 9 + i) * 0.12 + (aleatorio() - 0.5) * 0.1);
      pos.setXYZ(k, x * ond, yy - borda * Math.abs(Math.sin(a * 9 + i)) * h * 0.12, z * ond);
    }
    geo.computeVertexNormals();
    const camada = new T.Mesh(geo, i % 2 ? m.folha : m.folhaClara);
    camada.material.side = T.DoubleSide;
    camada.position.y = y;
    camada.rotation.y = i * 0.7;
    camada.castShadow = camada.receiveShadow = true;
    g.add(camada);
    galhos.push({ y, raio, h });
  }
  // Bolas: vidro metalizado que reflete o ambiente.
  const cores = ["#d4202a", "#f2c230", "#2a62d4", "#c8c8d8", "#d43a8a"];
  const bolaGeo = new T.SphereGeometry(altura * 0.028, 18, 14);
  const bolaMats = cores.map((c) => new T.MeshStandardMaterial({ color: c, metalness: 0.9, roughness: 0.12 }));
  for (const [i, gal] of galhos.entries())
    for (let k = 0; k < 6 + (camadas - i); k++) {
      const a = (k / (6 + camadas - i)) * Math.PI * 2 + i,
        r = gal.raio * 0.88;
      const b = new T.Mesh(bolaGeo, bolaMats[(i + k) % bolaMats.length]);
      b.position.set(Math.cos(a) * r, gal.y - gal.h * 0.38, Math.sin(a) * r);
      b.castShadow = true;
      g.add(b);
    }
  // Festão dourado em espiral.
  const espiral = [];
  for (let i = 0; i <= 160; i++) {
    const u = i / 160,
      y = altura * 0.2 + u * altura * 0.66,
      r = altura * 0.33 * (1 - u * 0.85) + 0.02;
    espiral.push(new T.Vector3(Math.cos(u * 22) * r, y, Math.sin(u * 22) * r));
  }
  const festao = new T.Mesh(
    new T.TubeGeometry(new T.CatmullRomCurve3(espiral), 300, altura * 0.007, 6),
    m.ouro,
  );
  g.add(festao);
  // Pisca-pisca: instâncias emissivas que piscam em grupos.
  let pisca = null;
  if (luzes) {
    const n = 140,
      geo = new T.SphereGeometry(altura * 0.009, 8, 6),
      mat = new T.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
    pisca = new T.InstancedMesh(geo, mat, n);
    const mtx = new T.Matrix4(),
      paleta = ["#ff3b3b", "#ffd84a", "#48a6ff", "#53ff7a", "#ff7af0"].map((c) => new T.Color(c));
    for (let i = 0; i < n; i++) {
      const u = i / n,
        y = altura * 0.18 + u * altura * 0.68,
        r = altura * 0.345 * (1 - u * 0.85) + 0.03,
        a = u * 31 + 1.3;
      mtx.setPosition(Math.cos(a) * r, y, Math.sin(a) * r);
      pisca.setMatrixAt(i, mtx);
      pisca.setColorAt(i, paleta[i % paleta.length]);
    }
    pisca.userData.base = paleta;
    g.add(pisca);
  }
  // Estrela de cinco pontas extrudada.
  const forma = new T.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2,
      r = i % 2 ? altura * 0.035 : altura * 0.085;
    i ? forma.lineTo(Math.cos(a) * r, Math.sin(a) * r) : forma.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const estrela = new T.Mesh(
    new T.ExtrudeGeometry(forma, { depth: altura * 0.02, bevelEnabled: true, bevelSize: altura * 0.006, bevelThickness: altura * 0.006, bevelSegments: 2 }),
    new T.MeshStandardMaterial({ color: "#ffe27a", emissive: "#ffb800", emissiveIntensity: 2.2, metalness: 0.6, roughness: 0.3 }),
  );
  estrela.position.y = altura * 0.98;
  g.add(estrela);
  const brilho = new T.PointLight("#ffd27a", 6, altura * 2.2, 2);
  brilho.position.y = altura * 0.55;
  g.add(brilho);
  // Presentes ao redor.
  for (let i = 0; i < 6; i++) {
    const p = criarPresente(altura * (0.06 + aleatorio() * 0.05), i);
    const a = i * 1.1 + 0.4,
      r = altura * (0.2 + aleatorio() * 0.12);
    p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    p.rotation.y = aleatorio() * 3;
    g.add(p);
  }
  const cor = new T.Color();
  g.userData.animar = (t) => {
    estrela.rotation.y = t * 0.6;
    estrela.material.emissiveIntensity = 1.8 + Math.sin(t * 3) * 0.5;
    if (!pisca) return;
    for (let i = 0; i < pisca.count; i++) {
      const on = Math.sin(t * 3.2 + (i % 5) * 1.3 + Math.floor(i / 5) * 0.4) > -0.2;
      cor.copy(pisca.userData.base[i % 5]).multiplyScalar(on ? 2.2 : 0.18);
      pisca.setColorAt(i, cor);
    }
    pisca.instanceColor.needsUpdate = true;
  };
  return g;
}

// ---------- Presente ----------
export function criarPresente(tamanho = 0.3, variacao = 0) {
  const papel = ["#c41e2a", "#1e6b3a", "#2147a8", "#e8e2d0", "#8a2bc4"][variacao % 5],
    fita = ["#f6d04d", "#e8e8f0", "#d42a2a", "#c41e2a", "#f6d04d"][variacao % 5];
  const g = new T.Group();
  const w = tamanho * (1 + (variacao % 3) * 0.25),
    h = tamanho * (0.8 + (variacao % 2) * 0.4);
  const caixa = new T.Mesh(
    new T.BoxGeometry(w, h, tamanho),
    new T.MeshStandardMaterial({ color: papel, roughness: 0.45, metalness: 0.1 }),
  );
  caixa.position.y = h / 2;
  caixa.castShadow = caixa.receiveShadow = true;
  g.add(caixa);
  const fitaMat = new T.MeshStandardMaterial({ color: fita, roughness: 0.3, metalness: 0.5 });
  for (const [sx, sz] of [[w * 1.01, tamanho * 0.14], [w * 0.14, tamanho * 1.01]]) {
    const f = new T.Mesh(new T.BoxGeometry(sx, h * 1.01, sz), fitaMat);
    f.position.y = h / 2;
    g.add(f);
  }
  for (const s of [-1, 1]) {
    const laco = new T.Mesh(new T.TorusGeometry(tamanho * 0.13, tamanho * 0.035, 8, 20), fitaMat);
    laco.position.set(s * tamanho * 0.1, h + tamanho * 0.08, 0);
    laco.rotation.set(0, Math.PI / 2, s * 0.6);
    g.add(laco);
  }
  return g;
}

// ---------- Boneco de neve ----------
export function criarBonecoDeNeve(altura = 1.6) {
  const m = materiais();
  const g = new T.Group();
  g.name = "Boneco_de_neve";
  const bolas = [
    [0.38, 0.36],
    [0.28, 0.92],
    [0.2, 1.36],
  ];
  for (const [r, y] of bolas) {
    const geo = new T.SphereGeometry(r * altura / 1.6, 40, 28),
      p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new T.Vector3().fromBufferAttribute(p, i);
      v.multiplyScalar(1 + (Math.sin(v.x * 30) * Math.sin(v.y * 27) * Math.sin(v.z * 33)) * 0.025);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const b = new T.Mesh(geo, m.neve);
    b.position.y = (y * altura) / 1.6;
    b.castShadow = b.receiveShadow = true;
    g.add(b);
  }
  const k = altura / 1.6;
  for (const s of [-1, 1]) {
    const olho = new T.Mesh(new T.SphereGeometry(0.025 * k, 8, 6), m.carvao);
    olho.position.set(s * 0.07 * k, 1.42 * k, 0.17 * k);
    g.add(olho);
    const braco = new T.Mesh(new T.CylinderGeometry(0.012 * k, 0.018 * k, 0.55 * k, 5), m.tronco);
    braco.position.set(s * 0.42 * k, 1.02 * k, 0);
    braco.rotation.z = s * -1.0;
    g.add(braco);
  }
  for (let i = 0; i < 3; i++) {
    const botao = new T.Mesh(new T.SphereGeometry(0.026 * k, 8, 6), m.carvao);
    botao.position.set(0, (0.82 + i * 0.12) * k, 0.27 * k);
    g.add(botao);
  }
  const nariz = new T.Mesh(new T.ConeGeometry(0.03 * k, 0.2 * k, 10), m.cenoura);
  nariz.rotation.x = Math.PI / 2;
  nariz.position.set(0, 1.36 * k, 0.27 * k);
  g.add(nariz);
  const cachecol = new T.Mesh(new T.TorusGeometry(0.2 * k, 0.045 * k, 8, 24), materiais().veludo);
  cachecol.rotation.x = Math.PI / 2;
  cachecol.position.y = 1.2 * k;
  g.add(cachecol);
  const touca = criarToucaNatal(0.17 * k);
  touca.position.y = 1.5 * k;
  touca.rotation.x = -0.15;
  g.add(touca);
  return g;
}

// ---------- Bengala doce ----------
export function criarBengalaDoce(altura = 1) {
  const pts = [];
  for (let i = 0; i <= 20; i++) pts.push(new T.Vector3(0, (i / 20) * altura * 0.8, 0));
  for (let i = 1; i <= 16; i++) {
    const a = (i / 16) * Math.PI;
    pts.push(new T.Vector3(-altura * 0.12 + Math.cos(a) * altura * 0.12, altura * 0.8 + Math.sin(a) * altura * 0.12, 0));
  }
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const gx = c.getContext("2d");
  gx.fillStyle = "#fbfbf6";
  gx.fillRect(0, 0, 64, 256);
  gx.fillStyle = "#d0101e";
  for (let y = -64; y < 256; y += 32) {
    gx.beginPath();
    gx.moveTo(0, y);
    gx.lineTo(64, y + 32);
    gx.lineTo(64, y + 46);
    gx.lineTo(0, y + 14);
    gx.fill();
  }
  const tx = new T.CanvasTexture(c);
  tx.wrapS = tx.wrapT = T.RepeatWrapping;
  tx.repeat.set(1, 6);
  tx.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(
    new T.TubeGeometry(new T.CatmullRomCurve3(pts), 60, altura * 0.035, 12),
    new T.MeshPhysicalMaterial({ map: tx, roughness: 0.15, clearcoat: 1 }),
  );
  m.castShadow = true;
  return m;
}

// ---------- Guirlanda ----------
export function criarGuirlanda(raio = 0.4) {
  const m = materiais();
  const g = new T.Group();
  const folhaGeo = new T.ConeGeometry(raio * 0.12, raio * 0.35, 4);
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * Math.PI * 2,
      f = new T.Mesh(folhaGeo, i % 2 ? m.folha : m.folhaClara);
    f.position.set(Math.cos(a) * raio, Math.sin(a) * raio, (aleatorio() - 0.5) * raio * 0.2);
    f.rotation.set(aleatorio() * 3, aleatorio() * 3, a);
    g.add(f);
  }
  const bagas = new T.MeshStandardMaterial({ color: "#c40d18", roughness: 0.3 });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2,
      b = new T.Mesh(new T.SphereGeometry(raio * 0.05, 8, 6), bagas);
    b.position.set(Math.cos(a) * raio, Math.sin(a) * raio, raio * 0.1);
    g.add(b);
  }
  const laco = criarPresente(raio * 0.001, 0).children[3] || null;
  if (laco) g.add(laco);
  return g;
}

// ---------- Varal de luzes (catenária) ----------
export function criarVaralDeLuzes(inicio, fim, quantidade = 24, queda = 0.6) {
  const g = new T.Group();
  const a = new T.Vector3(...inicio),
    b = new T.Vector3(...fim),
    pts = [];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30,
      p = a.clone().lerp(b, u);
    p.y -= Math.sin(u * Math.PI) * queda;
    pts.push(p);
  }
  const curva = new T.CatmullRomCurve3(pts);
  g.add(new T.Mesh(new T.TubeGeometry(curva, 40, 0.008, 4), new T.MeshBasicMaterial({ color: "#1b2a1b" })));
  const geo = new T.SphereGeometry(0.045, 8, 6),
    mat = new T.MeshBasicMaterial({ toneMapped: false }),
    luzes = new T.InstancedMesh(geo, mat, quantidade),
    mtx = new T.Matrix4(),
    paleta = ["#ff3030", "#ffd040", "#40a0ff", "#40ff70", "#ff60e0"].map((c) => new T.Color(c));
  for (let i = 0; i < quantidade; i++) {
    const p = curva.getPointAt((i + 0.5) / quantidade);
    mtx.makeScale(1, 1.4, 1).setPosition(p.x, p.y - 0.05, p.z);
    luzes.setMatrixAt(i, mtx);
    luzes.setColorAt(i, paleta[i % 5].clone().multiplyScalar(2));
  }
  g.add(luzes);
  const cor = new T.Color();
  g.userData.animar = (t) => {
    for (let i = 0; i < quantidade; i++) {
      cor.copy(paleta[i % 5]).multiplyScalar(Math.sin(t * 2.5 + i * 0.9) > -0.3 ? 2.2 : 0.25);
      luzes.setColorAt(i, cor);
    }
    luzes.instanceColor.needsUpdate = true;
  };
  return g;
}

// ---------- Neve caindo ----------
/** Partículas de neve que acompanham a câmera (funciona em qualquer cena externa). */
export function criarNeve({ quantidade = 2600, area = 34, altura = 18 } = {}) {
  const pos = new Float32Array(quantidade * 3),
    fase = new Float32Array(quantidade);
  for (let i = 0; i < quantidade; i++) {
    pos.set([(aleatorio() - 0.5) * area, aleatorio() * altura, (aleatorio() - 0.5) * area], i * 3);
    fase[i] = aleatorio();
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(pos, 3));
  geo.setAttribute("fase", new T.BufferAttribute(fase, 1));
  const mat = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTempo: { value: 0 },
      uCamera: { value: new T.Vector3() },
      uArea: { value: area },
      uAltura: { value: altura },
      uEscala: { value: innerHeight / 2 },
      uVento: { value: new T.Vector2(0.4, 0.15) },
    },
    vertexShader: `attribute float fase; uniform float uTempo; uniform vec3 uCamera; uniform float uArea; uniform float uAltura; uniform float uEscala; uniform vec2 uVento;
      varying float vAlfa;
      void main(){
        vec3 p = position;
        float queda = uTempo * (0.6 + fase * 0.7);
        p.y = mod(p.y - queda, uAltura);
        p.x += sin(uTempo * (0.6 + fase) + fase * 30.0) * 0.35 + uVento.x * uTempo;
        p.z += cos(uTempo * (0.5 + fase) + fase * 17.0) * 0.3 + uVento.y * uTempo;
        // Repete a caixa de neve ao redor da câmera.
        vec3 base = uCamera - vec3(uArea * 0.5, uAltura * 0.45, uArea * 0.5);
        p.xz = base.xz + mod(p.xz - base.xz, uArea);
        p.y += base.y;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        gl_PointSize = (0.035 + fase * 0.04) * uEscala / max(d, 0.1);
        vAlfa = smoothstep(uArea * 0.55, uArea * 0.25, d) * smoothstep(0.2, 1.0, d);
      }`,
    fragmentShader: `varying float vAlfa;
      void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, smoothstep(0.5, 0.1, d) * 0.9 * vAlfa); }`,
  });
  const neve = new T.Points(geo, mat);
  neve.frustumCulled = false;
  neve.name = "Neve_caindo";
  neve.renderOrder = 10;
  neve.onBeforeRender = (renderer, scene, camera) => {
    mat.uniforms.uTempo.value = performance.now() / 1000;
    camera.getWorldPosition(mat.uniforms.uCamera.value);
    mat.uniforms.uEscala.value = renderer.domElement.height / 2;
  };
  return neve;
}

/** Cobre de neve o topo de malhas largas e planas (telhados, chão, muros) com uma camada branca. */
export function nevarSuperficies(cena, { minimo = 1.2, max = 220 } = {}) {
  const m = materiais(),
    caixa = new T.Box3(),
    tamanho = new T.Vector3(),
    centro = new T.Vector3(),
    alvos = [];
  cena.updateMatrixWorld(true);
  cena.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.semNeve || o.material?.transparent) return;
    if (!o.geometry?.boundingBox) o.geometry?.computeBoundingBox?.();
    caixa.setFromObject(o);
    caixa.getSize(tamanho);
    if (tamanho.x >= minimo && tamanho.z >= minimo && tamanho.x < 400 && tamanho.z < 400) alvos.push([o, caixa.clone()]);
  });
  alvos.sort((a, b) => b[1].getSize(tamanho).x * b[1].getSize(tamanho).z - a[1].getSize(centro).x * a[1].getSize(centro).z);
  const grupo = new T.Group();
  grupo.name = "Camada_de_neve";
  for (const [, c] of alvos.slice(0, max)) {
    c.getSize(tamanho);
    c.getCenter(centro);
    const placa = new T.Mesh(new T.BoxGeometry(tamanho.x * 1.01, 0.06, tamanho.z * 1.01), m.neve);
    placa.position.set(centro.x, c.max.y + 0.03, centro.z);
    placa.receiveShadow = true;
    placa.userData.semNeve = true;
    grupo.add(placa);
  }
  cena.add(grupo);
  return grupo;
}

/** Percorre uma cena e anima tudo que tiver userData.animar (árvores, luzes). */
export function animarNatal(raiz, t) {
  raiz.traverse((o) => o.userData.animar?.(t));
}
