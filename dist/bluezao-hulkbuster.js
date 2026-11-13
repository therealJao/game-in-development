// Modelo FBX fornecido pelo usuário, com materiais PBR reconstruídos para WebGL.
import * as T from "./vendor/three.module.js";
import { FBXLoader } from "./vendor/FBXLoader.js";
export async function carregarHulkbuster() {
  const manager = new T.LoadingManager();
  manager.setURLModifier((url) => {
    const nome = decodeURIComponent(url.split(/[\\/]/).pop());
    return /\.(jpg|png)$/i.test(nome)
      ? new URL(
          "assets/hulkbuster/tex/" + encodeURIComponent(nome),
          import.meta.url,
        ).href
      : url;
  });
  const modelo = await new FBXLoader(manager).loadAsync(
    new URL("assets/hulkbuster/hulkbuster.fbx", import.meta.url).href,
  );
  const texturas = new T.TextureLoader(),
    desgaste = texturas.load(
      new URL("assets/hulkbuster/tex/Torso%20Edge%20Wear.jpg", import.meta.url)
        .href,
    ),
    padrao = texturas.load(
      new URL("assets/hulkbuster/tex/Mesh%20Pattern.jpg", import.meta.url).href,
    );
  const materiais = new Map();
  modelo.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    o.material = (Array.isArray(o.material) ? o.material : [o.material]).map(
      (m) => {
        if (materiais.has(m.name)) return materiais.get(m.name);
        const n = m.name,
          ouro = /#118|Slot #6|Slot #8|#32/.test(n),
          escuro = /#119|Slot #9|Slot #10/.test(n),
          material = new T.MeshStandardMaterial({
            name: n + "_PBR",
            color: escuro ? "#242c35" : ouro ? "#c69545" : "#962b2e",
            metalness: escuro ? 0.65 : 0.82,
            roughness: ouro ? 0.3 : 0.37,
            roughnessMap: desgaste,
            bumpMap: padrao,
            bumpScale: 0.008,
          });
        materiais.set(n, material);
        return material;
      },
    );
    if (o.material.length === 1) o.material = o.material[0];
  });
  const mixer = new T.AnimationMixer(modelo);
  if (modelo.animations[0]) {
    mixer.clipAction(modelo.animations[0]).play();
    mixer.setTime(0.1);
  }
  modelo.updateMatrixWorld(true);
  const caixa = new T.Box3().setFromObject(modelo),
    tamanho = caixa.getSize(new T.Vector3()),
    centro = caixa.getCenter(new T.Vector3()),
    escala = 8 / tamanho.y;
  const grupo = new T.Group();
  grupo.name = "Bluezao_Hulkbuster_FBX_fornecido";
  grupo.add(modelo);
  modelo.scale.multiplyScalar(escala);
  modelo.position.set(
    -centro.x * escala,
    -caixa.min.y * escala,
    -centro.z * escala,
  );
  const foto = new T.TextureLoader().load(
    new URL("assets/bluezao.png", import.meta.url).href,
  );
  foto.colorSpace = T.SRGBColorSpace;
  const holograma = new T.Mesh(
    new T.CircleGeometry(0.57, 40),
    new T.MeshBasicMaterial({ map: foto, transparent: true, opacity: 0.88 }),
  );
  holograma.position.set(0, 4.6, 1.5);
  grupo.add(holograma);
  const luz = new T.PointLight("#6bdfff", 28, 12, 2);
  luz.position.set(0, 4.5, 2);
  grupo.add(luz);
  return {
    grupo,
    modelo,
    mixer,
    holograma,
    luz,
    duracao: modelo.animations[0]?.duration || 3.333,
  };
}
