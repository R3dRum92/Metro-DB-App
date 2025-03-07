"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, Users, Train, MapPin, Route, AlertTriangle } from "lucide-react"

interface Station {
    station_id: string;
    name: string;
    location: string;
    status: string;
}

interface Train {
    train_id: string;
    train_code: string;
    route_id: string;
    capacity: number;
    operational_status: string;
    route_name: string;
}

interface RouteData {
    route_id: string;
    route_name: string;
    start_station_name: string;
    end_station_name: string;
}

interface DashboardMetrics {
    totalStations: number;
    totalTrains: number;
    totalRoutes: number;
    activeTrains: number;
    activeTrainsPercentage: number;
    totalUsers: number;
    constructionStations: number;
    plannedStations: number;
    activeStations: number;
    busiestRoute?: string;
    busiestRouteStationCount?: number;
    statusDistribution?: Array<{ status: string, count: number }>;
    totalTransactions?: number;
    systemHealth?: number;
}

export default function Dashboard() {
    const [routes, setRoutes] = useState<RouteData[]>([])
    const [trains, setTrains] = useState<Train[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalStations: 0,
        totalTrains: 0,
        totalRoutes: 0,
        activeTrains: 0,
        activeTrainsPercentage: 0,
        totalUsers: 0,
        constructionStations: 0,
        plannedStations: 0,
        activeStations: 0
    })

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

                // Trains data
                const trainsResponse = await fetch("http://localhost:8000/trains")
                if (!trainsResponse.ok) throw new Error("Failed to fetch trains")
                const trainsData = await trainsResponse.json()
                setTrains(trainsData)

                // Fetch dashboard metrics
                const metricsResponse = await fetch("http://localhost:8000/dashboard_metrics")
                if (metricsResponse.ok) {
                    const metricsData = await metricsResponse.json()
                    setMetrics(metricsData)
                } else {
                    // If metrics endpoint fails, calculate basic metrics from the data we have
                    const activeTrainsCount = trainsData.filter(
                        (train: Train) => train.operational_status === 'active'
                    ).length
                    const percentage = trainsData.length > 0 ?
                        (activeTrainsCount / trainsData.length) * 100 : 0

                    setMetrics({
                        totalStations: stationsData.length,
                        totalTrains: trainsData.length,
                        totalRoutes: routesData.length,
                        activeTrains: activeTrainsCount,
                        activeTrainsPercentage: percentage,
                        constructionStations: stationsData.filter(
                            (station: Station) => station.status === 'construction'
                        ).length,
                        plannedStations: stationsData.filter(
                            (station: Station) => station.status === 'planned'
                        ).length,
                        activeStations: stationsData.filter(
                            (station: Station) => station.status === 'active'
                        ).length,
                        totalUsers: 0
                    })
                }

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
                            <CardTitle className="text-xl font-bold text-center text-primary">System Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {loading ? (
                                <LoadingSkeleton />
                            ) : error ? (
                                <ErrorDisplay />
                            ) : (
                                <>
                                    {/* Dashboard Metrics Section */}
                                    <div className="grid grid-cols-4 gap-4 mb-8">
                                        <MetricCard
                                            title="Stations"
                                            value={metrics.totalStations}
                                            icon={<MapPin className="h-6 w-6 text-blue-500" />}
                                            subtitle={`${metrics.constructionStations} in construction, ${metrics.plannedStations} planned`}
                                        />
                                        <MetricCard
                                            title="Trains"
                                            value={metrics.totalTrains}
                                            icon={<Train className="h-6 w-6 text-green-500" />}
                                            subtitle={`${metrics.activeTrainsPercentage.toFixed(1)}% active`}
                                        />
                                        <MetricCard
                                            title="Routes"
                                            value={metrics.totalRoutes}
                                            icon={<Route className="h-6 w-6 text-purple-500" />}
                                        />
                                        <MetricCard
                                            title="Users"
                                            value={metrics.totalUsers || 0}
                                            icon={<Users className="h-6 w-6 text-orange-500" />}
                                        />
                                    </div>

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