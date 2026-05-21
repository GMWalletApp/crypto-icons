     1|import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
     2|import { join } from "node:path";
     3|
     4|const token = process.env.TRIAGE_TOKEN;
     5|const eventName = process.env.GITHUB_EVENT_NAME || "unknown";
     6|const eventPath = process.env.GITHUB_EVENT_PATH;
     7|const repo = process.env.GITHUB_REPOSITORY || "GMWalletApp/crypto-icons";
     8|
     9|if (!token) {
    10|  console.error("TRIAGE_TOKEN is required");
    11|  process.exit(1);
    12|}
    13|
    14|const event =
    15|  eventPath && existsSync(eventPath)
    16|    ? JSON.parse(readFileSync(eventPath, "utf8"))
    17|    : {};
    18|
    19|async function github(path) {
    20|  const response = await fetch(`https://api.github.com${path}`, {
    21|    headers: {
    22|      Authorization: `Bearer ${token}`,
    23|      Accept: "application/vnd.github+json",
    24|      "User-Agent": "gmwalletapp-triage",
    25|    },
    26|  });
    27|
    28|  if (!response.ok) {
    29|    throw new Error(
    30|      `GitHub API ${path} failed: ${response.status} ${response.statusText}`
    31|    );
    32|  }
    33|
    34|  return response.json();
    35|}
    36|
    37|const issues = await github(`/repos/${repo}/issues?state=open&per_page=50`);
    38|
    39|const report = {
    40|  generatedAt: new Date().toISOString(),
    41|  eventName,
    42|  trigger: {
    43|    action: event.action ?? null,
    44|    issue: event.issue
    45|      ? {
    46|          number: event.issue.number,
    47|          title: event.issue.title,
    48|          body: event.issue.body,
    49|          url: event.issue.html_url,
    50|          labels: (event.issue.labels || []).map((l) => l.name),
    51|          user: event.issue.user?.login,
    52|        }
    53|      : null,
    54|    comment: event.comment
    55|      ? {
    56|          id: event.comment.id,
    57|          body: event.comment.body,
    58|          url: event.comment.html_url,
    59|          user: event.comment.user?.login,
    60|          createdAt: event.comment.created_at,
    61|        }
    62|      : null,
    63|  },
    64|  openIssues: issues
    65|    .filter((issue) => !issue.pull_request)
    66|    .map((issue) => ({
    67|      number: issue.number,
    68|      title: issue.title,
    69|      url: issue.html_url,
    70|      labels: (issue.labels || []).map((l) => l.name),
    71|      createdAt: issue.created_at,
    72|    })),
    73|};
    74|
    75|mkdirSync(".automation", { recursive: true });
    76|writeFileSync(
    77|  join(".automation", "context.json"),
    78|  `${JSON.stringify(report, null, 2)}\n`
    79|);
    80|console.log(JSON.stringify(report, null, 2));
    81|