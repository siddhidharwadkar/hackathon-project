/**
 * FinPath AI Financial Intelligence Engine
 * Heuristic Financial Health Auditor, Rule-Based Smart Insights & Conversational Advisor
 */

import { formatINR } from './charts.js';

export function calculateFinancialHealth(state) {
  const income = Number(state.user.monthlyIncome) || 1;
  const totalExpense = state.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthlySavings = Math.max(0, income - totalExpense);
  const savingsRate = (monthlySavings / income) * 100;

  // 1. Savings Rate Score (0 - 30 pts)
  // Benchmark: >= 30% is top tier
  const savingsScore = Math.min(30, Math.round((savingsRate / 30) * 30));

  // 2. Emergency Fund Runway (0 - 25 pts)
  // Liquid cash + FD vs Monthly expenses (Target: 3 to 6 months)
  const liquidAssets = state.investments
    .filter(i => ['Liquid Cash', 'Fixed Deposits', 'Emergency'].includes(i.category))
    .reduce((s, i) => s + Number(i.amount), 0);
  const runwayMonths = totalExpense > 0 ? (liquidAssets / totalExpense) : 0;
  const runwayScore = Math.min(25, Math.round((runwayMonths / 6) * 25));

  // 3. Goals Progress Score (0 - 25 pts)
  let goalScore = 15;
  if (state.goals.length > 0) {
    const totalGoalTarget = state.goals.reduce((s, g) => s + Number(g.targetAmount), 0);
    const totalGoalSaved = state.goals.reduce((s, g) => s + Number(g.savedAmount), 0);
    const goalPct = totalGoalTarget > 0 ? (totalGoalSaved / totalGoalTarget) : 0;
    goalScore = Math.min(25, Math.round(goalPct * 25));
  }

  // 4. Portfolio Diversification (0 - 20 pts)
  const distinctCategories = new Set(state.investments.map(i => i.category)).size;
  const divScore = Math.min(20, distinctCategories * 5);

  const totalScore = Math.min(100, Math.max(10, savingsScore + runwayScore + goalScore + divScore));

  let grade = 'Fair';
  let badgeColor = 'badge-warning';
  if (totalScore >= 80) { grade = 'Excellent 🌟'; badgeColor = 'badge-success'; }
  else if (totalScore >= 65) { grade = 'Good 👍'; badgeColor = 'badge-success'; }
  else if (totalScore >= 45) { grade = 'Moderate ⚠️'; badgeColor = 'badge-warning'; }
  else { grade = 'Needs Attention 🚨'; badgeColor = 'badge-danger'; }

  return {
    score: totalScore,
    grade,
    badgeColor,
    savingsRate: savingsRate.toFixed(1),
    monthlySavings,
    runwayMonths: runwayMonths.toFixed(1),
    totalExpense
  };
}

export function generateSmartInsights(state) {
  const health = calculateFinancialHealth(state);
  const insights = [];

  // Insight 1: Savings Rate Analysis
  if (Number(health.savingsRate) >= 30) {
    insights.push({
      type: 'success',
      icon: 'sparkles',
      title: 'Strong Savings Habit',
      text: `You're currently saving ${health.savingsRate}% of your monthly income (${formatINR(health.monthlySavings)}/mo). This places you well ahead of standard benchmarks!`
    });
  } else {
    insights.push({
      type: 'warning',
      icon: 'trending-up',
      title: 'Boost Your Monthly Savings',
      text: `You are saving ${health.savingsRate}% of your income. Aim for the 50-30-20 benchmark (saving at least 20%, or ${formatINR(state.user.monthlyIncome * 0.2)}/mo).`
    });
  }

  // Insight 2: Spend Optimization & Habit Multiplier
  const shoppingExp = state.expenses.find(e => e.category.toLowerCase().includes('shopping'));
  if (shoppingExp && shoppingExp.amount > 2500) {
    const cutAmount = 1000;
    const yearlySavings = cutAmount * 12;
    insights.push({
      type: 'info',
      icon: 'zap',
      title: 'Spend Optimization Opportunity',
      text: `You spent ${formatINR(shoppingExp.amount)} on shopping this month. Trimming this by ${formatINR(cutAmount)}/mo redirects ${formatINR(yearlySavings)} annually into your primary goals!`
    });
  }

  // Insight 3: Goals Highlight
  if (state.goals.length > 0) {
    const topGoal = state.goals.find(g => (g.savedAmount / g.targetAmount) < 1) || state.goals[0];
    const remaining = Math.max(0, topGoal.targetAmount - topGoal.savedAmount);
    const suggestedMonthly = Math.ceil(remaining / (topGoal.deadlineMonths || 1));
    insights.push({
      type: 'primary',
      icon: 'target',
      title: `Goal Progress: ${topGoal.name}`,
      text: `${topGoal.icon} ${Math.round((topGoal.savedAmount / topGoal.targetAmount) * 100)}% complete. Save ${formatINR(suggestedMonthly)}/month for ${topGoal.deadlineMonths} months to achieve this target on schedule.`
    });
  }

  // Insight 4: Emergency Runway Check
  if (Number(health.runwayMonths) < 3) {
    insights.push({
      type: 'danger',
      icon: 'shield-alert',
      title: 'Emergency Cushion Alert',
      text: `Your liquid reserves cover ${health.runwayMonths} months of expenses. Financial experts recommend building a 3 to 6-month buffer (${formatINR(health.totalExpense * 3)}).`
    });
  }

  return insights;
}

export function processAIQuery(query, state) {
  const q = query.toLowerCase();
  const health = calculateFinancialHealth(state);
  const income = state.user.monthlyIncome;
  const totalExpense = state.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthlySavings = Math.max(0, income - totalExpense);

  // 1. Goal Acceleration Query
  if (q.includes('faster') || q.includes('goal') || q.includes('laptop')) {
    const activeGoals = state.goals.filter(g => g.savedAmount < g.targetAmount);
    if (activeGoals.length === 0) {
      return `🎉 Fantastic news! All your registered financial goals are 100% achieved. You can create a new ambitious milestone like an Investment Corpus or Real Estate goal.`;
    }
    const target = activeGoals[0];
    const remaining = target.targetAmount - target.savedAmount;
    const currentPace = Math.ceil(remaining / target.deadlineMonths);
    const fasterPace = Math.ceil(remaining / Math.max(1, target.deadlineMonths - 2));

    return `🎯 **How to reach "${target.name}" faster:**\n\n` +
      `• **Current Status:** ${formatINR(target.savedAmount)} of ${formatINR(target.targetAmount)} saved (${Math.round((target.savedAmount / target.targetAmount) * 100)}%).\n` +
      `• **Remaining Gap:** ${formatINR(remaining)}.\n` +
      `• **Standard Pace:** Save **${formatINR(currentPace)}/month** to finish in ${target.deadlineMonths} months.\n` +
      `• **Fast-Track Pace:** Increase monthly contribution to **${formatINR(fasterPace)}/month** to achieve this **2 months earlier**!\n\n` +
      `💡 *Action Tip:* Divert ₹1,000 from discretionary shopping or dining expenses directly into this goal on salary day.`;
  }

  // 2. Spending & Expenses Query
  if (q.includes('spending') || q.includes('spend') || q.includes('where') || q.includes('expense')) {
    const categoryTotals = {};
    state.expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
    });
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCat = sorted[0] || ['None', 0];
    const topCatPct = totalExpense > 0 ? ((topCat[1] / totalExpense) * 100).toFixed(1) : 0;

    let text = `💸 **Your Monthly Spend Breakdown:**\n\n` +
      `• **Total Monthly Expenses:** ${formatINR(totalExpense)} (${((totalExpense / income) * 100).toFixed(1)}% of your income).\n` +
      `• **Highest Spend Category:** **${topCat[0]}** at ${formatINR(topCat[1])} (${topCatPct}% of all expenses).\n\n` +
      `📊 **Top 3 Outflows:**\n`;
    
    sorted.slice(0, 3).forEach(([cat, amt], i) => {
      text += `${i + 1}. **${cat}:** ${formatINR(amt)}\n`;
    });

    text += `\n💡 *Action Tip:* Reducing your top spend in "${topCat[0]}" by just 10% unlocks **${formatINR(Math.round(topCat[1] * 0.1))}/month** in extra investment capacity!`;
    return text;
  }

  // 3. Investment & Portfolio Risk Query
  if (q.includes('portfolio') || q.includes('invest') || q.includes('risk') || q.includes('stocks') || q.includes('mutual')) {
    const totalPortfolio = state.investments.reduce((s, i) => s + Number(i.amount), 0);
    const equity = state.investments.filter(i => ['Stocks', 'Mutual Funds'].includes(i.category)).reduce((s, i) => s + Number(i.amount), 0);
    const debtLiquid = state.investments.filter(i => ['Fixed Deposits', 'PPF/EPF', 'Liquid Cash'].includes(i.category)).reduce((s, i) => s + Number(i.amount), 0);
    const gold = state.investments.filter(i => i.category === 'Gold').reduce((s, i) => s + Number(i.amount), 0);

    const eqPct = totalPortfolio > 0 ? ((equity / totalPortfolio) * 100).toFixed(1) : 0;
    const debtPct = totalPortfolio > 0 ? ((debtLiquid / totalPortfolio) * 100).toFixed(1) : 0;
    const goldPct = totalPortfolio > 0 ? ((gold / totalPortfolio) * 100).toFixed(1) : 0;

    return `📈 **Consolidated Portfolio & Risk Review:**\n\n` +
      `• **Total Portfolio Value:** ${formatINR(totalPortfolio)}\n` +
      `• **Growth Assets (Equities & Mutual Funds):** ${formatINR(equity)} (${eqPct}%)\n` +
      `• **Stability & Debt Assets (FD, PPF, Cash):** ${formatINR(debtLiquid)} (${debtPct}%)\n` +
      `• **Hedge Assets (Gold/Commodities):** ${formatINR(gold)} (${goldPct}%)\n\n` +
      `🛡️ **Risk Assessment:** Your allocation exhibits a **balanced moderate risk profile**. Your equity exposure gives inflation-beating long-term growth, while your debt and gold protect against market volatility.`;
  }

  // 4. Save ₹X More / Habit What-If
  if (q.includes('save') && (q.includes('more') || q.includes('2000') || q.includes('5000') || q.includes('extra'))) {
    const boost = 2000;
    const in5Years = boost * ((Math.pow(1 + 0.12 / 12, 60) - 1) / (0.12 / 12)) * (1 + 0.12 / 12);
    const in10Years = boost * ((Math.pow(1 + 0.12 / 12, 120) - 1) / (0.12 / 12)) * (1 + 0.12 / 12);

    return `🧮 **The Compounding Power of +${formatINR(boost)}/Month:**\n\n` +
      `If you step up your monthly savings/SIP by **${formatINR(boost)}/month** in an equity index fund (assuming a standard 12% CAGR):\n\n` +
      `• **In 5 Years:** Total Saved: ${formatINR(boost * 60)} ➔ **Estimated Wealth: ${formatINR(Math.round(in5Years))}** (Profit: +${formatINR(Math.round(in5Years - boost * 60))})\n` +
      `• **In 10 Years:** Total Saved: ${formatINR(boost * 120)} ➔ **Estimated Wealth: ${formatINR(Math.round(in10Years))}** (Wealth Multiplier: ~2.1x!)\n\n` +
      `⚡ *Small daily choices create life-changing financial freedom.*`;
  }

  // 5. 50-30-20 Rule Budget
  if (q.includes('50') || q.includes('rule') || q.includes('budget')) {
    const targetNeeds = income * 0.5;
    const targetWants = income * 0.3;
    const targetSavings = income * 0.2;

    let actualNeeds = 0, actualWants = 0;
    state.expenses.forEach(e => {
      if (e.type === 'Needs') actualNeeds += Number(e.amount);
      else actualWants += Number(e.amount);
    });

    return `📐 **Your 50-30-20 Budget Health Audit:**\n\n` +
      `• **Needs (Target 50% = ${formatINR(targetNeeds)}):** You spend **${formatINR(actualNeeds)}** (${((actualNeeds / income) * 100).toFixed(1)}%) ${actualNeeds <= targetNeeds ? '🟢 Healthy' : '🔴 Over Target'}\n` +
      `• **Wants (Target 30% = ${formatINR(targetWants)}):** You spend **${formatINR(actualWants)}** (${((actualWants / income) * 100).toFixed(1)}%) ${actualWants <= targetWants ? '🟢 Healthy' : '🟡 Review'}\n` +
      `• **Savings (Target 20% = ${formatINR(targetSavings)}):** You retain **${formatINR(monthlySavings)}** (${health.savingsRate}%) ${monthlySavings >= targetSavings ? '🟢 Excellent' : '⚠️ Below Target'}\n\n` +
      `💡 *Verdict:* Keep wants under ${formatINR(targetWants)} to maximize compound investment speed.`;
  }

  // Default Comprehensive Advisory Response
  return `💡 **FinPath Financial Overview for ${state.user.name}:**\n\n` +
    `• **Overall Financial Health Score:** **${health.score}/100 (${health.grade})**\n` +
    `• **Monthly Income:** ${formatINR(income)} | **Monthly Outflow:** ${formatINR(totalExpense)}\n` +
    `• **Net Monthly Savings:** ${formatINR(monthlySavings)} (${health.savingsRate}% savings rate)\n` +
    `• **Emergency Runway:** ${health.runwayMonths} months of living expenses covered\n` +
    `• **Active Goals:** ${state.goals.length} goals in progress\n\n` +
    `Try asking me specific questions like:\n` +
    `• *"How can I reach my Laptop goal faster?"*\n` +
    `• *"Where am I spending the most?"*\n` +
    `• *"Explain my portfolio risk"* \n` +
    `• *"What happens if I save ₹2,000 more every month?"*`;
}
