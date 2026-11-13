import { carregarMaos, primeiraPessoaAtiva } from "./maos-primeira-pessoa.js";
import { criarArcoplex } from "./arcoplex.js";
import { criarCenasLua } from "./lua-mercados.js";
import { criarPraiaVolei } from "./praia-volei.js";
import { criarEstradaPraia } from "./estrada-praia.js";
import { carregarHulkbuster } from "./bluezao-hulkbuster.js";
import { criarPontoKente } from "./ponto-kente.js";
import { criarFrutigerAero, desenharFrutigerAero } from "./frutiger-aero.js";
import { MateriaisRealistas } from "./materiais-realistas.js";
import { decorarQuartoNatal, decorarBackroomsNatal, decorarExteriorNatal } from "./natal.js";
import { perfilGrafico, escalaRenderizacao } from "./qualidade-grafica.js";
import { EfeitosVisuais } from "./efeitos-visuais.js";
import { criarCastelo, desenharCastelo } from "./castelo.js";
import { decorarQuartoAxel, criarFaroesteDaTV } from "./quarto-do-axel.js";
import {
  criarCenasAlisanave,
  montarLabirintoAlisanave,
  desenharAlisanave,
} from "./alisanave.js";
// Módulo do jogo. Consulte GUIA-DE-EDICAO.md antes de alterar estruturas.
import * as T from "./vendor/three.module.js";
import { criarCenaDoMenu, desenharMenu } from "./cena-do-menu.js";
import { TAMANHO_CELULA, ALTURA_PAREDE } from "./mapas.js";
import {
  criarMalha,
  criarCaixa,
  criarElipsoide,
  criarCilindro,
  criarTubo,
  obterMaterial,
  criarTexturaTexto,
  criarAxel,
  criarCachorro,
  criarSenai,
  carregarControle,
} from "./modelos.js";
import { criarMaicon } from "./personagens.js";
import { criarSalaDeAula, desenharSalaDeAula } from "./sala-de-aula.js";
import { criarCalabouco, desenharCalabouco } from "./calabouco.js";
function criarTexturaCenario(kind) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  let seed = 18723;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  g.fillStyle =
    kind === "wall" ? "#aaa17b" : kind === "floor" ? "#625d48" : "#a4a398";
  g.fillRect(0, 0, 512, 512);
  const img = g.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    let n = (rand() - 0.5) * (kind === "floor" ? 34 : 14);
    for (let k = 0; k < 3; k++) img.data[i + k] += n;
  }
  g.putImageData(img, 0, 0);
  if (kind === "wall") {
    g.strokeStyle = "#554b2b32";
    g.lineWidth = 1;
    for (let x = 0; x < 512; x += 32)
      for (let y = 0; y < 512; y += 48) {
        g.beginPath();
        g.moveTo(x, y);
        g.bezierCurveTo(x + 22, y + 15, x + 22, y + 30, x, y + 48);
        g.bezierCurveTo(x - 22, y + 30, x - 22, y + 15, x, y);
        g.stroke();
      }
    for (let i = 0; i < 45; i++) {
      const x = rand() * 512,
        y = rand() * 512,
        r = 20 + rand() * 80;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, "#302d1830");
      grd.addColorStop(1, "#302d1800");
      g.fillStyle = grd;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.fillStyle = "#393a29";
    g.fillRect(0, 465, 512, 47);
    g.fillStyle = "#d8ceb73b";
    g.fillRect(0, 462, 512, 3);
  } else if (kind === "ceiling") {
    g.strokeStyle = "#383d35";
    g.lineWidth = 3;
    g.strokeRect(0, 0, 512, 512);
    for (let i = 0; i < 400; i++) {
      g.fillStyle = "#181c1728";
      g.fillRect(rand() * 512, rand() * 512, rand() * 3 + 1, 1);
    }
  }
  const tex = new T.CanvasTexture(c);
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
function criarCaixaArredondada(parent, size, radius, material, pos) {
  const [w, h, d] = size,
    s = new T.Shape(),
    x = -w / 2,
    y = -h / 2,
    r = radius;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const geom = new T.ExtrudeGeometry(s, {
    depth: d - 2 * r,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: r * 0.45,
    bevelThickness: r,
    curveSegments: 12,
  });
  geom.translate(0, 0, -d / 2 + r);
  return criarMalha(parent, geom, material, pos);
}
function adicionarLuzAmbiente(scene, color, intensity) {
  scene.add(new T.HemisphereLight(color, "#15160e", intensity));
}
function adicionarLuzPontual(
  scene,
  color,
  intensity,
  calcularDistancia,
  position,
) {
  const l = new T.PointLight(color, intensity, calcularDistancia, 1.5);
  l.position.set(...position);
  scene.add(l);
  return l;
}
function criarTerminal(index) {
  const group = new T.Group();
  group.name = `Terminal_${index + 1}`;
  const steel = obterMaterial("#303a36", 0.5, 0.45),
    black = obterMaterial("#080c0d", 0.55);
  criarCaixa(group, [0.9, 0.95, 0.55], steel, [0, 0.48, 0]);
  criarCaixaArredondada(group, [1.2, 0.77, 0.17], 0.045, black, [0, 1.4, 0.04]);
  const screenMaterial = new T.MeshStandardMaterial({
    map: criarTexturaTexto(
      "> TERMINAL 0" + (index + 1),
      "#05121a",
      "#65c9d0",
      512,
      256,
    ),
    emissive: "#32bcc6",
    emissiveIntensity: 0.9,
  });
  const screen = criarCaixa(
    group,
    [1.08, 0.65, 0.015],
    screenMaterial,
    [0, 1.4, 0.14],
  );
  criarCaixaArredondada(
    group,
    [0.97, 0.04, 0.37],
    0.015,
    obterMaterial("#171e1b", 0.8),
    [0, 0.99, 0.27],
  );
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 12; col++)
      criarCaixa(group, [0.056, 0.014, 0.055], obterMaterial("#5b6b61", 0.7), [
        (col - 5.5) * 0.067,
        1.018,
        0.14 + row * 0.08,
      ]);
  criarCilindro(
    group,
    0.027,
    0.027,
    0.015,
    obterMaterial("#79dae0", 0.3, 0.1, {
      emissive: "#6cc7ce",
      emissiveIntensity: 1,
    }),
    [0.35, 0.72, 0.288],
    [Math.PI / 2, 0, 0],
  );
  // Farol e identificação visíveis no corredor, ocultados após resolver o terminal.
  const guia = new T.Group();
  group.add(guia);
  guia.position.y = 2.45;
  const placa = criarCaixa(
    guia,
    [1.5, 0.38, 0.03],
    new T.MeshBasicMaterial({
      map: criarTexturaTexto("TERMINAL 0" + (index + 1), "#083144", "#83e6f5"),
    }),
    [0, 0, 0],
  );
  criarMalha(
    guia,
    new T.ConeGeometry(0.13, 0.24, 3),
    obterMaterial("#63d6ef", 0.3, 0, {
      emissive: "#36bedc",
      emissiveIntensity: 1.3,
    }),
    [0, -0.4, 0],
    [0, 0, Math.PI],
  );
  criarMalha(
    group,
    new T.TorusGeometry(0.7, 0.025, 8, 40),
    obterMaterial("#58cbe5", 0.3, 0, {
      emissive: "#21a5cd",
      emissiveIntensity: 1.4,
    }),
    [0, 0.04, 0],
    [Math.PI / 2, 0, 0],
  );
  const farol = new T.PointLight("#42cae9", 12, 7, 1.8);
  farol.position.set(0, 2, 0);
  group.add(farol);
  return {
    group,
    screen,
    screenMaterial,
    guia,
    farol,
  };
}
export /* Câmeras, iluminação e desenho das cenas 3D. */
class CenaDoJogo {
  constructor(canvas) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.4));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.efeitos = new EfeitosVisuais(this.renderer);
    this.materiaisRealistas = new MateriaisRealistas(this.renderer);
    this.camera = new T.PerspectiveCamera(
      73,
      innerWidth / innerHeight,
      0.045,
      170,
    );
    this.camera.rotation.order = "YXZ";
    this.camera.position.set(0, 1.7, 0);
    this.weaponScene = new T.Scene();
    this.weaponCamera = new T.PerspectiveCamera(
      55,
      innerWidth / innerHeight,
      0.01,
      10,
    );
    this.weaponRig = new T.Group();
    this.weaponScene.add(this.weaponRig);
    adicionarLuzAmbiente(this.weaponScene, "#e1e9ec", 2.1);
    adicionarLuzPontual(this.weaponScene, "#79aeff", 8, 5, [0.8, 1, 1]);
    this.wallMap = criarTexturaCenario("wall");
    this.floorMap = criarTexturaCenario("floor");
    this.ceilingMap = criarTexturaCenario("ceiling");
    this.senaiTexture = new T.TextureLoader().load("assets/senai.png");
    this.senaiTexture.colorSpace = T.SRGBColorSpace;
    this.cachorro = criarCachorro();
    this.maicon = criarMaicon();
    this.axel = criarAxel();
    this.senai = criarSenai(this.senaiTexture);
    this.controller = null;
    this.room = null;
    this.levelScene = null;
    this.lastChapter = -1;
    this.pugPos = new T.Vector3();
    this.flicker = 0;
  }
  async carregar() {
    this.maosFPS = await carregarMaos();
    this.weaponScene.add(this.maosFPS.group);
    this.controller = await carregarControle();
    this.weaponRig.add(this.controller);
    this.controller.position.set(0, -0.26, -0.88);
    this.controller.rotation.set(-0.45, -0.12, -0.08);
    this.montarSala();
    this.menuScene = criarCenaDoMenu();
    this.classroom = criarSalaDeAula();
    this.alisanave = criarCenasAlisanave();
    this.dungeon = criarCalabouco();
    this.castelo = null; // Carregado ao desembarcar, poupando memória durante as fases anteriores.
    this.materiaisRealistas.preparar(this.room.scene, false, true);
    this.materiaisRealistas.preparar(this.menuScene.scene);
    this.materiaisRealistas.preparar(this.menuScene.natal.scene, true);
    this.materiaisRealistas.preparar(this.classroom.scene, false, true);
    this.materiaisRealistas.preparar(this.dungeon.scene, false, true);
    this.materiaisRealistas.preparar(this.alisanave.voo, true);
    this.materiaisRealistas.preparar(this.alisanave.porto, false);
    decorarExteriorNatal(this.alisanave.porto, { area: 46, cobrir: false });
    decorarExteriorNatal(this.menuScene.cidade.scene, { area: 60 });
    this.materiaisRealistas.preparar(this.alisanave.sala);
    const held = this.controller.clone(true);
    held.position.set(0, 1.0, 0.34);
    held.rotation.set(0.15, 0, 0);
    this.axel.body.add(held);
    this.axel.limbs[1].rotation.set(-0.7, 0, 0.9);
    this.axel.limbs[3].rotation.set(-0.7, 0, -0.9);
    return true;
  }
  /** Resolução dinâmica: baixa a escala quando o quadro passa de ~22 ms e sobe quando sobra folga. */
  ajustarResolucao(ms) {
    if (!this.escalaMaxima || this.renderer.xr?.isPresenting) return;
    this.mediaQuadro = (this.mediaQuadro ?? 16) * 0.95 + Math.min(ms, 100) * 0.05;
    this.esperaEscala = (this.esperaEscala || 0) + 1;
    if (this.esperaEscala < 45) return;
    let escala = this.escalaAtual;
    if (this.mediaQuadro > 22) escala = Math.max(0.55, escala - 0.1);
    else if (this.mediaQuadro < 13) escala = Math.min(this.escalaMaxima, escala + 0.05);
    if (Math.abs(escala - this.escalaAtual) > 0.001) {
      this.escalaAtual = escala;
      this.renderer.setPixelRatio(escala);
      this.redimensionar();
      this.esperaEscala = 0;
    }
  }
  definirQualidade(value) {
    const perfil = perfilGrafico(value);
    this.escalaMaxima = this.escalaAtual = escalaRenderizacao(value, devicePixelRatio);
    this.esperaEscala = 0;
    this.renderer.setPixelRatio(this.escalaAtual);
    this.renderer.shadowMap.enabled = perfil.sombras;
    this.efeitos.definirQualidade(value);
    this.materiaisRealistas.definirQualidade(value);
    this.redimensionar();
  }
  async carregarCastelo() {
    if (!this.castelo) {
      this.castelo = await criarCastelo();
      this.materiaisRealistas.preparar(this.castelo.scene);
      this.materiaisRealistas.preparar(this.castelo.externo, true);
      decorarExteriorNatal(this.castelo.externo, { area: 50 });
      this.materiaisRealistas.preparar(this.castelo.terraco.scene, true);
      this.materiaisRealistas.preparar(this.castelo.terraco.previa.scene, true);
    }
    return this.castelo;
  }
  async carregarAero() {
    if (!this.aero) {
      this.aero = criarFrutigerAero();
      this.materiaisRealistas.preparar(this.aero.scene, true);
    }
    return this.aero;
  }
  async carregarPraia() {
    await this.carregarAero();
    if (!this.promessaPraia)
      this.promessaPraia = criarPraiaVolei()
        .then((c) => (this.aero.praia = c))
        .catch((e) => {
          this.promessaPraia = null;
          throw e;
        });
    return this.promessaPraia;
  }
  async carregarArcoplex() {
    await this.carregarLua();
    if (!this.promessaArcoplex)
      this.promessaArcoplex = criarArcoplex(this.aero.lua)
        .then((c) => (this.aero.arcoplex = c))
        .catch((e) => {
          this.promessaArcoplex = null;
          throw e;
        });
    return this.promessaArcoplex;
  }
  async carregarLua() {
    await this.carregarPraia();
    if (!this.promessaLua)
      this.promessaLua = criarCenasLua(this.aero.praia)
        .then((c) => (this.aero.lua = c))
        .catch((e) => {
          this.promessaLua = null;
          throw e;
        });
    return this.promessaLua;
  }
  async carregarComplementosAero() {
    await this.carregarAero();
    if (!this.promessaComplementosAero)
      this.promessaComplementosAero = (async () => {
        this.aero.hulk = await carregarHulkbuster();
        this.aero.scene.add(this.aero.hulk.grupo);
        this.aero.pontoKente = await criarPontoKente();
        this.aero.estradaPraia = criarEstradaPraia(
          this.aero.pontoKente.peugeot,
        );
        this.materiaisRealistas.preparar(this.aero.estradaPraia.scene, true);
        this.materiaisRealistas.preparar(this.aero.scene, true);
        this.materiaisRealistas.preparar(this.aero.pontoKente.scene, true);
      })().catch((e) => {
        this.promessaComplementosAero = null;
        throw e;
      });
    return this.promessaComplementosAero;
  }
  redimensionar() {
    this.renderer.setSize(innerWidth, innerHeight);
    for (const c of [this.camera, this.weaponCamera]) {
      c.aspect = innerWidth / innerHeight;
      c.updateProjectionMatrix();
    }
  }
  montarSala() {
    const scene = new T.Scene();
    scene.background = new T.Color("#080c12");
    scene.fog = new T.FogExp2("#131619", 0.019);
    adicionarLuzAmbiente(scene, "#bdc4ce", 0.65);
    const walls = obterMaterial("#68716e", 0.98),
      wood = obterMaterial("#292322", 0.8),
      fabric = obterMaterial("#606653", 0.98),
      dark = obterMaterial("#111719", 0.4, 0.1);
    const floorTexture = this.floorMap.clone();
    floorTexture.repeat.set(6, 5);
    // Piso com recorte físico sob o sofá. A tampa se abre na queda.
    const s = new T.Shape();
    s.moveTo(-5, -4.5);
    s.lineTo(5, -4.5);
    s.lineTo(5, 4.5);
    s.lineTo(-5, 4.5);
    s.closePath();
    const hole = new T.Path();
    hole.moveTo(-1.85, 1.15);
    hole.lineTo(-1.85, 3.5);
    hole.lineTo(1.85, 3.5);
    hole.lineTo(1.85, 1.15);
    hole.closePath();
    s.holes.push(hole);
    const floor = criarMalha(
      scene,
      new T.ShapeGeometry(s),
      new T.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.88,
        side: T.DoubleSide,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    // Shape usa eixo Y invertido ao rotacionar; deslocamos o recorte para o sofá.
    floor.rotation.x = Math.PI / 2;
    const hatch = criarCaixa(
      scene,
      [3.7, 0.14, 2.35],
      new T.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.88,
      }),
      [0, -0.07, 2.325],
    );
    criarCaixa(scene, [10, 0.17, 9], walls, [0, 3.5, 0]);
    criarCaixa(scene, [0.18, 3.5, 9], walls, [-5, 1.75, 0]);
    criarCaixa(scene, [0.18, 3.5, 9], walls, [5, 1.75, 0]);
    criarCaixa(scene, [10, 3.5, 0.18], walls, [0, 1.75, -4.5]);
    criarCaixa(scene, [10, 3.5, 0.18], walls, [0, 1.75, 4.5]);
    for (const z of [-4.38, 4.38])
      criarCaixa(scene, [10, 0.12, 0.08], wood, [0, 0.08, z]);
    for (const x of [-4.88, 4.88])
      criarCaixa(scene, [0.08, 0.12, 9], wood, [x, 0.08, 0]);
    const sofa = new T.Group();
    sofa.name = "Sofa_estofado";
    scene.add(sofa);
    sofa.position.set(0, 0, 2.4);
    criarCaixaArredondada(sofa, [3.15, 0.47, 1.12], 0.1, fabric, [0, 0.49, 0]);
    criarCaixaArredondada(
      sofa,
      [3.12, 0.72, 0.23],
      0.08,
      fabric,
      [0, 0.98, 0.45],
    );
    for (const x of [-1.47, 1.47])
      criarCaixaArredondada(sofa, [0.25, 0.56, 1.14], 0.07, fabric, [
        x,
        0.79,
        0,
      ]);
    for (const x of [-0.96, 0, 0.96]) {
      criarCaixaArredondada(
        sofa,
        [0.91, 0.13, 0.9],
        0.04,
        obterMaterial("#71785f", 0.98),
        [x, 0.79, -0.05],
      );
      criarTubo(
        sofa,
        [
          [x - 0.42, 0.865, -0.43],
          [x + 0.42, 0.865, -0.43],
          [x + 0.42, 0.865, 0.3],
        ],
        0.005,
        obterMaterial("#8b947a", 1),
      );
    }
    for (const x of [-1.2, 1.2])
      for (const z of [-0.38, 0.38])
        criarCilindro(sofa, 0.045, 0.038, 0.25, wood, [x, 0.16, z]);
    const tv = new T.Group();
    scene.add(tv);
    tv.position.set(0, 1.8, -4.29);
    criarCaixaArredondada(tv, [3.1, 1.77, 0.13], 0.035, dark, [0, 0, 0]);
    this.tvTarget = new T.WebGLRenderTarget(768, 432);
    const tvScreen = criarCaixa(
      tv,
      [2.97, 1.65, 0.012],
      new T.MeshBasicMaterial({
        map: this.tvTarget.texture,
      }),
      [0, 0, 0.079],
    );
    criarCaixa(scene, [3.5, 0.09, 0.72], wood, [0, 0.62, -3.95]);
    for (const x of [-1.5, 1.5])
      criarCaixa(scene, [0.06, 0.6, 0.6], wood, [x, 0.3, -3.95]);
    // PS5 personalizado: carenagens vermelhas, núcleo preto e iluminação vermelha.
    const consoleGroup = new T.Group();
    consoleGroup.position.set(1.07, 0.72, -3.95);
    scene.add(consoleGroup);
    criarCaixa(consoleGroup, [0.15, 0.7, 0.34], dark, [0, 0.35, 0]);
    for (const side of [-1, 1]) {
      const sh = new T.Shape();
      sh.moveTo(-0.2, 0);
      sh.bezierCurveTo(-0.19, 0.25, -0.23, 0.5, -0.16, 0.8);
      sh.lineTo(0.13, 0.76);
      sh.bezierCurveTo(0.2, 0.5, 0.16, 0.2, 0.16, 0);
      sh.closePath();
      const p = criarMalha(
        consoleGroup,
        new T.ExtrudeGeometry(sh, {
          depth: 0.014,
          bevelEnabled: true,
          bevelSize: 0.01,
          bevelThickness: 0.01,
          bevelSegments: 3,
        }),
        obterMaterial("#bd242b", 0.35),
        [side * 0.085, 0, 0],
        [0, Math.PI / 2, side * 0.06],
      );
    }
    criarCaixa(
      consoleGroup,
      [0.012, 0.65, 0.015],
      obterMaterial("#f0443e", 0.2, 0, {
        emissive: "#df202d",
        emissiveIntensity: 2,
      }),
      [-0.078, 0.35, 0.17],
    );
    const tvLight = adicionarLuzPontual(
      scene,
      "#5d8bdc",
      15,
      10,
      [0, 1.9, -3.6],
    );
    const lamp = new T.Group();
    scene.add(lamp);
    lamp.position.set(-3.35, 0, 1.9);
    criarCilindro(
      lamp,
      0.18,
      0.23,
      0.06,
      obterMaterial("#2b2921", 0.4, 0.6),
      [0, 0.03, 0],
    );
    criarCilindro(
      lamp,
      0.025,
      0.025,
      1.55,
      obterMaterial("#69644f", 0.4, 0.7),
      [0, 0.8, 0],
    );
    criarCilindro(
      lamp,
      0.23,
      0.43,
      0.45,
      obterMaterial("#b3a47a", 0.8),
      [0, 1.72, 0],
    );
    adicionarLuzPontual(scene, "#e6bc73", 15, 9, [-3.35, 1.65, 1.9]);
    const rug = criarCaixaArredondada(
      scene,
      [2.9, 0.018, 1.65],
      0.03,
      obterMaterial("#443f34", 1),
      [0, 0.02, 0.35],
    );
    for (let i = 0; i < 9; i++)
      criarCaixa(scene, [2.65, 0.002, 0.012], obterMaterial("#71624c", 1), [
        0,
        0.035,
        -0.35 + i * 0.17,
      ]);
    // Portas, molduras, cortinas, tomadas e objetos dão escala à primeira fase.
    criarCaixa(
      scene,
      [1.25, 2.65, 0.08],
      obterMaterial("#3a3c33", 0.9),
      [3, 1.325, 4.38],
    );
    for (const x of [2.32, 3.68])
      criarCaixa(scene, [0.07, 2.7, 0.1], wood, [x, 1.35, 4.35]);
    criarElipsoide(
      scene,
      [0.045, 0.045, 0.025],
      obterMaterial("#a19d80", 0.3, 0.7),
      [3.45, 1.2, 4.29],
    );
    for (let i = 0; i < 18; i++)
      criarCilindro(
        scene,
        0.05,
        0.05,
        2.5,
        obterMaterial(i % 2 ? "#4c5556" : "#59605d", 1),
        [-4.84, 1.85, -1.9 + i * 0.16],
        [0, 0, 0],
      );
    for (const x of [-2.8, 2.7]) {
      criarCaixa(scene, [0.45, 0.65, 0.055], wood, [x, 1.95, -4.35]);
      criarCaixa(scene, [0.36, 0.55, 0.012], obterMaterial("#adb7a1", 0.95), [
        x,
        1.95,
        -4.31,
      ]);
    }
    criarCaixa(
      scene,
      [0.1, 0.16, 0.02],
      obterMaterial("#aeb1a5", 0.6),
      [-4.86, 0.35, 2],
      [0, Math.PI / 2, 0],
    );
    const shaft = new T.Group();
    shaft.visible = false;
    scene.add(shaft);
    for (let i = 1; i < 8; i++) {
      const y = -i * 3.5;
      criarCaixa(shaft, [3.7, 0.1, 0.1], obterMaterial("#8f8d54", 0.9), [
        0,
        y,
        1.15,
      ]);
      criarCaixa(shaft, [0.1, 3.5, 2.35], obterMaterial("#4d5139", 0.95), [
        -1.85,
        y + 1.75,
        2.325,
      ]);
      criarCaixa(shaft, [0.1, 3.5, 2.35], obterMaterial("#55573b", 0.95), [
        1.85,
        y + 1.75,
        2.325,
      ]);
      adicionarLuzPontual(scene, "#a2ab67", 4, 5, [0, y + 1.8, 2]);
    }
    scene.add(this.axel.group);
    this.axel.group.position.set(0, 0, -0.7);
    scene.add(this.cachorro.group);
    this.cachorro.group.position.set(-1, 0, 0.8);
    this.decoracaoQuarto = decorarQuartoAxel(scene);
    this.natalQuarto = decorarQuartoNatal(scene);
    this.faroesteTV = criarFaroesteDaTV();
    this.tvScene = this.faroesteTV.cena;
    this.tvCamera = this.faroesteTV.camera;
    this.room = {
      scene,
      sofa,
      hatch,
      shaft,
      tvLight,
      screen: tvScreen,
    };
  }
  montarFase(level, index) {
    if (this.levelScene) {
      this.levelScene.traverse((o) => {
        if (o.isInstancedMesh) o.geometry.dispose();
      });
    }
    const scene = new T.Scene(),
      theme = index === 1 ? "#061012" : index === 2 ? "#140e0b" : "#15170e";
    scene.background = new T.Color(theme);
    scene.fog = new T.FogExp2(theme, 0.033);
    adicionarLuzAmbiente(scene, index === 1 ? "#7c9a92" : "#b2b58b", 0.39);
    const wallMaterial = new T.MeshStandardMaterial({
      map: this.wallMap,
      roughness: 0.96,
      color: index === 1 ? "#8ca298" : index === 2 ? "#9b836c" : "#c2b986",
      bumpMap: this.wallMap,
      bumpScale: 0.014,
    });
    const cells = [];
    for (let z = 0; z < level.height; z++)
      for (let x = 0; x < level.width; x++)
        if (
          level.map[z][x] === 1 &&
          [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].some(([dx, dz]) => level.map[z + dz]?.[x + dx] === 0)
        )
          cells.push([x, z]);
    const walls = new T.InstancedMesh(
      new T.BoxGeometry(TAMANHO_CELULA, ALTURA_PAREDE, TAMANHO_CELULA),
      wallMaterial,
      cells.length,
    );
    walls.castShadow = true;
    walls.receiveShadow = true;
    const matrix = new T.Matrix4();
    cells.forEach(([x, z], i) => {
      matrix.makeTranslation(
        (x + 0.5) * TAMANHO_CELULA,
        ALTURA_PAREDE / 2,
        (z + 0.5) * TAMANHO_CELULA,
      );
      walls.setMatrixAt(i, matrix);
    });
    scene.add(walls);
    const floorMap = this.floorMap.clone();
    floorMap.repeat.set(level.width, level.height);
    floorMap.needsUpdate = true;
    const ceilMap = this.ceilingMap.clone();
    ceilMap.repeat.set(level.width, level.height);
    ceilMap.needsUpdate = true;
    const fm = new T.MeshStandardMaterial({
      map: floorMap,
      roughness: 0.98,
      color: index === 1 ? "#8a9b93" : "#b1a780",
    });
    criarCaixa(
      scene,
      [level.width * TAMANHO_CELULA, 0.12, level.height * TAMANHO_CELULA],
      fm,
      [
        (level.width * TAMANHO_CELULA) / 2,
        -0.06,
        (level.height * TAMANHO_CELULA) / 2,
      ],
    );
    criarCaixa(
      scene,
      [level.width * TAMANHO_CELULA, 0.1, level.height * TAMANHO_CELULA],
      new T.MeshStandardMaterial({
        map: ceilMap,
        roughness: 0.95,
        color: "#97998b",
      }),
      [
        (level.width * TAMANHO_CELULA) / 2,
        ALTURA_PAREDE + 0.05,
        (level.height * TAMANHO_CELULA) / 2,
      ],
    );
    const fixturePositions = [];
    for (let z = 1; z < level.height - 1; z++)
      for (let x = 1; x < level.width - 1; x++)
        if (level.map[z][x] === 0 && (x + z) % 4 === 0)
          fixturePositions.push([
            (x + 0.5) * TAMANHO_CELULA,
            (z + 0.5) * TAMANHO_CELULA,
          ]);
    const fixtures = new T.InstancedMesh(
      new T.BoxGeometry(0.28, 0.07, 1.25),
      obterMaterial("#a8ae9a", 0.5, 0, {
        emissive: index === 1 ? "#8ba4a4" : "#afb48b",
        emissiveIntensity: 1.15,
      }),
      fixturePositions.length,
    );
    fixturePositions.forEach(([x, z], i) => {
      matrix.makeTranslation(x, ALTURA_PAREDE - 0.055, z);
      fixtures.setMatrixAt(i, matrix);
    });
    scene.add(fixtures);
    this.lightPool = Array.from(
      {
        length: 7,
      },
      () =>
        adicionarLuzPontual(
          scene,
          index === 1 ? "#9cc5c4" : "#d6d1a3",
          13,
          10,
          [0, 2.9, 0],
        ),
    );
    this.fixturePositions = fixturePositions;
    this.terminals = level.terminals.map((p, i) => {
      const t = criarTerminal(i);
      t.group.position.set(p.x, 0, p.z);
      t.group.rotation.y = Math.PI;
      scene.add(t.group);
      adicionarLuzPontual(scene, "#6cbdc5", 10, 6, [p.x, 1.5, p.z]);
      return t;
    });
    const exit = new T.Group();
    exit.position.set(level.exit.x, 0, level.exit.z);
    const door = criarCaixa(
      exit,
      [1.6, 2.55, 0.16],
      obterMaterial("#233e31", 0.7),
      [0, 1.275, 0],
    );
    criarCaixa(
      exit,
      [1.8, 0.35, 0.08],
      new T.MeshStandardMaterial({
        map: criarTexturaTexto("SAÍDA  →", "#113c25", "#d3f5c8"),
        emissive: "#8ac493",
        emissiveIntensity: 0.65,
      }),
      [0, 2.78, 0.05],
    );
    criarCilindro(
      exit,
      0.035,
      0.035,
      0.2,
      obterMaterial("#b0b6a4", 0.35, 0.7),
      [0.6, 1.17, 0.16],
      [0, 0, Math.PI / 2],
    );
    scene.add(exit);
    // Elementos de encontro, trechos industriais e pistas posicionados por setor.
    for (const [i, p] of level.cells.entries())
      if (i % 43 === 0) {
        const debris = new T.Group();
        debris.position.set(p.x, 0, p.z);
        for (let j = 0; j < 3; j++)
          criarCaixa(
            debris,
            [0.14, 0.05, 0.5],
            obterMaterial("#4c4b3d", 0.96),
            [(j - 1) * 0.18, 0.04 + j * 0.03, Math.sin(j) * 0.2],
            [0, j * 0.7, 0],
          );
        scene.add(debris);
      }
    for (const p of level.terminals) {
      criarCaixa(
        scene,
        [0.72, 0.08, 0.012],
        new T.MeshStandardMaterial({
          map: criarTexturaTexto("NÃO OLHE PARA TRÁS", "#544f37", "#aca77c"),
          roughness: 1,
        }),
        [p.x, 2.5, p.z - 0.6],
      );
    }
    this.ambientSenaiLight = adicionarLuzPontual(
      scene,
      "#3476be",
      7,
      7,
      [0, 1.8, 0],
    );
    scene.add(this.senai);
    scene.add(this.maicon.group);
    scene.add(this.cachorro.group);
    this.pugPos.set(level.spawn.x - 0.8, 0, level.spawn.z + 0.7);
    const gtaTexture = new T.TextureLoader().load("assets/gta.png");
    gtaTexture.colorSpace = T.SRGBColorSpace;
    this.gta = new T.Group();
    const medalMaterial = new T.MeshStandardMaterial({
      map: gtaTexture,
      transparent: true,
      roughness: 0.4,
      emissive: "#936ea8",
      emissiveIntensity: 0.5,
    });
    criarCaixa(this.gta, [0.74, 0.59, 0.07], medalMaterial, [0, 0, 0]);
    criarMalha(
      this.gta,
      new T.TorusGeometry(0.48, 0.02, 8, 48),
      obterMaterial("#a887c9", 0.4, 0.4, {
        emissive: "#5c397a",
        emissiveIntensity: 0.45,
      }),
      [0, 0, -0.03],
    );
    this.gtaPickups = (level.collectibles || []).map(() =>
      this.gta.clone(true),
    );
    this.gtaPickups.forEach((g) => scene.add(g));
    this.flashlight = new T.SpotLight(
      "#e5e9ce",
      32,
      23,
      Math.PI / 5,
      0.65,
      1.5,
    );
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.set(768, 768);
    this.flashlight.shadow.camera.near = 0.1;
    this.flashlight.shadow.camera.far = 28;
    scene.add(this.flashlight);
    scene.add(this.flashlight.target);
    decorarBackroomsNatal(scene, level, TAMANHO_CELULA, ALTURA_PAREDE);
    this.levelScene = scene;
    this.materiaisRealistas.preparar(scene);
    this.lastChapter = index;
  }
  atualizarSala(estado, time) {
    const { room, camera } = this;
    const p = estado.player;
    this.axel.group.visible = true;
    this.cachorro.group.visible = true;
    this.axel.group.position.set(
      p.x,
      estado.mode === "fall" ? estado.fallY : 0,
      p.z,
    );
    this.axel.group.rotation.y = p.yaw + Math.PI;
    this.axel.animate(time, estado.moving ? 2 : 0);
    this.cachorro.animate(time, estado.moving ? 3 : 0);
    if (estado.mode === "fall") {
      const t = estado.fallTime;
      room.shaft.visible = true;
      room.hatch.position.y = t > 1.6 ? -(t - 1.6) * 3 : -0.07;
      room.hatch.rotation.z = t > 1.6 ? (t - 1.6) * 0.7 : 0;
      room.sofa.position.y = t > 1.9 ? -((t - 1.9) ** 2) * 1.7 : 0;
      room.sofa.rotation.x = t > 1.9 ? (t - 1.9) * 0.16 : 0;
      this.axel.group.position.set(0, estado.fallY, 2.2);
      this.axel.limbs[0].rotation.x = -1.1;
      this.axel.limbs[2].rotation.x = -1.1;
      this.axel.group.rotation.z = t > 2 && !estado.reduced ? (t - 2) * 0.4 : 0;
      this.cachorro.group.position.set(0.7, estado.fallY + 0.3, 2.6);
      this.cachorro.group.rotation.x =
        t > 2 && !estado.reduced ? (t - 2) * 0.7 : 0;
      camera.position.set(2.7 - t * 0.18, 2.4 + estado.fallY * 0.7, 4.1);
      camera.lookAt(0, estado.fallY + 0.8, 2.2);
      camera.rotation.z =
        t > 2 && !estado.reduced
          ? Math.sin(t * 2) * Math.min(0.35, (t - 2) * 0.08)
          : 0;
    } else {
      const behind = new T.Vector3(
        p.x + Math.sin(p.yaw) * 3.2,
        2.2,
        p.z + Math.cos(p.yaw) * 3.2,
      );
      behind.x = Math.max(-4.65, Math.min(4.65, behind.x));
      behind.z = Math.max(-4.2, Math.min(4.2, behind.z));
      camera.position.lerp(behind, 0.12);
      camera.lookAt(p.x, 1.1, p.z);
      const target = new T.Vector3(p.x - 0.75, 0, p.z + 0.65);
      this.cachorro.group.position.lerp(target, 0.035);
      this.cachorro.group.rotation.y = Math.atan2(
        p.x - this.cachorro.group.position.x,
        p.z - this.cachorro.group.position.z,
      );
    }
    this.axel.body.rotation.x =
      estado.mode === "fall" && estado.fallTime < 2 ? -0.35 : 0;
    room.tvLight.intensity = 12 + Math.sin(time * 5) * 3;
    this.faroesteTV.atualizar(time, estado.tvX || 0, estado.mode === "tv");
    this.decoracaoQuarto.luz.intensity = 10 + Math.sin(time * 0.7) * 1.4;
    const destinoAnterior = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.tvTarget);
    this.renderer.render(this.tvScene, this.tvCamera);
    this.renderer.setRenderTarget(destinoAnterior);
    this.renderer.render(room.scene, camera);
  }
  montarPorto(fase) {
    montarLabirintoAlisanave(this.alisanave, fase);
    this.materiaisRealistas.preparar(this.alisanave.porto, false);
  }
  desenhar(estado, time) {
    this.qualidadeAtual = estado.quality;
    this.figurantesAtivos = estado.figurantes !== false;
    if (estado.mode === "loading") return;
    if (
      estado.mode === "aero" ||
      estado.mode === "painelProgramacao" ||
      (estado.mode === "paused" && estado.previousMode === "aero")
    ) {
      desenharFrutigerAero(this, estado);
      return;
    }
    if (
      estado.mode === "castelo" ||
      (estado.mode === "paused" && estado.previousMode === "castelo") ||
      estado.mode === "painelCastelo"
    ) {
      desenharCastelo(this, estado, time);
      return;
    }
    if (
      estado.mode === "alisanave" ||
      (estado.mode === "paused" && estado.previousMode === "alisanave")
    ) {
      desenharAlisanave(this, estado, time);
      return;
    }
    if (!this.room) return;
    if (estado.mode === "menu") {
      desenharMenu(this, estado, time);
      return;
    }
    if (
      ["dungeon", "ride"].includes(estado.mode) ||
      (estado.mode === "paused" &&
        ["dungeon", "ride"].includes(estado.previousMode))
    ) {
      desenharCalabouco(this, estado);
      return;
    }
    if (
      estado.mode === "classroom" ||
      (estado.mode === "paused" && estado.previousMode === "classroom")
    ) {
      desenharSalaDeAula(this, estado);
      return;
    }
    if (
      ["home", "tv", "fall"].includes(estado.mode) ||
      (estado.mode === "paused" && ["home", "tv"].includes(estado.previousMode))
    ) {
      this.atualizarSala(estado, time);
      return;
    }
    if (!this.levelScene) return;
    const scene = this.levelScene,
      p = estado.player,
      c = this.camera,
      isMenu = estado.mode === "menu";
    if (isMenu) {
      const spawn = estado.level.spawn;
      c.position.set(spawn.x + 2.3, 1.55, spawn.z + 4);
      c.lookAt(spawn.x + 9, 1.5, spawn.z + 1);
    } else {
      const shake =
        estado.terror > 0.6
          ? Math.sin(time * 21) * (estado.terror - 0.6) * 0.018
          : 0;
      c.position.set(
        p.x,
        (estado.agachado ? 1.0 : 1.64) +
          (estado.moving
            ? Math.sin(time * (estado.sprinting ? 14 : 9)) * 0.035
            : Math.sin(time * 2) * 0.005),
        p.z,
      );
      c.rotation.set(p.pitch + shake, p.yaw, shake * 0.4, "YXZ");
      c.fov = T.MathUtils.lerp(c.fov, estado.sprinting ? 83 : 73, 0.08);
      c.updateProjectionMatrix();
    }
    const enemy = estado.level.enemy;
    this.senai.position.set(enemy.x, Math.sin(time * 10) * 0.055, enemy.z);
    this.senai.rotation.y = Math.atan2(p.x - enemy.x, p.z - enemy.z);
    this.senai.children
      .slice(1)
      .forEach(
        (l, i) => (l.rotation.x = Math.sin(time * 18 + i * Math.PI) * 0.55),
      );
    this.senai.visible = !estado.enemyDormant || isMenu;
    this.ambientSenaiLight.position.set(enemy.x, 1.8, enemy.z);
    const m = estado.level.maicon;
    this.maicon.group.visible = m.active || estado.throwing;
    for (const [i, g] of (this.gtaPickups || []).entries()) {
      const logo = estado.level.collectibles[i];
      g.visible = !!logo && !logo.used && !isMenu;
      if (logo) {
        g.position.set(logo.x, 1.2 + Math.sin(time * 2 + i) * 0.12, logo.z);
        g.rotation.y = time * 0.65 + i;
      }
    }
    if (estado.throwing) {
      const a = estado.throwProgress,
        from = estado.throwFrom,
        to = estado.throwTo;
      this.maicon.group.position.set(
        T.MathUtils.lerp(from.x, to.x, a),
        Math.sin(a * Math.PI) * 4.4 + 0.15,
        T.MathUtils.lerp(from.z, to.z, a),
      );
      this.maicon.group.rotation.set(
        a * Math.PI * 4,
        Math.atan2(to.x - from.x, to.z - from.z),
        0.5,
      );
      this.maicon.animate(time, 0, false);
    } else if (m.active) {
      this.maicon.group.position.set(m.x, 0, m.z);
      this.maicon.group.rotation.set(0, Math.atan2(p.x - m.x, p.z - m.z), 0);
      this.maicon.animate(time, m.stun > 0 ? 0 : 5, estado.whip > 0);
    }
    const pugTarget = new T.Vector3(
      p.x - Math.sin(p.yaw) * 1.8 - Math.cos(p.yaw) * 0.85,
      0,
      p.z - Math.cos(p.yaw) * 1.8 + Math.sin(p.yaw) * 0.85,
    );
    if (estado.mode === "playing") {
      if (estado.walkablePug(pugTarget.x, pugTarget.z)) {
        this.pugPos.lerp(pugTarget, 0.055);
      }
      if (this.pugPos.distanceTo(new T.Vector3(p.x, 0, p.z)) > 5)
        this.pugPos.copy(pugTarget);
    }
    this.cachorro.group.position.copy(this.pugPos);
    this.cachorro.group.rotation.y = Math.atan2(
      p.x - this.pugPos.x,
      p.z - this.pugPos.z,
    );
    this.cachorro.animate(time, estado.moving ? 4 : 0);
    this.cachorro.group.visible = !isMenu;
    for (let i = 0; i < this.terminals.length; i++) {
      const done = estado.level.terminals[i].done,
        t = this.terminals[i];
      t.guia.visible = !done;
      t.farol.intensity = done ? 2 : 12;
      t.guia.rotation.y = Math.atan2(
        p.x - estado.level.terminals[i].x,
        p.z - estado.level.terminals[i].z,
      );
      if (done && !t.done) {
        t.screenMaterial.map = criarTexturaTexto(
          "✓ CIRCUITO ATIVO",
          "#061a0c",
          "#9ce6a2",
          512,
          256,
        );
        t.screenMaterial.emissive.set("#70ae80");
        t.screenMaterial.needsUpdate = true;
        t.done = true;
      }
    }
    const nearest = [...this.fixturePositions]
      .sort(
        (a, b) =>
          Math.hypot(a[0] - p.x, a[1] - p.z) -
          Math.hypot(b[0] - p.x, b[1] - p.z),
      )
      .slice(0, 7);
    nearest.forEach(([x, z], i) => {
      this.lightPool[i].position.set(x, 2.85, z);
      const bad = Math.sin(time * 0.8 + x + z) > 0.98;
      this.lightPool[i].intensity = bad ? 2 : 12;
    });
    this.flashlight.position.copy(c.position);
    const dir = new T.Vector3(0, 0, -1).applyEuler(c.rotation);
    this.flashlight.target.position.copy(c.position).addScaledVector(dir, 9);
    this.flashlight.intensity = estado.blackout
      ? 5
      : estado.flash > 0
        ? 100
        : 32;
    this.renderer.toneMappingExposure = estado.blackout ? 0.48 : 1.18;
    this.renderer.render(scene, c);
    this.armaPendente =
      Boolean(this.controller) &&
      (["playing", "map", "editor"].includes(estado.mode) ||
        (estado.mode === "paused" && estado.previousMode === "playing"));
  }
  desenharArma(estado, time) {
    const hands = primeiraPessoaAtiva(estado) && estado.maos !== false;
    if (!this.armaPendente && !hands) return;
    this.maosFPS.group.visible = hands;
    this.controller.visible = !!this.armaPendente;
    const f =
      estado.mode === "aero"
        ? estado.aero
        : estado.mode === "castelo"
          ? estado.castelo
          : estado.mode === "alisanave"
            ? estado.porto
            : estado;
    const t = estado.mode === "paused" ? this.ultimoTempoMaos || 0 : time;
    this.ultimoTempoMaos = t;
    this.maosFPS.animate(
      t,
      f?.movendo ?? estado.moving,
      f?.correndo ?? estado.sprinting,
      estado.flash > 0 ? 1 : 0,
    );
    this.weaponRig.position.set(
      Math.sin(time * 7) * 0.002,
      estado.moving ? Math.sin(time * 12) * 0.009 : 0,
      0,
    );
    this.weaponRig.rotation.z = estado.flash > 0 ? -0.18 : 0;
    if (hands && this.armaPendente)
      this.maosFPS.segurarControle(this.controller);
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    this.renderer.render(this.weaponScene, this.weaponCamera);
    this.renderer.autoClear = true;
  }
  reiniciarSala() {
    if (!this.room) return;
    this.room.hatch.position.set(0, -0.07, 2.325);
    this.room.hatch.rotation.set(0, 0, 0);
    this.room.sofa.position.set(0, 0, 2.4);
    this.room.sofa.rotation.set(0, 0, 0);
    this.room.shaft.visible = false;
    this.axel.group.rotation.set(0, 0, 0);
    this.cachorro.group.rotation.set(0, 0, 0);
    this.room.scene.add(this.axel.group);
    this.room.scene.add(this.cachorro.group);
    this.camera.position.set(0, 2.3, 3);
  }
}
