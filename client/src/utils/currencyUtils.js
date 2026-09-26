export const formatCurrency = (amount, currency = "USD") => {
  const code = currency.toUpperCase();
  const numAmount = Number(amount) || 0;
  
  if (code === "PKR") {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount).replace("PKR", "Rs");
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};
