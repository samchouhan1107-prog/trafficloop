<div align="center">

# TrafficLoop

**A Modern Traffic Exchange Platform**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)

</div>

---

## Overview

TrafficLoop is a full-stack traffic exchange platform where users earn credits by visiting websites and spend credits to drive traffic to their own campaigns. Built with modern web technologies for performance and reliability.

### Key Features

- **Traffic Exchange**: Earn credits by surfing campaigns, deploy campaigns to receive visitors
- **Real-time Analytics**: GA4 integration for tracking visitor engagement
- **Credit System**: Double-entry ledger with atomic transactions
- **Multi-URL Campaigns**: Support multiple destination URLs with rotation
- **Geo-Targeting**: Country-based traffic routing
- **Tri-Station Mode**: Multi-tab concurrent surfing
- **Daily Bonuses**: Loyalty rewards with streak multipliers
- **Payment Integration**: UPI, Bank Transfer, and card payments
- **Admin Console**: Campaign review, user management, platform settings

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Express.js, Node.js |
| Database | SQLite (better-sqlite3) |
| Authentication | Session tokens, bcryptjs |
| Analytics | Google Analytics 4 (Measurement Protocol) |
| Payments | UPI, Bank Transfer (manual verification) |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/trafficloop.git
cd trafficloop

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database (auto-runs on first start)
npm run dev
```

### Development

```bash
# Start development server
npm run dev

# Access the application
open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## Project Structure

```
trafficloop/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── services/           # API client and utilities
│   └── types.ts            # TypeScript type definitions
├── server/                 # Backend Express server
│   ├── database/           # SQLite schema and migrations
│   ├── middleware/          # Express middleware
│   ├── routes/             # API route handlers
│   └── services/           # Business logic services
├── data/                   # SQLite database files
├── assets/                 # Static assets
├── server.ts               # Main server entry point
├── vite.config.ts          # Vite configuration
└── package.json
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List user campaigns |
| POST | `/api/campaigns` | Create campaign |
| PATCH | `/api/campaigns/:id/toggle` | Pause/Resume |
| PATCH | `/api/campaigns/:id/settings` | Update settings |
| DELETE | `/api/campaigns/:id` | Delete campaign |

### Surf (Traffic Exchange)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/surf/status` | Pool availability |
| POST | `/api/surf/start` | Start surfing session |
| POST | `/api/surf/complete` | Complete session and earn |
| POST | `/api/surf/heartbeat` | Active dwell tracking |

### Credits and Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credits/valuation` | Credit value in fiat |
| GET | `/api/credits/history` | Transaction history |
| POST | `/api/credits/daily-bonus` | Claim daily bonus |
| GET | `/api/payments/packages` | Pricing packages |
| POST | `/api/payments/create-order` | Create payment order |

For complete API documentation, see [API.md](API.md).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret for session tokens |
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | Server port (default: 3000) |
| `DATABASE_PATH` | No | SQLite database path |
| `GA4_MEASUREMENT_ID` | No | Google Analytics 4 ID |
| `GA4_API_SECRET` | No | GA4 API secret |

---

## Security

- Passwords hashed with bcryptjs
- Session-based auth with sliding window renewal
- Rate limiting on sensitive endpoints
- CSRF protection via SameSite cookies
- Parameterized queries prevent SQL injection
- Secrets stored in environment variables

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with for the web traffic community**

</div>
