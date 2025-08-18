// 'use client';

// import { useState } from 'react';
// import { useAuth } from '../lib/auth';
// import { 
//   Menu, 
//   X, 
//   Home, 
//   FileText, 
//   Users, 
//   BarChart3, 
//   Settings, 
//   LogOut,
//   Search,
//   Bell,
//   User
// } from 'lucide-react';

// const navigation = [
//   { name: 'Dashboard', href: '/dashboard', icon: Home },
//   { name: 'Research', href: '/research', icon: FileText },
//   { name: 'Reports', href: '/reports', icon: BarChart3 },
//   { name: 'Users', href: '/users', icon: Users, adminOnly: true },
//   { name: 'Settings', href: '/settings', icon: Settings },
// ];

// export default function DashboardLayout({ children }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const { user, logout, isAdmin } = useAuth();

//   const handleLogout = async () => {
//     await logout();
//   };

//   const filteredNavigation = navigation.filter(item => 
//     !item.adminOnly || isAdmin
//   );

//   return (
//     <div className="min-h-screen bg-gray-50">
//       hellooooo
//       {/* Mobile sidebar */}
//       <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
//         <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
//         <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
//           <div className="flex h-16 items-center justify-between px-4">
//             <h1 className="text-xl font-bold text-gray-900">Research Management</h1>
//             <button
//               onClick={() => setSidebarOpen(false)}
//               className="text-gray-400 hover:text-gray-600"
//             >
//               <X className="h-6 w-6" />
//             </button>
//           </div>
//           <nav className="flex-1 space-y-1 px-2 py-4">
//             {filteredNavigation.map((item) => {
//               const Icon = item.icon;
//               return (
//                 <a
//                   key={item.name}
//                   href={item.href}
//                   className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
//                 >
//                   <Icon className="mr-3 h-5 w-5" />
//                   {item.name}
//                 </a>
//               );
//             })}
//           </nav>
//           <div className="border-t border-gray-200 p-4">
//             <button
//               onClick={handleLogout}
//               className="flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
//             >
//               <LogOut className="mr-3 h-5 w-5" />
//               Logout
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Desktop sidebar */}
//       <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
//         <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
//           <div className="flex h-16 items-center px-4">
//             <h1 className="text-xl font-bold text-gray-900">Research Management</h1>
//           </div>
//           <nav className="flex-1 space-y-1 px-2 py-4">
//             {filteredNavigation.map((item) => {
//               const Icon = item.icon;
//               return (
//                 <a
//                   key={item.name}
//                   href={item.href}
//                   className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
//                 >
//                   <Icon className="mr-3 h-5 w-5" />
//                   {item.name}
//                 </a>
//               );
//             })}
//           </nav>
//           <div className="border-t border-gray-200 p-4">
//             <button
//               onClick={handleLogout}
//               className="flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
//             >
//               <LogOut className="mr-3 h-5 w-5" />
//               Logout
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main content */}
//       <div className="lg:pl-64">
//         {/* Top bar */}
//         <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
//           <button
//             type="button"
//             className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
//             onClick={() => setSidebarOpen(true)}
//           >
//             <Menu className="h-6 w-6" />
//           </button>

//           <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
//             <div className="relative flex flex-1">
//               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
//                 <Search className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
//               />
//             </div>
//             <div className="flex items-center gap-x-4 lg:gap-x-6">
//               <button className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
//                 <Bell className="h-6 w-6" />
//               </button>
//               <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
//               <div className="flex items-center gap-x-4">
//                 <div className="flex items-center gap-x-2">
//                   <User className="h-6 w-6 text-gray-400" />
//                   <span className="text-sm font-medium text-gray-900">{user?.name}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Page content */}
//         <main className="py-6">
//           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//             {children}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// } 