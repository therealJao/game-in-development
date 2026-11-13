import * as T from "./vendor/three.module.js";
import { perfilGrafico } from "./qualidade-grafica.js";

/** HDR, oclusão por profundidade e brilho suave. O HUD é desenhado fora deste passe. */
export class EfeitosVisuais {
  constructor(renderer) {
    this.renderer = renderer;
    this.alvo = new T.WebGLRenderTarget(1, 1, {
      depthBuffer: true,
      type: T.HalfFloatType,
    });
    this.alvo.texture.colorSpace = T.LinearSRGBColorSpace;
    this.alvo.depthTexture = new T.DepthTexture(1, 1, T.UnsignedIntType);
    this.material = new T.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      toneMapped: true,
      uniforms: {
        imagem: { value: this.alvo.texture },
        profundidade: { value: this.alvo.depthTexture },
        pixel: { value: new T.Vector2(1, 1) },
        inversa: { value: new T.Matrix4() },
        oclusao: { value: 0.68 },
        brilho: { value: 0.09 },
      },
      vertexShader:
        "varying vec2 uvTela;void main(){uvTela=uv;gl_Position=vec4(position.xy,0.0,1.0);}",
      fragmentShader: `uniform sampler2D imagem; uniform sampler2D profundidade;uniform vec2 pixel;uniform mat4 inversa;uniform float oclusao;uniform float brilho;varying vec2 uvTela;
        vec3 posicao(vec2 uv){float d=texture2D(profundidade,uv).r;vec4 p=inversa*vec4(uv*2.0-1.0,d*2.0-1.0,1.0);return p.xyz/max(p.w,.00001);}
        void main(){vec3 cor=texture2D(imagem,uvTela).rgb;float d=texture2D(profundidade,uvTela).r;
          vec3 p=posicao(uvTela);vec3 n=normalize(cross(dFdx(p),dFdy(p)));if(dot(n,-p)<0.0)n=-n;
          float sombra=0.0;
          if(oclusao>0.0&&d<.9999){float raio=clamp(110.0/max(-p.z,1.0),3.0,32.0);
            for(int i=0;i<12;i++){float a=float(i)*2.39996;float r=sqrt((float(i)+.5)/12.0);
              vec2 uv=clamp(uvTela+vec2(cos(a),sin(a))*pixel*raio*r,pixel,vec2(1.0)-pixel);
              vec3 delta=posicao(uv)-p;float distancia=length(delta);
              sombra+=max(dot(n,delta/max(distancia,.0001))-.08,0.0)*(1.0-smoothstep(.03,.85,distancia));
            }
          }
          cor*=clamp(1.0-sombra*oclusao*.24,.52,1.0);
          vec3 halo=vec3(0.0);
          for(int i=0;i<12;i++){float a=float(i)*2.39996;float r=3.0+float(i)*1.1;
            vec3 amostra=texture2D(imagem,uvTela+vec2(cos(a),sin(a))*pixel*r).rgb;
            halo+=max(amostra-vec3(1.0),vec3(0.0));}
          cor+=halo*(brilho/12.0);
          float borda=smoothstep(.28,.88,length((uvTela-.5)*vec2(1.1,1.0)));cor*=1.0-borda*.10;
          gl_FragColor=vec4(max(cor,0.0),1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.cena = new T.Scene();
    this.camera = new T.Camera();
    this.cena.add(new T.Mesh(new T.PlaneGeometry(2, 2), this.material));
    this.definirQualidade("ultra");
  }
  definirQualidade(nome) {
    const p = perfilGrafico(nome),
      tipo = p.hdr ? T.HalfFloatType : T.UnsignedByteType;
    if (this.alvo.texture.type !== tipo || this.alvo.samples !== p.amostras) {
      this.alvo.dispose();
      this.alvo.texture.type = tipo;
      this.alvo.samples = Math.min(
        p.amostras,
        this.renderer.capabilities.maxSamples || 4,
      );
    }
    this.material.uniforms.oclusao.value = p.oclusao;
    this.material.uniforms.brilho.value = p.brilho;
    // No perfil baixo o pós-processamento é desligado: desenho direto na tela.
    this.ativo = nome !== "low";
  }
  iniciar() {
    if (this.ativo === false || this.renderer.xr?.isPresenting) return;
    const tamanho = this.renderer.getDrawingBufferSize(new T.Vector2());
    if (this.alvo.width !== tamanho.x || this.alvo.height !== tamanho.y)
      this.alvo.setSize(tamanho.x, tamanho.y);
    this.material.uniforms.pixel.value.set(1 / tamanho.x, 1 / tamanho.y);
    this.renderer.setRenderTarget(this.alvo);
  }
  concluir(camera) {
    if (this.ativo === false || this.renderer.xr?.isPresenting) return;
    this.material.uniforms.inversa.value.copy(camera.projectionMatrixInverse);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.cena, this.camera);
  }
}

/** Água com ondas nos vértices, reflexo de céu, Fresnel e cáusticas animadas. */
export function criarAgua(largura, comprimento, cor = "#167b82") {
  const material = new T.ShaderMaterial({
    uniforms: {
      tempo: { value: 0 },
      noite: { value: 0 },
      tom: { value: new T.Color(cor) },
    },
    vertexShader: `uniform float tempo; varying vec3 mundo; varying vec2 ponto;
    void main(){vec3 p=position;p.z+=sin(p.x*2.1+tempo*1.8)*.024+cos(p.y*2.7-tempo*1.4)*.018;
      vec4 m=modelMatrix*vec4(p,1.0);mundo=m.xyz;ponto=p.xy;gl_Position=projectionMatrix*viewMatrix*m;}`,
    fragmentShader: `uniform float tempo; uniform float noite; uniform vec3 tom; varying vec3 mundo; varying vec2 ponto;
    void main(){float onda=sin(ponto.x*1.7+sin(ponto.y*1.1+tempo))*cos(ponto.y*2.3-tempo*1.2);
      float detalhe=1.0-smoothstep(8.0,80.0,length(cameraPosition-mundo));
      vec3 normal=normalize(vec3(sin(ponto.x*.55+tempo)*.07*detalhe,1.0,cos(ponto.y*.65-tempo)*.07*detalhe));
      vec3 vista=normalize(cameraPosition-mundo);float fresnel=pow(1.0-abs(dot(vista,normal)),3.0);
      float sol=pow(max(dot(reflect(-normalize(vec3(-.4,.8,.3)),normal),vista),0.0),55.0)*detalhe;
      vec3 cor=mix(tom,vec3(.66,.86,.93),fresnel*.75)+max(0.0,onda-.62)*.20*(1.0-smoothstep(12.0,70.0,length(cameraPosition-mundo)))+sol*.8;
      cor*=mix(1.0,.16,noite);gl_FragColor=vec4(cor,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
  const agua = new T.Mesh(
    new T.PlaneGeometry(largura, comprimento, 80, 80),
    material,
  );
  agua.rotation.x = -Math.PI / 2;
  agua.name = "Agua_com_ondas_shader";
  return agua;
}

export function criarCeu(cena) {
  const material = new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    uniforms: { tempo: { value: 0 }, noite: { value: 0 } },
    vertexShader:
      "varying vec3 direcao;void main(){direcao=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader:
      `uniform float tempo;uniform float noite;varying vec3 direcao;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float ruido(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){vec3 d=normalize(direcao);float h=max(d.y,0.0);
      vec3 cor=mix(vec3(.82,.91,.96),vec3(.13,.44,.77),pow(h,.55));
      vec2 p=d.xz/max(.13,h)*2.5+vec2(tempo*.012,0.0);
      float nuvem=ruido(p)+.5*ruido(p*2.0)+.25*ruido(p*4.0);
      cor=mix(cor,vec3(.98,.97,.92),smoothstep(.87,1.27,nuvem)*smoothstep(.04,.25,h)*.8);
      cor+=vec3(1.0,.85,.6)*pow(max(dot(d,normalize(vec3(-.4,.6,-.5))),0.0),450.0);
      vec3 noturno=mix(vec3(.025,.035,.06),vec3(.006,.012,.033),h);
      float estrelas=step(.9975,hash(floor(d.xz/max(.1,h)*420.0)))*smoothstep(.1,.5,h);
      noturno+=estrelas*.6+pow(max(dot(d,normalize(vec3(-.5,.5,-.6))),0.0),1200.0)*vec3(.6,.7,.95);
      cor=mix(cor,noturno,noite);
      gl_FragColor=vec4(cor,1.0);#include <colorspace_fragment>}`.replace(
        ";#include",
        ";\n#include",
      ),
  });
  const ceu = new T.Mesh(new T.SphereGeometry(650, 32, 20), material);
  ceu.name = "Ceu_gradiente_nuvens_shader";
  cena.add(ceu);
  return ceu;
}
