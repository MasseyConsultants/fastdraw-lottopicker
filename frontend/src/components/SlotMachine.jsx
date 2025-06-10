import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SlotMachine = ({ numbers, type }) => {
  const [displayNumbers, setDisplayNumbers] = useState([]);
  const [powerball, setPowerball] = useState(null);
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    if (!numbers) {
      console.error('Invalid numbers prop:', numbers);
      return;
    }

    console.log('SlotMachine received:', { numbers, type });

    // Reset state
    setIsSpinning(true);
    setDisplayNumbers([]);
    setPowerball(null);

    // Handle different data formats
    let regularNumbers = [];
    let powerballNumber = null;

    if (type === 'powerball') {
      if (typeof numbers === 'object' && numbers.RegularNumbers) {
        regularNumbers = numbers.RegularNumbers;
        powerballNumber = numbers.Powerball;
      } else if (Array.isArray(numbers)) {
        regularNumbers = numbers.slice(0, 5);
        powerballNumber = numbers[5];
      }
    } else {
      regularNumbers = Array.isArray(numbers) ? numbers : [];
    }

    console.log('Processed numbers:', { regularNumbers, powerballNumber });

    // Animate regular numbers
    regularNumbers.forEach((num, index) => {
      setTimeout(() => {
        setDisplayNumbers(prev => {
          const newNumbers = [...prev];
          newNumbers[index] = num;
          return newNumbers;
        });
      }, (index + 1) * 500);
    });

    // Animate powerball if present
    if (powerballNumber !== null) {
      setTimeout(() => {
        setPowerball(powerballNumber);
      }, (regularNumbers.length + 1) * 500);
    }

    // Stop spinning after all numbers are shown
    setTimeout(() => {
      setIsSpinning(false);
    }, (regularNumbers.length + (powerballNumber !== null ? 1 : 0)) * 500);
  }, [numbers, type]);

  const copyToClipboard = () => {
    if (!numbers) return;
    const numbersToCopy = Array.isArray(numbers) 
      ? numbers.join(', ')
      : [...(numbers.RegularNumbers || []), numbers.Powerball].join(', ');
    navigator.clipboard.writeText(numbersToCopy);
    alert('Numbers copied to clipboard!');
  };

  const downloadNumbers = () => {
    if (!numbers) return;
    const numbersToDownload = Array.isArray(numbers)
      ? numbers.join(', ')
      : [...(numbers.RegularNumbers || []), numbers.Powerball].join(', ');
    const blob = new Blob([numbersToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FastDraw_Lotto_Picker_${type}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!numbers) {
    return <div className="text-red-500">No numbers available</div>;
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-4">
        {/* Regular Numbers */}
        <div className="flex space-x-4">
          {displayNumbers.map((num, index) => (
            <motion.div
              key={index}
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: index * 0.1
              }}
              className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center rounded-full text-2xl font-bold shadow-lg
                ${isSpinning ? 'bg-gray-400' : 'bg-primary'}`}
              style={{ 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
              }}
            >
              {num || '?'}
            </motion.div>
          ))}
        </div>

        {/* Powerball Number with Label */}
        {type === 'powerball' && powerball && (
          <div className="flex flex-col items-center ml-4 pl-4 border-l-2 border-gray-300">
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.5
              }}
              className={`w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center rounded-full text-2xl font-bold shadow-lg
                ${isSpinning ? 'bg-gray-400' : 'bg-red-600'}`}
              style={{ 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
              }}
            >
              {powerball || '?'}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold whitespace-nowrap">
                Powerball
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <button 
          onClick={copyToClipboard} 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Copy Numbers
        </button>
        <button 
          onClick={downloadNumbers} 
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Download Numbers
        </button>
      </div>
    </div>
  );
};

export default SlotMachine; 