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

const formSchema = z.object({
    name: z.string().max(100, "Station Name must be a less than 100 characters"),
    location: z.string().max(255, "Location must be less than 255 characters"),
    status: z.enum(["active", "inactive", "maintenance", "construction", "planned"])
})

interface Station {
    station_id: number
    name: string
    location: string
    status: string
}

export type stationActionResult = {
    success?: boolean
    message?: string
    errors?: Record<string, string[]>
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
        status: formData.get("status")
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { name, location, status } = validatedFields.data

    try {
        const response = await fetch(`http://localhost:8000/update_station/${stationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                location,
                status
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
            status: "active"
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
            status: station.status as "active" | "inactive" | "maintenance" | "construction" | "planned"
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
            Object.entries(values).forEach(([key, value]) => formData.append(key, value))

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
            Object.entries(values).forEach(([key, value]) => formData.append(key, value))

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

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-primary text-2xl font-bold text-center">Station Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-gray-500 mb-6">
                        Here you can manage stations, view schedules, and monitor station health.
                    </p>

                    {actionMessage && (
                        <div className={`p-3 mb-4 rounded-md ${actionMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {actionMessage.text}
                            <button
                                className="float-right font-bold"
                                onClick={() => setActionMessage(null)}
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col items-center space-y-4 mb-6">
                        <div className="relative flex-grow w-full max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-primary/70" />
                            </div>
                            <Input
                                type="search"
                                placeholder="Search stations by name or location"
                                className="pl-10 pr-4 py-2 w-full border border-primary/20 focus:ring-2 focus:ring-primary/30 rounded-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="active" checked={activeFilter === "active"} onCheckedChange={() => handleCheckboxChange("active")}
                                />
                                <label htmlFor="active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Active
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="inactive" checked={activeFilter === "inactive"} onCheckedChange={() => handleCheckboxChange("inactive")}
                                />
                                <label htmlFor="inactive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Inactive
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="maintenance" checked={activeFilter === "maintenance"} onCheckedChange={() => handleCheckboxChange("maintenance")}
                                />
                                <label htmlFor="maintenance" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Maintenance
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="construction" checked={activeFilter === "construction"} onCheckedChange={() => handleCheckboxChange("construction")}
                                />
                                <label htmlFor="construction" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Construction
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="planned" checked={activeFilter === "planned"} onCheckedChange={() => handleCheckboxChange("planned")}
                                />
                                <label htmlFor="planned" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Planned
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                        {/* Station table */}
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableCaption className="mb-6">A list of metro stations and their details</TableCaption>
                                <TableHeader className="sticky top-0 bg-white" style={{ zIndex: 1 }}>
                                    <TableRow>
                                        <TableHead>Station Name</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStations.map((station) => (
                                        <TableRow key={station.station_id}>
                                            <TableCell>{station.name}</TableCell>
                                            <TableCell>{station.location}</TableCell>
                                            <TableCell>{station.status}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center space-x-2">
                                                    {/* Edit button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditModal(station)}
                                                        className="flex items-center"
                                                    >
                                                        <Edit className="h-4 w-4 mr-1" />
                                                    </Button>

                                                    {/* Delete button */}
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(station.station_id)}
                                                        className="flex items-center"
                                                    >
                                                        <Trash className="h-4 w-4 mr-1" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    {/* Add Station button */}
                    <div className="mt-6 text-center">
                        <Button className="px-4 py-2 bg-primary text-white rounded" onClick={toggleAddModal}>Add Station</Button>

                        {/* Add Station Modal */}
                        {isAddModalOpen && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={(e) => {
                                if (e.target === e.currentTarget) toggleAddModal();
                            }}>
                                <div className="bg-white p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                                    <h2 className="text-primary font-bold text-2xl mb-4">Add New Station</h2>
                                    <Form {...addForm}>
                                        <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-6">
                                            {/* Name Field */}
                                            <FormField
                                                control={addForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Station Name</FormLabel>
                                                        <FormControl>
                                                            <Input type="text" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {/* Location Field */}
                                            <FormField
                                                control={addForm.control}
                                                name="location"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Location</FormLabel>
                                                        <FormControl>
                                                            <Input type="text" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Submit Button */}
                                            <div className="flex justify-between">
                                                <Button
                                                    variant="outline"
                                                    onClick={toggleAddModal}
                                                    type="button"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button type="submit" disabled={isPending}>
                                                    {isPending ? (
                                                        <>
                                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
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
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={(e) => {
                                if (e.target === e.currentTarget) closeEditModal();
                            }}>
                                <div className="bg-white p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                                    <h2 className="text-primary font-bold text-2xl mb-4">Edit Station</h2>
                                    <Form {...editForm}>
                                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                                            {/* Name Field */}
                                            <FormField
                                                control={editForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Station Name</FormLabel>
                                                        <FormControl>
                                                            <Input type="text" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {/* Location Field */}
                                            <FormField
                                                control={editForm.control}
                                                name="location"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Location</FormLabel>
                                                        <FormControl>
                                                            <Input type="text" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Status Field */}
                                            <FormField
                                                control={editForm.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Status</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select station status" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                                                <SelectItem value="construction">Construction</SelectItem>
                                                                <SelectItem value="planned">Planned</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Submit Button */}
                                            <div className="flex justify-between">
                                                <Button
                                                    variant="outline"
                                                    onClick={closeEditModal}
                                                    type="button"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button type="submit" disabled={isPending}>
                                                    {isPending ? (
                                                        <>
                                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
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
    )
}

function SearchIcon(props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}