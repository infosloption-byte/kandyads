CREATE TABLE IF NOT EXISTS VendorDeliverable (
  id INT NOT NULL AUTO_INCREMENT,
  vendorId INT NOT NULL,
  outsourceOrderId INT NULL,
  type VARCHAR(50) NOT NULL,
  reference VARCHAR(100) NULL,
  description VARCHAR(500) NOT NULL,
  deliveredAt DATETIME(3) NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY VendorDeliverable_vendor_idx (vendorId),
  KEY VendorDeliverable_order_idx (outsourceOrderId),
  CONSTRAINT VendorDeliverable_vendor_fk FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE CASCADE,
  CONSTRAINT VendorDeliverable_order_fk FOREIGN KEY (outsourceOrderId) REFERENCES OutsourceOrder(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS VendorInvoice (
  id INT NOT NULL AUTO_INCREMENT,
  vendorId INT NOT NULL,
  outsourceOrderId INT NULL,
  invoiceNumber VARCHAR(100) NOT NULL,
  invoiceDate DATETIME(3) NOT NULL,
  dueDate DATETIME(3) NULL,
  amount DECIMAL(14,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
  notes TEXT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY VendorInvoice_vendor_number_key (vendorId, invoiceNumber),
  KEY VendorInvoice_order_idx (outsourceOrderId),
  CONSTRAINT VendorInvoice_vendor_fk FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE CASCADE,
  CONSTRAINT VendorInvoice_order_fk FOREIGN KEY (outsourceOrderId) REFERENCES OutsourceOrder(id) ON DELETE SET NULL
);
