package com.codearena.problemservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.codearena.problemservice.problem.Problem;

public interface ProblemRepository extends JpaRepository<Problem, Long> {

    boolean existsByTitle(String title);
}
