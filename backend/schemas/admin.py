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

class LoginRequest(BaseModel):
    email: str
    password: str

class RecuperarPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    token: str
    new_password: str
