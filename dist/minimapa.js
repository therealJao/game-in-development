import { MESAS_PONTO_KENTE } from "./regras-ponto-kente.js";
// HUD: mapa fixo, planta completa, objetivos numerados e caminho real pelos corredores.
import { calcularDistancias } from "./mapas.js";
import { ROTA_ESCADARIA, ENCONTROS_CASTELO } from "./regras-castelo.js";

/** Retorna uma rota em centros de células, sem cruzar paredes. */
export function calcularRotaMapa(mapa, jogador, destino, tamanhoCelula) {
  if (!destino) return [];
  const escala = tamanhoCelula / 3;
  const campo = calcularDistancias(mapa, {
    x: destino.x / escala,
    z: destino.z / escala,
  });
  let x = Math.floor(jogador.x / tamanhoCelula),
    z = Math.floor(jogador.z / tamanhoCelula);
  const pontos = [],
    limite = mapa.length * mapa[0].length;
  for (let passo = 0; passo < limite; passo++) {
    if (campo[z]?.[x] < 0 || campo[z]?.[x] === undefined) return [];
    pontos.push({ x: (x + 0.5) * tamanhoCelula, z: (z + 0.5) * tamanhoCelula });
    if (campo[z][x] === 0) return pontos;
    let proximo = null;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      if (campo[z + dz]?.[x + dx] === campo[z][x] - 1) {
        proximo = [x + dx, z + dz];
        break;
      }
    if (!proximo) return [];
    [x, z] = proximo;
  }
  return [];
}

export function dadosMinimapa(estado) {
  const modo = estado.mode === "paused" ? estado.previousMode : estado.mode;
  if (["playing", "map", "editor"].includes(modo)) {
    const nivel = estado.level;
    const terminais = nivel.terminals.map((t, i) => ({
      ...t,
      numero: i + 1,
      feito: t.done,
    }));
    return {
      mapa: nivel.map,
      tamanho: 3,
      jogador: estado.player,
      terminais,
      saida: nivel.exit,
      inimigos: estado.enemyDormant
        ? []
        : [nivel.enemy, ...(nivel.maicon.active ? [nivel.maicon] : [])],
      logos: (nivel.collectibles || []).filter((l) => !l.used),
      visitados: nivel.visited,
      titulo: "BACKROOMS",
      destino:
        terminais
          .filter((t) => !t.feito)
          .sort(
            (a, b) =>
              Math.hypot(a.x - estado.player.x, a.z - estado.player.z) -
              Math.hypot(b.x - estado.player.x, b.z - estado.player.z),
          )[0] || nivel.exit,
    };
  }
  if (
    ["alisanave", "painelPorto"].includes(modo) &&
    estado.porto?.etapa === "labirinto"
  ) {
    const f = estado.porto,
      terminais = f.terminais.map((t, i) => ({ ...t, numero: i + 1 }));
    return {
      mapa: f.mapa,
      tamanho: 6,
      jogador: f.jogador,
      terminais,
      saida: f.saida,
      inimigos: f.contagem <= 0 ? [f.yang] : [],
      logos: [],
      titulo:
        f.contagem > 0
          ? `YANG MING EM ${Math.ceil(f.contagem)} s`
          : "ALISANAVE",
      destino: terminais.find((t) => !t.feito) || f.saida,
    };
  }
  return null;
}

export function desenharMinimapa(canvas, dados, tempo = 0) {
  if (canvas.id !== "mapCanvas") return desenharNavegador(canvas, dados);
  const g = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height;
  g.clearRect(0, 0, w, h);
  if (!dados) return;
  const linhas = dados.mapa.length,
    colunas = dados.mapa[0].length;
  const escala = Math.min((w - 40) / colunas, (h - 54) / linhas),
    ox = (w - colunas * escala) / 2,
    oz = (h - linhas * escala) / 2 + 5;
  g.fillStyle = "#0d161de8";
  g.fillRect(0, 0, w, h);
  for (let z = 0; z < linhas; z++)
    for (let x = 0; x < colunas; x++) {
      const parede = dados.mapa[z][x] === 1,
        visitado = dados.visitados?.has(`${x},${z}`);
      g.fillStyle = parede ? "#34434b" : visitado ? "#5e7178" : "#26363e";
      g.fillRect(
        ox + x * escala,
        oz + z * escala,
        escala - 0.65,
        escala - 0.65,
      );
    }
  const coordenada = (p) => [
    ox + (p.x / dados.tamanho) * escala,
    oz + (p.z / dados.tamanho) * escala,
  ];
  // Linha azul representa uma rota caminhável, não uma seta atravessando paredes.
  const rota = calcularRotaMapa(
    dados.mapa,
    dados.jogador,
    dados.destino,
    dados.tamanho,
  );
  if (rota.length) {
    g.strokeStyle = "#72d5e9";
    g.lineWidth = 2.2;
    g.setLineDash([4, 3]);
    g.beginPath();
    rota.forEach((p, i) => {
      const [x, z] = coordenada(p);
      if (i === 0) g.moveTo(x, z);
      else g.lineTo(x, z);
    });
    g.stroke();
    g.setLineDash([]);
  }
  function ponto(p, cor, raio) {
    const [x, z] = coordenada(p);
    g.fillStyle = cor;
    g.beginPath();
    g.arc(x, z, raio, 0, Math.PI * 2);
    g.fill();
  }
  for (const logo of dados.logos) ponto(logo, "#bd92cd", 2.5);
  for (const t of dados.terminais) {
    const [x, z] = coordenada(t);
    g.fillStyle = t.feito ? "#416c60" : "#61d6ec";
    g.strokeStyle = "#112329";
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(x - 7, z - 7, 14, 14, 3);
    g.fill();
    g.stroke();
    g.font = "bold 10px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = t.feito ? "#bdd8cb" : "#08202b";
    g.fillText(t.feito ? "✓" : String(t.numero), x, z + 0.5);
  }
  const [sx, sz] = coordenada(dados.saida);
  g.fillStyle = "#8cce8d";
  g.fillRect(sx - 5, sz - 6, 10, 12);
  g.fillStyle = "#11241b";
  g.fillRect(sx, sz - 1, 2, 2);
  for (const inimigo of dados.inimigos) ponto(inimigo, "#f08571", 4);
  const [px, pz] = coordenada(dados.jogador);
  g.save();
  g.translate(px, pz);
  g.rotate(-dados.jogador.yaw);
  g.fillStyle = "#fff5d5";
  g.strokeStyle = "#12242b";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -8);
  g.lineTo(5.5, 6);
  g.lineTo(0, 3);
  g.lineTo(-5.5, 6);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
  g.textAlign = "right";
  g.textBaseline = "top";
  g.fillStyle = "#a3b8bf";
  g.font = "bold 10px Arial";
  g.fillText("N ↑", w - 12, 10);
}

/** Player-centred, rotating road map. The purple line follows the real BFS route. */
export function desenharNavegador(canvas, dados) {
  const g = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height;
  g.clearRect(0, 0, w, h);
  if (!dados) return;
  const p = dados.jogador,
    size = dados.tamanho,
    scale = 5.8,
    cx = w * 0.5,
    cy = h * 0.64;
  const route = calcularRotaMapa(dados.mapa, p, dados.destino, size);
  g.fillStyle = "#353636";
  g.fillRect(0, 0, w, h);
  g.save();
  g.translate(cx, cy);
  g.rotate(p.yaw || 0);
  g.scale(scale, scale);
  g.translate(-p.x, -p.z);
  // The visible corridors are drawn as connected streets, with dark building blocks.
  for (let z = 0; z < dados.mapa.length; z++)
    for (let x = 0; x < dados.mapa[z].length; x++) {
      const wall = dados.mapa[z][x] === 1;
      g.fillStyle = wall ? "#272929" : "#999b98";
      g.fillRect(x * size, z * size, size + 0.03, size + 0.03);
      if (wall) {
        g.strokeStyle = "#4b4e4b";
        g.lineWidth = 0.13;
        g.strokeRect(x * size + 0.25, z * size + 0.25, size - 0.5, size - 0.5);
      }
    }
  if (route.length) {
    g.beginPath();
    g.moveTo(p.x, p.z);
    for (const point of route) g.lineTo(point.x, point.z);
    g.strokeStyle = "#4d285a";
    g.lineWidth = 1.1;
    g.lineJoin = "round";
    g.stroke();
    g.strokeStyle = "#b380dd";
    g.lineWidth = 0.63;
    g.stroke();
  }
  function mark(point, color, radius = 1) {
    if (!point) return;
    g.beginPath();
    g.arc(point.x, point.z, radius, 0, 7);
    g.fillStyle = color;
    g.fill();
    g.lineWidth = 0.22;
    g.strokeStyle = "#202323";
    g.stroke();
  }
  for (const t of dados.terminais)
    mark(t, t.feito ? "#679479" : "#d7cbee", 0.95);
  for (const enemy of dados.inimigos) mark(enemy, "#cf5a5a", 0.65);
  mark(dados.saida, "#8cbd94", 0.9);
  g.restore();
  g.save();
  g.translate(cx, cy);
  g.beginPath();
  g.moveTo(0, -11);
  g.lineTo(8, 9);
  g.lineTo(0, 5);
  g.lineTo(-8, 9);
  g.closePath();
  g.fillStyle = "#f3f4ec";
  g.fill();
  g.lineWidth = 2.5;
  g.strokeStyle = "#30322e";
  g.stroke();
  g.restore();
  g.fillStyle = "#171b18d9";
  g.fillRect(0, h - 31, 110, 31);
  g.fillStyle = "#f2f3ed";
  g.font = "bold 18px Arial";
  g.textAlign = "left";
  const distance = Math.max(0, route.length - 1) * size;
  g.fillText(
    distance >= 1000
      ? (distance / 1000).toFixed(2) + " km"
      : Math.round(distance) + " m",
    12,
    h - 10,
  );
  g.textAlign = "right";
  g.fillText("N", w - 14, 25);
}

/** Planta simples para o prólogo e salas sem corredores. */
export function desenharMapaSala(canvas, estado) {
  const modoAero = estado.mode === "paused" ? estado.previousMode : estado.mode;
  if (modoAero === "aero") {
    if (
      [
        "lanchonete",
        "lanchoneteExplorar",
        "lanchoneteFinal",
        "fimAero",
      ].includes(estado.aero.etapa)
    )
      desenharMapaPontoKente(canvas, estado.aero);
    else desenharMapaAero(canvas, estado.aero);
    return;
  }
  const atual = estado.mode === "paused" ? estado.previousMode : estado.mode;
  if (atual === "castelo") {
    desenharMapaCastelo(canvas, estado.castelo);
    return;
  }
  const g = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height;
  g.fillStyle = "#0d161de8";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#33454f";
  g.fillRect(35, 35, w - 70, h - 70);
  g.fillStyle = "#1d2d36";
  g.fillRect(42, 42, w - 84, h - 84);
  const modo = estado.mode === "paused" ? estado.previousMode : estado.mode;
  let jogador = estado.player,
    limiteX = 5,
    limiteZ = 4.5,
    objetos = [];
  if (["home", "tv"].includes(modo)) {
    objetos = [
      { x: 0, z: -4, texto: "TV", cor: "#6dd7e9" },
      { x: 0, z: 2.4, texto: "SOFÁ", cor: "#e3c587" },
      { x: 3.9, z: -1.2, texto: "BIKE", cor: "#7c939e" },
    ];
  } else if (modo === "dungeon") {
    limiteX = 9;
    limiteZ = 12;
    objetos = [
      { x: 0, z: -3, texto: "BRITA", cor: "#6dd7e9" },
      { x: -4, z: -6, texto: "BIZ", cor: "#8ecf9c" },
      { x: 0, z: 8, texto: "PORTA", cor: "#e3c587" },
    ];
  } else if (modo === "alisanave" && estado.porto?.etapa === "sala") {
    limiteX = 7;
    limiteZ = 7;
    jogador = estado.porto.jogador;
    objetos = [
      { x: -3, z: -3, texto: "CHARLIE", cor: "#6dd7e9" },
      { x: 4, z: -3, texto: "TOBOGÃ", cor: "#8ecf9c" },
    ];
  }
  const coord = (p) => [
    w / 2 + (p.x / (limiteX * 2)) * (w - 84),
    h / 2 + (p.z / (limiteZ * 2)) * (h - 84),
  ];
  for (const o of objetos) {
    const [x, z] = coord(o);
    g.fillStyle = o.cor;
    g.fillRect(x - 12, z - 6, 24, 12);
    g.font = "bold 9px Arial";
    g.textAlign = "center";
    g.fillText(o.texto, x, z + 17);
  }
  const [x, z] = coord(jogador);
  g.save();
  g.translate(x, z);
  g.rotate(-jogador.yaw);
  g.fillStyle = "#fff4d3";
  g.beginPath();
  g.moveTo(0, -7);
  g.lineTo(5, 6);
  g.lineTo(-5, 6);
  g.closePath();
  g.fill();
  g.restore();
}

function desenharMapaCastelo(canvas, f) {
  const g = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height;
  const coord = (p) => [
    w / 2 + ((p.x - 1.5) / 39) * (w - 50),
    h * 0.66 + (p.z / 52) * (h - 45),
  ];
  g.fillStyle = "#0d161de8";
  g.fillRect(0, 0, w, h);
  const [x, z] = coord({ x: -12, z: -13 }),
    [xx, zz] = coord({ x: 12, z: 13 });
  g.fillStyle = "#25353e";
  g.fillRect(x, z, xx - x, zz - z);
  g.strokeStyle = "#60737a";
  g.lineWidth = 5;
  g.strokeRect(x, z, xx - x, zz - z);
  g.strokeStyle = "#354951";
  g.lineWidth = 1;
  for (let i = -10; i < 12; i += 2) {
    const a = coord({ x: i, z: -13 }),
      b = coord({ x: i, z: 13 });
    g.beginPath();
    g.moveTo(...a);
    g.lineTo(...b);
    g.stroke();
  }
  for (let i = -11; i < 13; i += 2) {
    g.beginPath();
    g.moveTo(...coord({ x: -12, z: i }));
    g.lineTo(...coord({ x: 12, z: i }));
    g.stroke();
  }
  for (const bx of [-5.3, 5.3]) {
    const a = coord({ x: bx - 2, z: 2.6 }),
      b = coord({ x: bx + 2, z: 3.8 });
    g.fillStyle = "#8c795e";
    g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  }
  g.strokeStyle = "#63c8dd";
  g.lineWidth = 3;
  g.setLineDash([5, 4]);
  g.beginPath();
  ROTA_ESCADARIA.forEach((p, i) => {
    const a = coord(p);
    if (i) g.lineTo(...a);
    else g.moveTo(...a);
  });
  g.stroke();
  g.setLineDash([]);
  const ponto = (p, texto, cor) => {
    const [x, z] = coord(p);
    g.fillStyle = cor;
    g.beginPath();
    g.arc(x, z, 5, 0, Math.PI * 2);
    g.fill();
    g.font = "bold 9px Arial";
    g.textAlign = "center";
    g.fillText(texto, x, z - 10);
  };
  ponto({ x: 0, z: 0 }, "DISCUSSÃO", "#ce9b72");
  ponto({ x: -9, z: -9 }, "HTML", "#69d5e1");
  ponto(ENCONTROS_CASTELO.davy, "DAVY", "#b7c6dc");
  ponto(ENCONTROS_CASTELO.little, "BULLS", "#db6862");
  ponto(ROTA_ESCADARIA.at(-1), "CJ / PORTAL", "#b192ed");
  const [px, pz] = coord(f.jogador);
  g.save();
  g.translate(px, pz);
  g.rotate(-f.jogador.yaw);
  g.beginPath();
  g.moveTo(0, -9);
  g.lineTo(6, 7);
  g.lineTo(0, 4);
  g.lineTo(-6, 7);
  g.closePath();
  g.fillStyle = "#fff0ce";
  g.fill();
  g.restore();
  g.fillStyle = "#9eafb8";
  g.font = "10px Arial";
  g.textAlign = "center";
  g.fillText("CTRL / ○ B · AGACHAR", w / 2, h - 15);
}

function desenharMapaAero(canvas, f) {
  const g = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height;
  const x = (v) => w / 2 + (v / 58) * (w - 36),
    z = (v) => h / 2 + (v / 86) * (h - 36);
  g.fillStyle = "#093e50ee";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#1a7160";
  g.fillRect(x(-24), z(-36), x(24) - x(-24), z(36) - z(-36));
  g.strokeStyle = "#c3eff1";
  g.lineWidth = 2;
  g.strokeRect(x(-24), z(-36), x(24) - x(-24), z(36) - z(-36));
  g.beginPath();
  g.moveTo(x(-24), z(0));
  g.lineTo(x(24), z(0));
  g.stroke();
  for (const zz of [-36, 36]) {
    g.fillStyle = "#edfbff";
    g.fillRect(x(-4.2), z(zz) - 2, x(4.2) - x(-4.2), 4);
  }
  for (const [p, cor, r] of [
    [f.jogador, "#fff5ca", 5],
    [f.naverdachi, "#71e2ff", 4],
    [f.bola, "#fa96d2", 3],
  ]) {
    g.fillStyle = cor;
    g.beginPath();
    g.arc(x(p.x), z(p.z), r, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#b7e7ed";
  g.font = "10px Arial";
  g.textAlign = "center";
  g.fillText("CHUTE NO GOL ↑", w / 2, 17);
}

function desenharMapaPontoKente(canvas, f) {
  const g = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height,
    x = (v) => w / 2 + (v / 10) * (w - 30),
    z = (v) => 20 + ((v + 9) / 15.5) * (h - 40);
  g.fillStyle = "#0b2937ee";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#c2d1c7";
  g.fillRect(x(-4.5), z(-8.8), x(4.5) - x(-4.5), z(6.25) - z(-8.8));
  const ret = (xx, zz, l, p, cor) => {
    g.fillStyle = cor;
    g.fillRect(x(xx), z(zz), x(xx + l) - x(xx), z(zz + p) - z(zz));
  };
  ret(0.5, -8.5, 3.9, 4.2, "#647d83");
  ret(-4.4, 0, 1.7, 2.25, "#7b8e91");
  ret(-1.9, -5.1, 3.5, 1.1, "#b74a52");
  ret(1, -3.6, 0.95, 0.85, "#ebf2e9");
  for (const m of MESAS_PONTO_KENTE) {
    g.fillStyle = "#d35c64";
    g.beginPath();
    g.arc(x(m.x), z(m.z), 8, 0, Math.PI * 2);
    g.fill();
    for (const lado of [-1, 1])
      ret(m.x + lado * 0.86 - 0.15, m.z - 0.15, 0.3, 0.3, "#ffffff");
  }
  g.fillStyle = "#10313b";
  g.font = "bold 9px Arial";
  g.textAlign = "center";
  g.fillText("COZINHA", x(2.3), z(-6.5));
  g.fillText("WC", x(-3.5), z(1));
  g.fillText("BALCÃO", x(-0.3), z(-4.9));
  g.fillText("ENTRADA", x(-2.0), z(5.9));
  g.fillStyle = "#6ce9ee";
  g.fillRect(x(0.35) - 5, z(-4.1) - 5, 10, 10);
  g.fillStyle = "#fff3a1";
  g.beginPath();
  g.arc(x(f.jogador.x), z(f.jogador.z), 5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#d3f8f0";
  g.fillText("PAINEL DE PEDIDOS ↑", w / 2, 12);
}
