import { CONFIGURACAO } from "./configuracao.js";
// CENA DE BRITA — sala de aula, bolo, capuz e portal.
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarTubo,
  obterMaterial,
  criarMalha,
  criarTexturaTexto,
} from "./modelos.js";
import { criarPessoa, criarMaicon } from "./personagens.js";
import { criarBolo } from "./objetos-da-historia.js";
import { criarCorpoFisico } from "./fisica-do-corpo.js";
export const DURACAO_CENA_BRITA = CONFIGURACAO.duracaoCenaBrita;
const limitarEntreZeroEUm = (n) => Math.max(0, Math.min(1, n));
export function momentoDaCenaBrita(t) {
  if (t < 3) return "cake";
  if (t < 5.8) return "teacher";
  if (t < 7) return "surprise";
  if (t < 7.5) return "punch";
  if (t < 12.5) return "portal";
  return "dimension";
}
export function criarSalaDeAula() {
  const scene = new T.Scene();
  scene.background = new T.Color("#10151a");
  scene.fog = new T.Fog("#192024", 12, 30);
  scene.add(new T.HemisphereLight("#c1d0d7", "#28251b", 1.1));
  const plaster = obterMaterial("#929b91", 0.98),
    steel = obterMaterial("#34494a", 0.5, 0.3),
    wood = obterMaterial("#99734d", 0.88),
    black = obterMaterial("#172327", 0.8);
  criarCaixa(scene, [12, 0.15, 14], obterMaterial("#6d7265", 0.92), [0, -0.075, 0]);
  criarCaixa(scene, [12, 0.12, 14], plaster, [0, 3.6, 0]);
  criarCaixa(scene, [0.15, 3.6, 14], plaster, [-6, 1.8, 0]);
  for (const z of [-7, 7]) criarCaixa(scene, [12, 3.6, 0.15], plaster, [0, 1.8, z]);
  criarCaixa(scene, [0.15, 3.6, 7.65], plaster, [6, 1.8, -3.175]);
  criarCaixa(scene, [0.15, 3.6, 3.05], plaster, [6, 1.8, 5.475]);
  criarCaixa(scene, [0.15, 0.3, 3.3], plaster, [6, 3.45, 2.3]);
  const portalCover = criarCaixa(scene, [0.15, 3.3, 3.3], plaster, [6, 1.65, 2.3]);
  const yellow = obterMaterial("#a29b6c", 0.98);
  criarCaixa(scene, [19, 0.1, 3.3], obterMaterial("#5d5d43", 1), [15.5, -0.05, 2.3]);
  criarCaixa(scene, [19, 0.1, 3.3], yellow, [15.5, 3.3, 2.3]);
  for (const z of [0.65, 3.95]) {
    criarCaixa(scene, [19, 3.3, 0.12], yellow, [15.5, 1.65, z]);
    criarCaixa(scene, [19, 0.14, 0.13], obterMaterial("#323728", 1), [15.5, 0.07, z]);
  }
  for (const x of [7, 11, 15, 19, 23]) {
    criarCaixa(
      scene,
      [0.9, 0.05, 0.22],
      obterMaterial("#d6dab5", 0.4, 0, {
        emissive: "#abb786",
        emissiveIntensity: 1,
      }),
      [x, 3.24, 2.3],
    );
    const l = new T.PointLight("#c1ca8b", 9, 7, 1.5);
    l.position.set(x, 2.9, 2.3);
    scene.add(l);
  }
  for (const x of [-3, 0, 3])
    for (const z of [-4, 0, 4]) {
      criarCaixa(
        scene,
        [1.4, 0.06, 0.45],
        obterMaterial("#c9d1bd", 0.4, 0, {
          emissive: "#cbd5c7",
          emissiveIntensity: 0.8,
        }),
        [x, 3.52, z],
      );
      const l = new T.PointLight("#e7e5cf", 14, 8, 1.4);
      l.position.set(x, 3.25, z);
      scene.add(l);
    }
  criarCaixa(scene, [6.5, 1.6, 0.1], obterMaterial("#254538", 0.98), [0, 2.1, -6.85]);
  criarCaixa(scene, [6.7, 0.06, 0.22], steel, [0, 1.28, -6.76]);
  criarCaixa(
    scene,
    [2.6, 0.35, 0.03],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto("HTML + CSS", "#254538", "#d3dccb"),
      roughness: 1,
    }),
    [0, 2.43, -6.785],
  );
  for (let i = 0; i < 5; i++)
    criarCaixa(scene, [1 + i * 0.14, 0.025, 0.012], obterMaterial("#b9c6ae", 1), [
      -1.3,
      2.12 - i * 0.13,
      -6.79,
    ]);
  function desk(x, z) {
    const group = new T.Group();
    group.position.set(x, 0, z);
    scene.add(group);
    criarCaixa(group, [1.15, 0.07, 0.75], wood, [0, 0.82, 0]);
    for (const sx of [-0.47, 0.47])
      for (const sz of [-0.27, 0.27]) criarCaixa(group, [0.035, 0.8, 0.035], steel, [sx, 0.4, sz]);
    criarCaixa(group, [0.86, 0.16, 0.035], steel, [0, 0.69, 0.3]);
    criarCaixa(group, [0.66, 0.055, 0.55], wood, [0, 0.48, 0.69]);
    criarCaixa(group, [0.66, 0.55, 0.045], wood, [0, 0.78, 0.92]);
    for (const sx of [-0.27, 0.27])
      for (const sz of [0.45, 0.91]) criarCaixa(group, [0.032, 0.47, 0.032], steel, [sx, 0.24, sz]);
    return group;
  }
  for (const x of [-3, 0, 3]) for (const z of [-2, 1, 4]) desk(x, z);
  // Janelas com caixilhos e uma porta para a entrada do professor.
  for (const z of [-3, 1, 4]) {
    criarCaixa(
      scene,
      [0.05, 1.5, 2.1],
      obterMaterial("#63878f", 0.4, 0.12, {
        emissive: "#366273",
        emissiveIntensity: 0.25,
      }),
      [-5.89, 2.05, z],
    );
    for (const dz of [-1.06, 0, 1.06])
      criarCaixa(scene, [0.07, 1.55, 0.035], steel, [-5.83, 2.05, z + dz]);
    criarCaixa(scene, [0.07, 0.035, 2.15], steel, [-5.83, 2.05, z]);
  }
  criarCaixa(scene, [1.2, 2.6, 0.08], obterMaterial("#66583d", 0.85), [-4.7, 1.3, -6.85]);
  criarElipsoide(
    scene,
    [0.035, 0.035, 0.028],
    obterMaterial("#c0b58c", 0.3, 0.7),
    [-4.25, 1.1, -6.77],
  );
  const brita = criarPessoa(),
    teacher = criarPessoa({
      teacher: true,
    });
  scene.add(brita.group, teacher.group);
  brita.group.position.set(0, -0.35, 1.55);
  brita.group.rotation.y = Math.PI;
  teacher.group.position.set(-4.4, 0, -5.8);
  const cake = criarBolo();
  cake.position.set(0.1, 0.86, 0.93);
  scene.add(cake);
  const maicon = criarMaicon();
  scene.add(maicon.group);
  maicon.group.position.set(0, 0, 4.5);
  const physics = criarCorpoFisico(),
    ragGroup = new T.Group();
  scene.add(ragGroup);
  const ragBones = [];
  for (const [a, b] of physics.links.slice(0, 12)) {
    const bone = criarCilindro(ragGroup, 0.065, 0.065, 1, obterMaterial("#15171b", 0.9), [0, 0, 0]);
    ragBones.push({
      bone,
      a,
      b,
    });
  }
  const ragHead = brita.head.clone(true);
  ragHead.scale.setScalar(0.87);
  ragGroup.add(ragHead);
  const ragEnds = [5, 8, 10, 12].map((id, i) => ({
    id,
    part: criarElipsoide(
      ragGroup,
      i < 2 ? [0.045, 0.06, 0.045] : [0.075, 0.06, 0.13],
      obterMaterial(i < 2 ? "#c99a78" : "#101318", 0.88),
      [0, 0, 0],
    ),
  }));
  const ragTorso = criarCaixa(
    ragGroup,
    [0.36, 0.38, 0.22],
    obterMaterial("#141619", 0.92),
    [0, 0, 0],
  );
  ragGroup.visible = false;
  const eatingHand = new T.Group();
  scene.add(eatingHand);
  criarElipsoide(eatingHand, [0.043, 0.06, 0.038], obterMaterial("#c99a78", 0.9), [0, 0, 0]);
  const fork = new T.Group();
  eatingHand.add(fork);
  fork.position.set(0, 0.03, -0.02);
  fork.rotation.z = Math.PI;
  criarCilindro(fork, 0.004, 0.004, 0.16, obterMaterial("#a0aeb3", 0.3, 0.8), [0, -0.04, 0]);
  for (const x of [-0.012, 0, 0.012])
    criarCaixa(fork, [0.004, 0.035, 0.004], obterMaterial("#a0aeb3", 0.3, 0.8), [x, -0.135, 0]);
  criarCaixa(fork, [0.028, 0.025, 0.026], obterMaterial("#a36a3f", 0.94), [0, -0.14, 0]);
  const eatingSleeve = new T.Group();
  scene.add(eatingSleeve);
  const portal = new T.Group();
  portal.position.set(5.45, 1.65, 2.3);
  portal.rotation.y = -Math.PI / 2;
  scene.add(portal);
  const glow = obterMaterial("#4b9bed", 0.2, 0.3, {
    emissive: "#277fe6",
    emissiveIntensity: 2,
  });
  const rings = [];
  for (let i = 0; i < 5; i++) {
    const ring = criarMalha(
      portal,
      new T.TorusGeometry(1.45 + i * 0.045, 0.022, 8, 96),
      glow,
      [0, 0, -i * 0.13],
      [i * 0.06, i * 0.1, 0],
    );
    rings.push(ring);
  }
  const fragments = [];
  for (let i = 0; i < 42; i++) {
    const a = (i / 42) * 6.283,
      r = 1.47 + (i % 4) * 0.06;
    const p = criarCaixa(
      portal,
      [0.07, 0.2, 0.05],
      glow,
      [Math.cos(a) * r, Math.sin(a) * r, 0.05],
      [0, 0, a],
    );
    fragments.push(p);
  }
  const portalLight = new T.PointLight("#3c9cff", 0, 12, 1.5);
  portalLight.position.set(4.5, 1.8, 2.3);
  scene.add(portalLight);
  portal.visible = false;
  return {
    scene,
    brita,
    teacher,
    cake,
    portal,
    portalCover,
    rings,
    fragments,
    portalLight,
    eatingHand,
    eatingSleeve,
    maicon,
    physics,
    ragGroup,
    ragBones,
    ragHead,
    ragTorso,
    ragEnds,
    physicsTime: 0,
  };
}
export function desenharSalaDeAula(cenaDoJogo, estado) {
  const c = cenaDoJogo.classroom,
    t = estado.tempoCenaBrita,
    beat = momentoDaCenaBrita(t),
    punch = limitarEntreZeroEUm((t - 6.65) / 0.45),
    flight = limitarEntreZeroEUm((t - 7.2) / 4.1);
  const camera = cenaDoJogo.camera;
  camera.rotation.order = "YXZ";
  const flightTime = Math.max(0, t - 7.2);
  c.ragGroup.visible = flightTime > 0 && flightTime < 4.1;
  if (flightTime > 0) {
    if (flightTime < c.physicsTime || c.physicsTime === 0) {
      c.physics.reset(
        [0, 0.02, 1.55],
        [CONFIGURACAO.impulsoBritaHorizontal, CONFIGURACAO.impulsoBritaVertical, 0.18],
      );
      c.physicsTime = 0;
    }
    while (c.physicsTime + 1 / 120 <= Math.min(flightTime, 4.1)) {
      c.physics.step(1 / 120);
      c.physicsTime += 1 / 120;
    }
    for (const { bone, a, b } of c.ragBones) {
      const x = new T.Vector3(...c.physics.nodes[a].p),
        y = new T.Vector3(...c.physics.nodes[b].p);
      bone.position.copy(x).add(y).multiplyScalar(0.5);
      bone.scale.y = x.distanceTo(y);
      bone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), y.sub(x).normalize());
    }
    c.ragGroup.visible = c.physics.nodes[1].p[0] < 24;
    c.ragHead.position.set(...c.physics.nodes[0].p);
    c.ragHead.rotation.z = Math.atan2(
      c.physics.nodes[0].p[0] - c.physics.nodes[1].p[0],
      c.physics.nodes[0].p[1] - c.physics.nodes[1].p[1],
    );
    for (const { id, part } of c.ragEnds) part.position.set(...c.physics.nodes[id].p);
    c.ragTorso.position.set(...c.physics.nodes[1].p);
    c.ragTorso.quaternion.copy(c.ragBones[1].bone.quaternion);
  } else c.physicsTime = 0;
  const approach = limitarEntreZeroEUm((t - 2.8) / 2.3);
  c.maicon.group.position.set(0, 0, 4.5 - approach * 2.1);
  c.maicon.group.rotation.y = Math.PI;
  c.maicon.animate(t, approach < 1 ? 2 : 0);
  c.maicon.arms[0].rotation.x = t > 4.5 && t < 6.6 ? -1.45 : 0;
  const pull = limitarEntreZeroEUm((t - 5.2) / 0.8);
  c.brita.hood.position.set(pull * 0.3, 1.78 + Math.sin(pull * Math.PI) * 0.3, -pull * 0.65);
  c.brita.hood.rotation.x = pull * 1.5;
  c.brita.hood.visible = flightTime === 0;
  c.brita.group.visible = flightTime === 0;
  c.brita.group.position.set(
    flight * 5.6,
    -0.35 + Math.sin(flight * Math.PI) * 1.8 + flight * 0.5,
    1.55 + flight * 0.75,
  );
  c.brita.group.rotation.set(
    flight * (estado.reduced ? 0 : 5),
    Math.PI,
    flight * (estado.reduced ? 0 : -3),
  );
  c.brita.legs.forEach((l, i) => (l.rotation.x = flight > 0 ? -Math.sin(t * 5 + i) * 0.7 : -1.45));
  c.brita.arms[0].visible = flight > 0;
  c.eatingHand.visible = flight === 0;
  c.eatingSleeve.visible = flight === 0;
  c.brita.arms[0].rotation.x = -1.4;
  c.brita.arms[1].rotation.x = -0.65;
  c.brita.head.rotation.y = beat === "surprise" ? -0.55 : Math.sin(t * 1.7) * 0.06;
  const bite = (Math.sin(t * 2.1) + 1) / 2;
  c.eatingHand.position.set(0.06 - bite * 0.16, 0.94 + bite * 0.27, 0.95 + bite * 0.45);
  if (c.sleeveMesh) {
    c.sleeveMesh.geometry.dispose();
    c.eatingSleeve.remove(c.sleeveMesh);
  }
  c.sleeveMesh = criarTubo(
    c.eatingSleeve,
    [
      [-0.23, 0.99, 1.55],
      [-0.34, 0.91, 1.3],
      [c.eatingHand.position.x, c.eatingHand.position.y, c.eatingHand.position.z],
    ],
    0.056,
    obterMaterial("#141619", 0.95),
  );
  const walk = limitarEntreZeroEUm((t - 2.7) / 3);
  c.teacher.group.position.set(-4.4 + walk * 5.28, 0, -5.8 + walk * 6.7);
  c.teacher.group.rotation.y = Math.atan2(
    -c.teacher.group.position.x,
    1.55 - c.teacher.group.position.z,
  );
  c.teacher.legs.forEach(
    (l, i) => (l.rotation.x = walk > 0 && walk < 1 ? Math.sin(t * 10 + i * Math.PI) * 0.48 : 0),
  );
  c.teacher.arms[0].rotation.x =
    punch < 1 ? -1.52 * punch : -1.52 + limitarEntreZeroEUm((t - 7.15) / 1.2) * 1.25;
  c.teacher.arms[1].rotation.x = walk < 1 ? Math.sin(t * 10) * 0.2 : 0;
  c.portal.visible = t > 6.85;
  const opening = limitarEntreZeroEUm((t - 6.85) / 0.4);
  c.portal.scale.setScalar(Math.max(0.001, opening));
  c.portalCover.scale.y = Math.max(0.001, 1 - opening);
  c.portalCover.visible = opening < 1;
  c.portalLight.intensity = opening * 16;
  c.rings.forEach((r, i) => (r.rotation.z = t * (i % 2 ? -0.7 : 0.5)));
  c.fragments.forEach((f, i) => {
    f.position.z = Math.sin(t * 2 + i) * 0.13;
  });
  if (t < 3) {
    camera.position.set(-1.6, 1.35, -0.7);
    camera.lookAt(0, 0.99, 1.25);
  } else if (t < 6.3) {
    camera.position.set(-2.8, 2.0, 3.8);
    camera.lookAt(-0.5, 1.2, 0.4);
  } else if (t < 7.4) {
    camera.position.set(-1.5, 1.6, 3);
    camera.lookAt(0.25, 1.1, 1.2);
  } else {
    const target = c.physics.nodes[1].p,
      x = Math.min(22, Math.max(0, target[0]));
    camera.position.set(x - 2.5, 2.1, 4.8 - Math.min(1, Math.max(0, (x - 3) / 3)) * 2.5);
    camera.lookAt(x, Math.max(0.8, Math.min(2.5, target[1])), 1.8);
  }
  camera.fov = 62;
  camera.updateProjectionMatrix();
  camera.rotation.z = !estado.reduced && t > 6.95 && t < 7.35 ? Math.sin(t * 95) * 0.035 : 0;
  cenaDoJogo.renderer.toneMappingExposure = 1.15;
  cenaDoJogo.renderer.render(c.scene, camera);
}
