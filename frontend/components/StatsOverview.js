'use client';

import { useState, useEffect } from 'react';
import { researchAPI } from '../lib/api';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  Award,
  BookOpen,
  Microscope
} from 'lucide-react';

export default function StatsOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await researchAPI.getStats();
        setStats(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border border-brand-cream">
        <div className="animate-pulse">
          <div className="h-4 bg-brand-cream rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-brand-cream rounded"></div>
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
          <p>Failed to load statistics</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Research',
      value: stats?.total || 0,
      icon: FileText,
      color: 'bg-brand-primary',
      textColor: 'text-brand-primary',
      bgColor: 'bg-brand-primary bg-opacity-10'
    },
    {
      title: 'Approved',
      value: stats?.approved || 0,
      icon: CheckCircle,
      color: 'bg-brand-secondary',
      textColor: 'text-brand-secondary',
      bgColor: 'bg-brand-secondary bg-opacity-10'
    },
    {
      title: 'Pending',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'bg-brand-highlight',
      textColor: 'text-brand-highlight',
      bgColor: 'bg-brand-highlight bg-opacity-10'
    },
    {
      title: 'Rejected',
      value: stats?.rejected || 0,
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-500',
      bgColor: 'bg-red-500 bg-opacity-10'
    }
  ];

  const typeStats = [
    { name: 'Seminars', value: stats?.byType?.seminar || 0, icon: TrendingUp },
    { name: 'Journals', value: stats?.byType?.journal || 0, icon: BookOpen },
    { name: 'Awards', value: stats?.byType?.award || 0, icon: Award },
    { name: 'Patents', value: stats?.byType?.patent || 0, icon: Microscope }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-brand-cream">
        <h2 className="text-lg font-semibold text-brand-primary mb-4">Research Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-gradient-subtle rounded-lg p-4 border border-brand-cream hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-brand-secondary">{stat.title}</p>
                    <p className="text-2xl font-bold text-brand-primary">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Research Types */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-brand-cream">
        <h2 className="text-lg font-semibold text-brand-primary mb-4">By Research Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {typeStats.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.name} className="bg-gradient-subtle rounded-lg p-4 border border-brand-cream hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-brand-secondary bg-opacity-10">
                    <Icon className="h-6 w-6 text-brand-secondary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-brand-secondary">{type.name}</p>
                    <p className="text-2xl font-bold text-brand-primary">{type.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 