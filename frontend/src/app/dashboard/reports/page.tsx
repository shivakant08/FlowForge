'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, CheckCircle2, Loader2, RefreshCw, Scale, TrendingUp, WalletCards } from 'lucide-react';
import api from '@/lib/api';

interface ReportLine {
  id: string;
  name: string;
  balance: number;
  debit?: number;
  credit?: number;
}

interface Reports {
  generatedAt: string;
  balanceSheet: {
    assets: ReportLine[];
    liabilities: ReportLine[];
    equity: ReportLine[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };
  profitAndLoss: {
    revenue: ReportLine[];
    expenses: ReportLine[];
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
  trialBalance: {
    lines: ReportLine[];
    totalDebits: number;
    totalCredits: number;
  };
}

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function AccountRows({ lines }: { lines: ReportLine[] }) {
  if (lines.length === 0) {
    return <p className="px-4 py-4 text-sm text-slate-500">No accounts recorded.</p>;
  }

    return (
    <div className="divide-y divide-slate-800/70">
      {lines.map((line) => (
        <div key={line.id} className="group flex items-center justify-between px-1 py-3 text-sm transition-colors hover:bg-slate-800/20">
          <span className="text-slate-300">{line.name}</span>
          <span className="font-mono text-slate-100 transition-colors group-hover:text-emerald-300">{formatCurrency(line.balance)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { data, isLoading, isError, refetch } = useQuery<Reports>({
    queryKey: ['financial-reports'],
    queryFn: async () => (await api.get('/reports')).data,
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="mr-3 h-6 w-6 animate-spin text-emerald-400" />Loading financial reports...</div>;
  }

  if (isError || !data) {
    return <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400"><p>Unable to load financial reports.</p><button onClick={() => refetch()} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"><RefreshCw className="h-4 w-4" />Retry</button></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10"><BarChart3 className="h-6 w-6 text-emerald-400" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Finance workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Financial Reports</h1></div></div>
          <p className="mt-3 text-slate-400">A clear view of your organization&apos;s financial position.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-400" />Updated {new Date(data.generatedAt).toLocaleString()}</div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-800/70 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-slate-900/95 p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total assets</span><WalletCards className="h-5 w-5 text-emerald-400" /></div><p className="mt-4 text-2xl font-semibold tracking-tight text-white">{formatCurrency(data.balanceSheet.totalAssets)}</p><p className="mt-1 text-xs text-slate-500">Resources owned</p></div>
        <div className="bg-slate-900/95 p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net income</span><TrendingUp className="h-5 w-5 text-sky-400" /></div><p className={`mt-4 text-2xl font-semibold tracking-tight ${data.profitAndLoss.netIncome >= 0 ? 'text-white' : 'text-rose-400'}`}>{formatCurrency(data.profitAndLoss.netIncome)}</p><p className="mt-1 text-xs text-slate-500">Revenue less expenses</p></div>
        <div className="bg-slate-900/95 p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Liabilities</span><Scale className="h-5 w-5 text-amber-400" /></div><p className="mt-4 text-2xl font-semibold tracking-tight text-white">{formatCurrency(data.balanceSheet.totalLiabilities)}</p><p className="mt-1 text-xs text-slate-500">Obligations outstanding</p></div>
        <div className="bg-emerald-400/[0.06] p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Trial balance</span><CheckCircle2 className="h-5 w-5 text-emerald-400" /></div><p className="mt-4 text-2xl font-semibold tracking-tight text-white">{formatCurrency(data.trialBalance.totalDebits)}</p><p className="mt-1 text-xs text-emerald-300/70">Debits and credits balanced</p></div>
      </div>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-[0_16px_45px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">Position</p><h2 className="mt-1 text-xl font-semibold text-white">Balance Sheet</h2></div><span className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 text-xs text-slate-400">As of today</span></div>
        <div className="grid gap-6 p-5 lg:grid-cols-3">
          <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Assets</h3><AccountRows lines={data.balanceSheet.assets} /><p className="mt-3 text-right font-semibold text-white">Total {formatCurrency(data.balanceSheet.totalAssets)}</p></div>
          <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">Liabilities</h3><AccountRows lines={data.balanceSheet.liabilities} /><p className="mt-3 text-right font-semibold text-white">Total {formatCurrency(data.balanceSheet.totalLiabilities)}</p></div>
          <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-400">Equity</h3><AccountRows lines={data.balanceSheet.equity} /><p className="mt-3 text-right font-semibold text-white">Total {formatCurrency(data.balanceSheet.totalEquity)}</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-[0_16px_45px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-400">Performance</p><h2 className="mt-1 text-xl font-semibold text-white">Income Statement</h2></div><span className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 text-xs text-slate-400">Current period</span></div>
        <div className="grid gap-6 p-5 md:grid-cols-2">
          <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Revenue</h3><AccountRows lines={data.profitAndLoss.revenue} /><p className="mt-3 text-right font-semibold text-white">Total {formatCurrency(data.profitAndLoss.totalRevenue)}</p></div>
          <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-400">Expenses</h3><AccountRows lines={data.profitAndLoss.expenses} /><p className="mt-3 text-right font-semibold text-white">Total {formatCurrency(data.profitAndLoss.totalExpenses)}</p></div>
        </div>
        <div className="border-t border-slate-800 px-5 py-4 text-right font-bold text-white">Net Income {formatCurrency(data.profitAndLoss.netIncome)}</div>
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-[0_16px_45px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">Verification</p><h2 className="mt-1 text-xl font-semibold text-white">Trial Balance</h2></div><span className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="h-4 w-4" />Balanced</span></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Account</th><th className="px-5 py-3 text-right">Debit</th><th className="px-5 py-3 text-right">Credit</th></tr></thead><tbody className="divide-y divide-slate-800">{data.trialBalance.lines.map((line) => <tr key={line.id}><td className="px-5 py-3 text-slate-300">{line.name}</td><td className="px-5 py-3 text-right font-mono text-slate-100">{formatCurrency(line.debit ?? 0)}</td><td className="px-5 py-3 text-right font-mono text-slate-100">{formatCurrency(line.credit ?? 0)}</td></tr>)}</tbody><tfoot className="border-t border-slate-700 font-semibold text-white"><tr><td className="px-5 py-3">Totals</td><td className="px-5 py-3 text-right font-mono">{formatCurrency(data.trialBalance.totalDebits)}</td><td className="px-5 py-3 text-right font-mono">{formatCurrency(data.trialBalance.totalCredits)}</td></tr></tfoot></table></div>
      </section>
    </div>
  );
}