import * as T from "./vendor/three.module.js";

/**
 * Animação de minifig Lego SEM alterar o modelo: as peças originais (cabeça, tronco, quadril,
 * pernas, braços, mãos) ganham pivôs nas articulações reais de um minifig — pescoço, ombros,
 * pulsos e quadril — e passam a respirar, olhar em volta, gesticular, andar e rir.
 * Funciona com os nomes do LegoJoker.gltf (russo) e com nomes em inglês/português.
 */
const PADROES = {
  cabeca: /голова|head|cabe/i,
  tronco: /тело|torso|body|tronco/i,
  quadril: /пояс|hip|quadril|cintura/i,
  pernaA: /^нога[\s_]*$|leg.?(l|1)|perna.?(e|1)/i,
  pernaB: /нога[\s_]*2|leg.?(r|2)|perna.?(d|2)/i,
  bracoA: /^рука[\s_]*1|arm.?(l|1)|braco.?(e|1)/i,
  bracoB: /^рука[\s_]*2|arm.?(r|2)|braco.?(d|2)/i,
  maoA: /кисть[\s_]*руки[\s_]*1|hand.?(l|1)|mao.?(e|1)/i,
  maoB: /кисть[\s_]*руки[\s_]*2|hand.?(r|2)|mao.?(d|2)/i,
};

/** Coloca o objeto dentro de um pivô posicionado em `ponto` (coordenadas do pai), sem mover nada visualmente. */
function pivotar(obj, ponto) {
  const pai = obj.parent,
    pivo = new T.Group();
  pivo.name = "Pivo_" + obj.name;
  pivo.position.copy(ponto);
  pai.add(pivo);
  obj.position.sub(ponto);
  pivo.add(obj);
  return pivo;
}
function caixaLocal(obj) {
  // Caixa da peça no espaço do pai (considera a posição/rotação/escala dela).
  obj.updateMatrix();
  obj.geometry.computeBoundingBox();
  return obj.geometry.boundingBox.clone().applyMatrix4(obj.matrix);
}

export function animarLego(raiz) {
  raiz.updateMatrixWorld(true);
  const partes = {};
  raiz.traverse((o) => {
    if (!o.isMesh) return;
    for (const [k, re] of Object.entries(PADROES)) if (!partes[k] && re.test(o.name.trim())) partes[k] = o;
  });
  if (!partes.cabeca || !partes.tronco) return (t) => {};
  // Todas as peças compartilham o mesmo pai no glTF; medimos tudo nesse espaço.
  const tronco = caixaLocal(partes.tronco);
  const centroX = (tronco.min.x + tronco.max.x) / 2,
    alturaTronco = tronco.max.y - tronco.min.y;
  const juntas = {};
  if (partes.cabeca) {
    const c = caixaLocal(partes.cabeca);
    juntas.cabeca = pivotar(partes.cabeca, new T.Vector3((c.min.x + c.max.x) / 2, c.min.y, (c.min.z + c.max.z) / 2));
  }
  for (const lado of ["A", "B"]) {
    const braco = partes["braco" + lado],
      mao = partes["mao" + lado];
    if (braco) {
      const b = caixaLocal(braco),
        dentro = Math.abs(b.min.x - centroX) < Math.abs(b.max.x - centroX) ? b.min.x : b.max.x;
      // Ombro: topo do braço, do lado colado ao tronco.
      juntas["braco" + lado] = pivotar(braco, new T.Vector3(dentro, b.max.y - (b.max.y - b.min.y) * 0.18, (b.min.z + b.max.z) / 2));
      if (mao) {
        const m = caixaLocal(mao);
        // A mão passa a seguir o braço (como no brinquedo) e gira no pulso.
        const ombro = juntas["braco" + lado];
        const pulso = new T.Vector3((m.min.x + m.max.x) / 2, m.max.y, (m.min.z + m.max.z) / 2);
        const pm = pivotar(mao, pulso);
        ombro.attach(pm);
        juntas["mao" + lado] = pm;
      }
    }
    const perna = partes["perna" + lado];
    if (perna) {
      const p = caixaLocal(perna);
      juntas["perna" + lado] = pivotar(perna, new T.Vector3((p.min.x + p.max.x) / 2, p.max.y, (p.min.z + p.max.z) / 2));
    }
  }
  // Corpo superior (tronco + cabeça + braços) gira sobre o quadril para respirar e rir.
  const superior = new T.Group();
  superior.name = "Pivo_tronco";
  const quadrilY = partes.quadril ? caixaLocal(partes.quadril).max.y : tronco.min.y;
  superior.position.set(centroX, quadrilY, (tronco.min.z + tronco.max.z) / 2);
  partes.tronco.parent.add(superior);
  for (const o of [partes.tronco, juntas.cabeca, juntas.bracoA, juntas.bracoB].filter(Boolean)) superior.attach(o);
  const base = new Map();
  for (const j of [superior, ...Object.values(juntas)]) base.set(j, { r: j.rotation.clone(), p: j.position.clone() });
  // Lado de cada braço: positivo para fora.
  const sinal = (j) => (j && j.position.x < superior.position.x ? -1 : 1);
  const sA = sinal(juntas.bracoA),
    sB = sinal(juntas.bracoB);

  /**
   * @param t tempo em segundos
   * @param andar 0..1 intensidade da caminhada
   * @param risada 0..1 intensidade da risada (Coringa)
   */
  return (t, andar = 0, risada = 0) => {
    for (const [j, b] of base) {
      j.rotation.copy(b.r);
      j.position.copy(b.p);
    }
    const passo = Math.sin(t * 7) * andar;
    // Respiração e balanço do tronco.
    superior.rotation.x += Math.sin(t * 1.6) * 0.02 - risada * (0.12 + Math.abs(Math.sin(t * 14)) * 0.18);
    superior.rotation.z += Math.sin(t * 7) * 0.03 * andar;
    superior.position.y += Math.abs(Math.sin(t * 14)) * alturaTronco * 0.06 * risada;
    // Cabeça: olha ao redor (minifig gira no pino do pescoço).
    if (juntas.cabeca) {
      juntas.cabeca.rotation.y += Math.sin(t * 0.7) * 0.55 + Math.sin(t * 2.3) * 0.06;
      juntas.cabeca.rotation.x += Math.sin(t * 1.1) * 0.05 - risada * 0.25;
    }
    // Braços: giram só no eixo do ombro (como o brinquedo); gesticulam parado, balançam andando.
    const gesto = (1 - andar) * (Math.sin(t * 0.9) * 0.5 + 0.5);
    if (juntas.bracoA) juntas.bracoA.rotation.x += passo * 0.9 - gesto * 0.9 - risada * (0.95 + Math.sin(t * 18) * 0.15);
    if (juntas.bracoB) juntas.bracoB.rotation.x += -passo * 0.9 - Math.sin(t * 1.3) * 0.15 - risada * (0.85 + Math.sin(t * 18 + 1) * 0.15);
    // Mãos: giram no pulso.
    if (juntas.maoA) juntas.maoA.rotation.y += Math.sin(t * 2.1) * 0.6 * sA;
    if (juntas.maoB) juntas.maoB.rotation.y += Math.sin(t * 1.7 + 1) * 0.5 * sB;
    // Pernas: dobram juntas no quadril (minifig) e alternam ao andar.
    if (juntas.pernaA) juntas.pernaA.rotation.x += passo * 0.7;
    if (juntas.pernaB) juntas.pernaB.rotation.x -= passo * 0.7;
  };
}
