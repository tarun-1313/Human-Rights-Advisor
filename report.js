function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    if (errorAlert) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    } else {
        alert(message); // fallback
    }
}

window.getLocation = function() {
    const addressInput = document.getElementById('address');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    const latInput = document.getElementById('lat');
    const lonInput = document.getElementById('lon');
    const locationBtn = document.querySelector('.location-btn');

    // Allow geolocation on HTTPS, localhost, or 127.0.0.1
    if (
        location.protocol !== 'https:' &&
        location.hostname !== 'localhost' &&
        location.hostname !== '127.0.0.1'
    ) {
        showError('Geolocation only works on HTTPS, localhost, or 127.0.0.1. Please use a secure connection or run locally.');
        return;
    }

    // Show loading state
    locationBtn.disabled = true;
    locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
    addressInput.value = 'Getting location...';
    
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        locationBtn.disabled = false;
        locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Track Current Location';
        return;
    }

    // Make location fields optional
    addressInput.removeAttribute('required');
    cityInput.removeAttribute('required');
    stateInput.removeAttribute('required');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Update lat/lon immediately
                latInput.value = lat.toFixed(6);
                lonInput.value = lon.toFixed(6);

                // Use a faster geocoding service (OpenStreetMap with shorter timeout)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                    {
                        headers: {
                            'User-Agent': 'HumanRightsAdvisor/1.0',
                            'Referer': window.location.origin
                        },
                        signal: controller.signal
                    }
                );

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error('Location service error');
                }

                const data = await response.json();
                const address = data.address || {};

                // Fill in the address fields
                cityInput.value = address.city || address.town || address.village || '';
                stateInput.value = address.state || '';
                addressInput.value = [
                    address.road,
                    address.suburb,
                    address.city || address.town || address.village,
                    address.state,
                    address.postcode
                ].filter(Boolean).join(', ');

                // Reset button state
                locationBtn.disabled = false;
                locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Track Current Location';

            } catch (error) {
                console.error('Error getting location details:', error);
                // Keep the lat/lon if we have them
                if (latInput.value && lonInput.value) {
                    showError('Got coordinates but address lookup failed. You can enter the address manually.');
                } else {
                    showError('Error getting location. Please enter manually.');
                }
                addressInput.value = '';
                cityInput.value = '';
                stateInput.value = '';
                latInput.value = '';
                lonInput.value = '';
                addressInput.setAttribute('required', 'required');
                cityInput.setAttribute('required', 'required');
                stateInput.setAttribute('required', 'required');
                // Reset button state
                locationBtn.disabled = false;
                locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Track Current Location';
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            let errorMsg = 'Error getting location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'Please enable location access in your browser settings.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'Location request timed out.';
                    break;
                default:
                    errorMsg += 'Please enter location manually.';
            }
            showError(errorMsg);
            addressInput.value = '';
            cityInput.value = '';
            stateInput.value = '';
            latInput.value = '';
            lonInput.value = '';
            addressInput.setAttribute('required', 'required');
            cityInput.setAttribute('required', 'required');
            stateInput.setAttribute('required', 'required');
            // Reset button state
            locationBtn.disabled = false;
            locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Track Current Location';
        },
        {
            enableHighAccuracy: false, // Set to false for faster response
            timeout: 3000, // Reduced timeout to 3 seconds
            maximumAge: 60000 // Accept cached location up to 1 minute old
        }
    );
};

// Handle file uploads
function handleFileUpload(files) {
    const evidenceUrls = [];
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                evidenceUrls.push(e.target.result);
                // Update the form data with the new image
                const currentReport = JSON.parse(localStorage.getItem('currentReport') || '{}');
                currentReport.evidenceUrls = evidenceUrls;
                localStorage.setItem('currentReport', JSON.stringify(currentReport));
            };
            reader.readAsDataURL(file);
        }
    });
}

// Update the form submission to include file handling
function handleReportSubmit(event) {
    event.preventDefault();
    
    const formData = {
        id: 'RPT_' + Date.now(),
        timestamp: new Date().toISOString(),
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        crimeType: document.getElementById('crimeType').value,
        otherCrimeType: document.getElementById('otherCrimeBox').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        lat: document.getElementById('lat').value,
        lon: document.getElementById('lon').value,
        description: document.getElementById('description').value,
        witnessInfo: document.getElementById('witness').value,
        status: 'pending',
        evidenceUrls: []
    };

    // Get evidence files
    const evidenceFiles = document.getElementById('evidence').files;
    if (evidenceFiles.length > 0) {
        const filePromises = Array.from(evidenceFiles).map(file => {
            return new Promise((resolve) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                } else {
                    resolve(null);
                }
            });
        });

        Promise.all(filePromises).then(urls => {
            formData.evidenceUrls = urls.filter(url => url !== null);
            saveReport(formData);
        });
    } else {
        saveReport(formData);
    }
}

function saveReport(reportData) {
    // Get existing reports
    const existingReports = JSON.parse(localStorage.getItem('crimeReports') || '[]');
    
    // Add new report to the beginning
    existingReports.unshift(reportData);
    
    // Save updated reports
    localStorage.setItem('crimeReports', JSON.stringify(existingReports));

    // Download the report as a text file
    downloadReportAsText(reportData);

    // Show success message
    const successAlert = document.getElementById('successAlert');
    successAlert.style.display = 'block';
    successAlert.textContent = `Report submitted successfully! Report ID: ${reportData.id}`;

    // Reset form
    document.getElementById('crimeReportForm').reset();

    // Re-render the reports list
    renderSubmittedReports();
}

function downloadReportAsText(report) {
    const lines = [
        `Report ID: ${report.id}`,
        `Submitted: ${report.timestamp}`,
        `Name: ${report.firstName} ${report.lastName}`,
        `Email: ${report.email}`,
        `Phone: ${report.phone}`,
        `Crime Type: ${report.crimeType === 'other' ? report.otherCrimeType : report.crimeType}`,
        `Date: ${report.date}`,
        `Time: ${report.time}`,
        `Address: ${report.address}, ${report.city}, ${report.state}`,
        `Latitude: ${report.lat}`,
        `Longitude: ${report.lon}`,
        `Description: ${report.description}`,
        `Witness Info: ${report.witnessInfo}`,
        `Status: ${report.status}`
    ];
    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CrimeReport_${report.id}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

function renderSubmittedReports() {
    const reports = JSON.parse(localStorage.getItem('crimeReports') || '[]');
    const container = document.getElementById('submittedReportsList');
    if (!container) return;
    if (reports.length === 0) {
        container.innerHTML = '<p style="color:#aaa;">No reports submitted yet.</p>';
        return;
    }
    container.innerHTML = reports.map(report => `
        <div style="background:#181848; border:1px solid #264dff; border-radius:8px; padding:18px; margin-bottom:18px;">
            <div style="font-size:1.1rem; color:#3399ff; margin-bottom:6px;">Report ID: <b>${report.id}</b> <span style="float:right; color:#66ff99; font-size:0.95rem;">Status: ${report.status}</span></div>
            <div><b>Date:</b> ${report.date} <b>Time:</b> ${report.time}</div>
            <div><b>Type:</b> ${report.crimeType === 'other' ? report.otherCrimeType : report.crimeType}</div>
            <div><b>Location:</b> ${report.address}, ${report.city}, ${report.state}</div>
            <div><b>Description:</b> ${report.description}</div>
            <div><b>Submitted:</b> ${new Date(report.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
}

// Add event listeners when document loads
document.addEventListener('DOMContentLoaded', function() {
    const reportForm = document.getElementById('crimeReportForm');
    const evidenceInput = document.getElementById('evidence');
    
    if (reportForm) {
        reportForm.addEventListener('submit', handleReportSubmit);
    }
    
    if (evidenceInput) {
        evidenceInput.addEventListener('change', function(e) {
            handleFileUpload(e.target.files);
        });
    }
}); 

// On page load, render the reports list
if (document.getElementById('submittedReportsList')) {
    renderSubmittedReports();
} 