import { createSeed } from './data';
import { gridTotal } from './domain';
import { readPersonalization } from './personalization';
import { dashboardAlerts, dashboardKpis, materialReserved, materialStatus } from './selectors';
import { loadState, reducer, STORAGE_KEY } from './store';

describe('consistência da demonstração', () => {
  it('mantém todas as grades iguais às quantidades dos pedidos e orçamentos', () => {
    const state=createSeed(new Date('2026-08-26T12:00:00'));
    state.orders.forEach(order=>expect(gridTotal(order.sizeGrid)).toBe(order.quantity));
    state.quotes.forEach(quote=>expect(gridTotal(quote.sizeGrid)).toBe(quote.quantity));
  });
  it('deriva KPIs e alertas de entidades existentes', () => {
    const state=createSeed(new Date('2026-08-26T12:00:00'));const now=new Date('2026-08-26T12:00:00');
    expect(dashboardKpis(state,now).pieces).toBeGreaterThan(0);
    dashboardAlerts(state,now).forEach(alert=>expect(state.orders.some(order=>alert.to.endsWith(order.id))).toBe(true));
  });
  it('move pedido e registra histórico na mesma entidade', () => {
    const state=createSeed();const order=state.orders[0];const next=reducer(state,{type:'MOVE_ORDER',orderId:order.id,stageId:'acabamento'});
    expect(next.orders.find(item=>item.id===order.id)?.stageId).toBe('acabamento');
    expect(next.orders.find(item=>item.id===order.id)?.history.at(-1)?.type).toBe('etapa');
  });
  it('aprova orçamento, converte e bloqueia conversão duplicada', () => {
    let state=createSeed();const quote=state.quotes.find(item=>item.status==='aprovado')!;
    state=reducer(state,{type:'CONVERT_QUOTE',quoteId:quote.id});
    const converted=state.quotes.find(item=>item.id===quote.id)!;
    expect(converted.convertedOrderId).toBeTruthy();
    expect(state.orders.find(item=>item.id===converted.convertedOrderId)?.sourceQuoteId).toBe(quote.id);
    const count=state.orders.length;state=reducer(state,{type:'CONVERT_QUOTE',quoteId:quote.id});expect(state.orders).toHaveLength(count);
  });
  it('cria orçamento com número único e grade coerente', () => {
    const state=createSeed();const grid=[{color:'Verde',P:2,M:4,G:5,GG:2,XG:1}];
    const next=reducer(state,{type:'ADD_QUOTE',payload:{clientId:'cli-1',product:'Polo',quantity:14,validUntil:'2026-09-01',estimatedDeadline:'2026-09-15',amount:1400,colors:['Verde'],sizeGrid:grid,customization:'Bordado',notes:'Demo'}});
    expect(next.quotes).toHaveLength(state.quotes.length+1);expect(next.quotes[0].number).toBeGreaterThan(306);
  });
  it('portal altera o mesmo orçamento visto pelo administrativo', () => {
    const state=createSeed();const quote=state.quotes[1];const next=reducer(state,{type:'UPDATE_QUOTE',quoteId:quote.id,status:'alteração solicitada',note:'Ajustar gola'});
    expect(next.quotes.find(item=>item.id===quote.id)).toMatchObject({status:'alteração solicitada',customerChangeRequest:'Ajustar gola'});
  });
  it('calcula reservado, disponível e material crítico', () => {
    const state=createSeed();const material=state.materials.find(item=>item.id==='mat-2')!;
    expect(materialReserved(state,material)).toBe(31);expect(materialStatus(state,material)).toBe('CRÍTICO');
  });
  it('recupera seed quando storage está ausente ou corrompido', () => {
    expect(loadState({getItem:()=>null}).orders).toHaveLength(14);
    expect(loadState({getItem:()=>'{invalido'}).version).toBe(1);
    const valid=createSeed();expect(loadState({getItem:key=>key===STORAGE_KEY?JSON.stringify(valid):null}).orders).toHaveLength(14);
  });
  it('reset restaura o conjunto completo e coerente', () => {
    const reduced={...createSeed(),orders:[]};const reset=reducer(reduced,{type:'RESET'});expect(reset.orders).toHaveLength(14);expect(reset.clients).toHaveLength(10);
  });
});

describe('personalização segura por query', () => {
  it('aceita empresa e hexadecimal válidos',()=>expect(readPersonalization('?empresa=AGV%20Confecções&cor=2563eb')).toEqual({company:'AGV Confecções',color:'#2563eb'}));
  it('trunca empresa e rejeita cor inválida sem executar HTML',()=>{const result=readPersonalization(`?empresa=${'<img onerror=alert(1)>'.repeat(10)}&cor=red`);expect(result.company).toHaveLength(80);expect(result.color).toBeNull();});
  it('usa fallback para query vazia ou malformada',()=>expect(readPersonalization('?cor=%23zzzzzz')).toEqual({company:null,color:null}));
});
