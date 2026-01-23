import React from 'react';

export default function Receipt({ data }) {
    // If no data, we don't render anything (and thus no print styles)
    if (!data) return null;

    const {
        receiptNumber,
        date,
        items = [],
        subtotal = 0,
        tax = 0,
        discount = 0,
        total = 0,
        amountPaid = 0,
        change = 0,
        cashier = 'Staff',
        customer = 'Walk-in Customer'
    } = data;

    return (
        <div id="receipt-print-area" className="hidden">
            <style>
                {`
                    @media print {
                        @page { size: 80mm auto; margin: 0mm; }
                        body * {
                            visibility: hidden;
                        }
                        #receipt-print-area, #receipt-print-area * {
                            visibility: visible;
                        }
                        #receipt-print-area {
                            display: block !important;
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 80mm; /* Standard thermal width */
                            margin: 0 auto; /* Center on page */
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 12px;
                            background: white;
                            color: black;
                            padding: 10px;
                        }
                        
                        /* Reset common styles for thermal printing */
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .text-sm { font-size: 11px; }
                        .text-xs { font-size: 10px; }
                        .border-b { border-bottom: 1px dashed black; }
                        .border-t { border-top: 1px dashed black; }
                        .mb-2 { margin-bottom: 8px; }
                        .py-1 { padding-top: 4px; padding-bottom: 4px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { text-align: left; vertical-align: top; }
                        td.price { text-align: right; }
                    }
                `}
            </style>

            <div className="print-content">
                <div className="text-center mb-2">
                    <h1 className="font-bold text-lg">StockMaster</h1>
                    <p className="text-sm">Main Street, Retail City</p>
                    <p className="text-sm">Tel: +123-456-7890</p>
                </div>

                <div className="border-b mb-2 pb-1">
                    <div className="flex justify-between text-xs">
                        <span>{date}</span>
                        <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                        <span>Rec: #{receiptNumber}</span>
                        <span>Op: {cashier}</span>
                    </div>
                    <div className="text-xs mt-1">
                        Cust: {customer}
                    </div>
                </div>

                <table className="mb-2 w-full text-xs">
                    <thead>
                        <tr className="border-b">
                            <th className="py-1">Item</th>
                            <th className="py-1 text-center w-8">Qty</th>
                            <th className="py-1 text-right w-16">Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td className="py-1 pr-1">
                                    <div className="font-bold">{item.name}</div>
                                    <div className="text-[10px]">{item.code}</div>
                                </td>
                                <td className="py-1 text-center">{item.qty}</td>
                                <td className="py-1 text-right">
                                    {(parseFloat(item.price) * parseInt(item.qty)).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="border-t pt-1 space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{parseFloat(subtotal).toFixed(2)}</span>
                    </div>
                    {tax > 0 && (
                        <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>{parseFloat(tax).toFixed(2)}</span>
                        </div>
                    )}
                    {discount > 0 && (
                        <div className="flex justify-between">
                            <span>Discount:</span>
                            <span>-{parseFloat(discount).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-sm border-t border-b py-1 my-1">
                        <span>TOTAL:</span>
                        <span>{parseFloat(total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Paid:</span>
                        <span>{parseFloat(amountPaid).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Change:</span>
                        <span>{parseFloat(change).toFixed(2)}</span>
                    </div>
                </div>

                <div className="text-center mt-4 text-xs font-bold">
                    <p>*** THANK YOU ***</p>
                    <p>Powered by VCL International</p>
                </div>
            </div>
        </div>
    );
}
