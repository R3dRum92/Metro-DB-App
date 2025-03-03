"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Station {
    station_id: number
    station_name: string
    location: string
}

export default function StationManage() {
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Fetch the list of stations from the FastAPI backend (dummy data for now)
    useEffect(() => {
        async function fetchStations() {
            // Uncomment and use this once the backend is ready
            // try {
            //     const response = await fetch("http://localhost:8000/stations")
            //     const data = await response.json()
            //     setStations(data)
            // } catch (error) {
            //     console.error("Error fetching stations:", error)
            // } finally {
            //     setLoading(false)
            // }

            // Dummy data for testing
            const dummyStations = [
                {
                    station_id: 1,
                    station_name: "Station A",
                    location: "Downtown",
                },
                {
                    station_id: 2,
                    station_name: "Station B",
                    location: "Uptown",
                },
                {
                    station_id: 3,
                    station_name: "Station C",
                    location: "Suburbs",
                },
            ]
            setStations(dummyStations)
            setLoading(false)
        }

        fetchStations()
    }, [])

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-primary text-2xl font-bold text-center">Station Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-gray-500">
                        Here you can manage stations, view schedules, and monitor station health.
                    </p>
                    <div className="space-y-4 mt-6">
                        {/* Station table */}
                        {loading ? (
                            <p>Loading stations...</p>
                        ) : (
                            <Table>
                                <TableCaption>A list of metro stations and their details</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Station Name</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stations.map((station) => (
                                        <TableRow key={station.station_id}>
                                            <TableCell>{station.station_name}</TableCell>
                                            <TableCell>{station.location}</TableCell>
                                            <TableCell className="text-center">
                                                {/* Edit station link */}
                                                <Link
                                                    href={`/protected/edit-station/${station.station_id}`}
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
                        {/* Add Station button */}
                        <div className="mt-6 text-center">
                            <Button className="px-4 py-2 bg-primary text-white rounded">Add Station</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
