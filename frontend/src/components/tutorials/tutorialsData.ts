export type TutorialAudience = 'PLAYER' | 'GAME_MASTER' | 'BOTH';
export type TutorialCategory = 'platform' | 'game' | 'strategy';

export interface TutorialSection {
  heading: string;
  body: string;
  steps?: string[];
}

export interface Tutorial {
  id: string;
  category: TutorialCategory;
  audience: TutorialAudience;
  title: string;
  description: string;
  icon: string;
  sections: TutorialSection[];
}

export const TUTORIALS: Tutorial[] = [
  // ─── Plataforma ───────────────────────────────────────────────────────────────
  {
    id: 'platform-login',
    category: 'platform',
    audience: 'BOTH',
    title: 'Primeiros passos: login e navegação',
    description: 'Aprenda a acessar a plataforma e navegar pelas principais seções.',
    icon: 'login',
    sections: [
      {
        heading: 'Fazendo login',
        body: 'Acesse a tela de login com seu e-mail e senha fornecidos pelo Game Master. Após autenticar, você será redirecionado automaticamente para o painel correto de acordo com seu perfil.',
      },
      {
        heading: 'Navegando pela sidebar',
        body: 'A barra lateral esquerda contém todos os links de navegação disponíveis para o seu perfil. Clique em qualquer item para acessar a seção correspondente. O item ativo é destacado com fundo semitransparente e um ponto dourado.',
      },
      {
        heading: 'Saindo da conta',
        body: 'Clique no seu nome no canto superior direito para abrir o menu de usuário e selecione "Sair da conta".',
      },
    ],
  },
  {
    id: 'platform-player-dashboard',
    category: 'platform',
    audience: 'PLAYER',
    title: 'Entendendo o Dashboard da sua loja',
    description: 'Conheça os indicadores e informações exibidos no painel principal do Player.',
    icon: 'dashboard',
    sections: [
      {
        heading: 'Visão geral',
        body: 'O Dashboard mostra o estado atual da sua loja: saldo em caixa, rodada ativa, status de submissão e indicadores financeiros da última rodada encerrada.',
      },
      {
        heading: 'Indicadores de caixa',
        body: 'O painel de caixa exibe o capital inicial, custos fixos (estoque, CAPEX, folha, licenciamento) e o saldo disponível. Um saldo negativo indica que sua loja está em situação crítica.',
      },
      {
        heading: 'Status da rodada',
        body: 'Quando há uma rodada aberta, você verá o tempo restante para submissão. Fique atento ao contador — após o prazo, a configuração não pode mais ser alterada.',
      },
    ],
  },
  {
    id: 'platform-admin-overview',
    category: 'platform',
    audience: 'GAME_MASTER',
    title: 'Painel Administrativo: visão geral',
    description: 'Entenda as seções disponíveis no painel do Game Master.',
    icon: 'admin',
    sections: [
      {
        heading: 'Seções disponíveis',
        body: 'O painel administrativo possui: Dashboard (visão geral da rodada ativa), Rodadas, Squads, Usuários, Produtos e Resultados.',
      },
      {
        heading: 'Dashboard do GM',
        body: 'Mostra a rodada ativa, o status de submissão de cada squad (quem já enviou, quem está pendente) e estatísticas gerais da simulação.',
      },
      {
        heading: 'Fluxo típico de uma sessão',
        body: 'Criar rodada → aguardar submissões dos squads → encerrar rodada → analisar resultados → criar próxima rodada.',
        steps: [
          'Acesse Dashboard e crie uma nova rodada',
          'Monitore as submissões dos squads em tempo real',
          'Quando todos submeterem (ou o prazo encerrar), feche a rodada',
          'Acesse Resultados para analisar o desempenho de cada squad',
        ],
      },
    ],
  },
  {
    id: 'platform-round-config',
    category: 'platform',
    audience: 'PLAYER',
    title: 'Como configurar uma rodada',
    description: 'Passo a passo para definir sua estratégia e submeter a configuração da rodada.',
    icon: 'config',
    sections: [
      {
        heading: 'Acessando a configuração',
        body: 'Clique em "Configurar Rodada" na sidebar. Esta opção só está disponível quando há uma rodada com status "Aberta".',
      },
      {
        heading: 'Configurando produtos',
        body: 'Para cada produto disponível, defina a margem de lucro (%) e o volume de vendas planejado. O sistema calcula automaticamente o preço de venda e a receita estimada.',
      },
      {
        heading: 'Painéis adicionais',
        body: 'Além dos produtos, configure: Operadores (quantidade de atendentes), CAPEX (investimentos em equipamentos), Licenciamento e revise o Resumo de Caixa antes de submeter.',
      },
      {
        heading: 'Submetendo',
        body: 'Clique em "Submeter Configuração" para enviar sua estratégia. Após a submissão, você pode revisar mas não alterar os dados até a próxima rodada.',
        steps: [
          'Defina margem e volume para cada produto',
          'Configure operadores, CAPEX e licenciamento',
          'Revise o resumo de caixa',
          'Clique em "Submeter Configuração"',
        ],
      },
    ],
  },
  {
    id: 'platform-manage-rounds',
    category: 'platform',
    audience: 'GAME_MASTER',
    title: 'Como criar e gerenciar rodadas',
    description: 'Aprenda a criar, monitorar e encerrar rodadas da simulação.',
    icon: 'rounds',
    sections: [
      {
        heading: 'Criando uma rodada',
        body: 'No Dashboard ou na página de Rodadas, clique em "Nova Rodada". Defina o número da rodada, a duração em horas e o fator de demanda (0 a 1).',
      },
      {
        heading: 'Fator de demanda',
        body: 'O fator de demanda controla o volume de clientes simulados. Valores próximos de 1 representam alta demanda; próximos de 0, baixa demanda. Use isso para criar cenários desafiadores.',
      },
      {
        heading: 'Encerrando uma rodada',
        body: 'Clique em "Encerrar Rodada" no Dashboard. O sistema processará todas as configurações submetidas, calculará os resultados financeiros e fechará a rodada. Esta ação é irreversível.',
      },
    ],
  },
  {
    id: 'platform-manage-squads',
    category: 'platform',
    audience: 'GAME_MASTER',
    title: 'Como gerenciar squads e usuários',
    description: 'Crie squads, adicione usuários e configure as lojas da simulação.',
    icon: 'squads',
    sections: [
      {
        heading: 'Criando squads',
        body: 'Acesse "Squads" na sidebar. Cada squad representa uma equipe de players que gerencia uma loja. Crie um squad por equipe participante.',
      },
      {
        heading: 'Gerenciando usuários',
        body: 'Acesse "Usuários" para criar contas de players e associá-los a squads. Cada usuário recebe um e-mail e senha para acessar a plataforma.',
      },
      {
        heading: 'Lojas e capital inicial',
        body: 'Cada squad possui uma loja associada com um capital inicial definido. Este valor determina o ponto de partida financeiro da equipe.',
      },
    ],
  },
  {
    id: 'platform-results',
    category: 'platform',
    audience: 'BOTH',
    title: 'Como interpretar os Resultados (DRE)',
    description: 'Entenda o Demonstrativo de Resultado do Exercício gerado ao final de cada rodada.',
    icon: 'results',
    sections: [
      {
        heading: 'O que é o DRE',
        body: 'O DRE (Demonstrativo de Resultado do Exercício) mostra a performance financeira da sua loja em uma rodada: receitas, custos, margens e resultado final.',
      },
      {
        heading: 'Principais linhas',
        body: 'Receita Bruta → Impostos → Receita Líquida → Custos → Margem Bruta → Quebra/Envelhecimento → Margem Líquida → Outras Despesas → EBITDA.',
      },
      {
        heading: 'Breakdown por produto',
        body: 'A tabela de breakdown mostra o desempenho individual de cada produto: volume planejado vs. efetivo, receita, custo e margem por item.',
      },
    ],
  },
  {
    id: 'platform-ranking',
    category: 'platform',
    audience: 'BOTH',
    title: 'Como usar o Ranking',
    description: 'Acompanhe a classificação dos squads e compare desempenhos.',
    icon: 'ranking',
    sections: [
      {
        heading: 'Acessando o ranking',
        body: 'Clique em "Ranking" na sidebar. O ranking é atualizado ao final de cada rodada e mostra a posição de todos os squads.',
      },
      {
        heading: 'Critério de classificação',
        body: 'A classificação é baseada no EBITDA acumulado. Squads com maior EBITDA ficam no topo. Em caso de empate, a margem EBITDA (%) é o critério de desempate.',
      },
      {
        heading: 'Métricas exibidas',
        body: 'Para cada squad são exibidos: posição, nome do squad, nome da loja, EBITDA, margem EBITDA (%), receita bruta e receita líquida.',
      },
    ],
  },

  // ─── Jogo ─────────────────────────────────────────────────────────────────────
  {
    id: 'game-overview',
    category: 'game',
    audience: 'BOTH',
    title: 'Como funciona a dinâmica: visão geral',
    description: 'Entenda o objetivo do jogo e o fluxo geral da simulação.',
    icon: 'game',
    sections: [
      {
        heading: 'Objetivo',
        body: 'Cada squad gerencia uma loja virtual e compete para maximizar o EBITDA ao longo de múltiplas rodadas. O squad com melhor resultado financeiro acumulado vence.',
      },
      {
        heading: 'Fluxo de uma rodada',
        body: 'O Game Master abre uma rodada com duração e fator de demanda definidos. Cada squad configura sua estratégia (produtos, preços, operadores, investimentos) e submete. Ao encerrar, o sistema calcula os resultados automaticamente.',
        steps: [
          'GM abre a rodada',
          'Squads definem sua estratégia',
          'Squads submetem a configuração',
          'GM encerra a rodada',
          'Sistema calcula e exibe os resultados',
          'Ranking é atualizado',
        ],
      },
      {
        heading: 'Múltiplas rodadas',
        body: 'A simulação pode ter várias rodadas. O saldo de caixa acumulado entre rodadas afeta sua capacidade de investimento nas rodadas seguintes.',
      },
    ],
  },
  {
    id: 'game-demand-factor',
    category: 'game',
    audience: 'PLAYER',
    title: 'O que é o Fator de Demanda',
    description: 'Entenda como o fator de demanda afeta o volume de vendas da sua loja.',
    icon: 'demand',
    sections: [
      {
        heading: 'Definição',
        body: 'O fator de demanda (0 a 1) representa o volume de clientes que visitarão as lojas naquela rodada. É definido pelo Game Master e simula condições de mercado.',
      },
      {
        heading: 'Impacto nas vendas',
        body: 'Seu volume de vendas efetivo é calculado multiplicando o volume planejado pelo fator de demanda. Se você planejou vender 100 unidades com fator 0.7, venderá no máximo 70.',
      },
      {
        heading: 'Estratégia',
        body: 'Com fator de demanda baixo, considere reduzir o volume planejado para evitar estoque encalhado (quebra/envelhecimento). Com fator alto, maximize o volume para capturar mais receita.',
      },
    ],
  },
  {
    id: 'game-ebitda',
    category: 'game',
    audience: 'BOTH',
    title: 'Entendendo EBITDA, Margem e Receita',
    description: 'Conceitos financeiros essenciais para tomar boas decisões na simulação.',
    icon: 'finance',
    sections: [
      {
        heading: 'Receita Bruta vs. Líquida',
        body: 'Receita Bruta é o total vendido (preço × volume). Receita Líquida é a Receita Bruta menos os impostos (taxa de imposto configurada por produto).',
      },
      {
        heading: 'Margem Bruta',
        body: 'Margem Bruta = Receita Líquida − Custo dos Produtos. Representa o lucro antes das despesas operacionais. Uma margem bruta saudável é fundamental para cobrir os custos fixos.',
      },
      {
        heading: 'EBITDA',
        body: 'EBITDA = Margem Líquida − Outras Despesas (CAPEX, operadores, licenciamento, manutenção). É o principal indicador de performance da simulação. Quanto maior, melhor.',
      },
      {
        heading: 'Margem EBITDA (%)',
        body: 'Margem EBITDA = EBITDA ÷ Receita Líquida × 100. Indica a eficiência operacional. Uma loja com receita menor pode ter margem maior se controlar bem os custos.',
      },
    ],
  },
  {
    id: 'game-capex',
    category: 'game',
    audience: 'PLAYER',
    title: 'CAPEX, Licenciamento e Operadores',
    description: 'Entenda os custos operacionais que impactam seu resultado financeiro.',
    icon: 'capex',
    sections: [
      {
        heading: 'CAPEX (Capital Expenditure)',
        body: 'São investimentos em equipamentos e infraestrutura da loja. Aumentam a capacidade operacional mas reduzem o caixa disponível. Invista com cautela — o retorno não é imediato.',
      },
      {
        heading: 'Licenciamento',
        body: 'Custo de licenças de software e sistemas necessários para operar a loja. É um custo fixo por rodada que deve ser considerado no planejamento financeiro.',
      },
      {
        heading: 'Operadores',
        body: 'Quantidade de atendentes/operadores da loja. Mais operadores aumentam a capacidade de atendimento (CSAT/SLA) mas elevam a folha de pagamento. Encontre o equilíbrio ideal.',
      },
      {
        heading: 'Impacto no caixa',
        body: 'Todos esses custos são deduzidos do caixa ao final da rodada. Verifique sempre o Resumo de Caixa antes de submeter para garantir que o saldo não ficará negativo.',
      },
    ],
  },
  {
    id: 'game-csat',
    category: 'game',
    audience: 'PLAYER',
    title: 'CSAT e SLA: como impactam seus resultados',
    description: 'Entenda os indicadores de qualidade de atendimento e seu efeito na simulação.',
    icon: 'csat',
    sections: [
      {
        heading: 'O que é CSAT',
        body: 'CSAT (Customer Satisfaction Score) mede a satisfação dos clientes com o atendimento da sua loja. É influenciado principalmente pela quantidade de operadores em relação ao volume de demanda.',
      },
      {
        heading: 'O que é SLA',
        body: 'SLA (Service Level Agreement) mede o cumprimento do nível de serviço prometido. Um SLA baixo indica que sua loja não conseguiu atender todos os clientes dentro do prazo esperado.',
      },
      {
        heading: 'Impacto financeiro',
        body: 'CSAT e SLA baixos podem gerar penalidades financeiras (juros/multas) que reduzem seu EBITDA. Mantenha um número adequado de operadores para a demanda esperada.',
      },
    ],
  },
  {
    id: 'game-round-cycle',
    category: 'game',
    audience: 'GAME_MASTER',
    title: 'Ciclo de uma rodada: do início ao encerramento',
    description: 'Guia completo do fluxo de uma rodada do ponto de vista do Game Master.',
    icon: 'cycle',
    sections: [
      {
        heading: 'Preparação',
        body: 'Antes de criar a rodada, certifique-se de que todos os squads estão cadastrados, as lojas configuradas e os produtos disponíveis estão corretos.',
      },
      {
        heading: 'Criando a rodada',
        body: 'Defina o número sequencial, a duração (em horas) e o fator de demanda. O fator de demanda é sua principal alavanca para criar cenários mais ou menos desafiadores.',
      },
      {
        heading: 'Monitoramento',
        body: 'Acompanhe o Dashboard para ver quais squads já submeteram. Squads pendentes ficam destacados. Você pode encerrar a rodada antes do prazo se todos já submeteram.',
      },
      {
        heading: 'Encerramento e resultados',
        body: 'Ao encerrar, o sistema processa todas as configurações e gera os resultados. Acesse a página de Resultados para analisar o desempenho de cada squad e conduzir o debriefing.',
        steps: [
          'Verificar que todos os squads submeteram (ou prazo expirou)',
          'Clicar em "Encerrar Rodada" e confirmar',
          'Aguardar o processamento (status "Processando")',
          'Acessar Resultados para o debriefing',
          'Compartilhar o Ranking com os participantes',
        ],
      },
    ],
  },

  // ─── Estratégias ─────────────────────────────────────────────────────────────
  {
    id: 'strategy-margin-volume',
    category: 'strategy',
    audience: 'PLAYER',
    title: 'Como definir margem e volume de vendas',
    description: 'Estratégias para equilibrar preço e volume e maximizar sua receita.',
    icon: 'strategy',
    sections: [
      {
        heading: 'O trade-off margem × volume',
        body: 'Margem alta significa preço mais elevado, o que pode reduzir o volume de vendas efetivo. Margem baixa atrai mais demanda mas reduz o lucro por unidade. O equilíbrio ideal depende do fator de demanda da rodada.',
      },
      {
        heading: 'Estratégia com demanda alta',
        body: 'Com fator de demanda próximo de 1, você pode trabalhar com margens mais altas sem perder muito volume. Aproveite para maximizar a receita por unidade.',
      },
      {
        heading: 'Estratégia com demanda baixa',
        body: 'Com fator de demanda baixo, reduza o volume planejado para evitar estoque encalhado. Considere margens menores para ser mais competitivo e capturar a demanda disponível.',
      },
      {
        heading: 'Mix de produtos',
        body: 'Não concentre tudo em um único produto. Diversifique o mix para reduzir o risco de perda por quebra ou envelhecimento em produtos específicos.',
      },
    ],
  },
  {
    id: 'strategy-inventory',
    category: 'strategy',
    audience: 'PLAYER',
    title: 'Gestão de estoque: quebra e envelhecimento',
    description: 'Como evitar perdas por produtos não vendidos.',
    icon: 'inventory',
    sections: [
      {
        heading: 'O que é quebra',
        body: 'Quebra é a perda de produtos por danos físicos durante o manuseio e armazenamento. Cada produto tem uma taxa de quebra configurada. Quanto maior o estoque, maior a perda absoluta.',
      },
      {
        heading: 'O que é envelhecimento',
        body: 'Envelhecimento é a perda de produtos perecíveis ou com prazo de validade. Produtos não vendidos dentro da rodada sofrem depreciação pela taxa de envelhecimento.',
      },
      {
        heading: 'Como minimizar perdas',
        body: 'Planeje o volume de vendas próximo ao que você espera vender de fato. Evite superestimar o volume — o excesso vira perda. Use o fator de demanda como referência para calibrar seu planejamento.',
        steps: [
          'Verifique o fator de demanda da rodada',
          'Estime o volume realista de vendas por produto',
          'Adicione uma margem de segurança pequena (5-10%)',
          'Evite volumes muito acima da demanda esperada',
        ],
      },
    ],
  },
  {
    id: 'strategy-capex-balance',
    category: 'strategy',
    audience: 'PLAYER',
    title: 'Equilíbrio entre CAPEX e resultado financeiro',
    description: 'Quando investir em infraestrutura e quando preservar o caixa.',
    icon: 'balance',
    sections: [
      {
        heading: 'CAPEX como investimento',
        body: 'Investimentos em CAPEX melhoram a capacidade operacional da loja, mas consomem caixa imediatamente. O retorno vem nas rodadas seguintes através de maior eficiência.',
      },
      {
        heading: 'Quando investir',
        body: 'Invista em CAPEX quando seu caixa estiver saudável e você tiver previsão de demanda alta nas próximas rodadas. Evite investir quando o saldo de caixa estiver próximo do limite.',
      },
      {
        heading: 'Risco de caixa negativo',
        body: 'Se o saldo de caixa ficar negativo, sua loja incorre em juros e penalidades que reduzem ainda mais o EBITDA. Sempre verifique o Resumo de Caixa antes de submeter.',
      },
    ],
  },
  {
    id: 'strategy-gm-monitoring',
    category: 'strategy',
    audience: 'GAME_MASTER',
    title: 'Como monitorar e intervir nas rodadas',
    description: 'Boas práticas para conduzir a dinâmica e engajar os participantes.',
    icon: 'monitor',
    sections: [
      {
        heading: 'Acompanhamento em tempo real',
        body: 'Use o Dashboard para monitorar quais squads já submeteram. Squads pendentes ficam destacados em amarelo. Isso permite identificar equipes que precisam de suporte.',
      },
      {
        heading: 'Ajustando o fator de demanda',
        body: 'Use o fator de demanda para criar narrativas: uma rodada com fator 0.3 simula uma crise de mercado; fator 0.9 simula um período de alta demanda. Varie entre rodadas para criar desafios diferentes.',
      },
      {
        heading: 'Conduzindo o debriefing',
        body: 'Após encerrar a rodada, use a página de Resultados para comparar as estratégias dos squads. Destaque quem tomou as melhores decisões e por quê. O Ranking ajuda a visualizar o impacto acumulado.',
      },
    ],
  },
  {
    id: 'strategy-maximize-ebitda',
    category: 'strategy',
    audience: 'PLAYER',
    title: 'Dicas para maximizar o EBITDA',
    description: 'Estratégias consolidadas para melhorar seu resultado financeiro.',
    icon: 'tips',
    sections: [
      {
        heading: 'Controle os custos fixos',
        body: 'CAPEX, operadores e licenciamento são custos fixos que consomem EBITDA independentemente da receita. Mantenha-os no mínimo necessário para operar com qualidade.',
      },
      {
        heading: 'Maximize a receita líquida',
        body: 'Prefira produtos com menor taxa de imposto para maximizar a receita líquida. Combine margem e volume de forma inteligente conforme o fator de demanda.',
      },
      {
        heading: 'Evite penalidades',
        body: 'Caixa negativo, CSAT baixo e SLA ruim geram penalidades que destroem o EBITDA. Monitore sempre o Resumo de Caixa e mantenha operadores suficientes.',
      },
      {
        heading: 'Pense no longo prazo',
        body: 'Decisões de CAPEX e estoque afetam rodadas futuras. Uma estratégia consistente ao longo das rodadas supera apostas arriscadas em uma única rodada.',
        steps: [
          'Verifique o fator de demanda antes de planejar',
          'Calibre volume para evitar quebra/envelhecimento',
          'Mantenha caixa positivo com margem de segurança',
          'Invista em CAPEX apenas quando o caixa permitir',
          'Monitore o ranking para ajustar a estratégia',
        ],
      },
    ],
  },
];

export const CATEGORY_LABELS: Record<TutorialCategory, string> = {
  platform: 'Plataforma',
  game: 'Jogo',
  strategy: 'Estratégias',
};

export const CATEGORY_COLORS: Record<TutorialCategory, { bg: string; text: string; border: string }> = {
  platform: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  game: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  strategy: { bg: '#fefce8', text: '#a16207', border: '#fde68a' },
};
