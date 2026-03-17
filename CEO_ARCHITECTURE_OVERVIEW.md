# Executive AI Architecture Overview (CEO Presentation)

This document provides a simple, non-technical explanation of the **AI-Exec Intelligence Platform** architecture.

---

## 🏗️ The Big Picture

Our platform is a "Hybrid AI Engine." Users ask questions in plain English, and the engine automatically finds, extracts, and summarizes the data.

To ensure speed and accuracy, we split our data storage:

1.  **PostgreSQL (The "Who" & "Where"):** Manages merchant names, device ownership, and system metadata.
2.  **MongoDB (The "How Much" & "When"):** Manages massive amounts of financial transactions, metrics, and event logs.

---

## 🧩 Key Architecture Components

### 1. The Traffic Cop (`intentDispatcher.js`)

Identifies the "intent" behind a user's question. It immediately decides if a question needs **Numbers** (MongoDB), **Names** (Postgres), or **Both** (Hybrid). This ensures every request takes the fastest path possible.

### 2. The Orchestrator (`hybridBroker.js`)

Connects the two databases. For complex questions like _"What is the revenue for Merchant X?"_, it first finds the specific device IDs in Postgres and then instantly calculates their revenue in MongoDB.

### 3. The Formula Vault (`analyticsQueryLibrary.js`)

A collection of 20 hard-coded, professional-grade financial formulas. For critical KPIs like "Total Revenue" or "Success Rates," we **do not** let the AI guess. We use these pre-verified formulas to guarantee 100% financial accuracy.

### 4. The Professional Service Suite (`src/services/`)

This folder contains our "Internal Workforce"—specialized modules that handle specific tasks to keep the system running.

| Service File                   | Role                     | CEO Translation                                                                                                         |
| :----------------------------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| Service File                          | Role                     | CEO Translation                                                                                                         |
| :------------------------------------ | :----------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **`analyticsQueryLibrary.js`**        | Formula Vault            | A secured library of 20+ pre-verified business logic formulas to guarantee 100% financial accuracy.                     |
| **`biParamExtractor.js`**             | Pattern Whisperer        | Automatically extracts dates, amounts, and limits from plain English questions without needing expensive AI processing.  |
| **`dashboardService.js`**             | Business Intelligence    | The specialized engine that calculates mission-critical metrics and trends for the leadership portal.                    |
| **`hybridBroker.js`**                 | The Orchestrator         | The "middle-man" that knows how to pull data from both Postgres and Mongo at the same time to answer complex questions. |
| **`intentDispatcher.js`**             | The Traffic Cop          | Decides instantly whether a question needs a fast-path formula or a slow-path deep AI analysis.                         |
| **`sqlAgent.js`**                     | PostgreSQL Analyst       | The AI expert specialized in searching for names, hierarchies, and relational metadata.                                 |
| **`mongoAgent.js`**                   | MongoDB Analyst          | The AI expert specialized in analyzing millions of transaction logs and performance metrics.                            |
| **`vectorStore.js`**                  | The Concept Memory       | Allows the AI to "remember" concepts and search for relevant data patterns by meaning rather than just keywords.        |
| **`knowledgeBase.js`**                | The "Golden" Memory      | Stores perfect query examples from the past to ensure the AI always follows the best historical patterns.               |
| **`modelRouter.js`**                  | Cost & Efficiency Expert | Automatically picks the cheapest and fastest AI model (e.g., Llama vs Qwen) based on the question's difficulty.         |
| **`dbService.js`**                    | SQL Pipeline             | The reliable high-speed connection bridge to our PostgreSQL (Relational) database.                                      |
| **`mongoService.js`**                 | NoSQL Pipeline           | The reliable high-speed connection bridge to our MongoDB (Big Data) database.                                           |
| **`ollamaService.js`**                | AI Bridge                | The communication layer that talks directly to the local AI models running on our servers.                              |
| **`schemaPruner.js`**                 | Context Filter           | Keeps the AI focused by "cleaning up" the database map and only showing it what it needs to see.                        |
| **`cacheService.js`**                 | Results Locker           | Remembers the answers to common questions so we don't have to calculate them twice (saving time and compute).           |
| **`trainingService.js`**              | Continuous Learner       | Implements logic to help the system learn from new data and refine its own accuracy over time.                          |
| **`datasetService.js`**               | Data Librarian           | Manages the specific datasets used to fine-tune or ground the AI models for better performance.                         |
| **`intentClassifier.js`**             | Semantic Linguist        | An advanced module that understands the "intent" of a user's question with surgical precision.                          |

---

## 🧠 The AI "Employee Handbook" (`src/prompts/`)

These files contain the instructions and rules we give the AI to ensure it behaves like a Senior Data Analyst.

| File                      | Purpose             | CEO Translation                                                                   |
| :------------------------ | :------------------ | :-------------------------------------------------------------------------------- |
| **`baseSystemPrompt.js`** | Corporate Identity  | Sets the "Professional Analyst" persona and safety guardrails.                    |
| **`postgresPrompt.js`**   | Relational Training | Teaches the AI exactly how our Merchant and Device tables link together.          |
| **`mongoPrompt.js`**      | Metrics Training    | Teaches the AI our specific financial field names (e.g., Use `txnAmt` for money). |
| **`summaryPrompt.js`**    | Executive Summary   | Instructions on how to write the final 1-paragraph text summary for the user.     |
| **`retryPrompt.js`**      | Self-Correction     | A "safety net" that allows the AI to fix its own typos if a query fails.          |

---

## 🚀 Summary for Presentation

_"We built an AI platform that gives you the best of both worlds: It uses **hard-coded logic** for 100% accurate daily dashboards and core KPIs, but it maintains a **flexible AI core** that can analyze any ad-hoc data question you throw at it in plain English. It is fast, secure, and financially precise."_
