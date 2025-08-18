'use client';

import { useState, useEffect } from 'react';
import { researchAPI } from '../lib/api';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  Calendar,
  User
} from 'lucide-react';

export default function RecentResearch() {
  const [research, setResearch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentResearch = async () => {
      try {
        setLoading(true);
        const response = await researchAPI.getAll({ limit: 5, sort: '-createdAt' });
        setResearch(response.data.research || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentResearch();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-brand-secondary" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-brand-highlight" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-brand-secondary" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-brand-secondary bg-opacity-10 text-brand-secondary border border-brand-secondary';
      case 'pending':
        return 'bg-brand-highlight bg-opacity-10 text-brand-highlight border border-brand-highlight';
      case 'rejected':
        return 'bg-red-500 bg-opacity-10 text-red-500 border border-red-500';
      default:
        return 'bg-brand-cream text-brand-primary border border-brand-cream';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border border-brand-cream">
        <div className="animate-pulse">
          <div className="h-4 bg-brand-cream rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-brand-cream rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border border-brand-cream">
        <div className="text-center text-brand-secondary">
          <p>Failed to load recent research</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-brand-cream">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-brand-primary">Recent Research</h2>
        <a href="/research" className="text-sm text-brand-secondary hover:text-brand-accent transition-colors">
          View all
        </a>
      </div>
      
      {research.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-brand-secondary mx-auto mb-4" />
          <p className="text-brand-secondary">No research entries found</p>
          <p className="text-sm text-brand-secondary opacity-75">Start by adding your first research entry</p>
        </div>
      ) : (
        <div className="space-y-4">
          {research.map((item) => (
            <div key={item._id} className="border border-brand-cream rounded-lg p-4 hover:bg-gradient-subtle transition-all duration-200 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(item.status)}
                    <h3 className="font-medium text-brand-primary">{item.title}</h3>
                  </div>
                  <p className="text-sm text-brand-secondary mb-2">{item.description}</p>
                  <div className="flex items-center gap-4 text-xs text-brand-secondary opacity-75">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{item.faculty?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.date)}</span>
                    </div>
                    <span className="capitalize">{item.type}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 