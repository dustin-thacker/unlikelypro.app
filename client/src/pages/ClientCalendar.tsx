import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { EventClickArg, EventContentArg } from "@fullcalendar/core";
import { useLocation } from "wouter";

export default function ClientCalendar() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.listForUser.useQuery(undefined, {
    enabled: !!user,
  });

  const handleEventClick = (info: EventClickArg) => {
    const projectId = info.event.extendedProps.projectId;
    setLocation(`/project/${projectId}`);
  };

  const isLoading = projectsLoading || tasksLoading;

  // Create a map of projectId to project for quick lookup
  const projectMap = new Map(projects?.map(p => [p.id, p]) || []);

  // Map tasks to calendar events
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="container max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">My Inspection Schedule</h1>
          <p className="text-slate-600 mt-2">
            View your scheduled inspections. Click an event to see project details.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
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
            editable={false}
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
          />
        </div>
      </div>
    </div>
  );
}
