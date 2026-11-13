import * as T from "./vendor/three.module.js";

/**
 * Paisagem de aventura (inspirada no clima de jogos de mundo aberto): colinas verdes onduladas,
 * floresta densa de copas arredondadas, rochas nas encostas, platô para o castelo, cordilheira azulada
 * no horizonte e névoa baixa entre os morros. Tudo procedural (sem arquivos externos).
 * Origem = centro do platô do castelo (topo em y = alturaPlato). Frente (lado do mar) = -Z.
 */
let semente = 4242;
const rnd = () => ((semente = (semente * 1664525 + 1013904223) >>> 0) / 4294967296);
function ruido2(x, z) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
function suave(x, z) {
  const xi = Math.floor(x),
    zi = Math.floor(z),
    fx = x - xi,
    fz = z - zi,
    u = fx * fx * (3 - 2 * fx),
    v = fz * fz * (3 - 2 * fz);
  const a = ruido2(xi, zi),
    b = ruido2(xi + 1, zi),
    c = ruido2(xi, zi + 1),
    d = ruido2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, oit = 5) {
  let s = 0,
    amp = 0.5,
    f = 1;
  for (let i = 0; i < oit; i++) {
    s += suave(x * f, z * f) * amp;
    f *= 2.03;
    amp *= 0.5;
  }
  return s;
}

export function criarPaisagemZelda({ alturaPlato = 37, raioPlato = 52, costa = -78 } = {}) {
  const grupo = new T.Group();
  grupo.name = "Paisagem_aventura";
  // ---------- Altura do terreno ----------
  const altura = (x, z) => {
    const dPlato = Math.hypot(x, z * 0.9);
    // Morros ondulados.
    let h = (fbm(x * 0.011 + 3, z * 0.011 - 7) - 0.32) * 95 + (fbm(x * 0.045, z * 0.045) - 0.5) * 10;
    // Sobe em direção ao fundo (encostas que levam às montanhas).
    h += Math.max(0, z - 60) * 0.22;
    // Platô do castelo.
    const plato = 1 - T.MathUtils.smoothstep(dPlato, raioPlato * 0.75, raioPlato * 1.7);
    h = h * (1 - plato) + (alturaPlato - 1.5) * plato;
    // Afunda na costa (encontra o mar).
    const praia = T.MathUtils.smoothstep(z, costa - 25, costa + 30);
    h = h * praia - 6 * (1 - praia);
    // Bordas laterais descem suavemente.
    h -= Math.max(0, Math.abs(x) - 230) * 0.35;
    return h;
  };
  // ---------- Malha do terreno com cores por altura e inclinação ----------
  const L = 620,
    P = 560,
    geo = new T.PlaneGeometry(L, P, 220, 200);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, P / 2 + costa - 40);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, altura(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  const nor = geo.attributes.normal,
    cores = new Float32Array(pos.count * 3),
    c = new T.Color(),
    grama1 = new T.Color("#5e8f3a"),
    grama2 = new T.Color("#8aa848"),
    grama3 = new T.Color("#3f6b2c"),
    rocha = new T.Color("#8a8574"),
    areia = new T.Color("#d8c48e"),
    terra = new T.Color("#7a6a46");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i),
      inclin = 1 - nor.getY(i),
      n = fbm(x * 0.03, z * 0.03, 3);
    c.copy(grama1).lerp(grama2, T.MathUtils.clamp(n * 1.6 - 0.4, 0, 1)).lerp(grama3, T.MathUtils.clamp(fbm(x * 0.008 + 9, z * 0.008, 2) - 0.35, 0, 0.7));
    if (y < 1.2) c.lerp(areia, T.MathUtils.clamp((1.2 - y) / 2.5, 0, 1));
    c.lerp(terra, T.MathUtils.smoothstep(inclin, 0.18, 0.3) * 0.6);
    c.lerp(rocha, T.MathUtils.smoothstep(inclin, 0.28, 0.45));
    cores.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new T.BufferAttribute(cores, 3));
  const terreno = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  terreno.receiveShadow = true;
  terreno.name = "Terreno_colinas";
  grupo.add(terreno);

  // ---------- Floresta: copas arredondadas instanciadas ----------
  const copaGeo = new T.IcosahedronGeometry(1, 1);
  const cp = copaGeo.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const v = new T.Vector3().fromBufferAttribute(cp, i);
    v.multiplyScalar(1 + (ruido2(v.x * 3, v.z * 3 + v.y) - 0.5) * 0.25);
    v.y *= 0.85;
    cp.setXYZ(i, v.x, v.y, v.z);
  }
  copaGeo.computeVertexNormals();
  const troncoGeo = new T.CylinderGeometry(0.12, 0.2, 1, 5);
  const N = 2600,
    copas = new T.InstancedMesh(copaGeo, new T.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), N * 2),
    troncos = new T.InstancedMesh(troncoGeo, new T.MeshStandardMaterial({ color: "#4a3626", roughness: 1 }), N);
  const m = new T.Matrix4(),
    q = new T.Quaternion(),
    s = new T.Vector3(),
    p = new T.Vector3(),
    verdes = ["#2f5a25", "#3d6e2c", "#4f7f33", "#5f8d3a", "#2a4d22"].map((h) => new T.Color(h));
  let nc = 0,
    nt = 0;
  for (let k = 0; k < N * 4 && nt < N; k++) {
    const x = (rnd() - 0.5) * L * 0.95,
      z = costa + 10 + rnd() * (P - 80);
    const h = altura(x, z);
    if (h < 2.5) continue;
    // Floresta em manchas (densa em vales, rala nos topos) e fora do platô.
    if (fbm(x * 0.01 + 40, z * 0.01, 3) < 0.46) continue;
    if (Math.hypot(x, z * 0.9) < raioPlato * 1.1) continue;
    const e = 3.5 + rnd() * 4.5;
    p.set(x, h + e * 0.55, z);
    s.set(0.9, e, 0.9);
    m.compose(p, q.identity(), s);
    troncos.setMatrixAt(nt++, m);
    for (let j = 0; j < 2 && nc < N * 2; j++) {
      const r = e * (0.55 - j * 0.12);
      p.set(x + (rnd() - 0.5) * 0.8, h + e * (1.0 + j * 0.35), z + (rnd() - 0.5) * 0.8);
      s.set(r, r * (0.9 + rnd() * 0.3), r);
      q.setFromAxisAngle(new T.Vector3(0, 1, 0), rnd() * 6);
      m.compose(p, q, s);
      copas.setMatrixAt(nc, m);
      copas.setColorAt(nc++, verdes[(rnd() * verdes.length) | 0].clone().multiplyScalar(0.85 + rnd() * 0.3));
    }
  }
  copas.count = nc;
  troncos.count = nt;
  copas.castShadow = true;
  copas.receiveShadow = true;
  copas.instanceColor.needsUpdate = true;
  grupo.add(troncos, copas);

  // ---------- Rochas nas encostas ----------
  const rochaGeo = new T.DodecahedronGeometry(1, 1),
    rochas = new T.InstancedMesh(rochaGeo, new T.MeshStandardMaterial({ color: "#8d8878", roughness: 1, flatShading: true }), 260);
  let nr = 0;
  for (let k = 0; k < 4000 && nr < 260; k++) {
    const x = (rnd() - 0.5) * L * 0.9,
      z = costa + rnd() * (P - 60),
      h = altura(x, z),
      d = 2;
    const incl = Math.abs(altura(x + d, z) - altura(x - d, z)) + Math.abs(altura(x, z + d) - altura(x, z - d));
    if (incl < 2.2 || h < 0) continue;
    const e = 1.5 + rnd() * 4;
    m.compose(p.set(x, h + e * 0.2, z), q.setFromEuler(new T.Euler(rnd(), rnd() * 6, rnd())), s.set(e, e * 0.7, e * 1.2));
    rochas.setMatrixAt(nr++, m);
  }
  rochas.count = nr;
  rochas.castShadow = rochas.receiveShadow = true;
  grupo.add(rochas);

  // ---------- Cordilheira distante (perspectiva aérea: azulada e clara) ----------
  for (let camada = 0; camada < 3; camada++) {
    const g2 = new T.PlaneGeometry(1600, 260, 180, 30);
    const p2 = g2.attributes.position;
    for (let i = 0; i < p2.count; i++) {
      const x = p2.getX(i),
        yN = (p2.getY(i) + 130) / 260;
      const pico = Math.pow(fbm(x * 0.004 + camada * 7, camada * 3.1, 5), 1.6) * (220 - camada * 30) + 20;
      p2.setY(i, yN * pico);
    }
    g2.computeVertexNormals();
    const tom = new T.Color(["#5e7894", "#7d94ab", "#9fb2c4"][camada]);
    const serra = new T.Mesh(g2, new T.MeshStandardMaterial({ color: tom, roughness: 1, fog: true }));
    serra.position.set(0, -10, P + costa - 60 + camada * 90);
    serra.rotation.y = Math.PI;
    grupo.add(serra);
  }

  // ---------- Névoa baixa entre os morros (planos com gradiente suave) ----------
  const nevoaTex = (() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const gx = cv.getContext("2d"),
      gr = gx.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,240,220,0.55)");
    gr.addColorStop(1, "rgba(255,240,220,0)");
    gx.fillStyle = gr;
    gx.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(cv);
  })();
  const nevoaMat = new T.MeshBasicMaterial({ map: nevoaTex, transparent: true, depthWrite: false, fog: true, opacity: 0.7 });
  const nevoas = [];
  for (let i = 0; i < 70; i++) {
    const x = (rnd() - 0.5) * L,
      z = costa + 40 + rnd() * (P - 100),
      h = Math.max(4, altura(x, z) + 3 + rnd() * 6),
      e = 40 + rnd() * 70;
    const n = new T.Mesh(new T.PlaneGeometry(e, e * 0.35), nevoaMat);
    n.position.set(x, h, z);
    n.userData.base = n.position.clone();
    n.renderOrder = 5;
    grupo.add(n);
    nevoas.push(n);
  }
  grupo.userData.animar = (t, camera) => {
    for (const [i, n] of nevoas.entries()) {
      n.position.x = n.userData.base.x + Math.sin(t * 0.05 + i) * 6;
      if (camera) n.quaternion.copy(camera.quaternion);
    }
  };
  grupo.userData.altura = altura;
  return grupo;
}
