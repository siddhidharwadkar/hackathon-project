(function() {
  /* --- 1. STATE STORE --- */
  const STORAGE_KEY = 'FINPATH_APP_STATE_V1';
  const DEFAULT_STATE = {
    user: { name: 'Siddhi', monthlyIncome: 45000, currency: '₹', theme: 'dark' },
    goals: [
      { id: 'goal-1', name: 'MacBook Pro / Coding Laptop', category: 'Electronics', icon: '💻', targetAmount: 80000, savedAmount: 56000, deadlineMonths: 6, priority: 'High', createdAt: '2026-06-01' },
      { id: 'goal-2', name: 'Emergency Reserve Fund (6 Months)', category: 'Emergency', icon: '💰', targetAmount: 150000, savedAmount: 120000, deadlineMonths: 4, priority: 'High', createdAt: '2026-05-15' },
      { id: 'goal-3', name: 'Goa Friends Vacation', category: 'Travel', icon: '✈️', targetAmount: 25000, savedAmount: 18500, deadlineMonths: 2, priority: 'Low', createdAt: '2026-07-10' },
      { id: 'goal-4', name: 'AI & Cloud Certification Exam', category: 'Education', icon: '🎓', targetAmount: 35000, savedAmount: 15000, deadlineMonths: 5, priority: 'Medium', createdAt: '2026-06-20' },
      { id: 'goal-5', name: 'First House Downpayment', category: 'House', icon: '🏠', targetAmount: 800000, savedAmount: 250000, deadlineMonths: 36, priority: 'Medium', createdAt: '2026-01-01' }
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
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Fallback to default state');
      }
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch(e){}
      this.notify();
    }
    subscribe(fn) { this.listeners.push(fn); }
    notify() { this.listeners.forEach(fn => fn(this.state)); }
    getState() { return this.state; }
    setUser(u) { this.state.user = { ...this.state.user, ...u }; this.save(); }
    addGoal(g) {
      const item = { id: 'goal-' + Date.now(), createdAt: new Date().toISOString(), savedAmount: Number(g.savedAmount)||0, targetAmount: Number(g.targetAmount)||1000, deadlineMonths: Number(g.deadlineMonths)||12, ...g };
      this.state.goals.unshift(item);
      this.save();
      return item;
    }
    depositToGoal(id, amt) {
      const g = this.state.goals.find(x => x.id === id);
      if (g) {
        g.savedAmount = Math.min(g.targetAmount, Number(g.savedAmount) + Number(amt));
        this.save();
        return g;
      }
    }
    deleteGoal(id) { this.state.goals = this.state.goals.filter(x => x.id !== id); this.save(); }
    addExpense(e) {
      const item = { id: 'exp-' + Date.now(), date: new Date().toISOString().split('T')[0], amount: Number(e.amount)||0, ...e };
      this.state.expenses.unshift(item);
      this.save();
      return item;
    }
    deleteExpense(id) { this.state.expenses = this.state.expenses.filter(x => x.id !== id); this.save(); }
    addInvestment(i) {
      const item = { id: 'inv-' + Date.now(), amount: Number(i.amount)||0, monthlySip: Number(i.monthlySip)||0, returnRate: Number(i.returnRate)||8, ...i };
      this.state.investments.unshift(item);
      this.save();
      return item;
    }
    deleteInvestment(id) { this.state.investments = this.state.investments.filter(x => x.id !== id); this.save(); }
    resetToDemo() { this.state = JSON.parse(JSON.stringify(DEFAULT_STATE)); this.save(); }
  }

  const store = new StateManager();

  /* --- 2. FORMATTERS & HELPERS --- */
  function formatINR(val) { return '₹' + Number(val || 0).toLocaleString('en-IN'); }
  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function getTimeOfDayGreeting() {
    const hr = new Date().getHours();
    if (hr < 12) return 'morning';
    if (hr < 17) return 'afternoon';
    return 'evening';
  }
  /* --- 3. CHARTS CONTROLLER --- */
  const charts = {};
  function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
  }
  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      textColor: isDark ? '#cbd5e1' : '#475569',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      tooltipBg: isDark ? '#1e293b' : '#ffffff',
      tooltipText: isDark ? '#f8fafc' : '#0f172a'
    };
  }

  function renderExpenseDonut(canvasId, expenses) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || !window.Chart) return;
    destroyChart(canvasId);
    const colors = getThemeColors();
    const map = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    const labels = Object.keys(map);
    const data = Object.values(map);
    if (labels.length === 0) { labels.push('No Expenses'); data.push(1); }

    charts[canvasId] = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316'],
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#131d31' : '#ffffff'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: {
          legend: { position: 'right', labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 12 }, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: c => ` ${c.label}: ${formatINR(c.raw)} (${((c.raw / c.dataset.data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`
            }
          }
        }
      }
    });
  }

  function renderBudgetHealthChart(canvasId, income, expenses) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || !window.Chart) return;
    destroyChart(canvasId);
    const colors = getThemeColors();
    let needs = 0, wants = 0;
    expenses.forEach(e => { if (e.type === 'Needs') needs += Number(e.amount); else wants += Number(e.amount); });
    const savings = Math.max(0, income - (needs + wants));

    charts[canvasId] = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Needs (Target 50%)', 'Wants (Target 30%)', 'Savings (Target 20%)'],
        datasets: [{
          data: [needs, wants, savings],
          backgroundColor: ['#3b82f6', '#ec4899', '#10b981'],
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#131d31' : '#ffffff'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 11 } } },
          tooltip: {
            callbacks: { label: c => ` ${c.label}: ${formatINR(c.raw)} (${((c.raw/income)*100).toFixed(1)}% of income)` }
          }
        }
      }
    });
  }

  function renderPortfolioDonut(canvasId, investments) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || !window.Chart) return;
    destroyChart(canvasId);
    const colors = getThemeColors();
    const map = {};
    investments.forEach(i => { map[i.category] = (map[i.category] || 0) + Number(i.amount); });
    const labels = Object.keys(map);
    const data = Object.values(map);

    charts[canvasId] = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6'],
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#131d31' : '#ffffff'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: {
          legend: { position: 'right', labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 12 }, padding: 12 } },
          tooltip: {
            callbacks: { label: c => ` ${c.label}: ${formatINR(c.raw)} (${((c.raw / c.dataset.data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)` }
          }
        }
      }
    });
  }

  function renderSimulatorGrowthChart(canvasId, monthlySaving, annualRate, months, targetGoal) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || !window.Chart) return;
    destroyChart(canvasId);
    const colors = getThemeColors();
    const r = (annualRate / 100) / 12;
    const labels = [];
    const investedData = [];
    const wealthData = [];
    const targetLine = [];
    const step = Math.max(1, Math.floor(months / 12));

    for (let m = 0; m <= months; m += step) {
      labels.push(m === 0 ? 'Start' : `Month ${m}`);
      const totalInvested = monthlySaving * m;
      const currentWealth = (r > 0 && m > 0) ? (monthlySaving * ((Math.pow(1 + r, m) - 1) / r) * (1 + r)) : totalInvested;
      investedData.push(Math.round(totalInvested));
      wealthData.push(Math.round(currentWealth));
      targetLine.push(targetGoal);
    }

    charts[canvasId] = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Wealth with Compound Returns',
            data: wealthData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            tension: 0.35,
            borderWidth: 3
          },
          {
            label: 'Your Total Monthly Savings',
            data: investedData,
            borderColor: '#6366f1',
            borderDash: [5, 5],
            borderWidth: 2
          },
          {
            label: 'Target Goal Amount',
            data: targetLine,
            borderColor: '#f59e0b',
            borderDash: [3, 3],
            borderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor } },
          y: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor, callback: v => '₹' + (v >= 100000 ? (v/100000).toFixed(1)+'L' : (v/1000).toFixed(0)+'k') }
          }
        },
        plugins: {
          legend: { labels: { color: colors.textColor } },
          tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${formatINR(c.raw)}` } }
        }
      }
    });
  }

  /* --- 4. AI FINANCIAL HEALTH & ADVISOR ENGINE --- */
  function calculateFinancialHealth(state) {
    const income = Number(state.user.monthlyIncome) || 1;
    const totalExpense = state.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const monthlySavings = Math.max(0, income - totalExpense);
    const savingsRate = (monthlySavings / income) * 100;
    const savingsScore = Math.min(30, Math.round((savingsRate / 30) * 30));

    const liquidAssets = state.investments
      .filter(i => ['Liquid Cash', 'Fixed Deposits', 'Emergency'].includes(i.category))
      .reduce((s, i) => s + Number(i.amount), 0);
    const runwayMonths = totalExpense > 0 ? (liquidAssets / totalExpense) : 0;
    const runwayScore = Math.min(25, Math.round((runwayMonths / 6) * 25));

    let goalScore = 15;
    if (state.goals.length > 0) {
      const totalGoalTarget = state.goals.reduce((s, g) => s + Number(g.targetAmount), 0);
      const totalGoalSaved = state.goals.reduce((s, g) => s + Number(g.savedAmount), 0);
      goalScore = Math.min(25, Math.round((totalGoalSaved / (totalGoalTarget || 1)) * 25));
    }

    const distinctCategories = new Set(state.investments.map(i => i.category)).size;
    const divScore = Math.min(20, distinctCategories * 5);
    const totalScore = Math.min(100, Math.max(10, savingsScore + runwayScore + goalScore + divScore));

    let grade = 'Fair', badgeColor = 'badge-warning';
    if (totalScore >= 80) { grade = 'Excellent 🌟'; badgeColor = 'badge-success'; }
    else if (totalScore >= 65) { grade = 'Good 👍'; badgeColor = 'badge-success'; }
    else if (totalScore >= 45) { grade = 'Moderate ⚠️'; badgeColor = 'badge-warning'; }
    else { grade = 'Needs Attention 🚨'; badgeColor = 'badge-danger'; }

    return {
      score: totalScore, grade, badgeColor,
      savingsRate: savingsRate.toFixed(1),
      monthlySavings,
      runwayMonths: runwayMonths.toFixed(1),
      totalExpense
    };
  }

  function generateSmartInsights(state) {
    const h = calculateFinancialHealth(state);
    const insights = [];
    if (Number(h.savingsRate) >= 30) {
      insights.push({ title: 'Strong Savings Habit', text: `You're currently saving ${h.savingsRate}% of your income (${formatINR(h.monthlySavings)}/mo). Excellent discipline!` });
    } else {
      insights.push({ title: 'Boost Your Monthly Savings', text: `You are saving ${h.savingsRate}% of your income. Target the 50-30-20 benchmark (${formatINR(state.user.monthlyIncome * 0.2)}/mo).` });
    }
    const shopping = state.expenses.find(e => e.category.toLowerCase().includes('shopping'));
    if (shopping && shopping.amount > 2500) {
      insights.push({ title: 'Spend Optimization', text: `Trimming ${formatINR(shopping.amount)} shopping spend by ₹1,000/mo creates ${formatINR(12000)} yearly savings!` });
    }
    return insights;
  }

  function processAIQuery(query, state) {
    const q = query.toLowerCase();
    const h = calculateFinancialHealth(state);
    const income = state.user.monthlyIncome;
    const totalExpense = state.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const monthlySavings = Math.max(0, income - totalExpense);

    if (q.includes('faster') || q.includes('goal') || q.includes('laptop')) {
      const active = state.goals.filter(g => g.savedAmount < g.targetAmount)[0] || state.goals[0];
      if (!active) return `🎉 All your registered financial goals are 100% achieved!`;
      const rem = active.targetAmount - active.savedAmount;
      const currentPace = Math.ceil(rem / active.deadlineMonths);
      const fastPace = Math.ceil(rem / Math.max(1, active.deadlineMonths - 2));
      return `🎯 **Accelerating "${active.name}":**\n\n• **Saved:** ${formatINR(active.savedAmount)} / ${formatINR(active.targetAmount)} (${Math.round((active.savedAmount/active.targetAmount)*100)}%)\n• **Current Pace:** ${formatINR(currentPace)}/month for ${active.deadlineMonths} months\n• **Fast-Track Pace:** Save **${formatINR(fastPace)}/month** to achieve this **2 months earlier**!\n\n💡 *Action Tip:* Divert ₹1,000 from dining out into this goal on salary day.`;
    }

    if (q.includes('spend') || q.includes('where') || q.includes('expense')) {
      const catMap = {};
      state.expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount); });
      const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
      const top = sorted[0] || ['None', 0];
      return `💸 **Your Monthly Spend Audit:**\n\n• **Total Outflow:** ${formatINR(totalExpense)} (${((totalExpense/income)*100).toFixed(1)}% of income)\n• **Highest Category:** **${top[0]}** (${formatINR(top[1])})\n\n💡 *Action Tip:* Trimming ${top[0]} by 15% unlocks **${formatINR(Math.round(top[1]*0.15))}/month** for investments!`;
    }

    if (q.includes('portfolio') || q.includes('invest') || q.includes('risk')) {
      const tot = state.investments.reduce((s,i) => s + Number(i.amount), 0);
      return `📈 **Consolidated Portfolio Review:**\n\n• **Total Value:** ${formatINR(tot)} across ${state.investments.length} assets\n• **Diversification:** Good balance between growth equities and capital-preserving debt & gold.\n• **Recommendation:** Maintain an index SIP for inflation-beating long-term growth.`;
    }

    if (q.includes('save') && (q.includes('more') || q.includes('2000'))) {
      const boost = 2000;
      const in5Y = boost * ((Math.pow(1 + 0.12/12, 60) - 1) / (0.12/12)) * (1 + 0.12/12);
      return `🧮 **Power of Saving +₹2,000/Month:**\n\n• **In 5 Years:** Total Saved: ${formatINR(120000)} ➔ **Estimated Wealth: ${formatINR(Math.round(in5Y))}**\n• **Compounded Profit:** +${formatINR(Math.round(in5Y - 120000))}\n\n⚡ *Consistency beats market timing!*`;
    }

    return `💡 **FinPath Financial Diagnostic:**\n\n• **Health Score:** ${h.score}/100 (${h.grade})\n• **Savings Rate:** ${h.savingsRate}%\n• **Emergency Cushion:** ${h.runwayMonths} months covered\n\nFeel free to ask specific questions about your goals, expenses, or investment simulator!`;
  }
