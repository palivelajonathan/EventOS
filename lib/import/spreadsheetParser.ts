import Papa from "papaparse";
import * as XLSX from "xlsx";
import { normalizePhoneE164 } from "@/lib/utils/phone";

export type EventOSField =
  | "full_name"
  | "email"
  | "phone"
  | "college"
  | "external_registration_id"
  | "tier"
  | "roll_number"
  | "skip";

export interface ColumnMapping {
  rawColumn: string;
  mappedField: EventOSField;
  confidence: number;
}

export interface NormalizedRow {
  fullName: string;
  email: string;
  phone?: string;
  rawPhone?: string;
  college?: string;
  externalRegistrationId?: string;
  tier?: string;
  rollNumber?: string;
  rawRowNumber: number;
}

export interface ValidationError {
  row: number;
  data: Record<string, any>;
  reason: string;
  field?: string;
}

export interface ImportValidationResult {
  totalRows: number;
  validRows: NormalizedRow[];
  duplicateRows: ValidationError[];
  invalidRows: ValidationError[];
  skippedRows: ValidationError[];
  summary: {
    total: number;
    valid: number;
    duplicates: number;
    invalid: number;
    skipped: number;
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fuzzy auto-matcher for spreadsheet headers
 */
export function autoMapColumns(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];

  for (const h of headers) {
    const clean = h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    // 1. Name
    if (
      clean === "name" ||
      clean === "fullname" ||
      clean === "participantname" ||
      clean === "studentname" ||
      clean === "attendeename" ||
      clean.includes("fullname") ||
      clean.startsWith("name")
    ) {
      mappings.push({ rawColumn: h, mappedField: "full_name", confidence: 0.95 });
    }
    // 2. Email
    else if (
      clean === "email" ||
      clean === "emailid" ||
      clean === "emailaddress" ||
      clean === "mail" ||
      clean.includes("email")
    ) {
      mappings.push({ rawColumn: h, mappedField: "email", confidence: 0.98 });
    }
    // 3. Phone / Mobile / WhatsApp
    else if (
      clean === "phone" ||
      clean === "mobile" ||
      clean === "contact" ||
      clean === "phonenumber" ||
      clean === "mobilenumber" ||
      clean === "contactnumber" ||
      clean === "whatsapp" ||
      clean === "whatsappnumber" ||
      clean === "cell" ||
      clean.includes("phone") ||
      clean.includes("mobile") ||
      clean.includes("whatsapp")
    ) {
      mappings.push({ rawColumn: h, mappedField: "phone", confidence: 0.95 });
    }
    // 4. College / Institution
    else if (
      clean === "college" ||
      clean === "collegename" ||
      clean === "institution" ||
      clean === "university" ||
      clean === "campus" ||
      clean === "school" ||
      clean.includes("college") ||
      clean.includes("institution") ||
      clean.includes("university")
    ) {
      mappings.push({ rawColumn: h, mappedField: "college", confidence: 0.9 });
    }
    // 5. External Registration ID / Ticket ID / App ID
    else if (
      clean === "registrationid" ||
      clean === "regid" ||
      clean === "appid" ||
      clean === "applicationid" ||
      clean === "ticketid" ||
      clean === "bookingid" ||
      clean === "orderid" ||
      clean === "refno" ||
      clean.includes("registrationid") ||
      clean.includes("regno") ||
      clean.includes("ticketid") ||
      clean.includes("applicationid")
    ) {
      mappings.push({ rawColumn: h, mappedField: "external_registration_id", confidence: 0.92 });
    }
    // 6. Tier / Category / Pass Type
    else if (
      clean === "tier" ||
      clean === "category" ||
      clean === "passtype" ||
      clean === "tickettype" ||
      clean === "pass" ||
      clean.includes("tier") ||
      clean.includes("pass") ||
      clean.includes("category")
    ) {
      mappings.push({ rawColumn: h, mappedField: "tier", confidence: 0.88 });
    }
    // 7. Roll Number
    else if (clean === "rollnumber" || clean === "rollno" || clean === "htno" || clean === "hallticket") {
      mappings.push({ rawColumn: h, mappedField: "roll_number", confidence: 0.9 });
    }
    // Default Skip / Unmapped
    else {
      mappings.push({ rawColumn: h, mappedField: "skip", confidence: 0.1 });
    }
  }

  return mappings;
}

/**
 * Parses raw file buffer/content into rows (supports CSV and XLSX)
 */
export function parseSpreadsheetData(data: ArrayBuffer | string, fileName: string): { headers: string[]; rows: Record<string, any>[] } {
  const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

  if (isExcel && typeof data !== "string") {
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (jsonRows.length === 0) return { headers: [], rows: [] };
    const headers = Object.keys(jsonRows[0]);
    return { headers, rows: jsonRows };
  } else {
    // CSV Text parsing
    const textContent = typeof data === "string" ? data : new TextDecoder().decode(data);
    const parsed = Papa.parse(textContent, { header: true, skipEmptyLines: "greedy" });
    const headers = parsed.meta.fields || [];
    const rows = (parsed.data as Record<string, any>[]).filter((r) => Object.values(r).some((v) => String(v).trim().length > 0));
    return { headers, rows };
  }
}

/**
 * Validates and deduplicates rows according to custom mapping
 */
export function validateAndNormalizeRows(
  rows: Record<string, any>[],
  mappings: Record<string, EventOSField>
): ImportValidationResult {
  const validRows: NormalizedRow[] = [];
  const duplicateRows: ValidationError[] = [];
  const invalidRows: ValidationError[] = [];
  const skippedRows: ValidationError[] = [];

  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const seenRegIds = new Set<string>();

  rows.forEach((rawRow, idx) => {
    const rowNum = idx + 1;

    // Check if entire row is empty
    const values = Object.values(rawRow).map((v) => String(v || "").trim());
    if (values.every((v) => v.length === 0)) {
      skippedRows.push({ row: rowNum, data: rawRow, reason: "Completely empty row in spreadsheet." });
      return;
    }

    // Extract mapped fields
    let fullName = "";
    let email = "";
    let phone = "";
    let college = "";
    let externalRegistrationId = "";
    let tier = "GENERAL";
    let rollNumber = "";

    for (const [colName, mappedField] of Object.entries(mappings)) {
      const val = String(rawRow[colName] || "").trim();
      if (!val) continue;

      switch (mappedField) {
        case "full_name":
          fullName = val;
          break;
        case "email":
          email = val.toLowerCase();
          break;
        case "phone":
          phone = val.replace(/[^0-9+]/g, "");
          break;
        case "college":
          college = val;
          break;
        case "external_registration_id":
          externalRegistrationId = val;
          break;
        case "tier":
          tier = val.toUpperCase();
          break;
        case "roll_number":
          rollNumber = val;
          break;
      }
    }

    // Validation 1: Missing Name
    if (!fullName) {
      invalidRows.push({
        row: rowNum,
        data: rawRow,
        field: "full_name",
        reason: "Missing attendee name.",
      });
      return;
    }

    // Validation 2: Missing or Invalid Email
    if (!email) {
      invalidRows.push({
        row: rowNum,
        data: rawRow,
        field: "email",
        reason: "Missing email address.",
      });
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      invalidRows.push({
        row: rowNum,
        data: rawRow,
        field: "email",
        reason: `Malformed email format: "${email}".`,
      });
      return;
    }

    // Validation 3: Duplicate Email in Spreadsheet
    if (seenEmails.has(email)) {
      duplicateRows.push({
        row: rowNum,
        data: rawRow,
        field: "email",
        reason: `Duplicate email within spreadsheet: "${email}".`,
      });
      return;
    }
    seenEmails.add(email);

    // Validation 4: Phone Normalization and Duplicate Check
    let normalizedPhone: string | undefined = undefined;
    let rawPhoneVal: string | undefined = undefined;

    if (phone) {
      const phoneNorm = normalizePhoneE164(phone, "91");
      normalizedPhone = phoneNorm.isValid ? phoneNorm.normalized : phone;
      rawPhoneVal = phone;

      const dedupeKey = phoneNorm.isValid ? phoneNorm.normalized : phone.replace(/[^0-9]/g, "");
      if (dedupeKey && dedupeKey.length >= 7) {
        if (seenPhones.has(dedupeKey)) {
          duplicateRows.push({
            row: rowNum,
            data: rawRow,
            field: "phone",
            reason: `Duplicate phone number within spreadsheet: "${phone}".`,
          });
          return;
        }
        seenPhones.add(dedupeKey);
      }
    }

    // Validation 5: Duplicate External Registration ID if provided
    if (externalRegistrationId) {
      if (seenRegIds.has(externalRegistrationId)) {
        duplicateRows.push({
          row: rowNum,
          data: rawRow,
          field: "external_registration_id",
          reason: `Duplicate external registration ID: "${externalRegistrationId}".`,
        });
        return;
      }
      seenRegIds.add(externalRegistrationId);
    }

    // Valid Row
    validRows.push({
      fullName,
      email,
      phone: normalizedPhone,
      rawPhone: rawPhoneVal,
      college: college || "Unspecified Institution",
      externalRegistrationId: externalRegistrationId || undefined,
      tier: tier || "GENERAL",
      rollNumber: rollNumber || undefined,
      rawRowNumber: rowNum,
    });
  });

  return {
    totalRows: rows.length,
    validRows,
    duplicateRows,
    invalidRows,
    skippedRows,
    summary: {
      total: rows.length,
      valid: validRows.length,
      duplicates: duplicateRows.length,
      invalid: invalidRows.length,
      skipped: skippedRows.length,
    },
  };
}
