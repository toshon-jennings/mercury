export default {
  title: "Office",
  checkingStatus: "Comprobando el estado de Claw3D...",
  setupTitle: "Configurar Claw3D",
  installTitle: "Configurando Claw3D",
  processLogs: "Registros del proceso",
  noLogs: "Todavía no hay registros. Inicia los servicios para ver la salida.",
  loadingClaw3d: "Cargando Claw3D...",
  installClaw3d: "Instalar Claw3D",
  setupFailed: "La configuración falló",
  startFailed: "No se pudo iniciar Claw3D",
  portInUse:
    "El puerto {{port}} está en uso. Cámbialo en la configuración para iniciar.",
  websocketUrl: "URL de WebSocket",
  viewOnGithub: "Ver en GitHub",
  waitingToStart: "Esperando para iniciar...",
  starting: "Iniciando...",
  openInBrowser: "Abrir en el navegador",
  viewLogs: "Ver registros",
  portInUseWarning:
    "El puerto {{port}} está en uso. Cambia el puerto en la configuración o detén otros procesos.",
  close: "Cerrar",
  cannotLoadClaw3d: "No se puede cargar Claw3D",
  startingClaw3dService: "Iniciando el servicio de Claw3D...",
  terminalAgentsTitle: "Agentes de terminal",
  terminalAgentsSubtitle:
    "Las sesiones activas de CLI aparecen aquí mientras Office está abierto.",
  terminalAgentsCount: "{{count}} activos",
  terminalAgentsUnavailable:
    "No se pueden cargar los agentes activos de la terminal ahora mismo.",
  terminalAgentLabel: "Agente CLI",
  terminalAgentUntitled: "Agente de terminal {{id}}",
  terminalAgentStatus: "Trabajando ahora",
  terminalAgentMessages: "{{count}} msgs",
  terminalAgentsEmpty: "Inicia una sesión de CLI y su agente aparecerá aquí.",
  clickToStart: 'Haz clic en "Iniciar" para ejecutar Claw3D',
  setupDesc1:
    "Claw3D es un entorno de visualización 3D para tus agentes de Mercury. Te permite ver a tus agentes trabajando en un espacio de oficina interactivo.",
  setupDesc2:
    "Haz clic abajo para descargar y configurar Claw3D automáticamente. Esto clonará el repositorio e instalará todas las dependencias.",
} as const;
