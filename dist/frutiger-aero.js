import { ETAPAS_ARCOPLEX } from "./regras-arcoplex.js";
import { desenharArcoplex } from "./arcoplex.js";
import { ETAPAS_LUA } from "./regras-lua.js";
import { desenharCenasLua } from "./lua-mercados.js";
import { desenharPraiaVolei } from "./praia-volei.js";
import { desenharEstradaPraia } from "./estrada-praia.js";
import { desenharComemoracao } from "./ponto-kente.js";
// Cidade aquática e Neo Química Arena em tempo real. Sem sequência de imagens.
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarElipsoide,
  criarCilindro,
  criarMalha,
  criarTubo,
  obterMaterial,
  criarAxel,
} from "./modelos.js";
import { criarCeu } from "./efeitos-visuais.js";
import { criarAguaAero, criarMaterialCausticas } from "./agua-frutiger-aero.js";
import { criarCidadeAeroShore } from "./cidade-aeroshore.js";
import {
  criarArenaAquatica,
  criarNaverdachi,
  criarBolaBluezao,
} from "./modelos-frutiger-aero.js";

function criarPeixe(cor, indice) {
  const g = new T.Group(),
    m = obterMaterial(cor, 0.34, 0.12),
    preto = obterMaterial("#112b38", 0.3),
    branco = obterMaterial("#f1faf5", 0.35);
  criarElipsoide(g, [0.55, 0.23, 0.15], m, [0, 0, 0]);
  const cauda = new T.Group();
  g.add(cauda);
  cauda.position.x = -0.5;
  criarMalha(
    cauda,
    new T.ConeGeometry(0.23, 0.35, 3),
    m,
    [-0.13, 0, 0],
    [0, 0, -Math.PI / 2],
    [1, 1, 0.35],
  );
  criarMalha(
    g,
    new T.ConeGeometry(0.17, 0.28, 3),
    m,
    [0, 0.2, 0],
    [0, 0, -0.5],
    [1, 1, 0.2],
  );
  for (const z of [-0.147, 0.147]) {
    criarElipsoide(g, [0.05, 0.05, 0.018], branco, [0.31, 0.06, z]);
    criarElipsoide(g, [0.025, 0.026, 0.01], preto, [0.32, 0.06, z * 1.08]);
  }
  if (indice % 3 === 0)
    for (const x of [-0.2, 0.1])
      criarMalha(
        g,
        new T.TorusGeometry(0.18, 0.028, 8, 24),
        branco,
        [x, 0, 0],
        [0, Math.PI / 2, 0],
        [1, 1.18, 1],
      );
  return { g, cauda };
}
export function criarFrutigerAero() {
  const scene = new T.Scene();
  scene.background = new T.Color("#138fcd");
  scene.fog = new T.FogExp2("#279fbe", 0.005);
  scene.add(new T.HemisphereLight("#b5efff", "#2b776c", 1.7));
  const sol = new T.DirectionalLight("#fff4cf", 3.2);
  sol.position.set(-70, 100, -40);
  sol.target.position.set(0, 0, 0);
  sol.castShadow = true;
  Object.assign(sol.shadow.camera, {
    left: -150,
    right: 150,
    top: 120,
    bottom: -120,
    far: 280,
  });
  scene.add(sol, sol.target);
  const ceu = criarCeu(scene),
    agua = criarAguaAero();
  scene.add(agua.malha);
  const areia = obterMaterial("#b4c6a3", 0.95);
  criarCaixa(scene, [460, 1, 360], areia, [0, -3.1, 0]);
  const cidade = criarCidadeAeroShore();
  cidade.position.set(-87, -0.3, 0);
  scene.add(cidade);
  const arena = criarArenaAquatica();
  arena.position.set(88, 0, -8);
  scene.add(arena);
  const bolhaArena = criarMalha(
    scene,
    new T.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    new T.MeshPhysicalMaterial({
      color: "#b5f6ff",
      roughness: 0.04,
      metalness: 0.12,
      transparent: true,
      opacity: 0.09,
      side: T.DoubleSide,
      depthWrite: false,
      clearcoat: 1,
    }),
    [88, 0, -8],
    [0, 0, 0],
    [58, 37, 68],
  );
  const pisoCaustica = criarMaterialCausticas();
  criarMalha(
    scene,
    new T.PlaneGeometry(440, 340),
    pisoCaustica,
    [0, -2.58, 0],
    [-Math.PI / 2, 0, 0],
  );
  const causticaCampo = criarMaterialCausticas();
  criarMalha(
    scene,
    new T.PlaneGeometry(48, 72),
    causticaCampo,
    [88, 0.035, -8],
    [-Math.PI / 2, 0, 0],
  );
  // Gramíneas instanciadas com movimento de corrente, preservando corredores e campo livres.
  const gramaMat = new T.MeshStandardMaterial({
    color: "#4eae5b",
    roughness: 0.7,
    side: T.DoubleSide,
  });
  const vento = { value: 0 };
  gramaMat.onBeforeCompile = (shader) => {
    shader.uniforms.tempoCorrente = vento;
    shader.vertexShader =
      "uniform float tempoCorrente;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n transformed.x += sin(tempoCorrente*.8+position.y*2.+float(gl_InstanceID)*.31)*position.y*.20;",
    );
  };
  const grama = new T.InstancedMesh(
      new T.ConeGeometry(0.14, 1.8, 3),
      gramaMat,
      2600,
    ),
    o = new T.Object3D();
  let ig = 0;
  for (let i = 0; ig < 2600; i++) {
    const x = ((i * 13.231) % 420) - 210,
      z = ((i * 19.731) % 300) - 150;
    if (
      (x > -143 && x < -30 && Math.abs(z) < 55) ||
      (x > 32 && x < 146 && Math.abs(z + 8) < 62)
    )
      continue;
    o.position.set(x, -1.9, z);
    o.scale.set(1, 0.55 + (i % 9) * 0.14, 1);
    o.rotation.y = i * 2.4;
    o.updateMatrix();
    grama.setMatrixAt(ig++, o.matrix);
  }
  scene.add(grama);
  const peixes = [];
  for (let i = 0; i < 54; i++) {
    const p = criarPeixe(
      ["#ffb52b", "#ffe048", "#3ec9c7", "#377eae"][i % 4],
      i,
    );
    p.g.scale.setScalar(0.7 + (i % 4) * 0.45);
    scene.add(p.g);
    peixes.push(p);
  }
  const bolhas = new T.InstancedMesh(
    new T.SphereGeometry(1, 12, 8),
    new T.MeshPhysicalMaterial({
      color: "#c5faff",
      roughness: 0.03,
      metalness: 0.14,
      clearcoat: 1,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
    180,
  );
  scene.add(bolhas);
  const raios = [];
  for (let i = 0; i < 13; i++) {
    const raio = criarMalha(
      scene,
      new T.ConeGeometry(4 + (i % 3), 45, 12, 1, true),
      new T.MeshBasicMaterial({
        color: "#b2faff",
        transparent: true,
        opacity: 0.025,
        depthWrite: false,
        side: T.DoubleSide,
        blending: T.AdditiveBlending,
      }),
      [-110 + i * 19, 8, -20 + (i % 3) * 22],
      [0, 0, 0.12],
    );
    raios.push(raio);
  }
  // Arcos de circulação, jardins e um globo translúcido dão continuidade à linguagem Aero.
  const branco = obterMaterial("#d4f3f1", 0.38, 0.12);
  for (let i = 0; i < 6; i++)
    criarMalha(scene, new T.TorusGeometry(11, 0.23, 10, 64, Math.PI), branco, [
      -25 + i * 16,
      -1,
      43,
    ]);
  const globo = new T.Group();
  scene.add(globo);
  globo.position.set(-104, 19, 13);
  criarMalha(
    globo,
    new T.SphereGeometry(5.5, 48, 32),
    new T.MeshPhysicalMaterial({
      color: "#2097cf",
      roughness: 0.1,
      metalness: 0.25,
      transparent: true,
      opacity: 0.78,
      clearcoat: 1,
    }),
    [0, 0, 0],
  );
  for (let i = 1; i < 8; i++) {
    const a = (i * Math.PI) / 8;
    criarMalha(
      globo,
      new T.TorusGeometry(Math.sin(a) * 5.55, 0.018, 6, 80),
      branco,
      [0, Math.cos(a) * 5.55, 0],
      [Math.PI / 2, 0, 0],
    );
  }
  for (let i = 0; i < 8; i++)
    criarMalha(
      globo,
      new T.TorusGeometry(5.55, 0.018, 6, 80),
      branco,
      [0, 0, 0],
      [0, (i * Math.PI) / 8, 0],
    );
  const naverdachi = criarNaverdachi(),
    axel = criarAxel(),
    bola = criarBolaBluezao();
  scene.add(naverdachi.group, axel.group, bola);
  const trajeto = new T.CatmullRomCurve3([
    new T.Vector3(-89, 4, 7),
    new T.Vector3(-68, 8, 31),
    new T.Vector3(-30, 14, 49),
    new T.Vector3(12, 13, 45),
    new T.Vector3(58, 7, 35),
    new T.Vector3(88, 1.5, 10),
  ]);
  const ataques = [];
  for (const x of [84, 92]) {
    const inicio = new T.Vector3(x, 1.3, 8),
      destino = new T.Vector3(88, 4.4, -8),
      vetor = destino.clone().sub(inicio);
    const feixe = new T.Mesh(
      new T.CylinderGeometry(0.065, 0.11, 1, 10),
      new T.MeshBasicMaterial({
        color: x === 84 ? "#7ef2ff" : "#f7dd83",
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    feixe.position.copy(inicio).add(destino).multiplyScalar(0.5);
    feixe.scale.y = vetor.length();
    feixe.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      vetor.normalize(),
    );
    feixe.visible = false;
    scene.add(feixe);
    ataques.push(feixe);
  }
  return {
    scene,
    ataques,
    sol,
    ceu,
    agua,
    cidade,
    arena,
    bolhaArena,
    pisoCaustica,
    causticaCampo,
    vento,
    peixes,
    bolhas,
    raios,
    globo,
    naverdachi,
    axel,
    bola,
    trajeto,
    matriz: new T.Object3D(),
    reflexoQuadro: 0,
  };
}
export function desenharFrutigerAero(view, estado) {
  if (ETAPAS_ARCOPLEX.includes(estado.aero?.etapa) && view.aero?.arcoplex) {
    desenharArcoplex(view, view.aero.arcoplex, estado.aero);
    return;
  }
  if (ETAPAS_LUA.includes(estado.aero?.etapa) && view.aero?.lua) {
    desenharCenasLua(view, view.aero.lua, estado.aero);
    return;
  }
  if (
    ["praiaChegada", "volei", "voleiVitoria", "fimAero"].includes(
      estado.aero?.etapa,
    ) &&
    view.aero?.praia
  ) {
    desenharPraiaVolei(view, view.aero.praia, estado.aero);
    return;
  }

  const c = view.aero,
    f = estado.aero,
    t = f.animacao,
    cam = view.camera,
    p = f.jogador;
  if (["viagemPraia", "fimAero"].includes(f.etapa) && c.estradaPraia) {
    desenharEstradaPraia(view, c.estradaPraia, f);
    return;
  }
  if (
    [
      "lanchonete",
      "lanchoneteExplorar",
      "lanchoneteFinal",
      "lanchonetePagar",
      "pagamento",
      "agradecimento",
      "saidaPonto",
    ].includes(f.etapa) &&
    c.pontoKente
  ) {
    desenharComemoracao(view, c.pontoKente, f, estado.mode === "aero");
    return;
  }
  c.ataques.forEach(
    (a) =>
      (a.visible =
        f.etapa === "ritmo" && f.ritmo.feedbackTempo > 0 && f.ritmo.combo > 0),
  );
  if (c.hulk)
    c.hulk.grupo.visible = [
      "transformacao",
      "ritmo",
      "vitoria",
      "derrotaRitmo",
    ].includes(f.etapa);
  c.ceu.material.uniforms.tempo.value = t;
  c.pisoCaustica.uniforms.tempo.value = t;
  c.causticaCampo.uniforms.tempo.value = t;
  c.vento.value = t;
  c.globo.rotation.y = t * 0.045;
  for (const [i, peixe] of c.peixes.entries()) {
    const faixa = i % 3;
    peixe.g.position.set(
      -80 + Math.sin(t * 0.065 + i * 0.61) * (faixa === 0 ? 65 : 140),
      5 + (i % 9) * 2.2,
      Math.cos(t * 0.065 + i * 0.61) * 66,
    );
    peixe.g.rotation.y = -(t * 0.065 + i * 0.61);
    peixe.cauda.rotation.y = Math.sin(t * 4 + i) * 0.3;
  }
  for (let i = 0; i < 180; i++) {
    const o = c.matriz;
    o.position.set(
      ((i * 17.4) % 320) - 160 + Math.sin(t * 0.25 + i) * 0.4,
      ((t * 0.7 + i * 1.9) % 32) - 2,
      ((i * 23.4) % 190) - 95,
    );
    o.scale.setScalar(0.045 + (i % 7) * 0.035);
    o.updateMatrix();
    c.bolhas.setMatrixAt(i, o.matrix);
  }
  c.bolhas.instanceMatrix.needsUpdate = true;
  c.bola.visible = ["entrada", "futebol"].includes(f.etapa);
  c.naverdachi.group.visible = f.etapa !== "queda";
  c.axel.group.visible = true;
  c.axel.group.rotation.set(0, 0, 0);
  c.naverdachi.group.rotation.set(0, 0, 0);
  if (f.etapa === "queda") {
    const v = Math.min(1, f.tempo / 4),
      y = 31 - 29 * (1 - Math.pow(1 - v, 2));
    c.axel.group.position.set(-89, y, 7);
    c.axel.group.rotation.set(v * 2.1, v * 0.6, v * 0.3);
    cam.position.set(-80, y + 3, -4);
    cam.lookAt(-89, y, 7);
  } else if (f.etapa === "resgate") {
    const v = Math.min(1, f.tempo / 3);
    c.axel.group.position.set(-89, 2.3 + Math.sin(t) * 0.08, 7);
    c.axel.group.rotation.z = -0.65 * (1 - v);
    c.naverdachi.group.position.set(-88.6, 2.2, 11 - v * 3);
    c.naverdachi.group.rotation.y = Math.PI;
    c.naverdachi.arms[0].rotation.x = -1.25;
    c.naverdachi.arms[1].rotation.x = -0.9;
    c.naverdachi.head.rotation.y = Math.sin(t * 0.7) * 0.08;
    c.naverdachi.head.rotation.x = Math.sin(t * 1.5) * 0.02;
    const aberta = f.tempo < 3 || f.tempo > 29;
    cam.position.set(aberta ? -78 : -86, aberta ? 8 : 4.1, aberta ? 19 : 2.4);
    cam.lookAt(-89, 3.8, 7.5);
  } else if (f.etapa === "viagem") {
    const v = Math.min(1, f.tempo / 13),
      pos = c.trajeto.getPointAt(v),
      dir = c.trajeto.getTangentAt(v);
    c.naverdachi.group.position.copy(pos);
    c.naverdachi.group.rotation.set(Math.PI / 2, Math.atan2(dir.x, dir.z), 0);
    c.naverdachi.animate(t, 3);
    c.naverdachi.arms.forEach((a) => (a.rotation.x = -1.3));
    c.axel.group.position.copy(pos).add(new T.Vector3(0.1, 0.75, 0.5));
    c.axel.group.rotation.z = Math.PI / 2;
    cam.position.copy(pos).add(new T.Vector3(14, 8, -12));
    cam.lookAt(pos.clone().add(new T.Vector3(2, 1, 0)));
  } else if (f.etapa === "entrada") {
    const v = Math.min(1, f.tempo / 6);
    cam.position.set(88 + 48 * (1 - v), 24 - 15 * v, 69 - 23 * v);
    cam.lookAt(88, 2, -4);
    c.axel.group.position.set(88, 0, 10);
    c.naverdachi.group.position.set(80, 0, -16);
  } else if (
    ["transformacao", "ritmo", "derrotaRitmo", "vitoria"].includes(f.etapa)
  ) {
    const transformacao = f.etapa === "transformacao",
      v = transformacao ? Math.min(1, f.tempo / 5) : 1;
    c.axel.group.position.set(84, 0, 8);
    c.naverdachi.group.position.set(92, 0, 8);
    c.axel.group.rotation.y = Math.PI;
    c.naverdachi.group.rotation.y = Math.PI;
    c.naverdachi.animate(t, 0);
    c.axel.animate(t, 0);
    c.naverdachi.arms.forEach((a) => (a.rotation.x = -1.1));
    if (c.hulk) {
      c.hulk.grupo.position.set(
        88,
        Math.sin(t * 2) * 0.035,
        -8 -
          (f.etapa === "ritmo" && f.ritmo.combo > 0
            ? f.ritmo.feedbackTempo * 0.8
            : 0),
      );
      c.hulk.grupo.scale.setScalar(Math.max(0.01, v));
      c.hulk.grupo.rotation.set(0, Math.sin(t * 0.5) * 0.06, 0);
      c.hulk.mixer.setTime((t * 0.6) % c.hulk.duracao);
      if (f.etapa === "vitoria") {
        const queda = Math.min(1, f.tempo / 3);
        c.hulk.grupo.rotation.x = -queda * 1.5;
        c.hulk.grupo.position.y = -queda * 0.4;
        c.hulk.luz.intensity = 28 * (1 - queda);
        c.axel.group.position.y = Math.abs(Math.sin(f.tempo * 4)) * 0.55;
        c.naverdachi.group.position.y =
          Math.abs(Math.sin(f.tempo * 4 + 0.5)) * 0.55;
        c.naverdachi.arms.forEach((a) => (a.rotation.x = -2.7));
      } else c.hulk.luz.intensity = 28 + (f.ritmo?.combo || 0) * 0.4;
    }
    c.bola.visible = transformacao && v < 0.75;
    c.bola.position.set(88, 0.6 + v * 2, -8);
    c.bola.scale.setScalar(1 + v * 2);
    cam.position.set(106, 6, 23);
    cam.lookAt(88, 3.8, -5);
  } else {
    c.bola.scale.setScalar(1);
    c.axel.group.position.set(p.x + 88, 0, p.z - 8);
    c.axel.group.rotation.y = p.yaw + Math.PI;
    c.axel.animate(t, f.movendo ? (f.correndo ? 7 : 4) : 0);
    c.naverdachi.group.position.set(f.naverdachi.x + 88, 0, f.naverdachi.z - 8);
    c.naverdachi.group.rotation.y = Math.atan2(
      f.bola.x - f.naverdachi.x,
      f.bola.z - f.naverdachi.z,
    );
    c.naverdachi.animate(t, f.pausaGol > 0 ? 0 : 3);
    const distancia = 6.5;
    cam.position.set(
      p.x + 88 + Math.sin(p.yaw) * distancia,
      3.5 + Math.max(-0.5, p.pitch * 2),
      p.z - 8 + Math.cos(p.yaw) * distancia,
    );
    cam.lookAt(
      p.x + 88 - Math.sin(p.yaw) * 3,
      1.2 - p.pitch * 2,
      p.z - 8 - Math.cos(p.yaw) * 3,
    );
  }
  if (f.etapa === "futebol") {
    cam.position.x = Math.max(88 - 25.2, Math.min(88 + 25.2, cam.position.x));
    cam.position.z = Math.max(-8 - 37.5, Math.min(-8 + 37.5, cam.position.z));
  }
  if (f.etapa !== "transformacao")
    c.bola.position.set(f.bola.x + 88, f.bola.y, f.bola.z - 8);
  c.bola.rotation.set(f.bola.giro, Math.PI + f.bola.giro * 0.3, 0);
  cam.fov = f.etapa === "futebol" ? 70 : 63;
  cam.far = 900;
  cam.updateProjectionMatrix();
  c.scene.fog.density = f.etapa === "futebol" ? 0.0025 : 0.005;
  view.renderer.toneMappingExposure = 1.08;
  if (estado.quality === "ultra" || estado.quality === "high")
    c.agua.atualizar(view.renderer, c.scene, cam, t);
  else c.agua.malha.material.uniforms.tempo.value = t;
  view.renderer.render(c.scene, cam);
}
