import React from 'react';
import { CapitalCard } from './CapitalCard';
import { GoalCard } from './GoalCard';
import { ForecastCard } from './ForecastCard';
import { AnalyticsOverview } from './AnalyticsOverview';
import { ExpensesMiniChart } from './ExpensesMiniChart';
import { RecentTransactions } from './RecentTransactions';
import type { Transaction } from '../../types';
import type { NavTab } from '../BottomNav';

interface DashboardViewProps {
  onOpenAddModal: () => void;
  onOpenDepositModal: () => void;
  onOpenEditGoal: () => void;
  onNavigateToTab: (tab: NavTab) => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddModal,
  onOpenDepositModal,
  onOpenEditGoal,
  onNavigateToTab,
  onSelectTransaction
}) => {
  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      {/* 1. Main Capital Card: Доступно сейчас, Накоплено, Общий капитал */}
      <CapitalCard
        onOpenAddModal={onOpenAddModal}
        onOpenDepositModal={onOpenDepositModal}
      />

      {/* 2. Main Goal Card: Цель 10 000 сомони */}
      <GoalCard
        onOpenDepositModal={onOpenDepositModal}
        onOpenEditGoal={onOpenEditGoal}
      />

      {/* 3. Planning & Safe Limits */}
      <ForecastCard
        onOpenPlanning={() => onNavigateToTab('savings')}
      />

      {/* 4. Analytics Summary: Доходы/Расходы/Чистый результат */}
      <AnalyticsOverview />

      {/* 5. Charts: Daily Expenses & Categories Breakdown */}
      <ExpensesMiniChart />

      {/* 6. Recent 5-10 Transactions */}
      <RecentTransactions
        onViewAll={() => onNavigateToTab('transactions')}
        onSelectTransaction={onSelectTransaction}
      />
    </div>
  );
};
