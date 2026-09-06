import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final bool isLarge;

  const StatusBadge({
    super.key,
    required this.status,
    this.isLarge = false,
  });

  Color _getStatusColor() {
    switch (status.toLowerCase()) {
      case 'shortlisted':
        return const Color(0xFF10B981); // Emerald
      case 'hired':
        return const Color(0xFF059669);
      case 'interview':
        return const Color(0xFF6366F1); // Indigo
      case 'rejected':
      case 'withdrawn':
        return const Color(0xFFEF4444); // Red
      case 'pending':
      default:
        return const Color(0xFFF59E0B); // Amber
    }
  }

  Color _getStatusBgColor() {
    switch (status.toLowerCase()) {
      case 'shortlisted':
        return const Color(0xFFECFDF5);
      case 'hired':
        return const Color(0xFFD1FAE5);
      case 'interview':
        return const Color(0xFFEEF2FF);
      case 'rejected':
      case 'withdrawn':
        return const Color(0xFFFEF2F2);
      case 'pending':
      default:
        return const Color(0xFFFFFBEB);
    }
  }

  IconData _getStatusIcon() {
    switch (status.toLowerCase()) {
      case 'shortlisted':
        return Icons.verified_rounded;
      case 'hired':
        return Icons.celebration_rounded;
      case 'interview':
        return Icons.calendar_month_rounded;
      case 'rejected':
        return Icons.cancel_rounded;
      case 'withdrawn':
        return Icons.remove_circle_outline_rounded;
      case 'pending':
      default:
        return Icons.hourglass_top_rounded;
    }
  }

  String _formatStatus() {
    if (status.isEmpty) return 'Pending';
    return status[0].toUpperCase() + status.substring(1);
  }

  @override
  Widget build(BuildContext context) {
    final color = _getStatusColor();
    final bgColor = _getStatusBgColor();

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isLarge ? 12 : 8,
        vertical: isLarge ? 6 : 4,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.25), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_getStatusIcon(), color: color, size: isLarge ? 15 : 12),
          const SizedBox(width: 4),
          Text(
            _formatStatus(),
            style: GoogleFonts.inter(
              fontSize: isLarge ? 13 : 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
