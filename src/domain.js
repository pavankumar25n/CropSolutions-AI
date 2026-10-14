export const DEMO_HARVESTS = [
  {
    id: 1,
    name: "Demo: Kavita Patil",
    village: "Deola",
    crop: "Onion",
    qty: 1200,
    price: 18,
    date: "2026-10-21",
  },
  {
    id: 2,
    name: "Demo: Ramesh Jadhav",
    village: "Deola",
    crop: "Onion",
    qty: 850,
    price: 17,
    date: "2026-10-22",
  },
  {
    id: 3,
    name: "Demo: Suresh Pawar",
    village: "Malegaon",
    crop: "Onion",
    qty: 700,
    price: 18,
    date: "2026-10-24",
  },
  {
    id: 4,
    name: "Demo: Asha Shinde",
    village: "Niphad",
    crop: "Tomato",
    qty: 640,
    price: 22,
    date: "2026-10-20",
  },
  {
    id: 5,
    name: "Demo: Ganesh More",
    village: "Deola",
    crop: "Onion",
    qty: 950,
    price: 19,
    date: "2026-10-25",
  },
];

export const DEMO_BUYERS = [
  {
    id: "demo-1",
    demo: true,
    name: "Nashik Fresh Produce Co-op",
    crop: "Onion",
    qty: 2000,
    region: "Nashik region",
    price: 21,
  },
  {
    id: "demo-2",
    demo: true,
    name: "GreenBasket Wholesale",
    crop: "Onion",
    qty: 3000,
    region: "Nashik region",
    price: 20,
  },
  {
    id: "demo-3",
    demo: true,
    name: "Sahyadri Foods",
    crop: "Tomato",
    qty: 500,
    region: "Pune region",
    price: 25,
  },
  {
    id: "demo-4",
    demo: true,
    name: "Vidarbha Market Link",
    crop: "Onion",
    qty: 1500,
    region: "Nagpur region",
    price: 19,
  },
];

const normalized = (value) => String(value ?? "").trim().toLocaleLowerCase();
const hasNumericValue = (value) =>
  value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
const positiveNumber = (value) => hasNumericValue(value) && Number(value) > 0;
const nonNegativeNumber = (value) => hasNumericValue(value) && Number(value) >= 0;

/** Select the largest compatible contributions until the target is met. */
export function groupHarvests(harvests, crop, targetQuantity) {
  if (!Array.isArray(harvests) || !positiveNumber(targetQuantity)) {
    return { list: [], qty: 0, targetReached: false };
  }

  const target = Number(targetQuantity);
  const compatible = harvests
    .filter(
      (harvest) =>
        normalized(harvest.crop) === normalized(crop) &&
        positiveNumber(harvest.qty),
    )
    .map((harvest, index) => ({ harvest, index }))
    .sort(
      (a, b) => Number(b.harvest.qty) - Number(a.harvest.qty) || a.index - b.index,
    );

  const list = [];
  let qty = 0;
  for (const { harvest } of compatible) {
    if (qty >= target) break;
    list.push(harvest);
    qty += Number(harvest.qty);
  }

  return { list, qty, targetReached: qty >= target };
}

/** Return buyer listings that fit the pooled quantity and selected region. */
export function matchBuyers(buyers, crop, availableQuantity, region = "All regions") {
  if (!Array.isArray(buyers) || !positiveNumber(availableQuantity)) return [];

  return buyers.filter(
    (buyer) =>
      normalized(buyer.crop) === normalized(crop) &&
      positiveNumber(buyer.qty) &&
      Number(buyer.qty) <= Number(availableQuantity) &&
      (region === "All regions" || buyer.region === region),
  );
}

/** Calculate a planning estimate, treating blank or invalid values as zero. */
export function calculateEarnings({ qty, price, transport, other } = {}) {
  const safeAmount = (value) => (nonNegativeNumber(value) ? Number(value) : 0);
  const quantity = safeAmount(qty);
  const unitPrice = safeAmount(price);
  const transportCost = safeAmount(transport);
  const otherCost = safeAmount(other);
  const gross = quantity * unitPrice;
  return {
    gross,
    transport: transportCost,
    other: otherCost,
    net: gross - transportCost - otherCost,
  };
}

export function validateHarvestEntry(harvest) {
  if (!harvest.name?.trim() || !harvest.village?.trim() || !harvest.crop?.trim()) {
    return "Enter a farmer, village, and crop name.";
  }
  if (!positiveNumber(harvest.qty)) {
    return "Harvest quantity must be greater than zero.";
  }
  if (!nonNegativeNumber(harvest.price)) {
    return "Expected price must be zero or greater.";
  }
  if (!harvest.date) return "Choose a harvest date.";
  return "";
}

export function validateBuyerRequest(buyer) {
  if (!buyer.name?.trim() || !buyer.crop?.trim() || !buyer.region) {
    return "Enter a buyer, crop, and preferred region.";
  }
  if (!positiveNumber(buyer.qty)) {
    return "Required quantity must be greater than zero.";
  }
  if (!nonNegativeNumber(buyer.price)) {
    return "Offered price must be zero or greater.";
  }
  return "";
}

export function readLocalArray(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
      : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocalArray(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
