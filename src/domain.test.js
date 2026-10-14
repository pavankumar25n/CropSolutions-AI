import { describe, expect, it } from "vitest";
import {
  calculateEarnings,
  groupHarvests,
  matchBuyers,
  readLocalArray,
  validateBuyerRequest,
  validateHarvestEntry,
  writeLocalArray,
} from "./domain.js";

const harvests = [
  { id: 1, crop: "Onion", qty: 400 },
  { id: 2, crop: "onion", qty: 700 },
  { id: 3, crop: "Tomato", qty: 900 },
  { id: 4, crop: "Onion", qty: 600 },
];

describe("groupHarvests", () => {
  it("groups compatible crops largest first until the requested quantity is met", () => {
    const result = groupHarvests(harvests, "ONION", 1000);

    expect(result.list.map(({ id }) => id)).toEqual([2, 4]);
    expect(result.qty).toBe(1300);
    expect(result.targetReached).toBe(true);
  });

  it("returns a shortfall when combined harvest is below target", () => {
    const result = groupHarvests(harvests, "Onion", 2000);

    expect(result.qty).toBe(1700);
    expect(result.targetReached).toBe(false);
    expect(result.list).toHaveLength(3);
  });

  it("handles empty harvests, unmatched crops, and invalid targets", () => {
    expect(groupHarvests([], "Onion", 1000)).toEqual({
      list: [],
      qty: 0,
      targetReached: false,
    });
    expect(groupHarvests(harvests, "Potato", 1000).qty).toBe(0);
    expect(groupHarvests(harvests, "Onion", 0).list).toEqual([]);
  });
});

describe("matchBuyers", () => {
  const listings = [
    { id: 1, crop: "Onion", qty: 1000, region: "Nashik region" },
    { id: 2, crop: "Onion", qty: 2000, region: "Pune region" },
    { id: 3, crop: "Tomato", qty: 500, region: "Nashik region" },
  ];

  it("matches by crop, available quantity, and region", () => {
    expect(matchBuyers(listings, "onion", 1500, "Nashik region")).toEqual([
      listings[0],
    ]);
  });

  it("supports all regions and excludes requests above available quantity", () => {
    expect(matchBuyers(listings, "Onion", 1500, "All regions")).toEqual([
      listings[0],
    ]);
  });

  it("returns no matches for empty listings or invalid available quantity", () => {
    expect(matchBuyers([], "Onion", 1000)).toEqual([]);
    expect(matchBuyers(listings, "Onion", -1)).toEqual([]);
    expect(matchBuyers(listings, "Onion", 0)).toEqual([]);
  });
});

describe("calculateEarnings", () => {
  it("calculates gross revenue, costs, and net earnings", () => {
    expect(
      calculateEarnings({ qty: 1200, price: 20, transport: 3000, other: 500 }),
    ).toEqual({ gross: 24000, transport: 3000, other: 500, net: 20500 });
  });

  it("treats empty and invalid inputs as zero and allows a negative net estimate", () => {
    expect(calculateEarnings({ qty: "", price: "bad", transport: -1 })).toEqual({
      gross: 0,
      transport: 0,
      other: 0,
      net: 0,
    });
    expect(
      calculateEarnings({ qty: 10, price: 2, transport: 30, other: 0 }).net,
    ).toBe(-10);
  });
});

describe("form validation", () => {
  const validHarvest = {
    name: "Meera",
    village: "Deola",
    crop: "Onion",
    qty: 100,
    price: 0,
    date: "2026-10-21",
  };

  it("accepts a valid harvest and rejects blank, zero, or negative quantities", () => {
    expect(validateHarvestEntry(validHarvest)).toBe("");
    expect(validateHarvestEntry({ ...validHarvest, name: "   " })).toMatch(
      /farmer, village, and crop/,
    );
    expect(validateHarvestEntry({ ...validHarvest, qty: "" })).toMatch(
      /greater than zero/,
    );
    expect(validateHarvestEntry({ ...validHarvest, qty: -1 })).toMatch(
      /greater than zero/,
    );
    expect(validateHarvestEntry({ ...validHarvest, price: "" })).toMatch(
      /price must be zero or greater/,
    );
    expect(validateHarvestEntry({ ...validHarvest, price: -0.01 })).toMatch(
      /price must be zero or greater/,
    );
  });

  it("accepts a valid buyer request and rejects empty or invalid quantity and price", () => {
    const validBuyer = {
      name: "Valley Produce",
      crop: "Onion",
      qty: 500,
      region: "Nashik region",
      price: 18,
    };

    expect(validateBuyerRequest(validBuyer)).toBe("");
    expect(validateBuyerRequest({ ...validBuyer, name: "" })).toMatch(
      /buyer, crop, and preferred region/,
    );
    expect(validateBuyerRequest({ ...validBuyer, qty: 0 })).toMatch(
      /greater than zero/,
    );
    expect(validateBuyerRequest({ ...validBuyer, price: -1 })).toMatch(
      /price must be zero or greater/,
    );
    expect(validateBuyerRequest({ ...validBuyer, price: "" })).toMatch(
      /price must be zero or greater/,
    );
  });
});

describe("browser storage helpers", () => {
  it("uses fallback data for malformed saved data and persists arrays", () => {
    const fallback = [{ id: "demo" }];
    window.localStorage.setItem("bad-json", "{");
    window.localStorage.setItem("not-an-array", "{}");
    window.localStorage.setItem("mixed-array", JSON.stringify([null, fallback[0]]));

    expect(readLocalArray("bad-json", fallback)).toBe(fallback);
    expect(readLocalArray("not-an-array", fallback)).toBe(fallback);
    expect(readLocalArray("mixed-array", fallback)).toEqual(fallback);
    expect(writeLocalArray("saved-array", fallback)).toBe(true);
    expect(readLocalArray("saved-array", [])).toEqual(fallback);
  });

  it("reports when browser storage cannot save", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        setItem() {
          throw new Error("Storage is disabled");
        },
      },
    });

    try {
      expect(writeLocalArray("blocked", [])).toBe(false);
    } finally {
      Object.defineProperty(window, "localStorage", descriptor);
    }
  });
});
