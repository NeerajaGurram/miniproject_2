// Column configuration for reports
// You can easily customize the columns, their order, and display names for each report type

const columnConfig = {
  'PATENTS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Patent Title' },
      { key: 'fnum', label: 'File Number' },
      { key: 'date1', label: 'Date' },
      { key: 'status1', label: 'Status' }
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
      { key: 'pdate', label: 'Publication Date' }
    ]
  },
  'BOOKS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Book Title' },
      { key: 'publisher', label: 'Publisher' },
      { key: 'isbn', label: 'ISBN' },
      { key: 'date', label: 'Publication Date' },
      { key: 'type', label: 'Type' }
    ]
  },
  'JOURNAL-EDITED': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Journal Title' },
      { key: 'publisher', label: 'Publisher' },
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' }
    ]
  },
  'QUALIFICATIONS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'degree', label: 'Degree' },
      { key: 'institution', label: 'Institution' },
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' }
    ]
  },
  'AWARDS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Award Title' },
      { key: 'organization', label: 'Organization' },
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' }
    ]
  },
  'MEMBERSHIP': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'organization', label: 'Organization' },
      { key: 'position', label: 'Position' },
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' }
    ]
  },
  'CONSULTANCY': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Project Title' },
      { key: 'organization', label: 'Organization' },
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' }
    ]
  },
  'INFRASTRUCTURE': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Infrastructure Title' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' }
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
      { key: 'dept', label: 'Department' },
      { key: 'statuss', label: 'Type' },
      { key: 'sdate', label: 'Date' }
    ]
  },
  'PHD-GUIDING': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'student', label: 'Student Name' },
      { key: 'title', label: 'Thesis Title' },
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' }
    ]
  },
  'VISITS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Visit Title' },
      { key: 'organization', label: 'Organization' },
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' }
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
      { key: 'comment', label: 'Comments' }
    ]
  },
  'RESEARCH-GRANTS': {
    columns: [
      { key: 'empId', label: 'Employee ID' },
      { key: 'employee', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'title', label: 'Project Title' },
      { key: 'agency', label: 'Funding Agency' },
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' }
    ]
  },
  'SUMMARY': {
    columns: [
      { key: 'type', label: 'Report Type' },
      { key: 'count', label: 'Count' }
    ]
  }
};

module.exports = columnConfig;
