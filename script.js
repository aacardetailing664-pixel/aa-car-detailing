/* ---------- EmailJS init ---------- */
(function(){
  try { emailjs.init("yUJEEAKbGwrHzv8i9"); } 
  catch(e){ console.warn("EmailJS init failed:", e); }
})();

const SERVICE_ID = "service_9fhwe9u";
const ADMIN_TEMPLATE = "template_1obxz4e";
const CUSTOMER_TEMPLATE = "template_p1tsqz7";

/* ---------- ADDED: API base for your Node server ---------- */
const API_BASE = "http://localhost:3000";

/* ---------- Services data ---------- */
const serviceDescriptions = {
  "Basic Wash": "A contact and non-contact exterior wash.",
  "Wash & Wax": "Includes a full contact + non-contact wash and a hand wax.",
  "Wash, Wax & Polish": "Full wash, hand wax, and paint correction polish.",
  "Interior Only": "Deep interior clean.",
  "Premium Valet": "Full interior + exterior clean.",
  "Ceramic Coating": "4-month ceramic protective coating (3 hours)."
};

const services = {
  "Small Car": [
    { name: "Basic Wash", price: 15 },
    { name: "Wash & Wax", price: 25 },
    { name: "Wash, Wax & Polish", price: 45 },
    { name: "Interior Only", price: 35 },
    { name: "Premium Valet", price: 100 },
    { name: "Ceramic Coating", price: 210 }
  ],
  "Medium Car": [
    { name: "Basic Wash", price: 25 },
    { name: "Wash & Wax", price: 35 },
    { name: "Wash, Wax & Polish", price: 55 },
    { name: "Interior Only", price: 40 },
    { name: "Premium Valet", price: 125 },
    { name: "Ceramic Coating", price: 235 }
  ],
  "Large Car": [
    { name: "Basic Wash", price: 35 },
    { name: "Wash & Wax", price: 45 },
    { name: "Wash, Wax & Polish", price: 65 },
    { name: "Interior Only", price: 50 },
    { name: "Premium Valet", price: 135 },
    { name: "Ceramic Coating", price: 255 }
  ],
  "Small Van": [
    { name: "Basic Wash", price: 30 },
    { name: "Wash & Wax", price: 55 },
    { name: "Wash, Wax & Polish", price: 75 },
    { name: "Interior Only", price: 40 },
    { name: "Premium Valet", price: 140 },
    { name: "Ceramic Coating", price: 275 }
  ],
  "Large Van": [
    { name: "Basic Wash", price: 40 },
    { name: "Wash & Wax", price: 65 },
    { name: "Wash, Wax & Polish", price: 85 },
    { name: "Interior Only", price: 50 },
    { name: "Premium Valet", price: 150 },
    { name: "Ceramic Coating", price: 300 }
  ]
};

/* ---------- Helper ---------- */
const $ = id => document.getElementById(id);

/* ---------- Disable past dates ---------- */
const dateInput = $("date");
const today = new Date().toISOString().split("T")[0];
dateInput.min = today;

/* ---------- Render services ---------- */
const serviceList = $("serviceList");
serviceList.innerHTML = "";

Object.keys(services).forEach(cat => {
  const card = document.createElement("div");
  card.className = "service-card";
  card.innerHTML = `<h3>${cat}</h3>` + services[cat].map(s => `
    <p><strong>${s.name}</strong> — £${s.price}<br>
    <span style="color:#bfbfbf;font-size:0.9rem;">${serviceDescriptions[s.name]}</span></p>
  `).join("");
  serviceList.appendChild(card);
});

/* ---------- Dropdown ---------- */
const vehicleSelect = $("vehicleType");
const serviceSelect = $("service");
const priceDisplay = $("priceDisplay");

vehicleSelect.addEventListener("change", () => {
  serviceSelect.innerHTML = `<option value="">Select service</option>`;
  priceDisplay.textContent = "Price: —";
  (services[vehicleSelect.value] || []).forEach(s => {
    const o = document.createElement("option");
    o.value = `${s.name}|${s.price}`;
    o.textContent = `${s.name} — £${s.price}`;
    serviceSelect.appendChild(o);
  });
});

serviceSelect.addEventListener("change", () => {
  priceDisplay.textContent = serviceSelect.value
    ? `Price: £${serviceSelect.value.split("|")[1]}`
    : "Price: —";
});

/* =========================================================
   TIME SLOTS + CERAMIC BLOCKING
   ========================================================= */

const TIME_SLOTS = [
  "09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00",
  "17:00","18:00","19:00"
];

const CERAMIC_BLOCK = ["09:00","10:00","11:00"]; // 3 hours
const timeSelect = $("timeSlot");

/* ---------- ADDED: server helpers ---------- */
async function fetchBookedTimes(date) {
  const res = await fetch(`${API_BASE}/bookings?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return await res.json(); // array of times
}

async function saveBookedTimes(date, times) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, times })
  });

  if (res.status === 409) return { ok: false, reason: "conflict" };
  if (!res.ok) return { ok: false, reason: "server" };
  return { ok: true };
}

/* ---- Load time slots ---- */
dateInput.addEventListener("change", loadSlots);
serviceSelect.addEventListener("change", loadSlots);

/* ---------- loadSlots must be async to read server ---------- */
async function loadSlots() {
  const date = dateInput.value;
  timeSelect.innerHTML = `<option value="">Select time</option>`;
  if (!date) return;

  let booked = [];
  try {
    booked = await fetchBookedTimes(date);
  } catch (err) {
    console.error(err);
    return;
  }

  const isCeramic = serviceSelect.value.startsWith("Ceramic Coating");

  TIME_SLOTS.forEach(time => {
    const opt = document.createElement("option");
    opt.value = time;

    if (isCeramic) {
      opt.textContent = time === "09:00" ? "09:00 — Ceramic Only" : `${time} — Unavailable`;
      opt.disabled = time !== "09:00" || CERAMIC_BLOCK.some(t => booked.includes(t));
      if (time === "09:00" && opt.disabled) opt.textContent = "09:00 — Unavailable";
    } else {
      opt.textContent = booked.includes(time) ? `${time} — Booked` : time;
      opt.disabled = booked.includes(time);
    }

    timeSelect.appendChild(opt);
  });
}

/* ---------- Submit ---------- */
const bookingForm = $("bookingForm");
const formMessage = $("formMessage");

/* ---------- submit must be async to save to server ---------- */
bookingForm.addEventListener("submit", async e => {
  e.preventDefault();

  const date = dateInput.value;
  const time = timeSelect.value;
  const svcVal = serviceSelect.value;
  if (!date || !time || !svcVal) return alert("Complete all fields.");

  const isCeramic = svcVal.startsWith("Ceramic Coating");

  /* ---------- ADDED: save booking to Node server (shared) ---------- */
  const timesToBook = isCeramic ? CERAMIC_BLOCK : [time];

  const saveResult = await saveBookedTimes(date, timesToBook);
  if (!saveResult.ok) {
    if (saveResult.reason === "conflict") {
      alert("That slot was just booked by someone else. Please choose another time.");
      await loadSlots();
      return;
    }
    alert("Server error saving booking. Please try again.");
    return;
  }

  /* ---- Email ---- */
  const adminParams = {
    name: $("customerName").value,
    phone: $("phone").value,
    email: $("email").value,
    vehicle: $("vehicleType").value,
    service: svcVal.split("|")[0],
    date,
    time,
    address: $("address").value,
    notes: $("notes").value
  };

  /* ---------- ADDED: customerParams for customer email ---------- */
  const customerParams = {
    ...adminParams,
    to_email: $("email").value
  };

  const submitBtn = bookingForm.querySelector("button");
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  emailjs.send(SERVICE_ID, ADMIN_TEMPLATE, adminParams)
    /* ---------- ADDED: make success handler async so we can await loadSlots ---------- */
    .then(async () => {
      /* ---------- ADDED: send customer email too (if provided) ---------- */
      if (customerParams.to_email) {
        await emailjs.send(SERVICE_ID, CUSTOMER_TEMPLATE, customerParams);
      }

      formMessage.style.color = "lightgreen";
      formMessage.textContent = "Booking confirmed.";

      /* ---------- ADDED: keep date/service so dropdown can refresh and show booked ---------- */
      const keepDate = dateInput.value;
      const keepService = serviceSelect.value;

      bookingForm.reset();

      dateInput.value = keepDate;
      serviceSelect.value = keepService;

      /* ---------- ADDED: reload times from server to show booked slots ---------- */
      await loadSlots();
    })
    .catch((err) => {
      console.error("EmailJS error:", err);
      formMessage.style.color = "tomato";
      formMessage.textContent = "Error sending booking.";
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Booking";
    });
});
