"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, Loader, Loader2 } from "lucide-react"
import api from "@/lib/api"

interface DashboardMetrics{
    totalAssets:number;
    totalLiabilities: number;
    unreconciledCount: number;
}

export default function DashboardOverview() {
    const {data, isLoading, isError} = useQuery<DashboardMetrics>({
        queryKey:["dashboard-summary"],
        queryFn: async ()=>{
            const response = await api.get("/transactions/summary");
            return response.data
        }
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
        </div>
    )
}