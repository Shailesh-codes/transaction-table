import React, { useState } from 'react';
import TransactionsTable from './components/TransactionsTable';
import Statistics from './components/Statistics';
import BarChartComponent from "./components/Barchart";
import "../src/Styles.css";

const App = () => {
  const [month, setMonth] = useState('March');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div>
      <h1>Transactions Dashboard</h1>
      <select value={month} onChange={(e) => setMonth(e.target.value)}>
        {months.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <TransactionsTable month={month} />
      <Statistics month={month} />
      <BarChartComponent month={month} />
    </div>
  );
};

export default App;