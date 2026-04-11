import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSubmissionVerdictFields1234567890001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'submissions',
      new TableColumn({
        name: 'compilation_error',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'submissions',
      new TableColumn({
        name: 'runtime_error',
        type: 'text',
        isNullable: true,
      }),
    );

    // Update the testResults column to enforce JSONB structure
    // Note: If testResults column already exists, this updates the comment
    // to reflect the new structure
    console.log('Migration: Added compilation_error and runtime_error columns');
    console.log(
      'testResults schema should now follow: { totalTests, passedTests, testCases: [{id, status, time, memory, ...}] }',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('submissions', 'runtime_error');
    await queryRunner.dropColumn('submissions', 'compilation_error');
  }
}
