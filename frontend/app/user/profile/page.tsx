"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import { User, Wallet, Phone, Mail, Calendar, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface UserProfile {
    id: string
    name: string
    email?: string
    phone: string
    wallet: number
    dateOfBirth?: string
}

export default function UserProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { isAuthenticated, userId, logout } = useAuth()
    const router = useRouter()

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/signin')
        }
    }, [isAuthenticated, router])

    // Fetch user profile
    useEffect(() => {
        async function fetchUserProfile() {
            if (!userId) return

            setLoading(true)
            setError(null)

            try {
                const response = await fetch(`http://localhost:8000/users/${userId}`)

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("User profile not found")
                    } else {
                        throw new Error("Failed to load profile")
                    }
                }

                const userData = await response.json()
                setProfile(userData)
            } catch (error) {
                console.error("Error fetching user profile:", error)
                setError(error instanceof Error ? error.message : "Failed to load profile. Please try again.")
            } finally {
                setLoading(false)
            }
        }

        fetchUserProfile()
    }, [userId])

    // Format date of birth
    const formatDate = (dateString?: string) => {
        if (!dateString) return "Not provided"

        try {
            return format(new Date(dateString), "PPP") // Long date format
        } catch (e) {
            return "Invalid date"
        }
    }

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-6">
            <Card className="w-full max-w-3xl shadow-lg">
                <CardHeader className="bg-primary text-white text-center py-8 rounded-t-lg">
                    <div className="flex justify-center mb-4">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                            <User size={48} className="text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold">My Profile</CardTitle>
                    <CardDescription className="text-white/80 text-lg">
                        View and manage your account details
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            <p>{error}</p>
                        </div>
                    ) : profile ? (
                        <div className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-3">
                                        <User className="text-primary mr-3 h-5 w-5" />
                                        <h3 className="font-medium text-gray-700">Full Name</h3>
                                    </div>
                                    <p className="text-lg font-medium pl-8">{profile.name}</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-3">
                                        <Phone className="text-primary mr-3 h-5 w-5" />
                                        <h3 className="font-medium text-gray-700">Phone Number</h3>
                                    </div>
                                    <p className="text-lg font-medium pl-8">{profile.phone}</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-3">
                                        <Mail className="text-primary mr-3 h-5 w-5" />
                                        <h3 className="font-medium text-gray-700">Email</h3>
                                    </div>
                                    <p className="text-lg font-medium pl-8">{profile.email || "Not provided"}</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-3">
                                        <Calendar className="text-primary mr-3 h-5 w-5" />
                                        <h3 className="font-medium text-gray-700">Date of Birth</h3>
                                    </div>
                                    <p className="text-lg font-medium pl-8">{formatDate(profile.dateOfBirth)}</p>
                                </div>
                            </div>

                            <div className="bg-primary/5 p-4 rounded-lg border-2 border-primary/20">
                                <div className="flex items-center mb-3">
                                    <Wallet className="text-primary mr-3 h-5 w-5" />
                                    <h3 className="font-medium text-gray-700">Metro Wallet Balance</h3>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-2xl font-bold text-primary pl-8">৳ {profile.wallet.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg">
                                <p className="text-sm">
                                    Your Metro wallet can be used to purchase tickets across all metro stations and on the mobile app.
                                    Maintain a minimum balance to enable quick tap-and-go service at turnstiles.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No profile information available</p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 p-6 bg-gray-50">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.push('/user/dashboard')}>
                        Back to Dashboard
                    </Button>

                    <div className="flex-1"></div>

                    <Button variant="destructive" className="w-full sm:w-auto" onClick={logout}>
                        Sign Out
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}