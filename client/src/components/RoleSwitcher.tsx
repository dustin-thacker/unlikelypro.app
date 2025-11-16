import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, Shield, Calendar, DollarSign, Wrench } from "lucide-react";

const TEST_USERS = [
  {
    openId: "test-admin-001",
    name: "Test Admin",
    email: "admin@test.com",
    role: "admin",
    branch: null,
    icon: Shield,
    color: "bg-purple-500",
    description: "Full system access, manage all projects and users"
  },
  {
    openId: "test-scheduler-manassas",
    name: "Sarah Johnson (Scheduler)",
    email: "scheduler.manassas@test.com",
    role: "client_scheduler",
    branch: "Manassas - JES Foundation Repair",
    icon: Calendar,
    color: "bg-blue-500",
    description: "Submit projects, manage schedules for Manassas branch"
  },
  {
    openId: "test-scheduler-baltimore",
    name: "Mike Chen (Scheduler)",
    email: "scheduler.baltimore@test.com",
    role: "client_scheduler",
    branch: "Baltimore - JES Foundation Repair",
    icon: Calendar,
    color: "bg-blue-500",
    description: "Submit projects, manage schedules for Baltimore branch"
  },
  {
    openId: "test-ap-manassas",
    name: "Linda Martinez (AP Manager)",
    email: "ap.manassas@test.com",
    role: "client_ap",
    branch: "Manassas - JES Foundation Repair",
    icon: DollarSign,
    color: "bg-green-500",
    description: "View invoices and financial data for Manassas branch"
  },
  {
    openId: "test-fieldtech-001",
    name: "James Wilson (Field Tech)",
    email: "fieldtech@test.com",
    role: "field_tech",
    branch: null,
    icon: Wrench,
    color: "bg-orange-500",
    description: "Mobile interface for on-site inspections"
  }
];

export default function RoleSwitcher() {
  const [open, setOpen] = useState(false);

  const switchRole = async (openId: string) => {
    try {
      // In a real implementation, this would call a backend endpoint
      // For now, we'll just reload with a query parameter
      const url = new URL(window.location.href);
      url.searchParams.set('test_user', openId);
      window.location.href = url.toString();
    } catch (error) {
      console.error("Failed to switch role:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCog className="w-4 h-4 mr-2" />
          Switch Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test User Roles</DialogTitle>
          <DialogDescription>
            Switch between different user roles to test workflows and permissions
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {TEST_USERS.map((user) => {
            const Icon = user.icon;
            return (
              <Card
                key={user.openId}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  switchRole(user.openId);
                  setOpen(false);
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`${user.color} p-3 rounded-lg text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {user.email}
                      </p>
                      <Badge variant="secondary" className="mb-2">
                        {user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {user.branch && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Branch: {user.branch}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {user.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is a testing feature. In production, users would log in with their own credentials through the OAuth system.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
