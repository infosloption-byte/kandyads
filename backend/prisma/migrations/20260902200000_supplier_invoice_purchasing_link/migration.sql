ALTER TABLE VendorInvoice
  ADD COLUMN purchaseOrderId INT NULL,
  ADD COLUMN goodsReceiptId INT NULL,
  ADD KEY VendorInvoice_purchase_order_idx (purchaseOrderId),
  ADD KEY VendorInvoice_goods_receipt_idx (goodsReceiptId),
  ADD CONSTRAINT VendorInvoice_purchase_order_fk FOREIGN KEY (purchaseOrderId) REFERENCES PurchaseOrder(id) ON DELETE SET NULL,
  ADD CONSTRAINT VendorInvoice_goods_receipt_fk FOREIGN KEY (goodsReceiptId) REFERENCES GoodsReceipt(id) ON DELETE SET NULL;
