// "use client"

// import React from "react"
// import Link from "next/link"
// import { usePathname } from "next/navigation"
// import { LayoutDashboard, Receipt, GitCompare, LogOut, ShieldCheck } from "lucide-react"
// import { useAuth } from "@/context/AuthContext"

// const navigation = [
//     { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
//     { name: "Ledger Entries", href: "/dashboard/ledger", icon: Receipt },
//     { name: "Reconciliation", href: "/dashboard/reconciliation", icon: GitCompare }
// ]

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//     const pathname = usePathname()
//     const { logout, user } = useAuth()

//     return (
//         <div className="flex-h-screen bg-slate-950 text-slate-100 font-sans">
//             <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col justify-between p-4">
//                 <div>
//                     <div className="flex items-centre gap-2 px-3 py-4 mb-6 border-b border-slate-800">
//                         <ShieldCheck className="w-7 h-7 text-emerald-400" />
//                         <span className="font-bold text-xl tracking-wider text-white">FlowForge</span>
//                     </div>

//                     <nav className="space-y-1">
//                         {navigation.map((item) => {
//                             const isActive = pathname === item.href
//                             const Icon = item.icon
//                             return (
//                                 <Link
//                                     key={item.name}
//                                     href={item.href}
//                                     className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transaction-all ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
//                                 >
//                                     <Icon className="w-5 h-5" />
//                                     {item.name}
//                                 </Link>
//                             )
//                         })}
//                     </nav>
//                 </div>

//                 <div className="border-t border-slate-800 pt-4">
//                     <div className="px-3 py-2 mb-2">
//                         <p className="text-xs text-slate-500 uppercase tracking-wider">Signed in as</p>
//                         <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || "Administrator"}</p>
//                     </div>
//                     <button
//                         onClick={logout}
//                         className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
//                     >
//                         <LogOut className="w-5 h-5" />
//                         Logout
//                     </button>
//                 </div>
//             </aside>

//             <main className="flex-1 overflow-y-auto p-8 bg-slate-950">
//                 {children}
//             </main>

//         </div>
//     )
// }

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, GitCompare, LogOut, ShieldCheck, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Ledger Entries', href: '/dashboard/ledger', icon: Receipt },
    { name: 'Reconciliation', href: '/dashboard/reconciliation', icon: GitCompare },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
            {/* Fixed Sidebar */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col justify-between p-4 flex-shrink-0">
                <div>
                    <div className="flex items-center gap-2 px-3 py-4 mb-6 border-b border-slate-800">
                        <ShieldCheck className="w-7 h-7 text-emerald-400" />
                        <span className="font-bold text-xl tracking-wider text-white">FlowForge</span>
                    </div>

                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User Footer */}
                <div className="border-t border-slate-800 pt-4">
                    <div className="px-3 py-2 mb-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || 'Administrator'}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area with Scroll */}
            <main className="flex-1 h-full overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}