"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface User {
    id: number
    name: string
    email: string
    phone: string
    wallet: number
    history: string
}

interface HistoryEntry {
    id: number
    action: string
    date: string
    details: string
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [historyData, setHistoryData] = useState<HistoryEntry[]>([])
    const [historyLoading, setHistoryLoading] = useState<boolean>(false)
    const [historyError, setHistoryError] = useState<string | null>(null)

    // Fetch the list of users from the FastAPI backend
    useEffect(() => {
        async function fetchUsers() {
            // Uncomment and use this once the backend is ready
            try {
                const response = await fetch("http://localhost:8000/users")
                const data = await response.json()
                setUsers(data)
            } catch (error) {
                console.error("Error fetching users:", error)
            } finally {
                setLoading(false)
            }

            // // Dummy data for testing
            // const dummyUsers = [
            //     {
            //         id: 1,
            //         name: "John Doe",
            //         email: "john.doe@example.com",
            //         phone: "01771234567",
            //         wallet: 150.0,
            //         history: "/protected/user-history/1" // Link to history page
            //     },
            //     {
            //         id: 2,
            //         name: "Jane Smith",
            //         email: "jane.smith@example.com",
            //         phone: "01819876543",
            //         wallet: 200.0,
            //         history: "/protected/user-history/2" // Link to history page
            //     }
            // ]
            // setUsers(dummyUsers)
            // setLoading(false)
        }

        fetchUsers()
    }, [])
    // Function to handle "View History" button click
    const handleViewHistory = (user: User) => {
        setSelectedUser(user)
        setIsModalOpen(true)
        fetchUserHistory(user.id)
    }

    // Function to fetch user history
    const fetchUserHistory = async (userId: number) => {
        setHistoryLoading(true)
        setHistoryError(null)
        setHistoryData([])

        try {
            const response = await fetch(`http://localhost:8000/users/${userId}/history`)
            if (!response.ok) {
                throw new Error(`Error fetching history: ${response.statusText}`)
            }
            const data: HistoryEntry[] = await response.json()
            setHistoryData(data)
        } catch (error) {
            console.error("Error fetching user history:", error)
            setHistoryError("Failed to load history. Please try again.")
        } finally {
            setHistoryLoading(false)
        }
    }

    // Function to close the modal
    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedUser(null)
        setHistoryData([])
        setHistoryError(null)
    }

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            {/* Heading Section */}
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">User Management</CardTitle>
                    <CardDescription className="text-center">Manage users, view profiles, and handle user access.</CardDescription>
                </CardHeader>
            </Card>

            {/* Table Section */}
            <Card className="w-full max-w-4xl">
                <CardContent>
                    {loading ? (
                        <p>Loading users...</p>
                    ) : (
                        <Table>
                            <TableCaption>A list of users and their details</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Wallet</TableHead>
                                    <TableHead className="text-center">History</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.phone}</TableCell>
                                        <TableCell>{user.wallet}</TableCell>
                                        <TableCell className="text-center">
                                            <Link href={`/protected/user-history/${user.id}`} className="text-blue-500 hover:underline">
                                                View History
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-center flex justify-center gap-2">
                                            <Button onClick={() => alert(`Edit user: ${user.name}`)} className="mr-2">
                                                Edit
                                            </Button>
                                            <Button onClick={() => alert(`Delete user: ${user.name}`)} className="bg-red-500">
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
