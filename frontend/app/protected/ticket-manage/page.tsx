"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

interface Station {
    id: string
    name: string
    location: string
}

interface FareResponse {
    origin_station_name: string
    destination_station_name: string
    price: number
}

interface FareUpdate {
    origin_station_id: string
    destination_station_id: string
    new_price: number
}

export default function TicketManage() {
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState(true)
    const [originStation, setOriginStation] = useState<string>("")
    const [destinationStation, setDestinationStation] = useState<string>("")
    const [fare, setFare] = useState<FareResponse | null>(null)
    const [calculating, setCalculating] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // New states for price updating
    const [updateOriginStation, setUpdateOriginStation] = useState<string>("")
    const [updateDestinationStation, setUpdateDestinationStation] = useState<string>("")
    const [newPrice, setNewPrice] = useState<string>("")
    const [updateStatus, setUpdateStatus] = useState<{ success: boolean; message: string } | null>(null)
    const [updating, setUpdating] = useState(false)
    const [currentPrice, setCurrentPrice] = useState<number | null>(null)

    // Fetch stations
    useEffect(() => {
        async function fetchStations() {
            try {
                const response = await fetch("http://localhost:8000/stations_ticket")
                if (!response.ok) {
                    throw new Error(`Error fetching stations: ${response.statusText}`)
                }
                const data = await response.json()
                setStations(data)
            } catch (error) {
                console.error("Error fetching stations:", error)
                setErrorMessage("Failed to load stations. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        fetchStations()
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

    // Fetch current price for update tab
    const fetchCurrentPrice = async () => {
        if (!updateOriginStation || !updateDestinationStation) {
            return
        }

        try {
            const response = await fetch(
                `http://localhost:8000/calculate-fare?origin_station_id=${updateOriginStation}&destination_station_id=${updateDestinationStation}`
            )

            if (!response.ok) {
                throw new Error("Failed to fetch current price")
            }

            const data = await response.json()
            setCurrentPrice(data.price)
            setUpdateStatus(null)
        } catch (error) {
            console.error("Error fetching current price:", error)
            setCurrentPrice(null)
            setUpdateStatus({
                success: false,
                message: "Failed to fetch current price. Please try again."
            })
        }
    }

    // Update price between stations
    const updatePrice = async () => {
        if (!updateOriginStation || !updateDestinationStation || !newPrice) {
            setUpdateStatus({
                success: false,
                message: "Please fill in all fields"
            })
            return
        }

        const priceValue = parseFloat(newPrice)
        if (isNaN(priceValue) || priceValue <= 0) {
            setUpdateStatus({
                success: false,
                message: "Please enter a valid price"
            })
            return
        }

        setUpdating(true)
        setUpdateStatus(null)

        try {
            // Call the backend API to update fare
            const fareUpdate: FareUpdate = {
                origin_station_id: updateOriginStation,
                destination_station_id: updateDestinationStation,
                new_price: priceValue
            }

            const response = await fetch(
                "http://localhost:8000/update_fare",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(fareUpdate)
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Failed to update fare")
            }

            setUpdateStatus({
                success: true,
                message: "Fare updated successfully"
            })

            // Reset form
            setNewPrice("")
            setCurrentPrice(priceValue)
        } catch (error) {
            console.error("Error updating fare:", error)
            setUpdateStatus({
                success: false,
                message: error instanceof Error ? error.message : "Failed to update fare. Please try again."
            })
        } finally {
            setUpdating(false)
        }
    }

    // Reset price update form
    const resetUpdateForm = () => {
        setUpdateOriginStation("")
        setUpdateDestinationStation("")
        setNewPrice("")
        setCurrentPrice(null)
        setUpdateStatus(null)
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
                            <CardTitle className="text-primary text-2xl font-bold">Ticket / Fare</CardTitle>
                            <CardDescription>Manage metro tickets and calculate fares</CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" className="hidden sm:flex" asChild>
                        <Link href="/protected/dashboard">
                            Back to Dashboard
                        </Link>
                    </Button>
                </CardHeader>
            </Card>

            {/* Main Tabs */}
            <Card className="w-full max-w-4xl">
                <CardContent className="p-6">
                    <Tabs defaultValue="calculate" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="calculate">Calculate Fare</TabsTrigger>
                            <TabsTrigger value="update">Update Pricing</TabsTrigger>
                        </TabsList>

                        {/* Calculate Fare Tab */}
                        <TabsContent value="calculate" className="space-y-4">
                            <div>
                                <h2 className="text-xl font-semibold">Calculate Ticket Fare Between Stations</h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    Select origin and destination stations to calculate the fares. All fares are calculated as per Dhaka Traffic Coordination Authority circular of 8 September 2022.
                                </p>
                            </div>

                            {/* Station Selection */}
                            <div className="space-y-4">
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
                                                    <SelectItem key={station.id} value={station.id}>
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
                                                    .filter(station => station.id !== originStation)
                                                    .map((station) => (
                                                        <SelectItem key={station.id} value={station.id}>
                                                            {station.name} - {station.location}
                                                        </SelectItem>
                                                    ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {fare && (
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h3 className="font-medium text-gray-800 mb-2">Fare Details</h3>
                                        <div className="space-y-2">
                                            <p className="text-sm">
                                                <span className="font-medium">From:</span> {fare.origin_station_name}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-medium">To:</span> {fare.destination_station_name}
                                            </p>
                                            <p className="text-lg font-bold text-primary">
                                                Fare: ৳{fare.price.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!fare && !calculating && !errorMessage && (
                                    <div className="pt-2">
                                        <p className="text-gray-700 font-medium">
                                            Select stations and click 'Calculate Fare' to see the ticket price.
                                        </p>
                                    </div>
                                )}

                                {errorMessage && (
                                    <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                                        <p className="font-medium">Error</p>
                                        <p className="text-sm">{errorMessage}</p>
                                    </div>
                                )}

                                <div className="pt-2 italic text-sm text-gray-500">
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
                                    <Link href="#">Station Map</Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="#">Plan a Journey</Link>
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Update Pricing Tab */}
                        <TabsContent value="update" className="space-y-4">
                            <div>
                                <h2 className="text-xl font-semibold">Update Ticket Pricing</h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    Modify ticket fares between stations. Updates will be reflected immediately in the fare calculator.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-medium text-gray-700">Origin Station</Label>
                                    <Select value={updateOriginStation} onValueChange={(value) => {
                                        setUpdateOriginStation(value);
                                        setCurrentPrice(null);
                                    }}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select an origin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {loading ? (
                                                <div className="p-2">Loading stations...</div>
                                            ) : (
                                                stations.map((station) => (
                                                    <SelectItem key={station.id} value={station.id}>
                                                        {station.name} - {station.location}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-medium text-gray-700">Destination Station</Label>
                                    <Select
                                        value={updateDestinationStation}
                                        onValueChange={(value) => {
                                            setUpdateDestinationStation(value);
                                            setCurrentPrice(null);
                                            if (updateOriginStation && value) {
                                                // Fetch current price when both stations are selected
                                                setTimeout(() => fetchCurrentPrice(), 100);
                                            }
                                        }}
                                        disabled={!updateOriginStation}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={updateOriginStation ? "Select a destination" : "Select an origin first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {loading ? (
                                                <div className="p-2">Loading stations...</div>
                                            ) : (
                                                stations
                                                    .filter(station => station.id !== updateOriginStation)
                                                    .map((station) => (
                                                        <SelectItem key={station.id} value={station.id}>
                                                            {station.name} - {station.location}
                                                        </SelectItem>
                                                    ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {currentPrice !== null && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm">
                                            <span className="font-medium">Current Price:</span> ৳{currentPrice.toFixed(2)}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="font-medium text-gray-700">New Price (৳)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Enter new price"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                {updateStatus && (
                                    <Alert className={updateStatus.success ? "bg-green-50" : "bg-red-50"}>
                                        <AlertDescription className={updateStatus.success ? "text-green-700" : "text-red-700"}>
                                            {updateStatus.message}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Button
                                        onClick={updatePrice}
                                        disabled={!updateOriginStation || !updateDestinationStation || !newPrice || updating}
                                        className="flex-1"
                                    >
                                        {updating ? (
                                            <>
                                                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            "Update Price"
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={resetUpdateForm}
                                        className="flex-1"
                                    >
                                        Reset
                                    </Button>
                                </div>

                                <div className="pt-2 text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">
                                    <p className="font-medium text-yellow-700">Note:</p>
                                    <p>Price updates will be recorded and reflected in the fare calculator. All price updates are logged for auditing purposes.</p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Additional Information Card */}
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Ticket Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-800 mb-2">Ticket Types</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Single Journey Ticket</li>
                                    <li>MRT Pass (Daily/Weekly/Monthly)</li>
                                </ul>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-800 mb-2">Purchase Options</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Ticket Vending Machines</li>
                                    <li>Station Counters</li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            For more information on ticketing options and fare policies, please visit the official
                            <a href="#" className="text-blue-600 hover:underline"> Dhaka Metro Rail website</a>.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}