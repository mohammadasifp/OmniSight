
def calculate_consistency(results):
    devices = list(results.keys())

    if len(devices) < 2:
        return {
            "score": None,
            "message": "At least two devices are required"
        }

    device_issues = {}

    for device, result in results.items():
        data = result["data"]

        issues = set()

        if data["horizontalOverflow"]:
            issues.add("horizontal-overflow")

        if not data["title"]:
            issues.add("missing-title")

        for image in data["images"]:
            if image["alt"] is None:
                issues.add("missing-image-alt")

        device_issues[device] = issues

    # Compare issue patterns between device pairs
    similarities = []

    for i in range(len(devices)):
        for j in range(i + 1, len(devices)):
            first = device_issues[devices[i]]
            second = device_issues[devices[j]]

            union = first | second
            intersection = first & second

            similarity = (
                len(intersection) / len(union) * 100
                if union else 100
            )

            similarities.append(similarity)

    score = round(
        sum(similarities) / len(similarities)
    )

    # Issues occurring on multiple devices
    all_issues = set.union(*device_issues.values())

    repeated = [
        issue for issue in all_issues
        if sum(
            issue in device_issues[device]
            for device in devices
        ) >= 2
    ]

    common = [
        issue for issue in all_issues
        if all(
            issue in device_issues[device]
            for device in devices
        )
    ]

    return {
        "score": score,
        "commonIssues": common,
        "repeatedIssues": repeated,
        "deviceIssues": {
            device: sorted(issues)
            for device, issues in device_issues.items()
        }
    }
