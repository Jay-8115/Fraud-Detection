# FraudWatch: Software Requirements, Feasibility, and Architectural Analysis

This document provides a comprehensive software requirements analysis, technical feasibility study, environmental setup guide, and architectural specification for **FraudWatch** — an AI-Powered Financial Fraud Detection and Risk Analyzer system.

---

## 1. Requirement Gathering Analysis

### 1.1 Project Problem Statement & Objectives

#### 1.1.1 Problem Statement
Modern financial institutions, payment processors, and audit teams handle millions of daily transactional records. However, conventional fraud identification workflows suffer from four systemic vulnerabilities:
1. **Rigid Rule-Based Limitations**: Standard threshold-based rules (e.g., flagging amounts $> \$10,000$) fail against sophisticated fraud patterns, micro-spend trails, and velocity anomalies.
2. **Absence of Pre-Labeled Datasets**: Supervised machine learning algorithms require costly, manually annotated historical datasets containing `is_fraud` ground-truth labels. In real-world audit scenarios, incoming client datasets are un-labeled, rendering supervised models ineffective.
3. **Black-Box Explainability Gap**: Existing machine learning models produce numerical probability scores without explaining *why* a record was flagged, forcing analysts to manually reconstruct anomaly features to satisfy compliance regulators.
4. **Data Fragmentation & Manual Workflows**: Transactional data is distributed across incompatible formats (CSV, Excel workbooks, PDF bank statements), requiring tedious manual extraction, Z-score scaling, and manual report compilation.

#### 1.1.2 Project Objectives
**FraudWatch** is engineered to eliminate these bottlenecks by combining **Unsupervised Machine Learning** with **Generative AI**. The core objectives are:
* **Objective 1 (Automated Multi-Format Ingestion)**: Ingest CSV, XLSX, and PDF datasets up to 10MB, automatically clean duplicate records, impute missing cells, and normalize spend metrics via Z-Score scaling.
* **Objective 2 (Unsupervised Ensemble Detection)**: Execute four complementary ML models (Isolation Forest, Local Outlier Factor, One-Class SVM, AutoEncoder) in parallel, combining outputs via weighted majority voting (35% IF, 30% AE, 20% LOF, 15% SVM) to detect zero-day financial fraud without requiring historical labels.
* **Objective 3 (GenAI Explainability & Threat Reporting)**: Integrate Google Gemini 2.5 Flash to convert numeric ML output vectors into plain-language bulleted explanations for every flagged row and synthesize executive threat reports.
* **Objective 4 (Interactive Analytics & Conversational AI Chat)**: Render real-time risk breakdown charts (Critical, High, Medium, Low), multi-column search/filtering, and an interactive AI Chat Assistant for conversational dataset exploration.
* **Objective 5 (Automated Compliance PDF Generation)**: Stream server-compiled PDF compliance audit reports (`pdfkit`) containing dataset statistics, ensemble voting breakdowns, executive AI audits, and flagged transaction tables.

### 1.2 Stakeholders & Roles
*   **Standard Analyst**: High-level financial officer or audit team member. Responsibilities include uploading transaction datasets (CSV, XLSX, PDF), reviewing anomaly scores, examining risk breakdowns, utilizing the interactive AI chat assistant, and downloading compliance PDF reports.
*   **Platform Administrator**: IT security and administrative supervisor. Responsible for reviewing system audit logs, monitoring global usage statistics (storage allocations, dataset history, transaction volumes), managing user access permissions, and maintaining platform security parameters.

### 1.2 Functional Requirements (FR)

#### FR-1: Multi-Format File Ingestion & Data Preprocessing
*   **FR-1.1**: The system shall accept dataset uploads in `.csv`, `.xlsx`, `.xls`, and `.pdf` formats up to a maximum file size boundary of 10MB.
*   **FR-1.2**: The system shall extract text and tabular structures from PDF files using spatial pattern alignment to isolate Transaction IDs, Timestamps, Amounts, and Category metadata.
*   **FR-1.3**: The system shall clean datasets automatically by filtering duplicate transaction records, imputing missing numerical values using column-mean statistics, and mapping empty text fields to "Unknown".
*   **FR-1.4**: The system shall compute Z-Score normalization for numeric transaction amounts:
    $$\text{Z-Score} = \frac{\text{Amount} - \mu}{\sigma}$$

#### FR-2: Unsupervised Machine Learning Ensemble Engine
*   **FR-2.1**: The system shall execute four unsupervised anomaly detection algorithms in parallel upon dataset ingestion:
    1.  **Isolation Forest (IF)**: Isolates structural anomalies, spend spikes, and location variance.
    2.  **Local Outlier Factor (LOF)**: Measures local density deviation to detect micro-spend trails and payment anomalies.
    3.  **One-Class SVM (OC-SVM)**: Establishes boundary hyperplanes to flag abnormal multi-dimensional feature vectors.
    4.  **AutoEncoder (AE)**: Neural network reconstruction model detecting complex behavioral pattern deviations.
*   **FR-2.2**: The system shall combine algorithm outputs using a dynamic **Weighted Majority Voting Scheme**:
    $$\text{Fraud Score} = (0.35 \times \text{IF}) + (0.30 \times \text{AE}) + (0.20 \times \text{LOF}) + (0.15 \times \text{SVM})$$
*   **FR-2.3**: The system shall classify transactions with a weighted anomaly score $\ge 0.70$ (70%) as **Fraud**, and remaining records as **Normal**.
*   **FR-2.4**: The system shall categorize transaction risk into four distinct severity tiers:
    *   **Critical Risk**: Score $\ge 81\%$
    *   **High Risk**: Score $61\% - 80\%$
    *   **Medium Risk**: Score $31\% - 60\%$
    *   **Low Risk**: Score $< 30\%$

#### FR-3: Suspicious Transaction Table & Interactive Dashboards
*   **FR-3.1**: The dashboard shall display aggregate metrics including Total Records, Fraud Count, Fraud Percentage, Average Risk Score, and Risk Breakdown distributions.
*   **FR-3.2**: The system shall provide an interactive Suspicious Transaction Table displaying Transaction ID, Amount, Fraud Probability, Risk Tier, and AI Flagging Explanations.
*   **FR-3.3**: The interface shall dynamically hide missing metric columns (e.g., Country, Merchant ID, IP Address) if not present in the ingested dataset schema.
*   **FR-3.4**: The user interface shall support client-side search, multi-field filtering, sorting, pagination, and one-click data export to CSV and Excel.

#### FR-4: Generative AI Audits & Interactive Explanations
*   **FR-4.1**: The system shall construct structured AI prompt payloads from flagged record vectors and submit them to the Google Gemini REST API (`gemini-2.5-flash`).
*   **FR-4.2**: The AI engine shall generate executive threat audits covering: Executive Summary, Pattern Analysis, Suspicious Customer/Merchant Clusters, Key Findings, and Strategic Prevention Recommendations.
*   **FR-4.3**: The AI engine shall generate natural-language explanations explaining why each specific transaction was flagged by the ensemble ML models.
*   **FR-4.4**: The platform shall provide an interactive AI Chat Assistant allowing analysts to query dataset metrics in conversational natural language.

#### FR-5: Compliance PDF Report Generation
*   **FR-5.1**: The system shall generate streamable, vector-crisp PDF compliance audit reports using `pdfkit`.
*   **FR-5.2**: The compiled PDF report shall include Executive AI Audits, Cleaning Metrics, Ensemble Model Voting Ratios, Risk Distribution Charts, and the top Suspicious Transaction Records.

### 1.3 Non-Functional Requirements (NFR)
*   **NFR-PERF-1 (Performance)**: Preprocessing and ML ensemble scoring for a 1,000-record dataset must complete in under 5.0 seconds.
*   **NFR-PERF-2 (Latency)**: Initial web dashboard load time must not exceed 1.5 seconds. Database aggregate queries must execute under 500 milliseconds.
*   **NFR-SAFE-1 (Memory Safety)**: File upload memory buffers must automatically purge immediately upon detecting corrupt or out-of-bounds binary payloads.
*   **NFR-SAFE-2 (Fault Tolerance)**: Failed execution pipelines must execute atomic database rollbacks and flag analysis status as `failed`.
*   **NFR-SEC-1 (Security)**: User authentication sessions must rely on HTTP-only, secure cookies to prevent XSS session hijack risks.
*   **NFR-SEC-2 (Tenant Isolation)**: All dataset uploads, analyses, and generated PDF reports must strictly isolate access to the authenticated user ID.
*   **NFR-QUAL-1 (Adaptability & Portability)**: The UI and parsing engine must adapt dynamically to arbitrary dataset column schemas and execute cross-platform on Node.js v18+.

---

## 2. Technical & Operational Feasibility Analysis

### 2.1 Technical Feasibility
*   **Next.js 15 (App Router & TypeScript)**: Next.js provides hybrid SSR and high-performance server API route handlers. Native TypeScript enforcement guarantees end-to-end type safety between data parsing, ML scoring, and UI rendering.
*   **Drizzle ORM & PostgreSQL**: Drizzle ORM delivers light-weight, SQL-like type safety without heavy runtime overhead. PostgreSQL provides robust relational integrity and JSON query capabilities for transaction metadata.
*   **Native TypeScript ML Ensemble**: Implementing Isolation Forest, LOF, One-Class SVM, and AutoEncoder algorithms directly within server-side TypeScript eliminates foreign sub-process execution latency and guarantees instant 100% cross-platform execution.
*   **Google Gemini 2.5 Flash API**: Provides low-latency natural language generation and report synthesis with high throughput and reliable uptime.
*   **PDFKit Generation**: Allows server-side binary PDF compilation directly into network responses without requiring headless browser engines (e.g. Puppeteer).

### 2.2 Operational Feasibility
*   **Analyst Usability**: Automated file parsing and unsupervised learning mean non-technical financial analysts can drag-and-drop datasets and obtain actionable audit reports in seconds without tuning ML parameters.
*   **Administrator Auditing**: Full system transparency is guaranteed through centralized activity audit logs, dataset history tracking, and error monitoring dashboards.

### 2.3 Economical Feasibility
*   **Zero License Cost**: Built entirely on open-source frameworks (Next.js, Drizzle, PostgreSQL, React, Lucide, Tailwind).
*   **API Cost Optimization**: Gemini 2.5 Flash features ultra-low token pricing ($0.075 per 1M input tokens), allowing thousands of dataset audits to be processed at negligible operational expense.
*   **Database Infrastructure**: PostgreSQL runs efficiently on local instances or low-cost managed cloud services (Neon, Supabase).

---

## 3. Project Environment & Dependency Setup Guidelines

### 3.1 System Software Requirements
*   **Node.js**: Version 18.0.0 or higher
*   **npm**: Package manager (v9.0.0 or higher)
*   **PostgreSQL**: Version 14 or higher (Running locally on `localhost:5432` or via cloud connection)
*   **Git**: Version control

### 3.2 Core Node.js Dependencies (`package.json`)
*   `next`: Framework for App Router and API routes (v15.1.0)
*   `drizzle-orm` & `drizzle-kit`: PostgreSQL ORM and schema migration tools
*   `pg`: Node.js PostgreSQL client
*   `@google/generative-ai`: Google Gemini GenAI SDK
*   `pdfkit` & `@types/pdfkit`: PDF generation compiler
*   `pdf-parse`: PDF tabular text extractor
*   `xlsx`: Microsoft Excel sheet parser
*   `recharts`: Data visualization (Pie, Bar, Trend charts)
*   `framer-motion`: Smooth UI transitions and dynamic animations
*   `lucide-react`: Modern interface icon kit
*   `zod`: Schema validation library

### 3.3 Environment Variables (`.env`)
Create a `.env` file in the project root with the following keys:
```env
# Database Connection URL
DATABASE_URL=postgresql://postgres:8115@localhost:5432/fraud

# Server Environment Configuration
PORT=5000
NODE_ENV=development

# Clerk Authentication Keys (Optional/Offline Mock)
CLERK_PUBLISHABLE_KEY=pk_test_dGVzdC1jbGVyay1rZXktOTkuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_dGVzdC1zZWNyZXQta2V5LTk5LmNsZXJrLmFjY291bnRzLmRldiQ

# Google Gemini API Key for AI Audits and Explanations
GEMINI_API_KEY=AIzaSy...
```

### 3.4 Initialization & Execution Commands
Execute the following commands sequentially in your terminal:
```bash
# 1. Install Node.js project dependencies
npm install

# 2. Synchronize PostgreSQL database schema via Drizzle Kit
npm run db:push

# 3. Start local Next.js development server
npm run dev
```

---

## 4. Platform Architecture & File Ledger

### 4.1 Folder Structure Layout
```
fraud/
├── .env                              # Environment variables & secrets
├── drizzle.config.ts                 # Drizzle ORM migration configuration
├── next.config.ts                    # Next.js framework configuration
├── package.json                      # Node.js dependencies and script entries
├── postcss.config.js                 # PostCSS configuration for styling
├── tsconfig.json                     # TypeScript compiler settings
├── public/                           # Static public assets
├── uploads/                          # Local file storage for uploaded CSV/XLSX/PDF
├── src/
│   ├── app/                          # Next.js App Router Structure
│   │   ├── layout.tsx                # Main Root Layout
│   │   ├── page.tsx                  # Landing / Overview page
│   │   ├── dashboard/                # Analyst Dashboard UI
│   │   ├── upload/                   # Dataset Upload Page
│   │   ├── analysis/                 # Analysis detail & metrics views
│   │   ├── admin/                    # Platform Admin & Audit log panel
│   │   └── api/                      # Next.js API Server Routes
│   │       ├── upload/               # File upload & parsing route
│   │       ├── analyze/              # ML ensemble & AI execution pipeline
│   │       ├── export-pdf/           # PDFKit report download generator
│   │       ├── chat/                 # AI Assistant Q&A endpoint
│   │       └── audit-logs/           # System activity logger endpoint
│   ├── components/                   # Reusable React UI Components
│   │   ├── Navbar.tsx                # Top navigation header
│   │   ├── FileUploader.tsx          # Drag & Drop file ingestion dropzone
│   │   ├── TransactionTable.tsx      # Suspicious transactions data grid
│   │   ├── RiskCharts.tsx            # Recharts visualization graphics
│   │   └── ChatAssistant.tsx         # Interactive AI drawer sidebar
│   ├── db/                           # Database Layer
│   │   ├── index.ts                  # PostgreSQL connection pool singleton
│   │   └── schema.ts                 # Drizzle relational table definitions
│   └── lib/                          # Backend Services & Algorithms
│       ├── dataPreprocessor.ts       # CSV/XLSX/PDF parser & Z-score cleaner
│       ├── fraudDetection.ts         # IF, LOF, SVM, AE ensemble algorithm engine
│       ├── gemini.ts                 # Gemini 2.5 Flash API client wrapper
│       └── pdfGenerator.ts           # PDFKit document compilation engine
```

### 4.2 Database Table Relationships & Schema Specification

The FraudWatch relational schema is managed via **Drizzle ORM** on a **PostgreSQL** database engine. Below is the complete relational architecture formatted in readable structured tables, cardinality definitions, and entity column ledgers.

---

#### 4.2.1 Entity Relationship Summary Matrix

| Parent Entity (`Table`) | Target Entity (`Table`) | Relationship Type | Foreign Key Field | Cascade / On Delete Behavior | Purpose & Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`users`** | `uploaded_files` | One-to-Many ($1 : N$) | `uploaded_files.user_id` | Cascade | Tracks all dataset files uploaded by a specific user. |
| **`users`** | `analyses` | One-to-Many ($1 : N$) | `analyses.user_id` | Cascade | Tracks all fraud analysis jobs initiated by a specific user. |
| **`users`** | `reports` | One-to-Many ($1 : N$) | `reports.user_id` | Cascade | Associates compiled PDF audit reports with their requesting analyst. |
| **`users`** | `audit_logs` | One-to-Many ($1 : N$) | `audit_logs.user_id` | Cascade | Records security and administrative actions performed by a user. |
| **`users`** | `chat_messages` | One-to-Many ($1 : N$) | `chat_messages.user_id` | Cascade | Stores interactive AI chat messages sent/received by a user. |
| **`uploaded_files`** | `analyses` | One-to-One ($1 : 1$) | `analyses.file_id` | Restrict | Connects an uploaded dataset file to its executed ML analysis engine record. |
| **`analyses`** | `transactions` | One-to-Many ($1 : N$) | `transactions.analysis_id` | Cascade | Stores all individual row-level transaction records and risk metrics. |
| **`analyses`** | `reports` | One-to-One ($1 : 1$) | `reports.analysis_id` | Cascade | Links an executed fraud analysis to its final compiled compliance PDF report. |
| **`analyses`** | `chat_messages` | One-to-Many ($1 : N$) | `chat_messages.analysis_id` | Set Null | Connects chat Q&A context directly to a specific dataset analysis session. |

---

#### 4.2.2 Readable Table Schema Ledgers

##### 1. `users` Table (`usersTable`)
*Primary entity storing analyst and system administrator accounts.*

| Column Name | Data Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `serial` | **PRIMARY KEY**, Auto-Increment | Unique internal user identifier |
| `clerk_id` | `text` | **NOT NULL**, **UNIQUE** | External Clerk auth ID / session token |
| `email` | `text` | **NOT NULL**, **UNIQUE** | User login email address |
| `name` | `text` | **NOT NULL** | User full name |
| `role` | `text` | **NOT NULL**, Enum (`user`, `admin`) | Role authorization tier (Default: `user`) |
| `password` | `text` | **NOT NULL**, Default: `""` | Hashed password string |
| `is_blocked` | `boolean` | **NOT NULL**, Default: `false` | Administrator account restriction flag |
| `total_uploads` | `integer` | **NOT NULL**, Default: `0` | Aggregated count of uploaded datasets |
| `total_analyses` | `integer` | **NOT NULL**, Default: `0` | Aggregated count of executed analyses |
| `last_login_at` | `timestamp` | Nullable | Timestamp of most recent user login |
| `created_at` | `timestamp` | **NOT NULL**, Default: `now()` | User creation timestamp |
| `updated_at` | `timestamp` | **NOT NULL**, Default: `now()` | Last user modification timestamp |

---

##### 2. `uploaded_files` Table (`uploadedFilesTable`)
*Stores metadata and parsing states for ingested dataset files (CSV, XLSX, PDF).*

| Column Name | Data Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `serial` | **PRIMARY KEY**, Auto-Increment | Unique file record identifier |
| `user_id` | `integer` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `users.id` | Owner user identifier |
| `file_name` | `text` | **NOT NULL** | System stored file name |
| `original_name` | `text` | **NOT NULL** | Original uploaded file name |
| `file_size` | `integer` | **NOT NULL** | Size of uploaded file in bytes |
| `file_type` | `text` | **NOT NULL** | MIME / file extension (`.csv`, `.xlsx`, `.pdf`) |
| `row_count` | `integer` | Nullable | Total rows parsed from file |
| `column_count` | `integer` | Nullable | Total columns parsed from file |
| `columns` | `json` | Nullable (`string[]`) | Array of extracted header column names |
| `preview` | `json` | Nullable (`Record[]`) | Top 5 row JSON preview for UI rendering |
| `status` | `text` | **NOT NULL**, Enum (`pending`, `processing`, `ready`, `error`) | Processing state of file parser |
| `error_message` | `text` | Nullable | Failure reason if parsing failed |
| `created_at` | `timestamp` | **NOT NULL**, Default: `now()` | Upload timestamp |

---

##### 3. `analyses` Table (`analysesTable`)
*Core entity holding ensemble machine learning results and AI audit summaries.*

| Column Name | Data Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `serial` | **PRIMARY KEY**, Auto-Increment | Unique analysis job identifier |
| `user_id` | `integer` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `users.id` | Initiating user identifier |
| `file_id` | `integer` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `uploaded_files.id` | Source dataset file identifier |
| `file_name` | `text` | **NOT NULL** | Associated dataset file name |
| `model_name` | `text` | **NOT NULL**, Default: `"auto"` | Model selection (`auto`, `ensemble`, etc.) |
| `status` | `text` | **NOT NULL**, Enum (`pending`, `running`, `completed`, `failed`) | Processing state of analysis pipeline |
| `total_transactions` | `integer` | Nullable | Total evaluated transaction count |
| `fraud_count` | `integer` | Nullable | Flagged fraud transaction count ($\text{Score} \ge 70\%$) |
| `legitimate_count` | `integer` | Nullable | Normal transaction count ($\text{Score} < 70\%$) |
| `fraud_percentage` | `real` | Nullable | Ratio of fraudulent vs total transactions |
| `risk_breakdown` | `json` | Nullable (`{critical, high, medium, low}`) | Object count per risk tier |
| `metrics` | `json` | Nullable (`{accuracy, precision, recall, f1Score, executionMs}`) | ML execution performance metrics |
| `ai_summary` | `text` | Nullable | Gemini 2.5 Flash executive threat audit report |
| `feature_importance` | `json` | Nullable (`Record<string, number>`) | Calculated feature anomaly weights |
| `error_message` | `text` | Nullable | Failure stack trace if pipeline failed |
| `progress_step` | `text` | Nullable | Current execution stage for UI progress bar |
| `recommended_model` | `text` | Nullable | Algorithm evaluated with highest confidence |
| `model_comparison` | `json` | Nullable | Detailed accuracy/speed breakdown across IF, LOF, SVM, AE |
| `data_summary` | `json` | Nullable | Statistical baseline metrics (mean spend, max amount, stddev) |
| `created_at` | `timestamp` | **NOT NULL**, Default: `now()` | Execution start timestamp |
| `completed_at` | `timestamp` | Nullable | Execution completion timestamp |

---

##### 4. `transactions` Table (`transactionsTable`)
*Granular row-level dataset entries with individual anomaly predictions and AI natural language explanations.*

| Column Name | Data Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `serial` | **PRIMARY KEY**, Auto-Increment | Internal record identifier |
| `analysis_id` | `integer` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `analyses.id` | Parent analysis identifier |
| `transaction_id` | `text` | **NOT NULL** | Source dataset transaction ID string |
| `amount` | `real` | Nullable | Transaction monetary value |
| `prediction` | `text` | **NOT NULL**, Enum (`fraud`, `legitimate`) | Model classification outcome |
| `probability` | `real` | **NOT NULL** | Calculated ensemble fraud score ($0.0 - 1.0$) |
| `risk_score` | `real` | **NOT NULL** | Scaled risk score ($0 - 100$) |
| `risk_level` | `text` | **NOT NULL**, Enum (`critical`, `high`, `medium`, `low`) | Assigned risk severity category |
| `reason` | `text` | Nullable | Gemini AI natural language explanation |
| `raw_data` | `json` | **NOT NULL**, Default: `{}` | Original key-value transaction row object |
| `created_at` | `timestamp` | **NOT NULL**, Default: `now()` | Transaction record insertion timestamp |

---

##### 5. `reports` Table (`reportsTable`)
*Stores metadata and download links for compiled PDF compliance audit reports.*

| Column Name | Data Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `serial` | **PRIMARY KEY**, Auto-Increment | Unique report identifier |
| `user_id` | `integer` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `users.id` | Owner user identifier |
| `analysis_id` | `integer` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `analyses.id` | Target analysis identifier |
| `file_name` | `text` | **NOT NULL** | PDF output file name |
| `download_url` | `text` | **NOT NULL** | REST download URL endpoint |
| `created_at` | `timestamp` | **NOT NULL**, Default: `now()` | Report compilation timestamp |

---

##### 6. `audit_logs` Table (`auditLogsTable`)
*Tracks system security events, dataset deletions, admin interventions, and API calls.*

| Column Name | Data Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `serial` | **PRIMARY KEY**, Auto-Increment | Unique audit log entry identifier |
| `user_id` | `integer` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `users.id` | User performing action |
| `user_email` | `text` | **NOT NULL** | Snapshot of user email |
| `action` | `text` | **NOT NULL** | Action executed (e.g. `FILE_UPLOAD`, `DELETE_ANALYSIS`) |
| `resource` | `text` | **NOT NULL** | Target system resource |
| `resource_id` | `text` | Nullable | ID of target resource |
| `details` | `text` | Nullable | Additional context or payload JSON |
| `ip_address` | `text` | Nullable | Client IP address string |
| `created_at` | `timestamp` | **NOT NULL**, Default: `now()` | Event logging timestamp |

---

##### 7. `chat_messages` Table (`chatMessagesTable`)
*Stores interactive AI assistant conversation logs linked to users and dataset context.*

| Column Name | Data Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `serial` | **PRIMARY KEY**, Auto-Increment | Unique message identifier |
| `user_id` | `integer` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `users.id` | Owner user identifier |
| `analysis_id` | `integer` | Nullable, **FOREIGN KEY** $\rightarrow$ `analyses.id` | Referenced analysis session context |
| `role` | `text` | **NOT NULL**, Enum (`user`, `assistant`) | Message author role |
| `content` | `text` | **NOT NULL** | Message text body |
| `created_at` | `timestamp` | **NOT NULL**, Default: `now()` | Message timestamp |

---

#### 4.2.3 Visual Structured Entity Hierarchy

```
[ users ] (1)
  │
  ├───► (N) [ uploaded_files ] (1) ───► (1) [ analyses ] (1) ───► (1) [ reports ]
  │                                           │
  ├───► (N) [ audit_logs ]                    └───► (N) [ transactions ]
  │                                           │
  └───► (N) [ chat_messages ] ◄───────────────┘
```

---

#### 4.2.4 Drawn Box-Grid Database Master Schema

```text
+-----------------------------------------------------------------------------------------------------------------------+
|                                              TABLE 1: users (usersTable)                                              |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| Column Name       | Data Type         | Constraints / Attributes      | Description                                   |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| id                | serial            | PRIMARY KEY, Auto-Increment   | Unique internal user identifier               |
| clerk_id          | text              | NOT NULL, UNIQUE              | External Clerk auth ID / session token        |
| email             | text              | NOT NULL, UNIQUE              | User login email address                      |
| name              | text              | NOT NULL                      | User full name                                |
| role              | text              | NOT NULL, Enum(user, admin)   | Role authorization tier (Default: user)       |
| password          | text              | NOT NULL, Default: ""         | Hashed password string                        |
| is_blocked        | boolean           | NOT NULL, Default: false      | Administrator account restriction flag        |
| total_uploads     | integer           | NOT NULL, Default: 0          | Aggregated count of uploaded datasets         |
| total_analyses    | integer           | NOT NULL, Default: 0          | Aggregated count of executed analyses         |
| last_login_at     | timestamp         | Nullable                      | Timestamp of most recent user login           |
| created_at        | timestamp         | NOT NULL, Default: now()      | User creation timestamp                       |
| updated_at        | timestamp         | NOT NULL, Default: now()      | Last user modification timestamp              |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------+
|                                          TABLE 2: uploaded_files (uploadedFilesTable)                                 |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| Column Name       | Data Type         | Constraints / Attributes      | Description                                   |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| id                | serial            | PRIMARY KEY, Auto-Increment   | Unique file record identifier                 |
| user_id           | integer           | NOT NULL, FK -> users.id      | Owner user identifier                         |
| file_name         | text              | NOT NULL                      | System stored file name                       |
| original_name     | text              | NOT NULL                      | Original uploaded file name                   |
| file_size         | integer           | NOT NULL                      | Size of uploaded file in bytes                |
| file_type         | text              | NOT NULL                      | MIME / file extension (.csv, .xlsx, .pdf)     |
| row_count         | integer           | Nullable                      | Total rows parsed from file                   |
| column_count      | integer           | Nullable                      | Total columns parsed from file                |
| columns           | json              | Nullable (string[])           | Array of extracted header column names        |
| preview           | json              | Nullable (Record[])           | Top 5 row JSON preview for UI rendering       |
| status            | text              | NOT NULL, Enum(pending, ready)| Processing state of file parser               |
| error_message     | text              | Nullable                      | Failure reason if parsing failed              |
| created_at        | timestamp         | NOT NULL, Default: now()      | Upload timestamp                              |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------+
|                                            TABLE 3: analyses (analysesTable)                                          |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| Column Name       | Data Type         | Constraints / Attributes      | Description                                   |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| id                | serial            | PRIMARY KEY, Auto-Increment   | Unique analysis job identifier                |
| user_id           | integer           | NOT NULL, FK -> users.id      | Initiating user identifier                    |
| file_id           | integer           | NOT NULL, FK -> files.id      | Source dataset file identifier                |
| file_name         | text              | NOT NULL                      | Associated dataset file name                  |
| model_name        | text              | NOT NULL, Default: "auto"     | Model selection algorithm                     |
| status            | text              | NOT NULL, Enum(running, done) | Processing state of analysis pipeline         |
| total_transactions| integer           | Nullable                      | Total evaluated transaction count             |
| fraud_count       | integer           | Nullable                      | Flagged fraud transaction count (Score >= 70%)|
| legitimate_count  | integer           | Nullable                      | Normal transaction count (Score < 70%)        |
| fraud_percentage  | real              | Nullable                      | Ratio of fraudulent vs total transactions     |
| risk_breakdown    | json              | Nullable ({crit,high,med,low})| Object count per risk tier                    |
| metrics           | json              | Nullable ({acc,prec,rec,f1})  | ML execution performance metrics              |
| ai_summary        | text              | Nullable                      | Gemini 2.5 Flash threat audit report          |
| feature_importance| json              | Nullable                      | Calculated feature anomaly weights            |
| error_message     | text              | Nullable                      | Failure stack trace if pipeline failed        |
| progress_step     | text              | Nullable                      | Current execution stage for UI progress bar   |
| recommended_model | text              | Nullable                      | Algorithm evaluated with highest confidence   |
| model_comparison  | json              | Nullable                      | Accuracy/speed across IF, LOF, SVM, AE        |
| data_summary      | json              | Nullable                      | Statistical baseline metrics                  |
| created_at        | timestamp         | NOT NULL, Default: now()      | Execution start timestamp                     |
| completed_at      | timestamp         | Nullable                      | Execution completion timestamp                |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------+
|                                         TABLE 4: transactions (transactionsTable)                                     |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| Column Name       | Data Type         | Constraints / Attributes      | Description                                   |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| id                | serial            | PRIMARY KEY, Auto-Increment   | Internal record identifier                    |
| analysis_id       | integer           | NOT NULL, FK -> analyses.id   | Parent analysis identifier                    |
| transaction_id    | text              | NOT NULL                      | Source dataset transaction ID string          |
| amount            | real              | Nullable                      | Transaction monetary value                    |
| prediction        | text              | NOT NULL, Enum(fraud, legit)  | Model classification outcome                  |
| probability       | real              | NOT NULL                      | Calculated ensemble fraud score (0.0 - 1.0)   |
| risk_score        | real              | NOT NULL                      | Scaled risk score (0 - 100)                   |
| risk_level        | text              | NOT NULL, Enum(crit,high,med) | Assigned risk severity category               |
| reason            | text              | Nullable                      | Gemini AI natural language explanation        |
| raw_data          | json              | NOT NULL, Default: {}         | Original key-value transaction row object     |
| created_at        | timestamp         | NOT NULL, Default: now()      | Transaction record insertion timestamp        |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------+
|                                            TABLE 5: reports (reportsTable)                                            |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| Column Name       | Data Type         | Constraints / Attributes      | Description                                   |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| id                | serial            | PRIMARY KEY, Auto-Increment   | Unique report identifier                      |
| user_id           | integer           | NOT NULL, FK -> users.id      | Owner user identifier                         |
| analysis_id       | integer           | NOT NULL, FK -> analyses.id   | Target analysis identifier                    |
| file_name         | text              | NOT NULL                      | PDF output file name                          |
| download_url      | text              | NOT NULL                      | REST download URL endpoint                    |
| created_at        | timestamp         | NOT NULL, Default: now()      | Report compilation timestamp                  |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------+
|                                          TABLE 6: audit_logs (auditLogsTable)                                         |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| Column Name       | Data Type         | Constraints / Attributes      | Description                                   |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| id                | serial            | PRIMARY KEY, Auto-Increment   | Unique audit log entry identifier             |
| user_id           | integer           | NOT NULL, FK -> users.id      | User performing action                        |
| user_email        | text              | NOT NULL                      | Snapshot of user email                        |
| action            | text              | NOT NULL                      | Action executed (e.g. FILE_UPLOAD)            |
| resource          | text              | NOT NULL                      | Target system resource                        |
| resource_id       | text              | Nullable                      | ID of target resource                         |
| details           | text              | Nullable                      | Additional context or payload JSON            |
| ip_address        | text              | Nullable                      | Client IP address string                      |
| created_at        | timestamp         | NOT NULL, Default: now()      | Event logging timestamp                       |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------+
|                                       TABLE 7: chat_messages (chatMessagesTable)                                      |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| Column Name       | Data Type         | Constraints / Attributes      | Description                                   |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
| id                | serial            | PRIMARY KEY, Auto-Increment   | Unique message identifier                     |
| user_id           | integer           | NOT NULL, FK -> users.id      | Owner user identifier                         |
| analysis_id       | integer           | Nullable, FK -> analyses.id   | Referenced analysis session context           |
| role              | text              | NOT NULL, Enum(user, assistant)| Message author role                          |
| content           | text              | NOT NULL                      | Message text body                             |
| created_at        | timestamp         | NOT NULL, Default: now()      | Message timestamp                             |
+-------------------+-------------------+-------------------------------+-----------------------------------------------+
```


### 4.3 End-to-End System Workflow Sequence
```mermaid
sequenceDiagram
    autonumber
    actor Analyst as Standard Analyst
    participant UI as Next.js Client UI
    participant API as Next.js API Routes
    participant Preprocessor as Preprocessing Module
    participant ML as ML Ensemble Engine
    participant Gemini as Gemini 2.5 Flash API
    participant DB as PostgreSQL (Drizzle)

    Analyst->>UI: Upload File (CSV / XLSX / PDF)
    UI->>API: POST /api/upload (File Payload)
    API->>Preprocessor: Parse & Clean Records (Z-Score)
    Preprocessor-->>API: Processed Transaction Records
    API->>ML: Run Parallel ML (IF, LOF, SVM, AE)
    ML-->>API: Weighted Anomaly Scores & Flagged Rows
    API->>Gemini: POST Prompt (Flagged Fraud Vectors)
    Gemini-->>API: Threat Summaries & Explanations
    API->>DB: Save Analysis, Records & Audit Log
    DB-->>API: Confirmation & Analysis ID
    API-->>UI: Complete Json Response
    UI-->>Analyst: Render Metrics, Suspicious Table & Risk Visuals
```

---

## 5. Feasibility Summary & Decision Matrix

| Constraint Area | Feasibility Status | Risk Factors & Mitigation Strategies |
| :--- | :--- | :--- |
| **Technical Architecture** | **High Feasibility** | *Risk*: Latency during complex PDF text extraction.<br>*Mitigation*: Stream binary buffers directly and execute spatial grid regex matching in memory. |
| **Machine Learning Pipeline** | **High Feasibility** | *Risk*: Lack of historical labeled fraud data (`is_fraud` column missing).<br>*Mitigation*: Employ unsupervised ensemble algorithms (IF, LOF, SVM, AE) combined with weighted majority voting. |
| **AI Integration** | **High Feasibility** | *Risk*: Gemini REST API timeout or network disruption.<br>*Mitigation*: Use local heuristic rule-based template generation as immediate fallback if API fails. |
| **Database Performance** | **High Feasibility** | *Risk*: High transaction record volume causing slow dashboard renders.<br>*Mitigation*: Index `analysisId` foreign keys and paginate transaction records server-side. |
| **Operational & Usability** | **High Feasibility** | *Risk*: Financial analysts overwhelmed by machine learning jargon.<br>*Mitigation*: Translate ML anomaly vectors into concise, one-sentence natural language explanations and risk tiers. |
