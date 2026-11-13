# Castelo, terraço e prévia Frutiger Aero — 2.12

## Percurso

A viagem de barco mantém 10 segundos. A fortaleza agora fica numa colina, cercada por montanhas, com torres, pináculos, janelas e céu dourado de nuvens. Os escudos do Corinthians e Vasco permanecem no céu durante a travessia. A chegada mostra a subida até a fortaleza antes de devolver o controle dentro do salão.

No salão, Lula e Bolsonaro trocam socos e arremessam um ao outro numa animação de paródia sem ferimentos gráficos. Ctrl ou círculo/B alterna agachar. Contorne a briga pelas laterais e evite correr.

A escadaria tem lances mais largos, altura de colisão sincronizada com os degraus e patamares planos separados. Davy Jones e Little Tail circulam nas galerias laterais, sem ocupar o caminho principal. Little Tail mantém o uniforme Bulls 23 e o arremesso da bola de basquete. CJ espera no patamar do portal.

Há dois exercícios: link HTML para um id da página e seletor de classe CSS com cor de texto e fundo. Cada painel apresenta objetivo, código e três soluções plausíveis. A explicação permanece aberta após o acerto; pressione ENTENDI · CONTINUAR quando terminar de ler. A simulação fica pausada durante a atividade.

## Cutscene do terraço

O portal leva ao terraço. Gabriel Breier estala os dedos, o céu muda para o dia, duas bolas baseadas na Brazuca são colocadas no piso e toca o áudio do vídeo fornecido. Depois da fala, as bolas superaquecem; peças do castelo, personagens e objetos são lançados pelo ar, e Axel cai no mar. A sequência é automática, em 3D, sem exigir movimento do jogador.

Na versão 2.14, a queda no mar continua na fase Frutiger Aero: cidade recriada a partir das referências do AeroShore, resgate por Naverdachi e futebol na arena aquática. Consulte FASE-FRUTIGER-AERO.md. O antigo retorno ao resgate não é mais o destino deste portal.

## Arquivos para editar

| Arquivo | Conteúdo |
| --- | --- |
| `dist/regras-castelo.js` | Rota, alturas dos degraus, furtividade, perguntas e tempos da cutscene |
| `dist/castelo.js` | Salão, escadaria, visitantes, briga e câmeras de chegada |
| `dist/paisagem-castelo.js` | Colina, montanhas, fachada, torres e céu dourado compartilhados |
| `dist/terraco-castelo.js` | Terraço, estalo, bolas, explosão, queda e prévia subaquática |
| `dist/personagens-castelo.js` | Gabriel, políticos, visitantes, bolas e importação do CJ |
| `dist/alisanave.js` | Viagem de barco e transição da iluminação do porto para o castelo |
| `dist/assets/breier-fala.m4a` | Fala extraída do vídeo enviado, sem voz sintetizada |

As malhas são interpretações estilizadas das referências em 3D, não digitalizações fotorrealistas. Os arremessos e destroços usam trajetórias balísticas animadas; não há simulação estrutural de destruição.

Para editar, salve os arquivos de `dist`, feche e reabra o mesmo Escape-Code.exe. Mantenha `dist` ao lado dele. Alterações de HTML, CSS e JavaScript não exigem recompilar.

### Revisão de bugs

As animações do castelo usam o relógio da simulação e congelam na pausa ou nos painéis. A fala de Davy para quando CJ assume a conversa. Respostas do castelo pontuam apenas uma vez, inclusive com cliques duplos. A audição do salão acompanha a posição dos personagens na briga. Um carregamento pendente não retorna à fase caso o jogador já tenha saído dela. Validação: 50 testes automatizados.
