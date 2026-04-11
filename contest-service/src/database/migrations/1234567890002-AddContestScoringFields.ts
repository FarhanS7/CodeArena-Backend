import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddContestScoringFields1234567890002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'contest_participants',
      new TableColumn({
        name: 'total_penalty_minutes',
        type: 'int',
        default: 0,
        comment: 'ICPC-style penalty time: 5 minutes per wrong submission before accepted',
      }),
    );

    await queryRunner.addColumn(
      'contest_participants',
      new TableColumn({
        name: 'time_of_last_solve',
        type: 'timestamp',
        isNullable: true,
        comment: 'Timestamp of last solved problem (used for tiebreaking)',
      }),
    );

    // Update the problemScores column structure comment
    console.log('Migration: Added contest scoring fields for ICPC ranking system');
    console.log('- total_penalty_minutes: 5 minutes per wrong submission (for solved problems only)');
    console.log('- time_of_last_solve: Used as tiebreaker in ranking');
    console.log('- problemScores now includes: wrongSubmissions, submissionTime, and ICPC-style penaltyTime');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('contest_participants', 'time_of_last_solve');
    await queryRunner.dropColumn('contest_participants', 'total_penalty_minutes');
  }
}
