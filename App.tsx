
import React, { useState, useCallback } from 'react';
import { AppPhase, TeamStanding, FrozenSubmission, RevealEvent, SubmissionResult } from './types';
import SetupScreen from './components/SetupScreen';
import RevealScreen from './components/RevealScreen';
import { SAMPLE_CSV, PENALTY_PER_WA } from './constants';

interface ContestData {
  teams: TeamStanding[];
  problems: string[];
  revealQueue: FrozenSubmission[];
}

const parseAndInitialize = (csvData: string): ContestData => {
  const lines = csvData.trim().split('\n').slice(1); // Skip header
  const teamsMap = new Map<string, TeamStanding>();
  const problemIdSet = new Set<string>();
  const revealQueue: FrozenSubmission[] = [];

  lines.forEach(line => {
    const matches = line.match(/(?:"[^"]*"|[^,]+)/g) || [];
    if (matches.length < 1 || !matches[0]) return;

    const [teamName, preFreezeStr = '', frozenStr = ''] = matches.map(m => m.replace(/"/g, ''));

    const team: TeamStanding = {
      id: teamName,
      teamName: teamName,
      problems: {},
      problemsSolved: 0, // Will be calculated at the end
      penaltyTime: 0,    // Will be calculated at the end
      hasPendingSubmissions: (frozenStr || '').trim() !== '',
    };
    
    // Helper to get or create a problem state
    const getProblem = (problemId: string) => {
        problemIdSet.add(problemId);
        if (!team.problems[problemId]) {
            team.problems[problemId] = { attempts: 0, isSolved: false, solveTime: 0, isPending: false };
        }
        return team.problems[problemId];
    };

    // Step 1: Process Pre-Freeze Statuses to establish baseline
    (preFreezeStr || '').split('|').filter(s => s).forEach(statusStr => {
        const [problemId, status, timeStr, attemptsStr] = statusStr.split(',');
        if (!problemId) return;
        
        const probState = getProblem(problemId);
        const attempts = parseInt(attemptsStr, 10) || 0;
        
        probState.attempts = attempts; // These are attempts *before* the AC
        
        if (status === 'AC') {
            probState.isSolved = true;
            probState.solveTime = parseInt(timeStr, 10) || 0;
        }
    });

    // Step 2: Process Frozen Submissions to mark problems as pending and build queue
    (frozenStr || '').split('|').filter(s => s).forEach(updateStr => {
        const [problemId, timeStr, result] = updateStr.split(',');
        const time = parseInt(timeStr, 10);
        if (!problemId || isNaN(time) || (result !== 'AC' && result !== 'WA')) return;

        const probState = getProblem(problemId);
        probState.isPending = true;

        revealQueue.push({
            teamId: team.id,
            teamName: team.teamName,
            problemId,
            time,
            result: result as SubmissionResult.AC | SubmissionResult.WA,
        });
    });
    
    // Step 3: Calculate the correct *initial* score based on the final state of problems
    let solvedCount = 0;
    let penalty = 0;
    Object.values(team.problems).forEach(p => {
        if (p.isSolved && !p.isPending) {
            solvedCount++;
            penalty += p.solveTime + (p.attempts * PENALTY_PER_WA);
        }
    });
    team.problemsSolved = solvedCount;
    team.penaltyTime = penalty;
    
    teamsMap.set(teamName, team);
  });

  revealQueue.sort((a, b) => a.time - b.time);
  const problems = Array.from(problemIdSet).sort((a, b) => a.localeCompare(b));
  
  return {
    teams: Array.from(teamsMap.values()),
    problems,
    revealQueue,
  };
};

const sortTeams = (teamList: TeamStanding[]): TeamStanding[] => {
  return [...teamList].sort((a, b) => {
    if (a.problemsSolved !== b.problemsSolved) {
      return b.problemsSolved - a.problemsSolved;
    }
    if (a.penaltyTime !== b.penaltyTime) {
      return a.penaltyTime - b.penaltyTime;
    }
    if (a.hasPendingSubmissions !== b.hasPendingSubmissions) {
      return a.hasPendingSubmissions ? -1 : 1;
    }
    return a.teamName.localeCompare(b.teamName);
  });
};

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.SETUP);
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [problemsList, setProblemsList] = useState<string[]>([]);
  const [revealQueue, setRevealQueue] = useState<FrozenSubmission[]>([]);
  const [lastReveal, setLastReveal] = useState<RevealEvent | null>(null);
  const [csvData, setCsvData] = useState<string>(SAMPLE_CSV);

  const handleStart = useCallback(() => {
    const { teams, problems, revealQueue } = parseAndInitialize(csvData);
    setTeams(sortTeams(teams));
    setProblemsList(problems);
    setRevealQueue(revealQueue);
    setLastReveal(null);
    setPhase(AppPhase.REVEALING);
  }, [csvData]);

  const handleNext = useCallback(() => {
    let currentTeams = [...teams];
    let currentRevealQueue = [...revealQueue];

    while (true) {
      const teamToReveal = [...currentTeams].reverse().find(t => t.hasPendingSubmissions);

      if (!teamToReveal) {
        setPhase(AppPhase.FINISHED);
        setTeams(sortTeams(currentTeams));
        return;
      }

      const submissionIndex = currentRevealQueue.findIndex(s => s.teamId === teamToReveal.id);

      if (submissionIndex === -1) {
        currentTeams = currentTeams.map(t =>
          t.id === teamToReveal.id ? { ...t, hasPendingSubmissions: false } : t
        );
        continue;
      }

      const submission = currentRevealQueue[submissionIndex];

      setLastReveal({
        teamId: submission.teamId,
        problemId: submission.problemId,
        result: submission.result,
      });

      const updatedTeams = currentTeams.map(t => {
        if (t.id !== submission.teamId) return t;

        const team = JSON.parse(JSON.stringify(t));
        const probState = team.problems[submission.problemId];
        const newRevealQueue = currentRevealQueue.filter((_, i) => i !== submissionIndex);

        // Update problem state based on the submission
        if (submission.result === SubmissionResult.AC) {
          if (!probState.isSolved) {
            probState.isSolved = true;
            probState.solveTime = submission.time;
          }
        } else { // WA
          if (!probState.isSolved) {
            probState.attempts += 1;
          }
        }
        
        // Update pending statuses
        const hasMoreForThisProblem = newRevealQueue.some(s => s.teamId === submission.teamId && s.problemId === submission.problemId);
        if (!hasMoreForThisProblem) {
          probState.isPending = false;
        }

        const hasMoreForTeam = newRevealQueue.some(s => s.teamId === submission.teamId);
        if (!hasMoreForTeam) {
          team.hasPendingSubmissions = false;
        }

        // Recalculate score for the updated team from scratch to ensure correctness
        let solvedCount = 0;
        let penalty = 0;
        Object.values(team.problems).forEach((p: any) => {
            if (p.isSolved && !p.isPending) {
                solvedCount++;
                penalty += p.solveTime + (p.attempts * PENALTY_PER_WA);
            }
        });
        team.problemsSolved = solvedCount;
        team.penaltyTime = penalty;

        return team;
      });
      
      const newRevealQueue = currentRevealQueue.filter((_, i) => i !== submissionIndex);
      setTeams(sortTeams(updatedTeams));
      setRevealQueue(newRevealQueue);

      if (newRevealQueue.length === 0) {
          setPhase(AppPhase.FINISHED);
      }
      
      break;
    }
  }, [teams, revealQueue]);

  const handleReset = () => {
    setPhase(AppPhase.SETUP);
    setTeams([]);
    setProblemsList([]);
    setRevealQueue([]);
    setLastReveal(null);
  };
  
  const handleReconfigure = () => {
    setPhase(AppPhase.SETUP);
  };

  switch (phase) {
    case AppPhase.REVEALING:
    case AppPhase.FINISHED:
      return (
        <RevealScreen
          teams={teams}
          problemsList={problemsList}
          onNext={handleNext}
          onReset={handleReset}
          onReconfigure={handleReconfigure}
          isFinished={phase === AppPhase.FINISHED || revealQueue.length === 0}
          lastReveal={lastReveal}
        />
      );
    case AppPhase.SETUP:
    default:
      return <SetupScreen onStart={handleStart} csvData={csvData} onCsvDataChange={setCsvData} />;
  }
};

export default App;
