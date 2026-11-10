
from app.services.analyzers.consistency import (
    calculate_consistency
)


def test_consistency_all_devices_same():

    results = {
        "desktop": {
            "data": {
                "title": "Example",
                "horizontalOverflow": False,
                "images": []
            }
        },
        "tablet": {
            "data": {
                "title": "Example",
                "horizontalOverflow": False,
                "images": []
            }
        },
        "mobile": {
            "data": {
                "title": "Example",
                "horizontalOverflow": False,
                "images": []
            }
        }
    }

    result = calculate_consistency(results)

    assert result["score"] == 100
    assert result["commonIssues"] == []


def test_consistency_different_devices():

    results = {
        "desktop": {
            "data": {
                "title": "Example",
                "horizontalOverflow": False,
                "images": []
            }
        },
        "mobile": {
            "data": {
                "title": "Example",
                "horizontalOverflow": True,
                "images": []
            }
        }
    }

    result = calculate_consistency(results)

    assert result["score"] == 0
    assert "horizontal-overflow" in result["repeatedIssues"] or (
        "horizontal-overflow" in
        result["deviceIssues"]["mobile"]
    )


def test_consistency_requires_two_devices():

    result = calculate_consistency({
        "desktop": {
            "data": {
                "title": "Example",
                "horizontalOverflow": False,
                "images": []
            }
        }
    })

    assert result["score"] is None
