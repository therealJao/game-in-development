// Cutscene do terraço e prévia Frutiger Aero. Não adiciona uma fase jogável.
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarMalha,
  obterMaterial,
  criarAxel,
} from "./modelos.js";
import { criarGabrielBreier, criarBolaFutebol } from "./personagens-castelo.js";
import { criarFortalezaColina, criarCeuDourado } from "./paisagem-castelo.js";
import { criarAgua } from "./efeitos-visuais.js";
import { TEMPOS_TERRACO } from "./regras-castelo.js";

function peixe(cena, cor, escala = 1) {
  const g = new T.Group();
  cena.add(g);
  g.scale.setScalar(escala);
  criarElipsoide(g, [0.48, 0.22, 0.16], obterMaterial(cor, 0.3), [0, 0, 0]);
  criarMalha(
    g,
    new T.ConeGeometry(0.23, 0.38, 3),
    obterMaterial(cor, 0.35),
    [-0.55, 0, 0],
    [0, 0, -Math.PI / 2],
    [1, 1, 0.3],
  );
  for (const z of [-0.14, 0.14])
    criarElipsoide(g, [0.045, 0.045, 0.018], obterMaterial("#102433", 0.25), [
      0.28,
      0.07,
      z,
    ]);
  return g;
}
export function criarPreviaAero() {
  const scene = new T.Scene();
  scene.background = new T.Color("#087dd9");
  scene.fog = new T.FogExp2("#168fdf", 0.012);
  scene.add(new T.HemisphereLight("#baf6ff", "#1b88a0", 1.3));
  const sol = new T.DirectionalLight("#ffffff", 2);
  sol.position.set(-20, 80, -20);
  scene.add(sol);

  const base = obterMaterial("#49b71a", 0.76),
    vidro = obterMaterial("#168fd5", 0.15, 0.45),
    branco = obterMaterial("#effeff", 0.35);
  criarCaixa(scene, [180, 2, 180], base, [0, -3, 0]);
  const agua = criarAgua(200, 200, "#0879dc");
  agua.position.y = 25;
  agua.material.side = T.DoubleSide;
  agua.material.transparent = true;
  agua.material.opacity = 0.6;
  scene.add(agua);
  for (let i = 0; i < 16; i++) {
    const x = ((i % 8) - 3.5) * 9,
      z = -23 - Math.floor(i / 8) * 20,
      h = 9 + ((i * 7) % 19);
    criarCaixa(scene, [5, h, 5], vidro, [x, h / 2 - 2, z]);
    for (let y = 0; y < h; y += 2.2)
      criarCaixa(scene, [5.15, 0.17, 5.15], branco, [x, y - 1.8, z]);
    for (const dx of [-2.55, 0, 2.55])
      criarCaixa(scene, [0.17, h, 5.15], branco, [x + dx, h / 2 - 2, z]);
  }
  const bolhas = [];
  const bolhaMat = new T.MeshPhysicalMaterial({
    color: "#c5faff",
    roughness: 0.05,
    metalness: 0.18,
    transparent: true,
    opacity: 0.26,
    clearcoat: 1,
    side: T.DoubleSide,
  });
  for (let i = 0; i < 42; i++) {
    const b = criarMalha(
      scene,
      new T.SphereGeometry(0.18 + (i % 5) * 0.16, 16, 12),
      bolhaMat,
      [((i * 13) % 65) - 32, i % 23, ((i * 17) % 60) - 25],
    );
    bolhas.push(b);
  }
  const peixes = [];
  for (let i = 0; i < 14; i++) {
    const p = peixe(
      scene,
      ["#ff9c20", "#efdb55", "#32e4d6"][i % 3],
      0.8 + (i % 3) * 0.4,
    );
    peixes.push(p);
  }
  // Algas, arcos brancos e cáusticas suaves substituem a arquitetura escura do castelo.
  for (let i = 0; i < 30; i++) {
    const g = criarMalha(
      scene,
      new T.ConeGeometry(0.3, 2 + (i % 4), 6),
      obterMaterial("#4dc66c", 0.8),
      [((i * 19) % 90) - 45, -0.5, ((i * 11) % 70) - 20],
    );
    g.rotation.z = Math.sin(i) * 0.2;
  }
  for (let i = 0; i < 4; i++)
    criarMalha(
      scene,
      new T.TorusGeometry(9 + i * 2, 0.27, 12, 60, Math.PI),
      branco,
      [20 - i * 10, -1, -7 - i * 6],
    );
  const luzAgua = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { tempo: { value: 0 } },
    vertexShader:
      "varying vec2 p;void main(){p=uv*45.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader:
      "uniform float tempo;varying vec2 p;void main(){float c=pow(max(0.,sin(p.x+sin(p.y+tempo*.5))*cos(p.y+sin(p.x-tempo*.3))),6.);gl_FragColor=vec4(.55,1.,1.,c*.34);}",
  });
  criarMalha(
    scene,
    new T.PlaneGeometry(160, 160),
    luzAgua,
    [0, -1.94, 0],
    [-Math.PI / 2, 0, 0],
  );
  return { scene, agua, bolhas, peixes, luzAgua };
}
export function criarCenaTerraco(castelo) {
  const scene = new T.Scene();
  scene.background = new T.Color("#f0ad44");
  scene.fog = new T.FogExp2("#c5b080", 0.0015);
  const ceu = criarCeuDourado(scene),
    ambiente = new T.HemisphereLight("#ffd891", "#60744d", 1.6);
  scene.add(ambiente);
  const sol = new T.DirectionalLight("#ffb659", 3.6);
  sol.position.set(-30, 80, -40);
  scene.add(sol);
  const arquitetura = criarFortalezaColina({ montanha: false, terraco: true });
  scene.add(arquitetura.grupo);
  const chao = obterMaterial("#c6b792", 0.7);
  criarCaixa(arquitetura.fortaleza, [22, 0.3, 18], chao, [0, 23.8, -23]);
  for (const x of [-11, 11])
    criarCaixa(arquitetura.fortaleza, [0.45, 1, 18], chao, [x, 24.5, -23]);
  criarCaixa(arquitetura.fortaleza, [22, 1, 0.45], chao, [0, 24.5, -32]);
  const breier = criarGabrielBreier();
  breier.group.position.set(0, 24, -22);
  breier.group.rotation.y = Math.PI;
  scene.add(breier.group);
  const axel = criarAxel();
  axel.group.position.set(0, 24, -28);
  scene.add(axel.group);
  const bolas = [criarBolaFutebol(), criarBolaFutebol()];
  bolas.forEach((b, i) => {
    scene.add(b);
    b.position.set(i ? 1 : -1, 24.28, -23.2);
  });
  const calor = new T.PointLight("#ff3b04", 0, 25, 2);
  calor.position.set(0, 25, -23);
  scene.add(calor);
  const clarão = criarMalha(
    scene,
    new T.SphereGeometry(1, 32, 20),
    new T.MeshBasicMaterial({
      color: "#ffb231",
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
    [0, 24.5, -23],
  );
  const onda = criarMalha(
    scene,
    new T.TorusGeometry(1, 0.09, 8, 80),
    new T.MeshBasicMaterial({
      color: "#ffd172",
      transparent: true,
      opacity: 0,
    }),
    [0, 24.3, -23],
    [-Math.PI / 2, 0, 0],
  );
  const mar = criarAgua(850, 850, "#258da6");
  mar.position.y = -17;
  scene.add(mar);
  const destrocos = new T.Group();
  scene.add(destrocos);
  arquitetura.grupo.updateMatrixWorld(true);
  const partes = [];
  arquitetura.fortaleza.traverse((o) => {
    if (o.isMesh) partes.push(o);
  });
  // As próprias peças do castelo voam, junto com clones dos personagens e objetos internos.
  for (const o of partes) {
    const origem = o.getWorldPosition(new T.Vector3());
    destrocos.attach(o);
    o.userData.origem = origem;
  }
  for (const [i, h] of [
    castelo.bolsonaro,
    castelo.lula,
    castelo.davy,
    castelo.little,
    castelo.cj,
  ].entries()) {
    const copia = h.group.clone(true);
    destrocos.add(copia);
    copia.position.set(-8 + i * 4, 14 + i, -4 + i * 2);
    copia.userData.origem = copia.position.clone();
  }
  for (const [i, original] of [
    castelo.terminal,
    castelo.bola,
    castelo.portal,
  ].entries()) {
    const copia = original.clone(true);
    destrocos.add(copia);
    copia.position.set(-3 + i * 3, 15 + i, -5);
    copia.userData.origem = copia.position.clone();
  }
  for (let i = 0; i < 14; i++) {
    const o = criarCaixa(
      destrocos,
      [1.5, 0.25, 0.8],
      obterMaterial("#65503a", 0.8),
      [((i % 5) - 2) * 3, 6 + (i % 4), ((i % 3) - 1) * 4],
    );
    o.userData.origem = o.position.clone();
  }
  const fragmentos = destrocos.children.map((o, i) => ({
    o,
    origem: o.userData.origem.clone(),
    giro: o.rotation.clone(),
    vel: new T.Vector3(
      (o.position.x || Math.sin(i * 2.4) * 3) * 0.75,
      10 + (i % 13),
      (o.position.z + 9) * 0.8 + Math.cos(i) * 4,
    ),
  }));
  return {
    scene,
    ceu,
    ambiente,
    sol,
    breier,
    axel,
    bolas,
    calor,
    clarão,
    onda,
    mar,
    destrocos,
    fragmentos,
    previa: criarPreviaAero(),
  };
}
export function desenharPreviaAero(view, c, tempo) {
  const a = c.previa;
  for (const [i, b] of a.bolhas.entries())
    b.position.y = ((tempo * 0.7 + i * 1.9) % 27) - 1;
  for (const [i, p] of a.peixes.entries()) {
    p.position.set(
      Math.sin(tempo * 0.17 + i) * 22,
      3 + (i % 6) * 1.6,
      -5 + Math.cos(tempo * 0.17 + i) * 13,
    );
    p.rotation.y = -(tempo * 0.17 + i);
    p.rotation.z = Math.sin(tempo * 2 + i) * 0.07;
  }
  a.agua.material.uniforms.tempo.value = tempo;
  a.luzAgua.uniforms.tempo.value = tempo;
  view.camera.position.set(12 + Math.sin(tempo * 0.06) * 5, 7, 22);
  view.camera.lookAt(0, 9, -20);
  view.camera.fov = 65;
  view.camera.updateProjectionMatrix();
  view.renderer.toneMappingExposure = 0.95;
  view.renderer.render(a.scene, view.camera);
}
export function desenharTerraco(view, c, f, reduzido = false) {
  const t = f.tempo,
    cam = view.camera,
    explosao = Math.max(0, t - TEMPOS_TERRACO.explosao);
  const dia = T.MathUtils.smoothstep(
    t,
    TEMPOS_TERRACO.estalo,
    TEMPOS_TERRACO.estalo + 1.2,
  );
  c.ceu.material.uniforms.dia.value = dia;
  c.ceu.material.uniforms.tempo.value = t;
  c.sol.color.set(dia > 0.5 ? "#fff7df" : "#ffb659");
  c.ambiente.intensity = 1.6 + dia * 0.7;
  c.breier.body.scale.y = 1 + Math.sin(t * 2) * 0.006;
  c.breier.head.rotation.y = Math.sin(t * 0.8) * 0.055;
  c.breier.arms[0].rotation.x =
    t < 3 ? -1.25 : t < 7 ? -1.05 : Math.sin(t * 2) * 0.15;
  c.breier.cotovelos[0].rotation.x = t < 3 ? -1.2 : -0.3;
  c.breier.gestoEstalo.rotation.z = t > 2.8 ? -0.7 : 0;
  c.breier.arms[0].rotation.z = t > 2.65 && t < 3.05 ? -0.35 : 0;
  for (const [i, b] of c.bolas.entries()) {
    b.visible = t >= TEMPOS_TERRACO.bolas && t < TEMPOS_TERRACO.explosao;
    const pouso = Math.min(1, Math.max(0, t - TEMPOS_TERRACO.bolas));
    b.position.set(
      i ? 1 : -1,
      24.28 + Math.abs(Math.sin(pouso * Math.PI * 2)) * (1 - pouso) * 0.6,
      -23.2,
    );
    const calor = Math.max(0, (t - 34) / 12);
    b.scale.setScalar(1 + calor * 0.15);
    b.rotation.y = Math.sin(t * 30) * calor * 0.015;
    b.traverse((o) => {
      if (o.isMesh && o.material.emissive) {
        o.material.emissive.set("#ff3600");
        o.material.emissiveIntensity = calor * 1.3;
      }
    });
  }
  c.calor.intensity =
    t < 46 ? Math.max(0, (t - 34) * 4) : Math.max(0, 140 - explosao * 30);
  c.mar.material.uniforms.tempo.value = t;
  c.breier.group.visible = true;
  c.breier.group.position.set(
    -explosao * 4,
    24 + 9 * explosao - 2.5 * explosao * explosao,
    -22 + 5 * explosao,
  );
  c.breier.group.rotation.set(0, Math.PI, explosao * 1.4);
  for (const q of c.fragmentos) {
    q.o.position.copy(q.origem);
    q.o.rotation.copy(q.giro);
    if (explosao > 0) {
      q.o.position.addScaledVector(q.vel, explosao);
      q.o.position.y -= 2.5 * explosao * explosao;
      q.o.rotation.x += explosao * (q.vel.z * 0.1);
      q.o.rotation.z += explosao * (q.vel.x * 0.1);
    }
  }
  c.clarão.visible = explosao > 0 && explosao < 2.3;
  c.clarão.scale.setScalar(1 + explosao * 13);
  c.clarão.material.opacity =
    Math.max(0, 0.75 - explosao * 0.32) * (reduzido ? 0.4 : 1);
  c.onda.visible = explosao > 0 && explosao < 4;
  c.onda.scale.setScalar(1 + explosao * 22);
  c.onda.material.opacity = Math.max(0, 1 - explosao / 4);
  if (t >= TEMPOS_TERRACO.mergulho) {
    desenharPreviaAero(view, c, t - TEMPOS_TERRACO.mergulho);
    return;
  }
  if (explosao > 0) {
    c.axel.group.position.set(
      explosao * 4,
      24 + 12 * explosao - 2.55 * explosao * explosao,
      -28 - explosao * 10,
    );
    c.axel.group.rotation.set(explosao * 0.8, explosao * 0.5, explosao * 0.4);
    if (explosao < 2.5) {
      // Plano aberto: a destruição inteira aparece antes de acompanhar a queda.
      cam.position.set(48, 43, -91);
      cam.lookAt(0, 24, -7);
    } else {
      cam.position.copy(c.axel.group.position).add(new T.Vector3(7, 4, -10));
      cam.lookAt(c.axel.group.position);
    }
  } else {
    c.axel.group.position.set(0, 24, -28);
    c.axel.group.rotation.set(0, 0, 0);
    const conversa = t < 4 || (t > 7.5 && t < 39);
    cam.position.set(
      conversa ? 1.5 : 6,
      conversa ? 25.7 : 27,
      conversa ? -26.5 : -32,
    );
    cam.lookAt(0, 25.25, -22);
  }
  cam.fov = 62;
  cam.far = 1000;
  cam.updateProjectionMatrix();
  view.renderer.toneMappingExposure = 1.15;
  view.renderer.render(c.scene, cam);
}
