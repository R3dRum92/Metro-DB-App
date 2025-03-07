"use client"

import { useEffect, useState, useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Icons } from "@/components/ui/icons"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"

interface User {
    id: number
    name: string
    email: string
    phone: string
    wallet: number
}

interface HistoryEntry {
    id: number
    action: string
    date: string
    details: string
}

// Form schema for validation
const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    wallet: z.coerce.number().min(0, "Wallet amount cannot be negative")
})

export default function EditUser() {
    const params = useParams()
    const router = useRouter()
    const userId = String(params.id)

    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState({ type: "", content: "" })
    const [historyData, setHistoryData] = useState<HistoryEntry[]>([])
    const [historyLoading, setHistoryLoading] = useState<boolean>(false)

    // Form setup
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            wallet: 0
        },
    })

    // Fetch user details
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!userId) return

            try {
                const response = await fetch(`http://localhost:8000/users/${userId}`)

                if (!response.ok) {
                    throw new Error(`Error fetching user: ${response.statusText}`)
                }

                const data = await response.json()
                setUser(data)

                // Set form values
                form.reset({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    wallet: data.wallet,
                })

                // Fetch user history
                fetchUserHistory(data.id)
            } catch (error) {
                console.error("Error fetching user details:", error)
                setMessage({ type: "error", content: "Failed to load user details" })
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserDetails()
    }, [userId, form])

    // Function to fetch user history
    const fetchUserHistory = async (userId: number) => {
        setHistoryLoading(true)

        try {
            const response = await fetch(`http://localhost:8000/users/${userId}/history`)
            if (!response.ok) {
                throw new Error(`Error fetching history: ${response.statusText}`)
            }
            const data: HistoryEntry[] = await response.json()
            setHistoryData(data)
        } catch (error) {
            console.error("Error fetching user history:", error)
        } finally {
            setHistoryLoading(false)
        }
    }

    // Handle form submission
    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            try {
                const response = await fetch(`http://localhost:8000/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(values)
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.detail || "Failed to update user")
                }

                const data = await response.json()
                setMessage({ type: "success", content: "User updated successfully" })

                // Update local state
                setUser({
                    ...user!,
                    ...values
                })
            } catch (error) {
                console.error("Error updating user:", error)
                setMessage({ type: "error", content: error instanceof Error ? error.message : "Failed to update user" })
            }
        })
    }

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-primary text-2xl font-bold">User Details</CardTitle>
                        <Link href="/protected/user-manage">
                            <Button variant="outline">Back to Users</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : user ? (
                        <>
                            {message.content && (
                                <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                    {message.content}
                                </div>
                            )}

                            {/* User Information Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-medium mb-4">User Information</h3>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-500">User ID</p>
                                        <p className="font-medium">{user.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium">{user.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium">{user.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Wallet Balance</p>
                                        <p className="font-medium">৳{user.wallet.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* User History Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-medium mb-4">User History</h3>
                                {historyLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Icons.spinner className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : historyData.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableCaption>Recent activities</TableCaption>
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
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500">No history available for this user</p>
                                    </div>
                                )}
                            </div>

                            {/* Edit Form Section */}
                            <div className="pt-6 border-t">
                                <h3 className="text-lg font-medium mb-4">Edit User</h3>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="email" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="wallet"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Wallet Balance</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" step="0.01" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="flex justify-between">
                                            <Button type="submit" disabled={isPending}>
                                                {isPending ? (
                                                    <>
                                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    "Update User"
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-600">User not found</p>
                            <Link href="/protected/user-manage">
                                <Button variant="outline" className="mt-4">Back to Users</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}