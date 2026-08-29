"""
End-to-end Flow Verification Script for Smart Event Management Platform.
Simulates all user journeys across Organizer, Participant, and Judge roles.
"""

import json
import urllib.request
import urllib.parse
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def http_get(endpoint):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def http_post(endpoint, data):
    url = f"{BASE_URL}{endpoint}"
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def run_tests():
    print("\n========================================================")
    print("  RUNNING COMPLETE END-TO-END FLOW VERIFICATION")
    print("========================================================\n")

    # 1. Events Check
    status, events = http_get("/events")
    assert status == 200 and len(events) > 0, "Failed to get events"
    event_id = events[0]["id"]
    event_name = events[0]["name"]
    print(f"✓ 1. Event Loaded: '{event_name}' ({event_id})")

    # 2. Users Check
    status, users = http_get("/users")
    assert status == 200 and len(users) == 46, f"Expected 46 users, got {len(users)}"
    organizers = [u for u in users if u["role"] == "organizer"]
    judges = [u for u in users if u["role"] == "judge"]
    participants = [u for u in users if u["role"] == "participant"]
    print(f"✓ 2. Users Loaded: {len(organizers)} Organizers, {len(judges)} Judges, {len(participants)} Participants")

    # 3. Organizer Analytics
    status, analytics = http_get(f"/events/{event_id}/analytics")
    assert status == 200, "Failed to get analytics"
    print(f"✓ 3. Organizer Analytics:")
    print(f"     - Total Registrations: {analytics['total_registrations']}")
    print(f"     - Checked In: {analytics['checked_in_count']} ({analytics['check_in_percentage']}%)")
    print(f"     - Teams Formed: {analytics['teams_formed']}")
    print(f"     - Submissions: {analytics['submissions_count']}")
    print(f"     - Evaluated: {analytics['evaluated_submissions']}")
    print(f"     - Avg Score: {analytics['average_score']:.2f}")

    # 4. Live Leaderboard
    status, leaderboard = http_get(f"/events/{event_id}/leaderboard")
    assert status == 200 and len(leaderboard) > 0, "Failed to get leaderboard"
    print(f"✓ 4. Live Leaderboard ({len(leaderboard)} ranked teams):")
    for entry in leaderboard[:3]:
        print(f"     #{entry['rank']} {entry['team_name']} — Avg: {entry['average_score']:.2f} ({entry['evaluation_count']} reviews)")

    # 5. Participant Flow (Registrations & QR Tokens)
    p_user = participants[0]
    status, registrations = http_get(f"/events/{event_id}/registrations")
    assert status == 200, "Failed to get registrations"
    p_reg = next(r for r in registrations if r["user_id"] == p_user["id"])
    print(f"✓ 5. Participant Pass Verified:")
    print(f"     - User: {p_user['name']} ({p_user['email']})")
    print(f"     - Reg Number: {p_reg['registration_number']}")
    print(f"     - QR Token: {p_reg['qr_token'][:18]}...")

    # 6. Rule-based Teammate Discovery
    status, matches = http_get(f"/events/{event_id}/team-discovery/{p_user['id']}")
    assert status == 200 and len(matches) > 0, "Failed teammate discovery"
    top_match = matches[0]
    print(f"✓ 6. Teammate Discovery Match:")
    print(f"     - Candidate: {top_match['name']} ({top_match['match_score']}% match)")
    print(f"     - Matching Skills: {top_match['matching_skills']}")
    print(f"     - Shared Interests: {top_match['matching_interests']}")
    print(f"     - Compatible Roles: {top_match['compatible_roles']}")

    # 7. Judge Flow (Assignments & Rubric)
    judge_user = judges[0]
    status, assignments = http_get(f"/judges/{judge_user['id']}/assignments")
    assert status == 200 and len(assignments) > 0, "Failed judge assignments"
    target_submission_id = assignments[0]["submission_id"]
    status, rubric = http_get(f"/submissions/{target_submission_id}/rubric")
    assert status == 200 and len(rubric["criteria"]) > 0, "Failed submission rubric"
    print(f"✓ 7. Judge Flow:")
    print(f"     - Judge: {judge_user['name']}")
    print(f"     - Assigned Submissions: {len(assignments)}")
    print(f"     - Rubric: '{rubric['name']}' with {len(rubric['criteria'])} weighted criteria")

    # 8. Announcements Feed & View Recording
    status, published_ann = http_get(f"/events/{event_id}/announcements")
    assert status == 200 and len(published_ann) > 0, "Failed published announcements"
    target_ann = published_ann[0]
    status, view_res = http_post(f"/announcements/{target_ann['id']}/view", {"user_id": p_user["id"]})
    assert status == 201, "Failed announcement view recording"
    print(f"✓ 8. Broadcast Feed: {len(published_ann)} active announcements. View recorded successfully.")

    print("\n========================================================")
    print("  ✅ ALL 8 USER JOURNEYS & CONTRACTS VERIFIED 100% OK")
    print("========================================================\n")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
