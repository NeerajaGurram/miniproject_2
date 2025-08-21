'use client';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth';
import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordPage() {
  const { user, token } = useAuth(); // Make sure to get the token
  
  const [formData, setFormData] = useState({
    username: user?.empId || '',
    oldpassword: '',
    newpassword: '',
    newpassword1: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.oldpassword) {
      newErrors.oldpassword = "Please enter old password";
    }

    if (!formData.newpassword) {
      newErrors.newpassword = "Please enter new password";
    } else if (formData.newpassword.length < 6) {
      newErrors.newpassword = "Password must be at least 6 characters";
    }

    if (!formData.newpassword1) {
      newErrors.newpassword1 = "Please re-enter new password";
    } else if (formData.newpassword !== formData.newpassword1) {
      newErrors.newpassword1 = "Passwords do not match";
    } else if (formData.oldpassword === formData.newpassword1) {
      newErrors.newpassword1 = "New password cannot be same as old password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!validateForm()) {
      return;
    }

    if (!token) {
      setMessage('Authentication token not found. Please login again.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Include the auth token
        },
        body: JSON.stringify({
          oldpassword: formData.oldpassword,
          newpassword: formData.newpassword,
          newpassword1: formData.newpassword1
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      console.log('Success:', data);
      
      // Reset form on success
      setFormData({
        username: user?.empId || '',
        oldpassword: '',
        newpassword: '',
        newpassword1: ''
      });
      setErrors({});
      setMessage('Password changed successfully!');
      
    } catch (error) {
      console.error('Error:', error);
      setMessage(error.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      username: user?.empId || '',
      oldpassword: '',
      newpassword: '',
      newpassword1: ''
    });
    setErrors({});
    setMessage('');
  };

  return (
    <div className="flex justify-center p-4">
      <form 
        onSubmit={handleSubmit}
        onReset={handleReset}
        className="w-full max-w-md bg-white border border-brand-cream rounded-lg overflow-hidden shadow-lg"
      >
        {/* Header */}
        <div className="bg-gradient-brand p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Lock className="h-8 w-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">Change Password</h2>
          </div>
          <p className="text-brand-cream text-sm">Update your account password</p>
        </div>

        <div className="space-y-6 p-6">
          {/* Success/Error Message */}
          {message && (
            <div className={`p-4 rounded-lg border ${
              message.includes('successfully') 
                ? 'bg-brand-secondary bg-opacity-10 text-brand-secondary border-brand-secondary' 
                : 'bg-red-500 bg-opacity-10 text-red-500 border-red-500'
            }`}>
              {message}
            </div>
          )}

          {/* USER NAME */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              readOnly
              value={formData.username}
              className="w-full p-3 border border-brand-cream rounded-lg bg-gradient-subtle text-brand-primary font-medium"
            />
          </div>

          {/* OLD PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                name="oldpassword"
                value={formData.oldpassword}
                onChange={handleChange}
                disabled={loading}
                className="w-full p-3 pr-12 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors disabled:bg-brand-cream"
                placeholder="Enter current password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? (
                  <EyeOff className="h-5 w-5 text-brand-secondary" />
                ) : (
                  <Eye className="h-5 w-5 text-brand-secondary" />
                )}
              </button>
            </div>
            {errors.oldpassword && <p className="text-red-500 text-sm mt-1">{errors.oldpassword}</p>}
          </div>

          {/* NEW PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newpassword"
                value={formData.newpassword}
                onChange={handleChange}
                disabled={loading}
                className="w-full p-3 pr-12 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors disabled:bg-brand-cream"
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-brand-secondary" />
                ) : (
                  <Eye className="h-5 w-5 text-brand-secondary" />
                )}
              </button>
            </div>
            {errors.newpassword && <p className="text-red-500 text-sm mt-1">{errors.newpassword}</p>}
          </div>

          {/* RE-TYPE PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="newpassword1"
                value={formData.newpassword1}
                onChange={handleChange}
                disabled={loading}
                className="w-full p-3 pr-12 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors disabled:bg-brand-cream"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-brand-secondary" />
                ) : (
                  <Eye className="h-5 w-5 text-brand-secondary" />
                )}
              </button>
            </div>
            {errors.newpassword1 && <p className="text-red-500 text-sm mt-1">{errors.newpassword1}</p>}
          </div>

          {/* Buttons */}
          <div className="flex justify-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-brand-secondary text-white font-medium rounded-lg hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Password'
              )}
            </button>
            <button
              type="reset"
              disabled={loading}
              className="px-6 py-3 bg-brand-highlight text-brand-primary font-medium rounded-lg hover:bg-brand-warm focus:outline-none focus:ring-2 focus:ring-brand-highlight focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-subtle p-4 text-center">
          <p className="text-sm text-brand-secondary">
            Make sure to use a strong password with at least 6 characters
          </p>
        </div>
      </form>
    </div>
  );
}
