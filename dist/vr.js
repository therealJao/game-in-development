import * as T from "./vendor/three.module.js";

/**
 * Realidade virtual (WebXR). Funciona com headsets ligados ao PC (Meta Quest via Link/Air Link,
 * SteamVR/OpenXR) no navegador Edge/Chrome — e no EXE quando o WebView2 expuser o WebXR.
 *
 * Como funciona:
 *  - O jogo continua posicionando a câmera como sempre; na hora de desenhar, um "rig" assume
 *    essa posição e o giro horizontal, e a cabeça do jogador controla o olhar dentro dele.
 *  - Os controles de VR viram um gamepad padrão virtual: analógico esquerdo anda,
 *    analógico direito gira, gatilho direito interage, grip direito agacha,
 *    gatilho esquerdo corre, A/X abre o mapa e B/Y pausa.
 *  - Pós-processamento e as mãos sobrepostas são desligados em VR (não funcionam em estéreo).
 */
export class ModoVR {
  constructor(cenaDoJogo) {
    this.cena = cenaDoJogo;
    const r = cenaDoJogo.renderer;
    this.renderer = r;
    r.xr.enabled = true;
    r.xr.setReferenceSpaceType("local");
    this.rig = new T.Group();
    this.rig.name = "Rig_VR";
    this.suportado = false;
    this.sessao = null;
    this.aoMudar = null;
    const renderOriginal = r.render.bind(r);
    const pos = new T.Vector3(),
      quat = new T.Quaternion(),
      escala = new T.Vector3(),
      euler = new T.Euler(0, 0, 0, "YXZ");
    r.render = (scene, camera) => {
      if (!r.xr.isPresenting || camera !== this.cena.camera) return renderOriginal(scene, camera);
      // A câmera do jogo vira o "corpo"; a cabeça real gira por cima.
      camera.updateMatrixWorld(true);
      camera.matrixWorld.decompose(pos, quat, escala);
      euler.setFromQuaternion(quat, "YXZ");
      this.rig.position.copy(pos);
      this.rig.rotation.set(0, euler.y, 0);
      this.rig.updateMatrixWorld(true);
      const pai = camera.parent,
        p0 = camera.position.clone(),
        q0 = camera.quaternion.clone();
      this.rig.add(camera);
      camera.position.set(0, 0, 0);
      camera.quaternion.identity();
      try {
        renderOriginal(scene, camera);
      } finally {
        this.rig.remove(camera);
        if (pai) pai.add(camera);
        camera.position.copy(p0);
        camera.quaternion.copy(q0);
        camera.updateMatrixWorld(true);
      }
    };
    navigator.xr
      ?.isSessionSupported?.("immersive-vr")
      .then((ok) => {
        this.suportado = ok;
        this.aoMudar?.();
      })
      .catch(() => {});
  }
  get ativo() {
    return this.renderer.xr.isPresenting;
  }
  async entrar(loop) {
    if (!navigator.xr) throw new Error("WebXR indisponível neste navegador.");
    const sessao = await navigator.xr.requestSession("immersive-vr", {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
    });
    this.sessao = sessao;
    await this.renderer.xr.setSession(sessao);
    this.renderer.setAnimationLoop(loop);
    sessao.addEventListener("end", () => {
      this.sessao = null;
      this.renderer.setAnimationLoop(null);
      this.aoMudar?.("fim");
    });
    this.aoMudar?.("inicio");
  }
  sair() {
    this.sessao?.end();
  }
  /** Gamepad padrão virtual montado a partir dos dois controles de VR. */
  gamepadVirtual() {
    if (!this.sessao) return null;
    let esq = null,
      dir = null;
    for (const fonte of this.sessao.inputSources) {
      if (!fonte.gamepad) continue;
      if (fonte.handedness === "left") esq = fonte.gamepad;
      else dir = fonte.gamepad;
    }
    if (!esq && !dir) return null;
    const eixo = (g, i) => (g?.axes?.[i] ?? 0),
      btn = (g, i) => g?.buttons?.[i] || { pressed: false, value: 0 };
    const vazio = { pressed: false, value: 0 };
    const botoes = Array.from({ length: 17 }, () => vazio);
    botoes[0] = btn(dir, 0); // gatilho direito → interagir (✕/A)
    botoes[1] = btn(dir, 1); // grip direito → agachar (○/B)
    botoes[2] = btn(esq, 1); // grip esquerdo → defesa (□/X)
    botoes[3] = btn(esq, 4); // X → mapa (△/Y)
    botoes[4] = btn(dir, 4); // A → L1 recuperar
    botoes[9] = btn(dir, 5).pressed ? btn(dir, 5) : btn(esq, 5); // B/Y → pausar
    botoes[10] = btn(esq, 0); // gatilho esquerdo → correr (L3)
    return {
      connected: true,
      mapping: "standard",
      index: 90,
      id: "Controles de VR",
      // xr-standard: eixos 2/3 são o analógico.
      axes: [eixo(esq, 2), eixo(esq, 3), eixo(dir, 2), 0],
      buttons: botoes,
    };
  }
}
