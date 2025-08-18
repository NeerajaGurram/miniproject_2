'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { facultyAPI } from '../lib/api';
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  BookOpen,
  GraduationCap,
  Award,
  Patent,
  Building,
  DollarSign
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

export default function DepartmentOverview() {
  const { user, token } = useAuth();
  const [departmentData, setDepartmentData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.department) {
      loadDepartmentData();
    }
  }, [user?.department, selectedYear]);

  const loadDepartmentData = async () => {
    try {
      setLoading(true);
      const response = await facultyAPI.getDepartmentOverview(user.department, {
        year: selectedYear
      });
      setDepartmentData(response.data.data);
    } catch (error) {
      console.error('Department data load error:', error);
      toast.error('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              {user?.department} Department Overview
            </h1>
            <p className="text-gray-600 mt-1">
              Research statistics and faculty performance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Faculty List */}
      {departmentData?.faculty && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Faculty Members</h2>
            <p className="text-sm text-gray-600 mt-1">
              {departmentData.faculty.length} faculty members in {user?.department}
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {departmentData.faculty.map((faculty) => (
              <div key={faculty._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {faculty.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{faculty.name}</p>
                      <p className="text-xs text-gray-500">{faculty.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{faculty.designation}</p>
                    <p className="text-xs text-gray-500">{faculty.department}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Research Statistics */}
      {departmentData?.researchStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departmentData.researchStats.map((stat) => {
            const Icon = researchTypeIcons[stat._id] || FileText;
            const total = stat.approved + stat.pending + stat.rejected;
            const approvalRate = total > 0 ? Math.round((stat.approved / total) * 100) : 0;
            
            return (
              <div key={stat._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {researchTypeLabels[stat._id]}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{total}</p>
                  </div>
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Approved</span>
                    <span className="font-medium">{stat.approved}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-yellow-600">Pending</span>
                    <span className="font-medium">{stat.pending}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600">Rejected</span>
                    <span className="font-medium">{stat.rejected}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Approval Rate</span>
                      <span className="font-medium text-green-600">{approvalRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Statistics */}
      {departmentData?.researchStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Research</p>
                <p className="text-2xl font-bold text-gray-900">
                  {departmentData.researchStats.reduce((sum, stat) => sum + stat.count, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {departmentData.researchStats.reduce((sum, stat) => sum + stat.approved, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {departmentData.researchStats.reduce((sum, stat) => sum + stat.pending, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Performance Chart */}
      {departmentData?.researchStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Performance by Type</h3>
          <div className="space-y-4">
            {departmentData.researchStats.map((stat) => {
              const total = stat.approved + stat.pending + stat.rejected;
              const approvedPercentage = total > 0 ? (stat.approved / total) * 100 : 0;
              const pendingPercentage = total > 0 ? (stat.pending / total) * 100 : 0;
              const rejectedPercentage = total > 0 ? (stat.rejected / total) * 100 : 0;

              return (
                <div key={stat._id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">
                      {researchTypeLabels[stat._id]}
                    </span>
                    <span className="text-gray-600">{total} total</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500 h-2" 
                        style={{ width: `${approvedPercentage}%` }}
                      ></div>
                      <div 
                        className="bg-yellow-500 h-2" 
                        style={{ width: `${pendingPercentage}%` }}
                      ></div>
                      <div 
                        className="bg-red-500 h-2" 
                        style={{ width: `${rejectedPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>✓ {stat.approved} approved</span>
                    <span>⏳ {stat.pending} pending</span>
                    <span>✗ {stat.rejected} rejected</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 