let isRegisterMode = false;
let currentUser = localStorage.getItem('currentUser') || null;

let capital = parseFloat(localStorage.getItem('capital')) || 0;
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let archives = JSON.parse(localStorage.getItem('archives')) || [];

checkLoginState();

function checkLoginState() {
    if (currentUser) {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        document.getElementById('expenseDate').valueAsDate = new Date();
        updateUI();
    } else {
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
    }
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    const subtitle = document.getElementById('authSubtitle');
    const btn = document.getElementById('authBtn');
    const toggleText = document.getElementById('authToggleText');
    const confirmGroup = document.getElementById('confirmPasswordGroup');

    if (isRegisterMode) {
        subtitle.innerText = "አዲስ አካውንት ይፍጠሩ";
        btn.innerText = "ተመዝገብ";
        toggleText.innerText = "አካውንት አለዎት? ይግቡ";
        confirmGroup.style.display = 'block';
    } else {
        subtitle.innerText = "እባክዎ ይግቡ";
        btn.innerText = "ይግቡ";
        toggleText.innerText = "አካውንት የለዎትም? ይመዝገቡ";
        confirmGroup.style.display = 'none';
    }
}

function handleAuth() {
    const user = document.getElementById('authUsername').value.trim();
    const pass = document.getElementById('authPassword').value.trim();

    if (!user || !pass) {
        alert("እባክዎ የተጠቃሚ ስም እና የይለፍ ቃል ያስገቡ!");
        return;
    }

    if (isRegisterMode) {
        const confirmPass = document.getElementById('authConfirmPassword').value.trim();
        if (pass !== confirmPass) {
            alert("የይለፍ ቃሎቹ እርስ በእርስ አልተመሳሰሉም!");
            return;
        }

        if (localStorage.getItem('user_' + user)) {
            alert("ይህ የተጠቃሚ ስም ተይዟል!");
            return;
        }
        localStorage.setItem('user_' + user, pass);
        alert("ምዝገባው ተሳክቷል! መግባት ይችላሉ።");
        document.getElementById('authConfirmPassword').value = '';
        toggleAuthMode();
    } else {
        const savedPass = localStorage.getItem('user_' + user);
        if (!savedPass || savedPass !== pass) {
            alert("የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል!");
            return;
        }
        currentUser = user;
        localStorage.setItem('currentUser', currentUser);
        document.getElementById('authUsername').value = '';
        document.getElementById('authPassword').value = '';
        checkLoginState();
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    checkLoginState();
}

function setCapital() {
    const inputVal = parseFloat(document.getElementById('capitalInput').value);
    
    if (isNaN(inputVal) || inputVal <= 0) {
        alert("እባክዎ ትክክለኛ የካፒታል መጠን ያስገቡ!");
        return;
    }
    
    if (capital > 0 || expenses.length > 0) {
        const archivedSession = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            capital: capital,
            expenses: expenses
        };
        archives.push(archivedSession);
        localStorage.setItem('archives', JSON.stringify(archives));
    }

    capital = inputVal;
    expenses = [];
    
    localStorage.setItem('capital', capital);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    document.getElementById('capitalInput').value = '';
    updateUI();
}

function sanitizeText(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function addExpense() {
    const date = document.getElementById('expenseDate').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    let reason = document.getElementById('expenseReason').value.trim();

    if (!date || isNaN(amount) || amount <= 0 || !reason) {
        alert("እባክዎ ቀን፣ መጠን እና ምክንያቱን ይሙሉ!");
        return;
    }

    let currentBalance = capital;
    expenses.forEach(item => { currentBalance -= item.amount; });

    if (amount > currentBalance) {
        alert(`ማስጠንቀቂያ፡ የጠየቁት ወጪ ከቀሪው ገንዘብ ይበልጣል!`);
        return;
    }

    reason = sanitizeText(reason);

    expenses.push({ id: Date.now(), date: date, amount: amount, reason: reason });
    localStorage.setItem('expenses', JSON.stringify(expenses));

    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseReason').value = '';
    updateUI();
}

function deleteExpense(id) {
    expenses = expenses.filter(item => item.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    updateUI();
}

function updateUI() {
    document.getElementById('displayCapital').innerText = capital.toLocaleString();
    
    const tbody = document.getElementById('expenseTableBody');
    tbody.innerHTML = '';

    let runningBalance = capital;
    let monthlyTotals = {}; // ለወርሃዊ ድምር ማሰባሰቢያ

    expenses.forEach(item => {
        runningBalance -= item.amount;
        
        // ወርሃዊ ድምር ለማስላት (YYYY-MM)
        let monthKey = item.date.substring(0, 7);
        if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = 0;
        monthlyTotals[monthKey] += item.amount;
        
        const row = document.createElement('tr');
        row.innerHTML = '<td>' + item.date + '</td><td>' + item.amount.toLocaleString() + ' ብር</td><td>' + item.reason + '</td><td><b>' + runningBalance.toLocaleString() + ' ብር</b></td><td><button class="delete-btn" onclick="deleteExpense(' + item.id + ')">ሰርዝ</button></td>';
        tbody.appendChild(row);
    });

    const remElement = document.getElementById('displayRemaining');
    remElement.innerText = runningBalance.toLocaleString() + ' ብር';
    remElement.style.color = runningBalance < 0 ? '#d32f2f' : '#1B5E20';

    renderMonthlySummary(monthlyTotals);
    renderArchives();
}

// የወርሃዊ ድምር ማሳያ ራሱን የቻለ ክፍል
function renderMonthlySummary(monthlyTotals) {
    let container = document.getElementById('monthlySummaryContainer');
    if (!container) return;

    let html = '';
    let months = Object.keys(monthlyTotals);
    if (months.length === 0) {
        container.innerHTML = '<p style="font-size: 13px; color: #666;">ገና የተመዘገበ ወጪ የለም።</p>';
        return;
    }

    html = '<ul style="margin: 0; padding-left: 18px; font-size: 13px;">';
    months.forEach(m => {
        html += '<li style="margin-bottom: 5px;">ወር <b>' + m + '</b> ጠቅላላ ወጪ: <b style="color: #d32f2f;">' + monthlyTotals[m].toLocaleString() + ' ብር</b></li>';
    });
    html += '</ul>';
    container.innerHTML = html;
}

// 1. መረጃዎችን በፋይል መልክ ማውረድ (Backup)
function exportBackup() {
    const backupData = {
        capital: capital,
        expenses: expenses,
        archives: archives
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "expense_backup_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

// 2. ያስቀመጡትን ፋይል መመለስ (Restore)
function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.capital !== undefined && imported.expenses) {
                capital = imported.capital;
                expenses = imported.expenses;
                archives = imported.archives || [];

                localStorage.setItem('capital', capital);
                localStorage.setItem('expenses', JSON.stringify(expenses));
                localStorage.setItem('archives', JSON.stringify(archives));

                updateUI();
                alert("ምቲኬው (Backup) በተሳካ ሁኔታ ተመለሰ!");
            } else {
                alert("የተሳሳተ የፋይል ቅርጸት!");
            }
        } catch (err) {
            alert("ፋይሉን ማንበብ አልተቻለም!");
        }
    };
    reader.readAsText(file);
}

function renderArchives() {
    const container = document.getElementById('archivesContainer');
    if (!container) return;
    if (archives.length === 0) {
        container.innerHTML = '<p style="font-size: 14px; color: #666;">ገና የተዘጋ ፎልደር የለም።</p>';
        return;
    }

    container.innerHTML = '';
    archives.forEach((arch, index) => {
        let totalSpent = arch.expenses.reduce((sum, item) => sum + item.amount, 0);
        let rem = arch.capital - totalSpent;

        let expensesHtml = '';
        if (arch.expenses && arch.expenses.length > 0) {
            expensesHtml = '<ul style="margin-top: 8px; padding-left: 20px; font-size: 13px; list-style-type: disc;">';
            arch.expenses.forEach(exp => {
                expensesHtml += '<li style="margin-bottom: 4px;">' + exp.date + ' — <b>' + exp.reason + '</b>: ' + exp.amount.toLocaleString() + ' ብር</li>';
            });
            expensesHtml += '</ul>';
        } else {
            expensesHtml = '<p style="font-size: 13px; color: #666; margin-top: 5px;">በዚህ ፎልደር ውስጥ የተመዘገበ ወጪ የለም።</p>';
        }

        const div = document.createElement('div');
        div.style.cssText = "background: #faf8f0; padding: 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #d1c7a3;";
        div.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleArchive(' + index + ')"><div><b>ፎልደር #' + (index + 1) + ' (' + arch.date + ')</b><br><span style="font-size: 13px; color: #444;">ካፒታል: <b>' + arch.capital.toLocaleString() + ' ብር</b> | ቀሪ: <b>' + rem.toLocaleString() + ' ብር</b></span></div><span style="font-size: 12px; background: #1A237E; color: white; padding: 5px 10px; border-radius: 6px;">ዝርዝር ▼</span></div><div id="archive-details-' + index + '" style="display: none; margin-top: 10px; border-top: 1px solid #d1c7a3; padding-top: 8px;">' + expensesHtml + '</div>';
        container.appendChild(div);
    });
}

function toggleArchive(index) {
    const detailsDiv = document.getElementById('archive-details-' + index);
    detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
}
