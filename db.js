'use strict';

// ═══════════════════════════════════════════════════════════════
// BEBÊ SAUDÁVEL — db.js
// Camada de abstração IndexedDB
// Todas as operações retornam Promises
// Nenhuma lógica de negócio aqui — apenas persistência
// ═══════════════════════════════════════════════════════════════

const DB_NAME    = 'bebe-saudavel';
const DB_VERSION = 2;

// Stores (tabelas)
const STORES = {
  PERFIL:            'perfil',
  CRESCIMENTO:       'crescimento',
  VACINAS:           'vacinas',
  MEDICAMENTOS_USO:  'medicamentos_uso',       // uso contínuo (estado)
  MEDICAMENTOS_LOG:  'medicamentos_log',       // uso pontual (evento)
  AGENDA:            'agenda',
  SONO:              'sono',
  CONTATOS:          'contatos',
  PLANO_SAUDE:       'plano_saude',
  VESTUARIO:         'vestuario',
  MEDICAMENTOS_EMERG:'medicamentos_emergencial', // prescritos pela pediatra (estado)
  META:              'meta'                    // versões de catálogo, configs
};

let _db = null;

// ── Abre / inicializa o banco ──
function abrirDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;

      // Perfil — estado único
      if (!db.objectStoreNames.contains(STORES.PERFIL)) {
        db.createObjectStore(STORES.PERFIL, { keyPath: 'id' });
      }
      // Crescimento — eventos por data
      if (!db.objectStoreNames.contains(STORES.CRESCIMENTO)) {
        const s = db.createObjectStore(STORES.CRESCIMENTO, { keyPath: 'id' });
        s.createIndex('data', 'data', { unique: false });
      }
      // Vacinas — eventos
      if (!db.objectStoreNames.contains(STORES.VACINAS)) {
        const s = db.createObjectStore(STORES.VACINAS, { keyPath: 'id' });
        s.createIndex('data', 'data', { unique: false });
        s.createIndex('vacina_id', 'vacina_id', { unique: false });
      }
      // Medicamentos uso contínuo — estado
      if (!db.objectStoreNames.contains(STORES.MEDICAMENTOS_USO)) {
        db.createObjectStore(STORES.MEDICAMENTOS_USO, { keyPath: 'id' });
      }
      // Medicamentos log — eventos pontuais
      if (!db.objectStoreNames.contains(STORES.MEDICAMENTOS_LOG)) {
        const s = db.createObjectStore(STORES.MEDICAMENTOS_LOG, { keyPath: 'id' });
        s.createIndex('data', 'data', { unique: false });
      }
      // Medicamentos emergenciais — pré-cadastrados pela pediatra (estado)
      if (!db.objectStoreNames.contains(STORES.MEDICAMENTOS_EMERG)) {
        db.createObjectStore(STORES.MEDICAMENTOS_EMERG, { keyPath: 'id' });
      }
      // Agenda — eventos
      if (!db.objectStoreNames.contains(STORES.AGENDA)) {
        const s = db.createObjectStore(STORES.AGENDA, { keyPath: 'id' });
        s.createIndex('data', 'data', { unique: false });
        s.createIndex('status', 'status', { unique: false });
      }
      // Sono — eventos
      if (!db.objectStoreNames.contains(STORES.SONO)) {
        const s = db.createObjectStore(STORES.SONO, { keyPath: 'id' });
        s.createIndex('data', 'data', { unique: false });
      }
      // Contatos — estado
      if (!db.objectStoreNames.contains(STORES.CONTATOS)) {
        db.createObjectStore(STORES.CONTATOS, { keyPath: 'id' });
      }
      // Plano de saúde — estado único
      if (!db.objectStoreNames.contains(STORES.PLANO_SAUDE)) {
        db.createObjectStore(STORES.PLANO_SAUDE, { keyPath: 'id' });
      }
      // Vestuário — eventos
      if (!db.objectStoreNames.contains(STORES.VESTUARIO)) {
        const s = db.createObjectStore(STORES.VESTUARIO, { keyPath: 'id' });
        s.createIndex('data', 'data', { unique: false });
      }
      // Meta — configurações e versões
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: 'chave' });
      }
    };

    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror   = e => reject(e.target.error);
  });
}

// ── Helpers de transação ──
function _tx(store, modo) {
  return _db.transaction(store, modo).objectStore(store);
}

function _get(store, key) {
  return abrirDB().then(() => new Promise((res, rej) => {
    const req = _tx(store, 'readonly').get(key);
    req.onsuccess = e => res(e.target.result || null);
    req.onerror   = e => rej(e.target.error);
  }));
}

function _getAll(store) {
  return abrirDB().then(() => new Promise((res, rej) => {
    const req = _tx(store, 'readonly').getAll();
    req.onsuccess = e => res(e.target.result || []);
    req.onerror   = e => rej(e.target.error);
  }));
}

function _getAllByIndex(store, index, value) {
  return abrirDB().then(() => new Promise((res, rej) => {
    const range = IDBKeyRange.only(value);
    const req = _tx(store, 'readonly').index(index).getAll(range);
    req.onsuccess = e => res(e.target.result || []);
    req.onerror   = e => rej(e.target.error);
  }));
}

function _put(store, obj) {
  return abrirDB().then(() => new Promise((res, rej) => {
    const req = _tx(store, 'readwrite').put(obj);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  }));
}

function _add(store, obj) {
  return abrirDB().then(() => new Promise((res, rej) => {
    const req = _tx(store, 'readwrite').add(obj);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  }));
}

function _delete(store, key) {
  return abrirDB().then(() => new Promise((res, rej) => {
    const req = _tx(store, 'readwrite').delete(key);
    req.onsuccess = () => res(true);
    req.onerror   = e => rej(e.target.error);
  }));
}

// Gera ID único baseado em timestamp + random
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ════════════════════════════════════════════════════════
// API PÚBLICA — PERFIL
// ════════════════════════════════════════════════════════
const Perfil = {
  get:    ()    => _get(STORES.PERFIL, 'principal'),
  salvar: (obj) => _put(STORES.PERFIL, { ...obj, id: 'principal' })
};

// ════════════════════════════════════════════════════════
// API PÚBLICA — CRESCIMENTO (EVENTOS — NUNCA SOBRESCREVER)
// ════════════════════════════════════════════════════════
const Crescimento = {
  listar:     ()    => _getAll(STORES.CRESCIMENTO).then(r => r.sort((a,b) => a.data.localeCompare(b.data))),
  registrar:  (obj) => _add(STORES.CRESCIMENTO,  { ...obj, id: gerarId(), criado_em: new Date().toISOString() }),
  // Exclusão permitida apenas por erro de digitação — registra motivo
  excluir:    (id)  => _delete(STORES.CRESCIMENTO, id)
};

// ════════════════════════════════════════════════════════
// API PÚBLICA — VACINAS (EVENTOS)
// ════════════════════════════════════════════════════════
const Vacinas = {
  listar:        ()        => _getAll(STORES.VACINAS).then(r => r.sort((a,b) => a.data.localeCompare(b.data))),
  registrar:     (obj)     => _add(STORES.VACINAS, { ...obj, id: gerarId(), criado_em: new Date().toISOString() }),
  porVacina:     (vid)     => _getAllByIndex(STORES.VACINAS, 'vacina_id', vid),
  excluir:       (id)      => _delete(STORES.VACINAS, id)
};

// ════════════════════════════════════════════════════════
// API PÚBLICA — MEDICAMENTOS
// ════════════════════════════════════════════════════════
const Medicamentos = {
  // Uso contínuo (estado)
  listarContinuos:  ()    => _getAll(STORES.MEDICAMENTOS_USO),
  salvarContinuo:   (obj) => _put(STORES.MEDICAMENTOS_USO, { ...obj, id: obj.id || gerarId() }),
  excluirContinuo:  (id)  => _delete(STORES.MEDICAMENTOS_USO, id),

  // Log pontual (evento)
  listarLog:   ()    => _getAll(STORES.MEDICAMENTOS_LOG).then(r => r.sort((a,b) => b.data.localeCompare(a.data))),
  registrarLog:(obj) => _add(STORES.MEDICAMENTOS_LOG, { ...obj, id: gerarId(), criado_em: new Date().toISOString() }),
  excluirLog:  (id)  => _delete(STORES.MEDICAMENTOS_LOG, id)
};

// ════════════════════════════════════════════════════════
// API PÚBLICA — MEDICAMENTOS EMERGENCIAIS (ESTADO)
// Prescritos pela pediatra para uso quando necessário
// ════════════════════════════════════════════════════════
const MedicamentosEmergencial = {
  listar:  ()    => _getAll(STORES.MEDICAMENTOS_EMERG),
  salvar:  (obj) => _put(STORES.MEDICAMENTOS_EMERG, { ...obj, id: obj.id || gerarId() }),
  excluir: (id)  => _delete(STORES.MEDICAMENTOS_EMERG, id)
};

// ════════════════════════════════════════════════════════
// API PÚBLICA — AGENDA (EVENTOS)
// ════════════════════════════════════════════════════════
const Agenda = {
  listar:    ()    => _getAll(STORES.AGENDA).then(r => r.sort((a,b) => a.data.localeCompare(b.data))),
  salvar:    (obj) => _put(STORES.AGENDA,  { ...obj, id: obj.id || gerarId(), criado_em: obj.criado_em || new Date().toISOString() }),
  excluir:   (id)  => _delete(STORES.AGENDA, id),
  porStatus: (s)   => _getAllByIndex(STORES.AGENDA, 'status', s)
};

// ════════════════════════════════════════════════════════
// API PÚBLICA — SONO (EVENTOS)
// ════════════════════════════════════════════════════════
const Sono = {
  listar:    ()    => _getAll(STORES.SONO).then(r => r.sort((a,b) => b.data.localeCompare(a.data))),
  registrar: (obj) => _add(STORES.SONO, { ...obj, id: gerarId(), criado_em: new Date().toISOString() }),
  excluir:   (id)  => _delete(STORES.SONO, id)
};

// ════════════════════════════════════════════════════════
// API PÚBLICA — CONTATOS (ESTADO)
// ════════════════════════════════════════════════════════
const Contatos = {
  listar:  ()    => _getAll(STORES.CONTATOS),
  salvar:  (obj) => _put(STORES.CONTATOS, { ...obj, id: obj.id || gerarId() }),
  excluir: (id)  => _delete(STORES.CONTATOS, id)
};

// ════════════════════════════════════════════════════════
// API PÚBLICA — PLANO DE SAÚDE (ESTADO ÚNICO)
// ════════════════════════════════════════════════════════
const PlanoSaude = {
  get:    ()    => _get(STORES.PLANO_SAUDE, 'principal'),
  salvar: (obj) => _put(STORES.PLANO_SAUDE, { ...obj, id: 'principal' })
};

// ════════════════════════════════════════════════════════
// API PÚBLICA — VESTUÁRIO (EVENTOS)
// ════════════════════════════════════════════════════════
const Vestuario = {
  listar:    ()    => _getAll(STORES.VESTUARIO).then(r => r.sort((a,b) => b.data.localeCompare(a.data))),
  registrar: (obj) => _add(STORES.VESTUARIO, { ...obj, id: gerarId(), criado_em: new Date().toISOString() }),
  excluir:   (id)  => _delete(STORES.VESTUARIO, id)
};

// ════════════════════════════════════════════════════════
// API PÚBLICA — META / CONFIGURAÇÕES
// ════════════════════════════════════════════════════════
const Meta = {
  get:    (chave)        => _get(STORES.META, chave),
  set:    (chave, valor) => _put(STORES.META, { chave, valor, atualizado_em: new Date().toISOString() }),
  getAll: ()             => _getAll(STORES.META)
};

// ════════════════════════════════════════════════════════
// EXPORTAÇÃO / IMPORTAÇÃO COMPLETA
// ════════════════════════════════════════════════════════
async function exportarTudo() {
  const [
    perfil, crescimento, vacinas,
    medCont, medLog, medEmerg, agenda, sono,
    contatos, plano, vestuario, meta
  ] = await Promise.all([
    Perfil.get(), Crescimento.listar(), Vacinas.listar(),
    Medicamentos.listarContinuos(), Medicamentos.listarLog(),
    MedicamentosEmergencial.listar(),
    Agenda.listar(), Sono.listar(),
    Contatos.listar(), PlanoSaude.get(), Vestuario.listar(),
    Meta.getAll()
  ]);

  return {
    versao_export: '1.0',
    exportado_em: new Date().toISOString(),
    app: 'bebe-saudavel',
    dados: {
      perfil, crescimento, vacinas,
      medicamentos_continuos: medCont,
      medicamentos_log: medLog,
      medicamentos_emergenciais: medEmerg,
      agenda, sono, contatos,
      plano_saude: plano,
      vestuario, meta
    }
  };
}

async function importarTudo(json) {
  // Valida estrutura mínima
  if (!json || !json.dados || !json.app || json.app !== 'bebe-saudavel') {
    throw new Error('Arquivo de backup inválido ou incompatível.');
  }
  const d = json.dados;

  await abrirDB();

  const ops = [];
  if (d.perfil)                  ops.push(_put(STORES.PERFIL,           d.perfil));
  if (d.plano_saude)             ops.push(_put(STORES.PLANO_SAUDE,      d.plano_saude));
  if (Array.isArray(d.crescimento))         d.crescimento.forEach(r => ops.push(_put(STORES.CRESCIMENTO,       r)));
  if (Array.isArray(d.vacinas))             d.vacinas.forEach(r => ops.push(_put(STORES.VACINAS,              r)));
  if (Array.isArray(d.medicamentos_continuos)) d.medicamentos_continuos.forEach(r => ops.push(_put(STORES.MEDICAMENTOS_USO, r)));
  if (Array.isArray(d.medicamentos_log))    d.medicamentos_log.forEach(r => ops.push(_put(STORES.MEDICAMENTOS_LOG,  r)));
  if (Array.isArray(d.medicamentos_emergenciais)) d.medicamentos_emergenciais.forEach(r => ops.push(_put(STORES.MEDICAMENTOS_EMERG, r)));
  if (Array.isArray(d.agenda))              d.agenda.forEach(r => ops.push(_put(STORES.AGENDA,               r)));
  if (Array.isArray(d.sono))                d.sono.forEach(r => ops.push(_put(STORES.SONO,                   r)));
  if (Array.isArray(d.contatos))            d.contatos.forEach(r => ops.push(_put(STORES.CONTATOS,           r)));
  if (Array.isArray(d.vestuario))           d.vestuario.forEach(r => ops.push(_put(STORES.VESTUARIO,         r)));

  await Promise.all(ops);
  return true;
}

// Exportação global
window.DB = {
  abrir: abrirDB, gerarId,
  Perfil, Crescimento, Vacinas, Medicamentos,
  Agenda, Sono, Contatos, PlanoSaude, Vestuario, Meta, MedicamentosEmergencial,
  exportarTudo, importarTudo
};
