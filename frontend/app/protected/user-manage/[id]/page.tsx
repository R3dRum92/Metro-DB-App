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
import { User } from "lucide-react"
import AdminGuard from "@/components/AdminGuard"

interface User {
    id: number
    name: string
    email: string
    phone: string
    wallet: number
    dateOfBirth?: string
}

// Function to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    // If the current month is before the birth month, or it's the birth month but before the birth day, subtract 1 from age
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

// Form schema for validation
const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    wallet: z.coerce.number().min(0, "Wallet amount cannot be negative"),
    dateOfBirth: z.string().refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, "Please enter a valid date")
})

export async function deleteUser(user_id: string): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`http://localhost:8000/delete_user/${user_id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const error = await response.json();
            return {
                success: false,
                message: error.detail || "Failed to delete user"
            };
        }

        return {
            success: true,
            message: "User deleted successfully"
        };
    } catch (error) {
        console.error("Error deleting user:", error);
        return {
            success: false,
            message: "Failed to connect to server"
        };
    }
}

export default function EditUser() {
    const params = useParams()
    const router = useRouter()
    const userId = String(params.id)

    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState({ type: "", content: "" })

    // Form setup
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            wallet: 0,
            dateOfBirth: ""
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
                    dateOfBirth: data.dateOfBirth || ""
                })

            } catch (error) {
                console.error("Error fetching user details:", error)
                setMessage({ type: "error", content: "Failed to load user details" })
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserDetails()
    }, [userId, form])

    // Handle form submission
    function onSubmit(values: z.infer<typeof formSchema>) {
        setIsUpdating(true);
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
            } finally {
                setIsUpdating(false); // Reset updating state
            }
        })
    }

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            setIsDeleting(true);
            startTransition(async () => {
                const result = await deleteUser(userId);
                if (result.success) {
                    setMessage({ type: "success", content: result.message });
                    // Redirect after successful deletion
                    setTimeout(() => {
                        window.location.href = "/protected/user-manage";
                    }, 1500);
                } else {
                    setMessage({ type: "error", content: result.message });
                }
                setIsDeleting(false);
            });
        }
    };

    return (
        <AdminGuard>
            <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-8">
                <Card className="w-full max-w-6xl shadow-lg">
                    <CardHeader className="bg-primary/5 rounded-t-lg py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <User className="text-primary" width={32} height={32} strokeWidth="3" />
                                <CardTitle className="text-primary text-3xl font-bold">User Details</CardTitle>
                            </div>
                            <Link href="/protected/user-manage">
                                <Button variant="outline" className="text-base px-6 py-2 border-2 hover:bg-gray-100 transition-colors">
                                    Back to Users
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : user ? (
                            <>
                                {message.content && (
                                    <div className={`mb-6 p-4 rounded-lg text-base ${message.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"}`}>
                                        {message.content}
                                    </div>
                                )}

                                {/* User Information Section */}
                                <div className="mb-10">
                                    <h3 className="text-xl font-semibold mb-5 text-gray-800 border-b pb-2">User Information</h3>
                                    <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-100">
                                        <div>
                                            <p className="text-base text-gray-500 mb-1">User ID</p>
                                            <p className="font-medium text-lg">{user.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-base text-gray-500 mb-1">Name</p>
                                            <p className="font-medium text-lg">{user.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-base text-gray-500 mb-1">Email</p>
                                            <p className="font-medium text-lg">{user.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-base text-gray-500 mb-1">Phone</p>
                                            <p className="font-medium text-lg">{user.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-base text-gray-500 mb-1">Wallet Balance</p>
                                            <p className="font-medium text-lg">৳{user.wallet.toFixed(2)}</p>
                                        </div>
                                        {user.dateOfBirth && (
                                            <>
                                                <div>
                                                    <p className="text-base text-gray-500 mb-1">Date of Birth</p>
                                                    <p className="font-medium text-lg">{new Date(user.dateOfBirth).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-base text-gray-500 mb-1">Age</p>
                                                    <p className="font-medium text-lg">{calculateAge(user.dateOfBirth)} years</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Edit Form Section */}
                                <div className="pt-8 border-t border-gray-200">
                                    <h3 className="text-xl font-semibold mb-6 text-gray-800">Edit User</h3>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-lg font-medium">Name</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                className="p-3 text-base border-2 rounded-md"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-sm font-medium" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-lg font-medium">Email</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="email"
                                                                className="p-3 text-base border-2 rounded-md"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-sm font-medium" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-lg font-medium">Phone</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                className="p-3 text-base border-2 rounded-md"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-sm font-medium" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="dateOfBirth"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-lg font-medium">Date of Birth</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="date"
                                                                {...field}
                                                                className="p-3 text-base border-2 rounded-md"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-sm font-medium" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="wallet"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-lg font-medium">Wallet Balance</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                step="0.01"
                                                                className="p-3 text-base border-2 rounded-md"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-sm font-medium" />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="flex justify-between pt-4">
                                                <Button
                                                    type="submit"
                                                    disabled={isUpdating || isDeleting}
                                                    className="px-8 py-3 text-base font-medium bg-primary hover:bg-primary/90 text-white rounded-md shadow-md"
                                                >
                                                    {isUpdating ? (
                                                        <>
                                                            <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
                                                            Updating...
                                                        </>
                                                    ) : (
                                                        "Update User"
                                                    )}
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={handleDelete}
                                                    disabled={isUpdating || isDeleting}
                                                    className="px-8 py-3 text-base font-medium shadow-md"
                                                >
                                                    {isDeleting ? (
                                                        <>
                                                            <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
                                                            Deleting...
                                                        </>
                                                    ) : (
                                                        "Delete User"
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-gray-600 text-xl mb-4">User not found</p>
                                <Link href="/protected/user-manage">
                                    <Button
                                        variant="outline"
                                        className="mt-4 px-6 py-2 text-base font-medium border-2 hover:bg-gray-100 transition-colors"
                                    >
                                        Back to Users
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminGuard>
    )
}