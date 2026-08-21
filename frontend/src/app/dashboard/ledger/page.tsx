'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '@/lib/api';

interface LedgerEntry {
  id: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  account: string;
  createdAt: string;
}

export default function LedgerPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [account, setAccount] = useState('Assets:Cash');

  const queryClient = useQueryClient();

  // Fetch transactions list
  const { data: entries = [], isLoading } = useQuery<LedgerEntry[]>({
    queryKey: ['ledger-entries'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data;
    },
  });

  // Create new transaction mutation
  const createEntryMutation = useMutation({
    mutationFn: async (newEntry: { description: string; amount: number; type: string; account: string }) => {
      return await api.post('/transactions', newEntry);
    },
    onSuccess: () => {
      // Refresh ledger list and overview summary instantly
      queryClient.invalidateQueries({ queryKey: ['ledger-entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setType('DEBIT');
    setAccount('Assets:Cash');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEntryMutation.mutate({
      description,
      amount: parseFloat(amount),
      type,
      account,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Ledger Entries</h1>
          <p className="text-slate-400 mt-1">Record and inspect double-entry financial records.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Transaction
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mr-3" />
            Loading entries...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <Receipt className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-medium text-slate-300">No ledger entries recorded yet</p>
            <p className="text-sm text-slate-500 mt-1">Click "New Transaction" above to create your first entry.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {entries.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{item.description}</td>
                  <td className="px-6 py-4 text-slate-400">{item.account}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.type === 'DEBIT'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {item.type === 'DEBIT' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                    ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Post Transaction</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Client Payment Deposit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1500.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Entry Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'DEBIT' | 'CREDIT')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="DEBIT">Debit (Asset/Expense)</option>
                    <option value="CREDIT">Credit (Liability/Revenue)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Account Category</label>
                  <select
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Assets:Cash">Assets: Cash</option>
                    <option value="Liabilities:Payable">Liabilities: Payable</option>
                    <option value="Revenue:Services">Revenue: Services</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEntryMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {createEntryMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}