import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@shift_presets";

const DEFAULT_PRESETS = [
  { id: "early", label: "早番", startTime: "06:00", endTime: "14:00", color: "#FF9500" },
  { id: "late", label: "遅番", startTime: "14:00", endTime: "22:00", color: "#3A50E0" },
  { id: "night", label: "夜勤", startTime: "22:00", endTime: "06:00", color: "#8B5CF6" },
  { id: "day", label: "日勤", startTime: "09:00", endTime: "18:00", color: "#2FA84F" },
  { id: "off", label: "休み", startTime: "", endTime: "", color: "#C4C8CE" },
];

export async function getPresets() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRESETS));
  return DEFAULT_PRESETS;
}

export async function savePresets(presets) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export async function addPreset(preset) {
  const presets = await getPresets();
  presets.push({ ...preset, id: Date.now().toString() });
  await savePresets(presets);
  return presets;
}

export async function removePreset(id) {
  const presets = await getPresets();
  const filtered = presets.filter((p) => p.id !== id);
  await savePresets(filtered);
  return filtered;
}

export async function updatePreset(id, patch) {
  const presets = await getPresets();
  const idx = presets.findIndex((p) => p.id === id);
  if (idx !== -1) presets[idx] = { ...presets[idx], ...patch };
  await savePresets(presets);
  return presets;
}
