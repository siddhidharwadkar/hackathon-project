/**
 * FinPath Reactive State Manager & Storage Engine
 * Handles Data Persistence, LocalStorage Sync, and Event Dispatching
 */

const STORAGE_KEY = 'FINPATH_APP_STATE_V1';

export const DEFAULT_STATE = {
  user: {
    name: 'Siddhi',
    monthlyIncome: 45000,
    currency: '₹',
    theme: 'dark'
  },
  goals: [
    {
      id: 'goal-1',
      name: 'MacBook Pro / Coding Laptop',
      category: 'Electronics',
      icon: '💻',
      targetAmount: 80000,
      savedAmount: 56000,
      deadlineMonths: 6,
      priority: 'High',
      createdAt: '2026-06-01'
    },
    {
      id: 'goal-2',
      name: 'Emergency Reserve Fund (6 Months)',
      category: 'Emergency',
      icon: '💰',
      targetAmount: 150000,
      savedAmount: 120000,
      deadlineMonths: 4,
      priority: 'High',
      createdAt: '2026-05-15'
    },
    {
      id: 'goal-3',
      name: 'Goa Friends Vacation',
      category: 'Travel',
      icon: '✈️',
      targetAmount: 25000,
      savedAmount: 18500,
      deadlineMonths: 2,
      priority: 'Low',
      createdAt: '2026-07-10'
    },
    {
      id: 'goal-4',
      name: 'AI & Cloud Certification Exam',
      category: 'Education',
      icon: '🎓',
      targetAmount: 35000,
      savedAmount: 15000,
      deadlineMonths: 5,
      priority: 'Medium',
      createdAt: '2026-06-20'
    },
    {
      id: 'goal-5',
      name: 'First House Downpayment',
      category: 'House',
      icon: '🏠',
      targetAmount: 800000,
      savedAmount: 250000,
      deadlineMonths: 36,
      priority: 'Medium',
      createdAt: '2026-01-01'
    }
  ],
  expenses: [
    { id: 'exp-1', name: 'Apartment Rent & Maintenance', amount: 8000, category: 'Rent', type: 'Needs', date: '2026-08-01' },
    { id: 'exp-2', name: 'Groceries & Daily Essentials', amount: 4500, category: 'Food', type: 'Needs', date: '2026-08-05' },
    { id: 'exp-3', name: 'Metro & Cab Commute', amount: 2000, category: 'Transport', type: 'Needs', date: '2026-08-10' },
    { id: 'exp-4', name: 'Online Shopping & Gadgets', amount: 4500, category: 'Shopping', type: 'Wants', date: '2026-08-12' },
    { id: 'exp-5', name: 'Dining Out & Swiggy', amount: 2200, category: 'Food', type: 'Wants', date: '2026-08-15' },
    { id: 'exp-6', name: 'OTT Subscriptions & Movies', amount: 1200, category: 'Entertainment', type: 'Wants', date: '2026-08-18' },
    { id: 'exp-7', name: 'Gym Membership & Supplements', amount: 1600, category: 'Health', type: 'Needs', date: '2026-08-02' }
  ],
  investments: [
    { id: 'inv-1', name: 'Nifty 50 Index Mutual Fund', category: 'Mutual Funds', amount: 65000, monthlySip: 5000, returnRate: 13.5, risk: 'Moderate' },
    { id: 'inv-2', name: 'Bluechip Equities (Tata, Infy)', category: 'Stocks', amount: 35000, monthlySip: 2000, returnRate: 15.0, risk: 'High' },
    { id: 'inv-3', name: 'Bank Fixed Deposit (FD)', category: 'Fixed Deposits', amount: 50000, monthlySip: 0, returnRate: 7.2, risk: 'Low' },
    { id: 'inv-4', name: 'Sovereign Gold Bond (SGB)', category: 'Gold', amount: 25000, monthlySip: 1000, returnRate: 9.5, risk: 'Low' },
    { id: 'inv-5', name: 'Public Provident Fund (PPF)', category: 'PPF/EPF', amount: 40000, monthlySip: 2500, returnRate: 8.1, risk: 'Low' },
    { id: 'inv-6', name: 'Liquid Savings in Bank', category: 'Liquid Cash', amount: 35000, monthlySip: 0, returnRate: 3.5, risk: 'Low' }
  ]
};

class StateManager {
  constructor() {
    this.listeners = [];
    this.state = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage, using default:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }

  getState() {
    return this.state;
  }

  // --- Actions ---

  setUser(userUpdates) {
    this.state.user = { ...this.state.user, ...userUpdates };
    this.save();
  }

  addGoal(goal) {
    const newGoal = {
      id: 'goal-' + Date.now(),
      createdAt: new Date().toISOString(),
      savedAmount: Number(goal.savedAmount) || 0,
      targetAmount: Number(goal.targetAmount) || 1000,
      deadlineMonths: Number(goal.deadlineMonths) || 12,
      ...goal
    };
    this.state.goals.unshift(newGoal);
    this.save();
    return newGoal;
  }

  updateGoal(id, updates) {
    const index = this.state.goals.findIndex(g => g.id === id);
    if (index !== -1) {
      this.state.goals[index] = { ...this.state.goals[index], ...updates };
      this.save();
    }
  }

  depositToGoal(id, amount) {
    const goal = this.state.goals.find(g => g.id === id);
    if (goal) {
      goal.savedAmount = Math.min(goal.targetAmount, Number(goal.savedAmount) + Number(amount));
      this.save();
      return goal;
    }
  }

  deleteGoal(id) {
    this.state.goals = this.state.goals.filter(g => g.id !== id);
    this.save();
  }

  addExpense(expense) {
    const newExp = {
      id: 'exp-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      amount: Number(expense.amount) || 0,
      ...expense
    };
    this.state.expenses.unshift(newExp);
    this.save();
    return newExp;
  }

  deleteExpense(id) {
    this.state.expenses = this.state.expenses.filter(e => e.id !== id);
    this.save();
  }

  addInvestment(inv) {
    const newInv = {
      id: 'inv-' + Date.now(),
      amount: Number(inv.amount) || 0,
      monthlySip: Number(inv.monthlySip) || 0,
      returnRate: Number(inv.returnRate) || 8.0,
      ...inv
    };
    this.state.investments.unshift(newInv);
    this.save();
    return newInv;
  }

  deleteInvestment(id) {
    this.state.investments = this.state.investments.filter(i => i.id !== id);
    this.save();
  }

  resetToDemo() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.save();
  }

  clearAll() {
    this.state = {
      user: { name: 'User', monthlyIncome: 30000, currency: '₹', theme: this.state.user.theme || 'dark' },
      goals: [],
      expenses: [],
      investments: []
    };
    this.save();
  }
}

export const store = new StateManager();
