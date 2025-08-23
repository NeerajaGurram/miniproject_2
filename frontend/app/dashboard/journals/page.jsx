'use client';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import { BookOpen, Upload, Calendar, Check, Ban, Hash, FileText, User, Award, Globe, FileIcon, X } from 'lucide-react';

export default function JournalsPage() {
  const {user, token} = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    issuedate: '',
    jnumber: '',
    pnumber: '',
    pos: '',
    issn: '',
    impact: '',
    type1: '',
    scopus: '',
    pdate: '',
    file: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [journalsData, setJournalsData] = useState([]);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [actionType, setActionType] = useState('');

  // Fetch journals data for incharge
  useEffect(() => {
    if (user?.role === 'incharge') {
      fetchJournalsData();
    }
  }, [user, token]);

  const fetchJournalsData = async () => {
    try {
      setLoadingJournals(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/journals?status=Pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch journals data');
      }
      
      const result = await response.json();
      setJournalsData(result);
    } catch (error) {
      console.error('Error fetching journals:', error);
      toast.error('Failed to load journals data');
    } finally {
      setLoadingJournals(false);
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
    
    if (!formData.title.trim()) newErrors.title = "Title of the paper is required";
    if (!formData.name.trim()) newErrors.name = "Journal name is required";
    if (!formData.issuedate) newErrors.issuedate = "Issue date is required";
    if (!formData.jnumber.trim()) newErrors.jnumber = "Journal number is required";
    if (!formData.pnumber.trim()) newErrors.pnumber = "Page number is required";
    if (!formData.pos) newErrors.pos = "Author position is required";
    if (formData.pos < 1 || formData.pos > 5) newErrors.pos = "Author position must be between 1 and 5";
    if (!formData.issn.trim()) newErrors.issn = "ISSN is required";
    if (!formData.impact.trim()) newErrors.impact = "Impact factor is required";
    if (!formData.type1) newErrors.type1 = "Type of journal is required";
    if (!formData.scopus.trim()) newErrors.scopus = "Scopus information is required";
    if (!formData.pdate) newErrors.pdate = "Published date is required";
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
      submissionData.append('title', formData.title);
      submissionData.append('name', formData.name);
      submissionData.append('issuedate', formData.issuedate);
      submissionData.append('jnumber', formData.jnumber);
      submissionData.append('pnumber', formData.pnumber);
      submissionData.append('pos', formData.pos);
      submissionData.append('issn', formData.issn);
      submissionData.append('impact', formData.impact);
      submissionData.append('type1', formData.type1);
      submissionData.append('scopus', formData.scopus);
      submissionData.append('pdate', formData.pdate);
      submissionData.append('file', formData.file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/journals`, {
        method: 'POST',
        body: submissionData,  // Use the new variable here
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit Journal details');
      }

      const result = await response.json();
      console.log('Submission successful:', result);
      
      // Show success message to user
      toast.success('Journal details submitted successfully!');

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
      name: '',
      issuedate: '',
      jnumber: '',
      pnumber: '',
      pos: '',
      issn: '',
      impact: '',
      type1: '',
      scopus: '',
      pdate: '',
      file: null
    });
    setErrors({});
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openConfirmDialog = (journal, action) => {
    setSelectedJournal(journal);
    setActionType(action);
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setSelectedJournal(null);
    setActionType('');
  };

  const handleStatusChange = async () => {
    try {
      console.log('slected',selectedJournal._id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/journals/${selectedJournal._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: actionType === 'accept' ? 'Accepted' : 'Rejected' })
      });

      if (!response.ok) {
        throw new Error('Failed to update journal status');
      }

      toast.success(`Journal ${actionType === 'accept' ? 'accepted' : 'rejected'} successfully`);
      fetchJournalsData(); // Refresh the data
    } catch (error) {
      console.error('Error updating journal status:', error);
      toast.error('Failed to update journal status');
    } finally {
      closeConfirmDialog();
    }
  };

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
            <BookOpen className="h-8 w-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">Journal Publications</h2>
          </div>
          <p className="text-brand-cream text-sm">Submit your journal publication details</p>
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

          {/* Title of the paper */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Title of the Paper <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="title"
                placeholder="Enter the title of your paper"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
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
                name="name"
                placeholder="Enter journal name"
                required
                value={formData.name }
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Issue Date */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Issue Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="date"
                name="issuedate"
                required
                value={formData.issuedate}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900"
              />
            </div>
            {errors.issuedate && <p className="text-red-500 text-sm mt-1">{errors.issuedate}</p>}
          </div>

          {/* Journal Number */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Journal Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="jnumber"
                placeholder="Enter journal number"
                required
                value={formData.jnumber}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.jnumber && <p className="text-red-500 text-sm mt-1">{errors.jnumber}</p>}
          </div>

          {/* Page Number */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Page Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="pnumber"
                placeholder="Enter page numbers"
                required
                value={formData.pnumber}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.pnumber && <p className="text-red-500 text-sm mt-1">{errors.pnumber}</p>}
          </div>

          {/* Author position */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Author Position <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="number"
                name="pos"
                placeholder="Your position (1-5)"
                required
                min="1"
                max="5"
                value={formData.pos}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.pos && <p className="text-red-500 text-sm mt-1">{errors.pos}</p>}
          </div>

          {/* Issn */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              ISSN <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="issn"
                placeholder="Enter ISSN number"
                required
                value={formData.issn}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.issn && <p className="text-red-500 text-sm mt-1">{errors.issn}</p>}
          </div>

          {/* Impact Factor */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Impact Factor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="text"
                name="impact"
                placeholder="Enter impact factor"
                required
                value={formData.impact}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
            {errors.impact && <p className="text-red-500 text-sm mt-1">{errors.impact}</p>}
          </div>

          {/* Type of Journal */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Type of Journal <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <select
                name="type1"
                required
                value={formData.type1}
                onChange={handleChange}
                className="w-full p-3 pl-10 pr-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors bg-white text-gray-900"
              >
                <option value="">Select Type</option>
                <option value="National">National</option>
                <option value="International">International</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              </div>
            </div>
            {errors.type1 && <p className="text-red-500 text-sm mt-1">{errors.type1}</p>}
          </div>

          {/* Scopus */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Scopus Status <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <select
                name="scopus"
                required
                value={formData.scopus}
                onChange={handleChange}
                className="w-full p-3 pl-10 pr-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors bg-white text-gray-900"
              >
                <option value="">Select Scopus Status</option>
                <option value="Scopus">Scopus</option>
                <option value="Not Scopus">Not Scopus</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              </div>
            </div>
            {errors.scopus && <p className="text-red-500 text-sm mt-1">{errors.scopus}</p>}
          </div>

          {/* Published Date */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-2">
              Published Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
              <input
                type="date"
                name="pdate"
                required
                value={formData.pdate}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900"
              />
            </div>
            {errors.pdate && <p className="text-red-500 text-sm mt-1">{errors.pdate}</p>}
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
            <h2 className="text-2xl font-bold text-white">Journals Approval</h2>
          </div>
          <p className="text-brand-cream text-sm">Review and approve journals from your department</p>
        </div>

        {loadingJournals ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mx-auto mb-4"></div>
            <p>Loading journals data...</p>
          </div>
        ) : journalsData.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-brand-primary">
                {journalsData.length} journal{journalsData.length !== 1 ? 's' : ''} pending approval
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
                      Journal Name
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Issue Date
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Journal Number
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Page Number
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Position
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      ISSN
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Impact Factor
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Type
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Scopus Indexed
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Publication Date
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
                  {journalsData.map((journal, index) => (
                    <tr key={index} className="hover:bg-gray-50 even:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.empId}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.employee}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.title}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.issuedate ? new Date(journal.issuedate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.jnumber}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.pnumber}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.pos}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.issn}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.impact}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.type1}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.scopus}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {journal.pdate ? new Date(journal.pdate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-center border-b border-brand-cream">
                        {journal.path ? (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/journals/file/${journal.path}`}
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
                            onClick={() => openConfirmDialog(journal, 'accept')}
                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                            title="Accept"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openConfirmDialog(journal, 'reject')}
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
            <p className="text-brand-primary font-medium">No pending journals found for your department.</p>
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
                Are you sure you want to {actionType} this journal? This action cannot be undone.
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