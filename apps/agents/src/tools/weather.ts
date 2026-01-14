import { tool } from "@langchain/core/tools";
import { z } from "zod";

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
}

const weatherCodeMap: Record<number, string> = {
  0: "晴天",
  1: "晴朗",
  2: "多云",
  3: "阴天",
  45: "雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "大毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "小阵雨",
  81: "阵雨",
  82: "大阵雨",
  95: "雷暴",
  96: "雷暴伴小冰雹",
  99: "雷暴伴大冰雹",
};

async function getCoordinates(city: string): Promise<GeoResult> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`未找到城市: ${city}`);
  }

  return data.results[0];
}

async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
  const res = await fetch(url);
  return res.json();
}

export const getWeather = tool(
  async ({ location }) => {
    const geo = await getCoordinates(location);
    const weather = await getWeatherData(geo.latitude, geo.longitude);
    const current = weather.current;

    const condition = weatherCodeMap[current.weather_code] || "未知";

    return `${geo.name}（${geo.country}）当前天气:
- 天气: ${condition}
- 温度: ${current.temperature_2m}°C
- 湿度: ${current.relative_humidity_2m}%
- 风速: ${current.wind_speed_10m} km/h`;
  },
  {
    name: "get_weather",
    description: "获取指定城市的实时天气信息，支持全球城市",
    schema: z.object({
      location: z.string().describe("城市名称，如 '北京'、'Tokyo'、'New York'"),
    }),
  }
);
