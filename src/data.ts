import type { AppState, Artwork, HistoryEvent, Order, Priority, QuoteStatus, SizeRow } from './domain';

const iso = (date: Date) => date.toISOString().slice(0, 10);
const at = (base: Date, days: number) => { const date = new Date(base); date.setDate(date.getDate() + days); return iso(date); };
const history = (base: Date, days: number, label: string, type = 'sistema'): HistoryEvent => ({ id: `${type}-${days}-${label}`, timestamp: `${at(base, days)}T10:30:00.000Z`, type, label });
const grid = (quantity: number, colors: string[]): SizeRow[] => {
  let remaining = quantity;
  return colors.map((color, index) => {
    const rowsLeft = colors.length - index;
    const total = index === colors.length - 1 ? remaining : Math.floor(quantity / rowsLeft);
    remaining -= total;
    const p = Math.floor(total * 0.14); const m = Math.floor(total * 0.3); const g = Math.floor(total * 0.32); const gg = Math.floor(total * 0.18);
    return { color, P: p, M: m, G: g, GG: gg, XG: total - p - m - g - gg };
  });
};

export const createSeed = (today = new Date()): AppState => {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const clients = [
    ['cli-1','Academia Pulso','Marina Lopes','(11) 90000-0101','Campinas'], ['cli-2','Colégio Horizonte','Ricardo Melo','(11) 90000-0102','Jundiaí'],
    ['cli-3','Transvale Logística','Lúcia Braga','(19) 90000-0103','Sumaré'], ['cli-4','Bistrô do Largo','Caio Nunes','(19) 90000-0104','Valinhos'],
    ['cli-5','Metalúrgica Atlas','Paulo Reis','(11) 90000-0105','Sorocaba'], ['cli-6','Agro Serra Verde','Aline Prado','(19) 90000-0106','Mogi Mirim'],
    ['cli-7','Circuito da Mata','Nina Costa','(19) 90000-0107','Amparo'], ['cli-8','Loja Ponto Sul','Renata Vaz','(11) 90000-0108','São Paulo'],
    ['cli-9','Clínica Integra','Otávio Lima','(19) 90000-0109','Campinas'], ['cli-10','Prisma Serviços','Diego Luz','(19) 90000-0110','Paulínia'],
  ].map(([id,companyName,contactName,phone,city]) => ({ id, companyName, contactName, phone, city, status: 'ativo' as const }));
  const responsibles = [
    { id:'resp-1', name:'Amanda Rocha', initials:'AR', roleLabel:'Comercial' }, { id:'resp-2', name:'Bruno Teles', initials:'BT', roleLabel:'Produção' },
    { id:'resp-3', name:'Clara Dias', initials:'CD', roleLabel:'Arte' }, { id:'resp-4', name:'Davi Martins', initials:'DM', roleLabel:'Expedição' },
    { id:'resp-5', name:'Elisa Campos', initials:'EC', roleLabel:'Atendimento' },
  ];
  const stages = [
    ['aguardando','Aguardando produção','slate'], ['separacao','Separação','blue'], ['corte','Corte','cyan'], ['personalizacao','Estamparia / Bordado','violet'],
    ['costura','Costura','amber'], ['acabamento','Acabamento / Revisão','orange'], ['pronto','Pronto','green'], ['expedicao','Expedição','emerald'],
  ].map(([id,label,tone], order) => ({ id, label, tone, order }));
  const materials = [
    ['mat-1','MAL-101','Malha penteada branca','malhas','m',210,40], ['mat-2','DRY-220','Dry fit preto','tecidos','m',31,35], ['mat-3','PIQ-310','Piquet azul-marinho','tecidos','m',96,25],
    ['mat-4','LIN-010','Linha poliéster preta','linhas','un',220,80], ['mat-5','ZIP-020','Zíper nylon 20 cm','aviamentos','un',140,60], ['mat-6','BOT-015','Botão perolado 12 mm','aviamentos','un',1800,500],
    ['mat-7','RIB-100','Ribana branca','malhas','m',42,18], ['mat-8','EMB-001','Saco individual transparente','embalagens','un',720,250], ['mat-9','TEC-450','Brim leve cinza','tecidos','m',128,30],
    ['mat-10','LIN-032','Linha poliéster azul','linhas','un',64,40],
  ].map(([id,code,name,category,unit,stockOnHand,minimum]) => ({ id:String(id), code:String(code), name:String(name), category:String(category), unit:String(unit), stockOnHand:Number(stockOnHand), minimum:Number(minimum) }));
  const makeArt = (status: Artwork['status'], note: string, day: number): Artwork => ({ id:`art-${status}-${day}`, version:'V1', createdAt:at(base,day), responsibleId:'resp-3', status, note, colors:['#18324a','#f6f3eb'] });
  const specs: Array<[string,number,string,string,number,number,string,string,number,string[],string,number,number]> = [
    ['ord-1048',1048,'cli-7','resp-2',-9,1,'urgente','costura',180,['Preto','Branco'],'Camiseta dry fit do evento',8460,3600],
    ['ord-1049',1049,'cli-5','resp-1',-7,5,'alta','separacao',120,['Cinza','Azul-marinho'],'Uniforme empresarial',11760,4700],
    ['ord-1050',1050,'cli-1','resp-2',-12,7,'alta','personalizacao',250,['Preto'],'Camiseta dry fit para equipe',10500,4200],
    ['ord-1051',1051,'cli-4','resp-4',-18,1,'normal','expedicao',80,['Areia'],'Avental de atendimento',6240,6240],
    ['ord-1052',1052,'cli-2','resp-2',-8,12,'normal','corte',400,['Branco','Azul'],'Uniforme escolar',26800,10800],
    ['ord-1053',1053,'cli-3','resp-2',-5,9,'alta','costura',50,['Grafite'],'Polo para motoristas',4900,2450],
    ['ord-1054',1054,'cli-6','resp-1',-4,15,'normal','aguardando',120,['Verde-musgo'],'Camisa UV para campo',13200,5280],
    ['ord-1055',1055,'cli-8','resp-2',-10,4,'normal','acabamento',80,['Off-white','Preto'],'Camiseta coleção cápsula',6720,3360],
    ['ord-1056',1056,'cli-9','resp-5',-3,14,'baixa','separacao',30,['Azul-claro'],'Jaleco leve bordado',4950,1980],
    ['ord-1057',1057,'cli-10','resp-1',-6,11,'normal','personalizacao',50,['Chumbo'],'Uniforme de serviços',4750,1900],
    ['ord-1058',1058,'cli-1','resp-2',-13,2,'alta','pronto',180,['Preto','Laranja'],'Conjunto esportivo',23400,11700],
    ['ord-1059',1059,'cli-3','resp-4',-15,-1,'urgente','acabamento',120,['Azul-marinho'],'Camiseta operacional',8160,4080],
    ['ord-1060',1060,'cli-2','resp-2',-2,18,'normal','aguardando',600,['Branco'],'Camiseta de jogos escolares',33000,13200],
    ['ord-1061',1061,'cli-6','resp-2',-1,20,'normal','aguardando',50,['Caqui'],'Polo administrativa',5150,2060],
  ];
  const orders: Order[] = specs.map(([id,number,clientId,responsibleId,created,deadline,priority,stageId,quantity,colors,description,amount,receivedAmount]) => ({
    id, number, clientId, responsibleId, createdAt:at(base,created), deadline:at(base,deadline), priority:priority as Priority, stageId, description, product: description,
    quantity, amount, deposit: Math.round(amount * .4), receivedAmount, paymentTerms:'40% de sinal + saldo na entrega', colors, sizeGrid:grid(quantity,colors),
    artworkVersions: number === 1049 ? [makeArt('enviada','Arte enviada ao cliente há 2 dias.',-2)] : [makeArt(number === 1048 ? 'aprovada' : 'enviada','Prévia fictícia para demonstração.',created+1)],
    materialNeeds: number === 1050 ? [{ materialId:'mat-2', required:42, allocated:31 }] : number === 1048 ? [{ materialId:'mat-1', required:34, allocated:34 },{ materialId:'mat-4', required:18, allocated:18 }] : [{ materialId:'mat-8', required:quantity, allocated:quantity }],
    technicalNotes:number === 1048 ? 'Costura parcial: 112 de 180 peças concluídas. Revisar gola antes do acabamento.' : 'Conferir grade e acabamento conforme arte aprovada.',
    history:[history(base,created,'Pedido criado','criação'), history(base,created+1,'Arte preparada para aprovação','arte'), ...(stageId !== 'aguardando' ? [history(base,created+2,`Produção avançou para ${stages.find(s=>s.id===stageId)?.label}`,'etapa')] : [])],
  }));
  const quoteSpecs: Array<[string,number,string,number,string,string,number,number]> = [
    ['quo-301',301,'cli-9',80,'Jaleco premium bordado','aprovado',12800,10], ['quo-302',302,'cli-4',120,'Avental em brim','aguardando aprovação',8640,12],
    ['quo-303',303,'cli-8',50,'Camiseta promocional','alteração solicitada',3900,8], ['quo-304',304,'cli-10',250,'Uniforme operacional','rascunho',23750,18],
    ['quo-305',305,'cli-6',80,'Camisa UV','aguardando aprovação',8800,14], ['quo-306',306,'cli-2',400,'Camiseta escolar','rascunho',22000,20],
  ];
  const quotes = quoteSpecs.map(([id,number,clientId,quantity,product,status,amount,due]) => ({ id, number, clientId, createdAt:at(base,-3), validUntil:at(base,7), status:status as QuoteStatus, product, quantity, colors:['Azul-marinho'], sizeGrid:grid(quantity,['Azul-marinho']), customization:'Bordado frontal ou estampa conforme arte demonstrativa', estimatedDeadline:at(base,due), amount, notes:'Valores e condições fictícios para demonstração.', ...(number===303?{customerChangeRequest:'Trocar a cor principal por off-white.'}:{}), history:[history(base,-3,'Orçamento criado','criação'), history(base,-2,'Orçamento enviado ao cliente','envio')] }));
  return { version:1, generatedAt:iso(base), clients, responsibles, stages, orders, quotes, materials, config:{ companyName:'Linha Clara Confecções', logoText:'LC', primaryColor:'#1f6d5a', city:'Campinas — SP', salesperson:'Amanda Rocha', demoLabel:'Ambiente de demonstração • dados fictícios' } };
};
