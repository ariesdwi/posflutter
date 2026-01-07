// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:pos_flutter/main.dart';

void main() {
  testWidgets('POS Flutter app starts', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    // Mock SharedPreferences for testing
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    
    await tester.pumpWidget(MyApp(prefs: prefs));

    // Verify that the app starts without crashing
    expect(find.byType(MyApp), findsOneWidget);
  });
}
