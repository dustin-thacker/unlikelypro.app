import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminCalendar from "./pages/AdminCalendar";
import ClientCalendar from "./pages/ClientCalendar";
import NewProject from "./pages/NewProject";
import VerifyProject from "./pages/VerifyProject";
import ScheduleInspection from "./pages/ScheduleInspection";
import MyProjects from "./pages/MyProjects";
import ProjectDetail from "./pages/ProjectDetail";
import Admin from "./pages/Admin";
import AdminProjectDetail from "@/pages/AdminProjectDetail";
import AdminInvoices from "@/pages/AdminInvoices";
import AdminCreateInvoice from "@/pages/AdminCreateInvoice";
import SchedulerDashboard from "./pages/SchedulerDashboard";
import SchedulerNewProject from "./pages/SchedulerNewProject";
import SchedulerVerifyProject from "./pages/SchedulerVerifyProject";
import SchedulerScheduleInspection from "./pages/SchedulerScheduleInspection";
import SchedulerRFI from "./pages/SchedulerRFI";
import AdminRFIList from "./pages/AdminRFIList";
import SchedulerRFIList from "./pages/SchedulerRFIList";
import FieldTechDashboard from "./pages/FieldTechDashboard";
import FieldTechTaskDetail from "./pages/FieldTechTaskDetail";
import FieldTechTaskDetailMobile from "./pages/FieldTechTaskDetailMobile";
import APDashboard from "./pages/APDashboard";
import APInvoiceDetail from "./pages/APInvoiceDetail";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminPaymentProcessing from "./pages/AdminPaymentProcessing";
import AdminDeliverables from "./pages/AdminDeliverables";
import AdminRFI from "./pages/AdminRFI";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/new-project"} component={NewProject} />
      <Route path={"/verify-project/:id"} component={VerifyProject} />
      <Route path={"/schedule-inspection/:id"} component={ScheduleInspection} />
      <Route path={"/my-projects"} component={MyProjects} />
      <Route path={"/project/:id"} component={ProjectDetail} />
      <Route path={"/admin"} component={Admin} />
      <Route path="/admin/calendar" component={AdminCalendar} />
      <Route path="/admin/invoices" component={AdminInvoices} />
      <Route path="/admin/invoices/new/:projectId" component={AdminCreateInvoice} />
      <Route path="/admin/user-management" component={AdminUserManagement} />
      <Route path="/admin/payment-processing" component={AdminPaymentProcessing} />
      <Route path="/admin/deliverables" component={AdminDeliverables} />
      <Route path="/admin/rfi-old" component={AdminRFI} />
      <Route path="/admin/rfi" component={AdminRFIList} />
      <Route path="/admin/project/:id" component={AdminProjectDetail} />
      <Route path={"/calendar"} component={ClientCalendar} />
      <Route path={"/scheduler/projects"} component={SchedulerDashboard} />
      <Route path={"/scheduler/new-project"} component={SchedulerNewProject} />
      <Route path={"/scheduler/verify/:id"} component={SchedulerVerifyProject} />
      <Route path={"/scheduler/schedule/:id"} component={SchedulerScheduleInspection} />
      <Route path={"/scheduler/rfi-old"} component={SchedulerRFI} />
      <Route path={"/scheduler/rfi"} component={SchedulerRFIList} />         <Route path="/field-tech" component={FieldTechDashboard} />
      <Route path="/field-tech/task/:id" component={FieldTechTaskDetail} />
      <Route path="/field-tech/mobile/task/:id" component={FieldTechTaskDetailMobile} />
      <Route path={"/ap"} component={APDashboard} />
      <Route path={"/ap/invoices/:id"} component={APInvoiceDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
