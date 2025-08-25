'use client';
import toast from 'react-hot-toast';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import { BookOpen, Upload, Calendar,Check, Ban, Building, FileText, Award, FileIcon, X, Edit3 } from 'lucide-react';

export default function JournalEditedPage() {
  const {user, token} = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    journal: '',
    pub1: '',
    paper: '',
    type1: '',
    publisher: '',
    sdate: '',
    file: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [journalseditedData, setJournalsEditedData] = useState([]);
  const [loadingJournalsEdited, setLoadingJournalsEdited] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedJournalEdited, setSelectedJournalEdited] = useState(null);
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');

  // Fetch journals edited data for incharge
  useEffect(() => {
    if (user?.role === 'incharge') {
      fetchJournalsEditedData();
    }
  }, [user, token]);

  const fetchJournalsEditedData = async () => {
    try {
      setLoadingJournalsEdited(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/journaledited?status=Pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch journals edited data');
      }
      
      const result = await response.json();
      setJournalsEditedData(result);
    } catch (error) {
      console.error('Error fetching journals edited:', error);
      toast.error('Failed to load journals edited data');
    } finally {
      setLoadingJournalsEdited(false);
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
    
    if (!formData.journal.trim()) newErrors.journal = "Journal name is required";
    if (!formData.pub1.trim()) newErrors.pub1 = "Journal details are required";
    if (!formData.paper.trim()) newErrors.paper = "Paper name is required";
    if (!formData.type1) newErrors.type1 = "Please select type of work";
    if (!formData.publisher.trim()) newErrors.publisher = "Publisher is required";
    if (!formData.sdate) newErrors.sdate = "Date is required";
    if (!formData.file) newErrors.file = "Document upload is required";
    else if (formData.file.type !== 'application/pdf') {
      newErrors.file = "Only PDF files are allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return
    try {
      setLoading(true);
      const submissionData = new FormData();
      submissionData.append('journal', formData.journal);
      submissionData.append('pub1', formData.pub1);
      submissionData.append('paper', formData.paper);
      submissionData.append('type1', formData.type1);
      submissionData.append('publisher', formData.publisher);
      submissionData.append('sdate', formData.sdate);
      submissionData.append('file', formData.file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/journaledited`, {
        method: 'POST',
        body: submissionData,  // Use the new variable here
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit Journal edited details');
      }

      const result = await response.json();
      console.log('Submission successful:', result);
      
      // Show success message to user
      toast.success('Journal edited details submitted successfully!');

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
      journal: '',
      pub1: '',
      paper: '',
      type1: '',
      publisher: '',
      sdate: '',
      file: null
    });
    setErrors({});
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // Reset file input
    }
  };

  const openConfirmDialog = (journaledited, action) => {
    setSelectedJournalEdited(journaledited);
    setActionType(action);
    setReason(''); // Reset reason when opening dialog
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setSelectedJournalEdited(null);
    setActionType('');
  };

  const handleStatusChange = async () => {
    try {
      // For rejections, require a reason
      if (actionType === 'reject' && !reason.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/journaledited/${selectedJournalEdited._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: actionType === 'accept' ? 'Accepted' : 'Rejected',
          reason: actionType === 'reject' ? reason : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update journal edited status');
      }

      toast.success(`Journal edited ${actionType === 'accept' ? 'accepted' : 'rejected'} successfully`);
      fetchJournalsEditedData(); // Refresh the data
    } catch (error) {
      console.error('Error updating journal edited status:', error);
      toast.error('Failed to update journal edited status');
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
        encType="multipart/form-data"
      >
        {/* Header */}
        <div className="bg-gradient-brand p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Edit3 className="h-8 w-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">Journal Edited/Reviewed</h2>
          </div>
          <p className="text-brand-cream text-sm">Submit your journal editing and reviewing details</p>
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

          {/* Journal Name */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Journal Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="journal"
                placeholder="Enter journal name"
                required
                value={formData.journal}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors placeholder-gray-500 text-black"
              />
            </div>
            {errors.journal && <p className="text-red-500 text-sm mt-1">{errors.journal}</p>}
          </div>

          {/* Journal Details */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Journal Details <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-brand-secondary" />
              <textarea
                rows="4"
                name="pub1"
                placeholder="Enter journal details"
                required
                value={formData.pub1}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors placeholder-gray-500 text-black resize-none"
              />
            </div>
            {errors.pub1 && <p className="text-red-500 text-sm mt-1">{errors.pub1}</p>}
          </div>

          {/* Paper Name */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Paper Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="paper"
                placeholder="Enter paper title"
                required
                value={formData.paper}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors placeholder-gray-500 text-black"
              />
            </div>
            {errors.paper && <p className="text-red-500 text-sm mt-1">{errors.paper}</p>}
          </div>

          {/* Type of Work */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Type of Work <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <select
                name="type1"
                required
                value={formData.type1}
                onChange={handleChange}
                className="w-full p-3 pl-10 pr-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors bg-white text-black"
              >
                <option value="">Select Work Type</option>
                <option value="Edited">Edited</option>
                <option value="Reviewed">Reviewed</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              </div>
            </div>
            {errors.type1 && <p className="text-red-500 text-sm mt-1">{errors.type1}</p>}
          </div>

          {/* Publisher */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Publisher <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="publisher"
                placeholder="Enter publisher name"
                required
                value={formData.publisher}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors placeholder-gray-500 text-black"
              />
            </div>
            {errors.publisher && <p className="text-red-500 text-sm mt-1">{errors.publisher}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="date"
                name="sdate"
                required
                value={formData.sdate}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-black"
              />
            </div>
            {errors.sdate && <p className="text-red-500 text-sm mt-1">{errors.sdate}</p>}
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
  if (user?.role === 'incharge') {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="bg-gradient-brand p-6 text-center mb-6 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Award className="h-8 w-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">Journals Edited Approval</h2>
          </div>
          <p className="text-brand-cream text-sm">Review and approve journals edited from your department</p>
        </div>

        {loadingJournalsEdited ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mx-auto mb-4"></div>
            <p>Loading journals edited data...</p>
          </div>
        ) : journalseditedData.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-brand-primary">
                {journalseditedData.length} journal edited{journalseditedData.length !== 1 ? 's' : ''} pending approval
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
                      Journal Title
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Paper Title
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Type of Work
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Publisher
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Date
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Journal Details
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
                  {journalseditedData.map((journaledited, index) => (
                    <tr key={index} className="hover:bg-gray-50 even:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journaledited.empId}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journaledited.employee}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journaledited.journal}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journaledited.paper}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journaledited.type1}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journaledited.publisher}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journaledited.sdate ? new Date(journaledited.sdate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journaledited.pub1}
                      </td>
                      <td className="py-3 px-4 text-sm text-center border-b border-brand-cream">
                        {journaledited.path ? (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/journaledited/file/${journaledited.path}`}
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
                            onClick={() => openConfirmDialog(journaledited, 'accept')}
                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors cursor-pointer"
                            title="Accept"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openConfirmDialog(journaledited, 'reject')}
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
            <p className="text-brand-primary font-medium">No pending journals edited found for your department.</p>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-brand-primary mb-4">
                Confirm {actionType === 'accept' ? 'Acceptance' : 'Rejection'}
              </h3>
              {actionType === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-primary mb-2">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this journal edited"
                    className="w-full p-3 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
                    rows="2"
                    required
                  />
                </div>
              )}
              <p className="text-gray-600 mb-6">
                Are you sure you want to {actionType} this journal edited? This action cannot be undone.
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