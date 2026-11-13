import { criarMenuCidade, desenharMenuCidade } from "./menu-cidade.js";
import { criarMenuNatal, desenharMenuNatal } from "./menu-natal.js";
// Módulo do jogo. Consulte GUIA-DE-EDICAO.md antes de alterar estruturas.
import * as T from "./vendor/three.module.js";
import {
  criarAxel,
  criarCachorro,
  criarCaixa,
  obterMaterial,
} from "./modelos.js";
import { criarMaicon, criarPessoa } from "./personagens.js";
import { criarBolo } from "./objetos-da-historia.js";
import { criarDavyJones } from "./personagens-castelo.js";
function criarMenuNoir() {
  const scene = new T.Scene();
  scene.background = new T.Color("#15191c");
  scene.fog = new T.FogExp2("#1b2022", 0.028);
  scene.add(new T.HemisphereLight("#a8b2bb", "#111214", 0.7));
  const key = new T.DirectionalLight("#c4c7bd", 3.5);
  key.position.set(-5, 10, -2);
  scene.add(key);
  const fill = new T.PointLight("#a6b5c7", 35, 20, 1.5);
  fill.position.set(2, 5, 6);
  scene.add(fill);
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(230, 230, 20, 256, 256, 250);
  grad.addColorStop(0, "#deded0");
  grad.addColorStop(0.85, "#b7b9b1");
  grad.addColorStop(1, "#4d5555");
  g.fillStyle = grad;
  g.beginPath();
  g.arc(256, 256, 251, 0, 7);
  g.fill();
  let r = 982;
  for (let i = 0; i < 700; i++) {
    r = (r * 1664525 + 1013904223) >>> 0;
    const x = r % 512;
    r = (r * 1664525 + 1013904223) >>> 0;
    const y = r % 512;
    if (Math.hypot(x - 256, y - 256) > 240) continue;
    g.fillStyle = i % 2 ? "#757e7825" : "#cdd0c225";
    g.beginPath();
    g.arc(x, y, 2 + (i % 25), 0, 7);
    g.fill();
  }
  const moon = new T.Mesh(
    new T.PlaneGeometry(14, 14),
    new T.MeshBasicMaterial({
      map: new T.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
    }),
  );
  moon.position.set(-2, 6, -12);
  scene.add(moon);
  for (let i = 0; i < 20; i++) {
    const x = -20 + i * 2;
    criarCaixa(scene, [1.8, 6 + (i % 6), 2], obterMaterial("#151a1e"), [
      x,
      0,
      -18 - (i % 3),
    ]);
    for (let k = 0; k < 6; k++)
      criarCaixa(
        scene,
        [0.18, 0.28, 0.02],
        new T.MeshBasicMaterial({ color: "#4d5353" }),
        [x + (k % 2) * 0.5 - 0.25, k * 0.7, -16.9 - (i % 3)],
      );
  }
  criarCaixa(
    scene,
    [24, 1, 15],
    obterMaterial("#252c2e", 0.25, 0.4),
    [3, -1, 0],
    [0, 0, 0.05],
  );
  for (let i = 0; i < 12; i++)
    criarCaixa(scene, [0.15, 0.1, 15], obterMaterial("#394345", 0.25, 0.3), [
      -8 + i * 1.5,
      -0.42,
      0,
    ]);
  const hero = criarAxel();
  hero.group.position.set(3.1, -0.45, 0.5);
  hero.group.scale.setScalar(2.2);
  hero.group.rotation.y = -0.5;
  scene.add(hero.group);
  hero.group.traverse((o) => {
    if (o.isMesh) {
      const m = o.material.clone();
      m.color.multiplyScalar(0.38);
      o.material = m;
    }
  });
  const cape = new T.Mesh(
    new T.ConeGeometry(1.4, 3.2, 5, 1, true, 0.4, 3.8),
    obterMaterial("#12191e", 0.8),
  );
  cape.position.set(3.55, 1.55, -0.6);
  cape.rotation.z = -0.2;
  scene.add(cape);
  const bats = [];
  for (let i = 0; i < 24; i++) {
    const b = new T.Group();
    const shape = new T.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(-0.6, 0.3);
    shape.lineTo(-0.5, -0.1);
    shape.lineTo(-0.25, 0.02);
    shape.lineTo(0, -0.2);
    shape.lineTo(0.25, 0.02);
    shape.lineTo(0.5, -0.1);
    shape.lineTo(0.6, 0.3);
    shape.closePath();
    b.add(
      new T.Mesh(
        new T.ShapeGeometry(shape),
        new T.MeshBasicMaterial({ color: "#080d11", side: T.DoubleSide }),
      ),
    );
    b.position.set(((i % 7) - 3) * 2, 2 + (i % 5), -4 - (i % 4));
    b.scale.setScalar(0.2 + (i % 4) * 0.22);
    scene.add(b);
    bats.push(b);
  }
  const geo = new T.BufferGeometry(),
    rain = new Float32Array(1200);
  for (let i = 0; i < rain.length; i += 6) {
    const x = ((i * 13) % 230) / 10 - 11,
      y = ((i * 17) % 130) / 10,
      z = (i % 60) / 10 - 3;
    rain.set([x, y, z, x - 0.16, y - 0.9, z], i);
  }
  geo.setAttribute("position", new T.BufferAttribute(rain, 3));
  const chuva = new T.LineSegments(
    geo,
    new T.LineBasicMaterial({
      color: "#a5b2ba",
      transparent: true,
      opacity: 0.18,
    }),
  );
  scene.add(chuva);
  return { scene, hero, cape, bats, chuva };
}
function desenharNoir(view, m, estado, time) {
  const n = m.noir;
  n.hero.animate(time, 0.1);
  n.cape.rotation.z = -0.2 + Math.sin(time * 0.6) * 0.05;
  n.bats.forEach((b, i) => {
    b.rotation.z = Math.sin(time * 2 + i) * 0.2;
    b.children[0].scale.y = 0.45 + Math.abs(Math.sin(time * 5 + i)) * 0.55;
    b.position.x = ((i * 2.9 + time * (0.35 + (i % 3) * 0.1)) % 22) - 11;
  });
  n.chuva.position.y = estado.reduced ? 0 : -(time * 4) % 2;
  view.camera.position.set(-0.9, 3.3, 10.5);
  view.camera.lookAt(0.8, 2.6, -1);
  view.camera.fov = 50;
  view.camera.far = 150;
  view.camera.updateProjectionMatrix();
  view.renderer.toneMappingExposure = 1;
  view.renderer.render(n.scene, view.camera);
}
export function criarCenaDoMenu() {
  const scene = new T.Scene();
  scene.background = new T.Color("#060e19");
  scene.fog = new T.FogExp2("#060e19", 0.065);
  scene.add(new T.HemisphereLight("#7996ca", "#151008", 1.4));
  const blue = new T.PointLight("#327bff", 55, 15, 1.5);
  blue.position.set(3, 3, -1);
  scene.add(blue);
  const key = new T.SpotLight("#e7c486", 90, 18, 0.7, 0.8);
  key.position.set(-1, 5, 5);
  key.target.position.set(2, 1, 0);
  scene.add(key, key.target);
  criarCaixa(
    scene,
    [30, 0.2, 25],
    obterMaterial("#151c22", 0.8, 0.25),
    [0, -0.1, 0],
  );
  for (let i = 0; i < 8; i++) {
    criarCaixa(scene, [0.8, 6, 0.8], obterMaterial("#272c27", 0.95), [
      -5 + i * 2,
      2.8,
      -4 - (i % 2) * 2,
    ]);
    criarCaixa(
      scene,
      [1.4, 0.08, 0.15],
      obterMaterial("#829eaf", 0.5, 0, {
        emissive: "#6b9dc4",
        emissiveIntensity: 1,
      }),
      [-5 + i * 2, 4, -4],
    );
  }
  const axel = criarAxel(),
    cachorro = criarCachorro(),
    maicon = criarMaicon();
  axel.group.position.set(1, 0, 0.7);
  axel.group.rotation.y = -0.4;
  cachorro.group.position.set(2.3, 0, 1.05);
  cachorro.group.rotation.y = -0.4;
  maicon.group.position.set(2.25, 0, -0.75);
  maicon.group.scale.setScalar(1.22);
  maicon.group.rotation.y = -0.32;
  scene.add(axel.group, cachorro.group, maicon.group);
  const brita = criarPessoa(),
    bolo = criarBolo();
  brita.group.position.set(3.45, -0.38, -0.05);
  brita.group.rotation.y = -0.3;
  brita.legs.forEach((l) => (l.rotation.x = -1.25));
  scene.add(brita.group, bolo);
  bolo.position.set(3.25, 0.86, 0.48);
  bolo.rotation.y = -0.3;
  const mesa = criarCaixa(
    scene,
    [1.25, 0.1, 0.8],
    obterMaterial("#272824", 0.75),
    [3.3, 0.83, 0.5],
  );
  for (const x of [2.85, 3.75])
    criarCaixa(scene, [0.05, 0.8, 0.05], obterMaterial("#1c2023", 0.7), [
      x,
      0.4,
      0.5,
    ]);
  criarCaixa(
    scene,
    [0.65, 0.08, 0.6],
    obterMaterial("#141a20", 0.8),
    [3.45, 0.43, -0.1],
  );
  const luzBolo = new T.PointLight("#d7a268", 5, 3, 2);
  luzBolo.position.set(3.2, 1.6, 0.8);
  scene.add(luzBolo);
  const davy = criarDavyJones();
  scene.add(davy.group);
  davy.group.position.set(4.8, 0, -1.8);
  davy.group.rotation.y = -0.55;
  return {
    natal: criarMenuNatal(),
    cidade: criarMenuCidade(),
    noir: criarMenuNoir(),
    scene,
    axel,
    cachorro,
    maicon,
    blue,
    brita,
    bolo,
    luzBolo,
    davy,
  };
}
export function desenharMenu(cenaDoJogo, estado, time) {
  const m = cenaDoJogo.menuScene;
  m.axel.animate(time, 0);
  m.cachorro.animate(time, 0);
  m.maicon.animate(time, 0, true);
  m.davy.head.rotation.set(
    Math.sin(time * 1.6) * 0.028,
    Math.sin(time * 0.7) * 0.07,
    0,
  );
  m.davy.body.scale.y = 1 + Math.sin(time * 2) * 0.006;
  m.davy.arms[0].rotation.x = -0.3 + Math.sin(time * 2.5) * 0.14;
  if (estado.chuteMenuAtivo) {
    desenharChuteDoMenu(cenaDoJogo, estado, time);
    return;
  }
  if (estado.tema === "natal") desenharMenuNatal(cenaDoJogo, estado, time);
  else if (estado.tema === "noite") desenharNoir(cenaDoJogo, m, estado, time);
  else desenharMenuCidade(cenaDoJogo, estado, time);
  return;
  m.maicon.group.position.set(2.25, 0, -0.75);
  m.maicon.group.rotation.x = 0;
  m.bolo.position.set(3.25, 0.86, 0.48);
  m.bolo.rotation.set(0, -0.3, 0);
  m.brita.group.scale.set(1, 1, 1);
  // Ciclo narrativo do menu: comer, olhar para trás, agarrar e arremessar.
  m.inicioTempo ??= time;
  const t = estado.reduced ? 2 : (time - m.inicioTempo) % 19;
  const suave = (a, b) => {
    const v = T.MathUtils.clamp((t - a) / (b - a), 0, 1);
    return v * v * (3 - 2 * v);
  };
  const olhar = suave(6, 8),
    golpe = suave(9, 10.3),
    voo = Math.max(0, t - 10.3);
  m.maicon.head.rotation.y = olhar * 1.1 + Math.sin(time * 0.8) * 0.035;
  m.maicon.head.rotation.x = Math.sin(time * 1.9) * 0.018;
  m.maicon.group.rotation.y = -0.32 + olhar * 0.95;
  m.maicon.arms[0].rotation.x = -0.3 - golpe * 1.1 + suave(10.3, 10.6) * 1.8;
  m.maicon.group.scale.y = 1.22 + Math.sin(time * 2.1) * 0.007;
  m.brita.group.visible = voo < 2.6;
  m.brita.group.position.set(
    3.45 + voo * 7.4,
    -0.38 + Math.max(0, voo * 5.8 - 4.905 * voo * voo),
    -0.05 - voo * 3.2,
  );
  m.brita.group.rotation.set(voo * -3.7, -0.3 + voo * 1.4, voo * -2.7);
  m.brita.group.scale.y = 1 + Math.sin(time * 2.3) * 0.006;
  m.brita.head.rotation.set(
    Math.sin(time * 1.9) * 0.035,
    Math.sin(time * 0.7) * 0.045,
    Math.sin(time * 1.1) * 0.015,
  );
  m.brita.hood.rotation.copy(m.brita.head.rotation);
  m.brita.arms.forEach(
    (a, i) =>
      (a.rotation.x = voo
        ? Math.sin(voo * 12 + i) * 0.9
        : -1.1 + Math.sin(time * 2 + i) * 0.24),
  );
  m.brita.legs.forEach(
    (l, i) => (l.rotation.x = voo ? Math.sin(voo * 9 + i) * 0.65 : -1.25),
  );
  m.bolo.rotation.z = voo < 0.3 ? Math.sin(time * 1.4) * 0.008 : 0;
  m.blue.intensity = estado.reduced ? 55 : 52 + Math.sin(time * 1.9) * 5;
  cenaDoJogo.camera.position.set(0.2, 1.65, 6.1);
  cenaDoJogo.camera.lookAt(0.2, 1.12, 0);
  cenaDoJogo.camera.fov = 48;
  cenaDoJogo.camera.updateProjectionMatrix();
  cenaDoJogo.renderer.toneMappingExposure = 1.1;
  cenaDoJogo.renderer.render(m.scene, cenaDoJogo.camera);
}

/** Antecipação, chute com pausa cômica e voo exagerado antes de entrar na história. */
function desenharChuteDoMenu(view, estado, time) {
  const m = view.menuScene,
    t = estado.tempoChuteMenu;
  const suave = (a, b) => {
    const n = T.MathUtils.clamp((t - a) / (b - a), 0, 1);
    return n * n * (3 - 2 * n);
  };
  const preparar = suave(0, 0.6),
    chutar = suave(0.65, 0.95),
    recolher = suave(1.16, 1.7);
  const voo = Math.max(0, t - 1.08); // Breve pose congelada no impacto, como em um desenho animado.
  m.maicon.group.position.set(2.25 + preparar * 0.14, 0, -0.4);
  m.maicon.group.rotation.set(
    -0.12 * preparar + 0.19 * chutar,
    1.27 * preparar,
    0,
  );
  m.maicon.group.scale.setScalar(1.22);
  m.maicon.head.rotation.set(-0.07, Math.sin(time) * 0.025, 0);
  m.maicon.legs[0].rotation.x = 0.7 * preparar - 2.3 * chutar + 1.6 * recolher;
  m.maicon.legs[1].rotation.x = -0.12;
  m.maicon.arms[0].rotation.x = -0.7 * preparar;
  m.maicon.arms[1].rotation.x = 0.6 * preparar;
  m.brita.group.visible = true;
  const tombar = voo * (estado.reduced ? 1.1 : 5.5),
    impacto = chutar * (1 - suave(1.08, 1.3));
  m.brita.group.position.set(
    3.45 + voo * 6.1,
    -0.38 + voo * 6.2 - 2.8 * voo * voo,
    -0.05 - voo * 1.1,
  );
  m.brita.group.rotation.set(tombar, -0.3 + voo * 0.9, -tombar * 0.7);
  m.brita.group.scale.set(
    1 + impacto * 0.12,
    1 - impacto * 0.19,
    1 + impacto * 0.1,
  );
  m.brita.head.rotation.set(
    Math.sin(time * 2) * 0.03,
    -preparar * 0.5,
    voo ? Math.sin(voo * 9) * 0.16 : 0,
  );
  m.brita.hood.rotation.copy(m.brita.head.rotation);
  m.brita.arms.forEach(
    (a, i) => (a.rotation.x = voo ? Math.sin(voo * 14 + i * 2) * 1.3 : -1.1),
  );
  m.brita.legs.forEach(
    (p, i) =>
      (p.rotation.x = voo ? Math.sin(voo * 12 + i * Math.PI) * 1.1 : -1.25),
  );
  m.bolo.position.set(
    3.25 + voo * 1.9,
    0.86 + voo * 3.3 - voo * voo * 2,
    0.48 + voo * 0.8,
  );
  m.bolo.rotation.set(voo * 2, -0.3 + voo * 4, voo * 3);
  m.blue.intensity = 55;
  const acompanhar = suave(1.1, 2.7);
  const abalo = estado.reduced
    ? 0
    : Math.sin(t * 93) * Math.max(0, 1 - Math.abs(t - 0.96) * 12) * 0.045;
  view.camera.position.set(
    5.3 + acompanhar * 2.6,
    1.9 + acompanhar * 0.8 + abalo,
    5.5,
  );
  view.camera.lookAt(3.1 + acompanhar * 4, 1.1 + acompanhar * 0.9, 0);
  view.camera.fov = 57;
  view.camera.updateProjectionMatrix();
  view.renderer.toneMappingExposure = 1.1;
  view.renderer.render(m.scene, view.camera);
}
