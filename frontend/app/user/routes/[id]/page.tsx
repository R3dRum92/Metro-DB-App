"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Route as RouteIcon, MapPin, ArrowLeft, ArrowRight, Train } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"

interface RouteStop {
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

interface Route {
    route_id: number
    route_name: string
    start_station_id: number
    end_station_id: number
    start_station_name: string
    end_station_name: string
    stops: RouteStop[]
}

export default function UserRouteDetails() {
    const params = useParams()
    const route_id = String(params.id)
    const [route, setRoute] = useState<Route | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const { isAuthenticated } = useAuth()
    const router = useRouter()

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/signin')
        }
    }, [isAuthenticated, router])

    // Fetch route details
    useEffect(() => {
        const fetchRouteDetails = async () => {
            if (!route_id) return

            try {
                const response = await fetch(`http://localhost:8000/routes/${route_id}`)

                if (!response.ok) {
                    throw new Error(`Error fetching route: ${response.statusText}`)
                }

                const data = await response.json()
                setRoute(data)
            } catch (error) {
                console.error("Error fetching route details:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchRouteDetails()
    }, [route_id])

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-8">
            <Card className="w-full max-w-6xl shadow-lg">
                <CardHeader className="bg-primary/5 rounded-t-lg py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <RouteIcon className="text-primary" size={28} />
                            <CardTitle className="text-primary text-3xl font-bold">Route Details</CardTitle>
                        </div>
                        <Link href="/user/routes">
                            <Button variant="outline" className="text-base px-6 py-2 border-2 hover:bg-gray-100 transition-colors">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Routes
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : route ? (
                        <>
                            {/* Route Information Section */}
                            <div className="mb-10">
                                <h3 className="text-xl font-semibold mb-5 text-gray-800 border-b pb-2">Route Information</h3>
                                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-md">
                                    {/* Route header with name */}
                                    <div className="bg-primary/10 p-4 flex items-center justify-center">
                                        <h2 className="text-2xl font-bold text-primary">{route.route_name}</h2>
                                    </div>

                                    {/* Journey visual representation */}
                                    <div className="p-6 bg-white flex items-center justify-center space-x-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500">
                                                <MapPin className="h-6 w-6 text-blue-500" />
                                            </div>
                                            <span className="mt-2 font-medium text-gray-800 text-center max-w-[120px]">{route.start_station_name}</span>
                                        </div>

                                        <div className="flex-1 h-0.5 bg-gray-300 relative">
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                <Train className="h-6 w-6 text-primary" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-500">
                                                <MapPin className="h-6 w-6 text-red-500" />
                                            </div>
                                            <span className="mt-2 font-medium text-gray-800 text-center max-w-[120px]">{route.end_station_name}</span>
                                        </div>
                                    </div>

                                    {/* Stops count */}
                                    <div className="bg-gray-50 p-4 text-center border-t border-gray-200">
                                        <span className="text-lg font-medium text-gray-800">
                                            Total stops: {route.stops ? route.stops.length : 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stops Table Section */}
                            <div className="mb-10">
                                <h3 className="text-xl font-semibold mb-5 text-gray-800 border-b pb-2">Stops Along This Route</h3>

                                {route.stops && route.stops.length > 0 ? (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
                                        <Table className="w-full">
                                            <TableCaption className="text-lg font-medium py-4">All stops on this route in order</TableCaption>
                                            <TableHeader className="bg-gray-50">
                                                <TableRow className="border-b-2 border-gray-200">
                                                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Stop No.</TableHead>
                                                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Station</TableHead>
                                                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Location</TableHead>
                                                    {route.stops.some(stop => stop.ticket_price !== null) && (
                                                        <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Ticket Price</TableHead>
                                                    )}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {route.stops.map((stop) => (
                                                    <TableRow
                                                        key={`${stop.station_id}-${stop.stop_int}`}
                                                        className="hover:bg-primary/5 transition-colors border-b border-gray-200"
                                                    >
                                                        <TableCell className="py-4 px-6 text-base font-medium">
                                                            {stop.stop_int === 1 ? (
                                                                <div className="flex items-center">
                                                                    {stop.stop_int}
                                                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                                        Start
                                                                    </span>
                                                                </div>
                                                            ) : stop.stop_int === route.stops.length ? (
                                                                <div className="flex items-center">
                                                                    {stop.stop_int}
                                                                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                                                        End
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                stop.stop_int
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-base">{stop.station_name}</TableCell>
                                                        <TableCell className="py-4 px-6 text-base">{stop.station_location || "Unknown"}</TableCell>
                                                        {route.stops.some(stop => stop.ticket_price !== null) && (
                                                            <TableCell className="py-4 px-6 text-base">
                                                                {stop.ticket_price ? `$${stop.ticket_price.toFixed(2)}` : "N/A"}
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-gray-600 text-lg">No stops information available for this route</p>
                                    </div>
                                )}
                            </div>

                            {/* Travel Information */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Travel Information</h3>
                                <ul className="space-y-3 text-gray-700">
                                    <li className="flex items-start">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5">
                                            <span className="text-primary font-bold text-sm">i</span>
                                        </div>
                                        <span>Please check the schedule board at the station for the most up-to-date arrival times.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5">
                                            <span className="text-primary font-bold text-sm">i</span>
                                        </div>
                                        <span>Tickets can be purchased at station kiosks or through the Metro mobile app.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5">
                                            <span className="text-primary font-bold text-sm">i</span>
                                        </div>
                                        <span>Children under 5 ride free when accompanied by a paying adult.</span>
                                    </li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-600 text-xl mb-4">Route not found</p>
                            <Link href="/user/routes">
                                <Button
                                    variant="outline"
                                    className="mt-4 px-6 py-2 text-base font-medium border-2 hover:bg-gray-100 transition-colors"
                                >
                                    Back to Routes
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}