import * as T from "./vendor/three.module.js";

/**
 * Honda Biz preta do Yuri, remodelada a partir da silhueta lateral da referência (assets/biz-reference.png).
 * Carenagens são perfis laterais extrudados com bordas arredondadas (bevel), na escala real
 * (entre-eixos ~1,26 m, aro 17"). Frente = +Z. Retorna { group, wheels } como o modelo anterior.
 */
// Converte pixels da foto de referência (678×452, frente à direita) para metros no modelo.
const ESCALA = 1.5 / 420,
  RX = 140,
  RY = 355;
const P = (x, y) => new T.Vector2((x - RX) * ESCALA - 0.73, (RY - y) * ESCALA + 0.36);

function perfil(pontos, suave = true) {
  const s = new T.Shape();
  const v = pontos.map(([x, y]) => P(x, y));
  if (!suave) {
    s.moveTo(v[0].x, v[0].y);
    v.slice(1).forEach((p) => s.lineTo(p.x, p.y));
    s.closePath();
    return s;
  }
  // Curva suave passando pelos pontos (Catmull-Rom fechada → spline).
  const curva = new T.SplineCurve([...v, v[0]]);
  const pts = curva.getPoints(v.length * 10);
  s.setFromPoints(pts);
  return s;
}
function peca(pai, forma, largura, material, { bevel = 0.025, x = 0 } = {}) {
  const geo = new T.ExtrudeGeometry(forma, {
    depth: Math.max(0.01, largura - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 24,
  });
  geo.translate(0, 0, -(largura - bevel * 2) / 2);
  geo.computeVertexNormals();
  const m = new T.Mesh(geo, material);
  // Shape está no plano XY (X = frente); giramos para X do shape virar +Z do mundo.
  m.rotation.y = -Math.PI / 2;
  m.position.x = x;
  m.castShadow = m.receiveShadow = true;
  pai.add(m);
  return m;
}
function texturaDecalque() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 256, 96);
  g.font = "italic 900 64px Arial, sans-serif";
  g.fillStyle = "#d8dde0";
  g.fillText("Biz", 20, 66);
  g.fillStyle = "#d42020";
  g.fillRect(140, 44, 90, 10);
  g.fillRect(150, 58, 80, 6);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}

export function criarBizRealista() {
  const g = new T.Group();
  g.name = "Biz_preta_modelo_3D";
  const pintura = new T.MeshPhysicalMaterial({ color: "#0b0c0e", roughness: 0.28, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.06 }),
    plastico = new T.MeshStandardMaterial({ color: "#121315", roughness: 0.75 }),
    banco = new T.MeshPhysicalMaterial({ color: "#151517", roughness: 0.6, sheen: 0.4, sheenColor: new T.Color("#444") }),
    cromo = new T.MeshStandardMaterial({ color: "#d4d8da", roughness: 0.12, metalness: 1 }),
    aluminio = new T.MeshStandardMaterial({ color: "#a9adaf", roughness: 0.38, metalness: 0.85 }),
    borracha = new T.MeshStandardMaterial({ color: "#141414", roughness: 0.92 }),
    vermelho = new T.MeshStandardMaterial({ color: "#c41a12", roughness: 0.2, emissive: "#5a0400", emissiveIntensity: 0.6 }),
    ambar = new T.MeshStandardMaterial({ color: "#ff9a1f", roughness: 0.2, emissive: "#8a4300", emissiveIntensity: 0.4 }),
    lente = new T.MeshPhysicalMaterial({ color: "#e9eef2", roughness: 0.05, transmission: 0, clearcoat: 1, emissive: "#fff8e0", emissiveIntensity: 1.4 });

  // Rodas aro 17 com pneu de perfil, aro de alumínio, raios cruzados e cubo/tambor.
  const wheels = [];
  for (const z of [-0.73, 0.77]) {
    const w = new T.Group();
    w.position.set(0, 0.36, z);
    g.add(w);
    const pneu = new T.Mesh(new T.TorusGeometry(0.29, 0.058, 16, 64), borracha);
    pneu.rotation.y = Math.PI / 2;
    pneu.scale.set(1, 1, 1.15);
    pneu.castShadow = true;
    w.add(pneu);
    // Sulcos do pneu.
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2,
        sulco = new T.Mesh(new T.BoxGeometry(0.055, 0.005, 0.01), plastico);
      sulco.position.set(0, Math.cos(a) * 0.346, Math.sin(a) * 0.346);
      sulco.rotation.x = -a;
      sulco.rotation.y = i % 2 ? 0.4 : -0.4;
      w.add(sulco);
    }
    const aro = new T.Mesh(new T.TorusGeometry(0.235, 0.014, 8, 64), aluminio);
    aro.rotation.y = Math.PI / 2;
    w.add(aro);
    const cubo = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.13, 24), aluminio);
    cubo.rotation.z = Math.PI / 2;
    w.add(cubo);
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2,
        lado = i % 2 ? 1 : -1,
        cruz = a + lado * 0.35;
      const de = new T.Vector3(lado * 0.05, Math.cos(cruz) * 0.07, Math.sin(cruz) * 0.07),
        ate = new T.Vector3(0, Math.cos(a) * 0.228, Math.sin(a) * 0.228);
      const raio = new T.Mesh(new T.CylinderGeometry(0.0022, 0.0022, de.distanceTo(ate), 4), cromo);
      raio.position.copy(de).add(ate).multiplyScalar(0.5);
      raio.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), ate.clone().sub(de).normalize());
      w.add(raio);
    }
    wheels.push(w);
  }

  // Carenagem traseira (laterais sob o banco até a rabeta).
  peca(g, perfil([[42, 182], [95, 160], [200, 176], [330, 196], [352, 236], [300, 292], [205, 300], [140, 268], [75, 240], [40, 214]]), 0.3, pintura, { bevel: 0.035 });
  // Banco com costura e volume.
  peca(g, perfil([[82, 166], [130, 150], [210, 156], [300, 168], [342, 186], [334, 204], [250, 194], [150, 188], [88, 186]]), 0.27, banco, { bevel: 0.05 });
  // Escudo frontal / quadro "underbone" com a curva característica do assoalho.
  peca(g, perfil([[300, 296], [365, 310], [405, 300], [440, 250], [462, 200], [478, 150], [505, 138], [538, 168], [548, 205], [515, 228], [492, 262], [462, 305], [425, 338], [370, 346], [318, 330]]), 0.34, pintura, { bevel: 0.04 });
  // Assoalho (plataforma dos pés) em plástico texturizado.
  peca(g, perfil([[300, 292], [400, 300], [410, 318], [300, 314]], false), 0.36, plastico, { bevel: 0.01 });
  // Para-lama dianteiro sobre a roda.
  peca(g, perfil([[478, 252], [530, 238], [585, 246], [625, 268], [612, 278], [570, 262], [520, 258], [488, 266]]), 0.17, pintura, { bevel: 0.03 });
  // Para-lama traseiro / suporte da placa.
  peca(g, perfil([[30, 240], [80, 236], [95, 262], [60, 300], [35, 310], [25, 280]]), 0.16, plastico, { bevel: 0.02 });
  // Carenagem do guidão com farol.
  peca(g, perfil([[398, 120], [430, 92], [470, 86], [500, 108], [508, 138], [482, 150], [430, 146], [405, 138]]), 0.36, pintura, { bevel: 0.04 });

  // Farol, lanterna, piscas.
  const farol = new T.Mesh(new T.SphereGeometry(0.08, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), lente);
  farol.rotation.x = Math.PI / 2 - 0.25;
  farol.scale.set(1.4, 1, 0.6);
  const pf = P(505, 120);
  farol.position.set(0, pf.y, pf.x + 0.01);
  g.add(farol);
  const luz = new T.SpotLight("#fff4d6", 6, 9, 0.5, 0.6, 1.5);
  luz.position.copy(farol.position);
  luz.target.position.set(0, 0, pf.x + 4);
  g.add(luz, luz.target);
  const pl = P(42, 186);
  const lanterna = new T.Mesh(new T.BoxGeometry(0.2, 0.06, 0.05), vermelho);
  lanterna.position.set(0, pl.y, pl.x - 0.02);
  lanterna.rotation.x = 0.4;
  g.add(lanterna);
  for (const s of [-1, 1]) {
    const pisca = new T.Mesh(new T.SphereGeometry(0.03, 12, 8), ambar);
    pisca.scale.set(1, 0.7, 1.6);
    pisca.position.set(s * 0.15, pl.y - 0.05, pl.x + 0.06);
    g.add(pisca);
    const piscaF = pisca.clone();
    piscaF.position.set(s * 0.19, pf.y - 0.03, pf.x - 0.08);
    g.add(piscaF);
  }
  // Placa traseira.
  const placa = new T.Mesh(new T.BoxGeometry(0.2, 0.13, 0.01), new T.MeshStandardMaterial({ color: "#e9ebe4", roughness: 0.5 }));
  const pp = P(45, 280);
  placa.position.set(0, pp.y, pp.x - 0.05);
  placa.rotation.x = 0.3;
  g.add(placa);

  // Guidão, manoplas, manetes e retrovisores.
  const pg = P(455, 92);
  const guidao = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.66, 10), cromo);
  guidao.rotation.z = Math.PI / 2;
  guidao.position.set(0, pg.y, pg.x);
  g.add(guidao);
  for (const s of [-1, 1]) {
    const manopla = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.12, 12), borracha);
    manopla.rotation.z = Math.PI / 2;
    manopla.position.set(s * 0.3, pg.y, pg.x);
    g.add(manopla);
    const manete = new T.Mesh(new T.BoxGeometry(0.16, 0.008, 0.016), aluminio);
    manete.position.set(s * 0.25, pg.y + 0.005, pg.x + 0.05);
    manete.rotation.y = s * 0.15;
    g.add(manete);
    const haste = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 0.2, 6), cromo);
    haste.position.set(s * 0.18, pg.y + 0.09, pg.x - 0.02);
    haste.rotation.z = -s * 0.25;
    g.add(haste);
    const espelho = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.018, 20), plastico);
    espelho.scale.set(0.75, 1, 1.15);
    espelho.rotation.x = Math.PI / 2;
    espelho.position.set(s * 0.21, pg.y + 0.2, pg.x - 0.03);
    g.add(espelho);
  }
  // Garfo dianteiro telescópico com sanfonas.
  for (const s of [-1, 1]) {
    const de = new T.Vector3(s * 0.085, 0.36, 0.77),
      ate = new T.Vector3(s * 0.085, P(470, 150).y, P(470, 150).x);
    const tubo = new T.Mesh(new T.CylinderGeometry(0.02, 0.026, de.distanceTo(ate), 12), cromo);
    tubo.position.copy(de).add(ate).multiplyScalar(0.5);
    tubo.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), ate.clone().sub(de).normalize());
    g.add(tubo);
  }
  // Amortecedor traseiro com mola.
  const pa = P(150, 262),
    pb = P(165, 335);
  for (const s of [-1, 1]) {
    const mola = [];
    for (let i = 0; i <= 80; i++) {
      const u = i / 80,
        a = u * Math.PI * 2 * 10;
      mola.push(new T.Vector3(s * 0.16 + Math.cos(a) * 0.03, T.MathUtils.lerp(pb.y, pa.y, u), T.MathUtils.lerp(pb.x, pa.x, u) + Math.sin(a) * 0.03));
    }
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(mola), 200, 0.006, 6), cromo));
    // Balança (braço oscilante).
    const braco = new T.Mesh(new T.BoxGeometry(0.03, 0.05, 0.62), pintura);
    braco.position.set(s * 0.12, 0.38, -0.45);
    braco.rotation.x = -0.12;
    g.add(braco);
  }
  // Motor horizontal com aletas, tampa do câmbio e escapamento com protetor.
  const pm = P(335, 340);
  const motor = new T.Group();
  motor.position.set(0, pm.y, pm.x);
  g.add(motor);
  const bloco = new T.Mesh(new T.CapsuleGeometry(0.09, 0.16, 8, 20), aluminio);
  bloco.rotation.x = Math.PI / 2 - 0.15;
  motor.add(bloco);
  for (let i = 0; i < 7; i++) {
    const aleta = new T.Mesh(new T.CylinderGeometry(0.115, 0.115, 0.008, 20), aluminio);
    aleta.rotation.x = Math.PI / 2 - 0.15;
    aleta.position.z = 0.08 + i * 0.022;
    motor.add(aleta);
  }
  const tampa = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.05, 28), cromo);
  tampa.rotation.z = Math.PI / 2;
  tampa.position.set(-0.13, 0, -0.08);
  motor.add(tampa);
  const escape = new T.CatmullRomCurve3([
    new T.Vector3(0.02, pm.y - 0.02, pm.x + 0.15),
    new T.Vector3(0.12, pm.y - 0.1, pm.x - 0.05),
    new T.Vector3(0.17, pm.y - 0.05, pm.x - 0.45),
    new T.Vector3(0.18, P(100, 345).y, P(100, 345).x),
  ]);
  g.add(new T.Mesh(new T.TubeGeometry(escape, 60, 0.038, 14), plastico));
  const ponteira = new T.Mesh(new T.CylinderGeometry(0.03, 0.035, 0.05, 16), cromo);
  ponteira.rotation.x = Math.PI / 2;
  const pp2 = P(95, 345);
  ponteira.position.set(0.18, pp2.y, pp2.x);
  g.add(ponteira);
  // Pedaleiras, descanso lateral e decalque "Biz".
  for (const s of [-1, 1]) {
    const ped = new T.Mesh(new T.BoxGeometry(0.1, 0.02, 0.05), borracha);
    ped.position.set(s * 0.22, 0.3, -0.25);
    g.add(ped);
    const dec = new T.Mesh(new T.PlaneGeometry(0.34, 0.13), new T.MeshStandardMaterial({ map: texturaDecalque(), transparent: true, roughness: 0.3 }));
    const pd = P(165, 205);
    dec.position.set(s * 0.155, pd.y, pd.x);
    dec.rotation.y = s * Math.PI / 2;
    dec.rotation.z = 0.08 * s;
    g.add(dec);
  }
  const descanso = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.32, 8), cromo);
  descanso.position.set(-0.16, 0.18, -0.15);
  descanso.rotation.set(0.5, 0, 0.5);
  g.add(descanso);
  return { group: g, wheels };
}
