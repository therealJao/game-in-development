import * as T from "./vendor/three.module.js";
import { animacaoDeMalha } from "./animacao-modelos.js";
import { OBJLoader } from "./vendor/OBJLoader.js";
import { FBXLoader } from "./vendor/FBXLoader.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarTexturaTexto,
  obterMaterial,
  criarAxel,
} from "./modelos.js";
import { criarPessoa } from "./personagens.js";
import { criarBiz } from "./objetos-da-historia.js";
import { criarDavyJones } from "./personagens-castelo.js";
import { altura94, CASAS94, ETAPAS_FINAL } from "./regras-final.js";
const pasta = new URL("assets/final/", import.meta.url).href;
function placa(g, t, w, h, p, ry = 0) {
  const m = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({ map: t, side: T.DoubleSide }),
  );
  m.position.set(...p);
  m.rotation.y = ry;
  g.add(m);
  return m;
}
function texto(g, t, w, h, p, bg = "#182027", fg = "#d9ded6", ry = 0) {
  return placa(g, criarTexturaTexto(t, bg, fg, 1024, 256), w, h, p, ry);
}
function converter(g) {
  const cache = new Map();
  g.traverse((o) => {
    if (!o.isMesh) return;
    const cv = (m) => {
      if (!m.isMeshStandardMaterial && !m.isMeshPhysicalMaterial) return m;
      if (!cache.has(m))
        cache.set(
          m,
          new T.MeshPhongMaterial({
            map: m.map,
            color: m.color,
            side: m.side,
            transparent: m.transparent,
            opacity: m.opacity,
            alphaTest: m.alphaTest,
            shininess: 20,
            emissive: m.emissive,
          }),
        );
      return cache.get(m);
    };
    o.material = Array.isArray(o.material)
      ? o.material.map(cv)
      : cv(o.material);
    for (const m of Array.isArray(o.material) ? o.material : [o.material])
      m.name = m.type;
  });
}
function muralPeppa() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#b5b8a0";
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#80585f";
  g.lineWidth = 8;
  g.fillStyle = "#cb969f";
  g.beginPath();
  g.ellipse(255, 230, 100, 80, -0.1, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(350, 220, 50, 32, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  for (const x of [210, 270]) {
    g.beginPath();
    g.ellipse(x, 145, 18, 45, -0.3, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }
  for (const x of [250, 290]) {
    g.fillStyle = "#ddd8c8";
    g.beginPath();
    g.arc(x, 205, 13, 0, 7);
    g.fill();
    g.fillStyle = "#232328";
    g.beginPath();
    g.arc(x + 2, 207, 5, 0, 7);
    g.fill();
  }
  g.fillStyle = "#92454c";
  g.beginPath();
  g.moveTo(205, 303);
  g.lineTo(170, 411);
  g.lineTo(335, 411);
  g.lineTo(310, 303);
  g.fill();
  g.fillStyle = "#5c5353";
  g.font = "19px monospace";
  g.fillText("HORA DE BRINCAR", 150, 460);
  return new T.CanvasTexture(c);
}
function corredor() {
  const scene = new T.Scene();
  scene.background = new T.Color("#22261f");
  scene.fog = new T.Fog("#38392e", 7, 37);
  scene.add(new T.HemisphereLight("#bbc49d", "#322c30", 0.8));
  criarCaixa(scene, [18, 0.2, 46], obterMaterial("#616052"), [0, -0.15, -14]);
  criarCaixa(scene, [18, 0.2, 46], obterMaterial("#a1a18a"), [0, 3.5, -14]);
  const pig = muralPeppa();
  for (const x of [-8.6, 8.6]) {
    criarCaixa(scene, [0.3, 3.5, 46], obterMaterial("#a19c8d"), [x, 1.7, -14]);
    for (let z = 5; z > -36; z -= 5) {
      placa(
        scene,
        pig,
        2.1,
        2.1,
        [x * 0.978, 1.6, z],
        x < 0 ? Math.PI / 2 : -Math.PI / 2,
      );
      criarCaixa(scene, [0.12, 0.15, 46], obterMaterial("#9a7378"), [
        x * 0.97,
        0.65,
        -14,
      ]);
    }
  }
  criarCaixa(scene, [6.2, 3.5, 8], obterMaterial("#aaa28c"), [0, 1.7, -14]);
  criarCaixa(scene, [18, 3.5, 0.25], obterMaterial("#aca592"), [0, 1.7, -37]);
  for (let z = 3; z > -35; z -= 6) {
    criarCaixa(
      scene,
      [2.5, 0.05, 0.35],
      new T.MeshBasicMaterial({ color: "#ccd8a8" }),
      [0, 3.32, z],
    );
    const l = new T.PointLight("#bbc990", 8, 12, 1.8);
    l.position.set(0, 3, z);
    scene.add(l);
  }
  const paineis = [];
  for (const [x, z, cor] of [
    [-6, -8, "#d282a1"],
    [6, -23, "#739b77"],
  ]) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    criarCaixa(g, [0.9, 1.5, 0.4], obterMaterial("#373d3c"), [0, 0.75, 0]);
    const led = criarCaixa(
      g,
      [0.6, 0.6, 0.03],
      new T.MeshBasicMaterial({ color: cor }),
      [0, 1, 0.22],
    );
    paineis.push(led);
    texto(g, "ENERGIA", 1.1, 0.25, [0, 1.8, 0.22]);
  }
  const door = criarCaixa(
    scene,
    [2.2, 3, 0.15],
    obterMaterial("#4c5345"),
    [0, 1.5, -35.8],
  );
  texto(scene, "COLINAS · SAÍDA", 3, 0.5, [0, 3, -35.65]);
  return { scene, paineis, door };
}
function texturaGrama() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#5d783c";
  g.fillRect(0, 0, 256, 256);
  let n = 729;
  for (let i = 0; i < 12000; i++) {
    n = (n * 1664525 + 1013904223) >>> 0;
    const x = n % 256;
    n = (n * 1664525 + 1013904223) >>> 0;
    const y = n % 256;
    g.fillStyle = i % 3 ? "#506b30" : "#829350";
    g.fillRect(x, y, 1, 2);
  }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(90, 90);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
function casa(scene, c, i) {
  const g = new T.Group();
  g.position.set(c.x, altura94(c.x, c.z), c.z);
  scene.add(g);
  const w = 10,
    h = 7,
    d = 9;
  criarCaixa(g, [w, h, d], obterMaterial(i % 2 ? "#e8dfb7" : "#e9e6ce"), [
    0,
    h / 2,
    0,
  ]);
  for (const side of [-1, 1])
    criarCaixa(
      g,
      [5.9, 0.2, d + 1],
      obterMaterial("#625248"),
      [side * 2.5, 8.5, 0],
      [0, 0, -side * 0.56],
    );
  const triangle = new T.Shape();
  triangle.moveTo(-5, 7);
  triangle.lineTo(0, 10.1);
  triangle.lineTo(5, 7);
  triangle.closePath();
  const face = new T.Mesh(
    new T.ShapeGeometry(triangle),
    obterMaterial("#e7dfc2"),
  );
  face.position.z = 4.52;
  g.add(face);
  for (const x of [-2.7, 2.7])
    for (const y of [2.5, 5.4]) {
      criarCaixa(g, [1.6, 1.8, 0.1], obterMaterial("#ece7d8"), [x, y, 4.6]);
      criarCaixa(
        g,
        [1.3, 1.5, 0.12],
        obterMaterial(c.principal ? "#65766b" : "#363e3d"),
        [x, y, 4.68],
      );
      criarCaixa(g, [0.08, 1.5, 0.05], obterMaterial("#e5e1c7"), [x, y, 4.77]);
      criarCaixa(g, [1.3, 0.08, 0.05], obterMaterial("#e5e1c7"), [x, y, 4.77]);
    }
  criarCaixa(
    g,
    [1.6, 2.8, 0.12],
    obterMaterial(c.principal ? "#415343" : "#a3a18d"),
    [0, 1.4, 4.65],
  );
  texto(
    g,
    c.principal ? "09" : String(i + 1).padStart(2, "0"),
    0.7,
    0.4,
    [0, 3.1, 4.75],
    "#b5ad92",
    "#253227",
  );
  if (c.principal) {
    const l = new T.PointLight("#b5a66a", 25, 16, 2);
    l.position.set(0, 2.5, 6);
    g.add(l);
    criarCaixa(g, [4, 0.12, 2], obterMaterial("#b2b09b"), [0, 0.05, 5.5]);
  }
  for (const side of [-1, 1])
    for (let k = 0; k < 14; k++) {
      const x = side * (2.2 + k * 0.46);
      criarCaixa(g, [0.12, 1.2, 0.12], obterMaterial("#e7e6cf"), [x, 0.6, 8]);
    }
  for (const x of [-4.8, 4.8])
    for (const y of [0.35, 0.8])
      criarCaixa(g, [5.7, 0.09, 0.09], obterMaterial("#e7e6cf"), [x, y, 8]);
  return g;
}
function mundo94() {
  const scene = new T.Scene();
  scene.background = new T.Color("#91a9be");
  scene.fog = new T.Fog("#91a9be", 70, 205);
  const hemi = new T.HemisphereLight("#d5e3ed", "#405133", 1.8);
  scene.add(hemi);
  const sol = new T.DirectionalLight("#f7efdb", 2.2);
  sol.position.set(-60, 120, 30);
  scene.add(sol);
  const geo = new T.PlaneGeometry(460, 460, 110, 110);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i) - 60;
    pos.setXYZ(
      i,
      x,
      altura94(x, z) +
        Math.max(0, Math.abs(x) - 25) * 0.05 +
        Math.sin(x * 0.025 + z * 0.019) * Math.max(0, Math.abs(x) - 30) * 0.035,
      z,
    );
  }
  geo.computeVertexNormals();
  scene.add(
    new T.Mesh(
      geo,
      new T.MeshPhongMaterial({ map: texturaGrama(), shininess: 1 }),
    ),
  );
  // Colinas arredondadas, repetição de casas e caixa-d'água seguem a referência do Level 94.
  for (let i = 0; i < 18; i++) {
    const x = (i % 2 ? 1 : -1) * (65 + (i % 4) * 20),
      z = 20 - i * 15;
    criarElipsoide(
      scene,
      [35, 12 + (i % 3) * 6, 40],
      obterMaterial("#667b42"),
      [x, -6, z],
    );
    if (i % 3 === 0) casa(scene, { x, z: z - 10 }, i);
  }
  CASAS94.forEach((c, i) => casa(scene, c, i));
  const road = new T.PlaneGeometry(6, 150, 1, 90);
  road.rotateX(-Math.PI / 2);
  const rp = road.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const z = rp.getZ(i) - 54;
    rp.setXYZ(i, rp.getX(i), altura94(rp.getX(i), z) + 0.03, z);
  }
  road.computeVertexNormals();
  scene.add(new T.Mesh(road, obterMaterial("#b2ac89")));
  for (const x of [-33, 13]) {
    const z = x < 0 ? -42 : -62,
      y = altura94(x, z);
    for (const side of [-1, 1])
      for (const d of [-1, 1])
        criarCilindro(scene, 0.12, 0.12, 13, obterMaterial("#bcc1b7"), [
          x + side * 1.8,
          y + 6.5,
          z + d * 1.8,
        ]);
    criarCilindro(scene, 2.8, 2.8, 4.5, obterMaterial("#d7d7cd"), [
      x,
      y + 14,
      z,
    ]);
    criarCilindro(scene, 0.25, 2.9, 1.5, obterMaterial("#c1c4bc"), [
      x,
      y + 17,
      z,
    ]);
  }
  const note = texto(
    scene,
    "CASA 09 · NÃO CONFIE EM ROSTOS",
    2.4,
    0.65,
    [-12, 1.6 + altura94(-12, -27), -27],
    "#d7cdad",
    "#3d4038",
  );
  criarCaixa(scene, [0.14, 1.8, 0.14], obterMaterial("#d8dac8"), [
    -12,
    0.9 + altura94(-12, -27),
    -27.2,
  ]);
  const chave = criarElipsoide(
    scene,
    [0.15, 0.05, 0.3],
    obterMaterial("#d6b862"),
    [13, 1 + altura94(13, -58), -58],
  );
  texto(
    scene,
    "09",
    1,
    0.5,
    [13, 1.6 + altura94(13, -58), -58],
    "#a8a688",
    "#242d22",
  );
  criarCaixa(scene, [1.5, 0.8, 1], obterMaterial("#a7a38d"), [
    13,
    0.4 + altura94(13, -58),
    -58,
  ]);
  const portal = new T.Group();
  portal.position.set(0, altura94(0, -114), -114);
  scene.add(portal);
  for (let x = -1.6; x <= 1.61; x += 0.8)
    for (let y = 0; y <= 4.81; y += 0.8)
      if (x < -1.5 || x > 1.5 || y < 0.1 || y > 4.7)
        criarCaixa(portal, [0.8, 0.8, 0.8], obterMaterial("#21182f", 0.9), [
          x,
          y,
          0,
        ]);
  const tex = document.createElement("canvas");
  tex.width = tex.height = 128;
  const cg = tex.getContext("2d");
  cg.fillStyle = "#5f1fa9";
  cg.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 70; i++) {
    cg.strokeStyle = i % 2 ? "#9a41df" : "#442077";
    cg.lineWidth = 3;
    cg.strokeRect((i * 2) % 128, (i * 11) % 128, 5 + (i % 30), 8 + (i % 25));
  }
  const pt = new T.CanvasTexture(tex);
  pt.wrapS = pt.wrapT = T.RepeatWrapping;
  const surf = placa(portal, pt, 2.6, 4.4, [0, 2.4, 0.06]);
  const pl = new T.PointLight("#9236df", 55, 18, 2);
  pl.position.set(0, 2.8, 1);
  portal.add(pl);
  const drops = new Float32Array(1800);
  for (let i = 0; i < drops.length; i += 3) {
    drops[i] = ((i % 71) - 35) * 1.6;
    drops[i + 1] = (i % 97) * 0.18;
    drops[i + 2] = -(i % 130);
  }
  const rg = new T.BufferGeometry();
  rg.setAttribute("position", new T.BufferAttribute(drops, 3));
  const chuva = new T.Points(
    rg,
    new T.PointsMaterial({
      color: "#b3bfca",
      size: 0.065,
      transparent: true,
      opacity: 0.5,
    }),
  );
  scene.add(chuva);
  return { scene, hemi, sol, note, chave, portal, pt, chuva };
}
function prepararSentado(mesh, altura) {
  const g = mesh.geometry.clone(),
    a = g.attributes.position;
  g.computeBoundingBox();
  const b = g.boundingBox,
    c = b.getCenter(new T.Vector3()),
    h = b.max.y - b.min.y,
    scale = altura / h;
  for (let i = 0; i < a.count; i++) {
    let x = (a.getX(i) - c.x) * scale,
      y = (a.getY(i) - b.min.y) * scale,
      z = (a.getZ(i) - c.z) * scale;
    if (y < altura * 0.43) {
      const hip = altura * 0.43,
        knee = altura * 0.24;
      if (y >= knee) {
        z += (hip - y) * 1.3;
        y = hip - (hip - y) * 0.08;
      } else {
        z += (hip - knee) * 1.3;
        y = hip - (knee - y) * 1.8;
      }
    } else if (
      Math.abs(x) > altura * 0.19 &&
      y > altura * 0.5 &&
      y < altura * 0.79
    ) {
      const side = Math.sign(x),
        px = side * altura * 0.18,
        py = altura * 0.68,
        angle = -side * 0.85,
        dx = x - px,
        dy = y - py;
      x = px + dx * Math.cos(angle) - dy * Math.sin(angle);
      y = py + dx * Math.sin(angle) + dy * Math.cos(angle);
    }
    a.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return new T.Mesh(g, mesh.material);
}
async function criarCasaFinal() {
  const [obj, bart, tex] = await Promise.all([
    new OBJLoader().loadAsync(pasta + "simpsons.obj"),
    new FBXLoader().loadAsync(pasta + "bart.fbx"),
    new T.TextureLoader().loadAsync(pasta + "simpsons_palette.png"),
  ]);
  tex.colorSpace = T.SRGBColorSpace;
  const mat = new T.MeshPhongMaterial({
    map: tex,
    side: T.DoubleSide,
    shininess: 8,
  });
  const scene = new T.Scene();
  scene.background = new T.Color("#050609");
  scene.fog = new T.Fog("#101117", 9, 28);
  scene.add(new T.HemisphereLight("#6a7190", "#382829", 0.8));
  const wallpaper = obterMaterial("#75654f");
  criarCaixa(scene, [12, 0.2, 13], obterMaterial("#302c34"), [0, -0.15, 0]);
  criarCaixa(scene, [12, 0.2, 13], obterMaterial("#a69b82"), [0, 4.5, 0]);
  for (const x of [-6, 6])
    criarCaixa(scene, [0.2, 4.5, 13], wallpaper, [x, 2.2, 0]);
  criarCaixa(scene, [12, 4.5, 0.2], wallpaper, [0, 2.2, -6]);
  for (const x of [-3.8, 3.8])
    criarCaixa(scene, [4.5, 4.5, 0.2], wallpaper, [x, 2.2, 6.5]);
  for (const x of [-5.85, 5.85])
    placa(
      scene,
      criarTexturaTexto("||||||||||||||||||||", "#78644d", "#847058", 512, 512),
      12,
      4,
      [x, 2.2, 0],
      x < 0 ? Math.PI / 2 : -Math.PI / 2,
    );
  criarCaixa(scene, [7.8, 0.8, 1.8], obterMaterial("#725244"), [0, 0.4, 0.6]);
  criarCaixa(scene, [7.8, 1.2, 0.3], obterMaterial("#62463c"), [0, 1.05, 1.35]);
  for (const x of [-4, 4])
    criarCaixa(scene, [0.3, 0.85, 1.8], obterMaterial("#66483c"), [
      x,
      0.8,
      0.6,
    ]);
  const family = [];
  obj.children.forEach((m, i) => {
    m.material = mat;
    const item = prepararSentado(m, [1.75, 2.08, 1.25, 1.1, 0.7][i]);
    item.position.set(
      -3.1 + i * 1.55,
      0.8 - [1.75, 2.08, 1.25, 1.1, 0.7][i] * 0.43,
      0.5,
    );
    item.rotation.y = Math.PI;
    scene.add(item);
    family.push(item);
  });
  // Bart fornecido com animação também aparece, diante da foto da família.
  bart.updateMatrixWorld(true);
  const bb = new T.Box3().setFromObject(bart),
    sc = 1.18 / (bb.max.y - bb.min.y);
  bart.scale.setScalar(sc);
  bart.position.set(4.7, -bb.min.y * sc, -1.8);
  bart.traverse((o) => {
    if (o.isMesh) {
      o.material = mat;
      o.frustumCulled = false;
    }
  });
  scene.add(bart);
  const mixer = new T.AnimationMixer(bart);
  if (bart.animations[0]) mixer.clipAction(bart.animations[0]).play();
  criarCaixa(scene, [3.5, 0.8, 1.1], obterMaterial("#302b29"), [0, 0.4, -4.6]);
  criarCaixa(scene, [3.7, 2.4, 0.3], obterMaterial("#13171c"), [0, 1.8, -4.4]);
  const video = document.createElement("video");
  video.src = pasta + "tv-trailer.mp4";
  video.preload = "auto";
  video.playsInline = true;
  video.muted = true;
  const vtex = new T.VideoTexture(video);
  vtex.colorSpace = T.SRGBColorSpace;
  const tela = placa(scene, vtex, 3.3, 1.86, [0, 1.8, -4.22]);
  tela.material.toneMapped = false;
  const news = document.createElement("canvas");
  news.width = 1024;
  news.height = 576;
  const fotoDavy = await new T.TextureLoader().loadAsync(
    new URL("assets/davy-jones.png", import.meta.url).href,
  );
  const ntex = new T.CanvasTexture(news);
  ntex.colorSpace = T.SRGBColorSpace;
  const light = new T.PointLight("#8b9fbd", 60, 15, 2);
  light.position.set(0, 2, -3.8);
  scene.add(light);
  texto(
    scene,
    "UM DIA DE CADA VEZ",
    2.2,
    0.4,
    [0, 3.4, 6.3],
    "#443b34",
    "#a59b82",
    Math.PI,
  );
  for (const x of [-5, 5]) {
    criarCaixa(scene, [0.12, 1.4, 1.8], obterMaterial("#222a35"), [x, 2, 0]);
    for (const z of [-0.9, 0.9])
      criarCaixa(scene, [0.12, 2.2, 0.6], obterMaterial("#5b3539"), [x, 2, z]);
  }
  const rainCanvas = document.createElement("canvas");
  rainCanvas.width = 128;
  rainCanvas.height = 256;
  const rc = rainCanvas.getContext("2d");
  rc.fillStyle = "#101824";
  rc.fillRect(0, 0, 128, 256);
  rc.strokeStyle = "#8597a477";
  for (let i = 0; i < 60; i++) {
    const x = (i * 71) % 128,
      y = (i * 31) % 256;
    rc.beginPath();
    rc.moveTo(x, y);
    rc.lineTo(x - 4, y + 14);
    rc.stroke();
  }
  const rainTex = new T.CanvasTexture(rainCanvas);
  rainTex.wrapT = T.RepeatWrapping;
  const janelas = [];
  for (const x of [-5.8, 5.8])
    janelas.push(
      placa(
        scene,
        rainTex,
        1.8,
        1.4,
        [x, 2, 0],
        x < 0 ? Math.PI / 2 : -Math.PI / 2,
      ),
    );
  const davy = criarDavyJones();
  const portrait = new T.Scene();
  portrait.background = new T.Color("#1b2b44");
  portrait.add(davy.group);
  portrait.add(new T.HemisphereLight("#dae8fb", "#526472", 3));
  const dc = new T.PerspectiveCamera(35, 1, 0.1, 20);
  dc.position.set(0, 1.5, 4);
  dc.lookAt(0, 1.3, 0);
  const target = new T.WebGLRenderTarget(256, 256);
  return {
    scene,
    family,
    bart,
    mixer,
    video,
    vtex,
    tela,
    news,
    ntex,
    fotoDavy,
    rainTex,
    janelas,
    light,
    portrait,
    dc,
    target,
    davy,
  };
}
function estrada() {
  const scene = new T.Scene();
  scene.background = new T.Color("#394951");
  scene.fog = new T.Fog("#394951", 50, 180);
  scene.add(new T.HemisphereLight("#b2c1cd", "#4c4835", 1.8));
  const sun = new T.DirectionalLight("#e6d1aa", 2);
  sun.position.set(-20, 35, -40);
  scene.add(sun);
  criarCaixa(scene, [50, 0.2, 180], obterMaterial("#4d5a41"), [0, -0.2, -65]);
  criarCaixa(scene, [10, 0.12, 160], obterMaterial("#30393b"), [0, -0.08, -65]);
  for (let z = 5; z > -141; z -= 6) {
    criarCaixa(scene, [0.12, 0.02, 2], obterMaterial("#d6cda5"), [0, 0.01, z]);
    for (const x of [-5.5, 5.5])
      criarCilindro(scene, 0.055, 0.055, 0.9, obterMaterial("#a7ada2"), [
        x,
        0.45,
        z,
      ]);
  }
  for (const [i, z] of [-30, -65, -100].entries()) {
    texto(
      scene,
      "BRITA → " + (3 - i) + "00 m",
      3,
      0.8,
      [4.7, 2.4, z],
      "#234962",
      "#e0e6d5",
    );
    criarCilindro(scene, 0.06, 0.06, 2.4, obterMaterial("#8d9998"), [
      4.7,
      1.2,
      z - 0.1,
    ]);
  }
  for (let i = 0; i < 28; i++) {
    const x = (i % 2 ? 1 : -1) * (10 + (i % 5) * 2),
      z = 10 - i * 6;
    criarElipsoide(
      scene,
      [4 + (i % 3), 3 + (i % 4), 5],
      obterMaterial("#565e58"),
      [x, 1, z],
    );
  }
  const brita = criarPessoa();
  brita.group.position.set(0, 0, -133);
  scene.add(brita.group);
  texto(scene, "BRITA", 2, 0.4, [0, 2.6, -133]);
  const axel = criarAxel();
  scene.add(axel.group);
  const biz = criarBiz();
  scene.add(biz.group);
  return { scene, brita, axel, biz };
}
export async function criarCapituloFinal(arc) {
  const casa = await criarCasaFinal(),
    peppa = corredor(),
    level = mundo94(),
    rua = estrada(),
    clay = arc.mercado.clay.clone(true);
  clay.name = "Clayface_revelado";
  clay.visible = false;
  arc.sala.scene.add(clay);
  const entidade = arc.mercado.clay.clone(true);
  entidade.scale.set(1.4, 1.85, 1.4);
  level.scene.add(entidade);
  const brecha = new T.Group();
  brecha.position.set(-12.78, 0, 13);
  arc.sala.scene.add(brecha);
  brecha.visible = false;
  criarCaixa(
    brecha,
    [0.08, 2.6, 2.3],
    new T.MeshBasicMaterial({ color: "#514c31" }),
    [0, 1.3, 0],
  );
  texto(
    brecha,
    "PASSAGEM DE SERVIÇO",
    2,
    0.3,
    [0.09, 3.0, 0],
    "#252320",
    "#aea483",
    Math.PI / 2,
  );
  const bl = new T.PointLight("#bd975a", 15, 6, 1.5);
  bl.intensity = 0;
  bl.position.set(-11.5, 1, 13);
  arc.sala.scene.add(bl);
  const maos = new T.Group();
  for (const side of [-1, 1]) {
    criarElipsoide(maos, [0.09, 0.16, 0.08], obterMaterial("#c79a75"), [
      side * 0.21,
      -0.28,
      -0.5,
    ]);
    criarCaixa(
      maos,
      [0.14, 0.32, 0.16],
      obterMaterial("#b95e20"),
      [side * 0.23, -0.55, -0.48],
      [0.1, 0, side * 0.12],
    );
    for (let i = 0; i < 4; i++)
      criarElipsoide(maos, [0.025, 0.07, 0.03], obterMaterial("#c79a75"), [
        side * 0.17,
        -0.2 + i * 0.035,
        -0.43,
      ]);
  }
  const malhaChave = criarElipsoide(
    arc.lua.praia?.scene || rua.scene,
    [0.06, 0.025, 0.2],
    obterMaterial("#d0b36d"),
    [0, 0, 0],
  ); // Reposicionada no retorno.
  for (const s of [
    peppa.scene,
    level.scene,
    casa.scene,
    rua.scene,
    arc.sala.scene,
  ])
    converter(s);
  return {
    animarClay: animacaoDeMalha(clay),
    animarEntidade: animacaoDeMalha(entidade),
    animarFamilia: casa.family.map((m) => animacaoDeMalha(m)),
    arc,
    peppa,
    level,
    casa,
    rua,
    clay,
    entidade,
    brecha,
    bl,
    malhaChave,
    maos,
  };
}
function imagemNoticia(c, f) {
  const g = c.news.getContext("2d");
  g.fillStyle = "#0d2349";
  g.fillRect(0, 0, 1024, 576);
  g.fillStyle = "#af253b";
  g.fillRect(0, 0, 1024, 64);
  g.fillStyle = "#fff";
  g.font = "bold 28px sans-serif";
  g.fillText("PLANTÃO · FICÇÃO / PARÓDIA DO JOGO", 30, 43);
  g.font = "bold 42px sans-serif";
  g.fillText("LUTO NESTE UNIVERSO", 38, 160);
  g.font = "30px sans-serif";
  g.fillText("Davy Jones morreu após saber", 38, 240);
  g.fillText("do novo adiamento de GTA 6.", 38, 285);
  g.fillStyle = "#a7bfd7";
  g.font = "23px sans-serif";
  g.fillText("Cena fictícia. Não é uma notícia real.", 38, 420);
  g.fillText("Os moradores permanecem em silêncio.", 38, 463);
  if (c.fotoDavy?.image) {
    g.drawImage(c.fotoDavy.image, 770, 125, 210, 280);
    g.fillStyle = "#10243a";
    g.fillRect(750, 405, 264, 45);
    g.fillStyle = "#d7dce7";
    g.font = "bold 21px sans-serif";
    g.fillText("DAVY JONES · FICÇÃO", 758, 434);
  }
  c.ntex.needsUpdate = true;
}
export function atualizarMidiaFinal(c, f, ativo, volume = 0) {
  const v = c.casa.video,
    e = f?.etapa,
    filme = ["casaTrailer", "casaPlantao"].includes(e);
  if (!ativo || !filme) {
    v.pause();
    return;
  }
  const src =
    pasta + (e === "casaTrailer" ? "tv-trailer.mp4" : "tv-plantao.mp4");
  if (v.src !== src) {
    v.pause();
    v.src = src;
    v.load();
  }
  const time = f.tempo;
  if (Number.isFinite(v.duration) && Math.abs(v.currentTime - time) > 0.45)
    v.currentTime = Math.min(time, v.duration - 0.05);
  v.muted = volume <= 0;
  v.volume = Math.min(1, volume);
  if (v.paused && !v.ended) v.play().catch(() => {});
}
export function desenharCapituloFinal(view, c, f, estado) {
  c.animarClay(f.animacao, 1);
  c.animarEntidade(f.animacao, 1.7);
  c.animarFamilia.forEach((animar) => animar(f.animacao, 0.12));
  const e = f.etapa,
    t = f.tempo,
    p = f.jogador,
    a = f.final,
    cam = view.camera;
  let scene;
  const sala = ["clayRevela", "cinemaEscapar", "clayCaptura"].includes(e),
    casa = e.startsWith("casa");
  if (sala) {
    scene = c.arc.sala.scene;
    c.arc.sala.escondido.group.visible = e === "clayRevela" && t < 5;
    c.arc.sala.screen.material.map = c.arc.imagens["resultado-eleicao"];
    c.clay.visible = true;
    c.brecha.visible = true;
    c.bl.intensity = 18;
    const q =
      e === "clayRevela"
        ? { x: -6.4 + Math.min(t / 8, 1) * 3, z: 7 - Math.min(t / 8, 1) * 4 }
        : a.perseguidor;
    c.clay.position.set(
      q.x,
      Math.max(0, Math.floor((q.z + 9.25) / 2.5)) * 0.22,
      q.z,
    );
    c.clay.rotation.y = Math.atan2(p.x - q.x, p.z - q.z);
    c.clay.scale.setScalar(
      e === "clayRevela" ? 0.2 + Math.min(1, t / 7) * 0.8 : 1,
    );
    c.clay.position.y += Math.sin(f.animacao * 10) * 0.05;
  } else if (e.startsWith("peppa")) scene = c.peppa.scene;
  else if (casa) scene = c.casa.scene;
  else if (["retornoBiz", "telefoneBiz", "ligacaoBrita"].includes(e)) {
    scene = view.dungeon.scene;
    view.dungeon.brita.group.visible = false;
    view.dungeon.biz.group.position.set(-4, 0, -6);
    view.dungeon.biz.group.rotation.y = 0.55;
    if (c.malhaChave.parent !== scene) scene.add(c.malhaChave);
    c.malhaChave.position.set(-6, 1, 2);
    c.malhaChave.visible = !a.chaveBiz;
    textoRetorno(view, c);
  } else if (["viagemBiz", "entregaBiz", "fimJogo"].includes(e))
    scene = c.rua.scene;
  else scene = c.level.scene;
  cam.position.set(p.x, (p.y || 0) + 1.58, p.z);
  cam.rotation.set(p.pitch, p.yaw, 0, "YXZ");
  if (f.movendo)
    cam.position.y += Math.sin(f.animacao * (f.correndo ? 12 : 8)) * 0.025;
  if (e === "clayRevela") {
    cam.position.set(0, 3.5, 11);
    cam.lookAt(c.clay.position.x, 2.6, c.clay.position.z);
  }
  if (e === "peppaEntrada") {
    cam.position.set(0, 1.6, 6 - t * 0.3);
    cam.lookAt(Math.sin(t * 0.4) * 4, 1.5, -20);
  }
  if (e === "level94Chegada") {
    cam.position.set(0, 2.2, 5 - t * 0.5);
    cam.lookAt(Math.sin(t * 0.17) * 15, 3, -70);
  }
  if (e === "level94Olhar") {
    cam.position.set(p.x, altura94(p.x, p.z) + 1.6, p.z);
    cam.lookAt(p.x, 2, p.z + 70 - t * 4);
    c.entidade.position.set(
      p.x,
      altura94(p.x, p.z + 70 - t * 4),
      p.z + 70 - t * 4,
    );
    c.entidade.rotation.y = Math.PI;
  }
  if (["level94Fuga", "level94Captura"].includes(e)) {
    c.entidade.position.set(
      a.perseguidor.x,
      altura94(a.perseguidor.x, a.perseguidor.z),
      a.perseguidor.z,
    );
    c.entidade.rotation.y = Math.atan2(
      p.x - a.perseguidor.x,
      p.z - a.perseguidor.z,
    );
    c.entidade.position.y += Math.abs(Math.sin(f.animacao * 9)) * 0.2;
  }
  c.entidade.visible = [
    "level94Olhar",
    "level94Fuga",
    "level94Captura",
  ].includes(e);
  if (e === "casaEntrada") {
    const u = Math.min(1, t / 7);
    cam.position.set(-4.7 * u, 1.9, 4.5 - 6 * u);
    cam.lookAt(-0.4, 1.5, 0.5);
  }
  if (casa) {
    const cc = c.casa;
    cc.bart.visible = e === "casaPlantao" && t > 8 && t < 10;
    cc.janelas.forEach(
      (j) => (j.visible = ["casaLuto", "casaSaida"].includes(e)),
    );
    cc.rainTex.offset.y = f.animacao * 0.8;
    cc.mixer.setTime(
      ["casaPlantao", "casaNoticia", "casaLuto", "casaSaida"].includes(e)
        ? 0
        : f.animacao * 0.15,
    );
    cc.family.forEach((m, i) => {
      m.rotation.z = ["casaLuto", "casaSaida"].includes(e)
        ? -0.05
        : Math.sin(f.animacao * 0.25 + i) * 0.008;
    });
    if (["casaTrailer", "casaPlantao"].includes(e))
      cc.tela.material.map = cc.vtex;
    else {
      imagemNoticia(cc, f);
      cc.tela.material.map = cc.ntex;
    }
    if (["casaExplorar", "casaEntrada"].includes(e)) {
      const g = cc.news.getContext("2d");
      g.fillStyle = "#1c2938";
      g.fillRect(0, 0, 1024, 576);
      for (let i = 0; i < 170; i++) {
        g.fillStyle = i % 2 ? "#47505b" : "#131c27";
        g.fillRect((i * 137) % 1024, (i * 91) % 576, 80, 3);
      }
      cc.ntex.needsUpdate = true;
    }
    cc.light.intensity = 45 + Math.sin(f.animacao * 7) * 5;
  }
  c.level.note.visible = !a.bilhete;
  c.level.chave.visible = !a.chaveCasa;
  c.level.portal.visible = e.startsWith("portal");
  c.level.pt.offset.y = f.animacao * 0.07;
  c.level.portal.scale.setScalar(
    e === "portalAbertura" ? Math.min(1, t / 6) : 1,
  );
  c.level.chuva.visible =
    e.startsWith("portal") || ["casaLuto", "casaSaida"].includes(e);
  if (c.level.chuva.visible) {
    const pos = c.level.chuva.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++)
      pos.setY(i, ((i * 0.13 - f.animacao * 8) % 18) + 18);
    pos.needsUpdate = true;
    c.level.scene.background.set("#5a6970");
    c.level.scene.fog.color.set("#5a6970");
    c.level.sol.intensity = 0.55;
  }
  if (e === "portalAbertura") {
    cam.position.set(0, altura94(0, -105) + 1.6, -104);
    cam.lookAt(0, 2, -114);
  }
  if (e === "viagemBiz") {
    c.rua.biz.group.position.set(p.x, 0, p.z);
    c.rua.biz.group.rotation.y = p.yaw + Math.PI;
    c.rua.biz.wheels.forEach(
      (w) => (w.rotation.x = -f.animacao * (f.movendo ? 14 : 0)),
    );
    c.rua.axel.group.visible = false;
    cam.position.set(p.x, 1.5, p.z + 0.2);
    cam.rotation.set(p.pitch, p.yaw, 0, "YXZ");
  }
  if (["entregaBiz", "fimJogo"].includes(e)) {
    c.rua.biz.group.position.set(1.4, 0, -131);
    c.rua.biz.group.rotation.y = -0.5;
    c.rua.axel.group.visible = true;
    c.rua.axel.group.position.set(-1.3, 0, -132);
    c.rua.axel.group.rotation.y = 0.8;
    c.rua.brita.group.rotation.y = -0.7;
    c.rua.brita.arms[0].rotation.x = -0.5;
    cam.position.set(4.8, 2.3, -126);
    cam.lookAt(0, 1.2, -132);
  }
  if (["clayCaptura", "level94Captura"].includes(e)) {
    cam.rotation.z = Math.sin(t * 32) * 0.07;
  }
  if (sala) {
    c.arc.sala.lanterna.position.copy(cam.position);
    c.arc.sala.lanterna.target.position
      .copy(cam.position)
      .add(cam.getWorldDirection(new T.Vector3()).multiplyScalar(10));
    c.arc.sala.lanterna.intensity = f.arcoplex.lanterna ? 30 : 0;
  }
  c.maos.visible = false; // Replaced by the supplied orange FPS arms in the shared overlay.
  if (c.maos.visible) {
    if (c.maos.parent !== scene) scene.add(c.maos);
    c.maos.position
      .copy(cam.position)
      .add(new T.Vector3(0, -0.12, -0.25).applyQuaternion(cam.quaternion));
    c.maos.quaternion.copy(cam.quaternion);
  }
  cam.fov = f.correndo ? 79 : 70;
  cam.far = 400;
  cam.updateProjectionMatrix();
  view.renderer.toneMappingExposure = 1.3;
  view.renderer.render(scene, cam);
}
function textoRetorno(view, c) {
  if (c.rotuloBiz) return;
  c.rotuloBiz = true;
  texto(view.dungeon.scene, "CHAVE DA BIZ", 2, 0.35, [-6, 1.9, 2]);
  criarCaixa(
    view.dungeon.scene,
    [1.3, 0.8, 0.8],
    obterMaterial("#62583d"),
    [-6, 0.4, 2],
  );
  converter(view.dungeon.scene);
}
