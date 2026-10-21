
import json

from app.db.database import get_connection


def save_inspection(result: dict):
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO inspections (
                id, url, status, title, findings_json, screenshots_json
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                result["inspection_id"],
                result["url"],
                result["status"],
                result.get("title", ""),
                json.dumps(result.get("findings", [])),
                json.dumps(result.get("screenshots", {})),
            ),
        )


def list_inspections():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, url, status, title, created_at
            FROM inspections
            ORDER BY created_at DESC, id DESC
            """
        ).fetchall()

        return [dict(row) for row in rows]


def get_inspection(inspection_id: str):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM inspections WHERE id = ?",
            (inspection_id,),
        ).fetchone()

        if row is None:
            return None

        result = dict(row)
        result["inspection_id"] = result.pop("id")
        result["findings"] = json.loads(result.pop("findings_json"))
        result["screenshots"] = json.loads(result.pop("screenshots_json"))

        return result
