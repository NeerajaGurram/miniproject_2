'use client';

import { useState, useEffect } from 'react';
import { researchAPI } from '../../lib/api';
import { format } from 'date-fns';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function RecentResearch() {
  const [research, setResearch] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentResearch = async () => {
      try {
        const response = await researchAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
        setResearch(response.data.research);
      } catch (error) {
        console.error('Error fetching recent research:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentResearch();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Research</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Recent Research</h2>
        <a href="/research" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          View all
        </a>
      </div>
      
      {research.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No research entries</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first research entry.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {research.map((item) => (
            <div key={item._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.faculty?.name} • {item.type} • {format(new Date(item.date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                  <span className="ml-1 capitalize">{item.status}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 