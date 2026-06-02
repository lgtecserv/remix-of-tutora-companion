import { createServerFn } from "@tanstack/react-start";
import { GoogleAuth } from "google-auth-library";

// Constants
const BING_API_KEY = "bda5a61adce4463eacd963f7f4263499";
const BASE_URL = "https://www.imersaocompleta.info";

export const pingSearchEngines = createServerFn({ method: "POST" })
  .inputValidator((urlPath: string) => urlPath)
  .handler(async ({ data: urlPath }) => {
    const fullUrl = `${BASE_URL}${urlPath}`;
    console.log(`Pinging search engines for: ${fullUrl}`);
    
    let bingSuccess = false;
    let googleSuccess = false;

    // 1. Ping Bing
    try {
      const bingUrl = `https://www.bing.com/indexnow?url=${encodeURIComponent(fullUrl)}&key=${BING_API_KEY}`;
      const bingRes = await fetch(bingUrl);
      if (bingRes.ok) {
        bingSuccess = true;
        console.log("Bing IndexNow ping successful.");
      } else {
        console.error(`Bing IndexNow failed: ${bingRes.status} ${bingRes.statusText}`);
      }
    } catch (err) {
      console.error("Error pinging Bing:", err);
    }

    // 2. Ping Google
    try {
      const googleServiceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!googleServiceEmail || !googlePrivateKey) {
        console.warn("Google Indexing API skipped: Missing environment variables.");
      } else {
        const auth = new GoogleAuth({
          credentials: {
            client_email: googleServiceEmail,
            private_key: googlePrivateKey,
          },
          scopes: ["https://www.googleapis.com/auth/indexing"],
        });

        const client = await auth.getClient();
        const res = await client.request({
          url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
          method: "POST",
          data: {
            url: fullUrl,
            type: "URL_UPDATED",
          },
        });
        
        if (res.status === 200) {
          googleSuccess = true;
          console.log("Google Indexing ping successful.");
        } else {
          console.error("Google Indexing failed:", res.data);
        }
      }
    } catch (err) {
      console.error("Error pinging Google Indexing API:", err);
    }

    return { success: true, bingSuccess, googleSuccess };
  });
