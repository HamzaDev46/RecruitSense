import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/message_provider.dart';
import '../providers/network_provider.dart';
import '../providers/notification_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/common/settings_screen.dart';
import '../screens/jobseeker/job_alerts_screen.dart';
import '../screens/jobseeker/messages_screen.dart';
import '../screens/jobseeker/my_network_screen.dart';
import '../screens/jobseeker/notifications_screen.dart';
import '../screens/jobseeker/profile_screen.dart';
import '../screens/jobseeker/recommended_jobs_screen.dart';
import '../screens/jobseeker/resume_coach_screen.dart';
import '../screens/jobseeker/resume_upload_screen.dart';
import '../screens/jobseeker/saved_jobs_screen.dart';
import 'recruitsense_logo.dart';

class JobSeekerDrawer extends StatelessWidget {
  final int currentIndex;
  final Function(int)? onSelectTab;

  const JobSeekerDrawer({
    super.key,
    this.currentIndex = 0,
    this.onSelectTab,
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
    final networkProvider = context.watch<NetworkProvider>();
    final messageProvider = context.watch<MessageProvider>();
    final notificationProvider = context.watch<NotificationProvider>();

    final user = authProvider.user;
    final userName = user?.name ?? 'Job Seeker';
    final userRole = user?.role ?? 'jobseeker';
    final profileImage = user?.profileImageUrl;

    final pendingInvitations = networkProvider.pendingInvitations.length;
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

            // User Info Section (Matching Web)
            InkWell(
              onTap: () {
                Navigator.pop(context);
                if (onSelectTab != null) {
                  onSelectTab!(4);
                } else {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()));
                }
              },
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: const Color(0xFF6366F1),
                      backgroundImage: profileImage != null && profileImage.isNotEmpty
                          ? NetworkImage(profileImage)
                          : null,
                      onBackgroundImageError: profileImage != null && profileImage.isNotEmpty
                          ? (_, __) {}
                          : null,
                      child: profileImage == null || profileImage.isEmpty
                          ? Text(
                              userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
                            )
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            userName,
                            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            userRole.toUpperCase(),
                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF6366F1)),
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
                    icon: Icons.grid_view_rounded,
                    label: 'Dashboard',
                    isActive: currentIndex == 0,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab?.call(0);
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.feed_rounded,
                    label: 'Feed',
                    isActive: currentIndex == 2,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab?.call(2);
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.people_outline_rounded,
                    label: 'My Network',
                    badgeCount: pendingInvitations,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const MyNetworkScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.chat_bubble_outline_rounded,
                    label: 'Messages',
                    badgeCount: unreadMessages,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const MessagesScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.notifications_none_rounded,
                    label: 'Notifications',
                    badgeCount: unreadNotifications,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.work_outline_rounded,
                    label: 'Browse Jobs',
                    isActive: currentIndex == 1,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab?.call(1);
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.auto_awesome_rounded,
                    label: 'Recommended',
                    isSpecial: true,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const RecommendedJobsScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.notifications_active_outlined,
                    label: 'Job Alerts',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const JobAlertsScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.bookmark_outline_rounded,
                    label: 'Saved Jobs',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const SavedJobsScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.assignment_outlined,
                    label: 'My Applications',
                    isActive: currentIndex == 3,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab?.call(3);
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.description_outlined,
                    label: 'My Resume',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const ResumeUploadScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.psychology_outlined,
                    label: 'Resume Coach',
                    isSpecial: true,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const ResumeCoachScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.person_outline_rounded,
                    label: 'Profile',
                    isActive: currentIndex == 4,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab?.call(4);
                    },
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.settings_outlined,
                    label: 'Settings',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
                    },
                  ),
                ],
              ),
            ),

            // Logout Section
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
