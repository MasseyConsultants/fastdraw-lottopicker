import { useState, useEffect } from 'react';

function LotteryNumber({ number, isSpinning }) {
  const [displayNumber, setDisplayNumber] = useState('?');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isSpinning) {
      setIsAnimating(true);
      const interval = setInterval(() => {
        setDisplayNumber(Math.floor(Math.random() * 54) + 1);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setDisplayNumber(number);
        setIsAnimating(false);
      }, 2000);

      return () => clearInterval(interval);
    } else {
      setDisplayNumber(number);
    }
  }, [number, isSpinning]);

  return (
    <div className={`
      w-16 h-16 rounded-full flex items-center justify-center
      text-2xl font-bold text-white
      ${isAnimating ? 'animate-spin-slow bg-accent' : 'bg-primary'}
      transition-all duration-300
    `}>
      {displayNumber}
    </div>
  );
}

export default LotteryNumber; 