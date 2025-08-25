'use client';
import toast from 'react-hot-toast';
import React, { use, useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import { Award, BookOpen, Upload, Calendar, Check, Ban, Building, FileText, Type, FileIcon, X } from 'lucide-react';

export default function BooksPage() {
  const {user, token} = useAuth(); 
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    book: '',
    type1: '',
    publisher: '',
    publ: '',
    date1: '',
    file: null
  });

  const [errors, setErrors] = useState({});
  const [selectedFileName, setSelectedFileName] = useState('');
  const [booksData, setBooksData] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');

  // Fetch books data for incharge
  useEffect(() => {
    if (user?.role === 'incharge') {
      fetchBooksData();
    }
  }, [user, token]);

  const fetchBooksData = async () => {
    try {
      setLoadingBooks(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books?status=Pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch books data');
      }
      
      const result = await response.json();
      setBooksData(result);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to load books data');
    } finally {
      setLoadingBooks(false);
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
    
    if (!formData.book.trim()) newErrors.book = "Book name is required";
    if (!formData.type1) newErrors.type1 = "Please select book type";
    if (!formData.publisher.trim()) newErrors.publisher = "Publisher is required";
    if (!formData.publ.trim()) newErrors.publ = "Publication details are required";
    if (!formData.date1) newErrors.date1 = "Publication date is required";
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

  try {
    setLoading(true);
    const submissionData = new FormData();
    submissionData.append('book', formData.book);
    submissionData.append('type1', formData.type1);
    submissionData.append('publisher', formData.publisher);
    submissionData.append('publ', formData.publ);
    submissionData.append('date1', formData.date1);
    submissionData.append('file', formData.file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books`, {
      method: 'POST',
      body: submissionData,
      headers: {
        'Authorization': `Bearer ${token}`
        // DO NOT set Content-Type here; browser will set it for FormData
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    toast.success('Book submitted successfully!');
    handleReset();
  } catch (error) {
    toast.error(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleReset = () => {
    setFormData({
      book: '',
      type1: '',
      publisher: '',
      publ: '',
      date1: '',
      file: null
    });
    setErrors({});
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openConfirmDialog = (book, action) => {
    setSelectedBook(book);
    setActionType(action);
    setReason(''); // Reset reason when opening dialog
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setSelectedBook(null);
    setActionType('');
  };

  const handleStatusChange = async () => {
    try {
      // For rejections, require a reason
      if (actionType === 'reject' && !reason.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/${selectedBook._id}/status`, {
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
        throw new Error('Failed to update book status');
      }

      toast.success(`Book ${actionType === 'accept' ? 'accepted' : 'rejected'} successfully`);
      fetchBooksData(); // Refresh the data
    } catch (error) {
      console.error('Error updating book status:', error);
      toast.error('Failed to update book status');
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
                <BookOpen className="h-8 w-8 text-white mr-3" />
                <h2 className="text-2xl font-bold text-white">Book Publications</h2>
              </div>
              <p className="text-brand-cream text-sm">Submit your book publication details</p>
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

              {/* Book Name */}
              <div>
                <label className="block text-sm font-medium text-brand-primary mb-2">
                  Book Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
                  <input
                    type="text"
                    name="book"
                    placeholder="Enter book title"
                    required
                    value={formData.book}
                    onChange={handleChange}
                    className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
                  />
                </div>
                {errors.book && <p className="text-red-500 text-sm mt-1">{errors.book}</p>}
              </div>

              {/* Type of book */}
              <div>
                <label className="block text-sm font-medium text-brand-primary mb-2">
                  Book Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
                  <select
                    name="type1"
                    required
                    value={formData.type1}
                    onChange={handleChange}
                    className="w-full p-3 pl-10 pr-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors bg-white text-gray-900"
                  >
                    <option value="">Select Book Type</option>
                    <option value="Authored">Authored</option>
                    <option value="Edited">Edited</option>
                    <option value="Translated">Translated</option>
                    <option value="Proceedings">Conference Proceedings</option>
                    <option value="Chapter">Chapter authored</option>
                    <option value="Paper authored">Paper authored</option>
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
                    className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
                  />
                </div>
                {errors.publisher && <p className="text-red-500 text-sm mt-1">{errors.publisher}</p>}
              </div>

              {/* Publication Details */}
              <div>
                <label className="block text-sm font-medium text-brand-primary mb-2">
                  Publication Details <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-brand-secondary" />
                  <textarea
                    rows="4"
                    name="publ"
                    placeholder="Enter publication details, ISBN, edition, etc."
                    required
                    value={formData.publ}
                    onChange={handleChange}
                    className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500 resize-none"
                  />
                </div>
                {errors.publ && <p className="text-red-500 text-sm mt-1">{errors.publ}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-brand-primary mb-2">
                  Publication Date <span className="text-red-500">*</span>
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
            <h2 className="text-2xl font-bold text-white">Books Approval</h2>
          </div>
          <p className="text-brand-cream text-sm">Review and approve books from your department</p>
        </div>

        {loadingBooks ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mx-auto mb-4"></div>
            <p>Loading books data...</p>
          </div>
        ) : booksData.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-brand-primary">
                {booksData.length} book{booksData.length !== 1 ? 's' : ''} pending approval
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
                      Book Title
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Type
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Publisher
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                      Publication Details
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
                  {booksData.map((book, index) => (
                    <tr key={index} className="hover:bg-gray-50 even:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {book.empId}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {book.employee}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {book.book}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {book.type1}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {book.publisher}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {book.pub1}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                        {book.sdate ? new Date(book.sdate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-center border-b border-brand-cream">
                        {book.path ? (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/books/file/${book.path}`}
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
                            onClick={() => openConfirmDialog(book, 'accept')}
                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors cursor-pointer"
                            title="Accept"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openConfirmDialog(book, 'reject')}
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
            <p className="text-brand-primary font-medium">No pending books found for your department.</p>
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
                    placeholder="Please provide a reason for rejecting this book"
                    className="w-full p-3 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
                    rows="2"
                    required
                  />
                </div>
              )}
              <p className="text-gray-600 mb-6">
                Are you sure you want to {actionType} this book? This action cannot be undone.
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