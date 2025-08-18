'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { 
  Plus, 
  FileText, 
  Users, 
  Settings,
  BarChart3
} from 'lucide-react';

export default function QuickActions() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  const actions = [
    {
      name: 'Add Research',
      description: 'Submit new research entry',
      icon: Plus,
      href: '/research/add',
      color: 'bg-brand-secondary hover:bg-brand-accent text-white'
    },
    {
      name: 'View Reports',
      description: 'Generate and view reports',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-brand-highlight hover:bg-brand-warm text-brand-primary'
    },
    {
      name: 'Manage Users',
      description: 'User management (Admin only)',
      icon: Users,
      href: '/users',
      color: 'bg-brand-primary hover:bg-brand-accent text-white',
      adminOnly: true
    },
    {
      name: 'Settings',
      description: 'System configuration',
      icon: Settings,
      href: '/settings',
      color: 'bg-gradient-warm text-brand-primary hover:shadow-lg'
    }
  ];

  const filteredActions = actions.filter(action => 
    !action.adminOnly || isAdmin
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-brand-cream">
      <h2 className="text-lg font-semibold text-brand-primary mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.name}
              onClick={() => router.push(action.href)}
              className={`${action.color} rounded-lg p-4 text-left transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1`}
            >
              <div className="flex items-center">
                <Icon className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="font-semibold">{action.name}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
} 