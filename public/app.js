const API_URL = window.location.origin;
let selectedCurrency = null;
let allCurrencies = [];

let displayedCount = 20;
const ITEMS_PER_LOAD = 20;
console.log(API_URL)

document.addEventListener('DOMContentLoaded', function() {

    async function loadCurrencies() {
        try { 
            const response = await fetch(`${API_URL}/api/currencies`);
            const currencies = await response.json();
            allCurrencies = currencies;
            
            displayCurrencies(allCurrencies.slice(0, displayedCount));

        } catch (error) {
            console.log('Error loading:', error);
        }
    }

    function displayCurrencies(currencies, append = false) {
        const selectItems = document.getElementById('selectItems');
        
        if (!append) {
            selectItems.innerHTML = '';
            displayedCount = ITEMS_PER_LOAD;
        }

        currencies.forEach(currency => {
            const item = document.createElement('div');
            item.className = 'select-item';
            item.dataset.value = `${currency.ticker}|${currency.network}`;

            item.innerHTML = `
                <img src="${currency.image}" alt="${currency.name}" loading="lazy">
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
    const selectItems = document.getElementById('selectItems');

    selectItems.addEventListener('scroll', function() {
        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 50) {
            loadMoreItems();
        }
    });

    function loadMoreItems() {
        const searchTerm = searchInput.value.toLowerCase();
        let itemsToShow;

        if (searchTerm === '') {
            itemsToShow = allCurrencies.slice(displayedCount, displayedCount + ITEMS_PER_LOAD);
        } else {
            const filtered = allCurrencies.filter(currency => 
                currency.name.toLowerCase().includes(searchTerm) ||
                currency.ticker.toLowerCase().includes(searchTerm)
            );
            itemsToShow = filtered.slice(displayedCount, displayedCount + ITEMS_PER_LOAD);
        }

        if (itemsToShow.length > 0) {
            displayCurrencies(itemsToShow, true);
            displayedCount += itemsToShow.length;
        }
    }
    searchInput.addEventListener('focus', function() {
        document.getElementById('selectItems').classList.remove('hidden');
    });

    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.toLowerCase();
            
            if (searchTerm === '') {
                displayCurrencies(allCurrencies.slice(0, ITEMS_PER_LOAD));
            } else {
                const filtered = allCurrencies.filter(currency => 
                    currency.name.toLowerCase().includes(searchTerm) ||
                    currency.ticker.toLowerCase().includes(searchTerm)
                );
                displayCurrencies(filtered.slice(0, ITEMS_PER_LOAD));
            }
            
            document.getElementById('selectItems').classList.remove('hidden');
        }, 300);
    });
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-select')) {
            document.getElementById('selectItems').classList.add('hidden');
        }
    });

    function showLoading(show) {
        const button = document.getElementById('createInvoice');
        if (show) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner"></span> Creating invoice...';
        } else {
            button.disabled = false;
            button.innerHTML = 'Create Invoice'
        }
    }

    document.getElementById('createInvoice').addEventListener('click', async () => {
        const amount = document.getElementById('amount').value;
        const address = document.getElementById('address').value;
        
        if (!amount || !selectedCurrency || !address) {
            alert('Please fill all fields');
            return;
        }
        
        showLoading(true);

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
            
            window.location.href = `/invoice/${data.id}`;
            
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice');
        }
    });

    loadCurrencies();
});