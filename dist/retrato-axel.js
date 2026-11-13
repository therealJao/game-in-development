import * as T from "./vendor/three.module.js";
import { criarAxel } from "./modelos.js";
export function retratoAxel(renderer) {
  const scene = new T.Scene();
  scene.background = new T.Color("#1e3039");
  scene.add(new T.HemisphereLight("#f1f5ff", "#3b2a1a", 2));
  const sun = new T.DirectionalLight("#ffdfb7", 3);
  sun.position.set(2, 3, 4);
  scene.add(sun);
  const hero = criarAxel();
  scene.add(hero.group);
  hero.group.rotation.y = -0.18;
  const camera = new T.PerspectiveCamera(37, 1, 0.1, 12);
  camera.position.set(0.8, 1.5, 3.25);
  camera.lookAt(0, 1.32, 0);
  const target = new T.WebGLRenderTarget(160, 160),
    previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  const pixels = new Uint8Array(160 * 160 * 4);
  renderer.readRenderTargetPixels(target, 0, 0, 160, 160, pixels);
  renderer.setRenderTarget(previous);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 160;
  const ctx = canvas.getContext("2d"),
    frame = ctx.createImageData(160, 160);
  for (let y = 0; y < 160; y++)
    frame.data.set(pixels.subarray((159 - y) * 640, (160 - y) * 640), y * 640);
  ctx.putImageData(frame, 0, 0);
  const src = canvas.toDataURL("image/png");
  target.dispose();
  hero.group.traverse((o) => {
    if (o.isMesh) o.geometry.dispose();
  });
  return src;
}
