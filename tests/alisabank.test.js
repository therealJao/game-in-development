import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {
  criarEstadoPix,
  acaoPix,
  reconhecerQrPix,
  QR_PONTO_KENTE,
  VALOR_LANCHE,
  NOME_NAV,
} from "../dist/regras-alisabank.js";
import {
  criarEstadoAero,
  atualizarAero,
} from "../dist/regras-frutiger-aero.js";
function ler(p, qr = QR_PONTO_KENTE) {
  for (let i = 0; i < 3; i++) reconhecerQrPix(p, qr, 0.2);
}
test("Pix percorre app, área Pix, câmera, confirmação e comprovante com débito único", () => {
  const p = criarEstadoPix();
  assert.equal(acaoPix(p, "pagar"), false);
  for (const a of ["banco", "pix", "escanear"])
    assert.equal(acaoPix(p, a), true);
  ler(p);
  assert.equal(p.tela, "confirmar");
  assert.equal(p.valor, 6700);
  assert.equal(acaoPix(p, "pagar"), true);
  assert.equal(p.saldo, 128998);
  assert.equal(acaoPix(p, "pagar"), false);
  assert.equal(p.saldo, 128998);
  assert.equal(acaoPix(p, "mostrar"), true);
  assert.equal(acaoPix(p, "mostrar"), false);
  assert.equal(NOME_NAV, "Naverdachi da Silva Pereira");
});
test("QR de valor ou origem diferentes não libera o pagamento", () => {
  const p = criarEstadoPix();
  p.tela = "camera";
  ler(p, QR_PONTO_KENTE.replace("6700", "6800"));
  assert.equal(p.qrLido, false);
  assert.equal(p.tela, "camera");
  assert.equal(acaoPix(p, "pagar"), false);
  ler(p);
  assert.equal(p.valor, VALOR_LANCHE);
});
test("leitura interrompida precisa reenquadrar o cartão; voltar preserva o saldo", () => {
  const p = criarEstadoPix();
  p.tela = "camera";
  reconhecerQrPix(p, QR_PONTO_KENTE, 0.2);
  reconhecerQrPix(p, null, 0.2);
  assert.equal(p.leitura, 0);
  assert.equal(acaoPix(p, "voltar"), true);
  assert.equal(p.tela, "pix");
  assert.equal(p.saldo, 135698);
});
test("o PNG do QR tem matriz legível pela mesma biblioteca usada no render 3D", () => {
  const ref = JSON.parse(
    fs.readFileSync(
      new URL("../dist/assets/alisabank/qr-matriz.json", import.meta.url),
    ),
  );
  const n = ref.matriz.length,
    escala = 7,
    w = n * escala,
    data = new Uint8ClampedArray(w * w * 4);
  for (let y = 0; y < w; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4,
        v = ref.matriz[Math.floor(y / escala)][Math.floor(x / escala)]
          ? 0
          : 255;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  const modulo = { exports: {} };
  const ctx = vm.createContext({ module: modulo, exports: modulo.exports });
  vm.runInContext(
    fs.readFileSync(new URL("../dist/vendor/jsQR.js", import.meta.url), "utf8"),
    ctx,
  );
  assert.equal(modulo.exports(data, w, w).data, QR_PONTO_KENTE);
});
test("sem comprovante mostrado a dupla fica no caixa; só depois segue ao carro e praia", () => {
  const f = criarEstadoAero("lanchoneteFinal");
  atualizarAero(f, 18.1);
  assert.equal(f.etapa, "lanchonetePagar");
  atualizarAero(f, 9.1);
  assert.equal(f.etapa, "pagamento");
  atualizarAero(f, 500);
  assert.equal(f.etapa, "pagamento");
  f.pix.tela = "camera";
  ler(f.pix);
  acaoPix(f.pix, "pagar");
  atualizarAero(f, 100);
  assert.equal(f.etapa, "pagamento");
  acaoPix(f.pix, "mostrar");
  atualizarAero(f, 0.1);
  assert.equal(f.etapa, "agradecimento");
  atualizarAero(f, 6.1);
  assert.equal(f.etapa, "saidaPonto");
  atualizarAero(f, 10.1);
  assert.equal(f.etapa, "viagemPraia");
  atualizarAero(f, 12.1);
  assert.equal(f.etapa, "praiaChegada");
});
