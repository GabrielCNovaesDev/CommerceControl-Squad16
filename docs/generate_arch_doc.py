"""
Architecture & Folder Structure Documentation PDF
Simulador Estrategico de Loja - Squad 16
"""
from fpdf import FPDF
from fpdf.enums import XPos, YPos
import os

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ARQUITETURA_E_ESTRUTURA_SQUAD16.pdf")
FONTS_DIR = "C:/Windows/Fonts/"

PRIMARY   = (30, 64, 175)
SECONDARY = (59, 130, 246)
ACCENT    = (239, 246, 255)
SUCCESS   = (22, 163, 74)
WARNING   = (234, 88, 12)
DANGER    = (220, 38, 38)
INFO      = (14, 116, 144)
PURPLE    = (124, 58, 237)
TEXT      = (15, 23, 42)
MUTED     = (100, 116, 139)
WHITE     = (255, 255, 255)
LIGHT     = (248, 250, 252)
BORDER    = (203, 213, 225)
DARK_BG   = (30, 41, 59)
CODE_TEXT = (186, 230, 253)
YELLOW_BG = (254, 249, 195)
YELLOW_BD = (202, 138, 4)
GREEN_BG  = (220, 252, 231)
GREEN_BD  = (22, 163, 74)
BLUE_BG   = (219, 234, 254)
BLUE_BD   = (59, 130, 246)
GRAY_BG   = (241, 245, 249)
GRAY_BD   = (100, 116, 139)


class ArchDoc(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*PURPLE)
        self.rect(0, 0, 210, 12, "F")
        self.set_font("A","B",9); self.set_text_color(*WHITE)
        self.set_xy(10,2); self.cell(140,8,"Arquitetura e Estrutura de Pastas  |  Squad 16")
        self.set_xy(0,2); self.cell(200,8,f"Pag. {self.page_no()}",align="R",new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.ln(4)

    def footer(self):
        self.set_y(-13)
        self.set_font("A","",8); self.set_text_color(*MUTED)
        self.cell(0,10,"Uso interno - Squad 16 - Cencosud",align="C")

    def section(self, title, color=None):
        color = color or PRIMARY
        self.ln(4)
        self.set_fill_color(*color); self.set_text_color(*WHITE)
        self.set_font("A","B",12)
        self.set_x(10)
        self.cell(190,9,f"  {title}",fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.ln(2)

    def subsec(self, title, color=None):
        color = color or SECONDARY
        self.set_fill_color(*ACCENT); self.set_draw_color(*color)
        self.set_text_color(*PRIMARY)
        self.set_font("A","B",10)
        self.set_x(10)
        self.cell(190,7,f"  {title}",border="LB",fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.ln(1)

    def para(self, text, indent=10):
        self.set_font("A","",9.5); self.set_text_color(*TEXT)
        self.set_x(indent)
        self.multi_cell(210-indent-10, 5.5, text)
        self.ln(1)

    def bullet(self, text, indent=16):
        self.set_font("A","",9); self.set_text_color(*TEXT)
        self.set_x(indent); self.cell(4,5.5,"-")
        self.multi_cell(210-indent-10,5.5,text)

    def code(self, text, title=""):
        if title:
            self.set_font("A","B",8.5); self.set_text_color(*PRIMARY)
            self.set_x(10); self.cell(190,6,title,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.set_fill_color(*DARK_BG); self.set_text_color(*CODE_TEXT)
        self.set_font("C","",7.5)
        lines = text.strip().splitlines()
        self.set_x(10); self.cell(190,2.5,"",fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        for line in lines:
            self.set_x(14); self.cell(186,5,line,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.set_x(10); self.cell(190,2.5,"",fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.ln(2)

    def callout(self, title, text, bg, bd):
        self.set_fill_color(*bg); self.set_draw_color(*bd)
        self.set_font("A","B",9); self.set_text_color(*bd)
        self.set_x(10); self.cell(190,6,f"  {title}",border="TLR",fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.set_font("A","",9); self.set_text_color(*TEXT)
        self.set_x(10); self.multi_cell(190,5.5,f"  {text}",border="BLR",fill=True)
        self.ln(2)

    def folder_row(self, path, desc, depth=0, is_file=False):
        if self.get_y() > 268:
            self.add_page()
        indent = 10 + depth * 8
        width = 210 - indent - 10
        self.set_fill_color(*LIGHT if depth % 2 == 0 else WHITE)
        self.set_draw_color(*BORDER)
        y = self.get_y()
        # Path
        self.set_font("C","B" if not is_file else "",7.5)
        self.set_text_color(*PRIMARY if not is_file else TEXT)
        self.set_xy(indent, y)
        path_w = 70 if depth < 3 else 60
        self.cell(path_w, 6, path, border=1, fill=True)
        # Desc
        self.set_font("A","",7.5); self.set_text_color(*MUTED)
        self.cell(width - path_w, 6, desc, border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def layer_box(self, title, items, color):
        self.set_fill_color(*color); self.set_text_color(*WHITE)
        self.set_font("A","B",9)
        self.set_x(10); self.cell(190,7,f"  {title}",fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        for item in items:
            self.set_fill_color(245,245,250); self.set_draw_color(*color)
            self.set_font("C","",8); self.set_text_color(*TEXT)
            self.set_x(10)
            self.cell(190,6,f"    {item}",border="LR",fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.set_fill_color(*color)
        self.set_x(10); self.cell(190,2,"",fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.ln(2)


def build():
    pdf = ArchDoc(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(True, margin=15)
    pdf.add_font("A","",  FONTS_DIR+"arial.ttf")
    pdf.add_font("A","B", FONTS_DIR+"arialbd.ttf")
    pdf.add_font("A","I", FONTS_DIR+"ariali.ttf")
    pdf.add_font("A","BI",FONTS_DIR+"arialbi.ttf")
    pdf.add_font("C","",  FONTS_DIR+"cour.ttf")
    pdf.add_font("C","B", FONTS_DIR+"courbd.ttf")
    pdf.add_page()

    # ── COVER ─────────────────────────────────────────────────────
    pdf.set_fill_color(*PURPLE); pdf.rect(0,0,210,72,"F")
    pdf.set_font("A","B",24); pdf.set_text_color(*WHITE)
    pdf.set_xy(0,18); pdf.cell(210,14,"Arquitetura e Estrutura de Pastas",align="C",new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.set_font("A","",13)
    pdf.set_xy(0,35); pdf.cell(210,8,"Simulador Estrategico de Loja  |  Squad 16",align="C",new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.set_font("A","",10); pdf.set_text_color(221,214,254)
    pdf.set_xy(0,48); pdf.cell(210,7,"Monorepo  |  Node/Express + React/Vite  |  Prisma ORM",align="C",new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.set_xy(0,57); pdf.cell(210,7,"Versao 1.0   |   Abril 2026",align="C",new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.set_y(80)
    pdf.set_font("A","",10); pdf.set_text_color(*TEXT)
    pdf.set_x(10)
    pdf.multi_cell(190,5.5,
        "Este documento descreve a arquitetura geral do projeto, a estrutura de pastas "
        "do monorepo, os padroes arquiteturais adotados, o fluxo de dados entre camadas "
        "e as estrategias para lidar com latencia, erros e indisponibilidade. "
        "O projeto nao integra servicos de IA externos nesta versao."
    )
    pdf.ln(3)

    # ── 1. STACK TECNOLOGICO ──────────────────────────────────────
    pdf.section("1. Stack Tecnologico Completo")

    pdf.subsec("1.1 Backend")
    rows_be = [
        ("Runtime",        "Node.js v22.14.0","Ambiente de execucao JavaScript server-side"),
        ("Framework",      "Express.js v5.2.1","Servidor HTTP, roteamento, middlewares"),
        ("ORM",            "Prisma v5.22.0","Acesso ao banco, migrations, schema tipado"),
        ("BD Producao",    "PostgreSQL v14+","Banco relacional principal"),
        ("BD Local/Dev",   "SQLite","Banco local via schema.local.prisma + local.db"),
        ("Autenticacao",   "jsonwebtoken v9.0.3","Geracao e verificacao de JWT (8h expiry)"),
        ("Criptografia",   "bcryptjs v3.0.3","Hash de senhas (salt rounds: 10)"),
        ("Validacao",      "Zod v4.3.6","Schemas de validacao de entrada"),
        ("CORS",           "cors v2.8.6","Controle de origem cruzada"),
        ("Env vars",       "dotenv v17.3.1 + dotenv-cli v7.4.4","Variaveis de ambiente por arquivo"),
        ("Dev server",     "nodemon v3.1.14","Reinicio automatico em desenvolvimento"),
        ("Testes",         "Jest v30.3.0","Framework de testes unitarios"),
        ("HTTP Testing",   "Supertest v7.2.2","Testes de integracao HTTP"),
        ("Mock",           "jest-mock-extended v4.0.0","Mocks tipados para dependencias"),
        ("Modulos",        "CommonJS (require/module.exports)","Padrao de modulos do Node.js"),
    ]
    for i,(cat,tech,desc) in enumerate(rows_be):
        bg=LIGHT if i%2==0 else WHITE
        pdf.set_fill_color(*bg); pdf.set_draw_color(*BORDER)
        pdf.set_x(10)
        pdf.set_font("A","B",8); pdf.set_text_color(*MUTED)
        pdf.cell(32,6,cat,border=1,fill=True)
        pdf.set_font("C","",7.5); pdf.set_text_color(*PRIMARY)
        pdf.cell(55,6,tech,border=1,fill=True)
        pdf.set_font("A","",7.5); pdf.set_text_color(*TEXT)
        pdf.cell(103,6,desc,border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(3)

    pdf.subsec("1.2 Frontend")
    rows_fe = [
        ("Build Tool",     "Vite v8.0.1","Bundler e dev server ultra-rapido"),
        ("Framework UI",   "React v19.2.4","Biblioteca de interface com hooks"),
        ("Roteamento",     "React Router DOM v7.13.2","Navegacao client-side (SPA)"),
        ("Estado Global",  "Zustand v5.0.12","Store leve com persist no localStorage"),
        ("Forms",          "React Hook Form v7.72.0","Gerenciamento de formularios"),
        ("Form Validation","@hookform/resolvers v5.2.2","Integracao Zod + React Hook Form"),
        ("Validacao",      "Zod v4.3.6","Schemas compartilhados front/back"),
        ("HTTP Client",    "Axios v1.14.0","Requisicoes HTTP com interceptors"),
        ("Graficos",       "Recharts v3.8.1","Graficos de barras/linhas para resultados"),
        ("CSS",            "Tailwind CSS v4.2.2","Utilitarios CSS via @tailwindcss/vite"),
        ("Lint",           "ESLint v9.39.4","Qualidade e padronizacao de codigo"),
        ("PostCSS",        "PostCSS v8.5.8 + Autoprefixer v10.4.27","Processamento CSS"),
        ("Tipos",          "@types/react v19.2.14","Suporte a tipos TS/IntelliSense"),
        ("Modulos",        "ESM (import/export)","Padrao de modulos ECMAScript"),
    ]
    for i,(cat,tech,desc) in enumerate(rows_fe):
        bg=LIGHT if i%2==0 else WHITE
        pdf.set_fill_color(*bg); pdf.set_draw_color(*BORDER)
        pdf.set_x(10)
        pdf.set_font("A","B",8); pdf.set_text_color(*MUTED)
        pdf.cell(32,6,cat,border=1,fill=True)
        pdf.set_font("C","",7.5); pdf.set_text_color(*PRIMARY)
        pdf.cell(55,6,tech,border=1,fill=True)
        pdf.set_font("A","",7.5); pdf.set_text_color(*TEXT)
        pdf.cell(103,6,desc,border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(3)

    pdf.subsec("1.3 Ferramentas de IA")
    pdf.callout(
        "Sem Ferramentas de IA Integradas ao Codigo",
        "A aplicacao NAO integra nenhuma ferramenta de inteligencia artificial paga ou gratuita "
        "(OpenAI, Anthropic Claude, Google Gemini, Hugging Face, Cohere, etc.). Todo o "
        "processamento de DRE, feedbacks e ranking e realizado por algoritmos deterministicos "
        "escritos em JavaScript puro, sem chamadas a APIs externas de IA.",
        GREEN_BG, GREEN_BD
    )
    pdf.para(
        "O Claude Code (Anthropic) foi utilizado como ferramenta de auxilio no desenvolvimento "
        "(geracao e revisao de codigo, documentacao), mas NÃO e integrado ao codigo da aplicacao."
    )
    pdf.ln(1)

    # ── 2. ESTRUTURA DE PASTAS ─────────────────────────────────────
    pdf.section("2. Estrutura de Pastas — Monorepo")
    pdf.para("Organizacao de alto nivel do repositorio:")

    top_structure = [
        ("/",                 0, False, "Raiz do monorepo"),
        ("backend/",          1, False, "API REST Node.js/Express"),
        ("frontend/",         1, False, "SPA React/Vite"),
        ("docs/",             1, False, "Documentacoes e PDFs"),
        (".claude/",          1, False, "Configuracoes Claude Code (nao vai para producao)"),
    ]
    for path, depth, is_file, desc in top_structure:
        pdf.folder_row(path, desc, depth, is_file)
    pdf.ln(3)

    pdf.subsec("2.1 Backend — Estrutura Detalhada")
    be_structure = [
        ("backend/",                      0, False, "Raiz do backend"),
        ("  src/",                         1, False, "Codigo-fonte principal"),
        ("    server.js",                  2, True,  "Ponto de entrada, configura Express e rotas"),
        ("    controllers/",               2, False, "Handlers HTTP, validacao, resposta"),
        ("      authController.js",        3, True,  "Login/JWT"),
        ("      userController.js",        3, True,  "CRUD de usuarios"),
        ("      productController.js",     3, True,  "CRUD de produtos"),
        ("      squadController.js",       3, True,  "CRUD de squads + membros"),
        ("      storeController.js",       3, True,  "Criacao/consulta de lojas"),
        ("      inventoryController.js",   3, True,  "Gestao de estoque"),
        ("      roundController.js",       3, True,  "Criacao/encerramento de rodadas"),
        ("      simulationController.js",  3, True,  "Submit config, preview DRE, resultados"),
        ("    services/",                  2, False, "Logica de negocio pura"),
        ("      financeService.js",        3, True,  "Motor de calculo DRE + feedbacks"),
        ("      simulationService.js",     3, True,  "Processamento da rodada (transacoes)"),
        ("      rankingService.js",        3, True,  "Ordenacao e formatacao do ranking"),
        ("    repositories/",              2, False, "Acesso ao banco via Prisma"),
        ("      userRepository.js",        3, True,  "Queries de usuarios"),
        ("      productRepository.js",     3, True,  "Queries de produtos"),
        ("      squadRepository.js",       3, True,  "Queries de squads"),
        ("      storeRepository.js",       3, True,  "Queries de lojas"),
        ("      inventoryRepository.js",   3, True,  "Queries de estoque"),
        ("      roundRepository.js",       3, True,  "Queries de rodadas"),
        ("      roundConfigRepository.js", 3, True,  "Queries de configuracoes de rodada"),
        ("    routes/",                    2, False, "Definicao de rotas Express"),
        ("    middlewares/",               2, False, "authMiddleware, roleMiddleware, errorMiddleware"),
        ("    utils/asyncHandler.js",      2, True,  "Wrapper para async/await nos controllers"),
        ("  prisma/",                      1, False, "ORM e schema do banco"),
        ("    schema.prisma",              2, True,  "Schema principal (PostgreSQL)"),
        ("    schema.local.prisma",        2, True,  "Schema local (SQLite)"),
        ("    seed.js",                    2, True,  "Dados iniciais (users, squads, produtos)"),
        ("    prisma/local.db",            2, True,  "Arquivo SQLite local"),
        ("  .env / .env.local",            1, True,  "Variaveis de ambiente (nunca commitadas)"),
        ("  jest.config.js",               1, True,  "Configuracao dos testes"),
        ("  coverage/",                    1, False, "Relatorio HTML de cobertura de testes"),
    ]
    for path, depth, is_file, desc in be_structure:
        pdf.folder_row(path.strip(), desc, depth, is_file)
    pdf.ln(3)

    pdf.subsec("2.2 Frontend — Estrutura Detalhada")
    fe_structure = [
        ("frontend/",                      0, False, "Raiz do frontend"),
        ("  src/",                         1, False, "Codigo-fonte principal"),
        ("    main.jsx",                   2, True,  "Entry point React, renderiza App"),
        ("    App.jsx",                    2, True,  "BrowserRouter, definicao de todas as rotas"),
        ("    pages/",                     2, False, "Paginas da aplicacao (1 por rota)"),
        ("      LoginPage.jsx",            3, True,  "Formulario de login"),
        ("      StoresDashboardPage.jsx",  3, True,  "Painel do Player (visao da loja)"),
        ("      RoundConfigPage.jsx",      3, True,  "Configuracao de estrategia da rodada"),
        ("      ResultsPage.jsx",          3, True,  "Resultado financeiro do Player"),
        ("      RankingPage.jsx",          3, True,  "Ranking por rodada"),
        ("      AdminDashboardPage.jsx",   3, True,  "Painel do Game Master"),
        ("      RoundsManagementPage.jsx", 3, True,  "Gestao de rodadas (GM)"),
        ("      SquadsManagementPage.jsx", 3, True,  "Gestao de squads e usuarios (GM)"),
        ("      ProductsManagementPage.jsx",3,True,  "Catalogo de produtos (GM)"),
        ("      AdminResultsPage.jsx",     3, True,  "Resultados de todos os squads (GM)"),
        ("      UnauthorizedPage.jsx",     3, True,  "Pagina de acesso negado"),
        ("    components/",               2, False, "Componentes reutilizaveis"),
        ("      layout/",                 3, False, "PlayerLayout, AdminLayout, PrivateRoute"),
        ("      ui/",                     3, False, "Button, Input, Toast, Skeleton, ErrorMessage"),
        ("      DREPreview.jsx",          3, True,  "Preview do DRE (grafico + feedbacks)"),
        ("    services/",                 2, False, "Chamadas HTTP (uma por recurso)"),
        ("      api.js",                  3, True,  "Instancia Axios + interceptors"),
        ("      authService.js",          3, True,  "Login"),
        ("      roundService.js",         3, True,  "Rodadas + config + preview"),
        ("      storeService.js",         3, True,  "Lojas + inventario"),
        ("      productService.js",       3, True,  "Produtos"),
        ("      squadService.js",         3, True,  "Squads"),
        ("      userService.js",          3, True,  "Usuarios"),
        ("    store/",                    2, False, "Estado global Zustand"),
        ("      authStore.js",            3, True,  "Token + user + isAuthenticated (persist)"),
        ("    hooks/useToast.js",         2, True,  "Hook para notificacoes toast"),
        ("    utils/formatters.js",       2, True,  "Formatacao de moeda, datas, etc."),
        ("  public/",                     1, False, "Assets publicos (favicon, icons)"),
        ("  dist/",                       1, False, "Build de producao (gerado pelo Vite)"),
        ("  vite.config.js",              1, True,  "Configuracao do Vite"),
        ("  eslint.config.js",            1, True,  "Configuracao do ESLint"),
    ]
    for path, depth, is_file, desc in fe_structure:
        pdf.folder_row(path.strip(), desc, depth, is_file)
    pdf.ln(3)

    # ── 3. ARQUITETURA ────────────────────────────────────────────
    pdf.section("3. Arquitetura do Backend — Camadas")
    pdf.para(
        "O backend segue uma arquitetura em camadas (Layered Architecture) com "
        "separacao clara de responsabilidades:"
    )
    pdf.ln(1)

    pdf.layer_box("HTTP Layer — Routes + Middlewares",
        ["Express Router: define verbos HTTP e paths",
         "authMiddleware: valida JWT em todas as rotas privadas",
         "roleMiddleware: verifica permissao por role (GAME_MASTER / PLAYER)",
         "errorMiddleware: captura todas as excecoes nao tratadas"],
        (30, 64, 175))

    pdf.layer_box("Controller Layer — src/controllers/",
        ["Recebe req/res do Express",
         "Valida entrada com Zod (safeParse)",
         "Orquestra chamadas a Services e Repositories",
         "Retorna resposta HTTP com status code semantico",
         "Encapsulado por asyncHandler para propagacao de erros"],
        (59, 130, 246))

    pdf.layer_box("Service Layer — src/services/",
        ["financeService.js: calculo DRE (effectiveVolume, grossRevenue, netProfit, netMargin)",
         "simulationService.js: processamento da rodada com Prisma $transaction",
         "rankingService.js: ordenacao por netMargin e netProfit"],
        (14, 116, 144))

    pdf.layer_box("Repository Layer — src/repositories/",
        ["Encapsula todas as queries Prisma",
         "Uma funcao por operacao (findById, create, update, remove, etc.)",
         "Nenhuma logica de negocio — apenas acesso a dados"],
        (71, 85, 105))

    pdf.layer_box("Data Layer — Prisma ORM + Banco de Dados",
        ["PostgreSQL (producao) / SQLite (dev local)",
         "Transacoes atomicas via prisma.$transaction()",
         "Schema versionado em prisma/schema.prisma"],
        (30, 41, 59))

    pdf.ln(2)

    # ── 4. FRONTEND ───────────────────────────────────────────────
    pdf.section("4. Arquitetura do Frontend")

    pdf.subsec("4.1 Fluxo de Dados")
    pdf.code(
        'Componente/Pagina\n'
        '  -> React Hook Form + Zod (validacao local)\n'
        '  -> services/xxx.js (chamada Axios)\n'
        '     -> api.js interceptor.request (injeta Bearer token)\n'
        '  -> Backend API (HTTP)\n'
        '     <- api.js interceptor.response (trata 401 -> logout)\n'
        '  <- Promise resolve/reject\n'
        '  -> Estado local (useState) ou Zustand store\n'
        '  -> Re-render da UI',
        "Fluxo de uma requisicao:"
    )

    pdf.subsec("4.2 Estado Global (Zustand + localStorage)")
    pdf.code(
        '// store/authStore.js\n'
        'const useAuthStore = create(\n'
        '  persist(\n'
        '    (set) => ({\n'
        '      user: null, token: null, isAuthenticated: false,\n'
        '      login:  (user, token) => set({ user, token, isAuthenticated: true }),\n'
        '      logout: () => set({ user: null, token: null, isAuthenticated: false }),\n'
        '    }),\n'
        '    { name: "simulador-auth" }  // key no localStorage\n'
        '  )\n'
        ');',
        ""
    )

    pdf.subsec("4.3 Protecao de Rotas (PrivateRoute)")
    pdf.code(
        '// Rota privada so para PLAYER\n'
        '<PrivateRoute allowedRoles={["PLAYER"]}>\n'
        '  <RoundConfigPage />\n'
        '</PrivateRoute>\n'
        '\n'
        '// PrivateRoute verifica:\n'
        '// 1. isAuthenticated -> se nao: redireciona para /login\n'
        '// 2. user.role in allowedRoles -> se nao: redireciona para /unauthorized',
        ""
    )

    pdf.subsec("4.4 Integracao Frontend <-> Backend")
    pdf.para(
        "Nao ha integracao com APIs de IA. A unica integracao externa do frontend "
        "e com o proprio backend (REST API em localhost:3333 ou URL configurada via VITE_API_URL)."
    )
    pdf.code(
        '// api.js — configuracao base\n'
        'const api = axios.create({\n'
        '  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333",\n'
        '});\n'
        '\n'
        '// Request interceptor: injeta token JWT automaticamente\n'
        'api.interceptors.request.use((config) => {\n'
        '  const token = useAuthStore.getState().token;\n'
        '  if (token) config.headers.Authorization = `Bearer ${token}`;\n'
        '  return config;\n'
        '});\n'
        '\n'
        '// Response interceptor: trata 401 (sessao expirada)\n'
        'api.interceptors.response.use(\n'
        '  (res) => res,\n'
        '  (err) => {\n'
        '    if (err.response?.status === 401) {\n'
        '      useAuthStore.getState().logout();\n'
        '      window.location.href = "/login";\n'
        '    }\n'
        '    return Promise.reject(err);\n'
        '  }\n'
        ');',
        ""
    )

    # ── 5. LATENCIA E INDISPONIBILIDADE ───────────────────────────
    pdf.section("5. Tratamento de Latencia, Erros, Timeout e Indisponibilidade")

    pdf.subsec("5.1 Estados de Carregamento (Loading States)")
    pdf.para(
        "Todas as paginas com carregamento assincrono implementam estados visuais "
        "para feedback ao usuario enquanto aguardam respostas da API:"
    )
    pdf.code(
        '// Padrao aplicado em todas as paginas que carregam dados\n'
        'const [loading, setLoading] = useState(true);\n'
        '\n'
        '// Enquanto carrega: exibe skeletons animados\n'
        'if (loading) return (\n'
        '  <Layout>\n'
        '    <Skeleton variant="card" className="h-28" />\n'
        '    <Skeleton variant="table" rows={5} />\n'
        '  </Layout>\n'
        ');',
        ""
    )
    pdf.bullet("Skeleton loaders previnem Cumulative Layout Shift (CLS)")
    pdf.bullet("Botoes com prop loading={isSubmitting} ficam desabilitados durante submit")
    pdf.bullet("Impede duplo-clique e envios duplicados de formulario")
    pdf.ln(2)

    pdf.subsec("5.2 Tratamento de Falhas de Carregamento (loadError + Retry)")
    pdf.code(
        '// Falha ao carregar dados iniciais\n'
        'const [loadError, setLoadError] = useState("");\n'
        '\n'
        'async function load() {\n'
        '  setLoadError("");    // limpa erro anterior antes de tentar\n'
        '  try {\n'
        '    const data = await api.get(...);\n'
        '  } catch {\n'
        '    setLoadError("Nao foi possivel carregar os dados.");\n'
        '  } finally {\n'
        '    setLoading(false);\n'
        '  }\n'
        '}\n'
        '\n'
        '// Exibe ErrorMessage com botao "Tentar novamente"\n'
        'if (loadError) return (\n'
        '  <ErrorMessage message={loadError} onRetry={() => { setLoading(true); load(); }} />\n'
        ');',
        ""
    )

    pdf.subsec("5.3 Falhas em Acoes (Mutations) — Toast de Erro")
    pdf.code(
        '// Acoes de escrita (submit, create, delete, restock)\n'
        'try {\n'
        '  await service.create(data);\n'
        '  toast.success("Operacao realizada com sucesso!");\n'
        '} catch (err) {\n'
        '  // Prioriza mensagem do backend; fallback para mensagem generica\n'
        '  const msg = err.response?.data?.message\n'
        '           ?? err.response?.data?.error\n'
        '           ?? "Erro inesperado. Tente novamente.";\n'
        '  toast.error(msg);\n'
        '}',
        ""
    )

    pdf.subsec("5.4 Timeout — Ausencia de Configuracao Explicita")
    pdf.callout(
        "Timeout Padrao do Axios",
        "O Axios nao tem timeout configurado explicitamente no projeto (valor padrao: 0 = sem timeout). "
        "Em producao, recomenda-se configurar: api.defaults.timeout = 10000; (10 segundos) para evitar "
        "requisicoes penduradas. O navegador tem seu proprio timeout (~2min), mas a UX fica ruim.",
        YELLOW_BG, YELLOW_BD
    )

    pdf.subsec("5.5 Indisponibilidade do Backend")
    rows_unavail = [
        ("Backend offline (ECONNREFUSED)","Axios lanca NetworkError","catch captura, toast.error ou loadError exibido"),
        ("Backend lento (>10s sem timeout)","Spinner infinito na UI","Recomendado: adicionar timeout ao Axios"),
        ("BD offline (Prisma connection)","Erro 500 do backend","errorMiddleware retorna 500; frontend exibe toast"),
        ("Token expirado mid-session","Backend retorna 401","Interceptor Axios: logout + redirect /login"),
        ("Rodada fechada durante config","Backend retorna 409","toast.error com mensagem do backend"),
    ]
    pdf.set_fill_color(*PRIMARY); pdf.set_text_color(*WHITE); pdf.set_font("A","B",8)
    pdf.set_x(10)
    for col, w in [("Cenario",65),("Comportamento Atual",60),("Resultado para o Usuario",65)]:
        pdf.cell(w,7,f" {col}",border=1,fill=True)
    pdf.ln(7)
    for i,(c,b,r) in enumerate(rows_unavail):
        bg=LIGHT if i%2==0 else WHITE
        pdf.set_fill_color(*bg); pdf.set_draw_color(*BORDER)
        pdf.set_x(10)
        pdf.set_font("A","",7.5); pdf.set_text_color(*TEXT)
        pdf.cell(65,6,c,border=1,fill=True)
        pdf.set_font("C","",7); pdf.set_text_color(*WARNING)
        pdf.cell(60,6,b,border=1,fill=True)
        pdf.set_font("A","",7.5); pdf.set_text_color(*MUTED)
        pdf.cell(65,6,r,border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(3)

    pdf.subsec("5.6 Resiliencia no Backend — Transacoes Atomicas")
    pdf.para(
        "O processamento de rodadas usa Prisma $transaction para garantir atomicidade. "
        "Falhas em uma loja nao afetam as demais (try/catch por loja, rollback automatico)."
    )
    pdf.code(
        '// simulationService.js\n'
        'for (const config of configs) {\n'
        '  try {\n'
        '    await prisma.$transaction(async (tx) => { /* ... */ });\n'
        '  } catch (err) {\n'
        '    // Rollback automatico. Continua para proxima loja.\n'
        '    console.error(`Erro loja ${config.storeId}:`, err.message);\n'
        '  }\n'
        '}',
        ""
    )

    # ── 6. MODELO DE DADOS ────────────────────────────────────────
    pdf.section("6. Modelo de Dados — Resumo das Entidades Prisma")
    entities = [
        ("User",            "id, name, email, password (hash), role, leader, squadId"),
        ("Squad",           "id, name -> Users[]"),
        ("Store",           "id, name, squadId -> Inventory[], RoundConfig[]"),
        ("Product",         "id, name, purchasePrice"),
        ("Inventory",       "storeId + productId (PK composta), quantity"),
        ("Round",           "id, number, status (OPEN/PROCESSING/CLOSED), startDate, endDate"),
        ("RoundConfig",     "id, roundId, storeId, fixedExpenses, variableExpenses, submittedAt"),
        ("RoundConfigItem", "id, roundConfigId, productId, salePrice, salesVolume"),
        ("FinancialResult", "id, roundId, storeId, grossRevenue, costs, expenses, grossProfit, netProfit, netMargin"),
    ]
    pdf.set_fill_color(*PRIMARY); pdf.set_text_color(*WHITE); pdf.set_font("A","B",8.5)
    pdf.set_x(10); pdf.cell(40,7," Entidade",border=1,fill=True)
    pdf.cell(150,7," Campos Principais",border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    for i,(ent,fields) in enumerate(entities):
        bg=LIGHT if i%2==0 else WHITE
        pdf.set_fill_color(*bg); pdf.set_draw_color(*BORDER)
        pdf.set_x(10)
        pdf.set_font("C","B",8); pdf.set_text_color(*PRIMARY)
        pdf.cell(40,6,ent,border=1,fill=True)
        pdf.set_font("A","",8); pdf.set_text_color(*TEXT)
        pdf.cell(150,6,fields,border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(3)

    # ── 7. RECOMENDACOES ──────────────────────────────────────────
    pdf.section("7. Recomendacoes de Melhoria para Producao")
    recos = [
        ("Timeout Axios",         "Configurar timeout de 10-15s para evitar requisicoes penduradas"),
        ("Rate Limiting",         "Adicionar express-rate-limit para proteger /auth/login contra brute force"),
        ("Helmet.js",             "Adicionar helmet ao Express para cabecalhos de seguranca HTTP"),
        ("Logs estruturados",     "Substituir console.error por winston ou pino com nivel e timestamp"),
        ("Health check avancado", "Endpoint /health verificar conexao com BD (prisma.$queryRaw)"),
        ("Variavel VITE_API_URL", "Configurar em producao para URL real do backend (nao localhost)"),
        ("HTTPS",                 "Servir frontend e backend via HTTPS em producao"),
        ("Retry com backoff",     "Para futuras integracoes externas, implementar retry exponencial"),
    ]
    for i,(title,desc) in enumerate(recos):
        if pdf.get_y() > 265:
            pdf.add_page()
        bg=LIGHT if i%2==0 else WHITE
        pdf.set_fill_color(*bg); pdf.set_draw_color(*BORDER)
        pdf.set_x(10)
        pdf.set_font("A","B",8.5); pdf.set_text_color(*PRIMARY)
        pdf.cell(45,7,title,border=1,fill=True)
        pdf.set_font("A","",8.5); pdf.set_text_color(*TEXT)
        pdf.cell(145,7,desc,border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(3)

    pdf.output(OUTPUT_PATH)
    print(f"PDF gerado: {OUTPUT_PATH}")


if __name__ == "__main__":
    build()
