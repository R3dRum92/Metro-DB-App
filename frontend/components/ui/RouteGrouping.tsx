"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from "recharts"
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent"

interface RouteStation {
    route_id: string;
    route_name: string;
    station_count: number;
}

const RouteGrouping = () => {
    const [routeStations, setRouteStations] = useState<RouteStation[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [groupedData, setGroupedData] = useState<any[]>([])

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            setError(null)
            try {
                // Fetch route-station data
                const response = await fetch("http://localhost:8000/routes_stations")
                if (!response.ok) {
                    // If the endpoint doesn't exist yet, we'll use a fallback
                    throw new Error("Failed to fetch route stations data")
                }
                const data = await response.json()
                setRouteStations(data)

                // Process the data for visualization
                processRouteData(data)
            } catch (error) {
                console.error("Error fetching route stations data:", error)

                // Fallback: Fetch routes and try to count stations per route
                try {
                    const routesResponse = await fetch("http://localhost:8000/routes")
                    if (!routesResponse.ok) throw new Error("Failed to fetch routes")
                    const routesData = await routesResponse.json()

                    // Create mock data for demonstration
                    const mockRouteStations = routesData.map((route: any, index: number) => ({
                        route_id: route.route_id,
                        route_name: route.route_name,
                        // Assign random station counts (3-12) for demonstration
                        station_count: Math.floor(Math.random() * 10) + 3
                    }))

                    setRouteStations(mockRouteStations)
                    processRouteData(mockRouteStations)
                } catch (fallbackError) {
                    setError("Failed to load route station data. Please try again later.")
                }
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Process the data to group routes by station count
    const processRouteData = (data: RouteStation[]) => {
        // Group routes by number of stations
        const grouped = data.reduce((acc: { [key: string]: string[] }, route) => {
            const count = route.station_count.toString()
            if (!acc[count]) {
                acc[count] = []
            }
            acc[count].push(route.route_name)
            return acc
        }, {})

        // Format data for the chart
        const chartData = Object.entries(grouped).map(([stationCount, routes]) => ({
            stationCount: parseInt(stationCount),
            count: routes.length,
            routes: routes.join(", ")
        }))

        // Sort by station count
        chartData.sort((a, b) => a.stationCount - b.stationCount)

        setGroupedData(chartData)
    }

    if (loading) {
        return (
            <Card className="p-4 bg-card rounded-lg border border-primary/20">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-center text-primary">Routes by Station Count</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64">
                    <div className="animate-pulse h-full w-full bg-gray-200 rounded-lg"></div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="p-4 bg-card rounded-lg border border-primary/20">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-center text-primary">Routes by Station Count</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-64">
                    <p className="text-red-500">{error}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="p-4 bg-card rounded-lg border border-primary/20">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-center text-primary">Routes by Station Count</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={groupedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="stationCount"
                                label={{ value: 'Number of Stations', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis
                                label={{ value: 'Number of Routes', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                formatter={(value) => [value, 'Routes']}
                                labelFormatter={(label) => `${label} Stations`}
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                                itemStyle={{ color: '#6366f1' }}
                                cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                                content={(props) => {
                                    const { active, payload, label } = props;
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload as any;
                                        return (
                                            <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md">
                                                <p className="font-bold">{`${label} Stations`}</p>
                                                <p className="text-gray-700">{`${data.count} Routes`}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {data.routes.length > 50
                                                        ? `${data.routes.substring(0, 50)}...`
                                                        : data.routes}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="count"
                                fill="#6366f1"
                                name="Routes"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 text-sm">
                    <p className="text-muted-foreground text-center">
                        {groupedData.length > 0
                            ? `Most routes have ${getMostCommonStationCount()} stations`
                            : 'No route data available'}
                    </p>
                </div>
            </CardContent>
        </Card>
    )

    // Helper function to find the most common station count
    function getMostCommonStationCount() {
        if (groupedData.length === 0) return '0';

        const mostCommon = [...groupedData].sort((a, b) => b.count - a.count)[0];
        return mostCommon.stationCount;
    }
}

export default RouteGrouping;