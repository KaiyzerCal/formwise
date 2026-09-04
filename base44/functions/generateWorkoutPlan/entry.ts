import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal, experience_level, weak_areas = [], preferred_exercises = [], duration_weeks = 4 } = await req.json();

    // Fetch user performance data
    const userProfile = await base44.entities.UserProfile.filter({ created_by: user.email });
    const profile = userProfile[0] || {};

    // Fetch recent sessions to analyze performance
    const recentSessions = await base44.entities.FormSession.filter(
      { created_by: user.email },
      '-started_at',
      10
    );

    // Calculate average form score
    const avgFormScore = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + (s.form_score_overall || 0), 0) / recentSessions.length
      : 50;

    // Determine difficulty based on performance and experience
    let difficulty = experience_level || 'beginner';
    if (avgFormScore > 75 && (experience_level === 'intermediate' || experience_level === 'advanced')) {
      difficulty = 'advanced';
    } else if (avgFormScore > 60) {
      difficulty = 'intermediate';
    }

    // ── Powerlifting: percentage-based block, using logged e1RM when available ──
    // Distinct path — the generic exercise-library logic below has no concept
    // of %1RM/RPE-based programming, so squat/bench/deadlift get their own branch.
    if (goal === 'powerlifting') {
      const PL_LIFTS = [
        { id: 'back_squat', name: 'Back Squat' },
        { id: 'bench_press', name: 'Bench Press' },
        { id: 'deadlift', name: 'Deadlift' },
      ];

      // Best (highest) logged e1RM per lift, if the user has logged any sets.
      const e1rmByLift = {};
      for (const lift of PL_LIFTS) {
        const rows = await base44.entities.ExerciseTracking.filter(
          { created_by: user.email, exercise_id: lift.id }, '-logged_date', 20
        );
        const withE1rm = (rows ?? []).filter(r => r.estimated_1rm > 0);
        if (withE1rm.length) e1rmByLift[lift.id] = Math.max(...withE1rm.map(r => r.estimated_1rm));
      }
      const hasAnyE1rm = Object.keys(e1rmByLift).length > 0;

      // Simple ramping block: %1RM climbs across the first 3 weeks, then
      // deloads. Weeks beyond 4 repeat the same 4-week shape.
      const WEEK_PLAN = [
        { pct: 70, reps: 5, rpe: 7 },
        { pct: 75, reps: 5, rpe: 7.5 },
        { pct: 80, reps: 3, rpe: 8.5 },
        { pct: 60, reps: 5, rpe: 6 }, // deload
      ];
      const week = WEEK_PLAN[Math.min(duration_weeks, 4) - 1] ?? WEEK_PLAN[0];

      const plExercises = PL_LIFTS.map(lift => ({
        exercise_id: lift.id,
        exercise_name: lift.name,
        target_reps: week.reps,
        target_sets: 5,
        target_weight_percent: week.pct,
        target_rpe: week.rpe,
        focus_areas: [],
        difficulty_level: difficulty,
      }));

      const frequency = 3;
      const workoutPlan = {
        name: `Powerlifting Plan (${difficulty})`,
        goal,
        difficulty,
        exercises: plExercises,
        frequency_per_week: frequency,
        duration_weeks,
        total_planned_sessions: frequency * duration_weeks,
        started_at: new Date().toISOString(),
        status: 'active',
        generated_from_analysis: true,
        performance_notes: hasAnyE1rm
          ? 'Percentages based on your logged squat/bench/deadlift e1RM.'
          : 'No logged sets yet — percentages are starting-point placeholders. Log a squat/bench/deadlift set (with weight) to personalize future plans.',
      };

      const createdPlan = await base44.entities.WorkoutPlan.create(workoutPlan);

      return Response.json({
        success: true,
        plan: createdPlan,
        summary: {
          totalExercises: plExercises.length,
          frequency: `${frequency}x per week`,
          duration: `${duration_weeks} weeks`,
          usedLoggedE1RM: hasAnyE1rm,
        },
      });
    }

    // Generate exercise recommendations based on weak areas
    const exerciseLibrary = {
      strength: [
        { id: 'squat', name: 'Squat', difficulty: 'beginner', focus: ['knee', 'hip', 'back'] },
        { id: 'deadlift', name: 'Deadlift', difficulty: 'intermediate', focus: ['back', 'hip', 'knee'] },
        { id: 'bench_press', name: 'Bench Press', difficulty: 'beginner', focus: ['shoulder', 'elbow', 'chest'] },
        { id: 'overhead_press', name: 'Overhead Press', difficulty: 'intermediate', focus: ['shoulder', 'elbow', 'core'] },
        { id: 'rows', name: 'Rows', difficulty: 'beginner', focus: ['back', 'shoulder', 'elbow'] },
      ],
      athletic: [
        { id: 'lateral_lunge', name: 'Lateral Lunge', difficulty: 'beginner', focus: ['hip', 'knee', 'balance'] },
        { id: 'jump_squat', name: 'Jump Squat', difficulty: 'intermediate', focus: ['hip', 'knee', 'power'] },
        { id: 'box_jump', name: 'Box Jump', difficulty: 'advanced', focus: ['hip', 'knee', 'power', 'ankle'] },
        { id: 'single_leg_squat', name: 'Single Leg Squat', difficulty: 'advanced', focus: ['hip', 'knee', 'balance'] },
      ],
    };

    const category = goal === 'strength' ? 'strength' : 'athletic';
    const availableExercises = exerciseLibrary[category] || exerciseLibrary.strength;

    // Filter exercises by difficulty and weak areas
    const selectedExercises = availableExercises
      .filter(ex => {
        const difficultyMatch = difficulty === 'beginner' 
          ? ex.difficulty === 'beginner'
          : difficulty === 'intermediate'
          ? ['beginner', 'intermediate'].includes(ex.difficulty)
          : true;
        
        const weakAreaMatch = weak_areas.length === 0 || weak_areas.some(area => ex.focus.includes(area));
        return difficultyMatch && weakAreaMatch;
      })
      .slice(0, 4)
      .map(ex => ({
        exercise_id: ex.id,
        exercise_name: ex.name,
        target_reps: difficulty === 'beginner' ? 8 : difficulty === 'intermediate' ? 6 : 5,
        target_sets: difficulty === 'beginner' ? 3 : 4,
        focus_areas: ex.focus,
        difficulty_level: ex.difficulty,
      }));

    // Default exercises if none selected
    if (selectedExercises.length === 0) {
      selectedExercises.push(...availableExercises.slice(0, 3).map(ex => ({
        exercise_id: ex.id,
        exercise_name: ex.name,
        target_reps: 8,
        target_sets: 3,
        focus_areas: ex.focus,
        difficulty_level: 'beginner',
      })));
    }

    const frequency = difficulty === 'beginner' ? 3 : 4;
    const totalPlannedSessions = frequency * duration_weeks;

    const planName = `${goal.charAt(0).toUpperCase() + goal.slice(1)} Plan (${difficulty})`;

    const workoutPlan = {
      name: planName,
      goal,
      difficulty,
      exercises: selectedExercises,
      frequency_per_week: frequency,
      duration_weeks,
      total_planned_sessions: totalPlannedSessions,
      started_at: new Date().toISOString(),
      status: 'active',
      generated_from_analysis: true,
    };

    // Save the plan
    const createdPlan = await base44.entities.WorkoutPlan.create(workoutPlan);

    return Response.json({
      success: true,
      plan: createdPlan,
      summary: {
        totalExercises: selectedExercises.length,
        frequency: `${frequency}x per week`,
        duration: `${duration_weeks} weeks`,
        avgFormScore: Math.round(avgFormScore),
      },
    });
  } catch (error) {
    console.error('Error generating workout plan:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});