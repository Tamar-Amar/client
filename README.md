# 🖥️ Client

React + TypeScript frontend for managing weekly educational activities, generating reports, and coordinating operators across institutions.

---

## 🌟 Key Features;

- View and assign activities per class and operator
- Export reports to PDF and Google Sheets
- Supports groups (kindergartens + schools)
- Holiday-based logic for disabling certain weeks

---

## 📑 PDF Reports

- Monthly PDF reports generated automatically for each operator
- Report includes:
  - Weekly schedule
  - Hebrew day headers
  - Class symbols per day
- Generated on the backend with `PDFKit`
- Sent via email using `nodemailer`
- PDF files are passed as `Buffer` attachments for accurate formatting and delivery

---

## 📊 Google Sheets & Excel Integration

- Monthly Excel-style reports per group and year
- Written directly to Google Sheets using `googleapis` v4
- Uses centralized `holidays.ts` file to detect non-operational weeks
- Non-operational weeks are auto-filled with **non-operational**
- User-initiated export via admin panel button
- Last export time is displayed to prevent repeated syncing

---

## 🛠️ Tech Stack

- **React 18** + **TypeScript**
- **React Query** – for state, cache, and refetching
- **Zod** – for frontend validation
- **MUI** – for styled components
- **Axios** – for backend communication
- **PDFKit** – for PDF generation
- **ExcelJS** – for programmatic Excel (.xlsx) file generation and export
- **Google Sheets API v4** – for writing Excel-style data to sheets
- **NodeMailer** – for email delivery

---

## 💡 Design Logic

- **Smart Calendar Engine**  
  Based on a dynamic Jewish `holidays.ts` file.  
  Entire weeks (Sunday–Thursday) are skipped if all days are holidays.

- **Weekly Aggregation**  
  Activities are grouped and exported per calendar week (Sunday–Saturday).

- **Soft Deletion Logic**  
  Only active entities (`isActive: true`) are displayed in the UI.

- **Manual Export Trigger**  
  Admin triggers the report export manually.  
  Status indicator shows the last successful update.

---

## 📥 Report Flow

1. Admin clicks "Export Reports"
2. Frontend calls `POST /export-to-sheets`
3. Backend:
   - Groups activities by week
   - Writes to Google Sheets (monthly + yearly)
   - Generates PDF buffers
   - Sends emails to each operator

---

## 🛡️ License Notice

**This project is proprietary and all rights are reserved.**  
You may **not copy, use, modify, or distribute** any part of this code without **explicit written permission** from the author.

📩 For inquiries, please contact: [amtamar747@gmail.com](mailto:amtamar747@gmail.com)
