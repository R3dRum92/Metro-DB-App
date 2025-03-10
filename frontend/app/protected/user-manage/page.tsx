"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import Link from "next/link"

// Modal Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import AdminGuard from "@/components/AdminGuard"

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
        <AdminGuard>
            <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-8">
                {/* Heading Section */}
                <Card className="w-full max-w-6xl shadow-lg mb-8">
                    <CardHeader className="bg-primary/5 rounded-t-lg py-6">
                        <div className="flex items-center justify-center mb-2">
                            <UserIcon className="text-primary mr-3" width={32} height={32} strokeWidth="2.5" />
                            <CardTitle className="text-primary text-3xl font-bold text-center">User Management</CardTitle>
                        </div>
                        <CardDescription className="text-center text-lg mt-2">
                            Manage users, view profiles, and handle user access to the metro system.
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Table Section */}
                <Card className="w-full max-w-6xl shadow-lg">
                    <CardContent className="p-8">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
                                <Table className="w-full">
                                    <TableCaption className="text-lg font-medium py-4">
                                        A list of registered users and their details
                                    </TableCaption>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow className="border-b-2 border-gray-200">
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Name</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Email</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Phone</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Wallet</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow
                                                key={user.id}
                                                className="hover:bg-primary/5 transition-colors border-b border-gray-200"
                                            >
                                                <TableCell className="py-4 px-6 text-base font-medium">
                                                    <Link
                                                        href={`/protected/user-manage/${user.id}`}
                                                        className="block w-full h-full  hover:text-primary/80 transition-colors"
                                                    >
                                                        {user.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-base">{user.email}</TableCell>
                                                <TableCell className="py-4 px-6 text-base">{user.phone}</TableCell>
                                                <TableCell className="py-4 px-6 text-base font-medium">৳{user.wallet.toFixed(2)}</TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Link
                                                        href={`/protected/user-manage/${user.id}`}
                                                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors inline-flex items-center"
                                                    >
                                                        <EditIcon className="h-5 w-5 mr-2" />
                                                        <span>Edit</span>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminGuard>
    )
}

// User Icon Component
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}

// Edit Icon Component
function EditIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
    )
}