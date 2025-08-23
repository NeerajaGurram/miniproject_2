'use client';
import DashboardLayout from '../../components/DashboardLayout';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import { Award, Upload, Calendar, Building, FileText, Star, Users, FileIcon, X, Check, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AwardsPage() {
  const {user, token} = useAuth(); 
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    award: '',
    type1: '',
    type2: '',
    agency: '',
    ifany: '',
    date2: '',
    file: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [awardsData, setAwardsData] = useState([]);
  const [loadingAwards, setLoadingAwards] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedAward, setSelectedAward] = useState(null);
  const [actionType, setActionType] = useState('');

  // Fetch awards data for incharge
  useEffect(() => {
    if (user?.role === 'incharge') {
      fetchAwardsData();
    }
  }, [user, token]);

  const fetchAwardsData = async () => {
    try {
      setLoadingAwards(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/awards?status=Pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch awards data');
      }
      
      const result = await response.json();
      setAwardsData(result);
    } catch (error) {
      console.error('Error fetching awards:', error);
      toast.error('Failed to load awards data');
    } finally {
      setLoadingAwards(false);
    }
  };

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
    
    if (!formData.award.trim()) newErrors.award = "Award title is required";
    if (!formData.type1) newErrors.type1 = "Please select award type";
    if (!formData.type2) newErrors.type2 = "Please select agency type";
    if (!formData.agency.trim()) newErrors.agency = "Agency name is required";
    if (!formData.ifany.trim()) newErrors.ifany = "This field is required";
    if (!formData.date2) newErrors.date2 = "Date is required";
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
        submissionData.append('award', formData.award);
        submissionData.append('type1', formData.type1);
        submissionData.append('type2', formData.type2);
        submissionData.append('agency', formData.agency);
        submissionData.append('ifany', formData.ifany);
        submissionData.append('date2', formData.date2);
        submissionData.append('file', formData.file);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/awards`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: submissionData
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit Award details');
        }

        const result = await response.json();
        console.log('Submission successful:', result);
        toast.success('Award details submitted successfully!');
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
      award: '',
      type1: '',
      type2: '',
      agency: '',
      ifany: '',
      date2: '',
      file: null
    });
    setErrors({});
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const openConfirmDialog = (award, action) => {
    setSelectedAward(award);
    setActionType(action);
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setSelectedAward(null);
    setActionType('');
  };

  const handleStatusChange = async () => {
    try {
      console.log('slected',selectedAward._id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/awards/${selectedAward._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: actionType === 'accept' ? 'Accepted' : 'Rejected' })
      });

      if (!response.ok) {
        throw new Error('Failed to update award status');
      }

      toast.success(`Award ${actionType === 'accept' ? 'accepted' : 'rejected'} successfully`);
      fetchAwardsData(); // Refresh the data
    } catch (error) {
      console.error('Error updating award status:', error);
      toast.error('Failed to update award status');
    } finally {
      closeConfirmDialog();
    }
  };

  // Render faculty form
  if (user?.role === 'faculty') {
    return (
      <div className="flex justify-center p-4">
        <form 
          onSubmit={handleSubmit}
          onReset={handleReset}
          className="w-full max-w-4xl bg-white border border-brand-cream rounded-lg overflow-hidden shadow-lg"
        >
          {/* Header */}
          <div className="bg-gradient-brand p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-8 w-8 text-white mr-3" />
              <h2 className="text-2xl font-bold text-white">Awards</h2>
            </div>
            <p className="text-brand-cream text-sm">Submit your awards details</p>
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

            {/* Award Title */}
            <div>
              <label className="block text-sm font-medium text-brand-primary mb-2">
                Award Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
                <input
                  type="text"
                  name="award"
                  placeholder="Enter award title"
                  required
                  value={formData.award}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>
              {errors.award && <p className="text-red-500 text-sm mt-1">{errors.award}</p>}
            </div>

            {/* Type of Award */}
            <div>
              <label className="block text-sm font-medium text-brand-primary mb-2">
                Award Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
                <select
                  name="type1"
                  required
                  value={formData.type1}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 pr-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors bg-white text-gray-900"
                >
                  <option value="">Select Award Type</option>
                  <option value="Unitary">Unitary</option>
                  <option value="Shared">Shared</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                </div>
              </div>
              {errors.type1 && <p className="text-red-500 text-sm mt-1">{errors.type1}</p>}
            </div>

            {/* Type of Agency */}
            <div>
              <label className="block text-sm font-medium text-brand-primary mb-2">
                Agency Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
                <select
                  name="type2"
                  required
                  value={formData.type2}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 pr-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors bg-white text-gray-900"
                >
                  <option value="">Select Agency Type</option>
                  <option value="Agency">Agency</option>
                  <option value="Organization">Organization</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                </div>
              </div>
              {errors.type2 && <p className="text-red-500 text-sm mt-1">{errors.type2}</p>}
            </div>

            {/* Agency Name */}
            <div>
              <label className="block text-sm font-medium text-brand-primary mb-2">
                Agency Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
                <input
                  type="text"
                  name="agency"
                  placeholder="Enter agency name"
                  required
                  value={formData.agency}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>
              {errors.agency && <p className="text-red-500 text-sm mt-1">{errors.agency}</p>}
            </div>

            {/* If Any */}
            <div>
              <label className="block text-sm font-medium text-brand-primary mb-2">
                Event Details <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
                <input
                  type="text"
                  name="ifany"
                  placeholder="Enter event details, if any"
                  required
                  value={formData.ifany}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>
              {errors.ifany && <p className="text-red-500 text-sm mt-1">{errors.ifany}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-brand-primary mb-2">
                Award Date <span className="text-red-500">*</span>
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
                      e.currentTarget.classList.add('border-brand-accent');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-brand-accent');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-brand-accent');
                      
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        if (files[0].type === 'application/pdf') {
                          handleFileChange({ target: { files } });
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
                      <p className="text-brand-secondary text-sm">PDF files only(Max size: 50MB)</p>
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

  // Render incharge view
  if (user?.role === 'incharge') {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="bg-gradient-brand p-6 text-center mb-6 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Award className="h-8 w-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">Awards Approval</h2>
          </div>
          <p className="text-brand-cream text-sm">Review and approve awards from your department</p>
        </div>

        {loadingAwards ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mx-auto mb-4"></div>
            <p>Loading awards data...</p>
          </div>
        ) : awardsData.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-brand-primary">
                {awardsData.length} award{awardsData.length !== 1 ? 's' : ''} pending approval
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-brand-primary">
              <table className="min-w-full bg-white border-separate">
                <thead>
                  <tr className="bg-gradient-subtle">
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Employee ID
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Employee Name
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Award Title
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Award Type
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Agency Type
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Agency Name
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Event Details
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Date
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Document
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {awardsData.map((award, index) => (
                    <tr key={index} className="hover:bg-gray-50 even:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {award.empId}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {award.employee}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {award.award}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {award.type1}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {award.type2}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {award.agency}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {award.ifany}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {award.date2 ? new Date(award.date2).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-center border-b border-brand-cream">
                        {award.path ? (
                          <a 
                            href={`${process.env.NEXT_PUBLIC_API_URL}/awards/file/${award.path}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-brand-secondary hover:text-brand-accent font-medium"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-center border-b border-brand-cream">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => openConfirmDialog(award, 'accept')}
                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                            title="Accept"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openConfirmDialog(award, 'reject')}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            title="Reject"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center p-8 bg-gradient-subtle rounded-lg border border-brand-cream">
            <p className="text-brand-primary font-medium">No pending awards found for your department.</p>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-brand-primary mb-4">
                Confirm {actionType === 'accept' ? 'Acceptance' : 'Rejection'}
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to {actionType} this award? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeConfirmDialog}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusChange}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    actionType === 'accept' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  Confirm {actionType === 'accept' ? 'Accept' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default return for other roles
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-brand-primary p-6">
      <div className="text-6xl mb-4 animate-bounce">🚫</div>
      <h1 className="lg:text-5xl text-2xl font-bold mb-2">404 - Page Not Found</h1>
      <p className="text-lg text-gray-600 mb-6">
        Sorry, we couldn’t find that page.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-brand-primary text-white rounded-lg shadow hover:bg-brand-secondary transition"
      >
        Go Home
      </a>
    </div>
  );
}