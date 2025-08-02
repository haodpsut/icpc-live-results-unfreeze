import React from 'react';
import { TeamStanding, RevealEvent, SubmissionResult } from '../types';
import { ROW_HEIGHT } from '../constants';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from './icons';


interface ProblemCellProps {
    state?: TeamStanding['problems'][string];
    isHighlighted: boolean;
    revealResult?: SubmissionResult.AC | SubmissionResult.WA;
}

const ProblemCell: React.FC<ProblemCellProps> = ({ state, isHighlighted, revealResult }) => {
    const animationClass = isHighlighted ? (revealResult === SubmissionResult.AC ? 'animate-flashAc' : 'animate-flashWa') : '';
    
    let bgColor = 'bg-contest-dark-light/50';
    let content = null;

    if (state?.isPending) {
        bgColor = 'bg-contest-pending/60';
        content = <ClockIcon className="w-6 h-6 text-white/80" />;
    } else if (state?.isSolved) {
        bgColor = 'bg-contest-ac/70';
        content = (
            <div className="text-center">
                <p className="font-bold text-sm">{state.solveTime}</p>
                {state.attempts > 0 && <p className="text-xs">{`+${state.attempts}`}</p>}
            </div>
        );
    } else if (state && state.attempts > 0) {
        bgColor = 'bg-contest-wa/70';
         content = (
            <div className="text-center">
                <p className="font-bold text-lg">-{state.attempts}</p>
            </div>
        );
    }

    return (
        <div className={`w-20 h-12 flex-shrink-0 rounded-md flex items-center justify-center font-mono transition-colors duration-300 ${bgColor} ${animationClass}`}>
            {content}
        </div>
    );
};


interface TeamRowProps {
  team: TeamStanding;
  rank: number;
  problemsList: string[];
  lastReveal: RevealEvent | null;
}

const TeamRow: React.FC<TeamRowProps> = ({ team, rank, problemsList, lastReveal }) => {
  const topPosition = (rank - 1) * ROW_HEIGHT;
  
  const isHighlighted = lastReveal?.teamId === team.id;
  
  const getRowBgColor = () => {
      if (isHighlighted) {
        return 'bg-blue-900/50 scale-105 shadow-2xl z-20';
      }
      if (!team.hasPendingSubmissions) {
          return 'bg-gray-800/50 z-10'; // Finalized color for teams with no more pending submissions
      }
      return 'bg-contest-dark-light/80 z-10';
  };

  const medalColor = 
        rank === 1 ? 'bg-contest-gold text-black' :
        rank === 2 ? 'bg-contest-silver text-black' :
        rank === 3 ? 'bg-contest-bronze text-black' :
        'bg-contest-gray text-white';

  return (
    <div
      className={`absolute w-full px-4 rounded-lg flex items-center transition-all duration-700 ease-in-out ${getRowBgColor()}`}
      style={{ 
          top: `${topPosition}px`,
          height: `${ROW_HEIGHT - 8}px`
      }}
    >
        {/* Rank */}
        <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-xl font-bold ${medalColor}`}>
            {rank}
        </div>
        
        {/* Team Name */}
        <div className="flex-1 font-semibold text-lg truncate px-4">{team.teamName}</div>

        {/* Solved */}
        <div className="w-24 text-center font-mono">
            <div className="text-3xl font-bold">{team.problemsSolved}</div>
        </div>

        {/* Penalty */}
        <div className="w-24 text-center font-mono">
             <div className="text-xl font-semibold">{team.penaltyTime}</div>
        </div>

        {/* Problems */}
        <div className="flex items-center justify-end space-x-2 pl-4">
            {problemsList.map((problemId) => {
                 const isRevealedCell = lastReveal?.teamId === team.id && lastReveal?.problemId === problemId;
                 return (
                     <ProblemCell
                        key={problemId}
                        state={team.problems[problemId]}
                        isHighlighted={isRevealedCell}
                        revealResult={lastReveal?.result}
                     />
                 );
            })}
        </div>
    </div>
  );
};

export default TeamRow;