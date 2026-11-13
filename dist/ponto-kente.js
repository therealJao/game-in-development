import { povoarCenario } from "./figurantes.js";
import { carregarPeugeot } from "./peugeot-307.js";
import { criarCartaoPix, atualizarCameraQr } from "./camera-pix.js";
// Ponto Kente: fachada amarela e vermelha reinterpretada com vidro, água e luzes Aero.
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarMalha,
  criarTubo,
  obterMaterial,
  criarTexturaTexto,
  criarAxel,
} from "./modelos.js";
import { criarNaverdachi } from "./modelos-frutiger-aero.js";
import { criarCeu } from "./efeitos-visuais.js";
import {
  carregarPoliticoCozinha,
  animarPoliticoCozinha,
  animarPoliticoCalmo,
} from "./politicos-cozinha.js";
import { TEMPOS_PONTO_KENTE } from "./regras-ponto-kente.js";
export function criarLanche() {
  const g = new T.Group(),
    pao = obterMaterial("#cf8b3c", 0.75),
    branco = obterMaterial("#ead1a0", 0.7);
  criarMalha(
    g,
    new T.SphereGeometry(0.24, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    pao,
    [0, 0.07, 0],
    [0, 0, 0],
    [1, 0.62, 1],
  );
  criarCilindro(g, 0.235, 0.21, 0.06, pao, [0, -0.08, 0]);
  criarCilindro(
    g,
    0.22,
    0.22,
    0.055,
    obterMaterial("#573b26", 0.95),
    [0, -0.025, 0],
  );
  criarCaixa(
    g,
    [0.36, 0.012, 0.36],
    obterMaterial("#ffc339", 0.6),
    [0, 0.013, 0],
    [0, 0.3, 0],
  );
  criarCilindro(
    g,
    0.21,
    0.21,
    0.02,
    obterMaterial("#c94132", 0.7),
    [0, 0.04, 0],
  );
  const folhas = [];
  for (let i = 0; i <= 32; i++) {
    const a = (i * Math.PI) / 16;
    folhas.push([
      Math.cos(a) * (0.22 + Math.sin(a * 7) * 0.025),
      0.055 + Math.cos(a * 5) * 0.012,
      Math.sin(a) * (0.22 + Math.sin(a * 7) * 0.025),
    ]);
  }
  criarTubo(g, folhas, 0.017, obterMaterial("#70aa43", 0.8));
  for (let i = 0; i < 18; i++) {
    const a = i * 2.4,
      r = 0.05 + (i % 4) * 0.042;
    criarElipsoide(
      g,
      [0.009, 0.004, 0.016],
      branco,
      [
        Math.cos(a) * r,
        0.073 + 0.145 * Math.sqrt(1 - (r * r) / 0.0576),
        Math.sin(a) * r,
      ],
      [0, a, 0.2],
    );
  }
  return g;
}
// Medidas e posições seguem a área desenhada à esquerda da planta; o desenho à direita é a legenda.
export async function criarPontoKente() {
  const scene = new T.Scene();
  scene.background = new T.Color("#90cce5");
  scene.fog = new T.Fog("#a6d9e3", 45, 140);
  criarCeu(scene);
  scene.add(new T.HemisphereLight("#eefaff", "#687779", 2));
  const sol = new T.DirectionalLight("#fff1db", 2.1);
  sol.position.set(-10, 20, 15);
  scene.add(sol);
  const branco = obterMaterial("#e6e7dc", 0.78),
    piso = obterMaterial("#b6bbb5", 0.8),
    laranja = obterMaterial("#d58a51", 0.88),
    vermelho = obterMaterial("#b52d32", 0.55),
    metal = obterMaterial("#9faeb3", 0.27, 0.65),
    preto = obterMaterial("#202728", 0.55),
    azulejo = obterMaterial("#e2e8e4", 0.3);
  const vidro = new T.MeshPhysicalMaterial({
    color: "#b5e7ed",
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: T.DoubleSide,
    clearcoat: 1,
  });
  criarCaixa(scene, [70, 0.25, 60], obterMaterial("#8dbf94", 1), [0, -0.35, 0]);
  criarCaixa(
    scene,
    [35, 0.08, 7],
    obterMaterial("#8e9393", 0.9),
    [0, -0.11, 9],
  );
  criarCaixa(
    scene,
    [35, 0.08, 9],
    obterMaterial("#333d44", 0.95),
    [0, -0.13, 17],
  );
  criarCaixa(scene, [9, 0.18, 15.2], piso, [0, -0.09, -1.2]);
  const tiles = new T.InstancedMesh(
      new T.BoxGeometry(0.49, 0.018, 0.49),
      azulejo,
      18 * 30,
    ),
    matriz = new T.Object3D();
  let n = 0;
  scene.add(tiles);
  for (let x = 0; x < 18; x++)
    for (let z = 0; z < 30; z++) {
      matriz.position.set(-4.25 + x * 0.5, 0.015, -8.5 + z * 0.5);
      matriz.updateMatrix();
      tiles.setMatrixAt(n, matriz.matrix);
      tiles.setColorAt(n++, new T.Color((x + z) % 3 ? "#d8ddd5" : "#c9d0c8"));
    }
  // Construção retangular, fachada fiel, portas de alumínio e faixas vermelha/amarela.
  criarCaixa(scene, [0.2, 4.4, 15], branco, [-4.5, 2.2, -1.25]);
  criarCaixa(scene, [0.2, 4.4, 15], branco, [4.5, 2.2, -1.25]);
  criarCaixa(scene, [9, 4.4, 0.2], branco, [0, 2.2, -8.75]);
  const teto = criarCaixa(scene, [9, 0.14, 15], branco, [0, 4.45, -1.25]);
  criarCaixa(scene, [1.2, 3.15, 0.22], laranja, [-3.9, 1.575, 6.25]);
  criarCaixa(scene, [2.25, 3.15, 0.22], branco, [3.375, 1.575, 6.25]);
  const portas = [];
  for (let x = -3.27; x <= 2.26; x += 1.1) {
    criarCaixa(scene, [0.065, 3.15, 0.09], metal, [x, 1.575, 6.3]);
    const painel = criarCaixa(scene, [1.035, 3.05, 0.035], vidro, [
      x + 0.53,
      1.575,
      6.26,
    ]);
    if (x < -2.5) portas.push(painel);
  }
  criarCaixa(scene, [5.5, 0.065, 0.09], metal, [-0.5, 0.04, 6.3]);
  criarCaixa(scene, [5.5, 0.065, 0.09], metal, [-0.5, 3.1, 6.3]);
  const faixaV = criarCaixa(
    scene,
    [5.5, 0.17, 0.045],
    vermelho,
    [-0.5, 1.31, 6.33],
  );
  const faixaA = criarCaixa(
    scene,
    [5.5, 0.19, 0.045],
    obterMaterial("#e9c65d", 0.6),
    [-0.5, 1.13, 6.33],
  );
  for (const x of [-2.38, -2.23])
    criarCilindro(scene, 0.015, 0.015, 0.45, metal, [x, 1.43, 6.37]);
  const foto = await new T.TextureLoader().loadAsync(
    new URL("assets/ponto-kente/fachada.png", import.meta.url).href,
  );
  foto.colorSpace = T.SRGBColorSpace;
  foto.anisotropy = 8;
  const placa = (recorte, tamanho, pos) => {
    const tex = foto.clone();
    tex.needsUpdate = true;
    const [x, y, w, h] = recorte;
    tex.repeat.set(w / 590, h / 400);
    tex.offset.set(x / 590, 1 - (y + h) / 400);
    const m = new T.MeshStandardMaterial({
      map: tex,
      roughness: 0.65,
      color: "#ffffff",
    });
    return criarCaixa(scene, [...tamanho, 0.045], m, pos);
  };
  criarCaixa(
    scene,
    [9.15, 1.55, 0.35],
    obterMaterial("#ead69a", 0.7),
    [0, 3.95, 6.2],
  );
  placa([60, 130, 505, 82], [9.05, 1.48], [0, 3.95, 6.4]);
  placa([303, 94, 197, 39], [3.65, 0.72], [1.35, 5.1, 6.22]);
  placa([320, 27, 165, 66], [2.7, 1.08], [1.65, 5.97, 6.15]);
  placa([418, 214, 140, 142], [2.16, 2.19], [3.37, 1.87, 6.39]);
  placa([78, 233, 36, 59], [0.47, 0.77], [-3.9, 1.38, 6.39]);
  // Vizinhos da fotografia: parede cinza com janelas, lateral azul e pavimentação.
  criarCaixa(
    scene,
    [8, 13, 13],
    obterMaterial("#b0b4b2", 0.95),
    [-8.6, 6.5, -1],
  );
  for (let x = -11; x < -5; x += 2.2)
    for (const y of [4.2, 7, 10]) {
      criarCaixa(scene, [1.3, 1.2, 0.05], obterMaterial("#687576", 0.3), [
        x,
        y,
        5.55,
      ]);
      criarCaixa(scene, [1, 0.38, 0.4], branco, [x, y - 0.8, 5.7]);
    }
  criarCaixa(
    scene,
    [7, 9, 10],
    obterMaterial("#637bc2", 0.8),
    [8.1, 4.5, -0.5],
  );
  // Banheiro à esquerda, balcão ao fundo, geladeira ao centro e cozinha à direita.
  criarCaixa(scene, [1.8, 2.9, 0.12], branco, [-3.6, 1.45, 0.0]);
  criarCaixa(scene, [1.8, 2.9, 0.12], branco, [-3.6, 1.45, 2.25]);
  for (const z of [0.35, 1.95])
    criarCaixa(scene, [0.12, 2.9, 0.65], branco, [-2.72, 1.45, z]);
  criarCaixa(
    scene,
    [0.09, 2.3, 0.92],
    obterMaterial("#75909b"),
    [-2.74, 1.15, 1.15],
  );
  const label = (txt, w, h, pos, bg = "#e5e7d9", fg = "#263b41") =>
    criarCaixa(
      scene,
      [w, h, 0.025],
      new T.MeshStandardMaterial({
        map: criarTexturaTexto(txt, bg, fg, 1024, 160),
      }),
      pos,
    );
  const banheiro = label("BANHEIRO", 1.1, 0.22, [-2.64, 2.5, 1.15]);
  banheiro.rotation.y = Math.PI / 2;
  criarCaixa(scene, [3.4, 1.15, 1.05], vermelho, [-0.2, 0.575, -4.55]);
  criarCaixa(
    scene,
    [3.55, 0.09, 1.18],
    obterMaterial("#303b3b", 0.2, 0.15),
    [-0.2, 1.2, -4.55],
  );
  criarCaixa(scene, [0.95, 1.95, 0.85], branco, [1.5, 0.98, -3.1]);
  criarCaixa(scene, [0.72, 1.56, 0.04], vidro, [1.5, 1.03, -2.65]);
  for (let y = 0.4; y < 1.8; y += 0.4) {
    criarCaixa(scene, [0.7, 0.025, 0.64], metal, [1.5, y, -3.1]);
    for (let i = 0; i < 4; i++)
      criarCilindro(
        scene,
        0.035,
        0.035,
        0.2,
        obterMaterial(i % 2 ? "#df9a42" : "#60acb3", 0.25),
        [1.25 + i * 0.16, y + 0.12, -3.05],
      );
  }
  criarCaixa(scene, [4.55, 1.05, 0.12], branco, [2.2, 0.52, -4.2]);
  label("COZINHA", 1.8, 0.3, [2.5, 3.85, -4.12]);
  // Bancadas de inox, fogão, coifa, pia e prateleiras compõem a cozinha de verdade.
  criarCaixa(scene, [3.4, 0.92, 0.65], metal, [2.2, 0.46, -8.2]);
  criarCaixa(scene, [0.8, 0.92, 2], metal, [4.0, 0.46, -6.5]);
  criarCaixa(scene, [1.5, 0.12, 0.8], preto, [2.4, 1.0, -8.1]);
  for (const x of [2, 2.7])
    criarCilindro(scene, 0.17, 0.17, 0.05, metal, [x, 1.08, -8.05]);
  criarCaixa(scene, [1.8, 0.35, 1.0], metal, [2.4, 2.7, -8.0]);
  criarCaixa(scene, [0.5, 1.25, 0.4], metal, [2.4, 3.35, -8.05]);
  criarCaixa(scene, [0.7, 0.09, 0.53], preto, [4, 1, -6.25]);
  criarTubo(
    scene,
    [
      [4, 1.05, -6.5],
      [4, 1.5, -6.5],
      [4, 1.5, -6.25],
      [4, 1.3, -6.25],
    ],
    0.025,
    metal,
  );
  for (const y of [1.65, 2.25]) {
    criarCaixa(scene, [0.45, 0.06, 2.5], metal, [4.15, y, -6.4]);
    for (let i = 0; i < 4; i++)
      criarCilindro(scene, 0.08, 0.08, 0.2, branco, [
        4.1,
        y + 0.14,
        -7.1 + i * 0.5,
      ]);
  }
  for (let i = 0; i < 7; i++)
    criarCaixa(scene, [0.22, 0.035, 0.2], branco, [2, 0.98 + i * 0.035, -7.7]);
  const terminal = new T.Group();
  scene.add(terminal);
  terminal.position.set(0.35, 1.28, -4.35);
  criarCaixa(terminal, [0.64, 0.45, 0.08], preto, [0, 0.17, 0]);
  const tela = new T.MeshBasicMaterial({
    map: criarTexturaTexto("PEDIDOS </>", "#123d4c", "#8ff1d6", 512, 160),
  });
  criarCaixa(terminal, [0.57, 0.35, 0.02], tela, [0, 0.17, 0.052]);
  criarCaixa(terminal, [0.16, 0.2, 0.16], preto, [0, -0.13, 0]);
  const mesa = (x, z, redonda) => {
    if (redonda) criarCilindro(scene, 0.57, 0.57, 0.07, vermelho, [x, 0.87, z]);
    else criarCaixa(scene, [0.75, 0.07, 0.7], vermelho, [x, 0.87, z]);
    criarCilindro(scene, 0.055, 0.25, 0.83, metal, [x, 0.42, z]);
    for (const lado of [-1, 1]) {
      const cx = x + lado * 0.86;
      criarCaixa(scene, [0.48, 0.07, 0.45], branco, [cx, 0.45, z]);
      criarCaixa(scene, [0.48, 0.62, 0.065], branco, [
        cx + lado * 0.22,
        0.78,
        z,
      ]);
      for (const dx of [-0.18, 0.18])
        for (const dz of [-0.17, 0.17])
          criarCilindro(scene, 0.018, 0.018, 0.45, metal, [
            cx + dx,
            0.23,
            z + dz,
          ]);
    }
  };
  mesa(-3.25, -3.05, false);
  mesa(-3.25, -1.25, false);
  mesa(2.6, 0.35, true);
  mesa(2.6, 3.7, true);
  // Apenas os detalhes de água e vidro preservam o tema Aero sem alterar a planta enviada.
  criarCaixa(scene, [0.18, 2.0, 2.5], vidro, [-4.32, 1.7, 4]);
  const peixes = [];
  for (let i = 0; i < 9; i++)
    peixes.push(
      criarElipsoide(
        scene,
        [0.06, 0.06, 0.14],
        obterMaterial(i % 2 ? "#40b4c9" : "#e9b649", 0.3),
        [-4.22, 1.1 + (i % 3) * 0.5, 3.1 + i * 0.23],
      ),
    );
  for (const z of [-2, 2.8]) {
    criarCaixa(
      scene,
      [4, 0.045, 0.25],
      obterMaterial("#faf9ec", 0.25, 0, {
        emissive: "#e5faff",
        emissiveIntensity: 0.45,
      }),
      [0, 4.23, z],
    );
    const luz = new T.PointLight("#e2faff", 14, 9, 2);
    luz.position.set(0, 3.7, z);
    scene.add(luz);
  }
  const luzCozinha = new T.PointLight("#ffe5bb", 20, 8, 2);
  luzCozinha.position.set(2.2, 3.3, -6.2);
  scene.add(luzCozinha);
  const video = document.createElement("video");
  video.src = new URL(
    "assets/ponto-kente/yuri-quadro.mp4",
    import.meta.url,
  ).href;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "auto";
  video.load();
  const videoTex = new T.VideoTexture(video);
  videoTex.colorSpace = T.SRGBColorSpace;
  const meme = new T.Group();
  scene.add(meme);
  meme.position.set(4.36, 2.35, 1.5);
  meme.rotation.y = -Math.PI / 2;
  criarCaixa(meme, [1.95, 1.9, 0.08], preto, [0, 0, 0]);
  criarMalha(
    meme,
    new T.PlaneGeometry(1.85, 1.78),
    new T.MeshBasicMaterial({ map: videoTex, toneMapped: false }),
    [0, 0, 0.048],
  );
  const memeCozinha = meme.clone();
  memeCozinha.position.set(0.75, 2.75, -8.59);
  memeCozinha.rotation.y = 0;
  memeCozinha.scale.setScalar(0.8);
  scene.add(memeCozinha);
  const axel = criarAxel(),
    nav = criarNaverdachi();
  scene.add(axel.group, nav.group);
  const comidaAxel = criarLanche(),
    comidaNav = criarLanche();
  scene.add(comidaAxel, comidaNav);
  for (const x of [2.2, 3.0]) {
    criarCilindro(scene, 0.14, 0.14, 0.025, branco, [x, 0.93, 3.7]);
    criarCilindro(scene, 0.065, 0.055, 0.28, vidro, [x, 1.06, 3.95]);
  }
  const [bolsonaro, lula, peugeot] = await Promise.all([
    carregarPoliticoCozinha("bolsonaro"),
    carregarPoliticoCozinha("lula"),
    carregarPeugeot(),
  ]);
  scene.add(bolsonaro.grupo, lula.grupo, peugeot.grupo);
  const telefone3D = new T.Group();
  scene.add(telefone3D);
  criarCaixa(
    telefone3D,
    [0.14, 0.28, 0.018],
    obterMaterial("#caa8ac", 0.2, 0.5),
  );
  const recibo = document.createElement("canvas");
  recibo.width = 300;
  recibo.height = 600;
  const rc = recibo.getContext("2d");
  rc.fillStyle = "#ffffff";
  rc.fillRect(0, 0, 300, 600);
  rc.fillStyle = "#820ad1";
  rc.fillRect(0, 0, 300, 115);
  rc.fillStyle = "#ffffff";
  rc.font = "bold 35px Arial";
  rc.textAlign = "center";
  rc.fillText("AlisaBank", 150, 70);
  rc.fillStyle = "#287b4c";
  rc.font = "bold 55px Arial";
  rc.fillText("✓", 150, 220);
  rc.fillStyle = "#1c1b20";
  rc.font = "bold 29px Arial";
  rc.fillText("Pix realizado", 150, 290);
  rc.font = "bold 41px Arial";
  rc.fillText("R$ 67,00", 150, 360);
  rc.font = "20px Arial";
  rc.fillText("Ponto Kente", 150, 425);
  rc.fillText("Comprovante do jogo", 150, 520);
  const texRecibo = new T.CanvasTexture(recibo);
  texRecibo.colorSpace = T.SRGBColorSpace;
  criarMalha(
    telefone3D,
    new T.PlaneGeometry(0.125, 0.25),
    new T.MeshBasicMaterial({ map: texRecibo, toneMapped: false }),
    [0, 0, 0.011],
  );
  telefone3D.visible = false;
  const cartao = criarCartaoPix(scene);
  cartao.grupo.visible = false;
  return {
    figurantes: povoarCenario(scene, "ponto"),
    scene,
    teto,
    axel,
    nav,
    comidaAxel,
    comidaNav,
    bolsonaro,
    lula,
    video,
    peixes,
    terminal,
    luzCozinha,
    cartao,
    telefone3D,
    peugeot,
    portas,
    faixas: [faixaV, faixaA],
  };
}
export function desenharComemoracao(view, c, f, ativo = true) {
  c.figurantes.update(f.animacao, view.qualidadeAtual, view.figurantesAtivos);
  const etapa = f.etapa,
    t = f.tempo,
    a = f.animacao,
    cam = view.camera,
    explorar = etapa === "lanchoneteExplorar",
    final = etapa === "lanchoneteFinal",
    comendo = final;
  if (ativo) {
    if (c.video.paused) c.video.play().catch(() => {});
  } else c.video.pause();
  const caixa = ["lanchonetePagar", "pagamento", "agradecimento"].includes(
      etapa,
    ),
    saida = etapa === "saidaPonto";
  if (c.peugeot.grupo.parent !== c.scene) c.scene.add(c.peugeot.grupo);
  c.peugeot.grupo.visible = (final && t >= 7) || caixa || saida;
  c.peugeot.grupo.position.set(0.4, 0, 13);
  c.peugeot.grupo.rotation.set(0, Math.PI / 2, 0);
  c.peugeot.passageiros?.forEach((g) => (g.visible = saida && t >= 6));
  c.axel.group.visible = !(saida && t >= 6);
  c.nav.group.visible = etapa !== "pagamento" && !(saida && t >= 6);
  c.axel.animate(
    a,
    (explorar && f.movendo) || etapa === "lanchonetePagar" || saida ? 3 : 0,
  );
  c.nav.animate(a, 0);
  c.axel.group.rotation.set(0, Math.PI / 2, 0);
  c.nav.group.rotation.set(0, -Math.PI / 2, 0);
  c.axel.group.position.set(1.74, 0.0, 3.7);
  c.nav.group.position.set(3.46, -0.15, 3.7);
  if (!explorar)
    c.axel.limbs[0].rotation.x = c.axel.limbs[2].rotation.x = -1.15;
  c.nav.legs.forEach((l) => (l.rotation.x = -1.25));
  c.nav.joelhos.forEach((j) => (j.rotation.x = 1.2));
  c.nav.head.rotation.y = Math.sin(a * 0.7) * 0.04;
  c.nav.head.rotation.x = Math.sin(a * 2) * 0.02;
  c.axel.limbs[1].rotation.x = -0.55;
  c.nav.arms.forEach((l) => (l.rotation.x = -0.6));
  if (etapa === "lanchonete" && t >= 12 && t < 22) {
    c.axel.limbs[1].rotation.x = -1.0 + Math.sin(a * 6) * 0.15;
    c.nav.head.rotation.y = -0.25;
    c.nav.arms[0].rotation.x = -1.1;
  }
  if (explorar) {
    c.axel.group.position.set(f.jogador.x, 0, f.jogador.z);
    c.axel.group.rotation.y = f.jogador.yaw;
  }
  c.comidaAxel.visible = c.comidaNav.visible = comendo;
  const mordidaA = comendo ? Math.max(0, Math.sin(a * 1.7)) : 0,
    mordidaN = comendo ? Math.max(0, Math.sin(a * 1.7 + 1)) : 0;
  c.comidaAxel.position.set(2.15 - mordidaA * 0.25, 0.95 + mordidaA * 0.5, 3.7);
  c.comidaNav.position.set(3.05 + mordidaN * 0.13, 0.95 + mordidaN * 0.5, 3.7);
  if (comendo) {
    c.axel.limbs[1].rotation.x = -0.6 - mordidaA * 0.65;
    c.nav.arms[0].rotation.x = -1.0 - mordidaN * 0.9;
    const maoNav = c.nav.cotovelos[0].localToWorld(
      new T.Vector3(0, -0.28, 0.05),
    );
    c.comidaNav.position.copy(maoNav);
    c.comidaNav.position.y += 0.06;
    c.comidaNav.scale.setScalar(0.75);
    const maoAxel = c.axel.limbs[1].localToWorld(
      new T.Vector3(-0.12, -0.25, 0.12),
    );
    c.comidaAxel.position.copy(maoAxel);
    c.comidaAxel.position.y += 0.07;
  }
  c.bolsonaro.grupo.position.set(1.55, 0, -6.3);
  c.lula.grupo.position.set(2.7, 0, -6.3);
  c.bolsonaro.grupo.rotation.y = Math.PI / 2;
  c.lula.grupo.rotation.y = -Math.PI / 2;
  animarPoliticoCozinha(c.bolsonaro, a, 0);
  animarPoliticoCozinha(c.lula, a, 1);
  c.cartao.grupo.visible = ["lanchonetePagar", "pagamento"].includes(etapa);
  c.telefone3D.visible = etapa === "agradecimento";
  if (caixa || saida || (final && t >= 7)) {
    c.bolsonaro.grupo.position.set(1.55, 0, -5.4);
    c.lula.grupo.position.set(0.15, 0, -4.75);
    c.bolsonaro.grupo.rotation.y = c.lula.grupo.rotation.y = 0;
    animarPoliticoCalmo(c.bolsonaro, a, false);
    animarPoliticoCalmo(c.lula, a, caixa && etapa !== "agradecimento");
  }
  if (caixa) {
    const progresso = etapa === "lanchonetePagar" ? Math.min(1, t / 5) : 1;
    const caminho = new T.CatmullRomCurve3([
      new T.Vector3(3.46, 0, 3.7),
      new T.Vector3(3.8, 0, 2.25),
      new T.Vector3(0.9, 0, 1.6),
      new T.Vector3(-0.15, 0, -2.85),
    ]);
    c.nav.group.position.copy(caminho.getPoint(progresso));
    c.nav.group.rotation.y = Math.PI;
    c.axel.group.position.set(0.9, 0, 3.1 - progresso * 5.9);
    c.axel.group.rotation.y = Math.PI;
    c.nav.animate(a, progresso < 1 ? 3 : 0);
    c.axel.animate(a, progresso < 1 ? 3 : 0);
    c.axel.limbs[0].rotation.x = c.axel.limbs[2].rotation.x = 0;
    const mao = c.lula.bracos.find((b) => b.lado === 1)?.hand;
    const alvo = mao
      ? mao.getWorldPosition(new T.Vector3())
      : new T.Vector3(0.45, 1.5, -4.05);
    alvo.y += 0.18;
    alvo.z += 0.08;
    const entrega =
      etapa === "lanchonetePagar" ? T.MathUtils.smoothstep(t, 6, 9) : 1;
    alvo.lerp(new T.Vector3(0.13, 1.43, -3.5), entrega);
    c.cartao.grupo.position.copy(alvo);
    c.cartao.grupo.rotation.set(-0.02, 0, 0);
    if (etapa === "agradecimento") {
      c.nav.arms[0].rotation.x = -0.8;
      c.nav.cotovelos[0].rotation.x = -1.1;
      c.telefone3D.position.copy(
        c.nav.cotovelos[0].localToWorld(new T.Vector3(0, -0.28, 0.02)),
      );
      c.telefone3D.position.y += 0.09;
      c.telefone3D.rotation.y = Math.PI;
    }
  }
  c.portas.forEach((p) => (p.visible = !saida));
  c.faixas.forEach((p) => (p.visible = !saida));
  if (saida) {
    const p = Math.min(1, t / 6);
    const rotaNav = new T.CatmullRomCurve3([
      new T.Vector3(-0.15, 0, -2.85),
      new T.Vector3(-1, 0, 2.2),
      new T.Vector3(-2.7, 0, 5.2),
      new T.Vector3(-2.7, 0, 6.8),
      new T.Vector3(0.0, 0, 11.9),
    ]);
    const rotaAxel = new T.CatmullRomCurve3([
      new T.Vector3(0.9, 0, -2.8),
      new T.Vector3(-0.3, 0, 2),
      new T.Vector3(-2.7, 0, 5.5),
      new T.Vector3(-2.7, 0, 7),
      new T.Vector3(1, 0, 12),
    ]);
    c.axel.group.position.copy(rotaAxel.getPoint(p));
    c.nav.group.position.copy(rotaNav.getPoint(p));
    const ta = rotaAxel.getTangent(p),
      tn = rotaNav.getTangent(p);
    c.axel.group.rotation.y = Math.atan2(ta.x, ta.z);
    c.nav.group.rotation.y = Math.atan2(tn.x, tn.z);
    c.axel.limbs[0].rotation.x = Math.sin(a * 9) * 0.4;
    c.axel.limbs[2].rotation.x = -Math.sin(a * 9) * 0.4;
    c.nav.animate(a, 3);
  }
  c.peixes.forEach((p, i) => (p.position.z = 3 + ((a * 0.15 + i * 0.25) % 2)));
  c.terminal.children[1].material.color?.setHex(
    f.pedidoPendente ? 0xffffbb : 0xffffff,
  );
  if (caixa) {
    if (etapa === "pagamento") {
      cam.position.set(-0.15, 1.65, -2.85);
      cam.lookAt(0.25, 1.45, -4.7);
    } else {
      if (etapa === "agradecimento") {
        if (t < 1.2) {
          cam.position.set(1.35, 2, -4.4);
          cam.lookAt(-0.15, 1.35, -2.95);
        } else {
          cam.position.set(-1.5, 1.9, -2.8);
          cam.lookAt(0.15, 1.45, -4.75);
        }
      } else cam.position.set(2.6, 2.2, -1.15);
      if (etapa !== "agradecimento") cam.lookAt(0.1, 1.3, -3.9);
    }
  } else if (saida) {
    cam.position.set(5, 2.7, 17);
    cam.lookAt(0.3, 1, 12.7);
  } else if (final && t >= 7 && t < 10) {
    cam.position.set(5, 2.5, 16.6);
    cam.lookAt(0.4, 1, 13);
  } else if (explorar) {
    const p = f.jogador;
    cam.position.set(
      T.MathUtils.clamp(p.x + Math.sin(p.yaw) * 2.6, -4.05, 4.05),
      2.55,
      T.MathUtils.clamp(p.z + Math.cos(p.yaw) * 2.6, -3.8, 5.95),
    );
    cam.lookAt(p.x, 1.05, p.z);
  } else if (final) {
    cam.position.set(0.1 + Math.sin(a * 0.12) * 0.15, 2.25, 5.55);
    cam.lookAt(2.55, 1.1, 3.7);
  } else if (t < 5) {
    cam.position.set(-8 + t * 0.32, 4.5, 17 - t * 0.25);
    cam.lookAt(0.2, 2.5, 5.8);
  } else if (t < 22) {
    cam.position.set(0.1, 2.35, 5.6);
    cam.lookAt(2.45, 1.2, 3.6);
  } else if (t < 31.15) {
    cam.position.set(1.95, 2.15, -3.25);
    cam.lookAt(2.2, 1.15, -6.3);
  } else {
    cam.position.set(3.7, 2.6, 5.2);
    cam.lookAt(0.5, 1.45, -2.2);
  }
  cam.fov = etapa === "lanchonete" && t >= 22 && t < 31.15 ? 58 : 64;
  cam.far = 200;
  cam.updateProjectionMatrix();
  view.renderer.toneMappingExposure = 0.96;
  view.renderer.render(c.scene, cam);
  if (etapa === "pagamento" && ativo) atualizarCameraQr(view, c, f);
}
