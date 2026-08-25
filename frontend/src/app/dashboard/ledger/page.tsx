'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Loader2, ArrowUpRight, ArrowDownRight, Check, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface TransactionEntry {
  id: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number | string;
  account: { name: string };
}

interface TransactionRecord {
  id: string;
  description: string;
  amount: number | string;
  status: 'PENDING_APPROVAL' | 'COMPLETED' | 'REJECTED' | string;
  ledgerEntries: TransactionEntry[];
  pendingEntries?: unknown;
  createdAt: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

export default function LedgerPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [debitAccountId, setDebitAccountId] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canApprove = user?.role === 'ORG_ADMIN' || user?.role === 'HEAD_ACCOUNTANT';

  const { data: accounts = [], isLoading: areAccountsLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/accounts');
      return response.data;
    },
  });

  // Fetch transactions list
  const { data: entries = [], isLoading } = useQuery<TransactionRecord[]>({
    queryKey: ['ledger-entries'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      return api.post(`/transactions/${id}/${action}`, action === 'approve' ? {} : undefined);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ledger-entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-reports'] });
      toast.success(variables.action === 'approve' ? 'Transaction approved.' : 'Transaction rejected.');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Unable to update transaction.'),
  });

  // Create new transaction mutation
  const createEntryMutation = useMutation({
    mutationFn: async (newEntry: {
      description: string;
      currency: string;
      entries: Array<{ accountId: string; entryType: 'DEBIT' | 'CREDIT'; amount: number }>;
    }) => {
      return await api.post('/transactions', newEntry);
    },
    onSuccess: () => {
      // Refresh ledger list and overview summary instantly
      queryClient.invalidateQueries({ queryKey: ['ledger-entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsOpen(false);
      resetForm();
      toast.success('Transaction created successfully.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Unable to create transaction.');
    },
  });

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDebitAccountId('');
    setCreditAccountId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionAmount = Number(amount);

    createEntryMutation.mutate({
      description,
      currency: 'INR',
      entries: [
        { accountId: debitAccountId, entryType: 'DEBIT', amount: transactionAmount },
        { accountId: creditAccountId, entryType: 'CREDIT', amount: transactionAmount },
      ],
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
                <th className="px-6 py-4">Accounts</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {entries.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{item.description}</td>
                  <td className="px-6 py-4 text-slate-400">{item.ledgerEntries?.map((entry) => entry.account.name).join(' / ') || 'Pending review'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'PENDING_APPROVAL' ? 'border border-amber-500/20 bg-amber-500/10 text-amber-400' : item.status === 'COMPLETED' ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border border-rose-500/20 bg-rose-500/10 text-rose-400'}`}
                    >
                      {item.status === 'PENDING_APPROVAL' ? 'Pending approval' : item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                    ${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canApprove && item.status === 'PENDING_APPROVAL' && <span className="inline-flex gap-2"><button title="Approve transaction" onClick={() => reviewMutation.mutate({ id: item.id, action: 'approve' })} disabled={reviewMutation.isPending} className="rounded-md p-1.5 text-emerald-400 hover:bg-emerald-500/10"><Check className="h-4 w-4" /></button><button title="Reject transaction" onClick={() => reviewMutation.mutate({ id: item.id, action: 'reject' })} disabled={reviewMutation.isPending} className="rounded-md p-1.5 text-rose-400 hover:bg-rose-500/10"><X className="h-4 w-4" /></button></span>}
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

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Debit Account</label>
                <select
                  required
                  value={debitAccountId}
                  onChange={(e) => setDebitAccountId(e.target.value)}
                  disabled={areAccountsLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select debit account</option>
                  {accounts.map((accountOption) => (
                    <option key={accountOption.id} value={accountOption.id}>
                      {accountOption.name} ({accountOption.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Credit Account</label>
                <select
                  required
                  value={creditAccountId}
                  onChange={(e) => setCreditAccountId(e.target.value)}
                  disabled={areAccountsLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select credit account</option>
                  {accounts.map((accountOption) => (
                    <option key={accountOption.id} value={accountOption.id}>
                      {accountOption.name} ({accountOption.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-medium text-slate-400 uppercase mb-1">Debit</span>
                  <p className="text-sm text-emerald-400">{amount || '0.00'}</p>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400 uppercase mb-1">Credit</span>
                  <p className="text-sm text-rose-400">{amount || '0.00'}</p>
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