const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editingTransactionId = null;

const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MYR",
    signDisplay: "always",
   
});

const list = document.getElementById("transactionList");
const form = document.getElementById("transactionForm");
const status = document.getElementById("status");
const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");
const summary = document.getElementById("monthly-summary");

// Sign-Up Function
function signUp() {
    const fullname = document.getElementById('signup-fullname').value;
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    if (fullname && username && password) {
        const user = {
            fullname: fullname,
            username: username,
            password: password
        };
        localStorage.setItem(username, JSON.stringify(user));
        alert('Sign Up Successful! Please Sign In.');
        showSignIn();
    } else {
        alert('Please fill out all fields.');
    }
}

// Sign-In Function
function signIn() {
    const username = document.getElementById('signin-username').value;
    const password = document.getElementById('signin-password').value;
    const user = localStorage.getItem(username);

    const errorMessageElement = document.getElementById('signin-error');

    if (user) {
        const userData = JSON.parse(user);
        if (userData.password === password) {
            alert('Sign In Successful!');
            showExpenseTracker();
        } else {
            errorMessageElement.textContent = 'Incorrect Password.';
        }
    } else {
        errorMessageElement.textContent = 'Username not found. Please Sign Up.';
    }
}

// Show Sign-Up Form
function showSignUp() {
    document.getElementById('signin-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
}

// Show Sign-In Form
function showSignIn() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('signin-form').style.display = 'block';
    document.getElementById('signin-error').textContent = ''; // Clear error message
}

// Show Expense Tracker
function showExpenseTracker() {
    document.getElementById('signin-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('tracker-container').style.display = 'block';

    renderList();
    updateTotal();
}

form.addEventListener("submit", handleFormSubmit);

function updateTotal() {
    const incomeTotal = transactions
        .filter((trx) => trx.type === "income")
        .reduce((total, trx) => total + trx.amount, 0);

    const expenseTotal = transactions
        .filter((trx) => trx.type === "expense")
        .reduce((total, trx) => total + trx.amount, 0);

    const balanceTotal = incomeTotal - expenseTotal;

    balance.textContent = formatter.format(balanceTotal).substring(1);
    income.textContent = formatter.format(incomeTotal);
    expense.textContent = formatter.format(expenseTotal * -1);

    displaySummary();
}

function renderList() {
    list.innerHTML = "";

    status.textContent = "";
    if (transactions.length === 0) {
        status.textContent = "No transactions.";
        return;
    }

    transactions.forEach(({ id, description, amount, date, type }) => {
        const sign = "income" === type ? 1 : -1;

        const li = document.createElement("li");

        li.innerHTML = `
        <div class="description">
            <h4>${description}</h4>
            <p>${formatDate(date)}</p>
        </div>

        <div class="amount ${type}">
            <span>${formatter.format(amount * sign)}</span>
        </div>
        
        <div class="action">
            <button onclick="editTransaction(${id})">Edit</button>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" onclick="deleteTransaction(${id})">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        `;

        list.appendChild(li);
    });
}
// Function to format date to mm/dd/yyyy
function formatDate(date) {
    const d = new Date(date);
    let day = '' + d.getDate();
    let month = '' + (d.getMonth() + 1);
    const year = d.getFullYear();

    if (day.length < 2) day = '0' + day;
    if (month.length < 2) month = '0' + month;
    

    return [day, month, year].join('/');
}

function displaySummary() {
    summary.innerHTML = '';

    const summaryData = {};

    transactions.forEach(({ amount, date, type, }) => {
        if (type === "expense") {
            const monthYear = new Date(date).toLocaleString("default", { month: "long", year: "numeric" });
            summaryData[monthYear] = (summaryData[monthYear] || 0) + amount;
        }
    });

    for (const [monthYear, total] of Object.entries(summaryData)) {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            ${monthYear}
            <span class="badge badge-primary badge-pill">${formatter.format(total)}</span>
        `;
        summary.appendChild(li);
    }
}

function deleteTransaction(id) {
    const index = transactions.findIndex((trx) => trx.id === id);
    transactions.splice(index, 1);

    updateTotal();
    saveTransactions();
    renderList();
}

function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const transaction = {
        id: editingTransactionId ? editingTransactionId : transactions.length + 1,
        description: formData.get("description"),
        amount: parseFloat(formData.get("amount")),
        date: new Date(formData.get("date")),
        type: "on" === formData.get("type") ? "income" : "expense",
    };

    if (editingTransactionId) {
        const index = transactions.findIndex(trx => trx.id === editingTransactionId);
        transactions[index] = transaction;
        editingTransactionId = null;
    } else {
        transactions.push(transaction);
    }

    this.reset();

    updateTotal();
    saveTransactions();
    renderList();
}

function editTransaction(id) {
    const transaction = transactions.find(trx => trx.id === id);
    const { description, amount, date, type } = transaction;

    form.elements["description"].value = description;
    form.elements["amount"].value = amount;
    form.elements["date"].value = new Date(date).toISOString().split("T")[0];
    form.elements["type"].checked = type === "income";

    editingTransactionId = id;
}

function saveTransactions() {
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem("transactions", JSON.stringify(transactions));
}