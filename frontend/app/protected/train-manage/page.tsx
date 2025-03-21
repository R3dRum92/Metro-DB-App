"use client"

import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash } from "lucide-react"
import AdminGuard from "@/components/AdminGuard"

const formSchema = z.object({
    train_code: z.string().max(10, "Train Code must be less than 10 characters"),
    route_id: z.string().max(50, "Route ID must be a valid number"),
    capacity: z.coerce.number().int().positive("Capacity must be a positive integer"),
    operational_status: z.string().max(20, "Operational status must be less than 20 characters"),
})

interface Train {
    train_id: string
    train_code: string
    route_id: string
    capacity: number
    operational_status: string
    route_name?: string
}

interface Route {
    route_id: string
    route_name: string
    start_station_name: string
    end_station_name: string
}

export type trainActionResult = {
    success?: boolean
    message?: string
    errors?: Record<string, string[]>
}

const fetchRoutes = async () => {
    const response = await fetch("http://localhost:8000/routes")
    const data = await response.json()
    return data
}

export async function addTrain(formData: FormData): Promise<trainActionResult> {
    const validatedFields = formSchema.safeParse({
        train_code: formData.get("train_code"),
        route_id: formData.get("route_id"),
        capacity: formData.get("capacity"),
        operational_status: formData.get("operational_status")
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { train_code, route_id, capacity, operational_status } = validatedFields.data

    try {
        const response = await fetch("http://localhost:8000/add_train", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                train_code,
                route_id,
                capacity,
                operational_status,
            })
        })

        if (!response.ok) {
            const error = await response.json()
            return {
                success: false,
                message: "Adding Train Failed",
                errors: error.detail?.errors || { form: ["Server error occurred"] }
            }
        }

        const data = await response.json()
        return {
            success: true,
            message: data.message || "Train Added Successfully"
        }
    } catch (error) {
        console.log(error)
        return {
            success: false,
            message: "Failed to connect to server",
            errors: { form: ["Network error occurred"] },
        }
    }
}

export async function updateTrain(formData: FormData, trainId: string): Promise<trainActionResult> {
    const validatedFields = formSchema.safeParse({
        train_code: formData.get("train_code"),
        route_id: formData.get("route_id"),
        capacity: formData.get("capacity"),
        operational_status: formData.get("operational_status")
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { train_code, route_id, capacity, operational_status } = validatedFields.data

    try {
        const response = await fetch(`http://localhost:8000/update_train/${trainId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                train_code,
                route_id,
                capacity,
                operational_status,
            })
        })

        if (!response.ok) {
            const error = await response.json()
            return {
                success: false,
                message: "Updating Train Failed",
                errors: error.detail?.errors || { form: ["Server error occurred"] }
            }
        }

        const data = await response.json()
        return {
            success: true,
            message: data.message || "Train Updated Successfully"
        }
    } catch (error) {
        console.log(error)
        return {
            success: false,
            message: "Failed to connect to server",
            errors: { form: ["Network error occurred"] },
        }
    }
}

export async function deleteTrain(trainId: string): Promise<trainActionResult> {
    try {
        const response = await fetch(`http://localhost:8000/delete_train/${trainId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (!response.ok) {
            const error = await response.json()
            return {
                success: false,
                message: "Deleting Train Failed",
                errors: error.detail?.errors || { form: ["Server error occurred"] }
            }
        }

        const data = await response.json()
        return {
            success: true,
            message: data.message || "Train Deleted Successfully"
        }
    } catch (error) {
        console.log(error)
        return {
            success: false,
            message: "Failed to connect to server",
            errors: { form: ["Network error occurred"] },
        }
    }
}

export default function TrainManage() {
    const [trains, setTrains] = useState<Train[]>([])
    const [routes, setRoutes] = useState<Route[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [currentTrain, setCurrentTrain] = useState<Train | null>(null)
    const [isPending, startTransition] = useTransition()
    const [isRoutesLoading, setIsRoutesLoading] = useState<boolean>(true)
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const addForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            train_code: "",
            route_id: "",
            capacity: 1,
            operational_status: "active",
        },
    })

    const editForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            train_code: "",
            route_id: "",
            capacity: 1,
            operational_status: "active",
        },
    })

    useEffect(() => {
        async function loadRoutes() {
            try {
                const routeData = await fetchRoutes()
                setRoutes(routeData)
            } catch (error) {
                console.error("Error fetching routes:", error)
                setActionMessage({ type: 'error', text: 'Failed to load routes' })
            } finally {
                setIsRoutesLoading(false)
            }
        }
        loadRoutes()
    }, [])

    const fetchTrains = async () => {
        setLoading(true)
        try {
            const response = await fetch("http://localhost:8000/trains")
            if (!response.ok) {
                throw new Error(`Error fetching trains: ${response.statusText}`)
            }
            const data: Train[] = await response.json()
            setTrains(data)
        } catch (error) {
            console.error("Error fetching trains:", error)
            setActionMessage({ type: 'error', text: 'Failed to fetch trains' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTrains()
    }, [])

    const toggleAddModal = () => {
        setIsAddModalOpen(!isAddModalOpen)
    }

    const openEditModal = (train: Train) => {
        setCurrentTrain(train)
        editForm.reset({
            train_code: train.train_code,
            route_id: train.route_id,
            capacity: train.capacity,
            operational_status: train.operational_status,
        })
        setIsEditModalOpen(true)
    }

    const closeEditModal = () => {
        setIsEditModalOpen(false)
        setCurrentTrain(null)
    }

    function onAddSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            const formData = new FormData()
            Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)))

            const result = await addTrain(formData)
            if (result?.errors) {
                setActionMessage({ type: 'error', text: result.message || 'Failed to add train' })
            } else {
                addForm.reset()
                toggleAddModal()
                fetchTrains()
                setActionMessage({ type: 'success', text: 'Train added successfully' })
            }
        })
    }

    function onEditSubmit(values: z.infer<typeof formSchema>) {
        if (!currentTrain) return

        startTransition(async () => {
            const formData = new FormData()
            Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)))

            const result = await updateTrain(formData, currentTrain.train_id)
            if (result?.errors) {
                setActionMessage({ type: 'error', text: result.message || 'Failed to update train' })
            } else {
                editForm.reset()
                closeEditModal()
                fetchTrains()
                setActionMessage({ type: 'success', text: 'Train updated successfully' })
            }
        })
    }

    function handleDelete(trainId: string) {
        if (confirm("Are you sure you want to delete this train?")) {
            startTransition(async () => {
                const result = await deleteTrain(trainId)
                if (result?.success) {
                    fetchTrains()
                    setActionMessage({ type: 'success', text: 'Train deleted successfully' })
                } else {
                    setActionMessage({ type: 'error', text: result?.message || 'Failed to delete train' })
                }
            })
        }
    }

    const filteredTrains = trains.filter((train) =>
        train.train_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        train.operational_status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (train.route_name && train.route_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <AdminGuard>
            <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-8">
                <Card className="w-full max-w-6xl shadow-lg">
                    <CardHeader className="bg-primary/5 rounded-t-lg py-6">
                        <div className="flex items-center justify-center mb-2">
                            <TrainIcon className="text-primary mr-3" width={32} height={32} strokeWidth="2.5" />
                            <CardTitle className="text-primary text-3xl font-bold text-center">Train Management</CardTitle>
                        </div>
                        <p className="text-center text-lg text-gray-600 mt-2">
                            Here you can monitor train statuses, manage schedules, and perform maintenance tasks.
                        </p>
                    </CardHeader>
                    <CardContent className="p-8">
                        {actionMessage && (
                            <div className={`p-4 mb-6 rounded-lg border ${actionMessage.type === 'success' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-base">{actionMessage.text}</span>
                                    <button
                                        className="text-xl font-bold hover:text-gray-700 transition-colors"
                                        onClick={() => setActionMessage(null)}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col items-center space-y-6 mb-8">
                            <div className="relative flex-grow w-full max-w-xl">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <SearchIcon className="h-6 w-6 text-primary/70" />
                                </div>
                                <Input
                                    type="search"
                                    placeholder="Search trains by code, route or status"
                                    className="pl-12 pr-4 py-3 w-full text-lg border-2 border-primary/20 focus:ring-4 focus:ring-primary/30 rounded-lg"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-hidden border border-gray-200 rounded-lg shadow-md">
                            <div className="max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <Table className="w-full">
                                        <TableCaption className="text-lg font-medium py-4">
                                            A list of metro trains and their details
                                        </TableCaption>
                                        <TableHeader className="sticky top-0 bg-gray-50" style={{ zIndex: 1 }}>
                                            <TableRow className="border-b-2 border-gray-200">
                                                <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 w-1/5">Train Code</TableHead>
                                                <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 w-1/5">Route Name</TableHead>
                                                <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 w-1/5">Capacity</TableHead>
                                                <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 w-1/5">Operational Status</TableHead>
                                                <TableHead className="py-4 px-6 text-lg font-bold text-center text-gray-700 w-1/5">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTrains.map((train) => (
                                                <TableRow
                                                    key={train.train_id}
                                                    className="hover:bg-primary/5 transition-colors border-b border-gray-200"
                                                >
                                                    <TableCell className="py-4 px-6 text-base font-medium">{train.train_code}</TableCell>
                                                    <TableCell className="py-4 px-6 text-base">{train.route_name}</TableCell>
                                                    <TableCell className="py-4 px-6 text-base">{train.capacity}</TableCell>
                                                    <TableCell className="py-4 px-6 text-base">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${train.operational_status === 'active' ? 'bg-green-100 text-green-800' :
                                                            train.operational_status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {train.operational_status.charAt(0).toUpperCase() + train.operational_status.slice(1)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex justify-center space-x-3">
                                                            {/* Edit button */}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openEditModal(train)}
                                                                className="flex items-center h-10 px-4 border-2 hover:bg-gray-100 transition-colors"
                                                            >
                                                                <Edit className="h-5 w-5 mr-1" />
                                                                <span>Edit</span>
                                                            </Button>

                                                            {/* Delete button */}
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDelete(train.train_id)}
                                                                className="flex items-center h-10 px-4"
                                                            >
                                                                <Trash className="h-5 w-5 mr-1" />
                                                                <span>Delete</span>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </div>

                        {/* Add Train button */}
                        <div className="mt-8 text-center">
                            <Button
                                className="px-8 py-3 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-md"
                                onClick={toggleAddModal}
                            >
                                Add Train
                            </Button>

                            {/* Add Train Modal */}
                            {isAddModalOpen && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50" onClick={(e) => {
                                    if (e.target === e.currentTarget) toggleAddModal();
                                }}>
                                    <div className="bg-white p-8 rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                                        <h2 className="text-primary font-bold text-2xl mb-6 text-center">Add New Train</h2>
                                        <Form {...addForm}>
                                            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-6">
                                                {/* Train Code Field */}
                                                <FormField
                                                    control={addForm.control}
                                                    name="train_code"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Train Code</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="text"
                                                                    {...field}
                                                                    className="p-3 text-base border-2 rounded-md"
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-sm font-medium" />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Route ID Field */}
                                                <FormField
                                                    control={addForm.control}
                                                    name="route_id"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Route</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="p-3 text-base border-2 rounded-md">
                                                                        <SelectValue placeholder="Select a route" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="max-h-80">
                                                                    {isRoutesLoading ? (
                                                                        <div className="p-4 text-center">Loading routes...</div>
                                                                    ) : (
                                                                        routes.map((route) => (
                                                                            <SelectItem
                                                                                key={route.route_id}
                                                                                value={route.route_id}
                                                                                className="text-base py-2"
                                                                            >
                                                                                {route.route_name}
                                                                            </SelectItem>
                                                                        ))
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage className="text-sm font-medium" />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Capacity Field */}
                                                <FormField
                                                    control={addForm.control}
                                                    name="capacity"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Capacity</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    step="1"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                                    className="p-3 text-base border-2 rounded-md"
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-sm font-medium" />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Operational Status Field */}
                                                <FormField
                                                    control={addForm.control}
                                                    name="operational_status"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Operational Status</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="p-3 text-base border-2 rounded-md">
                                                                        <SelectValue placeholder="Select status" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="max-h-80">
                                                                    <SelectItem value="active" className="text-base py-2">Active</SelectItem>
                                                                    <SelectItem value="inactive" className="text-base py-2">Inactive</SelectItem>
                                                                    <SelectItem value="maintenance" className="text-base py-2">Maintenance</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage className="text-sm font-medium" />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Submit Buttons */}
                                                <div className="flex gap-4 pt-4">
                                                    <Button
                                                        variant="outline"
                                                        onClick={toggleAddModal}
                                                        type="button"
                                                        className="w-1/2 p-3 text-base font-medium border-2 rounded-md"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={isPending}
                                                        className="w-1/2 p-3 text-base font-medium bg-primary hover:bg-primary/90 text-white rounded-md"
                                                    >
                                                        {isPending ? (
                                                            <>
                                                                <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
                                                                Adding...
                                                            </>
                                                        ) : (
                                                            "Add Train"
                                                        )}
                                                    </Button>
                                                </div>
                                            </form>
                                        </Form>
                                    </div>
                                </div>
                            )}

                            {/* Edit Train Modal */}
                            {isEditModalOpen && currentTrain && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50" onClick={(e) => {
                                    if (e.target === e.currentTarget) closeEditModal();
                                }}>
                                    <div className="bg-white p-8 rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                                        <h2 className="text-primary font-bold text-2xl mb-6 text-center">Edit Train</h2>
                                        <Form {...editForm}>
                                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                                                {/* Train Code Field */}
                                                <FormField
                                                    control={editForm.control}
                                                    name="train_code"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Train Code</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="text"
                                                                    {...field}
                                                                    className="p-3 text-base border-2 rounded-md"
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-sm font-medium" />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Route ID Field */}
                                                <FormField
                                                    control={editForm.control}
                                                    name="route_id"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Route</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                value={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="p-3 text-base border-2 rounded-md">
                                                                        <SelectValue placeholder="Select a route" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="max-h-80">
                                                                    {isRoutesLoading ? (
                                                                        <div className="p-4 text-center">Loading routes...</div>
                                                                    ) : (
                                                                        routes.map((route) => (
                                                                            <SelectItem
                                                                                key={route.route_id}
                                                                                value={route.route_id}
                                                                                className="text-base py-2"
                                                                            >
                                                                                {route.route_name}
                                                                            </SelectItem>
                                                                        ))
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage className="text-sm font-medium" />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Capacity Field */}
                                                <FormField
                                                    control={editForm.control}
                                                    name="capacity"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Capacity</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    step="1"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                                    className="p-3 text-base border-2 rounded-md"
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-sm font-medium" />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Operational Status Field */}
                                                <FormField
                                                    control={editForm.control}
                                                    name="operational_status"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Operational Status</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="p-3 text-base border-2 rounded-md">
                                                                        <SelectValue placeholder="Select status" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="max-h-80">
                                                                    <SelectItem value="active" className="text-base py-2">Active</SelectItem>
                                                                    <SelectItem value="inactive" className="text-base py-2">Inactive</SelectItem>
                                                                    <SelectItem value="maintenance" className="text-base py-2">Maintenance</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage className="text-sm font-medium" />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Submit Buttons */}
                                                <div className="flex gap-4 pt-4">
                                                    <Button
                                                        variant="outline"
                                                        onClick={closeEditModal}
                                                        type="button"
                                                        className="w-1/2 p-3 text-base font-medium border-2 rounded-md"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={isPending}
                                                        className="w-1/2 p-3 text-base font-medium bg-primary hover:bg-primary/90 text-white rounded-md"
                                                    >
                                                        {isPending ? (
                                                            <>
                                                                <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
                                                                Updating...
                                                            </>
                                                        ) : (
                                                            "Update Train"
                                                        )}
                                                    </Button>
                                                </div>
                                            </form>
                                        </Form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminGuard>
    )
}

// Train Icon Component
function TrainIcon(props: React.SVGProps<SVGSVGElement>) {
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
            <rect x="4" y="4" width="16" height="12" rx="2" />
            <path d="M4 16h16" />
            <path d="M8 16v4" />
            <path d="M16 16v4" />
            <path d="M10 9h4" />
        </svg>
    )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
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
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}