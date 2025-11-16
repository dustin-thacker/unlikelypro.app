import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";

export default function SchedulerScheduleInspection() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");

  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");

  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery(
    { projectId },
    { enabled: !isNaN(projectId) && projectId > 0 && isAuthenticated }
  );

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Inspection scheduled successfully!");
      setLocation("/scheduler/projects");
    },
    onError: (error: any) => {
      toast.error(`Failed to schedule: ${error.message}`);
    },
  });

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select both date and time for the inspection");
      return;
    }

    // Validate day of week (no Sundays)
    const selectedDate = new Date(`${scheduledDate}T${scheduledTime}`);
    if (selectedDate.getDay() === 0) {
      toast.error("Inspections cannot be scheduled on Sundays");
      return;
    }

    // Validate time range (7am - 6pm)
    const hour = parseInt(scheduledTime.split(':')[0]);
    if (hour < 7 || hour >= 18) {
      toast.error("Inspections must be scheduled between 7:00 AM and 6:00 PM");
      return;
    }

    const dateTimeString = `${scheduledDate}T${scheduledTime}:00`;
    const scheduledDateTime = new Date(dateTimeString);

    createTask.mutate({
      projectId,
      taskType: "Foundation Inspection",
      scheduledDate: scheduledDateTime,
      notes: notes || undefined,
    });
  };

  if (authLoading || projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "client_scheduler") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be logged in as a client scheduler to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isNaN(projectId) || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>The requested project does not exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Schedule Inspection</CardTitle>
          <CardDescription>
            Select a preferred date and time for the on-site inspection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Project Summary */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Project Details</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Property Owner:</strong> {project.propertyOwnerName}</p>
              <p><strong>Address:</strong> {project.address}</p>
              {project.permitNumber && <p><strong>Permit:</strong> {project.permitNumber}</p>}
              {project.customerNumber && <p><strong>Customer #:</strong> {project.customerNumber}</p>}
            </div>
          </div>

          <form onSubmit={handleSchedule} className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="scheduledDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Preferred Inspection Date *
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={today}
                required
              />
              <p className="text-xs text-muted-foreground">
                Note: Inspections are not available on Sundays
              </p>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label htmlFor="scheduledTime" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Preferred Inspection Time *
              </Label>
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min="07:00"
                max="18:00"
                required
              />
              <p className="text-xs text-muted-foreground">
                Working hours: Monday - Saturday, 7:00 AM - 6:00 PM
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or site access information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> This is a scheduling request. The inspection time will be confirmed by our office staff based on availability. You will receive notification once the schedule is confirmed.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/scheduler/projects")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTask.isPending}
              >
                {createTask.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Schedule Inspection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
