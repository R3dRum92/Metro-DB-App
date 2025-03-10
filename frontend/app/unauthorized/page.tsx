"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/app/context/AuthContext"

export default function UnauthorizedPage() {
    const { userRole } = useAuth()

    return (
        <div className="container mx-auto min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="bg-amber-50 text-amber-800 rounded-t-lg p-6">
                    <CardTitle className="flex items-center text-2xl font-bold">
                        <AlertTriangle className="mr-3 h-7 w-7" />
                        Access Denied
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="py-4">
                        <h2 className="text-xl font-semibold mb-2 text-gray-800">Unauthorized Access</h2>
                        <p className="text-gray-600 mb-4">
                            You don't have permission to access this page. This area is restricted to administrators only.
                        </p>
                        <p className="text-gray-600">
                            Your current role: <span className="font-medium">{userRole || "User"}</span>
                        </p>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <Link href="/">
                            <Button className="flex items-center gap-2">
                                <ArrowLeft size={16} />
                                Return to Dashboard
                            </Button>
                        </Link>

                    </div>
                </CardContent>
            </Card>
        </div>
    )
}