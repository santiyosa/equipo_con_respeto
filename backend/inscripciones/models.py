from sqlalchemy import Column, ForeignKey, Integer, String, Date, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base

class Inscripcion(Base):
    __tablename__ = "inscripciones"

    id = Column(Integer, primary_key=True, index=True)
    fecha_partido = Column(Date, nullable=False)  # Fecha para la que se inscribe
    jugador_cedula = Column(String, ForeignKey("jugadores.cedula"), nullable=True)  # Puede ser null si el jugador no está registrado
    nombre_inscrito = Column(String, nullable=False)  # El nombre/alias usado en la inscripción
    fecha_inscripcion = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    orden_inscripcion = Column(Integer, nullable=False)  # Para mantener el orden de inscripción
    mensaje_whatsapp = Column(Text, nullable=True)  # Para guardar el mensaje original de WhatsApp

    # Relaciones
    jugador = relationship("Jugador", backref="inscripciones")
