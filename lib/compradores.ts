// Lista de compradores liberados para criar conta (planilha "LIBERAR TOKEN").
// Só quem está nesta lista consegue concluir o cadastro; os demais recebem o
// aviso de que ainda não adquiriram o produto.
//
// COMO LIBERAR UM NOVO COMPRADOR:
//   1. escreva o e-mail da compra em uma linha nova dentro do bloco abaixo;
//   2. salve e faça o deploy (git push).
//
// Maiúsculas, minúsculas e espaços sobrando não importam. O texto depois de
// "#" é comentário e é ignorado — use para anotar o nome do comprador.

const LISTA_DE_COMPRADORES = `
ricardolonog@yahoo.com.br            # Ricardo Lobo Nogueira
elisinveste38@gmail.com              # Elisangela Maria de Araujo Silva
israeljustino7@gmail.com             # Rael Just
silvana.zibetti@gmail.com            # Silvana Zibetti
luizaserra8@gmail.com                # Maria Luiza Cardoso Rangel Serra
decorsul.vp@gmail.com                # Carlos Eduardo Rodrigues da Silva
afittipaldijr@gmail.com              # Americo Fittipaldi Jr
pmfobras@yahoo.com.br                # Antonio Adelmo Nunes
keythmlk@gmail.com                   # Keyth Maciel
wanselmo@gmail.com                   # Wagner Anselmo
marcelomgbi@hotmail.com              # Marcelo Monteiro Moreira
rodrigoavelar86@yahoo.com.br         # Rodrigo de Avelar Silva
grsgs2010@gmail.com                  # Gleybson Rafael Shelton Goncalves de Santana
jailson.joaci@gmail.com              # Jailson Joaci dos Santos
leninhaborges10@hotmail.com          # Juscilene Borges dos Santos Ferreira
joseadrianochaves@gmail.com          # Jose Adriano Chaves
rafael_fsoares@hotmail.com           # Rafael Fernando Soares
samuelromera00@gmail.com             # Samuel Renato
lc.gaudius@gmail.com                 # Luiz Carlos da Silva
ivanlopessevero000@gmail.com         # Ivan Lopes Severo
pastoreltonsilva@gmail.com           # Elton Marques da Silva
neiltonf426@gmail.com                # Neilton de Souza Ferreira
viniciusmariotte@gmail.com           # Vinicius Mariotti
line.godoy2025@gmail.com             # Aline Ferreira de Godoy
sandroespindola050@gmail.com         # Sandro Espindola Torres Barbosa
pimentaaugusto@gmail.com             # Augusto Suzart Pimenta Neto
reginaaraujo723@gmail.com            # Regina Socorro Cardoso de Araujo
pauloandrepimentelaraujo@gmail.com   # Paulo Andre Pimentel Araujo
hiagodealmeida@hotmail.com
gms1961scaranello@gmsil.com
ivair.quaresma@gmail.com
marquinhosg8@yahoo.com.br
idanewk@gmail.com
`

/** Normaliza um e-mail para comparação: sem espaços e tudo em minúsculo. */
function normalize(email: string): string {
  return email.trim().toLowerCase()
}

/** E-mails liberados, já normalizados. Montado uma única vez no carregamento. */
const COMPRADORES: ReadonlySet<string> = new Set(
  LISTA_DE_COMPRADORES.split("\n")
    .map((linha) => normalize(linha.split("#")[0]))
    .filter((linha) => linha.length > 0),
)

/** Verdadeiro se o e-mail consta na lista de compradores. */
export function isComprador(email: string): boolean {
  return COMPRADORES.has(normalize(email))
}

/** Quantidade de compradores liberados. */
export function totalCompradores(): number {
  return COMPRADORES.size
}

/** E-mails liberados, já normalizados. Útil para conferência e testes. */
export function listaCompradores(): string[] {
  return Array.from(COMPRADORES)
}
