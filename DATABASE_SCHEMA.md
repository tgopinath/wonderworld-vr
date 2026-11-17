# Data model & database schema

## Today (MVP): local demo mode
All data lives in one versioned JSON document in `localStorage` under `wonderworld:v1`
(`src/persistence/localRepository.ts`). `normalize()` fills missing fields so older/partial saves never crash.
Only the newest 2,000 attempts are kept. Shape (`AppData` in `src/persistence/repository.ts`):

```ts
{
  version: 1,
  profiles: ChildProfile[],                // { id, nickname, ageGroup, avatarId, preferences, createdAt }
  activeProfileId: string | null,
  progress: { [profileId]: { [activity]: ActivityProgress } }, // level, streaks, rounds, correctRounds, mistakes, bestStars
  attempts: ActivityAttempt[],             // one per completed round
  rewards: { [profileId]: RewardState },   // stars, coins, badges[], daily, streak, medals
  learningTimeMs: { [profileId]: number },
  settings: Settings,                      // audio + VR comfort
  parent: ParentSettings                   // pinHash, salt, sessionLimitMin, breakReminderMin, levelLocks
}
```

No child email, birthday, real name, photo, location or device identifier is ever stored.

## Phase 5 (planned, not implemented): PostgreSQL
The `Repository` interface will get an `ApiRepository` backed by a Node API. Proposed schema (spec §16), with
UUID keys and `ON DELETE CASCADE` from parent → child → progress so deleting an account removes everything.

```sql
CREATE TABLE parent (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  text NOT NULL,
  email         citext UNIQUE NOT NULL,          -- parents only; children never have emails
  password_hash text NOT NULL,                   -- argon2id
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE child_profile (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid NOT NULL REFERENCES parent(id) ON DELETE CASCADE,
  nickname   varchar(20) NOT NULL,
  age_group  text NOT NULL CHECK (age_group IN ('little','adventurer','master')),
  avatar_id  text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON child_profile(parent_id);

CREATE TABLE learning_world (
  id text PRIMARY KEY,                -- 'math', 'geography', ...
  title text NOT NULL, description text NOT NULL, difficulty text NOT NULL
);

CREATE TABLE activity (
  id text PRIMARY KEY,                -- 'counting', 'addition', ...
  world_id text NOT NULL REFERENCES learning_world(id),
  title text NOT NULL,
  activity_type text NOT NULL,
  configuration jsonb NOT NULL,       -- the same data as src/config/activities.ts
  difficulty int NOT NULL DEFAULT 1
);

CREATE TABLE activity_attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid NOT NULL REFERENCES child_profile(id) ON DELETE CASCADE,
  activity_id text NOT NULL REFERENCES activity(id),
  level int NOT NULL,
  score int NOT NULL,                 -- stars 1..3
  correct_answers int NOT NULL,
  incorrect_answers int NOT NULL,
  hints_used int NOT NULL DEFAULT 0,
  duration_ms int NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON activity_attempt(child_profile_id, completed_at DESC);

CREATE TABLE progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid NOT NULL REFERENCES child_profile(id) ON DELETE CASCADE,
  world_id text NOT NULL REFERENCES learning_world(id),
  activity_id text REFERENCES activity(id),
  current_level int NOT NULL,
  streak_correct int NOT NULL DEFAULT 0,
  streak_incorrect int NOT NULL DEFAULT 0,
  completion_percentage int NOT NULL DEFAULT 0,
  UNIQUE (child_profile_id, world_id, activity_id)
);

CREATE TABLE achievement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid NOT NULL REFERENCES child_profile(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_profile_id, achievement_type)
);
```

Access rule for every child-data endpoint: `child_profile.parent_id = session.parent_id`, enforced in the API and
backed by row-level security policies. Retention: attempts older than 24 months are deleted by a scheduled job;
account deletion is immediate and complete.
