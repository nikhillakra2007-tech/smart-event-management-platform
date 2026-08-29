import urllib.request
import json

# Test events endpoint
r = urllib.request.urlopen('http://127.0.0.1:8000/api/events')
data = json.loads(r.read().decode())
print(f'Events: {len(data)}')
for e in data:
    print(f'  - {e["name"]} ({e["status"]})')

# Test leaderboard
event_id = data[0]["id"]
r2 = urllib.request.urlopen(f'http://127.0.0.1:8000/api/events/{event_id}/leaderboard')
lb = json.loads(r2.read().decode())
print(f'\nLeaderboard ({len(lb)} entries):')
for entry in lb[:5]:
    print(f'  Rank {entry["rank"]}: {entry["team_name"]} — avg: {entry["average_score"]:.2f}')

# Test analytics
r3 = urllib.request.urlopen(f'http://127.0.0.1:8000/api/events/{event_id}/analytics')
analytics = json.loads(r3.read().decode())
print(f'\nAnalytics:')
print(f'  Registrations: {analytics["total_registrations"]}')
print(f'  Checked in: {analytics["checked_in_count"]} ({analytics["check_in_percentage"]}%)')
print(f'  Teams: {analytics["teams_formed"]}')
print(f'  Submissions: {analytics["submissions_count"]}')
print(f'  Avg score: {analytics["average_score"]}')

print('\nAll endpoints verified OK')
