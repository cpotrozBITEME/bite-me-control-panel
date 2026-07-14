import { useMemo, useState } from "react";
import MenuItemEditor from "./MenuItemEditor";

export default function MenuItemsManager({
  menuItems,
  selected,
  onToggleSelected,
  onSaveItem,
  onArchiveItem,
}) {
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const visibleItems = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return [...menuItems]
      .filter((item) => {
        const isArchived = item.archived === true;

        if (!showArchived && isArchived) {
          return false;
        }

        if (showArchived && !isArchived) {
          return false;
        }

        if (!searchText) {
          return true;
        }

        return [
          item.name,
          item.description,
          item.price,
          item.category,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(searchText)
        );
      })
      .sort((a, b) => {
        if (a.category !== b.category) {
          return String(a.category).localeCompare(
            String(b.category)
          );
        }

        return (
          Number(a.displayOrder || 999) -
          Number(b.displayOrder || 999)
        );
      });
  }, [menuItems, search, showArchived]);

  const closeEditor = () => {
    setEditingItem(null);
    setIsAddingItem(false);
  };

  const handleSave = async (item) => {
    await onSaveItem(item);
    closeEditor();
  };

  if (isAddingItem || editingItem) {
    return (
      <section className="control-section">
        <MenuItemEditor
          item={editingItem}
          onSave={handleSave}
          onCancel={closeEditor}
        />
      </section>
    );
  }

  return (
    <section className="control-section menu-items-manager">
      <div className="manager-heading-row">
        <h3>Menu Items</h3>

        <button
          type="button"
          className="add-item-button"
          onClick={() => setIsAddingItem(true)}
        >
          + Add New Item
        </button>
      </div>

      <input
        className="menu-item-search"
        type="search"
        value={search}
        placeholder="Search menu items..."
        onChange={(event) => setSearch(event.target.value)}
      />

      <button
        type="button"
        className="archive-view-button"
        onClick={() =>
          setShowArchived((current) => !current)
        }
      >
        {showArchived
          ? "← Back to active items"
          : "View archived items"}
      </button>

      <div className="managed-item-list">
        {visibleItems.length === 0 && (
          <p className="empty">
            {showArchived
              ? "No archived items."
              : "No menu items found."}
          </p>
        )}

        {visibleItems.map((item) => (
          <article
            key={item.id}
            className={`managed-item-card ${
              item.archived ? "archived" : ""
            }`}
          >
            <div className="managed-item-details">
              <strong>{item.name}</strong>

              <span>
                {item.category || "Uncategorised"}
                {item.price ? ` · ${item.price}` : ""}
              </span>

              {item.description && (
                <p>{item.description}</p>
              )}

              <small>
                Order: {item.displayOrder ?? 999}
                {item.featured ? " · Featured" : ""}
                {item.active === false
                  ? " · Unavailable"
                  : ""}
              </small>
            </div>

<label className="checkbox-row managed-show-toggle">
  <input
    type="checkbox"
    checked={selected.includes(item.name)}
    onChange={() => onToggleSelected(item.name)}
  />
  Show on menu
</label>

            <div className="managed-item-actions">
              <button
                type="button"
                onClick={() => setEditingItem(item)}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => onArchiveItem(item)}
              >
                {item.archived ? "Restore" : "Archive"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}