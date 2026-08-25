// ----------------------------------------------------------------------------
// CV content — ported verbatim from v1 (/Users/pauti/portfolio/lib/resume.ts
// and lib/data.ts). Facts only; do not edit numbers here without re-verifying.
// ----------------------------------------------------------------------------

export type Education = {
  school: string;
  degree: string;
  start: string;
  end: string;
  location?: string;
  gpa?: string;
  coursework?: string[];
  honors?: string;
};

export type Experience = {
  company: string;
  role: string;
  start: string;
  end: string;
  location?: string;
  bullets: string[];
  href?: string;
};

export type Award = { name: string; year: string; note?: string; href?: string };

export type Certification = { name: string; issuer: string; code?: string; year?: string };

export type ProjectRow = {
  name: string;
  tagline: string;
  blurb: string;
  stack: string;
  year: string;
  repo: string;
  demo?: string;
};

export const CONTACT = {
  name: "Parth Auti",
  role: "Software engineer · AI agent reliability & applied ML · CS new grad, Dec 2026",
  email: "parth.auti@gmail.com",
  github: "https://github.com/pauti04",
  linkedin: "linkedin.com/in/parthauti",
  location: "Charlotte, NC · open to relocation",
  languages: "English (professional) · Hindi (native) · Marathi (conversational)",
};

export const SUMMARY =
  "Software engineer, CS new grad (December 2026). AI agent reliability and applied ML, benchmark-backed open source. At T-Infosystem I built the Bedrock summarization layer with a validation guard behind an automated maintenance-reporting platform covering 400+ client sites. At UNC Charlotte's CharmLab I'm co-authoring a manuscript on LLM-judge failure modes, targeting a NeurIPS 2026 workshop. Open source: Reflight (a flight recorder for AI agents), ChainCheck (claim-level hallucination detection at 94% precision, shipping on PyPI), CostDNA (GraphSAGE for untagged AWS spend), Bourse (Rust matching engine, zero-alloc hot path). Open to SWE / ML infrastructure / systems roles.";

export const EDUCATION: Education[] = [
  {
    school: "University of North Carolina at Charlotte",
    degree: "B.S. in Computer Science",
    start: "2025-08",
    end: "Expected Dec 2026",
    location: "Charlotte, NC",
    gpa: "3.7 / 4.0",
    coursework: [
      "Machine Learning",
      "Deep Learning",
      "Data Mining",
      "Operating Systems",
      "Computer Networks",
      "Database Systems",
      "Cloud Computing",
      "Data Structures & Algorithms",
    ],
    honors: "Chancellor's List (Spring 2026) · Dean's List (Fall 2025)",
  },
  {
    school: "Manipal Academy of Higher Education (MAHE)",
    degree: "Computer Science (transferred to UNC Charlotte)",
    start: "2023-08",
    end: "2025-05",
    location: "Manipal, India",
    gpa: "3.63 / 4.0",
  },
];

export const EXPERIENCE: Experience[] = [
  {
    company: "Charlotte Machine Learning Lab (CharmLab)",
    role: "Undergraduate ML Researcher",
    start: "2026-05",
    end: "Present",
    location: "UNC Charlotte · advised by Prof. Minwoo Lee",
    bullets: [
      "Drafting a manuscript on LLM-judge failure modes. Judge misses on HaluEval-QA are high-confidence, invisible to NLI/judge disagreement (AUC 0.48), and concentrate on hallucinations built from the reference passage itself (49% missed vs 31%, p<0.01).",
      "Built a fully reproducible analysis pipeline — all 99 manuscript statistics verified against committed artifacts. Targeting a NeurIPS 2026 workshop submission.",
    ],
  },
  {
    company: "T-Infosystem",
    role: "Software Engineering Intern",
    start: "2026-03",
    end: "2026-06",
    location: "Remote",
    bullets: [
      "Built uptime, response-time, SSL-expiry, and incident-detection services for an automated maintenance-reporting platform covering 400+ client sites. AWS Lambda, SQS, EventBridge, DynamoDB, SES.",
      "Developed the Amazon Bedrock summarization layer that generates monthly client reports. Added a validation guard that rejects unsupported figures and falls back to deterministic templates when validation fails.",
      "Created a 40-case evaluation suite for summary accuracy and factual grounding. Pass rate rose from 64% to 87% through prompt and validation improvements.",
    ],
  },
  {
    company: "UNC Charlotte",
    role: "AV Technician",
    start: "2026-05",
    end: "Present",
    location: "Charlotte, NC",
    bullets: [
      "Live event production: audio and video for campus events up to 800+ attendees — setup, live mixing, on-the-fly troubleshooting.",
    ],
  },
  {
    company: "Starbucks",
    role: "Barista, then Barista Trainer",
    start: "2025-10",
    end: "2026-04",
    location: "Charlotte, NC",
    bullets: [
      "Promoted to Trainer ahead of standard tenure. Onboarded new hires on beverage standards, POS, and food safety.",
      "Ran the bar through 200+-transaction morning rushes while carrying a full CS course load.",
    ],
  },
];

export const PROJECTS: ProjectRow[] = [
  {
    name: "Reflight",
    tagline: "A flight recorder for AI agents.",
    blurb:
      "Records every model call, tool call, token, and dollar an agent spends. Three lines of code to instrument. Replays are byte-for-byte identical to the live run, verified with the network hard-blocked, and finish in about 7 ms at $0.00. On a scheduling agent, a 15-line replay assertion caught 15 out of 15 failures that passed every tool-level check. An LLM judge caught 1 to 5 of them, depending on how the prompt was worded. One command turns a failed run into a pytest regression test.",
    stack: "Python · pytest · OpenAI · LangGraph · OpenTelemetry · Docker",
    year: "2026",
    repo: "https://github.com/pauti04/reflight",
    demo: "https://pauti04.github.io/reflight-demo/",
  },
  {
    name: "ChainCheck",
    tagline: "Claim-level hallucination detection for LLMs.",
    blurb:
      "Flags the exact unsupported sentence instead of scoring the whole response. 94% precision at 64% recall on HaluEval-QA (n=500, gpt-4o-mini judge, balanced 50/50), chosen after benchmarking four detection methods head-to-head. A 60 ms local NLI pre-filter cuts latency 19× on the clear-cut cases and only escalates ambiguous claims to the judge. Ships on PyPI as a drop-in OpenAI proxy that tags risky responses in headers. A GitHub Action wraps the same core and blocks merges when a PR description doesn't match the diff.",
    stack: "Python · FastAPI · PyTorch · HuggingFace · OpenAI/Anthropic",
    year: "2026",
    repo: "https://github.com/pauti04/chaincheck",
    demo: "https://chaincheck-71mh.onrender.com",
  },
  {
    name: "CostDNA",
    tagline: "Behavioral attribution for untagged cloud spend.",
    blurb:
      "On a typical AWS account, 40 to 60 percent of spend is untagged and invisible to FinOps tools. CostDNA infers ownership per resource with a GraphSAGE GNN trained on CloudTrail behavior, IAM patterns, and VPC topology, then writes the tags back. Existing tools go from explaining half the bill to about 95%. End to end from raw cost report to per-team breakdown in 90 seconds, no data leaves the AWS account. I also caught label leakage in two published benchmarks (Azure 2.6M VMs, Philly 117K jobs) by auditing my own results — the honest number is published next to the inflated first-cut one.",
    stack: "Python · PyTorch (GraphSAGE) · Next.js · Terraform · AWS · GPT-4o",
    year: "2026",
    repo: "https://github.com/pauti04/CostDNA",
    demo: "https://cost-dna.vercel.app",
  },
  {
    name: "Bourse",
    tagline: "Order matching engine in Rust.",
    blurb:
      "Price-time-priority matching engine over a length-prefixed binary TCP protocol. Zero allocations on the hot path, proven by a custom allocator harness. Cache-padded lock-free MPSC gateway feeds a single-writer matcher, with Acquire/Release ordering and Miri validation in CI. Byte-exact WAL replay plus snapshot recovery; group commit is 187–245× faster than fsync-per-record. Current benches on M-series release: in-process round-trip ~225 ns, TCP RTT p50 ~78 µs / p99 ~307 µs, matcher walks 1000 levels in ~94 µs.",
    stack: "Rust · tokio · Miri · lock-free MPSC/SPSC · CRC32C WAL",
    year: "2026",
    repo: "https://github.com/pauti04/bourse",
    demo: "https://pauti04.github.io/bourse/",
  },
  {
    name: "NetPulse",
    tagline: "BGP anomaly and route-leak detector.",
    blurb:
      "Public reproducible benchmark on RIPE RIS archive data: 7 out of 7 labeled historical incidents detected, 0 false negatives, runs in about a second, no API keys. The live monitor taps the RIPE RIS global feed (~1,800 updates/sec); in a 70-second sample it ingested 149,246 announcements. RPKI validation runs at ~43 µs per call against 859k VRPs — a longest-prefix-match trie replaced a linear scan and moved a 43 ms operation to 43 µs. Hosted HTTP API deploys to any Docker host.",
    stack: "Python · FastAPI · DuckDB · RIPE RIS · fly.io",
    year: "2026",
    repo: "https://github.com/pauti04/netpulse",
    demo: "https://netpulse-pauti.fly.dev/",
  },
  {
    name: "Dispatch",
    tagline: "An AI-curated morning brief for developers.",
    blurb:
      "A daily brief in the shape of a newspaper — ink on cream, gold accents, double-ruled masthead, issue numbering. Role-first onboarding streams the first headline over Server-Sent Events in about 800 ms. Solo-built end to end: React + Vite frontend, Express + Postgres (Neon) server, gpt-4o-mini generation, Resend for delivery, Sentry and PostHog for observability, Expo for the mobile shell. 41 passing tests, Lighthouse Best Practices 100, zero accessibility violations in the audit.",
    stack: "React · Vite · Express · Postgres (Neon) · gpt-4o-mini · Resend · Expo",
    year: "2026",
    repo: "https://github.com/pauti04/dispatch",
  },
  {
    name: "RasoiBot",
    tagline: "A pantry-aware recipe assistant for Indian cooking.",
    blurb:
      "The smallest thing on this page. I cook a lot of Indian food and kept rewriting the same paneer recipe from memory. RasoiBot is that recipe, but with serving-size scaling and a grocery list. Pantry-aware set-intersection over a hand-curated index — the streaming feel is a UX trick, not a model.",
    stack: "JavaScript · Next.js · Vercel",
    year: "2025",
    repo: "https://github.com/pauti04/RasoiBot-clean",
    demo: "https://rasoi-bot-clean.vercel.app",
  },
];

export const SKILLS = [
  { group: "languages", items: "Python · Rust · TypeScript · Go · C++ · SQL · Java · Bash" },
  {
    group: "ml / ai",
    items:
      "PyTorch · HuggingFace · Transformers · embeddings · LLM agents & evals · RAG · LangGraph · MCP · GraphSAGE / GNNs · pandas · NumPy · NLI · hallucination detection",
  },
  {
    group: "systems",
    items:
      "Tokio · async Rust · lock-free data structures · WAL + snapshot recovery · FastAPI · DuckDB · Postgres · Redis · BGP / RIPE RIS · RPKI",
  },
  {
    group: "cloud & infra",
    items:
      "AWS (Lambda, SQS, EventBridge, DynamoDB, Bedrock, SES) · Azure · Docker · Kubernetes · Terraform · GitHub Actions · Fly.io · Vercel · Render",
  },
  { group: "frontend", items: "Next.js 15 · React 19 · Tailwind v4 · server components" },
];

export const CERTIFICATIONS: Certification[] = [
  { name: "Solutions Architect – Associate", issuer: "AWS", code: "SAA-C03" },
  { name: "Developer – Associate", issuer: "AWS", code: "DVA-C02" },
  { name: "Cloud Practitioner", issuer: "AWS", code: "CLF-C02" },
  { name: "DevOps Engineer Expert", issuer: "Azure", code: "AZ-400" },
  { name: "Administrator Associate", issuer: "Azure", code: "AZ-104" },
  { name: "AI Engineer Associate", issuer: "Azure", code: "AI-102" },
  { name: "Fabric Analytics Engineer Associate", issuer: "Azure", code: "DP-600" },
  { name: "OCI Foundations Associate", issuer: "Oracle Cloud" },
];

export const AWARDS: Award[] = [
  { name: "Chancellor's List — UNC Charlotte", year: "2026", note: "Spring 2026" },
  { name: "Dean's List — UNC Charlotte", year: "2025", note: "Fall 2025" },
  {
    name: "Smart India Hackathon 2024 — 3rd Place (MAHE)",
    year: "2024",
    note: "IoT precision agriculture: ESP32 sensor nodes, Firebase, ML irrigation recommendations, GSM/SMS alerts for low-connectivity rural areas",
  },
  {
    name: "JEE Advanced 2023 — qualified",
    year: "2023",
    note: "Top ~1.3% of 1.4M+ candidates (India's national engineering entrance exam)",
  },
];

export const LOOKING_FOR = [
  "Full-time SWE, ML infrastructure, or systems roles — graduating Dec 2026",
  "Charlotte, NC — remote or relocation, US or international",
  "AI agent reliability · LLM tooling and evals · low-latency systems · GNNs · cloud/platform engineering",
  "Interviewing now",
];
