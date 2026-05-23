import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../../common/middleware';

const router = Router();
const prisma = new PrismaClient();

// Get invoice settings
router.get('/invoice-settings', authenticate, async (req: AuthRequest, res) => {
  try {
    const clientId = req.user!.clientId;
    
    const settings = await prisma.invoiceSettings.findUnique({
      where: { clientId }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching invoice settings:', error);
    res.status(500).json({ error: 'Failed to fetch invoice settings' });
  }
});

// Save invoice settings
router.post('/invoice-settings', authenticate, async (req: AuthRequest, res) => {
  try {
    const clientId = req.user!.clientId;
    const settingsData = req.body;
    
    const settings = await prisma.invoiceSettings.upsert({
      where: { clientId },
      update: {
        ...settingsData,
        updatedAt: new Date()
      },
      create: {
        clientId,
        ...settingsData
      }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error saving invoice settings:', error);
    res.status(500).json({ error: 'Failed to save invoice settings' });
  }
});

// Get customer invoice settings
router.get('/customer-invoice-settings/:customerId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    
    const settings = await prisma.customerInvoiceSettings.findUnique({
      where: { customerId }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching customer invoice settings:', error);
    res.status(500).json({ error: 'Failed to fetch customer invoice settings' });
  }
});

// Save customer invoice settings
router.post('/customer-invoice-settings', authenticate, async (req: AuthRequest, res) => {
  try {
    const settingsData = req.body;
    
    const settings = await prisma.customerInvoiceSettings.upsert({
      where: { customerId: settingsData.customerId },
      update: {
        ...settingsData,
        updatedAt: new Date()
      },
      create: settingsData
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error saving customer invoice settings:', error);
    res.status(500).json({ error: 'Failed to save customer invoice settings' });
  }
});

// Get uninvoiced dispatches for a customer
router.get('/dispatches', authenticate, async (req: AuthRequest, res) => {
  try {
    const { customerId, factoryId, uninvoiced } = req.query;
    const clientId = req.user!.clientId;
    
    // Get all factories for this client to scope dispatches
    const factories = await prisma.factory.findMany({ where: { clientId } });
    
    let whereClause: any = {
      factoryId: { in: factories.map(f => f.id) }
    };
    
    if (customerId) whereClause.customerId = customerId;
    if (factoryId) whereClause.factoryId = factoryId as string;
    
    // If uninvoiced flag is set, only get dispatches not yet in any invoice
    if (uninvoiced === 'true') {
      whereClause.invoiceItems = {
        none: {}
      };
    }
    
    const dispatches = await prisma.dispatch.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        customer: true,
        factory: true
      }
    });
    
    res.json(dispatches);
  } catch (error) {
    console.error('Error fetching dispatches:', error);
    res.status(500).json({ error: 'Failed to fetch dispatches' });
  }
});

// Generate next invoice number
router.get('/invoices/next-number', authenticate, async (req: AuthRequest, res) => {
  try {
    const clientId = req.user!.clientId;
    
    // Get the latest invoice for this client
    const latestInvoice = await prisma.invoice.findFirst({
      where: { clientId },
      orderBy: { createdAt: 'desc' }
    });
    
    let nextNumber = 1;
    if (latestInvoice) {
      // Extract number from invoice number (assuming format like INV-001, INV-002, etc.)
      const match = latestInvoice.invoiceNumber.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    const invoiceNumber = `INV-${nextNumber.toString().padStart(3, '0')}`;
    
    res.json({ invoiceNumber });
  } catch (error) {
    console.error('Error generating invoice number:', error);
    res.status(500).json({ error: 'Failed to generate invoice number' });
  }
});

// Get invoices
router.get('/invoices', authenticate, async (req: AuthRequest, res) => {
  try {
    const clientId = req.user!.clientId;
    const { factoryId, status, customerId } = req.query;
    
    let whereClause: any = { clientId };
    
    if (factoryId) whereClause.factoryId = factoryId;
    if (status) whereClause.status = status;
    if (customerId) whereClause.customerId = customerId;
    
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        factory: true,
        items: {
          include: {
            dispatch: true
          }
        }
      }
    });
    
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get single invoice
router.get('/invoices/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user!.clientId;
    
    const invoice = await prisma.invoice.findFirst({
      where: { 
        id,
        clientId 
      },
      include: {
        customer: true,
        factory: true,
        items: {
          include: {
            dispatch: true
          }
        }
      }
    });
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create invoice
router.post('/invoices', authenticate, async (req: AuthRequest, res) => {
  try {
    const clientId = req.user!.clientId;
    const invoiceData = req.body;
    
    const invoice = await prisma.$transaction(async (tx) => {
      const newInvoice = await tx.invoice.create({
        data: {
          clientId,
          factoryId: invoiceData.factoryId,
          customerId: invoiceData.customerId,
          invoiceNumber: invoiceData.invoiceNumber,
          invoiceDate: new Date(invoiceData.invoiceDate),
          dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
          billingName: invoiceData.billingName || null,
          vehicleNo: invoiceData.vehicleNo || null,
          dateFrom: invoiceData.dateFrom ? new Date(invoiceData.dateFrom) : null,
          dateTo: invoiceData.dateTo ? new Date(invoiceData.dateTo) : null,
          subtotal: invoiceData.subtotal,
          sgstAmount: invoiceData.sgstAmount || 0,
          cgstAmount: invoiceData.cgstAmount || 0,
          igstAmount: invoiceData.igstAmount || 0,
          gstAmount: invoiceData.gstAmount || 0,
          totalAmount: invoiceData.totalAmount,
          amountInWords: invoiceData.amountInWords || null,
          status: invoiceData.status || 'draft',
          notes: invoiceData.notes,
          createdBy: invoiceData.createdBy
        }
      });
      
      if (invoiceData.items && invoiceData.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: invoiceData.items.map((item: any) => ({
            invoiceId: newInvoice.id,
            dispatchId: item.dispatchId,
            description: item.description,
            brickType: item.brickType,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
            hsnCode: item.hsnCode || '6901'
          }))
        });
      }
      
      return newInvoice;
    });
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update invoice
router.put('/invoices/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user!.clientId;
    const invoiceData = req.body;
    
    const invoice = await prisma.$transaction(async (tx) => {
      const existingInvoice = await tx.invoice.findFirst({ where: { id, clientId } });
      if (!existingInvoice) throw new Error('Invoice not found');
      
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : undefined,
          dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
          billingName: invoiceData.billingName,
          vehicleNo: invoiceData.vehicleNo,
          dateFrom: invoiceData.dateFrom ? new Date(invoiceData.dateFrom) : null,
          dateTo: invoiceData.dateTo ? new Date(invoiceData.dateTo) : null,
          subtotal: invoiceData.subtotal,
          sgstAmount: invoiceData.sgstAmount || 0,
          cgstAmount: invoiceData.cgstAmount || 0,
          igstAmount: invoiceData.igstAmount || 0,
          gstAmount: invoiceData.gstAmount || 0,
          totalAmount: invoiceData.totalAmount,
          amountInWords: invoiceData.amountInWords,
          status: invoiceData.status,
          notes: invoiceData.notes,
          updatedAt: new Date()
        }
      });
      
      if (invoiceData.items) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
        if (invoiceData.items.length > 0) {
          await tx.invoiceItem.createMany({
            data: invoiceData.items.map((item: any) => ({
              invoiceId: id,
              dispatchId: item.dispatchId,
              description: item.description,
              brickType: item.brickType,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              hsnCode: item.hsnCode || '6901'
            }))
          });
        }
      }
      
      return updatedInvoice;
    });
    
    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Delete invoice
router.delete('/invoices/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user!.clientId;
    
    // Check if invoice exists and belongs to client
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, clientId }
    });
    
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Delete invoice (items will be deleted due to cascade)
    await prisma.invoice.delete({
      where: { id }
    });
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// Update invoice status
router.patch('/invoices/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const clientId = req.user!.clientId;
    
    const invoice = await prisma.invoice.updateMany({
      where: { id, clientId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });
    
    if (invoice.count === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice status updated successfully' });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

export default router;