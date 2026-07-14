import { useState } from "react";

const blankItem = {
  name: "",
  description: "",
  price: "",
  category: "Tacos",
  active: true,
  featured: false,
  displayOrder: 999,
};

export default function MenuItemEditor({
  item,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState(
    item ? { ...blankItem, ...item } : blankItem
  );

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter an item name.");
      return;
    }

    onSave({
      ...form,
      displayOrder: Number(form.displayOrder || 999),
    });
  };

  return (
    <form
      className="menu-item-editor"
      onSubmit={handleSubmit}
    >
      <h3>
        {item ? "Edit Menu Item" : "Add New Item"}
      </h3>

      <label>
        Item name
        <input
          value={form.name}
          onChange={(event) =>
            updateField("name", event.target.value)
          }
        />
      </label>

      <label>
        Description
        <textarea
          value={form.description}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
        />
      </label>

      <label>
        Price
        <input
          value={form.price}
          onChange={(event) =>
            updateField("price", event.target.value)
          }
          placeholder="$12"
        />
      </label>

      <label>
        Category
        <select
          value={form.category}
          onChange={(event) =>
            updateField("category", event.target.value)
          }
        >
          <option value="Tacos">Tacos</option>
          <option value="Mains">Mains</option>
          <option value="Sides">Sides</option>
          <option value="Desserts">Desserts</option>
        </select>
      </label>

      <label>
        Display order
        <input
          type="number"
          value={form.displayOrder}
          onChange={(event) =>
            updateField(
              "displayOrder",
              event.target.value
            )
          }
        />
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(event) =>
            updateField("active", event.target.checked)
          }
        />
        Available
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(event) =>
            updateField("featured", event.target.checked)
          }
        />
        Featured
      </label>

      <div className="editor-actions">
        <button type="submit">
          Save Item
        </button>

        <button
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}