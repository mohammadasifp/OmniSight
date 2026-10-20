
from pydantic import BaseModel, Field


class InspectionRequest(BaseModel):
    url: str
    viewports: list[str] = Field(
        default_factory=lambda: ["desktop", "tablet", "mobile"]
    )
