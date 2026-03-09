/**
 * Loan Problems API Routes
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth');
const {
  getProblemCategories, getProblemDetails, getSolution,
  getAllOtherProblems, getOtherProblemSolution, getAllProblemsFlat
} = require('../problemsData');

router.get('/categories', authenticateToken, (req, res) => {
  try {
    res.json(getProblemCategories());
  } catch (error) {
    res.status(500).json({ message: 'Error getting problem categories' });
  }
});

router.get('/details/:category', authenticateToken, (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    res.json(getProblemDetails(category));
  } catch (error) {
    res.status(500).json({ message: 'Error getting problem details' });
  }
});

router.get('/solution/:category/:detail', authenticateToken, (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const detail = decodeURIComponent(req.params.detail);
    res.json({ solution: getSolution(category, detail) });
  } catch (error) {
    res.status(500).json({ message: 'Error getting solution' });
  }
});

router.get('/other', authenticateToken, (req, res) => {
  try {
    res.json(getAllOtherProblems());
  } catch (error) {
    res.status(500).json({ message: 'Error getting other problems' });
  }
});

router.get('/other-solution/:problem', authenticateToken, (req, res) => {
  try {
    const problem = decodeURIComponent(req.params.problem);
    res.json({ solution: getOtherProblemSolution(problem) });
  } catch (error) {
    res.status(500).json({ message: 'Error getting other problem solution' });
  }
});

router.get('/all', authenticateToken, (req, res) => {
  try {
    res.json(getAllProblemsFlat());
  } catch (error) {
    res.status(500).json({ message: 'Error getting all problems' });
  }
});

module.exports = router;
