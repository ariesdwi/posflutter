import 'package:flutter/foundation.dart';

class DebugLogService {
  static final DebugLogService _instance = DebugLogService._internal();
  final List<String> _logs = [];
  final List<VoidCallback> _listeners = [];

  factory DebugLogService() {
    return _instance;
  }

  DebugLogService._internal();

  void addLog(String message) {
    _logs.add('[${_getTimestamp()}] $message');
    if (_logs.length > 100) {
      _logs.removeAt(0);
    }
    _notifyListeners();
  }

  void clearLogs() {
    _logs.clear();
    _notifyListeners();
  }

  List<String> getLogs() => List.from(_logs);

  void addListener(VoidCallback listener) {
    _listeners.add(listener);
  }

  void removeListener(VoidCallback listener) {
    _listeners.remove(listener);
  }

  void _notifyListeners() {
    for (var listener in _listeners) {
      listener.call();
    }
  }

  String _getTimestamp() {
    final now = DateTime.now();
    return '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
  }
}
