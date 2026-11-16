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
  const index = lines.findIndex(line => line.startsWith("国家/地区："));
  if (index >= 0) lines[index] = "国家/地区：" + country;
  else lines.push("国家/地区：" + country);
  return lines.filter(line => line.trim()).join("\n");
}
