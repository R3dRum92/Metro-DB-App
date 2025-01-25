"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"

export default function Dashboard() {
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
                            <ul className="space-y-4">
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
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="block w-full bg-gray-200 text-black text-lg px-4 py-2 rounded-md hover:bg-gray-300 transition"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
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
                                    <table className="w-full mt-2">
                                        <thead>
                                            <tr className="text-center text-gray-700">
                                                <th>Route Name</th>
                                                <th>Stations</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Fetch Route data from backend here later */}
                                            <tr className="text-center">
                                                <td>Route 1</td>
                                                <td>Station 1, Station 2</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Route 2</td>
                                                <td>Station 3, Station 4</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Route 3</td>
                                                <td>Station 5, Station 6</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Route 4</td>
                                                <td>Station 7, Station 8</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Route 5</td>
                                                <td>Station 9, Station 10</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <Link href="/protected/route-manage" className="text-stone-600 hover:text-stone-800 mt-4 block text-center">Manage Routes</Link>
                                </div>

                                {/* Displaying first 5 rows of the Train table */}
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <h3 className="text-lg font-semibold text-center">Trains</h3>
                                    <table className="w-full mt-2">
                                        <thead>
                                            <tr className="text-center text-gray-700">
                                                <th>Train Name</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Fetch Train data from backend here later */}
                                            <tr className="text-center">
                                                <td>Train 1</td>
                                                <td>Running</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Train 2</td>
                                                <td>Delayed</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Train 3</td>
                                                <td>Running</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Train 4</td>
                                                <td>Delayed</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Train 5</td>
                                                <td>Running</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <Link href="/protected/train-manage" className="text-stone-600 hover:text-stone-800 mt-4 block text-center">Manage Trains</Link>
                                </div>

                                {/* Displaying first 5 rows of the Station table */}
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <h3 className="text-lg font-semibold text-center">Stations</h3>
                                    <table className="w-full mt-2">
                                        <thead>
                                            <tr className="text-center text-gray-700">
                                                <th>Station Name</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Fetch Station data from backend here later */}
                                            <tr className="text-center">
                                                <td>Station 1</td>
                                                <td>Active</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Station 2</td>
                                                <td>Under Maintenance</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Station 3</td>
                                                <td>Active</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Station 4</td>
                                                <td>Active</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Station 5</td>
                                                <td>Under Maintenance</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <Link href="/protected/station-manage" className="text-stone-600 hover:text-stone-800 mt-4 block text-center">Manage Stations</Link>
                                </div>

                                {/* Displaying first 5 rows of Maintenance & Operations */}
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <h3 className="text-lg font-semibold text-center">Maintenance & Operations</h3>
                                    <table className="w-full mt-2">
                                        <thead>
                                            <tr className="text-center text-gray-700">
                                                <th>Task</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Fetch Maintenance & Operations data from backend here later */}
                                            <tr className="text-center">
                                                <td>Track Repair</td>
                                                <td>Completed</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Train Service Check</td>
                                                <td>In Progress</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Station Cleaning</td>
                                                <td>Completed</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Signal Maintenance</td>
                                                <td>Scheduled</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Train Inspection</td>
                                                <td>Scheduled</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <Link href="/protected/maintenance-operations" className="text-stone-600 hover:text-stone-800 mt-4 block text-center">Manage Maintenance</Link>
                                </div>

                                {/* Displaying Notifications */}
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <h3 className="text-lg font-semibold text-center">Notifications</h3>
                                    <table className="w-full mt-2">
                                        <thead>
                                            <tr className="text-center text-gray-700">
                                                <th>Title</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Fetch Notifications data from backend here later */}
                                            <tr className="text-center">
                                                <td>Holiday Schedule</td>
                                                <td>Active</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>New Train Added</td>
                                                <td>Active</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Maintenance Alert</td>
                                                <td>Expired</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>Service Disruption</td>
                                                <td>Active</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>System Update</td>
                                                <td>Active</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <Link href="/protected/support-feedback" className="text-stone-600 hover:text-stone-800 mt-4 block text-center">Manage Notifications</Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
