import jsPDF from "jspdf";
import "jspdf-autotable";
import { format, addDays, isWithinInterval } from "date-fns";
import { getTransactions } from "../transactions/transactionApi";
import { getSubscriptions } from "../subscriptions/subscriptionApi";
import toast from "react-hot-toast";

export const generateStatementPDF = async (user) => {
  const loadingToast = toast.loading("Generating Official Statement...");
  
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 1. Fetch transactions within the current month up to now
    const txRes = await getTransactions({
      startDate: startOfMonth.toISOString(),
      endDate: now.toISOString(),
      limit: 1000 // Fetch up to 1000 to ensure we capture all for the month
    });
    
    const transactions = txRes.success ? txRes.transactions : [];

    // 2. Fetch subscriptions
    const subRes = await getSubscriptions();
    const subscriptions = subRes.success ? subRes.subscriptions : [];

    // 3. Calculate Executive Summary
    let totalInflow = 0;
    let totalOutflow = 0;

    transactions.forEach(tx => {
      if (tx.type === "income") totalInflow += tx.amount;
      else if (tx.type === "expense") totalOutflow += tx.amount;
    });

    const netBalance = totalInflow - totalOutflow;

    // 4. Calculate Subscription Radar (Next 15 days)
    const next15Days = addDays(now, 15);
    const upcomingSubscriptions = subscriptions.filter(sub => {
      if (!sub.next_due_date) return false;
      const nextDate = new Date(sub.next_due_date);
      return isWithinInterval(nextDate, { start: now, end: next15Days });
    }).sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));

    // 5. Initialize jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Colors & Typography
    const primaryColor = "#3B82F6"; // Aurora Sapphire Blue
    const textColor = "#1E293B"; // Slate-800
    const subtleColor = "#64748B"; // Slate-500

    // ---- HEADER ----
    // Logo (Text substitute)
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text("Campus Coin", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(subtleColor);
    doc.text("NextGen BudgetBee Financial", 14, 26);

    // Title & Meta
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor);
    doc.text("Official Monthly Statement", pageWidth - 14, 20, { align: "right" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateRangeStr = `${format(startOfMonth, "MMMM d, yyyy")} - ${format(now, "MMMM d, yyyy")}`;
    doc.text(dateRangeStr, pageWidth - 14, 26, { align: "right" });
    
    doc.text(`Prepared for: ${user?.name || "Student"}`, 14, 40);
    doc.text(`Generated on: ${format(now, "MMMM d, yyyy 'at' h:mm a")}`, pageWidth - 14, 40, { align: "right" });

    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, 44, pageWidth - 14, 44);

    // ---- EXECUTIVE SUMMARY ----
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor);
    doc.text("Executive Summary", 14, 55);

    // Summary Boxes
    const boxY = 60;
    const boxWidth = (pageWidth - 36) / 3;

    const drawSummaryBox = (x, title, amount, amountColor) => {
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(x, boxY, boxWidth, 20, 2, 2, "FD");
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(subtleColor);
      doc.text(title, x + boxWidth / 2, boxY + 7, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(amountColor);
      doc.text(`$${amount.toFixed(2)}`, x + boxWidth / 2, boxY + 15, { align: "center" });
    };

    drawSummaryBox(14, "Total Inflow", totalInflow, "#10B981");
    drawSummaryBox(14 + boxWidth + 4, "Total Outflow", totalOutflow, "#F43F5E");
    drawSummaryBox(14 + (boxWidth + 4) * 2, "Net Balance", netBalance, primaryColor);

    // ---- TRANSACTION LEDGER ----
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor);
    doc.text("Transaction Ledger", 14, 95);

    const tableRows = transactions.map(tx => [
      format(new Date(tx.date), "MMM d, yyyy"),
      tx.description || "N/A",
      tx.categoryId?.name || "Uncategorized",
      { 
        content: tx.type === "income" ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`,
        styles: { textColor: tx.type === "income" ? "#10B981" : "#1E293B" }
      }
    ]);

    doc.autoTable({
      startY: 100,
      head: [["Date", "Description", "Category", "Amount"]],
      body: tableRows,
      theme: "plain",
      headStyles: {
        fillColor: false,
        textColor: primaryColor,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textColor,
      },
      alternateRowStyles: {
        fillColor: "#F8FAFC",
      },
      columnStyles: {
        3: { halign: "right", fontStyle: "bold" }
      },
      margin: { left: 14, right: 14 },
    });

    // ---- SUBSCRIPTION RADAR ----
    let finalY = doc.lastAutoTable.finalY + 15;
    
    // Add page if needed
    if (finalY > doc.internal.pageSize.height - 40) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor);
    doc.text("Subscription Radar (Next 15 Days)", 14, finalY);

    if (upcomingSubscriptions.length === 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(subtleColor);
      doc.text("No subscriptions or bills are due in the next 15 days.", 14, finalY + 8);
    } else {
      const radarRows = upcomingSubscriptions.map(sub => [
        sub.service_name,
        sub.billing_cycle,
        format(new Date(sub.next_due_date), "MMM d, yyyy"),
        `$${sub.amount.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: finalY + 5,
        head: [["Service", "Cycle", "Upcoming Date", "Amount"]],
        body: radarRows,
        theme: "plain",
        headStyles: {
          fillColor: false,
          textColor: primaryColor,
          fontStyle: "bold",
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
          textColor: textColor,
        },
        alternateRowStyles: {
          fillColor: "#F8FAFC",
        },
        columnStyles: {
          3: { halign: "right", fontStyle: "bold" }
        },
        margin: { left: 14, right: 14 },
      });
    }

    // ---- FOOTER ----
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(subtleColor);
      doc.text(
        `Page ${i} of ${pageCount} | Generated by Campus Coin`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    // Save PDF
    const filename = `CampusCoin_Statement_${format(now, "yyyy-MM")}.pdf`;
    doc.save(filename);
    
    toast.success("Statement downloaded successfully!", { id: loadingToast });
  } catch (error) {
    console.error("PDF generation failed:", error);
    toast.error("Failed to generate statement.", { id: loadingToast });
  }
};
