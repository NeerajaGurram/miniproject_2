'use client';
import toast from 'react-hot-toast';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import { Globe, Upload, Calendar, Check, Ban, Award, FileIcon, X } from 'lucide-react';

export default function VisitsPage() {
  const {user, token} = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    type1: '',
    place: '',
    purpose: '',
    agency: '',
    amount: '',
    date1: '',
    date2: '',
    file: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [visitsData, setVisitsData] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [actionType, setActionType] = useState('');

  // Fetch visits data for incharge
  useEffect(() => {
    if (user?.role === 'incharge') {
      fetchVisitsData();
    }
  }, [user, token]);

  const fetchVisitsData = async () => {
    try {
      setLoadingVisits(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/visits?status=Pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch visits data');
      }
      
      const result = await response.json();
      setVisitsData(result);
      console.log('Fetched visits data:', result);
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Failed to load visits data');
    } finally {
      setLoadingVisits(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
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
      // Check file size before setting it
      if (file.size > 50 * 1024 * 1024) { // 50MB in bytes
        toast.error('File size exceeds 50MB limit. Please choose a smaller file.');
        setErrors(prev => ({ ...prev, file: 'File size must be less than 50MB' }));
        
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
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
    
    if (!formData.type1) newErrors.type1 = "Type of place is required";
    if (!formData.place.trim()) newErrors.place = "Place is required";
    if (!formData.purpose.trim()) newErrors.purpose = "Purpose is required";
    if (!formData.agency.trim()) newErrors.agency = "Funding agency is required";
    if (!formData.amount.trim()) newErrors.amount = "Amount is required";
    if (!formData.date1) newErrors.date1 = "Starting date is required";
    if (!formData.date2) newErrors.date2 = "Ending date is required";
    if (!formData.file) newErrors.file = "Document upload is required";
    else if (formData.file.type !== 'application/pdf') {
      newErrors.file = "Only PDF files are allowed";
    }

    if (formData.date1 && formData.date2 && new Date(formData.date1) > new Date(formData.date2)) {
      newErrors.date2 = "Ending date must be after starting date";
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
      submissionData.append('type1', formData.type1);
      submissionData.append('place', formData.place);
      submissionData.append('purpose', formData.purpose);
      submissionData.append('agency', formData.agency);
      submissionData.append('amount', formData.amount);
      submissionData.append('date1', formData.date1);
      submissionData.append('date2', formData.date2);
      submissionData.append('file', formData.file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/visits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submissionData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit visit details');
      }

      const result = await response.json();
      console.log('Submission successful:', result);
      toast.success('Visit details submitted successfully!');
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
      type1: '',
      place: '',
      purpose: '',
      agency: '',
      amount: '',
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

    const openConfirmDialog = (visit, action) => {
    setSelectedVisit(visit);
    setActionType(action);
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setSelectedVisit(null);
    setActionType('');
  };

  const handleStatusChange = async () => {
    try {
      // console.log('slected',selectedVisit._id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/visits/${selectedVisit._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: actionType === 'accept' ? 'Accepted' : 'Rejected' })
      });

      if (!response.ok) {
        throw new Error('Failed to update visit status');
      }

      toast.success(`Visit ${actionType === 'accept' ? 'accepted' : 'rejected'} successfully`);
      fetchVisitsData(); // Refresh the data
    } catch (error) {
      console.error('Error updating visit status:', error);
      toast.error('Failed to update visit status');
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
        <div className="bg-gradient-brand p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Globe className="h-8 w-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">International Visits</h2>
          </div>
          <p className="text-brand-cream text-sm">Submit your international visit details</p>
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

          {/* Type of Place */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Type of Place <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="type1"
                required
                value={formData.type1}
                onChange={handleChange}
                className="w-full p-3 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors bg-white text-gray-900"
              >
                <option value="">Select Type</option>
                <option value="University">University</option>
                <option value="Country">Country</option>
                <option value="University&Country">University/Country</option>
              </select>
            </div>
            {errors.type1 && <p className="text-red-500 text-sm mt-1">{errors.type1}</p>}
          </div>

          {/* Place */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Place <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="place"
                placeholder="Enter place"
                required
                value={formData.place}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.place && <p className="text-red-500 text-sm mt-1">{errors.place}</p>}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Purpose <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="purpose"
                placeholder="Enter purpose"
                required
                value={formData.purpose}
                onChange={handleChange}
                className="w-full p-3 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.purpose && <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>}
          </div>

          {/* Funding Agency */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Funding Agency <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="agency"
                placeholder="Enter funding agency"
                required
                value={formData.agency}
                onChange={handleChange}
                className="w-full p-3 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.agency && <p className="text-red-500 text-sm mt-1">{errors.agency}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Amount % <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="amount"
                placeholder="Enter amount with %"
                required
                value={formData.amount}
                onChange={handleChange}
                className="w-full p-3 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>

          {/* Starting Date */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Starting Date <span className="text-red-500">*</span>
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

          {/* Ending Date */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Ending Date <span className="text-red-500">*</span>
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

        <div className="bg-gradient-subtle p-4 text-center">
          <p className="text-sm text-brand-secondary">
            Please ensure all information is accurate and complete before submission
          </p>
        </div>
      </form>
    </div>
  );
}
  if (user?.role === 'incharge') {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="bg-gradient-brand p-6 text-center mb-6 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Award className="h-8 w-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">Visits Approval</h2>
          </div>
          <p className="text-brand-cream text-sm">Review and approve visits from your department</p>
        </div>

        {loadingVisits ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mx-auto mb-4"></div>
            <p>Loading visits data...</p>
          </div>
        ) : visitsData.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-brand-primary">
                {visitsData.length} visit{visitsData.length !== 1 ? 's' : ''} pending approval
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
                      Type
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Place
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Purpose
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Funding Agency
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Amount%
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Starting Date
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Ending Date
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
                  {visitsData.map((visit, index) => (
                    <tr key={index} className="hover:bg-gray-50 even:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {visit.empId}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {visit.employee}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {visit.type1}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {visit.place}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {visit.purpose}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {visit.agency}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {visit.amount}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {visit.date1 ? new Date(visit.date1).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {visit.date2 ? new Date(visit.date2).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-center border-b border-brand-cream">
                        {visit.path ? (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/visits/file/${visit.path}`}
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
                            onClick={() => openConfirmDialog(visit, 'accept')}
                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors cursor-pointer"
                            title="Accept"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openConfirmDialog(visit, 'reject')}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
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
            <p className="text-brand-primary font-medium">No pending visits found for your department.</p>
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
                Are you sure you want to {actionType} this visit? This action cannot be undone.
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
        Return to Dashboard
      </a>
    </div>
  );
}