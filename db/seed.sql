-- Beta seed: creates a user and API key for testing.
-- Steps:
--   1. Generate a raw key and its hash on PC2:
--        RAW_KEY="sk-dyaus-$(openssl rand -hex 24)"
--        echo "Raw key (save this): $RAW_KEY"
--        echo -n "$RAW_KEY" | sha256sum | awk '{print $1}'
--   2. Replace the placeholders below with your values.
--   3. Run: psql -U dyaus_user -d dyaus -f db/seed.sql

INSERT INTO users (email, name, credit_balance) VALUES
  ('beta@example.com', 'Beta User', 10000)
ON CONFLICT (email) DO NOTHING;

INSERT INTO api_keys (user_id, key_hash, key_prefix, label, model_access)
VALUES (
  (SELECT id FROM users WHERE email = 'beta@example.com'),
  'REPLACE_WITH_SHA256_HASH',
  'sk-dyaus-xxxx',
  'beta-key-1',
  '{"qwen3-30b"}'
);
