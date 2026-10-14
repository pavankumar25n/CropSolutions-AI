# CropSolution AI

Smarter Farming. Stronger Communities.

Responsive React + Vite hackathon demo for small farmers who may struggle to sell limited individual harvests to bulk buyers. Farmers can add harvests, group compatible crops toward a buyer's quantity requirement, review potential buyer listings, and estimate earnings after transport and other costs.

## Requirements

Node.js 20.19+ and npm.

## Run on Windows

Open PowerShell in `P:\CropSolutions` and run:

```powershell
cd P:\CropSolutions
npm install
npm run dev
```

Open Vite's local URL, usually http://localhost:5173. Use `npm run build` to build and `npm run preview` to preview a production build.

## Features

- Dashboard, harvest entry, collective matching, buyer matching, earnings calculator, and assistant fallback.
- Suggested workflow: add a harvest → group compatible crops → review potential buyers → estimate earnings.
- Harvest entries save in this browser's local storage.
- Sample farmers and demo buyer listings are illustrative only. They are not verified buyers, offers, or transactions.
- Buyer matches are suggestions based on crop, pooled quantity, and the selected buyer region. The app does not calculate travel distance or confirm logistics.
- The assistant states that no AI API is configured. No API keys are included.
- Estimates exclude taxes, commissions, spoilage, and market price changes.

## Tests

Run the test suite once:

```powershell
npm test
```

Run tests in watch mode while editing:

```powershell
npm run test:watch
```

The suite checks harvest grouping and shortfalls, buyer filters, earnings calculations, form validation, and key harvest, matching, and earnings UI interactions.

## Buyer requests

Use the Buyer requests page to enter a buyer name, crop, required quantity, preferred region, and offered price per kg. Requests are saved in this browser and can appear in matching when the crop, quantity, and region fit. Saving a request does not contact or notify the buyer.
