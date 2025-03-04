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

export default function RouteManage() {
    const [routes, setRoutes] = useState<Route[]>([])
    const [loading, setLoading] = useState<boolean>(true)
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
            console.log(values)
            form.reset()
            toggleModal()
        })
    }

    useEffect(() => {
        async function fetchRoutes() {
            const dummyRoutes = [
                { route_id: 1, route_name: "Route 1", start_station_id: "Station A", end_station_id: "Station B" },
                { route_id: 2, route_name: "Route 2", start_station_id: "Station B", end_station_id: "Station C" },
                { route_id: 3, route_name: "Route 3", start_station_id: "Station A", end_station_id: "Station C" },
            ]
            setRoutes(dummyRoutes)
            setLoading(false)
        }
        fetchRoutes()
    }, [])

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-primary text-2xl font-bold text-center">Route Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-gray-500">
                        Here you can manage routes, optimize metro system routes, and monitor route performance.
                    </p>
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
                                    {routes.map((route) => (
                                        <TableRow key={route.route_id}>
                                            <TableCell>{route.route_name}</TableCell>
                                            <TableCell>{route.start_station_id}</TableCell>
                                            <TableCell>{route.end_station_id}</TableCell>
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
                                                        <Select>
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
                                                <FormField control={form.control} name="end_station_id" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>End Station</FormLabel>
                                                        <Select>
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
