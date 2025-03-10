"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"

interface Station {
    station_id: number
    name: string
    location: string
    status: string
    is_hub?: boolean
}

type Filters = "active" | "inactive" | "maintenance" | "construction" | "planned" | "none"

export default function UserStationsView() {
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeFilter, setActiveFilter] = useState<Filters>("none")
    const { isAuthenticated } = useAuth()
    const router = useRouter()

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/signin')
        }
    }, [isAuthenticated, router])

    // Fetch the list of stations from the FastAPI backend
    useEffect(() => {
        async function fetchStations() {
            setLoading(true)
            try {
                const response = await fetch("http://localhost:8000/stations")
                if (!response.ok) {
                    throw new Error(`Error fetching stations: ${response.statusText}`)
                }
                const data: Station[] = await response.json()
                setStations(data)
            } catch (error) {
                console.error("Error fetching stations:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStations()
    }, [])

    const handleCheckboxChange = (filter: Filters) => {
        if (activeFilter === filter) {
            setActiveFilter("none") // Uncheck if already selected
        } else {
            setActiveFilter(filter) // Set the selected filter
        }
    }

    const filteredStations = stations.filter((station) => {
        const matchesSearchQuery =
            station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            station.location.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCheckboxes =
            (activeFilter === "active" && station.status === "active") ||
            (activeFilter === "inactive" && station.status === "inactive") ||
            (activeFilter === "maintenance" && station.status === "maintenance") ||
            (activeFilter === "construction" && station.status === "construction") ||
            (activeFilter === "planned" && station.status === "planned") ||
            activeFilter === "none"

        return matchesSearchQuery && matchesCheckboxes
    })

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-8">
            <Card className="w-full max-w-6xl shadow-lg">
                <CardHeader className="bg-primary/5 rounded-t-lg py-6">
                    <div className="flex items-center justify-center mb-2">
                        <StationIcon className="text-primary mr-3" width={32} height={32} strokeWidth="2.5" />
                        <CardTitle className="text-primary text-3xl font-bold text-center">Metro Stations</CardTitle>
                    </div>
                    <p className="text-center text-lg text-gray-600 mt-2">
                        View all available stations in the metro system and their current status.
                    </p>
                </CardHeader>
                <CardContent className="p-8">
                    {/* Search Bar */}
                    <div className="flex flex-col items-center space-y-6 mb-8">
                        <div className="relative flex-grow w-full max-w-xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <SearchIcon className="h-6 w-6 text-primary/70" />
                            </div>
                            <Input
                                type="search"
                                placeholder="Search stations by name or location"
                                className="pl-12 pr-4 py-3 w-full text-lg border-2 border-primary/20 focus:ring-4 focus:ring-primary/30 rounded-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter checkboxes */}
                        <div className="flex flex-wrap justify-center gap-4 p-2 bg-gray-50 rounded-lg border border-gray-100 w-full">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="active"
                                    checked={activeFilter === "active"}
                                    onCheckedChange={() => handleCheckboxChange("active")}
                                    className="h-5 w-5"
                                />
                                <label htmlFor="active" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Active
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="inactive"
                                    checked={activeFilter === "inactive"}
                                    onCheckedChange={() => handleCheckboxChange("inactive")}
                                    className="h-5 w-5"
                                />
                                <label htmlFor="inactive" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Inactive
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="maintenance"
                                    checked={activeFilter === "maintenance"}
                                    onCheckedChange={() => handleCheckboxChange("maintenance")}
                                    className="h-5 w-5"
                                />
                                <label htmlFor="maintenance" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Maintenance
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="construction"
                                    checked={activeFilter === "construction"}
                                    onCheckedChange={() => handleCheckboxChange("construction")}
                                    className="h-5 w-5"
                                />
                                <label htmlFor="construction" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Construction
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="planned"
                                    checked={activeFilter === "planned"}
                                    onCheckedChange={() => handleCheckboxChange("planned")}
                                    className="h-5 w-5"
                                />
                                <label htmlFor="planned" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Planned
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Stations Table */}
                    <div className="overflow-hidden border border-gray-200 rounded-lg shadow-md">
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            ) : (
                                <Table>
                                    <TableCaption className="text-lg font-medium py-4">
                                        A list of metro stations and their details
                                    </TableCaption>
                                    <TableHeader className="sticky top-0 bg-gray-50" style={{ zIndex: 1 }}>
                                        <TableRow className="border-b-2 border-gray-200">
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 w-1/3">Station Name</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 w-1/3">Location</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 w-1/3">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStations.length > 0 ? (
                                            filteredStations.map((station) => (
                                                <TableRow
                                                    key={station.station_id}
                                                    className="hover:bg-primary/5 transition-colors border-b border-gray-200"
                                                >
                                                    <TableCell className="py-4 px-6 text-base font-medium">
                                                        <div className="flex items-center">
                                                            <div className="mr-2 bg-primary/10 p-1 rounded-full">
                                                                <MapPin className="h-5 w-5 text-primary" />
                                                            </div>
                                                            {station.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-base">{station.location}</TableCell>
                                                    <TableCell className="py-4 px-6 text-base">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${station.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                station.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                                    station.status === 'construction' ? 'bg-blue-100 text-blue-800' :
                                                                        station.status === 'planned' ? 'bg-purple-100 text-purple-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {station.status.charAt(0).toUpperCase() + station.status.slice(1)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-8 text-center text-gray-500">
                                                    No stations found matching your search.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>

                    {/* Station Status Legend */}
                    <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800">Station Status Guide</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mr-2">Active</span>
                                <span className="text-gray-600">Station is fully operational</span>
                            </div>
                            <div className="flex items-center">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 mr-2">Maintenance</span>
                                <span className="text-gray-600">Temporary closures for repairs</span>
                            </div>
                            <div className="flex items-center">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-2">Construction</span>
                                <span className="text-gray-600">Station is being built</span>
                            </div>
                            <div className="flex items-center">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mr-2">Planned</span>
                                <span className="text-gray-600">Future station, not yet constructed</span>
                            </div>
                            <div className="flex items-center">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mr-2">Inactive</span>
                                <span className="text-gray-600">Station is currently closed</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Station Icon Component
function StationIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M9 9h6v6H9z" />
            <path d="M15 4v16" />
            <path d="M9 4v16" />
            <path d="M4 9h16" />
            <path d="M4 15h16" />
        </svg>
    )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}