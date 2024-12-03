import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.tsx";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert.tsx";
import { Button } from "./components/ui/button.tsx";
import { Input } from "./components/ui/input.tsx";
import { Label } from "./components/ui/label.tsx";
import { CalendarIcon, FileText, Download } from 'lucide-react';

const Invoice = () => {
  const [showInvoice, setShowInvoice] = useState(false);
  const [formData, setFormData] = useState({
    vendor: 'Vendor2',
    customVendor: '',
    quantity: 7420.28,
    date: '2024-11-29',
    unitPrice: 4.50,
    invoiceNumber: 'INV-2024-001',
    dueDate: '2024-12-29',
  });
 
  const vendors = ['Vendor1', 'Vendor2', 'Vendor3', 'Other'];
  const calculateTotal = () => formData.quantity * formData.unitPrice;
  const calculateSubtotal = () => formData.quantity * formData.unitPrice;
 
  const handleGenerateInvoice = (e) => {
    e.preventDefault();
    setShowInvoice(true);
  };

  return (
    <div className="mb-6">
      {!showInvoice ? (
        <Button 
          onClick={handleGenerateInvoice}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      ) : (
        <Card className="w-full max-w-3xl mx-auto bg-white">
          <CardHeader className="border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold text-blue-600">
                  Flour Guys Forever Co.
                </CardTitle>
                <div className="text-sm text-gray-500 mt-2">
                  123 Bakery Street<br />
                  Vancouver, BC V6C 3B1<br />
                  Canada
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">INVOICE</div>
                <div className="text-sm text-gray-500 mt-2">
                  Invoice #: {formData.invoiceNumber}<br />
                  Purchase Order: Emergency-B{formData.invoiceNumber}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Bill To:</h3>
                <div className="space-y-2">
                  <select 
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                    className="w-full p-2 border rounded bg-gray-50"
                  >
                    {vendors.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {formData.vendor === 'Other' && (
                    <Input
                      id="customVendor"
                      value={formData.customVendor}
                      onChange={(e) => setFormData({...formData, customVendor: e.target.value})}
                      placeholder="Enter vendor name"
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invoiceDate" className="text-gray-600">Invoice Date</Label>
                  <div className="relative">
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-gray-50"
                    />
                    <CalendarIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dueDate" className="text-gray-600">Due Date</Label>
                  <div className="relative">
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full bg-gray-50"
                    />
                    <CalendarIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
     
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Quantity (kg)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Unit Price</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-4 text-sm">Butter (Emergency Order)</td>
                    <td className="px-4 py-4 text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                        className="w-32 text-right ml-auto bg-gray-50"
                      />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value)})}
                        className="w-32 text-right ml-auto bg-gray-50"
                      />
                    </td>
                    <td className="px-4 py-4 text-right font-medium">${calculateTotal().toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="border-t">
                    <td colSpan="3" className="px-4 py-3 text-right font-medium">Subtotal:</td>
                    <td className="px-4 py-3 text-right font-medium">${calculateSubtotal().toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-medium text-sm text-gray-500">GST/HST (Zero-rated):</td>
                    <td className="px-4 py-3 text-right font-medium text-sm text-gray-500">$0.00</td>
                  </tr>
                  <tr className="border-t">
                    <td colSpan="3" className="px-4 py-3 text-right font-bold">Total CAD:</td>
                    <td className="px-4 py-3 text-right font-bold">${calculateTotal().toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
     
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">Emergency butter order to address projected shortage. Please expedite delivery.</p>
              </div>
              <div className="text-sm text-gray-600">
                Payment Terms: Net 30<br />
                Please include invoice number on payment.
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={() => setShowInvoice(false)} 
                  variant="outline"
                  className="w-full"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => window.print()} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Invoice;