"use client"

import { ReactNode } from 'react'
import { useAuth } from '@/app/context/AuthContext'

interface RoleBasedProps {
    children: ReactNode
    allowedRoles?: string[]
    fallback?: ReactNode
}

export default function RoleBasedAccess({
    children,
    allowedRoles = [],
    fallback = null
}: RoleBasedProps) {
    const { isAuthenticated, userRole, hasPermission } = useAuth()

    // Debug information - remove in production
    console.log("RoleBasedAccess check:", {
        isAuthenticated,
        userRole,
        allowedRoles: allowedRoles || [],
        hasAccess: allowedRoles ? hasPermission(allowedRoles) : false
    })

    if (!isAuthenticated) {
        console.log("Not authenticated")
        return fallback
    }

    // Handle case where allowedRoles is undefined
    if (!allowedRoles || allowedRoles.length === 0) {
        // If no roles specified, allow access to authenticated users
        console.log("No specific roles required, allowing access")
        return <>{children}</>
    }

    // Strict check for admin-only content
    const isAdminOnlyContent = allowedRoles.length === 1 && allowedRoles[0] === 'admin'
    if (isAdminOnlyContent && userRole !== 'admin') {
        console.log("Admin-only content not shown to:", userRole)
        return <>{fallback}</>
    }

    if (hasPermission(allowedRoles)) {
        return <>{children}</>
    }

    return <>{fallback}</>
}