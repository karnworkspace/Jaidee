/**
 * Reports Routes
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth');
const { insertReport, getReportsByCustomerId } = require('../database');
const { generatePDF } = require('../pdfGenerator');

// Save report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const reportData = req.body;
    if (!reportData.customerId || !reportData.customerName) {
      return res.status(400).json({ message: 'Missing required fields: customerId and customerName' });
    }
    const reportId = await insertReport(reportData);
    res.status(201).json({ message: 'Report saved successfully', reportId });
  } catch (error) {
    res.status(500).json({ message: 'Error saving report', error: error.message });
  }
});

// Get reports by customer ID
router.get('/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const reports = await getReportsByCustomerId(customerId);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
});

// Generate PDF
router.post('/generate-pdf', authenticateToken, async (req, res) => {
  try {
    const reportData = req.body;
    if (!reportData) {
      return res.status(400).json({ message: 'Missing report data' });
    }

    console.log('Generating PDF for customer:', reportData.name);
    const pdfBuffer = await generatePDF(reportData);

    const fileName = `รายงาน_Consumer_Advise_${reportData.name || 'Report'}_${new Date().toLocaleDateString('th-TH')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

module.exports = router;
