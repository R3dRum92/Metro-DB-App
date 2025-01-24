"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface User {
    id: number
    name: string
    email: string
    phone: string
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Fetch the list of users from the FastAPI backend
    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch("http://localhost:8000/users")
                const data = await response.json()
                setUsers(data)
            } catch (error) {
                console.error("Error fetching users:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [])

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">User Management</CardTitle>
                    <CardDescription className="text-center">Manage users, view profiles, and handle user access.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading users...</p>
                    ) : (
                        <Table>
                            <thead>
                                <tr>
                                    <th className="text-left">Name</th>
                                    <th className="text-left">Email</th>
                                    <th className="text-left">Phone</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.phone}</td>
                                        <td className="text-center">
                                            <Button onClick={() => alert(`Edit user: ${user.name}`)} className="mr-2">
                                                Edit
                                            </Button>
                                            <Button onClick={() => alert(`Delete user: ${user.name}`)} className="bg-red-500">
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
