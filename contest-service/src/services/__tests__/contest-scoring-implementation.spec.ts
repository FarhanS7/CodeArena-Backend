import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContestScoringService } from '../contest-scoring.service';
import { Contest, ContestStatus } from '../../entities/contest.entity';
import { ContestParticipant, ParticipantStatus } from '../../entities/contest-participant.entity';
import { ContestProblem } from '../../entities/contest-problem.entity';

/**
 * IMPLEMENTATION TESTS - Contest Scoring Service
 * Verifies that ContestScoringService correctly implements all scoring logic
 */
describe('ContestScoringService - Implementation (GREEN Phase)', () => {
  let service: ContestScoringService;
  let mockContestRepository: any;
  let mockParticipantRepository: any;
  let mockContestProblemRepository: any;

  beforeEach(async () => {
    mockContestRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    mockParticipantRepository = {
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    mockContestProblemRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestScoringService,
        {
          provide: getRepositoryToken(Contest),
          useValue: mockContestRepository,
        },
        {
          provide: getRepositoryToken(ContestParticipant),
          useValue: mockParticipantRepository,
        },
        {
          provide: getRepositoryToken(ContestProblem),
          useValue: mockContestProblemRepository,
        },
      ],
    }).compile();

    service = module.get<ContestScoringService>(ContestScoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Penalty Calculation', () => {
    it('should calculate penalty as 5 minutes per wrong submission', () => {
      const penalty = service.calculatePenaltyMinutes(3);
      expect(penalty).toBe(15); // 3 * 5 = 15
    });

    it('should have zero penalty for no wrong submissions', () => {
      const penalty = service.calculatePenaltyMinutes(0);
      expect(penalty).toBe(0);
    });

    it('should cap penalty at 500 minutes', () => {
      const penalty = service.calculatePenaltyMinutes(100);
      expect(penalty).toBe(500); // capped at 500
    });

    it('should calculate penalty for 50 wrong submissions as 250 minutes', () => {
      const penalty = service.calculatePenaltyMinutes(50);
      expect(penalty).toBe(250); // 50 * 5
    });
  });

  describe('ICPC Score Calculation', () => {
    it('should calculate ICPC score correctly: 100 * (1 - (30/300)*0.25) - (2*2) = 93.5', () => {
      const score = service.calculateICPCScore(
        100, // problemPoints
        30, // timeTakenMinutes
        300, // totalContestTimeMinutes
        2, // wrongSubmissions
      );

      // 100 * (1 - (30/300)*0.25) - (2*2)
      // 100 * (1 - 0.025) - 4
      // 100 * 0.975 - 4 = 97.5 - 4 = 93.5
      expect(score).toBeCloseTo(93.5, 1);
    });

    it('should never return negative score', () => {
      const score = service.calculateICPCScore(
        10, // Very low points
        290, // Very late submission
        300,
        10, // Many wrong attempts
      );

      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should give maximum score for immediate correct submission', () => {
      const score = service.calculateICPCScore(
        100, // Full points
        1, // Submitted immediately (minute 1)
        300,
        0, // No wrong attempts
      );

      // 100 * (1 - (1/300)*0.25) - 0
      // 100 * (1 - 0.000833) ≈ 99.92
      expect(score).toBeGreaterThan(99.9);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should reduce score significantly for late submission (minute 299)', () => {
      const score = service.calculateICPCScore(
        100,
        299,
        300,
        0,
      );

      // 100 * (1 - (299/300)*0.25) = 100 * (1 - 0.249) = 100 * 0.751 ≈ 75.1
      expect(score).toBeLessThan(76);
      expect(score).toBeGreaterThan(75);
    });

    it('should apply penalty of 2 points per wrong submission', () => {
      const score1 = service.calculateICPCScore(100, 100, 300, 0);
      const score2 = service.calculateICPCScore(100, 100, 300, 5);

      // Score 2 should be 5*2=10 points lower than score 1
      expect(score1 - score2).toBeCloseTo(10, 0);
    });
  });

  describe('Problem Points Assignment', () => {
    it('should return 100 points for EASY problems', () => {
      const points = service.getProblemPoints('EASY');
      expect(points).toBe(100);
    });

    it('should return 150 points for MEDIUM problems', () => {
      const points = service.getProblemPoints('MEDIUM');
      expect(points).toBe(150);
    });

    it('should return 200 points for HARD problems', () => {
      const points = service.getProblemPoints('HARD');
      expect(points).toBe(200);
    });

    it('should handle case-insensitive difficulty', () => {
      expect(service.getProblemPoints('easy')).toBe(100);
      expect(service.getProblemPoints('Medium')).toBe(150);
      expect(service.getProblemPoints('HARD')).toBe(200);
    });
  });

  describe('Participant Ranking', () => {
    it('should rank participants by score descending', () => {
      const participants = [
        {
          userId: 1,
          totalScore: 150,
          totalPenaltyMinutes: 10,
          timeOfLastSolve: new Date(),
          status: ParticipantStatus.FINISHED,
        } as any,
        {
          userId: 2,
          totalScore: 250,
          totalPenaltyMinutes: 15,
          timeOfLastSolve: new Date(),
          status: ParticipantStatus.FINISHED,
        } as any,
        {
          userId: 3,
          totalScore: 200,
          totalPenaltyMinutes: 5,
          timeOfLastSolve: new Date(),
          status: ParticipantStatus.FINISHED,
        } as any,
      ];

      const ranked = service.rankParticipants(participants);

      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].participant.userId).toBe(2); // 250 points
      expect(ranked[1].rank).toBe(2);
      expect(ranked[1].participant.userId).toBe(3); // 200 points
      expect(ranked[2].rank).toBe(3);
      expect(ranked[2].participant.userId).toBe(1); // 150 points
    });

    it('should use penalty time as first tiebreaker', () => {
      const now = new Date();
      const participants = [
        {
          userId: 1,
          totalScore: 250,
          totalPenaltyMinutes: 20, // Higher penalty
          timeOfLastSolve: now,
          status: ParticipantStatus.FINISHED,
        } as any,
        {
          userId: 2,
          totalScore: 250,
          totalPenaltyMinutes: 10, // Lower penalty - should rank first
          timeOfLastSolve: now,
          status: ParticipantStatus.FINISHED,
        } as any,
      ];

      const ranked = service.rankParticipants(participants);

      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].participant.userId).toBe(2); // Lower penalty wins
      expect(ranked[1].rank).toBe(2);
      expect(ranked[1].participant.userId).toBe(1);
    });

    it('should use submission time as second tiebreaker', () => {
      const time1 = new Date('2024-01-01T12:00:00');
      const time2 = new Date('2024-01-01T12:30:00');

      const participants = [
        {
          userId: 1,
          totalScore: 250,
          totalPenaltyMinutes: 10,
          timeOfLastSolve: time2, // Later submission
          status: ParticipantStatus.FINISHED,
        } as any,
        {
          userId: 2,
          totalScore: 250,
          totalPenaltyMinutes: 10,
          timeOfLastSolve: time1, // Earlier submission - should rank first
          status: ParticipantStatus.FINISHED,
        } as any,
      ];

      const ranked = service.rankParticipants(participants);

      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].participant.userId).toBe(2); // Earlier submission wins
      expect(ranked[1].rank).toBe(2);
      expect(ranked[1].participant.userId).toBe(1);
    });

    it('should skip disqualified participants in ranking', () => {
      const participants = [
        {
          userId: 1,
          totalScore: 300,
          totalPenaltyMinutes: 5,
          status: ParticipantStatus.FINISHED,
        } as any,
        {
          userId: 2,
          totalScore: 400, // Higher score but disqualified
          totalPenaltyMinutes: 0,
          status: ParticipantStatus.DISQUALIFIED,
        } as any,
        {
          userId: 3,
          totalScore: 200,
          totalPenaltyMinutes: 10,
          status: ParticipantStatus.FINISHED,
        } as any,
      ];

      const ranked = service.rankParticipants(participants);

      // Disqualified user should not be ranked
      expect(ranked.length).toBe(2);
      expect(ranked[0].participant.userId).toBe(1);
      expect(ranked[1].participant.userId).toBe(3);
    });

    it('should handle complex ranking with all tiebreakers', () => {
      const participants = [
        {
          userId: 1,
          totalScore: 300,
          totalPenaltyMinutes: 10,
          timeOfLastSolve: new Date('2024-01-01T12:00:00'),
          status: ParticipantStatus.FINISHED,
        } as any,
        {
          userId: 2,
          totalScore: 300,
          totalPenaltyMinutes: 10,
          timeOfLastSolve: new Date('2024-01-01T12:30:00'),
          status: ParticipantStatus.FINISHED,
        } as any,
        {
          userId: 3,
          totalScore: 300,
          totalPenaltyMinutes: 15,
          timeOfLastSolve: new Date('2024-01-01T11:00:00'),
          status: ParticipantStatus.FINISHED,
        } as any,
        {
          userId: 4,
          totalScore: 250,
          totalPenaltyMinutes: 5,
          timeOfLastSolve: new Date('2024-01-01T10:00:00'),
          status: ParticipantStatus.FINISHED,
        } as any,
      ];

      const ranked = service.rankParticipants(participants);

      // Expected order:
      // 1. User 1 (300 pts, 10 penalty, 12:00)
      // 2. User 2 (300 pts, 10 penalty, 12:30) - same score/penalty but later
      // 3. User 3 (300 pts, 15 penalty) - higher penalty
      // 4. User 4 (250 pts)
      expect(ranked[0].participant.userId).toBe(1);
      expect(ranked[1].participant.userId).toBe(2);
      expect(ranked[2].participant.userId).toBe(3);
      expect(ranked[3].participant.userId).toBe(4);
    });
  });

  describe('Date Validation', () => {
    it('should validate contest dates correctly', () => {
      const regStart = new Date('2024-01-01T10:00:00');
      const regEnd = new Date('2024-01-01T14:00:00');
      const contestStart = new Date('2024-01-01T15:00:00');
      const contestEnd = new Date('2024-01-01T20:00:00');
      const duration = 300; // 5 hours

      expect(() =>
        service.validateContestDates(regStart, regEnd, contestStart, contestEnd, duration),
      ).not.toThrow();
    });

    it('should reject if registration start >= registration end', () => {
      const regStart = new Date('2024-01-01T14:00:00');
      const regEnd = new Date('2024-01-01T14:00:00'); // Same time
      const contestStart = new Date('2024-01-01T15:00:00');
      const contestEnd = new Date('2024-01-01T20:00:00');

      expect(() =>
        service.validateContestDates(regStart, regEnd, contestStart, contestEnd, 300),
      ).toThrow();
    });

    it('should reject duration less than 5 minutes', () => {
      const regStart = new Date('2024-01-01T10:00:00');
      const regEnd = new Date('2024-01-01T14:00:00');
      const contestStart = new Date('2024-01-01T15:00:00');
      const contestEnd = new Date('2024-01-01T15:04:00');
      const duration = 4; // 4 minutes

      expect(() =>
        service.validateContestDates(regStart, regEnd, contestStart, contestEnd, duration),
      ).toThrow();
    });

    it('should reject duration longer than 7 days', () => {
      const regStart = new Date('2024-01-01T10:00:00');
      const regEnd = new Date('2024-01-01T14:00:00');
      const contestStart = new Date('2024-01-01T15:00:00');
      const contestEnd = new Date('2024-01-09T15:00:00');
      const duration = 7 * 24 * 60 + 1; // 7 days + 1 minute

      expect(() =>
        service.validateContestDates(regStart, regEnd, contestStart, contestEnd, duration),
      ).toThrow();
    });
  });
});
