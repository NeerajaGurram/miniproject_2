'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { facultyAPI } from '../lib/api';
import { 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Award, 
  Gem, 
  Users, 
  Building, 
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const researchTypeIcons = {
  seminar: BookOpen,
  phd: GraduationCap,
  journal: FileText,
  book: BookOpen,
  award: Award,
  patent: Gem,
  visit: Users,
  consultancy: Building,
  infrastructure: Building,
  grant: DollarSign
};

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

const statusColors = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusIcons = {
  approved: CheckCircle,
  pending: Clock,
  rejected: XCircle
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

export default function FacultyDashboard() {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [researchData, setResearchData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [countsData, setCountsData] = useState(null);
  const [yearOptions, setYearOptions] = useState([]);
  const [filters, setFilters] = useState({
    academicYear: ''
  });

  useEffect(() => {
    loadDashboardData();
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedType !== 'all') {
      loadResearchByType(selectedType);
    }
  }, [selectedType]);

  useEffect(() => {
    if (token) {
      fetchCounts();
    }
  }, [token, filters]);

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

  const fetchCounts = async () => {
    try {
      setStatsLoading(true);
      const params = new URLSearchParams();
      if (filters.academicYear) params.append('academic_year', filters.academicYear);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/counts?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCountsData(data);
      }
    } catch (err) {
      console.error('Error fetching counts:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadDashboardData = async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await facultyAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => loadDashboardData(retryCount + 1), delay);
      } else {
        console.error('Dashboard load error:', error);
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadResearchByType = async (type) => {
    try {
      setStatsLoading(true);
      const response = await facultyAPI.getResearchByType(type, {
        limit: 50,
        page: 1
      });
      setResearchData(response.data.data);
    } catch (error) {
      console.error('Research load error:', error);
      toast.error('Failed to load research data');
    } finally {
      setStatsLoading(false);
    }
  };

  // Download Excel for a specific research type with filters
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
        ...(filters.academicYear && { year: filters.academicYear })
      });

      // Add additional parameters for seminar types
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
      a.download = (reportType !== 'S/C/W/FDP/G') ? `${reportType}_${filters.academicYear || 'all'}_report.xlsx`: `${reportType}_${type}_${filters.academicYear || 'all'}_report.xlsx`;
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

  // Get the current data based on selected type
  const getCurrentData = () => {
    if (!countsData) return null;
    
    if (selectedType === 'all') {
      let total = 0;
      let accepted = 0;
      let pending = 0;
      let rejected = 0;
      
      Object.values(countsData).forEach(data => {
        total += data.total || 0;
        accepted += data.accepted || 0;
        pending += data.pending || 0;
        rejected += data.rejected || 0;
      });
      
      return { total, accepted, pending, rejected };
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
      const seminarType = selectedType;
      return countsData.seminarTypes?.[seminarType] || null;
    }
    
    const dataKey = keyMap[selectedType];
    return countsData[dataKey] || null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getResearchDetails = (research) => {
    const details = research.details || {};
    switch (research.type) {
      case 'seminar':
        return `${details.topic || 'N/A'} - ${details.venue || 'N/A'}`;
      case 'journal':
        return `${details.journalName || 'N/A'} - ${details.impactFactor || 'N/A'}`;
      case 'phd':
        return `${details.studentName || 'N/A'} - ${details.supervisor || 'N/A'}`;
      case 'patent':
        return `${details.patentNumber || 'N/A'} - ${details.status || 'N/A'}`;
      case 'award':
        return `${details.awardName || 'N/A'} - ${details.organization || 'N/A'}`;
      default:
        return research.description || 'No details available';
    }
  };

  const currentData = getCurrentData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.department} • {user?.designation}
            </p>
          </div>
        </div>
      </div>

      {/* Research Statistics */}
      {dashboardData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dashboardData.stats.map((stat) => {
            const Icon = researchTypeIcons[stat._id] || FileText;
            return (
              <div key={stat._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {researchTypeLabels[stat._id]}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  </div>
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4 flex space-x-2 text-xs">
                  <span className="text-green-600">✓ {stat.approved}</span>
                  <span className="text-yellow-600">⏳ {stat.pending}</span>
                  <span className="text-red-600">✗ {stat.rejected}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Research Type Selector with Year Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Research Overview</h2>
        
        {/* Year Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

          {/* Clear Filter Button */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ academicYear: '' })}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filter
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

      {/* Counts Table */}
      <div className="bg-white rounded-lg shadow p-6">
        {statsLoading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading statistics...</p>
          </div>
        ) : currentData ? (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center cursor-pointer" onClick={() => selectedType !== 'all' && downloadExcel(selectedType)}>
              {researchTypeLabels[selectedType]} Statistics
              {filters.academicYear && ` (${filters.academicYear})`}
              {selectedType !== 'all' && <Download className="ml-2 h-5 w-5" />}
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
            {selectedType === 'all' && countsData && (
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
                        const data = countsData.seminarTypes?.[typeKey] || {};
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
                        const data = countsData[dataKey] || {};
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