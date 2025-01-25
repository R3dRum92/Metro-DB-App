"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Route {
    route_id: number
    route_name: string
    start_station_id: string
    end_station_id: string
}

export default function RouteManage() {
    const [routes, setRoutes] = useState<Route[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Fetch the list of routes from the FastAPI backend (dummy data for now)
    useEffect(() => {
        async function fetchRoutes() {
            // Uncomment and use this once the backend is ready
            // try {
            //     const response = await fetch("http://localhost:8000/routes")
            //     const data = await response.json()
            //     setRoutes(data)
            // } catch (error) {
            //     console.error("Error fetching routes:", error)
            // } finally {
            //     setLoading(false)
            // }

            // Dummy data for testing
            const dummyRoutes = [
                {
                    route_id: 1,
                    route_name: "Route 1",
                    start_station_id: "Station A",
                    end_station_id: "Station B",
                },
                {
                    route_id: 2,
                    route_name: "Route 2",
                    start_station_id: "Station B",
                    end_station_id: "Station C",
                },
                {
                    route_id: 3,
                    route_name: "Route 3",
                    start_station_id: "Station A",
                    end_station_id: "Station C",
                },
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
                    <CardTitle className="text-2xl font-bold text-center">Route Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-gray-500">
                        Here you can manage routes, optimize metro system routes, and monitor route performance.
                    </p>
                    <div className="space-y-4 mt-6">
                        {/* Route table */}
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
                                                {/* Edit route link */}
                                                <Link
                                                    href={`/protected/edit-route/${route.route_id}`}
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    Edit
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {/* Add Route button */}
                        <div className="mt-6 text-center">
                            <Button className="px-4 py-2 bg-black text-white rounded">Add Route</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
