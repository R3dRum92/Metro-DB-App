"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Dashboard() {
    const [routes, setRoutes] = useState<any[]>([])
    const [trains, setTrains] = useState<any[]>([])
    const [stations, setStations] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Fetch data from the backend
    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                //station
                const stationsResponse = await fetch("http://localhost:8000/stations")
                if (!stationsResponse.ok) throw new Error("Failed to fetch stations")
                setStations(await stationsResponse.json())

                //routes
                const routesResponse = await fetch("http://localhost:8000/routes")
                if (!routesResponse.ok) throw new Error("Failed to fetch stations")
                setRoutes(await routesResponse.json())

                //trains
                const trainsResponse = await fetch("http://localhost:8000/trains")
                if (!trainsResponse.ok) throw new Error("Failed to fetch stations")
                setTrains(await trainsResponse.json())

            } catch (error) {
                console.error("Error:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    return (
        <div className="flex flex-col h-screen">
            {/* Full-width header */}
            <Card className="w-full border-primary/20 mb-6">
                <CardHeader className="bg-primary/10">
                    <CardTitle className="text-3xl font-bold text-center text-primary">Admin Dashboard</CardTitle>
                    <CardDescription className="text-center text-lg text-muted-foreground">Welcome to the Metro Admin Dashboard</CardDescription>
                </CardHeader>
            </Card>

            {/* Main content area with sidebar and data display */}
            <div className="flex flex-grow overflow-hidden">
                {/* Sidebar - 1/4 of the page */}
                <div className="w-1/4 bg-card border-r border-primary/20 overflow-y-auto">
                    <div>
                        <CardHeader className="bg-primary/10">
                            <CardTitle className="text-xl font-bold text-center text-primary">Management Sections</CardTitle>
                        </CardHeader>
                        <div className="p-4">
                            <nav>
                                <ul className="space-y-2">
                                    {[
                                        { href: "/protected/user-manage", label: "User Management" },
                                        { href: "/protected/station-manage", label: "Station Management" },
                                        { href: "/protected/train-manage", label: "Train Management" },
                                        { href: "/protected/route-manage", label: "Route Management" },
                                        { href: "/protected/ticket-manage", label: "Ticketing & Pricing" },
                                    ].map((item, index) => (
                                        <li key={index} className="border-b border-primary/10">
                                            <Link
                                                href={item.href}
                                                className="block w-full text-foreground px-4 py-3 rounded-md hover:bg-primary/10 transition-colors"
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Main Content - 3/4 of the page */}
                <div className="w-3/4 overflow-y-auto pb-8">
                    {/* Content Grid with proper spacing to avoid cut-off */}
                    <Card className="border-primary/20 min-h-full rounded-none">
                        <CardHeader className="bg-primary/10">
                            <CardTitle className="text-xl font-bold text-center text-primary">Recent Data</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                {/* Displaying first 5 rows of the Station table */}
                                <div className="p-4 bg-card rounded-lg border border-primary/20">
                                    <h3 className="text-lg font-semibold text-center text-primary mb-2">Stations</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-primary/5">
                                                <TableHead className="text-center">Station Name</TableHead>
                                                <TableHead className="text-center">Location</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stations.slice(0, 5).map((station, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="text-center">{station.name}</TableCell>
                                                    <TableCell className="text-center">{station.location}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="flex justify-center mt-4">
                                        <Link href="/protected/station-manage" className="text-muted-foreground px-4 py-2 rounded-md hover:bg-primary/10 transition-colors">Manage Stations</Link>
                                    </div>
                                </div>


                                {/* Displaying first 5 rows of the Train table */}
                                <div className="p-4 bg-card rounded-lg border border-primary/20">
                                    <h3 className="text-lg font-semibold text-center text-primary mb-2">Trains</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-primary/5">
                                                <TableHead className="text-center">Train Code</TableHead>
                                                <TableHead className="text-center">Route Name</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {trains.slice(0, 5).map((train, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="text-center">{train.train_code}</TableCell>
                                                    <TableCell className="text-center">{train.route_name}</TableCell>
                                                    {/* <TableCell>{train.operational_status}</TableCell> */}
                                                    <TableCell className="text-center">
                                                        <span className={`px-2 py-1 rounded-full text-s font-medium ${train.operational_status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {train.operational_status}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="flex justify-center mt-4">
                                        <Link href="/protected/train-manage" className="text-muted-foreground px-4 py-2 rounded-md hover:bg-primary/10 transition-colors">Manage Trains</Link>
                                    </div>
                                </div>

                                {/* Displaying first 5 rows of the Route table */}
                                <div className="p-4 bg-card rounded-lg border border-primary/20">
                                    <h3 className="text-lg font-semibold text-center text-primary mb-2">Routes</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-primary/5">
                                                <TableHead className="text-center">Route Name</TableHead>
                                                <TableHead className="text-center">Start Station</TableHead>
                                                <TableHead className="text-center">End Station</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {routes.slice(0, 5).map((route, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="text-center">{route.route_name}</TableCell>
                                                    <TableCell className="text-center">{route.start_station_name}</TableCell>
                                                    <TableCell className="text-center">{route.end_station_name}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="flex justify-center mt-4">
                                        <Link href="/protected/route-manage" className="text-muted-foreground px-4 py-2 rounded-md hover:bg-primary/10 transition-colors text-center">Manage Routes</Link>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}