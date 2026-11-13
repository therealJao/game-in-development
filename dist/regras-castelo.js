// Fase 3 — furtividade, escadaria, bola física e portal. Coordenadas em metros.
export const ROTA_ESCADARIA = [
  { x: -9, z: -9, y: 0 },
  { x: -9, z: -20, y: 3.3 },
  { x: -9, z: -26, y: 3.3 }, // Patamar plano de Davy.
  { x: 9, z: -26, y: 7.2 },
  { x: 15, z: -26, y: 7.2 }, // Galeria de Little Tail.
  { x: 15, z: -9, y: 12 },
  { x: 9, z: -9, y: 12 },
  { x: 9, z: -3, y: 12 },
];
export const ENCONTROS_CASTELO = {
  davy: { x: -11, y: 3.3, z: -24 },
  little: { x: 12, y: 7.2, z: -28 },
  cj: { x: 7.5, y: 12, z: -3.5 },
};
export const TEMPOS_TERRACO = Object.freeze({
  estalo: 2.8,
  bolas: 6,
  fala: 7.5,
  explosao: 46,
  mergulho: 53,
  previa: 57,
});
export function momentoTerraco(t) {
  if (t < TEMPOS_TERRACO.estalo) return "encontro";
  if (t < TEMPOS_TERRACO.bolas) return "amanhecer";
  if (t < TEMPOS_TERRACO.fala) return "bolas";
  if (t < TEMPOS_TERRACO.explosao) return "aquecimento";
  if (t < TEMPOS_TERRACO.mergulho) return "explosao";
  if (t < TEMPOS_TERRACO.previa) return "mergulho";
  return "previa";
}
// Soco e arremesso balístico alternados, em uma briga de paródia sem ferimentos gráficos.
export function poseBriga(tempo, indice) {
  const ciclo = ((tempo % 12) + 12) % 12,
    rodada = Math.floor(ciclo / 6),
    t = ciclo % 6;
  const vitima = indice === (rodada ? 0 : 1),
    lado = indice ? 1 : -1;
  let x = lado * 0.63,
    y = 0,
    giro = 0;
  if (vitima && t >= 1.2 && t < 3.2) {
    const voo = t - 1.2;
    x = lado * (0.63 + 3.5 * voo);
    y = Math.max(0, 5.9 * voo - 4.905 * voo * voo);
    giro = lado * Math.min(1.5, voo * 2.3);
  } else if (vitima && t >= 3.2) {
    const volta = Math.min(1, (t - 3.2) / 2.4);
    x = lado * (7.63 - 7 * volta);
    giro = lado * 1.5 * Math.max(0, 1 - volta * 3);
  }
  return { x, y, giro, soco: !vitima && t > 0.75 && t < 1.4, t, vitima };
}
export function alturaDegrau(a, b, t) {
  if (a.y === b.y) return a.y;
  const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.36);
  return (
    a.y + (b.y - a.y) * Math.min(1, Math.max(0, Math.ceil(t * n - 1e-6) / n))
  );
}
export const DESAFIOS_CASTELO = [
  {
    titulo: "01 · HTML — conecte a passagem",
    objetivo:
      'Crie um link para o elemento da escadaria nesta mesma página. O destino tem id="escadaria". Qual abertura de link leva até esse destino?',
    antes: '<section id="escadaria">Subida</section>\n',
    depois: "Subir em silêncio</a>",
    resposta: '<a href="#escadaria">',
    opcoes: [
      '<a id="escadaria">',
      '<a href="#escadaria">',
      '<a src="escadaria">',
    ],
    explicacao:
      'href indica o destino do link. #escadaria procura o id="escadaria" na página atual. id nomeia o próprio elemento; src carrega recursos como imagens e não define o destino de um link.',
  },
  {
    titulo: "02 · CSS — selecione a placa certa",
    objetivo:
      'Apenas a placa com class="portal" deve receber texto branco e fundo verde. Escolha o seletor e as propriedades corretas; preserve as demais placas.',
    antes:
      '<div class="portal">Portal</div>\n<div class="aviso">Aguarde</div>\n/* CSS: */\n',
    depois: "",
    resposta: ".portal { color: white; background-color: green; }",
    opcoes: [
      "#portal { color: white; background-color: green; }",
      ".portal { background-color: white; color: green; }",
      ".portal { color: white; background-color: green; }",
    ],
    explicacao:
      'O ponto seleciona uma classe: .portal corresponde a class="portal". #portal selecionaria um id. color altera o texto; background-color altera o fundo. A placa .aviso permanece como estava.',
  },
];
export function criarEstadoCastelo() {
  return {
    etapa: "chegada",
    tempo: 0,
    animacao: 0, // Relógio da simulação: pausa e painéis congelam as animações.
    jogador: { x: 0, y: 0, z: 10, yaw: 0, pitch: 0 },
    agachado: false,
    correndo: false,
    movendo: false,
    ruido: 0,
    suspeita: 0,
    alerta: false,
    painelEscada: false,
    painelPortal: false,
    trecho: 0,
    davyOuvido: false,
    littleVisto: false,
    bola: {
      ativa: false,
      pega: false,
      x: 7,
      y: 8.8,
      z: -20,
      vx: 0,
      vy: 0,
      vz: 0,
      tempo: 0,
    },
    cjFalou: false,
    concluido: false,
    tempoPasso: 0,
  };
}
const distancia = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function pontoMaisProximoEscada(x, z, indice) {
  let melhor = null;
  for (
    let i = Math.max(0, indice - 1);
    i <= Math.min(ROTA_ESCADARIA.length - 2, indice + 1);
    i++
  ) {
    const a = ROTA_ESCADARIA[i],
      b = ROTA_ESCADARIA[i + 1],
      dx = b.x - a.x,
      dz = b.z - a.z;
    const t = Math.max(
      0,
      Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)),
    );
    const p = {
      x: a.x + dx * t,
      z: a.z + dz * t,
      y: a.y + (b.y - a.y) * t,
      trecho: i,
      t,
    };
    p.distancia = Math.hypot(x - p.x, z - p.z);
    if (!melhor || p.distancia < melhor.distancia) melhor = p;
  }
  return melhor;
}
export function atualizarCastelo(f, dt, teclas, trava = false) {
  f.tempo += dt;
  f.animacao = (f.animacao || 0) + dt;
  if (f.etapa === "chegada") {
    if (f.tempo >= 10) {
      f.etapa = "salao";
      f.tempo = 0;
    }
    return;
  }
  if (f.etapa === "portal") {
    if (f.tempo >= 3) {
      f.etapa = "terraco";
      f.tempo = 0;
    }
    return;
  }
  if (f.etapa === "terraco") {
    if (f.tempo >= TEMPOS_TERRACO.previa) {
      f.etapa = "previa";
      f.tempo = 0;
    }
    return;
  }
  if (f.etapa === "previa") return;
  if (f.alerta || f.concluido) return;
  const p = f.jogador;
  f.agachado = teclas.has("Control") || Boolean(teclas.controle?.agachado);
  const frente =
    (teclas.has("w") ? 1 : 0) -
    (teclas.has("s") ? 1 : 0) -
    (teclas.controle?.y || 0);
  const lado =
    (teclas.has("d") ? 1 : 0) -
    (teclas.has("a") ? 1 : 0) +
    (teclas.controle?.x || 0);
  const norma = Math.hypot(frente, lado);
  if (teclas.has("ArrowLeft")) p.yaw += dt * 1.8;
  if (teclas.has("ArrowRight")) p.yaw -= dt * 1.8;
  f.correndo = !f.agachado && (trava || teclas.has("Shift"));
  f.movendo = false;
  if (norma) {
    const v =
      ((f.agachado ? 2.6 : f.correndo ? 6.5 : 4.4) * dt) / Math.max(1, norma);
    const nx = p.x + (-Math.sin(p.yaw) * frente + Math.cos(p.yaw) * lado) * v;
    const nz = p.z + (-Math.cos(p.yaw) * frente - Math.sin(p.yaw) * lado) * v;
    if (f.etapa === "salao") {
      const banco =
        Math.abs(nx) > 3 && Math.abs(nx) < 7.5 && nz > 2.4 && nz < 4.1;
      if (Math.abs(nx) < 11.2 && nz > -11.4 && nz < 12 && !banco) {
        p.x = nx;
        p.z = nz;
        f.movendo = true;
      }
    } else {
      const rota = pontoMaisProximoEscada(nx, nz, f.trecho);
      if (rota && rota.distancia < 1.35) {
        p.x = nx;
        p.z = nz;
        p.y = alturaDegrau(
          ROTA_ESCADARIA[rota.trecho],
          ROTA_ESCADARIA[rota.trecho + 1],
          rota.t,
        );
        f.trecho = rota.trecho;
        f.movendo = true;
      }
    }
  }
  f.ruido = f.movendo ? (f.agachado ? 0.035 : f.correndo ? 1 : 0.48) : 0;
  if (f.etapa === "salao") {
    const perto = Math.min(
      distancia(p, { x: poseBriga(f.tempo, 0).x, z: 0 }),
      distancia(p, { x: poseBriga(f.tempo, 1).x, z: 0 }),
    );
    const audicao = Math.max(0, 1 - perto / 18) * f.ruido;
    const invasao = perto < 2.1 ? 1 : 0;
    f.suspeita = Math.max(
      0,
      Math.min(1, f.suspeita + dt * (audicao * 0.34 + invasao * 0.35 - 0.12)),
    );
    if (f.suspeita >= 1) f.alerta = true;
  } else {
    f.suspeita = Math.max(0, f.suspeita - dt * 0.5);
    if (distancia(p, ENCONTROS_CASTELO.davy) < 5 && Math.abs(p.y - 3.3) < 0.6)
      f.davyOuvido = true;
    if (
      distancia(p, ENCONTROS_CASTELO.little) < 5 &&
      Math.abs(p.y - 7.2) < 0.6 &&
      !f.littleVisto
    ) {
      f.littleVisto = true;
      const b = f.bola;
      Object.assign(b, { ativa: true, x: 12, y: 8.7, z: -27, tempo: 0 });
      const voo = 0.9;
      b.vx = (p.x - b.x) / voo;
      b.vz = (p.z - b.z) / voo;
      b.vy = (p.y + 1.1 - b.y + 4.905 * voo * voo) / voo;
    }
  }
  const b = f.bola;
  if (b.ativa && !b.pega) {
    b.tempo += dt;
    b.vy -= 9.81 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.z += b.vz * dt;
    const piso = pontoMaisProximoEscada(b.x, b.z, Math.min(f.trecho, 4));
    const altura = (piso?.distancia < 1.6 ? piso.y : 0) + 0.19;
    if (b.y < altura) {
      b.y = altura;
      b.vy = Math.abs(b.vy) * 0.62;
      b.vx *= 0.7;
      b.vz *= 0.7;
    }
    if (
      Math.hypot(p.x - b.x, p.z - b.z) < 1.4 &&
      Math.abs(p.y + 1 - b.y) < 1.7
    ) {
      b.pega = true;
      b.ativa = false;
    }
    // A bola pode ser recolhida no patamar caso o arremesso passe pelo jogador.
    if (b.tempo > 5 && !b.pega) {
      b.x = 12;
      b.z = -26;
      b.y = 7.4;
      b.vx = b.vz = b.vy = 0;
    }
  }
}
export function interagirCastelo(f) {
  if (f.etapa === "salao" && distancia(f.jogador, ROTA_ESCADARIA[0]) < 2.7) {
    if (!f.painelEscada) return { tipo: "desafio", id: 0 };
    f.etapa = "escada";
    f.jogador = { ...ROTA_ESCADARIA[0], yaw: 0, pitch: 0 };
    return { tipo: "escada" };
  }
  const topo = ROTA_ESCADARIA.at(-1);
  if (
    f.etapa === "escada" &&
    f.jogador.y > 11 &&
    distancia(f.jogador, topo) < 2.7
  ) {
    if (!f.cjFalou) {
      f.cjFalou = true;
      return { tipo: "cj" };
    }
    if (!f.painelPortal) return { tipo: "desafio", id: 1 };
    f.etapa = "portal";
    f.tempo = 0;
    return { tipo: "portal" };
  }
  return {
    tipo: "dica",
    texto:
      f.etapa === "salao"
        ? "Agache com Ctrl ou ○/B e contorne o salão pelas laterais. A escadaria fica no canto esquerdo, ao fundo."
        : "Suba os degraus, siga as placas e fale com CJ no portal usando E ou ✕/A.",
  };
}
