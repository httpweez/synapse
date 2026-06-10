import { addNode } from './graph.js';
import { nodes, edges } from './state.js';
import { createEdgeObject } from './graph.js';

export function loadInitialData() {
  const root = addNode('Construfácil', 'root', 'Distribuidora de Materiais de Construção', 'Joinville + 2 filiais · 47 funcionários · R$1,2M/mês');

  const company = addNode('Empresa', 'category', '12 anos · 340 clientes · 820 SKUs', 'Ticket médio R$3.500', root, '', 'category');
  addNode('47 funcionários', 'info', '3 unidades · 5 departamentos', '', company, '', 'info');
  addNode('3 filiais', 'info', 'Joinville (matriz) · São Bento · Jaraguá do Sul', '', company, '', 'info');
  addNode('R$1,2M/mês faturamento', 'info', '~340 pedidos/mês', '', company, '', 'info');
  addNode('8 vendedores', 'info', '3 interno + 5 externo', '', company, '', 'info');

  const critical = addNode('🔴 Problemas Críticos', 'category', 'Perda de dinheiro imediata', '', root, '', 'category');
  addNode('Vende sem estoque', 'problem', 'Planilha desatualizada em tempo real', '3-5 ocorrências/mês · cancelamentos e retrabalho', critical, 'P01', 'problem-critical');
  addNode('Mesmo lote vendido 2x', 'problem', 'Sem lock/reserva de estoque', '~2 ocorrências/mês · conflito e perda de cliente', critical, 'P02', 'problem-critical');
  addNode('Pedidos perdidos', 'problem', 'Pedido no caderno/PC pessoal', '8-12 pedidos/mês não processados', critical, 'P03', 'problem-critical');
  addNode('Boletos com erro', 'problem', 'Digitação manual dos dados', '~6 boletos/mês com erro', critical, 'P04', 'problem-critical');
  addNode('Entrega endereço errado', 'problem', 'Endereço copiado manualmente', '~4 ocorrências/mês · custo de re-entrega', critical, 'P05', 'problem-critical');
  addNode('Inadimplência R$45k', 'problem', 'Sem notificação de vencimento', 'R$45.000 em aberto sem acompanhamento', critical, 'P06', 'problem-critical');

  const severe = addNode('🟡 Problemas Graves', 'category', 'Ineficiência operacional severa', '', root, '', 'category');
  addNode('Fechamento 2,5 dias', 'problem', 'Consolidação manual de planilhas', '2,5 dias/mês de funcionária bloqueada', severe, 'P07', 'problem-severe');
  addNode('20 ligações/dia "onde está?"', 'problem', 'Sem tracking de entrega', '~20 ligações/dia perdidas', severe, 'P08', 'problem-severe');
  addNode('Estoque sempre divergente', 'problem', 'Atualizações manuais atrasadas', '4h/semana de contagem física', severe, 'P09', 'problem-severe');
  addNode('Sem dashboards', 'problem', 'Nenhum relatório em tempo real', 'Decisões sem dados confiáveis', severe, 'P10', 'problem-severe');
  addNode('Histórico do cliente some', 'problem', 'Dados no PC pessoal do vendedor', '~3 churns/mês', severe, 'P11', 'problem-severe');
  addNode('Rotas sem otimização', 'problem', 'Definição manual por intuição', '~30% desperdício combustível', severe, 'P12', 'problem-severe');

  const moderate = addNode('🟠 Problemas Moderados', 'category', 'Fricção e retrabalho', '', root, '', 'category');
  addNode('WhatsApp bagunçado', 'problem', 'Tudo no mesmo grupo', 'Informações se perdem', moderate, 'P13', 'problem-moderate');
  addNode('Escala só no quadro', 'problem', 'Processo físico e local', 'Filiais sem acesso', moderate, 'P14', 'problem-moderate');
  addNode('Horas extras manuais', 'problem', 'Livro de ponto físico', 'Erros e risco trabalhista', moderate, 'P15', 'problem-moderate');
  addNode('Devoluções sem fluxo', 'problem', 'Processo ad-hoc', 'Itens somem do estoque', moderate, 'P16', 'problem-moderate');
  addNode('Sem alerta de estoque', 'problem', 'Sem ponto de reposição', 'Ruptura frequente', moderate, 'P17', 'problem-moderate');
  addNode('Onboarding inexistente', 'problem', 'Sem documentação', '3-4 semanas até produtivo', moderate, 'P18', 'problem-moderate');

  const modules = addNode('Módulos da Solução', 'category', 'Sistema web interno integrado', '', root, '', 'category');
  addNode('🔴 Pedidos', 'module', 'Centralizado · nunca mais perder pedidos', 'Resolve P01, P02, P03', modules, '', 'module');
  addNode('🔴 Estoque em tempo real', 'module', 'Consultável de qualquer PC', 'Resolve P01, P02, P09, P17', modules, '', 'module');
  addNode('🔴 Entregas/Logística', 'module', 'Tracking + otimização de rotas', 'Resolve P05, P08, P12', modules, '', 'module');
  addNode('🔴 Financeiro', 'module', 'Contas a pagar/receber · fechamento automático', 'Resolve P04, P06, P07', modules, '', 'module');
  addNode('🟡 Dashboard Gerencial', 'module', 'Faturamento em tempo real', 'Resolve P10', modules, '', 'module');
  addNode('🟡 CRM básico', 'module', 'Histórico completo do cliente', 'Resolve P11', modules, '', 'module');
  addNode('🟡 RH', 'module', 'Escala · ponto · férias', 'Resolve P14, P15', modules, '', 'module');
  addNode('🟠 Comunicação Interna', 'module', 'Mural de avisos · docs', 'Resolve P13, P18', modules, '', 'module');

  const stack = addNode('Stack Tecnológica', 'category', 'Arquitetura da solução', '', root, '', 'category');
  addNode('Node.js + Express', 'tech', 'API REST · servidor web', '', stack, '', 'tech');
  addNode('PostgreSQL', 'tech', 'Banco de dados relacional', '', stack, '', 'tech');
  addNode('React + TypeScript', 'tech', 'Frontend moderno e rápido', '', stack, '', 'tech');
  addNode('JWT Auth (roles)', 'tech', 'Vendedor · Almoxarife · Financeiro · Admin', '', stack, '', 'tech');
  addNode('Docker Compose', 'tech', 'Deploy em VPS Hostinger/Contabo', '', stack, '', 'tech');

  // Cross-connections between modules and problems
  const moduleProblemMap = {
    '🔴 Pedidos': ['P01', 'P02', 'P03'],
    '🔴 Estoque em tempo real': ['P01', 'P02', 'P09', 'P17'],
    '🔴 Entregas/Logística': ['P05', 'P08', 'P12'],
    '🔴 Financeiro': ['P04', 'P06', 'P07'],
    '🟡 Dashboard Gerencial': ['P10'],
    '🟡 CRM básico': ['P11'],
    '🟡 RH': ['P14', 'P15'],
    '🟠 Comunicação Interna': ['P13', 'P18'],
  };

  for (const [modName, problemIds] of Object.entries(moduleProblemMap)) {
    let modNode;
    for (const [id, n] of nodes) {
      if (n.name === modName) { modNode = id; break; }
    }
    if (!modNode) continue;
    for (const pid of problemIds) {
      for (const [id, n] of nodes) {
        if (n.problemId === pid) {
          if (!edges.some(e => e.source === modNode && e.target === id)) {
            edges.push({ source: modNode, target: id });
            createEdgeObject(modNode, id);
          }
        }
      }
    }
  }
}
