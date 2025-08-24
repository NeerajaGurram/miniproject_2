'use client';

import { useState, useEffect } from 'react';
import { facultyAPI } from '../lib/api';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const tabs = [
  { id: 'summary', label: 'Summary' },
  { id: 'seminar', label: 'S/C/W/FDP/G' },
  { id: 'phd', label: 'PhD' },
  { id: 'phdguiding', label: 'PhD Guiding' },
  { id: 'journals', label: 'Journals' },
  { id: 'books', label: 'Books' },
  { id: 'journaledited', label: 'Journal Edited' },
  { id: 'researchgrant', label: 'Research Grants' },
  { id: 'patents', label: 'Patents' },
  { id: 'qualification', label: 'Qualification' },
  { id: 'visits', label: 'Visits' },
  { id: 'awards', label: 'Awards' },
  { id: 'membership', label: 'Membership' },
  { id: 'consultancy', label: 'Consultancy' },
  { id: 'infrastructure', label: 'Infrastructure' },
];

export default function DepartmentOverview() {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState([]);
  const [facultyData, setFacultyData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      let res;

      if (activeTab === 'summary') {
        // Department overview
        res = await facultyAPI.getDepartmentOverview('CSE', { year: selectedYear });
        const stats = res.data.data?.researchStats || [];
        setChartData(
          stats.map((stat) => ({
            type: stat._id,
            Approved: stat.approved,
            Pending: stat.pending,
            Rejected: stat.rejected,
          }))
        );
        setFacultyData(res.data.data?.facultyStats || []); // backend should return faculty summary
      } else {
        // Specific type
        res = await facultyAPI.getStatsByType(activeTab, { year: selectedYear });
        const stats = res.data.data?.department || [];
        setChartData(
          stats.map((row) => ({
            year: row._id,
            Approved: row.approved,
            Pending: row.pending,
            Rejected: row.rejected,
          }))
        );
        setFacultyData(res.data.data?.faculty || []); // backend should return faculty-level breakdown
      }
    } catch (err) {
      console.error('Error loading department data:', err);
      toast.error('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CSE Department Overview</h1>
          <p className="text-gray-600 mt-1">
            Research statistics and faculty performance
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Research Overview</h2>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {tabs.find((t) => t.id === activeTab)?.label} Statistics
        </h3>

        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <XAxis dataKey={activeTab === 'summary' ? 'type' : 'year'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Approved" fill="#16a34a" />
              <Bar dataKey="Pending" fill="#eab308" />
              <Bar dataKey="Rejected" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Faculty Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Faculty Performance – {tabs.find((t) => t.id === activeTab)?.label}
        </h3>

        {facultyData.length === 0 ? (
          <p className="text-gray-500 text-sm">No faculty data available.</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {facultyData.map((f) => (
              <div
                key={f._id}
                className="flex items-center justify-between py-3 hover:bg-gray-50 px-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{f.name}</p>
                  <p className="text-xs text-gray-500">{f.email}</p>
                </div>
                <div className="flex space-x-4 text-sm">
                  <span className="text-green-600">✓ {f.approved}</span>
                  <span className="text-yellow-600">⏳ {f.pending}</span>
                  <span className="text-red-600">✗ {f.rejected}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}