import 'package:flutter/material.dart';
import '../services/debug_log_service.dart';

class DebugOverlay extends StatefulWidget {
  final Widget child;
  final bool enableDebugButton; // Add flag to control visibility

  const DebugOverlay({
    Key? key,
    required this.child,
    this.enableDebugButton = false, // Default to hidden
  }) : super(key: key);

  @override
  State<DebugOverlay> createState() => _DebugOverlayState();
}

class _DebugOverlayState extends State<DebugOverlay> {
  bool _showDebug = false;
  final DebugLogService _logService = DebugLogService();

  @override
  void initState() {
    super.initState();
    _setupShakeDetector();
    _logService.addListener(_onLogsUpdated);
    _logService.addLog('📱 App Started - Shake device to open debug panel');
  }

  void _onLogsUpdated() {
    setState(() {});
  }

  void _setupShakeDetector() {
    // Disabled due to MissingPluginException on iOS
    // Use the floating debug button instead
    _logService.addLog(
      '⚠️ Shake detector disabled - use debug button (🐛) instead',
    );

    /* 
    try {
      _accelerometerStream = accelerometerEvents;
      _accelerometerStream?.listen(
        (AccelerometerEvent event) {
          if (!mounted) return;
          setState(() {
            _accelerationX = event.x;
            _accelerationY = event.y;
            _accelerationZ = event.z;

            // Detect shake - check if total acceleration is high
            final totalAcceleration = sqrt(
              _accelerationX * _accelerationX +
                  _accelerationY * _accelerationY +
                  _accelerationZ * _accelerationZ,
            );

            if (totalAcceleration > 25) {
              _toggleDebug();
            }
          });
        },
        onError: (error) {
          // Handle sensor errors gracefully
          if (mounted) {
            _logService.addLog('⚠️ Sensor error: $error');
          }
        },
        cancelOnError: false,
      );
      _logService.addLog('📱 Shake detector enabled');
    } catch (e) {
      // If sensors are not available, log it but don't crash
      _logService.addLog(
        '⚠️ Accelerometer not available - use debug button instead',
      );
      _accelerometerStream = null;
    }
    */
  }

  void _toggleDebug() {
    setState(() {
      _showDebug = !_showDebug;
      if (_showDebug) {
        _logService.addLog('🐞 Debug Panel Opened');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        // Floating debug button (alternative to shake) - only show if enabled
        if (!_showDebug && widget.enableDebugButton)
          Positioned(
            bottom: 16,
            right: 16,
            child: FloatingActionButton(
              mini: true,
              backgroundColor: Colors.cyan.withOpacity(0.7),
              onPressed: _toggleDebug,
              child: const Icon(Icons.bug_report, size: 20),
            ),
          ),
        if (_showDebug)
          GestureDetector(
            onTap: () => setState(() => _showDebug = false),
            child: Container(
              color: Colors.black.withOpacity(0.5),
              child: Center(
                child: SingleChildScrollView(
                  child: Container(
                    width: MediaQuery.of(context).size.width * 0.9,
                    height: MediaQuery.of(context).size.height * 0.8,
                    decoration: BoxDecoration(
                      color: Colors.grey[900],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.cyan, width: 2),
                    ),
                    child: Column(
                      children: [
                        // Header
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.cyan.withOpacity(0.2),
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(10),
                              topRight: Radius.circular(10),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                '🐞 Debug Panel',
                                style: TextStyle(
                                  color: Colors.cyan,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              GestureDetector(
                                onTap: () => setState(() => _showDebug = false),
                                child: const Icon(
                                  Icons.close,
                                  color: Colors.cyan,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Logs
                        Expanded(
                          child: Container(
                            color: Colors.black54,
                            child: ListView.builder(
                              reverse: true,
                              itemCount: _logService.getLogs().length,
                              itemBuilder: (context, index) {
                                final logs = _logService.getLogs();
                                final reversedIndex = logs.length - 1 - index;
                                return Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  child: Text(
                                    logs[reversedIndex],
                                    style: const TextStyle(
                                      color: Colors.yellow,
                                      fontSize: 11,
                                      fontFamily: 'Courier',
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                        // Footer
                        Padding(
                          padding: const EdgeInsets.all(8),
                          child: Text(
                            'Tap to close • Shake to toggle',
                            style: TextStyle(
                              color: Colors.white38,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  @override
  void dispose() {
    _logService.removeListener(_onLogsUpdated);
    super.dispose();
  }
}
