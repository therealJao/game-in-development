// Módulo do jogo. Consulte GUIA-DE-EDICAO.md antes de alterar estruturas.
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarTubo,
  obterMaterial,
  criarMalha,
  criarTexturaTexto,
  criarAxel,
  criarCachorro,
} from "./modelos.js";
import { criarPessoa, criarMaicon } from "./personagens.js";
import { criarBolo, criarSacola, criarBiz } from "./objetos-da-historia.js";
export function criarCalabouco() {
  const scene = new T.Scene();
  scene.background = new T.Color("#090d12");
  scene.fog = new T.Fog("#090d12", 12, 37);
  scene.add(new T.HemisphereLight("#899cad", "#17100b", 1.3));
  const stone = obterMaterial("#343e42", 0.97),
    iron = obterMaterial("#252c30", 0.62, 0.5);
  criarCaixa(scene, [18, 0.2, 24], stone, [0, -0.1, 0]);
  for (const side of [-1, 1])
    for (let z = -11; z <= 11; z++)
      for (let y = 0; y < 5; y++)
        criarCaixa(scene, [0.45, 0.48, 0.95], obterMaterial(y % 2 ? "#303b3f" : "#3a4245", 0.95), [
          side * 8.8,
          y * 0.5 + 0.25,
          z + (y % 2) * 0.25,
        ]);
  criarCaixa(scene, [18, 4, 0.4], stone, [0, 2, -11.8]);
  criarCaixa(scene, [3, 4, 0.4], stone, [-7.5, 2, 11.8]);
  criarCaixa(scene, [11, 4, 0.4], stone, [3.5, 2, 11.8]);
  for (const x of [-7, -3, 3, 7]) {
    criarCilindro(scene, 0.18, 0.23, 3.8, stone, [x, 1.9, -6]);
    criarMalha(scene, new T.TorusGeometry(2, 0.16, 8, 32, Math.PI), stone, [x, 2, -6]);
  }
  for (const x of [-6, 6]) {
    const flame = obterMaterial("#e59a39", 0.3, 0, {
      emissive: "#fa8a26",
      emissiveIntensity: 2,
    });
    criarCilindro(scene, 0.08, 0.12, 0.5, iron, [x, 1.8, -3]);
    criarElipsoide(scene, [0.12, 0.24, 0.12], flame, [x, 2.12, -3]);
    const light = new T.PointLight("#ffb262", 32, 15, 1.5);
    light.position.set(x, 2.2, -3);
    scene.add(light);
  }
  const keyLight = new T.PointLight("#d2d8df", 18, 12, 1.5);
  keyLight.position.set(0, 3, -1);
  scene.add(keyLight);
  const board = criarCaixa(
    scene,
    [3.2, 0.15, 2.3],
    obterMaterial("#087d86", 0.47, 0.3),
    [0, 0.12, -3],
  );
  board.name = "Arduino_plataforma";
  for (let i = 0; i < 20; i++)
    for (const s of [-1, 1])
      criarCaixa(scene, [0.07, 0.17, 0.09], iron, [(i - 9.5) * 0.14, 0.26, -3 + s * 0.94]);
  criarCaixa(scene, [0.75, 0.14, 0.45], iron, [-0.7, 0.29, -3]);
  criarCilindro(scene, 0.23, 0.25, 0.38, obterMaterial("#121618", 0.45), [0.88, 0.45, -3.1]);
  criarCaixa(
    scene,
    [0.04, 0.02, 0.2],
    obterMaterial("#75b7ff", 0.3, 0, {
      emissive: "#347ddd",
      emissiveIntensity: 1,
    }),
    [0.88, 0.65, -3.1],
  );
  const chair = new T.Group();
  chair.position.set(0, 0.2, -3);
  scene.add(chair);
  const wood = obterMaterial("#65442a", 0.91);
  criarCaixa(chair, [0.7, 0.09, 0.65], wood, [0, 0.48, 0]);
  criarCaixa(chair, [0.7, 0.82, 0.08], wood, [0, 0.91, -0.3]);
  for (const x of [-0.29, 0.29])
    for (const z of [-0.25, 0.25]) criarCaixa(chair, [0.06, 0.5, 0.06], wood, [x, 0.24, z]);
  const brita = criarPessoa();
  brita.group.position.set(0, -0.16, -3);
  brita.legs.forEach((l) => (l.rotation.x = -1.4));
  scene.add(brita.group);
  brita.hood.visible = false;
  const bags = new T.Group();
  scene.add(bags);
  for (let i = 0; i < 3; i++) {
    const bag = criarSacola();
    bag.position.set((i - 1) * 0.32, 0.7, -2.75);
    bag.rotation.z = (i - 1) * 0.25;
    bag.scale.setScalar(0.65);
    bags.add(bag);
  }
  for (const s of [-1, 1])
    criarTubo(
      bags,
      [
        [s * 0.33, 0.9, -3.25],
        [s * 0.39, 0.9, -2.6],
        [0, 0.78, -2.55],
      ],
      0.025,
      obterMaterial("#d8d8c9", 0.8),
    );
  // Piles of transparent cake jars with visible chocolate and cream layers.
  const jar = new T.Group(),
    glass = obterMaterial("#c2c3ac", 0.16, 0.08, {
      transparent: true,
      opacity: 0.28,
    });
  criarCilindro(jar, 0.13, 0.1, 0.23, glass, [0, 0.12, 0]);
  for (let i = 0; i < 4; i++)
    criarCilindro(jar, 0.116, 0.1, 0.044, obterMaterial(i % 2 ? "#d6b08b" : "#4a2516", 0.65), [
      0,
      0.035 + i * 0.046,
      0,
    ]);
  criarCilindro(jar, 0.14, 0.14, 0.024, obterMaterial("#d8d6c2", 0.38), [0, 0.245, 0]);
  for (const side of [-1, 1])
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 8; col++)
        for (let layer = 0; layer < 3 + (col % 3); layer++) {
          const pot = jar.clone();
          pot.position.set(side * (3 + row * 0.34), layer * 0.27, -5 + col * 0.38);
          pot.rotation.y = col * 0.7;
          scene.add(pot);
        }
  const cake = criarBolo();
  cake.position.set(1, 0.25, -2.5);
  scene.add(cake);
  const maicon = criarMaicon();
  maicon.group.position.set(3, 0, -4.3);
  maicon.group.rotation.y = -0.6;
  scene.add(maicon.group);
  const boardSword = new T.Group();
  maicon.arms[0].add(boardSword);
  boardSword.position.set(0, -0.64, 0.08);
  boardSword.rotation.z = -0.45;
  criarElipsoide(boardSword, [0.13, 0.7, 0.055], obterMaterial("#bd803f", 0.6), [0, -0.55, 0]);
  criarTubo(
    boardSword,
    [
      [0, -1.15, 0.055],
      [0, 0.1, 0.055],
    ],
    0.009,
    obterMaterial("#1e7d94", 0.4),
  );
  const biz = criarBiz();
  biz.group.position.set(-4, 0, -6);
  biz.group.rotation.y = 0.55;
  scene.add(biz.group);
  const bubble = new T.Group();
  bubble.position.set(0, 2, -3);
  scene.add(bubble);
  criarCaixa(bubble, [1.45, 0.8, 0.04], obterMaterial("#e7e4d6", 0.85), [0, 0, 0]);
  const photo = new T.TextureLoader().load("assets/biz-reference.png");
  photo.colorSpace = T.SRGBColorSpace;
  criarCaixa(
    bubble,
    [1.32, 0.57, 0.01],
    new T.MeshStandardMaterial({
      map: photo,
      roughness: 0.8,
    }),
    [0, 0.055, 0.03],
  );
  criarCaixa(
    bubble,
    [1.35, 0.12, 0.01],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto("MINHA BIZ", "#e7e4d6", "#18252c"),
      roughness: 0.8,
    }),
    [0, -0.3, 0.03],
  );
  criarMalha(
    bubble,
    new T.ConeGeometry(0.12, 0.2, 3),
    obterMaterial("#e7e4d6", 0.8),
    [0, -0.48, 0],
    [0, 0, Math.PI],
  );
  const door = new T.Group();
  door.position.set(0, 0, 8);
  scene.add(door);
  for (const x of [-1.1, 1.1]) criarCaixa(door, [0.25, 2.8, 0.3], iron, [x, 1.4, 0]);
  criarCaixa(door, [2.45, 0.22, 0.3], iron, [0, 2.8, 0]);
  criarCaixa(
    door,
    [2, 2.5, 0.08],
    obterMaterial("#a5a170", 0.9, 0, {
      emissive: "#6a6d3b",
      emissiveIntensity: 0.4,
    }),
    [0, 1.25, 0],
  );
  criarCaixa(
    door,
    [2, 0.3, 0.05],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto("BACKROOMS", "#1d2820", "#dfdab0"),
    }),
    [0, 2.5, -0.06],
  );
  const axel = criarAxel(),
    shake = criarCachorro();
  scene.add(axel.group, shake.group);
  const rider = criarPessoa();
  scene.add(rider.group);
  rider.hood.visible = false;
  rider.group.visible = false;
  // Road beyond the dungeon, used in the final continuous 3D shot.
  criarCaixa(scene, [7, 0.08, 110], obterMaterial("#262d32", 0.95), [-4, -0.04, 40]);
  for (let z = 16; z < 48; z += 10) {
    const lamp = new T.PointLight("#a8bdcd", 28, 14, 1.5);
    lamp.position.set(-4, 3.8, z);
    scene.add(lamp);
    criarCilindro(scene, 0.04, 0.06, 4, iron, [-0.6, 2, z]);
    criarCaixa(
      scene,
      [0.5, 0.08, 0.3],
      obterMaterial("#bed2df", 0.35, 0, {
        emissive: "#aecde0",
        emissiveIntensity: 1,
      }),
      [-0.6, 4, z],
    );
  }
  for (let z = 0; z < 90; z += 5)
    criarCaixa(scene, [0.12, 0.012, 2], obterMaterial("#c3b886", 0.9), [-4, 0.012, z]);
  return {
    scene,
    brita,
    bags,
    maicon,
    biz,
    bubble,
    axel,
    shake,
    rider,
  };
}
export function desenharCalabouco(cenaDoJogo, estado) {
  const d = cenaDoJogo.dungeon,
    p = estado.player,
    t = estado.dungeonTime || 0,
    ride = estado.mode === "ride" || (estado.mode === "paused" && estado.previousMode === "ride");
  d.bags.visible = !estado.britaLivre;
  d.brita.group.visible = !ride;
  d.maicon.group.visible = !estado.rescue;
  d.bubble.visible = !ride && !estado.britaLivre;
  d.bubble.rotation.y = Math.atan2(p.x, p.z + 3);
  d.maicon.animate(t, 0);
  d.axel.group.visible = true;
  d.shake.group.visible = true;
  if (ride) {
    const travel = Math.max(0, t - 1) * 3.1;
    d.biz.group.position.set(-4, 0, -6 + travel);
    d.biz.group.rotation.y = 0;
    d.biz.wheels.forEach((w) => (w.rotation.x = travel / 0.32));
    d.rider.group.visible = true;
    d.rider.group.position.set(-4, 0.02, -6.22 + travel);
    d.rider.legs.forEach((l) => (l.rotation.x = -1.15));
    d.rider.arms.forEach((a) => (a.rotation.x = -1.1));
    d.axel.group.position.set(-4, 0.6, -6.74 + travel);
    d.axel.group.rotation.y = 0;
    for (const i of [0, 2]) d.axel.limbs[i].rotation.x = -1.3;
    for (const i of [1, 3]) d.axel.limbs[i].rotation.x = -0.8;
    d.shake.group.position.set(-4, 0.98, -7.1 + travel);
    cenaDoJogo.camera.position.set(-0.8, 1.65, -2 + travel);
    cenaDoJogo.camera.lookAt(-4, 1, -6 + travel);
  } else {
    d.biz.group.position.set(-4, 0, -6);
    d.biz.group.rotation.y = 0.55;
    d.rider.group.visible = false;
    d.axel.group.position.set(p.x, t < 2 ? -Math.pow(2 - t, 2) * -1.2 : 0, p.z);
    d.axel.group.rotation.y = p.yaw + Math.PI;
    d.axel.animate(t, estado.moving ? 2 : 0);
    d.shake.group.position.set(p.x + 0.8, 0, p.z + 0.7);
    d.shake.animate(t, estado.moving ? 2 : 0);
    cenaDoJogo.camera.position.set(
      p.x + Math.sin(p.yaw) * 3 + Math.cos(p.yaw) * 1.5,
      2.05,
      p.z + Math.cos(p.yaw) * 3 - Math.sin(p.yaw) * 1.5,
    );
    cenaDoJogo.camera.lookAt(p.x - Math.sin(p.yaw) * 2, 0.95, p.z - Math.cos(p.yaw) * 2);
    if (estado.britaLivre) {
      d.brita.group.position.set(p.x - 1, 0, p.z + 0.6);
      d.brita.group.rotation.y = p.yaw + Math.PI;
      d.brita.legs.forEach(
        (l, i) => (l.rotation.x = estado.moving ? Math.sin(t * 9 + i * Math.PI) * 0.5 : 0),
      );
    } else {
      d.brita.group.position.set(0, -0.16, -3);
      d.brita.group.rotation.y = 0;
      d.brita.legs.forEach((l) => (l.rotation.x = -1.4));
    }
  }
  cenaDoJogo.camera.fov = 65;
  cenaDoJogo.camera.updateProjectionMatrix();
  cenaDoJogo.renderer.toneMappingExposure = 1.05;
  cenaDoJogo.renderer.render(d.scene, cenaDoJogo.camera);
}
