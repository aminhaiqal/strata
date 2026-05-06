import type { LucideIcon } from 'lucide-react'
import {
  BanknoteArrowDown,
  Building2,
  ChartColumnBig,
  ClipboardList,
  CreditCard,
  FileClock,
  Files,
  LayoutDashboard,
  Settings,
  WalletCards,
} from 'lucide-react'

export type AdminNavItem = {
  label: string
  to: string
  icon: LucideIcon
  description: string
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Collections',
    items: [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        description: 'Collection overview and priority actions.',
      },
      {
        label: 'Units',
        to: '/units',
        icon: Building2,
        description: 'Unit records, ownership, and occupancy.',
      },
      {
        label: 'Charges',
        to: '/charges',
        icon: WalletCards,
        description: 'Maintenance fees, sinking funds, and penalties.',
      },
      {
        label: 'Payments',
        to: '/payments',
        icon: CreditCard,
        description: 'Payment submissions, verification, and history.',
      },
      {
        label: 'Installment Plans',
        to: '/installment-plans',
        icon: BanknoteArrowDown,
        description: 'Repayment schedules and overdue plan tracking.',
      },
      {
        label: 'Follow-Ups',
        to: '/follow-ups',
        icon: ClipboardList,
        description: 'Collection actions, reminders, and debtor notes.',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Imports',
        to: '/imports',
        icon: Files,
        description: 'Spreadsheet imports and batch validation status.',
      },
      {
        label: 'Reports',
        to: '/reports',
        icon: ChartColumnBig,
        description: 'Arrears, collection, and verification reporting.',
      },
      {
        label: 'Audit Logs',
        to: '/audit-logs',
        icon: FileClock,
        description: 'Sensitive financial activity and change history.',
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Settings',
        to: '/settings',
        icon: Settings,
        description: 'Users, roles, and residence-level configuration.',
      },
    ],
  },
]
