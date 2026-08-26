import type { AppState, Material, Order } from './domain';

const oneDay = 86_400_000;
export const daysFromNow = (date: string, now = new Date()) => {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(`${date}T00:00:00`).getTime();
  return Math.round((target - start) / oneDay);
};
export const activeOrders = (state: AppState) => state.orders.filter(order => order.stageId !== 'expedicao');
export const orderProgress = (state: AppState, order: Order) => Math.round(((state.stages.find(stage => stage.id === order.stageId)?.order ?? 0) / (state.stages.length - 1)) * 100);
export const dashboardKpis = (state: AppState, now = new Date()) => {
  const active = activeOrders(state);
  const onTime = active.filter(order => daysFromNow(order.deadline, now) >= 0).length;
  return {
    active: active.length,
    pieces: active.reduce((sum, order) => sum + order.quantity, 0),
    upcoming: active.filter(order => { const days = daysFromNow(order.deadline, now); return days >= 0 && days <= 5; }).length,
    onTime: active.length ? Math.round((onTime / active.length) * 100) : 100,
  };
};
export interface Alert { id: string; tone: 'danger' | 'warning' | 'info'; eyebrow: string; title: string; detail: string; to: string }
export const dashboardAlerts = (state: AppState, now = new Date()): Alert[] => {
  const risky = state.orders.filter(order => daysFromNow(order.deadline, now) <= 2 && !['pronto','expedicao'].includes(order.stageId));
  const urgent = risky.find(order=>order.quantity===180 && order.stageId==='costura') ?? risky.sort((a,b)=>a.deadline.localeCompare(b.deadline))[0];
  const approval = state.orders.find(order => order.artworkVersions.at(-1)?.status === 'enviada');
  const shortageOrder = state.orders.find(order => order.materialNeeds.some(need => need.required > need.allocated));
  const alerts: Alert[] = [];
  if (urgent) alerts.push({ id:`urgent-${urgent.id}`, tone:'danger', eyebrow:'Urgente', title:`Pedido #${urgent.number} precisa avançar`, detail:`${urgent.quantity} peças em ${state.stages.find(s=>s.id===urgent.stageId)?.label.toLowerCase()} • entrega ${daysFromNow(urgent.deadline,now) < 0 ? 'atrasada' : 'muito próxima'}`, to:`/pedidos/${urgent.id}` });
  if (approval) alerts.push({ id:`approval-${approval.id}`, tone:'warning', eyebrow:'Aguardando cliente', title:`Arte do pedido #${approval.number} sem aprovação`, detail:`${state.clients.find(c=>c.id===approval.clientId)?.companyName} • acompanhamento pendente`, to:`/pedidos/${approval.id}` });
  if (shortageOrder) { const need = shortageOrder.materialNeeds.find(item=>item.required>item.allocated)!; const material = state.materials.find(item=>item.id===need.materialId); alerts.push({ id:`stock-${shortageOrder.id}`, tone:'info', eyebrow:'Estoque', title:`Faltam ${need.required-need.allocated} ${material?.unit} de ${material?.name}`, detail:`Necessário para o pedido #${shortageOrder.number}`, to:`/pedidos/${shortageOrder.id}` }); }
  return alerts;
};
export const materialReserved = (state: AppState, material: Material) => state.orders.flatMap(order=>order.materialNeeds).filter(need=>need.materialId===material.id).reduce((sum,need)=>sum+need.allocated,0);
export const materialStatus = (state: AppState, material: Material) => {
  const available = material.stockOnHand - materialReserved(state, material);
  if (available < 0 || state.orders.some(order=>order.materialNeeds.some(need=>need.materialId===material.id && need.required>need.allocated))) return 'CRÍTICO';
  if (available <= material.minimum) return 'ATENÇÃO';
  return 'NORMAL';
};
export const clientStats = (state: AppState, clientId: string) => {
  const orders = state.orders.filter(order=>order.clientId===clientId);
  return { orders:orders.length, amount:orders.reduce((sum,order)=>sum+order.amount,0), lastOrder:orders.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0]?.createdAt };
};
