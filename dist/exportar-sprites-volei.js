// Exportação reproduzível: os sprites conservam as malhas e texturas dos modelos enviados.
import * as T from "./vendor/three.module.js";
export async function exportarSpritesVolei(praia) {
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(256, 320, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight("#f0fcff", "#778981", 2.5));
  const sol = new T.DirectionalLight("#fff3d7", 3);
  sol.position.set(-3, 6, 8);
  scene.add(sol);
  const camera = new T.OrthographicCamera(-1.25, 1.25, 1.45, -1.45, 0.1, 30);
  camera.position.set(3, 1.8, 8);
  camera.lookAt(0, 1.3, 0);
  const atlas = document.createElement("canvas");
  atlas.width = 1280;
  atlas.height = 2560;
  const ctx = atlas.getContext("2d");
  const nomes = ["axel", "nav", "bob", "alya", "jonesy"];
  for (let col = 0; col < 5; col++) {
    const p = praia[nomes[col]],
      g = p.group,
      parent = g.parent,
      pos = g.position.clone(),
      rot = g.rotation.clone();
    scene.add(g);
    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);
    if (nomes[col] === "jonesy") g.rotation.y = -Math.PI / 2;
    for (let row = 0; row < 8; row++) {
      const pose = Math.floor(row / 2),
        t = (row % 2) * 0.35;
      if (p.animate)
        p.animate(
          t + 0.15,
          pose === 3 ? 1 : 0.1,
          pose === 2 ? 1 : pose === 1 ? 0.6 : 0,
        );
      if (nomes[col] === "axel") {
        const arms = [p.limbs[1], p.limbs[3]];
        arms.forEach((a, i) => {
          a.rotation.x =
            pose === 1
              ? -1.2
              : pose === 2
                ? i
                  ? -0.6
                  : -2.8
                : pose === 3
                  ? -2.4
                  : -0.1;
        });
      }
      if (nomes[col] === "nav") {
        p.arms.forEach((a, i) => {
          a.rotation.x =
            pose === 1
              ? -1.1
              : pose === 2
                ? i
                  ? -0.5
                  : -2.8
                : pose === 3
                  ? -2.3
                  : -0.1;
        });
      }
      g.position.y = pose === 2 ? 0.34 : pose === 3 ? (row % 2) * 0.15 : 0;
      g.rotation.z = pose === 1 ? 0.05 : pose === 2 ? -0.07 : 0;
      renderer.render(scene, camera);
      ctx.drawImage(renderer.domElement, col * 256, row * 320);
    }
    parent.add(g);
    g.position.copy(pos);
    g.rotation.copy(rot);
  }
  const enviar = (nome, canvas) =>
    window.chrome?.webview?.postMessage({
      type: "sprite-export",
      nome,
      png: canvas.toDataURL("image/png"),
    });
  enviar("personagens.png", atlas);
  const bola = document.createElement("canvas");
  bola.width = 1024;
  bola.height = 128;
  const bctx = bola.getContext("2d");
  const b = praia.bola,
    parent = b.parent,
    pos = b.position.clone();
  scene.add(b);
  b.position.set(0, 1.3, 0);
  b.scale.setScalar(3);
  renderer.setSize(128, 128, false);
  camera.left = -0.8;
  camera.right = 0.8;
  camera.top = 0.8;
  camera.bottom = -0.8;
  camera.updateProjectionMatrix();
  for (let i = 0; i < 8; i++) {
    b.rotation.set(0, (i * Math.PI) / 4, i * 0.3);
    renderer.render(scene, camera);
    bctx.drawImage(renderer.domElement, i * 128, 0, 128, 128);
  }
  parent.add(b);
  b.position.copy(pos);
  b.scale.setScalar(1);
  enviar("bola.png", bola);
  renderer.dispose();
  window.chrome?.webview?.postMessage({ type: "sprites-ready" });
}
