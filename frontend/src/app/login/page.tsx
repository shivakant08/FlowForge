"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import api from "@/lib/api"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const { login } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSubmitting(true)

        try {
            const response = await api.post('/auth/login', { email, password })
            const { token, user } = response.data

            login(token, user)
            router.push("/dashboard")
        } catch (error: any) {
            setError(error.response?.data?.message || "Invalid Credentials")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">FlowForge</h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <input type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-blue-600 hover:bg-blue-500 font-semibold py-2 rounded transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Authenticating" : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    )
}