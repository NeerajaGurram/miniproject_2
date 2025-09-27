'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../../lib/auth';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import GoogleLoginButton from '../../../components/GoogleLoginButton';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoginError(null);
    setIsLoading(true);
    try {
      // console.log('Submitting:', data); 
      const result = await login(data);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setLoginError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-brand flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Faculty Management System
          </h1>
          <p className="text-brand-cream">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 border border-brand-cream">
          {loginError && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {loginError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="empId" className="block text-sm font-medium text-brand-primary mb-2">
                Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-brand-secondary" />
                </div>
                <input
                  id="empId"
                  type="text"
                  suppressHydrationWarning
                  {...register('empId', {
                    required: 'Employee ID is required',
                    minLength: {
                      value: 5,
                      message: 'Employee ID must be at least 5 characters',
                    },
                  })}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors ${
                    errors.empId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your employee ID"
                />
              </div>
              {errors.empId && (
                <p className="mt-1 text-sm text-red-600">{errors.empId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-primary mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-brand-secondary" />
                </div>
                <input
                  id="password"
                  suppressHydrationWarning
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  suppressHydrationWarning
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-brand-secondary" />
                  ) : (
                    <Eye className="h-5 w-5 text-brand-secondary" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-brand-secondary focus:ring-brand-secondary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-brand-primary">
                  Remember me
                </label> */}
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-brand-secondary hover:text-brand-accent transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                suppressHydrationWarning
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-brand-primary bg-brand-highlight hover:bg-brand-warm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
              {/* Add Google login */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <GoogleLoginButton />

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="font-medium text-brand-secondary hover:text-brand-accent transition-colors">
                  Sign up
                </a>
              </p>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-brand-cream">
            © 2024 Faculty Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 