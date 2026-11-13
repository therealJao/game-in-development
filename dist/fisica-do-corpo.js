// Módulo do jogo. Consulte GUIA-DE-EDICAO.md antes de alterar estruturas.
// Verlet integration, gravity, rigid distance constraints and floor collisions.
export /* Simula gravidade e articulações usando integração Verlet. */
function criarCorpoFisico() {
  const rest = [
    [0, 1.48, 0],
    [0, 1.12, 0],
    [0, 0.85, 0],
    [-0.25, 1.34, 0],
    [-0.4, 1.05, 0],
    [-0.43, 0.81, 0],
    [0.25, 1.34, 0],
    [0.4, 1.05, 0],
    [0.43, 0.81, 0],
    [-0.12, 0.48, 0],
    [-0.12, 0.12, 0.06],
    [0.12, 0.48, 0],
    [0.12, 0.12, 0.06],
  ];
  const links = [
    [0, 1],
    [1, 2],
    [1, 3],
    [3, 4],
    [4, 5],
    [1, 6],
    [6, 7],
    [7, 8],
    [2, 9],
    [9, 10],
    [2, 11],
    [11, 12],
    [3, 6],
    [9, 11],
    [0, 3],
    [0, 6],
  ];
  const nodes = rest.map((p) => ({
    p: [...p],
    old: [...p],
  }));
  const constraints = links.map(([a, b]) => [
    a,
    b,
    Math.hypot(...rest[a].map((v, i) => v - rest[b][i])),
  ]);
  return {
    nodes,
    links,
    reset(origin = [0, 0, 0], velocity = [0, 0, 0]) {
      nodes.forEach((n, i) => {
        n.p = rest[i].map((v, k) => v + origin[k]);
        n.old = n.p.map(
          (v, k) =>
            v -
            (velocity[k] + (k === 0 ? (rest[i][1] - 1) * 1.2 : k === 2 ? rest[i][0] * 2 : 0)) / 120,
        );
      });
    },
    step(dt) {
      const steps = Math.max(1, Math.ceil(dt * 120)),
        h = dt / steps;
      for (let s = 0; s < steps; s++) {
        for (const n of nodes) {
          const before = [...n.p];
          n.p = n.p.map((v, k) => v + (v - n.old[k]) * 0.998 + (k === 1 ? -9.81 * h * h : 0));
          n.old = before;
        }
        for (let iteration = 0; iteration < 12; iteration++) {
          for (const [a, b, length] of constraints) {
            const x = nodes[a].p,
              y = nodes[b].p,
              d = x.map((v, k) => y[k] - v),
              l = Math.hypot(...d) || 1,
              f = ((l - length) / l) * 0.5;
            for (let k = 0; k < 3; k++) {
              x[k] += d[k] * f;
              y[k] -= d[k] * f;
            }
          }
          for (const n of nodes)
            if (n.p[1] < 0.09) {
              n.p[1] = 0.09;
              n.old[0] += (n.p[0] - n.old[0]) * 0.13;
              n.old[2] += (n.p[2] - n.old[2]) * 0.13;
            }
        }
      }
    },
  };
}
