-- Enforce one complimentary Gemini business review per anonymous browser trial.
-- The application stores only a SHA-256 hash of the random trial identifier.
CREATE TABLE IF NOT EXISTS business_starter_trial_ai_uses (
  trial_id_hash TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
