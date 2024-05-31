import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import Transaction from "./Models/TransactionModel.js";
import connectDB from "./config/db.js";
import morgan from "morgan";

// configure env
dotenv.config();

// database config
connectDB();

// rest object
const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
    console.log(`Server Running on ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan.white);
})

app.get("/", (req, res) => {
    res.send("<h1>Here's are the transactions</h1>")
});


// Initialize to api
app.get('/api/initialize', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const transactions = response.data;


        await Transaction.deleteMany({});
        await Transaction.insertMany(transactions);

        res.status(200).send('Database initialized with seed data');
    } catch (error) {
        res.status(500).send('Error initializing database');
    }
});


// API to list the all transactions

app.get('/api/transactions', async (req, res) => {
    const { page = 1, perPage = 10, search = '', month } = req.query;
    const regex = new RegExp(search, 'i');
    const startDate = new Date(`${month} 1, 2000`);
    const endDate = new Date(`${month} 1, 2000`);
    endDate.setMonth(endDate.getMonth() + 1);

    try {
        const transactions = await Transaction.find({
            $or: [
                { title: regex },
                { description: regex },
                { price: { $regex: regex } },
            ],
            dateOfSale: { $gte: startDate, $lt: endDate },
        })
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));

        const total = await Transaction.countDocuments({
            $or: [
                { title: regex },
                { description: regex },
                { price: { $regex: regex } },
            ],
            dateOfSale: { $gte: startDate, $lt: endDate },
        });

        res.status(200).json({ transactions, total });
    } catch (error) {
        res.status(500).send('Error fetching transactions');
    }
});

// Provie statistics for selected months

app.get('/api/statistics', async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month} 1, 2000`);
    const endDate = new Date(`${month} 1, 2000`);
    endDate.setMonth(endDate.getMonth() + 1);

    try {
        const totalSaleAmount = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: null, total: { $sum: '$price' } } },
        ]);

        const totalSoldItems = await Transaction.countDocuments({
            dateOfSale: { $gte: startDate, $lt: endDate },
            sold: true,
        });

        const totalNotSoldItems = await Transaction.countDocuments({
            dateOfSale: { $gte: startDate, $lt: endDate },
            sold: false,
        });

        res.status(200).json({
            totalSaleAmount: totalSaleAmount[0]?.total || 0,
            totalSoldItems,
            totalNotSoldItems,
        });
    } catch (error) {
        res.status(500).send('Error fetching statistics');
    }
});

//  API to provide data for a bar chart based on price ranges

app.get('/api/bar-chart', async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month} 1, 2000`);
    const endDate = new Date(`${month} 1, 2000`);
    endDate.setMonth(endDate.getMonth() + 1);

    try {
        const priceRanges = [
            { range: '0-100', min: 0, max: 100 },
            { range: '101-200', min: 101, max: 200 },
            { range: '201-300', min: 201, max: 300 },
            { range: '301-400', min: 301, max: 400 },
            { range: '401-500', min: 401, max: 500 },
            { range: '501-600', min: 501, max: 600 },
            { range: '601-700', min: 601, max: 700 },
            { range: '701-800', min: 701, max: 800 },
            { range: '801-900', min: 801, max: 900 },
            { range: '901-above', min: 901, max: Infinity },
        ];

        const barChartData = await Promise.all(priceRanges.map(async (range) => {
            const count = await Transaction.countDocuments({
                dateOfSale: { $gte: startDate, $lt: endDate },
                price: { $gte: range.min, $lte: range.max === Infinity ? Number.MAX_SAFE_INTEGER : range.max },
            });
            return { range: range.range, count };
        }));

        res.status(200).json(barChartData);
    } catch (error) {
        res.status(500).send('Error fetching bar chart data');
    }
});

// API to provide data for a pie chart based on unique categories.

app.get('/api/pie-chart', async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month} 1, 2000`);
    const endDate = new Date(`${month} 1, 2000`);
    endDate.setMonth(endDate.getMonth() + 1);

    try {
        const pieChartData = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
        ]);

        res.status(200).json(pieChartData);
    } catch (error) {
        res.status(500).send('Error fetching pie chart data');
    }
});

//  API to fetch data from the above APIs and combine the responses.

app.get('/api/combined', async (req, res) => {
    const { month } = req.query;

    try {
        const [transactionsResponse, statisticsResponse, barChartResponse, pieChartResponse] = await Promise.all([
            axios.get(`http://localhost:${PORT}/api/transactions?month=${month}`),
            axios.get(`http://localhost:${PORT}/api/statistics?month=${month}`),
            axios.get(`http://localhost:${PORT}/api/bar-chart?month=${month}`),
            axios.get(`http://localhost:${PORT}/api/pie-chart?month=${month}`),
        ]);

        res.status(200).json({
            transactions: transactionsResponse.data,
            statistics: statisticsResponse.data,
            barChart: barChartResponse.data,
            pieChart: pieChartResponse.data,
        });
    } catch (error) {
        res.status(500).send('Error fetching combined data');
    }
});