-- Users 
CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL    PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,          -- BCrypt hash
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

--  Feedback Analyses
CREATE TABLE IF NOT EXISTS feedback_analysis (
    id                    BIGSERIAL    PRIMARY KEY,
    user_id               BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name             VARCHAR(500),
    selected_column       VARCHAR(255),
    row_count             INTEGER,
    overall_sentiment     VARCHAR(20),
    sentiment_distribution JSONB,               -- {"Positive":60.0,"Neutral":15.0,"Negative":25.0}
    keywords              JSONB,               -- ["keyword1","keyword2",...]
    summary               TEXT,
    strengths             JSONB,               -- ["strength1","strength2",...]
    improvement_areas     JSONB,               -- ["area1","area2",...]
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_user_id    ON feedback_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_created_at ON feedback_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email                  ON users(email);
