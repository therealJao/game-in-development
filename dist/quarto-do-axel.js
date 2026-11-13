// Decoração editável do quarto. Não altera a queda do sofá nem as regras da história.
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarTubo,
  criarMalha,
  obterMaterial,
  criarTexturaTexto,
} from "./modelos.js";

export const ARO_BICICLETA = 29; // Diâmetro nominal das rodas, em polegadas.

export function criarBicicletaAro29() {
  const bicicleta = new T.Group();
  bicicleta.name = "Bicicleta_aro_29";
  const borracha = obterMaterial("#14191c", 0.94),
    metal = obterMaterial("#9aa5aa", 0.28, 0.85),
    quadro = obterMaterial("#ca3025", 0.42, 0.45),
    preto = obterMaterial("#182126", 0.48, 0.3);
  const raio = (ARO_BICICLETA * 0.0254) / 2;
  const rodas = [];
  for (const z of [-0.64, 0.64]) {
    const roda = new T.Group();
    roda.position.set(0, raio, z);
    bicicleta.add(roda);
    rodas.push(roda);
    criarMalha(
      roda,
      new T.TorusGeometry(raio - 0.035, 0.035, 12, 64),
      borracha,
      [0, 0, 0],
      [0, Math.PI / 2, 0],
    );
    criarMalha(
      roda,
      new T.TorusGeometry(raio - 0.065, 0.013, 8, 64),
      metal,
      [0, 0, 0],
      [0, Math.PI / 2, 0],
    );
    criarCilindro(roda, 0.035, 0.035, 0.15, metal, [0, 0, 0], [0, 0, Math.PI / 2]);
    for (let i = 0; i < 32; i++) {
      const angulo = (i / 32) * Math.PI * 2;
      criarTubo(
        roda,
        [
          [i % 2 ? 0.025 : -0.025, 0, 0],
          [0, Math.cos(angulo) * (raio - 0.065), Math.sin(angulo) * (raio - 0.065)],
        ],
        0.0016,
        metal,
      );
    }
    criarMalha(
      roda,
      new T.TorusGeometry(0.105, 0.008, 6, 40),
      metal,
      [0.07, 0, 0],
      [0, Math.PI / 2, 0],
    );
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      criarCaixa(
        roda,
        [0.045, 0.014, 0.025],
        borracha,
        [0, Math.cos(a) * (raio - 0.005), Math.sin(a) * (raio - 0.005)],
        [a, 0, 0],
      );
    }
  }
  // Dois triângulos formam o quadro; não é apenas uma silhueta plana.
  const pedivela = [0, 0.36, -0.12],
    selim = [0, 0.84, -0.31],
    direcao = [0, 0.84, 0.43];
  for (const [a, b] of [
    [pedivela, selim],
    [selim, direcao],
    [direcao, pedivela],
    [selim, [0, raio, -0.64]],
    [pedivela, [0, raio, -0.64]],
  ])
    criarTubo(bicicleta, [a, b], 0.026, quadro);
  criarTubo(
    bicicleta,
    [
      [0, 0.79, -0.31],
      [0, 0.98, -0.35],
    ],
    0.017,
    metal,
  );
  criarElipsoide(bicicleta, [0.075, 0.026, 0.145], preto, [0, 0.985, -0.37]);
  for (const lado of [-1, 1]) {
    criarTubo(
      bicicleta,
      [
        [lado * 0.055, 0.85, 0.43],
        [lado * 0.065, raio, 0.64],
      ],
      0.025,
      preto,
    );
    criarTubo(
      bicicleta,
      [
        [lado * 0.055, 0.72, 0.48],
        [lado * 0.065, raio, 0.64],
      ],
      0.014,
      metal,
    );
  }
  criarTubo(
    bicicleta,
    [
      [0, 0.84, 0.43],
      [0, 1.03, 0.4],
      [0, 1.08, 0.49],
    ],
    0.021,
    preto,
  );
  criarTubo(
    bicicleta,
    [
      [-0.34, 1.08, 0.49],
      [-0.16, 1.06, 0.47],
      [0.16, 1.06, 0.47],
      [0.34, 1.08, 0.49],
    ],
    0.014,
    metal,
  );
  for (const lado of [-1, 1]) {
    criarCilindro(
      bicicleta,
      0.022,
      0.022,
      0.12,
      preto,
      [lado * 0.3, 1.08, 0.49],
      [0, 0, Math.PI / 2],
    );
    criarCaixa(bicicleta, [0.07, 0.022, 0.05], preto, [lado * 0.23, 1.06, 0.52]);
    criarTubo(
      bicicleta,
      [
        [lado * 0.23, 1.06, 0.52],
        [lado * 0.19, 0.86, 0.57],
        [lado * 0.07, 0.65, 0.64],
      ],
      0.003,
      preto,
    );
    criarTubo(
      bicicleta,
      [
        [0, 0.36, -0.12],
        [lado * 0.12, 0.36, -0.12],
        [lado * 0.14, 0.25, -0.04],
      ],
      0.01,
      metal,
    );
    criarCaixa(bicicleta, [0.09, 0.025, 0.06], preto, [lado * 0.16, 0.25, -0.04]);
  }
  criarCilindro(bicicleta, 0.07, 0.07, 0.018, metal, [-0.07, 0.36, -0.12], [0, 0, Math.PI / 2]);
  criarTubo(
    bicicleta,
    [
      [-0.08, 0.4, -0.12],
      [-0.08, 0.4, -0.64],
      [-0.08, 0.33, -0.64],
      [-0.08, 0.31, -0.12],
      [-0.08, 0.4, -0.12],
    ],
    0.004,
    preto,
  );
  criarTubo(
    bicicleta,
    [
      [0.05, 0.37, -0.33],
      [0.23, 0.04, -0.34],
    ],
    0.009,
    metal,
  );
  const etiqueta = criarCaixa(
    bicicleta,
    [0.008, 0.06, 0.25],
    new T.MeshStandardMaterial({ map: criarTexturaTexto("29 MTB", "#ca3025", "#eeeeeb") }),
    [0.027, 0.66, -0.21],
    [0, Math.PI / 2, 0],
  );
  return bicicleta;
}

export function decorarQuartoAxel(cena) {
  const foto = new T.TextureLoader().load("assets/amigos-quarto.jpg");
  foto.colorSpace = T.SRGBColorSpace;
  const moldura = obterMaterial("#20252c", 0.55, 0.25),
    papel = new T.MeshStandardMaterial({ map: foto, roughness: 0.8 });
  const quadro = new T.Group();
  quadro.position.set(-2.85, 2.03, -4.36);
  cena.add(quadro);
  quadro.name = "Quadro_amigos_para_sempre";
  criarCaixa(quadro, [1.14, 2.34, 0.09], moldura, [0, 0, 0]);
  criarCaixa(quadro, [1.04, 2.24, 0.016], papel, [0, 0, 0.055]);
  const poster = new T.Group();
  poster.position.set(4.87, 2.0, 0.0);
  poster.rotation.y = -Math.PI / 2;
  cena.add(poster);
  poster.name = "Poster_foto_dos_amigos";
  criarCaixa(poster, [1.04, 2.3, 0.012], papel, [0, 0, 0]);
  for (const lado of [-1, 1])
    criarCaixa(
      poster,
      [0.18, 0.07, 0.012],
      obterMaterial("#d7caab", 0.95),
      [lado * 0.43, 1.1, 0.015],
      [0, 0, lado * 0.25],
    );
  const bike = criarBicicletaAro29();
  bike.position.set(3.9, 0, -1.25);
  bike.rotation.y = -0.18;
  cena.add(bike);
  // Cama, prateleiras, discos e objetos deixam o quarto vivido, preservando o caminho do sofá.
  criarCaixa(cena, [1.4, 0.36, 2.25], obterMaterial("#292e38", 0.9), [-3.7, 0.18, -0.3]);
  criarCaixa(cena, [1.36, 0.16, 2.2], obterMaterial("#354d6d", 0.95), [-3.7, 0.44, -0.3]);
  criarElipsoide(cena, [0.48, 0.1, 0.25], obterMaterial("#bbbcae", 0.98), [-3.7, 0.59, -1.02]);
  for (let i = 0; i < 9; i++)
    criarCaixa(cena, [1.3, 0.012, 0.018], obterMaterial("#bc4c3b", 0.95), [
      -3.7,
      0.53,
      -0.9 + i * 0.18,
    ]);
  for (const z of [0.6, 2.3]) {
    criarCaixa(cena, [0.3, 0.07, 1.4], obterMaterial("#5b4031", 0.8), [-4.74, 2.2, z]);
    for (let i = 0; i < 7; i++)
      criarCaixa(
        cena,
        [0.22, 0.23 + (i % 3) * 0.045, 0.065],
        obterMaterial(["#b93b30", "#c0a35c", "#2f587e"][i % 3], 0.9),
        [-4.71, 2.35, z - 0.4 + i * 0.11],
      );
  }
  const ledVermelho = obterMaterial("#d63734", 0.4, 0, {
      emissive: "#b32130",
      emissiveIntensity: 1,
    }),
    ledAzul = obterMaterial("#3479bb", 0.4, 0, { emissive: "#2467b1", emissiveIntensity: 1 });
  criarCaixa(cena, [9.6, 0.025, 0.025], ledVermelho, [0, 3.34, -4.36]);
  criarCaixa(cena, [0.025, 0.025, 8.6], ledAzul, [4.86, 3.34, 0]);
  const luz = new T.PointLight("#407aca", 10, 9, 1.5);
  luz.position.set(4, 2.8, 0.5);
  cena.add(luz);
  const planta = new T.Group();
  planta.position.set(2.6, 0, -3.8);
  cena.add(planta);
  criarCilindro(planta, 0.16, 0.12, 0.28, obterMaterial("#86533d", 0.9), [0, 0.14, 0]);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4;
    criarTubo(
      planta,
      [
        [0, 0.25, 0],
        [Math.cos(a) * 0.1, 0.5, Math.sin(a) * 0.1],
        [Math.cos(a) * 0.23, 0.65, Math.sin(a) * 0.23],
      ],
      0.007,
      obterMaterial("#365b38", 0.95),
    );
    criarElipsoide(
      planta,
      [0.06, 0.16, 0.025],
      obterMaterial("#4a784b", 0.9),
      [Math.cos(a) * 0.2, 0.61, Math.sin(a) * 0.2],
      [0.4, a, 0.4],
    );
  }
  const relogio = criarCaixa(
    cena,
    [0.6, 0.22, 0.08],
    obterMaterial("#10191d", 0.6),
    [-1.2, 0.78, -3.95],
  );
  criarCaixa(
    relogio,
    [0.52, 0.15, 0.01],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto("02:00", "#07151a", "#58c7ce"),
      emissive: "#35778a",
      emissiveIntensity: 0.4,
    }),
    [0, 0, 0.05],
  );
  return { bike, luz };
}

/** Representação própria de faroeste para a TV; não executa nem inclui o RDR2 comercial. */
export function criarFaroesteDaTV() {
  const cena = new T.Scene();
  cena.background = new T.Color("#bf4d2c");
  cena.fog = new T.Fog("#bd6040", 22, 90);
  cena.add(new T.HemisphereLight("#ffe2a5", "#583a28", 2.2));
  const sol = new T.DirectionalLight("#ffc78a", 3);
  sol.position.set(-3, 8, -8);
  cena.add(sol);
  const camera = new T.PerspectiveCamera(55, 16 / 9, 0.05, 100);
  camera.position.set(0, 2.7, 5.8);
  camera.lookAt(0, 1, -5);
  criarCaixa(cena, [50, 0.1, 100], obterMaterial("#9b754b", 1), [0, -0.12, -25]);
  criarMalha(
    cena,
    new T.SphereGeometry(5, 32, 24),
    new T.MeshBasicMaterial({ color: "#f3c57d" }),
    [-14, 12, -50],
  );
  for (let i = 0; i < 16; i++) {
    const x = (i % 2 ? -1 : 1) * (8 + (i % 4) * 3),
      z = -15 - Math.floor(i / 2) * 7;
    criarMalha(
      cena,
      new T.ConeGeometry(4 + (i % 3), 5 + (i % 4), 5),
      obterMaterial(i % 2 ? "#744735" : "#99583b", 1),
      [x, 1.5, z],
    );
  }
  const cavalo = new T.Group();
  cena.add(cavalo);
  const pelo = obterMaterial("#684334", 0.95),
    escuro = obterMaterial("#282019", 0.9);
  criarElipsoide(cavalo, [0.32, 0.38, 0.65], pelo, [0, 1, 0]);
  criarElipsoide(cavalo, [0.22, 0.43, 0.23], pelo, [0, 1.36, -0.48], [0.45, 0, 0]);
  criarElipsoide(cavalo, [0.18, 0.24, 0.25], pelo, [0, 1.68, -0.71], [0.35, 0, 0]);
  criarElipsoide(cavalo, [0.14, 0.1, 0.23], pelo, [0, 1.51, -0.87]);
  for (const x of [-0.12, 0.12])
    criarMalha(cavalo, new T.ConeGeometry(0.055, 0.22, 8), pelo, [x, 1.95, -0.68]);
  const patas = [];
  for (const x of [-0.22, 0.22])
    for (const z of [-0.43, 0.43]) {
      const pata = new T.Group();
      pata.position.set(x, 0.94, z);
      cavalo.add(pata);
      criarCilindro(pata, 0.06, 0.035, 0.73, pelo, [0, -0.35, 0]);
      criarCaixa(pata, [0.11, 0.12, 0.16], escuro, [0, -0.78, -0.035]);
      patas.push(pata);
    }
  criarTubo(
    cavalo,
    [
      [0, 1.22, 0.58],
      [0, 0.85, 0.82],
      [0, 0.55, 0.87],
    ],
    0.045,
    escuro,
  );
  criarCaixa(cavalo, [0.52, 0.1, 0.47], escuro, [0, 1.36, 0]);
  // Cavaleiro com camisa, braços, botas e chapéu; permanece em cima da sela.
  criarElipsoide(cavalo, [0.17, 0.27, 0.12], obterMaterial("#344251", 0.9), [0, 1.7, 0.03]);
  criarElipsoide(cavalo, [0.11, 0.14, 0.1], obterMaterial("#ba8b68", 0.9), [0, 2.06, 0.015]);
  criarElipsoide(cavalo, [0.24, 0.02, 0.19], escuro, [0, 2.2, 0.015]);
  criarCilindro(cavalo, 0.1, 0.13, 0.12, escuro, [0, 2.25, 0.015]);
  for (const lado of [-1, 1]) {
    criarTubo(
      cavalo,
      [
        [lado * 0.12, 1.59, 0],
        [lado * 0.35, 1.34, 0.06],
        [lado * 0.32, 1.06, 0.02],
      ],
      0.055,
      obterMaterial("#282f3a", 0.9),
    );
    criarTubo(
      cavalo,
      [
        [lado * 0.16, 1.86, 0],
        [lado * 0.22, 1.64, -0.18],
        [lado * 0.16, 1.57, -0.4],
      ],
      0.045,
      obterMaterial("#344251", 0.9),
    );
    criarTubo(
      cavalo,
      [
        [lado * 0.16, 1.57, -0.4],
        [lado * 0.12, 1.47, -0.78],
      ],
      0.004,
      escuro,
    );
  }
  const placa = criarCaixa(
    cena,
    [8, 1, 0.03],
    new T.MeshBasicMaterial({
      map: criarTexturaTexto("RED DEAD REDEMPTION 2", "#a31616", "#fff0d9", 1024, 128),
    }),
    [0, 4, -8],
  );
  const cactos = [];
  for (let i = 0; i < 18; i++) {
    const c = new T.Group();
    c.position.set((i % 2 ? -1 : 1) * (3.5 + (i % 3)), 0, -i * 4);
    cena.add(c);
    criarCilindro(c, 0.1, 0.12, 1.5, obterMaterial("#566443", 0.95), [0, 0.75, 0]);
    criarTubo(
      c,
      [
        [0, 0.8, 0],
        [0.4, 0.9, 0],
        [0.4, 1.35, 0],
      ],
      0.08,
      obterMaterial("#566443", 0.95),
    );
    cactos.push(c);
  }
  return {
    cena,
    camera,
    cavalo,
    patas,
    cactos,
    atualizar(tempo, desvio, jogando) {
      cavalo.position.x = desvio;
      cavalo.position.y = Math.sin(tempo * (jogando ? 11 : 3)) * (jogando ? 0.055 : 0.01);
      cavalo.rotation.z = -desvio * 0.045;
      patas.forEach(
        (p, i) => (p.rotation.x = jogando ? Math.sin(tempo * 11 + i * Math.PI * 0.8) * 0.5 : 0),
      );
      cactos.forEach((c, i) => (c.position.z = -(i * 4 - (jogando ? tempo * 4 : 0)) % 72));
    },
  };
}
