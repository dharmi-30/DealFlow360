import React, { useState, useEffect } from 'react';
import {
  ModuleType,
  ViewMode,
  Quotation,
  ApprovalRecord,
  FulfillmentRecord,
  SubscriptionRecord,
  InvoiceRecord,
  DealHealthScore,
  FulfillmentStatus,
} from './types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_QUOTATIONS,
  INITIAL_APPROVALS,
  INITIAL_FULFILLMENT,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_DEAL_HEALTH,
} from './data/mockData';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { DashboardView } from './components/modules/DashboardView';
import { QuotationsView } from './components/modules/QuotationsView';
import { ApprovalsView } from './components/modules/ApprovalsView';
import { FulfillmentView } from './components/modules/FulfillmentView';
import { SubscriptionsView } from './components/modules/SubscriptionsView';
import { InvoicesView } from './components/modules/InvoicesView';
import { DealHealthView } from './components/modules/DealHealthView';
import { ReportsView } from './components/modules/ReportsView';
import { ProductsView } from './components/modules/ProductsView';
import { CustomerPortalView } from './components/customer/CustomerPortalView';
import { QuotationCreateModal } from './components/modules/QuotationCreateModal';
import { AuthView, UserAuthData } from './components/auth/AuthView';

export const App: React.FC = () => {
  // Authentication State (Default authenticated for seamless demo experience, or toggled)
  const [currentUser, setCurrentUser] = useState<UserAuthData | null>({
    email: 'rahul@dealflow360.com',
    name: 'Rahul Sharma',
    role: 'internal',
    company: 'DealFlow360 Operations',
  });

  const [viewMode, setViewMode] = useState<ViewMode>('internal');
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [activeQuotationForPortal, setActiveQuotationForPortal] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Core Operational Datasets State
  const [customers] = useState(INITIAL_CUSTOMERS);
  const [products] = useState(INITIAL_PRODUCTS);
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>(INITIAL_APPROVALS);
  const [fulfillments, setFulfillments] = useState<FulfillmentRecord[]>(INITIAL_FULFILLMENT);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(INITIAL_SUBSCRIPTIONS);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [dealHealthScores, setDealHealthScores] = useState<DealHealthScore[]>(INITIAL_DEAL_HEALTH);

  // Global Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isGlobalCreateModalOpen, setIsGlobalCreateModalOpen] = useState(false);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut listener for ⌘ K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auth Handlers
  const handleLoginSuccess = (user: UserAuthData) => {
    setCurrentUser(user);
    if (user.role === 'customer') {
      setViewMode('customer');
      addToast('success', `Welcome back, ${user.name}`, 'Redirected to your Acme Corp Customer Procurement Portal.');
    } else {
      setViewMode('internal');
      setActiveModule('dashboard');
      addToast('success', `Welcome back, ${user.name}`, 'Logged in to DealFlow360 Sales Operations Console.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    addToast('info', 'Logged Out', 'You have been safely signed out of DealFlow360.');
  };

  // Handler: Create Quotation
  const handleCreateQuotation = (newQuotation: Quotation) => {
    setQuotations((prev) => [newQuotation, ...prev]);

    if (newQuotation.requiresApproval) {
      const newApprovalRecord: ApprovalRecord = {
        id: `app-${Date.now()}`,
        quotationId: newQuotation.id,
        quotationCode: newQuotation.code,
        customerName: newQuotation.customerName,
        salesRep: newQuotation.salesRep,
        requestedDiscountPct: Number(((newQuotation.discountAmount / (newQuotation.subtotal || 1)) * 100).toFixed(1)),
        marginPct: newQuotation.marginPct,
        grandTotal: newQuotation.grandTotal,
        triggerReason: newQuotation.approvalReason || 'Discount rate exceeds standard delegation threshold.',
        tier: 'Manager Approval',
        status: 'pending',
        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      setApprovals((prev) => [newApprovalRecord, ...prev]);
      addToast(
        'info',
        `Quotation ${newQuotation.code} Created`,
        'Discount exceeds standard rep threshold. Routed to Approval Queue.'
      );
    } else {
      addToast('success', `Quotation ${newQuotation.code} Created`, 'Quotation is pre-approved and ready to send to customer.');
    }
  };

  // Handler: Update Quotation Status
  const handleUpdateQuotationStatus = (quotationId: string, newStatus: Quotation['status']) => {
    setQuotations((prev) =>
      prev.map((q) => {
        if (q.id === quotationId) {
          const updated = { ...q, status: newStatus };
          if (newStatus === 'fulfilled') {
            const exists = fulfillments.some((f) => f.quotationId === quotationId);
            if (!exists) {
              const newFul: FulfillmentRecord = {
                id: `ful-${Date.now()}`,
                quotationId: q.id,
                quotationCode: q.code,
                customerName: q.customerName,
                warehouseHub: q.warehouseHub,
                itemsCount: q.items.reduce((sum, item) => sum + item.quantity, 0),
                status: 'pending_pick',
                notes: 'Created automatically upon quote fulfillment dispatch release.',
              };
              setFulfillments((fPrev) => [newFul, ...fPrev]);
            }
          }
          return updated;
        }
        return q;
      })
    );

    addToast('success', 'Status Updated', `Quotation status updated to ${newStatus.replace(/_/g, ' ').toUpperCase()}`);
  };

  // Handler: Approval Sign-Off
  const handleApproveRecord = (approvalId: string, rationale: string) => {
    const targetApproval = approvals.find((a) => a.id === approvalId);
    if (!targetApproval) return;

    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: 'approved',
              reviewedBy: 'Rahul Sharma (Ops Director)',
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              rationale,
            }
          : a
      )
    );

    handleUpdateQuotationStatus(targetApproval.quotationId, 'approved');
    addToast('success', `Approval Granted for ${targetApproval.quotationCode}`, `Rationale logged: ${rationale}`);
  };

  // Handler: Approval Rejection
  const handleRejectRecord = (approvalId: string, rationale: string) => {
    const targetApproval = approvals.find((a) => a.id === approvalId);
    if (!targetApproval) return;

    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: 'rejected',
              reviewedBy: 'Rahul Sharma (Ops Director)',
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              rationale,
            }
          : a
      )
    );

    handleUpdateQuotationStatus(targetApproval.quotationId, 'rejected');
    addToast('error', `Approval Rejected for ${targetApproval.quotationCode}`, `Rationale logged: ${rationale}`);
  };

  // Handler: Update Fulfillment Dispatch
  const handleUpdateFulfillment = (
    recordId: string,
    status: FulfillmentStatus,
    carrier?: string,
    trackingNumber?: string
  ) => {
    setFulfillments((prev) =>
      prev.map((f) =>
        f.id === recordId
          ? {
              ...f,
              status,
              carrier: carrier || f.carrier,
              trackingNumber: trackingNumber || f.trackingNumber,
              dispatchDate: status === 'dispatched' ? new Date().toISOString().split('T')[0] : f.dispatchDate,
            }
          : f
      )
    );

    addToast('success', 'Logistics Dispatch Updated', `Shipment status set to ${status.toUpperCase()}`);
  };

  // Handler: Send Sales Rep Message
  const handleSendSalesRepMessage = (quotationId: string, message: string) => {
    setQuotations((prev) =>
      prev.map((q) => {
        if (q.id === quotationId) {
          const newMessage = {
            id: `msg-${Date.now()}`,
            quotationId,
            senderRole: 'sales_rep' as const,
            senderName: q.salesRep,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            message,
          };
          return { ...q, negotiationHistory: [...q.negotiationHistory, newMessage] };
        }
        return q;
      })
    );
    addToast('success', 'Message Sent', 'Response posted to customer negotiation thread.');
  };

  // Handler: Customer Portal Counter Offer Submission
  const handleCustomerSubmitCounter = (
    quotationId: string,
    counterDiscountPct: number,
    message: string,
    deliveryDate?: string
  ) => {
    setQuotations((prev) =>
      prev.map((q) => {
        if (q.id === quotationId) {
          const newMessage = {
            id: `msg-${Date.now()}`,
            quotationId,
            senderRole: 'customer' as const,
            senderName: q.customerContact,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            message,
            proposedDiscountPct: counterDiscountPct,
          };
          return {
            ...q,
            status: 'customer_countered',
            deliveryRequestDate: deliveryDate || q.deliveryRequestDate,
            negotiationHistory: [...q.negotiationHistory, newMessage],
          };
        }
        return q;
      })
    );

    addToast(
      'info',
      'Customer Counter-Offer Received',
      `Acme Corp submitted counter offer with ${counterDiscountPct}% target discount.`
    );
  };

  // Handler: Customer Portal Accept Quote
  const handleCustomerAcceptQuote = (quotationId: string) => {
    setQuotations((prev) =>
      prev.map((q) => {
        if (q.id === quotationId) {
          return { ...q, status: 'accepted' };
        }
        return q;
      })
    );

    const targetQ = quotations.find((q) => q.id === quotationId);
    if (targetQ) {
      const newFul: FulfillmentRecord = {
        id: `ful-${Date.now()}`,
        quotationId,
        quotationCode: targetQ.code,
        customerName: targetQ.customerName,
        warehouseHub: targetQ.warehouseHub,
        itemsCount: targetQ.items.reduce((sum, item) => sum + item.quantity, 0),
        status: 'pending_pick',
        notes: 'Accepted digitally by customer in Customer Portal.',
      };
      setFulfillments((prev) => [newFul, ...prev]);
    }

    addToast('success', 'Quotation Accepted & Signed!', 'Order released to Warehouse Fulfillment picking pipeline.');
  };

  // Handler: Mark Invoice Paid
  const handleMarkPaid = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, status: 'paid', amountPaid: i.totalAmount } : i))
    );
    addToast('success', 'Payment Recorded', 'Invoice marked paid and reconciled in ledger.');
  };

  const handleSendInvoiceReminder = (invoiceId: string) => {
    addToast('info', 'Reminder Dispatched', 'Payment reminder email sent to customer accounts payable.');
  };

  const handleOpenCustomerPortalWithQuote = (quotationId: string) => {
    setActiveQuotationForPortal(quotationId);
    setViewMode('customer');
  };

  const handleGenerateExpansionQuote = (sub: SubscriptionRecord) => {
    addToast('info', 'Expansion Draft Initialized', `Creating expansion quote proposal for ${sub.customerName}`);
    setIsGlobalCreateModalOpen(true);
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  // Unauthenticated Auth View
  if (!currentUser) {
    return (
      <div className="app-frame">
        <AuthView onLoginSuccess={handleLoginSuccess} />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  return (
    <div className="app-frame">
      {/* Top Application Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenSearch={() => setIsSearchOpen(true)}
        pendingApprovalsCount={pendingApprovalsCount}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Body with Glass Sidebar */}
      <div className="layout-body">
        {viewMode === 'internal' && (
          <Sidebar
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            pendingApprovalsCount={pendingApprovalsCount}
          />
        )}

        <main className="main-viewport" style={{ maxWidth: viewMode === 'customer' ? '100vw' : 'calc(100vw - 240px)' }}>
          {viewMode === 'customer' ? (
            <CustomerPortalView
              quotations={quotations}
              activeQuotationId={activeQuotationForPortal}
              onCustomerSubmitCounter={handleCustomerSubmitCounter}
              onCustomerAcceptQuote={handleCustomerAcceptQuote}
              onBackToInternal={() => setViewMode('internal')}
            />
          ) : (
            <>
              {activeModule === 'dashboard' && (
                <DashboardView
                  quotations={quotations}
                  approvals={approvals}
                  fulfillments={fulfillments}
                  subscriptions={subscriptions}
                  dealHealthScores={dealHealthScores}
                  setActiveModule={setActiveModule}
                  onSelectQuotation={(q) => {
                    setActiveModule('quotations');
                  }}
                  onOpenCreateModal={() => setIsGlobalCreateModalOpen(true)}
                />
              )}

              {activeModule === 'quotations' && (
                <QuotationsView
                  quotations={quotations}
                  customers={customers}
                  products={products}
                  onCreateQuotation={handleCreateQuotation}
                  onUpdateStatus={handleUpdateQuotationStatus}
                  onOpenCustomerPortal={handleOpenCustomerPortalWithQuote}
                  onSendSalesRepMessage={handleSendSalesRepMessage}
                />
              )}

              {activeModule === 'approvals' && (
                <ApprovalsView
                  approvals={approvals}
                  onApprove={handleApproveRecord}
                  onReject={handleRejectRecord}
                />
              )}

              {activeModule === 'fulfillment' && (
                <FulfillmentView
                  fulfillments={fulfillments}
                  onUpdateFulfillment={handleUpdateFulfillment}
                />
              )}

              {activeModule === 'subscriptions' && (
                <SubscriptionsView
                  subscriptions={subscriptions}
                  onGenerateExpansionQuote={handleGenerateExpansionQuote}
                />
              )}

              {activeModule === 'invoices' && (
                <InvoicesView
                  invoices={invoices}
                  onMarkPaid={handleMarkPaid}
                  onSendReminder={handleSendInvoiceReminder}
                />
              )}

              {activeModule === 'deal-health' && (
                <DealHealthView
                  dealHealthScores={dealHealthScores}
                  onOpenQuotation={(code) => {
                    setActiveModule('quotations');
                    addToast('info', `Opening Quotation ${code}`, `Navigated to Quotations workspace for inspection.`);
                  }}
                />
              )}

              {activeModule === 'reports' && (
                <ReportsView
                  quotations={quotations}
                  approvals={approvals}
                  products={products}
                />
              )}

              {activeModule === 'products' && <ProductsView products={products} />}
            </>
          )}
        </main>
      </div>

      {/* Global Creation Modal */}
      {isGlobalCreateModalOpen && (
        <QuotationCreateModal
          customers={customers}
          products={products}
          onClose={() => setIsGlobalCreateModalOpen(false)}
          onSave={(q) => {
            handleCreateQuotation(q);
            setIsGlobalCreateModalOpen(false);
            setActiveModule('quotations');
          }}
        />
      )}

      {/* Global Keyboard ⌘ K Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        quotations={quotations}
        customers={customers}
        products={products}
        onSelectQuotation={(q) => {
          setActiveModule('quotations');
        }}
        onSelectModule={(mod) => {
          setActiveModule(mod);
        }}
      />

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};

export default App;
