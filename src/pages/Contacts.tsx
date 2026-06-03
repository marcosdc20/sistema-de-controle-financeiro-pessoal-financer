import React, { useState, useMemo } from 'react';
import { useFinance, Contact } from '@/context/FinanceContext';
import { CURRENCIES, cn } from '@/lib/utils';
import {
  Users, Plus, X, Phone, Heart, Briefcase, Star,
  MoreVertical, Edit2, Trash2, DollarSign, Send,
  Calendar, CheckCircle2, Clock, AlertCircle, Search,
  User, Wallet, ArrowUpRight
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { ActionMenu } from '@/components/ActionMenu';

export default function Contacts() {
  const {
    contacts, addContact, updateContact, deleteContact, payAllowance,
    accounts, formatCurrency, formatDate, loading
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRelationship, setFilterRelationship] = useState<'all' | Contact['relationship']>('all');
  const [payAccountId, setPayAccountId] = useState('');
  const [payAmount, setPayAmount] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState<Contact['relationship']>('family');
  const [hasAllowance, setHasAllowance] = useState(false);
  const [allowanceAmount, setAllowanceAmount] = useState('');
  const [allowanceDay, setAllowanceDay] = useState('1');
  const [allowanceCurrency, setAllowanceCurrency] = useState('AOA');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName(''); setPhone(''); setRelationship('family');
    setHasAllowance(false); setAllowanceAmount(''); setAllowanceDay('1');
    setAllowanceCurrency('AOA'); setNotes(''); setEditingId(null);
  };

  const openNewModal = () => { resetForm(); setIsModalOpen(true); };

  const openEditModal = (c: Contact) => {
    setEditingId(c.id);
    setName(c.name); setPhone(c.phone || '');
    setRelationship(c.relationship);
    setHasAllowance(c.hasAllowance);
    setAllowanceAmount(c.allowanceAmount?.toString() || '');
    setAllowanceDay(c.allowanceDay?.toString() || '1');
    setAllowanceCurrency(c.allowanceCurrency || 'AOA');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name, phone, relationship, hasAllowance,
      allowanceAmount: Number(allowanceAmount) || 0,
      allowanceDay: Number(allowanceDay) || 1,
      allowanceCurrency, notes
    };
    if (editingId) {
      await updateContact(editingId, data);
    } else {
      await addContact(data);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      deleteContact(id);
    }
  };

  const openPayModal = (c: Contact) => {
    setSelectedContact(c);
    setPayAmount(c.allowanceAmount?.toString() || '');
    setPayAccountId(accounts[0]?.id || '');
    setIsPayModalOpen(true);
  };

  const handlePayAllowance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !payAccountId) return;
    await payAllowance(selectedContact.id, payAccountId, Number(payAmount));
    setIsPayModalOpen(false);
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || '').includes(searchQuery);
      const matchRel = filterRelationship === 'all' || c.relationship === filterRelationship;
      return matchSearch && matchRel;
    });
  }, [contacts, searchQuery, filterRelationship]);

  const stats = useMemo(() => {
    const total = contacts.length;
    const withAllowance = contacts.filter(c => c.hasAllowance).length;
    const monthlyTotal = contacts
      .filter(c => c.hasAllowance)
      .reduce((sum, c) => sum + (c.allowanceAmount || 0), 0);
    return { total, withAllowance, monthlyTotal };
  }, [contacts]);

  const getRelIcon = (rel: Contact['relationship']) => {
    switch (rel) {
      case 'family': return <Heart className="w-4 h-4 text-rose-500" />;
      case 'friend': return <Star className="w-4 h-4 text-amber-500" />;
      case 'business': return <Briefcase className="w-4 h-4 text-indigo-500" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRelLabel = (rel: Contact['relationship']) => {
    const labels = { family: 'Família', friend: 'Amigo(a)', business: 'Negócios', other: 'Outro' };
    return labels[rel] || rel;
  };

  const getRelColor = (rel: Contact['relationship']) => {
    switch (rel) {
      case 'family': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'friend': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'business': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const cardClass = "bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 relative group";

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Contactos & Mesadas</h1>
          <p className="text-gray-500 mt-1">Gerencie os seus contactos e pagamentos de mesadas.</p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Contacto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cn(cardClass, "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-indigo-600 font-medium">Total de Contactos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className={cn(cardClass, "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-600 font-medium">Com Mesada</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withAllowance}</p>
            </div>
          </div>
        </div>
        <div className={cn(cardClass, "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-rose-600 font-medium">Total Mensal (AOA)</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.monthlyTotal, 'AOA')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar contactos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        {(['all', 'family', 'friend', 'business', 'other'] as const).map((rel) => (
          <button
            key={rel}
            onClick={() => setFilterRelationship(rel)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
              filterRelationship === rel
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            {rel === 'all' ? 'Todos' : getRelLabel(rel as Contact['relationship'])}
          </button>
        ))}
      </div>

      {/* Contact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-200" />
            <p className="font-medium text-gray-500">Nenhum contacto encontrado.</p>
            <p className="text-sm mt-1">Adicione o seu primeiro contacto clicando em "Novo Contacto".</p>
          </div>
        )}
        {filteredContacts.map((contact) => (
          <div key={contact.id} className={cardClass}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{contact.name}</p>
                  {contact.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1", getRelColor(contact.relationship))}>
                  {getRelIcon(contact.relationship)}
                  {getRelLabel(contact.relationship)}
                </span>
                <ActionMenu
                  triggerIcon={<MoreVertical className="w-4 h-4" />}
                  triggerClassName="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  items={[
                    { label: 'Editar', icon: <Edit2 className="w-4 h-4" />, onClick: () => openEditModal(contact) },
                    { label: 'Excluir', icon: <Trash2 className="w-4 h-4" />, danger: true, onClick: () => handleDelete(contact.id) },
                  ]}
                />
              </div>
            </div>

            {contact.hasAllowance ? (
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Mesada Mensal
                  </p>
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Dia {contact.allowanceDay}
                  </span>
                </div>
                <p className="text-xl font-bold text-emerald-800">
                  {formatCurrency(contact.allowanceAmount || 0, contact.allowanceCurrency || 'AOA')}
                </p>
                <button
                  onClick={() => openPayModal(contact)}
                  className="mt-3 w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Pagar Mesada Agora
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                <p className="text-xs text-gray-400">Sem mesada configurada</p>
              </div>
            )}

            {contact.notes && (
              <p className="mt-3 text-xs text-gray-500 italic line-clamp-2">"{contact.notes}"</p>
            )}
          </div>
        ))}

        {/* Add Button */}
        <button
          onClick={openNewModal}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600 transition-all min-h-[200px] group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors border border-gray-100">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-medium text-sm">Adicionar Contacto</span>
        </button>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative my-8">
            <button
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">
              {editingId ? 'Editar Contacto' : 'Novo Contacto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                  placeholder="Ex: Ana Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone / WhatsApp</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                  placeholder="Ex: +244 923 456 789"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Relação</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['family', 'friend', 'business', 'other'] as const).map((rel) => (
                    <button
                      key={rel} type="button" onClick={() => setRelationship(rel)}
                      className={cn(
                        "py-2.5 px-4 rounded-xl text-sm font-medium transition-all border flex items-center gap-2",
                        relationship === rel ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {getRelIcon(rel)} {getRelLabel(rel)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox" checked={hasAllowance} onChange={(e) => setHasAllowance(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-emerald-800 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Configurar Mesada Mensal
                  </span>
                </label>

                {hasAllowance && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Valor</label>
                      <input
                        type="number" value={allowanceAmount} onChange={(e) => setAllowanceAmount(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Moeda</label>
                      <select
                        value={allowanceCurrency} onChange={(e) => setAllowanceCurrency(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-gray-900 text-sm"
                      >
                        {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Dia do mês para pagamento (1-31)</label>
                      <input
                        type="number" min="1" max="31" value={allowanceDay} onChange={(e) => setAllowanceDay(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-gray-900 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
                <textarea
                  rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 text-sm resize-none"
                  placeholder="Notas opcionais sobre este contacto..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="flex-1 px-4 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  {editingId ? 'Guardar Alterações' : 'Adicionar Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Allowance Modal */}
      {isPayModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsPayModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
              <Send className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Pagar Mesada</h2>
            <p className="text-gray-500 text-sm mb-6">
              Transferir mesada para <span className="font-bold text-gray-800">{selectedContact.name}</span>
            </p>

            <form onSubmit={handlePayAllowance} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Conta de Origem</label>
                <select
                  value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)} required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                >
                  <option value="">Selecione a conta...</option>
                  {accounts.filter(a => a.status === 'active').map(a => (
                    <option key={a.id} value={a.id}>{a.name} — {formatCurrency(a.balance, a.currency)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Valor</label>
                <input
                  type="number" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setIsPayModalOpen(false)}
                  className="flex-1 px-4 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
