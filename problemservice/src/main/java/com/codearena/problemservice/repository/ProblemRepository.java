package com.codearena.problemservice.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.codearena.problemservice.problem.Difficulty;
import com.codearena.problemservice.problem.Problem;

public interface ProblemRepository extends JpaRepository<Problem, Long> {

    boolean existsByTitle(String title);

    @Query("""
        SELECT p FROM Problem p
        WHERE (:difficulty IS NULL OR p.difficulty = :difficulty)
        AND (:search IS NULL OR 
             LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR 
             LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    Page<Problem> searchProblems(Difficulty difficulty, String search, Pageable pageable);
}
