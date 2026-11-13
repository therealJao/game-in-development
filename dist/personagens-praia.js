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
      /**
       * Animação procedural pelo esqueleto: corrida pela velocidade real, pulo, cortada,
       * respiração, troca de peso, olhar e balanço do cabelo.
       * mov = { vel: m/s horizontal, noAr: boolean, olharX: alvo lateral }
       */
      animate(t, alegria = 0, golpe = 0, mov = {}) {
        animarMalha(t, 0);
        const vel = Math.min(1, Math.abs(mov.vel || 0) / 4),
          noAr = mov.noAr ? 1 : 0,
          fase = t * (8 + vel * 5),
          passo = Math.sin(fase) * vel * (1 - noAr),
          joelho = (s) => Math.max(0, Math.sin(fase + (s > 0 ? 0 : Math.PI) + Math.PI / 2)) * vel * (1 - noAr),
          respira = Math.sin(t * 2.2);
        interno.rotation.z = Math.sin(t * 1.1) * 0.012 * (1 - vel);
        interno.position.y = Math.abs(Math.sin(fase)) * 0.05 * vel;
        for (const { bone, rest } of bones) {
          bone.rotation.copy(rest);
          const n = bone.name,
            lado = /(l|_l)$/.test(n) ? 1 : -1;
          if (/^(upperarm[lr]|upperarm_[lr])$/.test(n)) {
            // Braços relaxados ao lado do corpo; balançam opostos às pernas; sobem no pulo/cortada.
            bone.rotation.z += lado * (0.68 - alegria * 0.35 - noAr * 0.9 - golpe * 1.1);
            bone.rotation.x += -passo * 0.7 * lado + golpe * -1.2 + Math.sin(t * 1.3 + lado) * 0.04;
          } else if (/^(lowerarm[lr]|lowerarm_[lr])$/.test(n)) {
            bone.rotation.x -= 0.25 + vel * 0.6 + noAr * 0.3;
          } else if (/^(thigh[lr]|thigh_[lr])$/.test(n)) {
            bone.rotation.x += passo * 0.75 * lado - noAr * 0.55 + Math.sin(t * 0.7) * 0.03 * lado * (1 - vel);
          } else if (/^(lowerleg[lr]|calf_[lr])$/.test(n)) {
            bone.rotation.x += joelho(lado) * 1.1 + noAr * 0.9 + 0.05;
          } else if (/^(foot[lr]|foot_[lr])$/.test(n)) {
            bone.rotation.x -= joelho(lado) * 0.4;
          } else if (/^(stomach|spine_02)$/.test(n)) {
            bone.rotation.x += 0.12 * vel + respira * 0.015 - golpe * 0.2;
          } else if (/^(chest|spine_04)$/.test(n)) {
            bone.rotation.x += respira * 0.02;
            bone.rotation.y += passo * 0.12;
          } else if (n === "head") {
            bone.rotation.y += Math.sin(t * 0.9) * 0.12 + (mov.olharX || 0) * 0.3;
            bone.rotation.x += -noAr * 0.15 + Math.sin(t * 1.7) * 0.03;
          } else if (/^Hair|^skirt|^bow/i.test(n)) {
            // Cabelo, saia e laços acompanham o movimento com atraso.
            const k = /\d{3}/.test(n) ? 1.6 : 1;
            bone.rotation.x += (Math.sin(t * 3.1 - k) * 0.05 + vel * 0.25 * k * 0.4 - noAr * 0.2) * k;
            bone.rotation.z += Math.sin(t * 2.3 + k) * 0.04 * k;
          }
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
