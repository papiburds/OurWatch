// ─────────────────────────────────────────────────────────────────────────────
// UI-facing types. These intentionally stay flat and simple.
// The API routes map our relational tables (ACCOUNT / CITIZEN / BRGY_OFFICIAL /
// REPORT / UPDATEDREPORT) into these shapes so React components don't need
// to know about the underlying schema.
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "Citizen" | "Captain";

export interface AppUser {
  uid: string;            // Account_ID (stringified)
  fullName: string;       // CITIZEN.Full_name or BRGY_OFFICIAL.Official_name
  email: string;          // ACCOUNT.email
  role: UserRole;
  contactNumber?: string; // CITIZEN.Contact_Number (citizens only)
  address?: string;       // CITIZEN.Address or ACCOUNT.Address
  createdAt: string;
}

export type IncidentStatus = "Pending" | "Verified" | "Resolved" | "Rejected";

export interface Incident {
  id: string;           // REPORT.report_ID (stringified)
  userId: string;       // reporter's CITIZEN.Contact_Number
  reporterName: string; // CITIZEN.Full_name
  type: string;         // REPORT.type_of_report
  community: string;    // COMMUNITY.Area_Name (or free text)
  location: string;     // REPORT.Location
  description: string;  // REPORT.Description
  photoUrl?: string;    // REPORT.Photo_URL (Cloudinary)
  status: IncidentStatus; // UPDATEDREPORT.Status (defaults to "Pending")
  updateNote?: string;    // UPDATEDREPORT.Action_Taken
  createdAt: string;
  updatedAt: string;
}
