import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase";

const menuItemsCollection = collection(db, "menuItems");

export function listenToMenuItems(onItemsLoaded, onError) {
  const menuItemsQuery = query(
    menuItemsCollection,
    orderBy("displayOrder", "asc")
  );

  return onSnapshot(
    menuItemsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((itemDocument) => ({
        id: itemDocument.id,
        ...itemDocument.data(),
      }));

      onItemsLoaded(items);
    },
    onError
  );
}

export async function saveMenuItem(item) {
  const itemId =
    item.id ||
    crypto.randomUUID();

  const itemDocument = doc(
    db,
    "menuItems",
    itemId
  );

  await setDoc(itemDocument, {
    name: item.name.trim(),
    description: item.description.trim(),
    price: item.price.trim(),
    category: item.category,
    active: item.active !== false,
    featured: item.featured === true,
    displayOrder: Number(item.displayOrder || 999),
  });

  return itemId;
}

export async function removeMenuItem(itemId) {
  const itemDocument = doc(
    db,
    "menuItems",
    itemId
  );

  await deleteDoc(itemDocument);
}

export async function importMenuItems(items) {
  const batch = writeBatch(db);

  items.forEach((item) => {
    const itemId = item.id || crypto.randomUUID();
    const itemDocument = doc(db, "menuItems", itemId);

    batch.set(itemDocument, {
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      category: item.category || "Mains",
      active: item.active !== false,
      featured: item.featured === true,
      displayOrder: Number(item.displayOrder || 999),
    });
  });

  await batch.commit();
}