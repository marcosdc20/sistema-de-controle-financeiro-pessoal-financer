
export interface Lesson {
  id: string;
  title: string;
  content: string; // Markdown-like or HTML
  duration: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  duration: string;
  image: string;
  modules: Lesson[];
}

export interface Fundamental {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  content: string;
}

export const FUNDAMENTALS: Fundamental[] = [
  {
    id: 'assets-vs-liabilities',
    title: 'Ativos vs Passivos',
    description: 'A diferença fundamental que define sua riqueza.',
    icon: 'Wallet',
    color: 'blue',
    content: `
      ### O que são Ativos e Passivos?
      
      A definição clássica de contabilidade diz que ativos são bens e direitos, e passivos são obrigações. Mas para suas finanças pessoais, usamos a definição de Robert Kiyosaki ("Pai Rico, Pai Pobre"):

      *   **Ativo:** Tudo aquilo que coloca dinheiro no seu bolso.
      *   **Passivo:** Tudo aquilo que tira dinheiro do seu bolso.

      ### Exemplos Práticos

      *   **Casa Própria:** É um passivo (gera despesas de manutenção, impostos, luz, água) a menos que você a alugue (aí vira ativo).
      *   **Carro:** Passivo (combustível, seguro, manutenção, desvalorização).
      *   **Ações/Títulos:** Ativo (pagam dividendos ou juros).
      *   **Empréstimos:** Passivo (você paga juros).

      ### O Segredo da Riqueza
      Pessoas ricas compram ativos. Pessoas pobres e classe média compram passivos achando que são ativos.
      
      **Meta:** Aumente sua coluna de ativos até que a renda gerada por eles cubra todas as despesas dos seus passivos.
    `
  },
  {
    id: 'compound-interest',
    title: 'Juros Compostos',
    description: 'A oitava maravilha do mundo segundo Einstein.',
    icon: 'TrendingUp',
    color: 'emerald',
    content: `
      ### O Poder dos Juros Compostos

      Juros compostos são "juros sobre juros". É o efeito multiplicador que acontece quando os rendimentos do seu dinheiro também começam a render.

      ### A Fórmula Mágica
      Não se preocupe com a matemática complexa, entenda o conceito:
      
      1. Você investe 100 Kz.
      2. Ganha 10% (10 Kz). Agora tem 110 Kz.
      3. No próximo mês, você ganha 10% sobre 110 Kz (11 Kz), não sobre os 100 iniciais.
      
      Com o tempo, essa pequena diferença cria uma curva exponencial.

      ### O Fator Tempo
      O tempo é mais importante que a taxa ou o valor investido. Começar cedo é a melhor estratégia.
    `
  },
  {
    id: 'inflation',
    title: 'Inflação e Poder de Compra',
    description: 'Como proteger seu dinheiro da desvalorização.',
    icon: 'AlertTriangle',
    color: 'red',
    content: `
      ### O Inimigo Invisível

      Inflação é o aumento generalizado dos preços. Se a inflação é de 15% ao ano, isso significa que seu dinheiro vale 15% menos a cada ano que passa se ficar parado.

      ### Em Angola
      Nossa economia sofre com inflação volátil. Guardar dinheiro "debaixo do colchão" ou em conta corrente sem rendimento é perder dinheiro garantido.

      ### Como se Proteger?
      1. **Investimentos Atrelados à Inflação:** Busque ativos que pagam uma taxa fixa + inflação.
      2. **Moeda Forte:** Diversificar parte do patrimônio em moedas mais estáveis (Dólar/Euro) quando possível e legal.
      3. **Ativos Reais:** Imóveis ou negócios tendem a corrigir seus preços com a inflação.
    `
  },
  {
    id: 'emergency-fund',
    title: 'Reserva de Emergência',
    description: 'O primeiro passo para a liberdade financeira.',
    icon: 'Coins',
    color: 'yellow',
    content: `
      ### O que é?
      Um valor guardado exclusivamente para imprevistos: doença, desemprego, conserto do carro ou casa.

      ### Quanto guardar?
      Entre 3 a 6 meses do seu custo de vida mensal.
      *   Se gasta 100.000 Kz/mês, sua reserva deve ser de 300.000 a 600.000 Kz.

      ### Onde investir?
      A reserva precisa de **Liquidez Imediata** (pode sacar a qualquer hora) e **Baixo Risco**.
      *   Não coloque em ações ou imóveis.
      *   Prefira depósitos a prazo com liquidez diária ou contas remuneradas.
    `
  },
  {
    id: 'diversification',
    title: 'Diversificação',
    description: 'Não coloque todos os ovos na mesma cesta.',
    icon: 'BarChart3',
    color: 'purple',
    content: `
      ### A Única "Balança Grátis"
      Diversificar é a única forma de reduzir riscos sem necessariamente reduzir o retorno esperado.

      ### Tipos de Diversificação
      1. **Classes de Ativos:** Renda Fixa, Ações, Imóveis, Cripto.
      2. **Geográfica:** Angola, EUA, Europa.
      3. **Setorial:** Bancos, Tecnologia, Saúde, Energia.

      Se um setor vai mal, outro pode ir bem, equilibrando sua carteira.
    `
  },
  {
    id: 'psychology',
    title: 'Psicologia do Dinheiro',
    description: 'Como suas emoções afetam suas decisões.',
    icon: 'Brain',
    color: 'pink',
    content: `
      ### Dinheiro é Emocional
      A maioria das decisões financeiras não é lógica, é emocional. Medo e Ganância são os dois motores.

      ### Vieses Comuns
      *   **Efeito Manada:** Comprar porque todos estão comprando (geralmente na alta).
      *   **Aversão à Perda:** Sentimos a dor da perda 2x mais que a alegria do ganho.
      *   **Viés do Presente:** Preferir gastar hoje do que poupar para um futuro "incerto".

      Conhecer esses vieses ajuda a evitar armadilhas mentais.
    `
  }
];

export const COURSES: Course[] = [
  {
    id: 'financial-org',
    title: 'Organização Financeira',
    description: 'Domine o básico para assumir o controle.',
    level: 'Iniciante',
    duration: '2h 30m',
    image: '📚',
    modules: [
      {
        id: 'fo-1',
        title: 'Diagnóstico Financeiro',
        duration: '15m',
        content: 'Como levantar todas as suas receitas e despesas. A importância de anotar tudo por 30 dias.'
      },
      {
        id: 'fo-2',
        title: 'Criando um Orçamento',
        duration: '30m',
        content: 'A regra 50/30/20 adaptada. Como categorizar gastos essenciais, estilo de vida e objetivos financeiros.'
      },
      {
        id: 'fo-3',
        title: 'Cortando Gastos',
        duration: '20m',
        content: 'Identificando gastos fantasmas e desperdícios. Estratégias de negociação de contratos.'
      },
      {
        id: 'fo-4',
        title: 'Definindo Metas',
        duration: '25m',
        content: 'Metas SMART (Específicas, Mensuráveis, Atingíveis, Relevantes, Temporais). Curto, médio e longo prazo.'
      }
    ]
  },
  {
    id: 'debt-free',
    title: 'Eliminar Dívidas',
    description: 'Estratégias comprovadas para sair do vermelho.',
    level: 'Iniciante',
    duration: '3h 15m',
    image: '✂️',
    modules: [
      {
        id: 'df-1',
        title: 'Mapeamento das Dívidas',
        duration: '20m',
        content: 'Listar tudo: Credor, Valor Total, Taxa de Juros (CET), Valor da Parcela.'
      },
      {
        id: 'df-2',
        title: 'Estratégia Bola de Neve',
        duration: '30m',
        content: 'Pagar as dívidas menores primeiro para ganhar motivação psicológica.'
      },
      {
        id: 'df-3',
        title: 'Estratégia Avalanche',
        duration: '30m',
        content: 'Pagar as dívidas com maiores juros primeiro para economizar dinheiro matematicamente.'
      },
      {
        id: 'df-4',
        title: 'Negociação com Bancos',
        duration: '40m',
        content: 'Como pedir descontos, portabilidade de crédito e renegociação de prazos.'
      }
    ]
  },
  {
    id: 'invest-angola',
    title: 'Investimentos em Angola',
    description: 'Faça seu Kwanza render mais.',
    level: 'Intermediário',
    duration: '5h 00m',
    image: '🇦🇴',
    modules: [
      {
        id: 'ia-1',
        title: 'Entendendo a BODIVA',
        duration: '45m',
        content: 'O que é a Bolsa de Dívida e Valores de Angola. Como funciona o mercado secundário.'
      },
      {
        id: 'ia-2',
        title: 'Títulos do Tesouro (BT e OT)',
        duration: '60m',
        content: 'Bilhetes do Tesouro (curto prazo) vs Obrigações do Tesouro (longo prazo). Riscos e Retornos.'
      },
      {
        id: 'ia-3',
        title: 'Depósitos a Prazo',
        duration: '30m',
        content: 'Como comparar taxas dos bancos comerciais (BNA, BAI, BIC, etc.). Taxa TANB vs TANL.'
      },
      {
        id: 'ia-4',
        title: 'Fundos de Investimento',
        duration: '40m',
        content: 'Vantagens da gestão profissional. Fundos abertos vs fechados em Angola.'
      }
    ]
  }
];
