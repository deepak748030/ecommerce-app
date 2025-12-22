import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Admin, adminLogin, getAdminProfile } from '../lib/api'

interface AuthContextType {
    admin: Admin | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<Admin | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('admin_token')
            if (token) {
                const response = await getAdminProfile()
                if (response.success) {
                    setAdmin(response.response)
                }
            }
        } catch (error) {
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_user')
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email: string, password: string) => {
        const response = await adminLogin(email, password)
        if (response.success) {
            localStorage.setItem('admin_token', response.response.token)
            localStorage.setItem('admin_user', JSON.stringify(response.response.admin))
            setAdmin(response.response.admin)
        } else {
            throw new Error(response.message)
        }
    }

    const logout = () => {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        setAdmin(null)
    }

    return (
        <AuthContext.Provider
            value={{
                admin,
                isLoading,
                isAuthenticated: !!admin,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
