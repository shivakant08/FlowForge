'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, GitCompare, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface ReconciliationMatch {
  id: string;
  bankDescription: string;
  bankAmount: number;
  ledgerDescription?: string;
  ledgerAmount?: number;
  status: 'MATCHED' | 'DISCREPANCY' | 'UNMATCHED';
}

export default function ReconciliationPage() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch reconciliation status / matching results from Express backend
  const { data: matches = [], isLoading } = useQuery<ReconciliationMatch[]>({
    queryKey: ['reconciliation-matches'],
    queryFn: async () => {
      const response = await api.get('/reconciliation');
      return response.data;
    },
  });

  // Handle CSV file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('statement', file);

    setUploading(true);
    try {
      await api.post('/reconciliation/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-matches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    } catch (err) {
      console.error('Failed to upload bank statement', err);
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
          <p className="text-slate-400 mt-1">Match external bank statements against internal double-entry ledgers.</p>
        </div>

        <label className="cursor-pointer flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          <span>{uploading ? 'Processing CSV...' : 'Import Statement (CSV)'}</span>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mr-3" />
            Calculating matches...
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <GitCompare className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-medium text-slate-300">No bank statements imported yet</p>
            <p className="text-sm text-slate-500 mt-1">Upload a CSV bank statement to run the automated matching engine.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Bank Record</th>
                <th className="px-6 py-4 text-right">Bank Amount</th>
                <th className="px-6 py-4">Matched Ledger Record</th>
                <th className="px-6 py-4 text-right">Ledger Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {matches.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{item.bankDescription}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-200">
                    ${item.bankAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {item.ledgerDescription || <span className="text-slate-600 italic">No match found</span>}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-200">
                    {item.ledgerAmount ? `$${item.ledgerAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.status === 'MATCHED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Matched
                      </span>
                    )}
                    {item.status === 'DISCREPANCY' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Mismatch
                      </span>
                    )}
                    {item.status === 'UNMATCHED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Unreconciled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}