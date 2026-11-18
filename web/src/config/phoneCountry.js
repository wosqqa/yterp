import { parsePhoneNumberFromString } from "libphonenumber-js";
import countryNames from "./phoneCountryNames.json";

export function countryFromWhatsApp(value) {
  const text = String(value || "").trim();
  if (!/^\+?[\d\s().-]+$/.test(text)) return "";
  let digits = text.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  const phone = parsePhoneNumberFromString("+" + digits, { extract: false });
  if (!phone || !phone.isPossible() || !phone.country) return "";
  return countryNames[phone.country] || "";
}

export function remarkWithCountry(remark, country) {
  if (!country) return remark;
  const lines = String(remark || "").split("\n");
  const names = new Set(Object.values(countryNames));
  const index = lines.findIndex(line => line.trim().startsWith("国家/地区：") || names.has(line.trim()));
  if (index >= 0) lines[index] = country;
  else lines.push(country);
  return lines.filter(line => line.trim()).join("\n");
}
