'use client';
import DashboardLayout from '../../components/DashboardLayout';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../../lib/auth';
import Link from 'next/link';
import { FileText, Upload, Calendar, Building, Globe, Users, Award, FileIcon, X, MapPin } from 'lucide-react';

export default function S_c_w_fdp_gPage() {
  const { user, token } = useAuth(); 
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    type1: '',
    type2: '',
    type3: '',
    host: '',
    agency: 'SELF',
    comment: '',
    date1: '',
    date2: '',
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
    
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.type1) newErrors.type1 = "Please select event type";
    if (!formData.type2) newErrors.type2 = "Please select participation type";
    if (!formData.type3) newErrors.type3 = "Please select place type";
    if (!formData.host.trim()) newErrors.host = "Host is required";
    if (!formData.agency.trim()) newErrors.agency = "Sponsoring agency is required";
    if (!formData.comment.trim()) newErrors.comment = "Description is required";
    if (!formData.date1) newErrors.date1 = "Start date is required";
    if (!formData.date2) newErrors.date2 = "End date is required";
    if (!formData.file) newErrors.file = "Document upload is required";
    else if (formData.file.type !== 'application/pdf') {
      newErrors.file = "Only PDF files are allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try{
      setLoading(true);
      const submissionData = new FormData();
      submissionData.append('title', formData.title);
      submissionData.append('type1', formData.type1);
      submissionData.append('type2', formData.type2);
      submissionData.append('type3', formData.type3);
      submissionData.append('host', formData.host);
      submissionData.append('agency', formData.agency);
      submissionData.append('comment', formData.comment);
      submissionData.append('date1', formData.date1);
      submissionData.append('date2', formData.date2);
      submissionData.append('file', formData.file);

      // Submit the form data to the backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/s-c-w-fdp-g`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submissionData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit s-c-w-fdp-g details');
      }

      const result = await response.json();
      console.log('Submission successful:', result);
      
      // Show success message to user
      toast.success('s-c-w-fdp-g details submitted successfully!');

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
      title: '',
      type1: '',
      type2: '',
      type3: '',
      host: '',
      agency: 'SELF',
      comment: '',
      date1: '',
      date2: '',
      file: null
    });
    setErrors({});
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
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
            <FileText className="h-8 w-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">
              Seminars/Conferences/Workshops/FDPs/Guest Lectures
            </h2>
          </div>
          <p className="text-brand-cream text-sm">Submit your event participation details</p>
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

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="title"
                placeholder="Title/Theme of the event"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors placeholder-gray-500 text-black"
              />
            </div>
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Type of Event */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Event Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <select
                name="type1"
                required
                value={formData.type1}
                onChange={handleChange}
                className="w-full p-3 pl-10 pr-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors "
              >
                <option value="">Select Event Type</option>
                <option value="Seminar">Seminar</option>
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="FDP">FDP</option>
                <option value="GuestLecture">Guest Lecture</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              </div>
            </div>
            {errors.type1 && <p className="text-red-500 text-sm mt-1">{errors.type1}</p>}
          </div>

          {/* Organized/Participation */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Participation Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <select
                name="type2"
                required
                value={formData.type2}
                onChange={handleChange}
                className="w-full p-3 pl-10 pr-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors "
              >
                <option value="">Select Participation Type</option>
                <option value="Organized">Organized</option>
                <option value="Participated">Participation</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              </div>
            </div>
            {errors.type2 && <p className="text-red-500 text-sm mt-1">{errors.type2}</p>}
          </div>

          {/* Type of Place */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Place Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <select
                name="type3"
                required
                value={formData.type3}
                onChange={handleChange}
                className="w-full p-3 pl-10 pr-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors "
              >
                <option value="">Select Place Type</option>
                <option value="International">International</option>
                <option value="National">National</option>
                <option value="Regional">Regional</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              </div>
            </div>
            {errors.type3 && <p className="text-red-500 text-sm mt-1">{errors.type3}</p>}
          </div>

          {/* Host */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Host <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="host"
                placeholder="Enter host place"
                required
                value={formData.host}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.host && <p className="text-red-500 text-sm mt-1">{errors.host}</p>}
          </div>

          {/* Sponsoring Agency */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Sponsoring Agency <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                list="agencies"
                name="agency"
                placeholder="Enter sponsoring agency"
                required
                value={formData.agency}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
              <datalist id="agencies">
                <option>SELF</option>
              </datalist>
            </div>
            {errors.agency && <p className="text-red-500 text-sm mt-1">{errors.agency}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Event Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-brand-secondary" />
              <textarea
                rows="4"
                name="comment"
                placeholder="Names, Designation and Address of the Speaker(s)"
                required
                value={formData.comment}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500 resize-none"
              />
            </div>
            {errors.comment && <p className="text-red-500 text-sm mt-1">{errors.comment}</p>}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="date"
                name="date1"
                required
                value={formData.date1}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900"
              />
            </div>
            {errors.date1 && <p className="text-red-500 text-sm mt-1">{errors.date1}</p>}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="date"
                name="date2"
                required
                value={formData.date2}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900"
              />
            </div>
            {errors.date2 && <p className="text-red-500 text-sm mt-1">{errors.date2}</p>}
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