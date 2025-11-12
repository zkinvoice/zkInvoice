const API_URL = window.location.origin;
const pathParts = window.location.pathname.split('/');
const invoiceId = pathParts[pathParts.length - 1];

async function loadInvoice() {
    if (!invoiceId) {
        showError('No invoice ID provided');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/invoice/${invoiceId}`);
        
        if (!response.ok) {
            throw new Error('Invoice not found');
        }
        
        const invoice = await response.json();
        displayInvoice(invoice);
        
    } catch (error) {
        showError(`Error: ${error.message}`);
    }
}

function displayInvoice(invoice) {
    document.getElementById('loadingSpinner').classList.add('hidden');
    document.getElementById('invoiceContent').classList.remove('hidden');

    const statusColors = {
        'waiting': 'status-waiting',
        'finished': 'status-finished',
        'failed': 'status-failed',
        'expired': 'status-expired'
    };

    const statusClass = statusColors[invoice.status] || 'status-waiting';
    const statusText = invoice.status === 'finished' ? 'PAYMENT RECEIVED' : invoice.status.toUpperCase();
    
    document.getElementById('statusBadge').innerHTML = 
        `<span class="status-badge ${statusClass}">${statusText}</span>`;

    document.getElementById('sendAmount').textContent = invoice.amount || '0.00';
    
    if (invoice.status === 'finished') {
        document.querySelector('.info-section.highlight:last-child').style.display = 'none';
    } else {
        document.getElementById('payinAddress').value = invoice.payinAddress || '';
        
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: invoice.payinAddress,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}
function showError(message) {
    document.getElementById('loadingSpinner').classList.add('hidden');
    document.getElementById('errorMessage').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

function copyAddress() {
    const addressInput = document.getElementById('payinAddress');
    addressInput.select();
    addressInput.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        
        const btn = event.target.closest('.copy-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Copied!';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Copy failed:', err);
    }
}

loadInvoice();
setInterval(loadInvoice, 10000);