// Minigame em sprites: a chegada permanece em 3D e compartilha os mesmos personagens.
const pasta = new URL("assets/praia/sprites/", import.meta.url).href;
function carregar(nome) {
  return new Promise((ok, erro) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => erro(new Error("Sprite ausente: " + nome));
    i.src = pasta + nome;
  });
}
export async function carregarSpritesVolei() {
  const [personagens, bola, ambiente] = await Promise.all(
    ["personagens.png", "bola.png", "ambiente.png"].map(carregar),
  );
  return { personagens, bola, ambiente };
}
export function esconderSpritesVolei() {
  const c = document.getElementById("voleiSprites");
  if (c) c.hidden = true;
}
export function desenharSpritesVolei(c, f) {
  const canvas = document.getElementById("voleiSprites");
  if (!canvas || !c.sprites) return false;
  canvas.hidden = false;
  const w = innerWidth,
    h = innerHeight,
    dpr = Math.min(2, devicePixelRatio || 1);
  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const g = canvas.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  g.drawImage(c.sprites.ambiente, 0, 0, w, h);
  const v = f.volei,
    t = f.animacao,
    s = Math.min(w / 23, h / 10),
    chao = h * 0.76;
  const p = (x, z = 0) => [w / 2 + x * s + z * 9, chao + z * 17];
  // Ondas discretas e bolhas em primeiro plano animam o panorama.
  g.save();
  g.globalAlpha = 0.16;
  g.strokeStyle = "#f2ffff";
  g.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    for (let x = 0; x <= w; x += 12) {
      const y = h * 0.45 + i * 5 + Math.sin(x * 0.013 + t * 1.5 + i) * 2;
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  g.restore();
  for (let i = 0; i < 8; i++) {
    const x = (i * 179 + t * 9) % (w + 30),
      y = h * 0.2 + Math.sin(i * 1.7 + t * 0.3) * h * 0.13,
      r = 5 + (i % 3) * 3;
    const grad = g.createRadialGradient(x - r * 0.3, y - r * 0.4, 1, x, y, r);
    grad.addColorStop(0, "#ffffffab");
    grad.addColorStop(0.5, "#7fe6ff12");
    grad.addColorStop(1, "#eaffff90");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const canto = [p(-9, -2), p(9, -2), p(9, 2), p(-9, 2)];
  g.beginPath();
  canto.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = "#ffe9b31c";
  g.fill();
  g.strokeStyle = "#17b3d8";
  g.lineWidth = 3;
  g.stroke();
  const sombra = (x, y, r) => {
    g.save();
    g.translate(x, y);
    g.scale(1, 0.25);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
    gr.addColorStop(0, "#6b6b4b55");
    gr.addColorStop(1, "#6b6b4b00");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, r, 0, 7);
    g.fill();
    g.restore();
  };
  function boneco(nome, col, estado, z, espelhar = false, alegre = false) {
    const [x, y] = p(estado.x, z),
      jump = estado.y || 0;
    sombra(x, y, 31);
    const pose = alegre
      ? 3
      : estado.golpe > 0
        ? jump > 0.1
          ? 2
          : 1
        : jump > 0.15
          ? 2
          : 0;
    const frame = pose * 2 + (Math.floor(t * 4) % 2),
      sw = 2.5 * s,
      sh = 2.9 * s;
    g.save();
    g.translate(x, y - jump * s);
    if (espelhar) g.scale(-1, 1);
    g.drawImage(
      c.sprites.personagens,
      col * 256,
      frame * 320,
      256,
      320,
      -sw / 2,
      -sh * 0.948,
      sw,
      sh,
    );
    g.restore();
    g.font = "bold 11px Arial";
    g.textAlign = "center";
    const tw = g.measureText(nome).width + 16;
    g.fillStyle = "#eaffffe8";
    g.beginPath();
    g.roundRect(x - tw / 2, y + 12, tw, 20, 8);
    g.fill();
    g.fillStyle = "#07647e";
    g.fillText(nome, x, y + 26);
  }
  const feliz = ["voleiVitoria", "fimAero"].includes(f.etapa);
  boneco("NAV", 1, v.nav, -1.3, false, feliz);
  boneco("ALYA", 3, v.alya, -1.3, true, feliz);
  // Rede em perspectiva curta, com postes e fita superior.
  const a = p(0, -2.3),
    b = p(0, 2.3),
    altura = 2.25 * s;
  g.strokeStyle = "#ffffffad";
  g.lineWidth = 1;
  for (let i = 0; i <= 12; i++) {
    const k = i / 12,
      x = a[0] + (b[0] - a[0]) * k,
      y = a[1] + (b[1] - a[1]) * k;
    g.beginPath();
    g.moveTo(x, y - altura);
    g.lineTo(x, y - altura * 0.55);
    g.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const y = altura * (0.55 + i * 0.09);
    g.beginPath();
    g.moveTo(a[0], a[1] - y);
    g.lineTo(b[0], b[1] - y);
    g.stroke();
  }
  g.strokeStyle = "#f4ffff";
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(a[0], a[1] - altura);
  g.lineTo(b[0], b[1] - altura);
  g.stroke();
  for (const [x, y] of [a, b]) {
    g.strokeStyle = "#e9ffff";
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y - altura - 12);
    g.stroke();
    g.strokeStyle = "#25bed7";
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y - 32);
    g.stroke();
  }
  boneco("AXEL · VOCÊ", 0, v.axel, 1.2, false, feliz);
  boneco("JONESY", 4, v.jonesy, 1.2, true, feliz);
  boneco(
    "BOB ESPONJA",
    2,
    { x: -10, y: Math.abs(Math.sin(t * 2)) * 0.08, golpe: 0 },
    -1,
    false,
    true,
  );
  const bola = v.bola,
    [bx, by] = p(bola.x);
  sombra(bx, by, 20 + bola.y * 3);
  if (bola.vx < 0 && v.fase === "rally") {
    const dur =
      (bola.vy + Math.sqrt(bola.vy ** 2 + 12.8 * Math.max(0, bola.y - 0.22))) /
      6.4;
    const [tx, ty] = p(Math.max(-9, Math.min(9, bola.x + bola.vx * dur)));
    g.strokeStyle = "#04a4c9";
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(tx, ty, 22, 7, 0, 0, 7);
    g.stroke();
  }
  const tam = s * 0.62,
    frame = Math.floor(bola.giro * 2) % 8;
  g.drawImage(
    c.sprites.bola,
    frame * 128,
    0,
    128,
    128,
    bx - tam / 2,
    by - bola.y * s - tam / 2,
    tam,
    tam,
  );
  return true;
}
