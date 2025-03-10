"use client"

import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminGuard({ children }: { children: ReactNode }) {
    const { isAuthenticated, userRole } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/signin')
        } else if (userRole !== 'admin') {
            router.push('/unauthorized')
        }
    }, [isAuthenticated, userRole, router])

    // Display a loading state initially
    if (!isAuthenticated || userRole !== 'admin') {
        return (
            <div className="container mx-auto min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="bg-amber-50 text-amber-800 rounded-t-lg p-4">
                        <CardTitle className="flex items-center text-xl font-bold">
                            <AlertTriangle className="mr-2 h-6 w-6" />
                            Access Restricted
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <p className="text-gray-700 mb-4">
                            Verifying admin privileges...
                        </p>
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // If user is admin, render the protected content
    return <>{children}</>
}