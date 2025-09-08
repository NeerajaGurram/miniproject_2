// review/page.jsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../lib/auth';
import { Award, FileText, FileSearch, Globe, GraduationCap, TrendingUp, Users, Check, Ban, Download, Search, Filter, ChevronDown, ChevronUp, ShieldCheck, BookOpen, FileEdit, Briefcase, Building } from 'lucide-react';
import toast from 'react-hot-toast';

// Data structure for different module types
const MODULE_TYPES = {
    seminars: {
      name: 'Seminars/Conferences/Workshops/FDPs/Guest Lectures',
      icon: FileText,
      apiEndpoint: 's-c-w-fdp-g',
      fields: [
        { key: 'empId', label: 'Employee ID' },
        { key: 'employee', label: 'Employee Name' },
        { key: 'title', label: 'Event Title' },
        { key: 'type1', label: 'Event Type' },
        { key: 'type2', label: 'Participation Type' },
        { key: 'type3', label: 'Place Type' },
        { key: 'host', label: 'Host' },
        { key: 'agency', label: 'Sponsoring Agency' },
        { key: 'date1', label: 'Start Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' },
        { key: 'date2', label: 'End Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' }
      ]
    },
    phd: {
        name: 'PhD',
        icon: GraduationCap,
        apiEndpoint: 'phd',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'university', label: 'University' },
            { key: 'special', label: 'Specialization' },
            { key: 'guide', label: 'Guide Name' },
            { key: 'college', label: 'Guide College' },
            { key: 'dept', label: 'Guide Department' },
            { key: 'statuss', label: 'Type' },
            { key: 'sdate', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' }
        ]
    },
    phdguiding: {
        name: 'PhD Guiding',
        icon: ShieldCheck,
        apiEndpoint: 'phdguiding',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'university', label: 'University' },
            { key: 'special', label: 'Specialization' },
            { key: 'name', label: 'Scholar Name' },
            { key: 'sdate', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' }
        ]
    },
    journals: {
        name: 'Journals',
        icon: BookOpen,
        apiEndpoint: 'journals',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'title', label: 'Journal Title' },
            { key: 'name', label: 'Journal Name' },
            { key: 'issuedate', label: 'Issue Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' },
            { key: 'jnumber', label: 'Journal Number' },
            { key: 'pnumber', label: 'Page Number' },
            { key: 'pos', label: 'Position' },
            { key: 'issn', label: 'ISSN' },
            { key: 'impact', label: 'Impact Factor' },
            { key: 'type1', label: 'Type' },
            { key: 'scopus', label: 'Scopus' },
            { key: 'pdate', label: 'Publication Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' }
        ]
    },
    books : {
        name: 'Books',
        icon: FileText,
        apiEndpoint: 'books',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'book', label: 'Book Title' },
            { key: 'type1', label: 'Type' },
            { key: 'publisher', label: 'Publisher' },
            { key: 'pub1', label: 'Publication Details' },
            { key: 'sdate', label: 'Publication Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' },
        ]
    },
    journaledited: {
        name: 'Journal Edited',
        icon: FileEdit,
        apiEndpoint: 'journaledited',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'journal', label: 'Journal Title' },
            { key: 'paper', label: 'Paper Title' },
            { key : 'type1', label: 'Type of Work' },
            { key : 'publisher', label: 'Publisher' },
            { key: 'sdate', label: 'Publication Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' },
            { key: 'pub1', label: 'Journal Details' }
        ]
    },
    researchgrant: {
        name: 'Research Grants',
        icon: TrendingUp,
        apiEndpoint: 'researchgrant',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'title', label: 'Project Title' },
            { key: 'duration', label: 'Duration' },
            { key: 'agency', label: 'Agency' },
            { key: 'letter', label: 'Letter Number' },
            { key: 'amount', label: 'Amount' },
            { key: 'date1', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' },
            { key: 'type1', label: 'Project Status' },
            { key: 'type2', label: 'Project Type' },
            { key: 'comment', label: 'Research Details' }
        ]
    },
    patents: {
        name: 'Patents',
        icon: FileSearch,
        apiEndpoint: 'patents',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'title', label: 'Patent Title' },
            { key: 'fnum', label: 'File Number' },
            { key: 'date1', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' },
            { key: 'status1', label: 'Status' }
        ]
    },
    qualifications: {
        name: 'Qualifications',
        icon: GraduationCap,
        apiEndpoint: 'qualifications',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'impro', label: 'Improved Qualification' },
            { key: 'special', label: 'Improved Specialization' },
            { key: 'type1', label: 'Institution Type' },
            { key: 'name', label: 'Institution Name' },
            { key: 'date1', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' }
        ]
    },
    visits: {
        name: 'International Visits',
        icon: Globe,
        apiEndpoint: 'visits',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'type1', label: 'Type of Place' },
            { key: 'place', label: 'Place' },
            { key: 'purpose', label: 'Purpose' },
            { key: 'agency', label: 'Funding Agency' },
            { key: 'amount', label: 'Amount %' },
            { key: 'date1', label: 'Start Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' },
            { key: 'date2', label: 'End Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' }
        ]
    },
    awards: {
      name: 'Awards',
      icon: Award,
      apiEndpoint: 'awards',
      fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'award', label: 'Award Title' },
            { key: 'type1', label: 'Award Type' },
            { key: 'type2', label: 'Agency Type' },
            { key: 'agency', label: 'Agency Name' },
            { key: 'ifany', label: 'Event Details' },
            { key: 'date2', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' }
      ]
    },
    membership: {
        name: 'Membership',
        icon: Users,
        apiEndpoint: 'membership',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'member', label: 'Membership Title' },
            { key: 'body', label: 'Body Name' },
            { key: 'date2', label: 'Appointment Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' },
            { key: 'term', label: 'Term' }
        ]
    },
    consultancy: {
        name: 'Consultancy',
        icon: Briefcase,
        apiEndpoint: 'consultancy',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'work', label: 'Nature of Work' },
            { key: 'agency', label: 'Agency Name' },
            { key: 'amount', label: 'Amount' },
            { key: 'date', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' }
        ]
    },
    infrastructure: {
        name: 'Infrastructure',
        icon: Building,
        apiEndpoint: 'infrastructure',
        fields: [
            { key: 'empId', label: 'Employee ID' },
            { key: 'employee', label: 'Employee Name' },
            { key: 'title', label: 'Equipment Name' },
            { key: 'title1', label: 'Nature of Equipment' },
            { key: 'comment', label: 'Description' },
            { key: 'title2', label: 'Amount' },
            { key: 'date2', label: 'Purchase Date', format: (value) => value ? new Date(value).toLocaleDateString() : '-' }
        ]
    },
}

const fetchWithRetry = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response; // Return response immediately if successful
      
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      
      // If it's the last attempt, throw the error
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('All retry attempts failed'); // Fallback error
};

export default function ReviewPage() {
  const { user, token, logout } = useAuth();
  const [moduleData, setModuleData] = useState({
    awards: [],
    seminars: [],
    phd: [],
    phdguiding: [],
    journals: [],
    books: [],
    journaledited: [],
    researchgrant: [],
    patents: [],
    qualifications: [],
    visits: [],
    membership: [],
    consultancy: [],
    infrastructure: []
  });
  const [loading, setLoading] = useState({
    awards: false,
    seminars: false,
    phd: false,
    phdguiding: false,
    journals: false,
    books: false,
    journaledited: false,
    researchgrant: false,
    patents: false,
    qualifications: false,
    visits: false,
    membership: false,
    consultancy: false,
    infrastructure: false
  });
//   const [expandedModules, setExpandedModules] = useState({
//     awards: true,
//     seminars: true,
//     phd: true,
//     phdguiding: true,
//     journals: true,
//     books: true,
//     journaledited: true,
//     researchgrant: true,
//     patents: true,
//     qualifications: true,
//     visits: true,
//     membership: true,
//     consultancy: true,
//     infrastructure: true
//   });
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [errors, setErrors] = useState({});

  // Fetch data for all modules
  const [expandedModules, setExpandedModules] = useState({});

  // Fetch data for all modules
  useEffect(() => {
    if (user?.role === 'incharge') {
      Object.keys(MODULE_TYPES).forEach(moduleType => {
        fetchModuleData(moduleType);
      });
    }
  }, [user, token]);

  const fetchModuleData = useCallback(async (moduleType) => {
    try {
      setLoading(prev => ({ ...prev, [moduleType]: true }));
      setErrors(prev => ({ ...prev, [moduleType]: null }));
      
      const response = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_URL}/${MODULE_TYPES[moduleType].apiEndpoint}?status=Pending`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Check if response exists and is ok
      if (!response) {
        throw new Error('No response received from server');
      }
      
      if (!response.ok) {
        // Handle unauthorized access
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          logout();
          return;
        }
        
        throw new Error(`Failed to fetch ${moduleType} data: ${response.status}`);
      }
      
      const result = await response.json();
      setModuleData(prev => ({ ...prev, [moduleType]: result }));
      
      // Auto-collapse modules with no data
      setExpandedModules(prev => ({
        ...prev,
        [moduleType]: result.length > 0
      }));
    } catch (error) {
      console.error(`Error fetching ${moduleType}:`, error);
      
      setErrors(prev => ({ 
        ...prev, 
        [moduleType]: `Failed to load ${MODULE_TYPES[moduleType].name} data: ${error.message}` 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [moduleType]: false }));
    }
  }, [token, logout]);

  const toggleModule = (moduleType) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleType]: !prev[moduleType]
    }));
  };

  const openConfirmDialog = (item, moduleType, action) => {
    setSelectedItem(item);
    setSelectedModule(moduleType);
    setActionType(action);
    setReason('');
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setSelectedItem(null);
    setSelectedModule('');
    setActionType('');
  };

  const handleStatusChange = async () => {
    try {
      if (actionType === 'reject' && !reason.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${MODULE_TYPES[selectedModule].apiEndpoint}/${selectedItem._id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            status: actionType === 'accept' ? 'Accepted' : 'Rejected',
            reason: actionType === 'reject' ? reason : undefined
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`Item ${actionType === 'accept' ? 'accepted' : 'rejected'} successfully`);
      fetchModuleData(selectedModule); // Refresh the data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      closeConfirmDialog();
    }
  };

    const shouldShowModule = (moduleType) => {
        const moduleName = MODULE_TYPES[moduleType]?.name?.toLowerCase();
        const term = searchTerm?.toLowerCase();

        if (!term) {
            return true; // Show all modules when no search term
        }
        
        // Only show modules whose name matches search term
        return moduleName && moduleName.includes(term);
    };


  useEffect(() => {
    if (searchTerm) {
      const newExpandedState = {};
      Object.keys(MODULE_TYPES).forEach(moduleType => {
        const moduleName = MODULE_TYPES[moduleType]?.name?.toLowerCase();
        const term = searchTerm?.toLowerCase();
        newExpandedState[moduleType] = moduleName && moduleName.includes(term);
      });
      setExpandedModules(newExpandedState);
    } else {
      const newExpandedState = {};
      Object.keys(MODULE_TYPES).forEach(moduleType => {
        newExpandedState[moduleType] = moduleData[moduleType].length > 0;
      });
      setExpandedModules(newExpandedState);
    }
  }, [searchTerm, moduleData]);

  // Add retry buttons for failed modules
  const renderErrorState = (moduleType) => (
    <div className="text-center p-8 bg-red-50 rounded-lg">
      <p className="text-red-600 font-medium mb-2">
        {errors[moduleType]}
      </p>
      <button
        onClick={() => fetchModuleData(moduleType)}
        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  if (user?.role === 'faculty') {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-brand-primary p-6">
        <div className="text-6xl mb-4 animate-bounce">🚫</div>
        <h1 className="lg:text-5xl text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-lg text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-brand-primary text-white rounded-lg shadow hover:bg-brand-secondary transition"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-brand-primary p-6">
        <div className="text-6xl mb-4 animate-bounce">🚫</div>
        <h1 className="lg:text-5xl text-2xl font-bold mb-2">404 - Page Not Found</h1>
        <p className="text-lg text-gray-600 mb-6">
          Sorry, we couldn’t find that page.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-brand-primary text-white rounded-lg shadow hover:bg-brand-secondary transition"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="bg-gradient-brand p-6 text-center mb-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white">Review & Approvals</h2>
        <p className="text-brand-cream text-sm">Review and approve submissions from your department</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-secondary" />
          <input
            type="text"
            placeholder="Search type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 bg-white"
          />
        </div>
      </div>

      {/* Modules */}
    {Object.keys(MODULE_TYPES).map(moduleType => {
    const IconComponent = MODULE_TYPES[moduleType].icon;
    const isLoading = loading[moduleType];
    const isExpanded = expandedModules[moduleType];
    const shouldShow = shouldShowModule(moduleType);
    const actualData = moduleData[moduleType];
    const actualCount = actualData.length;

    // Don't render the module at all if it shouldn't be shown during search
    if (!shouldShow) {
        return null;
    }

        return (
          <div key={moduleType} className="mb-6 bg-white rounded-lg border border-brand-cream overflow-hidden shadow">
            {/* Module Header */}
            <div 
              className="bg-gradient-subtle p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleModule(moduleType)}
            >
              <div className="flex items-center">
                <IconComponent className="h-6 w-6 text-brand-secondary mr-3" />
                <h3 className="text-lg font-medium text-brand-primary">
                    {MODULE_TYPES[moduleType].name} ({actualCount})
                </h3>
              </div>
              {isExpanded ? <ChevronUp className="h-5 w-5 text-brand-secondary" /> : <ChevronDown className="h-5 w-5 text-brand-secondary" />}
            </div>

            {/* Module Content */}
            {isExpanded && (
              <div className="p-4">
                {errors[moduleType] ? (
                  renderErrorState(moduleType)
                ) : isLoading ? (
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mx-auto mb-4 text-brand-secondary"></div>
                    <p>Loading {MODULE_TYPES[moduleType].name} data...</p>
                  </div>
                ) : actualCount > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-gray-50">
                          {MODULE_TYPES[moduleType].fields.map(field => (
                            <th key={field.key} className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                              {field.label}
                            </th>
                          ))}
                          <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                            Document
                          </th>
                          <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {actualData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 even:bg-gray-50">
                            {MODULE_TYPES[moduleType].fields.map(field => (
                              <td key={field.key} className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream">
                                {field.format ? field.format(item[field.key]) : item[field.key] || '-'}
                              </td>
                            ))}
                            <td className="py-3 px-4 text-sm text-center border-b border-brand-cream">
                              {item.path ? (
                                <a
                                  href={`${process.env.NEXT_PUBLIC_API_URL}/${MODULE_TYPES[moduleType].apiEndpoint}/file/${item.path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-brand-secondary hover:text-brand-accent font-medium"
                                  title="View Document"
                                >
                                  {/* <Download className="h-4 w-4 mr-1" /> */}
                                  View
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-center border-b border-brand-cream">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => openConfirmDialog(item, moduleType, 'accept')}
                                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors cursor-pointer"
                                  title="Accept"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openConfirmDialog(item, moduleType, 'reject')}
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
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <p className="text-brand-primary font-medium">
                      No pending {MODULE_TYPES[moduleType].name.toLowerCase()} found.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

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
                  placeholder="Please provide a reason for rejection"
                  className="w-full p-3 border border-brand-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors text-gray-900 placeholder-gray-500"
                  rows="3"
                  required
                />
              </div>
            )}
            <p className="text-gray-600 mb-6">
              Are you sure you want to {actionType} this {MODULE_TYPES[selectedModule]?.name.toLowerCase()} submission? 
              This action cannot be undone.
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