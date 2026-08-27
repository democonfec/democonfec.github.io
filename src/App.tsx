import { AlertTriangle, ArrowRight, Boxes, CalendarDays, Check, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, Clock3, Factory, FileCheck2, LayoutDashboard, Menu, PackageOpen, Plus, Printer, RotateCcw, Search, Send, Sparkles, UsersRound, Wrench, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { HashRouter } from 'react-router-dom'
import { usePrintStore } from './hooks/usePrintStore'
import { artworkFor, artworkLabels, available, balance, customerFor, getAlerts, getMetrics, hasLowStock, isOverdue, responsibleFor, stageLabels } from './lib/selectors'
import { formatCurrencyBRL } from './lib/format'
import type { Artwork, Order, OrderStage, PrintState } from './types/domain'

type View = 'dashboard' | 'orders' | 'artworks' | 'production' | 'quotes' | 'customers' | 'materials'
type Store = ReturnType<typeof usePrintStore>
const dateLabel = (value?: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'A definir'
const timestampLabel = (value: string) => new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const deliveryLabels = { pickup: 'Retirada', localDelivery: 'Entrega local', installation: 'Instalação', shipping: 'Envio' }
const priorityLabels = { normal: 'Normal', high: 'Alta', urgent: 'Urgente' }

function Preview({ artwork, state, order, compact = false }: { artwork: Artwork; state: PrintState; order: Order; compact?: boolean }) {
  const version = artwork.versions.find((item) => item.id === artwork.currentVersionId)
  const customer = customerFor(state, order)
  return <div className={`art-preview preview-${version?.preview ?? 'sign'} ${compact ? 'compact' : ''}`}>
    <span className="preview-kicker">PROVA DE ARTE · V{version?.number}</span>
    <b>{customer?.companyName}</b><em>{order.serviceType}</em>
    <small>{version?.fileName}</small>
  </div>
}

function Status({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: string }) { return <span className={`status-chip tone-${tone}`}>{children}</span> }

function PageHead({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div>{action}</header>
}

function Dashboard({ store, openOrder, go }: { store: Store; openOrder: (id: string) => void; go: (view: View) => void }) {
  const { state } = store
  const metrics = getMetrics(state)
  const alerts = getAlerts(state).slice(0, 6)
  const installations = state.orders.filter((order) => order.deliveryInstallation.type === 'installation' && order.stage !== 'completed').sort((a,b) => (a.deliveryInstallation.scheduledDate ?? '9999').localeCompare(b.deliveryInstallation.scheduledDate ?? '9999')).slice(0,3)
  return <>
    <PageHead eyebrow="OPERAÇÃO DE HOJE" title="Bom dia, equipe." subtitle="Veja o que precisa da sua atenção hoje." action={<button className="round-avatar" aria-label="Perfil de Marina Costa">MC</button>}/>
    <section className="metric-grid" aria-label="Indicadores">
      <article><span>Pedidos em andamento</span><strong>{metrics.active}</strong><small><Factory size={14}/> operação ativa</small></article>
      <article><span>Aguardando aprovação</span><strong>{metrics.waiting}</strong><small className="amber"><Clock3 size={14}/> depende do cliente</small></article>
      <article><span>Prazos vencidos</span><strong>{metrics.overdue}</strong><small className="red"><AlertTriangle size={14}/> requer ação</small></article>
      <article><span>Valor em aberto</span><strong className="currency">{formatCurrencyBRL(metrics.openBalance)}</strong><small><CircleDollarSign size={14}/> saldo dos ativos</small></article>
    </section>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-title"><div><p className="eyebrow">PRIORIDADES</p><h2>Precisa da sua atenção</h2></div><span>{alerts.length} itens</span></div><div className="alert-list">{alerts.map((alert) => <button key={`${alert.orderId}-${alert.kind}`} className="alert-row" onClick={() => openOrder(alert.orderId)}><span className={`alert-icon ${alert.tone}`}><AlertTriangle size={17}/></span><span><b>{alert.title}</b><small>{alert.detail}</small></span><ChevronRight size={17}/></button>)}</div></section>
      <section className="panel"><div className="panel-title"><div><p className="eyebrow">FLUXO</p><h2>Produção por etapa</h2></div><button className="text-button" onClick={() => go('production')}>Ver quadro</button></div><div className="stage-list">{Object.entries(stageLabels).filter(([key]) => key !== 'completed').map(([key, label]) => { const count = state.orders.filter((order) => order.stage === key).length; return <div key={key}><span>{label}</span><b>{count}</b><i><em style={{width: `${Math.max(8, count * 31)}%`}}/></i></div> })}</div></section>
    </div>
    <div className="dashboard-grid lower-grid">
      <section className="panel"><div className="panel-title"><div><p className="eyebrow">EM MOVIMENTO</p><h2>Pedidos recentes</h2></div><button className="text-button" onClick={() => go('orders')}>Ver todos</button></div><div className="compact-orders">{state.orders.slice(0,5).map((order) => <button key={order.id} onClick={() => openOrder(order.id)}><span><b>#{order.orderNumber} · {customerFor(state, order)?.companyName}</b><small>{order.serviceType}</small></span><Status tone={order.stage === 'approval' ? 'warning' : order.stage === 'production' ? 'blue' : 'green'}>{stageLabels[order.stage]}</Status><ChevronRight size={16}/></button>)}</div></section>
      <section className="panel"><div className="panel-title"><div><p className="eyebrow">AGENDA</p><h2>Próximas instalações</h2></div><CalendarDays size={19}/></div><div className="installation-list">{installations.map((order) => <button key={order.id} onClick={() => openOrder(order.id)}><span className="date-tile"><b>{order.deliveryInstallation.scheduledDate ? dateLabel(order.deliveryInstallation.scheduledDate).split(' ')[0] : '—'}</b><small>{order.deliveryInstallation.scheduledDate ? dateLabel(order.deliveryInstallation.scheduledDate).split(' ')[1] : 'agendar'}</small></span><span><b>{customerFor(state, order)?.companyName}</b><small>{order.deliveryInstallation.location}</small></span></button>)}</div></section>
    </div>
    <p className="model-note">{state.config.supportText}</p>
  </>
}

function OrdersPage({ store, openOrder, openCreate }: { store: Store; openOrder: (id: string) => void; openCreate: () => void }) {
  const { state } = store
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('all')
  const filtered = state.orders.filter((order) => { const customer = customerFor(state, order); const haystack = `${order.orderNumber} ${order.serviceType} ${customer?.companyName}`.toLowerCase(); return haystack.includes(search.toLowerCase()) && (stage === 'all' || order.stage === stage) })
  return <><PageHead eyebrow="PEDIDOS / ORDENS DE SERVIÇO" title="Pedidos" subtitle="Cliente, arte, materiais e produção na mesma trilha." action={<button className="primary-button" onClick={openCreate}><Plus size={17}/> Novo pedido</button>}/>
    <section className="panel"><div className="toolbar"><label className="search-field"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar número, cliente ou serviço"/></label><label><span>Etapa</span><select value={stage} onChange={(event) => setStage(event.target.value)}><option value="all">Todas</option>{Object.entries(stageLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
      {filtered.length ? <div className="data-table orders-table"><div className="table-head"><span>Pedido / cliente</span><span>Serviço</span><span>Prazo</span><span>Etapa</span><span>Arte</span><span></span></div>{filtered.map((order) => { const artwork = artworkFor(state, order); return <button className="table-row" key={order.id} onClick={() => openOrder(order.id)}><span><b>#{order.orderNumber}</b><small>{customerFor(state, order)?.companyName}</small></span><span>{order.serviceType}</span><span className={isOverdue(order) ? 'text-danger' : ''}>{dateLabel(order.promisedDate)}</span><span><Status tone={order.stage === 'approval' ? 'warning' : order.stage === 'completed' ? 'green' : 'blue'}>{stageLabels[order.stage]}</Status></span><span><Status tone={artwork?.status === 'approved' ? 'green' : artwork?.status === 'changes' ? 'danger' : 'warning'}>{artwork ? artworkLabels[artwork.status] : 'Não se aplica'}</Status></span><ChevronRight size={17}/></button> })}</div> : <div className="empty-state"><Search/><b>Nenhum pedido encontrado</b><p>Ajuste a busca ou os filtros para continuar.</p></div>}
    </section></>
}

function ArtworksPage({ store, openOrder, openPortal }: { store: Store; openOrder: (id: string) => void; openPortal: (id: string) => void }) {
  const { state } = store
  const [filter, setFilter] = useState('all')
  const items = state.artworks.filter((artwork) => filter === 'all' || artwork.status === filter)
  return <><PageHead eyebrow="CONTROLE DE PROVAS" title="Artes e aprovações" subtitle="Saiba qual versão está atual, qual foi aprovada e o que o cliente pediu."/>
    <div className="filter-pills" role="group" aria-label="Filtrar artes">{[['all','Todas'],['sent','Aguardando'],['changes','Com alteração'],['approved','Aprovadas']].map(([key,label]) => <button className={filter === key ? 'active' : ''} onClick={() => setFilter(key)} key={key}>{label}</button>)}</div>
    <section className="artwork-grid">{items.map((artwork) => { const order = state.orders.find((item) => item.id === artwork.orderId)!; const current = artwork.versions.find((item) => item.id === artwork.currentVersionId); const approved = artwork.versions.find((item) => item.id === artwork.approvedVersionId); return <article className="artwork-card" key={artwork.id}><Preview artwork={artwork} order={order} state={state} compact/><div className="art-card-body"><div><span className="order-ref">#{order.orderNumber} · {order.serviceType}</span><h3>{customerFor(state, order)?.companyName}</h3></div><Status tone={artwork.status === 'approved' ? 'green' : artwork.status === 'changes' ? 'danger' : 'warning'}>{artworkLabels[artwork.status]}</Status><div className="version-pair"><span>Versão atual <b>V{current?.number}</b></span><span>Versão aprovada <b>{approved ? `V${approved.number}` : '—'}</b></span></div>{current?.id !== approved?.id && approved ? <div className="version-warning"><AlertTriangle size={15}/> A atual ainda não está aprovada.</div> : null}<div className="card-actions"><button className="secondary-button" onClick={() => openOrder(order.id)}>Abrir contexto</button><button className="icon-button" aria-label="Abrir portal do cliente" onClick={() => openPortal(order.id)}><Send size={17}/></button></div></div></article> })}</section>
  </>
}

function ProductionPage({ store, notify, openOrder }: { store: Store; notify: (message: string, type?: string) => void; openOrder: (id: string) => void }) {
  const { state, actions } = store
  const stages = (Object.keys(stageLabels) as OrderStage[]).filter((key) => !['briefing','approval','completed'].includes(key))
  const move = (orderId: string, stage: OrderStage) => { const result = actions.moveOrder(orderId, stage); notify(result.message, result.ok ? 'success' : 'error') }
  return <><PageHead eyebrow="CHÃO DE FÁBRICA" title="Produção" subtitle="Um quadro operacional, com aprovação atuando como gate real."/><div className="kanban">{stages.map((stage) => <section className="kanban-column" key={stage}><header><span className={`stage-dot dot-${stage}`}/><b>{stageLabels[stage]}</b><small>{state.orders.filter((order) => order.stage === stage).length}</small></header><div>{state.orders.filter((order) => order.stage === stage).map((order) => <article className="kanban-card" key={order.id}><button className="kanban-open" onClick={() => openOrder(order.id)}><span className="order-ref">#{order.orderNumber}</span><h3>{customerFor(state, order)?.companyName}</h3><p>{order.serviceType}</p></button><div className="kanban-meta"><span className={`priority priority-${order.priority}`}>{priorityLabels[order.priority]}</span><span className={isOverdue(order) ? 'text-danger' : ''}>{dateLabel(order.promisedDate)}</span></div><label><span>Mover para</span><select aria-label={`Mover pedido ${order.orderNumber}`} value={order.stage} onChange={(event) => move(order.id, event.target.value as OrderStage)}>{Object.entries(stageLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label></article>)}</div></section>)}</div></>
}

function QuotesPage({ store, notify, openOrder }: { store: Store; notify: (message: string, type?: string) => void; openOrder: (id: string) => void }) {
  const { state, actions } = store
  const labels = { draft: 'Rascunho', sent: 'Enviado', waiting: 'Aguardando', changes: 'Alteração', approved: 'Aprovado', declined: 'Recusado' }
  const convert = (id: string) => { const result = actions.convertQuote(id); notify(result.message, result.ok ? 'success' : 'error') }
  return <><PageHead eyebrow="COMERCIAL" title="Orçamentos" subtitle="Propostas com escopo claro e conversão rastreável em pedido." action={<button className="primary-button"><Plus size={17}/> Novo orçamento</button>}/><section className="quote-grid">{state.quotes.map((quote) => <article className="quote-card" key={quote.id}><header><span><small>ORÇAMENTO</small><b>#{quote.number}</b></span><Status tone={quote.status === 'approved' ? 'green' : quote.status === 'changes' ? 'danger' : 'warning'}>{labels[quote.status]}</Status></header><h3>{state.customers.find((customer) => customer.id === quote.customerId)?.companyName}</h3><p>{quote.serviceType}</p><div className="quote-spec">{quote.specifications}</div><div className="quote-total"><span>Valor total</span><b>{formatCurrencyBRL(quote.total)}</b></div>{quote.notes ? <small className="quote-note">{quote.notes}</small> : null}{quote.convertedOrderId ? <button className="secondary-button full" onClick={() => openOrder(quote.convertedOrderId!)}><Check size={16}/> Pedido criado</button> : quote.status === 'approved' ? <button className="primary-button full" onClick={() => convert(quote.id)}>Converter em pedido <ArrowRight size={16}/></button> : <button className="secondary-button full">Abrir orçamento</button>}</article>)}</section></>
}

function CustomersPage({ store }: { store: Store }) {
  const { state } = store
  return <><PageHead eyebrow="RELACIONAMENTO" title="Clientes" subtitle="Histórico comercial e operacional sem virar um CRM pesado."/><section className="panel"><div className="data-table customer-table"><div className="table-head"><span>Empresa / contato</span><span>Cidade</span><span>Pedidos ativos</span><span>Último serviço</span><span>Em aberto</span></div>{state.customers.map((customer) => { const orders = state.orders.filter((order) => order.customerId === customer.id); const active = orders.filter((order) => order.stage !== 'completed'); return <div className="table-row" key={customer.id}><span><b>{customer.companyName}</b><small>{customer.contactName} · {customer.phone}</small></span><span>{customer.city}</span><span>{active.length}</span><span>{orders.at(0)?.serviceType ?? '—'}</span><span>{formatCurrencyBRL(active.reduce((sum, order) => sum + balance(order), 0))}</span></div> })}</div></section></>
}

function MaterialsPage({ store }: { store: Store }) {
  const { state } = store
  return <><PageHead eyebrow="INSUMOS" title="Materiais" subtitle="Estoque, reserva e disponibilidade calculados a partir da operação."/><section className="material-grid">{state.materials.map((material) => { const free = available(material); return <article className="material-card" key={material.id}><header><span className="material-icon"><Boxes size={19}/></span><Status tone={hasLowStock(material) ? 'danger' : 'green'}>{hasLowStock(material) ? 'Crítico' : 'Disponível'}</Status></header><span className="order-ref">{material.code} · {material.category}</span><h3>{material.name}</h3><div className="stock-number"><b>{free}</b><span>{material.unit} disponíveis</span></div><div className="stock-bar"><i style={{width: `${Math.min(100, Math.max(4, (free / Math.max(material.stock, 1)) * 100))}%`}}/></div><footer><span>Estoque <b>{material.stock}</b></span><span>Reservado <b>{material.reserved}</b></span><span>Mínimo <b>{material.minimum}</b></span></footer></article> })}</section></>
}

function OrderDrawer({ store, orderId, close, notify, openPortal }: { store: Store; orderId: string; close: () => void; notify: (message: string, type?: string) => void; openPortal: () => void }) {
  const { state, actions } = store
  const order = state.orders.find((item) => item.id === orderId)
  const [tab, setTab] = useState<'overview' | 'art' | 'history'>('overview')
  if (!order) return null
  const artwork = artworkFor(state, order)
  const current = artwork?.versions.find((version) => version.id === artwork.currentVersionId)
  const approved = artwork?.versions.find((version) => version.id === artwork.approvedVersionId)
  const events = state.events.filter((item) => item.entityId === order.id).sort((a,b) => b.timestamp.localeCompare(a.timestamp))
  const move = (stage: OrderStage) => { const result = actions.moveOrder(order.id, stage); notify(result.message, result.ok ? 'success' : 'error') }
  return <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}><aside className="drawer wide"><header className="drawer-header"><div><p className="eyebrow">PEDIDO #{order.orderNumber}</p><h2>{order.serviceType}</h2><p>{customerFor(state, order)?.companyName}</p></div><button className="icon-button" onClick={close} aria-label="Fechar"><X size={19}/></button></header><div className="drawer-tabs"><button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Visão geral</button><button className={tab === 'art' ? 'active' : ''} onClick={() => setTab('art')}>Arte e aprovação</button><button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Histórico</button></div>
      {tab === 'overview' ? <div className="drawer-body"><div className="summary-strip"><span>Etapa <b>{stageLabels[order.stage]}</b></span><span>Prazo <b className={isOverdue(order) ? 'text-danger' : ''}>{dateLabel(order.promisedDate)}</b></span><span>Responsável <b>{responsibleFor(state, order)?.name}</b></span><span>Saldo <b>{formatCurrencyBRL(balance(order))}</b></span></div><section className="detail-section"><h3>Especificações do serviço</h3><div className="spec-grid">{Object.entries(order.specifications).map(([key,value]) => <span key={key}><small>{key}</small><b>{String(value)}</b></span>)}</div></section><section className="detail-section"><h3>Produção</h3><label className="field"><span>Etapa atual</span><select value={order.stage} onChange={(event) => move(event.target.value as OrderStage)}>{Object.entries(stageLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label></section><section className="detail-section"><h3>{deliveryLabels[order.deliveryInstallation.type]}</h3><div className="spec-grid"><span><small>Status</small><b>{order.deliveryInstallation.status}</b></span><span><small>Data</small><b>{dateLabel(order.deliveryInstallation.scheduledDate)}</b></span><span><small>Local</small><b>{order.deliveryInstallation.location ?? 'Balcão da gráfica'}</b></span></div></section>{order.materialRequirements.length ? <section className="detail-section"><h3>Materiais deste pedido</h3><div className="requirements">{order.materialRequirements.map((requirement) => { const material = state.materials.find((item) => item.id === requirement.materialId); const missing = Math.max(0, requirement.required - requirement.reserved); return <div key={requirement.materialId}><span><b>{material?.name}</b><small>Necessário {requirement.required} {material?.unit} · reservado {requirement.reserved}</small></span><Status tone={missing > 0 ? 'danger' : 'green'}>{missing > 0 ? `Falta ${missing}` : 'Coberto'}</Status></div> })}</div></section> : null}</div> : null}
      {tab === 'art' && artwork ? <div className="drawer-body"><Preview artwork={artwork} order={order} state={state}/><div className="version-current"><div><small>VERSÃO ATUAL</small><b>V{current?.number} · {current?.fileName}</b></div><Status tone={current?.id === approved?.id ? 'green' : 'warning'}>{current?.id === approved?.id ? 'Aprovada' : 'Aguardando decisão'}</Status></div><div className="approval-clarity"><span><small>Versão em uso</small><b>V{current?.number}</b></span><ArrowRight/><span><small>Versão aprovada</small><b>{approved ? `V${approved.number}` : 'Nenhuma'}</b></span></div>{artwork.changeRequests.filter((request) => request.status === 'pending').map((request) => <div className="change-callout" key={request.id}><AlertTriangle size={18}/><span><b>Alteração pendente na V{artwork.versions.find((version) => version.id === request.linkedVersionId)?.number}</b><p>{request.text}</p></span><button className="secondary-button" onClick={() => { actions.createRevision(order.id); notify('Nova versão criada sem apagar a anterior.', 'success') }}>Criar nova versão</button></div>)}<div className="version-history"><h3>Histórico de versões</h3>{[...artwork.versions].reverse().map((version) => <div key={version.id}><span className="version-number">V{version.number}</span><span><b>{version.fileName}</b><small>{timestampLabel(version.createdAt)} · {version.createdBy}</small></span><Status tone={version.id === artwork.approvedVersionId ? 'green' : 'neutral'}>{version.id === artwork.approvedVersionId ? 'Aprovada' : version.status}</Status></div>)}</div><button className="primary-button full" onClick={openPortal}><Send size={17}/> Abrir visão do cliente</button></div> : null}
      {tab === 'history' ? <div className="drawer-body"><div className="timeline">{events.map((item) => <div key={item.id}><i/><span><b>{item.label}</b><small>{timestampLabel(item.timestamp)}</small></span></div>)}</div></div> : null}
    </aside></div>
}

function ClientPortal({ store, orderId, close, notify }: { store: Store; orderId: string; close: () => void; notify: (message: string, type?: string) => void }) {
  const { state, actions } = store
  const order = state.orders.find((item) => item.id === orderId)!
  const artwork = artworkFor(state, order)!
  const current = artwork.versions.find((item) => item.id === artwork.currentVersionId)!
  const [changeMode, setChangeMode] = useState(false)
  const [note, setNote] = useState('')
  return <div className="portal-overlay"><div className="portal-shell"><header><div className="portal-brand"><span className="brand-mark"><Printer size={19}/></span><span><b>{state.config.companyName}</b><small>Portal de aprovação</small></span></div><button className="icon-button" onClick={close}><X size={18}/></button></header><main><div className="portal-heading"><Status tone="warning">Ambiente demonstrativo</Status><p>Olá, {customerFor(state, order)?.contactName}</p><h1>Revise a arte do seu pedido</h1><span>Pedido #{order.orderNumber} · {order.serviceType}</span></div><Preview artwork={artwork} order={order} state={state}/><div className="portal-version"><span>Versão apresentada <b>V{current.number}</b></span><span>Prazo do pedido <b>{dateLabel(order.promisedDate)}</b></span></div><div className="portal-note"><Sparkles size={17}/><p>{artwork.publicNote}</p></div>{changeMode ? <div className="change-form"><label className="field"><span>O que precisa ser alterado?</span><textarea autoFocus value={note} onChange={(event) => setNote(event.target.value)} placeholder="Descreva a alteração com clareza..." rows={4}/></label><div className="modal-actions"><button className="secondary-button" onClick={() => setChangeMode(false)}>Voltar</button><button className="primary-button" disabled={!note.trim()} onClick={() => { actions.requestChange(order.id, current.id, note); notify('Alteração registrada e refletida no administrativo.', 'success'); close() }}>Enviar solicitação</button></div></div> : <div className="portal-actions"><button className="secondary-button" onClick={() => setChangeMode(true)}><Wrench size={17}/> Solicitar alteração</button><button className="primary-button" onClick={() => { actions.approveArtwork(order.id, current.id, customerFor(state, order)?.contactName); notify(`Versão V${current.number} aprovada com sucesso.`, 'success'); close() }}><Check size={17}/> Aprovar esta versão</button></div>}<small className="legal-note">Ao aprovar, você confirma especificamente a versão V{current.number} apresentada acima.</small></main></div></div>
}

function CreateOrderModal({ store, close, notify, openOrder }: { store: Store; close: () => void; notify: (message: string, type?: string) => void; openOrder: (id: string) => void }) {
  const { state, actions } = store
  const [form, setForm] = useState({ customerId: state.customers[0].id, serviceType: 'Fachada em ACM', description: '', promisedDate: '', total: 0, received: 0, priority: 'normal' as Order['priority'], installation: true })
  const update = (key: string, value: string | number | boolean) => setForm((current) => ({ ...current, [key]: value }))
  const submit = (event: React.FormEvent) => { event.preventDefault(); const orderId = actions.createOrder(form); notify('Pedido criado e incluído na operação.', 'success'); close(); openOrder(orderId) }
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><header><div><p className="eyebrow">NOVA ORDEM DE SERVIÇO</p><h2>Criar pedido</h2></div><button type="button" className="icon-button" onClick={close}><X size={18}/></button></header><div className="form-grid"><label className="field full"><span>Cliente</span><select value={form.customerId} onChange={(event) => update('customerId', event.target.value)}>{state.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></label><label className="field"><span>Serviço</span><select value={form.serviceType} onChange={(event) => update('serviceType', event.target.value)}>{['Fachada em ACM','Banner','Adesivação de veículo','Adesivo de vitrine','Panfletos','Cartões de visita','Placas','Letra-caixa iluminada'].map((service) => <option key={service}>{service}</option>)}</select></label><label className="field"><span>Prazo prometido</span><input required type="date" value={form.promisedDate} onChange={(event) => update('promisedDate', event.target.value)}/></label><label className="field full"><span>Descrição / briefing</span><textarea required rows={3} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Escopo principal, dimensões e acabamento..."/></label><label className="field"><span>Valor total</span><input required min="0" type="number" value={form.total || ''} onChange={(event) => update('total', Number(event.target.value))}/></label><label className="field"><span>Entrada recebida</span><input min="0" type="number" value={form.received || ''} onChange={(event) => update('received', Number(event.target.value))}/></label><label className="field"><span>Prioridade</span><select value={form.priority} onChange={(event) => update('priority', event.target.value)}><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label><label className="check-field"><input type="checkbox" checked={form.installation} onChange={(event) => update('installation', event.target.checked)}/><span>Instalação inclusa</span></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancelar</button><button className="primary-button" type="submit">Criar pedido</button></div></form></div>
}

function AppShell() {
  const store = usePrintStore()
  const { state } = store
  const [view, setView] = useState<View>('dashboard')
  const [selectedOrderId, setSelectedOrderId] = useState<string>()
  const [portalOrderId, setPortalOrderId] = useState<string>()
  const [createOpen, setCreateOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: string }>()
  const notify = (message: string, type = 'success') => { setToast({ message, type }); window.setTimeout(() => setToast(undefined), 3600) }
  const nav = useMemo(() => [
    { id: 'dashboard' as View, label: 'Visão geral', icon: LayoutDashboard }, { id: 'orders' as View, label: 'Pedidos', icon: PackageOpen }, { id: 'artworks' as View, label: 'Artes', icon: FileCheck2 }, { id: 'production' as View, label: 'Produção', icon: Factory }, { id: 'quotes' as View, label: 'Orçamentos', icon: ClipboardList }, { id: 'customers' as View, label: 'Clientes', icon: UsersRound }, { id: 'materials' as View, label: 'Materiais', icon: Boxes },
  ], [])
  const go = (next: View) => { setView(next); setMobileMenu(false); window.scrollTo(0,0) }
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'open' : ''}`}><div className="brand"><span className="brand-mark"><Printer size={20}/></span><span><b>{state.config.companyName}</b><small>{state.config.subtitle}</small></span></div><nav aria-label="Menu principal">{nav.map((item) => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => go(item.id)}><item.icon size={18}/><span>{item.label}</span></button>)}</nav><div className="sidebar-lower"><button className="nav-item" onClick={() => { store.actions.reset(); notify('Dados fictícios restaurados.', 'success') }}><RotateCcw size={18}/><span>Restaurar demo</span></button><div className="demo-note"><span className="pulse-dot"/>{state.config.demoLabel}</div></div></aside>
    <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menu"><Menu/></button>
    <main className="main-content">{view === 'dashboard' && <Dashboard store={store} openOrder={setSelectedOrderId} go={go}/>} {view === 'orders' && <OrdersPage store={store} openOrder={setSelectedOrderId} openCreate={() => setCreateOpen(true)}/>} {view === 'artworks' && <ArtworksPage store={store} openOrder={setSelectedOrderId} openPortal={setPortalOrderId}/>} {view === 'production' && <ProductionPage store={store} notify={notify} openOrder={setSelectedOrderId}/>} {view === 'quotes' && <QuotesPage store={store} notify={notify} openOrder={setSelectedOrderId}/>} {view === 'customers' && <CustomersPage store={store}/>} {view === 'materials' && <MaterialsPage store={store}/>}</main>
    {selectedOrderId ? <OrderDrawer store={store} orderId={selectedOrderId} close={() => setSelectedOrderId(undefined)} notify={notify} openPortal={() => setPortalOrderId(selectedOrderId)}/> : null}
    {portalOrderId ? <ClientPortal store={store} orderId={portalOrderId} close={() => setPortalOrderId(undefined)} notify={notify}/> : null}
    {createOpen ? <CreateOrderModal store={store} close={() => setCreateOpen(false)} notify={notify} openOrder={setSelectedOrderId}/> : null}
    {toast ? <div className={`toast ${toast.type}`} role="status"><CheckCircle2 size={18}/>{toast.message}</div> : null}
  </div>
}

export default function App() { return <HashRouter><AppShell/></HashRouter> }
