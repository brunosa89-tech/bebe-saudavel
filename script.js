'use strict';

// ═══════════════════════════════════════════════════════════════
// BEBÊ SAUDÁVEL — script.js  |  UI apenas
// Sem lógica de negócio — delega para Rules e DB
// ═══════════════════════════════════════════════════════════════

const R  = window.Rules;
const DB = window.DB;

// ── Escape seguro para HTML ──
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Toast ──
function toast(msg, dur) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur || 2800);
}

// ── Modal ──
function openModal(id)  { document.getElementById(id)?.classList.add('open');  document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); document.body.style.overflow=''; }

// ── Tabs ──
let _tabAtual = 'perfil';
function switchTab(nome) {
  _tabAtual = nome;
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + nome)?.classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${nome}"]`)?.classList.add('active');
  document.querySelector('.btn-fab')?.remove();
  renderTab(nome);
}

async function renderTab(nome) {
  switch (nome) {
    case 'perfil':       await renderPerfil();       break;
    case 'crescimento':  await renderCrescimento();  break;
    case 'vacinas':      await renderVacinas();      break;
    case 'medicamentos': await renderMedicamentos(); break;
    case 'agenda':       await renderAgenda();       break;
    case 'contatos':     await renderContatos();     break;
  }
}


// ════════════════════════════════════════════════════════
// DESENVOLVIMENTO INFANTIL — dados da Caderneta MS 7ª ed.
// Fonte: Portaria MS / Caderneta da Criança 2024
// Apenas faixas etárias relevantes (3–6 anos)
// ════════════════════════════════════════════════════════
const DESENVOLVIMENTO = {
  faixas: [
    {
      id: 'f3a_3a6m',
      label: '3 a 3 anos e meio',
      idadeMinMeses: 36, idadeMaxMeses: 41,
      marcos: [
        'Pula com os dois pés no lugar',
        'Sobe escadas alternando os pés',
        'Corre bem, muda de direção',
        'Desenha uma pessoa com pelo menos 3 partes do corpo',
        'Usa frases com 4 a 5 palavras',
        'Faz perguntas "por quê?"',
        'Compreende conceitos como "em cima", "embaixo", "dentro", "fora"',
        'Brinca de faz de conta com outras crianças',
        'Reconhece e nomeia cores básicas',
        'Come sozinha com pouca ajuda'
      ]
    },
    {
      id: 'f3a6m_5a',
      label: '3 anos e meio a 5 anos',
      idadeMinMeses: 42, idadeMaxMeses: 59,
      marcos: [
        'Equilibra-se em um pé por 2 a 5 segundos',
        'Pula em um pé só',
        'Chuta bola com precisão',
        'Usa tesoura para cortar papel',
        'Copia um círculo e um quadrado',
        'Conta até 5 objetos',
        'Conta uma história com início, meio e fim',
        'Brinca de faz de conta: casinha, escola, histórias',
        'Aceia e segue regras de jogos simples',
        'Faz analogy: "O fogo é quente, o gelo é…"',
        'Entende o que é passado e futuro (ontem, amanhã)',
        'Veste-se com pouca ajuda'
      ]
    },
    {
      id: 'f5a_6a',
      label: '5 a 6 anos',
      idadeMinMeses: 60, idadeMaxMeses: 71,
      marcos: [
        'Marcha ponta-calcanhar em linha reta',
        'Equilibra-se em cada pé por 7 segundos',
        'Brinca de fazer de conta em contexto familiar (casinha, escola)',
        'Desenha pessoa com 6 partes do corpo',
        'Faz analogia verbal',
        'Copia um quadrado corretamente',
        'Aceita e segue regras nos jogos de mesa',
        'Define 5 a 7 palavras',
        'Reconhece letras e números simples',
        'Demonstra preferência por amigos específicos'
      ]
    },
    {
      id: 'f6a_9a',
      label: '6 a 9 anos',
      idadeMinMeses: 72, idadeMaxMeses: 119,
      marcos: [
        'Lê com compreensão textos simples',
        'Escreve frases e pequenos textos',
        'Realiza operações matemáticas básicas',
        'Participa de jogos com regras complexas',
        'Demonstra maior independência (se veste, higieniza, organiza material)',
        'Tem amizades estáveis e prefere amigos da mesma idade',
        'Entende o ponto de vista de outras pessoas',
        'Consegue se concentrar em tarefas por 20 a 30 minutos',
        'Resolve conflitos com palavras (nem sempre, mas frequentemente)',
        'Demonstra noções de honestidade e justiça'
      ]
    }
  ],
  sinaisAlerta: [
    'Não busca interação com outras crianças ou adultos',
    'Apresenta muita agressividade sem motivo aparente',
    'Tem muita dificuldade com a fala — não é entendida pela família',
    'Apresenta intensa agitação, impulsividade e falta de atenção',
    'Tem grande dificuldade para seguir regras simples',
    'Não consegue ficar longe dos pais por breves períodos (ex: na escola)',
    'Apresenta faz gestos ou movimentos repetitivos sem função',
    'Tem sensibilidade exacerbada a ruídos comuns (aspirador, liquidificador)',
    'Tem dificuldade com o sono ou a alimentação persistente',
    'Demora mais que as outras crianças para alcançar marcos da sua faixa'
  ]
};

// Sinais de deficiência visual e auditiva (Caderneta MS — p. 57)
const SINAIS_SENSORIAIS = {
  visual: [
    'Grande dificuldade em prestar atenção nos objetos ou pessoas',
    'Parece desinteressada por brinquedos ou pelo ambiente',
    'Aproxima objetos muito perto dos olhos para ver',
    'Tem dificuldade para se movimentar (rolar, engatinhar, andar)',
    'Aperta ou esfrega os olhos, franze a testa, presta atenção em pontos luminosos'
  ],
  auditiva: [
    'Não reage a barulhos do ambiente (porta batendo, vozes, brinquedos)',
    'Só atende quando está olhando diretamente para a pessoa',
    'Fala pouco ou não fala de forma clara para a idade',
    'Ouve rádio ou TV sempre em volume muito alto'
  ]
};

// Prevenção de acidentes por faixa etária (Caderneta MS — p. 61-65)
const ACIDENTES = [
  {
    faixa: '2 a 4 anos',
    idadeMinMeses: 24, idadeMaxMeses: 47,
    riscos: [
      { tipo: 'Afogamento', dica: 'Nunca deixe a criança sozinha perto de água (piscina, balde, banheira). Coloque cerca de proteção em piscinas.' },
      { tipo: 'Quedas', dica: 'Instale proteção nas janelas e escadas. Não deixe subir em móveis.' },
      { tipo: 'Intoxicação', dica: 'Guarde medicamentos, produtos de limpeza e inseticidas fora do alcance com chave.' },
      { tipo: 'Queimaduras', dica: 'Mantenha longe do fogão, forno, ferro e velas. Use protetores de tomada.' },
      { tipo: 'Sufocação', dica: 'Evite objetos pequenos, sacos plásticos e alimentos como uvas, nozes e balas redondas inteiras.' }
    ]
  },
  {
    faixa: '4 a 6 anos',
    idadeMinMeses: 48, idadeMaxMeses: 71,
    riscos: [
      { tipo: 'Trânsito', dica: 'Use cadeirinha corretamente. Ensine a só atravessar na faixa com adulto. Capacete em bicicleta.' },
      { tipo: 'Afogamento', dica: 'Ensinamento de natação é ótimo, mas nunca substitui supervisão adulta na água.' },
      { tipo: 'Quedas', dica: 'Supervise brincadeiras em parques e brinquedos altos. Confirme a segurança do equipamento.' },
      { tipo: 'Queimaduras', dica: 'Ensine que fogão, ferro e fio elétrico machucam. Supervisione manejo de fósforos.' },
      { tipo: 'Violência', dica: 'Ensine sobre o próprio corpo: ninguém deve tocar em partes íntimas. Incentive que conte ao adulto de confiança.' }
    ]
  }
];

// Guia de tempo de tela (Caderneta MS — p. 60)
const TEMPO_TELA = [
  { idadeMinMeses: 0,  idadeMaxMeses: 23,  recomendacao: 'Nenhuma exposição a telas. O convívio familiar e social é fundamental nesta fase.' },
  { idadeMinMeses: 24, idadeMaxMeses: 59,  recomendacao: 'Máximo 1 hora por dia. Sempre com supervisão adulta e conteúdo adequado à idade.' },
  { idadeMinMeses: 60, idadeMaxMeses: 119, recomendacao: 'Limitar o tempo. Sem TV ou computador no quarto. Antes dos 12 anos, sem celular próprio.' }
];

// Guia de saúde bucal (Caderneta MS — p. 58-59)
const SAUDE_BUCAL = {
  fases: [
    { label: 'Primeiros dentes (6 meses–3 anos)', dica: '2 escovações por dia com escova infantil de cerdas macias. Creme dental com flúor do tamanho de um grão de arroz até 3a 11m.' },
    { label: 'A partir dos 4 anos', dica: 'Creme dental equivalente a um grão de ervilha. Mínimo 1.000 ppm de flúor (verifique no tubo). Usar fio dental quando os dentes estiverem juntos.' },
    { label: 'Primeiro molar permanente (~6 anos)', dica: 'Por volta dos 6 anos nasce o primeiro molar permanente — um dente maior logo após o último dente de leite. Escovar com atenção especial.' },
    { label: 'Troca dos dentes de leite (6-14 anos)', dica: 'Os dentes de leite são trocados pelos permanentes. A dentição permanente completa-se em torno dos 18 anos.' }
  ],
  alertas: [
    'Nunca adicione açúcar ou achocolatado à mamadeira',
    'Faça higiene bucal após a mamada noturna ou antes de dormir',
    'Trauma dentário: procure o dentista imediatamente. Se o dente permanente sair, lave em água corrente e leve ao dentista em leite ou soro fisiológico',
    'Cárie evolui rapidamente em criança — consulta odontológica regular é essencial'
  ]
};

// ════════════════════════════════════════════════════════
// ABA: PERFIL
// ════════════════════════════════════════════════════════
async function renderPerfil() {
  const [perfil, medList, vacinasList, agendaList, plano] = await Promise.all([
    DB.Perfil.get(),
    DB.Crescimento.listar(),
    DB.Vacinas.listar(),
    DB.Agenda.listar(),
    DB.PlanoSaude.get()
  ]);

  const el = document.getElementById('tab-perfil');
  if (!perfil) {
    el.innerHTML = `<div class="card">
      <div class="empty"><div class="empty-icon">👶</div>
      <div class="empty-text">Bem-vindo! Cadastre os dados da criança para começar.</div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="abrirFormPerfil()">Cadastrar Criança</button>
      </div></div>`;
    return;
  }

  const idade = R.calcularIdade(perfil.data_nascimento);
  const ultima = R.ultimaMedicao(medList);
  const proximos = R.proximosEventos(agendaList, 3);
  const statusVac = R.calcularStatusVacinas(
    typeof CATALOGO_VACINAS !== 'undefined' ? CATALOGO_VACINAS.dados : [],
    vacinasList, perfil.data_nascimento
  );
  const resVac = R.resumoVacinas(statusVac);

  let html = `
    <div class="perfil-hero">
      <div class="perfil-avatar">👶</div>
      <div class="perfil-nome">${esc(perfil.nome)}</div>
      <div class="perfil-idade">${esc(idade.texto)}</div>
      ${perfil.tipo_sanguineo ? `<div class="perfil-tipo">🩸 ${esc(perfil.tipo_sanguineo)}</div>` : ''}
    </div>

    <div class="resumo-grid">
      <div class="resumo-card verde">
        <div class="resumo-val">${ultima ? ultima.peso + ' kg' : '—'}</div>
        <div class="resumo-label">Peso atual</div>
      </div>
      <div class="resumo-card">
        <div class="resumo-val">${ultima ? ultima.altura + ' cm' : '—'}</div>
        <div class="resumo-label">Altura atual</div>
      </div>
      <div class="resumo-card ${resVac.atrasadas > 0 ? 'verm' : 'verde'}">
        <div class="resumo-val">${resVac.completas}/${resVac.total}</div>
        <div class="resumo-label">Vacinas OK</div>
      </div>
      <div class="resumo-card laranja">
        <div class="resumo-val">${proximos.length}</div>
        <div class="resumo-label">Próx. consultas</div>
      </div>
    </div>`;

  // Próximos eventos
  if (proximos.length > 0) {
    html += `<div class="card"><div class="card-title">📅 Próximos agendamentos</div>`;
    proximos.forEach(e => {
      const dias = R.diasAte(e.data);
      html += `<div class="agenda-item">
        <div class="agenda-data">${R.formatarDataHora(e.data)}</div>
        <div class="agenda-desc">${esc(e.descricao)}</div>
        ${e.local ? `<div class="agenda-local">📍 ${esc(e.local)}</div>` : ''}
        <div class="agenda-faltam">${dias === 0 ? 'Hoje!' : dias > 0 ? `em ${dias} dia${dias!==1?'s':''}` : `há ${Math.abs(dias)} dia${Math.abs(dias)!==1?'s':''}`}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // Plano de saúde
  if (plano) {
    html += `<div class="plano-card">
      <div class="plano-label">Plano de Saúde</div>
      <div class="plano-valor">${esc(plano.nome)}</div>
      <div class="plano-label">Número da carteirinha</div>
      <div class="plano-valor" style="font-size:14px">${esc(plano.numero)}</div>
      ${plano.telefone ? `<div style="font-size:13px;opacity:.8">☎ ${esc(plano.telefone)}</div>` : ''}
    </div>`;
  }

  html += `<div style="display:flex;gap:8px;margin-top:4px">
    <button class="btn btn-outline btn-sm" style="flex:1" onclick="abrirFormPerfil()">✏️ Editar dados</button>
    <button class="btn btn-outline btn-sm" style="flex:1" onclick="abrirFormPlano()">🏥 Plano de saúde</button>
  </div>`;

  // Seções contextualizadas por idade
  if (perfil) {
    const idadeMeses = R.calcularIdade(perfil.data_nascimento).meses_total || 0;
    html += renderDesenvolvimento(idadeMeses);
    html += renderSaudeBucal();
  }

  el.innerHTML = html;
}

// ── FORM PERFIL ──
async function abrirFormPerfil() {
  const perfil = await DB.Perfil.get() || {};
  document.getElementById('fp-nome').value         = perfil.nome || '';
  document.getElementById('fp-nasc').value         = perfil.data_nascimento || '';
  document.getElementById('fp-sexo').value         = perfil.sexo || '';
  document.getElementById('fp-sangue').value       = perfil.tipo_sanguineo || '';
  document.getElementById('fp-obs').value          = perfil.observacoes || '';
  openModal('modal-perfil');
}
window.abrirFormPerfil = abrirFormPerfil;

async function salvarPerfil() {
  const obj = {
    nome:             R.sanitizarTexto(document.getElementById('fp-nome').value),
    data_nascimento:  document.getElementById('fp-nasc').value,
    sexo:             document.getElementById('fp-sexo').value || null,
    tipo_sanguineo:   document.getElementById('fp-sangue').value,
    observacoes:      R.sanitizarTexto(document.getElementById('fp-obs').value)
  };
  const erros = R.validarPerfil(obj);
  if (erros.length) { toast('⚠️ ' + erros[0]); return; }
  await DB.Perfil.salvar(obj);
  closeModal('modal-perfil');
  toast('✓ Dados salvos');
  renderPerfil();
}

// ── FORM PLANO ──
async function abrirFormPlano() {
  const plano = await DB.PlanoSaude.get() || {};
  document.getElementById('pl-nome').value   = plano.nome || '';
  document.getElementById('pl-num').value    = plano.numero || '';
  document.getElementById('pl-tel').value    = plano.telefone || '';
  openModal('modal-plano');
}
window.abrirFormPlano = abrirFormPlano;

async function salvarPlano() {
  const obj = {
    nome:     R.sanitizarTexto(document.getElementById('pl-nome').value),
    numero:   R.sanitizarTexto(document.getElementById('pl-num').value),
    telefone: R.sanitizarTexto(document.getElementById('pl-tel').value)
  };
  await DB.PlanoSaude.salvar(obj);
  closeModal('modal-plano');
  toast('✓ Plano salvo');
  renderPerfil();
}

// ════════════════════════════════════════════════════════
// ABA: CRESCIMENTO
// ════════════════════════════════════════════════════════
let _crescTab = 'grafico';

async function renderCrescimento() {
  const [registros, perfil] = await Promise.all([DB.Crescimento.listar(), DB.Perfil.get()]);
  const el = document.getElementById('tab-crescimento');
  const ultima = R.ultimaMedicao(registros);
  const series = R.seriesGrafico(registros);

  let html = `<div class="pill-tabs">
    <button class="pill-tab ${_crescTab==='grafico'?'active':''}" onclick="setCrescTab('grafico')">📈 Gráficos</button>
    <button class="pill-tab ${_crescTab==='historico'?'active':''}" onclick="setCrescTab('historico')">📋 Histórico</button>
  </div>`;

  if (_crescTab === 'grafico') {
    if (ultima) {
      const imc = R.calcularIMC(ultima.peso, ultima.altura);
      const cls = R.classificarIMC(imc);
      html += `<div class="card">
        <div class="card-title">📏 Última Medição — ${R.formatarData(ultima.data)}</div>
        <div class="resumo-grid">
          <div class="resumo-card verde"><div class="resumo-val">${ultima.peso}</div><div class="resumo-label">kg</div></div>
          <div class="resumo-card"><div class="resumo-val">${ultima.altura}</div><div class="resumo-label">cm</div></div>
        </div>
        ${imc ? `<div style="text-align:center;margin-top:4px"><span class="badge" style="background:${cls.cor}22;color:${cls.cor}">IMC ${imc} — ${cls.label}</span></div>` : ''}
        <div style="font-size:11px;color:var(--text2);text-align:center;margin-top:8px">IMC infantil — referência apenas. Avalie com seu pediatra.</div>
      </div>`;
    }

    // Tenta exibir gráficos OMS se houver perfil e sexo
    const sexo = perfil?.sexo || null;
    const dataNasc = perfil?.data_nascimento || null;

    if (dataNasc && series.peso.length > 0) {
      const idMin = Math.max(0, R.calcularIdade(dataNasc, new Date(series.peso[0].data+'T00:00:00')).meses_total - 2);
      const idMax = R.calcularIdade(dataNasc).meses_total + 2;
      const curvaP = sexo ? R.curvaBruta('peso', sexo, idMin, idMax) : [];
      const clsP = R.classificarOMS(ultima?.peso, R.calcularIdade(dataNasc).meses_total, 'peso', sexo || 'M');
      html += `<div class="card">
        <div class="card-title">⚖️ Evolução do Peso${sexo?'':' <span style="font-size:10px;color:var(--cinza)">(informe o sexo no perfil para ver curvas OMS)</span>'}</div>
        ${clsP ? `<div style="text-align:center;margin-bottom:8px"><span class="badge" style="background:${clsP.cor}22;color:${clsP.cor}">${clsP.classificacao} — ${clsP.detalhe}</span></div>` : ''}
        <div class="grafico-wrap">${R.gerarGraficoOMS(series.peso, curvaP, dataNasc, { cor:'#1976D2', titulo:'Peso (kg) vs OMS' })}</div>
      </div>`;
    } else {
      html += `<div class="card"><div class="card-title">⚖️ Evolução do Peso</div>
        <div class="grafico-wrap">${R.gerarGraficoSVG(series.peso, { cor:'#1976D2', titulo:'Peso (kg)' })}</div>
      </div>`;
    }

    if (dataNasc && series.altura.length > 0) {
      const idMin2 = Math.max(0, R.calcularIdade(dataNasc, new Date(series.altura[0].data+'T00:00:00')).meses_total - 2);
      const idMax2 = R.calcularIdade(dataNasc).meses_total + 2;
      const curvaA = sexo ? R.curvaBruta('altura', sexo, idMin2, idMax2) : [];
      const clsA = R.classificarOMS(ultima?.altura, R.calcularIdade(dataNasc).meses_total, 'altura', sexo || 'M');
      html += `<div class="card">
        <div class="card-title">📐 Evolução da Altura${sexo?'':''}</div>
        ${clsA ? `<div style="text-align:center;margin-bottom:8px"><span class="badge" style="background:${clsA.cor}22;color:${clsA.cor}">${clsA.classificacao} — ${clsA.detalhe}</span></div>` : ''}
        <div class="grafico-wrap">${R.gerarGraficoOMS(series.altura, curvaA, dataNasc, { cor:'#388E3C', titulo:'Altura (cm) vs OMS' })}</div>
      </div>`;
    } else {
      html += `<div class="card"><div class="card-title">📐 Evolução da Altura</div>
        <div class="grafico-wrap">${R.gerarGraficoSVG(series.altura, { cor:'#388E3C', titulo:'Altura (cm)' })}</div>
      </div>`;
    }
  } else {
    html += `<div class="card"><div class="card-title">📋 Histórico de Medições</div>`;
    if (registros.length === 0) {
      html += `<div class="empty"><div class="empty-icon">📏</div><div class="empty-text">Nenhuma medição registrada ainda.</div></div>`;
    } else {
      [...registros].reverse().forEach(r => {
        html += `<div class="lista-item">
          <div class="lista-icon azul">📏</div>
          <div class="lista-body">
            <div class="lista-nome">${r.peso ? r.peso + ' kg' : '—'} · ${r.altura ? r.altura + ' cm' : '—'}</div>
            <div class="lista-sub">${R.formatarData(r.data)}${r.local ? ' · ' + esc(r.local) : ''}</div>
            ${r.observacoes ? `<div class="lista-sub">${esc(r.observacoes)}</div>` : ''}
          </div>
          <button class="btn-ghost btn-sm" onclick="excluirCrescimento('${r.id}')" style="color:var(--vermelho);font-size:18px">×</button>
        </div>`;
      });
    }
    html += `</div>`;
  }

  el.innerHTML = html;
  adicionarFAB(() => abrirFormCrescimento());
}
window.setCrescTab = t => { _crescTab = t; renderCrescimento(); };

function adicionarFAB(fn) {
  const fab = document.createElement('button');
  fab.className = 'btn-fab'; fab.innerHTML = '+'; fab.setAttribute('aria-label', 'Adicionar');
  fab.onclick = fn;
  document.body.appendChild(fab);
}

function abrirFormCrescimento() {
  document.getElementById('fc-data').value  = new Date().toISOString().slice(0,10);
  document.getElementById('fc-peso').value  = '';
  document.getElementById('fc-alt').value   = '';
  document.getElementById('fc-local').value = '';
  document.getElementById('fc-obs').value   = '';
  openModal('modal-crescimento');
}
window.abrirFormCrescimento = abrirFormCrescimento;

async function salvarCrescimento() {
  const obj = {
    data:     document.getElementById('fc-data').value,
    peso:     R.sanitizarNumero(document.getElementById('fc-peso').value),
    altura:   R.sanitizarNumero(document.getElementById('fc-alt').value),
    local:    R.sanitizarTexto(document.getElementById('fc-local').value),
    observacoes: R.sanitizarTexto(document.getElementById('fc-obs').value)
  };
  const erros = R.validarCrescimento(obj);
  if (erros.length) { toast('⚠️ ' + erros[0]); return; }
  await DB.Crescimento.registrar(obj);
  closeModal('modal-crescimento');
  toast('✓ Medição registrada');
  renderCrescimento();
}

window.excluirCrescimento = async (id) => {
  if (!confirm('Excluir esta medição?')) return;
  await DB.Crescimento.excluir(id);
  toast('Registro removido');
  renderCrescimento();
};

// ════════════════════════════════════════════════════════
// ABA: VACINAS
// ════════════════════════════════════════════════════════
async function renderVacinas() {
  const [registros, perfil] = await Promise.all([DB.Vacinas.listar(), DB.Perfil.get()]);
  const el = document.getElementById('tab-vacinas');
  const catalogo = typeof CATALOGO_VACINAS !== 'undefined' ? CATALOGO_VACINAS.dados : [];
  const statusVac = perfil
    ? R.calcularStatusVacinas(catalogo, registros, perfil.data_nascimento)
    : catalogo.map(v => ({ ...v, doses: v.doses.map(d => ({...d, status:'futura', statusLabel:'Futura', statusCor:'#9E9E9E', registro:null})), resumoStatus:'pendente' }));
  const res = R.resumoVacinas(statusVac);

  // Registros manuais não associados ao catálogo
  const manuaisNaoAssoc = R.registrosManuaisNaoAssociados(catalogo, registros);

  const ICONE = { aplicada:'✅', atrasada:'❗', proxima:'⏰', futura:'⬜', anual:'🔄' };

  let html = `<div class="resumo-grid">
    <div class="resumo-card verde"><div class="resumo-val">${res.completas}</div><div class="resumo-label">Completas</div></div>
    <div class="resumo-card ${res.atrasadas>0?'verm':'cinza'}"><div class="resumo-val">${res.atrasadas}</div><div class="resumo-label">Atrasadas</div></div>
  </div>`;

  html += `<div class="card"><div class="card-title">💉 Calendário de Vacinas</div>`;
  statusVac.forEach((v, vi) => {
    // Nota clínica da vacina (se houver)
    const notaHtml = v.nota
      ? `<div style="padding:8px 14px 4px;font-size:11px;color:var(--text2);font-style:italic;border-top:1px solid var(--border)">ℹ️ ${esc(v.nota)}</div>`
      : '';
    html += `<div class="vacina-item" id="vitem-${vi}">
      <div class="vacina-hdr" onclick="toggleVacina(${vi})">
        <span class="lista-icon ${v.resumoStatus==='completa'?'verde':v.resumoStatus==='atrasada'?'verm':'laranja'}" style="width:32px;height:32px">
          ${ICONE[v.doses[0]?.status]||'⬜'}
        </span>
        <span class="vacina-nome">${esc(v.nome)}</span>
        <span class="badge ${v.resumoStatus==='completa'?'badge-verde':v.resumoStatus==='atrasada'?'badge-verm':'badge-laranja'}">${esc(v.resumoStatus==='completa'?'✓ Ok':v.resumoStatus==='atrasada'?'Atrasada':'Pendente')}</span>
      </div>
      <div class="vacina-doses">
        ${notaHtml}
        ${v.doses.map(d => `
          <div class="vacina-dose-row">
            <div class="dose-check" style="background:${d.statusCor}22;color:${d.statusCor}">${ICONE[d.status]||'⬜'}</div>
            <div class="dose-info">
              <div class="dose-nome">${esc(d.dose)} — ${esc(d.idade_label)}</div>
              <div class="dose-data">${d.registro
                ? `✓ Aplicada em ${R.formatarData(d.registro.data)}${d.registro.local?' · '+esc(d.registro.local):''}${d.registro.lote?' · Lote: '+esc(d.registro.lote):''}`
                : d.status==='anual' ? '🔄 Vacinar anualmente na campanha'
                : d.dataAlvo ? `Prevista para ${R.formatarData(d.dataAlvo)}` : ''}</div>
            </div>
            ${!d.registro && d.status!=='futura' ? `<button class="dose-btn-reg" onclick="abrirRegVacina('${v.id}','${esc(v.nome)}','${esc(d.dose)}','${esc(d.dose_id||'')}')">Registrar</button>` : ''}
          </div>`).join('')}
        ${v.doses.some(d=>d.registro) ? `<div style="padding:6px 14px 10px">
          <button class="btn-ghost btn-sm" style="color:var(--text2);font-size:12px" onclick="verRegistrosVacina('${v.id}','${esc(v.nome)}')">Ver todos os registros</button>
        </div>` : ''}
      </div>
    </div>`;
  });
  html += `</div>`;

  // Vacinas manuais não associadas ao calendário
  if (manuaisNaoAssoc.length > 0) {
    html += `<div class="card"><div class="card-title">📋 Registros Avulsos</div>`;
    manuaisNaoAssoc.forEach(r => {
      html += `<div class="lista-item">
        <div class="lista-icon verde">💉</div>
        <div class="lista-body">
          <div class="lista-nome">${esc(r.nome)} — ${esc(r.dose)}</div>
          <div class="lista-sub">${R.formatarData(r.data)}${r.local?' · '+esc(r.local):''}${r.lote?' · Lote: '+esc(r.lote):''}</div>
        </div>
        <button class="btn-ghost btn-sm" onclick="excluirVacina('${r.id}')" style="color:var(--vermelho);font-size:18px">×</button>
      </div>`;
    });
    html += `</div>`;
  }

  html += `<div style="margin-top:4px"><button class="btn btn-outline" onclick="abrirRegVacinaManual()">+ Registrar vacina avulsa</button></div>`;

  el.innerHTML = html;
}

window.toggleVacina = (i) => document.getElementById('vitem-' + i)?.classList.toggle('open');

window.abrirRegVacina = (vid, vnome, vdose, vdoseId) => {
  document.getElementById('rv-vacina-id').value  = vid;
  document.getElementById('rv-dose-id').value    = vdoseId || '';
  document.getElementById('rv-nome').value       = vnome;
  document.getElementById('rv-dose-txt').value   = vdose;
  document.getElementById('rv-data').value       = new Date().toISOString().slice(0,10);
  document.getElementById('rv-local').value      = '';
  document.getElementById('rv-lote').value       = '';
  openModal('modal-vacina');
};

window.abrirRegVacinaManual = () => {
  document.getElementById('rv-vacina-id').value  = 'manual';
  document.getElementById('rv-dose-id').value    = '';
  document.getElementById('rv-nome').value       = '';
  document.getElementById('rv-dose-txt').value   = '';
  document.getElementById('rv-data').value       = new Date().toISOString().slice(0,10);
  document.getElementById('rv-local').value      = '';
  document.getElementById('rv-lote').value       = '';
  openModal('modal-vacina');
};

async function salvarVacina() {
  const obj = {
    vacina_id:       document.getElementById('rv-vacina-id').value || 'manual',
    dose_id:         document.getElementById('rv-dose-id').value || null,
    nome:            R.sanitizarTexto(document.getElementById('rv-nome').value),
    dose:            R.sanitizarTexto(document.getElementById('rv-dose-txt').value),
    data:            document.getElementById('rv-data').value,
    local:           R.sanitizarTexto(document.getElementById('rv-local').value),
    lote:            R.sanitizarTexto(document.getElementById('rv-lote').value),
    catalogo_versao: typeof CATALOGO_VACINAS !== 'undefined' ? CATALOGO_VACINAS.versao : 'manual'
  };
  const erros = R.validarVacina(obj);
  if (erros.length) { toast('⚠️ ' + erros[0]); return; }
  await DB.Vacinas.registrar(obj);
  closeModal('modal-vacina');
  toast('✓ Vacina registrada com sucesso!');
  renderVacinas();
}

window.verRegistrosVacina = async (vid, vnome) => {
  const regs = await DB.Vacinas.porVacina(vid);
  const lista = regs.map(r => `<div class="lista-item">
    <div class="lista-body">
      <div class="lista-nome">${esc(r.dose)}</div>
      <div class="lista-sub">${R.formatarData(r.data)}${r.local?' · '+esc(r.local):''}${r.lote?' · Lote: '+esc(r.lote):''}</div>
    </div>
    <button class="btn-ghost btn-sm" onclick="excluirVacina('${r.id}')" style="color:var(--vermelho);font-size:18px">×</button>
  </div>`).join('');
  document.getElementById('modal-detail-titulo').textContent = vnome;
  document.getElementById('modal-detail-body').innerHTML = lista || '<div class="empty"><div class="empty-text">Sem registros</div></div>';
  openModal('modal-detail');
};

window.excluirVacina = async (id) => {
  if (!confirm('Excluir este registro?')) return;
  await DB.Vacinas.excluir(id);
  closeModal('modal-detail');
  toast('Registro removido');
  renderVacinas();
};

// ════════════════════════════════════════════════════════
// ABA: MEDICAMENTOS
// ════════════════════════════════════════════════════════
let _medTab = 'continuo';

async function renderMedicamentos() {
  const [continuos, logs, emergenciais] = await Promise.all([
    DB.Medicamentos.listarContinuos(),
    DB.Medicamentos.listarLog(),
    DB.MedicamentosEmergencial.listar()
  ]);
  const el = document.getElementById('tab-medicamentos');

  let html = `<div class="pill-tabs">
    <button class="pill-tab ${_medTab==='continuo'?'active':''}" onclick="setMedTab('continuo')">💊 Contínuo</button>
    <button class="pill-tab ${_medTab==='emergencial'?'active':''}" onclick="setMedTab('emergencial')">🚨 Emergencial</button>
    <button class="pill-tab ${_medTab==='log'?'active':''}" onclick="setMedTab('log')">📋 Administrados</button>
  </div>`;

  if (_medTab === 'continuo') {
    html += `<div class="card"><div class="card-title">💊 Medicamentos em Uso Contínuo</div>`;
    const ativos = continuos.filter(m => m.ativo !== false);
    const inativos = continuos.filter(m => m.ativo === false);
    if (ativos.length === 0) {
      html += `<div class="empty"><div class="empty-icon">💊</div><div class="empty-text">Nenhum medicamento em uso contínuo.</div></div>`;
    }
    ativos.forEach(m => {
      html += `<div class="lista-item">
        <div class="lista-icon verde">💊</div>
        <div class="lista-body">
          <div class="lista-nome">${esc(m.nome)}</div>
          <div class="lista-sub">${esc(m.posologia)}</div>
          ${m.observacoes ? `<div class="lista-sub">${esc(m.observacoes)}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
          <button class="btn-ghost btn-sm" onclick="editarMedCont('${m.id}')" style="color:var(--azul)">✏️</button>
          <button class="btn-ghost btn-sm" onclick="inativarMed('${m.id}')" style="color:var(--cinza);font-size:11px">Pausar</button>
        </div>
      </div>`;
    });
    if (inativos.length > 0) {
      html += `<div class="section-divider">Pausados / Encerrados</div>`;
      inativos.forEach(m => {
        html += `<div class="lista-item" style="opacity:.55">
          <div class="lista-icon cinza">💊</div>
          <div class="lista-body">
            <div class="lista-nome">${esc(m.nome)}</div>
            <div class="lista-sub">${esc(m.posologia)}</div>
          </div>
          <button class="btn-ghost btn-sm" onclick="reativarMed('${m.id}')" style="color:var(--verde);font-size:11px">Reativar</button>
        </div>`;
      });
    }
    html += `</div>`;

  } else if (_medTab === 'emergencial') {
    html += `<div class="card">
      <div class="card-title">🚨 Medicamentos de Uso Emergencial</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:12px;padding:8px;background:var(--azul-lt);border-radius:var(--r-sm)">
        Medicamentos pré-autorizados pela pediatra para situações específicas. Siga estritamente a dose e indicação prescritas.
      </div>`;
    if (emergenciais.length === 0) {
      html += `<div class="empty"><div class="empty-icon">🚨</div><div class="empty-text">Nenhum medicamento emergencial cadastrado.<br>Cadastre conforme orientação da pediatra.</div></div>`;
    }
    emergenciais.forEach(m => {
      html += `<div style="border:1px solid var(--border);border-radius:var(--r-sm);padding:14px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="flex:1">
            <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:4px">${esc(m.nome)}</div>
            <div style="font-size:12px;color:var(--vermelho);font-weight:600;margin-bottom:3px">💊 Dose: ${esc(m.dose_recomendada)}</div>
            <div style="font-size:12px;color:var(--text2)">📋 Indicação: ${esc(m.indicacao)}</div>
            ${m.observacoes ? `<div style="font-size:11px;color:var(--cinza);margin-top:4px;font-style:italic">${esc(m.observacoes)}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-left:8px">
            <button class="btn-ghost btn-sm" onclick="editarMedEmerg('${m.id}')" style="color:var(--azul)">✏️</button>
            <button class="btn-ghost btn-sm" onclick="excluirMedEmerg('${m.id}')" style="color:var(--vermelho)">×</button>
          </div>
        </div>
        <button class="btn btn-sm" style="margin-top:10px;background:var(--laranja-lt);color:var(--laranja);border:1px solid var(--laranja);width:100%" onclick="registrarAdminDeEmerg('${esc(m.nome)}','${esc(m.dose_recomendada)}')">
          📝 Registrar administração agora
        </button>
      </div>`;
    });
    html += `</div>`;

  } else {
    html += `<div class="card"><div class="card-title">📋 Medicamentos Administrados</div>`;
    if (logs.length === 0) {
      html += `<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Nenhuma administração registrada ainda.</div></div>`;
    }
    logs.slice(0, 50).forEach(m => {
      html += `<div class="lista-item">
        <div class="lista-icon laranja">📋</div>
        <div class="lista-body">
          <div class="lista-nome">${esc(m.nome)}${m.dose ? ' — ' + esc(m.dose) : ''}</div>
          <div class="lista-sub">${R.formatarData(m.data)}${m.motivo?' · '+esc(m.motivo):''}</div>
        </div>
        <button class="btn-ghost btn-sm" onclick="excluirMedLog('${m.id}')" style="color:var(--vermelho);font-size:18px">×</button>
      </div>`;
    });
    html += `</div>`;
  }

  el.innerHTML = html;
  const fabFn = {
    continuo: abrirFormMedCont,
    emergencial: abrirFormMedEmerg,
    log: abrirFormMedLog
  }[_medTab] || abrirFormMedCont;
  adicionarFAB(fabFn);
}

window.setMedTab = t => { _medTab = t; renderMedicamentos(); };

// ── Medicamentos Emergenciais ──
function abrirFormMedEmerg(dados) {
  document.getElementById('me-id').value       = dados?.id || '';
  document.getElementById('me-nome').value     = dados?.nome || '';
  document.getElementById('me-indicacao').value= dados?.indicacao || '';
  document.getElementById('me-dose').value     = dados?.dose_recomendada || '';
  document.getElementById('me-obs').value      = dados?.observacoes || '';
  openModal('modal-med-emerg');
}
window.abrirFormMedEmerg = abrirFormMedEmerg;

window.editarMedEmerg = async (id) => {
  const lista = await DB.MedicamentosEmergencial.listar();
  const m = lista.find(x => x.id === id);
  if (m) abrirFormMedEmerg(m);
};

async function salvarMedEmerg() {
  const id = document.getElementById('me-id').value;
  const obj = {
    id:               id || DB.gerarId(),
    nome:             R.sanitizarTexto(document.getElementById('me-nome').value),
    indicacao:        R.sanitizarTexto(document.getElementById('me-indicacao').value),
    dose_recomendada: R.sanitizarTexto(document.getElementById('me-dose').value),
    observacoes:      R.sanitizarTexto(document.getElementById('me-obs').value)
  };
  if (!obj.nome) { toast('⚠️ Nome obrigatório'); return; }
  await DB.MedicamentosEmergencial.salvar(obj);
  closeModal('modal-med-emerg');
  toast('✓ Medicamento emergencial salvo');
  renderMedicamentos();
}

window.excluirMedEmerg = async (id) => {
  if (!confirm('Excluir este medicamento?')) return;
  await DB.MedicamentosEmergencial.excluir(id);
  toast('Removido');
  renderMedicamentos();
};

// Pré-preenche o log com nome e dose do emergencial
window.registrarAdminDeEmerg = (nome, dose) => {
  document.getElementById('ml-nome').value   = nome;
  document.getElementById('ml-dose').value   = dose;
  document.getElementById('ml-data').value   = new Date().toISOString().slice(0,10);
  document.getElementById('ml-motivo').value = '';
  openModal('modal-med-log');
};

window.editarMedCont = async (id) => {
  const lista = await DB.Medicamentos.listarContinuos();
  const m = lista.find(x => x.id === id);
  if (!m) return;
  document.getElementById('mc-id').value    = m.id;
  document.getElementById('mc-nome').value  = m.nome;
  document.getElementById('mc-pos').value   = m.posologia;
  document.getElementById('mc-obs').value   = m.observacoes || '';
  openModal('modal-med-cont');
};

function abrirFormMedCont() {
  document.getElementById('mc-id').value   = '';
  document.getElementById('mc-nome').value = '';
  document.getElementById('mc-pos').value  = '';
  document.getElementById('mc-obs').value  = '';
  openModal('modal-med-cont');
}
window.abrirFormMedCont = abrirFormMedCont;

async function salvarMedCont() {
  const id = document.getElementById('mc-id').value;
  const obj = {
    id:          id || DB.gerarId(),
    nome:        R.sanitizarTexto(document.getElementById('mc-nome').value),
    posologia:   R.sanitizarTexto(document.getElementById('mc-pos').value),
    observacoes: R.sanitizarTexto(document.getElementById('mc-obs').value),
    ativo:       true
  };
  if (!obj.nome) { toast('⚠️ Nome obrigatório'); return; }
  await DB.Medicamentos.salvarContinuo(obj);
  closeModal('modal-med-cont');
  toast('✓ Medicamento salvo');
  renderMedicamentos();
}

window.inativarMed = async (id) => {
  const lista = await DB.Medicamentos.listarContinuos();
  const m = lista.find(x => x.id === id);
  if (!m) return;
  await DB.Medicamentos.salvarContinuo({ ...m, ativo: false });
  toast('Medicamento pausado');
  renderMedicamentos();
};

window.reativarMed = async (id) => {
  const lista = await DB.Medicamentos.listarContinuos();
  const m = lista.find(x => x.id === id);
  if (!m) return;
  await DB.Medicamentos.salvarContinuo({ ...m, ativo: true });
  toast('Medicamento reativado');
  renderMedicamentos();
};

function abrirFormMedLog() {
  document.getElementById('ml-nome').value   = '';
  document.getElementById('ml-dose').value   = '';
  document.getElementById('ml-data').value   = new Date().toISOString().slice(0,10);
  document.getElementById('ml-motivo').value = '';
  openModal('modal-med-log');
}
window.abrirFormMedLog = abrirFormMedLog;

async function salvarMedLog() {
  const obj = {
    nome:   R.sanitizarTexto(document.getElementById('ml-nome').value),
    dose:   R.sanitizarTexto(document.getElementById('ml-dose').value),
    data:   document.getElementById('ml-data').value,
    motivo: R.sanitizarTexto(document.getElementById('ml-motivo').value)
  };
  if (!obj.nome || !obj.data) { toast('⚠️ Nome e data obrigatórios'); return; }
  await DB.Medicamentos.registrarLog(obj);
  closeModal('modal-med-log');
  toast('✓ Uso registrado');
  renderMedicamentos();
}

window.excluirMedLog = async (id) => {
  if (!confirm('Excluir?')) return;
  await DB.Medicamentos.excluirLog(id);
  toast('Removido');
  renderMedicamentos();
};

// ════════════════════════════════════════════════════════
// ABA: AGENDA
// ════════════════════════════════════════════════════════
let _agTab = 'futuros';

async function renderAgenda() {
  const agenda = await DB.Agenda.listar();
  const el = document.getElementById('tab-agenda');
  const agora = new Date().toISOString().slice(0, 16);

  const futuros = agenda.filter(e => e.status === 'agendado' && e.data >= agora)
    .sort((a,b) => a.data.localeCompare(b.data));
  const passados = agenda.filter(e => e.status !== 'agendado' || e.data < agora)
    .sort((a,b) => b.data.localeCompare(a.data));

  let html = `<div class="pill-tabs">
    <button class="pill-tab ${_agTab==='futuros'?'active':''}" onclick="setAgTab('futuros')">📅 Próximos (${futuros.length})</button>
    <button class="pill-tab ${_agTab==='passados'?'active':''}" onclick="setAgTab('passados')">🗓 Histórico</button>
  </div>`;

  const lista = _agTab === 'futuros' ? futuros : passados;
  html += `<div class="card"><div class="card-title">${_agTab==='futuros'?'📅 Próximas consultas e exames':'🗓 Histórico'}</div>`;

  if (lista.length === 0) {
    html += `<div class="empty"><div class="empty-icon">📅</div><div class="empty-text">Nenhum agendamento aqui.</div></div>`;
  }
  lista.forEach(e => {
    const dias = R.diasAte(e.data);
    html += `<div class="agenda-item ${esc(e.status)}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="agenda-data">${R.formatarDataHora(e.data)} — <span class="badge ${e.tipo==='consulta'?'badge-azul':'badge-laranja'}">${e.tipo==='consulta'?'Consulta':'Exame'}</span></div>
          <div class="agenda-desc">${esc(e.descricao)}</div>
          ${e.local ? `<div class="agenda-local">📍 ${esc(e.local)}</div>` : ''}
          ${e.status==='agendado' && e.data >= agora
            ? `<div class="agenda-faltam">${dias===0?'Hoje!':dias>0?`em ${dias} dia${dias!==1?'s':''}`:''}</div>`
            : `<span class="badge ${e.status==='realizado'?'badge-verde':'badge-cinza'}">${e.status}</span>`}
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0">
          ${e.status==='agendado'?`<button class="btn-ghost btn-sm" style="color:var(--verde);font-size:11px" onclick="marcarRealizado('${e.id}')">✓ Realizado</button>`:''}
          <button class="btn-ghost btn-sm" style="color:var(--azul);font-size:18px" onclick="editarAgenda('${e.id}')">✏️</button>
          <button class="btn-ghost btn-sm" style="color:var(--vermelho);font-size:18px" onclick="excluirAgenda('${e.id}')">×</button>
        </div>
      </div>
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
  adicionarFAB(() => abrirFormAgenda());
}
window.setAgTab = t => { _agTab = t; renderAgenda(); };

function abrirFormAgenda(dados) {
  document.getElementById('ag-id').value     = dados?.id || '';
  document.getElementById('ag-tipo').value   = dados?.tipo || 'consulta';
  document.getElementById('ag-data').value   = dados?.data || '';
  document.getElementById('ag-desc').value   = dados?.descricao || '';
  document.getElementById('ag-local').value  = dados?.local || '';
  document.getElementById('ag-status').value = dados?.status || 'agendado';
  openModal('modal-agenda');
}
window.abrirFormAgenda = abrirFormAgenda;

window.editarAgenda = async (id) => {
  const lista = await DB.Agenda.listar();
  const e = lista.find(x => x.id === id);
  if (e) abrirFormAgenda(e);
};

async function salvarAgenda() {
  const id = document.getElementById('ag-id').value;
  const obj = {
    id:        id || undefined,
    tipo:      document.getElementById('ag-tipo').value,
    data:      document.getElementById('ag-data').value,
    descricao: R.sanitizarTexto(document.getElementById('ag-desc').value),
    local:     R.sanitizarTexto(document.getElementById('ag-local').value),
    status:    document.getElementById('ag-status').value
  };
  const erros = R.validarAgenda(obj);
  if (erros.length) { toast('⚠️ ' + erros[0]); return; }
  await DB.Agenda.salvar(obj);
  closeModal('modal-agenda');
  toast('✓ Agendamento salvo');
  renderAgenda();
}

window.marcarRealizado = async (id) => {
  const lista = await DB.Agenda.listar();
  const e = lista.find(x => x.id === id);
  if (!e) return;
  await DB.Agenda.salvar({ ...e, status: 'realizado' });
  toast('✓ Marcado como realizado');
  renderAgenda();
};

window.excluirAgenda = async (id) => {
  if (!confirm('Excluir este agendamento?')) return;
  await DB.Agenda.excluir(id);
  toast('Removido');
  renderAgenda();
};


// ════════════════════════════════════════════════════════
// SEÇÃO: DESENVOLVIMENTO (sub-seção do Perfil)
// ════════════════════════════════════════════════════════
function renderDesenvolvimento(idadeMeses) {
  // Encontrar faixa etária atual
  const faixaAtual = DESENVOLVIMENTO.faixas.find(
    f => idadeMeses >= f.idadeMinMeses && idadeMeses <= f.idadeMaxMeses
  );
  const faixaProxima = DESENVOLVIMENTO.faixas.find(
    f => f.idadeMinMeses > idadeMeses
  );

  let html = '<div class="card"><div class="card-title">🧠 Desenvolvimento</div>';

  if (faixaAtual) {
    html += `<div class="dev-faixa-label">${esc(faixaAtual.label)}</div>
    <div class="dev-lista">`;
    faixaAtual.marcos.forEach(m => {
      html += `<div class="dev-marco">
        <span class="dev-check">✓</span>
        <span class="dev-texto">${esc(m)}</span>
      </div>`;
    });
    html += `</div>`;
  } else {
    html += `<div class="empty-text" style="padding:8px 0">Consulte o pediatra para avaliação do desenvolvimento.</div>`;
  }

  // Próxima faixa (preview)
  if (faixaProxima) {
    html += `<div class="dev-proxima">
      <div class="dev-proxima-label">Próxima fase: ${esc(faixaProxima.label)}</div>
    </div>`;
  }

  // Sinais de alerta — sempre visível
  html += `<details class="dev-alerta-details">
    <summary class="dev-alerta-summary">⚠️ Sinais de alerta — quando consultar</summary>
    <div class="dev-alerta-lista">`;
  DESENVOLVIMENTO.sinaisAlerta.forEach(s => {
    html += `<div class="dev-alerta-item">${esc(s)}</div>`;
  });
  html += `</div></details></div>`;

  return html;
}

function renderSaudeBucal() {
  let html = '<div class="card"><div class="card-title">🦷 Saúde Bucal</div>';

  SAUDE_BUCAL.fases.forEach(f => {
    html += `<div class="bucal-fase">
      <div class="bucal-fase-label">${esc(f.label)}</div>
      <div class="bucal-fase-dica">${esc(f.dica)}</div>
    </div>`;
  });

  html += `<div class="bucal-alertas">`;
  SAUDE_BUCAL.alertas.forEach(a => {
    html += `<div class="bucal-alerta-item">⚠️ ${esc(a)}</div>`;
  });
  html += `</div></div>`;
  return html;
}

function renderGuia(idadeMeses) {
  let html = '';

  // Tempo de tela
  const telaRec = TEMPO_TELA.find(t => idadeMeses >= t.idadeMinMeses && idadeMeses <= t.idadeMaxMeses);
  html += `<div class="card">
    <div class="card-title">📱 Tempo de Tela</div>`;
  if (telaRec) {
    html += `<div class="guia-rec">${esc(telaRec.recomendacao)}</div>`;
  }
  html += `<div class="guia-fonte">Fonte: Caderneta da Criança — Ministério da Saúde 2024</div></div>`;

  // Prevenção de acidentes
  const faixaAcid = ACIDENTES.find(a => idadeMeses >= a.idadeMinMeses && idadeMeses <= a.idadeMaxMeses)
    || (idadeMeses >= 24 ? ACIDENTES[ACIDENTES.length - 1] : null);

  if (faixaAcid) {
    html += `<div class="card">
      <div class="card-title">🛡️ Prevenção de Acidentes — ${esc(faixaAcid.faixa)}</div>`;
    faixaAcid.riscos.forEach(r => {
      html += `<div class="acidente-item">
        <div class="acidente-tipo">${esc(r.tipo)}</div>
        <div class="acidente-dica">${esc(r.dica)}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // Sinais sensoriais
  html += `<div class="card">
    <div class="card-title">👁️ Atenção: Visão e Audição</div>
    <div class="guia-sub">Sinais de deficiência visual</div>`;
  SINAIS_SENSORIAIS.visual.forEach(s => {
    html += `<div class="guia-sinal">${esc(s)}</div>`;
  });
  html += `<div class="guia-sub" style="margin-top:10px">Sinais de deficiência auditiva</div>`;
  SINAIS_SENSORIAIS.auditiva.forEach(s => {
    html += `<div class="guia-sinal">${esc(s)}</div>`;
  });
  html += `<div class="guia-fonte">Se notar qualquer sinal, leve ao pediatra. Quanto mais cedo identificado, melhor o resultado.</div>
  </div>`;

  return html;
}

// ════════════════════════════════════════════════════════
// ABA: CONTATOS
// ════════════════════════════════════════════════════════
async function renderContatos() {
  const [contatos, perfil] = await Promise.all([DB.Contatos.listar(), DB.Perfil.get()]);
  const el = document.getElementById('tab-contatos');
  const idadeMeses = perfil ? (R.calcularIdade(perfil.data_nascimento).meses_total || 0) : 0;

  const TIPO_LABEL = { pediatra:'👨‍⚕️ Pediatra', clinica:'🏥 Clínica', hospital:'🚑 Hospital', outro:'👤 Outro' };

  // Cabeçalho da aba com duas seções bem demarcadas
  let html = `<div class="aba-section-header">📋 Guia de Saúde por Idade</div>`;
  html += renderGuia(idadeMeses);

  html += `<div class="aba-section-header">📞 Contatos Médicos</div>`;
  html += `<div class="card"><div class="card-title">👨‍⚕️ Médicos e Serviços</div>`;
  if (contatos.length === 0) {
    html += `<div class="empty"><div class="empty-icon">👨‍⚕️</div><div class="empty-text">Nenhum contato cadastrado.</div></div>`;
  }
  contatos.forEach(c => {
    html += `<div class="contato-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="contato-tipo">${TIPO_LABEL[c.tipo]||c.tipo}</div>
          <div class="contato-nome">${esc(c.nome)}</div>
          ${c.telefone ? `<div class="contato-tel"><a href="tel:${esc(c.telefone)}" style="color:var(--azul);text-decoration:none">☎ ${esc(c.telefone)}</a></div>` : ''}
          ${c.endereco ? `<div class="contato-end">📍 ${esc(c.endereco)}</div>` : ''}
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn-ghost btn-sm" onclick="editarContato('${c.id}')" style="color:var(--azul);font-size:18px">✏️</button>
          <button class="btn-ghost btn-sm" onclick="excluirContato('${c.id}')" style="color:var(--vermelho);font-size:18px">×</button>
        </div>
      </div>
    </div>`;
  });
  html += `</div>`;

  el.innerHTML = html;
  adicionarFAB(() => abrirFormContato());
}

window.editarContato = async (id) => {
  const lista = await DB.Contatos.listar();
  const c = lista.find(x => x.id === id);
  if (!c) return;
  document.getElementById('ct-id').value    = c.id;
  document.getElementById('ct-nome').value  = c.nome;
  document.getElementById('ct-tipo').value  = c.tipo;
  document.getElementById('ct-tel').value   = c.telefone || '';
  document.getElementById('ct-end').value   = c.endereco || '';
  openModal('modal-contato');
};

function abrirFormContato() {
  document.getElementById('ct-id').value   = '';
  document.getElementById('ct-nome').value = '';
  document.getElementById('ct-tipo').value = 'pediatra';
  document.getElementById('ct-tel').value  = '';
  document.getElementById('ct-end').value  = '';
  openModal('modal-contato');
}
window.abrirFormContato = abrirFormContato;

async function salvarContato() {
  const id = document.getElementById('ct-id').value;
  const obj = {
    id:       id || DB.gerarId(),
    nome:     R.sanitizarTexto(document.getElementById('ct-nome').value),
    tipo:     document.getElementById('ct-tipo').value,
    telefone: R.sanitizarTexto(document.getElementById('ct-tel').value),
    endereco: R.sanitizarTexto(document.getElementById('ct-end').value)
  };
  if (!obj.nome) { toast('⚠️ Nome obrigatório'); return; }
  await DB.Contatos.salvar(obj);
  closeModal('modal-contato');
  toast('✓ Contato salvo');
  renderContatos();
}

window.excluirContato = async (id) => {
  if (!confirm('Excluir este contato?')) return;
  await DB.Contatos.excluir(id);
  toast('Removido');
  renderContatos();
};

// ════════════════════════════════════════════════════════
// EXPORTAR / IMPORTAR
// ════════════════════════════════════════════════════════
async function exportarDados() {
  const dados = await DB.exportarTudo();
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bebe-saudavel-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('✓ Backup exportado');
}

function importarDados() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const texto = await file.text();
      const json  = JSON.parse(texto);
      if (!confirm(`Importar backup de ${json.exportado_em ? new Date(json.exportado_em).toLocaleString('pt-BR') : 'data desconhecida'}?\n\nOs dados existentes serão mesclados.`)) return;
      await DB.importarTudo(json);
      toast('✓ Backup importado com sucesso');
      renderTab(_tabAtual);
    } catch (err) {
      toast('⚠️ Erro ao importar: ' + err.message);
    }
  };
  input.click();
}

// ════════════════════════════════════════════════════════
// NAVEGAÇÃO E EVENTOS
// ════════════════════════════════════════════════════════
document.querySelectorAll('.nav-btn').forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
);

document.querySelectorAll('[data-close]').forEach(btn =>
  btn.addEventListener('click', () => closeModal(btn.dataset.close))
);
document.querySelectorAll('.modal-overlay').forEach(ov =>
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); })
);

// Forms — submit via botão
document.getElementById('btn-salvar-perfil')?.addEventListener('click', salvarPerfil);
document.getElementById('btn-salvar-plano')?.addEventListener('click', salvarPlano);
document.getElementById('btn-salvar-cresc')?.addEventListener('click', salvarCrescimento);
document.getElementById('btn-salvar-vacina')?.addEventListener('click', salvarVacina);
document.getElementById('btn-salvar-med-cont')?.addEventListener('click', salvarMedCont);
document.getElementById('btn-salvar-med-log')?.addEventListener('click', salvarMedLog);
document.getElementById('btn-salvar-agenda')?.addEventListener('click', salvarAgenda);
document.getElementById('btn-salvar-contato')?.addEventListener('click', salvarContato);
document.getElementById('btn-exportar')?.addEventListener('click', exportarDados);
document.getElementById('btn-importar')?.addEventListener('click', importarDados);

// Header — nome da criança
async function atualizarHeader() {
  const perfil = await DB.Perfil.get();
  const el = document.getElementById('hdr-child');
  if (el && perfil) el.textContent = perfil.nome;
}

// PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('./service-worker.js').catch(() => {})
  );
}

// ── BOOT ──
DB.abrir().then(async () => {
  await atualizarHeader();
  switchTab('perfil');
}).catch(err => {
  document.body.innerHTML = `<div style="padding:32px;text-align:center;color:red">
    Erro ao iniciar o banco de dados: ${err.message}
  </div>`;
});
