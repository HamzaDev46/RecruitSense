import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ScoreBadge extends StatelessWidget {
  final num? score;
  final String label;
  final bool isLarge;

  const ScoreBadge({
    super.key,
    required this.score,
    this.label = 'AI Score',
    this.isLarge = false,
  });

  Color _getScoreColor(num s) {
    if (s >= 80) return const Color(0xFF10B981); // Emerald Green
    if (s >= 60) return const Color(0xFF6366F1); // Indigo
    if (s >= 40) return const Color(0xFFF59E0B); // Amber
    return const Color(0xFFEF4444); // Red
  }

  Color _getScoreBgColor(num s) {
    if (s >= 80) return const Color(0xFFECFDF5);
    if (s >= 60) return const Color(0xFFEEF2FF);
    if (s >= 40) return const Color(0xFFFFFBEB);
    return const Color(0xFFFEF2F2);
  }

  @override
  Widget build(BuildContext context) {
    if (score == null) {
      return Container(
        padding: EdgeInsets.symmetric(
          horizontal: isLarge ? 12 : 8,
          vertical: isLarge ? 6 : 4,
        ),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade300, width: 1),
        ),
        child: Text(
          'Pending Assessment',
          style: GoogleFonts.inter(
            fontSize: isLarge ? 13 : 11,
            fontWeight: FontWeight.w500,
            color: Colors.grey.shade600,
          ),
        ),
      );
    }

    final double numericScore = score!.toDouble();
    final Color color = _getScoreColor(numericScore);
    final Color bgColor = _getScoreBgColor(numericScore);

    if (isLarge) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: color.withValues(alpha: 0.3), width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.auto_awesome, color: color, size: 16),
            const SizedBox(width: 6),
            Text(
              '$label: ${numericScore.toInt()}%',
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.25), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.auto_awesome, color: color, size: 13),
          const SizedBox(width: 4),
          Text(
            '${numericScore.toInt()}% Match',
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
