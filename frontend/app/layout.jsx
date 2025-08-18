import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from '../lib/auth';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Faculty Management System",
  description: "Modern research management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" {...toasterConfig} />
        </AuthProvider>
      </body>
    </html>
  );
}

const toasterConfig = {
  toastOptions: {
    duration: 4000,
    style: { 
      background: 'var(--color-primary)', 
      color: 'var(--color-cream)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(28, 31, 76, 0.15)'
    },
    success: {
      duration: 3000,
      iconTheme: { primary: 'var(--color-highlight)', secondary: 'var(--color-primary)' },
      style: { 
        background: 'var(--color-secondary)', 
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 132, 140, 0.15)'
      }
    },
    error: {
      duration: 5000,
      iconTheme: { primary: '#ef4444', secondary: 'white' },
      style: { 
        background: '#ef4444', 
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
      }
    },
  }
};