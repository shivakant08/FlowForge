'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, GitCompare, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface LedgerEntry {
  id: string;
  amount: number | string;
  account?: { name: string };
  transaction?: { description: string };
}

interface ReconciliationItem {
  id: string;
  description: string;
  amount: number | string;
  status: 'MATCHED' | 'DISCREPANCY' | 'UNMATCHED';
  matchedEntry?: LedgerEntry | null;
  // Fallbacks in case backend transforms properties:
  bankDescription?: string;
  bankAmount?: number | string;
  ledgerDescription?: string;
  ledgerAmount?: number | string;
}

interface Statement {
  items?: ReconciliationItem[];
}

const formatCurrency = (val?: number | string | null) => {
  if (val === undefined || val === null || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function ReconciliationPage() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading } = useQuery<ReconciliationItem[]>({
    queryKey: ['reconciliation-matches'],
    queryFn: async () => {
      const response = await api.get('/reconciliation/statements');
      const statements = response.data as Statement[];
      return Array.isArray(statements) ? statements.flatMap((statement) => statement.items ?? []) : [];
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('statement', file);

    setUploading(true);
    const toastId = toast.loading('Uploading and processing bank statement...');
    try {
      await api.post('/reconciliation/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-matches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Bank statement imported successfully.', { id: toastId });
    } catch (err) {
      console.error('Failed to upload bank statement', err);
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Unable to import bank statement.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Bank Reconciliation</h1>
          <p className="mt-1 text-slate-400">Match external bank statements against internal double-entry ledgers.</p>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-emerald-500">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span>{uploading ? 'Processing CSV...' : 'Import Statement (CSV)'}</span>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Comparison Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 className="mr-3 h-6 w-6 animate-spin text-emerald-400" />
            Calculating matches...
          </div>
        ) : matches.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <GitCompare className="mx-auto mb-3 h-12 w-12 text-slate-600" />
            <p className="font-medium text-slate-300">No bank statements imported yet</p>
            <p className="mt-1 text-sm text-slate-500">Upload a CSV bank statement to run the automated matching engine.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Bank Record</th>
                <th className="px-6 py-4 text-right">Bank Amount</th>
                <th className="px-6 py-4">Matched Ledger Record</th>
                <th className="px-6 py-4 text-right">Ledger Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {matches.map((item) => {
                // Determine values dynamically based on property availability
                const bankDesc = item.description || item.bankDescription || 'Unlabeled Record';
                const bankAmt = item.amount ?? item.bankAmount;
                const ledgerDesc = item.matchedEntry?.transaction?.description || item.ledgerDescription;
                const ledgerAmt = item.matchedEntry?.amount ?? item.ledgerAmount;

                return (
                  <tr key={item.id} className="transition-colors hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium text-white">{bankDesc}</td>

                    <td className="px-6 py-4 text-right font-mono text-slate-200">
                      {formatCurrency(bankAmt)}
                    </td>

                    <td className="px-6 py-4 text-slate-400">
                      {ledgerDesc || <span className="italic text-slate-600">No match found</span>}
                    </td>

                    <td className="px-6 py-4 text-right font-mono text-slate-200">
                      {formatCurrency(ledgerAmt)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {item.status === 'MATCHED' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Matched
                        </span>
                      )}
                      {item.status === 'DISCREPANCY' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Mismatch
                        </span>
                      )}
                      {item.status === 'UNMATCHED' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Unreconciled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}