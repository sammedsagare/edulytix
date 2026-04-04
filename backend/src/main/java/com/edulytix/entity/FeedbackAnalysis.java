package com.edulytix.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Stores the result of one CSV analysis run, linked to a user.
 */
@Entity
@Table(name = "feedback_analysis")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user who triggered this analysis. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Name of the uploaded CSV file (display only). */
    @Column(name = "file_name")
    private String fileName;

    /** Number of rows analysed. */
    @Column(name = "row_count")
    private Integer rowCount;

    /** The CSV column that was analysed. */
    @Column(name = "selected_column")
    private String selectedColumn;

    @Column(name = "overall_sentiment", length = 20)
    private String overallSentiment;

    /** JSON: {"Positive": 60.0, "Negative": 25.0, "Neutral": 15.0} */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sentiment_distribution", columnDefinition = "jsonb")
    private String sentimentDistribution;

    /** JSON array of keyword strings. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "keywords", columnDefinition = "jsonb")
    private String keywords;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    /** JSON array of strength strings. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "strengths", columnDefinition = "jsonb")
    private String strengths;

    /** JSON array of improvement area strings. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "improvement_areas", columnDefinition = "jsonb")
    private String improvementAreas;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
