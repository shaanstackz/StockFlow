import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.tsx";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert.tsx";
import { Button } from "./components/ui/button.tsx";
import { 
  Package, FileText, Download
} from 'lucide-react';

const Invoice = () => {
  const [showInvoice, setShowInvoice] = useState(false);
  
  const generateInvoiceData = () => ({
    invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
    date: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    items: [
      { description: 'Widget A', quantity: 50, price: 10.99, total: 549.50 },
      { description: 'Widget B', quantity: 30, price: 15.99, total: 479.70 },
      { description: 'Express Shipping', quantity: 1, price: 25.00, total: 25.00 }
    ]
  });

  const [invoiceData, setInvoiceData] = useState(null);

  const handleGenerateInvoice = () => {
    setInvoiceData(generateInvoiceData());
    setShowInvoice(true);
  };

  return (
    <div className="mb-6">
      <Button
        className="mb-4 bg-blue-500 hover:bg-blue-600"
        onClick={handleGenerateInvoice}
      >
        <FileText className="mr-2 h-4 w-4" />
        Generate Invoice
      </Button>

      {showInvoice && invoiceData && (
        <Card className="bg-white">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-blue-600">INVOICE</CardTitle>
                <p className="text-gray-600">StockFlow Inventory Management</p>
              </div>
              <Button variant="outline" className="hover:bg-gray-100">
                <FileText className="mr-2 h-4 w-4" />
                Send Invoice
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700">Bill To:</h3>
                <p>Client Company Name</p>
                <p>123 Business Street</p>
                <p>Business City, BC 12345</p>
              </div>
              <div className="text-right">
                <p><span className="font-semibold">Invoice No:</span> {invoiceData.invoiceNumber}</p>
                <p><span className="font-semibold">Date:</span> {invoiceData.date}</p>
                <p><span className="font-semibold">Due Date:</span> {invoiceData.dueDate}</p>
              </div>
            </div>

            <div className="mt-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2">Quantity</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-2">{item.description}</td>
                      <td className="text-right p-2">{item.quantity}</td>
                      <td className="text-right p-2">${item.price.toFixed(2)}</td>
                      <td className="text-right p-2">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan="3" className="text-right p-2">Subtotal:</td>
                    <td className="text-right p-2">
                      ${invoiceData.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="font-bold text-blue-600">
                    <td colSpan="3" className="text-right p-2">Total:</td>
                    <td className="text-right p-2">
                      ${invoiceData.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-8 pt-6 border-t">
              <p className="text-gray-600 text-sm">Payment Terms: Net 30</p>
              <p className="text-gray-600 text-sm">Please include invoice number on your payment.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Invoice;