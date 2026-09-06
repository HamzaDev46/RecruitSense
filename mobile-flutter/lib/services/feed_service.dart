import '../models/post.dart';
import 'api_service.dart';

class FeedService {
  final ApiService _apiService = ApiService();

  Future<List<CommunityPost>> getFeed() async {
    try {
      final res = await _apiService.dio.get('/posts/feed');
      final data = res.data;
      if (data is List) {
        return data.map((json) => CommunityPost.fromJson(json as Map<String, dynamic>)).toList();
      } else if (data is Map && data['data'] is List) {
        return (data['data'] as List)
            .map((json) => CommunityPost.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<CommunityPost> createPost(String content) async {
    try {
      final res = await _apiService.dio.post('/posts', data: {'content': content});
      final postData = res.data['post'] ?? res.data;
      return CommunityPost.fromJson(postData as Map<String, dynamic>);
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<void> deletePost(int postId) async {
    try {
      await _apiService.dio.delete('/posts/$postId');
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<bool> toggleLike(int postId, bool currentlyLiked) async {
    try {
      if (currentlyLiked) {
        await _apiService.dio.delete('/posts/$postId/like');
        return false;
      } else {
        await _apiService.dio.post('/posts/$postId/like');
        return true;
      }
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<bool> toggleRepost(int postId, bool currentlyReposted) async {
    try {
      if (currentlyReposted) {
        await _apiService.dio.delete('/posts/$postId/repost');
        return false;
      } else {
        await _apiService.dio.post('/posts/$postId/repost');
        return true;
      }
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<PostComment> addComment(int postId, String content) async {
    try {
      final res = await _apiService.dio.post('/posts/$postId/comments', data: {'content': content});
      final commentData = res.data['comment'] ?? res.data;
      return PostComment.fromJson(commentData as Map<String, dynamic>);
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }
}
