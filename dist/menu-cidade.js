import * as T from "./vendor/three.module.js";
import { criarCaixa, obterMaterial, criarAxel } from "./modelos.js";
import { povoarCenario } from "./figurantes.js";
export function criarMenuCidade() {
  const scene = new T.Scene();
  scene.background = new T.Color("#a0b89d");
  scene.fog = new T.Fog("#a0b89d", 40, 170);
  const ambient = new T.HemisphereLight("#f2e8c9", "#394331", 2);
  scene.add(ambient);
  const sun = new T.DirectionalLight("#fff0c1", 3);
  sun.position.set(-30, 60, -20);
  scene.add(sun);
  criarCaixa(scene, [140, 0.3, 220], obterMaterial("#6f7c61"), [0, -0.32, -30]);
  criarCaixa(scene, [16, 0.12, 210], obterMaterial("#383c39"), [0, -0.1, -30]);
  for (const x of [-10, 10])
    criarCaixa(scene, [4, 0.18, 210], obterMaterial("#a9b2a0"), [x, 0, -30]);
  for (let i = 0; i < 35; i++)
    for (const x of [-0.15, 0.15])
      criarCaixa(scene, [0.08, 0.015, 2], obterMaterial("#d5c888"), [
        x,
        0.01,
        32 - i * 5,
      ]);
  for (const side of [-1, 1])
    for (let i = 0; i < 12; i++) {
      const x = side * (18 + (i % 3) * 3),
        z = 30 - i * 12,
        h = 7 + ((i * 7) % 18);
      criarCaixa(
        scene,
        [10, h, 9],
        obterMaterial(["#a3a79a", "#bcb6a4", "#717f7c"][i % 3]),
        [x, h / 2, z],
      );
      for (let y = 2; y < h; y += 2.7)
        for (const dx of [-3, 0, 3])
          criarCaixa(
            scene,
            [1.35, 1.5, 0.05],
            obterMaterial("#486368", 0.23, 0.35),
            [x + dx, y, z + 4.53],
          );
      criarCaixa(scene, [0.1, 6, 0.1], obterMaterial("#39463c"), [
        side * 9,
        3,
        z,
      ]);
      criarCaixa(scene, [1, 0.12, 0.25], obterMaterial("#d3dcc1"), [
        side * 8.6,
        6,
        z,
      ]);
    }
  const cars = [];
  for (let i = 0; i < 9; i++) {
    const car = new T.Group(),
      side = i % 2 ? 1 : -1;
    scene.add(car);
    const paint = obterMaterial(
      ["#b9b9ab", "#3c5765", "#92765b", "#814640"][i % 4],
      0.27,
      0.38,
    );
    criarCaixa(car, [1.8, 0.65, 3.8], paint, [0, 0.7, 0]);
    criarCaixa(
      car,
      [1.55, 0.65, 2],
      obterMaterial("#30434a", 0.13, 0.4),
      [0, 1.3, -0.12],
    );
    for (const x of [-0.91, 0.91])
      for (const z of [-1.2, 1.2]) {
        const wheel = new T.Mesh(
          new T.CylinderGeometry(0.34, 0.34, 0.18, 16),
          obterMaterial("#151817"),
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.36, z);
        car.add(wheel);
      }
    car.rotation.y = side > 0 ? 0 : Math.PI;
    cars.push({ car, side, offset: i * 19 });
  }
  const hero = criarAxel();
  hero.group.position.set(8.3, 0.15, 6);
  hero.group.rotation.y = -0.5;
  scene.add(hero.group);
  const crowd = povoarCenario(scene, "praia");
  return { scene, ambient, sun, cars, hero, crowd };
}
export function desenharMenuCidade(view, estado, time) {
  const c = view.menuScene.cidade,
    aero = estado.tema === "aero";
  c.scene.background.set(aero ? "#79c9e7" : "#a0b39a");
  c.scene.fog.color.copy(c.scene.background);
  c.ambient.intensity = aero ? 2.4 : 1.6;
  c.sun.intensity = aero ? 3.1 : 2.2;
  c.cars.forEach(({ car, side, offset }) => {
    car.position.set(
      side * 3.5,
      0,
      ((time * (side > 0 ? 5 : -5) + offset + 10000) % 190) - 140,
    );
  });
  c.hero.animate(time, 0.1);
  c.crowd.update(time, estado.quality, estado.figurantes !== false);
  view.camera.position.set(-7.3, 3.5, 20);
  view.camera.lookAt(0, 3, -30);
  view.camera.fov = 57;
  view.camera.far = 250;
  view.camera.updateProjectionMatrix();
  view.renderer.toneMappingExposure = aero ? 1.1 : 0.9;
  view.renderer.render(c.scene, view.camera);
}
