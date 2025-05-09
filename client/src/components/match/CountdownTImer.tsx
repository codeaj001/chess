import React, { useState, useEffect } from "react";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";

interface CountdownTimerProps {
  startTime: string;
  betsLocked: boolean;
  onBetsLocked?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  startTime,
  betsLocked,
  onBetsLocked,
}) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(betsLocked);

  useEffect(() => {
    const startDateTime = parseISO(startTime);

    const calculateTimeLeft = () => {
      const now = new Date();

      if (isPast(startDateTime)) {
        setTimeLeft("Match Started!");
        if (!isLocked) {
          setIsLocked(true);
          onBetsLocked?.();
        }
      } else {
        setTimeLeft(
          `Starts in ${formatDistanceToNow(startDateTime, {
            addSuffix: true,
          })}`
        );
      }
    };

    calculateTimeLeft(); // Calculate immediately

    const intervalId = setInterval(calculateTimeLeft, 1000); // Update every second

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [startTime, isLocked, onBetsLocked]);

  return (
    <div className="text-xs text-gray-400 mt-1 ml-2">
      {timeLeft}
    </div>
  );
};

export default CountdownTimer;
