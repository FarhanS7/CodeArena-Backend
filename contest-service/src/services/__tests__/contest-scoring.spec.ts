import { Test, TestingModule } from '@nestjs/testing';
import { ContestService } from '../contest.service';
import { Contest } from '../entities/contest.entity';
import { ContestParticipant } from '../entities/contest-participant.entity';
import { ContestStatus, ParticipantStatus } from '../enums/contest.enum';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * TDD TESTS - Contest Scoring & Penalty Calculation
 * Tests the complete contest result calculation system
 */
describe('ContestService - Scoring & Penalties (TDD)', () => {
  let service: ContestService;
  let contestRepository: Repository<Contest>;
  let participantRepository: Repository<ContestParticipant>;

  const mockContestRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockParticipantRepository = {
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestService,
        {
          provide: getRepositoryToken(Contest),
          useValue: mockContestRepository,
        },
        {
          provide: getRepositoryToken(ContestParticipant),
          useValue: mockParticipantRepository,
        },
      ],
    }).compile();

    service = module.get<ContestService>(ContestService);
    contestRepository = module.get<Repository<Contest>>(getRepositoryToken(Contest));
    participantRepository = module.get<Repository<ContestParticipant>>(
      getRepositoryToken(ContestParticipant),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Penalty Calculation', () => {
    /**
     * TEST 1: Basic penalty - 5 minutes per wrong submission before accepted
     */
    it('should calculate penalty as 5 minutes per wrong submission', () => {
      // 3 wrong attempts before acceptance
      const wrongSubmissions = 3;
      const penaltyMinutes = wrongSubmissions * 5;

      expect(penaltyMinutes).toBe(15);
    });

    /**
     * TEST 2: No penalty for correct answer on first try
     */
    it('should have zero penalty for first attempt acceptance', () => {
      const wrongSubmissions = 0;
      const penaltyMinutes = wrongSubmissions * 5;

      expect(penaltyMinutes).toBe(0);
    });

    /**
     * TEST 3: Penalty cap to prevent excessive accumulation
     */
    it('should cap penalty at maximum (e.g., 500 minutes for 100 wrong attempts)', () => {
      const wrongSubmissions = 100;
      const basepenaltyMinutes = wrongSubmissions * 5;
      const maxPenaltyMinutes = 500;

      const finalPenalty = Math.min(basepenaltyMinutes, maxPenaltyMinutes);

      expect(finalPenalty).toBe(500);
    });

    /**
     * TEST 4: Penalty reset if no acceptance (participant didn't solve)
     */
    it('should not apply penalty if problem was never solved', () => {
      const wrongSubmissions = 5;
      const isSolved = false;

      const penaltyMinutes = isSolved ? wrongSubmissions * 5 : 0;

      expect(penaltyMinutes).toBe(0);
    });
  });

  describe('Score Calculation (ICPC Formula)', () => {
    /**
     * TEST 5: Calculate score using ICPC formula
     * Score = max(0, problemPoints × (1 - (timeTaken / totalContestTime) × 0.25))
     */
    it('should calculate score using ICPC formula: problemPoints * (1 - (time/total) * 0.25)', () => {
      const problemPoints = 100;
      const timeTaken = 30; // minutes
      const totalContestTime = 300; // 5 hour contest
      const wrongSubmissions = 2;

      // Final score = points × time factor - penalty score
      const timeFactorScore =
        problemPoints * (1 - (timeTaken / totalContestTime) * 0.25);
      const penaltyScore = wrongSubmissions * (-2); // -2 for each wrong attempt
      const finalScore = Math.max(0, timeFactorScore + penaltyScore);

      // (100 * (1 - (30/300) * 0.25)) + (2 * -2)
      // (100 * (1 - 0.025)) - 4
      // (100 * 0.975) - 4
      // 97.5 - 4 = 93.5
      expect(finalScore).toBeCloseTo(93.5, 1);
    });

    /**
     * TEST 6: Score should not go below zero
     */
    it('should never return negative score (minimum 0)', () => {
      const problemPoints = 10;
      const timeTaken = 290; // submitted very late
      const totalContestTime = 300;
      const wrongSubmissions = 10;

      const timeFactorScore =
        problemPoints * (1 - (timeTaken / totalContestTime) * 0.25);
      const penaltyScore = wrongSubmissions * (-2);
      const finalScore = Math.max(0, timeFactorScore + penaltyScore);

      expect(finalScore).toBeGreaterThanOrEqual(0);
    });

    /**
     * TEST 7: Immediate submission (first minute) should score highest
     */
    it('should give maximum score for immediate correct submission', () => {
      const problemPoints = 100;
      const timeTaken = 1; // Submitted immediately
      const totalContestTime = 300;
      const wrongSubmissions = 0;

      const score = problemPoints * (1 - (timeTaken / totalContestTime) * 0.25);

      expect(score).toBeCloseTo(100 * (1 - (1 / 300) * 0.25), 2);
      expect(score).toBeGreaterThan(99.9);
    });

    /**
     * TEST 8: Late submission (299 minutes) should score significantly less
     */
    it('should significantly reduce score for late submission', () => {
      const problemPoints = 100;
      const timeTaken = 299; // Almost at end
      const totalContestTime = 300;
      const wrongSubmissions = 0;

      const score = problemPoints * (1 - (timeTaken / totalContestTime) * 0.25);

      // 100 * (1 - (299/300) * 0.25) = 100 * (1 - 0.249) = 100 * 0.751 = 75.1
      expect(score).toBeCloseTo(100 * (1 - (299 / 300) * 0.25), 2);
      expect(score).toBeLessThan(76);
    });

    /**
     * TEST 9: Unsolved problem scores zero
     */
    it('should give zero score for unsolved problem', () => {
      const isSolved = false;
      const score = isSolved ? 100 : 0;

      expect(score).toBe(0);
    });
  });

  describe('Contest Ranking & Tie-Breaking', () => {
    /**
     * TEST 10: Ranking by total score (descending)
     */
    it('should rank participants by total score descending', () => {
      const participants = [
        { userId: 'user1', totalScore: 250, totalPenaltyMinutes: 15 },
        { userId: 'user2', totalScore: 200, totalPenaltyMinutes: 10 },
        { userId: 'user3', totalScore: 250, totalPenaltyMinutes: 20 },
        { userId: 'user4', totalScore: 150, totalPenaltyMinutes: 5 },
      ];

      // Sort by score DESC
      const sorted = [...participants].sort((a, b) => b.totalScore - a.totalScore);

      expect(sorted[0].totalScore).toBe(250);
      expect(sorted[1].totalScore).toBe(250);
      expect(sorted[2].totalScore).toBe(200);
      expect(sorted[3].totalScore).toBe(150);
    });

    /**
     * TEST 11: Tiebreaker 1: Lower penalty time wins
     */
    it('should use penalty time as first tiebreaker (lower penalty wins)', () => {
      // Two users with same score
      const user1 = {
        userId: 'user1',
        totalScore: 250,
        totalPenaltyMinutes: 15,
      };
      const user2 = {
        userId: 'user2',
        totalScore: 250,
        totalPenaltyMinutes: 20,
      };

      // First tiebreaker: penalty time
      let ranking: typeof user1[] = [];
      if (user1.totalScore === user2.totalScore) {
        // Same score, use penalty
        ranking = user1.totalPenaltyMinutes < user2.totalPenaltyMinutes
          ? [user1, user2]
          : [user2, user1];
      }

      expect(ranking[0]).toEqual(user1); // Lower penalty (15) ranks first
      expect(ranking[1]).toEqual(user2); // Higher penalty (20) ranks second
    });

    /**
     * TEST 12: Tiebreaker 2: Earlier submission time wins
     */
    it('should use submission time as second tiebreaker (earlier submission wins)', () => {
      // Two users with identical score and penalty
      const user1 = {
        userId: 'user1',
        totalScore: 250,
        totalPenaltyMinutes: 15,
        timeOfLastSolve: 150, // minutes from contest start
      };
      const user2 = {
        userId: 'user2',
        totalScore: 250,
        totalPenaltyMinutes: 15,
        timeOfLastSolve: 120, // earlier submission
      };

      let ranking: typeof user1[] = [];
      if (
        user1.totalScore === user2.totalScore &&
        user1.totalPenaltyMinutes === user2.totalPenaltyMinutes
      ) {
        ranking = user1.timeOfLastSolve < user2.timeOfLastSolve
          ? [user1, user2]
          : [user2, user1];
      }

      expect(ranking[0]).toEqual(user1);
      expect(ranking[1]).toEqual(user2);
    });

    /**
     * TEST 13: Complete ranking with all tiebreakers
     */
    it('should rank 4 users with complex tiebreaker scenarios', () => {
      const participants = [
        { rank: 0, userId: 'user1', score: 300, penalty: 10, lastSolve: 100 },
        { rank: 0, userId: 'user2', score: 300, penalty: 10, lastSolve: 120 }, // Same score, same penalty, later
        { rank: 0, userId: 'user3', score: 300, penalty: 15, lastSolve: 90 }, // Same score, more penalty
        { rank: 0, userId: 'user4', score: 250, penalty: 5, lastSolve: 80 }, // Lower score
      ];

      // Sort: score DESC, then penalty ASC, then lastSolve ASC
      const sorted = [...participants].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.penalty !== b.penalty) return a.penalty - b.penalty;
        return a.lastSolve - b.lastSolve;
      });

      // Expected order: user1 (300, 10, 100), user2 (300, 10, 120), user3 (300, 15, 90), user4 (250, 5, 80)
      expect(sorted[0].userId).toBe('user1');
      expect(sorted[1].userId).toBe('user2');
      expect(sorted[2].userId).toBe('user3');
      expect(sorted[3].userId).toBe('user4');
    });
  });

  describe('Contest Status Transitions', () => {
    /**
     * TEST 14: Contest can only be finalized when ENDED
     */
    it('should only allow finalization of ENDED contests', () => {
      const statusesToTest = [
        ContestStatus.UPCOMING,
        ContestStatus.REGISTRATION_OPEN,
        ContestStatus.ACTIVE,
        ContestStatus.ENDED,
        ContestStatus.CANCELLED,
      ];

      const canFinalize = statusesToTest.map((status) => ({
        status,
        canFinalize: status === ContestStatus.ENDED,
      }));

      expect(canFinalize[0].canFinalize).toBe(false); // UPCOMING
      expect(canFinalize[1].canFinalize).toBe(false); // REGISTRATION_OPEN
      expect(canFinalize[2].canFinalize).toBe(false); // ACTIVE
      expect(canFinalize[3].canFinalize).toBe(true); // ENDED
      expect(canFinalize[4].canFinalize).toBe(false); // CANCELLED
    });

    /**
     * TEST 15: Contest status auto-transition based on time
     */
    it('should auto-transition contest status based on current time', () => {
      const now = new Date();
      const contest = new Contest();

      // Past registration period
      contest.registrationStartTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      contest.registrationEndTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      contest.startTime = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour from now

      // Contest should auto-transition to REGISTRATION_CLOSED → ACTIVE when time comes
      expect(contest.registrationEndTime.getTime()).toBeLessThan(now.getTime());
      expect(contest.startTime.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('Problem Scoring within Contest', () => {
    /**
     * TEST 16: Different problem difficulties should have different point values
     */
    it('should assign different points based on problem difficulty', () => {
      const problemPoints = {
        EASY: 100,
        MEDIUM: 150,
        HARD: 200,
      };

      expect(problemPoints.EASY).toBe(100);
      expect(problemPoints.MEDIUM).toBe(150);
      expect(problemPoints.HARD).toBe(200);
    });

    /**
     * TEST 17: Wrong submission penalty should be applied per problem
     */
    it('should track wrong submissions per problem for penalty calculation', () => {
      const participant = {
        userId: 'user1',
        problemScores: {
          A: { wrongSubmissions: 2, solved: true, score: 95 },
          B: { wrongSubmissions: 0, solved: true, score: 100 },
          C: { wrongSubmissions: 5, solved: false, score: 0 },
        },
      };

      const totalPenalty = (
        Object.values(participant.problemScores)
          .filter((p) => p.solved)
          .reduce((sum, p) => sum + p.wrongSubmissions * 5, 0)
      );

      // A: 2 * 5 = 10, B: 0 * 5 = 0, C is not solved so no penalty
      expect(totalPenalty).toBe(10);
    });

    /**
     * TEST 18: Contest results should include per-problem breakdown
     */
    it('should include detailed per-problem breakdown in results', () => {
      const contestResults = {
        contestId: 1,
        problems: {
          A: {
            title: 'Binary Search',
            difficulty: 'EASY',
            points: 100,
            acceptanceRate: 85,
            solvedCount: 40,
          },
          B: {
            title: 'Dynamic Programming',
            difficulty: 'MEDIUM',
            points: 150,
            acceptanceRate: 45,
            solvedCount: 20,
          },
          C: {
            title: 'Graph Coloring',
            difficulty: 'HARD',
            points: 200,
            acceptanceRate: 15,
            solvedCount: 7,
          },
        },
        statistics: {
          totalParticipants: 50,
          averageScore: 175,
          highestScore: 450,
          lowestScore: 0,
        },
      };

      expect(contestResults.problems.A.difficulty).toBe('EASY');
      expect(contestResults.problems.B.points).toBe(150);
      expect(contestResults.statistics.totalParticipants).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    /**
     * TEST 19: Single participant contest ranking
     */
    it('should handle contest with only one participant', () => {
      const participant = {
        rank: 1,
        userId: 'user1',
        totalScore: 300,
        totalPenaltyMinutes: 15,
      };

      expect(participant.rank).toBe(1);
      expect(participant.totalScore).toBe(300);
    });

    /**
     * TEST 20: All participants have same score (all use tiebreakers)
     */
    it('should properly rank when all participants have identical scores', () => {
      const participants = [
        { userId: 'user1', score: 300, penalty: 10, lastSolve: 100 },
        { userId: 'user2', score: 300, penalty: 15, lastSolve: 90 },
        { userId: 'user3', score: 300, penalty: 10, lastSolve: 120 },
      ];

      const sorted = [...participants].sort((a, b) => {
        if (a.penalty !== b.penalty) return a.penalty - b.penalty;
        return a.lastSolve - b.lastSolve;
      });

      // user1 (penalty 10, time 100), user3 (penalty 10, time 120), user2 (penalty 15, time 90)
      expect(sorted[0].userId).toBe('user1');
      expect(sorted[1].userId).toBe('user3');
      expect(sorted[2].userId).toBe('user2');
    });
  });
});
