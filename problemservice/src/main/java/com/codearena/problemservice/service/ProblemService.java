package com.codearena.problemservice.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.codearena.problemservice.model.TestCase;
import com.codearena.problemservice.problem.Problem;
import com.codearena.problemservice.repository.ProblemRepository;
import com.codearena.problemservice.repository.TestCaseRepository;

@Service
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;

    public ProblemService(ProblemRepository problemRepository, TestCaseRepository testCaseRepository) {
        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
    }

    // -----------------------
    // CREATE PROBLEM
    // -----------------------
    @Transactional
    public Problem createProblem(Problem problem, List<TestCase> testCases) {

        // 1. Check if title exists
        if (problemRepository.existsByTitle(problem.getTitle())) {
            throw new RuntimeException("Problem title already exists!");
        }

        // 2. Save problem first
        Problem savedProblem = problemRepository.save(problem);

        // 3. Attach test cases
        for (TestCase testCase : testCases) {
            testCase.setProblem(savedProblem);
            testCaseRepository.save(testCase);
        }

        return savedProblem;
    }

    // -----------------------
    // GET ALL PROBLEMS
    // -----------------------
    public List<Problem> getAllProblems() {
        return problemRepository.findAll();
    }

    // -----------------------
    // GET ONE PROBLEM
    // -----------------------
    public Problem getProblemById(Long id) {
        return problemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Problem not found"));
    }

    // -----------------------
    // DELETE PROBLEM
    // -----------------------
    @Transactional
    public void deleteProblem(Long id) {

        Problem problem = getProblemById(id);

        // Delete associated test cases
        testCaseRepository.deleteAll(problem.getTestCases());

        // Delete problem
        problemRepository.deleteById(id);
    }
}
