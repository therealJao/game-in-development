import * as T from "./vendor/three.module.js";

/**
 * Balsa (ferry boat) no estilo da travessia Itajaí ⇄ Navegantes pelo rio Itajaí-Açu:
 * embarcação de dois sentidos, deck plano para carros e motos, rampas articuladas nas duas pontas,
 * casaria lateral com salão de passageiros, passadiço (cabine de comando) elevado,
 * guarda-corpos, boias, botes salva-vidas, mastro com luzes de navegação e bandeira.
 * Tudo em malhas 3D. Deck no y = 1.0 (o passageiro fica sobre ele).
 */
const LARGURA = 11,
  COMPRIMENTO = 38,
  DECK = 1.0;

function mat(cor, rug = 0.6, metal = 0.2, extra = {}) {
  return new T.MeshStandardMaterial({ color: cor, roughness: rug, metalness: metal, ...extra });
}
function caixa(pai, [w, h, d], m, [x, y, z], rot = [0, 0, 0]) {
  const o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  o.rotation.set(...rot);
  o.castShadow = o.receiveShadow = true;
  pai.add(o);
  return o;
}
function cilindro(pai, rt, rb, h, m, [x, y, z], rot = [0, 0, 0], seg = 16) {
  const o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), m);
  o.position.set(x, y, z);
  o.rotation.set(...rot);
  o.castShadow = true;
  pai.add(o);
  return o;
}
function texturaTexto(texto, fundo, cor, w = 1024, h = 128) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = fundo;
  g.fillRect(0, 0, w, h);
  g.fillStyle = cor;
  g.font = `bold ${h * 0.62}px Arial, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(texto, w / 2, h / 2 + 4);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
function texturaDeck() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = "#4d5a52";
  g.fillRect(0, 0, 256, 1024);
  // Chapas de aço antiderrapante com desgaste.
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},${Math.random() * 0.06})`;
    g.fillRect(Math.random() * 256, Math.random() * 1024, 3, 3);
  }
  g.strokeStyle = "rgba(0,0,0,0.35)";
  for (let y = 0; y < 1024; y += 128) g.strokeRect(0, y, 256, 128);
  // Faixas amarelas das filas de carros.
  g.fillStyle = "#e3c22b";
  for (const x of [84, 170]) for (let y = 20; y < 1004; y += 60) g.fillRect(x - 3, y, 6, 36);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function texturaZebrada() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#f1c40f";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#1a1a1a";
  for (let i = -128; i < 256; i += 32) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 16, 0);
    g.lineTo(i + 16 + 128, 128);
    g.lineTo(i + 128, 128);
    g.fill();
  }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(6, 1);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
function criarCarro(cor) {
  const g = new T.Group();
  const lata = new T.MeshPhysicalMaterial({ color: cor, roughness: 0.25, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.08 });
  const vidro = mat("#1c2730", 0.05, 0.3, { transparent: true, opacity: 0.85 });
  const pneu = mat("#121212", 0.9, 0);
  const base = new T.Mesh(new T.BoxGeometry(1.75, 0.6, 4.2, 2, 1, 4), lata);
  const p = base.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) if (Math.abs(p.getZ(i)) > 1.9) p.setY(i, p.getY(i) * 0.75); // capô e porta-malas mais baixos
  base.geometry.computeVertexNormals();
  base.position.y = 0.62;
  base.castShadow = true;
  g.add(base);
  const cabine = new T.Mesh(new T.CylinderGeometry(0.72, 0.86, 2.2, 4, 1), vidro);
  cabine.rotation.set(Math.PI / 2, Math.PI / 4, 0);
  cabine.scale.set(1.15, 1, 0.55);
  cabine.position.set(0, 1.12, -0.15);
  g.add(cabine);
  const teto = new T.Mesh(new T.BoxGeometry(1.4, 0.06, 1.7), lata);
  teto.position.set(0, 1.42, -0.2);
  g.add(teto);
  for (const x of [-0.82, 0.82])
    for (const z of [-1.35, 1.35]) cilindro(g, 0.33, 0.33, 0.24, pneu, [x, 0.33, z], [0, 0, Math.PI / 2], 18);
  for (const x of [-0.6, 0.6]) {
    caixa(g, [0.32, 0.12, 0.04], mat("#fff8dc", 0.2, 0, { emissive: "#fff2c0", emissiveIntensity: 0.6 }), [x, 0.72, 2.11]);
    caixa(g, [0.32, 0.1, 0.04], mat("#a00", 0.3, 0, { emissive: "#ff1a1a", emissiveIntensity: 0.8 }), [x, 0.72, -2.11]);
  }
  return g;
}
function criarMoto(cor) {
  const g = new T.Group();
  const m = mat(cor, 0.3, 0.5),
    pneu = mat("#111", 0.9);
  for (const z of [-0.65, 0.65]) cilindro(g, 0.3, 0.3, 0.1, pneu, [0, 0.3, z], [0, 0, Math.PI / 2], 16);
  caixa(g, [0.28, 0.32, 1.0], m, [0, 0.62, 0]);
  caixa(g, [0.24, 0.1, 0.55], mat("#151515", 0.7), [0, 0.84, -0.2]);
  cilindro(g, 0.02, 0.02, 0.7, mat("#888", 0.3, 0.9), [0, 0.95, 0.55], [0, 0, Math.PI / 2]);
  return g;
}

export function criarBalsa() {
  const g = new T.Group();
  g.name = "Balsa_Itajai_Navegantes";
  const brancoNaval = mat("#eef0ee", 0.45, 0.15),
    azul = mat("#1d4f9c", 0.4, 0.2),
    vermelhoAntiincrustante = mat("#8e1f1a", 0.7, 0.1),
    aco = mat("#9aa3a6", 0.35, 0.8),
    vidro = new T.MeshPhysicalMaterial({ color: "#1d3346", roughness: 0.04, metalness: 0.2, clearcoat: 1, envMapIntensity: 2 });

  // Casco tipo chata com proas iguais (dois sentidos), linha d'água vermelha e faixa azul.
  const forma = new T.Shape();
  const L = COMPRIMENTO / 2,
    W = LARGURA / 2;
  forma.moveTo(-W, -L + 2.2);
  forma.quadraticCurveTo(-W, -L, -W + 2.2, -L);
  forma.lineTo(W - 2.2, -L);
  forma.quadraticCurveTo(W, -L, W, -L + 2.2);
  forma.lineTo(W, L - 2.2);
  forma.quadraticCurveTo(W, L, W - 2.2, L);
  forma.lineTo(-W + 2.2, L);
  forma.quadraticCurveTo(-W, L, -W, L - 2.2);
  forma.closePath();
  const casco = new T.Mesh(
    new T.ExtrudeGeometry(forma, { depth: 1.6, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 4, curveSegments: 16 }),
    brancoNaval,
  );
  casco.rotation.x = -Math.PI / 2;
  casco.position.y = -0.87;
  casco.castShadow = casco.receiveShadow = true;
  g.add(casco);
  const linhaDagua = new T.Mesh(new T.ExtrudeGeometry(forma, { depth: 0.55, bevelEnabled: false, curveSegments: 16 }), vermelhoAntiincrustante);
  linhaDagua.rotation.x = -Math.PI / 2;
  linhaDagua.position.y = -0.85;
  linhaDagua.scale.set(1.035, 1.012, 1);
  g.add(linhaDagua);
  const faixa = new T.Mesh(new T.ExtrudeGeometry(forma, { depth: 0.32, bevelEnabled: false, curveSegments: 16 }), azul);
  faixa.rotation.x = -Math.PI / 2;
  faixa.position.y = 0.42;
  faixa.scale.set(1.03, 1.01, 1);
  g.add(faixa);
  // Nome no costado.
  for (const lado of [-1, 1]) {
    const nome = new T.Mesh(
      new T.PlaneGeometry(9, 0.75),
      new T.MeshStandardMaterial({ map: texturaTexto("FERRY BOAT · ITAJAÍ ⇄ NAVEGANTES", "#eef0ee", "#1d4f9c"), roughness: 0.5 }),
    );
    nome.position.set(lado * (W + 0.27), 0.0, 3);
    nome.rotation.y = lado * Math.PI / 2;
    g.add(nome);
  }

  // Deck de aço com faixas de fila.
  const deck = new T.Mesh(new T.PlaneGeometry(LARGURA - 0.4, COMPRIMENTO - 1.5), mat("#ffffff", 0.85, 0.3, { map: texturaDeck() }));
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = DECK;
  deck.receiveShadow = true;
  g.add(deck);

  // Rampas articuladas nas duas pontas (levantadas durante a travessia), borda zebrada.
  const zebra = new T.MeshStandardMaterial({ map: texturaZebrada(), roughness: 0.6 });
  const rampas = [];
  for (const s of [-1, 1]) {
    const piv = new T.Group();
    piv.position.set(0, DECK, s * (L - 0.2));
    g.add(piv);
    const rampa = caixa(piv, [7.2, 0.22, 4.2], aco, [0, 0, s * 2.1]);
    caixa(piv, [7.2, 0.24, 0.35], zebra, [0, 0.02, s * 4.1]);
    for (let i = 0; i < 10; i++) caixa(piv, [7, 0.05, 0.08], mat("#6f7679", 0.5, 0.8), [0, 0.13, s * (0.4 + i * 0.38)]);
    for (const x of [-3.7, 3.7]) caixa(piv, [0.12, 0.7, 4.1], zebra, [x, 0.35, s * 2.1]);
    piv.rotation.x = s * -0.55;
    rampas.push(piv);
    // Correntes da rampa até os pórticos.
    for (const x of [-3.4, 3.4]) {
      cilindro(g, 0.12, 0.14, 4.2, azul, [x, DECK + 2.1, s * (L - 1.2)]);
      const corrente = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 3.6, 6), aco);
      corrente.position.set(x, DECK + 2.6, s * (L + 0.4));
      corrente.rotation.x = s * 0.7;
      g.add(corrente);
    }
    caixa(g, [7.3, 0.4, 0.4], azul, [0, DECK + 4.2, s * (L - 1.2)]);
    // Luz de navegação e placa de capacidade.
    const placa = new T.Mesh(
      new T.PlaneGeometry(3.6, 0.6),
      new T.MeshStandardMaterial({ map: texturaTexto("VELOCIDADE MÁX. 10 km/h", "#1d4f9c", "#ffffff"), roughness: 0.5 }),
    );
    placa.position.set(0, DECK + 4.75, s * (L - 1.2));
    if (s < 0) placa.rotation.y = Math.PI;
    g.add(placa);
  }

  // Casaria lateral (boreste): salão de passageiros com janelas e, em cima, o passadiço.
  const xCasa = W - 1.6;
  caixa(g, [2.8, 2.6, 20], brancoNaval, [xCasa, DECK + 1.3, 0]);
  for (let i = 0; i < 9; i++)
    for (const face of [-1, 1]) caixa(g, [0.05, 0.9, 1.5], vidro, [xCasa + face * 1.42, DECK + 1.65, -8.2 + i * 2.05]);
  caixa(g, [3.0, 0.12, 20.4], azul, [xCasa, DECK + 2.66, 0]);
  for (let i = 0; i < 6; i++) {
    const porta = caixa(g, [0.06, 2.0, 0.9], mat("#c7ccc9", 0.4, 0.6), [xCasa - 1.42, DECK + 1.0, -9.4 + i * 3.8]);
    porta.name = "Porta_salao";
  }
  // Passadiço elevado com vidros inclinados para os dois sentidos.
  caixa(g, [3.2, 2.0, 5.2], brancoNaval, [xCasa, DECK + 3.7, 0]);
  for (const s of [-1, 1]) caixa(g, [3.0, 1.0, 0.06], vidro, [xCasa, DECK + 4.05, s * 2.62], [s * 0.18, 0, 0]);
  for (const f of [-1, 1]) caixa(g, [0.06, 0.9, 4.6], vidro, [xCasa + f * 1.62, DECK + 4.05, 0]);
  caixa(g, [3.6, 0.15, 5.8], azul, [xCasa, DECK + 4.78, 0]);
  // Escada externa até o passadiço.
  for (let i = 0; i < 12; i++) caixa(g, [0.9, 0.06, 0.28], aco, [xCasa - 1.95, DECK + 0.2 + i * 0.22, -5 + i * 0.26]);
  // Mastro com luzes de navegação, radar e bandeira do Brasil.
  cilindro(g, 0.06, 0.08, 4, aco, [xCasa, DECK + 6.8, 0]);
  const radar = caixa(g, [1.6, 0.12, 0.18], mat("#2a2a2a", 0.5, 0.6), [xCasa, DECK + 7.2, 0]);
  radar.name = "Radar";
  const luzes = [
    ["#ff2020", [xCasa - 1.7, DECK + 4.9, 0]],
    ["#20ff40", [xCasa + 1.7, DECK + 4.9, 0]],
    ["#ffffff", [xCasa, DECK + 8.8, 0]],
  ];
  for (const [cor, p] of luzes) {
    const l = new T.Mesh(new T.SphereGeometry(0.12, 10, 8), new T.MeshBasicMaterial({ color: cor, toneMapped: false }));
    l.position.set(...p);
    g.add(l);
  }
  const bandeira = (() => {
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 140;
    const x = c.getContext("2d");
    x.fillStyle = "#009c3b";
    x.fillRect(0, 0, 200, 140);
    x.fillStyle = "#ffdf00";
    x.beginPath();
    x.moveTo(100, 12);
    x.lineTo(188, 70);
    x.lineTo(100, 128);
    x.lineTo(12, 70);
    x.fill();
    x.fillStyle = "#002776";
    x.beginPath();
    x.arc(100, 70, 34, 0, 7);
    x.fill();
    x.strokeStyle = "#fff";
    x.lineWidth = 6;
    x.beginPath();
    x.arc(100, 110, 52, -2.2, -0.95);
    x.stroke();
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  })();
  const flagGeo = new T.PlaneGeometry(1.4, 0.98, 12, 4);
  const flag = new T.Mesh(flagGeo, new T.MeshStandardMaterial({ map: bandeira, side: T.DoubleSide, roughness: 0.8 }));
  flag.position.set(xCasa, DECK + 8.2, -0.75);
  flag.rotation.y = Math.PI / 2;
  g.add(flag);

  // Guarda-corpo dos dois lados do deck e boias laranja.
  const corrimaoMat = mat("#d9dcda", 0.35, 0.7);
  for (const s of [-1, 1]) {
    const x = s * (W - 0.15);
    const tubo = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, COMPRIMENTO - 6, 8), corrimaoMat);
    tubo.rotation.x = Math.PI / 2;
    tubo.position.set(x, DECK + 1.1, 0);
    g.add(tubo);
    const tubo2 = tubo.clone();
    tubo2.position.y = DECK + 0.6;
    g.add(tubo2);
    for (let z = -L + 3; z <= L - 3; z += 1.6) cilindro(g, 0.035, 0.035, 1.1, corrimaoMat, [x, DECK + 0.55, z], [0, 0, 0], 6);
    for (const z of [-12, -4, 4, 12]) {
      const boia = new T.Mesh(new T.TorusGeometry(0.35, 0.1, 10, 24), mat("#ff6a13", 0.6));
      boia.position.set(x + s * 0.12, DECK + 1.0, z);
      boia.rotation.y = Math.PI / 2;
      g.add(boia);
    }
  }
  // Botes salva-vidas em casulos brancos sobre a casaria.
  for (const z of [-7, 7]) {
    const casulo = new T.Mesh(new T.CapsuleGeometry(0.42, 1.0, 6, 14), mat("#f6f6f2", 0.4));
    casulo.rotation.z = Math.PI / 2;
    casulo.position.set(xCasa, DECK + 3.05, z);
    g.add(casulo);
  }
  // Carros e motos estacionados nas filas (o Axel fica de pé no meio).
  const cores = ["#b8bcc0", "#1f2a33", "#a3150f", "#f2f2f0", "#2c4f8a", "#5b5f62", "#7a6a50"];
  let n = 0;
  for (const x of [-3.6, -0.9])
    for (let z = -14; z <= 14; z += 4.9) {
      if (x === -0.9 && Math.abs(z) < 4) continue; // espaço livre para o passageiro
      const carro = criarCarro(cores[n++ % cores.length]);
      carro.position.set(x - 0.5, DECK, z);
      g.add(carro);
    }
  for (let i = 0; i < 4; i++) {
    const moto = criarMoto(["#c41e2a", "#111", "#1d4f9c", "#ddd"][i]);
    moto.position.set(1.3, DECK, -3 + i * 1.6);
    moto.rotation.y = 0.15;
    g.add(moto);
  }
  // Chaminés do motor (duas, uma de cada lado do passadiço).
  for (const z of [-3.6, 3.6]) {
    cilindro(g, 0.32, 0.38, 1.6, azul, [xCasa, DECK + 3.4, z]);
    caixa(g, [0.72, 0.12, 0.72], mat("#222", 0.8), [xCasa, DECK + 4.25, z]);
  }

  // Esteira de espuma atrás da balsa.
  const espuma = new T.Mesh(
    new T.PlaneGeometry(10, 40, 1, 20),
    new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTempo: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `varying vec2 vUv; uniform float uTempo;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        void main(){ float x = abs(vUv.x - 0.5) * 2.0; float fade = vUv.y;
          float n = h(floor(vec2(vUv.x * 60.0, vUv.y * 120.0 + uTempo * 20.0)));
          float a = smoothstep(1.0, 0.3, x / (0.4 + (1.0 - fade) * 0.6)) * fade * (0.45 + n * 0.5);
          gl_FragColor = vec4(vec3(0.95), a * 0.8); }`,
    }),
  );
  espuma.rotation.x = -Math.PI / 2;
  espuma.position.set(0, -0.3, -L - 19);
  g.add(espuma);
  g.userData.animar = (t) => {
    espuma.material.uniforms.uTempo.value = t;
    radar.rotation.y = t * 2.2;
    const p = flagGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + 0.7;
      p.setZ(i, Math.sin(x * 5 - t * 7) * 0.08 * x);
    }
    p.needsUpdate = true;
  };
  g.userData.rampas = rampas;
  g.userData.deck = DECK;
  return g;
}
