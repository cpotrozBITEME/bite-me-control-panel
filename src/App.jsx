import MenuItemsManager from "./components/MenuItemsManager";
import { useEffect, useState } from "react";
import "./App.css";

import cactusCorner from "./assets/decorations/cactus-decal-left.svg";
import cactusTall from "./assets/decorations/cactus-decal.svg";
import churroCorner from "./assets/decorations/churro-decal.svg";
import cornerTopLeft from "./assets/decorations/corner top left.svg";
import cornerTopRight from "./assets/decorations/corner top right.svg";
import cornerBottomLeft from "./assets/decorations/corner bottom left.svg";
import cornerBottomRight from "./assets/decorations/corner bottom right.svg";
import tacoPriceCard from "./assets/decorations/taco-price-card.svg";

import Papa from "papaparse";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import DisplayOptions from "./components/DisplayOptions";
import {
  importMenuItems,
  listenToMenuItems,
  saveMenuItem,
  setMenuItemArchived,
} from "./services/menuItemsService";

const defaultPanels = [
  {
    id: "tacos",
    category: "Tacos",
    heading: "TACOS",
  },
  {
    id: "mains",
    category: "Mains",
    heading: "MAINS",
  },
  {
    id: "sides",
    category: "Sides",
    heading: "SIDES & DESSERTS",
  },
];

const defaultDisplayOptions = {
  tacoPriceCard: false,
  fitMode: "normal",
  leftDecal: true,
  middleDecal: true,
  rightDecal: true,
};

export default function App() {
  const [service, setService] = useState("Lunch");
  const [selected, setSelected] = useState([]);
  const [panels, setPanels] = useState(defaultPanels);
  const [menuItems, setMenuItems] = useState([]);
  const [showPanelSettings, setShowPanelSettings] = useState(false);

  const [displayOptions, setDisplayOptions] = useState(
    defaultDisplayOptions
  );

  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRnwb0SjjT3gJ2osQPssUl55MHPgBM8arCQhrL_HTjvS-wtbO8K1vfkwZz5COFa5K852jJ3FBaY_dCj/pub?gid=525361053&single=true&output=csv";

  const isDisplayPage =
    window.location.pathname.startsWith("/display");

  /*
   * Load the product catalogue from Google Sheets.
   * Google Sheets controls:
   * - item names
   * - descriptions
   * - prices
   * - availability
   * - display order
   * - featured items
   */
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const response = await fetch(
          `${sheetUrl}&refresh=${Date.now()}`
        );

        if (!response.ok) {
          throw new Error(
            `Google Sheets returned ${response.status}`
          );
        }

        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,

          complete: (results) => {
            const loadedItems = results.data
              .map((row) => {
                const originalCategory =
                  row.Category?.trim();

                return {
                  id: row.ID?.trim(),

                  category:
                    originalCategory === "Dessert"
                      ? "Sides"
                      : `${originalCategory}s`,

                  originalCategory,

                  name: row.Name?.trim(),
                  description: row.Description?.trim(),
                  price: row.Price?.trim(),
                  notes: row.Notes?.trim(),

                  active:
                    row["Available today"]
                      ?.trim()
                      .toUpperCase() === "TRUE",

                  selectedToday:
                    row["Selected Today"]
                      ?.trim()
                      .toUpperCase() === "TRUE",

                  displayOrder: Number(
                    row["Display Order"] || 999
                  ),

                  featured:
                    row["Feature Today"]
                      ?.trim()
                      .toUpperCase() === "TRUE",
                };
              })
              .filter(
  (item) =>
    item.name &&
    item.category
);

            const sortedItems = [...loadedItems].sort(
              (a, b) => {
                if (a.category !== b.category) {
                  return a.category.localeCompare(
                    b.category
                  );
                }

                if (a.featured !== b.featured) {
                  return a.featured ? -1 : 1;
                }

                return (
                  a.displayOrder - b.displayOrder
                );
              }
            );

            setMenuItems(sortedItems);

            /*
             * The control panel initially reads
             * Selected Today from Google Sheets.
             *
             * The TV display gets its selected items
             * from Firebase instead.
             */
            if (!isDisplayPage) {
              const selectedFromSheet = sortedItems
                .filter(
                  (item) => item.selectedToday
                )
                .map((item) => item.name);

              setSelected(selectedFromSheet);
            }
          },

          error: (error) => {
            console.error(
              "Could not parse Google Sheet:",
              error
            );
          },
        });
      } catch (error) {
        console.error(
          "Could not load Google Sheet:",
          error
        );
      }
    };

    loadMenuItems();
  }, [isDisplayPage, sheetUrl]);

  /*
   * The TV display listens to Firebase.
   * Whenever Publish Menu is clicked,
   * the display updates automatically.
   */
  useEffect(() => {
    if (!isDisplayPage) {
      return undefined;
    }

    const menuDocument = doc(
      db,
      "menus",
      "current"
    );

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

        setService(
          publishedMenu.service || "Lunch"
        );

        /*
         * Supports both the new displayOptions format
         * and the older showTacoPriceOnce setting.
         */
        setDisplayOptions({
          ...defaultDisplayOptions,

          ...(publishedMenu.displayOptions || {}),

          tacoPriceCard:
            publishedMenu.displayOptions
              ?.tacoPriceCard === true ||
            publishedMenu.showTacoPriceOnce === true,
        });
      },

      (error) => {
        console.error(
          "Could not load the published menu:",
          error
        );
      }
    );

    return unsubscribe;
  }, [isDisplayPage]);

  useEffect(() => {
  const stopListening = listenToMenuItems(
    (items) => {
      console.log("Firebase menu items:", items);

      if (items.length > 0) {
        setMenuItems(items);
      }
    },
    (error) => {
      console.error("Could not load Firebase menu items:", error);
    }
  );

  return stopListening;
}, []);

useEffect(() => {
  if (!isDisplayPage) return;

  const interval = setInterval(() => {
    console.log("❤️ Menu heartbeat", new Date().toLocaleTimeString());

    // Tiny DOM update so the page isn't completely idle
    document.title =
      "Bite Me Menu " + (Date.now() % 2 === 0 ? "•" : "◦");
  }, 30000);

  return () => clearInterval(interval);
}, [isDisplayPage]);

useEffect(() => {
  if (!isDisplayPage) return;

  const refresh = setInterval(() => {
    console.log("🔄 Refreshing display");
    window.location.reload();
  }, 10 * 60 * 1000);

  return () => clearInterval(refresh);
}, [isDisplayPage]);

useEffect(() => {
  if (!isDisplayPage) return;

  const movement = setInterval(() => {
    window.scrollTo({
      top: 1,
      behavior: "instant",
    });

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, 45000);

  return () => clearInterval(movement);
}, [isDisplayPage]);

  const toggleItem = (name) => {
    setSelected((current) =>
      current.includes(name)
        ? current.filter(
            (itemName) => itemName !== name
          )
        : [...current, name]
    );
  };

  const updateHeading = (id, heading) => {
    setPanels((current) =>
      current.map((panel) =>
        panel.id === id
          ? { ...panel, heading }
          : panel
      )
    );
  };

  const setDisplayOption = (option, value) => {
  setDisplayOptions((current) => ({
    ...current,
    [option]: value,
  }));
};

  const movePanel = (index, direction) => {
    const newIndex = index + direction;

    if (
      newIndex < 0 ||
      newIndex >= panels.length
    ) {
      return;
    }

    const updatedPanels = [...panels];

    const [movedPanel] =
      updatedPanels.splice(index, 1);

    updatedPanels.splice(
      newIndex,
      0,
      movedPanel
    );

    setPanels(updatedPanels);
  };

  const toggleDisplayOption = (optionName) => {
    setDisplayOptions((current) => ({
      ...current,
      [optionName]: !current[optionName],
    }));
  };

  const importSheetItemsToFirebase = async () => {
  try {
    await importMenuItems(menuItems);
    alert("Menu items copied to Firebase!");
  } catch (error) {
    console.error("Could not import menu items:", error);
    alert("The import failed. Please try again.");
  }
};

const handleSaveMenuItem = async (item) => {
  try {
    await saveMenuItem(item);
  } catch (error) {
    console.error("Could not save menu item:", error);
    alert("The item could not be saved.");
  }
};

const handleArchiveMenuItem = async (item) => {
  try {
    await setMenuItemArchived(item, !item.archived);
  } catch (error) {
    console.error("Could not update archive status:", error);
    alert("The item could not be updated.");
  }
};

const publishMenu = async () => {
    try {
      await setDoc(
        doc(db, "menus", "current"),
        {
          selected,
          panels,
          service,
          displayOptions,
          publishedAt:
            new Date().toISOString(),
        }
      );

      alert("Menu published!");
    } catch (error) {
      console.error(
        "Could not publish menu:",
        error
      );

      alert(
        "The menu could not be published. Please try again."
      );
    }
  };

  const tacoCount = selected.filter(
    (name) => {
      const item = menuItems.find(
        (menuItem) =>
          menuItem.name === name
      );

      return item?.category === "Tacos";
    }
  ).length;

  const compactMode = tacoCount >= 4;

  return (
    <div
      className={`app ${
        isDisplayPage ? "publish" : ""
      }`}
    >
      {!isDisplayPage && (
        <aside className="builder">
          <h1>🌮 Bite Me</h1>
          <h2>Control Panel</h2>

          <p className="tagline">
            Tick today&apos;s items, choose your
            display options, then publish.
          </p>

          <button
            type="button"
            className="publish-button"
            onClick={publishMenu}
          >
            ✅ Publish Menu
          </button>

          <button
            type="button"
            className="publish-button"
            onClick={() =>
              window.open(
                "/display",
                "_blank"
              )
            }
          >
            📺 Open TV Display
          </button>

          <button
  type="button"
  className="publish-button"
  onClick={importSheetItemsToFirebase}
>
  📥 Import full catalogue to Firebase
</button>

          <DisplayOptions
  displayOptions={displayOptions}
  toggleDisplayOption={toggleDisplayOption}
  setDisplayOption={setDisplayOption}
/>

          <section className="control-section">
            <h3>Service</h3>

            <div className="service-toggle">
              <button
                type="button"
                className={
                  service === "Lunch"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setService("Lunch")
                }
              >
                Lunch
              </button>

              <button
                type="button"
                className={
                  service === "Dinner"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setService("Dinner")
                }
              >
                Dinner
              </button>

              <button
                type="button"
                className={
                  service === "None"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setService("None")
                }
              >
                No Heading
              </button>
            </div>
          </section>

          <section className="control-section">
  <button
    type="button"
    className="section-toggle-button"
    onClick={() =>
      setShowPanelSettings((current) => !current)
    }
  >
    {showPanelSettings
      ? "Hide Panel Settings"
      : "Show Panel Settings"}
  </button>

  {showPanelSettings && (
    <>
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
            type="button"
            onClick={() =>
              movePanel(index, -1)
            }
          >
            ↑
          </button>

          <button
            type="button"
            onClick={() =>
              movePanel(index, 1)
            }
          >
            ↓
          </button>
        </div>
      ))}
    </>
  )}
</section>

          <MenuItemsManager
  menuItems={menuItems}
  selected={selected}
  onToggleSelected={toggleItem}
  onSaveItem={handleSaveMenuItem}
  onArchiveItem={handleArchiveMenuItem}
/>
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
  } fit-${displayOptions.fitMode || "normal"}`}
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

            {!compactMode &&
              service !== "None" && (
                <div className="menu-header">
                  {service.toUpperCase()} MENU
                </div>
              )}

            <div
              className="menu-grid"
              style={{
                gridTemplateColumns: panels
                  .map((panel) => {
                    const itemCount =
                      menuItems.filter(
                        (item) =>
                          item.category ===
                            panel.category &&
                          selected.includes(
                            item.name
                          )
                      ).length;

                    if (itemCount >= 5) {
                      return "1.8fr";
                    }

                    if (itemCount >= 3) {
                      return "1.4fr";
                    }

                    if (itemCount === 0) {
                      return "0.7fr";
                    }

                    return "1fr";
                  })
                  .join(" "),
              }}
            >
              {panels.map((panel) => {
                const items =
                  menuItems.filter(
                    (item) =>
                      item.category ===
                        panel.category &&
                      selected.includes(
                        item.name
                      )
                  );

                const useTacoPriceCard =
                  panel.category ===
                    "Tacos" &&
                  displayOptions.tacoPriceCard &&
                  items.length > 0;

                return (
                  <section
                    key={panel.id}
                    className="menu-panel"
                  >
                    <h2>{panel.heading}</h2>
{displayOptions.decorations && panel.id === "tacos" && (
  <img
    src={cactusCorner}
    className="panel-decal panel-decal-left"
    alt=""
  />
)}

{displayOptions.decorations && panel.id === "mains" && (
  <img
    src={cactusTall}
    className="panel-decal panel-decal-middle"
    alt=""
  />
)}

{displayOptions.decorations && panel.id === "sides" && (
  <img
    src={churroCorner}
    className="panel-decal panel-decal-right"
    alt=""
  />
)}
                    {useTacoPriceCard && (
                      <img
                        src={tacoPriceCard}
                        className="taco-price-card"
                        alt="Taco prices"
                      />
                    )}

                    <div className="menu-items">
                      {items.length === 0 && (
                        <p className="empty">
                          No items selected
                        </p>
                      )}

                      {items.map((item) => (
                        <div
                          key={
                            item.id ||
                            item.name
                          }
                          className="menu-item"
                        >
                          <h3>
                            {item.name}
                          </h3>

                          <p>
                            {item.description}
                          </p>

                          {!useTacoPriceCard && (
                            <strong>
                              {item.price}
                            </strong>
                          )}
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