# CARVEL PLAYWRIGHT AUTOMATION FRAMEWORK — COMPREHENSIVE STUDY GUIDE

> **Audience**: QA Engineers, Automation Engineers, SDETs, and Technical Leads.  
> **Target Repository**: `carvel-playwright`  
> **Application Under Test (AUT)**: Carvel UAT Online Ordering (`https://car.uat.focusbrands.com`)  
> **Technology Stack**: Playwright Test (`^1.63.0`), TypeScript (`^7.0.2`), Node.js, CommonJS, Auth0.

---

## TABLE OF CONTENTS
1. [Part 1 — Project Structure](#part-1--project-structure)
2. [Part 2 — Big Picture: How the Framework Works](#part-2--big-picture-how-the-framework-works)
3. [Part 3 — Test Execution Lifecycle](#part-3--test-execution-lifecycle)
4. [Part 4 — Playwright Fundamentals Used in This Project](#part-4--playwright-fundamentals-used-in-this-project)
5. [Part 5 — Page Object Model (POM)](#part-5--page-object-model-pom)
6. [Part 6 — Locator Strategy](#part-6--locator-strategy)
7. [Part 7 — Dynamic Application Handling](#part-7--dynamic-application-handling)
8. [Part 8 — Authentication & Security](#part-8--authentication--security)
9. [Part 9 — Test Data Architecture](#part-9--test-data-architecture)
10. [Part 10 — Assertions in Practice](#part-10--assertions-in-practice)
11. [Part 11 — Test Design & Strategy](#part-11--test-design--strategy)
12. [Part 12 — Test Hooks & Fixtures](#part-12--test-hooks--fixtures)
13. [Part 13 — Playwright Configuration Deep Dive](#part-13--playwright-configuration-deep-dive)
14. [Part 14 — TypeScript for Automation](#part-14--typescript-for-automation)
15. [Part 15 — Error Handling & Debugging Real-World Flakiness](#part-15--error-handling--debugging-real-world-flakiness)
16. [Part 16 — Reporting, Traces, & Debugging Workflow](#part-16--reporting-traces--debugging-workflow)
17. [Part 17 — Git, Branching, & Repository Discipline](#part-17--git-branching--repository-discipline)
18. [Part 18 — Automation Code Review Checklist](#part-18--automation-code-review-checklist)
19. [Part 19 — CI/CD Pipeline Integration](#part-19--cicd-pipeline-integration)
20. [Part 20 — Parallel Execution & State Isolation](#part-20--parallel-execution--state-isolation)
21. [Part 21 — Cross-Browser & Device Testing](#part-21--cross-browser--device-testing)
22. [Part 22 — API + UI Hybrid Automation Strategy](#part-22--api--ui-hybrid-automation-strategy)
23. [Part 23 — The Test Pyramid in E-Commerce Automation](#part-23--the-test-pyramid-in-e-commerce-automation)
24. [Part 24 — Maintainability & Handling Upstream UI Changes](#part-24--maintainability--handling-upstream-ui-changes)
25. [Part 25 — Current Strengths vs. Potential Improvements](#part-25--current-strengths-vs-potential-improvements)
26. [Part 26 — Complete Visual Flow Diagrams](#part-26--complete-visual-flow-diagrams)
27. [Part 27 — Explain This Framework Like I Am New (Interview Guide)](#part-27--explain-this-framework-like-i-am-new-interview-guide)
28. [Part 28 — Structured Step-by-Step Study Roadmap](#part-28--structured-step-by-step-study-roadmap)
29. [My Framework in One Page (Cheat Sheet)](#my-framework-in-one-page-cheat-sheet)

---

## PART 1 — PROJECT STRUCTURE

### Visual Directory Tree
```text
carvel-playwright/
├── .env                         # Local environment secrets (IGNORED by Git)
├── .env.example                 # Template for required environment variables
├── .gitignore                   # Files excluded from source control
├── package.json                 # Project dependencies & scripts
├── package-lock.json            # Deterministic dependency lockfile
├── tsconfig.json                # TypeScript compiler configuration & path aliases
├── playwright.config.ts         # Master Playwright Test runner configuration
│
├── fixtures/
│   └── testFixtures.ts          # Custom Playwright fixture injection (POM instances)
│
├── pages/                       # Page Object Model classes
│   ├── HomePage.ts              # Carvel landing page navigation & title check
│   ├── Header.ts                # Global header (Navigation, Auth links, Start Order, Cart icon)
│   ├── LoginPage.ts             # Auth0 login form, credential submission & session verification
│   ├── OrderTypePage.ts         # Initial Pickup vs. Delivery modal selection
│   ├── StoreLocatorPage.ts      # Address search, suggestion select, store card loop & availability checks
│   ├── PickupPage.ts            # Pickup Later selection, dynamic calendar/time selection & confirmation
│   ├── MenuPage.ts              # Category navigation (Ice Cream, Cakes, etc.)
│   ├── ProductListingPage.ts    # PLP grid, product cards & selection
│   ├── ProductDetailPage.ts     # PDP modal, radio options (Size, Flavor) & Add to Cart
│   ├── CartPage.ts              # Cart slide-over drawer, items, pricing, date/time format validation
│   └── CheckoutPage.ts          # Checkout form, saved card selection, place order & confirmation
│
├── test-data/                   # Externalized static JSON test data
│   ├── stores.json              # Search queries & fallback store addresses
│   ├── products.json            # Target product name, category, size & flavor options
│   └── users.json               # Environment variable key mappings for credentials
│
├── tests/                       # Test specifications
│   └── smoke/
│       ├── orderJourney.smoke.spec.ts   # PRIMARY 21-step E2E Pickup Later purchase journey
│       ├── authentication.smoke.spec.ts # Auth0 standalone login verification
│       ├── cart.smoke.spec.ts           # Cart drawer assertions
│       ├── homepage.smoke.spec.ts       # Landing page verification
│       ├── menu.smoke.spec.ts           # Menu navigation checks
│       ├── navigation.smoke.spec.ts     # Global navigation link tests
│       ├── pickupLater.smoke.spec.ts    # Standalone schedule modal test
│       └── product.smoke.spec.ts        # PLP & PDP standalone checks
│
├── utils/                       # Shared helper utilities & constants
│   ├── constants.ts             # Static application URLs, titles & standard timeouts
│   └── testData.ts              # Strongly typed loaders connecting JSON data to test specs
│
├── playwright-report/           # Generated Playwright HTML reports (Git-ignored)
└── test-results/                # Test artifacts (videos, traces, screenshots) on failure (Git-ignored)
```

### Comprehensive File Breakdown Table

| Path | Type | Purpose | Used By | Why We Need It | What Happens If Removed |
|---|---|---|---|---|---|
| `playwright.config.ts` | Configuration | Defines global timeouts, browsers, reporters, base URL, retries, and artifact policies | Playwright Test Runner CLI | Controls browser engine, viewport, timeouts, reporting, and execution behavior | Tests fail to run or run with default raw settings, missing timeouts and base URLs |
| `tsconfig.json` | Configuration | Configures TypeScript compiler (`ES2022`, `CommonJS`), path aliases, and strict type checking | `tsc`, ts-node, IDE | Enables TypeScript compilation and autocompletion for `@pages/*`, `@utils/*`, etc. | TypeScript compiler errors out; code editor loses typing and import resolution |
| `package.json` | Configuration | Declares project dependencies (`@playwright/test`, `dotenv`, `typescript`) and scripts | npm, CI/CD | Manages third-party library versions and reproducibility | Project cannot run; dependencies cannot be installed via `npm install` |
| `.env` | Configuration / Secrets | Stores local environment secrets (`CARVEL_USERNAME`, `CARVEL_PASSWORD`, `BASE_URL`) | `dotenv` via `playwright.config.ts` | Keeps sensitive login credentials outside Git source control | Auth tests fail due to missing username/password environment variables |
| `.env.example` | Documentation | Template demonstrating required `.env` keys without exposing real values | Developers / CI setup | Informs developers which secrets are required to run tests | New developers or CI/CD pipelines will not know which environment variables to configure |
| `.gitignore` | Configuration | Instructs Git to ignore sensitive files (`.env`), build artifacts, reports, and node_modules | Git VCS | Prevents leaking credentials, videos, reports, and large binaries to remote Git repositories | Secrets might leak to GitHub; repository gets bloated with binary videos and traces |
| `fixtures/testFixtures.ts` | Framework Code | Extends Playwright's base `test` with custom fixtures instantiating all 11 Page Objects | All test spec files (`tests/**/*.spec.ts`) | Eliminates manual `new PageObject(page)` instantiations across every test | Test specs must manually instantiate 11 page classes and maintain page references |
| `pages/Header.ts` | Framework / POM | Models top navigation bar, Auth links, Cart icon, and resilient Start Order button | Test specs, `HomePage.ts` | Encapsulates header selectors and handles React hydration detachment during login | Test files would have to hardcode header locators and handle DOM detachments |
| `pages/LoginPage.ts` | Framework / POM | Models Auth0 login fields, submission, and post-login session verification | `orderJourney.smoke.spec.ts`, `authentication.smoke.spec.ts` | Encapsulates external Auth0 authentication flow and recovery from intermittent hiccups | Every test needing login would repeat email/password input and Auth0 redirects |
| `pages/StoreLocatorPage.ts` | Framework / POM | Handles address input, autosuggest selection, store card loop, and online ordering availability | `orderJourney.smoke.spec.ts` | Dynamically checks whether a store allows online ordering instead of failing later | Tests fail if the first store card is closed for online ordering |
| `pages/PickupPage.ts` | Framework / POM | Controls Pickup Later modal, dynamic calendar date selection, and time slot selection | `orderJourney.smoke.spec.ts`, `pickupLater.smoke.spec.ts` | Discovers available future dates/times dynamically without hardcoded dates | Tests would fail as soon as hardcoded calendar dates pass into the past |
| `pages/MenuPage.ts` | Framework / POM | Models menu category navigation (e.g. Ice Cream, Cakes, Bundles) | Test specs | Provides clean methods to navigate between e-commerce categories | Tests must directly query URLs or category anchor tags |
| `pages/ProductListingPage.ts` | Framework / POM | Models product grid on category pages and product card clicks | Test specs | Encapsulates PLP interaction and scrolling to specific items | Tests must write custom element clicks for cards on PLP |
| `pages/ProductDetailPage.ts` | Framework / POM | Models product customization (Size, Flavor radios) and Add to Cart action | Test specs | Handles React radio button custom events and price updates | Tests cannot properly trigger React state changes on radio buttons |
| `pages/CartPage.ts` | Framework / POM | Models cart drawer, item listing, quantity, subtotal, and dynamic date format validation | Test specs | Verifies cart contents and maps `MM/DD/YYYY` dates to Cart drawer formats (`Sep 26`) | Date format mismatches cause false-positive test failures |
| `pages/CheckoutPage.ts` | Framework / POM | Models Checkout page, saved credit card detection, order submission, and confirmation parsing | `orderJourney.smoke.spec.ts` | Verifies checkout readiness, clicks Place Order once, and parses confirmation numbers | Complete E2E purchase cannot be completed or verified |
| `test-data/stores.json` | Test Data | External JSON storing search addresses (`26 Broadway, New York, NY 10004, USA`) | `utils/testData.ts` | Separates test input data from test automation code | Tests must hardcode addresses in TypeScript files |
| `test-data/products.json` | Test Data | External JSON storing target product (`SCOOPED ICE CREAM`), size, and flavor | `utils/testData.ts` | Allows changing tested product attributes without altering code | Hardcoded product names in test files; breaks if product changes |
| `test-data/users.json` | Test Data | Maps user test roles to corresponding environment variable keys | `utils/testData.ts` | Prevents hardcoding username/password strings in test data files | Test data loaders would not know which environment variable keys to look for |
| `utils/testData.ts` | Framework Code | TypeScript typed data loader exporting `testStoreData`, `testProductData`, `getTestCredentials` | Test specs | Enforces TypeScript interface types (`PickupStore`, `TestProduct`) on JSON data | Type safety is lost; typos in JSON keys cause runtime undefined errors |
| `utils/constants.ts` | Framework Code | Defines `APP_CONSTANTS` (base URLs, timeouts) and `URL_PATHS` | Page objects & tests | Centralizes shared static strings to prevent magic strings across files | Magic strings repeated in multiple files; URL refactors become tedious |
| `tests/smoke/orderJourney.smoke.spec.ts` | Test Code | Primary 21-step E2E purchase test covering the complete user journey to confirmation | CI/CD, QA team | Validates the business-critical revenue path (Homepage → Login → Store → Schedule → PDP → Cart → Checkout → Confirmation) | Critical revenue path goes untested; regressions in the checkout journey reach production |

---

## PART 2 — BIG PICTURE: HOW THE FRAMEWORK WORKS

### Architectural Flowchart

```text
       ┌────────────────────────────────────────────────────────┐
       │     Test Specification (orderJourney.smoke.spec.ts)    │
       └───────────────────────────┬────────────────────────────┘
                                   │ Calls high-level business methods
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │     Page Object Model Classes (pages/*.ts)             │
       │     (Header, StoreLocatorPage, CartPage, etc.)         │
       └───────────────────────────┬────────────────────────────┘
                                   │ Queries elements via resilient locators
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │     Playwright Locator API                             │
       │     page.locator('#btn_startorder')                    │
       └───────────────────────────┬────────────────────────────┘
                                   │ Translates to CDP / WebDriver protocol
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │     Browser Engine (Chromium / WebKit / Firefox)       │
       └───────────────────────────┬────────────────────────────┘
                                   │ Executes action & renders DOM
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │     Carvel UAT Web Application (React / Next.js)       │
       └───────────────────────────┬────────────────────────────┘
                                   │ Returns DOM state / values
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │     Playwright Assertions (expect(...).toBeVisible())   │
       └───────────────────────────┬────────────────────────────┘
                                   │ Compares expected vs. actual
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │     Test Result & Telemetry (List Reporter, HTML, CLI) │
       └────────────────────────────────────────────────────────┘
```

### The 21-Step Primary E2E Journey Step-by-Step Table

| Step # | Action Description | Test File | Page Object | Method | Primary Locator | Playwright API Action | Assertion / Check | Expected Result |
|---|---|---|---|---|---|---|---|---|
| **1** | Open Homepage | `orderJourney.smoke.spec.ts` | `HomePage` | `navigate()` & `verifyPageLoaded()` | `body`, `#img_headerlogo` | `page.goto('/')` | `expect(page).toHaveTitle(/Carvel/i)` | Homepage loads with Carvel branding |
| **2** | Auth0 Real Login | `orderJourney.smoke.spec.ts` | `LoginPage` | `login(username, password)` | `#username`, `#password`, `button[type="submit"]` | `fill()`, `press('Enter')` | `expect(authIndicator).toBeVisible()` | User redirects back to Carvel with active session |
| **3** | Click Start Order | `orderJourney.smoke.spec.ts` | `Header` | `clickStartOrder()` | `#btn_startorder` | `click()` (with React re-render retry) | `waitForLoadState('domcontentloaded')` | Opens order type / location selection screen |
| **4** | Select Pickup | `orderJourney.smoke.spec.ts` | `OrderTypePage` | `selectPickup()` | `#btn_pickup, button:has-text("PICKUP")` | `click()` | `expect(pickupOption).toBeVisible()` | Enters store search mode |
| **5** | Search & Pick 1st Store | `orderJourney.smoke.spec.ts` | `StoreLocatorPage` | `searchAndSelectStore(query)` | `#store-search-input`, `.storeCardContainer`, `button:has-text("ORDER AHEAD")` | `fill()`, `keyboard.type()`, `click()` | `verifyStoreSelected(storeName)` | Finds "Carvel Qu Sandbox", clicks ORDER AHEAD, verifies accepted |
| **6** | Choose Pickup Later | `orderJourney.smoke.spec.ts` | `PickupPage` | `selectPickupLater()` | `#orderInfoLaterBtn` | `click()` | `expect(laterBtn).toBeVisible()` | Displays calendar & time slot picker |
| **7 & 8** | Pick Dynamic Date/Time | `orderJourney.smoke.spec.ts` | `PickupPage` | `selectDynamicDateAndTime()` | `[data-testid="orderInfoInputDate"]`, `.react-datepicker__day`, `[data-testid="orderInfoInputTime"]` | `click()` on first enabled future day & time | Returned date & time non-empty | Next valid business day & time slot selected |
| **9** | Confirm Pickup Schedule | `orderJourney.smoke.spec.ts` | `PickupPage` | `confirmSchedule()` | `#orderInfoConfirmBtn` | `click({ force: true })` | Inspects modal confirmation text | Schedule confirmed; transitions to Menu |
| **10** | Navigate Category | `orderJourney.smoke.spec.ts` | `MenuPage` | `selectCategory('Ice Cream')` | `a#menuPageList:has-text("Ice Cream")` | `click()` | `expect(page).toHaveURL(/menu/)` | Category PLP loaded |
| **11** | Select Product on PLP | `orderJourney.smoke.spec.ts` | `ProductListingPage` | `selectProduct('SCOOPED ICE CREAM')` | `.productImageTitle:has-text("SCOOPED ICE CREAM")` | `click({ force: true })` | `expect(productCard).toBeVisible()` | PDP opens for Scooped Ice Cream |
| **12 & 13** | Customize Product | `orderJourney.smoke.spec.ts` | `ProductDetailPage` | `selectSizeAndFlavor('Small Cup', 'Vanilla')` | `input[type="radio"]` | `evaluate()` dispatching React `change` events | `expect(addToCartBtn).toBeVisible()` | Radio buttons checked; Add to Cart displays price `$4.89` |
| **14** | Add Product to Cart | `orderJourney.smoke.spec.ts` | `ProductDetailPage` | `addToCart()` | `#btn_add_to_cart` | `click()` | `waitForSelector('text="Item Added!"')` | Item added toast appears; cart count increments |
| **15** | Open Cart Drawer | `orderJourney.smoke.spec.ts` | `CartPage` | `verifyCartLoaded()` | `#link_cart, button[aria-label*="cart" i]` | `click()` | `expect(cartDrawer).toBeVisible()` | Side drawer opens with "MY CART" header |
| **16** | Validate Cart Details | `orderJourney.smoke.spec.ts` | `CartPage` | `verifyPickupScheduleInCart()`, `verifyStoreInCart()` | `body`, `.cartContainer` | `innerText()` | `expect(body).toContainText(/Sep 26/i)` | Store, pickup method, dynamic date (`Sep 26`), time (`07:00 am`), item & subtotal verified |
| **17** | Proceed to Checkout | `orderJourney.smoke.spec.ts` | `CartPage` | `proceedToCheckout()` | `#cart_checkout_button` | `click()` | Cart drawer transitions | User navigates toward `/checkout` |
| **18** | Verify Checkout Page | `orderJourney.smoke.spec.ts` | `CheckoutPage` | `verifyCheckoutPageLoaded()` | `[data-testid="btn_place_order"]`, `#orderSummary_container` | `waitForLoadState()` | `expect(indicator).toBeVisible()` | Checkout form & Order Summary visible |
| **19** | Select Saved Card | `orderJourney.smoke.spec.ts` | `CheckoutPage` | `locateAndVerifySavedCard()` | `[data-testid="btn_saved_Card"]`, `[data-testid="txt_saved_Card"]` | `click({ force: true })` | `expect(savedCardRadio).toBeVisible()` | Saved Visa ending in 1111 selected |
| **20** | Place Order | `orderJourney.smoke.spec.ts` | `CheckoutPage` | `placeOrder()` | `#btn_place_order` | Single `click()` (no duplicate submission) | `expect(btn).toBeEnabled()` | Order submitted to payment gateway |
| **21** | Verify Confirmation | `orderJourney.smoke.spec.ts` | `CheckoutPage` | `verifyOrderConfirmation()` | `#order_confirmation, h1:has-text("Order Confirmed")` | `innerText()` pattern match | `expect(confNum).toBeTruthy()` | Confirmation # (e.g. `46813659441709057`), Status `Scheduled`, Total `$19.56` logged |

---

## PART 3 — TEST EXECUTION LIFECYCLE

When you execute:
```bash
npx playwright test tests/smoke/orderJourney.smoke.spec.ts --headed --reporter=list
```

### The 15-Step Execution Breakdown

1. **`npx` Execution**: Looks inside local `node_modules/.bin` for the `playwright` binary without requiring global installation.
2. **Playwright Test Runner Initialization**: Launches `@playwright/test` runtime, parses CLI flags (`--headed`, `--reporter=list`).
3. **Configuration Loading**: Reads `playwright.config.ts`. It executes `dotenv.config()` to load credentials and URLs from `.env`.
4. **TypeScript Transpilation**: Playwright uses an internal, blazing-fast compiler (esbuild) to transpile `.ts` files on the fly. No separate pre-compilation step is mandatory for running tests.
5. **Test Discovery**: Playwright scans `tests/smoke/orderJourney.smoke.spec.ts`, builds an in-memory test tree, and counts total tests to run (1 test, 1 worker).
6. **Fixture Resolution**: Detects dependencies declared in test signature: `{ homePage, header, loginPage, ... page }`. Playwright plans fixture initialization order.
7. **Browser Engine Launch**: Since `chromium` project is selected and `--headed` is passed, Playwright launches a real Google Chromium window with viewport `1400x900`.
8. **Browser Context Creation**: Creates an incognito `BrowserContext`. This guarantees an isolated browser session with clean cache, zero cookies, and independent local storage.
9. **Page Instantiation**: Spawns a new tab (`Page`) within the context. Injects network listeners (`page.on('console')`, `page.on('response')`).
10. **Fixture Instantiation**: Executes fixture definitions from `fixtures/testFixtures.ts`. It executes `new HomePage(page)`, `new Header(page)`, etc., injecting them into the test.
11. **Step Execution**: Runs steps 1 through 21 sequentially inside an `async ({ ... }) => { ... }` function wrapper.
12. **Assertion Evaluation**: Playwright evaluates web assertions via `expect(locator).toBeVisible()`. If an element is not immediately ready, Playwright auto-polls until the assertion timeout (15s) expires.
13. **Failure Artifact Capture**: If an error occurs, Playwright's config (`screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `trace: 'retain-on-failure'`) writes artifacts to `test-results/`. If the test passes, temporary video/traces are discarded.
14. **Report Output**: The `list` reporter streams real-time step progress directly to stdout. Upon completion, Playwright updates the HTML report data in `playwright-report/`.
15. **Teardown & Cleanup**: Closes the `Page`, closes the `BrowserContext`, terminates the Chromium browser process, and exits with code `0` (Success) or `1` (Failure).

### Core Playwright Concepts: Key Differences

| Entity | Definition | Scope | Analogy |
|---|---|---|---|
| **Browser** | An instance of Chromium, Firefox, or WebKit process. | Entire test run. | The application executable running on your OS. |
| **BrowserContext** | An isolated, incognito session within a Browser. Contains independent cookies and cache. | Per test (or group of tests). | An incognito browser window. |
| **Page** | A single tab or window inside a BrowserContext. | Lives inside a Context. | A single browser tab. |
| **Locator** | A lazy pointer / query description to an element in the DOM. Does not store element instances. | Evaluated only when an action is called. | An address or GPS coordinates to find an element. |
| **Element (Handle)** | A direct reference to an actual DOM node in memory. Prone to detachment upon re-render. | Tied to a specific DOM snapshot. | The physical building at that GPS coordinate right now. |
| **Fixture** | Reusable dependency injection mechanism that sets up environment, objects, and teardown. | Provided to test functions. | Pre-assembled tools placed on the technician’s workbench. |
| **Test** | An atomic execution block (`test('name', async () => {})`) defining actions and assertions. | Executed by the runner. | The inspection checklist. |
| **Assertion** | A verification step (`expect(x).toBe(y)`) validating actual state against expected state. | Evaluated within a test. | The quality stamp verifying a measurement. |

---

## PART 4 — PLAYWRIGHT FUNDAMENTALS USED IN THIS PROJECT

### Fundamentals Actually Used in This Project

#### 1. Navigation & State
- **`page.goto(url, { waitUntil: 'domcontentloaded' })`**: Navigates the page to the target URL. In `HomePage.ts`, `waitUntil: 'domcontentloaded'` ensures the HTML is parsed before continuing.
- **`page.waitForLoadState('domcontentloaded' | 'networkidle')`**: Pauses until network or DOM reaches the specified state. Used in `Header.ts` and `CheckoutPage.ts` to allow React to hydrate.
- **`page.waitForURL(pattern, { timeout })`**: Waits for the window URL to match a regex or predicate. Used in `LoginPage.ts` (`!url.href.includes('auth0.com')`) to verify Auth0 redirect.

#### 2. Locators & Queries
- **`page.locator(selector)`**: Creates a lazy `Locator` object. Used across all Page Objects (e.g. `page.locator('#btn_startorder')`).
- **`.first()` / `.last()` / `.nth(index)`**: Resolves a specific match when multiple elements match a locator. Used in `StoreLocatorPage.ts` (`this.storeCards.nth(i)`).
- **`.filter({ hasText: /.../ })`**: Narrows down locators by child text. Used in `CheckoutPage.ts` to find confirmation headers.
- **`.or(locator)`**: Combines fallback locators so Playwright matches either selector. Used in `StoreLocatorPage.ts` for location warning popups.

#### 3. Actions & Inputs
- **`locator.click({ force?: boolean, timeout?: number })`**: Scrolls element into view, waits for element to be visible, enabled, and stable, then clicks.
- **`locator.fill(text)`**: Clears the input field and fills it with text. Used in `LoginPage.ts` for email/password.
- **`page.keyboard.type(text, { delay })`**: Simulates actual user keystrokes with delay. Used in `StoreLocatorPage.ts` to trigger autosuggest dropdowns.
- **`page.keyboard.press('Enter' | 'Escape')`**: Simulates keyboard key presses to dismiss poppers or submit forms.
- **`locator.scrollIntoViewIfNeeded()`**: Explicitly scrolls elements into viewport before clicking. Used on PLP product cards and Checkout buttons.
- **`page.evaluate(fn, arg)`**: Executes JavaScript directly inside the browser DOM context. Used in `ProductDetailPage.ts` to dispatch React `change` events on customized radio buttons.

#### 4. Assertions (`expect`)
- **`await expect(locator).toBeVisible({ timeout })`**: Web-first assertion that polls until the element is visible in the viewport.
- **`await expect(locator).toBeEnabled({ timeout })`**: Asserts that a button or input is not disabled. Used before clicking Place Order.
- **`await expect(locator).toContainText(text | regex)`**: Asserts that the element or its children contain expected text. Used in Cart and Checkout verification.
- **`await expect(page).toHaveTitle(regex)`**: Asserts browser tab title.
- **`await expect(page).toHaveURL(regex)`**: Asserts current browser URL.

#### 5. Telemetry & Event Listeners
- **`page.on('console', callback)`**: Intercepts browser console events. Used in `orderJourney.smoke.spec.ts` to capture and count frontend JavaScript errors.
- **`page.on('response', callback)`**: Intercepts HTTP network responses. Used to detect server errors (`HTTP >= 400`).

### Useful Playwright Concepts Not Currently Used in This Project

| Concept | Purpose | Why Consider It for Future Sprints |
|---|---|---|
| **`page.getByRole('button', { name: '...' })`** | Locates elements by ARIA accessible role. | Standard Playwright best practice; ensures accessibility standards and resilient testing. |
| **`page.getByTestId('...')`** | Native shorthand for `data-testid` attributes. | Cleaner syntax than `page.locator('[data-testid="..."]')`. |
| **`page.route(url, handler)`** | Network request interception and API mocking. | Allows mocking third-party services (e.g. payment gateway, loyalty rewards) without real charges. |
| **`storageState: 'auth.json'`** | Saves authentication cookies/tokens to file. | Speeds up tests by logging in once via API/UI and reusing session across multiple test specs. |
| **`expect.poll(...)`** | Polls an arbitrary asynchronous function until condition is met. | Useful for checking database states or backend job statuses. |
| **Visual Regression (`toHaveScreenshot`)** | Compares screenshots pixel-by-pixel against baselines. | Catches styling, layout, and visual branding defects automatically. |

---

## PART 5 — PAGE OBJECT MODEL (POM)

### POM Explained for Beginners
In test automation, the **Page Object Model** is a design pattern where each web page or major UI component is represented by a dedicated class. 

- **The Problem Without POM (Spaghetti Automation)**:  
  If you write locators and clicks directly in your test files, and Carvel changes `#btn_startorder` to `#start-ordering-button`, you must search and replace that locator across 50 different test files. Tests become unreadable, fragile, and impossible to maintain.
- **The Solution With POM**:  
  Locators and browser interactions live **only inside Page Object classes**. The test file contains only business logic. If the locator changes, you update **one line** in **one file** (`Header.ts`), and all 50 tests pass immediately.

### Good vs. Bad Automation Code Comparison

#### Bad Example (Non-POM):
```typescript
// tests/badExample.spec.ts
test('order ice cream', async ({ page }) => {
  await page.goto('https://car.uat.focusbrands.com');
  await page.locator('#btn_startorder').click(); // Hardcoded locator
  await page.locator('#btn_pickup').click();
  await page.locator('#store-search-input').fill('26 Broadway');
  await page.waitForTimeout(3000); // Bad wait
  await page.locator('.storeCardContainer button').first().click();
  // 300 lines of mixed locators, clicks, and assertions...
});
```

#### Good Example (Implemented in this Project):
```typescript
// tests/smoke/orderJourney.smoke.spec.ts
test('order ice cream', async ({ homePage, header, storeLocatorPage }) => {
  await homePage.navigate();
  await header.clickStartOrder();
  const store = await storeLocatorPage.searchAndSelectStore(testStoreData.searchQuery);
  expect(store.name).toBeTruthy();
});
```

### Page Objects in This Project

#### 1. `Header.ts`
- **Represents**: The persistent top navigation bar across Carvel.
- **Key Locators**: `logo` (`#img_headerlogo`), `startOrderBtn` (`#btn_startorder`), `cartIcon` (`#link_cart`), `signInBtn` (`#link_guestProfile`).
- **Key Methods**: `verifyHeaderVisible()`, `clickStartOrder()`, `clickSignIn()`.

#### 2. `LoginPage.ts`
- **Represents**: Auth0 authentication overlay / domain and redirect verification.
- **Key Locators**: `emailInput` (`#username`), `passwordInput` (`#password`), `submitBtn` (`button[type="submit"]`), `tryAgainBtn` (`#btn_try_again`).
- **Key Methods**: `login(username, password)`, `verifySuccessfulLogin()`, `continueAsGuest()`.

#### 3. `StoreLocatorPage.ts`
- **Represents**: The `/store-search` view where customers enter location and select store.
- **Key Locators**: `searchInput` (`#store-search-input`), `storeCards` (`.storeCardContainer`), `firstSuggestion` (`.storeSearchItem button`).
- **Key Methods**: `performSearch()`, `selectFirstAvailableStoreOrderAhead()`, `searchAndSelectStore()`.

#### 4. `PickupPage.ts`
- **Represents**: The scheduling modal and date/time selector poppers.
- **Key Locators**: `laterBtn` (`#orderInfoLaterBtn`), `dateInput` (`[data-testid="orderInfoInputDate"]`), `timeInput` (`[data-testid="orderInfoInputTime"]`), `confirmBtn` (`#orderInfoConfirmBtn`).
- **Key Methods**: `selectPickupLater()`, `selectDynamicDateAndTime()`, `confirmSchedule()`.

#### 5. `MenuPage.ts`
- **Represents**: The category menu view (`/menu`).
- **Key Locators**: `iceCreamCategory` (`a[href*="/ice-cream"]`), `sundaesShakesCategory` (`a[href*="/sundaes-shakes"]`).
- **Key Methods**: `verifyMenuLoaded()`, `selectCategory(categoryName)`.

#### 6. `ProductListingPage.ts`
- **Represents**: The product grid showing cards under a category.
- **Key Locators**: `productTitles` (`.productImageTitle`), `firstProductTile`.
- **Key Methods**: `verifyProductsDisplayed()`, `selectProduct(productName)`.

#### 7. `ProductDetailPage.ts`
- **Represents**: Product modal/page for selecting sizes, flavors, and quantity.
- **Key Locators**: `addToCartBtn` (`#btn_add_to_cart`), `radioOptions` (`input[type="radio"]`).
- **Key Methods**: `verifyPDPLoaded()`, `selectSizeAndFlavor(size, flavor)`, `addToCart()`.

#### 8. `CartPage.ts`
- **Represents**: The slide-over cart drawer and line items.
- **Key Locators**: `cartDrawer` (`#drawer_cart`), `checkoutBtn` (`#cart_checkout_button`).
- **Key Methods**: `verifyCartLoaded()`, `verifyStoreInCart()`, `verifyPickupScheduleInCart()`, `proceedToCheckout()`.

#### 9. `CheckoutPage.ts`
- **Represents**: The `/checkout` single-page form and Order Confirmation view.
- **Key Locators**: `savedCardRadio` (`[data-testid="btn_saved_Card"]`), `placeOrderBtn` (`#btn_place_order`), `confirmationIndicator`.
- **Key Methods**: `verifyCheckoutPageLoaded()`, `locateAndVerifySavedCard()`, `placeOrder()`, `verifyOrderConfirmation()`.

---

## PART 6 — LOCATOR STRATEGY

### Industrial Locator Preference Hierarchy

When selecting locators, engineers follow a strict reliability hierarchy:
1. **Unique, stable IDs**: `#btn_startorder`, `#btn_add_to_cart` (Fastest, unique, least prone to style shifts).
2. **Dedicated Test Attributes**: `[data-testid="btn_saved_Card"]`, `[data-testid="orderInfoInputDate"]` (Engineered explicitly for QA, immune to styling or text changes).
3. **Semantic Attributes & Roles**: `button[aria-label="cart icon"]`, `input[type="radio"]`.
4. **Text-based Selectors**: `button:has-text("ORDER AHEAD")` (Prone to copy changes, translations, or whitespace variations).
5. **Class / CSS Selectors**: `.storeCardContainer`, `.productImageTitle` (Can change during redesigns or CSS refactors).
6. **XPath**: (Avoid unless selecting parents based on deep child criteria).

### Scoped Locators vs. Global Locators

In `StoreLocatorPage.ts`, there may be 10 store cards displayed on screen. Each store card has an "ORDER AHEAD" button.

#### Unsafe Global Query:
```typescript
// RISKY: Clicks the first "ORDER AHEAD" button found anywhere on the page
await page.locator('button:has-text("ORDER AHEAD")').click();
```
*Why this fails*: The first button might belong to an unavailable store or closed location.

#### Safe Scoped Query (Implemented in our project):
```typescript
// SAFE: Scopes the search strictly inside candidate store card #i
const card = this.storeCards.nth(i);
const orderAheadBtn = card.locator('button:has-text("ORDER AHEAD")').first();
await orderAheadBtn.click();
```
*Why this is superior*: The query is isolated to that specific store card container. It reads the specific store's name, address, and button status without leaking to other cards.

---

## PART 7 — DYNAMIC APPLICATION HANDLING

### The Danger of Hardcoded Data in E-Commerce
If an automation script hardcodes:
```typescript
await dateInput.fill("09/26/2026");
await timeSelect.selectOption("7:00 AM");
```
The test will fail as soon as:
1. That date falls on a closed holiday.
2. The store has booked out all 7:00 AM pickup slots.
3. The date passes into the past.
4. The test runs in a different time zone.

### How Our Framework Solves Dynamic UI

#### 1. Dynamic Store Availability
In `StoreLocatorPage.ts:selectFirstAvailableStoreOrderAhead()`:
- Inspects store cards sequentially (`cardCount`).
- Verifies if `ORDER AHEAD` is enabled.
- Clicks `ORDER AHEAD` and waits for Carvel UAT's response.
- Checks if Carvel displays the modal: *"This location is not available for online ordering"*.
- If rejected, dismisses the modal and automatically iterates to Store 2!
- When a store is accepted, returns `{ name, address }` dynamically to the test.

#### 2. Dynamic Calendar & Time Discovery
In `PickupPage.ts:selectDynamicDateAndTime()`:
- Opens the React Datepicker calendar.
- Queries active, non-disabled dates: `.react-datepicker__day:not(.react-datepicker__day--disabled)`.
- Selects the next available business day.
- Opens the timepicker and selects the first active slot with `/AM|PM/i`.
- Reads and returns the selected values: `{ date: "09/26/2026", time: "7:00 AM" }`.

#### 3. React DOM Detachment & Hydration Resilience
**The Problem Encountered**:
Immediately after redirecting from Auth0 back to the Carvel homepage, React hydrated the header. Playwright found `#btn_startorder`, started the click sequence, and React detached the node from the DOM, throwing:
`TimeoutError: locator.click: Timeout 20000ms exceeded ... element was detached from the DOM, retrying`

**The Resilient Solution Implemented in `Header.ts`**:
```typescript
async clickStartOrder(): Promise<void> {
  await this.page.waitForLoadState('domcontentloaded');

  // Dismiss cookies / hiccups
  // ...

  // Re-resolve #btn_startorder immediately before clicking
  const btn = this.page.locator('#btn_startorder').first();
  await btn.waitFor({ state: 'attached', timeout: 20000 });
  await btn.waitFor({ state: 'visible', timeout: 20000 });

  try {
    await btn.click({ timeout: 7000 });
  } catch (err: any) {
    console.log('[HEADER] Start Order button detached during React re-render. Re-resolving and retrying click...');
    await this.page.waitForLoadState('domcontentloaded');
    const freshBtn = this.page.locator('#btn_startorder').first();
    await freshBtn.waitFor({ state: 'visible', timeout: 15000 });
    await freshBtn.click({ timeout: 15000 });
  }
}
```
*Why this works*: It avoids arbitrary 10-second sleeps. If React replaces the DOM node, the catch block immediately catches the detachment, waits for the new DOM to stabilize, re-queries `#btn_startorder` cleanly, and clicks the fresh node.

#### Why `waitForTimeout(5000)` Is Poor Automation Practice
- **Wasteful**: If an element appears in 200ms, sleeping 5000ms wastes 4.8 seconds per step. Across 20 steps, your test takes 100 extra seconds.
- **Flaky**: If the server takes 5100ms under load, your test fails anyway.
- **Best Practice**: Use event-driven auto-waiting: `await expect(locator).toBeVisible()` or `await page.waitForLoadState()`.

---

## PART 8 — AUTHENTICATION & SECURITY

### How Authentication Works in This Project
1. **Credentials Isolation**: Real credentials reside strictly in the local `.env` file:
   ```env
   BASE_URL=https://car.uat.focusbrands.com
   CARVEL_USERNAME=test_user@example.com
   CARVEL_PASSWORD=SecretPassword123
   ```
2. **Key Mapping**: `test-data/users.json` maps logical keys to environment variables:
   ```json
   {
     "testUser": {
       "usernameEnvKey": "CARVEL_USERNAME",
       "passwordEnvKey": "CARVEL_PASSWORD"
     }
   }
   ```
3. **Loader Function**: `utils/testData.ts:getTestCredentials()` reads `process.env.CARVEL_USERNAME`.
4. **Auth0 Redirection**:
   - `Header.clickSignIn()` clicks the Sign In button.
   - Carvel redirects the browser to Auth0 (`carvel-uat.auth0.com`).
   - `LoginPage.login()` waits for `#username` and `#password`, fills credentials, and presses Enter.
   - `LoginPage.verifySuccessfulLogin()` monitors the URL until it leaves `auth0.com` and returns to `car.uat.focusbrands.com`.

### Security Risks of Hardcoding Credentials
- **Public Exposure**: If `.env` is pushed to GitHub, bots scan public commits within seconds, stealing accounts.
- **Audit Trails**: Passwords committed to Git remain permanently in `.git` history even after you delete the file in a subsequent commit.
- **Compliance Violations**: Violates SOC2, ISO 27001, and PCI-DSS compliance standards.
- **Prevention**: `.gitignore` contains `.env`. In CI/CD pipelines, credentials are injected via GitHub Actions Encrypted Secrets.

---

## PART 9 — TEST DATA ARCHITECTURE

### Current Structure: External JSON
Test parameters are stored in `test-data/*.json`:
- `stores.json`: Search queries (`"26 Broadway, New York, NY 10004, USA"`).
- `products.json`: Target item (`"SCOOPED ICE CREAM"`, `"Small Cup"`, `"Vanilla"`).
- `users.json`: Environment key mappings.

### Why Separate Test Data from Test Logic?
1. **Maintainability**: If Carvel changes the Scooped Ice Cream name or size options, you update `products.json`. No TypeScript code is re-compiled or modified.
2. **Reusability**: Multiple test specs (e.g. `orderJourney.smoke.spec.ts`, `product.smoke.spec.ts`) reference the same single source of truth.
3. **Multi-Environment Support**: In mature setups, `test-data/uat/` and `test-data/prod/` hold environment-specific store names and products.

### Industrial Test Data Strategies

| Source | When to Use | Advantages | Disadvantages |
|---|---|---|---|
| **JSON Files** | Smoke & regression test suites with static test assets (Current implementation). | Zero dependencies, instant loading, versioned in Git. | Not dynamic; cannot generate fresh accounts on the fly. |
| **API Pre-Conditions** | Generating new test accounts, pre-populating shopping carts. | Ultra-fast (bypasses UI clicks), isolated per test. | Requires backend test API endpoints and auth tokens. |
| **Database Direct** | Querying available store inventory or resetting order statuses. | Direct verification against backend truth. | High maintenance; security firewalls often block direct DB access from CI. |
| **Faker Libraries** | Generating unique emails, random names, and dummy phone numbers. | Prevents conflicts in registration tests. | Randomness can occasionally introduce unexpected edge-case strings. |

---

## PART 10 — ASSERTIONS IN PRACTICE

### Assertions Implemented in the Primary Journey

| Assertion Code | What Is Being Checked? | Why Are We Checking It? | What Does Failure Mean? |
|---|---|---|---|
| `await expect(this.page).toHaveTitle(/Carvel/i)` | Browser tab title matches regex. | Confirms DNS, SSL, and Carvel landing page loaded. | Site is down, DNS failed, or gateway returned 502 Bad Gateway. |
| `await expect(authIndicator).toBeVisible()` | User profile icon or personalized greeting appears in header. | Verifies Auth0 redirected and session cookie was accepted. | Authentication failed or session was dropped during redirect. |
| `await storeLocatorPage.verifyStoreSelected(storeName)` | Store name appears in locator summary. | Confirms store is valid and selected for online ordering. | Location is closed, invalid, or ordering API failed. |
| `await expect(this.addToCartBtn).toBeVisible()` | Add to Cart button on PDP is visible and active. | Confirms all mandatory modifiers (Size, Flavor) were selected. | Required customization missing; button disabled or hidden. |
| `await expect(bodyText).toMatch(/Sep 26/i)` | Cart drawer displays derived dynamic pickup date. | Validates scheduling engine preserved chosen date. | Cart dropped pickup schedule or reverted to ASAP default. |
| `await expect(savedCardRadio).toBeVisible()` | Saved Visa ending in 1111 radio button is rendered. | Verifies user's saved payment profile loaded from vault. | Payment gateway failed to retrieve saved customer cards. |
| `await expect(placeOrderBtn).toBeEnabled()` | Place Order button is enabled and clickable. | Confirms total price, taxes, and payment method validated. | Form validation error (e.g. missing CVV, expired card). |
| `expect(orderDetails.confirmationNumber).toBeTruthy()` | Confirmation number is parsed from success screen. | Proves order record was created in Carvel POS/backend. | Transaction failed, payment declined, or order rejected. |

---

## PART 11 — TEST DESIGN & STRATEGY

### Testing Categories Explained
- **Smoke Testing (Sanity Testing)**: A high-level, fast suite validating that core critical paths work. E.g., Can a user log in, pick a store, and buy an ice cream? If Smoke fails, the build is rejected immediately.
- **Regression Testing**: A comprehensive suite testing all edge cases, validations, filters, sorting, and error messages.
- **Functional Testing**: Testing individual features in isolation (e.g. coupon code validation, password reset).
- **End-to-End (E2E) Testing**: Simulating a complete user journey through multiple interconnected systems (Auth0 → Store API → POS → Cart → Payment Gateway → Order Service).

### Why the Primary Test is Called a Smoke E2E
`orderJourney.smoke.spec.ts` is the **Primary Smoke E2E** because it touches every subsystem in one single, happy-path flow. If this test passes, the business knows that customers can successfully place orders and Carvel can generate revenue.

### What Should NOT Go Into a Single E2E Test
- Do NOT test 20 different invalid email formats inside the E2E checkout test. (Move to component/API tests).
- Do NOT test every ice cream flavor inside the E2E checkout test. (Move to PDP unit/visual tests).
- Keep E2E tests focused strictly on cross-system workflows.

---

## PART 12 — TEST HOOKS & FIXTURES

### Custom Fixture Architecture (`fixtures/testFixtures.ts`)
Instead of manually initializing Page Objects in every test:
```typescript
// Without Fixtures:
test('my test', async ({ page }) => {
  const header = new Header(page);
  const cart = new CartPage(page);
  // ...
});
```
This framework uses Playwright's `test.extend<CustomFixtures>()`:
```typescript
// fixtures/testFixtures.ts
export const test = base.extend<CustomFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  header: async ({ page }, use) => {
    await use(new Header(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  // ...
});
```
*How it works*: When a test requests `{ header, cartPage }`, Playwright automatically creates the `Page`, instantiates `Header` and `CartPage`, passes them into the test arguments, and disposes of them when the test completes.

### Lifecycle Hooks: `beforeEach` vs. `test`
- **`test.beforeEach(async ({ ... }) => { ... })`**: Runs before every test in the file. Best used for common prerequisites (e.g. navigating to Homepage).
- **When NOT to use Hooks**: If different tests in the same file require different preconditions (e.g., one guest user, one authenticated user), do not force login into `beforeEach`.

---

## PART 13 — CONFIGURATION DEEP DIVE

### Analysis of `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './tests',              // Directory where Playwright searches for test specs
  timeout: 120000,                 // Max time (2 mins) allowed for an entire test run
  expect: {
    timeout: 15000,                // Max time (15s) web-first expect() polls before failing
  },
  fullyParallel: false,            // Runs test files sequentially to prevent store/cart collisions
  forbidOnly: !!process.env.CI,    // Fails CI if test.only is accidentally left in code
  retries: process.env.CI ? 1 : 0, // In CI, retries failed tests once to combat network blips
  workers: process.env.CI ? 2 : 1, // Restricts worker concurrency to prevent server overload
  reporter: [
    ['html', { open: 'never' }],   // Generates interactive HTML dashboard
    ['list']                       // Prints real-time step status to terminal console
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://car.uat.focusbrands.com',
    ignoreHTTPSErrors: true,       // Bypasses SSL cert warnings on UAT environments
    trace: 'retain-on-failure',     // Saves full DOM recording only when a test fails
    screenshot: 'only-on-failure', // Captures PNG screenshot on error
    video: 'on',                   // Records video for every test run (pass or fail)
    actionTimeout: 20000,          // Max time (20s) for click(), fill() to find element
    navigationTimeout: 40000,      // Max time (40s) for page.goto() or page.waitForURL()
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1400, height: 900 }, // High-res desktop resolution
      },
    },
  ],
});
```

---

## PART 14 — TYPESCRIPT FOR AUTOMATION

### Why TypeScript Over Plain JavaScript?
1. **IntelliSense & Autocomplete**: Typing `cartPage.` immediately displays all available methods (`verifyStoreInCart`, `proceedToCheckout`).
2. **Compile-Time Error Catching**: Running `npx tsc --noEmit` instantly catches typos in variable names, mismatched function arguments, and invalid object keys before launching a browser.
3. **Type Contracts via Interfaces**:
   ```typescript
   export interface PickupStore {
     name: string;
     address: string;
     searchQuery: string;
   }
   ```
   Ensures test data conforms exactly to expected formats.

### Async / Await / Promises in Plain English
- **The Concept**: Browsers are asynchronous. When Playwright clicks a button, the web server takes 500ms to respond.
- **`Promise`**: A placeholder for a value that will arrive in the future (like an order buzzer at a restaurant).
- **`await`**: Tells Playwright: *"Pause execution on this line until the browser finishes this action before moving to the next line."*
- **`async`**: Marks a function as returning a Promise, enabling the use of `await`.

---

## PART 15 — ERROR HANDLING & DEBUGGING REAL-WORLD FLAKINESS

### Common Failure Categories in Web Automation

| Failure Type | Root Cause | Example in Carvel | Framework Solution |
|---|---|---|---|
| **Element Detachment** | React re-rendered the component while Playwright was clicking. | `#btn_startorder` replaced during Auth0 redirect hydration. | Catch error, re-resolve locator from fresh DOM, and click. |
| **Assertion Timeout** | Element did not attain expected state within 15s. | Cart display date was `"Sep 26"`, assertion expected `"09/26/2026"`. | Updated regex to derive month abbreviation (`Sep 26`) dynamically. |
| **Action Timeout** | Locator selector matched nothing or was obscured. | Store Locator modal overlay blocked button click. | Dismiss cookie banners and modals before interacting. |
| **Location Rejection** | Store is closed or unavailable for online orders. | "This location is not available for online ordering". | Store card loop automatically skips to next available store. |

---

## PART 16 — REPORTING, TRACES, & DEBUGGING WORKFLOW

### Practical Debugging Workflow for QA Engineers

```text
       Test Fails
           │
           ▼
1. Read Terminal Output (List Reporter)
   - Identify Step # (e.g. [STEP 16] Verifying Cart details)
   - Read exact error (e.g. Expected substring: "09/26/2026", Received: "sep 26")
           │
           ▼
2. Inspect Screenshot (test-results/.../test-failed-1.png)
   - Check if an unexpected modal or error toast covered the screen.
           │
           ▼
3. Open Playwright Trace (npx playwright show-trace test-results/.../trace.zip)
   - Scrub through DOM snapshots before and after the action.
   - Inspect network log for failed 4xx/5xx API requests.
           │
           ▼
4. Formulate Targeted Fix
   - Update Page Object locator or parsing logic.
           │
           ▼
5. Compile and Validate Once
   - npx tsc --noEmit
   - npx playwright test <spec> --headed
```

---

## PART 17 — GIT, BRANCHING, & REPOSITORY DISCIPLINE

### Industrial Git Workflow

```text
main (Protected — Always Passing Production Code)
  │
  └── develop (Integration Branch)
        │
        └── feature/checkout-saved-card (Your Working Branch)
              │
              ├── Commit 1: feat(pages): add saved card selection logic
              ├── Commit 2: fix(cart): support abbreviated date formats
              │
              └── Pull Request (PR) → Code Review → CI Pipeline → Merge to develop
```

### Git Command Cheatsheet
```bash
git checkout develop
git pull origin develop
git checkout -b feature/cart-date-fix
git add pages/CartPage.ts
git commit -m "fix(cart): derive dynamic date format to match Carvel cart drawer"
git push origin feature/cart-date-fix
```

---

## PART 18 — AUTOMATION CODE REVIEW CHECKLIST

Before submitting an automation PR, verify:
- [ ] **No Hardcoded Credentials**: Passwords/tokens loaded strictly from environment variables.
- [ ] **No Arbitrary Sleep Calls**: No `page.waitForTimeout(5000)` unless absolutely necessary for animation transitions.
- [ ] **Locators Inside Page Objects**: No raw `page.locator()` selectors in test spec files.
- [ ] **Resilient Selectors**: Prefer `id`, `data-testid`, or semantic roles over fragile XPath.
- [ ] **TypeScript Clean**: `npx tsc --noEmit` passes with 0 errors.
- [ ] **Externalized Test Data**: Store addresses and product names stored in `test-data/*.json`.
- [ ] **Proper Logging**: Clear step indicators (`[STEP X]`) for debuggability in CI.

---

## PART 19 — CI/CD PIPELINE INTEGRATION

### Typical GitHub Actions Workflow (`.github/workflows/playwright.yml`)
```yaml
name: Carvel Playwright Smoke Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    timeout-minutes: 15
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium
      - name: TypeScript Check
        run: npx tsc --noEmit
      - name: Run Playwright Smoke Tests
        env:
          BASE_URL: ${{ secrets.UAT_BASE_URL }}
          CARVEL_USERNAME: ${{ secrets.CARVEL_USERNAME }}
          CARVEL_PASSWORD: ${{ secrets.CARVEL_PASSWORD }}
          CI: true
        run: npx playwright test tests/smoke/orderJourney.smoke.spec.ts --reporter=list,html
      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

---

## PART 20 — PARALLEL EXECUTION & STATE ISOLATION

### Why Order Placement Tests Require Careful Concurrency
In our `playwright.config.ts`, `fullyParallel: false` and `workers: 1` are currently configured.
- **The Challenge**: If 5 tests run in parallel using the same test user, Test A might clear the shopping cart while Test B is customizing an item on the PDP!
- **Industrial Solution**:
  1. Use unique test user accounts per worker (`user_worker_1@example.com`, `user_worker_2@example.com`).
  2. Isolate test data: Worker 1 orders from Store A, Worker 2 orders from Store B.

---

## PART 21 — CROSS-BROWSER & DEVICE TESTING

Playwright supports three rendering engines natively:
1. **Chromium**: Powers Chrome, Edge, Brave, Opera.
2. **WebKit**: Powers Apple Safari (macOS, iOS).
3. **Firefox**: Powers Mozilla Firefox.

### Running Against Multiple Browsers
To test across browsers, add projects to `playwright.config.ts`:
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
]
```
Execute with:
```bash
npx playwright test --project=firefox
```

---

## PART 22 — API + UI HYBRID AUTOMATION STRATEGY

### Modern Hybrid Automation
UI automation is slow (the 21-step journey takes ~1.5 - 2 minutes). In enterprise setups, teams combine API and UI:
- **API Pre-condition**: Use Playwright's `request` API to log in and generate an Auth token in 200ms.
- **Cookie Injection**: Inject the session token directly into `browserContext.addCookies()`.
- **UI Focus**: Start the browser directly on the Store Locator or Menu page, saving 30 seconds of UI login clicks!

---

## PART 23 — THE TEST PYRAMID IN E-COMMERCE

```text
               / \
              /   \
             / E2E \         ◄── (Our Primary Smoke Flow: 1-5 tests)
            /-------\            Slowest, highest cost, highest confidence
           / Integration \   ◄── (API + UI components: 50 tests)
          /---------------\      Validates service interactions
         /   Unit / Logic  \ ◄── (Functions, calculations: 1000s of tests)
        /-------------------\    Subtotal, tax calculation, date formatters
```
*Why this matters*: Do not automate 500 edge cases as slow E2E tests. Automate pricing calculations and date formatters at the unit/integration level, keeping E2E suites lean and lightning-fast.

---

## PART 24 — MAINTAINABILITY & HANDLING UPSTREAM UI CHANGES

### Scenario: Carvel Renames `#btn_startorder`
If Carvel engineering updates the homepage and replaces `#btn_startorder` with:
```html
<button data-testid="start-order-cta">START ORDER</button>
```

#### How POM Protects You:
- **Files Modified**: Exactly **ONE** file: `pages/Header.ts`.
- **Change Made**:
  ```diff
  - this.startOrderBtn = page.locator('#btn_startorder');
  + this.startOrderBtn = page.locator('[data-testid="start-order-cta"]');
  ```
- **Tests Updated**: **ZERO**. All smoke, regression, and navigation tests immediately pass without a single line change in test files.

---

## PART 25 — CURRENT STRENGTHS VS. POTENTIAL IMPROVEMENTS

### Currently Good
1. **True E2E Business Coverage**: Successfully tests the full revenue pipeline to actual order confirmation in UAT.
2. **Dynamic UI Handling**: Automatically finds enabled future dates/times and skips rejected stores.
3. **Resilient Detachment Recovery**: Handles React hydration node replacement without flaking.
4. **Strong Typing & Fixtures**: Uses TypeScript and Playwright custom fixtures for clean dependency injection.
5. **Telemetry Monitoring**: Captures frontend console errors and HTTP 4xx/5xx network responses automatically.

### Potential Improvements

| # | Improvement | Why It Works Currently | Potential Limitation | Recommended Industrial Practice | Priority |
|---|---|---|---|---|---|
| **1** | Auth State Storage (`storageState`) | Logs in via UI in Step 2 on every run. | Adds ~25 seconds of Auth0 UI interactions to every test run. | Log in once in a setup project, save `auth.json`, and reuse session. | Medium |
| **2** | ARIA / Role Selectors | Uses IDs (`#btn_pickup`) and CSS (`.storeCardContainer`). | IDs might change if developers refactor component libraries. | Migrate toward `getByRole('button', { name: 'Pickup' })`. | Low |
| **3** | Dynamic User Provisioning | Relies on one shared UAT user in `.env`. | Cannot scale to parallel workers without test account collisions. | Use an API script to provision unique test users per worker. | Medium |

---

## PART 26 — COMPLETE VISUAL FLOW DIAGRAMS

### Master End-to-End Execution Flow

```text
 ┌──────────────┐
 │     .env     │ ──► CARVEL_USERNAME, CARVEL_PASSWORD, BASE_URL
 └──────┬───────┘
        ▼
 ┌──────────────┐
 │ playwright.  │ ──► Sets 120s timeout, Chromium, 1400x900 viewport, retain-on-failure artifacts
 │  config.ts   │
 └──────┬───────┘
        ▼
 ┌──────────────┐
 │ testFixtures │ ──► Injects new HomePage, Header, StoreLocatorPage, CheckoutPage into test
 └──────┬───────┘
        ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      tests/smoke/orderJourney.smoke.spec.ts                            │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ [Step 1]  homePage.navigate() & verifyPageLoaded()                                     │
 │ [Step 2]  header.clickSignIn() ──► loginPage.login() (Auth0)                           │
 │ [Step 3]  header.clickStartOrder() (Resilient to React DOM detachment)                │
 │ [Step 4]  orderTypePage.selectPickup()                                                 │
 │ [Step 5]  storeLocatorPage.searchAndSelectStore("26 Broadway, NY")                     │
 │           └─► Loops store cards, tests availability, confirms "Carvel Qu Sandbox"      │
 │ [Step 6]  pickupPage.selectPickupLater()                                               │
 │ [Step 7]  pickupPage.selectDynamicDateAndTime()                                        │
 │           └─► Picks available day (e.g. 09/26/2026) & time (7:00 AM)                   │
 │ [Step 9]  pickupPage.confirmSchedule()                                                 │
 │ [Step 10] menuPage.selectCategory("Ice Cream")                                         │
 │ [Step 11] productListingPage.selectProduct("SCOOPED ICE CREAM")                        │
 │ [Step 12] productDetailPage.selectSizeAndFlavor("Small Cup", "Vanilla")                │
 │ [Step 14] productDetailPage.addToCart()                                                │
 │ [Step 15] cartPage.verifyCartLoaded()                                                  │
 │ [Step 16] cartPage.verifyPickupScheduleInCart() ──► Matches "Sep 26 at 07:00 am"       │
 │ [Step 17] cartPage.proceedToCheckout()                                                 │
 │ [Step 18] checkoutPage.verifyCheckoutPageLoaded()                                      │
 │ [Step 19] checkoutPage.locateAndVerifySavedCard() ──► Selects Visa ending in 1111      │
 │ [Step 20] checkoutPage.placeOrder()                                                    │
 │ [Step 21] checkoutPage.verifyOrderConfirmation()                                       │
 │           └─► Extracts Confirmation # (e.g. 46813659441709057), Status, Total          │
 └──────────────────────────────────────┬─────────────────────────────────────────────────┘
                                        │
                                        ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              Test Results & Telemetry                                  │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ - Confirmation Number: 46813659441709057                                               │
 │ - Order Status: Scheduled | Total: $19.56                                              │
 │ - Frontend Console Errors: Intercepted & Logged                                        │
 │ - HTTP 4xx/5xx Responses: 0 Network Errors                                             │
 │ - Final Status: 1 passed (2.0m)                                                        │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 27 — EXPLAIN THIS FRAMEWORK LIKE I AM NEW (INTERVIEW GUIDE)

### Model Elevator Pitch: "Explain your Playwright framework"
> *"Our test automation framework is built with Playwright and TypeScript for testing Carvel’s e-commerce ordering platform. It implements the Page Object Model across 11 dedicated page classes to keep tests clean and maintainable. We use custom Playwright fixtures to automatically inject page objects into tests without manual boilerplate. Configuration is centralized in `playwright.config.ts`, and test data is separated into JSON files, with credentials securely managed via environment variables. The framework is engineered to handle real-world SPA flakiness—such as dynamic store availability, React DOM re-renders during hydration, and dynamic calendar slot selection. Our primary E2E smoke test runs headed or headless, executing a full 21-step purchase from Auth0 sign-in through store selection, product customization, saved credit card selection, and order confirmation verification with zero network errors."*

### Top 20 Interview Questions & Practical Answers

#### 1. Why did you choose Playwright over Selenium or Cypress?
**Answer**: Playwright runs directly against browser protocols (CDP) with native multi-tab, multi-origin support (crucial for Auth0 redirects). It has built-in auto-waiting, eliminating 90% of flakiness, and generates rich traces with zero configuration.

#### 2. Why TypeScript instead of JavaScript?
**Answer**: TypeScript provides compile-time type safety. Running `npx tsc --noEmit` catches typos, invalid method signatures, and missing object properties in seconds before launching expensive browser runs.

#### 3. What is Page Object Model (POM) and why use it?
**Answer**: POM encapsulates web elements and actions inside page classes. Tests read like business steps (`header.clickStartOrder()`), while locators are maintained in one single place.

#### 4. How do you manage credentials securely?
**Answer**: Credentials reside in a local `.env` file that is strictly ignored by Git. In CI/CD, they are injected via GitHub Actions Secrets. Code references them via `process.env`.

#### 5. How do you select locators in this project?
**Answer**: We prioritize stable IDs (`#btn_startorder`) and custom test attributes (`[data-testid="btn_saved_Card"]`), followed by semantic roles and scoped text queries.

#### 6. How did you solve the React DOM detachment error on Start Order?
**Answer**: After redirecting from Auth0, React was hydrating the header and replacing DOM nodes. We updated `Header.clickStartOrder()` to wait for `domcontentloaded`, verify attachment, and catch any detachment during click to re-resolve `#btn_startorder` against the fresh DOM.

#### 7. How do you handle dynamic dates in the Cart?
**Answer**: The calendar input yields `09/26/2026`, but the Carvel cart drawer displays `Sep 26 at 07:00 am`. `CartPage.verifyPickupScheduleInCart()` parses the month and day numbers dynamically and tests a case-insensitive regex against the drawer text.

#### 8. What is the difference between a Browser, Context, and Page?
**Answer**: A Browser is the parent browser process. A Context is an isolated incognito session with independent cookies. A Page is a single tab inside that Context.

#### 9. How do you handle unavailable stores?
**Answer**: `StoreLocatorPage` iterates through store cards in a loop. It clicks "ORDER AHEAD" and checks if Carvel displays an "unavailable for online ordering" modal. If rejected, it dismisses the popup and tests the next store card.

#### 10. Why avoid `page.waitForTimeout(5000)`?
**Answer**: Fixed sleeps waste execution time if the UI is fast, and fail if the server takes 5001ms. Event-driven auto-waiting (`expect(locator).toBeVisible()`) proceeds the millisecond the element appears.

#### 11. How do you handle product customization on the PDP?
**Answer**: Carvel uses custom radio components. In `ProductDetailPage.ts`, we use `page.evaluate()` to check the radio buttons and dispatch synthetic React `change` events so the application enables the Add to Cart button with updated pricing.

#### 12. How does Playwright's auto-waiting work?
**Answer**: Before performing an action (like `click()`), Playwright automatically performs actionability checks: verifies the element is attached, visible, stable, enabled, and receives pointer events.

#### 13. What reporters do you use?
**Answer**: We use the `list` reporter for step-by-step console streaming during development/CI, and the `html` reporter for visual post-run dashboards.

#### 14. What are Playwright traces?
**Answer**: Traces record full DOM snapshots, network requests, console logs, and action timings. When a test fails, `trace.zip` lets you step backwards and forwards in time to inspect the exact DOM state.

#### 15. How do you verify the final order?
**Answer**: `CheckoutPage.verifyOrderConfirmation()` waits for URL transition, checks for confirmation headers, and parses the confirmation number, status, store name, and total via regular expressions.

#### 16. What is the purpose of `testFixtures.ts`?
**Answer**: It extends Playwright's `test` runner to automatically instantiate and provide all 11 Page Objects to test functions, removing boilerplate setup code.

#### 17. How do you catch frontend errors during the test?
**Answer**: In `orderJourney.smoke.spec.ts`, we attach listeners: `page.on('console')` to count console errors and `page.on('response')` to log any HTTP responses with status `>= 400`.

#### 18. How do you support multiple browsers?
**Answer**: By defining projects in `playwright.config.ts` for Chromium, Firefox, and WebKit, and running them via `npx playwright test --project=<name>`.

#### 19. What is the difference between smoke and regression testing?
**Answer**: Smoke tests validate the critical happy path (e.g. placing an order) to ensure the build is deployable. Regression tests exhaustively cover all edge cases, negative flows, and secondary features.

#### 20. How would you run this in CI/CD?
**Answer**: In a GitHub Actions workflow: check out code, install Node.js and Playwright binaries, run `npx tsc --noEmit`, execute tests in headless mode, and upload HTML reports as build artifacts.

---

## PART 28 — STRUCTURED STEP-BY-STEP STUDY ROADMAP

### Level 1: JavaScript & TypeScript Fundamentals
- **Learn**: `async/await`, Promises, arrow functions, ES6 classes, interfaces, import/export.
- **Project Example**: `utils/testData.ts` (Interfaces) and `pages/Header.ts` (Classes).
- **Exercise**: Create a TypeScript interface for an ice cream cake with properties: name, price, servings.
- **Interview Question**: *"Why can't you use `await` outside an `async` function?"*

### Level 2: Playwright Core Architecture
- **Learn**: Browser, BrowserContext, Page, lifecycle of a test.
- **Project Example**: `playwright.config.ts` and `orderJourney.smoke.spec.ts`.
- **Exercise**: Write a small script that opens two separate browser contexts and verifies they don't share cookies.
- **Interview Question**: *"How does Playwright achieve complete isolation between tests?"*

### Level 3: Locator Mastery
- **Learn**: `page.locator()`, chaining, filtering, `.nth()`, `.first()`, scoped queries.
- **Project Example**: `StoreLocatorPage.ts:selectFirstAvailableStoreOrderAhead()`.
- **Exercise**: Locate an "Add to Cart" button that only exists inside a specific product card.
- **Interview Question**: *"Why is scoping locators safer than querying globally?"*

### Level 4: Assertions & Auto-Waiting
- **Learn**: Web-first assertions, polling timeouts, regex text matching.
- **Project Example**: `CartPage.ts:verifyPickupScheduleInCart()`.
- **Exercise**: Write an assertion that verifies a subtotal string matches a `$XX.XX` currency format.
- **Interview Question**: *"What makes Playwright web assertions different from standard Jest or Chai assertions?"*

### Level 5: Page Object Model Implementation
- **Learn**: Encapsulating locators, creating business-level page methods, keeping tests clean.
- **Project Example**: `pages/ProductDetailPage.ts`.
- **Exercise**: Convert a raw 10-line script clicking size/flavor into a clean POM class method.
- **Interview Question**: *"What should NEVER be included inside a Page Object class?"* (Answer: Test assertions, except for page-load verifications).

### Level 6: Test Data Management
- **Learn**: Decoupling JSON test data from test execution, typing data with TypeScript.
- **Project Example**: `test-data/stores.json` and `utils/testData.ts`.
- **Exercise**: Add a new store search query to `stores.json` and update the TypeScript interface.
- **Interview Question**: *"How do you handle environment-specific test data across UAT and Production?"*

### Level 7: Authentication & Security
- **Learn**: Auth0 redirects, multi-domain navigation, environment variable handling.
- **Project Example**: `pages/LoginPage.ts` and `.env`.
- **Exercise**: Write a test verifying that invalid credentials display an Auth0 error message.
- **Interview Question**: *"What security risks arise if you commit `.env` to Git?"*

### Level 8: Dynamic UI & Flakiness Handling
- **Learn**: Handling React hydration, DOM detachment, dynamic calendar slots.
- **Project Example**: `pages/Header.ts:clickStartOrder()` and `pages/PickupPage.ts`.
- **Exercise**: Write a retry loop using Playwright's `toPass()` for an element that re-renders during load.
- **Interview Question**: *"How do you diagnose and fix an 'element detached from DOM' error?"*

### Level 9: Custom Fixtures
- **Learn**: `test.extend()`, dependency injection, fixture lifecycle.
- **Project Example**: `fixtures/testFixtures.ts`.
- **Exercise**: Add a custom fixture that automatically captures page console errors.
- **Interview Question**: *"How do custom fixtures eliminate boilerplate in Playwright tests?"*

### Level 10: Configuration & Runner Tuning
- **Learn**: Timeouts, retries, workers, artifact recording rules.
- **Project Example**: `playwright.config.ts`.
- **Exercise**: Configure the project to capture video only when a test fails.
- **Interview Question**: *"When should you set `fullyParallel: false` vs `true`?"*

### Level 11: Debugging & Trace Viewer
- **Learn**: Reading list reporter output, opening `trace.zip`, stepping through DOM snapshots.
- **Project Example**: Inspecting `test-results/` after a failure.
- **Exercise**: Run a test with `--trace on` and view the resulting trace in browser.
- **Interview Question**: *"How does Trace Viewer help you debug CI failures you cannot reproduce locally?"*

### Level 12: Git Discipline & Branching
- **Learn**: Feature branching, conventional commits, pull requests.
- **Project Example**: Repository Git workflow.
- **Exercise**: Create a branch `feature/cart-assertions`, make a change, and generate a diff.
- **Interview Question**: *"Why should you never commit directly to the `main` branch?"*

### Level 13: CI/CD Pipeline Automation
- **Learn**: GitHub Actions, headless test execution, secrets injection, artifact archiving.
- **Project Example**: CI/CD configuration blueprint in Part 19.
- **Exercise**: Write a YAML workflow file that runs Playwright tests on every pull request.
- **Interview Question**: *"How do you pass passwords securely into a Playwright test running on GitHub Actions?"*

### Level 14: Parallel Execution & Concurrency
- **Learn**: Worker processes, test isolation, managing shared account state.
- **Project Example**: Configuration workers property.
- **Exercise**: Explain how you would run 4 workers without cart collisions.
- **Interview Question**: *"What happens if two parallel tests log in with the same user account simultaneously?"*

### Level 15: Cross-Browser & Mobile Emulation
- **Learn**: Testing WebKit, Firefox, and mobile viewport devices (`Pixel 5`, `iPhone 13`).
- **Project Example**: `playwright.config.ts` projects array.
- **Exercise**: Add a mobile Safari project to `playwright.config.ts`.
- **Interview Question**: *"Why is testing Chromium not enough for an e-commerce brand like Carvel?"*

### Level 16: API + UI Hybrid Architecture
- **Learn**: Playwright `request` context, session token injection, skipping UI login.
- **Project Example**: Part 22 architecture.
- **Exercise**: Write an API request that fetches store locations and passes the first ID to the UI.
- **Interview Question**: *"How can API integration make a 2-minute UI test run in 30 seconds?"*

### Level 17: Enterprise Framework Architecture
- **Learn**: Scalability, reporting dashboards, telemetry monitoring, maintainability over years.
- **Project Example**: The entire `carvel-playwright` codebase.
- **Exercise**: Conduct a complete architecture review of this framework against industrial standards.
- **Interview Question**: *"How would you architect a test automation framework from scratch for a new enterprise project?"*

---

## MY FRAMEWORK IN ONE PAGE (CHEAT SHEET)

```text
====================================================================================================
                        CARVEL PLAYWRIGHT AUTOMATION FRAMEWORK CHEAT SHEET
====================================================================================================

1. CORE ARCHITECTURE
   • Pattern: Page Object Model (POM) with Custom Fixtures.
   • Stack: Playwright (^1.63.0) + TypeScript (^7.0.2) + Node.js (CommonJS).
   • AUT: Carvel UAT Online Ordering (https://car.uat.focusbrands.com).
   • Primary Spec: tests/smoke/orderJourney.smoke.spec.ts (21-step complete purchase journey).

2. KEY DIRECTORIES
   • pages/        : 11 Page Objects (Header, LoginPage, StoreLocatorPage, CartPage, CheckoutPage, etc.)
   • fixtures/     : testFixtures.ts (Extends base test with auto-injected Page Objects)
   • test-data/    : stores.json, products.json, users.json (Decoupled test input data)
   • utils/        : constants.ts (URLs, standard timeouts), testData.ts (Typed data loaders)
   • tests/smoke/  : Smoke test suite (E2E order journey, auth, cart, navigation, menu, PDP)

3. EXECUTION COMMANDS
   • Type Check    : npx tsc --noEmit
   • Run Primary   : npx playwright test tests/smoke/orderJourney.smoke.spec.ts --headed --reporter=list
   • Run All Smoke : npx playwright test tests/smoke --reporter=list
   • View Report   : npx playwright show-report
   • View Trace    : npx playwright show-trace test-results/<folder>/trace.zip

4. RESILIENT AUTOMATION HIGHLIGHTS
   • React Hydration: Header.ts re-resolves #btn_startorder & catches detachment during React render.
   • Store Selection: StoreLocatorPage.ts loops store cards & auto-skips stores rejected by Carvel UAT.
   • Dynamic Dates  : PickupPage.ts discovers future date/time slots via React Datepicker calendar.
   • Format Mapping : CartPage.ts maps "09/26/2026" to Carvel cart format "Sep 26 at 07:00 am".
   • Saved Card     : CheckoutPage.ts selects saved Visa ending in 1111 via [data-testid="btn_saved_Card"].
   • Single Submit  : Place Order clicked exactly once; parses confirmation # & order total.

5. SECURITY & SECRETS
   • .env (Git-ignored) stores CARVEL_USERNAME, CARVEL_PASSWORD, BASE_URL.
   • .env.example defines template keys for developers and CI/CD pipelines.
   • Passwords never committed to Git; injected via GitHub Actions Secrets in CI.

6. ASSERTION HIERARCHY
   • Stable IDs (#btn_startorder) > data-testid ([data-testid="btn_saved_Card"]) > Semantic Roles > Text.
   • Web-first auto-polling assertions: expect(locator).toBeVisible({ timeout: 15000 }).

7. TELEMETRY & HEALTH CHECKS
   • page.on('console') captures frontend JS errors.
   • page.on('response') intercepts and verifies HTTP 4xx/5xx network errors.
====================================================================================================
```
