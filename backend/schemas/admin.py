from pydantic import BaseModel

class AdministradorBase(BaseModel):
    nombre: str
    email: str
    rol: str

class AdministradorCreate(AdministradorBase):
    password: str

class Administrador(AdministradorBase):
    id: int

    class Config:
        from_attributes = True
