import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/message_provider.dart';
import '../providers/notification_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/company/applicants_pipeline_screen.dart';
import '../screens/company/candidate_discovery_screen.dart';
import '../screens/company/company_activity_log_screen.dart';
import '../screens/company/company_analytics_screen.dart';
import '../screens/company/company_dashboard_screen.dart';
import '../screens/company/company_interviews_screen.dart';
import '../screens/company/company_jobs_screen.dart';
import '../screens/company/company_quiz_bank_screen.dart';
import '../screens/company/company_settings_screen.dart';
import '../screens/jobseeker/messages_screen.dart';
import '../screens/jobseeker/notifications_screen.dart';
import 'recruitsense_logo.dart';

class CompanyDrawer extends StatelessWidget {
  final String currentRoute;

  const CompanyDrawer({
    super.key,
    this.currentRoute = 'dashboard',
  });

  void _handleLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Sign Out', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to sign out?', style: GoogleFonts.inter(fontSize: 14)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () async {
              Navigator.pop(ctx);
              await Provider.of<AuthProvider>(context, listen: false).logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Sign Out', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final messageProvider = context.watch<MessageProvider>();
    final notificationProvider = context.watch<NotificationProvider>();

    final user = authProvider.user;
    final companyProfile = user?.companyProfile;
    final companyName = companyProfile?.companyName ?? user?.name ?? 'Company Portal';
    final companyIndustry = companyProfile?.industry ?? 'Company panel';
    final companyLogo = companyProfile?.logoUrl;

    final unreadMessages = messageProvider.unreadCount;
    final unreadNotifications = notificationProvider.unreadCount;

    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // App Brand Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
              ),
              child: Row(
                children: [
                  const RecruitSenseLogo(iconSize: 28, fontSize: 16),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF64748B)),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Company Info Header
            InkWell(
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanySettingsScreen()));
              },
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: companyLogo != null && companyLogo.isNotEmpty
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Image.network(
                                companyLogo,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Center(
                                  child: Text(
                                    companyName.isNotEmpty ? companyName[0].toUpperCase() : 'C',
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
                                  ),
                                ),
                              ),
                            )
                          : Center(
                              child: Text(
                                companyName.isNotEmpty ? companyName[0].toUpperCase() : 'C',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
                              ),
                            ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            companyName,
                            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            companyIndustry,
                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: const Color(0xFF64748B)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 20),
                  ],
                ),
              ),
            ),

            // Navigation Items List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                children: [
                  _buildDrawerItem(
                    context,
                    icon: Icons.dashboard_rounded,
                    label: 'Dashboard',
                    isActive: currentRoute == 'dashboard',
                    onTap: () {
                      Navigator.pop(context);
                      if (currentRoute != 'dashboard') {
                        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const CompanyDashboardScreen()));
                      }
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.insights_rounded,
                    label: 'Analytics',
                    isActive: currentRoute == 'analytics',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyAnalyticsScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.history_rounded,
                    label: 'Activity',
                    isActive: currentRoute == 'activity',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyActivityLogScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.business_center_outlined,
                    label: 'Jobs',
                    isActive: currentRoute == 'jobs',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyJobsScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.people_outline_rounded,
                    label: 'Applicants',
                    isActive: currentRoute == 'applicants',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const ApplicantsPipelineScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.auto_awesome_rounded,
                    label: 'Find Talent',
                    isSpecial: true,
                    isActive: currentRoute == 'candidates',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const CandidateDiscoveryScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.calendar_month_outlined,
                    label: 'Interviews',
                    isActive: currentRoute == 'interviews',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyInterviewsScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.notifications_none_rounded,
                    label: 'Notifications',
                    badgeCount: unreadNotifications,
                    isActive: currentRoute == 'notifications',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.chat_bubble_outline_rounded,
                    label: 'Messages',
                    badgeCount: unreadMessages,
                    isActive: currentRoute == 'messages',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const MessagesScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.psychology_outlined,
                    label: 'Quiz Bank',
                    isActive: currentRoute == 'quiz',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyQuizBankScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.settings_outlined,
                    label: 'Settings',
                    isActive: currentRoute == 'settings',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanySettingsScreen()));
                    },
                  ),
                ],
              ),
            ),

            // Tip Banner (Matching Web Sidebar)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded, size: 16, color: Color(0xFF64748B)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Review applicants by score, quiz progress, and required skills.',
                        style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B)),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Logout Section
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
              ),
              child: InkWell(
                onTap: () => _handleLogout(context),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Row(
                    children: [
                      const Icon(Icons.logout_rounded, color: AppTheme.error, size: 20),
                      const SizedBox(width: 12),
                      Text(
                        'Logout',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.error,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    bool isActive = false,
    bool isSpecial = false,
    int badgeCount = 0,
    required VoidCallback onTap,
  }) {
    final activeBg = isSpecial
        ? const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)])
        : const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              gradient: isActive ? activeBg : null,
              color: isActive ? null : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  icon,
                  size: 20,
                  color: isActive
                      ? Colors.white
                      : (isSpecial ? const Color(0xFF6366F1) : const Color(0xFF64748B)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                      color: isActive
                          ? Colors.white
                          : (isSpecial ? const Color(0xFF4338CA) : const Color(0xFF334155)),
                    ),
                  ),
                ),
                if (badgeCount > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: isActive ? Colors.white : const Color(0xFFEF4444),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      badgeCount > 99 ? '99+' : '$badgeCount',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: isActive ? const Color(0xFF6366F1) : Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
