import * as T from "./vendor/three.module.js";
import { mergeGeometries } from "./vendor/BufferGeometryUtils.js";
import { materialPele } from "./pele.js";
import { criarRostoEscaneado } from "./cabeca-escaneada.js";

/**
 * Cabeça humana esculpida proceduralmente (sem fotos):
 * crânio, maxilar, maçãs do rosto, órbitas, arco das sobrancelhas, nariz com asas e ponta,
 * lábios, queixo, orelhas com hélice; olhos com esclera, íris, pupila, córnea e pálpebras que piscam;
 * sobrancelhas fio a fio, barba por fazer (cor nos vértices) e cabelo em mechas.
 * Pele: material com poros (pele.js) + variação de cor nos vértices (lábios, bochechas, barba).
 *
 * Medidas em metros: altura queixo→topo ≈ 0,24 m. Origem no centro do crânio; frente = +Z.
 */
const gauss = (d, s) => Math.exp(-(d * d) / (2 * s * s));
let semente = 1;
const rnd = () => ((semente = (semente * 1664525 + 1013904223) >>> 0) / 4294967296);

function esculpirCranio({ largura = 1, queixo = 1, nariz = 1, macas = 1 }) {
  const geo = new T.SphereGeometry(1, 96, 72);
  const p = geo.attributes.position,
    v = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let { x, y, z } = v;
    const frente = Math.max(0, z);
    // Maxilar estreitando em direção ao queixo.
    if (y < -0.15) {
      const k = (-y - 0.15) / 0.85;
      x *= 1 - k * 0.42 * (0.9 + 0.1 / largura);
      z = z + frente * k * 0.12;
    }
    // Nuca mais reta e topo levemente achatado.
    if (z < -0.2 && y < 0) z *= 0.92;
    if (y > 0.7) y = 0.7 + (y - 0.7) * 0.8;
    // Queixo projetado.
    z += gauss(Math.hypot(x / 0.35, y + 0.85), 0.25) * 0.1 * queixo * frente;
    // Maçãs do rosto.
    for (const s of [-1, 1]) z += gauss(Math.hypot(x - s * 0.55, y + 0.05), 0.16) * 0.05 * macas;
    // Órbitas dos olhos (afundam) e arco das sobrancelhas (saliente).
    for (const s of [-1, 1]) {
      const d = Math.hypot(x - s * 0.34, y - 0.12);
      z -= gauss(d, 0.13) * 0.085 * frente;
      z += gauss(Math.hypot(x - s * 0.34, y - 0.31), 0.12) * 0.04 * frente;
    }
    // Têmporas.
    for (const s of [-1, 1]) x -= gauss(Math.hypot(y - 0.25, z - 0.45), 0.2) * 0.04 * s * Math.sign(x || 1) * (x * s > 0 ? 1 : 0);
    // Nariz: dorso, ponta e asas (projeção em relação à face).
    if (frente > 0.3) {
      const janela = T.MathUtils.smoothstep(y, -0.36, -0.26) * (1 - T.MathUtils.smoothstep(y, 0.14, 0.26));
      const descida = T.MathUtils.clamp((0.2 - y) / 0.48, 0, 1);
      z += gauss(x, 0.075 + descida * 0.02) * janela * (0.03 + descida * descida * 0.2) * nariz;
      z += gauss(Math.hypot(x / 1.1, y + 0.255), 0.06) * 0.06 * nariz; // ponta arredondada
      for (const s of [-1, 1]) {
        z += gauss(Math.hypot(x - s * 0.12, y + 0.29), 0.045) * 0.07 * nariz; // asas
        z -= gauss(Math.hypot(x - s * 0.075, y + 0.335), 0.022) * 0.05 * nariz; // narinas
      }
      z -= gauss(Math.hypot(x / 1.5, y + 0.36), 0.03) * 0.02; // base do nariz
      // Filtro (philtrum), lábios e queixo.
      z += gauss(Math.hypot(x / 2.3, y + 0.455), 0.04) * 0.07; // lábio superior
      z += gauss(Math.hypot(x / 2.0, y + 0.56), 0.045) * 0.065; // lábio inferior
      z -= gauss(Math.hypot(x / 2.8, y + 0.505), 0.014) * 0.045; // linha da boca
      for (const s of [-1, 1]) z -= gauss(Math.hypot(x - s * 0.27, y + 0.5), 0.03) * 0.03; // cantos da boca
      z -= gauss(Math.hypot(x / 2.4, y + 0.66), 0.04) * 0.035; // sulco do queixo
      for (const s of [-1, 1]) z -= gauss(Math.hypot((x - s * 0.24) / 0.6, y + 0.36), 0.05) * 0.02; // sulco nasogeniano
    }
    p.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function corDosVertices(geo, { pele, barba, labios = "#b2524c", rubor = 0.25 }) {
  const p = geo.attributes.position,
    cores = new Float32Array(p.count * 3),
    base = new T.Color(pele),
    lab = new T.Color(labios),
    bochecha = new T.Color(pele).lerp(new T.Color("#d0645a"), 0.5),
    pelo = barba ? new T.Color(barba) : null,
    c = new T.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      f = Math.max(0, z);
    c.copy(base);
    for (const s of [-1, 1]) c.lerp(bochecha, gauss(Math.hypot(x - s * 0.5, y + 0.12), 0.18) * rubor * f);
    c.lerp(lab, T.MathUtils.clamp(gauss(Math.hypot(x / 2.1, y + 0.51), 0.06) * 1.6 * f, 0, 0.85));
    // Olheiras sutis.
    for (const s of [-1, 1]) c.multiplyScalar(1 - gauss(Math.hypot(x - s * 0.34, y - 0.08), 0.12) * 0.22 * f);
    if (pelo) {
      // Barba por fazer: maxilar, queixo e bigode; ruído para parecer fios curtos.
      const regiao =
        T.MathUtils.smoothstep(-y, 0.32, 0.6) * T.MathUtils.smoothstep(z, -0.1, 0.4) +
        gauss(Math.hypot(x / 2.4, y + 0.41), 0.05) * 1.2 * f;
      const semLabio = 1 - T.MathUtils.clamp(gauss(Math.hypot(x / 2.1, y + 0.51), 0.05) * 1.8, 0, 1);
      const ruido = 0.6 + 0.4 * Math.sin(x * 900) * Math.sin(y * 870) * Math.sin(z * 910);
      c.lerp(pelo, T.MathUtils.clamp(regiao * semLabio * ruido, 0, 0.75));
    }
    cores.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new T.BufferAttribute(cores, 3));
}

function texturaIris(cor) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d"),
    base = new T.Color(cor);
  g.fillStyle = "#1a1a1a";
  g.fillRect(0, 0, 256, 256);
  const grad = g.createRadialGradient(128, 128, 18, 128, 128, 128);
  grad.addColorStop(0, "#" + base.clone().multiplyScalar(0.55).getHexString());
  grad.addColorStop(0.45, "#" + base.getHexString());
  grad.addColorStop(0.85, "#" + base.clone().multiplyScalar(0.7).getHexString());
  grad.addColorStop(1, "#151515");
  g.fillStyle = grad;
  g.beginPath();
  g.arc(128, 128, 128, 0, 7);
  g.fill();
  // Fibras radiais da íris.
  for (let i = 0; i < 220; i++) {
    const a = rnd() * Math.PI * 2,
      r0 = 22 + rnd() * 10,
      r1 = 80 + rnd() * 44;
    g.strokeStyle = rnd() > 0.5 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.18)";
    g.lineWidth = 1 + rnd();
    g.beginPath();
    g.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0);
    g.lineTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1);
    g.stroke();
  }
  g.fillStyle = "#050505";
  g.beginPath();
  g.arc(128, 128, 30, 0, 7);
  g.fill();
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}

export function criarOlho(corIris, raio) {
  const g = new T.Group();
  const esclera = new T.Mesh(
    new T.SphereGeometry(raio, 32, 24),
    new T.MeshPhysicalMaterial({ color: "#f1ece6", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.03 }),
  );
  g.add(esclera);
  // Íris em disco levemente côncavo, logo atrás da córnea.
  const iris = new T.Mesh(
    new T.CircleGeometry(raio * 0.42, 40),
    new T.MeshStandardMaterial({ map: texturaIris(corIris), roughness: 0.4 }),
  );
  iris.position.z = raio * 1.004;
  g.add(iris);
  const cornea = new T.Mesh(
    new T.SphereGeometry(raio * 0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.8),
    new T.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0, transparent: true, opacity: 0.12, clearcoat: 1, depthWrite: false }),
  );
  cornea.rotation.x = Math.PI / 2;
  cornea.position.z = raio * 0.68;
  g.add(cornea);
  return g;
}

/** Cabelo: couro cabeludo + mechas curvas mescladas numa única malha (barato de desenhar). */
function criarCabelo({ cor = "#5a3a24", reflexo = "#8e6043", estilo = "longo", escala }) {
  const g = new T.Group();
  const mat = new T.MeshPhysicalMaterial({ color: cor, roughness: 0.78, sheen: 1, sheenColor: new T.Color(reflexo), sheenRoughness: 0.35, side: T.DoubleSide });
  const matReflexo = mat.clone();
  matReflexo.color = new T.Color(cor).lerp(new T.Color(reflexo), 0.45);
  const couro = new T.Mesh(new T.SphereGeometry(1.075, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), mat);
  couro.scale.set(escala.x, escala.y * 0.98, escala.z);
  couro.rotation.x = -0.5;
  couro.position.set(0, escala.y * 0.04, -escala.z * 0.04);
  g.add(couro);
  const geos = [[], []];
  const n = estilo === "curto" ? 700 : 520,
    comprimento = estilo === "curto" ? 0.16 : estilo === "medio" ? 0.75 : 1.15;
  for (let i = 0; i < n; i++) {
    // Ponto de nascimento no couro cabeludo (evita a testa).
    const a = rnd() * Math.PI * 2,
      polar = Math.acos(1 - rnd() * 0.85);
    const dir = new T.Vector3(Math.sin(polar) * Math.cos(a), Math.cos(polar), Math.sin(polar) * Math.sin(a));
    dir.applyAxisAngle(new T.Vector3(1, 0, 0), -0.32);
    if (dir.z > 0.55 && dir.y < 0.75) continue; // linha da testa
    const pontos = [];
    const pos = dir.clone().multiply(new T.Vector3(escala.x * 1.04, escala.y * 1.02, escala.z * 1.04));
    const lado = new T.Vector3(dir.x, 0, dir.z).normalize();
    const L = comprimento * escala.y * (0.75 + rnd() * 0.5);
    const onda = 0.02 + rnd() * 0.03,
      fase = rnd() * 6;
    for (let k = 0; k <= 10; k++) {
      const u = k / 10;
      const p = pos.clone();
      // Sai do couro, contorna a cabeça e cai com a gravidade.
      p.addScaledVector(lado, Math.sin(Math.min(u * 2.2, 1) * Math.PI * 0.5) * escala.x * (estilo === "curto" ? 0.06 : 0.25));
      p.y -= u * u * L * (estilo === "curto" ? 0.25 : 1);
      if (estilo !== "curto" && p.z > escala.z * 0.35) p.z = escala.z * 0.35 + (p.z - escala.z * 0.35) * 0.3; // não cobre o rosto
      p.x += Math.sin(u * 9 + fase) * onda * escala.x * u;
      p.z += Math.cos(u * 8 + fase) * onda * escala.x * u;
      pontos.push(p);
    }
    const largura = (estilo === "curto" ? 0.03 : 0.035) * escala.x * (0.7 + rnd() * 0.6);
    const tubo = new T.TubeGeometry(new T.CatmullRomCurve3(pontos), 14, largura, 5);
    // Afina as pontas.
    const tp = tubo.attributes.position;
    tubo.computeBoundingBox();
    for (let k = 0; k < tp.count; k++) {
      const anel = Math.floor(k / 6) / 14;
      if (anel > 0.6) {
        const c = pontos[Math.min(10, Math.round(anel * 10))],
          f = 1 - (anel - 0.6) / 0.4 * 0.85;
        tp.setXYZ(k, c.x + (tp.getX(k) - c.x) * f, c.y + (tp.getY(k) - c.y) * f, c.z + (tp.getZ(k) - c.z) * f);
      }
    }
    tubo.computeVertexNormals();
    geos[i % 5 === 0 ? 1 : 0].push(tubo);
  }
  for (const [i, lista] of geos.entries()) {
    if (!lista.length) continue;
    const m = new T.Mesh(mergeGeometries(lista), i ? matReflexo : mat);
    m.castShadow = true;
    g.add(m);
  }
  return g;
}

/**
 * Cria a cabeça. Retorna { grupo, piscar(t) } — chame piscar(tempo) no animate do personagem.
 * Opções: pele, olhos, cabelo{cor,reflexo,estilo}, barba (cor ou null), escala (altura em metros).
 */
export function criarCabecaRealista({
  pele = "#c39577",
  olhos = "#5a3a1e",
  cabelo = { cor: "#3b2618", reflexo: "#6a4630", estilo: "curto" },
  barba = null,
  sobrancelha = null,
  altura = 0.25,
  largura = 1,
  nariz = 1,
  semente: s0 = 7,
  escaneado = true,
} = {}) {
  semente = s0 * 7919 + 13;
  const grupo = new T.Group();
  grupo.name = "Cabeca_realista";
  const escala = new T.Vector3(altura * 0.38 * largura, altura * 0.5, altura * 0.44);
  if (escaneado) {
    // Rosto humano real escaneado (pele, poros, rugas, orelhas e sobrancelhas verdadeiras).
    grupo.add(criarRostoEscaneado({ altura: altura * 0.92, pele, corOlhos: olhos, largura }));
    if (cabelo) grupo.add(criarCabelo({ ...cabelo, escala: escala.clone().multiply(new T.Vector3(1.0, 0.98, 1.08)) }));
    return { grupo, piscar: () => {}, escala };
  }
  const geo = esculpirCranio({ largura, nariz });
  corDosVertices(geo, { pele, barba });
  const base = materialPele(pele);
  const matPele = base.clone();
  matPele.color = new T.Color("#ffffff");
  matPele.vertexColors = true;
  matPele.onBeforeCompile = base.onBeforeCompile;
  matPele.customProgramCacheKey = () => "pele-realista-vc";
  const cranio = new T.Mesh(geo, matPele);
  cranio.scale.copy(escala);
  cranio.castShadow = cranio.receiveShadow = true;
  grupo.add(cranio);
  // Pescoço.
  const pescoco = new T.Mesh(new T.CylinderGeometry(escala.x * 0.62, escala.x * 0.72, altura * 0.42, 24), materialPele(pele));
  pescoco.position.set(0, -escala.y * 0.98, -escala.z * 0.14);
  grupo.add(pescoco);
  // Olhos nas órbitas, com pálpebras.
  const raioOlho = escala.x * 0.135,
    olhosGrupo = [],
    palpebras = [];
  for (const s of [-1, 1]) {
    const o = criarOlho(olhos, raioOlho);
    o.position.set(s * escala.x * 0.34, escala.y * 0.12, escala.z * 0.79);
    grupo.add(o);
    olhosGrupo.push(o);
    for (const cima of [1, -1]) {
      // Pálpebra: calota de pele sobre o globo; a de cima desce ao piscar.
      const palp = new T.Mesh(
        new T.SphereGeometry(raioOlho * 1.07, 28, 12, 0, Math.PI * 2, 0, Math.PI * (cima > 0 ? 0.3 : 0.22)),
        materialPele(pele),
      );
      palp.position.copy(o.position);
      palp.rotation.x = cima > 0 ? 0.12 : Math.PI - 0.15;
      palp.userData.base = palp.rotation.x;
      palp.userData.cima = cima;
      grupo.add(palp);
      palpebras.push(palp);
      // Borda da pálpebra (cílios escuros na de cima).
      const borda = new T.Mesh(
        new T.TorusGeometry(raioOlho * 1.02, raioOlho * (cima > 0 ? 0.09 : 0.05), 6, 24, Math.PI * 0.8),
        cima > 0 ? new T.MeshStandardMaterial({ color: "#1b1410", roughness: 0.9 }) : materialPele(pele),
      );
      borda.position.copy(o.position);
      borda.rotation.set(cima > 0 ? -0.35 : 0.25, 0, cima > 0 ? Math.PI * 0.1 : Math.PI * 1.1);
      borda.position.z += raioOlho * 0.25;
      borda.position.y += cima * raioOlho * 0.12;
      grupo.add(borda);
    }
    // Sobrancelha fio a fio.
    const fios = [];
    for (let k = 0; k < 26; k++) {
      const u = k / 25,
        x0 = s * escala.x * (0.16 + u * 0.38),
        y0 = escala.y * (0.3 + Math.sin(u * Math.PI) * 0.06 - u * 0.03),
        z0 = escala.z * (1.0 - u * u * 0.32);
      const ini = new T.Vector3(x0, y0 + (rnd() - 0.5) * escala.y * 0.03, z0),
        fim = ini.clone().add(new T.Vector3(s * escala.x * 0.07, escala.y * 0.012, 0));
      fios.push(new T.TubeGeometry(new T.LineCurve3(ini, fim), 1, escala.x * 0.012, 3));
    }
    const sob = new T.Mesh(mergeGeometries(fios), new T.MeshStandardMaterial({ color: sobrancelha || cabelo.cor, roughness: 0.8 }));
    grupo.add(sob);
  }
  // Orelhas com hélice (borda enrolada).
  for (const s of [-1, 1]) {
    const orelha = new T.Group();
    const concha = new T.Mesh(new T.SphereGeometry(1, 20, 14), materialPele(pele));
    concha.scale.set(escala.x * 0.07, escala.y * 0.28, escala.z * 0.2);
    orelha.add(concha);
    const helice = new T.Mesh(new T.TorusGeometry(escala.y * 0.2, escala.x * 0.035, 8, 24, Math.PI * 1.3), materialPele(pele));
    helice.rotation.set(0, Math.PI / 2, Math.PI * 0.35);
    helice.scale.set(1, 1.3, 0.75);
    orelha.add(helice);
    orelha.position.set(s * escala.x * 0.98, escala.y * 0.02, -escala.z * 0.05);
    orelha.rotation.y = s * 0.25;
    grupo.add(orelha);
  }
  if (cabelo) grupo.add(criarCabelo({ ...cabelo, escala }));
  let proximoPiscar = 2 + rnd() * 3;
  const piscar = (t) => {
    // Pisca a cada 2–6 s (fechamento de ~0,15 s); olhar varia um pouco.
    let fechado = 0;
    const fase = t % proximoPiscar;
    if (fase > proximoPiscar - 0.16) fechado = Math.sin(((fase - (proximoPiscar - 0.16)) / 0.16) * Math.PI);
    for (const p of palpebras) if (p.userData.cima > 0) p.rotation.x = p.userData.base + fechado * 0.95;
    for (const o of olhosGrupo) o.rotation.set(Math.sin(t * 0.37) * 0.08, Math.sin(t * 0.23) * 0.2, 0);
  };
  // Piscar sozinho a cada quadro desenhado (funciona mesmo se o personagem não chamar piscar).
  cranio.onBeforeRender = () => piscar(performance.now() / 1000);
  return { grupo, piscar, escala };
}
