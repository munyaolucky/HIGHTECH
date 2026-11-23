import React from 'react';
import type { StudentPortalSection } from '../../../services/studentPortalService';
import StudentFeesDashboard, { type StudentFeesPageProps } from './pages/StudentFeesDashboard';
import FeeStatementPage from './pages/FeeStatementPage';
import FeePaymentPage from './pages/FeePaymentPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import ReceiptsPage from './pages/ReceiptsPage';
import FeeStructurePage from './pages/FeeStructurePage';
import PaymentPlansPage from './pages/PaymentPlansPage';
import FinancialClearancePage from './pages/FinancialClearancePage';
import RefundRequestsPage from './pages/RefundRequestsPage';

export type FeesRouteSection =
  | 'fees-overview'
  | 'fees-statement'
  | 'fees-pay'
  | 'fees-history'
  | 'fees-receipts'
  | 'fees-structure'
  | 'fees-plans'
  | 'fees-clearance'
  | 'fees-refunds';

export const STUDENT_FEES_ROUTE_META: {
  section: FeesRouteSection;
  label: string;
  path: string;
  matchPages?: StudentPortalSection[];
}[] = [
  {
    section: 'fees-overview',
    label: 'Fee Overview',
    matchPages: ['fees-overview', 'finance'],
    path: '/portal/student/fees',
  },
  {
    section: 'fees-statement',
    label: 'Fee Statement',
    path: '/portal/student/fees/statement',
  },
  {
    section: 'fees-pay',
    label: 'Pay Fees',
    path: '/portal/student/fees/pay',
  },
  {
    section: 'fees-history',
    label: 'Payment History',
    path: '/portal/student/fees/history',
  },
  {
    section: 'fees-receipts',
    label: 'Receipts',
    matchPages: ['fees-receipts', 'receipts'],
    path: '/portal/student/fees/receipts',
  },
  {
    section: 'fees-structure',
    label: 'Fee Structure',
    path: '/portal/student/fees/structure',
  },
  {
    section: 'fees-plans',
    label: 'Payment Plans',
    path: '/portal/student/fees/plans',
  },
  {
    section: 'fees-clearance',
    label: 'Financial Clearance',
    path: '/portal/student/fees/clearance',
  },
  {
    section: 'fees-refunds',
    label: 'Refund Requests',
    path: '/portal/student/fees/refunds',
  },
];

export function isStudentFeesSection(section: StudentPortalSection): boolean {
  return (
    section === 'finance' ||
    section === 'receipts' ||
    section.startsWith('fees-')
  );
}

export function StudentFeesRouteView({
  section,
  onNavigate,
  onNotify,
  onRefresh,
}: StudentFeesPageProps & { section: StudentPortalSection }) {
  switch (section) {
    case 'fees-statement':
      return <FeeStatementPage onNavigate={onNavigate} onNotify={onNotify} onRefresh={onRefresh} />;
    case 'fees-pay':
      return <FeePaymentPage onNavigate={onNavigate} onNotify={onNotify} onRefresh={onRefresh} />;
    case 'fees-history':
      return <PaymentHistoryPage onNavigate={onNavigate} onNotify={onNotify} onRefresh={onRefresh} />;
    case 'fees-receipts':
    case 'receipts':
      return <ReceiptsPage onNavigate={onNavigate} onNotify={onNotify} onRefresh={onRefresh} />;
    case 'fees-structure':
      return <FeeStructurePage onNavigate={onNavigate} onNotify={onNotify} onRefresh={onRefresh} />;
    case 'fees-plans':
      return <PaymentPlansPage onNavigate={onNavigate} onNotify={onNotify} onRefresh={onRefresh} />;
    case 'fees-clearance':
      return (
        <FinancialClearancePage onNavigate={onNavigate} onNotify={onNotify} onRefresh={onRefresh} />
      );
    case 'fees-refunds':
      return <RefundRequestsPage onNavigate={onNavigate} onNotify={onNotify} onRefresh={onRefresh} />;
    case 'fees-overview':
    case 'finance':
    default:
      return (
        <StudentFeesDashboard onNavigate={onNavigate} onNotify={onNotify} onRefresh={onRefresh} />
      );
  }
}
