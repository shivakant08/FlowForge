"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, Loader2 } from "lucide-react"
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import api from "@/lib/api"

interface DashboardMetrics{
    totalAssets:number;
    totalLiabilities: number;
    unreconciledCount: number;
}

interface MonthlyAnalytics {
    month: string;
    income: number;
    expenses: number;
    netCashFlow: number;
}

const chartTooltipStyle = {
    backgroundColor: "#111827",
    border: "1px solid #334155",
    borderRadius: "12px",
    color: "#f8fafc",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.28)",
}

const monthLabel = (value: string) => {
    const [year, month] = value.split("-")
    return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", { month: "short" })
}

export default function DashboardOverview() {
    const { data, isLoading } = useQuery<DashboardMetrics>({
        queryKey:["dashboard-summary"],
        queryFn: async () => {
            const [cashFlowResponse, transactionsResponse, statementsResponse] = await Promise.all([
                api.get("/analytics/cash-flow"),
                api.get("/transactions"),
                api.get("/reconciliation/statements"),
            ])

            const cashFlow = cashFlowResponse.data?.summary ?? {}
            const transactions = Array.isArray(transactionsResponse.data) ? transactionsResponse.data : []
            const statements = Array.isArray(statementsResponse.data) ? statementsResponse.data : []

            const totalAssets = Number(cashFlow.totalInflow ?? 0)
            const totalLiabilities = Number(cashFlow.totalOutFlow ?? 0)
            const unreconciledCount = statements.filter((statement: any) => statement.status !== "MATCHED").length
                + transactions.filter((transaction: any) => transaction.status !== "COMPLETED").length

            return {
                totalAssets,
                totalLiabilities,
                unreconciledCount,
            }
        }
    })

        const { data: monthlyAnalytics = [], isLoading: isAnalyticsLoading } = useQuery<MonthlyAnalytics[]>({
            queryKey: ["monthly-analytics"],
            queryFn: async () => (await api.get("/analytics/monthly")).data,
        })

    if(isLoading){
        return(
            <div className="flex items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="ml-3">Loading ledger metrics...</span>
            </div>
        )
    }

    const metrics = data || {
        totalAssets:0,
        totalLiabilities:0,
        unreconciledCount:0,
    }


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Financial Dashboard</h1>
                <p className="text-slate-400 mt-1">Real-time ledger overview and system activity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">Total Assets</span>
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <DollarSign className="w-5 h-5" />
                        </div>

                    </div>

                    <div className="mt-4">
                        <span className="text-3xl font-bold text-white">${metrics.totalAssets.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                        <div className="flex items-center gap-1 text-xs text-green-400 mt-2">
                            <ArrowUpRight className="w-4 h-4" />
                            <span>Live balance</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">
                            Total Liabilities
                        </span>
                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                            <ArrowDownRight className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="mt-4">
                        <span className="text-3xl font-bold text-white"> ${metrics.totalLiabilities.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                        <div className="flex items-center gap-1 text-xs text-rose-400 mt-2">
                            <ArrowDownRight className=" w-4 h-4" />
                            <span>Live Balance</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">Unreconcilied Items</span>
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="mt-4">
                        <span className="text-3xl font-bold text-white">${metrics.unreconciledCount} Transactions</span>
                        <div className="text-xs text-slate-400 mt-2">Requires review</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-[0_16px_45px_rgba(0,0,0,0.14)]">
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Performance</p>
                            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Income vs. Expenses</h2>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Income</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />Expenses</span></div>
                    </div>
                    <div className="h-72">
                        {isAnalyticsLoading ? <div className="flex h-full items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading chart...</div> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyAnalytics} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity={0.28} /><stop offset="100%" stopColor="#34d399" stopOpacity={0} /></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb7185" stopOpacity={0.2} /><stop offset="100%" stopColor="#fb7185" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="4 8" /><XAxis dataKey="month" tickFormatter={monthLabel} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} /><Tooltip contentStyle={chartTooltipStyle} labelFormatter={(value) => monthLabel(String(value))} formatter={(value: unknown) => [`$${Number(value ?? 0).toLocaleString()}`, ""]} /><Area type="monotone" dataKey="income" name="Income" stroke="#34d399" strokeWidth={2.5} fill="url(#incomeFill)" dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: '#111827' }} /><Area type="monotone" dataKey="expenses" name="Expenses" stroke="#fb7185" strokeWidth={2.5} fill="url(#expenseFill)" dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: '#111827' }} /></AreaChart></ResponsiveContainer>}
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-[0_16px_45px_rgba(0,0,0,0.14)]">
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Liquidity</p>
                            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Cash Flow Trend</h2>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-300"><span className="h-1.5 w-1.5 rounded-full bg-sky-300" />12 months</div>
                    </div>
                    <div className="h-72">
                        {isAnalyticsLoading ? <div className="flex h-full items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading chart...</div> : <ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyAnalytics} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}><defs><linearGradient id="cashFlowStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#818cf8" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="4 8" /><XAxis dataKey="month" tickFormatter={monthLabel} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} /><Tooltip contentStyle={chartTooltipStyle} labelFormatter={(value) => monthLabel(String(value))} formatter={(value: unknown) => [`$${Number(value ?? 0).toLocaleString()}`, "Net cash flow"]} /><Line type="monotone" dataKey="netCashFlow" stroke="url(#cashFlowStroke)" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 3, stroke: '#111827' }} /></LineChart></ResponsiveContainer>}
                    </div>
                </section>
            </div>
        </div>
    )
}