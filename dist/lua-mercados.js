import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  obterMaterial,
  criarTexturaTexto,
} from "./modelos.js";
import { criarPessoa } from "./personagens.js";
import { criarVisitante } from "./personagens-castelo.js";

const pasta = new URL("assets/lua/", import.meta.url).href;
const suave = (x) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};
const lerp = T.MathUtils.lerp;
function placa(parent, textura, w, h, pos) {
  const m = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({ map: textura, side: T.DoubleSide }),
  );
  m.position.set(...pos);
  parent.add(m);
  return m;
}
function loja(scene, nome, imagens) {
  const g = new T.Group();
  scene.add(g);
  g.position.set(0, 0, -18);
  const kom = nome === "komprao",
    branco = obterMaterial("#e7e8e6"),
    vermelho = obterMaterial(kom ? "#bd0730" : "#c71216");
  criarCaixa(g, [44, 7.8, 18], branco, [0, 3.9, -9.5]);
  criarCaixa(
    g,
    [45, 0.35, 19],
    obterMaterial("#b9bfca", 0.38, 0.35),
    [0, 7.9, -9.5],
  );
  criarCaixa(g, [45, 1.1, 0.25], vermelho, [0, 6.5, 0]);
  // Fotografia original na frente, com UV correspondente à fachada e à entrada.
  const foto = imagens[nome + "-fachada"].clone();
  foto.needsUpdate = true;
  foto.repeat.set(1, kom ? 0.56 : 0.55);
  foto.offset.set(0, kom ? 0.22 : 0.23);
  placa(g, foto, 44, 7.6, [0, 3.9, 0.16]);
  if (kom) {
    const lateral = placa(
      g,
      imagens["komprao-entrada"],
      16,
      7.75,
      [22.1, 3.9, -8.5],
    );
    lateral.rotation.y = Math.PI / 2;
  }
  const logo = placa(g, imagens[nome + "-logo"], kom ? 13 : 8, kom ? 4.1 : 8, [
    kom ? 0 : 11,
    kom ? 7 : 6,
    0.28,
  ]);
  if (!kom) logo.scale.set(0.83, 0.83, 1);
  const toldo = criarCaixa(
    g,
    [45, 0.35, 4.2],
    kom ? branco : vermelho,
    [0, 4.2, 1.1],
  );
  toldo.rotation.z = kom ? 0 : -0.012;
  for (const x of [-20, -12, 12, 20])
    criarCilindro(g, 0.1, 0.13, 4.1, obterMaterial("#dedde2"), [x, 2.05, 2.5]);
  // Totem, estacionamento e faixas seguem os elementos das fotos anexadas.
  criarCilindro(g, 0.22, 0.25, 9, branco, [-24, 4.5, 6]);
  placa(g, imagens[nome + "-logo"], kom ? 9 : 5, kom ? 4 : 5, [-24, 9, 6.25]);
  criarCaixa(g, [58, 0.08, 36], obterMaterial("#343744"), [0, -0.07, 15]);
  for (let i = 0; i < 12; i++)
    criarCaixa(g, [0.09, 0.015, 5], branco, [-24 + i * 4.4, 0.005, 18]);
  for (let i = 0; i < 8; i++) {
    const c = new T.Group();
    g.add(c);
    c.position.set((i < 4 ? -1 : 1) * (10 + (i % 4) * 4.3), 0.02, 20);
    const cor = obterMaterial(
      ["#e8edf2", "#323a48", "#ad2635", "#b6c5ce"][i % 4],
      0.25,
      0.35,
    );
    criarCaixa(c, [1.9, 0.75, 3.6], cor, [0, 0.65, 0]);
    criarCaixa(
      c,
      [1.65, 0.65, 1.8],
      obterMaterial("#162b3b", 0.16, 0.45),
      [0, 1.3, -0.2],
    );
    for (const x of [-0.9, 0.9])
      for (const z of [-1.1, 1.1])
        criarCilindro(
          c,
          0.31,
          0.31,
          0.2,
          obterMaterial("#101318"),
          [x, 0.35, z],
          [0, 0, Math.PI / 2],
        );
  }
  for (const x of [-18, 18])
    placa(g, imagens[nome + "-jornal"], 1.7, 2.3, [x, 2, 0.4]);
  return g;
}
function planeta(scene, imagem, raio, cor) {
  const g = new T.Group();
  scene.add(g);
  criarElipsoide(g, [raio, raio, raio], obterMaterial(cor, 0.9), [0, 0, 0]);
  const face = new T.Mesh(
    new T.CircleGeometry(raio * 0.94, 80),
    new T.MeshBasicMaterial({ map: imagem }),
  );
  face.position.z = raio * 1.005;
  g.add(face);
  return g;
}
function jornalNaMao(h, textura) {
  const g = new T.Group();
  h.cotovelos[1].add(g);
  g.position.set(0, -0.3, 0.11);
  g.rotation.x = -0.65;
  placa(g, textura, 0.32, 0.43, [0, 0, 0]);
  return g;
}
function vendedor(scene, imagens, nome) {
  const kom = nome === "komprao";
  const h = criarVisitante({
    arquivo: pasta + "vendedor.png",
    recorte: [400, 69, 196, 245, 1000, 750],
    camisa: kom ? "#f3f2f0" : "#c61d25",
    pele: "#ba8968",
    cabelo: "#26211f",
  });
  scene.add(h.group);
  h.group.position.set(0, 0, 4);
  for (const lado of [-1, 1]) {
    criarCaixa(
      h.body,
      [0.075, 0.025, 0.16],
      obterMaterial(kom ? "#163761" : "#f4bc39"),
      [lado * 0.085, 1.54, 0.11],
      [0, 0, lado * 0.6],
    );
    criarCaixa(
      h.arms[lado === -1 ? 0 : 1],
      [0.135, 0.025, 0.13],
      obterMaterial("#143459"),
      [0, -0.16, 0],
    );
  }
  placa(h.body, imagens[nome + "-logo"], 0.16, 0.08, [0.1, 1.36, 0.139]);
  const cracha = placa(
    h.body,
    imagens[nome + "-logo"],
    0.11,
    0.16,
    [0, 1.13, 0.145],
  );
  criarCaixa(
    h.body,
    [0.014, 0.36, 0.01],
    obterMaterial("#22496e"),
    [0, 1.38, 0.145],
  );
  h.papel = jornalNaMao(h, imagens[nome + "-jornal"]);
  h.group.name = "Vendedor_" + nome;
  return h;
}
export async function criarCenasLua(praia) {
  const nomes = [
    "preceiro-logo",
    "preceiro-fachada",
    "preceiro-jornal",
    "komprao-logo",
    "komprao-fachada",
    "komprao-entrada",
    "komprao-jornal",
  ];
  const imagens = Object.fromEntries(
    await Promise.all(
      nomes.map(async (n) => {
        const t = await new T.TextureLoader().loadAsync(pasta + n + ".png");
        t.colorSpace = T.SRGBColorSpace;
        t.anisotropy = 4;
        return [n, t];
      }),
    ),
  );
  const scene = new T.Scene();
  scene.background = new T.Color("#03030b");
  scene.add(new T.HemisphereLight("#c9ddff", "#4c4055", 1.5));
  const sol = new T.DirectionalLight("#fff3db", 2.5);
  sol.position.set(-50, 70, 35);
  scene.add(sol);
  const geo = new T.PlaneGeometry(400, 400, 96, 96);
  geo.rotateX(-Math.PI / 2);
  const positions = geo.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i),
      fora = suave((Math.hypot(x, z) - 45) / 20);
    positions.setY(
      i,
      (Math.sin(x * 0.15) * Math.cos(z * 0.17) * 1.2 +
        Math.sin(x * 0.53 + z * 0.2) * 0.3) *
        fora,
    );
  }
  geo.computeVertexNormals();
  scene.add(new T.Mesh(geo, obterMaterial("#b1b1b9", 1)));
  for (let i = 0; i < 40; i++) {
    const a = i * 2.399,
      r = 50 + (i % 7) * 12;
    const aro = new T.Mesh(
      new T.TorusGeometry(2 + (i % 5), 0.25, 6, 36),
      obterMaterial("#91929b", 1),
    );
    aro.rotation.x = -Math.PI / 2;
    aro.position.set(Math.cos(a) * r, 0.12, Math.sin(a) * r);
    scene.add(aro);
  }
  const stars = [];
  for (let i = 0; i < 1800; i++) {
    const a = i * 2.399,
      y = 1 - (2 * (i + 0.5)) / 1800,
      r = Math.sqrt(1 - y * y);
    stars.push(Math.cos(a) * r * 350, y * 350, Math.sin(a) * r * 350);
  }
  const estrelas = new T.BufferGeometry();
  estrelas.setAttribute("position", new T.Float32BufferAttribute(stars, 3));
  scene.add(
    new T.Points(
      estrelas,
      new T.PointsMaterial({
        color: "#d9e7ff",
        size: 0.42,
        sizeAttenuation: true,
      }),
    ),
  );
  const terra = new T.Group();
  scene.add(terra);
  terra.position.set(-55, 38, -125);
  criarElipsoide(
    terra,
    [14, 14, 14],
    obterMaterial("#146dc0", 0.45),
    [0, 0, 0],
  );
  for (let i = 0; i < 8; i++)
    criarElipsoide(terra, [2 + (i % 3), 3, 1.2], obterMaterial("#64b36b"), [
      Math.sin(i * 2) * 7,
      Math.cos(i * 2) * 8,
      11,
    ]);
  const preceiro = loja(scene, "preceiro", imagens),
    komprao = loja(scene, "komprao", imagens);
  const luaPreceiro = planeta(scene, imagens["preceiro-logo"], 19, "#8e1519");
  luaPreceiro.position.set(-30, 31, -100);
  const luaKomprao = planeta(scene, imagens["komprao-logo"], 36, "#9da6b6");
  const vendedorPreceiro = vendedor(scene, imagens, "preceiro"),
    vendedorKomprao = vendedor(scene, imagens, "komprao");
  const bruno = criarVisitante({
    arquivo: "assets/bruno-henrique.png",
    recorte: [152, 26, 226, 300, 500, 500],
    camisa: "#d62727",
    pele: "#875638",
    cabelo: "#1b1b18",
  });
  const brita = criarPessoa();
  brita.group.name = "Brita";
  brita.animate = (t, velocidade = 0) => {
    brita.legs.forEach(
      (p, i) =>
        (p.rotation.x =
          Math.sin(t * 9 + i * Math.PI) * Math.min(0.6, velocidade * 0.18)),
    );
    brita.arms.forEach(
      (p, i) =>
        (p.rotation.x =
          -Math.sin(t * 9 + i * Math.PI) * Math.min(0.5, velocidade * 0.15)),
    );
  };
  const rotulo = placa(
    brita.group,
    criarTexturaTexto("BRITA", "#29203c", "#fff", 512, 96),
    1.3,
    0.24,
    [0, 2.1, 0],
  );
  const membros = [
    praia.axel,
    praia.nav,
    bruno,
    praia.bob,
    praia.alya,
    praia.jonesy,
  ];
  const papeis = [...membros, brita].map(() => new T.Group());
  for (const g of papeis) {
    scene.add(g);
    placa(g, imagens["preceiro-jornal"], 0.33, 0.44, [0, 0, 0]);
  }
  const rig = new T.Group();
  scene.add(rig);
  const folha = placa(
    rig,
    imagens["preceiro-jornal"],
    0.605,
    0.76,
    [0, -0.02, -1.2],
  );
  const maoMat = obterMaterial("#ef8a20", 0.36);
  for (const lado of [-1, 1]) {
    criarElipsoide(
      rig,
      [0.045, 0.072, 0.032],
      maoMat,
      [lado * 0.31, -0.27, -1.17],
      [0, 0, -lado * 0.2],
    );
    criarCilindro(
      rig,
      0.032,
      0.045,
      0.3,
      maoMat,
      [lado * 0.33, -0.43, -1.1],
      [0, 0, lado * 0.14],
    );
  }
  const explosao = new T.Group();
  scene.add(explosao);
  const claro = new T.MeshBasicMaterial({
    color: "#ffc35a",
    transparent: true,
    opacity: 0.9,
  });
  const flash = criarElipsoide(explosao, [1, 1, 1], claro, [0, 3, -14]);
  const destrocos = [];
  for (let i = 0; i < 65; i++) {
    const m = criarCaixa(
      explosao,
      [0.3 + (i % 4) * 0.4, 0.2 + (i % 3) * 0.25, 0.3],
      obterMaterial(i % 3 ? "#b22926" : "#e9ddd0"),
      [0, 0, 0],
    );
    destrocos.push({
      m,
      v: new T.Vector3(
        Math.sin(i * 2.399) * (7 + (i % 6)),
        6 + (i % 9),
        Math.cos(i * 2.399) * (5 + (i % 7)),
      ),
    });
  }
  const brilho = new T.PointLight("#ffaa55", 0, 90);
  brilho.position.set(0, 8, -14);
  scene.add(brilho);
  // Material com brilho por pixel e menos variantes que o PBR, inclusive nas
  // malhas FBX. As fotos e os jornais permanecem sem alteração de cores.
  const materiais = new Map();
  for (const raiz of [scene, ...membros.map((p) => p.group), brita.group])
    raiz.traverse((o) => {
      if (!o.isMesh) return;
      const converter = (m) => {
        if (!m.isMeshStandardMaterial) return m;
        if (!materiais.has(m))
          materiais.set(
            m,
            new T.MeshPhongMaterial({
              color: m.color,
              map: m.map,
              side: m.side,
              transparent: m.transparent,
              opacity: m.opacity,
              alphaTest: m.alphaTest,
              shininess: 24,
              specular: new T.Color("#403c38"),
            }),
          );
        return materiais.get(m);
      };
      o.material = Array.isArray(o.material)
        ? o.material.map(converter)
        : converter(o.material);
    });
  return {
    scene,
    praia,
    imagens,
    preceiro,
    komprao,
    luaPreceiro,
    luaKomprao,
    vendedorPreceiro,
    vendedorKomprao,
    brita,
    membros,
    papeis,
    rig,
    folha,
    explosao,
    flash,
    destrocos,
    brilho,
  };
}
function animar(p, t, energia = 0) {
  p.animate?.(t, energia);
  p.head && (p.head.rotation.y = Math.sin(t * 2) * 0.06);
}
export function desenharCenasLua(view, c, f) {
  document.getElementById("voleiSprites").hidden = true;
  const etapa = f.etapa,
    t = f.tempo,
    global = f.animacao,
    cam = view.camera;
  const praia = ["britaChegada", "britaDiscussao"].includes(etapa),
    voando = etapa === "viagemLua";
  const scene = praia ? c.praia.scene : c.scene;
  if (praia) {
    c.praia.agua.material.uniforms.tempo.value = global;
    c.praia.bola.visible = false;
    c.praia.alvo.visible = false;
  }
  for (const p of [...c.membros, c.brita]) {
    if (p.group.parent !== scene) scene.add(p.group);
    p.group.visible = true;
    p.group.scale.setScalar(1);
    p.group.rotation.set(0, 0, 0);
  }
  c.rig.visible = false;
  c.explosao.visible = false;
  c.brilho.intensity = 0;
  c.preceiro.visible = [
    "luaChegada",
    "preceiroJornais",
    "preceiroLeitura",
    "kompraoChegada",
  ].includes(etapa);
  c.komprao.visible = ["kompraoJornais", "kompraoLeitura", "fimLua"].includes(
    etapa,
  );
  c.luaPreceiro.visible = c.preceiro.visible;
  c.luaKomprao.visible = [
    "kompraoChegada",
    "preceiroExplosao",
    "kompraoJornais",
    "kompraoLeitura",
    "fimLua",
  ].includes(etapa);
  c.vendedorPreceiro.group.visible = [
    "preceiroJornais",
    "preceiroLeitura",
  ].includes(etapa);
  c.vendedorKomprao.group.visible = [
    "kompraoJornais",
    "kompraoLeitura",
    "fimLua",
  ].includes(etapa);
  for (const v of [c.vendedorPreceiro, c.vendedorKomprao]) {
    v.group.position.set(0, 0, 4);
    v.group.rotation.y = 0;
    v.arms[1].rotation.x = -1.2 - Math.sin(global * 3) * 0.08;
    v.cotovelos[1].rotation.x = -0.45;
    v.head.rotation.y = Math.sin(global) * 0.12;
  }
  c.papeis.forEach((p) => (p.visible = false));
  const lugares = [
    [-3.2, 1],
    [-1.4, 0.2],
    [0.5, 1],
    [2.7, 0.2],
    [4.6, 1],
    [6.6, 0.2],
  ];
  c.membros.forEach((p, i) => {
    animar(p, global, 0.08);
    p.group.position.set(lugares[i][0], 0, lugares[i][1]);
    p.group.rotation.y = Math.PI;
  });
  c.brita.group.position.set(-5, 0, -1);
  animar(c.brita, global, 0.1);
  if (praia) {
    if (etapa === "britaChegada") {
      const u = 0.5 - 0.5 * Math.cos(Math.min(1, t / 4.8) * Math.PI);
      c.brita.group.position.set(
        lerp(-25, 10, u),
        Math.abs(Math.sin(t * 14)) * 0.13,
        0,
      );
      c.brita.group.rotation.y = Math.PI / 2;
      animar(c.brita, global, 3);
      c.membros.forEach((p, i) => {
        const contato =
          (Math.acos(1 - 2 * ((lugares[i][0] + 25) / 35)) / Math.PI) * 4.8;
        const k = t - contato;
        if (k > 0) {
          const a = Math.min(1, k / 1.7);
          p.group.position.y = Math.sin(a * Math.PI) * 2.3;
          p.group.position.z += Math.sin(a * Math.PI) * 3;
          p.group.rotation.z = Math.sin(a * Math.PI) * (i % 2 ? 1 : -1);
        }
      });
      cam.position.set(11, 4.3, 15);
      cam.lookAt(0, 1, 0);
    } else {
      c.brita.group.position.set(0, 0, -2.5);
      c.brita.group.rotation.y = 0;
      c.membros[0].group.position.set(-1, 0, 1);
      c.brita.arms.forEach(
        (a, i) => (a.rotation.x = -0.4 - Math.sin(t * 3 + i) * 0.6),
      );
      c.brita.head.rotation.z = Math.sin(t * 4) * 0.08;
      const perto = t > 35;
      cam.position.set(perto ? 3.7 : 8, perto ? 2.1 : 3.4, perto ? 6 : 10);
      cam.lookAt(0.1, 1.2, -1);
    }
  } else if (voando) {
    c.preceiro.visible = false;
    c.luaPreceiro.visible = true;
    const a = suave(t / 10);
    c.brita.group.position.set(0, lerp(14, 3, a), lerp(26, 5, a));
    c.brita.group.scale.setScalar(1.8);
    c.brita.group.rotation.x = -0.55;
    c.brita.arms.forEach((a) => (a.rotation.x = -1.3));
    c.brita.legs.forEach((a) => (a.rotation.x = 0.25));
    c.membros.forEach((p, i) => {
      const row = Math.floor(i / 2);
      p.group.scale.setScalar(0.65);
      p.group.position.set(
        (i % 2 ? 1 : -1) * 0.63,
        c.brita.group.position.y + 2.5 + row * 0.85,
        c.brita.group.position.z - 0.55 - row * 0.36,
      );
      p.group.rotation.y = 0;
      p.sentar?.(global);
    });
    cam.position.set(
      7,
      c.brita.group.position.y + 6.5,
      c.brita.group.position.z + 13,
    );
    cam.lookAt(
      0,
      c.brita.group.position.y + 3.1,
      c.brita.group.position.z - 0.6,
    );
  } else {
    c.membros.forEach((p, i) => {
      p.group.position.set((i - 2.5) * 1.7, 0, 8 + (i % 2) * 1.1);
      p.group.rotation.y = Math.PI;
    });
    c.brita.group.position.set(-7, 0, 7);
    c.brita.group.rotation.y = Math.PI;
    if (etapa === "luaChegada") {
      const a = suave(t / 8);
      cam.position.set(lerp(40, 14, a), lerp(22, 8, a), lerp(48, 30, a));
      cam.lookAt(0, 4, -12);
    } else if (["preceiroJornais", "kompraoJornais"].includes(etapa)) {
      const kom = etapa === "kompraoJornais",
        v = kom ? c.vendedorKomprao : c.vendedorPreceiro;
      const destinos = [...c.membros, c.brita].map((p) => p.group.position);
      const indice = Math.min(
        destinos.length - 1,
        Math.floor(Math.max(0, t - 1) / 1.3),
      );
      v.group.position.x = destinos[indice].x;
      for (let i = 0; i < destinos.length; i++) {
        const a = suave((t - 1 - i * 1.3) / 0.6);
        c.papeis[i].visible = a > 0;
        c.papeis[i].position.set(
          lerp(v.group.position.x, destinos[i].x, a),
          1.15,
          lerp(4.4, destinos[i].z - 0.3, a),
        );
        c.papeis[i].children[0].material.map =
          c.imagens[(kom ? "komprao" : "preceiro") + "-jornal"];
      }
      cam.position.set(12, 3.1, 17);
      cam.lookAt(0, 1.4, 5);
    } else if (["preceiroLeitura", "kompraoLeitura"].includes(etapa)) {
      const kom = etapa === "kompraoLeitura";
      c.membros[0].group.visible = false;
      cam.position.set(0, 1.38, 7.6);
      cam.lookAt(0, 1.35, -10);
      c.rig.visible = true;
      c.rig.position.copy(cam.position);
      c.rig.quaternion.copy(cam.quaternion);
      c.rig.translateY(
        lerp(-0.8, 0, suave(t / 0.65)) + Math.sin(global * 1.2) * 0.004,
      );
      c.folha.material.map =
        c.imagens[(kom ? "komprao" : "preceiro") + "-jornal"];
      c.folha.scale.x = kom ? 0.85 : 1;
    } else if (etapa === "kompraoChegada") {
      const a = suave(t / 6);
      c.luaKomprao.position.set(
        lerp(115, 14, a),
        lerp(100, 32, a),
        lerp(-260, -90, a),
      );
      cam.position.set(18, 4.2, 25);
      cam.lookAt(5, lerp(5, 24, a), -35);
    } else if (etapa === "preceiroExplosao") {
      c.explosao.visible = true;
      c.luaKomprao.position.set(14, 32, -90);
      c.flash.scale.setScalar(0.5 + Math.min(t, 1.5) * 13);
      c.flash.material.opacity = Math.max(0, 0.85 - t * 0.45);
      c.brilho.intensity = Math.max(0, 250 - t * 65);
      c.destrocos.forEach(({ m, v }, i) => {
        m.position.set(v.x * t, 2 + v.y * t - 2 * t * t, -18 + v.z * t);
        m.rotation.set(t * (i % 4), t * (i % 3), t);
      });
      cam.position.set(18 + Math.sin(t * 40) * Math.exp(-t) * 0.2, 7, 28);
      cam.lookAt(0, 5, -13);
      c.membros.forEach((p) => (p.group.rotation.y = 0));
    } else {
      cam.position.set(14, 7, 30);
      cam.lookAt(0, 4, -12);
    }
  }
  if (!["kompraoChegada", "preceiroExplosao"].includes(etapa))
    c.luaKomprao.position.set(22, 38, -125);
  for (const p of [c.luaPreceiro, c.luaKomprao]) p.lookAt(cam.position);
  cam.fov = ["preceiroLeitura", "kompraoLeitura"].includes(etapa) ? 48 : 55;
  cam.near = 0.06;
  cam.far = 800;
  cam.updateProjectionMatrix();
  view.renderer.toneMappingExposure = praia ? 1.02 : 1.0;
  view.renderer.render(scene, cam);
}
