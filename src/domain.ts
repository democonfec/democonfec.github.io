export type Priority = 'baixa' | 'normal' | 'alta' | 'urgente';
export type QuoteStatus = 'rascunho' | 'aguardando aprovação' | 'aprovado' | 'alteração solicitada' | 'convertido em pedido';
export type ArtworkStatus = 'enviada' | 'alteração solicitada' | 'aprovada';

export interface Client { id: string; companyName: string; contactName: string; phone: string; city: string; status: 'ativo' | 'inativo'; notes?: string }
export interface Responsible { id: string; name: string; initials: string; roleLabel: string }
export interface Stage { id: string; label: string; order: number; tone: string }
export interface SizeRow { color: string; P: number; M: number; G: number; GG: number; XG: number }
export interface Artwork { id: string; version: string; createdAt: string; responsibleId: string; status: ArtworkStatus; note: string; colors: string[] }
export interface Material { id: string; code: string; name: string; category: string; unit: string; stockOnHand: number; minimum: number }
export interface MaterialNeed { materialId: string; required: number; allocated: number }
export interface HistoryEvent { id: string; timestamp: string; type: string; label: string }
export interface Order {
  id: string; number: number; clientId: string; responsibleId: string; createdAt: string; deadline: string; priority: Priority; stageId: string;
  description: string; product: string; quantity: number; amount: number; deposit: number; receivedAmount: number; paymentTerms: string;
  colors: string[]; sizeGrid: SizeRow[]; artworkVersions: Artwork[]; materialNeeds: MaterialNeed[]; technicalNotes: string; customerNotes?: string;
  sourceQuoteId?: string; history: HistoryEvent[];
}
export interface Quote {
  id: string; number: number; clientId: string; createdAt: string; validUntil: string; status: QuoteStatus; product: string; quantity: number;
  colors: string[]; sizeGrid: SizeRow[]; customization: string; estimatedDeadline: string; amount: number; notes: string;
  customerChangeRequest?: string; convertedOrderId?: string; history: HistoryEvent[];
}
export interface DemoConfig { companyName: string; logoText: string; primaryColor: string; city: string; salesperson: string; demoLabel: string }
export interface AppState { version: 1; generatedAt: string; clients: Client[]; responsibles: Responsible[]; stages: Stage[]; orders: Order[]; quotes: Quote[]; materials: Material[]; config: DemoConfig }

export const sizes = ['P', 'M', 'G', 'GG', 'XG'] as const;
export const gridTotal = (grid: SizeRow[]) => grid.reduce((sum, row) => sum + sizes.reduce((rowSum, size) => rowSum + row[size], 0), 0);
export const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export const shortDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
export const dayMonth = (value: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`));
export const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
