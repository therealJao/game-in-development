// Fase 2: regras puras, independentes da renderização e fáceis de testar.
import {
  calcularDistancias,
  perseguirJogador,
  podeCaminhar,
  calcularDistancia,
} from "./mapas.js";
export const CELULA_PORTO = 6;
export const CONTAGEM_YANG = 10; // Segundos de vantagem após sair do tobogã.
export const DURACAO_BARCO = 10;
export const DESAFIOS_PORTO = [
  {
    titulo: "Identifique a saída",
    antes: '<h1 id="',
    depois: '">Porto</h1>',
    resposta: "saida",
    opcoes: ["saida", "red", "20px"],
    explicacao: "id dá um identificador único a um elemento HTML.",
  },
  {
    titulo: "Acenda a placa de saída",
    antes: "h1 { color: ",
    depois: "; }",
    resposta: "green",
    opcoes: ["green", "center", "src"],
    explicacao: "color: green; deixa as letras verdes.",
  },
  {
    titulo: "Abra o botão do barco",
    antes: "",
    depois: "EMBARCAR</button>",
    resposta: "<button>",
    opcoes: ["<img>", "<button>", "<p>"],
    explicacao: "<button> cria um botão de interação na página.",
  },
];

export function criarEstadoAlisanave() {
  // Planta fixa, com rotas longas e corredores alternativos. # = contêiner.
  const linhas = [
    "#########################",
    "#S......#...............#",
    "#####.#.#.#####.#######.#",
    "#.....#...#...#.......#.#",
    "#.#########.#.#######.#.#",
    "#.........#.#.......#...#",
    "#.#######.#.#######.###.#",
    "#.#.....#.#.......#...#.#",
    "#.#.###.#.#######.###.#.#",
    "#...#...#.....#...#...#.#",
    "#####.#######.#.###.###.#",
    "#.....#.......#.....#...#",
    "#.#####.###########.#.###",
    "#.......#...........#...#",
    "#.#######.#############.#",
    "#.........#.............#",
    "#.#########.###########.#",
    "#...........#...........#",
    "#######################E#",
  ];
  const mapa = linhas.map((l) => Array.from(l, (c) => (c === "#" ? 1 : 0)));
  const inicio = { x: 9, z: 9 },
    saida = { x: 23.5 * 6, z: 18.5 * 6 };
  const escala = CELULA_PORTO / 3;
  const distancias = calcularDistancias(mapa, {
    x: inicio.x / escala,
    z: inicio.z / escala,
  });
  const caminho = [];
  let x = 23,
    z = 18;
  while (distancias[z]?.[x] > 0) {
    caminho.push({ x: (x + 0.5) * 6, z: (z + 0.5) * 6 });
    let proximo = null;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      if (distancias[z + dz]?.[x + dx] === distancias[z][x] - 1) {
        proximo = [x + dx, z + dz];
        break;
      }
    if (!proximo) throw new Error("A saída do porto não está conectada");
    [x, z] = proximo;
  }
  caminho.push(inicio);
  caminho.reverse();
  const terminais = [0.24, 0.52, 0.78].map((fracao, id) => ({
    ...caminho[Math.floor(caminho.length * fracao)],
    id,
    feito: false,
  }));
  return {
    etapa: "limbo",
    tempo: 0,
    mapa,
    inicio,
    saida,
    caminho,
    terminais,
    jogador: { x: 0, z: 2, yaw: 0, pitch: 0 },
    yang: { x: inicio.x, z: inicio.z, stun: 0, target: null },
    contagem: CONTAGEM_YANG,
    folego: 45,
    correndo: false,
    derrotado: false,
    concluido: false,
    conversa: false,
    trilha: [],
    campo: null,
    tempoRota: 0,
    dicaTempo: 0,
  };
}

export function avancarEtapaPorto(fase, etapa) {
  fase.etapa = etapa;
  fase.tempo = 0;
  if (etapa === "labirinto") {
    fase.jogador = { ...fase.inicio, yaw: -Math.PI / 2, pitch: 0 };
    fase.contagem = CONTAGEM_YANG;
    fase.folego = 45;
    fase.yang = { ...fase.inicio, stun: 0, target: null };
  }
}

export function atualizarRegrasPorto(fase, dt, teclas, travaCorrida = false) {
  fase.tempo += dt;
  if (fase.derrotado || fase.concluido) return;
  if (fase.etapa === "limbo" && fase.tempo >= 22) {
    avancarEtapaPorto(fase, "sala");
    return;
  }
  if (fase.etapa === "sala") {
    fase.conversa = fase.tempo >= 6;
    if (fase.tempo >= 18) avancarEtapaPorto(fase, "toboga");
    return; // A sala branca inteira é uma cutscene: entrada só após o tobogã.
  }
  if (fase.etapa === "toboga" && fase.tempo >= 7) {
    avancarEtapaPorto(fase, "labirinto");
    return;
  }
  if (fase.etapa === "barco" && fase.tempo >= DURACAO_BARCO) {
    fase.concluido = true;
    return;
  }
  if (fase.etapa !== "labirinto") return;
  const p = fase.jogador;
  if (teclas.has("ArrowLeft") || teclas.has("q")) p.yaw += dt * 1.8;
  if (teclas.has("ArrowRight")) p.yaw -= dt * 1.8;
  let frente =
      (teclas.has("w") || teclas.has("ArrowUp") ? 1 : 0) -
      (teclas.has("s") || teclas.has("ArrowDown") ? 1 : 0) -
      (teclas.controle?.y || 0),
    lado =
      (teclas.has("d") ? 1 : 0) -
      (teclas.has("a") ? 1 : 0) +
      (teclas.controle?.x || 0),
    norma = Math.hypot(frente, lado);
  fase.agachado = teclas.has("Control") || Boolean(teclas.controle?.agachado);
  fase.correndo =
    !fase.agachado &&
    norma > 0 &&
    (travaCorrida || teclas.has("Shift")) &&
    fase.etapa === "labirinto" &&
    fase.folego > 0;
  if (norma) {
    const v =
        ((fase.agachado ? 2.1 : fase.correndo ? 8 : 4.8) * dt) /
        Math.max(1, norma),
      dx = (-Math.sin(p.yaw) * frente + Math.cos(p.yaw) * lado) * v,
      dz = (-Math.cos(p.yaw) * frente - Math.sin(p.yaw) * lado) * v;
    if (fase.etapa === "sala") {
      p.x = Math.max(-6.4, Math.min(6.4, p.x + dx));
      p.z = Math.max(-6.4, Math.min(6.4, p.z + dz));
    } else {
      if (podeCaminhar(fase.mapa, (p.x + dx) / 2, p.z / 2, 0.23)) p.x += dx;
      if (podeCaminhar(fase.mapa, p.x / 2, (p.z + dz) / 2, 0.23)) p.z += dz;
    }
  }
  if (fase.etapa !== "labirinto") return;
  fase.folego = Math.max(
    0,
    Math.min(45, fase.folego + dt * (fase.correndo ? -0.35 : 4.2)),
  );
  fase.contagem = Math.max(0, fase.contagem - dt);
  if (fase.contagem === 0) {
    fase.tempoRota -= dt;
    if (fase.tempoRota <= 0) {
      fase.campo = calcularDistancias(fase.mapa, { x: p.x / 2, z: p.z / 2 });
      fase.tempoRota = 0.3;
    }
    const perseguidor = {
      ...fase.yang,
      x: fase.yang.x / 2,
      z: fase.yang.z / 2,
    };
    if (fase.yang.target)
      perseguidor.target = {
        x: fase.yang.target.x / 2,
        z: fase.yang.target.z / 2,
      };
    perseguirJogador(
      perseguidor,
      { x: p.x / 2, z: p.z / 2 },
      fase.mapa,
      fase.campo,
      dt,
      1.65 + Math.sin(fase.tempo * 2) * 0.1,
    );
    fase.yang.x = perseguidor.x * 2;
    fase.yang.z = perseguidor.z * 2;
    fase.yang.target = perseguidor.target
      ? { x: perseguidor.target.x * 2, z: perseguidor.target.z * 2 }
      : null;
    if (calcularDistancia(fase.yang, p) < 1.45) fase.derrotado = true;
  }
  fase.trilha.unshift({ x: fase.yang.x, z: fase.yang.z });
  if (fase.trilha.length > 500) fase.trilha.length = 500;
}

export function interagirPorto(fase) {
  if (fase.etapa !== "labirinto") return null;
  if (fase.etapa === "labirinto") {
    const terminal = fase.terminais.find(
      (t) => !t.feito && calcularDistancia(t, fase.jogador) < 3.2,
    );
    if (terminal) return { tipo: "desafio", id: terminal.id };
    if (calcularDistancia(fase.saida, fase.jogador) < 5) {
      if (fase.terminais.every((t) => t.feito)) {
        avancarEtapaPorto(fase, "barco");
        return { tipo: "barco" };
      }
      return {
        tipo: "fala",
        texto:
          "CHARLIE: Ative os três painéis simples de HTML/CSS para liberar o barco.",
      };
    }
  }
  return null;
}
