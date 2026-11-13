import * as T from "./vendor/three.module.js";
import { reconhecerQrPix } from "./regras-alisabank.js";
export function criarCartaoPix(scene) {
  const grupo = new T.Group();
  grupo.name = "Cartao_QR_Ponto_Kente";
  scene.add(grupo);
  const branco = new T.MeshBasicMaterial({ color: "#ffffff" }),
    preto = new T.MeshBasicMaterial({ color: "#202124" });
  const placa = new T.Mesh(new T.BoxGeometry(0.43, 0.57, 0.012), branco);
  grupo.add(placa);
  const mapa = new T.TextureLoader().load(
    new URL("assets/alisabank/qr-ponto-kente.png", import.meta.url).href,
  );
  mapa.colorSpace = T.SRGBColorSpace;
  mapa.minFilter = mapa.magFilter = T.NearestFilter;
  const qr = new T.Mesh(
    new T.PlaneGeometry(0.36, 0.36),
    new T.MeshBasicMaterial({ map: mapa, toneMapped: false }),
  );
  qr.position.set(0, -0.035, 0.008);
  grupo.add(qr);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 200;
  const g = canvas.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 512, 200);
  g.fillStyle = "#15181c";
  g.font = "bold 42px Arial";
  g.textAlign = "center";
  g.fillText("PONTO KENTE", 256, 65);
  g.font = "bold 55px Arial";
  g.fillText("R$ 67,00", 256, 153);
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  const texto = new T.Mesh(
    new T.PlaneGeometry(0.37, 0.1),
    new T.MeshBasicMaterial({ map: tex, toneMapped: false }),
  );
  texto.position.set(0, 0.22, 0.008);
  grupo.add(texto);
  const valor = new T.Mesh(
    new T.PlaneGeometry(0.36, 0.035),
    new T.MeshBasicMaterial({ color: "#f4f0fc" }),
  );
  valor.position.set(0, -0.26, 0.008);
  grupo.add(valor);
  return { grupo, qr };
}
export function atualizarCameraQr(view, c, f) {
  const p = f.pix,
    canvas = document.getElementById("cameraPix");
  if (p.tela !== "camera" || !canvas) return;
  c.cameraQr ??= new T.PerspectiveCamera(42, 1, 0.03, 30);
  c.targetQr ??= new T.WebGLRenderTarget(400, 400);
  c.pixelsQr ??= new Uint8Array(400 * 400 * 4);
  c.rgbaQr ??= new Uint8ClampedArray(400 * 400 * 4);
  const alvo = c.cartao.grupo.getWorldPosition(new T.Vector3());
  c.cameraQr.position.set(-0.15, 1.65, -2.85);
  c.cameraQr.lookAt(alvo.x + p.miraX, alvo.y + p.miraY, alvo.z);
  const renderer = view.renderer,
    anterior = renderer.getRenderTarget();
  renderer.setRenderTarget(c.targetQr);
  renderer.render(c.scene, c.cameraQr);
  renderer.readRenderTargetPixels(c.targetQr, 0, 0, 400, 400, c.pixelsQr);
  renderer.setRenderTarget(anterior);
  for (let y = 0; y < 400; y++)
    c.rgbaQr.set(
      c.pixelsQr.subarray((399 - y) * 1600, (400 - y) * 1600),
      y * 1600,
    );
  canvas.getContext("2d").putImageData(new ImageData(c.rgbaQr, 400, 400), 0, 0);
  const agora = performance.now();
  if (agora - (c.ultimoQr || 0) < 180) return;
  c.ultimoQr = agora;
  const resultado = globalThis.jsQR?.(c.rgbaQr, 400, 400, {
    inversionAttempts: "dontInvert",
  });
  if (reconhecerQrPix(p, resultado?.data, 0.2))
    window.chrome?.webview?.postMessage({
      type: "qr-lido",
      valor: p.valor,
      etapa: p.tela,
    });
  const msg = document.getElementById("statusCameraPix");
  if (msg)
    msg.textContent = resultado
      ? "QR encontrado · lendo…"
      : "Enquadre o QR code do cartão do Lula.";
}
