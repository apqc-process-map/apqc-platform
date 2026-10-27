import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const directory = join(process.cwd(), "supabase", "migrations");
const files = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
const pattern = /^(\d{14})_([a-z0-9_]+)\.sql$/;
const versions = new Map();
const names = new Map();
const errors = [];

for (const file of files) {
  const match = file.match(pattern);
  if (!match) {
    errors.push(`${file}: tên file phải theo YYYYMMDDHHMMSS_snake_case.sql`);
    continue;
  }
  const [, version, name] = match;
  if (versions.has(version)) errors.push(`${file}: trùng version với ${versions.get(version)}`);
  if (names.has(name)) errors.push(`${file}: trùng tên migration với ${names.get(name)}`);
  versions.set(version, file);
  names.set(name, file);
  const bytes = await readFile(join(directory, file));
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) errors.push(`${file}: có UTF-8 BOM`);
  const sql = bytes.toString("utf8");
  if (/service[_-]?role\s*=|SUPABASE_SERVICE_ROLE_KEY|postgres(?:ql)?:\/\/[^\s]+:[^\s]+@/i.test(sql)) {
    errors.push(`${file}: có dấu hiệu chứa credential`);
  }
}

if (!files.length) errors.push("Không tìm thấy migration SQL.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${files.length} migrations có version duy nhất, không BOM và không lộ credential.`);