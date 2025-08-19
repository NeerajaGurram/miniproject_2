'use client';
import DashboardLayout from '../../components/DashboardLayout';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../../lib/auth';
import { GraduationCap, Upload, Calendar, Building, User, FileIcon, X, BookOpen } from 'lucide-react';

export default function PhDGuidingPage() {
  const {user, token} = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    uni: '',
    spe: '',
    guide: '',
    date1: '',
    file: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setSelectedFileName(file.name);
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: '' }));
      }
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.uni.trim()) newErrors.uni = "University name is required";
    if (!formData.spe.trim()) newErrors.spe = "Specialization is required";
    if (!formData.guide.trim()) newErrors.guide = "Scholar name is required";
    if (!formData.date1) newErrors.date1 = "Date of registration is required";
    if (!formData.file) newErrors.file = "Document upload is required";
    else if (formData.file.type !== 'application/pdf') {
      newErrors.file = "Only PDF files are allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form first
    if (!validateForm()) return;

    try {
      setLoading(true);
      // Create FormData object to handle file upload
      const submissionData = new FormData();  // Changed variable name here
      submissionData.append('uni', formData.uni);
      submissionData.append('spe', formData.spe);
      submissionData.append('guide', formData.guide);
      submissionData.append('date1', formData.date1);
      submissionData.append('file', formData.file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/phdguiding`, {
        method: 'POST',
        body: submissionData,  // Use the new variable here
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit PhD Guiding details');
      }

      const result = await response.json();
      console.log('Submission successful:', result);
      
      // Show success message to user
      toast.success('PhD Guiding details submitted successfully!');

      // Reset form after successful submission
      handleReset();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      uni: '',
      spe: '',
      guide: '',
      date1: '',
      file: null
    });
    setErrors({});
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex justify-center p-4">
      <form 
        onSubmit={handleSubmit}
        onReset={handleReset}
        className="w-full max-w-4xl bg-white border border-brand-cream rounded-lg overflow-hidden shadow-lg"
        encType="multipart/form-data"
      >
        {/* Header */}
        <div className="bg-gradient-brand p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <GraduationCap className="h-8 w-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">PhD Guiding</h2>
          </div>
          <p className="text-brand-cream text-sm">Submit your PhD guiding details</p>
        </div>

        <div className="space-y-6 p-6">
          {/* EMP ID */}
          <div className="bg-gradient-subtle p-4 rounded-lg border border-brand-cream">
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="empId"
              readOnly
              required
              value={user.empId}
              onChange={handleChange}
              className="w-full p-3 border border-brand-cream rounded-lg bg-white text-brand-primary font-medium"
            />
          </div>

          {/* University */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              University <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="uni"
                placeholder="Enter university name"
                required
                value={formData.uni}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors placeholder-gray-500 text-black"
              />
            </div>
            {errors.uni && <p className="text-red-500 text-sm mt-1">{errors.uni}</p>}
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Specialization <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="spe"
                placeholder="Enter specialization"
                required
                value={formData.spe}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors placeholder-gray-500 text-black"
              />
            </div>
            {errors.spe && <p className="text-red-500 text-sm mt-1">{errors.spe}</p>}
          </div>

          {/* Scholar Name */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Scholar Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="guide"
                placeholder="Enter scholar name"
                required
                value={formData.guide}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors placeholder-gray-500 text-black"
              />
            </div>
            {errors.guide && <p className="text-red-500 text-sm mt-1">{errors.guide}</p>}
          </div>

          {/* Date of Registration */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Date of Registration <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="date"
                name="date1"
                required
                value={formData.date1}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-black"
              />
            </div>
            {errors.date1 && <p className="text-red-500 text-sm mt-1">{errors.date1}</p>}
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Document Upload <span className="text-red-500">*</span>
            </label>
            
            {!selectedFileName ? (
              <div className="border-2 border-dashed border-brand-cream rounded-lg p-6 text-center hover:border-brand-secondary transition-colors">
                <input
                  type="file"
                  name="file"
                  accept=".pdf"
                  required
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                <div 
                  className="flex flex-col items-center text-center hover:border-brand-secondary transition-colors"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.add('border-brand-accent'); // Visual feedback
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('border-brand-accent'); // Remove feedback
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('border-brand-accent'); // Remove feedback
                    
                    // Get the dropped files
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      // Validate file type (PDF only in this case)
                      if (files[0].type === 'application/pdf') {
                        handleFileChange({ target: { files } }); // Reuse your existing handler
                      } else {
                        toast.error('Please upload only PDF files');
                      }
                    }
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Upload 
                      className="h-12 w-12 text-brand-secondary mb-4" 
                      onClick={() => fileInputRef.current?.click()}
                    />
                    <p className="text-brand-primary font-medium mb-2">Click to upload or drag and drop</p>
                    <p className="text-brand-secondary text-sm">PDF files only</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 px-4 py-2 bg-brand-secondary text-white rounded-lg hover:bg-brand-accent transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-brand-cream rounded-lg p-4 bg-gradient-subtle">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileIcon className="h-8 w-8 text-brand-secondary mr-3" />
                    <div>
                      <p className="text-brand-primary font-medium">{selectedFileName}</p>
                      <p className="text-brand-secondary text-sm">PDF Document</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            
            {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
            
          </div>

          {/* Buttons */}
          <div className="flex justify-center space-x-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-brand-secondary text-white font-medium rounded-lg hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit'
              )}
            </button>
            <button
              type="reset"
              disabled={loading}
              className="px-6 py-3 bg-brand-highlight text-brand-primary font-medium rounded-lg hover:bg-brand-warm focus:outline-none focus:ring-2 focus:ring-brand-highlight focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Reset Form
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-subtle p-4 text-center">
          <p className="text-sm text-brand-secondary">
            Please ensure all information is accurate and complete before submission
          </p>
        </div>
      </form>
    </div>
  );
}