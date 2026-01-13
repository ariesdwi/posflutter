import 'dart:async';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import '../../features/transactions/models/transaction.dart';
import '../utils/formatters.dart';

class PrinterService {
  // Singleton pattern
  static final PrinterService _instance = PrinterService._internal();
  factory PrinterService() => _instance;
  PrinterService._internal();

  BluetoothDevice? _connectedDevice;
  BluetoothCharacteristic? _writeCharacteristic;

  // Stream for scan results
  Stream<List<ScanResult>> get scanResults => FlutterBluePlus.scanResults;

  // Stream for connection state
  Stream<BluetoothConnectionState> get connectionState {
    if (_connectedDevice != null) {
      return _connectedDevice!.connectionState;
    }
    return const Stream.empty();
  }

  BluetoothDevice? get connectedDevice => _connectedDevice;

  Future<void> startScan() async {
    // Stop any existing scan
    if (FlutterBluePlus.isScanningNow) {
      await FlutterBluePlus.stopScan();
    }

    // Start scanning for BLE devices
    // Note: iOS requires specific service UUIDs to find devices quickly or at all in some background modes,
    // but for foreground we can usually scan all. Thermal printers often don't advertise standard UUIDs.
    await FlutterBluePlus.startScan(timeout: const Duration(seconds: 10));
  }

  Future<void> stopScan() async {
    await FlutterBluePlus.stopScan();
  }

  Future<bool> connect(BluetoothDevice device) async {
    try {
      // Connect to the device
      await device.connect(autoConnect: false);
      _connectedDevice = device;

      // Discover services to find the write characteristic
      List<BluetoothService> services = await device.discoverServices();
      _writeCharacteristic = null;

      // Known Thermal Printer Service UUIDs (often 18f0 or proprietary)
      // We'll search for a characteristic with WRITE or WRITE_WITHOUT_RESPONSE properties.
      for (var service in services) {
        for (var characteristic in service.characteristics) {
          if (characteristic.properties.write ||
              characteristic.properties.writeWithoutResponse) {
            _writeCharacteristic = characteristic;
            // Found a candidate, but let's prefer one that looks like a serial port if detailed logic needed
            // For generic thermal printers, usually the first writable characteristic works.
            break;
          }
        }
        if (_writeCharacteristic != null) break;
      }

      return _writeCharacteristic != null;
    } catch (e) {
      print('Connection Error: $e');
      return false;
    }
  }

  Future<void> disconnect() async {
    if (_connectedDevice != null) {
      await _connectedDevice!.disconnect();
      _connectedDevice = null;
      _writeCharacteristic = null;
    }
  }

  Future<bool> get isConnected async {
    if (_connectedDevice == null) return false;
    // Check current connection state
    var state = await _connectedDevice!.connectionState.first;
    return state == BluetoothConnectionState.connected;
  }

  Future<void> printReceipt(
    Transaction transaction, {
    String? businessName,
    String? businessAddress,
    String? businessPhone,
  }) async {
    if (_connectedDevice == null || _writeCharacteristic == null) {
      throw Exception("Printer not connected");
    }

    // Generate ESC/POS commands
    final profile = await CapabilityProfile.load();
    final generator = Generator(PaperSize.mm58, profile);
    List<int> bytes = [];

    // Header
    bytes += generator.text(
      businessName ?? "POS",
      styles: const PosStyles(
        align: PosAlign.center,
        height: PosTextSize.size2,
        width: PosTextSize.size2,
        bold: true,
      ),
    );
    if (businessAddress != null) {
      bytes += generator.text(
        businessAddress,
        styles: const PosStyles(align: PosAlign.center),
      );
    }
    if (businessPhone != null) {
      bytes += generator.text(
        businessPhone,
        styles: const PosStyles(align: PosAlign.center),
      );
    }
    bytes += generator.feed(1);

    // Info
    bytes += generator.row([
      PosColumn(
        text: 'Date',
        width: 6,
        styles: const PosStyles(align: PosAlign.left),
      ),
      PosColumn(
        text: DateFormatter.formatDateTime(
          transaction.createdAt ?? DateTime.now(),
        ),
        width: 6,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);
    bytes += generator.row([
      PosColumn(
        text: 'Order ID',
        width: 4,
        styles: const PosStyles(align: PosAlign.left),
      ),
      PosColumn(
        text: '#${transaction.id?.substring(0, 8).toUpperCase() ?? 'POS-001'}',
        width: 8,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);
    if (transaction.tableNumber != null) {
      bytes += generator.row([
        PosColumn(
          text: 'Table',
          width: 6,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: transaction.tableNumber!,
          width: 6,
          styles: const PosStyles(align: PosAlign.right, bold: true),
        ),
      ]);
    }
    bytes += generator.hr();

    // Items
    for (var item in transaction.items) {
      bytes += generator.text(
        item.productName,
        styles: const PosStyles(align: PosAlign.left, bold: true),
      );
      bytes += generator.row([
        PosColumn(
          text: '${item.quantity} x ${CurrencyFormatter.format(item.price)}',
          width: 8,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: CurrencyFormatter.format(item.subtotal),
          width: 4,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);
    }
    bytes += generator.hr();

    // Totals
    bytes += generator.row([
      PosColumn(text: 'Subtotal', width: 6),
      PosColumn(
        text: CurrencyFormatter.format(transaction.subtotal),
        width: 6,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);
    if (transaction.discount > 0) {
      bytes += generator.row([
        PosColumn(text: 'Discount', width: 6),
        PosColumn(
          text: "-${CurrencyFormatter.format(transaction.discount)}",
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);
    }
    bytes += generator.row([
      PosColumn(text: 'Tax (10%)', width: 6),
      PosColumn(
        text: CurrencyFormatter.format(transaction.tax),
        width: 6,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);
    bytes += generator.hr();
    bytes += generator.row([
      PosColumn(
        text: 'TOTAL',
        width: 6,
        styles: const PosStyles(
          height: PosTextSize.size2,
          width: PosTextSize.size2,
          bold: true,
        ),
      ),
      PosColumn(
        text: CurrencyFormatter.format(transaction.total),
        width: 6,
        styles: const PosStyles(
          height: PosTextSize.size2,
          width: PosTextSize.size2,
          bold: true,
          align: PosAlign.right,
        ),
      ),
    ]);
    bytes += generator.feed(1);

    // Payment
    bytes += generator.row([
      PosColumn(text: 'Payment', width: 6),
      PosColumn(
        text: transaction.paymentMethod,
        width: 6,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);
    bytes += generator.row([
      PosColumn(text: 'Amount Paid', width: 6),
      PosColumn(
        text: CurrencyFormatter.format(transaction.paymentAmount),
        width: 6,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);
    bytes += generator.row([
      PosColumn(text: 'Change', width: 6),
      PosColumn(
        text: CurrencyFormatter.format(transaction.change),
        width: 6,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);

    bytes += generator.feed(2);
    bytes += generator.text(
      'Thank you for your visit!',
      styles: const PosStyles(align: PosAlign.center),
    );
    bytes += generator.feed(3);
    bytes += generator.cut();

    // Write to printer
    // Chunking to avoid MTU limits (simulated by splitting logic if needed,
    // but flutter_blue_plus handles long writes reasonably well now if the device supports it.
    // However, safest to send in chunks).
    await _writeBytes(bytes);
  }

  Future<void> _writeBytes(List<int> bytes) async {
    const int chunkLength = 20;
    for (int i = 0; i < bytes.length; i += chunkLength) {
      List<int> chunk = bytes.sublist(
        i,
        (i + chunkLength < bytes.length) ? i + chunkLength : bytes.length,
      );
      await _writeCharacteristic!.write(
        chunk,
        withoutResponse: _writeCharacteristic!.properties.writeWithoutResponse,
      );
    }
  }
}
