# Ledgerly 📊

> **Smart Business Bookkeeping & AI Invoice Parsing Platform**

Ledgerly is a full-featured bookkeeping, accounting, and bill-management web application built with **Next.js**, **Tailwind CSS**, **Firebase**, and **Google Gemini AI**. It enables businesses and accountants to track sales, purchases, expenses, and inventory while automatically digitizing physical invoices and receipts using multimodal AI.

---

## ✨ Features

- 🧾 **AI Smart Bill Scanner**:
  - Automatically parses PDF, Microsoft Word (`.docx`, `.doc`), and high-resolution images (`.png`, `.jpg`, `.webp`).
  - Powered by **Google Gemini API** (`@google/genai`) with rule-based fallback and local OCR.
  - Accurately captures invoice number, date, vendor/supplier name, customer/party name, taxable amount, CGST/SGST/IGST, 2% TCS on billing, and net invoice amount.
- 💼 **Accounting & Bookkeeping**:
  - Ledger management for Sales, Purchases, and Expenses.
  - Party master directory for Customers and Suppliers with GSTIN, contact details, and address tracking.
  - Item/Product catalog with HSN codes, sale rates, purchase rates, and tax brackets.
  - Real-time Profit & Loss calculation, revenue summaries, and cash flow analysis.
- 🔐 **Dual Mode (Cloud & Local Sandbox)**:
  - **Firebase Cloud Mode**: Multi-user authentication, cloud persistence with Cloud Firestore, and secure Firebase Admin verification.
  - **Local Sandbox Mode**: Fully functional offline local storage mode for instant testing without mandatory cloud credentials.
- 🚀 **Production-Ready & Portable**:
  - Zero hardcoded domain URLs — built with dynamic relative API routes.
  - Optimized for **Vercel**, **Firebase App Hosting**, or standalone Node.js servers.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Lucide Icons
- **AI & OCR**: Google Gemini API (`@google/genai`), Tesseract.js, Mammoth (`.docx`), pdf-parse (`.pdf`)
- **Backend / Database**: Firebase Authentication, Cloud Firestore, Firebase Admin SDK
- **Runtime**: Node.js 18+ or 20+

---

## 📋 Prerequisites

Before getting started, make sure you have:
- **Node.js** (v18.17.0 or v20.x recommended)
- **npm** (bundled with Node.js) or **pnpm** / **yarn**
- **Git**
- *(Optional)* A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- *(Optional)* A **Firebase Project** from the [Firebase Console](https://console.firebase.google.com/)

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the Repository
```bash
git clone https://github.com/bhaskarpareek099-rgb/ledgerly.git
cd ledgerly
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment template into a local environment file:
```bash
cp .env.example .env.local
```
*(On Windows Command Prompt, run: `copy .env.example .env.local`)*

Open `.env.local` and provide your credentials (see [Environment Variables Reference](#-environment-variables-reference) below).

> **Note**: Ledgerly can also run in **Local Sandbox Mode** if Firebase credentials are omitted. To use AI Bill Scanning, you can provide `GEMINI_API_KEY` in `.env.local` or enter it directly in the app settings modal.

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables Reference

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `PORT` | Server | Optional port (defaults to `3000`) |
| `GEMINI_API_KEY` | Server | Google Gemini API key for AI invoice recognition |
| `GEMINI_MODEL` | Server | Model version (default: `gemini-2.5-flash` or `gemini-3.8-flash`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | Firebase Authentication domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client | Firebase Storage bucket URL |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client | Firebase Cloud Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | Firebase Web App ID |
| `FIREBASE_ADMIN_PROJECT_ID` | Server | Firebase Admin Project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Server | Firebase Admin Service Account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Server | Firebase Admin Private Key (`\n` escaped) |

Refer to `.env.example` for a clean template.

---

## 🌐 Deploy to Vercel

Ledgerly is architected for zero-configuration deployment on **Vercel**:

1. Push your code to your GitHub repository (`bhaskarpareek099-rgb/ledgerly`).
2. Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Import your `ledgerly` repository.
4. Under **Environment Variables**, add the keys from your `.env.local` (e.g. `GEMINI_API_KEY`, `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_ADMIN_*`).
5. Click **Deploy**. Vercel will build and assign a production URL instantly!

---

## 🔒 Security Best Practices

- **Never commit `.env` or `.env.local`**: Real API keys, database credentials, and service accounts are excluded via `.gitignore`.
- **Client vs Server Secrets**: Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Sensitive keys (`GEMINI_API_KEY`, `FIREBASE_ADMIN_PRIVATE_KEY`) remain strictly server-side.
- **Dynamic Endpoints**: All client-side fetch requests use relative paths (`/api/...`), ensuring immunity to domain or port changes across staging and production environments.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
