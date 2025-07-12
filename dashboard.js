import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();
let currentFilter = 'all';
let reports = [];

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    }
});

// Fetch and display reports
function fetchReports() {
    const reportsRef = collection(db, "crimeReports");
    const q = query(reportsRef, orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        reports = [];
        snapshot.forEach((doc) => {
            reports.push({ id: doc.id, ...doc.data() });
        });
        displayReports(currentFilter);
    });
}

// Display reports based on filter
function displayReports(filter = 'all') {
    currentFilter = filter;
    const container = document.getElementById('reportContainer');
    container.innerHTML = '';

    const filteredReports = reports.filter(report => {
        if (filter === 'all') return true;
        return report.status === filter;
    });

    if (filteredReports.length === 0) {
        container.innerHTML = `<div class="report"><p>No ${filter} reports found.</p></div>`;
        return;
    }

    filteredReports.forEach(report => {
        const div = document.createElement('div');
        div.className = 'report';
        div.setAttribute('data-status', report.status || 'pending');
        
        div.innerHTML = `
            <h3>${report.crimeType}</h3>
            <p><strong>Name:</strong> ${report.firstName} ${report.lastName}</p>
            <p><strong>Contact:</strong> ${report.phone} | ${report.email}</p>
            <p><strong>Location:</strong> ${report.address}</p>
            <p><strong>Date & Time:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
            <p><strong>Description:</strong> ${report.description}</p>
            ${report.witnessInfo ? `<p><strong>Witness Info:</strong> ${report.witnessInfo}</p>` : ''}
            ${report.evidenceUrls?.length ? '<div class="evidence">' + report.evidenceUrls.map(url => 
                `<img src="${url}" alt="Evidence">`).join('') + '</div>' : ''}
            <div class="actions">
                <button class="investigating" onclick="updateStatus('${report.id}', 'investigating')">
                    Start Investigating
                </button>
                <button class="resolved" onclick="updateStatus('${report.id}', 'resolved')">
                    Mark Resolved
                </button>
                <button class="pending" onclick="updateStatus('${report.id}', 'pending')">
                    Mark Pending
                </button>
                <button class="delete" onclick="showDeleteModal('${report.id}')">
                    Delete
                </button>
                ${report.status === 'resolved' ? '<span class="resolved-icon">✔ Resolved</span>' : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

// Update report status
async function updateStatus(reportId, status) {
    try {
        const reportRef = doc(db, "crimeReports", reportId);
        await updateDoc(reportRef, { status });
    } catch (error) {
        console.error("Error updating status:", error);
        alert("Error updating status. Please try again.");
    }
}

// Delete report
async function deleteReport(reportId) {
    try {
        await deleteDoc(doc(db, "crimeReports", reportId));
        closeDeleteModal();
    } catch (error) {
        console.error("Error deleting report:", error);
        alert("Error deleting report. Please try again.");
    }
}

// Search reports
function searchReports() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const filteredReports = reports.filter(report => 
        report.firstName?.toLowerCase().includes(searchTerm) ||
        report.lastName?.toLowerCase().includes(searchTerm) ||
        report.city?.toLowerCase().includes(searchTerm) ||
        report.crimeType?.toLowerCase().includes(searchTerm)
    );
    displayFilteredReports(filteredReports);
}

// Display filtered reports
function displayFilteredReports(filteredReports) {
    const container = document.getElementById('reportContainer');
    container.innerHTML = '';

    if (filteredReports.length === 0) {
        container.innerHTML = '<div class="report"><p>No matching reports found.</p></div>';
        return;
    }

    filteredReports.forEach(report => {
        // Reuse the same report display logic
        const div = document.createElement('div');
        div.className = 'report';
        div.setAttribute('data-status', report.status || 'pending');
        // ... (same report HTML as in displayReports)
        container.appendChild(div);
    });
}

// Export to CSV
function exportCSV() {
    const headers = ['Date', 'Crime Type', 'Name', 'Contact', 'Location', 'Status', 'Description'];
    const csvContent = [
        headers.join(','),
        ...reports.map(report => [
            new Date(report.timestamp).toLocaleString(),
            report.crimeType,
            `${report.firstName} ${report.lastName}`,
            `${report.phone} | ${report.email}`,
            report.address,
            report.status || 'pending',
            `"${report.description.replace(/"/g, '""')}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'crime_reports.csv';
    link.click();
}

async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        alert('Error logging out. Please try again.');
    }
}

// Initialize
window.onload = () => {
    fetchReports();
};

// Make functions available globally
window.filterReports = displayReports;
window.updateStatus = updateStatus;
window.deleteReport = deleteReport;
window.searchReports = searchReports;
window.exportCSV = exportCSV; 
window.handleLogout = handleLogout; 