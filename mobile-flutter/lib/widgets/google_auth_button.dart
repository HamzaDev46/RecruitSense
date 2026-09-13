import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../screens/company/company_dashboard_screen.dart';
import '../screens/jobseeker/jobseeker_nav_screen.dart';

enum GoogleAuthMode { continueWith, signIn, signUp }

class GoogleAuthButton extends StatefulWidget {
  final GoogleAuthMode mode;
  final String? role; // 'jobseeker' or 'company'
  final VoidCallback? onSuccess;
  final double height;
  final bool promptRoleIfNew;

  const GoogleAuthButton({
    super.key,
    this.mode = GoogleAuthMode.continueWith,
    this.role,
    this.onSuccess,
    this.height = 52,
    this.promptRoleIfNew = false,
  });

  @override
  State<GoogleAuthButton> createState() => _GoogleAuthButtonState();
}

class _GoogleAuthButtonState extends State<GoogleAuthButton> {
  bool _isLoading = false;

  String get _buttonText {
    switch (widget.mode) {
      case GoogleAuthMode.signIn:
        return 'Sign in with Google';
      case GoogleAuthMode.signUp:
        return 'Sign up with Google';
      case GoogleAuthMode.continueWith:
        return 'Continue with Google';
    }
  }

  Future<void> _handleGoogleSignIn() async {
    if (_isLoading) return;

    String? selectedRole = widget.role;

    if (widget.promptRoleIfNew && selectedRole == null) {
      selectedRole = await _showRoleSelectionDialog();
      if (selectedRole == null || !mounted) return; // User cancelled role selection
    }

    // Default to jobseeker if not specified, matching web app behavior
    selectedRole ??= 'jobseeker';

    setState(() => _isLoading = true);
    final authProvider = context.read<AuthProvider>();

    try {
      final result = await authProvider.signInWithGoogle(role: selectedRole);

      if (!mounted) return;
      setState(() => _isLoading = false);

      if (result['success'] == true) {
        final user = authProvider.user;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Welcome to RecruitSense, ${user?.name ?? 'there'}!'),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
          ),
        );

        if (widget.onSuccess != null) {
          widget.onSuccess!();
        } else {
          if (authProvider.isCompany) {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const CompanyDashboardScreen()),
              (route) => false,
            );
          } else {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const JobSeekerNavScreen()),
              (route) => false,
            );
          }
        }
      } else {
        if (result['cancelled'] == true) {
          // User cancelled the Google account picker
          return;
        }

        final errorMsg = result['error'] ?? 'Google sign-in failed. Please try again.';
        _showErrorFeedback(errorMsg);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      _showErrorFeedback(e.toString());
    }
  }

  void _showErrorFeedback(String error) {
    if (error.contains('10') || error.contains('ApiException: 10')) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              const GoogleVectorIcon(size: 24),
              const SizedBox(width: 10),
              Text('Google Sign-In Setup', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 17)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Google Play Services returned Developer Error (10).',
                style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: const Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),
              Text(
                'To allow Google Sign-In on Android, your debug SHA-1 fingerprint needs to be added to Google Cloud Console once.',
                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), height: 1.4),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: SelectableText(
                  'Package: com.recruitsense.recruitsense_mobile\nSHA-1: 9B:57:00:C7:08:D4:1E:F5:5E:7C:9A:22:B2:D5:7E:A4:20:43:C7:8C',
                  style: GoogleFonts.jetBrainsMono(fontSize: 10, color: const Color(0xFF334155)),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('Got It', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Google Sign-In: $error'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<String?> _showRoleSelectionDialog() async {
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Choose Account Type',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Select how you would like to use RecruitSense:',
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
            ),
            const SizedBox(height: 16),
            ListTile(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.person_outline_rounded, color: Color(0xFF6366F1)),
              ),
              title: Text('Job Seeker', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15)),
              subtitle: Text('Apply to AI-matched roles & test skills', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
              onTap: () => Navigator.pop(ctx, 'jobseeker'),
            ),
            const SizedBox(height: 10),
            ListTile(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.business_outlined, color: Color(0xFF10B981)),
              ),
              title: Text('Company / Employer', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15)),
              subtitle: Text('Post jobs and hire qualified talent', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
              onTap: () => Navigator.pop(ctx, 'company'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: widget.height,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.2),
          backgroundColor: Colors.white,
          elevation: 0,
        ),
        onPressed: _isLoading ? null : _handleGoogleSignIn,
        child: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF4285F4)),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const GoogleVectorIcon(size: 20),
                  const SizedBox(width: 10),
                  Text(
                    _buttonText,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

/// Standalone authentic Google Vector 'G' Logo
class GoogleVectorIcon extends StatelessWidget {
  final double size;

  const GoogleVectorIcon({super.key, this.size = 20});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _GoogleLogoPainter(),
      ),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width;
    final double h = size.height;
    final center = Offset(w / 2, h / 2);
    final radius = w / 2;

    // Red Path (Top-Left)
    final redPaint = Paint()
      ..color = const Color(0xFFEA4335)
      ..style = PaintingStyle.fill;
    final redPath = Path()
      ..moveTo(center.dx, center.dy)
      ..lineTo(center.dx - radius * 0.72, center.dy - radius * 0.72)
      ..arcTo(
        Rect.fromCircle(center: center, radius: radius),
        -2.356, // -135 deg
        1.571,  // 90 deg
        false,
      )
      ..close();
    canvas.drawPath(redPath, redPaint);

    // Yellow Path (Bottom-Left)
    final yellowPaint = Paint()
      ..color = const Color(0xFFFBBC05)
      ..style = PaintingStyle.fill;
    final yellowPath = Path()
      ..moveTo(center.dx, center.dy)
      ..lineTo(center.dx - radius, center.dy)
      ..arcTo(
        Rect.fromCircle(center: center, radius: radius),
        3.14159, // 180 deg
        -1.571,  // -90 deg
        false,
      )
      ..close();
    canvas.drawPath(yellowPath, yellowPaint);

    // Green Path (Bottom-Right)
    final greenPaint = Paint()
      ..color = const Color(0xFF34A853)
      ..style = PaintingStyle.fill;
    final greenPath = Path()
      ..moveTo(center.dx, center.dy)
      ..lineTo(center.dx, center.dy + radius)
      ..arcTo(
        Rect.fromCircle(center: center, radius: radius),
        1.571, // 90 deg
        -1.571, // -90 deg
        false,
      )
      ..close();
    canvas.drawPath(greenPath, greenPaint);

    // Blue Path (Right & Middle bar)
    final bluePaint = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;
    final bluePath = Path()
      ..moveTo(center.dx, center.dy)
      ..lineTo(center.dx + radius, center.dy)
      ..arcTo(
        Rect.fromCircle(center: center, radius: radius),
        0,
        1.571, // 90 deg
        false,
      )
      ..close();
    canvas.drawPath(bluePath, bluePaint);

    // Inner cutout white circle
    final whitePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius * 0.58, whitePaint);

    // Blue horizontal bar
    final barRect = Rect.fromLTRB(center.dx - radius * 0.05, center.dy - radius * 0.22, center.dx + radius, center.dy + radius * 0.22);
    canvas.drawRect(barRect, bluePaint);

    // Top-right cutout wedge to create official G shape opening
    final openingPath = Path()
      ..moveTo(center.dx, center.dy)
      ..lineTo(center.dx + radius, center.dy)
      ..lineTo(center.dx + radius, center.dy - radius * 0.7)
      ..lineTo(center.dx, center.dy)
      ..close();
    canvas.drawPath(openingPath, whitePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
