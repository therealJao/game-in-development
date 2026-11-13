import { povoarCenario } from "./figurantes.js";
import {
  carregarSpritesVolei,
  desenharSpritesVolei,
  esconderSpritesVolei,
} from "./sprites-volei.js";
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  obterMaterial,
  criarAxel,
  criarTexturaTexto,
} from "./modelos.js";
import { criarNaverdachi } from "./modelos-frutiger-aero.js";
import { criarCeu } from "./efeitos-visuais.js";
import { carregarPersonagensPraia } from "./personagens-praia.js";

export async function criarPraiaVolei() {
  const scene = new T.Scene();
  scene.background = new T.Color("#7fcfff");
  scene.fog = new T.Fog("#a4dff3", 100, 340);
  scene.add(new T.HemisphereLight("#cfeeff", "#b59a6a", 1.15));
  // Sol forte de praia com sombras projetadas (contraste e profundidade).
  const sol = new T.DirectionalLight("#fff0cc", 5.2);
  sol.position.set(-25, 45, 22);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 120 });
  sol.shadow.bias = -0.0003;
  sol.shadow.normalBias = 0.03;
  scene.add(sol);
  const ceu = criarCeu(scene);
  const areia = obterMaterial("#dcc08a", 0.95),
    branco = obterMaterial("#f8ffff", 0.35),
    azul = obterMaterial("#43cde1", 0.2, 0.1),
    madeira = obterMaterial("#b6a482", 0.8);
  criarCaixa(scene, [200, 0.3, 120], areia, [0, -0.18, 35]);
  // Mar aberto atrás da quadra; borda e espuma contínuas, sem água atravessando a areia.
  const agua = new T.Mesh(
    new T.PlaneGeometry(700, 420, 120, 80),
    new T.ShaderMaterial({
      uniforms: { tempo: { value: 0 } },
      transparent: true,
      side: T.DoubleSide,
      vertexShader: `uniform float tempo;varying vec3 p;void main(){vec3 v=position;v.z=sin(v.x*.18+tempo)*.12+sin(v.y*.3-tempo*1.4)*.09;p=(modelMatrix*vec4(v,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
      fragmentShader:
        `uniform float tempo;varying vec3 p;void main(){vec3 n=normalize(vec3(-cos(p.x*.18+tempo)*.04,1.,-cos(p.z*.3-tempo*1.4)*.04));vec3 v=normalize(cameraPosition-p);float f=pow(1.-max(dot(n,v),0.),4.);float shine=pow(max(dot(reflect(-normalize(vec3(-.4,.8,.3)),n),v),0.),120.);float wave=sin(p.z*3.+sin(p.x*.15)*.6+tempo*1.8);float foam=smoothstep(.93,1.,wave)*exp(-max(0.,-p.z-27.)*.12);gl_FragColor=vec4(mix(vec3(.02,.65,.76),vec3(.26,.65,.95),f)+foam*.5+shine*.9,.97);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(
          ";#include",
          ";\n#include",
        ),
    }),
  );
  agua.rotation.x = -Math.PI / 2;
  agua.position.set(0, -0.15, -235);
  scene.add(agua);
  // Quadra de 18 x 8, câmera lateral e rede permeável à visão.
  for (const z of [-4, 4])
    criarCaixa(scene, [18, 0.025, 0.07], azul, [0, 0.02, z]);
  for (const x of [-9, 9])
    criarCaixa(scene, [0.07, 0.025, 8], azul, [x, 0.02, 0]);
  for (const z of [-4.3, 4.3]) {
    criarCilindro(scene, 0.075, 0.075, 3.1, branco, [0, 1.55, z]);
    criarCilindro(scene, 0.13, 0.13, 1.3, azul, [0, 0.65, z]);
  }
  const rede = new T.Group();
  scene.add(rede);
  const matRede = new T.LineBasicMaterial({
    color: "#f0ffff",
    transparent: true,
    opacity: 0.6,
  });
  const vertices = [];
  for (let z = -4.2; z <= 4.25; z += 0.25)
    vertices.push(0, 1.25, z, 0, 2.25, z);
  for (let y = 1.25; y <= 2.26; y += 0.2) vertices.push(0, y, -4.2, 0, y, 4.2);
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  rede.add(new T.LineSegments(geo, matRede));
  criarCaixa(rede, [0.045, 0.07, 8.5], branco, [0, 2.25, 0]);
  // Passarela, dunas, vegetação e orla remetem às três fotos enviadas.
  for (let i = 0; i < 38; i++)
    criarCaixa(scene, [3, 0.12, 0.45], madeira, [
      -24,
      0.12 + i * 0.012,
      4 + i * 0.5,
    ]);
  for (const x of [-25.5, -22.5]) {
    for (let i = 0; i < 10; i++)
      criarCaixa(scene, [0.08, 1, 0.08], madeira, [x, 0.55, 5 + i * 2]);
    criarCaixa(scene, [0.08, 0.08, 22], madeira, [x, 1, 15]);
  }
  const palmas = [];
  for (let i = 0; i < 14; i++) {
    const p = new T.Group();
    p.position.set(-34 + i * 5.2, 0, 23 + Math.sin(i) * 3);
    scene.add(p);
    criarCilindro(
      p,
      0.14,
      0.25,
      4.8,
      obterMaterial("#a18c62"),
      [0, 2.4, 0],
      [0, 0, 0.1],
    );
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * Math.PI * 2;
      criarElipsoide(
        p,
        [1.7, 0.11, 0.45],
        obterMaterial("#61b548"),
        [Math.cos(a), 4.8, Math.sin(a)],
        [0.1, a, 0.25],
      );
    }
    palmas.push(p);
    criarElipsoide(scene, [2.3, 0.35, 1.8], obterMaterial("#7cb856"), [
      -25 + i * 4,
      0.1,
      26,
    ]);
  }
  for (let i = 0; i < 14; i++) {
    const x = -65 + i * 9,
      h = 10 + (i % 4) * 4;
    criarCaixa(scene, [7, h, 7], branco, [x, h / 2, 59]);
    for (let y = 2; y < h; y += 2)
      for (let j = -2; j <= 2; j += 2)
        criarCaixa(
          scene,
          [1.2, 1.3, 0.05],
          obterMaterial("#58b5dc", 0.15, 0.2),
          [x + j, y, 55.45],
        );
    criarCilindro(scene, 0.06, 0.08, 6, branco, [x, 3, 39]);
    criarElipsoide(scene, [0.35, 0.12, 0.35], obterMaterial("#fff9d3"), [
      x,
      6,
      39,
    ]);
  }
  const navio = new T.Group();
  navio.position.set(-70, 0, -112);
  scene.add(navio);
  criarCaixa(navio, [49, 3, 8], obterMaterial("#345f79"), [0, 1, 0]);
  for (let i = 0; i < 13; i++)
    for (let j = 0; j < 2; j++)
      criarCaixa(
        navio,
        [3.5, 2, 6],
        obterMaterial(["#e7eff1", "#b34a4c", "#419caa"][i % 3]),
        [-21 + i * 3.4, 3.5 + j * 2, 0],
      );
  criarCaixa(navio, [5, 9, 6], branco, [19, 6, 0]);
  const bolhas = [];
  for (let i = 0; i < 24; i++)
    bolhas.push(
      criarElipsoide(
        scene,
        [0.3 + (i % 3) * 0.12, 0.3 + (i % 3) * 0.12, 0.3 + (i % 3) * 0.12],
        new T.MeshPhysicalMaterial({
          color: "#a6f4ff",
          transparent: true,
          opacity: 0.2,
          roughness: 0.05,
          metalness: 0.2,
          clearcoat: 1,
        }),
        [-30 + i * 2.7, 2 + (i % 5), -20 - Math.sin(i) * 3],
      ),
    );
  const visitantes = await carregarPersonagensPraia(),
    axel = criarAxel(),
    nav = criarNaverdachi();
  for (const p of [axel, nav, ...Object.values(visitantes)]) scene.add(p.group);
  visitantes.bob.group.position.set(-11, 0, -3);
  const bola = new T.Mesh(
    new T.SphereGeometry(0.22, 24, 16),
    new T.MeshPhysicalMaterial({
      color: "#f5fcff",
      roughness: 0.28,
      clearcoat: 1,
    }),
  );
  scene.add(bola);
  for (let i = 0; i < 3; i++) {
    const faixa = new T.Mesh(
      new T.TorusGeometry(0.222, 0.026, 6, 40),
      obterMaterial(i % 2 ? "#2eb7d2" : "#f6d54b"),
    );
    faixa.rotation.set(i === 0 ? Math.PI / 2 : 0, i === 1 ? Math.PI / 2 : 0, 0);
    bola.add(faixa);
  }
  const sombra = new T.Mesh(
    new T.CircleGeometry(0.32, 24),
    new T.MeshBasicMaterial({
      color: "#457780",
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    }),
  );
  sombra.rotation.x = -Math.PI / 2;
  scene.add(sombra);
  const alvo = new T.Mesh(
    new T.RingGeometry(0.42, 0.5, 40),
    new T.MeshBasicMaterial({
      color: "#16bccb",
      transparent: true,
      opacity: 0.7,
      side: T.DoubleSide,
    }),
  );
  alvo.rotation.x = -Math.PI / 2;
  scene.add(alvo);
  const placa = new T.Mesh(
    new T.PlaneGeometry(7, 1.4),
    new T.MeshBasicMaterial({
      map: criarTexturaTexto(
        "PONTAL • AERO BEACH",
        "#e7fcff",
        "#087eaa",
        1024,
        256,
      ),
    }),
  );
  placa.position.set(-14, 3, -10);
  scene.add(placa);
  return {
    figurantes: povoarCenario(scene, "praia"),
    scene,
    agua,
    axel,
    nav,
    ...visitantes,
    bola,
    sombra,
    alvo,
    bolhas,
    palmas,
  };
}
export function desenharPraiaVolei(view, c, f) {
  // Full 3D match: same rules and controls, with the imported character meshes.
  esconderSpritesVolei();
  c.figurantes.update(f.animacao, view.qualidadeAtual, view.figurantesAtivos);
  for (const p of [c.axel, c.nav, c.bob, c.alya, c.jonesy]) {
    if (p.group.parent !== c.scene) c.scene.add(p.group);
    p.group.scale.setScalar(1);
    p.group.rotation.set(0, 0, 0);
    p.group.visible = true;
  }
  c.bola.visible = true;
  const t = f.animacao,
    v = f.volei,
    intro = f.etapa === "praiaChegada";
  c.agua.material.uniforms.tempo.value = t;
  c.bolhas.forEach((b) => (b.visible = false));
  const lista = [
    [c.axel, v.axel, -1.5],
    [c.nav, v.nav, 1.5],
    [c.alya, v.alya, 1.5],
    [c.jonesy, v.jonesy, -1.5],
  ];
  for (const [p, s, z] of lista) {
    p.group.position.set(
      s.x,
      intro ? Math.abs(Math.sin(t * 2 + s.x)) * 0.12 : s.y,
      z,
    );
    p.group.rotation.y = s.x < 0 ? 1.1 : -1.1;
    // Velocidade real de cada jogador (pela posição entre quadros) move pernas e braços.
    const ant = (c.posAnterior ??= new Map()).get(p) ?? { x: s.x, t };
    const dtq = Math.max(1 / 120, t - ant.t),
      vel = intro ? 3 : Math.abs(s.x - ant.x) / dtq;
    c.posAnterior.set(p, { x: s.x, t });
    const noAr = !intro && s.y > 0.08;
    if (p === c.axel) p.animate?.(t, intro ? 2 : Math.max(vel, Math.abs(s.vy || 0)));
    else if (p === c.nav) {
      p.head.rotation.y = Math.sin(t) * 0.1;
      p.arms?.forEach(
        (a, i) => (a.rotation.x = -0.3 - Math.sin(t * 2 + i) * 0.15 - s.golpe),
      );
    } else
      p.animate(t, intro || f.etapa === "voleiVitoria" ? 1 : 0.1, s.golpe * 2, {
        vel,
        noAr,
        olharX: Math.sign(v.bola.x - s.x) * 0.5,
      });
  }
  c.bob.animate(t, 1);
  c.bob.group.position.y = Math.abs(Math.sin(t * 2)) * 0.15;
  c.bob.group.rotation.y = 0.3;
  c.bola.position.set(v.bola.x, intro ? 2 + Math.sin(t * 2) : v.bola.y, 0);
  c.bola.rotation.set(t * 0.5, 0, v.bola.giro);
  c.sombra.position.set(v.bola.x, 0.025, 0);
  c.sombra.scale.setScalar(1 + v.bola.y * 0.15);
  c.alvo.visible = !intro && v.bola.vx < 0 && v.fase === "rally";
  const dur =
    (v.bola.vy +
      Math.sqrt(v.bola.vy ** 2 + 12.8 * Math.max(0, v.bola.y - 0.22))) /
    6.4;
  c.alvo.position.set(
    Math.max(-9, Math.min(9, v.bola.x + v.bola.vx * dur)),
    0.03,
    0,
  );
  const camera = view.camera;
  if (intro) {
    const a = Math.min(1, f.tempo / 8);
    camera.position.set(-16 + a * 11, 7 - a * 2, 24 - a * 9);
    camera.lookAt(-1, 1, -1);
  } else {
    // Câmera de transmissão: mais perto, baixa e acompanhando a bola suavemente.
    c.camX = T.MathUtils.lerp(c.camX ?? 0, T.MathUtils.clamp(v.bola.x * 0.45, -4.5, 4.5), 0.06);
    camera.position.set(c.camX, 3.4, 12.5);
    camera.lookAt(c.camX * 0.9, 1.25, -0.5);
  }
  camera.fov = intro ? 48 : 44;
  camera.near = 0.1;
  camera.far = 700;
  camera.updateProjectionMatrix();
  view.renderer.toneMappingExposure = 0.92;
  view.renderer.render(c.scene, camera);
}
