import { useEffect, useState } from "react";
import "./App.css";

import cornerTopLeft from "./assets/decorations/corner top left.svg";
import cornerTopRight from "./assets/decorations/corner top right.svg";
import cornerBottomLeft from "./assets/decorations/corner bottom left.svg";
import cornerBottomRight from "./assets/decorations/corner bottom right.svg";

import Papa from "papaparse";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

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

  // Load product names, descriptions, prices and ordering from Google Sheets.
  useEffect(() => {
    fetch(`${sheetUrl}&refresh=${Date.now()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Google Sheets returned ${response.status}`);
        }

        return response.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,

          complete: (results) => {
            const loadedItems = results.data
              .map((row) => {
                const originalCategory = row.Category?.trim();

                return {
                  id: row.ID?.trim(),

                  category:
                    originalCategory === "Dessert"
                      ? "Sides"
                      : `${originalCategory}s`,

                  name: row.Name?.trim(),
                  description: row.Description?.trim(),
                  price: row.Price?.trim(),
                  notes: row.Notes?.trim(),

                  active:
                    row["Available today"]?.trim().toUpperCase() === "TRUE",

                  selectedToday:
                    row["Selected Today"]?.trim().toUpperCase() === "TRUE",

                  displayOrder: Number(row["Display Order"] || 999),

                  featured:
                    row["Feature Today"]?.trim().toUpperCase() === "TRUE",
                };
              })
              .filter((item) => item.active && item.name);

            const sortedItems = [...loadedItems].sort((a, b) => {
              if (a.category !== b.category) {
                return 0;
              }

              if (a.featured !== b.featured) {
                return a.featured ? -1 : 1;
              }

              return a.displayOrder - b.displayOrder;
            });

            setMenuItems(sortedItems);

            // Only the control panel initially reads "Selected Today".
            // The TV display gets its selection from Firebase instead.
            if (!isDisplayPage) {
              const selectedFromSheet = sortedItems
                .filter((item) => item.selectedToday)
                .map((item) => item.name);

              setSelected(selectedFromSheet);
            }
          },

          error: (error) => {
            console.error("Could not parse Google Sheet:", error);
          },
        });
      })
      .catch((error) => {
        console.error("Could not load Google Sheet:", error);
      });
  }, [isDisplayPage, sheetUrl]);

  // The TV display listens for the latest published menu.
  useEffect(() => {
    if (!isDisplayPage) {
      return undefined;
    }

    const menuDocument = doc(db, "menus", "current");

    const unsubscribe = onSnapshot(
      menuDocument,
      (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        const publishedMenu = snapshot.data();

        setSelected(
          Array.isArray(publishedMenu.selected)
            ? publishedMenu.selected
            : []
        );

        setPanels(
          Array.isArray(publishedMenu.panels)
            ? publishedMenu.panels
            : defaultPanels
        );

        setService(publishedMenu.service || "Lunch");
      },
      (error) => {
        console.error("Could not load the published menu:", error);
      }
    );

    return unsubscribe;
  }, [isDisplayPage]);

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

    if (newIndex < 0 || newIndex >= panels.length) {
      return;
    }

    const updated = [...panels];
    const [moved] = updated.splice(index, 1);

    updated.splice(newIndex, 0, moved);
    setPanels(updated);
  };

  const publishMenu = async () => {
    try {
      await setDoc(doc(db, "menus", "current"), {
        selected,
        panels,
        service,
        publishedAt: new Date().toISOString(),
      });

      alert("Menu published!");
    } catch (error) {
      console.error("Could not publish menu:", error);
      alert("The menu could not be published. Please try again.");
    }
  };

  const tacoCount = selected.filter((name) => {
    const item = menuItems.find(
      (menuItem) => menuItem.name === name
    );

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
            Tick today&apos;s items. Rename and reorder panels live.
          </p>

          <button
            className="publish-button"
            onClick={publishMenu}
          >
            ✅ Publish Menu
          </button>

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
              <div
                key={panel.id}
                className="panel-control"
              >
                <input
                  value={panel.heading}
                  onChange={(event) =>
                    updateHeading(
                      panel.id,
                      event.target.value
                    )
                  }
                />

                <button
                  onClick={() => movePanel(index, -1)}
                  aria-label={`Move ${panel.heading} up`}
                >
                  ↑
                </button>

                <button
                  onClick={() => movePanel(index, 1)}
                  aria-label={`Move ${panel.heading} down`}
                >
                  ↓
                </button>
              </div>
            ))}
          </section>

          {defaultPanels.map((panel) => (
            <section
              key={panel.category}
              className="control-section"
            >
              <h3>{panel.category}</h3>

              {menuItems
                .filter(
                  (item) =>
                    item.category === panel.category
                )
                .map((item) => (
                  <label
                    key={item.id || item.name}
                    className="checkbox-row"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(item.name)}
                      onChange={() =>
                        toggleItem(item.name)
                      }
                    />

                    {item.name}
                  </label>
                ))}
            </section>
          ))}
        </aside>
      )}

      {!isDisplayPage ? (
        <main className="preview-wrap">
          <iframe
            src="/display"
            className="preview-frame"
            title="Bite Me menu preview"
          />
        </main>
      ) : (
        <main className="preview-wrap publish">
          <div
            className={`menu-preview ${
              compactMode ? "compact" : ""
            }`}
          >
            <img
              src={cornerTopLeft}
              className="corner tl"
              alt=""
            />

            <img
              src={cornerTopRight}
              className="corner tr"
              alt=""
            />

            <img
              src={cornerBottomLeft}
              className="corner bl"
              alt=""
            />

            <img
              src={cornerBottomRight}
              className="corner br"
              alt=""
            />

            {!compactMode && service !== "None" && (
              <div className="menu-header">
                {service.toUpperCase()} MENU
              </div>
            )}

            <div
              className="menu-grid"
              style={{
                gridTemplateColumns: panels
                  .map((panel) => {
                    const itemCount = menuItems.filter(
                      (item) =>
                        item.category === panel.category &&
                        selected.includes(item.name)
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
                    item.category === panel.category &&
                    selected.includes(item.name)
                );

                return (
                  <section
                    key={panel.id}
                    className="menu-panel"
                  >
                    <h2>{panel.heading}</h2>

                    <div className="menu-items">
                      {items.length === 0 && (
                        <p className="empty">
                          No items selected
                        </p>
                      )}

                      {items.map((item) => (
                        <div
                          key={item.id || item.name}
                          className="menu-item"
                        >
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
      )}
    </div>
  );
}