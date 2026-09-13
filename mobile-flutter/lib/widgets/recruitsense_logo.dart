import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class RecruitSenseLogo extends StatelessWidget {
  final double iconSize;
  final double? fontSize;
  final bool showText;
  final bool isDark;
  final MainAxisAlignment alignment;

  const RecruitSenseLogo({
    super.key,
    this.iconSize = 44,
    this.fontSize,
    this.showText = true,
    this.isDark = false,
    this.alignment = MainAxisAlignment.center,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveFontSize = fontSize ?? (iconSize * 0.58);

    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: alignment,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Brand Icon / Logo
        Container(
          width: iconSize,
          height: iconSize,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(iconSize * 0.26),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF6366F1).withValues(alpha: 0.35),
                blurRadius: iconSize * 0.3,
                offset: Offset(0, iconSize * 0.1),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(iconSize * 0.26),
            child: Image.asset(
              'assets/images/logo.png',
              width: iconSize,
              height: iconSize,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                // Fallback gradient badge
                return Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFF9333EA)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Icon(
                    Icons.psychology_rounded,
                    size: iconSize * 0.6,
                    color: Colors.white,
                  ),
                );
              },
            ),
          ),
        ),

        if (showText) ...[
          SizedBox(width: iconSize * 0.25),
          RichText(
            text: TextSpan(
              text: 'Recruit',
              style: GoogleFonts.outfit(
                fontSize: effectiveFontSize,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
              children: [
                TextSpan(
                  text: 'Sense',
                  style: GoogleFonts.outfit(
                    fontSize: effectiveFontSize,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                    color: const Color(0xFF6366F1),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
