"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function Dashboard() {
    return (
        <div className="container mx-auto flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
            {/* Dashboard Header */}
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Admin Dashboard</CardTitle>
                    <CardDescription className="text-center">Welcome to the Metro Admin Dashboard</CardDescription>
                </CardHeader>
            </Card>

            {/* Dashboard Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {/* User Management Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Manage users, view profiles, and handle user access.</p>
                    </CardContent>
                </Card>

                {/* Station Management Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Station Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Manage stations, schedules, and monitor station health.</p>
                    </CardContent>
                </Card>

                {/* Train Management Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Train Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Monitor train statuses, schedules, and maintenance.</p>
                    </CardContent>
                </Card>

                {/* Route Management Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Route Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Add/edit routes and optimize metro system routes.</p>
                    </CardContent>
                </Card>

                {/* Ticketing and Pricing Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Ticketing & Pricing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Manage ticket sales, pricing, and special offers.</p>
                    </CardContent>
                </Card>

                {/* Reporting & Analytics Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Reporting & Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">View system analytics and generate reports.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {/* Notifications & Announcements Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Send announcements and manage notifications.</p>
                    </CardContent>
                </Card>

                {/* System Settings Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>System Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Configure system settings and manage user permissions.</p>
                    </CardContent>
                </Card>

                {/* Maintenance & Operations Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Maintenance & Operations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Monitor and schedule maintenance operations.</p>
                    </CardContent>
                </Card>

                {/* Support & Feedback Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Support & Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">View and respond to user feedback and support tickets.</p>
                    </CardContent>
                </Card>

                {/* Audit Logs Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Audit Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">View system logs and track activity.</p>
                    </CardContent>
                </Card>

                {/* Integrations & API Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Integrations & API</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Access API documentation and manage integrations.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
