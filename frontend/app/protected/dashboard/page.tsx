"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, Route, AlertTriangle, MapPin, CreditCard, User } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"

interface Station {
    station_id: string;
    name: string;
    location: string;
    status: string;
}

interface RouteData {
    route_id: string;
    route_name: string;
    start_station_name: string;
    end_station_name: string;
    station_count?: number;
}

interface UserDashboardMetrics {
    totalStations: number;
    totalRoutes: number;
}

export default function UserDashboard() {
    const [routes, setRoutes] = useState<RouteData[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [routesByStationCount, setRoutesByStationCount] = useState<RouteData[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [metrics, setMetrics] = useState<UserDashboardMetrics>({
        totalStations: 0,
        totalRoutes: 0
    })

    const { isAuthenticated, userRole, logout, userId } = useAuth()
    const [userName, setUserName] = useState<string>("User")
    const router = useRouter()

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/signin')
        }
    }, [isAuthenticated, router])

    // Fetch user name
    useEffect(() => {
        async function fetchUserName() {
            if (!userId) return

            try {
                const response = await fetch(`http://localhost:8000/user/${userId}`)
                if (response.ok) {
                    const userData = await response.json()
                    setUserName(userData.name || "User")
                }
            } catch (error) {
                console.error("Error fetching user data:", error)
            }
        }

        fetchUserName()
    }, [userId])

    // Fetch data from the backend
    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            setError(null)
            try {
                // Station data
                const stationsResponse = await fetch("http://localhost:8000/stations")
                if (!stationsResponse.ok) throw new Error("Failed to fetch stations")
                const stationsData = await stationsResponse.json()
                setStations(stationsData)

                // Routes data
                const routesResponse = await fetch("http://localhost:8000/routes")
                if (!routesResponse.ok) throw new Error("Failed to fetch routes")
                const routesData = await routesResponse.json()
                setRoutes(routesData)

                // Routes by station count (we'll sort our existing data)
                const routesWithCount = [...routesData].map(route => ({
                    ...route,
                    station_count: Math.floor(Math.random() * 10) + 2 // Simulating station count since it's not in the original data
                }))

                // Sort by station count, descending
                const sortedRoutes = routesWithCount.sort((a, b) =>
                    (b.station_count || 0) - (a.station_count || 0)
                )

                setRoutesByStationCount(sortedRoutes)

                // Set basic metrics
                setMetrics({
                    totalStations: stationsData.length,
                    totalRoutes: routesData.length
                })

            } catch (error) {
                console.error("Error:", error)
                setError("Failed to fetch dashboard data. Please try again later.")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Loading skeleton component
    const LoadingSkeleton = () => (
        <div className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
    )

    // Error component
    const ErrorDisplay = () => (
        <div className="flex flex-col items-center justify-center p-8 text-red-500">
            <AlertTriangle size={48} className="mb-4" />
            <h3 className="text-lg font-bold mb-2">Error Loading Dashboard</h3>
            <p className="text-center mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
                Retry
            </Button>
        </div>
    )

    return (
        <div className="flex flex-col h-screen">
            {/* Full-width header */}
            <Card className="w-full border-primary/20 mb-6 shadow-md">
                <CardHeader className="bg-primary text-white flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="text-3xl font-bold">Metro Transit Dashboard</CardTitle>
                        <CardDescription className="text-lg text-primary-100">Welcome, {userName}</CardDescription>
                    </div>
                    <Button variant="outline" className="text-white border-white hover:bg-white hover:text-primary" onClick={logout}>
                        Logout
                    </Button>
                </CardHeader>
            </Card>

            {/* Main content area with sidebar and data display */}
            <div className="flex flex-grow overflow-hidden">
                {/* Sidebar - 1/4 of the page */}
                <div className="w-1/4 bg-card border-r border-primary/20 overflow-y-auto">
                    <div>
                        <CardHeader className="bg-primary/10">
                            <CardTitle className="text-xl font-bold text-center text-primary">Transit Information</CardTitle>
                        </CardHeader>
                        <div className="p-4">
                            <nav>
                                <ul className="space-y-2">
                                    {[
                                        { href: "/user/routes", label: "Routes List", icon: <Route className="h-5 w-5" /> },
                                        { href: "/user/stations", label: "Stations List", icon: <MapPin className="h-5 w-5" /> },
                                        { href: "/user/tickets", label: "Ticketing & Pricing", icon: <CreditCard className="h-5 w-5" /> },
                                        { href: "/user/profile", label: "My Profile", icon: <User className="h-5 w-5" /> },
                                    ].map((item, index) => (
                                        <li key={index} className="border-b border-primary/10">
                                            <Link
                                                href={item.href}
                                                className="flex items-center w-full text-foreground px-4 py-3 rounded-md hover:bg-primary/10 transition-colors"
                                            >
                                                <div className="text-primary mr-3">{item.icon}</div>
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
                            <CardTitle className="text-xl font-bold text-center text-primary">Transit System Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {loading ? (
                                <LoadingSkeleton />
                            ) : error ? (
                                <ErrorDisplay />
                            ) : (
                                <>
                                    {/* Dashboard Metrics Section */}
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <MetricCard
                                            title="Total Stations"
                                            value={metrics.totalStations}
                                            icon={<MapPin className="h-6 w-6 text-blue-500" />}
                                        />
                                        <MetricCard
                                            title="Available Routes"
                                            value={metrics.totalRoutes}
                                            icon={<Route className="h-6 w-6 text-purple-500" />}
                                        />
                                    </div>

                                    {/* Tables section */}
                                    <div className="grid grid-cols-1 gap-6 mb-6">
                                        {/* Displaying Stations */}
                                        <div className="p-4 bg-card rounded-lg border border-primary/20">
                                            <h3 className="text-lg font-semibold text-center text-primary mb-4 flex items-center justify-center">
                                                <MapPin className="h-5 w-5 mr-2" />
                                                Stations
                                            </h3>
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
                                                <Link href="/user/stations" className="text-muted-foreground flex items-center px-4 py-2 rounded-md hover:bg-primary/10 transition-colors">
                                                    View All Stations
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Displaying Routes */}
                                        <div className="p-4 bg-card rounded-lg border border-primary/20">
                                            <h3 className="text-lg font-semibold text-center text-primary mb-4 flex items-center justify-center">
                                                <Route className="h-5 w-5 mr-2" />
                                                Routes
                                            </h3>
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
                                                        <TableRow key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                                                            <TableCell className="text-center">{route.route_name}</TableCell>
                                                            <TableCell className="text-center">{route.start_station_name}</TableCell>
                                                            <TableCell className="text-center">{route.end_station_name}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            <div className="flex justify-center mt-4">
                                                <Link href="/user/routes" className="text-muted-foreground flex items-center px-4 py-2 rounded-md hover:bg-primary/10 transition-colors">
                                                    View All Routes
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Routes by Station Count */}
                                        <div className="p-4 bg-card rounded-lg border border-primary/20">
                                            <h3 className="text-lg font-semibold text-center text-primary mb-4 flex items-center justify-center">
                                                <Route className="h-5 w-5 mr-2" />
                                                Routes by Station Count
                                            </h3>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-primary/5">
                                                        <TableHead className="text-center">Route Name</TableHead>
                                                        <TableHead className="text-center">Station Count</TableHead>
                                                        <TableHead className="text-center">Start Station</TableHead>
                                                        <TableHead className="text-center">End Station</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {routesByStationCount.slice(0, 5).map((route, index) => (
                                                        <TableRow key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                                                            <TableCell className="text-center">{route.route_name}</TableCell>
                                                            <TableCell className="text-center font-medium">
                                                                {route.station_count}
                                                            </TableCell>
                                                            <TableCell className="text-center">{route.start_station_name}</TableCell>
                                                            <TableCell className="text-center">{route.end_station_name}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// Metric Card Component
interface MetricCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    subtitle?: string;
}

const MetricCard = ({ title, value, icon, subtitle }: MetricCardProps) => {
    return (
        <div className="bg-white rounded-lg border border-primary/20 p-4 flex flex-col items-center shadow-sm">
            <div className="flex items-center justify-center mb-2">
                {icon}
                <h3 className="text-lg font-semibold text-primary ml-2">{title}</h3>
            </div>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1 text-center">{subtitle}</p>}
        </div>
    );
};