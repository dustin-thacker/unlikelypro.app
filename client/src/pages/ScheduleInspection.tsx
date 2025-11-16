import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Calendar, Clock } from "lucide-react";

export default function ScheduleInspection() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");

  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");

  const { data: project, isLoading } = trpc.projects.getById.useQuery(
    { projectId },
    { enabled: !isNaN(projectId) && projectId > 0 }
  );
  const createTask = trpc.tasks.create.useMutation();

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select both date and time for the inspection");
      return;
    }

    try {
      const dateTimeString = `${scheduledDate}T${scheduledTime}:00`;
      const scheduledDateTime = new Date(dateTimeString);

      await createTask.mutateAsync({
        projectId,
        taskType: "Foundation Inspection",
        scheduledDate: scheduledDateTime,
        notes: notes || undefined,
      });

      toast.success("Inspection scheduled successfully!");
      setLocation("/my-projects");
    } catch (error) {
      console.error("Error scheduling inspection:", error);
      toast.error("Failed to schedule inspection. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="container max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Schedule Inspection</CardTitle>
            <CardDescription>
              Select your preferred date and time for the inspection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {project && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Project Details</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Client:</strong> {project.clientName}</p>
                  <p><strong>Address:</strong> {project.address}</p>
                  {project.permitNumber && (
                    <p><strong>Permit Number:</strong> {project.permitNumber}</p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSchedule} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Inspection Date *</Label>
                  <div className="relative">
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Inspection Time *</Label>
                  <div className="relative">
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      required
                    />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or requirements for the inspection"
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createTask.isPending}
                  className="flex-1"
                >
                  {createTask.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Schedule Inspection"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(`/verify-project/${projectId}`)}
                >
                  Back
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
