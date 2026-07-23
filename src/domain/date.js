export function getDateKeyFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalDateKey(now = new Date()) {
  return getDateKeyFromDate(now);
}

export function isValidDateKey(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split("-").map(Number);
  return getDateKeyFromDate(new Date(year, month - 1, day)) === key;
}

export function getIsoWeekdayFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 0 ? 7 : weekday;
}

export function getRecentDateKeys(amount, now = new Date()) {
  const keys = [];
  for (let index = 0; index < amount; index += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    keys.push(getDateKeyFromDate(date));
  }
  return keys;
}
