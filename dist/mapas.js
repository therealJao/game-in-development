import { CONFIGURACAO } from "./configuracao.js";
// MAPAS — cada linha da planta é uma fileira de células.
// Plantas fixas: cada sala, rota de fuga e encontro foi colocado explicitamente.
// Coordenadas em metros no mundo. Células de 3 metros.
export const TAMANHO_CELULA = 3,
  ALTURA_PAREDE = 3.2;
export const REGRAS = {
  stamina: CONFIGURACAO.folegoMaximo,
  walk: CONFIGURACAO.velocidadeCaminhada,
  sprint: CONFIGURACAO.velocidadeCorrida,
  drainWalk: 0.24,
  drainSprint: 1,
  attackCooldown: 7,
  autoRecovery: 10,
};
export const FASES = [
  {
    name: "O ZUMBIDO",
    mostrarLegenda: "Nível 0 · Corredores amarelos",
    enemySpeed: 1.8,
    chargeSpeed: 2.7,
    spawnDelay: 35,
    theme: 0,
    rows: [
      "#################################",
      "#S......#...........#...........#",
      "#.#####.#.#########.#.#######.#.#",
      "#.....#...#.......#...#.....#.#.#",
      "#####.#####.#####.#####.###.#.#.#",
      "#...#.......#...#.......#...#...#",
      "#.#.#########.#.#########.#####.#",
      "#.#...........#.....#.....#...#.#",
      "#.###########.#####.#.#####.#.#.#",
      "#.....#.....#.....#.#.......#...#",
      "#.###.#.###.#####.#.###########.#",
      "#...#...#T#.......#.....#.......#",
      "###.#####.###########.#.#.#####.#",
      "#...#.....#.........#.#.#.....#.#",
      "#.###.#####.#######.#.#.#####.#.#",
      "#.....#...#...#.....#.#.....#...#",
      "#.#####.#.###.#.#####.#####.###.#",
      "#.......#.....#.....#.....#.....#",
      "#######.###########.#####.#####.#",
      "#.....#.....#.....#.....#.....#.#",
      "#.###.#####.#.###.#####.#####.#.#",
      "#...#.......#...#.....#T....#...#",
      "#.#.###########.#####.###.#.###.#",
      "#.#.....#.......#...#...#.#.....#",
      "#.#####.#.#######.#.###.#.#####.#",
      "#.....#.#.........#.....#.....#.#",
      "#####.#.#####################.#.#",
      "#.....#.................#.....#.#",
      "#.#####################.#.###.#.#",
      "#.....................M.#.....E.#",
      "#################################",
    ],
  },
  {
    name: "A OFICINA",
    mostrarLegenda: "Nível 1 · Maicon está aqui",
    enemySpeed: 2.0,
    chargeSpeed: 2.9,
    spawnDelay: 30,
    theme: 1,
    rows: [
      "#####################################",
      "#S......#...........#...............#",
      "#.#####.#.#########.#.#############.#",
      "#.....#...#.......#...#.....#.......#",
      "#####.#####.#####.#####.###.#.#####.#",
      "#.....#.....#...#.......#...#.....#.#",
      "#.#####.#####.#.#########.#######.#.#",
      "#.......#.....#.....#.....#.......#.#",
      "#.#######.#########.#.#####.#######.#",
      "#.#.....#.....#.....#.......#.......#",
      "#.#.###.#####.#.###########.#.#####.#",
      "#...#T#.......#.....#.......#.....#.#",
      "#####.#############.#.###########.#.#",
      "#.....#.............#.#.........#...#",
      "#.#####.#############.#.#######.###.#",
      "#.....#...#.........#...#.....#.....#",
      "#####.###.#.#######.#####.###.#####.#",
      "#.....#...#.....#.......#...#.......#",
      "#.#####.#######.###########.#######.#",
      "#.......#.....#...........#.....#...#",
      "#.#######.###.###########.#####.#.###",
      "#.#.......#...#.....#...#.....#.#...#",
      "#.#.#######.###.###.#.#.#####.#.###.#",
      "#...#.....#.....#...#.#.....#.#.....#",
      "#####.###.#######.###.#####.#.#####.#",
      "#.....#...#.......#...#.....#.....#.#",
      "#.#####.###.#######.###.#########.#.#",
      "#...#...#...#.....#...#.....#.....#.#",
      "###.#.###.###.###.###.###.#.#.#####.#",
      "#...#.....#...#T#...#.....#.#.......#",
      "#.#########.###.###.#######.#######.#",
      "#...........#.....#.......M.......E.#",
      "#####################################",
    ],
  },
  {
    name: "FALHA DE SAÍDA",
    mostrarLegenda: "Nível 2 · Sem retorno",
    enemySpeed: 2.2,
    chargeSpeed: 3.1,
    spawnDelay: 25,
    theme: 2,
    rows: [
      "#########################################",
      "#S......#...........#...................#",
      "#.#####.#.#########.#.#################.#",
      "#.....#...#.......#...#.............#...#",
      "#####.#####.#####.#####.###########.#.###",
      "#.....#.....#...#.......#.........#.#...#",
      "#.#####.#####.#.#########.#######.#.###.#",
      "#.......#.....#.....#.....#.....#.#.....#",
      "#.#######.#########.#.#####.###.#.#####.#",
      "#.#.....#.....#.....#.......#...#.....#.#",
      "#.#.###.#####.#.###########.#.#######.#.#",
      "#...#T#.......#.....#.......#.....#...#.#",
      "#####.#############.#.###########.#.###.#",
      "#.....#.............#.#.........#.#.....#",
      "#.#####.#############.#.#######.#.#####.#",
      "#.....#...#.........#...#.....#.#.....#.#",
      "#####.###.#.#######.#####.###.#.#####.#.#",
      "#.....#...#.....#.......#...#.#.....#...#",
      "#.#####.#######.###########.#.#####.###.#",
      "#.......#.....#...........#.#.....#.....#",
      "#.#######.###.###########.#.#####.#####.#",
      "#.#.......#...#.....#...#...#...#.......#",
      "#.#.#######.###.###.#.#.#####.#.#######.#",
      "#...#.....#.....#...#.#.....#.#.....#...#",
      "#####.###.#######.###.#####.#.#####.#.###",
      "#.....#...#.......#...#.....#.....#.#...#",
      "#.#####.###.#######.###.#########.#.###.#",
      "#...#...#...#.....#...#.....#.....#.....#",
      "###.#.###.###.###.###.###.#.#.#########.#",
      "#...#.....#...#T#...#.....#.#...........#",
      "#.#########.###.###.#######.###########.#",
      "#...........#.....#.........#...........#",
      "#.###############.###########.#########.#",
      "#.........................M...........E.#",
      "#########################################",
    ],
  },
];
function buscarCelulasAcessiveis(map, start) {
  const field = calcularDistancias(map, start),
    result = [];
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (field[z][x] >= 0)
        result.push({
          x: (x + 0.5) * TAMANHO_CELULA,
          z: (z + 0.5) * TAMANHO_CELULA,
          d: field[z][x],
        });
  return result;
}
export /* Lê o desenho do mapa. # representa parede; S é início; T é terminal; E é saída. */
function criarFase(index) {
  const chapter = FASES[index],
    width = Math.max(...chapter.rows.map((r) => r.length));
  const map = chapter.rows.map((row) =>
    Array.from(
      {
        length: width,
      },
      (_, x) => (row[x] && row[x] !== "#" ? 0 : 1),
    ),
  );
  let spawn,
    exit,
    terminals = [],
    maicon;
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < width; x++) {
      const char = chapter.rows[z]?.[x],
        p = {
          x: (x + 0.5) * TAMANHO_CELULA,
          z: (z + 0.5) * TAMANHO_CELULA,
        };
      if (char === "S") spawn = p;
      if (char === "E") exit = p;
      if (char === "T")
        terminals.push({
          ...p,
          done: false,
        });
      if (char === "M") maicon = p;
    }
  // Desenho de rotas em loop e salas amplas em pontos específicos.
  const rooms = [
    [1, 1, 4, 3],
    [9, 5, 5, 4],
    [17, 9, 5, 5],
    [3, 19, 6, 4],
    [23, 23, 5, 5],
  ];
  rooms.forEach(([sx, sz, w, h]) => {
    for (let z = sz; z < Math.min(map.length - 1, sz + h); z++)
      for (let x = sx; x < Math.min(width - 1, sx + w); x++) map[z][x] = 0;
  });
  // Ligações de serviço garantem caminhos alternativos à perseguição.
  for (const z of [7, 17, map.length - 4]) for (let x = 1; x < width - 1; x++) map[z][x] = 0;
  for (const x of [7, 17, width - 4]) for (let z = 1; z < map.length - 1; z++) map[z][x] = 0;
  let field = calcularDistancias(map, spawn);
  // Alguns terminais são saletas no desenho: conecte-os por corredores de serviço explícitos.
  for (const p of [...terminals, exit, maicon]) {
    if (field[Math.floor(p.z / TAMANHO_CELULA)]?.[Math.floor(p.x / TAMANHO_CELULA)] < 0) {
      const tx = Math.floor(p.x / TAMANHO_CELULA),
        tz = Math.floor(p.z / TAMANHO_CELULA);
      for (let x = Math.min(tx, 7); x <= Math.max(tx, 7); x++) map[tz][x] = 0;
      field = calcularDistancias(map, spawn);
    }
  }
  const cells = buscarCelulasAcessiveis(map, spawn).sort((a, b) => b.d - a.d),
    enemyCell = cells.find((c) => c.d > 18 && c.d < 30) || cells[30];
  return {
    map,
    width,
    height: map.length,
    spawn,
    exit,
    terminals,
    maiconSpawn: maicon,
    enemy: {
      ...enemyCell,
      stun: 0,
      target: null,
    },
    maicon: {
      x: maicon.x,
      z: maicon.z,
      stun: 0,
      target: null,
      active: false,
    },
    visited: new Set(),
    cells,
  };
}
export function calcularDistancias(map, p) {
  const sx = Math.max(0, Math.min(map[0].length - 1, Math.floor(p.x / TAMANHO_CELULA))),
    sz = Math.max(0, Math.min(map.length - 1, Math.floor(p.z / TAMANHO_CELULA))),
    f = map.map((r) => r.map(() => -1)),
    q = [[sx, sz]];
  f[sz][sx] = 0;
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      if (map[z + dz]?.[x + dx] === 0 && f[z + dz][x + dx] < 0) {
        f[z + dz][x + dx] = f[z][x] + 1;
        q.push([x + dx, z + dz]);
      }
  }
  return f;
}
export function podeCaminhar(map, x, z, r = 0.3) {
  return [
    [-r, -r],
    [-r, r],
    [r, -r],
    [r, r],
  ].every(
    ([dx, dz]) =>
      map[Math.floor((z + dz) / TAMANHO_CELULA)]?.[Math.floor((x + dx) / TAMANHO_CELULA)] === 0,
  );
}
export function calcularDistancia(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
export function perseguirJogador(enemy, player, map, field, dt, speed) {
  if (enemy.stun > 0) {
    enemy.stun = Math.max(0, enemy.stun - dt);
    return;
  }
  const x = Math.floor(enemy.x / TAMANHO_CELULA),
    z = Math.floor(enemy.z / TAMANHO_CELULA);
  let target = enemy.target;
  if (x === Math.floor(player.x / TAMANHO_CELULA) && z === Math.floor(player.z / TAMANHO_CELULA)) {
    target = {
      x: player.x,
      z: player.z,
    };
  } else if (!target || calcularDistancia(enemy, target) < 0.16) {
    let melhorPontuacao = field[z]?.[x] ?? -1;
    target = {
      x: (x + 0.5) * TAMANHO_CELULA,
      z: (z + 0.5) * TAMANHO_CELULA,
    };
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const d = field[z + dz]?.[x + dx];
      if (d >= 0 && (melhorPontuacao < 0 || d < melhorPontuacao)) {
        melhorPontuacao = d;
        target = {
          x: (x + dx + 0.5) * TAMANHO_CELULA,
          z: (z + dz + 0.5) * TAMANHO_CELULA,
        };
      }
    }
  }
  enemy.target = target;
  if (!target) return;
  const d = calcularDistancia(enemy, target);
  if (d > 0.01) {
    const s = Math.min(speed * dt, d),
      nx = enemy.x + ((target.x - enemy.x) * s) / d,
      nz = enemy.z + ((target.z - enemy.z) * s) / d;
    if (podeCaminhar(map, nx, nz, 0.22)) {
      enemy.x = nx;
      enemy.z = nz;
    } else {
      enemy.target = {
        x: (x + 0.5) * TAMANHO_CELULA,
        z: (z + 0.5) * TAMANHO_CELULA,
      };
    }
  }
}
export function temVisaoDireta(map, a, b) {
  const n = Math.ceil(calcularDistancia(a, b) * 4);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (
      map[Math.floor((a.z + (b.z - a.z) * t) / TAMANHO_CELULA)]?.[
        Math.floor((a.x + (b.x - a.x) * t) / TAMANHO_CELULA)
      ] !== 0
    )
      return false;
  }
  return true;
}
export function calcularArduinos(meters) {
  return Math.max(0, Math.min(5, Math.ceil((50 - meters) / 10)));
}
