     1|import { createHmac } from "node:crypto";
     2|import { readFileSync } from "node:fs";
     3|
     4|const webhookUrl = process.env.BRIDGE_WEBHOOK_URL;
     5|const webhookSecret = process.env.BRIDGE_WEBHOOK_SECRET;
     6|
     7|if (!(webhookUrl && webhookSecret)) {
     8|  console.error("BRIDGE_WEBHOOK_URL and BRIDGE_WEBHOOK_SECRET are required");
     9|  process.exit(1);
    10|}
    11|
    12|const context = JSON.parse(readFileSync(".automation/context.json", "utf8"));
    13|
    14|const payload = {
    15|  routeId: "gmwalletapp-icon-chain-triage",
    16|  eventType: "triage.issue",
    17|  repo: "GMWalletApp/crypto-icons",
    18|  source: "github-actions",
    19|  trigger: {
    20|    kind: process.env.GITHUB_EVENT_NAME || "unknown",
    21|    eventName: process.env.GITHUB_EVENT_NAME || "unknown",
    22|    eventAction: process.env.GITHUB_EVENT_ACTION || "",
    23|  },
    24|  context,
    25|};
    26|
    27|const rawBody = JSON.stringify(payload);
    28|const signature = `sha256=${createHmac("sha256", webhookSecret).update(rawBody).digest("hex")}`;
    29|
    30|const response = await fetch(webhookUrl, {
    31|  method: "POST",
    32|  headers: {
    33|    "content-type": "application/json",
    34|    "x-openclaw-signature-256": signature,
    35|  },
    36|  body: rawBody,
    37|});
    38|
    39|if (!response.ok) {
    40|  const text = await response.text();
    41|  console.error(`Webhook request failed: ${response.status} ${text}`);
    42|  process.exit(1);
    43|}
    44|
    45|console.log(await response.text());
    46|