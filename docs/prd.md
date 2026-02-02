# 🏫 Preschool Parent Portal – Final Requirements Document

---

## 1. Application Overview

### 1.1 Application Name

**Preschool Parent Portal**

### 1.2 Application Description

A secure web-based portal exclusively for parents of admitted preschool students to:

• Manage admissions
• Track fee payments
• View child profiles
• Access school events and announcements

This system is **completely separate** from the public enquiry website:
[https://awesome-kids.vercel.app/](https://awesome-kids.vercel.app/)

The public website must remain unchanged.

### 1.3 Target Users

Parents or guardians of children already admitted to the preschool.

---

## 2. Core Functional Requirements

---

### 2.1 Authentication System

• Login using Supabase Auth (email + password)
• One parent account may manage one or multiple children
• Protected routes
• Secure sessions

---

### 2.2 Parent Dashboard

After login, parents can see:

• Child name(s) and class
• Admission date
• Academic year
• Assigned teacher (if available)
• Fee payment summary

---

### 2.3 Admission Form (Portal Only)

Form must:

• Collect child personal details
• Collect parent + emergency contact info
• Record class and academic year
• Save to Supabase
• Set status = **Submitted**
• Trigger mandatory 50% initial payment requirement

---

### 2.4 Fee Payment System

#### Payment Rules:

• Total yearly fee stored by class
• 50% due immediately after admission submission
• Remaining 50% payable until **end of October**
• Installments allowed for remaining balance

#### Payment Tracking:

• Total fee
• Paid amount
• Remaining balance
• Full payment history

#### Payment Status Lifecycle:

• Pending Upload
• Under Verification
• Approved
• Rejected

Parents upload receipt screenshots.
Admin verifies payments.

---

### 2.5 Events & Activities

#### Upcoming Events:

• Name
• Date
• Description
• Optional photos

#### Past Events:

• Gallery-style layout
• Descriptions
• Event photos

Events categorized by date or type.

---

### 2.6 Announcements

• Notices
• Holidays
• Reminders
• Sorted by priority and date

---

### 2.7 File Storage

Supabase Storage used for:

• Payment receipts
• Event photos
• School documents

---

### 2.8 Admin Controls

Admins can:

• Approve/reject admissions
• Verify payments
• Manage events
• Post announcements
• View all data

---

## 3. Security Requirements

### 3.1 Data Access

• Supabase Row Level Security enabled
• Parents only access their own data
• Admin has full access

### 3.2 Authentication Safety

• Strong password policy
• Protected routes
• Env-based credentials
• No exposed keys

---

## 4. Database Structure

All tables include:

• created\_at
• updated\_at

### Required Tables:

• students
• admissions
• payments
• events
• announcements

With proper relationships.

---

## 5. Technical Stack

Frontend: React (Vite)
Backend: Supabase (Auth + Database + Storage)

• Production ready
• Clean architecture
• Mobile responsive

---

## 6. System Constraints

❌ Do NOT modify public website
❌ No enquiry system in portal
❌ Must enforce payment rules
❌ No credential leaks

---

## 7. Final Goal

A professional parent portal that enables:

✅ Admissions
✅ Fee management
✅ Events participation
✅ School communication

Used daily by parents.

---
