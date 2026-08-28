# Cryptocurrency Price Tracker

A simple cryptocurrency price tracker built with React.

The application fetches live cryptocurrency market data from the Kraken Public API and displays current prices and market information.

## Features

- Live cryptocurrency prices
- Bitcoin, Ethereum, Solana, and Cardano support
- Current cryptocurrency price
- 24-hour high price
- 24-hour low price
- 24-hour trading volume
- Real-time cryptocurrency search
- Manual price refresh
- Automatic refresh every 30 seconds
- Last updated time
- Loading state
- Error handling
- Responsive design

## Technologies

- React
- JavaScript
- HTML
- CSS
- Kraken Public REST API
- Fetch API

## React Concepts Used

This project demonstrates several React concepts, including:

- Components
- Props
- `useState`
- `useEffect`
- `useCallback`
- Event handling
- Conditional rendering
- Rendering lists with `map()`
- Filtering data
- API requests
- `async / await`
- `Promise.all()`
- Effect cleanup
- `setInterval()`
- `clearInterval()`

## Project Structure

```text
src/
├── components/
│   ├── CryptoCard.js
│   ├── CryptoList.js
│   └── SearchBar.js
│
├── services/
│   └── cryptoApi.js
│
├── utils/
│   ├── formatNumber.js
│   └── formatPrice.js
│
├── App.css
├── App.js
├── index.css
└── index.js
```

## API

Market data is provided by the Kraken Public REST API.

The application uses Kraken's public Ticker endpoint to retrieve cryptocurrency market data.

No API key is required for the public market data used in this project.

The application currently tracks:

- BTC / USD
- ETH / USD
- SOL / USD
- ADA / USD

## Installation

Clone the repository:

```bash
git clone https://github.com/mohadesehesmaeilzadeh/crypto-price-tracker.git
```

Open the project directory:

```bash
cd crypto-price-tracker
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## Available Scripts

### Start Development Server

```bash
npm start
```

Runs the application in development mode.

### Production Build

```bash
npm run build
```

Creates an optimized production build of the application.

## How It Works

When the application loads, it requests cryptocurrency market data from the Kraken Public API.

The basic data flow is:

```text
App
 ↓
useEffect
 ↓
loadCryptoPrices()
 ↓
getTicker()
 ↓
Kraken Public API
 ↓
JSON Response
 ↓
React State
 ↓
CryptoList
 ↓
CryptoCard
```

Cryptocurrency prices are automatically refreshed every 30 seconds.

Users can also manually refresh prices using the `Refresh Prices` button.

## Search

The search field allows cryptocurrencies to be filtered by either their name or symbol.

Examples:

```text
Bitcoin
BTC
Ethereum
ETH
Solana
SOL
Cardano
ADA
```

Search results are updated immediately while the user types.

## Price Information

Each cryptocurrency card displays:

- Cryptocurrency name
- Symbol
- Current price
- 24-hour high
- 24-hour low
- 24-hour trading volume

Price and number formatting are handled by reusable utility functions.

## Auto Refresh

Cryptocurrency prices automatically refresh every 30 seconds using `setInterval()`.

The interval is cleaned up when the React component unmounts using `clearInterval()`.

This prevents unnecessary timers from continuing to run in the background.

## Error Handling

The application handles:

- HTTP request errors
- Kraken API errors
- Missing API results
- Loading states
- Refresh errors

If the initial request fails, the user can retry the request using the `Try Again` button.

## Responsive Design

The interface is responsive and supports:

- Desktop
- Tablet
- Mobile

Cryptocurrency cards are displayed in a two-column layout on larger screens and switch to a single-column layout on smaller screens.

## Repository

You can view the complete source code of this project on GitHub:

[Crypto Price Tracker - GitHub Repository](https://github.com/mohadesehesmaeilzadeh/crypto-price-tracker)

## Author

Developed as a React practice project.
