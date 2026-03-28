// Variables for unit toggle and data storage
let isCelsius = true;
let currentTemp = 0;
let forecastTemps = [];
let chartTemps = [];
let timer;
let chart;

// Main function to get weather by city
async function getWeather() {
    const city = document.getElementById("city").value.trim();

    if (!city) {
        showErrorModal("Please enter a city name.");
        return;
    }
console.log("City entered:", city);
    document.getElementById("message").innerText = "";

    const apiKey = "a669d9f325da77f4f44aeaec403f5362";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // FIX: Handle both string & number
        if (data.cod == 404) {
            showErrorModal("City not found. Please check the name and try again.");
            clearWeatherDisplay();
            if (chart) chart.destroy(); // FIX: clear chart
            return;
        }

        // Weather icon
        const icon = data.weather[0].icon;
        document.getElementById("weatherIcon").src =
            `https://openweathermap.org/img/wn/${icon}@2x.png`;

        // Country name
        const regions = new Intl.DisplayNames(['en'], { type: 'region' });
        const country = regions.of(data.sys.country);

        document.getElementById("cityName").innerText = `${data.name}, ${country}`;
        currentTemp = data.main.temp;

        // FIX: Ensure ID matches your HTML (temperature not temprature)
        document.getElementById("temperature").innerText = currentTemp + "°C";

        document.getElementById("description").innerText = data.weather[0].description;

        changeBackground(data.weather[0].main);
        updateTime(data.timezone);
        getForecast(city);

    } catch (err) {
        showErrorModal("Error fetching weather data. Please try again later.");
        clearWeatherDisplay();
        if (chart) chart.destroy(); // FIX
    }
}

// Clears weather display
function clearWeatherDisplay() {
    document.getElementById("cityName").innerText = "";
    document.getElementById("temperature").innerText = "";
    document.getElementById("description").innerText = "";
    document.getElementById("dateTime").innerText = "";
    document.getElementById("forecastContainer").innerHTML = "";
}

// Get weather for user's location
navigator.geolocation.getCurrentPosition(
    async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const apiKey = "a669d9f325da77f4f44aeaec403f5362";
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const regions = new Intl.DisplayNames(['en'], { type: 'region' });
            const country = regions.of(data.sys.country);

            document.getElementById("cityName").innerText = `${data.name}, ${country}`;
            currentTemp = data.main.temp;
            document.getElementById("temperature").innerText = currentTemp + "°C";
            document.getElementById("description").innerText = data.weather[0].description;

            changeBackground(data.weather[0].main);
            updateTime(data.timezone);

            getForecast(data.name); // FIX: load forecast too

        } catch (err) {
            showErrorModal("Error fetching weather data for your location.");
        }
    },
    () => {
        showErrorModal("Unable to access your location. Please allow access or search manually.");
    }
);

// Time update
function updateTime(timezone) {
    clearInterval(timer);

    timer = setInterval(() => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const cityTime = new Date(utc + (timezone * 1000));

        document.getElementById("dateTime").innerText =
            cityTime.toDateString() + " | " + cityTime.toLocaleTimeString();
    }, 1000);
}

// Background change
function changeBackground(weather) {
    const w = weather.toLowerCase();

    const backgrounds = {
        clear: "linear-gradient(to right, #fceabb, #f8b500)",
        clouds: "linear-gradient(to right, #d7d2cc, #304352)",
        rain: "linear-gradient(to right, #373b44, #4286f4)",
        drizzle: "linear-gradient(to right, #373b44, #4286f4)",
        thunderstorm: "linear-gradient(to right, #0f2027, #203a43, #2c5364)",
        snow: "linear-gradient(to right, #e6dada, #274046)",
        mist: "linear-gradient(to right, #757f9a, #d7dde8)"
    };

    document.body.style.backgroundImage =
        backgrounds[w] || "linear-gradient(to right, #4facfe, #00f2fe)";
}

// Get forecast
async function getForecast(city) {
    const apiKey = "a669d9f325da77f4f44aeaec403f5362";
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const container = document.getElementById("forecastContainer");
        container.innerHTML = "";
        forecastTemps = [];

        for (let i = 0; i < data.list.length; i += 4) {
            const item = data.list[i];

            const date = new Date(item.dt_txt);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const temp = item.main.temp;
            forecastTemps.push(temp);

            container.innerHTML += `
                <div class="forecast-card">
                    <p>${day}</p>
                    <p>${time}</p>
                    <p>${temp}°C</p>
                </div>
            `;
        }

        createChart(data);

    } catch (err) {
        document.getElementById("message").innerText = "Error fetching forecast data";
    }
}

// Create chart
function createChart(data) {
    const labels = [];
    chartTemps = [];

    for (let i = 0; i < 8; i++) {
        const item = data.list[i];
        labels.push(new Date(item.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        chartTemps.push(item.main.temp);
    }

    const ctx = document.getElementById('weatherChart').getContext('2d');

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: chartTemps,
                fill: true,
                tension: 0.4,
            }]
        },
        options: {
            plugins: {
                legend: { labels: { color: 'white' } }
            },
            scales: {
                x: { ticks: { color: 'white' } },
                y: { ticks: { color: 'white' } }
            }
        }
    });
}

// Toggle units
function toggleUnit() {
    if (!chart) return; // FIX: prevent crash

    const tempElement = document.getElementById("temperature");
    const forecastCards = document.querySelectorAll(".forecast-card p:last-child");

    if (isCelsius) {
        tempElement.innerText = Math.round((currentTemp * 9 / 5) + 32) + "°F";
        forecastCards.forEach((el, i) =>
            el.innerText = Math.round((forecastTemps[i] * 9 / 5) + 32) + "°F"
        );

        chart.data.datasets[0].data = chartTemps.map(t => (t * 9 / 5) + 32);
        chart.data.datasets[0].label = 'Temperature (°F)';
    } else {
        tempElement.innerText = Math.round(currentTemp) + "°C";
        forecastCards.forEach((el, i) =>
            el.innerText = Math.round(forecastTemps[i]) + "°C"
        );

        chart.data.datasets[0].data = chartTemps;
        chart.data.datasets[0].label = 'Temperature (°C)';
    }

    chart.update();
    isCelsius = !isCelsius;
}

// Modal
function showErrorModal(message) {
    const modal = document.getElementById("errorModal");
    const modalMsg = document.getElementById("modalMessage");
    const closeBtn = document.getElementById("closeModal");

    modalMsg.innerText = message;
    modal.style.display = "block";

    closeBtn.onclick = () => modal.style.display = "none";

    // FIX: safer event listener
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
}

// Theme toggle
const themeBtn = document.getElementById("themeToggle");
const sunIcon = document.getElementById("sunIcon");
const moonIcon = document.getElementById("moonIcon");

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    sunIcon.style.display = "none";
    moonIcon.style.display = "block";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
        sunIcon.style.display = "none";
        moonIcon.style.display = "block";
    } else {
        localStorage.setItem("theme", "light");
        sunIcon.style.display = "block";
        moonIcon.style.display = "none";
    }
});

// Suggestions
const input = document.getElementById("city");
const suggestions = document.getElementById("suggestions");

let debounceTimer;

input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchSuggestions(input.value), 400);
});

async function fetchSuggestions(query) {
    if (!query) {
        suggestions.innerHTML = "";
        return;
    }

    const apiKey = "a669d9f325da77f4f44aeaec403f5362";
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        suggestions.innerHTML = "";

        data.forEach(place => {
            const li = document.createElement("li");

            li.innerText = `${place.name}, ${place.state || ""}, ${place.country}`;

            li.addEventListener("click", () => {
                input.value = place.name;
                suggestions.innerHTML = "";
                getWeather();
            });

            suggestions.appendChild(li);
        });

    } catch (err) {
        console.log("Suggestion error:", err);
    }
}

// Close suggestions
document.addEventListener("click", (e) => {
    const searchBox = document.querySelector(".search-box");

    if (!searchBox || !searchBox.contains(e.target)) {
        suggestions.innerHTML = "";
    }
});

// Enter key search
input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        suggestions.innerHTML = "";
        getWeather();
    }
});

// Button  (event listener)
document.getElementById("searchBtn").addEventListener("click", () => {
    suggestions.innerHTML = "";
    getWeather();
});