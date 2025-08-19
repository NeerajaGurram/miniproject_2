// Column configuration for reports (Frontend)
// This should match the backend configuration in backend/src/config/columnConfig.js

export const columnConfig = {
  'PATENTS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Patent Title' },
      { key: 'fnum', label: 'File Number' },
      { key: 'date1', label: 'Date' },
      { key: 'status1', label: 'Status' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'JOURNALS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Journal Title' },
      { key: 'name', label: 'Journal Name' },
      { key: 'issuedate', label: 'Issue Date' },
      { key: 'jnumber', label: 'Journal Number' },
      { key: 'pnumber', label: 'Page Number' },
      { key: 'pos', label: 'Position' },
      { key: 'issn', label: 'ISSN' },
      { key: 'impact', label: 'Impact Factor' },
      { key: 'type1', label: 'Type' },
      { key: 'scopus', label: 'Scopus Indexed' },
      { key: 'pdate', label: 'Publication Date' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'BOOKS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'book', label: 'Book Title' },
      { key: 'type1', label: 'Type' },
      { key: 'publisher', label: 'Publisher' },
      { key: 'pub1', label: 'ISBN' },
      { key: 'sdate', label: 'Publication Date' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'JOURNAL-EDITED': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'journal', label: 'Journal Title' },
      { key: 'paper', label: 'Paper Title' },
      { key: 'type1', label: 'Type of Work' },
      { key: 'publisher', label: 'Publisher' },
      { key: 'sdate', label: 'Date' },
      { key: 'pub1', label: 'Journal Details' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'QUALIFICATIONS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'impro', label: 'Improved Qualification' },
      { key: 'special', label: 'Improved Specification' },
      { key: 'type1', label: 'Institute Type' },
      { key: 'name', label: 'Institution' },
      { key: 'date1', label: 'Date' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'AWARDS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'award', label: 'Award Title' },
      { key: 'type1', label: 'Award Type' },
      { key: 'type2', label: 'Agency Type' },
      { key: 'agency', label: 'Agency Name' },
      { key: 'ifany', label: 'Event Details' },
      { key: 'date2', label: 'Award Date' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'MEMBERSHIP': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'member', label: 'Membership Title' },
      { key: 'body', label: 'Body Name' },
      { key: 'date2', label: 'Appointment Date' },
      { key: 'term', label: 'Term' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'CONSULTANCY': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'work', label: 'Nature of Work' },
      { key: 'agency', label: 'Agency Name' },
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'INFRASTRUCTURE': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Equipment Name' },
      { key: 'title1', label: 'Nature of Equipment' },
      { key: 'comment', label: 'Description' },
      { key: 'title2', label: 'Amount' },
      { key: 'date2', label: 'Purchase Date' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'PHD': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'university', label: 'University' },
      { key: 'special', label: 'Specialization' },
      { key: 'guide', label: 'Guide Name' },
      { key: 'college', label: 'Guide College' },
      { key: 'dept', label: 'Guide Department' },
      { key: 'statuss', label: 'Type' },
      { key: 'sdate', label: 'Date' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'PHD-GUIDING': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'university', label: 'University' },
      { key: 'special', label: 'Specialization' },
      { key: 'name', label: 'Scholar Name' },
      { key: 'sdate', label: 'Date' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'VISITS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'type1', label: 'Type' },
      { key: 'place', label: 'Place' },
      { key: 'purpose', label: 'Purpose' },
      { key: 'agency', label: 'Funding Agency' },
      { key: 'amount', label: 'Amount%' },
      { key: 'date1', label: 'Starting Date' },
      { key: 'date2', label: 'Ending Date' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'S/C/W/FDP/G': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Event Title' },
      { key: 'type1', label: 'Event Type' },
      { key: 'type2', label: 'Participation Type' },
      { key: 'type3', label: 'Scope' },
      { key: 'host', label: 'Host' },
      { key: 'agency', label: 'Agency' },
      { key: 'date1', label: 'Start Date' },
      { key: 'date2', label: 'End Date' },
      { key: 'comment', label: 'Comments' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'RESEARCH-GRANTS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Project Title' },
      { key: 'duration', label: 'Duration' },
      { key: 'agency', label: 'Agency' },
      { key: 'letter', label: 'Letter Number' },
      { key: 'amount', label: 'Amount' },
      { key: 'date1', label: 'Date' },
      { key: 'type1', label: 'Project Status' },
      { key: 'type2', label: 'Project Type' },
      { key: 'comment', label: 'Research Details' },
      { key: 'status', label: 'Approval Status' }
    ]
  },
  'SUMMARY': {
    columns: [
      { key: 'type', label: 'Report Type' },
      { key: 'count', label: 'Count' }
    ]
  }
};

export const getColumnConfig = (type) => {
  return columnConfig[type] || { columns: [] };
};
