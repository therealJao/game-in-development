import * as T from "./vendor/three.module.js";
import { perfilGrafico } from "./qualidade-grafica.js";

/** Ambiente de reflexão capturado em cubo e filtrado por rugosidade (PMREM). */
function criarAmbiente(renderer, externo) {
  const cena = new T.Scene();
  cena.background = new T.Color(externo ? "#b7d6ec" : "#777f88");
  const caixa = (tamanho, posicao, cor) => {
    const objeto = new T.Mesh(
      new T.BoxGeometry(...tamanho),
      new T.MeshBasicMaterial({ color: cor, side: T.DoubleSide }),
    );
    objeto.position.set(...posicao);
    cena.add(objeto);
  };
  caixa([40, 0.2, 40], [0, -5, 0], externo ? "#535b48" : "#292a28");
  caixa([8, 0.1, 3], [-3, 6, 0], new T.Color(4.5, 4.1, 3.5));
  caixa(
    [3, 4, 0.1],
    [7, 1, -6],
    new T.Color(externo ? 3.2 : 1.4, externo ? 4 : 1.7, externo ? 4.7 : 2.1),
  );
  caixa([2, 4, 0.1], [-7, 0, 4], new T.Color(1.2, 1.0, 0.8));
  const gerador = new T.PMREMGenerator(renderer);
  const alvo = gerador.fromScene(cena, 0.06, 0.1, 60, { size: 128 });
  gerador.dispose();
  cena.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
  return alvo;
}

export class MateriaisRealistas {
  constructor(renderer) {
    this.renderer = renderer;
    this.interno = criarAmbiente(renderer, false);
    this.externo = criarAmbiente(renderer, true);
    this.tratados = new WeakSet();
    this.cenas = new Set();
    // Microtextura determinística: poros e trama no relevo; não altera as fotos fornecidas.
    const tamanho = 128,
      poros = new Uint8Array(tamanho * tamanho * 4),
      rugosidade = new Uint8Array(poros.length);
    let semente = 7319;
    for (let y = 0; y < tamanho; y++)
      for (let x = 0; x < tamanho; x++) {
        semente = (semente * 1664525 + 1013904223) >>> 0;
        const i = (y * tamanho + x) * 4,
          ruido = (semente >>> 24) / 255;
        const valor = Math.round(
          100 + ruido * 65 + Math.sin(x * 2.4) * 8 + Math.sin(y * 2.1) * 6,
        );
        for (let k = 0; k < 3; k++) {
          poros[i + k] = valor;
          rugosidade[i + k] = Math.round(225 + ruido * 29);
        }
        poros[i + 3] = rugosidade[i + 3] = 255;
      }
    const textura = (dados) => {
      const t = new T.DataTexture(dados, tamanho, tamanho, T.RGBAFormat);
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.repeat.set(6, 6);
      t.generateMipmaps = true;
      t.minFilter = T.LinearMipmapLinearFilter;
      t.magFilter = T.LinearFilter;
      t.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
      t.needsUpdate = true;
      return t;
    };
    this.poros = textura(poros);
    this.rugosidade = textura(rugosidade);
    this.qualidade = "ultra";
  }
  preparar(cena, externo = false, criarLuz = false) {
    if (!cena) return;
    cena.environment = (externo ? this.externo : this.interno).texture;
    cena.environmentIntensity = externo ? 0.5 : 0.22;
    this.cenas.add(cena);
    if (criarLuz && !cena.userData.luzRealista) {
      const luz = new T.SpotLight("#ffecd6", 28, 22, Math.PI / 3, 0.8, 2);
      luz.position.set(2, 3.1, 2);
      luz.target.position.set(0, 0.2, -1);
      luz.castShadow = true;
      luz.name = "Luz_principal_com_sombra";
      cena.add(luz, luz.target);
      cena.userData.luzRealista = luz;
    }
    cena.traverse((obj) => {
      if (obj.isSpotLight || obj.isDirectionalLight) {
        obj.castShadow = true;
        obj.shadow.normalBias = 0.018;
        obj.shadow.bias = -0.00015;
      }
      if (!obj.isMesh) return;
      for (const material of Array.isArray(obj.material)
        ? obj.material
        : [obj.material]) {
        if (!material?.isMeshStandardMaterial || this.tratados.has(material))
          continue;
        this.tratados.add(material);
        if (obj.geometry.attributes.uv) {
          if (!material.bumpMap && !material.normalMap) {
            material.bumpMap = this.poros;
            material.bumpScale = material.metalness > 0.4 ? 0.0015 : 0.0035;
          }
          if (!material.roughnessMap) material.roughnessMap = this.rugosidade;
        }
        if (material.map)
          material.map.anisotropy = Math.min(
            16,
            this.renderer.capabilities.getMaxAnisotropy(),
          );
        material.needsUpdate = true;
      }
    });
    this.configurarCena(cena);
  }
  configurarCena(cena) {
    const p = perfilGrafico(this.qualidade);
    cena.traverse((o) => {
      if (!o.shadow || !o.castShadow) return;
      const resolucao = o.isPointLight ? Math.min(512, p.sombra) : p.sombra;
      if (o.shadow.mapSize.x !== resolucao) {
        o.shadow.map?.dispose();
        o.shadow.map = null;
        o.shadow.mapSize.set(resolucao, resolucao);
      }
      o.shadow.radius = 3;
      o.shadow.needsUpdate = true;
    });
  }
  definirQualidade(nome) {
    this.qualidade = nome;
    for (const c of this.cenas) this.configurarCena(c);
  }
}
