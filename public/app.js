const API_URL = window.location.origin;

console.log(API_URL)

async function loadCurrencies() {
    try { 
        const response = await fetch(`${API_URL}/api/currencies`);
        const currencies = await response.json();
        console.log('')
        const select = document.getElementById('toChain');
        select.innerHTML = '<option value="">Select chain</option>'

        currencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = `${currency.ticker}|${currency.network}`
            option.textContent = `${currency.name} (${currency.ticker.toUpperCase()})`;
            select.appendChild(option);
        })
    } catch (error) {
        console.log('Error loading:', error);
    }
}

loadCurrencies();