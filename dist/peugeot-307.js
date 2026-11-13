import * as T from "./vendor/three.module.js";
import { criarVisitante } from "./personagens-castelo.js";
import { criarCaixa, criarTexturaTexto } from "./modelos.js";
export async function carregarPeugeot() {
  const [meta, buffer] = await Promise.all([
    fetch(new URL("assets/peugeot/modelo.json", import.meta.url)).then((r) =>
      r.json(),
    ),
    fetch(new URL("assets/peugeot/modelo.bin", import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
  ]);
  const grupo = new T.Group();
  grupo.name = "Peugeot_307_2008_modelo_fornecido";
  const loader = new T.TextureLoader();
  const mapas = {
    Carro_Freio: "Carro_Freio.png",
    Carro_Freio_Disco: "Carro_Freio_Disco.jpeg",
    Carro_Pneu: "Carro_Pneu.jpeg",
    Carro_Refletor_Farol: "Carro_Refletor_Farol.png",
    Carro_Refletor_Lanterna: "Carro_Refletor_Lanterna.png",
  };
  for (const m of meta.meshes) {
    const geo = new T.BufferGeometry();
    for (const [key, a] of Object.entries(m.attrs))
      geo.setAttribute(
        key,
        new T.BufferAttribute(
          new Float32Array(buffer, a.offset, a.count),
          a.itemSize,
        ),
      );
    const n = m.name,
      vidro = /Vidros|Vidro_Laranja/.test(n),
      pintura = /Pintura/.test(n),
      cromo = /Cromado|Roda|Metal_Farol/.test(n),
      lanterna = /Vermelho|Lanterna/.test(n);
    const material = new T.MeshPhysicalMaterial({
      name: n,
      color: pintura
        ? "#e8eeee"
        : vidro
          ? "#a8d2dd"
          : lanterna
            ? "#aa3038"
            : cromo
              ? "#aab8c2"
              : "#282e33",
      roughness: pintura ? 0.24 : cromo ? 0.28 : vidro ? 0.05 : 0.8,
      metalness: pintura ? 0.45 : cromo ? 0.8 : 0,
      transparent: vidro,
      opacity: vidro ? 0.18 : 1,
      depthWrite: !vidro,
      side: T.DoubleSide,
      clearcoat: pintura ? 1 : 0,
    });
    if (mapas[n]) {
      const tex = loader.load(
        new URL("assets/peugeot/" + mapas[n], import.meta.url).href,
      );
      tex.colorSpace = T.SRGBColorSpace;
      material.map = tex;
      material.color.set("#ffffff");
    }
    const mesh = new T.Mesh(geo, material);
    mesh.name = n;
    mesh.castShadow = !vidro;
    mesh.receiveShadow = true;
    grupo.add(mesh);
  }
  const bruno = criarVisitante({
    arquivo: "assets/bruno-henrique.png",
    recorte: [152, 26, 226, 300, 500, 500],
    camisa: "#18191c",
    cabelo: "#171313",
    pele: "#885b42",
  });
  for (const y of [1.12, 1.27, 1.42])
    criarCaixa(
      bruno.body,
      [0.4, 0.07, 0.035],
      new T.MeshStandardMaterial({ color: "#c8323f", roughness: 0.8 }),
      [0, y, 0.135],
    );
  criarCaixa(
    bruno.body,
    [0.08, 0.09, 0.04],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto("CRF", "#c8323f", "#ffffff", 128, 128),
    }),
    [-0.1, 1.47, 0.16],
  );
  bruno.group.position.set(0.4, -0.38, 0.05);
  bruno.group.rotation.y = 0;
  bruno.group.scale.setScalar(0.88);
  bruno.legs.forEach((l) => (l.rotation.x = -1.3));
  bruno.joelhos.forEach((j) => (j.rotation.x = 1.3));
  bruno.arms.forEach((a) => (a.rotation.x = -1.05));
  grupo.add(bruno.group);
  return { grupo, bruno };
}
