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

const storageKey = "memory_wall_rows";
let rows = [];
let db;

function setSyncMessage(text, kind) {
  syncStatus.textContent = text;
  syncStatus.className = `sync-status ${kind || ""}`.trim();
}

function saveLocal() {
  localStorage.setItem(storageKey, JSON.stringify(rows));
}

function loadLocal() {
  rows = JSON.parse(localStorage.getItem(storageKey) || "[]");
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
  setSyncMessage("Live sync on for memory wall 💞", "success");
} else {
  loadLocal();
  render();
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
