import { povoarCenario } from "./figurantes.js";
import { animacaoDeMalha } from "./animacao-modelos.js";
import { criarCapituloFinal, desenharCapituloFinal } from "./capitulo-final.js";
import { ETAPAS_FINAL } from "./regras-final.js";
import * as T from "./vendor/three.module.js";
import { OBJLoader } from "./vendor/OBJLoader.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarTexturaTexto,
  obterMaterial,
} from "./modelos.js";
import { criarPessoa } from "./personagens.js";
import {
  carregarPoliticoCozinha,
  animarPoliticoCalmo,
} from "./politicos-cozinha.js";
import {
  PRODUTOS_MERCADO,
  RACKS_MERCADO,
  alturaCinema,
} from "./regras-arcoplex.js";
const pasta = new URL("assets/arcoplex/", import.meta.url).href;
function painel(g, map, w, h, pos, rot = 0) {
  const m = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({ map, side: T.DoubleSide }),
  );
  m.position.set(...pos);
  m.rotation.y = rot;
  g.add(m);
  return m;
}
function texto(g, t, w, h, pos, bg = "#11223a", fg = "#f5eee0", rot = 0) {
  return painel(g, criarTexturaTexto(t, bg, fg, 1024, 256), w, h, pos, rot);
}
function normalizar(modelo, altura) {
  modelo.updateMatrixWorld(true);
  const b = new T.Box3().setFromObject(modelo),
    s = altura / (b.max.y - b.min.y),
    c = b.getCenter(new T.Vector3());
  modelo.scale.multiplyScalar(s);
  modelo.position.set(-c.x * s, -b.min.y * s, -c.z * s);
  const g = new T.Group();
  g.add(modelo);
  return g;
}
function clonarPele(root) {
  const copia = root.clone(true),
    a = [],
    b = [];
  root.traverse((o) => a.push(o));
  copia.traverse((o) => b.push(o));
  const map = new Map(a.map((o, i) => [o, b[i]]));
  a.forEach((o, i) => {
    if (o.isSkinnedMesh) {
      b[i].skeleton = o.skeleton.clone();
      b[i].skeleton.bones = o.skeleton.bones.map((b) => map.get(b));
      b[i].bindMatrix.copy(o.bindMatrix);
      b[i].bindMatrixInverse.copy(o.bindMatrixInverse);
    }
  });
  return copia;
}
function carrinho() {
  const g = new T.Group(),
    metal = obterMaterial("#a5b3bf", 0.25, 0.7),
    azul = obterMaterial("#163e6b");
  const c = new T.LineSegments(
    new T.EdgesGeometry(new T.BoxGeometry(0.9, 0.62, 1.3)),
    new T.LineBasicMaterial({ color: "#d7e3ed" }),
  );
  c.position.set(0, 0.85, 0);
  g.add(c);
  for (let z = -0.6; z <= 0.61; z += 0.13)
    for (const x of [-0.45, 0.45])
      criarCilindro(g, 0.008, 0.008, 0.6, metal, [x, 0.85, z]);
  for (let x = -0.45; x <= 0.46; x += 0.12)
    criarCaixa(g, [0.012, 0.025, 1.3], metal, [x, 0.54, 0]);
  for (const x of [-0.4, 0.4]) {
    criarCilindro(g, 0.025, 0.025, 1.0, metal, [x, 0.58, 0.73], [0.15, 0, 0]);
    for (const z of [-0.5, 0.5])
      criarCilindro(
        g,
        0.12,
        0.12,
        0.08,
        obterMaterial("#111722"),
        [x, 0.14, z],
        [0, 0, Math.PI / 2],
      );
  }
  criarCaixa(g, [0.95, 0.07, 0.07], azul, [0, 1.15, 0.8]);
  return g;
}
function luzes(scene) {
  scene.add(new T.HemisphereLight("#dce8ff", "#33323b", 1.2));
  const sol = new T.DirectionalLight("#fff6df", 2.2);
  sol.position.set(7, 20, 10);
  scene.add(sol);
}
function produtoMaterial(p) {
  const tex = criarTexturaTexto(p.nome, p.cor, "#fff", 512, 512);
  return new T.MeshPhongMaterial({ map: tex, shininess: 12 });
}
function criarMercado(imagens, clay, joker) {
  const s = new T.Scene();
  s.background = new T.Color("#b6bbba");
  luzes(s);
  criarCaixa(s, [40, 0.18, 54], obterMaterial("#b6b8b2", 0.25), [0, -0.15, -2]);
  for (const x of [-20, 20])
    criarCaixa(s, [0.25, 9, 54], obterMaterial("#e2e1d7"), [x, 4.5, -2]);
  criarCaixa(s, [40, 9, 0.25], obterMaterial("#d4d3c9"), [0, 4.5, -29]);
  criarCaixa(s, [40, 0.2, 54], obterMaterial("#d3d7d8"), [0, 9, -2]);
  for (let z = -26; z < 24; z += 5) {
    criarCaixa(s, [40, 0.28, 0.12], obterMaterial("#838c92"), [0, 8.65, z]);
    for (const x of [-15, -5, 5, 15]) {
      criarCaixa(
        s,
        [2.2, 0.09, 0.4],
        new T.MeshBasicMaterial({ color: "#fff8dc" }),
        [x, 8.42, z],
      );
    }
  }
  const produtos = {};
  for (const p of PRODUTOS_MERCADO) produtos[p.id] = produtoMaterial(p);
  for (const r of RACKS_MERCADO) {
    const g = new T.Group();
    g.position.set(r.x, 0, r.z);
    s.add(g);
    const metal = obterMaterial("#bfc3c6");
    for (const x of [-r.w / 2, r.w / 2])
      for (const z of [-r.d / 2, r.d / 2])
        criarCaixa(g, [0.1, 3.5, 0.1], metal, [x, 1.75, z]);
    for (let y = 0.35; y < 3.5; y += 0.62) {
      criarCaixa(g, [r.w, 0.08, r.d], metal, [0, y, 0]);
      for (let z = -3.35; z < 3.4; z += 0.55)
        for (const x of [-0.47, 0.47]) {
          const p =
            PRODUTOS_MERCADO[
              (Math.round((z + 3.35) / 0.55) +
                Math.round(y * 2) +
                Math.abs(r.x)) %
                6
            ];
          criarCaixa(g, [0.35, 0.43, 0.35], produtos[p.id], [x, y + 0.27, z]);
        }
    }
  }
  for (const p of PRODUTOS_MERCADO) {
    const stand = new T.Group();
    stand.position.set(p.x, 0, p.z);
    s.add(stand);
    criarCaixa(stand, [0.6, 1, 0.65], obterMaterial("#24456c"), [0, 0.5, 0]);
    const item = criarCaixa(
      stand,
      [0.45, 0.6, 0.4],
      produtos[p.id],
      [0, 1.32, 0],
    );
    item.name = "produto_" + p.id;
    texto(stand, p.nome, 1.75, 0.37, [0, 2.25, 0]);
  }
  for (let i = 0; i < 5; i++) {
    const x = -14 + i * 7;
    criarCaixa(s, [2.8, 0.9, 2.2], obterMaterial("#26333d"), [x, 0.45, 21]);
    criarCaixa(s, [0.9, 0.7, 0.1], obterMaterial("#0b151c"), [x, 1.2, 20.4]);
    texto(s, "CAIXA " + (i + 1), 1.5, 0.4, [x, 3, 20.4]);
  }
  for (const x of [-15, 0, 15])
    texto(s, "Komprão · OFERTAS", 8, 1.3, [x, 6, -27.8], "#ae1730", "#fff");
  painel(s, imagens["mercado-interior"], 16, 8, [-19.83, 4, -12], Math.PI / 2);
  painel(s, imagens["mercado-caixas"], 14, 8, [19.83, 4, -12], -Math.PI / 2);
  clay.position.set(-2.5, 0, 10);
  joker.position.set(2.4, 0, 10);
  s.add(clay, joker);
  const porta = new T.Group();
  porta.position.set(0, 0, -23);
  s.add(porta);
  criarCaixa(porta, [2.2, 3.4, 0.22], obterMaterial("#23232d"), [0, 1.7, 0]);
  for (const x of [-1.15, 1.15])
    criarCaixa(porta, [0.1, 3.6, 0.35], obterMaterial("#b1a88c"), [x, 1.75, 0]);
  criarCaixa(porta, [2.4, 0.1, 0.35], obterMaterial("#b1a88c"), [0, 3.5, 0]);
  criarCilindro(
    porta,
    0.06,
    0.06,
    0.09,
    obterMaterial("#ad9860", 0.2, 0.7),
    [0, 1.46, 0.16],
    [Math.PI / 2, 0, 0],
  );
  criarElipsoide(
    porta,
    [0.07, 0.07, 0.12],
    obterMaterial("#b6a46d"),
    [0.8, 1.1, 0.17],
  );
  const cart = carrinho();
  s.add(cart);
  return { scene: s, clay, joker, porta, cart };
}
function criarShopping(imagens) {
  const s = new T.Scene();
  s.background = new T.Color("#080a10");
  s.fog = new T.Fog("#080a10", 11, 52);
  s.add(new T.HemisphereLight("#75849c", "#121018", 0.32));
  const key = new T.DirectionalLight("#91a8c2", 0.45);
  key.position.set(-10, 10, 10);
  s.add(key);
  criarCaixa(
    s,
    [36, 0.12, 57],
    obterMaterial("#9a948b", 0.15, 0.15),
    [0, -0.12, -8],
  );
  criarCaixa(s, [36, 0.2, 57], obterMaterial("#1d2028"), [0, 5.8, -8]);
  for (const x of [-18, 18])
    criarCaixa(s, [0.2, 6, 57], obterMaterial("#6c6156"), [x, 2.9, -8]);
  criarCaixa(s, [26, 5.8, 0.25], obterMaterial("#352d27"), [-5, 2.9, -9]);
  criarCaixa(s, [0.25, 5.8, 27], obterMaterial("#27252b"), [8.4, 2.9, -22.5]);
  // Foto de referência preservada em painel vertical, sem distorcer proporções.
  painel(s, imagens["arcoplex-hall"], 2.8, 3.48, [-4, 2.1, -8.75]);
  for (let x = -16; x < 8; x += 0.5)
    criarCaixa(s, [0.38, 2, 0.05], obterMaterial("#674e39"), [x, 4.75, -8.8]);
  for (const x of [-11, -8, 0, 3]) {
    criarCaixa(s, [2.5, 1.45, 0.12], obterMaterial("#10171c"), [x, 2.2, -8.65]);
    texto(
      s,
      x < 0 ? "BOMBONIÈRE" : "BILHETERIA",
      2.35,
      0.35,
      [x, 2.65, -8.55],
      "#172125",
      "#a6b7be",
    );
    texto(
      s,
      x < 0 ? "PIPOCA   REFRIGERANTE" : "PRÓXIMA SESSÃO · SALA 3",
      2.35,
      0.25,
      [x, 2.1, -8.54],
      "#11171c",
      "#6c7e89",
    );
  }
  for (let x = -17; x < 18; x += 2)
    criarCaixa(s, [0.015, 0.007, 54], obterMaterial("#46464a"), [
      x,
      -0.053,
      -8,
    ]);
  for (let z = -34; z < 20; z += 2)
    criarCaixa(s, [35, 0.007, 0.015], obterMaterial("#46464a"), [0, -0.052, z]);
  texto(s, "ARCOPLEX", 15, 1.5, [-4, 4.5, -8.6], "#423327", "#ddd5b8");
  texto(
    s,
    "CINEMAS · ITAJAÍ SHOPPING · L3",
    11,
    0.48,
    [-4, 3.65, -8.5],
    "#26232a",
    "#b2ad9e",
  );
  criarCaixa(s, [18, 0.9, 1.5], obterMaterial("#1b1d23"), [-4, 0.45, -7.7]);
  for (let i = 0; i < 8; i++) {
    const x = -11 + i * 2;
    for (const z of [-4, -1])
      criarCilindro(s, 0.045, 0.07, 1.05, obterMaterial("#a4a9ac", 0.25, 0.6), [
        x,
        0.52,
        z,
      ]);
    if (i < 7)
      criarCaixa(s, [2, 0.04, 0.045], obterMaterial("#24242d"), [x + 1, 1, -1]);
  }
  for (const x of [-14, 3, 15])
    for (const z of [5, 16]) {
      criarCaixa(s, [0.75, 5.8, 0.75], obterMaterial("#978574"), [x, 2.9, z]);
      criarCaixa(
        s,
        [1.5, 0.04, 0.16],
        new T.MeshBasicMaterial({ color: "#c7c0a2" }),
        [x, 5.5, z],
      );
    }
  // Escada no limite do salão: degraus reais somem na escuridão do piso inferior.
  for (let i = 0; i < 15; i++)
    criarCaixa(s, [4, 0.22, 1], obterMaterial("#5a5c61"), [
      -12,
      -0.15 - i * 0.18,
      15 + i * 0.55,
    ]);
  for (const x of [-14, -10])
    criarCaixa(s, [0.055, 0.055, 11], obterMaterial("#a0a6ac", 0.2, 0.6), [
      x,
      1.0,
      17,
    ]);
  texto(s, "← ESCADA  ·  L2", 3, 0.5, [-12, 2.7, 16], "#152622", "#b4cab9");
  const nomes = [
    "cartaz-destino",
    "cartaz-alya",
    "cartaz-clayface",
    "cartaz-backrooms",
  ];
  nomes.forEach((n, i) => {
    const z = 4 - i * 9;
    criarCaixa(s, [0.12, 3.1, 2.1], obterMaterial("#22242c"), [17.72, 2.2, z]);
    painel(s, imagens[n], 1.9, 2.85, [17.61, 2.2, z], -Math.PI / 2);
    criarCaixa(
      s,
      [0.09, 0.045, 2.0],
      new T.MeshBasicMaterial({ color: "#cfbda2" }),
      [17.55, 3.7, z],
    );
  });
  texto(s, "SALAS 1—5 →", 5, 0.7, [11.2, 4.5, -7], "#141d20", "#bfd3c0");
  for (let i = 0; i < 5; i++) {
    const z = -15 - i * 5;
    criarCaixa(
      s,
      [0.12, 2.8, 1.8],
      obterMaterial(i === 2 ? "#3c3027" : "#1c1b20"),
      [17.8, 1.4, z],
    );
    texto(
      s,
      "SALA " + (i + 1),
      1.7,
      0.4,
      [17.64, 3, z],
      "#091a16",
      "#9dbfa9",
      -Math.PI / 2,
    );
  }
  const sombra = criarPessoa();
  sombra.group.name = "Presenca_na_escada";
  sombra.group.scale.set(1.1, 1.25, 1);
  sombra.group.traverse((o) => {
    if (o.isMesh) o.material = new T.MeshPhongMaterial({ color: "#030406" });
  });
  s.add(sombra.group);
  const lanterna = new T.SpotLight("#d6e3e6", 25, 22, 0.42, 0.7, 1.6);
  s.add(lanterna, lanterna.target);
  return { scene: s, sombra, lanterna };
}
function criarSala(imagens) {
  const s = new T.Scene();
  s.background = new T.Color("#020307");
  s.fog = new T.Fog("#020307", 14, 43);
  s.add(new T.HemisphereLight("#98a4bc", "#504039", 0.8));
  const escuro = obterMaterial("#181519", 0.85),
    couro = obterMaterial("#665347", 0.4, 0.08);
  for (const x of [-13, 13]) {
    criarCaixa(s, [0.2, 10.5, 34], escuro, [x, 4.8, -1]);
    for (let z = -14; z < 17; z += 3.5) {
      criarCaixa(s, [0.18, 6, 0.6], obterMaterial("#3d3026"), [
        x * 0.985,
        3,
        z,
      ]);
      criarElipsoide(
        s,
        [0.04, 0.2, 0.08],
        new T.MeshBasicMaterial({ color: "#978668" }),
        [x * 0.98, 2.8, z],
      );
    }
  }
  criarCaixa(s, [26, 0.2, 34], escuro, [0, 10.2, -1]);
  criarCaixa(s, [26, 10.5, 0.2], escuro, [0, 4.8, -17]);
  criarCaixa(s, [26, 10.5, 0.2], escuro, [0, 4.8, 16]);
  for (let row = 0; row < 9; row++) {
    const z = -8 + row * 2.5,
      h = alturaCinema(z);
    criarCaixa(s, [26, 0.22, 2.5], obterMaterial("#262127"), [0, h - 0.12, z]);
    for (const x of [-1.2, 1.2, -11, 11])
      criarCaixa(
        s,
        [0.06, 0.025, 2.3],
        new T.MeshBasicMaterial({ color: "#385b72" }),
        [x, h + 0.01, z],
      );
    if (row === 8) continue;
    for (const side of [-1, 1])
      for (let i = 0; i < 4; i++) {
        const x = side * (2.1 + i * 2.15),
          g = new T.Group();
        g.position.set(x, h, z);
        s.add(g);
        criarCaixa(g, [1.45, 0.25, 1.4], couro, [0, 0.48, 0]);
        criarCaixa(g, [1.45, 1.16, 0.3], couro, [0, 1.03, 0.48], [0.12, 0, 0]);
        for (const d of [-1, 1]) {
          criarCaixa(g, [0.23, 0.5, 1.35], couro, [d * 0.8, 0.65, 0]);
          criarCilindro(g, 0.075, 0.075, 0.025, obterMaterial("#11131a"), [
            d * 0.8,
            0.92,
            -0.26,
          ]);
        }
        criarCaixa(
          g,
          [0.6, 0.06, 0.45],
          obterMaterial("#76624c"),
          [0.97, 0.9, -0.32],
        );
      }
  }
  const screen = painel(
    s,
    imagens["resultado-eleicao"],
    16,
    9,
    [0, 5.4, -16.75],
  );
  screen.material.toneMapped = false;
  texto(
    s,
    "ELEIÇÃO FICTÍCIA · PARÓDIA DO JOGO",
    12,
    0.28,
    [0, 0.68, -16.6],
    "#07172d",
    "#c1ccdf",
  );
  const telaLuz = new T.PointLight("#a3bded", 150, 35, 2);
  telaLuz.position.set(0, 4, -13);
  s.add(telaLuz);
  for (const x of [-9, 9]) {
    const luz = new T.PointLight("#77624c", 12, 30, 1);
    luz.position.set(x, 3, 3);
    s.add(luz);
  }
  texto(s, "SAÍDA", 1.4, 0.4, [-11.9, 2.6, 12], "#11221b", "#76b790");
  const escondido = criarPessoa();
  escondido.group.name = "Pessoa_oculta_entre_poltronas";
  escondido.group.position.set(-6.4, alturaCinema(7) + 0.03, 7.0);
  escondido.group.rotation.y = Math.PI;
  escondido.legs.forEach((a) => (a.rotation.x = -1.3));
  escondido.group.traverse((o) => {
    if (o.isMesh) o.material = new T.MeshPhongMaterial({ color: "#090b0e" });
  });
  s.add(escondido.group);
  const lanterna = new T.SpotLight("#cad3d8", 18, 18, 0.4, 0.8, 1.5);
  s.add(lanterna, lanterna.target);
  return { scene: s, screen, telaLuz, escondido, lanterna };
}
export async function criarArcoplex(lua) {
  const nomes = [
    "mercado-caixas",
    "mercado-interior",
    "arcoplex-hall",
    "sala-referencia",
    "cartaz-destino",
    "cartaz-alya",
    "cartaz-clayface",
    "cartaz-backrooms",
    "resultado-eleicao",
  ];
  const [imagens, obj, glb, lula] = await Promise.all([
    Promise.all(
      nomes.map(async (n) => {
        const t = await new T.TextureLoader().loadAsync(pasta + n + ".png");
        t.colorSpace = T.SRGBColorSpace;
        t.anisotropy = 4;
        return [n, t];
      }),
    ).then((x) => Object.fromEntries(x)),
    new OBJLoader().loadAsync(pasta + "clayface/Clayface.obj"),
    new GLTFLoader().loadAsync(pasta + "joker/LegoJoker.gltf"),
    carregarPoliticoCozinha("lula"),
  ]);
  const claytex = await new T.TextureLoader().loadAsync(
    pasta + "clayface/tex000.png",
  );
  claytex.colorSpace = T.SRGBColorSpace;
  obj.traverse((o) => {
    if (o.isMesh)
      o.material = new T.MeshPhongMaterial({ map: claytex, shininess: 60 });
  });
  glb.scene.traverse((o) => {
    if (o.isMesh) {
      const converter = (m) =>
        new T.MeshPhongMaterial({
          map: m.map,
          color: m.color,
          shininess: 45,
          side: T.DoubleSide,
        });
      o.material = Array.isArray(o.material)
        ? o.material.map(converter)
        : converter(o.material);
    }
  });
  const clay = normalizar(obj, 3.3),
    joker = normalizar(glb.scene, 1.9),
    mercado = criarMercado(imagens, clay, joker),
    shopping = criarShopping(imagens),
    sala = criarSala(imagens);
  const debate = new T.Scene();
  debate.background = new T.Color("#06316b");
  luzes(debate);
  const alya = clonarPele(lua.membros[4].group);
  debate.add(alya, lula.grupo);
  alya.scale.setScalar(1);
  alya.rotation.set(0, 0, 0);
  alya.position.set(-2.5, 0, 0);
  lula.grupo.position.set(2.5, 0, 0);
  const bones = [];
  alya.traverse((o) => {
    if (o.isBone) bones.push({ o, r: o.rotation.clone() });
  });
  for (const x of [-2.5, 2.5])
    criarCaixa(debate, [1.7, 1, 0.85], obterMaterial("#17253d"), [x, 0.5, 0.6]);
  texto(
    debate,
    "JORNAL NACIONAL",
    10,
    1.1,
    [0, 3.0, -1.2],
    "#07295a",
    "#e2edf7",
  );
  texto(
    debate,
    "ELEIÇÃO FICTÍCIA · PARÓDIA DO JOGO",
    10,
    0.45,
    [0, 2.25, -1.15],
    "#0b3976",
    "#b6cae4",
  );
  texto(debate, "ALYA KUJOU", 2.5, 0.35, [-2.5, 0.7, 1.05], "#0d4389", "#fff");
  texto(debate, "LULA", 2.5, 0.35, [2.5, 0.7, 1.05], "#0d4389", "#fff");
  const cameraDebate = new T.PerspectiveCamera(35, 16 / 9, 0.1, 50);
  cameraDebate.position.set(0, 1.5, 7);
  cameraDebate.lookAt(0, 1.5, 0);
  const alvo = new T.WebGLRenderTarget(1024, 576);
  alvo.texture.colorSpace = T.SRGBColorSpace;
  const cache = new Map();
  for (const raiz of [mercado.scene, shopping.scene, sala.scene, debate])
    raiz.traverse((o) => {
      if (!o.isMesh) return;
      const converter = (m) => {
        if (!m.isMeshStandardMaterial) return m;
        if (!cache.has(m))
          cache.set(
            m,
            new T.MeshPhongMaterial({
              color: m.color,
              map: m.map,
              side: m.side,
              transparent: m.transparent,
              opacity: m.opacity,
              alphaTest: m.alphaTest,
              shininess: Math.max(3, 40 * (1 - (m.roughness || 0.8))),
            }),
          );
        return cache.get(m);
      };
      o.material = Array.isArray(o.material)
        ? o.material.map(converter)
        : converter(o.material);
    });
  for (const root of [
    mercado.scene,
    shopping.scene,
    sala.scene,
    debate,
    ...lua.membros.map((m) => m.group),
    lua.brita.group,
  ])
    root.traverse((o) => {
      if (o.isMesh)
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          m.name = m.type;
    });
  const papeisRef = [...lua.membros, lua.brita];
  const capitulo = {
    mercado,
    shopping,
    sala,
    imagens,
    lua,
    papeisRef,
    debate,
    cameraDebate,
    alvo,
    alya,
    bones,
    lula,
  };
  mercado.figurantes = povoarCenario(mercado.scene, "mercado");
  mercado.animarClay = animacaoDeMalha(mercado.clay);
  mercado.animarJoker = animacaoDeMalha(mercado.joker);
  capitulo.final = await criarCapituloFinal(capitulo);
  return capitulo;
}
export function desenharArcoplex(view, c, f) {
  document.getElementById("voleiSprites").hidden = true;
  if (ETAPAS_FINAL.includes(f.etapa)) {
    desenharCapituloFinal(view, c.final, f);
    return;
  }
  c.final.clay.visible = false;
  c.final.brecha.visible = false;
  c.final.bl.intensity = 0;
  c.sala.escondido.group.visible = true;
  const e = f.etapa,
    t = f.tempo,
    p = f.jogador,
    a = f.arcoplex,
    cam = view.camera;
  const noMercado = [
      "mercadoEntrada",
      "carrinhoAtaque",
      "compras",
      "portaEstranha",
    ].includes(e),
    naSala = ["cinemaSala", "cinemaResultado"].includes(e);
  let scene = noMercado
    ? c.mercado.scene
    : naSala
      ? c.sala.scene
      : c.shopping.scene;
  c.mercado.figurantes.update(
    f.animacao,
    view.qualidadeAtual,
    view.figurantesAtivos && noMercado,
  );
  c.mercado.animarClay(f.animacao, 0.25);
  c.mercado.animarJoker(f.animacao, 0.5);
  if (noMercado) {
    c.mercado.porta.visible = e === "portaEstranha";
    for (const [i, m] of c.papeisRef.entries()) {
      if (m.group.parent !== scene) scene.add(m.group);
      m.group.visible = true;
      m.group.scale.setScalar(1);
      m.group.position.set((i - 2.5) * 1.2, 0, 17 + (i % 2));
      m.group.rotation.set(0, Math.PI, 0);
      m.animate?.(f.animacao, 0.1);
    }
    c.papeisRef[0].group.visible = false;
    c.mercado.clay.rotation.y = Math.sin(f.animacao) * 0.06;
    c.mercado.joker.rotation.y = Math.sin(f.animacao * 2) * 0.1;
    const g = c.mercado.cart;
    g.visible = e === "carrinhoAtaque" || e === "compras";
    if (e === "carrinhoAtaque") {
      const u = Math.min(1, t / 2.1);
      g.position.set(0, 0.8 + Math.sin(u * Math.PI) * 1.4, 10 + u * 8);
      g.rotation.set(t * 3, 0, Math.sin(t * 7) * 0.1);
      c.papeisRef.forEach((m, i) => {
        const k = Math.max(0, t - 1.7 - i * 0.06);
        m.group.position.y = Math.sin(Math.min(1, k / 1.4) * Math.PI) * 1.8;
        m.group.rotation.z =
          Math.sin(Math.min(1, k / 1.4) * Math.PI) * (i % 2 ? 1 : -1);
      });
    } else {
      g.position.set(
        p.x - Math.sin(p.yaw) * 1.7,
        0,
        p.z - Math.cos(p.yaw) * 1.7,
      );
      g.rotation.set(0, p.yaw, 0);
    }
  }
  if (e === "mercadoEntrada") {
    const u = Math.min(1, t / 14);
    cam.position.set(14 - u * 9, 5 - u * 2, 24 - u * 6);
    cam.lookAt(0, 1.8, 9);
  } else if (e === "olhoMagico") {
    cam.position.set(0, 1.55, 9);
    cam.lookAt(-3, 2, -8);
  } else {
    cam.position.set(p.x, (p.y || 0) + (a?.agachado ? 1.02 : 1.55), p.z);
    cam.rotation.set(p.pitch, p.yaw, 0, "YXZ");
    if (f.movendo && !["cinemaSusto", "travessiaCinema"].includes(e))
      cam.position.y +=
        Math.sin(f.animacao * (f.correndo ? 13 : 8)) *
        (f.correndo ? 0.035 : 0.012);
    if (e === "carrinhoAtaque" && t > 1.8 && t < 2.6) {
      cam.rotation.z = Math.sin(t * 40) * 0.08;
      cam.position.x += Math.sin(t * 28) * 0.1;
    }
  }
  if (!noMercado && !naSala) {
    const s = c.shopping.sombra;
    s.group.visible = [
      "shoppingExplorar",
      "cinemaFuga",
      "cinemaSusto",
    ].includes(e);
    const q = a?.perseguidor || { x: -12, z: 18 };
    s.group.position.set(q.x, 0, q.z);
    s.group.rotation.y = Math.atan2(p.x - q.x, p.z - q.z);
    s.legs.forEach(
      (l, i) => (l.rotation.x = Math.sin(f.animacao * 6 + i * Math.PI) * 0.2),
    );
  }
  for (const lugar of [c.shopping, c.sala]) {
    lugar.lanterna.position.copy(cam.position);
    lugar.lanterna.target.position
      .copy(cam.position)
      .add(cam.getWorldDirection(new T.Vector3()).multiplyScalar(12));
    lugar.lanterna.intensity = a?.lanterna ? (naSala ? 18 : 25) : 0;
  }
  if (naSala) {
    if (e === "cinemaSala" && t < 40) {
      for (const { o, r } of c.bones) {
        o.rotation.copy(r);
        if (/upperarm/i.test(o.name))
          o.rotation.x -= 0.5 + Math.sin(t * 2) * 0.15;
      }
      animarPoliticoCalmo(c.lula, t);
      c.lula.grupo.rotation.y = -0.15;
      const old = view.renderer.getRenderTarget();
      view.renderer.setRenderTarget(c.alvo);
      view.renderer.render(c.debate, c.cameraDebate);
      view.renderer.setRenderTarget(old);
      c.sala.screen.material.map = c.alvo.texture;
    } else c.sala.screen.material.map = c.imagens["resultado-eleicao"];
    c.sala.telaLuz.intensity = 130 + Math.sin(f.animacao * 7) * 12;
    c.sala.escondido.head.rotation.y = Math.sin(f.animacao * 0.23) * 0.06;
  }
  cam.fov = e === "olhoMagico" ? 107 : f.correndo ? 78 : 70;
  cam.near = 0.06;
  cam.far = 120;
  cam.updateProjectionMatrix();
  view.renderer.toneMappingExposure = noMercado ? 1.05 : naSala ? 1.25 : 1.15;
  view.renderer.render(scene, cam);
}
