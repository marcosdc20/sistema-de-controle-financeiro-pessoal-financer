import React, { useState, useMemo, useEffect } from 'react';
import {
  Heart, Plus, X, Check, Trash2, Edit2, Send, Phone, MapPin,
  Banknote, Clock, Calendar, TrendingUp, Users, Bell, ChevronDown,
  ArrowRight, BarChart3, AlertCircle, Star
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { getDatabase } from '@/database/db';

// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface FamilyMember {
  id: string;
  nome: string;
  parentesco: string;
  provincia: string;
  telefone?: string;
  mesada: number;
  frequencia: 'mensal' | 'quinzenal' | 'semanal' | 'irregular';
  prioridade: 'essencial' | 'importante' | 'complementar';
  ultima_data?: string;
  notas?: string;
  created_at: string;
}

interface MesadaEnvio {
  id: string;
  membro_id: string;
  membro_nome: string;
  valor: number;
  data: string;
  metodo: 'transferencia' | 'multicaixa' | 'cash' | 'unitel_money' | 'africell_money';
  notas?: string;
  created_at: string;
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const PROVINCIAS = [
  'Luanda', 'Benguela', 'Huíla', 'Uíge', 'Malanje', 'Bié', 'Huambo',
  'Moxico', 'Kwanza Norte', 'Kwanza Sul', 'Cabinda', 'Zaire', 'Lunda Norte',
  'Lunda Sul', 'Cunene', 'Namibe', 'Cuando Cubango', 'Bengo', 'Kuando Kubango'
];

const PARENTESCOS = [
  'Pai', 'Mãe', 'Irmão', 'Irmã', 'Avô', 'Avó', 'Filho', 'Filha',
  'Tio', 'Tia', 'Primo', 'Prima', 'Cônjuge', 'Sobrinho', 'Sobrinha', 'Outro'
];

const PRIORIDADE_CONFIG = {
  essencial:    { label: 'Essencial',    cor: 'text-red-600 bg-red-50 border-red-100',     emoji: '🔴', descricao: 'Depende de você para viver' },
  importante:   { label: 'Importante',   cor: 'text-amber-600 bg-amber-50 border-amber-100', emoji: '🟡', descricao: 'Apoio significativo' },
  complementar: { label: 'Complementar', cor: 'text-emerald-600 bg-emerald-50 border-emerald-100', emoji: '🟢', descricao: 'Ajuda adicional' },
};

const METODOS_ENVIO = {
  transferencia:    { label: 'Transferência Bancária', emoji: '🏦' },
  multicaixa:       { label: 'Multicaixa Express',     emoji: '📱' },
  cash:             { label: 'Dinheiro em Mão',         emoji: '💵' },
  unitel_money:     { label: 'Unitel Money',            emoji: '🟠' },
  africell_money:   { label: 'Africell Money',          emoji: '🟣' },
};

const FREQ_LABELS = { mensal: 'Mensal', quinzenal: 'Quinzenal', semanal: 'Semanal', irregular: 'Irregular' };

const fmtKz = (val: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

const initials = (nome: string) => nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

const COLORS_LIST = [
  'from-red-400 to-rose-600',
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-600',
  'from-blue-400 to-indigo-600',
  'from-violet-400 to-purple-600',
  'from-pink-400 to-rose-600',
];

const memberColor = (id: string) => COLORS_LIST[id.charCodeAt(0) % COLORS_LIST.length];

const EMPTY_MEMBER = {
  nome: '', parentesco: 'Mãe', provincia: 'Benguela', telefone: '',
  mesada: '', frequencia: 'mensal' as FamilyMember['frequencia'],
  prioridade: 'essencial' as FamilyMember['prioridade'], notas: '',
};

const EMPTY_ENVIO = {
  membro_id: '', valor: '', data: new Date().toISOString().split('T')[0],
  metodo: 'multicaixa' as MesadaEnvio['metodo'], notas: '',
};

export default function MesadaFamiliar() {
  const [activeTab, setActiveTab] = useState<'familia' | 'envios' | 'resumo'>('familia');
  const [membros, setMembros] = useState<FamilyMember[]>([]);
  const [envios, setEnvios] = useState<MesadaEnvio[]>([]);
  const [loading, setLoading] = useState(true);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isEnvioModalOpen, setIsEnvioModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER);
  const [envioForm, setEnvioForm] = useState(EMPTY_ENVIO);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const db = await getDatabase();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS mesada_membros (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          parentesco TEXT,
          provincia TEXT,
          telefone TEXT,
          mesada REAL NOT NULL DEFAULT 0,
          frequencia TEXT DEFAULT 'mensal',
          prioridade TEXT DEFAULT 'essencial',
          ultima_data TEXT,
          notas TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS mesada_envios (
          id TEXT PRIMARY KEY,
          membro_id TEXT NOT NULL,
          membro_nome TEXT NOT NULL,
          valor REAL NOT NULL,
          data TEXT NOT NULL,
          metodo TEXT DEFAULT 'multicaixa',
          notas TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const m = await db.select<FamilyMember[]>('SELECT * FROM mesada_membros ORDER BY prioridade, nome');
      const e = await db.select<MesadaEnvio[]>('SELECT * FROM mesada_envios ORDER BY data DESC LIMIT 500');
      setMembros(m);
      setEnvios(e);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // ─── Handlers Membros ────────────────────────────────────────────────────
  const openCreateMember = () => { setEditingMember(null); setMemberForm(EMPTY_MEMBER); setIsMemberModalOpen(true); };
  const openEditMember = (m: FamilyMember) => {
    setEditingMember(m);
    setMemberForm({ nome: m.nome, parentesco: m.parentesco, provincia: m.provincia, telefone: m.telefone || '', mesada: m.mesada.toString() as any, frequencia: m.frequencia, prioridade: m.prioridade, notas: m.notas || '' });
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const db = await getDatabase();
      if (editingMember) {
        await db.execute(
          'UPDATE mesada_membros SET nome=$1,parentesco=$2,provincia=$3,telefone=$4,mesada=$5,frequencia=$6,prioridade=$7,notas=$8 WHERE id=$9',
          [memberForm.nome, memberForm.parentesco, memberForm.provincia, memberForm.telefone || null, Number(memberForm.mesada) || 0, memberForm.frequencia, memberForm.prioridade, memberForm.notas || null, editingMember.id]
        );
      } else {
        await db.execute(
          'INSERT INTO mesada_membros (id,nome,parentesco,provincia,telefone,mesada,frequencia,prioridade,notas) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
          [crypto.randomUUID(), memberForm.nome, memberForm.parentesco, memberForm.provincia, memberForm.telefone || null, Number(memberForm.mesada) || 0, memberForm.frequencia, memberForm.prioridade, memberForm.notas || null]
        );
      }
      await loadData();
      setIsMemberModalOpen(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDeleteMember = async (id: string, nome: string) => {
    if (!confirm(`Remover "${nome}" da lista familiar?`)) return;
    const db = await getDatabase();
    await db.execute('DELETE FROM mesada_membros WHERE id=$1', [id]);
    await loadData();
  };

  // ─── Handlers Envios ────────────────────────────────────────────────────
  const openEnvioModal = (membroId?: string) => {
    setEnvioForm({ ...EMPTY_ENVIO, membro_id: membroId || '' });
    setIsEnvioModalOpen(true);
  };

  const handleSaveEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!envioForm.membro_id || !envioForm.valor) return;
    setSaving(true);
    try {
      const db = await getDatabase();
      const membro = membros.find(m => m.id === envioForm.membro_id);
      await db.execute(
        'INSERT INTO mesada_envios (id,membro_id,membro_nome,valor,data,metodo,notas) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [crypto.randomUUID(), envioForm.membro_id, membro?.nome || '', Number(envioForm.valor), envioForm.data, envioForm.metodo, envioForm.notas || null]
      );
      await db.execute('UPDATE mesada_membros SET ultima_data=$1 WHERE id=$2', [envioForm.data, envioForm.membro_id]);
      await loadData();
      setIsEnvioModalOpen(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDeleteEnvio = async (id: string) => {
    if (!confirm('Eliminar este registo de envio?')) return;
    const db = await getDatabase();
    await db.execute('DELETE FROM mesada_envios WHERE id=$1', [id]);
    await loadData();
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalMesada = membros.reduce((a, b) => a + b.mesada, 0);
    const essenciais = membros.filter(m => m.prioridade === 'essencial').length;
    const mesAtual = new Date().toISOString().slice(0, 7);
    const enviosMesAtual = envios.filter(e => e.data.startsWith(mesAtual));
    const totalEnviadoMes = enviosMesAtual.reduce((a, b) => a + b.valor, 0);
    const totalEnviadoGeral = envios.reduce((a, b) => a + b.valor, 0);
    return { totalMesada, essenciais, totalEnviadoMes, totalEnviadoGeral };
  }, [membros, envios]);

  const enviosPorMembro = useMemo(() => {
    const map: Record<string, number> = {};
    envios.forEach(e => { map[e.membro_id] = (map[e.membro_id] || 0) + e.valor; });
    return map;
  }, [envios]);

  const hoje = new Date();
  const daysInMonth = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - hoje.getDate();

  return (
    <PageTransition className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Mesada Familiar</h1>
          <p className="text-gray-500 mt-1">Gira o suporte financeiro que envia à sua família nas províncias. Registe mensalidades, acompanhe envios e nunca se esqueça de quem depende de si.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openCreateMember}
            className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium flex items-center hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar Familiar
          </button>
          <button
            onClick={() => openEnvioModal()}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center hover:bg-gray-200 transition-colors shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4 mr-2" /> Registar Envio
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Familiares', val: membros.length, sub: `${stats.essenciais} essenciais`, icon: Users, color: 'text-red-600', bgIcon: 'bg-red-50' },
          { label: 'Mesada Total/Mês', val: fmtKz(stats.totalMesada), sub: 'Compromisso mensal', icon: Banknote, color: 'text-red-600', bgIcon: 'bg-red-50' },
          { label: 'Enviado Este Mês', val: fmtKz(stats.totalEnviadoMes), sub: `${daysLeft} dias restantes`, icon: Clock, color: 'text-red-600', bgIcon: 'bg-red-50' },
          { label: 'Total Enviado', val: fmtKz(stats.totalEnviadoGeral), sub: 'Histórico geral', icon: Heart, color: 'text-red-600', bgIcon: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", s.bgIcon, s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.label}</h2>
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-gray-900">{s.val}</h3>
            <p className="text-xs text-gray-400 mt-1 font-medium">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'familia', label: 'Família' },
          { id: 'envios', label: 'Envios' },
          { id: 'resumo', label: 'Resumo' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === tab.id
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab: Família ────────────────────────────────────────────────── */}
      {activeTab === 'familia' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : membros.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
              <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-black text-gray-900 mb-2">Nenhum familiar registado</h3>
              <p className="text-sm text-gray-500 mb-6">Adicione os membros da família que dependem do seu apoio financeiro.</p>
              <button onClick={openCreateMember} className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors">
                Adicionar Familiar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {membros.map(m => {
                const totalEnviado = enviosPorMembro[m.id] || 0;
                const mesAtual = new Date().toISOString().slice(0, 7);
                const enviadoEsteMes = envios.filter(e => e.membro_id === m.id && e.data.startsWith(mesAtual)).reduce((a, b) => a + b.valor, 0);
                const pagoPct = m.mesada > 0 ? Math.min((enviadoEsteMes / m.mesada) * 100, 100) : 0;
                const pago = enviadoEsteMes >= m.mesada && m.mesada > 0;
                const pConfig = PRIORIDADE_CONFIG[m.prioridade];

                return (
                  <div key={m.id} className={cn('bg-white rounded-3xl border shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 group flex flex-col justify-between', pago ? 'border-emerald-100 hover:border-emerald-300' : m.prioridade === 'essencial' ? 'border-red-100 hover:border-red-300' : 'border-gray-100/50 hover:border-gray-300')}>
                    {/* Avatar e nome */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${memberColor(m.id)} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                          {initials(m.nome)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-950">{m.nome}</h3>
                          <p className="text-xs text-gray-500 font-medium">{m.parentesco} · {m.provincia}</p>
                        </div>
                      </div>
                      {pago && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 rounded-lg flex items-center gap-1">
                          <Check className="w-3 h-3" /> Pago
                        </span>
                      )}
                    </div>

                    {/* Prioridade */}
                    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border mb-4 self-start', pConfig.cor)}>
                      <span>{pConfig.emoji}</span> {pConfig.label}
                    </div>

                    {/* Valores */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-gray-500">Mesada {FREQ_LABELS[m.frequencia]}</span>
                        <span className="text-xl font-bold text-gray-950">{fmtKz(m.mesada)}</span>
                      </div>

                      {m.mesada > 0 && (
                        <>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-700', pago ? 'bg-emerald-500' : m.prioridade === 'essencial' ? 'bg-red-500' : 'bg-amber-500')}
                              style={{ width: `${pagoPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-gray-500">
                            <span className="text-gray-400">Enviado este mês</span>
                            <span className="text-gray-700">{fmtKz(enviadoEsteMes)}</span>
                          </div>
                        </>
                      )}

                      {m.telefone && (
                        <a href={`tel:${m.telefone}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 transition-colors font-medium">
                          <Phone className="w-3.5 h-3.5" /> {m.telefone}
                        </a>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEnvioModal(m.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold transition-colors hover:bg-red-700 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Enviar
                      </button>
                      <button
                        onClick={() => openEditMember(m)}
                        className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(m.id, m.nome)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Card "Adicionar" */}
              <button
                onClick={openCreateMember}
                className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-red-300 hover:bg-red-50/20 hover:text-red-500 transition-all min-h-[260px] group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-2xl">
                  👤
                </div>
                <span className="font-bold text-sm">Adicionar Familiar</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Envios ─────────────────────────────────────────────────── */}
      {activeTab === 'envios' && (
        <div className="space-y-4">
          {envios.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
              <Send className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-black text-gray-900 mb-2">Nenhum envio registado</h3>
              <button onClick={() => openEnvioModal()} className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors">
                Registar Primeiro Envio
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Data</th>
                    <th className="px-6 py-4 text-left">Destinatário</th>
                    <th className="px-6 py-4 text-left">Método</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                    <th className="px-6 py-4 text-left">Notas</th>
                    <th className="px-2 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {envios.map(e => {
                    const m = membros.find(mb => mb.id === e.membro_id);
                    return (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(e.data).toLocaleDateString('pt-AO')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${m ? memberColor(m.id) : 'from-gray-400 to-gray-600'} flex items-center justify-center text-white text-[10px] font-black`}>
                              {initials(e.membro_nome)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{e.membro_nome}</p>
                              {m && <p className="text-[10px] text-gray-400">{m.provincia}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-600">
                            {METODOS_ENVIO[e.metodo]?.emoji} {METODOS_ENVIO[e.metodo]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-900">{fmtKz(e.valor)}</td>
                        <td className="px-6 py-4 text-xs text-gray-400 max-w-[150px] truncate">{e.notas || '—'}</td>
                        <td className="px-2 py-4">
                          <button onClick={() => handleDeleteEnvio(e.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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

      {/* ─── Tab: Resumo ─────────────────────────────────────────────────── */}
      {activeTab === 'resumo' && (
        <div className="space-y-6">
          {/* Breakdown por familiar */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-black text-gray-900 text-lg mb-6">Total Enviado por Familiar</h2>
            <div className="space-y-4">
              {membros.map(m => {
                const total = enviosPorMembro[m.id] || 0;
                const maxTotal = Math.max(...membros.map(mb => enviosPorMembro[mb.id] || 0), 1);
                const pct = (total / maxTotal) * 100;
                return (
                  <div key={m.id} className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${memberColor(m.id)} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                      {initials(m.nome)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-bold text-gray-900">{m.nome}</span>
                        <span className="text-sm font-black text-gray-900">{fmtKz(total)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${memberColor(m.id)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {membros.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>}
            </div>
          </div>

          {/* Meses com mais gastos */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-black text-gray-900 text-lg mb-6">Histórico Mensal de Envios</h2>
            <div className="space-y-3">
              {(() => {
                const byMonth: Record<string, number> = {};
                envios.forEach(e => {
                  const m = e.data.slice(0, 7);
                  byMonth[m] = (byMonth[m] || 0) + e.valor;
                });
                return Object.entries(byMonth)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 12)
                  .map(([mes, val]) => {
                    const [y, m] = mes.split('-');
                    const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' });
                    return (
                      <div key={mes} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700 capitalize">{label}</span>
                        </div>
                        <span className="font-black text-gray-900">{fmtKz(val)}</span>
                      </div>
                    );
                  });
              })()}
              {envios.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Sem envios registados</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Adicionar Familiar ────────────────────────────────────── */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 w-full max-w-lg my-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">{editingMember ? 'Editar Familiar' : 'Adicionar Familiar'}</h2>
              <button onClick={() => setIsMemberModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSaveMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nome Completo *</label>
                  <input type="text" required value={memberForm.nome} onChange={e => setMemberForm({ ...memberForm, nome: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-200" placeholder="Ex: Albertina da Silva" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Parentesco</label>
                  <select value={memberForm.parentesco} onChange={e => setMemberForm({ ...memberForm, parentesco: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none">
                    {PARENTESCOS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Província</label>
                  <select value={memberForm.provincia} onChange={e => setMemberForm({ ...memberForm, provincia: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none">
                    {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mesada (Kz/mês)</label>
                  <input type="number" min="0" value={memberForm.mesada} onChange={e => setMemberForm({ ...memberForm, mesada: e.target.value as any })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none" placeholder="Ex: 50000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Telefone</label>
                  <input type="tel" value={memberForm.telefone} onChange={e => setMemberForm({ ...memberForm, telefone: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none" placeholder="+244 9XX XXX XXX" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Frequência</label>
                  <select value={memberForm.frequencia} onChange={e => setMemberForm({ ...memberForm, frequencia: e.target.value as any })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none">
                    {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prioridade</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(PRIORIDADE_CONFIG) as [FamilyMember['prioridade'], typeof PRIORIDADE_CONFIG['essencial']][]).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setMemberForm({ ...memberForm, prioridade: key })} className={cn('py-3 rounded-2xl text-xs font-black border-2 transition-all flex flex-col items-center gap-1', memberForm.prioridade === key ? cfg.cor + ' border-current' : 'bg-white text-gray-400 border-gray-100')}>
                        <span className="text-xl">{cfg.emoji}</span>
                        <span>{cfg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notas</label>
                  <textarea value={memberForm.notas} onChange={e => setMemberForm({ ...memberForm, notas: e.target.value })} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none resize-none" placeholder="Ex: Vive em Benguela, sustenta 3 netos..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl text-sm hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Heart className="w-4 h-4" />}
                  {editingMember ? 'Actualizar' : 'Guardar Familiar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Registar Envio ─────────────────────────────────────────── */}
      {isEnvioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Registar Envio de Mesada</h2>
              <button onClick={() => setIsEnvioModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSaveEnvio} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Destinatário *</label>
                <select required value={envioForm.membro_id} onChange={e => setEnvioForm({ ...envioForm, membro_id: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none">
                  <option value="">Seleccione um familiar...</option>
                  {membros.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.parentesco} — {m.provincia})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Valor (Kz) *</label>
                  <input type="number" required min="1" value={envioForm.valor} onChange={e => setEnvioForm({ ...envioForm, valor: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none" placeholder="Ex: 50000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Data</label>
                  <input type="date" value={envioForm.data} onChange={e => setEnvioForm({ ...envioForm, data: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Método de Envio</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(METODOS_ENVIO) as [MesadaEnvio['metodo'], typeof METODOS_ENVIO['cash']][]).map(([key, cfg]) => (
                    <button key={key} type="button" onClick={() => setEnvioForm({ ...envioForm, metodo: key })} className={cn('py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all text-left', envioForm.metodo === key ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-400 border-gray-100')}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notas</label>
                <input type="text" value={envioForm.notas} onChange={e => setEnvioForm({ ...envioForm, notas: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none" placeholder="Ex: Referência bancária, código..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEnvioModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl text-sm hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  Confirmar Envio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
