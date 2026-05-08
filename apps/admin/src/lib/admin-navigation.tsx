import type { LucideIcon } from "lucide-react"
import {
  Building2Icon,
  FileBarChart2Icon,
  FolderSyncIcon,
  LayoutDashboardIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  WalletCardsIcon,
} from "lucide-react"

export type AdminNavChild = {
  title: string
  slug: string
  url: string
  description: string
  capabilities: string[]
}

export type AdminNavSection = {
  title: string
  slug: string
  url: string
  icon: LucideIcon
  badge: string
  description: string
  capabilities: string[]
  items?: AdminNavChild[]
}

export const adminNavigation: AdminNavSection[] = [
  {
    title: "Dashboard",
    slug: "dashboard",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
    badge: "All",
    description:
      "Monitor collection health across residences, overdue balances, pending actions, and recent payment submissions.",
    capabilities: [
      "Track overdue, never-paid, and on-installment unit counts.",
      "Review top debtor units and pending verification queues.",
      "Surface collection trends and follow-up workload.",
    ],
  },
  {
    title: "Residences",
    slug: "residences",
    url: "/dashboard/residences",
    icon: Building2Icon,
    badge: "Super",
    description:
      "Manage residence structure, from communities and blocks down to units and assigned administrators.",
    capabilities: [
      "Create and update residences with operational settings.",
      "Organize blocks and buildings under each residence.",
      "Maintain unit records and residence admin access.",
    ],
    items: [
      {
        title: "Residences",
        slug: "directory",
        url: "/dashboard/residences/directory",
        description:
          "Create residences, review their status, and keep community-level profile data accurate.",
        capabilities: [
          "Track name, address, timezone, and currency.",
          "Review residence status and billing cycle configuration.",
          "Prepare multi-residence operations for super admins.",
        ],
      },
      {
        title: "Blocks & buildings",
        slug: "blocks-buildings",
        url: "/dashboard/residences/blocks-buildings",
        description:
          "Define the physical structure inside each residence so units are grouped consistently.",
        capabilities: [
          "Create block and tower records.",
          "Store descriptions for building-level context.",
          "Support unit uniqueness within block and residence scope.",
        ],
      },
      {
        title: "Units",
        slug: "units",
        url: "/dashboard/residences/units",
        description:
          "Maintain the unit registry with owner, tenant, occupancy, and status information.",
        capabilities: [
          "Create and edit unit records.",
          "Capture owner and tenant contact details.",
          "Monitor occupancy and unit lifecycle status.",
        ],
      },
      {
        title: "Residence admins",
        slug: "admins",
        url: "/dashboard/residences/admins",
        description:
          "Assign administrative access to each residence and separate super admin from residence-level responsibilities.",
        capabilities: [
          "Manage residence admin assignments.",
          "Restrict system-level access to super admins.",
          "Review role coverage across communities.",
        ],
      },
    ],
  },
  {
    title: "Billing",
    slug: "billing",
    url: "/dashboard/billing",
    icon: ReceiptTextIcon,
    badge: "Ops",
    description:
      "Create and manage charges, opening balances, and monthly billing operations for each unit.",
    capabilities: [
      "Create one-off charges and recurring monthly billing.",
      "Manage charge statuses like pending, paid, waived, and overdue.",
      "Keep billing activity scoped to each residence.",
    ],
    items: [
      {
        title: "Charges",
        slug: "charges",
        url: "/dashboard/billing/charges",
        description:
          "Review and issue unit-level charges for maintenance fees, sinking funds, and penalties.",
        capabilities: [
          "Create individual charges.",
          "Inspect charge descriptions, due dates, and billing months.",
          "Monitor charge status transitions.",
        ],
      },
      {
        title: "Bulk monthly charges",
        slug: "bulk-monthly-charges",
        url: "/dashboard/billing/bulk-monthly-charges",
        description:
          "Run scheduled or manual bulk billing cycles across units in a residence.",
        capabilities: [
          "Generate monthly charges in bulk.",
          "Support recurring collection operations.",
          "Prepare billing batches for collection periods.",
        ],
      },
      {
        title: "Opening balances",
        slug: "opening-balances",
        url: "/dashboard/billing/opening-balances",
        description:
          "Capture legacy debt and imported balances before live operations begin.",
        capabilities: [
          "Import or record initial outstanding amounts.",
          "Support migration from spreadsheet-based workflows.",
          "Establish a clean starting point for balance calculations.",
        ],
      },
      {
        title: "Charge status tracking",
        slug: "charge-status-tracking",
        url: "/dashboard/billing/charge-status-tracking",
        description:
          "Audit how charges move through pending, paid, waived, cancelled, and overdue states.",
        capabilities: [
          "Inspect lifecycle changes per charge.",
          "Confirm waived and cancelled charges do not affect balances.",
          "Expose operational exceptions to admins.",
        ],
      },
    ],
  },
  {
    title: "Collections",
    slug: "collections",
    url: "/dashboard/collections",
    icon: WalletCardsIcon,
    badge: "Ops",
    description:
      "Manage payment submissions, verification workflows, and allocation of verified funds to charges.",
    capabilities: [
      "Verify or reject submitted payment proofs.",
      "Record manual payments for offline operations.",
      "Allocate verified payments without overstating balances.",
    ],
    items: [
      {
        title: "Pending verification",
        slug: "pending-verification",
        url: "/dashboard/collections/pending-verification",
        description:
          "Process submitted payment proofs that are awaiting admin review.",
        capabilities: [
          "Review reference numbers, methods, and receipts.",
          "Verify or reject submitted payments.",
          "Keep pending payments from reducing verified outstanding balance.",
        ],
      },
      {
        title: "Manual payments",
        slug: "manual-payments",
        url: "/dashboard/collections/manual-payments",
        description:
          "Record payments received outside self-service resident submission flows.",
        capabilities: [
          "Capture cashier or transfer-based payments.",
          "Attach payment dates and references.",
          "Support finance admin operational workflows.",
        ],
      },
      {
        title: "Payment allocations",
        slug: "payment-allocations",
        url: "/dashboard/collections/payment-allocations",
        description:
          "Allocate verified payments to one or more charges while enforcing allocation rules.",
        capabilities: [
          "Support one payment to many charges.",
          "Support many payments against a charge.",
          "Prevent over-allocation beyond payment amount or charge balance.",
        ],
      },
      {
        title: "Proof history",
        slug: "proof-history",
        url: "/dashboard/collections/proof-history",
        description:
          "Trace payment proof submissions, storage metadata, and verification outcomes.",
        capabilities: [
          "Review receipt metadata and upload provenance.",
          "Prepare signed access flows for stored receipts.",
          "Keep a history of submission outcomes.",
        ],
      },
    ],
  },
  {
    title: "Recovery",
    slug: "recovery",
    url: "/dashboard/recovery",
    icon: ShieldCheckIcon,
    badge: "Ops",
    description:
      "Coordinate installment plans, follow-up actions, classifications, and notes for overdue units.",
    capabilities: [
      "Track follow-up outcomes across overdue units.",
      "Create and monitor installment plans.",
      "Classify units by collection risk and payment behavior.",
    ],
    items: [
      {
        title: "Installment plans",
        slug: "installment-plans",
        url: "/dashboard/recovery/installment-plans",
        description:
          "Create and maintain repayment agreements and their installment schedules.",
        capabilities: [
          "Track active, completed, defaulted, and cancelled plans.",
          "Validate schedule totals against plan totals.",
          "Monitor installment due, paid, and remaining amounts.",
        ],
      },
      {
        title: "Follow-ups due",
        slug: "follow-ups-due",
        url: "/dashboard/recovery/follow-ups-due",
        description:
          "Work the queue of overdue units that require a phone call, message, notice, or escalation.",
        capabilities: [
          "Record next follow-up dates.",
          "Track status such as open, done, promised_to_pay, or escalated.",
          "Surface follow-up reminders for admin action.",
        ],
      },
      {
        title: "Debtor classifications",
        slug: "debtor-classifications",
        url: "/dashboard/recovery/debtor-classifications",
        description:
          "Review automatic classification outcomes such as recently overdue, legacy debtor, or never paid.",
        capabilities: [
          "Prioritize units based on classification rules.",
          "Support reclassification after payments or follow-ups.",
          "Expose under-review and irregular payment cases.",
        ],
      },
      {
        title: "Admin notes",
        slug: "admin-notes",
        url: "/dashboard/recovery/admin-notes",
        description:
          "Store internal context for units without exposing irrelevant notes to residents.",
        capabilities: [
          "Capture unit-level narrative context.",
          "Control visibility across internal, finance, and resident scopes.",
          "Support collection continuity between staff members.",
        ],
      },
    ],
  },
  {
    title: "Reports",
    slug: "reports",
    url: "/dashboard/reports",
    icon: FileBarChart2Icon,
    badge: "All",
    description:
      "Export the finance views administrators need to track arrears, collections, verification, and recovery performance.",
    capabilities: [
      "Produce arrears and collection summary reporting.",
      "Highlight verification workload and installment performance.",
      "Focus staff on long-overdue and never-paid populations.",
    ],
    items: [
      {
        title: "Arrears report",
        slug: "arrears-report",
        url: "/dashboard/reports/arrears-report",
        description:
          "Review the most important report for outstanding balances, oldest due dates, and debtor prioritization.",
        capabilities: [
          "Inspect unit-level outstanding balances.",
          "Review debtor categories and months overdue.",
          "Support collection prioritization decisions.",
        ],
      },
      {
        title: "Collection summary",
        slug: "collection-summary",
        url: "/dashboard/reports/collection-summary",
        description:
          "Track inflows, verified payments, pending submissions, and collection performance over time.",
        capabilities: [
          "Compare charged versus collected amounts.",
          "Monitor collection trend performance.",
          "Summarize recovery outcomes for operations.",
        ],
      },
      {
        title: "Verification report",
        slug: "verification-report",
        url: "/dashboard/reports/verification-report",
        description:
          "Measure the verification queue and the time it takes to clear resident payment submissions.",
        capabilities: [
          "Inspect pending and rejected proof volume.",
          "Measure average verification turnaround.",
          "Support finance admin workload planning.",
        ],
      },
      {
        title: "Never-paid units",
        slug: "never-paid-units",
        url: "/dashboard/reports/never-paid-units",
        description:
          "Surface units with charges but zero verified payments so collections teams can intervene early.",
        capabilities: [
          "Identify zero-payment units quickly.",
          "Target proactive recovery outreach.",
          "Track reduction of never-paid exposure over time.",
        ],
      },
    ],
  },
  {
    title: "Imports & Audit",
    slug: "imports-audit",
    url: "/dashboard/imports-audit",
    icon: FolderSyncIcon,
    badge: "Ops",
    description:
      "Bring spreadsheet data into the system safely and maintain an audit trail for every sensitive finance action.",
    capabilities: [
      "Validate imports before records are created.",
      "Audit high-risk financial and role-related actions.",
      "Support snapshot refresh and operational background jobs.",
    ],
    items: [
      {
        title: "Import center",
        slug: "import-center",
        url: "/dashboard/imports-audit/import-center",
        description:
          "Upload and validate CSV or spreadsheet data before confirming an import batch.",
        capabilities: [
          "Preview row validation issues.",
          "Support units, balances, payments, and charges imports.",
          "Confirm imports only after admin review.",
        ],
      },
      {
        title: "Import batches",
        slug: "import-batches",
        url: "/dashboard/imports-audit/import-batches",
        description:
          "Track import execution status, outcomes, and error resolution by batch.",
        capabilities: [
          "Review import history and batch status.",
          "Inspect row-level failures.",
          "Provide an audit-friendly import ledger.",
        ],
      },
      {
        title: "Audit trail",
        slug: "audit-trail",
        url: "/dashboard/imports-audit/audit-trail",
        description:
          "Trace charge, payment, installment, import, and role changes across the finance system.",
        capabilities: [
          "Inspect who changed what and when.",
          "Track verification, rejection, and allocation events.",
          "Preserve accountability for finance operations.",
        ],
      },
      {
        title: "Dashboard snapshots",
        slug: "dashboard-snapshots",
        url: "/dashboard/imports-audit/dashboard-snapshots",
        description:
          "Manage the computed snapshots that keep dashboard and collection views fast.",
        capabilities: [
          "Refresh snapshot data on financial events.",
          "Track snapshot fields like balances and classifications.",
          "Support reporting and dashboard performance.",
        ],
      },
    ],
  },
  {
    title: "Settings",
    slug: "settings",
    url: "/dashboard/settings",
    icon: Settings2Icon,
    badge: "Super",
    description:
      "Configure system-level and residence-level settings that control finance operations and access.",
    capabilities: [
      "Maintain residence profile and operational defaults.",
      "Define timezone, currency, and billing cycle settings.",
      "Control roles and administrator permissions.",
    ],
    items: [
      {
        title: "Residence profile",
        slug: "residence-profile",
        url: "/dashboard/settings/residence-profile",
        description:
          "Update base residence identity details that scope the rest of finance operations.",
        capabilities: [
          "Maintain residence name and address.",
          "Review active versus inactive residence state.",
          "Prepare communities for onboarding.",
        ],
      },
      {
        title: "Billing cycle",
        slug: "billing-cycle",
        url: "/dashboard/settings/billing-cycle",
        description:
          "Configure recurring billing timing so automated charge generation follows residence policy.",
        capabilities: [
          "Set billing cycle day.",
          "Align automated jobs with residence operations.",
          "Standardize monthly charge generation.",
        ],
      },
      {
        title: "Currency & timezone",
        slug: "currency-timezone",
        url: "/dashboard/settings/currency-timezone",
        description:
          "Control locale-sensitive defaults for due dates, timestamps, and finance display values.",
        capabilities: [
          "Set residence timezone.",
          "Set operational currency.",
          "Keep reporting and scheduling consistent.",
        ],
      },
      {
        title: "Roles & access",
        slug: "roles-access",
        url: "/dashboard/settings/roles-access",
        description:
          "Define role boundaries between super admins, residence admins, finance admins, and residents.",
        capabilities: [
          "Review permissions by role.",
          "Protect system settings from lower-privilege roles.",
          "Audit role changes over time.",
        ],
      },
    ],
  },
]

export function getAdminSection(sectionSlug: string) {
  return adminNavigation.find((section) => section.slug === sectionSlug)
}

export function getAdminSubsection(sectionSlug: string, subsectionSlug: string) {
  return getAdminSection(sectionSlug)?.items?.find(
    (item) => item.slug === subsectionSlug
  )
}

