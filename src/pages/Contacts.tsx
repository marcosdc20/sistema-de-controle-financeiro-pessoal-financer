import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Phone, Mail, Building2, Trash2, Edit2, X, Check, User, Banknote, Tag } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { getDatabase } from '@/database/db';

interface Contact {
  id: string;
  name: string;
  type: 'pessoal' | 'empresa' | 'fornecedor' | 'cliente';
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  pessoal:    'bg-blue-50 text-blue-700 border-blue-100',
  empresa:    'bg-purple-50 text-purple-700 border-purple-100',
  fornecedor: 'bg-amber-50 text-amber-700 border-amber-100',
  cliente:    'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const TYPE_LABELS: Record<string, string> = {
  pessoal:    'Pessoal',
  empresa:    'Empresa',
  fornecedor: 'Fornecedor',
  cliente:    'Cliente',
};

const EMPTY_FORM = { name: '', type: 'pessoal' as Contact['type'], email: '', phone: '', company: '', notes: '' };

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadContacts = async () => {
    try {
      const db = await getDatabase();
      // Create table if not exists
      await db.execute(`
        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'pessoal',
          email TEXT,
          phone TEXT,
          company TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const result = await db.select<Contact[]>('SELECT * FROM contacts ORDER BY name ASC');
      setContacts(result);
    } catch (e) {
      console.error('Error loading contacts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContacts(); }, []);

  const openCreate = () => {
    setEditingContact(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditingContact(c);
    setForm({ name: c.name, type: c.type, email: c.email || '', phone: c.phone || '', company: c.company || '', notes: c.notes || '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const db = await getDatabase();
      if (editingContact) {
        await db.execute(
          'UPDATE contacts SET name=$1, type=$2, email=$3, phone=$4, company=$5, notes=$6 WHERE id=$7',
          [form.name.trim(), form.type, form.email || null, form.phone || null, form.company || null, form.notes || null, editingContact.id]
        );
      } else {
        const id = crypto.randomUUID();
        await db.execute(
          'INSERT INTO contacts (id, name, type, email, phone, company, notes) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [id, form.name.trim(), form.type, form.email || null, form.phone || null, form.company || null, form.notes || null]
        );
      }
      await loadContacts();
      setIsModalOpen(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminar o contato "${name}"?`)) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM contacts WHERE id=$1', [id]);
      await loadContacts();
    } catch (e) { console.error(e); }
  };

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.company?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || c.type === filterType;
    return matchSearch && matchType;
  });

  const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  return (
    <PageTransition className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Contatos</h1>
          <p className="text-gray-500 mt-1">Gerencie os seus contactos pessoais e empresariais.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-sm transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Novo Contato
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar contatos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pessoal', 'empresa', 'fornecedor', 'cliente'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold border transition-all',
                filterType === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {t === 'all' ? 'Todos' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(TYPE_LABELS).map(([type, label]) => {
          const count = contacts.filter(c => c.type === type).length;
          return (
            <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Contacts Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum contato encontrado</h3>
          <p className="text-sm text-gray-500 mb-6">
            {search || filterType !== 'all' ? 'Tente ajustar os filtros.' : 'Comece por adicionar o seu primeiro contato.'}
          </p>
          {!search && filterType === 'all' && (
            <button onClick={openCreate} className="px-6 py-2.5 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-colors">
              Adicionar Contato
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {initials(c.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{c.name}</h3>
                    {c.company && <p className="text-xs text-gray-500">{c.company}</p>}
                  </div>
                </div>
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', TYPE_COLORS[c.type])}>
                  {TYPE_LABELS[c.type]}
                </span>
              </div>

              <div className="space-y-2">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-indigo-600 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{c.email}</span>
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-indigo-600 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{c.phone}</span>
                  </a>
                )}
                {c.notes && (
                  <p className="text-[11px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed line-clamp-2">
                    {c.notes}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-semibold text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">
                {editingContact ? 'Editar Contato' : 'Novo Contato'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nome *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900 font-medium"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as Contact['type'] })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900 font-medium"
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none text-gray-900"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Telefone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none text-gray-900"
                    placeholder="+244 9XX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Empresa / Organização</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none text-gray-900"
                  placeholder="Nome da empresa (opcional)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none text-gray-900 resize-none"
                  placeholder="Observações adicionais..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingContact ? 'Atualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
