import 'user.dart';

class PostComment {
  final int id;
  final int postId;
  final int userId;
  final String content;
  final DateTime? createdAt;
  final User? user;

  PostComment({
    required this.id,
    required this.postId,
    required this.userId,
    required this.content,
    this.createdAt,
    this.user,
  });

  factory PostComment.fromJson(Map<String, dynamic> json) {
    return PostComment(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      postId: json['post_id'] is int ? json['post_id'] : int.tryParse(json['post_id'].toString()) ?? 0,
      userId: json['user_id'] is int ? json['user_id'] : int.tryParse(json['user_id'].toString()) ?? 0,
      content: json['content'] ?? '',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      user: json['user'] != null ? User.fromJson(json['user']) : null,
    );
  }
}

class CommunityPost {
  final int id;
  final int userId;
  final String content;
  final String? image;
  final int likesCount;
  final int commentsCount;
  final int repostsCount;
  final bool isLiked;
  final bool isReposted;
  final DateTime? createdAt;
  final User? author;
  final List<PostComment> comments;

  CommunityPost({
    required this.id,
    required this.userId,
    required this.content,
    this.image,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.repostsCount = 0,
    this.isLiked = false,
    this.isReposted = false,
    this.createdAt,
    this.author,
    this.comments = const [],
  });

  CommunityPost copyWith({
    bool? isLiked,
    int? likesCount,
    bool? isReposted,
    int? repostsCount,
    List<PostComment>? comments,
    int? commentsCount,
  }) {
    return CommunityPost(
      id: id,
      userId: userId,
      content: content,
      image: image,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      repostsCount: repostsCount ?? this.repostsCount,
      isLiked: isLiked ?? this.isLiked,
      isReposted: isReposted ?? this.isReposted,
      createdAt: createdAt,
      author: author,
      comments: comments ?? this.comments,
    );
  }

  factory CommunityPost.fromJson(Map<String, dynamic> json) {
    User? authorObj;
    if (json['user'] != null && json['user'] is Map<String, dynamic>) {
      authorObj = User.fromJson(json['user']);
    } else if (json['author'] != null && json['author'] is Map<String, dynamic>) {
      authorObj = User.fromJson(json['author']);
    }

    List<PostComment> parsedComments = [];
    if (json['comments'] != null && json['comments'] is List) {
      parsedComments = (json['comments'] as List)
          .map((c) => PostComment.fromJson(c as Map<String, dynamic>))
          .toList();
    }

    return CommunityPost(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      userId: json['user_id'] is int ? json['user_id'] : int.tryParse(json['user_id'].toString()) ?? 0,
      content: json['content'] ?? '',
      image: json['image'] ?? json['image_url'],
      likesCount: json['likes_count'] ?? json['likesCount'] ?? 0,
      commentsCount: json['comments_count'] ?? json['commentsCount'] ?? parsedComments.length,
      repostsCount: json['reposts_count'] ?? json['repostsCount'] ?? 0,
      isLiked: json['is_liked'] ?? json['isLiked'] ?? false,
      isReposted: json['is_reposted'] ?? json['isReposted'] ?? false,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      author: authorObj,
      comments: parsedComments,
    );
  }
}
