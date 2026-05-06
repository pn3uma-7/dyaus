-- Beta seed: creates a user and API key for testing.
-- Replace values before running.
-- key_hash is SHA-256 of the raw key (hex). Generate with:
--   echo -n "sk-your-raw-key" | sha256sum

INSERT INTO users (email, name) VALUES
  ('beta@example.com', 'Beta User')
ON CONFLICT (email) DO NOTHING;

INSERT INTO api_keys (user_id, key_hash, label, credits)
VALUES (
  (SELECT id FROM users WHERE email = 'beta@example.com'),
  'REPLACE_WITH_SHA256_OF_YOUR_KEY',
  'beta-key-1',
  1000
);
