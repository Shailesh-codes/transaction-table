import React, { useState, useEffect } from 'react';
import { fetchBarChartData } from "../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const BarChartComponent = ({ month }) => {
    const [barChartData, setBarChartData] = useState([]);

    useEffect(() => {
        const getBarChartData = async () => {
            const data = await fetchBarChartData(month);
            setBarChartData(data);
        };
        getBarChartData();
    }, [month]);

    return (
        <BarChart width={600} height={300} data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
    );
};

export default BarChartComponent;