const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Award = require('../models/Award');
const Book = require('../models/Book');
const Consultancy = require('../models/Consultancy');
const Infrastructure = require('../models/Infrastructure');
const Journal = require('../models/Journal');
const JournalEdited = require('../models/JournalEdited');
const Membership = require('../models/Membership');
const Patent = require('../models/Patent');
const Phd = require('../models/Phd');
const PhdGuiding = require('../models/PhdGuiding');
const Qualification = require('../models/Qualification');
const ResearchGrant = require('../models/ResearchGrant');
const Seminar = require('../models/Seminar');
const Visit = require('../models/Visit');
const User = require('../models/User'); 

router.get('/', auth, async (req, res) => {
  try {
    // Only admin and incharge users can access this endpoint
    // if (req.user.role !== 'admin' && req.user.role !== 'incharge') {
    //   return res.status(403).json({ error: 'Access denied. Only admin and incharge users can view counts.' });
    // }

    const { branch, department, academic_year } = req.query;

    // Build base query for faculty
    const facultyQuery = { role: 'faculty' };

    // If user is incharge, restrict to their department
    if (req.user.role === 'incharge') {
      facultyQuery.department = req.user.department;
    } 
    // If user is admin and department is provided, use it
    else if (req.user.role === 'admin' && department) {
      facultyQuery.department = department;
    }
    // If user is faculty, restrict to their own data
    else if (req.user.role === 'faculty') {
      facultyQuery.department = req.user.department;
    }

    // If branch is provided, add it to the query
    if (branch) {
      facultyQuery.branch = branch;
    }

    // Get faculty empIds
    let facultyEmpIds;
    if (req.user.role != 'faculty') {
      const facultyUsers = await User.find(facultyQuery).select('empId');
      facultyEmpIds = facultyUsers.map(f => f.empId);
    }
    else{
      facultyEmpIds = [req.user.empId];
      console.log("Faculty empId:", facultyEmpIds);
    }
    console.log(facultyEmpIds);

    // Build base query for all collections
    const baseQuery = {
      empId: { $in: facultyEmpIds }
    };

    // Add academic year filter if provided
    if (academic_year) {
      baseQuery.academic_year = academic_year;
    }

  const seminarTypeCounts = await Promise.all([
    // Seminar
    Promise.all([
      Seminar.countDocuments({ ...baseQuery, type1: 'Seminar' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'Seminar', status: 'Accepted' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'Seminar', status: 'Pending' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'Seminar', status: 'Rejected' })
    ]),
    // Conference
    Promise.all([
      Seminar.countDocuments({ ...baseQuery, type1: 'Conference' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'Conference', status: 'Accepted' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'Conference', status: 'Pending' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'Conference', status: 'Rejected' })
    ]),
    // Workshop
    Promise.all([
      Seminar.countDocuments({ ...baseQuery, type1: 'Workshop' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'Workshop', status: 'Accepted' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'Workshop', status: 'Pending' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'Workshop', status: 'Rejected' })
    ]),
    // FDP
    Promise.all([
      Seminar.countDocuments({ ...baseQuery, type1: 'FDP' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'FDP', status: 'Accepted' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'FDP', status: 'Pending' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'FDP', status: 'Rejected' })
    ]),
    // GuestLecture
    Promise.all([
      Seminar.countDocuments({ ...baseQuery, type1: 'GuestLecture' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'GuestLecture', status: 'Accepted' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'GuestLecture', status: 'Pending' }),
      Seminar.countDocuments({ ...baseQuery, type1: 'GuestLecture', status: 'Rejected' })
    ])
  ]);
    // Count documents across all collections with status breakdown
    const [
      awards, books, consultancies, infrastructures, 
      journals, journalsEdited, memberships, patents, 
      phds, phdsGuiding, qualifications, researchGrants, 
      seminars, visits
    ] = await Promise.all([
      // Awards with status breakdown
      Promise.all([
        Award.countDocuments(baseQuery),
        Award.countDocuments({ ...baseQuery, status: 'Accepted' }),
        Award.countDocuments({ ...baseQuery, status: 'Pending' }),
        Award.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // Books (assuming no status field)
      Promise.all([
        Book.countDocuments(baseQuery),
        Book.countDocuments({ ...baseQuery, status: 'Accepted' }),
        Book.countDocuments({ ...baseQuery, status: 'Pending' }),
        Book.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),

      // Consultancy with status breakdown
      Promise.all([
        Consultancy.countDocuments(baseQuery),
        Consultancy.countDocuments({ ...baseQuery, status: 'Accepted' }),
        Consultancy.countDocuments({ ...baseQuery, status: 'Pending' }),
        Consultancy.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // Infrastructure with status breakdown
      Promise.all([
        Infrastructure.countDocuments(baseQuery),
        Infrastructure.countDocuments({ ...baseQuery, status: 'Accepted' }),
        Infrastructure.countDocuments({ ...baseQuery, status: 'Pending' }),
        Infrastructure.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // Journal with status breakdown
      Promise.all([
        Journal.countDocuments(baseQuery),
        Journal.countDocuments({ ...baseQuery, status: 'Accepted' }),
        Journal.countDocuments({ ...baseQuery, status: 'Pending' }),
        Journal.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // JournalEdited with status breakdown
      Promise.all([
        JournalEdited.countDocuments(baseQuery),
        JournalEdited.countDocuments({ ...baseQuery, status: 'Accepted' }),
        JournalEdited.countDocuments({ ...baseQuery, status: 'Pending' }),
        JournalEdited.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // Membership with status breakdown
      Promise.all([
        Membership.countDocuments(baseQuery),
        Membership.countDocuments({ ...baseQuery, status: 'Accepted' }),
        Membership.countDocuments({ ...baseQuery, status: 'Pending' }),
        Membership.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // Patent with status breakdown
      Promise.all([
        Patent.countDocuments(baseQuery),
        Patent.countDocuments({ ...baseQuery, status: 'Accepted' }),
        Patent.countDocuments({ ...baseQuery, status: 'Pending' }),
        Patent.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // Phd with status breakdown
      Promise.all([
        Phd.countDocuments(baseQuery),
        Phd.countDocuments({ ...baseQuery, status: 'Accepted' }),
        Phd.countDocuments({ ...baseQuery, status: 'Pending' }),
        Phd.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // PhdGuiding with status breakdown
      Promise.all([
        PhdGuiding.countDocuments(baseQuery),
        PhdGuiding.countDocuments({ ...baseQuery, status: 'Accepted' }),
        PhdGuiding.countDocuments({ ...baseQuery, status: 'Pending' }),
        PhdGuiding.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // Qualification with status breakdown
      Promise.all([
        Qualification.countDocuments(baseQuery),
        Qualification.countDocuments({ ...baseQuery, status: 'Accepted' }),
        Qualification.countDocuments({ ...baseQuery, status: 'Pending' }),
        Qualification.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // ResearchGrant with status breakdown
      Promise.all([
        ResearchGrant.countDocuments(baseQuery),
        ResearchGrant.countDocuments({ ...baseQuery, status: 'Accepted' }),
        ResearchGrant.countDocuments({ ...baseQuery, status: 'Pending' }),
        ResearchGrant.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // Seminar with status breakdown
      Promise.all([
        Seminar.countDocuments(baseQuery),
        Seminar.countDocuments({ ...baseQuery, status: 'Accepted' }),
        Seminar.countDocuments({ ...baseQuery, status: 'Pending' }),
        Seminar.countDocuments({ ...baseQuery, status: 'Rejected' })
      ]),
      
      // Visit with status breakdown
      Promise.all([
        Visit.countDocuments(baseQuery),
        Visit.countDocuments({ ...baseQuery, status: 'Accepted' }),
        Visit.countDocuments({ ...baseQuery, status: 'Pending' }),
        Visit.countDocuments({ ...baseQuery, status: 'Rejected' })
      ])
    ]);

    res.json({
      awards: {
        total: awards[0],
        accepted: awards[1],
        pending: awards[2],
        rejected: awards[3]
      },
      books: {
        total: books[0],
        accepted: books[1],
        pending: books[2],
        rejected: books[3]
      },
      consultancies: {
        total: consultancies[0],
        accepted: consultancies[1],
        pending: consultancies[2],
        rejected: consultancies[3]
      },
      infrastructures: {
        total: infrastructures[0],
        accepted: infrastructures[1],
        pending: infrastructures[2],
        rejected: infrastructures[3]
      },
      journals: {
        total: journals[0],
        accepted: journals[1],
        pending: journals[2],
        rejected: journals[3]
      },
      journalsEdited: {
        total: journalsEdited[0],
        accepted: journalsEdited[1],
        pending: journalsEdited[2],
        rejected: journalsEdited[3]
      },
      memberships: {
        total: memberships[0],
        accepted: memberships[1],
        pending: memberships[2],
        rejected: memberships[3]
      },
      patents: {
        total: patents[0],
        accepted: patents[1],
        pending: patents[2],
        rejected: patents[3]
      },
      phds: {
        total: phds[0],
        accepted: phds[1],
        pending: phds[2],
        rejected: phds[3]
      },
      phdsGuiding: {
        total: phdsGuiding[0],
        accepted: phdsGuiding[1],
        pending: phdsGuiding[2],
        rejected: phdsGuiding[3]
      },
      qualifications: {
        total: qualifications[0],
        accepted: qualifications[1],
        pending: qualifications[2],
        rejected: qualifications[3]
      },
      researchGrants: {
        total: researchGrants[0],
        accepted: researchGrants[1],
        pending: researchGrants[2],
        rejected: researchGrants[3]
      },
      seminars: {
        total: seminars[0],
        accepted: seminars[1],
        pending: seminars[2],
        rejected: seminars[3]
      },
      seminarTypes: {
        seminar: {
          total: seminarTypeCounts[0][0],
          accepted: seminarTypeCounts[0][1],
          pending: seminarTypeCounts[0][2],
          rejected: seminarTypeCounts[0][3]
        },
        conference: {
          total: seminarTypeCounts[1][0],
          accepted: seminarTypeCounts[1][1],
          pending: seminarTypeCounts[1][2],
          rejected: seminarTypeCounts[1][3]
        },
        workshop: {
          total: seminarTypeCounts[2][0],
          accepted: seminarTypeCounts[2][1],
          pending: seminarTypeCounts[2][2],
          rejected: seminarTypeCounts[2][3]
        },
        fdp: {
          total: seminarTypeCounts[3][0],
          accepted: seminarTypeCounts[3][1],
          pending: seminarTypeCounts[3][2],
          rejected: seminarTypeCounts[3][3]
        },
        guestLecture: {
          total: seminarTypeCounts[4][0],
          accepted: seminarTypeCounts[4][1],
          pending: seminarTypeCounts[4][2],
          rejected: seminarTypeCounts[4][3]
        }
      },
      visits: {
        total: visits[0],
        accepted: visits[1],
        pending: visits[2],
        rejected: visits[3]
      }
    });
    
  } catch (error) {
    console.error('Error fetching counts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;