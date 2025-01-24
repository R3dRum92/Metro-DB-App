"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StationManage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Station Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-gray-500">Here you can manage stations, view schedules, and monitor station health.</p>
          <div className="space-y-4 mt-6">
            <p>Display a list of stations here, or add more functionality for station management.</p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded">Add Station</button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
