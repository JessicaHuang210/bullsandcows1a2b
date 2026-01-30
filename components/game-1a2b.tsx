'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trash2, RefreshCcw, Sparkles, Heart, Settings, BookOpen } from 'lucide-react';

interface GuessRecord {
  id: string;
  guess: string;
  a: number;
  b: number;
}

interface Theme {
  name: string;
  id: string;
  background: string;
  foreground: string;
  card: string;
  primary: string;
  secondary: string;
  muted: string;
  border: string;
}

const THEMES: Theme[] = [
  {
    name: 'Theme 1',
    id: 'theme1',
    background: '#271539',
    foreground: '#ffffff',
    card: '#3d1f52',
    primary: '#e783b5',
    secondary: '#c2649b',
    muted: '#501f5a',
    border: '#4a2a5f',
  },
  {
    name: 'Theme 2',
    id: 'theme2',
    background: '#271539',
    foreground: '#ffffff',
    card: '#3d1f52',
    primary: '#e78184',
    secondary: '#c2649b',
    muted: '#501f5a',
    border: '#4a2a5f',
  },
  {
    name: 'Theme 3',
    id: 'theme3',
    background: '#8b6fa3',
    foreground: '#ffffff',
    card: '#a084b8',
    primary: '#f5a962',
    secondary: '#f4d86d',
    muted: '#9e7fb0',
    border: '#966db3',
  },
];

const Game1A2B = () => {
  const [secret, setSecret] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [history, setHistory] = useState<GuessRecord[]>([]);
  const [gameWon, setGameWon] = useState(false);
  const [error, setError] = useState<string>('');
  const [showWiggle, setShowWiggle] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[1]);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const [crossedOutDigits, setCrossedOutDigits] = useState<Set<number>>(new Set());
  const historyContainerRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const notebookMenuRef = useRef<HTMLDivElement>(null);

  // Generate a random 4-digit secret code with unique digits
  const generateSecret = () => {
    const digits = Array.from({ length: 10 }, (_, i) => i);
    const shuffled = digits.sort(() => Math.random() - 0.5);
    const newSecret = shuffled.slice(0, 4).join('');
    setSecret(newSecret);
    setHistory([]);
    setGameWon(false);
    setInput('');
    setError('');
    setCrossedOutDigits(new Set());
  };

  // Initialize game on mount
  useEffect(() => {
    generateSecret();
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      const theme = THEMES.find((t) => t.id === savedTheme);
      if (theme) setCurrentTheme(theme);
    }
  }, []);

  // Handle theme change
  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('selectedTheme', theme.id);
    setShowThemeMenu(false);
    // Apply theme to document
    document.documentElement.style.setProperty('--background', theme.background);
    document.documentElement.style.setProperty('--foreground', theme.foreground);
    document.documentElement.style.setProperty('--card', theme.card);
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--secondary', theme.secondary);
    document.documentElement.style.setProperty('--muted', theme.muted);
    document.documentElement.style.setProperty('--border', theme.border);
  };

  // Close theme menu and notebook when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
      if (notebookMenuRef.current && !notebookMenuRef.current.contains(event.target as Node)) {
        setShowNotebook(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll to top when history updates (newest is at top)
  useEffect(() => {
    if (historyContainerRef.current) {
      historyContainerRef.current.scrollTop = 0;
    }
  }, [history]);

  // Calculate A (correct position) and B (correct digit, wrong position)
  const calculateResult = (guess: string, secretCode: string) => {
    let a = 0;
    let b = 0;

    for (let i = 0; i < 4; i++) {
      if (guess[i] === secretCode[i]) {
        a++;
      } else if (secretCode.includes(guess[i])) {
        b++;
      }
    }

    return { a, b };
  };

  // Validate input
  const isValidGuess = (value: string): boolean => {
    if (value.length !== 4) return false;
    if (!/^\d+$/.test(value)) return false;
    const digits = new Set(value);
    return digits.size === 4; // All digits must be unique
  };

  // Handle guess submission
  const handleGuess = () => {
    setError('');

    if (!isValidGuess(input)) {
      setError('Enter 4 unique digits (0-9)');
      setShowWiggle(true);
      setTimeout(() => setShowWiggle(false), 500);
      return;
    }

    const { a, b } = calculateResult(input, secret);
    const newRecord: GuessRecord = {
      id: Date.now().toString(),
      guess: input,
      a,
      b,
    };

    setHistory([...history, newRecord]);
    setInput('');

    if (a === 4) {
      setGameWon(true);
    }
  };

  // Handle number button click
  const handleNumberClick = (num: string) => {
    if (input.length < 4 && !input.includes(num)) {
      setInput(input + num);
      setError('');
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    setInput(input.slice(0, -1));
  };

  // Handle global keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameWon) return;

      const key = e.key;

      if (/^\d$/.test(key)) {
        e.preventDefault();
        handleNumberClick(key);
      } else if (key === 'Enter') {
        e.preventDefault();
        handleGuess();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, gameWon, history, secret, currentTheme]); // Include dependencies used in handlers

  return (
    <div
      className="fixed inset-0 w-full h-full flex justify-center items-center overflow-hidden"
      style={{
        backgroundColor: currentTheme.background,
      }}
    >
      <div
        className="w-full max-w-md h-full flex flex-col relative overflow-hidden shadow-2xl safe-area-inset transition-colors duration-300"
        style={{
          backgroundColor: 'transparent',
        }}
      >
        <div
          className="flex z-30 w-full justify-between items-center px-4 py-2 relative"
          style={{
            backgroundColor: currentTheme.card,
            borderBottom: `1px solid ${currentTheme.border}`,
            boxShadow: `0 4px 20px ${currentTheme.primary}10`,
          }}
        >
          {/* Reset Button - Top Left */}
          <button
            onClick={(e) => {
              generateSecret();
              e.currentTarget.blur();
            }}
            disabled={gameWon}
            className="cursor-pointer p-3 rounded-full transition-all duration-200 z-10 text-white hover:scale-110 active:scale-95 shadow-lg"
            style={{ backgroundColor: currentTheme.primary }}
            title="New Game"
          >
            <RefreshCcw size={24} className={`${gameWon ? 'opacity-50' : ''}`} />
          </button>

          {/* Settings Section */}
          <div className="flex gap-2">
            {/* Notebook Button */}
            <div className="relative" ref={notebookMenuRef}>
              <button
                onClick={() => setShowNotebook(!showNotebook)}
                className="cursor-pointer p-3 rounded-full transition-all duration-200 text-white hover:scale-110 active:scale-95"
                style={{ backgroundColor: currentTheme.primary }}
                title="Notebook"
              >
                <BookOpen size={24} />
              </button>
              {/* Notebook Menu */}
              {showNotebook && (
                <div
                  className="absolute right-0 mt-2 rounded-[12px] shadow-lg overflow-hidden z-20 p-4"
                  style={{
                    backgroundColor: currentTheme.card,
                    boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px ${currentTheme.border}`,
                    minWidth: '200px',
                  }}
                >
                  <div className="text-center mb-3">
                    <p className="text-sm font-bold" style={{ color: currentTheme.foreground }}>
                      Mark eliminated digits
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => {
                      const isCrossedOut = crossedOutDigits.has(digit);
                      return (
                        <button
                          key={digit}
                          onClick={() => {
                            const newSet = new Set(crossedOutDigits);
                            if (isCrossedOut) {
                              newSet.delete(digit);
                            } else {
                              newSet.add(digit);
                            }
                            setCrossedOutDigits(newSet);
                          }}
                          className="w-8 h-8 rounded-[8px] font-bold text-sm transition-all hover:scale-105 active:scale-95"
                          style={{
                            backgroundColor: isCrossedOut ? currentTheme.muted : currentTheme.primary,
                            color: currentTheme.foreground,
                            textDecoration: isCrossedOut ? 'line-through' : 'none',
                            opacity: isCrossedOut ? 0.5 : 1,
                          }}
                        >
                          {digit}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCrossedOutDigits(new Set())}
                    className="w-full mt-3 py-2 rounded-[8px] text-xs font-semibold transition-all hover:opacity-80"
                    style={{
                      backgroundColor: currentTheme.secondary,
                      color: currentTheme.foreground,
                    }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Theme Settings Button */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="cursor-pointer p-3 rounded-full transition-all duration-200 text-white hover:scale-110 active:scale-95"
                style={{ backgroundColor: currentTheme.primary }}
                title="Theme Settings"
              >
                <Settings size={24} />
              </button>
              {/* Theme Menu */}
              {showThemeMenu && (
                <div
                  className="absolute right-0 mt-2 rounded-[8px] shadow-lg overflow-hidden z-20"
                  style={{
                    backgroundColor: currentTheme.card,
                    boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px ${currentTheme.border}`,
                    minWidth: '160px',
                  }}
                >
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme)}
                      className="w-full px-4 py-3 text-left text-sm font-semibold transition-all hover:opacity-80 flex items-center justify-between"
                      style={{
                        color: currentTheme.foreground,
                        backgroundColor:
                          currentTheme.id === theme.id ? currentTheme.primary : 'transparent',
                      }}
                    >
                      {theme.name}
                      {currentTheme.id === theme.id && <span className="text-lg">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Victory Celebration Modal */}
        {gameWon && (
          <div className="absolute inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
            <div
              className="rounded-[2rem] p-8 text-center shadow-2xl max-w-sm w-full animate-bounce-once"
              style={{
                backgroundColor: currentTheme.card,
                boxShadow: `0 20px 60px rgba(0, 0, 0, 0.3), inset -5px -5px 15px ${currentTheme.primary}30, inset 5px 5px 15px ${currentTheme.secondary}20`,
                color: currentTheme.foreground,
              }}
            >
              <div className="text-5xl mb-4">🎉 ✨</div>
              <h2 className="text-3xl font-bold mb-2">You Won!</h2>
              <p className="text-lg mb-2">
                Secret:{' '}
                <span
                  className="font-bold text-xl font-mono"
                  style={{ color: currentTheme.primary }}
                >
                  {secret}
                </span>
              </p>
              <p className="mb-6">
                Guesses:{' '}
                <span className="font-bold text-xl" style={{ color: currentTheme.primary }}>
                  {history.length}
                </span>
              </p>
              <button
                onClick={generateSecret}
                className="w-full px-6 py-3 text-white rounded-[8px] font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                style={{ backgroundColor: currentTheme.primary }}
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* History Section - Scrollable */}
        <div
          className="flex-1 overflow-y-auto min-h-0 p-4 relative z-10"
          ref={historyContainerRef}
          style={{
            borderRight: 'none',
          }}
        >
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div style={{ color: '#ffffff' }}>
                <p className="text-lg font-semibold mb-2">No guesses yet</p>
                <p className="text-sm">Enter 4 unique digits to start</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {[...history].reverse().map((record, index) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-[12px] border hover:border-opacity-100 transition-all"
                  style={{
                    backgroundColor: currentTheme.card,
                    borderColor: currentTheme.border,
                    boxShadow: `0 2px 8px ${currentTheme.primary}30`,
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span
                      className="font-bold text-xs w-6 text-center"
                      style={{ color: currentTheme.muted }}
                    >
                      #{history.length - index}
                    </span>
                    <span
                      className="text-lg font-bold font-mono tracking-wider"
                      style={{ color: currentTheme.foreground }}
                    >
                      {record.guess}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {record.a > 0 && (
                      <div
                        className="px-2.5 py-1.5 rounded-[8px] text-white text-xs font-bold flex items-center gap-0.5 shadow-md"
                        style={{ backgroundColor: currentTheme.primary }}
                      >
                        <Heart size={12} className="fill-current" />
                        <span>{record.a}A</span>
                      </div>
                    )}
                    {record.b > 0 && (
                      <div
                        className="px-2.5 py-1.5 rounded-[8px] text-white text-xs font-bold flex items-center gap-0.5 shadow-md"
                        style={{ backgroundColor: currentTheme.secondary }}
                      >
                        <Sparkles size={12} />
                        <span>{record.b}B</span>
                      </div>
                    )}
                    {record.a === 0 && record.b === 0 && (
                      <span
                        className="px-2.5 py-1.5 rounded-[8px] text-xs font-bold"
                        style={{
                          backgroundColor: currentTheme.muted,
                          color: currentTheme.foreground,
                        }}
                      >
                        None
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Section - Input & Keyboard */}
        <div
          className="flex-shrink-0 rounded-t-[24px] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative z-20"
          style={{
            backgroundColor: currentTheme.card,
            borderTop: `1px solid ${currentTheme.border}`,
            boxShadow: `0 -10px 40px ${currentTheme.primary}20, inset -3px -3px 10px ${currentTheme.secondary}10`,
          }}
        >
          {/* Input Display */}
          <div className="mb-4">
            <div className="flex justify-center gap-2 mb-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="w-14 h-14 rounded-[12px] border-2 flex items-center justify-center text-2xl font-bold transition-all"
                  style={{
                    backgroundColor: currentTheme.background,
                    borderColor: `${currentTheme.primary}80`,
                    color: currentTheme.primary,
                    boxShadow: `0 4px 12px ${currentTheme.primary}20`,
                  }}
                >
                  {input[idx] || '-'}
                </div>
              ))}
            </div>

            {/* Error Message */}
            <div className="h-4 flex items-center justify-center">
              {error && (
                <p
                  className={`text-center text-xs font-semibold animate-pulse ${showWiggle ? 'animate-wiggle' : ''}`}
                  style={{ color: '#ff5555' }}
                >
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Number Keyboard */}
          <div className="mb-3">
            <div className="grid grid-cols-5 gap-2 mb-2">
              {['1', '2', '3', '4', '5'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  disabled={gameWon || input.length >= 4 || input.includes(num)}
                  className={`py-3 rounded-[12px] font-bold text-lg transition-all duration-200 text-white ${gameWon || input.length >= 4 || input.includes(num)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
                    }`}
                  style={{
                    background:
                      gameWon || input.length >= 4 || input.includes(num)
                        ? currentTheme.muted
                        : `linear-gradient(to bottom, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {['6', '7', '8', '9', '0'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  disabled={gameWon || input.length >= 4 || input.includes(num)}
                  className={`py-3 rounded-[12px] font-bold text-lg transition-all duration-200 text-white ${gameWon || input.length >= 4 || input.includes(num)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
                    }`}
                  style={{
                    background:
                      gameWon || input.length >= 4 || input.includes(num)
                        ? currentTheme.muted
                        : `linear-gradient(to bottom, ${currentTheme.secondary}, ${currentTheme.secondary}cc)`,
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleBackspace}
              disabled={gameWon || input.length === 0}
              className={`py-3 rounded-[12px] font-bold text-white transition-all duration-200 flex items-center justify-center ${gameWon || input.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95 shadow-md'
                }`}
              style={{ backgroundColor: currentTheme.secondary }}
              title="Delete"
            >
              <Trash2 size={24} />
            </button>
            <button
              onClick={handleGuess}
              disabled={gameWon || input.length !== 4}
              className={`py-3 rounded-[12px] font-bold text-white transition-all duration-200 flex items-center justify-center ${gameWon || input.length !== 4
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
                }`}
              style={{
                background:
                  gameWon || input.length !== 4
                    ? currentTheme.muted
                    : `linear-gradient(to bottom, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
              }}
              title="Submit"
            >
              <span className="text-2xl">✓</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes bounce-once {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-30px); }
          60% { transform: translateY(-15px); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out;
        }
        .animate-bounce-once {
          animation: bounce-once 1s ease-in-out;
        }
        .safe-area-inset {
          padding-top: max(1rem, env(safe-area-inset-top));
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(114, 195, 232, 0.3);
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(114, 195, 232, 0.5);
        }
      `}</style>
    </div>
  );
};

export default Game1A2B;
