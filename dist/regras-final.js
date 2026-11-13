// Último capítulo: checkpoints, exploração, fuga e devolução da Biz.
export const ETAPAS_FINAL = Object.freeze([
  "clayRevela",
  "cinemaEscapar",
  "clayCaptura",
  "peppaEntrada",
  "peppaExplorar",
  "level94Chegada",
  "level94Explorar",
  "level94Olhar",
  "level94Fuga",
  "level94Captura",
  "casaEntrada",
  "casaExplorar",
  "casaTrailer",
  "casaPlantao",
  "casaNoticia",
  "casaLuto",
  "casaSaida",
  "portalAbertura",
  "portalExplorar",
  "retornoBiz",
  "telefoneBiz",
  "ligacaoBrita",
  "viagemBiz",
  "entregaBiz",
  "fimJogo",
]);
export const JOGAVEIS_FINAL = Object.freeze([
  "cinemaEscapar",
  "peppaExplorar",
  "level94Explorar",
  "level94Fuga",
  "casaExplorar",
  "casaTrailer",
  "casaPlantao",
  "casaNoticia",
  "casaLuto",
  "casaSaida",
  "portalExplorar",
  "retornoBiz",
  "viagemBiz",
]);
export const TEMPOS_FINAL = Object.freeze({
  clayRevela: 18,
  clayCaptura: 6,
  peppaEntrada: 9,
  level94Chegada: 11,
  level94Olhar: 10,
  level94Captura: 7.5,
  casaEntrada: 12,
  casaTrailer: 24,
  casaPlantao: 12,
  casaNoticia: 20,
  casaLuto: 14,
  portalAbertura: 10,
  ligacaoBrita: 29,
  entregaBiz: 31,
});
export const OBJETOS_FINAL = Object.freeze({
  painelRosa: { x: -6, z: -8 },
  painelVerde: { x: 6, z: -23 },
  portaPeppa: { x: 0, z: -35 },
  bilhete: { x: -12, z: -27 },
  chaveCasa: { x: 13, z: -58 },
  casa: { x: 0, z: -105 },
  tv: { x: 0, z: -3.8 },
  saidaCasa: { x: 0, z: 5.6 },
  portal: { x: 0, z: -114 },
  chaveBiz: { x: -6, z: 2 },
  biz: { x: -4, z: -6 },
  brita: { x: 0, z: -133 },
});
export function criarEstadoFinal() {
  return {
    paineis: [],
    bilhete: false,
    chaveCasa: false,
    chaveBiz: false,
    biz: false,
    ligou: false,
    telefone: "inicio",
    rota: 0,
    folego: 100,
    tentativas: 0,
    perseguidor: { x: 0, z: -8 },
    avisos: "",
    ouviuAmeaca: false,
  };
}
const perto = (p, q, d = 2) => Math.hypot(p.x - q.x, p.z - q.z) < d;
export function iniciarPosicaoFinal(f, e) {
  const a = (f.final ??= criarEstadoFinal());
  let p = { x: 0, z: 12, y: 1.76, yaw: 0, pitch: 0 };
  if (e === "cinemaEscapar") {
    p = { x: 0, z: 9, y: 1.54, yaw: Math.PI, pitch: 0 };
    a.perseguidor = { x: 0, z: -6 };
  }
  if (e.startsWith("peppa")) p = { x: 0, z: 6, y: 0, yaw: 0, pitch: 0 };
  if (e.startsWith("level94")) {
    p = { x: 0, z: e === "level94Fuga" ? -66 : 5, y: 0, yaw: 0, pitch: 0 };
    a.perseguidor = { x: 0, z: e === "level94Fuga" ? -35 : 80 };
    if (e === "level94Fuga") {
      a.bilhete = true;
      a.chaveCasa = true;
    }
  }
  if (["casaExplorar"].includes(e))
    p = { x: -4.7, z: -1.3, y: 0, yaw: -1.9, pitch: 0 };
  else if (
    ["casaTrailer", "casaPlantao", "casaNoticia", "casaLuto"].includes(e)
  )
    p = { x: 0, z: -2.4, y: 0, yaw: 0, pitch: 0 };
  else if (e.startsWith("casa")) p = { x: 0, z: 4.2, y: 0, yaw: 0, pitch: 0 };
  if (e.startsWith("portal")) p = { x: 0, z: -105, y: 0, yaw: 0, pitch: 0 };
  if (["retornoBiz", "telefoneBiz", "ligacaoBrita"].includes(e))
    p = { x: 0, z: 7, y: 0, yaw: 0, pitch: 0 };
  if (e === "viagemBiz") {
    p = { x: 0, z: 3, y: 0, yaw: 0, pitch: 0 };
    a.biz = true;
    a.ligou = true;
  }
  if (["entregaBiz", "fimJogo"].includes(e))
    p = { x: 0, z: -129, y: 0, yaw: 0, pitch: 0 };
  Object.assign(f.jogador, p);
  a.folego = 100;
  a.avisos = "";
}
export function mudarFinal(f, e, posicao = true) {
  f.etapa = e;
  f.tempo = 0;
  f.movendo = false;
  if (posicao) iniciarPosicaoFinal(f, e);
}
export function altura94(x, z) {
  let h =
    0.9 * Math.sin(z * 0.045) + 0.45 * Math.sin(x * 0.11) * Math.cos(z * 0.025);
  for (const c of CASAS94)
    h += 4.5 * Math.exp(-((x - c.x) ** 2 + (z - c.z) ** 2) / 520);
  return h;
}
export const CASAS94 = Object.freeze([
  { x: -24, z: -20 },
  { x: 25, z: -38 },
  { x: -26, z: -58 },
  { x: 27, z: -82 },
  { x: 0, z: -112, principal: true },
  { x: -35, z: -105 },
  { x: 35, z: -129 },
]);
export function podeAndarFinal(e, x, z) {
  if (e === "cinemaEscapar") {
    if (x <= -12 || x >= 12 || z <= -16 || z >= 15) return false;
    for (let r = 0; r < 8; r++)
      for (const s of [-1, 1])
        for (let n = 0; n < 4; n++)
          if (
            Math.abs(x - s * (2.1 + n * 2.15)) < 0.91 &&
            Math.abs(z - (-8 + r * 2.5)) < 0.92
          )
            return false;
    return true;
  }
  if (e === "peppaExplorar")
    return (
      x > -8 &&
      x < 8 &&
      z > -36 &&
      z < 8 &&
      !(Math.abs(x) < 3.1 && z < -10 && z > -18)
    );
  if (["level94Explorar", "level94Fuga"].includes(e))
    return (
      x > -46 &&
      x < 46 &&
      z > -109 &&
      z < 18 &&
      !CASAS94.some((c) => Math.abs(x - c.x) < 5.6 && Math.abs(z - c.z) < 4.8)
    );
  if (e.startsWith("casa"))
    return (
      x > -5.5 &&
      x < 5.5 &&
      z > -5.4 &&
      z < 6 &&
      !(Math.abs(x) < 3.8 && z < 1.8 && z > -0.6) &&
      !(Math.abs(x) < 1.6 && z < -3.1)
    );
  if (e === "portalExplorar") return x > -12 && x < 12 && z > -118 && z < -99;
  if (e === "retornoBiz")
    return (
      x > -8 &&
      x < 8 &&
      z > -10.8 &&
      z < 10.8 &&
      !(Math.abs(x) < 1.5 && Math.abs(z + 3) < 1.5)
    );
  if (e === "viagemBiz") return x > -4.5 && x < 4.5 && z > -137 && z < 8;
  return false;
}
export function interacaoFinal(f) {
  const a = (f.final ??= criarEstadoFinal()),
    p = f.jogador,
    e = f.etapa,
    o = OBJETOS_FINAL;
  if (e === "cinemaEscapar" && perto(p, { x: -11, z: 13 }, 2))
    return "E · AGACHAR E PASSAR PELA BRECHA";
  if (e === "peppaExplorar") {
    for (const [id, pos] of [
      ["rosa", o.painelRosa],
      ["verde", o.painelVerde],
    ])
      if (!a.paineis.includes(id) && perto(p, pos))
        return "E · REATIVAR PAINEL " + id.toUpperCase();
    if (perto(p, o.portaPeppa, 2.7))
      return a.paineis.length === 2
        ? "E · ABRIR PORTA PARA AS COLINAS"
        : "A porta precisa dos dois painéis.";
  }
  if (["level94Explorar", "level94Fuga"].includes(e)) {
    if (!a.bilhete && perto(p, o.bilhete, 2.5))
      return "E · LER BILHETE NA CERCA";
    if (!a.chaveCasa && perto(p, o.chaveCasa, 2.5))
      return "E · PEGAR CHAVE DA CASA 09";
    if (perto(p, o.casa, 3))
      return a.chaveCasa && a.bilhete
        ? "E · DESTRANCAR CASA 09"
        : "Encontre o bilhete e a chave da casa.";
  }
  if (e === "casaExplorar" && perto(p, o.tv, 3))
    return "E · SINTONIZAR A TELEVISÃO";
  if (e === "casaSaida" && perto(p, o.saidaCasa, 2)) return "E · SAIR DA CASA";
  if (e === "portalExplorar" && perto(p, o.portal, 2.5))
    return "E · ATRAVESSAR O PORTAL";
  if (e === "retornoBiz") {
    if (!a.chaveBiz && perto(p, o.chaveBiz)) return "E · PEGAR A CHAVE DA BIZ";
    if (perto(p, o.biz, 2.2))
      return a.chaveBiz
        ? "E · RECUPERAR BIZ E PEGAR O CELULAR"
        : "A chave está sobre a caixa, perto da entrada.";
  }
  if (e === "viagemBiz" && perto(p, o.brita, 4.5))
    return a.rota >= 3
      ? "E · ENTREGAR A BIZ AO BRITA"
      : "Siga as três placas da rota antes de entregar.";
  return "";
}
export function interagirFinal(f) {
  const a = (f.final ??= criarEstadoFinal()),
    p = f.jogador,
    o = OBJETOS_FINAL,
    e = f.etapa;
  if (e === "cinemaEscapar" && perto(p, { x: -11, z: 13 }, 2)) {
    mudarFinal(f, "peppaEntrada");
    return true;
  }
  if (e === "peppaExplorar") {
    for (const [id, pos] of [
      ["rosa", o.painelRosa],
      ["verde", o.painelVerde],
    ])
      if (!a.paineis.includes(id) && perto(p, pos)) {
        a.paineis.push(id);
        a.avisos = "Painel " + id + " ligado. " + a.paineis.length + "/2";
        return true;
      }
    if (
      perto(p, o.portaPeppa, 2.7) &&
      a.paineis.length === 2 &&
      (f.desafiosResolvidos || []).includes("final-porta")
    ) {
      mudarFinal(f, "level94Chegada");
      return true;
    }
  }
  if (["level94Explorar", "level94Fuga"].includes(e)) {
    if (!a.bilhete && perto(p, o.bilhete, 2.5)) {
      a.bilhete = true;
      a.avisos =
        "BILHETE: A casa 09 deixa a televisão ligada. A chave está sob a caixa-d’água. Não confie em rostos conhecidos.";
      return true;
    }
    if (!a.chaveCasa && perto(p, o.chaveCasa, 2.5)) {
      if (!a.bilhete) {
        a.avisos =
          "Antes de levar a chave, leia o bilhete na cerca à esquerda.";
        return false;
      }
      a.chaveCasa = true;
      a.avisos =
        "Chave 09 encontrada. Alguma coisa está correndo atrás de você.";
      mudarFinal(f, "level94Olhar", false);
      return true;
    }
    if (perto(p, o.casa, 3) && a.chaveCasa && a.bilhete) {
      mudarFinal(f, "casaEntrada");
      return true;
    }
  }
  if (e === "casaExplorar" && perto(p, o.tv, 3)) {
    mudarFinal(f, "casaTrailer", false);
    return true;
  }
  if (e === "casaSaida" && perto(p, o.saidaCasa, 2)) {
    mudarFinal(f, "portalAbertura");
    return true;
  }
  if (e === "portalExplorar" && perto(p, o.portal, 2.5)) {
    mudarFinal(f, "retornoBiz");
    return true;
  }
  if (e === "retornoBiz") {
    if (!a.chaveBiz && perto(p, o.chaveBiz)) {
      a.chaveBiz = true;
      a.avisos = "A chave ainda está aqui. Agora encontre a Biz.";
      return true;
    }
    if (perto(p, o.biz, 2.2) && a.chaveBiz) {
      a.biz = true;
      mudarFinal(f, "telefoneBiz", false);
      a.telefone = "inicio";
      return true;
    }
  }
  if (e === "viagemBiz" && perto(p, o.brita, 4.5) && a.rota >= 3) {
    mudarFinal(f, "entregaBiz", false);
    return true;
  }
  return false;
}
export function acaoTelefoneFinal(f, acao) {
  if (f.etapa !== "telefoneBiz") return false;
  const a = f.final;
  if (acao === "app" && a.telefone === "inicio") {
    a.telefone = "contatos";
    return true;
  }
  if (acao === "brita" && a.telefone === "contatos") {
    a.telefone = "contato";
    return true;
  }
  if (acao === "ligar" && a.telefone === "contato" && a.biz) {
    a.telefone = "chamando";
    mudarFinal(f, "ligacaoBrita", false);
    return true;
  }
  if (acao === "voltar") {
    a.telefone = "inicio";
    return true;
  }
  return false;
}
function perseguir(f, dt, velocidade, teste) {
  const a = f.final,
    p = f.jogador,
    s = a.perseguidor;
  // Caminho em grade evita atravessar poltronas, paredes e casas.
  a.recalculo = (a.recalculo || 0) - dt;
  if (a.recalculo <= 0) {
    const key = (x, z) => Math.round(x) + "," + Math.round(z),
      start = key(s.x, s.z),
      q = [start],
      prev = new Map([[start, null]]);
    let best = start,
      dist = Infinity;
    for (let i = 0; i < q.length && i < 18000; i++) {
      const k = q[i],
        [x, z] = k.split(",").map(Number),
        d = Math.abs(x - p.x) + Math.abs(z - p.z);
      if (d < dist) {
        dist = d;
        best = k;
      }
      if (d < 1) break;
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const k2 = key(x + dx, z + dz);
        if (!prev.has(k2) && teste(x + dx, z + dz)) {
          prev.set(k2, k);
          q.push(k2);
        }
      }
    }
    const rota = [];
    for (let k = best; k && k !== start; k = prev.get(k)) {
      const [x, z] = k.split(",").map(Number);
      rota.push({ x, z });
    }
    a.rotaSombra = rota.reverse();
    a.recalculo = 0.8;
  }
  const goal = a.rotaSombra?.[0];
  if (goal) {
    const d = Math.hypot(goal.x - s.x, goal.z - s.z),
      v = Math.min(d, dt * velocidade);
    if (d > 0.01) {
      s.x += ((goal.x - s.x) / d) * v;
      s.z += ((goal.z - s.z) / d) * v;
    }
    if (d < 0.18) a.rotaSombra.shift();
  }
  return Math.hypot(s.x - p.x, s.z - p.z) < 1.05;
}
export function atualizarFinal(
  f,
  dt,
  keys = new Set(),
  corrida = false,
  agachar = false,
) {
  const a = (f.final ??= criarEstadoFinal()),
    e = f.etapa;
  const next = {
    clayRevela: "cinemaEscapar",
    clayCaptura: "clayRevela",
    peppaEntrada: "peppaExplorar",
    level94Chegada: "level94Explorar",
    level94Olhar: "level94Fuga",
    level94Captura: "level94Fuga",
    casaEntrada: "casaExplorar",
    casaTrailer: "casaPlantao",
    casaPlantao: "casaNoticia",
    casaNoticia: "casaLuto",
    casaLuto: "casaSaida",
    portalAbertura: "portalExplorar",
    ligacaoBrita: "viagemBiz",
    entregaBiz: "fimJogo",
  };
  if (TEMPOS_FINAL[e] && f.tempo >= TEMPOS_FINAL[e]) {
    if (e === "ligacaoBrita") a.ligou = true;
    mudarFinal(
      f,
      next[e],
      ![
        "level94Olhar",
        "casaTrailer",
        "casaPlantao",
        "casaNoticia",
        "casaLuto",
        "entregaBiz",
      ].includes(e),
    );
    if (e === "level94Olhar") {
      a.perseguidor = { x: f.jogador.x, z: f.jogador.z + 45 };
      f.jogador.yaw = 0;
    }
    return;
  }
  if (!JOGAVEIS_FINAL.includes(e)) return;
  const p = f.jogador;
  if (keys.has("ArrowLeft")) p.yaw += dt * 1.8;
  if (keys.has("ArrowRight")) p.yaw -= dt * 1.8;
  const fr =
      (keys.has("w") ? 1 : 0) -
      (keys.has("s") ? 1 : 0) -
      (keys.controle?.y || 0),
    side =
      (keys.has("d") ? 1 : 0) -
      (keys.has("a") ? 1 : 0) +
      (keys.controle?.x || 0),
    n = Math.max(1, Math.hypot(fr, side));
  f.movendo = Math.hypot(fr, side) > 0.05;
  f.correndo = (corrida || keys.has("Shift")) && a.folego > 3 && !agachar;
  a.folego = Math.max(
    0,
    Math.min(100, a.folego + dt * (f.correndo && f.movendo ? -9 : 13)),
  );
  f.arcoplex.folego = a.folego;
  f.arcoplex.agachado = agachar;
  let speed = e === "viagemBiz" ? 12 : agachar ? 1.5 : f.correndo ? 6.7 : 3.2;
  const steps = Math.max(1, Math.ceil(dt / 0.025)),
    dx =
      ((-Math.sin(p.yaw) * fr + Math.cos(p.yaw) * side) * dt * speed) /
      n /
      steps,
    dz =
      ((-Math.cos(p.yaw) * fr - Math.sin(p.yaw) * side) * dt * speed) /
      n /
      steps;
  for (let i = 0; i < steps; i++) {
    if (podeAndarFinal(e, p.x + dx, p.z)) p.x += dx;
    if (podeAndarFinal(e, p.x, p.z + dz)) p.z += dz;
  }
  p.y =
    e === "cinemaEscapar"
      ? Math.max(0, Math.floor((p.z + 9.25) / 2.5)) * 0.22
      : e.startsWith("level94") || e.startsWith("portal")
        ? altura94(p.x, p.z)
        : 0;
  if (
    e === "cinemaEscapar" &&
    f.tempo > 4 &&
    perseguir(f, dt, 3.1, (x, z) => podeAndarFinal(e, x, z))
  ) {
    a.tentativas++;
    mudarFinal(f, "clayCaptura", false);
  }
  if (
    e === "level94Fuga" &&
    f.tempo > 4 &&
    perseguir(f, dt, 4, (x, z) => podeAndarFinal(e, x, z))
  ) {
    a.tentativas++;
    mudarFinal(f, "level94Captura", false);
  }
  if (e === "viagemBiz") {
    for (const [i, z] of [-30, -65, -100].entries())
      if (p.z < z && a.rota === i) a.rota++;
  }
}
export function objetivoFinal(f) {
  const a = (f.final ??= criarEstadoFinal());
  return (
    {
      clayRevela: "A pessoa entre as poltronas está mudando de forma.",
      cinemaEscapar:
        "Corra para o corredor lateral esquerdo. Há uma brecha perto da parede do fundo.",
      clayCaptura: "Clayface alcançou você. Retomando do cinema…",
      peppaEntrada:
        "As paredes parecem um desenho infantil. O silêncio não combina com elas.",
      peppaExplorar:
        "Reative os dois painéis: " +
        a.paineis.length +
        "/2. Depois abra a porta ao fundo.",
      level94Chegada: "LEVEL 94 · Uma cidade impossível.",
      level94Explorar: !a.bilhete
        ? "Procure o bilhete junto à cerca à esquerda."
        : "Encontre a chave sob a caixa-d’água à direita.",
      level94Olhar: "Não era uma casa vazia. Ele atravessou com você.",
      level94Fuga:
        "CORRA. A casa 09, com a luz acesa, fica ao final da estrada.",
      level94Captura: "Ele chegou perto demais. Retomando antes da casa…",
      casaEntrada:
        "Os Simpsons estão assistindo à TV. Ninguém reage à sua chegada.",
      casaExplorar: "Explore a sala e sintonize a televisão.",
      casaTrailer: "Um trailer conhecido. Eles não piscam.",
      casaPlantao: "A transmissão foi interrompida.",
      casaNoticia: "NOTÍCIA FICTÍCIA · PARÓDIA DO JOGO",
      casaLuto: "A chuva começou. A porta da frente está destrancada.",
      casaSaida: "Saia da casa. Há uma luz roxa do lado de fora.",
      portalAbertura: "Um portal está se formando entre as casas.",
      portalExplorar: "Atravesse o portal para voltar.",
      retornoBiz: a.chaveBiz
        ? "Recupere a Biz no mesmo lugar do calabouço."
        : "Procure a chave sobre a caixa à esquerda.",
      telefoneBiz: "Use o celular: Telefone → Brita → Ligar.",
      ligacaoBrita: "Ligação com Brita. Combine onde devolver a Biz.",
      viagemBiz:
        "Leve a Biz de volta. Siga as placas: " +
        a.rota +
        "/3. Brita espera ao final.",
      entregaBiz: "Você encontrou Brita. A Biz voltou ao dono.",
      fimJogo: "FIM · A BIZ VOLTOU. VOCÊ TAMBÉM.",
    }[f.etapa] || ""
  );
}
