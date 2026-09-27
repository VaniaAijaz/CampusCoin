const { getUserFinancialContext, generateAiResponse } = require("./chat.service");

/**
 * POST /api/chat/message
 * Handles sending a message to CampusCoin AI with full contextual grounding.
 */
const handleChatMessage = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid non-empty message is required.",
      });
    }

    // Limit message length to avoid malicious payload abuse
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message exceeds maximum allowed length of 2000 characters.",
      });
    }

    // Gathers authenticated student context if available
    let financialContext = null;
    if (req.user && req.user._id) {
      financialContext = await getUserFinancialContext(req.user._id);
    }

    const result = await generateAiResponse({
      message: message.trim(),
      history,
      user: req.user || null,
      financialContext,
    });

    return res.json({
      success: true,
      reply: result.reply,
      isConfigured: result.isConfigured,
      modelUsed: result.modelUsed || "gemini",
      timestamp: new Date().toISOString(),
      hasUserContext: Boolean(financialContext),
    });
  } catch (err) {
    console.error("Chat controller error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing your message.",
      reply:
        "⚠️ **CampusCoin AI Encountered an Issue**\n\nI ran into an unexpected glitch. Please try again shortly.",
    });
  }
};

/**
 * GET /api/chat/suggestions
 * Returns suggested prompt questions based on student context.
 */
const getSuggestions = async (req, res) => {
  try {
    const isAuthenticated = Boolean(req.user);

    if (isAuthenticated) {
      return res.json({
        success: true,
        suggestions: [
          { label: "📊 Month Spending", prompt: "How much have I spent so far this month?" },
          { label: "🍕 Food Spending", prompt: "What is my spending on food and dining this month?" },
          { label: "🎯 Budget Status", prompt: "How are my monthly category budgets looking?" },
          { label: "💡 Saving Advice", prompt: "Based on my current spending, how can I save more money?" },
          { label: "🤝 Khata Debts", prompt: "Do I have any pending peer debts or IOUs in Khata?" },
          { label: "📈 Spending Velocity", prompt: "What is my daily burn rate and projected month-end expense?" },
        ],
      });
    }

    return res.json({
      success: true,
      suggestions: [
        { label: "✨ What is CampusCoin?", prompt: "What is CampusCoin and how does it help students?" },
        { label: "💡 Student Saving Tips", prompt: "What are the best budgeting tips for college students?" },
        { label: "🎯 How Budgets Work", prompt: "How do monthly budgets and category limits work in CampusCoin?" },
        { label: "🤝 What is Khata?", prompt: "What is the Khata peer ledger feature?" },
      ],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  handleChatMessage,
  getSuggestions,
};
