import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowUpDown, Plus, X, TrendingUp, TrendingDown, Banknote,
  RefreshCw, AlertTriangle, DollarSign, Euro, Check, Trash2, Edit2,
  BarChart3, ArrowRight, ArrowLeft, Info, Clock, ShieldAlert
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { getDatabase } from '@/database/db';

// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface CandongarateRecord {
  date: string;
  usd: number;
  eur: number;
  gbp: number;
  source: string;
}

interface CandongatransacaoRecord {
  id: string;
  date: string;
  tipo: 'compra' | 'venda';
  moeda: 'USD' | 'EUR' | 'GBP';
  quantidade: number;
  taxa: number;
  total_kz: number;
  taxa_bna?: number;
  descricao?: string;
  created_at: string;
}

// ─── MOEDAS CONFIG ─────────────────────────────────────────────────────────
const MOEDAS = {
  USD: { nome: 'Dólar Americano', simbolo: '$', cor: 'emerald', emoji: '🇺🇸', corBg: 'bg-emerald-50', corText: 'text-emerald-700', corBorder: 'border-emerald-100', corBold: 'bg-emerald-600' },
  EUR: { nome: 'Euro', simbolo: '€', cor: 'blue', emoji: '🇪🇺', corBg: 'bg-blue-50', corText: 'text-blue-700', corBorder: 'border-blue-100', corBold: 'bg-blue-600' },
  GBP: { nome: 'Libra Esterlina', simbolo: '£', cor: 'violet', emoji: '🇬🇧', corBg: 'bg-violet-50', corText: 'text-violet-700', corBorder: 'border-violet-100', corBold: 'bg-violet-600' },
};

// ─── MOCK TAXAS INICIAIS ─────────────────────────────────────────────────
const TAXAS_INICIAIS: CandongarateRecord = {
  date: new Date().toISOString().split('T')[0],
  usd: 880,
  eur: 960,
  gbp: 1120,
  source: 'manual',
};

const TAXA_BNA_INICIAL = { usd: 837, eur: 908, gbp: 1062 };

const fmtKz = (val: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

const fmt2 = (val: number) =>
  new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

export default function Candonga() {
  const [activeTab, setActiveTab] = useState<'mercado' | 'transacoes' | 'calculadora'>('mercado');

  // ─── Taxas ─────────────────────────────────────────────────────────────────
  const [taxas, setTaxas] = useState<CandongarateRecord>(() => {
    try {
      const saved = localStorage.getItem('candonga_taxas');
      return saved ? JSON.parse(saved) : TAXAS_INICIAIS;
    } catch { return TAXAS_INICIAIS; }
  });
  const [editingTaxas, setEditingTaxas] = useState(false);
  const [taxaForm, setTaxaForm] = useState({ usd: taxas.usd.toString(), eur: taxas.eur.toString(), gbp: taxas.gbp.toString() });

  const saveTaxas = () => {
    const newTaxas = {
      date: new Date().toISOString().split('T')[0],
      usd: Number(taxaForm.usd),
      eur: Number(taxaForm.eur),
      gbp: Number(taxaForm.gbp),
      source: 'manual',
    };
    setTaxas(newTaxas);
    localStorage.setItem('candonga_taxas', JSON.stringify(newTaxas));
    setEditingTaxas(false);
  };

  // ─── Transações ─────────────────────────────────────────────────────────────
  const [transacoes, setTransacoes] = useState<CandongatransacaoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: 'compra' as 'compra' | 'venda',
    moeda: 'USD' as 'USD' | 'EUR' | 'GBP',
    quantidade: '',
    descricao: '',
    date: new Date().toISOString().split('T')[0],
  });

  const taxaAtual = form.moeda === 'USD' ? taxas.usd : form.moeda === 'EUR' ? taxas.eur : taxas.gbp;
  const taxaBna = form.moeda === 'USD' ? TAXA_BNA_INICIAL.usd : form.moeda === 'EUR' ? TAXA_BNA_INICIAL.eur : TAXA_BNA_INICIAL.gbp;
  const totalKz = Number(form.quantidade || 0) * taxaAtual;
  const spreadPct = (((taxaAtual - taxaBna) / taxaBna) * 100).toFixed(1);

  const loadTransacoes = async () => {
    try {
      const db = await getDatabase();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS candonga_transacoes (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          tipo TEXT NOT NULL,
          moeda TEXT NOT NULL,
          quantidade REAL NOT NULL,
          taxa REAL NOT NULL,
          total_kz REAL NOT NULL,
          taxa_bna REAL,
          descricao TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const res = await db.select<CandongatransacaoRecord[]>(
        'SELECT * FROM candonga_transacoes ORDER BY date DESC, created_at DESC LIMIT 200'
      );
      setTransacoes(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTransacoes(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quantidade || Number(form.quantidade) <= 0) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      const taxa = form.moeda === 'USD' ? taxas.usd : form.moeda === 'EUR' ? taxas.eur : taxas.gbp;
      const bnaTaxa = form.moeda === 'USD' ? TAXA_BNA_INICIAL.usd : form.moeda === 'EUR' ? TAXA_BNA_INICIAL.eur : TAXA_BNA_INICIAL.gbp;
      await db.execute(
        'INSERT INTO candonga_transacoes (id, date, tipo, moeda, quantidade, taxa, total_kz, taxa_bna, descricao) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [id, form.date, form.tipo, form.moeda, Number(form.quantidade), taxa, Number(form.quantidade) * taxa, bnaTaxa, form.descricao || null]
      );
      await loadTransacoes();
      setIsModalOpen(false);
      setForm({ tipo: 'compra', moeda: 'USD', quantidade: '', descricao: '', date: new Date().toISOString().split('T')[0] });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este registo?')) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM candonga_transacoes WHERE id=$1', [id]);
      await loadTransacoes();
    } catch (e) { console.error(e); }
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const compras = transacoes.filter(t => t.tipo === 'compra');
    const vendas = transacoes.filter(t => t.tipo === 'venda');
    const totalGastoKz = compras.reduce((a, b) => a + b.total_kz, 0);
    const totalRecebidoKz = vendas.reduce((a, b) => a + b.total_kz, 0);
    const lucro = totalRecebidoKz - totalGastoKz;
    return { totalGastoKz, totalRecebidoKz, lucro, nCompras: compras.length, nVendas: vendas.length };
  }, [transacoes]);

  // ─── Calculadora ───────────────────────────────────────────────────────────
  const [calcMode, setCalcMode] = useState<'kz_para_divisa' | 'divisa_para_kz'>('kz_para_divisa');
  const [calcMoeda, setCalcMoeda] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [calcValor, setCalcValor] = useState('');
  const calcTaxa = calcMoeda === 'USD' ? taxas.usd : calcMoeda === 'EUR' ? taxas.eur : taxas.gbp;
  const calcResultado = calcMode === 'kz_para_divisa'
    ? Number(calcValor || 0) / calcTaxa
    : Number(calcValor || 0) * calcTaxa;

  return (
    <PageTransition className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Candonga</h1>
          <p className="text-gray-500 mt-1">Acompanhe as taxas do mercado informal, registe as suas operações de câmbio e calcule o spread em relação ao BNA.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium flex items-center hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registar Operação
        </button>
      </div>

      {/* Aviso legal */}
      <div className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs text-amber-700">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
        <p>Este módulo é apenas para <strong>fins de controlo pessoal e educativo</strong>. As taxas são inseridas manualmente e reflectem o mercado informal. O VukaPay não facilita nem incentiva transacções ilegais.</p>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'mercado', label: 'Taxas do Dia' },
          { id: 'transacoes', label: 'Operações' },
          { id: 'calculadora', label: 'Calculadora' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab: Mercado ──────────────────────────────────────────────── */}
      {activeTab === 'mercado' && (
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Comprado', val: fmtKz(stats.totalGastoKz), icon: TrendingDown, color: 'text-red-600', bgIcon: 'bg-red-50' },
              { label: 'Total Vendido', val: fmtKz(stats.totalRecebidoKz), icon: TrendingUp, color: 'text-emerald-600', bgIcon: 'bg-emerald-50' },
              { label: 'Lucro / Diferença', val: fmtKz(stats.lucro), icon: BarChart3, color: stats.lucro >= 0 ? 'text-emerald-600' : 'text-red-600', bgIcon: stats.lucro >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
              { label: 'Total Operações', val: `${transacoes.length}`, icon: ArrowUpDown, color: 'text-indigo-600', bgIcon: 'bg-indigo-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", s.bgIcon, s.color)}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.label}</h2>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
                  {s.val}
                </h3>
              </div>
            ))}
          </div>

          {/* Taxas editáveis */}
          <div className="bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Taxas do Mercado Paralelo</h2>
                <p className="text-xs text-gray-500 mt-0.5">Actualizado em: {taxas.date} · Inserção manual</p>
              </div>
              {editingTaxas ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditingTaxas(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-200 transition-colors cursor-pointer">Cancelar</button>
                  <button onClick={saveTaxas} className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"><Check className="w-3.5 h-3.5" />Guardar</button>
                </div>
              ) : (
                <button onClick={() => setEditingTaxas(true)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1.5 cursor-pointer"><Edit2 className="w-3.5 h-3.5" />Actualizar Taxas</button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Object.keys(MOEDAS) as (keyof typeof MOEDAS)[]).map(m => {
                const taxa = m === 'USD' ? taxas.usd : m === 'EUR' ? taxas.eur : taxas.gbp;
                const bna = m === 'USD' ? TAXA_BNA_INICIAL.usd : m === 'EUR' ? TAXA_BNA_INICIAL.eur : TAXA_BNA_INICIAL.gbp;
                const spread = taxa - bna;
                const spreadPct = ((spread / bna) * 100).toFixed(1);
                const { corBg, corText, corBorder, corBold, emoji, nome, simbolo } = MOEDAS[m];

                return (
                  <div key={m} className="bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Top Row: Emoji Icon and Spread */}
                      <div className="flex items-start justify-between">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border", corBg, corBorder)}>
                          {emoji}
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border", corText, corBg, corBorder)}>
                          +{spreadPct}% BNA
                        </span>
                      </div>

                      {/* Currency Details */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-950">{m}</h3>
                        <p className="text-xs text-gray-505 font-medium">{nome}</p>
                      </div>

                      {editingTaxas ? (
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider">Taxa Mercado (Kz)</label>
                          <input
                            type="number"
                            value={taxaForm[m.toLowerCase() as 'usd' | 'eur' | 'gbp']}
                            onChange={e => setTaxaForm({ ...taxaForm, [m.toLowerCase()]: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-gray-900 tracking-tight">{fmtKz(taxa)}</span>
                            <span className="text-xs text-gray-400">/ {simbolo}1,00</span>
                          </div>

                          <div className="pt-3 border-t border-gray-100/60 flex justify-between text-xs font-semibold text-gray-500">
                            <span>Oficial BNA</span>
                            <span className="text-gray-750">{fmtKz(bna)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-gray-500">
                            <span>Diferença / Spread</span>
                            <span className={cn("font-bold", corText)}>+{fmtKz(spread)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Transações ────────────────────────────────────────────── */}
      {activeTab === 'transacoes' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : transacoes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
              <ArrowUpDown className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-black text-gray-900 mb-2">Sem operações registadas</h3>
              <p className="text-sm text-gray-500 mb-6">Registe a sua primeira operação de câmbio no mercado paralelo.</p>
              <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-colors">Registar Operação</button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Data</th>
                    <th className="px-6 py-4 text-left">Tipo</th>
                    <th className="px-6 py-4 text-left">Moeda</th>
                    <th className="px-6 py-4 text-right">Quantidade</th>
                    <th className="px-6 py-4 text-right">Taxa (Kz)</th>
                    <th className="px-6 py-4 text-right">Total (Kz)</th>
                    <th className="px-6 py-4 text-right">Spread</th>
                    <th className="px-2 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transacoes.map(t => {
                    const spread = t.taxa_bna ? (((t.taxa - t.taxa_bna) / t.taxa_bna) * 100).toFixed(1) : null;
                    const m = MOEDAS[t.moeda as keyof typeof MOEDAS];
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(t.date).toLocaleDateString('pt-AO')}</td>
                        <td className="px-6 py-4">
                          <span className={cn('px-3 py-1 rounded-full text-xs font-black border', t.tipo === 'compra' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100')}>
                            {t.tipo === 'compra' ? '↓ Compra' : '↑ Venda'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('px-2 py-1 rounded-lg text-xs font-black', m.corBg, m.corText)}>{m.emoji} {t.moeda}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-900">{MOEDAS[t.moeda as keyof typeof MOEDAS].simbolo}{fmt2(t.quantidade)}</td>
                        <td className="px-6 py-4 text-right text-sm text-gray-700 font-semibold">{fmtKz(t.taxa)}</td>
                        <td className="px-6 py-4 text-right font-black text-gray-900">{fmtKz(t.total_kz)}</td>
                        <td className="px-6 py-4 text-right">
                          {spread && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">+{spread}%</span>}
                        </td>
                        <td className="px-2 py-4">
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Calculadora ───────────────────────────────────────────── */}
      {activeTab === 'calculadora' && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div>
              <h2 className="font-black text-gray-900 text-xl mb-1">Calculadora de Câmbio</h2>
              <p className="text-sm text-gray-500">Usando taxas do mercado paralelo actualizadas manualmente.</p>
            </div>

            {/* Selector moeda */}
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(MOEDAS) as (keyof typeof MOEDAS)[]).map(m => (
                <button
                  key={m}
                  onClick={() => setCalcMoeda(m)}
                  className={cn('py-3 rounded-2xl text-sm font-black border transition-all', calcMoeda === m ? `${MOEDAS[m].corBg} ${MOEDAS[m].corText} ${MOEDAS[m].corBorder}` : 'bg-gray-50 text-gray-500 border-gray-100')}
                >
                  {MOEDAS[m].emoji} {m}
                </button>
              ))}
            </div>

            {/* Modo */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
              <button onClick={() => setCalcMode('kz_para_divisa')} className={cn('flex-1 py-2.5 rounded-xl text-xs font-bold transition-all', calcMode === 'kz_para_divisa' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
                Kz → {calcMoeda}
              </button>
              <button onClick={() => setCalcMode('divisa_para_kz')} className={cn('flex-1 py-2.5 rounded-xl text-xs font-bold transition-all', calcMode === 'divisa_para_kz' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
                {calcMoeda} → Kz
              </button>
            </div>

            {/* Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {calcMode === 'kz_para_divisa' ? 'Valor em Kwanzas (Kz)' : `Valor em ${calcMoeda}`}
              </label>
              <input
                type="number"
                value={calcValor}
                onChange={e => setCalcValor(e.target.value)}
                placeholder="0"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-2xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Resultado */}
            <div className={cn('rounded-2xl p-6 border', MOEDAS[calcMoeda].corBg, MOEDAS[calcMoeda].corBorder)}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Resultado</p>
              <p className={`text-4xl font-black ${MOEDAS[calcMoeda].corText}`}>
                {calcMode === 'kz_para_divisa'
                  ? `${MOEDAS[calcMoeda].simbolo}${fmt2(calcResultado)}`
                  : fmtKz(calcResultado)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Taxa aplicada: 1 {calcMoeda} = {fmtKz(calcTaxa)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Registar Operação ────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Registar Operação Candonga</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-3">
                {(['compra', 'venda'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, tipo: t })}
                    className={cn('py-3 rounded-2xl text-sm font-black border-2 transition-all',
                      form.tipo === t
                        ? t === 'compra' ? 'bg-red-500 text-white border-red-500' : 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white text-gray-400 border-gray-200')}
                  >
                    {t === 'compra' ? '↓ Comprar Divisas' : '↑ Vender Divisas'}
                  </button>
                ))}
              </div>

              {/* Moeda */}
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(MOEDAS) as (keyof typeof MOEDAS)[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, moeda: m })}
                    className={cn('py-2.5 rounded-xl text-xs font-black border transition-all',
                      form.moeda === m ? `${MOEDAS[m].corBg} ${MOEDAS[m].corText} ${MOEDAS[m].corBorder} border-2` : 'bg-gray-50 text-gray-500 border-gray-100')}
                  >
                    {MOEDAS[m].emoji} {m}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Quantidade</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={form.quantidade}
                    onChange={e => setForm({ ...form, quantidade: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900"
                    placeholder={`Ex: 100 ${form.moeda}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Data</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none text-gray-900"
                  />
                </div>
              </div>

              {/* Pré-visualização */}
              {form.quantidade && Number(form.quantidade) > 0 && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <p className="text-xs text-indigo-600 font-bold mb-1">Pré-visualização</p>
                  <p className="text-lg font-black text-indigo-900">
                    {MOEDAS[form.moeda].simbolo}{fmt2(Number(form.quantidade))} = {fmtKz(totalKz)}
                  </p>
                  <p className="text-xs text-indigo-400 mt-1">Taxa: {fmtKz(taxaAtual)}/1{form.moeda} · Spread: +{spreadPct}% vs BNA</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Descrição (opcional)</label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none text-gray-900"
                  placeholder="Ex: Câmbio para viagem a Portugal"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl text-sm hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Registar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
