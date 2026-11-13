// Paisagem compartilhada pela viagem e pelo terraço. Tudo é geometria 3D.
import * as T from "./vendor/three.module.js";
import {
  criarCaixa,
  criarCilindro,
  criarMalha,
  criarElipsoide,
  obterMaterial,
} from "./modelos.js";

export function criarCeuDourado(cena) {
  const material = new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    uniforms: { tempo: { value: 0 }, dia: { value: 0 } },
    vertexShader:
      "varying vec3 direcao;void main(){direcao=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: `uniform float tempo;uniform float dia;varying vec3 direcao;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fb(vec2 p){return .54*n(p)+.27*n(p*2.03)+.13*n(p*4.09)+.06*n(p*8.1);}
    void main(){vec3 d=normalize(direcao);float y=max(d.y,0.);vec2 p=d.xz/(.45+y)*2.5+vec2(tempo*.005,0.);
    float nuvem=fb(p),recorte=smoothstep(.38,.72,nuvem);float sol=pow(max(dot(d,normalize(vec3(-.4,.22,.6))),0.),18.);
    // Pôr do sol: horizonte pêssego/laranja, alto do céu azul, nuvens rosadas iluminadas por baixo.
    vec3 dourado=mix(vec3(1.0,.62,.32),vec3(.22,.42,.72),smoothstep(.0,.55,y));
    dourado=mix(dourado,vec3(1.0,.80,.55),smoothstep(.12,.0,y)*.6);
    vec3 nuvemCor=mix(vec3(1.0,.58,.45),vec3(.92,.86,.95),smoothstep(.05,.45,y));
    dourado=mix(dourado,nuvemCor,recorte*.7*smoothstep(.02,.2,y));dourado+=vec3(1.,.7,.35)*(sol*.9+pow(1.-abs(nuvem-.48)*2.,12.)*.25);
    vec3 claro=mix(vec3(.64,.88,1.),vec3(.025,.34,.86),pow(y,.6));claro=mix(claro,vec3(1.),recorte*.75);
    gl_FragColor=vec4(mix(dourado,claro,dia),1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
  });
  const ceu = new T.Mesh(new T.SphereGeometry(650, 40, 24), material);
  ceu.name = "Ceu_dourado_nuvens_volumetricas_estilizadas";
  cena.add(ceu);
  return ceu;
}
function torre(pai, x, z, raio, altura, pedra, telha) {
  criarCilindro(pai, raio * 0.86, raio, altura, pedra, [x, altura / 2, z]);
  criarCilindro(pai, raio * 1.08, raio * 1.08, 0.65, pedra, [
    x,
    altura - 0.1,
    z,
  ]);
  criarMalha(pai, new T.ConeGeometry(raio * 1.22, raio * 3.6, 16), telha, [
    x,
    altura + raio * 1.8,
    z,
  ]);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    criarCaixa(pai, [0.48, 0.85, 0.48], pedra, [
      x + Math.cos(a) * raio,
      altura + 0.4,
      z + Math.sin(a) * raio,
    ]);
  }
  for (let y = 1.7; y < altura; y += 3.4)
    criarCilindro(pai, raio * 0.94 + 0.1, raio * 0.94 + 0.1, 0.12, pedra, [
      x,
      y,
      z,
    ]);
  for (let y = 3; y < altura - 2; y += 3.4) {
    criarCaixa(
      pai,
      [0.45, 1.2, 0.08],
      obterMaterial("#553d1c", 0.4, 0, {
        emissive: "#ffb952",
        emissiveIntensity: 0.4,
      }),
      [x, y, z - raio * 1.01],
    );
  }
}
export function criarFortalezaColina({
  montanha = true,
  terraco = false,
} = {}) {
  const grupo = new T.Group(),
    fortaleza = new T.Group();
  grupo.add(fortaleza);
  const pedra = obterMaterial("#b5a17a", 0.94),
    telha = obterMaterial("#344d55", 0.73, 0.12);
  if (montanha) {
    const g = new T.CylinderGeometry(39, 83, 40, 56, 12),
      p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i),
        a = Math.atan2(z, x);
      const r =
        1 +
        0.06 * Math.sin(a * 7 + y * 0.12) +
        0.035 * Math.cos(a * 13 - y * 0.3);
      p.setXYZ(i, x * r, y, z * r);
    }
    g.computeVertexNormals();
    criarMalha(grupo, g, obterMaterial("#677451", 1), [0, 17, 0]);
    // Rochas e socalcos ligam o cais à fortaleza no alto da colina.
    for (let i = 0; i < 35; i++) {
      const a = i * 2.39996,
        r = 46 + (i % 5) * 5;
      criarMalha(
        grupo,
        new T.DodecahedronGeometry(4 + (i % 3), 0),
        obterMaterial(i % 2 ? "#7d8165" : "#647268", 1),
        [Math.cos(a) * r, 2 + (i % 4), Math.sin(a) * r],
      );
    }
    for (let i = 0; i < 30; i++) {
      const a = -Math.PI / 2 - i * 0.035,
        r = 68 - i * 0.95;
      criarCaixa(
        grupo,
        [4, 0.8, 3.1],
        pedra,
        [Math.cos(a) * r, i * 1.3, Math.sin(a) * r],
        [0, -a, 0],
      );
    }
    fortaleza.position.y = 37;
    for (let i = 0; i < 13; i++) {
      const a = i * 2.4,
        r = 112 + (i % 3) * 25,
        g = new T.PlaneGeometry(70, 72, 20, 20);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position,
        cores = [];
      for (let j = 0; j < p.count; j++) {
        const x = p.getX(j),
          z = p.getZ(j),
          borda = Math.max(0, 1 - Math.hypot(x / 40, z / 42));
        const y =
          borda *
          (36 + (i % 4) * 8) *
          (1 +
            0.24 * Math.sin(x * 0.24 + z * 0.16) +
            0.13 * Math.cos(z * 0.4 - x * 0.18));
        p.setY(j, y);
        const cor = new T.Color(
          y > 22 ? "#9b9a83" : y > 9 ? "#6d7960" : "#3f6547",
        );
        cores.push(cor.r, cor.g, cor.b);
      }
      g.setAttribute("color", new T.Float32BufferAttribute(cores, 3));
      g.computeVertexNormals();
      criarMalha(
        grupo,
        g,
        new T.MeshStandardMaterial({
          vertexColors: true,
          roughness: 1,
          side: T.DoubleSide,
        }),
        [Math.cos(a) * r, -3, 45 + Math.sin(a) * r],
        [0, a, 0],
      );
    }
  }
  criarCaixa(fortaleza, [66, 2, 51], pedra, [0, 0, 0]);
  for (const x of [-29, 29])
    criarCaixa(fortaleza, [2, 14, 46], pedra, [x, 7, 0]);
  for (const z of [-23, 23])
    criarCaixa(fortaleza, [58, 14, 2], pedra, [0, 7, z]);
  for (const x of [-29, 29])
    for (const z of [-23, 23]) torre(fortaleza, x, z, 3.5, 20, pedra, telha);
  for (const z of [-23, 23])
    for (let x = -26; x <= 26; x += 2.7)
      criarCaixa(fortaleza, [1.2, 1.1, 1.2], pedra, [x, 14.5, z]);
  // Aglomeração de torres, contrafortes e pináculos da silhueta de referência.
  criarCaixa(fortaleza, [27, 23, 19], pedra, [0, 12, 1]);
  if (!terraco)
    criarMalha(
      fortaleza,
      new T.ConeGeometry(20, 12, 4),
      telha,
      [0, 29, 1],
      [0, Math.PI / 4, 0],
      [1, 0.7, 0.7],
    );
  for (const [x, z, r, h] of [
    [-10, -4, 3.2, 34],
    [8, 2, 3.8, 43],
    [0, 8, 3, 36],
    [18, -7, 2.8, 29],
    [-20, 8, 2.6, 26],
    [0, -12, 2.3, 47],
  ])
    torre(fortaleza, x, z, r, h, pedra, telha);
  for (let i = 0; i < 12; i++) {
    const x = -23 + i * 4.2;
    criarCaixa(fortaleza, [1.4, 13, 2], pedra, [x, 6.5, -21]);
    criarCaixa(fortaleza, [0.8, 2.4, 0.12], obterMaterial("#332f28", 1), [
      x,
      9,
      -23.6,
    ]);
  }
  criarCaixa(
    fortaleza,
    [5, 8, 0.4],
    obterMaterial("#302e26", 0.9),
    [0, 4, -24.2],
  );
  const moldura = obterMaterial("#d2bc87", 0.8),
    escuro = obterMaterial("#302c22", 0.6, 0, {
      emissive: "#ae7331",
      emissiveIntensity: 0.22,
    });
  for (const z of [-24.06, 24.06])
    for (let x = -24; x <= 24; x += 4.5) {
      if (Math.abs(x) < 3) continue;
      criarCaixa(fortaleza, [1.25, 3.4, 0.18], moldura, [x, 8.5, z]);
      criarCaixa(fortaleza, [0.88, 2.8, 0.2], escuro, [
        x,
        8.6,
        z + (z < 0 ? -0.12 : 0.12),
      ]);
      criarCaixa(fortaleza, [0.09, 2.8, 0.22], moldura, [
        x,
        8.6,
        z + (z < 0 ? -0.24 : 0.24),
      ]);
    }
  for (let x = -10; x <= 10; x += 4)
    for (let y = 5; y <= 20; y += 5) {
      criarCaixa(fortaleza, [1.4, 2.8, 0.18], moldura, [x, y, -8.6]);
      criarCaixa(fortaleza, [1, 2.4, 0.2], escuro, [x, y, -8.72]);
    }
  if (montanha) {
    for (let i = 0; i < 80; i++) {
      const a = i * 2.39996,
        r = 60 + (i % 8) * 4,
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (z < -20 && Math.abs(x) < 12) continue;
      criarCilindro(grupo, 0.22, 0.3, 2.5, obterMaterial("#5e4c31", 0.95), [
        x,
        1.5,
        z,
      ]);
      criarMalha(
        grupo,
        new T.ConeGeometry(1.4, 5.5, 7),
        obterMaterial(i % 2 ? "#294c31" : "#3f6136", 0.95),
        [x, 5, z],
      );
    }
  }
  grupo.name = "Castelo_pinaculos_colina_modelado";
  return { grupo, fortaleza };
}
