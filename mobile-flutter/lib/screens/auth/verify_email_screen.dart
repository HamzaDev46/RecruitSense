import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/recruitsense_logo.dart';
import '../company/company_dashboard_screen.dart';
import '../jobseeker/jobseeker_nav_screen.dart';

class VerifyEmailScreen extends StatefulWidget {
  final int userId;
  final String email;

  const VerifyEmailScreen({
    super.key,
    required this.userId,
    required this.email,
  });

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final _tokenController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  bool _isResending = false;

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _handleVerify() async {
    final token = _tokenController.text.trim();
    if (token.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the activation token')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final res = await _apiService.dio.post(
        '/verify-email',
        data: {
          'id': widget.userId,
          'email': widget.email,
          'token': token,
        },
      );

      final data = res.data;
      if (data['token'] != null && data['user'] != null) {
        final authToken = data['token'];
        final user = User.fromJson(data['user']);
        if (!mounted) return;
        final authProvider = context.read<AuthProvider>();
        await authProvider.setAuthSession(token: authToken, user: user);

        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? 'Email verified successfully!'),
            backgroundColor: const Color(0xFF10B981),
          ),
        );

        if (user.role == 'company') {
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
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_apiService.handleDioError(e)),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  Future<void> _handleResend() async {
    setState(() => _isResending = true);
    try {
      await _apiService.dio.post(
        '/resend-verification',
        data: {'email': widget.email},
      );
      if (mounted) {
        setState(() => _isResending = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('New verification link sent to your email!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isResending = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_apiService.handleDioError(e)),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text('Verify Email', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const RecruitSenseLogo(iconSize: 44, alignment: MainAxisAlignment.start),
              const SizedBox(height: 16),
              Text(
                'Verify your email',
                style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A)),
              ),
              const SizedBox(height: 6),
              Text(
                'We sent an activation link & token to ${widget.email}. Enter the token below to activate your account.',
                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B), height: 1.4),
              ),
              const SizedBox(height: 24),

              AppTextField(
                controller: _tokenController,
                label: 'Verification Token',
                hint: 'Paste activation token from email',
                prefixIcon: Icons.verified_user_outlined,
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isLoading ? null : _handleVerify,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : Text(
                        'Verify & Continue',
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
              ),
              const SizedBox(height: 16),

              Center(
                child: TextButton(
                  onPressed: _isResending ? null : _handleResend,
                  child: Text(
                    _isResending ? 'Sending...' : 'Resend Verification Email',
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.primary),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
