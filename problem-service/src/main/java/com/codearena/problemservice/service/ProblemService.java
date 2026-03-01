package com.codearena.problemservice.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.codearena.problemservice.controller.ProblemUpdateRequest;
import com.codearena.problemservice.exception.DuplicateTitleException;
import com.codearena.problemservice.exception.ProblemNotFoundException;
import com.codearena.problemservice.model.TestCase;
import com.codearena.problemservice.problem.Problem;
import com.codearena.problemservice.repository.ProblemRepository;
import com.codearena.problemservice.repository.TestCaseRepository;

@Service
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final SearchService searchService;

    public ProblemService(ProblemRepository problemRepository,
                          TestCaseRepository testCaseRepository,
                          SearchService searchService) {
        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
        this.searchService = searchService;
    }

    // -----------------------
    // CREATE PROBLEM
    // -----------------------
    @Transactional
    public Problem createProblem(Problem problem, List<TestCase> testCases) {

        // 1. Check for duplicate title
        if (problemRepository.existsByTitle(problem.getTitle())) {
            throw new DuplicateTitleException("Problem title already exists!");
        }

        // 2. Save problem
        Problem savedProblem = problemRepository.save(problem);

        // 3. Save test cases
        for (TestCase testCase : testCases) {
            testCase.setProblem(savedProblem);
            testCaseRepository.save(testCase);
        }

        // 4. Index in search
        searchService.indexProblem(savedProblem);

        return savedProblem;
    }

    // -----------------------
    // GET ALL PROBLEMS (PAGINATED)
    // -----------------------
    public org.springframework.data.domain.Page<Problem> getAllProblems(org.springframework.data.domain.Pageable pageable) {
        return problemRepository.findAll(pageable);
    }

    // -----------------------
    // GET ONE PROBLEM
    // -----------------------
    public Problem getProblemById(Long id) {
        return problemRepository.findById(id)
                .orElseThrow(() -> new ProblemNotFoundException("Problem not found"));
    }

    // -----------------------
    // DELETE PROBLEM
    // -----------------------
    @Transactional
    public void deleteProblem(Long id) {
        Problem problem = getProblemById(id);

        // Delete test cases explicitly (or rely on cascade)
        testCaseRepository.deleteAll(problem.getTestCases());

        // Delete problem
        problemRepository.deleteById(id);

        // 3. Delete from search
        searchService.deleteProblem(id);
    }

    // -----------------------
    // UPDATE PROBLEM + TEST CASES
    // -----------------------
    @Transactional
    public Problem updateProblem(Long id, ProblemUpdateRequest request) {

        // 1. Load problem with its test cases
        Problem problem = getProblemById(id);
        List<TestCase> existingTestCases = problem.getTestCases();

        // 2. Update problem fields if provided
        if (request.getTitle() != null) {
            problem.setTitle(request.getTitle());
        }
        if (request.getDifficulty() != null) {
            problem.setDifficulty(request.getDifficulty());
        }
        if (request.getDescription() != null) {
            problem.setDescription(request.getDescription());
        }
        if (request.getExampleInput() != null) {
            problem.setExampleInput(request.getExampleInput());
        }
        if (request.getExampleOutput() != null) {
            problem.setExampleOutput(request.getExampleOutput());
        }

        // 3. If no test cases provided, we only update fields
        if (request.getTestCases() == null) {
            return problemRepository.save(problem);
        }

        // 4. Convert incoming test case IDs
        List<Long> incomingIds = request.getTestCases().stream()
                .map(ProblemUpdateRequest.TestCaseRequest::getId)
                .filter(idVal -> idVal != null)
                .toList();

        // 5. Delete removed test cases
        for (TestCase oldTc : existingTestCases) {
            if (oldTc.getId() != null && !incomingIds.contains(oldTc.getId())) {
                testCaseRepository.delete(oldTc);
            }
        }

        // 6. Update or create test cases
        for (ProblemUpdateRequest.TestCaseRequest tcReq : request.getTestCases()) {

            if (tcReq.getId() == null) {
                // New test case
                TestCase newTC = new TestCase();
                newTC.setInput(tcReq.getInput());
                newTC.setExpectedOutput(tcReq.getExpectedOutput());
                newTC.setProblem(problem);
                testCaseRepository.save(newTC);
            } else {
                // Update existing
                TestCase existing = testCaseRepository.findById(tcReq.getId())
                        .orElseThrow(() -> new RuntimeException("Test case not found"));

                existing.setInput(tcReq.getInput());
                existing.setExpectedOutput(tcReq.getExpectedOutput());
                testCaseRepository.save(existing);
            }
        }

        Problem updated = problemRepository.save(problem);
        
        // 7. Update search index
        searchService.indexProblem(updated);

        return updated;
    }

    // -----------------------------------
    // ADD TEST CASE
    // -----------------------------------
    @Transactional
    public TestCase addTestCase(Long problemId, TestCase dto) {
        Problem problem = getProblemById(problemId);
        dto.setProblem(problem);
        return testCaseRepository.save(dto);
    }

    // -----------------------------------
    // GET TEST CASES
    // -----------------------------------
    public List<TestCase> getTestCases(Long problemId) {
        Problem problem = getProblemById(problemId);
        return problem.getTestCases();
    }

    // -----------------------------------
    // DELETE TEST CASE
    // -----------------------------------
    @Transactional
    public void deleteTestCase(Long testCaseId) {
        testCaseRepository.deleteById(testCaseId);
    }

    public Object searchProblems(String query) {
        return searchService.searchProblems(query);
    }
}
