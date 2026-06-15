import { StitchToolClient, Stitch } from "@google/stitch-sdk";
import { writeFileSync, mkdirSync, createWriteStream } from "fs";
import https from "https";
import path from "path";

const API_KEY = "PLACEHOLDER_STITCH_API_KEY";
const PROJECT_ID = "10410910608480640201";

const SCREENS = [
  { name: "02_login_desktop",            id: "87cd3d55dd5047d3b1e946ec75f0acde" },
  { name: "03_register_desktop",         id: "68faa6703f7a46f3b9fd42a7ae1fb5c6" },
  { name: "04_dashboard_desktop",        id: "56b9de9751634a93863d811cece4d952" },
  { name: "05_groups_desktop",           id: "280b8c28b5d34124a85e880803cd6077" },
  { name: "06_expenses_desktop",         id: "fbfef991239143f3bfa8c0fbdd5f74d5" },
  { name: "07_add_expense_desktop",      id: "b1bf3099d4b440ebb8a624e5f623364f" },
  { name: "08_csv_import_desktop",       id: "7e498bd3642d4431bb2763c3daf8e458" },
  { name: "09_settings_profile_desktop", id: "972dbf35ba0c43c08e2ffc9d0dad0c64" },
  { name: "10_settlements_desktop",      id: "f4d656dc49834359ba212a26792f1f35" }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (res2) => {
          res2.pipe(file);
          file.on("finish", () => { file.close(); resolve(); });
          res2.on("error", reject);
        }).on("error", reject);
        return;
      }
      response.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
      response.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  console.log("🚀 Starting Stitch desktop screens download (fixed JSON)...");
  const client = new StitchToolClient({ apiKey: API_KEY });
  const stitch = new Stitch(client);
  const project = stitch.project(PROJECT_ID);
  
  const outDir = "./stitch_screens";
  mkdirSync(outDir, { recursive: true });

  for (const scr of SCREENS) {
    console.log(`📥 Fetching screen details: ${scr.name} (ID: ${scr.id})...`);
    try {
      const screenObj = await project.getScreen(scr.id);
      const rawData = screenObj.data;
      
      // Save raw metadata json
      const rawPath = path.join(outDir, `${scr.name}_raw.json`);
      writeFileSync(rawPath, JSON.stringify(rawData, null, 2));
      console.log(`   Saved raw metadata to ${rawPath}`);

      // Save HTML code
      if (rawData.htmlCode && rawData.htmlCode.downloadUrl) {
        const htmlPath = path.join(outDir, `${scr.name}.html`);
        await downloadFile(rawData.htmlCode.downloadUrl, htmlPath);
        console.log(`   Saved HTML code to ${htmlPath}`);
      }

      // Save Screenshot
      if (rawData.screenshot && rawData.screenshot.downloadUrl) {
        const jpgPath = path.join(outDir, `${scr.name}.jpg`);
        await downloadFile(rawData.screenshot.downloadUrl, jpgPath);
        console.log(`   Saved Screenshot to ${jpgPath}`);
      }

    } catch (err) {
      console.error(`   ❌ Failed to fetch screen ${scr.name}:`, err.message || err);
    }
  }

  console.log("🏁 All desktop screens fetched!");
}

main().catch(console.error);
