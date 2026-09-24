# Carvel UAT Automation Exploration & Application Analysis Document

## Target Environment
- **Target URL**: `https://car.uat.focusbrands.com/`
- **Application Name**: Carvel (GoTo Foods / Focus Brands)
- **Environment**: UAT

---

## Discovered Application Architecture & Key User Journey

### 1. Homepage & Header Navigation
- **URL**: `https://car.uat.focusbrands.com/`
- **Page Title**: `Carvel Ice Cream & Cakes | America's Freshest Ice Cream | Carvel`
- **Header Elements**:
  - Logo: `img#img_headerlogo` / `a[aria-label="carvel logo"]`
  - Navigation Links: `MENU` (`#Menu_Menu`), `LOCATIONS` (`#Locations_Locations`), `GIFT CARDS` (`#Gift Cards_Gift Cards`), `FUDGIE FANATICS` (`#Fudgie Fanatics_Fudgie Fanatics`)
  - Sign In Button: `#link_guestProfile` / `#signin-button` / `button:has-text("SIGN IN")`
  - Start Order Button: `#btn_startorder` / `button:has-text("START ORDER")`
  - Cart Icon: `#link_cart` (`.cartIcon` / `[aria-label="cart icon"]`)

### 2. Store Search / Order Type Selection
- **URL**: `https://car.uat.focusbrands.com/store-search`
- **Order Types**:
  - `PICKUP`: `#btn_pickup`
  - `DELIVERY`: `#btn_delivery`
- **Search Bar**: `input[placeholder*="Street, City, State, Zip"]` / `input[type="text"]`
- **Suggestions Dropdown**: `.storeSearchItem button`
- **Target Pickup Test Location**:
  - Store Name: `Carvel Qu Sandbox`
  - Address: `26 Broadway, New York, NY 10004`
  - Selection Button: `button:has-text("SELECT SHOPPE")` within store card `.filter({ hasText: 'Carvel Qu Sandbox' })`

### 3. Pickup Later & Schedule Selection Modal
- **Order Info Section**: Displays `Pickup at Carvel Qu Sandbox`, `ASAP`, and `Change` (`#order_changeButtonId`).
- **Modal Trigger**: Triggered when `SELECT SHOPPE` is clicked or when `Change` (`#order_changeButtonId`) is clicked on the menu page.
- **Schedule Options**:
  - `ASAP`: `#orderInfoAsapBtn`
  - `Later`: `#orderInfoLaterBtn`
- **Pickup Later Date & Time Controls**:
  - When `Later` (`#orderInfoLaterBtn`) is clicked:
    - Date Select: `select[id*="date"]` (Dynamic available dates)
    - Time Select: `select[id*="time"]` (Dynamic available pickup times)
    - Confirmation Button: `#orderInfoConfirmBtn` (`button:has-text("CONFIRM")`)

### 4. Menu & Category Product Listing Page (PLP)
- **Menu URL**: `https://car.uat.focusbrands.com/menu/carvel-qu-sandbox-000`
- **Category Sub-Pages**: `https://car.uat.focusbrands.com/menu/carvel-qu-sandbox-000/<category>`
- **Category Links**:
  - `a#menuPageList[href*="/menu/ice-cream"]` ("ICE CREAM")
  - `a#menuPageList[href*="/menu/sundaes-shakes"]` ("SUNDAES & SHAKES")
  - `a#menuPageList[href*="/menu/ready-now-cakes"]` ("READY NOW CAKES")
  - `a#menuPageList[href*="/menu/carvel-bundles"]` ("CARVEL BUNDLES")
  - `a#menuPageList[href*="/menu/limited-time"]` ("LIMITED TIME")

### 5. Product Detail Page (PDP) & Customization
- **Product Tiles**: `.productImageTitle` (e.g. `SCOOPED ICE CREAM`)
- **PDP Customization Sections**:
  - Required Size Accordion: `SCOOPED SIZE CHOICE`
  - Required Flavor Accordion: `ICE CREAM FLAVOR CHOICE`
  - Optional Toppings Accordion: `EXTRA TOPPINGS CHOICE`
- **Radio Selectors**: `input[type="radio"]` with `data-testid="product_list_..."`
- **Add to Cart Button**: `#btn_add_to_cart` (Text: `ADD TO CART $...`)

### 6. Cart Verification
- **Cart Access**: Header Cart Icon `#link_cart` (`.cartIcon`) or direct navigation to `/cart` (Note: `/cart` returns 404 if accessed directly without active session, cart is state-dependent).
- **Cart Elements**: Item Name, Quantity, Price, Selected Store (`Carvel Qu Sandbox`), Order Type (`Pickup`), Pickup Time.

---

## Network & API Behavior Notes
- `POST https://dev.focusbrands.com/ps/v1/cart/getorcreate` initializes session on store select.
- CORS/CSP notices present for analytics/truyo domains in UAT. `ignoreHTTPSErrors: true` is recommended for UAT execution.

---

## Stable Selector Strategy
| Component | UI Element | Primary Playwright Selector / Locator |
|---|---|---|
| Header | Logo | `page.locator('#img_headerlogo, a[aria-label="carvel logo"]')` |
| Header | Sign In Link | `page.locator('#link_guestProfile, #signin-button')` |
| Header | Start Order Button | `page.locator('#btn_startorder')` |
| Store Search | Pickup Tab | `page.locator('#btn_pickup')` |
| Store Search | Address Search Input | `page.locator('input[placeholder*="Street"]')` |
| Store Search | Address Suggestion | `page.locator('.storeSearchItem button').first()` |
| Store Search | Select Shoppe Button | `page.locator('button:has-text("SELECT SHOPPE")')` |
| Order Info | Change Button | `page.locator('#order_changeButtonId')` |
| Schedule Modal | Pickup Later Button | `page.locator('#orderInfoLaterBtn')` |
| Schedule Modal | Date Select | `page.locator('select[id*="date"], select').nth(0)` |
| Schedule Modal | Time Select | `page.locator('select[id*="time"], select').nth(1)` |
| Schedule Modal | Confirm Button | `page.locator('#orderInfoConfirmBtn')` |
| Menu | Category Link | `page.locator('a#menuPageList[href*="/ice-cream"]')` |
| Menu | Product Card | `page.locator('.productImageTitle:has-text("SCOOPED ICE CREAM")')` |
| PDP | Radio Inputs | `page.locator('input[type="radio"]')` |
| PDP | Add to Cart Button | `page.locator('#btn_add_to_cart')` |
| Header | Cart Icon | `page.locator('#link_cart')` |
