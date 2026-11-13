import * as T from "./vendor/three.module.js";
/** Articulates supplied static meshes on the GPU; skinned models keep their rig. */
export function animacaoDeMalha(root) {
  const clock = { value: 0 },
    movement = { value: 0 };
  root.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh) return;
    o.geometry.computeBoundingBox();
    const box = o.geometry.boundingBox,
      size = box.getSize(new T.Vector3());
    if (size.y <= 0) return;
    const mats = (Array.isArray(o.material) ? o.material : [o.material]).map(
      (m) => {
        const copy = m.clone();
        copy.onBeforeCompile = (shader) => {
          Object.assign(shader.uniforms, {
            actorTime: clock,
            actorMotion: movement,
            actorMin: { value: box.min.clone() },
            actorSize: { value: size.clone() },
          });
          shader.vertexShader =
            "uniform float actorTime; uniform float actorMotion; uniform vec3 actorMin; uniform vec3 actorSize;\n" +
            shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
          vec3 ap=(position-actorMin)/actorSize;
          float side=ap.x<0.5?-1.0:1.0;
          float arm=smoothstep(0.60,0.87,abs(ap.x-0.5)*2.0)*(1.0-smoothstep(0.85,0.94,ap.y))*smoothstep(0.30,0.55,ap.y);
          float leg=(1.0-smoothstep(0.22,0.48,ap.y));
          transformed.z += sin(actorTime*5.0+side*1.57)*actorSize.y*(arm*0.018+leg*0.022)*actorMotion;
          transformed.y += arm*sin(actorTime*2.0+side)*actorSize.y*0.007;
          transformed.x += smoothstep(0.75,1.0,ap.y)*sin(actorTime*0.9)*actorSize.x*0.012;
        `,
          );
        };
        copy.customProgramCacheKey = () => "actor-articulation-225";
        return copy;
      },
    );
    o.material = Array.isArray(o.material) ? mats : mats[0];
  });
  return (time, motion = 0.2) => {
    clock.value = time;
    movement.value = motion;
  };
}
