// Cliente server-side da API da MyBroker.
// Roda apenas nas route handlers (app/api/*), nunca no browser — assim a
// chamada à corretora é same-origin para o front e evita problemas de CORS.

const BROKER_BASE = "https://broker-api.mybrokerdev.com"

// Partner Code exigido pela API da MyBroker em toda chamada autenticada.
const PARTNER_CODE = "asafe"

interface BrokerForwardOptions {
  method?: "GET" | "POST"
  body?: string
}

/**
 * Encaminha uma requisição para a API da corretora e devolve a resposta
 * preservando status e corpo. Centraliza headers de autenticação.
 */
export async function forwardToBroker(
  path: string,
  apiKey: string,
  options: BrokerForwardOptions = {},
): Promise<Response> {
  if (!apiKey) {
    return Response.json({ statusCode: 401, message: "Chave API ausente" }, { status: 401 })
  }

  const headers: Record<string, string> = {
    "api-token": apiKey,
    "x-timestamp": Date.now().toString(),
    "x-partner": PARTNER_CODE,
  }

  if (options.method === "POST") {
    headers["Content-Type"] = "application/json"
  }

  try {
    const upstream = await fetch(`${BROKER_BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body,
      cache: "no-store",
    })

    const text = await upstream.text()
    const contentType = upstream.headers.get("content-type") ?? "application/json"

    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": contentType },
    })
  } catch (error) {
    console.error("Falha ao contatar a corretora:", error)
    return Response.json(
      { statusCode: 502, message: "Não foi possível contatar a corretora" },
      { status: 502 },
    )
  }
}
