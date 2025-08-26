'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { Download } from 'lucide-react';

const researchTypeLabels = {
  all: 'Summary',
  seminar: 'S/C/W/FDP/G',
  phd: 'PhD',
  phdguiding: 'PhD Guiding',
  journal: 'Journals',
  book: 'Books',
  journaledited: 'Journal Edited',
  researchgrant: 'Research Grants',
  patent: 'Patents',
  qualification: 'Qualification',
  visit: 'Visits',
  award: 'Awards',
  membership: 'Membership',
  consultancy: 'Consultancy',
  infrastructure: 'Infrastructure',
};

// Map frontend type keys to backend report type values
const typeToReportMap = {
  seminar: 'S/C/W/FDP/G',
  phd: 'PHD',
  phdguiding: 'PHD-GUIDING',
  journal: 'JOURNALS',
  book: 'BOOKS',
  journaledited: 'JOURNAL-EDITED',
  researchgrant: 'RESEARCH-GRANTS',
  patent: 'PATENTS',
  qualification: 'QUALIFICATIONS',
  visit: 'VISITS',
  award: 'AWARDS',
  membership: 'MEMBERSHIP',
  consultancy: 'CONSULTANCY',
  infrastructure: 'INFRASTRUCTURE',
};

export default function AdminDashboard() {
  const [allCounts, setAllCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const [selectedType, setSelectedType] = useState('all');

  // Fetch all counts in a single API call
  const fetchAllCounts = async () => {
    try {
      setLoading(true);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/counts`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch counts, status: ${res.status}`);
      }

      const data = await res.json();
      setAllCounts(data);
    } catch (err) {
      console.error('Error fetching counts:', err);
      toast.error('Failed to load department statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (token) {
      fetchAllCounts();
    }
  }, [token]);

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (!allCounts) return null;
    
    let total = 0;
    let accepted = 0;
    let pending = 0;
    let rejected = 0;
    
    Object.values(allCounts).forEach(data => {
      total += data.total || 0;
      accepted += data.accepted || 0;
      pending += data.pending || 0;
      rejected += data.rejected || 0;
    });
    
    return { total, accepted, pending, rejected };
  };

  const summaryStats = getSummaryStats();

  // Get the current data based on selected type
  const getCurrentData = () => {
    if (selectedType === 'all') {
      return summaryStats;
    }
    
    // Map selected type to the correct data key
    const keyMap = {
      seminar: 'seminars',
      phd: 'phds',
      phdguiding: 'phdsGuiding',
      journal: 'journals',
      book: 'books',
      journaledited: 'journalsEdited',
      researchgrant: 'researchGrants',
      patent: 'patents',
      qualification: 'qualifications',
      visit: 'visits',
      award: 'awards',
      membership: 'memberships',
      consultancy: 'consultancies',
      infrastructure: 'infrastructures',
    };
    
    const dataKey = keyMap[selectedType];
    return allCounts ? allCounts[dataKey] : null;
  };

  // Download Excel for a specific research type
  const downloadExcel = async (type) => {
    try {
      const reportType = typeToReportMap[type];
      if (!reportType) {
        toast.error('Download not available for this type');
        return;
      }

      const params = new URLSearchParams({ 
        type: reportType, 
        format: 'excel',
        branch: user?.branch || ''
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/data?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (err) {
      console.error('Download error:', err);
      toast.error(`Download error: ${err.message}`);
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Statistics across all activity types</p>
            {user && user.branch && (
              <p className="text-sm text-gray-500 mt-2">
                Filtered by branch: {user.branch}
              </p>
            )}
          </div>
          
          {summaryStats && (
            <div className="mt-4 md:mt-0 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-lg font-bold text-blue-700">{summaryStats.total}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Accepted</p>
                <p className="text-lg font-bold text-green-700">{summaryStats.accepted}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-lg font-bold text-yellow-700">{summaryStats.pending}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Rejected</p>
                <p className="text-lg font-bold text-red-700">{summaryStats.rejected}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Research Type Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Research Overview</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(researchTypeLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                selectedType === type
                  ? 'bg-brand-accent text-white'
                  : 'bg-gray-100 text-brand-primary hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content Section */}
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading department statistics...</p>
          </div>
        ) : currentData ? (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center cursor-pointer" onClick={() => downloadExcel(selectedType)}>
              {researchTypeLabels[selectedType]} Statistics
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-700">{currentData.total || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-700">{currentData.accepted || 0}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">{currentData.pending || 0}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-700">{currentData.rejected || 0}</p>
              </div>
            </div>
            
            {/* Summary Table for all research types */}
            {selectedType === 'all' && allCounts && (
              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Detailed Research Statistics</h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Research Type</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">Total</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">Accepted</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">Pending</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">Rejected</th>
                        {/* <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">Actions</th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries({
                        seminar: 'seminars',
                        phd: 'phds',
                        phdguiding: 'phdsGuiding',
                        journal: 'journals',
                        book: 'books',
                        journaledited: 'journalsEdited',
                        researchgrant: 'researchGrants',
                        patent: 'patents',
                        qualification: 'qualifications',
                        visit: 'visits',
                        award: 'awards',
                        membership: 'memberships',
                        consultancy: 'consultancies',
                        infrastructure: 'infrastructures',
                      }).map(([typeKey, dataKey]) => {
                        const data = allCounts[dataKey] || {};
                        return (
                          <tr key={typeKey} className="hover:bg-gray-50 cursor-pointer" onClick={() => downloadExcel(typeKey)}>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer">
                              {researchTypeLabels[typeKey]}
                            </td>
                            <td className="py-3 px-4 text-center text-sm text-gray-700">{data.total || 0}</td>
                            <td className="py-3 px-4 text-center text-sm text-green-600">{data.accepted || 0}</td>
                            <td className="py-3 px-4 text-center text-sm text-yellow-600">{data.pending || 0}</td>
                            <td className="py-3 px-4 text-center text-sm text-red-600">{data.rejected || 0}</td>
                            {/* <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => downloadExcel(typeKey)}
                                className="inline-flex items-center px-3 py-1 bg-brand-secondary text-white text-sm rounded-md hover:bg-brand-accent transition-colors"
                                title="Download Excel Report"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </td> */}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Additional details section for specific types */}
            {selectedType !== 'all' && (
              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  {researchTypeLabels[selectedType]} Details
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm">
                    Detailed view and management options for {researchTypeLabels[selectedType].toLowerCase()} would appear here.
                  </p>
                  <button 
                    onClick={() => downloadExcel(selectedType)}
                    className="mt-3 px-4 py-2 bg-brand-accent text-white rounded-md text-sm font-medium hover:bg-brand-primary transition-colors flex items-center mx-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {researchTypeLabels[selectedType]} Report
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No data available for this category</p>
          </div>
        )}
      </div>
    </div>
  );
}