import React from 'react';
import { TeamStanding, RevealEvent } from '../types';
import TeamRow from './TeamRow';
import { ROW_HEIGHT } from '../constants';

interface RevealScreenProps {
  teams: TeamStanding[];
  problemsList: string[];
  onNext: () => void;
  onReset: () => void;
  onReconfigure: () => void;
  isFinished: boolean;
  lastReveal: RevealEvent | null;
}

const RevealScreen: React.FC<RevealScreenProps> = ({ teams, problemsList, onNext, onReset, onReconfigure, isFinished, lastReveal }) => {
  const [isAdvancing, setIsAdvancing] = React.useState(false);

  // Handle keyboard controls for advancing the reveal
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'ArrowRight' || event.key === ' ') && !isFinished && !isAdvancing) {
        event.preventDefault(); // Prevent page scroll
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, isFinished, isAdvancing]);
  
  // Prevent spamming the 'next' button
  React.useEffect(() => {
    if (lastReveal) {
      setIsAdvancing(true);
      const timer = setTimeout(() => setIsAdvancing(false), 1200); // Must be same duration as animation
      return () => clearTimeout(timer);
    }
  }, [lastReveal]);
  
  const leaderboardHeight = teams.length * ROW_HEIGHT;

  return (
    <div className="min-h-screen bg-contest-dark flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
        <header className="w-full max-w-7xl mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-contest-gold">Live Standings</h1>
            <div className="flex space-x-4">
                <button
                    onClick={onReconfigure}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors"
                    aria-label="Reconfigure CSV data"
                >
                    Reconfigure
                </button>
                <button
                    onClick={onReset}
                    className="px-4 py-2 bg-contest-gray text-white font-semibold rounded hover:bg-contest-dark-light transition-colors"
                >
                    Reset
                </button>
            </div>
        </header>

        <main className="w-full max-w-7xl flex-1">
             {/* Header Row */}
            <div className="flex items-center px-4 h-12 rounded-t-lg bg-black/30 text-contest-light-gray font-bold sticky top-0 z-30">
                <div className="w-12 text-center">#</div>
                <div className="flex-1 px-4">Team Name</div>
                <div className="w-24 text-center">Solved</div>
                <div className="w-24 text-center">Penalty</div>
                <div className="flex items-center justify-end space-x-2 pl-4">
                    {problemsList.map(p => <div key={p} className="w-20 text-center font-mono">{p}</div>)}
                </div>
            </div>

            {/* Leaderboard */}
            <div className="relative" style={{ height: `${leaderboardHeight}px` }}>
                {teams.map((team, index) => (
                    <TeamRow
                        key={team.id}
                        team={team}
                        rank={index + 1}
                        problemsList={problemsList}
                        lastReveal={lastReveal}
                    />
                ))}
            </div>
        </main>

        <footer className="w-full max-w-7xl mt-6">
            {isFinished ? (
                 <div className="text-center p-8 bg-contest-dark-light rounded-lg animate-fadeIn">
                    <h2 className="text-4xl font-bold text-contest-gold">CONTEST IS OVER!</h2>
                    <p className="text-xl mt-2 text-contest-light-gray">Congratulations to all teams!</p>
                 </div>
            ) : (
                <div className="text-center">
                    <button
                        onClick={onNext}
                        disabled={isAdvancing}
                        className="px-16 py-5 bg-contest-ac text-white font-bold text-2xl rounded-lg transform hover:scale-105 transition-transform duration-300 shadow-lg disabled:bg-contest-gray disabled:cursor-not-allowed"
                    >
                        NEXT
                    </button>
                    <p className="mt-4 text-sm text-contest-light-gray/80 animate-fadeIn" style={{ animationDelay: '500ms', opacity: 0}}>
                        or press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded-md shadow-sm">Space</kbd> or <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded-md shadow-sm">→</kbd> to advance
                    </p>
                </div>
            )}
        </footer>
    </div>
  );
};

export default RevealScreen;