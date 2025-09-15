'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { Download } from 'lucide-react';

const researchTypeLabels = {
  all: 'Summary',
  seminar_conf: 'S/C/W/FDP/G',
  seminar: 'Seminars',
  conference: 'Conferences',
  workshop: 'Workshops',
  fdp: 'FDPs',
  guestLecture: 'Guest Lectures',
  phd: 'PhDs',
  phdguiding: 'PhD Guidings',
  journal: 'Journals',
  book: 'Books',
  journaledited: 'Journal Edited',
  researchgrant: 'Research Grants',
  patent: 'Patents',
  qualification: 'Qualifications',
  visit: 'Visits',
  award: 'Awards',
  membership: 'Memberships',
  consultancy: 'Consultancies',
  infrastructure: 'Infrastructures',
};

// Map frontend type keys to backend report type values
const typeToReportMap = {
  seminar_conf: 'S/C/W/FDP/G',
  seminar: 'Seminar',
  conference: 'Conference', 
  workshop: 'Workshop',
  fdp: 'FDP',
  guestLecture: 'GuestLecture', 
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

// Department options
const departmentOptions = {
  'CSE': 'Computer Science Engineering',
  'IT': 'Information Technology',
  'ECE': 'Electronics and Communication Engineering',
  'EEE': 'Electrical and Electronics Engineering',
  'EIE': 'Electrical and Instrumentation Engineering',
  'ME': 'Mechanical Engineering',
  'CE': 'Civil Engineering'
};

export default function AdminDashboard() {
  const [allCounts, setAllCounts] = useState(null);
  const [filteredCounts, setFilteredCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const [selectedType, setSelectedType] = useState('all');
  const [filters, setFilters] = useState({
    department: '',
    academicYear: ''
  });
  const [yearOptions, setYearOptions] = useState([]);

  // Fetch academic years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/academic-years`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const years = await response.json();
          setYearOptions(years.reverse());
        }
      } catch (err) {
        console.error('Failed to load academic years:', err);
      }
    };

    if (token) {
      fetchYears();
    }
  }, [token]);

  // Fetch all counts (without filters for the top summary)
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

  // Fetch filtered counts for the detailed view
  const fetchFilteredCounts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.academicYear) params.append('academic_year', filters.academicYear);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/counts?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setFilteredCounts(data);
      }
    } catch (err) {
      console.error('Error fetching filtered counts:', err);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (token) {
      fetchAllCounts();
    }
  }, [token]);

  // Fetch filtered data when filters change
  useEffect(() => {
    if (token && (filters.department || filters.academicYear)) {
      fetchFilteredCounts();
    } else {
      setFilteredCounts(null);
    }
  }, [token, filters]);

  // Calculate summary statistics (always from allCounts, not filtered)
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

  // Get the current data based on selected type (uses filtered data if available)
  const getCurrentData = () => {
    if (selectedType === 'all') {
      // For summary view, calculate from filtered or all counts
      if (filteredCounts) {
        let total = 0;
        let accepted = 0;
        let pending = 0;
        let rejected = 0;
        
        Object.values(filteredCounts).forEach(data => {
          total += data.total || 0;
          accepted += data.accepted || 0;
          pending += data.pending || 0;
          rejected += data.rejected || 0;
        });
        
        return { total, accepted, pending, rejected };
      }
      return summaryStats;
    }
    
    // Map selected type to the correct data key
    const keyMap = {
      seminar_conf: 'seminars',
      seminar: 'seminarTypes.seminar',
      conference: 'seminarTypes.conference',
      workshop: 'seminarTypes.workshop',
      fdp: 'seminarTypes.fdp',
      guestLecture: 'seminarTypes.guestLecture',
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

  if (['seminar', 'conference', 'workshop', 'fdp', 'guestLecture'].includes(selectedType)) {
      const dataSource = filteredCounts || allCounts;
      // Access nested seminarTypes property
      return dataSource?.seminarTypes?.[selectedType] || null;
    }
    
    const dataKey = keyMap[selectedType];
    // Use filtered data if available, otherwise use all data
    const dataSource = filteredCounts || allCounts;
    return dataSource ? dataSource[dataKey] : null;
  };

  // Download Excel for a specific research type
  const downloadExcel = async (type) => {
    try {
      let reportType = typeToReportMap[type];
      let additionalParams = {};
      if (!reportType) {
        toast.error('Download not available for this type');
        return;
      }
      
      // Handle seminar types specially - they all use the same endpoint but different filters
      if (['seminar', 'conference', 'workshop', 'fdp', 'guestLecture'].includes(type)) {
        reportType = 'S/C/W/FDP/G';
        additionalParams.type1 = typeToReportMap[type]; 
      }

      const params = new URLSearchParams({ 
        type: reportType, 
        format: 'excel',
        ...(filters.department && { branch: filters.department }), 
        ...(filters.academicYear && { year: filters.academicYear }) 
      });

      Object.keys(additionalParams).forEach(key => {
        params.append(key, additionalParams[key]);
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/data?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download report: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (reportType !== 'S/C/W/FDP/G') ? `${reportType}_${filters.academicYear || 'all'}_${filters.department || 'all'}_report.xlsx` : `${reportType}_${type}_${filters.academicYear || 'all'}_${filters.department || 'all'}_report.xlsx`;
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
  const displayData = filteredCounts || allCounts;

  return (
    <div className="space-y-6">
      {/* Header Section - Always shows overall stats, not filtered */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Overall statistics across all activity types</p>
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

      {/* Research Type Selector with Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Research Overview</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            >
              <option value="">All Departments</option>
              {Object.entries(departmentOptions).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={filters.academicYear}
              onChange={(e) => setFilters(prev => ({ ...prev, academicYear: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            >
              <option value="">All Years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ department: '', academicYear: '' })}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Research Type Buttons */}
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
      
      {/* Content Section - Shows filtered data */}
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading department statistics...</p>
          </div>
        ) : currentData ? (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center cursor-pointer" onClick={() => downloadExcel(selectedType)}>
              {researchTypeLabels[selectedType]} Statistics
              {filters.department && ` - ${departmentOptions[filters.department] || filters.department}`}
              {filters.academicYear && ` (${filters.academicYear})`}
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
            {selectedType === 'all' && displayData && (
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {/* Seminar types */}
                      {['seminar', 'conference', 'workshop', 'fdp', 'guestLecture'].map(typeKey => {
                        const data = displayData.seminarTypes?.[typeKey] || {};
                        return (
                          <tr key={typeKey} className="hover:bg-gray-50 cursor-pointer" onClick={() => downloadExcel(typeKey)}>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer">
                              {researchTypeLabels[typeKey]}
                            </td>
                            <td className="py-3 px-4 text-center text-sm text-gray-700">{data.total || 0}</td>
                            <td className="py-3 px-4 text-center text-sm text-green-600">{data.accepted || 0}</td>
                            <td className="py-3 px-4 text-center text-sm text-yellow-600">{data.pending || 0}</td>
                            <td className="py-3 px-4 text-center text-sm text-red-600">{data.rejected || 0}</td>
                          </tr>
                        );
                      })}
                      {Object.entries({
                        seminar_conf: 'seminars',
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
                        const data = displayData[dataKey] || {};
                        return (
                          <tr key={typeKey} className="hover:bg-gray-50 cursor-pointer" onClick={() => downloadExcel(typeKey)}>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer">
                              {researchTypeLabels[typeKey]}
                            </td>
                            <td className="py-3 px-4 text-center text-sm text-gray-700">{data.total || 0}</td>
                            <td className="py-3 px-4 text-center text-sm text-green-600">{data.accepted || 0}</td>
                            <td className="py-3 px-4 text-center text-sm text-yellow-600">{data.pending || 0}</td>
                            <td className="py-3 px-4 text-center text-sm text-red-600">{data.rejected || 0}</td>
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