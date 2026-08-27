export type OrderStage = 'briefing' | 'approval' | 'preparation' | 'production' | 'finishing' | 'ready' | 'installation' | 'completed'
export type Priority = 'normal' | 'high' | 'urgent'
export type ArtworkStatus = 'draft' | 'sent' | 'changes' | 'approved'
export type DeliveryType = 'pickup' | 'localDelivery' | 'installation' | 'shipping'
export type DeliveryStatus = 'waiting' | 'scheduled' | 'inProgress' | 'completed'

export interface DemoConfig { companyName: string; subtitle: string; demoLabel: string; supportText: string; city: string }
export interface Customer { id: string; companyName: string; contactName: string; phone: string; city: string; status: 'active' | 'inactive'; notes?: string }
export interface Responsible { id: string; name: string; initials: string; roleLabel: string }
export interface MaterialRequirement { materialId: string; required: number; reserved: number }
export interface DeliveryInstallation { type: DeliveryType; scheduledDate?: string; location?: string; status: DeliveryStatus; assignedResponsibleId?: string; note?: string; trackingCode?: string }
export interface ActivityEvent { id: string; entityType: 'order' | 'artwork' | 'quote'; entityId: string; timestamp: string; type: string; label: string }

export interface Order {
  id: string; orderNumber: number; customerId: string; sourceQuoteId?: string; serviceType: string; description: string
  entryDate: string; promisedDate: string; priority: Priority; responsibleId: string; stage: OrderStage; artworkId?: string
  artworkRequired: boolean; total: number; received: number; paymentTerms?: string
  specifications: Record<string, string | number | boolean>; materialRequirements: MaterialRequirement[]
  deliveryInstallation: DeliveryInstallation; notes?: string
}

export interface ArtworkVersion { id: string; number: number; fileName: string; preview: 'facade' | 'vehicle' | 'banner' | 'card' | 'sign' | 'label'; createdAt: string; createdBy: string; note?: string; status: 'draft' | 'sent' | 'approved' | 'superseded'; approvedAt?: string; approvedBy?: string }
export interface ChangeRequest { id: string; linkedVersionId: string; text: string; createdAt: string; source: 'WhatsApp' | 'Telefone' | 'Presencial' | 'Outro'; status: 'pending' | 'completed'; resolvedAt?: string; resolvedByVersionId?: string }
export interface Approval { id: string; versionId: string; status: 'waiting' | 'approved' | 'changes'; requestedAt: string; respondedAt?: string; approvedBy?: string; note?: string }
export interface Artwork { id: string; orderId: string; currentVersionId: string; approvedVersionId?: string; status: ArtworkStatus; publicNote?: string; versions: ArtworkVersion[]; changeRequests: ChangeRequest[]; approvals: Approval[] }
export interface Material { id: string; code: string; category: string; name: string; unit: string; stock: number; reserved: number; minimum: number }
export interface Quote { id: string; number: number; customerId: string; createdAt: string; validUntil: string; status: 'draft' | 'sent' | 'waiting' | 'changes' | 'approved' | 'declined'; serviceType: string; specifications: string; installationIncluded: boolean; promisedDate?: string; total: number; notes?: string; convertedOrderId?: string }

export interface PrintState { version: number; config: DemoConfig; customers: Customer[]; responsibles: Responsible[]; orders: Order[]; artworks: Artwork[]; materials: Material[]; quotes: Quote[]; events: ActivityEvent[] }
