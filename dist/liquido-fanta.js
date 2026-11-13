import * as T from "./vendor/three.module.js";

/**
 * Líquido da garrafa de Fanta do Axel.
 * O nível é um plano no espaço do MUNDO: se a garrafa inclinar, o refrigerante continua na horizontal.
 * Uma mola amortecida inclina o plano quando a garrafa acelera, freia, gira ou pula (sloshing).
 * A superfície é desenhada pelas faces internas (back faces), com espuma clara na borda do nível.
 * Tudo é atualizado em onBeforeRender, então funciona em qualquer cena onde o Axel aparecer.
 */
const tmp = new T.Vector3(),
  tmp2 = new T.Vector3(),
  tmpQ = new T.Quaternion(),
  eixo = new T.Vector3();

export function criarLiquidoFanta(perfil, parent, { base = 0.22, nivel = 1.18 } = {}) {
  const uniforms = {
    uNivel: { value: 0 },
    uCentro: { value: new T.Vector3() },
    uInclina: { value: new T.Vector2() },
    uEspuma: { value: 0.03 },
    uTempo: { value: 0 },
    uOndas: { value: 0 },
  };
  const material = new T.MeshPhysicalMaterial({
    color: "#ff4d00",
    roughness: 0.06,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
    emissive: "#b33000",
    emissiveIntensity: 0.42,
    side: T.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vMundoLiquido;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvMundoLiquido = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vMundoLiquido;
        uniform float uNivel; uniform vec3 uCentro; uniform vec2 uInclina;
        uniform float uEspuma; uniform float uTempo; uniform float uOndas;
        float alturaSuperficie(vec3 p){
          vec2 d = p.xz - uCentro.xz;
          float ondas = sin(d.x * 38.0 + uTempo * 7.0) * cos(d.y * 33.0 - uTempo * 6.0);
          return uNivel + dot(uInclina, d) + ondas * uOndas;
        }`,
      )
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
        float distSuperficie = vMundoLiquido.y - alturaSuperficie(vMundoLiquido);
        if (distSuperficie > 0.0) discard;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        bool topoLiquido = !gl_FrontFacing;
        if (topoLiquido) diffuseColor.rgb = vec3(0.9, 0.26, 0.0);
        // Espuma: anel fino onde o líquido encosta no plástico; no topo, só manchas quando agitado.
        float espuma = topoLiquido
          ? smoothstep(0.55, 0.95, sin(vMundoLiquido.x * 90.0 + uTempo * 2.0) * sin(vMundoLiquido.z * 85.0) * 0.5 + 0.5) * clamp(uOndas * 60.0, 0.0, 0.6)
          : smoothstep(-uEspuma, 0.0, distSuperficie);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.86, 0.62), espuma * 0.7);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        if (topoLiquido) totalEmissiveRadiance += vec3(0.22, 0.05, 0.0);
        totalEmissiveRadiance += vec3(0.25, 0.18, 0.1) * espuma;`,
      );
  };
  material.customProgramCacheKey = () => "liquido-fanta-v1";
  // Clones (ex.: escurecimento do menu noturno) continuam usando o mesmo shader.
  material.clone = () => material;

  const pontos = perfil
    .filter((p) => p.y <= nivel + 0.18)
    .map((p) => new T.Vector2(Math.max(0.001, p.x * 0.93), Math.max(0.012, p.y)));
  const malha = new T.Mesh(new T.LatheGeometry(pontos, 48), material);
  malha.position.y = base;
  malha.name = "Fanta_liquido";
  malha.renderOrder = 1;
  parent.add(malha);

  // Bolhas de gás subindo, também cortadas pelo nível.
  const qtd = 46,
    pos = new Float32Array(qtd * 3),
    fase = new Float32Array(qtd);
  for (let i = 0; i < qtd; i++) {
    const a = i * 2.39996,
      r = 0.04 + ((i * 37) % 17) / 17 * 0.17;
    pos.set([Math.cos(a) * r, 0, Math.sin(a) * r], i * 3);
    fase[i] = ((i * 53) % 97) / 97;
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(pos, 3));
  geo.setAttribute("fase", new T.BufferAttribute(fase, 1));
  const bolhaMat = new T.ShaderMaterial({
    uniforms: { ...uniforms, uAltura: { value: nivel }, uEscala: { value: 1 } },
    transparent: true,
    depthWrite: false,
    vertexShader: `attribute float fase; uniform float uTempo; uniform float uAltura; uniform float uEscala;
      varying vec3 vMundo;
      void main(){
        vec3 p = position;
        float f = fract(fase + uTempo * (0.12 + fase * 0.1));
        p.y = 0.05 + f * uAltura;
        p.x += sin(uTempo * 3.0 + fase * 20.0) * 0.01;
        vec4 m = modelMatrix * vec4(p, 1.0);
        vMundo = m.xyz;
        vec4 mv = viewMatrix * m;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.0 + fase * 1.6) * uEscala * 40.0 / max(-mv.z, 0.3);
      }`,
    fragmentShader: `uniform float uNivel; uniform vec3 uCentro; uniform vec2 uInclina;
      varying vec3 vMundo;
      void main(){
        if (vMundo.y > uNivel + dot(uInclina, vMundo.xz - uCentro.xz) - 0.01) discard;
        vec2 c = gl_PointCoord - 0.5; float d = length(c);
        if (d > 0.5) discard;
        float anel = smoothstep(0.5, 0.35, d) - smoothstep(0.3, 0.0, d) * 0.6;
        gl_FragColor = vec4(1.0, 0.92, 0.75, anel * 0.8);
      }`,
  });
  bolhaMat.clone = () => bolhaMat;
  const bolhas = new T.Points(geo, bolhaMat);
  bolhas.position.y = base;
  bolhas.renderOrder = 2;
  bolhas.frustumCulled = false;
  parent.add(bolhas);

  // Física simples: mola amortecida movida pela aceleração e pelo giro da garrafa.
  const estado = {
    anterior: null,
    velAnterior: new T.Vector3(),
    yawAnterior: null,
    inclina: new T.Vector2(),
    velInclina: new T.Vector2(),
    agito: 0,
    tempoAnterior: 0,
  };
  malha.onBeforeRender = () => {
    const agora = performance.now() / 1000;
    let dt = estado.tempoAnterior ? agora - estado.tempoAnterior : 1 / 60;
    if (dt <= 0) return; // Já atualizado neste quadro (ex.: reflexos).
    estado.tempoAnterior = agora;
    dt = Math.min(dt, 0.05);
    malha.updateWorldMatrix(true, false);
    malha.getWorldPosition(tmp);
    const escala = tmp2.setFromMatrixScale(malha.matrixWorld).y;
    if (!estado.anterior) estado.anterior = tmp.clone();
    const vel = tmp2.copy(tmp).sub(estado.anterior).divideScalar(dt);
    if (vel.lengthSq() > 2500) vel.set(0, 0, 0); // Teleporte entre cenas: ignora.
    const acel = vel.clone().sub(estado.velAnterior).divideScalar(dt);
    acel.clampLength(0, 40);
    estado.velAnterior.copy(vel);
    estado.anterior.copy(tmp);
    // Giro em torno do eixo vertical também agita o líquido.
    malha.getWorldQuaternion(tmpQ);
    eixo.set(0, 0, 1).applyQuaternion(tmpQ);
    const yaw = Math.atan2(eixo.x, eixo.z);
    let giro = 0;
    if (estado.yawAnterior !== null) {
      giro = yaw - estado.yawAnterior;
      if (giro > Math.PI) giro -= Math.PI * 2;
      if (giro < -Math.PI) giro += Math.PI * 2;
      giro /= dt;
    }
    estado.yawAnterior = yaw;
    const k = 140,
      amortecimento = 5.5,
      forca = 0.012 / Math.max(escala, 0.2);
    const alvoX = THREE_clamp(acel.x * forca, -2.5, 2.5),
      alvoZ = THREE_clamp(acel.z * forca, -2.5, 2.5);
    estado.velInclina.x += (-k * estado.inclina.x - amortecimento * estado.velInclina.x - alvoX * k * 0.04) * dt;
    estado.velInclina.y += (-k * estado.inclina.y - amortecimento * estado.velInclina.y - alvoZ * k * 0.04) * dt;
    estado.velInclina.x += Math.sin(agora * 2.1) * giro * 0.02;
    estado.velInclina.y += Math.cos(agora * 2.1) * giro * 0.02;
    estado.inclina.addScaledVector(estado.velInclina, dt);
    estado.inclina.clampLength(0, 0.75);
    estado.agito = Math.min(
      1,
      estado.agito * Math.exp(-dt * 1.6) + (acel.length() * 0.0006 + Math.min(Math.abs(giro), 6) * 0.004) * dt * 20,
    );
    // Nível no mundo: ponto do eixo da garrafa na altura de enchimento.
    tmp2.set(0, nivel, 0);
    malha.localToWorld(tmp2);
    uniforms.uNivel.value = tmp2.y + Math.min(0, acel.y * 0.0015) * escala;
    uniforms.uCentro.value.copy(tmp2);
    uniforms.uInclina.value.copy(estado.inclina);
    uniforms.uOndas.value = (0.0015 + estado.agito * 0.008) * escala;
    uniforms.uEspuma.value = (0.012 + estado.agito * 0.025) * escala;
    uniforms.uTempo.value = agora;
    bolhaMat.uniforms.uEscala.value = escala;
  };
  return { malha, bolhas, uniforms };
}

function THREE_clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
