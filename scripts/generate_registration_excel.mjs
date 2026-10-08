import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

// 12 Real Participant Registrations for DYNAMITE 2026
const rows = [
  {
    "Full Name": "Aditya Sharma",
    "Email Address": "aditya.sharma@cbit.ac.in",
    "WhatsApp Number": "9849011221",
    "College / Institution": "Chaitanya Bharathi Institute of Technology",
    "Registration ID": "REG-DYN-1001",
    "Pass Type": "VIP",
  },
  {
    "Full Name": "Sneha Reddy",
    "Email Address": "sneha.reddy@vnrvjiet.in",
    "WhatsApp Number": "+91 98490 22332",
    "College / Institution": "VNR Vignana Jyothi",
    "Registration ID": "REG-DYN-1002",
    "Pass Type": "ALL-ACCESS",
  },
  {
    "Full Name": "Mohammed Rizwan",
    "Email Address": "rizwan.m@osmania.ac.in",
    "WhatsApp Number": "09849033443",
    "College / Institution": "Osmania University College of Eng",
    "Registration ID": "REG-DYN-1003",
    "Pass Type": "HACKER",
  },
  {
    "Full Name": "Ananya Kulkarni",
    "Email Address": "ananya.k@hyderabad.bits-pilani.ac.in",
    "WhatsApp Number": "919849044554",
    "College / Institution": "BITS Pilani Hyderabad Campus",
    "Registration ID": "REG-DYN-1004",
    "Pass Type": "VIP",
  },
  {
    "Full Name": "Rohit Varma",
    "Email Address": "rohit.varma@iith.ac.in",
    "WhatsApp Number": "+919849055665",
    "College / Institution": "IIT Hyderabad",
    "Registration ID": "REG-DYN-1005",
    "Pass Type": "DELEGATE",
  },
  {
    "Full Name": "Divya Teja",
    "Email Address": "divya.t@vasavi.edu.in",
    "WhatsApp Number": "9849066776",
    "College / Institution": "Vasavi College of Engineering",
    "Registration ID": "REG-DYN-1006",
    "Pass Type": "STUDENT",
  },
  {
    "Full Name": "Kunal Deshmukh",
    "Email Address": "kunal.d@iiit.ac.in",
    "WhatsApp Number": "9849077887",
    "College / Institution": "IIIT Hyderabad",
    "Registration ID": "REG-DYN-1007",
    "Pass Type": "HACKER",
  },
  {
    "Full Name": "Pooja Hegde",
    "Email Address": "pooja.hegde@jntuh.ac.in",
    "WhatsApp Number": "+91 97000 88998",
    "College / Institution": "JNTU College of Engineering Hyderabad",
    "Registration ID": "REG-DYN-1008",
    "Pass Type": "ALL-ACCESS",
  },
  {
    "Full Name": "Siddharth Rao",
    "Email Address": "sid.rao@geethanjali.edu.in",
    "WhatsApp Number": "09700099009",
    "College / Institution": "Geethanjali College",
    "Registration ID": "REG-DYN-1009",
    "Pass Type": "STUDENT",
  },
  {
    "Full Name": "Tanvi Joshi",
    "Email Address": "tanvi.j@mahindrauniversity.edu.in",
    "WhatsApp Number": "9700012345",
    "College / Institution": "Mahindra University",
    "Registration ID": "REG-DYN-1010",
    "Pass Type": "VIP",
  },
  // Edge cases for verification:
  {
    "Full Name": "Duplicate Entry (Aditya)",
    "Email Address": "aditya.sharma@cbit.ac.in", // duplicate email
    "WhatsApp Number": "9849011221",
    "College / Institution": "CBIT",
    "Registration ID": "REG-DYN-1011",
    "Pass Type": "VIP",
  },
  {
    "Full Name": "Invalid Email User",
    "Email Address": "invalid-email-address", // malformed email
    "WhatsApp Number": "9849099999",
    "College / Institution": "Unknown",
    "Registration ID": "REG-DYN-1012",
    "Pass Type": "STUDENT",
  },
];

const worksheet = XLSX.utils.json_to_sheet(rows);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

const outDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const filePath = path.join(outDir, "dynamite2026_registrations.xlsx");
XLSX.writeFile(workbook, filePath);

console.log(`Real Excel registration file generated successfully: ${filePath}`);
console.log(`Total rows written: ${rows.length} (10 valid participants + 2 edge case rows)`);
