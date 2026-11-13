// Sequência de cinco trilhas baseada nos ataques de volume da faixa fornecida.
export const CORES_TRILHAS = [
  "#66ed7d",
  "#f46d70",
  "#ffe16b",
  "#76d6ff",
  "#ffb265",
];
export const DURACAO_LOOP_FUNK = 7.39;
export const BATIDAS_FUNK = [
  0.128, 0.546, 0.998, 1.463, 1.916, 2.38, 2.844, 3.297, 3.762, 4.249, 4.69,
  5.155, 5.608, 6.072, 6.536, 6.989,
];
export function criarBatalhaRitmo() {
  const padrao = [0, 1, 2, 3, 4, 2, 1, 0, 3, 2, 4, 1, 2, 0, 4, 3];
  return {
    tempo: -3,
    duracao: DURACAO_LOOP_FUNK * 2,
    notas: Array.from({ length: 2 }, (_, volta) =>
      BATIDAS_FUNK.filter((_, i) => i % 2 === 0).map((t, i) => ({
        tempo: t + volta * DURACAO_LOOP_FUNK,
        trilha: [0, 2, 3, 2][i % 4],
        estado: "pendente",
      })),
    ).flat(),
    acertos: 0,
    erros: 0,
    combo: 0,
    melhorCombo: 0,
    energia: 100,
    vidaVilao: 100,
    terminou: false,
    venceu: false,
    feedback: "PREPARE-SE",
    feedbackTempo: 0,
    brilho: [0, 0, 0, 0, 0],
  };
}
export function acertarTrilha(r, trilha) {
  if (
    r.terminou ||
    r.tempo < 0 ||
    !Number.isInteger(trilha) ||
    trilha < 0 ||
    trilha > 4
  )
    return false;
  r.brilho[trilha] = 0.16;
  const nota = r.notas
    .filter(
      (n) =>
        n.trilha === trilha &&
        n.estado === "pendente" &&
        Math.abs(n.tempo - r.tempo) <= 0.45,
    )
    .sort(
      (a, b) => Math.abs(a.tempo - r.tempo) - Math.abs(b.tempo - r.tempo),
    )[0];
  if (nota) {
    nota.estado = "acerto";
    r.acertos++;
    r.combo++;
    r.melhorCombo = Math.max(r.combo, r.melhorCombo);
    r.energia = Math.min(100, r.energia + 2.3);
    r.vidaVilao = Math.max(
      0,
      100 - (r.acertos / (r.notas.length * 0.25)) * 100,
    );
    r.feedback = Math.abs(nota.tempo - r.tempo) < 0.08 ? "PERFEITO!" : "BOA!";
    r.feedbackTempo = 0.45;
    return true;
  }
  r.combo = 0;
  r.erros++;
  r.energia = Math.max(0, r.energia);
  r.feedback = "FORA DO TEMPO";
  r.feedbackTempo = 0.35;
  return false;
}
export function atualizarBatalhaRitmo(r, dt) {
  if (r.terminou) return;
  r.tempo += dt;
  r.feedbackTempo = Math.max(0, r.feedbackTempo - dt);
  r.brilho = r.brilho.map((b) => Math.max(0, b - dt));
  for (const n of r.notas)
    if (n.estado === "pendente" && r.tempo - n.tempo > 0.45) {
      n.estado = "erro";
      r.erros++;
      r.combo = 0;
      r.energia = Math.max(0, r.energia - 1);
    }
  if (r.energia <= 0 || r.tempo >= r.duracao + 0.6) {
    r.terminou = true;
    r.venceu = r.energia > 0 && r.acertos >= Math.ceil(r.notas.length * 0.25);
    r.feedback = r.venceu ? "BLUEZÃO DERROTADO!" : "TENTE NOVAMENTE";
  }
}
export function desenharPistaRitmo(canvas, r) {
  const g = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height,
    centro = w / 2,
    topo = 42,
    base = h - 80,
    alvo = base - 18;
  g.clearRect(0, 0, w, h);
  g.beginPath();
  g.moveTo(centro - 65, topo);
  g.lineTo(centro + 65, topo);
  g.lineTo(centro + 250, base + 30);
  g.lineTo(centro - 250, base + 30);
  g.closePath();
  g.fillStyle = "#051d2de8";
  g.fill();
  g.strokeStyle = "#92e7ff99";
  g.lineWidth = 2;
  g.stroke();
  for (let i = 0; i <= 5; i++) {
    g.beginPath();
    g.moveTo(centro - 65 + i * 26, topo);
    g.lineTo(centro - 250 + i * 100, base + 30);
    g.strokeStyle = "#c1f6ff33";
    g.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const x = centro + (i - 2) * 94;
    g.beginPath();
    g.ellipse(x, alvo, 36, 12, 0, 0, Math.PI * 2);
    g.fillStyle = r.brilho[i] > 0 ? "#ffffff" : CORES_TRILHAS[i];
    g.shadowBlur = r.brilho[i] > 0 ? 24 : 0;
    g.shadowColor = CORES_TRILHAS[i];
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = "#ffffffaa";
    g.stroke();
    g.fillStyle = "#e8fbff";
    g.font = "bold 16px Arial";
    g.textAlign = "center";
    g.fillText(["A", "S", "D", "F", "G"][i], x, base + 26);
  }
  const janela = 4;
  for (const n of r.notas) {
    const dt = n.tempo - r.tempo;
    if (n.estado !== "pendente" || dt < -0.17 || dt > janela) continue;
    const v = 1 - dt / janela,
      prof = Math.max(0, v),
      y = topo + (alvo - topo) * prof,
      x = centro + (n.trilha - 2) * (26 + 68 * prof),
      raio = 9 + 24 * prof;
    g.beginPath();
    g.ellipse(x, y, raio, raio * 0.34, 0, 0, Math.PI * 2);
    g.fillStyle = CORES_TRILHAS[n.trilha];
    g.fill();
    g.strokeStyle = "#edffff";
    g.lineWidth = 2;
    g.stroke();
    g.beginPath();
    g.ellipse(x, y - 2, raio * 0.65, raio * 0.18, 0, 0, Math.PI * 2);
    g.fillStyle = "#ffffff99";
    g.fill();
  }
  g.fillStyle = "#e5ffff";
  g.textAlign = "center";
  g.font = "bold 24px Arial";
  g.fillText(
    r.tempo < 0
      ? String(Math.ceil(-r.tempo))
      : r.feedbackTempo > 0
        ? r.feedback
        : "COMBO " + r.combo,
    centro,
    26,
  );
  g.font = "13px Arial";
  g.fillText(
    "1  2  3  4  5 também funcionam · acerte ao cruzar a linha",
    centro,
    h - 16,
  );
}
