"use client"

import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableCaption } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
    train_code: z.string().max(10, "Train Code must be less than 10 characters"),
    route_id: z.string().max(10, "Route ID must be a valid number"),
    capacity: z.string().max(5, "Capacity must be a valid number"),
    operational_status: z.string().max(20, "Operational status must be less than 20 characters"),
})

interface Train {
    train_id: number
    train_code: string
    route_id: number
    capacity: number
    operational_status: string
}

export default function TrainManage() {
    const [trains, setTrains] = useState<Train[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            train_code: "",
            route_id: "",
            capacity: "",
            operational_status: "",
        },
    })

    useEffect(() => {
        async function fetchTrains() {
            const dummyTrains = [
                { train_id: 1, train_code: "T001", route_id: 1, capacity: 100, operational_status: "Active" },
                { train_id: 2, train_code: "T002", route_id: 2, capacity: 150, operational_status: "Maintenance" },
                { train_id: 3, train_code: "T003", route_id: 3, capacity: 120, operational_status: "Active" },
            ]
            setTrains(dummyTrains)
            setLoading(false)
        }
        fetchTrains()
    }, [])

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen)
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(() => {
            console.log(values)
            form.reset()
            toggleModal()
        })
    }

    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-primary text-2xl font-bold text-center">Train Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-gray-500">Here you can monitor train statuses, manage schedules, and perform maintenance tasks.</p>
                    <div className="space-y-4 mt-6">
                        {loading ? (
                            <p>Loading trains...</p>
                        ) : (
                            <Table>
                                <TableCaption>A list of metro trains and their details</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Train Code</TableHead>
                                        <TableHead>Route ID</TableHead>
                                        <TableHead>Capacity</TableHead>
                                        <TableHead>Operational Status</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trains.map((train) => (
                                        <TableRow key={train.train_id}>
                                            <TableCell>{train.train_code}</TableCell>
                                            <TableCell>{train.route_id}</TableCell>
                                            <TableCell>{train.capacity}</TableCell>
                                            <TableCell>{train.operational_status}</TableCell>
                                            <TableCell className="text-center">
                                                <Link href={`/protected/edit-train/${train.train_id}`} className="text-blue-500 hover:underline">Edit</Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        <div className="mt-6 text-center">
                            <Button className="px-4 py-2 bg-primary text-white rounded" onClick={toggleModal}>Add Train</Button>
                            {isModalOpen && (
                                <div style={modalStyles}>
                                    <div style={modalContentStyles}>
                                        <h2 className="text-primary font-bold text-2xl">Train Form</h2>
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                                <FormField control={form.control} name="train_code" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Train Code</FormLabel>
                                                        <FormControl><Input type="text" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="route_id" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Route ID</FormLabel>
                                                        <FormControl><Input type="text" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="capacity" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Capacity</FormLabel>
                                                        <FormControl><Input type="text" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="operational_status" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Operational Status</FormLabel>
                                                        <FormControl><Input type="text" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <Button type="submit" className="w-full">Add Train</Button>
                                            </form>
                                        </Form>
                                        <button onClick={toggleModal} style={closeButtonStyles}>Close</button>
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
    alignItems: 'center'
}

const modalContentStyles: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    width: '300px'
}

const closeButtonStyles: React.CSSProperties = {
    marginTop: '10px',
    backgroundColor: 'red',
    color: 'white',
    fontSize: '12px',
    border: 'none',
    padding: '8px',
    borderRadius: '5px'
}
