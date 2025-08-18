'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import DashboardLayout from '../components/DashboardLayout';
import { useEffect } from 'react';

export default function DashboardRootLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
// 'use client';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/lib/auth';
// import DashboardLayout from '../components/DashboardLayout';

// export default function DashboardRootLayout({ children }) {
//   const { isAuthenticated, loading } = useAuth();
//   const router = useRouter();

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-brand-cream flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div>
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     router.push('/login');
//     return null;
//   }

//   return <DashboardLayout>{children}</DashboardLayout>;
// }