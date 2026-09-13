import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/theme.dart';
import '../services/api_service.dart';
import '../widgets/google_auth_button.dart';
import '../widgets/recruitsense_logo.dart';
import 'auth/login_screen.dart';
import 'auth/register_screen.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  void _showServerConfigDialog() {
    final apiService = ApiService();
    final controller = TextEditingController(text: apiService.baseUrl);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Server URL Config', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Backend API URL for physical device / emulator:',
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'http://192.168.100.9:8000/api',
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              style: GoogleFonts.inter(fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.inter(color: const Color(0xFF64748B))),
          ),
          ElevatedButton(
            onPressed: () async {
              final newUrl = controller.text.trim();
              if (newUrl.isNotEmpty) {
                await apiService.updateBaseUrl(newUrl);
                if (ctx.mounted) Navigator.pop(ctx);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Server URL set to: $newUrl'),
                      backgroundColor: const Color(0xFF10B981),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Save & Apply', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        titleSpacing: 20,
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const RecruitSenseLogo(iconSize: 34, fontSize: 19),
        actions: [
          IconButton(
            tooltip: 'Server Connection',
            icon: const Icon(Icons.settings_ethernet_rounded, color: Color(0xFF64748B), size: 22),
            onPressed: _showServerConfigDialog,
          ),
          TextButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
            child: Text(
              'Sign In',
              style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: const Color(0xFF6366F1), fontSize: 14),
            ),
          ),
          const SizedBox(width: 10),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ==========================================
            // 1. HERO SECTION
            // ==========================================
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // AI Badge Pill
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: const Color(0xFFC7D2FE)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.auto_awesome_rounded, size: 14, color: Color(0xFF6366F1)),
                        const SizedBox(width: 6),
                        Text(
                          'AI-powered career matching',
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF4F46E5)),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(duration: 400.ms),

                  const SizedBox(height: 16),

                  // Headline Title
                  Text(
                    'Welcome to your professional hiring community',
                    style: GoogleFonts.outfit(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      height: 1.15,
                      letterSpacing: -0.5,
                      color: const Color(0xFF0F172A),
                    ),
                  ).animate().fadeIn(delay: 100.ms, duration: 400.ms),

                  const SizedBox(height: 12),

                  Text(
                    'Find top AI-matched roles or discover qualified talent with precision skill gap analysis and automated screening.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: const Color(0xFF64748B),
                      height: 1.5,
                    ),
                  ).animate().fadeIn(delay: 150.ms, duration: 400.ms),

                  const SizedBox(height: 24),

                  // REAL GOOGLE OAUTH BUTTON
                  const GoogleAuthButton(
                    mode: GoogleAuthMode.continueWith,
                    role: 'jobseeker',
                    height: 52,
                  ).animate().fadeIn(delay: 200.ms, duration: 400.ms),

                  const SizedBox(height: 12),

                  // Sign Up with Email Button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        side: const BorderSide(color: Color(0xFF94A3B8), width: 1.2),
                        backgroundColor: Colors.white,
                      ),
                      icon: const Icon(Icons.mail_outline_rounded, size: 20, color: Color(0xFF334155)),
                      label: Text(
                        'Sign up with email',
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                      ),
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                    ),
                  ).animate().fadeIn(delay: 250.ms, duration: 400.ms),

                  const SizedBox(height: 12),

                  // Sign In to RecruitSense
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        elevation: 2,
                        shadowColor: const Color(0xFF6366F1).withValues(alpha: 0.3),
                      ),
                      icon: const Icon(Icons.arrow_forward_rounded, size: 20, color: Colors.white),
                      label: Text(
                        'Sign in to RecruitSense',
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
                    ),
                  ).animate().fadeIn(delay: 300.ms, duration: 400.ms),

                  const SizedBox(height: 14),

                  Center(
                    child: Text(
                      'By continuing, you agree to RecruitSense account terms. Google signup creates a verified candidate account.',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8), height: 1.3),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ==========================================
            // 2. HERO VISUAL SHOWCASE (INTERACTIVE CARD)
            // ==========================================
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Mock Window controls bar
                    Row(
                      children: [
                        Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFFFCA5A5), shape: BoxShape.circle)),
                        const SizedBox(width: 6),
                        Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFFFCD34D), shape: BoxShape.circle)),
                        const SizedBox(width: 6),
                        Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF86EFAC), shape: BoxShape.circle)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEEF2FF),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'AI LIVE ENGINE',
                            style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: const Color(0xFF4F46E5)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // AI Header
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.psychology_rounded, color: Colors.white, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('RecruitSense AI', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                            Text('Live job recommendation', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                          ],
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFA7F3D0)),
                          ),
                          child: Text(
                            '91% Match',
                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF059669)),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Job Title Box
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2FF),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFC7D2FE)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Frontend Developer', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E1B4B))),
                                const SizedBox(height: 2),
                                Text('Remote • Full time • Tech Ltd', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF4338CA))),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFF6366F1)),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Match Breakdown Grid
                    Row(
                      children: [
                        _buildMetricBox('Resume Score', '88%', const Color(0xFF6366F1)),
                        const SizedBox(width: 8),
                        _buildMetricBox('Skill Match', '94%', const Color(0xFF10B981)),
                        const SizedBox(width: 8),
                        _buildMetricBox('Soft Skills', '76%', const Color(0xFFF59E0B)),
                        const SizedBox(width: 8),
                        _buildMetricBox('Ready Jobs', '18', const Color(0xFF06B6D4)),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Verified badge row
                    Row(
                      children: [
                        const Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 16),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Verified hiring signals • 2,450+ profiles matched',
                            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF475569), fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 36),

            // ==========================================
            // 3. STATS SECTION (Stats.jsx parity)
            // ==========================================
            Container(
              color: const Color(0xFFF8FAFC),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                children: [
                  Text(
                    'PLATFORM HIGHLIGHTS',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: const Color(0xFF6366F1), letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Empowering Intelligent Recruitment',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 20),

                  Row(
                    children: [
                      _buildStatCard(Icons.people_alt_rounded, '1,000+', 'Active Candidates', const Color(0xFF6366F1)),
                      const SizedBox(width: 12),
                      _buildStatCard(Icons.domain_rounded, '50+', 'Companies Hiring', const Color(0xFF10B981)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildStatCard(Icons.work_rounded, '500+', 'Jobs Posted', const Color(0xFF06B6D4)),
                      const SizedBox(width: 12),
                      _buildStatCard(Icons.auto_awesome_rounded, '95%', 'AI Match Precision', const Color(0xFF8B5CF6)),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 36),

            // ==========================================
            // 4. HOW IT WORKS SECTION (HowItWorks.jsx parity)
            // ==========================================
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEEF2FF),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'HOW IT WORKS',
                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFF4F46E5), letterSpacing: 1.0),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Three Simple Steps',
                          style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Your personalized pathway to the perfect career match',
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  _buildStepCard(
                    stepNumber: '01',
                    title: 'Upload Resume',
                    description: 'Upload your PDF resume. Our AI extracts your skills, experience, and education automatically.',
                    gradientColors: [const Color(0xFF6366F1), const Color(0xFF4F46E5)],
                    icon: Icons.upload_file_rounded,
                  ),

                  const SizedBox(height: 14),

                  _buildStepCard(
                    stepNumber: '02',
                    title: 'Precision AI Matching',
                    description: 'Browse jobs and apply. AI instantly calculates semantic match scores and highlights skill gaps.',
                    gradientColors: [const Color(0xFF8B5CF6), const Color(0xFF7C3AED)],
                    icon: Icons.insights_rounded,
                  ),

                  const SizedBox(height: 14),

                  _buildStepCard(
                    stepNumber: '03',
                    title: 'Get Matched & Hired',
                    description: 'Take personality & soft-skill quizzes to earn transparent verified rank scores directly visible to top employers.',
                    gradientColors: [const Color(0xFF06B6D4), const Color(0xFF0891B2)],
                    icon: Icons.celebration_rounded,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 36),

            // ==========================================
            // 5. FEATURES SECTION (Features.jsx parity)
            // ==========================================
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'WHY RECRUITSENSE',
                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFF059669), letterSpacing: 1.0),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Cutting-Edge AI Features',
                          style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Engineered to modernize every stage of hiring',
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  _buildFeatureTile(
                    icon: Icons.psychology_rounded,
                    title: 'AI Resume Analysis',
                    desc: 'Deep NLP-based skill extraction and structured candidate profiling.',
                    color: const Color(0xFF6366F1),
                    bg: const Color(0xFFEEF2FF),
                  ),
                  const SizedBox(height: 10),
                  _buildFeatureTile(
                    icon: Icons.bar_chart_rounded,
                    title: 'Transparent Scoring',
                    desc: 'Clear breakdown of hard skills, soft skills, and experience fit.',
                    color: const Color(0xFF8B5CF6),
                    bg: const Color(0xFFF3E8FF),
                  ),
                  const SizedBox(height: 10),
                  _buildFeatureTile(
                    icon: Icons.track_changes_rounded,
                    title: 'Skill Gap Detection',
                    desc: 'Actionable guidance on which skills to learn to land target roles.',
                    color: const Color(0xFF06B6D4),
                    bg: const Color(0xFFECFEFF),
                  ),
                  const SizedBox(height: 10),
                  _buildFeatureTile(
                    icon: Icons.quiz_rounded,
                    title: 'Soft Skill Assessment',
                    desc: 'Interactive scenario-based quizzes measuring communication & leadership.',
                    color: const Color(0xFFF59E0B),
                    bg: const Color(0xFFFEF3C7),
                  ),
                  const SizedBox(height: 10),
                  _buildFeatureTile(
                    icon: Icons.bolt_rounded,
                    title: 'Instant Automated Matching',
                    desc: 'Real-time semantic vector matching the moment you apply.',
                    color: const Color(0xFF10B981),
                    bg: const Color(0xFFECFDF5),
                  ),
                  const SizedBox(height: 10),
                  _buildFeatureTile(
                    icon: Icons.security_rounded,
                    title: 'Fair & Unbiased Pipeline',
                    desc: 'Merit-based qualification matching ensuring transparent outcomes.',
                    color: const Color(0xFFF43F5E),
                    bg: const Color(0xFFFFE4E6),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 36),

            // ==========================================
            // 6. CALL TO ACTION (CTASection.jsx parity)
            // ==========================================
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.35),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 28),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Ready to Accelerate Your Career?',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Join thousands of candidates and forward-thinking companies connecting through RecruitSense.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.white.withValues(alpha: 0.85),
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF4F46E5),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                          elevation: 0,
                        ),
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                        child: Text(
                          'Create Free Account',
                          style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 40),

            // ==========================================
            // 7. FOOTER SECTION
            // ==========================================
            Container(
              width: double.infinity,
              color: const Color(0xFF0F172A),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const RecruitSenseLogo(iconSize: 32, fontSize: 18, isDark: true),
                  const SizedBox(height: 8),
                  Text(
                    'AI-Powered Smart Recruitment Platform',
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                  ),
                  const SizedBox(height: 20),
                  const Divider(color: Color(0xFF334155)),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Terms of Service', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                      const SizedBox(width: 16),
                      Text('•', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                      const SizedBox(width: 16),
                      Text('Privacy Policy', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                      const SizedBox(width: 16),
                      Text('•', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                      const SizedBox(width: 16),
                      Text('Security', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '© 2026 RecruitSense Inc. All rights reserved.',
                    style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricBox(String label, String value, Color accentColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            Text(label, style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B)), maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(value, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: accentColor)),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(IconData icon, String value, String label, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Text(value, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A))),
            const SizedBox(height: 2),
            Text(label, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B), fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  Widget _buildStepCard({
    required String stepNumber,
    required String title,
    required String description,
    required List<Color> gradientColors,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: gradientColors, begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Text(
                stepNumber,
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(title, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                    const Spacer(),
                    Icon(icon, size: 18, color: gradientColors.first),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), height: 1.45),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureTile({
    required IconData icon,
    required String title,
    required String desc,
    required Color color,
    required Color bg,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                const SizedBox(height: 2),
                Text(desc, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
