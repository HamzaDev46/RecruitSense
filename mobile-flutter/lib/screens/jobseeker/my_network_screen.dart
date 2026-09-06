import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/network_user.dart';
import '../../models/user.dart';
import '../../providers/network_provider.dart';
import 'chat_detail_screen.dart';

class MyNetworkScreen extends StatefulWidget {
  const MyNetworkScreen({super.key});

  @override
  State<MyNetworkScreen> createState() => _MyNetworkScreenState();
}

class _MyNetworkScreenState extends State<MyNetworkScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NetworkProvider>().fetchNetworkData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final net = context.watch<NetworkProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'My Network',
          style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF6366F1),
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: const Color(0xFF6366F1),
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
          tabs: [
            Tab(text: 'Suggestions (${net.suggestions.length})'),
            Tab(text: 'Invitations (${net.invitations.length})'),
            Tab(text: 'Connections (${net.connections.length})'),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => net.fetchNetworkData(),
        color: const Color(0xFF6366F1),
        child: net.isLoading && net.suggestions.isEmpty && net.connections.isEmpty
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
            : TabBarView(
                controller: _tabController,
                children: [
                  // Suggestions Tab
                  _buildSuggestionsList(net.suggestions),

                  // Invitations Tab
                  _buildInvitationsList(net.invitations),

                  // Connections Tab
                  _buildConnectionsList(net.connections),
                ],
              ),
      ),
    );
  }

  Widget _buildSuggestionsList(List<User> suggestions) {
    if (suggestions.isEmpty) {
      return Center(
        child: Text(
          'No new recommendations right now.',
          style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 14),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: suggestions.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (ctx, i) {
        final user = suggestions[i];
        final initial = user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U';

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: const Color(0xFF6366F1),
                child: Text(
                  initial,
                  style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.name,
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      user.role == 'company' ? 'Recruiter' : 'Software Professional',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: () async {
                  final success = await context.read<NetworkProvider>().sendConnectRequest(user.id);
                  if (success && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Connection request sent to ${user.name}')),
                    );
                  }
                },
                icon: const Icon(Icons.person_add_rounded, size: 16),
                label: Text('Connect', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEEF2FF),
                  foregroundColor: const Color(0xFF6366F1),
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  minimumSize: const Size(0, 36),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInvitationsList(List<NetworkInvitation> invitations) {
    if (invitations.isEmpty) {
      return Center(
        child: Text(
          'No pending invitations.',
          style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 14),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: invitations.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (ctx, i) {
        final inv = invitations[i];
        final sender = inv.sender;
        final initial = sender.name.isNotEmpty ? sender.name[0].toUpperCase() : 'U';

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: const Color(0xFF8B5CF6),
                child: Text(
                  initial,
                  style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      sender.name,
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      'Wants to connect',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Color(0xFFEF4444), size: 20),
                    onPressed: () => context.read<NetworkProvider>().rejectInvitation(inv.id),
                  ),
                  IconButton(
                    icon: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 24),
                    onPressed: () => context.read<NetworkProvider>().acceptInvitation(inv.id),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildConnectionsList(List<NetworkConnection> connections) {
    if (connections.isEmpty) {
      return Center(
        child: Text(
          'No connections yet. Grow your network from Suggestions!',
          style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 14),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: connections.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (ctx, i) {
        final conn = connections[i];
        final user = conn.user;
        final initial = user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U';

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: const Color(0xFF10B981),
                child: Text(
                  initial,
                  style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.name,
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      user.role == 'company' ? 'Company Recruiter' : 'Connected Member',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF6366F1), size: 20),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ChatDetailScreen(otherUser: user),
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
