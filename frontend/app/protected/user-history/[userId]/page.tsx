// app/protected/user-history/[userId]/page.tsx

"use client"

import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UserHistory() {
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const router = useRouter()
    const { userId } = router.query // Get the userId from the URL

    // Fetch user history from backend (to be implemented later)
    useEffect(() => {
        const fetchUserHistory = async () => {
            if (userId) {
                try {
                    const response = await fetch(`http://localhost:8000/user-history/${userId}`)
                    const data = await response.json()
                    setHistory(data)
                } catch (error) {
                    console.error("Error fetching user history:", error)
                } finally {
                    setLoading(false)
                }
            }
        }
        fetchUserHistory()
    }, [userId])

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">User History</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading user history...</p>
                    ) : (
                        <div>
                            {/* Display history data */}
                            <p>User history data will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
