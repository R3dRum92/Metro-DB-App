"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Train {
    train_id: number
    train_code: string
    route_id: number
    capacity: number
    operational_status: string
}

export default function TrainManage() {
    const [trains, setTrains] = useState<Train[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Fetch the list of trains from the FastAPI backend (dummy data for now)
    useEffect(() => {
        async function fetchTrains() {
            // Uncomment and use this once the backend is ready
            // try {
            //     const response = await fetch("http://localhost:8000/trains")
            //     const data = await response.json()
            //     setTrains(data)
            // } catch (error) {
            //     console.error("Error fetching trains:", error)
            // } finally {
            //     setLoading(false)
            // }

            // Dummy data for testing
            const dummyTrains = [
                {
                    train_id: 1,
                    train_code: "T001",
                    route_id: 1,
                    capacity: 100,
                    operational_status: "Active",
                },
                {
                    train_id: 2,
                    train_code: "T002",
                    route_id: 2,
                    capacity: 150,
                    operational_status: "Maintenance",
                },
                {
                    train_id: 3,
                    train_code: "T003",
                    route_id: 3,
                    capacity: 120,
                    operational_status: "Active",
                },
            ]
            setTrains(dummyTrains)
            setLoading(false)
        }

        fetchTrains()
    }, [])

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Train Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-gray-500">
                        Here you can monitor train statuses, manage schedules, and perform maintenance tasks.
                    </p>
                    <div className="space-y-4 mt-6">
                        {/* Train table */}
                        {loading ? (
                            <p>Loading trains...</p>
                        ) : (
                            <Table>
                                <TableCaption>A list of metro trains and their details</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Train Code</TableHead>
                                        <TableHead>Route ID</TableHead>
                                        <TableHead>Capacity</TableHead>
                                        <TableHead>Operational Status</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trains.map((train) => (
                                        <TableRow key={train.train_id}>
                                            <TableCell>{train.train_code}</TableCell>
                                            <TableCell>{train.route_id}</TableCell>
                                            <TableCell>{train.capacity}</TableCell>
                                            <TableCell>{train.operational_status}</TableCell>
                                            <TableCell className="text-center">
                                                {/* Edit train link */}
                                                <Link
                                                    href={`/protected/edit-train/${train.train_id}`}
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
                        {/* Add Train button */}
                        <div className="mt-6 text-center">
                            <Button className="px-4 py-2 bg-black text-white rounded">Add Train</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
