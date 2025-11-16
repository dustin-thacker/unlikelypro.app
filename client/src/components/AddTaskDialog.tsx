import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  onSuccess?: () => void;
}

export function AddTaskDialog({ open, onOpenChange, projectId, onSuccess }: AddTaskDialogProps) {
  const [taskType, setTaskType] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();

  // Fetch field technicians for assignment dropdown
  const { data: fieldTechs } = trpc.users.list.useQuery();

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Task created successfully");
      utils.tasks.listByProject.invalidate({ projectId });
      utils.projects.getById.invalidate({ projectId });
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTaskType("");
    setScheduledDate("");
    setScheduledTime("");
    setAssignedTo("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskType || !scheduledDate || !scheduledTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

    createTaskMutation.mutate({
      projectId,
      taskType,
      scheduledDate: scheduledDateTime,
      assignedToId: assignedTo ? parseInt(assignedTo) : undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Inspection Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskType">Task Type *</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger id="taskType">
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Foundation Inspection">Foundation Inspection</SelectItem>
                <SelectItem value="Footing Inspection">Footing Inspection</SelectItem>
                <SelectItem value="Pier Inspection">Pier Inspection</SelectItem>
                <SelectItem value="Final Inspection">Final Inspection</SelectItem>
                <SelectItem value="Re-Inspection">Re-Inspection</SelectItem>
                <SelectItem value="Progress Inspection">Progress Inspection</SelectItem>
                <SelectItem value="Site Visit">Site Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date *</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Scheduled Time *</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign to Field Technician</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Select field technician (optional)" />
              </SelectTrigger>
              <SelectContent>
                {fieldTechs?.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id.toString()}>
                    {tech.name || tech.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
