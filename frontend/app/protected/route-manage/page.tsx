"use client"

import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icons } from "@/components/ui/icons"

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
    route_name: z.string().max(100, "Route Name must be less than 100 characters"),
    start_station_id: z.string().max(50, "Start Station must be less than 50 characters"),
    end_station_id: z.string().max(50, "End Station must be less than 50 characters"),
})

interface Station {
    id: string
    name: string
}

interface Route {
    route_id: number
    route_name: string
    start_station_id: string
    end_station_id: string
}

const fetchStations = async () => {
    const response = await fetch("http://localhost:8000/stations")
    const data = await response.json()
    return data
}

export type addRouteActionResult = {
    success?: boolean
    message?: string
    errors?: Record<string, string[]>
}



export async function addRoute(formData: FormData): Promise<addRouteActionResult> {
    const validatedFields = formSchema.safeParse({
        route_name: formData.get("route_name"),
        start_station_id: formData.get("start_station_id"),
        end_station_id: formData.get("end_station_id")
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { route_name, start_station_id, end_station_id } = validatedFields.data

    try {
        const response = await fetch("http://localhost:8000/add_route", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                route_name,
                start_station_id,
                end_station_id
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

export default function RouteManage() {
    const [routes, setRoutes] = useState<Route[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [stations, setStations] = useState<Station[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const getStations = async () => {
            try {
                const data = await fetchStations()
                console.log(data)
                setStations(data)
            } catch (error) {
                console.error("Error fetching stations:", error)
            } finally {
                setIsLoading(false)
            }
        }

        getStations()
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            route_name: "",
            start_station_id: "",
            end_station_id: "",
        },
    })

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen)
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            const formData = new FormData()
            Object.entries(values).forEach(([Key, value]) => formData.append(Key, value))

            console.log(values)

            const result = await addRoute(formData)
            console.log(result)
            if (result?.errors) {

            } else {
                form.reset()
                toggleModal()
            }
        })
    }

    useEffect(() => {
        async function fetchRoutes() {
            try {
                const response = await fetch("http://localhost:8000/routes")

                console.log(response)

                if (!response.ok) {
                    throw new Error(`Error fetching routes: ${response.statusText}`)
                }

                const data: Route[] = await response.json()
                console.log(data)
                setRoutes(data)
            } catch (error) {
                console.error("Error fetching routes:", error)
                return null
            } finally {
                setLoading(false)
            }
        }
        fetchRoutes()
    }, [])

    const filteredStations = routes.filter((route) =>
        route.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.start_station_id.toLowerCase().includes(searchQuery.toLowerCase()) || route.end_station_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-primary text-2xl font-bold text-center">Route Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-gray-500 mb-6">
                        Here you can manage routes, optimize metro system routes, and monitor route performance.
                    </p>

                    <div className="flex flex-col items-center space-y-4 mb-6">
                        <div className="relative flex-grow w-full max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-primary/70" />
                            </div>
                            <Input
                                type="search"
                                placeholder="Search routes by name or station"
                                className="pl-10 pr-4 py-2 w-full border border-primary/20 focus:ring-2 focus:ring-primary/30 rounded-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 mt-6">
                        {loading ? (
                            <p>Loading routes...</p>
                        ) : (
                            <Table>
                                <TableCaption>A list of metro routes and their details</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Route Name</TableHead>
                                        <TableHead>Start Station</TableHead>
                                        <TableHead>End Station</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStations.map((route) => (
                                        <TableRow key={route.route_id}>
                                            <TableCell>{route.route_name}</TableCell>
                                            <TableCell>{route.start_station_name}</TableCell>
                                            <TableCell>{route.end_station_name}</TableCell>
                                            <TableCell className="text-center">
                                                <Link href={`/protected/edit-route/${route.route_id}`} className="text-blue-500 hover:underline">
                                                    Edit
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        <div className="mt-6 text-center">
                            <Button className="px-4 py-2 bg-primary text-white rounded" onClick={toggleModal}>Add Route</Button>
                            {isModalOpen && (
                                <div style={modalStyles}>
                                    <div style={modalContentStyles}>
                                        <h2 className="text-primary font-bold text-2xl">Route Form</h2>
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                                <FormField control={form.control} name="route_name" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Route Name</FormLabel>
                                                        <FormControl>
                                                            <Input type="text" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="start_station_id" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Start Station</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                            <SelectTrigger className="w-[280px]">
                                                                <SelectValue placeholder="Select a station" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {isLoading ? (
                                                                    <div>Loading...</div>
                                                                ) : (
                                                                    stations.map((station: Station) => (
                                                                        <SelectItem value={station.id}>
                                                                            {station.name}
                                                                        </SelectItem>
                                                                    ))
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="end_station_id" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>End Station</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                            <SelectTrigger className="w-[280px]">
                                                                <SelectValue placeholder="Select a station" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {isLoading ? (
                                                                    <div>Loading...</div>
                                                                ) : (
                                                                    stations.map((station: Station) => (
                                                                        <SelectItem key={station.id} value={station.id}>
                                                                            {station.name}
                                                                        </SelectItem>
                                                                    ))
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                                <Button type="submit" className="w-full" disabled={isPending}>
                                                    {isPending ? (
                                                        <>
                                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                                            Adding...
                                                        </>
                                                    ) : (
                                                        "Add Route"
                                                    )}
                                                </Button>
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
    alignItems: 'center',
}

const modalContentStyles: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    width: '300px',
}

const closeButtonStyles: React.CSSProperties = {
    marginTop: '10px',
    backgroundColor: 'red',
    color: 'white',
    fontSize: '12px',
    border: 'none',
    padding: '6px',
    borderRadius: '5px',
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
