package com.codearena.problemservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.codearena.problemservice.problem.Problem;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {

    // Custom query (Spring auto-creates it)
    boolean existsByTitle(String title);
}
