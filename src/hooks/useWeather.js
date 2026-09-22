import { useState, useEffect } from "react";

const WMO = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Icy fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Light snow", 73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Rain showers", 81: "Showers", 82: "Heavy showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm + hail", 99: "Thunderstorm + hail",
};

const CACHE_KEY = "weather:cache";
const TTL = 30 * 60 * 1000;

export function useWeather() {
  const [state, setState] = useState(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (c && Date.now() - c.ts < TTL) return { weather: c.data, loading: false, error: null };
    } catch {}
    return { weather: null, loading: true, error: null };
  });

  useEffect(() => {
    if (state.weather) return;
    if (!navigator.geolocation) {
      setState({ weather: null, loading: false, error: "no-geo" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const [wRes, gRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,weather_code,apparent_temperature&temperature_unit=celsius`),
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&format=json`),
          ]);
          const wData = await wRes.json();
          const gData = await gRes.json();
          const data = {
            temp: Math.round(wData.current.temperature_2m),
            feels: Math.round(wData.current.apparent_temperature),
            code: wData.current.weather_code,
            desc: WMO[wData.current.weather_code] ?? "Unknown",
            city: gData.address?.city || gData.address?.town || gData.address?.village || "Your location",
          };
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch {}
          setState({ weather: data, loading: false, error: null });
        } catch {
          setState({ weather: null, loading: false, error: "fetch-failed" });
        }
      },
      () => setState({ weather: null, loading: false, error: "denied" }),
      { timeout: 8000 }
    );
  }, []);

  return state;
}
