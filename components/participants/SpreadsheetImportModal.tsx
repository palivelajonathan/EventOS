"use client";

import React, { useState, useRef } from "react";
import {
  parseSpreadsheetData,
  autoMapColumns,
  validateAndNormalizeRows,
  EventOSField,
  ColumnMapping,
  ImportValidationResult,
  NormalizedRow,
  ValidationError,
} from "@/lib/import/spreadsheetParser";
import Papa from "papaparse";

interface SpreadsheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onImportComplete: () => void;
  getAuthHeaders: () => Record<string, string>;
}

export function SpreadsheetImportModal({
  isOpen,
  onClose,
  eventId,
  onImportComplete,
  getAuthHeaders,
}: SpreadsheetImportModalProps) {
  const [step, setStep] = useState<"UPLOAD" | "MAP_COLUMNS" | "PREVIEW_VALIDATE" | "SUMMARY">("UPLOAD");
  const [fileName, setFileName] = useState("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mappings, setMappings] = useState<Record<string, EventOSField>>({});
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [finalReport, setFinalReport] = useState<{
    imported: number;
    duplicates: number;
    failed: number;
    skipped: number;
    total: number;
    errors: ValidationError[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    try {
      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
      let data: ArrayBuffer | string;

      if (isExcel) {
        data = await file.arrayBuffer();
      } else {
        data = await file.text();
      }

      const { headers, rows } = parseSpreadsheetData(data, file.name);

      if (headers.length === 0 || rows.length === 0) {
        alert("The uploaded file contains no rows or readable headers.");
        return;
      }

      setRawHeaders(headers);
      setRawRows(rows);

      // Auto Map
      const autoMappings = autoMapColumns(headers);
      const initialMap: Record<string, EventOSField> = {};
      autoMappings.forEach((m) => {
        initialMap[m.rawColumn] = m.mappedField;
      });
      setMappings(initialMap);

      setStep("MAP_COLUMNS");
    } catch (err: any) {
      alert("Error reading file: " + err.message);
    }
  };

  // Change mapping
  const handleMappingChange = (rawCol: string, targetField: EventOSField) => {
    setMappings((prev) => ({
      ...prev,
      [rawCol]: targetField,
    }));
  };

  // Run validation
  const handleRunValidation = () => {
    const result = validateAndNormalizeRows(rawRows, mappings);
    setValidationResult(result);
    setStep("PREVIEW_VALIDATE");
  };

  // Proceed with Import
  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) {
      alert("No valid rows to import.");
      return;
    }

    setIsImporting(true);
    try {
      // Map valid rows to server format
      const payloadRows = validationResult.validRows.map((r) => ({
        full_name: r.fullName,
        email: r.email,
        phone: r.phone,
        raw_phone: r.rawPhone,
        college: r.college,
        external_registration_id: r.externalRegistrationId,
        tier: r.tier,
        roll_number: r.rollNumber,
        rawRowNumber: r.rawRowNumber,
      }));

      const res = await fetch("/api/participants/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          eventId,
          rows: payloadRows,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFinalReport({
          imported: json.imported || json.summary?.imported || 0,
          duplicates: json.duplicate || json.summary?.duplicates || 0,
          failed: json.failed || json.summary?.invalid || 0,
          skipped: json.skipped || json.summary?.skipped || 0,
          total: validationResult.totalRows,
          errors: [
            ...(validationResult.invalidRows || []),
            ...(validationResult.duplicateRows || []),
            ...(json.errors || []),
          ],
        });
        setStep("SUMMARY");
        onImportComplete();
      } else {
        alert(json.error || "Import failed on server.");
      }
    } catch (err: any) {
      alert("Network exception during import: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Export failed rows
  const exportFailedRows = () => {
    const errorsToExport = finalReport?.errors || validationResult?.invalidRows || [];
    if (errorsToExport.length === 0) {
      alert("No failed rows to export.");
      return;
    }

    const csvData = errorsToExport.map((e) => ({
      Row: e.row,
      Reason: e.reason,
      Field: e.field || "N/A",
      ...e.data,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `failed_registration_rows_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setStep("UPLOAD");
    setFileName("");
    setRawHeaders([]);
    setRawRows([]);
    setMappings({});
    setValidationResult(null);
    setFinalReport(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.12)] shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.08)] bg-[#131518]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#4cd7f6] text-xl">upload_file</span>
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                ATTENDEE INGESTION PIPELINE // {fileName || "NEW ROSTER"}
              </h3>
              <p className="text-xs text-[#8e909a] font-mono mt-0.5">
                Resilient CSV & XLSX ingestion with fuzzy column resolution & duplicate protection
              </p>
            </div>
          </div>
          <button
            onClick={resetAll}
            className="p-1.5 text-[#8e909a] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-4 border-b border-[rgba(255,255,255,0.06)] bg-[#101215] text-[11px] font-mono">
          <div
            className={`p-2.5 text-center border-r border-[rgba(255,255,255,0.06)] ${
              step === "UPLOAD" ? "bg-[#8083ff]/20 text-[#8083ff] font-bold" : "text-[#8e909a]"
            }`}
          >
            1. SELECT FILE
          </div>
          <div
            className={`p-2.5 text-center border-r border-[rgba(255,255,255,0.06)] ${
              step === "MAP_COLUMNS" ? "bg-[#4cd7f6]/20 text-[#4cd7f6] font-bold" : "text-[#8e909a]"
            }`}
          >
            2. MAP COLUMNS
          </div>
          <div
            className={`p-2.5 text-center border-r border-[rgba(255,255,255,0.06)] ${
              step === "PREVIEW_VALIDATE" ? "bg-[#00E5FF]/20 text-[#00E5FF] font-bold" : "text-[#8e909a]"
            }`}
          >
            3. AUDIT & PREVIEW
          </div>
          <div
            className={`p-2.5 text-center ${
              step === "SUMMARY" ? "bg-[#10b981]/20 text-[#10b981] font-bold" : "text-[#8e909a]"
            }`}
          >
            4. INGESTION REPORT
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: UPLOAD */}
          {step === "UPLOAD" && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-12 border-2 border-dashed border-[rgba(255,255,255,0.18)] hover:border-[#4cd7f6] rounded-2xl text-center cursor-pointer bg-[#14161a] transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-4xl text-[#4cd7f6] mb-3 block group-hover:scale-110 transition-transform">
                  cloud_upload
                </span>
                <span className="text-sm font-mono font-bold text-white block">
                  Click or drag registration spreadsheet (.CSV or .XLSX)
                </span>
                <span className="text-xs font-mono text-[#8e909a] block mt-1">
                  Works with Google Forms, Luma, Eventbrite, Excel sheets, and university registration exports
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#14161a] border border-[rgba(255,255,255,0.06)] space-y-2 text-xs font-mono text-[#8e909a]">
                <div className="text-white font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-sm">verified</span>
                  Automated Column Intelligence:
                </div>
                <p>
                  EventOS automatically recognizes columns regardless of naming conventions (e.g., &quot;Student Name&quot;, &quot;Full Name&quot;, &quot;Mobile No&quot;, &quot;College/Inst&quot;, &quot;Ticket Type&quot;). You can inspect and adjust every mapping before database insertion.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: MAP COLUMNS */}
          {step === "MAP_COLUMNS" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    COLUMN RESOLUTION HEURISTICS
                  </h4>
                  <p className="text-[11px] text-[#8e909a] font-mono mt-0.5">
                    Found {rawHeaders.length} columns and {rawRows.length} attendee records in {fileName}
                  </p>
                </div>
                <button
                  onClick={handleRunValidation}
                  className="px-4 py-2 bg-[#4cd7f6] hover:bg-[#38c5e4] text-[#0d1015] font-mono text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span>Audit & Preview Rows</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              {/* Mappings Table */}
              <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#14161a]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#101215] text-[#8e909a] uppercase text-[10px] tracking-wider border-b border-[rgba(255,255,255,0.06)]">
                    <tr>
                      <th className="p-3">Spreadsheet Column</th>
                      <th className="p-3">Sample Data (Row 1)</th>
                      <th className="p-3">EventOS Target Field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {rawHeaders.map((header) => {
                      const currentMapped = mappings[header] || "skip";
                      const sampleVal = String(rawRows[0]?.[header] || "");

                      return (
                        <tr key={header} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
                            <span>{header}</span>
                          </td>
                          <td className="p-3 text-[#8e909a] truncate max-w-xs">{sampleVal || "—"}</td>
                          <td className="p-3">
                            <select
                              value={currentMapped}
                              onChange={(e) => handleMappingChange(header, e.target.value as EventOSField)}
                              className="px-3 py-1.5 bg-[#1b1e24] text-white rounded-lg border border-[rgba(255,255,255,0.12)] focus:border-[#4cd7f6] outline-none text-xs font-mono"
                            >
                              <option value="full_name">Attendee Name (full_name) *</option>
                              <option value="email">Email Address (email) *</option>
                              <option value="phone">Phone / Mobile (phone)</option>
                              <option value="college">College / Institution (college)</option>
                              <option value="external_registration_id">Registration / Ticket ID</option>
                              <option value="tier">Pass Tier / Category</option>
                              <option value="roll_number">Roll / Student ID</option>
                              <option value="skip">— Ignore / Do Not Import —</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATE */}
          {step === "PREVIEW_VALIDATE" && validationResult && (
            <div className="space-y-5">
              {/* Metric Counter Banners */}
              <div className="grid grid-cols-5 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-[#1c2027] border border-[rgba(255,255,255,0.08)] text-center">
                  <div className="text-xl font-bold text-white">{validationResult.summary.total}</div>
                  <div className="text-[10px] text-[#8e909a] uppercase tracking-wider mt-0.5">Total Rows</div>
                </div>
                <div className="p-3 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-center text-[#10b981]">
                  <div className="text-xl font-bold">{validationResult.summary.valid}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5">Ready to Import</div>
                </div>
                <div className="p-3 rounded-xl bg-[#f59e0b]/15 border border-[#f59e0b]/30 text-center text-[#f59e0b]">
                  <div className="text-xl font-bold">{validationResult.summary.duplicates}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5">Duplicates</div>
                </div>
                <div className="p-3 rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/30 text-center text-[#ef4444]">
                  <div className="text-xl font-bold">{validationResult.summary.invalid}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5">Invalid</div>
                </div>
                <div className="p-3 rounded-xl bg-[#3b82f6]/15 border border-[#3b82f6]/30 text-center text-[#3b82f6]">
                  <div className="text-xl font-bold">{validationResult.summary.skipped}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5">Empty/Skipped</div>
                </div>
              </div>

              {/* Sample Preview of Normalized Records */}
              <div>
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-2">
                  PARSED ATTENDEE PREVIEW (FIRST 5 ROWS)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#14161a]">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[#101215] text-[#8e909a] uppercase text-[10px] tracking-wider border-b border-[rgba(255,255,255,0.06)]">
                      <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">College</th>
                        <th className="p-3">Reg ID</th>
                        <th className="p-3">Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                      {validationResult.validRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="p-3 text-white font-bold">{row.fullName}</td>
                          <td className="p-3 text-[#4cd7f6]">{row.email}</td>
                          <td className="p-3 text-[#8e909a]">{row.phone || "—"}</td>
                          <td className="p-3 text-[#8e909a]">{row.college}</td>
                          <td className="p-3 text-[#8083ff] font-bold">{row.externalRegistrationId || "AUTO"}</td>
                          <td className="p-3 text-white">{row.tier}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Validation Warning / Error List */}
              {(validationResult.invalidRows.length > 0 || validationResult.duplicateRows.length > 0) && (
                <div className="p-4 rounded-xl bg-[#241717] border border-[#ef4444]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ff8888] font-mono flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      EXCLUDED ROWS AUDIT (WILL NOT BE INSERTED)
                    </span>
                    <button
                      onClick={exportFailedRows}
                      className="px-2.5 py-1 bg-[#ef4444]/20 hover:bg-[#ef4444]/30 text-[#ff8888] rounded-lg text-[11px] font-mono transition-colors"
                    >
                      Export Excluded Rows (.csv)
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] font-mono text-[#ff8888]/80">
                    {[...validationResult.invalidRows, ...validationResult.duplicateRows].slice(0, 20).map((err, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-bold text-[#ff8888]">Row {err.row}:</span>
                        <span>{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SUMMARY REPORT */}
          {step === "SUMMARY" && finalReport && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
                  INGESTION SUCCESSFULLY EXECUTED
                </h3>
                <p className="text-xs text-[#8e909a] font-mono mt-1">
                  Imported attendees have been assigned unique EventOS passcodes and cryptographic QR credentials.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto font-mono text-xs">
                <div className="p-3 rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                  <div className="text-2xl font-bold">{finalReport.imported}</div>
                  <div className="text-[10px] uppercase mt-0.5">Imported</div>
                </div>
                <div className="p-3 rounded-xl bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
                  <div className="text-2xl font-bold">{finalReport.duplicates}</div>
                  <div className="text-[10px] uppercase mt-0.5">Duplicates</div>
                </div>
                <div className="p-3 rounded-xl bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30">
                  <div className="text-2xl font-bold">{finalReport.failed}</div>
                  <div className="text-[10px] uppercase mt-0.5">Failed</div>
                </div>
                <div className="p-3 rounded-xl bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30">
                  <div className="text-2xl font-bold">{finalReport.skipped}</div>
                  <div className="text-[10px] uppercase mt-0.5">Skipped</div>
                </div>
              </div>

              {finalReport.errors.length > 0 && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={exportFailedRows}
                    className="px-4 py-2 rounded-xl bg-[#282a30] hover:bg-[#33353b] text-white font-mono text-xs flex items-center gap-2 border border-[rgba(255,255,255,0.08)]"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export Failed / Excluded Rows (.csv)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-[rgba(255,255,255,0.08)] bg-[#131518]">
          <button
            onClick={resetAll}
            className="px-4 py-2 text-xs font-mono text-[#8e909a] hover:text-white transition-colors"
          >
            {step === "SUMMARY" ? "Close" : "Cancel"}
          </button>

          <div className="flex gap-2">
            {step === "MAP_COLUMNS" && (
              <button
                onClick={() => setStep("UPLOAD")}
                className="px-4 py-2 rounded-xl bg-[#282a30] hover:bg-[#33353b] text-white font-mono text-xs"
              >
                Back to File
              </button>
            )}

            {step === "PREVIEW_VALIDATE" && (
              <>
                <button
                  onClick={() => setStep("MAP_COLUMNS")}
                  className="px-4 py-2 rounded-xl bg-[#282a30] hover:bg-[#33353b] text-white font-mono text-xs"
                >
                  Back to Mappings
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={isImporting || !validationResult || validationResult.validRows.length === 0}
                  className="px-5 py-2 rounded-xl bg-[#4cd7f6] hover:bg-[#38c5e4] text-[#0d1015] font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#4cd7f6]/20 transition-all disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-sm">sync</span>
                      <span>Ingesting Ledger...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Import ({validationResult?.summary.valid || 0} Attendees)</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </>
            )}

            {step === "SUMMARY" && (
              <button
                onClick={resetAll}
                className="px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#0da472] text-black font-mono text-xs font-bold"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
