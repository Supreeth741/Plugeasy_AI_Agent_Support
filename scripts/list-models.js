require("dotenv").config();
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.log("ERROR: GEMINI_API_KEY not set in .env");
  process.exit(1);
}
console.log("API key found (starts with):", key.substring(0, 8) + "...");
fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + key)
  .then((r) => r.json())
  .then((data) => {
    if (data.error) {
      console.log("API ERROR:", JSON.stringify(data.error, null, 2));
      return;
    }
    if (data.models) {
      console.log("\nAvailable models that support generateContent:");
      data.models
        .filter(
          (m) =>
            m.supportedGenerationMethods &&
            m.supportedGenerationMethods.includes("generateContent"),
        )
        .forEach((m) => console.log(" -", m.name));
    } else {
      console.log("Unexpected response:", JSON.stringify(data));
    }
  })
  .catch((e) => console.log("Fetch error:", e.message));
