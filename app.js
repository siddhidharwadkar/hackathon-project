/**
 * FinPath Main Application Controller
 * Single-Page Application Router, Modal Controllers, Risk Profiler, AI Floating Chat & Theme Management
 */

import { store } from './state.js';
import { formatINR } from './charts.js';
import { renderDashboard } from './views/dashboard.js';
import { renderGoalsView } from './views/goals.js';
import { renderExpensesView } from './views/expenses.js';
import { renderPortfolioView } from './views/portfolio.js';
import { renderSimulatorView } from './views/simulator-view.js';
import { renderAIChatView } from './views/ai-chat-view.js';
import { renderRiskProfileView } from './views/risk-profile.js';
import { calculateFinancialHealth, processAIQuery } from './ai-engine.js';

let currentTab = 'dashboard';

// Init Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupNavigation();
  setupModals();
  setupGlobalActions();
  setupFloatingChat();

  // Subscribe state changes to re-render
  store.subscribe((state) => {
    renderCurrentView(state);
    updateNotificationBadge(state);
  });

  // Initial render
  renderCurrentView(store.getState());
  updateNotificationBadge(store.getState());
});

function initTheme() {
  const savedTheme = store.getState().user.theme || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store.setUser({ theme: next });
      updateThemeIcon(next);
      showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode 🌓`);
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    if (window.lucide) window.lucide.createIcons();
  }
}

function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      switchTab(target);
    });
  });

  // Delegated buttons from inner views
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-view-all-goals')) switchTab('goals');
    if (e.target.closest('#btn-view-all-expenses')) switchTab('expenses');
    if (e.target.closest('#btn-view-all-portfolio')) switchTab('portfolio');
    if (e.target.closest('#btn-dashboard-ask-ai')) switchTab('ai');
    if (e.target.closest('#btn-view-risk-profiler')) switchTab('risk');
  });
}

export function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-view').forEach(v => {
    v.classList.toggle('active', v.id === `view-${tabId}`);
  });

  renderCurrentView(store.getState());
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentView(state) {
  if (currentTab === 'dashboard') renderDashboard(state);
  else if (currentTab === 'goals') renderGoalsView(state);
  else if (currentTab === 'expenses') renderExpensesView(state);
  else if (currentTab === 'portfolio') renderPortfolioView(state);
  else if (currentTab === 'simulator') renderSimulatorView(state);
  else if (currentTab === 'ai') renderAIChatView(state);
  else if (currentTab === 'risk') renderRiskProfileView(state);

  if (window.lucide) window.lucide.createIcons();
}

function updateNotificationBadge(state) {
  const badge = document.getElementById('notification-badge');
  const count = state.goals.filter(g => g.savedAmount < g.targetAmount).length;
  if (badge) {
    badge.style.display = count > 0 ? 'block' : 'none';
  }
}

// Toast System
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" style="width: 18px; height: 18px; color: ${type === 'success' ? '#10b981' : '#6366f1'};"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global Modals Setup
function setupModals() {
  const modalOverlay = document.getElementById('modal-overlay');

  function openModal(title, bodyHTML, footerHTML) {
    document.getElementById('modal-title-text').textContent = title;
    document.getElementById('modal-body-content').innerHTML = bodyHTML;
    document.getElementById('modal-footer-content').innerHTML = footerHTML;
    modalOverlay.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
  }

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Modal actions
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-quick-goal-header') || e.target.closest('#btn-add-goal-main') || e.target.closest('#btn-add-goal-empty')) {
      openGoalModal();
    }

    if (e.target.closest('.quick-deposit-btn')) {
      const btn = e.target.closest('.quick-deposit-btn');
      openDepositModal(btn.dataset.goalId);
    }

    if (e.target.closest('.delete-goal-btn')) {
      const btn = e.target.closest('.delete-goal-btn');
      if (confirm('Are you sure you want to remove this financial goal?')) {
        store.deleteGoal(btn.dataset.goalId);
        showToast('Goal removed successfully', 'info');
      }
    }

    if (e.target.closest('#btn-add-expense-main')) {
      openExpenseModal();
    }

    if (e.target.closest('.delete-expense-btn')) {
      const btn = e.target.closest('.delete-expense-btn');
      store.deleteExpense(btn.dataset.expId);
      showToast('Expense record deleted', 'info');
    }

    if (e.target.closest('#btn-add-investment-main')) {
      openInvestmentModal();
    }

    if (e.target.closest('.delete-investment-btn')) {
      const btn = e.target.closest('.delete-investment-btn');
      store.deleteInvestment(btn.dataset.invId);
      showToast('Investment asset removed', 'info');
    }

    if (e.target.closest('#btn-update-income')) {
      openIncomeModal();
    }

    if (e.target.closest('#btn-print-audit-report')) {
      openAuditModal();
    }
  });

  function openGoalModal() {
    const body = `
      <form id="goal-form" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Goal Name</label>
          <input type="text" id="g-name" class="form-input" placeholder="e.g. MacBook Pro, Trip to Japan, House Downpayment" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="g-category" class="form-select">
              <option value="Electronics">💻 Electronics</option>
              <option value="Education">🎓 Education</option>
              <option value="House">🏠 House / Real Estate</option>
              <option value="Vehicle">🚗 Vehicle</option>
              <option value="Travel">✈️ Travel & Holiday</option>
              <option value="Emergency">💰 Emergency Fund</option>
              <option value="Investment">📈 Investment Corpus</option>
              <option value="Custom">✨ Custom Goal</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select id="g-priority" class="form-select">
              <option value="High">High 🔥</option>
              <option value="Medium" selected>Medium ⚡</option>
              <option value="Low">Low 🍃</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Target Amount (₹)</label>
            <input type="number" id="g-target" class="form-input" placeholder="80000" min="1000" required>
          </div>
          <div class="form-group">
            <label class="form-label">Already Saved (₹)</label>
            <input type="number" id="g-saved" class="form-input" placeholder="20000" min="0" value="0">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Deadline (in Months)</label>
          <input type="number" id="g-months" class="form-input" placeholder="12" min="1" max="360" value="12" required>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary btn-sm" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="modal-save-goal">Save Goal 🎯</button>
    `;

    openModal('🎯 Create New Financial Goal', body, footer);

    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save-goal').addEventListener('click', () => {
      const name = document.getElementById('g-name').value;
      const target = Number(document.getElementById('g-target').value);
      const saved = Number(document.getElementById('g-saved').value) || 0;
      const months = Number(document.getElementById('g-months').value) || 12;
      const category = document.getElementById('g-category').value;
      const priority = document.getElementById('g-priority').value;

      const icons = {
        Electronics: '💻', Education: '🎓', House: '🏠', Vehicle: '🚗',
        Travel: '✈️', Emergency: '💰', Investment: '📈', Custom: '✨'
      };

      if (!name || !target) {
        alert('Please fill in Goal Name and Target Amount');
        return;
      }

      store.addGoal({
        name,
        targetAmount: target,
        savedAmount: saved,
        deadlineMonths: months,
        category,
        priority,
        icon: icons[category] || '🎯'
      });

      closeModal();
      showToast(`Goal "${name}" added successfully! 🚀`, 'success');
    });
  }

  function openDepositModal(goalId) {
    const goal = store.getState().goals.find(g => g.id === goalId);
    if (!goal) return;

    const remaining = goal.targetAmount - goal.savedAmount;

    const body = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
          <span style="font-size: 1.6rem;">${goal.icon || '🎯'}</span>
          <div>
            <div style="font-weight: 700;">${escapeHTML(goal.name)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Current: ${formatINR(goal.savedAmount)} / ${formatINR(goal.targetAmount)} (Deficit: ${formatINR(remaining)})</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Deposit Amount (₹)</label>
          <input type="number" id="deposit-amount-input" class="form-input" placeholder="e.g. 5000" min="100" max="${remaining}" value="${Math.min(5000, remaining)}" autofocus>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="pill-btn deposit-quick-chip" data-amt="1000">+₹1,000</button>
          <button class="pill-btn deposit-quick-chip" data-amt="2500">+₹2,500</button>
          <button class="pill-btn deposit-quick-chip" data-amt="5000">+₹5,000</button>
          <button class="pill-btn deposit-quick-chip" data-amt="${remaining}">Full Deficit</button>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary btn-sm" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="modal-confirm-deposit">Confirm Deposit 💰</button>
    `;

    openModal(`Deposit to: ${goal.name}`, body, footer);

    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.querySelectorAll('.deposit-quick-chip').forEach(c => {
      c.addEventListener('click', () => {
        document.getElementById('deposit-amount-input').value = c.dataset.amt;
      });
    });

    document.getElementById('modal-confirm-deposit').addEventListener('click', () => {
      const amt = Number(document.getElementById('deposit-amount-input').value);
      if (!amt || amt <= 0) return;

      const updated = store.depositToGoal(goalId, amt);
      closeModal();
      showToast(`Deposited ${formatINR(amt)} to "${goal.name}"!`, 'success');

      // Trigger Confetti if goal achieved!
      if (updated && updated.savedAmount >= updated.targetAmount) {
        triggerConfetti();
        showToast(`🎉 CONGRATULATIONS! Goal "${goal.name}" has been 100% ACHIEVED!`, 'success');
      }
    });
  }

  function openExpenseModal() {
    const body = `
      <form id="exp-form" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Expense Description</label>
          <input type="text" id="e-name" class="form-input" placeholder="e.g. Swiggy food, Gym membership, Rent" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="e-category" class="form-select">
              <option value="Food">🍔 Food & Dining</option>
              <option value="Rent">🏠 Rent & Utilities</option>
              <option value="Transport">🚗 Transport & Fuel</option>
              <option value="Shopping">🛍️ Shopping & Apparel</option>
              <option value="Entertainment">🎬 Entertainment & OTT</option>
              <option value="Health">💊 Health & Fitness</option>
              <option value="Education">📚 Education & Books</option>
              <option value="Misc">📦 Miscellaneous</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">50-30-20 Classification</label>
            <select id="e-type" class="form-select">
              <option value="Needs">Essential Need (50%)</option>
              <option value="Wants">Lifestyle Want (30%)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Amount (₹)</label>
          <input type="number" id="e-amount" class="form-input" placeholder="2500" min="10" required>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary btn-sm" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="modal-save-expense">Log Expense 💸</button>
    `;

    openModal('💸 Log Monthly Expense', body, footer);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save-expense').addEventListener('click', () => {
      const name = document.getElementById('e-name').value;
      const amount = Number(document.getElementById('e-amount').value);
      const category = document.getElementById('e-category').value;
      const type = document.getElementById('e-type').value;

      if (!name || !amount) {
        alert('Please fill description and amount');
        return;
      }

      store.addExpense({ name, amount, category, type });
      closeModal();
      showToast(`Expense of ${formatINR(amount)} recorded`, 'info');
    });
  }

  function openInvestmentModal() {
    const body = `
      <form id="inv-form" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Asset / Fund Name</label>
          <input type="text" id="i-name" class="form-input" placeholder="e.g. Parag Parikh Flexi Cap, SBI FD, SGB Gold" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Asset Category</label>
            <select id="i-category" class="form-select">
              <option value="Mutual Funds">📈 Mutual Funds / SIP</option>
              <option value="Stocks">📊 Direct Stocks</option>
              <option value="Fixed Deposits">🏛️ Fixed Deposit (FD)</option>
              <option value="Gold">✨ Gold / SGB</option>
              <option value="PPF/EPF">🛡️ PPF / EPF / NPS</option>
              <option value="Liquid Cash">💵 Liquid Cash / Savings</option>
              <option value="Crypto">🪙 Crypto / Digital Assets</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Risk Profile</label>
            <select id="i-risk" class="form-select">
              <option value="Low">Low Risk</option>
              <option value="Moderate" selected>Moderate Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Current Value (₹)</label>
            <input type="number" id="i-amount" class="form-input" placeholder="50000" min="100" required>
          </div>
          <div class="form-group">
            <label class="form-label">Monthly SIP (₹)</label>
            <input type="number" id="i-sip" class="form-input" placeholder="2500" min="0" value="0">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Expected Annual Return (% CAGR)</label>
          <input type="number" id="i-rate" class="form-input" placeholder="12.5" min="0" max="100" step="0.1" value="12.0">
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary btn-sm" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="modal-save-inv">Add Investment 📈</button>
    `;

    openModal('📈 Add Investment Asset', body, footer);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save-inv').addEventListener('click', () => {
      const name = document.getElementById('i-name').value;
      const category = document.getElementById('i-category').value;
      const risk = document.getElementById('i-risk').value;
      const amount = Number(document.getElementById('i-amount').value);
      const monthlySip = Number(document.getElementById('i-sip').value) || 0;
      const returnRate = Number(document.getElementById('i-rate').value) || 10;

      if (!name || !amount) {
        alert('Please fill Asset Name and Current Value');
        return;
      }

      store.addInvestment({ name, category, risk, amount, monthlySip, returnRate });
      closeModal();
      showToast(`Added ${name} to consolidated portfolio!`, 'success');
    });
  }

  function openIncomeModal() {
    const currentIncome = store.getState().user.monthlyIncome;
    const body = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Monthly In-Hand Take-Home Income (₹)</label>
          <input type="number" id="user-income-input" class="form-input" value="${currentIncome}" min="5000" step="1000" required>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted);">
          Your monthly income dynamically benchmarks the 50-30-20 rule and savings rates across FinPath.
        </p>
      </div>
    `;
    const footer = `
      <button class="btn btn-secondary btn-sm" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="modal-save-income">Update Income</button>
    `;
    openModal('💼 Set Monthly Take-Home Income', body, footer);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save-income').addEventListener('click', () => {
      const val = Number(document.getElementById('user-income-input').value);
      if (val > 0) {
        store.setUser({ monthlyIncome: val });
        closeModal();
        showToast(`Monthly income updated to ${formatINR(val)}`, 'success');
      }
    });
  }

  function openAuditModal() {
    const s = store.getState();
    const h = calculateFinancialHealth(s);
    const totalInv = s.investments.reduce((sum, i) => sum + Number(i.amount), 0);

    const body = `
      <div id="printable-audit-content" style="display: flex; flex-direction: column; gap: 1.25rem; padding: 0.5rem; font-family: inherit;">
        <div style="text-align: center; border-bottom: 2px solid var(--border-color); padding-bottom: 1rem;">
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--brand-primary);">FinPath Financial Health Audit Report</h2>
          <div style="font-size: 0.85rem; color: var(--text-muted);">Generated for ${escapeHTML(s.user.name)} on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md);">
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">HEALTH SCORE</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--brand-primary);">${h.score} / 100 (${h.grade})</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">SAVINGS RATE</div>
            <div style="font-size: 1.5rem; font-weight: 800;">${h.savingsRate}% (${formatINR(h.monthlySavings)}/mo)</div>
          </div>
        </div>

        <div>
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem;">Key Executive Summary:</h4>
          <ul style="padding-left: 1.25rem; font-size: 0.85rem; line-height: 1.6; color: var(--text-secondary);">
            <li><strong>Monthly Inflow:</strong> ${formatINR(s.user.monthlyIncome)} | <strong>Monthly Outflow:</strong> ${formatINR(h.totalExpense)}</li>
            <li><strong>Total Consolidated Portfolio:</strong> ${formatINR(totalInv)} across ${s.investments.length} asset holdings.</li>
            <li><strong>Emergency Living Cushion:</strong> ${h.runwayMonths} months of essential expenses covered.</li>
            <li><strong>Active Milestones:</strong> ${s.goals.length} goals with ${formatINR(s.goals.reduce((a,b)=>a+b.savedAmount,0))} accumulated.</li>
          </ul>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary btn-sm" id="modal-cancel">Close</button>
      <button class="btn btn-primary btn-sm" id="modal-print-btn">
        <i data-lucide="printer" style="width: 14px; height: 14px;"></i> Print / Save as PDF
      </button>
    `;

    openModal('📑 Financial Health Audit Report', body, footer);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-print-btn').addEventListener('click', () => {
      window.print();
    });
  }
}

function setupGlobalActions() {
  const resetBtn = document.getElementById('btn-reset-demo');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset FinPath to default demo data?')) {
        store.resetToDemo();
        showToast('Demo data restored! 🎉', 'success');
      }
    });
  }

  const exportBtn = document.getElementById('btn-export-data');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.getState(), null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `finpath_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Financial data exported to JSON!', 'success');
    });
  }

  const notifBtn = document.getElementById('notification-btn');
  const notifDropdown = document.getElementById('notification-dropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.style.display = notifDropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      if (notifDropdown) notifDropdown.style.display = 'none';
    });
  }
}

/* Floating AI Chatbot Setup */
function setupFloatingChat() {
  const trigger = document.getElementById('floating-ai-trigger');
  const windowEl = document.getElementById('floating-ai-window');
  const closeBtn = document.getElementById('floating-ai-close');
  const form = document.getElementById('floating-chat-form');
  const input = document.getElementById('floating-chat-input');
  const msgBox = document.getElementById('floating-chat-messages');

  if (!trigger || !windowEl) return;

  trigger.addEventListener('click', () => {
    windowEl.classList.toggle('active');
    if (windowEl.classList.contains('active')) {
      setTimeout(() => input.focus(), 100);
      if (window.lucide) window.lucide.createIcons();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      windowEl.classList.remove('active');
    });
  }

  function handleFloatingSend(text) {
    if (!text.trim()) return;

    // User message
    const uDiv = document.createElement('div');
    uDiv.className = 'chat-msg user';
    uDiv.innerHTML = `<div class="chat-avatar">👤</div><div class="chat-bubble">${escapeHTML(text)}</div>`;
    msgBox.appendChild(uDiv);
    msgBox.scrollTop = msgBox.scrollHeight;

    // AI Response
    setTimeout(() => {
      const response = processAIQuery(text, store.getState());
      const aDiv = document.createElement('div');
      aDiv.className = 'chat-msg ai';
      aDiv.innerHTML = `<div class="chat-avatar">🤖</div><div class="chat-bubble">${formatMarkdown(response)}</div>`;
      msgBox.appendChild(aDiv);
      msgBox.scrollTop = msgBox.scrollHeight;
      if (window.lucide) window.lucide.createIcons();
    }, 300);
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value;
      input.value = '';
      handleFloatingSend(val);
    });
  }

  document.querySelectorAll('.floating-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleFloatingSend(btn.dataset.query);
    });
  });
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '&bull; ');
}

function triggerConfetti() {
  if (window.confetti) {
    window.confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
