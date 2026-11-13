// Perfis previsíveis: Ultra melhora a imagem; os demais permitem reduzir o custo da GPU.
export const PERFIS_GRAFICOS = Object.freeze({
  low: {
    escala: 0.75,
    minimo: 0.75,
    amostras: 0,
    sombra: 512,
    sombras: false,
    hdr: false,
    oclusao: 0,
    brilho: 0.025,
  },
  medium: {
    escala: 1,
    minimo: 1,
    amostras: 0,
    sombra: 1024,
    sombras: true,
    hdr: false,
    oclusao: 0.28,
    brilho: 0.05,
  },
  high: {
    escala: 1.5,
    minimo: 1,
    amostras: 2,
    sombra: 2048,
    sombras: true,
    hdr: true,
    oclusao: 0.48,
    brilho: 0.075,
  },
  ultra: {
    escala: 2,
    minimo: 1.2,
    amostras: 2,
    sombra: 2048,
    sombras: true,
    hdr: true,
    oclusao: 0.68,
    brilho: 0.09,
  },
});
export function perfilGrafico(nome) {
  return PERFIS_GRAFICOS[nome] || PERFIS_GRAFICOS.medium;
}
export function escalaRenderizacao(nome, densidade = 1) {
  const p = perfilGrafico(nome);
  return Math.min(p.escala, Math.max(p.minimo, densidade));
}

/** Escolhe um perfil inicial pela GPU, para PCs fracos abrirem rápido e rodarem lisos. */
export function detectarQualidade(renderer) {
  try {
    const gl = renderer.getContext(),
      ext = gl.getExtension("WEBGL_debug_renderer_info"),
      gpu = String(
        ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      ).toLowerCase(),
      nucleos = navigator.hardwareConcurrency || 4,
      memoria = navigator.deviceMemory || 8;
    if (/swiftshader|llvmpipe|basic render|software/.test(gpu)) return "low";
    if (nucleos <= 2 || memoria <= 2) return "low";
    if (/rtx|radeon rx|rx [5-9]\d{3}|arc a|gtx 1[6-9]|gtx 10[7-8]|apple m[2-9]/.test(gpu))
      return "high";
    if (/intel|uhd|hd graphics|iris|mali|adreno|vega [0-9]|radeon\(tm\) graphics/.test(gpu))
      return nucleos >= 8 && memoria >= 8 ? "medium" : "low";
    return "medium";
  } catch {
    return "medium";
  }
}
