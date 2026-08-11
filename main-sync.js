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
  setDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { audioEngine } from "./audio-player.js";

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
const milestoneForm = document.getElementById("milestoneForm");
const milestonesTimeline = document.getElementById("milestonesTimeline");
const couponForm = document.getElementById("couponForm");
const couponsGrid = document.getElementById("couponsGrid");
const cropModal = document.getElementById("cropModal");
const cropImage = document.getElementById("cropImage");
const cancelCropBtn = document.getElementById("cancelCropBtn");
const saveCropBtn = document.getElementById("saveCropBtn");
const selectedPreviewWrap = document.getElementById("selectedPreviewWrap");
const selectedPreviewImage = document.getElementById("selectedPreviewImage");
const lightboxOverlay = document.getElementById("lightboxOverlay");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");

const storageKey = "memory_wall_rows";
const plansKey = "couple_plan_rows";
const notesKey = "couple_note_rows";
const milestonesKey = "couple_milestone_rows";
const couponsKey = "couple_coupon_rows";

let rows = [];
let plans = [];
let notes = [];
let milestones = [];
let coupons = [];
let loveCounts = { kisses: 0, hugs: 0, misses: 0 };

let db = null;
let cropper = null;
let croppedImageDataUrl = "";

function generateUniqueId() {
  return "loc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);
}

function setSyncMessage(text, kind) {
  if (!syncStatus) return;
  syncStatus.textContent = text;
  syncStatus.className = `sync-status ${kind || ""}`.trim();
}

function saveLocal() {
  localStorage.setItem(storageKey, JSON.stringify(rows));
  localStorage.setItem(plansKey, JSON.stringify(plans));
  localStorage.setItem(notesKey, JSON.stringify(notes));
  localStorage.setItem(milestonesKey, JSON.stringify(milestones));
  localStorage.setItem(couponsKey, JSON.stringify(coupons));
}

function loadLocal() {
  rows = JSON.parse(localStorage.getItem(storageKey) || "[]").map(item => ({
    id: item.id || generateUniqueId(),
    ...item
  }));
  plans = JSON.parse(localStorage.getItem(plansKey) || "[]").map(item => ({
    id: item.id || generateUniqueId(),
    ...item
  }));
  notes = JSON.parse(localStorage.getItem(notesKey) || "[]").map(item => ({
    id: item.id || generateUniqueId(),
    ...item
  }));
  milestones = JSON.parse(localStorage.getItem(milestonesKey) || "[]").map(item => ({
    id: item.id || generateUniqueId(),
    ...item
  }));
  
  const savedCoupons = JSON.parse(localStorage.getItem(couponsKey) || "[]");
  if (savedCoupons.length === 0) {
    coupons = getDefaultCoupons();
  } else {
    coupons = savedCoupons.map(item => ({
      id: item.id || generateUniqueId(),
      ...item
    }));
  }
}

function getDefaultCoupons() {
  return [
    { id: generateUniqueId(), title: "💆‍♂️ 1 Free Back Massage", desc: "Redeemable anytime after a long stressful day!", redeemed: false },
    { id: generateUniqueId(), title: "🍿 You Pick Movie Night", desc: "No complaints, your movie choice guaranteed!", redeemed: false },
    { id: generateUniqueId(), title: "🕊️ No Arguments Pass", desc: "Instant win for any friendly disagreement!", redeemed: false },
    { id: generateUniqueId(), title: "🍳 Chef's Special Meal", desc: "I cook your favorite meal with extra love!", redeemed: false },
    { id: generateUniqueId(), title: "🍦 Late Night Ice Cream Run", desc: "Immediate trip to get your favorite dessert!", redeemed: false }
  ];
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function openLightbox(src, caption) {
  if (!lightboxOverlay || !lightboxImage) return;
  lightboxImage.src = src;
  if (lightboxCaption) lightboxCaption.textContent = caption || "";
  lightboxOverlay.classList.add("active");
}

if (lightboxClose) {
  lightboxClose.addEventListener("click", () => lightboxOverlay.classList.remove("active"));
}
if (lightboxOverlay) {
  lightboxOverlay.addEventListener("click", (e) => {
    if (e.target === lightboxOverlay) lightboxOverlay.classList.remove("active");
  });
}

function render() {
  if (!memoriesGrid) return;
  memoriesGrid.innerHTML = "";
  rows
    .slice()
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .forEach((row) => {
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
        <img class="memory-photo" src="${row.imageDataUrl}" alt="Memory photo" style="cursor:pointer;" />
        <p class="memory-comment">${row.comment}</p>
        <p class="memory-feeling">Feeling: ${row.feeling}</p>
        <p class="memory-date">${formatDate(row.createdAt)}</p>
        <div class="replies-box">${replies || "<em>No replies yet.</em>"}</div>
        <div class="reply-form-inline">
          <input type="text" placeholder="Write a reply..." data-reply-input="${row.id}" />
          <button class="row-btn edit-btn" data-reply-add="${row.id}">Reply</button>
          <button class="row-btn delete-btn" data-memory-delete="${row.id}">Delete</button>
        </div>
      `;

      card.querySelector(".memory-photo").addEventListener("click", () => {
        openLightbox(row.imageDataUrl, `${row.comment} (${row.feeling})`);
      });

      memoriesGrid.appendChild(card);
    });
}

function renderPlans() {
  if (!plansBody) return;
  plansBody.innerHTML = "";
  plans
    .slice()
    .sort((a, b) => String(a.planDate).localeCompare(String(b.planDate)))
    .forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.planDate || "-"}</td>
        <td>${row.title || ""}</td>
        <td>${row.location || ""}</td>
        <td>${row.note || ""}</td>
        <td>
          <label class="toggle-label">
            <input type="checkbox" data-plan-toggle="${row.id}" ${row.done ? "checked" : ""} />
            <span>${row.done ? "Done" : "Pending"}</span>
          </label>
        </td>
        <td class="row-actions">
          <button class="row-btn edit-btn" data-plan-edit="${row.id}">Update</button>
          <button class="row-btn delete-btn" data-plan-delete="${row.id}">Delete</button>
        </td>
      `;
      plansBody.appendChild(tr);
    });
}

function renderNotes() {
  if (!notesList) return;
  notesList.innerHTML = "";
  notes
    .slice()
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .forEach((row) => {
      const item = document.createElement("div");
      item.className = "note-item";
      item.innerHTML = `
        <div>
          <strong>${row.sender}</strong> - ${row.text}
          <small>${formatDate(row.createdAt)}</small>
        </div>
        <div class="row-actions">
          <button class="row-btn edit-btn" data-note-edit="${row.id}">Update</button>
          <button class="row-btn delete-btn" data-note-delete="${row.id}">Delete</button>
        </div>
      `;
      notesList.appendChild(item);
    });
}

function renderMilestones() {
  if (!milestonesTimeline) return;
  milestonesTimeline.innerHTML = "";
  if (milestones.length === 0) {
    milestonesTimeline.innerHTML = `<p style="color:#777;font-style:italic;">No milestones added yet. Add your first memory above!</p>`;
    return;
  }
  milestones
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .forEach((item) => {
      const card = document.createElement("div");
      card.className = "milestone-card";
      card.innerHTML = `
        <div class="milestone-date-badge">${item.date}</div>
        <div class="milestone-content">
          <h3 class="milestone-title">${item.title}</h3>
          <p class="milestone-desc">${item.desc}</p>
        </div>
        <div class="row-actions">
          <button class="row-btn delete-btn" data-milestone-delete="${item.id}">Delete</button>
        </div>
      `;
      milestonesTimeline.appendChild(card);
    });
}

function renderCoupons() {
  if (!couponsGrid) return;
  couponsGrid.innerHTML = "";
  coupons.forEach((c) => {
    const card = document.createElement("div");
    card.className = `coupon-card ${c.redeemed ? "redeemed" : ""}`;
    card.innerHTML = `
      <div class="coupon-title">${c.title}</div>
      <div class="coupon-desc">${c.desc}</div>
      ${c.redeemed ? `<div class="stamp-redeemed">REDEEMED</div>` : `<button class="redeem-btn" data-coupon-redeem="${c.id}">Redeem Coupon 🎟️</button>`}
    `;
    couponsGrid.appendChild(card);
  });
}

function renderLoveCounts() {
  const kissBadge = document.getElementById("kissCountBadge");
  const hugBadge = document.getElementById("hugCountBadge");
  const missBadge = document.getElementById("missCountBadge");
  if (kissBadge) kissBadge.textContent = loveCounts.kisses || 0;
  if (hugBadge) hugBadge.textContent = loveCounts.hugs || 0;
  if (missBadge) missBadge.textContent = loveCounts.misses || 0;
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function closeCropModal(clearSelection = false) {
  if (!cropModal) return;
  cropModal.classList.remove("active");
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  if (clearSelection) {
    if (photoInput) photoInput.value = "";
    croppedImageDataUrl = "";
    if (selectedPreviewWrap) selectedPreviewWrap.classList.remove("show");
    if (selectedPreviewImage) selectedPreviewImage.removeAttribute("src");
  }
}

function openCropModal(dataUrl) {
  if (!cropModal || !cropImage) return;
  cropModal.classList.add("active");
  cropImage.src = dataUrl;
  cropImage.onload = () => {
    if (cropper) cropper.destroy();
    cropper = new window.Cropper(cropImage, {
      viewMode: 1,
      autoCropArea: 1,
      responsive: true,
      background: false,
      movable: true,
      zoomable: true,
      preview: ".crop-preview-box",
    });
  };
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
  onSnapshot(collection(db, "coupleMilestones"), (snap) => {
    milestones = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderMilestones();
  });
  onSnapshot(collection(db, "loveCoupons"), (snap) => {
    if (snap.empty) {
      coupons = getDefaultCoupons();
    } else {
      coupons = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    renderCoupons();
  });
  onSnapshot(doc(db, "coupleKisses", "counts"), (snap) => {
    if (snap.exists()) {
      loveCounts = snap.data();
      renderLoveCounts();
    }
  });
  setSyncMessage("Live cloud sync active 💞", "success");
} else {
  loadLocal();
  render();
  renderPlans();
  renderNotes();
  renderMilestones();
  renderCoupons();
  loveCounts = JSON.parse(localStorage.getItem("couple_love_counts") || '{"kisses":0,"hugs":0,"misses":0}');
  renderLoveCounts();
  setSyncMessage("Local mode on. Add Firebase config for live cloud sync.", "warning");
}

if (photoInput) {
  photoInput.addEventListener("change", async () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    try {
      const raw = await readImageAsDataUrl(file);
      openCropModal(raw);
      if (statusMessage) {
        statusMessage.textContent = "Adjust photo crop and click Save Crop.";
        statusMessage.className = "status-message warning";
      }
    } catch (error) {
      console.error(error);
      if (statusMessage) {
        statusMessage.textContent = "Could not open image.";
        statusMessage.className = "status-message error";
      }
    }
  });
}

if (cancelCropBtn) cancelCropBtn.addEventListener("click", () => closeCropModal(true));
if (saveCropBtn) {
  saveCropBtn.addEventListener("click", () => {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 600,
      maxHeight: 600,
      fillColor: "#fff",
    });
    croppedImageDataUrl = canvas.toDataURL("image/jpeg", 0.75);
    if (selectedPreviewImage) selectedPreviewImage.src = croppedImageDataUrl;
    if (selectedPreviewWrap) selectedPreviewWrap.classList.add("show");
    closeCropModal(false);
    if (statusMessage) {
      statusMessage.textContent = "Photo adjusted! Now click Add Memory.";
      statusMessage.className = "status-message success";
    }
  });
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!croppedImageDataUrl) {
      if (statusMessage) {
        statusMessage.textContent = "Please upload and crop the photo first.";
        statusMessage.className = "status-message error";
      }
      return;
    }

    try {
      const payload = {
        imageDataUrl: croppedImageDataUrl,
        comment: commentInput.value.trim(),
        feeling: feelingInput.value.trim(),
        createdAt: Date.now(),
        replies: [],
      };

      if (USE_CLOUD) {
        await addDoc(collection(db, "birthdayMemories"), payload);
      } else {
        payload.id = generateUniqueId();
        rows.unshift(payload);
        saveLocal();
        render();
      }

      form.reset();
      if (photoInput) photoInput.value = "";
      croppedImageDataUrl = "";
      if (selectedPreviewWrap) selectedPreviewWrap.classList.remove("show");
      if (selectedPreviewImage) selectedPreviewImage.removeAttribute("src");
      if (statusMessage) {
        statusMessage.textContent = "Memory added successfully 💖";
        statusMessage.className = "status-message success";
      }
      audioEngine.playChimeSound();
    } catch (error) {
      console.error(error);
      if (statusMessage) {
        statusMessage.textContent = "Could not add memory.";
        statusMessage.className = "status-message error";
      }
    }
  });
}

if (memoriesGrid) {
  memoriesGrid.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    if (target.dataset.replyAdd) {
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
        const item = rows.find(r => String(r.id) === String(key));
        if (item) {
          item.replies = item.replies || [];
          item.replies.push({ text, createdAt: Date.now() });
          saveLocal();
          render();
        }
      }
      audioEngine.playChimeSound();
    }

    if (target.dataset.memoryDelete) {
      const key = target.dataset.memoryDelete;
      if (!window.confirm("Delete this memory?")) return;
      if (USE_CLOUD) {
        await deleteDoc(doc(db, "birthdayMemories", key));
      } else {
        rows = rows.filter(r => String(r.id) !== String(key));
        saveLocal();
        render();
      }
    }
  });
}

if (planForm) {
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
      payload.id = generateUniqueId();
      plans.push(payload);
      saveLocal();
      renderPlans();
    }
    planForm.reset();
    audioEngine.playChimeSound();
  });
}

if (noteForm) {
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
      payload.id = generateUniqueId();
      notes.unshift(payload);
      saveLocal();
      renderNotes();
    }
    noteForm.reset();
    audioEngine.playChimeSound();
  });
}

if (milestoneForm) {
  milestoneForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      title: document.getElementById("milestoneTitle").value.trim(),
      date: document.getElementById("milestoneDate").value,
      desc: document.getElementById("milestoneDesc").value.trim(),
      createdAt: Date.now(),
    };
    if (USE_CLOUD) {
      await addDoc(collection(db, "coupleMilestones"), payload);
    } else {
      payload.id = generateUniqueId();
      milestones.push(payload);
      saveLocal();
      renderMilestones();
    }
    milestoneForm.reset();
    audioEngine.playChimeSound();
  });
}

if (milestonesTimeline) {
  milestonesTimeline.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (target.dataset.milestoneDelete) {
      const key = target.dataset.milestoneDelete;
      if (!window.confirm("Delete this milestone?")) return;
      if (USE_CLOUD) {
        await deleteDoc(doc(db, "coupleMilestones", key));
      } else {
        milestones = milestones.filter(m => String(m.id) !== String(key));
        saveLocal();
        renderMilestones();
      }
    }
  });
}

if (couponForm) {
  couponForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      title: document.getElementById("couponTitle").value.trim(),
      desc: document.getElementById("couponDesc").value.trim(),
      redeemed: false,
      createdAt: Date.now(),
    };
    if (USE_CLOUD) {
      await addDoc(collection(db, "loveCoupons"), payload);
    } else {
      payload.id = generateUniqueId();
      coupons.unshift(payload);
      saveLocal();
      renderCoupons();
    }
    couponForm.reset();
    audioEngine.playChimeSound();
  });
}

if (couponsGrid) {
  couponsGrid.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (target.dataset.couponRedeem) {
      const key = target.dataset.couponRedeem;
      if (USE_CLOUD) {
        await updateDoc(doc(db, "loveCoupons", key), { redeemed: true });
      } else {
        const item = coupons.find(c => String(c.id) === String(key));
        if (item) {
          item.redeemed = true;
          saveLocal();
          renderCoupons();
        }
      }
      audioEngine.playChimeSound();
      if (window.confetti) window.confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    }
  });
}

if (plansBody) {
  plansBody.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target instanceof HTMLInputElement && target.dataset.planToggle) {
      const key = target.dataset.planToggle;
      if (USE_CLOUD) {
        await updateDoc(doc(db, "couplePlans", key), { done: target.checked });
      } else {
        const item = plans.find(p => String(p.id) === String(key));
        if (item) {
          item.done = target.checked;
          saveLocal();
          renderPlans();
        }
      }
      return;
    }

    if (!(target instanceof HTMLButtonElement)) return;
    if (target.dataset.planEdit) {
      const key = target.dataset.planEdit;
      const row = plans.find((p) => String(p.id) === String(key));
      if (!row) return;
      const title = window.prompt("Update plan title:", row.title);
      if (!title || !title.trim()) return;
      const note = window.prompt("Update note:", row.note || "") || "";
      if (USE_CLOUD) {
        await updateDoc(doc(db, "couplePlans", key), { title: title.trim(), note: note.trim() });
      } else {
        row.title = title.trim();
        row.note = note.trim();
        saveLocal();
        renderPlans();
      }
    }
    if (target.dataset.planDelete) {
      const key = target.dataset.planDelete;
      if (!window.confirm("Delete this plan?")) return;
      if (USE_CLOUD) {
        await deleteDoc(doc(db, "couplePlans", key));
      } else {
        plans = plans.filter(p => String(p.id) !== String(key));
        saveLocal();
        renderPlans();
      }
    }
  });
}

if (notesList) {
  notesList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    if (target.dataset.noteEdit) {
      const key = target.dataset.noteEdit;
      const row = notes.find((n) => String(n.id) === String(key));
      if (!row) return;
      const text = window.prompt("Update note:", row.text);
      if (!text || !text.trim()) return;
      if (USE_CLOUD) {
        await updateDoc(doc(db, "coupleNotes", key), { text: text.trim() });
      } else {
        row.text = text.trim();
        saveLocal();
        renderNotes();
      }
    }

    if (target.dataset.noteDelete) {
      const key = target.dataset.noteDelete;
      if (!window.confirm("Delete this note?")) return;
      if (USE_CLOUD) {
        await deleteDoc(doc(db, "coupleNotes", key));
      } else {
        notes = notes.filter(n => String(n.id) !== String(key));
        saveLocal();
        renderNotes();
      }
    }
  });
}

// Kiss / Hug button listeners for main.html
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
