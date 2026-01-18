/* ---------- EmailJS init ---------- */
(function(){
  try { emailjs.init("yUJEEAKbGwrHzv8i9"); } 
  catch(e){ console.warn("EmailJS init failed:", e); }
})();

const SERVICE_ID = "service_9fhwe9u";
const ADMIN_TEMPLATE = "template_1obxz4e";
const CUSTOMER_TEMPLATE = "template_p1tsqz7";

/* ---------- Services data ---------- */
const serviceDescriptions = {
  "Basic Wash": "A contact and non-contact exterior wash.",
  "Wash & Wax": "Includes a full contact + non-contact wash and a hand wax.",
  "Wash, Wax & Polish": "Full wash, hand wax, and paint correction polish.",
  "Interior Only": "full interior clean including windows, carpets, seats, dashboard and roof.",
  "Interor Deep Clean": "Deep interior clean using a steamer as well as the basic products.",
  "Premium Valet": "Full interior deep clean + exterior clean.",
  "Ceramic Coating": "4-month ceramic protective coating (3 hours)."
};

const services = {
  "Small Car": [
    { name: "Basic Wash", price: 10 },
    { name: "Wash & Wax", price: 20 },
    { name: "Wash, Wax & Polish", price: 40 },
    { name: "Interior Only", price: 30 },
    { name: "Interior Deep Clean", price: 45 },
    { name: "Premium Valet", price: 95 },
    { name: "Ceramic Coating", price: 205 }
  ],
  "Medium Car": [
    { name: "Basic Wash", price: 20 },
    { name: "Wash & Wax", price: 30 },
    { name: "Wash, Wax & Polish", price: 50 },
    { name: "Interior Only", price: 35 },
    { name: "Interior Deep clean", price: 55 },
    { name: "Premium Valet", price: 105 },
    { name: "Ceramic Coating", price: 230 }
  ],
  "Large Car": [
    { name: "Basic Wash", price: 30 },
    { name: "Wash & Wax", price: 40 },
    { name: "Wash, Wax & Polish", price: 60 },
    { name: "Interior Only", price: 45 },
    { name: "Interior Deep clean", price: 65 },
    { name: "Premium Valet", price: 130 },
    { name: "Ceramic Coating", price: 250 }
  ],
  "Small Van": [
    { name: "Basic Wash", price: 30 },
    { name: "Wash & Wax", price: 50 },
    { name: "Wash, Wax & Polish", price: 70 },
    { name: "Interior Only", price: 35 },
    { name: "Interior Deep clean", price: 45 },
    { name: "Premium Valet", price: 135 },
    { name: "Ceramic Coating", price: 270 }
  ],
  "Large Van": [
    { name: "Basic Wash", price: 35 },
    { name: "Wash & Wax", price: 60 },
    { name: "Wash, Wax & Polish", price: 80 },
    { name: "Interior Only", price: 45 },
    {name: "Interior Deep clean", price: 55 },
    { name: "Premium Valet", price: 145 },
    { name: "Ceramic Coating", price: 395 }
  ]
};

/* ---------- Helper ---------- */
const $ = id => document.getElementById(id);

/* ---------- Disable past dates ---------- */
const dateInput = $("date");
dateInput.min = new Date().toISOString().split("T")[0];

/* ---------- API + time config ---------- */
const API_URL = "/.netlify/functions/bookings";

const TIME_SLOTS = [
  "09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00",
  "17:00","18:00","19:00"
];

const CERAMIC_BLOCK = ["09:00","10:00","11:00"];

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

/* ---------- Time slots ---------- */
const timeSelect = $("timeSlot");

async function fetchBookedTimes(date) {
  const res = await fetch(`${API_URL}?date=${date}`);
  if (!res.ok) return [];
  return await res.json();
}

async function loadSlots() {
  const date = dateInput.value;
  timeSelect.innerHTML = `<option value="">Select time</option>`;
  if (!date) return;

  const booked = await fetchBookedTimes(date);
  const isCeramic =
    serviceSelect.value &&
    serviceSelect.value.startsWith("Ceramic");

  TIME_SLOTS.forEach(time => {
    const opt = document.createElement("option");
    opt.value = time;

    if (isCeramic) {
      opt.textContent =
        time === "09:00"
          ? "09:00 — Ceramic (3 hrs)"
          : `${time} — Unavailable`;
      opt.disabled = time !== "09:00";
    } else {
      opt.textContent = booked.includes(time)
        ? `${time} — Booked`
        : time;
      opt.disabled = booked.includes(time);
    }

    timeSelect.appendChild(opt);
  });
}

dateInput.addEventListener("change", loadSlots);
serviceSelect.addEventListener("change", loadSlots);

/* ---------- Submit ---------- */
const bookingForm = $("bookingForm");
const formMessage = $("formMessage");

bookingForm.addEventListener("submit", async e => {
  e.preventDefault();

  const date = dateInput.value;
  const time = timeSelect.value;
  const svcVal = serviceSelect.value;

  if (!date || !time || !svcVal) {
    alert("Please complete all fields.");
    return;
  }

  const isCeramic = svcVal.startsWith("Ceramic");
  const blockTimes = isCeramic ? CERAMIC_BLOCK : [time];

  const booked = await fetchBookedTimes(date);
  if (blockTimes.some(t => booked.includes(t))) {
    alert("That time slot is already booked. Please choose another.");
    return;
  }

  for (const t of blockTimes) {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, time: t })
    });
  }

  const adminParams = {
    name: $("customerName").value,
    phone: $("phone").value,
    email: $("email").value,
    vehicle: vehicleSelect.value,
    service: svcVal.split("|")[0],
    date,
    time,
    address: $("address").value,
    notes: $("notes").value
  };

  const submitBtn = bookingForm.querySelector("button");
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  emailjs.send(SERVICE_ID, ADMIN_TEMPLATE, adminParams)
    .then(() => {
      if (adminParams.email) {
        return emailjs.send(SERVICE_ID, CUSTOMER_TEMPLATE, adminParams);
      }
    })
    .then(() => {
      formMessage.style.color = "lightgreen";
      formMessage.textContent = "Booking confirmed.";

      /* ===== ONLY ADDED BITS BELOW ===== */
      const savedDate = dateInput.value;   // keep date
      bookingForm.reset();
      dateInput.value = savedDate;          // restore date
      /* ================================= */

      timeSelect.innerHTML = `<option value="">Select time</option>`;
      loadSlots(); // refresh booked slots
    })
    .catch(() => {
      formMessage.style.color = "tomato";
      formMessage.textContent = "Error sending booking.";
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Booking";
    });
});




