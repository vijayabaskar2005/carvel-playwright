# Carvel GTF – Playwright Automation Framework & E2E Smoke Testing

## Project Purpose & Overview
This repository contains an industry-standard Playwright + TypeScript automation framework designed for the **Carvel** web application (`https://car.uat.focusbrands.com/`) used by **GoTo Foods (GTF)**.

The framework supports **E2E Smoke Testing** and is structured to scale for future regression suites.

---

## Primary E2E Smoke Test Journey
The primary smoke test validates the end-to-end customer order journey:

```text
Carvel Homepage (https://car.uat.focusbrands.com/)
    ↓
Sign In (Read securely from .env if credentials provided)
    ↓
Start Order
    ↓
Select Pickup
    ↓
Search & Select Store: Carvel Qu Sandbox (26 Broadway, New York, NY 10004)
    ↓
Select Pickup Later
    ↓
Dynamically Select Available Future Date
    ↓
Dynamically Select Available Pickup Time
    ↓
Navigate Menu & Category (Ice Cream)
    ↓
Select Product (SCOOPED ICE CREAM)
    ↓
Customization on PDP (Size & Flavor)
    ↓
Add to Cart
    ↓
Verify Cart & Order Summary
    ↓
Stop before payment / place order
```

> **Note**: In compliance with automation guidelines, tests stop before submitting payment or placing real orders.

---

## Technology Stack
- **Node.js**: v20+
- **TypeScript**: Static typing & object-oriented POM design
- **Playwright Test**: Cross-browser E2E testing framework
- **Dotenv**: Secure environment variable management
- **Git & GitHub Actions**: Branch workflow and CI/CD test execution

---

## Project Structure

```text
carvel-playwright/
│
├── tests/
│   └── smoke/
│       ├── homepage.smoke.spec.ts         # Homepage load & header check
│       ├── authentication.smoke.spec.ts   # Login page & authentication flow
│       ├── navigation.smoke.spec.ts       # Navigation & Start Order trigger
│       ├── pickupLater.smoke.spec.ts      # Store selection & Pickup Later scheduling
│       ├── menu.smoke.spec.ts             # Menu category & PLP verification
│       ├── product.smoke.spec.ts          # PDP customization & radio selections
│       ├── cart.smoke.spec.ts             # Cart state & item validation
│       └── orderJourney.smoke.spec.ts     # Primary E2E Pickup Later Smoke Journey
│
├── pages/
│   ├── Header.ts                          # Top navigation header elements
│   ├── HomePage.ts                        # Carvel landing page
│   ├── LoginPage.ts                       # Sign in / authentication page
│   ├── StoreLocatorPage.ts                # Store search & store card selection
│   ├── OrderTypePage.ts                   # Pickup vs Delivery toggle
│   ├── PickupPage.ts                      # Pickup Later date/time scheduling modal
│   ├── MenuPage.ts                        # Category menu listing
│   ├── ProductListingPage.ts              # Category PLP & product tiles
│   ├── ProductDetailPage.ts               # Customization accordions & Add to Cart
│   ├── CartPage.ts                        # Cart drawer / modal & item verification
│   └── CheckoutPage.ts                    # Checkout entry point check
│
├── fixtures/
│   └── testFixtures.ts                    # Custom Playwright page object fixtures
│
├── test-data/
│   ├── stores.json                        # Carvel Qu Sandbox test store details
│   ├── products.json                      # Valid product test data
│   └── users.json                         # Authentication environment references
│
├── utils/
│   ├── constants.ts                       # Timeouts, URLs, and regex pattern constants
│   └── testData.ts                        # Test data loaders & credentials getter
│
├── .github/
│   └── workflows/
│       └── playwright.yml                 # GitHub Actions CI workflow
│
├── EXPLORATION.md                         # Discovered UI, DOM, and selector documentation
├── playwright.config.ts                   # Playwright configuration
├── tsconfig.json                          # TypeScript compiler settings
├── .env                                   # Local environment variables (git-ignored)
├── .env.example                           # Sample environment variable template
├── .gitignore                             # Git ignore rules
└── README.md                              # Framework documentation
```

---

## Prerequisites & Installation

### Prerequisites
- Node.js v18 or higher installed
- npm v9 or higher installed

### Setup Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd carvel-playwright
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install Playwright Chromium browser:
   ```bash
   npx playwright install chromium
   ```
4. Setup environment variables:
   Copy `.env.example` to `.env` and fill in credentials if authentication is required:
   ```bash
   cp .env.example .env
   ```

---

## Environment Variables Configuration

Create a `.env` file in the root directory:

```env
BASE_URL=https://car.uat.focusbrands.com
CARVEL_USERNAME=testuser@example.com
CARVEL_PASSWORD=TestPassword123!
```

> **IMPORTANT**: Never commit `.env` or plain-text credentials to Git repository. `.env` is listed in `.gitignore`.

---

## Running Automation Tests

### Execute All Tests
```bash
npx playwright test
```

### Execute Smoke Suite Only
```bash
npx playwright test tests/smoke
```

### Execute Specific Test File
```bash
npx playwright test tests/smoke/orderJourney.smoke.spec.ts
```

### Execute in Headed Mode
```bash
npx playwright test --headed
```

### Open Playwright HTML Report
```bash
npx playwright show-report
```

---

## Dynamic Date & Time Handling for Pickup Later
The framework dynamically selects available future dates and pickup times directly from the UAT application interface:
- Does NOT hardcode static calendar dates (e.g. "September 25, 2026") which would expire.
- Interrogates `select[id*="date"]` and `select[id*="time"]` at runtime to choose valid options.
- Guarantees test stability on future execution dates.

---

## Git Branching & Pull Request Workflow

### Branch Strategy
- `main`: Protected production branch. Direct pushes are disabled.
- `feature/*`: Development feature branches.
  - `feature/playwright-framework`
  - `feature/carvel-pom`
  - `feature/carvel-pickup-later`
  - `feature/carvel-smoke-tests`
  - `feature/carvel-ci`
- `bugfix/*`: Bug fix branches.

### Development Workflow
1. Create a feature branch from `main`:
   ```bash
   git checkout main
   git checkout -b feature/carvel-smoke-tests
   ```
2. Develop code & run local Playwright tests:
   ```bash
   npx playwright test
   ```
3. Commit using conventional commit format:
   ```bash
   git commit -m "test: add carvel e2e pickup later smoke journey"
   ```
4. Push feature branch and create GitHub Pull Request:
   ```bash
   git push origin feature/carvel-smoke-tests
   ```

---

## GitHub Branch Protection Policy (Manual Configuration Guide)
To enforce quality controls on `main`, configure the following in GitHub Repository Settings -> Branches -> Add branch protection rule:
1. **Branch pattern**: `main`
2. **Require a pull request before merging**: Enabled
   - Require approvals: At least 1 approval required.
3. **Require status checks to pass before merging**: Enabled
   - Select status check: `smoke-tests` (GitHub Actions workflow).
4. **Require conversation resolution before merging**: Enabled.
5. **Do not allow bypassing the above settings**: Enabled.

---

## CI/CD Pipeline (GitHub Actions)
The workflow `.github/workflows/playwright.yml` executes on every push and pull request to `main`:
1. Checkouts code & sets up Node.js.
2. Installs npm dependencies.
3. Installs Playwright Chromium browser binary.
4. Loads `BASE_URL`, `CARVEL_USERNAME`, `CARVEL_PASSWORD` from GitHub Repository Secrets.
5. Executes the Playwright smoke suite (`npx playwright test tests/smoke`).
6. Generates and uploads Playwright HTML report and failure screenshots/traces as build artifacts.
