import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { createSeed } from './data';
import { gridTotal, uid, type AppState, type Client, type Order, type Priority, type QuoteStatus, type SizeRow } from './domain';

export const STORAGE_KEY = 'confec-demo:v1';
export type NewOrder = { clientId:string; product:string; quantity:number; deadline:string; amount:number; responsibleId:string; priority:Priority; colors:string[]; sizeGrid:SizeRow[]; technicalNotes:string };
export type NewQuote = { clientId:string; product:string; quantity:number; validUntil:string; estimatedDeadline:string; amount:number; colors:string[]; sizeGrid:SizeRow[]; customization:string; notes:string };
type Action =
  | { type:'MOVE_ORDER'; orderId:string; stageId:string }
  | { type:'ADD_ORDER'; payload:NewOrder }
  | { type:'ADD_QUOTE'; payload:NewQuote }
  | { type:'UPDATE_QUOTE'; quoteId:string; status:QuoteStatus; note?:string }
  | { type:'CONVERT_QUOTE'; quoteId:string }
  | { type:'ADD_CLIENT'; client:Omit<Client,'id'|'status'> }
  | { type:'UPDATE_CONFIG'; payload:Partial<AppState['config']> }
  | { type:'RESET' };

export function reducer(state: AppState, action: Action): AppState {
  const event = (label:string,type:string) => ({ id:uid('evt'), timestamp:new Date().toISOString(), type, label });
  if (action.type === 'MOVE_ORDER') {
    if (!state.stages.some(stage=>stage.id===action.stageId)) return state;
    return { ...state, orders:state.orders.map(order => order.id === action.orderId ? { ...order, stageId:action.stageId, history:[...order.history,event(`Movido para ${state.stages.find(s=>s.id===action.stageId)?.label}`,'etapa')] } : order) };
  }
  if (action.type === 'ADD_ORDER') {
    if (gridTotal(action.payload.sizeGrid) !== action.payload.quantity) return state;
    const number = Math.max(...state.orders.map(order=>order.number),1000)+1;
    const order: Order = { id:uid('ord'), number, ...action.payload, createdAt:new Date().toISOString().slice(0,10), stageId:state.stages[0].id, description:action.payload.product, deposit:Math.round(action.payload.amount*.4), receivedAmount:0, paymentTerms:'40% de sinal + saldo na entrega', artworkVersions:[], materialNeeds:[], history:[event('Pedido criado','criação')] };
    return { ...state, orders:[order,...state.orders] };
  }
  if (action.type === 'ADD_QUOTE') {
    if (gridTotal(action.payload.sizeGrid) !== action.payload.quantity) return state;
    const number = Math.max(...state.quotes.map(quote=>quote.number),300)+1;
    return { ...state, quotes:[{ id:uid('quo'), number, ...action.payload, createdAt:new Date().toISOString().slice(0,10), status:'rascunho', history:[event('Orçamento criado','criação')] },...state.quotes] };
  }
  if (action.type === 'UPDATE_QUOTE') return { ...state, quotes:state.quotes.map(quote=>quote.id===action.quoteId ? { ...quote, status:action.status, customerChangeRequest:action.note, history:[...quote.history,event(action.status==='aprovado'?'Orçamento aprovado pelo portal demonstrativo':'Alteração solicitada pelo portal demonstrativo','cliente')] } : quote) };
  if (action.type === 'CONVERT_QUOTE') {
    const quote = state.quotes.find(item=>item.id===action.quoteId);
    if (!quote || quote.convertedOrderId || quote.status!=='aprovado') return state;
    const number = Math.max(...state.orders.map(order=>order.number),1000)+1;
    const orderId = uid('ord');
    const order: Order = { id:orderId, number, clientId:quote.clientId, responsibleId:state.responsibles[0].id, createdAt:new Date().toISOString().slice(0,10), deadline:quote.estimatedDeadline, priority:'normal', stageId:state.stages[0].id, description:quote.product, product:quote.product, quantity:quote.quantity, amount:quote.amount, deposit:Math.round(quote.amount*.4), receivedAmount:0, paymentTerms:'40% de sinal + saldo na entrega', colors:quote.colors, sizeGrid:quote.sizeGrid, artworkVersions:[], materialNeeds:[], technicalNotes:quote.customization, sourceQuoteId:quote.id, history:[event(`Criado a partir do orçamento #${quote.number}`,'conversão')] };
    return { ...state, orders:[order,...state.orders], quotes:state.quotes.map(item=>item.id===quote.id ? { ...item, status:'convertido em pedido', convertedOrderId:orderId, history:[...item.history,event(`Convertido no pedido #${number}`,'conversão')] } : item) };
  }
  if (action.type === 'ADD_CLIENT') return { ...state, clients:[...state.clients,{ ...action.client, id:uid('cli'), status:'ativo' }] };
  if (action.type === 'UPDATE_CONFIG') return { ...state, config:{ ...state.config,...action.payload } };
  if (action.type === 'RESET') return createSeed();
  return state;
}

export const loadState = (storage: Pick<Storage,'getItem'> = localStorage): AppState => {
  try { const raw=storage.getItem(STORAGE_KEY); if(!raw) return createSeed(); const parsed=JSON.parse(raw) as AppState; if(parsed.version!==1 || !Array.isArray(parsed.orders) || !Array.isArray(parsed.quotes)) return createSeed(); return parsed; } catch { return createSeed(); }
};

type Store = { state:AppState; dispatch:React.Dispatch<Action>; storageError:boolean };
const StoreContext = createContext<Store | null>(null);
export function StoreProvider({ children }: { children:ReactNode }) {
  const [state,dispatch]=useReducer(reducer,undefined,()=>loadState());
  const storageError = useMemo(()=>{ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); return false; } catch { return true; } },[state]);
  useEffect(()=>{ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch { /* state stays in memory */ } },[state]);
  return <StoreContext.Provider value={{state,dispatch,storageError}}>{children}</StoreContext.Provider>;
}
export const useStore = () => { const value=useContext(StoreContext); if(!value) throw new Error('StoreProvider ausente'); return value; };
