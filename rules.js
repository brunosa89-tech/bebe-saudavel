'use strict';

// ═══════════════════════════════════════════════════════════════
// BEBÊ SAUDÁVEL — rules.js
// Funções puras — sem efeito colateral, sem DOM, sem DB
// Toda entrada → saída determinística e testável
// ═══════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────
// 1. IDADE
// ────────────────────────────────────────────────────────────────

/**
 * Calcula idade completa em anos, meses e dias a partir da data de nascimento.
 * @param {string|Date} dataNasc — ISO string ou Date
 * @param {Date} [referencia] — data de referência (default: hoje)
 * @returns {{ anos: number, meses: number, dias: number, meses_total: number, texto: string }}
 */
function calcularIdade(dataNasc, referencia) {
  const nasc = new Date(dataNasc);
  const ref  = referencia ? new Date(referencia) : new Date();

  let anos  = ref.getFullYear() - nasc.getFullYear();
  let meses = ref.getMonth()    - nasc.getMonth();
  let dias  = ref.getDate()     - nasc.getDate();

  if (dias < 0) {
    meses--;
    dias += new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
  }
  if (meses < 0) { anos--; meses += 12; }

  const meses_total = anos * 12 + meses;

  let texto = '';
  if (anos === 0 && meses === 0) texto = `${dias} dia${dias !== 1 ? 's' : ''}`;
  else if (anos === 0) texto = `${meses} ${meses === 1 ? 'mês' : 'meses'} e ${dias} dia${dias !== 1 ? 's' : ''}`;
  else texto = `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${meses} ${meses === 1 ? 'mês' : 'meses'}`;

  return { anos, meses, dias, meses_total, texto };
}

/**
 * Retorna a data estimada para uma idade em meses a partir de uma data de nascimento.
 */
function dataParaIdade(dataNasc, meses) {
  const d = new Date(dataNasc);
  d.setMonth(d.getMonth() + meses);
  return d;
}

// ────────────────────────────────────────────────────────────────
// 2. CRESCIMENTO
// ────────────────────────────────────────────────────────────────

/**
 * Retorna o registro mais recente de crescimento.
 */
function ultimaMedicao(registros) {
  if (!registros || registros.length === 0) return null;
  return [...registros].sort((a, b) => b.data.localeCompare(a.data))[0];
}

/**
 * Calcula IMC a partir de peso (kg) e altura (cm).
 */
function calcularIMC(pesoKg, alturaCm) {
  if (!pesoKg || !alturaCm || alturaCm === 0) return null;
  const altM = alturaCm / 100;
  return +(pesoKg / (altM * altM)).toFixed(1);
}

/**
 * Classifica IMC infantil (simplificado — não substitui avaliação médica).
 */
function classificarIMC(imc) {
  if (!imc) return null;
  if (imc < 14)   return { label: 'Abaixo do peso', cor: '#2196F3' };
  if (imc < 17)   return { label: 'Peso adequado',  cor: '#4CAF50' };
  if (imc < 19)   return { label: 'Risco sobrepeso', cor: '#FF9800' };
  return           { label: 'Sobrepeso',             cor: '#F44336' };
}

/**
 * Prepara séries para o gráfico SVG de crescimento.
 * @param {Array} registros — ordenados por data ASC
 * @returns {{ peso: Array<{data,valor}>, altura: Array<{data,valor}> }}
 */
function seriesGrafico(registros) {
  const sorted = [...registros].sort((a, b) => a.data.localeCompare(b.data));
  return {
    peso:   sorted.map(r => ({ data: r.data, valor: r.peso,   label: `${r.peso} kg` })),
    altura: sorted.map(r => ({ data: r.data, valor: r.altura, label: `${r.altura} cm` }))
  };
}

// ────────────────────────────────────────────────────────────────
// 3. VACINAS
// ────────────────────────────────────────────────────────────────

/**
 * Calcula status de vacinas com base no catálogo e nos registros do usuário.
 *
 * Correções v2:
 * - Usa dose_id para correspondência precisa (não depende do texto da dose)
 * - Fallback para vacina_id + dose texto (compatibilidade com registros antigos)
 * - Trata doses do tipo 'anual' de forma especial (não ficam "atrasadas")
 * - Registros com vacina_id='manual' aparecem em seção separada
 *
 * @param {Array}  catalogo  — CATALOGO_VACINAS.dados
 * @param {Array}  registros — vacinas registradas do usuário
 * @param {string} dataNasc  — data de nascimento ISO
 * @returns {Array} — itens do catálogo enriquecidos com status por dose
 */
function calcularStatusVacinas(catalogo, registros, dataNasc) {
  const idadeRef = dataNasc ? calcularIdade(dataNasc).meses_total : 0;

  return catalogo.map(vacina => {
    // Registros desta vacina: por vacina_id OU por nome (manual)
    const registrosVacina = registros.filter(r =>
      r.vacina_id === vacina.id ||
      (r.vacina_id === 'manual' && r.nome && r.nome.toLowerCase().includes(vacina.nome.toLowerCase()))
    );

    const doses = vacina.doses.map(dose => {
      // Correspondência: dose_id (preciso) > texto da dose > fallback
      const reg = registrosVacina.find(r =>
        r.dose_id === dose.dose_id ||
        r.dose === dose.dose ||
        (r.dose && dose.dose && r.dose.toLowerCase().includes(dose.dose.split(' ')[0].toLowerCase()))
      );

      const idadeAlvo  = dose.idade_meses;
      const idadeLimite = idadeAlvo + (dose.tolerancia_meses || 2);
      const dataAlvo   = dataNasc ? dataParaIdade(dataNasc, idadeAlvo) : null;

      let status, statusLabel, statusCor;

      if (reg) {
        status = 'aplicada'; statusLabel = 'Aplicada'; statusCor = '#4CAF50';
      } else if (dose.tipo === 'anual') {
        // Dose anual nunca fica "atrasada" — apenas indica que deve ser feita
        status = 'anual'; statusLabel = 'Anual'; statusCor = '#1976D2';
      } else if (idadeLimite <= idadeRef) {
        status = 'atrasada'; statusLabel = 'Atrasada'; statusCor = '#F44336';
      } else if (idadeAlvo <= idadeRef + 2) {
        status = 'proxima'; statusLabel = 'Em breve'; statusCor = '#FF9800';
      } else {
        status = 'futura'; statusLabel = 'Futura'; statusCor = '#9E9E9E';
      }

      return {
        ...dose,
        status, statusLabel, statusCor,
        dataAlvo: dataAlvo ? dataAlvo.toISOString().slice(0, 10) : null,
        registro: reg || null
      };
    });

    // Resumo: ignora doses 'anual' e 'futura' no cálculo de atraso
    const relevantes     = doses.filter(d => d.tipo !== 'anual');
    const todasAplicadas = relevantes.length > 0 && relevantes.every(d => d.status === 'aplicada');
    const algumAtrasada  = relevantes.some(d => d.status === 'atrasada');
    const resumoStatus   = todasAplicadas ? 'completa' : algumAtrasada ? 'atrasada' : 'pendente';

    return { ...vacina, doses, resumoStatus };
  });
}

/**
 * Retorna registros manuais (vacina_id='manual') que não foram associados
 * a nenhuma vacina do catálogo — para exibição separada na UI.
 */
function registrosManuaisNaoAssociados(catalogo, registros) {
  return registros.filter(r => {
    if (r.vacina_id !== 'manual') return false;
    // Verifica se alguma vacina do catálogo "absorveu" este registro
    const absorvido = catalogo.some(v =>
      r.nome && r.nome.toLowerCase().includes(v.nome.toLowerCase())
    );
    return !absorvido;
  });
}

/**
 * Conta o resumo de vacinas (completas / atrasadas / pendentes).
 */
function resumoVacinas(statusVacinas) {
  return {
    completas: statusVacinas.filter(v => v.resumoStatus === 'completa').length,
    atrasadas: statusVacinas.filter(v => v.resumoStatus === 'atrasada').length,
    pendentes: statusVacinas.filter(v => v.resumoStatus === 'pendente').length,
    total:     statusVacinas.length
  };
}

// ────────────────────────────────────────────────────────────────
// 4. AGENDA
// ────────────────────────────────────────────────────────────────

/**
 * Retorna os próximos eventos agendados, ordenados por data.
 */
function proximosEventos(agenda, n) {
  const hoje = new Date().toISOString().slice(0, 16);
  return agenda
    .filter(e => e.status === 'agendado' && e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, n || 5);
}

/**
 * Formata datetime ISO para exibição amigável em pt-BR.
 */
function formatarData(iso, opcoes) {
  if (!iso) return '—';
  try {
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    const opts = opcoes || { day: '2-digit', month: '2-digit', year: 'numeric' };
    return d.toLocaleDateString('pt-BR', opts);
  } catch { return iso; }
}

function formatarDataHora(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
}

/**
 * Quantos dias faltam para uma data.
 */
function diasAte(iso) {
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const alvo = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  alvo.setHours(0,0,0,0);
  return Math.round((alvo - hoje) / 86400000);
}

// ────────────────────────────────────────────────────────────────
// 5. SONO
// ────────────────────────────────────────────────────────────────

/**
 * Calcula média de horas de sono dos últimos N dias.
 */
function mediaSono(registros, dias) {
  const limite = new Date();
  limite.setDate(limite.getDate() - (dias || 7));
  const limiteISO = limite.toISOString().slice(0, 10);
  const filtrado = registros.filter(r => r.data >= limiteISO);
  if (filtrado.length === 0) return null;
  const soma = filtrado.reduce((acc, r) => acc + (r.horas || 0), 0);
  return +(soma / filtrado.length).toFixed(1);
}

// ────────────────────────────────────────────────────────────────
// 6. VALIDAÇÃO DE DADOS
// ────────────────────────────────────────────────────────────────

function validarCrescimento(obj) {
  const erros = [];
  if (!obj.data)            erros.push('Data obrigatória');
  if (!obj.peso && !obj.altura) erros.push('Informe pelo menos peso ou altura');
  if (obj.peso   && (obj.peso   < 0.5 || obj.peso   > 150)) erros.push('Peso fora do intervalo válido (0,5 a 150 kg)');
  if (obj.altura && (obj.altura < 30  || obj.altura > 250))  erros.push('Altura fora do intervalo válido (30 a 250 cm)');
  return erros;
}

function validarVacina(obj) {
  const erros = [];
  if (!obj.nome)      erros.push('Nome da vacina obrigatório');
  if (!obj.data)      erros.push('Data de aplicação obrigatória');
  if (!obj.dose)      erros.push('Dose obrigatória');
  return erros;
}

function validarAgenda(obj) {
  const erros = [];
  if (!obj.tipo)      erros.push('Tipo obrigatório');
  if (!obj.data)      erros.push('Data e hora obrigatórias');
  if (!obj.descricao) erros.push('Descrição obrigatória');
  return erros;
}

function validarPerfil(obj) {
  const erros = [];
  if (!obj.nome || obj.nome.trim().length < 2) erros.push('Nome deve ter pelo menos 2 caracteres');
  if (!obj.data_nascimento)                    erros.push('Data de nascimento obrigatória');
  return erros;
}

// ────────────────────────────────────────────────────────────────
// 7. SANITIZAÇÃO
// ────────────────────────────────────────────────────────────────

function sanitizarTexto(s) {
  if (!s) return '';
  return String(s).trim().replace(/[<>]/g, '');
}

function sanitizarNumero(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// ────────────────────────────────────────────────────────────────
// 8. GRÁFICO SVG — puro, sem biblioteca
// ────────────────────────────────────────────────────────────────

/**
 * Gera SVG de linha para uma série de dados.
 * @param {Array<{data,valor,label}>} serie
 * @param {{ cor, unidade, titulo }} opts
 * @returns {string} SVG markup (seguro — sem dados do usuário em attributes não escapados)
 */
function gerarGraficoSVG(serie, opts) {
  if (!serie || serie.length === 0) {
    return '<div style="text-align:center;padding:40px;color:#999;font-size:14px">Sem dados para exibir</div>';
  }

  const W = 340, H = 200, PAD = { top: 20, right: 20, bottom: 40, left: 44 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top  - PAD.bottom;

  const valores = serie.map(p => p.valor);
  const min = Math.min(...valores) * 0.95;
  const max = Math.max(...valores) * 1.05;
  const rng = max - min || 1;

  const xEsc = i => PAD.left + (i / Math.max(serie.length - 1, 1)) * iW;
  const yEsc = v => PAD.top  + iH - ((v - min) / rng) * iH;

  const pts = serie.map((p, i) => `${xEsc(i).toFixed(1)},${yEsc(p.valor).toFixed(1)}`).join(' ');
  const cor = opts.cor || '#4CAF50';

  // Linhas de grade
  let grade = '';
  const nGrade = 4;
  for (let i = 0; i <= nGrade; i++) {
    const y = PAD.top + (iH / nGrade) * i;
    const v = (max - (rng / nGrade) * i).toFixed(1);
    grade += `<line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${W - PAD.right}" y2="${y.toFixed(1)}" stroke="#eee" stroke-width="1"/>`;
    grade += `<text x="${PAD.left - 4}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="#999">${v}</text>`;
  }

  // Labels do eixo X (apenas primeiro, meio e último para não poluir)
  let labelsX = '';
  const idxX = serie.length <= 3
    ? serie.map((_, i) => i)
    : [0, Math.floor((serie.length - 1) / 2), serie.length - 1];
  idxX.forEach(i => {
    const d = serie[i].data.slice(5); // MM-DD
    const x = xEsc(i);
    labelsX += `<text x="${x.toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="9" fill="#999">${d}</text>`;
  });

  // Pontos e tooltips (title para acessibilidade)
  let pontos = '';
  serie.forEach((p, i) => {
    const cx = xEsc(i), cy = yEsc(p.valor);
    const lbl = String(p.label).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const dt  = String(p.data).replace(/&/g,'&amp;');
    pontos += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="${cor}" stroke="#fff" stroke-width="2">
      <title>${lbl} — ${dt}</title></circle>`;
  });

  const titulo = String(opts.titulo || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${W}px;display:block" role="img" aria-label="${titulo}">
    <title>${titulo}</title>
    ${grade}
    ${labelsX}
    <polyline points="${pts}" fill="none" stroke="${cor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <polyline points="${pts}" fill="${cor}22" stroke="none"/>
    ${pontos}
    <text x="${W/2}" y="${H - 2}" text-anchor="middle" font-size="11" fill="#555" font-weight="bold">${titulo}</text>
  </svg>`;
}


// ────────────────────────────────────────────────────────────────
// 9. CURVAS DE CRESCIMENTO OMS — Z-SCORE
// Fonte: WHO Child Growth Standards (2006)
// Tabelas simplificadas: percentis P3(-2DP), P50(mediana), P97(+2DP)
// por sexo e idade em meses.
// Para uso como referência visual — não substitui avaliação médica.
// ────────────────────────────────────────────────────────────────

// Peso por idade (kg) — MENINOS — meses 0 a 60
// [mes]: [P3, P15, P50, P85, P97]
const OMS_PESO_MENINO = {
  0:[2.5,2.9,3.3,3.9,4.3], 1:[3.4,3.9,4.5,5.1,5.7], 2:[4.3,4.9,5.6,6.3,7.0],
  3:[5.0,5.7,6.4,7.2,8.0], 4:[5.6,6.2,7.0,7.9,8.7], 5:[6.0,6.7,7.5,8.4,9.3],
  6:[6.4,7.1,7.9,8.8,9.8], 7:[6.7,7.4,8.3,9.3,10.3], 8:[6.9,7.7,8.6,9.6,10.7],
  9:[7.1,7.9,8.9,9.9,11.0], 10:[7.4,8.2,9.2,10.2,11.4], 11:[7.6,8.4,9.4,10.5,11.7],
  12:[7.7,8.6,9.6,10.8,12.0], 15:[8.4,9.4,10.4,11.7,13.1], 18:[9.0,10.0,11.1,12.5,14.0],
  21:[9.5,10.5,11.8,13.2,14.8], 24:[10.0,11.1,12.2,13.7,15.3], 30:[11.0,12.1,13.3,15.0,16.9],
  36:[11.8,13.0,14.3,16.2,18.3], 42:[12.6,13.9,15.3,17.3,19.5], 48:[13.4,14.7,16.3,18.5,20.9],
  54:[14.1,15.5,17.2,19.6,22.2], 60:[14.8,16.3,18.3,20.9,23.9]
};

// Peso por idade (kg) — MENINAS
const OMS_PESO_MENINA = {
  0:[2.4,2.8,3.2,3.7,4.2], 1:[3.2,3.6,4.2,4.8,5.5], 2:[3.9,4.5,5.1,5.8,6.6],
  3:[4.5,5.2,5.8,6.6,7.5], 4:[5.0,5.7,6.4,7.3,8.2], 5:[5.4,6.1,6.9,7.8,8.8],
  6:[5.7,6.5,7.3,8.2,9.3], 7:[6.0,6.8,7.6,8.6,9.8], 8:[6.3,7.0,7.9,9.0,10.2],
  9:[6.5,7.3,8.2,9.3,10.6], 10:[6.7,7.5,8.5,9.6,10.9], 11:[6.9,7.7,8.7,9.9,11.2],
  12:[7.0,7.9,8.9,10.1,11.5], 15:[7.6,8.6,9.6,11.0,12.5], 18:[8.1,9.1,10.2,11.7,13.4],
  21:[8.7,9.7,10.9,12.5,14.3], 24:[9.0,10.2,11.5,13.2,15.1], 30:[10.0,11.3,12.7,14.6,16.8],
  36:[10.8,12.2,13.9,16.0,18.5], 42:[11.6,13.1,15.0,17.3,20.1], 48:[12.3,14.0,16.1,18.7,21.7],
  54:[13.0,14.8,17.1,19.9,23.2], 60:[13.7,15.7,18.2,21.3,25.0]
};

// Altura por idade (cm) — MENINOS
const OMS_ALTURA_MENINO = {
  0:[46.1,48.0,49.9,51.8,53.7], 1:[50.8,52.8,54.7,56.7,58.6], 2:[54.4,56.4,58.4,60.4,62.4],
  3:[57.3,59.4,61.4,63.5,65.5], 6:[63.3,65.5,67.6,69.8,71.9], 9:[68.0,70.3,72.7,75.0,77.3],
  12:[71.7,74.3,76.9,79.6,82.3], 15:[74.8,77.5,80.2,83.0,85.7], 18:[77.5,80.2,82.9,85.6,88.4],
  24:[83.0,85.9,88.7,91.4,94.4], 30:[88.5,91.3,94.2,97.1,99.9], 36:[89.5,92.9,96.1,99.3,102.5],
  42:[92.6,96.0,99.4,102.8,106.2], 48:[95.8,99.3,103.0,106.6,110.3], 60:[101.2,105.0,109.0,113.0,117.0]
};

// Altura por idade (cm) — MENINAS
const OMS_ALTURA_MENINA = {
  0:[45.4,47.3,49.1,51.0,52.9], 1:[49.8,51.7,53.7,55.6,57.6], 2:[53.0,55.0,57.1,59.1,61.1],
  3:[55.6,57.7,59.8,61.9,64.0], 6:[61.2,63.3,65.7,68.0,70.2], 9:[66.1,68.3,70.1,72.9,75.1],
  12:[69.2,71.7,74.3,76.9,79.4], 15:[72.0,74.7,77.5,80.2,82.9], 18:[74.4,77.3,80.2,83.2,86.1],
  24:[80.0,83.1,86.4,89.8,93.1], 30:[85.7,89.1,92.7,96.3,99.9], 36:[87.6,91.2,95.1,99.0,103.0],
  42:[90.7,94.4,98.4,102.5,106.5], 48:[93.8,97.6,101.6,105.7,109.7], 60:[99.0,103.1,107.2,111.4,115.5]
};

/**
 * Encontra os valores de referência OMS mais próximos para uma idade.
 * @param {object} tabela — ex: OMS_PESO_MENINO
 * @param {number} idadeMeses
 * @returns {Array|null} [P3,P15,P50,P85,P97] ou null
 */
function _omsMaisProximo(tabela, idadeMeses) {
  const idades = Object.keys(tabela).map(Number).sort((a,b) => a-b);
  // Encontra o mais próximo por baixo
  let melhor = null;
  for (const idade of idades) {
    if (idade <= idadeMeses) melhor = idade;
    else break;
  }
  return melhor !== null ? tabela[melhor] : null;
}

/**
 * Interpola linearmente entre dois pontos de referência OMS.
 */
function _omsInterpolar(tabela, idadeMeses) {
  const idades = Object.keys(tabela).map(Number).sort((a,b) => a-b);
  let anterior = null, proximo = null;
  for (const idade of idades) {
    if (idade <= idadeMeses) anterior = idade;
    if (idade >= idadeMeses && proximo === null) proximo = idade;
  }
  if (anterior === null) return tabela[proximo];
  if (proximo === null || anterior === proximo) return tabela[anterior];
  const t = (idadeMeses - anterior) / (proximo - anterior);
  return tabela[anterior].map((v,i) => +(v + t * (tabela[proximo][i] - v)).toFixed(2));
}

/**
 * Retorna curvas de referência OMS para uma faixa de idades.
 * @param {'peso'|'altura'} tipo
 * @param {'M'|'F'} sexo
 * @param {number} idadeMinMeses
 * @param {number} idadeMaxMeses
 * @returns {Array<{meses, P3, P15, P50, P85, P97}>}
 */
function curvaBruta(tipo, sexo, idadeMinMeses, idadeMaxMeses) {
  const tabela = tipo === 'peso'
    ? (sexo === 'M' ? OMS_PESO_MENINO : OMS_PESO_MENINA)
    : (sexo === 'M' ? OMS_ALTURA_MENINO : OMS_ALTURA_MENINA);

  const resultado = [];
  const idades = Object.keys(tabela).map(Number).sort((a,b) => a-b)
    .filter(m => m >= idadeMinMeses && m <= idadeMaxMeses);

  idades.forEach(m => {
    const ref = tabela[m];
    resultado.push({ meses:m, P3:ref[0], P15:ref[1], P50:ref[2], P85:ref[3], P97:ref[4] });
  });
  return resultado;
}

/**
 * Classifica um valor (peso ou altura) em relação às curvas OMS.
 * @param {number} valor
 * @param {number} idadeMeses
 * @param {'peso'|'altura'} tipo
 * @param {'M'|'F'} sexo
 * @returns {{ classificacao: string, cor: string, detalhe: string }}
 */
function classificarOMS(valor, idadeMeses, tipo, sexo) {
  if (!valor || !idadeMeses) return null;
  const tabela = tipo === 'peso'
    ? (sexo === 'M' ? OMS_PESO_MENINO : OMS_PESO_MENINA)
    : (sexo === 'M' ? OMS_ALTURA_MENINO : OMS_ALTURA_MENINA);
  const ref = _omsInterpolar(tabela, idadeMeses);
  if (!ref) return null;
  const [P3, P15, P50, P85, P97] = ref;
  const unidade = tipo === 'peso' ? 'kg' : 'cm';

  if (valor < P3)  return { classificacao: 'Muito abaixo', cor:'#F44336', detalhe:`Abaixo do percentil 3 (ref: ${P3}${unidade})` };
  if (valor < P15) return { classificacao: 'Abaixo', cor:'#FF9800', detalhe:`Entre P3 e P15 (ref. mediana: ${P50}${unidade})` };
  if (valor <= P85) return { classificacao: 'Adequado', cor:'#4CAF50', detalhe:`Dentro da faixa esperada (mediana: ${P50}${unidade})` };
  if (valor <= P97) return { classificacao: 'Acima', cor:'#FF9800', detalhe:`Entre P85 e P97 (ref. mediana: ${P50}${unidade})` };
  return { classificacao: 'Muito acima', cor:'#F44336', detalhe:`Acima do percentil 97 (ref: ${P97}${unidade})` };
}

/**
 * Gera gráfico SVG com curva da criança + curvas de referência OMS.
 * @param {Array<{data,valor,label}>} serie — dados da criança
 * @param {Array} curvaRef — resultado de curvaBruta()
 * @param {string} dataNasc — para converter data em meses
 * @param {{ cor, titulo, unidade }} opts
 */
function gerarGraficoOMS(serie, curvaRef, dataNasc, opts) {
  if (!serie || serie.length === 0) {
    return '<div style="text-align:center;padding:40px;color:#999;font-size:14px">Sem dados para exibir. Registre medições primeiro.</div>';
  }

  const W = 340, H = 220;
  const PAD = { top: 20, right: 20, bottom: 44, left: 44 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top  - PAD.bottom;

  // Converte datas em meses para eixo X
  const serieMeses = serie.map(p => ({
    ...p,
    meses: dataNasc ? calcularIdade(dataNasc, new Date(p.data + 'T00:00:00')).meses_total : 0
  })).filter(p => p.valor).sort((a,b) => a.meses - b.meses);

  if (serieMeses.length === 0) {
    return '<div style="text-align:center;padding:40px;color:#999;font-size:14px">Sem dados para exibir.</div>';
  }

  // Determina domínio X (meses)
  const allMeses = [
    ...serieMeses.map(p => p.meses),
    ...(curvaRef || []).map(c => c.meses)
  ];
  const xMin = Math.max(0, Math.min(...allMeses) - 1);
  const xMax = Math.max(...allMeses) + 1;
  const xRng = xMax - xMin || 1;

  // Determina domínio Y (valores)
  const allVals = [
    ...serieMeses.map(p => p.valor),
    ...(curvaRef || []).flatMap(c => [c.P3, c.P97])
  ].filter(Boolean);
  const yMin = Math.min(...allVals) * 0.95;
  const yMax = Math.max(...allVals) * 1.05;
  const yRng = yMax - yMin || 1;

  const xE = m => PAD.left + ((m - xMin) / xRng) * iW;
  const yE = v => PAD.top  + iH - ((v - yMin) / yRng) * iH;

  // Grade
  let grade = '';
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (iH / 4) * i;
    const v = (yMax - (yRng / 4) * i).toFixed(1);
    grade += `<line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${W-PAD.right}" y2="${y.toFixed(1)}" stroke="#eee" stroke-width="1"/>`;
    grade += `<text x="${PAD.left-4}" y="${(y+4).toFixed(1)}" text-anchor="end" font-size="9" fill="#aaa">${v}</text>`;
  }

  // Labels eixo X (meses)
  let labelsX = '';
  const xTicks = [xMin, Math.round((xMin+xMax)/2), xMax].filter((v,i,a) => a.indexOf(v) === i);
  xTicks.forEach(m => {
    const x = xE(m);
    labelsX += `<text x="${x.toFixed(1)}" y="${H-28}" text-anchor="middle" font-size="9" fill="#aaa">${Math.round(m)}m</text>`;
  });
  labelsX += `<text x="${(W/2).toFixed(1)}" y="${H-14}" text-anchor="middle" font-size="10" fill="#888">Idade (meses)</text>`;

  // Curvas de referência OMS
  let curvas = '';
  if (curvaRef && curvaRef.length >= 2) {
    const buildPolyline = (key, cor, dash) => {
      const pts = curvaRef.map(c => `${xE(c.meses).toFixed(1)},${yE(c[key]).toFixed(1)}`).join(' ');
      return `<polyline points="${pts}" fill="none" stroke="${cor}" stroke-width="1.5" stroke-dasharray="${dash||''}" opacity="0.7"/>`;
    };
    curvas += buildPolyline('P97', '#F44336', '4,3');
    curvas += buildPolyline('P85', '#FF9800', '3,2');
    curvas += buildPolyline('P50', '#4CAF50', '');
    curvas += buildPolyline('P15', '#FF9800', '3,2');
    curvas += buildPolyline('P3',  '#F44336', '4,3');

    // Legenda
    const lx = PAD.left + 4, ly = PAD.top + 6;
    curvas += `<rect x="${lx}" y="${ly}" width="68" height="42" rx="3" fill="white" opacity="0.8"/>`;
    curvas += `<line x1="${lx+4}" y1="${ly+8}" x2="${lx+16}" y2="${ly+8}" stroke="#4CAF50" stroke-width="1.5"/><text x="${lx+19}" y="${ly+11}" font-size="8" fill="#555">Mediana</text>`;
    curvas += `<line x1="${lx+4}" y1="${ly+20}" x2="${lx+16}" y2="${ly+20}" stroke="#FF9800" stroke-width="1.5" stroke-dasharray="3,2"/><text x="${lx+19}" y="${ly+23}" font-size="8" fill="#555">P15/P85</text>`;
    curvas += `<line x1="${lx+4}" y1="${ly+32}" x2="${lx+16}" y2="${ly+32}" stroke="#F44336" stroke-width="1.5" stroke-dasharray="4,3"/><text x="${lx+19}" y="${ly+35}" font-size="8" fill="#555">P3/P97</text>`;
  }

  // Curva da criança
  const ptsC = serieMeses.map(p => `${xE(p.meses).toFixed(1)},${yE(p.valor).toFixed(1)}`).join(' ');
  const corC = opts.cor || '#1976D2';
  let pontos = '';
  serieMeses.forEach(p => {
    const cx = xE(p.meses), cy = yE(p.valor);
    const lbl = String(p.label).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    pontos += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="${corC}" stroke="#fff" stroke-width="2"><title>${lbl} — ${p.meses}m</title></circle>`;
  });

  const titulo = String(opts.titulo || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${W}px;display:block" role="img" aria-label="${titulo}">
    <title>${titulo}</title>
    ${grade}${labelsX}${curvas}
    <polyline points="${ptsC}" fill="none" stroke="${corC}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${pontos}
    <text x="${(W/2).toFixed(1)}" y="${H-2}" text-anchor="middle" font-size="11" fill="#555" font-weight="bold">${titulo}</text>
  </svg>`;
}

// Exportação global
window.Rules = {
  calcularIdade,
  dataParaIdade,
  ultimaMedicao,
  calcularIMC,
  classificarIMC,
  seriesGrafico,
  calcularStatusVacinas,
  resumoVacinas,
  proximosEventos,
  formatarData,
  formatarDataHora,
  diasAte,
  mediaSono,
  validarCrescimento,
  validarVacina,
  validarAgenda,
  validarPerfil,
  sanitizarTexto,
  sanitizarNumero,
  gerarGraficoSVG,
  curvaBruta,
  classificarOMS,
  gerarGraficoOMS,
  registrosManuaisNaoAssociados
};
