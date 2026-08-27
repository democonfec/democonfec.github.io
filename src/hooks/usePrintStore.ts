import { format } from 'date-fns'
import { useCallback, useMemo, useState } from 'react'
import { createSeed, STORAGE_KEY, STORAGE_VERSION } from '../data/seed'
import type { Order, OrderStage, PrintState } from '../types/domain'

const id = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
function loadState(): PrintState { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return createSeed(); const parsed = JSON.parse(raw) as PrintState; if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.orders) || !Array.isArray(parsed.artworks)) return createSeed(); return parsed } catch { return createSeed() } }

export function usePrintStore() {
  const [state, setState] = useState<PrintState>(loadState)
  const commit = useCallback((updater: (current: PrintState) => PrintState) => { setState((current) => { const next = updater(current); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* demo remains usable */ } return next }) }, [])
  const event = (entityId: string, type: string, label: string) => ({ id: id('ev'), entityType: 'order' as const, entityId, timestamp: new Date().toISOString(), type, label })

  const actions = useMemo(() => ({
    moveOrder(orderId: string, stage: OrderStage) {
      const order = state.orders.find((item) => item.id === orderId)
      const artwork = state.artworks.find((item) => item.id === order?.artworkId)
      if (order?.artworkRequired && ['preparation', 'production', 'finishing'].includes(stage) && artwork?.currentVersionId !== artwork?.approvedVersionId) return { ok: false, message: 'A versão atual da arte precisa ser aprovada antes de liberar a produção.' }
      commit((current) => ({ ...current, orders: current.orders.map((item) => item.id === orderId ? { ...item, stage } : item), events: [event(orderId, 'stage', `Produção movida para ${stage}`), ...current.events] }))
      return { ok: true, message: 'Etapa atualizada e registrada no histórico.' }
    },
    approveArtwork(orderId: string, versionId: string, approvedBy = 'Cliente demonstrativo') {
      commit((current) => ({ ...current,
        artworks: current.artworks.map((artwork) => artwork.orderId !== orderId ? artwork : { ...artwork, approvedVersionId: versionId, status: artwork.currentVersionId === versionId ? 'approved' : artwork.status, versions: artwork.versions.map((version) => version.id === versionId ? { ...version, status: 'approved', approvedAt: new Date().toISOString(), approvedBy } : version), approvals: [...artwork.approvals, { id: id('ap'), versionId, status: 'approved', requestedAt: new Date().toISOString(), respondedAt: new Date().toISOString(), approvedBy }] }),
        orders: current.orders.map((order) => order.id === orderId && order.stage === 'approval' ? { ...order, stage: 'preparation' } : order),
        events: [event(orderId, 'approval', `Arte aprovada: versão ${versionId.split('-').at(-1)?.toUpperCase()}`), ...current.events],
      }))
    },
    requestChange(orderId: string, versionId: string, text: string) {
      commit((current) => ({ ...current,
        artworks: current.artworks.map((artwork) => artwork.orderId !== orderId ? artwork : { ...artwork, status: 'changes', changeRequests: [...artwork.changeRequests, { id: id('cr'), linkedVersionId: versionId, text, createdAt: new Date().toISOString(), source: 'Outro', status: 'pending' }], approvals: [...artwork.approvals, { id: id('ap'), versionId, status: 'changes', requestedAt: new Date().toISOString(), respondedAt: new Date().toISOString(), note: text }] }),
        orders: current.orders.map((order) => order.id === orderId ? { ...order, stage: 'approval' } : order),
        events: [event(orderId, 'change-request', 'Cliente solicitou alteração na arte apresentada'), ...current.events],
      }))
    },
    createRevision(orderId: string) {
      commit((current) => ({ ...current, artworks: current.artworks.map((artwork) => { if (artwork.orderId !== orderId) return artwork; const last = artwork.versions.reduce((max, version) => Math.max(max, version.number), 0); const versionId = `${artwork.id}-v${last + 1}`; return { ...artwork, currentVersionId: versionId, status: 'sent', versions: [...artwork.versions, { id: versionId, number: last + 1, fileName: `revisao-${last + 1}.pdf`, preview: artwork.versions.at(-1)?.preview ?? 'sign', createdAt: new Date().toISOString(), createdBy: 'Marina Costa', note: 'Nova versão criada a partir das alterações solicitadas', status: 'sent' }], changeRequests: artwork.changeRequests.map((request) => request.status === 'pending' ? { ...request, status: 'completed', resolvedAt: new Date().toISOString(), resolvedByVersionId: versionId } : request), approvals: [...artwork.approvals, { id: id('ap'), versionId, status: 'waiting', requestedAt: new Date().toISOString() }] } }), events: [event(orderId, 'artwork-version', 'Nova versão de arte criada e enviada para aprovação'), ...current.events] }))
    },
    createOrder(input: { customerId: string; serviceType: string; description: string; promisedDate: string; total: number; received: number; priority: Order['priority']; installation: boolean }) {
      const nextNumber = Math.max(...state.orders.map((order) => order.orderNumber)) + 1
      const orderId = id('o')
      const artworkId = id('a')
      const versionId = `${artworkId}-v1`
      const order: Order = { id: orderId, orderNumber: nextNumber, customerId: input.customerId, serviceType: input.serviceType, description: input.description, entryDate: format(new Date(), 'yyyy-MM-dd'), promisedDate: input.promisedDate, priority: input.priority, responsibleId: 'r2', stage: 'briefing', artworkId, artworkRequired: true, total: input.total, received: input.received, specifications: { Escopo: input.description }, materialRequirements: [], deliveryInstallation: { type: input.installation ? 'installation' : 'pickup', status: 'waiting' } }
      commit((current) => ({ ...current, orders: [order, ...current.orders], artworks: [{ id: artworkId, orderId, currentVersionId: versionId, status: 'draft', publicNote: 'Arte em preparação.', versions: [{ id: versionId, number: 1, fileName: `pedido-${nextNumber}-v1.pdf`, preview: 'sign', createdAt: new Date().toISOString(), createdBy: 'Marina Costa', status: 'draft' }], changeRequests: [], approvals: [] }, ...current.artworks], events: [event(orderId, 'created', `Pedido #${nextNumber} criado`), ...current.events] }))
      return orderId
    },
    convertQuote(quoteId: string) {
      const quote = state.quotes.find((item) => item.id === quoteId)
      if (!quote || quote.status !== 'approved' || quote.convertedOrderId) return { ok: false, message: 'Este orçamento não pode ser convertido.' }
      const nextNumber = Math.max(...state.orders.map((order) => order.orderNumber)) + 1
      const orderId = id('o')
      const artworkId = id('a')
      const versionId = `${artworkId}-v1`
      const order: Order = { id: orderId, orderNumber: nextNumber, customerId: quote.customerId, sourceQuoteId: quote.id, serviceType: quote.serviceType, description: quote.specifications, entryDate: format(new Date(), 'yyyy-MM-dd'), promisedDate: quote.promisedDate ?? quote.validUntil, priority: 'normal', responsibleId: 'r2', stage: 'briefing', artworkId, artworkRequired: true, total: quote.total, received: 0, specifications: { Especificações: quote.specifications }, materialRequirements: [], deliveryInstallation: { type: quote.installationIncluded ? 'installation' : 'pickup', status: 'waiting' } }
      commit((current) => ({ ...current, orders: [order, ...current.orders], artworks: [{ id: artworkId, orderId, currentVersionId: versionId, status: 'draft', versions: [{ id: versionId, number: 1, fileName: `pedido-${nextNumber}-v1.pdf`, preview: 'sign', createdAt: new Date().toISOString(), createdBy: 'Marina Costa', status: 'draft' }], changeRequests: [], approvals: [] }, ...current.artworks], quotes: current.quotes.map((item) => item.id === quoteId ? { ...item, convertedOrderId: orderId } : item), events: [event(orderId, 'quote-converted', `Orçamento #${quote.number} convertido no pedido #${nextNumber}`), ...current.events] }))
      return { ok: true, message: `Pedido #${nextNumber} criado a partir do orçamento.` }
    },
    reset() { const next = createSeed(); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* noop */ } setState(next) },
  }), [commit, state])
  return { state, actions }
}
