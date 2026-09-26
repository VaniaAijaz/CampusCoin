/**
 * Campus Coin - Dynamic Currency Engine Service
 * Maintains exchange rates and performs bidirectional conversions
 * between supported user currencies and the system base currency (USD).
 *
 * Base Currency: USD (1 USD = 0.95 EUR = 278.0 PKR)
 */

class CurrencyService {
  constructor() {
    this.BASE_CURRENCY = "USD";
    this.DEFAULT_USER_CURRENCY = "USD"; // Updated default to USD
    this.RATES = {
      USD: 1.0,
      EUR: 0.95,
      PKR: 278.0,
    };
    this.ALLOWED_CURRENCIES = ["USD", "EUR", "PKR"];
  }

  /**
   * Fetch live market rates and cache them in Redis.
   * Runs on server startup and every 12 hours.
   */
  async syncRates() {
    const { redisClient } = require("./redis");
    try {
      let cachedRates = null;
      if (redisClient && redisClient.isOpen) {
        const data = await redisClient.get("campuscoin:exchange_rates");
        if (data) {
          cachedRates = JSON.parse(data);
          this.RATES = { ...this.RATES, ...cachedRates };
          console.log("[CURRENCY] Loaded exchange rates from Redis cache.");
          return;
        }
      }

      console.log("[CURRENCY] Fetching live market rates...");
      // Using native fetch (Node 18+)
      const response = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await response.json();
      
      if (data && data.rates) {
        const newRates = {
          USD: 1.0,
          EUR: data.rates.EUR || 0.95,
          PKR: data.rates.PKR || 278.0,
        };
        this.RATES = { ...this.RATES, ...newRates };
        
        if (redisClient && redisClient.isOpen) {
          // Store for 12 hours (43200 seconds)
          await redisClient.setEx("campuscoin:exchange_rates", 43200, JSON.stringify(newRates));
          console.log("[CURRENCY] Market rates fetched and cached in Redis.");
        }
      }
    } catch (err) {
      console.error("[CURRENCY] Error syncing exchange rates:", err.message);
      // Fallback to static defaults
    }
  }

  /**
   * Check if a given currency string is supported.
   * @param {string} curr
   * @returns {boolean}
   */
  isValidCurrency(curr) {
    if (!curr || typeof curr !== "string") return false;
    return this.ALLOWED_CURRENCIES.includes(curr.toUpperCase().trim());
  }

  /**
   * Retrieve the exchange rate relative to 1 USD.
   * @param {string} currency
   * @returns {number}
   */
  getRate(currency = this.BASE_CURRENCY) {
    const code = (currency || this.BASE_CURRENCY).toUpperCase().trim();
    return this.RATES[code] || 1.0;
  }

  /**
   * Resolve active user currency preference with default fallback to PKR.
   * @param {Object} user
   * @returns {string} 'USD' | 'EUR' | 'PKR'
   */
  getUserCurrency(user) {
    const preference = user?.currency_preference || user?.currency;
    if (this.isValidCurrency(preference)) {
      return preference.toUpperCase().trim();
    }
    return this.DEFAULT_USER_CURRENCY;
  }

  /**
   * Convert an amount from the user's currency into the base currency (USD)
   * for consistent storage in MongoDB.
   *
   * @param {number|string} amount
   * @param {string} fromCurrency
   * @returns {number} Amount in base currency (USD)
   */
  toBase(amount, fromCurrency = this.DEFAULT_USER_CURRENCY) {
    const num = Number(amount);
    if (isNaN(num)) return 0;
    const rate = this.getRate(fromCurrency);
    // Base amount in USD = input / rate
    return num / rate;
  }

  /**
   * Convert an amount stored in base currency (USD) into the user's preferred currency
   * when serializing responses to the frontend.
   *
   * @param {number|string} baseAmount
   * @param {string} toCurrency
   * @returns {number} Amount rounded to 2 decimal places in target currency
   */
  fromBase(baseAmount, toCurrency = this.DEFAULT_USER_CURRENCY) {
    const num = Number(baseAmount);
    if (isNaN(num)) return 0;
    const rate = this.getRate(toCurrency);
    // Target amount = baseAmount * rate
    return Math.round(num * rate * 100) / 100;
  }

  /**
   * Convert directly between two currencies.
   * @param {number|string} amount
   * @param {string} fromCurrency
   * @param {string} toCurrency
   * @returns {number}
   */
  convert(amount, fromCurrency, toCurrency) {
    const base = this.toBase(amount, fromCurrency);
    return this.fromBase(base, toCurrency);
  }

  /**
   * Format converted amount with international currency symbol.
   * @param {number|string} amount
   * @param {string} currency
   * @returns {string}
   */
  format(amount, currency = this.DEFAULT_USER_CURRENCY) {
    const code = (currency || this.DEFAULT_USER_CURRENCY).toUpperCase();
    const symbols = {
      USD: "$",
      EUR: "€",
      PKR: "₨",
    };
    const sym = symbols[code] || `${code} `;
    const num = Number(amount) || 0;
    return `${sym}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

module.exports = new CurrencyService();
