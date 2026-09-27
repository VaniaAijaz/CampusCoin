const express = require("express");
const router = express.Router();
const { handleChatMessage, getSuggestions } = require("./chat.controller");
const { optionalProtect } = require("../../core/authMiddleware");

// POST /api/chat/message - Send a message to CampusCoin AI (supports optional auth)
router.post("/message", optionalProtect, handleChatMessage);

// GET /api/chat/suggestions - Get contextual question chips
router.get("/suggestions", optionalProtect, getSuggestions);

module.exports = router;
