'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { facultyAPI } from '../lib/api';
import { 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Award, 
  Patent, 
  Users, 
  Building, 
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const researchTypeIcons = {
  seminar: BookOpen,
  phd: GraduationCap,
  journal: FileText,
  book: BookOpen,
  award: Award,
  patent: Patent,
  visit: Users,
  consultancy: Building,
  infrastructure: Building,
  grant: DollarSign
};

const researchTypeLabels = {
  seminar: 'Seminars',
  phd: 'PhD Research',
  journal: 'Journal Publications',
  book: 'Books',
  award: 'Awards',
  patent: 'Patents',
  visit: 'Visits',
  consultancy: 'Consultancy',
  infrastructure: 'Infrastructure',
  grant: 'Grants'
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

export default function FacultyDashboard() {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [researchData, setResearchData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (selectedType !== 'all') {
      loadResearchByType(selectedType);
    }
  }, [selectedType]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await facultyAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Failed to load dashboard data');
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
          {/* <div className="text-right">
            <p className="text-sm text-gray-500">Last login</p>
            <p className="text-sm font-medium text-gray-900">
              {user?.lastLogin ? formatDate(user.lastLogin) : 'First time login'}
            </p>
          </div> */}
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

      {/* Research Type Selector
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Research Overview</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Research
          </button>
          {Object.entries(researchTypeLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div> */}

      {/* Research Data Table */}
      {/* {selectedType !== 'all' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {researchTypeLabels[selectedType]}
            </h3>
            {statsLoading && (
              <div className="mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {researchData.map((research) => {
                  const StatusIcon = statusIcons[research.status];
                  return (
                    <tr key={research._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {research.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {getResearchDetails(research)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(research.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[research.status]}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {research.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {researchData.length === 0 && !statsLoading && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No research found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No {researchTypeLabels[selectedType].toLowerCase()} found for this period.
                </p>
              </div>
            )}
          </div>
        </div>
      )} */}

      {/* Recent Research */}
      {/* {dashboardData?.recentResearch && selectedType === 'all' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Research</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardData.recentResearch.map((research) => {
              const Icon = researchTypeIcons[research.type] || FileText;
              const StatusIcon = statusIcons[research.status];
              return (
                <div key={research._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{research.title}</p>
                        <p className="text-xs text-gray-500">
                          {researchTypeLabels[research.type]} • {formatDate(research.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[research.status]}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {research.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )} */}
    </div>
  );
} 