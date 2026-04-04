package com.edulytix.repository;

import com.edulytix.entity.FeedbackAnalysis;
import com.edulytix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackAnalysisRepository extends JpaRepository<FeedbackAnalysis, Long> {
    List<FeedbackAnalysis> findByUserOrderByCreatedAtDesc(User user);
}
