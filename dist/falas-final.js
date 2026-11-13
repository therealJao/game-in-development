export const FALAS_FINAL = [
  [
    "clayRevela",
    0.4,
    "revela",
    "NARRADOR",
    "O homem entre as poltronas não é um espectador. A pele cede como barro. É Clayface. Ele estava seguindo Axel desde o mercado.",
  ],
  [
    "clayRevela",
    11.5,
    "ameaca",
    "CLAYFACE",
    "Eu posso usar qualquer rosto. Agora eu vou pegar você, Axel!",
  ],
  [
    "cinemaEscapar",
    0.4,
    "brecha",
    "AXEL",
    "A saída está bloqueada! Tem uma abertura na parede do fundo. Eu preciso chegar lá!",
  ],
  [
    "clayCaptura",
    0.2,
    "captura",
    "CLAYFACE",
    "Não adianta correr. Eu sei o caminho que você vai escolher.",
  ],
  [
    "peppaEntrada",
    0.4,
    "peppa",
    "AXEL",
    "Eu passei pela parede... Que lugar é esse? Parece um desenho da Peppa. Eu não quero ficar aqui.",
  ],
  [
    "peppaExplorar",
    0.5,
    "paineis",
    "NARRADOR",
    "A porta ao fundo está sem energia. Dois painéis ainda respondem. Reative os dois. Os passos do outro lado da parede continuam.",
  ],
  [
    "level94Chegada",
    0.5,
    "colinas",
    "NARRADOR",
    "Do outro lado, o Level noventa e quatro. Casas iguais, colinas verdes e nenhuma pessoa na rua. O céu parece pintado.",
  ],
  [
    "level94Explorar",
    0.5,
    "bilhete",
    "AXEL",
    "Tem um bilhete naquela cerca. Talvez alguém tenha deixado um caminho para sair.",
  ],
  [
    "level94Olhar",
    0.2,
    "olhar",
    "AXEL",
    "Espera... Eu conheço esses passos. Não. Não, não, não! Ele está correndo pra cá!",
  ],
  [
    "level94Fuga",
    0.3,
    "correr",
    "NARRADOR",
    "A figura perdeu o disfarce. Clayface corre pelas colinas. A casa nove está com a luz acesa. Corra até a porta.",
  ],
  [
    "level94Captura",
    0.2,
    "colinas-captura",
    "NARRADOR",
    "A sombra alcançou Axel. Mas a porta ainda está ali. Tente outra vez.",
  ],
  [
    "casaEntrada",
    0.4,
    "simpsons",
    "NARRADOR",
    "A porta se fecha. Na sala, os Simpsons estão sentados diante da televisão. Ninguém se vira. Ninguém pergunta de onde Axel veio.",
  ],
  [
    "casaExplorar",
    0.5,
    "sala",
    "AXEL",
    "Homer? Marge? Vocês conseguem me ouvir? A televisão está fora de sintonia...",
  ],
  [
    "casaTrailer",
    0.5,
    "trailer",
    "NARRADOR",
    "A imagem volta. Um trailer de Fortnite passa na televisão. Por alguns instantes, tudo parece normal.",
  ],
  [
    "casaPlantao",
    0.4,
    "plantao",
    "NARRADOR",
    "O sinal falha. A programação é interrompida por um plantão.",
  ],
  [
    "casaNoticia",
    0.5,
    "noticia",
    "PLANTÃO FICTÍCIO",
    "Interrompemos esta transmissão fictícia com uma notícia deste universo do jogo. Davy Jones morreu após receber a notícia de mais um adiamento de GTA seis. Esta é uma paródia.",
  ],
  [
    "casaLuto",
    0.5,
    "chuva",
    "NARRADOR",
    "A sala fica em silêncio. Homer abaixa a cabeça. Todos parecem sentir a mesma tristeza. Lá fora começa a chover. Axel ainda precisa voltar.",
  ],
  [
    "casaSaida",
    0.5,
    "sair",
    "AXEL",
    "Eu sinto muito. Mas eu não posso ficar. Eu preciso encontrar o Brita.",
  ],
  [
    "portalAbertura",
    0.5,
    "portal",
    "NARRADOR",
    "Um clarão roxo corta a chuva. Um portal se abre. Do outro lado, Axel reconhece as pedras do calabouço.",
  ],
  [
    "retornoBiz",
    0.5,
    "biz",
    "AXEL",
    "A Biz está aqui! A chave deve estar naquela caixa. Se eu conseguir falar com o Brita, eu devolvo e saio desse pesadelo.",
  ],
  [
    "telefoneBiz",
    0.4,
    "telefone",
    "NARRADOR",
    "Com a Biz recuperada, Axel pega o celular. Abra o aplicativo de telefone, escolha Brita e faça a ligação.",
  ],
  [
    "ligacaoBrita",
    2,
    "ligacao-axel",
    "AXEL",
    "Brita? Sou eu, Axel. Eu encontrei a sua Biz. Estou voltando. Onde você está?",
  ],
  [
    "ligacaoBrita",
    12,
    "ligacao-brita",
    "BRITA",
    "Axel! Até que enfim! Estou na estrada, depois das três placas azuis. Vai com calma. Eu estou esperando você.",
  ],
  [
    "ligacaoBrita",
    23,
    "ligacao-volto",
    "AXEL",
    "Eu vou devolver ela inteira. Depois eu te conto tudo.",
  ],
  [
    "entregaBiz",
    0.5,
    "entrega",
    "AXEL",
    "Brita! Aqui está a sua Biz. Eu prometi que ia trazer de volta.",
  ],
  [
    "entregaBiz",
    7,
    "obrigado",
    "BRITA",
    "Você conseguiu, meu parceiro. Eu já estava achando que não ia te ver de novo. Obrigado por não desistir.",
  ],
  [
    "entregaBiz",
    17,
    "fim",
    "NARRADOR",
    "Axel devolveu a Biz. Depois de corredores impossíveis, mundos estranhos e uma longa viagem, ele finalmente reencontrou o amigo. Desta vez, o caminho leva para casa.",
  ],
];
export function falaFinal(f) {
  return FALAS_FINAL.filter((v) => v[0] === f.etapa && v[1] <= f.tempo).at(-1);
}
export function sonsFinal(f) {
  const l = falaFinal(f),
    a = [];
  if (l)
    a.push(["final-" + l[2], "assets/final/falas/" + l[2] + ".wav", 1, false]);
  if (
    [
      "peppaEntrada",
      "peppaExplorar",
      "level94Chegada",
      "level94Explorar",
      "level94Olhar",
      "level94Fuga",
    ].includes(f.etapa)
  )
    a.push([
      "final-level94",
      "assets/final/level94.mp3",
      f.etapa === "level94Fuga" ? 0.16 : 0.3,
      true,
    ]);
  return a;
}
