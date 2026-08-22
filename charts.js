/**
 * FinPath Visual Analytics & Chart Engine
 * Built on Chart.js with dynamic theme switching and animated updates
 */

const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function getThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    textColor: isDark ? '#cbd5e1' : '#475569',
    mutedColor: isDark ? '#64748b' : '#94a3b8',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    tooltipBg: isDark ? '#1e293b' : '#ffffff',
    tooltipText: isDark ? '#f8fafc' : '#0f172a',
    tooltipBorder: isDark ? '#334155' : '#e2e8f0'
  };
}

export function formatINR(val) {
  return '₹' + Number(val || 0).toLocaleString('en-IN');
}

/**
 * 1. Expense Breakdown Donut Chart
 */
export function renderExpenseDonut(canvasId, expenses) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyChart(canvasId);
  const colors = getThemeColors();

  const categoryMap = {};
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
  });

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);

  if (labels.length === 0) {
    labels.push('No Expenses');
    data.push(1);
  }

  const palette = [
    '#10b981', '#6366f1', '#f59e0b', '#ec4899', 
    '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316'
  ];

  chartInstances[canvasId] = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: palette.slice(0, labels.length),
        borderWidth: 2,
        borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#131d31' : '#ffffff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: colors.textColor,
            font: { family: 'Plus Jakarta Sans', size: 12, weight: 500 },
            boxWidth: 12,
            padding: 14
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const val = context.raw;
              const pct = ((val / total) * 100).toFixed(1);
              return ` ${context.label}: ${formatINR(val)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * 2. 50-30-20 Rule Budget Health Chart
 */
export function renderBudgetHealthChart(canvasId, income, expenses) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyChart(canvasId);
  const colors = getThemeColors();

  let needs = 0;
  let wants = 0;

  expenses.forEach(e => {
    if (e.type === 'Needs') needs += Number(e.amount);
    else wants += Number(e.amount);
  });

  const totalExpense = needs + wants;
  const savings = Math.max(0, income - totalExpense);

  const labels = ['Needs (Target 50%)', 'Wants (Target 30%)', 'Savings (Target 20%)'];
  const data = [needs, wants, savings];

  chartInstances[canvasId] = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#3b82f6', '#ec4899', '#10b981'],
        borderWidth: 2,
        borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#131d31' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          callbacks: {
            label: function(context) {
              const pct = ((context.raw / income) * 100).toFixed(1);
              return ` ${context.label}: ${formatINR(context.raw)} (${pct}% of income)`;
            }
          }
        }
      }
    }
  });
}

/**
 * 3. Portfolio Asset Allocation Chart
 */
export function renderPortfolioDonut(canvasId, investments) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyChart(canvasId);
  const colors = getThemeColors();

  const categoryMap = {};
  investments.forEach(i => {
    categoryMap[i.category] = (categoryMap[i.category] || 0) + Number(i.amount);
  });

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);

  const palette = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6'];

  chartInstances[canvasId] = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: palette.slice(0, labels.length),
        borderWidth: 2,
        borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#131d31' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'right',
          labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 12 }, padding: 12 }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          callbacks: {
            label: function(c) {
              const total = c.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((c.raw / total) * 100).toFixed(1);
              return ` ${c.label}: ${formatINR(c.raw)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * 4. Simulator Wealth Growth Curve
 */
export function renderSimulatorGrowthChart(canvasId, monthlySaving, annualRate, months, targetGoal) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyChart(canvasId);
  const colors = getThemeColors();

  const monthlyRate = (annualRate / 100) / 12;
  const labels = [];
  const investedData = [];
  const wealthData = [];
  const targetLine = [];

  const step = Math.max(1, Math.floor(months / 12));
  let currentWealth = 0;

  for (let m = 0; m <= months; m += step) {
    labels.push(m === 0 ? 'Start' : `Month ${m}`);
    const totalInvested = monthlySaving * m;
    
    if (monthlyRate > 0 && m > 0) {
      currentWealth = monthlySaving * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate);
    } else {
      currentWealth = totalInvested;
    }

    investedData.push(Math.round(totalInvested));
    wealthData.push(Math.round(currentWealth));
    targetLine.push(targetGoal);
  }

  chartInstances[canvasId] = new window.Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Wealth with Compound Returns',
          data: wealthData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 3
        },
        {
          label: 'Your Total Monthly Savings',
          data: investedData,
          borderColor: '#6366f1',
          borderDash: [5, 5],
          tension: 0.1,
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: 'Target Goal Amount',
          data: targetLine,
          borderColor: '#f59e0b',
          borderDash: [3, 3],
          borderWidth: 1.5,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { color: colors.gridColor },
          ticks: { color: colors.mutedColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        y: {
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.mutedColor,
            font: { family: 'Plus Jakarta Sans', size: 11 },
            callback: v => '₹' + (v >= 100000 ? (v / 100000).toFixed(1) + 'L' : (v / 1000).toFixed(0) + 'k')
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 12 } }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          callbacks: {
            label: c => ` ${c.dataset.label}: ${formatINR(c.raw)}`
          }
        }
      }
    }
  });
}
