from crud.admin import get_admin, get_admin_by_email, crear_admin, verificar_credenciales
from crud.jugadores import (
    get_jugador, get_jugador_by_cedula, get_jugadores, create_jugador, buscar_jugadores,
    get_estado_cuenta_jugador
)
from crud.multas import (
    get_multa, get_multas_jugador, crear_multa,
    get_causales_multa, crear_causal_multa
)
from crud.pagos import registrar_pago_combinado
from crud.egresos import (
    get_egreso, get_egresos, crear_egreso,
    get_categorias_egreso, crear_categoria_egreso,
    get_resumen_egresos
)
from crud.estado_cuenta import (
    calcular_estado_cuenta_equipo, obtener_egresos_por_categoria,
    obtener_resumen_financiero_mensual, obtener_saldo_actual
)
from crud.dashboard import obtener_resumen_dashboard, obtener_estadisticas_multas, obtener_ranking_jugadores_multas
