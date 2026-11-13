import * as T from "./vendor/three.module.js";
import { materialPele } from "./pele.js";

/**
 * Corpo humano ANATÔMICO com esqueleto completo (163 ossos: coluna, clavículas, dedos, olhos).
 * Base: MakeHuman (malha hm08, esqueleto "default" e olhos high-poly) — assets CC0 (domínio público).
 * Formas geradas por scripts do projeto (musculatura atlética, proporções ideais).
 * Os ossos ficam alinhados aos eixos do mundo, então girar rotation.x de uma coxa
 * a leva para frente/trás, como no rig procedural antigo.
 */
const ARQUIVO = "assets/humano/humano.json";
let promessa = null;
const dec = (b64, Tipo) => {
  const bin = atob(b64),
    u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Tipo(u8.buffer);
};
export function carregarHumano() {
  promessa ??= fetch(ARQUIVO)
    .then((r) => r.json())
    .then((d) => {
      const base = {
        uv: dec(d.uv, Float32Array),
        indices: dec(d.indices, Uint32Array),
        skinIndex: dec(d.skinIndex, Uint16Array),
        skinWeight: dec(d.skinWeight, Float32Array),
        olhos: { uv: dec(d.olhos.uv, Float32Array), indices: dec(d.olhos.indices, Uint32Array), osso: d.olhos.osso },
        variantes: {},
      };
      for (const [nome, v] of Object.entries(d.variantes))
        base.variantes[nome] = { posicoes: dec(v.posicoes, Float32Array), ossos: v.ossos, olhos: dec(v.olhos, Float32Array) };
      return base;
    });
  return promessa;
}

let texOlho = null,
  tecidoCache = null;
/** Trama de tecido (normal map procedural). */
function texturaTecido() {
  if (tecidoCache) return tecidoCache;
  const N = 128,
    d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4,
        a = Math.sin((x / N) * Math.PI * 64),
        b = Math.sin((y / N) * Math.PI * 64);
      d[i] = 128 + a * 40;
      d[i + 1] = 128 + b * 40;
      d[i + 2] = 230;
      d[i + 3] = 255;
    }
  tecidoCache = new T.DataTexture(d, N, N);
  tecidoCache.wrapS = tecidoCache.wrapT = T.RepeatWrapping;
  tecidoCache.repeat.set(8, 8);
  tecidoCache.needsUpdate = true;
  return tecidoCache;
}
/**
 * Cria o humano. roupa: função (nomeDoOsso, posição) → cor ou null (pele).
 * Retorna { grupo, ossos (por nome), malha }.
 */
export function montarHumano(dados, { variante = "masculino", pele = "#c99a78", roupa = null, alturaAlvo = null, semCabeca = false } = {}) {
  const v = dados.variantes[variante] || Object.values(dados.variantes)[0];
  const ossos = [],
    porNome = {};
  for (const b of v.ossos) {
    const o = new T.Bone();
    o.name = b.nome;
    const pai = b.pai >= 0 ? ossos[b.pai] : null;
    o.position.fromArray(b.cabeca);
    if (pai) {
      o.position.sub(new T.Vector3().fromArray(v.ossos[b.pai].cabeca));
      pai.add(o);
    }
    o.userData.cauda = new T.Vector3().fromArray(b.cauda);
    ossos.push(o);
    porNome[b.nome] = o;
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(v.posicoes.slice(), 3));
  geo.setAttribute("uv", new T.BufferAttribute(dados.uv, 2));
  geo.setAttribute("skinIndex", new T.BufferAttribute(dados.skinIndex, 4));
  geo.setAttribute("skinWeight", new T.BufferAttribute(dados.skinWeight, 4));
  geo.setIndex(new T.BufferAttribute(dados.indices, 1));
  geo.computeVertexNormals();
  // Roupa pintada por região do corpo (osso dominante) com leve volume de tecido.
  const pos = geo.attributes.position,
    nor = geo.attributes.normal,
    cores = new Float32Array(pos.count * 3),
    corPele = new T.Color("#ffffff"),
    c = new T.Color(),
    p = new T.Vector3();
  let temRoupa = false;
  geo.computeBoundingBox();
  const yMin = geo.boundingBox.min.y,
    yAlt = geo.boundingBox.max.y - yMin;
  for (let i = 0; i < pos.count; i++) {
    const osso = ossos[dados.skinIndex[i * 4]].name;
    p.fromBufferAttribute(pos, i);
    const r = roupa?.(osso, p, (p.y - yMin) / yAlt);
    if (r) {
      c.set(r);
      temRoupa = true;
      // Tecido fica ~4 mm acima da pele; o calçado tem mais volume (esconde os dedos).
      const folga = /foot|toe/.test(osso) ? 0.014 : 0.004;
      pos.setXYZ(i, p.x + nor.getX(i) * folga, p.y + nor.getY(i) * folga, p.z + nor.getZ(i) * folga);
    } else c.copy(corPele);
    cores.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new T.BufferAttribute(cores, 3));
  if (temRoupa) geo.computeVertexNormals();
  // Sem cabeça: remove os triângulos da cabeça/rosto (o personagem usa a própria cabeça escaneada).
  if (semCabeca) {
    const cabeca = new Set();
    porNome.head?.traverse((b) => b.isBone && cabeca.add(ossos.indexOf(b)));
    const idx = geo.index.array,
      fica = [];
    for (let t = 0; t < idx.length; t += 3) {
      const naCabeca = [idx[t], idx[t + 1], idx[t + 2]].some((v) => cabeca.has(dados.skinIndex[v * 4]) && dados.skinWeight[v * 4] > 0.5);
      if (!naCabeca) fica.push(idx[t], idx[t + 1], idx[t + 2]);
    }
    geo.setIndex(new T.BufferAttribute(new Uint32Array(fica), 1));
  }
  // Dois materiais: pele (poros, subsuperfície) e tecido (roupa), separados por triângulo.
  if (temRoupa) {
    const idx = geo.index.array,
      ehRoupa = (i) => cores[i * 3] + cores[i * 3 + 1] + cores[i * 3 + 2] < 2.98;
    const pele_ = [],
      tecido = [];
    for (let t = 0; t < idx.length; t += 3)
      (ehRoupa(idx[t]) && ehRoupa(idx[t + 1]) && ehRoupa(idx[t + 2]) ? tecido : pele_).push(idx[t], idx[t + 1], idx[t + 2]);
    geo.setIndex(new T.BufferAttribute(new Uint32Array([...pele_, ...tecido]), 1));
    geo.addGroup(0, pele_.length, 0);
    geo.addGroup(pele_.length, tecido.length, 1);
  }
  const material = [
    materialPele(pele),
    new T.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.82,
      sheen: 0.6,
      sheenRoughness: 0.7,
      sheenColor: new T.Color("#9aa2b0"),
      normalMap: texturaTecido(),
      normalScale: new T.Vector2(0.35, 0.35),
    }),
  ];
  const malha = new T.SkinnedMesh(geo, temRoupa ? material : material[0]);
  malha.name = "Humano_anatomico";
  malha.castShadow = malha.receiveShadow = true;
  malha.frustumCulled = false;
  const raiz = ossos[0];
  malha.add(raiz);
  malha.bind(new T.Skeleton(ossos));
  // Olhos (globos com íris) presos aos ossos dos olhos.
  texOlho ??= (() => {
    const t = new T.TextureLoader().load("assets/humano/olho-castanho.png");
    t.colorSpace = T.SRGBColorSpace;
    return t;
  })();
  const og = new T.BufferGeometry();
  og.setAttribute("position", new T.BufferAttribute(v.olhos.slice(), 3));
  og.setAttribute("uv", new T.BufferAttribute(dados.olhos.uv, 2));
  og.setIndex(new T.BufferAttribute(dados.olhos.indices, 1));
  const n = og.attributes.position.count,
    si = new Uint16Array(n * 4),
    sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    si[i * 4] = dados.olhos.osso[i];
    sw[i * 4] = 1;
  }
  og.setAttribute("skinIndex", new T.BufferAttribute(si, 4));
  og.setAttribute("skinWeight", new T.BufferAttribute(sw, 4));
  og.computeVertexNormals();
  const olhos = new T.SkinnedMesh(og, new T.MeshPhysicalMaterial({ map: texOlho, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.02 }));
  olhos.frustumCulled = false;
  olhos.bind(malha.skeleton);
  // Pés no chão (y = 0) e escala opcional pela altura.
  geo.computeBoundingBox();
  const caixa = geo.boundingBox;
  const escalaH = alturaAlvo ? alturaAlvo / (caixa.max.y - caixa.min.y) : 1;
  const interno = new T.Group();
  interno.add(malha);
  if (!semCabeca) interno.add(olhos);
  interno.position.y = -caixa.min.y;
  const grupo = new T.Group();
  grupo.name = "Humano";
  grupo.add(interno);
  grupo.scale.setScalar(escalaH);
  return { grupo, ossos: porNome, malha };
}

/** Roupas prontas (pintadas por região). */
export const ROUPAS = {
  casual: ({ camisa = "#2c3440", calca = "#1f2630", sapato = "#141414", mangaLonga = true, bermuda = false } = {}) => (osso, p, altura = 1) => {
    if (/foot|toe/.test(osso)) return sapato;
    // Cintura em ~57% da altura: abaixo disso o tronco já é calça.
    if (altura < 0.57 && /spine|pelvis|root|upperleg/.test(osso)) return calca;
    if (bermuda && /lowerleg/.test(osso)) return null;
    if (/upperleg|lowerleg|pelvis|root/.test(osso)) return calca;
    if (/spine|clavicle|breast|shoulder|upperarm|neck01/.test(osso)) return camisa;
    if (mangaLonga && /lowerarm/.test(osso)) return camisa;
    return null;
  },
};
