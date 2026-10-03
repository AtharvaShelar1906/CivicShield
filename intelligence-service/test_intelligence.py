import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:8000"

results = []

def record(test_num, name, passed, details=None):
    results.append({"test": test_num, "name": name, "passed": passed, "details": details})
    icon = "[PASS]" if passed else "[FAIL]"
    print(f"{icon} [Test {test_num}] {name}")
    if details:
        print(f"   Details: {json.dumps(details, default=str)}")

def post_json(endpoint, payload):
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed

def get_json(endpoint):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed

def run():
    print("=====================================================")
    print("  PHASE 5: INTELLIGENCE SERVICE TEST SUITE           ")
    print("=====================================================\n")

    # 1. Road/Infrastructure complaint
    code, data = post_json("/analyze", {
        "title": "Massive pothole and broken asphalt near metro bridge",
        "description": "Vehicle wheels getting damaged on the main road lane. Road surface caving in severely."
    })
    is_road = data.get("predictedCategory") == "Roads & Transport Infrastructure"
    record(1, "Road/infrastructure complaint classification", code == 200 and is_road, {
        "predictedCategory": data.get("predictedCategory"),
        "confidence": data.get("categoryConfidence")
    })

    # 2. Water complaint
    code, data = post_json("/analyze", {
        "title": "Drinking water pipeline ruptured and contaminated",
        "description": "Dirty brown tap water with terrible sewage foul smell flooding the residential lane for three days."
    })
    is_water = data.get("predictedCategory") == "Water Supply & Sanitation"
    record(2, "Water complaint classification", code == 200 and is_water, {
        "predictedCategory": data.get("predictedCategory"),
        "confidence": data.get("categoryConfidence")
    })

    # 3. Waste complaint
    code, data = post_json("/analyze", {
        "title": "Overflowing garbage dump and rotting trash on street",
        "description": "Municipal waste collection truck has not visited for a week. Stray dogs scattering rotten garbage."
    })
    is_waste = data.get("predictedCategory") == "Waste Management & Cleanliness"
    record(3, "Waste complaint classification", code == 200 and is_waste, {
        "predictedCategory": data.get("predictedCategory"),
        "confidence": data.get("categoryConfidence")
    })

    # 4. Electricity complaint
    code, data = post_json("/analyze", {
        "title": "Power transformer sparking with exposed electrical wires",
        "description": "High-voltage distribution box dangling low with bare wires near residential entrance causing sparks."
    })
    is_elec = data.get("predictedCategory") == "Electricity & Power Distribution"
    record(4, "Electricity complaint classification", code == 200 and is_elec, {
        "predictedCategory": data.get("predictedCategory"),
        "confidence": data.get("categoryConfidence")
    })

    # 5. Public-safety complaint
    code, data = post_json("/analyze", {
        "title": "Aggressive pack of stray dogs attacking commuters",
        "description": "Stray dogs biting children and bikers along pedestrian pathway near public park."
    })
    is_safety = data.get("predictedCategory") == "Public Safety & Civic Nuisance"
    record(5, "Public-safety complaint classification", code == 200 and is_safety, {
        "predictedCategory": data.get("predictedCategory"),
        "confidence": data.get("categoryConfidence")
    })

    # 6. High-severity complaint
    code, data = post_json("/analyze", {
        "title": "Deadly electrical explosion and live wire electrocution hazard near primary school",
        "description": "Transformer on fire with severe risk of fatal casualties and complete blackout for thousands of residents."
    })
    high_sev = data.get("severityScore", 0) >= 0.80 and data.get("predictedPriority") in ["HIGH", "CRITICAL"]
    record(6, "High-severity and critical priority estimation", code == 200 and high_sev, {
        "severityScore": data.get("severityScore"),
        "predictedPriority": data.get("predictedPriority")
    })

    # 7. Low-severity complaint
    code, data = post_json("/analyze", {
        "title": "Small street name board slightly tilted",
        "description": "The neighborhood street name indicator board is slightly bent after minor breeze."
    })
    low_sev = data.get("severityScore", 1.0) <= 0.35 and data.get("predictedPriority") in ["LOW", "MEDIUM"]
    record(7, "Low-severity and low priority estimation", code == 200 and low_sev, {
        "severityScore": data.get("severityScore"),
        "predictedPriority": data.get("predictedPriority")
    })

    # 8. Similar complaints (duplicate detection)
    code, data = post_json("/analyze", {
        "title": "No municipal water supply in Sector 4",
        "description": "Our residential taps have had no drinking water supply for three consecutive days.",
        "existingGrievances": [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "title": "No water supply in Sector 4",
                "description": "Drinking water supply has completely stopped in Sector 4 residential colony for three days."
            }
        ]
    })
    sims = data.get("similarities", [])
    has_dup = len(sims) > 0 and sims[0]["similarityScore"] >= 0.60 and sims[0]["isPotentialDuplicate"] is True
    record(8, "Similar complaints detection (cosine similarity & potential duplicate flag)", code == 200 and has_dup, {
        "topSimilarityScore": sims[0]["similarityScore"] if sims else None,
        "isPotentialDuplicate": sims[0]["isPotentialDuplicate"] if sims else None
    })

    # 9. Clearly different complaints
    code, data = post_json("/analyze", {
        "title": "Loud music playing after midnight",
        "description": "Commercial marriage hall playing blaring loudspeakers past permissible hours.",
        "existingGrievances": [
            {
                "id": "22222222-2222-2222-2222-222222222222",
                "title": "Drinking water pipeline leak",
                "description": "Clean municipal water pipe ruptured and pouring onto dirt road."
            }
        ]
    })
    sims = data.get("similarities", [])
    diff_ok = len(sims) > 0 and sims[0]["similarityScore"] < 0.35 and sims[0]["isPotentialDuplicate"] is False
    record(9, "Clearly different complaints detection (low similarity score, duplicate false)", code == 200 and diff_ok, {
        "similarityScore": sims[0]["similarityScore"] if sims else None,
        "isPotentialDuplicate": sims[0]["isPotentialDuplicate"] if sims else None
    })

    # 10. Anomaly/spam-like complaint
    code, data = post_json("/analyze", {
        "title": "CLAIM CASH PRIZE LOTTERY 50000 IMMEDIATELY",
        "description": "Congratulations you won cash prize lottery urgent notice call 9999999999 to claim free reward money voucher now."
    })
    is_anom = data.get("isAnomalous") is True and data.get("anomalyReason") is not None
    record(10, "Anomaly / commercial spam detection", code == 200 and is_anom, {
        "isAnomalous": data.get("isAnomalous"),
        "anomalyReason": data.get("anomalyReason")
    })

    # 11. Malformed request (Pydantic validation check)
    code, data = post_json("/analyze", {
        "title": "",  # Invalid: min_length=2
        "description": "Too"  # Invalid: min_length=5
    })
    malformed_ok = code == 422
    record(11, "Malformed request rejection (Pydantic HTTP 422 Unprocessable Entity)", malformed_ok, {
        "httpStatus": code,
        "validationErrorType": data.get("detail", [{}])[0].get("type") if isinstance(data.get("detail"), list) else None
    })

    # 12. Health endpoint
    code, data = get_json("/health")
    health_ok = code == 200 and data.get("status") == "ok" and "version" in data
    record(12, "Health endpoint check (HTTP 200 OK)", health_ok, {
        "status": data.get("status"),
        "service": data.get("service"),
        "version": data.get("version")
    })

    print("\n=====================================================")
    all_passed = all(r["passed"] for r in results)
    passed_count = sum(1 for r in results if r["passed"])
    print(f"TOTAL TESTS: {len(results)} | PASSED: {passed_count} | FAILED: {len(results) - passed_count}")
    print(f"FINAL RESULT: {'ALL TESTS PASSED [OK]' if all_passed else 'FAILURES DETECTED [ERROR]'}")
    print("=====================================================")

    if not all_passed:
        sys.exit(1)

if __name__ == "__main__":
    run()
