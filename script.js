const firebaseConfig = {
  apiKey: "AIzaSyApRobyjr1U9chPvmXD_bG8WQRLneVDzFo",
  authDomain: "bahi-19838.firebaseapp.com",
  projectId: "bahi-19838",
  storageBucket: "bahi-19838.appspot.com",
  messagingSenderId: "457522400365",
  appId: "1:457522400365:web:c85197e2de42ea96970364",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

document.addEventListener("DOMContentLoaded", () => {
  let allCustomers = { active: [], settled: [] };
  let currentUser = null;

  const authContainer = document.getElementById("auth-container");
  const adminDashboard = document.getElementById("admin-dashboard");
  const logoutBtns = [
    document.getElementById("logout-btn"),
    document.getElementById("logout-settings-btn"),
  ];
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const customersList = document.getElementById("customers-list");
  const recentCustomersList = document.getElementById("recent-customers-list");
  const settledCustomersList = document.getElementById(
    "settled-customers-list"
  );
  const searchInput = document.getElementById("search-customers");
  const sidebar = document.getElementById("sidebar");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const loginForm = document.getElementById("login-form");
  const detailsModal = document.getElementById("customer-details-modal");
  const customerFormModal = document.getElementById("customer-form-modal");
  const customerFormEl = document.getElementById("customer-form");
  const confirmationModal = document.getElementById("confirmation-modal");
  const interestForm = document.getElementById("interest-form");
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredCustomers = allCustomers.active.filter((customer) =>
      customer.name.toLowerCase().includes(searchTerm)
    );
    renderCustomerList(customersList, filteredCustomers, "active");
  });

  const showToast = (type, title, message) => {
    const toastContainer = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      warning: "fa-info-circle",
    };
    toast.innerHTML = `<i class="fas ${icons[type]} toast-icon"></i><div><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div><button class="toast-close">&times;</button>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 400);
    }, 5000);
    toast.querySelector(".toast-close").addEventListener("click", () => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 400);
    });
  };

  const toggleButtonLoading = (btn, isLoading, text) => {
    const spinner = btn.querySelector(".loading-spinner");
    const btnText = btn.querySelector("span:not(.loading-spinner)");
    if (!btnText) return;
    if (!btnText.dataset.originalText)
      btnText.dataset.originalText = btnText.textContent;
    const originalText = btnText.dataset.originalText;

    btn.disabled = isLoading;
    if (spinner) spinner.classList.toggle("hidden", !isLoading);
    if (btnText) btnText.textContent = isLoading ? text : originalText;
  };

  const formatCurrency = (amount) =>
    `₹${Math.round(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;

  const formatPhoneNumberForWhatsApp = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) return `91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned;
    return null;
  };

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const loginBtn = document.getElementById("login-btn");
    const loginError = document.getElementById("login-error");

    toggleButtonLoading(loginBtn, true, "Logging In...");
    loginError.textContent = "";

    try {
      await auth.signInWithEmailAndPassword(email, password);
      showToast("success", "Login Successful", "Welcome back!");
    } catch (error) {
      console.error("Login Error:", error);
      loginError.textContent = error.message;
      showToast("error", "Login Failed", error.message);
      toggleButtonLoading(loginBtn, false);
    }
  });

  const setTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    themeToggleBtn.innerHTML =
      theme === "dark"
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    darkModeToggle.checked = theme === "dark";
  };
  themeToggleBtn.addEventListener("click", () =>
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "light" : "dark"
    )
  );
  darkModeToggle.addEventListener("change", (e) =>
    setTheme(e.target.checked ? "dark" : "light")
  );

  const toggleSidebar = () => {
    sidebar.classList.toggle("show");
    sidebarOverlay.classList.toggle("show");
  };
  mobileMenuBtn.addEventListener("click", toggleSidebar);
  sidebarOverlay.addEventListener("click", toggleSidebar);

  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      document
        .querySelectorAll(".menu-item")
        .forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      const sectionId = `${item.dataset.section}-section`;
      document
        .querySelectorAll(".section-content")
        .forEach((s) => s.classList.remove("is-active"));
      document.getElementById(sectionId)?.classList.add("is-active");
      document.getElementById("section-title").textContent =
        item.querySelector("span").textContent;
      if (sidebar.classList.contains("show")) toggleSidebar();
    });
  });

  const calculateNetProfit = (customer) => {
    if (!customer.transactions || !Array.isArray(customer.transactions))
      return 0;
    const totalGiven = customer.transactions
      .filter((t) => t.type === "loan")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalReceived = customer.transactions
      .filter((t) => t.type === "payment")
      .reduce((sum, t) => sum + t.amount, 0);
    return totalReceived - totalGiven;
  };

  const calculateTotalInterest = (customer) => {
    const { lenderTotal, borrowerTotal } = calculateLedgers(customer);
    const totalPrincipalGiven = (customer.transactions || [])
      .filter((t) => t.type === "loan")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPrincipalReceived = (customer.transactions || [])
      .filter((t) => t.type === "payment")
      .reduce((sum, t) => sum + t.amount, 0);
    const netInterest =
      lenderTotal -
      totalPrincipalGiven -
      (borrowerTotal - totalPrincipalReceived);
    return netInterest;
  };

  const renderCustomerList = (
    listElement,
    customersToRender,
    listType = "default"
  ) => {
    listElement.innerHTML = "";
    if (customersToRender.length === 0) {
      listElement.innerHTML = `<li class="customer-item"><p>No customers found.</p></li>`;
      return;
    }
    const sortedCustomers = [...customersToRender].sort(
      (a, b) => b.createdAt.toDate() - a.createdAt.toDate()
    );
    sortedCustomers.forEach((customer) => {
      const li = document.createElement("li");
      li.className = "customer-item";
      if (customer.isSimpleInterest) {
        li.classList.add("is-monthly-payer");
      }
      li.dataset.id = customer.id;

      if (listType === "dashboard") {
        const totalGiven = (customer.transactions || [])
          .filter((t) => t.type === "loan")
          .reduce((sum, t) => sum + t.amount, 0);
        const { netBalanceDue } = calculateLedgers(customer);

        li.innerHTML = `
            <div class="customer-info">
                <div class="customer-name">
                    ${customer.name}
                    <span class="mobile-only-amount amount-given">${formatCurrency(
                      totalGiven
                    )}</span>
                </div>
                <div class="customer-details">
                    <span>${customer.phone || "No Phone"}</span>
                    <span class="mobile-only-amount amount-due">${formatCurrency(
                      netBalanceDue
                    )}</span>
                </div>
            </div>
            <div class="customer-actions">
                <div class="desktop-only-amounts">
                    <div class="amount-item">
                        <span class="label">Given</span>
                        <span class="amount-given">${formatCurrency(
                          totalGiven
                        )}</span>
                    </div>
                    <div class="amount-item">
                        <span class="label">Due</span>
                        <span class="amount-due">${formatCurrency(
                          netBalanceDue
                        )}</span>
                    </div>
                </div>
                <span class="view-details-prompt">View Details <i class="fas fa-arrow-right"></i></span>
            </div>`;
      } else {
        let extraInfoHtml = "";
        if (listType === "settled") {
          const profit = calculateNetProfit(customer);
          const profitClass = profit >= 0 ? "success" : "error";
          extraInfoHtml = `<span class="list-profit-display ${profitClass}">${formatCurrency(
            profit
          )}</span>`;
        }

        li.innerHTML = `
    <div class="customer-info">
        <div class="customer-name">${customer.name}</div>
        <div class="customer-details"><span>${
          customer.phone || "No Phone"
        }</span></div>
    </div>
    <div class="customer-actions">
        ${extraInfoHtml}
        <span class="view-details-prompt">View Details <i class="fas fa-arrow-right"></i></span>
        <span class="mobile-only-arrow"><i class="fas fa-chevron-right"></i></span>
    </div>`;
      }
      listElement.appendChild(li);
    });
  };

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const snapshots = await Promise.all([
        db
          .collection("customers")
          .where("owner", "==", currentUser.uid)
          .where("status", "==", "active")
          .orderBy("createdAt", "desc")
          .get(),
        db
          .collection("customers")
          .where("owner", "==", currentUser.uid)
          .where("status", "==", "settled")
          .orderBy("createdAt", "desc")
          .get(),
      ]);
      allCustomers.active = snapshots[0].docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      allCustomers.settled = snapshots[1].docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      renderCustomerList(customersList, allCustomers.active, "active");
      renderCustomerList(recentCustomersList, allCustomers.active, "dashboard");
      renderCustomerList(settledCustomersList, allCustomers.settled, "settled");
      updateDashboardStats();
    } catch (error) {
      console.error("Error loading customers:", error);
      showToast("error", "Load Failed", "Could not fetch customer data.");
    }
  };

  const calculateDuration = (d1, d2) => {
    let from = new Date(d1);
    let to = new Date(d2);
    let years = to.getFullYear() - from.getFullYear();
    let months = to.getMonth() - from.getMonth();
    let days = to.getDate() - from.getDate();
    if (days < 0) {
      months--;
      days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return { years, months, days };
  };

  const calculateInterest = (
    principal,
    rate,
    startDateStr,
    endDate,
    isSimpleInterest = false
  ) => {
    if (!principal || !rate || !startDateStr)
      return {
        principal,
        interest: 0,
        total: principal,
        duration: { years: 0, months: 0, days: 0 },
      };
    const startDate = new Date(startDateStr);
    const { years, months, days } = calculateDuration(startDate, endDate);

    if (isSimpleInterest) {
      const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      const interest = principal * (rate / 100 / 365) * totalDays;
      return {
        principal,
        interest,
        total: principal + interest,
        duration: { years, months, days },
      };
    }

    let amount = principal;
    for (let i = 0; i < years; i++) {
      amount += amount * (rate / 100);
    }
    const remainingDays = months * 30.417 + days;
    const simpleInterestOnCompoundedAmount =
      amount * (rate / 100 / 365) * remainingDays;
    amount += simpleInterestOnCompoundedAmount;
    return {
      principal,
      interest: amount - principal,
      total: amount,
      duration: { years, months, days },
    };
  };

  const calculateLedgers = (customer) => {
    const endDate = new Date();
    const transactions = (customer.transactions || []).map((tx) => {
      if (tx.type === "payment" && customer.isSimpleInterest) {
        return {
          ...tx,
          interest: 0,
          total: tx.amount,
          duration: { years: 0, months: 0, days: 0 },
        };
      }
      const calc = calculateInterest(
        tx.amount,
        tx.rate || customer.interestRate,
        tx.date,
        endDate,
        customer.isSimpleInterest
      );
      return { ...tx, ...calc };
    });

    const loans = transactions.filter((tx) => tx.type === "loan");
    const payments = transactions.filter((tx) => tx.type === "payment");

    const lenderTotal = loans.reduce((sum, tx) => sum + tx.total, 0);
    const borrowerTotal = payments.reduce((sum, tx) => sum + tx.total, 0);

    const netBalanceDue = lenderTotal - borrowerTotal;

    return { loans, payments, lenderTotal, borrowerTotal, netBalanceDue };
  };

  const adjustStatCardFontSize = (element) => {
    const textLength = element.textContent.length;
    let newSize = "1.875rem";
    if (textLength > 13) {
      newSize = "1.25rem";
    } else if (textLength > 10) {
      newSize = "1.5rem";
    } else if (textLength > 8) {
      newSize = "1.75rem";
    }
    element.style.fontSize = newSize;
  };

  const updateDashboardStats = () => {
    document.getElementById("total-customers").textContent =
      allCustomers.active.length + allCustomers.settled.length;

    let totalLoanGiven = 0;
    let netBalance = 0;
    let totalNetProfit = 0;

    allCustomers.active.forEach((customer) => {
      const { lenderTotal, borrowerTotal } = calculateLedgers(customer);
      if (customer.transactions && Array.isArray(customer.transactions)) {
        totalLoanGiven += customer.transactions
          .filter((t) => t.type === "loan")
          .reduce((sum, tx) => sum + tx.amount, 0);
      }
      netBalance += lenderTotal - borrowerTotal;
    });

    allCustomers.settled.forEach((customer) => {
      totalNetProfit += calculateNetProfit(customer);
    });

    const totalLoansEl = document.getElementById("total-loans");
    const netBalanceEl = document.getElementById("net-balance");
    const activeLoansEl = document.getElementById("active-loans");
    const netProfitEl = document.getElementById("net-profit-dashboard");

    totalLoansEl.textContent = formatCurrency(totalLoanGiven);
    netBalanceEl.textContent = formatCurrency(netBalance);
    activeLoansEl.textContent = allCustomers.active.length;
    netProfitEl.textContent = formatCurrency(totalNetProfit);

    adjustStatCardFontSize(totalLoansEl);
    adjustStatCardFontSize(netBalanceEl);
    adjustStatCardFontSize(netProfitEl);
  };

  const showCustomerDetails = (customerId, isReadOnly = false) => {
    const customer = [...allCustomers.active, ...allCustomers.settled].find(
      (c) => c.id === customerId
    );
    if (!customer) return;

    document.getElementById(
      "details-modal-title"
    ).textContent = `Ledger for ${customer.name}`;
    document.getElementById("transaction-customer-id").value = customer.id;
    document.getElementById("transaction-rate").value = customer.interestRate;

    const isSettled = customer.status === "settled";
    const canEdit = !isSettled && !isReadOnly;

    const editDetailsContainer = document.getElementById(
      "edit-details-container"
    );

    if (isReadOnly || isSettled) {
      editDetailsContainer.style.display = "none";
    } else {
      editDetailsContainer.style.display = "flex";
    }

    document.getElementById("transaction-form-container").style.display =
      canEdit ? "block" : "none";
    document.getElementById("active-account-summary").style.display =
      isSettled || isReadOnly ? "none" : "block";
    document
      .getElementById("settled-account-summary")
      .classList.toggle("hidden", !isSettled);

    const { loans, payments, lenderTotal, borrowerTotal, netBalanceDue } =
      calculateLedgers(customer);

    const formatMonthlyRate = (tx) => {
      const annualRate = tx.rate || customer.interestRate;
      const monthlyRate = annualRate / 12;
      const formattedRate = monthlyRate.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      return `${formattedRate}%`;
    };

    const lenderLedgerItems = document.getElementById("lender-ledger-items");
    lenderLedgerItems.innerHTML = "";
    loans
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((tx) => {
        lenderLedgerItems.innerHTML += `<div class="ledger-item">
                <div class="tx-details">
                  <div class="tx-description">Payment</div>
                  <span class="tx-date">${new Date(tx.date).toLocaleDateString(
                    "en-IN"
                  )}</span>
                </div>
                <div class="tx-monthly-rate">${formatMonthlyRate(tx)}</div>
                <div class="tx-amount-group">
                  <div>${formatCurrency(tx.amount)}</div>
                  <small class="tx-interest success">+ ${formatCurrency(
                    tx.interest
                  )}</small>
                </div>
                ${
                  canEdit
                    ? `<button class="delete-tx-btn" data-tx-id="${tx.id}" title="Delete Transaction"><i class="fas fa-times-circle"></i></button>`
                    : ""
                }
              </div>`;
      });

    const borrowerLedgerItems = document.getElementById(
      "borrower-ledger-items"
    );
    borrowerLedgerItems.innerHTML = "";
    payments
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((tx) => {
        const interestDisplay =
          customer.isSimpleInterest && tx.type === "payment"
            ? '<div class="tx-interest"></div>'
            : `<small class="tx-interest success">+ ${formatCurrency(
                tx.interest
              )}</small>`;

        borrowerLedgerItems.innerHTML += `<div class="ledger-item">
                <div class="tx-details">
                  <div class="tx-description">Payment</div>
                  <span class="tx-date">${new Date(tx.date).toLocaleDateString(
                    "en-IN"
                  )}</span>
                </div>
                 <div class="tx-monthly-rate">${formatMonthlyRate(tx)}</div>
                <div class="tx-amount-group">
                  <div>${formatCurrency(tx.amount)}</div>
                  ${interestDisplay}
                </div>
                ${
                  canEdit
                    ? `<button class="delete-tx-btn" data-tx-id="${tx.id}" title="Delete Transaction"><i class="fas fa-times-circle"></i></button>`
                    : ""
                }
              </div>`;
      });

    document.getElementById("lender-total").textContent =
      formatCurrency(lenderTotal);
    document.getElementById("borrower-total").textContent =
      formatCurrency(borrowerTotal);

    if (isSettled) {
      const totalGiven = (customer.transactions || [])
        .filter((t) => t.type === "loan")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalReceived = (customer.transactions || [])
        .filter((t) => t.type === "payment")
        .reduce((sum, t) => sum + t.amount, 0);
      const netProfit = totalReceived - totalGiven;

      const profitNetEl = document.getElementById("profit-net");
      const profitLossLabelEl = document.getElementById("profit-loss-label");
      const differenceSummaryEl = document.getElementById(
        "payment-difference-summary"
      );
      const shortfallAmountEl = document.getElementById("shortfall-amount");
      const ramBharoseEl = document.getElementById("ram-bharose-summary");

      document.getElementById("profit-total-given").textContent =
        formatCurrency(totalGiven);
      document.getElementById("profit-total-received").textContent =
        formatCurrency(totalReceived);
      profitNetEl.textContent = formatCurrency(netProfit);

      if (netProfit < 0) {
        profitNetEl.style.color = "var(--error)";
        profitLossLabelEl.textContent = "Net Loss:";
      } else {
        profitNetEl.style.color = "var(--success)";
        profitLossLabelEl.textContent = "Net Profit:";
      }

      const cashShortfall = totalGiven - totalReceived;
      if (cashShortfall > 0.01) {
        shortfallAmountEl.textContent = formatCurrency(cashShortfall);
        differenceSummaryEl.classList.remove("hidden");
      } else {
        differenceSummaryEl.classList.add("hidden");
      }

      const finalBalanceDifference = lenderTotal - borrowerTotal;
      ramBharoseEl.innerHTML = `Ram Bharose: <strong>${formatCurrency(
        finalBalanceDifference
      )}</strong>`;
      ramBharoseEl.classList.remove("hidden");

      document.getElementById("delete-account-btn").dataset.id = customer.id;
    } else if (!isReadOnly) {
      document.getElementById("edit-customer-btn").dataset.id = customer.id;
      document.getElementById("settle-account-btn").dataset.id = customer.id;
      document.getElementById("net-balance-due").textContent =
        formatCurrency(netBalanceDue);
    }

    detailsModal.classList.add("show");
  };

  const handleListClick = (e) => {
    const target = e.target.closest(".customer-item");
    if (target && target.dataset.id) {
      const isDashboardClick = e.currentTarget.id === "recent-customers-list";
      showCustomerDetails(target.dataset.id, isDashboardClick);
    }
  };
  [customersList, recentCustomersList, settledCustomersList].forEach((list) =>
    list.addEventListener("click", handleListClick)
  );

  document.getElementById("add-customer-btn").addEventListener("click", () => {
    customerFormEl.reset();
    document.getElementById("customer-id").value = "";
    document.getElementById("customer-form-modal-title").textContent =
      "Add New Customer";
    document.getElementById("is-simple-interest").checked = false;
    document.getElementById("loan-date").value = new Date()
      .toISOString()
      .split("T")[0];
    customerFormModal.classList.add("show");
  });

  document
    .getElementById("edit-customer-btn")
    .addEventListener("click", (e) => {
      const customerId = e.currentTarget.dataset.id;
      const customer = allCustomers.active.find((c) => c.id === customerId);
      if (!customer) return;

      const firstLoan = customer.transactions?.find((tx) => tx.type === "loan");

      document.getElementById("customer-id").value = customer.id;
      document.getElementById("customer-name").value = customer.name;
      document.getElementById("customer-phone").value = customer.phone || "";
      document.getElementById("loan-amount").value = firstLoan?.amount || 0;
      document.getElementById("interest-rate-modal").value =
        customer.interestRate;
      document.getElementById("is-simple-interest").checked =
        customer.isSimpleInterest || false;
      document.getElementById("loan-date").value = firstLoan?.date || "";
      document.getElementById("customer-form-modal-title").textContent =
        "Edit Customer Details";
      detailsModal.classList.remove("show");
      customerFormModal.classList.add("show");
    });

  customerFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("customer-id").value;
    const isEditing = !!id;
    const saveBtn = document.getElementById("customer-modal-save");
    toggleButtonLoading(saveBtn, true, isEditing ? "Updating..." : "Saving...");

    try {
      if (isEditing) {
        const customerRef = db.collection("customers").doc(id);
        const doc = await customerRef.get();
        if (!doc.exists) throw new Error("Customer not found");

        const customerData = doc.data();
        const firstLoanIndex = customerData.transactions.findIndex(
          (tx) => tx.type === "loan"
        );

        customerData.name = document.getElementById("customer-name").value;
        customerData.phone = document.getElementById("customer-phone").value;
        customerData.interestRate =
          parseFloat(document.getElementById("interest-rate-modal").value) || 0;
        customerData.isSimpleInterest =
          document.getElementById("is-simple-interest").checked;

        if (firstLoanIndex !== -1) {
          customerData.transactions[firstLoanIndex].amount =
            parseFloat(document.getElementById("loan-amount").value) || 0;
          customerData.transactions[firstLoanIndex].date =
            document.getElementById("loan-date").value;
          customerData.transactions[firstLoanIndex].rate =
            customerData.interestRate;
        }

        await customerRef.update(customerData);
        showToast("success", "Customer Updated", "Details saved.");
      } else {
        const customerData = {
          name: document.getElementById("customer-name").value,
          phone: document.getElementById("customer-phone").value,
          interestRate:
            parseFloat(document.getElementById("interest-rate-modal").value) ||
            0,
          isSimpleInterest:
            document.getElementById("is-simple-interest").checked,
          transactions: [
            {
              amount:
                parseFloat(document.getElementById("loan-amount").value) || 0,
              date: document.getElementById("loan-date").value,
              type: "loan",
              id: Date.now(),
              rate:
                parseFloat(
                  document.getElementById("interest-rate-modal").value
                ) || 0,
            },
          ],
          owner: currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          status: "active",
        };
        await db.collection("customers").add(customerData);
        showToast("success", "Customer Added", "New customer saved.");
      }
      customerFormModal.classList.remove("show");
      await loadData();
    } catch (error) {
      document.getElementById("customer-form-error").textContent =
        error.message;
    } finally {
      toggleButtonLoading(saveBtn, false);
    }
  });

  const showConfirmation = (title, message, onConfirm) => {
    confirmationModal.querySelector("#confirmation-title").textContent = title;
    confirmationModal.querySelector("#confirmation-message").textContent =
      message;
    confirmationModal.classList.add("show");
    const confirmBtn = confirmationModal.querySelector(
      "#confirmation-confirm-btn"
    );
    const cancelBtn = confirmationModal.querySelector(
      "#confirmation-cancel-btn"
    );
    const confirmHandler = () => {
      onConfirm();
      confirmationModal.classList.remove("show");
      cleanup();
    };
    const cancelHandler = () => {
      confirmationModal.classList.remove("show");
      cleanup();
    };
    const cleanup = () => {
      confirmBtn.removeEventListener("click", confirmHandler);
      cancelBtn.removeEventListener("click", cancelHandler);
    };
    confirmBtn.addEventListener("click", confirmHandler);
    cancelBtn.addEventListener("click", cancelHandler);
  };

  detailsModal.addEventListener("click", (e) => {
    const whatsappBtn = e.target.closest("#whatsapp-btn");
    const deleteTxBtn = e.target.closest(".delete-tx-btn");

    if (whatsappBtn) {
      const customerId = document.getElementById(
        "transaction-customer-id"
      ).value;
      const customer = [...allCustomers.active, ...allCustomers.settled].find(
        (c) => c.id === customerId
      );
      if (!customer) {
        showToast("error", "Error", "Could not find customer data.");
        return;
      }

      const formattedPhone = formatPhoneNumberForWhatsApp(customer.phone);
      if (!formattedPhone) {
        showToast(
          "error",
          "Invalid Phone",
          "Customer does not have a valid 10-digit phone number."
        );
        return;
      }

      toggleButtonLoading(whatsappBtn, true, "Preparing PDF...");

      populatePdfTemplate(customer);

      const elementToPrint = document.getElementById("invoice");
      const dateStr = new Date()
        .toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-");
      const options = {
        margin: 0,
        filename: `${customer.name}_Ledger_${dateStr}.pdf`,
        image: { type: "jpeg", quality: 1.0 },
        html2canvas: {
          scale: 4,
          dpi: 300,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      html2pdf()
        .from(elementToPrint)
        .set(options)
        .toPdf()
        .get("pdf")
        .then(function (pdf) {
          const totalPages = pdf.internal.getNumberOfPages();
          const rbiLogoUrl = "images/rbi_watermark.png";
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setGState(new pdf.GState({ opacity: 0.05 }));

            const pageHeight = pdf.internal.pageSize.getHeight();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const logoSizeInMM = 132;

            pdf.addImage(
              rbiLogoUrl,
              "PNG",
              (pageWidth - logoSizeInMM) / 2,
              (pageHeight - logoSizeInMM) / 2,
              logoSizeInMM,
              logoSizeInMM
            );

            pdf.setGState(new pdf.GState({ opacity: 1 }));
          }
        })
        .save()
        .then(function () {
          toggleButtonLoading(whatsappBtn, false, "Send on WhatsApp");
          showToast(
            "success",
            "PDF Generated",
            "Your PDF has been downloaded."
          );

          const text = encodeURIComponent(
            `Hello ${customer.name}, find your attached ledger statement here.`
          );
          const whatsappUrl = `https://wa.me/${formattedPhone}?text=${text}`;
          window.open(whatsappUrl, "_blank");
        })
        .catch((err) => {
          showToast("error", "PDF Error", "Could not generate the PDF file.");
          console.error(err);
          toggleButtonLoading(whatsappBtn, false);
        });
    }
    if (deleteTxBtn) {
      const transactionId = Number(deleteTxBtn.dataset.txId);
      const customerId = document.getElementById(
        "transaction-customer-id"
      ).value;

      if (!transactionId || !customerId) {
        showToast(
          "error",
          "Error",
          "Could not identify transaction or customer."
        );
        return;
      }

      showConfirmation(
        "Delete Transaction?",
        "Are you sure you want to permanently delete this transaction record? This action cannot be undone.",
        async () => {
          try {
            const customerRef = db.collection("customers").doc(customerId);
            const doc = await customerRef.get();
            if (!doc.exists) throw new Error("Customer not found.");

            const customerData = doc.data();
            const updatedTransactions = customerData.transactions.filter(
              (tx) => tx.id !== transactionId
            );

            await customerRef.update({ transactions: updatedTransactions });

            showToast(
              "success",
              "Deleted",
              "The transaction has been removed."
            );
            await loadData();
            showCustomerDetails(customerId);
          } catch (error) {
            showToast("error", "Delete Failed", error.message);
            console.error("Error deleting transaction:", error);
          }
        }
      );
    }
  });

  const populatePdfTemplate = (customer) => {
    const { loans, payments, lenderTotal, borrowerTotal, netBalanceDue } =
      calculateLedgers(customer);

    document.getElementById("pdf-tpl-customer-name").textContent =
      customer.name;
    document.getElementById("pdf-tpl-generation-date").textContent =
      new Date().toLocaleDateString("en-IN");

    const now = new Date();
    const timestamp = `Generated: ${now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} at ${now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`;
    document.getElementById("pdf-tpl-timestamp").textContent = timestamp;

    const formatMonthlyRate = (tx) => {
      const annualRate = tx.rate || customer.interestRate;
      const monthlyRate = annualRate / 12;
      return (
        monthlyRate.toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }) + "%"
      );
    };

    const lenderTbody = document.querySelector("#pdf-tpl-lender-table tbody");
    lenderTbody.innerHTML = "";
    loans
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((tx) => {
        const row = `
            <tr>
                <td>${new Date(tx.date).toLocaleDateString("en-IN")}</td>
                <td>Payment Given</td>
                <td>${formatMonthlyRate(tx)}</td>
                <td class="text-right">${formatCurrency(tx.amount)}</td>
                <td class="text-right">${formatCurrency(tx.interest)}</td>
                <td class="text-right">${formatCurrency(tx.total)}</td>
            </tr>
        `;
        lenderTbody.innerHTML += row;
      });

    const borrowerTable = document.getElementById("pdf-tpl-borrower-table");
    const noBorrowerPaymentsMsg = document.getElementById(
      "pdf-no-borrower-payments"
    );

    if (payments.length === 0) {
      borrowerTable.classList.add("hidden");
      noBorrowerPaymentsMsg.classList.remove("hidden");
    } else {
      borrowerTable.classList.remove("hidden");
      noBorrowerPaymentsMsg.classList.add("hidden");
      const borrowerTbody = borrowerTable.querySelector("tbody");
      borrowerTbody.innerHTML = "";
      payments
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach((tx) => {
          const interestDisplay =
            customer.isSimpleInterest && tx.type === "payment"
              ? formatCurrency(0)
              : formatCurrency(tx.interest);
          const row = `
              <tr>
                  <td>${new Date(tx.date).toLocaleDateString("en-IN")}</td>
                  <td>Payment Received</td>
                  <td>${formatMonthlyRate(tx)}</td>
                  <td class="text-right">${formatCurrency(tx.amount)}</td>
                  <td class="text-right">${interestDisplay}</td>
                  <td class="text-right">${formatCurrency(tx.total)}</td>
              </tr>
          `;
          borrowerTbody.innerHTML += row;
        });
    }

    const summaryContainer = document.getElementById("pdf-tpl-summary");
    const stamp = document.getElementById("pdf-tpl-stamp");
    stamp.className = "stamp-image hidden";

    if (customer.status === "settled") {
      const totalGiven = (customer.transactions || [])
        .filter((t) => t.type === "loan")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalReceived = (customer.transactions || [])
        .filter((t) => t.type === "payment")
        .reduce((sum, t) => sum + t.amount, 0);
      const netProfit = totalReceived - totalGiven;
      const profitLossLabel = netProfit >= 0 ? "Net Profit" : "Net Loss";

      summaryContainer.innerHTML = `
            <table>
                <tr><td class="summary-label">Total Amount Given:</td><td class="text-right">${formatCurrency(
                  totalGiven
                )}</td></tr>
                <tr><td class="summary-label">Total Amount Received:</td><td class="text-right">${formatCurrency(
                  totalReceived
                )}</td></tr>
                <tr class="summary-total"><td class="summary-label">${profitLossLabel}:</td><td class="text-right">${formatCurrency(
        netProfit
      )}</td></tr>
            </table>`;
      stamp.textContent = "SETTLED";
      stamp.classList.remove("hidden", "stamp-paid");
      stamp.classList.add("stamp-settled");
    } else {
      summaryContainer.innerHTML = `
            <table>
                <tr><td class="summary-label">Total Given (with Interest):</td><td class="text-right">${formatCurrency(
                  lenderTotal
                )}</td></tr>
                <tr><td class="summary-label">Total Received (with Interest):</td><td class="text-right">${formatCurrency(
                  borrowerTotal
                )}</td></tr>
                <tr class="summary-total"><td class="summary-label">Final Net Amount Due:</td><td class="text-right">${formatCurrency(
                  netBalanceDue
                )}</td></tr>
            </table>`;
      if (netBalanceDue <= 0) {
        stamp.textContent = "PAID";
        stamp.classList.remove("hidden", "stamp-settled");
        stamp.classList.add("stamp-paid");
      }
    }

    const issueDate = new Date();
    const referenceId = `KPS/LEGAL/${customer.name
      .substring(0, 3)
      .toUpperCase()}/${issueDate.getFullYear()}${String(
      issueDate.getMonth() + 1
    ).padStart(2, "0")}`;

    document.getElementById("pdf-tpl-reference-id").textContent = referenceId;
    document.getElementById("pdf-tpl-issue-date").textContent =
      issueDate.toLocaleDateString("en-IN");

    const legalInfoUrl = "https://www.mha.gov.in/en/acts";

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      legalInfoUrl
    )}`;

    document.getElementById("pdf-tpl-qr-code").src = qrCodeUrl;
  };
  document
    .getElementById("transaction-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const customerId = document.getElementById(
        "transaction-customer-id"
      ).value;
      const amount = parseFloat(
        document.getElementById("transaction-amount").value
      );
      const date = document.getElementById("transaction-date").value;
      const rate = parseFloat(
        document.getElementById("transaction-rate").value
      );
      const type = document.querySelector(
        'input[name="transaction-type"]:checked'
      ).value;

      if (isNaN(amount) || amount <= 0 || !date || isNaN(rate)) {
        showToast(
          "error",
          "Invalid Input",
          "Please enter a valid amount, date, and interest rate."
        );
        return;
      }

      const btn = document.getElementById("submit-transaction-btn");
      toggleButtonLoading(btn, true, "Saving...");

      const newTransaction = {
        amount,
        date,
        type,
        rate,
        id: Date.now(),
      };

      try {
        await db
          .collection("customers")
          .doc(customerId)
          .update({
            transactions:
              firebase.firestore.FieldValue.arrayUnion(newTransaction),
          });
        await loadData();
        showCustomerDetails(customerId);
        document.getElementById("transaction-form").reset();
        document.getElementById("tx-type-payment").checked = true;

        const customer = allCustomers.active.find((c) => c.id === customerId);
        if (customer) {
          document.getElementById("transaction-rate").value =
            customer.interestRate;
        }

        showToast(
          "success",
          "Transaction Recorded",
          `New ${type} has been saved.`
        );
      } catch (error) {
        showToast("error", "Update Failed", error.message);
      } finally {
        toggleButtonLoading(btn, false);
      }
    });

  document
    .getElementById("settle-account-btn")
    .addEventListener("click", (e) => {
      const customerId = e.currentTarget.dataset.id;
      showConfirmation(
        "Settle Account?",
        'This will mark the loan as cleared and move the customer to "Settled Accounts". This action cannot be undone.',
        async () => {
          try {
            await db
              .collection("customers")
              .doc(customerId)
              .update({ status: "settled" });
            detailsModal.classList.remove("show");
            showToast(
              "success",
              "Account Settled",
              "The account has been cleared."
            );
            await loadData();
          } catch (error) {
            showToast("error", "Error", error.message);
          }
        }
      );
    });

  document
    .getElementById("delete-account-btn")
    .addEventListener("click", (e) => {
      const customerId = e.currentTarget.dataset.id;
      showConfirmation(
        "Delete Record Permanently?",
        `Are you sure you want to delete this settled record? All its data will be lost forever.`,
        async () => {
          try {
            await db.collection("customers").doc(customerId).delete();
            detailsModal.classList.remove("show");
            showToast(
              "success",
              "Record Deleted",
              "The settled account has been permanently removed."
            );
            await loadData();
          } catch (error) {
            showToast("error", "Delete Failed", error.message);
          }
        }
      );
    });

  document
    .querySelectorAll(".modal .modal-close, .modal [data-close-modal]")
    .forEach((el) =>
      el.addEventListener("click", (e) =>
        e.target.closest(".modal").classList.remove("show")
      )
    );

  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      authContainer.classList.add("hidden");
      adminDashboard.classList.remove("hidden");
      loadData();
    } else {
      currentUser = null;
      allCustomers = { active: [], settled: [] };
      authContainer.classList.remove("hidden");
      adminDashboard.classList.add("hidden");
    }
  });

  logoutBtns.forEach((btn) =>
    btn.addEventListener("click", () => auth.signOut())
  );

  interestForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const p = parseFloat(document.getElementById("calc-principal").value);
    const r = parseFloat(document.getElementById("calc-rate").value);
    const y = parseInt(document.getElementById("calc-years").value) || 0;
    const m = parseInt(document.getElementById("calc-months").value) || 0;
    const d = parseInt(document.getElementById("calc-days").value) || 0;
    if (isNaN(p) || isNaN(r)) {
      showToast("error", "Invalid Input", "Principal and Rate are required.");
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + y);
    endDate.setMonth(endDate.getMonth() + m);
    endDate.setDate(endDate.getDate() + d);

    const { principal, interest, total, duration } = calculateInterest(
      p,
      r,
      startDate,
      endDate,
      false
    );
    document.getElementById(
      "calc-result-display"
    ).innerHTML = `<div class="detail-item"><label>Principal</label><p>${formatCurrency(
      principal
    )}</p></div><div class="detail-item"><label>Interest Earned</label><p>${formatCurrency(
      interest
    )}</p></div><div class="detail-item"><label>Total Amount</label><p>${formatCurrency(
      total
    )}</p></div><div class="detail-item"><label>Duration</label><p>${
      duration.years
    }Y, ${duration.months}M, ${duration.days}D</p></div>`;
    document.getElementById("calc-results").classList.remove("hidden");
  });
  interestForm.addEventListener("reset", () =>
    document.getElementById("calc-results").classList.add("hidden")
  );

  document
    .getElementById("change-password-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById("current-password").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      if (newPassword !== confirmPassword) {
        showToast("error", "Error", "New passwords do not match.");
        return;
      }
      if (newPassword.length < 6) {
        showToast("error", "Error", "Password must be at least 6 characters.");
        return;
      }

      const btn = document.getElementById("change-password-btn");
      toggleButtonLoading(btn, true, "Changing...");
      try {
        const user = auth.currentUser;
        const credential = firebase.auth.EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);
        showToast("success", "Success", "Password changed successfully.");
        e.target.reset();
      } catch (error) {
        showToast("error", "Error", error.message);
      } finally {
        toggleButtonLoading(btn, false);
      }
    });

  document.getElementById("download-data-btn").addEventListener("click", () => {
    const dataToDownload = {
      active_accounts: allCustomers.active,
      settled_accounts: allCustomers.settled,
    };
    if (
      dataToDownload.active_accounts.length === 0 &&
      dataToDownload.settled_accounts.length === 0
    ) {
      showToast("warning", "No Data", "There is no customer data to export.");
      return;
    }
    const dataStr = JSON.stringify(
      dataToDownload,
      (key, value) => (value?.toDate ? value.toDate().toISOString() : value),
      2
    );
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kumar_pal_singh_export_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  setTheme(localStorage.getItem("theme") || "light");
});
