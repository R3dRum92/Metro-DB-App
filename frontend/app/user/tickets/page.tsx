"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"

interface Station {
    station_id: string
    name: string
    location: string
    route_id?: string
}

interface Route {
    route_id: string
    name: string
    color: string
}

interface RouteSegment {
    origin_station_name: string
    destination_station_name: string
    origin_station_id: string
    destination_station_id: string
    route_id: string
    route_name: string
    price: number
}

interface FareResponse {
    origin_station_name: string
    destination_station_name: string
    total_price: number
    intermediate_stations: string[]
    segments: RouteSegment[]
    requires_route_change: boolean
}

export default function UserTicketFare() {
    const [stations, setStations] = useState<Station[]>([])
    const [routes, setRoutes] = useState<Route[]>([])
    const [loading, setLoading] = useState(true)
    const [originStation, setOriginStation] = useState<string>("")
    const [destinationStation, setDestinationStation] = useState<string>("")
    const [fare, setFare] = useState<FareResponse | null>(null)
    const [calculating, setCalculating] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const { isAuthenticated } = useAuth()
    const router = useRouter()

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/signin')
        }
    }, [isAuthenticated, router])

    // Fetch stations and routes
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch stations
                const stationsResponse = await fetch("http://localhost:8000/stations_ticket")
                if (!stationsResponse.ok) {
                    throw new Error(`Error fetching stations: ${stationsResponse.statusText}`)
                }
                const stationsData = await stationsResponse.json()
                setStations(stationsData)

                // Fetch routes
                const routesResponse = await fetch("http://localhost:8000/routes")
                if (!routesResponse.ok) {
                    throw new Error(`Error fetching routes: ${routesResponse.statusText}`)
                }
                const routesData = await routesResponse.json()
                setRoutes(routesData)
            } catch (error) {
                console.error("Error fetching data:", error)
                setErrorMessage("Failed to load data. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Calculate fare between stations
    const calculateFare = async () => {
        if (!originStation || !destinationStation) {
            return
        }

        setCalculating(true)
        setErrorMessage(null)

        try {
            // Call the backend API to calculate fare
            const response = await fetch(
                `http://localhost:8000/calculate-fare?origin_station_id=${originStation}&destination_station_id=${destinationStation}`
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Failed to calculate fare")
            }

            const fareData = await response.json()
            setFare(fareData)
        } catch (error) {
            console.error("Error calculating fare:", error)
            setErrorMessage(error instanceof Error ? error.message : "Failed to calculate fare. Please try again.")
        } finally {
            setCalculating(false)
        }
    }

    // Reset fare calculator
    const resetCalculator = () => {
        setOriginStation("")
        setDestinationStation("")
        setFare(null)
        setErrorMessage(null)
    }

    // Get route color for visual indicators
    const getRouteColor = (routeId: string) => {
        const route = routes.find(r => r.route_id === routeId)
        return route?.color || "#888888"
    }

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            {/* Header Card */}
            <Card className="w-full max-w-4xl">
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                            >
                                <rect x="2" y="6" width="20" height="12" rx="2" />
                                <path d="M22 10H2" />
                                <path d="M7 15h0" />
                                <path d="M17 15h0" />
                            </svg>
                        </div>
                        <div>
                            <CardTitle className="text-primary text-2xl font-bold">Metro Fare Calculator</CardTitle>
                            <CardDescription>Plan your journey and check ticket prices</CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" className="hidden sm:flex" asChild>
                        <Link href="/user/dashboard">
                            Back to Dashboard
                        </Link>
                    </Button>
                </CardHeader>
            </Card>

            {/* Main Fare Calculator Card */}
            <Card className="w-full max-w-4xl">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold">Calculate Ticket Fare</h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Select your journey start and end points to see ticket prices and route information.
                            </p>
                        </div>

                        {/* Station Selection */}
                        <div className="space-y-4">
                            {!fare && !calculating && !errorMessage && (
                                <div className="pt-2">
                                    <p className="text-green-700 font-bold">
                                        Select stations and click 'Calculate Fare' to see the ticket price.
                                    </p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="font-medium text-gray-700">Origin</label>
                                <Select value={originStation} onValueChange={setOriginStation}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select an origin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loading ? (
                                            <div className="p-2">Loading stations...</div>
                                        ) : (
                                            stations.map((station) => (
                                                <SelectItem key={station.station_id} value={station.station_id}>
                                                    {station.name} - {station.location}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="font-medium text-gray-700">Destination</label>
                                <Select
                                    value={destinationStation}
                                    onValueChange={setDestinationStation}
                                    disabled={!originStation}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={originStation ? "Select a destination" : "Select an origin first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loading ? (
                                            <div className="p-2">Loading stations...</div>
                                        ) : (
                                            stations
                                                .filter(station => station.station_id !== originStation)
                                                .map((station) => (
                                                    <SelectItem key={station.station_id} value={station.station_id}>
                                                        {station.name} - {station.location}
                                                    </SelectItem>
                                                ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {fare && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-medium text-gray-800 mb-3">Journey Details</h3>

                                    {/* Journey Overview */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-medium">From: {fare.origin_station_name}</p>
                                            <p className="text-sm font-medium">To: {fare.destination_station_name}</p>
                                        </div>
                                        <p className="text-lg font-bold text-primary border-t pt-2 mt-2">
                                            Total Fare: ৳{fare.total_price.toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Route Change Information */}
                                    {fare.requires_route_change && (
                                        <Alert className="mb-3 bg-yellow-50 text-yellow-800">
                                            <AlertDescription>
                                                <div className="flex items-center space-x-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                                                        <path d="M3 12h6V6" />
                                                        <path d="M9 12v6" />
                                                        <path d="M21 12h-6V6" />
                                                        <path d="M15 12v6" />
                                                    </svg>
                                                    <span>This journey requires route changes at: {fare.intermediate_stations.join(", ")}</span>
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Journey Segments */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium">Journey Segments:</h4>
                                        {fare.segments.map((segment, index) => (
                                            <div key={index} className="border rounded-md p-3">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: getRouteColor(segment.route_id) }}
                                                    />
                                                    <span className="text-sm font-medium">{segment.route_name}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-gray-500">From</p>
                                                        <p>{segment.origin_station_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500">To</p>
                                                        <p>{segment.destination_station_name}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 pt-2 border-t">
                                                    <p className="text-sm">Segment Fare: ৳{segment.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                                    <p className="font-medium">Error</p>
                                    <p className="text-sm">{errorMessage}</p>
                                </div>
                            )}

                            <div className="pt-2 text-sm text-gray-500">
                                <p>There is <span className="font-bold">no</span> half fare for students.</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={calculateFare}
                                disabled={!originStation || !destinationStation || calculating}
                                className="flex-1"
                            >
                                {calculating ? (
                                    <>
                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        Calculating...
                                    </>
                                ) : (
                                    "Calculate Fare"
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={resetCalculator}
                                className="flex-1"
                            >
                                Reset
                            </Button>
                        </div>

                        <div className="flex justify-center sm:justify-start space-x-3 pt-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="#">Metro Map</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="#">Service Schedule</Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Route Information Card */}
            <Card className="w-full max-w-4xl">
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2">Transfer Information</h3>
                            <p className="text-sm">
                                When traveling between different metro lines, transfers may be required at interchange stations.
                                The fare calculator will automatically show the most efficient route and all segments of your journey.
                            </p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-medium text-blue-800 mb-2">Ticket Purchasing</h3>
                            <p className="text-sm text-blue-700">
                                Tickets can be purchased at station kiosks or through the Metro mobile app. Please arrive at least 15 minutes
                                before your journey to allow time for purchasing tickets during peak hours.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}