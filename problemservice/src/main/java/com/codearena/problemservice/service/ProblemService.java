package com.codearena.problemservice.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.codearena.problemservice.controller.ProblemUpdateRequest;
import com.codearena.problemservice.model.TestCase;
import com.codearena.problemservice.problem.Difficulty;
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

        // 1. Check for duplicate title
        if (problemRepository.existsByTitle(problem.getTitle())) {
            throw new RuntimeException("Problem title already exists!");
        }

        // 2. Save problem
        Problem savedProblem = problemRepository.save(problem);

        // 3. Save test cases
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

        // Delete test cases
        testCaseRepository.deleteAll(problem.getTestCases());

        // Delete problem
        problemRepository.deleteById(id);
    }

    // -----------------------
    // SEARCH + FILTER + PAGINATION
    // -----------------------
    public Page<Problem> searchProblems(
            Difficulty difficulty,
            String search,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return problemRepository.searchProblems(difficulty, search, pageable);
    }

@Transactional
public Problem updateProblem(Long id, ProblemUpdateRequest request) {

    // 1. Load problem with test cases
    Problem problem = getProblemById(id);
    List<TestCase> existingTestCases = problem.getTestCases();

    // 2. Update problem fields
    problem.setTitle(request.getTitle());
    problem.setDifficulty(request.getDifficulty());
    problem.setDescription(request.getDescription());
    problem.setExampleInput(request.getExampleInput());
    problem.setExampleOutput(request.getExampleOutput());

    // 3. Convert to easier format
    List<Long> incomingIds = request.getTestCases().stream()
            .map(tc -> tc.getId())
            .filter(idVal -> idVal != null)
            .toList();

    // 4. Delete removed test cases
    for (TestCase oldTc : existingTestCases) {
        if (!incomingIds.contains(oldTc.getId())) {
            testCaseRepository.delete(oldTc);
        }
    }

    // 5. Update or Create test cases
    for (ProblemUpdateRequest.TestCaseRequest tcReq : request.getTestCases()) {

        if (tcReq.getId() == null) {
            // --- New test case ---
            TestCase newTC = new TestCase();
            newTC.setInput(tcReq.getInput());
            newTC.setExpectedOutput(tcReq.getExpectedOutput());
            newTC.setProblem(problem);
            testCaseRepository.save(newTC);
        } else {
            // --- Update existing ---
            TestCase existing = testCaseRepository.findById(tcReq.getId())
                    .orElseThrow(() -> new RuntimeException("Test case not found"));

            existing.setInput(tcReq.getInput());
            existing.setExpectedOutput(tcReq.getExpectedOutput());
        }
    }

    return problemRepository.save(problem);
}



}
