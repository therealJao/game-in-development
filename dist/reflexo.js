import * as T from "./vendor/three.module.js";

/**
 * Reflexo planar em tempo real (superfícies espelhadas como gelo, piso polido e água parada).
 * Renderiza a cena vista de uma câmera espelhada em uma textura e a projeta na superfície,
 * com distorção leve, Fresnel e mistura com a cor de base. Só roda nos perfis Alto/Ultra;
 * nos outros a superfície usa apenas o reflexo de ambiente (barato).
 */
export function criarSuperficieReflexiva(geometria, { cor = "#9fb8d8", forca = 0.65, resolucao = 0.5, distorcao = 0.004 } = {}) {
  const alvo = new T.WebGLRenderTarget(512, 512, { type: T.HalfFloatType });
  const camEspelho = new T.PerspectiveCamera();
  const material = new T.ShaderMaterial({
    uniforms: {
      ...T.UniformsUtils.clone(T.UniformsLib.fog),
      tDiffuse: { value: alvo.texture },
      textureMatrix: { value: new T.Matrix4() },
      uCor: { value: new T.Color(cor) },
      uForca: { value: forca },
      uTempo: { value: 0 },
      uDistorcao: { value: distorcao },
      uAtivo: { value: 1 },
    },
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUvRef; varying vec3 vMundo; varying vec3 vNormal;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec4 mundo = modelMatrix * vec4(position, 1.0);
        vMundo = mundo.xyz; vNormal = normalize(mat3(modelMatrix) * normal);
        vUvRef = textureMatrix * vec4(position, 1.0);
        vec4 mvPosition = viewMatrix * mundo;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 uCor; uniform float uForca; uniform float uTempo; uniform float uDistorcao; uniform float uAtivo;
      varying vec4 vUvRef; varying vec3 vMundo; varying vec3 vNormal;
      #include <common>
      #include <fog_pars_fragment>
      void main(){
        vec2 ruido = vec2(sin(vMundo.x * 9.0 + uTempo * 0.6), cos(vMundo.z * 8.0 - uTempo * 0.5)) * uDistorcao;
        vec4 uv = vUvRef; uv.xy += ruido * uv.w;
        vec3 refl = texture2DProj(tDiffuse, uv).rgb;
        vec3 olho = normalize(cameraPosition - vMundo);
        float fresnel = 0.25 + 0.75 * pow(1.0 - max(dot(olho, normalize(vNormal)), 0.0), 3.0);
        vec3 cor = mix(uCor * 0.35, refl, clamp(uForca * fresnel * uAtivo, 0.0, 1.0));
        cor += uCor * 0.08;
        gl_FragColor = vec4(cor, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    fog: true,
  });
  const malha = new T.Mesh(geometria, material);
  malha.name = "Superficie_reflexiva";
  malha.receiveShadow = true;
  const plano = new T.Plane(),
    normal = new T.Vector3(),
    posEspelho = new T.Vector3(),
    posCamera = new T.Vector3(),
    rot = new T.Matrix4(),
    alvoLook = new T.Vector3(0, 0, -1),
    clip = new T.Vector4(),
    vista = new T.Vector3(),
    alvoPos = new T.Vector3(),
    q = new T.Vector4(),
    matTex = material.uniforms.textureMatrix.value;
  let renderizando = false;
  malha.userData.reflexoAtivo = true;
  malha.onBeforeRender = (renderer, cena, camera) => {
    material.uniforms.uTempo.value = performance.now() / 1000;
    const ligado = malha.userData.reflexoAtivo && !renderer.xr?.isPresenting;
    material.uniforms.uAtivo.value = ligado ? 1 : 0;
    if (!ligado || renderizando) return;
    posEspelho.setFromMatrixPosition(malha.matrixWorld);
    posCamera.setFromMatrixPosition(camera.matrixWorld);
    rot.extractRotation(malha.matrixWorld);
    normal.set(0, 0, 1).applyMatrix4(rot);
    vista.subVectors(posEspelho, posCamera);
    if (vista.dot(normal) > 0) return; // câmera atrás do espelho
    vista.reflect(normal).negate().add(posEspelho);
    rot.extractRotation(camera.matrixWorld);
    alvoLook.set(0, 0, -1).applyMatrix4(rot).add(posCamera);
    alvoPos.subVectors(posEspelho, alvoLook).reflect(normal).negate().add(posEspelho);
    camEspelho.position.copy(vista);
    camEspelho.up.set(0, 1, 0).applyMatrix4(rot).reflect(normal);
    camEspelho.lookAt(alvoPos);
    camEspelho.far = camera.far;
    camEspelho.updateMatrixWorld();
    camEspelho.projectionMatrix.copy(camera.projectionMatrix);
    matTex.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    matTex.multiply(camEspelho.projectionMatrix).multiply(camEspelho.matrixWorldInverse).multiply(malha.matrixWorld);
    // Plano de corte oblíquo: nada abaixo da superfície aparece no reflexo.
    plano.setFromNormalAndCoplanarPoint(normal, posEspelho).applyMatrix4(camEspelho.matrixWorldInverse);
    clip.set(plano.normal.x, plano.normal.y, plano.normal.z, plano.constant);
    const pm = camEspelho.projectionMatrix;
    q.x = (Math.sign(clip.x) + pm.elements[8]) / pm.elements[0];
    q.y = (Math.sign(clip.y) + pm.elements[9]) / pm.elements[5];
    q.z = -1.0;
    q.w = (1.0 + pm.elements[10]) / pm.elements[14];
    clip.multiplyScalar(2.0 / clip.dot(q));
    pm.elements[2] = clip.x;
    pm.elements[6] = clip.y;
    pm.elements[10] = clip.z + 1.0;
    pm.elements[14] = clip.w;
    const tamanho = renderer.getDrawingBufferSize(new T.Vector2());
    const w = Math.max(128, Math.floor(tamanho.x * resolucao)),
      h = Math.max(128, Math.floor(tamanho.y * resolucao));
    if (alvo.width !== w || alvo.height !== h) alvo.setSize(w, h);
    malha.visible = false;
    renderizando = true;
    const alvoAnterior = renderer.getRenderTarget(),
      xr = renderer.xr.enabled,
      sombras = renderer.shadowMap.autoUpdate;
    renderer.xr.enabled = false;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(alvo);
    renderer.state.buffers.depth.setMask(true);
    if (renderer.autoClear === false) renderer.clear();
    renderer.render(cena, camEspelho);
    renderer.xr.enabled = xr;
    renderer.shadowMap.autoUpdate = sombras;
    renderer.setRenderTarget(alvoAnterior);
    renderizando = false;
    malha.visible = true;
  };
  return malha;
}

/** Liga/desliga todos os reflexos planares de uma cena conforme o perfil gráfico. */
export function ajustarReflexos(cena, qualidade) {
  const ligado = qualidade === "high" || qualidade === "ultra";
  cena?.traverse((o) => {
    if (o.name === "Superficie_reflexiva") o.userData.reflexoAtivo = ligado;
  });
}
