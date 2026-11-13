import * as T from "./vendor/three.module.js";
import { carregarHumano, montarHumano, ROUPAS } from "./humano-anatomico.js";

/**
 * Troca o corpo procedural (formas arredondadas) de um personagem por um CORPO HUMANO ANATÔMICO
 * (humano-anatomico.js: MakeHuman CC0, 163 ossos, musculatura e proporções reais).
 *
 * - O rig procedural continua existindo (o jogo segue animando: andar, sentar, arremessar);
 *   as rotações dele são copiadas para os ossos reais (coxas, joelhos, braços).
 * - A cabeça do personagem (rosto escaneado, cabelo, óculos, touca) é presa ao pescoço real;
 *   a cabeça careca do MakeHuman é recolhida.
 * - Roupa pintada com tecido na cor de cada personagem.
 */
export { carregarHumano as carregarCorpoRealista };

const tmpV = new T.Vector3();

export function aplicarCorpoRealista(
  p,
  {
    variante = "masculino",
    pele = "#c99a78",
    camisa = "#2c3440",
    calca = "#1f2630",
    sapato = "#141414",
    mangaLonga = true,
    bermuda = false,
    altura = 1.78,
    manter = [],
    ajusteCabeca = 0.062,
  } = {},
) {
  const g = p.group;
  if (!g || !p.head) return p;
  const manterSet = new Set();
  for (const m of [p.head, ...manter]) m?.traverse((o) => manterSet.add(o));
  carregarHumano()
    .then((dados) => {
      const h = montarHumano(dados, {
        variante,
        pele,
        alturaAlvo: altura,
        roupa: ROUPAS.casual({ camisa, calca, sapato, mangaLonga, bermuda }),
        semCabeca: true,
      });
      // Esconde o corpo procedural (mantém cabeça e acessórios).
      // (tudo que estiver dentro da cabeça do personagem continua visível, inclusive o que carregar depois)
      const naCabeca = (o) => {
        for (let x = o; x; x = x.parent) if (x === p.head || manter.includes(x) || x.userData?.manterVisivel) return true;
        return false;
      };
      g.traverse((o) => {
        if (o.isMesh && !naCabeca(o)) o.visible = false;
      });
      g.add(h.grupo);
      const o = h.ossos;
      // Postura natural: braços ao lado do corpo (o modelo vem em pose "A").
      for (const n of ["upperarm01.L", "upperarm01.R"]) if (o[n]) o[n].rotation.z = n.endsWith(".L") ? -0.72 : 0.72;
      for (const n of ["lowerarm01.L", "lowerarm01.R"]) if (o[n]) o[n].rotation.x = -0.15;
      const repouso = new Map();
      for (const b of Object.values(o)) repouso.set(b, b.rotation.clone());
      const base = new Map();
      for (const r of [...(p.legs || []), ...(p.arms || [])]) if (r) base.set(r, r.rotation.clone());
      const pares = [
        [p.legs?.[0], "upperleg01.L", "lowerleg01.L"],
        [p.legs?.[1], "upperleg01.R", "lowerleg01.R"],
      ];
      const bracos = [
        [p.arms?.[0], "upperarm01.R", "lowerarm01.R"],
        [p.arms?.[1], "upperarm01.L", "lowerarm01.L"],
      ];
      const malha = h.malha;
      malha.renderOrder = -1;
      malha.onBeforeRender = () => {
        for (const [b, r] of repouso) b.rotation.copy(r);
        // Pernas: coxa acompanha o rig; joelho dobra quando a coxa sobe (sentar, correr).
        for (const [rig, coxa, canela] of pares) {
          if (!rig || !o[coxa]) continue;
          const dx = rig.rotation.x - base.get(rig).x;
          o[coxa].rotation.x += dx;
          o[coxa].rotation.z += rig.rotation.z - base.get(rig).z;
          if (o[canela]) o[canela].rotation.x += Math.max(0, -dx) * 1.05 + Math.max(0, dx) * 0.35;
        }
        // Braços: balanço, erguer, arremessar.
        for (const [rig, ombro, cotovelo] of bracos) {
          if (!rig || !o[ombro]) continue;
          const dx = rig.rotation.x - base.get(rig).x,
            dz = rig.rotation.z - base.get(rig).z;
          o[ombro].rotation.x += dx;
          o[ombro].rotation.z += dz;
          if (o[cotovelo]) o[cotovelo].rotation.x += Math.min(0, dx) * 0.4;
        }
        // Respiração sutil.
        const t = performance.now() / 1000;
        if (o.spine03) o.spine03.rotation.x += Math.sin(t * 2.1) * 0.012;
        // Cabeça do personagem presa ao pescoço real.
        const pescoco = o.neck02 || o.neck01;
        if (pescoco) {
          h.grupo.updateMatrixWorld(true);
          pescoco.getWorldPosition(tmpV);
          g.worldToLocal(tmpV);
          p.head.position.set(tmpV.x, tmpV.y + altura * ajusteCabeca, tmpV.z + altura * 0.005);
          p.head.updateMatrixWorld(true);
        }
      };
      p.corpoRealista = h;
    })
    .catch((e) => console.warn("Corpo anatômico indisponível:", e?.message));
  return p;
}
