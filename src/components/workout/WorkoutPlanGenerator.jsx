import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Zap, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function WorkoutPlanGenerator() {
  const [goal, setGoal] = useState('strength');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [duration, setDuration] = useState('4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await base44.functions.invoke('generateWorkoutPlan', {
        goal,
        experience_level: experienceLevel,
        duration_weeks: parseInt(duration),
        weak_areas: [],
      });

      if (response.data.success) {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
        // Reset form
        setTimeout(() => {
          setGoal('strength');
          setExperienceLevel('beginner');
          setDuration('4');
          setSuccess(false);
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to generate plan');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-white border border-slate-200">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Generate Personalized Plan
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Create a custom workout plan based on your goals and performance data.
          </p>
        </div>

        {error && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✓ Workout plan generated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal</label>
            <Select value={goal} onValueChange={setGoal} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="aesthetics">Aesthetics</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="confidence">Confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Experience Level</label>
            <Select value={experienceLevel} onValueChange={setExperienceLevel} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Duration (weeks)</label>
            <Select value={duration} onValueChange={setDuration} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 weeks</SelectItem>
                <SelectItem value="4">4 weeks</SelectItem>
                <SelectItem value="6">6 weeks</SelectItem>
                <SelectItem value="8">8 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleGeneratePlan} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Plan'
          )}
        </Button>
      </div>
    </Card>
  );
}