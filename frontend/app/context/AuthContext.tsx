"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import Cookies from 'js-cookie'

interface AuthContextType {
    isAuthenticated: boolean
    userRole: string | null
    userId: string | null
    login: (token: string) => void
    logout: () => void
    hasPermission: (requiredRoles: string[]) => boolean
}

interface CustomJwtPayload {
    role: string
    user_id?: string
    exp: number
    sub: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const router = useRouter()

    // Check for existing token on mount
    useEffect(() => {
        const checkAuth = () => {
            const token = Cookies.get('token')

            if (token) {
                try {
                    const decoded = jwtDecode<CustomJwtPayload>(token)
                    // Check if token is expired
                    const currentTime = Math.floor(Date.now() / 1000)

                    if (decoded.exp && decoded.exp > currentTime) {
                        setIsAuthenticated(true)
                        setUserRole(decoded.role || 'user')
                        setUserId(decoded.user_id || null)
                    } else {
                        // Token expired, clear it
                        Cookies.remove('token')
                        localStorage.removeItem('userRole')
                        localStorage.removeItem('userId')
                        setIsAuthenticated(false)
                        setUserRole(null)
                        setUserId(null)
                    }
                } catch (error) {
                    console.error('Error decoding token:', error)
                    Cookies.remove('token')
                    localStorage.removeItem('userRole')
                    localStorage.removeItem('userId')
                    setIsAuthenticated(false)
                    setUserRole(null)
                    setUserId(null)
                }
            } else {
                // Check for fallback auth in localStorage (less secure but helps with persistence)
                const storedRole = localStorage.getItem('userRole')
                const storedUserId = localStorage.getItem('userId')
                const storedAuth = localStorage.getItem('isAuthenticated')

                if (storedAuth === 'true' && storedRole) {
                    setIsAuthenticated(true)
                    setUserRole(storedRole)
                    setUserId(storedUserId)
                }
            }

            setIsLoading(false)
        }

        // Check auth immediately
        checkAuth()

        // Set up an interval to periodically check token validity
        const interval = setInterval(checkAuth, 60000) // Check every minute

        return () => clearInterval(interval)
    }, [])

    const login = (token: string) => {
        try {
            const decoded = jwtDecode<CustomJwtPayload>(token)

            // Debug information - remove in production
            console.log("Decoded token:", decoded)

            // Validate role from token
            const role = decoded.role || 'user'
            const uid = decoded.user_id || null

            // Enhanced security: Make sure role is valid
            if (role !== 'user' && role !== 'admin') {
                console.warn('Unusual role in token:', role)
                // Don't throw error, just log warning and proceed with the role
            }

            // Set token in cookie
            Cookies.set('token', token, {
                expires: new Date(decoded.exp * 1000), // Convert seconds to milliseconds
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            })

            // Store authentication data in localStorage as backup
            localStorage.setItem('isAuthenticated', 'true')
            localStorage.setItem('userRole', role)
            if (uid) localStorage.setItem('userId', uid)

            setIsAuthenticated(true)
            setUserRole(role)
            setUserId(uid)

            // Redirect based on role
            if (role === 'admin') {
                router.push('/protected/admin')
            } else {
                router.push('/protected/dashboard')
            }
        } catch (error) {
            console.error('Error decoding token:', error)
            // Clear any existing tokens on error
            Cookies.remove('token')
            localStorage.removeItem('userRole')
            localStorage.removeItem('userId')
            localStorage.removeItem('isAuthenticated')
        }
    }

    const logout = () => {
        Cookies.remove('token')
        localStorage.removeItem('userRole')
        localStorage.removeItem('userId')
        localStorage.removeItem('isAuthenticated')
        setIsAuthenticated(false)
        setUserRole(null)
        setUserId(null)
        router.push('/signin')
    }

    const hasPermission = (requiredRoles: string[] = []) => {
        // If no roles are required, allow authenticated users
        if (!requiredRoles || requiredRoles.length === 0) {
            return isAuthenticated;
        }

        // Otherwise check if user has one of the required roles
        if (!isAuthenticated || !userRole) return false;
        return requiredRoles.includes(userRole);
    }

    // Show loading state or redirect to login if needed
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    }

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            userRole,
            userId,
            login,
            logout,
            hasPermission
        }}>
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