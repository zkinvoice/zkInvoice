const API_URL = window.location.origin;
let selectedCurrency = null;
let allCurrencies = [];

console.log(API_URL)

document.addEventListener('DOMContentLoaded', function() {

    async function loadCurrencies() {
        try { 
            const response = await fetch(`${API_URL}/api/currencies`);
            const currencies = await response.json();
            allCurrencies = currencies;
            
            displayCurrencies(currencies);

        } catch (error) {
            console.log('Error loading:', error);
        }
    }

    function displayCurrencies(currencies) {
        const selectItems = document.getElementById('selectItems');
        selectItems.innerHTML = '';

        currencies.forEach(currency => {
            const item = document.createElement('div');
            item.className = 'select-item';
            item.dataset.value = `${currency.ticker}|${currency.network}`;

            item.innerHTML = `
                <img src="${currency.image}" alt="${currency.name}">
                <div class="select-item-text">
                    <span class="select-item-name">${currency.name}</span>
                    <span class="select-item-ticker">${currency.ticker.toUpperCase()}</span>
                </div>
            `;

            item.addEventListener('click', () => {
                selectedCurrency = currency;
                document.getElementById('chainSearch').value = `${currency.name} (${currency.ticker.toUpperCase()})`;
                selectItems.classList.add('hidden');
            });

            selectItems.appendChild(item)
        })
    }

    const searchInput = document.getElementById('chainSearch');
    
    searchInput.addEventListener('focus', function() {
        document.getElementById('selectItems').classList.remove('hidden');
    });

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        if (searchTerm === '') {
            displayCurrencies(allCurrencies);
        } else {
            const filtered = allCurrencies.filter(currency => 
                currency.name.toLowerCase().includes(searchTerm) ||
                currency.ticker.toLowerCase().includes(searchTerm)
            );
            displayCurrencies(filtered);
        }
        
        document.getElementById('selectItems').classList.remove('hidden');
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-select')) {
            document.getElementById('selectItems').classList.add('hidden');
        }
    });

    document.getElementById('createInvoice').addEventListener('click', async () => {
        const amount = document.getElementById('amount').value;
        const address = document.getElementById('address').value;
        
        if (!amount || !selectedCurrency || !address) {
            alert('Please fill all fields');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/api/createInvoice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    toCurrency: selectedCurrency.ticker,
                    toNetwork: selectedCurrency.network,
                    address: address
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                alert('Error: ' + (data.error || 'Failed to create invoice'));
                return;
            }
            
            alert(`Invoice created!\nSend ${data.amount} ZEC to:\n${data.payinAddress}`);
            
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice');
        }
    });

    loadCurrencies();
});