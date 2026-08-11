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
  setDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { audioEngine } from "./audio-player.js";

const USE_CLOUD =
  Boolean(firebaseConfig.apiKey) &&
  !String(firebaseConfig.apiKey).includes("YOUR_");

const storageKeys = {
  requestRows: "relationship_request_rows",
  punishmentRows: "relationship_punishment_rows",
};

const requestForm = document.getElementById("requestForm");
const chargeForm = document.getElementById("chargeForm");
const requestStatusMessage = document.getElementById("requestStatusMessage");
const syncStatusEl = document.getElementById("syncStatus");
const requestTodoBody = document.querySelector("#requestTodoTable tbody");
const punishmentTodoBody = document.querySelector("#punishmentTodoTable tbody");
const scratchCover = document.getElementById("scratchCover");
const dailyLoveReasonText = document.getElementById("dailyLoveReasonText");

let requestRows = [];
let punishmentRows = [];
let loveCounts = { kisses: 0, hugs: 0, misses: 0 };
let db;

function generateUniqueId() {
  return "loc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function setSyncMessage(text, kind) {
  if (!syncStatusEl) return;
  syncStatusEl.textContent = text;
  syncStatusEl.className = "sync-status" + (kind ? " " + kind : "");
}

function loadLocal() {
  requestRows = JSON.parse(localStorage.getItem(storageKeys.requestRows) || "[]").map((r) => ({
    id: r.id || generateUniqueId(),
    ...r,
  }));
  punishmentRows = JSON.parse(localStorage.getItem(storageKeys.punishmentRows) || "[]").map((p) => ({
    id: p.id || generateUniqueId(),
    ...p,
  }));
}

function persistLocal() {
  localStorage.setItem(storageKeys.requestRows, JSON.stringify(requestRows));
  localStorage.setItem(storageKeys.punishmentRows, JSON.stringify(punishmentRows));
}

function renderRequestTable() {
  if (!requestTodoBody) return;
  requestTodoBody.innerHTML = "";
  requestRows.forEach((row) => {
    const tr = document.createElement("tr");
    const tdDate = document.createElement("td");
    tdDate.textContent = formatDate(row.createdAt);
    const tdWish = document.createElement("td");
    tdWish.textContent = row.request;
    const tdDone = document.createElement("td");
    const label = document.createElement("label");
    label.className = "toggle-label";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(row.done);
    input.dataset.requestId = row.id;

    const span = document.createElement("span");
    span.textContent = row.done ? "Done" : "Pending";
    label.appendChild(input);
    label.appendChild(span);
    tdDone.appendChild(label);
    const tdActions = document.createElement("td");
    tdActions.className = "row-actions";
    tdActions.innerHTML = `
      <button type="button" class="row-btn edit-btn" data-request-edit="${row.id}">Update</button>
      <button type="button" class="row-btn delete-btn" data-request-delete="${row.id}">Delete</button>
    `;
    tr.appendChild(tdDate);
    tr.appendChild(tdWish);
    tr.appendChild(tdDone);
    tr.appendChild(tdActions);
    requestTodoBody.appendChild(tr);
  });
}

function renderPunishmentTable() {
  if (!punishmentTodoBody) return;
  punishmentTodoBody.innerHTML = "";
  punishmentRows.forEach((row) => {
    const tr = document.createElement("tr");
    const cells = [
      formatDate(row.createdAt),
      row.mistake,
      row.apology,
      row.punishment,
    ];
    cells.forEach((text) => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    const tdDone = document.createElement("td");
    const label = document.createElement("label");
    label.className = "toggle-label";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(row.done);
    input.dataset.punishmentId = row.id;

    const span = document.createElement("span");
    span.textContent = row.done ? "Done" : "Pending";
    label.appendChild(input);
    label.appendChild(span);
    tdDone.appendChild(label);
    const tdActions = document.createElement("td");
    tdActions.className = "row-actions";
    tdActions.innerHTML = `
      <button type="button" class="row-btn edit-btn" data-punish-edit="${row.id}">Update</button>
      <button type="button" class="row-btn delete-btn" data-punish-delete="${row.id}">Delete</button>
    `;
    tr.appendChild(tdDone);
    tr.appendChild(tdActions);
    punishmentTodoBody.appendChild(tr);
  });
}

function renderTables() {
  renderRequestTable();
  renderPunishmentTable();
}

function renderLoveCounts() {
  const kissBadge = document.getElementById("kissCountBadge");
  const hugBadge = document.getElementById("hugCountBadge");
  const missBadge = document.getElementById("missCountBadge");
  if (kissBadge) kissBadge.textContent = loveCounts.kisses || 0;
  if (hugBadge) hugBadge.textContent = loveCounts.hugs || 0;
  if (missBadge) missBadge.textContent = loveCounts.misses || 0;
}

function sortByCreatedAtDesc(items) {
  return items.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function startCloud() {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  onSnapshot(
    collection(db, "birthdayWishes"),
    (snap) => {
      requestRows = sortByCreatedAtDesc(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            createdAt: data.createdAt ?? 0,
            request: data.request ?? "",
            done: Boolean(data.done),
          };
        })
      );
      renderRequestTable();
    },
    (err) => {
      console.error(err);
      setSyncMessage("Cloud sync error — check Firebase config and rules.", "error");
    }
  );

  onSnapshot(
    collection(db, "birthdayPunishments"),
    (snap) => {
      punishmentRows = sortByCreatedAtDesc(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            createdAt: data.createdAt ?? 0,
            mistake: data.mistake ?? "",
            apology: data.apology ?? "",
            punishment: data.punishment ?? "",
            done: Boolean(data.done),
          };
        })
      );
      renderPunishmentTable();
    },
    (err) => {
      console.error(err);
      setSyncMessage("Cloud sync error — check Firebase config and rules.", "error");
    }
  );

  onSnapshot(doc(db, "coupleKisses", "counts"), (snap) => {
    if (snap.exists()) {
      loveCounts = snap.data();
      renderLoveCounts();
    }
  });

  setSyncMessage("Live sync on — real-time on phone and PC 💞", "success");
}

function startLocal() {
  loadLocal();
  renderTables();
  loveCounts = JSON.parse(localStorage.getItem("couple_love_counts") || '{"kisses":0,"hugs":0,"misses":0}');
  renderLoveCounts();
  setSyncMessage("Local mode active. Add Firebase config for live cloud sync.", "warning");
}

if (requestForm) {
  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const requestMessage = document.getElementById("requestMessage").value.trim();

    if (USE_CLOUD) {
      try {
        await addDoc(collection(db, "birthdayWishes"), {
          request: requestMessage,
          createdAt: Date.now(),
          done: false,
        });
        if (requestStatusMessage) {
          requestStatusMessage.textContent = "Saved with love 💖 (synced)";
          requestStatusMessage.className = "status-message success";
        }
      } catch (e) {
        console.error(e);
        if (requestStatusMessage) {
          requestStatusMessage.textContent = "Could not save — check Firebase.";
          requestStatusMessage.className = "status-message error";
        }
      }
    } else {
      requestRows.unshift({
        id: generateUniqueId(),
        createdAt: Date.now(),
        request: requestMessage,
        done: false,
      });
      if (requestStatusMessage) {
        requestStatusMessage.textContent = "Saved with love 💖";
        requestStatusMessage.className = "status-message success";
      }
      persistLocal();
      renderTables();
    }
    requestForm.reset();
    audioEngine.playChimeSound();
  });
}

if (chargeForm) {
  chargeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const mistake = document.getElementById("mistakeDetails").value.trim();
    const apology = document.getElementById("apologyMessage").value.trim();
    const punishment = document.getElementById("punishmentText").value.trim();

    if (USE_CLOUD) {
      try {
        await addDoc(collection(db, "birthdayPunishments"), {
          mistake,
          apology,
          punishment,
          createdAt: Date.now(),
          done: false,
        });
      } catch (e) {
        console.error(e);
        alert("Could not save — check Firebase setup.");
      }
    } else {
      punishmentRows.unshift({
        id: generateUniqueId(),
        createdAt: Date.now(),
        mistake,
        apology,
        punishment,
        done: false,
      });
      persistLocal();
      renderTables();
    }
    chargeForm.reset();
    audioEngine.playChimeSound();
  });
}

if (requestTodoBody) {
  requestTodoBody.addEventListener("change", async (event) => {
    const t = event.target;
    if (!(t instanceof HTMLInputElement) || t.type !== "checkbox") return;
    const key = t.dataset.requestId;

    if (USE_CLOUD && key && !key.startsWith("loc-")) {
      try {
        await updateDoc(doc(db, "birthdayWishes", key), {
          done: t.checked,
        });
      } catch (e) {
        console.error(e);
        t.checked = !t.checked;
      }
    } else {
      const item = requestRows.find((r) => String(r.id) === String(key));
      if (item) {
        item.done = t.checked;
        persistLocal();
        renderRequestTable();
      }
    }
  });

  requestTodoBody.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    if (target.dataset.requestEdit) {
      const rowKey = target.dataset.requestEdit;
      const row = requestRows.find((r) => String(r.id) === String(rowKey));
      if (!row) return;
      const updatedWish = window.prompt("Update wish:", row.request);
      if (!updatedWish || !updatedWish.trim()) return;

      if (USE_CLOUD && !rowKey.startsWith("loc-")) {
        await updateDoc(doc(db, "birthdayWishes", rowKey), {
          request: updatedWish.trim(),
        });
      } else {
        row.request = updatedWish.trim();
        persistLocal();
        renderRequestTable();
      }
    }

    if (target.dataset.requestDelete) {
      const rowKey = target.dataset.requestDelete;
      if (!window.confirm("Delete this wish?")) return;
      if (USE_CLOUD && !rowKey.startsWith("loc-")) {
        await deleteDoc(doc(db, "birthdayWishes", rowKey));
      } else {
        requestRows = requestRows.filter((r) => String(r.id) !== String(rowKey));
        persistLocal();
        renderRequestTable();
      }
    }
  });
}

if (punishmentTodoBody) {
  punishmentTodoBody.addEventListener("change", async (event) => {
    const t = event.target;
    if (!(t instanceof HTMLInputElement) || t.type !== "checkbox") return;
    const key = t.dataset.punishmentId;

    if (USE_CLOUD && key && !key.startsWith("loc-")) {
      try {
        await updateDoc(doc(db, "birthdayPunishments", key), {
          done: t.checked,
        });
      } catch (e) {
        console.error(e);
        t.checked = !t.checked;
      }
    } else {
      const item = punishmentRows.find((p) => String(p.id) === String(key));
      if (item) {
        item.done = t.checked;
        persistLocal();
        renderPunishmentTable();
      }
    }
  });

  punishmentTodoBody.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    if (target.dataset.punishEdit) {
      const rowKey = target.dataset.punishEdit;
      const row = punishmentRows.find((p) => String(p.id) === String(rowKey));
      if (!row) return;

      const updatedMistake = window.prompt("Update mistake:", row.mistake);
      if (!updatedMistake || !updatedMistake.trim()) return;
      const updatedApology = window.prompt("Update apology text:", row.apology);
      if (!updatedApology || !updatedApology.trim()) return;
      const updatedPunishment = window.prompt("Update punishment:", row.punishment);
      if (!updatedPunishment || !updatedPunishment.trim()) return;

      if (USE_CLOUD && !rowKey.startsWith("loc-")) {
        await updateDoc(doc(db, "birthdayPunishments", rowKey), {
          mistake: updatedMistake.trim(),
          apology: updatedApology.trim(),
          punishment: updatedPunishment.trim(),
        });
      } else {
        row.mistake = updatedMistake.trim();
        row.apology = updatedApology.trim();
        row.punishment = updatedPunishment.trim();
        persistLocal();
        renderPunishmentTable();
      }
    }

    if (target.dataset.punishDelete) {
      const rowKey = target.dataset.punishDelete;
      if (!window.confirm("Delete this punishment entry?")) return;
      if (USE_CLOUD && !rowKey.startsWith("loc-")) {
        await deleteDoc(doc(db, "birthdayPunishments", rowKey));
      } else {
        punishmentRows = punishmentRows.filter((p) => String(p.id) !== String(rowKey));
        persistLocal();
        renderPunishmentTable();
      }
    }
  });
}

// Daily Scratch Card secret reasons
const secretReasons = [
  "\"Your smile brightens up my darkest days and your kindness inspires me every single second.\" 💖",
  "\"The way you laugh from your heart is my absolute favorite sound in the world.\" 🥰",
  "\"You make ordinary days feel like magical adventures just by being with me.\" ✨",
  "\"I love your gentle warmth, your intelligence, and your adorable playful side.\" 🌸",
  "\"Every single day I wake up feeling like the luckiest person because I have you.\" 💌",
  "\"Your eyes carry a universe of beauty that I never want to stop looking into.\" 🌌",
  "\"Thank you for loving me, listening to me, and being my safest place in this world.\" 🫂"
];

if (dailyLoveReasonText) {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  dailyLoveReasonText.textContent = secretReasons[dayOfYear % secretReasons.length];
}

if (scratchCover) {
  scratchCover.addEventListener("click", () => {
    scratchCover.classList.add("scratched");
    audioEngine.playChimeSound();
  });
}

// Kiss / Hug / Miss buttons
function spawnParticle(emoji, event) {
  const particle = document.createElement("div");
  particle.className = "kiss-particle";
  particle.textContent = emoji;
  particle.style.left = (event.clientX || window.innerWidth / 2) + "px";
  particle.style.top = (event.clientY || window.innerHeight / 2) + "px";
  document.body.appendChild(particle);
  setTimeout(() => particle.remove(), 1400);
}

async function incrementLoveCount(field, emoji, event) {
  loveCounts[field] = (loveCounts[field] || 0) + 1;
  renderLoveCounts();
  spawnParticle(emoji, event);
  if (field === 'kisses') audioEngine.playKissSound();
  else audioEngine.playChimeSound();

  if (USE_CLOUD && db) {
    try {
      await setDoc(doc(db, "coupleKisses", "counts"), { [field]: increment(1) }, { merge: true });
    } catch(e) { console.error(e); }
  } else {
    localStorage.setItem("couple_love_counts", JSON.stringify(loveCounts));
  }
}

const sendKissBtn = document.getElementById("sendKissBtn");
const sendHugBtn = document.getElementById("sendHugBtn");
const sendMissBtn = document.getElementById("sendMissBtn");
if (sendKissBtn) sendKissBtn.addEventListener("click", (e) => incrementLoveCount("kisses", "💋", e));
if (sendHugBtn) sendHugBtn.addEventListener("click", (e) => incrementLoveCount("hugs", "🫂", e));
if (sendMissBtn) sendMissBtn.addEventListener("click", (e) => incrementLoveCount("misses", "💌", e));

if (USE_CLOUD) {
  startCloud();
} else {
  startLocal();
}
