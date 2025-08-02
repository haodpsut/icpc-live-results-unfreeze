export enum SubmissionResult {
  PENDING = 'PENDING',
  AC = 'AC',
  WA = 'WA',
}

export interface FrozenSubmission {
  teamId: string;
  teamName: string;
  problemId: string;
  time: number; // Submission time in minutes
  result: SubmissionResult.AC | SubmissionResult.WA;
}

export interface ProblemState {
  attempts: number; // Number of WA attempts before solve
  solveTime: number; // Time of AC submission in minutes
  isSolved: boolean;
  isPending: boolean;
}

export interface TeamStanding {
  id: string; // Team Name
  teamName:string;
  problems: { [problemId: string]: ProblemState };
  problemsSolved: number;
  penaltyTime: number;
  hasPendingSubmissions: boolean;
}

export interface RevealEvent {
  teamId: string;
  problemId: string;
  result: SubmissionResult.AC | SubmissionResult.WA;
}

export enum AppPhase {
  SETUP = 'SETUP',
  REVEALING = 'REVEALING',
  FINISHED = 'FINISHED',
}