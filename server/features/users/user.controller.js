const User = require("../auth/User.model");
const CurrencyService = require("../../core/currency.service");
const { invalidateUserCache } = require("../../core/cacheMiddleware");
const { AppError } = require("../../core/errors");

/**
 * PUT /api/users/profile/currency
 * Switch user's preferred display currency ['USD', 'EUR', 'PKR']
 */
const updateCurrencyPreference = async (req, res, next) => {
  try {
    const rawCurrency = req.body.currency_preference || req.body.currency;
    const targetCurrency = rawCurrency ? rawCurrency.toUpperCase().trim() : null;

    if (!targetCurrency || !CurrencyService.isValidCurrency(targetCurrency)) {
      return next(
        new AppError(
          400,
          "ERR_VALIDATION_001",
          "Invalid currency preference. Allowed values are: USD, EUR, PKR"
        )
      );
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError(404, "ERR_AUTH_001", "User not found."));
    }

    user.currency_preference = targetCurrency;
    user.currency = targetCurrency;
    await user.save();

    // Invalidate cached reports and metrics so future queries recalculate in the new currency
    await invalidateUserCache(req.user._id);

    res.json({
      success: true,
      message: `Currency preference successfully updated to ${targetCurrency}.`,
      currency_preference: user.currency_preference,
      currency: user.currency,
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/profile
 * Retrieve user profile with preferred currency
 */
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError(404, "ERR_AUTH_001", "User not found."));
    }
    res.json({
      success: true,
      user,
      currency_preference: user.currency_preference,
    });
  } catch (err) {
    next(err);
  }
};

const Session = require("./Session.model");

/**
 * POST /api/users/heartbeat
 * Records active engagement heartbeat every 60 seconds.
 */
const recordHeartbeat = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const TIMEOUT_WINDOW_MS = 15 * 60 * 1000;

    let session = await Session.findOne({
      user_id: userId,
      is_active: true,
    }).sort({ last_ping: -1 });

    if (!session) {
      session = await Session.create({
        user_id: userId,
        login_time: now,
        last_ping: now,
        total_minutes_active: 1,
        is_active: true,
      });
    } else {
      const elapsedMs = now.getTime() - new Date(session.last_ping).getTime();

      if (elapsedMs > TIMEOUT_WINDOW_MS) {
        session.is_active = false;
        session.logout_time = session.last_ping;
        await session.save();

        session = await Session.create({
          user_id: userId,
          login_time: now,
          last_ping: now,
          total_minutes_active: 1,
          is_active: true,
        });
      } else {
        const deltaMinutes = Math.min(2, Math.max(0.5, elapsedMs / 60000));
        session.total_minutes_active = Math.round((session.total_minutes_active + deltaMinutes) * 10) / 10;
        session.last_ping = now;
        await session.save();
      }
    }

    res.json({
      success: true,
      session_id: session._id,
      total_minutes_active: session.total_minutes_active,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/logout-session
 * Closes the active session on explicit logout
 */
const endSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const session = await Session.findOne({
      user_id: userId,
      is_active: true,
    }).sort({ last_ping: -1 });

    if (session) {
      session.is_active = false;
      session.logout_time = now;
      await session.save();
    }

    res.json({ success: true, message: "Session ended." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateCurrencyPreference,
  getUserProfile,
  recordHeartbeat,
  endSession,
};
