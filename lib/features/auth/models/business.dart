class Business {
  final String id;
  final String name;
  final String? address;
  final String? phone;

  Business({required this.id, required this.name, this.address, this.phone});

  factory Business.fromJson(Map<String, dynamic> json) {
    return Business(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      address: json['address'] as String?,
      phone: json['phone'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'address': address,
    'phone': phone,
  };
}
