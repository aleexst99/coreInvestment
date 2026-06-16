# 💰 Core Investment

Personal investment portfolio tracker — manage assets, contributions, and track performance over time.

## Features

- **Dashboard** — total invested, current value, return and portfolio evolution chart
- **Assets** — manage your investment assets (crypto, index funds, real estate, gold, stocks)
- **Investments** — log manual contributions per asset
- **Scheduled contributions** — automate recurring investments (weekly, biweekly, monthly, quarterly)
- **Real estate** — track fixed-interest projects with automatic value calculation

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) — auth + database
- [Zustand](https://zustand-demo.pmnd.rs/) — global state management
- [Recharts](https://recharts.org/) — charts

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/aleexst99/coreInvestment.git
cd coreInvestment
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the app

```bash
npm run dev
```

## Roadmap

- [ ] Real-time crypto prices via CoinGecko API
- [ ] Real-time gold prices via metals API
- [ ] Portfolio evolution chart with invested vs current value comparison
- [ ] Multi-currency support
- [ ] Export data to CSV/PDF
- [ ] Mobile responsive design
- [ ] Push notifications for scheduled contributions
- [ ] Multiple portfolios per user

## Deployment

The app is deployed on [Vercel](https://vercel.com) and available at [coreinvestment.eu](https://www.coreinvestment.eu).

Every push to `main` triggers an automatic deployment.
