const express = require('express');
const {
  submitGrievance,
  getMyGrievances,
  getGrievanceById,
  listGrievances,
  assignGrievance,
  updateGrievanceStatus,
  updateGrievancePriority,
  updateGrievanceCategory,
  listCategories,
  listAuthorities
} = require('../controllers/grievanceController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Citizen grievance submission
router.post('/', authenticate, requireRole('CITIZEN'), submitGrievance);

// 2. Citizen grievance retrieval for own grievances
router.get('/my', authenticate, requireRole('CITIZEN'), getMyGrievances);

// 3. Category lookup for triage & assignment
router.get('/categories', authenticate, listCategories);

// Active authorities lookup for triage assignment
router.get('/authorities', authenticate, requireRole('AUTHORITY', 'ADMIN'), listAuthorities);

// 4. Authority/Admin listing of all / filtered grievances
router.get('/', authenticate, requireRole('AUTHORITY', 'ADMIN'), listGrievances);

// 5. Single grievance retrieval (Scoped inside controller by role)
router.get('/:id', authenticate, getGrievanceById);

// 6. Assignment to active authority
router.patch('/:id/assign', authenticate, requireRole('AUTHORITY', 'ADMIN'), assignGrievance);

// 7. Workflow status update
router.patch('/:id/status', authenticate, requireRole('AUTHORITY', 'ADMIN'), updateGrievanceStatus);

// 8. Official priority update
router.patch('/:id/priority', authenticate, requireRole('AUTHORITY', 'ADMIN'), updateGrievancePriority);

// 9. Official category assignment
router.patch('/:id/category', authenticate, requireRole('AUTHORITY', 'ADMIN'), updateGrievanceCategory);

module.exports = router;
