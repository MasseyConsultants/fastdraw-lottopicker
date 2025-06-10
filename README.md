# FastDraw LottoPicker

A web application for analyzing Texas Lottery historical data and generating optimized number picks.

## Features

- Analyze historical lottery data (Lotto Texas and Powerball)
- Generate picks based on frequency analysis
- AI-generated picks (coming soon)
- Store picks in CSV format
- Display results with slot machine animations

## Project Structure

```
fastdraw-lottopicker/
├── backend/
│   ├── src/
│   │   ├── agents/        # AutoGen agent definitions
│   │   ├── routes/        # API endpoints
│   │   └── services/      # Business logic
│   ├── lottery-data/      # CSV data files
│   └── .env               # Environment variables
└── frontend/               # React frontend
    ├── dist/              # Production build output
    ├── public/            # Static assets
    ├── src/               # Source code
    │   ├── App.jsx        # Main app component
    │   ├── main.jsx       # Entry point
    │   ├── index.css      # Global styles
    │   └── components/    # React components
    │       ├── AnalyticsDashboard.jsx
    │       ├── SlotMachine.jsx
    │       ├── LotteryDraw.jsx
    │       └── LotteryNumber.jsx
    ├── package.json       # Frontend dependencies
    └── ...
```

**Note:** The frontend is now implemented! New features and improvements are coming soon, including enhanced analytics and AI-powered number picks.

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fastdraw-lottopicker.git
   cd fastdraw-lottopicker
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API keys and configuration.

4. Start the backend server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /api/lottery/picks?draws=5&game=lotto`
  - Generates frequency-based picks
  - Parameters:
    - `draws`: Number of draws (default: 5)
    - `game`: Game type ('lotto' or 'powerball')

- `GET /api/lottery/ai-picks?draws=5&game=lotto`
  - Generates AI-based picks (coming soon)
  - Same parameters as above

## Development

- Backend uses Node.js with Express
- Frontend uses React with Tailwind CSS
- CSV files store historical data and generated picks
- CORS enabled for local development

## License

MIT 