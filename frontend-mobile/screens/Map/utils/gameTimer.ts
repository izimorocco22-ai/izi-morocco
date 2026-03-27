import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { storage } from '../../../utils/storage';

/**
 * Converts game time format for display.
 * (Unchanged logic from original code)
 */
export const ConvertGameTime = (type: any, zoneTime: any, duration: any) => {
  switch (type) {
    case 'no_time_limit':
      return 'No time limit';

    case 'duration': {
      if (!duration || !duration.value) return 'N/A';
      const { unit, value } = duration;

      if (unit === 'minutes') {
        if (value >= 60) {
          const hours = Math.floor(value / 60);
          const minutes = value % 60;
          return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
        }
        return `${value} min`;
      }

      if (unit === 'hours') return `${value} hr`;
      if (unit === 'seconds') return `${Math.floor(value / 60)} min`;

      return `${value} ${unit}`;
    }

    case 'end_time': {
      const endTime = new Date(zoneTime);
      const now = new Date();
      const diffMs = endTime.getTime() - now.getTime();
      if (diffMs <= 0) return 'Expired';

      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      return hours > 0
        ? `${hours} hr ${minutes} min left`
        : `${minutes} min left`;
    }

    default:
      return 'N/A';
  }
};

/**
 * Custom hook to handle countdown timer with persistence
 * Returns [timeLeft, formattedTime, elapsedTime]
 */
export const useGameTimer = (game: any, gameId?: string, currentElapsedTime?: number, activeCode?: string) => {
  const timerKey = gameId && activeCode ? `${gameId}_${activeCode}` : gameId;
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(currentElapsedTime || 0);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  // Initialize timer based on game type and restore from storage if available
  useEffect(() => {
    const initializeTimer = async () => {
      let totalSeconds = 0;
      let storedTimer = null;

      // Try to get stored timer data if timerKey is provided
      if (timerKey) {
        storedTimer = await storage.getGameTimer(timerKey);
        console.log('Stored timer data:', storedTimer);
      }

      if (game?.game?.timeLimit === 'duration' && game?.game?.duration) {
        const { unit, value } = game.game.duration;
        if (unit === 'minutes') totalSeconds = value * 60;
        else if (unit === 'hours') totalSeconds = value * 3600;
        else if (unit === 'seconds') totalSeconds = value;

        console.log('Duration timer setup:', { unit, value, totalSeconds });

        if (storedTimer) {
          // Resume from stored elapsed time — do NOT add offline time (timer pauses when user exits)
          const remainingTime = Math.max(0, totalSeconds - storedTimer.elapsedTime);
          setElapsedTime(storedTimer.elapsedTime);
          setTimeLeft(remainingTime);
          setGameStartTime(storedTimer.startTime);
        } else {
          // Start fresh countdown
          const startTime = Date.now();
          const initialElapsed = currentElapsedTime || 0;
          const remainingTime = Math.max(0, totalSeconds - initialElapsed);
          
          console.log('Starting fresh countdown:', {
            totalSeconds,
            initialElapsed,
            remainingTime
          });
          
          setTimeLeft(remainingTime);
          setElapsedTime(initialElapsed);
          setGameStartTime(startTime);
          
          // Store initial timer data
          if (timerKey) {
            await storage.setGameTimer(timerKey, {
              startTime,
              elapsedTime: initialElapsed,
              lastUpdateTime: startTime,
              totalDuration: totalSeconds
            });
          }
        }
      } else if (game?.game?.timeLimit === 'end_time' && game?.game?.endTime) {
        const endTime = new Date(game.game.endTime).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(diff);
        setElapsedTime(currentElapsedTime || 0);
      } else {
        // No time limit - just track elapsed time
        setTimeLeft(null);
        if (storedTimer) {
          // Resume from stored elapsed time — do NOT add offline time (timer pauses when user exits)
          setElapsedTime(storedTimer.elapsedTime);
          setGameStartTime(storedTimer.startTime);
        } else {
          setElapsedTime(currentElapsedTime || 0);
          const startTime = Date.now();
          setGameStartTime(startTime);
          
          if (timerKey) {
            await storage.setGameTimer(timerKey, {
              startTime,
              elapsedTime: currentElapsedTime || 0,
              lastUpdateTime: startTime
            });
          }
        }
      }
    };

    initializeTimer();
  }, [game, gameId, currentElapsedTime]);

  // Update timer every second and persist to storage
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentTime = Date.now();
      
      setElapsedTime(prev => {
        const newElapsed = prev + 1;
        
        // Persist to storage every second to ensure no data loss
        if (timerKey) {
          storage.setGameTimer(timerKey, {
            startTime: gameStartTime || currentTime,
            elapsedTime: newElapsed,
            lastUpdateTime: currentTime
          });
        }
        
        return newElapsed;
      });

      if (timeLeft !== null) {
        setTimeLeft(prev => {
          if (prev && prev > 0) {
            return prev - 1;
          } else if (prev === 0) {
            Alert.alert('Time\'s up!', 'Your game time has ended.');
            return 0;
          }
          return prev;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, gameId, gameStartTime]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // For countdown timers, show time left; for no limit, show elapsed time
  const formattedTime = timeLeft !== null ? formatTime(timeLeft) : formatTime(elapsedTime);
  
  console.log('Timer display:', {
    timeLeft,
    elapsedTime,
    formattedTime,
    gameTimeLimit: game?.game?.timeLimit,
    isCountdown: timeLeft !== null
  });

  return [timeLeft, formattedTime, elapsedTime] as const;
};

/**
 * Clear timer data when game is completed
 */
export const clearGameTimer = async (gameId: string, activeCode?: string) => {
  const timerKey = activeCode ? `${gameId}_${activeCode}` : gameId;
  await storage.clearGameTimer(timerKey);
};