"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Icons } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Route, Station } from "../page"

// Form schema for validation
const formSchema = z.object({
    route_name: z.string().max(100, "Route Name must be less than 100 characters"),
    start_station_id: z.string().max(50, "Start Station must be less than 50 characters"),
    end_station_id: z.string().max(50, "End Station must be less than 50 characters"),
})

const stopFormSchema = z.object({
    stop_int: z.string(),
    station_id: z.string()
})

export type addStopActionResult = {
    success?: boolean
    message?: string
    errors?: Record<string, string[]>
}

export async function addStop(formData: FormData, route_id: string): Promise<addStopActionResult> {
    const validatedFields = stopFormSchema.safeParse({
        stop_int: formData.get("stop_int"),
        station_id: formData.get("station_id")
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { stop_int, station_id } = validatedFields.data

    try {
        const response = await fetch("http://localhost:8000/add_stop", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                route_id,
                stop_int,
                station_id,
            })
        })

        if (!response.ok) {
            const error = await response.json()
            console.log(error.detail)
            return {
                success: false,
                message: "Adding Routes Failed",
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
            errors: { form: ["Network error occurred"] }
        }
    }
}


export default function EditRoute() {
    const params = useParams()
    const route_id = String(params.id)

    const [route, setRoute] = useState<Route | null>(null)
    const [stations, setStations] = useState<Station[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState({ type: "", content: "" })
    const [stopModal, setStopModal] = useState<boolean>(false)

    // Form setup
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            route_name: "",
            start_station_id: "",
            end_station_id: "",
        },
    })

    const stopForm = useForm<z.infer<typeof stopFormSchema>>({
        resolver: zodResolver(stopFormSchema),
        defaultValues: {
            stop_int: "",
            station_id: "",
        }
    })

    function onAddStop(values: z.infer<typeof stopFormSchema>) {
        startTransition(async () => {
            const formData = new FormData()
            Object.entries(values).forEach(([Key, value]) => formData.append(Key, value))

            console.log(values)

            const result = await addStop(formData, route_id)
            console.log(result)
            if (result?.errors) {

            } else {
                form.reset()
                toggleStopModal()
            }
        })
    }

    const toggleStopModal = () => {
        setStopModal(!stopModal)
    }

    // Fetch stations
    useEffect(() => {
        const fetchStations = async () => {
            try {
                const response = await fetch("http://localhost:8000/stations")
                const data = await response.json()
                setStations(data)
            } catch (error) {
                console.error("Error fetching stations:", error)
                setMessage({ type: "error", content: "Failed to load stations" })
            }
        }

        fetchStations()
    }, [])


    // Fetch route details
    useEffect(() => {
        const fetchRouteDetails = async () => {
            if (!route_id) return

            try {
                const response = await fetch(`http://localhost:8000/routes/${route_id}`)

                if (!response.ok) {
                    throw new Error(`Error fetching route: ${response.statusText}`)
                }

                const data = await response.json()
                console.log(data)
                // Add stops data if not already included
                const routeWithStops = data
                setRoute(routeWithStops)

                // Set form values
                form.reset({
                    route_name: data.route_name,
                    start_station_id: data.start_station_id,
                    end_station_id: data.end_station_id,
                })
            } catch (error) {
                console.error("Error fetching route details:", error)
                setMessage({ type: "error", content: "Failed to load route details" })
            } finally {
                setIsLoading(false)
            }
        }



        // Fetch route stops

        fetchRouteDetails()
    }, [route_id, form])

    // Handle form submission
    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            try {
                const response = await fetch(`http://localhost:8000/update_route/${route_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(values)
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.detail || "Failed to update route")
                }

                setMessage({ type: "success", content: "Route updated successfully" })

                // Update local state
                setRoute({
                    ...route!,
                    route_name: values.route_name,
                    start_station_id: Number(values.start_station_id),
                    end_station_id: Number(values.end_station_id),
                    start_station_name: stations.find(s => s.id === values.start_station_id)?.name || "",
                    end_station_name: stations.find(s => s.id === values.end_station_id)?.name || ""
                })
            } catch (error) {
                console.error("Error updating route:", error)
                setMessage({ type: "error", content: error instanceof Error ? error.message : "Failed to update route" })
            }
        })
    }

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-primary text-2xl font-bold">Route Details</CardTitle>
                        <Link href="/protected/route-manage">
                            <Button variant="outline">Back to Routes</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : route ? (
                        <>
                            {message.content && (
                                <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                    {message.content}
                                </div>
                            )}

                            {/* Route Information Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-medium mb-4">Route Information</h3>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-500">Route ID</p>
                                        <p className="font-medium">{route.route_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Route Name</p>
                                        <p className="font-medium">{route.route_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Start Station</p>
                                        <p className="font-medium">{route.start_station_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">End Station</p>
                                        <p className="font-medium">{route.end_station_name}</p>
                                    </div>
                                </div>
                            </div>


                            {/* Stops Table Section */}
                            {/*new one*/}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium">Route Stops</h3>
                                    <Button size="sm" variant="outline" onClick={toggleStopModal}>
                                        Add Stop
                                    </Button>
                                </div>

                                {stopModal && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                        <div className="bg-white rounded-md p-6 w-[400px] max-w-md">
                                            <h2 className="text-primary font-bold text-2xl mb-4">Add Stop</h2>

                                            <Form {...form}>
                                                <form onSubmit={stopForm.handleSubmit(onAddStop)} className="space-y-4">
                                                    <FormField
                                                        control={stopForm.control}
                                                        name="stop_int"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Stop No.</FormLabel>
                                                                <FormControl>
                                                                    <Input type="text" placeholder="Enter stop number" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={stopForm.control}
                                                        name="station_id"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Station</FormLabel>
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    defaultValue={field.value}
                                                                    value={field.value}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Select a station" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {isLoading ? (
                                                                            <div className="p-2">Loading...</div>
                                                                        ) : (
                                                                            stations.map((station) => (
                                                                                <SelectItem key={station.id} value={station.id}>
                                                                                    {station.name}
                                                                                </SelectItem>
                                                                            ))
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div className="flex justify-between pt-4">

                                                        <Button
                                                            type="submit"
                                                            className="bg-primary text-white"
                                                            disabled={isPending}
                                                        >
                                                            {isPending ? (
                                                                <>
                                                                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                                                    Adding...
                                                                </>
                                                            ) : (
                                                                "Add Stop"
                                                            )}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </Form>
                                        </div>
                                    </div>
                                )}

                                {route.stops && route.stops.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableCaption>A list of metro routes and their details</TableCaption>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Stop No.</TableHead>
                                                    <TableHead>Station</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead className="text-center">Ticket Price</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {route.stops.map((stop) => (
                                                    <TableRow
                                                        key={stop.route_id || `${stop.station_id}-${stop.stop_int}`}
                                                        className="hover:bg-gray-100"
                                                    >
                                                        <TableCell>
                                                            <Link href={`/protected/route-manage/${route_id}`} className="block w-full h-full">
                                                                {stop.stop_int}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell>{stop.station_name}</TableCell>
                                                        <TableCell>{stop.station_location || stop.station_location}</TableCell>
                                                        <TableCell className="text-center">{stop.ticket_price || "-"}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500">No stops have been added to this route</p>
                                        <Button variant="outline" size="sm" className="mt-2" onClick={toggleStopModal}>
                                            Add Stops
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Edit Form Section */}
                            <div className="pt-6 border-t">
                                <h3 className="text-lg font-medium mb-4">Edit Route</h3>
                                <Form {...stopForm}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="route_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Route Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} defaultValue={route.route_name} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="start_station_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Start Station</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={String(route.start_station_id)}
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select start station" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {stations.map((station) => (
                                                                <SelectItem key={station.id} value={station.id}>
                                                                    {station.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="end_station_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End Station</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={String(route.end_station_id)}
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select end station" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {stations.map((station) => (
                                                                <SelectItem key={station.id} value={station.id}>
                                                                    {station.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
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
                                                    "Update Route"
                                                )}
                                            </Button>

                                        </div>
                                    </form>
                                </Form>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-600">Route not found</p>
                            <Link href="/protected/route-manage">
                                <Button variant="outline" className="mt-4">Back to Routes</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}



