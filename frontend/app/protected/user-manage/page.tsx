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
}


export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

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


    // Function to close the modal
    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedUser(null)
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
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Link href={`/protected/user-manage/${user.id}`} className="block w-full h-full">{user.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.phone}</TableCell>
                                        <TableCell>৳{user.wallet.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Link href={`/protected/user-manage/${user.id}`} className="text-blue-500 hover:underline">
                                                Edit
                                            </Link>
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