import * as T from "./vendor/three.module.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { criarOlho } from "./cabeca-realista.js";

/**
 * Rosto humano REALISTA a partir de um escaneamento 3D real:
 * "Lee Perry-Smith head" por Infinite-Realities — Creative Commons Atribuição 3.0
 * (arquivos em assets/cabeca/, os mesmos do exemplo de pele do three.js).
 * Usa a textura de cor da pele, o mapa normal com poros e rugas e o mapa especular escaneados,
 * mais um espalhamento subsuperficial aproximado (luz avermelhada nas bordas e sombras).
 *
 * criarRostoEscaneado() devolve um Group imediatamente; a malha entra assim que o arquivo carrega
 * (uma única vez para todos os personagens). Tamanho: altura queixo→topo ≈ `altura` metros.
 */
const PASTA = "assets/cabeca/";
// Fendas das pálpebras (fechadas no escaneamento) medidas na textura Map-COL.jpg (u, v, meia-largura, meia-altura).
const OLHOS_UV = [
  [0.4298, 0.705, 0.0298, 0.0168],
  [0.5693, 0.705, 0.0298, 0.0168],
];
// Medidas do escaneamento (unidades do arquivo): topo 3,97; queixo ≈ -0,8; corte do pescoço -1,9.
const TOPO = 3.97,
  QUEIXO = -0.8,
  CORTE_PESCOCO = -1.9;
const MEDIA_PELE = [192, 149, 138]; // cor média da textura, para ajustar o tom de cada personagem
let promessa = null;
function carregar() {
  if (!promessa) {
    const tl = new T.TextureLoader();
    const tex = (n, srgb) => {
      const t = tl.load(PASTA + n);
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    };
    const mapas = {
      cor: tex("Map-COL.jpg", true),
      especular: tex("Map-SPEC.jpg", false),
      normal: tex("Infinite-Level_02_Tangent_SmoothUV.jpg", false),
    };
    promessa = new GLTFLoader().loadAsync(PASTA + "LeePerrySmith.glb").then((gltf) => {
      let malha = null;
      gltf.scene.traverse((o) => {
        if (o.isMesh) malha = o;
      });
      const geo = malha.geometry.clone();
      geo.computeBoundingBox();
      const caixa = geo.boundingBox,
        centro = caixa.getCenter(new T.Vector3());
      geo.translate(-centro.x, -centro.y, -centro.z);
      geo.computeBoundingBox();
      // Posição 3D de cada olho: média dos vértices sob a fenda; raio pela largura da fenda.
      const pos = geo.attributes.position,
        uv = geo.attributes.uv,
        olhos = OLHOS_UV.map(([uc, vc, rx]) => {
          const soma = new T.Vector3(),
            v = new T.Vector3();
          let n = 0,
            minX = Infinity,
            maxX = -Infinity;
          for (let i = 0; i < pos.count; i++) {
            if (Math.abs(uv.getX(i) - uc) > rx || Math.abs(uv.getY(i) - vc) > 0.02) continue;
            v.fromBufferAttribute(pos, i);
            soma.add(v);
            minX = Math.min(minX, v.x);
            maxX = Math.max(maxX, v.x);
            n++;
          }
          return n ? { centro: soma.divideScalar(n), raio: (maxX - minX) * 0.5 } : null;
        });
      return { geo, mapas, olhos, tamanho: geo.boundingBox.getSize(new T.Vector3()) };
    });
  }
  return promessa;
}

const materiais = new Map();
function materialRosto(mapas, tom) {
  const chave = tom;
  if (materiais.has(chave)) return materiais.get(chave);
  const m = new T.MeshPhysicalMaterial({
    map: mapas.cor,
    color: tom,
    normalMap: mapas.normal,
    normalScale: new T.Vector2(0.9, 0.9),
    roughness: 0.52,
    specularIntensityMap: mapas.especular,
    specularIntensity: 0.9,
    sheen: 0.35,
    sheenColor: new T.Color("#ff9f8a"),
    sheenRoughness: 0.5,
    clearcoat: 0.12,
    clearcoatRoughness: 0.45,
  });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vAlturaLocal;");
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vAlturaLocal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvAlturaLocal = position.y;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
        // Remove ombros/peito do busto escaneado: fica só cabeça e pescoço.
        if (vAlturaLocal < ${CORTE_PESCOCO.toFixed(2)}) discard;
        // Abre os olhos: recorta a fenda em amêndoa onde as pálpebras estavam fechadas.
        float cilios = 0.0;
        ${OLHOS_UV.map(
          ([u, v, rx, ry], i) => `{
          vec2 d${i} = (vMapUv - vec2(${u.toFixed(4)}, ${v.toFixed(4)}));
          float x${i} = d${i}.x / ${rx.toFixed(4)};
          float meia${i} = ${ry.toFixed(4)} * pow(max(1.0 - x${i} * x${i}, 0.0), 0.65);
          float y${i} = d${i}.y - 0.0025 * (1.0 - x${i} * x${i});
          if (abs(x${i}) < 1.0 && abs(y${i}) < meia${i}) discard;
          // Cílios e sombra da pálpebra superior, logo acima da fenda.
          if (abs(x${i}) < 1.05 && y${i} > 0.0) cilios = max(cilios, (1.0 - smoothstep(meia${i}, meia${i} + 0.0065, y${i})) * (1.0 - smoothstep(0.85, 1.05, abs(x${i}))));
        }`,
        ).join("\n")}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.06, 0.04, 0.035), cilios * 0.92);
        // Interior da cabeça (visto pela fenda) vira a sombra escura da órbita.
        if (!gl_FrontFacing) diffuseColor.rgb = vec3(0.025, 0.012, 0.01);`,
      )
      .replace(
      "#include <lights_fragment_end>",
      `#include <lights_fragment_end>
      float bordaSSS = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 2.5);
      vec3 sangue = diffuseColor.rgb * vec3(1.0, 0.36, 0.26);
      reflectedLight.indirectDiffuse += sangue * (0.1 + bordaSSS * 0.32);
      if (!gl_FrontFacing) { reflectedLight.directDiffuse *= 0.1; reflectedLight.indirectDiffuse *= 0.1; reflectedLight.directSpecular *= 0.0; reflectedLight.indirectSpecular *= 0.0; }`,
    );
  };
  m.side = T.DoubleSide;
  m.customProgramCacheKey = () => "rosto-escaneado-v2";
  materiais.set(chave, m);
  return m;
}

/**
 * @param altura  altura do rosto em metros (queixo ao topo da testa ~0,24)
 * @param tom     multiplicador de cor da pele (branco = tom original do escaneamento)
 * @param largura achata/alarga o rosto (variação entre personagens)
 */
export function criarRostoEscaneado({ altura = 0.25, pele = null, tom = null, largura = 1, profundidade = 1, corOlhos = "#5a3a1e" } = {}) {
  const grupo = new T.Group();
  grupo.name = "Rosto_escaneado";
  if (!tom && pele) {
    const c = new T.Color(pele);
    tom = new T.Color(
      Math.min(1.35, (c.r * 255) / MEDIA_PELE[0]),
      Math.min(1.35, (c.g * 255) / MEDIA_PELE[1]),
      Math.min(1.35, (c.b * 255) / MEDIA_PELE[2]),
    ).getStyle();
  }
  tom ||= "#ffffff";
  carregar()
    .then(({ geo, mapas, olhos }) => {
      const rosto = new T.Mesh(geo, materialRosto(mapas, tom));
      // Escala pela altura da cabeça (topo→queixo) e origem no centro da cabeça.
      const k = altura / (TOPO - QUEIXO),
        centroY = (TOPO + QUEIXO) / 2;
      rosto.scale.set(k * largura, k, k * profundidade);
      rosto.position.set(0, -centroY * k, -0.4 * k * profundidade);
      rosto.castShadow = rosto.receiveShadow = true;
      grupo.add(rosto);
      for (const o of olhos) {
        if (!o) continue;
        const r = o.raio * k * 0.86,
          globo = criarOlho(corOlhos, r);
        globo.position.set(o.centro.x * k * largura, (o.centro.y - centroY) * k, (o.centro.z - 0.4) * k * profundidade - r * 0.95);
        grupo.add(globo);
      }
    })
    .catch((e) => console.warn("Rosto escaneado indisponível:", e?.message));
  return grupo;
}
export { carregar as carregarRostoEscaneado };
