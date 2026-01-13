import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/services/printer_service.dart';
import '../models/transaction.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/constants/app_colors.dart';

class ReceiptScreen extends StatefulWidget {
  final Transaction transaction;

  const ReceiptScreen({Key? key, required this.transaction}) : super(key: key);

  @override
  State<ReceiptScreen> createState() => _ReceiptScreenState();
}

class _ReceiptScreenState extends State<ReceiptScreen> {
  final PrinterService _printerService = PrinterService();
  final GlobalKey _receiptKey = GlobalKey();
  bool _isPrinting = false;
  bool _isSharing = false;

  Future<void> _handlePrint() async {
    setState(() => _isPrinting = true);

    try {
      if (await _printerService.isConnected) {
        final businessName = context
            .read<AuthProvider>()
            .user
            ?.business
            ?.name
            .toUpperCase();
        await _printerService.printReceipt(
          widget.transaction,
          businessName: businessName,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Struk berhasil dicetak')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Tidak ada printer terhubung. Silakan hubungkan printer terlebih dahulu.',
              ),
              duration: Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Kesalahan mencetak: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isPrinting = false);
      }
    }
  }

  Future<void> _handleShare() async {
    setState(() => _isSharing = true);
    try {
      // 1. Capture the widget as an image
      RenderRepaintBoundary? boundary =
          _receiptKey.currentContext?.findRenderObject()
              as RenderRepaintBoundary?;

      if (boundary == null) {
        throw Exception("Unable to capture receipt image.");
      }

      // Increase pixel ratio for higher quality image
      ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      ByteData? byteData = await image.toByteData(
        format: ui.ImageByteFormat.png,
      );

      if (byteData == null) {
        throw Exception("Failed to generate image data.");
      }

      Uint8List pngBytes = byteData.buffer.asUint8List();

      // 2. Save image to temporary directory
      final directory = await getTemporaryDirectory();
      final String filePath =
          '${directory.path}/receipt_${widget.transaction.id}.png';
      final File imgFile = File(filePath);
      await imgFile.writeAsBytes(pngBytes);

      // 3. Share the image file
      await Share.shareXFiles(
        [XFile(filePath)],
        text: 'Receipt #${widget.transaction.id}',
        subject: 'Transaction Receipt',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Kesalahan membagikan struk: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSharing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        Navigator.of(context).popUntil((route) => route.isFirst);
        return false;
      },
      child: Scaffold(
        backgroundColor: AppColors.slate50,
        appBar: AppBar(
          title: const Text('Struk Transaksi'),
          centerTitle: true,
          automaticallyImplyLeading: false,
          elevation: 0,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            children: [
              // Success Header
              const Icon(
                Icons.check_circle_rounded,
                color: AppColors.success,
                size: 80,
              ),
              const SizedBox(height: 16),
              const Text(
                'Pembayaran Berhasil!',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.slate900,
                ),
              ),
              const SizedBox(height: 32),

              // Thermal Receipt Card (Wrapped in RepaintBoundary)
              RepaintBoundary(
                key: _receiptKey,
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors
                            .white, // Important: White background for the image
                        borderRadius: BorderRadius.circular(4),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.slate900.withOpacity(0.1),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          // Jagged / Dotted Top border simulation
                          Container(
                            height: 6,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: AppColors.slate200.withOpacity(0.5),
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(4),
                                topRight: Radius.circular(4),
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              children: [
                                Text(
                                  context
                                          .read<AuthProvider>()
                                          .user
                                          ?.business
                                          ?.name
                                          .toUpperCase() ??
                                      'POS',
                                  style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.2,
                                    color: AppColors.indigo500,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Builder(
                                  builder: (context) {
                                    final business = context
                                        .read<AuthProvider>()
                                        .user
                                        ?.business;
                                    return Column(
                                      children: [
                                        if (business?.address != null)
                                          Padding(
                                            padding: const EdgeInsets.only(
                                              bottom: 4,
                                            ),
                                            child: Text(
                                              business!.address!,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: AppColors.slate500,
                                              ),
                                              textAlign: TextAlign.center,
                                            ),
                                          ),
                                        if (business?.phone != null)
                                          Text(
                                            business!.phone!,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: AppColors.slate500,
                                              fontWeight: FontWeight.w600,
                                            ),
                                            textAlign: TextAlign.center,
                                          ),
                                      ],
                                    );
                                  },
                                ),
                                const SizedBox(height: 24),

                                // Receipt Details
                                _buildDetailRow(
                                  'Tanggal',
                                  DateFormatter.formatDateTime(
                                    widget.transaction.createdAt ??
                                        DateTime.now(),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                _buildDetailRow(
                                  'ID Pesanan',
                                  '#${widget.transaction.id?.toUpperCase() ?? 'POS-001'}',
                                ),
                                if (widget.transaction.tableNumber != null) ...[
                                  const SizedBox(height: 8),
                                  _buildDetailRow(
                                    'Meja',
                                    widget.transaction.tableNumber!,
                                    isBold: true,
                                  ),
                                ],
                                const SizedBox(height: 12),
                                const Divider(thickness: 1, height: 24),

                                // Items
                                ...widget.transaction.items.map((item) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                item.productName,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
                                                  color: AppColors.slate900,
                                                ),
                                              ),
                                              Text(
                                                '${item.quantity} x ${CurrencyFormatter.format(item.price)}',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: AppColors.slate500,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          CurrencyFormatter.format(
                                            item.subtotal,
                                          ),
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                            color: AppColors.slate900,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),

                                const Divider(thickness: 1, height: 24),

                                // Bill Breakdown
                                _buildBillRow(
                                  'Subtotal',
                                  CurrencyFormatter.format(
                                    widget.transaction.subtotal,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                _buildBillRow(
                                  'Diskon',
                                  '-${CurrencyFormatter.format(widget.transaction.discount)}',
                                  isError: true,
                                ),
                                const SizedBox(height: 8),
                                _buildBillRow(
                                  () {
                                    // Calculate tax rate from transaction data
                                    final taxableAmount =
                                        widget.transaction.subtotal -
                                        widget.transaction.discount;
                                    final taxRate = taxableAmount > 0
                                        ? (widget.transaction.tax /
                                                  taxableAmount) *
                                              100
                                        : 0.0;
                                    return 'Pajak (${taxRate.toStringAsFixed(1)}%)';
                                  }(),
                                  CurrencyFormatter.format(
                                    widget.transaction.tax,
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Total
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                    horizontal: 16,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.slate50,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text(
                                        'TOTAL',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 16,
                                          color: AppColors.slate900,
                                        ),
                                      ),
                                      Text(
                                        CurrencyFormatter.format(
                                          widget.transaction.total,
                                        ),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 20,
                                          color: AppColors.slate900,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Payment Status
                                _buildDetailRow(
                                  'Pembayaran',
                                  widget.transaction.paymentMethod,
                                ),
                                const SizedBox(height: 8),
                                _buildDetailRow(
                                  'Jumlah Dibayar',
                                  CurrencyFormatter.format(
                                    widget.transaction.paymentAmount,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                _buildDetailRow(
                                  'Kembali',
                                  CurrencyFormatter.format(
                                    widget.transaction.change,
                                  ),
                                  isBold: true,
                                ),

                                const SizedBox(height: 32),
                                const Text(
                                  'Terima kasih atas kunjungan Anda!',
                                  style: TextStyle(
                                    fontStyle: FontStyle.italic,
                                    color: AppColors.slate500,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (widget.transaction.status == 'COMPLETED')
                      Positioned.fill(
                        child: Center(
                          child: Transform.rotate(
                            angle: -0.2,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: AppColors.error.withOpacity(0.4),
                                  width: 3,
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'LUNAS',
                                style: TextStyle(
                                  fontSize: 48,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.error.withOpacity(0.4),
                                  letterSpacing: 4,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 40),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: _buildActionButton(
                      label: _isPrinting ? 'Mencetak...' : 'Cetak',
                      icon: Icons.print_outlined,
                      color: AppColors.slate900,
                      isLoading: _isPrinting,
                      onPressed: _isPrinting ? () {} : _handlePrint,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildActionButton(
                      label: _isSharing ? 'Membagikan...' : 'Bagikan',
                      icon: Icons.share_outlined,
                      color: AppColors.indigo500,
                      isLoading: _isSharing,
                      onPressed: _isSharing ? () {} : _handleShare,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Selesai',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: AppColors.slate500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13, color: AppColors.slate500),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            color: AppColors.slate900,
          ),
        ),
      ],
    );
  }

  Widget _buildBillRow(String label, String value, {bool isError = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: AppColors.slate900),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isError ? AppColors.error : AppColors.slate900,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
    bool isLoading = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isLoading)
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: color,
                    ),
                  )
                else
                  Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
