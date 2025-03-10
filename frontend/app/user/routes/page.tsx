"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Route, MapPin } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"

interface RouteData {
    route_id: number
    route_name: string
    start_station_name: string
    end_station_name: string
}

export default function UserRoutesList() {
    const [routes, setRoutes] = useState<RouteData[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [searchQuery, setSearchQuery] = useState("")
    const { isAuthenticated } = useAuth()
    const router = useRouter()

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/signin')
        }
    }, [isAuthenticated, router])

    useEffect(() => {
        async function fetchRoutes() {
            try {
                const response = await fetch("http://localhost:8000/routes")

                if (!response.ok) {
                    throw new Error(`Error fetching routes: ${response.statusText}`)
                }

                const data: RouteData[] = await response.json()
                setRoutes(data)
            } catch (error) {
                console.error("Error fetching routes:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchRoutes()
    }, [])

    const filteredRoutes = routes.filter((route) =>
        route.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.start_station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.end_station_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-8">
            <Card className="w-full max-w-6xl shadow-lg">
                <CardHeader className="bg-primary/5 rounded-t-lg py-6">
                    <div className="flex items-center gap-3 justify-center">
                        <Route className="text-primary" size={28} />
                        <CardTitle className="text-primary text-3xl font-bold text-center">Metro Routes</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <p className="text-center text-lg text-gray-600 mb-8">
                        View all available metro routes with their start and end stations.
                    </p>

                    <div className="flex flex-col items-center space-y-6 mb-8">
                        <div className="relative flex-grow w-full max-w-xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <SearchIcon className="h-6 w-6 text-primary/70" />
                            </div>
                            <Input
                                type="search"
                                placeholder="Search routes by name or station"
                                className="pl-12 pr-4 py-3 w-full text-lg border-2 border-primary/20 focus:ring-4 focus:ring-primary/30 rounded-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-6 mt-8">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
                                <Table className="w-full">
                                    <TableCaption className="text-lg font-medium py-4">Available Metro Routes</TableCaption>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow className="border-b-2 border-gray-200">
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Route Name</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Start Station</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">End Station</TableHead>
                                            <TableHead className="py-4 px-6 text-lg font-bold text-center text-gray-700">Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRoutes.map((route) => (
                                            <TableRow
                                                key={route.route_id}
                                                className="hover:bg-primary/5 transition-colors border-b border-gray-200"
                                            >
                                                <TableCell className="py-4 px-6 text-base font-medium">
                                                    <Link href={`/user/routes/${route.route_id}`} className="block w-full h-full text-primary hover:text-primary/80 transition-colors">
                                                        {route.route_name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-base">
                                                    <div className="flex items-center">
                                                        <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                                                        {route.start_station_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-base">
                                                    <div className="flex items-center">
                                                        <MapPin className="h-4 w-4 text-red-500 mr-2" />
                                                        {route.end_station_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-center">
                                                    <Link
                                                        href={`/user/routes/${route.route_id}`}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors hover:underline text-base font-medium"
                                                    >
                                                        View Details
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredRoutes.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                                                    No routes found matching your search.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function SearchIcon(props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}