'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../lib/auth';
import Link from 'next/link';
import { getColumnConfig } from '../../../config/columnConfig';
import { FileText, Download } from 'lucide-react';

const renderCell = (value) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  
  // Check if the value is a date string in ISO format
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
    try {
      const date = new Date(value);
      return date.toLocaleDateString(); // Format as local date
      // Or for more control:
      // return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      return value; // Fallback to original if parsing fails
    }
  }
  
  return value.toString();
};

const hasUploadedFile = (item) => {
  return item.path && item.path.trim() !== '';
};

const getFileViewUrl = (item, reportType) => {
  if (!item.path) return null;
  
  const fileEndpoints = {
    'PATENTS': 'patents',
    'JOURNALS': 'journals', 
    'BOOKS': 'books',
    'JOURNAL-EDITED': 'journaledited',
    'QUALIFICATIONS': 'qualifications',
    'AWARDS': 'awards',
    'MEMBERSHIP': 'membership',
    'CONSULTANCY': 'consultancy',
    'INFRASTRUCTURE': 'infrastructure',
    'PHD': 'phd',
    'PHD-GUIDING': 'phdguiding',
    'VISITS': 'visits',
    'S/C/W/FDP/G': 's-c-w-fdp-g',
    'RESEARCH-GRANTS': 'researchgrant'
  };
  
  const endpoint = fileEndpoints[reportType];
  if (!endpoint) return null;

  return `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}/file/${item.path}`;
};

const getTableColumns = (data, type) => {
  if (type === 'SUMMARY') {
    return getColumnConfig(type).columns;
  }
  
  if (data.length === 0) return [];
  
  const config = getColumnConfig(type);
  if (config.columns.length > 0) {
    return config.columns;
  }
  
  const excludeFields = ['__v', '_id', 'createdAt', 'updatedAt', 'path'];
  return Object.keys(data[0]).filter(
    key => !excludeFields.includes(key)
  ).map(key => ({ key, label: key.toUpperCase().replace('_', ' ') }));
};

export default function ReportViewPage() {
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const type = searchParams.get('type');
  const year = searchParams.get('year');
  const branch = searchParams.get('branch');
  const tableColumns = getTableColumns(data, type);

  const [filters, setFilters] = useState({
    status: '',
    year: year || '',
    branch: branch || '',
    employee: '',
    fromDate: '',
    toDate: ''
  });

  const [yearOptions, setYearOptions] = useState([]);
  
  useEffect(() => {
      const fetchYears = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/academic-years`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const years = await response.json();
          setYearOptions(years.reverse());
        } catch (err) {
          console.error('Failed to load academic years:', err);
        }
      };
  
      if (token) {
        fetchYears();
      }
    }, [token]);

  const branchOptions = {
    'CSE': 'Computer Science Engineering',
    'IT': 'Information Technology',
    'ECE': 'Electronics and Communication Engineering',
    'EEE': 'Electrical and Electronics Engineering',
    'EIE': 'Electrical and Instrumentation Engineering',
    'ME': 'Mechanical Engineering',
    'CE': 'Civil Engineering'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const params = new URLSearchParams({ type, year, branch });
        console.log(`Fetching report data with params: ${params}`);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/data?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch report data');
        }
        
        const result = await response.json();
        console.log('Report data received:', result);
        setData(result);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (type && token) {
      fetchData();
    }
  }, [type, year, branch, token]);

  const downloadExcel = async () => {
    try {
      const params = new URLSearchParams({ type, year, branch, format: 'excel' });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/data?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${year || 'all'}_report.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      toast.error(`Download error: ${err.message}`);
    }
  };

  if (loading) return (
    <div className="text-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mx-auto mb-4"></div>
      <p>Loading report data...</p>
    </div>
  );

  if (error) return (
    <div className="text-center p-8 text-red-500">
      <p>Error: {error}</p>
    </div>
  );

  const displayData = type === 'SUMMARY' ? (data.data || []) : data;
  let filteredData = displayData.filter(item => {
    let match = true;

    if (filters.status) {
      match = match && (String(item.status) === filters.status);
    }
    if (filters.year) {
      match = match && (item.academic_year === filters.year);
    }
    if (filters.branch) {
      match = match && (item.department === filters.branch);
    }
    if (filters.employee) {
      const search = filters.employee.toLowerCase();
      match = match && (
        (item.employee && item.employee.toLowerCase().includes(search)) ||
        (item.empId && String(item.empId).toLowerCase().includes(search))
      );
    }
    if (filters.fromDate && item.date) {
      match = match && new Date(item.date) >= new Date(filters.fromDate);
    }
    if (filters.toDate && item.date) {
      match = match && new Date(item.date) <= new Date(filters.toDate);
    }

    return match;
  });

  const isSummary = type === 'SUMMARY';

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="bg-gradient-brand p-6 text-center mb-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white">
          {type} REPORT {year ? `(${year})` : ''} {branch ? `- ${branch}` : ''}
        </h2>
      </div>
      
      <div className="mb-6 flex justify-between items-center">
        <Link 
          href="/dashboard/reports" 
          className="px-6 py-3 bg-brand-highlight text-brand-primary font-medium rounded-lg hover:bg-brand-warm focus:outline-none focus:ring-2 focus:ring-brand-highlight focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
        >
          <FileText className="h-5 w-5 mr-2" />
          Back to Reports
        </Link>
        
        <button
          onClick={downloadExcel}
          className="px-6 py-3 bg-brand-secondary text-white font-medium rounded-lg hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
        >
          <Download className="h-5 w-5 mr-2" />
          Download Excel
        </button>
      </div>

      {isSummary && data.facultyCount !== undefined && (
        <div className="mb-4 p-4 bg-gradient-subtle rounded-lg border border-brand-cream">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-brand-primary font-medium">Department</p>
              <p className="text-lg font-bold">{data.department}</p>
            </div>
            <div>
              <p className="text-sm text-brand-primary font-medium">Year</p>
              <p className="text-lg font-bold">{data.year}</p>
            </div>
            <div>
              <p className="text-sm text-brand-primary font-medium">Faculty Count</p>
              <p className="text-lg font-bold">{data.facultyCount}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 p-4 bg-gradient-subtle rounded-lg border border-brand-cream">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Year Filter */}
          {year === '' && user?.role === 'admin' && (
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-1">Academic Year</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">All Years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          )}

          {/* Branch Filter (only for admin) */}
          {branch === '' && user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-brand-primary mb-1">Branch</label>
              <select
                value={filters.branch}
                onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">All Branches</option>
                {Object.entries(branchOptions).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          )}


          {/* Search by Employee */}
          {user?.role === 'admin' && (
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-1">Employee</label>
            <input
              type="text"
              placeholder="Search by name or ID"
              value={filters.employee}
              onChange={(e) => setFilters(prev => ({ ...prev, employee: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          )}
        </div>

        {/* Date Range */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-1">From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-1">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div> */}
        {/* After the filter section, add this: */}
        <div className="mt-2 text-sm text-gray-500">
          <p>Note: Filters are only applied to the view on this page and do not affect the Excel download.</p>
        </div>
        {/* Apply Filters Button */}
        <div className="flex justify-end mt-2">
          <button
            onClick={() => setFilters({
            status: '',
            year: '',
            branch: '',
            employee: '',
            fromDate: '',
            toDate: ''
          })}
            className="px-6 py-2 bg-brand-secondary text-white rounded-lg shadow-md hover:bg-brand-accent"
          >
            Remove All Filters
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-brand-primary">
          {filteredData.length} record{filteredData.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {tableColumns.length > 0 && filteredData.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-brand-primary">
          <table className="min-w-full bg-white border-separate">
            <thead>
              <tr className="bg-gradient-subtle">
                {tableColumns.map(column => (
                  <th key={column.key} className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">
                    {column.label}
                  </th>
                ))}
                {filteredData.some(item => hasUploadedFile(item)) && (
                  <th className="py-3 px-4 text-center text-sm font-medium text-brand-primary border-b border-brand-cream">VIEW</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 even:bg-gray-50">
                  {tableColumns.map(column => (
                    <td key={column.key} className="py-3 px-4 text-sm text-gray-700 border-b border-brand-cream text-center">
                      {/* {renderCell(item[column.key])} */}
                      {column.key === 'status' ? (
                        <>
                          <span
                            className={`px-2 py-1 rounded-full font-semibold text-white ${
                              renderCell(item[column.key]) === 'Pending'
                                ? 'bg-amber-400'
                                : renderCell(item[column.key]) === 'Accepted'
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`}
                          >
                            {renderCell(item[column.key])}
                          </span>
                          {renderCell(item[column.key]) === 'Rejected' && (
                            <span> ({item.reason ? item.reason : '-'})</span>
                          )}
                        </>
                      ) : (
                        renderCell(item[column.key])
                      )}
                    </td>
                  ))}
                  {filteredData.some(item => hasUploadedFile(item)) && (
                    <td className="py-3 px-4 text-sm text-center border-b border-brand-cream">
                      {hasUploadedFile(item) ? (
                        <a 
                          href={getFileViewUrl(item, type)} 
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
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredData.length === 0 && (
        <div className="text-center p-8 bg-gradient-subtle rounded-lg border border-brand-cream">
          <p className="text-brand-primary font-medium">No data found for the selected criteria.</p>
          <p className="text-sm mt-2 text-brand-secondary">Try selecting different filters or check if data exists for the selected {user?.role === 'admin' ? 'department, type' : 'type'} and year.</p>
        </div>
      )}
    </div>
  );
}
// // miniproject2\frontend\app\dashboard\reports\view\page.jsx
// 'use client';
// import { useEffect, useState } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { useAuth } from '../../../../lib/auth';
// import Link from 'next/link';
// import { getColumnConfig } from '../../../config/columnConfig';


// // Add these helper functions

// const renderCell = (value) => {
//   if (value === null || value === undefined) return '-';
//   if (typeof value === 'object') return JSON.stringify(value);
//   return value.toString();
// };

// // Check if a record has an uploaded file
// const hasUploadedFile = (item) => {
//   return item.path && item.path.trim() !== '';
// };

// // Get the correct file viewing URL based on report type
// const getFileViewUrl = (item, reportType) => {
//   if (!item.path) return null;
  
//   // Map report types to their file endpoints
//   const fileEndpoints = {
//     'PATENTS': 'patents',
//     'JOURNALS': 'journals', 
//     'BOOKS': 'books',
//     'JOURNAL-EDITED': 'journal-edited',
//     'QUALIFICATIONS': 'qualifications',
//     'AWARDS': 'awards',
//     'MEMBERSHIP': 'membership',
//     'CONSULTANCY': 'consultancy',
//     'INFRASTRUCTURE': 'infrastructure',
//     'PHD': 'phd',
//     'PHD-GUIDING': 'phdguiding',
//     'VISITS': 'visits',
//     'S/C/W/FDP/G': 'seminars',
//     'RESEARCH-GRANTS': 'researchgrants'
//   };
  
//   const endpoint = fileEndpoints[reportType];
//   if (!endpoint) return null;

//   return `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}/file/${item.path}`;
// };

// const getTableColumns = (data, type) => {
//   if (type === 'SUMMARY') {
//     return getColumnConfig(type).columns;
//   }
  
//   if (data.length === 0) return [];
  
//   const config = getColumnConfig(type);
//   if (config.columns.length > 0) {
//     return config.columns;
//   }
  
//   // Fallback: exclude internal fields and path from table display
//   const excludeFields = ['__v', '_id', 'createdAt', 'updatedAt', 'path'];
//   return Object.keys(data[0]).filter(
//     key => !excludeFields.includes(key)
//   ).map(key => ({ key, label: key.toUpperCase().replace('_', ' ') }));
// };

// export default function ReportViewPage() {
//   const searchParams = useSearchParams();
//   const { token } = useAuth();
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const type = searchParams.get('type');
//   const year = searchParams.get('year');
//   const branch = searchParams.get('branch');
//   const tableColumns = getTableColumns(data, type);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError('');
        
//         const params = new URLSearchParams({ type, year, branch });
//         console.log(`Fetching report data with params: ${params}`);

//         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/data?${params}`, {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });
        
//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.error || 'Failed to fetch report data');
//         }
        
//         const result = await response.json();
//         console.log('Report data received:', result);
//         setData(result);
//       } catch (err) {
//         console.error('Error fetching report data:', err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (type && token) {
//       fetchData();
//     }
//   }, [type, year, branch, token]);

//   const downloadExcel = async () => {
//     try {
//       const params = new URLSearchParams({ type, year, branch, format: 'excel' });
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/data?${params}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
      
//       if (!response.ok) {
//         throw new Error('Failed to download report');
//       }
      
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `${type}_${year || 'all'}_report.xlsx`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//     } catch (err) {
//       alert(`Download error: ${err.message}`);
//     }
//   };

//   if (loading) return <div className="text-center p-4">Loading report data...</div>;
//   if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

//   // Handle summary report data structure
//   const displayData = type === 'SUMMARY' ? (data.data || []) : data;
//   const isSummary = type === 'SUMMARY';

//   return (
//     <div className="p-4">
//       <div className="bg-pink-300 p-4 text-center mb-4">
//         <h2 className="text-xl font-bold text-teal-700">
//           {type} REPORT {year ? `(${year})` : ''} {branch ? `- ${branch}` : ''}
//         </h2>
//       </div>
      
//       <div className="mb-4 flex justify-between">
//         <Link 
//           href="/dashboard/reports" 
//           className="px-4 py-2 bg-gray-300 text-red-600 font-bold border border-teal-700 rounded hover:bg-gray-400"
//         >
//           Back to Reports
//         </Link>
        
//         <button
//           onClick={downloadExcel}
//           className="px-4 py-2 bg-green-500 text-white font-bold rounded hover:bg-green-600"
//         >
//           Download Excel
//         </button>
//       </div>

//       {/* Show summary info for summary reports */}
//       {isSummary && data.facultyCount !== undefined && (
//         <div className="mb-4 p-4 bg-gray-100 rounded">
//           <p><strong>Department:</strong> {data.department}</p>
//           <p><strong>Year:</strong> {data.year}</p>
//           <p><strong>Faculty Count:</strong> {data.facultyCount}</p>
//         </div>
//       )}

//       {/* Show data count */}
//       <div className="mb-4">
//         <p className="text-gray-600">
//           {displayData.length} record{displayData.length !== 1 ? 's' : ''} found
//         </p>
//       </div>

//       {tableColumns.length > 0 && displayData.length > 0 && (
//         <div className="overflow-x-auto">
//           <table className="min-w-full bg-white border border-gray-300">
//             <thead>
//               <tr className="bg-gray-100">
//                 {tableColumns.map(column => (
//                   <th key={column.key} className="py-2 px-4 border">
//                     {column.label}
//                   </th>
//                 ))}
//                 {/* Add View Document column if any record has uploaded files */}
//                 {displayData.some(item => hasUploadedFile(item)) && (
//                   <th className="py-2 px-4 border">VIEW</th>
//                 )}
//               </tr>
//             </thead>
//             <tbody>
//               {displayData.map((item, index) => (
//                 <tr key={index} className="hover:bg-gray-50">
//                   {tableColumns.map(column => (
//                     <td key={column.key} className="py-2 px-4 border">
//                       {renderCell(item[column.key])}
//                     </td>
//                   ))}
//                   {/* Show View Document button if this record has an uploaded file */}
//                   {displayData.some(item => hasUploadedFile(item)) && (
//                     <td className="py-2 px-4 border text-center">
//                       {hasUploadedFile(item) ? (
//                         <a 
//                           href={getFileViewUrl(item, type)} 
//                           target="_blank" 
//                           rel="noopener noreferrer"
//                           className="text-blue-600 hover:underline font-medium"
//                         >
//                           View
//                         </a>
//                       ) : (
//                         <span className="text-gray-400">-</span>
//                       )}
//                     </td>
//                   )}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {displayData.length === 0 && (
//         <div className="text-center p-8 text-gray-500">
//           <p>No data found for the selected criteria.</p>
//           <p className="text-sm mt-2">Try selecting different filters or check if data exists for the selected department and year.</p>
//         </div>
//       )}
//     </div>
//   );
// }