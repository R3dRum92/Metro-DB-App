"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TrainManage() {
    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Train Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-gray-500">Here you can monitor train statuses, manage schedules, and perform maintenance tasks.</p>
                    <div className="space-y-4 mt-6">
                        <p>Display a list of trains here, or add more functionality for train management.</p>
                        <button className="px-4 py-2 bg-blue-500 text-white rounded">Add Train</button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
