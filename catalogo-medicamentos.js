'use strict';

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO DE MEDICAMENTOS — Referência Pediátrica
// Fonte: Formulário Terapêutico Nacional / SBP
// Versão: 2024.1
// ATENÇÃO: Uso apenas como referência de nomenclatura.
// Posologia SEMPRE conforme orientação médica.
// ═══════════════════════════════════════════════════════════════

const CATALOGO_MEDICAMENTOS = {
  versao: '2024.1',
  data_geracao: '2024-01-01',
  fonte: 'Formulário Terapêutico Nacional / SBP — Referência 2024',
  aviso: 'Este catálogo serve apenas como referência de nomenclatura. Posologia e indicação devem ser sempre definidas pelo médico responsável.',
  dados: [
    // ── Analgésicos / Antitérmicos ──
    {
      id: 'm001', categoria: 'Analgésico / Antitérmico',
      nome: 'Paracetamol (Acetaminofeno)',
      nomes_comerciais: ['Tylenol', 'Dorflex (adulto)', 'Febralgin'],
      forma: 'Solução oral, comprimido',
      uso_tipico: 'Dor e febre'
    },
    {
      id: 'm002', categoria: 'Analgésico / Antitérmico',
      nome: 'Ibuprofeno',
      nomes_comerciais: ['Alivium', 'Advil', 'Motrin'],
      forma: 'Solução oral, comprimido',
      uso_tipico: 'Dor, febre e inflamação — acima de 6 meses'
    },
    {
      id: 'm003', categoria: 'Analgésico / Antitérmico',
      nome: 'Dipirona Sódica',
      nomes_comerciais: ['Novalgina', 'Analgex'],
      forma: 'Solução oral, supositório',
      uso_tipico: 'Dor e febre'
    },
    // ── Antibióticos ──
    {
      id: 'm004', categoria: 'Antibiótico',
      nome: 'Amoxicilina',
      nomes_comerciais: ['Amoxil', 'Flemoxin'],
      forma: 'Suspensão oral, cápsula',
      uso_tipico: 'Infecções bacterianas (otite, faringite, pneumonia)'
    },
    {
      id: 'm005', categoria: 'Antibiótico',
      nome: 'Amoxicilina + Clavulanato',
      nomes_comerciais: ['Clavulin', 'Augmentin'],
      forma: 'Suspensão oral',
      uso_tipico: 'Infecções resistentes à amoxicilina simples'
    },
    {
      id: 'm006', categoria: 'Antibiótico',
      nome: 'Azitromicina',
      nomes_comerciais: ['Zitromax', 'Azitromicina EMS'],
      forma: 'Suspensão oral, comprimido',
      uso_tipico: 'Infecções respiratórias, otite — alergia à penicilina'
    },
    {
      id: 'm007', categoria: 'Antibiótico',
      nome: 'Cefalexina',
      nomes_comerciais: ['Keflex', 'Cefalexina'],
      forma: 'Suspensão oral, cápsula',
      uso_tipico: 'Infecções de pele e vias respiratórias'
    },
    // ── Antialérgicos ──
    {
      id: 'm008', categoria: 'Antialérgico',
      nome: 'Loratadina',
      nomes_comerciais: ['Claritin', 'Loratamed'],
      forma: 'Solução oral, comprimido',
      uso_tipico: 'Rinite alérgica, urticária — acima de 2 anos'
    },
    {
      id: 'm009', categoria: 'Antialérgico',
      nome: 'Cetirizina',
      nomes_comerciais: ['Zyrtec', 'Cetrizin'],
      forma: 'Solução oral, comprimido',
      uso_tipico: 'Rinite alérgica, urticária — acima de 6 meses'
    },
    {
      id: 'm010', categoria: 'Antialérgico',
      nome: 'Dexclorfeniramina',
      nomes_comerciais: ['Polaramine'],
      forma: 'Solução oral, comprimido',
      uso_tipico: 'Reações alérgicas'
    },
    // ── Respiratório ──
    {
      id: 'm011', categoria: 'Broncodilatador',
      nome: 'Salbutamol (Albuterol)',
      nomes_comerciais: ['Aerolin', 'Sultanol'],
      forma: 'Aerossol inalatório, solução nebulização',
      uso_tipico: 'Broncoespasmo, asma, sibilância'
    },
    {
      id: 'm012', categoria: 'Corticoide Inalatório',
      nome: 'Budesonida',
      nomes_comerciais: ['Pulmicort', 'Budesonida'],
      forma: 'Aerossol inalatório, solução nebulização',
      uso_tipico: 'Asma, rinite alérgica — manutenção'
    },
    {
      id: 'm013', categoria: 'Corticoide Oral',
      nome: 'Prednisolona',
      nomes_comerciais: ['Predsim', 'Prelone'],
      forma: 'Solução oral',
      uso_tipico: 'Crise asmática, reação alérgica grave, laringite'
    },
    // ── Gastrointestinal ──
    {
      id: 'm014', categoria: 'Probiótico',
      nome: 'Saccharomyces boulardii',
      nomes_comerciais: ['Floratil'],
      forma: 'Sachê, cápsula',
      uso_tipico: 'Diarreia, reposição de flora intestinal'
    },
    {
      id: 'm015', categoria: 'Antiemético',
      nome: 'Ondansetrona',
      nomes_comerciais: ['Vonau', 'Zofran'],
      forma: 'Solução oral, comprimido',
      uso_tipico: 'Náusea e vômito'
    },
    {
      id: 'm016', categoria: 'Laxativo',
      nome: 'Macrogol (Polietilenoglicol)',
      nomes_comerciais: ['Muvinlax', 'Nulax'],
      forma: 'Sachê',
      uso_tipico: 'Constipação intestinal'
    },
    {
      id: 'm017', categoria: 'Protetor Gástrico',
      nome: 'Omeprazol',
      nomes_comerciais: ['Losec', 'Omeprazol'],
      forma: 'Cápsula, sachê',
      uso_tipico: 'Refluxo gastroesofágico, proteção gástrica'
    },
    // ── Dermatológico ──
    {
      id: 'm018', categoria: 'Dermatológico',
      nome: 'Hidrocortisona',
      nomes_comerciais: ['Cortaid', 'Hc45'],
      forma: 'Creme, pomada',
      uso_tipico: 'Dermatite, eczema, irritações cutâneas'
    },
    {
      id: 'm019', categoria: 'Dermatológico',
      nome: 'Óxido de Zinco',
      nomes_comerciais: ['Hipoglós', 'Bepantol Baby'],
      forma: 'Creme, pomada',
      uso_tipico: 'Assadura, proteção cutânea'
    },
    // ── Vitaminas e Suplementos ──
    {
      id: 'm020', categoria: 'Vitamina / Suplemento',
      nome: 'Vitamina D3',
      nomes_comerciais: ['Addera D3', 'Depura'],
      forma: 'Gotas, cápsula',
      uso_tipico: 'Suplementação de vitamina D — indicada rotineiramente até 2 anos'
    },
    {
      id: 'm021', categoria: 'Vitamina / Suplemento',
      nome: 'Sulfato Ferroso',
      nomes_comerciais: ['Noripurum', 'Fer-In-Sol'],
      forma: 'Solução oral',
      uso_tipico: 'Prevenção e tratamento de anemia ferropriva'
    },
    {
      id: 'm022', categoria: 'Vitamina / Suplemento',
      nome: 'Vitamina A',
      nomes_comerciais: ['Arovit'],
      forma: 'Gotas, cápsula',
      uso_tipico: 'Suplementação — campanhas nacionais'
    }
  ]
};
