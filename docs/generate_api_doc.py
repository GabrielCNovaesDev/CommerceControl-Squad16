"""
API Documentation PDF Generator
Simulador Estrategico de Loja - Squad 16
"""
from fpdf import FPDF
from fpdf.enums import XPos, YPos
import os

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "API_DOCUMENTATION_SQUAD16.pdf")

FONTS_DIR = "C:/Windows/Fonts/"

# Colour palette
PRIMARY   = (30, 64, 175)
SECONDARY = (59, 130, 246)
ACCENT    = (239, 246, 255)
SUCCESS   = (22, 163, 74)
WARNING   = (234, 88, 12)
DANGER    = (220, 38, 38)
PATCH_CLR = (124, 58, 237)
TEXT      = (15, 23, 42)
MUTED     = (100, 116, 139)
WHITE     = (255, 255, 255)
LIGHT     = (248, 250, 252)
BORDER    = (203, 213, 225)
DARK_BG   = (30, 41, 59)
CODE_TEXT = (186, 230, 253)

METHOD_COLORS = {
    "GET":    SUCCESS,
    "POST":   WARNING,
    "PUT":    PATCH_CLR,
    "PATCH":  PATCH_CLR,
    "DELETE": DANGER,
}

ROLE_COLORS = {
    "GAME_MASTER": (126, 34, 206),
    "PLAYER":      (2, 132, 199),
    "GM+PLAYER":   (15, 118, 110),
    "Publico":     (71, 85, 105),
}


class ApiDoc(FPDF):

    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*PRIMARY)
        self.rect(0, 0, 210, 12, "F")
        self.set_font("ArialUni", "B", 9)
        self.set_text_color(*WHITE)
        self.set_xy(10, 2)
        self.cell(150, 8, "Simulador Estrategico de Loja - Documentacao da API  |  Squad 16")
        self.set_xy(0, 2)
        self.cell(200, 8, f"Pag. {self.page_no()}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")
        self.ln(4)

    def footer(self):
        self.set_y(-13)
        self.set_font("ArialUni", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 10, "Uso interno - Squad 16 - Cencosud", align="C")

    # ── helpers ──────────────────────────────────────────────────

    def section_title(self, title):
        self.ln(4)
        self.set_fill_color(*PRIMARY)
        self.set_text_color(*WHITE)
        self.set_font("ArialUni", "B", 12)
        self.set_x(10)
        self.cell(190, 9, f"  {title}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
        self.ln(2)

    def subsection(self, title):
        self.set_fill_color(*ACCENT)
        self.set_draw_color(*SECONDARY)
        self.set_text_color(*PRIMARY)
        self.set_font("ArialUni", "B", 10)
        self.set_x(10)
        self.cell(190, 7, f"  {title}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, border="LB", fill=True)
        self.ln(1)

    def note(self, text):
        self.set_font("ArialUni", "I", 8.5)
        self.set_text_color(*MUTED)
        self.set_x(10)
        self.multi_cell(190, 5, text)
        self.ln(2)

    def label_value(self, label, value):
        self.set_font("ArialUni", "B", 9)
        self.set_text_color(*MUTED)
        self.set_x(10)
        self.cell(35, 6, label)
        self.set_font("ArialUni", "", 9)
        self.set_text_color(*TEXT)
        self.multi_cell(155, 6, value)

    def endpoint_row(self, method, path, role, description):
        if self.get_y() > 265:
            self.add_page()

        m_color = METHOD_COLORS.get(method, MUTED)
        r_color = ROLE_COLORS.get(role, MUTED)
        y0 = self.get_y()

        # Row background
        self.set_fill_color(*LIGHT)
        self.set_draw_color(*BORDER)
        self.set_x(10)
        self.cell(190, 8, "", border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.TOP)

        # Method badge
        self.set_fill_color(*m_color)
        self.set_text_color(*WHITE)
        self.set_font("ArialUni", "B", 7.5)
        self.set_xy(11, y0 + 0.5)
        self.cell(17, 7, method, align="C", fill=True)

        # Path
        self.set_font("CourierUni", "", 8)
        self.set_text_color(*TEXT)
        self.set_xy(30, y0 + 1.5)
        self.cell(68, 5, path)

        # Role badge
        self.set_font("ArialUni", "B", 7)
        self.set_text_color(*r_color)
        self.set_draw_color(*r_color)
        self.set_xy(100, y0 + 1)
        self.cell(32, 6, role, align="C", border=1)

        # Description
        self.set_font("ArialUni", "", 8)
        self.set_text_color(*MUTED)
        self.set_draw_color(*BORDER)
        self.set_xy(135, y0 + 1.5)
        self.cell(63, 5, description)

        self.set_xy(10, y0 + 8)

    def code_block(self, code, title=""):
        if title:
            self.set_font("ArialUni", "B", 9)
            self.set_text_color(*PRIMARY)
            self.set_x(10)
            self.cell(190, 6, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_fill_color(*DARK_BG)
        self.set_text_color(*CODE_TEXT)
        self.set_font("CourierUni", "", 7.5)
        lines = code.strip().splitlines()
        pad = 3
        self.set_x(10)
        self.cell(190, pad, "", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        for line in lines:
            self.set_x(14)
            self.cell(186, 5, line, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_x(10)
        self.cell(190, pad, "", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def formula_row(self, field, formula, even=True):
        fill_color = LIGHT if even else WHITE
        self.set_fill_color(*fill_color)
        self.set_draw_color(*BORDER)
        y = self.get_y()
        self.set_x(10)
        self.cell(190, 7, "", border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.TOP)
        self.set_font("CourierUni", "B", 8.5)
        self.set_text_color(*PRIMARY)
        self.set_xy(13, y + 1)
        self.cell(50, 5, field)
        self.set_font("ArialUni", "", 8.5)
        self.set_text_color(*TEXT)
        self.cell(0, 5, formula, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def error_row(self, code, status, desc, even=True):
        fill_color = LIGHT if even else WHITE
        self.set_fill_color(*fill_color)
        self.set_draw_color(*BORDER)
        c_color = DANGER if code[0] in ("4", "5") else SUCCESS
        self.set_x(10)
        self.set_font("ArialUni", "B", 9)
        self.set_text_color(*c_color)
        self.cell(20, 7, f"  {code}", border=1, fill=True)
        self.set_font("ArialUni", "", 9)
        self.set_text_color(*TEXT)
        self.cell(35, 7, f"  {status}", border=1, fill=True)
        self.cell(135, 7, f"  {desc}", border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)


# ────────────────────────────────────────────────────────────────

def build_pdf():
    pdf = ApiDoc(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)

    # Register fonts
    pdf.add_font("ArialUni",   "",  FONTS_DIR + "arial.ttf")
    pdf.add_font("ArialUni",   "B", FONTS_DIR + "arialbd.ttf")
    pdf.add_font("ArialUni",   "I", FONTS_DIR + "ariali.ttf")
    pdf.add_font("ArialUni",   "BI",FONTS_DIR + "arialbi.ttf")
    pdf.add_font("CourierUni", "",  FONTS_DIR + "cour.ttf")
    pdf.add_font("CourierUni", "B", FONTS_DIR + "courbd.ttf")

    pdf.add_page()

    # ── COVER ────────────────────────────────────────────────────
    pdf.set_fill_color(*PRIMARY)
    pdf.rect(0, 0, 210, 72, "F")

    pdf.set_font("ArialUni", "B", 26)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(0, 18)
    pdf.cell(210, 14, "Documentacao da API", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("ArialUni", "", 13)
    pdf.set_xy(0, 35)
    pdf.cell(210, 8, "Simulador Estrategico de Loja  |  Squad 16", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("ArialUni", "", 10)
    pdf.set_text_color(186, 230, 253)
    pdf.set_xy(0, 48)
    pdf.cell(210, 7, "Base URL: http://localhost:3000/api", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_xy(0, 57)
    pdf.cell(210, 7, "Versao 1.0   |   Abril 2026", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Method legend badges
    pdf.set_y(82)
    for method, color in METHOD_COLORS.items():
        pdf.set_fill_color(*color)
        pdf.set_text_color(*WHITE)
        pdf.set_font("ArialUni", "B", 9)
        pdf.cell(22, 8, method, align="C", fill=True)
        pdf.cell(3, 8, "")
    pdf.ln(12)

    # Intro paragraph
    pdf.set_font("ArialUni", "", 10)
    pdf.set_text_color(*TEXT)
    pdf.set_x(10)
    pdf.multi_cell(190, 6,
        "Esta API RESTful e o backbone do Simulador Estrategico de Loja, uma plataforma de "
        "treinamento em varejo desenvolvida para a Cencosud. Ela expoe recursos para "
        "autenticacao, gerenciamento de usuarios/squads/produtos, controle de estoque, "
        "execucao de rodadas de simulacao e calculo de resultados financeiros (DRE).\n\n"
        "Toda requisicao (exceto /auth/login) exige o header  Authorization: Bearer <token>  "
        "obtido no login. O sistema implementa RBAC com tres papeis: GAME_MASTER, PLAYER e OBSERVER."
    )
    pdf.ln(4)

    # ── 1. AUTENTICACAO ──────────────────────────────────────────
    pdf.section_title("1. Autenticacao")

    pdf.subsection("POST /auth/login")
    pdf.label_value("Acesso:", "Publico")
    pdf.label_value("Descricao:", "Autentica o usuario e retorna um JWT valido por 8 horas.")
    pdf.ln(2)

    pdf.code_block(
        '// Request Body\n'
        '{\n'
        '  "email": "admin@simulador.com",\n'
        '  "password": "admin123"\n'
        '}',
        "Request:"
    )

    pdf.code_block(
        '// 200 OK\n'
        '{\n'
        '  "token": "<jwt>",\n'
        '  "user": {\n'
        '    "id": "cuid...",\n'
        '    "name": "Administrador",\n'
        '    "role": "GAME_MASTER",\n'
        '    "squadId": null\n'
        '  }\n'
        '}\n'
        '\n'
        '// 400 Bad Request  - validacao\n'
        '// 401 Unauthorized - credenciais invalidas',
        "Response:"
    )

    pdf.note("O payload do JWT contem: { userId, role, squadId }. "
             "Inclua o token em todas as chamadas subsequentes via header "
             "Authorization: Bearer <token>.")

    # ── 2. USUARIOS ──────────────────────────────────────────────
    pdf.section_title("2. Usuarios  /users")
    pdf.note("Todos os endpoints exigem role GAME_MASTER.")

    for ep in [
        ("GET",    "/users",     "GAME_MASTER", "Lista todos os usuarios"),
        ("POST",   "/users",     "GAME_MASTER", "Cria novo usuario"),
        ("PUT",    "/users/:id", "GAME_MASTER", "Atualiza dados do usuario"),
        ("DELETE", "/users/:id", "GAME_MASTER", "Remove usuario"),
    ]:
        pdf.endpoint_row(*ep)

    pdf.ln(3)
    pdf.code_block(
        '// POST /users - Body\n'
        '{\n'
        '  "name": "Joao Silva",\n'
        '  "email": "joao@simulador.com",\n'
        '  "password": "senha123",\n'
        '  "role": "PLAYER"     // GAME_MASTER | PLAYER | OBSERVER\n'
        '}',
        "Exemplo - criacao de usuario:"
    )

    # ── 3. PRODUTOS ──────────────────────────────────────────────
    pdf.section_title("3. Produtos  /products")
    pdf.note("GET e acessivel a GAME_MASTER e PLAYER; demais operacoes apenas GAME_MASTER.")

    for ep in [
        ("GET",    "/products",     "GM+PLAYER",   "Lista todos os produtos"),
        ("POST",   "/products",     "GAME_MASTER",  "Cria produto"),
        ("PUT",    "/products/:id", "GAME_MASTER",  "Atualiza produto"),
        ("DELETE", "/products/:id", "GAME_MASTER",  "Remove produto"),
    ]:
        pdf.endpoint_row(*ep)

    pdf.ln(3)
    pdf.code_block(
        '// POST /products - Body\n'
        '{\n'
        '  "name": "Arroz",\n'
        '  "purchasePrice": 3.50     // preco de custo (number)\n'
        '}',
        "Exemplo - cadastro de produto:"
    )

    # ── 4. SQUADS ────────────────────────────────────────────────
    pdf.section_title("4. Squads  /squads")
    pdf.note("Todos os endpoints exigem role GAME_MASTER.")

    for ep in [
        ("GET",    "/squads",                  "GAME_MASTER", "Lista todos os squads"),
        ("POST",   "/squads",                  "GAME_MASTER", "Cria squad"),
        ("PUT",    "/squads/:id",               "GAME_MASTER", "Atualiza squad"),
        ("DELETE", "/squads/:id",               "GAME_MASTER", "Remove squad"),
        ("POST",   "/squads/:id/users",         "GAME_MASTER", "Adiciona usuario ao squad"),
        ("DELETE", "/squads/:id/users/:userId", "GAME_MASTER", "Remove usuario do squad"),
    ]:
        pdf.endpoint_row(*ep)

    # ── 5. LOJAS ─────────────────────────────────────────────────
    pdf.section_title("5. Lojas  /stores")

    for ep in [
        ("GET",  "/stores",    "GAME_MASTER", "Lista todas as lojas"),
        ("POST", "/stores",    "PLAYER",       "Cria loja para o proprio squad"),
        ("GET",  "/stores/my", "PLAYER",       "Retorna loja do squad autenticado"),
    ]:
        pdf.endpoint_row(*ep)

    pdf.ln(3)
    pdf.code_block(
        '// POST /stores - Body\n'
        '{\n'
        '  "name": "Loja Alpha"\n'
        '}',
        "Exemplo - criacao de loja:"
    )

    # ── 6. INVENTARIO ────────────────────────────────────────────
    pdf.section_title("6. Inventario  /stores/:storeId/inventory")

    for ep in [
        ("GET",  "/stores/:storeId/inventory",             "GM+PLAYER",   "Lista estoque da loja"),
        ("PUT",  "/stores/:storeId/inventory/:productId",  "GAME_MASTER", "Atualiza qtd. de produto"),
        ("POST", "/stores/:storeId/inventory/restock",     "GAME_MASTER", "Reabastece produtos em lote"),
    ]:
        pdf.endpoint_row(*ep)

    pdf.ln(3)
    pdf.code_block(
        '// PUT /stores/:storeId/inventory/:productId - Body\n'
        '{ "quantity": 150 }\n'
        '\n'
        '// POST /stores/:storeId/inventory/restock - Body\n'
        '{\n'
        '  "items": [\n'
        '    { "productId": "cuid...", "quantity": 100 },\n'
        '    { "productId": "cuid...", "quantity": 80  }\n'
        '  ]\n'
        '}',
        "Exemplos - inventario:"
    )

    # ── 7. RODADAS ───────────────────────────────────────────────
    pdf.section_title("7. Rodadas  /rounds")

    for ep in [
        ("GET",   "/rounds",              "GM+PLAYER",   "Lista todas as rodadas"),
        ("GET",   "/rounds/:id",          "GM+PLAYER",   "Detalhes de uma rodada"),
        ("POST",  "/rounds",              "GAME_MASTER", "Cria rodada (status OPEN)"),
        ("PATCH", "/rounds/:id/close",    "GAME_MASTER", "Processa e encerra rodada"),
        ("POST",  "/rounds/:id/config",   "PLAYER",       "Submete estrategia do squad"),
        ("GET",   "/rounds/:id/results",  "GM+PLAYER",   "Retorna resultados financeiros"),
    ]:
        pdf.endpoint_row(*ep)

    pdf.ln(3)
    pdf.code_block(
        '// POST /rounds - Body\n'
        '{\n'
        '  "name": "Rodada 1",\n'
        '  "startDate": "2026-04-14T00:00:00Z",\n'
        '  "endDate":   "2026-04-21T00:00:00Z"\n'
        '}',
        "Criacao de rodada:"
    )

    pdf.code_block(
        '// POST /rounds/:id/config - Body (PLAYER)\n'
        '{\n'
        '  "fixedExpenses":    5000,\n'
        '  "variableExpenses": 2000,\n'
        '  "items": [\n'
        '    { "productId": "cuid...", "salePrice": 6.50, "salesVolume": 80 },\n'
        '    { "productId": "cuid...", "salePrice": 8.00, "salesVolume": 60 }\n'
        '  ]\n'
        '}\n'
        '\n'
        '// 201 Created\n'
        '{\n'
        '  "roundConfigId": "cuid...",\n'
        '  "storeId": "cuid...",\n'
        '  "roundId": "cuid...",\n'
        '  "fixedExpenses": 5000,\n'
        '  "variableExpenses": 2000,\n'
        '  "submittedAt": "2026-04-14T10:30:00Z",\n'
        '  "items": [ ... ]\n'
        '}',
        "Submissao de estrategia (config):"
    )

    pdf.code_block(
        '// GET /rounds/:id/results - Resposta PLAYER\n'
        '{\n'
        '  "grossRevenue":   2600.00,\n'
        '  "costs":           840.00,\n'
        '  "grossProfit":    1760.00,\n'
        '  "expenses":       7000.00,\n'
        '  "netProfit":     -5240.00,\n'
        '  "netMargin":      -201.5,\n'
        '  "store":      { "id": "...", "name": "Loja Alpha", "squadId": "..." },\n'
        '  "roundConfig": { ... }\n'
        '}\n'
        '\n'
        '// Resposta GAME_MASTER: array com resultados de todas as lojas',
        "Resultados financeiros:"
    )

    # ── 8. SIMULACAO ─────────────────────────────────────────────
    pdf.section_title("8. Simulacao  /simulation")

    for ep in [
        ("POST", "/simulation/preview", "PLAYER",    "Calcula DRE sem persistir"),
        ("GET",  "/simulation/ranking", "GM+PLAYER", "Ranking da rodada (?roundId=...)"),
    ]:
        pdf.endpoint_row(*ep)

    pdf.ln(3)
    pdf.code_block(
        '// POST /simulation/preview - Body (mesmo schema de /rounds/:id/config)\n'
        '{\n'
        '  "fixedExpenses": 5000,\n'
        '  "variableExpenses": 2000,\n'
        '  "items": [\n'
        '    { "productId": "cuid...", "salePrice": 6.50, "salesVolume": 80 }\n'
        '  ]\n'
        '}\n'
        '\n'
        '// 200 OK\n'
        '{\n'
        '  "preview": true,\n'
        '  "dre": {\n'
        '    "grossRevenue":  520.00,\n'
        '    "costs":         280.00,\n'
        '    "grossProfit":   240.00,\n'
        '    "expenses":     7000.00,\n'
        '    "netProfit":   -6760.00,\n'
        '    "netMargin":   -1300.0\n'
        '  },\n'
        '  "feedbacks": [\n'
        '    "Prejuizo detectado. Revise seus precos ou reduza despesas.",\n'
        '    "Margem liquida negativa. Considere aumentar o volume de vendas."\n'
        '  ]\n'
        '}',
        "Preview de DRE:"
    )

    pdf.code_block(
        '// GET /simulation/ranking?roundId=<cuid>\n'
        '[\n'
        '  { "rank": 1, "storeName": "Loja Beta",  "netProfit": 3200.00, "netMargin": 28.5  },\n'
        '  { "rank": 2, "storeName": "Loja Alpha", "netProfit": -5240.00,"netMargin": -201.5 }\n'
        ']',
        "Ranking:"
    )

    # ── 9. CALCULO DRE ───────────────────────────────────────────
    pdf.section_title("9. Regras de Negocio - Calculo DRE")

    formulas = [
        ("effectiveVolume",  "min(salesVolume, availableStock)  -  limitado ao estoque disponivel"),
        ("grossRevenue",     "Soma de ( salePrice x effectiveVolume )"),
        ("costs",            "Soma de ( purchasePrice x effectiveVolume )"),
        ("grossProfit",      "grossRevenue - costs"),
        ("expenses",         "fixedExpenses + variableExpenses"),
        ("netProfit",        "grossProfit - expenses"),
        ("netMargin (%)",    "( netProfit / grossRevenue ) x 100"),
    ]
    for i, (field, formula) in enumerate(formulas):
        pdf.formula_row(field, formula, even=(i % 2 == 0))
    pdf.ln(3)

    pdf.set_font("ArialUni", "B", 9)
    pdf.set_text_color(*PRIMARY)
    pdf.set_x(10)
    pdf.cell(190, 6, "Feedbacks automaticos retornados em /simulation/preview:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    for fb in [
        "Prejuizo detectado  -  quando netProfit < 0",
        "Margem liquida abaixo de 10%  -  sinal de alerta",
        "Estoque insuficiente  -  quando salesVolume > availableStock para algum produto",
    ]:
        pdf.set_font("ArialUni", "", 9)
        pdf.set_text_color(*TEXT)
        pdf.set_x(14)
        pdf.cell(186, 6, f"  •  {fb}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(3)

    # ── 10. FLUXO DO JOGO ────────────────────────────────────────
    pdf.section_title("10. Fluxo do Jogo")

    steps = [
        ("1", "GM cria rodada",          "POST /rounds                 ->  status: OPEN"),
        ("2", "Players montam loja",      "POST /stores                 (uma vez por squad)"),
        ("3", "GM abastece estoque",      "POST /stores/:id/inventory/restock"),
        ("4", "Players simulam DRE",      "POST /simulation/preview     (sem persistir)"),
        ("5", "Players submetem config",  "POST /rounds/:id/config      (uma vez por rodada)"),
        ("6", "GM encerra rodada",        "PATCH /rounds/:id/close      ->  status: CLOSED"),
        ("7", "Resultados disponiveis",   "GET /rounds/:id/results  +  GET /simulation/ranking"),
    ]
    for step, title, detail in steps:
        if pdf.get_y() > 265:
            pdf.add_page()
        y = pdf.get_y()
        # Circle
        pdf.set_fill_color(*PRIMARY)
        pdf.ellipse(11, y + 0.5, 8, 8, "F")
        pdf.set_font("ArialUni", "B", 8)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(11, y + 1)
        pdf.cell(8, 6, step, align="C")
        # Title
        pdf.set_font("ArialUni", "B", 9.5)
        pdf.set_text_color(*TEXT)
        pdf.set_xy(22, y + 1)
        pdf.cell(55, 6, title)
        # Detail
        pdf.set_font("CourierUni", "", 8)
        pdf.set_text_color(*MUTED)
        pdf.set_xy(80, y + 2)
        pdf.cell(0, 5, detail, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(1)

    pdf.ln(2)

    # ── 11. ERROS COMUNS ─────────────────────────────────────────
    pdf.section_title("11. Respostas de Erro Padrao")

    # Header row
    pdf.set_fill_color(*PRIMARY)
    pdf.set_text_color(*WHITE)
    pdf.set_font("ArialUni", "B", 9)
    pdf.set_x(10)
    pdf.cell(20, 7, "  Codigo", border=1, fill=True)
    pdf.cell(35, 7, "  Status", border=1, fill=True)
    pdf.cell(135, 7, "  Situacao", border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    errors = [
        ("400", "Bad Request",  "Dados de entrada invalidos (Zod)"),
        ("401", "Unauthorized", "Token ausente, invalido ou expirado"),
        ("403", "Forbidden",    "Role sem permissao para o recurso"),
        ("404", "Not Found",    "Recurso nao encontrado"),
        ("409", "Conflict",     "Conflito (ex: config ja submetida, rodada nao OPEN)"),
        ("500", "Server Error", "Erro interno - verificar logs do Express"),
    ]
    for i, e in enumerate(errors):
        pdf.error_row(*e, even=(i % 2 == 0))

    pdf.ln(3)
    pdf.code_block(
        '// Formato padrao de erro\n'
        '{ "message": "Descricao do erro" }\n'
        '\n'
        '// Erros de validacao (Zod)\n'
        '{\n'
        '  "errors": {\n'
        '    "email":    ["Email invalido"],\n'
        '    "password": ["Senha deve ter no minimo 6 caracteres"]\n'
        '  }\n'
        '}',
        "Formato de erro:"
    )

    # ── 12. SEED DATA ─────────────────────────────────────────────
    pdf.section_title("12. Dados de Seed (Ambiente de Desenvolvimento)")

    pdf.code_block(
        '// Usuarios\n'
        'admin@simulador.com  /  admin123   ->  GAME_MASTER\n'
        'alpha@simulador.com  /  player123  ->  PLAYER  (Squad Alpha)\n'
        'beta@simulador.com   /  player123  ->  PLAYER  (Squad Beta)\n'
        '\n'
        '// Produtos\n'
        'Arroz  |  Feijao  |  Macarrao  |  Leite  |  Oleo\n'
        '\n'
        '// Squads & Lojas\n'
        'Squad Alpha  ->  Loja Alpha  (100 unid./produto)\n'
        'Squad Beta   ->  Loja Beta   (100 unid./produto)',
        ""
    )

    pdf.output(OUTPUT_PATH)
    print(f"PDF gerado com sucesso: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_pdf()
