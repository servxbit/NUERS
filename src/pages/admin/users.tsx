import { useState } from "react";
import {
  Users, Plus, Search, MoreHorizontal, Shield,
  UserCheck, UserX, Mail, Key, Edit, Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive" | "suspended";
  lastLogin: string;
  mfaEnabled: boolean;
  permissions: string[];
};

const INITIAL_USERS: AdminUser[] = [
  { id: "1", name: "System Administrator", email: "servxbit@gmail.com", role: "super_admin", department: "IT", status: "active", lastLogin: "Just now", mfaEnabled: true, permissions: ["all"] },
  { id: "2", name: "Juan Dela Cruz", email: "jdelacruz@bir.gov.ph", role: "regulator", department: "Compliance", status: "active", lastLogin: "2 hr ago", mfaEnabled: true, permissions: ["merchants", "filings", "compliance"] },
  { id: "3", name: "Maria Santos", email: "msantos@bir.gov.ph", role: "analyst", department: "Analytics", status: "active", lastLogin: "1 day ago", mfaEnabled: true, permissions: ["analytics", "reports"] },
  { id: "4", name: "Pedro Reyes", email: "preyes@bir.gov.ph", role: "auditor", department: "Audit", status: "active", lastLogin: "3 hr ago", mfaEnabled: false, permissions: ["merchants", "audit", "risk"] },
  { id: "5", name: "Ana Lim", email: "alim@bir.gov.ph", role: "viewer", department: "Legal", status: "inactive", lastLogin: "5 days ago", mfaEnabled: false, permissions: ["view_only"] },
  { id: "6", name: "Carlos Mendoza", email: "cmendoza@bir.gov.ph", role: "analyst", department: "Tax Operations", status: "suspended", lastLogin: "14 days ago", mfaEnabled: true, permissions: ["filings"] },
];

const roleConfig: Record<string, { label: string; color: string }> = {
  super_admin: { label: "Super Admin", color: "bg-primary text-primary-foreground" },
  regulator: { label: "Regulator", color: "bg-destructive/10 text-destructive" },
  analyst: { label: "Analyst", color: "bg-secondary text-secondary-foreground" },
  auditor: { label: "Auditor", color: "bg-warning/10 text-warning-foreground" },
  viewer: { label: "Viewer", color: "bg-muted text-muted-foreground" },
};

const rolePermissions: Record<string, string[]> = {
  regulator: ["merchants", "filings", "compliance"],
  analyst: ["analytics", "reports"],
  auditor: ["merchants", "audit", "risk"],
  viewer: ["view_only"],
};

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // Add user form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newMfa, setNewMfa] = useState(true);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function handleCreateUser() {
    if (!newName || !newEmail || !newRole) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const created: AdminUser = {
      id: Date.now().toString(),
      name: newName,
      email: newEmail,
      department: newDepartment,
      role: newRole,
      status: "active",
      lastLogin: "Never",
      mfaEnabled: newMfa,
      permissions: rolePermissions[newRole] ?? [],
    };
    setUsers((prev) => [created, ...prev]);
    toast.success(`User "${newName}" created successfully.`);
    setNewName("");
    setNewEmail("");
    setNewDepartment("");
    setNewRole("");
    setNewMfa(true);
    setAddOpen(false);
  }

  function handleSuspend(userId: string) {
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u)
    );
    const user = users.find((u) => u.id === userId);
    const next = user?.status === "suspended" ? "reactivated" : "suspended";
    toast.success(`Account ${next}.`);
  }

  function handleResetPassword(user: AdminUser) {
    toast.success(`Password reset email sent to ${user.email}.`);
  }

  function handleSendEmail(user: AdminUser) {
    toast.success(`Email notification sent to ${user.email}.`);
  }

  function handleEditUser(user: AdminUser) {
    setEditUser(user);
  }

  function handleSaveEdit() {
    if (!editUser) return;
    setUsers((prev) => prev.map((u) => u.id === editUser.id ? editUser : u));
    toast.success(`User "${editUser.name}" updated.`);
    setEditUser(null);
  }

  function handleDeleteUser(user: AdminUser) {
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    toast.success(`User "${user.name}" deleted.`);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage government staff access, roles, and permissions</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Users", value: users.length, icon: Users },
          { label: "Active", value: users.filter((u) => u.status === "active").length, icon: UserCheck },
          { label: "MFA Enabled", value: users.filter((u) => u.mfaEnabled).length, icon: Shield },
          { label: "Suspended", value: users.filter((u) => u.status === "suspended").length, icon: UserX },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-0 basis-full sm:min-w-[200px] sm:basis-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="regulator">Regulator</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filtered.map((user) => (
              <div key={user.id} className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{user.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${roleConfig[user.role]?.color}`}>
                      {roleConfig[user.role]?.label}
                    </span>
                    {user.mfaEnabled && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Shield className="h-2.5 w-2.5" /> MFA
                      </Badge>
                    )}
                    {!user.mfaEnabled && (
                      <Badge variant="secondary" className="text-[10px] text-warning">MFA Off</Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                    <span className="text-xs text-muted-foreground">{user.department}</span>
                    <span className="text-xs text-muted-foreground">Last: {user.lastLogin}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={user.status === "active" ? "default" : user.status === "suspended" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {user.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Edit className="mr-2 h-3.5 w-3.5" /> Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                        <Key className="mr-2 h-3.5 w-3.5" /> Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendEmail(user)}>
                        <Mail className="mr-2 h-3.5 w-3.5" /> Send Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleSuspend(user.id)}>
                        <UserX className="mr-2 h-3.5 w-3.5" />
                        {user.status === "suspended" ? "Reactivate Account" : "Suspend Account"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(user)}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Government User</DialogTitle>
            <DialogDescription>Create a new staff account with appropriate role and permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="e.g. Juan Dela Cruz" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Official Email</Label>
              <Input type="email" placeholder="user@bir.gov.ph" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input placeholder="e.g. Compliance Division" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regulator">Regulator</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Require MFA</p>
                <p className="text-xs text-muted-foreground">Enforce two-factor authentication</p>
              </div>
              <Switch checked={newMfa} onCheckedChange={setNewMfa} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user's details and role.</DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={editUser.department} onChange={(e) => setEditUser({ ...editUser, department: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regulator">Regulator</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">MFA Enabled</p>
                </div>
                <Switch checked={editUser.mfaEnabled} onCheckedChange={(v) => setEditUser({ ...editUser, mfaEnabled: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDeleteUser(deleteTarget)}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
