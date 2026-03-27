import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

let requestRows = [];
let punishmentRows = [];
let db;

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function setSyncMessage(text, kind) {
  if (!syncStatusEl) return;
  syncStatusEl.textContent = text;
  syncStatusEl.className = "sync-status" + (kind ? " " + kind : "");
}

function loadLocal() {
  requestRows = JSON.parse(
    localStorage.getItem(storageKeys.requestRows) || "[]"
  );
  punishmentRows = JSON.parse(
    localStorage.getItem(storageKeys.punishmentRows) || "[]"
  );
}

function persistLocal() {
  localStorage.setItem(
    storageKeys.requestRows,
    JSON.stringify(requestRows)
  );
  localStorage.setItem(
    storageKeys.punishmentRows,
    JSON.stringify(punishmentRows)
  );
}

function renderRequestTable() {
  requestTodoBody.innerHTML = "";
  requestRows.forEach((row, index) => {
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
    if (USE_CLOUD && row.id) {
      input.dataset.requestId = row.id;
    } else {
      input.dataset.requestIndex = String(index);
    }
    const span = document.createElement("span");
    span.textContent = row.done ? "Done" : "Pending";
    label.appendChild(input);
    label.appendChild(span);
    tdDone.appendChild(label);
    tr.appendChild(tdDate);
    tr.appendChild(tdWish);
    tr.appendChild(tdDone);
    requestTodoBody.appendChild(tr);
  });
}

function renderPunishmentTable() {
  punishmentTodoBody.innerHTML = "";
  punishmentRows.forEach((row, index) => {
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
    if (USE_CLOUD && row.id) {
      input.dataset.punishmentId = row.id;
    } else {
      input.dataset.punishmentIndex = String(index);
    }
    const span = document.createElement("span");
    span.textContent = row.done ? "Done" : "Pending";
    label.appendChild(input);
    label.appendChild(span);
    tdDone.appendChild(label);
    tr.appendChild(tdDone);
    punishmentTodoBody.appendChild(tr);
  });
}

function renderTables() {
  renderRequestTable();
  renderPunishmentTable();
}

function startCloud() {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  const wishesQ = query(
    collection(db, "birthdayWishes"),
    orderBy("createdAt", "desc")
  );
  onSnapshot(
    wishesQ,
    (snap) => {
      requestRows = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          createdAt: data.createdAt ?? 0,
          request: data.request ?? "",
          done: Boolean(data.done),
        };
      });
      renderRequestTable();
    },
    (err) => {
      console.error(err);
      setSyncMessage("Cloud sync error — check Firebase config and rules.", "error");
    }
  );

  const punishQ = query(
    collection(db, "birthdayPunishments"),
    orderBy("createdAt", "desc")
  );
  onSnapshot(
    punishQ,
    (snap) => {
      punishmentRows = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          createdAt: data.createdAt ?? 0,
          mistake: data.mistake ?? "",
          apology: data.apology ?? "",
          punishment: data.punishment ?? "",
          done: Boolean(data.done),
        };
      });
      renderPunishmentTable();
    },
    (err) => {
      console.error(err);
      setSyncMessage("Cloud sync error — check Firebase config and rules.", "error");
    }
  );

  setSyncMessage("Live sync on — same list on her phone and your PC 💞", "success");
}

function startLocal() {
  loadLocal();
  renderTables();
  setSyncMessage(
    "Local only — add your Firebase config in firebase-config.js for live sync.",
    "warning"
  );
}

requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const requestMessage = document
    .getElementById("requestMessage")
    .value.trim();

  if (USE_CLOUD) {
    try {
      await addDoc(collection(db, "birthdayWishes"), {
        request: requestMessage,
        createdAt: Date.now(),
        done: false,
      });
      requestStatusMessage.textContent = "Saved with love 💖 (synced)";
      requestStatusMessage.className = "status-message success";
    } catch (e) {
      console.error(e);
      requestStatusMessage.textContent = "Could not save — check Firebase.";
      requestStatusMessage.className = "status-message error";
    }
  } else {
    requestRows.unshift({
      createdAt: Date.now(),
      request: requestMessage,
      done: false,
    });
    requestStatusMessage.textContent = "Saved with love 💖";
    requestStatusMessage.className = "status-message success";
    persistLocal();
    renderTables();
  }
  requestForm.reset();
});

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
});

requestTodoBody.addEventListener("change", async (event) => {
  const t = event.target;
  if (!(t instanceof HTMLInputElement) || t.type !== "checkbox") return;

  if (USE_CLOUD && t.dataset.requestId) {
    try {
      await updateDoc(doc(db, "birthdayWishes", t.dataset.requestId), {
        done: t.checked,
      });
    } catch (e) {
      console.error(e);
      t.checked = !t.checked;
    }
    return;
  }

  if (t.dataset.requestIndex !== undefined) {
    const index = Number(t.dataset.requestIndex);
    requestRows[index].done = t.checked;
    persistLocal();
    renderRequestTable();
  }
});

punishmentTodoBody.addEventListener("change", async (event) => {
  const t = event.target;
  if (!(t instanceof HTMLInputElement) || t.type !== "checkbox") return;

  if (USE_CLOUD && t.dataset.punishmentId) {
    try {
      await updateDoc(doc(db, "birthdayPunishments", t.dataset.punishmentId), {
        done: t.checked,
      });
    } catch (e) {
      console.error(e);
      t.checked = !t.checked;
    }
    return;
  }

  if (t.dataset.punishmentIndex !== undefined) {
    const index = Number(t.dataset.punishmentIndex);
    punishmentRows[index].done = t.checked;
    persistLocal();
    renderPunishmentTable();
  }
});

const heartsContainer = document.querySelector(".hearts-container");
const hearts = ["❤️", "💕", "💖", "💗", "💓", "💝"];
function createHeart() {
  const heart = document.createElement("div");
  heart.className = "floating-heart";
  heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
  heart.style.left = Math.random() * 100 + "%";
  heart.style.animationDuration = Math.random() * 3 + 4 + "s";
  heart.style.opacity = Math.random() * 0.5 + 0.5;
  heart.style.fontSize = Math.random() * 10 + 20 + "px";
  heartsContainer.appendChild(heart);
  setTimeout(() => heart.remove(), 7000);
}

setInterval(() => {
  if (Math.random() > 0.7) createHeart();
}, 2000);

if (USE_CLOUD) {
  startCloud();
} else {
  startLocal();
}
