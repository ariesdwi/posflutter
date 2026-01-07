import 'category.dart';

class Product {
  final String id;
  final String name;
  final String? description;
  final double price;
  final int stock;
  final String? image;
  final String categoryId;
  final Category? category;

  Product({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.stock,
    this.image,
    required this.categoryId,
    this.category,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      // Backend returns price as string, need to parse it
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      stock: json['stock'] as int? ?? 0,
      // Backend uses 'imageUrl', not 'image'
      image: json['imageUrl'] as String? ?? json['image'] as String?,
      categoryId: json['categoryId'] as String? ?? '',
      category: json['category'] != null
          ? Category.fromJson(json['category'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'price': price,
    'stock': stock,
    'image': image,
    'categoryId': categoryId,
    'category': category?.toJson(),
  };

  bool get isAvailable => stock > 0;
}
