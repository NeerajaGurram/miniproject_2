'use client';

import { useState, useEffect } from 'react';
import { researchAPI } from '../../lib/api';
import { FileText, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';

export default function StatsOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await researchAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalResearch = stats?.totals?.total || 0;
  const approvedResearch = stats?.totals?.approved || 0;
  const pendingResearch = stats?.totals?.pending || 0;
  const rejectedResearch = stats?.totals?.rejected || 0;

  const statCards = [
    {
      name: 'Total Research',
      value: totalResearch,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      name: 'Approved',
      value: approvedResearch,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      name: 'Pending',
      value: pendingResearch,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
    },
    {
      name: 'Rejected',
      value: rejectedResearch,
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Research Overview</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`inline-flex items-center justify-center h-8 w-8 rounded-md ${stat.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {stats?.stats && stats.stats.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">By Research Type</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.stats.map((typeStat) => (
              <div key={typeStat._id} className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {typeStat._id}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {typeStat.count}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        {typeStat.approved}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                        {typeStat.pending}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 