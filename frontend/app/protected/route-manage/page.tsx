"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Icons } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
    route_name: z.string().max(100, "Route Name must be less than 100 characters"),
    start_station_id: z.string().max(50, "Start Station must be less than 50 characters"),
    end_station_id: z.string().max(50, "End Station must be less than 50 characters"),
})

export interface Station {
    station_id: string
    name: string
}

export interface RouteStop {
    route_id: number
    route_name: string
    start_station_name: string
    end_station_name: string
    station_id: number
    station_name: string
    station_location: string
    stop_int: number
    ticket_price: number | null
}

export interface Route {
    route_id: number
    route_name: string
    start_station_id: number
    end_station_id: number
    start_station_name: string
    end_station_name: string
    stops: RouteStop[]
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
    const [searchQuery, setSearchQuery] = useState("")
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
            form.reset()
            toggleModal()
            window.location.reload()
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
        route.start_station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.end_station_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-8">
            <Card className="w-full max-w-6xl shadow-lg">
                <CardHeader className="bg-primary/5 rounded-t-lg py-6">
                    <CardTitle className="text-primary text-3xl font-bold text-center">Route Management System</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <p className="text-center text-lg text-gray-600 mb-8">
                        Here you can manage routes, optimize metro system routes, and monitor route performance.
                    </p>

                    <div className="flex flex-col items-center space-y-6 mb-8">
                        <div className="relative flex-grow w-full max-w-xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <SearchIcon className="h-6 w-6 text-primary/70" />
                            </div>
                            <Input
                                type="search"
                                placeholder="Search routes by name or station"
                                className="pl-12 pr-4 py-3 w-full text-lg border-2 border-primary/20 focus:ring-4 focus:ring-primary/30 rounded-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-6 mt-8">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
                                <Table className="w-full">
                                    <TableCaption className="text-lg font-medium py-4">A list of metro routes and their details</TableCaption>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow className="border-b-2 border-gray-200">
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Route Name</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Start Station</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">End Station</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-center text-gray-700">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStations.map((route) => (
                                            <TableRow
                                                key={route.route_id}
                                                className="hover:bg-primary/5 transition-colors border-b border-gray-200"
                                            >
                                                <TableCell className="py-4 px-6 text-base font-medium">
                                                    <Link href={`/protected/route-manage/${route.route_id}`} className="block w-full h-full text-primary hover:text-primary/80 transition-colors">
                                                        {route.route_name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-base">{route.start_station_name}</TableCell>
                                                <TableCell className="py-4 px-6 text-base">{route.end_station_name}</TableCell>
                                                <TableCell className="py-4 px-6 text-center">
                                                    <Link
                                                        href={`/protected/route-manage/${route.route_id}`}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors hover:underline text-base font-medium"
                                                    >
                                                        Edit
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        <div className="mt-8 text-center">
                            <Button
                                className="px-8 py-6 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-md"
                                onClick={toggleModal}
                            >
                                Add New Route
                            </Button>
                            {isModalOpen && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50" onClick={(e) => {
                                    if (e.target === e.currentTarget) toggleModal();
                                }}>
                                    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                                        <h2 className="text-primary font-bold text-2xl mb-6 text-center">Add New Route</h2>
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                                <FormField control={form.control} name="route_name" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-lg font-medium">Route Name</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="text"
                                                                className="p-3 text-base border-2 rounded-md"
                                                                placeholder="Enter route name"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField
                                                    control={form.control}
                                                    name="start_station_id"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-lg font-medium">Start Station</FormLabel>
                                                            <FormControl>
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    defaultValue={field.value}
                                                                >
                                                                    <SelectTrigger className="w-full p-3 text-base border-2 rounded-md">
                                                                        <SelectValue placeholder="Select a station" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="max-h-80">
                                                                        {isLoading ? (
                                                                            <div className="p-4 text-center">Loading stations...</div>
                                                                        ) : (
                                                                            stations.map((station) => (
                                                                                <SelectItem
                                                                                    key={station.station_id}
                                                                                    value={station.station_id}
                                                                                    className="text-base py-2"
                                                                                >
                                                                                    {station.name}
                                                                                </SelectItem>
                                                                            ))
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField control={form.control} name="end_station_id" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-lg font-medium">End Station</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger className="w-full p-3 text-base border-2 rounded-md">
                                                                <SelectValue placeholder="Select a station" />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-80">
                                                                {isLoading ? (
                                                                    <div className="p-4 text-center">Loading stations...</div>
                                                                ) : (
                                                                    stations.map((station: Station) => (
                                                                        <SelectItem
                                                                            key={station.station_id}
                                                                            value={station.station_id}
                                                                            className="text-base py-2"
                                                                        >
                                                                            {station.name}
                                                                        </SelectItem>
                                                                    ))
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                                <div className="flex gap-4 pt-4">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="w-1/2 p-3 text-base font-medium border-2 rounded-md"
                                                        onClick={toggleModal}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        className="w-1/2 p-3 text-base font-medium bg-primary hover:bg-primary/90 text-white rounded-md"
                                                        disabled={isPending}
                                                    >
                                                        {isPending ? (
                                                            <>
                                                                <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
                                                                Adding...
                                                            </>
                                                        ) : (
                                                            "Add Route"
                                                        )}
                                                    </Button>
                                                </div>
                                            </form>
                                        </Form>
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