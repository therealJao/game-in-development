// Gamepad API padrão do Windows/WebView2: DualSense, DualShock e controles compatíveis.
export function eixoComZonaMorta(valor = 0, zona = 0.18) {
  return Math.abs(valor) <= zona
    ? 0
    : Math.sign(valor) * Math.min(1, (Math.abs(valor) - zona) / (1 - zona));
}
export class ControlesGamepad {
  constructor() {
    this.indice = null;
    this.anteriores = new Set();
  }
  ler(lista = []) {
    const controle =
      Array.from(lista).find((c) => c?.connected && c.mapping === "standard") ||
      Array.from(lista).find((c) => c?.connected);
    if (!controle) {
      const desconectou = this.indice !== null;
      this.indice = null;
      this.anteriores.clear();
      return {
        conectado: false,
        desconectou,
        x: 0,
        y: 0,
        olharX: 0,
        olharY: 0,
        novos: [],
      };
    }
    if (this.indice !== controle.index) {
      this.anteriores.clear();
      this.indice = controle.index;
    }
    const atuais = new Set(
      controle.buttons
        .map((b, i) => (b.pressed || b.value > 0.55 ? i : -1))
        .filter((i) => i >= 0),
    );
    const novos = [...atuais].filter((i) => !this.anteriores.has(i));
    this.anteriores = atuais;
    return {
      conectado: true,
      nome: controle.id,
      x: eixoComZonaMorta(controle.axes[0]),
      y: eixoComZonaMorta(controle.axes[1]),
      olharX: eixoComZonaMorta(controle.axes[2], 0.14),
      olharY: eixoComZonaMorta(controle.axes[3], 0.14),
      novos,
    };
  }
}
