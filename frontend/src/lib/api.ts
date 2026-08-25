import axios from "axios"

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
})

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("accessToken")
        if (token) {
            config.headers = config.headers ?? {}
            config.headers.Authorization = `Bearer ${token}`
        }
    }
    return config
})

api.interceptors.response.use(
    (response) => {
        const payload = response.data

        if (
            payload &&
            typeof payload === "object" &&
            "data" in payload &&
            "success" in payload &&
            !Array.isArray(payload)
        ) {
            return {
                ...response,
                data: payload.data,
            }
        }

        return response
    },
    (error) => {
        if (error.response?.status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("accessToken")
            window.location.href = "/login"
        }
        return Promise.reject(error)
    }
)

export default api