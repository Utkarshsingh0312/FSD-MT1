const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// In-memory data store with initial records
let registrations = [
  { id: 501, participantName: "Riya Sharma", eventName: "Tech Fest", department: "CSE", ticketCount: 2, paymentStatus: "Paid" },
  { id: 502, participantName: "Arjun Mehta", eventName: "Code Sprint", department: "IT", ticketCount: 1, paymentStatus: "Pending" },
  { id: 503, participantName: "Neha Verma", eventName: "Tech Fest", department: "ECE", ticketCount: 3, paymentStatus: "Paid" }
];

// Helper: Validation function for POST and PUT requests
function validateRegistration(body) {
  const { participantName, eventName, department, ticketCount, paymentStatus } = body;

  if (!participantName || typeof participantName !== 'string' || participantName.trim() === '') {
    return { valid: false, message: "participantName is required and must be a non-empty string." };
  }

  if (!eventName || typeof eventName !== 'string' || eventName.trim() === '') {
    return { valid: false, message: "eventName is required and must be a non-empty string." };
  }

  if (!department || typeof department !== 'string' || department.trim() === '') {
    return { valid: false, message: "department is required and must be a non-empty string." };
  }

  if (ticketCount === undefined || typeof ticketCount !== 'number' || !Number.isInteger(ticketCount) || ticketCount <= 0) {
    return { valid: false, message: "ticketCount must be a positive integer." };
  }

  if (!paymentStatus || (paymentStatus !== 'Paid' && paymentStatus !== 'Pending')) {
    return { valid: false, message: "paymentStatus must be either 'Paid' or 'Pending'." };
  }

  return { valid: true };
}

// -------------------------------------------------------------
// Routes
// NOTE: Specific routes (/filter, /pending) MUST be declared before
// the dynamic parameter route (/:id) so they are not captured as IDs.
// -------------------------------------------------------------

// 6. Filter records by department (case-insensitive)
// GET /api/registrations/filter?department=value
app.get('/api/registrations/filter', (req, res) => {
  const { department } = req.query;

  if (!department) {
    return res.status(200).json(registrations);
  }

  const filtered = registrations.filter(
    (reg) => reg.department.toLowerCase() === department.trim().toLowerCase()
  );

  return res.status(200).json(filtered);
});

// 7. GET pending registrations
// GET /api/registrations/pending
app.get('/api/registrations/pending', (req, res) => {
  const pendingRegistrations = registrations.filter(
    (reg) => reg.paymentStatus === 'Pending'
  );

  return res.status(200).json(pendingRegistrations);
});

// 1. GET all records
// GET /api/registrations
app.get('/api/registrations', (req, res) => {
  return res.status(200).json(registrations);
});

// 2. POST a new record
// POST /api/registrations
app.post('/api/registrations', (req, res) => {
  const validation = validateRegistration(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const { participantName, eventName, department, ticketCount, paymentStatus } = req.body;

  // Generate unique numeric id
  const nextId = registrations.length > 0 
    ? Math.max(...registrations.map(r => r.id)) + 1 
    : 501;

  const newRegistration = {
    id: nextId,
    participantName: participantName.trim(),
    eventName: eventName.trim(),
    department: department.trim(),
    ticketCount,
    paymentStatus
  };

  registrations.push(newRegistration);
  return res.status(201).json(newRegistration);
});

// 3. GET registration by ID
// GET /api/registrations/:id
app.get('/api/registrations/:id', (req, res) => {
  const registrationId = parseInt(req.params.id, 10);

  if (isNaN(registrationId)) {
    return res.status(400).json({ error: "Invalid registration ID format. ID must be a number." });
  }

  const record = registrations.find((r) => r.id === registrationId);

  if (!record) {
    return res.status(404).json({ error: `Registration with ID ${registrationId} not found.` });
  }

  return res.status(200).json(record);
});

// 4. PUT / update a record
// PUT /api/registrations/:id
app.put('/api/registrations/:id', (req, res) => {
  const registrationId = parseInt(req.params.id, 10);

  if (isNaN(registrationId)) {
    return res.status(400).json({ error: "Invalid registration ID format. ID must be a number." });
  }

  const index = registrations.findIndex((r) => r.id === registrationId);

  if (index === -1) {
    return res.status(404).json({ error: `Registration with ID ${registrationId} not found.` });
  }

  const validation = validateRegistration(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const { participantName, eventName, department, ticketCount, paymentStatus } = req.body;

  registrations[index] = {
    id: registrationId,
    participantName: participantName.trim(),
    eventName: eventName.trim(),
    department: department.trim(),
    ticketCount,
    paymentStatus
  };

  return res.status(200).json(registrations[index]);
});

// 5. DELETE a record
// DELETE /api/registrations/:id
app.delete('/api/registrations/:id', (req, res) => {
  const registrationId = parseInt(req.params.id, 10);

  if (isNaN(registrationId)) {
    return res.status(400).json({ error: "Invalid registration ID format. ID must be a number." });
  }

  const index = registrations.findIndex((r) => r.id === registrationId);

  if (index === -1) {
    return res.status(404).json({ error: `Registration with ID ${registrationId} not found.` });
  }

  const deletedRecord = registrations.splice(index, 1)[0];

  return res.status(200).json({
    message: `Registration with ID ${registrationId} deleted successfully.`,
    deletedRecord
  });
});

// Start the server (only if executed directly, allows exporting for tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Base URL: http://localhost:${PORT}/api/registrations`);
  });
}

module.exports = app;
