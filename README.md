# CropSolution AI

Smarter Farming. Stronger Communities.

Responsive React + Vite hackathon demo for pooling harvests, finding sample bulk buyers, and estimating earnings.

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
- Harvest entries save in this browser's local storage.
- Farmer entries and buyer listings are demo data, not offers or transactions.
- The assistant states that no AI API is configured. No API keys are included.
- Estimates exclude taxes, commissions, spoilage, and market price changes.

## Buyer requests

Use the Buyer requests page to enter a buyer name, crop, required quantity, preferred region, and offered price per kg. Requests are saved in this browser and can appear in matching when the crop, quantity, and region fit. Saving a request does not contact or notify the buyer.
