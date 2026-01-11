import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/printer_service.dart';

class PrinterSettingsScreen extends StatefulWidget {
  const PrinterSettingsScreen({Key? key}) : super(key: key);

  @override
  State<PrinterSettingsScreen> createState() => _PrinterSettingsScreenState();
}

class _PrinterSettingsScreenState extends State<PrinterSettingsScreen> {
  final PrinterService _printerService = PrinterService();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // Optional: Start scanning immediately on open
    // _startScan();
  }

  @override
  void dispose() {
    _printerService.stopScan();
    super.dispose();
  }

  Future<void> _startScan() async {
    try {
      List<Permission> permissions = [];
      if (Platform.isAndroid) {
        permissions.addAll([
          Permission.bluetoothScan,
          Permission.bluetoothConnect,
          Permission.location,
        ]);
      } else {
        // iOS and others
        permissions.add(Permission.bluetooth);
      }

      Map<Permission, PermissionStatus> statuses = await permissions.request();

      if (statuses.values.any(
        (status) => status.isDenied || status.isPermanentlyDenied,
      )) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Bluetooth permissions are required.'),
            ),
          );
        }
        return;
      }

      _printerService.startScan();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error scanning: $e')));
      }
    }
  }

  Future<void> _connect(BluetoothDevice device) async {
    setState(() => _isLoading = true);
    try {
      final success = await _printerService.connect(device);
      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Connected to ${device.platformName}')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Failed to connect')));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error connecting: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _disconnect() async {
    setState(() => _isLoading = true);
    try {
      await _printerService.disconnect();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Disconnected')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error disconnecting: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: const Text('Printer Settings'),
        centerTitle: true,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Status Card
          StreamBuilder<BluetoothConnectionState>(
            stream: _printerService.connectionState,
            initialData: BluetoothConnectionState.disconnected,
            builder: (context, snapshot) {
              final isConnected =
                  snapshot.data == BluetoothConnectionState.connected;
              final deviceName =
                  _printerService.connectedDevice?.platformName ?? 'Unknown';

              return Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    bottom: BorderSide(color: AppColors.slate200, width: 0.5),
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      isConnected
                          ? Icons.bluetooth_connected
                          : Icons.bluetooth_disabled,
                      size: 48,
                      color: isConnected
                          ? AppColors.success
                          : AppColors.slate300,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      isConnected
                          ? 'Connected to $deviceName'
                          : 'No Printer Connected',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.slate900,
                      ),
                    ),
                    if (isConnected) ...[
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: _isLoading ? null : _disconnect,
                        icon: const Icon(Icons.close),
                        label: const Text('Disconnect'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                        ),
                      ),
                    ],
                  ],
                ),
              );
            },
          ),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Available Devices',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.slate500,
                    letterSpacing: 1,
                  ),
                ),
                StreamBuilder<bool>(
                  stream: FlutterBluePlus.isScanning,
                  initialData: false,
                  builder: (context, snapshot) {
                    final isScanning = snapshot.data ?? false;
                    if (isScanning) {
                      return const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      );
                    } else {
                      return TextButton.icon(
                        onPressed: _startScan,
                        icon: const Icon(Icons.refresh, size: 16),
                        label: const Text('Scan'),
                      );
                    }
                  },
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: StreamBuilder<List<ScanResult>>(
              stream: _printerService.scanResults,
              initialData: [],
              builder: (context, snapshot) {
                final results = snapshot.data ?? [];
                // Filter out devices without names to reduce clutter, typical for BLE scanning
                final displayedDevices = results
                    .where((r) => r.device.platformName.isNotEmpty)
                    .toList();

                if (displayedDevices.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.print_disabled_outlined,
                          size: 64,
                          color: AppColors.slate200,
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'No devices found',
                          style: TextStyle(color: AppColors.slate500),
                        ),
                        TextButton(
                          onPressed: _startScan,
                          child: const Text('Start Scan'),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 8,
                  ),
                  itemCount: displayedDevices.length,
                  itemBuilder: (context, index) {
                    final result = displayedDevices[index];
                    final device = result.device;
                    final isConnected =
                        _printerService.connectedDevice?.remoteId ==
                        device.remoteId;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isConnected
                              ? AppColors.success
                              : Colors.transparent,
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.slate900.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        leading: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isConnected
                                ? AppColors.success.withOpacity(0.1)
                                : AppColors.slate50,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.print_rounded,
                            color: isConnected
                                ? AppColors.success
                                : AppColors.slate500,
                          ),
                        ),
                        title: Text(
                          device.platformName,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(device.remoteId.toString()),
                        trailing:
                            _isLoading &&
                                !isConnected // Show loading if working on this connection? No easy way to track per item without state
                            ? const Icon(
                                Icons.chevron_right,
                                color: AppColors.slate300,
                              )
                            : isConnected
                            ? const Icon(
                                Icons.check_circle,
                                color: AppColors.success,
                              )
                            : ElevatedButton(
                                onPressed: () => _connect(device),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.slate900,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 4,
                                  ),
                                  minimumSize: Size.zero,
                                  tapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: const Text(
                                  'Connect',
                                  style: TextStyle(fontSize: 12),
                                ),
                              ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
