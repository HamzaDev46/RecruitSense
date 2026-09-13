import 'dart:io';
import 'package:dio/dio.dart';
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

  Future<CommunityPost> createPost(
    String content, {
    List<String>? filePaths,
    String visibility = 'public',
  }) async {
    try {
      dynamic postData;

      if (filePaths != null && filePaths.isNotEmpty) {
        final formData = FormData();
        if (content.trim().isNotEmpty) {
          formData.fields.add(MapEntry('body', content.trim()));
        }
        formData.fields.add(MapEntry('visibility', visibility));

        for (final path in filePaths) {
          final file = File(path);
          if (await file.exists()) {
            final fileName = path.split(Platform.pathSeparator).last;
            formData.files.add(
              MapEntry(
                'media[]',
                await MultipartFile.fromFile(path, filename: fileName),
              ),
            );
          }
        }
        postData = formData;
      } else {
        postData = FormData.fromMap({
          'body': content.trim(),
          'visibility': visibility,
        });
      }

      final res = await _apiService.dio.post('/posts', data: postData);
      final postDataMap = res.data['post'] ?? res.data;
      return CommunityPost.fromJson(postDataMap as Map<String, dynamic>);
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
      final res = await _apiService.dio.post(
        '/posts/$postId/comments',
        data: {'body': content.trim()},
      );
      final postJson = res.data['post'];
      if (postJson != null && postJson['comments'] is List && (postJson['comments'] as List).isNotEmpty) {
        return PostComment.fromJson((postJson['comments'] as List).last as Map<String, dynamic>);
      }
      final commentData = res.data['comment'] ?? res.data;
      return PostComment.fromJson(commentData as Map<String, dynamic>);
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }
}
