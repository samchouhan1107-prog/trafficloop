# TrafficLoop API Documentation

Base URL: `http://localhost:3000`

## Authentication

All protected endpoints require either:
- `Authorization: Bearer <session_token>` header
- `trafficloop_token` cookie

---

## System

### GET /api/health
Health check endpoint.
**Response:** `{ status, timestamp, uptimeSeconds, database, memory, services }`

### GET /api/system/public-stats
Public platform statistics.
**Response:** `{ totalUsers, activeCampaigns, totalVisitsCompleted, visitsToday, totalCreditsExchanged }`

---

## Authentication

### GET /api/auth/signup-pin
Get a 6-digit security PIN for signup.
**Response:** `{ pin, pinToken, expiresAt }`

### POST /api/auth/register
Register a new user.
**Body:** `{ email, password, name, location?, preferredCurrency?, pin, pinToken }`
**Response:** `{ message, token, user }`

### POST /api/auth/login
Login user.
**Body:** `{ email, password }`
**Response:** `{ message, token, user }`

### GET /api/auth/me
Get current authenticated user. **Requires auth.**
**Response:** `{ user }`

### POST /api/auth/refresh
Refresh session token. **Requires auth.**
**Response:** `{ success, token, expiresAt, user }`

### PUT /api/auth/profile
Update user profile. **Requires auth.**
**Body:** `{ name?, location?, preferredCurrency? }`
**Response:** `{ message, user }`

### POST /api/auth/logout
Logout and destroy session. **Requires auth.**
**Response:** `{ message }`

### POST /api/auth/change-password
Change password. **Requires auth.**
**Body:** `{ currentPassword, newPassword }`
**Response:** `{ message }`

### POST /api/auth/heartbeat
Keep session active. **Requires auth.**
**Response:** `{ status, last_active_at }`

---

## Campaigns

### GET /api/campaigns
List user's campaigns. **Requires auth.**
**Response:** `{ campaigns[] }`

### GET /api/campaigns/active
Get active campaign pool. **Requires auth.**
**Response:** `{ campaigns[], total, eligibleTotal, poolVersion }`

### POST /api/campaigns
Create new campaign. **Requires auth.**
**Body:** `{ title, url, durationSeconds?, budget, category?, dailyVisitLimit?, targetLocations?, deviceTargeting?, ga4MeasurementId?, ga4ApiSecret?, interactiveClicksEnabled? }`
**Response:** `{ message, campaign, reviewStatus }`

### POST /api/campaigns/pre-validate
Pre-validate a URL before submission. **Requires auth.**
**Body:** `{ url, title?, campaignId? }`
**Response:** `{ score, passed, checks, suggestedStatus, rejectionReason? }`

### GET /api/campaigns/:id
Get campaign details. **Requires auth.**
**Response:** `{ campaign, metrics, recent_visits, review }`

### PATCH /api/campaigns/:id/toggle
Toggle campaign status (active/paused/test). **Requires auth.**
**Response:** `{ message, status }`

### POST /api/campaigns/:id/transition-status
Explicitly set campaign status. **Requires auth.**
**Body:** `{ status: 'active' | 'paused' | 'test' }`
**Response:** `{ message, campaign }`

### PATCH /api/campaigns/:id/settings
Update campaign settings. **Requires auth.**
**Body:** `{ title?, url?, urls?, targetLocations?, deviceTargeting?, category?, dailyVisitLimit?, durationSeconds?, ga4MeasurementId?, ga4ApiSecret?, interactiveClicksEnabled?, autoProgress?, status? }`
**Response:** `{ message, campaign }`

### POST /api/campaigns/:id/budget
Add credits to campaign budget. **Requires auth.**
**Body:** `{ amount }`
**Response:** `{ message, newBudget, status }`

### DELETE /api/campaigns/:id
Delete campaign and refund unspent credits. **Requires auth.**
**Response:** `{ message }`

### POST /api/campaigns/:id/dispatch-traffic
Manually dispatch traffic to campaign. **Requires auth.**
**Body:** `{ count? }`
**Response:** `{ success, visitsDelivered, creditsSpent, remainingBudget, message }`

### GET /api/campaigns/:id/verify-routing
Verify campaign routing configuration. **Requires auth.**
**Response:** `{ campaignId, url, routingMode, geoProfile, simulatedRouting, analytics, urlCheck, throttling, systemHealth }`

---

## Surf (Traffic Exchange)

### GET /api/surf/status
Get surf pool status. **Requires auth.**
**Response:** `{ hasCampaigns, totalAvailableInPool, userCredits, todayVisitsMade }`

### POST /api/surf/start
Start a surf session. **Requires auth.**
**Body:** `{ preferredCampaignId? }`
**Response:** `SurfSessionPayload`

### POST /api/surf/complete
Complete surf session and earn credits. **Requires auth.**
**Body:** `{ sessionToken, challengeAnswer, clientDwellSeconds? }`
**Response:** `SurfCompleteResult`

### POST /api/surf/register-click
Register a visitor click on surfed webpage. **Requires auth.**
**Body:** `{ sessionToken, clickType?, linkUrl?, linkText? }`
**Response:** `{ success, clicksCount, bonusCredits, totalCreditsEarned, message }`

### POST /api/surf/heartbeat
Record active/background dwell time. **Requires auth.**
**Body:** `{ sessionToken, isVisible, isFocused }`
**Response:** `{ success, activeDwellSeconds, backgroundDwellSeconds, requiredSeconds, isEligible }`

### GET /api/surf/inspect-url
Check URL availability and iframe compatibility. **Requires auth.**
**Query:** `url`, `campaignId?`
**Response:** `{ campaignId, url, isAvailable, httpStatus, responseTimeMs, canEmbedInIframe, healthStatus }`

### GET /api/surf/engine-diagnostics
Get engine metrics. **Requires auth.**
**Response:** `SurfEngineDiagnostics`

---

## Credits

### GET /api/credits/market-rates
Get current market exchange rates. **Public.**
**Response:** `MarketRates`

### POST /api/credits/convert
Convert between currencies. **Public.**
**Body:** `{ amount, from, to }`
**Response:** conversion result

### GET /api/credits/valuation
Get user's credit valuation. **Requires auth.**
**Response:** `CreditValuation`

### GET /api/credits/history
Get transaction history. **Requires auth.**
**Query:** `limit?`, `offset?`
**Response:** `{ transactions[], total, currentBalance, valuation }`

### GET /api/credits/daily-bonus/status
Check daily bonus eligibility. **Requires auth.**
**Response:** `{ eligible, bonusAmount, streakDays, secondsRemaining, bonusOptions[] }`

### POST /api/credits/daily-bonus
Claim daily bonus. **Requires auth.**
**Body:** `{ optionId? }`
**Response:** `{ success, creditsAdded, message, newBalance }`

### POST /api/credits/transfer
Transfer credits to another user. **Requires auth.**
**Body:** `{ recipientEmail, amount, note? }`
**Response:** `{ message, newBalance }`

---

## Payments

### GET /api/payments/packages
Get credit packages and bank details. **Requires auth.**
**Response:** `{ packages[], bankDetails }`

### GET /api/payments/bank-details
Get bank account info. **Requires auth.**
**Response:** bank details object

### POST /api/payments/create-order
Create a deposit order. **Requires auth.**
**Body:** `{ packageId?, customCredits?, paymentMethod?, currency? }`
**Response:** `{ message, order, bankDetails, upiData }`

### POST /api/payments/orders/:id/quick-upi-verify
Submit UPI transaction for instant verification. **Requires auth.**
**Body:** `{ utrNumber, payerUpiId?, payerName? }`
**Response:** `{ message, order, newBalance }`

### POST /api/payments/orders/:id/submit-proof
Submit bank transfer proof. **Requires auth.**
**Body:** `{ proofReference?, proofNotes? }`
**Response:** `{ message, order }`

### POST /api/payments/orders/:id/instant-checkout
Process instant card payment. **Requires auth.**
**Response:** `{ message, order, newBalance }`

### GET /api/payments/my-orders
List user's payment orders. **Requires auth.**
**Response:** `{ orders[] }`

---

## Rewards

### GET /api/rewards/summary
Get rewards summary. **Public.**
**Response:** rewards summary

### GET /api/rewards/activity
Get rewards activity. **Requires auth.**
**Response:** rewards activity data

### GET /api/rewards/eligibility
Check reward eligibility. **Requires auth.**
**Response:** eligibility status

### POST /api/rewards/claim
Claim a reward. **Requires auth.**
**Response:** claim result

---

## Notifications

### GET /api/notifications
Get user notifications. **Requires auth.**
**Response:** `{ notifications[] }`

### PATCH /api/notifications/:id/read
Mark notification as read. **Requires auth.**
**Response:** `{ success }`

### POST /api/notifications/mark-all-read
Mark all notifications as read. **Requires auth.**
**Response:** `{ success }`

---

## Admin

### GET /api/admin/users
List all users. **Requires admin auth.**
**Response:** `{ users[] }`

### PATCH /api/admin/users/:id/status
Update user status. **Requires admin auth.**
**Body:** `{ status }`
**Response:** `{ message }`

### GET /api/admin/campaigns
List all campaigns. **Requires admin auth.**
**Response:** `{ campaigns[] }`

### PATCH /api/admin/campaigns/:id/review
Review/approve/reject campaign. **Requires admin auth.**
**Body:** `{ status, rejectionReason? }`
**Response:** `{ message }`

### GET /api/admin/stats
Get platform statistics. **Requires admin auth.**
**Response:** admin stats

---

## Error Responses

All error responses follow:
```json
{
  "error": "Error message describing the issue"
}
```

HTTP Status Codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
