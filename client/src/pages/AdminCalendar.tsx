import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { EventDropArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AdminCalendar() {
  const [, setLocation] = useLocation();
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.listAll.useQuery();
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const updateTask = trpc.tasks.update.useMutation();
  const utils = trpc.useUtils();

  const isLoading = tasksLoading || projectsLoading;

  // Create a map of projectId to project for quick lookup
  const projectMap = new Map(projects?.map(p => [p.id, p]) || []);

  const handleEventDrop = async (info: EventDropArg) => {
    const taskId = parseInt(info.event.id);
    const newDate = info.event.start;
    const projectId = info.event.extendedProps.projectId;

    // Check if dropped on Sunday
    if (newDate && newDate.getDay() === 0) {
      toast.error("Cannot schedule inspections on Sundays");
      info.revert();
      return;
    }

    if (!newDate) {
      info.revert();
      return;
    }

    try {
      await updateTask.mutateAsync({
        taskId: taskId,
        projectId: projectId,
        scheduledDate: newDate.toISOString(),
      });

      await utils.tasks.listAll.invalidate();
      toast.success("Inspection rescheduled successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to reschedule inspection");
      info.revert();
    }
  };

  const handleEventClick = (info: EventClickArg) => {
    const taskId = parseInt(info.event.id);
    const task = tasks?.find((t) => t.id === taskId);
    
    if (task) {
      setLocation(`/admin/project/${task.projectId}`);
    }
  };

  const events = tasks?.map((task) => {
    const project = projectMap.get(task.projectId);
    return {
      id: task.id.toString(),
      title: project?.address || task.title,
      start: task.scheduledDate || undefined,
      backgroundColor: getStatusColor(task.status),
      borderColor: getStatusColor(task.status),
      extendedProps: {
        projectId: task.projectId,
        status: task.status,
        clientName: project?.clientName || '',
        jurisdiction: project?.jurisdiction || '',
        propertyOwnerName: project?.propertyOwnerName || '',
        customerNumber: project?.customerNumber || '',
        address: project?.address || '',
      },
    };
  }) || [];

  function getStatusColor(status: string): string {
    switch (status) {
      case "scheduled":
        return "#9333ea"; // purple
      case "in_progress":
        return "#f97316"; // orange
      case "completed":
        return "#22c55e"; // green
      case "cancelled":
        return "#6b7280"; // gray
      default:
        return "#3b82f6"; // blue
    }
  }

  // Custom event content for tooltips
  const renderEventContent = (eventInfo: EventContentArg) => {
    const { clientName, jurisdiction, propertyOwnerName, customerNumber } = eventInfo.event.extendedProps;
    
    return (
      <div 
        className="fc-event-main-frame"
        title={`Client: ${clientName}\nJurisdiction: ${jurisdiction}\nProperty Owner: ${propertyOwnerName}\nCustomer #: ${customerNumber || 'N/A'}`}
      >
        <div className="fc-event-time">{eventInfo.timeText}</div>
        <div className="fc-event-title">{eventInfo.event.title}</div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inspection Calendar</h1>
          <p className="text-slate-600 mt-1">
            Drag and drop to reschedule inspections. Click an event to view project details.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listUpcoming",
            }}
            views={{
              listUpcoming: {
                type: 'list',
                duration: { weeks: 4 },
                buttonText: 'List'
              }
            }}
            events={events}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="18:00:00"
            allDaySlot={false}
            hiddenDays={[0]} // Hide Sunday
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
              startTime: '07:00',
              endTime: '18:00',
            }}
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
            }}
            selectConstraint="businessHours"
            eventConstraint="businessHours"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
