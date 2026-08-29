"""
Seed script — populates the smart_event database with realistic demo data.

Safe to rerun: clears existing data before inserting.

Usage:
    cd backend
    python scripts/seed.py
"""

import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Ensure app is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.core.database import Base
import app.models  # register all models

from app.models.event import Event
from app.models.user import User, ParticipantProfile
from app.models.registration import Registration, CheckIn
from app.models.team import Team, TeamMember
from app.models.submission import Submission
from app.models.judging import (
    JudgeAssignment,
    Rubric,
    RubricCriteria,
    Evaluation,
    EvaluationScore,
)
from app.models.announcement import Announcement, AnnouncementView


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def uid() -> uuid.UUID:
    return uuid.uuid4()


def qr_token() -> str:
    return f"QR-{uuid.uuid4().hex.upper()}"


def reg_num(event_id: uuid.UUID, seq: int) -> str:
    short = str(event_id).split("-")[0].upper()
    return f"REG-{short}-{seq:04d}"


NOW = datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Data definitions
# ---------------------------------------------------------------------------

ORGANIZER = {
    "id": uuid.UUID("00000000-0000-0000-0000-000000000001"),
    "name": "Alex Rivera",
    "email": "alex.rivera@techhive.com",
    "role": "organizer",
}

JUDGES = [
    {"id": uuid.UUID(f"00000000-0000-0000-0000-00000000{i:04d}"), "name": name, "email": email, "role": "judge"}
    for i, (name, email) in enumerate([
        ("Dr. Priya Sharma", "priya.sharma@judgehive.ai"),
        ("Marcus Chen", "marcus.chen@evaluate.io"),
        ("Dr. Fatima Al-Hassan", "fatima.hassan@techeval.com"),
        ("James Okafor", "james.okafor@judge.tech"),
        ("Dr. Sofia Petrov", "sofia.petrov@assess.ai"),
    ], start=10)
]

PARTICIPANTS = [
    {
        "id": uuid.UUID(f"10000000-0000-0000-0000-{i:012d}"),
        "name": name,
        "email": email,
        "role": "participant",
        "skills": skills,
        "preferred_roles": roles,
        "project_interests": interests,
        "bio": bio,
    }
    for i, (name, email, skills, roles, interests, bio) in enumerate([
        ("Arjun Mehta", "arjun.mehta@dev.io", ["Python", "FastAPI", "PostgreSQL"], ["Backend Developer", "API Designer"], ["HealthTech", "EdTech"], "Full-stack dev who loves building APIs."),
        ("Preethi Nair", "preethi.nair@dev.io", ["React", "TypeScript", "CSS"], ["Frontend Developer", "UI Designer"], ["EdTech", "FinTech"], "React specialist with an eye for design."),
        ("Liam Torres", "liam.torres@dev.io", ["Python", "ML", "TensorFlow"], ["ML Engineer", "Data Scientist"], ["HealthTech", "AgriTech"], "ML researcher focused on applied AI."),
        ("Mei Ling", "mei.ling@dev.io", ["Go", "Kubernetes", "Docker"], ["DevOps Engineer", "Backend Developer"], ["FinTech", "Cybersecurity"], "Cloud-native infrastructure enthusiast."),
        ("Omar Abdullah", "omar.abdullah@dev.io", ["Solidity", "Ethereum", "Web3"], ["Blockchain Developer"], ["FinTech", "Governance"], "Web3 developer building decentralized apps."),
        ("Kavya Reddy", "kavya.reddy@dev.io", ["React", "Node.js", "MongoDB"], ["Full Stack Developer"], ["EdTech", "Social Impact"], "Passionate about education technology."),
        ("Tomás García", "tomas.garcia@dev.io", ["C++", "Embedded Systems", "IoT"], ["Hardware Engineer", "Firmware Developer"], ["AgriTech", "SmartCity"], "IoT specialist building edge devices."),
        ("Zara Khan", "zara.khan@dev.io", ["Python", "Data Analysis", "Tableau"], ["Data Analyst", "Data Scientist"], ["HealthTech", "FinTech"], "Data storyteller with a public health background."),
        ("Noah Williams", "noah.williams@dev.io", ["React Native", "Flutter", "Firebase"], ["Mobile Developer"], ["EdTech", "Social Impact"], "Cross-platform mobile dev."),
        ("Ananya Singh", "ananya.singh@dev.io", ["Python", "FastAPI", "AWS"], ["Backend Developer", "Cloud Engineer"], ["FinTech", "Cybersecurity"], "Security-focused backend engineer."),
        ("Ethan Brown", "ethan.brown@dev.io", ["Vue.js", "Django", "PostgreSQL"], ["Full Stack Developer", "API Designer"], ["Social Impact", "Governance"], "Open source contributor."),
        ("Yuki Tanaka", "yuki.tanaka@dev.io", ["Swift", "iOS", "Firebase"], ["Mobile Developer", "UI Designer"], ["HealthTech", "AgriTech"], "iOS dev building health apps."),
        ("Carlos Lima", "carlos.lima@dev.io", ["Python", "NLP", "spaCy"], ["ML Engineer", "Backend Developer"], ["EdTech", "Governance"], "NLP researcher building smart text tools."),
        ("Aisha Diallo", "aisha.diallo@dev.io", ["React", "GraphQL", "Node.js"], ["Frontend Developer", "API Designer"], ["Social Impact", "HealthTech"], "GraphQL evangelist."),
        ("Sven Eriksson", "sven.eriksson@dev.io", ["Rust", "WebAssembly", "Performance"], ["Systems Developer"], ["Cybersecurity", "FinTech"], "Systems programmer obsessed with performance."),
        ("Lin Feng", "lin.feng@dev.io", ["Python", "FastAPI", "Redis"], ["Backend Developer", "DevOps Engineer"], ["FinTech", "SmartCity"], "Distributed systems builder."),
        ("Isabela Costa", "isabela.costa@dev.io", ["Figma", "React", "CSS"], ["UI Designer", "Frontend Developer"], ["EdTech", "Social Impact"], "UX designer who codes."),
        ("Kiran Patel", "kiran.patel@dev.io", ["Go", "gRPC", "Microservices"], ["Backend Developer", "API Designer"], ["HealthTech", "Governance"], "Microservices architect."),
        ("Samuel Osei", "samuel.osei@dev.io", ["Python", "Django", "PostgreSQL"], ["Full Stack Developer", "Backend Developer"], ["AgriTech", "Social Impact"], "Agricultural tech enthusiast."),
        ("Emma Wilson", "emma.wilson@dev.io", ["Kotlin", "Android", "Firebase"], ["Mobile Developer"], ["SmartCity", "Social Impact"], "Android developer focused on accessibility."),
        ("Riya Bose", "riya.bose@dev.io", ["Python", "Computer Vision", "OpenCV"], ["ML Engineer"], ["HealthTech", "AgriTech"], "Computer vision researcher."),
        ("Diego Santos", "diego.santos@dev.io", ["JavaScript", "Three.js", "WebGL"], ["Frontend Developer", "UI Designer"], ["EdTech", "Social Impact"], "3D web experiences creator."),
        ("Nia Johnson", "nia.johnson@dev.io", ["Python", "Pandas", "SQL"], ["Data Analyst", "Backend Developer"], ["FinTech", "Governance"], "Data pipeline engineer."),
        ("Hyun-ji Park", "hyunji.park@dev.io", ["React", "Redux", "TypeScript"], ["Frontend Developer"], ["HealthTech", "EdTech"], "State management expert."),
        ("Alex Petrov", "alex.petrov@dev.io", ["C#", ".NET", "Azure"], ["Backend Developer", "Cloud Engineer"], ["FinTech", "Cybersecurity"], ".NET cloud developer."),
        ("Amara Diagne", "amara.diagne@dev.io", ["Python", "FastAPI", "Docker"], ["Backend Developer", "DevOps Engineer"], ["Social Impact", "Governance"], "Containerization advocate."),
        ("Felix Müller", "felix.muller@dev.io", ["Java", "Spring Boot", "Kafka"], ["Backend Developer", "API Designer"], ["FinTech", "SmartCity"], "Event-driven architecture enthusiast."),
        ("Priya Krishnan", "priya.krishnan@dev.io", ["Python", "Data Science", "R"], ["Data Scientist", "ML Engineer"], ["HealthTech", "AgriTech"], "Bioinformatics data scientist."),
        ("Jake Thompson", "jake.thompson@dev.io", ["React", "Node.js", "AWS"], ["Full Stack Developer", "Cloud Engineer"], ["Social Impact", "EdTech"], "Serverless computing enthusiast."),
        ("Mia Laurent", "mia.laurent@dev.io", ["Figma", "CSS", "React"], ["UI Designer", "Frontend Developer"], ["SmartCity", "HealthTech"], "Design systems advocate."),
        ("Raj Malhotra", "raj.malhotra@dev.io", ["Python", "FastAPI", "Elasticsearch"], ["Backend Developer", "Data Engineer"], ["FinTech", "EdTech"], "Search engineer."),
        ("Chioma Eze", "chioma.eze@dev.io", ["Vue.js", "Python", "PostgreSQL"], ["Full Stack Developer"], ["Social Impact", "AgriTech"], "African tech ecosystem builder."),
        ("Ben Walsh", "ben.walsh@dev.io", ["Go", "gRPC", "Prometheus"], ["Backend Developer", "DevOps Engineer"], ["Cybersecurity", "FinTech"], "Observability tooling expert."),
        ("Tanisha Patel", "tanisha.patel@dev.io", ["Swift", "ARKit", "iOS"], ["Mobile Developer", "UI Designer"], ["EdTech", "HealthTech"], "AR/VR mobile developer."),
        ("Liu Yang", "liu.yang@dev.io", ["Python", "PyTorch", "Transformers"], ["ML Engineer", "Data Scientist"], ["HealthTech", "Governance"], "LLM fine-tuning researcher."),
        ("Eva Novak", "eva.novak@dev.io", ["React", "TypeScript", "D3.js"], ["Frontend Developer", "Data Analyst"], ["FinTech", "SmartCity"], "Data visualization specialist."),
        ("Marcus Davis", "marcus.davis@dev.io", ["Node.js", "GraphQL", "MongoDB"], ["Backend Developer", "API Designer"], ["Social Impact", "EdTech"], "API-first developer."),
        ("Shreya Gupta", "shreya.gupta@dev.io", ["Python", "Scikit-learn", "SQL"], ["Data Scientist", "Backend Developer"], ["AgriTech", "HealthTech"], "Predictive modeling expert."),
        ("Andile Dlamini", "andile.dlamini@dev.io", ["React", "Python", "PostgreSQL"], ["Full Stack Developer"], ["Governance", "Social Impact"], "Civic tech developer."),
        ("Yuna Kim", "yuna.kim@dev.io", ["Kotlin", "Spring Boot", "AWS"], ["Backend Developer", "Cloud Engineer"], ["FinTech", "Cybersecurity"], "Cloud-native Java/Kotlin dev."),
    ], start=1)
]

TEAMS = [
    {"name": "Code Crafters", "project_interest": "HealthTech", "member_indices": [0, 1, 7, 11]},
    {"name": "Tech Titans", "project_interest": "FinTech", "member_indices": [3, 9, 14, 22]},
    {"name": "Innovators Hub", "project_interest": "EdTech", "member_indices": [5, 8, 16, 21]},
    {"name": "Binary Builders", "project_interest": "AgriTech", "member_indices": [6, 18, 27, 37]},
    {"name": "Neural Ninjas", "project_interest": "HealthTech", "member_indices": [2, 20, 27, 34]},  # Note: overlap handled by seed
    {"name": "Debug Dynasty", "project_interest": "Cybersecurity", "member_indices": [4, 24, 32, 39]},
    {"name": "Pixel Pirates", "project_interest": "SmartCity", "member_indices": [15, 19, 29, 35]},
    {"name": "Data Dynamos", "project_interest": "FinTech", "member_indices": [12, 23, 28, 36]},
    {"name": "Cloud Crusaders", "project_interest": "Governance", "member_indices": [10, 25, 33, 38]},
    {"name": "Stack Surgeons", "project_interest": "Social Impact", "member_indices": [13, 17, 30, 31]},
]

SUBMISSIONS = [
    {"team_index": 0, "title": "MediTrack", "description": "AI-assisted patient intake and triage system.", "repo": "https://github.com/codecrafters/meditrack"},
    {"team_index": 1, "title": "FintechFlow", "description": "Real-time cross-border payment reconciliation dashboard.", "repo": "https://github.com/techtitans/fintechflow"},
    {"team_index": 2, "title": "EduBridge", "description": "Adaptive learning platform for underserved communities.", "repo": "https://github.com/innovatorshub/edubridge"},
    {"team_index": 3, "title": "HarvestAI", "description": "Crop disease detection using computer vision.", "repo": "https://github.com/binarybuilders/harvestai"},
    {"team_index": 4, "title": "NeuroScan", "description": "EEG-based cognitive load monitoring for students.", "repo": "https://github.com/neuralninja/neuroscan"},
    {"team_index": 5, "title": "CipherShield", "description": "Zero-trust network access management platform.", "repo": "https://github.com/debugdynasty/ciphershield"},
    {"team_index": 6, "title": "UrbanPulse", "description": "Real-time smart city traffic and utility analytics.", "repo": "https://github.com/pixelpirates/urbanpulse"},
    {"team_index": 7, "title": "TradeLens", "description": "Alternative data signals for retail investor dashboards.", "repo": "https://github.com/datadynamos/tradelens"},
    {"team_index": 8, "title": "CivicVoice", "description": "Transparent government budget tracking and visualization.", "repo": "https://github.com/cloudcrusaders/civicvoice"},
    {"team_index": 9, "title": "ImpactMap", "description": "NGO project impact measurement and reporting tool.", "repo": "https://github.com/stacksurgeons/impactmap"},
]

RUBRIC_CRITERIA = [
    {"name": "Innovation", "description": "Novelty and creative approach to the problem.", "max_score": 25.0, "weight": 1.5, "sort_order": 0},
    {"name": "Technical Implementation", "description": "Code quality, architecture, and technical depth.", "max_score": 30.0, "weight": 2.0, "sort_order": 1},
    {"name": "Impact", "description": "Potential real-world impact and scalability.", "max_score": 25.0, "weight": 1.5, "sort_order": 2},
    {"name": "Presentation", "description": "Clarity of demo, slides, and communication.", "max_score": 20.0, "weight": 1.0, "sort_order": 3},
]

# Scores per judge per submission [innovation, tech_impl, impact, presentation]
# Each judge evaluates 2-3 submissions
EVALUATION_SCORES_MATRIX = {
    # (judge_index, team_index): [innovation_score, tech_score, impact_score, presentation_score]
    (0, 0): [22, 27, 23, 18],  # MediTrack — good all-round
    (0, 1): [18, 25, 20, 15],  # FintechFlow
    (1, 2): [20, 28, 21, 17],  # EduBridge
    (1, 3): [23, 24, 22, 19],  # HarvestAI — solid
    (2, 4): [24, 29, 24, 18],  # NeuroScan — high tech
    (2, 5): [21, 26, 20, 17],  # CipherShield
    (3, 6): [19, 23, 22, 16],  # UrbanPulse
    (3, 7): [22, 27, 23, 18],  # TradeLens
    (4, 8): [20, 25, 21, 17],  # CivicVoice
    (4, 9): [18, 22, 20, 15],  # ImpactMap
    # Cross-evaluations for more data points
    (0, 4): [23, 28, 22, 19],  # Judge 0 also evaluates NeuroScan
    (1, 6): [20, 24, 21, 16],  # Judge 1 also evaluates UrbanPulse
    (2, 8): [19, 24, 20, 17],  # Judge 2 also evaluates CivicVoice
}

ANNOUNCEMENTS = [
    {"title": "Welcome to HackHive 2026!", "message": "We're thrilled to kick off HackHive 2026! 46 participants, 5 expert judges, and 36 hours of hacking ahead. Good luck to all teams!", "type": "general"},
    {"title": "Opening Ceremony — Hall A", "message": "The opening ceremony begins at 9:00 AM in Hall A. Please be seated by 8:50 AM.", "type": "schedule"},
    {"title": "Team Formation Deadline Extended", "message": "Team formation deadline extended to 11:00 PM tonight. Use the Team Discovery feature to find teammates!", "type": "schedule"},
    {"title": "Venue Change — Workshop Room B → C", "message": "The Machine Learning workshop has moved to Room C (Level 2). Room B is under maintenance.", "type": "venue"},
    {"title": "Submission Deadline Approaching", "message": "REMINDER: Project submissions close at 2:00 PM tomorrow. Submit your GitHub repo and demo link now!", "type": "critical"},
    {"title": "Lunch Break", "message": "Lunch is served in the main cafeteria. Dietary options available for all registered preferences.", "type": "general"},
    {"title": "Judging Schedule Released", "message": "Judging slots have been assigned. Check your dashboard for your team's presentation time.", "type": "schedule"},
    {"title": "WiFi Credentials", "message": "Network: HackHive-2026 | Password: Hack2026! | Report connectivity issues to the help desk.", "type": "venue"},
]


# ---------------------------------------------------------------------------
# Seed function
# ---------------------------------------------------------------------------

def clear_data(db: Session) -> None:
    """Clear all data in reverse dependency order."""
    print("  Clearing existing data...")
    db.query(AnnouncementView).delete()
    db.query(Announcement).delete()
    db.query(EvaluationScore).delete()
    db.query(Evaluation).delete()
    db.query(JudgeAssignment).delete()
    db.query(RubricCriteria).delete()
    db.query(Rubric).delete()
    db.query(Submission).delete()
    db.query(TeamMember).delete()
    db.query(Team).delete()
    db.query(CheckIn).delete()
    db.query(Registration).delete()
    db.query(ParticipantProfile).delete()
    db.query(User).delete()
    db.query(Event).delete()
    db.commit()
    print("  ✓ Data cleared")


def seed(db: Session) -> None:
    print("\n=== Seeding Smart Event Management Platform ===\n")

    # --- Event ---
    print("Creating event...")
    event_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000001")
    event = Event(
        id=event_id,
        name="HackHive 2026",
        description=(
            "HackHive 2026 is a 36-hour hackathon bringing together 46 developers, designers "
            "and data scientists to build solutions across HealthTech, FinTech, EdTech, "
            "AgriTech, SmartCity, Governance and Social Impact."
        ),
        venue="Tech Innovation Centre, Tower A, Bengaluru",
        start_time=datetime(2026, 9, 15, 9, 0, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 9, 16, 21, 0, 0, tzinfo=timezone.utc),
        status="active",
    )
    db.add(event)
    db.flush()
    print(f"  ✓ Event: {event.name} ({event.id})")

    # --- Organizer ---
    print("Creating organizer...")
    organizer = User(**ORGANIZER)
    db.add(organizer)
    db.flush()
    print(f"  ✓ Organizer: {organizer.name}")

    # --- Judges ---
    print("Creating judges...")
    judge_objects = []
    for j in JUDGES:
        judge = User(**j)
        db.add(judge)
        judge_objects.append(judge)
    db.flush()
    print(f"  ✓ Judges: {len(judge_objects)}")

    # --- Participants ---
    print("Creating participants and profiles...")
    participant_objects = []
    for p_data in PARTICIPANTS:
        skills = p_data.pop("skills")
        roles = p_data.pop("preferred_roles")
        interests = p_data.pop("project_interests")
        bio = p_data.pop("bio")

        user = User(**p_data)
        db.add(user)
        db.flush()

        profile = ParticipantProfile(
            user_id=user.id,
            skills=skills,
            preferred_roles=roles,
            project_interests=interests,
            bio=bio,
        )
        db.add(profile)
        participant_objects.append(user)
        # Restore for team creation
        p_data["skills"] = skills
        p_data["preferred_roles"] = roles
        p_data["project_interests"] = interests
        p_data["bio"] = bio

    db.flush()
    print(f"  ✓ Participants: {len(participant_objects)}")

    # --- Registrations ---
    print("Creating registrations...")
    registration_objects = []
    for i, participant in enumerate(participant_objects, start=1):
        reg = Registration(
            event_id=event_id,
            user_id=participant.id,
            registration_number=reg_num(event_id, i),
            qr_token=qr_token(),
            registration_status="confirmed",
            registered_at=NOW - timedelta(days=7, hours=i % 12),
        )
        db.add(reg)
        registration_objects.append(reg)
    db.flush()
    print(f"  ✓ Registrations: {len(registration_objects)}")

    # --- Check-ins (~30 out of 40) ---
    print("Creating check-ins...")
    checkin_count = 0
    for i, reg in enumerate(registration_objects[:30]):  # first 30 checked in
        ci = CheckIn(
            registration_id=reg.id,
            checked_in_by=organizer.id,
            status="active",
            checked_in_at=NOW - timedelta(hours=24 - (i % 8)),
        )
        db.add(ci)
        checkin_count += 1
    db.flush()
    print(f"  ✓ Check-ins: {checkin_count}")

    # --- Teams (deduplicate member assignments) ---
    print("Creating teams and memberships...")
    team_objects = []
    assigned_participants: set[int] = set()

    for t_data in TEAMS:
        team = Team(
            event_id=event_id,
            name=t_data["name"],
            project_interest=t_data["project_interest"],
            status="submitted",
        )
        db.add(team)
        db.flush()
        team_objects.append(team)

        members_added = 0
        for idx in t_data["member_indices"]:
            if idx in assigned_participants or idx >= len(participant_objects):
                continue
            member = TeamMember(
                team_id=team.id,
                user_id=participant_objects[idx].id,
                role="Member",
            )
            db.add(member)
            assigned_participants.add(idx)
            members_added += 1

        # Mark team leader for first assigned member
        if members_added > 0:
            first_idx = next(i for i in t_data["member_indices"] if i not in assigned_participants - {t_data["member_indices"][0]})

    db.flush()
    print(f"  ✓ Teams: {len(team_objects)}")

    # --- Submissions ---
    print("Creating submissions...")
    submission_objects = []
    for s_data in SUBMISSIONS:
        team = team_objects[s_data["team_index"]]
        sub = Submission(
            event_id=event_id,
            team_id=team.id,
            title=s_data["title"],
            description=s_data["description"],
            repository_url=s_data["repo"],
            demo_url=f"https://demo.hackhive.io/{s_data['title'].lower().replace(' ', '-')}",
            status="submitted",
            submitted_at=NOW - timedelta(hours=4),
        )
        db.add(sub)
        submission_objects.append(sub)
    db.flush()
    print(f"  ✓ Submissions: {len(submission_objects)}")

    # --- Rubric ---
    print("Creating rubric and criteria...")
    rubric = Rubric(
        event_id=event_id,
        name="HackHive 2026 Standard Rubric",
        description="Official judging rubric for HackHive 2026. Evaluates Innovation, Technical depth, Impact, and Presentation.",
    )
    db.add(rubric)
    db.flush()

    criteria_objects = []
    for c_data in RUBRIC_CRITERIA:
        criterion = RubricCriteria(rubric_id=rubric.id, **c_data)
        db.add(criterion)
        criteria_objects.append(criterion)
    db.flush()
    print(f"  ✓ Rubric: '{rubric.name}' with {len(criteria_objects)} criteria")

    # --- Judge Assignments ---
    print("Creating judge assignments...")
    assignment_objects = {}
    for (judge_idx, team_idx), _ in EVALUATION_SCORES_MATRIX.items():
        judge = judge_objects[judge_idx]
        sub = submission_objects[team_idx]
        key = (judge.id, sub.id)
        if key not in assignment_objects:
            assignment = JudgeAssignment(judge_id=judge.id, submission_id=sub.id)
            db.add(assignment)
            assignment_objects[key] = assignment
    db.flush()
    print(f"  ✓ Judge assignments: {len(assignment_objects)}")

    # --- Evaluations ---
    print("Creating evaluations and scores...")
    eval_count = 0
    for (judge_idx, team_idx), scores in EVALUATION_SCORES_MATRIX.items():
        judge = judge_objects[judge_idx]
        sub = submission_objects[team_idx]

        # Calculate weighted total
        total_weight = sum(c.weight for c in criteria_objects)
        total_score = sum(
            (scores[i] / criteria_objects[i].max_score) * criteria_objects[i].weight * 100
            for i in range(len(scores))
        ) / total_weight

        evaluation = Evaluation(
            submission_id=sub.id,
            judge_id=judge.id,
            feedback=(
                f"Strong submission from team. "
                f"Innovation score: {scores[0]}/{criteria_objects[0].max_score}. "
                f"Technical depth was impressive. "
                f"Overall well-presented project."
            ),
            total_score=round(total_score, 4),
            status="submitted",
            submitted_at=NOW - timedelta(hours=2, minutes=judge_idx * 17),
        )
        db.add(evaluation)
        db.flush()

        for i, criterion in enumerate(criteria_objects):
            ev_score = EvaluationScore(
                evaluation_id=evaluation.id,
                criterion_id=criterion.id,
                score=scores[i],
            )
            db.add(ev_score)

        eval_count += 1
    db.flush()
    print(f"  ✓ Evaluations: {eval_count}")

    # --- Announcements ---
    print("Creating announcements...")
    ann_objects = []
    for i, ann_data in enumerate(ANNOUNCEMENTS):
        ann = Announcement(
            event_id=event_id,
            title=ann_data["title"],
            message=ann_data["message"],
            type=ann_data["type"],
            created_by=organizer.id,
            is_published=True,
            created_at=NOW - timedelta(hours=36 - i * 3),
        )
        db.add(ann)
        ann_objects.append(ann)
    db.flush()
    print(f"  ✓ Announcements: {len(ann_objects)}")

    # --- Announcement Views ---
    print("Creating announcement views...")
    view_count = 0
    for ann in ann_objects:
        viewers = participant_objects[: min(15 + ann_objects.index(ann) * 2, 40)]
        for viewer in viewers:
            view = AnnouncementView(
                announcement_id=ann.id,
                user_id=viewer.id,
                viewed_at=NOW - timedelta(hours=1, minutes=view_count % 60),
            )
            db.add(view)
            view_count += 1
    db.flush()
    print(f"  ✓ Announcement views: {view_count}")

    db.commit()
    print("\n=== ✅ Seed complete ===")
    print(f"  Event:         {event.name}")
    print(f"  Organizer:     1")
    print(f"  Judges:        {len(judge_objects)}")
    print(f"  Participants:  {len(participant_objects)}")
    print(f"  Registrations: {len(registration_objects)}")
    print(f"  Check-ins:     {checkin_count}")
    print(f"  Teams:         {len(team_objects)}")
    print(f"  Submissions:   {len(submission_objects)}")
    print(f"  Evaluations:   {eval_count}")
    print(f"  Announcements: {len(ann_objects)}")
    print(f"  Views:         {view_count}")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        clear_data(db)
        seed(db)
    except Exception as e:
        print(f"\n❌ Seed failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()
