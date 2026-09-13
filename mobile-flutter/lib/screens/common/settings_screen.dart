import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_text_field.dart';
import '../auth/login_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final ApiService _apiService = ApiService();

  bool _emailNotifs = true;
  bool _jobAlerts = true;
  bool _messageNotifs = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    try {
      final res = await _apiService.dio.get('/settings');
      final data = res.data is Map<String, dynamic> ? res.data : {};
      final prefs = data['preferences'] ?? {};
      if (mounted) {
        setState(() {
          _emailNotifs = prefs['email_notifications'] ?? true;
          _jobAlerts = prefs['job_alerts'] ?? true;
          _messageNotifs = prefs['message_notifications'] ?? true;
        });
      }
    } catch (_) {}
  }

  void _showChangePasswordDialog() {
    final currentPassController = TextEditingController();
    final newPassController = TextEditingController();
    final confirmPassController = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                left: 20,
                right: 20,
                top: 16,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 44,
                        height: 5,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(2.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Change Password',
                      style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: currentPassController,
                      label: 'Current Password',
                      hint: '••••••••',
                      obscureText: true,
                      prefixIcon: Icons.lock_outline_rounded,
                      validator: (v) => v == null || v.isEmpty ? 'Current password is required' : null,
                    ),
                    const SizedBox(height: 12),
                    AppTextField(
                      controller: newPassController,
                      label: 'New Password',
                      hint: '•••••••• (min 8 chars)',
                      obscureText: true,
                      prefixIcon: Icons.lock_reset_rounded,
                      validator: (v) => v == null || v.length < 8 ? 'Password must be at least 8 characters' : null,
                    ),
                    const SizedBox(height: 12),
                    AppTextField(
                      controller: confirmPassController,
                      label: 'Confirm New Password',
                      hint: '••••••••',
                      obscureText: true,
                      prefixIcon: Icons.lock_reset_rounded,
                      validator: (v) => v != newPassController.text ? 'Passwords do not match' : null,
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          minimumSize: const Size(double.infinity, 48),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: isSaving
                            ? null
                            : () async {
                                if (!formKey.currentState!.validate()) return;
                                setModalState(() => isSaving = true);
                                try {
                                  await _apiService.dio.put(
                                    '/settings/password',
                                    data: {
                                      'current_password': currentPassController.text,
                                      'password': newPassController.text,
                                      'password_confirmation': confirmPassController.text,
                                    },
                                  );
                                  if (!mounted) return;
                                  if (ctx.mounted) {
                                    Navigator.pop(ctx);
                                  }
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Password updated successfully!'),
                                      backgroundColor: Color(0xFF10B981),
                                    ),
                                  );
                                } catch (e) {
                                  setModalState(() => isSaving = false);
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(_apiService.handleDioError(e)),
                                        backgroundColor: AppTheme.error,
                                      ),
                                    );
                                  }
                                }
                              },
                        child: isSaving
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Text('Update Password', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showServerSettings() {
    final controller = TextEditingController(text: _apiService.baseUrl);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('API Server Host', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Set custom backend host URL for physical device / local network:',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'http://192.168.100.9:8000/api',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              style: GoogleFonts.inter(fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            onPressed: () async {
              await _apiService.updateBaseUrl(controller.text.trim());
              if (ctx.mounted) Navigator.pop(ctx);
              setState(() {});
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog() {
    final passwordController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Account', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.error)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This action is irreversible. All your profile data, applications, and messages will be permanently deleted.',
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: passwordController,
              obscureText: true,
              decoration: InputDecoration(
                hintText: 'Enter your password to confirm',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () async {
              try {
                await _apiService.dio.delete(
                  '/settings/account',
                  data: {'password': passwordController.text},
                );
                if (ctx.mounted) {
                  Navigator.pop(ctx);
                  await Provider.of<AuthProvider>(context, listen: false).logout();
                  if (mounted) {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (route) => false,
                    );
                  }
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(_apiService.handleDioError(e)), backgroundColor: AppTheme.error),
                );
              }
            },
            child: const Text('Permanently Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Sign Out', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        content: const Text('Are you sure you want to log out of RecruitSense?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.error,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthProvider>().logout();
              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Logout', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Account Settings', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Account Overview Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: const Color(0xFFEEF2FF),
                    child: Text(
                      (user?.name.isNotEmpty == true ? user!.name[0] : 'U').toUpperCase(),
                      style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF6366F1)),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user?.name ?? 'User', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700)),
                        Text(user?.email ?? '', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            (user?.role ?? 'job_seeker').toUpperCase(),
                            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF475569)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Security Section
            Text('Security & Credentials', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.lock_reset_rounded, color: Color(0xFF6366F1), size: 20),
                ),
                title: Text('Change Password', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                subtitle: Text('Update your login credentials', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
                onTap: _showChangePasswordDialog,
              ),
            ),

            const SizedBox(height: 20),

            // Notifications Section
            Text('Notifications & Alerts', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  SwitchListTile(
                    title: Text('Email Notifications', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                    subtitle: Text('Receive email alerts for interview updates', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                    value: _emailNotifs,
                    activeThumbColor: AppTheme.primary,
                    onChanged: (val) {
                      setState(() => _emailNotifs = val);
                      _apiService.dio.put('/settings/preferences', data: {'email_notifications': val});
                    },
                  ),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  SwitchListTile(
                    title: Text('Job Match Alerts', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                    subtitle: Text('Get notified when new matching roles open', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                    value: _jobAlerts,
                    activeThumbColor: AppTheme.primary,
                    onChanged: (val) {
                      setState(() => _jobAlerts = val);
                      _apiService.dio.put('/settings/preferences', data: {'job_alerts': val});
                    },
                  ),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  SwitchListTile(
                    title: Text('Direct Message Alerts', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                    subtitle: Text('In-app alerts for direct recruiter messages', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                    value: _messageNotifs,
                    activeThumbColor: AppTheme.primary,
                    onChanged: (val) {
                      setState(() => _messageNotifs = val);
                      _apiService.dio.put('/settings/preferences', data: {'message_notifications': val});
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Server Settings Section
            Text('Network & Environment', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.cloud_sync_rounded, color: Color(0xFF16A34A), size: 20),
                ),
                title: Text('API Server Host', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                subtitle: Text(_apiService.baseUrl, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)), maxLines: 1),
                trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
                onTap: _showServerSettings,
              ),
            ),

            const SizedBox(height: 20),

            // Account Actions Section
            Text('Account Actions', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.logout_rounded, color: Color(0xFF475569), size: 20),
                    ),
                    title: Text('Sign Out', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                    onTap: _handleLogout,
                  ),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.delete_forever_rounded, color: Color(0xFFEF4444), size: 20),
                    ),
                    title: Text('Delete Account', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFFEF4444))),
                    onTap: _showDeleteAccountDialog,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
