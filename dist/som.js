// Módulo do jogo. Consulte GUIA-DE-EDICAO.md antes de alterar estruturas.
export /* Áudio do jogo: efeitos, volume e trecho de coleta. */
class Som {
  constructor() {
    this.volume = 0.6;
    this.enabled = true;
    this.ctx = null;
    this.master = null;
    this.hum = null;
  }
  atualizarYang(distancia) {
    if (!this.yangAudio) {
      this.yangAudio = new Audio("assets/yang-ming-som.m4a");
      this.yangAudio.loop = true;
    }
    const volume = this.enabled
      ? Math.max(0, 1 - distancia / 30) * this.volume * 0.6
      : 0;
    this.yangAudio.volume = volume;
    if (volume > 0.01) this.yangAudio.play().catch(() => {});
    else this.yangAudio.pause();
  }
  pararYang() {
    this.yangAudio?.pause();
  }
  tocarPatadaYang(forca = 1) {
    this.tocarTom(68, 0.22, 0.28 * forca, "sine", 24);
    this.tocarRuido(0.11, 0.19 * forca, 260);
  }
  tocarArquivo(nome, arquivo, volume = 1, repetir = false) {
    this.arquivos ??= {};
    let audio = this.arquivos[nome];
    if (!audio) {
      audio = new Audio(arquivo);
      audio.preload = "auto";
      this.arquivos[nome] = audio;
    }
    audio.ganhoJogo = volume;
    audio.loop = repetir;
    audio.volume = this.enabled
      ? Math.max(0, Math.min(1, this.volume * volume))
      : 0;
    if (audio.paused && (repetir || !audio.ended)) audio.play().catch(() => {});
  }
  pararArquivo(nome) {
    this.arquivos?.[nome]?.pause();
  }
  reiniciarArquivo(nome) {
    const a = this.arquivos?.[nome];
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
  }
  atualizarArquivos() {
    for (const a of Object.values(this.arquivos || {}))
      a.volume = this.enabled
        ? Math.min(1, this.volume * (a.ganhoJogo ?? 1))
        : 0;
  }
  iniciar() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume * 0.35;
      this.master.connect(this.ctx.destination);
      this.hum = this.ctx.createOscillator();
      this.hum.type = "sine";
      this.hum.frequency.value = 49;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.035;
      this.hum.connect(gain);
      gain.connect(this.master);
      this.hum.start();
    }
    this.ctx.resume();
  }
  alternarSom() {
    this.enabled = !this.enabled;
    if (this.master)
      this.master.gain.setTargetAtTime(
        this.enabled ? this.volume * 0.35 : 0,
        this.ctx.currentTime,
        0.1,
      );
    return this.enabled;
  }
  tocarTom(f, duration = 0.2, volume = 0.1, type = "sine", end = f) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + duration);
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + duration);
  }
  tocarRuido(duration = 0.3, volume = 0.15, frequency = 400) {
    if (!this.ctx || !this.enabled) return;
    const n = Math.floor(this.ctx.sampleRate * duration),
      b = this.ctx.createBuffer(1, n, this.ctx.sampleRate),
      a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource(),
      filter = this.ctx.createBiquadFilter(),
      gain = this.ctx.createGain();
    filter.type = "lowpass";
    filter.frequency.value = frequency;
    gain.gain.value = volume;
    src.buffer = b;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();
  }
  async carregarSomColeta() {
    try {
      const response = await fetch("assets/gta-collect.wav");
      if (response.ok) this.collectBytes = await response.arrayBuffer();
    } catch {}
  }
  pararSomColeta() {
    this.collectGeneration = (this.collectGeneration || 0) + 1;
    if (this.collectSource) {
      try {
        this.collectSource.stop();
      } catch {}
      this.collectSource = null;
    }
  }
  async tocarSomColeta() {
    if (!this.ctx || !this.enabled || !this.collectBytes) return;
    this.pararSomColeta();
    const generation = this.collectGeneration;
    try {
      this.collectBufferPromise ||= this.ctx.decodeAudioData(
        this.collectBytes.slice(0),
      );
      const buffer = await this.collectBufferPromise;
      if (generation !== this.collectGeneration || !this.enabled) return;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.master);
      this.collectSource = source;
      source.start();
    } catch {}
  }
  tocarPasso(running = false) {
    this.tocarRuido(0.08, running ? 0.12 : 0.065, 220);
    this.tocarTom(running ? 105 : 87, 0.07, 0.035, "sine", 45);
  }
  tocarPassoPerseguidor(lado = 0, distancia = 10) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx,
      t = ctx.currentTime,
      pan = ctx.createStereoPanner(),
      gain = ctx.createGain(),
      osc = ctx.createOscillator();
    pan.pan.value = Math.max(-1, Math.min(1, lado));
    const volume = Math.max(0.018, 0.22 * (1 - Math.min(25, distancia) / 27));
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(105, t);
    osc.frequency.exponentialRampToValueAtTime(33, t + 0.17);
    osc.connect(gain);
    gain.connect(pan);
    pan.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.2);
  }
  tocarBatimento() {
    this.tocarTom(57, 0.12, 0.13, "sine", 32);
    setTimeout(() => this.tocarTom(47, 0.12, 0.09, "sine", 28), 150);
  }
  tocarAmeaca() {
    this.tocarRuido(1.4, 0.28, 950);
    this.tocarTom(160, 1.1, 0.08, "sawtooth", 32);
  }
  tocarImpacto() {
    this.tocarRuido(1.3, 0.48, 1900);
    this.tocarTom(65, 1.8, 0.27, "sawtooth", 23);
  }
  tocarLatido() {
    this.tocarTom(380, 0.1, 0.06, "sawtooth", 140);
    setTimeout(() => this.tocarRuido(0.12, 0.07, 900), 90);
  }
  tocarAcerto() {
    this.tocarTom(480, 0.18, 0.09);
    setTimeout(() => this.tocarTom(720, 0.25, 0.08), 130);
  }
}
