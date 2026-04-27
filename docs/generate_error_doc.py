"""
Exception & Error Handling Documentation PDF
Simulador Estrategico de Loja - Squad 16
"""
from fpdf import FPDF
from fpdf.enums import XPos, YPos
import os

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "EXCECOES_E_FALHAS_SQUAD16.pdf")
FONTS_DIR = "C:/Windows/Fonts/"

PRIMARY   = (30, 64, 175)
SECONDARY = (59, 130, 246)
ACCENT    = (239, 246, 255)
SUCCESS   = (22, 163, 74)
WARNING   = (234, 88, 12)
DANGER    = (220, 38, 38)
INFO      = (14, 116, 144)
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
RED_BG    = (254, 226, 226)
RED_BD    = (220, 38, 38)
BLUE_BG   = (219, 234, 254)
BLUE_BD   = (59, 130, 246)


class ErrDoc(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*PRIMARY)
        self.rect(0, 0, 210, 12, "F")
        self.set_font("A", "B", 9)
        self.set_text_color(*WHITE)
        self.set_xy(10, 2)
        self.cell(140, 8, "Tratamento de Excecoes e Falhas  |  Squad 16")
        self.set_xy(0, 2)
        self.cell(200, 8, f"Pag. {self.page_no()}", align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(4)

    def footer(self):
        self.set_y(-13)
        self.set_font("A", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 10, "Uso interno - Squad 16 - Cencosud", align="C")

    def section(self, title, color=None):
        color = color or PRIMARY
        self.ln(4)
        self.set_fill_color(*color)
        self.set_text_color(*WHITE)
        self.set_font("A", "B", 12)
        self.set_x(10)
        self.cell(190, 9, f"  {title}", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def subsec(self, title):
        self.set_fill_color(*ACCENT)
        self.set_draw_color(*SECONDARY)
        self.set_text_color(*PRIMARY)
        self.set_font("A", "B", 10)
        self.set_x(10)
        self.cell(190, 7, f"  {title}", border="LB", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def para(self, text, indent=10):
        self.set_font("A", "", 9.5)
        self.set_text_color(*TEXT)
        self.set_x(indent)
        self.multi_cell(210 - indent - 10, 5.5, text)
        self.ln(1)

    def bullet(self, text, indent=16):
        self.set_font("A", "", 9)
        self.set_text_color(*TEXT)
        self.set_x(indent)
        self.cell(4, 5.5, "-")
        self.multi_cell(210 - indent - 10, 5.5, text)

    def code(self, text, title=""):
        if title:
            self.set_font("A", "B", 8.5)
            self.set_text_color(*PRIMARY)
            self.set_x(10)
            self.cell(190, 6, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_fill_color(*DARK_BG)
        self.set_text_color(*CODE_TEXT)
        self.set_font("C", "", 7.5)
        lines = text.strip().splitlines()
        self.set_x(10); self.cell(190, 2.5, "", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        for line in lines:
            self.set_x(14); self.cell(186, 5, line, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_x(10); self.cell(190, 2.5, "", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def callout(self, title, text, bg, bd):
        self.set_fill_color(*bg)
        self.set_draw_color(*bd)
        y = self.get_y()
        self.set_x(10)
        self.set_font("A", "B", 9)
        self.set_text_color(*bd)
        self.cell(190, 6, f"  {title}", border="TLR", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("A", "", 9)
        self.set_text_color(*TEXT)
        self.set_x(10)
        self.multi_cell(190, 5.5, f"  {text}", border="BLR", fill=True)
        self.ln(2)

    def err_row(self, code, where, trigger, response, even=True):
        if self.get_y() > 262:
            self.add_page()
        bg = LIGHT if even else WHITE
        self.set_fill_color(*bg)
        self.set_draw_color(*BORDER)
        c_color = DANGER if str(code)[0] in ("4","5") else SUCCESS
        y = self.get_y()
        self.set_x(10)
        self.set_font("A", "B", 8)
        self.set_text_color(*c_color)
        self.cell(14, 7, str(code), border=1, fill=True)
        self.set_font("A", "B", 7.5)
        self.set_text_color(*PRIMARY)
        self.cell(38, 7, where, border=1, fill=True)
        self.set_font("A", "", 7.5)
        self.set_text_color(*TEXT)
        self.cell(74, 7, trigger, border=1, fill=True)
        self.set_font("C", "", 7)
        self.set_text_color(*MUTED)
        self.cell(64, 7, response, border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def table_header(self, cols, widths):
        self.set_fill_color(*PRIMARY)
        self.set_text_color(*WHITE)
        self.set_font("A", "B", 8)
        self.set_x(10)
        for c, w in zip(cols, widths):
            self.cell(w, 7, f" {c}", border=1, fill=True)
        self.ln(7)


def build():
    pdf = ErrDoc(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(True, margin=15)
    pdf.add_font("A",  "",  FONTS_DIR+"arial.ttf")
    pdf.add_font("A",  "B", FONTS_DIR+"arialbd.ttf")
    pdf.add_font("A",  "I", FONTS_DIR+"ariali.ttf")
    pdf.add_font("A",  "BI",FONTS_DIR+"arialbi.ttf")
    pdf.add_font("C",  "",  FONTS_DIR+"cour.ttf")
    pdf.add_font("C",  "B", FONTS_DIR+"courbd.ttf")
    pdf.add_page()

    # ── COVER ─────────────────────────────────────────────────────
    pdf.set_fill_color(*DANGER)
    pdf.rect(0, 0, 210, 72, "F")
    pdf.set_font("A","B",24); pdf.set_text_color(*WHITE)
    pdf.set_xy(0,18); pdf.cell(210,14,"Tratamento de Excecoes e Falhas",align="C",new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.set_font("A","",13)
    pdf.set_xy(0,35); pdf.cell(210,8,"Simulador Estrategico de Loja  |  Squad 16",align="C",new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.set_font("A","",10); pdf.set_text_color(254,202,202)
    pdf.set_xy(0,48); pdf.cell(210,7,"Validacao de dados, seguranca, banco de dados e resiliencia",align="C",new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.set_xy(0,57); pdf.cell(210,7,"Versao 1.0   |   Abril 2026",align="C",new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.set_y(80)
    pdf.set_font("A","",10); pdf.set_text_color(*TEXT)
    pdf.set_x(10)
    pdf.multi_cell(190, 5.5,
        "Este documento descreve todos os mecanismos de tratamento de erros e excecoes "
        "implementados no projeto. Como a aplicacao nao utiliza APIs externas de IA "
        "nem servicos de terceiros pagos, o foco esta nos erros de validacao, autenticacao, "
        "autorizacao, banco de dados, logica de negocio e resiliencia interna."
    )
    pdf.ln(3)

    # ── INDICE ────────────────────────────────────────────────────
    pdf.section("Indice", PRIMARY)
    items_idx = [
        ("1.", "Visao Geral da Estrategia de Erros"),
        ("2.", "Erros de Validacao (Zod)"),
        ("3.", "Erros de Autenticacao e Autorizacao"),
        ("4.", "Erros de Banco de Dados (Prisma)"),
        ("5.", "Erros de Logica de Negocio"),
        ("6.", "Tratamento de Excecoes no Frontend"),
        ("7.", "Resiliencia: Transacoes e Rollback"),
        ("8.", "Producao vs Desenvolvimento"),
        ("9.", "Tabela Consolidada de Erros"),
        ("10.","Ausencia de APIs Externas e Servicos de IA"),
    ]
    for num, title in items_idx:
        pdf.set_font("A","",10); pdf.set_text_color(*TEXT)
        pdf.set_x(14)
        pdf.cell(10,6,num)
        pdf.cell(0,6,title,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(2)

    # ── 1. VISAO GERAL ────────────────────────────────────────────
    pdf.section("1. Visao Geral da Estrategia de Erros")
    pdf.para(
        "O backend adota um padrao de tratamento centralizado de erros. Todos os controllers "
        "sao encapsulados por asyncHandler(), que captura excecoes de Promises e as encaminha "
        "ao middleware global errorMiddleware via next(err). Isso elimina try/catch repetitivo "
        "nos controllers e garante que nenhum erro nao tratado \"quebre\" o servidor silenciosamente."
    )
    pdf.ln(2)

    pdf.code(
        '// utils/asyncHandler.js\n'
        'function asyncHandler(fn) {\n'
        '  return (req, res, next) => {\n'
        '    Promise.resolve(fn(req, res, next)).catch(next);\n'
        '  };\n'
        '}\n'
        '// Todos os controllers: module.exports = asyncHandler(minhaFuncao)',
        "Padrao asyncHandler (backend/src/utils/asyncHandler.js):"
    )

    pdf.code(
        '// middlewares/errorMiddleware.js\n'
        'function errorMiddleware(err, req, res, next) {\n'
        '  const isProd = process.env.NODE_ENV === "production";\n'
        '\n'
        '  if (err instanceof ZodError)           // Validacao\n'
        '    return res.status(400).json({ error: "Dados invalidos", details: err.flatten() });\n'
        '\n'
        '  if (err.code === "P2025")              // Prisma: nao encontrado\n'
        '    return res.status(404).json({ error: "Registro nao encontrado" });\n'
        '\n'
        '  if (err.code === "P2002")              // Prisma: unique constraint\n'
        '    return res.status(409).json({ error: "Registro ja existe" });\n'
        '\n'
        '  console.error("[errorMiddleware]", err);\n'
        '  return res.status(500).json({\n'
        '    error: "Erro interno do servidor",\n'
        '    ...(isProd ? {} : { message: err.message, stack: err.stack }),\n'
        '  });\n'
        '}',
        "Middleware global (backend/src/middlewares/errorMiddleware.js):"
    )

    pdf.callout(
        "Fluxo de Propagacao de Erros",
        "Controller lanca excecao -> asyncHandler().catch(next) -> errorMiddleware(err, req, res, next) -> resposta HTTP padronizada",
        BLUE_BG, BLUE_BD
    )

    # ── 2. ERROS DE VALIDACAO ─────────────────────────────────────
    pdf.section("2. Erros de Validacao (Zod)")
    pdf.para(
        "Toda entrada de dados do usuario e validada com Zod antes de qualquer operacao "
        "no banco de dados. A validacao ocorre nos controllers via safeParse() para controle "
        "manual, e no frontend via zodResolver() integrado ao React Hook Form."
    )
    pdf.ln(1)

    pdf.subsec("2.1 Validacao no Backend (safeParse)")
    pdf.code(
        '// Exemplo: authController.js\n'
        'const loginSchema = z.object({\n'
        '  email:    z.string().email("Email invalido"),\n'
        '  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),\n'
        '});\n'
        '\n'
        'const parsed = loginSchema.safeParse(req.body);\n'
        'if (!parsed.success) {\n'
        '  return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });\n'
        '}\n'
        '\n'
        '// Resposta de erro retornada:\n'
        '// { "errors": { "email": ["Email invalido"] } }',
        ""
    )

    pdf.subsec("2.2 Schemas de Validacao por Recurso")
    rows_zod = [
        ("POST /auth/login",            "email (email), password (min 6)"),
        ("POST/PUT /users",             "name (min 1), email, password (min 6), role (enum)"),
        ("POST/PUT /products",          "name (min 1), purchasePrice (positivo)"),
        ("POST/PUT /squads",            "name (min 1)"),
        ("PUT /inventory/:productId",   "quantity (int >= 0)"),
        ("POST /inventory/restock",     "items[].productId (uuid), items[].quantity (int >= 0)"),
        ("POST /rounds",                "number (int pos), startDate, endDate (coerce date)"),
        ("POST /rounds/:id/config",     "fixedExpenses (>=0), variableExpenses (>=0), items[].salePrice/salesVolume"),
    ]
    pdf.table_header(["Endpoint","Campos Validados"],[55,135])
    for i,(ep,fields) in enumerate(rows_zod):
        bg = LIGHT if i%2==0 else WHITE
        pdf.set_fill_color(*bg); pdf.set_draw_color(*BORDER)
        pdf.set_x(10)
        pdf.set_font("C","",7.5); pdf.set_text_color(*PRIMARY)
        pdf.cell(55,6,ep,border=1,fill=True)
        pdf.set_font("A","",7.5); pdf.set_text_color(*TEXT)
        pdf.cell(135,6,fields,border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(3)

    pdf.subsec("2.3 Validacao no Frontend (React Hook Form + Zod)")
    pdf.para(
        "O frontend valida os formularios antes de disparar qualquer requisicao HTTP, "
        "proporcionando feedback imediato ao usuario sem custo de rede."
    )
    pdf.code(
        '// RoundConfigPage.jsx — schema de validacao\n'
        'const schema = z.object({\n'
        '  fixedExpenses:    z.coerce.number().min(0, "Nao pode ser negativo"),\n'
        '  variableExpenses: z.coerce.number().min(0, "Nao pode ser negativo"),\n'
        '  items: z.array(z.object({\n'
        '    productId:   z.string(),\n'
        '    salePrice:   z.coerce.number().positive("Deve ser positivo"),\n'
        '    salesVolume: z.coerce.number().int().positive("Deve ser inteiro positivo"),\n'
        '  })).min(1),\n'
        '});\n'
        '\n'
        '// Campos exibem mensagem de erro inline ao lado do input\n'
        '// Cor do campo muda para vermelho (border-red-400 bg-red-50)',
        ""
    )

    pdf.subsec("2.4 Alertas Visuais de Negocio no Frontend")
    pdf.para("Alem da validacao de formato, o frontend exibe alertas de negocio em tempo real:")
    pdf.bullet("Preco de venda abaixo do custo: campo fica laranja com mensagem 'Abaixo do custo'")
    pdf.bullet("Volume acima do estoque disponivel: campo fica laranja com mensagem 'Acima do estoque'")
    pdf.bullet("Esses alertas sao visuais; o backend tambem limita effectiveVolume ao estoque real")
    pdf.ln(2)

    # ── 3. AUTENTICACAO E AUTORIZACAO ─────────────────────────────
    pdf.section("3. Erros de Autenticacao e Autorizacao")

    pdf.subsec("3.1 authMiddleware — Validacao do JWT")
    pdf.code(
        '// middlewares/authMiddleware.js\n'
        'const authHeader = req.headers.authorization;\n'
        'if (!authHeader || !authHeader.startsWith("Bearer ")) {\n'
        '  return res.status(401).json({ message: "Token nao fornecido" });\n'
        '}\n'
        'try {\n'
        '  const decoded = jwt.verify(token, process.env.JWT_SECRET);\n'
        '  req.user = { id: decoded.userId, role: decoded.role, squadId: decoded.squadId };\n'
        '  return next();\n'
        '} catch {\n'
        '  return res.status(401).json({ message: "Token invalido ou expirado" });\n'
        '}',
        ""
    )

    rows_auth = [
        ("Header Authorization ausente ou mal-formado", "401", '"Token nao fornecido"'),
        ("Token expirado (exp claim)",                  "401", '"Token invalido ou expirado"'),
        ("Assinatura JWT invalida",                     "401", '"Token invalido ou expirado"'),
        ("Role do usuario nao autorizado",              "403", '"Acesso negado"'),
        ("Player tentando acessar loja de outro squad", "403", '"Acesso negado: loja nao pertence ao seu squad"'),
    ]
    pdf.table_header(["Cenario","HTTP","Mensagem"],[90,14,86])
    for i,(c,h,m) in enumerate(rows_auth):
        bg=LIGHT if i%2==0 else WHITE
        pdf.set_fill_color(*bg); pdf.set_draw_color(*BORDER)
        pdf.set_x(10)
        pdf.set_font("A","",7.5); pdf.set_text_color(*TEXT)
        pdf.cell(90,6,c,border=1,fill=True)
        pdf.set_font("A","B",7.5); pdf.set_text_color(*DANGER)
        pdf.cell(14,6,h,border=1,fill=True,align="C")
        pdf.set_font("C","",7); pdf.set_text_color(*MUTED)
        pdf.cell(86,6,m,border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(3)

    pdf.subsec("3.2 Interceptor Axios — Tratamento 401 no Frontend")
    pdf.code(
        '// frontend/src/services/api.js\n'
        'api.interceptors.response.use(\n'
        '  (response) => response,\n'
        '  (error) => {\n'
        '    if (error.response?.status === 401) {\n'
        '      useAuthStore.getState().logout(); // limpa token e estado\n'
        '      window.location.href = "/login";  // redireciona\n'
        '    }\n'
        '    return Promise.reject(error);       // propaga para o catch local\n'
        '  }\n'
        ');',
        ""
    )
    pdf.callout(
        "Nota de Seguranca",
        "O logout automatico por 401 garante que tokens expirados nao fiquem armazenados no "
        "localStorage. O estado Zustand e limpo antes do redirecionamento.",
        YELLOW_BG, YELLOW_BD
    )

    # ── 4. BANCO DE DADOS ─────────────────────────────────────────
    pdf.section("4. Erros de Banco de Dados (Prisma ORM)")
    pdf.para(
        "O errorMiddleware intercepta codigos de erro do Prisma Client antes de gerar "
        "uma resposta 500 generica. Os erros mais comuns sao tratados explicitamente."
    )
    pdf.ln(1)

    rows_prisma = [
        ("P2002","Unique constraint violation","409","Registro ja existe"),
        ("P2025","Record not found (update/delete)","404","Registro nao encontrado"),
        ("Outros","Erros de schema, conexao, etc.","500","Erro interno do servidor"),
    ]
    pdf.table_header(["Codigo Prisma","Descricao","HTTP","Resposta"],[28,72,14,76])
    for i,(code,desc,http,resp) in enumerate(rows_prisma):
        bg=LIGHT if i%2==0 else WHITE
        pdf.set_fill_color(*bg); pdf.set_draw_color(*BORDER)
        pdf.set_x(10)
        pdf.set_font("C","B",7.5); pdf.set_text_color(*PRIMARY)
        pdf.cell(28,6,code,border=1,fill=True)
        pdf.set_font("A","",7.5); pdf.set_text_color(*TEXT)
        pdf.cell(72,6,desc,border=1,fill=True)
        c_col = DANGER if http in ("404","409","500") else SUCCESS
        pdf.set_font("A","B",7.5); pdf.set_text_color(*c_col)
        pdf.cell(14,6,http,border=1,fill=True,align="C")
        pdf.set_font("C","",7); pdf.set_text_color(*MUTED)
        pdf.cell(76,6,resp,border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(3)

    pdf.callout(
        "Banco de Dados Local vs Producao",
        "Em desenvolvimento local usa SQLite (prisma/schema.local.prisma + local.db). "
        "Em producao usa PostgreSQL v14+. O Prisma abstrai as diferencas, mas erros de "
        "conexao com Postgres (ECONNREFUSED, timeout) chegam como erro 500 no middleware.",
        BLUE_BG, BLUE_BD
    )

    # ── 5. LOGICA DE NEGOCIO ──────────────────────────────────────
    pdf.section("5. Erros de Logica de Negocio")
    pdf.para(
        "Alem dos erros tecnicos, os controllers validam regras de negocio e retornam "
        "codigos HTTP semanticos com mensagens claras."
    )
    pdf.ln(1)

    rows_biz = [
        ("400","submitConfig","Usuario sem squadId vinculado","Usuario nao pertence a um squad"),
        ("400","submitConfig","Squad sem loja cadastrada","Seu squad nao possui uma loja cadastrada"),
        ("400","submitConfig","ProductIds duplicados no array items","Existem produtos duplicados nos items"),
        ("400","submitConfig","ProductId nao encontrado no BD","Produtos nao encontrados"),
        ("404","submitConfig","Rodada nao existe","Rodada nao encontrada"),
        ("409","submitConfig","Rodada com status != OPEN","Nao e possivel submeter: rodada esta CLOSED/PROCESSING"),
        ("409","submitConfig","Config ja submetida para esta rodada","Voce ja submeteu uma configuracao"),
        ("409","createRound","Ja existe rodada OPEN/PROCESSING","Encerre a rodada atual antes de criar outra"),
        ("409","closeRound","Rodada com status != OPEN","Rodada nao pode ser encerrada (status atual)"),
        ("404","getResults","Rodada nao CLOSED","Resultados disponiveis apenas apos encerramento"),
        ("403","getInventory","Player acessando loja de outro squad","Acesso negado: loja nao pertence ao seu squad"),
        ("409","deleteUser","Usuario lider de squad","Transfira a liderança antes de remover"),
        ("409","createUser","Email ja cadastrado","Email ja esta em uso"),
    ]
    pdf.table_header(["HTTP","Controller","Gatilho","Mensagem"],[14,32,72,72])
    for i,(http,ctrl,trigger,msg) in enumerate(rows_biz):
        if pdf.get_y() > 265:
            pdf.add_page()
        bg=LIGHT if i%2==0 else WHITE
        pdf.set_fill_color(*bg); pdf.set_draw_color(*BORDER)
        pdf.set_x(10)
        c_col = WARNING if http=="400" else (DANGER if http in ("403","404","409","500") else SUCCESS)
        pdf.set_font("A","B",7.5); pdf.set_text_color(*c_col)
        pdf.cell(14,6,http,border=1,fill=True,align="C")
        pdf.set_font("C","",7); pdf.set_text_color(*PRIMARY)
        pdf.cell(32,6,ctrl,border=1,fill=True)
        pdf.set_font("A","",7.5); pdf.set_text_color(*TEXT)
        pdf.cell(72,6,trigger,border=1,fill=True)
        pdf.set_font("A","",7); pdf.set_text_color(*MUTED)
        pdf.cell(72,6,msg,border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(3)

    # ── 6. FRONTEND ───────────────────────────────────────────────
    pdf.section("6. Tratamento de Excecoes no Frontend")

    pdf.subsec("6.1 Padroes de Tratamento em Paginas")
    pdf.para(
        "As paginas utilizam tres estados para lidar com carregamento e falhas: "
        "loading (exibe Skeleton), loadError (exibe ErrorMessage + botao Retry), "
        "e dados carregados com sucesso."
    )
    pdf.code(
        '// Padrao aplicado em: RoundConfigPage, StoresDashboard,\n'
        '//   AdminDashboard, ProductsManagementPage, etc.\n'
        '\n'
        'const [loading, setLoading] = useState(true);\n'
        'const [loadError, setLoadError] = useState("");\n'
        '\n'
        'async function load() {\n'
        '  setLoadError("");\n'
        '  try {\n'
        '    const data = await Promise.all([api1(), api2()]);\n'
        '    // atualiza estado\n'
        '  } catch {\n'
        '    setLoadError("Nao foi possivel carregar os dados.");\n'
        '  } finally {\n'
        '    setLoading(false);\n'
        '  }\n'
        '}\n'
        '\n'
        'if (loading) return <Skeleton />;\n'
        'if (loadError) return <ErrorMessage message={loadError} onRetry={load} />;',
        ""
    )

    pdf.subsec("6.2 Toast de Notificacao para Erros de Mutacao")
    pdf.code(
        '// Para acoes (submit, delete, restock, etc.)\n'
        'try {\n'
        '  await roundService.submitConfig(roundId, data);\n'
        '  toast.success("Estrategia enviada com sucesso!");\n'
        '} catch (err) {\n'
        '  // Extrai mensagem do backend ou usa fallback\n'
        '  toast.error(\n'
        '    err.response?.data?.message ??\n'
        '    err.response?.data?.error   ??\n'
        '    "Erro ao enviar configuracao"\n'
        '  );\n'
        '}',
        ""
    )

    pdf.subsec("6.3 Sessao Expirada / Token Invalido")
    pdf.bullet("Axios intercepta 401 automaticamente em qualquer requisicao")
    pdf.bullet("Chama useAuthStore.getState().logout() — limpa localStorage")
    pdf.bullet("Redireciona para /login com window.location.href")
    pdf.bullet("O usuario ve a tela de login sem mensagem de erro tecnica")
    pdf.ln(2)

    pdf.subsec("6.4 Rota Nao Encontrada")
    pdf.code(
        '// App.jsx — rota catch-all\n'
        '<Route path="*" element={<Navigate to="/login" replace />} />\n'
        '\n'
        '// Acesso a rota sem permissao -> PrivateRoute redireciona para /unauthorized\n'
        '// UnauthorizedPage exibe mensagem amigavel',
        ""
    )

    # ── 7. TRANSACOES ─────────────────────────────────────────────
    pdf.section("7. Resiliencia: Transacoes Prisma e Rollback")
    pdf.para(
        "O processamento de rodadas utiliza Prisma Transactions ($transaction) para garantir "
        "atomicidade: ou todos os dados de uma loja sao persistidos (FinancialResult + "
        "desconto de Inventory), ou nenhum."
    )
    pdf.code(
        '// simulationService.js — processamento por loja\n'
        'for (const config of configs) {\n'
        '  try {\n'
        '    await prisma.$transaction(async (tx) => {\n'
        '      // 1. Calcula DRE\n'
        '      const dre = calcularDRE(roundConfig, items, inventory);\n'
        '      // 2. Persiste FinancialResult\n'
        '      await tx.financialResult.create({ data: { ...dre } });\n'
        '      // 3. Desconta estoque de cada produto\n'
        '      for (const b of dre.itemBreakdown) {\n'
        '        await tx.inventory.update({ where: {...}, data: { quantity: { decrement: b.effectiveVolume } } });\n'
        '      }\n'
        '    }); // commit automatico ao final\n'
        '  } catch (err) {\n'
        '    // Rollback automatico pelo Prisma\n'
        '    console.error(`Erro ao processar loja ${config.storeId}:`, err.message);\n'
        '    // Continua para a proxima loja (nao aborta o processamento completo)\n'
        '  }\n'
        '}',
        ""
    )
    pdf.callout(
        "Comportamento em Caso de Falha",
        "Se o processamento de uma loja falhar (ex: constraint violada, erro de rede com BD), "
        "o Prisma reverte automaticamente a transacao daquela loja. As demais lojas continuam "
        "sendo processadas. O erro e logado no console do servidor mas nao interrompe a rodada.",
        YELLOW_BG, YELLOW_BD
    )

    # ── 8. PRODUCAO VS DEV ────────────────────────────────────────
    pdf.section("8. Comportamento: Producao vs Desenvolvimento")
    pdf.code(
        '// errorMiddleware.js\n'
        'const isProd = process.env.NODE_ENV === "production";\n'
        'return res.status(500).json({\n'
        '  error: "Erro interno do servidor",\n'
        '  ...(isProd ? {} : { message: err.message, stack: err.stack }),\n'
        '});',
        ""
    )
    rows_env = [
        ("Mensagem de erro 500","message + stack trace completo","Apenas 'Erro interno do servidor'"),
        ("Erros do Prisma (P2025/P2002)","Tratados igualmente","Tratados igualmente"),
        ("Banco de dados","SQLite (arquivo local.db)","PostgreSQL 14+"),
        ("JWT_SECRET","Variavel .env.local","Variavel de ambiente segura"),
        ("Stack trace no response","Visivel (debug)","Ocultado"),
    ]
    pdf.table_header(["Aspecto","Desenvolvimento","Producao"],[60,65,65])
    for i,(a,d,p) in enumerate(rows_env):
        bg=LIGHT if i%2==0 else WHITE
        pdf.set_fill_color(*bg); pdf.set_draw_color(*BORDER)
        pdf.set_x(10)
        pdf.set_font("A","B",8); pdf.set_text_color(*TEXT)
        pdf.cell(60,6,a,border=1,fill=True)
        pdf.set_font("A","",7.5); pdf.set_text_color(*MUTED)
        pdf.cell(65,6,d,border=1,fill=True)
        pdf.cell(65,6,p,border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(3)

    # ── 9. TABELA CONSOLIDADA ─────────────────────────────────────
    pdf.section("9. Tabela Consolidada de Todos os Erros")
    pdf.table_header(["HTTP","Onde","Gatilho","Resposta"],[14,38,74,64])
    rows_all = [
        ("400","authController","Email/senha invalidos no formato","{ errors: { email/password: [...] } }"),
        ("400","userController","Campos obrigatorios ausentes","{ errors: { fieldName: [...] } }"),
        ("400","inventoryCtrl","quantity nao e inteiro >= 0","{ errors: { quantity: [...] } }"),
        ("400","roundController","number/startDate/endDate invalidos","{ errors: { field: [...] } }"),
        ("400","simulationCtrl","fixedExpenses negativo ou items vazio","{ errors: { field: [...] } }"),
        ("400","simulationCtrl","Usuario sem squad","{ message: 'Nao pertence a um squad' }"),
        ("400","simulationCtrl","Squad sem loja","{ message: 'Squad nao possui loja' }"),
        ("400","simulationCtrl","ProductIds duplicados","{ message: 'Produtos duplicados' }"),
        ("401","authMiddleware","Header Authorization ausente","{ message: 'Token nao fornecido' }"),
        ("401","authMiddleware","Token expirado ou invalido","{ message: 'Token invalido ou expirado' }"),
        ("401","authController","Senha incorreta","{ message: 'Credenciais invalidas' }"),
        ("403","roleMiddleware","Role insuficiente","{ message: 'Acesso negado' }"),
        ("403","inventoryCtrl","Player acessando loja alheia","{ message: 'Loja nao pertence ao squad' }"),
        ("404","roundController","Rodada nao encontrada","{ message: 'Rodada nao encontrada' }"),
        ("404","inventoryCtrl","Produto nao no estoque","{ message: 'Produto nao encontrado no estoque' }"),
        ("404","simulationCtrl","Resultado nao disponivel","{ message: 'Resultados apos encerramento' }"),
        ("404","errorMiddleware","Prisma P2025","{ error: 'Registro nao encontrado' }"),
        ("409","userController","Email duplicado","{ message: 'Email ja esta em uso' }"),
        ("409","userController","Remover lider de squad","{ message: 'Transfira a lideranca' }"),
        ("409","roundController","Ja existe rodada ativa","{ message: 'Encerre a rodada atual' }"),
        ("409","roundController","Fechar rodada nao OPEN","{ message: 'Rodada nao pode ser encerrada' }"),
        ("409","simulationCtrl","Config ja submetida","{ message: 'Ja submeteu configuracao' }"),
        ("409","simulationCtrl","Rodada nao OPEN","{ message: 'Nao e possivel submeter' }"),
        ("409","errorMiddleware","Prisma P2002","{ error: 'Registro ja existe' }"),
        ("500","errorMiddleware","Excecao nao capturada","{ error: 'Erro interno do servidor' }"),
    ]
    for i,(http,where,trigger,resp) in enumerate(rows_all):
        if pdf.get_y() > 267:
            pdf.add_page()
        bg=LIGHT if i%2==0 else WHITE
        pdf.set_fill_color(*bg); pdf.set_draw_color(*BORDER)
        pdf.set_x(10)
        c_col=(WARNING if http=="400" else (SUCCESS if http=="200" else DANGER))
        pdf.set_font("A","B",7); pdf.set_text_color(*c_col)
        pdf.cell(14,5.5,http,border=1,fill=True,align="C")
        pdf.set_font("C","",7); pdf.set_text_color(*PRIMARY)
        pdf.cell(38,5.5,where,border=1,fill=True)
        pdf.set_font("A","",7); pdf.set_text_color(*TEXT)
        pdf.cell(74,5.5,trigger,border=1,fill=True)
        pdf.set_font("C","",6.5); pdf.set_text_color(*MUTED)
        pdf.cell(64,5.5,resp,border=1,fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
    pdf.ln(3)

    # ── 10. SEM APIs EXTERNAS ─────────────────────────────────────
    pdf.section("10. Ausencia de APIs Externas e Servicos de IA", (71, 85, 105))
    pdf.callout(
        "Sem Integracao com APIs Externas ou Servicos de IA",
        "O projeto NAO utiliza nenhuma API de terceiros (pagamentos, e-mail, SMS, mapas) "
        "nem servicos de inteligencia artificial (OpenAI, Anthropic, Gemini, etc.). "
        "Todo o processamento e local: calculo de DRE, ranking e feedbacks sao algoritmos "
        "puramente deterministas em JavaScript/Node.js sem chamadas externas.",
        GREEN_BG, GREEN_BD
    )
    pdf.para(
        "Portanto, as categorias de falha listadas abaixo NAO se aplicam a esta versao do projeto:"
    )
    na_items = [
        "Falhas de conexao com API externa (timeout, ECONNREFUSED, rate limit)",
        "Respostas inesperadas de API de IA (hallucinations, incomplete responses)",
        "Indisponibilidade de servico de IA (5xx do provedor)",
        "Latencia de chamadas a APIs de terceiros",
        "Limites de requisicao (API quota exceeded)",
        "Erros de autenticacao com servicos externos (API keys expiradas)",
        "Webhook failures ou retentativas de entrega",
    ]
    for item in na_items:
        pdf.bullet(item)
    pdf.ln(2)
    pdf.callout(
        "Recomendacao para Versoes Futuras",
        "Se integracao com IA for adicionada (ex: sugestao automatica de preco, analise de "
        "desempenho por LLM), recomenda-se: circuit breaker para timeout, fallback gracioso "
        "(exibir mensagem 'servico indisponivel' ao inves de erro 500), retry com backoff "
        "exponencial, e log centralizado de chamadas externas.",
        YELLOW_BG, YELLOW_BD
    )

    pdf.output(OUTPUT_PATH)
    print(f"PDF gerado: {OUTPUT_PATH}")


if __name__ == "__main__":
    build()
