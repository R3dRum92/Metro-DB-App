"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Dashboard() {
    const [routes, setRoutes] = useState<any[]>([])
    const [trains, setTrains] = useState<any[]>([])
    const [stations, setStations] = useState<any[]>([])
    const [maintenance, setMaintenance] = useState<any[]>([])
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Fetch data from the backend (using dummy data for now)
    useEffect(() => {
        async function fetchData() {
            // Uncomment and use the backend fetch when the FastAPI server is ready
            // try {
            //     const responseRoutes = await fetch("http://localhost:8000/routes")
            //     const dataRoutes = await responseRoutes.json()
            //     setRoutes(dataRoutes)
            //     const responseTrains = await fetch("http://localhost:8000/trains")
            //     const dataTrains = await responseTrains.json()
            //     setTrains(dataTrains)
            //     const responseStations = await fetch("http://localhost:8000/stations")
            //     const dataStations = await responseStations.json()
            //     setStations(dataStations)
            //     const responseMaintenance = await fetch("http://localhost:8000/maintenance")
            //     const dataMaintenance = await responseMaintenance.json()
            //     setMaintenance(dataMaintenance)
            //     const responseNotifications = await fetch("http://localhost:8000/notifications")
            //     const dataNotifications = await responseNotifications.json()
            //     setNotifications(dataNotifications)
            // } catch (error) {
            //     console.error("Error fetching data:", error)
            // } finally {
            //     setLoading(false)
            // }

            // Dummy Data for Testing
            const dummyRoutes = [
                { route_name: "Route 1", stations: "Station 1, Station 2" },
                { route_name: "Route 2", stations: "Station 3, Station 4" },
                { route_name: "Route 3", stations: "Station 5, Station 6" },
            ]
            const dummyTrains = [
                { train_name: "Train 1", status: "Running" },
                { train_name: "Train 2", status: "Delayed" },
                { train_name: "Train 3", status: "Running" },
            ]
            const dummyStations = [
                { station_name: "Station 1", status: "Active" },
                { station_name: "Station 2", status: "Under Maintenance" },
                { station_name: "Station 3", status: "Active" },
            ]
            const dummyMaintenance = [
                { task: "Track Repair", status: "Completed" },
                { task: "Train Service Check", status: "In Progress" },
                { task: "Station Cleaning", status: "Completed" },
            ]
            const dummyNotifications = [
                { title: "Holiday Schedule", status: "Active" },
                { title: "New Train Added", status: "Active" },
                { title: "Maintenance Alert", status: "Expired" },
            ]

            setRoutes(dummyRoutes)
            setTrains(dummyTrains)
            setStations(dummyStations)
            setMaintenance(dummyMaintenance)
            setNotifications(dummyNotifications)
            setLoading(false)
        }

        fetchData()
    }, [])

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-6 space-y-8">
            {/* Dashboard Header */}
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center text-black">Admin Dashboard</CardTitle>
                    <CardDescription className="text-center text-lg text-gray-700">Welcome to the Metro Admin Dashboard</CardDescription>
                </CardHeader>
            </Card>

            {/* Sidebar and Main Content Section */}
            <div className="container mx-auto flex min-h-screen p-4 space-x-6">
                {/* Sidebar - 1/3 of the page */}
                <div className="w-1/3">
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-black">Management Sections</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full table-auto">
                                    <tbody>
                                        {[
                                            { href: "/protected/user-manage", label: "User Management" },
                                            { href: "/protected/station-manage", label: "Station Management" },
                                            { href: "/protected/train-manage", label: "Train Management" },
                                            { href: "/protected/route-manage", label: "Route Management" },
                                            { href: "/protected/ticketing-pricing", label: "Ticketing & Pricing" },
                                            { href: "/protected/reporting-analytics", label: "Reporting & Analytics" },
                                            { href: "/protected/maintenance-operations", label: "Maintenance & Operations" },
                                            { href: "/protected/support-feedback", label: "Support & Feedback" },
                                        ].map((item, index) => (
                                            <tr key={index} className="border-t border-gray-300">
                                                <td className="p-2">
                                                    <Link
                                                        href={item.href}
                                                        className="block w-full text-stone-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                                                    >
                                                        {item.label}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>


                {/* Main Content - 2/3 of the page */}
                <div className="w-2/3 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-center text-black">Recent Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                {/* Displaying first 5 rows of the Route table */}
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <h3 className="text-lg font-semibold text-center">Routes</h3>
                                    <Table>

                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Route Name</TableHead>
                                                <TableHead>Stations</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {routes.slice(0, 5).map((route, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{route.route_name}</TableCell>
                                                    <TableCell>{route.stations}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="flex justify-center mt-4">
                                        <Link href="/protected/route-manage" className="text-stone-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-center">Manage Routes</Link>
                                    </div>
                                </div>

                                {/* Displaying first 5 rows of the Train table */}
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <h3 className="text-lg font-semibold text-center">Trains</h3>
                                    <Table>

                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Train Name</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {trains.slice(0, 5).map((train, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{train.train_name}</TableCell>
                                                    <TableCell>{train.status}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="flex justify-center mt-4">
                                        <Link href="/protected/train-manage" className="text-stone-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">Manage Trains</Link>
                                    </div>
                                </div>
                                {/* Displaying first 5 rows of the Station table */}
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <h3 className="text-lg font-semibold text-center">Stations</h3>
                                    <Table>

                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Station Name</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stations.slice(0, 5).map((station, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{station.station_name}</TableCell>
                                                    <TableCell>{station.status}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="flex justify-center mt-4">
                                        <Link href="/protected/station-manage" className="text-stone-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">Manage Stations</Link>
                                    </div>
                                </div>

                                {/* Displaying first 5 rows of Maintenance & Operations */}
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <h3 className="text-lg font-semibold text-center">Maintenance & Operations</h3>
                                    <Table>

                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Task</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {maintenance.slice(0, 5).map((task, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{task.task}</TableCell>
                                                    <TableCell>{task.status}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="flex justify-center mt-4">
                                        <Link href="/protected/maintenance-operations" className="text-stone-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">Manage Maintenance</Link>
                                    </div>
                                </div>

                                {/* Displaying Notifications */}
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <h3 className="text-lg font-semibold text-center">Notifications</h3>
                                    <Table>

                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {notifications.slice(0, 5).map((notification, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{notification.title}</TableCell>
                                                    <TableCell>{notification.status}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="flex justify-center mt-4">
                                        <Link href="/protected/support-feedback" className="text-stone-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">Manage Notifications</Link>
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
