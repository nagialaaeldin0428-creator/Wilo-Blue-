import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Temporary background log file
const LOG_FILE = path.join(process.cwd(), "download_log.txt");
function logMessage(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(msg);
}

// Clear log at start
fs.writeFileSync(LOG_FILE, "Starting Server Log\n");

async function downloadDriveFile() {
  const fileId = "1NkGx7Tx_nU3H_w4U49PJtht-v35unAUu";
  const url = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  logMessage(`Starting download of ${fileId} with confirm=t ...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    // Check if the response contains viral scan screen anyway by checks on size/headers
    const contentType = res.headers.get("content-type") || "";
    logMessage(`Option 1 status: ${res.status}. Content-type: ${contentType}`);
    
    const buffer = await res.arrayBuffer();
    const nodeBuf = Buffer.from(buffer);
    logMessage(`Option 1 bytes: ${nodeBuf.length}`);

    let zipPath = "";

    if (nodeBuf.length < 500000) {
      logMessage("Option 1 did not retrieve the full file (too small). Trying Option 2...");
      // Try Option 2
      const url2 = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
      const res2 = await fetch(url2, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      logMessage(`Option 2 status: ${res2.status}`);
      const buf2 = await res2.arrayBuffer();
      const nodeBuf2 = Buffer.from(buf2);
      logMessage(`Option 2 bytes: ${nodeBuf2.length}`);
      
      if (nodeBuf2.length > 500000) {
        zipPath = path.join(process.cwd(), "downloaded_site.zip");
        fs.writeFileSync(zipPath, nodeBuf2);
        logMessage("Saved ZIP file successfully using Option 2!");
      } else {
        logMessage("Option 2 was also too small. Saving debug files.");
        fs.writeFileSync(path.join(process.cwd(), "downloaded_site_opt1.html"), nodeBuf);
        fs.writeFileSync(path.join(process.cwd(), "downloaded_site_opt2.html"), nodeBuf2);
        return;
      }
    } else {
      zipPath = path.join(process.cwd(), "downloaded_site.zip");
      fs.writeFileSync(zipPath, nodeBuf);
      logMessage("Saved ZIP file successfully using Option 1!");
    }

    if (zipPath && fs.existsSync(zipPath)) {
      logMessage("Importing adm-zip to extract files...");
      // @ts-ignore
      const AdmZip = (await import("adm-zip")).default;
      const zip = new AdmZip(zipPath);
      logMessage("Loading ZIP entries...");
      const entries = zip.getEntries();
      logMessage(`Found ${entries.length} zip entries! Printing first 15 entries:`);
      for (let i = 0; i < Math.min(15, entries.length); i++) {
        logMessage(`  Entry ${i}: ${entries[i].entryName}`);
      }
      
      // Determine if there is a root folder inside ZIP
      let targetExtractDir = path.join(process.cwd(), "public", "story-site");
      logMessage(`Extracting all files to ${targetExtractDir}...`);
      zip.extractAllTo(targetExtractDir, true);
      logMessage("Extraction completed successfully!");
    }
  } catch (err: any) {
    logMessage(`Download/Extraction error: ${err.message || err}`);
  }
}

// Trigger background download only if the story-site index.html is missing
const checkPath = path.join(process.cwd(), "public", "story-site", "index.html");
if (!fs.existsSync(checkPath)) {
  downloadDriveFile();
} else {
  logMessage("Story site files already exist locally. Skipping download/unzip.");
}

// Lazy initialization of Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Memory cache for our transcribe result so we don't call Gemini multiple times
let cachedSubtitles: any = null;

// Fallback subtitles in case Gemini is not set or fails (from the spoken audio content)
const fallbackSubtitles = [
  { text: "The ocean does not tell its secrets", start: 0.0, end: 3.4 },
  { text: "to everyone.", start: 3.4, end: 4.5 },
  { text: "It waits.", start: 4.6, end: 5.5 },
  { text: "It listens.", start: 6.3, end: 7.4 },
  { text: "And when the world grows quiet enough,", start: 8.7, end: 11.0 },
  { text: "it begins to speak.", start: 12.0, end: 13.5 },
  { text: "Long before Wylo opened his eyes,", start: 15.6, end: 17.6 },
  { text: "before the currents carried his name,", start: 18.2, end: 20.2 },
  { text: "before the sea knew the path he would follow,", start: 21.0, end: 23.9 },
  { text: "there was a story hidden beneath the waves.", start: 24.5, end: 27.2 },
  { text: "A story of loss,", start: 28.5, end: 29.8 },
  { text: "of friendship,", start: 30.6, end: 31.5 },
  { text: "of courage,", start: 32.3, end: 33.3 },
  { text: "and of a light that no darkness could ever extinguish.", start: 34.3, end: 38.3 },
  { text: "So breathe slowly,", start: 40.0, end: 41.2 },
  { text: "listen closely.", start: 42.4, end: 43.6 },
  { text: "The ocean is calling.", start: 44.9, end: 46.7 },
  { text: "And somewhere beyond the horizon,", start: 48.4, end: 50.3 },
  { text: "where the sea remembers every story it has ever carried", start: 50.8, end: 54.9 },
  { text: "and every dream it has ever touched,", start: 55.4, end: 57.7 },
  { text: "a young whale named Wylo is waiting.", start: 58.9, end: 61.4 },
  { text: "Waiting to discover who he is,", start: 62.6, end: 64.9 },
  { text: "waiting to discover where he belongs,", start: 65.6, end: 68.3 },
  { text: "and perhaps,", start: 70.0, end: 71.4 },
  { text: "waiting for you.", start: 72.1, end: 73.1 },
  { text: "His journey is about to begin.", start: 74.9, end: 77.7 }
];

app.use(express.json());

// API route first
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Transcription endpoint
app.get("/api/subtitles", async (req, res) => {
  // Always return the handcrafted, perfectly synchronized static subtitles
  // since the intro audio is a pre-recorded static asset. This avoids
  // non-deterministic dynamic transcriptions that lead to wrong subtitles.
  return res.json(fallbackSubtitles);
});

// Helper function to locate any story-site image on disk across extracted directories, recursively/case-insensitively
function findImageFile(filename: string): string | null {
  const searchDirs = [
    path.join(process.cwd(), "public", "story-site", "public", "assets", "images"),
    path.join(process.cwd(), "public", "story-site", "public", "assets", "images", "story images"),
    path.join(process.cwd(), "public", "story-site", "public", "assets", "images", "story images", "cropped"),
    path.join(process.cwd(), "public", "story-site", "assets", "images"),
    path.join(process.cwd(), "dist", "story-site", "public", "assets", "images"),
    path.join(process.cwd(), "dist", "story-site", "public", "assets", "images", "story images"),
    path.join(process.cwd(), "dist", "story-site", "public", "assets", "images", "story images", "cropped"),
    path.join(process.cwd(), "dist", "story-site", "assets", "images"),
  ];

  const baseNameWithoutExt = path.basename(filename, path.extname(filename));
  const reqExt = path.extname(filename).toLowerCase();
  // Try several typical image extensions to handle format discrepancies (like .png requests finding .svg files or .jpg)
  const extensionsToTry = [reqExt, ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif"];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;

    for (const ext of extensionsToTry) {
      if (!ext) continue;
      const targetName = `${baseNameWithoutExt}${ext}`;
      const directPath = path.join(dir, targetName);
      if (fs.existsSync(directPath)) {
        try {
          if (fs.statSync(directPath).isFile()) {
            return directPath;
          }
        } catch (e) {}
      }

      // Case-insensitive match on directory listing
      try {
        const files = fs.readdirSync(dir);
        const lowerTarget = targetName.toLowerCase();
        const matched = files.find(f => f.toLowerCase() === lowerTarget);
        if (matched) {
          const finalPath = path.join(dir, matched);
          if (fs.statSync(finalPath).isFile()) {
            return finalPath;
          }
        }
      } catch (e) {}
    }
  }
  return null;
}

// Global Image Interceptor for resolving images (including direct /assets/ paths) locally with absolutely zero downloading/external dependencies
app.use((req, res, next) => {
  const reqPath = decodeURIComponent(req.path);
  if (/\.(png|jpg|jpeg|svg|webp|gif|bmp)$/i.test(reqPath)) {
    const filename = path.basename(reqPath);
    const diskPath = findImageFile(filename);
    if (diskPath) {
      return res.sendFile(diskPath);
    }

    // fallback for story-site missing images to prevent broken empty boxes
    if (reqPath.includes("/assets") || reqPath.includes("/story-site") || reqPath.includes("/story site")) {
      const fallbackPixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
      return res.status(200).set("Content-Type", "image/gif").send(fallbackPixel);
    }
  }
  next();
});

// Vite middleware flow
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  const storySiteDir = path.join(process.cwd(), isProd ? "dist" : "public", "story-site");

  // 1. Explicitly serve static assets for the story site under BOTH root and subfolder routes
  app.use("/assets", express.static(path.join(storySiteDir, "public", "assets")));
  app.use("/assets", express.static(path.join(storySiteDir, "assets")));
  app.use("/story-site/assets", express.static(path.join(storySiteDir, "public", "assets")));
  app.use("/story-site/assets", express.static(path.join(storySiteDir, "assets")));
  app.use("/story site/assets", express.static(path.join(storySiteDir, "public", "assets")));
  app.use("/story site/assets", express.static(path.join(storySiteDir, "assets")));
  app.use("/story%20site/assets", express.static(path.join(storySiteDir, "public", "assets")));
  app.use("/story%20site/assets", express.static(path.join(storySiteDir, "assets")));

  // 2. Serve the story site directory itself static files
  app.use("/story-site", express.static(storySiteDir));
  app.use("/story site", express.static(storySiteDir));
  app.use("/story%20site", express.static(storySiteDir));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    // Mount Vite dev server middlewares
    app.use(vite.middlewares);

    // Serve the transformed React App at root, index.html, and the legacy cinematic route
    app.get(["/", "/index.html", "/wilo-blue-cinematic-fixed_9.html"], async (req, res, next) => {
      try {
        const templatePath = path.join(process.cwd(), "index.html");
        let html = fs.readFileSync(templatePath, "utf-8");
        html = await vite.transformIndexHtml(req.path, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve production build static files
    app.use(express.static(distPath));

    // Serve cinematic page from React Spa index at root and legacy cinematic paths
    app.get(["/", "/index.html", "/wilo-blue-cinematic-fixed_9.html"], (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    // Fallback everything else to the story site
    app.get('*', (req, res) => {
      res.sendFile(path.join(storySiteDir, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server loaded on port ${PORT}`);
  });
}

startServer();
