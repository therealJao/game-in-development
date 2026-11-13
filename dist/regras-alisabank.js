// Banco fictício usado exclusivamente na história. Não contém chave Pix real nem conexão bancária.
export const VALOR_LANCHE = 6700;
export const QR_PONTO_KENTE = "ALISABANK:PIX:PK-0001:6700";
export const NOME_NAV = "Naverdachi da Silva Pereira";
export function criarEstadoPix() {
  return {
    tela: "inicio",
    saldo: 135698,
    valor: 0,
    qrLido: false,
    pago: false,
    comprovanteMostrado: false,
    id: null,
    miraX: 0.1,
    miraY: 0.02,
    leitura: 0,
    mensagem: "",
  };
}
export function acaoPix(p, acao) {
  if (acao === "banco" && p.tela === "inicio") {
    p.tela = "conta";
    return true;
  }
  if (acao === "pix" && p.tela === "conta") {
    p.tela = "pix";
    return true;
  }
  if (acao === "escanear" && p.tela === "pix") {
    p.tela = "camera";
    p.leitura = 0;
    p.mensagem = "Enquadre o QR code do Ponto Kente.";
    return true;
  }
  if (
    acao === "pagar" &&
    p.tela === "confirmar" &&
    p.qrLido &&
    !p.pago &&
    p.valor === VALOR_LANCHE &&
    p.saldo >= p.valor
  ) {
    p.saldo -= p.valor;
    p.pago = true;
    p.id = "EC-PK0001-006700";
    p.tela = "comprovante";
    return true;
  }
  if (
    acao === "mostrar" &&
    p.tela === "comprovante" &&
    p.pago &&
    !p.comprovanteMostrado
  ) {
    p.comprovanteMostrado = true;
    return true;
  }
  if (acao === "voltar" && !p.pago) {
    const anterior = {
      conta: "inicio",
      pix: "conta",
      camera: "pix",
      confirmar: "pix",
    }[p.tela];
    if (anterior) {
      p.tela = anterior;
      p.leitura = 0;
      return true;
    }
  }
  return false;
}
export function reconhecerQrPix(p, texto, dt) {
  if (p.tela !== "camera" || p.pago) return false;
  if (texto !== QR_PONTO_KENTE) {
    p.leitura = 0;
    return false;
  }
  p.leitura += Math.max(0, Math.min(0.3, dt));
  if (p.leitura < 0.55) return false;
  p.qrLido = true;
  p.valor = VALOR_LANCHE;
  p.tela = "confirmar";
  p.mensagem = "QR code reconhecido. Confira os dados do pagamento.";
  return true;
}
export function formatarReais(centavos) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
