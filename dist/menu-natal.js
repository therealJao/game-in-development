import * as T from "./vendor/three.module.js";
import { criarAxel, criarCachorro } from "./modelos.js";
import { criarMaicon, criarPessoa } from "./personagens.js";
import {
  criarArvoreNatal,
  criarBonecoDeNeve,
  criarBengalaDoce,
  criarPresente,
  criarGuirlanda,
  criarVaralDeLuzes,
  criarNeve,
  animarNatal,
} from "./natal.js";
import { criarSuperficieReflexiva } from "./reflexo.js";

/** Menu de Natal: praça nevada à noite, casas com janelas acesas, árvore gigante e a turma de touca. */
function texturaNeveChao() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#8a8a8a";
  g.fillRect(0, 0, 512, 512);
  let s = 77;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 1800; i++) {
    const x = r() * 512,
      y = r() * 512,
      raio = 4 + r() * 26,
      grad = g.createRadialGradient(x, y, 0, x, y, raio),
      v = r() > 0.5 ? 255 : 0;
    grad.addColorStop(0, `rgba(${v},${v},${v},0.09)`);
    grad.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = grad;
    g.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(10, 10);
  return t;
}
function texturaJanela(cor) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 96;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 60, 4, 32, 50, 60);
  grad.addColorStop(0, "#fff2c4");
  grad.addColorStop(0.5, cor);
  grad.addColorStop(1, "#3a1e08");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 96);
  g.fillStyle = "#2a1a0e";
  g.fillRect(29, 0, 6, 96);
  g.fillRect(0, 44, 64, 6);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
function criarCasa(largura, altura, cor, corJanela) {
  const g = new T.Group();
  const parede = new T.MeshStandardMaterial({ color: cor, roughness: 0.85 });
  const corpo = new T.Mesh(new T.BoxGeometry(largura, altura, 4), parede);
  corpo.position.y = altura / 2;
  corpo.castShadow = corpo.receiveShadow = true;
  g.add(corpo);
  // Telhado de duas águas com neve por cima.
  const forma = new T.Shape();
  forma.moveTo(-largura / 2 - 0.3, 0);
  forma.lineTo(0, largura * 0.42);
  forma.lineTo(largura / 2 + 0.3, 0);
  forma.closePath();
  const telhado = new T.Mesh(
    new T.ExtrudeGeometry(forma, { depth: 4.4, bevelEnabled: false }),
    new T.MeshStandardMaterial({ color: "#5a2a22", roughness: 0.8 }),
  );
  telhado.position.set(0, altura, -2.2);
  telhado.castShadow = true;
  g.add(telhado);
  const neveForma = new T.Shape();
  neveForma.moveTo(-largura / 2 - 0.4, 0.05);
  neveForma.lineTo(0, largura * 0.42 + 0.2);
  neveForma.lineTo(largura / 2 + 0.4, 0.05);
  neveForma.lineTo(largura / 2 + 0.25, -0.1);
  neveForma.lineTo(0, largura * 0.42 + 0.02);
  neveForma.lineTo(-largura / 2 - 0.25, -0.1);
  neveForma.closePath();
  const neve = new T.Mesh(
    new T.ExtrudeGeometry(neveForma, { depth: 4.5, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 }),
    new T.MeshStandardMaterial({ color: "#eef3ff", roughness: 0.6 }),
  );
  neve.position.set(0, altura + 0.06, -2.25);
  g.add(neve);
  // Janelas acesas (emissivas) e porta com guirlanda.
  const janelaMat = new T.MeshStandardMaterial({
    map: texturaJanela(corJanela),
    emissiveMap: texturaJanela(corJanela),
    emissive: "#ffffff",
    emissiveIntensity: 1.6,
  });
  const andares = Math.max(1, Math.floor((altura - 0.5) / 2.2));
  for (let a = 0; a < andares; a++)
    for (const x of [-largura * 0.28, largura * 0.28]) {
      const j = new T.Mesh(new T.PlaneGeometry(0.75, 1.1), janelaMat);
      j.position.set(x, 1.4 + a * 2.2, 2.01);
      g.add(j);
      const peitoril = new T.Mesh(new T.BoxGeometry(0.95, 0.1, 0.2), neve.material);
      peitoril.position.set(x, 0.8 + a * 2.2, 2.08);
      g.add(peitoril);
    }
  const porta = new T.Mesh(
    new T.BoxGeometry(0.9, 1.8, 0.1),
    new T.MeshStandardMaterial({ color: "#3b1a12", roughness: 0.6 }),
  );
  porta.position.set(0, 0.9, 2.02);
  g.add(porta);
  const guirlanda = criarGuirlanda(0.26);
  guirlanda.position.set(0, 1.25, 2.12);
  g.add(guirlanda);
  const luz = new T.PointLight(corJanela, 4, 6, 2);
  luz.position.set(0, 1.6, 3);
  g.add(luz);
  return g;
}
function criarPoste() {
  const g = new T.Group();
  const ferro = new T.MeshStandardMaterial({ color: "#16181c", metalness: 0.7, roughness: 0.4 });
  const haste = new T.Mesh(new T.CylinderGeometry(0.06, 0.09, 4, 10), ferro);
  haste.position.y = 2;
  haste.castShadow = true;
  g.add(haste);
  const lanterna = new T.Mesh(
    new T.CylinderGeometry(0.22, 0.16, 0.45, 6),
    new T.MeshStandardMaterial({ color: "#ffe2a8", emissive: "#ffc46b", emissiveIntensity: 3 }),
  );
  lanterna.position.y = 4.15;
  g.add(lanterna);
  const topo = new T.Mesh(new T.ConeGeometry(0.3, 0.25, 6), ferro);
  topo.position.y = 4.5;
  g.add(topo);
  const luz = new T.PointLight("#ffbf70", 14, 9, 1.8);
  luz.position.y = 4;
  g.add(luz);
  const guirlanda = criarGuirlanda(0.22);
  guirlanda.position.set(0, 3.2, 0.1);
  g.add(guirlanda);
  return g;
}

export function criarMenuNatal() {
  const scene = new T.Scene();
  scene.background = new T.Color("#0b1630");
  scene.fog = new T.FogExp2("#13203f", 0.032);
  // Céu: cúpula com gradiente e estrelas.
  const ceu = new T.Mesh(
    new T.SphereGeometry(90, 32, 16),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { uTempo: { value: 0 } },
      vertexShader: "varying vec3 d; void main(){ d = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `varying vec3 d; uniform float uTempo;
        float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
        void main(){
          float y = clamp(d.y, 0.0, 1.0);
          vec3 c = mix(vec3(0.09,0.14,0.3), vec3(0.01,0.02,0.07), pow(y, 0.6));
          // Aurora suave esverdeada.
          float a = sin(d.x * 6.0 + uTempo * 0.15) * 0.5 + 0.5;
          c += vec3(0.05, 0.25, 0.18) * a * smoothstep(0.15, 0.45, y) * smoothstep(0.8, 0.4, y) * 0.5;
          vec3 g = floor(d * 260.0);
          float e = step(0.9975, h(g)) * (0.6 + 0.4 * sin(uTempo * 2.0 + h(g + 1.0) * 30.0));
          c += vec3(e) * smoothstep(0.05, 0.25, y);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  scene.add(ceu);
  const lua = new T.Mesh(new T.SphereGeometry(2.2, 32, 16), new T.MeshBasicMaterial({ color: "#f3f1e2", fog: false }));
  lua.position.set(-22, 26, -60);
  scene.add(lua);

  scene.add(new T.HemisphereLight("#6f8fd8", "#20232e", 0.9));
  const luar = new T.DirectionalLight("#a9c2ff", 1.6);
  luar.position.set(-10, 18, 8);
  luar.target.position.set(3, 0, 0);
  luar.castShadow = true;
  luar.shadow.camera.left = luar.shadow.camera.bottom = -14;
  luar.shadow.camera.right = luar.shadow.camera.top = 14;
  luar.shadow.mapSize.set(2048, 2048);
  scene.add(luar, luar.target);

  // Chão nevado com leve relevo; uma faixa de gelo reflete as luzes.
  const relevo = texturaNeveChao();
  const chaoGeo = new T.PlaneGeometry(120, 120, 120, 120),
    pc = chaoGeo.attributes.position;
  for (let i = 0; i < pc.count; i++) {
    const x = pc.getX(i),
      y = pc.getY(i);
    pc.setZ(i, Math.sin(x * 0.35) * Math.cos(y * 0.3) * 0.12 + Math.sin(x * 1.3 + y) * 0.03);
  }
  chaoGeo.computeVertexNormals();
  const chao = new T.Mesh(
    chaoGeo,
    new T.MeshStandardMaterial({ color: "#e9effa", roughness: 0.55, bumpMap: relevo, bumpScale: 0.6 }),
  );
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  chao.userData.semNeve = true;
  scene.add(chao);
  // Lago congelado com reflexo em tempo real (Alto/Ultra) das luzes, da árvore e da turma.
  const gelo = criarSuperficieReflexiva(new T.CircleGeometry(4.6, 64), { cor: "#9fbde6", forca: 0.85, distorcao: 0.0025 });
  gelo.rotation.x = -Math.PI / 2;
  gelo.position.set(3.4, 0.06, -1.6);
  gelo.receiveShadow = true;
  scene.add(gelo);

  // Casas ao fundo.
  const cores = ["#7a4b3a", "#3f5a6e", "#6e6b4a", "#8a3f3f", "#4a6b55", "#6b4f7a"];
  const casas = [];
  for (let i = 0; i < 8; i++) {
    const casa = criarCasa(4.5 + (i % 3) * 0.8, 4 + ((i * 5) % 4), cores[i % cores.length], ["#ffb35c", "#ffd27f", "#ff9b4a"][i % 3]);
    const a = -0.95 + i * 0.27;
    casa.position.set(Math.sin(a) * 19 + 3, 0, -Math.cos(a) * 19 - 2);
    casa.rotation.y = -a;
    scene.add(casa);
    casas.push(casa);
  }
  // Varais de luzes entre as casas.
  const varais = [];
  for (let i = 0; i < casas.length - 1; i++) {
    const a = casas[i].position,
      b = casas[i + 1].position;
    const v = criarVaralDeLuzes([a.x, 4.2, a.z + 2], [b.x, 4.2, b.z + 2], 18, 0.8);
    scene.add(v);
    varais.push(v);
  }
  const arcoLuz = criarVaralDeLuzes([-3, 5.5, -6], [9, 5.5, -6], 34, 1.6);
  scene.add(arcoLuz);

  const arvore = criarArvoreNatal(7.5);
  arvore.position.set(5.2, 0, -7);
  scene.add(arvore);
  const boneco = criarBonecoDeNeve(1.7);
  boneco.position.set(7.4, 0, -1.2);
  boneco.rotation.y = -0.6;
  scene.add(boneco);
  for (const [x, z, r] of [[-1.2, 1.5, 0.3], [9.2, -2, -0.4]]) {
    const b = criarBengalaDoce(1.3);
    b.position.set(x, 0, z);
    b.rotation.y = r;
    scene.add(b);
  }
  for (let i = 0; i < 5; i++) {
    const p = criarPresente(0.28 + (i % 3) * 0.08, i + 2);
    p.position.set(5.4 + i * 0.45, 0, 1.6 - (i % 2) * 0.5);
    p.rotation.y = i * 0.7;
    scene.add(p);
  }
  for (const x of [-2.5, 9.8]) {
    const poste = criarPoste();
    poste.position.set(x, 0, -0.5);
    scene.add(poste);
  }
  // Montinhos de neve.
  const neveMat = new T.MeshStandardMaterial({ color: "#eef3ff", roughness: 0.6 });
  for (let i = 0; i < 18; i++) {
    const m = new T.Mesh(new T.SphereGeometry(0.6 + (i % 4) * 0.35, 20, 12), neveMat);
    m.scale.y = 0.35;
    m.position.set(-6 + ((i * 7) % 22), 0, -3 - ((i * 3) % 9));
    m.receiveShadow = true;
    scene.add(m);
  }

  // A turma, de touca.
  const axel = criarAxel(),
    cachorro = criarCachorro(),
    maicon = criarMaicon(),
    brita = criarPessoa();
  axel.group.position.set(3.0, 0, 1.4);
  axel.group.rotation.y = -0.35;
  axel.group.scale.setScalar(1.15);
  cachorro.group.position.set(4.3, 0, 2.0);
  cachorro.group.rotation.y = -0.7;
  maicon.group.position.set(1.6, 0, -0.4);
  maicon.group.rotation.y = 0.1;
  brita.group.position.set(5.6, 0, 0.2);
  brita.group.rotation.y = -0.8;
  scene.add(axel.group, cachorro.group, maicon.group, brita.group);

  const neve = criarNeve({ quantidade: 3200, area: 30, altura: 14 });
  scene.add(neve);
  return { scene, gelo, ceu, axel, cachorro, maicon, brita, arvore, varais, arcoLuz, inicio: null };
}

export function desenharMenuNatal(view, estado, time) {
  const n = view.menuScene.natal;
  n.inicio ??= time;
  const t = estado.reduced ? 0 : time - n.inicio;
  n.ceu.material.uniforms.uTempo.value = time;
  n.gelo.userData.reflexoAtivo = estado.quality === "high" || estado.quality === "ultra";
  animarNatal(n.scene, time);
  // Axel anda de um lado para o outro e para: o líquido balança na freada.
  const ciclo = (t % 9) / 9,
    passo = ciclo < 0.35 ? ciclo / 0.35 : ciclo < 0.5 ? 1 : ciclo < 0.85 ? 1 - (ciclo - 0.5) / 0.35 : 0,
    suave = passo * passo * (3 - 2 * passo),
    andando = (ciclo < 0.35 || (ciclo > 0.5 && ciclo < 0.85)) && !estado.reduced;
  n.axel.group.position.x = 2.4 + suave * 1.4;
  n.axel.group.rotation.y = andando ? (ciclo < 0.5 ? Math.PI / 2 : -Math.PI / 2) : -0.35;
  n.axel.animate(time, andando ? 3 : 0);
  n.cachorro.animate(time, 0);
  n.maicon.animate(time, 0, true);
  n.maicon.head.rotation.y = Math.sin(time * 0.5) * 0.25;
  n.brita.head.rotation.set(Math.sin(time * 1.3) * 0.05, Math.sin(time * 0.6) * 0.2, 0);
  n.brita.arms[0].rotation.set(-0.4 + Math.sin(time * 4) * 0.5, 0, 0.25 + Math.sin(time * 4) * 0.2); // acenando
  // Câmera em travelling lento.
  const cam = view.camera;
  cam.position.set(-0.5 + Math.sin(time * 0.08) * 0.8, 2.1 + Math.sin(time * 0.11) * 0.15, 8.6);
  cam.lookAt(3.2, 1.7, -1.5);
  cam.fov = 50;
  cam.far = 200;
  cam.updateProjectionMatrix();
  view.renderer.toneMappingExposure = 1.05;
  view.renderer.render(n.scene, cam);
}
