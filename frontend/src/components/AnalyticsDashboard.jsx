import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDashboard = ({ game }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/lottery/analysis?game=${game}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [game]);

  if (loading) return <div className="text-center p-4">Loading analytics...</div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!analytics) return null;

  const createChartData = (numbers, label, backgroundColor) => ({
    labels: numbers.map(n => n.toString()),
    datasets: [
      {
        label,
        data: numbers.map(n => analytics.frequency[n] || 0),
        backgroundColor,
        borderColor: backgroundColor,
        borderWidth: 1,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${game === 'powerball' ? 'Powerball' : 'Lotto Texas'} Number Frequency`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Frequency',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Numbers',
        },
      },
    },
  };

  if (game === 'powerball') {
    // For Powerball, create two charts: one for regular numbers and one for Powerball
    const regularNumbers = Array.from({ length: 69 }, (_, i) => i + 1);
    const powerballNumbers = Array.from({ length: 26 }, (_, i) => i + 1);

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Regular Numbers Frequency</h2>
          <Bar
            data={createChartData(regularNumbers, 'Regular Numbers', 'rgba(54, 162, 235, 0.5)')}
            options={chartOptions}
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Powerball Numbers Frequency</h2>
          <Bar
            data={createChartData(powerballNumbers, 'Powerball', 'rgba(255, 99, 132, 0.5)')}
            options={chartOptions}
          />
        </div>
      </div>
    );
  } else {
    // For Lotto Texas, create one chart for all numbers
    const numbers = Array.from({ length: 54 }, (_, i) => i + 1);
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Lotto Texas Number Frequency</h2>
        <Bar
          data={createChartData(numbers, 'Numbers', 'rgba(75, 192, 192, 0.5)')}
          options={chartOptions}
        />
      </div>
    );
  }
};

export default AnalyticsDashboard; 