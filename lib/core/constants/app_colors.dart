import 'package:flutter/material.dart';

/// App Color Palette - Modern Casual & Professional Theme
class AppColors {
  // Brand Colors (Modern Indigo & Slate)
  static const Color indigo500 = Color(0xFF6366F1); // Primary
  static const Color sky500 = Color(0xFF0EA5E9); // Secondary
  static const Color slate50 = Color(0xFFF8FAFC); // Background
  static const Color slate900 = Color(0xFF0F172A); // Text Primary
  static const Color slate500 = Color(0xFF64748B); // Text Secondary
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate200 = Color(0xFFE2E8F0); // Border/Divider
  static const Color slate100 = Color(0xFFF1F5F9);

  // Semantic Colors
  static const Color primary = indigo500;
  static const Color secondary = sky500;
  static const Color background = slate50;
  static const Color surface = Colors.white;
  static const Color textPrimary = slate900;
  static const Color textSecondary = slate500;

  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color error = Color(0xFFF43F5E); // Rose 500
  static const Color warning = Color(0xFFF59E0B); // Amber 500

  // UI Element Colors
  static const Color cardBackground = surface;
  static const Color divider = slate200;
  static const Color shadow = Color(0x0D0F172A); // Subtle slate shadow

  // Backward Compatibility (Mapped to new professional palette)
  static const Color warmRed = primary; // Now Indigo
  static const Color cream = background; // Now Slate 50
  static const Color darkBrown = textPrimary; // Now Slate 900
  static const Color oliveGreen = success; // Now Emerald
  static const Color goldAccent = warning; // Now Amber

  // Status Colors
  static const Color statusCompleted = success;
  static const Color statusPending = warning;
  static const Color statusCancelled = error;

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [indigo500, Color(0xFF4F46E5)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [sky500, Color(0xFF0284C7)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
