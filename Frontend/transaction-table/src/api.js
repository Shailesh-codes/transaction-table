import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export const fetchTransactions = async (month, page = 1, perPage = 10, search = '') => {
    const response = await axios.get(`${API_BASE_URL}/transactions`, {
        params: { month, page, perPage, search }
    });
    return response.data;
};

export const fetchStatistics = async (month) => {
    const response = await axios.get(`${API_BASE_URL}/statistics`, { params: { month } });
    return response.data;
};

export const fetchBarChartData = async (month) => {
    const response = await axios.get(`${API_BASE_URL}/bar-chart`, { params: { month } });
    return response.data;
};