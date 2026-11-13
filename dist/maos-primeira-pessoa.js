import * as T from "./vendor/three.module.js";
import { FBXLoader } from "./vendor/FBXLoader.js";

export function primeiraPessoaAtiva(e) {
  const mode = e.mode === "paused" ? e.previousMode : e.mode;
  if (mode === "playing") return true;
  if (mode === "alisanave") return e.porto?.etapa === "labirinto";
  if (mode === "castelo")
    return ["salao", "escadaria"].includes(e.castelo?.etapa);
  if (mode === "aero")
    return [
      "pagamento",
      "preceiroLeitura",
      "kompraoLeitura",
      "compras",
      "portaEstranha",
      "shoppingExplorar",
      "cinemaFuga",
      "cinemaEscapar",
      "peppaExplorar",
      "level94Explorar",
      "level94Fuga",
      "casaExplorar",
      "casaTrailer",
      "casaPlantao",
      "casaNoticia",
      "casaLuto",
      "casaSaida",
      "portalExplorar",
      "retornoBiz",
      "telefoneBiz",
      "ligacaoBrita",
      "viagemBiz",
    ].includes(e.aero?.etapa);
  return false;
}

export async function carregarMaos() {
  const manager = new T.LoadingManager();
  manager.setURLModifier((url) =>
    /\.(png|jpg|jpeg)$/i.test(url) ? "assets/maos/arm1Color.png" : url,
  );
  const model = await new FBXLoader(manager).loadAsync("assets/maos/arms.fbx");
  // Cinema 4D's exported bind-pose matrices differ from the FBX reference pose.
  // Rebind at the first authored frame before scaling the shared view model.
  const mixer = model.animations.length ? new T.AnimationMixer(model) : null;
  if (mixer) {
    mixer.clipAction(model.animations[0]).play();
    mixer.setTime(0);
  }
  model.updateMatrixWorld(true);
  model.traverse((o) => {
    if (o.isSkinnedMesh) {
      o.normalizeSkinWeights();
      o.skeleton.calculateInverses();
      o.bind(o.skeleton);
      o.boundingBox = null;
    }
  });
  const box = new T.Box3().setFromObject(model),
    size = box.getSize(new T.Vector3()),
    center = box.getCenter(new T.Vector3());
  const scale = 0.94 / Math.max(size.x, size.y, size.z);
  const normalized = new T.Group();
  normalized.scale.setScalar(scale);
  normalized.rotation.y = Math.PI;
  model.position.sub(center);
  normalized.add(model);
  const group = new T.Group();
  group.name = "Bracos_FBX_laranja_Fanta";
  group.add(normalized);
  const bones = [];
  model.traverse((o) => {
    if (o.isMesh) {
      const old = Array.isArray(o.material) ? o.material : [o.material];
      const mats = old.map(
        () =>
          new T.MeshStandardMaterial({
            color: "#ff7909",
            roughness: 0.48,
            metalness: 0.04,
            side: T.DoubleSide,
            depthTest: true,
            depthWrite: true,
          }),
      );
      o.material = Array.isArray(o.material) ? mats : mats[0];
      o.frustumCulled = false;
    }
    if (o.isBone) bones.push({ bone: o, rest: o.rotation.clone() });
  });
  group.position.set(0, -0.34, -0.82);
  const lookup = new Map(bones.map(({ bone }) => [bone.name, bone]));
  const point = new T.Vector3(),
    origin = new T.Vector3(),
    current = new T.Vector3(),
    desired = new T.Vector3();
  const delta = new T.Quaternion(),
    world = new T.Quaternion(),
    parent = new T.Quaternion();
  function reach(wrist, joints, target) {
    for (let round = 0; round < 8; round++)
      for (const joint of joints) {
        group.updateWorldMatrix(true, true);
        wrist.getWorldPosition(point);
        joint.getWorldPosition(origin);
        current.copy(point).sub(origin).normalize();
        desired.copy(target).sub(origin).normalize();
        delta.setFromUnitVectors(current, desired);
        joint.getWorldQuaternion(world);
        joint.parent.getWorldQuaternion(parent).invert();
        joint.quaternion.copy(parent.multiply(delta).multiply(world));
      }
  }
  return {
    group,
    model,
    bones,
    segurarControle(controller) {
      group.updateWorldMatrix(true, true);
      controller.updateWorldMatrix(true, true);
      const center = controller.getWorldPosition(new T.Vector3()),
        orientation = controller.getWorldQuaternion(new T.Quaternion());
      for (const [prefix, side] of [
        ["L", -1],
        ["R", 1],
      ]) {
        const wrist = lookup.get(prefix + "_wrist"),
          elbow = lookup.get(prefix + "_elbow"),
          arm = lookup.get(prefix + "_arm");
        if (!wrist || !elbow || !arm) continue;
        const target = new T.Vector3(side * 0.3, -0.06, 0.05)
          .applyQuaternion(orientation)
          .add(center);
        const aim = new T.Vector3(side * 0.17, 0.015, -0.015)
          .applyQuaternion(orientation)
          .add(center);
        reach(wrist, [elbow, arm], target);
        group.updateWorldMatrix(true, true);
        const forward = new T.Vector3().subVectors(aim, target).normalize(),
          z = forward.clone().negate();
        const x = new T.Vector3(1, 0, 0).addScaledVector(z, -z.x).normalize(),
          y = new T.Vector3().crossVectors(z, x).normalize();
        const gripRotation = new T.Quaternion().setFromRotationMatrix(
          new T.Matrix4().makeBasis(x, y, z),
        );
        wrist.parent.getWorldQuaternion(parent).invert();
        wrist.quaternion.copy(parent.multiply(gripRotation));
        group.updateWorldMatrix(true, true);
        const palmNormal = x.clone().multiplyScalar(-side);
        for (const finger of ["point", "middle", "ring", "pink", "thumb"]) {
          const first = lookup.get(prefix + "_" + finger);
          if (!first) continue;
          const axis = new T.Vector3(0, 0, -1)
            .applyQuaternion(first.getWorldQuaternion(new T.Quaternion()))
            .cross(palmNormal)
            .normalize();
          for (const { bone } of bones) {
            if (!bone.name.startsWith(prefix + "_" + finger)) continue;
            const bend =
              finger === "thumb" ? 0.28 : bone === first ? 0.45 : 0.86;
            bone.getWorldQuaternion(world);
            bone.parent.getWorldQuaternion(parent).invert();
            delta.setFromAxisAngle(axis, bend);
            bone.quaternion.copy(parent.multiply(delta).multiply(world));
            group.updateWorldMatrix(true, true);
          }
        }
      }
    },
    animate(t, moving, running, interaction) {
      const speed = running ? 11 : 7,
        amount = moving ? 0.018 : 0.003;
      group.position.set(
        Math.sin(t * speed) * amount,
        -0.34 + Math.sin(t * speed * 2) * amount,
        -0.82 + interaction * 0.08,
      );
      group.rotation.set(
        0.12 + interaction * 0.15,
        Math.sin(t * 1.2) * 0.012,
        Math.sin(t * speed) * amount * 0.7,
      );
      for (const { bone, rest } of bones) {
        bone.rotation.copy(rest);
        if (/finger|thumb|point|middle|ring|pink/i.test(bone.name))
          bone.rotation.z += Math.sin(t * 1.5) * 0.006 + interaction * 0.025;
        if (/forearm|lowerarm|elbow/i.test(bone.name))
          bone.rotation.x += Math.sin(t * speed) * amount * 0.25;
      }
    },
  };
}
