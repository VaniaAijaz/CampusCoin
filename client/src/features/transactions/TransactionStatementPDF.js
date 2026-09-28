import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { formatCurrency, getCurrencySymbol } from "../../utils/currencyUtils";
import toast from "react-hot-toast";

export const generateTransactionsPDF = async (user, transactions, filters = {}) => {
  const loadingToast = toast.loading("Generating Transactions PDF...");

  try {
    if (!transactions || transactions.length === 0) {
      toast.error("No transactions found to export.", { id: loadingToast });
      return;
    }

    const cur = user?.currency || "USD";
    const curSymbol = getCurrencySymbol(cur);

    // 1. Compute summary
    let totalInflow = 0;
    let totalOutflow = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") totalInflow += amt;
      else if (tx.type === "expense") totalOutflow += amt;
    });

    const netBalance = totalInflow - totalOutflow;

    // 2. Initialize jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Colors & Styling
    const primaryColor = "#2563EB"; // Royal Blue
    const textColor = "#0F172A"; // Slate 900
    const subtleColor = "#64748B"; // Slate 500
    const emeraldColor = "#16A34A"; // Emerald
    const roseColor = "#DC2626"; // Rose / Red

    // ---- HEADER ----
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text("Campus Coin", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(subtleColor);
    doc.text("Student Financial Management & Expense Ledger", 14, 26);

    // Title & Meta (Right aligned)
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor);
    doc.text("Transactions Ledger", pageWidth - 14, 20, { align: "right" });

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(subtleColor);
    doc.text(`Student: ${user?.name || "Campus Student"}`, pageWidth - 14, 26, { align: "right" });
    
    let genDateStr = "Today";
    try {
      genDateStr = format(new Date(), "MMM d, yyyy 'at' h:mm a");
    } catch {}
    doc.text(`Generated on: ${genDateStr}`, pageWidth - 14, 31, { align: "right" });

    // Horizontal Separator
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, pageWidth - 14, 36);

    // ---- FINANCIAL SUMMARY BOXES ----
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor);
    doc.text("Ledger Summary", 14, 44);

    const boxY = 48;
    const boxWidth = (pageWidth - 28 - 16) / 3;
    const boxHeight = 22;

    const drawSummaryBox = (x, title, amount, amountColor, prefix = "") => {
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, boxY, boxWidth, boxHeight, 3, 3, "FD");

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(subtleColor);
      doc.text(title.toUpperCase(), x + 8, boxY + 7);

      doc.setFontSize(11.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(amountColor);
      doc.text(`${prefix}${formatCurrency(amount, cur)}`, x + 8, boxY + 16);
    };

    drawSummaryBox(14, "Total Money In", totalInflow, emeraldColor, "+");
    drawSummaryBox(14 + boxWidth + 8, "Total Money Out", totalOutflow, roseColor, "-");
    drawSummaryBox(14 + (boxWidth + 8) * 2, "Net Difference", Math.abs(netBalance), netBalance >= 0 ? emeraldColor : roseColor, netBalance >= 0 ? "+" : "-");

    // ---- TRANSACTIONS TABLE ----
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor);
    doc.text(`Transaction Records (${transactions.length} items)`, 14, 80);

    const tableRows = transactions.map((tx) => {
      const isInc = tx.type === "income";
      const amtNum = Number(tx.amount) || 0;
      const formattedAmt = `${isInc ? "+" : "-"}${formatCurrency(amtNum, cur)}`;
      
      let dateStr = "N/A";
      try {
        if (tx.date) dateStr = format(new Date(tx.date), "MMM d, yyyy");
      } catch {}

      const catName = tx.categoryId?.name || tx.category || "General";
      const desc = tx.description || "-";
      const method = tx.paymentMethod || "Digital Bank";
      const typeStr = isInc ? "Income" : "Expense";

      return [
        dateStr,
        catName,
        desc,
        method,
        typeStr,
        {
          content: formattedAmt,
          styles: { textColor: isInc ? emeraldColor : textColor, fontStyle: "bold" },
        },
      ];
    });

    autoTable(doc, {
      startY: 84,
      head: [["Date", "Category", "Description", "Method", "Type", "Amount"]],
      body: tableRows,
      theme: "plain",
      headStyles: {
        fillColor: "#EFF6FF",
        textColor: primaryColor,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: textColor,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: "#F8FAFC",
      },
      columnStyles: {
        5: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });

    // ---- FOOTER ----
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(subtleColor);
      doc.text(
        `Page ${i} of ${pageCount} • Campus Coin Student Finance • Confidential`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    let dateFileName = "all";
    try {
      dateFileName = format(new Date(), "yyyy-MM-dd");
    } catch {}
    
    const filename = `CampusCoin_Transactions_${dateFileName}.pdf`;
    doc.save(filename);
    toast.success("PDF Statement downloaded successfully!", { id: loadingToast });
  } catch (error) {
    console.error("PDF generation error:", error);
    toast.error("Failed to generate PDF.", { id: loadingToast });
  }
};
