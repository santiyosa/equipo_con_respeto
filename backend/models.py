from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, DateTime, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base

class Administrador(Base):
    __tablename__ = "administradores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    rol = Column(String, nullable=False)

class Jugador(Base):
    __tablename__ = "jugadores"

    cedula = Column(String, primary_key=True, index=True, comment="Cédula de ciudadanía como identificador único")
    nombre = Column(String, nullable=False)
    nombre_inscripcion = Column(String, unique=True, nullable=False, comment="Nombre o alias que usa el jugador para inscribirse")
    telefono = Column(String, unique=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    talla_uniforme = Column(String, nullable=False)  # S, M, L, XL, etc.
    numero_camiseta = Column(Integer, unique=True)
    contacto_emergencia_nombre = Column(String, nullable=False)
    contacto_emergencia_telefono = Column(String, nullable=False)
    # Campo opcional: solo se llena si el jugador fue recomendado por otro jugador
    recomendado_por_cedula = Column(String, ForeignKey("jugadores.cedula"), nullable=True, comment="Cédula del jugador que recomendó (opcional)")
    fecha_inscripcion = Column(Date, nullable=False, server_default=func.current_date())
    posicion = Column(String, nullable=True, comment="Posición del jugador: 'arquero' para porteros, NULL o vacío para jugadores de campo")
    estado_cuenta = Column(Boolean, default=True, comment="Estado financiero del jugador")
    activo = Column(Boolean, default=True, comment="Indica si el jugador está activo en el equipo")
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    mensualidades = relationship("Mensualidad", back_populates="jugador")
    multas = relationship("Multa", back_populates="jugador")
    recomendado_por = relationship("Jugador", remote_side=[cedula], backref="recomendados")

class Mensualidad(Base):
    __tablename__ = "mensualidades"

    id = Column(Integer, primary_key=True, index=True)
    jugador_cedula = Column(String, ForeignKey("jugadores.cedula"))
    mes = Column(Integer, nullable=False)
    ano = Column(Integer, nullable=False)
    valor = Column(Float, nullable=False)
    fecha_pago = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    registrado_por = Column(Integer, ForeignKey("administradores.id"))

    jugador = relationship("Jugador", back_populates="mensualidades")

class CausalMulta(Base):
    __tablename__ = "causales_multa"

    id = Column(Integer, primary_key=True, index=True)
    descripcion = Column(Text, nullable=False)
    valor = Column(Float, nullable=False)

    multas = relationship("Multa", back_populates="causal")

class Multa(Base):
    __tablename__ = "multas"

    id = Column(Integer, primary_key=True, index=True)
    jugador_cedula = Column(String, ForeignKey("jugadores.cedula"))
    causal_id = Column(Integer, ForeignKey("causales_multa.id"))
    fecha_multa = Column(Date, nullable=False, server_default=func.current_date())
    pagada = Column(Boolean, default=False)
    fecha_pago = Column(DateTime)
    registrado_por = Column(Integer, ForeignKey("administradores.id"))
    # Campos para multas grupales/aportes
    es_aporte_grupal = Column(Boolean, default=False, comment="Indica si es un aporte que se asigna a todo el equipo")
    grupo_multa_id = Column(String, nullable=True, comment="ID único para agrupar multas del mismo aporte grupal")
    concepto_aporte = Column(String, nullable=True, comment="Descripción específica del aporte grupal")

    jugador = relationship("Jugador", back_populates="multas")
    causal = relationship("CausalMulta", back_populates="multas")

class CategoriaEgreso(Base):
    __tablename__ = "categorias_egreso"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False, unique=True)  # "Equipamiento", "Implementos", "Aportes Sociales", etc.
    descripcion = Column(Text, nullable=True)

    egresos = relationship("Egreso", back_populates="categoria")

class Egreso(Base):
    __tablename__ = "egresos"

    id = Column(Integer, primary_key=True, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias_egreso.id"), nullable=False)
    concepto = Column(String, nullable=False)  # Descripción específica del gasto
    valor = Column(Float, nullable=False)
    fecha = Column(DateTime, nullable=False, default=func.current_timestamp())
    comprobante = Column(String, nullable=True)  # Número de factura o recibo
    notas = Column(Text, nullable=True)
    registrado_por = Column(Integer, ForeignKey("administradores.id"))

    categoria = relationship("CategoriaEgreso", back_populates="egresos")

class OtroAporte(Base):
    __tablename__ = "otros_aportes"

    id = Column(Integer, primary_key=True, index=True)
    jugador_cedula = Column(String, ForeignKey("jugadores.cedula"))
    concepto = Column(String, nullable=False)  # Nombre/descripción del aporte
    valor = Column(Float, nullable=False)
    fecha_aporte = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    registrado_por = Column(Integer, ForeignKey("administradores.id"))

    jugador = relationship("Jugador", backref="otros_aportes")

class Configuracion(Base):
    __tablename__ = "configuraciones"

    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(100), nullable=False, unique=True)
    valor = Column(Float, nullable=False)
    descripcion = Column(Text, nullable=True)
    actualizado_en = Column(DateTime, server_default=func.current_timestamp())
    actualizado_por = Column(Integer, ForeignKey("administradores.id"))


