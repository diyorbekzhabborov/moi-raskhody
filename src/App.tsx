import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/Header';
import { BottomNav, type NavTab } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { TransactionsView } from './components/Transactions/TransactionsView';
import { SavingsView } from './components/Savings/SavingsView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { SettingsView } from './components/Settings/SettingsView';

// Modals
import { AddTransactionModal } from './components/AddTransactionModal';
import { EditTransactionModal } from './components/Transactions/EditTransactionModal';
import { DepositWithdrawModal } from './components/Savings/DepositWithdrawModal';
import { GoalModal } from './components/Savings/GoalModal';
import { CategoryModal } from './components/Settings/CategoryModal';
import { NotificationsModal } from './components/Notifications/NotificationsModal';
import { PwaPrompt } from './components/PwaPrompt';

import type { Transaction, Goal, Category, TransactionType } from './types';

const MainApp: React.FC = () => {
  const { isInitialized } = useFinance();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<TransactionType>('expense');

  const [selectedTxForEdit, setSelectedTxForEdit] = useState<Transaction | null>(null);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | undefined>(undefined);
  const [depositMode, setDepositMode] = useState<'deposit' | 'withdraw'>('deposit');

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalForEdit, setSelectedGoalForEdit] = useState<Goal | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<Category | null>(null);

  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Quick action openers
  const openAddTransaction = (type: TransactionType = 'expense') => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  const openDeposit = (goalId?: string) => {
    setDepositMode('deposit');
    setDepositGoalId(goalId);
    setIsDepositModalOpen(true);
  };

  const openWithdraw = (goalId?: string) => {
    setDepositMode('withdraw');
    setDepositGoalId(goalId);
    setIsDepositModalOpen(true);
  };

  const openCreateGoal = () => {
    setSelectedGoalForEdit(null);
    setIsGoalModalOpen(true);
  };

  const openEditGoal = (goal: Goal) => {
    setSelectedGoalForEdit(goal);
    setIsGoalModalOpen(true);
  };

  const openCategoryModal = (cat: Category | null) => {
    setSelectedCategoryForEdit(cat);
    setIsCategoryModalOpen(true);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Загрузка данных «Мои Расходы»...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={() => openAddTransaction('expense')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onNavigateToSettings={() => setCurrentTab('settings')}
        />

        {/* View Content (Scrollable) */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              onOpenAddModal={() => openAddTransaction('expense')}
              onOpenDepositModal={() => openDeposit()}
              onOpenEditGoal={() => {
                // open primary goal edit
                setSelectedGoalForEdit(null); // will be handled or default
                setIsGoalModalOpen(true);
              }}
              onNavigateToTab={setCurrentTab}
              onSelectTransaction={(tx) => setSelectedTxForEdit(tx)}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsView
              onSelectTransaction={(tx) => setSelectedTxForEdit(tx)}
              onOpenAddModal={() => openAddTransaction('expense')}
            />
          )}

          {currentTab === 'savings' && (
            <SavingsView
              onOpenDepositModal={openDeposit}
              onOpenWithdrawModal={openWithdraw}
              onOpenCreateGoal={openCreateGoal}
              onOpenEditGoal={openEditGoal}
            />
          )}

          {currentTab === 'analytics' && <AnalyticsView />}

          {currentTab === 'settings' && (
            <SettingsView onOpenCategoryModal={openCategoryModal} />
          )}
        </main>

        {/* Mobile Floating Bottom Bar */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenAddModal={() => openAddTransaction('expense')}
        />
      </div>

      {/* Modals & Dialogs */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultType={addModalType}
      />

      <EditTransactionModal
        isOpen={!!selectedTxForEdit}
        transaction={selectedTxForEdit}
        onClose={() => setSelectedTxForEdit(null)}
      />

      <DepositWithdrawModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        defaultMode={depositMode}
        preselectedGoalId={depositGoalId}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        goal={selectedGoalForEdit}
        onClose={() => setIsGoalModalOpen(false)}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        category={selectedCategoryForEdit}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />

      <PwaPrompt />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
