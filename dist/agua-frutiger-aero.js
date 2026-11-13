// Água com ondas, normais analíticas, refração suave e reflexo planar quando vista por cima.
import * as T from "./vendor/three.module.js";
export function criarAguaAero() {
  const alvo = new T.WebGLRenderTarget(512, 512, { type: T.HalfFloatType });
  const material = new T.ShaderMaterial({
    side: T.DoubleSide,
    transparent: true,
    depthWrite: false,
    uniforms: {
      tempo: { value: 0 },
      reflexo: { value: alvo.texture },
      matrizReflexo: { value: new T.Matrix4() },
      temReflexo: { value: 0 },
    },
    vertexShader: `uniform float tempo;uniform mat4 matrizReflexo;varying vec3 mundo;varying vec3 normalAgua;varying vec4 pontoReflexo;
 void main(){vec3 p=position;float x=p.x,z=p.y;p.z+=sin(x*.19+tempo*.8)*.24+sin(z*.27-tempo*.65)*.14+sin((x+z)*.6+tempo)*.035;
 vec4 m=modelMatrix*vec4(p,1.);mundo=m.xyz;normalAgua=normalize(vec3(-cos(x*.19+tempo*.8)*.045,1.,-cos(z*.27-tempo*.65)*.038));pontoReflexo=matrizReflexo*m;gl_Position=projectionMatrix*viewMatrix*m;}`,
    fragmentShader: `uniform float tempo;uniform float temReflexo;uniform sampler2D reflexo;varying vec3 mundo;varying vec3 normalAgua;varying vec4 pontoReflexo;
 void main(){vec3 v=normalize(cameraPosition-mundo);vec3 n=normalAgua;if(v.y<0.)n=-n;float f=pow(1.-max(dot(v,n),0.),4.);
 vec3 ceu=mix(vec3(.08,.52,.79),vec3(.63,.9,1.),f);vec2 uv=pontoReflexo.xy/pontoReflexo.w+normalAgua.xz*.018;
 vec3 refletido=texture2D(reflexo,clamp(uv,vec2(.002),vec2(.998))).rgb;ceu=mix(ceu,refletido,temReflexo*.65);
 float brilho=pow(max(dot(reflect(-normalize(vec3(-.35,.85,-.25)),n),v),0.),180.);
 vec3 cor=mix(vec3(.025,.47,.63),ceu,.26+f*.65)+brilho*vec3(1.,.96,.72)*2.;float opacidade=v.y<0.?.38:.54+f*.3;
 gl_FragColor=vec4(cor,opacidade);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,
  });
  const malha = new T.Mesh(new T.PlaneGeometry(480, 480, 160, 160), material);
  malha.rotation.x = -Math.PI / 2;
  malha.position.y = 28;
  malha.name = "Oceano_Aero_ondas_reflexo_refracao";
  const camera = new T.PerspectiveCamera(),
    matriz = new T.Matrix4().set(
      0.5,
      0,
      0,
      0.5,
      0,
      0.5,
      0,
      0.5,
      0,
      0,
      0.5,
      0.5,
      0,
      0,
      0,
      1,
    );
  let quadro = 0;
  return {
    malha,
    alvo,
    atualizar(renderer, cena, cam, tempo) {
      material.uniforms.tempo.value = tempo;
      if (cam.position.y < 28 || ++quadro % 5 !== 0) return;
      camera.copy(cam);
      camera.position.copy(cam.position);
      camera.position.y = 56 - cam.position.y;
      const direcao = cam.getWorldDirection(new T.Vector3());
      direcao.y *= -1;
      camera.up.set(0, -1, 0);
      camera.lookAt(camera.position.clone().add(direcao));
      camera.updateMatrixWorld();
      material.uniforms.matrizReflexo.value
        .copy(matriz)
        .multiply(camera.projectionMatrix)
        .multiply(camera.matrixWorldInverse);
      const anterior = renderer.getRenderTarget(),
        recorte = renderer.clippingPlanes;
      malha.visible = false;
      try {
        renderer.clippingPlanes = [new T.Plane(new T.Vector3(0, 1, 0), -27.8)];
        renderer.setRenderTarget(alvo);
        renderer.render(cena, camera);
        material.uniforms.temReflexo.value = 1;
      } finally {
        malha.visible = true;
        renderer.clippingPlanes = recorte;
        renderer.setRenderTarget(anterior);
      }
    },
  };
}
export function criarMaterialCausticas() {
  return new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { tempo: { value: 0 } },
    vertexShader:
      "varying vec2 p;void main(){p=uv*140.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `uniform float tempo;varying vec2 p;void main(){vec2 q=p+vec2(sin(p.y*.6+tempo*.4),cos(p.x*.7-tempo*.3));float a=abs(sin(q.x+sin(q.y))),b=abs(sin(q.y+cos(q.x)));float brilho=pow(max(0.,1.-min(a,b)),12.);gl_FragColor=vec4(.45,.98,1.,brilho*.22);}`,
  });
}
