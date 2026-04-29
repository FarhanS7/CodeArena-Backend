-- Contest Service migration: normalize identity columns to string IDs.
-- Date: 2026-04-24
-- Target: PostgreSQL
--
-- Changes:
-- 1) contests.createdBy: int -> varchar(64)
-- 2) contest_participants.userId: int -> varchar(64)
--
-- Notes:
-- - Existing integer IDs are converted to text with USING ::text.
-- - Unique index on (contestId, userId) remains valid.

BEGIN;

ALTER TABLE contests
  ALTER COLUMN "createdBy" TYPE varchar(64)
  USING "createdBy"::text;

ALTER TABLE contest_participants
  ALTER COLUMN "userId" TYPE varchar(64)
  USING "userId"::text;

COMMIT;
