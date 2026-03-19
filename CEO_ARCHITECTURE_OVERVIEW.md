# Executive AI Architecture Overview (CEO Presentation)

This document provides a simple, non-technical explanation of the **AI-Exec Intelligence Platform (V3)** architecture.

---

## 🏗️ The Big Picture

Our platform is a "Unified AI Engine." Users ask questions in plain English, and the engine automatically finds, extracts, and summarizes the data using a single-hop high-reliability flow.

To ensure speed and accuracy, we split our data storage:

1.  **PostgreSQL (The "Who" & "Where"):** Manages merchant names, device ownership, and system metadata.
2.  **MongoDB (The "How Much" & "When"):** Manages massive amounts of financial transactions and logs.
3.  **Local AI (The "Logic"):** Uses **Llama 3.2** for precision decision-making and **Qwen 2.5** for lightning-fast summaries.

---

## 🧩 Key Architecture Components

### 1. The Brain (`actionDispatcher.js`)

The single intelligence center of the system. It replaces the old multi-step "classifiers" with a direct, high-speed mapping of user questions to verified results. It handles both date normalization and parameter extraction in one go.

### 2. The Orchestrator (`hybridBroker.js` / `queryPlanner.js`)

Connects the two databases. For complex questions like _"What is the revenue for Merchant X?"_, it first finds the specific device IDs in Postgres and then calculates their revenue in MongoDB using the pre-verified logic.

### 3. The Formula Vault (`analyticsQueryLibrary.js`)

A collection of 30+ professional-grade financial and operational formulas. For critical KPIs like "Total Revenue" or "Success Rates," we **do not** let the AI guess. We use these pre-verified formulas to guarantee 100% financial accuracy.

### 4. The Specialized workforce (`src/services/`)

Our lean V3 service layer is optimized for speed and maintenance.

| Service File                   | Role                     | CEO Translation                                                                                                         |
| :----------------------------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **`actionDispatcher.js`**      | The Brain                | The single decision maker that maps plain English to confirmed business logic.                                          |
| **`analyticsQueryLibrary.js`** | Formula Vault            | A secured library of pre-verified formulas to guarantee 100% financial accuracy.                                        |
| **`dashboardService.js`**      | Business Intelligence    | The engine that calculates mission-critical metrics and trends for the leadership portal.                               |
| **`queryPlanner.js`**          | Mission Control          | Coordinates the planning phase of every question to ensure the right database is hit.                                   |
| **`sqlAgent.js`**              | PostgreSQL Analyst       | The AI expert specialized in searching for names, hierarchies, and relational metadata.                                 |
| **`mongoAgent.js`**            | MongoDB Analyst          | The AI expert specialized in analyzing millions of transaction logs.                                                    |
| **`vectorStore.js`**           | Concept Memory           | Allows the AI to "remember" concepts and search for relevant data patterns by meaning.                                  |
| **`knowledgeBase.js`**         | "Golden" Memory          | Stores perfect query examples to ensure the AI always follows best historical patterns.                                 |
| **`mongoService.js`**          | Big Data Pipeline        | The high-speed connection bridge to our transaction databases.                                                          |
| **`ollamaService.js`**         | AI Communication         | The bridge that talks to the local AI models running on our secure servers.                                             |

---

## 🚀 The AI "Employee Handbook" (`src/prompts/`)

These files contain the rules we give the AI to ensure it behaves like a Senior Data Analyst.

| File                          | Purpose            | CEO Translation                                                                   |
| :---------------------------- | :----------------- | :-------------------------------------------------------------------------------- |
| **`actionDispatcherPrompt.js`** | Strategic Mapping  | Teaches the AI exactly how to map a user question to a "Formula Vault" capability. |
| **`baseSystemPrompt.js`**     | Corporate Identity | Sets the "Professional Analyst" persona and safety guardrails.                    |
| **`summaryPrompt.js`**        | Executive Summary  | Instructions on how to write the final 1-paragraph text summary for the user.     |

---

## 🤖 Model Intelligence Layers

We use a "Right Model for the Job" strategy to ensure performance and precision.

| Task               | Model Used       | CEO Benefit                                                                 |
| :----------------- | :--------------- | :-------------------------------------------------------------------------- |
| **Decision Making**| `llama3.2`       | High accuracy in picking the right formula and extracting complex dates.    |
| **Summarization**  | `qwen2.5:0.5b`   | Extreme speed for real-time text delivery to the executive dashboard.       |
| **Ad-hoc Analyst** | `llama3.2`       | Advanced logic for generating deep-dive queries on the fly.                 |

---

## 🚀 Summary for Presentation

_"We transitioned to a **Unified V3 Architecture** that gives you the best of both worlds: It uses **pre-verified formula logic** for 100% accurate financial dashboards, but maintains a **flexible AI brain** that can analyze any ad-hoc data question in plain English. It is faster, more secure, and eliminates the 'guessing' typical of older AI systems."_
