const STORAGE_KEY = "ib_device_id_v1";

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "fallback-device";
  }
}
