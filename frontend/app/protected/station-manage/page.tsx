"use client"

import React, { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"

const formSchema = z.object({
    name: z.string().max(100, "Station Name must be a less than 100 characters"),
    location: z.string().max(255, "Location must be less than 255 characters"),
})

interface Station {
    station_id: number
    name: string
    location: string
}

export type addStationActionResult = {
    success?: boolean
    message?: string
    errors?: Record<string, string[]>
}

export async function addStation(formData: FormData): Promise<addStationActionResult> {
    const validatedFields = formSchema.safeParse({
        name: formData.get("name"),
        location: formData.get("location")
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { name, location } = validatedFields.data

    try {
        const response = await fetch("http://localhost:8000/add_station", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                location,
            })
        })

        if (!response.ok) {
            const error = await response.json()
            console.log(error.detail)
            return {
                success: false,
                message: "Adding Stations Failed",
                errors: error.detail.errors || { form: ["Server error occurred"] }
            }
        }

        const data = await response.json()

        return {
            success: true,
            message: data.message || "Successful"
        }
    } catch (error) {
        console.log(error)
        return {
            success: false,
            message: "Failed to connect to server",
            errors: { form: ["Network error occurred"] },
        }
    }
}

export default function StationManage() {
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [isPending, startTransition] = useTransition()

    const [isModalOpen, setIsModalOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            location: "",
        },
    })

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            const formData = new FormData()
            Object.entries(values).forEach(([key, value]) => formData.append(key, value))

            console.log(values)

            const result = await addStation(formData)
            console.log(result)
            if (result?.errors) {

            } else {
                form.reset()
                toggleModal()
            }
        })
    }

    // Fetch the list of stations from the FastAPI backend (dummy data for now)
    useEffect(() => {
        async function fetchStations() {
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
                                            <TableCell>{station.name}</TableCell>
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
                            <Button className="px-4 py-2 bg-primary text-white rounded" onClick={toggleModal}>Add Station</Button>

                            {/* Modal with form */}
                            {isModalOpen && (
                                <div style={modalStyles}>
                                    <div style={modalContentStyles}>
                                        <h2 className="text-primary font-bold text-2xl">Station Form</h2>
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                                {/* name Field */}
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Station Name </FormLabel>
                                                            <FormControl>
                                                                <Input type="text" {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                {/* location Field */}
                                                <FormField
                                                    control={form.control}
                                                    name="location"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Location</FormLabel>
                                                            <FormControl>
                                                                <Input type="text"  {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Submit Button */}
                                                <Button type="submit" className="w-full" disabled={isPending}>
                                                    {isPending ? (
                                                        <>
                                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                                            Adding...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Icons.lock className="mr-2 h-4 w-4" />
                                                            Add Station
                                                        </>
                                                    )}
                                                </Button>
                                            </form>
                                        </Form>
                                        <button onClick={toggleModal} style={closeButtonStyles}>
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const modalStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const modalContentStyles: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    width: '300px',
};

const closeButtonStyles: React.CSSProperties = {
    marginTop: '10px',
    backgroundColor: 'red',
    color: 'white',
    fontSize: '12px',
    border: 'none',
    padding: '8px',
    borderRadius: '5px',
}
