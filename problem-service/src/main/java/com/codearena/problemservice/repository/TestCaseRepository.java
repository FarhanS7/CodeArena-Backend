package com.codearena.problemservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.codearena.problemservice.model.TestCase;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, Long> {

}
