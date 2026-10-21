
import logging
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
