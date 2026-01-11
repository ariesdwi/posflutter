import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import 'package:flutter/services.dart';
import '../../features/transactions/models/transaction.dart';
import '../utils/formatters.dart';

class PrinterService {
  BlueThermalPrinter bluetooth = BlueThermalPrinter.instance;

  Future<List<BluetoothDevice>> getBondedDevices() async {
    try {
      return await bluetooth.getBondedDevices();
    } on PlatformException {
      return [];
    }
  }

  Future<bool> connect(BluetoothDevice device) async {
    try {
      if ((await bluetooth.isConnected) == true) {
        return true;
      }
      await bluetooth.connect(device);
      return true;
    } on PlatformException {
      return false;
    }
  }

  Future<void> disconnect() async {
    if ((await bluetooth.isConnected) == true) {
      await bluetooth.disconnect();
    }
  }

  Future<bool> get isConnected async => (await bluetooth.isConnected) ?? false;

  Future<void> printReceipt(Transaction transaction) async {
    if ((await bluetooth.isConnected) != true) return;

    // Header
    bluetooth.printCustom("KEDAI KITA", 3, 1);
    bluetooth.printCustom("Professional POS System", 1, 1);
    bluetooth.printNewLine();

    // Info
    bluetooth.printLeftRight(
      "Date",
      DateFormatter.formatDateTime(transaction.createdAt ?? DateTime.now()),
      1,
    );
    bluetooth.printLeftRight(
      "Order ID",
      "#${transaction.id?.substring(0, 8).toUpperCase() ?? 'POS-001'}",
      1,
    );
    if (transaction.tableNumber != null) {
      bluetooth.printLeftRight("Table", transaction.tableNumber!, 1);
    }
    bluetooth.printCustom("--------------------------------", 1, 1);

    // Items
    for (var item in transaction.items) {
      bluetooth.printLeftRight(item.productName, "", 1);
      bluetooth.printLeftRight(
        "${item.quantity} x ${CurrencyFormatter.format(item.price)}",
        CurrencyFormatter.format(item.subtotal),
        1,
      );
    }
    bluetooth.printCustom("--------------------------------", 1, 1);

    // Totals
    bluetooth.printLeftRight(
      "Subtotal",
      CurrencyFormatter.format(transaction.subtotal),
      1,
    );
    if (transaction.discount > 0) {
      bluetooth.printLeftRight(
        "Discount",
        "-${CurrencyFormatter.format(transaction.discount)}",
        1,
      );
    }
    bluetooth.printLeftRight(
      "Tax (10%)",
      CurrencyFormatter.format(transaction.tax),
      1,
    );
    bluetooth.printCustom("--------------------------------", 1, 1);
    bluetooth.printLeftRight(
      "TOTAL",
      CurrencyFormatter.format(transaction.total),
      3,
    );
    bluetooth.printNewLine();

    // Payment
    bluetooth.printLeftRight("Payment", transaction.paymentMethod, 1);
    bluetooth.printLeftRight(
      "Amount Paid",
      CurrencyFormatter.format(transaction.paymentAmount),
      1,
    );
    bluetooth.printLeftRight(
      "Change",
      CurrencyFormatter.format(transaction.change),
      1,
    );

    bluetooth.printNewLine();
    bluetooth.printCustom("Thank you for your visit!", 1, 1);
    bluetooth.printNewLine();
    bluetooth.printNewLine();
    bluetooth.paperCut();
  }
}
