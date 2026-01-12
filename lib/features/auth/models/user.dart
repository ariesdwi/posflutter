import 'business.dart';

class User {
  final String id;
  final String email;
  final String name;
  final String role;
  final bool isActive;
  final String? businessId;
  final Business? business;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.isActive,
    this.businessId,
    this.business,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      name: json['name'] as String? ?? '',
      role: json['role'] as String? ?? '',
      isActive: json['isActive'] as bool? ?? true,
      businessId: json['businessId'] as String?,
      business: json['business'] != null
          ? Business.fromJson(json['business'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'name': name,
    'role': role,
    'isActive': isActive,
    'businessId': businessId,
    'business': business?.toJson(),
  };
}
