import express from 'express';
import { getTickets, getMyTickets, updateTicketStatus, createTicket, upload } from '../../controllers/helpDeskController.js';
import { verifyAdmin } from '../../middleware/adminAuth.js';

const router = express.Router();

// Public route for users to create tickets
router.post('/tickets', upload, createTicket);

// Public route for logged-in user to fetch their own tickets (status check)
router.get('/my-tickets', getMyTickets);

// Admin routes
router.get('/tickets', verifyAdmin, getTickets);
router.patch('/tickets/:id/status', verifyAdmin, updateTicketStatus);

export default router;
