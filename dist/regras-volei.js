// Vôlei de praia acessível. Física em metros; X atravessa a rede e Y é altura.
export const QUADRA_VOLEI = Object.freeze({
  limite: 9,
  rede: 2.25,
  raio: 0.22,
  meta: 5,
});
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
export function criarVolei() {
  return {
    axel: { x: -6, y: 0, vy: 0, golpe: 0 },
    nav: { x: -2.6, y: 0, golpe: 0 },
    alya: { x: 3, y: 0, golpe: 0 },
    jonesy: { x: 6, y: 0, golpe: 0 },
    bola: { x: -6, y: 1.6, vx: 0, vy: 0, giro: 0 },
    pontos: [0, 0],
    fase: "saque",
    sacador: 0,
    pausa: 0,
    cooldown: 0,
    janela: 0,
    toques: 0,
    rallies: 0,
    ultimoLado: 0,
    tempo: 0,
    terminado: false,
    venceu: false,
    mensagem: "ESPAÇO / E / A: sacar · A/D: mover · W: saltar",
    acao: "SACAR",
  };
}
function lancar(v, destino, altura = 8) {
  const b = v.bola,
    duracao =
      (altura + Math.sqrt(altura * altura + 2 * 6.4 * Math.max(0, b.y - 0.3))) /
      6.4;
  b.vx = (destino - b.x) / duracao;
  b.vy = altura;
  v.cooldown = 0.48;
  v.fase = "rally";
}
export function acaoVolei(v) {
  if (v.terminado || v.pausa > 0 || v.cooldown > 0) return false;
  if (v.fase === "saque") {
    if (v.sacador !== 0) return false;
    Object.assign(v.bola, { x: v.axel.x, y: 1.8 });
    lancar(v, 5.6, 8.5);
    v.axel.golpe = 0.5;
    v.ultimoLado = 0;
    v.mensagem = "SAQUE! Naverdachi cobre a recepção.";
    return true;
  }
  // O comando fica guardado por 1,1 s: não exige acertar um instante exato.
  v.janela = 1.1;
  return tentarGolpe(v);
}
function tentarGolpe(v) {
  const b = v.bola;
  if (b.x >= -0.35 || b.x < -9.3 || b.y > 4.5 || v.cooldown > 0) return false;
  // Assistência aproxima Axel da bola e Nav mantém a cobertura.
  v.axel.x = limitar(b.x, -8.5, -0.8);
  v.axel.golpe = 0.5;
  if (v.toques === 0 && b.y < 2.8) {
    lancar(v, -2.1, 7);
    v.toques = 1;
    v.mensagem = "BOA RECEPÇÃO! Aperte novamente para cortar.";
  } else {
    lancar(v, 7.5, b.y > 2.8 ? 3.7 : 6.3);
    v.toques = 0;
    v.rallies++;
    v.axel.y = Math.max(v.axel.y, 0.6);
    v.axel.vy = 2;
    v.mensagem = "CORTADA!";
  }
  v.ultimoLado = 0;
  v.janela = 0;
  return true;
}
function ponto(v, lado, motivo) {
  v.pontos[lado]++;
  v.pausa = 2.3;
  v.fase = "ponto";
  v.sacador = lado;
  v.mensagem =
    (lado === 0 ? "PONTO DA DUPLA! " : "Ponto de Alya e Jonesy. ") + motivo;
  Object.assign(v.bola, { vx: 0, vy: 0 });
  if (v.pontos[lado] >= QUADRA_VOLEI.meta) {
    v.terminado = true;
    v.venceu = lado === 0;
    v.mensagem = v.venceu
      ? "VITÓRIA! Todo mundo comemora na praia!"
      : "Boa partida! E / A para tentar novamente.";
  }
}
export function atualizarVolei(v, dt, teclas = new Set()) {
  if (!Number.isFinite(dt) || dt <= 0 || v.terminado) return;
  // Subpassos também tornam saltos e colisões consistentes em telas lentas.
  let restante = Math.min(dt, 0.25);
  while (restante > 0.00001) {
    const h = Math.min(restante, 1 / 120);
    restante -= h;
    passo(v, h, teclas);
  }
}
function passo(v, h, teclas) {
  v.tempo += h;
  v.cooldown = Math.max(0, v.cooldown - h);
  v.janela = Math.max(0, v.janela - h);
  for (const p of [v.axel, v.nav, v.alya, v.jonesy])
    p.golpe = Math.max(0, p.golpe - h);
  const direcao =
    (teclas.has("d") || teclas.has("ArrowRight") ? 1 : 0) -
    (teclas.has("a") || teclas.has("ArrowLeft") ? 1 : 0) +
    (teclas.controle?.x || 0);
  v.axel.x = limitar(v.axel.x + direcao * h * 5.5, -8.5, -0.85);
  if ((teclas.has("w") || teclas.has("ArrowUp")) && v.axel.y === 0)
    v.axel.vy = 4.8;
  v.axel.vy -= h * 10;
  v.axel.y = Math.max(0, v.axel.y + v.axel.vy * h);
  if (v.axel.y === 0) v.axel.vy = 0;
  if (v.pausa > 0) {
    v.pausa -= h;
    if (v.pausa <= 0) {
      v.fase = "saque";
      v.toques = v.rallies = 0;
      Object.assign(v.bola, {
        x: v.sacador ? 6 : v.axel.x,
        y: 1.6,
        vx: 0,
        vy: 0,
      });
      v.mensagem = v.sacador
        ? "Jonesy vai sacar…"
        : "Sua vez: E / ESPAÇO / A para sacar.";
      v.cooldown = 1;
    }
    return;
  }
  const b = v.bola;
  if (v.fase === "saque") {
    b.x = v.sacador ? 6 : v.axel.x;
    if (v.sacador && v.cooldown <= 0) {
      lancar(v, -5, 8.3);
      v.ultimoLado = 1;
    }
    v.acao = "SACAR";
    return;
  }
  v.acao = b.x < 0 ? (v.toques ? "CORTAR" : "RECEBER") : "PREPARE-SE";
  if (v.janela > 0) tentarGolpe(v);
  const antes = b.x;
  b.vy -= h * 6.4;
  b.x += b.vx * h;
  b.y += b.vy * h;
  b.giro += h * 4;
  if (antes * b.x < 0 && b.y - QUADRA_VOLEI.raio < QUADRA_VOLEI.rede) {
    b.x = Math.sign(antes) * 0.25;
    b.vx *= -0.3;
    b.vy = Math.max(1, b.vy * 0.2);
    v.mensagem = "Na rede!";
  }
  // Naverdachi levanta bolas baixas quando o jogador precisa de ajuda.
  v.nav.x += (limitar(b.x, -7.8, -1.2) - v.nav.x) * Math.min(1, h * 3);
  if (
    b.x < -0.4 &&
    b.x > -9 &&
    b.y < 1.7 &&
    b.vy < 0 &&
    v.cooldown <= 0 &&
    v.toques === 0
  ) {
    v.nav.golpe = 0.5;
    lancar(v, -3.6, 7.6);
    v.toques = 1;
    v.ultimoLado = 0;
    v.mensagem = "NAV LEVANTOU! Aperte E / ESPAÇO / A para cortar.";
  }
  // Adversários trocam bola devagar. A defesa tem alcance limitado e cansa após a troca.
  const alvo = b.x < 4.5 ? v.alya : v.jonesy;
  alvo.x += (limitar(b.x, 0.9, 8) - alvo.x) * Math.min(1, h * 1.4);
  if (
    b.x > 0.4 &&
    b.x < 9 &&
    b.y < 2.2 &&
    b.vy < 0 &&
    v.cooldown <= 0 &&
    Math.abs(alvo.x - b.x) < (v.rallies >= 2 ? 0.45 : 1.7)
  ) {
    alvo.golpe = 0.5;
    lancar(v, -5.8 + Math.sin(v.tempo) * 1.5, 7.5);
    v.toques = 0;
    v.ultimoLado = 1;
    v.mensagem = "A bola está voltando! E / ESPAÇO / A para receber.";
  }
  if (b.y <= QUADRA_VOLEI.raio)
    ponto(
      v,
      Math.abs(b.x) > 9 ? 1 - v.ultimoLado : b.x > 0 ? 0 : 1,
      Math.abs(b.x) > 9 ? "Bola fora." : "Bola na areia.",
    );
}
