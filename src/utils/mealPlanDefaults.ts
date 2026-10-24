import type { PlanoSemanalConteudo, DiaPlano } from '../types/paciente'

export const DIAS_DA_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
]

export const REFEICOES_LABELS: Record<string, string> = {
  cafe_da_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
}

export function createEmptyWeeklyPlan(): PlanoSemanalConteudo {
  const plano_semanal: DiaPlano[] = DIAS_DA_SEMANA.map((dia) => ({
    dia,
    refeicoes: {
      cafe_da_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', ''],
    },
  }))
  return { plano_semanal }
}

export function createDefaultManualWeeklyPlan(_pacienteNome?: string): PlanoSemanalConteudo {
  const plano_semanal: DiaPlano[] = [
    {
      dia: 'Segunda-feira',
      refeicoes: {
        cafe_da_manha: [
          '2 ovos mexidos com azeite de oliva e orégano',
          '1 fatia de pão integral tostado ou cuscuz de milho',
          '1 xícara de café preto ou com leite desnatado/vegetal sem açúcar',
          '1 porção de fruta fresca (mamão papaya ou banana-prata)',
          '1 colher de sobremesa de sementes de chia ou linhaça',
        ],
        lanche_manha: [
          '1 maçã nacional ou pera higienizada com casca',
          '4 unidades de castanha-do-pará ou 6 amêndoas torradas',
          '1 copo (250ml) de água ou chá verde natural',
          '1 pote pequeno de iogurte natural desnatado',
          '1 colher de chá de canela em pó polvilhada',
        ],
        almoco: [
          '1 concha rasa de arroz integral ou arroz branco',
          '1 concha média de feijão carioca com caldo',
          '1 filé de peito de frango grelhado (120g) temperado com alho e limão',
          'Prato cheio de salada colorida (alface, rúcula, tomate e pepino)',
          '1 pires de legumes cozidos no vapor (cenoura e abobrinha com azeite)',
        ],
        lanche_tarde: [
          '1 copo (200ml) de iogurte natural ou vitamina de frutas',
          '2 colheres de sopa de aveia em flocos finos',
          '1 fruta picada (morango ou maçã)',
          '1 punhado de sementes de abóbora tostadas',
          '1 copo grande de água aromatizada com hortelã',
        ],
        jantar: [
          'Omelete de 2 ovos com espinafre e tomate picado',
          'Salada mista de folhas verdes à vontade com azeite extravirgem',
          '1 prato fundo de sopa de legumes leves com frango desfiado',
          '1 fatia média de mandioca ou batata-doce cozida',
          '1 xícara de chá de camomila ou erva-doce sem açúcar',
        ],
      },
    },
    {
      dia: 'Terça-feira',
      refeicoes: {
        cafe_da_manha: [
          'Tapioca fina recheada com 2 ovos mexidos ou queijo branco magro',
          '1 fatia de melão ou melancia picada',
          '1 xícara de café passado sem adição de açúcar',
          '1 colher de sementes de gergelim tostado',
          '1 copo de água morna com gotas de limão em jejum',
        ],
        lanche_manha: [
          '1 taça pequena de salada de frutas da estação',
          '1 colher de sopa de farelo de aveia',
          '1 punhado de nozes ou castanha de caju sem sal',
          '1 xícara de chá de hibisco gelado',
          'Água mineral (300ml)',
        ],
        almoco: [
          '1 filé de peixe assado ou grelhado (tilápia ou merluza - 130g)',
          '2 colheres de sopa cheias de purê de mandioquinha ou batata',
          '1 concha de feijão preto ou lentilha',
          'Salada verde farta (agrião, alface crespa e rabanete)',
          'Brócolis e couve-flor salteados no azeite com alho',
        ],
        lanche_tarde: [
          '2 fatias de torrada integral leve',
          '1 colher de sopa de pasta de ricota ou homus caseiro',
          '1 xícara de café com leite desnatado ou chá de ervas',
          '1 mexerica/tangerina média',
          '1 copo de água fresca',
        ],
        jantar: [
          '1 posta de peixe ou filé de frango grelhado (110g)',
          'Legumes assados no forno (abóbora cabotiá, abobrinha e cebola roxa)',
          'Salada de folhas verdes com molho de limão e azeite',
          '1 concha pequena de caldinho de feijão',
          '1 xícara de chá de melissa quente',
        ],
      },
    },
    {
      dia: 'Quarta-feira',
      refeicoes: {
        cafe_da_manha: [
          'Vitamina batida (1 copo de leite desnatado + 1/2 banana + 1 colher de aveia)',
          '1 torrada integral com queijo branco ou ricota fresca',
          '1 xícara de café preto opcional',
          '1 colher de sobremesa de sementes de chia',
          '1 copo de água mineral',
        ],
        lanche_manha: [
          '1 cacho pequeno de uvas roxas ou 1 kiwi fatiado',
          '1 colher de sopa de mix de sementes e castanhas',
          '1 xícara de chá de hortelã fresco',
          '1 barra de cereais artesanal com sementes',
          'Água fresca (300ml)',
        ],
        almoco: [
          'Carne moída refogada com cenoura em cubos e cheiro-verde (120g)',
          '3 colheres de sopa de arroz integral',
          '1 concha média de feijão carioca',
          'Salada de repolho roxo com cenoura ralada e limão',
          'Chuchu e vagem refogados no azeite',
        ],
        lanche_tarde: [
          '1 pote de iogurte natural com 1 colher de mel silvestre',
          '2 colheres de sopa de granola sem açúcar',
          '1 maçã fatiada com canela',
          '1 punhado de castanhas de caju (15g)',
          '1 copo de água gelada',
        ],
        jantar: [
          'Salada proteica (folhas verdes, tomate-cereja, 100g de atum em água ou frango)',
          '1 ovo cozido fatiado',
          '1 colher de sopa de azeite de oliva extravirgem',
          '1 fatia pequena de pão integral tostado',
          '1 xícara de chá de capim-santo',
        ],
      },
    },
    {
      dia: 'Quinta-feira',
      refeicoes: {
        cafe_da_manha: [
          'Crepioca (1 ovo batido com 1 colher de goma de tapioca na frigideira)',
          'Recheio com orégano e queijo minas frescal light',
          '1 fatia média de mamão formosa com sementes de linhaça',
          '1 xícara de café com canela em pó',
          '1 copo de água pura',
        ],
        lanche_manha: [
          '1 pera fresca ou maçã verde',
          '1 colher de sobremesa de pasta de amendoim integral',
          '4 unidades de castanha-do-pará',
          '1 xícara de chá branco ou chá de gengibre',
          'Água mineral (300ml)',
        ],
        almoco: [
          '1 bife de alcatra ou patinho magro grelhado (120g)',
          '3 colheres de sopa de arroz com brócolis',
          '1 concha de feijão carioca fresquinho',
          'Salada de beterraba ralada com rúcula e azeite',
          'Abobrinha grelhada com ervas finas',
        ],
        lanche_tarde: [
          '1 fatia de pão 100% integral com pasta de ovo cozido e azeite',
          '1 copo (200ml) de suco de maracujá natural sem açúcar',
          '1 porção de fruta picada',
          '2 castanhas-do-pará',
          '1 copo de água mineral',
        ],
        jantar: [
          '1 prato raso de legumes cozidos ao vapor (brócolis, cenoura e mandioquinha)',
          '1 filé de frango desfiado com molho de tomate natural (100g)',
          'Salada de alface americana com tomate e azeite extravirgem',
          '1 colher de sobremesa de gergelim tostado por cima',
          '1 xícara de chá de erva-cidreira',
        ],
      },
    },
    {
      dia: 'Sexta-feira',
      refeicoes: {
        cafe_da_manha: [
          'Mingau de aveia morno (leite desnatado, 2 colheres de aveia e canela)',
          '1/2 banana fatiada por cima do mingau',
          '1 ovo cozido ou pochê separado para aporte proteico',
          '1 xícara de café preto sem açúcar',
          '1 copo de água fresca',
        ],
        lanche_manha: [
          '1 fatia média de abacaxi com folhas de hortelã',
          '1 punhado de mix de oleaginosas (amêndoas e nozes)',
          '1 xícara de chá verde morno',
          '1 iogurte proteico ou vegetal',
          'Água (300ml)',
        ],
        almoco: [
          'Sobrecoxa de frango sem pele assada com ervas (130g)',
          '3 colheres de sopa de arroz integral com gergelim',
          '1 concha de lentilha cozida com legumes',
          'Salada crua farta de escarola com tomate e cebola',
          'Purê de abóbora cabotiá temperado com noz-moscada',
        ],
        lanche_tarde: [
          'Vitamina de morango com leite desnatado e sementes de chia',
          '1 fatia de pão de forma integral tostada',
          '1 fatia fina de queijo ricota temperado',
          '3 nozes mariposa',
          '1 copo de água',
        ],
        jantar: [
          'Hambúrguer caseiro de patinho magro ou frango grelhado (120g) sem pão',
          'Prato cheio de salada caprichada (alface, rúcula, cenoura e tomate)',
          '1 batata-doce pequena assada em rodelas com alecrim',
          '1 fio de azeite extravirgem sobre os vegetais',
          '1 xícara de chá de camomila',
        ],
      },
    },
    {
      dia: 'Sábado',
      refeicoes: {
        cafe_da_manha: [
          'Panqueca de banana (1 banana madura amassada + 1 ovo + 2 colheres de aveia)',
          'Canela em pó polvilhada na massa dourada',
          '1 xícara de café coado com leite desnatado sem açúcar',
          '1 copo de suco verde (couve, limão, maçã e gengibre)',
          'Água fresca em temperatura ambiente',
        ],
        lanche_manha: [
          '1 taça de morangos frescos fatiados',
          '1 pote pequeno de iogurte natural desnatado',
          '1 colher de sopa de farelo de trigo ou aveia',
          '1 colher de sementes de girassol',
          'Água mineral (300ml)',
        ],
        almoco: [
          'Salmão ou tilápia grelhada na frigideira com azeite e alecrim (130g)',
          '3 colheres de sopa de arroz integral com cenoura',
          '1 concha de feijão preto temperado com louro e alho',
          'Salada mista refrescante (pepino japonês, tomate e folhas verdes)',
          'Mix de legumes salteados (aspargos, cogumelos ou vagem)',
        ],
        lanche_tarde: [
          'Pãozinho de frigideira saudável com aveia e ovo',
          '1 colher de pasta de cottage ou ricota com ervas',
          '1 xícara de café gelado com leite de amêndoas sem açúcar',
          '1 fruta fresca (pêssego ou maçã)',
          'Água mineral (250ml)',
        ],
        jantar: [
          'Wrap de folha de couve manteiga recheado com frango desfiado e legumes',
          'Salada de tomate-cereja com palmito e azeite extravirgem',
          '1 concha de caldinho de legumes leve',
          '1 colher de chá de sementes de chia',
          '1 xícara de chá de erva-doce morno',
        ],
      },
    },
    {
      dia: 'Domingo',
      refeicoes: {
        cafe_da_manha: [
          'Ovos mexidos especiais com tomate em cubinhos e manjericão fresco (2 ovos)',
          '1 fatia de pão de fermentação natural ou 100% integral',
          '1 xícara de café preto de grãos selecionados',
          '1 fatia generosa de abacaxi com raspas de limão',
          '1 copo de água aromatizada com hortelã',
        ],
        lanche_manha: [
          '1 copo (250ml) de água de coco natural gelada',
          '1 porção de castanhas variadas (castanha-do-pará e nozes - 20g)',
          '1 maçã ou ameixa fresca',
          '1 barra de sementes sem açúcar adicionado',
          'Água pura (250ml)',
        ],
        almoco: [
          'Lasanha de berinjela caseira com carne moída magra e queijo branco',
          '2 colheres de sopa de arroz branco ou integral',
          'Salada verde colorida de domingo (rúcula, alface americana e manga)',
          'Legumes grelhados na grelha ou forno (abobrinha e pimentão vermelho)',
          '1 fatia de laranja para sobremesa digestiva',
        ],
        lanche_tarde: [
          '1 taça de açaí puro batido sem xarope com banana fatiada e aveia',
          '1 copo de água mineral fresca',
          '1 torrada integral com ricota fresca',
          '1 colher de sobremesa de sementes de chia',
          '1 xícara de chá verde gelado com limão',
        ],
        jantar: [
          'Sopa reconfortante de legumes com músculo ou frango desfiado (1 prato fundo)',
          '1 torrada integral simples',
          'Salada leve de agrião com azeite de oliva e limão',
          'Omelete simples de 1 ovo com orégano (opcional)',
          '1 xícara de chá de camomila para descanso noturno',
        ],
      },
    },
  ]

  return { plano_semanal }
}
