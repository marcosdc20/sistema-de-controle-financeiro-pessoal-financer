import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCIES = {
  AOA: { symbol: "Kz", name: "Kwanza", rate: 1 },
  USD: { symbol: "$", name: "US Dollar", rate: 900 }, // Example rate
  EUR: { symbol: "€", name: "Euro", rate: 980 },     // Example rate
  ZAR: { symbol: "R", name: "Rand", rate: 50 },      // Example rate
};

export const ACCOUNTS = [
  { id: "1", name: "Carteira Física", type: "cash", category: "physical", currency: "AOA", balance: 15000, status: "active", color: "bg-emerald-500", isMain: false, hideFromTotal: false },
  { id: "2", name: "BAI", type: "checking", category: "bank", currency: "AOA", balance: 450000, status: "active", color: "bg-blue-600", isMain: true, hideFromTotal: false },
  { id: "3", name: "Unitel Money", type: "mobile", category: "digital", currency: "AOA", balance: 5000, status: "active", color: "bg-orange-500", isMain: false, hideFromTotal: false },
  { id: "4", name: "Wise USD", type: "checking", category: "bank", currency: "USD", balance: 120, status: "active", color: "bg-green-500", isMain: false, hideFromTotal: false },
];

export const CATEGORIES = {
  income: ["Salário", "Comissão", "Venda", "Freelance", "Dividendos", "Investimentos", "Outros"],
  expense: ["Fixa", "Variável", "Supérflua", "Dívida", "Parcela", "Alimentação", "Transporte", "Casa", "Educação", "Lazer", "Saúde", "Outros"],
  transfer: ["Entre contas próprias", "Conversão de moeda"],
  adjustment: ["Correção manual de saldo", "Ajuste bancário", "Outros"]
};
