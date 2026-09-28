export const formatCurrency = (amount, currency = "USD") => {
  const code = (currency || "USD").toUpperCase();
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

export const getCurrencySymbol = (currency = "USD") => {
  const code = (currency || "USD").toUpperCase();
  switch (code) {
    case "PKR":
      return "Rs ";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "INR":
      return "₹";
    case "JPY":
      return "¥";
    case "CAD":
      return "CA$";
    case "AUD":
      return "AU$";
    case "USD":
    default:
      return "$";
  }
};
