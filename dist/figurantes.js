import { criarHumano } from "./humanos.js";
// Authored routes remain outside playable furniture, the court and horror scenes.
export function povoarCenario(scene, tipo) {
  const routes =
    {
      praia: [
        [-28, 12, -18, 12],
        [18, 16, 30, 16],
        [-12, 23, 8, 23],
        [26, 28, 38, 28],
        [-35, 34, -22, 34],
        [2, 31, 15, 31],
      ],
      ponto: [
        [-1.7, 0.5, -1.7, 3.7],
        [0.1, -1.7, 0.1, 1.7],
      ],
      mercado: [
        [-10, -8, -10, 8],
        [10, -8, 10, 8],
        [-8, 12, -3, 12],
        [5, 12, 9, 12],
      ],
    }[tipo] || [];
  const people = routes.map((route, i) => {
    const person = criarHumano({
      camisa: ["#477f89", "#b67853", "#9b9f68", "#645779"][i % 4],
      pele: ["#bf8966", "#8d5d42", "#d9ad88"][i % 3],
    });
    person.group.name = "Figurante_" + tipo + "_" + i;
    scene.add(person.group);
    return { person, route, phase: i * 2.3 };
  });
  return {
    update(t, quality = "high", visible = true) {
      people.forEach(({ person: p, route: r, phase }, i) => {
        p.group.visible = visible && (quality !== "low" || i < 2);
        if (!p.group.visible) return;
        const cycle = (t * 0.055 + phase) % 2,
          u = cycle < 1 ? cycle : 2 - cycle;
        p.group.position.set(
          r[0] + (r[2] - r[0]) * u,
          0,
          r[1] + (r[3] - r[1]) * u,
        );
        p.group.rotation.y =
          Math.atan2(r[2] - r[0], r[3] - r[1]) + (cycle < 1 ? 0 : Math.PI);
        p.animate(t + phase, 1.1);
      });
    },
  };
}
