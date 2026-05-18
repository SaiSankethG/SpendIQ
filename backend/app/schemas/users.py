from pydantic import BaseModel


class UserRead(BaseModel):
    id: str
    email: str
    name: str | None
    avatar_url: str | None
    default_bank: str

    model_config = {"from_attributes": True}

