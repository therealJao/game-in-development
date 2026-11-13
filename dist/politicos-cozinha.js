// Malhas FBX reais fornecidas para a cozinha. Lula recebe articulação local porque o FBX não contém ossos.
import * as T from "./vendor/three.module.js";
import { FBXLoader } from "./vendor/FBXLoader.js";
const v = new T.Vector3(),
  q = new T.Quaternion();
function materialFoto(pasta, nome) {
  const tex = new T.TextureLoader().load(
    new URL(`assets/politicos/${pasta}/${nome}`, import.meta.url).href,
  );
  tex.colorSpace = T.SRGBColorSpace;
  return new T.MeshStandardMaterial({
    map: tex,
    color: "#ffffff",
    roughness: 0.8,
    metalness: 0,
    side: T.DoubleSide,
  });
}
function autoRigLula(modelo) {
  modelo.updateMatrixWorld(true);
  const caixa = new T.Box3().setFromObject(modelo),
    centro = caixa.getCenter(new T.Vector3()),
    s = 1.8 / (caixa.max.y - caixa.min.y);
  const transform = new T.Matrix4()
    .makeRotationY(Math.PI)
    .multiply(new T.Matrix4().makeScale(s, s, s))
    .multiply(
      new T.Matrix4().makeTranslation(-centro.x, -caixa.min.y, -centro.z),
    );
  let original;
  modelo.traverse((o) => {
    if (o.isMesh) original = o;
  });
  const geo = original.geometry
    .clone()
    .applyMatrix4(original.matrixWorld)
    .applyMatrix4(transform);
  const root = new T.Bone();
  root.name = "Lula_Quadril";
  root.position.set(0, 0.95, 0);
  const bones = [root];
  const add = (nome, parent, pos) => {
    const b = new T.Bone();
    b.name = nome;
    b.position.set(...pos);
    parent.add(b);
    bones.push(b);
    return b;
  };
  const coluna = add("Coluna", root, [0, 0.28, 0]);
  const cabeca = add("Cabeca", coluna, [0, 0.35, 0]);
  const bracos = [];
  const pernas = [];
  for (const lado of [-1, 1]) {
    const a = add("Braco" + lado, coluna, [lado * 0.22, 0.21, 0]);
    const e = add("Cotovelo" + lado, a, [lado * 0.18, -0.34, 0]);
    const h = add("Mao" + lado, e, [lado * 0.15, -0.23, 0]);
    bracos.push({ upper: a, fore: e, hand: h, lado });
    const l = add("Coxa" + lado, root, [lado * 0.13, -0.07, 0]);
    const j = add("Joelho" + lado, l, [0, -0.42, 0]);
    const foot = add("Pe" + lado, j, [0, -0.42, 0.04]);
    pernas.push({ l, j, foot });
  }
  const indices = [],
    pesos = [];
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const x = Math.abs(v.x),
      lado = v.x < 0 ? 0 : 1;
    let b = root,
      b2 = root,
      w = 1;
    if (v.y > 1.51) {
      b = cabeca;
      b2 = coluna;
      w = T.MathUtils.smoothstep(v.y, 1.49, 1.56);
    } else if (x > 0.22 && v.y > 0.72) {
      const a = bracos[lado];
      b = x > 0.43 ? a.fore : a.upper;
      b2 = x > 0.43 ? a.upper : coluna;
      w = T.MathUtils.smoothstep(
        x,
        x > 0.43 ? 0.4 : 0.2,
        x > 0.43 ? 0.48 : 0.3,
      );
    } else if (v.y > 0.97) {
      b = coluna;
      b2 = root;
      w = T.MathUtils.smoothstep(v.y, 0.94, 1.12);
    } else if (v.y < 0.9) {
      const l = pernas[lado];
      b = v.y < 0.45 ? l.j : l.l;
      b2 = v.y < 0.45 ? l.l : root;
      w =
        v.y < 0.45
          ? 1 - T.MathUtils.smoothstep(v.y, 0.39, 0.49)
          : 1 - T.MathUtils.smoothstep(v.y, 0.81, 0.94);
    }
    indices.push(bones.indexOf(b), bones.indexOf(b2), 0, 0);
    pesos.push(w, 1 - w, 0, 0);
  }
  geo.setAttribute("skinIndex", new T.Uint16BufferAttribute(indices, 4));
  geo.setAttribute("skinWeight", new T.Float32BufferAttribute(pesos, 4));
  const mapas = [
    "jbib_diff_010_b_uni.png",
    "accs_diff_001_h_uni.png",
    "feet_diff_008_e_uni.png",
    "uppr_diff_000_a_whi.png",
    "accs_diff_001_h_uni.png",
    "teef_diff_001_e_uni.png",
    "head_diff_042_a_whi.png",
    "lowr_diff_008_b_whi.png",
  ];
  const mesh = new T.SkinnedMesh(
    geo,
    mapas.map((n) => materialFoto("lula", n)),
  );
  mesh.name = "Lula_FBX_original_articulado";
  mesh.add(root);
  mesh.updateMatrixWorld(true);
  mesh.bind(new T.Skeleton(bones));
  mesh.frustumCulled = false;
  mesh.castShadow = mesh.receiveShadow = true;
  const grupo = new T.Group();
  grupo.add(mesh);
  return { grupo, modelo: mesh, bracos, cabeca, pernas, bones };
}
function aim(bone, child, target) {
  const origem = bone.getWorldPosition(new T.Vector3()),
    atual = child.getWorldPosition(new T.Vector3()).sub(origem).normalize(),
    destino = target.clone().sub(origem).normalize();
  if (atual.lengthSq() < 0.1 || destino.lengthSq() < 0.1) return;
  const world = bone.getWorldQuaternion(new T.Quaternion());
  q.setFromUnitVectors(atual, destino);
  world.premultiply(q);
  const parent = bone.parent.getWorldQuaternion(new T.Quaternion()).invert();
  bone.quaternion.copy(parent.multiply(world));
  bone.updateWorldMatrix(false, true);
}
export async function carregarPoliticoCozinha(pessoa) {
  const manager = new T.LoadingManager();
  manager.setURLModifier((url) =>
    /\.(png|jpg)$/i.test(url)
      ? new URL(
          `assets/politicos/${pessoa}/` +
            encodeURIComponent(decodeURIComponent(url.split(/[\\/]/).pop())),
          import.meta.url,
        ).href
      : url,
  );
  const modelo = await new FBXLoader(manager).loadAsync(
    new URL(`assets/politicos/${pessoa}/modelo.fbx`, import.meta.url).href,
  );
  let r;
  if (pessoa === "lula") r = autoRigLula(modelo);
  else {
    const grupo = new T.Group();
    grupo.add(modelo);
    modelo.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(modelo),
      center = box.getCenter(new T.Vector3()),
      escala = 1.82 / (box.max.y - box.min.y);
    modelo.scale.multiplyScalar(escala);
    modelo.position.set(
      -center.x * escala,
      -box.min.y * escala,
      -center.z * escala,
    );
    modelo.traverse((o) => {
      if (o.isMesh) {
        const n = o.name;
        o.material = materialFoto(
          pessoa,
          /ROSTO/.test(n)
            ? "BOLSONARO ROSTO.png"
            : /GRAVATA/.test(n)
              ? "Gravata.png"
              : /MAOS/.test(n)
                ? "Maos.png"
                : "Roupa.png",
        );
        o.castShadow = o.receiveShadow = true;
        o.frustumCulled = false;
      }
    });
    const bones = [];
    modelo.traverse((o) => {
      if (o.isBone && o.position.lengthSq() > 0.000001) bones.push(o);
    });
    const find = (n) => bones.find((b) => b.name === n);
    const bracos = ["Left", "Right"].map((l, i) => ({
      upper: find("mixamorig" + l + "Arm"),
      fore: find("mixamorig" + l + "ForeArm"),
      hand: find("mixamorig" + l + "Hand"),
      lado: i ? -1 : 1,
    }));
    r = { grupo, modelo, bones, bracos, cabeca: find("mixamorigHead") };
  }
  r.grupo.name = pessoa + "_modelo_fornecido";
  r.rest = r.bones.map((b) => ({ b, q: b.quaternion.clone() }));
  return r;
}
export function animarPoliticoCozinha(r, t, indice) {
  for (const { b, q } of r.rest) b.quaternion.copy(q);
  const ciclo = (t + indice * 1.8) % 5.4,
    soco =
      ciclo > 1 && ciclo < 1.65 ? Math.sin(((ciclo - 1) / 0.65) * Math.PI) : 0,
    reacao = Math.max(0, Math.sin((t + indice * 2) * 2.3)) * 0.07;
  const cicloOutro = (t + (1 - indice) * 1.8) % 5.4;
  const impacto =
    cicloOutro > 1.2 && cicloOutro < 1.9
      ? Math.sin(((cicloOutro - 1.2) / 0.7) * Math.PI)
      : 0;
  r.grupo.rotation.x = reacao * 0.4 - impacto * 0.16;
  r.grupo.translateZ(soco * 0.16 - impacto * 0.12);
  r.grupo.position.y = Math.abs(Math.sin(t * 3.3 + indice)) * 0.018;
  if (r.cabeca) {
    r.cabeca.rotation.x += Math.sin(t * 7 + indice) * 0.05 - impacto * 0.12;
    r.cabeca.rotation.y += Math.sin(t * 3 + indice) * 0.12;
  }
  r.grupo.updateWorldMatrix(true, true);
  for (const a of r.bracos) {
    if (!a.upper || !a.fore || !a.hand) continue;
    const punho = r.grupo.localToWorld(
      new T.Vector3(
        a.lado * 0.24,
        1.36,
        0.35 + (a.lado === 1 ? soco * 0.55 : 0),
      ),
    );
    const cotovelo = r.grupo.localToWorld(
      new T.Vector3(a.lado * 0.4, 1.13, 0.12),
    );
    aim(a.upper, a.fore, cotovelo);
    aim(a.fore, a.hand, punho);
  }
}
export function animarPoliticoCalmo(r, t, entregar = false) {
  for (const { b, q } of r.rest) b.quaternion.copy(q);
  r.grupo.rotation.x = 0;
  r.grupo.position.y = Math.sin(t * 1.8) * 0.007;
  if (r.cabeca) {
    r.cabeca.rotation.x += Math.sin(t * 2) * 0.015;
    r.cabeca.rotation.y += Math.sin(t * 0.8) * 0.025;
  }
  r.grupo.updateWorldMatrix(true, true);
  for (const a of r.bracos) {
    if (!a.upper || !a.fore || !a.hand) continue;
    const dar = entregar && a.lado === 1;
    const elbow = r.grupo.localToWorld(
      new T.Vector3(a.lado * 0.31, dar ? 1.14 : 1.05, dar ? 0.3 : 0.02),
    );
    const hand = r.grupo.localToWorld(
      new T.Vector3(a.lado * 0.25, dar ? 1.45 : 0.9, dar ? 0.66 : 0.12),
    );
    aim(a.upper, a.fore, elbow);
    aim(a.fore, a.hand, hand);
  }
}
