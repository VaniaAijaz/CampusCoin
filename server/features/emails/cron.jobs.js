const cron = require("node-cron");
const User = require("../auth/User.model");
const Transaction = require("../transactions/Transaction.model");
const { sendMonthlyStatementEmail } = require("./email.service");

// Run on the 1st day of every month at 8:00 AM
cron.schedule("0 8 1 * *", async () => {
  console.log("Running Monthly Statement Cron Job...");
  try {
    const now = new Date();
    // We are running on the 1st, so we want data from the previous month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    const monthName = lastMonthStart.toLocaleString('default', { month: 'long', year: 'numeric' });

    const users = await User.find({ isActive: true });

    for (const user of users) {
      // Calculate totals for the previous month
      const [incomeResult, expenseResult] = await Promise.all([
        Transaction.aggregate([
          { $match: { userId: user._id, type: "income", date: { $gte: lastMonthStart, $lte: lastMonthEnd }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { userId: user._id, type: "expense", date: { $gte: lastMonthStart, $lte: lastMonthEnd }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
      ]);

      const totalIn = incomeResult[0]?.total || 0;
      const totalOut = expenseResult[0]?.total || 0;

      // Only send if there was some activity
      if (totalIn > 0 || totalOut > 0) {
        await sendMonthlyStatementEmail(user.email, monthName, totalIn, totalOut);
      }
    }
    
    console.log("Monthly Statement Cron Job completed successfully.");
  } catch (error) {
    console.error("Error in Monthly Statement Cron Job:", error);
  }
});

console.log("Email cron jobs registered.");
