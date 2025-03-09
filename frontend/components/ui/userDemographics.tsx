import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';

interface DemographicData {
    name: string;
    value: number;
}

// Define a custom tooltip props interface without extending Recharts' TooltipProps
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        payload: DemographicData;
    }>;
}

const UserDemographics: React.FC = () => {
    const [demographicData, setDemographicData] = useState<DemographicData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Colors for the pie chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    useEffect(() => {
        async function fetchDemographicData() {
            setLoading(true);
            try {
                // Replace with actual API endpoint for demographic data
                const response = await fetch("http://localhost:8000/user_demographics");

                if (!response.ok) {
                    // If endpoint doesn't exist yet, use mock data
                    // This allows for UI development before backend is ready
                    const mockData: DemographicData[] = [
                        { name: '18-24', value: 250 },
                        { name: '25-34', value: 430 },
                        { name: '35-44', value: 285 },
                        { name: '45-54', value: 165 },
                        { name: '55+', value: 120 }
                    ];
                    setDemographicData(mockData);
                } else {
                    const data = await response.json();
                    setDemographicData(data);
                }
            } catch (err) {
                console.error("Error fetching demographic data:", err);
                // Fallback to mock data on error
                const mockData: DemographicData[] = [
                    { name: '18-24', value: 250 },
                    { name: '25-34', value: 430 },
                    { name: '35-44', value: 285 },
                    { name: '45-54', value: 165 },
                    { name: '55+', value: 120 }
                ];
                setDemographicData(mockData);
                setError("Could not load demographic data from server. Using sample data.");
            } finally {
                setLoading(false);
            }
        }

        fetchDemographicData();
    }, []);

    // Calculate total users
    const totalUsers = demographicData.reduce((sum, item) => sum + item.value, 0);

    // Custom tooltip for the pie chart
    const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const percentage = ((payload[0].value / totalUsers) * 100).toFixed(1);
            return (
                <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md">
                    <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
                    <p className="text-gray-600">{`${percentage}% of users`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="w-full bg-card rounded-lg border border-primary/20">
            <CardHeader >
                <CardTitle className="text-lg font-semibold text-center text-primary">User Age Demographics</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={demographicData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {demographicData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center mt-2 text-sm text-gray-500 border-t border-gray-100 pt-2">
                            {error ? (
                                <p className="text-amber-600">{error}</p>
                            ) : (
                                <p>Total Users: {totalUsers}</p>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default UserDemographics;