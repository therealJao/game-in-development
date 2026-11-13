import {
  ETAPAS_FINAL,
  JOGAVEIS_FINAL,
  atualizarFinal,
  iniciarPosicaoFinal,
  interagirFinal,
  interacaoFinal,
  mudarFinal,
  podeAndarFinal,
} from "./regras-final.js";
export const PRODUTOS_MERCADO = Object.freeze([
  { id: "arroz", nome: "Arroz Camil", x: -3.7, z: -4, cor: "#b52a31" },
  { id: "feijao", nome: "Feijão Kicaldo", x: 3.7, z: -4, cor: "#ce8925" },
  { id: "leite", nome: "Leite Piracanjuba", x: -9.7, z: -12, cor: "#e7ebee" },
  { id: "guarana", nome: "Guaraná Antarctica", x: 9.7, z: -12, cor: "#248a46" },
  {
    id: "biscoito",
    nome: "Biscoito Bauducco",
    x: -3.7,
    z: -18,
    cor: "#eeb437",
  },
  { id: "chocolate", nome: "Chocolate Lacta", x: 3.7, z: -18, cor: "#382b8c" },
]);
export const LISTAS_COMPRAS = Object.freeze([
  { nome: "CLAYFACE", itens: { arroz: 2, feijao: 1, leite: 1 } },
  { nome: "CORINGA", itens: { guarana: 2, biscoito: 1, chocolate: 1 } },
]);
export const ETAPAS_ARCOPLEX = Object.freeze([
  "mercadoEntrada",
  "carrinhoAtaque",
  "compras",
  "portaEstranha",
  "olhoMagico",
  "travessiaCinema",
  "shoppingExplorar",
  "cinemaFuga",
  "cinemaSusto",
  "cinemaSala",
  "cinemaResultado",
  ...ETAPAS_FINAL,
]);
export const ETAPAS_ARCOPLEX_JOGAVEIS = Object.freeze([
  ...JOGAVEIS_FINAL,
  "compras",
  "portaEstranha",
  "shoppingExplorar",
  "cinemaFuga",
  "cinemaSala",
  "cinemaResultado",
]);
export const RACKS_MERCADO = Object.freeze(
  [-13, -6, 6, 13].flatMap((x) =>
    [-12, -2].map((z) => ({ x, z, w: 1.5, d: 7.5 })),
  ),
);
export function criarEstadoArcoplex() {
  return {
    rodada: 0,
    cesta: {},
    avisos: "",
    folego: 100,
    lanterna: true,
    passos: 0,
    perseguidor: { x: -12, z: 18 },
    tentativas: 0,
  };
}
export function iniciarPosicaoArcoplex(f, etapa) {
  f.arcoplex ??= criarEstadoArcoplex();
  if (ETAPAS_FINAL.includes(etapa)) {
    iniciarPosicaoFinal(f, etapa);
    return;
  }
  const p =
    etapa === "shoppingExplorar" || etapa === "cinemaFuga"
      ? { x: 0, z: 14, y: 0, yaw: 0, pitch: 0 }
      : etapa === "cinemaSala" || etapa === "cinemaResultado"
        ? { x: 0, z: 12, y: 0, yaw: 0, pitch: 0 }
        : { x: 0, z: 18, y: 0, yaw: 0, pitch: 0 };
  Object.assign(f.jogador, p);
  if (["cinemaSala", "cinemaResultado"].includes(etapa))
    f.jogador.y = alturaCinema(f.jogador.z);
}
export function podeAndarArcoplex(etapa, x, z) {
  if (ETAPAS_FINAL.includes(etapa)) return podeAndarFinal(etapa, x, z);
  if (["compras", "portaEstranha"].includes(etapa))
    return (
      x > -18 &&
      x < 18 &&
      z > -26 &&
      z < 22 &&
      !RACKS_MERCADO.some(
        (r) =>
          Math.abs(x - r.x) < r.w / 2 + 0.27 &&
          Math.abs(z - r.z) < r.d / 2 + 0.27,
      )
    );
  if (["shoppingExplorar", "cinemaFuga"].includes(etapa))
    return x > -17 && x < 17 && z > -35 && z < 19 && (z > -8.6 || x > 8.7);
  if (["cinemaSala", "cinemaResultado"].includes(etapa)) {
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
  return false;
}
export function alturaCinema(z) {
  return Math.max(0, Math.floor((z + 9.25) / 2.5)) * 0.22;
}
const mudar = (f, e) => {
  f.etapa = e;
  f.tempo = 0;
};
export function listaCompleta(a) {
  const l = LISTAS_COMPRAS[a.rodada];
  return (
    !!l && Object.entries(l.itens).every(([id, n]) => (a.cesta[id] || 0) >= n)
  );
}
export function interacaoArcoplex(f) {
  if (ETAPAS_FINAL.includes(f.etapa)) return interacaoFinal(f);
  const a = f.arcoplex,
    p = f.jogador;
  if (!a) return "";
  if (f.etapa === "compras") {
    if (Math.hypot(p.x, p.z - 11) < 3)
      return listaCompleta(a) ? "E · ENTREGAR A LISTA" : "E · CONFERIR PEDIDO";
    const produto = PRODUTOS_MERCADO.find(
      (v) => Math.hypot(p.x - v.x, p.z - v.z) < 1.9,
    );
    return produto ? "E · PEGAR " + produto.nome.toUpperCase() : "";
  }
  if (f.etapa === "portaEstranha" && Math.hypot(p.x, p.z + 23) < 2.2)
    return "E · OLHAR PELO OLHO MÁGICO";
  if (
    ["shoppingExplorar", "cinemaFuga"].includes(f.etapa) &&
    Math.hypot(p.x - 15.7, p.z + 25) < 2.3
  )
    return "E · ENTRAR NA SALA 3";
  return "";
}
export function interagirArcoplex(f) {
  if (ETAPAS_FINAL.includes(f.etapa)) return interagirFinal(f);
  const a = f.arcoplex,
    p = f.jogador;
  if (!a) return false;
  if (f.etapa === "compras") {
    if (Math.hypot(p.x, p.z - 11) < 3) {
      if (!listaCompleta(a)) {
        a.avisos = "Ainda faltam produtos. Confira as quantidades da lista.";
        return false;
      }
      a.rodada++;
      a.cesta = {};
      a.avisos =
        a.rodada === 1
          ? "CORINGA: Agora é a minha vez! Quero outra lista."
          : "CLAYFACE: Compras conferidas. Mas de onde veio aquela porta?";
      if (a.rodada === 2) mudar(f, "portaEstranha");
      return true;
    }
    const prod = PRODUTOS_MERCADO.find(
      (v) => Math.hypot(p.x - v.x, p.z - v.z) < 1.9,
    );
    if (!prod) return false;
    const alvo = LISTAS_COMPRAS[a.rodada]?.itens[prod.id] || 0;
    if (!alvo) {
      a.avisos = "Este produto não está no pedido atual.";
      return false;
    }
    if ((a.cesta[prod.id] || 0) >= alvo) {
      a.avisos = "Já pegou a quantidade pedida deste produto.";
      return false;
    }
    a.cesta[prod.id] = (a.cesta[prod.id] || 0) + 1;
    a.avisos = prod.nome + " colocado no carrinho.";
    return true;
  }
  if (f.etapa === "portaEstranha" && Math.hypot(p.x, p.z + 23) < 2.2) {
    mudar(f, "olhoMagico");
    return true;
  }
  if (
    ["shoppingExplorar", "cinemaFuga"].includes(f.etapa) &&
    Math.hypot(p.x - 15.7, p.z + 25) < 2.3
  ) {
    if (f.etapa === "shoppingExplorar") {
      mudar(f, "cinemaFuga");
      a.avisos = "Os passos chegaram ao andar. A maçaneta está cedendo…";
      return false;
    }
    if (f.tempo > 2) {
      mudar(f, "cinemaSala");
      iniciarPosicaoArcoplex(f, "cinemaSala");
      return true;
    }
  }
  return false;
}
const nav = (x, z) => podeAndarArcoplex("cinemaFuga", x, z);
function rotaInimigo(a, p) {
  const k = (x, z) => Math.round(x) + "," + Math.round(z),
    start = k(a.x, a.z),
    goal = k(p.x, p.z),
    q = [start],
    prev = new Map([[start, null]]);
  let fim = start,
    melhor = Infinity;
  for (let i = 0; i < q.length && i < 2000; i++) {
    const key = q[i],
      [x, z] = key.split(",").map(Number),
      d = Math.abs(x - p.x) + Math.abs(z - p.z);
    if (d < melhor) {
      melhor = d;
      fim = key;
    }
    if (key === goal) break;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = k(x + dx, z + dz);
      if (!prev.has(next) && nav(x + dx, z + dz)) {
        prev.set(next, key);
        q.push(next);
      }
    }
  }
  const r = [];
  for (let at = fim; at && at !== start; at = prev.get(at)) {
    const [x, z] = at.split(",").map(Number);
    r.push({ x, z });
  }
  return r.reverse();
}
export function atualizarArcoplex(
  f,
  dt,
  teclas = new Set(),
  corrida = false,
  agachar = false,
) {
  const a = (f.arcoplex ??= criarEstadoArcoplex());
  if (ETAPAS_FINAL.includes(f.etapa)) {
    atualizarFinal(f, dt, teclas, corrida, agachar);
    return;
  }
  if (f.etapa === "cinemaResultado" && f.tempo >= 12) {
    mudarFinal(f, "clayRevela");
    return;
  }
  for (const [e, t, next] of [
    ["mercadoEntrada", 14, "carrinhoAtaque"],
    ["carrinhoAtaque", 3.5, "compras"],
    ["olhoMagico", 6, "travessiaCinema"],
    ["travessiaCinema", 3, "shoppingExplorar"],
    ["cinemaSusto", 2.5, "shoppingExplorar"],
    ["cinemaSala", 60, "cinemaResultado"],
  ]) {
    if (f.etapa === e) {
      if (f.tempo >= t) {
        mudar(f, next);
        if (["compras", "shoppingExplorar"].includes(next)) {
          iniciarPosicaoArcoplex(f, next);
          a.perseguidor = { x: -12, z: 18 };
          a.rota = [];
        }
      }
      if (e !== "cinemaSala") return;
    }
  }
  if (!ETAPAS_ARCOPLEX_JOGAVEIS.includes(f.etapa)) return;
  const p = f.jogador;
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
    n = Math.max(1, Math.hypot(frente, lado));
  f.movendo = n > 1 || Math.hypot(frente, lado) > 0.04;
  f.correndo = (corrida || teclas.has("Shift")) && !agachar && a.folego > 3;
  a.folego = Math.max(
    0,
    Math.min(100, a.folego + dt * (f.correndo && f.movendo ? -12 : 10)),
  );
  const speed = agachar ? 1.5 : f.correndo ? 6 : 3.0,
    steps = Math.max(1, Math.ceil(dt / 0.025));
  const dx =
      ((-Math.sin(p.yaw) * frente + Math.cos(p.yaw) * lado) * dt * speed) /
      n /
      steps,
    dz =
      ((-Math.cos(p.yaw) * frente - Math.sin(p.yaw) * lado) * dt * speed) /
      n /
      steps;
  for (let i = 0; i < steps; i++) {
    if (podeAndarArcoplex(f.etapa, p.x + dx, p.z)) p.x += dx;
    if (podeAndarArcoplex(f.etapa, p.x, p.z + dz)) p.z += dz;
  }
  p.y = ["cinemaSala", "cinemaResultado"].includes(f.etapa)
    ? alturaCinema(p.z)
    : 0;
  a.agachado = agachar;
  if (f.etapa === "shoppingExplorar" && f.tempo > 5) {
    const s = a.perseguidor,
      d = Math.hypot(p.x - s.x, p.z - s.z);
    if (d > 7) {
      const vx = ((p.x - s.x) / d) * dt * 1.8,
        vz = ((p.z - s.z) / d) * dt * 1.8;
      if (nav(s.x + vx, s.z)) s.x += vx;
      if (nav(s.x, s.z + vz)) s.z += vz;
    }
  }
  if (f.etapa === "shoppingExplorar" && f.tempo >= 18) {
    mudar(f, "cinemaFuga");
    a.avisos = "Passos na escada. Alguém está vindo. Encontre a SALA 3.";
  }
  if (f.etapa === "cinemaFuga") {
    a.recalculo = (a.recalculo || 0) - dt;
    if (a.recalculo <= 0) {
      a.rota = rotaInimigo(a.perseguidor, p);
      a.recalculo = 0.8;
    }
    const alvo = a.rota?.[0],
      s = a.perseguidor;
    if (alvo) {
      const d = Math.hypot(alvo.x - s.x, alvo.z - s.z),
        v = Math.min(d, dt * (f.tempo < 5 ? 1.4 : 2.8));
      if (d > 0.01) {
        s.x += ((alvo.x - s.x) / d) * v;
        s.z += ((alvo.z - s.z) / d) * v;
      }
      if (d < 0.15) a.rota.shift();
    }
    if (f.tempo > 4 && Math.hypot(s.x - p.x, s.z - p.z) < 0.85) {
      a.tentativas++;
      mudar(f, "cinemaSusto");
    }
  }
}
