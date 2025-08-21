'use client';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import { FileSearch } from 'lucide-react';

export default function ReportsPage() {
  const {user, token} = useAuth();
  const [formData, setFormData] = useState({
    type1: '',
    type11: '',
    branch: ''
  });

  const [errors, setErrors] = useState({});

  // Set user's department as default when component mounts
  useEffect(() => {
    if (user && user.department) {
      setFormData(prev => ({
        ...prev,
        branch: user.role === 'admin' ? '' : user.department
      }));
    }
  }, [user]);

  // Sample branch data - replace with actual data from props/API
  const branchOptions = {
    'CSE': 'Computer Science Engineering',
    'IT': 'Information Technology Engineering',
    'ECE': 'Electronics and Communication Engineering',
    'EEE': 'Electrical and Electronics Engineering',
    'EIE': 'Electrical and Instrumentation Engineering',
    'ME': 'Mechanical Engineering',
    'CE': 'Civil Engineering'
  };

  const [yearOptions, setYearOptions] = useState([]);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/academic-years`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const years = await response.json();
        setYearOptions(years);
      } catch (err) {
        console.error('Failed to load academic years:', err);
      }
    };

    if (token) {
      fetchYears();
    }
  }, [token]);

  const reportTypes = [
    'S/C/W/FDP/G', 'PHD', 'PHD-GUIDING', 'JOURNALS',
    'BOOKS', 'JOURNAL-EDITED', 'RESEARCH-GRANTS', 'PATENTS',
    'QUALIFICATIONS', 'VISITS', 'AWARDS', 'MEMBERSHIP',
    'CONSULTANCY', 'INFRASTRUCTURE', 'SUMMARY'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.type1) {
      newErrors.type1 = "Please select a report type";
    }
    // if (!formData.branch) {
    //   newErrors.branch = "Please select a branch";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Redirect to view page with query params
    window.location.href = `/dashboard/reports/view?type=${formData.type1}&year=${formData.type11}&branch=${formData.branch}`;
  };

  const handleReset = () => {
    setFormData({
      type1: '',
      type11: '',
      branch: user.role === 'admin' ? '' : user.department
    });
    setErrors({});
  };

  return (
    <div className="flex justify-center p-4">
      <form 
        onSubmit={handleSubmit}
        onReset={handleReset}
        className="w-full max-w-4xl bg-white border border-brand-cream rounded-lg overflow-hidden shadow-lg"
      >
        <div className="bg-gradient-brand p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <FileSearch className="h-8 w-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">Reports</h2>
          </div>
          <p className="text-brand-cream text-sm">Generate reports based on your criteria</p>
        </div>

        <div className="space-y-6 p-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Report Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="type1"
                required
                value={formData.type1}
                onChange={handleChange}
                className="w-full p-3 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors bg-white text-gray-900"
              >
                <option value="">Select Report Type</option>
                {reportTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {errors.type1 && <p className="text-red-500 text-sm mt-1">{errors.type1}</p>}
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Year
            </label>
            <div className="relative">
              <select
                name="type11"
                value={formData.type11}
                onChange={handleChange}
                className="w-full p-3 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors bg-white text-gray-900"
              >
                <option value="">All Years</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Branch */}
          {user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-brand-primary mb-2">
                Branch <span className="text-red-500">*</span>
              </label>
              <div className="relative">
              <select
                name="branch"
                // required
                value={formData.branch}
                onChange={handleChange}
                className="w-full p-3 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors bg-white text-gray-900"
              >
                {/* <option value="">Select Branch</option> */}
                <option value="">All Branches</option>
                {Object.entries(branchOptions).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {errors.branch && <p className="text-red-500 text-sm mt-1">{errors.branch}</p>}
          </div>
          )}

          {/* Buttons */}
          <div className="flex justify-center space-x-4 pt-6">
            <button
              type="submit"
              className="px-6 py-3 bg-brand-secondary text-white font-medium rounded-lg hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Generate Report
            </button>
            <button
              type="reset"
              className="px-6 py-3 bg-brand-highlight text-brand-primary font-medium rounded-lg hover:bg-brand-warm focus:outline-none focus:ring-2 focus:ring-brand-highlight focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Reset Form
            </button>
          </div>
        </div>

        <div className="bg-gradient-subtle p-4 text-center">
          <p className="text-sm text-brand-secondary">
            Select criteria to generate the desired report
          </p>
        </div>
      </form>
    </div>
  // <div className="flex justify-center p-4">
    //   <form 
    //     onSubmit={handleSubmit}
    //     onReset={handleReset}
    //     className="w-full max-w-md border border-gray-300 rounded-lg overflow-hidden shadow-md"
    //   >
    //     {/* Header */}
    //     <div className="bg-pink-300 p-4 text-center">
    //       <h2 className="text-xl font-bold text-teal-700">REPORTS</h2>
    //     </div>

    //     <div className="space-y-4 p-4">
    //       {/* Report Type */}
    //       <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2">
    //         <label className="md:col-span-1 font-bold text-purple-800">
    //           Type<span className="text-red-500">*</span>
    //         </label>
    //         <div className="md:col-span-3">
    //           <select
    //             name="type1"
    //             required
    //             value={formData.type1}
    //             onChange={handleChange}
    //             className="w-full p-2 border border-red-800 rounded"
    //           >
    //             <option value="">None</option>
    //             {reportTypes.map((type) => (
    //               <option key={type} value={type}>{type}</option>
    //             ))}
    //           </select>
    //           {errors.type1 && <p className="text-red-500 text-sm">{errors.type1}</p>}
    //         </div>
    //       </div>

    //       {/* Year */}
    //       <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2">
    //         <label className="md:col-span-1 font-bold text-purple-800">
    //           Year
    //         </label>
    //         <div className="md:col-span-3">
    //           <select
    //             name="type11"
    //             value={formData.type11}
    //             onChange={handleChange}
    //             className="w-full p-2 border border-red-800 rounded"
    //           >
    //             <option value="">ALL</option>
    //             {yearOptions.map((year) => (
    //               <option key={year} value={year}>{year}</option>
    //             ))}
    //           </select>
    //         </div>
    //       </div>

    //       {/* Branch */}
    //       <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2">
    //         <label className="md:col-span-1 font-bold text-purple-800">
    //           Branch<span className="text-red-500">*</span>
    //         </label>
    //         <div className="md:col-span-3">
    //         <select
    //           name="branch"
    //           required
    //           value={formData.branch}
    //           onChange={handleChange}
    //           className="w-full p-2 border border-red-800 rounded"
    //         >
    //           <option value="">Select Branch</option>
    //           {Object.entries(branchOptions).map(([value, label]) => (
    //             <option 
    //               key={value} 
    //               value={value}
    //             >
    //               {label}
    //             </option>
    //           ))}
    //         </select>
    //           {errors.branch && <p className="text-red-500 text-sm">{errors.branch}</p>}
    //         </div>
    //       </div>

    //       {/* Buttons */}
    //       <div className="flex justify-center space-x-4 pt-4">
    //         <button
    //           type="submit"
    //           className="px-4 py-2 bg-gray-300 text-red-600 font-bold border border-teal-700 rounded hover:bg-gray-400"
    //         >
    //           SUBMIT
    //         </button>
    //         <button
    //           type="reset"
    //           className="px-4 py-2 bg-gray-300 text-red-600 font-bold border border-teal-700 rounded hover:bg-gray-400"
    //         >
    //           RESET
    //         </button>
    //       </div>
    //     </div>

    //     {/* Footer */}
    //     <div className="bg-pink-300 p-1"></div>
    //   </form>
    // </div>
  );
}