; VukaPay - Custom NSIS Installer Hooks
; Estes macros s?o executados em momentos espec?ficos da instala??o/desinstala??o.
;
; NSIS_HOOK_POSTINSTALL  ? chamado ap?s o instalador copiar todos os ficheiros,
;                         definir as chaves de registo e criar os atalhos padr?o.
;
; NSIS_HOOK_POSTUNINSTALL ? chamado ap?s o desinstalador remover todos os ficheiros,
;                          chaves de registo e atalhos padr?o.

; --- INSTALA??O: Cria atalho no Ambiente de Trabalho ---
!macro NSIS_HOOK_POSTINSTALL
  ; Cria atalho do VukaPay no Ambiente de Trabalho do utilizador actual
  CreateShortCut "$DESKTOP\VukaPay.lnk" "$INSTDIR\VukaPay.exe" \
    "" "$INSTDIR\VukaPay.exe" 0 SW_SHOWNORMAL \
    "" "VukaPay - Controle Financeiro Pessoal"
!macroend

; --- DESINSTALA??O: Remove atalho do Ambiente de Trabalho ---
!macro NSIS_HOOK_POSTUNINSTALL
  ; Remove o atalho criado durante a instala??o
  Delete "$DESKTOP\VukaPay.lnk"
!macroend
