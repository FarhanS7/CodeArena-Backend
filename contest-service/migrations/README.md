# Contest Service SQL Migrations

This folder contains manual SQL migrations for schema changes that must be controlled in production.

## 20260424_user_identity_to_string

Purpose:
- Convert `contests.createdBy` and `contest_participants.userId` from integer to string (`varchar(64)`) to align with auth-service UUID-style JWT subject values.

Apply:
1. Backup the contest database.
2. Run `20260424_user_identity_to_string.sql` in a transaction window.
3. Deploy contest-service code that expects string user IDs.
4. Run smoke tests:
- Create contest
- Register participant
- Start participation
- Submit solution
- Fetch leaderboard

Rollback:
- Use `20260424_user_identity_to_string.rollback.sql` only if data is still numeric-compatible.
- If non-numeric IDs have already been written, rollback requires a data transformation strategy.
