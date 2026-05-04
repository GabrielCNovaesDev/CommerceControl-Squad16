"""
Tutorial PDF Generator - Como Jogar
Simulador Estrategico de Loja - Squad 16
"""
from fpdf import FPDF
from fpdf.enums import XPos, YPos
import os

OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "TUTORIAL_COMO_JOGAR_SQUAD16.pdf"
)

FONTS_DIR = "C:/Windows/Fonts/"

# Palette
PRIMARY   = (30, 64, 175)
SECONDARY = (59, 130, 246)
ACCENT    = (239, 246, 255)
SUCCESS   = (22, 163, 74)
WARNING   = (234, 88, 12)
DANGER    = (220, 38, 38)
PURPLE    = (124, 58, 237)
TEXT      = (15, 23, 42)
MUTED     = (100, 116, 139)
WHITE     = (255, 255, 255)
LIGHT     = (248, 250, 252)
BORDER    = (203, 213, 225)
DARK_BG   = (30, 41, 59)


class Tutorial(FPDF):

    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*PRIMARY)
        self.rect(0, 0, 210, 12, "F")
        self.set_font("ArialUni", "B", 9)
        self.set_text_color(*WHITE)
        self.set_xy(10, 2)
        self.cell(150, 8, "Simulador Estrategico de Loja - Tutorial  |  Squad 16")
        self.set_xy(0, 2)
        self.cell(200, 8, f"Pag. {self.page_no()}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")
        self.ln(4)

    def footer(self):
        self.set_y(-12)
        self.set_font("ArialUni", "", 7)
        self.set_text_color(*MUTED)
        self.cell(0, 8, "Cencosud  |  Tutorial Como Jogar  |  v1.0", align="C")


def add_fonts(pdf: FPDF):
    pdf.add_font("ArialUni", "",  os.path.join(FONTS_DIR, "arial.ttf"))
    pdf.add_font("ArialUni", "B", os.path.join(FONTS_DIR, "arialbd.ttf"))
    pdf.add_font("ArialUni", "I", os.path.join(FONTS_DIR, "ariali.ttf"))
    pdf.add_font("Mono",     "",  os.path.join(FONTS_DIR, "consola.ttf"))


# ─── Building blocks ──────────────────────────────────────────────────────────

def cover(pdf: FPDF):
    pdf.add_page()
    pdf.set_fill_color(*PRIMARY)
    pdf.rect(0, 0, 210, 297, "F")

    # Decorative band
    pdf.set_fill_color(*SECONDARY)
    pdf.rect(0, 95, 210, 80, "F")

    pdf.set_text_color(*WHITE)
    pdf.set_xy(15, 50)
    pdf.set_font("ArialUni", "B", 14)
    pdf.cell(0, 8, "Cencosud  |  Squad 16")
    pdf.ln(20)

    pdf.set_x(15)
    pdf.set_font("ArialUni", "B", 32)
    pdf.cell(0, 16, "Como Jogar", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_x(15)
    pdf.set_font("ArialUni", "B", 22)
    pdf.cell(0, 12, "Simulador Estrategico de Loja", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.ln(6)
    pdf.set_x(15)
    pdf.set_font("ArialUni", "", 13)
    pdf.multi_cell(180, 7,
        "Tutorial passo a passo: do login a configuracao de rodada,\n"
        "leitura do DRE e estrategias para liderar o ranking.")

    pdf.set_xy(15, 220)
    pdf.set_font("ArialUni", "B", 11)
    pdf.cell(0, 6, "PUBLICO-ALVO", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(15)
    pdf.set_font("ArialUni", "", 11)
    pdf.cell(0, 6, "Jogadores (PLAYER) e Game Masters (GAME_MASTER).")

    pdf.set_xy(15, 245)
    pdf.set_font("ArialUni", "B", 11)
    pdf.cell(0, 6, "PRE-REQUISITOS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(15)
    pdf.set_font("ArialUni", "", 11)
    pdf.cell(0, 6, "Conta criada pelo Game Master e estar em uma squad.")

    pdf.set_text_color(*TEXT)


def section_title(pdf: FPDF, num: str, title: str):
    if pdf.get_y() > 250:
        pdf.add_page()
    pdf.ln(4)
    pdf.set_fill_color(*PRIMARY)
    pdf.set_text_color(*WHITE)
    pdf.set_font("ArialUni", "B", 13)
    pdf.cell(15, 10, num, fill=True, align="C")
    pdf.set_fill_color(*ACCENT)
    pdf.set_text_color(*PRIMARY)
    pdf.cell(0, 10, " " + title, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_text_color(*TEXT)
    pdf.ln(3)


def subtitle(pdf: FPDF, text: str):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("ArialUni", "B", 11)
    pdf.set_text_color(*PRIMARY)
    pdf.cell(0, 7, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_text_color(*TEXT)
    pdf.ln(1)


def paragraph(pdf: FPDF, text: str):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("ArialUni", "", 10)
    pdf.set_text_color(*TEXT)
    pdf.multi_cell(0, 5.5, text)
    pdf.ln(1)


def bullet(pdf: FPDF, text: str, indent: int = 4):
    pdf.set_font("ArialUni", "", 10)
    pdf.set_text_color(*TEXT)
    pdf.set_x(pdf.l_margin + indent)
    pdf.cell(4, 5.5, "-")
    available_w = pdf.w - pdf.r_margin - pdf.get_x()
    pdf.multi_cell(available_w, 5.5, text)
    pdf.set_x(pdf.l_margin)


def numbered(pdf: FPDF, n: int, text: str):
    pdf.set_font("ArialUni", "B", 10)
    pdf.set_text_color(*PRIMARY)
    pdf.set_x(pdf.l_margin + 2)
    pdf.cell(8, 5.5, f"{n}.")
    pdf.set_font("ArialUni", "", 10)
    pdf.set_text_color(*TEXT)
    available_w = pdf.w - pdf.r_margin - pdf.get_x()
    pdf.multi_cell(available_w, 5.5, text)
    pdf.set_x(pdf.l_margin)


def callout(pdf: FPDF, label: str, text: str, color=WARNING):
    pdf.ln(1)
    pdf.set_x(pdf.l_margin)
    pdf.set_fill_color(*LIGHT)
    pdf.set_draw_color(*color)
    x0 = pdf.l_margin
    y0 = pdf.get_y()
    pdf.set_font("ArialUni", "", 9.5)
    lines = pdf.multi_cell(184, 5, text, dry_run=True, output="LINES")
    h = max(12, 9 + 5 * len(lines))
    pdf.rect(x0, y0, 190, h, "FD")
    pdf.set_xy(x0 + 3, y0 + 2)
    pdf.set_font("ArialUni", "B", 9.5)
    pdf.set_text_color(*color)
    pdf.cell(0, 5, label, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(x0 + 3)
    pdf.set_font("ArialUni", "", 9.5)
    pdf.set_text_color(*TEXT)
    pdf.multi_cell(184, 5, text)
    pdf.set_xy(x0, y0 + h + 2)


def code_block(pdf: FPDF, text: str):
    pdf.ln(1)
    pdf.set_fill_color(*DARK_BG)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Mono", "", 9)
    lines = text.split("\n")
    h = 5 * len(lines) + 4
    x0 = pdf.get_x()
    y0 = pdf.get_y()
    pdf.rect(x0, y0, 190, h, "F")
    pdf.set_xy(x0 + 3, y0 + 2)
    for ln in lines:
        pdf.cell(0, 5, ln, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_x(x0 + 3)
    pdf.set_xy(x0, y0 + h + 2)
    pdf.set_text_color(*TEXT)


def table(pdf: FPDF, headers, rows, col_widths):
    pdf.set_fill_color(*PRIMARY)
    pdf.set_text_color(*WHITE)
    pdf.set_font("ArialUni", "B", 9.5)
    for h, w in zip(headers, col_widths):
        pdf.cell(w, 7, " " + h, fill=True, border=0)
    pdf.ln()

    pdf.set_text_color(*TEXT)
    pdf.set_font("ArialUni", "", 9)
    fill = False
    for row in rows:
        if pdf.get_y() > 270:
            pdf.add_page()
            pdf.set_fill_color(*PRIMARY)
            pdf.set_text_color(*WHITE)
            pdf.set_font("ArialUni", "B", 9.5)
            for h, w in zip(headers, col_widths):
                pdf.cell(w, 7, " " + h, fill=True, border=0)
            pdf.ln()
            pdf.set_text_color(*TEXT)
            pdf.set_font("ArialUni", "", 9)

        if fill:
            pdf.set_fill_color(*LIGHT)
        else:
            pdf.set_fill_color(*WHITE)
        for cell, w in zip(row, col_widths):
            pdf.cell(w, 6.5, " " + str(cell), fill=True, border=0)
        pdf.ln()
        fill = not fill
    pdf.ln(2)


# ─── Sections ─────────────────────────────────────────────────────────────────

def sec_overview(pdf):
    section_title(pdf, "01", "VISAO GERAL")
    paragraph(pdf,
        "O Simulador Estrategico de Loja e um jogo de simulacao de negocios desenvolvido para "
        "treinamento de gestao de lojas no varejo Cencosud. Voce e seu time (squad) administram "
        "uma loja virtual, tomando decisoes financeiras a cada rodada: quanto comprar de estoque, "
        "qual margem aplicar em cada categoria, quantos operadores contratar, em quais melhorias "
        "investir (CAPEX). O sistema calcula o DRE (Demonstracao do Resultado do Exercicio) e "
        "compara o desempenho de cada loja em um ranking por EBITDA."
    )

    subtitle(pdf, "Objetivo do jogo")
    bullet(pdf, "Maximizar o EBITDA da sua loja ao final das rodadas.")
    bullet(pdf, "Equilibrar receita, custos, quebras, despesas operacionais e investimentos.")
    bullet(pdf, "Conquistar a maior fatia de demanda do mercado contra as outras squads.")

    subtitle(pdf, "Conceitos-chave")
    bullet(pdf, "Squad: equipe de jogadores. Toda squad possui exatamente uma loja.")
    bullet(pdf, "Loja: comeca com R$ 700.000 de capital inicial e estoque zerado.")
    bullet(pdf, "Rodada: ciclo de jogo. O Game Master abre, players configuram, GM fecha. Tem duracao em horas e um timer.")
    bullet(pdf, "Configuracao da Rodada: o conjunto de decisoes que cada squad envia (estoque, margens, operadores, CAPEX).")
    bullet(pdf, "DRE: relatorio financeiro com receita, custos e EBITDA gerado quando a rodada fecha.")
    bullet(pdf, "Demand Share: fatia da demanda do mercado que sua loja captura, baseada na competicao com as outras lojas.")


def sec_login(pdf):
    section_title(pdf, "02", "ACESSANDO O SISTEMA")

    subtitle(pdf, "Perfis de usuario")
    rows = [
        ("GAME_MASTER", "Administra: usuarios, squads, produtos, rodadas e fechamento."),
        ("PLAYER",      "Joga: configura rodadas, ve DRE da sua loja, ve ranking."),
        ("OBSERVER",    "Apenas visualiza ranking e resultados publicos."),
    ]
    table(pdf, ["Perfil", "O que faz"], rows, [40, 150])

    subtitle(pdf, "Como entrar")
    numbered(pdf, 1, "Abra http://localhost:5173 no navegador (ou a URL informada pelo GM).")
    numbered(pdf, 2, "Informe e-mail e senha cadastrados pelo Game Master.")
    numbered(pdf, 3, "Apos login, voce e redirecionado para o painel de acordo com seu perfil.")

    callout(pdf, "CONTAS PADRAO (DEV)",
        "Em ambiente de desenvolvimento o seed cria automaticamente:\n"
        "  -  admin@simulador.com / admin123     (GAME_MASTER)\n"
        "  -  alpha@simulador.com / player123    (PLAYER, Squad Alpha)\n"
        "  -  beta@simulador.com  / player123    (PLAYER, Squad Beta)\n"
        "Em producao, o GM cria as contas manualmente.",
        color=SECONDARY)


def sec_categories(pdf):
    section_title(pdf, "03", "CATEGORIAS DE PRODUTO")
    paragraph(pdf,
        "O catalogo possui 4 categorias. Cada categoria tem um preco de compra fixo, "
        "imposto, taxa de quebra (estrago fisico), taxa de aging (perda de validade) e "
        "um teto de mix de mercado disponivel para venda."
    )

    headers = ["Categoria", "Preco compra", "Imposto", "Quebra", "Aging", "Mix mercado"]
    rows = [
        ("Pereciveis", "R$ 20,00",  "12%", "2,00%",  "5,83%",  "4.000 un"),
        ("Mercearia",  "R$ 30,00",  "7%",  "1,50%",  "0,83%",  "6.000 un"),
        ("Eletro",     "R$ 500,00", "25%", "0,00%",  "1,33%",  "700 un"),
        ("Hipel",      "R$ 45,00",  "17%", "1,00%",  "1,08%",  "5.000 un"),
    ]
    table(pdf, headers, rows, [32, 30, 22, 25, 25, 56])

    callout(pdf, "COMO LER",
        "Pereciveis: maior risco operacional (quebra + aging altos) mas alto giro. "
        "Eletro: margem unitaria grande mas mix limitado e imposto pesado. "
        "Mercearia/Hipel: equilibrio entre giro e risco.",
        color=PURPLE)


def sec_round_flow(pdf):
    section_title(pdf, "04", "FLUXO DE UMA RODADA")

    subtitle(pdf, "Estados da rodada")
    bullet(pdf, "OPEN: GM acabou de criar. Players podem enviar configuracoes ate o timer expirar.")
    bullet(pdf, "PROCESSING: GM acionou o fechamento. O sistema esta calculando DRE e ranking.")
    bullet(pdf, "CLOSED: rodada finalizada. Resultados ficam visiveis no historico.")

    subtitle(pdf, "Sequencia tipica")
    numbered(pdf, 1, "GAME MASTER cria a rodada definindo numero, duracao em horas e fator de demanda.")
    numbered(pdf, 2, "PLAYER (lider da squad) abre a tela de configuracao de rodada.")
    numbered(pdf, 3, "PLAYER define para cada categoria: volume planejado e margem comercial.")
    numbered(pdf, 4, "PLAYER define operadores (caixa e servico), numero de PDVs e CAPEX desejado.")
    numbered(pdf, 5, "PLAYER usa o Preview do DRE para simular antes de salvar (nao persiste).")
    numbered(pdf, 6, "PLAYER envia (POST /rounds/:id/config) - so um envio por loja por rodada.")
    numbered(pdf, 7, "GAME MASTER fecha a rodada (PATCH /rounds/:id/close) quando todos enviaram ou o tempo acaba.")
    numbered(pdf, 8, "Sistema calcula demand share, DRE, atualiza estoque e gera ranking.")
    numbered(pdf, 9, "PLAYERS visualizam DRE da sua loja e ranking publico.")

    callout(pdf, "REGRA-CHAVE",
        "Apenas o LIDER da squad envia a configuracao. Membros nao-lideres veem a tela mas nao "
        "submetem. Combine com seu time antes de o lider clicar em Enviar.",
        color=DANGER)


def sec_configure(pdf):
    section_title(pdf, "05", "CONFIGURANDO SUA RODADA")

    subtitle(pdf, "1. Volume e margem por categoria")
    paragraph(pdf,
        "Para cada categoria voce decide quantas unidades comprar (salesVolume) e qual margem "
        "comercial aplicar (margin, em decimal: 0,30 = 30%). O preco de venda e calculado "
        "automaticamente pela formula:"
    )
    code_block(pdf, "salePrice = (purchasePrice * (1 + margin)) / (1 - taxRate)")
    paragraph(pdf,
        "A margem precisa cobrir o imposto E gerar lucro. Margem baixa em categoria de imposto "
        "alto (Eletro 25%) pode dar prejuizo unitario."
    )

    subtitle(pdf, "2. Operadores")
    bullet(pdf, "Operadores de Caixa: ideal 10. Cada um custa R$ 1.000/mes.")
    bullet(pdf, "Operadores de Servico: ideal 5. Cada um custa R$ 1.200/mes. Define o SLA de manutencao.")
    paragraph(pdf,
        "Menos caixas reduz o CSAT (Customer Satisfaction) proporcionalmente. CSAT impacta "
        "diretamente na fatia de demanda que sua loja recebe."
    )

    subtitle(pdf, "3. Numero de PDVs")
    paragraph(pdf,
        "PDVs (pontos de venda). Padrao 6. Cada PDV custa R$ 80/mes em licenca de software."
    )

    subtitle(pdf, "4. CAPEX (investimentos pontuais)")
    paragraph(pdf,
        "Investimentos unicos deduzidos do capital da loja. Cada CAPEX traz um beneficio operacional:"
    )
    headers = ["CAPEX", "Custo", "Beneficio"]
    rows = [
        ("Seguranca",       "R$ 50.000", "Reduz risco; custo de licenca de seguranca aumenta para R$ 600/mes"),
        ("Balanca/Freezer", "R$ 75.000", "Elimina manutencao mensal de R$ 400 (equipamento novo na garantia)"),
        ("Redes",           "R$ 80.000", "Infra de rede mais robusta"),
        ("Site",            "R$ 65.000", "E-commerce ativo; licenca do site sobe para R$ 650/mes"),
        ("Self Checkout",   "R$ 80.000", "Adiciona 4 PDVs self-service (R$ 320/mes em licencas)"),
        ("Melhoria",        "R$ 45.000", "Reforma/melhoria geral da loja"),
    ]
    table(pdf, headers, rows, [40, 25, 125])

    subtitle(pdf, "5. Outras despesas")
    paragraph(pdf,
        "Campo livre (otherExpenses) para gastos extras que voce queira simular: marketing, "
        "promocoes, eventos."
    )

    callout(pdf, "CUIDADO COM CAPITAL",
        "Capital inicial = R$ 700.000. Se a soma (custo do estoque + CAPEX) exceder o capital, "
        "o sistema cobra juros de 12% sobre o excedente. Planeje para nao precisar de financiamento.",
        color=DANGER)


def sec_dre(pdf):
    section_title(pdf, "06", "COMO E CALCULADO O DRE")
    paragraph(pdf,
        "Apos o fechamento, o sistema gera o DRE para cada loja seguindo esta estrutura:"
    )
    code_block(pdf,
        "Receita Bruta\n"
        "(-) Impostos                    [taxRate x receita]\n"
        "(=) Receita Liquida\n"
        "(-) Custo de Venda              [purchasePrice x qtd vendida]\n"
        "(=) Massa Margem Bruta\n"
        "(-) Quebras                     [estoque nao vendido x preco x breakageRate]\n"
        "(-) Aging                       [estoque nao vendido x preco x agingRate]\n"
        "(=) Massa Margem Liquida\n"
        "(-) Outras Despesas             [otherExpenses + folha + licencas + manutencao + juros]\n"
        "(=) EBITDA\n"
        "    EBITDA Margin %             [ebitda / receita liquida]"
    )

    subtitle(pdf, "Componentes automaticos das despesas")
    bullet(pdf, "Folha (caixa x R$1.000) + (servico x R$1.200).")
    bullet(pdf, "Licencas: SO (R$600 fixo) + PDVs x R$80 + Site (R$500/650) + Seguranca (R$500/600) + Self Checkout.")
    bullet(pdf, "Manutencao: R$400/mes. Zerada se voce comprou CAPEX Balanca/Freezer.")
    bullet(pdf, "Juros: 12% sobre o que ultrapassar o capital inicial.")

    callout(pdf, "VOLUME EFETIVO",
        "O volume planejado nao e necessariamente o volume vendido. O sistema usa o MENOR valor "
        "entre: (a) o que sua squad recebeu da demanda do mercado, (b) o estoque que voce "
        "comprou. Se voce planejou vender 1000 mas o mercado so te alocou 600, voce vende 600 - "
        "e os 400 restantes em estoque viram quebra/aging.",
        color=WARNING)


def sec_demand(pdf):
    section_title(pdf, "07", "MERCADO E DEMAND SHARE")
    paragraph(pdf,
        "A demanda total do mercado por categoria = mixAvailable x demandFactor (definido pelo GM "
        "ao criar a rodada, padrao 0,5). Essa demanda e DIVIDIDA entre as lojas conforme tres "
        "criterios competitivos. Cada criterio gera um score de 1 a 4 (melhor = 4)."
    )

    subtitle(pdf, "Criterios de competicao")
    headers = ["Criterio", "Como calcula", "Quem vence"]
    rows = [
        ("Preco da cesta", "Media ponderada do preco de venda x estoque", "Quem tem o MENOR preco medio"),
        ("Disponibilidade", "Estoque comprado / mix disponivel do mercado", "Quem tem MAIS estoque"),
        ("CSAT",            "min(1, caixas/10) x quizScore",                "Quem tem MAIOR CSAT"),
    ]
    table(pdf, headers, rows, [40, 80, 70])

    paragraph(pdf,
        "Demand share = soma_dos_seus_scores / soma_dos_scores_de_todas_as_lojas. "
        "Sua fatia x demanda do mercado = unidades alocadas para sua loja por categoria."
    )

    callout(pdf, "EXEMPLO RAPIDO",
        "Em uma rodada com 2 lojas: voce tira 4+3+4=11 e o concorrente tira 1+2+1=4. "
        "Total=15. Sua fatia = 11/15 = 73%. Se a demanda de Mercearia for 3000 un, voce recebe "
        "~2190 un de demanda (limitada pelo seu estoque).",
        color=SUCCESS)


def sec_strategy(pdf):
    section_title(pdf, "08", "DICAS ESTRATEGICAS")

    subtitle(pdf, "Antes de configurar")
    bullet(pdf, "Leia o feedback da rodada anterior. O sistema gera alertas automaticos.")
    bullet(pdf, "Verifique seu estoque atual: o que sobrou nao some, mas vira quebra/aging na proxima rodada se nao for vendido.")
    bullet(pdf, "Olhe o ranking: que loja esta vencendo em qual criterio?")

    subtitle(pdf, "Margem")
    bullet(pdf, "Margem = 0 e suicidio: preco de venda = custo, e os impostos derrubam o lucro.")
    bullet(pdf, "Margem alta demais reduz competitividade no criterio Preco da cesta. Voce ganha por unidade mas perde mercado.")
    bullet(pdf, "Categorias de imposto alto (Eletro 25%) precisam de margem proporcionalmente maior.")

    subtitle(pdf, "Estoque")
    bullet(pdf, "Estoque alto = score de disponibilidade alto, mas tambem = mais quebra e aging se nao vender.")
    bullet(pdf, "Pereciveis tem 7,83% de perda combinada (quebra + aging) sobre o que sobra. Cuidado.")
    bullet(pdf, "Eletro tem 0% de quebra mas 1,33% de aging. Estoque parado vira ainda assim.")

    subtitle(pdf, "Operadores e CAPEX")
    bullet(pdf, "Cortar caixas economiza folha mas reduz CSAT proporcionalmente.")
    bullet(pdf, "Self Checkout adiciona PDVs com licenca menor mas custa R$ 80k.")
    bullet(pdf, "Balanca/Freezer paga R$ 75k mas elimina manutencao (R$ 400/mes economia).")

    subtitle(pdf, "Capital")
    bullet(pdf, "Estoque planejado x preco de compra = saida principal. Some com CAPEX.")
    bullet(pdf, "Se passar de R$ 700k, juros de 12% no excedente. Pode anular o lucro da rodada.")


def sec_results(pdf):
    section_title(pdf, "09", "VISUALIZANDO OS RESULTADOS")

    subtitle(pdf, "Tela de Resultados (PLAYER)")
    bullet(pdf, "DRE completo da SUA loja: cada linha do calculo financeiro.")
    bullet(pdf, "Detalhamento por categoria: quanto vendeu, quanto sobrou, receita, custo.")
    bullet(pdf, "Feedback automatico: alertas sobre prejuizo, margem baixa, estoque limitado, etc.")

    subtitle(pdf, "Tela de Ranking (todos)")
    bullet(pdf, "Lista de lojas ordenadas por EBITDA (maior primeiro).")
    bullet(pdf, "Demand share de cada loja.")
    bullet(pdf, "Margem EBITDA (% sobre receita liquida).")

    subtitle(pdf, "Tela do GAME MASTER")
    bullet(pdf, "Visao global de todas as lojas, scores de cada criterio competitivo.")
    bullet(pdf, "Pode resetar ou deletar rodadas em ambiente de teste.")
    bullet(pdf, "Acompanha quem ja submeteu configuracao e quem ainda falta.")


def sec_glossary(pdf):
    section_title(pdf, "10", "GLOSSARIO RAPIDO")
    headers = ["Termo", "Significado"]
    rows = [
        ("DRE",          "Demonstracao do Resultado do Exercicio (relatorio financeiro)."),
        ("EBITDA",       "Lucro antes de juros, impostos, depreciacao e amortizacao."),
        ("CAPEX",        "Investimento de capital - gasto unico em ativo/melhoria."),
        ("Margem",       "Percentual de lucro sobre o custo de compra."),
        ("Quebra",       "Perda fisica de produto (estrago, roubo, dano)."),
        ("Aging",        "Perda por validade vencida ou produto envelhecido."),
        ("Mix",          "Variedade de produtos disponiveis no mercado."),
        ("CSAT",         "Customer Satisfaction - indice de satisfacao do cliente."),
        ("SLA",          "Service Level Agreement - dias para resolver incidente."),
        ("Demand Share", "Fatia da demanda do mercado capturada pela loja."),
        ("Squad",        "Equipe de jogadores que administra uma loja em conjunto."),
        ("PDV",          "Ponto de Venda (caixa registradora ou self-checkout)."),
    ]
    table(pdf, headers, rows, [40, 150])


def sec_troubleshoot(pdf):
    section_title(pdf, "11", "PROBLEMAS COMUNS")

    subtitle(pdf, "Nao consigo enviar a configuracao")
    bullet(pdf, "Verifique se voce e o LIDER da squad. Apenas lideres submetem.")
    bullet(pdf, "Verifique se a rodada esta OPEN e o timer ainda nao expirou.")
    bullet(pdf, "Cada loja envia UMA vez por rodada. Se ja foi enviado, nao da pra editar.")

    subtitle(pdf, "Meu DRE deu zero")
    bullet(pdf, "Se grossRevenue = 0, voce nao tinha estoque ou nao recebeu demanda do mercado.")
    bullet(pdf, "Confira: voce comprou estoque na rodada anterior? Sua demanda foi muito baixa por causa de precos altos?")

    subtitle(pdf, "Prejuizo persistente")
    bullet(pdf, "Custos > Receita Liquida = margem comercial muito baixa. Aumente a margem.")
    bullet(pdf, "Despesas operacionais (folha + licencas) consumindo o lucro? Reveja operadores.")
    bullet(pdf, "Estoque excessivo virando quebra/aging? Compre menos.")

    callout(pdf, "AO DUVIDAR",
        "Use o Preview do DRE (POST /simulation/preview) antes de submeter. Ele simula o "
        "calculo SEM salvar, permitindo ajustar margens e volumes ate atingir um EBITDA "
        "satisfatorio.",
        color=SUCCESS)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    pdf = Tutorial(orientation="P", unit="mm", format="A4")
    pdf.set_margins(10, 15, 10)
    pdf.set_auto_page_break(auto=True, margin=15)
    add_fonts(pdf)

    cover(pdf)
    pdf.add_page()
    pdf.set_font("ArialUni", "B", 18)
    pdf.set_text_color(*PRIMARY)
    pdf.cell(0, 12, "Sumario", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_text_color(*TEXT)
    pdf.set_font("ArialUni", "", 11)
    toc = [
        "01  Visao Geral",
        "02  Acessando o Sistema",
        "03  Categorias de Produto",
        "04  Fluxo de uma Rodada",
        "05  Configurando sua Rodada",
        "06  Como e Calculado o DRE",
        "07  Mercado e Demand Share",
        "08  Dicas Estrategicas",
        "09  Visualizando os Resultados",
        "10  Glossario Rapido",
        "11  Problemas Comuns",
    ]
    for entry in toc:
        pdf.cell(0, 7, entry, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    sec_overview(pdf)
    sec_login(pdf)
    sec_categories(pdf)
    sec_round_flow(pdf)
    sec_configure(pdf)
    sec_dre(pdf)
    sec_demand(pdf)
    sec_strategy(pdf)
    sec_results(pdf)
    sec_glossary(pdf)
    sec_troubleshoot(pdf)

    pdf.output(OUTPUT_PATH)
    print(f"PDF gerado: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
