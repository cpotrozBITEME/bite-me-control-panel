import { useEffect, useState } from "react";
import "./App.css";
import cornerTopLeft from "./assets/decorations/corner top left.svg";
import cornerTopRight from "./assets/decorations/corner top right.svg";
import cornerBottomLeft from "./assets/decorations/corner bottom left.svg";
import cornerBottomRight from "./assets/decorations/corner bottom right.svg";
import Papa from "papaparse";

const defaultPanels = [
  { id: "tacos", category: "Tacos", heading: "TACOS" },
  { id: "mains", category: "Mains", heading: "MAINS" },
  { id: "sides", category: "Sides", heading: "SIDES & DESSERTS" },
];

export default function App() {

    const [service, setService] = useState("Lunch");
    const [selected, setSelected] = useState([]);

  const [panels, setPanels] = useState(defaultPanels);
  const [menuItems, setMenuItems] = useState([]);
  const sheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRnwb0SjjT3gJ2osQPssUl55MHPgBM8arCQhrL_HTjvS-wtbO8K1vfkwZz5COFa5K852jJ3FBaY_dCj/pub?gid=525361053&single=true&output=csv";
  const isDisplayPage = window.location.pathname.startsWith("/display");

useEffect(() => {
  fetch(sheetUrl)
    .then((response) => response.text())
    .then((csvText) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const loadedItems = results.data
            .map((row) => ({
              id: row.ID?.trim(),
              category:
  row.Category?.trim() === "Dessert"
    ? "Sides"
    : `${row.Category?.trim()}s`,
              name: row.Name?.trim(),
              description: row.Description?.trim(),
              price: row.Price?.trim(),
              notes: row.Notes?.trim(),
              active: row["Available today"] === "TRUE",
              selectedToday: row["Selected Today"] === "TRUE",
            }))
            .filter((item) => item.active && item.name);

          setMenuItems(loadedItems);

          const selectedFromSheet = loadedItems
            .filter((item) => item.selectedToday)
            .map((item) => item.name);

          setSelected(selectedFromSheet);
        },
      });
    });
}, []);

const toggleItem = (name) => {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  };

  const updateHeading = (id, heading) => {
    setPanels((current) =>
      current.map((panel) =>
        panel.id === id ? { ...panel, heading } : panel
      )
    );
  };

  const movePanel = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= panels.length) return;

    const updated = [...panels];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setPanels(updated);
  };
const tacoCount = selected.filter((name) => {
  const item = menuItems.find((menuItem) => menuItem.name === name);
  return item?.category === "Tacos";
}).length;

const compactMode = tacoCount >= 4;
  return (
    <div className={`app ${isDisplayPage ? "publish" : ""}`}>
    {!isDisplayPage && (
  <aside className="builder">
        <h1>🌮 Bite Me</h1>
        <h2>Control Panel</h2>

        <p className="tagline"> 
          Tick today's items. Rename and reorder panels live.
</p>

<button
  className="publish-button"
  onClick={() => window.open("/display", "_blank")}
>
  📺 Open TV Display
</button>

<section className="control-section">

    <h3>Service</h3>

    <div className="service-toggle">

    <button
        className={service === "Lunch" ? "active" : ""}
        onClick={() => setService("Lunch")}
    >
        Lunch
    </button>

    <button
        className={service === "Dinner" ? "active" : ""}
        onClick={() => setService("Dinner")}
    >
        Dinner
    </button>
    <button
    className={service === "None" ? "active" : ""}
    onClick={() => setService("None")}
>
    No Heading
</button>

</div>

</section>

        <section className="control-section">
          <h3>Panel Headings</h3>
          {panels.map((panel, index) => (
            <div key={panel.id} className="panel-control">
              <input
                value={panel.heading}
                onChange={(e) => updateHeading(panel.id, e.target.value)}
              />
              <button onClick={() => movePanel(index, -1)}>↑</button>
              <button onClick={() => movePanel(index, 1)}>↓</button>
            </div>
          ))}
        </section>

        {defaultPanels.map((panel) => (
          <section key={panel.category} className="control-section">
            <h3>{panel.category}</h3>
            {menuItems
              .filter((item) => item.category === panel.category)
              .map((item) => (
                <label key={item.name} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.name)}
                    onChange={() => toggleItem(item.name)}
                  />
                  {item.name}
                </label>
              ))}
          </section>
        ))}
      </aside>
)}

<main className={`preview-wrap ${isDisplayPage ? "publish" : ""}`}>
       <div className={`menu-preview ${compactMode ? "compact" : ""}`}>
        <img src={cornerTopLeft} className="corner tl" alt="" />
<img src={cornerTopRight} className="corner tr" alt="" />
<img src={cornerBottomLeft} className="corner bl" alt="" />
<img src={cornerBottomRight} className="corner br" alt="" />
    
  {!compactMode && service !== "None" && (
    <div className="menu-header">
      {service.toUpperCase()} MENU
    </div>
  )}

  <div className="menu-grid"
  style={{
    gridTemplateColumns: panels
      .map((panel) => {
        const itemCount = menuItems.filter(
          (item) =>
            item.category === panel.category && selected.includes(item.name)
        ).length;

        if (itemCount >= 5) return "1.8fr";
        if (itemCount >= 3) return "1.4fr";
        if (itemCount === 0) return "0.7fr";
        return "1fr";
      })
      .join(" "),
  }}
>
            {panels.map((panel) => {
              const items = menuItems.filter(
                (item) =>
                  item.category === panel.category && selected.includes(item.name)
              );

              return (
                <section key={panel.id} className="menu-panel">
                  <h2>{panel.heading}</h2>

                  <div className="menu-items">
  {items.length === 0 && <p className="empty">No items selected</p>}

  {items.map((item) => (
    <div key={item.name} className="menu-item">
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <strong>{item.price}</strong>
    </div>
  ))}
</div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}