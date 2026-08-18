"use client"

import { usePush } from "@/lib/usePush"
import { BellIcon, CheckIcon, AlertIcon, DownloadIcon } from "@/components/icons"

/**
 * Controle das notificações push do painel. Mostra o motivo quando não dá para
 * ativar, em vez de simplesmente esconder o botão.
 */
export function PushCard() {
  const { state, instalado, ativar, desativar, erro } = usePush()

  const iosSemInstalar = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent) && !instalado

  return (
    <div className="card pad a-push">
      <div className="a-sec-head">
        <span className="a-sec-ic">
          <BellIcon size={17} />
        </span>
        <div>
          <h3 className="disp-title">Notificações</h3>
          <p className="a-chart-sub">Avisos de novo comprador, novo cadastro e marcos</p>
        </div>
        {state === "ligado" && (
          <span className="a-tag on" style={{ marginLeft: "auto" }}>
            ativas
          </span>
        )}
      </div>

      {state === "carregando" && <p className="a-chart-empty">Verificando...</p>}

      {state === "desligado" && (
        <>
          <button className="btn btn-accent btn-block" onClick={ativar} type="button">
            <BellIcon size={17} /> Ativar neste aparelho
          </button>
          {iosSemInstalar && (
            <p className="a-note">
              No iPhone, o push só funciona com o painel instalado: abra no Safari, toque em Compartilhar e escolha
              &quot;Adicionar à Tela de Início&quot;. Depois abra pelo ícone e ative aqui.
            </p>
          )}
        </>
      )}

      {state === "ligado" && (
        <>
          <p className="a-push-ok">
            <CheckIcon size={15} /> Este aparelho recebe os avisos.
          </p>
          <button className="btn btn-ghost btn-block" onClick={desativar} type="button">
            Desativar neste aparelho
          </button>
        </>
      )}

      {state === "negado" && (
        <p className="a-note a-note-warn">
          <AlertIcon size={15} /> As notificações estão bloqueadas para este site. Libere nas permissões do navegador e
          recarregue a página.
        </p>
      )}

      {state === "sem-servidor" && (
        <p className="a-note a-note-warn">
          <AlertIcon size={15} /> Faltam as chaves VAPID no servidor. Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY e
          VAPID_PRIVATE_KEY nas variáveis de ambiente.
        </p>
      )}

      {state === "indisponivel" && (
        <p className="a-note a-note-warn">
          <AlertIcon size={15} /> Este navegador não suporta notificações push.
        </p>
      )}

      {erro && (
        <p className="a-note a-note-warn">
          <AlertIcon size={15} /> {erro}
        </p>
      )}

      {!instalado && state !== "indisponivel" && (
        <p className="a-note">
          <DownloadIcon size={13} /> Dá para instalar o painel na tela inicial do celular e usar como aplicativo.
        </p>
      )}
    </div>
  )
}
