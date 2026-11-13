import { criarFortalezaColina, criarCeuDourado } from "./paisagem-castelo.js";
import {
  criarCenaTerraco,
  desenharTerraco,
  desenharPreviaAero,
} from "./terraco-castelo.js";
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarElipsoide,
  criarTubo,
  criarMalha,
  obterMaterial,
  criarTexturaTexto,
  criarAxel,
} from "./modelos.js";
import {
  criarPolitico,
  criarDavyJones,
  criarLittleTail,
  criarBolaBasquete,
  carregarCJ,
} from "./personagens-castelo.js";
import {
  ROTA_ESCADARIA,
  ENCONTROS_CASTELO,
  poseBriga,
} from "./regras-castelo.js";
import { criarAgua, criarCeu } from "./efeitos-visuais.js";

function placa(cena, texto, posicao, largura = 2) {
  return criarCaixa(
    cena,
    [largura, 0.35, 0.04],
    new T.MeshStandardMaterial({
      map: criarTexturaTexto(texto, "#15202b", "#e0d3aa"),
      roughness: 0.85,
    }),
    posicao,
  );
}

export async function criarCastelo() {
  const scene = new T.Scene();
  scene.background = new T.Color("#090e1b");
  scene.fog = new T.FogExp2("#111726", 0.013);
  scene.add(new T.HemisphereLight("#859cbd", "#221915", 0.36));
  const lua = new T.DirectionalLight("#b4c7e7", 1.1);
  lua.position.set(-15, 35, -10);
  lua.castShadow = true;
  Object.assign(lua.shadow.camera, {
    left: -30,
    right: 30,
    top: 35,
    bottom: -35,
    near: 0.5,
    far: 100,
  });
  scene.add(lua);
  const pedra = obterMaterial("#505451", 0.93),
    piso = obterMaterial("#5b5d58", 0.8),
    ferro = obterMaterial("#252b30", 0.48, 0.65);
  // Torres e ameias dão continuidade ao castelo visto do barco.
  for (const x of [-13, 13])
    for (const z of [-12, 12]) {
      criarCilindro(scene, 1.8, 2.2, 12, pedra, [x, 5.9, z]);
      criarCilindro(scene, 2.15, 2.15, 0.3, pedra, [x, 11.9, z]);
      for (let i = 0; i < 10; i++)
        criarCaixa(scene, [0.48, 1, 0.48], pedra, [
          x + Math.cos((i * Math.PI) / 5) * 1.9,
          12.5,
          z + Math.sin((i * Math.PI) / 5) * 1.9,
        ]);
      criarMalha(
        scene,
        new T.ConeGeometry(2.3, 5, 24),
        obterMaterial("#28333f", 0.7),
        [x, 15.2, z],
      );
    }
  for (const z of [-13, 13])
    for (let x = -11; x <= 11; x += 1.4)
      criarCaixa(scene, [0.7, 0.9, 0.7], pedra, [x, 7.8, z]);
  criarCaixa(scene, [25, 0.6, 27], pedra, [0, -0.3, 0]);
  const lajotas = new T.InstancedMesh(
      new T.BoxGeometry(1.92, 0.04, 1.92),
      piso,
      12 * 13,
    ),
    matriz = new T.Object3D();
  scene.add(lajotas);
  lajotas.receiveShadow = true;
  let indice = 0;
  for (let x = 0; x < 12; x++)
    for (let z = 0; z < 13; z++) {
      matriz.position.set((x - 5.5) * 2, 0.02, (z - 6) * 2);
      matriz.rotation.y = (x + z) % 2 ? Math.PI / 2 : 0;
      matriz.updateMatrix();
      lajotas.setMatrixAt(indice++, matriz.matrix);
    }
  const blocos = [];
  for (let y = 0; y < 10; y++)
    for (let z = -13; z <= 13; z++)
      for (const x of [-12, 12])
        blocos.push([x, y * 0.7 + 0.35, z + (y % 2) * 0.45]);
  for (let y = 0; y < 10; y++)
    for (let x = -11; x <= 11; x++) {
      if (x < -10 || x > -8)
        blocos.push([x + (y % 2) * 0.4, y * 0.7 + 0.35, -13]);
      if (Math.abs(x) > 2) blocos.push([x + (y % 2) * 0.4, y * 0.7 + 0.35, 13]);
    }
  const alvenaria = new T.InstancedMesh(
    new T.BoxGeometry(0.94, 0.66, 0.72),
    pedra,
    blocos.length,
  );
  scene.add(alvenaria);
  alvenaria.castShadow = alvenaria.receiveShadow = true;
  blocos.forEach((p, i) => {
    matriz.position.set(...p);
    matriz.rotation.y = Math.abs(p[0]) === 12 ? Math.PI / 2 : 0;
    matriz.updateMatrix();
    alvenaria.setMatrixAt(i, matriz.matrix);
    alvenaria.setColorAt(i, new T.Color().setScalar(0.72 + (i % 7) * 0.035));
  });
  criarCaixa(scene, [25, 0.4, 27], obterMaterial("#303b43", 0.9), [0, 7.2, 0]);
  for (const x of [-8, 8])
    for (const z of [-7, 7]) {
      criarCilindro(scene, 0.42, 0.6, 7.0, pedra, [x, 3.5, z]);
      criarCilindro(scene, 0.68, 0.68, 0.25, pedra, [x, 0.12, z]);
    }
  for (const z of [-7, 7])
    criarMalha(scene, new T.TorusGeometry(7.8, 0.21, 10, 60, Math.PI), pedra, [
      0,
      4.8,
      z,
    ]);
  for (const x of [-5.3, 5.3]) {
    criarCaixa(scene, [4, 0.18, 1.2], obterMaterial("#493b2c", 0.87), [
      x,
      0.55,
      3.2,
    ]);
    for (const dx of [-1.6, 1.6])
      criarCaixa(scene, [0.15, 0.5, 1.0], ferro, [x + dx, 0.27, 3.2]);
  }
  const tochas = [];
  for (const [x, z, y] of [
    [-10, 8, 2],
    [10, 8, 2],
    [-10, -8, 2],
    [10, -8, 2],
    [-10, -20, 5],
    [8, -22, 9],
    [10, -9, 12],
  ]) {
    criarCilindro(scene, 0.045, 0.07, 0.75, ferro, [x, y - 0.2, z]);
    const fogo = criarElipsoide(
      scene,
      [0.1, 0.23, 0.1],
      obterMaterial("#ffac48", 0.25, 0, {
        emissive: "#ff8b2a",
        emissiveIntensity: 2.2,
      }),
      [x, y + 0.25, z],
    );
    const luz = new T.PointLight("#ffc185", 14, 13, 2);
    luz.position.set(x, y + 0.3, z);
    scene.add(luz);
    tochas.push({ luz, fogo });
  }
  // Escadaria contínua com cinco lances, degraus, vigas e corrimãos.
  ROTA_ESCADARIA.slice(0, -1).forEach((a, i) => {
    const b = ROTA_ESCADARIA[i + 1],
      dist = Math.hypot(b.x - a.x, b.z - a.z),
      n = Math.ceil(dist / 0.36),
      angulo = Math.atan2(b.x - a.x, b.z - a.z);
    for (let j = 0; j < n; j++) {
      const v = (j + 0.5) / n,
        altura = (b.y - a.y) / n;
      criarCaixa(
        scene,
        [2.8, Math.max(0.2, altura + 0.12), dist / n + 0.02],
        pedra,
        [
          a.x + (b.x - a.x) * v,
          a.y + (b.y - a.y) * ((j + 1) / n) - Math.max(0.2, altura + 0.12) / 2,
          a.z + (b.z - a.z) * v,
        ],
        [0, angulo, 0],
      );
    }
    for (const lado of [-1, 1]) {
      const dx = Math.cos(angulo) * lado * 1.4,
        dz = -Math.sin(angulo) * lado * 1.4;
      criarTubo(
        scene,
        [
          [a.x + dx, a.y + 0.9, a.z + dz],
          [b.x + dx, b.y + 0.9, b.z + dz],
        ],
        0.035,
        ferro,
      );
      criarTubo(
        scene,
        [
          [a.x + dx, a.y - 0.16, a.z + dz],
          [b.x + dx, b.y - 0.16, b.z + dz],
        ],
        0.095,
        ferro,
      );
      for (let j = 0; j <= n; j += 3) {
        const v = j / n;
        criarCilindro(scene, 0.025, 0.025, 0.9, ferro, [
          a.x + (b.x - a.x) * v + dx,
          a.y + (b.y - a.y) * v + 0.45,
          a.z + (b.z - a.z) * v + dz,
        ]);
      }
    }
    criarCaixa(scene, [3.1, 0.24, 3.1], pedra, [b.x, b.y - 0.1, b.z]);
  });
  criarCaixa(scene, [32, 16, 0.6], pedra, [1, 7.8, -30]);
  criarCaixa(scene, [0.5, 16, 18], pedra, [-14, 7.8, -21]);
  criarCaixa(scene, [7, 0.25, 10], piso, [9, 11.85, -5]);
  for (const x of [5.5, 12.5])
    criarCaixa(scene, [0.4, 1.1, 8], pedra, [x, 12.55, -5]);
  placa(scene, "ESCADARIA ← · SILÊNCIO", [-8, 2, -12.5], 3);
  placa(scene, "CENA FICTÍCIA · PARÓDIA", [0, 4.2, -12.55], 4);
  const terminal = criarCaixa(scene, [0.5, 1.0, 0.4], ferro, [-9, 0.5, -10.7]);
  placa(scene, "HTML / CSS", [-9, 1.25, -10.45], 1.5);
  const bolsonaro = criarPolitico("bolsonaro"),
    lula = criarPolitico("lula");
  scene.add(bolsonaro.group, lula.group);
  const luzSalao = new T.SpotLight("#f0d4af", 48, 15, 0.95, 0.85, 2);
  luzSalao.position.set(0, 5, 4);
  luzSalao.target.position.set(0, 1.0, 0);
  scene.add(luzSalao, luzSalao.target);
  criarCaixa(scene, [5.2, 0.24, 6.2], piso, [-10, 3.18, -23.3]);
  criarCaixa(scene, [7.8, 0.24, 5.4], piso, [12, 7.08, -26.3]);
  const davy = criarDavyJones();
  scene.add(davy.group);
  davy.group.position.set(
    ENCONTROS_CASTELO.davy.x,
    3.3,
    ENCONTROS_CASTELO.davy.z,
  );
  davy.group.rotation.y = -Math.PI / 2;
  placa(scene, "DAVY JONES", [-11.2, 5.5, -26.8], 2);
  const little = criarLittleTail();
  scene.add(little.group);
  little.group.position.set(12, 7.2, -28);
  little.group.rotation.y = -Math.PI / 2;
  placa(scene, "LITTLE TAIL AMERICAN", [12, 9.6, -29.5], 3);
  const bola = criarBolaBasquete();
  scene.add(bola);
  // Referências nos patamares, em quadros de geometria real.
  for (const [arquivo, x, y, z, texto] of [
    ["assets/amigos-quarto.jpg", -10.5, 5, -18, "AMIGOS PARA SEMPRE"],
    ["assets/gta.png", 3, 8.3, -22.6, "WHO IS THIS GTA 6?"],
    ["assets/alisanave-logo.png", 9.8, 11.6, -15, "ALISANAVE"],
  ]) {
    const tex = new T.TextureLoader().load(arquivo);
    tex.colorSpace = T.SRGBColorSpace;
    const quadro = new T.Group();
    scene.add(quadro);
    quadro.position.set(x, y, z);
    if (x < -10) quadro.rotation.y = Math.PI / 2;
    if (x > 9) quadro.rotation.y = -Math.PI / 2;
    criarCaixa(quadro, [1.8, 1.4, 0.1], ferro, [0, 0, 0]);
    criarCaixa(
      quadro,
      [1.6, 1.2, 0.02],
      new T.MeshStandardMaterial({ map: tex, roughness: 0.65 }),
      [0, 0, 0.065],
    );
    placa(quadro, texto, [0, -0.95, 0], 2.4);
  }
  const cj = await carregarCJ();
  scene.add(cj.group);
  cj.group.position.set(7.5, 12, -3.5);
  cj.group.rotation.y = Math.PI;
  const materialPortal = new T.ShaderMaterial({
    transparent: true,
    side: T.DoubleSide,
    uniforms: { tempo: { value: 0 } },
    vertexShader:
      "varying vec2 ponto;void main(){ponto=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader:
      "uniform float tempo;varying vec2 ponto;void main(){float r=length(ponto);if(r>1.0)discard;float a=atan(ponto.y,ponto.x);float f=sin(a*8.0-r*28.0+tempo*3.5);vec3 c=mix(vec3(.04,.08,.3),vec3(.5,.18,1.0),.5+.5*f);c+=pow(r,8.0)*vec3(.25,.5,1.0);gl_FragColor=vec4(c,.92);}",
  });
  const portal = criarMalha(
    scene,
    new T.CircleGeometry(1.45, 64),
    materialPortal,
    [9, 13.65, -1.8],
    [0, 0, 0],
    [1, 1.18, 1],
  );
  criarMalha(
    scene,
    new T.TorusGeometry(1.48, 0.16, 14, 64),
    obterMaterial("#464757", 0.6, 0.4),
    [9, 13.65, -1.78],
    [0, 0, 0],
    [1, 1.18, 1],
  );
  const luzPortal = new T.PointLight("#7663ff", 30, 9, 2);
  luzPortal.position.set(9, 13, -4);
  scene.add(luzPortal);
  const luzCJ = new T.SpotLight("#d8d6cf", 16, 8, 0.8, 0.8, 2);
  luzCJ.position.set(7, 14.6, -7);
  luzCJ.target.position.set(7.5, 13.1, -3.5);
  scene.add(luzCJ, luzCJ.target);
  placa(scene, "PORTAL · CSS", [9, 15.8, -1.8], 2.5);
  const mar = criarAgua(90, 100, "#1c3c4c");
  mar.material.uniforms.noite.value = 1;
  scene.add(mar);
  mar.position.set(0, -0.6, 60);
  criarCaixa(
    scene,
    [4, 0.3, 16],
    obterMaterial("#39372f", 0.9),
    [0, -0.05, 20],
  );
  const chegada = criarAxel();
  scene.add(chegada.group);
  const externo = new T.Scene();
  externo.add(new T.HemisphereLight("#ffe3a1", "#58754b", 1.8));
  const solExterior = new T.DirectionalLight("#ffcd74", 3.7);
  solExterior.position.set(-80, 100, -40);
  externo.add(solExterior);
  const ceuExterior = criarCeuDourado(externo),
    paisagem = criarFortalezaColina();
  externo.add(paisagem.grupo);
  const marExterior = criarAgua(900, 900, "#4c8780");
  marExterior.position.y = -1;
  externo.add(marExterior);
  const dados = {
    scene,
    externo,
    ceuExterior,
    marExterior,
    bolsonaro,
    lula,
    davy,
    little,
    cj,
    bola,
    portal,
    mar,
    tochas,
    chegada,
    terminal,
  };
  dados.terraco = criarCenaTerraco(dados);
  return dados;
}

export function desenharCastelo(view, estado, tempo) {
  const c = view.castelo,
    f = estado.castelo,
    p = f.jogador,
    cam = view.camera;
  tempo = f.animacao || 0;
  if (f.etapa === "terraco") {
    desenharTerraco(view, c.terraco, f, estado.reduced);
    return;
  }
  if (f.etapa === "previa") {
    desenharPreviaAero(view, c.terraco, f.tempo);
    return;
  }
  if (f.etapa === "chegada" && f.tempo < 6) {
    const v = f.tempo / 6;
    c.ceuExterior.material.uniforms.tempo.value = tempo;
    c.marExterior.material.uniforms.tempo.value = tempo;
    cam.position.set(85 * (1 - v) + 8, 45 + v * 8, -150 + v * 85);
    cam.lookAt(0, 65, 0);
    cam.fov = 65;
    cam.far = 1000;
    cam.updateProjectionMatrix();
    view.renderer.toneMappingExposure = 1.15;
    view.renderer.render(c.externo, cam);
    return;
  }
  c.mar.material.uniforms.tempo.value = tempo;
  c.portal.material.uniforms.tempo.value = tempo;
  [c.bolsonaro, c.lula].forEach((h, i) => {
    const pose = poseBriga(f.tempo, i),
      fase = tempo * 3 + i * Math.PI;
    h.group.position.set(pose.x, pose.y, 0);
    h.group.rotation.set(0, i ? -Math.PI / 2 : Math.PI / 2, pose.giro);
    h.body.scale.y = 1 + Math.sin(tempo * 2 + i) * 0.006;
    h.head.rotation.set(Math.sin(fase) * 0.04, Math.sin(fase * 0.4) * 0.08, 0);
    h.arms.forEach((a, j) => {
      a.rotation.x = pose.soco
        ? j === 0
          ? -1.65
          : -0.95
        : pose.vitima && pose.y > 0
          ? -0.4 + Math.sin(fase + j) * 1.1
          : -0.85;
      h.cotovelos[j].rotation.x = pose.soco && j === 0 ? -0.1 : -1.0;
    });
    h.legs.forEach((l, j) => {
      l.rotation.x =
        pose.y > 0 ? Math.sin(fase + j) * 0.7 : Math.sin(fase + j) * 0.1;
    });
  });
  for (const [i, h] of [c.davy, c.little].entries()) {
    h.head.rotation.set(
      Math.sin(tempo * 1.4 + i) * 0.025,
      Math.sin(tempo * 0.75 + i) * 0.07,
      0,
    );
    h.body.scale.y = 1 + Math.sin(tempo * 2 + i) * 0.006;
    h.arms.forEach((a, j) => (a.rotation.x = Math.sin(tempo * 2 + j) * 0.09));
  }
  c.davy.group.position.x =
    ENCONTROS_CASTELO.davy.x + Math.sin(tempo * 0.45) * 0.35;
  c.davy.group.position.z =
    ENCONTROS_CASTELO.davy.z + Math.cos(tempo * 0.45) * 0.5;
  c.davy.group.rotation.y = Math.atan2(
    p.x - c.davy.group.position.x,
    p.z - c.davy.group.position.z,
  );
  c.little.group.position.x = 12 + Math.sin(tempo * 0.6) * 0.5;
  c.little.group.rotation.y = Math.atan2(
    p.x - c.little.group.position.x,
    p.z + 28,
  );
  c.davy.legs.forEach(
    (l, i) => (l.rotation.x = Math.sin(tempo * 2 + i * Math.PI) * 0.15),
  );
  c.little.legs.forEach(
    (l, i) => (l.rotation.x = Math.sin(tempo * 2.2 + i * Math.PI) * 0.13),
  );
  if (f.littleVisto) {
    c.little.arms[0].rotation.x =
      -1.4 + Math.sin(Math.min(2, f.bola.tempo) * 2.5) * 0.7;
  }
  c.bola.visible = !f.bola.pega;
  if (f.bola.ativa) c.bola.position.set(f.bola.x, f.bola.y, f.bola.z);
  else c.bola.position.set(11.8, 8.5, -27.6);
  c.bola.rotation.set(tempo * 1.8, tempo * 1.2, tempo);
  c.cj.animate?.(tempo);
  c.cj.group.rotation.y = Math.PI + Math.sin(tempo * 0.8) * 0.025;
  c.cj.group.scale.y = 1 + Math.sin(tempo * 2) * 0.003;
  c.tochas.forEach(({ luz, fogo }, i) => {
    luz.intensity = 13 + Math.sin(tempo * 9 + i) * 1.5;
    fogo.scale.y = 1 + Math.sin(tempo * 12 + i) * 0.11;
  });
  c.chegada.group.visible = f.etapa === "chegada";
  if (f.etapa === "chegada") {
    const v = Math.min(1, (f.tempo - 6) / 4);
    c.chegada.group.position.set(0, 0, 24 - v * 14);
    c.chegada.group.rotation.y = Math.PI;
    c.chegada.animate(tempo, 2);
    cam.position.set(7 - v * 4, 3.8, 27 - v * 12);
    cam.lookAt(0, 2, 9 - v * 4);
  } else if (f.etapa === "portal") {
    const v = Math.min(1, f.tempo / 3);
    cam.position.set(9, 13.55, -4 + v * 2);
    cam.lookAt(9, 13.55, -1);
    cam.rotation.z = Math.sin(v * Math.PI) * 0.08;
  } else {
    cam.position.set(
      p.x,
      p.y +
        (f.agachado ? 0.95 : 1.7) +
        (f.movendo ? Math.sin(tempo * 8) * 0.012 : Math.sin(tempo * 2) * 0.002),
      p.z,
    );
    cam.rotation.set(p.pitch, p.yaw, 0, "YXZ");
  }
  cam.fov = f.agachado ? 66 : 70;
  cam.far = 900;
  cam.updateProjectionMatrix();
  view.renderer.toneMappingExposure = 1.18;
  view.renderer.render(c.scene, cam);
}
