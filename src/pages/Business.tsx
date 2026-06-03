import React, { useState, useRef } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { CURRENCIES, cn } from '@/lib/utils';
import {
  Briefcase, Calculator, FileText, Download, Plus, X, Trash2,
  TrendingUp, TrendingDown, DollarSign, Percent, ChevronDown,
  ChevronUp, Package, User, Phone, Mail, MapPin, Building2,
  CheckCircle2, Clock, AlertCircle, Printer, ArrowRight,
  BarChart2, PieChart, Wallet, Hash
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';

// --- Invoice / Receipt Types ---
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface InvoiceData {
  type: 'invoice' | 'receipt' | 'quote';
  number: string;
  date: string;
  dueDate: string;
  currency: string;
  // Sender
  senderName: string;
  senderNif: string;
  senderPhone: string;
  senderEmail: string;
  senderAddress: string;
  // Client
  clientName: string;
  clientNif: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  // Items
  items: InvoiceItem[];
  notes: string;
  iva: number; // %
  includeTax: boolean;
}

// --- Business Simulator Types ---
interface SimulatorResult {
  revenue: number;
  costs: number;
  grossProfit: number;
  grossMargin: number;
  tax: number;
  netProfit: number;
  netMargin: number;
  breakEven: number;
}

const defaultInvoice: InvoiceData = {
  type: 'invoice',
  number: `FT-${new Date().getFullYear()}-001`,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  currency: 'AOA',
  senderName: '', senderNif: '', senderPhone: '', senderEmail: '', senderAddress: '',
  clientName: '', clientNif: '', clientPhone: '', clientEmail: '', clientAddress: '',
  items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, discount: 0 }],
  notes: '',
  iva: 14,
  includeTax: true,
};

export default function Business() {
  const { formatCurrency, preferences } = useFinance();
  const [activeTab, setActiveTab] = useState<'invoice' | 'simulator'>('invoice');
  const [invoice, setInvoice] = useState<InvoiceData>(defaultInvoice);
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Simulator state
  const [revenue, setRevenue] = useState('');
  const [fixedCosts, setFixedCosts] = useState('');
  const [variableCosts, setVariableCosts] = useState('');
  const [taxRate, setTaxRate] = useState('25');
  const [simResult, setSimResult] = useState<SimulatorResult | null>(null);

  // --- Invoice Helpers ---
  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, discount: 0 }]
    }));
  };

  const removeItem = (id: string) => {
    setInvoice(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const getItemTotal = (item: InvoiceItem) => {
    const gross = item.quantity * item.unitPrice;
    return gross - (gross * item.discount / 100);
  };

  const subtotal = invoice.items.reduce((sum, i) => sum + getItemTotal(i), 0);
  const ivaAmount = invoice.includeTax ? (subtotal * invoice.iva / 100) : 0;
  const total = subtotal + ivaAmount;

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${invoice.type === 'invoice' ? 'Fatura' : invoice.type === 'receipt' ? 'Recibo' : 'Proposta'} ${invoice.number}</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f9fafb; padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
        td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
        .header { border-bottom: 2px solid #4f46e5; padding-bottom: 24px; margin-bottom: 24px; }
        .total-row { font-weight: bold; background: #4f46e5; color: white; }
        .total-row td { padding: 12px; }
      </style>
      </head><body>${printContent}</body></html>
    `);
    win.document.close();
    win.print();
  };

  // --- Simulator ---
  const calculateSimulation = () => {
    const rev = Number(revenue) || 0;
    const fixed = Number(fixedCosts) || 0;
    const variable = Number(variableCosts) || 0;
    const tax = Number(taxRate) || 0;

    const costs = fixed + variable;
    const grossProfit = rev - costs;
    const grossMargin = rev > 0 ? (grossProfit / rev) * 100 : 0;
    const taxAmount = grossProfit > 0 ? (grossProfit * tax / 100) : 0;
    const netProfit = grossProfit - taxAmount;
    const netMargin = rev > 0 ? (netProfit / rev) * 100 : 0;
    const breakEven = variable > 0 ? fixed / (1 - (variable / rev)) : fixed;

    setSimResult({ revenue: rev, costs, grossProfit, grossMargin, tax: taxAmount, netProfit, netMargin, breakEven });
  };

  const cardClass = "bg-white rounded-2xl border border-gray-100 shadow-sm p-6";

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </span>
            Área de Negócios
          </h1>
          <p className="text-gray-500 mt-1">Gere faturas, recibos e simule o desempenho do seu negócio.</p>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('invoice')}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'invoice' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <FileText className="w-4 h-4" /> Faturas & Recibos
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'simulator' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Calculator className="w-4 h-4" /> Simulador de Negócios
        </button>
      </div>

      {/* ========== INVOICE TAB ========== */}
      {activeTab === 'invoice' && (
        <div className="space-y-6">
          {/* Document Type */}
          <div className={cardClass}>
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Tipo de Documento</h3>
            <div className="flex gap-2">
              {(['invoice', 'receipt', 'quote'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setInvoice(p => ({ ...p, type: t }))}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                    invoice.type === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {t === 'invoice' ? 'Fatura' : t === 'receipt' ? 'Recibo' : 'Proposta/Orçamento'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Details */}
            <div className={cardClass}>
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" />
                Dados do Documento
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Número</label>
                  <input
                    value={invoice.number} onChange={(e) => setInvoice(p => ({ ...p, number: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Moeda</label>
                  <select
                    value={invoice.currency} onChange={(e) => setInvoice(p => ({ ...p, currency: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none text-gray-900"
                  >
                    {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Data de Emissão</label>
                  <input
                    type="date" value={invoice.date} onChange={(e) => setInvoice(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Data de Vencimento</label>
                  <input
                    type="date" value={invoice.dueDate} onChange={(e) => setInvoice(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* IVA */}
            <div className={cardClass}>
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-500" />
                Impostos (IVA)
              </h3>
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox" checked={invoice.includeTax}
                  onChange={(e) => setInvoice(p => ({ ...p, includeTax: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-gray-700">Incluir IVA no documento</span>
              </label>
              {invoice.includeTax && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Taxa IVA (%)</label>
                  <input
                    type="number" value={invoice.iva}
                    onChange={(e) => setInvoice(p => ({ ...p, iva: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none text-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-1">IVA padrão em Angola: 14%</p>
                </div>
              )}
            </div>
          </div>

          {/* Sender + Client */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sender */}
            <div className={cardClass}>
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                Dados do Emitente (Você)
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Nome / Empresa', key: 'senderName', placeholder: 'Ex: João Silva ou Lda. XYZ', icon: User },
                  { label: 'NIF', key: 'senderNif', placeholder: 'Ex: 0012345678LA043', icon: Hash },
                  { label: 'Telefone', key: 'senderPhone', placeholder: '+244 923...', icon: Phone },
                  { label: 'Email', key: 'senderEmail', placeholder: 'email@exemplo.com', icon: Mail },
                  { label: 'Endereço', key: 'senderAddress', placeholder: 'Rua, Município, Luanda', icon: MapPin },
                ].map(({ label, key, placeholder, icon: Icon }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        value={(invoice as any)[key]}
                        onChange={(e) => setInvoice(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client */}
            <div className={cardClass}>
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500" />
                Dados do Cliente
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Nome / Empresa', key: 'clientName', placeholder: 'Ex: Maria Antónia', icon: User },
                  { label: 'NIF', key: 'clientNif', placeholder: 'Ex: 0087654321LA043', icon: Hash },
                  { label: 'Telefone', key: 'clientPhone', placeholder: '+244 912...', icon: Phone },
                  { label: 'Email', key: 'clientEmail', placeholder: 'cliente@exemplo.com', icon: Mail },
                  { label: 'Endereço', key: 'clientAddress', placeholder: 'Bairro, Município', icon: MapPin },
                ].map(({ label, key, placeholder, icon: Icon }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        value={(invoice as any)[key]}
                        onChange={(e) => setInvoice(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-500" />
                Itens / Serviços
              </h3>
              <button
                onClick={addItem}
                className="text-sm text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Adicionar item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                    <th className="py-2 text-left">Descrição</th>
                    <th className="py-2 text-right px-3 w-20">Qtd.</th>
                    <th className="py-2 text-right px-3 w-32">Preço Unit.</th>
                    <th className="py-2 text-right px-3 w-24">Desc. (%)</th>
                    <th className="py-2 text-right px-3 w-32">Total</th>
                    <th className="py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-2">
                        <input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Ex: Consultoria, Produto..."
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number" min="1" value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number" min="0" value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number" min="0" max="100" value={item.discount}
                          onChange={(e) => updateItem(item.id, 'discount', Number(e.target.value))}
                          className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-gray-900">
                        {formatCurrency(getItemTotal(item), invoice.currency)}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal, invoice.currency)}</span>
                </div>
                {invoice.includeTax && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>IVA ({invoice.iva}%)</span>
                    <span className="font-semibold">{formatCurrency(ivaAmount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
                  <span>TOTAL</span>
                  <span className="text-indigo-600">{formatCurrency(total, invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className={cardClass}>
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Notas / Observações</h3>
            <textarea
              rows={3} value={invoice.notes}
              onChange={(e) => setInvoice(p => ({ ...p, notes: e.target.value }))}
              placeholder="Ex: Pagamento a 30 dias. IBAN: AO06 0040 0000 1234 5678 9015 5"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900"
            />
          </div>

          {/* Print-ready invoice (hidden area) */}
          <div ref={printRef} className="hidden">
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#4f46e5' }}>
                  {invoice.type === 'invoice' ? 'FATURA' : invoice.type === 'receipt' ? 'RECIBO' : 'PROPOSTA'}
                </h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Nº {invoice.number}</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', color: '#374151' }}>
                <p><strong>{invoice.senderName}</strong></p>
                <p>NIF: {invoice.senderNif}</p>
                <p>{invoice.senderPhone}</p>
                <p>{invoice.senderEmail}</p>
                <p>{invoice.senderAddress}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', marginBottom: '8px' }}>FATURAR A</p>
                <p style={{ fontWeight: 'bold', color: '#111827' }}>{invoice.clientName}</p>
                <p style={{ fontSize: '13px', color: '#4b5563' }}>NIF: {invoice.clientNif}</p>
                <p style={{ fontSize: '13px', color: '#4b5563' }}>{invoice.clientPhone}</p>
                <p style={{ fontSize: '13px', color: '#4b5563' }}>{invoice.clientAddress}</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', marginBottom: '8px' }}>DATAS</p>
                <p style={{ fontSize: '13px', color: '#4b5563' }}>Emissão: <strong>{invoice.date}</strong></p>
                <p style={{ fontSize: '13px', color: '#4b5563' }}>Vencimento: <strong>{invoice.dueDate}</strong></p>
                <p style={{ fontSize: '13px', color: '#4b5563' }}>Moeda: <strong>{invoice.currency}</strong></p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th style={{ textAlign: 'right', width: '80px' }}>Qtd.</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Preço Unit.</th>
                  <th style={{ textAlign: 'right', width: '80px' }}>Desc.</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td style={{ textAlign: 'right' }}>{item.discount}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(getItemTotal(item), invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px 12px', background: '#f9fafb' }}>Subtotal</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px 12px', background: '#f9fafb' }}>{formatCurrency(subtotal, invoice.currency)}</td>
                </tr>
                {invoice.includeTax && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px 12px', background: '#f9fafb' }}>IVA ({invoice.iva}%)</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px 12px', background: '#f9fafb' }}>{formatCurrency(ivaAmount, invoice.currency)}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold', background: '#4f46e5', color: 'white', padding: '12px' }}>TOTAL A PAGAR</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#4f46e5', color: 'white', padding: '12px', fontSize: '16px' }}>{formatCurrency(total, invoice.currency)}</td>
                </tr>
              </tfoot>
            </table>

            {invoice.notes && (
              <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #4f46e5' }}>
                <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', marginBottom: '4px' }}>NOTAS</p>
                <p style={{ fontSize: '13px', color: '#4b5563' }}>{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar PDF
            </button>
            <button
              onClick={() => setInvoice(defaultInvoice)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* ========== SIMULATOR TAB ========== */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className={cardClass}>
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-500" />
                Dados do Negócio
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Receita Total Prevista (AOA)
                  </label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input
                      type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)}
                      placeholder="Ex: 500000"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Custos Fixos Mensais (AOA)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number" value={fixedCosts} onChange={(e) => setFixedCosts(e.target.value)}
                      placeholder="Ex: Renda, Salários, Seguros..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Ex: aluguer, salários, seguros, licenças</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Custos Variáveis (AOA)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <input
                      type="number" value={variableCosts} onChange={(e) => setVariableCosts(e.target.value)}
                      placeholder="Ex: Matéria-prima, comissões..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Ex: materiais, transporte, comissões</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Taxa de Imposto Estimada (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                    <input
                      type="number" min="0" max="100" value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">IRT Angola: 25% para pessoas coletivas</p>
                </div>

                <button
                  onClick={calculateSimulation}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Calculator className="w-4 h-4" />
                  Simular Resultados
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {simResult ? (
                <>
                  <div className={cn(cardClass, "border-l-4", simResult.netProfit >= 0 ? "border-l-emerald-500" : "border-l-red-500")}>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-indigo-500" />
                      Resultado da Simulação
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                        <span className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> Receita Total
                        </span>
                        <span className="font-bold text-emerald-800">{formatCurrency(simResult.revenue, 'AOA')}</span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                        <span className="text-sm font-semibold text-red-700 flex items-center gap-2">
                          <TrendingDown className="w-4 h-4" /> Custos Totais
                        </span>
                        <span className="font-bold text-red-800">{formatCurrency(simResult.costs, 'AOA')}</span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                        <span className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                          <BarChart2 className="w-4 h-4" /> Lucro Bruto
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-blue-800 block">{formatCurrency(simResult.grossProfit, 'AOA')}</span>
                          <span className="text-xs text-blue-600">Margem: {simResult.grossMargin.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
                        <span className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                          <Percent className="w-4 h-4" /> Impostos ({taxRate}%)
                        </span>
                        <span className="font-bold text-amber-800">{formatCurrency(simResult.tax, 'AOA')}</span>
                      </div>

                      <div className={cn(
                        "flex justify-between items-center p-4 rounded-xl border-2",
                        simResult.netProfit >= 0
                          ? "bg-emerald-100 border-emerald-300"
                          : "bg-red-100 border-red-300"
                      )}>
                        <span className={cn("text-base font-bold flex items-center gap-2", simResult.netProfit >= 0 ? "text-emerald-800" : "text-red-800")}>
                          {simResult.netProfit >= 0 ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                          Lucro Líquido
                        </span>
                        <div className="text-right">
                          <span className={cn("text-lg font-black block", simResult.netProfit >= 0 ? "text-emerald-900" : "text-red-900")}>
                            {formatCurrency(simResult.netProfit, 'AOA')}
                          </span>
                          <span className={cn("text-xs font-semibold", simResult.netProfit >= 0 ? "text-emerald-700" : "text-red-700")}>
                            Margem: {simResult.netMargin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-indigo-500" />
                      Ponto de Equilíbrio (Break-Even)
                    </h4>
                    <p className="text-2xl font-black text-indigo-600 mb-1">{formatCurrency(simResult.breakEven, 'AOA')}</p>
                    <p className="text-sm text-gray-500">
                      Precisa de faturar pelo menos este valor para cobrir todos os custos e não ter prejuízo.
                    </p>
                  </div>

                  <div className={cn(cardClass, "border border-indigo-100 bg-indigo-50")}>
                    <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Conselho VukaPay
                    </h4>
                    <p className="text-sm text-indigo-700 leading-relaxed">
                      {simResult.netMargin > 20
                        ? '✅ O seu negócio tem uma margem saudável! Considere reinvestir parte dos lucros em expansão ou poupança.'
                        : simResult.netMargin > 0
                        ? '⚠️ A margem está razoável. Procure reduzir custos variáveis ou aumentar o preço médio por cliente.'
                        : '❌ O negócio está em prejuízo. Reveja a sua estrutura de custos urgentemente. Considere apoio de um consultor financeiro.'}
                    </p>
                  </div>
                </>
              ) : (
                <div className={cn(cardClass, "flex flex-col items-center justify-center py-16 text-center")}>
                  <Calculator className="w-16 h-16 text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium">Preencha os dados e clique em</p>
                  <p className="text-gray-700 font-bold">"Simular Resultados"</p>
                  <p className="text-gray-400 text-sm mt-2">para ver a análise do seu negócio</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
