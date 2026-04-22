'use strict';

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO DE VACINAS — Calendário Nacional de Vacinação
// Fonte: Ministério da Saúde / SBP 2024
// Versão: 2024.2
//
// DECISÕES DE MODELAGEM:
//
// 1. Hepatite B: dose ao nascer é monovalente isolada (v002).
//    2ª e 3ª doses são componentes da Pentavalente (v003).
//    São produtos distintos com lotes distintos.
//
// 2. Varicela: aos 15 meses vem na SCRV (tetraviral, v011b).
//    Reforço isolado monovalente aos 4 anos (v012).
//
// 3. Influenza: crianças < 8 anos na 1ª vez recebem 2 doses.
//    Após isso, dose única anual com flag tipo:'anual'.
//
// 4. dose_id: identificador único de dose — usado no evento
//    aplicado para ligação precisa sem depender do texto da dose.
// ═══════════════════════════════════════════════════════════════

const CATALOGO_VACINAS = {
  versao: '2024.2',
  data_geracao: '2024-01-01',
  fonte: 'Ministerio da Saude / Sociedade Brasileira de Pediatria — Calendario Nacional 2024',
  dados: [
    {
      id: 'v001', nome: 'BCG',
      descricao: 'Bacilo de Calmette-Guerin — formas graves de tuberculose',
      doenca_alvo: 'Tuberculose', via: 'Intradermica',
      doses: [
        { dose_id:'v001-d1', dose:'Dose unica', idade_meses:0, idade_label:'Ao nascer', tolerancia_meses:1, tipo:'unica' }
      ]
    },
    {
      id: 'v002', nome: 'Hepatite B (monovalente)',
      descricao: 'Dose ao nascer — produto monovalente. Doses 2a e 3a estao na Pentavalente.',
      doenca_alvo: 'Hepatite B', via: 'Intramuscular',
      nota: 'Apenas a dose ao nascer usa vacina monovalente. 2a e 3a doses sao da Pentavalente (v003).',
      doses: [
        { dose_id:'v002-d1', dose:'1a dose (ao nascer)', idade_meses:0, idade_label:'Ao nascer', tolerancia_meses:1, tipo:'unica' }
      ]
    },
    {
      id: 'v003', nome: 'Pentavalente (DTP + Hib + HepB)',
      descricao: 'Difteria, tetano, coqueluche, Haemophilus influenzae b e hepatite B',
      doenca_alvo: 'Difteria, Tetano, Coqueluche, Hib, Hepatite B', via: 'Intramuscular',
      nota: 'Inclui o componente de Hepatite B — 2a e 3a doses de HepB sao administradas com esta vacina.',
      doses: [
        { dose_id:'v003-d1', dose:'1a dose', idade_meses:2, idade_label:'2 meses', tolerancia_meses:1, tipo:'primaria' },
        { dose_id:'v003-d2', dose:'2a dose', idade_meses:4, idade_label:'4 meses', tolerancia_meses:1, tipo:'primaria' },
        { dose_id:'v003-d3', dose:'3a dose', idade_meses:6, idade_label:'6 meses', tolerancia_meses:1, tipo:'primaria' }
      ]
    },
    {
      id: 'v004', nome: 'VIP — Poliomielite Inativada',
      descricao: 'Protecao contra poliomielite — virus inativado injetavel (primovacina)',
      doenca_alvo: 'Poliomielite', via: 'Intramuscular',
      doses: [
        { dose_id:'v004-d1', dose:'1a dose', idade_meses:2, idade_label:'2 meses', tolerancia_meses:1, tipo:'primaria' },
        { dose_id:'v004-d2', dose:'2a dose', idade_meses:4, idade_label:'4 meses', tolerancia_meses:1, tipo:'primaria' },
        { dose_id:'v004-d3', dose:'3a dose', idade_meses:6, idade_label:'6 meses', tolerancia_meses:1, tipo:'primaria' }
      ]
    },
    {
      id: 'v005', nome: 'VOP — Poliomielite Oral',
      descricao: 'Reforcas de poliomielite — vacina oral (gotas)',
      doenca_alvo: 'Poliomielite', via: 'Oral',
      doses: [
        { dose_id:'v005-d1', dose:'1o reforco', idade_meses:15, idade_label:'15 meses', tolerancia_meses:2, tipo:'reforco' },
        { dose_id:'v005-d2', dose:'2o reforco', idade_meses:48, idade_label:'4 anos', tolerancia_meses:6, tipo:'reforco' }
      ]
    },
    {
      id: 'v006', nome: 'Pneumococica 10-valente',
      descricao: 'Protecao contra pneumonia, meningite e otite por pneumococo',
      doenca_alvo: 'Pneumococo', via: 'Intramuscular',
      doses: [
        { dose_id:'v006-d1', dose:'1a dose', idade_meses:2, idade_label:'2 meses', tolerancia_meses:1, tipo:'primaria' },
        { dose_id:'v006-d2', dose:'2a dose', idade_meses:4, idade_label:'4 meses', tolerancia_meses:1, tipo:'primaria' },
        { dose_id:'v006-d3', dose:'Reforco', idade_meses:12, idade_label:'12 meses', tolerancia_meses:2, tipo:'reforco' }
      ]
    },
    {
      id: 'v007', nome: 'Meningococica C (conjugada)',
      descricao: 'Protecao contra meningite meningococica do sorogrupo C',
      doenca_alvo: 'Meningite C', via: 'Intramuscular',
      doses: [
        { dose_id:'v007-d1', dose:'1a dose', idade_meses:3, idade_label:'3 meses', tolerancia_meses:1, tipo:'primaria' },
        { dose_id:'v007-d2', dose:'2a dose', idade_meses:5, idade_label:'5 meses', tolerancia_meses:1, tipo:'primaria' },
        { dose_id:'v007-d3', dose:'Reforco', idade_meses:12, idade_label:'12 meses', tolerancia_meses:2, tipo:'reforco' }
      ]
    },
    {
      id: 'v007b', nome: 'Meningococica B (rMenB)',
      descricao: 'Protecao contra meningite meningococica sorogrupo B — recomendacao SBP 2024',
      doenca_alvo: 'Meningite B', via: 'Intramuscular',
      nota: 'Disponivel na rede privada (Bexsero/Trumenba). Recomendada pela SBP. Nao disponivel no SUS.',
      doses: [
        { dose_id:'v007b-d1', dose:'1a dose', idade_meses:2, idade_label:'2 meses', tolerancia_meses:1, tipo:'primaria' },
        { dose_id:'v007b-d2', dose:'2a dose', idade_meses:4, idade_label:'4 meses', tolerancia_meses:1, tipo:'primaria' },
        { dose_id:'v007b-d3', dose:'Reforco', idade_meses:12, idade_label:'12 meses', tolerancia_meses:2, tipo:'reforco' }
      ]
    },
    {
      id: 'v008', nome: 'Rotavirus (RV1/RV5)',
      descricao: 'Protecao contra gastroenterite grave por rotavirus',
      doenca_alvo: 'Rotavirus', via: 'Oral',
      nota: 'Limite maximo de idade: 1a dose ate 3m15d; 2a dose ate 7m29d. Nao administrar apos esses limites.',
      doses: [
        { dose_id:'v008-d1', dose:'1a dose', idade_meses:2, idade_label:'2 meses', tolerancia_meses:1, tipo:'primaria', idade_max_meses:3 },
        { dose_id:'v008-d2', dose:'2a dose', idade_meses:4, idade_label:'4 meses', tolerancia_meses:1, tipo:'primaria', idade_max_meses:8 }
      ]
    },
    {
      id: 'v009', nome: 'Influenza (gripe sazonal)',
      descricao: 'Protecao contra influenza sazonal — vacinacao anual ate 5 anos',
      doenca_alvo: 'Influenza', via: 'Intramuscular',
      nota: 'Criancas entre 6m e 8 anos recebem 2 doses na 1a vez (intervalo 28 dias). Apos isso, dose unica anual.',
      doses: [
        { dose_id:'v009-d1', dose:'1a dose (1a vez)', idade_meses:6, idade_label:'6 meses', tolerancia_meses:2, tipo:'primaria' },
        { dose_id:'v009-d2', dose:'2a dose (1a vez)', idade_meses:7, idade_label:'28 dias apos 1a dose', tolerancia_meses:2, tipo:'primaria' },
        { dose_id:'v009-anual', dose:'Dose anual', idade_meses:12, idade_label:'Anualmente (campanha)', tolerancia_meses:12, tipo:'anual' }
      ]
    },
    {
      id: 'v010', nome: 'Febre Amarela',
      descricao: 'Protecao contra febre amarela — obrigatoria em areas endemicas',
      doenca_alvo: 'Febre Amarela', via: 'Subcutanea',
      doses: [
        { dose_id:'v010-d1', dose:'1a dose', idade_meses:9, idade_label:'9 meses', tolerancia_meses:3, tipo:'primaria' },
        { dose_id:'v010-d2', dose:'Reforco', idade_meses:48, idade_label:'4 anos', tolerancia_meses:6, tipo:'reforco' }
      ]
    },
    {
      id: 'v011', nome: 'SCR — Sarampo, Caxumba e Rubeola (triple viral)',
      descricao: 'Triple viral — protecao contra sarampo, caxumba e rubeola',
      doenca_alvo: 'Sarampo, Caxumba, Rubeola', via: 'Subcutanea',
      nota: 'Aos 15 meses a 2a dose e substituida pela SCRV (tetraviral, v011b) que inclui varicela.',
      doses: [
        { dose_id:'v011-d1', dose:'1a dose', idade_meses:12, idade_label:'12 meses', tolerancia_meses:2, tipo:'primaria' }
      ]
    },
    {
      id: 'v011b', nome: 'SCRV — Tetraviral (SCR + Varicela)',
      descricao: 'Tetraviral — triple viral acrescida de varicela. Substitui 2a dose SCR + 1a dose varicela.',
      doenca_alvo: 'Sarampo, Caxumba, Rubeola, Varicela', via: 'Subcutanea',
      nota: 'Administrada aos 15 meses. Inclui protecao contra varicela — nao e necessaria dose isolada de varicela nesta idade.',
      doses: [
        { dose_id:'v011b-d1', dose:'Dose unica (15 meses)', idade_meses:15, idade_label:'15 meses', tolerancia_meses:2, tipo:'primaria' }
      ]
    },
    {
      id: 'v012', nome: 'Varicela (monovalente — reforco)',
      descricao: 'Reforco isolado de varicela aos 4 anos. Aos 15 meses a varicela e dada na SCRV (v011b).',
      doenca_alvo: 'Varicela (catapora)', via: 'Subcutanea',
      doses: [
        { dose_id:'v012-d1', dose:'Reforco (4 anos)', idade_meses:48, idade_label:'4 anos', tolerancia_meses:6, tipo:'reforco' }
      ]
    },
    {
      id: 'v013', nome: 'Hepatite A',
      descricao: 'Protecao contra hepatite A viral',
      doenca_alvo: 'Hepatite A', via: 'Intramuscular',
      doses: [
        { dose_id:'v013-d1', dose:'Dose unica', idade_meses:15, idade_label:'15 meses', tolerancia_meses:3, tipo:'unica' }
      ]
    },
    {
      id: 'v014', nome: 'DTP — Triple Bacteriana (reforcas)',
      descricao: 'Reforcas de difteria, tetano e coqueluche — apos serie primaria da Pentavalente',
      doenca_alvo: 'Difteria, Tetano, Coqueluche', via: 'Intramuscular',
      doses: [
        { dose_id:'v014-d1', dose:'1o reforco', idade_meses:15, idade_label:'15 meses', tolerancia_meses:2, tipo:'reforco' },
        { dose_id:'v014-d2', dose:'2o reforco', idade_meses:48, idade_label:'4 anos', tolerancia_meses:6, tipo:'reforco' }
      ]
    },
    {
      id: 'v015b', nome: 'COVID-19 (infantil)',
      descricao: 'Protecao contra COVID-19 — esquema infantil (6 meses em diante)',
      doenca_alvo: 'COVID-19', via: 'Intramuscular',
      nota: 'Vacina e esquema variam conforme disponibilidade (Coronavac, Pfizer Baby). Siga orientacao do servico de saude.',
      doses: [
        { dose_id:'v015b-d1', dose:'1a dose', idade_meses:6, idade_label:'6 meses', tolerancia_meses:2, tipo:'primaria' },
        { dose_id:'v015b-d2', dose:'2a dose', idade_meses:7, idade_label:'1-2 meses apos 1a dose', tolerancia_meses:2, tipo:'primaria' },
        { dose_id:'v015b-d3', dose:'Reforco', idade_meses:12, idade_label:'6 meses apos 2a dose', tolerancia_meses:3, tipo:'reforco' }
      ]
    },
    {
      id: 'v015', nome: 'HPV (Papilomavirus Humano)',
      descricao: 'Protecao contra HPV — prevencao de canceres associados',
      doenca_alvo: 'HPV', via: 'Intramuscular',
      nota: '9-14 anos: 2 doses (intervalo 6 meses). Acima de 15 anos: 3 doses.',
      doses: [
        { dose_id:'v015-d1', dose:'1a dose', idade_meses:108, idade_label:'9 anos', tolerancia_meses:12, tipo:'primaria' },
        { dose_id:'v015-d2', dose:'2a dose (6 meses apos)', idade_meses:114, idade_label:'9-10 anos', tolerancia_meses:12, tipo:'primaria' }
      ]
    }
  ]
};
