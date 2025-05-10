import LotteryNumber from './LotteryNumber';

function LotteryDraw({ numbers, isSpinning }) {
  return (
    <div className="flex flex-wrap gap-4 justify-center p-4 bg-white rounded-lg shadow-md">
      {numbers.map((number, index) => (
        <LotteryNumber
          key={index}
          number={number}
          isSpinning={isSpinning}
        />
      ))}
    </div>
  );
}

export default LotteryDraw; 