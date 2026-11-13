import { ETAPAS_ARCOPLEX, atualizarArcoplex } from "./regras-arcoplex.js";
import { ETAPAS_LUA, atualizarSequenciaLua } from "./regras-lua.js";
import { criarVolei, atualizarVolei } from "./regras-volei.js";
import { criarEstadoPix } from "./regras-alisabank.js";
import {
  TEMPOS_PONTO_KENTE,
  atualizarExploracaoPontoKente,
} from "./regras-ponto-kente.js";
import { criarBatalhaRitmo, atualizarBatalhaRitmo } from "./batalha-ritmo.js";
// Fase aquática: queda, resgate, viagem à arena e futebol livre. Unidades em metros.
export const TEMPOS_AERO = Object.freeze({
  queda: 4,
  resgate: 32,
  viagem: 13,
  entrada: 6,
  transformacao: 7,
  vitoria: 8,
  lanchonete: TEMPOS_PONTO_KENTE.explorar,
  lanchoneteFinal: TEMPOS_PONTO_KENTE.refeicao,
  lanchonetePagar: 9,
  agradecimento: 6,
  saidaPonto: 10,
  viagemPraia: 12,
  praiaChegada: 8,
  voleiVitoria: 7,
});
export const CAMPO_AERO = Object.freeze({
  meiaLargura: 24,
  meioComprimento: 36,
  meioGol: 4.2,
  alturaGol: 2.7,
});
export function criarEstadoAero(etapa = "queda") {
  return {
    etapa,
    desafiosResolvidos: [],
    pedidoPendente: false,
    pix: criarEstadoPix(),
    volei: criarVolei(),
    buzinou: false,
    tempo: 0,
    animacao: 0,
    jogador: { x: 0, y: 0, z: 18, yaw: 0, pitch: 0 },
    naverdachi: { x: -8, z: -8, cooldown: 2 },
    bola: { x: 0, y: 0.45, z: 10, vx: 0, vy: 0, vz: 0, giro: 0 },
    golsAxel: 0,
    golsNaverdachi: 0,
    pausaGol: 0,
    recargaChute: 0,
    chute: 0,
    ultimoChutador: "Axel",
    movendo: false,
    correndo: false,
    concluido: false,
    vencedor: null,
    ritmo: criarBatalhaRitmo(),
  };
}
export function reiniciarBolaAero(f) {
  Object.assign(f.bola, { x: 0, y: 0.45, z: 0, vx: 0, vy: 0, vz: 0 });
  f.jogador.x = 0;
  f.jogador.z = 12;
  f.naverdachi.x = -8;
  f.naverdachi.z = -10;
  f.naverdachi.cooldown = 2;
}
export function chutarBolaAero(f) {
  if (f.etapa !== "futebol" || f.pausaGol > 0 || f.recargaChute > 0)
    return false;
  const p = f.jogador,
    b = f.bola;
  if (Math.hypot(p.x - b.x, p.z - b.z) > 3.3 || b.y > 2.8) return false;
  const potencia = f.correndo ? 24 : 19;
  b.vx = -Math.sin(p.yaw) * potencia;
  b.vz = -Math.cos(p.yaw) * potencia;
  b.vy = 4.5;
  f.recargaChute = 0.45;
  f.chute = 0.35;
  f.ultimoChutador = "Axel";
  return true;
}
export function atualizarAero(
  f,
  dt,
  teclas = new Set(),
  corrida = false,
  agachar = false,
) {
  f.animacao += dt;
  f.tempo += dt;
  if (ETAPAS_ARCOPLEX.includes(f.etapa)) {
    atualizarArcoplex(f, dt, teclas, corrida, agachar);
    return;
  }
  if (ETAPAS_LUA.includes(f.etapa)) {
    atualizarSequenciaLua(f);
    return;
  }
  if (f.etapa === "ritmo") {
    atualizarBatalhaRitmo(f.ritmo, dt);
    if (f.ritmo.terminou) {
      f.etapa = f.ritmo.venceu ? "vitoria" : "derrotaRitmo";
      f.tempo = 0;
    }
    return;
  }
  if (["derrotaRitmo", "fimAero"].includes(f.etapa)) return;
  if (f.etapa === "volei") {
    atualizarVolei(f.volei, dt, teclas);
    if (f.volei.terminado && f.volei.venceu) {
      f.etapa = "voleiVitoria";
      f.tempo = 0;
    }
    return;
  }
  if (f.etapa === "pagamento") {
    if (f.pix.pago && f.pix.comprovanteMostrado) {
      f.etapa = "agradecimento";
      f.tempo = 0;
    }
    return;
  }
  if (f.etapa === "lanchoneteExplorar") {
    if (f.desafiosResolvidos.includes("cozinha-fila")) {
      f.etapa = "lanchoneteFinal";
      f.tempo = 0;
      f.movendo = false;
      return;
    }
    atualizarExploracaoPontoKente(f, dt, teclas, corrida);
    return;
  }
  if (
    [
      "transformacao",
      "vitoria",
      "lanchonete",
      "lanchoneteFinal",
      "lanchonetePagar",
      "agradecimento",
      "saidaPonto",
      "viagemPraia",
      "praiaChegada",
      "voleiVitoria",
    ].includes(f.etapa)
  ) {
    if (f.tempo >= TEMPOS_AERO[f.etapa]) {
      const proximas = {
        transformacao: "ritmo",
        vitoria: "lanchonete",
        lanchonete: "lanchoneteExplorar",
        lanchoneteFinal: "lanchonetePagar",
        lanchonetePagar: "pagamento",
        agradecimento: "saidaPonto",
        saidaPonto: "viagemPraia",
        viagemPraia: "praiaChegada",
        praiaChegada: "volei",
        voleiVitoria: "britaChegada",
      };
      f.etapa = proximas[f.etapa];
      f.tempo = 0;
      if (f.etapa === "ritmo") f.ritmo = criarBatalhaRitmo();
      if (f.etapa === "lanchoneteExplorar")
        Object.assign(f.jogador, { x: 1.1, y: 0, z: 3.4, yaw: 0, pitch: 0 });
    }
    return;
  }
  if (f.etapa !== "futebol") {
    const etapas = ["queda", "resgate", "viagem", "entrada", "futebol"];
    while (f.etapa !== "futebol" && f.tempo >= TEMPOS_AERO[f.etapa]) {
      f.tempo -= TEMPOS_AERO[f.etapa];
      f.etapa = etapas[etapas.indexOf(f.etapa) + 1];
    }
    return;
  }
  f.recargaChute = Math.max(0, f.recargaChute - dt);
  f.chute = Math.max(0, f.chute - dt);
  if (f.pausaGol > 0) {
    f.pausaGol -= dt;
    if (f.pausaGol <= 0) reiniciarBolaAero(f);
    return;
  }
  const p = f.jogador,
    b = f.bola,
    n = f.naverdachi;
  if (teclas.has("ArrowLeft")) p.yaw += dt * 1.8;
  if (teclas.has("ArrowRight")) p.yaw -= dt * 1.8;
  const frente =
      (teclas.has("w") ? 1 : 0) -
      (teclas.has("s") ? 1 : 0) -
      (teclas.controle?.y || 0),
    lado =
      (teclas.has("d") ? 1 : 0) -
      (teclas.has("a") ? 1 : 0) +
      (teclas.controle?.x || 0),
    norma = Math.hypot(frente, lado);
  f.movendo = norma > 0.05;
  f.correndo = corrida || teclas.has("Shift");
  if (f.movendo) {
    const v = ((f.correndo ? 8.5 : 5.8) * dt) / Math.max(1, norma);
    p.x = Math.max(
      -23.2,
      Math.min(
        23.2,
        p.x + (-Math.sin(p.yaw) * frente + Math.cos(p.yaw) * lado) * v,
      ),
    );
    p.z = Math.max(
      -34.8,
      Math.min(
        34.8,
        p.z + (-Math.cos(p.yaw) * frente - Math.sin(p.yaw) * lado) * v,
      ),
    );
  }
  // Pequenas batidas permitem conduzir a bola sem ela atravessar os pés.
  const dp = Math.hypot(p.x - b.x, p.z - b.z);
  if (dp < 0.95 && b.y < 1.2 && f.movendo) {
    const dx = b.x - p.x,
      dz = b.z - p.z,
      d = Math.max(0.1, dp);
    b.vx += (dx / d) * dt * 10;
    b.vz += (dz / d) * dt * 10;
  }
  n.cooldown = Math.max(0, n.cooldown - dt);
  const dist = Math.hypot(b.x - n.x, b.z - n.z);
  if (dist > 1.15) {
    const v = Math.min(dist - 1, 3.8 * dt);
    n.x += ((b.x - n.x) / dist) * v;
    n.z += ((b.z - n.z) / dist) * v;
  }
  if (dist < 1.8 && n.cooldown <= 0 && b.y < 1.5) {
    const dx = -b.x * 0.35,
      dz = CAMPO_AERO.meioComprimento - b.z,
      d = Math.hypot(dx, dz);
    b.vx = (dx / d) * 14;
    b.vz = (dz / d) * 14;
    b.vy = 2.8;
    n.cooldown = 3.5;
    f.ultimoChutador = "Naverdachi";
  }
  // Subpassos evitam que uma bola rápida atravesse o piso e as laterais.
  const passos = Math.max(1, Math.ceil(dt / 0.012)),
    h = dt / passos;
  for (let i = 0; i < passos; i++) {
    b.vy -= 9.81 * h;
    b.x += b.vx * h;
    b.y += b.vy * h;
    b.z += b.vz * h;
    if (b.y < 0.43) {
      b.y = 0.43;
      b.vy = Math.abs(b.vy) > 0.7 ? Math.abs(b.vy) * 0.53 : 0;
      b.vx *= Math.exp(-h * 0.85);
      b.vz *= Math.exp(-h * 0.85);
    } else {
      b.vx *= Math.exp(-h * 0.08);
      b.vz *= Math.exp(-h * 0.08);
    }
    b.giro += (Math.hypot(b.vx, b.vz) * h) / 0.43;
    if (
      Math.abs(b.z) > CAMPO_AERO.meioComprimento &&
      Math.abs(b.x) < CAMPO_AERO.meioGol &&
      b.y < CAMPO_AERO.alturaGol
    ) {
      if (b.z < 0) f.golsAxel++;
      else f.golsNaverdachi++;
      if (f.golsAxel >= 5 || f.golsNaverdachi >= 5) {
        f.vencedor = f.golsAxel >= 5 ? "Axel" : "Naverdachi";
        f.etapa = "transformacao";
        f.tempo = 0;
        f.movendo = false;
        return;
      }
      f.pausaGol = 2.4;
      return;
    }
    if (Math.abs(b.x) > 23.6) {
      b.x = Math.sign(b.x) * 23.6;
      b.vx *= -0.72;
    }
    const aberturaDoGol =
      Math.abs(b.x) < CAMPO_AERO.meioGol && b.y < CAMPO_AERO.alturaGol;
    if (Math.abs(b.z) > 35.7 && !aberturaDoGol) {
      b.z = Math.sign(b.z) * 35.7;
      b.vz *= -0.72;
    }
  }
  n.x = Math.max(-23, Math.min(23, n.x));
  n.z = Math.max(-34, Math.min(34, n.z));
}
