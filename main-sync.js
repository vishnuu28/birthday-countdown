import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const USE_CLOUD =
  Boolean(firebaseConfig.apiKey) &&
  !String(firebaseConfig.apiKey).includes("YOUR_");

const form = document.getElementById("memoryForm");
const photoInput = document.getElementById("memoryPhoto");
const commentInput = document.getElementById("memoryComment");
const feelingInput = document.getElementById("memoryFeeling");
const statusMessage = document.getElementById("memoryStatusMessage");
const syncStatus = document.getElementById("memorySyncStatus");
const memoriesGrid = document.getElementById("memoriesGrid");
const planForm = document.getElementById("planForm");
const plansBody = document.querySelector("#plansTable tbody");
const noteForm = document.getElementById("noteForm");
const notesList = document.getElementById("notesList");

const storageKey = "memory_wall_rows";
const plansKey = "couple_plan_rows";
const notesKey = "couple_note_rows";
let rows = [];
let plans = [];
let notes = [];
let db;

function setSyncMessage(text, kind) {
  syncStatus.textContent = text;
  syncStatus.className = `sync-status ${kind || ""}`.trim();
}

function saveLocal() {
  localStorage.setItem(storageKey, JSON.stringify(rows));
  localStorage.setItem(plansKey, JSON.stringify(plans));
  localStorage.setItem(notesKey, JSON.stringify(notes));
}

function loadLocal() {
  rows = JSON.parse(localStorage.getItem(storageKey) || "[]");
  plans = JSON.parse(localStorage.getItem(plansKey) || "[]");
  notes = JSON.parse(localStorage.getItem(notesKey) || "[]");
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function render() {
  memoriesGrid.innerHTML = "";
  rows
    .slice()
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .forEach((row, index) => {
      const card = document.createElement("article");
      card.className = "memory-card";
      const replies = (row.replies || [])
        .map(
          (reply) =>
            `<div class="reply-item"><span>${reply.text}</span><small>${formatDate(
              reply.createdAt
            )}</small></div>`
        )
        .join("");
      card.innerHTML = `
        <img class="memory-photo" src="${row.imageDataUrl}" alt="Memory photo" />
        <p class="memory-comment">${row.comment}</p>
        <p class="memory-feeling">Feeling: ${row.feeling}</p>
        <p class="memory-date">${formatDate(row.createdAt)}</p>
        <div class="replies-box">${replies || "<em>No replies yet.</em>"}</div>
        <div class="reply-form-inline">
          <input type="text" placeholder="Write a reply..." data-reply-input="${
            row.id || index
          }" />
          <button class="row-btn edit-btn" data-reply-add="${row.id || index}">Reply</button>
          <button class="row-btn delete-btn" data-memory-delete="${row.id || index}">Delete</button>
        </div>
      `;
      memoriesGrid.appendChild(card);
    });
}

function renderPlans() {
  plansBody.innerHTML = "";
  plans
    .slice()
    .sort((a, b) => String(a.planDate).localeCompare(String(b.planDate)))
    .forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.planDate || "-"}</td>
        <td>${row.title || ""}</td>
        <td>${row.location || ""}</td>
        <td>${row.note || ""}</td>
        <td>
          <label class="toggle-label">
            <input type="checkbox" data-plan-toggle="${row.id || index}" ${
        row.done ? "checked" : ""
      } />
            <span>${row.done ? "Done" : "Pending"}</span>
          </label>
        </td>
        <td class="row-actions">
          <button class="row-btn edit-btn" data-plan-edit="${row.id || index}">Update</button>
          <button class="row-btn delete-btn" data-plan-delete="${
            row.id || index
          }">Delete</button>
        </td>
      `;
      plansBody.appendChild(tr);
    });
}

function renderNotes() {
  notesList.innerHTML = "";
  notes
    .slice()
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .forEach((row, index) => {
      const item = document.createElement("div");
      item.className = "note-item";
      item.innerHTML = `
        <div>
          <strong>${row.sender}</strong> - ${row.text}
          <small>${formatDate(row.createdAt)}</small>
        </div>
        <div class="row-actions">
          <button class="row-btn edit-btn" data-note-edit="${row.id || index}">Update</button>
          <button class="row-btn delete-btn" data-note-delete="${row.id || index}">Delete</button>
        </div>
      `;
      notesList.appendChild(item);
    });
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function shrinkImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 900;
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.src = dataUrl;
  });
}

if (USE_CLOUD) {
  db = getFirestore(initializeApp(firebaseConfig));
  onSnapshot(collection(db, "birthdayMemories"), (snap) => {
    rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  });
  onSnapshot(collection(db, "couplePlans"), (snap) => {
    plans = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderPlans();
  });
  onSnapshot(collection(db, "coupleNotes"), (snap) => {
    notes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderNotes();
  });
  setSyncMessage("Live sync on for memory wall 💞", "success");
} else {
  loadLocal();
  render();
  renderPlans();
  renderNotes();
  setSyncMessage("Local mode on. Add Firebase for cloud sync.", "warning");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;

  try {
    const raw = await readImageAsDataUrl(file);
    const imageDataUrl = await shrinkImage(raw);
    const payload = {
      imageDataUrl,
      comment: commentInput.value.trim(),
      feeling: feelingInput.value.trim(),
      createdAt: Date.now(),
      replies: [],
    };

    if (USE_CLOUD) {
      await addDoc(collection(db, "birthdayMemories"), payload);
    } else {
      rows.unshift(payload);
      saveLocal();
      render();
    }

    form.reset();
    statusMessage.textContent = "Memory added successfully 💖";
    statusMessage.className = "status-message success";
  } catch (error) {
    console.error(error);
    statusMessage.textContent = "Could not add memory.";
    statusMessage.className = "status-message error";
  }
});

memoriesGrid.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  if (target.dataset.replyAdd !== undefined) {
    const key = target.dataset.replyAdd;
    const replyInput = memoriesGrid.querySelector(`[data-reply-input="${key}"]`);
    if (!(replyInput instanceof HTMLInputElement)) return;
    const text = replyInput.value.trim();
    if (!text) return;

    if (USE_CLOUD) {
      await updateDoc(doc(db, "birthdayMemories", key), {
        replies: arrayUnion({ text, createdAt: Date.now() }),
      });
    } else {
      const index = Number(key);
      rows[index].replies = rows[index].replies || [];
      rows[index].replies.push({ text, createdAt: Date.now() });
      saveLocal();
      render();
    }
  }

  if (target.dataset.memoryDelete !== undefined) {
    const key = target.dataset.memoryDelete;
    if (!window.confirm("Delete this memory?")) return;
    if (USE_CLOUD) {
      await deleteDoc(doc(db, "birthdayMemories", key));
    } else {
      rows.splice(Number(key), 1);
      saveLocal();
      render();
    }
  }
});

planForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    title: document.getElementById("planTitle").value.trim(),
    planDate: document.getElementById("planDate").value,
    location: document.getElementById("planLocation").value.trim(),
    note: document.getElementById("planNote").value.trim(),
    done: false,
    createdAt: Date.now(),
  };

  if (USE_CLOUD) {
    await addDoc(collection(db, "couplePlans"), payload);
  } else {
    plans.push(payload);
    saveLocal();
    renderPlans();
  }
  planForm.reset();
});

noteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    sender: document.getElementById("noteSender").value,
    text: document.getElementById("noteText").value.trim(),
    createdAt: Date.now(),
  };
  if (USE_CLOUD) {
    await addDoc(collection(db, "coupleNotes"), payload);
  } else {
    notes.unshift(payload);
    saveLocal();
    renderNotes();
  }
  noteForm.reset();
});

plansBody.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target instanceof HTMLInputElement && target.dataset.planToggle !== undefined) {
    const key = target.dataset.planToggle;
    if (USE_CLOUD) {
      await updateDoc(doc(db, "couplePlans", key), { done: target.checked });
    } else {
      plans[Number(key)].done = target.checked;
      saveLocal();
      renderPlans();
    }
    return;
  }

  if (!(target instanceof HTMLButtonElement)) return;
  if (target.dataset.planEdit !== undefined) {
    const key = target.dataset.planEdit;
    const row = USE_CLOUD ? plans.find((p) => p.id === key) : plans[Number(key)];
    if (!row) return;
    const title = window.prompt("Update plan title:", row.title);
    if (!title || !title.trim()) return;
    const note = window.prompt("Update note:", row.note || "") || "";
    if (USE_CLOUD) {
      await updateDoc(doc(db, "couplePlans", key), { title: title.trim(), note: note.trim() });
    } else {
      plans[Number(key)].title = title.trim();
      plans[Number(key)].note = note.trim();
      saveLocal();
      renderPlans();
    }
  }
  if (target.dataset.planDelete !== undefined) {
    const key = target.dataset.planDelete;
    if (!window.confirm("Delete this plan?")) return;
    if (USE_CLOUD) {
      await deleteDoc(doc(db, "couplePlans", key));
    } else {
      plans.splice(Number(key), 1);
      saveLocal();
      renderPlans();
    }
  }
});

notesList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  if (target.dataset.noteEdit !== undefined) {
    const key = target.dataset.noteEdit;
    const row = USE_CLOUD ? notes.find((n) => n.id === key) : notes[Number(key)];
    if (!row) return;
    const text = window.prompt("Update note:", row.text);
    if (!text || !text.trim()) return;
    if (USE_CLOUD) {
      await updateDoc(doc(db, "coupleNotes", key), { text: text.trim() });
    } else {
      notes[Number(key)].text = text.trim();
      saveLocal();
      renderNotes();
    }
  }

  if (target.dataset.noteDelete !== undefined) {
    const key = target.dataset.noteDelete;
    if (!window.confirm("Delete this note?")) return;
    if (USE_CLOUD) {
      await deleteDoc(doc(db, "coupleNotes", key));
    } else {
      notes.splice(Number(key), 1);
      saveLocal();
      renderNotes();
    }
  }
});
