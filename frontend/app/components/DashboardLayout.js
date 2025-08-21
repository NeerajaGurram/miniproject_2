// frontend/components/DashboardLayout.js
'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  User,
  BookOpen,
  Award,
  Patent,
  Globe,
  Building,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  FileEdit,
  FileSearch,
  Lock
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Change Password', href: '/dashboard/change-password', icon: Lock },
  { name: 'S/C/W/FDP/G', href: '/dashboard/s-c-w-fdp-g', icon: FileText },
  { name: 'PhD', href: '/dashboard/phd', icon: GraduationCap },
  { name: 'PhD Guiding', href: '/dashboard/phd-guiding', icon: ShieldCheck },
  { name: 'Journals', href: '/dashboard/journals', icon: BookOpen },
  { name: 'Books', href: '/dashboard/books', icon: FileText },
  { name: 'Journal Edited', href: '/dashboard/journal-edited', icon: FileEdit },
  { name: 'Research Grants', href: '/dashboard/research-grants', icon: Briefcase },
  { name: 'Patents', href: '/dashboard/patents', icon: FileSearch },
  { name: 'Qualifications', href: '/dashboard/qualifications', icon: GraduationCap },
  { name: 'Visits', href: '/dashboard/visits', icon: Globe },
  { name: 'Awards', href: '/dashboard/awards', icon: Award },
  { name: 'Membership', href: '/dashboard/membership', icon: Users },
  { name: 'Consultancy', href: '/dashboard/consultancy', icon: Briefcase },
  { name: 'Infrastructure', href: '/dashboard/infrastructure', icon: Building },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  // { name: 'Users', href: '/dashboard/users', icon: Users, adminOnly: true },
  // { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const filteredNavigation = isAdmin
  ? navigation.filter(item => ['Dashboard', 'Change Password', 'Reports'].includes(item.name))
  : navigation.filter(item => !item.adminOnly);

  // Function to check if a nav item is active
  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 overflow-y-auto lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-brand-primary bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-2xs flex-1 flex-col bg-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex flex-shrink-0 items-center px-4 py-6 bg-gradient-brand">
            <h1 className="text-xl font-bold text-white">Faculty Management System</h1>
          </div>
          <nav className="mt-5 h-full flex-1 space-y-1 px-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    active 
                        ? 'bg-brand-highlight text-brand-primary shadow-md' 
                        : 'text-brand-primary hover:bg-brand-cream hover:text-brand-accent bg-gray-100'
                    }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    active 
                        ? 'text-brand-secondary' 
                        : 'text-brand-secondary group-hover:text-brand-accent'
                    }`} />
                  {item.name}
                </a>
              );
            })}
          </nav>
                      <div className="border-t border-brand-cream p-4 bg-gradient-subtle">
              <div className="flex items-center px-2 py-2 text-sm text-brand-primary">
                <User className="mr-3 h-5 w-5 text-brand-secondary" />
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-brand-secondary">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-2 py-2 text-sm font-medium text-brand-primary rounded-md hover:bg-brand-highlight hover:text-brand-primary mt-2 transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-brand-cream bg-white shadow-lg">
          <div className="flex flex-1 flex-col overflow-y-auto pb-4">
            <div className="flex flex-shrink-0 items-center px-4 py-4 bg-gradient-brand">
              <h1 className="text-xl font-bold text-white">Faculty Management System</h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      active 
                        ? 'bg-brand-highlight text-brand-primary shadow-md' 
                        : 'text-brand-primary hover:bg-brand-cream hover:text-brand-accent hover:bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${
                      active 
                        ? 'text-brand-secondary' 
                        : 'text-brand-secondary group-hover:text-brand-accent'
                    }`} />
                    {item.name}
                  </a>
                );
              })}
            </nav>
            <div className="border-t border-brand-cream p-4 bg-gradient-subtle">
              <div className="flex items-center px-2 py-2 text-sm text-brand-primary">
                <User className="mr-3 h-5 w-5 text-brand-secondary" />
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-brand-secondary">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-2 py-2 text-sm font-medium text-brand-primary rounded-md hover:bg-brand-highlight hover:text-brand-primary mt-2 transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-brand-cream bg-white px-4 shadow-md sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-brand-primary lg:hidden hover:text-brand-accent transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="h-6 w-px bg-brand-cream lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch justify-center items-center lg:gap-x-6">
            <Image
              src='https://siddhartha.edu.in/wp-content/uploads/2025/05/sahe-white-logo.png'
              alt="Profile Picture"
              width={200}
              height={40}
              className="h-14 w-70 rounded-lg bg-brand-primary m-1"
            />
            {/* <div className="relative flex flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-brand-secondary" />
              </div>
              <input
                type="text"
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-brand-primary placeholder:text-brand-secondary focus:ring-0 sm:text-sm"
                placeholder="Search..."
              />
            </div> */}
          </div>

          <div className="flex items-center gap-x-4 lg:gap-x-6">

            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-brand-cream" />

            <div className="relative">
              <div className="flex items-center gap-x-4">
                <div className="hidden sm:flex sm:flex-col sm:items-end">
                  <p className="text-sm font-medium text-brand-primary">{user?.name}</p>
                  <p className="text-xs text-brand-secondary">{user?.role}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-brand-highlight flex items-center justify-center shadow-md">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-x-2 text-sm font-medium text-brand-primary hover:text-brand-accent transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden lg:block">Logout</span>
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}