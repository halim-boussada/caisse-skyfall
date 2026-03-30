import { NextResponse } from "next/server";
import { ThermalPrinter, PrinterTypes } from "node-thermal-printer";

export async function POST(req: Request) {
  try {
    const order = await req.json();

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: "tcp://192.168.0.148:9100",
      characterSet: "SLOVENIA", // good for small printers
      removeSpecialCharacters: false,
      lineCharacter: "-",
      width: 32, // 🔥 small receipt width (important)
    });

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return NextResponse.json(
        { error: "Printer not connected" },
        { status: 500 },
      );
    }

    // =========================
    // RECEIPT DESIGN (SMALL)
    // =========================

    printer.alignCenter();
    printer.bold(true);
    printer.println("RESTAURANT NAME");
    printer.bold(false);
    printer.println("Tel: 12345678");
    printer.drawLine("-");

    printer.alignLeft();
    printer.println(`Table: ${order.tableNumber}`);
    printer.println(`Order: ${order.id.slice(-6)}`);
    printer.println(new Date().toLocaleString());
    printer.drawLine("-");

    // ITEMS
    order.items.forEach((item: any) => {
      printer.println(`${item.itemName}`);
      printer.println(`   1 x ${item.unitPrice.toFixed(2)} TND`);
    });

    printer.drawLine("-");

    // TOTAL
    printer.bold(true);
    printer.alignRight();
    printer.println(`TOTAL: ${order.totalAmount.toFixed(2)} TND`);
    printer.bold(false);

    printer.drawLine("-");

    printer.alignCenter();
    printer.println("Thank you!");
    printer.println("\n\n");

    printer.cut();

    await printer.execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Print failed" }, { status: 500 });
  }
}
