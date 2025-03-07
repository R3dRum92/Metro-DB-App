"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import Link from "next/link"

// Modal Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface User {
    id: number
    name: string
    email: string
    phone: string
    wallet: number
    // Removed 'history' as it's now handled via modal
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
            try {
                const response = await fetch("http://localhost:8000/users")
                if (!response.ok) {
                    throw new Error(`Error fetching users: ${response.statusText}`)
                }
                const data: User[] = await response.json()
                setUsers(data)
            } catch (error) {
                console.error("Error fetching users:", error)
            } finally {
                setLoading(false)
            }
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
                    <CardTitle className="text-primary text-2xl font-bold text-center">User Management</CardTitle>
                    <CardDescription className="text-center">Manage users, view profiles, and handle user access.</CardDescription>
                </CardHeader>
            </Card>

            {/* Table Section */}
            <Card className="w-full max-w-4xl">
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
                        </div>
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
                                        <TableCell>৳{user.wallet.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="link" onClick={() => handleViewHistory(user)} className="text-blue-500 hover:underline">
                                                View History
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center flex justify-center gap-2">
                                            <Link href={`/protected/user-manage/${user.id}`}>
                                                <Button className="mr-2">
                                                    Edit
                                                </Button>
                                            </Link>
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

            {/* Modal for User History */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedUser ? `${selectedUser.name}'s History` : "User History"}
                        </DialogTitle>
                        <DialogDescription>
                            View recent actions and activities of the selected user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {historyLoading ? (
                            <p>Loading history...</p>
                        ) : historyError ? (
                            <p className="text-red-500">{historyError}</p>
                        ) : historyData.length === 0 ? (
                            <p>No history available for this user.</p>
                        ) : (
                            <Table>
                                <TableCaption>Recent history entries for {selectedUser?.name}</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historyData.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{entry.action}</TableCell>
                                            <TableCell>{new Date(entry.date).toLocaleString()}</TableCell>
                                            <TableCell>{entry.details}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={closeModal} variant="secondary">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}