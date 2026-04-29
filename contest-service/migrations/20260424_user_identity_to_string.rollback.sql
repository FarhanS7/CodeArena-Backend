-- Rollback for Contest Service identity migration.
-- Date: 2026-04-24
--
-- Warning:
-- - Rollback requires all values in createdBy/userId to be numeric strings.
-- - If non-numeric values exist, rollback will fail.

BEGIN;

ALTER TABLE contest_participants
  ALTER COLUMN "userId" TYPE int
  USING "userId"::int;

ALTER TABLE contests
  ALTER COLUMN "createdBy" TYPE int
  USING "createdBy"::int;

COMMIT;
