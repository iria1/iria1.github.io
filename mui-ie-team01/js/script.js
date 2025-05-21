const apiBase = "http://3.24.137.108:5000";
const aqiColors = ["#66bb6a", "#ffa726", "#ef5350"];
const getAQIColor = (level) => aqiColors[level] || "#000";

const stateSelect = document.getElementById("state-select");
const citySelect = document.getElementById("city-select");
const aqiContent = document.getElementById("aqi-content");
const recommendationContent = document.getElementById("recommendation-content");
const errorMsg = document.getElementById("error-msg");
const locationName = document.getElementById("location-name");

function setRecommendationColor(caption) {
    if (caption === "Not required" || caption === "Keep indoors" || caption === "Closed") return "#ffcccc";
    if (caption === "Recommended" || caption === "Outdoors optional" || caption === "Optional") return "#ffe5b4";
    if (caption === "Required" || caption === "Outdoors allowed" || caption === "Open") return "#ccffcc";
    return "#f0f0f0";
}

async function loadStates() {
    const res = await fetch(`${apiBase}/list_states`);
    const data = await res.json();
    data.data.forEach(state => {
        const option = document.createElement("option");
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
}

async function loadCities(state) {
    citySelect.innerHTML = '<option value="">Select City</option>';
    citySelect.disabled = true;
    const res = await fetch(`${apiBase}/list_cities?state=${encodeURIComponent(state)}`);
    const data = await res.json();
    data.data.forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
    citySelect.disabled = false;
}

async function fetchAQIByLocation(lat, lon) {
    try {
        const res = await fetch(`${apiBase}/get_aq_data_by_coord?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        displayAQI(data);
    } catch {
        showError();
    }
}

async function fetchAQIByName(city, state) {
    try {
        const res = await fetch(`${apiBase}/get_aq_data_by_name?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`);
        const data = await res.json();
        displayAQI(data);
    } catch {
        showError();
    }
}

function displayAQI(data) {
    errorMsg.style.display = "none";
    const color = getAQIColor(data.air_quality);
    locationName.textContent = `${data.city || 'Not Retrievable'}, ${data.country || 'Not Retrievable'}`;

    aqiContent.innerHTML = `
        <div class="aqi-center">
          <div class="status" style="color: ${color};">${data.air_quality_caption || '<span style=\"color:red\">Not Retrievable</span>'}</div>
          <div class="timestamp">${new Date(data.timestamp).toLocaleString() || '<span style=\"color:red\">Not Retrievable</span>'}</div>
        </div>
        <div class="aqi-right" style="color: ${color};">
          ${data.aqius || '<span style=\"color:red\">Not Retrievable</span>'}
          <span>AQI</span>
        </div>
      `;

    recommendationContent.innerHTML = [
        { title: "Mask Usage", img: "img/mask.png", caption: data.mask_caption },
        { title: "Outdoor Activities", img: "img/outdoor.png", caption: data.activity_caption },
        { title: "Window Ventilation", img: "img/window.png", caption: data.ventilation_caption }
    ].map(rec => `
        <div class="recommendation-box" style="background-color:${setRecommendationColor(rec.caption)}">
          <div class="recommendation-title">${rec.title}</div>
          <img src="${rec.img}" alt="${rec.title}">
          <div class="recommendation-caption">${rec.caption || '<span style=\"color:red\">Not Retrievable</span>'}</div>
        </div>
      `).join('');
}

function showError() {
    aqiContent.innerHTML = '';
    recommendationContent.innerHTML = '';
    locationName.textContent = '';
    errorMsg.style.display = "block";
}

stateSelect.addEventListener("change", () => {
    const state = stateSelect.value;
    if (state) loadCities(state);
});

citySelect.addEventListener("change", () => {
    const city = citySelect.value;
    const state = stateSelect.value;
    if (city && state) fetchAQIByName(city, state);
});

document.getElementById("use-location-btn").addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(
        (pos) => fetchAQIByLocation(pos.coords.latitude, pos.coords.longitude),
        () => showError()
    );
});

window.onload = () => {
    loadStates();
    navigator.geolocation.getCurrentPosition(
        (pos) => fetchAQIByLocation(pos.coords.latitude, pos.coords.longitude),
        () => showError()
    );
};