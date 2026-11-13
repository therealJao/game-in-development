import { animacaoDeMalha } from "./animacao-modelos.js";
import * as T from "./vendor/three.module.js";
import { FBXLoader } from "./vendor/FBXLoader.js";
import { OBJLoader } from "./vendor/OBJLoader.js";
const pasta = new URL("assets/praia/", import.meta.url).href;
function textura(nome) {
  const t = new T.TextureLoader().load(pasta + nome);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
export async function carregarPersonagensPraia() {
  const [bob, alya, jonesy] = await Promise.all([
    new OBJLoader().loadAsync(pasta + "SpongebobDefault.obj"),
    new FBXLoader().loadAsync(pasta + "alya.fbx"),
    new FBXLoader().loadAsync(pasta + "jonesy.fbx"),
  ]);
  const mapas = Object.fromEntries(
    [
      "SpongeSkin_0.png",
      "Face.png",
      "Clothes.png",
      "Hair.png",
      "M_Med_Soldier_Body_01_C.tga.png",
      "M_Med_Soldier_Head_01_C.tga.png",
      "M_SML_Survivor_Hair_02_d.tga.png",
    ].map((n) => [n, textura(n)]),
  );
  function preparar(modelo, nome, altura) {
    modelo.traverse((o) => {
      if (!o.isMesh) return;
      // O FBX de Jonesy inclui também a malha de referência sem pele: escondê-la evita duplicação.
      if (nome === "Jonesy" && !o.isSkinnedMesh) {
        o.visible = false;
        return;
      }
      o.material = (Array.isArray(o.material) ? o.material : [o.material]).map(
        (m) => {
          let arquivo = "SpongeSkin_0.png";
          if (nome === "Alya Kujou")
            arquivo = /hair/i.test(m.name)
              ? "Hair.png"
              : /face/i.test(m.name)
                ? "Face.png"
                : "Clothes.png";
          if (nome === "Jonesy") {
            const id = Number(o.name.match(/Material(\d+)/)?.[1] || 1);
            arquivo =
              id === 11 || id === 13
                ? "M_Med_Soldier_Body_01_C.tga.png"
                : id === 9
                  ? "M_SML_Survivor_Hair_02_d.tga.png"
                  : "M_Med_Soldier_Head_01_C.tga.png";
          }
          return new T.MeshStandardMaterial({
            map: mapas[arquivo],
            color: "#ffffff",
            roughness: 0.75,
            side: T.DoubleSide,
            alphaTest: 0.35,
          });
        },
      );
      if (o.material.length === 1) o.material = o.material[0];
      o.castShadow = true;
      o.frustumCulled = false;
    });
    modelo.updateMatrixWorld(true);
    const box = new T.Box3();
    modelo.traverse((o) => {
      if (o.isMesh && o.visible) box.union(new T.Box3().setFromObject(o));
    });
    const centro = box.getCenter(new T.Vector3());
    const escala = altura / (box.max.y - box.min.y);
    const interno = new T.Group();
    interno.add(modelo);
    interno.scale.setScalar(escala);
    modelo.position.x -= centro.x;
    modelo.position.y -= box.min.y;
    modelo.position.z -= centro.z;
    const group = new T.Group();
    group.name = nome;
    group.add(interno);
    const bones = [];
    modelo.traverse((o) => {
      if (o.isBone) bones.push({ bone: o, rest: o.rotation.clone() });
    });
    const animarMalha = animacaoDeMalha(modelo);
    return {
      group,
      sentar(t) {
        for (const { bone, rest } of bones) {
          bone.rotation.copy(rest);
          if (/^(thigh[lr]|thigh_[lr])$/.test(bone.name))
            bone.rotation.x -= 1.35;
          if (/^(lowerleg[lr]|calf_[lr])$/.test(bone.name))
            bone.rotation.x += 1.35;
          if (/^(upperarm[lr]|upperarm_[lr])$/.test(bone.name)) {
            bone.rotation.z += (/l$/.test(bone.name) ? 1 : -1) * 0.65;
            bone.rotation.x -= 1.1 + Math.sin(t * 2) * 0.2;
          }
        }
      },
      animate(t, alegria = 0, golpe = 0) {
        animarMalha(t, Math.max(0.15, alegria + golpe));
        interno.rotation.z = Math.sin(t * 3) * 0.018;
        for (const { bone, rest } of bones) {
          bone.rotation.copy(rest);
          if (/^(upperarm[lr]|upperarm_[lr])$/.test(bone.name)) {
            const lado = /l$/.test(bone.name) ? 1 : -1;
            bone.rotation.z += lado * (0.68 - alegria * 0.7 - golpe * 0.8);
            bone.rotation.x += golpe * -0.7;
          }
          if (/^(thigh[lr]|thigh_[lr])$/.test(bone.name))
            bone.rotation.x += Math.sin(t * 5) * alegria * 0.16;
          if (bone.name === "head") bone.rotation.y += Math.sin(t * 1.6) * 0.08;
        }
      },
    };
  }
  return {
    bob: preparar(bob, "Bob Esponja", 1.55),
    alya: preparar(alya, "Alya Kujou", 1.78),
    jonesy: preparar(jonesy, "Jonesy", 1.95),
  };
}
