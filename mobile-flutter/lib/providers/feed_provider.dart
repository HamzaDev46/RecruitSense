import 'package:flutter/material.dart';
import '../models/post.dart';
import '../services/feed_service.dart';

class FeedProvider extends ChangeNotifier {
  final FeedService _feedService = FeedService();

  List<CommunityPost> _posts = [];
  bool _isLoading = false;
  bool _isCreating = false;
  String? _error;

  List<CommunityPost> get posts => _posts;
  bool get isLoading => _isLoading;
  bool get isCreating => _isCreating;
  String? get error => _error;

  Future<void> fetchFeed() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _posts = await _feedService.getFeed();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createPost(String content) async {
    _isCreating = true;
    notifyListeners();

    try {
      final newPost = await _feedService.createPost(content);
      _posts.insert(0, newPost);
      _isCreating = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isCreating = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> toggleLike(int postId) async {
    final index = _posts.indexWhere((p) => p.id == postId);
    if (index == -1) return;

    final currentPost = _posts[index];
    final willBeLiked = !currentPost.isLiked;
    final newCount = willBeLiked ? currentPost.likesCount + 1 : (currentPost.likesCount > 0 ? currentPost.likesCount - 1 : 0);

    // Optimistic UI update
    _posts[index] = currentPost.copyWith(
      isLiked: willBeLiked,
      likesCount: newCount,
    );
    notifyListeners();

    try {
      final confirmed = await _feedService.toggleLike(postId, currentPost.isLiked);
      if (confirmed != willBeLiked) {
        _posts[index] = currentPost.copyWith(
          isLiked: confirmed,
          likesCount: confirmed ? currentPost.likesCount + 1 : currentPost.likesCount,
        );
        notifyListeners();
      }
    } catch (e) {
      // Revert on failure
      _posts[index] = currentPost;
      notifyListeners();
    }
  }

  Future<void> toggleRepost(int postId) async {
    final index = _posts.indexWhere((p) => p.id == postId);
    if (index == -1) return;

    final currentPost = _posts[index];
    final willBeReposted = !currentPost.isReposted;
    final newCount = willBeReposted ? currentPost.repostsCount + 1 : (currentPost.repostsCount > 0 ? currentPost.repostsCount - 1 : 0);

    _posts[index] = currentPost.copyWith(
      isReposted: willBeReposted,
      repostsCount: newCount,
    );
    notifyListeners();

    try {
      final confirmed = await _feedService.toggleRepost(postId, currentPost.isReposted);
      if (confirmed != willBeReposted) {
        _posts[index] = currentPost.copyWith(
          isReposted: confirmed,
          repostsCount: confirmed ? currentPost.repostsCount + 1 : currentPost.repostsCount,
        );
        notifyListeners();
      }
    } catch (e) {
      _posts[index] = currentPost;
      notifyListeners();
    }
  }

  Future<bool> addComment(int postId, String content) async {
    final index = _posts.indexWhere((p) => p.id == postId);
    if (index == -1) return false;

    try {
      final comment = await _feedService.addComment(postId, content);
      final currentPost = _posts[index];
      final updatedComments = List<PostComment>.from(currentPost.comments)..add(comment);
      _posts[index] = currentPost.copyWith(
        comments: updatedComments,
        commentsCount: currentPost.commentsCount + 1,
      );
      notifyListeners();
      return true;
    } catch (e) {
      return false;
    }
  }
}
