import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  obterMaterial,
  criarAxel,
} from "./modelos.js";
import { criarNaverdachi } from "./modelos-frutiger-aero.js";
export function criarEstradaPraia(peugeot) {
  const scene = new T.Scene();
  scene.background = new T.Color("#85cbea");
  scene.fog = new T.Fog("#9fd8e5", 100, 310);
  scene.add(new T.HemisphereLight("#d7faff", "#6d8970", 2.3));
  const sol = new T.DirectionalLight("#fff0ca", 2.8);
  sol.position.set(-35, 50, 20);
  scene.add(sol);
  const asfalto = obterMaterial("#3c474d", 0.9),
    areia = obterMaterial("#d9d6a3", 0.9),
    folha = obterMaterial("#408f59", 0.9);
  criarCaixa(scene, [200, 0.2, 600], areia, [-85, -0.2, 160]);
  criarCaixa(scene, [8, 0.1, 600], asfalto, [0, -0.03, 160]);
  for (const x of [-3.6, 3.6])
    criarCaixa(scene, [0.11, 0.02, 600], obterMaterial("#edf0d3"), [
      x,
      0.03,
      160,
    ]);
  const marcas = [];
  for (let i = 0; i < 42; i++)
    marcas.push(
      criarCaixa(scene, [0.12, 0.02, 3.5], obterMaterial("#e4d777"), [
        0,
        0.04,
        -45 + i * 9,
      ]),
    );
  const agua = new T.Mesh(
    new T.PlaneGeometry(230, 700, 35, 70),
    new T.MeshPhysicalMaterial({
      color: "#26b5ca",
      roughness: 0.19,
      metalness: 0.18,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1,
    }),
  );
  agua.rotation.x = -Math.PI / 2;
  agua.position.set(130, -0.18, 160);
  scene.add(agua);
  const brancas = [];
  for (let i = 0; i < 12; i++)
    brancas.push(
      criarCaixa(scene, [0.16, 0.02, 500], obterMaterial("#b3f1e8", 0.3), [
        17 + i * 0.85,
        -0.12,
        150,
      ]),
    );
  const palmeiras = [];
  for (let i = 0; i < 28; i++) {
    const g = new T.Group();
    scene.add(g);
    g.position.set(i % 2 ? -11 : 10, 0, -40 + i * 17);
    criarCilindro(
      g,
      0.17,
      0.27,
      4.5,
      obterMaterial("#92775a"),
      [0, 2.2, 0],
      [0, 0, 0.08],
    );
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * Math.PI * 2;
      criarElipsoide(
        g,
        [1.7, 0.11, 0.43],
        folha,
        [Math.cos(a) * 1.1, 4.3, Math.sin(a) * 1.1],
        [0.05, a, 0.2],
      );
    }
    palmeiras.push(g);
  }
  const axel = criarAxel(),
    nav = criarNaverdachi();
  peugeot.grupo.add(axel.group, nav.group);
  axel.group.scale.setScalar(0.65);
  axel.group.position.set(-0.4, -0.25, 0.15);
  nav.group.position.set(0, -0.37, -0.85);
  nav.group.scale.setScalar(0.86);
  nav.legs.forEach((l) => (l.rotation.x = -1.2));
  nav.joelhos.forEach((j) => (j.rotation.x = 1.2));
  peugeot.passageiros = [axel.group, nav.group];
  return { scene, peugeot, axel, nav, marcas, agua, brancas, palmeiras };
}
export function desenharEstradaPraia(view, c, f) {
  const t = f.etapa === "fimAero" ? 74 : f.tempo,
    camera = view.camera;
  if (c.peugeot.grupo.parent !== c.scene) c.scene.add(c.peugeot.grupo);
  c.peugeot.grupo.visible = true;
  c.axel.group.visible = c.nav.group.visible = true;
  c.peugeot.grupo.position.set(0, 0.025 * Math.sin(t * 8), 0);
  c.peugeot.grupo.rotation.set(0, 0, 0);
  c.peugeot.bruno.group.visible = true;
  c.peugeot.bruno.head.rotation.y = Math.sin(t * 1.3) * 0.05;
  c.peugeot.bruno.head.rotation.x = Math.sin(t * 3) * 0.02;
  c.marcas.forEach((m, i) => (m.position.z = -45 + ((i * 9 - t * 15) % 378)));
  c.palmeiras.forEach(
    (p, i) => (p.position.z = -45 + ((i * 17 - t * 15 + 999) % 470)),
  );
  c.brancas.forEach(
    (p, i) => (p.position.y = -0.12 + Math.sin(t * 1.5 + i) * 0.018),
  );
  const arr = c.agua.geometry.attributes.position;
  for (let i = 0; i < arr.count; i++)
    arr.setZ(
      i,
      Math.sin(arr.getX(i) * 0.1 + t) * 0.09 +
        Math.cos(arr.getY(i) * 0.06 + t * 0.7) * 0.06,
    );
  arr.needsUpdate = true;
  if (t > 8) {
    camera.position.set(-8, 5.5, -7);
    camera.lookAt(6, 1, 13);
  } else if (t < 1) {
    camera.position.set(3.5, 2, 4);
    camera.lookAt(0.35, 1.1, 0.15);
  } else if (t < 5) {
    camera.position.set(0, 1.35, 0.95);
    camera.lookAt(0, 1.15, -0.4);
  } else {
    const a = 0.5 + Math.sin(t * 0.045) * 0.4;
    camera.position.set(Math.sin(a) * 7, 3.2, Math.cos(a) * 7);
    camera.lookAt(0, 1, 0);
  }
  camera.fov = 62;
  camera.far = 430;
  camera.updateProjectionMatrix();
  view.renderer.toneMappingExposure = 1.03;
  view.renderer.render(c.scene, camera);
}
