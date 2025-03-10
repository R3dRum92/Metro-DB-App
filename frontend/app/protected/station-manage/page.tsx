"use client"

import React, { ChangeEvent, useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash, Edit } from "lucide-react"
import AdminGuard from "@/components/AdminGuard"

const formSchema = z.object({
    name: z.string().max(100, "Station Name must be a less than 100 characters"),
    location: z.string().max(255, "Location must be less than 255 characters"),
    status: z.enum(["active", "inactive", "maintenance", "construction", "planned"]),
    is_hub: z.boolean().default(false),
    primary_route_id: z.string().optional(),
    secondary_route_id: z.string().optional()
})

interface Station {
    station_id: number
    name: string
    location: string
    status: string
    is_hub?: boolean
    primary_route_id?: string
    secondary_route_id?: string
}

export type stationActionResult = {
    success?: boolean
    message?: string
    errors?: Record<string, string[]>
}

interface Route {
    route_id: string
    route_name: string
    start_station_name: string
    end_station_name: string
}

type Filters = "active" | "inactive" | "maintenance" | "construction" | "planned" | "none"

export async function addStation(formData: FormData): Promise<stationActionResult> {
    const validatedFields = formSchema.safeParse({
        name: formData.get("name"),
        location: formData.get("location"),
        status: "planned"
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { name, location } = validatedFields.data

    try {
        const response = await fetch("http://localhost:8000/add_station", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                location,
            })
        })

        if (!response.ok) {
            const error = await response.json()
            console.log(error.detail)
            return {
                success: false,
                message: "Adding Station Failed",
                errors: error.detail.errors || { form: ["Server error occurred"] }
            }
        } else {
            window.location.reload()
        }

        const data = await response.json()

        return {
            success: true,
            message: data.message || "Successful"
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

export async function updateStation(formData: FormData, stationId: number): Promise<stationActionResult> {
    const validatedFields = formSchema.safeParse({
        name: formData.get("name"),
        location: formData.get("location"),
        status: formData.get("status"),
        is_hub: formData.get("is_hub") === "true",
        primary_route_id: formData.get("is_hub") === "true" ? formData.get("primary_route_id") : undefined,
        secondary_route_id: formData.get("is_hub") === "true" ? formData.get("secondary_route_id") : undefined
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { name, location, status, is_hub, primary_route_id, secondary_route_id } = validatedFields.data

    try {
        const response = await fetch(`http://localhost:8000/update_station/${stationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                location,
                status,
                is_hub,
                primary_route_id,
                secondary_route_id
            })
        })

        if (!response.ok) {
            const error = await response.json()
            console.log(error.detail)
            return {
                success: false,
                message: "Updating Station Failed",
                errors: error.detail.errors || { form: ["Server error occurred"] }
            }
        }

        const data = await response.json()

        return {
            success: true,
            message: data.message || "Station Updated Successfully"
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

export async function deleteStation(stationId: number): Promise<stationActionResult> {
    try {
        const response = await fetch(`http://localhost:8000/delete_station/${stationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (!response.ok) {
            const error = await response.json()
            return {
                success: false,
                message: "Deleting Station Failed",
                errors: error.detail?.errors || { form: ["Server error occurred"] }
            }
        }

        const data = await response.json()

        return {
            success: true,
            message: data.message || "Station Deleted Successfully"
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

export default function StationManage() {
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isPending, startTransition] = useTransition()
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [currentStation, setCurrentStation] = useState<Station | null>(null)
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [routes, setRoutes] = useState<Route[]>([])
    const [isRoutesLoading, setIsRoutesLoading] = useState<boolean>(true)

    const [activeFilter, setActiveFilter] = useState<Filters>("none")

    const addForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            location: "",
            status: "active"
        },
    })

    const editForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            location: "",
            status: "active",
            is_hub: false,
            primary_route_id: undefined,
            secondary_route_id: undefined
        },
    })

    const toggleAddModal = () => {
        setIsAddModalOpen(!isAddModalOpen);
    };

    const openEditModal = (station: Station) => {
        setCurrentStation(station);
        editForm.reset({
            name: station.name,
            location: station.location,
            status: station.status as "active" | "inactive" | "maintenance" | "construction" | "planned",
            is_hub: station.is_hub || false,
            primary_route_id: station.primary_route_id,
            secondary_route_id: station.secondary_route_id
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setCurrentStation(null);
    };

    function onAddSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            const formData = new FormData()
            Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)))

            const result = await addStation(formData)
            if (result?.errors) {
                setActionMessage({ type: 'error', text: result.message || 'Failed to add station' });
            } else {
                addForm.reset()
                toggleAddModal()
                fetchStations()
                setActionMessage({ type: 'success', text: 'Station added successfully' });
            }
        })
    }

    function onEditSubmit(values: z.infer<typeof formSchema>) {
        if (!currentStation) return;

        startTransition(async () => {
            const formData = new FormData()
            Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)))

            const result = await updateStation(formData, currentStation.station_id)
            if (result?.errors) {
                setActionMessage({ type: 'error', text: result.message || 'Failed to update station' });
            } else {
                editForm.reset()
                closeEditModal()
                fetchStations()
                setActionMessage({ type: 'success', text: 'Station updated successfully' });
            }
        })
    }

    function handleDelete(stationId: number) {
        if (confirm("Are you sure you want to delete this station?")) {
            startTransition(async () => {
                const result = await deleteStation(stationId)
                if (result?.success) {
                    fetchStations()
                    setActionMessage({ type: 'success', text: 'Station deleted successfully' });
                } else {
                    setActionMessage({ type: 'error', text: result.message || 'Failed to delete station' });
                }
            })
        }
    }

    // Fetch the list of stations from the FastAPI backend
    const fetchStations = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:8000/stations")
            if (!response.ok) {
                throw new Error(`Error fetching stations: ${response.statusText}`)
            }
            const data: Station[] = await response.json()
            setStations(data)
        } catch (error) {
            console.error("Error fetching stations:", error)
            setActionMessage({ type: 'error', text: 'Failed to fetch stations' });
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStations()
    }, [])

    const handleCheckboxChange = (filter: Filters) => {
        if (activeFilter === filter) {
            setActiveFilter("none") // Uncheck if already selected
        } else {
            setActiveFilter(filter) // Set the selected filter
        }
    }

    const filteredStations = stations.filter((station) => {
        const matchesSearchQuery = station.name.toLowerCase().includes(searchQuery.toLowerCase()) || station.location.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCheckboxes = (activeFilter === "active" && station.status === "active") ||
            (activeFilter === "inactive" && station.status === "inactive") ||
            (activeFilter === "maintenance" && station.status === "maintenance") ||
            (activeFilter === "construction" && station.status === "construction") ||
            (activeFilter === "planned" && station.status === "planned") ||
            activeFilter === "none"

        return matchesSearchQuery && matchesCheckboxes
    });

    useEffect(() => {
        async function loadRoutes() {
            setIsRoutesLoading(true);
            try {
                const response = await fetch("http://localhost:8000/routes");
                if (!response.ok) {
                    throw new Error(`Error fetching routes: ${response.statusText}`);
                }
                const data = await response.json();
                setRoutes(data);
            } catch (error) {
                console.error("Error fetching routes:", error);
                setActionMessage({ type: 'error', text: 'Failed to load routes' });
            } finally {
                setIsRoutesLoading(false);
            }
        }
        loadRoutes();
    }, []);

    return (
        <AdminGuard>
            <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-8">
                <Card className="w-full max-w-6xl shadow-lg">
                    <CardHeader className="bg-primary/5 rounded-t-lg py-6">
                        <div className="flex items-center justify-center mb-2">
                            <StationIcon className="text-primary mr-3" width={32} height={32} strokeWidth="2.5" />
                            <CardTitle className="text-primary text-3xl font-bold text-center">Station Management</CardTitle>
                        </div>
                        <p className="text-center text-lg text-gray-600 mt-2">
                            Here you can manage stations, view schedules, and monitor station health.
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
                                    placeholder="Search stations by name or location"
                                    className="pl-12 pr-4 py-3 w-full text-lg border-2 border-primary/20 focus:ring-4 focus:ring-primary/30 rounded-lg"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 p-2 bg-gray-50 rounded-lg border border-gray-100 w-full">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="active"
                                        checked={activeFilter === "active"}
                                        onCheckedChange={() => handleCheckboxChange("active")}
                                        className="h-5 w-5"
                                    />
                                    <label htmlFor="active" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Active
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="inactive"
                                        checked={activeFilter === "inactive"}
                                        onCheckedChange={() => handleCheckboxChange("inactive")}
                                        className="h-5 w-5"
                                    />
                                    <label htmlFor="inactive" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Inactive
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="maintenance"
                                        checked={activeFilter === "maintenance"}
                                        onCheckedChange={() => handleCheckboxChange("maintenance")}
                                        className="h-5 w-5"
                                    />
                                    <label htmlFor="maintenance" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Maintenance
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="construction"
                                        checked={activeFilter === "construction"}
                                        onCheckedChange={() => handleCheckboxChange("construction")}
                                        className="h-5 w-5"
                                    />
                                    <label htmlFor="construction" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Construction
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="planned"
                                        checked={activeFilter === "planned"}
                                        onCheckedChange={() => handleCheckboxChange("planned")}
                                        className="h-5 w-5"
                                    />
                                    <label htmlFor="planned" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Planned
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden border border-gray-200 rounded-lg shadow-md">
                            <div className="max-h-96 overflow-y-auto">
                                {/* Station table */}
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <Table>
                                        <TableCaption className="text-lg font-medium py-4">
                                            A list of metro stations and their details
                                        </TableCaption>
                                        <TableHeader className="sticky top-0 bg-gray-50" style={{ zIndex: 1 }}>
                                            <TableRow className="border-b-2 border-gray-200">
                                                <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 w-1/4">Station Name</TableHead>
                                                <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 w-1/4">Location</TableHead>
                                                <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 w-1/4">Status</TableHead>
                                                <TableHead className="py-4 px-6 text-lg font-bold text-center text-gray-700 w-1/4">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredStations.map((station) => (
                                                <TableRow
                                                    key={station.station_id}
                                                    className="hover:bg-primary/5 transition-colors border-b border-gray-200"
                                                >
                                                    <TableCell className="py-4 px-6 text-base font-medium">{station.name}</TableCell>
                                                    <TableCell className="py-4 px-6 text-base">{station.location}</TableCell>
                                                    <TableCell className="py-4 px-6 text-base">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${station.status === 'active' ? 'bg-green-100 text-green-800' :
                                                            station.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                                station.status === 'construction' ? 'bg-blue-100 text-blue-800' :
                                                                    station.status === 'planned' ? 'bg-purple-100 text-purple-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {station.status.charAt(0).toUpperCase() + station.status.slice(1)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex justify-center space-x-3">
                                                            {/* Edit button */}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openEditModal(station)}
                                                                className="flex items-center h-10 px-4 border-2 hover:bg-gray-100 transition-colors"
                                                            >
                                                                <Edit className="h-5 w-5 mr-1" />
                                                                <span>Edit</span>
                                                            </Button>

                                                            {/* Delete button */}
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDelete(station.station_id)}
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

                        {/* Add Station button */}
                        <div className="mt-8 text-center">
                            <Button
                                className="px-8 py-3 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-md"
                                onClick={toggleAddModal}
                            >
                                Add Station
                            </Button>

                            {/* Add Station Modal */}
                            {isAddModalOpen && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50" onClick={(e) => {
                                    if (e.target === e.currentTarget) toggleAddModal();
                                }}>
                                    <div className="bg-white p-8 rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                                        <h2 className="text-primary font-bold text-2xl mb-6 text-center">Add New Station</h2>
                                        <Form {...addForm}>
                                            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-6">
                                                {/* Name Field */}
                                                <FormField
                                                    control={addForm.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Station Name</FormLabel>
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
                                                {/* Location Field */}
                                                <FormField
                                                    control={addForm.control}
                                                    name="location"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Location</FormLabel>
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

                                                {/* Submit Button */}
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
                                                            "Add Station"
                                                        )}
                                                    </Button>
                                                </div>
                                            </form>
                                        </Form>
                                    </div>
                                </div>
                            )}

                            {/* Edit Station Modal */}
                            {isEditModalOpen && currentStation && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50" onClick={(e) => {
                                    if (e.target === e.currentTarget) closeEditModal();
                                }}>
                                    <div className="bg-white p-8 rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                                        <h2 className="text-primary font-bold text-2xl mb-6 text-center">Edit Station</h2>
                                        <Form {...editForm}>
                                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                                                {/* Name Field */}
                                                <FormField
                                                    control={editForm.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Station Name</FormLabel>
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
                                                {/* Location Field */}
                                                <FormField
                                                    control={editForm.control}
                                                    name="location"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Location</FormLabel>
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

                                                {/* Status Field */}
                                                <FormField
                                                    control={editForm.control}
                                                    name="status"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Status</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="p-3 text-base border-2 rounded-md">
                                                                        <SelectValue placeholder="Select station status" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="max-h-80">
                                                                    <SelectItem value="active" className="text-base py-2">Active</SelectItem>
                                                                    <SelectItem value="inactive" className="text-base py-2">Inactive</SelectItem>
                                                                    <SelectItem value="maintenance" className="text-base py-2">Maintenance</SelectItem>
                                                                    <SelectItem value="construction" className="text-base py-2">Construction</SelectItem>
                                                                    <SelectItem value="planned" className="text-base py-2">Planned</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage className="text-sm font-medium" />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Hub Checkbox */}
                                                <FormField
                                                    control={editForm.control}
                                                    name="is_hub"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border-2 p-4">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                    className="h-5 w-5 mt-1"
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="text-base font-medium">Is this a Hub Station?</FormLabel>
                                                                <p className="text-sm text-gray-500">
                                                                    Hub stations connect multiple routes
                                                                </p>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Conditional Hub Route Fields */}
                                                {editForm.watch("is_hub") && (
                                                    <div className="space-y-4 p-4 border-2 rounded-md bg-gray-50">
                                                        <h3 className="font-medium text-base">Hub Routes</h3>
                                                        {/* Primary Route Field */}
                                                        <FormField
                                                            control={editForm.control}
                                                            name="primary_route_id"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-base font-medium">Primary Route</FormLabel>
                                                                    <Select
                                                                        onValueChange={field.onChange}
                                                                        defaultValue={field.value}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="p-3 text-base border-2 rounded-md">
                                                                                <SelectValue placeholder="Select primary route" />
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

                                                        {/* Secondary Route Field */}
                                                        <FormField
                                                            control={editForm.control}
                                                            name="secondary_route_id"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-base font-medium">Secondary Route</FormLabel>
                                                                    <Select
                                                                        onValueChange={field.onChange}
                                                                        defaultValue={field.value}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="p-3 text-base border-2 rounded-md">
                                                                                <SelectValue placeholder="Select secondary route" />
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
                                                    </div>
                                                )}

                                                {/* Submit Button */}
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
                                                            "Update Station"
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

// Station Icon Component
function StationIcon(props: React.SVGProps<SVGSVGElement>) {
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
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M9 9h6v6H9z" />
            <path d="M15 4v16" />
            <path d="M9 4v16" />
            <path d="M4 9h16" />
            <path d="M4 15h16" />
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