import * as T from "./vendor/three.module.js";

/**
 * Pele realista para os personagens humanos.
 *  - Mapa normal procedural com POROS, microrrugas e leve irregularidade (gerado no jogo, sem fotos).
 *  - Mapa de rugosidade: poros mais foscos, pele entre eles um pouco oleosa.
 *  - "Sheen" avermelhado imita a penugem (peach fuzz) nas bordas.
 *  - Aproximação de espalhamento subsuperficial: luz avermelhada "vaza" nas bordas e nas sombras.
 * Use materialPele("#c39577") no lugar de obterMaterial para qualquer parte de pele.
 */
let mapas = null;
function gerarMapas() {
  if (mapas) return mapas;
  const N = 512,
    altura = new Float32Array(N * N);
  let semente = 4421;
  const r = () => ((semente = (semente * 1664525 + 1013904223) >>> 0) / 4294967296);
  // Ruído base suave (ondulação da pele).
  for (let o = 0; o < 3; o++) {
    const passo = 64 >> o,
      grade = [];
    for (let y = 0; y <= N / passo; y++) {
      grade.push([]);
      for (let x = 0; x <= N / passo; x++) grade[y].push(r());
    }
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const gx = x / passo,
          gy = y / passo,
          x0 = Math.floor(gx),
          y0 = Math.floor(gy),
          fx = gx - x0,
          fy = gy - y0,
          s = (t) => t * t * (3 - 2 * t);
        const v =
          grade[y0][x0] * (1 - s(fx)) * (1 - s(fy)) +
          grade[y0][(x0 + 1) % (N / passo + 1)] * s(fx) * (1 - s(fy)) +
          grade[(y0 + 1) % (N / passo + 1)][x0] * (1 - s(fx)) * s(fy) +
          grade[(y0 + 1) % (N / passo + 1)][(x0 + 1) % (N / passo + 1)] * s(fx) * s(fy);
        altura[y * N + x] += v * (0.25 / (o + 1));
      }
  }
  // Microrrugas finas em duas direções cruzadas.
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const a = Math.sin((x * 0.9 + y * 0.35) * 0.55 + Math.sin(y * 0.05) * 3) * 0.5 + 0.5,
        b = Math.sin((x * -0.4 + y * 0.95) * 0.6 + Math.cos(x * 0.04) * 3) * 0.5 + 0.5;
      altura[y * N + x] -= Math.pow(Math.min(a, b), 6) * 0.06;
    }
  // Poros: milhares de pequenas depressões arredondadas.
  const rugos = new Float32Array(N * N).fill(0.45);
  for (let i = 0; i < 9000; i++) {
    const cx = r() * N,
      cy = r() * N,
      raio = 0.8 + r() * 1.6,
      prof = 0.08 + r() * 0.1;
    for (let y = Math.floor(cy - raio - 1); y <= cy + raio + 1; y++)
      for (let x = Math.floor(cx - raio - 1); x <= cx + raio + 1; x++) {
        const d = Math.hypot(x - cx, y - cy) / raio;
        if (d >= 1) continue;
        const k = ((y + N) % N) * N + ((x + N) % N),
          f = Math.cos(d * Math.PI * 0.5);
        altura[k] -= prof * f * f;
        rugos[k] = Math.min(0.75, rugos[k] + 0.25 * f);
      }
  }
  // Altura → normal (Sobel) e rugosidade.
  const normal = new Uint8Array(N * N * 4),
    rug = new Uint8Array(N * N * 4),
    h = (x, y) => altura[((y + N) % N) * N + ((x + N) % N)],
    forca = 6;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * forca,
        dy = (h(x, y + 1) - h(x, y - 1)) * forca,
        len = Math.hypot(dx, dy, 1),
        i = (y * N + x) * 4;
      normal[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      normal[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      normal[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      normal[i + 3] = 255;
      const v = rugos[y * N + x] * 255;
      rug[i] = rug[i + 1] = rug[i + 2] = v;
      rug[i + 3] = 255;
    }
  const textura = (dados) => {
    const t = new T.DataTexture(dados, N, N, T.RGBAFormat);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(3, 3);
    t.generateMipmaps = true;
    t.minFilter = T.LinearMipmapLinearFilter;
    t.magFilter = T.LinearFilter;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };
  mapas = { normal: textura(normal), rugosidade: textura(rug) };
  return mapas;
}

const cache = new Map();
export function materialPele(cor = "#c39577", { oleosidade = 0.5 } = {}) {
  const chave = cor + oleosidade;
  if (cache.has(chave)) return cache.get(chave);
  const { normal, rugosidade } = gerarMapas();
  const m = new T.MeshPhysicalMaterial({
    color: cor,
    roughness: 0.62 - oleosidade * 0.12,
    roughnessMap: rugosidade,
    normalMap: normal,
    normalScale: new T.Vector2(0.55, 0.55),
    sheen: 0.55,
    sheenColor: new T.Color(cor).lerp(new T.Color("#ff8a70"), 0.5),
    sheenRoughness: 0.55,
    clearcoat: 0.08 + oleosidade * 0.1,
    clearcoatRoughness: 0.5,
    specularIntensity: 0.55,
  });
  m.name = "Pele_realista";
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_end>",
      `#include <lights_fragment_end>
      // Subsuperfície aproximada: vermelho do sangue sob a pele aparece nas bordas e nas sombras.
      float bordaSSS = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 2.5);
      vec3 sangue = diffuseColor.rgb * vec3(1.0, 0.38, 0.28);
      reflectedLight.indirectDiffuse += sangue * (0.12 + bordaSSS * 0.35);
      reflectedLight.directDiffuse = mix(reflectedLight.directDiffuse, reflectedLight.directDiffuse * vec3(1.08, 0.94, 0.9), 0.5);`,
    );
  };
  m.customProgramCacheKey = () => "pele-realista-v1";
  m.userData.semMicrotextura = true;
  cache.set(chave, m);
  return m;
}
