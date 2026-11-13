import { acaoPix, formatarReais, NOME_NAV } from "./regras-alisabank.js";
const e = (id) => document.getElementById(id);
export function atualizarCelularPix(f, executar) {
  const p = f.pix,
    dialog = e("celularPix");
  if (f.etapa !== "pagamento") {
    if (dialog.open) dialog.close();
    return;
  }
  if (!dialog.open) dialog.showModal();
  if (dialog.__pix !== p) {
    dialog.__pix = p;
    dialog.dataset.telaPix = "";
  }
  const chave = p.tela + ":" + p.pago;
  if (dialog.dataset.telaPix === chave) return;
  dialog.dataset.telaPix = chave;
  const tela = e("telaAlisaBank");
  tela.replaceChildren();
  tela.className = "tela-alisabank tela-" + p.tela;
  const bloco = (tag, texto, classe, parent = tela) => {
    const el = document.createElement(tag);
    el.textContent = texto;
    if (classe) el.className = classe;
    parent.append(el);
    return el;
  };
  const botao = (texto, acao, classe = "bank-primary", parent = tela) => {
    const b = bloco("button", texto, classe, parent);
    b.type = "button";
    b.addEventListener("click", () => {
      if (!dialog.open || dialog.__pix !== p || f.etapa !== "pagamento") return;
      if (acaoPix(p, acao)) executar(acao);
    });
    return b;
  };
  if (p.tela === "inicio") {
    bloco("div", "19:10", "hora-celular");
    const app = botao("a\nAlisaBank", "banco", "icone-alisabank");
    app.setAttribute("aria-label", "Abrir AlisaBank");
    bloco("p", "Naverdachi · celular", "nome-celular");
  } else {
    if (!p.pago) botao("‹", "voltar", "bank-back");
    if (p.tela === "conta") {
      const header = bloco("header", "", "bank-header");
      bloco("span", "a", "bank-logo", header);
      bloco("p", "Olá, " + NOME_NAV, "bank-nome", header);
      bloco("small", "AlisaBank · conta do jogo", "", header);
      bloco("h3", "Conta", "bank-title");
      bloco("strong", formatarReais(p.saldo), "bank-balance");
      const linha = bloco("div", "", "bank-actions");
      botao("◇\nPix", "pix", "bank-action", linha);
      for (const t of ["▥\nPagar", "⇄\nTransferir", "▣\nDepositar"]) {
        const b = bloco("button", t, "bank-action", linha);
        b.type = "button";
        b.disabled = true;
      }
      bloco("div", "▣  Meus cartões", "bank-card");
      bloco("h3", "Cartão de crédito", "bank-title");
      bloco("p", "Fatura atual", "bank-muted");
      bloco("strong", "R$ 1.094,80", "bank-balance");
      bloco("p", "Limite disponível: R$ 730,00", "bank-muted");
    } else if (p.tela === "pix") {
      bloco("h2", "Área Pix", "bank-title");
      bloco("p", "Envie e receba pagamentos pelo AlisaBank.", "bank-muted");
      botao("▦  Escanear QR code", "escanear");
      bloco("p", "O lanche de vocês: R$ 67,00", "bank-note");
    } else if (p.tela === "camera") {
      bloco("h2", "Escanear QR code", "bank-title");
      const c = bloco("canvas", "", "camera-pix");
      c.id = "cameraPix";
      c.width = c.height = 400;
      const alvo = bloco("div", "", "alvo-qr");
      alvo.setAttribute("aria-hidden", "true");
      const msg = bloco("p", "Enquadre o cartão do Lula.", "bank-note");
      msg.id = "statusCameraPix";
      const controles = bloco("div", "", "camera-controles");
      for (const [texto, dx, dy] of [
        ["←", -0.07, 0],
        ["↑", 0, 0.07],
        ["↓", 0, -0.07],
        ["→", 0.07, 0],
      ]) {
        const b = bloco("button", texto, "bank-secondary", controles);
        b.type = "button";
        b.setAttribute("aria-label", "Ajustar câmera " + texto);
        b.addEventListener("click", () => {
          p.miraX = Math.max(-0.5, Math.min(0.5, p.miraX + dx));
          p.miraY = Math.max(-0.4, Math.min(0.4, p.miraY + dy));
        });
      }
      bloco("small", "Câmera do jogo · aponte para o QR code", "camera-nota");
    } else if (p.tela === "confirmar") {
      bloco("h2", "Confira o Pix", "bank-title");
      bloco("strong", formatarReais(p.valor), "bank-value");
      bloco("p", "Para Ponto Kente Lanches", "bank-recipient");
      bloco("p", "Lanches de Axel e Naverdachi", "bank-muted");
      bloco("div", "Origem: conta de " + NOME_NAV, "bank-card");
      botao("Confirmar pagamento", "pagar");
      bloco(
        "small",
        "Pagamento cenográfico · sem transferência real",
        "bank-simulation",
      );
    } else if (p.tela === "comprovante") {
      bloco("div", "✓", "bank-check");
      bloco("h2", "Pix realizado", "bank-title");
      bloco("strong", formatarReais(p.valor), "bank-value");
      bloco("p", "Ponto Kente Lanches", "bank-recipient");
      bloco("p", "Pago por " + NOME_NAV, "bank-muted");
      bloco(
        "div",
        "Comprovante\n" + p.id + "\nPedido da dupla · valor total R$ 67,00",
        "bank-card",
      );
      botao("Mostrar comprovante ao Lula", "mostrar");
      bloco("small", "Comprovante fictício do jogo", "bank-simulation");
    }
  }
  tela.querySelector("button")?.focus();
}
