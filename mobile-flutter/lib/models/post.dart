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
    User? userObj;
    if (json['author'] != null && json['author'] is Map<String, dynamic>) {
      userObj = User.fromJson(json['author']);
    } else if (json['user'] != null && json['user'] is Map<String, dynamic>) {
      userObj = User.fromJson(json['user']);
    }

    return PostComment(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      postId: json['post_id'] is int ? json['post_id'] : int.tryParse(json['post_id'].toString()) ?? 0,
      userId: json['user_id'] is int ? json['user_id'] : int.tryParse(json['user_id'].toString()) ?? 0,
      content: json['body'] ?? json['content'] ?? '',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      user: userObj,
    );
  }
}

class CommunityPost {
  final int id;
  final int userId;
  final String content;
  final String? image;
  final List<String> mediaUrls;
  final String visibility;
  final int likesCount;
  final int commentsCount;
  final int repostsCount;
  final bool isLiked;
  final bool isReposted;
  final bool isRepost;
  final bool canDelete;
  final bool canEdit;
  final DateTime? createdAt;
  final User? author;
  final CommunityPost? originalPost;
  final List<PostComment> comments;

  CommunityPost({
    required this.id,
    required this.userId,
    required this.content,
    this.image,
    this.mediaUrls = const [],
    this.visibility = 'public',
    this.likesCount = 0,
    this.commentsCount = 0,
    this.repostsCount = 0,
    this.isLiked = false,
    this.isReposted = false,
    this.isRepost = false,
    this.canDelete = false,
    this.canEdit = false,
    this.createdAt,
    this.author,
    this.originalPost,
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
      mediaUrls: mediaUrls,
      visibility: visibility,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      repostsCount: repostsCount ?? this.repostsCount,
      isLiked: isLiked ?? this.isLiked,
      isReposted: isReposted ?? this.isReposted,
      isRepost: isRepost,
      canDelete: canDelete,
      canEdit: canEdit,
      createdAt: createdAt,
      author: author,
      originalPost: originalPost,
      comments: comments ?? this.comments,
    );
  }

  factory CommunityPost.fromJson(Map<String, dynamic> json) {
    User? authorObj;
    if (json['author'] != null && json['author'] is Map<String, dynamic>) {
      authorObj = User.fromJson(json['author']);
    } else if (json['user'] != null && json['user'] is Map<String, dynamic>) {
      authorObj = User.fromJson(json['user']);
    }

    List<PostComment> parsedComments = [];
    if (json['comments'] != null && json['comments'] is List) {
      parsedComments = (json['comments'] as List)
          .map((c) => PostComment.fromJson(c as Map<String, dynamic>))
          .toList();
    }

    List<String> mediaList = [];
    if (json['media'] != null && json['media'] is List) {
      for (var item in (json['media'] as List)) {
        if (item is Map && item['url'] != null) {
          mediaList.add(item['url'].toString());
        } else if (item is String && item.isNotEmpty) {
          mediaList.add(item);
        }
      }
    } else if (json['image'] != null && json['image'].toString().isNotEmpty) {
      mediaList.add(json['image'].toString());
    } else if (json['image_url'] != null && json['image_url'].toString().isNotEmpty) {
      mediaList.add(json['image_url'].toString());
    }

    CommunityPost? origPost;
    if (json['original_post'] != null && json['original_post'] is Map<String, dynamic>) {
      origPost = CommunityPost.fromJson(json['original_post']);
    }

    return CommunityPost(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      userId: json['user_id'] is int ? json['user_id'] : int.tryParse(json['user_id'].toString()) ?? (authorObj?.id ?? 0),
      content: json['body'] ?? json['content'] ?? '',
      image: mediaList.isNotEmpty ? mediaList.first : null,
      mediaUrls: mediaList,
      visibility: json['visibility'] ?? 'public',
      likesCount: json['likes_count'] ?? json['likesCount'] ?? 0,
      commentsCount: json['comments_count'] ?? json['commentsCount'] ?? parsedComments.length,
      repostsCount: json['reposts_count'] ?? json['repostsCount'] ?? 0,
      isLiked: json['is_liked'] ?? json['isLiked'] ?? false,
      isReposted: json['is_reposted'] ?? json['isReposted'] ?? false,
      isRepost: json['is_repost'] == true || json['repost_of_id'] != null,
      canDelete: json['can_delete'] == true,
      canEdit: json['can_edit'] == true,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      author: authorObj,
      originalPost: origPost,
      comments: parsedComments,
    );
  }
}
