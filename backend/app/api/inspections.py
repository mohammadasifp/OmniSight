
import logging
from fastapi import HTTPException
from app.db.database import initialize_database
from app.services.history import (
    save_inspection,
    list_inspections,
    get_inspection,
)
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import HttpUrl, TypeAdapter
from starlette.concurrency import run_in_threadpool

from app.schemas.inspection import InspectionRequest
from app.services.browser import inspect_website_sync

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/inspections", tags=["Inspections"])
url_adapter = TypeAdapter(HttpUrl)


@router.post("")
async def create_inspection(request: InspectionRequest):
    try:
        parsed_url = url_adapter.validate_python(request.url)
        url = str(parsed_url)
        inspection_id = str(uuid4())

        result = await run_in_threadpool(
            inspect_website_sync,
            url,
            inspection_id,
        )

        initialize_database()
        save_inspection(result)
        return result

    except Exception as exc:
        logger.exception("OmniSight inspection failed")
        error_message = str(exc).strip() or repr(exc)

        raise HTTPException(
            status_code=500,
            detail=(
                f"Inspection failed: {type(exc).__name__}: "
                f"{error_message}"
            ),
        ) from exc

@router.get("")
def get_inspection_history():
    initialize_database()
    return list_inspections()


@router.get("/{inspection_id}")
def get_inspection_details(inspection_id: str):
    initialize_database()

    result = get_inspection(inspection_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Inspection not found",
        )

    return result
