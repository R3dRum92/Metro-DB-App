"use client"

import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import React from "react"

const formSchema = z.object({
    train_code: z.string().max(10, "Train Code must be less than 10 characters"),
    route_id: z.string().max(10, "Route ID must be a valid number"),
    capacity: z.string().max(5, "Capacity must be a valid number"),
    operational_status: z.string().max(20, "Operational status must be less than 20 characters"),
})

interface Train {
    train_id: number
    train_code: string
    route_id: number
    capacity: number
    operational_status: string
    route_name?: string
}

interface Route {
    route_id: number
    route_name: string
    start_station_name: string
    end_station_name: string
}

const fetchRoutes = async () => {
    const response = await fetch("http://localhost:8000/routes")
    const data = await response.json()
    return data
}

export type addTrainActionResult = {
    success?: boolean
    message?: string
    errors?: Record<string, string[]>
}

export async function addTrain(formData: FormData):
    Promise<addTrainActionResult> {
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
            console.log(error.detail)
            return {
                success: false,
                message: "Adding Trains Failed",
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

export default function TrainManage() {
    const [trains, setTrains] = useState<Train[]>([])
    const [routes, setRoutes] = useState<Route[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            train_code: "",
            route_id: "",
            capacity: "",
            operational_status: "",
        },
    })

    useEffect(() => {
        async function loadRoutes() {
            try {
                const routeData = await fetchRoutes()
                setRoutes(routeData)
            } catch (error) {
                console.error("Error fetching routes:", error)
            }
        }
        loadRoutes()
    }, [])

    useEffect(() => {
        async function fetchTrains() {
            try {
                const response = await fetch("http://localhost:8000/trains")
                if (!response.ok) {
                    throw new Error(`Error fetching trains: ${response.statusText}`)
                }
                const data: Train[] = await response.json()
                setTrains(data)
            } catch (error) {
                console.error("Error fetching trains:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTrains()
    }, [])

    const getRouteNameById = (routeId: number) => {
        const route = routes.find(r => r.route_id === routeId)
        return route ? route.route_name : `Unknown Route (${routeId})`
    }

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen)
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(() => {
            console.log(values)
            form.reset()
            toggleModal()
        })
    }

    const filteredTrains = trains.filter((train) =>
        train.train_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        train.operational_status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-primary text-2xl font-bold text-center">Train Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-gray-500 mb-6">Here you can monitor train statuses, manage schedules, and perform maintenance tasks.</p>
                    <div className="flex flex-col items-center space-y-4 mb-6">
                        <div className="relative flex-grow w-full max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-primary/70" />
                            </div>
                            <Input
                                type="search"
                                placeholder="Search trains by code or status"
                                className="pl-10 pr-4 py-2 w-full border border-primary/20 focus:ring-2 focus:ring-primary/30 rounded-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-4 mt-6">
                        {loading ? (
                            <p>Loading trains...</p>
                        ) : (
                            <Table>
                                <TableCaption>A list of metro trains and their details</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Train Code</TableHead>
                                        <TableHead>Route Name</TableHead>
                                        <TableHead>Capacity</TableHead>
                                        <TableHead>Operational Status</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTrains.map((train) => (
                                        <TableRow key={train.train_id}>
                                            <TableCell>{train.train_code}</TableCell>
                                            <TableCell>{getRouteNameById(train.route_id)}</TableCell>
                                            <TableCell>{train.capacity}</TableCell>
                                            <TableCell>{train.operational_status}</TableCell>
                                            <TableCell className="text-center">
                                                <Link href={`/protected/edit-train/${train.train_id}`} className="text-blue-500 hover:underline">Edit</Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        <div className="mt-6 text-center">
                            <Button className="px-4 py-2 bg-primary text-white rounded" onClick={toggleModal}>Add Train</Button>
                            {isModalOpen && (
                                <div style={modalStyles}>
                                    <div style={modalContentStyles}>
                                        <h2 className="text-primary font-bold text-2xl">Train Form</h2>
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                                <FormField control={form.control} name="train_code" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Train Code</FormLabel>
                                                        <FormControl><Input type="text" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="route_id" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Route ID</FormLabel>
                                                        <FormControl><Input type="text" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="capacity" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Capacity</FormLabel>
                                                        <FormControl><Input type="text" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="operational_status" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Operational Status</FormLabel>
                                                        <FormControl><Input type="text" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <Button type="submit" className="w-full">Add Train</Button>
                                            </form>
                                        </Form>
                                        <button onClick={toggleModal} style={closeButtonStyles}>Close</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const modalStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
}

const modalContentStyles: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    width: '300px'
}

const closeButtonStyles: React.CSSProperties = {
    marginTop: '10px',
    backgroundColor: 'red',
    color: 'white',
    fontSize: '12px',
    border: 'none',
    padding: '8px',
    borderRadius: '5px'
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
