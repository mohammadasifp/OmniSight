
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl, Field

from app.services.analyzers.runner import (
    run_website_analysis,
    DEVICES
)

router = APIRouter(
    prefix="/api/analysis",
    tags=["Website Analysis"]
)


class AnalysisRequest(BaseModel):
    url: HttpUrl

    devices: list[str] = Field(
        default_factory=lambda: [
            "desktop",
            "tablet",
            "mobile"
        ],
        min_length=1
    )


@router.post("/run")
async def analyze_website(request: AnalysisRequest):

    selected_devices = list(dict.fromkeys(request.devices))

    invalid_devices = [
        device for device in selected_devices
        if device not in DEVICES
    ]

    if invalid_devices:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid devices: {invalid_devices}"
        )

    try:
        result = await run_website_analysis(
            str(request.url),
            selected_devices
        )

        return result

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Website analysis failed: {str(error)}"
        )
