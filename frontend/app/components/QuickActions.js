'use client';

import { useRouter } from 'next/navigation';
import { Plus, FileText, BarChart3, Users, Settings } from 'lucide-react';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      name: 'Add Research',
      description: 'Create a new research entry',
      icon: Plus,
      href: '/research/new',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      name: 'View Reports',
      description: 'Generate and view reports',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      name: 'Manage Users',
      description: 'Admin user management',
      icon: Users,
      href: '/users',
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      adminOnly: true,
    },
    {
      name: 'Settings',
      description: 'System configuration',
      icon: Settings,
      href: '/settings',
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.name}
              onClick={() => router.push(action.href)}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200"
            >
              <div>
                <span className={`inline-flex p-3 rounded-lg ${action.color} text-white`}>
                  <Icon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>
              </div>
              <span className="absolute top-6 right-6 text-gray-300 group-hover:text-gray-400" aria-hidden="true">
                <Plus className="h-6 w-6" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
} 