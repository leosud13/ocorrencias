import { OccurrenceReason } from "@prisma/client";

export type QuickOccurrenceTemplate = {
  id: string;
  title: string;
  text: string;
  suggestedReason?: OccurrenceReason;
};

export const QUICK_OCCURRENCE_TEMPLATES: QuickOccurrenceTemplate[] = [
  {
    id: "comportamento-inadequado",
    title: "Comportamento inadequado",
    text: "Durante a aula, o(a) estudante apresentou comportamento incompatível com as normas de convivência da sala, prejudicando o desenvolvimento das atividades pedagógicas. O(a) estudante foi orientado(a) quanto à necessidade de manter postura adequada ao ambiente escolar.",
    suggestedReason: OccurrenceReason.INDISCIPLINA,
  },
  {
    id: "improdutividade",
    title: "Improdutividade",
    text: "O(a) estudante demonstrou baixa participação nas atividades propostas, permanecendo improdutivo(a) durante a aula, mesmo após intervenções e orientações do professor.",
    suggestedReason: OccurrenceReason.NAO_FEZ_ATIVIDADE,
  },
  {
    id: "desrespeito-professor",
    title: "Desrespeito ao professor",
    text: "Durante a aula, o(a) estudante apresentou comportamento desrespeitoso em relação ao professor, sendo orientado(a) quanto à importância do respeito mútuo e das normas de convivência escolar.",
    suggestedReason: OccurrenceReason.DESACATO_FUNCIONARIO,
  },
  {
    id: "uso-celular",
    title: "Uso não autorizado do celular",
    text: "O(a) estudante utilizou aparelho celular durante a aula sem autorização, contrariando as orientações da unidade escolar. Foi orientado(a) sobre o uso adequado dos dispositivos eletrônicos.",
    suggestedReason: OccurrenceReason.USO_CELULAR,
  },
  {
    id: "saida-sala",
    title: "Saída da sala sem autorização",
    text: "O(a) estudante ausentou-se da sala de aula sem autorização prévia, sendo posteriormente orientado(a) sobre a importância de permanecer em sala durante o período das atividades.",
    suggestedReason: OccurrenceReason.SAIU_SEM_AUTORIZACAO,
  },
  {
    id: "evasao-interna",
    title: "Evasão interna (cabular aula)",
    text: "Foi constatado que o(a) estudante encontrava-se fora da sala de aula durante o período em que deveria estar participando das atividades, caracterizando evasão interna. O(a) estudante foi orientado(a) quanto à importância da frequência e participação nas aulas.",
    suggestedReason: OccurrenceReason.SAIU_SEM_AUTORIZACAO,
  },
  {
    id: "ausencia-material",
    title: "Ausência de material escolar",
    text: "O(a) estudante compareceu à aula sem o material necessário para a realização das atividades propostas, comprometendo seu acompanhamento pedagógico. Foi orientado(a) quanto à importância de trazer os materiais escolares.",
    suggestedReason: OccurrenceReason.NAO_FEZ_ATIVIDADE,
  },
  {
    id: "sonolencia",
    title: "Sonolência ou dormindo durante a aula",
    text: "O(a) estudante permaneceu dormindo durante parte da aula, comprometendo sua participação nas atividades pedagógicas. Foi orientado(a) quanto à importância de manter-se atento(a) durante as aulas.",
    suggestedReason: OccurrenceReason.INDISCIPLINA,
  },
  {
    id: "agressao-verbal",
    title: "Agressão verbal",
    text: "O(a) estudante dirigiu palavras inadequadas a outro membro da comunidade escolar, ocasionando conflito interpessoal. Os envolvidos foram orientados quanto à necessidade de manutenção do respeito nas relações escolares.",
    suggestedReason: OccurrenceReason.LINGUAGEM_IMPROPRIA,
  },
  {
    id: "agressao-fisica",
    title: "Agressão física",
    text: "O(a) estudante envolveu-se em episódio de agressão física com outro estudante. A situação foi prontamente interrompida e os envolvidos foram encaminhados para as providências cabíveis.",
    suggestedReason: OccurrenceReason.AGRESSAO,
  },
  {
    id: "bullying",
    title: "Bullying",
    text: "Foi identificado comportamento incompatível com as normas de convivência, caracterizado por atitudes que causaram constrangimento e sofrimento a outro estudante. O caso foi encaminhado para orientação e acompanhamento.",
    suggestedReason: OccurrenceReason.BULLYING,
  },
  {
    id: "homofobia",
    title: "Homofobia",
    text: "O(a) estudante proferiu expressões de cunho discriminatório contra colega, em desacordo com os princípios de respeito e convivência da unidade escolar. O caso foi encaminhado para as providências cabíveis.",
    suggestedReason: OccurrenceReason.LINGUAGEM_IMPROPRIA,
  },
  {
    id: "gordofobia",
    title: "Gordofobia",
    text: "O(a) estudante dirigiu comentários ofensivos relacionados à aparência física de outro colega, ocasionando constrangimento e conflito interpessoal. Foi orientado(a) quanto ao respeito às diferenças.",
    suggestedReason: OccurrenceReason.LINGUAGEM_IMPROPRIA,
  },
  {
    id: "cigarro-eletronico",
    title: "Uso de cigarro eletrônico",
    text: "Foi constatado o uso de cigarro eletrônico nas dependências da escola. O(a) estudante foi orientado(a) e encaminhado(a) para as medidas pedagógicas e administrativas pertinentes.",
    suggestedReason: OccurrenceReason.SUBSTANCIAS_ILICITAS,
  },
  {
    id: "excesso-faltas",
    title: "Excesso de faltas",
    text: "Verificou-se elevado número de faltas do(a) estudante, situação que pode comprometer seu processo de aprendizagem. Recomenda-se acompanhamento e contato com a família.",
    suggestedReason: OccurrenceReason.OUTROS,
  },
  {
    id: "falta-veracidade",
    title: "Falta de veracidade nas informações",
    text: "Durante a apuração dos fatos, constatou-se divergência entre as informações apresentadas pelo(a) estudante e a situação observada. O(a) estudante foi orientado(a) quanto à importância da honestidade e responsabilidade.",
    suggestedReason: OccurrenceReason.OUTROS,
  },
  {
    id: "recusa-orientacoes",
    title: "Recusa em cumprir orientações",
    text: "Mesmo após orientação, o(a) estudante recusou-se a atender às solicitações realizadas, mantendo comportamento inadequado. O fato foi registrado para acompanhamento.",
    suggestedReason: OccurrenceReason.INDISCIPLINA,
  },
  {
    id: "vestimenta-inadequada",
    title: "Vestimenta inadequada",
    text: "O(a) estudante compareceu à unidade escolar utilizando vestimenta incompatível com as orientações institucionais. Foi orientado(a) quanto às normas vigentes.",
    suggestedReason: OccurrenceReason.OUTROS,
  },
  {
    id: "dano-patrimonio",
    title: "Dano ao patrimônio público",
    text: "Foi constatada ação que resultou em dano ao patrimônio escolar. A situação foi encaminhada para análise e adoção das medidas pedagógicas e administrativas cabíveis.",
    suggestedReason: OccurrenceReason.OUTROS,
  },
  {
    id: "apropriacao-pertences",
    title: "Apropriação indevida de pertences",
    text: "Foi relatado que o(a) estudante utilizou ou se apropriou de objeto pertencente a outro estudante sem autorização, ocasionando conflito entre as partes. A situação foi mediada e os envolvidos orientados.",
    suggestedReason: OccurrenceReason.OUTROS,
  },
  {
    id: "conflito-estudantes",
    title: "Conflito entre estudantes",
    text: "O(a) estudante envolveu-se em desentendimento com colega durante o período escolar. Após intervenção da equipe, os envolvidos foram orientados quanto à importância do diálogo e do respeito mútuo.",
    suggestedReason: OccurrenceReason.INDISCIPLINA,
  },
  {
    id: "resistencia-intervencoes",
    title: "Resistência às intervenções",
    text: "Mesmo após orientações e intervenções realizadas, o(a) estudante manteve comportamento incompatível com as normas de convivência, demonstrando resistência às medidas pedagógicas adotadas.",
    suggestedReason: OccurrenceReason.INDISCIPLINA,
  },
  {
    id: "permanencia-indevida",
    title: "Permanência indevida na escola fora do turno",
    text: "Foi constatada a permanência do(a) estudante nas dependências da escola em horário distinto do seu período regular, sendo orientado(a) quanto às normas institucionais.",
    suggestedReason: OccurrenceReason.OUTROS,
  },
  {
    id: "suspeita-cigarro-eletronico",
    title: "Suspeita de posse ou compartilhamento de cigarro eletrônico",
    text: "Durante o período escolar, foram identificados indícios relacionados à posse ou compartilhamento de cigarro eletrônico. A situação foi encaminhada à equipe gestora para apuração e adoção das medidas cabíveis.",
    suggestedReason: OccurrenceReason.SUBSTANCIAS_ILICITAS,
  },
];
