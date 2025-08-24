'use client';

import { useState, useEffect } from 'react';
import { facultyAPI } from '../lib/api';
import toast from 'react-hot-toast';
import {useAuth} from '../lib/auth';

export default function AdminDashboard() {
  const {user} = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
          </div>
        </div>
      </div>
      <div className="bg-white text-brand-primary rounded-lg shadow p-6">
        <h2 className="text-lg font-bold">Admin Actions</h2>
        <div className="mt-4">
          <button className="btn btn-primary border-2 m-2 p-2 rounded cursor-pointer">Manage Users</button>
          <button className="btn btn-secondary border-2 m-2 p-2 rounded cursor-pointer">View Reports</button>
        </div>
      </div>
    </div>
  );
}