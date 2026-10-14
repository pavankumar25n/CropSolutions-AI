import { useMemo, useState } from "react";
import {
  calculateEarnings,
  DEMO_BUYERS,
  DEMO_HARVESTS,
  groupHarvests,
  matchBuyers,
  readLocalArray,
  validateBuyerRequest,
  validateHarvestEntry,
  writeLocalArray,
} from "./domain.js";

const nav = [
    ["home", "⌂", "Overview"],
    ["harvests", "▦", "Harvests"],
    ["matching", "⤳", "Matching"],
    ["buyers", "♙", "Buyer requests"],
    ["earnings", "₹", "Earnings"],
    ["assistant", "✳", "Assistant"],
  ];
const fmt = (n) => Math.round(+n || 0).toLocaleString("en-IN");
const rs = (n) => "₹" + fmt(n);
function Table({ rows, remove }) {
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th>FARMER</th>
            <th>CROP</th>
            <th>QUANTITY</th>
            <th>PRICE/KG</th>
            <th>DATE</th>
            {remove && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>
                {x.name}
                <small>{x.village} village</small>
              </td>
              <td>
                <span className="chip">{x.crop}</span>
              </td>
              <td>{fmt(x.qty)} kg</td>
              <td>₹{x.price}</td>
              <td>{x.date}</td>
              {remove && (
                <td>
                  <button
                    type="button"
                    className="remove"
                    aria-label={"Remove harvest from " + x.name}
                    onClick={() => remove(x.id)}
                  >
                    ×
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p className="empty">
          No harvest entries yet. Add a contribution above.
        </p>
      )}
    </div>
  );
}
export default function App() {
  const [page, setPage] = useState("home"),
    [rows, setHarvests] = useState(() =>
      readLocalArray("cs-harvests", DEMO_HARVESTS),
    ),
    [buyerRequests, setBuyerRequests] = useState(() =>
      readLocalArray("cs-buyer-requests", []),
    ),
    [msg, setMessage] = useState(""),
    [formError, setFormError] = useState(""),
    [crop, setCrop] = useState("Onion"),
    [target, setTarget] = useState(2500),
    [region, setRegion] = useState("Nashik region"),
    [calc, setCalculator] = useState({ qty: 2500, price: 18, transport: 4200, other: 800 }),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState("");
  const crops = [...new Set(rows.map((x) => x.crop))],
    total = rows.reduce((s, x) => s + x.qty, 0),
    grossRows = rows.reduce((s, x) => s + x.qty * x.price, 0),
    pool = useMemo(() => groupHarvests(rows, crop, target), [rows, crop, target]),
    buyerList = useMemo(
      () => [...DEMO_BUYERS, ...buyerRequests],
      [buyerRequests],
    ),
    matches = useMemo(
      () => matchBuyers(buyerList, crop, pool.qty, region),
      [buyerList, crop, pool.qty, region],
    ),
    earnings = useMemo(() => calculateEarnings(calc), [calc]),
    gross = earnings.gross,
    net = earnings.net;
  const go = (p) => {
      setPage(p);
      setMessage("");
      setFormError("");
      window.scrollTo(0, 0);
    },
    save = (e) => {
      e.preventDefault();
      setFormError("");
      const d = new FormData(e.currentTarget),
        x = {
          id: Date.now(),
          name: d.get("name").trim(),
          village: d.get("village").trim(),
          crop: d.get("crop").trim(),
          qty: +d.get("qty"),
          price: +d.get("price"),
          date: d.get("date"),
        };
      const validationMessage = validateHarvestEntry(x);
      if (validationMessage) {
        setFormError(validationMessage);
        return;
      }
      const n = [x, ...rows];
      setHarvests(n);
      setCrop(x.crop);
      setMessage(
        writeLocalArray("cs-harvests", n)
          ? "Harvest added to your collective."
          : "Harvest added for this session, but browser storage is unavailable.",
      );
      e.currentTarget.reset();
    },
    remove = (id) => {
      let n = rows.filter((x) => x.id !== id);
      setHarvests(n);
      if (!writeLocalArray("cs-harvests", n)) {
        setMessage("Harvest removed for this session, but browser storage is unavailable.");
      }
    },
    saveBuyer = (e) => {
      e.preventDefault();
      setFormError("");
      const d = new FormData(e.currentTarget),
        b = {
          id: Date.now(),
          demo: false,
          name: d.get("buyerName").trim(),
          crop: d.get("buyerCrop").trim(),
          qty: +d.get("buyerQty"),
          region: d.get("buyerRegion"),
          price: +d.get("buyerPrice"),
        };
      const validationMessage = validateBuyerRequest(b);
      if (validationMessage) {
        setFormError(validationMessage);
        return;
      }
      const n = [b, ...buyerRequests];
      setBuyerRequests(n);
      setMessage(
        writeLocalArray("cs-buyer-requests", n)
          ? "Buyer request saved in this browser and added to matching."
          : "Buyer request added for this session, but browser storage is unavailable.",
      );
      e.currentTarget.reset();
    },
    removeBuyer = (id) => {
      const n = buyerRequests.filter((b) => b.id !== id);
      setBuyerRequests(n);
      if (!writeLocalArray("cs-buyer-requests", n)) {
        setMessage("Buyer request removed for this session, but browser storage is unavailable.");
      }
    },
    ask = (e) => {
      e.preventDefault();
      if (question.trim())
        setAnswer(
          "Fallback explanation (AI API not configured): Your " +
            crop +
            " pool has " +
            fmt(pool.qty) +
            " kg from " +
            pool.list.length +
            " farmer contributions, compared with the " +
            fmt(target) +
            " kg target. " +
            (matches.length
              ? "A sample buyer requests " +
                fmt(matches[0].qty) +
                " kg in " +
                matches[0].region +
                " at an indicative ₹" +
                matches[0].price +
                "/kg. "
              : "No sample buyer currently fits these filters. ") +
            "Your calculator estimates " +
            rs(net) +
            " net with the entered values. Listings are illustrative: no offer or transaction exists.",
        );
    };
  return (
    <div className="layout">
      <aside className="side">
        <div className="brand">
          <b>✳</b> CropSolution<span>AI</span>
        </div>
        <small className="side-label">FARMER WORKSPACE</small>
        <nav>
          {nav.map(([id, icon, label]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={() => go(id)}
            >
              <i>{icon}</i>
              {label}
            </button>
          ))}
        </nav>
        <div className="season">
          ☀ Harvest season<small>October 2026 · Demo workspace</small>
        </div>
      </aside>
      <main>
        <header>
          <b className="mobilebrand">
            ✳ CropSolution<span>AI</span>
          </b>
          <span className="crumb">
            Workspace / <b>{nav.find((x) => x[0] === page)?.[2]}</b>
          </span>
          <span className="demo">● Demo environment</span>
        </header>
        <div className="content">
          {formError && (
            <div
              id="form-error"
              className="form-error"
              role="alert"
              aria-live="assertive"
            >
              {formError}
            </div>
          )}
          {msg && (
            <div className="notice" role="status" aria-live="polite">
              {msg}
              <button onClick={() => setMessage("")}>×</button>
            </div>
          )}
          {page === "home" && (
            <>
              <section className="hero">
                <div className="art">
                  ☀<br />
                  ♧　♧
                </div>
                <small>YOUR FARMER COLLECTIVE</small>
                <h1>
                  Smarter Farming.
                  <br />
                  <em>Stronger Communities.</em>
                </h1>
                <p>
                  Small farmers often harvest limited quantities individually,
                  making bulk sales difficult and transport costly. CropSolution
                  AI helps groups combine compatible harvests, compare
                  potential buyer needs, and estimate earnings.
                </p>
                <button className="light" onClick={() => go("harvests")}>
                  ＋ Add a harvest
                </button>
                <button className="herolink" onClick={() => go("matching")}>
                  Explore collective matching →
                </button>
              </section>
              <section className="workflow" aria-labelledby="workflow-title">
                <div className="workflow-heading">
                  <small className="eyebrow">A CLEAR PATH FROM HARVEST TO SALE</small>
                  <h2 id="workflow-title">How the collective workflow works</h2>
                  <p>
                    Pooling can help meet bulk quantity requirements. Buyer
                    listings are potential matches only; confirm details and
                    transport arrangements directly.
                  </p>
                </div>
                <div className="workflow-steps">
                  {[
                    ["01", "Add harvest", "Record crop, quantity, and village.", "harvests"],
                    ["02", "Group compatible crops", "Combine the same crop toward a target.", "matching"],
                    ["03", "Review potential buyers", "Compare crop, quantity, and region.", "matching"],
                    ["04", "Estimate earnings", "Subtract transport and other costs.", "earnings"],
                  ].map(([number, title, description, destination]) => (
                    <button
                      className="workflow-step"
                      key={number}
                      onClick={() => go(destination)}
                    >
                      <span>{number}</span>
                      <b>{title}</b>
                      <small>{description}</small>
                    </button>
                  ))}
                </div>
              </section>
              <small className="eyebrow">YOUR COLLECTIVE AT A GLANCE</small>
              <div className="title">
                <div>
                  <h1>Good morning, farmer</h1>
                  <p>
                    Here’s how your harvest community is growing this season.
                  </p>
                </div>
                <button className="primary" onClick={() => go("harvests")}>
                  ＋ Add harvest
                </button>
              </div>
              <div className="stats">
                {[
                  [
                    "♧",
                    "Harvest pooled",
                    fmt(total) + " kg",
                    "Across active entries",
                  ],
                  [
                    "♙",
                    "Farmers contributing",
                    new Set(rows.map((x) => x.name)).size,
                    "Includes demo farmers",
                  ],
                  [
                    "◉",
                    "Potential gross value",
                    rs(grossRows),
                    "Based on expected prices",
                  ],
                  [
                    "⌁",
                    "Active crop groups",
                    crops.length,
                    "Ready for matching",
                  ],
                ].map((x) => (
                  <article key={x[1]}>
                    <i>{x[0]}</i>
                    <small>{x[1]}</small>
                    <b>{x[2]}</b>
                    <small>{x[3]}</small>
                  </article>
                ))}
              </div>
              <div className="two">
                <section className="panel">
                  <div className="panelhead">
                    <div>
                      <h2>Recent harvest entries</h2>
                      <p>Latest community contributions</p>
                    </div>
                    <button className="link" onClick={() => go("harvests")}>
                      View all →
                    </button>
                  </div>
                  <Table rows={rows.slice(0, 4)} />
                </section>
                <section className="panel next">
                  <h2>Next best step</h2>
                  <h3>Pool your onion harvest</h3>
                  <p>
                    Your collective has{" "}
                    <b>
                      {fmt(
                        rows
                          .filter((x) => x.crop === "Onion")
                          .reduce((s, x) => s + x.qty, 0),
                      )}{" "}
                      kg
                    </b>{" "}
                    of onion to compare with buyer requirements.
                  </p>
                  <button
                    className="outline"
                    onClick={() => {
                      setCrop(
                        crops.includes("Onion") ? "Onion" : crops[0] || "Onion",
                      );
                      go("matching");
                    }}
                  >
                    See matching options →
                  </button>
                  <small>Buyer listings shown are demo data.</small>
                </section>
              </div>
            </>
          )}
          {page === "harvests" && (
            <>
              <div className="title">
                <div>
                  <small className="eyebrow">HARVEST MANAGEMENT</small>
                  <h1>Your harvests</h1>
                  <p>Add and manage community contributions.</p>
                </div>
                <span className="pill">{fmt(total)} kg pooled</span>
              </div>
              <div className="harvestlayout">
                <section className="panel formpanel">
                  <h2 id="harvest-form-title">Add a harvest</h2>
                  <p>Share a crop contribution with your collective.</p>
                  <form
                    onSubmit={save}
                    onChange={() => setFormError("")}
                    aria-labelledby="harvest-form-title"
                    aria-describedby={formError ? "form-error" : undefined}
                  >
                    <label htmlFor="harvest-name">
                      Farmer name
                      <input
                        id="harvest-name"
                        aria-describedby="harvest-storage-note"
                        name="name"
                        required
                        placeholder="e.g. Meera Deshmukh"
                      />
                    </label>
                    <label htmlFor="harvest-village">
                      Village
                      <input
                        id="harvest-village"
                        aria-describedby="harvest-storage-note"
                        name="village"
                        required
                        placeholder="e.g. Deola"
                      />
                    </label>
                    <label htmlFor="harvest-crop">
                      Crop name
                      <input
                        id="harvest-crop"
                        aria-describedby="harvest-storage-note"
                        name="crop"
                        required
                        placeholder="e.g. Onion"
                        list="crop-suggest"
                      />
                    </label>
                    <datalist id="crop-suggest">
                      <option>Onion</option>
                      <option>Tomato</option>
                      <option>Wheat</option>
                      <option>Potato</option>
                      <option>Grapes</option>
                    </datalist>
                    <div className="formrow">
                      <label htmlFor="harvest-quantity">
                        Quantity (kg)
                        <input
                          id="harvest-quantity"
                          aria-describedby="harvest-storage-note"
                          name="qty"
                          type="number"
                          min="1"
                          step="1"
                          required
                          placeholder="800"
                        />
                      </label>
                      <label htmlFor="harvest-price">
                        Expected price / kg
                        <input
                          id="harvest-price"
                          aria-describedby="harvest-storage-note"
                          name="price"
                          type="number"
                          min="0"
                          step=".5"
                          required
                          placeholder="18"
                        />
                      </label>
                    </div>
                    <label htmlFor="harvest-date">
                      Harvest date
                      <input
                        id="harvest-date"
                        aria-describedby="harvest-storage-note"
                        name="date"
                        type="date"
                        required
                      />
                    </label>
                    <small id="harvest-storage-note">
                      Entries are saved in this browser for this demo.
                    </small>
                    <button className="primary">
                      Add harvest to collective →
                    </button>
                  </form>
                </section>
                <section className="panel">
                  <div className="panelhead">
                    <div>
                      <h2>Community contributions</h2>
                      <p>Demo farmers are labeled in the list.</p>
                    </div>
                    <span className="pill">{rows.length}</span>
                  </div>
                  <Table rows={rows} remove={remove} />
                </section>
              </div>
            </>
          )}
          {page === "buyers" && (
            <>
              <div className="title">
                <div>
                  <small className="eyebrow">BUYER MARKETPLACE</small>
                  <h1>Buyer requests</h1>
                  <p>
                    Add the crop, amount, region, and price a buyer is looking
                    for.
                  </p>
                </div>
                <span className="pill">Saved in this browser</span>
              </div>
              <div className="harvestlayout">
                <section className="panel formpanel">
                  <h2 id="buyer-form-title">Add a buyer request</h2>
                  <p>New requests can appear in collective matching.</p>
                  <form
                    onSubmit={saveBuyer}
                    onChange={() => setFormError("")}
                    aria-labelledby="buyer-form-title"
                    aria-describedby={formError ? "form-error" : undefined}
                  >
                    <label htmlFor="buyer-name">
                      Buyer or organization name
                      <input
                        id="buyer-name"
                        aria-describedby="buyer-storage-note"
                        name="buyerName"
                        required
                        placeholder="e.g. Valley Produce Market"
                      />
                    </label>
                    <label htmlFor="buyer-crop">
                      Crop wanted
                      <input
                        id="buyer-crop"
                        aria-describedby="buyer-storage-note"
                        name="buyerCrop"
                        required
                        placeholder="e.g. Onion"
                        list="buyer-crops"
                      />
                    </label>
                    <datalist id="buyer-crops">
                      <option>Onion</option>
                      <option>Tomato</option>
                      <option>Wheat</option>
                      <option>Potato</option>
                      <option>Grapes</option>
                    </datalist>
                    <label htmlFor="buyer-quantity">
                      Quantity required (kg)
                      <input
                        id="buyer-quantity"
                        aria-describedby="buyer-storage-note"
                        name="buyerQty"
                        type="number"
                        min="1"
                        required
                        placeholder="2000"
                      />
                    </label>
                    <label htmlFor="buyer-region">
                      Preferred region
                      <select
                        id="buyer-region"
                        aria-describedby="buyer-storage-note"
                        name="buyerRegion"
                        required
                      >
                        <option>Nashik region</option>
                        <option>Pune region</option>
                        <option>Nagpur region</option>
                      </select>
                    </label>
                    <label htmlFor="buyer-price">
                      Offered price per kg (₹)
                      <input
                        id="buyer-price"
                        aria-describedby="buyer-storage-note"
                        name="buyerPrice"
                        type="number"
                        min="0"
                        step="0.5"
                        required
                        placeholder="20"
                      />
                    </label>
                    <small id="buyer-storage-note">
                      This request is stored only in this browser. It does not
                      contact or notify the buyer.
                    </small>
                    <button className="primary">Save buyer request →</button>
                  </form>
                </section>
                <section className="panel">
                  <div className="panelhead">
                    <div>
                      <h2>Available buyer listings</h2>
                      <p>Demo listings and requests saved on this device.</p>
                    </div>
                    <span className="pill">{buyerList.length}</span>
                  </div>
                  {buyerRequests.length === 0 && (
                    <p className="empty" role="status">
                      No buyer requests saved yet. Sample listings are shown
                      below.
                    </p>
                  )}
                  <div className="buyerlist">
                    {buyerList.map((b) => (
                      <article key={b.id} className="buyerrow">
                        <div>
                          <small className="demotag">
                            {b.demo ? "DEMO LISTING" : "SAVED REQUEST"}
                          </small>
                          <h3>{b.name}</h3>
                          <p>
                            {b.crop} · {fmt(b.qty)} kg · {b.region} · ₹{b.price}
                            /kg
                          </p>
                        </div>
                        {!b.demo && (
                          <button
                            type="button"
                            className="remove"
                            onClick={() => removeBuyer(b.id)}
                            aria-label={"Remove request from " + b.name}
                          >
                            ×
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
          {page === "matching" && (
            <>
              <div className="title">
                <div>
                  <small className="eyebrow">COLLECTIVE MARKETPLACE</small>
                  <h1>Find your best match</h1>
                  <p>
                    Pool compatible harvests and compare sample bulk buyer
                    requirements.
                  </p>
                </div>
                <span className="pill">Demo + saved buyer requests</span>
              </div>
              <section className="panel filters">
                <label htmlFor="matching-crop">
                  Crop
                  <select
                    id="matching-crop"
                    aria-describedby="matching-filter-help"
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                  >
                    {crops.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label htmlFor="matching-target">
                  Target quantity (kg)
                  <input
                    id="matching-target"
                    aria-describedby="matching-filter-help"
                    type="number"
                    min="1"
                    step="1"
                    value={target}
                    onChange={(e) =>
                      setTarget(Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                </label>
                <label htmlFor="matching-region">
                  Buyer region
                  <select
                    id="matching-region"
                    aria-describedby="matching-filter-help"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    {[
                      "All regions",
                      "Nashik region",
                      "Pune region",
                      "Nagpur region",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </section>
              <p className="hint" id="matching-filter-help">
                Buyer results update using the selected crop, target, and
                region.
              </p>
              <section className="panel result">
                <div className="panelhead">
                  <div>
                    <small className="eyebrow">COLLECTIVE HARVEST MATCH</small>
                    <h2>
                      {crop} group{" "}
                      <small className="demotag">DEMO + YOUR ENTRIES</small>
                    </h2>
                    <p>Entries are pooled until the target is met.</p>
                  </div>
                  <span className={pool.qty >= target ? "ready" : "short"}>
                    {pool.qty >= target
                      ? "✓ Target reached"
                      : "! More harvest needed"}
                  </span>
                </div>
                <div className="metrics">
                  <span>
                    Combined quantity<b>{fmt(pool.qty)} kg</b>
                  </span>
                  <span>
                    Farmers included<b>{pool.list.length}</b>
                  </span>
                  <span>
                    Target quantity<b>{fmt(target)} kg</b>
                  </span>
                  <span>
                    Progress
                    <b>
                      {Math.min(
                        100,
                        Math.round((pool.qty / Math.max(1, target)) * 100),
                      )}
                      %
                    </b>
                  </span>
                </div>
                <div className="bar">
                  <i
                    style={{
                      width:
                        Math.min(100, (pool.qty / Math.max(1, target)) * 100) +
                        "%",
                    }}
                  />
                </div>
                <h3>Contributors in this match</h3>
                {pool.list.length === 0 ? (
                  <p className="empty">
                    No harvest entries for {crop} yet. Add a harvest to start a
                    group.
                  </p>
                ) : (
                  <div className="contributors">
                    {pool.list.map((x) => (
                      <div key={x.id}>
                        <b>{x.name}</b>
                        <small>
                          {x.village} · {x.crop}
                        </small>
                        <strong>{fmt(x.qty)} kg</strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <div className="panelhead buyershead">
                <div>
                  <h2>Potential buyer matches</h2>
                  <p>Filtered by crop, quantity, and region.</p>
                </div>
                <small className="eyebrow">ILLUSTRATIVE ONLY</small>
              </div>
              <div className="buyers">
                {matches.map((b) => (
                  <article className="panel" key={b.name}>
                    <small className="demotag">
                      {b.demo ? "DEMO LISTING" : "BUYER REQUEST"}
                    </small>
                    <h3>{b.name}</h3>
                    <div className="facts">
                      {[
                        ["Crop", b.crop],
                        ["Required", fmt(b.qty) + " kg"],
                        ["Region", b.region],
                        ["Indicative price", "₹" + b.price + "/kg"],
                      ].map((x) => (
                        <span key={x[0]}>
                          {x[0]}
                          <b>{x[1]}</b>
                        </span>
                      ))}
                    </div>
                    <small>
                      {b.demo
                        ? "Sample data only · no offer or transaction exists"
                        : "Saved request · confirm buyer details directly"}
                    </small>
                  </article>
                ))}
              </div>
              {!matches.length && (
                <section className="panel empty">
                  <h3>No buyer requests match these filters</h3>
                  <p>
                    Try All regions, a lower quantity, or add a buyer request.
                    Demo listings are illustrative.
                  </p>
                </section>
              )}
            </>
          )}
          {page === "earnings" && (
            <>
              <div className="title">
                <div>
                  <small className="eyebrow">PLANNING TOOL</small>
                  <h1>Estimate your earnings</h1>
                  <p>
                    Adjust harvest quantity and costs for a take-home estimate.
                  </p>
                </div>
                <span className="pill">Planning estimate only</span>
              </div>
              <div className="two earn">
                <section
                  className="panel formpanel"
                  aria-labelledby="earnings-calculator-title"
                >
                  <h2 id="earnings-calculator-title">Enter your numbers</h2>
                  <p>Use your best estimate for this harvest.</p>
                  <div className="calcgrid">
                    {[
                      ["qty", "Harvest quantity", "kg"],
                      ["price", "Expected selling price", "₹ per kg"],
                      ["transport", "Transport expenses", "₹"],
                      ["other", "Other expenses", "₹"],
                    ].map(([k, l, u]) => (
                      <label key={k} htmlFor={"earnings-" + k}>
                        {l}
                        <input
                          id={"earnings-" + k}
                          aria-describedby={"earnings-unit-" + k}
                          type="number"
                          min="0"
                          step={k === "qty" ? "1" : "0.01"}
                          value={calc[k]}
                          onChange={(e) =>
                            setCalculator({
                              ...calc,
                              [k]: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                        />
                        <small id={"earnings-unit-" + k}>{u}</small>
                      </label>
                    ))}
                  </div>
                  <p className="hint">
                    Excludes taxes, commissions, spoilage, and price changes.
                  </p>
                </section>
                <section className="summary">
                  <small>YOUR ESTIMATED SUMMARY</small>
                  <p>Estimated net earnings</p>
                  <strong>{rs(net)}</strong>
                  <small>After estimated expenses</small>
                  <div>
                    <span>Gross revenue</span>
                    <b>{rs(gross)}</b>
                  </div>
                  <div>
                    <span>Transport expenses</span>
                    <b>− {rs(calc.transport)}</b>
                  </div>
                  <div>
                    <span>Other expenses</span>
                    <b>− {rs(calc.other)}</b>
                  </div>
                  <div className="netline">
                    <span>Estimated net</span>
                    <b>{rs(net)}</b>
                  </div>
                  <small>
                    Planning estimate only. Actual prices and costs may differ.
                  </small>
                </section>
              </div>
              <section className="tip">
                ✦{" "}
                <span>
                  <b>Small tip</b>
                  <br />
                  Pooling transport may reduce cost per kilogram. Compare group
                  and individual transport before deciding.
                </span>
              </section>
            </>
          )}
          {page === "assistant" && (
            <>
              <div className="title">
                <div>
                  <small className="eyebrow">PLAIN-LANGUAGE SUPPORT</small>
                  <h1>Your farm planning assistant</h1>
                  <p>
                    Ask about pooling, buyer matches, or earnings estimates.
                  </p>
                </div>
                <span className="pill">Fallback mode · no API configured</span>
              </div>
              <div className="two">
                <section className="panel chat">
                  <h2>✳ CropSolution helper</h2>
                  <p>
                    Hello! I can explain harvest matching, sample buyer options,
                    or your earnings estimate. What would you like to know?
                  </p>
                  {answer && <p className="answer">{answer}</p>}
                  <form onSubmit={ask}>
                    <label className="sr-only" htmlFor="assistant-question">
                      Ask a question
                    </label>
                    <input
                      id="assistant-question"
                      aria-label="Ask CropSolution AI a question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask about your harvest or earnings..."
                    />
                    <button className="primary">Send ↑</button>
                  </form>
                  <small>
                    Fallback explanation uses local demo data. No AI service is
                    connected.
                  </small>
                </section>
                <section className="panel">
                  <h2>Try asking</h2>
                  {[
                    "How does collective matching work?",
                    "What is my estimated net earning?",
                    "Are these buyer listings confirmed?",
                  ].map((q) => (
                    <button className="suggestion" key={q} onClick={() => setQuestion(q)}>
                      “{q}” →
                    </button>
                  ))}
                  <p className="hint">
                    Entries stay in this browser. No buyer contact or
                    transaction is initiated.
                  </p>
                </section>
              </div>
            </>
          )}
          <footer>
            <span>© 2026 CropSolution AI</span>
            <span>Smarter Farming. Stronger Communities.</span>
            <b>Hackathon demo · No live transactions</b>
          </footer>
        </div>
      </main>
    </div>
  );
}
