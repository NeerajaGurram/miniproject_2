// frontend/app/dashboard/page.jsx
'use client';

import { useAuth } from '../../lib/auth';
import DashboardLayout from '../components/DashboardLayout';
import StatsOverview from '../components/StatsOverview';
import RecentResearch from '../components/RecentResearch';
import QuickActions from '../components/QuickActions';
import FacultyDashboard from '../../components/FacultyDashboard';
import DepartmentOverview from '../../components/DepartmentOverview';

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading || !isAuthenticated) {
    return (
        <div className="min-h-screen bg-brand-cream flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mx-auto"></div>
            <p className="mt-4 text-brand-primary font-medium">Loading...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Role-based Dashboard */}
        {user?.role === 'faculty' && <FacultyDashboard />}
        {(user?.role === 'admin' || user?.role === 'hod') && <DepartmentOverview />}
        
        {/* Fallback for other roles */}
        {!['faculty', 'admin', 'hod'].includes(user?.role) && (
          <>
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-brand-cream">
              <h1 className="text-2xl font-bold text-brand-primary mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-brand-secondary">
                Here's what's happening with your research activities today.
              </p>
            </div>

            {/* Stats Overview */}
            <StatsOverview />

            {/* Quick Actions */}
            <QuickActions />

            {/* Recent Research */}
            <RecentResearch />
          </>
        )}
      </div>
  );
}